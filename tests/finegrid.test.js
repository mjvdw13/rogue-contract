import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLevel, resolveLegend } from '../src/engine/world/level.js';
import { blockedByMap } from '../src/engine/world/physics.js';
import { upscaleLevel } from '../tools/lib/upscale.mjs';
import { makeWorld, mockInput, room, run, registry } from './helpers.js';

const FLOOR = { floor: 'imp-floor', ceiling: 'imp-ceiling', light: 160, ceilZ: 6 };

test('upscaling doubles tiles, heights and things, and splits angled walls', () => {
  const level = room(['####', '#.n#', '####'], ['', ' > '], {
    legend: { '.': FLOOR, n: { ...FLOOR, floorZ: 0.5, wall: 'imp-panel', diagonal: 'NE' } },
  });
  const big = upscaleLevel(registry, level, 2);
  assert.equal(big.tiles.length, 6);
  assert.equal(big.tiles[0].length, 8);
  assert.equal(big.legend.n.floorZ, 1, 'heights double');
  assert.equal(big.things[3][3], '>', 'the start moves to the middle of its block');
  // The NE corner tile's 2x2 block: the diagonal runs through the top-left
  // and bottom-right quarters, the top-right is solid, the bottom-left open.
  const block = [big.tiles[2].slice(4, 6), big.tiles[3].slice(4, 6)];
  assert.equal(block[0][0], 'n');
  assert.equal(block[1][1], 'n');
  const { tiles } = resolveLegend(registry, big);
  assert.equal(tiles[block[0][1]].wall, 'imp-panel', 'the solid corner is plain wall');
  assert.equal(tiles[block[1][0]].wall, undefined, 'the open corner is floor');
  assert.equal(tiles[block[1][0]].floorZ, 1);
  assert.deepEqual(buildLevel(registry, big).errors, []);
});

test('a doorway two tiles wide opens and closes as one door', () => {
  const level = room(['######', '#..D.#', '#..D.#', '######'], ['', ' >'], {
    legend: { '.': FLOOR, D: { door: 'imp-door', style: 'rise' } },
  });
  const w = makeWorld(level, { noMonsters: true });
  const [a, b] = w.map.doors;
  assert.equal(a.group, b.group, 'one group');
  assert.equal(a.axis, 'x', 'walls north and south of the doorway as a whole');
  w.openDoor(a);
  assert.equal(b.state, 'opening', 'the other half opens too');
  run(w, mockInput(), 1);
  assert.equal(a.state, 'open');
  assert.equal(b.state, 'open');
});

test('something spawned with its body in a wall is moved clear', () => {
  const w = makeWorld(room(['#####', '#...#', '#...#', '#####'], ['', ' >'], { legend: { '.': FLOOR } }), { noMonsters: true });
  const fat = w.spawn('probe-droid', 2.5, 1.5); // radius 0.64 against the north wall
  assert.equal(blockedByMap(w.map, fat.x, fat.y, fat.radius), false);
  assert.ok(Math.hypot(fat.x - 2.5, fat.y - 1.5) < 0.3, 'only nudged a little');
});
