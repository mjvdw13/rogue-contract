import { castRay } from './physics.js';

/**
 * Explosions (PLAN.md Phase 1b T step 5f): named recipes (defineExplosion)
 * of particle bursts, a flash of light, a sound and optionally a sprite
 * effect, set off by id with `world.explode`; a recipe's `then` sets off
 * more after it, off to the side. Only for looks: the damage is the
 * exploder's (`explode`, `splash`), and the particles' RNG is their own.
 */

/** An explosion this close above the floor (with no facing of its own) faces up. */
const NEAR_FLOOR = 0.3;
const UP = [0, 0, 1];

/** A number, or one picked at random in [min, max]. */
const between = (rng, v) => (Array.isArray(v) ? v[0] + (v[1] - v[0]) * rng.next() : v);

export class Explosions {
  /** @param {import('./world.js').World} world */
  constructor(world) {
    this.world = world;
    /** Bursts still to come (a `delay`, or spread `over` a while), and explosions that follow (`then`). */
    this.pending = [];
    /** Flashes of light, fading. */
    this.flashes = [];
  }

  /**
   * Set off explosion `id` at (x, y, z). `dir` is the way it faces (out of
   * the wall or floor it hit): bursts without a direction of their own keep
   * to that side of it. Returns false for an unknown id.
   * @param {string} id
   * @param {{dir?:number[]|null}} [opts]
   */
  explode(id, x, y, z, { dir = null } = {}) {
    const world = this.world;
    const def = world.registry.explosions?.get(id);
    if (!def) return false;
    if (dir && !dir[0] && !dir[1] && !dir[2]) dir = null;
    if (!dir && z - world.map.floorAt(x, y, 0, z + 0.1) < NEAR_FLOOR) dir = UP;
    const rng = world.particles.rng;
    for (const b of def.particles ?? []) {
      let bdir = null;
      let spread = b.spread ?? 2;
      if (Array.isArray(b.dir)) bdir = b.dir;
      else if (b.dir === 'up') bdir = UP;
      else if (b.dir === 'ring') bdir = dir;
      else if (dir) {
        // 'out' or none: away from what it hit, never into it.
        bdir = dir;
        spread = Math.min(spread, 1);
      }
      const burst = {
        type: b.type,
        count: b.count ?? 10,
        made: 0,
        wait: between(rng, b.delay ?? 0),
        over: b.over ?? 0,
        x,
        y,
        z: z + (b.z ?? 0),
        opts: { dir: bdir, spread, speed: b.speed ?? [1, 3], radius: b.radius ?? 0, ring: b.dir === 'ring' },
      };
      if (!this._step(burst)) this.pending.push(burst);
    }
    for (const c of def.then ?? []) {
      const at = this._beside(x, y, z + (c.z ?? 0), between(rng, c.offset ?? 0), dir, rng);
      const next = { explosion: c.explosion, wait: between(rng, c.delay ?? 0), x: at[0], y: at[1], z: at[2], dir };
      if (next.wait > 0) this.pending.push(next);
      else this.explode(next.explosion, next.x, next.y, next.z, { dir });
    }
    const l = def.light;
    if (l) this.flashes.push({ x, y, z, radius: l.radius, light: l.light, time: l.time ?? 0.4, age: 0 });
    if (def.effect) world.spawnEffect(def.effect, x, y, z);
    if (def.sound) world.playSoundAt(def.sound, x, y);
    return true;
  }

  /**
   * A point `dist` to the side of (x, y, z), a random way but not back into
   * what the explosion faces out of, short of any wall and above the floor.
   */
  _beside(x, y, z, dist, dir, rng) {
    if (!(dist > 0)) return [x, y, z];
    const map = this.world.map;
    const a = rng.next() * Math.PI * 2;
    let dx = Math.cos(a);
    let dy = Math.sin(a);
    if (dir && dx * dir[0] + dy * dir[1] < 0) {
      dx = -dx;
      dy = -dy;
    }
    const d = Math.max(0, Math.min(dist, castRay(map, x, y, dx, dy, dist + 1).dist - 0.15));
    const nx = x + dx * d;
    const ny = y + dy * d;
    return [nx, ny, Math.max(z, map.floorAt(nx, ny, 0, z + 0.1) + 0.05)];
  }

  /** Throw what's due of a burst; true once it's all out. */
  _step(b) {
    if (b.wait > 0) return false;
    const done = b.over > 0 ? Math.min(1, -b.wait / b.over) : 1;
    const due = Math.round(b.count * done) - b.made;
    if (due > 0) {
      this.world.particles.burst(b.type, b.x, b.y, b.z, { ...b.opts, count: due });
      b.made += due;
    }
    return done >= 1;
  }

  /** Run the bursts still to come, and fade the flashes. */
  update(dt) {
    const pending = this.pending;
    for (let k = pending.length - 1; k >= 0; k--) {
      const b = pending[k];
      b.wait -= dt;
      if (b.explosion) {
        if (b.wait > 0) continue;
        pending.splice(k, 1);
        this.explode(b.explosion, b.x, b.y, b.z, { dir: b.dir });
      } else if (this._step(b)) pending.splice(k, 1);
    }
    const flashes = this.flashes;
    for (let k = flashes.length - 1; k >= 0; k--) if ((flashes[k].age += dt) >= flashes[k].time) flashes.splice(k, 1);
  }

  /** Add the flashes to a list of dynamic lights ({ x, y, z, radius, light }). */
  lights(out) {
    for (const f of this.flashes) {
      const light = f.light * (1 - f.age / f.time);
      if (light >= 1) out.push({ x: f.x, y: f.y, z: f.z, radius: f.radius, light });
    }
    return out;
  }

  clear() {
    this.pending.length = 0;
    this.flashes.length = 0;
  }
}
