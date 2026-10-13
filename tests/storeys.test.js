import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLevel } from '../src/engine/world/level.js';
import { F_SLAB } from '../src/engine/world/tilemap.js';
import { traceRay3D, lineOfSight3D, fenceBlocks } from '../src/engine/world/physics.js';
import { FlowField, UNREACHABLE } from '../src/engine/world/nav.js';
import { analyseLevel } from '../tools/lib/levelcheck.mjs';
import { registry, room, makeWorld, mockInput, run } from './helpers.js';

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

// ------------------------------------------------------------ movement and combat

// A corridor three tiles wide, running east, under an open sky, with a span
// of slab tiles (`=`) across it. The player starts at its west end.
function corridor(bridgeCols, slab, { startZ } = {}) {
  const legend = {
    '.': { floor: 'imp-floor', ceiling: 'sky', light: 160, ceilZ: 8 },
    '=': { floor: 'imp-floor', ceiling: 'sky', light: 160, ceilZ: 8, slab },
  };
  const row = (x) => (x >= bridgeCols[0] && x < bridgeCols[1] ? '=' : '.');
  const inner = Array.from({ length: 10 }, (_, k) => row(k + 1)).join('');
  return room(['#'.repeat(12), `#${inner}#`, `#${inner}#`, `#${inner}#`, '#'.repeat(12)], [], {
    legend,
    list: [{ type: 'player', x: 1.5, y: 2.5, angle: 0, z: startZ }],
  });
}
const SLAB = { bottom: 3, top: 3.5 };

test('the player walks under a bridge, on the floor', () => {
  const w = makeWorld(corridor([4, 8], SLAB));
  const input = mockInput();
  input.hold('forward');
  let highest = 0;
  run(w, input, 1.5, () => (highest = Math.max(highest, w.player.z)));
  assert.ok(w.player.x > 9, `walked through (x=${w.player.x.toFixed(2)})`);
  assert.equal(highest, 0, 'never left the floor');
});

test('the player walks along a bridge, then drops off its end', () => {
  const w = makeWorld(corridor([1, 6], SLAB, { startZ: 3.5 }), { noMonsters: true });
  assert.equal(w.player.z, 3.5, 'the start z puts the player on top');
  const input = mockInput();
  input.hold('forward');
  let onTop = true;
  run(w, input, 2, () => {
    if (w.player.x < 6 - w.player.radius && w.player.z !== 3.5) onTop = false;
  });
  assert.ok(onTop, 'stayed on top while over it');
  assert.ok(w.player.x > 8);
  assert.equal(w.player.z, 0, 'fell to the floor past its end');
});

test('a low slab: too low to walk under, but a jump gets onto it', () => {
  const low = { bottom: 1, top: 1.25 };
  const walker = makeWorld(corridor([5, 11], low));
  const input = mockInput();
  input.hold('forward');
  run(walker, input, 1.5);
  assert.ok(walker.player.x < 5, `stopped at its edge (x=${walker.player.x.toFixed(2)})`);
  assert.equal(walker.player.z, 0);

  const jumper = makeWorld(corridor([5, 11], low));
  const j = mockInput();
  j.hold('forward');
  run(jumper, j, 0.25);
  j.tap('jump');
  run(jumper, j, 1.5);
  assert.ok(jumper.player.x > 6, 'jumped up onto it');
  assert.equal(jumper.player.z, 1.25);
});

test('jumping under a slab bumps your head on its underside', () => {
  const w = makeWorld(corridor([1, 11], { bottom: 2, top: 2.5 }));
  const input = mockInput();
  input.tap('jump');
  let highest = 0;
  run(w, input, 1, () => (highest = Math.max(highest, w.player.z)));
  assert.ok(highest > 0.2, 'left the floor');
  assert.ok(highest <= 2 - w.player.height + 1e-6, `head stopped at the underside (z=${highest.toFixed(3)})`);
});

test('3D rays: slab undersides are ceilings (not sky), tops are floors, edges walls', () => {
  const w = makeWorld(corridor([4, 8], SLAB));
  const m = w.map;
  const up = traceRay3D(m, 5.5, 2.5, 1, 1, 0, 10);
  assert.equal(up.hit, 'ceiling');
  assert.equal(up.sky, false, 'the underside, though the sky is above the bridge');
  assert.ok(Math.abs(up.z - 3) < 1e-6);
  const down = traceRay3D(m, 5.5, 2.5, 5, 1, 0, -10);
  assert.equal(down.hit, 'floor');
  assert.ok(Math.abs(down.z - 3.5) < 1e-6);
  const edge = traceRay3D(m, 1.5, 2.5, 3.2, 1, 0, 0);
  assert.equal(edge.hit, 'wall');
  assert.ok(Math.abs(edge.dist - 2.5) < 1e-6, 'stopped at the edge (x=4)');
  const under = traceRay3D(m, 1.5, 2.5, 1, 1, 0, 0);
  assert.ok(under.dist > 9, 'passed underneath to the far wall');
  const over = traceRay3D(m, 1.5, 2.5, 5, 1, 0, 0);
  assert.ok(over.dist > 9, 'and over the top');
  const sky = traceRay3D(m, 1.5, 2.5, 1, 1, 0, 3);
  assert.equal(sky.sky, true, 'beside the bridge, still into the sky');
  assert.equal(lineOfSight3D(m, 5.5, 2.5, 1.5, 6, 2.5, 4.5), false, 'no sight through it');
});

test('projectiles fly under a slab, and burst on its edge', () => {
  const fly = (z) => {
    const w = makeWorld(corridor([4, 8], SLAB), { noMonsters: true });
    const p = w.spawnProjectile('blaster-bolt', w.player, 0, {}, { z, slope: 0 });
    p.z = z;
    let x = p.x;
    run(w, mockInput(), 1, () => {
      if (!p.removed && p.state !== 'exploding') x = p.x;
    });
    return x;
  };
  assert.ok(fly(1) > 9, 'under it, on to the far wall');
  assert.ok(fly(3.25) < 4.1, 'into its edge');
  assert.ok(fly(5) > 9, 'over it');
});

test('things are placed under a slab unless their z puts them on it, and drops land where the body fell', () => {
  const w = makeWorld(corridor([4, 8], SLAB), { noMonsters: true });
  assert.equal(w.spawn('med-kit', 5.5, 2.5).z, 0);
  assert.equal(w.spawn('med-kit', 5.5, 2.5, 0, 3.5).z, 3.5);
  const officer = w.spawn('officer', 6.5, 2.5, 0, 3.5);
  assert.equal(officer.z, 3.5);
  officer.drops = [{ item: 'keycard-red', chance: 1 }];
  w.damage(officer, 1000, null, w.player);
  const key = w.things.find((t) => t.def.id === 'keycard-red');
  assert.ok(key, 'dropped its keycard');
  assert.equal(key.z, 3.5, 'on the bridge, not under it');
});

// ------------------------------------------------------------ pathfinding

test('the flow field plans over storeys: on top of a bridge and under it are different places', () => {
  // A platform (h) as high as the bridge's top, the bridge (=), then the floor.
  const level = room(['##########', '#hh====..#', '##########'], ['', ' >'], {
    legend: {
      '.': { floor: 'imp-floor', ceiling: 'imp-ceiling', light: 160, ceilZ: 8 },
      h: { floor: 'imp-floor', ceiling: 'imp-ceiling', light: 160, floorZ: 3.5, ceilZ: 8 },
      '=': { floor: 'imp-floor', ceiling: 'imp-ceiling', light: 160, ceilZ: 8, slab: SLAB },
    },
  });
  const { map } = buildLevel(registry, level);
  const nav = new FlowField(map);
  const top = (x) => nav.dist[nav.node(map.index(x, 1), 1)];
  const under = (x) => nav.dist[nav.node(map.index(x, 1), 0)];
  // The player on the platform: the bridge's top leads there, its underside doesn't.
  nav.update(1, 1, true, 4.3);
  assert.equal(top(3), 2);
  assert.equal(top(6), 5);
  assert.equal(under(4), UNREACHABLE, 'no way up from under the bridge');
  assert.equal(nav.distanceAt(5, 1, 4.3), 4, 'a body reaching the top is on it');
  assert.equal(nav.distanceAt(5, 1, 0.8), UNREACHABLE, 'a body on the floor is under it');
  // The player on the floor past the bridge: the other way round.
  nav.update(8, 1, true, 0.8);
  assert.equal(under(3), 5);
  assert.equal(top(3), UNREACHABLE, 'no way down off the top (too far to drop)');
  assert.ok(nav.next(3.5, 1.5, 0.8).tx === 4, 'from under it, on under it');
  // A flyer goes wherever it fits.
  const fly = new FlowField(map, { step: 0, drop: 0, height: 0.85, flying: true });
  fly.update(8, 1, true, 0.8);
  assert.notEqual(fly.dist[fly.node(map.index(4, 1), 1)], UNREACHABLE);
  assert.notEqual(fly.dist[fly.node(map.index(4, 1), 0)], UNREACHABLE);
});

test('a railing along a bridge stops bodies on top, not those walking under it', () => {
  // The bridge runs east-west along row 2, railed on its north edge.
  const hall = { floor: 'imp-floor', ceiling: 'imp-ceiling', light: 160, ceilZ: 8 };
  const level = room(['######', '#....#', '#====#', '#....#', '######'], ['', ' >'], {
    legend: { '.': hall, '=': { ...hall, slab: SLAB, fence: { tex: 'imp-railing', edges: 'N', height: 0.75 } } },
  });
  const { map } = buildLevel(registry, level);
  const nav = new FlowField(map);
  nav.update(2, 1, true, 0.8);
  assert.notEqual(nav.dist[map.index(2, 3)], UNREACHABLE, 'under the bridge, past the railing overhead');
  assert.equal(fenceBlocks(map, 2.5, 2.1, 0.3, 0, 1.7), false, 'a body under it passes');
  assert.equal(fenceBlocks(map, 2.5, 2.1, 0.3, 3.5, 5.2), true, 'a body on top is stopped');
});

// ------------------------------------------------------------ tools

test('the level checker reaches each storey on its own', () => {
  const hall = { floor: 'imp-floor', ceiling: 'imp-ceiling', light: 160, ceilZ: 8 };
  // The bridge (=) is 3.5 up; with stairs (1-7, half a unit each) it can be climbed.
  const level = (stairs) =>
    room(['###############', `#..${stairs}====#`, '###############'], ['', ' >'], {
      legend: { '.': hall, '=': { ...hall, slab: SLAB }, ...Object.fromEntries([1, 2, 3, 4, 5, 6, 7].map((k) => [String(k), { ...hall, floorZ: k / 2 }])) },
      list: [
        { type: 'med-kit', x: 11.5, y: 1.5 },
        { type: 'shield-unit', x: 11.5, y: 1.5, z: 3.5 },
      ],
    });
  const unreachable = (a) => a.notes.filter((n) => n.includes('unreachable')).map((n) => n.split(' ')[0]);
  const flat = analyseLevel(registry, level('.......'));
  assert.deepEqual(unreachable(flat), ['shield-unit'], 'on the bridge, out of reach; under it, fine');
  const climb = analyseLevel(registry, level('1234567'));
  assert.deepEqual(unreachable(climb), ['med-kit'], 'up the stairs onto the bridge, but the stairs fill the corridor: nothing leads under it');
});
