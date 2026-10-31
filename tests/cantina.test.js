import test from 'node:test';
import assert from 'node:assert/strict';
import { analyseLevel } from '../tools/lib/levelcheck.mjs';
import { registry } from './helpers.js';
import m1 from '../src/content/levels/m1.js';

// Chalmun's cantina in Mos Eisley is one of the two ways round the blast
// doors: in at its street door, round the bar, out through the back-bar's
// door and the back room to the back door on the back lane. Its furniture
// (the bar, the taps, stools, booths, shelves) is models that collide, and
// mustn't close that way.

/** Mos Eisley walled off but for the cantina, the player starting in the arch at its street door. */
function cantinaAlone() {
  const [x0, y0, x1, y1] = [87, 82, 127, 117];
  const wall = Object.keys(m1.legend).find((k) => m1.legend[k].wall);
  const tiles = m1.tiles.map((row, y) => [...row].map((ch, x) => (x >= x0 && x < x1 && y >= y0 && y < y1 ? ch : wall)).join(''));
  const list = m1.list.filter((t) => t.type !== 'player').concat({ type: 'player', x: 92, y: 83, angle: 270 });
  return { ...m1, tiles, list };
}

test('the cantina leads from its street door round the bar to its back door', () => {
  const a = analyseLevel(registry, cantinaAlone());
  const w = a.built.map.w;
  const reached = (x, y) => a.reached[y * w + x] === 1;
  assert.ok(reached(97, 86), 'through the street door into the entry');
  assert.ok(reached(98, 92), 'down the steps into the room');
  assert.ok(reached(96, 104), "behind the bar, past the east arm's end");
  assert.ok(reached(98, 110) || reached(99, 110), "the back-bar's door");
  assert.ok(reached(125, 106), 'the passage to the back door');
});

test("behind the storeroom a secret door in the plaster opens into the secret back room", () => {
  const a = analyseLevel(registry, cantinaAlone());
  const { map } = a.built;
  const door = map.doors[map.doorIndex[map.index(113, 103)]];
  assert.ok(door?.secret, 'a secret door in the storeroom\'s north wall');
  assert.ok(a.reached[map.index(114, 100)] === 1, 'the room behind it is reached');
  assert.deepEqual(a.problems.filter((p) => p.includes('secret')), [], 'and counted as a secret that can be reached');
});
