import { defineWeapon } from '../../engine/defs.js';

// Slot 1: bare (gloved) fists, for when the power cells run dry.
export default defineWeapon({
  id: 'fists',
  name: 'FISTS',
  slot: 1,
  ammo: null,
  priority: 0,
  noise: false,
  sheet: { src: 'assets/sprites/weapons/fists.png', frameWidth: 160, frameHeight: 80 },
  offset: [0, 4], // sits low, so the middle of the view stays clear
  anims: {
    idle: [0],
    fire: { frames: [1, 2, 3, 0], durations: [0.08, 0.1, 0.12, 0.1], fireAt: 1 },
  },
  fire: { kind: 'melee', damage: [4, 16], range: 2.3, arc: 0.6, berserkMultiplier: 10, hitSound: 'punch-hit', missSound: 'punch-swing' },
  bob: 1.2,
});
