import { defineItem } from '../../engine/defs.js';

const S = (name, w, h) => ({ src: `assets/sprites/items/${name}.png`, frameWidth: w, frameHeight: h });

export default [
  // +25 health.
  defineItem({
    id: 'med-kit',
    name: 'Med Kit',
    glyph: 'h',
    sheet: S('med-kit', 32, 24),
    pickup: { health: 25 },
    message: 'Picked up a med kit.',
    sound: 'health-pickup',
  }),
];
