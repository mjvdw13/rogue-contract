import { defineMonster } from '../../engine/defs.js';

// Bossk, the Trandoshan bounty hunter: big, slow and hard to put down. His
// concussion rifle fires slow blasts that burst, so dodging isn't enough;
// keep your distance.
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
  attack: { kind: 'projectile', projectile: 'concussion-blast', spread: 0.05, range: 56, sound: 'concussion-fire' },
  anims: {
    idle: { frames: [1], fps: 1, loop: true },
    walk: { frames: [0, 1, 2, 3], fps: 5 },
    // No muzzle flash: the blast carries its own glow.
    attack: { frames: [4, 5, 4], durations: [0.4, 0.15, 0.25], fireAt: 1 },
    pain: { frames: [6], durations: [0.15] },
    death: { frames: [7, 8, 9, 10, 11], fps: 7 },
  },
  sounds: { sight: 'bossk-sight', pain: 'bossk-pain', death: 'bossk-death' },
  drops: [{ item: 'energy-pack', chance: 1 }],
  mass: 150,
});
