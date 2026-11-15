import { contentAngle } from './level.js';
import { runActions } from './actions.js';
import { Rng } from '../core/rng.js';

// Things flown along timed keyframes by the `fly` action (a ship coming in
// to land). A flight moves its thing whatever stands in the way: it's a
// piece of the story, not of the physics.

const TAU = Math.PI * 2;

/**
 * Start flying the first thing of type `type` along `path`
 * ([[x, y, z, angle, seconds], ...]: content degrees; each keyframe is
 * reached `seconds` after the one before, and the first is where it
 * starts). With no such thing in the level, one is made at the first
 * keyframe. When it arrives, the actions in `then` run.
 */
export function startFlight(world, type, path, then) {
  if (!Array.isArray(path) || path.length < 2) return null;
  const [x, y, z, angle] = path[0];
  const t = world.things.find((o) => o.def.id === type && !o.removed) ?? world.spawn(type, x, y, contentAngle(angle));
  if (!t) return null;
  // (One flight a thing: a new one takes over from where it is told to start.)
  world.flights = world.flights.filter((f) => f.thing !== t);
  return launch(world, t, path, { then });
}

/**
 * Put `t` on `path` and keep it moving. `steady` flies each leg at an even
 * speed (traffic passing through) instead of easing in and out of every
 * keyframe; `leave` takes the thing out of the world when it arrives.
 */
function launch(world, t, path, { then, steady = false, leave = false } = {}) {
  const keys = path.map(([kx, ky, kz, ka, seconds]) => ({ x: kx, y: ky, z: kz, angle: contentAngle(ka), seconds }));
  const flight = { thing: t, keys, leg: 1, time: 0, then, steady, leave };
  place(world, t, keys, 1, 0, steady);
  world.flights.push(flight);
  return flight;
}

/** A point `u` of the way from b to c on the smooth curve through a, b, c and d (Catmull-Rom). */
const curve = (a, b, c, d, u) => 0.5 * (2 * b + (c - a) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (3 * b - a - 3 * c + d) * u * u * u);

/**
 * Put `t` `u` of the way along leg `leg` of `keys` (from the keyframe
 * before it): eased in and out along a straight line, or, `steady`, at an
 * even pace along a smooth curve through the keyframes either side too.
 */
function place(world, t, keys, leg, u, steady) {
  const a = keys[leg - 1];
  const b = keys[leg];
  const e = steady ? u : u * u * (3 - 2 * u);
  if (steady) {
    const p = keys[Math.max(0, leg - 2)];
    const n = keys[Math.min(keys.length - 1, leg + 1)];
    t.x = curve(p.x, a.x, b.x, n.x, u);
    t.y = curve(p.y, a.y, b.y, n.y, u);
    t.z = curve(p.z, a.z, b.z, n.z, u);
  } else {
    t.x = a.x + (b.x - a.x) * e;
    t.y = a.y + (b.y - a.y) * e;
    t.z = a.z + (b.z - a.z) * e;
  }
  // The short way round.
  const turn = ((((b.angle - a.angle) % TAU) + TAU + Math.PI) % TAU) - Math.PI;
  t.angle = a.angle + turn * e;
  world.grid.update(t);
}

/** Move every flight on by `dt`; one that arrives runs its `then` actions. */
export function updateFlights(world, dt) {
  if (!world.flights.length) return;
  const landed = [];
  for (const f of world.flights) {
    f.time += dt;
    while (f.leg < f.keys.length && f.time >= f.keys[f.leg].seconds) {
      f.time -= f.keys[f.leg].seconds;
      f.leg++;
    }
    if (f.leg >= f.keys.length) {
      place(world, f.thing, f.keys, f.keys.length - 1, 1, f.steady);
      landed.push(f);
    } else {
      place(world, f.thing, f.keys, f.leg, f.time / f.keys[f.leg].seconds, f.steady);
    }
  }
  if (!landed.length) return;
  world.flights = world.flights.filter((f) => !landed.includes(f));
  for (const f of landed) {
    if (f.leave) world.remove(f.thing);
    if (f.then) runActions(world, f.then, { thing: f.thing });
  }
}

/**
 * Traffic: a level's lanes, each sending a thing down one of its paths
 * every so often for as long as the level runs (ships crossing the sky).
 * A lane is `{ thing, paths, every: [shortest, longest], first?, count?,
 * gap? }`: after `first` seconds (a range; `every` if left out) a new
 * `thing` is made at the start of one of `paths` (keyframes, as the fly
 * action's), flown along it at an even pace on a smooth curve through its
 * keyframes, and taken away at the end; the next sets off `every` seconds
 * after that. With `count`, that many go down the path one behind the
 * other, `gap` seconds apart (1). One group at a time a lane. Cosmetic:
 * its own RNG, so the game's dice roll the same with traffic or without.
 */
export class Traffic {
  constructor(world, lanes) {
    this.world = world;
    this.rng = new Rng(0x7afc);
    this.lanes = lanes.map((def) => ({ def, wait: this.pick(def.first ?? def.every), flight: null, path: null, left: 0 }));
  }

  pick([a, b]) {
    return a + (b - a) * this.rng.next();
  }

  update(dt) {
    const world = this.world;
    for (const l of this.lanes) {
      if (l.flight) {
        if (world.flights.includes(l.flight)) continue;
        l.flight = null;
        l.wait = this.pick(l.def.every);
      }
      l.wait -= dt;
      if (l.wait > 0) continue;
      // A new group picks its path; the ones behind its leader follow it down the same one, `gap` apart.
      if (l.left <= 0) {
        const paths = l.def.paths;
        l.path = paths[Math.min(paths.length - 1, Math.floor(this.rng.next() * paths.length))];
        l.left = l.def.count ?? 1;
      }
      const path = l.path;
      const t = world.spawn(l.def.thing, path[0][0], path[0][1], contentAngle(path[0][3]));
      l.left--;
      if (!t) { l.left = 0; l.wait = this.pick(l.def.every); continue; }
      const flight = launch(world, t, path, { steady: true, leave: true });
      // (The lane waits for its last one to arrive before it counts to the next group.)
      if (l.left > 0) l.wait = l.def.gap ?? 1;
      else l.flight = flight;
    }
  }
}
