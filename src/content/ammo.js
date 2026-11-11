import { defineAmmo } from '../engine/defs.js';

// `max` is the carry limit; `clip` is what a backpack (if any) hands out.
// Dark Forces' ammo and its limits: energy for the pistol and rifle, power
// cells for the repeater, fusion cutter and concussion rifle, plasma for the
// assault cannon, and shells, mines and detonators one by one.
export default [
  defineAmmo({ id: 'energy', name: 'Energy', short: 'ENRG', max: 500, clip: 15 }),
  defineAmmo({ id: 'power', name: 'Power Cells', short: 'POWR', max: 500, clip: 10 }),
  defineAmmo({ id: 'plasma', name: 'Plasma', short: 'PLSM', max: 400, clip: 20 }),
  defineAmmo({ id: 'shell', name: 'Mortar Shells', short: 'SHEL', max: 50, clip: 1 }),
  defineAmmo({ id: 'mine', name: 'Mines', short: 'MINE', max: 30, clip: 1 }),
  defineAmmo({ id: 'detonator', name: 'Thermal Detonators', short: 'DET', max: 50, clip: 1 }),
];
