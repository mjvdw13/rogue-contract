import { defineWeapon } from '../../engine/defs.js';

// Slot 8 (with the tracking fob): the Packered mortar gun, as in Dark Forces.
// It lobs a shell in an arc that bursts where it lands, one shell a shot,
// slowly: 1-3 its mouth glowing (lit), then 0 (DF's 58, 14, 14, 14 ticks).
// DF drew it in the middle (x 123).
export default defineWeapon({
  id: 'mortar',
  name: 'MORTAR GUN',
  slot: 8,
  ammo: 'shell',
  priority: 4,
  light: { radius: 4, light: 72 }, // the mouth's glow
  sheet: { src: 'assets/sprites/weapons/mortar.png', frameWidth: 198, frameHeight: 132 },
  offset: [62, 12],
  anims: {
    idle: [0],
    fire: { frames: [1, 2, 3, 0], durations: [0.4, 0.1, 0.1, 0.1], fireAt: 0, fullbright: [0, 1, 2] },
  },
  fire: { kind: 'projectile', projectile: 'mortar-round', spread: 0.017 }, // DF's ±1°
  sounds: { fire: 'mortar-fire' },
});
