import { defineMonster } from '../../engine/defs.js';

// Boba Fett: walks like the troopers, a little quicker, slow to flinch,
// firing rockets that burst. He aims from a wide stance.
export default defineMonster({
  id: 'boba-fett',
  name: 'Boba Fett',
  glyph: 'F',
  sheet: { src: 'assets/sprites/monsters/boba-fett.png', frameWidth: 64, frameHeight: 64 },
  health: 200,
  speed: 4.8,
  radius: 0.5, // like the player: a body fits one tile width, so it can stand on one stair
  height: 1.83,
  painChance: 0.15,
  reactionTime: 0.3,
  cooldown: [0.7, 1.6],
  attack: { kind: 'projectile', projectile: 'rocket', spread: 0.05, range: 64, sound: 'rocket-fire' },
  light: { radius: 3.5, light: 96 }, // the rocket leaving, on the attack's fullbright frame
  anims: {
    // Standing from the other views is 11-14 (front three-quarter, side, back
    // three-quarter, back), on the Dark Forces sheet only; he glides in them.
    idle: { frames: [0], fps: 1, loop: true, views: { frontSide: [11], side: [12], backSide: [13], back: [14] } },
    walk: { frames: [0, 1, 2, 3], fps: 6, views: { frontSide: [11, 11, 11, 11], side: [12, 12, 12, 12], backSide: [13, 13, 13, 13], back: [14, 14, 14, 14] } },
    attack: { frames: [4, 5, 4], durations: [0.25, 0.15, 0.2], fireAt: 1, fullbright: [1] },
    pain: { frames: [6], durations: [0.12] }, // the first frame of his fall
    death: { frames: [7, 8, 9, 10], fps: 7 },
  },
  sounds: { pain: 'trooper-pain', death: 'trooper-death' },
  drops: [{ item: 'energy-pack', chance: 1 }],
  mass: 120,
  boss: true,
});
