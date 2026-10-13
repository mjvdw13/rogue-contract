import { defineMonster } from '../../engine/defs.js';

// An Imperial officer: no armour, a sidearm, and usually the one carrying the
// keycards (place them with `drops: ['keycard-red']` in the level).
export default defineMonster({
  id: 'officer',
  name: 'Imperial Officer',
  glyph: 'o',
  sheet: { src: 'assets/sprites/monsters/officer.png', frameWidth: 64, frameHeight: 64 },
  health: 20,
  speed: 5,
  radius: 0.5, // like the player: a body fits one tile width, so it can stand on one stair
  height: 1.76,
  painChance: 0.7,
  reactionTime: 0.6,
  cooldown: [1.2, 2.4],
  attack: { kind: 'projectile', projectile: 'trooper-bolt', spread: 0.09, range: 52, sound: 'blaster-enemy' },
  anims: {
    idle: { frames: [1], fps: 1, loop: true },
    walk: { frames: [0, 1, 2, 3], fps: 6 },
    attack: { frames: [4, 5, 4], durations: [0.35, 0.12, 0.2], fireAt: 1, fullbright: [1] },
    pain: { frames: [6], durations: [0.15] },
    death: { frames: [7, 8, 9, 10, 11], fps: 8 },
  },
  sounds: { sight: 'trooper-sight', pain: 'trooper-pain', death: 'trooper-death' },
  drops: [{ item: 'power-cell', chance: 0.4 }],
});
