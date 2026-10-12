import { defineItem } from '../../engine/defs.js';

// Weapon pickups: the weapon plus some ammo for it.
export default [
  defineItem({
    id: 'pickup-blaster',
    name: 'Blaster Pistol',
    glyph: '2',
    sheet: { src: 'assets/sprites/items/pickup-blaster.png', frameWidth: 64, frameHeight: 32 },
    radius: 0.35,
    pickup: { weapon: 'blaster', ammo: { energy: 30 } },
    message: 'Picked up a blaster pistol.',
    sound: 'weapon-pickup',
  }),
];
