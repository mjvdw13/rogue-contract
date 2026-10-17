import { defineNpc } from '../../engine/defs.js';

// Townsfolk: friendly characters who stroll about and say a line when Kyle
// bumps into them or uses them. Shot, they hunch over, then run from him for
// good. The art is cut from Mark's villager sheets by
// assets/custom/villagers/cut.py, at the Dark Forces sprites' pixel size
// (hence the scale), in one frame order: 0-5 walk, 6 stand, 7-8 flinch, 9
// hunch (pain) and 10-13 a fall-back death; then the walk from the other
// views (14-19 front three-quarter, 20-25 side, 26-31 back three-quarter,
// 32-37 back) and the stand from them (38-41).
const range = (a, n) => Array.from({ length: n }, (_, i) => a + i);

function villager({ id, name, glyph, frameWidth, frameHeight, height, lines }) {
  return defineNpc({
    id,
    name,
    glyph,
    sheet: { src: `assets/sprites/npcs/${id}.png`, frameWidth, frameHeight },
    scale: 0.85,
    radius: 0.5,
    height,
    wander: 5,
    speed: 2,
    idleTime: [2, 6],
    health: 20,
    fleeSpeed: 6,
    fleeDistance: 20,
    anims: {
      idle: { frames: [6], fps: 1, loop: true, views: { frontSide: [38], side: [39], backSide: [40], back: [41] } },
      walk: {
        frames: range(0, 6),
        fps: 7,
        views: { frontSide: range(14, 6), side: range(20, 6), backSide: range(26, 6), back: range(32, 6) },
      },
      react: { frames: [7, 8, 6], durations: [0.3, 0.7, 0.8] },
      pain: { frames: [9], durations: [0.4] },
      // The walk, quicker.
      flee: {
        frames: range(0, 6),
        fps: 13,
        views: { frontSide: range(14, 6), side: range(20, 6), backSide: range(26, 6), back: range(32, 6) },
      },
      death: { frames: range(10, 4), fps: 8 },
    },
    sounds: { pain: 'villager-pain', death: 'villager-death' },
    lines,
  });
}

export default [
  villager({
    id: 'villager-boy',
    name: 'FARM BOY',
    glyph: 'u',
    frameWidth: 48,
    frameHeight: 49,
    height: 1.25,
    lines: [
      'You a bounty hunter? Really?',
      'My uncle says to stay off the streets after dark.',
      "I'm going to the Academy one day. You'll see.",
      "Don't tell anyone you saw me in town.",
    ],
  }),
  villager({
    id: 'villager-woman',
    name: 'TOWNSWOMAN',
    glyph: 'w',
    frameWidth: 52,
    frameHeight: 64,
    height: 1.64,
    lines: [
      'Watch where you walk, hunter.',
      "The water seller's raised his prices again.",
      "Troopers on every corner. It wasn't like this last season.",
      'Keep that blaster holstered around my children.',
    ],
  }),
  villager({
    id: 'villager-man',
    name: 'SPACER',
    glyph: 'm',
    frameWidth: 58,
    frameHeight: 69,
    height: 1.76,
    lines: [
      'Looking for passage? Not on my ship.',
      'Customs grounded half the port this week.',
      "I don't know anyone. I didn't see anything.",
      "Buy me a drink and maybe I'll remember.",
    ],
  }),
  villager({
    id: 'villager-adventurer',
    name: 'DRIFTER',
    glyph: 'e',
    frameWidth: 56,
    frameHeight: 65,
    height: 1.68,
    lines: [
      "Another hunter. The Guild's busy this month.",
      'Ask at the cantina. Everybody does.',
      "If you're after someone, I never met them.",
      "The checkpoint's closed. Has been for days.",
    ],
  }),
  villager({
    id: 'villager-wanderer',
    name: 'HERMIT',
    glyph: 'n',
    frameWidth: 56,
    frameHeight: 69,
    height: 1.78,
    lines: [
      'Hot suns today, friend.',
      'Sand gets into everything. Even your thoughts.',
      'Tuskens were out past the Dune Sea last night.',
      "Leave me be. I've walked a long way.",
    ],
  }),
];
