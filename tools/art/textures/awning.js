// Awning canvas for Mos Eisley (lib/town.js, awning()): faded stripes and
// plain canvas, mottled by the suns, stained and patched. 64 x 64 is 2 x 2
// tiles (32 texels a tile), and every one tiles both ways. Each comes three
// ways:
//   awning-<name>      stripes running down the texture (v): the awning
//                      models' tops, and the slab's underside on an awning
//                      looking north or south (flats are world-aligned)
//   awning-<name>-x    the same turned a quarter, for one looking east or west
//   awning-<name>-hem  64 x 16, the front edge: scallops cut along its
//                      bottom (transparent), for the fixed fringe and a
//                      swaying valance (a hanging's hem is the bottom row)
import { PixelCanvas, C, darken, fbm, hash2, rng, seedFrom } from '../lib/tex.js';

const T = (name) => `assets/textures/${name}.png`;
const S = 64;
/** The fringe's height, and how wide each scallop is (texels). */
const HEM = 16;
const SCALLOP = 16;

/**
 * The canvas: `stripes` ([ramp, tone] pairs taking turns, `width` texels
 * each) or `plain` ([ramp, tone]); `patches` squares of darker cloth
 * stitched on.
 */
function canvas(name, { stripes, plain, width = 8, patches = 0 }) {
  const r = rng(seedFrom(name));
  const mottle = fbm(seedFrom(name) + 1, S, { cells: 4 });
  // Dirt run down the cloth from where rain pools: along the stripes.
  const streak = fbm(seedFrom(name) + 2, S, { cells: 8, cellsY: 1, octaves: 2 });
  const stains = fbm(seedFrom(name) + 3, S, { cells: 3, octaves: 3 });
  const squares = Array.from({ length: patches }, () => ({ x: r.int(0, S), y: r.int(0, S), w: r.int(8, 15), h: r.int(8, 15) }));
  const inPatch = (x, y) => squares.find((p) => ((x - p.x + S) % S) < p.w && ((y - p.y + S) % S) < p.h);
  const c = new PixelCanvas(S, S);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const [ramp, tone] = stripes ? stripes[Math.floor(x / width) % stripes.length] : plain;
      // The weave, a shade apart; the suns' fading; dirt and stains.
      const weave = ((x + (y >> 1)) & 1 ? 0.012 : -0.012) + (y & 1 ? 0.008 : -0.008);
      let t = tone + weave + (mottle(x, y) - 0.5) * 0.16 + (streak(x, y) - 0.5) * 0.12;
      if (stains(x, y) > 0.68) t -= Math.min(0.1, (stains(x, y) - 0.68) * 0.6);
      const p = inPatch(x, y);
      if (p) {
        t -= 0.1;
        // Its stitched edge: every other texel darker.
        const ex = (x - p.x + S) % S;
        const ey = (y - p.y + S) % S;
        if ((ex === 0 || ex === p.w - 1 || ey === 0 || ey === p.h - 1) && (x + y) & 1) t -= 0.14;
      }
      let col = C(ramp, Math.min(1, Math.max(0, t)));
      if (hash2(x, y, seedFrom(name) + 9) < 0.03) col = darken(col, 0.12);
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

/** The front edge: the canvas's top rows with scallops cut out of the bottom, the cut edge darker. */
function hem(c) {
  const out = new PixelCanvas(S, HEM);
  const depth = (x) => {
    const u = ((x + 0.5) % SCALLOP) / SCALLOP - 0.5;
    // A round scallop, its lowest point in the middle, 6 texels higher where two meet.
    return HEM - 6 * (1 - Math.sqrt(Math.max(0, 1 - 4 * u * u)));
  };
  for (let y = 0; y < HEM; y++) {
    for (let x = 0; x < S; x++) {
      const bottom = depth(x);
      if (y >= bottom) continue;
      out.set(x, y, y >= bottom - 1.5 || y < 1 ? darken(c.get(x, y), 0.3) : c.get(x, y));
    }
  }
  return out;
}

const CLOTHS = {
  // Rust red and pale canvas, the commonest.
  red: { stripes: [['rust', 0.5], ['beige', 0.72]], patches: 1 },
  // Teal and pale.
  teal: { stripes: [['teal', 0.62], ['beige', 0.7]], patches: 1 },
  // Plain canvas the colour of the sand, patched.
  sand: { plain: ['sand', 0.68], patches: 3 },
  // Olive drab, army surplus, patched.
  olive: { plain: ['olive', 0.62], patches: 2 },
};

export const AWNING_CLOTHS = Object.keys(CLOTHS);

export default Object.entries(CLOTHS).flatMap(([name, spec]) => {
  const id = `awning-${name}`;
  return [
    { name: id, out: T(id), draw: () => canvas(id, spec) },
    { name: `${id}-x`, out: T(`${id}-x`), draw: () => turned(canvas(id, spec)) },
    { name: `${id}-hem`, out: T(`${id}-hem`), draw: () => hem(canvas(id, spec)) },
  ];
});
