// The X-34 landspeeder's see-through parts (models/speeder.js; its paint
// and metal are DF textures, assets/custom/derive.mjs). The model drawer
// can't blend, so both are mostly transparent texels:
//   speeder-glass   32 x 32, the windscreen: clear, with two glints of the
//                   suns running across it and specks of dust. Tiles.
//   speeder-shadow  128 x 64, the shadow under it (stretched over 3.4 x
//                   1.9, so its texels are about square): an oval, solid
//                   dark under the hull and dithered thinner toward its
//                   edge, so the street shows through more and more of it.
import { PixelCanvas, C, hash2, seedFrom } from '../lib/tex.js';

const T = (name) => `assets/textures/${name}.png`;

/** 4 x 4 ordered dither thresholds, 0..1. */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);

function glass() {
  const S = 32;
  const seed = seedFrom('speeder-glass');
  const c = new PixelCanvas(S, S);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      // Two glints on the diagonal, a broad one and a thin one (wrapping, so it tiles).
      const d = (x + y) % S;
      if (d === 5 || d === 6) c.set(x, y, C('gray', 0.92));
      else if (d === 4 || d === 7) c.set(x, y, C('steel', 0.85));
      else if (d === 13) c.set(x, y, C('steel', 0.8));
      else if (hash2(x, y, seed) < 0.035) c.set(x, y, C('sand', 0.7));
    }
  }
  return c;
}

function shadow() {
  const [w, h] = [128, 64];
  const c = new PixelCanvas(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const r = Math.hypot((x + 0.5) / w - 0.5, (y + 0.5) / h - 0.5) * 2;
      // Solid to 0.55 of the way out, none at the rim.
      const cover = Math.min(1, Math.max(0, (1 - r) / 0.45));
      if (cover > BAYER[(y & 3) * 4 + (x & 3)]) c.set(x, y, C('sand', 0.05));
    }
  }
  return c;
}

export default [
  { name: 'speeder-glass', out: T('speeder-glass'), draw: glass },
  { name: 'speeder-shadow', out: T('speeder-shadow'), draw: shadow },
];
