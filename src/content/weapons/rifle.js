import { defineWeapon } from '../../engine/defs.js';

// Slot 3: the E-11 blaster rifle, the stormtroopers' gun, as in Dark Forces.
// The same red bolts as the pistol, three times as quick and less true, at
// two energy a shot. 0 idle, 1 the shot (lit, the flash), then back to 0
// (DF's timings: 7 and 14 ticks). DF drew it left of the middle (x 112).
export default defineWeapon({
  id: 'rifle',
  name: 'BLASTER RIFLE',
  slot: 3,
  ammo: 'energy',
  ammoPerShot: 2,
  priority: 3,
  light: { radius: 5, light: 96 }, // the muzzle flash
  sheet: { src: 'assets/sprites/weapons/rifle.png', frameWidth: 166, frameHeight: 134 },
  offset: [35, 12],
  anims: {
    idle: [0],
    fire: { frames: [1, 0], durations: [0.05, 0.1], fireAt: 0, fullbright: [0] },
  },
  fire: { kind: 'projectile', projectile: 'blaster-bolt', spread: 0.03 }, // DF's ±1.9°, the pistol's four times
  sounds: { fire: 'rifle-fire' },
});
