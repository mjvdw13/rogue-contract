// The battle station's droids: the mouse droid (a friendly) and the
// interrogation droid (a monster).
//
// Frame layouts:
//   mouse droid (40x24): the drive cycle from five sides, four frames each
//     (front 0-3, front three-quarter 4-7, side 8-11, back three-quarter
//     12-15, back 16-19; the lamp is lit on the even frames), react 20,
//     pain 21, death 22-25
//   interrogation droid (48x44): hover 0-3, needle drawn back 4, the stab 5,
//     pain 6, death 7-11
import { PixelCanvas } from '../lib/canvas.js';
import { C, G } from '../lib/pal.js';
import { Model, MAT } from '../lib/model.js';
import { sheet, flash, rotate, shift } from '../lib/sprite.js';
import { M, RENDER } from './imperials.js';

// ------------------------------------------------------------------ mouse droid
//
// A box on wheels has to point where it drives, so it's built as a few solid
// blocks and drawn from each side: flat-shaded faces, painted back to front
// at four times the size and shrunk, which keeps the edges clean on a body
// 16 pixels tall.

const MW = 40;
const MH = 24;
const SS = 4; // supersampling
const PITCH = 0.3; // the camera looks down a little, to show the top
const SUN = norm3([-0.45, 0.5, 0.75]); // in view space: from the viewer's upper left

function norm3(v) {
  const l = Math.hypot(...v) || 1;
  return v.map((n) => n / l);
}

/**
 * A block with a rectangular base and top (the top may be smaller, or set
 * back, for slanted sides). Coordinates are the droid's own, in pixels: x
 * forward, y to its left, z up. Returns its five visible faces.
 */
function block([x0, x1, y0, y1, z0], [X0, X1, Y0, Y1, z1], tone, sideTone = tone) {
  const b = [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]];
  const t = [[X0, Y0, z1], [X1, Y0, z1], [X1, Y1, z1], [X0, Y1, z1]];
  const faces = [{ pts: [t[0], t[1], t[2], t[3]], tone }];
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    faces.push({ pts: [b[j], b[i], t[i], t[j]], tone: sideTone });
  }
  return faces;
}

/** The droid's faces. `roll` turns the wheels' hub marks; `lean` tips nothing here (see mouseFrame). */
function mouseFaces(roll) {
  const faces = [];
  // Wheels: four dark blocks under the corners, with a pale hub mark that
  // swaps ends as they turn.
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      const cx = sx * 8.5;
      const y0 = sy > 0 ? 5.5 : -7.5;
      faces.push(...block([cx - 3, cx + 3, y0, y0 + 2, 0], [cx - 2.4, cx + 2.4, y0, y0 + 2, 5], 0.2, 0.1));
      const hx = cx + (roll % 2 ? -1.2 : 1.2);
      const hz = roll % 2 ? 3.2 : 1.6;
      const y = sy > 0 ? y0 + 2.02 : y0 - 0.02;
      const hub = [[hx - 0.8, y, hz - 0.8], [hx + 0.8, y, hz - 0.8], [hx + 0.8, y, hz + 0.8], [hx - 0.8, y, hz + 0.8]];
      faces.push({ pts: sy > 0 ? hub.reverse() : hub, tone: 0.6 });
    }
  }
  // The skirt between the wheels.
  faces.push(...block([-12.5, 12.5, -5.5, 5.5, 1.5], [-12.5, 12.5, -5.5, 5.5, 5], 0.14));
  // The hull: sides leaning in, the nose sloped back.
  faces.push(...block([-14, 14, -7, 7, 4.5], [-13, 10.5, -6, 6, 10.5], 0.42, 0.24));
  // A pale trim line round the hull's foot.
  faces.push(...block([-14.2, 14.2, -7.2, 7.2, 4.5], [-14.2, 14.2, -7.2, 7.2, 5.6], 0.5, 0.5));
  // The stepped deck on top, set back from the nose.
  faces.push(...block([-11.5, 5, -4.5, 4.5, 10.5], [-10.5, 3, -3.6, 3.6, 14], 0.5, 0.3));
  // Greebles: a ribbed box behind, and the nose's sensor plate.
  faces.push(...block([-9.5, -4, -2.4, 2.4, 14], [-9.2, -4.3, -2.1, 2.1, 15.4], 0.62, 0.4));
  const n = [[12.4, -3.4, 6.3], [12.4, 3.4, 6.3], [11, 3.4, 9.3], [11, -3.4, 9.3]];
  faces.push({ pts: n.map(([x, y, z]) => [x + 0.35, y, z + 0.1]), tone: 0.7 });
  return faces;
}

/** Where the lamp sits: on the deck's front edge. */
const LAMP = [3.4, 0, 14.6];

const VIEWS = {
  front: [0, -1],
  frontSide: [-Math.SQRT1_2, -Math.SQRT1_2],
  side: [-1, 0],
  backSide: [-Math.SQRT1_2, Math.SQRT1_2],
  back: [0, 1],
};

/**
 * One frame. `view` is which way the droid faces ([east, north] with the
 * viewer to the south, so a side view faces the viewer's left); `lamp` lights
 * its lamp; `hop` lifts it; `tone` scales its shading (a burnt wreck).
 */
function mouseFrame({ view = VIEWS.front, roll = 0, lamp = true, hop = 0, tone = 1, lampColor = G('red', 1) } = {}) {
  const [fx, fy] = view;
  const cp = Math.cos(PITCH);
  const sp = Math.sin(PITCH);
  // Droid space to view space: right, toward the viewer, up.
  const toView = ([x, y, z]) => [x * fx - y * fy, -(x * fy + y * fx), z];
  const project = ([r, t, u]) => [(MW / 2 + r) * SS, (MH - 0.6 - hop - u * cp + (t - 15) * sp * 0.55) * SS, t * cp + u * sp];
  const big = new PixelCanvas(MW * SS, MH * SS);
  const drawn = [];
  for (const f of mouseFaces(roll)) {
    const v = f.pts.map(toView);
    const a = [v[1][0] - v[0][0], v[1][1] - v[0][1], v[1][2] - v[0][2]];
    const b = [v[2][0] - v[0][0], v[2][1] - v[0][1], v[2][2] - v[0][2]];
    const nrm = norm3([a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]);
    // Faces turned away from the camera aren't drawn.
    if (nrm[1] * cp + nrm[2] * sp <= 0.02) continue;
    const pts = v.map(project);
    const light = 0.45 + 0.75 * Math.max(0, nrm[0] * SUN[0] + nrm[1] * SUN[1] + nrm[2] * SUN[2]);
    drawn.push({ pts, depth: pts.reduce((s, p) => s + p[2], 0) / pts.length, shade: Math.min(1, f.tone * light * tone) });
  }
  drawn.sort((p, q) => p.depth - q.depth);
  for (const f of drawn) big.poly(f.pts.map(([x, y]) => [x, y]), C('gray', f.shade));
  // Shrink: a pixel is solid where most of it is covered.
  const out = new PixelCanvas(MW, MH);
  for (let y = 0; y < MH; y++) {
    for (let x = 0; x < MW; x++) {
      const sum = [0, 0, 0];
      let n = 0;
      for (let j = 0; j < SS; j++) {
        for (let i = 0; i < SS; i++) {
          const c = big.get(x * SS + i, y * SS + j);
          if (!c) continue;
          n++;
          for (let k = 0; k < 3; k++) sum[k] += c[k];
        }
      }
      if (n >= (SS * SS) / 2) out.set(x, y, sum.map((s) => s / n));
    }
  }
  if (lamp) {
    const [lx, ly] = project(toView(LAMP));
    out.set(Math.floor(lx / SS), Math.floor(ly / SS), lampColor);
  }
  return out;
}

/** Sparks, a jump off its wheels and a roll, then a burnt hull on its back. */
function mouseDeath() {
  const out = [];
  const hit = mouseFrame({ view: VIEWS.frontSide, lamp: false });
  const burnt = mouseFrame({ view: VIEWS.frontSide, lamp: false, tone: 0.6 });
  const steps = [
    { src: hit, tilt: 0.12, dy: -1, spark: 4 },
    { src: hit, tilt: 0.5, dy: -3, spark: 6 },
    { src: burnt, tilt: 2.2, dy: -2, spark: 3 },
    { src: burnt, tilt: Math.PI, dy: 1, spark: 0 },
  ];
  steps.forEach(({ src, tilt, dy, spark }, i) => {
    const f = new PixelCanvas(MW, MH);
    f.blit(shift(rotate(src, tilt, MW / 2, MH - 9), 0, dy), 0, 0);
    if (spark) flash(f, 17 + i * 3, 12 + dy, spark, G('yellow', 1), G('yellow', 0.35), 31 + i);
    out.push(f);
  });
  return out;
}

function mouseSheet() {
  const frames = [];
  for (const view of Object.values(VIEWS)) {
    for (let k = 0; k < 4; k++) frames.push(mouseFrame({ view, roll: k, lamp: k % 2 === 0 }));
  }
  // React: a startled hop, lamp lit. Pain: knocked askew, lamp gone amber.
  frames.push(mouseFrame({ hop: 2 }));
  const hurt = rotate(mouseFrame({ lampColor: G('amber', 1) }), 0.16, MW / 2, MH - 4);
  flash(hurt, 26, 9, 3, G('yellow', 1), G('yellow', 0.35), 29);
  frames.push(hurt);
  frames.push(...mouseDeath());
  return sheet(frames);
}

// ------------------------------------------------------------------ interrogation droid

const IW = 48;
const IH = 44;
const ICX = 25;
const ICY = 23;

/**
 * A black ball split by a grooved band, with a red photoreceptor, a syringe
 * arm on its right (the viewer's left), a small claw on the other side and
 * sensor fins. `reach` 0-1 draws the syringe back (0) or thrusts it at the
 * viewer (1).
 */
function interrogatorModel(m, { bob = 0, sway = 0, eye = 0.8, reach = 0.35, hurt = false } = {}) {
  const cx = ICX;
  const cy = ICY + bob;
  const shell = C('gray', 0.12);
  const glossy = { spec: 0.75, shine: 28, grain: 0.03 };
  const steel = C('gray', 0.55);
  // Fins: a mast and two vanes above, a stub aerial behind.
  m.capsule(cx - 5, cy - 11, 0, cx - 7, cy - 19, -2, 0.8, 0.5, C('gray', 0.42), MAT.metal);
  m.capsule(cx + 6, cy - 11, 0, cx + 8, cy - 17, -2, 1.3, 0.6, C('gray', 0.3), MAT.metal);
  m.slab([[cx + 13, cy - 7], [cx + 19, cy - 9], [cx + 20, cy - 3], [cx + 14, cy - 2]], -1, C('gray', 0.24), MAT.metal, { bevel: 1, thickness: 1.5 });
  // The repulsor under it.
  m.ellipsoid(cx, cy + 14, 0, 6, 3, 6, C('gray', 0.22), MAT.metal);
  m.ellipsoid(cx, cy + 16.4, 0, 3, 1.4, 3, C('gray', 0.34), MAT.metal);
  // The ball, and the band round its middle.
  m.sphere(cx, cy, 0, 14, shell, glossy);
  m.ellipsoid(cx, cy + 1, 0, 14.6, 2.2, 14.6, C('gray', 0.26), MAT.metal);
  m.stroke(cx - 13, cy + 1.2, cx + 13, cy + 1.2, 1, C('gray', 0.05));
  // Vents on the lower half, and a pale service panel on the upper.
  for (const dx of [-7, -4, -1]) m.stroke(cx + dx + 9, cy + 6, cx + dx + 9, cy + 10, 1, C('gray', 0.3));
  m.paint(cx + 7, cy - 6, 2.6, 1.6, C('gray', 0.34));
  // The photoreceptor: a black lens with a red core, off-centre like the film's.
  m.ellipsoid(cx - 3, cy - 5, 12.5, 3.4, 3.4, 1.6, C('gray', 0.04), MAT.glass);
  m.paint(cx - 3, cy - 5, 1.9, 1.9, hurt ? G('amber', 1) : G('red', eye), MAT.glow);
  m.paint(cx - 3.4, cy - 5.4, 0.7, 0.7, hurt ? G('pale', 1) : G('red', 1), MAT.glow);
  // The claw arm.
  const cl = [cx + 15 + sway * 0.5, cy + 9, 6];
  m.capsule(cx + 11, cy + 4, 6, ...cl, 1.2, 1, C('gray', 0.34), MAT.metal);
  m.capsule(...cl, cl[0] + 3, cl[1] + 4, 8, 0.8, 0.5, steel, MAT.metal);
  m.capsule(...cl, cl[0] - 1, cl[1] + 5, 8, 0.8, 0.5, steel, MAT.metal);
  // The syringe: a shoulder on the ball, a steel barrel, a long needle. Drawn
  // back it points down and out; thrust, it comes forward and across.
  const sh = [cx - 11, cy + 4, 7];
  const el = [cx - 17 - sway * 0.5 + reach * 4, cy + 5 + reach, 9 + reach * 6];
  const end = [el[0] - 3 + reach * 8, el[1] + 7 - reach * 3, 12 + reach * 10];
  const tip = [end[0] - 2.5 + reach * 8, end[1] + 6 - reach * 3, 14 + reach * 14];
  m.sphere(...sh, 2.2, C('gray', 0.3), MAT.metal);
  m.capsule(...sh, ...el, 1.4, 1.3, C('gray', 0.36), MAT.metal);
  m.capsule(...el, ...end, 1.9 + reach * 0.5, 1.7 + reach * 0.5, steel, MAT.metal);
  m.capsule(...end, ...tip, 0.7, 0.5, C('gray', 0.8), MAT.metal);
  return tip;
}

function interrogatorFrame(o = {}) {
  const m = new Model(IW, IH, { seed: 67 });
  const tip = interrogatorModel(m, o);
  const c = m.render(RENDER);
  // The shock: a blue-white crackle at the needle's point.
  if (o.shock) flash(c, tip[0], tip[1], 3, G('cyan', 1), G('cyan', 0.4), 19);
  return c;
}

/** Sparks and a tilt as it breaks up, then half a shell on the floor. */
function interrogatorDeath() {
  const out = [];
  const base = interrogatorFrame({ hurt: true, reach: 0.2 });
  for (let i = 0; i < 5; i++) {
    const f = new PixelCanvas(IW, IH);
    const tilt = [0.2, 0.5, 0.95, 1.35, 1.5][i];
    const drop = [0, 1, 3, 6, 7][i];
    f.blit(shift(rotate(base, tilt, ICX, ICY), 0, drop), 0, 0);
    if (i < 3) flash(f, ICX - 4 + i * 4, ICY - 2 + drop, 5 + i * 2, G('yellow', 1), G('yellow', 0.3), 41 + i);
    if (i === 4) {
      // The wreck: what's left lies low, burnt dark.
      f.each((x, y, p) => {
        if (!p) return undefined;
        if (y < ICY + 2) return null;
        return [p[0] * 0.6, p[1] * 0.6, p[2] * 0.6];
      });
    }
    out.push(f);
  }
  return out;
}

function interrogatorSheet() {
  const frames = [0, 1, 2, 3].map((k) => interrogatorFrame({ bob: [0, -1, 0, 1][k], sway: [0, 1.5, 0, -1.5][k] }));
  frames.push(interrogatorFrame({ eye: 1, bob: -1, reach: 0 }));
  frames.push(interrogatorFrame({ eye: 1, bob: 1, reach: 1, shock: true }));
  frames.push(interrogatorFrame({ hurt: true, sway: 3, reach: 0.2 }));
  frames.push(...interrogatorDeath());
  return sheet(frames);
}

export default [
  { name: 'mouse-droid', out: 'assets/sprites/npcs/mouse-droid.png', draw: mouseSheet },
  { name: 'interrogation-droid', out: M('interrogation-droid'), draw: interrogatorSheet, dither: 'fs' },
];
