// Decals: see-through pictures on wall faces (Phase 1d step 7). Transparent
// where nothing is drawn. 32 texels are a tile (half a metre), so the crest
// is a metre across.
import { PixelCanvas, C, hash2, rng, seedFrom } from '../lib/tex.js';

const T = (name) => `assets/textures/${name}.png`;

/** The Empire's crest: a six-spoked wheel in a ring, pale metal. */
function crest() {
  const c = new PixelCanvas(64, 64);
  const metal = (x, y) => C('steel', 0.62 + 0.3 * (1 - (x + y) / 128));
  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 64; x++) {
      const dx = x - 31.5;
      const dy = y - 31.5;
      const r = Math.hypot(dx, dy);
      const a = Math.atan2(dy, dx);
      // The outer ring, the hub's ring, and six spokes between them, wider outward.
      const ring = r >= 26 && r <= 31;
      const hub = r >= 7 && r <= 12;
      const spoke = r > 12 && r < 26 && Math.abs(((((a / (Math.PI / 3)) % 1) + 1) % 1) - 0.5) * (Math.PI / 3) * r < 1.2 + (r - 12) * 0.32;
      if (ring || hub || spoke) c.set(x, y, metal(x, y));
      else if (r < 31 && r > 26.5 - 0.5) c.set(x, y, C('steel', 0.2));
    }
  }
  // A dark line inside the outer ring, and the edges shaded.
  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 64; x++) {
      const r = Math.hypot(x - 31.5, y - 31.5);
      if (c.opaque(x, y) && ((r > 28.2 && r < 29.2) || r > 30.4)) c.set(x, y, C('steel', 0.3));
    }
  }
  return c;
}

/** Hazard stripes: black and yellow diagonals in a dark frame. */
function hazard() {
  const c = new PixelCanvas(64, 16);
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 64; x++) {
      const stripe = (((x + y) >> 3) & 1) === 0;
      const wear = hash2(x, y, 51) < 0.08;
      c.set(x, y, stripe ? (wear ? C('olive', 0.5) : C('yellow', 0.55 + (y < 8 ? 0.1 : 0))) : C('gray', wear ? 0.2 : 0.06));
    }
  }
  c.rect(0, 0, 64, 1, C('gray', 0.12));
  c.rect(0, 15, 64, 1, C('gray', 0.03));
  return c;
}

/** A sector sign: a dark plate, a red bar, and a line of Aurebesh-like glyphs. */
function sign() {
  const c = new PixelCanvas(64, 32);
  c.rect(1, 4, 62, 24, C('steel', 0.12));
  c.frame(1, 4, 62, 24, C('steel', 0.45));
  c.rect(4, 7, 4, 18, C('blood', 0.55));
  const r = rng(seedFrom('decal-sign'));
  let x = 12;
  while (x < 57) {
    // A glyph: a few strokes in a 4x8 box.
    const w = 4;
    const strokes = [
      [0, 0, w, 1],
      [0, 7, w, 1],
      [0, 0, 1, 8],
      [w - 1, 0, 1, 8],
      [0, 3, w, 1],
      [1, 1, 1, 6],
    ];
    for (let k = 0; k < 3; k++) {
      const [sx, sy, sw, sh] = strokes[Math.floor(r.range(0, strokes.length))];
      c.rect(x + sx, 12 + sy, sw, sh, C('gray', 0.85));
    }
    x += w + 2;
  }
  c.rect(12, 23, 44, 1, C('steel', 0.35));
  return c;
}

/** A louvred vent plate. */
function vent() {
  const c = new PixelCanvas(32, 32);
  c.rect(0, 0, 32, 32, C('steel', 0.3));
  c.frame(0, 0, 32, 32, C('steel', 0.5));
  c.frame(1, 1, 30, 30, C('steel', 0.15));
  for (let y = 4; y < 28; y += 4) {
    c.rect(3, y, 26, 2, C('gray', 0.02));
    c.rect(3, y + 2, 26, 1, C('steel', 0.55));
  }
  return c;
}

export default [
  { name: 'decal-crest', out: T('decal-crest'), draw: crest },
  { name: 'decal-hazard', out: T('decal-hazard'), draw: hazard },
  { name: 'decal-sign', out: T('decal-sign'), draw: sign },
  { name: 'decal-vent', out: T('decal-vent'), draw: vent },
];
