import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLevel } from '../src/engine/world/level.js';
import { makeWorld, mockInput, room, run } from './helpers.js';
import { registry } from './helpers.js';

// A plain floor with a tall ceiling, so jumps don't hit their heads.
const TALL = { floor: 'carpet', ceiling: 'ceiling-tile', light: 160, ceilZ: 6 };

// A corridor running east from the player start. `row` is the floor glyphs
// east of the start tile; the legend gives each glyph a height.
function corridor(row, legend, extra = {}) {
  const w = row.length + 3;
  return room(['#'.repeat(w), `#.${row}#`, '#'.repeat(w)], ['', ' >'], { legend, ...extra });
}

test('legend heights, height grids and bad ceilings are parsed', () => {
  const level = room(['#####', '#.hx#', '#####'], ['', ' >'], {
    legend: { h: { base: '.', floorZ: 0.5, ceilZ: 2 }, x: { base: '.', floorZ: 1, ceilZ: 0.5 } },
    floorHeights: ['', '..4'],
  });
  const b = buildLevel(registry, level);
  const at = (x) => b.map.index(x, 1);
  assert.equal(b.map.floorZ[at(1)], 0);
  assert.equal(b.map.ceilZ[at(1)], 1, 'defaults reproduce the flat engine');
  assert.equal(b.map.floorZ[at(2)], 0.5, 'the grid digit (4 x 0.125) agrees with the legend');
  assert.equal(b.map.ceilZ[at(2)], 2);
  assert.ok(b.errors.some((e) => e.includes('ceiling below its floor')));
});

test('stairs: the player walks up steps and ends on the top floor', () => {
  const w = makeWorld(corridor('sssshhh', { s: TALL, h: { base: '.', floorZ: 0.5, ceilZ: 2 }, '.': TALL }, { floorHeights: ['', '  1234'] }));
  const input = mockInput();
  input.hold('forward');
  run(w, input, 2);
  assert.ok(w.player.x > 7, `walked to the top (x=${w.player.x.toFixed(2)})`);
  assert.equal(w.player.z, 0.5);
});

test('a ledge higher than a step blocks walking, but a jump gets onto it', () => {
  const level = corridor('hhhh', { h: { base: '.', floorZ: 0.5, ceilZ: 2 }, '.': TALL });
  const walker = makeWorld(level);
  const input = mockInput();
  input.hold('forward');
  run(walker, input, 1.5);
  assert.ok(walker.player.x < 2, 'stopped at the ledge');
  assert.equal(walker.player.z, 0);

  const jumper = makeWorld(level);
  const j = mockInput();
  j.hold('forward');
  run(jumper, j, 0.3);
  j.tap('jump');
  run(jumper, j, 1.5);
  assert.ok(jumper.player.x > 3, 'jumped up onto the ledge');
  assert.equal(jumper.player.z, 0.5);
});

test('walking off a ledge falls back to the floor below, and long falls hurt', () => {
  const legend = { h: { base: '.', floorZ: 0.75, ceilZ: 6 }, H: { base: '.', floorZ: 4, ceilZ: 6 }, '.': TALL };
  // Short drop: no damage.
  const low = makeWorld(room(['######', '#hh..#', '######'], ['', ' >'], { legend }));
  const input = mockInput();
  input.hold('forward');
  run(low, input, 1.5);
  assert.equal(low.player.z, 0);
  assert.equal(low.player.player.health, 100);
  // A four-unit drop hurts.
  const high = makeWorld(room(['######', '#HH..#', '######'], ['', ' >'], { legend }));
  run(high, input, 2);
  assert.equal(high.player.z, 0);
  assert.ok(high.player.player.health < 100, `fall damage (health ${high.player.player.health})`);
});

test('crouching gets through a low vent, and you cannot stand up inside it', () => {
  const level = corridor('vvvv..', { v: { base: '.', ceilZ: 0.6 } });
  const standing = makeWorld(level);
  const input = mockInput();
  input.hold('forward');
  run(standing, input, 1.5);
  assert.ok(standing.player.x < 2, 'too tall to fit');

  const crouched = makeWorld(level);
  const c = mockInput();
  c.hold('forward');
  c.hold('crouch');
  run(crouched, c, 1);
  assert.ok(crouched.player.x > 3 && crouched.player.x < 6, 'in the vent');
  c.release('crouch');
  c.release('forward');
  run(crouched, c, 0.2);
  assert.ok(crouched.player.player.crouching, 'stays crouched under the low ceiling');
  c.hold('forward');
  run(crouched, c, 2);
  assert.ok(crouched.player.x > 6, 'came out the far side');
  run(crouched, c, 0.5);
  assert.equal(crouched.player.player.crouching, false, 'stood up once there was room');
});

test('the camera rides on the floor, and the view tilts with pitch', () => {
  const w = makeWorld(room(['####', '#h.#', '####'], ['', ' >'], { legend: { h: { base: '.', floorZ: 0.5, ceilZ: 2 } } }));
  assert.equal(w.player.z, 0.5);
  w.player.pitch = 30;
  const cam = w.camera();
  assert.ok(Math.abs(cam.z - 1) < 1e-6, `eye at floor + eye height (${cam.z})`);
  assert.equal(cam.horizonOffset, 30);
});

test('monsters on a raised floor stand on it, and solid things only collide at the same height', () => {
  const level = room(['#####', '#.hh#', '#####'], ['', ' >!'], {
    legend: { h: { base: '.', floorZ: 1, ceilZ: 3 }, '.': TALL },
  });
  const w = makeWorld(level);
  const ant = w.things.find((t) => t.def.id === 'ant');
  assert.equal(ant.z, 1);
  // Put the ant just ahead of the player, still at its ledge height.
  ant.x = 1.85;
  w.player.x = 1.3;
  w.player.z = 0;
  assert.equal(w.checkPosition(w.player, 1.35, 1.5), true, 'below the ant: walks under it');
  w.player.z = 1;
  assert.equal(w.checkPosition(w.player, 1.35, 1.5), false, 'same height: blocked by the ant');
});
