import test from 'node:test';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { World } from '../src/engine/world/world.js';
import { Rng } from '../src/engine/core/rng.js';
import decor from '../src/content/decor.js';
import { registry, room, mockInput, run } from './helpers.js';

const OPEN = ['#############', '#...........#', '#...........#', '#...........#', '#...........#', '#...........#', '#############'];
const FRAME_W = 224; // the sheet's frame size, as decor.js has it
const FRAME_H = 81;
const ROOM = { floor: 'imp-floor', ceiling: 'imp-ceiling', ceilZ: 4, light: 200 };

function world() {
  return new World({ registry, rng: new Rng(1), settings: {} }, room(OPEN, ['', ' >'], { legend: { '.': ROOM } }), { skill: 3 });
}

test('a dewback stays where it is placed and shifts between its poses', () => {
  const w = world();
  const d = w.spawn('dewback', 8.5, 3.5, 0);
  const frames = new Set();
  run(w, mockInput(), 5, () => frames.add(d.frame));
  assert.equal(d.x, 8.5);
  assert.equal(d.y, 3.5);
  assert.ok(frames.size > 1, 'its idle animation plays');
});

test('a dewback has a frame for every view of every breath, all on its sheet', () => {
  const def = decor.find((d) => d.id === 'dewback');
  const idle = def.anims.idle;
  assert.equal(idle.views.length, 5);
  // The PNG's header holds its size.
  const png = readFileSync(new URL('../assets/sprites/decor/dewback.png', import.meta.url));
  const frames = png.readUInt32BE(16) / FRAME_W;
  assert.equal(frames, Math.floor(frames), 'the sheet is whole frames wide');
  assert.equal(png.readUInt32BE(20), FRAME_H);
  for (const list of idle.views) for (const f of list) assert.ok(f < frames, `frame ${f} is on the sheet`);
});

test('a dewback is solid: the player cannot walk through it', () => {
  const w = world();
  w.spawn('dewback', 6.5, 3.5, 0);
  Object.assign(w.player, { x: 2.5, y: 3.5, angle: 0 });
  const input = mockInput();
  input.hold('forward');
  run(w, input, 3);
  assert.ok(w.player.x < 6.5, `stopped at ${w.player.x.toFixed(2)}, short of its middle`);
});
