// The corner HUD panels, HUD icons, menu cursor and favicon.
import { PixelCanvas, mix } from '../lib/canvas.js';
import { C, G } from '../lib/pal.js';
import { fbm, hash2, seedFrom, rng } from '../lib/noise.js';

/**
 * Corner HUD layout, shared with src/engine/ui/hud.js: each panel's size, the
 * corner cut off its inner top edge, and its readout insets [x, y, w, h].
 */
export const CORNERS = {
  left: { w: 112, h: 32, cut: 10, slots: { shield: [3, 3, 52, 27], health: [57, 3, 52, 27] } },
  right: { w: 72, h: 32, cut: 10, slots: { ammo: [17, 3, 52, 27], keys: [3, 3, 12, 27] } },
};

function inset(c, x, y, w, h, fill) {
  c.rect(x, y, w, h, fill);
  c.rect(x, y, w, 1, C('gray', 0.04));
  c.rect(x, y, 1, h, C('gray', 0.06));
  c.rect(x, y + h - 1, w, 1, C('steel', 0.5));
  c.rect(x + w - 1, y, 1, h, C('steel', 0.45));
}

/**
 * A worn steel plate for one bottom corner, with its inner top corner cut at
 * 45 degrees. `side` is 'left' or 'right' (which screen corner it sits in).
 */
function cornerPanel(side) {
  const { w: W, h: H, cut, slots } = CORNERS[side];
  const c = new PixelCanvas(W, H);
  const seed = seedFrom(`hud-${side}`);
  const n = fbm(seed, 64, { cells: 4, octaves: 4 });
  const r = rng(seed);
  // Distance in from the cut edge (negative = cut away).
  const inner = (x, y) => (side === 'left' ? W - 1 - x : x) + y - cut;
  c.each((x, y) => {
    if (inner(x, y) < 0) return null;
    const t = 0.24 + n(x % 64, y + (x >> 6) * 7) * 0.12 + (hash2(x, y, seed) - 0.5) * 0.04;
    return C('steel', t);
  });
  // Scratches.
  for (let i = 0; i < 14; i++) {
    const x = r.int(0, W - 1);
    const y = r.int(0, H - 1);
    const len = r.int(2, 6);
    for (let k = 0; k < len; k++) if (c.opaque(x + k, y + (k >> 2))) c.set(x + k, y + (k >> 2), C('steel', 0.55));
  }
  // Bevel: light along the top and the cut, dark at the outer edge.
  c.each((x, y, col) => {
    if (!col) return undefined;
    const d = inner(x, y);
    if (y === 0 || d === 0) return C('steel', 0.6);
    if (y === 1 || d === 1) return C('steel', 0.45);
    if ((side === 'left' && x === 0) || (side === 'right' && x === W - 1)) return C('gray', 0.04);
    return undefined;
  });
  for (const [x, y, w, h] of Object.values(slots)) inset(c, x, y, w, h, C('gray', 0.07));
  // Rivets in the outer corners.
  const ox = side === 'left' ? 1 : W - 2;
  c.set(ox, 4, C('steel', 0.8));
  c.set(ox, H - 4, C('steel', 0.8));
  return c;
}

/** Keycard icons (8x10): blue, yellow, red; plus a small fist for berserk. */
function hudIcons() {
  const c = new PixelCanvas(8 * 4, 10);
  const card = (i, ramp, glow) => {
    const ox = i * 8;
    c.rect(ox + 1, 1, 6, 9, C('gray', 0.22));
    c.rect(ox + 1, 3, 6, 2, G(glow, 1));
    c.rect(ox + 2, 7, 3, 1, C('gray', 0.6));
    c.frame(ox, 0, 8, 10, C('gray', 0.05));
    c.set(ox + 6, 8, C(ramp, 0.7));
  };
  card(0, 'steel', 'cyan');
  card(1, 'yellow', 'amber');
  card(2, 'blood', 'red');
  // 3: berserk, a clenched fist.
  c.rect(25, 3, 6, 5, C('gray', 0.3));
  for (let k = 0; k < 3; k++) c.rect(25 + k * 2, 2, 1, 1, C('gray', 0.45));
  c.rect(26, 8, 4, 2, C('rust', 0.35));
  return c;
}

/** Menu cursor: a red blaster bolt that pulses (2 frames, 16x16). */
function bolt(bright) {
  const c = new PixelCanvas(16, 16);
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const d = Math.hypot((x + 0.5 - 8) / 7, (y + 0.5 - 8) / 2.6);
      if (d > 1) continue;
      c.set(x, y, d < 0.35 ? [255, 255, 255] : d < 0.7 ? G('red', bright ? 1 : 0.5) : G('red', 0));
    }
  }
  return c;
}

function cursor() {
  const c = new PixelCanvas(32, 16);
  c.blit(bolt(true), 0, 0);
  c.blit(bolt(false), 16, 0);
  return c;
}

/** Favicon: a red bolt across a dark disc. */
function favicon() {
  const c = new PixelCanvas(32, 32);
  c.circle(16, 16, 15, C('gray', 0.1));
  c.ring(16, 16, 15, 1, C('gray', 0.5));
  for (let k = -9; k <= 9; k++) {
    for (let w = -2; w <= 2; w++) c.set(16 + k, 16 - k * 0.5 + w, Math.abs(w) < 1 ? [255, 255, 255] : G('red', 1));
  }
  return c;
}

export default [
  { name: 'hud-left', out: 'assets/ui/hud-left.png', draw: () => cornerPanel('left') },
  { name: 'hud-right', out: 'assets/ui/hud-right.png', draw: () => cornerPanel('right') },
  { name: 'hud-icons', out: 'assets/ui/hud-icons.png', draw: hudIcons },
  { name: 'cursor', out: 'assets/ui/cursor.png', draw: cursor },
  { name: 'favicon', out: 'assets/ui/favicon.png', draw: favicon },
];
