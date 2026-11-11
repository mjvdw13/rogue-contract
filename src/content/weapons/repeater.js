import { defineWeapon } from '../../engine/defs.js';

// Slot 5: the Imperial repeater, as in Dark Forces. Held down, it pours out
// small amber bolts, nine a second, one power cell each. 0 idle, then 1 and
// 2 (lit) for every shot (DF's 5 and 11 ticks), round again while fire is
// held. DF drew it right of the middle (x 156).
export default defineWeapon({
  id: 'repeater',
  name: 'REPEATER RIFLE',
  slot: 5,
  ammo: 'power',
  priority: 5,
  light: { radius: 4, light: 72 }, // the muzzle flash
  sheet: { src: 'assets/sprites/weapons/repeater.png', frameWidth: 126, frameHeight: 110 },
  offset: [59, 12],
  anims: {
    idle: [0],
    fire: { frames: [1, 2], durations: [0.035, 0.075], fireAt: 0, fullbright: [1] },
  },
  fire: { kind: 'projectile', projectile: 'repeater-bolt', spread: 0.017 }, // DF's ±1°
  sounds: { fire: 'repeater-fire' },
});
