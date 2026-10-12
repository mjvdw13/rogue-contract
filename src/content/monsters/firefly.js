import { defineMonster } from '../../engine/defs.js';

// The Exception Firefly: hovers at head height and throws exceptions, burning
// ones, from the lantern in its tail (Doom's imp).
export default defineMonster({
  id: 'firefly',
  name: 'Exception Firefly',
  glyph: 'm',
  sheet: { src: 'assets/sprites/monsters/firefly.png', frameWidth: 64, frameHeight: 64 },
  health: 60,
  speed: 2.4,
  radius: 0.3,
  flying: true,
  z: 0.35, // hovers this far above the floor its target stands on
  painChance: 0.7,
  reactionTime: 0.45,
  cooldown: [1.2, 2.6],
  attack: { kind: 'projectile', projectile: 'exception-fireball', range: 32 },
  melee: { kind: 'melee', damage: [3, 24], range: 1.0, hitSound: 'claw' },
  anims: {
    idle: { frames: [0, 2], fps: 2, loop: true },
    walk: { frames: [0, 1, 2, 3], fps: 10 },
    attack: { frames: [4, 5, 6], durations: [0.25, 0.2, 0.25], fireAt: 2 },
    pain: { frames: [7], durations: [0.15] },
    death: { frames: [8, 9, 10, 11, 12], fps: 8 },
  },
  sounds: { sight: 'firefly-sight', active: 'firefly-active', pain: 'firefly-pain', death: 'firefly-death' },
  blood: 'ichor',
});
