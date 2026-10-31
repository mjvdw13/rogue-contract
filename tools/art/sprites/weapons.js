// First-person weapon sprites ("psprites"), modelled and lit like the monsters.
// Drawn at screen resolution and anchored bottom-centre. Frame layouts match
// src/content/weapons/*.js.
import { darken, lighten, mix } from '../lib/canvas.js';
import { C, G } from '../lib/pal.js';
import { Model, MAT } from '../lib/model.js';
import { sheet, flash } from '../lib/sprite.js';

const W = (name) => `assets/sprites/weapons/${name}.png`;
// The mercenary's kit: a worn brown flight jacket and black leather gloves.
const SLEEVE = mix(C('rust', 0.32), C('olive', 0.3), 0.4);
const CUFF = C('gray', 0.2);
const GLOVE = C('gray', 0.1);
const GUNMETAL = C('gray', 0.3);
const RENDER = { light: [-0.55, -0.7, 0.5], ambient: 0.32, aoStrength: 0.55, bounce: 0.05 };

/** Forearm in the jacket sleeve, entering from off-screen, with a dark cuff at the wrist. */
function forearm(m, from, to, r = 8) {
  m.capsule(...from, ...to, r + 1.6, r * 0.78 + 1.6, SLEEVE, MAT.leather);
  const t = 0.88;
  const cuff = [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t, from[2] + (to[2] - from[2]) * t];
  m.capsule(...cuff, ...to, r + 1.8, r * 0.78 + 1.6, CUFF, MAT.leather);
}

/** A clenched gloved fist: palm, four curled fingers and a thumb. `dir` 1 = right hand. */
function fist(m, x, y, z, r = 9, dir = 1) {
  m.ellipsoid(x, y, z, r, r * 0.85, r * 0.8, GLOVE, MAT.leather);
  for (let k = 0; k < 4; k++) {
    const fx = x - r * 0.62 + k * r * 0.42;
    m.capsule(fx, y - r * 0.55, z + r * 0.45, fx + dir * 0.4, y - r * 0.1, z + r * 0.85, r * 0.27, r * 0.24, lighten(GLOVE, 0.05), MAT.leather);
  }
  m.capsule(x - dir * r * 0.7, y + r * 0.1, z + r * 0.5, x - dir * r * 0.1, y - r * 0.15, z + r * 0.95, r * 0.28, r * 0.24, GLOVE, MAT.leather); // thumb
}

// ------------------------------------------------------------------ fists

function fistsFrame({ right = [118, 62, 14], left = [40, 66, 12], rs = 10, ls = 9.5 } = {}) {
  const m = new Model(160, 80, { seed: 101 });
  forearm(m, [left[0] - 26, 104, left[2] - 6], [left[0] - 4, left[1] + 6, left[2]], 9);
  fist(m, ...left, ls, -1);
  forearm(m, [right[0] + 26, 104, right[2] - 6], [right[0] + 4, right[1] + 6, right[2]], 9);
  fist(m, ...right, rs, 1);
  return m.render(RENDER);
}

function fistsSheet() {
  return sheet([
    fistsFrame(),
    fistsFrame({ right: [130, 58, 10] }), // wind up
    fistsFrame({ right: [88, 30, 30], rs: 14 }), // punch toward the crosshair
    fistsFrame({ right: [110, 50, 18], rs: 11 }),
  ]);
}

// ------------------------------------------------------------------ blaster pistol

function blasterFrame({ kick = 0, fire = false } = {}) {
  const m = new Model(96, 88, { seed: 103 });
  // Modelled in profile (muzzle at x = 0, scope toward +y, grip toward -y),
  // then turned so the muzzle points up at the crosshair: a three-quarter view
  // from behind the right hand.
  const th = (64 * Math.PI) / 180;
  const [ox, oy] = [42, 6 + kick];
  const T = (x, y) => [ox + x * Math.cos(th) - y * Math.sin(th), oy + x * Math.sin(th) + y * Math.cos(th)];
  const poly = (pts) => pts.map(([x, y]) => T(x, y));
  const metal = { ...MAT.metal, spec: 0.45, shine: 20, grain: 0.05 };
  // Barrel: a long cylinder with a slotted flash suppressor at the muzzle.
  const [b0, b1] = [T(2, 0), T(34, 0)];
  m.capsule(b0[0], b0[1], 14, b1[0], b1[1], 14, 3.4, 3.6, GUNMETAL, metal);
  const [s0, s1] = [T(0, 0), T(9, 0)];
  m.capsule(s0[0], s0[1], 15, s1[0], s1[1], 15, 4.6, 4.6, C('gray', 0.26), metal);
  for (let k = 1; k < 4; k++) m.paint(...T(k * 2.3, 2.6), 0.8, 1.6, C('gray', 0.04));
  // Receiver body, a power cell under it, and the scope on top.
  m.slab(poly([[28, -6], [62, -6], [64, -2], [64, 7], [30, 7], [26, 2]]), 12, C('gray', 0.34), metal, { bevel: 2.5, thickness: 3 });
  m.slab(poly([[34, -7], [48, -7], [48, -12], [34, -12]]), 13, C('steel', 0.35), metal, { bevel: 1.2, thickness: 1.5 });
  const [c0, c1] = [T(30, 10), T(50, 10)];
  m.capsule(c0[0], c0[1], 15, c1[0], c1[1], 15, 2.4, 2.4, C('gray', 0.12), metal);
  m.sphere(c0[0], c0[1], 16, 2.2, C('steel', 0.5), MAT.glass);
  m.paint(...T(56, 3), 1.2, 1.2, G('red', 1), MAT.glow); // charge light
  // Grip, angled back toward the hand.
  m.slab(poly([[50, -6], [62, -6], [72, -26], [60, -28]]), 12, C('gray', 0.14), MAT.leather, { bevel: 2, thickness: 2.5 });
  // The gloved hand round the grip, the arm coming in from below right.
  const [g0, g1] = [T(56, -10), T(66, -24)];
  forearm(m, [104, 116, 18], [g1[0] + 6, g1[1] + 10, 18], 9);
  m.capsule(g0[0], g0[1], 20, g1[0], g1[1], 20, 7.5, 7, GLOVE, MAT.leather);
  for (let k = 0; k < 4; k++) {
    const [kx, ky] = T(54 + k * 3.6, -16 - k * 3);
    m.sphere(kx, ky, 25, 2.6, lighten(GLOVE, 0.05), MAT.leather);
  }
  const [t0, t1] = [T(50, -4), T(40, -2)];
  m.capsule(t0[0], t0[1], 23, t1[0], t1[1], 22, 2.8, 2.3, GLOVE, MAT.leather); // trigger finger along the frame
  const c = m.render(RENDER);
  if (fire) {
    const [nx, ny] = T(-3, 0);
    flash(c, nx, ny, 8, G('red', 1), G('red', 0), 5);
  }
  return c;
}

function blasterSheet() {
  return sheet([blasterFrame(), blasterFrame({ fire: true, kick: 3 }), blasterFrame({ kick: 7 }), blasterFrame({ kick: 3 })]);
}

/** The blaster lying on the floor, for a pickup. 64x32. */
function blasterPickup() {
  const m = new Model(64, 32, { seed: 105 });
  const metal = { ...MAT.metal, spec: 0.45, shine: 20, grain: 0.05 };
  m.capsule(6, 18, 4, 34, 18, 4, 2.6, 2.8, GUNMETAL, metal);
  m.capsule(4, 18, 5, 11, 18, 5, 3.4, 3.4, C('gray', 0.26), metal);
  m.slab([[30, 13], [56, 13], [58, 16], [58, 22], [32, 22]], 4, C('gray', 0.22), metal, { bevel: 1.5, thickness: 2 });
  m.capsule(32, 11, 6, 48, 11, 6, 1.8, 1.8, C('gray', 0.12), metal);
  m.slab([[48, 22], [57, 22], [60, 29], [52, 30]], 4, C('gray', 0.14), MAT.leather, { bevel: 1, thickness: 1.5 });
  return m.render({ ...RENDER, light: [-0.4, -0.8, 0.45] });
}

// ------------------------------------------------------------------ thermal detonator

const DET_METAL = { ...MAT.metal, spec: 0.7, shine: 26 };

/** A thermal detonator: a steel ball with a dark band and red lights round it. */
function detonator(m, x, y, z, r) {
  m.sphere(x, y, z, r, C('steel', 0.62), DET_METAL);
  m.ellipsoid(x, y + r * 0.1, z + 0.5, r * 1.02, r * 0.28, r * 1.02, C('gray', 0.18), MAT.metal);
  for (const k of [-0.5, 0, 0.5]) m.paint(x + k * r, y + r * 0.1, r * 0.13, r * 0.13, G('red', 1), MAT.glow, { minZ: z });
}

/** The fist holding a detonator (0), or the open hand after the throw (1). 124x134, the arm in from the bottom right. */
function detonatorFrame(open = false) {
  const m = new Model(124, 134, { seed: 107 });
  if (!open) {
    forearm(m, [104, 150, 4], [72, 80, 14], 11);
    detonator(m, 50, 58, 16, 15);
    fist(m, 66, 66, 20, 15, 1);
  } else {
    forearm(m, [112, 150, 4], [88, 82, 12], 11);
    m.ellipsoid(80, 62, 16, 15, 17, 7, GLOVE, MAT.leather); // the palm
    const fingers = [[42, 20], [56, 8], [72, 4], [88, 10]];
    fingers.forEach(([fx, fy], k) => m.capsule(70 + k * 4, 52, 18, fx, fy, 14, 4.2, 3.4, lighten(GLOVE, 0.04), MAT.leather));
    m.capsule(66, 72, 18, 34, 60, 14, 4.6, 3.6, GLOVE, MAT.leather); // thumb
  }
  return m.render(RENDER);
}

function detonatorSheet() {
  return sheet([detonatorFrame(), detonatorFrame(true)]);
}

/** One detonator in flight (16x16), or lying on the floor (16x16). */
function detonatorBall() {
  const m = new Model(16, 16, { seed: 109 });
  detonator(m, 8, 8, 6, 5.5);
  return m.render({ ...RENDER, light: [-0.4, -0.8, 0.45] });
}

/** A belt of five detonators on the floor. 48x24. */
function detonatorBelt() {
  const m = new Model(48, 24, { seed: 111 });
  m.capsule(3, 18, 2, 45, 18, 2, 2.2, 2.2, C('rust', 0.3), MAT.leather);
  for (let k = 0; k < 5; k++) detonator(m, 7 + k * 8.5, 14, 5, 4.2);
  return m.render({ ...RENDER, light: [-0.4, -0.8, 0.45] });
}

// ------------------------------------------------------------------ concussion rifle

/**
 * The concussion rifle: a heavy slotted barrel housing pointing up and in at
 * the crosshair from the bottom right, the gloved hand under it. `glow`
 * lights the vents blue (1 the shot, 0.5 its after-glow). 112x96.
 */
function concussionFrame({ kick = 0, glow = 0 } = {}) {
  const m = new Model(112, 96, { seed: 113 });
  const metal = { ...MAT.metal, spec: 0.5, shine: 22, grain: 0.05 };
  const [x0, y0, x1, y1] = [104, 100 + kick, 44, 8 + kick];
  m.capsule(x0, y0, 10, x1, y1, 16, 15, 11, C('gray', 0.22), metal); // the housing
  m.capsule(x1 + 4, y1 + 6, 18, x1 - 2, y1 - 3, 18, 7, 7, C('gray', 0.1), metal); // the muzzle
  for (let k = 1; k < 6; k++) {
    const t = k / 6.5;
    m.paint(x1 + (x0 - x1) * t * 0.8 - 4, y1 + (y0 - y1) * t * 0.8, 2.2, 3.2, glow ? G('cyan', glow) : C('gray', 0.04), glow ? MAT.glow : undefined);
  }
  forearm(m, [96, 130, 6], [72, 84 + kick, 18], 11);
  fist(m, 70, 80 + kick, 24, 12, 1);
  return m.render(RENDER);
}

function concussionSheet() {
  return sheet([concussionFrame(), concussionFrame({ kick: 4, glow: 1 }), concussionFrame({ kick: 2, glow: 0.5 })]);
}

/** The concussion rifle lying on the floor, for a pickup. 64x24. */
function concussionPickup() {
  const m = new Model(64, 24, { seed: 115 });
  const metal = { ...MAT.metal, spec: 0.5, shine: 22, grain: 0.05 };
  m.capsule(6, 12, 4, 44, 12, 4, 5, 5, C('gray', 0.22), metal);
  m.capsule(4, 12, 5, 9, 12, 5, 3.4, 3.4, C('gray', 0.1), metal);
  m.slab([[40, 10], [60, 12], [60, 16], [42, 18]], 3, C('rust', 0.3), MAT.leather, { bevel: 1, thickness: 1.5 }); // the stock
  for (let k = 0; k < 4; k++) m.paint(14 + k * 7, 10, 1.6, 1.2, C('gray', 0.04));
  return m.render({ ...RENDER, light: [-0.4, -0.8, 0.45] });
}

// ------------------------------------------------------------------ tracking fob

/**
 * The Guild's tracking fob held up in the right hand: a dark rounded puck,
 * a steel rim, a grille and a lens on top that blinks with the signal.
 * `light` is null (dark), 'amber' or 'green'. 96x96, the arm in from the
 * bottom right.
 */
function fobFrame(light = null) {
  const m = new Model(96, 96, { seed: 117 });
  const metal = { ...MAT.metal, spec: 0.5, shine: 22, grain: 0.06 };
  forearm(m, [112, 124, 4], [70, 78, 14], 10);
  // The body: a rounded slab, stood up and leaning a little right.
  m.slab([[34, 26], [56, 22], [62, 30], [64, 66], [58, 72], [40, 74], [34, 68], [30, 34]], 14, C('gray', 0.16), metal, { bevel: 3, thickness: 4 });
  m.slab([[38, 30], [54, 27], [58, 33], [59, 46], [40, 49], [37, 40]], 19, C('steel', 0.34), metal, { bevel: 1.5, thickness: 1.5 });
  for (let k = 0; k < 4; k++) m.paint(42 + k * 4, 58 + k * 0.4, 1.2, 4, C('gray', 0.05));
  // The lens on its top plate, and the light in it.
  const [lx, ly] = [48, 37];
  m.sphere(lx, ly, 21, 5, C('gray', 0.1), MAT.glass);
  if (light) m.sphere(lx, ly, 22, 3.6, G(light, 1), MAT.glow);
  else m.sphere(lx, ly, 22, 3.6, C('rust', 0.25), MAT.glass);
  // The gloved hand round its lower half, thumb across the front.
  m.ellipsoid(62, 70, 18, 11, 12, 8, GLOVE, MAT.leather);
  for (let k = 0; k < 4; k++) m.capsule(66, 60 + k * 4.5, 20, 58, 58 + k * 5, 22, 3, 2.6, lighten(GLOVE, 0.05), MAT.leather);
  m.capsule(54, 76, 22, 40, 64, 22, 3.4, 2.8, GLOVE, MAT.leather); // thumb
  const c = m.render(RENDER);
  if (light) flash(c, lx, ly, 7, G(light, 1), G(light, 0), 3);
  return c;
}

function fobSheet() {
  return sheet([fobFrame(), fobFrame('amber'), fobFrame('green')]);
}

export default [
  { name: 'fists', out: W('fists'), draw: fistsSheet, dither: 'fs' },
  { name: 'blaster', out: W('blaster'), draw: blasterSheet, dither: 'fs' },
  { name: 'pickup-blaster', out: 'assets/sprites/items/pickup-blaster.png', draw: blasterPickup, dither: 'fs' },
  { name: 'thermal-detonator', out: W('thermal-detonator'), draw: detonatorSheet, dither: 'fs' },
  { name: 'det-ball', out: 'assets/sprites/fx/thermal-detonator.png', draw: detonatorBall, dither: 'fs' },
  { name: 'det-pickup', out: 'assets/sprites/items/thermal-detonator.png', draw: detonatorBall, dither: 'fs' },
  { name: 'detonator-belt', out: 'assets/sprites/items/detonator-belt.png', draw: detonatorBelt, dither: 'fs' },
  { name: 'concussion-rifle', out: W('concussion-rifle'), draw: concussionSheet, dither: 'fs' },
  { name: 'fob', out: W('fob'), draw: fobSheet, dither: 'fs' },
  { name: 'pickup-concussion-rifle', out: 'assets/sprites/items/concussion-rifle.png', draw: concussionPickup, dither: 'fs' },
];
