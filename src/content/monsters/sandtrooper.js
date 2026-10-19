import { defineMonster } from '../../engine/defs.js';

// A sandtrooper: the desert stormtrooper, with a T-21 repeating rifle and a
// black pauldron (its commander's is orange). Tougher than a stormtrooper, and
// fires bursts of three bolts. The art is cut from an asset sheet by
// assets/custom/sandtrooper/cut.py, at the Dark Forces sprites' pixel size;
// the scale is a little over theirs (0.85), so it stands slightly taller than
// a stormtrooper. Its frames are wide for the rifle's barrel, and a little
// taller for the rifle raised as it falls.
export default defineMonster({
  id: 'sandtrooper',
  name: 'Sandtrooper',
  glyph: 's',
  sheet: { src: 'assets/sprites/monsters/sandtrooper.png', frameWidth: 100, frameHeight: 72 },
  scale: 0.9,
  health: 45,
  speed: 4,
  radius: 0.5, // like the player: a body fits one tile width, so it can stand on one stair
  height: 1.8,
  painChance: 0.35,
  reactionTime: 0.5,
  cooldown: [1.4, 2.6],
  attack: { kind: 'projectile', projectile: 'trooper-bolt', spread: 0.08, range: 60, sound: 'blaster-enemy' },
  light: { radius: 3.5, light: 80 }, // the muzzle flash, on the attack's fullbright frames
  anims: {
    // The walk's views are 13-36 (front three-quarter, side, back three-quarter, back).
    // Standing: the walk's fourth frame, its feet together.
    idle: { frames: [3], fps: 1, loop: true, views: { frontSide: [16], side: [22], backSide: [28], back: [34] } },
    walk: { frames: [0, 1, 2, 3, 4, 5], fps: 8, views: { frontSide: [13, 14, 15, 16, 17, 18], side: [19, 20, 21, 22, 23, 24], backSide: [25, 26, 27, 28, 29, 30], back: [31, 32, 33, 34, 35, 36] } },
    attack: { frames: [6, 7, 6, 7, 6, 7, 6], durations: [0.35, 0.1, 0.08, 0.1, 0.08, 0.1, 0.25], fireAt: [1, 3, 5], fullbright: [1, 3, 5] },
    pain: { frames: [8], durations: [0.2] },
    death: { frames: [9, 10, 11, 12], fps: 7 },
  },
  sounds: { sight: 'trooper-sight', pain: 'trooper-pain', death: 'trooper-death' },
  drops: [{ item: 'power-cell', chance: 0.8 }],
  // Placed calm (Mos Eisley before the shooting): a patrol that warns you off.
  calm: { lines: ['Move along.', 'Hunter.', 'Keep that blaster holstered in town.', 'Nothing here for you. Move along.'], speed: 1.2, stride: 1.4 },
});
