import { defineWeapon } from '../../engine/defs.js';

// Slot 7: I.M. mines, as in Dark Forces. Fire arms one (its light turns
// red, 1) and sets it down just in front of you; it goes off three seconds
// later, or at once when someone walks into it. The hand drops out of view
// and the next one comes up. DF drew the hand left of the middle (x 105).
export default defineWeapon({
  id: 'mines',
  name: 'I.M. MINES',
  slot: 7,
  ammo: 'mine',
  priority: 1, // never picked over a gun when one runs dry
  noise: false, // setting one down is quiet; its blast is not
  sheet: { src: 'assets/sprites/weapons/mines.png', frameWidth: 184, frameHeight: 95 },
  offset: [37, 12],
  anims: {
    idle: [0],
    fire: { frames: [1, 1], durations: [0.25, 0.05], fireAt: 1 },
  },
  fire: { kind: 'projectile', projectile: 'mine-placed' },
  reraise: true,
  sounds: { fire: 'mine-arm' },
});
