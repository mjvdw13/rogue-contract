// Tatooine's canyon: sandstone walls in three strata (a mid tone, a dark
// red-brown and a pale band) and the floor's sand and gravel. 64x64 and
// seamless. The Dark Forces build swaps in DF's cliff and rock floor,
// recoloured (assets/custom/derive.mjs).
import { texture, speckle, C, mix, fbm } from '../lib/tex.js';

const T = (name) => `assets/textures/${name}.png`;

/** Layered sandstone, blocky and cracked, in a tone between `dark` and `light`. */
function sandstone(name, dark, light) {
  return () => {
    const { c, seed, r } = texture(name);
    const n = fbm(seed, 64, { cells: 4, octaves: 4 });
    const bands = fbm(seed + 3, 64, { cells: 2, octaves: 2 });
    c.each((x, y) => {
      const strata = Math.sin((y + bands(x, y) * 12) * 0.5) * 0.5 + 0.5;
      const t = 0.35 + strata * 0.3 + (n(x, y) - 0.5) * 0.45;
      return mix(dark, light, Math.max(0, Math.min(1, t)));
    });
    // Vertical cracks with a lit edge, and darker streaks running down.
    for (let k = 0; k < 6; k++) {
      let x = r.range(0, 64);
      const y0 = r.range(0, 64);
      const len = r.range(8, 30);
      for (let s = 0; s < len; s++) {
        const px = ((Math.floor(x) % 64) + 64) % 64;
        const py = (Math.floor(y0 + s) % 64 + 64) % 64;
        c.set(px, py, mix(dark, [0, 0, 0], 0.45));
        c.set((px + 1) % 64, py, mix(light, [255, 255, 255], 0.1));
        x += r.range(-0.6, 0.6);
      }
    }
    speckle(c, seed, 0.08, 0.18);
    return c;
  };
}

/** Wind-smoothed sand (`coarse`: darker gravel, pebbles and grit). */
function ground(name, base, coarse) {
  return () => {
    const { c, seed, r } = texture(name);
    const n = fbm(seed, 64, { cells: 4, octaves: 4 });
    c.each((x, y) => {
      const ripple = Math.sin((y + n(x, y) * 10) * 0.7) * 0.5 + 0.5;
      return base.map((v) => v * (0.84 + ripple * (coarse ? 0.04 : 0.1) + (n(x, y) - 0.5) * (coarse ? 0.4 : 0.18)));
    });
    for (let k = 0; k < (coarse ? 90 : 18); k++) {
      const x = Math.floor(r.range(0, 63));
      const y = Math.floor(r.range(0, 63));
      const shade = r.range(0.5, 1.1);
      c.rect(x, y, coarse ? 2 : 1, 1, base.map((v) => v * shade));
      c.set(x, y + 1, base.map((v) => v * 0.5));
    }
    speckle(c, seed, coarse ? 0.16 : 0.08, coarse ? 0.3 : 0.12);
    return c;
  };
}

export default [
  { name: 'sandstone', out: T('sandstone'), draw: sandstone('sandstone', C('sand', 0.15), C('sand', 0.8)) },
  { name: 'sandstone-dark', out: T('sandstone-dark'), draw: sandstone('sandstone-dark', C('rust', 0.1), C('rust', 0.62)) },
  { name: 'sandstone-pale', out: T('sandstone-pale'), draw: sandstone('sandstone-pale', C('sand', 0.3), C('sand', 0.95)) },
  { name: 'desert-sand', out: T('desert-sand'), draw: ground('desert-sand', C('sand', 0.62), false) },
  { name: 'desert-gravel', out: T('desert-gravel'), draw: ground('desert-gravel', C('sand', 0.4), true) },
];
