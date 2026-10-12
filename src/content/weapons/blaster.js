import { defineWeapon } from '../../engine/defs.js';

// Slot 2: the mercenary's blaster pistol. It fires visible red bolts (fast
// projectiles, not instant hits) and runs on energy from power cells.
export default defineWeapon({
  id: 'blaster',
  name: 'BLASTER PISTOL',
  slot: 2,
  ammo: 'energy',
  priority: 2,
  flashLight: 1,
  sheet: { src: 'assets/sprites/weapons/blaster.png', frameWidth: 96, frameHeight: 88 },
  offset: [24, 12], // held in the right hand, low, so the middle of the view stays clear
  anims: {
    idle: [0],
    fire: { frames: [1, 2, 3, 0], durations: [0.06, 0.1, 0.12, 0.12], fireAt: 0, fullbright: [0] },
  },
  fire: { kind: 'projectile', projectile: 'blaster-bolt', spread: 0.01 },
  sounds: { fire: 'blaster-fire' },
});
