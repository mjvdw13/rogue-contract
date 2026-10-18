import { ModelBuilder } from './lib/build.js';

// Pipes and boxes on Mos Eisley's walls (lib/town.js, pipe() and
// fixture()). All built looking south (+y), the wall's face along y = 0
// and the origin on it; the kit turns them to face their wall.

const PIPE = ['rust', 0.32];
const IRON = ['gray', 0.22];

/** Downpipe heights: a wall's height, whole tiles. */
export const PIPE_HEIGHTS = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
/** Conduit lengths along a wall, whole tiles. */
export const CONDUIT_LENGTHS = [2, 3, 4, 6, 8, 10, 12];

/**
 * A downpipe from a wall's top to the street: a gutter head under the
 * roofline, a pipe bending out from the wall into it, clamped to the wall
 * every 1.5 or so, and a shoe at its foot.
 */
function downpipe(h) {
  const m = new ModelBuilder(`pipe-${h}`);
  const y = 0.17;
  const r = 0.07;
  m.box([-0.16, 0, h - 0.4], [0.16, 0.32, h - 0.1], { color: PIPE, top: false });
  m.cylinder([0, y, 0.3], r, h - 0.7, { segments: 6, color: PIPE, top: false, bottom: false });
  m.box([-0.09, 0.08, 0], [0.09, 0.4, 0.3], { color: PIPE, bottom: false });
  const clamps = Math.max(1, Math.round((h - 1) / 1.5));
  for (let k = 1; k <= clamps; k++) {
    const z = 0.3 + ((h - 0.7) * k) / (clamps + 1);
    m.box([-0.1, 0, z], [0.1, y + r + 0.02, z + 0.06], { color: IRON, bottom: false });
  }
  return m.build();
}

/** A conduit run along a wall, `len` long and centred on the origin, clipped every tile. */
function conduit(len) {
  const m = new ModelBuilder(`conduit-${len}`);
  m.cylinder([-len / 2, 0.08, 0], 0.045, len, { axis: 'x', segments: 6, color: IRON });
  for (let x = -len / 2 + 0.5; x < len / 2; x += 1) m.box([x - 0.04, 0, -0.07], [x + 0.04, 0.14, 0.07], { color: ['gray', 0.12], bottom: false });
  return m.build();
}

/** A water tank on two brackets, lying along the wall, a pipe from it down into the wall. */
function tank() {
  const m = new ModelBuilder('wall-tank');
  const r = 0.42;
  const y = 0.12 + r;
  m.cylinder([-0.9, y, r], r, 1.8, { axis: 'x', segments: 10, tex: 'metal-grey', top: { color: ['gray', 0.45] }, bottom: { color: ['gray', 0.45] } });
  for (const x of [-0.55, 0.55]) {
    m.cylinder([x - 0.04, y, r], r + 0.02, 0.08, { axis: 'x', segments: 10, color: ['rust', 0.3], top: false, bottom: false });
    m.box([x - 0.05, 0, 0], [x + 0.05, y + 0.1, 0.06], { color: IRON });
  }
  m.cylinder([0.95, y, r], 0.05, 0.2, { axis: 'x', segments: 6, color: PIPE });
  m.box([1.1, 0, r - 0.05], [1.2, y, r + 0.05], { color: PIPE });
  return m.build();
}

/** A box unit (a cooler, a pump): a metal case on brackets, slats on its front and a duct up into the wall. */
function unit() {
  const m = new ModelBuilder('wall-unit');
  m.box([-0.6, 0.02, 0.1], [0.6, 0.5, 0.9], { tex: 'metal-grey', side: (i) => (i === 2 ? { tex: 'vent-slats', texOffset: [0.4, 0.2] } : undefined) });
  for (const x of [-0.45, 0.45]) m.box([x - 0.04, 0, 0], [x + 0.04, 0.55, 0.1], { color: IRON, bottom: false });
  m.cylinder([0.35, 0.25, 0.9], 0.08, 0.35, { segments: 6, color: PIPE, bottom: false });
  m.box([0.25, 0, 1.15], [0.45, 0.33, 1.3], { color: PIPE });
  return m.build();
}

export const PIPE_MODELS = [...PIPE_HEIGHTS.map((h) => `pipe-${h}`), ...CONDUIT_LENGTHS.map((l) => `conduit-${l}`), 'wall-tank', 'wall-unit'];

export default [...PIPE_HEIGHTS.map(downpipe), ...CONDUIT_LENGTHS.map(conduit), tank(), unit()];
