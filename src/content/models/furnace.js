import { ModelBuilder } from './lib/build.js';
import { rod } from './junk-pile.js';

// `furnace`: the Jawas' smelter in the junk yard's court (levels/m1.js),
// against the foot of the east heap (Mark, 2026-10-31: a trough of molten
// metal, embers and flames coming off it). An open vat of rusty plate,
// wider at its rim, on a heater with glowing slots, full of melt (`melt`,
// drawn glowing) with scrap half sunk in it. A spout at its east end runs
// a trickle down into a mould of ingots on the ground; a chute comes down
// from the heap behind; hoses run from a power unit at its west end to the
// heater. Its embers, flames, sparks and smoke are the decoration's `emit`
// (decor.js, at the spots in FURNACE). The origin on the floor under the
// vat's middle; at angle 0 its long side faces south.
export const FURNACE = {
  /** The rim's top: it collides as high as that. */
  rim: 0.8,
  /** The melt's surface. */
  melt: 0.66,
  /** Half the vat's length and width at its rim. */
  half: [2.3, 1.2],
  /** The spout's lip, where the trickle falls from. */
  spout: [2.85, 0, 0.58],
};

const RUST = { tex: 'metal-rust' };
const DARK = { tex: 'metal-grey', texScale: 0.5 };
const HOSE = { tex: 'pump-hose' };
const MELT = { tex: 'melt', texScale: 2, glow: true };
// (No texture: over a textured style, as a box's top.)
const HEAT = { tex: null, color: [255, 120, 30], glow: true };
const CRUST = { tex: null, color: [70, 30, 16] };

function furnace() {
  const m = new ModelBuilder('furnace');
  const { rim: R, melt: M, half: [hx, hy] } = FURNACE;
  // The vat: tapering from its rim down to its floor, its walls seen from
  // inside too (over the melt), open at the top.
  const z0 = 0.3;
  const [bx, by] = [hx - 0.35, hy - 0.35];
  const rect = (x, y) => [[-x, -y], [x, -y], [x, y], [-x, y]];
  const at = (z) => {
    const k = (z - z0) / (R - z0);
    return [bx + (hx - bx) * k, by + (hy - by) * k];
  };
  m.loft(rect(bx, by), z0, rect(hx, hy), R, { ...RUST, twoSided: true, top: false, bottom: DARK });
  // The melt, filling it to a little under the rim.
  const [mx, my] = at(M);
  m.face(rect(mx, my).map(([x, y]) => [x, y, M]), MELT, [0, 0, 0]);
  // A thick lip round the rim.
  for (const s of [-1, 1]) {
    m.box([-hx - 0.06, s * hy - 0.08, R - 0.1], [hx + 0.06, s * hy + 0.08, R + 0.04], DARK);
    m.box([s * hx - 0.08, -hy, R - 0.1], [s * hx + 0.08, hy, R + 0.04], DARK);
  }
  // Scrap half sunk in the melt: a sheet of plate tipped up, a pipe's end.
  m.face([[-1.2, -0.5, M - 0.1], [-0.5, -0.3, M - 0.1], [-0.6, -0.1, M + 0.45], [-1.15, -0.25, M + 0.4]], { ...DARK, twoSided: true });
  rod(m, [0.7, 0.3, M - 0.1], [1.0, 0.45, M + 0.5], 0.08, 6, RUST);
  // The heater under it, its slots glowing, on four feet.
  m.box([-bx + 0.1, -by + 0.1, 0.08], [bx - 0.1, by - 0.1, z0], DARK);
  for (const s of [-1, 1]) {
    for (let x = -1.3; x <= 1.3; x += 0.65) m.face([[x - 0.18, s * (by - 0.08), 0.15], [x + 0.18, s * (by - 0.08), 0.15], [x + 0.18, s * (by - 0.08), 0.24], [x - 0.18, s * (by - 0.08), 0.24]], HEAT, [x, 0, 0.2]);
  }
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) m.box([sx * bx - 0.15, sy * by - 0.15, 0], [sx * bx + 0.15, sy * by + 0.15, z0], DARK);
  // The spout at the east end: a channel out over the rim, its melt glowing,
  // the trickle falling from its lip into the mould.
  const [sx, , sz] = FURNACE.spout;
  m.loft([[hx - 0.1, -0.18], [sx, -0.14], [sx, 0.14], [hx - 0.1, 0.18]], sz - 0.1, [[hx - 0.1, -0.18], [sx, -0.14], [sx, 0.14], [hx - 0.1, 0.18]], R, { ...DARK, top: { ...MELT, texScale: 1 } });
  m.box([sx - 0.05, -0.04, 0.2], [sx + 0.03, 0.04, sz - 0.1], { ...HEAT, top: false });
  // The mould: a tray of ingots on the ground, the one under the trickle
  // molten, the rest cooled to a crust.
  m.box([sx - 0.35, -0.55, 0], [sx + 0.95, 0.55, 0.2], { ...DARK, top: CRUST });
  for (let k = 0; k < 3; k++) {
    const y = -0.35 + k * 0.35;
    m.face([[sx - 0.25, y - 0.12, 0.21], [sx + 0.85, y - 0.12, 0.21], [sx + 0.85, y + 0.12, 0.21], [sx - 0.25, y + 0.12, 0.21]], k === 1 ? HEAT : { ...DARK, texScale: 0.25 }, [sx, y, 0]);
  }
  // The chute from the heap down over the vat's back.
  rod(m, [-0.6, -2.4, 2.8], [-0.4, -0.7, 1.45], 0.26, 6, RUST);
  // The power unit at the west end, a lamp lit on it, hoses to the heater.
  m.box([-hx - 1.05, -0.45, 0], [-hx - 0.35, 0.45, 1.4], { ...DARK, top: RUST });
  m.box([-hx - 0.36, 0.1, 1.05], [-hx - 0.33, 0.3, 1.2], { tex: null, color: [90, 255, 90], glow: true, bottom: false, top: false });
  for (const y of [-0.25, 0.25]) rod(m, [-hx - 0.4, y, 0.6], [-bx + 0.1, y, 0.28], 0.07, 5, HOSE);
  m.outlineLines([[-hx - 1.05, -hy], [sx + 0.95, -hy], [sx + 0.95, hy], [-hx - 1.05, hy]]);
  return m.build();
}

export default [furnace()];
