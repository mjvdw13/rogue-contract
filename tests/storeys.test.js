import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLevel } from '../src/engine/world/level.js';
import { F_SLAB } from '../src/engine/world/tilemap.js';
import { registry, room } from './helpers.js';

// Two storeys per tile (PLAN.md Phase 1c): a tile's `slab` is a solid layer
// inside its open space, with a storey under it and one on top.

// A tall hall (ceiling 8) with a bridge (`=`): a slab from 3 to 3.5.
const HALL = { floor: 'imp-floor', ceiling: 'imp-ceiling', light: 160, ceilZ: 8 };
const BRIDGE = { ...HALL, slab: { bottom: 3, top: 3.5, floor: 'lift-floor', side: 'imp-stripe', light: 112 } };

test('a slab is parsed: heights, textures (with defaults) and the lower storey light', () => {
  const level = room(['#####', '#.=b#', '#####'], ['', ' >'], {
    legend: { '.': HALL, '=': BRIDGE, b: { ...HALL, slab: { bottom: 2, top: 2.25 } } },
  });
  const b = buildLevel(registry, level, { textureSlot: (id) => ['imp-floor', 'imp-ceiling', 'lift-floor', 'imp-stripe'].indexOf(id) });
  assert.deepEqual(b.errors, []);
  const m = b.map;
  const i = m.index(2, 1);
  assert.ok(m.flags[i] & F_SLAB);
  assert.equal(m.slabBot[i], 3);
  assert.equal(m.slabTop[i], 3.5);
  assert.equal(m.slabTopTex[i], 2, 'its own top texture');
  assert.equal(m.slabUnderTex[i], 1, 'the underside defaults to the tile ceiling');
  assert.equal(m.slabSideTex[i], 3);
  assert.equal(m.storeyLight(i, 0), 112, 'the lower storey has its own light');
  assert.equal(m.storeyLight(i, 1), 160, 'the upper storey has the tile light');
  const j = m.index(3, 1);
  assert.equal(m.slabTopTex[j], 0, 'the top defaults to the tile floor');
  assert.equal(m.storeyLight(j, 0), 160, 'no light given: the same as the tile');
  assert.ok(!(m.flags[m.index(1, 1)] & F_SLAB));
});

test('bad slabs are reported', () => {
  const bad = (slab, extra = {}) =>
    buildLevel(registry, room(['#####', '#.x.#', '#####'], ['', ' >'], { legend: { '.': HALL, x: { ...HALL, ...extra, slab } } })).errors.join('\n');
  assert.match(bad({ bottom: 0, top: 1 }), /bottom must be above the floor/);
  assert.match(bad({ bottom: 3, top: 8 }), /top must be below the ceiling/);
  assert.match(bad({ bottom: 3, top: 3 }), /top must be above its bottom/);
  assert.match(bad({ top: 3 }), /needs "bottom" and "top"/);
  assert.match(bad({ bottom: 1, top: 2 }, { wall: 'imp-panel' }), /needs an open tile/);
  assert.match(bad({ bottom: 1, top: 2 }, { lift: { stops: [0, 2] } }), /needs an open tile/);
  assert.equal(bad({ bottom: 1, top: 2 }), '');
});

test('floor and ceiling lookups answer for the storey a body reaches', () => {
  const b = buildLevel(registry, room(['#####', '#.=.#', '#####'], ['', ' >'], { legend: { '.': HALL, '=': BRIDGE } }));
  const m = b.map;
  const i = m.index(2, 1);
  assert.equal(m.storeyAt(i, 0.8), 0, 'standing on the hall floor: under the bridge');
  assert.equal(m.storeyAt(i, 4), 1, 'reaching its top: on the bridge');
  assert.equal(m.floorAt(2.5, 1.5, 0, 0.8), 0);
  assert.equal(m.ceilAt(2.5, 1.5, 0, 0.8), 3, 'the underside is the lower storey ceiling');
  assert.equal(m.floorAt(2.5, 1.5, 0, 4), 3.5);
  assert.equal(m.ceilAt(2.5, 1.5, 0, 4), 8);
  assert.equal(m.floorAt(2.5, 1.5), 3.5, 'without a reach: the top storey');
  assert.equal(m.lowFloorAt(2.5, 1.5, 0, 0.8), 0);
  // A body overlapping the bridge and the hall beside it.
  assert.equal(m.floorAt(2.1, 1.5, 0.5, 4), 3.5, 'on top: the highest floor under it');
  assert.equal(m.ceilAt(2.1, 1.5, 0.5, 0.8), 3, 'underneath: the lowest ceiling over it');
});

test('a rising door beside a slab tile opens to the storey it leads onto', () => {
  // A door in the west wall of a room whose first tile, inside the door, is under a bridge.
  const level = room(['#######', '#..D=.#', '#######'], ['', ' >'], {
    legend: { '.': HALL, '=': BRIDGE, D: { door: 'imp-door', style: 'rise', floor: 'imp-floor', light: 160 } },
  });
  const b = buildLevel(registry, level);
  const door = b.map.doorAt(3, 1);
  assert.ok(door);
  assert.equal(door.openZ, 3, 'the bridge underside, not the hall ceiling above it');
});
