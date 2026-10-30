import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildLevel, contentAngle } from '../src/engine/world/level.js';
import { World } from '../src/engine/world/world.js';
import { Rng } from '../src/engine/core/rng.js';
import { castRay, traceRay3D, blockedByMap } from '../src/engine/world/physics.js';
import { Palette } from '../src/engine/gfx/palette.js';
import { Surface } from '../src/engine/gfx/surface.js';
import { quantize } from '../src/engine/gfx/image.js';
import { Assets } from '../src/engine/assets.js';
import { Renderer } from '../src/engine/render/renderer.js';
import { SCREEN_W, VIEW_H } from '../src/engine/config.js';
import { decodePNG } from '../tools/art/lib/png.js';
import { registry, room, makeWorld, mockInput, run } from './helpers.js';

// Rising doors (Dark Forces' kind): a thin panel set back in the middle of
// the doorway, which is an open recess as tall as the opening.

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ROOM = { floor: 'imp-floor', ceiling: 'imp-ceiling', light: 160, ceilZ: 4 };
const DOOR = { door: 'imp-door', jamb: 'imp-jamb', style: 'rise', ceilZ: 2, upper: 'imp-lintel' };

/**
 * Two rooms joined by a doorway 2 tiles deep (x 5-6) and `wide` tiles wide
 * from row `top`, the panel at x = 6. `L` is the same door with a different
 * lintel (the west row of the doorway).
 */
function doorway(wide = 2, top = 3) {
  const rows = [];
  for (let y = 0; y < 10; y++) {
    if (y === 0 || y === 9) rows.push('#'.repeat(12));
    else if (y >= top && y < top + wide) rows.push('#....LD....#');
    else rows.push('#....##....#');
  }
  return room(rows, ['', '', '', '', ' >'], { legend: { '.': ROOM, D: DOOR, L: { ...DOOR, upper: 'imp-panel' } } });
}

test('a rising door stands in the middle of its doorway, which is a recess as tall as the opening', () => {
  const names = [];
  const textureSlot = (id) => (names.includes(id) ? names : names.push(id) && names).indexOf(id);
  const { map, errors } = buildLevel(registry, doorway(3), { textureSlot });
  assert.deepEqual(errors, []);
  const d = map.doorAt(5, 3);
  assert.equal(d.group.length, 6, 'one door, though its two rows have different lintels');
  assert.equal(d.axis, 'x');
  assert.equal(d.plane, 6, 'the panel is 1 tile back from each face');
  assert.deepEqual([d.span0, d.span1], [3, 6]);
  assert.equal(map.ceilZ[map.index(5, 3)], 2, 'the recess is as tall as the opening');
  assert.equal(names[map.upperTex[map.index(5, 3)]], 'imp-panel', 'each side keeps its own lintel');
  assert.equal(names[map.upperTex[map.index(6, 3)]], 'imp-lintel');
  assert.equal(d.bottomZ, 0, 'closed: the panel stands on the floor');
  d.open = 0.5;
  assert.equal(d.bottomZ, 1);
});

test('the player can step into the recess, but not through the closed panel', () => {
  const w = makeWorld(doorway(), { noMonsters: true });
  const pt = w.player;
  pt.x = 3.5;
  pt.y = 4;
  pt.angle = contentAngle(0);
  const input = mockInput();
  input.hold('forward');
  run(w, input, 1);
  assert.ok(pt.x > 5, 'walked into the recess');
  assert.ok(Math.abs(pt.x - (6 - pt.radius)) < 0.05, 'and up to the panel');
  assert.equal(blockedByMap(w.map, 5.2, 4, pt.radius), false, 'the recess is open floor');
  assert.equal(blockedByMap(w.map, 5.8, 4, pt.radius), true, 'the panel blocks');
  input.tap('use');
  run(w, input, 1.5);
  assert.ok(pt.x > 8, 'the door rose and let the player through');
});

test('rays stop at the panel; 3D shots pass under a half-open door', () => {
  const { map } = buildLevel(registry, doorway(), {});
  const d = map.doorAt(5, 3);
  const setOpen = (v) => d.group.forEach((t) => (t.open = v));
  const hit = castRay(map, 2.5, 4, 1, 0);
  assert.equal(hit.door.group, d.group);
  assert.ok(Math.abs(hit.dist - 3.5) < 1e-9, 'at the panel, x = 6');
  const fromRecess = castRay(map, 5.4, 4, 1, 0);
  assert.equal(fromRecess.door.group, d.group, 'standing in the recess, the panel is right ahead');
  assert.ok(Math.abs(fromRecess.dist - 0.6) < 1e-9);
  const shut = traceRay3D(map, 2.5, 4, 1.5, 1, 0, 0, 20);
  assert.equal(shut.hit, 'wall');
  assert.ok(Math.abs(shut.dist - 3.5) < 1e-9);
  setOpen(0.5); // bottom edge at 1
  const low = traceRay3D(map, 2.5, 4, 0.5, 1, 0, 0, 20);
  assert.ok(low.dist > 5, 'a low shot passes under the door');
  const high = traceRay3D(map, 2.5, 4, 1.5, 1, 0, 0, 20);
  assert.ok(Math.abs(high.dist - 3.5) < 1e-9, 'a high one hits the panel');
  assert.equal(map.panelCrossed(5.95, 4, 6.05, 4, 1.5), true, 'a projectile up high bursts on it');
  assert.equal(map.panelCrossed(5.95, 4, 6.05, 4, 0.5), false, 'and passes under it down low');
  assert.equal(map.panelCrossed(5.1, 4, 5.2, 4, 1.5), false, 'the recess is open');
});

test('a door closes on someone in its recess, but not on someone in its panel\'s way', () => {
  const w = makeWorld(doorway(), { noMonsters: true });
  const d = w.map.doorAt(5, 3);
  w.openDoor(d);
  run(w, mockInput(), 1);
  assert.equal(d.state, 'open');
  const pt = w.player;
  pt.x = 6;
  pt.y = 4;
  d.timer = 0;
  run(w, mockInput(), 0.2);
  assert.equal(d.state, 'open', 'waits while the player stands in the doorway');
  pt.x = 5.3;
  d.timer = 0;
  run(w, mockInput(), 0.2);
  assert.equal(d.state, 'closing', 'closes with the player in the recess, clear of the panel');
});

// ---------------------------------------------------------------- rendering

const palette = new Palette(registry.paletteDef);
const assets = new Assets(registry, palette);
assets._loadOverrides = async () => {
  assets.overrides = {};
};
assets._loadImage = async (src) => {
  try {
    return quantize(decodePNG(fs.readFileSync(path.join(root, src))), palette);
  } catch {
    return null;
  }
};
await assets.loadAll();
const renderer = new Renderer(new Surface(SCREEN_W, VIEW_H), assets, palette);

/** Render a doorway from 3 tiles in front of its panel, looking at its middle. */
function frame(level, y, open = 0) {
  const w = new World({ registry, assets, rng: new Rng(1), settings: { noMonsters: true } }, level, { skill: 3 });
  for (const d of w.map.doors) d.open = open;
  const pt = w.player;
  pt.x = 3;
  pt.y = y;
  pt.z = 0;
  pt.angle = contentAngle(0);
  renderer.surface.clear(0);
  renderer.render(w, w.camera(), { skip: pt });
  return { px: Uint8Array.from(renderer.surface.px), zbuf: Float32Array.from(renderer.view.zbuf) };
}

test('the panel is drawn set back, and the view carries on under it when it rises', () => {
  const mid = SCREEN_W >> 1;
  const shut = frame(doorway(), 4);
  assert.ok(Math.abs(shut.zbuf[mid] - 3) < 1e-6, 'the column ends at the panel');
  const half = frame(doorway(), 4, 0.5);
  assert.ok(half.zbuf[mid] > 6, 'half open: it goes on under the panel to the far wall');
});

test('a door shows its art once, fitted to the doorway, wherever the doorway is', () => {
  // The same 2-wide doorway one tile further south, seen from one tile
  // further south: the panel looks the same (world-anchored art would shift).
  const a = frame(doorway(2, 3), 4);
  const b = frame(doorway(2, 4), 5);
  const W = SCREEN_W;
  const H = VIEW_H;
  let same = 0;
  let total = 0;
  for (let y = (H >> 1) - 10; y < (H >> 1) + 10; y++) {
    for (let x = (W >> 1) - 10; x < (W >> 1) + 10; x++) {
      total++;
      if (a.px[y * W + x] === b.px[y * W + x]) same++;
    }
  }
  assert.equal(same, total);
});

// ---------------------------------------------------------------- under the sky

// A street (sky at 12) beside a building: its roof (a raised floor at 6), a
// room inside under a slab, and a door 2 wide through the 1-tile wall
// between (x 6), the wall over it a slab from the opening's top (3) to the
// roof. `A` is the same doorway as an open arch, to compare with.
const STREET = { floor: 'imp-floor', ceiling: 'sky', ceilZ: 12, light: 200 };
const LINTEL = { bottom: 3, top: 6, floor: 'imp-floor', ceiling: 'imp-panel', side: 'imp-panel', light: 160 };
const ROOF = { ...STREET, floorZ: 6, side: 'imp-panel' };
const INSIDE = { ...STREET, slab: { bottom: 4, top: 6, floor: 'imp-floor', ceiling: 'imp-ceiling', side: 'imp-panel', light: 160 } };
const SKY_DOOR = { ...STREET, door: 'imp-door', style: 'rise', slab: LINTEL };

function building(glyph = 'D', legend = {}) {
  const rows = ['############', '#.....BBBBB#', '#.....Brrrr#', '#.....Brrrr#', '#.....Xrrrr#', '#.....Xrrrr#', '#.....Brrrr#', '#.....Brrrr#', '#.....BBBBB#', '############'];
  return room(
    rows.map((r) => r.replaceAll('X', glyph)),
    ['', '', '', '', '', ' >'],
    { sky: 'sky-day', legend: { '.': STREET, B: ROOF, r: INSIDE, D: SKY_DOOR, A: { ...STREET, slab: LINTEL }, ...legend } },
  );
}

test('a rising door can stand in a wall under the sky: the wall over it is a slab up to the roof', () => {
  const { map, errors } = buildLevel(registry, building(), {});
  assert.deepEqual(errors, []);
  const d = map.doorAt(6, 4);
  assert.equal(d.group.length, 2);
  assert.equal(d.axis, 'x', 'the roof either side is the doorway\'s walls');
  assert.equal(d.plane, 6.5, 'the panel halfway through the wall');
  assert.equal(d.openZ, 3, 'it opens up to the slab');
  assert.equal(map.ceilZ[map.index(6, 4)], 12, 'the tile keeps the sky over its slab');
  assert.equal(map.ceilAt(6.3, 4.5, 0, 0.5), 3, 'a body in the doorway has the opening as its ceiling');
});

test('a slab on a sliding door is an error', () => {
  const { errors } = buildLevel(registry, building('D', { D: { ...SKY_DOOR, style: 'slide' } }), {});
  assert.ok(errors.some((e) => /slab on a door needs a rising door/.test(e)), errors.join('\n'));
});

test('the player opens a door under the sky and walks through into the room', () => {
  const w = makeWorld(building(), { noMonsters: true });
  const pt = w.player;
  pt.x = 3.5;
  pt.y = 5;
  pt.angle = contentAngle(0);
  const input = mockInput();
  input.hold('forward');
  run(w, input, 1);
  assert.ok(Math.abs(pt.x - (6.5 - pt.radius)) < 0.05, 'stopped at the panel');
  input.tap('use');
  run(w, input, 1.5);
  assert.ok(pt.x > 8, 'through into the room');
});

test('a door under the sky shows sky above its roof, and once open looks like an arch', () => {
  const shut = frame(building(), 5);
  const open = frame(building(), 5, 1);
  const arch = frame(building('A'), 5);
  assert.deepEqual(open.px, arch.px, 'open, it is the arch');
  // Above the opening's top on the wall's face (3 ahead), shut or not, the
  // same: the wall over the door, the roof and the sky.
  const { horizon, fy } = renderer.view;
  const top = Math.ceil(horizon + ((1.25 - 3) * fy) / 3 - 0.5);
  assert.ok(top > 0);
  assert.deepEqual(shut.px.subarray(0, top * SCREEN_W), arch.px.subarray(0, top * SCREEN_W), 'nothing above the opening changes');
  assert.notDeepEqual(shut.px, arch.px, 'the panel shows below it');
});
