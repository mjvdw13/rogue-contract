import { ModelBuilder } from './lib/build.js';
import { WATER_PIPE } from './farm.js';

// The Homestead's garden (levels/m2.js, docs/mission2.md area 1).
//
// `grow-bed-<len>`: a raised hydroponic bed, `len` long along x and
// GROW_BED.w across, its trough of rusty plate full of dark growing medium
// and rows of plants, under a frame carrying the grow lamp: a long housing
// whose underside glows a cold blue-white (no other light on the map is that
// colour). It collides as the trough, GROW_BED.top high, so shots go over.
//
// `garden-tank`: the garden's water tank, an upright tank on four legs, its
// domed top, hoops round it, a sight glass up its front showing the water,
// the outlet out of its front low down through a red-wheeled valve and into
// the floor. Its inlet rises from the dome and turns back (-y) to
// GARDEN_TANK.back behind its axis at GARDEN_TANK.inlet, where the farm's
// water pipe comes down the pit's wall into it. Built looking +y.

export const GROW_BED = { lengths: [4, 5], w: 1.1, top: 0.72, lamp: 2.3 };
export const GARDEN_TANK = { r: 0.65, top: 2.7, inlet: 3, back: 0.9 };

const PLATE = { tex: 'yard-plate-rust' };
const IRON = { color: ['gray', 0.22] };
const FLANGE = { tex: 'bay-plate' };
const PIPE = { tex: 'pipe-rust' };
const SOIL = { color: [52, 38, 28] };
/** The plants' leaves: dark to pale green, picked by a fixed pattern so every bed differs a little. */
const LEAVES = [['toxic', 0.45], ['toxic', 0.7], ['olive', 0.55], ['toxic', 0.6]];
/** The grow lamp's cold light. */
const COLD = { color: [196, 222, 255], glow: true };

function growBed(len) {
  const m = new ModelBuilder(`grow-bed-${len}`);
  const a = len / 2;
  const b = GROW_BED.w / 2;
  const { top, lamp } = GROW_BED;
  // The trough: plate sides on a dark foot, a lip round the top, the medium inside.
  m.box([-a + 0.05, -b + 0.05, 0], [a - 0.05, b - 0.05, 0.1], { color: [40, 36, 30], bottom: false });
  m.box([-a, -b, 0.1], [a, b, top], { ...PLATE, top: SOIL, bottom: false });
  m.box([-a - 0.03, -b - 0.03, top - 0.06], [a + 0.03, b + 0.03, top], { ...FLANGE, top: false, bottom: false });
  // Two rows of plants, each three leaves fanning out and up from its
  // stem, some plants taller and wider than others.
  let k = 0;
  for (let x = -a + 0.3; x < a - 0.2; x += 0.42) {
    for (const y of [-b / 2, b / 2]) {
      const h = 0.2 + (0.18 * ((k * 7) % 5)) / 4;
      const reach = 0.16 + 0.05 * (k % 3);
      const px = x + (y > 0 ? 0.14 : 0);
      for (let l = 0; l < 3; l++) {
        const t = k * 1.3 + (l * Math.PI * 2) / 3;
        const [ux, uy] = [Math.cos(t), Math.sin(t)];
        const tip = [px + ux * reach, y + uy * reach, top + h];
        const mid = (s) => [px + ux * reach * 0.45 - uy * s, y + uy * reach * 0.45 + ux * s, top + h * 0.55];
        m.face([[px, y, top], mid(0.07), tip, mid(-0.07)], { color: LEAVES[(k + l) % LEAVES.length], twoSided: true });
      }
      k++;
    }
  }
  // The lamp's frame: a post at each end, the housing along the top.
  for (const x of [-a + 0.05, a - 0.11]) m.box([x, -0.03, top], [x + 0.06, 0.03, lamp], IRON);
  m.box([-a + 0.05, -0.18, lamp], [a - 0.05, 0.18, lamp + 0.1], { tex: 'metal-grey', bottom: false });
  m.box([-a + 0.15, -0.13, lamp - 0.02], [a - 0.15, 0.13, lamp], { ...COLD, top: false });
  // Its cable up out of the housing.
  m.box([-0.02, -0.02, lamp + 0.1], [0.02, 0.02, lamp + 0.8], { color: [30, 28, 26] });
  m.outlineLines([[-a, -b], [a, -b], [a, b], [-a, b]]);
  return m.build();
}

function gardenTank() {
  const m = new ModelBuilder('garden-tank');
  const { r, top, inlet, back } = GARDEN_TANK;
  const foot = 0.3;
  for (const [x, y] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) m.box([x * r * 0.6 - 0.05, y * r * 0.6 - 0.05, 0], [x * r * 0.6 + 0.05, y * r * 0.6 + 0.05, foot + 0.05], IRON);
  m.cylinder([0, 0, foot], r, top - foot - 0.35, { segments: 12, tex: 'drum-grey' });
  // The domed top: two tapering rings.
  m.loft(ring(r, 12), top - 0.35, ring(r * 0.75, 12), top - 0.12, { tex: 'drum-grey', bottom: false, top: false });
  m.loft(ring(r * 0.75, 12), top - 0.12, ring(r * 0.3, 12), top, { tex: 'drum-grey', bottom: false });
  for (const z of [foot + 0.15, 1.2, top - 0.5]) m.cylinder([0, 0, z], r + 0.03, 0.07, { segments: 12, ...FLANGE, bottom: false });
  // The sight glass up its front: the water dark green low down, empty glass over it.
  m.box([-0.07, r - 0.02, foot + 0.3], [0.07, r + 0.04, 1.05], { color: [44, 70, 62], bottom: false });
  m.box([-0.07, r - 0.02, 1.05], [0.07, r + 0.04, top - 0.6], { color: [150, 164, 160], bottom: false });
  // The outlet: out of its front low down, a valve, down into the floor.
  m.cylinder([0.32, r - 0.12, 0.45], 0.08, 0.4, { axis: 'y', segments: 8, ...PIPE, bottom: false });
  m.cylinder([0.32, r + 0.24, 0], 0.08, 0.53, { segments: 8, ...PIPE, top: false, bottom: false });
  m.box([0.2, r + 0.12, 0.33], [0.44, r + 0.36, 0.57], FLANGE);
  m.cylinder([0.32, r + 0.36, 0.45], 0.15, 0.04, { axis: 'y', segments: 8, color: [150, 34, 24] });
  // The inlet: up out of the dome, round a joint and back to the wall.
  const p = WATER_PIPE.r;
  m.cylinder([0, 0, top - 0.05], p, inlet - top + 0.05, { segments: 8, ...PIPE, bottom: false, top: false });
  m.cylinder([0, -back, inlet], p, back, { axis: 'y', segments: 8, ...PIPE, top: false, bottom: false });
  const j = p + 0.07;
  m.box([-j, -j, inlet - j], [j, j, inlet + j], FLANGE);
  m.outlineLines(ring(r, 8));
  return m.build();
}

/** A ring of `n` points round the origin. */
function ring(r, n) {
  return Array.from({ length: n }, (_, i) => [Math.cos((i / n) * Math.PI * 2) * r, Math.sin((i / n) * Math.PI * 2) * r]);
}

export const GARDEN_MODELS = [...GROW_BED.lengths.map((l) => `grow-bed-${l}`), 'garden-tank'];

export default [...GROW_BED.lengths.map(growBed), gardenTank()];
