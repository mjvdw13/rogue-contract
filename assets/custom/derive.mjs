// Derives more textures from the Dark Forces textures already in
// assets/custom/textures/ (written there by textures.mjs from the pack), and
// adds their entries to overrides.json. Run it after textures.mjs. See
// DISCLAIMER.md.
//
//   node assets/custom/derive.mjs
//
// A derived texture is a DF texture recoloured by a gradient map: each
// pixel's brightness picks a colour along `gradient` (dark to light), and
// `keep` of its own colour's difference from grey is kept, so streaks and
// stains stay visible. The canyon's sandstone and sand come from DF's grey
// cliff (Talay) and SecBase's rock floor.
//
// Mos Eisley's textures (`TOWN`) are recoloured straight from the pack
// (`df`, a texture's name in df-textures/), with no generated stand-in:
// src/content/textures.js loads them from here directly. `crop: [x, y, w,
// h]` takes part of the source (the plain top of a busy wall); `smooth: n`
// softens its grain (n passes of a 3x3 blur, wrapping round); `tile: [nx, ny]`
// repeats the source first (to widen a sky), and `fade: { color, from }`
// blends toward `color` from `from` (0 top, 1 bottom) down to the bottom
// row (a sky's haze at the horizon).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodePNG, encodePNG } from '../../tools/art/lib/png.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const texDir = path.join(here, 'textures');

/** Tatooine sandstone, from pale dust to deep shadow. */
const SANDSTONE = [[24, 16, 12], [70, 48, 34], [124, 90, 62], [172, 134, 96], [210, 178, 136], [236, 216, 182]];

export const DERIVED = [
  // The canyon walls: sandstone, with darker and paler strata for the cliffs' ledges.
  { out: 'sandstone', from: 'canyon-rock', gradient: SANDSTONE, keep: 0.5, contrast: 1.05 },
  { out: 'sandstone-dark', from: 'canyon-rock', gradient: [[18, 10, 8], [56, 32, 24], [100, 62, 42], [140, 94, 64], [176, 132, 96]], keep: 0.5, contrast: 1.1 },
  { out: 'sandstone-pale', from: 'canyon-rock', gradient: [[40, 32, 24], [96, 80, 62], [150, 130, 102], [196, 178, 146], [232, 220, 196]], keep: 0.4, contrast: 0.95 },
  // The canyon floor: sand, and darker gravel in the washes.
  { out: 'desert-sand', from: 'sand', gradient: [[52, 38, 26], [104, 80, 56], [148, 118, 84], [182, 152, 112], [206, 180, 140]], keep: 0.2, contrast: 0.55 },
  { out: 'desert-gravel', from: 'sand', gradient: [[40, 30, 22], [86, 68, 48], [124, 100, 72], [158, 130, 96], [190, 164, 126]], keep: 0.2, contrast: 1.15 },
];

/** Mos Eisley's walls, roofs, streets and sky: warm plaster and packed sand under a pale, dusty sky. */
// (Key colours from the palette's sand and beige ramps: pale tones between
// them snap to olive greys in the game.)
const PLASTER = [[96, 74, 48], [137, 109, 74], [179, 151, 109], [199, 172, 129], [216, 193, 152], [232, 214, 176]];
const WHITEWASH = [[95, 86, 66], [153, 141, 112], [181, 169, 138], [209, 198, 168], [236, 226, 198]];
export const TOWN = [
  // Smooth plaster: Gromas' plain speckled wall.
  { out: 'adobe', df: 'GWANO', crop: [0, 0, 128, 128], smooth: 1, gradient: PLASTER, keep: 0, contrast: 0.35 },
  // Whitewash, paler and cooler.
  { out: 'adobe-pale', df: 'GWANO', crop: [0, 0, 128, 128], smooth: 1, gradient: WHITEWASH, keep: 0, contrast: 0.35 },
  // Weathered plaster, darker and dirtier, for the old quarter.
  { out: 'adobe-old', df: 'ZPMARBY1', gradient: [[34, 24, 16], [86, 62, 42], [136, 104, 72], [178, 144, 104], [206, 178, 136]], keep: 0.1, contrast: 0.7 },
  // Sun-bleached wooden planks (doors, shutters, stalls): TestBase's streaked granite.
  { out: 'planks', df: 'IWGRAN5', gradient: [[34, 24, 16], [86, 62, 42], [136, 104, 72], [178, 144, 104], [206, 178, 136]], keep: 0.1, contrast: 0.5 },
  // Mud brick where the plaster is gone.
  { out: 'adobe-brick', df: 'ZPBRICK1', gradient: [[30, 20, 12], [80, 56, 36], [130, 96, 64], [168, 132, 92], [196, 164, 120]], keep: 0.1, contrast: 1 },
  // Flat roofs of packed clay.
  { out: 'adobe-roof', df: 'IPGREYC2', gradient: [[50, 36, 24], [104, 80, 56], [146, 116, 82], [180, 150, 110], [204, 178, 136]], keep: 0.1, contrast: 0.8 },
  // The street: sand packed hard, and flagstones in the plazas.
  { out: 'street-sand', df: 'ZPROCK02', gradient: [[62, 46, 30], [116, 90, 62], [160, 128, 92], [192, 162, 120], [214, 188, 146]], keep: 0.1, contrast: 0.6 },
  { out: 'flagstone', df: 'IPDET1', gradient: [[44, 32, 22], [100, 78, 56], [150, 122, 90], [190, 162, 124], [220, 198, 160]], keep: 0.1, contrast: 0.9 },
  // A hazy day: Robotics' pale cloudy sky, twice as wide, warming to dust at the horizon.
  { out: 'sky-day', df: 'RESKY01', gradient: [[74, 128, 182], [120, 166, 206], [168, 198, 222], [214, 226, 236]], keep: 0.3, contrast: 0.9, tile: [2, 1], fade: { color: [212, 200, 174], from: 0.55 } },
];

/** Colour at position t (0..1) along a gradient of key colours. */
function along(keys, t) {
  const f = Math.max(0, Math.min(1, t)) * (keys.length - 1);
  const k = Math.min(keys.length - 2, Math.floor(f));
  const u = f - k;
  return [0, 1, 2].map((c) => keys[k][c] + (keys[k + 1][c] - keys[k][c]) * u);
}

/** Recolour an image by a gradient map (see above). */
export function gradientMap(img, { gradient, keep = 0, contrast = 1 }) {
  const d = img.data;
  // Normalise to the image's own brightness range, so dark and pale sources both use the whole gradient.
  let lo = 255;
  let hi = 0;
  const lum = (i) => d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 128) continue;
    lo = Math.min(lo, lum(i));
    hi = Math.max(hi, lum(i));
  }
  const out = new Uint8Array(d);
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 128) continue;
    const l = lum(i);
    const t = 0.5 + ((l - lo) / Math.max(1, hi - lo) - 0.5) * contrast;
    const c = along(gradient, t);
    for (let k = 0; k < 3; k++) out[i + k] = Math.round(Math.max(0, Math.min(255, c[k] + (d[i + k] - l) * keep)));
  }
  return { width: img.width, height: img.height, data: out };
}

/** Part of an image. */
function cropped(img, [x0, y0, w, h]) {
  const data = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) data.set(img.data.subarray(((y0 + y) * img.width + x0) * 4, ((y0 + y) * img.width + x0 + w) * 4), y * w * 4);
  return { width: w, height: h, data };
}

/** `n` passes of a 3x3 box blur, wrapping round the edges so the texture still tiles. */
function smoothed(img, n) {
  const { width: w, height: h } = img;
  let d = img.data;
  for (let pass = 0; pass < n; pass++) {
    const out = new Uint8Array(d);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        for (let k = 0; k < 3; k++) {
          let sum = 0;
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) sum += d[((((y + dy) % h) + h) % h * w + ((((x + dx) % w) + w) % w)) * 4 + k];
          out[(y * w + x) * 4 + k] = Math.round(sum / 9);
        }
      }
    }
    d = out;
  }
  return { width: w, height: h, data: d };
}

/** Repeat an image nx by ny times. */
function tiled(img, [nx, ny]) {
  const w = img.width * nx;
  const h = img.height * ny;
  const data = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const s = ((y % img.height) * img.width + (x % img.width)) * 4;
      data.set(img.data.subarray(s, s + 4), (y * w + x) * 4);
    }
  }
  return { width: w, height: h, data };
}

/** Blend toward `color` from row `from` (a fraction of the height) to the bottom. */
function faded(img, { color, from }) {
  const d = img.data;
  for (let y = 0; y < img.height; y++) {
    const t = Math.max(0, (y / (img.height - 1) - from) / (1 - from));
    if (!t) continue;
    for (let x = 0; x < img.width; x++) {
      const i = (y * img.width + x) * 4;
      for (let k = 0; k < 3; k++) d[i + k] = Math.round(d[i + k] + (color[k] - d[i + k]) * t * t);
    }
  }
  return img;
}

/** The pack's textures by upper-case name. */
function packFiles() {
  const files = new Map();
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.toLowerCase().endsWith('.png')) files.set(e.name.slice(0, -4).toUpperCase(), p);
    }
  })(path.join(here, 'df-textures'));
  return files;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const pack = packFiles();
  for (const spec of TOWN) {
    let img = decodePNG(fs.readFileSync(pack.get(spec.df)));
    if (spec.crop) img = cropped(img, spec.crop);
    if (spec.smooth) img = smoothed(img, spec.smooth);
    if (spec.tile) img = tiled(img, spec.tile);
    img = gradientMap(img, spec);
    if (spec.fade) img = faded(img, spec.fade);
    for (let i = 3; i < img.data.length; i += 4) img.data[i] = 255;
    fs.writeFileSync(path.join(texDir, `${spec.out}.png`), encodePNG(img.width, img.height, img.data));
    console.log(`${spec.out}.png from ${spec.df} (${img.width}x${img.height})`);
  }
  const overridesFile = path.join(here, 'overrides.json');
  const overrides = JSON.parse(fs.readFileSync(overridesFile, 'utf8'));
  for (const spec of DERIVED) {
    const src = decodePNG(fs.readFileSync(path.join(texDir, `${spec.from}.png`)));
    const img = gradientMap(src, spec);
    fs.writeFileSync(path.join(texDir, `${spec.out}.png`), encodePNG(img.width, img.height, img.data));
    overrides[`assets/textures/${spec.out}.png`] = { src: `assets/custom/textures/${spec.out}.png` };
    console.log(`${spec.out}.png from ${spec.from}.png (${img.width}x${img.height})`);
  }
  fs.writeFileSync(overridesFile, JSON.stringify(overrides, null, 2) + '\n');
}
