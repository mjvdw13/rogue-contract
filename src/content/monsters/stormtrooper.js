import { defineMonster } from '../../engine/defs.js';

// The Imperial stormtrooper: the garrison's rank and file. Fires slow red
// bolts you can sidestep, and isn't the best shot.
export default defineMonster({
  id: 'stormtrooper',
  name: 'Stormtrooper',
  glyph: 't',
  // The brightest highlights on the armour catch the light (glints).
  sheet: { src: 'assets/sprites/monsters/stormtrooper.png', frameWidth: 64, frameHeight: 64, glint: [[255, 255, 255]] },
  health: 30,
  speed: 4.4,
  radius: 0.5, // like the player: a body fits one tile width, so it can stand on one stair
  height: 1.76,
  painChance: 0.5,
  reactionTime: 0.5,
  cooldown: [0.9, 2],
  attack: { kind: 'projectile', projectile: 'trooper-bolt', spread: 0.07, range: 60, sound: 'blaster-enemy' },
  light: { radius: 3.5, light: 80 }, // the muzzle flash, on the attack's fullbright frames
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
