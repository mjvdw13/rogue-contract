import { defineItem } from '../../engine/defs.js';

const S = (name, w, h) => ({ src: `assets/sprites/items/${name}.png`, frameWidth: w, frameHeight: h });

export default [
  defineItem({ id: 'power-cell', name: 'Power Cell', glyph: 'c', sheet: S('power-cell', 16, 16), pickup: { ammo: { energy: 15 } }, message: 'Picked up a power cell.', sound: 'item-ammo' }),
  defineItem({ id: 'energy-pack', name: 'Energy Pack', glyph: 'C', sheet: S('energy-pack', 32, 24), pickup: { ammo: { energy: 60 } }, message: 'Picked up an energy pack.', sound: 'item-ammo' }),
];
