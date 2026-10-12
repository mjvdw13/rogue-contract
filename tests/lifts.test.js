import test from 'node:test';
import assert from 'node:assert/strict';
import { makeWorld, mockInput, room, run } from './helpers.js';
import { runActions } from '../src/engine/world/actions.js';

const TALL = { floor: 'imp-floor', ceiling: 'imp-ceiling', light: 160, ceilZ: 4 };

// The player starts on tile 1; the lift `L` is the tile east of the start.
function liftRoom(lift, extra = {}) {
  return room(['######', '#.L..#', '######'], ['', ' >'], {
    legend: { '.': TALL, L: { ...TALL, floor: 'elevator-floor', tag: 'cab', lift }, ...(extra.legend ?? {}) },
    ...extra,
  });
}

test('a return lift carries the player up, waits, and brings them back down', () => {
  const w = makeWorld(liftRoom({ stops: [0, 1.5], speed: 2, wait: 1 }));
  const lift = w.map.lifts[0];
  assert.equal(w.map.lifts.length, 1);
  const input = mockInput();
  w.player.x = 2.5; // step onto the lift
  run(w, input, 0.05);
  assert.equal(lift.state, 'moving');
  run(w, input, 1);
  assert.equal(lift.z, 1.5);
  assert.equal(w.player.z, 1.5, 'rode up with it');
  assert.equal(lift.state, 'waiting');
  run(w, input, 2);
  assert.equal(lift.z, 0);
  assert.equal(w.player.z, 0, 'rode back down');
  assert.equal(lift.state, 'idle');
});

test('a toggle lift moves one stop per use and stays there', () => {
  const w = makeWorld(liftRoom({ stops: [0, 0.5, 1], mode: 'toggle', on: ['use'], speed: 4 }));
  const lift = w.map.lifts[0];
  const input = mockInput();
  input.tap('use');
  run(w, input, 0.5);
  assert.equal(lift.z, 0.5);
  run(w, input, 2);
  assert.equal(lift.z, 0.5, 'stays put');
  input.tap('use');
  run(w, input, 0.5);
  assert.equal(lift.z, 1);
  input.tap('use');
  run(w, input, 0.5);
  assert.equal(lift.z, 0, 'wraps around to the first stop');
});

test('a cycling lift runs on its own', () => {
  const w = makeWorld(liftRoom({ stops: [0, 1], mode: 'cycle', speed: 2, wait: 0.5 }));
  const lift = w.map.lifts[0];
  const seen = new Set();
  run(w, mockInput(), 4, () => seen.add(lift.z));
  assert.ok(seen.has(0) && seen.has(1), 'visits both stops');
});

test('a lift backs off instead of crushing the player against the ceiling', () => {
  // The cab's ceiling is 3 up: riding to 2 would squeeze a 1.7-tall player.
  const w = makeWorld(liftRoom(null, { legend: { L: { ...TALL, ceilZ: 3, tag: 'cab', lift: { stops: [0, 2], speed: 2, on: ['use'] } } } }));
  const lift = w.map.lifts[0];
  w.player.x = 2.5;
  runActions(w, [{ action: 'lift', tag: 'cab' }]);
  let highest = 0;
  run(w, mockInput(), 2, () => (highest = Math.max(highest, lift.z)));
  assert.ok(highest + w.player.height <= 3 + 1e-6, `never squeezed the player (peak ${highest.toFixed(3)})`);
  assert.equal(lift.z, 0, 'went back down');
});

test('an elevator cab that moves its ceiling too', () => {
  const w = makeWorld(liftRoom({ stops: [0, 2], moves: 'both', speed: 4, on: ['use'] }));
  const i = w.map.index(2, 1);
  assert.equal(w.map.ceilZ[i], 4);
  w.player.x = 2.5;
  runActions(w, [{ action: 'lift', tag: 'cab' }]);
  run(w, mockInput(), 1);
  assert.equal(w.map.floorZ[i], 2);
  assert.equal(w.map.ceilZ[i], 6);
  assert.equal(w.player.z, 2);
});

test('rising doors open to the lowest ceiling beside them and let the player through', () => {
  const level = room(['#####', '#.D,#', '#####'], ['', ' >'], {
    legend: { '.': { ...TALL, ceilZ: 3 }, ',': TALL, D: { door: 'imp-door', style: 'rise' } },
  });
  const w = makeWorld(level);
  const door = w.map.doors[0];
  const i = w.map.index(2, 1);
  assert.equal(door.style, 'rise');
  assert.equal(door.openZ, 3, 'the lower neighbour sets the opening');
  assert.equal(w.map.ceilZ[i], 0, 'closed: the ceiling sits on the floor');
  const input = mockInput();
  input.hold('forward');
  run(w, input, 0.5);
  assert.ok(w.player.x < 2, 'a closed door blocks');
  input.tap('use');
  run(w, input, 1.5);
  assert.ok(w.player.x > 3, 'walked through once it rose');
  assert.equal(w.map.ceilZ[i], 3);
});
