import { ModelBuilder } from './lib/build.js';
import { rod } from './junk-pile.js';

// `furnace`: the Jawas' smelter in the junk yard's court (levels/m1.js),
// against the foot of the east heap (Mark, 2026-10-31: not a brick kiln
// with a chimney, a Star Wars vessel). A round-bellied tank on four struts,
// domed, its plates' seams banded; a round port in its south side glowing
// behind a dark collar; a spout under it over a crucible of melt. Exhaust
// vents on the dome, a chute from the heap into its top at the back, and
// hoses to a power unit at its east side. The origin on the floor under the
// tank's middle; at angle 0 the port faces south. The dome's top at 3.6.
export const FURNACE = {
  /** The tank's top. */
  top: 3.6,
};

const PLATE = { tex: 'pod-hull', texScale: 0.5 };
const DARK = { tex: 'metal-grey', texScale: 0.5 };
const RUST = { tex: 'metal-rust' };
const HOSE = { tex: 'pump-hose' };
// (No texture: as a cylinder's or loft's end, over a textured style.)
const HOLE = { tex: null, color: [20, 16, 12] };
const GLOW = { tex: null, color: [255, 150, 50], glow: true };

/** A ring of `n` points of radius `r` (x, y), turned half a step. */
const ring = (n, r) => Array.from({ length: n }, (_, i) => [Math.cos(((i + 0.5) / n) * Math.PI * 2) * r, Math.sin(((i + 0.5) / n) * Math.PI * 2) * r]);

function furnace() {
  const m = new ModelBuilder('furnace');
  const N = 12;
  // The tank, ring by ring from the spout up to the dome's top.
  const tiers = [[0.6, 0.3], [0.9, 0.95], [1.3, 1.3], [2.2, 1.4], [2.9, 1.2], [3.35, 0.8], [FURNACE.top, 0.35]];
  for (let i = 0; i + 1 < tiers.length; i++) {
    const [[z0, r0], [z1, r1]] = [tiers[i], tiers[i + 1]];
    m.loft(ring(N, r0), z0, ring(N, r1), z1, { ...(i >= 4 ? RUST : PLATE), bottom: i === 0 ? HOLE : false, top: i === tiers.length - 2 ? DARK : false });
  }
  // Bands round the seams.
  for (const [z, r] of [[1.3, 1.3], [2.2, 1.4], [2.9, 1.2]]) m.loft(ring(N, r + 0.06), z - 0.06, ring(N, r + 0.06), z + 0.06, { ...DARK, top: false, bottom: false });
  // The struts, from under the belly out to their feet.
  for (let k = 0; k < 4; k++) {
    const a = (k + 0.5) * (Math.PI / 2);
    const [c, s] = [Math.cos(a), Math.sin(a)];
    rod(m, [c * 1.05, s * 1.05, 1.2], [c * 1.6, s * 1.6, 0.15], 0.09, 4, DARK);
    m.box([c * 1.6 - 0.2, s * 1.6 - 0.2, 0], [c * 1.6 + 0.2, s * 1.6 + 0.2, 0.15], DARK);
  }
  // The port: a dark collar standing out of the belly, the glow inset in it.
  m.cylinder([0, 1.2, 1.75], 0.6, 0.35, { axis: 'y', segments: 10, ...DARK, top: HOLE, bottom: false });
  m.cylinder([0, 1.55, 1.75], 0.42, 0.03, { axis: 'y', segments: 10, ...DARK, top: GLOW, bottom: false });
  // The crucible under the spout, its melt glowing.
  m.cylinder([0, 0, 0], 0.5, 0.35, { segments: 8, ...RUST, top: GLOW, bottom: false });
  // Exhaust vents round the dome, and a wider one on its top.
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2 + Math.PI / 2;
    m.cylinder([Math.cos(a) * 0.75, Math.sin(a) * 0.75, 3.1], 0.12, 0.45, { segments: 6, ...DARK, top: HOLE, bottom: false });
  }
  m.cylinder([0, 0, FURNACE.top], 0.25, 0.25, { segments: 8, ...DARK, top: HOLE, bottom: false });
  // The chute from the heap behind into the dome's back.
  rod(m, [0, -0.7, 3.2], [0, -2.1, 4.2], 0.28, 6, RUST);
  // The power unit at its east side, a lamp lit on it, and the hoses to the tank.
  m.box([1.75, -0.45, 0], [2.45, 0.45, 1.5], { ...DARK, top: RUST });
  m.box([2.45, 0.1, 1.1], [2.48, 0.3, 1.25], { color: [90, 255, 90], glow: true, bottom: false, top: false });
  for (const [y, z] of [[-0.25, 1.4], [0.25, 1.4], [0, 0.9]]) rod(m, [1.8, y, z], [1.2, y, z + 0.4], 0.07, 5, HOSE);
  m.outlineLines([[-1.5, -1.5], [1.5, -1.5], [1.5, 1.6], [-1.5, 1.6]]);
  m.outlineLines([[1.5, -0.45], [2.45, -0.45], [2.45, 0.45], [1.5, 0.45]]);
  return m.build();
}

export default [furnace()];
