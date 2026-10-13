#!/usr/bin/env node
// Measures how well the palette fits the art, and fits its free colours.
//
//   node tools/fit-palette.mjs            score the palette (src/content/palette.js)
//   node tools/fit-palette.mjs --fit 40   also fit 40 free colours, printed for palette.js's FITTED list
//
// The score is what the game shows: each art colour is snapped to the palette
// (as images are when they load), then darkened through the light colormaps at
// the light levels a level mostly shows, and compared with the true colour
// darkened by the same amount. Errors are average RGB distances. The art is
// the Dark Forces textures and sprites (what the hosted game shows), the
// committed sprite sheets, and the generated textures with less weight.
//
// Fitting keeps the hand-made ramps (generated art and models pick colours
// from them by name) and places the free colours where the lit art is worst
// covered: k-means over the darkened art colours, moving only the free ones.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodePNG } from './art/lib/png.js';
import { Palette } from '../src/engine/gfx/palette.js';
import palette, { RAMPS, buildPalette, rampColors } from '../src/content/palette.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Art to fit, with a weight per group (each file counts equally inside its group). */
export const ART = [
  { name: 'DF textures', weight: 1, files: ['assets/custom/textures'], skip: ['sky-night.png'] },
  { name: 'DF sky', weight: 0.2, files: ['assets/custom/textures/sky-night.png'], unlit: true },
  {
    name: 'sprites',
    weight: 0.6,
    files: ['assets/custom/stormtrooper.png', 'assets/custom/officer.png', 'assets/custom/probe-droid.png', 'assets/custom/blaster.png', 'assets/custom/fists.png', 'assets/sprites/monsters'],
  },
  { name: 'generated', weight: 0.1, files: ['assets/textures', 'assets/sprites/decor', 'assets/sprites/items', 'assets/sprites/fx'], skip: ['sky-night.png'] },
];

/** Colormap levels sampled (0 = full bright .. 31 = black) and their weights. */
const LEVELS = [[0, 1], [4, 1], [8, 1.2], [12, 1.2], [16, 1.2], [20, 1], [24, 0.8]];
const factor = (level) => Math.pow(1 - level / 32, 1.2);

function listFiles(p, skip = []) {
  const f = path.join(root, p);
  if (!fs.existsSync(f)) return [];
  if (fs.statSync(f).isDirectory()) {
    return fs.readdirSync(f).filter((n) => n.endsWith('.png') && !skip.includes(n)).map((n) => path.join(f, n));
  }
  return [f];
}

/** A weighted colour histogram (5 bits a channel, keeping each bin's mean colour). */
class Histogram {
  constructor() {
    this.sum = new Float64Array(32768 * 4);
  }

  add(r, g, b, w) {
    const k = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
    const s = this.sum;
    s[k * 4] += r * w;
    s[k * 4 + 1] += g * w;
    s[k * 4 + 2] += b * w;
    s[k * 4 + 3] += w;
  }

  /** [[r, g, b, w], ...] for the bins in use. */
  points() {
    const out = [];
    const s = this.sum;
    for (let k = 0; k < 32768; k++) {
      const w = s[k * 4 + 3];
      if (w > 0) out.push([s[k * 4] / w, s[k * 4 + 1] / w, s[k * 4 + 2] / w, w]);
    }
    return out;
  }
}

/** Histograms of the art per group: `full` (as drawn at full light) and `lit` (darkened at the sampled levels). */
export function loadArt() {
  const groups = [];
  for (const g of ART) {
    const full = new Histogram();
    const files = g.files.flatMap((p) => listFiles(p, g.skip));
    for (const f of files) {
      const { data } = decodePNG(fs.readFileSync(f));
      let n = 0;
      for (let i = 0; i < data.length; i += 4) if (data[i + 3] >= 128) n++;
      const w = n ? g.weight / n : 0;
      for (let i = 0; i < data.length; i += 4) if (data[i + 3] >= 128) full.add(data[i], data[i + 1], data[i + 2], w);
    }
    groups.push({ name: g.name, unlit: !!g.unlit, points: full.points(), files: files.length });
  }
  return groups;
}

/**
 * Average RGB error of what's drawn, per group: snapped at load, then
 * darkened by the colormaps (fullbright and unlit art only at full light).
 */
export function score(def, groups) {
  const pal = new Palette(def);
  const rgb = pal.rgb;
  const cms = pal.colormaps;
  const out = {};
  let all = 0;
  let allW = 0;
  for (const g of groups) {
    let e = 0;
    let wsum = 0;
    for (const [r, gg, b, w] of g.points) {
      const i = pal.lookup(Math.round(r), Math.round(gg), Math.round(b));
      for (const [level, lw] of g.unlit ? [[0, 1]] : LEVELS) {
        const f = factor(level);
        const glow = i >= pal.fullbrightStart;
        if (glow && level > 0) continue;
        const j = cms[level * 256 + i];
        const dr = r * f - rgb[j * 3];
        const dg = gg * f - rgb[j * 3 + 1];
        const db = b * f - rgb[j * 3 + 2];
        e += Math.sqrt(dr * dr + dg * dg + db * db) * w * lw;
        wsum += w * lw;
      }
    }
    out[g.name] = e / wsum;
    all += e;
    allW += wsum;
  }
  out.all = all / allW;
  return out;
}

/** k-means over the darkened art colours, moving only `n` free centres (the ramps stay put). */
export function fitFree(fixed, groups, n, iterations = 40) {
  const pts = [];
  for (const g of groups) {
    for (const [r, gg, b, w] of g.points) {
      for (const [level, lw] of g.unlit ? [[0, LEVELS.reduce((s, l) => s + l[1], 0)]] : LEVELS) pts.push([r * factor(level), gg * factor(level), b * factor(level), w * lw]);
    }
  }
  const d2 = (p, c) => (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2;
  // Start the free centres at the worst-covered points, one at a time.
  const free = [];
  const best = pts.map((p) => Math.min(...fixed.map((c) => d2(p, c))));
  for (let k = 0; k < n; k++) {
    let at = 0;
    let worst = -1;
    pts.forEach((p, i) => {
      const s = best[i] * p[3];
      if (s > worst) {
        worst = s;
        at = i;
      }
    });
    const c = pts[at].slice(0, 3);
    free.push(c);
    pts.forEach((p, i) => (best[i] = Math.min(best[i], d2(p, c))));
  }
  for (let it = 0; it < iterations; it++) {
    const sum = free.map(() => [0, 0, 0, 0]);
    for (const p of pts) {
      let bd = Infinity;
      for (const c of fixed) bd = Math.min(bd, d2(p, c));
      let bj = -1;
      free.forEach((c, j) => {
        const d = d2(p, c);
        if (d < bd) {
          bd = d;
          bj = j;
        }
      });
      if (bj < 0) continue;
      const s = sum[bj];
      s[0] += p[0] * p[3];
      s[1] += p[1] * p[3];
      s[2] += p[2] * p[3];
      s[3] += p[3];
    }
    sum.forEach((s, j) => {
      if (s[3] > 0) free[j] = [s[0] / s[3], s[1] / s[3], s[2] / s[3]];
    });
  }
  const lum = (c) => c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11;
  return free.map((c) => c.map((v) => Math.max(0, Math.min(255, Math.round(v))))).sort((a, b) => lum(a) - lum(b));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const groups = loadArt();
  const show = (label, s) => console.log(`${label.padEnd(10)} ${Object.entries(s).map(([k, v]) => `${k} ${v.toFixed(2)}`).join(', ')}`);
  show('palette', score(palette, groups));
  if (args.includes('--fit')) {
    const n = Number(args[args.indexOf('--fit') + 1]);
    const ramps = RAMPS.reduce((s, r) => s + r[1], 0);
    if (ramps + n !== 223) throw new Error(`The ramps hold ${ramps} colours, so the free colours must number ${223 - ramps}, not ${n}`);
    const free = fitFree([[0, 0, 0], ...rampColors()], groups, n);
    show('fitted', score(buildPalette(free), groups));
    console.log(`\nconst FITTED = [\n${free.map((c) => `  [${c.join(', ')}],`).join('\n')}\n];`);
  }
}
