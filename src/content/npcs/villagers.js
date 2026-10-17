import { defineNpc } from '../../engine/defs.js';

// Townsfolk: friendly characters who stroll about and say a line when Kyle
// bumps into them or uses them. The art is cut from Mark's villager sheets by
// assets/custom/villagers/cut.py, at the Dark Forces sprites' pixel size
// (hence the scale), in one frame order: 0-5 walk, 6 stand, 7-8 flinch, 9
// hunch (pain) and 10-13 a fall-back death. NPCs can't be hurt yet, so the
// last five are for later (Mission 1's civilians).
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
    anims: {
      idle: { frames: [6], fps: 1, loop: true },
      walk: { frames: [0, 1, 2, 3, 4, 5], fps: 7 },
      react: { frames: [7, 8, 6], durations: [0.3, 0.7, 0.8] },
    },
    lines,
  });
}

export default [
  villager({
    id: 'villager-boy',
    name: 'FARM BOY',
    glyph: 'u',
    frameWidth: 58,
    frameHeight: 58,
    height: 1.5,
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
    frameHeight: 63,
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
