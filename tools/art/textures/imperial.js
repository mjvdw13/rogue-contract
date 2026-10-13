// Imperial garrison and desert canyon textures: grey wall panels, gloss
// black trim, light strips, computer banks, vents and grates, doors and
// switches, canyon rock and sand. 64x64 and seamless, except the doorways'
// jambs (16x64 and 32x64: half a tile and a tile deep) and the main gate
// (128x128, one whole door).
import {
  texture, noiseFill, mottle, speckle, stain, scratches, grimeGradient, bevel, rivet,
  C, mix, darken, lighten, hash2, fbm, PixelCanvas,
} from '../lib/tex.js';
import { G } from '../lib/pal.js';

const T = (name) => `assets/textures/${name}.png`;

/** Imperial panel grey: cool, slightly blue. */
const GREY = (t) => mix(C('gray', t), C('steel', t), 0.25);

function strip(frames) {
  const out = new PixelCanvas(64 * frames.length, 64);
  frames.forEach((f, i) => out.blit(f, i * 64, 0));
  return out;
}

/** A smooth panel fill with faint mottling. */
function panelFill(c, seed, a, b) {
  noiseFill(c, seed, a, b, { cells: 3, octaves: 3, grain: 0.03, contrast: 0.8 });
}

/** A horizontal seam: a dark groove with a lit lower lip. */
function seamH(c, y, base) {
  c.rect(0, y, 64, 1, darken(base, 0.55));
  c.rect(0, y + 1, 64, 1, lighten(base, 0.12));
}

function seamV(c, x, y0, y1, base) {
  c.rect(x, y0, 1, y1 - y0, darken(base, 0.55));
  c.rect(x + 1, y0, 1, y1 - y0, lighten(base, 0.1));
}

// ------------------------------------------------------------------ walls

/** The standard grey wall: two tall panels, banded seams, recessed slots. */
function impPanel() {
  const { c, seed, r } = texture('imp-panel');
  const base = GREY(0.5);
  panelFill(c, seed, GREY(0.44), GREY(0.56));
  for (const y of [0, 20, 44]) seamH(c, y, base);
  seamV(c, 31, 0, 64, base);
  // A darker band across the middle with recessed slots.
  bevel(c, 0, 22, 64, 20, GREY(0.38), { depth: 1, hi: 0.15, lo: 0.3 });
  for (const x of [6, 38]) {
    c.rect(x, 28, 20, 3, C('gray', 0.08));
    c.rect(x, 31, 20, 1, GREY(0.5));
  }
  for (const x of [3, 28, 35, 60]) {
    rivet(c, x, 4, base);
    rivet(c, x, 48, base);
  }
  scratches(c, r, 6, darken(base, 0.2), { maxLen: 5 });
  grimeGradient(c, { bottom: 0.18, top: 0.04 });
  return c;
}

/** Gloss black trim panel with thin grey edges and a reflective sheen. */
function impPanelDark() {
  const { c, seed } = texture('imp-panel-dark');
  const n = fbm(seed, 64, { cells: 2, octaves: 2 });
  c.each((x, y) => {
    const sheen = Math.max(0, 1 - Math.abs(((x + y * 0.6) % 64) - 20) / 10) * 0.08;
    return C('gray', 0.06 + n(x, y) * 0.04 + sheen);
  });
  for (const y of [0, 32]) {
    c.rect(0, y, 64, 1, C('gray', 0.3));
    c.rect(0, y + 1, 64, 1, C('gray', 0.02));
  }
  for (const x of [0, 32]) c.rect(x, 0, 1, 64, C('gray', 0.22));
  c.rect(6, 12, 20, 2, C('gray', 0.16));
  c.rect(38, 44, 20, 2, C('gray', 0.16));
  return c;
}

/** Grey wall with a glowing horizontal light strip. */
function impLights() {
  const { c, seed, r } = texture('imp-lights');
  const base = GREY(0.48);
  panelFill(c, seed, GREY(0.42), GREY(0.54));
  seamH(c, 0, base);
  seamH(c, 46, base);
  bevel(c, 0, 24, 64, 12, C('gray', 0.12), { depth: 1 });
  c.rect(0, 28, 64, 4, G('tube', 1));
  c.rect(0, 27, 64, 1, G('tube', 0));
  c.rect(0, 32, 64, 1, G('tube', 0));
  for (const x of [15, 31, 47, 63]) c.rect(x, 26, 1, 8, C('gray', 0.1));
  scratches(c, r, 4, darken(base, 0.2), { maxLen: 4 });
  grimeGradient(c, { bottom: 0.15, top: 0.04 });
  return c;
}

/** A computer bank: readouts and blinking lights (animated). */
function impComputer() {
  const frames = [];
  for (let f = 0; f < 3; f++) {
    const { c, seed } = texture('imp-computer');
    const base = GREY(0.36);
    panelFill(c, seed, GREY(0.3), GREY(0.4));
    seamH(c, 0, base);
    seamV(c, 31, 0, 64, base);
    for (const x of [3, 35]) {
      bevel(c, x, 6, 26, 16, C('gray', 0.05), { depth: 1 });
      // Readout lines.
      for (let k = 0; k < 4; k++) {
        const len = 6 + Math.floor(hash2(x, k + f * 3, seed) * 14);
        c.rect(x + 3, 9 + k * 3, len, 1, k === 0 ? G('green', 0.9) : G('green', 0.5));
      }
      // Button rows.
      for (let row = 0; row < 3; row++) {
        for (let k = 0; k < 6; k++) {
          const on = hash2(x + k, row + f * 5, seed) > 0.55;
          const col = on ? [G('red', 1), G('green', 0.8), G('amber', 1)][(k + row) % 3] : C('gray', 0.15);
          c.rect(x + 2 + k * 4, 28 + row * 6, 3, 3, C('gray', 0.1));
          c.set(x + 3 + k * 4, 29 + row * 6, col);
        }
      }
      bevel(c, x, 48, 26, 12, GREY(0.3), { depth: 1 });
      for (let k = 0; k < 5; k++) c.rect(x + 3, 50 + k * 2, 20, 1, C('gray', 0.12));
    }
    grimeGradient(c, { bottom: 0.2, top: 0.05 });
    frames.push(c);
  }
  return strip(frames);
}

/** A ventilation grille set into a panel. */
function impVent() {
  const { c, seed, r } = texture('imp-vent');
  const base = GREY(0.42);
  panelFill(c, seed, GREY(0.36), GREY(0.48));
  bevel(c, 4, 6, 56, 52, C('gray', 0.1), { depth: 2 });
  for (let y = 10; y < 56; y += 4) {
    c.rect(7, y, 50, 2, C('gray', 0.03));
    c.rect(7, y + 2, 50, 1, GREY(0.34));
  }
  for (const [x, y] of [[2, 3], [61, 3], [2, 60], [61, 60]]) rivet(c, x, y, base);
  scratches(c, r, 5, darken(base, 0.25), { maxLen: 4 });
  return c;
}

/** Grey panel with an orange-and-black warning stripe along the bottom. */
function impStripe() {
  const c = impPanel();
  for (let y = 50; y < 62; y++) {
    for (let x = 0; x < 64; x++) {
      const on = Math.floor((x + y) / 6) % 2 === 0;
      c.set(x, y, on ? C('orange', 0.62) : C('gray', 0.08));
    }
  }
  c.rect(0, 49, 64, 1, C('gray', 0.1));
  c.rect(0, 62, 64, 1, C('gray', 0.1));
  return c;
}

/** Layered desert rock: horizontal strata in ochre and rust, cracked. */
function canyonRock() {
  const { c, seed, r } = texture('canyon-rock');
  const n = fbm(seed, 64, { cells: 4, octaves: 4 });
  const bands = fbm(seed + 3, 64, { cells: 2, octaves: 2 });
  c.each((x, y) => {
    const strata = Math.sin((y + bands(x, y) * 14) * 0.45) * 0.5 + 0.5;
    const t = 0.32 + strata * 0.22 + (n(x, y) - 0.5) * 0.3;
    return mix(C('rust', 0.55), C('beige', 0.55), strata * 0.6).map((v) => v * (0.7 + t * 0.6));
  });
  for (let k = 0; k < 7; k++) {
    let x = r.range(0, 64);
    let y = r.range(0, 64);
    for (let s = 0; s < 14; s++) {
      c.set(((Math.floor(x) % 64) + 64) % 64, ((Math.floor(y) % 64) + 64) % 64, C('rust', 0.12));
      x += r.range(-1, 1);
      y += 1;
    }
  }
  speckle(c, seed, 0.08, 0.2);
  return c;
}

// ------------------------------------------------------------------ floors and ceilings

/** Large dark floor plates with bevelled seams. */
function impFloor() {
  const { c, seed, r } = texture('imp-floor');
  panelFill(c, seed, GREY(0.24), GREY(0.32));
  for (const [x, y] of [[0, 0], [32, 0], [0, 32], [32, 32]]) bevel(c, x, y, 32, 32, GREY(0.28), { depth: 1, fill: false, hi: 0.12, lo: 0.4 });
  for (const [x, y] of [[3, 3], [28, 3], [3, 28], [28, 28]]) {
    rivet(c, x, y, GREY(0.28));
    rivet(c, x + 32, y + 32, GREY(0.28));
  }
  scratches(c, r, 10, GREY(0.38), { maxLen: 6 });
  mottle(c, seed, 0.12);
  return c;
}

/** Ceiling: recessed square panels. */
function impCeiling() {
  const { c, seed } = texture('imp-ceiling');
  panelFill(c, seed, GREY(0.3), GREY(0.38));
  for (const [x, y] of [[0, 0], [32, 0], [0, 32], [32, 32]]) {
    bevel(c, x + 2, y + 2, 28, 28, GREY(0.28), { depth: 2, hi: 0.1, lo: 0.35 });
    c.rect(x + 8, y + 8, 16, 16, GREY(0.24));
  }
  return c;
}

/** Ceiling with a glowing light panel. */
function impCeilingLight() {
  const { c, seed } = texture('imp-ceiling-light');
  panelFill(c, seed, GREY(0.3), GREY(0.38));
  bevel(c, 6, 6, 52, 52, C('gray', 0.12), { depth: 2 });
  c.rect(10, 10, 44, 44, G('tube', 0));
  c.rect(12, 12, 40, 40, G('tube', 1));
  for (let k = 12; k < 52; k += 8) {
    c.rect(k, 12, 1, 40, G('tube', 0));
    c.rect(12, k, 40, 1, G('tube', 0));
  }
  return c;
}

/** A metal floor grate over darkness. */
function impGrate() {
  const { c, seed } = texture('imp-grate');
  c.fill(C('gray', 0.02));
  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 64; x++) {
      const bar = x % 8 < 2 || y % 8 < 2;
      if (bar) c.set(x, y, GREY(0.3 + (x % 8 === 0 || y % 8 === 0 ? 0.1 : 0) + hash2(x, y, seed) * 0.05));
    }
  }
  for (const y of [0, 32]) c.rect(0, y, 64, 2, GREY(0.38));
  return c;
}

/** Lift platform: a dark plate with yellow chevrons around the edge. */
function liftFloor() {
  const { c, seed } = texture('lift-floor');
  panelFill(c, seed, GREY(0.2), GREY(0.28));
  bevel(c, 0, 0, 64, 64, GREY(0.22), { depth: 2, fill: false });
  for (let k = 0; k < 64; k++) {
    const on = Math.floor(k / 4) % 2 === 0;
    const col = on ? C('yellow', 0.7) : C('gray', 0.08);
    for (const d of [2, 3, 4]) {
      c.set(k, d, col);
      c.set(k, 63 - d, col);
      c.set(d, k, col);
      c.set(63 - d, k, col);
    }
  }
  c.ring(32, 32, 14, 2, GREY(0.4));
  c.circle(32, 32, 4, GREY(0.36));
  return c;
}

/** Wind-rippled desert sand. */
function sand() {
  const { c, seed } = texture('sand');
  const n = fbm(seed, 64, { cells: 4, octaves: 4 });
  c.each((x, y) => {
    const ripple = Math.sin((y + n(x, y) * 10) * 0.8) * 0.5 + 0.5;
    return mix(C('beige', 0.5), C('orange', 0.6), 0.35).map((v) => v * (0.82 + ripple * 0.12 + (n(x, y) - 0.5) * 0.2));
  });
  speckle(c, seed, 0.1, 0.15);
  return c;
}

// ------------------------------------------------------------------ doors and switches

/**
 * A door, 2 units square (one whole door, as Dark Forces' IDDOOR1): a grey
 * slab in a dark frame, braced with an X round a hub, and a coloured key
 * panel on the hub for locked doors.
 */
function impDoor(name, light) {
  return () => {
    const { c, seed, r } = texture(name);
    const base = GREY(0.48);
    panelFill(c, seed, GREY(0.42), GREY(0.52));
    // The X brace, then the frame over its ends.
    for (let k = -2; k <= 2; k++) {
      c.line(3, 3 + k, 60, 60 + k, GREY(k === -2 ? 0.62 : k === 2 ? 0.26 : 0.38));
      c.line(60, 3 + k, 3, 60 + k, GREY(k === -2 ? 0.62 : k === 2 ? 0.26 : 0.38));
    }
    c.frame(0, 0, 64, 64, C('gray', 0.1));
    c.frame(1, 1, 62, 62, GREY(0.3));
    c.frame(2, 2, 60, 60, GREY(0.6));
    seamH(c, 31, base);
    // The hub, and the key panel on it.
    bevel(c, 24, 24, 16, 16, GREY(0.3), { depth: 2 });
    c.rect(28, 28, 8, 8, light ?? C('gray', 0.12));
    if (light) c.rect(29, 29, 3, 2, lighten(light, 0.3));
    scratches(c, r, 6, darken(base, 0.25), { maxLen: 5, vertical: true });
    grimeGradient(c, { bottom: 0.2, top: 0.05 });
    return c;
  };
}

/**
 * A doorway's side (jamb): dark metal round a blue light strip and a control
 * panel. `imp-jamb` is half a tile wide (a door in a wall 1 tile thick);
 * `imp-gate-jamb` a whole tile, with metal either side of the strip.
 */
function impJamb(name, w) {
  return () => {
    const { c, seed } = texture(name, w, 64);
    const x0 = (w - 16) >> 1; // the strip's frame, 16 wide, in the middle
    panelFill(c, seed, C('gray', 0.16), C('gray', 0.24));
    c.rect(x0 + 2, 0, 12, 64, C('gray', 0.08));
    for (let y = 2; y < 64; y += 8) {
      if (y >= 26 && y < 42) continue;
      c.rect(x0 + 4, y, 8, 4, G('cyan', 0.75));
      c.rect(x0 + 5, y + 1, 6, 2, G('cyan', 1));
    }
    // The control panel: red and green lights.
    bevel(c, x0 + 3, 28, 10, 12, C('gray', 0.3), { depth: 1 });
    c.rect(x0 + 5, 30, 2, 2, G('red', 1));
    c.rect(x0 + 9, 30, 2, 2, G('green', 0.9));
    c.rect(x0 + 5, 35, 6, 3, C('gray', 0.12));
    if (w > 16) {
      seamV(c, 0, 0, 64, C('gray', 0.2));
      seamV(c, w - 2, 0, 64, C('gray', 0.2));
    }
    return c;
  };
}

/** The wall above a doorway: panelling over a row of blue lights along the opening's top. */
function impLintel() {
  const { c, seed } = texture('imp-lintel');
  const base = GREY(0.34);
  panelFill(c, seed, GREY(0.3), GREY(0.38));
  for (let y = 10; y < 48; y += 12) seamH(c, y, base);
  c.rect(0, 50, 64, 14, C('gray', 0.1));
  for (let x = 2; x < 64; x += 11) {
    c.rect(x, 53, 7, 7, C('gray', 0.22));
    c.rect(x + 2, 54, 3, 5, G('cyan', 1));
  }
  c.rect(0, 63, 64, 1, C('gray', 0.05));
  return c;
}

/** The garrison's main gate, 4 units square: a round blast door in a heavy frame. */
function impGate() {
  const { c, seed, r } = texture('imp-gate', 128, 128);
  const base = GREY(0.46);
  panelFill(c, seed, GREY(0.4), GREY(0.5));
  c.rect(0, 0, 128, 18, C('gray', 0.18));
  for (let x = 4; x < 128; x += 16) c.rect(x, 6, 8, 4, G('cyan', 0.6));
  c.frame(0, 18, 128, 110, C('gray', 0.1));
  c.circle(64, 72, 46, GREY(0.3));
  c.ring(64, 72, 46, 3, GREY(0.62));
  c.circle(64, 72, 38, GREY(0.44));
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    c.line(64 + Math.cos(a) * 14, 72 + Math.sin(a) * 14, 64 + Math.cos(a) * 38, 72 + Math.sin(a) * 38, GREY(0.28));
  }
  c.circle(64, 72, 14, GREY(0.32));
  c.ring(64, 72, 14, 2, GREY(0.6));
  c.rect(52, 70, 24, 4, C('gray', 0.12));
  c.circle(64, 30, 4, G('red', 1));
  seamH(c, 120, base);
  scratches(c, r, 14, darken(base, 0.25), { maxLen: 7, vertical: true });
  grimeGradient(c, { bottom: 0.25, top: 0.05 });
  return c;
}

/** A wall switch panel: a red light, or green once used. */
function impSwitch(on) {
  return () => {
    const c = impPanel();
    bevel(c, 20, 18, 24, 28, C('gray', 0.12), { depth: 2 });
    c.rect(26, 24, 12, 6, on ? G('green', 0.9) : G('red', 1));
    c.rect(24, 34, 16, 8, GREY(0.3));
    c.rect(30, on ? 34 : 38, 4, 4, C('gray', 0.5));
    return c;
  };
}

// ------------------------------------------------------------------ see-through (fences)
// Transparent where nothing is drawn: railings, bars and grates on tile edges.

/** A round steel bar's shade across its width (lit from the upper left). */
const barShade = (k, n) => C('steel', 0.25 + 0.5 * Math.sin(((k + 0.5) / n) * Math.PI) - (k / n) * 0.15);

/** A catwalk railing, 2 units wide and 0.75 tall: top and bottom rails, posts and a brace. */
function impRailing() {
  const c = new PixelCanvas(64, 24);
  for (let k = 0; k < 4; k++) {
    c.rect(0, k, 64, 1, barShade(k, 4));
    c.rect(0, 20 + k, 64, 1, barShade(k, 4));
  }
  for (const x0 of [0, 32]) for (let k = 0; k < 3; k++) c.rect(x0 + k, 0, 1, 24, barShade(k, 3));
  // A diagonal brace in each bay.
  for (let x = 3; x < 32; x++) {
    const y = Math.round(4 + ((x - 3) / 28) * 15);
    for (let k = 0; k < 2; k++) {
      c.set(x, y + k, C('steel', 0.45 - k * 0.15));
      c.set(x + 32, y + k, C('steel', 0.45 - k * 0.15));
    }
  }
  return c;
}

/** Vertical bars: two round bars per 1-unit repeat. */
function impBars() {
  const c = new PixelCanvas(32, 64);
  for (const x0 of [5, 21]) for (let k = 0; k < 5; k++) c.rect(x0 + k, 0, 1, 64, barShade(k, 5));
  for (const x0 of [5, 21]) for (const y of [14, 46]) c.rect(x0 - 1, y, 7, 2, C('steel', 0.2));
  return c;
}

/** A diamond lattice grate, like a lift cage. */
function impCage() {
  const c = new PixelCanvas(64, 64);
  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 64; x++) {
      const a = (x + y) % 16;
      const b = (x - y + 64) % 16;
      if (a < 3) c.set(x, y, C('gray', 0.3 + a * 0.08));
      else if (b < 3) c.set(x, y, C('gray', 0.22 + b * 0.06));
    }
  }
  return c;
}

// ------------------------------------------------------------------ sky

/** Night over the canyon: stars, a pale ringed planet and a jagged mesa skyline. 512x128. */
function skyNight() {
  const W = 512;
  const H = 128;
  const c = new PixelCanvas(W, H);
  const seed = 9091;
  const haze = fbm(seed, W, { cells: 8, octaves: 4, sizeY: H, cellsY: 2 });
  c.each((x, y) => {
    const t = y / H;
    const base = mix(C('navy', 0.05), C('purple', 0.22), Math.pow(t, 2));
    return lighten(base, Math.max(0, haze(x, y) - 0.6) * 0.25);
  });
  for (let k = 0; k < 420; k++) {
    const x = Math.floor(hash2(k, 1, seed) * W);
    const y = Math.floor(Math.pow(hash2(k, 2, seed), 1.4) * H * 0.8);
    const b = hash2(k, 3, seed);
    c.set(x, y, b > 0.96 ? G('pale', 0) : b > 0.8 ? G('tube', 1) : C('gray', 0.5 + b * 0.4));
  }
  // A big pale planet with a ring.
  const px = 360;
  const py = 34;
  for (let y = -20; y <= 20; y++) {
    for (let x = -20; x <= 20; x++) {
      const d = Math.hypot(x, y) / 20;
      if (d > 1) continue;
      const lit = Math.max(0, 1 - Math.hypot(x + 9, y + 7) / 30);
      c.set(px + x, py + y, mix(C('steel', 0.25), C('beige', 0.75), lit * (0.8 + Math.sin(y * 0.6) * 0.05)));
    }
  }
  for (let a = 0; a < Math.PI * 2; a += 0.004) {
    const x = Math.cos(a) * 34;
    const y = Math.sin(a) * 7 - Math.cos(a) * 4;
    if (Math.sin(a) < 0 && Math.hypot(x, y) < 20) continue;
    c.set(Math.round(px + x), Math.round(py + y), C('beige', 0.6));
  }
  // Mesas along the horizon.
  const ridge = fbm(seed + 1, W, { cells: 10, octaves: 3, sizeY: 1, cellsY: 1 });
  for (let x = 0; x < W; x++) {
    const flat = Math.round(ridge(x, 0) * 4) / 4;
    const top = Math.round(H - 14 - flat * 30);
    for (let y = top; y < H; y++) c.set(x, y, mix(C('rust', 0.08), C('navy', 0.06), (y - top) / 30));
  }
  return c;
}

export default [
  { name: 'imp-panel', out: T('imp-panel'), draw: impPanel },
  { name: 'imp-panel-dark', out: T('imp-panel-dark'), draw: impPanelDark },
  { name: 'imp-lights', out: T('imp-lights'), draw: impLights },
  { name: 'imp-computer', out: T('imp-computer'), draw: impComputer },
  { name: 'imp-vent', out: T('imp-vent'), draw: impVent },
  { name: 'imp-stripe', out: T('imp-stripe'), draw: impStripe },
  { name: 'canyon-rock', out: T('canyon-rock'), draw: canyonRock },
  { name: 'imp-floor', out: T('imp-floor'), draw: impFloor },
  { name: 'imp-ceiling', out: T('imp-ceiling'), draw: impCeiling },
  { name: 'imp-ceiling-light', out: T('imp-ceiling-light'), draw: impCeilingLight },
  { name: 'imp-grate', out: T('imp-grate'), draw: impGrate },
  { name: 'lift-floor', out: T('lift-floor'), draw: liftFloor },
  { name: 'sand', out: T('sand'), draw: sand },
  { name: 'imp-door', out: T('imp-door'), draw: impDoor('imp-door', null) },
  { name: 'imp-door-red', out: T('imp-door-red'), draw: impDoor('imp-door-red', G('red', 1)) },
  { name: 'imp-door-blue', out: T('imp-door-blue'), draw: impDoor('imp-door-blue', G('cyan', 0.7)) },
  { name: 'imp-door-yellow', out: T('imp-door-yellow'), draw: impDoor('imp-door-yellow', G('amber', 1)) },
  { name: 'imp-jamb', out: T('imp-jamb'), draw: impJamb('imp-jamb', 16) },
  { name: 'imp-gate-jamb', out: T('imp-gate-jamb'), draw: impJamb('imp-gate-jamb', 32) },
  { name: 'imp-lintel', out: T('imp-lintel'), draw: impLintel },
  { name: 'imp-gate', out: T('imp-gate'), draw: impGate },
  { name: 'imp-switch', out: T('imp-switch'), draw: impSwitch(false) },
  { name: 'imp-switch-on', out: T('imp-switch-on'), draw: impSwitch(true) },
  { name: 'sky-night', out: T('sky-night'), draw: skyNight },
  { name: 'imp-railing', out: T('imp-railing'), draw: impRailing },
  { name: 'imp-bars', out: T('imp-bars'), draw: impBars },
  { name: 'imp-cage', out: T('imp-cage'), draw: impCage },
];
