// Full-screen pictures: the title screen and the intermission backdrop (also
// used behind the finale text). Painted procedurally, then dithered into the
// palette. They are 560x200 (21:9): the centre 320 columns are the 4:3
// picture, and the sides only show on widescreen, so keep text and anything
// important inside the centre.
import { PixelCanvas, mix, darken, lighten } from '../lib/canvas.js';
import { C, G } from '../lib/pal.js';
import { fbm, hash2, rng, seedFrom, valueNoise } from '../lib/noise.js';
import { smallGlyphs } from './fonts.js';

const W = 560;
const H = 200;
/** Left edge of the centre 320 columns. */
const OX = (W - 320) / 2;
const U = (name) => `assets/ui/${name}.png`;

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const norm3 = (x, y, z) => {
  const l = Math.hypot(x, y, z) || 1;
  return [x / l, y / l, z / l];
};

/** Colour at t along [[t, rgb], ...] stops. */
function ramp(stops, t) {
  if (t <= stops[0][0]) return stops[0][1];
  for (let i = 1; i < stops.length; i++) {
    const [t1, c1] = stops[i];
    if (t <= t1) {
      const [t0, c0] = stops[i - 1];
      return mix(c0, c1, (t - t0) / (t1 - t0 || 1));
    }
  }
  return stops[stops.length - 1][1];
}

/** Blend a colour into an existing pixel. */
function blend(c, x, y, col, a) {
  const p = c.get(x, y);
  if (!p || a <= 0) return;
  c.set(x, y, mix(p, col, clamp(a, 0, 1)));
}

/** Soft radial glow added over what is already painted. */
function glow(c, cx, cy, r, col, strength = 0.5) {
  for (let y = Math.floor(cy - r); y <= cy + r; y++) {
    for (let x = Math.floor(cx - r); x <= cx + r; x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy) / r;
      if (d < 1) blend(c, x, y, col, (1 - d) * (1 - d) * strength);
    }
  }
}

/** Text in the game's small 5x7 font. */
function smallText(c, text, x, y, col, { shadow, align = 'left' } = {}) {
  const glyphs = smallGlyphs();
  const width = text.length * 6 - 1;
  const x0 = align === 'center' ? Math.round(x - width / 2) : x;
  [...text].forEach((ch, i) => {
    const rows = glyphs.get(ch);
    if (!rows) return;
    rows.forEach((row, gy) => {
      for (let gx = 0; gx < 5; gx++) {
        if (row[gx] !== '#') continue;
        if (shadow) c.set(x0 + i * 6 + gx + 1, y + gy + 1, shadow);
        c.set(x0 + i * 6 + gx, y + gy, typeof col === 'function' ? col(gy / 6) : col);
      }
    });
  });
}

// ---------------------------------------------------------------------------
// Chrome logo: font glyphs scaled up, smoothed, bevelled with a distance field
// and shaded with an 80s sky-over-sunset reflection, then dirtied up.

function textMask(text, scale) {
  const glyphs = smallGlyphs();
  const adv = 6 * scale;
  const w = text.length * adv - scale;
  const h = 7 * scale;
  const m = new Float32Array(w * h);
  [...text].forEach((ch, i) => {
    const rows = glyphs.get(ch);
    rows?.forEach((row, gy) => {
      for (let gx = 0; gx < 5; gx++) {
        if (row[gx] !== '#') continue;
        for (let sy = 0; sy < scale; sy++) for (let sx = 0; sx < scale; sx++) m[(gy * scale + sy) * w + i * adv + gx * scale + sx] = 1;
      }
    });
  });
  return { w, h, m };
}

function boxBlur(src, w, h, r) {
  const tmp = new Float32Array(w * h);
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let s = 0;
      for (let k = -r; k <= r; k++) s += src[y * w + clamp(x + k, 0, w - 1)];
      tmp[y * w + x] = s / (2 * r + 1);
    }
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let s = 0;
      for (let k = -r; k <= r; k++) s += tmp[clamp(y + k, 0, h - 1) * w + x];
      out[y * w + x] = s / (2 * r + 1);
    }
  }
  return out;
}

function dilate(src, w, h, r) {
  const out = new Float32Array(w * h);
  const R = Math.ceil(r);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let v = 0;
      for (let dy = -R; dy <= R && v < 1; dy++) {
        for (let dx = -R; dx <= R; dx++) {
          if (dx * dx + dy * dy > r * r) continue;
          const xx = x + dx;
          const yy = y + dy;
          if (xx >= 0 && yy >= 0 && xx < w && yy < h && src[yy * w + xx] > v) v = src[yy * w + xx];
        }
      }
      out[y * w + x] = v;
    }
  }
  return out;
}

/** Chamfer distance from each inside pixel to the outside. */
function insideDistance(mask, w, h) {
  const d = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) d[i] = mask[i] ? 1e9 : 0;
  const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : d[y * w + x]);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (d[i]) d[i] = Math.min(d[i], at(x - 1, y) + 1, at(x, y - 1) + 1, at(x - 1, y - 1) + 1.414, at(x + 1, y - 1) + 1.414);
    }
  }
  for (let y = h - 1; y >= 0; y--) {
    for (let x = w - 1; x >= 0; x--) {
      const i = y * w + x;
      if (d[i]) d[i] = Math.min(d[i], at(x + 1, y) + 1, at(x, y + 1) + 1, at(x + 1, y + 1) + 1.414, at(x - 1, y + 1) + 1.414);
    }
  }
  return d;
}

const CHROME = [
  [0, [236, 240, 252]],
  [0.25, [168, 186, 220]],
  [0.48, [76, 88, 124]],
  [0.5, [30, 16, 12]],
  [0.6, [104, 34, 10]],
  [0.82, [206, 96, 24]],
  [1, [255, 200, 110]],
];

/** Brushed Imperial steel: cold highlights over a dark band. */
const STEEL = [
  [0, [250, 252, 255]],
  [0.25, [190, 200, 220]],
  [0.48, [96, 108, 136]],
  [0.5, [24, 26, 34]],
  [0.7, [90, 100, 124]],
  [1, [210, 218, 236]],
];

export function chromeLogo(text, scale, { bevel = 3.4, extrude = 5, seed = 7, stops = CHROME, bold = 1.2, side = [C('blood', 0.1), C('blood', 0.42)], grime = true } = {}) {
  const pad = extrude + 3;
  const t = textMask(text, scale);
  const w = t.w + pad * 2;
  const h = t.h + pad * 2;
  let f = new Float32Array(w * h);
  for (let y = 0; y < t.h; y++) for (let x = 0; x < t.w; x++) f[(y + pad) * w + x + pad] = t.m[y * t.w + x];
  // Embolden (joins the diagonal staircases), then round the corners off.
  f = dilate(f, w, h, bold);
  f = boxBlur(boxBlur(f, w, h, 1), w, h, 1);
  const mask = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) mask[i] = f[i] > 0.5 ? 1 : 0;
  const dist = insideDistance(mask, w, h);
  const hgt = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : Math.min(1, dist[y * w + x] / bevel));
  const c = new PixelCanvas(w, h);
  // Extruded sides, falling away down and to the right.
  for (let e = extrude; e >= 1; e--) {
    const k = 1 - e / extrude;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (mask[y * w + x]) c.set(x + e, y + e, mix(side[0], side[1], k));
  }
  const noise = valueNoise(seed, 4096, 4096);
  const rr = rng(seed);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!mask[y * w + x]) continue;
      const gx = hgt(x + 1, y) - hgt(x - 1, y);
      const gy = hgt(x, y + 1) - hgt(x, y - 1);
      const [nx, ny] = norm3(-gx * 1.7, -gy * 1.7, 1);
      const ty = (y - pad) / t.h;
      // Reflection: flat faces show the horizon, bevels tilt it.
      let col = ramp(stops, clamp(ty * 0.9 + 0.05 + ny * 0.6 + nx * 0.12, 0, 1));
      const lit = clamp(1 + (-nx * 0.35 - ny * 0.45), 0.55, 1.25);
      col = col.map((v) => Math.min(255, v * lit));
      // Grime and rust creeping up from the bottom.
      const g = noise(x * 0.3, y * 0.3);
      if (grime) col = mix(col, C('rust', 0.22), clamp((g - 0.45) * 2.2, 0, 0.75) * (0.25 + ty * 0.75));
      if (hash2(x, y, seed) > 0.97) col = darken(col, 0.35);
      c.set(x, y, col);
    }
  }
  // Scratches across the faces.
  for (let i = 0; i < text.length * 4; i++) {
    const x0 = rr.range(pad, w - pad);
    const y0 = rr.range(pad, h - pad);
    const len = rr.range(3, scale * 3);
    const a = rr.range(-0.5, 0.5) + (rr.chance(0.5) ? 0 : Math.PI / 2);
    for (let k = 0; k < len; k++) {
      const x = Math.round(x0 + Math.cos(a) * k);
      const y = Math.round(y0 + Math.sin(a) * k);
      if (mask[y * w + x]) c.set(x, y, mix(c.get(x, y), k % 3 ? [250, 250, 255] : [20, 12, 10], 0.45));
    }
  }
  c.outline([6, 2, 2]);
  // Star glints on a few top-left corners.
  const corners = [];
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      if (mask[y * w + x] && !mask[(y - 1) * w + x] && !mask[y * w + x - 1] && hash2(x, y, seed + 3) > 0.9) corners.push([x, y]);
    }
  }
  for (const [x, y] of corners.slice(0, 4)) glint(c, x + 1, y + 1, 3);
  return c;
}

function glint(c, x, y, len) {
  c.set(x, y, [255, 255, 255]);
  for (let k = 1; k <= len; k++) {
    const col = k === 1 ? G('pale', 1) : G('yellow', 0.8);
    for (const [dx, dy] of [[k, 0], [-k, 0], [0, k], [0, -k]]) if (c.opaque(x + dx, y + dy) || k === 1) c.set(x + dx, y + dy, col);
  }
}

// ---------------------------------------------------------------------------
// Scenery pieces.

/** Deep space: a navy-to-purple gradient, faint nebula haze and stars. */
function space(c, seed, horizon = H) {
  const haze = fbm(seed, 128, { cells: 5, octaves: 4 });
  c.each((x, y) => {
    const t = clamp(y / horizon, 0, 1);
    const base = mix(C('navy', 0.04), C('purple', 0.2), t * t);
    const n = haze(x % 128, y % 128);
    return n > 0.58 ? mix(base, C('purple', 0.45), (n - 0.58) * 1.2) : base;
  });
  for (let k = 0; k < 520; k++) {
    const x = Math.floor(hash2(k, 1, seed) * W);
    const y = Math.floor(hash2(k, 2, seed) * horizon);
    const b = hash2(k, 3, seed);
    c.set(x, y, b > 0.97 ? [255, 255, 255] : b > 0.85 ? G('tube', 1) : C('gray', 0.35 + b * 0.4));
  }
}

/** A shaded planet lit from the upper left, with an atmosphere rim. */
function planet(c, cx, cy, r, dark, light) {
  for (let y = Math.floor(cy - r - 2); y <= cy + r + 2; y++) {
    for (let x = Math.floor(cx - r - 2); x <= cx + r + 2; x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy) / r;
      if (d > 1.04) continue;
      if (d > 1) {
        blend(c, x, y, G('cyan', 0.4), 0.5);
        continue;
      }
      const lx = (x - cx) / r;
      const ly = (y - cy) / r;
      const lz = Math.sqrt(Math.max(0, 1 - lx * lx - ly * ly));
      const lit = clamp(-lx * 0.55 - ly * 0.45 + lz * 0.45, 0, 1);
      const bands = Math.sin(ly * 9 + Math.sin(lx * 4) * 0.6) * 0.06;
      c.set(x, y, mix(dark, light, clamp(lit + bands, 0, 1)));
    }
  }
}

/** Canyon mesas along the bottom, dark against the sky. */
function mesas(c, seed, { base = H, top = 150, col = C('rust', 0.1) } = {}) {
  const ridge = fbm(seed, W, { cells: 9, octaves: 3, sizeY: 1, cellsY: 1 });
  for (let x = 0; x < W; x++) {
    const y0 = Math.round(top + Math.round(ridge(x, 0) * 4) * 8);
    for (let y = y0; y < base; y++) c.set(x, y, mix(col, C('gray', 0.02), (y - y0) / 60));
  }
}

/** A blocky Imperial garrison on the mesa: towers, comm dishes, red lights. */
function garrison(c, x0, base) {
  const wall = C('gray', 0.16);
  const blocks = [[0, 40, 26], [36, 70, 44], [70, 96, 30], [24, 40, 18], [96, 120, 20]];
  for (const [a, b, h] of blocks) c.rect(x0 + a, base - h, b - a, h, wall);
  c.rect(x0 + 50, base - 64, 8, 20, wall);
  c.rect(x0 + 44, base - 68, 20, 5, wall);
  for (const [a, b, h] of blocks) {
    for (let x = x0 + a + 3; x < x0 + b - 2; x += 6) c.set(x, base - h + 4, G('amber', 1));
  }
  for (const [x, y] of [[x0 + 54, base - 69], [x0 + 2, base - 27], [x0 + 118, base - 21]]) {
    c.set(x, y, G('red', 1));
    glow(c, x, y, 4, G('red', 1), 0.4);
  }
  // A dish on the tallest block.
  for (let k = -6; k <= 6; k++) c.set(x0 + 80 + k, base - 36 - Math.round((k * k) / 8), C('gray', 0.35));
  c.rect(x0 + 80, base - 36, 1, 6, C('gray', 0.35));
}

function title() {
  const c = new PixelCanvas(W, H);
  const seed = seedFrom('title');
  space(c, seed, 170);
  planet(c, OX + 250, 92, 46, C('navy', 0.1), C('orange', 0.55));
  planet(c, OX + 62, 70, 9, C('gray', 0.1), C('beige', 0.7));
  planet(c, 34, 128, 5, C('gray', 0.08), C('steel', 0.6));
  mesas(c, seed + 1, { top: 156 });
  garrison(c, OX + 170, 172);
  mesas(c, seed + 2, { top: 176, col: C('rust', 0.05) });
  const logo = chromeLogo('ROGUE CONTRACT', 3, { seed: 9, stops: STEEL, side: [C('gray', 0.04), C('steel', 0.3)], grime: false });
  c.blit(logo, Math.round((W - logo.w) / 2), 8);
  smallText(c, 'A MERCENARY. A REBELLION. ONE JOB.', W / 2, 52, (t) => mix(G('red', 1), G('red', 0), t), { align: 'center', shadow: [0, 0, 0] });
  return c;
}

/** The intermission (and finale) backdrop: space, a planet, and a faint tactical grid. */
function intermission() {
  const c = new PixelCanvas(W, H);
  const seed = seedFrom('intermission');
  space(c, seed);
  planet(c, OX + 280, 170, 70, C('navy', 0.06), C('rust', 0.4));
  for (let x = 0; x < W; x += 20) for (let y = 0; y < H; y++) if (y % 2 === 0) blend(c, x, y, G('cyan', 0), 0.25);
  for (let y = 0; y < H; y += 20) for (let x = 0; x < W; x++) if (x % 2 === 0) blend(c, x, y, G('cyan', 0), 0.25);
  return c;
}

export default [
  { name: 'title', out: U('title'), draw: title, dither: 'fs' },
  { name: 'intermission', out: U('intermission'), draw: intermission, dither: 'fs' },
];
