import { defineMonster } from '../../engine/defs.js';

// An Imperial interrogation droid: a black ball that floats at chest height
// with a syringe held out. Smaller, quicker and far more fragile than the
// probe droid, it has to come close: a weak shock across a few metres to
// hurry the player along, and the needle once it's on them. It blows up
// when destroyed, with a small blast. The sheet's order (the Dark Forces
// sheet, cut by assets/custom/cut.mjs, and the generated stand-in in
// tools/art/sprites/station.js): hover 0-3, aim 4, the shock 5, pain 6,
// death 7-11, the needle's stab 12; the hover from the other views 13-16,
// which only the Dark Forces sheet has.
export default defineMonster({
  id: 'interrogation-droid',
  name: 'Interrogation Droid',
  glyph: 'I',
  sheet: { src: 'assets/sprites/monsters/interrogation-droid.png', frameWidth: 48, frameHeight: 44 },
  health: 25,
  speed: 4.6,
  radius: 0.45,
  height: 1.2,
  flying: true,
  z: 0.7, // hovers this far above the floor its target stands on
  flySpeed: 4,
  painChance: 0.5,
  reactionTime: 0.3,
  cooldown: [0.9, 1.8],
  aggression: 0.8,
  // The shock only reaches a few tiles, so it keeps closing in between them.
  attack: { kind: 'hitscan', damage: [2, 5], spread: 0.1, range: 5, sound: 'ion-fire' },
  melee: { kind: 'melee', damage: [6, 14], range: 1.3, hitSound: 'punch-hit' },
  light: { radius: 2.5, light: 60 }, // the shock's flash, on the fullbright frames
  anims: {
    idle: { frames: [0, 1, 2, 3], fps: 4, loop: true, views: { frontSide: [13, 13, 13, 13], side: [14, 14, 14, 14], backSide: [15, 15, 15, 15], back: [16, 16, 16, 16] } },
    walk: { frames: [0, 1, 2, 3], fps: 8, views: { frontSide: [13, 13, 13, 13], side: [14, 14, 14, 14], backSide: [15, 15, 15, 15], back: [16, 16, 16, 16] } },
    attack: { frames: [4, 5, 4], durations: [0.25, 0.12, 0.2], fireAt: 1, fullbright: [1] },
    // The needle: a longer wind-up than the shock, so there's time to back off.
    melee: { frames: [4, 12, 4], durations: [0.35, 0.15, 0.3], fireAt: 1 },
    pain: { frames: [6], durations: [0.15] },
    death: { frames: [7, 8, 9, 10, 11], fps: 8 },
  },
  sounds: { sight: 'droid-sight', active: 'droid-active', pain: 'droid-pain', death: 'explode' },
  bleeds: false,
  explode: { radius: 2, damage: 12 },
  // Once the wreck lands, it spits a couple of short jets of sparks.
  corpse: { bursts: [2, 3], every: [0.3, 0.9], particles: [{ type: 'spark', count: 10, speed: [2, 4] }] },
  mass: 40,
});
