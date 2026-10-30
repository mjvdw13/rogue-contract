import { defineAmmo } from '../engine/defs.js';

// `max` is the carry limit; `clip` is what a backpack (if any) hands out.
export default [
  defineAmmo({ id: 'energy', name: 'Energy', short: 'ENRG', max: 500, clip: 15 }),
  defineAmmo({ id: 'detonator', name: 'Thermal Detonators', short: 'DET', max: 50, clip: 1 }),
];
