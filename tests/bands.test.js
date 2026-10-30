import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLevel } from '../src/engine/world/level.js';
import { upscaleLevel } from '../tools/lib/upscale.mjs';
import { headlessRenderer, registry, room } from './helpers.js';

// Wall bands (PLAN.md Phase 1d step 6): a wall's texture can change with
// height, like Imperial panels with rock above and a trim along the floor.

const ROOM = { floor: 'imp-floor', ceiling: 'imp-ceiling', ceilZ: 4, light: 160 };
const TILES = ['##########', '#........#', '#........#', '#........#', '##########'];
const BANDS = [{ from: 2, tex: 'sandstone' }, { to: 0.5, tex: 'imp-stripe' }];
const level = (wall) => room(TILES, ['', ' >'], { legend: { '.': ROOM, '#': wall } });

test('bands are parsed per wall glyph, and bad ones are errors', () => {
  const { map, errors } = buildLevel(registry, level({ wall: 'imp-panel', bands: BANDS }));
  assert.deepEqual(errors, []);
  assert.equal(map.bandSets.length, 1, 'one set, shared by the glyph\'s walls');
  const set = map.bandSets[map.bandIndex[map.index(9, 2)]];
  assert.deepEqual(set.map((b) => [b.from, b.to]), [[2, Infinity], [-Infinity, 0.5]]);
  assert.equal(map.bandIndex[map.index(4, 2)], -1, 'open floor has none');
  const bad = buildLevel(registry, level({ wall: 'imp-panel', bands: [{ from: 1 }, { tex: 'sandstone' }, { from: 3, to: 2, tex: 'sandstone' }] }));
  assert.equal(bad.errors.length, 3, bad.errors.join('\n'));
  assert.match(bad.errors[0], /needs a "tex"/);
  assert.match(bad.errors[1], /"from" or a "to"/);
  assert.match(bad.errors[2], /above its "from"/);
});

test('upscaling a level scales its band heights', () => {
  const up = upscaleLevel(registry, level({ wall: 'imp-panel', bands: BANDS }), 2);
  const wall = Object.values(up.legend).find((e) => e.bands);
  assert.deepEqual(wall.bands.map((b) => [b.from, b.to]), [[4, undefined], [undefined, 1]]);
});

const { renderer, shot } = await headlessRenderer();

test('a banded wall shows each band\'s texture over its heights, and the wall\'s elsewhere', () => {
  const cam = { x: 1.5, y: 2.5, angle: 0, z: 1 };
  const banded = shot(level({ wall: 'imp-panel', bands: BANDS }), cam);
  const panel = shot(level({ wall: 'imp-panel' }), cam);
  const rock = shot(level({ wall: 'sandstone' }), cam);
  const { w } = renderer.surface;
  const { fy, horizon } = renderer.view;
  // The far wall (x 9), 7.5 away, down the middle column.
  const x = w >> 1;
  const row = (z) => Math.ceil(horizon + ((cam.z - z) * fy) / 7.5 - 0.5);
  const column = (px, a, b) => Array.from({ length: b - a }, (_, k) => px[(a + k) * w + x]);
  const [top, r2, r05, bottom] = [row(4), row(2), row(0.5), row(0)];
  assert.deepEqual(column(banded, top + 1, r2 - 1), column(rock, top + 1, r2 - 1), 'rock above 2');
  assert.deepEqual(column(banded, r2 + 1, r05 - 1), column(panel, r2 + 1, r05 - 1), 'the wall between');
  assert.notDeepEqual(column(banded, r05 + 1, bottom - 1), column(panel, r05 + 1, bottom - 1), 'the trim below 0.5');
});

test('an angled wall shows its tile\'s bands too', () => {
  const cam = { x: 1.5, y: 2.5, angle: 0, z: 1 };
  // A line down the middle of column 8, solid on its east side: the face is 7 away.
  const slanted = (bands) =>
    room(['##########', '#.......A#', '#.......A#', '#.......A#', '##########'], ['', ' >'], {
      legend: { '.': ROOM, '#': { wall: 'imp-panel' }, A: { ...ROOM, wall: 'imp-panel', line: [0.5, 1, 0.5, 0], ...(bands && { bands }) } },
    });
  const banded = shot(slanted(BANDS), cam);
  const plain = shot(slanted(), cam);
  const { w } = renderer.surface;
  const { fy, horizon } = renderer.view;
  const x = w >> 1;
  const row = (z) => Math.ceil(horizon + ((cam.z - z) * fy) / 7 - 0.5);
  const column = (px, a, b) => Array.from({ length: b - a }, (_, k) => px[(a + k) * w + x]);
  const [r2, r05, bottom] = [row(2), row(0.5), row(0)];
  assert.deepEqual(column(banded, r2 + 1, r05 - 1), column(plain, r2 + 1, r05 - 1), 'the wall between');
  assert.notDeepEqual(column(banded, r05 + 1, bottom - 1), column(plain, r05 + 1, bottom - 1), 'the trim below 0.5');
  assert.notDeepEqual(column(banded, row(4) + 1, r2 - 1), column(plain, row(4) + 1, r2 - 1), 'rock above 2');
});
