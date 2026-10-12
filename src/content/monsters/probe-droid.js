import { defineMonster } from '../../engine/defs.js';

// An Imperial probe droid: a flying sphere of lenses and arms that hovers at
// head height, shoots bolts, and blows up when destroyed.
export default defineMonster({
  id: 'probe-droid',
  name: 'Probe Droid',
  glyph: 'p',
  sheet: { src: 'assets/sprites/monsters/probe-droid.png', frameWidth: 64, frameHeight: 64 },
  health: 45,
  speed: 1.8,
  radius: 0.32,
  height: 0.9,
  flying: true,
  z: 0.45, // hovers this far above the floor its target stands on
  painChance: 0.3,
  reactionTime: 0.5,
  cooldown: [1.2, 2.6],
  attack: { kind: 'projectile', projectile: 'trooper-bolt', spread: 0.04, range: 34, sound: 'blaster-enemy' },
  anims: {
    idle: { frames: [0, 1, 2, 3], fps: 4, loop: true },
    walk: { frames: [0, 1, 2, 3], fps: 6 },
    attack: { frames: [4, 5, 4], durations: [0.3, 0.12, 0.2], fireAt: 1, fullbright: [1] },
    pain: { frames: [6], durations: [0.15] },
    death: { frames: [7, 8, 9, 10, 11], fps: 8 },
  },
  sounds: { sight: 'droid-sight', active: 'droid-active', pain: 'droid-pain', death: 'explode' },
  bleeds: false,
  explode: { radius: 1.6, damage: 30 },
  mass: 60,
});
