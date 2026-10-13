import { defineMonster } from '../../engine/defs.js';

// A sandtrooper: the desert stormtrooper, with a T-21 repeating rifle. Tougher
// than a stormtrooper, and fires bursts of three bolts. The art is cut from an
// asset sheet by assets/custom/sandtrooper/cut.py, at the Dark Forces sprites'
// pixel size (hence the scale).
export default defineMonster({
  id: 'sandtrooper',
  name: 'Sandtrooper',
  glyph: 's',
  sheet: { src: 'assets/sprites/monsters/sandtrooper.png', frameWidth: 58, frameHeight: 68 },
  scale: 0.85,
  health: 45,
  speed: 4,
  radius: 0.5, // like the player: a body fits one tile width, so it can stand on one stair
  height: 1.76,
  painChance: 0.35,
  reactionTime: 0.5,
  cooldown: [1.4, 2.6],
  attack: { kind: 'projectile', projectile: 'trooper-bolt', spread: 0.08, range: 60, sound: 'blaster-enemy' },
  anims: {
    idle: { frames: [1], fps: 1, loop: true },
    walk: { frames: [0, 1, 2, 3, 4, 5], fps: 8 },
    attack: { frames: [6, 7, 6, 7, 6, 7, 6], durations: [0.35, 0.1, 0.08, 0.1, 0.08, 0.1, 0.25], fireAt: [1, 3, 5], fullbright: [1, 3, 5] },
    pain: { frames: [8], durations: [0.2] },
    death: { frames: [9, 10, 11, 12], fps: 7 },
  },
  sounds: { sight: 'trooper-sight', pain: 'trooper-pain', death: 'trooper-death' },
  drops: [{ item: 'power-cell', chance: 0.8 }],
});
