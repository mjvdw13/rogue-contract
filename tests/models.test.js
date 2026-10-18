import test from 'node:test';
import assert from 'node:assert/strict';
import { defineModel, defineDecoration } from '../src/engine/defs.js';
import { Registry } from '../src/engine/registry.js';
import content from '../src/content/index.js';
import { Palette } from '../src/engine/gfx/palette.js';
import { Surface } from '../src/engine/gfx/surface.js';
import { Assets } from '../src/engine/assets.js';
import { Model } from '../src/engine/gfx/model.js';
import { Renderer } from '../src/engine/render/renderer.js';
import { NEAR } from '../src/engine/render/models.js';
import { SCREEN_W, VIEW_H } from '../src/engine/config.js';
import { makeWorld, mockInput, room, registry } from './helpers.js';
import { parseOBJ, parseMTL } from '../tools/lib/obj.mjs';

// Headless rendering with placeholder art: what matters is which pixels a
// model covers, not their colours.
const palette = new Palette(registry.paletteDef);
const assets = new Assets(registry, palette);
assets._loadOverrides = async () => {
  assets.overrides = {};
};
assets._loadImage = async () => null;
await assets.loadAll();
const renderer = new Renderer(new Surface(SCREEN_W, VIEW_H), assets, palette);
const view = renderer.view;

const TALL = { floor: 'imp-floor', ceiling: 'imp-ceiling', light: 160, ceilZ: 3 };
const legend = { '.': TALL, h: { ...TALL, floorZ: 0.8 } };
const open = room(['##########', '#........#', '#........#', '#........#', '##########'], [], { legend });

/** A 1x1 upright square at x = 0, facing -x (toward a camera west of it). */
const square = (extra = {}) =>
  new Model(
    defineModel({
      id: 'square',
      vertices: [[0, -0.5, 0], [0, -0.5, 1], [0, 0.5, 1], [0, 0.5, 0]],
      faces: [{ v: [0, 1, 2, 3], color: ['steel', 0.8], ...extra }],
    }),
    palette,
    () => 0,
  );

const CAM = { x: 1.5, y: 2.5, angle: 0, z: 1.5 };

/** Render a level's map with `things`; returns a copy of the frame. */
function frame(level, things, cam = CAM) {
  const world = makeWorld(level, { noMonsters: true });
  renderer.surface.clear(0);
  renderer.render({ map: world.map, things, fog: 0 }, cam);
  return Uint8Array.from(renderer.surface.px);
}

/** The screen row of height z at distance d, in the centre column. */
const rowAt = (z, d, cam = CAM) => Math.floor(view.horizon + ((cam.z - z) * view.fy) / d);
const at = (x, y) => y * view.W + x;
const mid = SCREEN_W / 2;
const thing = (model, x, y, more = {}) => ({ model, x, y, z: 0, angle: 0, def: {}, ...more });

test('a model face is a polygon: its normal points out by the right-hand rule', () => {
  const f = square().faces[0];
  assert.deepEqual([f.nx, f.ny, f.nz].map((v) => Math.round(v * 1000) / 1000 + 0), [-1, 0, 0]);
});

test('a model facing the camera is drawn at its own depth', () => {
  const empty = frame(open, []);
  const fb = frame(open, [thing(square(), 5.5, 2.5)]);
  const y = rowAt(0.5, 4);
  assert.notEqual(fb[at(mid, y)], empty[at(mid, y)], 'covers the middle of the view');
  assert.ok(Math.abs(view.mdepth[at(mid, y)] - 4) < 0.01, `depth ${view.mdepth[at(mid, y)]}`);
  assert.equal(fb[at(mid, rowAt(1.3, 4))], empty[at(mid, rowAt(1.3, 4))], 'nothing above its top');
});

test('faces pointing away are culled, unless two-sided', () => {
  const empty = frame(open, []);
  assert.deepEqual(frame(open, [thing(square(), 5.5, 2.5, { angle: Math.PI })]), empty);
  assert.notDeepEqual(frame(open, [thing(square({ twoSided: true }), 5.5, 2.5, { angle: Math.PI })]), empty);
});

test('walls hide models behind them', () => {
  const walled = room(['##########', '#....#...#', '#....#...#', '#....#...#', '##########'], [], { legend });
  assert.deepEqual(frame(walled, [thing(square(), 7.5, 2.5)]), frame(walled, []));
});

test('a ledge hides the part of a model below its edge', () => {
  const ledge = room(['##########', '#........#', '#...h....#', '#........#', '##########'], [], { legend });
  const empty = frame(ledge, []);
  const fb = frame(ledge, [thing(square(), 7, 2.5)]);
  const d = 7 - CAM.x;
  assert.equal(fb[at(mid, rowAt(0.1, d))], empty[at(mid, rowAt(0.1, d))], 'its foot is behind the ledge');
  assert.notEqual(fb[at(mid, rowAt(0.95, d))], empty[at(mid, rowAt(0.95, d))], 'its top shows over it');
});

test('a face cut by the near plane is clipped, not stretched', () => {
  // A long wall just left of the camera (north; it faces south), running from
  // behind the camera to 4 ahead.
  const side = new Model(
    defineModel({
      id: 'side',
      vertices: [[-2, 0, 0], [-2, 0, 2], [4, 0, 2], [4, 0, 0]],
      faces: [{ v: [0, 1, 2, 3], color: ['steel', 0.8] }],
    }),
    palette,
    () => 0,
  );
  const fb = frame(open, [thing(side, CAM.x, CAM.y - 0.4)]);
  let drawn = 0;
  for (let i = 0; i < fb.length; i++) {
    if (view.mdepth[i] === Infinity) continue;
    drawn++;
    assert.ok(view.mdepth[i] >= NEAR - 1e-6 && view.mdepth[i] <= 4.01, `depth ${view.mdepth[i]}`);
  }
  assert.ok(drawn > 1000, `drawn ${drawn}`);
  assert.ok(view.mdepth[at(0, rowAt(1, 1))] < 1, 'reaches the left edge of the view, up close');
});

test('sprites behind a model are hidden; sprites in front are drawn over it', () => {
  const trooper = registry.things.get('stormtrooper');
  const sprite = (x) => ({ def: trooper, sheet: assets.sheetFor(trooper), frame: 1, x, y: 2.5, z: 0 });
  const model = thing(square(), 5.5, 2.5);
  const y = rowAt(0.5, 4);
  const alone = frame(open, [model]);
  assert.equal(frame(open, [model, sprite(7.5)])[at(mid, y)], alone[at(mid, y)]);
  assert.notEqual(frame(open, [model, sprite(4.5)])[at(mid, y)], alone[at(mid, y)]);
});

// A Blender-style OBJ cube (Y up, -Z forward), 1 unit, standing on the floor.
const CUBE_OBJ = `
v -0.5 0 0.5
v 0.5 0 0.5
v 0.5 1 0.5
v -0.5 1 0.5
v -0.5 0 -0.5
v 0.5 0 -0.5
v 0.5 1 -0.5
v -0.5 1 -0.5
vt 0 0
vt 1 0
vt 1 1
vt 0 1
usemtl Panel
f 1/1 2/2 3/3 4/4
f 6/1 5/2 8/3 7/4
f 5/1 1/2 4/3 8/4
f 2/1 6/2 7/3 3/4
usemtl Light
f 4 3 7 8
f 5 6 2 1
`;

test('OBJ import: Blender axes become the game axes, and faces still point out', () => {
  const materials = parseMTL('newmtl Panel\nKd 0.5 0.5 0.5\nmap_Kd C:\\art\\imp-panel.png\nnewmtl Light\nKd 1 0 0\n');
  const { vertices, faces, warnings } = parseOBJ(CUBE_OBJ, {
    materials,
    texture: (f) => (f === 'imp-panel.png' ? 'imp-panel' : null),
    glow: (m) => m === 'Light',
  });
  assert.deepEqual(warnings, []);
  assert.equal(faces.length, 12, 'quads become two triangles');
  const model = new Model(defineModel({ id: 'cube', vertices, faces }), palette, () => 0);
  faces.forEach((f, i) => {
    const c = f.v.map((k) => vertices[k]).reduce((s, p) => s.map((v, j) => v + p[j] / 3), [0, 0, 0]);
    const { nx, ny, nz } = model.faces[i];
    assert.ok(nx * c[0] + ny * c[1] + nz * (c[2] - 0.5) > 0, `face ${i} points out`);
  });
  // OBJ +Z (Blender's front) is the model's front, +x; Y up is z up.
  const front = faces[0].v.map((k) => vertices[k]);
  assert.ok(front.every((p) => p[0] === 0.5));
  assert.equal(faces[0].tex, 'imp-panel');
  assert.ok(faces[0].uv.every(([, v]) => v === 0 || v === 1), 'v counts down from the top');
  assert.deepEqual(faces[8].color, [255, 0, 0]);
  assert.equal(faces[8].glow, true);
});

// A 4-long wall model with collision lines, and a decoration placing it.
const wallDef = defineModel({
  id: 'test-wall',
  vertices: [[0, -2, 0], [0, -2, 2], [0, 2, 2], [0, 2, 0]],
  faces: [{ v: [0, 1, 2, 3], color: ['gray', 0.5], twoSided: true }],
  lines: [[0, -2, 0, 2]],
});
const gameReg = new Registry({
  ...content,
  models: [...content.models, wallDef],
  things: [
    ...content.things,
    defineDecoration({ id: 'test-wall', model: 'test-wall', solid: true, height: 2 }),
    defineDecoration({ id: 'test-spinner', model: 'terminal', spin: 1 }),
    defineDecoration({ id: 'test-prop', model: 'terminal', radius: 0.55 }),
    defineDecoration({ id: 'test-prop-fixed', model: 'terminal', radius: 0.55, fixed: true }),
  ],
});
const arena = room(['############', ...Array(9).fill('#..........#'), '############'], [], { legend });

/** A world with the test wall standing north-south at x = 6 (y 3 to 7), its model attached. */
function wallWorld() {
  const w = makeWorld(arena, { noMonsters: true, registry: gameReg });
  const wall = w.spawn('test-wall', 6, 5);
  wall.model = new Model(wallDef, palette, () => 0);
  return { w, wall };
}

test('model scenery with lines collides as those walls, not as its cylinder', () => {
  const { w } = wallWorld();
  const p = w.player;
  p.x = 5;
  p.y = 3.5; // 1.5 from the wall's middle: well clear of a 0.5 cylinder
  assert.equal(w.checkPosition(p, 5.6, 3.5), false, 'walks into the wall line');
  assert.equal(w.checkPosition(p, 4.8, 3.5), true, 'backs away from it');
  assert.equal(w.checkPosition(p, 6, 2.2), true, 'passes beyond its end');
});

test('the parked landspeeder blocks you at its nose, its flanks and its side engines, but not round it', () => {
  const lot = room(['################', ...Array(10).fill('#..............#'), '################'], [], { legend });
  const w = makeWorld(lot, { noMonsters: true });
  const speeder = w.spawn('landspeeder', 7, 5.5); // nose east
  speeder.model = new Model(registry.models.get('landspeeder'), palette, () => 0);
  const p = w.player;
  const blocked = [[9.4, 5.5, 'its nose'], [6.5, 4.6, 'its flank'], [7, 6.4, 'its other flank'], [6.2, 6.9, 'a side engine'], [6.2, 4.1, 'the other']];
  for (const [x, y, what] of blocked) assert.equal(w.checkPosition(p, x, y), false, `walks into ${what}`);
  const clear = [[10.4, 5.5], [6.5, 3.6], [6.2, 2.6], [6.2, 8.4], [3.4, 5.5]];
  for (const [x, y] of clear) assert.equal(w.checkPosition(p, x, y), true, `stands clear at (${x}, ${y})`);
});

test('solid model scenery stops hitscan shots and projectiles', () => {
  const { w } = wallWorld();
  const p = w.player;
  p.x = 3;
  p.y = 4;
  p.z = 0;
  const trooper = w.spawn('stormtrooper', 9, 4);
  const health = trooper.health;
  assert.equal(w.hitscan(p, 0, 40, 50, {}, { z: 1, slope: 0 }), null);
  assert.equal(trooper.health, health, 'the shot stopped at the wall');
  const bolt = w.spawnProjectile('trooper-bolt', p, 0, {}, { z: 1, slope: 0 });
  for (let i = 0; i < 60 && bolt.state !== 'exploding'; i++) w.tick(1 / 60, mockInput());
  assert.equal(bolt.state, 'exploding');
  assert.ok(bolt.x < 6, `burst at x ${bolt.x.toFixed(2)}, in front of the wall`);
  assert.equal(trooper.health, health);
});

test('a decoration with `spin` turns', () => {
  const w = makeWorld(arena, { noMonsters: true, registry: gameReg });
  const s = w.spawn('test-spinner', 4, 4);
  const a = s.angle;
  w.tick(0.5, mockInput());
  assert.ok(Math.abs(s.angle - a - 0.5) < 1e-9);
});

test('a prop against a raised floor climbs onto it, unless it is fixed where it is put', () => {
  // A block of raised floor (0.8) east of x = 4; the props stand 0.45 west of it.
  const ledge = room(['#######', '#...hh#', '#...hh#', '#...hh#', '#######'], [], { legend });
  const w = makeWorld(ledge, { noMonsters: true, registry: gameReg });
  const loose = w.spawn('test-prop', 3.55, 1.5);
  const fixed = w.spawn('test-prop-fixed', 3.55, 2.5);
  const stacked = w.spawn('test-prop-fixed', 2.5, 3.5);
  stacked.z = 1.5;
  assert.equal(fixed.z, 0, 'it starts on the floor under its middle');
  w.tick(0.5, mockInput());
  assert.ok(Math.abs(loose.z - 0.8) < 1e-6, 'its radius reaches the ledge, so it settles on top');
  assert.equal(fixed.z, 0);
  assert.equal(stacked.z, 1.5, 'a fixed thing placed in the air stays there');
});

test('textured faces show their texture, at the walls\' scale with world-unit uvw', () => {
  const slot = assets.textureSlot('imp-panel');
  const tex = assets.textures[slot];
  const textured = new Model(
    defineModel({
      id: 'panel',
      vertices: [[0, -0.5, 0], [0, -0.5, 1], [0, 0.5, 1], [0, 0.5, 0]],
      faces: [{ v: [0, 1, 2, 3], tex: 'imp-panel', uvw: [[0, 0], [0, -1], [1, -1], [1, 0]] }],
    }),
    palette,
    (id) => assets.textureSlot(id),
    assets.textures,
  );
  assert.ok(Math.abs(textured.faces[0].uv[4] - 32 / tex.w) < 1e-6, 'one unit is 32 texels across');
  frame(open, [thing(textured, 5.5, 2.5)]);
  const y = rowAt(0.5, 4);
  const seen = new Set();
  for (let x = mid - 20; x < mid + 20; x++) if (view.mdepth[at(x, y)] < Infinity) seen.add(renderer.surface.px[at(x, y)]);
  assert.ok(seen.size > 1, 'more than one colour across the face');
  frame(open, [thing(square(), 5.5, 2.5)]);
  const flat = new Set();
  for (let x = mid - 20; x < mid + 20; x++) if (view.mdepth[at(x, y)] < Infinity) flat.add(renderer.surface.px[at(x, y)]);
  assert.equal(flat.size, 1, 'a flat-coloured face is one colour');
});
