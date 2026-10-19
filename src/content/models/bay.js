import { ModelBuilder } from './lib/build.js';

// Docking Bay 87's fittings (Mos Eisley, levels/m1.js), round its pit's
// wall. Built looking south (+y), the wall's face along y = 0 and the
// origin on it at the foot (the rim's lamps: on its top); the level turns
// them to face the pit's centre. The wall is 11 tall, floor to rim. Then
// what stands about the floor: big crates, a container, a tool cart, a
// repulsor pallet, and fuel hoses out from the pumps.

const WALL = { tex: 'bay-wall' };
const IRON = ['gray', 0.22];
const PIPE = ['rust', 0.32];

/** How tall the pit's wall is, floor to rim. */
export const BAY_WALL = 11;

/**
 * A rib up the wall, floor to rim: a plinth, a buttress sloping back into a
 * square shaft, an iron band at street level and a cap block on the rim.
 * It collides as its plinth's outline.
 */
function rib() {
  const m = new ModelBuilder('bay-rib');
  const h = BAY_WALL;
  m.box([-0.6, 0, 0], [0.6, 1.1, 0.6], WALL);
  m.loft([[-0.45, 0], [0.45, 0], [0.45, 0.95], [-0.45, 0.95]], 0.6, [[-0.4, 0], [0.4, 0], [0.4, 0.45], [-0.4, 0.45]], 3, { ...WALL, bottom: false });
  m.box([-0.4, 0, 3], [0.4, 0.45, h - 0.4], { ...WALL, top: false, bottom: false });
  m.box([-0.44, 0, 5.2], [0.44, 0.49, 5.45], { color: IRON, bottom: { color: ['gray', 0.12] } });
  m.box([-0.55, 0, h - 0.4], [0.55, 0.6, h], { ...WALL, top: { color: ['tan', 0.55] } });
  m.outlineLines([[-0.6, 0], [0.6, 0], [0.6, 1.1], [-0.6, 1.1]]);
  return m.build();
}

/**
 * Fuel lines down the wall from the rim: two pipes clamped to it, coming
 * over the rim and down into a manifold block on the floor, a red valve wheel on
 * its front and a pipe off its side along the floor to a pump.
 */
function fuelLine() {
  const m = new ModelBuilder('bay-fuel-line');
  const h = BAY_WALL;
  for (const x of [-0.22, 0.22]) {
    m.cylinder([x, 0.2, 1.3], 0.08, h - 1.05, { segments: 6, color: PIPE, top: false, bottom: false });
    // Over the rim and back across its top.
    m.box([x - 0.09, -0.7, h + 0.16], [x + 0.09, 0.29, h + 0.34], { color: PIPE, bottom: false });
  }
  for (let z = 2.8; z < h - 0.5; z += 1.6) m.box([-0.4, 0, z], [0.4, 0.32, z + 0.08], { color: IRON, bottom: false });
  // The manifold, the valve and the pipe off to the pump.
  m.box([-0.5, 0, 0], [0.5, 0.5, 1.4], { color: ['gray', 0.3], top: { color: ['gray', 0.4] }, bottom: false });
  m.box([-0.5, 0.5, 1.2], [0.5, 0.53, 1.32], { color: ['yellow', 0.7] });
  m.cylinder([0, 0.5, 0.95], 0.2, 0.06, { axis: 'y', segments: 8, color: ['blood', 0.6] });
  m.cylinder([0, 0.56, 0.95], 0.05, 0.12, { axis: 'y', segments: 6, color: IRON });
  m.cylinder([0.5, 0.25, 0.85], 0.07, 0.9, { axis: 'x', segments: 6, color: PIPE });
  return m.build();
}

/**
 * A fuel pump standing on the floor against the wall: a cabinet with a
 * hazard band, a lit gauge, a hose wound on a reel at its side and a
 * nozzle in a holster on its front. It collides as its outline.
 */
function fuelPump() {
  const m = new ModelBuilder('bay-fuel-pump');
  m.box([-0.6, 0, 0], [0.6, 0.85, 0.15], { color: ['gray', 0.2], bottom: false });
  m.box([-0.55, 0, 0.15], [0.55, 0.75, 1.55], { color: ['gray', 0.42], top: false, bottom: false });
  m.box([-0.58, 0, 1.55], [0.58, 0.8, 1.7], { color: ['gray', 0.3], bottom: { color: ['gray', 0.15] } });
  m.box([-0.56, 0, 0.3], [0.56, 0.76, 0.5], { color: ['yellow', 0.75], top: false, bottom: false });
  // The gauge and a status lamp, lit.
  m.box([-0.3, 0.75, 1.05], [0.1, 0.77, 1.35], { color: ['gray', 0.08] });
  m.box([-0.26, 0.77, 1.1], [0.06, 0.78, 1.3], { color: [255, 190, 60], glow: true });
  m.box([0.22, 0.75, 1.2], [0.34, 0.8, 1.32], { color: [90, 255, 90], glow: true });
  // The reel and its hose, and the nozzle.
  m.cylinder([0.55, 0.38, 0.95], 0.3, 0.12, { axis: 'x', segments: 10, color: ['gray', 0.3] });
  m.cylinder([0.67, 0.38, 0.95], 0.22, 0.14, { axis: 'x', segments: 10, color: ['gray', 0.1] });
  m.box([0.1, 0.75, 0.6], [0.3, 0.9, 0.95], { color: IRON, bottom: false });
  m.box([0.15, 0.78, 0.9], [0.25, 0.98, 1.0], { color: ['blood', 0.55] });
  m.outlineLines([[-0.6, 0], [0.6, 0], [0.6, 0.85], [-0.6, 0.85]]);
  return m.build();
}

/**
 * A lamp on the rim, out over the pit: a post on the wall's top, an arm
 * reaching out and a lamp head at its end, its lens glowing down.
 */
function rimLamp() {
  const m = new ModelBuilder('bay-rim-lamp');
  m.box([-0.3, -0.7, 0], [0.3, -0.1, 0.12], { color: IRON, bottom: false });
  m.box([-0.08, -0.48, 0.12], [0.08, -0.32, 1.5], { color: ['steel', 0.45], bottom: false });
  m.box([-0.07, -0.48, 1.36], [0.07, 1.3, 1.5], { color: ['steel', 0.45] });
  // A strut from the post up to the arm.
  m.loft([[-0.04, -0.46], [0.04, -0.46], [0.04, -0.38], [-0.04, -0.38]], 0.6, [[-0.04, 0.42], [0.04, 0.42], [0.04, 0.5], [-0.04, 0.5]], 1.36, { color: ['steel', 0.35], top: false, bottom: false });
  m.box([-0.22, 1.05, 1.1], [0.22, 1.55, 1.42], { color: ['gray', 0.3], bottom: { color: [255, 250, 200], glow: true } });
  m.box([-0.04, 1.26, 1.5], [0.04, 1.34, 1.58], { color: [255, 60, 40], glow: true, bottom: false });
  return m.build();
}

/**
 * A box `w` x `d` x `h` in a crate texture, one crate picture (square, `h`
 * high) per `h` along each face, its edges on the box's: so a face as long
 * as a whole number of `h` shows whole pictures. Leaves out its bottom.
 */
function crateBox(m, [x, y, z], [w, d, h], tex) {
  const s = h / 2;
  const along = { tex, texScale: s, texOffset: [w / (2 * s), 0] };
  const across = { tex, texScale: s, texOffset: [d / (2 * s), 0] };
  m.box([x - w / 2, y - d / 2, z], [x + w / 2, y + d / 2, z + h], {
    side: (i) => (i % 2 ? across : along),
    top: { tex, texScale: s, texOffset: [w / (2 * s), d / (2 * s)] },
    bottom: false,
  });
}

/**
 * A big cargo crate, `w` x `d` x `h`, taller than you: the crate texture
 * with iron straps up its corners. Stacks (place another `h` up). It
 * collides as its outline.
 */
function bigCrate(id, tex, [w, d, h]) {
  const m = new ModelBuilder(id);
  crateBox(m, [0, 0, 0], [w, d, h], tex);
  // (Each strap an L round its corner, standing just proud of the faces.)
  const t = 0.14;
  const e = 0.02;
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      const [x, y] = [(sx * w) / 2 + sx * e, (sy * d) / 2 + sy * e];
      m.box([Math.min(x, x - sx * t), Math.min(y, y - sy * e * 2), 0], [Math.max(x, x - sx * t), Math.max(y, y - sy * e * 2), h], { color: IRON, bottom: false });
      m.box([Math.min(x, x - sx * e * 2), Math.min(y, y - sy * t), 0], [Math.max(x, x - sx * e * 2), Math.max(y, y - sy * t), h], { color: IRON, bottom: false });
    }
  }
  m.outlineLines([[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]]);
  return m.build();
}

/**
 * A cargo container, 6.8 long (along x), 2.8 wide and 3.2 tall: ribbed
 * steel gone rusty in a darker frame, a hazard band along its sides,
 * and double doors at its +x end with locking bars and handles. It
 * collides as its outline.
 */
function container() {
  const m = new ModelBuilder('bay-container');
  const [L, D, H] = [3.4, 1.4, 3.2];
  const FRAME = { color: ['gray', 0.28] };
  m.box([-L, -D, 0], [L, D, H], { tex: 'metal-rust', texScale: H / 2, top: { color: ['gray', 0.38] }, bottom: false });
  // The frame: posts up the corners, rails along the top and the foot.
  for (const x of [-L, L]) for (const y of [-D, D]) m.box([x - 0.1, y - 0.1, 0], [x + 0.1, y + 0.1, H + 0.05], { ...FRAME, bottom: false });
  for (const y of [-D, D]) {
    m.box([-L, y - 0.08, H - 0.18], [L, y + 0.08, H + 0.03], { ...FRAME, bottom: false });
    m.box([-L, y - 0.08, 0], [L, y + 0.08, 0.2], { ...FRAME, bottom: false, top: false });
    // The hazard band.
    m.box([-L + 0.4, y - 0.02, 2.45], [L - 0.4, y + 0.02, 2.65], { color: ['yellow', 0.65], bottom: false, top: false });
  }
  // The doors: two panels just proud of the end, a seam between them, two
  // locking bars up each with a handle.
  m.box([L, -D + 0.1, 0.2], [L + 0.04, D - 0.1, H - 0.18], { color: ['gray', 0.3], bottom: false, top: false });
  m.box([L + 0.04, -0.02, 0.2], [L + 0.05, 0.02, H - 0.18], { color: ['gray', 0.08] });
  for (const y of [-1, -0.35, 0.35, 1]) {
    m.box([L + 0.04, y - 0.035, 0.15], [L + 0.1, y + 0.035, H - 0.12], { color: ['steel', 0.45], bottom: false });
    m.box([L + 0.1, Math.min(y, y - 0.15 * Math.sign(y)), 1.2], [L + 0.16, Math.max(y, y - 0.15 * Math.sign(y)), 1.28], { color: ['steel', 0.35] });
  }
  m.outlineLines([[-L - 0.1, -D - 0.1], [L + 0.16, -D - 0.1], [L + 0.16, D + 0.1], [-L - 0.1, D + 0.1]]);
  return m.build();
}

/**
 * A tool cart on castors: a red cabinet of drawers with steel pulls, a tray
 * on top with a toolbox and a hydrospanner in it, and a push bar at its +x
 * end. It collides as its outline.
 */
function toolCart() {
  const m = new ModelBuilder('bay-tool-cart');
  const [W, D] = [0.65, 0.38];
  m.box([-W, -D, 0.18], [W, D, 0.95], { color: ['blood', 0.55], top: false, bottom: { color: ['gray', 0.1] } });
  // Drawers on both long sides: dark seams and pulls.
  for (const y of [-D, D]) {
    for (const z of [0.4, 0.58, 0.76]) m.box([-W + 0.06, y - 0.01, z], [W - 0.06, y + 0.01, z + 0.02], { color: ['gray', 0.1], bottom: false, top: false });
    for (const z of [0.3, 0.48, 0.66, 0.84]) m.box([-0.18, y - 0.03, z], [0.18, y + 0.03, z + 0.04], { color: ['steel', 0.6] });
  }
  m.box([-W - 0.04, -D - 0.04, 0.95], [W + 0.04, D + 0.04, 1.02], { color: ['gray', 0.35] });
  m.box([-0.5, -0.25, 1.02], [0.1, 0.22, 1.28], { color: ['orange', 0.45], bottom: false });
  m.box([-0.45, -0.03, 1.28], [0.05, 0.03, 1.33], { color: ['gray', 0.2], bottom: false });
  m.box([0.2, -0.05, 1.02], [0.6, 0.05, 1.08], { color: ['steel', 0.5], bottom: false });
  m.cylinder([0.6, 0, 1.05], 0.05, 0.08, { axis: 'x', segments: 6, color: ['yellow', 0.6] });
  // The push bar and the castors.
  for (const y of [-0.3, 0.3]) m.box([W + 0.04, y - 0.025, 0.95], [W + 0.2, y + 0.025, 1.15], { color: ['steel', 0.5], bottom: false });
  m.box([W + 0.17, -0.3, 1.12], [W + 0.23, 0.3, 1.18], { color: ['steel', 0.5] });
  for (const x of [-W + 0.12, W - 0.12]) for (const y of [-D + 0.08, D - 0.08]) m.cylinder([x, y - 0.03, 0.09], 0.09, 0.06, { axis: 'y', segments: 6, color: ['gray', 0.12] });
  m.outlineLines([[-W - 0.04, -D - 0.04], [W + 0.23, -D - 0.04], [W + 0.23, D + 0.04], [-W - 0.04, D + 0.04]]);
  return m.build();
}

/**
 * A repulsor pallet, hovering (decor.js bobs it) with its load strapped
 * on: a deck 2.4 by 1.6 on four repulsor pods glowing cyan underneath,
 * hazard yellow round its edge, a handle at its -x end, a long crate and a
 * small one held by two straps, and its soft shadow on the floor. It
 * collides as its outline.
 */
function hoverPallet() {
  const m = new ModelBuilder('bay-hover-pallet');
  const [L, D] = [1.2, 0.8];
  const z = 0.32;
  m.box([-L, -D, z], [L, D, z + 0.14], { color: ['yellow', 0.55], top: { color: ['gray', 0.3] }, bottom: { color: ['gray', 0.15] } });
  for (const x of [-0.75, 0.75]) {
    for (const y of [-0.45, 0.45]) m.box([x - 0.25, y - 0.2, z - 0.1], [x + 0.25, y + 0.2, z], { color: ['gray', 0.2], top: false, bottom: { color: [60, 220, 255], glow: true } });
  }
  crateBox(m, [0.15, -0.05, z + 0.14], [1.8, 0.9, 0.9], 'crate-rust');
  crateBox(m, [-0.62, 0.38, z + 0.14], [0.6, 0.6, 0.6], 'crate-grey');
  for (const x of [-0.3, 0.6]) m.box([x - 0.05, -0.52, z + 0.14], [x + 0.05, 0.42, z + 1.06], { color: ['orange', 0.3], bottom: false });
  m.box([-L - 0.05, -0.35, z + 0.14], [-L, 0.35, z + 0.8], { color: ['steel', 0.45], bottom: false });
  m.box([-L - 0.2, -0.35, z + 0.75], [-L - 0.05, 0.35, z + 0.83], { color: ['steel', 0.45] });
  m.face([[1.5, -1.1, 0.01], [1.5, 1.1, 0.01], [-1.5, 1.1, 0.01], [-1.5, -1.1, 0.01]], { tex: 'speeder-shadow', uv: [[0, 0], [1, 0], [1, 1], [0, 1]] }, [0, 0, -1]);
  m.outlineLines([[-L - 0.2, -D], [L, -D], [L, D], [-L - 0.2, D]]);
  return m.build();
}

const vsub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const vcross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const vdot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const unit = (a) => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};

/**
 * A smooth curve through `pts` (Catmull-Rom), `steps` points from each to
 * the next: so a hose laid out in a few points still bends gently.
 */
function smooth(pts, steps) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [p0, p1, p2, p3] = [pts[Math.max(0, i - 1)], pts[i], pts[i + 1], pts[Math.min(pts.length - 1, i + 2)]];
    for (let k = 0; k < steps; k++) {
      const t = k / steps;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push([0, 1, 2].map((j) => 0.5 * (2 * p1[j] + (p2[j] - p0[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (3 * p1[j] - p0[j] - 3 * p2[j] + p3[j]) * t3)));
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

/**
 * A tube of `radius` with `sides` sides along the points `path`, its rings
 * carried along the path without twisting (so it can bend from lying on
 * the floor to standing up). Open at its ends.
 */
function tube(m, path, radius, style, sides = 6) {
  const rings = [];
  let n = null;
  for (let i = 0; i < path.length; i++) {
    const t = unit(vsub(path[Math.min(path.length - 1, i + 1)], path[Math.max(0, i - 1)]));
    n = n ? unit(vsub(n, t.map((c) => c * vdot(n, t)))) : unit(vcross(t, Math.abs(t[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0]));
    const b = vcross(t, n);
    rings.push(Array.from({ length: sides }, (_, k) => {
      const a = (k / sides) * Math.PI * 2;
      const [cu, cv] = [Math.cos(a) * radius, Math.sin(a) * radius];
      return [0, 1, 2].map((j) => path[i][j] + n[j] * cu + b[j] * cv);
    }));
  }
  for (let i = 0; i < path.length - 1; i++) {
    const inside = [0, 1, 2].map((j) => (path[i][j] + path[i + 1][j]) / 2);
    for (let k = 0; k < sides; k++) {
      const l = (k + 1) % sides;
      m.face([rings[i][k], rings[i][l], rings[i + 1][l], rings[i + 1][k]], style, inside);
    }
  }
}

/**
 * Fuel hoses out from the pumps across the bay's floor, laid out in the
 * bay's own axes (x east, y south, from the bay's centre; levels/m1.js puts
 * each at the centre plus its first point, at angle 0). Each leaves a
 * pump's front and drops to the floor; `end` is how it ends: 'ship' rises
 * into the Crow's belly (2 up) to a coupling, 'nozzle' lies on the floor
 * with its nozzle, 'coil' is wound in a loose coil.
 */
export const BAY_HOSES = [
  { id: 'bay-hose-ship', end: 'ship', color: ['gray', 0.12], path: [[8.35, 18.32, 0.5], [8, 17.6, 0.1], [6.6, 15.6, 0.1], [6.9, 12.6, 0.1], [5.6, 9.8, 0.1], [4.6, 7.4, 0.1], [4.6, 6.1, 0.3], [4.6, 5.8, 1], [4.6, 5.75, 2.05]] },
  { id: 'bay-hose-nozzle', end: 'nozzle', color: ['orange', 0.32], path: [[-11.69, 16.39, 0.5], [-11.25, 15.7, 0.1], [-9.6, 14.1, 0.1], [-9.9, 11.6, 0.1], [-8.1, 9.7, 0.1], [-6.3, 9.4, 0.1], [-5.3, 8.7, 0.1]] },
  { id: 'bay-hose-coil', end: 'coil', color: ['gray', 0.12], path: [[18.32, -8.35, 0.5], [17.6, -8, 0.1], [16.4, -7.2, 0.1], [15.9, -6.2, 0.1]] },
];

function hose({ id, end, color, path }) {
  const m = new ModelBuilder(id);
  const r = 0.1;
  const [ox, oy] = path[0];
  let pts = path.map(([x, y, z]) => [x - ox, y - oy, z]);
  if (end === 'coil') {
    // A turn and a quarter round a centre beside its last point, closing in.
    const last = pts[pts.length - 1];
    const c = [last[0] - 0.75, last[1] + 0.35];
    const a0 = Math.atan2(last[1] - c[1], last[0] - c[0]);
    const r0 = Math.hypot(last[0] - c[0], last[1] - c[1]);
    for (let k = 1; k <= 10; k++) {
      const a = a0 + (k / 10) * Math.PI * 2.5;
      const rr = r0 - (k / 10) * 0.25;
      pts.push([c[0] + Math.cos(a) * rr, c[1] + Math.sin(a) * rr, 0.1]);
    }
  }
  const curve = smooth(pts, 2);
  tube(m, curve, r, { color });
  // Where it leaves the pump, a collar.
  tube(m, curve.slice(0, 2), r * 1.5, { color: IRON });
  const [a, b] = curve.slice(-2);
  const dir = unit(vsub(b, a));
  const along = (p, d) => [0, 1, 2].map((j) => p[j] + dir[j] * d);
  if (end === 'nozzle') {
    // The nozzle: a fat steel grip, then a thin spout.
    tube(m, [b, along(b, 0.35)], r * 1.6, { color: ['steel', 0.45] });
    tube(m, [along(b, 0.35), along(b, 0.6)], r * 0.6, { color: ['steel', 0.3] });
  } else if (end === 'ship') {
    // A coupling on the hull: a steel collar and a plate.
    tube(m, [along(b, -0.35), b], r * 1.6, { color: ['steel', 0.45] });
    m.box([b[0] - 0.3, b[1] - 0.3, b[2] - 0.05], [b[0] + 0.3, b[1] + 0.3, b[2] + 0.05], { color: ['gray', 0.25], top: false });
  }
  return m.build();
}

export default [
  rib(), fuelLine(), fuelPump(), rimLamp(),
  bigCrate('bay-crate-grey', 'crate-grey', [2, 2, 2]), bigCrate('bay-crate-tan', 'crate-tan', [2, 2, 2]), bigCrate('bay-crate-rust-long', 'crate-rust', [3.2, 1.6, 1.6]),
  container(), toolCart(), hoverPallet(), ...BAY_HOSES.map(hose),
];
