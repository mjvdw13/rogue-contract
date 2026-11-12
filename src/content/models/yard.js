import { ModelBuilder } from './lib/build.js';

// The Homestead's work yard (levels/m2.js, docs/mission2.md area 5).
//
// `farm-generator`: the farm's power generator in the shed, along x: a long
// drum on a steel skid with cooling rings round it, the control end (+x)
// with its gauges (one lamp dead), the exhaust stack up from its back end
// to the roof. GENERATOR.half each way along x, GENERATOR.r round, its stack
// GENERATOR.stack high. Collides as its skid's outline.
//
// `imp-lock`: the Imperials' lock, clamped to the farm's gate jamb on the
// yard's side: a dark plated box on two clamp bars, a red stripe, a card
// slot and a red lamp, its cable along the wall to the gate (IMP_LOCK.cable
// along -x). Its back to the wall at y = 0, out along +y, its foot at z 0
// (place it IMP_LOCK.z up). Not solid.
//
// `comm-unit`: the staging point's field comm unit, set on a crate: a
// plated case with a lit screen and buttons, a whip antenna and a small
// dish. Not solid (the crate under it is).
//
// The lane and the great dome's (area 7a):
//
// `wall-globe`, `wall-globe-dead`: a lamp on the wall by the house's door,
// a bracket and an amber globe (the dead one shot out, dark). Its back to
// the wall at y = 0, out along +y; place it at the globe's height.
//
// `door-fallen`: the house's plank door, blown in off its runners, lying
// flat on the floor: DOOR_FALLEN.w across x, DOOR_FALLEN.l along y (its
// round top at +y), DOOR_FALLEN.t thick. Not solid.
export const DOOR_FALLEN = { w: 3, l: 4, t: 0.12 };
export const GENERATOR = { half: 1.8, r: 0.75, skid: 0.25, stack: 4 };
export const IMP_LOCK = { z: 1, half: 0.45, h: 1.2, deep: 0.32, cable: 1.4 };
export const COMM_UNIT = { half: 0.4, depth: 0.32, h: 0.38 };

const GREY = { tex: 'metal-grey' };
const RUST = { tex: 'metal-rust' };
const DRUM = { tex: 'drum-grey' };
const DARK = { color: ['gray', 0.16] };
const PANEL = { tex: 'imp-panel-dark' };

function generator() {
  const m = new ModelBuilder('farm-generator');
  const { half: L, r, skid: S, stack } = GENERATOR;
  // The skid: two rails and the deck.
  for (const y of [-r + 0.1, r - 0.25]) m.box([-L - 0.1, y, 0], [L + 0.1, y + 0.15, S * 0.6], RUST);
  m.box([-L, -r, S * 0.6], [L, r, S], RUST);
  // The drum, its cooling rings and its end caps.
  const z = S + r;
  m.cylinder([-L + 0.3, 0, z], r, 2 * L - 1.1, { segments: 12, axis: 'x', ...DRUM, top: false, bottom: GREY });
  for (let k = 0; k < 5; k++) m.cylinder([-L + 0.6 + k * 0.45, 0, z], r + 0.08, 0.1, { segments: 12, axis: 'x', ...RUST, top: false, bottom: false });
  // The control end: a box with gauges and lamps on its face (+x).
  const x0 = L - 0.8;
  m.box([x0, -r + 0.05, S], [L, r - 0.05, S + 1.55], { ...GREY, top: RUST });
  for (const [y, zz] of [[-0.3, S + 1.15], [0.05, S + 1.15], [0.38, S + 1.15]]) {
    m.cylinder([L, y, zz], 0.12, 0.03, { segments: 8, axis: 'x', color: [214, 206, 180], bottom: false });
    m.box([L + 0.03, y - 0.01, zz - 0.02], [L + 0.035, y + 0.01, zz + 0.09], DARK);
  }
  for (const [y, c] of [[-0.35, [70, 230, 60]], [-0.2, [255, 176, 0]], [-0.05, null], [0.1, [70, 230, 60]]]) {
    m.box([L, y - 0.04, S + 0.75], [L + 0.03, y + 0.04, S + 0.83], c ? { color: c, glow: true } : DARK);
  }
  m.box([L, 0.2, S + 0.55], [L + 0.05, 0.5, S + 0.9], PANEL);
  // The back end: the exhaust stack up to the roof, a collar where it
  // leaves the drum; a cable out of the drum's side to the wall.
  m.cylinder([-L + 0.15, 0, S], 0.32, 2 * r, { segments: 8, ...RUST, bottom: false });
  m.cylinder([-L + 0.15, 0, S + 2 * r], 0.16, stack - S - 2 * r, { segments: 8, ...RUST, bottom: false });
  m.cylinder([-L + 0.15, 0, S + 2 * r], 0.22, 0.12, { segments: 8, ...GREY });
  m.box([-0.2, -r - 0.06, S + 0.2], [0.2, -r + 0.02, S + 0.55], DARK);
  m.outlineLines([[-L - 0.1, -r], [L + 0.1, -r], [L + 0.1, r], [-L - 0.1, r]]);
  return m.build();
}

function impLock() {
  const m = new ModelBuilder('imp-lock');
  const { half: w, h, deep: d } = IMP_LOCK;
  // Two clamp bars bolted across the jamb, the box on them.
  for (const z of [0.12, h - 0.2]) m.box([-w - 0.12, 0, z], [w + 0.12, 0.06, z + 0.08], DARK);
  m.box([-w, 0.06, 0], [w, d, h], PANEL);
  // A red stripe across it, the card slot, the red lamp over it.
  m.box([-w, d, h - 0.3], [w, d + 0.01, h - 0.24], { color: [170, 30, 26] });
  m.box([-0.12, d, 0.3], [0.12, d + 0.02, 0.36], DARK);
  m.box([-0.06, d, 0.5], [0.06, d + 0.04, 0.6], { color: [255, 40, 30], glow: true });
  // The cable out of its side along the wall to the gate.
  m.box([-w - IMP_LOCK.cable, 0, 0.42], [-w, 0.05, 0.48], DARK);
  return m.build();
}

function commUnit() {
  const m = new ModelBuilder('comm-unit');
  const { half: w, depth: d, h } = COMM_UNIT;
  m.box([-w, -d / 2, 0], [w, d / 2, h], PANEL);
  // The lid up behind, its screen lit; buttons along the front.
  m.box([-w + 0.04, -d / 2 - 0.03, h], [w - 0.04, -d / 2 + 0.01, h + 0.32], PANEL);
  m.box([-w + 0.1, -d / 2 + 0.01, h + 0.06], [w - 0.1, -d / 2 + 0.015, h + 0.27], { color: [60, 200, 120], glow: true });
  for (let k = 0; k < 5; k++) {
    const x = -w + 0.12 + k * 0.13;
    m.box([x, -d / 2 + 0.06, h], [x + 0.07, -d / 2 + 0.12, h + 0.02], k === 2 ? { color: [255, 40, 30], glow: true } : { color: [176, 140, 52] });
  }
  // The whip antenna and the dish.
  m.box([w - 0.08, d / 2 - 0.08, h], [w - 0.05, d / 2 - 0.05, h + 1.1], DARK);
  m.cylinder([-w + 0.15, d / 2 - 0.12, h], 0.03, 0.2, { segments: 6, ...DARK });
  m.cylinder([-w + 0.15, d / 2 - 0.12, h + 0.2], 0.16, 0.04, { segments: 10, axis: 'y', ...GREY });
  return m.build();
}

function wallGlobe(id, lit) {
  const m = new ModelBuilder(id);
  const amber = { color: lit ? [150, 96, 40] : [64, 48, 34] };
  m.box([-0.04, 0, -0.06], [0.04, 0.3, 0.02], DARK);
  m.cylinder([0, 0.36, -0.18], 0.15, 0.3, { segments: 8, ...amber, top: lit ? { color: [255, 210, 140], glow: true } : { color: [60, 44, 30] }, bottom: amber });
  return m.build();
}

function doorFallen() {
  const m = new ModelBuilder('door-fallen');
  const { w, l, t } = DOOR_FALLEN;
  // The planks, edge on; its face up, the door's picture over it (its
  // round top's corners see-through).
  m.box([-w / 2 + 0.08, -l / 2, 0], [w / 2 - 0.08, l / 2 - 0.5, t - 0.01], { tex: 'planks', top: false });
  m.face([[-w / 2, -l / 2, t], [w / 2, -l / 2, t], [w / 2, l / 2, t], [-w / 2, l / 2, t]], { tex: 'door-planks', uv: [[0, 1], [1, 1], [1, 0], [0, 0]] }, [0, 0, 0]);
  return m.build();
}

export default [generator(), impLock(), commUnit(), wallGlobe('wall-globe', true), wallGlobe('wall-globe-dead', false), doorFallen()];
