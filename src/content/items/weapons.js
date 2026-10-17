import { defineItem } from '../../engine/defs.js';

// Weapon pickups: the weapon plus some ammo for it.
export default [
  defineItem({
    id: 'pickup-blaster',
    name: 'Blaster Pistol',
    glyph: '2',
    sheet: { src: 'assets/sprites/items/pickup-blaster.png', frameWidth: 64, frameHeight: 32 },
    radius: 0.7,
    pickup: { weapon: 'blaster', ammo: { energy: 30 } },
    message: 'Picked up a blaster pistol.',
    sound: 'weapon-pickup',
  }),  // Thermal detonators: one lying on the floor, and a belt of five.
  defineItem({
    id: 'thermal-detonator',
    name: 'Thermal Detonator',
    sheet: { src: 'assets/sprites/items/thermal-detonator.png', frameWidth: 16, frameHeight: 16 },
    radius: 0.5,
    pickup: { weapon: 'thermal-detonator', ammo: { detonator: 1 } },
    message: 'Picked up a thermal detonator.',
    sound: 'item-ammo',
  }),
  defineItem({
    id: 'detonator-belt',
    name: 'Thermal Detonators',
    glyph: '4',
    sheet: { src: 'assets/sprites/items/detonator-belt.png', frameWidth: 48, frameHeight: 24 },
    radius: 0.7,
    pickup: { weapon: 'thermal-detonator', ammo: { detonator: 5 } },
    message: 'Picked up a belt of thermal detonators.',
    sound: 'item-ammo',
  }),
];
