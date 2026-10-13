import { LIGHT_LEVELS, TRANSPARENT } from '../config.js';
import { clamp, lerp } from '../core/math.js';

// Palette variants used for full-screen flashes, Doom PLAYPAL style.
export const PAL_NORMAL = 0;
export const PAL_RED_START = 1; // 1..8: taking damage / berserk
export const NUM_RED = 8;
export const PAL_BONUS_START = 9; // 9..12: picking stuff up
export const NUM_BONUS = 4;
export const PAL_HAZARD = 13; // hazard suit
export const PAL_NIGHTVISION = 14; // night-vision goggles
export const NUM_PALETTES = 15;

/** Extra colormap (after the light levels) used by invulnerability: inverted grayscale. */
export const COLORMAP_INVERSE = LIGHT_LEVELS;
/**
 * Haze (see `hazeColormaps`): steps 1 to HAZE_STEPS - 1 of fading toward a
 * colour, each a set of LIGHT_LEVELS colormaps, from row HAZE_ROW on.
 */
export const HAZE_STEPS = 16;
export const HAZE_ROW = LIGHT_LEVELS + 1;

const BONUS_COLOR = [215, 186, 69];

function colorDist(r1, g1, b1, r2, g2, b2) {
  const rm = (r1 + r2) * 0.5;
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return (2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db;
}

/**
 * A 256-colour palette plus everything derived from it: Doom-style light
 * colormaps, flash palettes (as RGBA words ready for the screen) and remap
 * tables for tinting fonts.
 *
 * Index 255 is always transparent. Indices >= `fullbrightStart` are
 * "fullbright": they ignore lighting, so glowing eyes, LEDs and fire shine in
 * the dark.
 */
export class Palette {
  /**
   * @param {{colors: number[][], fullbrightStart?: number, ramps?: Record<string, [number, number]>}} def
   */
  constructor(def) {
    if (!def || !Array.isArray(def.colors) || def.colors.length !== 256) {
      throw new Error('A palette needs exactly 256 colors');
    }
    this.def = def;
    this.rgb = new Uint8Array(256 * 3);
    def.colors.forEach(([r, g, b], i) => {
      this.rgb[i * 3] = r;
      this.rgb[i * 3 + 1] = g;
      this.rgb[i * 3 + 2] = b;
    });
    this.fullbrightStart = def.fullbrightStart ?? TRANSPARENT;
    this.ramps = def.ramps ?? {};

    this._exact = new Map();
    for (let i = 0; i < TRANSPARENT; i++) {
      const key = (this.rgb[i * 3] << 16) | (this.rgb[i * 3 + 1] << 8) | this.rgb[i * 3 + 2];
      if (!this._exact.has(key)) this._exact.set(key, i);
    }
    this._cubeAll = new Int16Array(32768).fill(-1);
    this._cubeLit = new Int16Array(32768).fill(-1);
    this._tints = new Map();

    this.colormaps = this._buildColormaps();
    this.palettes = this._buildPalettes();
  }

  /** Exhaustive nearest-colour search. `litOnly` skips fullbright entries. */
  nearest(r, g, b, litOnly = false) {
    const max = litOnly ? this.fullbrightStart : TRANSPARENT;
    const rgb = this.rgb;
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i < max; i++) {
      const d = colorDist(r, g, b, rgb[i * 3], rgb[i * 3 + 1], rgb[i * 3 + 2]);
      if (d < bestD) {
        bestD = d;
        best = i;
        if (d === 0) break;
      }
    }
    return best;
  }

  /**
   * Fast lookup for quantizing images: exact palette colours map exactly,
   * anything else goes through a cached 15-bit colour cube.
   */
  lookup(r, g, b, litOnly = false) {
    const exact = this._exact.get((r << 16) | (g << 8) | b);
    if (exact !== undefined && (!litOnly || exact < this.fullbrightStart)) return exact;
    const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
    const cube = litOnly ? this._cubeLit : this._cubeAll;
    let idx = cube[key];
    if (idx < 0) {
      idx = this.nearest(((r >> 3) << 3) + 4, ((g >> 3) << 3) + 4, ((b >> 3) << 3) + 4, litOnly);
      cube[key] = idx;
    }
    return idx;
  }

  /** Index of the colour at relative position t (0 = darkest, 1 = brightest) in a named ramp. */
  ramp(name, t = 0.5) {
    const r = this.ramps[name];
    if (!r) return 0;
    const [start, count] = r;
    return start + Math.round(clamp(t, 0, 1) * (count - 1));
  }

  /** Colormap row for a light level, as a 256-entry remap table. */
  colormap(level) {
    const l = clamp(level | 0, 0, LIGHT_LEVELS);
    return this.colormaps.subarray(l * 256, l * 256 + 256);
  }

  /**
   * Remap table that recolours one ramp onto another by relative brightness.
   * Fonts are drawn in the `from` ramp and tinted at draw time.
   */
  tint(from, to) {
    const key = `${from}>${to}`;
    let remap = this._tints.get(key);
    if (remap) return remap;
    remap = new Uint8Array(256);
    for (let i = 0; i < 256; i++) remap[i] = i;
    const src = this.ramps[from];
    const dst = this.ramps[to];
    if (src && dst) {
      const [fs, fc] = src;
      const [ts, tc] = dst;
      for (let k = 0; k < fc; k++) {
        remap[fs + k] = ts + Math.round((k * (tc - 1)) / Math.max(1, fc - 1));
      }
    }
    this._tints.set(key, remap);
    return remap;
  }

  /**
   * The colormaps followed by haze tables for `color` ([r, g, b]): for haze
   * step k (1 to HAZE_STEPS - 1) and light level l, row HAZE_ROW + (k - 1) *
   * LIGHT_LEVELS + l maps each colour lit at level l (fullbright colours
   * unlit) k / (HAZE_STEPS - 1) of the way to the haze colour. The last one
   * built is kept.
   */
  hazeColormaps(color) {
    const key = color.join(',');
    if (this._haze?.key === key) return this._haze.maps;
    const steps = HAZE_STEPS - 1;
    const maps = new Uint8Array((HAZE_ROW + steps * LIGHT_LEVELS) * 256);
    maps.set(this.colormaps);
    const rgb = this.rgb;
    const [hr, hg, hb] = color;
    // (Blends converge on the haze colour, so many repeat.)
    const cache = new Map();
    const nearest = (r, g, b) => {
      const key = (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b);
      let c = cache.get(key);
      if (c === undefined) {
        c = this.nearest(r, g, b, true);
        cache.set(key, c);
      }
      return c;
    };
    for (let k = 1; k <= steps; k++) {
      const a = k / steps;
      for (let level = 0; level < LIGHT_LEVELS; level++) {
        const f = Math.pow(1 - level / LIGHT_LEVELS, 1.2);
        const row = (HAZE_ROW + (k - 1) * LIGHT_LEVELS + level) * 256;
        for (let i = 0; i < 256; i++) {
          if (i === TRANSPARENT) {
            maps[row + i] = i;
            continue;
          }
          const g = i >= this.fullbrightStart ? 1 : f;
          maps[row + i] = nearest(lerp(rgb[i * 3] * g, hr, a), lerp(rgb[i * 3 + 1] * g, hg, a), lerp(rgb[i * 3 + 2] * g, hb, a));
        }
      }
    }
    this._haze = { key, maps };
    return maps;
  }

  _buildColormaps() {
    const maps = new Uint8Array((LIGHT_LEVELS + 1) * 256);
    const rgb = this.rgb;
    for (let level = 0; level < LIGHT_LEVELS; level++) {
      const f = Math.pow(1 - level / LIGHT_LEVELS, 1.2);
      for (let i = 0; i < 256; i++) {
        const o = level * 256 + i;
        if (level === 0 || i >= this.fullbrightStart) {
          maps[o] = i;
          continue;
        }
        maps[o] = this.nearest(rgb[i * 3] * f, rgb[i * 3 + 1] * f, rgb[i * 3 + 2] * f, true);
      }
    }
    // Inverted grayscale for invulnerability.
    for (let i = 0; i < 256; i++) {
      const lum = rgb[i * 3] * 0.3 + rgb[i * 3 + 1] * 0.59 + rgb[i * 3 + 2] * 0.11;
      const v = 255 - lum;
      maps[COLORMAP_INVERSE * 256 + i] = i === TRANSPARENT ? i : this.nearest(v, v, v, true);
    }
    return maps;
  }

  _buildPalettes() {
    const rgb = this.rgb;
    const make = (fn) => {
      const p = new Uint32Array(256);
      for (let i = 0; i < 256; i++) {
        const [r, g, b] = fn(rgb[i * 3], rgb[i * 3 + 1], rgb[i * 3 + 2]);
        p[i] = (255 << 24) | (clamp(b | 0, 0, 255) << 16) | (clamp(g | 0, 0, 255) << 8) | clamp(r | 0, 0, 255);
      }
      return p;
    };
    const toward = (target, t) => (r, g, b) => [lerp(r, target[0], t), lerp(g, target[1], t), lerp(b, target[2], t)];

    const out = new Array(NUM_PALETTES);
    out[PAL_NORMAL] = make((r, g, b) => [r, g, b]);
    for (let k = 0; k < NUM_RED; k++) out[PAL_RED_START + k] = make(toward([255, 0, 0], (k + 1) / 9));
    for (let k = 0; k < NUM_BONUS; k++) out[PAL_BONUS_START + k] = make(toward(BONUS_COLOR, (k + 1) * 0.125));
    out[PAL_HAZARD] = make(toward([0, 255, 0], 0.125));
    out[PAL_NIGHTVISION] = make((r, g, b) => {
      const v = r * 0.3 + g * 0.59 + b * 0.11;
      return [v * 0.35, v * 1.2 + 24, v * 0.4];
    });
    return out;
  }
}
