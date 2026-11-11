import { defineItem } from '../../engine/defs.js';

const S = (name, w, h) => ({ src: `assets/sprites/items/${name}.png`, frameWidth: w, frameHeight: h });

// Dark Forces' amounts: an energy cell 15, a power cell 10, a plasma
// cartridge 20, a mortar shell 1 and a case of them 5.
export default [
  defineItem({ id: 'energy-cell', name: 'Energy Cell', glyph: 'c', sheet: S('energy-cell', 16, 16), pickup: { ammo: { energy: 15 } }, message: 'Picked up an energy cell.', sound: 'item-ammo' }),
  defineItem({ id: 'energy-pack', name: 'Energy Pack', glyph: 'C', sheet: S('energy-pack', 32, 24), pickup: { ammo: { energy: 60 } }, message: 'Picked up an energy pack.', sound: 'item-ammo' }),
  defineItem({ id: 'power-cell', name: 'Power Cell', sheet: S('power-cell', 16, 24), pickup: { ammo: { power: 10 } }, message: 'Picked up a power cell.', sound: 'item-ammo' }),
  defineItem({ id: 'plasma-cartridge', name: 'Plasma Cartridge', sheet: S('plasma-cartridge', 24, 24), pickup: { ammo: { plasma: 20 } }, message: 'Picked up a plasma cartridge.', sound: 'item-ammo' }),
  defineItem({ id: 'mortar-shell', name: 'Mortar Shell', sheet: S('mortar-shell', 16, 24), pickup: { ammo: { shell: 1 } }, message: 'Picked up a mortar shell.', sound: 'item-ammo' }),
  defineItem({ id: 'mortar-shells', name: 'Mortar Shells', sheet: S('mortar-shells', 32, 24), pickup: { ammo: { shell: 5 } }, message: 'Picked up a case of mortar shells.', sound: 'item-ammo' }),
];
