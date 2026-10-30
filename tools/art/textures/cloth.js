// Cloth for hangings (world/hangings.js): woven, stained cloth whose torn
// hem, hanging strips and holes are transparent texels. 64 x 128 is 1 x 2 m
// (32 texels a tile). It tiles across, so a wide cloth repeats it; the hem
// is the bottom row, which the engine pins to the cloth's lower edge.
import { PixelCanvas, C, darken, fbm, rng, seedFrom } from '../lib/tex.js';

const T = (name) => `assets/textures/${name}.png`;
const W = 64;
const H = 128;

/**
 * How far up from the bottom the cloth is torn away in each column: strips
 * of 2 to 7 columns, each cut to its own depth, so some hang down as tatters
 * between deeper tears; ragged by a pixel or two along their edges. Tiles
 * across (the strips fill the width exactly).
 */
function hem(r, { deep, shallow, tatters }) {
  const cut = new Float32Array(W);
  let x = 0;
  while (x < W) {
    const w = Math.min(W - x, r.int(2, 7));
    const d = r.chance(tatters) ? r.range(0, 3) : r.range(shallow, deep);
    for (let k = 0; k < w; k++) cut[x + k] = d;
    x += w;
  }
  // Soften the steps a little, then fray: a pixel or two either way.
  const soft = new Float32Array(W);
  for (let i = 0; i < W; i++) soft[i] = (cut[(i + W - 1) % W] + 2 * cut[i] + cut[(i + 1) % W]) / 4;
  return Array.from(soft, (d) => Math.max(0, Math.round(d + r.range(-1.5, 1.5))));
}

/** A ragged hole centred at (cx, cy) (wrapping across), radius about `rad`. */
function holeAt(r, cx, cy, rad) {
  const lumps = Array.from({ length: 6 }, () => r.range(0.6, 1.3));
  return (x, y) => {
    let dx = x - cx;
    if (dx > W / 2) dx -= W;
    if (dx < -W / 2) dx += W;
    const dy = (y - cy) * 0.8;
    const a = Math.atan2(dy, dx);
    const k = ((a + Math.PI) / (2 * Math.PI)) * 6;
    const i = Math.floor(k) % 6;
    const f = k - Math.floor(k);
    const edge = rad * (lumps[i] * (1 - f) + lumps[(i + 1) % 6] * f);
    return Math.hypot(dx, dy) < edge;
  };
}

function cloth(name, { ramp, tone, deep, shallow, tatters, holes }) {
  return () => {
    const r = rng(seedFrom(name));
    const c = new PixelCanvas(W, H);
    const mottle = fbm(seedFrom(name) + 1, W, { cells: 4, sizeY: H });
    // Streaks down the cloth: noise that changes across, barely down.
    const streak = fbm(seedFrom(name) + 2, W, { cells: 8, sizeY: H, cellsY: 1, octaves: 2 });
    const cut = hem(r, { deep, shallow, tatters });
    const gone = [];
    for (let k = 0; k < holes; k++) gone.push(holeAt(r, r.range(0, W), r.range(H * 0.45, H - deep - 6), r.range(2, 4.5)));
    const torn = (x, y) => {
      const xx = ((x % W) + W) % W;
      return y >= H || y >= H - cut[xx] || gone.some((g) => g(xx, y));
    };
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (torn(x, y)) continue;
        // The weave: alternate threads a shade apart; mottled and streaked;
        // grubbier toward the hem.
        const weave = ((x + (y >> 1)) & 1 ? 0.015 : -0.015) + (y & 1 ? 0.01 : -0.01);
        const dirt = Math.max(0, (y / H - 0.6) / 0.4) * 0.12;
        let t = tone + weave + (mottle(x, y) - 0.5) * 0.18 + (streak(x, y) - 0.5) * 0.14 - dirt;
        let col = C(ramp, Math.min(1, Math.max(0, t)));
        // Frayed edges are darker: next to a tear or a hole.
        if (torn(x - 1, y) || torn(x + 1, y) || torn(x, y + 1) || torn(x, y - 1)) col = darken(col, 0.3);
        c.set(x, y, col);
      }
    }
    return c;
  };
}

export default [
  // Rust-red rag: torn hem with tatters, a few holes.
  { name: 'cloth-rag', out: T('cloth-rag'), draw: cloth('cloth-rag', { ramp: 'rust', tone: 0.5, deep: 34, shallow: 8, tatters: 0.3, holes: 3 }) },
  // Pale cloth: worn, lightly torn at the hem, one small hole.
  { name: 'cloth-pale', out: T('cloth-pale'), draw: cloth('cloth-pale', { ramp: 'beige', tone: 0.62, deep: 10, shallow: 2, tatters: 0.2, holes: 1 }) },
];
