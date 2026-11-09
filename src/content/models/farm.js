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

export const FARM_MODELS = [...PIPE_RUNS.map((l) => `water-pipe-${l}`), ...PIPE_RISES.map((h) => `water-pipe-up-${h}`), 'water-pipe-joint', 'floor-hatch'];

export default [...PIPE_RUNS.map(run), ...PIPE_RISES.map(rise), joint(), pump(), hatch()];
