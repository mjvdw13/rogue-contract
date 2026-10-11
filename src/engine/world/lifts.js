import { F_SOLID } from './tilemap.js';

/**
 * A lift (an elevator, in Dark Forces' terms): a group of tiles whose floor
 * moves between heights ("stops"). Things standing on it ride along. Modes:
 *   'return'  rests at stops[0]; when started it goes to the next stop, waits
 *             `wait` seconds and comes back (Doom's lifts). The default.
 *   'toggle'  each start moves it on to the next stop, where it stays.
 *   'cycle'   moves between its stops on its own, pausing `wait` at each.
 * `moves: 'both'` carries the ceiling along too (a closed elevator cab).
 */
export class Lift {
  constructor(spec, tiles) {
    this.tiles = tiles;
    this.stops = spec.stops?.length ? spec.stops.slice() : [0, 1];
    this.mode = spec.mode ?? 'return';
    this.speed = spec.speed ?? 1.5; // units per second
    this.wait = spec.wait ?? 3;
    this.moves = spec.moves ?? 'floor';
    this.on = new Set([].concat(spec.on ?? ['enter', 'use']));
    this.sounds = spec.sounds ?? {};
    this.tag = spec.tag ?? null;
    this.stop = Math.min(spec.start ?? 0, this.stops.length - 1);
    this.z = this.stops[this.stop];
    this.target = this.stop;
    this.state = this.mode === 'cycle' && spec.auto !== false ? 'waiting' : 'idle'; // idle | moving | waiting
    this.timer = this.mode === 'cycle' ? this.wait : 0;
  }
}

/** Start a lift moving (to stop `to` if given). Returns true if it started. */
export function startLift(world, lift, to) {
  if (lift.state === 'moving') return false;
  if (lift.mode === 'return' && lift.state === 'waiting' && lift.stop !== 0 && to === undefined) {
    lift.timer = lift.wait; // someone's still using it: keep it here
    return false;
  }
  const next = to ?? (lift.stop + 1) % lift.stops.length;
  if (next === lift.stop) return false;
  lift.target = next;
  lift.state = 'moving';
  playLiftSound(world, lift, lift.sounds.start ?? 'lift-start');
  return true;
}

function playLiftSound(world, lift, id) {
  const map = world.map;
  const i = lift.tiles[0];
  world.playSoundAt(id, (i % map.w) + 0.5, Math.floor(i / map.w) + 0.5);
}

/** Does a box of half-size r at (x, y) touch any of the lift's tiles? */
function onLift(map, lift, x, y, r) {
  const x0 = Math.floor(x - r);
  const x1 = Math.floor(x + r);
  const y0 = Math.floor(y - r);
  const y1 = Math.floor(y + r);
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      if (map.inBounds(tx, ty) && map.liftIndex[ty * map.w + tx] === lift.index) return true;
    }
  }
  return false;
}

function setLiftZ(map, lift, z) {
  lift.z = z;
  lift.tiles.forEach((i, k) => {
    map.floorZ[i] = z;
    if (lift.moves === 'both') map.ceilZ[i] = z + lift.headroom[k];
  });
}

/** Advance every lift and carry whatever stands on it. */
export function updateLifts(world, dt) {
  const map = world.map;
  for (const lift of map.lifts) {
    if (lift.state === 'waiting') {
      lift.timer -= dt;
      if (lift.timer > 0) continue;
      if (lift.mode === 'return') {
        if (lift.stop === 0) {
          lift.state = 'idle';
          continue;
        }
        lift.target = 0;
      } else if (lift.mode === 'cycle') {
        lift.target = (lift.stop + 1) % lift.stops.length;
      } else {
        lift.state = 'idle';
        continue;
      }
      lift.state = 'moving';
      playLiftSound(world, lift, lift.sounds.start ?? 'lift-start');
    }
    if (lift.state !== 'moving') continue;

    const goal = lift.stops[lift.target];
    const step = lift.speed * dt;
    const z = goal > lift.z ? Math.min(goal, lift.z + step) : Math.max(goal, lift.z - step);
    const dz = z - lift.z;

    // Riders: things standing on the lift's floor (not on a higher floor beside it).
    const riders = [];
    for (const t of world.things) {
      if (t.removed || t.kind === 'projectile' || t.kind === 'effect') continue;
      if (t.def.hanging || t.def.flying) continue;
      if (t.z > lift.z + 0.02 || !onLift(map, lift, t.x, t.y, t.radius)) continue;
      riders.push(t);
    }
    // Going up: don't crush anyone against the ceiling. Go back where it came from.
    if (dz > 0 && lift.moves !== 'both') {
      const blocked = riders.some((t) => t.solid && z + t.height > map.ceilAt(t.x, t.y, t.radius) + 1e-4);
      if (blocked) {
        lift.target = lift.stop;
        if (lift.stops[lift.stop] >= lift.z) {
          lift.state = lift.mode === 'cycle' ? 'waiting' : 'idle';
          lift.timer = lift.wait;
        }
        continue;
      }
    }
    setLiftZ(map, lift, z);
    for (const t of riders) t.z = Math.max(t.z + dz, map.floorAt(t.x, t.y, t.radius));

    if (z === goal) {
      lift.stop = lift.target;
      lift.state = lift.mode === 'toggle' ? 'idle' : 'waiting';
      lift.timer = lift.wait;
      if (lift.mode === 'return' && lift.stop === 0) lift.state = 'idle';
      playLiftSound(world, lift, lift.sounds.stop ?? 'lift-stop');
    }
  }
}

/** The lift on tile index i, or null. */
export function liftAt(map, i) {
  if (i < 0 || i >= map.liftIndex.length) return null;
  const l = map.liftIndex[i];
  return l >= 0 ? map.lifts[l] : null;
}

/**
 * Group connected tiles that share a glyph and have a `lift` spec into lifts.
 * Called by the level builder.
 */
export function buildLifts(map, glyphAt, legend) {
  const n = map.w * map.h;
  for (let i = 0; i < n; i++) {
    const spec = legend[glyphAt[i]]?.lift;
    if (!spec || map.liftIndex[i] >= 0 || map.flags[i] & F_SOLID) continue;
    const index = map.lifts.length;
    const tiles = [];
    const stack = [i];
    map.liftIndex[i] = index;
    while (stack.length) {
      const c = stack.pop();
      tiles.push(c);
      const cx = c % map.w;
      const cy = (c / map.w) | 0;
      for (const [nx, ny] of [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]]) {
        if (!map.inBounds(nx, ny)) continue;
        const m = ny * map.w + nx;
        if (map.liftIndex[m] < 0 && glyphAt[m] === glyphAt[i] && !(map.flags[m] & F_SOLID)) {
          map.liftIndex[m] = index;
          stack.push(m);
        }
      }
    }
    const tag = map.tag[i] >= 0 ? map.tagNames[map.tag[i]] : null;
    const lift = new Lift({ ...spec, tag: spec.tag ?? tag }, tiles);
    lift.index = index;
    map.lifts.push(lift);
    // Start at its first stop (a cab keeps the headroom the legend gave it).
    lift.headroom = tiles.map((t) => map.ceilZ[t] - map.floorZ[t]);
    setLiftZ(map, lift, lift.z);
  }
}
