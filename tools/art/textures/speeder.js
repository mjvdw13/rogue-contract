// The X-34 landspeeder's see-through parts (models/speeder.js; its paint
// and metal are DF textures, assets/custom/derive.mjs):
//   speeder-glass   32 x 32, the windscreen: clear (transparent texels),
//                   with two glints of the suns running across it and
//                   specks of dust. Tiles.
//   speeder-shadow  128 x 64, the shadow under it (stretched over 3.4 x
//                   1.9, so its texels are about square): grime (a texel's
//                   grey is the share of light it leaves, see grime.js), an
//                   oval taking a third of the light under the hull and
//                   fading to nothing at its edge. Raw greys, not palette
//                   colours.
import { PixelCanvas, C, hash2, seedFrom } from '../lib/tex.js';

const T = (name) => `assets/textures/${name}.png`;
/** How much light the shadow takes away under the hull (0 to 1). */
const SHADOW = 0.35;

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
      // Full to 0.4 of the way out, then fading smoothly to none at the rim.
      const t = Math.min(1, Math.max(0, (1 - r) / 0.6));
      const v = Math.round(255 * (1 - SHADOW * t * t * (3 - 2 * t)));
      c.set(x, y, v < 254 ? [v, v, v] : null);
    }
  }
  return c;
}

export default [
  { name: 'speeder-glass', out: T('speeder-glass'), draw: glass },
  { name: 'speeder-shadow', out: T('speeder-shadow'), draw: shadow, raw: true },
];
