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

/** Names the validator accepts (see particleType). */
export const PARTICLE_BLENDS = Object.keys(BLENDS);
export const PARTICLE_FLOORS = Object.keys(FLOORS);
export const PARTICLE_SHAPES = ['square', 'disc'];
export const PARTICLE_WALLS = ['die', 'bounce'];

/**
 * Live particles at most, by how they draw: points (dots, squares, streaks)
 * and discs (smoke, steam), which cost by the pixels they cover. About 0.5
 * ms a frame in Chrome with both full (PLAN.md Phase 1b T).
 */
export const POINT_CAP = 1000;
export const DISC_CAP = 150;
/** The pool's size (the bench lifts the caps up to it). */
export const POOL_SIZE = 4096;

/** Lit particles sample the light map when spawned and then every this many ticks. */
const LIGHT_EVERY = 8;

/**
 * A particle's colours over its life as palette indices. Each entry is an
 * index, `[ramp, step]` (a step from the ramp's dark end) or `{ ramp, from,
 * to }` (every step from one to the other). Unknown ramps give index 0.
 * @param {any[]} list
 * @param {Record<string, [number, number]>} ramps the palette's ramps: name to [start, count]
 * @returns {number[]}
 */
export function particleColors(list, ramps = {}) {
  const at = (name, k) => {
    const r = ramps[name];
    if (!r) return 0;
    return r[0] + Math.max(0, Math.min(r[1] - 1, Math.round(k)));
  };
  const out = [];
  for (const c of list) {
    if (typeof c === 'number') out.push(c);
    else if (Array.isArray(c)) out.push(at(c[0], c[1]));
    else if (c && typeof c === 'object') {
      const step = c.to >= c.from ? 1 : -1;
      for (let k = c.from; step > 0 ? k <= c.to : k >= c.to; k += step) out.push(at(c.ramp, k));
    }
  }
  return out.length ? out : [0];
}

/**
 * A particle type (a defineParticle() result), filled in with defaults.
 * @param {any} def
 * @param {Record<string, [number, number]>} [ramps] the palette's ramps, for colours by name
 */
export function particleType(def, ramps) {
  const colors = particleColors(def.colors ?? [0], ramps);
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
    /** It swells (or shrinks) to this many times its size by the end of its life. */
    grow: def.grow ?? 1,
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
    /** For dither: the share of its life it takes to fade in. */
    fadeIn: def.fadeIn ?? 0,
    /** The share of its life it takes to fade out, at the end (1: over its whole life). */
    fadeOut: def.fadeOut ?? 1,
    /** `add` and `half` types with `fade` also thin out (as dither does) with alpha, fadeIn and age. */
    fade: !!def.fade,
    fullbright: !!def.fullbright,
    /** While it flies, it drops one of `trail.type` every `trail.every` seconds, for its first `trail.for` seconds. */
    trail: def.trail ? { type: def.trail.type, every: def.trail.every ?? 0.05, for: def.trail.for ?? Infinity } : null,
    /** The trail's type index (set by the pool). */
    trailTi: -1,
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
   * @param {any[]} [defs] particle types (defineParticle results)
   * @param {Record<string, [number, number]>} [ramps] the palette's ramps, for colours by name
   */
  constructor(map, defs = [], ramps = {}) {
    const cap = POOL_SIZE;
    this.map = map;
    this.cap = cap;
    this.n = 0;
    /** Live points and discs, and their caps. */
    this.points = 0;
    this.discs = 0;
    this.capPoints = POINT_CAP;
    this.capDiscs = DISC_CAP;
    this.ramps = ramps;
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
    for (const def of defs) this.addType(def);
  }

  /** Add a type (a defineParticle result); returns its index. At most 256 types. */
  addType(def) {
    if (this.byId.has(def.id)) return this.byId.get(def.id);
    if (this.types.length >= 256) throw new Error('At most 256 particle types');
    const t = particleType(def, this.ramps);
    this.types.push(t);
    this.byId.set(t.id, this.types.length - 1);
    for (const u of this.types) if (u.trail) u.trailTi = this.typeIndex(u.trail.type);
    return this.types.length - 1;
  }

  /** The index of a type by id (-1 if there's none). */
  typeIndex(id) {
    return this.byId.get(id) ?? -1;
  }

  /**
   * Spawn one particle of type `ti` (an index, or an id). Returns its slot,
   * or -1 when its type or class is at its cap, or the spot is in a wall or
   * off the map.
   */
  spawn(ti, x, y, z, vx = 0, vy = 0, vz = 0) {
    if (typeof ti === 'string') ti = this.typeIndex(ti);
    const t = this.types[ti];
    if (!t || this.n >= this.cap || t.live >= t.cap) return -1;
    if (t.disc ? this.discs >= this.capDiscs : this.points >= this.capPoints) return -1;
    const map = this.map;
    const tx = x | 0;
    const ty = y | 0;
    if (x < 0 || y < 0 || tx >= map.w || ty >= map.h) return -1;
    const tile = ty * map.w + tx;
    if (map.flags[tile] & F_SOLID) return -1;
    const i = this.n++;
    t.live++;
    if (t.disc) this.discs++;
    else this.points++;
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
   * A burst of `count` particles of type `ti` (an index or an id) from (x, y,
   * z): along `dir` (a vector; none for all round), spread by `spread` (0
   * straight along it, 1 a hemisphere round it, 2 all round), at `speed`
   * ([min, max] units per second). With `radius`, each starts anywhere within
   * that distance of (x, y, z) (at the point itself where that's in a wall).
   * With `ring`, they fly flat instead, in the plane across `dir` (across
   * up without one): a ring along the floor or a wall.
   * Returns how many it made (fewer at a cap).
   */
  burst(ti, x, y, z, { count = 10, dir = null, spread = 2, speed = [1, 3], radius = 0, ring = false } = {}) {
    if (typeof ti === 'string') ti = this.typeIndex(ti);
    if (ti < 0) return 0;
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
      if (ring) {
        // Drop the part along the axis (up when there's no dir): flat across it.
        const ax = dir ? dx : 0;
        const ay = dir ? dy : 0;
        const az = dir ? dz : 1;
        const along = rx * ax + ry * ay + rz * az;
        rx -= ax * along;
        ry -= ay * along;
        rz -= az * along;
        const l = Math.hypot(rx, ry, rz);
        if (l < 1e-6) {
          k--;
          continue;
        }
        rx /= l;
        ry /= l;
        rz /= l;
      } else if (dir) {
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
      let i = -1;
      if (radius > 0) {
        // A point in the ball, no nearer the floor than its own floor.
        const ou = rng.next() * 2 - 1;
        const oa = rng.next() * Math.PI * 2;
        const or = Math.sqrt(1 - ou * ou);
        const d = radius * Math.cbrt(rng.next());
        i = this.spawn(ti, x + or * Math.cos(oa) * d, y + or * Math.sin(oa) * d, z + ou * d, rx * sp, ry * sp, rz * sp);
        if (i >= 0 && this.z[i] < this.floor[i]) this.z[i] = this.floor[i] + 0.01;
      }
      if (i < 0) i = this.spawn(ti, x, y, z, rx * sp, ry * sp, rz * sp);
      if (i < 0) return k;
    }
    return count;
  }

  /** Remove every particle. */
  clear() {
    this.n = 0;
    this.points = 0;
    this.discs = 0;
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
    const t = this.types[this.type[i]];
    t.live--;
    if (t.disc) this.discs--;
    else this.points--;
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
      const tr = t.trail;
      if (tr && a < tr.for && ((a / tr.every) | 0) !== (((a - dt) / tr.every) | 0)) {
        // (Appended at the end, so it moves this tick too: the loop runs to the new n.)
        this.spawn(t.trailTi, x[i], y[i], z[i], ux * 0.1, uy * 0.1, uz * 0.1);
      }
      i++;
    }
  }
}
