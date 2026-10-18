import { F_SKY } from './tilemap.js';
import { TEXELS_PER_UNIT } from '../config.js';

/** Hangings further than this from the camera (tiles) hold still. */
export const SLEEP_RANGE = 40;
/** Points and links in a level at most (all its hangings together). */
export const POINT_CAP = 4096;
export const LINK_CAP = POINT_CAP * 4;
/** A rope's segments, and a cloth's columns and rows of cells, at most. */
export const MAX_SEGMENTS = 32;
export const MAX_CELLS = 16;
/** Seconds of ticks run at load, so hangings start at rest. */
const SETTLE = 2;
/** Each point's light is read again every this many steps (staggered). */
const LIGHT_EVERY = 4;
/**
 * A hanging steps every this many ticks (by that much time), half of them on
 * even ticks and half on odd: 30 steps a second is plenty for a sway of a
 * few centimetres, and it halves the cost.
 */
const STEP_EVERY = 2;

const FULL = `is one too many: a level's hangings have at most ${POINT_CAP} points between them`;

export const HANGING_SHAPES = ['rope', 'cloth'];
export const HANGING_PINS = ['top', 'corners'];

/** A hanging type (a defineHanging result) with its defaults, its colour as a palette index. */
function hangingType(def, ramps) {
  const [name, t = 0.5] = def.color ?? ['gray', 0.3];
  const r = ramps[name] ?? [0, 1];
  return {
    id: def.id,
    shape: def.shape ?? 'rope',
    color: r[0] + Math.round(Math.min(1, Math.max(0, t)) * (r[1] - 1)),
    /** A rope's thickness (units); it's never drawn thinner than a pixel. */
    width: def.width ?? 0.04,
    /** Points about this far apart (units): a cloth's grid is finer, for its folds. */
    spacing: def.spacing ?? (def.shape === 'cloth' ? 0.4 : 0.5),
    /** A cloth's folds: every other column of points this far forward or back (units), so the light picks out pleats. */
    folds: def.folds ?? 0.08,
    gravity: def.gravity ?? 20,
    /** How fast it takes up the air's speed (per second). */
    drag: def.drag ?? 2,
    /** How much of the level's wind carries it, and the breeze's speed (units per second). */
    wind: def.wind ?? 1,
    breeze: def.breeze ?? 0.6,
    /** Passes over the links each tick: more is stiffer (less stretch). */
    stiffness: def.stiffness ?? 2,
    /** The share of its speed it keeps each sixtieth of a second. */
    damping: def.damping ?? 0.98,
    /** A cloth's texture (its tears and holes are transparent texels), or null for plain `color`. */
    texture: def.texture ?? null,
    fullbright: !!def.fullbright,
  };
}

/**
 * Hangings: ropes and cloths that hang from fixed points and move in the
 * air. Every point of every hanging lives in one set of typed arrays (Verlet:
 * position and last position), and links hold neighbours at their rest
 * lengths. Cosmetic only: no RNG of the world's, and nothing in gameplay
 * reads them. A cloth carries a model (gfx/model.js's shape) whose vertices
 * follow its points, for the model drawer.
 */
export class Hangings {
  /**
   * @param {import('./tilemap.js').TileMap} map
   * @param {any[]} defs hanging types (defineHanging results)
   * @param {any[]} specs the level's `hangings`
   * @param {Record<string, [number, number]>} [ramps] the palette's ramps
   * @param {number[]} [wind] the level's wind (units per second)
   * @param {(id:string) => ({slot:number, w:number, h:number}|null)} [texture] a texture's slot and
   *   size by id (none without assets: cloths are then plain colour)
   */
  constructor(map, defs = [], specs = [], ramps = {}, wind = null, texture = () => null) {
    this.map = map;
    this.texture = texture;
    this.types = new Map(defs.map((d) => [d.id, hangingType(d, ramps)]));
    this.wind = wind ? [...wind] : [0, 0, 0];
    /** Seconds of its own clock (the breeze's), and ticks run. */
    this.time = 0;
    this.ticks = 0;
    const n = POINT_CAP;
    this.n = 0;
    this.x = new Float64Array(n);
    this.y = new Float64Array(n);
    this.z = new Float64Array(n);
    this.ox = new Float64Array(n);
    this.oy = new Float64Array(n);
    this.oz = new Float64Array(n);
    /**
     * Each point's place in the breeze's waves (from where it was made): the
     * cosine and sine of its phase in each of the three, so a tick needs only
     * three sines a hanging (sin(a + s) = sin a cos s + cos a sin s).
     */
    this.wave = new Float64Array(n * 6);
    /** 0 for a pinned point (it never moves), 1 otherwise. */
    this.free = new Uint8Array(n);
    /** The floor under each point where it was made: it never sinks below. */
    this.floor = new Float32Array(n);
    this.light = new Uint8Array(n);
    this.outdoor = new Uint8Array(n);
    this.nl = 0;
    const nl = LINK_CAP;
    this.la = new Int32Array(nl);
    this.lb = new Int32Array(nl);
    this.rest = new Float64Array(nl);
    /** The rest lengths squared. */
    this.rest2 = new Float64Array(nl);
    /**
     * Tethers: each free point is never further from up to two pinned points
     * (-1 for none) than it was at rest. A long chain would otherwise stretch
     * under its weight (the links' passes can't carry the pull from the pins
     * all along it); swinging round its pins keeps these distances, so it still
     * sways.
     */
    this.ta = new Int32Array(n).fill(-1);
    this.tb = new Int32Array(n).fill(-1);
    this.da = new Float64Array(n);
    this.db = new Float64Array(n);
    /** Each end's share of the pull: 1 each, 2 when the other end is pinned, 0 for a pinned end. */
    this.wa = new Float64Array(nl);
    this.wc = new Float64Array(nl);
    /** @type {any[]} one per hanging: its type, its points and links, and (a cloth) its model */
    this.list = [];
    /** The cloths' model holders, for the model drawer. */
    this.cloths = [];
    /** Problems with the specs, for the level's build errors. */
    this.errors = [];
    specs.forEach((s, k) => {
      const e = this._add(s, k);
      if (e) this.errors.push(`Hanging ${k + 1}${s?.type ? ` ("${s.type}")` : ''} ${e}`);
    });
    for (let i = 0; i < this.n; i++) this._light(i);
    this.settle();
  }

  /** Run SETTLE seconds of ticks with every hanging awake, so they start at rest. */
  settle() {
    const dt = 1 / 60;
    for (let k = 0; k < SETTLE * 60; k++) this.update(dt, NaN, NaN);
  }

  _point(x, y, z, free) {
    const i = this.n++;
    this.x[i] = this.ox[i] = x;
    this.y[i] = this.oy[i] = y;
    this.z[i] = this.oz[i] = z;
    this.free[i] = free ? 1 : 0;
    // The breeze's waves travel along the street: each point's phase is by where it is.
    const s = x * 0.45 + y * 0.3;
    const w = this.wave;
    w[i * 6] = Math.cos(s);
    w[i * 6 + 1] = Math.sin(s);
    w[i * 6 + 2] = Math.cos(s * 2.1);
    w[i * 6 + 3] = Math.sin(s * 2.1);
    w[i * 6 + 4] = Math.cos(s * 0.8);
    w[i * 6 + 5] = -Math.sin(s * 0.8);
    const map = this.map;
    // (A point made inside a block, against a wall, has no floor under it.)
    const f = map.inBounds(x | 0, y | 0) ? map.floorAt(x, y, 0, z) : Infinity;
    this.floor[i] = f <= z ? f + 0.02 : -Infinity;
    return i;
  }

  /** Tether point p to pinned points a and b (b may be -1) at its distances from them now. */
  _tether(p, a, b) {
    const d = (q) => Math.hypot(this.x[p] - this.x[q], this.y[p] - this.y[q], this.z[p] - this.z[q]);
    this.ta[p] = a;
    this.da[p] = d(a);
    this.tb[p] = b;
    if (b >= 0) this.db[p] = d(b);
  }

  _link(a, b) {
    const k = this.nl++;
    this.la[k] = a;
    this.lb[k] = b;
    this.rest[k] = Math.hypot(this.x[b] - this.x[a], this.y[b] - this.y[a], this.z[b] - this.z[a]);
    this.rest2[k] = this.rest[k] * this.rest[k];
    const fa = this.free[a];
    const fb = this.free[b];
    this.wa[k] = fa ? (fb ? 1 : 2) : 0;
    this.wc[k] = fb ? (fa ? 1 : 2) : 0;
  }

  /** Make one hanging from its spec; returns an error, or null. */
  _add(s, k) {
    const t = this.types.get(s?.type);
    if (!t) return 'has an unknown type';
    const from = s.from;
    if (!isPoint(from)) return 'needs "from": [x, y, z]';
    const to = s.to ?? null;
    if (to !== null && !isPoint(to)) return '"to" must be [x, y, z]';
    const p0 = this.n;
    const l0 = this.nl;
    const h = { type: t, shape: t.shape, p0, np: 0, l0, nl: 0, cx: 0, cy: 0, cz: 0, radius: 0, phase: k * 2.399 };
    if (t.shape === 'rope') {
      if (to) {
        // Strung between two points, sagging `sag` in the middle (a parabola, near enough a catenary at small sags).
        const sag = s.sag ?? 0.3;
        const span = Math.hypot(to[0] - from[0], to[1] - from[1], to[2] - from[2]);
        const length = span + (span > 0 ? (8 * sag * sag) / (3 * span) : sag * 2);
        const segs = clampInt(Math.ceil(length / t.spacing), 2, MAX_SEGMENTS);
        if (this.n + segs + 1 > POINT_CAP || this.nl + segs > LINK_CAP) return FULL;
        for (let j = 0; j <= segs; j++) {
          const q = j / segs;
          const p = this._point(lerp(from[0], to[0], q), lerp(from[1], to[1], q), lerp(from[2], to[2], q) - 4 * sag * q * (1 - q), j > 0 && j < segs);
          if (j) this._link(p - 1, p);
        }
        // The rest lengths are the curve's, so it keeps its sag (the curve is
        // a little shorter than the arc: stretch them to the arc's length).
        let sum = 0;
        for (let L = l0; L < this.nl; L++) sum += this.rest[L];
        for (let L = l0; L < this.nl; L++) {
          this.rest[L] *= length / sum;
          this.rest2[L] = this.rest[L] * this.rest[L];
        }
        for (let p = p0 + 1; p < this.n - 1; p++) this._tether(p, p0, this.n - 1);
      } else {
        const length = s.length ?? 1;
        if (!(length > 0)) return '"length" must be above 0';
        const segs = clampInt(Math.ceil(length / t.spacing), 1, MAX_SEGMENTS);
        if (this.n + segs + 1 > POINT_CAP || this.nl + segs > LINK_CAP) return FULL;
        for (let j = 0; j <= segs; j++) {
          const p = this._point(from[0], from[1], from[2] - (length * j) / segs, j > 0);
          if (j) this._link(p - 1, p);
        }
        for (let p = p0 + 1; p < this.n; p++) this._tether(p, p0, -1);
      }
    } else {
      if (!to) return 'needs "to": [x, y, z] (a cloth hangs from the line between "from" and "to")';
      const length = s.length ?? 1;
      if (!(length > 0)) return '"length" must be above 0';
      const width = Math.hypot(to[0] - from[0], to[1] - from[1], to[2] - from[2]);
      const cols = clampInt(Math.round(width / t.spacing), 1, MAX_CELLS);
      const rows = clampInt(Math.round(length / t.spacing), 1, MAX_CELLS);
      const pw = cols + 1;
      if (this.n + pw * (rows + 1) > POINT_CAP || this.nl + cols * (rows + 1) + rows * pw + 2 * cols * rows > LINK_CAP) return FULL;
      const corners = s.pin === 'corners';
      // Across the top edge, flat: the way the folds stand out.
      const fl = Math.hypot(to[0] - from[0], to[1] - from[1]) || 1;
      const fx = -(to[1] - from[1]) / fl;
      const fy = (to[0] - from[0]) / fl;
      for (let j = 0; j <= rows; j++) {
        for (let i = 0; i <= cols; i++) {
          const q = i / cols;
          const pinned = j === 0 && (!corners || i === 0 || i === cols);
          const fold = i % 2 ? t.folds : -t.folds;
          const p = this._point(lerp(from[0], to[0], q) + fx * fold, lerp(from[1], to[1], q) + fy * fold, lerp(from[2], to[2], q) - (length * j) / rows, !pinned);
          if (i) this._link(p - 1, p);
          if (j) this._link(p - pw, p);
          // Across each cell both ways too, so it holds together as a sheet (with
          // only the straight links each column would swing like a string).
          if (i && j) {
            this._link(p - pw - 1, p);
            this._link(p - pw, p - 1);
          }
        }
      }
      // Tethered to the top of its column, or to both top corners.
      for (let j = 1; j <= rows; j++) {
        for (let i = 0; i <= cols; i++) {
          if (corners) this._tether(p0 + j * pw + i, p0, p0 + cols);
          else this._tether(p0 + j * pw + i, p0 + i, -1);
        }
      }
      if (corners) for (let i = 1; i < cols; i++) this._tether(p0 + i, p0, p0 + cols);
      h.model = {
        verts: new Float32Array(pw * (rows + 1) * 3),
        radius: 0,
        faces: [],
      };
      // One quad a cell (half the faces of triangles: the model drawer's cost
      // is mostly per face here). Cells are small and only gently bent, so
      // they stay convex on screen, as the drawer needs.
      // The texture, at the world's scale (32 texels a tile): its bottom row
      // on the hem, so the tears are there; across, it repeats. A cloth longer
      // than the texture stretches it to fit.
      const tex = t.texture ? this.texture(t.texture) : null;
      const tw = tex ? tex.w / TEXELS_PER_UNIT : 1;
      const th = tex ? tex.h / TEXELS_PER_UNIT : 1;
      const uAt = (i) => (width * i) / cols / tw;
      const vAt = (j) => Math.min(0.9999, length <= th ? (th - length + (length * j) / rows) / th : j / rows);
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const a = j * pw + i;
          const uv = tex ? Float32Array.of(uAt(i), vAt(j), uAt(i), vAt(j + 1), uAt(i + 1), vAt(j + 1), uAt(i + 1), vAt(j)) : null;
          h.model.faces.push({ v: Int32Array.of(a, a + pw, a + pw + 1, a + 1), color: tex ? -1 : t.color, slot: tex ? tex.slot : -1, uv, glow: t.fullbright, twoSided: true, nx: 0, ny: 0, nz: 1 });
        }
      }
      // The model drawer's view of it: a thing at its centre.
      h.thing = { x: 0, y: 0, z: 0, angle: 0, model: h.model };
      this.cloths.push(h.thing);
    }
    h.np = this.n - p0;
    h.nl = this.nl - l0;
    // Its centre and reach (with room to swing), for culling and sleep.
    const xs = this.x.subarray(p0, this.n);
    const ys = this.y.subarray(p0, this.n);
    const zs = this.z.subarray(p0, this.n);
    const [x0, x1] = [Math.min(...xs), Math.max(...xs)];
    const [y0, y1] = [Math.min(...ys), Math.max(...ys)];
    const [z0, z1] = [Math.min(...zs), Math.max(...zs)];
    h.cx = (x0 + x1) / 2;
    h.cy = (y0 + y1) / 2;
    h.cz = (z0 + z1) / 2;
    h.radius = Math.hypot(x1 - x0, y1 - y0) / 2 + (z1 - z0);
    if (h.model) {
      h.model.radius = h.radius;
      h.thing.x = h.cx;
      h.thing.y = h.cy;
      // (The model drawer reads its light half a unit above its z.)
      h.thing.z = h.cz - 0.5;
      this._shape(h);
    }
    this.list.push(h);
    return null;
  }

  /** Read point i's light (and whether it's under the sky) from the light map. */
  _light(i) {
    const map = this.map;
    const tx = this.x[i] | 0;
    const ty = this.y[i] | 0;
    if (!map.inBounds(tx, ty)) return;
    const tile = ty * map.w + tx;
    this.outdoor[i] = map.flags[tile] & F_SKY ? 1 : 0;
    this.light[i] = map.lightmap ? Math.min(255, map.lightmap.sample(this.x[i], this.y[i], map.storeyAt(tile, this.z[i]))) : 160;
  }

  /**
   * One step of dt seconds for the hangings within SLEEP_RANGE of (cx, cy)
   * (all of them when cx is NaN).
   */
  update(dt, cx, cy) {
    const { x, y, z, ox, oy, oz, free, floor, la, lb, rest2, wa, wc, ta, tb, da, db, wave } = this;
    const T = (this.time += dt);
    const tick = this.ticks++;
    const [wx, wy, wz] = this.wind;
    const all = Number.isNaN(cx);
    dt *= STEP_EVERY;
    const dt2 = dt * dt;
    for (let n = 0; n < this.list.length; n++) {
      if ((tick + n) % STEP_EVERY) continue;
      const h = this.list[n];
      if (!all && Math.abs(h.cx - cx) > SLEEP_RANGE + h.radius) continue;
      if (!all && Math.abs(h.cy - cy) > SLEEP_RANGE + h.radius) continue;
      const t = h.type;
      const k = t.drag * dt;
      const keep = Math.pow(t.damping, dt * 60);
      const g = t.gravity * dt2;
      const b = t.breeze;
      const ph = h.phase;
      // The breeze: two slow waves across and one along, travelling down the
      // street, so neighbouring points move a little differently and the
      // cloth ripples. Each point's phase was set where it was made.
      const a1 = T * 0.9 + ph;
      const a2 = T * 2.3 + ph * 1.7;
      const a3 = T * 0.7 + ph * 0.6;
      const s1 = b * Math.sin(a1);
      const c1 = b * Math.cos(a1);
      const s2 = 0.5 * b * Math.sin(a2);
      const c2 = 0.5 * b * Math.cos(a2);
      const s3 = 0.7 * b * Math.sin(a3);
      const c3 = 0.7 * b * Math.cos(a3);
      const ax = wx * t.wind;
      const ay = wy * t.wind;
      const az = wz * t.wind;
      const end = h.p0 + h.np;
      for (let i = h.p0; i < end; i++) {
        if (!free[i]) continue;
        const o = i * 6;
        const bx = ax + s1 * wave[o] + c1 * wave[o + 1] + s2 * wave[o + 2] + c2 * wave[o + 3];
        const by = ay + s3 * wave[o + 4] + c3 * wave[o + 5];
        // Last tick's step, pulled toward the air's step, plus gravity.
        let dx = x[i] - ox[i];
        let dy = y[i] - oy[i];
        let dz = z[i] - oz[i];
        dx = (dx + (bx * dt - dx) * k) * keep;
        dy = (dy + (by * dt - dy) * k) * keep;
        dz = (dz + (az * dt - dz) * k) * keep - g;
        ox[i] = x[i];
        oy[i] = y[i];
        oz[i] = z[i];
        x[i] += dx;
        y[i] += dy;
        z[i] += dz;
      }
      // Pull the links back to their lengths, a point's share by whether the
      // other end is pinned. Links are always near their length, so the
      // square root is approximated (Jakobsen's: (d - r) / d is about
      // (d^2 - r^2) / (d^2 + r^2) there), which halves the cost.
      const lEnd = h.l0 + h.nl;
      for (let pass = 0; pass < t.stiffness; pass++) {
        // Forward, then back: a long chain settles in far fewer passes.
        const back = pass & 1;
        for (let m = h.l0; m < lEnd; m++) {
          const L = back ? lEnd - 1 - (m - h.l0) : m;
          const a = la[L];
          const c = lb[L];
          const ex = x[c] - x[a];
          const ey = y[c] - y[a];
          const ez = z[c] - z[a];
          const rr = rest2[L];
          const q = 0.5 - rr / (ex * ex + ey * ey + ez * ez + rr);
          // (No branches: a pinned end's share is 0.)
          const qa = q * wa[L];
          const qc = q * wc[L];
          x[a] += ex * qa;
          y[a] += ey * qa;
          z[a] += ez * qa;
          x[c] -= ex * qc;
          y[c] -= ey * qc;
          z[c] -= ez * qc;
        }
      }
      for (let i = h.p0; i < end; i++) {
        if (!free[i]) continue;
        if (tb[i] < 0) tether(x, y, z, i, ta[i], da[i]);
        else tether2(x, y, z, i, ta[i], da[i], tb[i], db[i]);
        if (z[i] < floor[i]) z[i] = oz[i] = floor[i];
        if (((((tick / STEP_EVERY) | 0) + i) & (LIGHT_EVERY - 1)) === 0) this._light(i);
      }
      if (h.model) this._shape(h);
    }
  }

  /** Copy a cloth's points into its model (round its centre) and face each cell (by its diagonals). */
  _shape(h) {
    const { x, y, z } = this;
    const v = h.model.verts;
    const tx = h.thing.x;
    const ty = h.thing.y;
    const tz = h.thing.z;
    for (let i = 0, p = h.p0; i < h.np; i++, p++) {
      v[i * 3] = x[p] - tx;
      v[i * 3 + 1] = y[p] - ty;
      v[i * 3 + 2] = z[p] - tz;
    }
    for (const f of h.model.faces) {
      const a = f.v[0] * 3;
      const b = f.v[1] * 3;
      const c = f.v[2] * 3;
      const d = f.v[3] * 3;
      // The cross of the diagonals: the normal of a cell that's a little bent.
      const ux = v[c] - v[a];
      const uy = v[c + 1] - v[a + 1];
      const uz = v[c + 2] - v[a + 2];
      const wx = v[d] - v[b];
      const wy = v[d + 1] - v[b + 1];
      const wz = v[d + 2] - v[b + 2];
      const nx = uy * wz - uz * wy;
      const ny = uz * wx - ux * wz;
      const nz = ux * wy - uy * wx;
      const l = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
      f.nx = nx / l;
      f.ny = ny / l;
      f.nz = nz / l;
    }
  }
}

/** Pull point i back toward pinned point p if it's further than `max` from it. */
function tether(x, y, z, i, p, max) {
  const ex = x[i] - x[p];
  const ey = y[i] - y[p];
  const ez = z[i] - z[p];
  const d2 = ex * ex + ey * ey + ez * ez;
  if (d2 <= max * max) return;
  const k = max / Math.sqrt(d2);
  x[i] = x[p] + ex * k;
  y[i] = y[p] + ey * k;
  z[i] = z[p] + ez * k;
}

/** Whether point i is within `max` of point p (allowing for rounding). */
function within(x, y, z, i, p, max) {
  const ex = x[i] - x[p];
  const ey = y[i] - y[p];
  const ez = z[i] - z[p];
  return ex * ex + ey * ey + ez * ez <= max * max * 1.000001;
}

/**
 * Keep point i within `ma` of pinned point a and `mb` of pinned point b.
 * Pulling it toward one can take it too far from the other, so when neither
 * pull alone will do, it goes to the nearest place on the circle where the
 * two spheres meet (where it was at rest, or swung round the line between
 * the pins).
 */
function tether2(x, y, z, i, a, ma, b, mb) {
  const px = x[i];
  const py = y[i];
  const pz = z[i];
  const okA = within(x, y, z, i, a, ma);
  const okB = within(x, y, z, i, b, mb);
  if (okA && okB) return;
  if (!okA) {
    tether(x, y, z, i, a, ma);
    if (within(x, y, z, i, b, mb)) return;
    x[i] = px;
    y[i] = py;
    z[i] = pz;
  }
  if (!okB) {
    tether(x, y, z, i, b, mb);
    if (within(x, y, z, i, a, ma)) return;
  }
  // The circle: centred on the line from a to b, s along it, radius r.
  let nx = x[b] - x[a];
  let ny = y[b] - y[a];
  let nz = z[b] - z[a];
  const l = Math.sqrt(nx * nx + ny * ny + nz * nz);
  if (l < 1e-9) return;
  nx /= l;
  ny /= l;
  nz /= l;
  const s = (ma * ma - mb * mb + l * l) / (2 * l);
  const r2 = ma * ma - s * s;
  const r = r2 > 0 ? Math.sqrt(r2) : 0;
  const cx = x[a] + nx * s;
  const cy = y[a] + ny * s;
  const cz = z[a] + nz * s;
  let vx = px - cx;
  let vy = py - cy;
  let vz = pz - cz;
  const along = vx * nx + vy * ny + vz * nz;
  vx -= nx * along;
  vy -= ny * along;
  vz -= nz * along;
  const v = Math.sqrt(vx * vx + vy * vy + vz * vz);
  const k = v > 1e-9 ? r / v : 0;
  x[i] = cx + vx * k;
  y[i] = cy + vy * k;
  z[i] = cz + vz * k;
}

function isPoint(p) {
  return Array.isArray(p) && p.length === 3 && p.every((v) => typeof v === 'number' && Number.isFinite(v));
}

function lerp(a, b, q) {
  return a + (b - a) * q;
}

function clampInt(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}
