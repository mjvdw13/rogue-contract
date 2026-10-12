import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLevel } from '../src/engine/world/level.js';
import { FlowField, UNREACHABLE, WALKER } from '../src/engine/world/nav.js';
import { makeWorld, mockInput, coarse, fine, run, registry } from './helpers.js';

// The maps are drawn on the coarse grid and upscaled (coarse() in helpers.js),
// so their legend heights double: h is really 2 up, the stairs 0.5 apart, the
// vent 1.8 high. Positions in the checks are fine-grid ones.
const TALL = { floor: 'imp-floor', ceiling: 'imp-ceiling', light: 160, ceilZ: 3 };
const at = (z) => ({ ...TALL, floorZ: z });
const LEGEND = { '.': TALL, h: at(1), a: at(0.25), b: at(0.5), c: at(0.75), v: { ...TALL, ceilZ: 0.9 } };

// A floor along row 1 with a ledge on row 2 that stairs at the east end lead
// down from: the walking route from the ledge to (1, 1) goes the long way.
const stairs = coarse(['##########', '#........#', '#hhhhhcba#', '##########'], ['', ' >'], { legend: LEGEND });

// A floor with a ledge at its east end and no way up.
const ledge = coarse(['########', '#...hhh#', '#...hhh#', '########'], ['', ' >'], { legend: LEGEND });

function world(level) {
  const w = makeWorld(level, { noMonsters: true });
  w.player.player.god = true;
  return w;
}

/** Spawn a monster that's already chasing the player. */
function hunter(w, type, x, y) {
  const m = w.spawn(type, x, y);
  m.health = 10000;
  m.cooldown = 1000; // keeps it walking rather than shooting
  w.wakeMonster(m, w.player);
  m.reaction = 1000;
  return m;
}

test('flow fields know how high a body climbs, how far it drops and how tall it is', () => {
  const { map } = buildLevel(registry, stairs);
  const walker = new FlowField(map, WALKER);
  walker.update(3, 3, true);
  const d = (f, x, y) => f.dist[y * map.w + x];
  assert.ok(d(walker, 3, 5) > 20, `off the ledge by the stairs at the far end (${d(walker, 3, 5)} steps)`);
  const flyer = new FlowField(map, { ...WALKER, flying: true });
  flyer.update(3, 3, true);
  assert.equal(d(flyer, 3, 5), 2, 'a flyer drops straight down');

  const { map: m2 } = buildLevel(registry, ledge);
  const w2 = new FlowField(m2, WALKER);
  w2.update(3, 3, true);
  assert.equal(w2.dist[3 * m2.w + 11], UNREACHABLE, 'no way up the ledge');
  w2.update(11, 3, true);
  assert.equal(w2.dist[3 * m2.w + 3], UNREACHABLE, 'and no walking off it');

  const vent = buildLevel(registry, coarse(['#######', '#..v..#', '#######'], ['', ' >'], { legend: LEGEND })).map;
  const short = new FlowField(vent, WALKER);
  short.update(3, 3, true);
  assert.equal(short.dist[3 * vent.w + 11], 8, 'a trooper (1.76) fits under the 1.8 vent');
  const tall = new FlowField(vent, { ...WALKER, height: 2.2 });
  tall.update(3, 3, true);
  assert.equal(tall.dist[3 * vent.w + 11], UNREACHABLE, 'a 2.2-tall body does not');
});

test('a monster on a ledge stays on it rather than walking off', () => {
  const w = world(ledge);
  const trooper = hunter(w, 'stormtrooper', fine(5.5), fine(1.5));
  assert.equal(trooper.z, 2);
  let lowest = trooper.z;
  run(w, mockInput(), 4, () => (lowest = Math.min(lowest, trooper.z)));
  assert.equal(lowest, 2, 'never left the ledge');
  assert.ok(trooper.x < 9.5, `came to the edge (x=${trooper.x.toFixed(2)})`);
});

test('a monster knocked off a ledge falls, rather than snapping to the floor', () => {
  const w = world(ledge);
  w.player.player.notarget = true;
  const trooper = w.spawn('stormtrooper', 8.7, fine(1.5));
  trooper.vx = -24; // a blast from the east
  const zs = [];
  run(w, mockInput(), 1, () => zs.push(trooper.z));
  assert.ok(trooper.x < 8, 'pushed off the edge');
  assert.ok(zs.some((z) => z > 0.1 && z < 1.9), 'seen mid-fall');
  assert.equal(trooper.z, 0, 'landed on the floor');
});

test('a monster takes the stairs down to reach the player', () => {
  const w = world(stairs);
  const trooper = hunter(w, 'stormtrooper', fine(1.5), fine(2.5));
  run(w, mockInput(), 12);
  assert.equal(trooper.z, 0, 'came down');
  assert.ok(trooper.distanceTo(w.player) < 3, `reached the player (${trooper.distanceTo(w.player).toFixed(2)} away)`);
});

test('a flyer rises to the player on a ledge, and a dead one falls', () => {
  const w = world(ledge);
  w.player.x = fine(5.5);
  w.player.z = 2;
  const fly = hunter(w, 'probe-droid', fine(1.5), fine(1.5));
  assert.ok(Math.abs(fly.z - 0.9) < 1e-9, 'starts hovering 0.9 up');
  run(w, mockInput(), 4);
  assert.ok(fly.x > 7.5, `flew over to the ledge (x=${fly.x.toFixed(2)})`);
  assert.ok(Math.abs(fly.z - 2.9) < 0.01, `hovers 0.9 above the ledge (z=${fly.z.toFixed(2)})`);
  w.damage(fly, 1e6, w.player, w.player);
  run(w, mockInput(), 1.5);
  assert.equal(fly.z, w.map.floorAt(fly.x, fly.y, fly.radius), 'the body drops to the floor');
});
