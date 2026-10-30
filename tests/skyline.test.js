import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLevel } from '../src/engine/world/level.js';
import { headlessRenderer, makeWorld, room, registry } from './helpers.js';

// The skyline: the highest surface in a level. Over a town of rooftops the
// renderer stops a ray once it looks out over it, as no wall further can
// show but sky; a thing standing taller still shows over it.

const OPEN = { floor: 'desert-sand', ceiling: 'sky', ceilZ: 24, light: 176 };
const yard = room(
  ['##########', '#........#', '#..RR....#', '#..RR....#', '#........#', '#........#', '##########'],
  ['', '', '', '', '        ', ' >'],
  { legend: { '.': { ...OPEN, ceilZ: 1.75 }, R: { ...OPEN, floorZ: 6 } }, sky: 'sky-night' },
);

test("a level's skyline is its highest surface, with room for the things on it", () => {
  const { map } = buildLevel(registry, yard);
  // The roof (the walls stand only as tall as the low sky beside them).
  assert.equal(map.skyline, 6 + 3);
  const low = buildLevel(registry, room(['#####', '#...#', '#####'], ['', ' > '], { legend: { '.': { ...OPEN, ceilZ: 2 } } })).map;
  assert.equal(low.skyline, 2 + 3, 'a low yard');
  const w = makeWorld(room(['#####', '#...#', '#####'], ['', ' >'], { legend: { '.': { ...OPEN, ceilZ: 2 } }, list: [{ type: 'sensor-mast', x: 3.5, y: 1.5 }] }), { noMonsters: true });
  assert.equal(w.map.skyline, 2 + 3, 'a tall thing standing there leaves it as it was');
});

test('stopping rays at the skyline leaves the picture as it was', async () => {
  const { shot } = await headlessRenderer();
  // Blocks of roofs under the full sky, and a ring of low sky by the walls
  // (so they stand no taller than the roofs): rays look out over the
  // rooftops, and stop once they're over the skyline.
  const W = 40;
  const H = 32;
  const rows = Array.from({ length: H }, (_, y) =>
    [...Array(W)].map((_, x) => (x === 0 || y === 0 || x === W - 1 || y === H - 1 ? '#' : x === 1 || y === 1 || x === W - 2 || y === H - 2 ? 'e' : ((x >> 2) + (y >> 2)) % 3 === 0 ? 'R' : '.')).join(''),
  );
  const town = room(rows, ['', '', ' >'], {
    legend: { '.': OPEN, R: { ...OPEN, floorZ: 4 }, e: { ...OPEN, ceilZ: 4.25 } },
    sky: 'sky-night',
  });
  assert.equal(buildLevel(registry, town).map.skyline, 4.25 + 3);
  for (const level of [town, yard]) {
    const { map } = buildLevel(registry, level);
    for (const cam of [{ x: 2.5, y: 2.5, angle: 0.6, z: 1.25 }, { x: 20.5, y: 15.5, angle: 2.5, z: 1.25 }, { x: 6.5, y: 4.5, angle: 0.2, z: 1.25 }]) {
      const stopped = shot(level, cam);
      const saved = map.constructor.prototype.computeSkyline;
      map.constructor.prototype.computeSkyline = function () {
        this.skyline = Infinity;
        return Infinity;
      };
      try {
        assert.deepEqual(stopped, shot(level, cam), `from (${cam.x}, ${cam.y})`);
      } finally {
        map.constructor.prototype.computeSkyline = saved;
      }
    }
  }
});

test('a thing taller than the skyline shows over it, past where the rays stop', async () => {
  const { shot } = await headlessRenderer();
  // A row of roofs (3) across the view, 5.5 ahead: the rays over them stop
  // about 15 out (the skyline is 6), short of a mast (8.1) 19 out that
  // stands up over the roofs.
  const rows = Array.from({ length: 9 }, (_, y) =>
    [...Array(40)].map((_, x) => (x === 0 || y === 0 || x === 39 || y === 8 ? '#' : x === 1 || y === 1 || x === 38 || y === 7 ? 'e' : x >= 8 && x < 11 ? 'R' : '.')).join(''),
  );
  const level = room(rows, ['', '', ' >'], {
    legend: { '.': OPEN, R: { ...OPEN, floorZ: 3 }, e: { ...OPEN, ceilZ: 3 } },
    sky: 'sky-night',
    list: [{ type: 'sensor-mast', x: 21.5, y: 4.5 }],
  });
  const { map } = buildLevel(registry, level);
  assert.equal(map.skyline, 3 + 3);
  const cam = { x: 2.5, y: 4.5, angle: 0, z: 1.25 };
  const stopped = shot(level, cam);
  assert.notDeepEqual(stopped, shot({ ...level, list: [] }, cam), 'the mast shows');
  const saved = map.constructor.prototype.computeSkyline;
  map.constructor.prototype.computeSkyline = function () {
    this.skyline = Infinity;
    return Infinity;
  };
  try {
    assert.deepEqual(stopped, shot(level, cam), 'as it would with the rays going on');
  } finally {
    map.constructor.prototype.computeSkyline = saved;
  }
});
