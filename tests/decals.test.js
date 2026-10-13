import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLevel } from '../src/engine/world/level.js';
import { makeDecal, layoutDecals, removeDecal } from '../src/engine/world/decals.js';
import { headlessRenderer, makeWorld, mockInput, registry, room, run } from './helpers.js';

// Decals (PLAN.md Phase 1d step 7): see-through pictures on wall and step
// faces, and the scorch marks blaster bolts leave.

const ROOM = { floor: 'imp-floor', ceiling: 'imp-ceiling', ceilZ: 4, light: 160 };
const TILES = ['##########', '#........#', '#........#', '#........#', '##########'];
const level = (decals) => room(TILES, ['', ' >'], { legend: { '.': ROOM }, decals });

test('a decal is laid out on the tile edges it covers, on the side it faces', () => {
  const { map, errors } = buildLevel(registry, level([{ x: 9, y: 2.5, z: 1.5, face: 'W', tex: 'decal-crest', scale: 2 }]));
  assert.deepEqual(errors, []);
  const [d] = map.decals;
  d.tex = 1;
  layoutDecals(map, [null, { w: 32, h: 32 }]); // (32 texels a tile: 1 tile, 2 at scale 2)
  assert.equal(map.decalsDirty, false);
  assert.deepEqual([d.a0, d.a1, d.z0, d.z1], [1.5, 3.5, 0.5, 2.5]);
  // The east wall (x 9) faces west, rows 1 to 3.
  assert.deepEqual(d.edges, [1, 2, 3].map((y) => map.index(9, y) * 4 + 3));
  assert.equal(map.decalEdge[map.index(9, 2) * 4 + 3], 1);
  removeDecal(map, d);
  assert.equal(map.decalEdge[map.index(9, 2) * 4 + 3], 0);
  assert.equal(map.decals.length, 0);
});

test('bad decals are level errors', () => {
  const { errors } = buildLevel(registry, level([
    { x: 9, y: 2, z: 1, face: 'up', tex: 'decal-crest' },
    { x: 9, y: 2, face: 'W', tex: 'decal-crest' },
    { x: 9, y: 2, z: 1, face: 'W' },
    { x: 40, y: 2, z: 1, face: 'W', tex: 'decal-crest' },
  ]));
  assert.equal(errors.length, 4, errors.join('\n'));
  assert.match(errors[0], /"face"/);
  assert.match(errors[1], /"z"/);
  assert.match(errors[2], /"tex"/);
  assert.match(errors[3], /outside the map/);
  assert.equal(makeDecal(buildLevel(registry, level()).map, { x: 9, y: 2, z: 1, face: 'W', tex: 'x', scale: 0 }, () => 0), '"scale" must be above 0');
});

test('bolts leave scorch marks where they hit walls, the last 48 kept', () => {
  const w = makeWorld(level(), { noMonsters: true });
  w.player.x = 2.5;
  w.player.y = 2.5;
  w.player.angle = 0;
  const input = mockInput();
  run(w, input, 0.6);
  input.hold('fire');
  run(w, input, 0.4);
  input.release('fire');
  run(w, input, 0.3);
  assert.ok(w.scorches.length >= 1, 'a mark on the east wall');
  const [s] = w.scorches;
  assert.equal(s.face, 3, 'its west face');
  assert.equal(s.x, 9);
  assert.ok(Math.abs(s.y - 2.5) < 0.2 && s.z > 0.5 && s.z < 2, `where the bolt hit (${s.y}, ${s.z})`);
  for (let k = 0; k < 60; k++) w.scorch('decal-scorch', 9, 1 + (k % 30) / 10, 1, 3);
  assert.equal(w.scorches.length, 48);
  assert.equal(w.map.decals.length, 48);
});

const { renderer, shot } = await headlessRenderer();

test('a decal shows on its face, over the wall, and only there', () => {
  const cam = { x: 1.5, y: 2.5, angle: 0, z: 1 };
  const plain = shot(level(), cam);
  const crest = shot(level([{ x: 9, y: 2.5, z: 1.5, face: 'W', tex: 'decal-crest' }]), cam);
  const back = shot(level([{ x: 9, y: 2.5, z: 1.5, face: 'E', tex: 'decal-crest' }]), cam);
  assert.deepEqual(back, plain, 'facing away: not seen');
  const { w } = renderer.surface;
  const { fy, horizon } = renderer.view;
  // The crest (64 texels: 2 tiles) spans y 1.5 to 3.5 and z 0.5 to 2.5 on the wall 7.5 away.
  const col = (y) => Math.round(w / 2 + ((y - 2.5) * renderer.view.fx) / 7.5);
  const row = (z) => Math.round(horizon + ((cam.z - z) * fy) / 7.5);
  let inside = 0;
  let outside = 0;
  for (let i = 0; i < plain.length; i++) {
    if (plain[i] === crest[i]) continue;
    const x = i % w;
    const y = (i / w) | 0;
    if (x >= col(1.5) - 1 && x <= col(3.5) + 1 && y >= row(2.5) - 1 && y <= row(0.5) + 1) inside++;
    else outside++;
  }
  assert.ok(inside > 100, `drawn over the wall (${inside} pixels)`);
  assert.equal(outside, 0, 'nowhere else');
});
