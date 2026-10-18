// Grime: decals that darken the wall under them (`grime: true` textures).
// A pixel's grey is the share of light it leaves (white all of it), so they
// stay raw greys rather than palette colours: the palette's greys are too
// coarse for faint stains. Transparent where there's none. Every picture
// fades to nothing at its edges, so no outline shows on the wall. 32 texels
// are a tile (half a metre).
import { PixelCanvas, fbm, rng, seedFrom } from '../lib/tex.js';

const T = (name) => `assets/textures/${name}.png`;

/** A canvas filled from `amount(x, y)`: how much light each texel takes away (0 to 1). */
function grime(w, h, amount) {
  const c = new PixelCanvas(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const s = Math.max(0, Math.min(0.9, amount(x, y)));
      const v = Math.round(255 * (1 - s));
      c.set(x, y, v < 254 ? [v, v, v] : null);
    }
  }
  return c;
}

/** 0 at the edge, rising to 1 `width` texels in (smoothly). */
function edge(d, width) {
  const t = Math.max(0, Math.min(1, d / width));
  return t * t * (3 - 2 * t);
}

/**
 * Streaks: rain run-off down a wall from a ledge at the top (a roofline, a
 * sill, a sign). A soft band along the top, and `count` thin streaks of
 * their own lengths and strengths, fading as they go down, mottled.
 */
function streaks(name, { w, h, count, band, strength, maxLen = 1 }) {
  return () => {
    const r = rng(seedFrom(name));
    const mottle = fbm(seedFrom(name) + 1, w, { cells: 4, sizeY: h });
    const lines = Array.from({ length: count }, () => ({
      x: r.range(4, w - 4),
      width: r.range(0.6, 2.4),
      len: r.range(0.25, maxLen) * h,
      s: r.range(0.4, 1) * strength,
      wander: r.range(-0.04, 0.04),
    }));
    // The band's ragged lower edge.
    const ragged = fbm(seedFrom(name) + 2, w, { cells: 8, sizeY: 8 });
    return grime(w, h, (x, y) => {
      let s = 0;
      const depth = band * (0.6 + 0.8 * ragged(x, 0));
      if (y < depth) s = strength * 0.7 * (1 - y / depth) ** 1.5;
      for (const l of lines) {
        if (y > l.len) continue;
        const d = Math.abs(x - (l.x + l.wander * y)) / l.width;
        if (d > 1.5) continue;
        const across = d < 0.5 ? 1 : (1.5 - d) ** 2;
        s = Math.max(s, l.s * across * (1 - y / l.len) ** 0.8);
      }
      return s * (0.6 + 0.8 * mottle(x, y)) * edge(Math.min(x, w - 1 - x), 6);
    });
  };
}

/**
 * A soft stain in patches (`strength` at its darkest): the noise's high
 * ground, fading to nothing toward the picture's rim, so its shape is the
 * noise's rather than a round blob's.
 */
function blotch(name, { w, h, strength, cells = 3 }) {
  return () => {
    const n = fbm(seedFrom(name), w, { cells, sizeY: h, octaves: 3 });
    const fine = fbm(seedFrom(name) + 1, w, { cells: cells * 4, sizeY: h });
    return grime(w, h, (x, y) => {
      const dx = (x + 0.5 - w / 2) / (w / 2);
      const dy = (y + 0.5 - h / 2) / (h / 2);
      const patch = Math.max(0, Math.min(1, (n(x, y) - 0.45) / 0.3));
      const rim = Math.max(0, 1 - (dx * dx + dy * dy));
      return strength * patch * patch * rim * (0.4 + 0.9 * fine(x, y));
    });
  };
}

/** A crack in the plaster: a dark line wandering down, with a branch or two and a faint stain round it. */
function crack(name, { w, h }) {
  return () => {
    const r = rng(seedFrom(name));
    const core = new Float32Array(w * h);
    const walk = (x, y, len, s) => {
      let dx = r.range(-0.5, 0.5);
      for (let k = 0; k < len && y < h - 3; k++) {
        dx = Math.max(-0.9, Math.min(0.9, dx + r.range(-0.35, 0.35)));
        x += dx;
        y += 1;
        if (x < 3 || x >= w - 3) break;
        const fade = s * (1 - k / len) ** 0.5;
        const i = Math.floor(y) * w + Math.floor(x);
        core[i] = Math.max(core[i], fade);
        if (r.chance(0.05)) walk(x, y, len * r.range(0.2, 0.45), s * 0.7);
      }
    };
    walk(w / 2, 2, h * 0.9, 0.7);
    return grime(w, h, (x, y) => {
      let s = core[y * w + x];
      // The stain round it: the strongest crack texel nearby, weaker.
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const u = x + dx;
          const v = y + dy;
          if (u < 0 || v < 0 || u >= w || v >= h) continue;
          s = Math.max(s, core[v * w + u] * 0.22 / (1 + Math.hypot(dx, dy)));
        }
      }
      return s;
    });
  };
}

/**
 * Dust splashed up from the street above a wall's foot: darkest along the
 * bottom, its top edge ragged, specks above it.
 */
function dust(name, { w, h, strength }) {
  return () => {
    const r = rng(seedFrom(name));
    const top = fbm(seedFrom(name), w, { cells: 6, sizeY: 4 });
    const n = fbm(seedFrom(name) + 1, w, { cells: 8, sizeY: h });
    const specks = new Set(Array.from({ length: (w * h) / 40 }, () => r.int(0, w * h - 1)));
    return grime(w, h, (x, y) => {
      const up = h - 1 - y;
      const reach = h * (0.3 + 0.6 * top(x, 0));
      let s = up < reach ? strength * (1 - up / reach) ** 1.3 * (0.6 + 0.8 * n(x, y)) : 0;
      if (specks.has(y * w + x) && up < reach * 1.6) s = Math.max(s, strength * 0.5 * (1 - up / (reach * 1.6)));
      return s * edge(Math.min(x, w - 1 - x), 10);
    });
  };
}

export default [
  // Off a roofline, 2 tiles wide and 3 down.
  { name: 'grime-streaks-1', out: T('grime-streaks-1'), raw: true, draw: streaks('grime-streaks-1', { w: 64, h: 96, count: 9, band: 8, strength: 0.6 }) },
  { name: 'grime-streaks-2', out: T('grime-streaks-2'), raw: true, draw: streaks('grime-streaks-2', { w: 64, h: 96, count: 5, band: 5, strength: 0.7, maxLen: 0.7 }) },
  { name: 'grime-streaks-3', out: T('grime-streaks-3'), raw: true, draw: streaks('grime-streaks-3', { w: 96, h: 64, count: 12, band: 10, strength: 0.55, maxLen: 0.8 }) },
  // Under a sill or a sign: a tile wide, 2 down.
  { name: 'grime-drip-1', out: T('grime-drip-1'), raw: true, draw: streaks('grime-drip-1', { w: 32, h: 64, count: 4, band: 4, strength: 0.65 }) },
  { name: 'grime-drip-2', out: T('grime-drip-2'), raw: true, draw: streaks('grime-drip-2', { w: 40, h: 48, count: 6, band: 6, strength: 0.6, maxLen: 0.8 }) },
  // Stains anywhere.
  { name: 'grime-blotch-1', out: T('grime-blotch-1'), raw: true, draw: blotch('grime-blotch-1', { w: 64, h: 48, strength: 0.3 }) },
  { name: 'grime-blotch-2', out: T('grime-blotch-2'), raw: true, draw: blotch('grime-blotch-2', { w: 96, h: 64, strength: 0.25, cells: 4 }) },
  // Hands by a door: grubby, small.
  { name: 'grime-smudge', out: T('grime-smudge'), raw: true, draw: blotch('grime-smudge', { w: 32, h: 40, strength: 0.45, cells: 2 }) },
  { name: 'grime-crack-1', out: T('grime-crack-1'), raw: true, draw: crack('grime-crack-1', { w: 32, h: 64 }) },
  { name: 'grime-crack-2', out: T('grime-crack-2'), raw: true, draw: crack('grime-crack-2', { w: 40, h: 48 }) },
  // Above the skirt, 4 tiles along.
  { name: 'grime-dust-1', out: T('grime-dust-1'), raw: true, draw: dust('grime-dust-1', { w: 128, h: 32, strength: 0.4 }) },
  { name: 'grime-dust-2', out: T('grime-dust-2'), raw: true, draw: dust('grime-dust-2', { w: 128, h: 40, strength: 0.35 }) },
];
