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

// Mos Eisley's story, a step at a time (the flags its conversations and
// triggers set, levels/m1.js). Each townsperson has a hint for some of the
// steps among four ordinary lines, so about one bump in five points the way.
const BROKER = { unless: 'contract' }; // to the broker in the cantina
const JUNK_YARD = { if: 'contract', unless: 'signal' }; // to the Jawa trader
const INFORMANT = { if: 'signal', unless: 'pass' }; // to the informant by the checkpoint
const OLD_QUARTER = { if: 'pass', unless: 'loud' }; // to Rusk in the derelict bay
const WAY_OUT = { if: 'loud', unless: 'bay-open' }; // round the blast doors, to the customs house
const hint = (when, line) => ({ ...when, lines: [line] });

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
      hint(BROKER, "Hunters always go to the cantina first. It's on the market."),
      hint(JUNK_YARD, "The Jawas tag everything they sell. Their junk yard's up the alley off the market."),
      hint(INFORMANT, 'An old man by the checkpoint sells passes. My uncle says stay away from him.'),
      hint(WAY_OUT, 'You can get round the blast doors by the alleys. I do it all the time.'),
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
      hint(BROKER, "If it's work you want, the Guild's man drinks at the cantina."),
      hint(INFORMANT, 'Want past the checkpoint? Ask the man who lives beside it. Quietly.'),
      hint(WAY_OUT, "They've sealed the blast doors! Folk are going round through the cantina's back door."),
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
      hint(BROKER, 'The Guild keeps a broker in the cantina. Back alcove, west side.'),
      hint(JUNK_YARD, 'Lost a part? Then a Jawa sold it. Try their junk yard, north of the market.'),
      hint(OLD_QUARTER, "Nothing past that gate but squatters, and a dead freighter in the old bay."),
      hint(WAY_OUT, "Customs has locked the bays. You'd need the controls in the customs house."),
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
      "If you're after someone, I never met them.",
      'I came for a week. That was three years ago.',
      { unless: 'pass', lines: ["The checkpoint's closed. Has been for days."] },
      hint(BROKER, 'Ask at the cantina. Everybody does.'),
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
      hint(JUNK_YARD, 'The Jawas remember every part they sell, and whose hands it went to.'),
      hint(OLD_QUARTER, 'Someone has been living in the old freighter, in the dead bay. He does not come out by day.'),
    ],
  }),
];
