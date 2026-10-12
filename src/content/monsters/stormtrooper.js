import { defineMonster } from '../../engine/defs.js';

// The Imperial stormtrooper: the garrison's rank and file. Fires slow red
// bolts you can sidestep, and isn't the best shot.
export default defineMonster({
  id: 'stormtrooper',
  name: 'Stormtrooper',
  glyph: 't',
  sheet: { src: 'assets/sprites/monsters/stormtrooper.png', frameWidth: 64, frameHeight: 64 },
  health: 30,
  speed: 2.2,
  radius: 0.28,
  height: 0.88,
  painChance: 0.5,
  reactionTime: 0.5,
  cooldown: [0.9, 2],
  attack: { kind: 'projectile', projectile: 'trooper-bolt', spread: 0.07, range: 30, sound: 'blaster-enemy' },
  anims: {
    idle: { frames: [1], fps: 1, loop: true },
    walk: { frames: [0, 1, 2, 3], fps: 6 },
    attack: { frames: [4, 5, 4], durations: [0.3, 0.12, 0.2], fireAt: 1, fullbright: [1] },
    pain: { frames: [6], durations: [0.15] },
    death: { frames: [7, 8, 9, 10, 11], fps: 8 },
  },
  sounds: { sight: 'trooper-sight', pain: 'trooper-pain', death: 'trooper-death' },
  drops: [{ item: 'power-cell', chance: 0.6 }],
});
