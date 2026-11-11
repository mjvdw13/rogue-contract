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
  }),
  // The E-11 rifle, as stormtroopers drop it. A rifle when you have one
  // already is its energy (Dark Forces' 15).
  defineItem({
    id: 'rifle',
    name: 'Blaster Rifle',
    glyph: '3',
    sheet: { src: 'assets/sprites/items/rifle.png', frameWidth: 64, frameHeight: 24 },
    radius: 0.7,
    pickup: { weapon: 'rifle', ammo: { energy: 15 } },
    message: 'Picked up a blaster rifle.',
    sound: 'weapon-pickup',
  }),
  // The Imperial repeater, with 30 power cells (Dark Forces').
  defineItem({
    id: 'repeater',
    name: 'Repeater Rifle',
    glyph: '5',
    sheet: { src: 'assets/sprites/items/repeater.png', frameWidth: 64, frameHeight: 24 },
    radius: 0.7,
    pickup: { weapon: 'repeater', ammo: { power: 30 } },
    message: 'Picked up an Imperial repeater rifle.',
    sound: 'weapon-pickup',
  }),
  // The Jeron fusion cutter, with 50 power cells.
  defineItem({
    id: 'fusion-cutter',
    name: 'Fusion Cutter',
    glyph: '6',
    sheet: { src: 'assets/sprites/items/fusion-cutter.png', frameWidth: 32, frameHeight: 24 },
    radius: 0.6,
    pickup: { weapon: 'fusion-cutter', ammo: { power: 50 } },
    message: 'Picked up a Jeron fusion cutter.',
    sound: 'weapon-pickup',
  }),
  // I.M. mines: one lying on the floor, and a pack of five.
  defineItem({
    id: 'mine',
    name: 'I.M. Mine',
    sheet: { src: 'assets/sprites/items/mine.png', frameWidth: 24, frameHeight: 16 },
    radius: 0.5,
    pickup: { weapon: 'mines', ammo: { mine: 1 } },
    message: 'Picked up an I.M. mine.',
    sound: 'item-ammo',
  }),
  defineItem({
    id: 'mine-pack',
    name: 'I.M. Mines',
    glyph: '7',
    sheet: { src: 'assets/sprites/items/mine-pack.png', frameWidth: 32, frameHeight: 24 },
    radius: 0.6,
    pickup: { weapon: 'mines', ammo: { mine: 5 } },
    message: 'Picked up a pack of I.M. mines.',
    sound: 'item-ammo',
  }),
  // The Packered mortar gun, with three shells.
  defineItem({
    id: 'mortar',
    name: 'Mortar Gun',
    glyph: '8',
    sheet: { src: 'assets/sprites/items/mortar.png', frameWidth: 64, frameHeight: 24 },
    radius: 0.7,
    pickup: { weapon: 'mortar', ammo: { shell: 3 } },
    message: 'Picked up a Packered mortar gun.',
    sound: 'weapon-pickup',
  }),
  // The concussion rifle, as Bossk drops it.
  defineItem({
    id: 'concussion-rifle',
    name: 'Concussion Rifle',
    glyph: '9',
    sheet: { src: 'assets/sprites/items/concussion-rifle.png', frameWidth: 64, frameHeight: 24 },
    radius: 0.7,
    pickup: { weapon: 'concussion-rifle', ammo: { power: 30 } },
    message: 'Picked up a concussion rifle.',
    sound: 'weapon-pickup',
  }),
  // Thermal detonators: one lying on the floor, and a belt of five.
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
