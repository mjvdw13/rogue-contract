import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Palette, HAZE_ROW, HAZE_STEPS } from '../src/engine/gfx/palette.js';
import { Surface } from '../src/engine/gfx/surface.js';
import { quantize } from '../src/engine/gfx/image.js';
import { Assets } from '../src/engine/assets.js';
import { Renderer } from '../src/engine/render/renderer.js';
import { View } from '../src/engine/render/view.js';
import { World } from '../src/engine/world/world.js';
import { Rng } from '../src/engine/core/rng.js';
import { LIGHT_LEVELS, SCREEN_W, VIEW_H } from '../src/engine/config.js';
import { decodePNG } from '../tools/art/lib/png.js';
import { registry, room } from './helpers.js';

// Distance and haze (PLAN.md Phase 1d step 5): lit spaces read across a
// room, and outdoors far surfaces fade toward a haze colour, not to black.

const palette = new Palette(registry.paletteDef);
const HAZE = [32, 24, 64];
const near = (rgb, c) => Math.hypot(rgb[0] - c[0], rgb[1] - c[1], rgb[2] - c[2]);
const colour = (i) => [palette.rgb[i * 3], palette.rgb[i * 3 + 1], palette.rgb[i * 3 + 2]];

test('lit spaces read across a room, and dark ones stay dark', () => {
  const view = new View();
  view.setup({ x: 0, y: 0, angle: 0 }, 0.05);
  // A space lit at 144: about level 5 at 1 m (2 tiles), 11 at 2 m, 17 at 10 m (of 32).
  assert.ok(Math.abs(view.levelF(144, 2) - 5) < 1, `${view.levelF(144, 2)}`);
  assert.ok(Math.abs(view.levelF(144, 4) - 11) < 1, `${view.levelF(144, 4)}`);
  assert.ok(Math.abs(view.levelF(144, 20) - 17) < 1, `${view.levelF(144, 20)}`);
  assert.ok(view.levelF(144, 40) < 20, 'still not black 20 m away');
  assert.ok(view.levelF(200, 20) < 5, 'a bright pool is bright across the room');
  assert.ok(view.levelF(104, 20) > 24, 'a dark corner is dark');
});

test('haze colormaps fade lit colours toward the haze colour', () => {
  const maps = palette.hazeColormaps(HAZE);
  assert.equal(maps.length, (HAZE_ROW + (HAZE_STEPS - 1) * LIGHT_LEVELS) * 256);
  assert.deepEqual(maps.subarray(0, palette.colormaps.length), palette.colormaps, 'the light levels come first, unchanged');
  const row = (step, level) => (HAZE_ROW + (step - 1) * LIGHT_LEVELS + level) * 256;
  for (const level of [0, 16, 31]) {
    for (let i = 0; i < 255; i++) {
      assert.ok(near(colour(maps[row(HAZE_STEPS - 1, level) + i]), HAZE) < 24, `all the way: colour ${i} at level ${level}`);
    }
  }
  // Halfway, a bright colour lies between itself and the haze.
  const white = palette.nearest(255, 255, 255, true);
  const half = colour(maps[row((HAZE_STEPS - 1) / 2 + 0.5, 0) + white]);
  assert.ok(near(half, HAZE) > 60 && near(half, colour(white)) > 60, `halfway (${half})`);
  assert.equal(palette.hazeColormaps([...HAZE]), maps, 'kept for the next frame');
});

// ------------------------------------------------------------ rendering

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
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

/** A corridor 60 tiles long, under the sky or not, seen from its west end; the colours of the middle of the far wall. */
function farWall(sky, haze) {
  const row = '#' + '.'.repeat(60) + '#';
  const level = room(['#'.repeat(62), row, row, row, '#'.repeat(62)], ['', ' >'], {
    legend: { '.': { floor: 'imp-floor', ceiling: sky ? 'sky' : 'imp-ceiling', ceilZ: 3, light: 144 } },
    sky: 'sky-night',
    haze: haze ? { color: HAZE, half: 10 } : undefined,
  });
  const w = new World({ registry, assets, rng: new Rng(1), settings: { noMonsters: true } }, level, { skill: 3 });
  renderer.surface.clear(0);
  renderer.render(w, { x: 1.5, y: 2.5, angle: 0, z: 1 }, { skip: w.player });
  const s = renderer.surface;
  const out = [];
  for (let y = s.h / 2 - 2; y < s.h / 2 + 2; y++) for (let x = s.w / 2 - 2; x < s.w / 2 + 2; x++) out.push(colour(s.px[y * s.w + x]));
  return out;
}
const mean = (cs) => [0, 1, 2].map((k) => cs.reduce((a, c) => a + c[k], 0) / cs.length);

test('outdoors, far surfaces fade toward the haze colour instead of darkening', () => {
  const hazed = mean(farWall(true, true));
  const plain = mean(farWall(true, false));
  assert.ok(near(hazed, HAZE) < 20, `the far wall in the haze (${hazed})`);
  assert.ok(near(plain, HAZE) > near(hazed, HAZE), `without haze it's darker, not hazy (${plain})`);
});

test('indoors, haze changes nothing', () => {
  assert.deepEqual(farWall(false, true), farWall(false, false));
});
