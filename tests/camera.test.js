import test from 'node:test';
import assert from 'node:assert/strict';
import { makeWorld, mockInput, room, run } from './helpers.js';

const HALL = ['####################', ...Array(5).fill('#..................#'), '####################'];
const hall = () => ({ ...room(HALL, []), list: [{ type: 'player', x: 2.5, y: 3.5, angle: 0 }] });

test('a frame between two ticks draws the eye between where they left it', () => {
  const w = makeWorld(hall(), { noMonsters: true });
  const input = mockInput();
  input.hold('forward');
  run(w, input, 0.5);
  const before = w.camera();
  w.tick(1 / 60, input);
  const after = w.camera();
  assert.ok(after.x > before.x + 0.05, 'walking east');
  assert.ok(Math.abs(w.camera(0).x - before.x) < 1e-9, 'just after the tick: where the one before left it');
  assert.ok(Math.abs(w.camera(0.5).x - (before.x + after.x) / 2) < 1e-9, 'half way: half way');
  assert.equal(w.camera(1).x, after.x, 'at the next tick: where the last left it');
  assert.equal(w.camera(0.5).angle, after.angle, 'turning is not blended');
});

test('a jump of more than a couple of tiles is drawn where it lands, not between', () => {
  const w = makeWorld(hall(), { noMonsters: true });
  w.tick(1 / 60, mockInput());
  w.player.x = 15.5;
  assert.equal(w.camera(0.5).x, 15.5);
});
