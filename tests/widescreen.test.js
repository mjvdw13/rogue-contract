import test from 'node:test';
import assert from 'node:assert/strict';
import { screenWidth, SCREEN_W, MAX_SCREEN_W } from '../src/engine/config.js';
import { View } from '../src/engine/render/view.js';
import { Surface } from '../src/engine/gfx/surface.js';

test('the frame width follows the window: 4:3 and narrower stay 320, 21:9 is the cap', () => {
  assert.equal(screenWidth(4 / 3), SCREEN_W);
  assert.equal(screenWidth(1), SCREEN_W);
  assert.equal(screenWidth(16 / 10), 384);
  assert.equal(screenWidth(16 / 9), 426);
  assert.equal(screenWidth(21 / 9), MAX_SCREEN_W);
  assert.equal(screenWidth(32 / 9), MAX_SCREEN_W);
  for (let a = 1; a < 4; a += 0.01) assert.equal(screenWidth(a) % 2, 0, `even at aspect ${a.toFixed(2)}`);
});

test('a wider view only adds field of view at the edges; the centre 320 columns are unchanged', () => {
  const cam = { x: 5.3, y: 7.1, angle: 0.7 };
  const narrow = new View(320);
  const wide = new View(426);
  narrow.setup(cam);
  wide.setup(cam);
  assert.equal(wide.fx, narrow.fx);
  assert.equal(wide.fy, narrow.fy);
  assert.equal(wide.zbuf.length, 426);
  // The angle of a ray through column x (same formula as the renderer).
  const ray = (v, x) => {
    const camX = (2 * (x + 0.5)) / v.W - 1;
    return Math.atan2(v.dirY + v.planeY * camX, v.dirX + v.planeX * camX);
  };
  for (const x of [0, 80, 160, 319]) assert.ok(Math.abs(ray(narrow, x) - ray(wide, x + 53)) < 1e-9, `column ${x}`);
  // 90 degrees across 320 columns, about 106 across 426.
  const fov = (v) => (2 * Math.atan(v.planeLen) * 180) / Math.PI;
  assert.ok(Math.abs(fov(narrow) - 90) < 1e-9);
  assert.ok(Math.abs(fov(wide) - 106.2) < 0.1);
});

test('2D drawing is offset by the draw origin, so layout code keeps using 0..320', () => {
  const s = new Surface(SCREEN_W, 4);
  s.resize(426, SCREEN_W);
  assert.equal(s.ox, 53);
  assert.equal(s.left, -53);
  s.fillRect(0, 0, 1, 1, 7);
  assert.equal(s.px[53], 7);
  s.pixel(-53, 1, 9);
  assert.equal(s.px[426], 9);
  s.blit({ w: 1, h: 1, px: new Uint8Array([5]) }, 319, 2);
  assert.equal(s.px[2 * 426 + 53 + 319], 5);
});

test('full-screen pictures: a 560-wide one is centred and cropped, a 320-wide one is mirrored to fill', () => {
  const picture = (w) => ({ w, h: 1, px: Uint8Array.from({ length: w }, (_, i) => i % 250) });
  const dark = Uint8Array.from({ length: 256 }, () => 251);

  const wide = new Surface(SCREEN_W, 1);
  wide.resize(426, SCREEN_W);
  wide.blitBackdrop(picture(560), dark);
  assert.equal(wide.px[0], 67); // (560 - 426) / 2 columns cropped at each side
  assert.equal(wide.px[425], (67 + 425) % 250);

  const narrow = new Surface(SCREEN_W, 1);
  narrow.blitBackdrop(picture(560), dark);
  assert.equal(narrow.px[0], 120); // a 4:3 screen shows the centre 320 columns

  const mirrored = new Surface(SCREEN_W, 1);
  mirrored.resize(426, SCREEN_W);
  mirrored.blitBackdrop(picture(320), dark);
  assert.equal(mirrored.px[53], 0);
  assert.equal(mirrored.px[0], 251, 'the sides go through the darkening remap');
  assert.equal(mirrored.px[425], 251);
});
