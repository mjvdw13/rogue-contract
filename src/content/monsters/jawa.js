import { defineMonster } from '../../engine/defs.js';

// A Jawa: a small hooded scavenger, up to a trooper's chest, with an ion
// blaster. Weak and quick, it chatters, flinches easily and fires slow blue
// ion blasts. The art is cut from a sprite sheet by assets/custom/jawa/cut.py,
// at the Dark Forces sprites' pixel size (hence the scale).
export default defineMonster({
  id: 'jawa',
  name: 'Jawa',
  glyph: 'j',
  sheet: { src: 'assets/sprites/monsters/jawa.png', frameWidth: 50, frameHeight: 49 },
  scale: 0.85,
  health: 12,
  speed: 5.5,
  radius: 0.3,
  height: 1.25,
  mass: 40,
  painChance: 0.8,
  reactionTime: 0.6,
  cooldown: [1.2, 2.6],
  attack: { kind: 'projectile', projectile: 'ion-bolt', spread: 0.12, range: 40, sound: 'ion-fire' },
  anims: {
    idle: { frames: [1], fps: 1, loop: true },
    walk: { frames: [0, 1, 2, 3, 4, 5], fps: 10 },
    attack: { frames: [6, 7, 6], durations: [0.4, 0.12, 0.25], fireAt: 1, fullbright: [1] },
    pain: { frames: [8], durations: [0.2] },
    death: { frames: [9, 10, 11, 12], fps: 7 },
  },
  sounds: { sight: 'jawa-sight', pain: 'jawa-pain', death: 'jawa-death' },
  drops: [{ item: 'power-cell', chance: 0.5 }],
});
