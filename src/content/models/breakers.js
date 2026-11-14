import { ModelBuilder } from './lib/build.js';

// The small pieces of Mission 5's breaking yard and the Bottoms
// (levels/m5.js): what stands on the quay, the cutting floor's stacks and
// torches, the fallen deck's edge in the hauler, the shacks' dressing.
// Sizes are tiles (0.5 m).

const RUST = { tex: 'metal-rust' };
const STEEL = { tex: 'blast-steel' };
const PLATE = { tex: 'freighter-hull' };
const DARK = { color: [34, 30, 26] };

/** A flat strip between two 3D points, `w` wide across x, y or z, seen from both sides. */
function strap(m, a, b, w, style, across) {
  const d = { x: [w / 2, 0, 0], y: [0, w / 2, 0], z: [0, 0, w / 2] }[across];
  const at = (p, s) => [p[0] + s * d[0], p[1] + s * d[1], p[2] + s * d[2]];
  m.face([at(a, -1), at(a, 1), at(b, 1), at(b, -1)], { ...style, twoSided: true });
}

// ---------------------------------------------------------------- the quay
// `lamp-post`: a glow-rod pylon: a tapering three-sided mast 5 tall on a
// footing, a collar near its head and a glow rod standing in it, lit;
// `lamp-post-dead` has a dark rod. The light itself is the level's.
export const LAMP_POST = { height: 5, lamp: [0, 0, 4.4] };
const GLOW = { tex: null, color: [255, 236, 170], glow: true };

function lampPost(id, lit) {
  const m = new ModelBuilder(id);
  const H = LAMP_POST.height;
  const tri = (r) => [0, 1, 2].map((i) => [Math.cos((i / 3) * Math.PI * 2 + 0.5) * r, Math.sin((i / 3) * Math.PI * 2 + 0.5) * r]);
  m.cylinder([0, 0, 0], 0.34, 0.35, { segments: 6, ...STEEL, texScale: 0.5, bottom: false });
  m.loft(tri(0.24), 0.35, tri(0.1), H - 1.3, { ...RUST, bottom: false, top: false });
  m.cylinder([0, 0, H - 1.3], 0.2, 0.15, { segments: 6, ...STEEL, texScale: 0.5 });
  m.cylinder([0, 0, H - 1.15], 0.08, 1, { segments: 5, ...(lit ? GLOW : { color: [44, 44, 40] }), bottom: false });
  m.cylinder([0, 0, H - 0.15], 0.14, 0.15, { segments: 6, ...STEEL, texScale: 0.5 });
  // Two guard rods up the glow rod's sides.
  for (const s of [-1, 1]) m.box([s * 0.17 - 0.015, -0.015, H - 1.15], [s * 0.17 + 0.015, 0.015, H - 0.15], { ...DARK, top: false, bottom: false });
  return m.build();
}

// `bollard`: a landing clamp: a squat six-sided drum with a sloped
// collar, a cable eye and a marker light, where ships are tied down.
export const BOLLARD = { radius: 0.4, height: 0.85 };

function bollard() {
  const m = new ModelBuilder('bollard');
  const { radius: R, height: H } = BOLLARD;
  const hex = (r) => Array.from({ length: 6 }, (_, i) => [Math.cos((i / 6) * Math.PI * 2) * r, Math.sin((i / 6) * Math.PI * 2) * r]);
  m.loft(hex(R), 0, hex(R * 0.85), 0.5, { tex: 'blast-hazard', bottom: false, top: false });
  m.loft(hex(R * 0.85), 0.5, hex(R * 0.5), H - 0.1, { ...STEEL, texScale: 0.5, bottom: false });
  m.box([-0.06, -0.06, H - 0.1], [0.06, 0.06, H], { color: [255, 150, 40], glow: true, bottom: false });
  m.box([R * 0.7, -0.05, 0.25], [R + 0.18, 0.05, 0.4], RUST);
  return m.build();
}

// ---------------------------------------------------------------- the cutting floor
// `plate-stack`: hull plates cut to size and stacked, none square on the
// one below, the top one's edge burnt. It collides as its outline.
export const PLATE_STACK = { half: [1.6, 1.1], height: 0.8 };

function plateStack() {
  const m = new ModelBuilder('plate-stack');
  const { half: [hx, hy], height: H } = PLATE_STACK;
  const n = 5;
  const t = H / n;
  for (let i = 0; i < n; i++) {
    const a = ((i * 37) % 11 - 5) * 0.012;
    const [c, s] = [Math.cos(a), Math.sin(a)];
    const [dx, dy] = [((i * 3) % 4 - 1.5) * 0.06, ((i * 5) % 3 - 1) * 0.07];
    const k = 1 - i * 0.03;
    const pts = [[-hx * k, -hy * k], [hx * k, -hy * k], [hx * k, hy * k], [-hx * k, hy * k]].map(([x, y]) => [x * c - y * s + dx, x * s + y * c + dy]);
    m.prism(pts, i * t, (i + 1) * t - 0.02, { ...(i % 2 ? RUST : PLATE), bottom: false, top: i === n - 1 || i % 2 === 0 ? undefined : false, sides: { tex: 'hull-section', texScale: 0.5 } });
  }
  m.outlineLines([[-hx, -hy], [hx, -hy], [hx, hy], [-hx, hy]]);
  return m.build();
}

// `cutting-torch`: a breaker's plasma cutter left running: a power cell on
// a sled (a six-sided drum, its charge bands glowing), a jointed arm up
// and over from it, the cutter head aimed down to +x and burning blue
// white, a feed cable sagging between. `TORCH.tip` is where it burns (the
// decoration's sparks).
export const TORCH = { tip: [1.55, 0, 0.75], radius: 0.6, height: 1.7 };
const PLASMA = { color: [170, 220, 255], glow: true };

function cuttingTorch() {
  const m = new ModelBuilder('cutting-torch');
  const tip = TORCH.tip;
  // The sled and the cell.
  m.box([-0.6, -0.45, 0.05], [0.35, 0.45, 0.2], { ...STEEL, texScale: 0.5 });
  m.cylinder([-0.15, 0, 0.2], 0.36, 0.95, { segments: 6, tex: 'crane-yellow', bottom: false, top: false });
  for (const z of [0.42, 0.8]) m.cylinder([-0.15, 0, z], 0.375, 0.07, { segments: 6, ...PLASMA, top: false, bottom: false });
  m.cylinder([-0.15, 0, 1.15], 0.26, 0.12, { segments: 6, ...STEEL, texScale: 0.5, bottom: false });
  // The arm: up from the sled's nose, over, and down to the head.
  const arm = [[0.25, 0, 0.2], [0.55, 0, 1.45], [1.25, 0, 1.4], [tip[0] - 0.12, 0, tip[2] + 0.22]];
  for (let j = 0; j < arm.length - 1; j++) {
    strap(m, arm[j], arm[j + 1], 0.1, RUST, 'y');
    strap(m, arm[j], arm[j + 1], 0.1, RUST, j === 1 ? 'z' : 'x');
  }
  for (const [x, , z] of arm.slice(1, 3)) m.box([x - 0.09, -0.09, z - 0.09], [x + 0.09, 0.09, z + 0.09], { ...STEEL, texScale: 0.25 });
  // The head, and the plasma at its nozzle.
  m.box([tip[0] - 0.2, -0.09, tip[2] + 0.1], [tip[0] - 0.02, 0.09, tip[2] + 0.34], { ...STEEL, texScale: 0.25 });
  m.box([tip[0] - 0.05, -0.035, tip[2] - 0.04], [tip[0] + 0.03, 0.035, tip[2] + 0.1], PLASMA);
  // The feed cable from the cell to the head.
  const pts = [[-0.15, 0.2, 1.2], [0.3, 0.3, 0.7], [0.9, 0.2, 0.5], [tip[0] - 0.15, 0.08, tip[2] + 0.3]];
  for (let j = 0; j < pts.length - 1; j++) strap(m, pts[j], pts[j + 1], 0.05, DARK, 'y');
  return m.build();
}

// ---------------------------------------------------------------- the hauler
// `deck-edge`: where the crew deck gave way: the broken edge of the deck
// still up, 4 along x. Its back is y = 0 at the deck's top (z = 0 is the
// deck: place it with `z`), the hole to +y: plates bent down into it,
// frames snapped off short, a pipe and a cable hanging. Nothing collides:
// it's all overhead.
export const DECK_EDGE = { length: 4, drop: 2.6 };

function deckEdge() {
  const m = new ModelBuilder('deck-edge');
  const two = { ...PLATE, twoSided: true };
  // Plates folding down off the edge, each to its own length.
  for (const [x0, x1, out, drop] of [[-2, -0.9, 0.9, 1.5], [-0.9, 0.4, 0.5, 2.6], [0.4, 2, 1.3, 1.1]]) {
    m.face([[x0, 0, -0.05], [x1, 0, -0.05], [x1, out * 0.6, -drop * 0.35], [x0, out * 0.6, -drop * 0.3]], two);
    m.face([[x0, out * 0.6, -drop * 0.3], [x1, out * 0.6, -drop * 0.35], [x1 - 0.1, out, -drop], [x0 + 0.1, out, -drop * 0.9]], { tex: 'hold-ceiling', twoSided: true });
  }
  // The deck's frames, snapped: stubs out over the hole, one hanging.
  for (const [x, out, dz] of [[-1.5, 1.6, -0.1], [1.2, 0.9, -0.3]]) {
    m.prism([[0, -0.75], [out, -0.75 + dz], [out, -0.45 + dz], [0, -0.45]], x - 0.12, x + 0.12, { axis: 'x', ...RUST, texScale: 0.5, bottom: false });
  }
  strap(m, [0.1, 0.1, -0.6], [0.5, 1, -2.4], 0.24, { ...RUST, texScale: 0.5 }, 'x');
  // A pipe broken off, and a cable down from it.
  m.cylinder([-0.4, 0, -0.95], 0.09, 1.2, { axis: 'y', segments: 5, tex: 'pipe-rust', texScale: 0.25 });
  strap(m, [-0.4, 1.2, -0.95], [-0.3, 1.25, -2.6], 0.05, DARK, 'x');
  strap(m, [1.7, 0.05, -0.5], [1.6, 0.5, -2.1], 0.05, { color: [70, 30, 24] }, 'x');
  return m.build();
}

// ---------------------------------------------------------------- the Bottoms
// `vent-stack`: a shack's flue up its wall (its back at y = 0, standing
// out to +y): a pipe from a firebox at the foot, strapped twice, a cowl
// on top. `VENT.mouth` is where its smoke comes out.
export const VENT = { height: 4.6, mouth: [0, 0.3, 4.7] };

function ventStack() {
  const m = new ModelBuilder('vent-stack');
  const H = VENT.height;
  m.box([-0.35, 0, 0], [0.35, 0.6, 0.8], { ...RUST, bottom: false });
  m.box([-0.2, 0.6, 0.2], [0.2, 0.63, 0.55], { color: [255, 120, 30], glow: true });
  m.cylinder([0, 0.3, 0.8], 0.16, H - 0.8, { segments: 6, tex: 'pipe-rust', texScale: 0.25, bottom: false, top: { tex: null, color: [10, 9, 8] } });
  for (const z of [1.9, 3.4]) m.box([-0.22, 0, z], [0.22, 0.5, z + 0.08], { ...STEEL, bottom: false });
  m.loft([[-0.32, -0.02], [0.32, -0.02], [0.32, 0.62], [-0.32, 0.62]], H + 0.15, [[-0.06, 0.24], [0.06, 0.24], [0.06, 0.36], [-0.06, 0.36]], H + 0.42, { ...RUST, twoSided: true });
  return m.build();
}

// `shack-sign`: the Bottoms' one lit sign: a box sign hung out from a
// wall on a bracket (its back at y = 0, standing out to +y, read from
// east and west), lit from inside, a cable looping back to the wall.
// Place it with `z`: z = 0 is its bottom edge.
export const SHACK_SIGN = { out: 2.2, height: 1.6 };

function shackSign() {
  const m = new ModelBuilder('shack-sign');
  const { out, height: H } = SHACK_SIGN;
  const face = { tex: 'sign-bottoms', glow: true };
  m.box([-0.12, 0.3, 0], [0.12, out, H], { color: [60, 46, 30] });
  for (const s of [-1, 1]) {
    const x = s * 0.125;
    // (Read left to right from either side.)
    const uv = s > 0 ? [[0, 1], [1, 1], [1, 0], [0, 0]] : [[1, 1], [0, 1], [0, 0], [1, 0]];
    m.face([[x, 0.3, 0], [x, out, 0], [x, out, H], [x, 0.3, H]], { ...face, uv }, [0, out / 2, H / 2]);
  }
  m.box([-0.05, 0, H - 0.25], [0.05, 0.3, H - 0.15], RUST);
  strap(m, [0, 0, H + 0.9], [0, out - 0.1, H], 0.05, RUST, 'x');
  strap(m, [0, 0, 0.5], [0, 0.6, -0.25], 0.04, DARK, 'x');
  strap(m, [0, 0.6, -0.25], [0, 1.2, 0], 0.04, DARK, 'x');
  return m.build();
}

export default [lampPost('lamp-post', true), lampPost('lamp-post-dead', false), bollard(), plateStack(), cuttingTorch(), deckEdge(), ventStack(), shackSign()];
