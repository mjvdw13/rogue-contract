import { F_SKY, F_SOLID, F_SLAB } from './tilemap.js';

/** A lee runs this many times as far downwind as what makes it stands over the floor, */
const LEE = 3;
/** out to this many tiles at most. */
const LEE_MAX = 32;

/**
 * Weather: particles of one or more types (layers) kept alive in a square
 * round the camera, `range` tiles each way, only in tiles under the sky.
 * One the camera leaves behind comes round to the far side of the square
 * (it wraps), so moving doesn't empty the air ahead; ones that die (of age,
 * or on the floor) are made again at a random spot in the square.
 * Cosmetic: the particles' own RNG.
 *
 * With `gusts`, the wind comes and goes on a clock of its own: a lull for
 * `every` seconds (a range), then a gust rising over `rise` seconds,
 * holding `hold`, dying over `fall`. `gust` (0 to 1) is how strong it is
 * now: the wind is `strength` times as strong in a full gust, each layer
 * keeps its `calm` share of its count in a lull and all of it in a full
 * gust, and the haze and the sky follow it (World, the renderer).
 *
 * A layer with `shelter` (units) isn't made where the wind is kept off: in a
 * tile with something upwind standing more than that above its floor, and
 * near enough for its lee to reach: LEE times as far as it stands over the
 * floor, LEE_MAX tiles at most (a pit's floor, a trench, behind a wall).
 * What blows over such a tile at the height it was made keeps going: sand
 * streaming over a pit's mouth, seen from below.
 */
export class Weather {
  /**
   * @param {import('./particles.js').Particles} particles
   * @param {import('./tilemap.js').TileMap} map
   * @param {object|object[]} def one layer `{ type, count, range?, z?, drift?, calm?, shelter?, wind?, gusts? }`, or a list
   */
  constructor(particles, map, def) {
    this.ps = particles;
    this.map = map;
    const list = [].concat(def);
    this.layers = list.map((d) => ({
      ti: particles.typeIndex(d.type),
      count: d.count,
      /** Share of `count` in the air in a lull (all of it in a full gust). */
      calm: d.calm ?? 1,
      range: d.range ?? 10,
      /** Heights above the floor where they're made. */
      z: d.z ?? [0.05, 2.5],
      /** Random speed each is made with: across, and up or down. */
      drift: d.drift ?? [0.3, 0.1],
      /** Not made where the wind is kept off by more than this (see above). */
      shelter: d.shelter ?? null,
      sheltered: null,
      filled: false,
    }));
    /** The level's wind (units per second), which carries every particle type with `wind`. */
    this.wind = list.find((d) => d.wind)?.wind ?? null;
    if (this.wind) particles.wind = [...this.wind];
    const g = list.find((d) => d.gusts)?.gusts;
    this.gusts = g ? { every: g.every ?? [6, 14], hold: g.hold ?? [2, 5], rise: g.rise ?? 1.5, fall: g.fall ?? 2, strength: g.strength ?? 2.5 } : null;
    /** How strong the gust is now, 0 (a lull) to 1. */
    this.gust = 0;
    this._phase = 'lull';
    this._left = this.gusts ? this._range(this.gusts.every) : Infinity;
    this._phaseT = 0;
  }

  /** Whether every layer has filled its square (once, at the level's start). */
  get filled() {
    return this.layers.every((l) => l.filled);
  }

  set filled(v) {
    for (const l of this.layers) l.filled = v;
  }

  _range([a, b]) {
    return a + (b - a) * this.ps.rng.next();
  }

  /** Hold the gust at `g` (0 to 1) from now on, the wind with it: for snapshots and tests. */
  hold(g) {
    this.gusts ??= { every: [6, 14], hold: [2, 5], rise: 1.5, fall: 2, strength: 2.5 };
    this._phase = 'held';
    this._left = Infinity;
    this.gust = g;
    if (this.wind) {
      const k = 1 + (this.gusts.strength - 1) * g;
      for (let i = 0; i < 3; i++) this.ps.wind[i] = this.wind[i] * k;
    }
  }

  /** Move the gusts' clock on `dt` seconds, and the wind with it. */
  _blow(dt) {
    const g = this.gusts;
    if (!g || !(dt > 0) || this._phase === 'held') return;
    this._left -= dt;
    this._phaseT += dt;
    while (this._left <= 0) {
      const next = { lull: 'rise', rise: 'hold', hold: 'fall', fall: 'lull' }[this._phase];
      this._phase = next;
      this._phaseT = -this._left;
      this._left += next === 'lull' ? this._range(g.every) : next === 'rise' ? g.rise : next === 'hold' ? this._range(g.hold) : g.fall;
    }
    const t = this._phase === 'rise' ? this._phaseT / g.rise : this._phase === 'fall' ? 1 - this._phaseT / g.fall : this._phase === 'hold' ? 1 : 0;
    const s = Math.max(0, Math.min(1, t));
    this.gust = s * s * (3 - 2 * s);
    if (this.wind) {
      const k = 1 + (g.strength - 1) * this.gust;
      for (let i = 0; i < 3; i++) this.ps.wind[i] = this.wind[i] * k;
    }
  }

  /** Fill a layer's square round (cx, cy) at once, the particles part-way through their lives (the level's start, or a jump). */
  fill(cx, cy) {
    for (const l of this.layers) this._fill(l, cx, cy);
  }

  _fill(l, cx, cy) {
    const ps = this.ps;
    for (let i = ps.n - 1; i >= 0; i--) if (ps.type[i] === l.ti) ps.remove(i);
    const want = this._want(l);
    let tries = want * 4;
    while (this._live(l) < want && tries-- > 0) {
      const i = this._make(l, cx, cy);
      if (i >= 0) ps.age[i] = ps.life[i] * ps.rng.next();
    }
    l.filled = true;
  }

  /** How many of a layer should be in the air now. */
  _want(l) {
    return Math.round(l.count * (l.calm + (1 - l.calm) * this.gust));
  }

  /** After the particles move: blow, wrap the ones the camera left behind, drop ones indoors, make new ones for the dead. */
  update(cx, cy, dt = 0) {
    this._blow(dt);
    for (const l of this.layers) this._update(l, cx, cy);
  }

  _update(l, cx, cy) {
    if (l.ti < 0) return;
    if (!l.filled) return this._fill(l, cx, cy);
    const ps = this.ps;
    const flags = this.map.flags;
    const r = l.range;
    const side = r * 2;
    // Backwards: remove() moves the last particle into slot i, and that one's been seen.
    for (let i = ps.n - 1; i >= 0; i--) {
      if (ps.type[i] !== l.ti) continue;
      const x = ps.x[i];
      const y = ps.y[i];
      const ox = x - (cx - r);
      const oy = y - (cy - r);
      if (ox < 0 || ox >= side || oy < 0 || oy >= side) {
        // Round to the far side, as high above the floor there as it was here.
        const nx = cx - r + (((ox % side) + side) % side);
        const ny = cy - r + (((oy % side) + side) % side);
        const above = ps.z[i] - ps.floor[i];
        const tile = this.map.inBounds(nx | 0, ny | 0) ? (ny | 0) * this.map.w + (nx | 0) : -1;
        if (tile < 0 || !(flags[tile] & F_SKY) || (l.sheltered && l.sheltered[tile]) || !ps.move(i, nx, ny, this.map.floorZ[tile] + above)) ps.remove(i);
      } else if (!(flags[ps.tile[i]] & F_SKY)) ps.remove(i);
    }
    const want = this._want(l);
    let tries = (want - this._live(l)) * 2;
    while (tries-- > 0 && this._live(l) < want) this._make(l, cx, cy);
  }

  /** Per tile, whether it's in the lee of something upwind standing more than `depth` over its floor (see above). */
  _shelter(depth) {
    const map = this.map;
    const { w, h, flags, floorZ, slabTop } = map;
    const out = new Uint8Array(w * h);
    const [wx, wy] = this.wind ?? [0, 0];
    const len = Math.hypot(wx, wy);
    if (!len) return out;
    const [ux, uy] = [-wx / len, -wy / len];
    // (A solid wall has no height of its own: only raised floors and slabs, a town's walls and roofs, make a lee.)
    const top = (i) => (flags[i] & F_SOLID ? -Infinity : flags[i] & F_SLAB ? Math.max(slabTop[i], floorZ[i]) : floorZ[i]);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (!(flags[i] & F_SKY)) continue;
        const f = floorZ[i];
        for (let s = 1; s <= LEE_MAX; s++) {
          const tx = Math.floor(x + 0.5 + ux * s);
          const ty = Math.floor(y + 0.5 + uy * s);
          if (tx < 0 || ty < 0 || tx >= w || ty >= h) break;
          const over = top(ty * w + tx) - f;
          if (over > depth && s <= over * LEE) {
            out[i] = 1;
            break;
          }
        }
      }
    }
    return out;
  }

  _live(l) {
    return this.ps.types[l.ti].live;
  }

  /** One particle of a layer at a random spot in its square under the sky, or -1. */
  _make(l, cx, cy) {
    const ps = this.ps;
    const map = this.map;
    const rng = ps.rng;
    const x = cx + (rng.next() * 2 - 1) * l.range;
    const y = cy + (rng.next() * 2 - 1) * l.range;
    if (!map.inBounds(x | 0, y | 0)) return -1;
    const tile = (y | 0) * map.w + (x | 0);
    if (!(map.flags[tile] & F_SKY)) return -1;
    if (l.shelter !== null && (l.sheltered ??= this._shelter(l.shelter))[tile]) return -1;
    const floor = map.floorZ[tile];
    const [z0, z1] = l.z;
    const top = Math.min(z1, map.ceilZ[tile] - floor - 0.05);
    if (top <= z0) return -1;
    const [h, v] = l.drift;
    const z = floor + z0 + (top - z0) * rng.next();
    return ps.spawn(l.ti, x, y, z, (rng.next() * 2 - 1) * h, (rng.next() * 2 - 1) * h, (rng.next() * 2 - 1) * v);
  }
}
