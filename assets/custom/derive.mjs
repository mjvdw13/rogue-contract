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
// softens its grain (n passes of a 3x3 blur, wrapping round); `scale: [w,
// h]` shrinks it to w x h texels; `tile: [nx, ny]` repeats it (to widen a
// sky, or tile a shrunk one), and `fade: { color, from }` blends toward
// `color` from `from` (0 top, 1 bottom) down to the bottom row (a sky's
// haze at the horizon), and `rust: { color, amount, cell, seed }` stains it
// with blotches of rust that tile.
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
const OCHRE = [[110, 76, 46], [176, 130, 88], [214, 160, 112], [224, 170, 120], [232, 186, 140], [240, 206, 166]];
const ROSE = [[110, 80, 60], [186, 150, 120], [226, 190, 156], [236, 200, 166], [240, 214, 184]];
const GREY = [[80, 76, 68], [124, 118, 106], [164, 156, 142], [180, 172, 156], [196, 188, 170], [214, 206, 188]];
export const TOWN = [
  // Smooth plaster: Gromas' plain speckled wall.
  { out: 'adobe', df: 'GWANO', crop: [0, 0, 128, 128], smooth: 1, gradient: PLASTER, keep: 0, contrast: 0.35 },
  // Whitewash, paler and cooler.
  { out: 'adobe-pale', df: 'GWANO', crop: [0, 0, 128, 128], smooth: 1, gradient: WHITEWASH, keep: 0, contrast: 0.35 },
  // More plasters, so a street isn't one colour: ochre (the palette's rust
  // ramp: it has no golden ochres, so it comes out terracotta), rose (a
  // pale peach, its skin ramp) and grey (its concrete ramp).
  { out: 'adobe-ochre', df: 'GWANO', crop: [0, 0, 128, 128], smooth: 1, gradient: OCHRE, keep: 0, contrast: 0.35 },
  { out: 'adobe-rose', df: 'GWANO', crop: [0, 0, 128, 128], smooth: 1, gradient: ROSE, keep: 0, contrast: 0.35 },
  { out: 'adobe-grey', df: 'GWANO', crop: [0, 0, 128, 128], smooth: 1, gradient: GREY, keep: 0, contrast: 0.35 },
  // The dirty foot of every wall: sand kicked up and rain-less grime, darker
  // toward the ground. A band 1 tile high shows its top 32 rows.
  { out: 'adobe-skirt', df: 'GWANO', crop: [0, 0, 128, 32], gradient: [[56, 40, 24], [96, 72, 46], [128, 100, 68], [150, 122, 86], [170, 144, 106]], keep: 0, contrast: 0.6, fade: { color: [84, 62, 40], from: 0 } },
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
  // Loose sand the wind piles against the walls: paler and softer.
  { out: 'street-drift', df: 'ZPROCK02', smooth: 1, gradient: [[150, 120, 82], [199, 172, 129], [216, 193, 152], [232, 214, 176]], keep: 0, contrast: 0.5 },
  // Small pale tiles lining a doorway's jamb: ZPTILE4's bevelled square, shrunk and repeated.
  { out: 'door-jamb', df: 'ZPTILE4', scale: [16, 16], tile: [4, 4], gradient: [[90, 80, 62], [172, 160, 128], [209, 198, 168], [236, 226, 198]], keep: 0, contrast: 1 },
  { out: 'flagstone', df: 'IPDET1', gradient: [[44, 32, 22], [100, 78, 56], [150, 122, 90], [190, 162, 124], [220, 198, 160]], keep: 0.1, contrast: 0.9 },
  // Corrugated tin for lean-to roofs: TestBase's ribbed panel, its ribs
  // running down the texture, rusted (`rust`: blotches of rust that tile)
  // or galvanised grey going rusty.
  { out: 'metal-rust', df: 'ZWGRUV1', crop: [0, 0, 32, 64], tile: [2, 1], gradient: [[30, 16, 8], [74, 40, 18], [120, 66, 32], [160, 96, 52], [190, 130, 82]], keep: 0, contrast: 0.9, rust: { color: [52, 26, 12], amount: 0.6, cell: 16, seed: 1 } },
  { out: 'metal-grey', df: 'ZWGRUV1', crop: [0, 0, 32, 64], tile: [2, 1], gradient: [[40, 40, 40], [88, 86, 82], [130, 126, 118], [166, 160, 150], [196, 190, 178]], keep: 0, contrast: 0.9, rust: { color: [120, 64, 30], amount: 0.5, cell: 16, seed: 2 } },
  // A hazy day: Robotics' pale cloudy sky, twice as wide, warming to dust at the horizon.
  { out: 'sky-day', df: 'RESKY01', gradient: [[74, 128, 182], [120, 166, 206], [168, 198, 222], [214, 226, 236]], keep: 0.3, contrast: 0.9, tile: [2, 1], fade: { color: [212, 200, 174], from: 0.55 } },
];

/**
 * Mos Eisley's doors and windows: decals (see-through pictures on the
 * walls), cut from DF textures. `size: [w, h]` scales the source (after
 * `crop`) to that many texels (32 a tile); `mask` cuts its shape, `'arch'`
 * (a round top as wide as it) or `'round'` (corners of radius `r`), and
 * `rim` darkens a border `width` texels wide toward `color`: the shadow of
 * the opening's reveal, so a flat decal looks set into the wall.
 */
const REVEAL = { width: 3, color: [52, 38, 26] };
const TEAL = [[4, 16, 18], [16, 58, 62], [44, 116, 118], [110, 190, 188]];
export const DECALS = [
  // Doors after the film's (Mark's reference, 2026-10-17): a panel with a
  // lattice of braces (IDDOOR1), red-brown or grey, its corners rounded to
  // fit the tiled jamb round it (models/door-jamb.js), 2 tiles by 3.
  { out: 'door-red', df: 'IDDOOR1', size: [64, 96], gradient: [[44, 22, 10], [90, 48, 24], [132, 72, 40], [166, 100, 64]], keep: 0, contrast: 0.9, mask: 'round', r: 11, rim: { width: 1.5, color: [24, 16, 10] } },
  { out: 'door-grey', df: 'IDDOOR1', size: [64, 96], gradient: [[28, 28, 28], [68, 66, 62], [114, 110, 102], [156, 152, 142]], keep: 0, contrast: 0.9, mask: 'round', r: 11, rim: { width: 1.5, color: [24, 16, 10] } },
  // Over a door: a little striped panel, navy and orange (Nar Shaddaa's
  // louvres, their slats mapped dark to navy and light to orange); beside
  // it, the door's control panel (a DF switch as it is).
  { out: 'door-sign', df: 'NPVENTS1', crop: [8, 8, 48, 24], size: [32, 10], gradient: [[12, 7, 50], [24, 15, 74], [210, 110, 24], [255, 176, 72]], keep: 0, contrast: 1.3, mask: 'round', r: 1, rim: { width: 1, color: [40, 30, 20] } },
  { out: 'door-panel', df: 'ZASWIT04_0', size: [8, 16], mask: 'round', r: 1 },
  // A shop's roll-down shutter, 3 tiles wide: a strip of Nar Shaddaa's
  // corrugated door clear of its red sign, stretched sideways.
  { out: 'shutter', df: 'NDCORUG1', crop: [119, 0, 8, 96], size: [96, 72], gradient: [[30, 26, 22], [74, 66, 56], [118, 108, 92], [160, 150, 132]], keep: 0, contrast: 0.9, mask: 'round', r: 4, rim: REVEAL },
  // Windows, a tile wide and 1.25 high to fill their notch (town.window()):
  // dark behind rusty bars, and teal louvred shutters.
  { out: 'window-bars', df: 'SPBARS1', size: [32, 40], gradient: [[8, 6, 4], [30, 22, 14], [80, 58, 36], [136, 98, 60]], keep: 0.2, contrast: 1, mask: 'round', r: 8, rim: REVEAL },
  { out: 'window-louvre', df: 'NPVENTS1', size: [32, 40], gradient: TEAL, keep: 0, contrast: 0.9, mask: 'arch', rim: REVEAL },
];

/**
 * The edges of the street's sand drifts: one 64x64 texture for each way a
 * tile's corners can be sand or drift (bit 1 its north-west corner, 2
 * north-east, 4 south-east, 8 south-west), `street-drift-1` to `-14`. Each
 * texel blends the corners and adds a noise that repeats every tile, so a
 * drift's edge wanders across the tile and meets the next tile's edge
 * exactly. A quarter of the texture shows on each tile (the floors are
 * world-aligned, 64 texels to 2 tiles), so each quarter is cut the same.
 */
export const DRIFT_EDGES = { sand: 'street-sand', drift: 'street-drift', out: 'street-drift', amp: 0.7 };

/** Smooth value noise in 0-1 that repeats every `period` texels, over cells of `cell`. */
function periodicNoise(x, y, cell, period, seed) {
  const n = period / cell;
  const h = (i, j) => {
    let v = Math.imul(((i % n) + n) % n * 374761393 + (((j % n) + n) % n) * 668265263 + seed * 1442695041, 1274126177);
    v = Math.imul(v ^ (v >>> 13), 1103515245);
    return ((v ^ (v >>> 16)) >>> 0) / 4294967296;
  };
  const fx = x / cell;
  const fy = y / cell;
  const i = Math.floor(fx);
  const j = Math.floor(fy);
  const u = (fx - i) * (fx - i) * (3 - 2 * (fx - i));
  const v = (fy - j) * (fy - j) * (3 - 2 * (fy - j));
  const a = h(i, j) + (h(i + 1, j) - h(i, j)) * u;
  const b = h(i, j + 1) + (h(i + 1, j + 1) - h(i, j + 1)) * u;
  return a + (b - a) * v;
}

/** The drift edge for corner bits `m` (see DRIFT_EDGES), from the sand and drift images. */
export function driftEdge(sand, drift, m, amp = DRIFT_EDGES.amp) {
  const { width: w, height: h } = sand;
  const data = new Uint8Array(sand.data);
  const T = 32;
  const c = [m & 1, (m >> 1) & 1, (m >> 2) & 1, (m >> 3) & 1].map(Number);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const lx = x % T;
      const ly = y % T;
      const u = (lx + 0.5) / T;
      const v = (ly + 0.5) / T;
      const blend = (c[0] * (1 - u) + c[1] * u) * (1 - v) + (c[3] * (1 - u) + c[2] * u) * v;
      const n = periodicNoise(lx, ly, 8, T, 3) * 0.65 + periodicNoise(lx, ly, 4, T, 4) * 0.35;
      if (blend + amp * (n - 0.5) > 0.5) {
        const i = (y * w + x) * 4;
        data.set(drift.data.subarray(i, i + 4), i);
      }
    }
  }
  return { width: w, height: h, data };
}

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

/** An image scaled to w x h (nearest texel). */
function resized(img, [w, h]) {
  const data = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const s = (Math.floor((y * img.height) / h) * img.width + Math.floor((x * img.width) / w)) * 4;
      data.set(img.data.subarray(s, s + 4), (y * w + x) * 4);
    }
  }
  return { width: w, height: h, data };
}

/** Cut a decal's shape out (see DECALS): transparent outside it, the rim darkened inside its edge. */
function masked(img, { mask, r = 0, rim }) {
  const { width: w, height: h, data: d } = img;
  // How far (in texels) a texel's centre is inside the shape; below 0 is outside.
  const depth = (x, y) => {
    const px = x + 0.5;
    const py = y + 0.5;
    let e = Math.min(px, w - px, h - py, py);
    // An arch rounds its top corners into one curve; a rounded box all four.
    const rr = mask === 'arch' ? w / 2 : r;
    const cy = py < rr ? rr : mask === 'round' && py > h - rr ? h - rr : null;
    if (cy !== null && (px < rr || px > w - rr)) {
      const cx = px < rr ? rr : w - rr;
      e = Math.min(e, rr - Math.hypot(px - cx, py - cy));
    }
    return e;
  };
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const e = depth(x, y);
      if (e <= 0) {
        d[i + 3] = 0;
        continue;
      }
      d[i + 3] = 255;
      if (rim && e < rim.width) {
        const t = 0.85 * (1 - e / rim.width) + 0.15;
        for (let k = 0; k < 3; k++) d[i + k] = Math.round(d[i + k] + (rim.color[k] - d[i + k]) * t);
      }
    }
  }
  return img;
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

/**
 * Rust: blotches of `color` where a noise that repeats with the texture
 * (it must be square) is high, up to `amount` of the way, so it still tiles.
 */
function rusted(img, { color, amount, cell, seed }) {
  const d = img.data;
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const n = periodicNoise(x, y, cell, img.width, seed) * 0.7 + periodicNoise(x, y, cell / 4, img.width, seed + 1) * 0.3;
      const t = Math.max(0, Math.min(1, (n - 0.5) * 4)) * amount;
      if (!t) continue;
      const i = (y * img.width + x) * 4;
      for (let k = 0; k < 3; k++) d[i + k] = Math.round(d[i + k] + (color[k] - d[i + k]) * t);
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
  const made = new Map();
  for (const spec of TOWN) {
    let img = decodePNG(fs.readFileSync(pack.get(spec.df)));
    if (spec.crop) img = cropped(img, spec.crop);
    if (spec.smooth) img = smoothed(img, spec.smooth);
    if (spec.scale) img = resized(img, spec.scale);
    if (spec.tile) img = tiled(img, spec.tile);
    img = gradientMap(img, spec);
    if (spec.fade) img = faded(img, spec.fade);
    if (spec.rust) img = rusted(img, spec.rust);
    for (let i = 3; i < img.data.length; i += 4) img.data[i] = 255;
    made.set(spec.out, img);
    fs.writeFileSync(path.join(texDir, `${spec.out}.png`), encodePNG(img.width, img.height, img.data));
    console.log(`${spec.out}.png from ${spec.df} (${img.width}x${img.height})`);
  }
  for (let m = 1; m < 15; m++) {
    const img = driftEdge(made.get(DRIFT_EDGES.sand), made.get(DRIFT_EDGES.drift), m);
    fs.writeFileSync(path.join(texDir, `${DRIFT_EDGES.out}-${m}.png`), encodePNG(img.width, img.height, img.data));
  }
  console.log(`${DRIFT_EDGES.out}-1..14.png, the drifts' edges`);
  for (const spec of DECALS) {
    let img = decodePNG(fs.readFileSync(pack.get(spec.df)));
    if (spec.crop) img = cropped(img, spec.crop);
    img = resized(img, spec.size);
    for (let i = 3; i < img.data.length; i += 4) img.data[i] = 255;
    img = masked(spec.gradient ? gradientMap(img, spec) : img, spec);
    fs.writeFileSync(path.join(texDir, `${spec.out}.png`), encodePNG(img.width, img.height, img.data));
    console.log(`${spec.out}.png from ${spec.df} (${img.width}x${img.height}, a decal)`);
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
