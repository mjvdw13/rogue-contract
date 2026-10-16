import { Rng } from '../core/rng.js';
import { F_SOLID, F_SLAB } from './tilemap.js';

/** How a particle is drawn over what's behind it (render/particles.js). */
export const BLEND_SOLID = 0;
export const BLEND_ADD = 1;
export const BLEND_HALF = 2;
export const BLEND_DITHER = 3;
const BLENDS = { solid: BLEND_SOLID, add: BLEND_ADD, half: BLEND_HALF, dither: BLEND_DITHER };

/** What a particle does when it reaches the floor. */
const FLOOR_DIE = 0;
const FLOOR_BOUNCE = 1;
const FLOOR_STICK = 2;
const FLOORS = { die: FLOOR_DIE, bounce: FLOOR_BOUNCE, stick: FLOOR_STICK };

/** Lit particles sample the light map when spawned and then every this many ticks. */
const LIGHT_EVERY = 8;

/**
 * A particle type, filled in with defaults.
 * @param {any} def
 * @param {(name:string)=>number} [color] palette index for a colour name (or pass indices)
 */
export function particleType(def, color = (c) => c) {
  const colors = (def.colors ?? [255]).map((c) => (typeof c === 'number' ? c : color(c)));
  const life = Array.isArray(def.life) ? def.life : [def.life ?? 1, def.life ?? 1];
  return {
    id: def.id,
    colors: Uint8Array.from(colors),
    life,
    /** Size in world units (one tile is 1); drawn 1 to maxPx pixels across. */
    size: def.size ?? 0.03,
    maxPx: def.maxPx ?? 3,
    /** 'square' (dots and squares) or 'disc' (round, for smoke and steam). */
    disc: def.shape === 'disc',
    /** Fast ones draw a streak back along their velocity, this many seconds long. */
    streak: def.streak ?? 0,
    gravity: def.gravity ?? 0,
    /** Fraction of the velocity lost per second. */
    drag: def.drag ?? 0,
    bounce: def.bounce ?? 0.4,
    onFloor: FLOORS[def.onFloor ?? 'die'] ?? FLOOR_DIE,
    /** Bounce off walls instead of dying in them. */
    walls: def.walls === 'bounce',
    /** How much of the level's wind carries it. */
    wind: def.wind ?? 0,
    blend: BLENDS[def.blend ?? 'solid'] ?? BLEND_SOLID,
    /** Opacity for dither (fades out over the particle's life). */
    alpha: def.alpha ?? 1,
    fullbright: !!def.fullbright,
    cap: def.cap ?? Infinity,
    /** Live count (kept by the pool). */
    live: 0,
  };
}

/**
 * Particles: one pool of structure-of-arrays slots, live ones packed at the
 * front (swap-removed when they die). No objects per particle, no garbage.
 * Cosmetic only: its own RNG, never the world's.
 */
export class Particles {
  /**
   * @param {import('./tilemap.js').TileMap} map
   * @param {number} [cap]
   */
  constructor(map, cap = 4096) {
    this.map = map;
    this.cap = cap;
    this.n = 0;
    /** @type {ReturnType<typeof particleType>[]} */
    this.types = [];
    this.byId = new Map();
    this.rng = new Rng(0x5eed);
    /** The level's wind (units per second) that types with `wind` follow. */
    this.wind = [0, 0, 0];
    this.x = new Float32Array(cap);
    this.y = new Float32Array(cap);
    this.z = new Float32Array(cap);
    this.vx = new Float32Array(cap);
    this.vy = new Float32Array(cap);
    this.vz = new Float32Array(cap);
    this.age = new Float32Array(cap);
    this.life = new Float32Array(cap);
    /** The floor and ceiling where it is, read when it enters a tile. */
    this.floor = new Float32Array(cap);
    this.ceil = new Float32Array(cap);
    this.tile = new Int32Array(cap);
    this.type = new Uint8Array(cap);
    this.light = new Uint8Array(cap);
    /** Set while it lies on the floor (stuck). */
    this.rest = new Uint8Array(cap);
    this.ticks = 0;
  }

  /** Add a type (see particleType); returns its index. */
  addType(def, color) {
    const t = def.colors instanceof Uint8Array ? def : particleType(def, color);
    if (this.byId.has(t.id)) return this.byId.get(t.id);
    this.types.push(t);
    this.byId.set(t.id, this.types.length - 1);
    return this.types.length - 1;
  }

  /** Spawn one particle of type index `ti`. Returns its slot, or -1 when full. */
  spawn(ti, x, y, z, vx = 0, vy = 0, vz = 0) {
    const t = this.types[ti];
    if (this.n >= this.cap || t.live >= t.cap) return -1;
    const map = this.map;
    const tx = x | 0;
    const ty = y | 0;
    if (x < 0 || y < 0 || tx >= map.w || ty >= map.h) return -1;
    const tile = ty * map.w + tx;
    if (map.flags[tile] & F_SOLID) return -1;
    const i = this.n++;
    t.live++;
    this.x[i] = x;
    this.y[i] = y;
    this.z[i] = z;
    this.vx[i] = vx;
    this.vy[i] = vy;
    this.vz[i] = vz;
    this.age[i] = 0;
    const [l0, l1] = t.life;
    this.life[i] = l0 + (l1 - l0) * this.rng.next();
    this.type[i] = ti;
    this.rest[i] = 0;
    this._enter(i, tile);
    this._light(i);
    return i;
  }

  /**
   * A burst of `count` particles from (x, y, z): along `dir` (a vector; none
   * for all round), spread by `spread` (0 none, 1 a hemisphere, 2 all round),
   * at `speed` ([min, max] units per second).
   */
  burst(ti, x, y, z, { count = 10, dir = null, spread = 2, speed = [1, 3] } = {}) {
    if (typeof ti === 'string') ti = this.byId.get(ti) ?? -1;
    if (ti < 0) return;
    const rng = this.rng;
    let dx = 0;
    let dy = 0;
    let dz = 0;
    if (dir) {
      const len = Math.hypot(dir[0], dir[1], dir[2]) || 1;
      dx = dir[0] / len;
      dy = dir[1] / len;
      dz = dir[2] / len;
    }
    const s0 = Array.isArray(speed) ? speed[0] : speed;
    const s1 = Array.isArray(speed) ? speed[1] : speed;
    for (let k = 0; k < count; k++) {
      // A random direction on the sphere, pulled toward dir.
      const u = rng.next() * 2 - 1;
      const a = rng.next() * Math.PI * 2;
      const r = Math.sqrt(1 - u * u);
      let rx = r * Math.cos(a);
      let ry = r * Math.sin(a);
      let rz = u;
      if (dir) {
        if (rx * dx + ry * dy + rz * dz < 0 && spread < 2) {
          rx = -rx;
          ry = -ry;
          rz = -rz;
        }
        const s = Math.min(spread, 1);
        rx = dx + (rx - dx) * s;
        ry = dy + (ry - dy) * s;
        rz = dz + (rz - dz) * s;
        const l = Math.hypot(rx, ry, rz) || 1;
        rx /= l;
        ry /= l;
        rz /= l;
      }
      const sp = s0 + (s1 - s0) * rng.next();
      if (this.spawn(ti, x, y, z, rx * sp, ry * sp, rz * sp) < 0) return;
    }
  }

  /** Remove every particle. */
  clear() {
    this.n = 0;
    for (const t of this.types) t.live = 0;
  }

  /** Read the floor and ceiling of tile i at the particle's height. */
  _enter(i, tile) {
    const map = this.map;
    this.tile[i] = tile;
    const z = this.z[i];
    const slab = map.flags[tile] & F_SLAB && map.slabTop[tile] <= z + 0.01;
    this.floor[i] = slab ? map.slabTop[tile] : map.floorZ[tile];
    this.ceil[i] = !slab && map.flags[tile] & F_SLAB ? map.slabBot[tile] : map.ceilZ[tile];
  }

  _light(i) {
    if (this.types[this.type[i]].fullbright) return;
    const map = this.map;
    const lm = map.lightmap;
    const tile = this.tile[i];
    const storey = map.flags[tile] & F_SLAB && map.slabTop[tile] <= this.z[i] + 0.01 ? 1 : 0;
    const l = lm ? lm.sample(this.x[i], this.y[i], storey) : map.light[tile];
    this.light[i] = l < 0 ? 0 : l > 255 ? 255 : l;
  }

  _kill(i) {
    const last = --this.n;
    this.types[this.type[i]].live--;
    if (i === last) return;
    this.x[i] = this.x[last];
    this.y[i] = this.y[last];
    this.z[i] = this.z[last];
    this.vx[i] = this.vx[last];
    this.vy[i] = this.vy[last];
    this.vz[i] = this.vz[last];
    this.age[i] = this.age[last];
    this.life[i] = this.life[last];
    this.floor[i] = this.floor[last];
    this.ceil[i] = this.ceil[last];
    this.tile[i] = this.tile[last];
    this.type[i] = this.type[last];
    this.light[i] = this.light[last];
    this.rest[i] = this.rest[last];
  }

  /** Move every particle one step of dt seconds. */
  update(dt) {
    const { x, y, z, vx, vy, vz, age, life, floor, ceil, tile, type, rest, types, map } = this;
    const mw = map.w;
    const mh = map.h;
    const flags = map.flags;
    const [wx, wy, wz] = this.wind;
    const tick = this.ticks++;
    // Per type this step: drag (toward the air's velocity: still, or the
    // wind for types it carries) and gravity.
    for (const t of types) {
      t._k = t.drag * dt;
      t._g = t.gravity * dt;
      t._ax = wx * t.wind;
      t._ay = wy * t.wind;
      t._az = wz * t.wind;
    }
    let i = 0;
    while (i < this.n) {
      const t = types[type[i]];
      const a = (age[i] += dt);
      if (a >= life[i]) {
        this._kill(i);
        continue;
      }
      if (rest[i]) {
        i++;
        continue;
      }
      const k = t._k;
      const ux = vx[i] + (t._ax - vx[i]) * k;
      const uy = vy[i] + (t._ay - vy[i]) * k;
      const uz = vz[i] + (t._az - vz[i]) * k - t._g;
      vx[i] = ux;
      vy[i] = uy;
      vz[i] = uz;
      const nx = x[i] + ux * dt;
      const ny = y[i] + uy * dt;
      let nz = z[i] + uz * dt;
      const tx = nx | 0;
      const ty = ny | 0;
      if (nx < 0 || ny < 0 || tx >= mw || ty >= mh) {
        this._kill(i);
        continue;
      }
      const nt = ty * mw + tx;
      if (nt !== tile[i]) {
        if (flags[nt] & F_SOLID) {
          if (!t.walls) {
            this._kill(i);
            continue;
          }
          // Bounce off the wall it hit: flip the axis that crossed into it.
          if (tx !== (x[i] | 0)) vx[i] = -ux * t.bounce;
          if (ty !== (y[i] | 0)) vy[i] = -uy * t.bounce;
          i++;
          continue;
        }
        x[i] = nx;
        y[i] = ny;
        z[i] = nz;
        this._enter(i, nt);
      } else {
        x[i] = nx;
        y[i] = ny;
      }
      if (nz < floor[i]) {
        const f = t.onFloor;
        if (f === FLOOR_DIE) {
          this._kill(i);
          continue;
        }
        nz = floor[i];
        if (f === FLOOR_BOUNCE || uz < -1.5) {
          vz[i] = -uz * t.bounce;
          vx[i] = ux * 0.7;
          vy[i] = uy * 0.7;
        } else {
          rest[i] = 1;
        }
      } else if (nz > ceil[i]) {
        nz = ceil[i];
        if (uz > 0) vz[i] = -uz * t.bounce;
      }
      z[i] = nz;
      if (((tick + i) & (LIGHT_EVERY - 1)) === 0) this._light(i);
      i++;
    }
  }
}
