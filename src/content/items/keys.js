import { defineItem } from '../../engine/defs.js';

const keycard = (color, glyph, label) =>
  defineItem({
    id: `keycard-${color}`,
    name: `${label} Keycard`,
    glyph,
    sheet: { src: `assets/sprites/items/keycard-${color}.png`, frameWidth: 16, frameHeight: 16 },
    anims: { idle: { frames: [0, 1], fps: 2, loop: true, fullbright: [0] } },
    pickup: { key: color, always: true },
    message: `Picked up the ${label.toLowerCase()} keycard.`,
    sound: 'key-pickup',
  });

export default [keycard('blue', 'b', 'BLUE'), keycard('yellow', 'y', 'YELLOW'), keycard('red', 'r', 'RED')];
