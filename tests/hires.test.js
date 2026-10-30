import test from 'node:test';
import assert from 'node:assert/strict';
import { SCREEN_W, VIEW_W, VIEW_H } from '../src/engine/config.js';
import { Surface, ScaledSurface } from '../src/engine/gfx/surface.js';
import { MeltWipe } from '../src/engine/gfx/wipe.js';
import { View } from '../src/engine/render/view.js';
import { headlessRenderer, room } from './helpers.js';

// 2x resolution: the 3D view is drawn at 640x400, while the HUD and menus
// keep drawing at 320x200, each of their pixels a 2x2 block.

test('a plain surface is its own buffer: one pixel per layout pixel', () => {
  const s = new Surface(SCREEN_W, 4);
  assert.deepEqual([s.pw, s.ph, s.scale], [SCREEN_W, 4, 1]);
  s.resize(426, SCREEN_W);
  assert.equal(s.pw, 426);
});

test('at 2x the 2D drawing takes layout coordinates and draws 2x2 blocks', () => {
  const s = new ScaledSurface(SCREEN_W, 4, 2);
  assert.deepEqual([s.w, s.h, s.pw, s.ph], [SCREEN_W, 4, 640, 8]);
  assert.equal(s.px.length, 640 * 8);
  const at = (x, y) => s.px[y * s.pw + x];
  s.pixel(3, 1, 7);
  assert.deepEqual([at(6, 2), at(7, 2), at(6, 3), at(7, 3)], [7, 7, 7, 7]);
  assert.equal(at(8, 2), 0);
  s.fillRect(10, 0, 2, 1, 9);
  assert.deepEqual([at(19, 0), at(20, 1), at(23, 1), at(24, 1)], [0, 9, 9, 0]);
  // A 2x1 picture becomes 4x2, its transparent pixel left alone.
  s.blit({ w: 2, h: 1, px: new Uint8Array([5, 255]) }, 0, 3);
  assert.deepEqual([at(0, 6), at(1, 7), at(2, 6), at(3, 7)], [5, 5, 0, 0]);
  s.shadeRect(0, 3, 1, 1, Uint8Array.from({ length: 256 }, (_, i) => (i === 5 ? 6 : i)));
  assert.deepEqual([at(0, 6), at(1, 7)], [6, 6]);
  // Clipped at the edges.
  s.fillRect(318, 3, 10, 10, 4);
  assert.equal(at(639, 7), 4);
});

test('at 2x a widescreen surface centres the layout in layout pixels', () => {
  const s = new ScaledSurface(SCREEN_W, 4, 2);
  s.resize(426, SCREEN_W);
  assert.deepEqual([s.ox, s.pw, s.px.length], [53, 852, 852 * 8]);
  s.fillRect(0, 0, 1, 1, 7);
  assert.equal(s.px[106], 7);
  assert.equal(s.px[105], 0);
});

test('at 2x the view has twice the pixels and the same field of view', () => {
  const cam = { x: 5.3, y: 7.1, angle: 0.7, horizonOffset: 20 };
  const one = new View(VIEW_W);
  const two = new View(VIEW_W * 2, 2);
  one.setup(cam);
  two.setup(cam);
  assert.equal(two.H, VIEW_H * 2);
  assert.equal(two.fx, one.fx * 2);
  assert.equal(two.fy, one.fy * 2);
  assert.equal(two.planeLen, one.planeLen);
  // Looking up moves the horizon by the same share of the screen.
  assert.equal(two.horizon, one.horizon * 2);
});

test('the screen melt at 2x moves the old screen down in 2x2 blocks', () => {
  const wipe = new MeltWipe(4, 4, 2);
  assert.equal(wipe.old.length, 8 * 8);
  wipe.old.fill(3);
  wipe.active = true;
  wipe.y.fill(1);
  const px = new Uint8Array(64);
  wipe.draw(px);
  assert.deepEqual([px[1 * 8], px[2 * 8], px[7 * 8 + 7]], [0, 3, 3]);
});

test('a 2x frame is the 1x frame with finer pixels: walls, floors and things the same size', async () => {
  const one = await headlessRenderer();
  const two = await headlessRenderer({ scale: 2 });
  const tiles = ['##########', '#........#', '#..#.....#', '#........#', '#........#', '##########'];
  const level = room(tiles, ['', '', '', '', ' >'], { list: [{ type: 'med-kit', x: 3.5, y: 3.5 }] });
  const bare = room(tiles, ['', '', '', '', ' >']);
  const cams = [
    { x: 1.5, y: 3.5, angle: 0, z: 1.25 },
    { x: 1.5, y: 4.5, angle: 0.4, z: 1.25, horizonOffset: 25 },
  ];
  for (const cam of cams) {
    const a = one.shot(level, cam);
    const b = two.shot(level, cam);
    assert.equal(b.length, a.length * 4);
    // Each 1x pixel against the 2x pixel nearest its centre: edges fall a
    // half pixel apart, so most match but not all.
    let same = 0;
    for (let y = 0; y < VIEW_H; y++) for (let x = 0; x < VIEW_W; x++) if (a[y * VIEW_W + x] === b[(2 * y + 1) * VIEW_W * 2 + 2 * x + 1]) same++;
    assert.ok(same / a.length > 0.85, `${((100 * same) / a.length).toFixed(1)}% of pixels match`);
  }
  // The med-kit: the rows and columns it covers, twice as many at 2x.
  const box = (r, w) => {
    const a = r.shot(level, cams[0]);
    const b = r.shot(bare, cams[0]);
    let x0 = w, x1 = -1, y0 = Infinity, y1 = -1;
    for (let i = 0; i < a.length; i++) {
      if (a[i] === b[i]) continue;
      const x = i % w, y = (i / w) | 0;
      x0 = Math.min(x0, x), x1 = Math.max(x1, x), y0 = Math.min(y0, y), y1 = Math.max(y1, y);
    }
    return [x1 - x0 + 1, y1 - y0 + 1, x0, y0];
  };
  const small = box(one, VIEW_W);
  const big = box(two, VIEW_W * 2);
  assert.ok(small[1] > 4, 'the med-kit is in view');
  for (let i = 0; i < 4; i++) assert.ok(Math.abs(big[i] - 2 * small[i]) <= 2, `1x ${small}, 2x ${big}`);
});
