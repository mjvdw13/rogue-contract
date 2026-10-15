import { defineMonster } from '../../engine/defs.js';

// Boba Fett: flies on his jetpack, hovering off the floor like the probe
// droid, quick to move and slow to flinch, firing rockets that burst. Only
// two of his poses face the viewer, so he holds one stance in flight.
export default defineMonster({
  id: 'boba-fett',
  name: 'Boba Fett',
  glyph: 'F',
  sheet: { src: 'assets/sprites/monsters/boba-fett.png', frameWidth: 64, frameHeight: 64 },
  health: 200,
  speed: 5.5,
  radius: 0.5,
  height: 1.83,
  flying: true,
  z: 0.75, // hovers this far above the floor its target stands on
  painChance: 0.15,
  reactionTime: 0.3,
  cooldown: [0.7, 1.6],
  attack: { kind: 'projectile', projectile: 'rocket', spread: 0.05, range: 64, sound: 'rocket-fire' },
  light: { radius: 3.5, light: 96 }, // the rocket leaving, on the attack's fullbright frame
  anims: {
    idle: { frames: [0], fps: 1, loop: true },
    walk: { frames: [0], fps: 1 },
    attack: { frames: [0, 1, 0], durations: [0.25, 0.15, 0.2], fireAt: 1, fullbright: [1] },
    pain: { frames: [2], durations: [0.12] }, // the first frame of his fall
    death: { frames: [2, 3, 4, 5], fps: 7 },
  },
  sounds: { pain: 'trooper-pain', death: 'trooper-death' },
  drops: [{ item: 'energy-pack', chance: 1 }],
  mass: 120,
  boss: true,
});
