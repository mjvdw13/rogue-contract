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

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
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
