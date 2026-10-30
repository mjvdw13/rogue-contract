// Awning canvas for Mos Eisley (lib/town.js, awning()): plain cloth, no
// stripes, bleached by the suns in blotches, stained, and patched with
// scraps of other cloth sewn on by hand. Mostly muted (sand, olive, faded
// rust, dark umber), with a faded teal for a splash. 64 x 64 is 2 x 2
// tiles (32 texels a tile), and every one tiles both ways. Each comes
// three ways:
//   awning-<name>      the dirt running down the texture (v): the awning
//                      models' tops, and the slab's underside on an awning
//                      looking north or south (flats are world-aligned)
//   awning-<name>-x    the same turned a quarter, for one looking east or west
//   awning-<name>-hem  64 x 16, the front edge: torn to tatters along its
//                      bottom (transparent), for the fixed fringe and a
//                      swaying valance (a hanging's hem is the bottom row)
import { PixelCanvas, C, darken, fbm, hash2, rng, seedFrom } from '../lib/tex.js';

const T = (name) => `assets/textures/${name}.png`;
const S = 64;
/** The hem's height (texels): the top few rows stay whole, the rest is torn. */
const HEM = 16;
const WHOLE = 3;

/**
 * A scrap sewn on: a lumpy four-sided patch round (cx, cy), wrapping
 * across the texture's edges, `w` by `h` texels give or take.
 */
function scrap(r, cx, cy, w, h) {
  // Each side bows in or out a little, and the patch is skewed: cut by hand.
  const bow = Array.from({ length: 4 }, () => r.range(-1.5, 1.5));
  const skew = r.range(-0.25, 0.25);
  return (x, y) => {
    let dx = x - cx;
    let dy = y - cy;
    dx -= Math.round(dx / S) * S;
    dy -= Math.round(dy / S) * S;
    dx += dy * skew;
    const hx = w / 2 + (dx < 0 ? bow[0] : bow[1]) * Math.cos((dy / h) * Math.PI);
    const hy = h / 2 + (dy < 0 ? bow[2] : bow[3]) * Math.cos((dx / w) * Math.PI);
    return Math.abs(dx) < hx && Math.abs(dy) < hy;
  };
}

/**
 * The canvas: `ramp` at `tone`, bleached toward `fade` (a [ramp, tone]) in
 * blotches, `fadeAmount` of it; `scraps` patches of other cloth
 * ([ramp, tone] each), sewn on with big uneven stitches.
 */
function canvas(name, { ramp, tone, fade, fadeAmount = 0.3, scraps = [] }) {
  const seed = seedFrom(name);
  const r = rng(seed);
  const mottle = fbm(seed + 1, S, { cells: 4 });
  // Dirt run down the cloth from where rain pools, and where the suns have bleached it.
  const streak = fbm(seed + 2, S, { cells: 8, cellsY: 1, octaves: 2 });
  const stains = fbm(seed + 3, S, { cells: 3, octaves: 3 });
  const bleach = fbm(seed + 4, S, { cells: 3, octaves: 3 });
  const patches = scraps.map(([pr, pt]) => ({
    at: scrap(r, r.int(0, S - 1), r.int(0, S - 1), r.int(9, 18), r.int(8, 15)),
    ramp: pr,
    tone: pt,
  }));
  const patchAt = (x, y) => patches.find((p) => p.at(x, y));
  const c = new PixelCanvas(S, S);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const p = patchAt(x, y);
      let [rp, t] = p ? [p.ramp, p.tone] : [ramp, tone];
      // Bleached in blotches where the suns have had it longest, their
      // edges broken up a texel at a time.
      const b = bleach(x, y) + (hash2(x, y, seed + 5) - 0.5) * 0.12;
      if (!p && fade && b > 0.75 - fadeAmount * 0.6) [rp, t] = fade;
      // The weave, a shade apart; mottled; dirt and stains.
      const weave = ((x + (y >> 1)) & 1 ? 0.012 : -0.012) + (y & 1 ? 0.008 : -0.008);
      t += weave + (mottle(x, y) - 0.5) * 0.14 + (streak(x, y) - 0.5) * 0.12;
      if (stains(x, y) > 0.66) t -= Math.min(0.12, (stains(x, y) - 0.66) * 0.6);
      let col = C(rp, Math.min(1, Math.max(0, t)));
      if (p) {
        // The patch's edge, darker where it's folded under, and stitches
        // across it at uneven gaps.
        const edge = !p.at(x - 1, y) || !p.at(x + 1, y) || !p.at(x, y - 1) || !p.at(x, y + 1);
        if (edge) col = darken(col, hash2(x, y, seed + 6) < 0.4 ? 0.35 : 0.15);
      } else if (patchAt(x - 1, y) || patchAt(x + 1, y) || patchAt(x, y - 1) || patchAt(x, y + 1)) {
        if (hash2(x, y, seed + 7) < 0.5) col = darken(col, 0.3);
      }
      if (hash2(x, y, seed + 9) < 0.03) col = darken(col, 0.12);
      c.set(x, y, col);
    }
  }
  return c;
}

/** The canvas turned a quarter (x and y swapped). */
function turned(c) {
  const out = new PixelCanvas(S, S);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) out.set(x, y, c.get(y, x));
  return out;
}

/**
 * The front edge: the canvas's top rows, torn along the bottom. Strips of
 * 1 to 6 columns each end at their own length, some hanging down to the
 * hem as tatters, some torn back nearly to the top; the torn edge darker.
 * Tiles across, so the bays' fringes meet without a seam.
 */
function hem(name, c) {
  const r = rng(seedFrom(name) + 11);
  const len = new Float32Array(S);
  let x = 0;
  while (x < S) {
    const w = Math.min(S - x, r.int(1, 6));
    const d = r.chance(0.25) ? r.range(HEM - 2, HEM) : r.range(WHOLE + 1, HEM - 3);
    for (let k = 0; k < w; k++) len[x + k] = d;
    x += w;
  }
  // Fray: a texel or two either way, then a few holes just above the tears.
  const cut = Array.from(len, (d) => Math.min(HEM, Math.max(WHOLE, Math.round(d + r.range(-1.5, 1.5)))));
  const holes = Array.from({ length: 3 }, () => [r.int(0, S - 1), r.int(WHOLE, WHOLE + 4)]);
  const gone = (x, y) => {
    const xx = (x + S) % S;
    return y >= cut[xx] || holes.some(([hx, hy]) => Math.abs(hx - xx) + Math.abs(hy - y) * 1.5 < 1.6);
  };
  const out = new PixelCanvas(S, HEM);
  for (let y = 0; y < HEM; y++) {
    for (let x = 0; x < S; x++) {
      if (gone(x, y)) continue;
      const frayed = gone(x - 1, y) || gone(x + 1, y) || gone(x, y + 1);
      // Grubbier toward the bottom, where hands and dust get at it.
      const col = darken(c.get(x, y), (y / HEM) * 0.15);
      out.set(x, y, frayed ? darken(col, 0.3) : col);
    }
  }
  return out;
}

const CLOTHS = {
  // Faded rust, bleached toward sand, a pale scrap sewn on.
  red: { ramp: 'rust', tone: 0.42, fade: ['sand', 0.55], fadeAmount: 0.35, scraps: [['beige', 0.6]] },
  // Teal, the splash of colour, bleached grey in blotches, a rust scrap.
  teal: { ramp: 'teal', tone: 0.5, fade: ['concrete', 0.55], fadeAmount: 0.4, scraps: [['rust', 0.4]] },
  // Plain canvas the colour of the sand, patched with whatever was to hand.
  sand: { ramp: 'sand', tone: 0.66, fade: ['beige', 0.7], fadeAmount: 0.2, scraps: [['rust', 0.42], ['olive', 0.55], ['sand', 0.52]] },
  // Olive drab, army surplus, patched.
  olive: { ramp: 'olive', tone: 0.58, fade: ['concrete', 0.6], fadeAmount: 0.25, scraps: [['sand', 0.62], ['olive', 0.45]] },
  // Dark umber, for contrast against the pale walls, a teal scrap.
  umber: { ramp: 'rust', tone: 0.24, fade: ['sand', 0.3], fadeAmount: 0.3, scraps: [['teal', 0.4], ['rust', 0.32]] },
};

export const AWNING_CLOTHS = Object.keys(CLOTHS);

export default Object.entries(CLOTHS).flatMap(([name, spec]) => {
  const id = `awning-${name}`;
  return [
    { name: id, out: T(id), draw: () => canvas(id, spec) },
    { name: `${id}-x`, out: T(`${id}-x`), draw: () => turned(canvas(id, spec)) },
    // The hem plain, without the blotches and scraps: every bay repeats it,
    // and a blotch repeated along the front reads as a pattern.
    { name: `${id}-hem`, out: T(`${id}-hem`), draw: () => hem(id, canvas(id, { ...spec, fade: null, scraps: [] })) },
  ];
});
