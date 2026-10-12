import { defineEffect, defineProjectile } from '../engine/defs.js';

const FX = (name, w, h) => ({ src: `assets/sprites/fx/${name}.png`, frameWidth: w, frameHeight: h });

export const effects = [
  defineEffect({ id: 'puff', sheet: FX('puff', 16, 16), anims: { idle: { frames: [0, 1, 2, 3], fps: 14, fullbright: [0] } }, rise: 0.3 }),
  defineEffect({ id: 'blood', sheet: FX('blood', 16, 16), anims: { idle: { frames: [0, 1, 2], fps: 10 } }, rise: -0.4 }),
  defineEffect({ id: 'explosion', sheet: FX('explosion', 64, 64), anims: { idle: { frames: [0, 1, 2, 3, 4], fps: 12 } }, fullbright: true }),
];

// Blaster bolts are projectiles: fast enough to feel like a gun, slow enough
// to see (and, from troopers, to dodge).
const BOLT = {
  sheet: FX('blaster-bolt', 32, 32),
  anims: { fly: { frames: [0, 1], fps: 12, loop: true }, explode: { frames: [2, 3, 4], fps: 16 } },
  radius: 0.08,
  sounds: { explode: 'bolt-hit' },
};

export const projectiles = [
  defineProjectile({ id: 'blaster-bolt', ...BOLT, speed: 30, damage: [10, 20] }),
  defineProjectile({ id: 'trooper-bolt', ...BOLT, speed: 14, damage: [5, 12] }),
];
