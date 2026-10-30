import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLevel } from '../src/engine/world/level.js';
import { makeDecal, layoutDecals } from '../src/engine/world/decals.js';
import { headlessRenderer, registry, room } from './helpers.js';

// Decals (PLAN.md Phase 1d step 7): see-through pictures on wall and step
// faces, and grime, which darkens the face under it.

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

const { renderer, shot, palette } = await headlessRenderer();

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

test("a decal shows on a slab's edge too (a sign over a doorway, on its arch's slab)", () => {
  const cam = { x: 1.5, y: 2.5, angle: 0, z: 1 };
  // A slab across column 8 from 2.5 to 3.5: its west edge faces the camera, 6.5 away.
  const slabbed = (decals) =>
    room(['##########', '#.......S#', '#.......S#', '#.......S#', '##########'], ['', ' >'], {
      legend: { '.': ROOM, S: { ...ROOM, slab: { bottom: 2.5, top: 3.5, floor: 'imp-floor', ceiling: 'imp-ceiling', side: 'imp-panel' } } },
      decals,
    });
  const plain = shot(slabbed(), cam);
  const sign = shot(slabbed([{ x: 8, y: 2.5, z: 3, face: 'W', tex: 'decal-crest', scale: 0.4 }]), cam);
  const { w } = renderer.surface;
  const { fy, horizon } = renderer.view;
  const row = (z) => Math.round(horizon + ((cam.z - z) * fy) / 6.5);
  let inside = 0;
  let outside = 0;
  for (let i = 0; i < plain.length; i++) {
    if (plain[i] === sign[i]) continue;
    const y = (i / w) | 0;
    if (y >= row(3.5) - 1 && y <= row(2.5) + 1) inside++;
    else outside++;
  }
  assert.ok(inside > 20, `drawn over the slab's edge (${inside} pixels)`);
  assert.equal(outside, 0, 'nowhere else');
});

test('grime darkens the wall under it, each pixel in its own colour, and nothing else', () => {
  const lum = (i) => palette.rgb[i * 3] * 0.3 + palette.rgb[i * 3 + 1] * 0.59 + palette.rgb[i * 3 + 2] * 0.11;
  const cam = { x: 1.5, y: 2.5, angle: 0, z: 1 };
  const plain = shot(level(), cam);
  // A 2 by 3 tile streak picture over y 1.5 to 3.5 and z 0.5 to 3.5 on the wall 7.5 away.
  const dirty = shot(level([{ x: 9, y: 2.5, z: 2, face: 'W', tex: 'grime-streaks-1' }]), cam);
  const { w } = renderer.surface;
  const { fy, horizon } = renderer.view;
  const col = (y) => Math.round(w / 2 + ((y - 2.5) * renderer.view.fx) / 7.5);
  const row = (z) => Math.round(horizon + ((cam.z - z) * fy) / 7.5);
  let darker = 0;
  for (let i = 0; i < plain.length; i++) {
    if (plain[i] === dirty[i]) continue;
    const x = i % w;
    const y = (i / w) | 0;
    assert.ok(x >= col(1.5) - 1 && x <= col(3.5) + 1 && y >= row(3.5) - 1 && y <= row(0.5) + 1, `only on the picture (${x}, ${y})`);
    assert.ok(lum(dirty[i]) < lum(plain[i]), 'never lighter');
    darker++;
  }
  assert.ok(darker > 100, `darkened the wall (${darker} pixels)`);
});

test("a grime texture's darkening comes from its own pixels: white none, black the most", async () => {
  const { Texture } = await import('../src/engine/assets.js');
  // A 1 x 4 picture: white, mid grey, black, transparent.
  const image = { width: 1, height: 4, pixels: Uint8Array.from([1, 2, 3, 255]) };
  const raw = { width: 1, height: 4, data: Uint8Array.from([255, 255, 255, 255, 128, 128, 128, 255, 0, 0, 0, 255, 0, 0, 0, 0]) };
  const tex = new Texture('g', image, { grime: true }, raw);
  const [white, grey, black, clear] = tex.shade;
  assert.equal(white, 0);
  assert.ok(grey > 0 && grey < black, 'grey darkens less than black');
  assert.equal(clear, 0);
  assert.equal(new Texture('t', image, {}, raw).shade, null, 'only grime');
});

test('the validator checks grime textures', async () => {
  const { validateContent } = await import('../src/engine/validate.js');
  const { Registry } = await import('../src/engine/registry.js');
  const { defineTexture } = await import('../src/engine/defs.js');
  const content = (await import('../src/content/index.js')).default;
  const textures = [
    ...content.textures,
    defineTexture({ id: 'bad-1', src: 'x.png', grime: 'yes' }),
    defineTexture({ id: 'bad-2', src: 'x.png', grime: true, fence: true }),
  ];
  const { errors } = validateContent(new Registry({ ...content, textures }));
  assert.equal(errors.filter((e) => /bad-/.test(e)).length, 2, errors.join('\n'));
});

// The room's east wall again, as angled walls along x 9 (from tile 8's
// side), each row's texture running on from the last (`wallU`) or not.
const angled = (decals, chain = true) =>
  room(['##########', '#.......a#', '#.......b#', '#.......c#', '##########'], ['', ' >'], {
    legend: { '.': ROOM, ...Object.fromEntries(['a', 'b', 'c'].map((m, k) => [m, { ...ROOM, wall: 'imp-panel', line: [1, 1, 1, 0], ...(chain && { wallU: k + 1 }) }])) },
    decals,
  });

test("a decal on an angled wall goes where the point says along it, and runs on round the wall's chain", () => {
  const sign = { x: 8.9, y: 2.5, z: 1.5, face: 'angled', tex: 'decal-sign', glow: true };
  const lay = (level) => {
    const { map, errors } = buildLevel(registry, level);
    assert.deepEqual(errors, []);
    map.decals[0].tex = 1;
    layoutDecals(map, [null, { w: 64, h: 32 }]); // 2 tiles wide
    return map;
  };
  const map = lay(angled([sign]));
  const [d] = map.decals;
  assert.deepEqual([d.a0, d.a1], [1.5, 3.5]);
  assert.deepEqual(d.edges.sort(), [1, 2, 3].map((y) => map.index(8, y)), 'on the three rows it covers');
  assert.deepEqual(lay(angled([sign], false)).decals[0].edges, [map.index(8, 2)], 'no chain: only its own tile');

  // Drawn just as the same (unlit) sign on a straight wall there.
  const cam = { x: 1.5, y: 2.5, angle: 0, z: 1 };
  const straight = (decals) => shot(level(decals), cam);
  const diff = (a, b) => a.map((c, i) => (c === b[i] ? -1 : c));
  const onStraight = diff(straight([{ ...sign, x: 9, face: 'W' }]), straight());
  const onAngled = diff(shot(angled([sign]), cam), shot(angled(), cam));
  assert.ok(onStraight.filter((c) => c >= 0).length > 100, 'the sign shows');
  assert.deepEqual(onAngled, onStraight);

  const { errors } = buildLevel(registry, angled([{ ...sign, x: 4 }]));
  assert.match(errors.join('\n'), /no angled wall/);
});
