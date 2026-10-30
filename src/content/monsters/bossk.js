import { defineMonster } from '../../engine/defs.js';

// Bossk, the Trandoshan bounty hunter: big, slow and hard to put down. His
// concussion rifle's shot is unseen and bursts round where it lands, so
// dodging isn't enough; keep your distance. He drops the rifle.
export default defineMonster({
  id: 'bossk',
  name: 'Bossk',
  glyph: 'T',
  sheet: { src: 'assets/sprites/monsters/bossk.png', frameWidth: 64, frameHeight: 64 },
  health: 90,
  speed: 3.4,
  radius: 0.5, // like the player: a body fits one tile width, so it can stand on one stair
  height: 1.95,
  painChance: 0.25,
  reactionTime: 0.6,
  cooldown: [1.4, 2.8],
  attack: { kind: 'projectile', projectile: 'concussion-shot', range: 56 }, // (the shot carries the sound)
  anims: {
    // The walk's views are 12-27 (front three-quarter, side, back three-quarter,
    // back), on the Dark Forces sheet (assets/custom/cut.mjs) only.
    idle: { frames: [1], fps: 1, loop: true, views: { frontSide: [13], side: [17], backSide: [21], back: [25] } },
    walk: { frames: [0, 1, 2, 3], fps: 5, views: { frontSide: [12, 13, 14, 15], side: [16, 17, 18, 19], backSide: [20, 21, 22, 23], back: [24, 25, 26, 27] } },
    attack: { frames: [4, 5, 4], durations: [0.4, 0.15, 0.25], fireAt: 1 },
    pain: { frames: [6], durations: [0.15] },
    death: { frames: [7, 8, 9, 10, 11], fps: 7 },
  },
  sounds: { sight: 'bossk-sight', pain: 'bossk-pain', death: 'bossk-death' },
  drops: [{ item: 'concussion-rifle', chance: 1 }],
  mass: 150,
});
