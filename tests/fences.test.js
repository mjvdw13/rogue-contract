import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildLevel } from '../src/engine/world/level.js';
import { World } from '../src/engine/world/world.js';
import { Rng } from '../src/engine/core/rng.js';
import { castRay, lineOfSight3D, fenceBlocks } from '../src/engine/world/physics.js';
import { FlowField, WALKER } from '../src/engine/world/nav.js';
import { Palette } from '../src/engine/gfx/palette.js';
import { Surface } from '../src/engine/gfx/surface.js';
import { quantize } from '../src/engine/gfx/image.js';
import { Assets } from '../src/engine/assets.js';
import { Renderer } from '../src/engine/render/renderer.js';
import { contentAngle } from '../src/engine/world/level.js';
import { SCREEN_W, VIEW_H } from '../src/engine/config.js';
import { decodePNG } from '../tools/art/lib/png.js';
import { upscaleLevel } from '../tools/lib/upscale.mjs';
import { analyseLevel } from '../tools/lib/levelcheck.mjs';
import { registry, room, makeWorld } from './helpers.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ROOM = { floor: 'imp-floor', ceiling: 'imp-ceiling', light: 160, ceilZ: 3 };

/**
 * A corridor 1 tile high, open from x 1 to 10, with a fence on the east edge
 * of column 4 (between x = 4 and 5) unless `fence` is null.
 */
function corridor(fence = { tex: 'imp-bars' }, extra = {}) {
  const legend = { '.': ROOM, f: { ...ROOM, ...(fence ? { fence: { ...fence, edges: 'E' } } : {}) } };
  return room(['############', '#...f......#', '#...f......#', '#...f......#', '############'], ['', '', ' >'], { legend, ...extra });
}

test('a fence is stored on both tiles beside its edge', () => {
  const { map, errors } = buildLevel(registry, corridor({ tex: 'imp-railing', height: 0.75 }), {});
  assert.deepEqual(errors, []);
  const i = 2 * map.w + 4;
  const k = map.fenceAt[i * 4 + 1];
  assert.ok(k >= 0, 'east edge of the fence tile');
  assert.equal(map.fenceAt[(i + 1) * 4 + 3], k, 'west edge of the tile beyond');
  assert.equal(map.fenceAt[i * 4 + 3], -1);
  assert.equal(map.fenceBetween(i, i + 1), map.fences[k]);
  assert.equal(map.fenceBetween(i, i - 1), null);
  assert.equal(map.fenceTop(map.fences[k]), 0.75);
});

test('bad fences are errors', () => {
  const bad = (fence, tiles = ['#####', '#.f.#', '#####']) =>
    buildLevel(registry, room(tiles, [], { legend: { '.': ROOM, f: { ...ROOM, fence } } }), {}).errors.join(' ');
  assert.match(bad({ tex: 'imp-bars', edges: 'X' }), /letters from NESW/);
  assert.match(bad({ tex: 'imp-bars', edges: 'NN' }), /letters from NESW/);
  assert.match(bad({ edges: 'E' }), /needs a "tex"/);
  assert.match(bad({ tex: 'imp-bars', edges: 'E', height: 0 }), /above 0/);
  assert.match(bad({ tex: 'imp-bars', edges: 'N' }), /stands against a wall/);
  const onWall = buildLevel(registry, room(['#####', '#.f.#', '#####'], [], { legend: { '.': ROOM, f: { wall: 'imp-panel', fence: { tex: 'imp-bars', edges: 'E' } } } }), {});
  assert.ok(onWall.errors.some((e) => e.includes('needs an open tile')));
});

test('bodies are stopped by a fence but sight and shots pass through', () => {
  const w = makeWorld(corridor());
  const map = w.map;
  assert.ok(fenceBlocks(map, 4.8, 2.5, 0.3, 0, 1.7), 'touching the edge');
  assert.ok(!fenceBlocks(map, 4.5, 2.5, 0.3, 0, 1.7), 'clear of it');
  const pt = w.player;
  pt.x = 3.5;
  pt.y = 2.5;
  pt.z = 0;
  assert.ok(!w.checkPosition(pt, 5 - pt.radius + 0.1, 2.5), 'the player cannot walk through');
  assert.ok(w.checkPosition(pt, 5 - pt.radius - 0.05, 2.5), 'up to the bars');
  assert.equal(castRay(map, 2.5, 2.5, 1, 0).tx, 11, 'a ray goes on to the far wall');
  assert.ok(lineOfSight3D(map, 2.5, 2.5, 1, 8.5, 2.5, 1));
});

test('a low railing only stops what is below its top', () => {
  const w = makeWorld(corridor({ tex: 'imp-railing', height: 0.75 }));
  const pt = w.player;
  pt.x = 4.6;
  pt.y = 2.5;
  pt.z = 0;
  assert.ok(!w.checkPosition(pt, 4.9, 2.5), 'standing');
  pt.z = 0.8;
  assert.ok(w.checkPosition(pt, 4.9, 2.5), 'jumping over it');
});

test('pathfinding goes round fences; flyers cross low ones', () => {
  const tiles = ['#######', '#.....#', '#.ff..#', '#.....#', '#######'];
  const level = (height) => room(tiles, [], { legend: { '.': ROOM, f: { ...ROOM, fence: { tex: 'imp-railing', edges: 'E', ...(height ? { height } : {}) } } } });
  const walk = new FlowField(buildLevel(registry, level(), {}).map, WALKER);
  walk.update(4, 2);
  assert.equal(walk.distanceAt(3, 2), 3, 'round the end of the fence, not straight through');
  const fly = new FlowField(buildLevel(registry, level(0.75), {}).map, { ...WALKER, flying: true });
  fly.update(4, 2);
  assert.equal(fly.distanceAt(3, 2), 1);
  const tall = new FlowField(buildLevel(registry, level(), {}).map, { ...WALKER, flying: true });
  tall.update(4, 2);
  assert.equal(tall.distanceAt(3, 2), 3, 'full-height bars stop flyers too');
});

test('reachability does not cross a fence', () => {
  const tiles = ['#######', '#..f..#', '#..f..#', '#######'];
  const level = room(tiles, ['', ' >'], { legend: { '.': ROOM, f: { ...ROOM, fence: { tex: 'imp-bars', edges: 'E' } } } });
  const a = analyseLevel(registry, level);
  assert.equal(a.reached[1 * 7 + 3], 1);
  assert.equal(a.reached[1 * 7 + 4], 0, 'the far side of the bars');
});

test('upscaling keeps fences on the outside edges of each block', () => {
  const level = room(['#####', '#.f.#', '#####'], ['', ' >'], { legend: { '.': ROOM, f: { ...ROOM, fence: { tex: 'imp-railing', edges: 'E', height: 0.5 } } } });
  const { map, errors } = buildLevel(registry, upscaleLevel(registry, level, 2), {});
  assert.deepEqual(errors, []);
  const edges = (x, y) => [0, 1, 2, 3].filter((e) => map.fenceAt[(y * map.w + x) * 4 + e] >= 0);
  assert.deepEqual(edges(5, 2), [1], 'the right column keeps the east edge');
  assert.deepEqual(edges(5, 3), [1]);
  assert.deepEqual(edges(4, 2), [], 'the left column has none');
  assert.equal(map.fences[map.fenceAt[(2 * map.w + 5) * 4 + 1]].height, 1, 'the height doubles');
});

// ---------------------------------------------------------------- rendering

// The generated art, decoded from disk (it has the fences' holes).
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

/** Render a level from (1.5, 2.5) looking east; returns a copy of the frame. */
function frame(level, troopers = []) {
  level.list = troopers.map((x) => ({ type: 'stormtrooper', x, y: 2.5, angle: 180 }));
  const w = new World({ registry, assets, rng: new Rng(1), settings: {} }, level, { skill: 3 });
  const pt = w.player;
  pt.x = 1.5;
  pt.y = 2.5;
  pt.z = 0;
  pt.angle = contentAngle(0);
  renderer.surface.clear(0);
  renderer.render(w, w.camera(), { skip: pt });
  return Uint8Array.from(renderer.surface.px);
}

const diff = (a, b) => {
  const out = [];
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) out.push(i);
  return out;
};

test('bars are drawn with holes in front of what is behind them', () => {
  const open = frame(corridor(null));
  const barred = frame(corridor());
  const changed = diff(open, barred);
  assert.ok(changed.length > 500, 'the bars show');
  // Within the rows the bars cover, some columns still show the corridor beyond.
  const w = renderer.surface.w;
  const row = VIEW_H >> 1;
  let same = 0;
  let differ = 0;
  for (let x = 0; x < w; x++) (open[row * w + x] === barred[row * w + x] ? same++ : differ++);
  assert.ok(same > w * 0.3 && differ > w * 0.1, `see-through: ${same} same, ${differ} different on the middle row`);
});

test('a low railing leaves the view above its top alone', () => {
  const open = frame(corridor(null));
  const railed = frame(corridor({ tex: 'imp-railing', height: 0.75 }));
  const w = renderer.surface.w;
  const rows = diff(open, railed).map((i) => Math.floor(i / w));
  assert.ok(rows.length > 100);
  // The eye is at 1.25, above the railing's 0.75: it is drawn below the horizon only.
  assert.ok(Math.min(...rows) > VIEW_H / 2, `railing rows start at ${Math.min(...rows)}`);
});

test('fences hide sprites behind their bars, not in front of them', () => {
  const w = renderer.surface.w;
  const bars = frame(corridor());
  // A trooper behind the bars: wherever a bar pixel was drawn, it stays.
  const open = frame(corridor(null));
  const barPixels = diff(open, bars);
  const behind = frame(corridor(), [7.5]);
  const trooperBehind = diff(bars, behind);
  assert.ok(trooperBehind.length > 50, 'the trooper shows between the bars');
  const covered = new Set(barPixels);
  assert.ok(!trooperBehind.some((i) => covered.has(i)), 'no trooper pixel replaces a bar pixel');
  // A trooper in front: it covers bar pixels too.
  const front = frame(corridor(), [3.5]);
  const trooperFront = diff(bars, front);
  assert.ok(trooperFront.some((i) => covered.has(i)), 'the near trooper draws over the bars');
  assert.ok(w > 0);
});
