import test from 'node:test';
import assert from 'node:assert/strict';
import { canyonBackdrop } from '../src/content/levels/lib/backdrop.js';

// The painted canyon's backdrop (levels/lib/backdrop.js), kept low over the
// level's own rock: it only replaces sky, so it may not stand up over open
// ground beside the rock.

/** A painted level stand-in: rock everywhere but an open floor at 0 west of x = 4. */
const canyon = () => ({
  w: 8,
  h: 8,
  get: (x, y) => (x < 4 ? { floorZ: 0, ceiling: 'sky' } : { wall: true }),
});

test('a low backdrop stays under the open floor at every corner that touches it', () => {
  const p = canyon();
  const bd = canyonBackdrop(p, { margin: 2, low: true, rim: () => 10, tex: 'sandstone' });
  const at = (x, y) => bd.heights[(y - bd.y) * (bd.w + 1) + (x - bd.x)];
  // The corners on the line between the open floor and the rock touch both.
  for (let y = 1; y < 7; y++) assert.ok(at(4, y) <= -2, `corner (4, ${y}) is at ${at(4, y)}`);
  // Inside the rock it stands a tile under the rim.
  assert.equal(at(6, 4), 9);
});
