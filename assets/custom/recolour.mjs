// Colour fixes for ripped sheets, applied by cut.mjs after cutting.
//
//   node assets/custom/recolour.mjs officer    recolour the committed officer.png in place
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodePNG, encodePNG } from '../../tools/art/lib/png.js';

const here = path.dirname(fileURLToPath(import.meta.url));

function toHsv(r, g, b) {
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const d = mx - mn;
  let h = 0;
  if (d) h = mx === r ? ((g - b) / d + 6) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, mx ? d / mx : 0, mx];
}

function toRgb(h, s, v) {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [r + m, g + m, b + m].map((n) => Math.round(Math.max(0, Math.min(255, n))));
}

/**
 * Per sheet, a function from a pixel's colour to its new colour. The Dark
 * Forces officer's uniform is a brownish khaki in the rip; the films' (and
 * the old palette's) olive grey reads as Imperial, so the uniform's browns
 * turn olive and lose some saturation. Skin (redder and brighter) and the
 * black cap, boots and belt are left alone.
 */
export const RECOLOUR = {
  officer: ([r, g, b]) => {
    const [h, s, v] = toHsv(r, g, b);
    // (The uniform's dark outlines are redder; skin is brighter.)
    const uniform = h >= 29 ? h <= 52 && s >= 0.3 : h >= 18 && s >= 0.5 && v < 100;
    if (!uniform) return [r, g, b];
    return toRgb(58, s * 0.5, v * 0.97);
  },
};

/** Recolour an RGBA image's opaque pixels in place. */
export function recolour(data, fn) {
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue;
    const [r, g, b] = fn([data[i], data[i + 1], data[i + 2]]);
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }
  return data;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const asset = process.argv[2];
  if (!RECOLOUR[asset]) throw new Error(`usage: node assets/custom/recolour.mjs <${Object.keys(RECOLOUR).join(' | ')}>`);
  const file = path.join(here, `${asset}.png`);
  const img = decodePNG(fs.readFileSync(file));
  recolour(img.data, RECOLOUR[asset]);
  fs.writeFileSync(file, encodePNG(img.width, img.height, img.data));
  console.log(`Recoloured ${asset}.png`);
}
