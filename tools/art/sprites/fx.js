// Effects and projectiles: blaster puffs, blood, explosions and blaster
// bolts. Fire is drawn with noisy fullbright gradients.
import { PixelCanvas } from '../lib/canvas.js';
import { C, G } from '../lib/pal.js';
import { sheet } from '../lib/sprite.js';
import { fbm, hash2, rng } from '../lib/noise.js';

const F = (name) => `assets/sprites/fx/${name}.png`;

/** Noisy fire ball. palette: array of colours from hot core to cool rim. */
function fireBlob(c, x, y, r, seed, palette, { density = 1, holes = 0 } = {}) {
  const n = fbm(seed, 64, { cells: 4, octaves: 3 });
  for (let yy = Math.floor(y - r - 2); yy <= Math.ceil(y + r + 2); yy++) {
    for (let xx = Math.floor(x - r - 2); xx <= Math.ceil(x + r + 2); xx++) {
      const d = Math.hypot(xx + 0.5 - x, yy + 0.5 - y) / r;
      const v = n((((xx * 2) % 64) + 64) % 64, (((yy * 2) % 64) + 64) % 64);
      const t = d + (v - 0.5) * 0.7;
      if (t > density) continue;
      if (holes && v < holes && d > 0.3) continue;
      const k = Math.min(palette.length - 1, Math.max(0, Math.floor((t / density) * palette.length)));
      c.set(xx, yy, palette[k]);
    }
  }
}

const FIRE = [[255, 255, 255], G('yellow', 0.85), G('yellow', 0.55), G('yellow', 0.3), G('yellow', 0), G('red', 0.5)];

function smoke(c, x, y, r, seed, t = 0.4) {
  const n = fbm(seed, 64, { cells: 3, octaves: 3 });
  for (let yy = Math.floor(y - r); yy <= Math.ceil(y + r); yy++) {
    for (let xx = Math.floor(x - r); xx <= Math.ceil(x + r); xx++) {
      const d = Math.hypot(xx + 0.5 - x, yy + 0.5 - y) / r;
      const v = n((xx + 64) % 64, (yy + 64) % 64);
      if (d + (v - 0.5) * 0.8 > 1) continue;
      if (hash2(xx, yy, seed) > 0.75 + d * 0.2) continue;
      c.set(xx, yy, C('gray', t * (0.6 + v * 0.6)));
    }
  }
}

function puff() {
  return sheet([0, 1, 2, 3].map((f) => {
    const c = new PixelCanvas(16, 16);
    if (f < 2) fireBlob(c, 8, 8, 2.5 + f, 3 + f, [[255, 255, 255], G('yellow', 0.8), G('yellow', 0.4)]);
    if (f >= 1) smoke(c, 8, 8 - f, 2 + f * 1.4, 9 + f, 0.55 - f * 0.08);
    return c;
  }));
}

function blood(ramp) {
  return sheet([0, 1, 2].map((f) => {
    const c = new PixelCanvas(16, 16);
    const r = rng(20 + f);
    for (let k = 0; k < 8 + f * 3; k++) {
      const a = r.range(0, Math.PI * 2);
      const d = r.range(0, 2 + f * 2.2);
      const x = 8 + Math.cos(a) * d;
      const y = 8 + Math.sin(a) * d + f;
      c.set(x, y, r.chance(0.3) ? C(ramp, 0.7) : C(ramp, 0.45));
      if (f < 2 && r.chance(0.5)) c.set(x + 1, y, C(ramp, 0.35));
    }
    return c;
  }));
}

function explosion(size = 64, palette = FIRE, seed = 31, frames = 5) {
  const out = [];
  for (let f = 0; f < frames; f++) {
    const c = new PixelCanvas(size, size);
    const cx = size / 2;
    const cy = size / 2 + 4;
    const t = f / (frames - 1);
    if (f >= 2) smoke(c, cx, cy - f * 2, size * (0.18 + t * 0.2), seed + f, 0.45 - t * 0.2);
    fireBlob(c, cx, cy, size * (0.16 + t * 0.2), seed + f * 3, palette.slice(Math.min(2, f)), { density: 1 - t * 0.25, holes: t * 0.45 });
    out.push(c);
  }
  return out;
}

/**
 * A blaster bolt: a short glowing streak with a white-hot core (frames 0-1),
 * then a spray of sparks where it hits (frames 2-4). `glow` is the colour
 * group ('red' or 'green'). 32x32.
 */
function blasterBolt(glow) {
  const frames = [];
  for (let f = 0; f < 2; f++) {
    const c = new PixelCanvas(32, 32);
    for (let yy = 0; yy < 32; yy++) {
      for (let xx = 0; xx < 32; xx++) {
        const dx = (xx + 0.5 - 16) / (5 + f);
        const dy = (yy + 0.5 - 16) / 2.6;
        const d = Math.hypot(dx, dy);
        if (d > 1) continue;
        c.set(xx, yy, d < 0.35 ? [255, 255, 255] : d < 0.7 ? G(glow, 1) : G(glow, 0));
      }
    }
    frames.push(c);
  }
  for (let f = 0; f < 3; f++) {
    const c = new PixelCanvas(32, 32);
    const r = rng(60 + f);
    fireBlob(c, 16, 16, 4 - f, 70 + f, [[255, 255, 255], G(glow, 1), G(glow, 0)]);
    for (let k = 0; k < 10; k++) {
      const a = r.range(0, Math.PI * 2);
      const d = 3 + f * 4 + r.range(0, 3);
      c.set(16 + Math.cos(a) * d, 16 + Math.sin(a) * d, f < 2 ? G('yellow', 0.85) : G(glow, 0));
    }
    frames.push(c);
  }
  return sheet(frames);
}

export default [
  { name: 'puff', out: F('puff'), draw: puff },
  { name: 'blood', out: F('blood'), draw: () => blood('blood') },
  { name: 'explosion', out: F('explosion'), draw: () => sheet(explosion(64, FIRE, 31, 5)) },
  { name: 'blaster-bolt', out: F('blaster-bolt'), draw: () => blasterBolt('red') },
];

export { fireBlob, smoke, FIRE };
