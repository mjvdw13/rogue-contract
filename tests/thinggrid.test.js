import test from 'node:test';
import assert from 'node:assert/strict';
import { makeWorld, mockInput, room } from './helpers.js';

// A long hall, the player at its far east end, out of the way.
const HALL = ['##########################', ...Array(5).fill('#........................#'), '##########################'];
const hall = () => ({ ...room(HALL, []), list: [{ type: 'player', x: 23.5, y: 5.5, angle: Math.PI }] });

test('a solid thing blocks a mover where it has been put by hand, not where it was', () => {
  const w = makeWorld(hall(), { noMonsters: true });
  const crate = w.spawn('crate-tan', 3.5, 2.5);
  w.tick(1 / 60, mockInput());
  crate.x = 18.5;
  const p = w.player;
  assert.equal(w.checkPosition(p, 18.5, 3.2), false, 'blocked at its new place');
  assert.equal(w.checkPosition(p, 3.5, 3.2), true, 'free at its old one');
});

test('a thing that slid away earlier in a tick blocks one that moves later in it', () => {
  const w = makeWorld(hall(), { noMonsters: true });
  // Two crates sliding at each other along the hall: the first slides into
  // the second's path, and into a block of the collision grid it wasn't in.
  const a = w.spawn('crate-tan', 2.5, 2.5);
  const b = w.spawn('crate-tan', 8, 2.5);
  a.vx = 150;
  b.vx = -150;
  w.tick(1 / 60, mockInput());
  assert.ok(a.x > 4.5, 'the first slid on');
  assert.ok(b.x - a.x >= a.radius + b.radius - 1e-6, `the second stopped against it (${a.x.toFixed(2)}, ${b.x.toFixed(2)})`);
});
