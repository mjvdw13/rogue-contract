import { defineMonster } from '../../engine/defs.js';

// A sandtrooper commander: a sandtrooper with a heavy repeating rifle (a thick
// barrel and a wooden stock) and an orange pauldron (a sandtrooper's is black).
// Tougher than a sandtrooper and quicker to fire again, with the same bursts
// of three bolts. The art is the sandtrooper's frames with the new rifle
// grafted on, by assets/custom/sandtrooper-commander/cut.py; its frames are
// wide for the longer barrel, and a little taller for the rifle raised as it
// falls.
export default defineMonster({
  id: 'sandtrooper-commander',
  name: 'Sandtrooper Commander',
  glyph: 'S',
  sheet: { src: 'assets/sprites/monsters/sandtrooper-commander.png', frameWidth: 100, frameHeight: 72 },
  scale: 0.85,
  health: 70,
  speed: 4,
  radius: 0.5, // like the player: a body fits one tile width, so it can stand on one stair
  height: 1.76,
  painChance: 0.25,
  reactionTime: 0.45,
  cooldown: [1.1, 2.1],
  attack: { kind: 'projectile', projectile: 'trooper-bolt', spread: 0.07, range: 60, sound: 'blaster-enemy' },
  light: { radius: 3.5, light: 80 }, // the muzzle flash, on the attack's fullbright frames
  anims: {
    // The sandtrooper's frame order: the walk's views are 13-36 (front
    // three-quarter, side, back three-quarter, back).
    idle: { frames: [1], fps: 1, loop: true, views: { frontSide: [14], side: [20], backSide: [26], back: [32] } },
    walk: { frames: [0, 1, 2, 3, 4, 5], fps: 8, views: { frontSide: [13, 14, 15, 16, 17, 18], side: [19, 20, 21, 22, 23, 24], backSide: [25, 26, 27, 28, 29, 30], back: [31, 32, 33, 34, 35, 36] } },
    attack: { frames: [6, 7, 6, 7, 6, 7, 6], durations: [0.35, 0.1, 0.08, 0.1, 0.08, 0.1, 0.25], fireAt: [1, 3, 5], fullbright: [1, 3, 5] },
    pain: { frames: [8], durations: [0.2] },
    death: { frames: [9, 10, 11, 12], fps: 7 },
  },
  sounds: { sight: 'trooper-sight', pain: 'trooper-pain', death: 'trooper-death' },
  drops: [{ item: 'power-cell', chance: 1 }],
});
