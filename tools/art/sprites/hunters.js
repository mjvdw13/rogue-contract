// The bounty hunters: Boba Fett and Bossk, the Trandoshan. Placeholders built
// on the humanoid rig like the Imperials (imperials.js); the ripped Dark
// Forces art replaces them through assets/custom/overrides.json.
//
// Sheet layouts (64x64 frames), matching src/content/monsters/*.js:
//   Bossk: walk 0-3, aim 4, fire 5, pain 6, death 7-11
//   Boba Fett: hover 0, fire 1, death 2-5 (frame 2 doubles as pain)
import { C, G } from '../lib/pal.js';
import { Model, MAT, body } from '../lib/rig.js';
import { sheet, flash } from '../lib/sprite.js';
import { M, RENDER, W, H, BLACK, GUNMETAL, ARMOR, pose, rifle, fall, humanSheet } from './imperials.js';

// ------------------------------------------------------------------ Boba Fett

// 1.83 tall: a little taller than a trooper (54).
const BOBA_DIMS = { height: 56, build: 1.05 };
const PAINT = { ...ARMOR, spec: 0.3, grain: 0.06 }; // chipped, worn paint
const BOBA_GREEN = C('toxic', 0.42);
const BOBA_GREY = C('gray', 0.42);

/** The Mandalorian helmet: a green dome, a black T visor, a rangefinder stalk. */
function bobaHead(m, J) {
  const s = J.s;
  const [hx, hy, hz] = J.head;
  m.ellipsoid(hx, hy - 0.4 * s, hz, 4.6 * s, 5.4 * s, 4.7 * s, BOBA_GREEN, PAINT);
  m.ellipsoid(hx, hy + 2.6 * s, hz + 0.6, 4 * s, 2.8 * s, 4 * s, C('gray', 0.5), PAINT); // cheek plates
  m.paint(hx, hy - 0.6 * s, 3.8 * s, 1.2 * s, BLACK, MAT.glass); // the visor's crossbar
  m.paint(hx, hy + 1.8 * s, 1.1 * s, 2.6 * s, BLACK, MAT.glass); // and its slit
  m.paint(hx - 2.6 * s, hy - 2.6 * s, 0.8 * s, 1.6 * s, C('rust', 0.5)); // the dent above the visor
  // The rangefinder, on his right side (the viewer's left).
  m.capsule(hx - 4.4 * s, hy - 1 * s, hz, hx - 4.6 * s, hy - 8 * s, hz + 0.5, 0.6 * s, 0.5 * s, GUNMETAL, MAT.metal);
  m.sphere(hx - 4.6 * s, hy - 8.4 * s, hz + 0.5, 0.9 * s, C('orange', 0.6), MAT.metal);
}

const BOBA = {
  skin: BOBA_GREY,
  shirt: BOBA_GREY,
  pants: BOBA_GREY,
  shoes: C('gray', 0.18),
  shoeMat: MAT.leather,
  hands: C('gray', 0.2),
  sleeve: 'long',
  head: bobaHead,
  clothes(m, J) {
    const s = J.s;
    // The jetpack: two tanks behind the shoulders, the rocket between them
    // standing up past the head.
    for (const n of [-1, 1]) {
      m.capsule(J.neck[0] + n * 4 * s, J.neck[1] + 2 * s, -4 * s, J.neck[0] + n * 4 * s, J.chest[1] + 8 * s, -4 * s, 2.6 * s, 2.6 * s, C('gray', 0.55), MAT.metal);
    }
    m.capsule(J.neck[0] + 2.4 * s, J.neck[1] - 2 * s, -5 * s, J.neck[0] + 2.4 * s, J.neck[1] - 11 * s, -5 * s, 1.4 * s, 1.1 * s, C('gray', 0.6), MAT.metal);
    m.sphere(J.neck[0] + 2.4 * s, J.neck[1] - 11.6 * s, -5 * s, 1.2 * s, C('orange', 0.55), MAT.metal);
    // Green chest plates, an ammo belt, orange knee and shoulder pads.
    m.ellipsoid(J.chest[0] - 2.6 * s, J.chest[1] - 1 * s, J.chest[2] + 3.4 * s, 2.8 * s, 2.6 * s, 1.6 * s, BOBA_GREEN, PAINT);
    m.ellipsoid(J.chest[0] + 2.6 * s, J.chest[1] - 1 * s, J.chest[2] + 3.4 * s, 2.8 * s, 2.6 * s, 1.6 * s, BOBA_GREEN, PAINT);
    m.ellipsoid(J.belly[0], J.belly[1], J.belly[2] + 3.6 * s, 2.6 * s, 2.4 * s, 1.4 * s, BOBA_GREEN, PAINT);
    m.paint(J.pelvis[0], J.pelvis[1] - 2.4 * s, 6 * s, 1 * s, C('rust', 0.3), MAT.leather);
    for (const n of ['L', 'R']) {
      m.sphere(...J[`knee${n}`], 2.6 * s, C('orange', 0.45), PAINT);
      m.paint(J[`shoulder${n}`][0], J[`shoulder${n}`][1], 2.2 * s, 1.6 * s, C('orange', 0.45), PAINT);
    }
  },
};

// The flying stance: legs apart, knees bent, the jetpack holding him up.
const STANCE = { legL: { thigh: 10, knee: 26, spread: 26 }, legR: { thigh: -4, knee: 20, spread: 24 }, crouch: 1 };

function bobaFrame(p, { held = 'port', fire = false } = {}) {
  const m = new Model(W, H, { seed: 61 });
  const J = pose({ ...p, grip: p.grip ?? (held === 'aim' ? 'aim' : 'port') }, BOBA_DIMS);
  body(m, J, { ...BOBA, held: held === 'none' ? undefined : (mm, JJ) => rifle(mm, JJ, held === 'aim') });
  const c = m.render(RENDER);
  if (fire) flash(c, J.handL[0] - 0.5, J.handL[1] - 2, 6, G('yellow', 0.85), G('red', 0.5), 19);
  return { c, J };
}

function bobaSheet() {
  const falling = fall(bobaFrame({ grip: 'hurt', lean: -2 }, { held: 'none' }).c);
  return sheet([
    bobaFrame(STANCE).c,
    bobaFrame({ ...STANCE, grip: 'aim' }, { held: 'aim', fire: true }).c,
    falling[0], falling[2], falling[3], falling[4],
  ]);
}

// ------------------------------------------------------------------ Bossk

// About 1.95 tall, and heavier set than a man.
const BOSSK_DIMS = { height: 59, build: 1.15 };
const SCALES = { spec: 0.18, shine: 12, grain: 0.22 };
const HIDE = C('olive', 0.38);
const SUIT = C('orange', 0.5);

/** A Trandoshan's head: a heavy brow, a blunt snout and small red eyes. */
function bosskHead(m, J) {
  const s = J.s;
  const [hx, hy, hz] = J.head;
  m.ellipsoid(hx, hy - 0.6 * s, hz - 0.4, 4.6 * s, 4.8 * s, 4.6 * s, HIDE, SCALES);
  m.ellipsoid(hx, hy + 2 * s, hz + 2.6 * s, 3.4 * s, 2.6 * s, 3.6 * s, HIDE, SCALES); // snout
  m.ellipsoid(hx, hy + 3.8 * s, hz + 1.8 * s, 3 * s, 1.4 * s, 3 * s, C('olive', 0.3), SCALES); // jaw
  m.ellipsoid(hx, hy - 1.8 * s, hz + 3 * s, 4 * s, 1.1 * s, 1.6 * s, C('olive', 0.46), SCALES); // brow ridge
  m.dent(hx - 2 * s, hy - 0.4 * s, 1.1 * s, 0.8 * s, 1.2);
  m.dent(hx + 2 * s, hy - 0.4 * s, 1.1 * s, 0.8 * s, 1.2);
  m.paint(hx - 2 * s, hy - 0.4 * s, 0.6 * s, 0.5 * s, C('blood', 0.75), MAT.eye);
  m.paint(hx + 2 * s, hy - 0.4 * s, 0.6 * s, 0.5 * s, C('blood', 0.75), MAT.eye);
  m.stroke(hx - 2.4 * s, hy + 3 * s, hx + 2.4 * s, hy + 3 * s, 0.5 * s, C('gray', 0.1)); // the mouth line
}

const BOSSK = {
  skin: HIDE,
  skinMat: SCALES,
  shirt: SUIT,
  pants: SUIT,
  shins: HIDE, // bare, clawed feet
  shoes: HIDE,
  shoeMat: SCALES,
  hands: HIDE,
  sleeve: 'short',
  head: bosskHead,
  limbs: { fore: 1.1, shin: 1.1 },
  clothes(m, J) {
    const s = J.s;
    // A ribbed grey armour vest over the flight suit, and a belt of grey straps.
    m.ellipsoid(J.chest[0], J.chest[1] + 0.5 * s, J.chest[2] + 0.6, 6.4 * J.b * s, 6 * s, 4.9 * s, C('gray', 0.58), MAT.metal);
    for (let k = 0; k < 4; k++) m.paint(J.chest[0], J.chest[1] - 3 * s + k * 2.2 * s, 5.6 * J.b * s, 0.35 * s, C('gray', 0.3));
    m.paint(J.belly[0], J.belly[1] + 2.4 * s, 5.6 * J.b * s, 0.9 * s, C('gray', 0.55), MAT.leather);
    m.stroke(J.pelvis[0] - 4 * s, J.pelvis[1] - 1 * s, J.pelvis[0] + 1 * s, J.pelvis[1] + 3 * s, 0.7 * s, C('gray', 0.55));
  },
};

/** The concussion rifle: a rifle with a heavy barrel housing. */
function concussionRifle(m, J, aim) {
  rifle(m, J, aim);
  const l = J.handL;
  if (aim) m.sphere(l[0], l[1] - 1, l[2] + 5, 2.4, C('gray', 0.35), MAT.metal);
  else m.capsule(l[0] - 2, l[1] - 2, l[2] + 1, l[0] - 7, l[1] - 6, l[2] + 2, 1.8, 1.6, C('gray', 0.35), MAT.metal);
}

function bosskFrame(p, { held = 'port', fire = false } = {}) {
  const m = new Model(W, H, { seed: 71 });
  const J = pose({ ...p, grip: p.grip ?? (held === 'aim' ? 'aim' : 'port') }, BOSSK_DIMS);
  body(m, J, { ...BOSSK, held: held === 'none' ? undefined : (mm, JJ) => concussionRifle(mm, JJ, held === 'aim') });
  const c = m.render(RENDER);
  // The concussion blast leaves the barrel pale and white-hot.
  if (fire) flash(c, J.handL[0] - 0.5, J.handL[1] - 2, 6, G('pale', 1), G('cyan', 0.67), 23);
  return { c, J };
}

const bosskSheet = () => humanSheet(bosskFrame, { aimGrip: 'aim' });

export default [
  { name: 'boba-fett', out: M('boba-fett'), draw: bobaSheet, dither: 'fs' },
  { name: 'bossk', out: M('bossk'), draw: bosskSheet, dither: 'fs' },
];
