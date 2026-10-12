// Pickups: med kits, shield units, power cells and energy packs, and the
// coloured keycards. Modelled like the other sprites, lying on the floor.
import { mix, darken, lighten } from '../lib/canvas.js';
import { C, G } from '../lib/pal.js';
import { Model, MAT } from '../lib/model.js';
import { sheet } from '../lib/sprite.js';

const I = (name) => `assets/sprites/items/${name}.png`;
const RENDER = { light: [-0.45, -0.75, 0.5], ambient: 0.34, aoStrength: 0.45 };
const box = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

/** A white field med kit with a red cross and a clasp. 32x24. */
function medKit() {
  const m = new Model(32, 24, { seed: 201 });
  m.slab(box(3, 8, 29, 22), 6, C('gray', 0.85), MAT.plastic, { bevel: 2, thickness: 3 });
  m.slab(box(3, 6, 29, 10), 8, C('gray', 0.75), MAT.plastic, { bevel: 1.5, thickness: 1.5 });
  m.paintPoly(box(14, 11, 18, 21), C('blood', 0.7));
  m.paintPoly(box(10, 14, 22, 18), C('blood', 0.7));
  m.paintPoly(box(13, 6, 19, 8), C('gray', 0.35));
  return m.render(RENDER);
}

/** A shield unit: a squat canister with a glowing blue core (animated). 24x24. */
function shieldUnit() {
  const frames = [0.55, 0.8, 1, 0.8].map((glow, k) => {
    const m = new Model(24, 24, { seed: 211 });
    m.ellipsoid(12, 20, 0, 9, 3, 6, C('gray', 0.3), MAT.metal);
    m.capsule(12, 19, 0, 12, 7, 0, 7, 7, C('steel', 0.3), MAT.metal);
    m.ellipsoid(12, 6, 0, 7, 2.6, 5, C('gray', 0.4), MAT.metal);
    m.capsule(12, 17, 4, 12, 9, 4, 4.2, 4.2, G('cyan', glow * 0.7), MAT.glow);
    m.paint(12, 13, 1.5, 3, G('cyan', glow), MAT.glow);
    return m.render(RENDER);
  });
  return sheet(frames);
}

/** A small power cell: a dark cylinder with copper contacts and a green charge light. 16x16. */
function powerCell() {
  const m = new Model(16, 16, { seed: 221 });
  m.capsule(4, 11, 2, 12, 9, 2, 3.4, 3.4, C('gray', 0.3), MAT.metal);
  m.sphere(3.5, 11, 2, 2.2, C('orange', 0.55), MAT.brass);
  m.sphere(12.5, 9, 2, 2.2, C('orange', 0.55), MAT.brass);
  m.paint(8, 8.5, 1.2, 1, G('green', 0.9), MAT.glow);
  return m.render(RENDER);
}

/** An energy pack: a crate of power cells with a carry handle. 32x24. */
function energyPack() {
  const m = new Model(32, 24, { seed: 231 });
  m.slab(box(3, 9, 29, 22), 5, C('olive', 0.35), MAT.metal, { bevel: 1.5, thickness: 3 });
  for (let k = 0; k < 4; k++) {
    m.capsule(6 + k * 6, 10, 9, 6 + k * 6, 6, 9, 2.2, 2.2, C('gray', 0.32), MAT.metal);
    m.sphere(6 + k * 6, 5.5, 9, 1.6, C('orange', 0.55), MAT.brass);
  }
  m.paintPoly(box(6, 15, 26, 17), C('yellow', 0.65));
  m.paint(26, 19, 1, 1, G('green', 0.9), MAT.glow);
  return m.render(RENDER);
}

/** A keycard: a dark slim card with a coloured stripe that blinks. 16x16, 2 frames. */
function keycard(ramp, glow) {
  return () =>
    sheet(
      [1, 0.35].map((lit) => {
        const m = new Model(16, 16, { seed: 241 });
        m.slab(box(3, 6, 13, 13), 4, C('gray', 0.2), MAT.plastic, { bevel: 0.8, thickness: 1 });
        m.paintPoly(box(3, 8, 13, 10), lit > 0.5 ? G(glow, 1) : C(ramp, 0.5));
        m.paintPoly(box(5, 11, 9, 12), C('gray', 0.6));
        return m.render(RENDER);
      }),
    );
}

export default [
  { name: 'med-kit', out: I('med-kit'), draw: medKit, dither: 'fs' },
  { name: 'shield-unit', out: I('shield-unit'), draw: shieldUnit, dither: 'fs' },
  { name: 'power-cell', out: I('power-cell'), draw: powerCell, dither: 'fs' },
  { name: 'energy-pack', out: I('energy-pack'), draw: energyPack, dither: 'fs' },
  { name: 'keycard-red', out: I('keycard-red'), draw: keycard('blood', 'red') },
  { name: 'keycard-blue', out: I('keycard-blue'), draw: keycard('steel', 'cyan') },
  { name: 'keycard-yellow', out: I('keycard-yellow'), draw: keycard('yellow', 'amber') },
];
