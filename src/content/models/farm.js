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
 * The garage's round wall: radius `r`, `h` tall from the floor, a gap
 * `gap` either side of south (+y) for its opening. `segments` straight
 * panels round the whole circle; `band` the dark band of lamps under the
 * ceiling; `globes` the wall lamps' places (degrees, 0 east, counter-clockwise).
 */
export const GARAGE_RING = { r: 7, h: 4.25, gap: 2, segments: 36, band: 0.6, globes: [62, 118] };

/**
 * The garage's wall (after the film's): plaster panels on the inside of a
 * circle round the origin, facing in, the dark band along their top with
 * two round amber lamps in each panel, and a lamp on a bracket either side
 * of the console. It collides along its panels, so the stepped tiles behind
 * it are never reached; the opening onto the pit is left clear.
 */
function garageRing() {
  const m = new ModelBuilder('garage-ring');
  const { r, h, gap, segments, band, globes } = GARAGE_RING;
  const TAU = Math.PI * 2;
  const half = Math.asin(gap / r);
  // In the model's axes (x east, y south): south is a quarter turn round.
  const from = Math.PI / 2 + half;
  const span = TAU - 2 * half;
  const n = Math.round((segments * span) / TAU);
  const at = (t, rr = r) => [Math.cos(t) * rr, Math.sin(t) * rr];
  for (let k = 0; k < n; k++) {
    const [a, b] = [at(from + (span * k) / n), at(from + (span * (k + 1)) / n)];
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

export const FARM_MODELS = [...PIPE_RUNS.map((l) => `water-pipe-${l}`), ...PIPE_RISES.map((h) => `water-pipe-up-${h}`), 'water-pipe-joint', 'floor-hatch', 'garage-ring', 'garage-kerb', 'garage-frame-4'];

export default [...PIPE_RUNS.map(run), ...PIPE_RISES.map(rise), joint(), pump(), hatch(), garageRing(), garageKerb(), garageConsole(), openingFrame(4, 3.5)];
