import { ModelBuilder } from './lib/build.js';

// The homestead's machinery under the ground (levels/m2.js), after the
// cutaway in Mark's references: the farm's water pipe on its brackets, the
// joints where it turns, the pump it runs down into, and hatches in the
// floors.
//
// The pipe's pieces are built round its axis at the origin, with their
// brackets reaching back `WATER_PIPE.out` toward -y (the wall behind it);
// the level turns each to put its wall on the right side. A run along x
// at angle 0 has its wall to the north.

/** The water pipe: its radius, and how far its axis stands off the wall. */
export const WATER_PIPE = { r: 0.13, out: 0.25 };
/** Lengths of straight pipe: quarter tiles, up to 16 (longer runs are joined). */
export const PIPE_RUNS = Array.from({ length: 64 }, (_, k) => (k + 1) / 4);
/** Heights of upright pipe: quarter tiles, up to 10. */
export const PIPE_RISES = Array.from({ length: 40 }, (_, k) => (k + 1) / 4);
/** The pump: its housing's radius and height, and where its inlet meets the pipe (`inlet` up, `back` toward -y). */
export const PUMP = { r: 0.6, top: 1.9, inlet: 1.5, back: 0.75, half: 1.05, depth: 0.8 };
/** A floor hatch's radius. */
export const HATCH = { r: 0.6 };

const PIPE = { tex: 'pipe-rust' };
const IRON = { color: ['gray', 0.22] };
const FLANGE = { tex: 'bay-plate' };

/** Brackets back to the wall at each of `at` (positions along the pipe), `axis` the pipe's way ('x' or 'z'). */
function brackets(m, at, axis) {
  const { r, out } = WATER_PIPE;
  for (const a of at) {
    if (axis === 'x') m.box([a - 0.05, -out, -r - 0.04], [a + 0.05, 0.04, -r + 0.02], IRON);
    else m.box([-0.05, -out, a - 0.05], [0.05, -r + 0.02, a + 0.05], IRON);
    // The strap round it.
    m.cylinder(axis === 'x' ? [a - 0.03, 0, 0] : [0, 0, a - 0.03], r + 0.02, 0.06, { axis, segments: 8, ...IRON, top: false, bottom: false });
  }
}

/** Positions of brackets along a piece `len` long centred on 0: every 1.5 or so, none at the very ends. */
const spaced = (len, from = -len / 2) => {
  const n = Math.max(1, Math.round(len / 1.5));
  return Array.from({ length: n }, (_, k) => from + (len * (k + 0.5)) / n);
};

/** A straight piece of the pipe along x, `len` long, centred on the origin. */
function run(len) {
  const m = new ModelBuilder(`water-pipe-${len}`);
  m.cylinder([-len / 2, 0, 0], WATER_PIPE.r, len, { axis: 'x', segments: 8, ...PIPE, top: false, bottom: false });
  brackets(m, spaced(len), 'x');
  return m.build();
}

/** An upright piece of the pipe, from the origin up `h`. */
function rise(h) {
  const m = new ModelBuilder(`water-pipe-up-${h}`);
  m.cylinder([0, 0, 0], WATER_PIPE.r, h, { segments: 8, ...PIPE, top: false, bottom: false });
  brackets(m, spaced(h, 0), 'z');
  return m.build();
}

/** A flanged joint (where the pipe turns, or where two lengths meet): a bolted box round the axis, a bracket behind it. */
function joint() {
  const m = new ModelBuilder('water-pipe-joint');
  const a = WATER_PIPE.r + 0.07;
  m.box([-a, -a, -a], [a, a, a], FLANGE);
  m.box([-0.06, -WATER_PIPE.out, -0.06], [0.06, -a, 0.06], IRON);
  return m.build();
}

/**
 * The farm's pump (the pump room's, where the water pipe comes down): a
 * grey housing on a plinth, flanged top and bottom, a motor beside it with
 * its cooling slats, the inlet out of its back (where the pipe comes down
 * the wall, `PUMP.back` behind its axis), its outlet down into the floor
 * through a valve with a red wheel, and a gauge on its front.
 */
function pump() {
  const m = new ModelBuilder('water-pump');
  const { r, top, inlet, back, half, depth } = PUMP;
  m.box([-half, -0.6, 0], [half, depth, 0.2], { tex: 'bay-plate' });
  m.cylinder([0, 0, 0.2], r, 1.3, { segments: 12, tex: 'drum-grey', bottom: false });
  for (const z of [0.2, 0.85, 1.42]) m.cylinder([0, 0, z], r + 0.06, 0.08, { segments: 12, ...FLANGE, bottom: false });
  m.cylinder([0, 0, 1.5], r * 0.7, top - 1.5, { segments: 12, tex: 'drum-grey', top: { color: ['gray', 0.4] } });
  // The motor, its slats facing out.
  m.box([r - 0.05, -0.4, 0.2], [half, 0.45, 1.05], { tex: 'metal-grey', side: (i) => (i === 1 ? { tex: 'vent-slats' } : undefined) });
  m.cylinder([r - 0.05, 0.02, 0.62], 0.16, 0.1, { axis: 'x', segments: 8, ...IRON });
  // The inlet out of its back, up to the pipe on the wall.
  m.cylinder([0, -back, inlet], WATER_PIPE.r, back - r * 0.7 + 0.05, { axis: 'y', segments: 8, ...PIPE, top: false, bottom: false });
  m.box([-0.2, -back - 0.2, inlet - 0.2], [0.2, -back + 0.2, inlet + 0.2], FLANGE);
  // The outlet: out of its front low down, a valve, then down into the floor.
  m.cylinder([-0.35, r - 0.1, 0.5], 0.12, 0.45, { axis: 'y', segments: 8, ...PIPE, bottom: false });
  m.cylinder([-0.35, r + 0.35, 0], 0.12, 0.62, { segments: 8, ...PIPE, top: false, bottom: false });
  m.box([-0.5, r + 0.22, 0.42], [-0.2, r + 0.5, 0.7], FLANGE);
  m.cylinder([-0.35, r + 0.5, 0.56], 0.2, 0.05, { axis: 'y', segments: 8, color: [150, 34, 24] });
  // The gauge: a dial on the housing's front.
  m.cylinder([0.25, r - 0.03, 1.15], 0.13, 0.07, { axis: 'y', segments: 8, ...IRON, top: { color: [214, 206, 182] } });
  m.outlineLines([[-half, -0.6], [half, -0.6], [half, depth], [-half, depth]]);
  return m.build();
}

/** A round hatch flush in a floor: a ring of rim, the lid, a handle across it. */
function hatch() {
  const m = new ModelBuilder('floor-hatch');
  const { r } = HATCH;
  m.cylinder([0, 0, 0], r, 0.03, { segments: 12, ...FLANGE, bottom: false });
  m.cylinder([0, 0, 0.03], r - 0.12, 0.01, { segments: 12, tex: 'metal-grey', bottom: false });
  m.box([-0.25, -0.03, 0.04], [0.25, 0.03, 0.08], IRON);
  return m.build();
}

/** The garage's console (after the film's): its width, depth, the desk's height and the back panel's top. */
export const CONSOLE = { half: 1.3, depth: 0.85, desk: 0.95, top: 2.1 };
/** The frame round the garage's opening: how far it stands out of the wall, and its thickness. */
export const FRAME = { deep: 0.35, thick: 0.45 };

const AMBER = { color: [255, 172, 70], glow: true };

/**
 * The garage's round wall: radius `r`, `h` tall from the floor, an opening
 * `gap` either side of each of `openings` (degrees, 0 east,
 * counter-clockwise: onto the pit to the south, into the hangar to the
 * east). `segments` straight panels round the whole circle; `band` the dark
 * band of lamps under the ceiling; `globes` the wall lamps' places
 * (degrees, likewise).
 */
export const GARAGE_RING = { r: 7, h: 4.25, gap: 2, openings: [270, 0], segments: 36, band: 0.6, globes: [62, 118] };

/**
 * The garage's wall (after the film's): plaster panels on the inside of a
 * circle round the origin, facing in, the dark band along their top with
 * two round amber lamps in each panel, and a lamp on a bracket either side
 * of the console. It collides along its panels, so the stepped tiles behind
 * it are never reached; the openings are left clear.
 */
function garageRing() {
  const m = new ModelBuilder('garage-ring');
  const { r, h, gap, openings, segments, band, globes } = GARAGE_RING;
  const TAU = Math.PI * 2;
  const half = Math.asin(gap / r);
  // In the model's axes (x east, y south) an angle runs clockwise, so
  // content degrees are turned the other way.
  const gaps = openings.map((deg) => (((-deg * Math.PI) / 180) % TAU + TAU) % TAU).sort((a, b) => a - b);
  const at = (t, rr = r) => [Math.cos(t) * rr, Math.sin(t) * rr];
  gaps.forEach((g, i) => {
    const from = g + half;
    const span = (gaps[(i + 1) % gaps.length] - half - from + TAU) % TAU;
    const n = Math.max(1, Math.round((segments * span) / TAU));
    for (let k = 0; k < n; k++) panel(at(from + (span * k) / n), at(from + (span * (k + 1)) / n));
  });
  function panel(a, b) {
    const behind = [(a[0] + b[0]), (a[1] + b[1]), h / 2];
    m.face([[...a, 0], [...b, 0], [...b, h - band], [...a, h - band]], { tex: 'adobe' }, behind);
    m.face([[...a, h - band], [...b, h - band], [...b, h], [...a, h]], { tex: 'hold-ceiling' }, behind);
    m.line(a[0], a[1], b[0], b[1]);
    // Two lamps on each panel: a dark cup, its lens lit.
    for (const f of [0.25, 0.75]) {
      const [x, y] = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
      const l = Math.hypot(x, y);
      const [ux, uy] = [-x / l, -y / l];
      const ring = (rr, d) => Array.from({ length: 8 }, (_, i) => {
        const q = (i / 8) * TAU;
        return [x + ux * d - uy * Math.cos(q) * rr, y + uy * d + ux * Math.cos(q) * rr, h - band / 2 + Math.sin(q) * rr];
      });
      m.face(ring(0.17, 0.03), { color: [34, 30, 26] }, [x - ux, y - uy, h - band / 2]);
      m.face(ring(0.12, 0.05), AMBER, [x - ux, y - uy, h - band / 2]);
    }
  }
  // The wall lamps: a bracket out from the wall and a glowing globe.
  for (const deg of globes) {
    const t = (-deg * Math.PI) / 180;
    const [x, y] = at(t, r * Math.cos(Math.PI / segments) - 0.01);
    const [ux, uy] = [-Math.cos(t), -Math.sin(t)];
    const z = 2.5;
    m.cylinder([x + ux * 0.1, y + uy * 0.1, z - 0.06], 0.05, 0.25, { axis: 'z', segments: 6, ...IRON });
    m.cylinder([x + ux * 0.32, y + uy * 0.32, z - 0.15], 0.15, 0.28, { segments: 8, ...AMBER, top: { color: [255, 210, 140], glow: true }, bottom: AMBER });
  }
  return m.build();
}

/** The round kerb round the garage's grating: its inside and outside radii and its top over the grating. */
export const GARAGE_KERB = { inner: 3.05, outer: 3.95, top: 0.32 };

/**
 * The red-ochre kerb round the garage's sunk grating (after the film's),
 * a ring round the origin over the grating's stepped edge: its top, its
 * inside face down to the grating and its lip over the floor round it.
 */
function garageKerb() {
  const m = new ModelBuilder('garage-kerb');
  const { inner, outer, top } = GARAGE_KERB;
  const n = 32;
  const at = (k, r, z) => [Math.cos((k / n) * Math.PI * 2) * r, Math.sin((k / n) * Math.PI * 2) * r, z];
  const RED = { tex: 'pit-dado' };
  for (let k = 0; k < n; k++) {
    m.face([at(k, inner, top), at(k + 1, inner, top), at(k + 1, outer, top), at(k, outer, top)], RED, [0, 0, -1]);
    m.face([at(k, inner, 0), at(k + 1, inner, 0), at(k + 1, inner, top), at(k, inner, top)], RED, at(k + 0.5, outer, top / 2));
    m.face([at(k, outer, 0.2), at(k + 1, outer, 0.2), at(k + 1, outer, top), at(k, outer, top)], RED, [0, 0, top / 2]);
  }
  return m.build();
}

/**
 * The garage's console, after the film's: a long desk against the wall
 * (built looking +y, its back on y = 0), its sloping top crowded with lit
 * buttons, and the panel behind it up to `CONSOLE.top`: a big round gauge,
 * two small screens, dials and a row of lamps.
 */
function garageConsole() {
  const m = new ModelBuilder('garage-console');
  const { half: a, depth: d, desk, top } = CONSOLE;
  const BODY = { tex: 'metal-grey' };
  // The desk: a box, its top sloping down toward you.
  m.prism([[0, 0], [d, 0], [d, desk - 0.12], [0.3, desk]], -a, a, { ...BODY, axis: 'x', bottom: false, side: (i) => (i === 2 ? { tex: 'hold-guts', texScale: 0.5 } : undefined) });
  m.box([-a + 0.05, d, 0], [a - 0.05, d + 0.02, 0.12], { color: [24, 22, 20], bottom: false });
  // The back panel.
  m.box([-a, 0, desk], [a, 0.3, top], { ...BODY, bottom: false, side: (i) => (i === 2 ? { tex: 'bay-plate' } : undefined) });
  // The big gauge, left of middle: a dark rim, a pale face, a needle.
  m.cylinder([-0.55, 0.3, 1.62], 0.34, 0.05, { axis: 'y', segments: 12, color: [40, 36, 32], top: false, bottom: false });
  m.cylinder([-0.55, 0.3, 1.62], 0.3, 0.06, { axis: 'y', segments: 12, color: [40, 36, 32], top: { tex: 'gear-disc' }, bottom: false });
  m.box([-0.56, 0.37, 1.6], [-0.36, 0.38, 1.63], { color: [150, 34, 24], bottom: false });
  // Two small screens, green and amber readouts.
  m.box([0.15, 0.3, 1.45], [0.6, 0.32, 1.8], { color: [70, 200, 120], glow: true, bottom: false });
  m.box([0.72, 0.3, 1.45], [1.17, 0.32, 1.8], { color: [230, 170, 70], glow: true, bottom: false });
  // Dials and a row of little lamps under them.
  for (const x of [0.25, 0.5, 0.8, 1.05]) m.cylinder([x, 0.3, 1.22], 0.07, 0.05, { axis: 'y', segments: 6, color: [214, 206, 182], bottom: false });
  [[-1.1, [255, 60, 40]], [-0.95, [255, 172, 70]], [-0.8, [90, 255, 90]], [-0.25, [255, 60, 40]], [-0.1, [255, 172, 70]]].forEach(([x, color]) => m.box([x - 0.04, 0.3, 1.06], [x + 0.04, 0.32, 1.12], { color, glow: true, bottom: false }));
  // Buttons lit on the desk's slope.
  for (let k = 0; k < 9; k++) {
    const x = -1.05 + k * 0.26;
    const t = (k * 7) % 3;
    m.box([x - 0.05, 0.5, desk - 0.06], [x + 0.05, 0.62, desk - 0.03], { color: [[255, 60, 40], [255, 172, 70], [90, 200, 255]][t], glow: true, bottom: false });
  }
  m.outlineLines([[-a, 0], [a, 0], [a, d], [-a, d]]);
  return m.build();
}

/**
 * A thick frame round a rounded-square opening `width` wide and `tall`
 * high (the garage's onto its pit): jambs, a lintel and fillets across its
 * top corners, standing `FRAME.deep` out of the wall, built looking +y
 * with its back on y = 0, its opening's foot at z = 0.
 */
function openingFrame(width, tall) {
  const m = new ModelBuilder(`garage-frame-${width}`);
  const { deep, thick } = FRAME;
  const a = width / 2;
  const PLASTER_ = { tex: 'adobe' };
  for (const s of [-1, 1]) m.box(s < 0 ? [-a - thick, 0, 0] : [a, 0, 0], s < 0 ? [-a, deep, tall + thick] : [a + thick, deep, tall + thick], PLASTER_);
  m.box([-a, 0, tall], [a, deep, tall + thick], PLASTER_);
  // The rounded corners: fillets across the top inside corners.
  const f = 0.45;
  for (const s of [-1, 1]) m.prism([[s * a, tall - f], [s * a, tall], [s * (a - f), tall]].map(([x, z]) => [x, z]), 0, deep, { ...PLASTER_, axis: 'y' });
  return m.build();
}

/** The kitchen's counters: their lengths, the worktop's height and depth. */
export const COUNTER = { lengths: [2, 3, 4, 5, 6, 7], top: 0.95, depth: 0.68 };
/** The kitchen's stack of appliances: its half width, depth and height. */
export const APPLIANCES = { half: 0.38, depth: 0.6, top: 1.6 };

const WHITE = { tex: 'plaster-white' };
const SEAM = { color: [96, 92, 80] };
/** The red stripe along the cupboards (the film's kitchen). */
const STRIPE = { color: [176, 60, 46] };

/**
 * A run of the kitchen's built-in counter, after the film's (Mark's
 * references): smooth white cupboards under a worktop with a rounded nose,
 * a dark kick at the foot, and cupboards over it on the wall with a red
 * stripe along their fronts and a light under them. `len` long, built
 * looking +y with its back on y = 0.
 */
function counter(len) {
  const m = new ModelBuilder(`kitchen-counter-${len}`);
  const a = len / 2;
  const { top, depth: d } = COUNTER;
  const doors = (z0, z1, y) => {
    for (let x = -a + 0.6; x < a - 0.3; x += 0.6) m.box([x - 0.012, y, z0], [x + 0.012, y + 0.01, z1], { ...SEAM, bottom: false });
  };
  m.box([-a, 0, 0], [a, d - 0.08, 0.12], { color: [40, 36, 30], bottom: false });
  m.box([-a, 0, 0.12], [a, d - 0.06, top - 0.1], { ...WHITE, bottom: false });
  doors(0.16, top - 0.14, d - 0.06);
  m.box([-a, 0, top - 0.1], [a, d - 0.04, top], WHITE);
  m.cylinder([-a, d - 0.05, top - 0.05], 0.05, len, { axis: 'x', segments: 6, ...WHITE });
  // The cupboards over it, the stripe, the light under them.
  m.box([-a, 0, 1.65], [a, 0.38, 2.4], WHITE);
  doors(1.68, 2.37, 0.38);
  m.box([-a, 0.38, 1.95], [a, 0.395, 2.05], { ...STRIPE, bottom: false });
  m.box([-a + 0.1, 0.24, 1.635], [a - 0.1, 0.34, 1.65], { color: [255, 236, 190], glow: true, top: false });
  m.outlineLines([[-a, 0], [a, 0], [a, d], [-a, d]]);
  return m.build();
}

/**
 * The kitchen's appliances, stacked in a niche (the film's): a low unit
 * with a dark grille and two lamps, and on it a taller one with a dark
 * window, a column of lit buttons and a red trim along its top. Built
 * looking +y with its back on y = 0.
 */
function appliances() {
  const m = new ModelBuilder('kitchen-appliances');
  const { half: a, depth: d, top } = APPLIANCES;
  m.box([-a, 0, 0], [a, d, 0.85], { ...WHITE, bottom: false });
  m.box([-a + 0.08, d, 0.15], [a - 0.08, d + 0.01, 0.6], { color: [30, 28, 26], bottom: false });
  for (const [x, color] of [[-0.2, [255, 60, 40]], [-0.08, [90, 255, 90]]]) m.box([x - 0.03, d, 0.7], [x + 0.03, d + 0.015, 0.76], { color, glow: true, bottom: false });
  m.box([-a + 0.03, 0.05, 0.85], [a - 0.03, d - 0.05, top], WHITE);
  m.box([-a + 0.12, d - 0.05, 1.02], [0.08, d - 0.04, 1.42], { color: [24, 30, 34], bottom: false });
  [[255, 172, 70], [255, 60, 40], [90, 200, 255]].forEach((color, k) => m.box([0.17, d - 0.05, 1.12 + k * 0.1], [0.25, d - 0.035, 1.18 + k * 0.1], { color, glow: true, bottom: false }));
  m.box([-a + 0.03, d - 0.05, top - 0.08], [a - 0.03, d - 0.035, top], { ...STRIPE, bottom: false });
  m.outlineLines([[-a, 0], [a, 0], [a, d], [-a, d]]);
  return m.build();
}

/**
 * The skyhopper (a T-16): its height. Everything else is in parts of it,
 * measured off the schematics in Mark's references (2026-11-09).
 */
export const SKYHOPPER = { height: 11 };

/**
 * A flat plate (an airfoil) round the corners of its middle surface (a
 * convex outline), `t` either side along `n`; `edge` styles its rims.
 */
function plate(m, corners, n, t, style, edge = style) {
  const off = (p, k) => [p[0] + n[0] * t * k, p[1] + n[1] * t * k, p[2] + n[2] * t * k];
  const c = corners.length;
  const mid = corners.reduce((a, p) => [a[0] + p[0] / c, a[1] + p[1] / c, a[2] + p[2] / c], [0, 0, 0]);
  for (const k of [-1, 1]) m.face(corners.map((p) => off(p, k)), style, mid);
  for (let i = 0; i < c; i++) {
    const [a, b] = [corners[i], corners[(i + 1) % c]];
    m.face([off(a, 1), off(b, 1), off(b, -1), off(a, -1)], edge, mid);
  }
}

/** A face laid `d` out over another (away from `inside`): markings, windows. */
function overlay(m, points, style, inside, d = 0.015) {
  const [a, b, c] = points;
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  let n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  const l = Math.hypot(...n);
  n = n.map((x) => x / l);
  const mid = points.reduce((s, p) => [s[0] + p[0] / points.length, s[1] + p[1] / points.length, s[2] + p[2] / points.length], [0, 0, 0]);
  if ((mid[0] - inside[0]) * n[0] + (mid[1] - inside[1]) * n[1] + (mid[2] - inside[2]) * n[2] < 0) n = n.map((x) => -x);
  m.face(points.map((p) => [p[0] + n[0] * d, p[1] + n[1] * d, p[2] + n[2] * d]), style, inside);
}

/**
 * The family's skyhopper in its hangar: a T-16, after the schematics, the
 * model and the photo in Mark's references (2026-11-09). As wide on its
 * feet as it's tall, and not half as long:
 * - the cockpit body, triangular from the front: flat side panels, its
 *   face raked forward from the ridge to its foot, the glass in its upper
 *   half in a pale frame, a triangle of it on each side against the
 *   panel, over a band of small windows;
 * - the upper airfoil standing out of the ridge, half the height, its
 *   trailing edge upright and overhanging the body's back, its leading
 *   edge swept back to a tip half the root's chord; two domes on it, red
 *   marks near the tip, actuators on the trailing edge;
 * - the airspeed sensor along the ridge, past both ends;
 * - under the body a deck, the machinery, two small cannons forward and
 *   the heavy cannon slung on a strut; the ion engine on its back;
 * - the two lower airfoils from the deck's edges under the body's back
 *   half, down and out at 37 degrees to the floor, on pads.
 * Light grey riveted panels. Built looking +y (its nose). Below, `f` runs
 * forward from the upper airfoil's trailing edge and `k` up from the
 * floor, both in parts of its height; `u` is across.
 */
function skyhopper() {
  const m = new ModelBuilder('skyhopper');
  const H = SKYHOPPER.height;
  const P = (u, f, k) => [u * H, (f - 0.22) * H, k * H];
  const HULL = { tex: 'cone-panel' };
  const EDGE = { tex: 'hopper-metal' };
  const DARK = { tex: 'hopper-dark' };
  const GUTS = { tex: 'hold-guts', texScale: 0.5 };
  const WHITE = { tex: 'dome-white' };
  const RED = { tex: 'speeder-red' };
  // The glass: the whole pane on each window, so each catches the light.
  const GLASS = (...uv) => ({ tex: 'hopper-glass', uv });
  const PANE = GLASS([0, 0], [1, 0], [1, 1], [0, 1]);

  // The body: a triangle from the front, its ridge at RIDGE and its foot
  // at BASE, HALF wide either side there; from REAR forward, its side
  // panels to PANEL, then the cockpit, its face raked from NOSE[0] at the
  // ridge to NOSE[1] at the foot; the glass down to GLASS_K, the band of
  // windows down to BAND.
  const [RIDGE, BASE, HALF, REAR, PANEL, NOSE, GLASS_K, BAND] = [0.52, 0.29, 0.125, 0.04, 0.24, [0.326, 0.447], 0.39, 0.365];
  const down = (k) => (RIDGE - k) / (RIDGE - BASE);
  const front = (k) => NOSE[0] + down(k) * (NOSE[1] - NOSE[0]);
  const S = (s, f, k) => P(s * HALF * down(k), f, k);
  const F = (u, k) => P(u * HALF * down(k), front(k), k);
  const inside = P(0, (REAR + NOSE[1]) / 2, (RIDGE + BASE) / 2);
  m.face([P(0, REAR, RIDGE), P(HALF, REAR, BASE), P(-HALF, REAR, BASE)], HULL, inside);
  m.face([P(HALF, REAR, BASE), P(HALF, NOSE[1], BASE), P(-HALF, NOSE[1], BASE), P(-HALF, REAR, BASE)], DARK, inside);
  for (const s of [-1, 1]) {
    m.face([S(s, REAR, RIDGE), S(s, PANEL, RIDGE), S(s, PANEL, BASE), S(s, REAR, BASE)], HULL, inside);
    m.face([S(s, PANEL, RIDGE), S(s, front(RIDGE), RIDGE), S(s, front(GLASS_K), GLASS_K), S(s, PANEL, GLASS_K)], HULL, inside);
    overlay(m, [S(s, PANEL + 0.004, RIDGE - 0.008), S(s, PANEL + 0.058, GLASS_K + 0.004), S(s, PANEL + 0.004, GLASS_K + 0.004)], GLASS([0, 0], [1, 1], [0, 1]), inside);
    m.face([S(s, PANEL, GLASS_K), S(s, front(GLASS_K), GLASS_K), S(s, front(BAND), BAND), S(s, PANEL, BAND)], WHITE, inside);
    m.face([S(s, PANEL, BAND), S(s, front(BAND), BAND), S(s, front(BASE), BASE), S(s, PANEL, BASE)], HULL, inside);
    for (let i = 0; i < 3; i++) {
      const f = PANEL + 0.012 + i * 0.045;
      overlay(m, [S(s, f, GLASS_K - 0.004), S(s, f + 0.034, GLASS_K - 0.004), S(s, f + 0.034, BAND + 0.006), S(s, f, BAND + 0.006)], PANE, inside);
    }
    // The logo in its square, and worn red marks along the top of the panel.
    overlay(m, [S(s, 0.06, 0.505), S(s, 0.125, 0.505), S(s, 0.125, 0.44), S(s, 0.06, 0.44)], WHITE, inside);
    overlay(m, [S(s, 0.072, 0.494), S(s, 0.113, 0.494), S(s, 0.113, 0.452), S(s, 0.072, 0.452)], RED, inside, 0.03);
    overlay(m, [S(s, 0.135, 0.49), S(s, 0.235, 0.49), S(s, 0.235, 0.47), S(s, 0.135, 0.47)], RED, inside);
  }
  m.face([F(0, RIDGE), F(1, GLASS_K), F(-1, GLASS_K)], GLASS([0.5, 0], [1, 1], [0, 1]), inside);
  m.face([F(-1, GLASS_K), F(1, GLASS_K), F(1, BAND), F(-1, BAND)], WHITE, inside);
  m.face([F(-1, BAND), F(1, BAND), F(1, BASE), F(-1, BASE)], HULL, inside);
  for (let i = 0; i < 5; i++) {
    const u = -0.86 + i * 0.35;
    overlay(m, [F(u, GLASS_K - 0.004), F(u + 0.27, GLASS_K - 0.004), F(u + 0.27, BAND + 0.006), F(u, BAND + 0.006)], PANE, inside);
  }
  // (The glass's frame: down its middle and along its sides.)
  const bar = (w, k) => [w * H, (front(k) - 0.22) * H, k * H];
  overlay(m, [bar(-0.005, RIDGE - 0.01), bar(0.005, RIDGE - 0.01), bar(0.005, GLASS_K), bar(-0.005, GLASS_K)], EDGE, inside);
  for (const s of [-1, 1]) overlay(m, [F(0, RIDGE), F(s, GLASS_K), F(s * 0.82, GLASS_K), F(0, RIDGE - 0.03)], EDGE, inside);

  // The upper airfoil, out of the ridge to the top: its trailing edge
  // upright at f = 0, its leading edge swept from the cockpit's top back
  // to the tip.
  const T = 0.006 * H;
  const lead = (k) => 0.16 + ((1 - k) / (1 - RIDGE)) * (NOSE[0] - 0.16);
  plate(m, [P(0, 0, RIDGE), P(0, NOSE[0], RIDGE), P(0, lead(1), 1), P(0, 0, 1)], [1, 0, 0], T, HULL, EDGE);
  for (const s of [-1, 1]) {
    const at = (f, k) => [s * (T + 0.01), (f - 0.22) * H, k * H];
    const middle = [0, -0.07 * H, 0.9 * H];
    m.face([at(0, 0.876), at(lead(0.876), 0.876), at(lead(0.934), 0.934), at(0, 0.934)], RED, middle);
    const out = (h) => (s > 0 ? T : -T - h);
    for (const f of [0.132, 0.178]) {
      m.cylinder([out(0.008 * H), (f - 0.22) * H, 0.785 * H], 0.02 * H, 0.008 * H, { axis: 'x', segments: 10, ...EDGE });
      m.cylinder([out(0.013 * H), (f - 0.22) * H, 0.785 * H], 0.014 * H, 0.013 * H, { axis: 'x', segments: 10, ...WHITE });
    }
    for (const [k0, k1] of [[0.56, 0.63], [0.65, 0.74]]) {
      const x0 = out(0.012 * H);
      m.box([x0, -0.21 * H, k0 * H], [x0 + 0.012 * H, -0.15 * H, k1 * H], { ...HULL, side: () => EDGE });
    }
  }
  // The airspeed sensor along the ridge, past both ends.
  const ZS = 0.533 * H;
  m.cylinder([0, (-0.03 - 0.22) * H, ZS], 0.011 * H, 0.26 * H, { axis: 'y', segments: 6, ...WHITE });
  m.cylinder([0, (0.23 - 0.22) * H, ZS], 0.015 * H, 0.04 * H, { axis: 'y', segments: 6, ...EDGE });
  m.cylinder([0, (0.27 - 0.22) * H, ZS], 0.006 * H, 0.12 * H, { axis: 'y', segments: 6, ...WHITE });
  m.cylinder([0, (-0.037 - 0.22) * H, ZS], 0.007 * H, 0.007 * H, { axis: 'y', segments: 6, ...DARK });

  // Under the body: the deck the lower airfoils hang from, the machinery
  // under it, two small cannons forward, the heavy cannon on its strut.
  m.box(P(-0.135, 0.03, 0.268), P(0.135, 0.43, BASE), { ...HULL, side: () => EDGE });
  m.box(P(-0.1, 0.1, 0.205), P(0.1, 0.44, 0.268), { ...DARK, side: () => GUTS, top: false });
  m.box(P(-0.07, 0.44, 0.215), P(0.07, 0.445, 0.262), { ...DARK, side: () => GUTS, top: { tex: 'vent-grille' } });
  for (const s of [-1, 1]) {
    m.cylinder(P(s * 0.085, 0.4, 0.24), 0.016 * H, 0.06 * H, { axis: 'y', segments: 6, ...DARK });
    m.cylinder(P(s * 0.085, 0.46, 0.24), 0.007 * H, 0.05 * H, { axis: 'y', segments: 6, ...WHITE });
  }
  m.box(P(-0.015, 0.27, 0.17), P(0.015, 0.3, 0.2), DARK);
  m.cylinder(P(0, 0.25, 0.125), 0.05 * H, 0.09 * H, { axis: 'y', segments: 8, ...EDGE, sides: GUTS });
  m.cylinder(P(0, 0.34, 0.125), 0.011 * H, 0.3 * H, { axis: 'y', segments: 6, ...WHITE });
  m.cylinder(P(0, 0.47, 0.125), 0.021 * H, 0.008 * H, { axis: 'y', segments: 10, ...EDGE });
  m.cylinder(P(0, 0.62, 0.125), 0.016 * H, 0.025 * H, { axis: 'y', segments: 6, ...DARK });
  // The ion engine, pale, on the body's back.
  m.cylinder(P(0, 0.022, 0.365), 0.036 * H, 0.018 * H, { axis: 'y', segments: 10, ...WHITE, top: false });

  // The lower airfoils: from the deck's edges under the body's back half,
  // down and out to the floor, the foot's leading corner cut; two hinge
  // blocks on each, and a pad under its foot.
  const [ROOT, FOOT] = [[0.135, 0.272], [0.48, 0.012]];
  const [dx, dz] = [FOOT[0] - ROOT[0], ROOT[1] - FOOT[1]];
  const len = Math.hypot(dx, dz);
  for (const s of [-1, 1]) {
    const n = [(s * dz) / len, 0, dx / len];
    const on = (q, f) => P(s * (ROOT[0] + q * dx), f, ROOT[1] - q * dz);
    plate(m, [on(0, 0.029), on(0, 0.24), on(0.86, 0.225), on(1, 0.18), on(1, 0.029)], n, 0.05, HULL, EDGE);
    for (const t of [0.25, 0.42]) {
      const lift = 0.05 + 0.006 * H;
      const along = (q, f) => [s * (ROOT[0] + q * dx) * H + n[0] * lift, (f - 0.22) * H, (ROOT[1] - q * dz) * H + n[2] * lift];
      plate(m, [along(t - 0.04, 0.06), along(t - 0.04, 0.1), along(t + 0.04, 0.1), along(t + 0.04, 0.06)], n, 0.006 * H, EDGE, DARK);
    }
    const x = s * FOOT[0] * H;
    m.box([x - 0.3, (0.02 - 0.22) * H, 0], [x + 0.3, (0.235 - 0.22) * H, 0.12], DARK);
  }
  // Its shadow on the floor.
  m.face([P(-0.2, 0.45, 0.001), P(0.2, 0.45, 0.001), P(0.2, 0, 0.001), P(-0.2, 0, 0.001)], { tex: 'speeder-shadow', uv: [[0, 0], [1, 0], [1, 1], [0, 1]] }, [0, 0, -1]);

  // Collision: each lower airfoil from where it's head high out to its
  // foot (you can walk in under the body), round the machinery under the
  // body, and along the heavy cannon.
  const head = ROOT[0] + ((ROOT[1] - 1.75 / H) / dz) * dx;
  for (const s of [-1, 1]) {
    const [a, b] = [s * head * H, s * (FOOT[0] * H + 0.3)];
    m.outlineLines([[a, (0.029 - 0.22) * H], [b, (0.02 - 0.22) * H], [b, (0.235 - 0.22) * H], [a, (0.24 - 0.22) * H]]);
  }
  m.outlineLines([[-0.1 * H, (0.1 - 0.22) * H], [0.1 * H, (0.1 - 0.22) * H], [0.1 * H, (0.42 - 0.22) * H], [-0.1 * H, (0.42 - 0.22) * H]]);
  m.line(0, (0.42 - 0.22) * H, 0, (0.645 - 0.22) * H);
  return m.build();
}

export const FARM_MODELS = [...PIPE_RUNS.map((l) => `water-pipe-${l}`), ...PIPE_RISES.map((h) => `water-pipe-up-${h}`), 'water-pipe-joint', 'floor-hatch', 'garage-ring', 'garage-kerb', 'garage-frame-4'];

export default [...PIPE_RUNS.map(run), ...PIPE_RISES.map(rise), joint(), pump(), hatch(), garageRing(), garageKerb(), garageConsole(), openingFrame(4, 3.5), skyhopper(), ...COUNTER.lengths.map(counter), appliances()];
