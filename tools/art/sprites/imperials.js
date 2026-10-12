// The enemies: Imperial stormtroopers and officers (built on the humanoid rig
// in lib/rig.js) and a hovering probe droid. Modelled with shaded 3D
// primitives like every other sprite, facing the viewer.
//
// Sheet layout (64x64 frames), matching src/content/monsters/*.js:
//   people: walk 0-3, aim 4, fire 5, pain 6, death 7-11
//   probe droid: hover 0-3, aim 4, fire 5, pain 6, death 7-11
import { mix, darken, lighten } from '../lib/canvas.js';
import { C, G } from '../lib/pal.js';
import { Model, MAT, skeleton, body } from '../lib/rig.js';
import { sheet, flash, rotate, shift } from '../lib/sprite.js';
import { PixelCanvas } from '../lib/canvas.js';

const M = (name) => `assets/sprites/monsters/${name}.png`;
const RENDER = { light: [-0.5, -0.6, 0.62], ambient: 0.32, aoStrength: 0.45 };
const W = 64;
const H = 64;

/** Glossy white armour plastic. */
const ARMOR = { spec: 0.55, shine: 22, grain: 0.02 };
const WHITE = C('gray', 0.9);
const BLACK = C('gray', 0.07);
const GUNMETAL = C('gray', 0.14);

// ------------------------------------------------------------------ poses

/** Walk cycle legs: thigh swing and knee bend for frames 0-3. */
const STRIDE = [
  { legL: { thigh: 22, knee: 10 }, legR: { thigh: -16, knee: 26 }, bob: 0 },
  { legL: { thigh: 4, knee: 6 }, legR: { thigh: 2, knee: 8 }, bob: -1 },
  { legL: { thigh: -16, knee: 26 }, legR: { thigh: 22, knee: 10 }, bob: 0 },
  { legL: { thigh: 2, knee: 8 }, legR: { thigh: 4, knee: 6 }, bob: -1 },
];

const DIMS = { height: 54, build: 1.05 };

/**
 * Joints for a pose, with the hands placed relative to the chest:
 * `grip` 'port' holds a rifle across the body, 'aim' points it at the viewer,
 * 'pistol' raises one hand toward the viewer, 'side' lets the arms hang.
 */
function pose(p = {}) {
  const J0 = skeleton(W, H, p, DIMS);
  const c = J0.chest;
  const arms = {
    port: { armR: { reach: [c[0] + 5, c[1] + 7, c[2] + 7] }, armL: { reach: [c[0] - 4, c[1] + 2, c[2] + 9] } },
    aim: { armR: { reach: [c[0] + 3, c[1] + 2, c[2] + 12] }, armL: { reach: [c[0] - 1, c[1] + 3, c[2] + 15] } },
    pistol: { armR: { reach: [c[0] + 4, c[1] + 1, c[2] + 15] }, armL: { spread: 12, swing: 6, bend: 18 } },
    side: { armR: { spread: 10, swing: 4 }, armL: { spread: 10, swing: -4 } },
    hurt: { armR: { spread: 40, swing: -20, bend: 40 }, armL: { spread: 35, swing: -10, bend: 30 } },
  }[p.grip ?? 'port'];
  return skeleton(W, H, { ...p, ...arms }, DIMS);
}

/** A blaster rifle held in both hands; `aim` points it at the viewer. */
function rifle(m, J, aim) {
  const r = J.handR;
  const l = J.handL;
  if (aim) {
    m.capsule(r[0], r[1], r[2], l[0], l[1] - 1, l[2] + 4, 1.6, 1.4, GUNMETAL, MAT.metal);
    m.sphere(l[0], l[1] - 1, l[2] + 5, 1.6, BLACK, MAT.metal);
  } else {
    m.capsule(r[0] + 3, r[1] + 2, r[2] - 1, l[0] - 5, l[1] - 4, l[2] + 2, 1.5, 1.2, GUNMETAL, MAT.metal);
    m.capsule(r[0] + 1, r[1], r[2], r[0] + 2, r[1] + 4, r[2] + 1, 0.9, 0.8, GUNMETAL, MAT.metal); // grip
    m.capsule(l[0] - 2, l[1] - 2, l[2] + 1, l[0] - 6, l[1] - 5, l[2] + 2, 0.8, 0.7, GUNMETAL, MAT.metal); // barrel
  }
}

function pistol(m, J) {
  const h = J.handR;
  m.capsule(h[0], h[1] - 0.5, h[2], h[0], h[1] - 1, h[2] + 4, 1.2, 1, GUNMETAL, MAT.metal);
}

// ------------------------------------------------------------------ stormtrooper

/** White armour helmet: dome, black eye lenses, a dark breathing grille. */
function trooperHead(m, J) {
  const s = J.s;
  const [hx, hy, hz] = J.head;
  m.ellipsoid(hx, hy - 0.4 * s, hz, 4.7 * s, 5.2 * s, 4.8 * s, WHITE, ARMOR);
  m.ellipsoid(hx, hy + 2.8 * s, hz + 0.8, 3.8 * s, 2.6 * s, 3.8 * s, WHITE, ARMOR); // jaw guard
  m.ellipsoid(hx - 1.8 * s, hy + 0.2 * s, hz + 4.1 * s, 1.5 * s, 1.2 * s, 0.8 * s, BLACK, MAT.glass);
  m.ellipsoid(hx + 1.8 * s, hy + 0.2 * s, hz + 4.1 * s, 1.5 * s, 1.2 * s, 0.8 * s, BLACK, MAT.glass);
  m.paint(hx, hy + 3.4 * s, 1.6 * s, 0.9 * s, C('gray', 0.3));
  m.paint(hx, hy - 2.6 * s, 3.8 * s, 0.5 * s, C('gray', 0.55)); // brow ridge
}

const TROOPER = {
  skin: BLACK,
  shirt: WHITE,
  shirtMat: ARMOR,
  pants: WHITE,
  pantsMat: ARMOR,
  shoes: WHITE,
  shoeMat: ARMOR,
  hands: BLACK,
  sleeve: 'long',
  head: trooperHead,
  clothes(m, J) {
    const s = J.s;
    // Black joints showing between plates, a utility belt and a chest plate edge.
    m.ellipsoid(J.pelvis[0], J.pelvis[1] - 2.2 * s, J.pelvis[2] + 0.5, 6.1 * J.b * s, 1.1 * s, 4.4 * s, C('gray', 0.82), ARMOR);
    m.paint(J.belly[0], J.belly[1] + 0.5 * s, 5 * s, 1 * s, BLACK);
    m.paint(J.belly[0], J.belly[1] - 2.4 * s, 4.6 * s, 0.6 * s, C('gray', 0.4));
    for (const n of ['L', 'R']) m.paint(...J[`knee${n}`].slice(0, 2), 2.4 * s, 0.9 * s, BLACK);
  },
};

function trooperFrame(p, { held = 'port', fire = false } = {}) {
  const m = new Model(W, H, { seed: 31 });
  const J = pose({ ...p, grip: p.grip ?? (held === 'aim' ? 'aim' : 'port') });
  body(m, J, { ...TROOPER, held: held === 'none' ? undefined : (mm, JJ) => rifle(mm, JJ, held === 'aim') });
  const c = m.render(RENDER);
  if (fire) flash(c, J.handL[0] - 0.5, J.handL[1] - 2, 5, G('red', 1), G('red', 0), 11);
  return { c, J };
}

/**
 * Falling down: the body turns about its middle (so it stays inside the
 * frame) and is dropped so its lowest point rests on the floor.
 */
function fall(stand) {
  return [0.2, 0.6, 1.1, 1.5, 1.57].map((a, i) => {
    const body = rotate(stand, -a, 32, 36);
    let low = 0;
    body.eachOpaque((x, y) => {
      low = Math.max(low, y);
      return undefined;
    });
    const out = shift(body, 0, H - 2 - low);
    if (i === 4) {
      // A scorch mark under the body.
      for (let x = 14; x < 50; x++) if (!out.opaque(x, H - 2)) out.set(x, H - 2, C('gray', 0.08));
    }
    return out;
  });
}

function humanSheet(frameFn, { aimGrip }) {
  const frames = STRIDE.map((s) => frameFn(s).c);
  frames.push(frameFn({ grip: aimGrip }, { held: 'aim' }).c);
  frames.push(frameFn({ grip: aimGrip }, { held: 'aim', fire: true }).c);
  frames.push(frameFn({ grip: 'hurt', lean: -3, headTilt: -2 }, { held: 'none' }).c);
  const { c: stand } = frameFn({ grip: 'hurt', lean: -2 }, { held: 'none' });
  frames.push(...fall(stand));
  return sheet(frames);
}

const trooperSheet = () => humanSheet(trooperFrame, { aimGrip: 'aim' });

// ------------------------------------------------------------------ officer

const OFFICER_GREY = mix(C('olive', 0.42), C('gray', 0.42), 0.55);

/** Officer: a peaked cap over a face. */
function officerHead(m, J) {
  const s = J.s;
  const [hx, hy, hz] = J.head;
  const skin = C('skin', 0.62);
  m.ellipsoid(hx, hy, hz, 4.2 * s, 5 * s, 4.4 * s, skin, MAT.skin);
  m.ellipsoid(hx, hy + 2.6 * s, hz + 0.6, 3 * s, 2.2 * s, 3.2 * s, skin, MAT.skin);
  m.ellipsoid(hx, hy + 0.6 * s, hz + 4 * s, 0.8 * s, 1.3 * s, 1.1 * s, skin, MAT.skin);
  m.dent(hx - 1.6 * s, hy - 0.2 * s, 1.3 * s, 1 * s, 1.1);
  m.dent(hx + 1.6 * s, hy - 0.2 * s, 1.3 * s, 1 * s, 1.1);
  m.paint(hx - 1.6 * s, hy, 0.6 * s, 0.5 * s, C('gray', 0.1));
  m.paint(hx + 1.6 * s, hy, 0.6 * s, 0.5 * s, C('gray', 0.1));
  m.paint(hx, hy + 3 * s, 1.4 * s, 0.4 * s, C('flesh', 0.3));
  // Cap: crown and visor.
  m.ellipsoid(hx, hy - 3.6 * s, hz - 0.2, 5 * s, 2.2 * s, 4.8 * s, OFFICER_GREY, MAT.cloth);
  m.ellipsoid(hx, hy - 2.4 * s, hz + 3.4 * s, 3.4 * s, 0.7 * s, 1.6 * s, BLACK, MAT.leather);
}

const OFFICER = {
  skin: C('skin', 0.62),
  shirt: OFFICER_GREY,
  pants: OFFICER_GREY,
  shins: BLACK, // tall boots
  shoes: BLACK,
  hands: BLACK,
  sleeve: 'long',
  head: officerHead,
  clothes(m, J) {
    const s = J.s;
    m.paint(J.belly[0], J.belly[1] + 2 * s, 5.4 * s, 0.9 * s, BLACK); // belt
    m.paint(J.belly[0], J.belly[1] + 2 * s, 0.9 * s, 0.9 * s, C('gray', 0.7)); // buckle
    // Rank plaque: red and blue tiles on the left breast.
    for (let k = 0; k < 3; k++) {
      m.paint(J.chest[0] - 3.8 * s + k * 1.1 * s, J.chest[1] - 1.5 * s, 0.45 * s, 0.4 * s, k % 2 ? C('blood', 0.7) : C('steel', 0.7));
    }
  },
};

function officerFrame(p, { held = 'side', fire = false } = {}) {
  const m = new Model(W, H, { seed: 41 });
  const J = pose({ ...p, grip: p.grip ?? (held === 'aim' ? 'pistol' : 'side') });
  body(m, J, { ...OFFICER, held: held === 'none' ? undefined : (mm, JJ) => pistol(mm, JJ) });
  const c = m.render(RENDER);
  if (fire) flash(c, J.handR[0], J.handR[1] - 1.5, 4, G('red', 1), G('red', 0), 13);
  return { c, J };
}

const officerSheet = () => humanSheet(officerFrame, { aimGrip: 'pistol' });

// ------------------------------------------------------------------ probe droid

/** A black spherical probe with a lens array, antennae and dangling manipulator arms. */
function probeModel(m, { bob = 0, sway = 0, lens = 0.8, hurt = false } = {}) {
  const cx = 32;
  const cy = 22 + bob;
  const shell = C('gray', 0.13);
  const glossy = { spec: 0.7, shine: 30, grain: 0.03 };
  // Dangling arms.
  for (let k = 0; k < 5; k++) {
    const x = cx - 10 + k * 5;
    const sw = sway * (k % 2 ? 1 : -1);
    const knee = [x + sw * 0.6, cy + 18, 2];
    const tip = [x + sw, cy + 32 + (k % 2) * 3, 3];
    m.capsule(x, cy + 8, 0, ...knee, 1.1, 0.9, C('gray', 0.28), MAT.metal);
    m.capsule(...knee, ...tip, 0.9, 0.6, C('gray', 0.32), MAT.metal);
    m.sphere(...tip, 1.1, C('gray', 0.4), MAT.metal);
  }
  // Body: a dome on a lower ring.
  m.ellipsoid(cx, cy, 0, 13, 12, 12, shell, glossy);
  m.ellipsoid(cx, cy + 8, 0, 10, 4, 10, C('gray', 0.2), MAT.metal);
  // Lenses: a band of black eyes with glowing red cores.
  for (const [dx, dy, r] of [[-6, -2, 2.4], [0, -3, 2.8], [6, -2, 2.4], [-3, 3, 1.8], [3, 3, 1.8]]) {
    m.ellipsoid(cx + dx, cy + dy, 10.5, r, r, 1.4, BLACK, MAT.glass);
    m.paint(cx + dx, cy + dy, r * 0.45, r * 0.45, hurt ? G('amber', 1) : G('red', lens), MAT.glow);
  }
  // Antennae.
  m.capsule(cx + 6, cy - 9, 0, cx + 9, cy - 20, -2, 0.6, 0.4, C('gray', 0.5), MAT.metal);
  m.capsule(cx - 4, cy - 10, 0, cx - 6, cy - 17, -2, 0.6, 0.4, C('gray', 0.5), MAT.metal);
}

function probeFrame(o = {}) {
  const m = new Model(W, H, { seed: 51 });
  probeModel(m, o);
  const c = m.render(RENDER);
  if (o.fire) flash(c, 32, 22 + (o.bob ?? 0) + 7, 4, G('red', 1), G('red', 0), 17);
  return c;
}

/** Breaking up: sparks, a tilt, then wreckage on the floor. */
function probeDeath() {
  const out = [];
  const base = probeFrame({ hurt: true });
  for (let i = 0; i < 5; i++) {
    const f = new PixelCanvas(W, H);
    const drop = [0, 6, 18, 30, 34][i];
    const tilt = [0.15, 0.4, 0.9, 1.4, 1.5][i];
    let b = rotate(base, tilt, 32, 22);
    b = shift(b, 0, drop);
    f.blit(b, 0, 0);
    if (i < 3) {
      flash(f, 28 + i * 3, 20 + drop, 6 + i * 2, G('yellow', 1), G('yellow', 0.3), 21 + i);
    }
    if (i === 4) {
      // Smoke-blackened wreck: crop to the floor.
      f.each((x, y, p) => (p && y < 40 ? null : undefined));
    }
    out.push(f);
  }
  return out;
}

function probeSheet() {
  const frames = [0, 1, 2, 3].map((k) => probeFrame({ bob: [0, -1, 0, 1][k], sway: [0, 2, 0, -2][k] }));
  frames.push(probeFrame({ lens: 1, bob: -1 }));
  frames.push(probeFrame({ lens: 1, bob: -1, fire: true }));
  frames.push(probeFrame({ hurt: true, sway: 3 }));
  frames.push(...probeDeath());
  return sheet(frames);
}

export default [
  { name: 'stormtrooper', out: M('stormtrooper'), draw: trooperSheet, dither: 'fs' },
  { name: 'officer', out: M('officer'), draw: officerSheet, dither: 'fs' },
  { name: 'probe-droid', out: M('probe-droid'), draw: probeSheet, dither: 'fs' },
];
