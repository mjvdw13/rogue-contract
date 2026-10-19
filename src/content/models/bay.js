import { ModelBuilder } from './lib/build.js';

// Docking Bay 87's fittings (Mos Eisley, levels/m1.js), round its pit's
// wall. Built looking south (+y), the wall's face along y = 0 and the
// origin on it at the foot (the rim's lamps: on its top); the level turns
// them to face the pit's centre. The wall is 11 tall, floor to rim. Then
// what stands about the floor: big crates and fuel hoses out from the
// pumps.

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

/** The opening a bay door's frame goes round: 4 wide, 4 high, through a wall 1 thick. */
export const BAY_DOOR = { width: 4, tall: 4 };

/**
 * The part of the rectangle `[u0, z0, u1, z1]` where u * dir + z lies
 * between c0 and c1: one diagonal stripe of a hazard band, as [u, z] points.
 */
function stripe([u0, z0, u1, z1], dir, c0, c1) {
  let pts = [[u0, z0], [u1, z0], [u1, z1], [u0, z1]];
  // (Clipped by each side of the stripe in turn.)
  for (const [c, keep] of [[c0, 1], [c1, -1]]) {
    const out = [];
    for (let i = 0; i < pts.length; i++) {
      const [a, b] = [pts[i], pts[(i + 1) % pts.length]];
      const [da, db] = [a, b].map(([u, z]) => (u * dir + z - c) * keep);
      if (da >= 0) out.push(a);
      if ((da >= 0) !== (db >= 0)) {
        const t = da / (da - db);
        out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      }
    }
    pts = out;
  }
  return pts;
}

/**
 * The frame round one of the bay's doors (BAY_DOOR), which stand in the
 * middle of the wall: steel lining the opening back through the wall, a
 * sill plate with a yellow edge, braces across its top corners in front of
 * the door; and standing out from the wall's face, two heavy posts with
 * hazard stripes up their feet, a deep lintel over them and an amber lamp
 * in its middle. Built looking south: the origin on the wall's face (y 0)
 * at the opening's foot, the door at y -0.5. Only this face is framed: the
 * hallway behind is no wider than the door. It collides as its posts.
 */
function doorFrame() {
  const m = new ModelBuilder('bay-door-frame');
  const w = BAY_DOOR.width / 2;
  const h = BAY_DOOR.tall;
  const e = 0.02; // inset from the opening's walls, so the steel draws over them
  const post = 0.6; // wide
  const out = 0.25; // how far the posts stand out
  const steel = { color: ['steel', 0.58] };
  const dark = { color: ['steel', 0.4] };
  // The lining, facing into the opening, and the sill.
  for (const s of [-1, 1]) m.face([[s * (w - e), -1, 0], [s * (w - e), 0, 0], [s * (w - e), 0, h], [s * (w - e), -1, h]], dark, [0, -0.5, h / 2]);
  m.face([[-w, -1, h - e], [w, -1, h - e], [w, 0, h - e], [-w, 0, h - e]], dark, [0, -0.5, 0]);
  m.box([-w + e, -1, 0], [w - e, 0, 0.03], { color: ['gray', 0.22], bottom: false });
  m.box([-w + e, -0.2, 0], [w - e, 0, 0.035], { color: ['yellow', 0.7], bottom: false });
  // The corner braces, from the wall's face back to just in front of the door.
  for (const s of [-1, 1]) {
    const x = s * (w - e);
    m.prism([[x, h - e], [x, h - 0.5], [x - s * 0.5, h - e]], -0.4, 0, { ...steel, axis: 'y', sides: dark });
  }
  // The posts: the hazard band at the foot, then plain steel; stripes leaning in toward the door.
  const band = 1.2;
  for (const s of [-1, 1]) {
    const [x0, x1] = s > 0 ? [w, w + post] : [-w - post, -w];
    m.box([x0, 0, 0], [x1, out, band], { color: ['gray', 0.1], top: false, bottom: false });
    m.box([x0, 0, band], [x1, out, h], { ...steel, sides: dark, top: false, bottom: false });
    for (let c = w - 0.4; c < w + post + band; c += 0.36) {
      const pts = stripe([x0, 0, x1, band], s, c, c + 0.18);
      if (pts.length >= 3) m.face(pts.map(([u, z]) => [u, out + 0.005, z]), { color: ['yellow', 0.72] }, [0, 0, band / 2]);
    }
    m.outlineLines([[x0, 0], [x1, 0], [x1, out], [x0, out]]);
  }
  // The lintel across the posts, standing out further, and its lamp.
  m.box([-w - post, 0, h], [w + post, out + 0.1, h + 0.7], { ...steel, bottom: dark });
  m.box([-0.35, out + 0.1, h + 0.15], [0.35, out + 0.2, h + 0.55], { color: ['gray', 0.15], bottom: false });
  m.box([-0.27, out + 0.2, h + 0.22], [0.27, out + 0.22, h + 0.48], { color: [255, 170, 40], glow: true, bottom: false });
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
 * pump's front and drops to the floor; `end` is how it ends: 'nozzle' lies
 * on the floor with its nozzle, 'coil' is wound in a loose coil.
 */
export const BAY_HOSES = [
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
  }
  return m.build();
}

export default [
  rib(), fuelLine(), fuelPump(), rimLamp(), doorFrame(),
  bigCrate('bay-crate-grey', 'crate-grey', [2, 2, 2]), bigCrate('bay-crate-tan', 'crate-tan', [2, 2, 2]), bigCrate('bay-crate-rust-long', 'crate-rust', [3.2, 1.6, 1.6]),
  ...BAY_HOSES.map(hose),
];
