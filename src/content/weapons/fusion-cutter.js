import { defineWeapon } from '../../engine/defs.js';

// Slot 6: the Jeron fusion cutter, as in Dark Forces. Slow green plasma, a
// shot every quarter second, one power cell each. Its four barrels fire one
// after another, across and back (`cycle`), each glowing after its shot: 1-4
// the barrel lit, then 0 (DF's 20 and 14 ticks). DF drew it low across the
// whole view (x 19).
export default defineWeapon({
  id: 'fusion-cutter',
  name: 'FUSION CUTTER',
  slot: 6,
  ammo: 'power',
  priority: 6,
  light: { radius: 4, light: 64 }, // the barrel's glow
  sheet: { src: 'assets/sprites/weapons/fusion-cutter.png', frameWidth: 302, frameHeight: 96 },
  offset: [10, 12],
  anims: {
    idle: [0],
    fire: { frames: [1, 0], durations: [0.14, 0.1], fireAt: 0, fullbright: [0] },
    fire2: { frames: [2, 0], durations: [0.14, 0.1], fireAt: 0, fullbright: [0] },
    fire3: { frames: [3, 0], durations: [0.14, 0.1], fireAt: 0, fullbright: [0] },
    fire4: { frames: [4, 0], durations: [0.14, 0.1], fireAt: 0, fullbright: [0] },
  },
  cycle: ['fire', 'fire2', 'fire3', 'fire4', 'fire3', 'fire2'],
  fire: { kind: 'projectile', projectile: 'fusion-plasma', spread: 0.017 }, // DF's ±1°
  sounds: { fire: 'fusion-fire' },
});
