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

// ------------------------------------------------------------------ E-11 rifle

/**
 * The E-11 blaster rifle: a long barrel up and in at the crosshair from the
 * bottom, a scope along its top, the magazine out to the left and the gloved
 * hand on the grip. `fire` adds the red flash at the muzzle. 166x134 (Dark
 * Forces' frame, cut.mjs).
 */
function rifleFrame({ kick = 0, fire = false } = {}) {
  const m = new Model(166, 134, { seed: 119 });
  const metal = { ...MAT.metal, spec: 0.45, shine: 20, grain: 0.05 };
  const [x0, y0, x1, y1] = [120, 140 + kick, 92, 40 + kick];
  m.capsule(x0, y0, 10, x1, y1, 14, 9, 6, C('gray', 0.16), metal); // the body
  m.capsule(x1 + 2, y1 + 6, 15, x1 - 3, y1 - 12, 15, 3.6, 3.4, GUNMETAL, metal); // the barrel
  m.capsule(x0 - 4, y0 - 26, 20, x1 + 10, y1 + 26, 20, 4, 4, C('gray', 0.1), metal); // the scope
  m.sphere(x1 + 10, y1 + 26, 21, 3.2, C('steel', 0.5), MAT.glass);
  m.slab([[70, 90 + kick], [104, 82 + kick], [106, 92 + kick], [72, 100 + kick]], 12, C('gray', 0.2), metal, { bevel: 1.5, thickness: 2 }); // the magazine
  forearm(m, [150, 150, 6], [128, 108 + kick, 18], 10);
  fist(m, 124, 104 + kick, 22, 11, 1);
  const c = m.render(RENDER);
  if (fire) flash(c, x1 - 4, y1 - 16, 10, G('red', 1), G('red', 0), 6);
  return c;
}

function rifleSheet() {
  return sheet([rifleFrame(), rifleFrame({ kick: 3, fire: true })]);
}

/** The rifle lying on the floor, for a pickup (and a trooper's drop). 64x24. */
function riflePickup() {
  const m = new Model(64, 24, { seed: 121 });
  const metal = { ...MAT.metal, spec: 0.45, shine: 20, grain: 0.05 };
  m.capsule(4, 13, 4, 30, 13, 4, 2, 2, GUNMETAL, metal);
  m.capsule(24, 13, 4, 50, 13, 4, 4, 4, C('gray', 0.16), metal);
  m.capsule(28, 8, 6, 44, 8, 6, 1.8, 1.8, C('gray', 0.1), metal);
  m.slab([[30, 15], [36, 15], [34, 22], [28, 22]], 3, C('gray', 0.2), metal, { bevel: 1, thickness: 1.5 });
  m.slab([[48, 11], [60, 13], [60, 18], [48, 17]], 3, C('gray', 0.12), metal, { bevel: 1, thickness: 1.5 });
  return m.render({ ...RENDER, light: [-0.4, -0.8, 0.45] });
}

// ------------------------------------------------------------------ Imperial repeater

/**
 * The Imperial repeater: a squat boxy gun pointing up at the crosshair, a
 * row of charge lights down its side that glow amber as it fires (`lit`),
 * the gloved hand on the grip. 126x110 (Dark Forces' frame, cut.mjs).
 */
function repeaterFrame({ kick = 0, lit = false } = {}) {
  const m = new Model(126, 110, { seed: 123 });
  const metal = { ...MAT.metal, spec: 0.45, shine: 20, grain: 0.05 };
  const k = kick;
  m.slab([[34, 30 + k], [88, 24 + k], [96, 110], [40, 116]], 12, C('gray', 0.18), metal, { bevel: 4, thickness: 6 }); // the body
  m.slab([[44, 18 + k], [78, 14 + k], [82, 30 + k], [46, 34 + k]], 18, C('gray', 0.1), metal, { bevel: 2, thickness: 3 }); // the muzzle block
  for (const x of [54, 70]) m.sphere(x, 22 + k, 22, 3.4, C('gray', 0.02), MAT.metal); // the barrels' mouths
  for (let j = 0; j < 6; j++) m.paint(42 + j * 1.2, 44 + j * 9 + k, 2.4, 2.4, lit ? G('amber', 1) : C('orange', 0.3), lit ? MAT.glow : undefined);
  forearm(m, [130, 130, 6], [104, 88 + k, 18], 10);
  fist(m, 96, 84 + k, 24, 11, 1);
  const c = m.render(RENDER);
  if (lit) flash(c, 62, 14 + k, 9, G('amber', 1), G('amber', 0), 5);
  return c;
}

function repeaterSheet() {
  return sheet([repeaterFrame(), repeaterFrame({ kick: 3 }), repeaterFrame({ kick: 2, lit: true })]);
}

/** The repeater lying on the floor, for a pickup. 64x24. */
function repeaterPickup() {
  const m = new Model(64, 24, { seed: 125 });
  const metal = { ...MAT.metal, spec: 0.45, shine: 20, grain: 0.05 };
  m.slab([[8, 8], [44, 8], [46, 18], [8, 18]], 5, C('gray', 0.18), metal, { bevel: 1.5, thickness: 3 });
  m.slab([[2, 9], [10, 9], [10, 16], [2, 16]], 5, C('gray', 0.1), metal, { bevel: 1, thickness: 2 });
  for (let j = 0; j < 5; j++) m.paint(16 + j * 5, 10, 1.2, 1.2, C('orange', 0.45));
  m.slab([[40, 16], [48, 16], [52, 23], [44, 23]], 4, C('gray', 0.12), MAT.leather, { bevel: 1, thickness: 1.5 });
  return m.render({ ...RENDER, light: [-0.4, -0.8, 0.45] });
}

// ------------------------------------------------------------------ Jeron fusion cutter

/**
 * The Jeron fusion cutter: a wide dark gun held low across the bottom of
 * the view, four fat barrels side by side along its top. `lit` is the
 * barrel glowing green from its shot (1-4), or none. 302x96 (Dark Forces'
 * frame, cut.mjs).
 */
function fusionFrame(lit = 0) {
  const m = new Model(302, 96, { seed: 127 });
  const metal = { ...MAT.metal, spec: 0.45, shine: 20, grain: 0.05 };
  m.slab([[20, 70], [270, 56], [300, 96], [10, 100]], 8, C('gray', 0.14), metal, { bevel: 5, thickness: 8 }); // the body
  for (let k = 0; k < 4; k++) {
    const x = 92 + k * 46;
    const y = 44 + k * 4;
    m.capsule(x - 10, y + 16, 16, x + 14, y - 10, 18, 16, 14, C('gray', 0.2), metal);
    m.paint(x + 4, y - 2, 6, 3, C('orange', 0.45)); // the copper band
    if (lit === k + 1) m.capsule(x - 6, y + 10, 30, x + 10, y - 6, 30, 9, 8, G('green', 0.8), MAT.glow);
  }
  m.sphere(48, 76, 20, 14, C('gray', 0.1), metal);
  forearm(m, [304, 110, 6], [266, 76, 18], 10);
  fist(m, 258, 74, 24, 11, 1);
  return m.render(RENDER);
}

function fusionSheet() {
  return sheet([0, 1, 2, 3, 4].map(fusionFrame));
}

/** The fusion cutter lying on the floor, for a pickup. 32x24. */
function fusionPickup() {
  const m = new Model(32, 24, { seed: 129 });
  const metal = { ...MAT.metal, spec: 0.45, shine: 20, grain: 0.05 };
  m.slab([[4, 12], [28, 12], [28, 22], [4, 22]], 4, C('gray', 0.14), metal, { bevel: 1.5, thickness: 3 });
  for (let k = 0; k < 4; k++) m.capsule(7 + k * 6, 14, 8, 7 + k * 6, 6, 8, 2.6, 2.6, C('gray', 0.22), metal);
  return m.render({ ...RENDER, light: [-0.4, -0.8, 0.45] });
}

// ------------------------------------------------------------------ I.M. mines

/** An I.M. mine: a flat steel disc, rust-red bands across it, a light in the middle. */
function mineDisc(m, x, y, z, r, armed = false) {
  m.ellipsoid(x, y, z, r, r * 0.45, r * 0.3, C('gray', 0.55), DET_METAL);
  m.paintPoly([[x - r * 0.9, y - 2], [x + r * 0.9, y - 2], [x + r * 0.9, y + 1], [x - r * 0.9, y + 1]], C('rust', 0.45));
  m.sphere(x, y - r * 0.1, z + r * 0.25, r * 0.12, armed ? G('red', 1) : C('gray', 0.2), armed ? MAT.glow : MAT.metal);
}

/** The gloved hand holding a mine out flat (0), its light red once armed (1). 184x95. */
function mineFrame(armed = false) {
  const m = new Model(184, 95, { seed: 131 });
  mineDisc(m, 70, 58, 14, 46, armed);
  forearm(m, [190, 110, 4], [150, 70, 16], 11);
  m.ellipsoid(136, 60, 22, 16, 12, 8, GLOVE, MAT.leather); // the hand over its edge
  for (let k = 0; k < 4; k++) m.capsule(132 - k * 3, 52 + k * 5, 26, 112 - k * 2, 54 + k * 6, 24, 3.4, 3, lighten(GLOVE, 0.05), MAT.leather);
  return m.render(RENDER);
}

function mineSheet() {
  return sheet([mineFrame(), mineFrame(true)]);
}

/** One mine lying on the floor (in play, and the pickup of one). 24x16. */
function mineLying() {
  const m = new Model(24, 16, { seed: 133 });
  mineDisc(m, 12, 10, 3, 10, true);
  return m.render({ ...RENDER, light: [-0.4, -0.8, 0.45] });
}

/** A stack of mines, for the pickup of five. 32x24. */
function mineStack() {
  const m = new Model(32, 24, { seed: 135 });
  for (let k = 0; k < 4; k++) mineDisc(m, 16, 20 - k * 4, 3 + k * 3, 12);
  return m.render({ ...RENDER, light: [-0.4, -0.8, 0.45] });
}

// ------------------------------------------------------------------ Packered mortar gun

/**
 * The Packered mortar gun: a fat round launcher held low in the middle,
 * pointing up, its mouth glowing as it fires (`glow` 0-1). 198x132 (Dark
 * Forces' frame, cut.mjs).
 */
function mortarFrame({ kick = 0, glow = 0 } = {}) {
  const m = new Model(198, 132, { seed: 137 });
  const metal = { ...MAT.metal, spec: 0.55, shine: 24, grain: 0.04 };
  m.capsule(100, 150, 10, 96, 40 + kick, 16, 40, 30, C('gray', 0.32), metal); // the tube
  m.ellipsoid(96, 36 + kick, 30, 28, 10, 8, C('gray', 0.12), metal); // its mouth
  if (glow) m.ellipsoid(96, 36 + kick, 36, 22 * glow, 7 * glow, 4, G('amber', glow), MAT.glow);
  for (const x of [62, 130]) m.capsule(x, 120, 14, x + (x < 96 ? 6 : -6), 70 + kick, 20, 8, 7, C('orange', 0.4), MAT.brass); // the side rails
  forearm(m, [200, 150, 4], [160, 104 + kick, 16], 11);
  fist(m, 152, 98 + kick, 24, 12, 1);
  forearm(m, [-4, 150, 4], [36, 104 + kick, 16], 11);
  fist(m, 44, 98 + kick, 24, 12, -1);
  return m.render(RENDER);
}

function mortarSheet() {
  return sheet([mortarFrame(), mortarFrame({ kick: 8, glow: 1 }), mortarFrame({ kick: 4, glow: 0.7 }), mortarFrame({ kick: 2, glow: 0.4 })]);
}

/** The mortar gun lying on the floor, for a pickup. 64x24. */
function mortarPickup() {
  const m = new Model(64, 24, { seed: 139 });
  const metal = { ...MAT.metal, spec: 0.55, shine: 24, grain: 0.04 };
  m.capsule(8, 13, 6, 46, 13, 6, 6, 6, C('gray', 0.32), metal);
  m.ellipsoid(6, 13, 7, 3, 6, 6, C('gray', 0.1), metal);
  m.slab([[44, 12], [60, 14], [60, 18], [44, 18]], 4, C('gray', 0.14), metal, { bevel: 1, thickness: 1.5 });
  return m.render({ ...RENDER, light: [-0.4, -0.8, 0.45] });
}

/** A mortar shell tumbling through the air (6 frames, turning). 16x16. */
function mortarShellFlying() {
  return sheet(
    [0, 1, 2, 3, 4, 5].map((k) => {
      const m = new Model(16, 16, { seed: 141 });
      const a = (k * Math.PI) / 3;
      const [dx, dy] = [Math.cos(a) * 4, Math.sin(a) * 4];
      m.capsule(8 - dx, 8 - dy, 4, 8 + dx, 8 + dy, 4, 2.6, 2.2, C('orange', 0.5), MAT.brass);
      m.sphere(8 + dx * 1.2, 8 + dy * 1.2, 4, 2.2, C('gray', 0.45), MAT.metal);
      return m.render({ ...RENDER, light: [-0.4, -0.8, 0.45] });
    }),
  );
}

// ------------------------------------------------------------------ tracking fob

/**
 * The Guild's tracking fob held up in the right hand: a dark rounded puck,
 * a steel rim, a grille and a lens on top that blinks with the signal.
 * `light` is null (dark), 'red', 'yellow' or 'green'. 96x96, the arm in
 * from the bottom right.
 */
// Each light's core and the edge of its glow.
const FOB_LIGHTS = {
  red: [G('red', 1), G('red', 0)],
  yellow: [G('yellow', 0.6), G('yellow', 0.35)],
  green: [G('green', 1), G('green', 0)],
};
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
  if (light) m.sphere(lx, ly, 22, 3.6, FOB_LIGHTS[light][0], MAT.glow);
  else m.sphere(lx, ly, 22, 3.6, C('rust', 0.25), MAT.glass);
  // The gloved hand round its lower half, thumb across the front.
  m.ellipsoid(62, 70, 18, 11, 12, 8, GLOVE, MAT.leather);
  for (let k = 0; k < 4; k++) m.capsule(66, 60 + k * 4.5, 20, 58, 58 + k * 5, 22, 3, 2.6, lighten(GLOVE, 0.05), MAT.leather);
  m.capsule(54, 76, 22, 40, 64, 22, 3.4, 2.8, GLOVE, MAT.leather); // thumb
  const c = m.render(RENDER);
  if (light) flash(c, lx, ly, 7, ...FOB_LIGHTS[light], 3);
  return c;
}

function fobSheet() {
  return sheet([fobFrame(), fobFrame('red'), fobFrame('yellow'), fobFrame('green')]);
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
  { name: 'rifle', out: W('rifle'), draw: rifleSheet, dither: 'fs' },
  { name: 'pickup-rifle', out: 'assets/sprites/items/rifle.png', draw: riflePickup, dither: 'fs' },
  { name: 'repeater', out: W('repeater'), draw: repeaterSheet, dither: 'fs' },
  { name: 'pickup-repeater', out: 'assets/sprites/items/repeater.png', draw: repeaterPickup, dither: 'fs' },
  { name: 'fusion-cutter', out: W('fusion-cutter'), draw: fusionSheet, dither: 'fs' },
  { name: 'mines', out: W('mines'), draw: mineSheet, dither: 'fs' },
  { name: 'mine-lying', out: 'assets/sprites/fx/mine.png', draw: mineLying, dither: 'fs' },
  { name: 'pickup-mine', out: 'assets/sprites/items/mine.png', draw: mineLying, dither: 'fs' },
  { name: 'pickup-mine-pack', out: 'assets/sprites/items/mine-pack.png', draw: mineStack, dither: 'fs' },
  { name: 'mortar', out: W('mortar'), draw: mortarSheet, dither: 'fs' },
  { name: 'pickup-mortar', out: 'assets/sprites/items/mortar.png', draw: mortarPickup, dither: 'fs' },
  { name: 'mortar-shell-flying', out: 'assets/sprites/fx/mortar-shell.png', draw: mortarShellFlying, dither: 'fs' },
  { name: 'pickup-fusion-cutter', out: 'assets/sprites/items/fusion-cutter.png', draw: fusionPickup, dither: 'fs' },
];
