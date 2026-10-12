// Scenery sprites for an Imperial garrison: supply crates, fuel barrels that
// explode, computer consoles and ceiling lamps.
import { PixelCanvas, mix } from '../lib/canvas.js';
import { C, G } from '../lib/pal.js';
import { Model, MAT } from '../lib/model.js';
import { box, cylinder, flat } from '../lib/props.js';
import { sheet, flash } from '../lib/sprite.js';

const D = (name) => `assets/sprites/decor/${name}.png`;
const RENDER = { light: [-0.5, -0.65, 0.58], ambient: 0.3, aoStrength: 0.5 };
const shadow = (m, cx, cy, rx) => flat(m, cx, cy, rx, rx * 0.22, C('gray', 0.04), MAT.cloth, -30);
const GREY = (t) => mix(C('gray', t), C('steel', t), 0.25);

function model(w, h, seed, build) {
  const m = new Model(w, h, { seed });
  build(m);
  return m.render(RENDER);
}

/** A grey supply crate with ribbed sides and a stencil stripe. 40x40. */
function supplyCrate() {
  return model(40, 40, 301, (m) => {
    shadow(m, 20, 38.5, 18);
    box(m, 3, 12, 34, 26, 6, GREY(0.42), MAT.metal, { topCol: GREY(0.5) });
    for (const x of [8, 20, 32]) m.slab([[x - 1.5, 14], [x + 1.5, 14], [x + 1.5, 37], [x - 1.5, 37]], 12, GREY(0.36), MAT.metal, { bevel: 0.6, thickness: 0.8 });
    m.paint(20, 25, 9, 1.4, C('orange', 0.6));
  });
}

/** A fuel barrel; shot enough, it explodes. Frames: idle, then the blast. 24x32. */
function fuelBarrel() {
  const drum = () =>
    model(24, 32, 327, (m) => {
      shadow(m, 12, 31, 9);
      cylinder(m, 12, 6, 31, 9, GREY(0.38), MAT.metal, { topCol: GREY(0.46) });
      for (const y of [12, 22]) m.paint(12, y, 9.2, 0.9, C('blood', 0.45));
      m.paint(12, 17, 3.6, 2.8, C('yellow', 0.7), MAT.plastic); // hazard label
      m.paint(12, 17, 1.6, 1.4, C('gray', 0.1));
    });
  const blast = (k) => {
    const c = new PixelCanvas(24, 32);
    const r = 5 + k * 3;
    if (k < 4) flash(c, 12, 22 - k * 2, r, G('yellow', 1), k > 1 ? G('red', 0.6) : G('yellow', 0.4));
    if (k >= 2) {
      const m = new Model(24, 32, { seed: 329 });
      m.slab([[3, 26], [21, 26], [22, 31], [2, 31]], 0, GREY(0.2), MAT.metal, { tilt: [0, -1.2], bevel: 1 });
      m.slab([[4, 22], [9, 20], [10, 27], [3, 28]], 2, GREY(0.25), MAT.metal, { bevel: 1 });
      const base = m.render(RENDER);
      base.blit(c, 0, 0);
      return base;
    }
    return c;
  };
  return sheet([drum(), blast(0), blast(1), blast(2), blast(3), blast(4)]);
}

/** A computer console: a slanted desk of lit buttons with a screen (animated). 32x40. */
function console_() {
  return sheet([0, 1, 2].map((f) => {
    const c = model(32, 40, 331, (m) => {
      shadow(m, 16, 38.5, 14);
      box(m, 3, 20, 26, 18, 6, GREY(0.3), MAT.metal, { topCol: GREY(0.36) });
      m.slab([[4, 6], [28, 6], [28, 20], [4, 20]], 4, GREY(0.26), MAT.metal, { bevel: 1.5, thickness: 2, tilt: [0, 0.6] });
      m.slab([[7, 8], [25, 8], [25, 17], [7, 17]], 8, C('gray', 0.04), MAT.glass, { bevel: 0.6, thickness: 0.4 });
    });
    for (let k = 0; k < 3; k++) {
      const len = 4 + ((k * 5 + f * 3) % 9);
      for (let x = 9; x < 9 + len; x++) c.set(x, 10 + k * 2, k === 0 ? G('green', 0.9) : G('green', 0.5));
    }
    for (let k = 0; k < 6; k++) c.set(7 + k * 3.4, 24, (k + f) % 3 ? G('red', 1) : G('amber', 1));
    return c;
  }));
}

/** A hanging light: a dark housing over a glowing tube. 48x16. */
function ceilingLamp() {
  const c = model(48, 16, 313, (m) => {
    m.capsule(14, 0, 0, 14, 5, 0, 0.4, 0.4, C('gray', 0.3), MAT.metal);
    m.capsule(34, 0, 0, 34, 5, 0, 0.4, 0.4, C('gray', 0.3), MAT.metal);
    m.slab([[2, 5], [46, 5], [44, 12], [4, 12]], 4, GREY(0.3), MAT.metal, { bevel: 2, tilt: [0, 0.8] });
  });
  for (let x = 6; x < 42; x++) {
    c.set(x, 11, G('tube', 1));
    c.set(x, 12, G('tube', 0));
  }
  return c;
}

export default [
  { name: 'supply-crate', out: D('supply-crate'), draw: supplyCrate, dither: 'fs' },
  { name: 'fuel-barrel', out: D('fuel-barrel'), draw: fuelBarrel, dither: 'fs' },
  { name: 'console', out: D('console'), draw: console_, dither: 'fs' },
  { name: 'ceiling-lamp', out: D('ceiling-lamp'), draw: ceilingLamp, dither: 'fs' },
];
