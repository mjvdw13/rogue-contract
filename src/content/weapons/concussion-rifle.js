import { defineWeapon } from '../../engine/defs.js';

// Slot 9: the Stouker concussion rifle, Bossk's, as in Dark Forces. Its shot
// flies unseen and fast; where it lands, everything near takes the same
// damage and erupts in blue flame, you too if you're close. Four energy a
// shot, slow to fire: 0 idle, 1 the shot (lit), 2 its after-glow, then back
// to 0 (DF's timings). DF drew it right of the middle (x 130 of 320).
export default defineWeapon({
  id: 'concussion-rifle',
  name: 'CONCUSSION RIFLE',
  slot: 9,
  ammo: 'energy',
  ammoPerShot: 4,
  priority: 3,
  light: { radius: 4, light: 64 }, // the vents' blue glow
  sheet: { src: 'assets/sprites/weapons/concussion-rifle.png', frameWidth: 112, frameHeight: 96 },
  offset: [57, 12],
  anims: {
    idle: [0],
    fire: { frames: [1, 2, 0], durations: [0.3, 0.1, 0.4], fireAt: 0, fullbright: [0] },
  },
  fire: { kind: 'projectile', projectile: 'concussion-shot', lockOn: 5 }, // DF's auto-aim: 5° either side, any height
  sounds: { fire: 'concussion-crack' },
});
