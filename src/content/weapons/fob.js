import { defineWeapon } from '../../engine/defs.js';

// Slot 8: the Guild's tracking fob (docs/story.md), Mission 1 only. No
// attack: held, it blinks and beeps faster the nearer the signal (amber,
// green when you face it) and stays dark with nothing to track. The broker
// gives it (the giveWeapon action) and Rusk takes it (takeWeapon).
export default defineWeapon({
  id: 'fob',
  name: 'TRACKING FOB',
  slot: 8,
  ammo: null,
  priority: 0,
  noise: false,
  sheet: { src: 'assets/sprites/weapons/fob.png', frameWidth: 96, frameHeight: 96 },
  offset: [40, -26], // held up right of centre, clear of the status bar
  anims: {
    idle: [0],
    lit: { frames: [1, 0], durations: [0.09, 0.01], fullbright: [0] },
    litFacing: { frames: [2, 0], durations: [0.09, 0.01], fullbright: [0] },
  },
  track: { near: 4, far: 80, blink: [0.15, 1.4], facing: 15 },
  sounds: { beep: 'fob-beep' },
  bob: 0.8,
});
