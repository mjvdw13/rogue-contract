import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLevel } from '../src/engine/world/level.js';
import { FlowField, UNREACHABLE, WALKER } from '../src/engine/world/nav.js';
import { makeWorld, mockInput, room, run, registry } from './helpers.js';

const TALL = { floor: 'imp-floor', ceiling: 'imp-ceiling', light: 160, ceilZ: 3 };
const at = (z) => ({ ...TALL, floorZ: z });
const LEGEND = { '.': TALL, h: at(1), a: at(0.25), b: at(0.5), c: at(0.75), v: { ...TALL, ceilZ: 0.9 } };

// A floor along row 1 with a ledge on row 2 that stairs at the east end lead
// down from: the walking route from the ledge to (1, 1) goes the long way.
const stairs = room(['##########', '#........#', '#hhhhhcba#', '##########'], ['', ' >'], { legend: LEGEND });

// A floor with a ledge at its east end and no way up.
const ledge = room(['########', '#...hhh#', '#...hhh#', '########'], ['', ' >'], { legend: LEGEND });

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
  walker.update(1, 1, true);
  const d = (f, x, y) => f.dist[y * map.w + x];
  assert.equal(d(walker, 1, 2), 15, 'off the ledge by the stairs at the far end');
  const flyer = new FlowField(map, { ...WALKER, flying: true });
  flyer.update(1, 1, true);
  assert.equal(d(flyer, 1, 2), 1, 'a flyer drops straight down');

  const { map: m2 } = buildLevel(registry, ledge);
  const w2 = new FlowField(m2, WALKER);
  w2.update(1, 1, true);
  assert.equal(w2.dist[1 * m2.w + 5], UNREACHABLE, 'no way up the ledge');
  w2.update(5, 1, true);
  assert.equal(w2.dist[1 * m2.w + 1], UNREACHABLE, 'and no walking off it');

  const vent = buildLevel(registry, room(['#######', '#..v..#', '#######'], ['', ' >'], { legend: LEGEND })).map;
  const short = new FlowField(vent, WALKER);
  short.update(1, 1, true);
  assert.equal(short.dist[1 * vent.w + 5], 4, 'a trooper (0.88) fits under the 0.9 vent');
  const tall = new FlowField(vent, { ...WALKER, height: 1.1 });
  tall.update(1, 1, true);
  assert.equal(tall.dist[1 * vent.w + 5], UNREACHABLE, 'a 1.1-tall body does not');
});

test('a monster on a ledge stays on it rather than walking off', () => {
  const w = world(ledge);
  const trooper = hunter(w, 'stormtrooper', 5.5, 1.5);
  assert.equal(trooper.z, 1);
  let lowest = trooper.z;
  run(w, mockInput(), 4, () => (lowest = Math.min(lowest, trooper.z)));
  assert.equal(lowest, 1, 'never left the ledge');
  assert.ok(trooper.x < 4.5, `came to the edge (x=${trooper.x.toFixed(2)})`);
});

test('a monster knocked off a ledge falls, rather than snapping to the floor', () => {
  const w = world(ledge);
  w.player.player.notarget = true;
  const trooper = w.spawn('stormtrooper', 4.35, 1.5);
  trooper.vx = -12; // a blast from the east
  const zs = [];
  run(w, mockInput(), 1, () => zs.push(trooper.z));
  assert.ok(trooper.x < 4, 'pushed off the edge');
  assert.ok(zs.some((z) => z > 0.05 && z < 0.95), 'seen mid-fall');
  assert.equal(trooper.z, 0, 'landed on the floor');
});

test('a monster takes the stairs down to reach the player', () => {
  const w = world(stairs);
  const trooper = hunter(w, 'stormtrooper', 1.5, 2.5);
  run(w, mockInput(), 12);
  assert.equal(trooper.z, 0, 'came down');
  assert.ok(trooper.distanceTo(w.player) < 1.5, `reached the player (${trooper.distanceTo(w.player).toFixed(2)} away)`);
});

test('a flyer rises to the player on a ledge, and a dead one falls', () => {
  const w = world(ledge);
  w.player.x = 5.5;
  w.player.z = 1;
  const fly = hunter(w, 'probe-droid', 1.5, 1.5);
  assert.ok(Math.abs(fly.z - 0.45) < 1e-9, 'starts hovering 0.45 up');
  run(w, mockInput(), 4);
  assert.ok(fly.x > 3.5, `flew over to the ledge (x=${fly.x.toFixed(2)})`);
  assert.ok(Math.abs(fly.z - 1.45) < 0.01, `hovers 0.45 above the ledge (z=${fly.z.toFixed(2)})`);
  w.damage(fly, 1e6, w.player, w.player);
  run(w, mockInput(), 1.5);
  assert.equal(fly.z, w.map.floorAt(fly.x, fly.y, fly.radius), 'the body drops to the floor');
});
