import { defineItem } from '../../engine/defs.js';

const S = (name, w, h) => ({ src: `assets/sprites/items/${name}.png`, frameWidth: w, frameHeight: h });

// Shields absorb part of the damage you take (class 1: a third).
export default [
  defineItem({
    id: 'shield-unit',
    name: 'Shield Unit',
    glyph: 'a',
    sheet: S('shield-unit', 24, 24),
    anims: { idle: { frames: [0, 1, 2, 3], fps: 6, loop: true, fullbright: true } },
    pickup: { armor: 20, maxArmor: 200 },
    message: 'Picked up a shield unit.',
    sound: 'powerup',
  }),
];
