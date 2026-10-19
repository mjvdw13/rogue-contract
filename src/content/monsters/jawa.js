import { defineMonster } from '../../engine/defs.js';

// A Jawa: a small hooded scavenger, up to a trooper's chest, with an ion
// blaster. Weak and quick, it chatters, flinches easily and fires slow blue
// ion blasts. The art is cut from a sprite sheet by assets/custom/jawa/cut.py,
// at the Dark Forces sprites' pixel size (hence the scale).
export default defineMonster({
  id: 'jawa',
  name: 'Jawa',
  glyph: 'j',
  sheet: { src: 'assets/sprites/monsters/jawa.png', frameWidth: 50, frameHeight: 52 },
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
  light: { radius: 3.5, light: 64 }, // the muzzle flash, on the attack's fullbright frames
  anims: {
    // The walk's views are 13-36 (front three-quarter, side, back three-quarter, back).
    // Standing: the turnaround (37-41). It has no side view: the side shows
    // the front turned a little (39).
    idle: { frames: [37], fps: 1, loop: true, views: { frontSide: [38], side: [39], backSide: [40], back: [41] } },
    walk: { frames: [0, 1, 2, 3, 4, 5], fps: 10, views: { frontSide: [13, 14, 15, 16, 17, 18], side: [19, 20, 21, 22, 23, 24], backSide: [25, 26, 27, 28, 29, 30], back: [31, 32, 33, 34, 35, 36] } },
    attack: { frames: [6, 7, 6], durations: [0.4, 0.12, 0.25], fireAt: 1, fullbright: [1] },
    pain: { frames: [8], durations: [0.2] },
    death: { frames: [9, 10, 11, 12], fps: 7 },
  },
  sounds: { sight: 'jawa-sight', pain: 'jawa-pain', death: 'jawa-death' },
  drops: [{ item: 'power-cell', chance: 0.5 }],
  // Placed calm (Mos Eisley before the shooting): scurrying about, chattering in Jawaese.
  calm: { lines: ['Utinni!', "M'um m'aloo!", 'Eeh-chu-ta!', 'Kkkt! Utinni!'], speed: 1.5, stride: 0.9, wander: 5 },
});
