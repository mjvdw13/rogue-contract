import { ModelBuilder } from './lib/build.js';
import { engine, buildSpeeder } from './speeder.js';

// The speeder garage in J (levels/m1.js) and its back yard.
//
// `speeder-engine`: one of an X-34's side engines, pulled out of the speeder
// in the garage and laid on two rusty trestles in the yard to be worked on.
// The same engine as the landspeeder's (models/speeder.js), its intake
// toward +x, at about waist height. ENGINE.top is how tall it stands; it
// collides as a cylinder ENGINE.r round.
//
// `landspeeder-blocks`: the speeder it came out of, set down on blocks
// (models/speeder.js).
//
// `swoop-hoist`: a swoop (a racing bike: a big engine in front, the rider's
// seat behind it, SWOOP.len long) hung by chains from a hoist on a rusty gantry, two A
// frames and a beam along x, HOIST.half each side. It collides as the
// gantry's feet, a box round them.
//
// `workbench`: a steel bench with a shelf under it, a vice and tools on it,
// and a board of tools on the wall over it. Built looking south, its back on
// y 0; it collides as its top, BENCH.half each side, BENCH.depth deep.
//
// `pit-droid`: a pit droid, a thin droid on backward knees under a big flat
// cap, its one eye under the cap's front, a spanner in its hands. Facing +x.
//
// `shutter-rolled`: a garage door's shutter rolled up: its bottom slat
// showing under the lintel, SHUTTER.width wide, and the roller's box over
// the opening inside. Built looking south, its face on y 0 (the wall's
// edge), the box SHUTTER.deep in (the wall's thickness); set it at the
// lintel's height.
export const ENGINE = { z: 0.85, r: 0.62, top: 1.06 };
export const HOIST = { half: 1.75, feet: 0.95, top: 3.4 };
export const SWOOP = { len: 3.1 };
export const BENCH = { half: 1.2, depth: 0.8, top: 0.94 };
export const PIT_DROID = { r: 0.3, top: 1 };
export const SHUTTER = { width: 3, deep: 2 };

const IRON = { tex: 'pipe-rust', texScale: 0.25 };
const RUST = { tex: 'metal-rust', texScale: 0.5 };
const STEEL = { tex: 'metal-grey', texScale: 0.5 };
const DARK = { color: [34, 30, 28] };
const CHAIN = { color: [58, 52, 46] };
const RED = { tex: 'speeder-red' };
const METAL = { tex: 'speeder-metal' };
const PEACH = { tex: 'speeder-paint' };

/** A square of half-width h round (cx, cy). */
const sq = (cx, cy, h) => [[cx - h, cy - h], [cx + h, cy - h], [cx + h, cy + h], [cx - h, cy + h]];
/** A strut of half-width h from a (x, y, z) to b: square in plan, lofted. */
const strut = (m, [ax, ay, az], [bx, by, bz], h, style) => m.loft(sq(ax, ay, h), az, sq(bx, by, h), bz, { ...style, top: false, bottom: false });

function speederEngine() {
  const m = new ModelBuilder('speeder-engine');
  engine(m, 0.5, 0, ENGINE.z);
  // The trestles: a saddle under the engine on two legs splayed out each
  // side, one under the cowl and one under the exhaust.
  const top = ENGINE.z - 0.2;
  for (const x of [0.28, -0.42]) {
    m.box([x - 0.05, -0.3, top - 0.06], [x + 0.05, 0.3, top], IRON);
    for (const s of [-1, 1]) {
      m.loft(sq(x, s * 0.42, 0.035), 0, sq(x, s * 0.26, 0.03), top - 0.06, { ...IRON, bottom: false, top: false });
    }
  }
  return m.build();
}

/**
 * A swoop into `m`, its nose toward +x and its engine's middle `z` up: the
 * engine (a peach cowl round the intake, the dark body, a tapered exhaust),
 * a red fairing over it running back to the tail, the seat and handlebars,
 * vanes at the front and foot plates at the back. SWOOP.len long.
 */
function swoop(m, z) {
  const k = SWOOP.len / 2.45;
  const P = (x, y, zz) => [x * k, y * k, z + zz * k];
  const box = (a, b, style) => m.box(P(...a), P(...b), style);
  const r = 0.21 * k;
  const ring = (f) => Array.from({ length: 8 }, (_, i) => {
    const a = Math.PI / 8 + (i / 8) * Math.PI * 2;
    return [Math.cos(a) * r * f, z + Math.sin(a) * r * f];
  });
  const R = r + 0.04 * k;
  const s = 2 * R;
  const intake = { tex: 'speeder-intake', texScale: s, texOffset: [R / s, (z + R) / s] };
  m.cylinder(P(0.6, 0, 0), R, 0.42 * k, { segments: 8, axis: 'x', turn: Math.PI / 8, ...PEACH, top: intake, bottom: false });
  m.cylinder(P(0.52, 0, 0), R + 0.01, 0.06 * k, { segments: 8, axis: 'x', turn: Math.PI / 8, ...RED, top: false, bottom: false });
  m.cylinder(P(-0.45, 0, 0), r, 1.05 * k, { segments: 8, axis: 'x', turn: Math.PI / 8, ...METAL, top: false, bottom: false });
  m.loft(ring(1), -0.45 * k, ring(0.6), -0.68 * k, { axis: 'x', ...METAL, bottom: false, top: DARK });
  // The fairing over the engine, back over the tail boom.
  const sec = (pts) => pts.map(([y, zz]) => [y * k, z + zz * k]);
  m.prism(sec([[-0.17, 0.12], [0.17, 0.12], [0.12, 0.32], [-0.12, 0.32]]), 0.58 * k, -1.15 * k, { axis: 'x', ...RED });
  m.prism(sec([[-0.1, -0.1], [0.1, -0.1], [0.1, 0.12], [-0.1, 0.12]]), -0.45 * k, -1.25 * k, { axis: 'x', ...RED });
  // A peach stripe down the fairing's top.
  m.face([P(0.58, -0.03, 0.324), P(0.58, 0.03, 0.324), P(-1.15, 0.03, 0.324), P(-1.15, -0.03, 0.324)], PEACH, [0, 0, -1]);
  // The seat, the handlebars on their stem, grips.
  box([-0.95, -0.15, 0.32], [-0.35, 0.15, 0.42], { color: ['gray', 0.22], top: { color: ['gray', 0.3] }, bottom: false });
  box([0.28, -0.04, 0.32], [0.36, 0.04, 0.52], DARK);
  box([0.28, -0.4, 0.5], [0.34, 0.4, 0.55], STEEL);
  for (const y of [-0.4, 0.4]) box([0.27, y - 0.07, 0.49], [0.35, y + 0.07, 0.56], DARK);
  // Steering vanes beside the cowl, foot plates at the back.
  for (const y of [-1, 1]) {
    box([0.62, y * 0.3 - 0.015, -0.18], [1.22, y * 0.3 + 0.015, 0.12], RED);
    box([-0.75, y > 0 ? 0.2 : -0.36, -0.08], [-0.25, y > 0 ? 0.36 : -0.2, -0.04], METAL);
  }
  // A fin at the tail.
  const fin = (x0, x1, w) => [[x0 * k, -w * k], [x1 * k, -w * k], [x1 * k, w * k], [x0 * k, w * k]];
  m.loft(fin(-0.95, -1.25, 0.03), z + 0.32 * k, fin(-1.12, -1.3, 0.02), z + 0.6 * k, { ...PEACH, bottom: false });
}

function swoopHoist() {
  const m = new ModelBuilder('swoop-hoist');
  const { half: L, feet: F, top: T } = HOIST;
  const H = T - 0.2;
  // The A frames: a foot along y, two legs leaning in to the beam, a brace.
  for (const x of [-L + 0.15, L - 0.15]) {
    m.box([x - 0.06, -F, 0], [x + 0.06, F, 0.1], RUST);
    for (const s of [-1, 1]) strut(m, [x, s * (F - 0.1), 0.1], [x, s * 0.06, H], 0.045, RUST);
    const k = (1.15 - 0.1) / (H - 0.1);
    const w = (F - 0.1) * (1 - k) + 0.06 * k;
    m.box([x - 0.03, -w, 1.1], [x + 0.03, w, 1.18], RUST);
  }
  // The beam, the trolley and the hoist under it.
  m.box([-L, -0.08, H], [L, 0.08, T], RUST);
  m.box([-0.25, -0.12, H - 0.12], [0.05, 0.12, H], STEEL);
  m.box([-0.22, -0.11, H - 0.6], [0.02, 0.11, H - 0.12], { tex: 'drum-rust', texScale: 0.3 });
  // The swoop, hung from a spreader bar on two chains, the hoist's chain to
  // the bar's middle and its hand chain hanging beside.
  const z = 1.3;
  swoop(m, z);
  const k = SWOOP.len / 2.45;
  const bar = z + 1.2;
  const [x0, x1] = [-1.05 * k, 0.85 * k];
  m.box([x0, -0.03, bar], [x1, 0.03, bar + 0.07], IRON);
  m.box([-0.115, -0.015, bar + 0.07], [-0.085, 0.015, H - 0.6], CHAIN);
  for (const x of [x0 + 0.04, x1 - 0.04]) m.box([x - 0.015, -0.015, z + 0.32 * k], [x + 0.015, 0.015, bar], CHAIN);
  for (const x of [-0.16, -0.04]) m.box([x - 0.012, 0.12, 1.05], [x + 0.012, 0.145, H - 0.25], CHAIN);
  m.outlineLines([[-L, -F], [L, -F], [L, F], [-L, F]]);
  return m.build();
}

function workbench() {
  const m = new ModelBuilder('workbench');
  const { half: w, depth: d, top: t } = BENCH;
  m.box([-w, 0.02, t - 0.08], [w, d, t], STEEL);
  for (const x of [-w + 0.04, w - 0.08]) for (const y of [0.06, d - 0.06]) m.box([x, y - 0.03, 0], [x + 0.06, y + 0.03, t - 0.08], IRON);
  m.box([-w + 0.05, 0.08, 0.22], [w - 0.05, d - 0.04, 0.26], STEEL);
  // On the shelf, a box of parts and a canister.
  m.box([-0.95, 0.18, 0.26], [-0.4, 0.66, 0.6], { tex: 'crate-grey', texScale: 0.5 });
  m.cylinder([0.5, 0.42, 0.26], 0.15, 0.4, { segments: 8, tex: 'drum-grey', texScale: 0.4 });
  // The vice at the right-hand end, its jaws over the front edge.
  m.box([0.78, d - 0.32, t], [1.02, d - 0.08, t + 0.1], DARK);
  m.box([0.82, d - 0.1, t + 0.1], [0.98, d + 0.04, t + 0.2], DARK);
  m.box([0.86, d + 0.04, t + 0.14], [0.94, d + 0.18, t + 0.17], STEEL);
  // On top: a hydrospanner, a power cell, a coil of cable, an engine's
  // fan blade (off the pulled engine), and a datapad.
  m.box([-0.25, d - 0.35, t], [0.15, d - 0.3, t + 0.05], DARK);
  m.box([0.15, d - 0.37, t], [0.25, d - 0.28, t + 0.08], STEEL);
  m.cylinder([-0.6, d - 0.4, t], 0.07, 0.18, { segments: 6, color: [176, 140, 52] });
  m.cylinder([0.45, 0.3, t], 0.16, 0.05, { segments: 8, color: [40, 36, 34] });
  m.cylinder([-0.95, 0.4, t], 0.17, 0.03, { segments: 8, tex: 'speeder-intake', texScale: 0.34, texOffset: [0, 0] });
  m.box([-0.1, 0.22, t], [0.15, 0.4, t + 0.02], { color: [52, 56, 60] });
  m.box([-0.06, 0.25, t + 0.02], [0.11, 0.37, t + 0.025], { color: [90, 200, 120], glow: true });
  // The board on the wall, its tools hanging on it.
  m.box([-1.05, 0, 1.2], [1.05, 0.04, 2.15], { tex: 'planks' });
  const tools = [[-0.85, 0.5], [-0.72, 0.38], [-0.6, 0.6], [-0.3, 0.45], [-0.18, 0.3], [0.35, 0.55], [0.5, 0.42], [0.66, 0.3], [0.8, 0.5]];
  for (const [x, len] of tools) m.box([x - 0.025, 0.04, 2 - len], [x + 0.025, 0.07, 2], x > 0.3 ? STEEL : DARK);
  m.box([0.0, 0.04, 1.45], [0.22, 0.12, 1.9], { color: [150, 40, 30] });
  m.outlineLines([[-w, 0], [w, 0], [w, d], [-w, d]]);
  return m.build();
}

function pitDroid() {
  const m = new ModelBuilder('pit-droid');
  const BODY = { tex: 'drum-rust', texScale: 0.3 };
  const LIMB = { tex: 'metal-grey', texScale: 0.3 };
  // Its feet, shins back to the knees, thighs up to the hips.
  for (const s of [-1, 1]) {
    m.box([-0.04, s * 0.15 - 0.05, 0], [0.16, s * 0.15 + 0.05, 0.04], DARK);
    strut(m, [0.05, s * 0.15, 0.04], [-0.1, s * 0.14, 0.27], 0.025, LIMB);
    strut(m, [-0.1, s * 0.14, 0.27], [0.02, s * 0.1, 0.46], 0.03, LIMB);
  }
  // The body and its neck.
  m.box([-0.1, -0.12, 0.44], [0.1, 0.12, 0.7], BODY);
  m.box([-0.03, -0.03, 0.7], [0.03, 0.03, 0.86], LIMB);
  // The cap, wide and flat, and the eye under its front.
  m.cylinder([0, 0, 0.86], PIT_DROID.r, 0.07, { segments: 10, ...BODY, bottom: { color: [70, 56, 44] } });
  m.cylinder([0, 0, 0.93], PIT_DROID.r * 0.55, 0.05, { segments: 10, ...BODY });
  m.cylinder([0.05, 0, 0.78], 0.07, 0.08, { segments: 8, axis: 'x', ...LIMB, top: { color: [210, 50, 36], glow: true } });
  // Its arms reaching forward, a spanner in its hands.
  for (const s of [-1, 1]) strut(m, [0, s * 0.13, 0.66], [0.28, s * 0.07, 0.56], 0.02, LIMB);
  m.box([0.26, -0.08, 0.53], [0.32, 0.08, 0.58], DARK);
  m.box([0.29, -0.02, 0.58], [0.45, 0.02, 0.62], STEEL);
  return m.build();
}

function shutterRolled() {
  const m = new ModelBuilder('shutter-rolled');
  const w = SHUTTER.width / 2;
  // The bottom slat under the lintel, a hand from the wall's face.
  m.box([-w, -0.14, -0.18], [w, -0.06, 0], { tex: 'shutter', top: false });
  m.box([-w, -0.15, -0.21], [w, -0.05, -0.18], DARK);
  // The roller's box inside, over the opening.
  m.box([-w - 0.1, -SHUTTER.deep - 0.3, 0], [w + 0.1, -SHUTTER.deep, 0.4], { ...STEEL, top: false });
  return m.build();
}

export default [speederEngine(), buildSpeeder('landspeeder-blocks', { blocks: true }), swoopHoist(), workbench(), pitDroid(), shutterRolled()];
