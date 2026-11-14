import { contentAngle } from './level.js';
import { runActions } from './actions.js';

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
  const keys = path.map(([kx, ky, kz, ka, seconds]) => ({ x: kx, y: ky, z: kz, angle: contentAngle(ka), seconds }));
  const flight = { thing: t, keys, leg: 1, time: 0, then };
  place(world, t, keys[0], keys[0], 0);
  world.flights.push(flight);
  return flight;
}

/** Put `t` between keyframes a and b, `u` of the way (eased in and out). */
function place(world, t, a, b, u) {
  const e = u * u * (3 - 2 * u);
  t.x = a.x + (b.x - a.x) * e;
  t.y = a.y + (b.y - a.y) * e;
  t.z = a.z + (b.z - a.z) * e;
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
      const last = f.keys[f.keys.length - 1];
      place(world, f.thing, last, last, 1);
      landed.push(f);
    } else {
      place(world, f.thing, f.keys[f.leg - 1], f.keys[f.leg], f.time / f.keys[f.leg].seconds);
    }
  }
  if (!landed.length) return;
  world.flights = world.flights.filter((f) => !landed.includes(f));
  for (const f of landed) if (f.then) runActions(world, f.then, { thing: f.thing });
}
