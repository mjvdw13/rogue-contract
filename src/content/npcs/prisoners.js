import { defineNpc } from '../../engine/defs.js';

// The battle station's prisoners (m4): Rusk and whoever else is in the
// cells. Stand-ins until they have sheets of their own: the spacer's and
// the drifter's (see villagers.js for the frame order). They can't be hurt
// and they stay in their cells.
const range = (a, n) => Array.from({ length: n }, (_, i) => a + i);

function prisoner({ id, name, glyph, sheet, frameWidth, frameHeight, lines }) {
  return defineNpc({
    id,
    name,
    glyph,
    sheet: { src: `assets/sprites/npcs/${sheet}.png`, frameWidth, frameHeight },
    scale: 0.85,
    radius: 0.5,
    height: 1.76,
    wander: 0,
    speed: 2,
    idleTime: [2, 6],
    anims: {
      idle: { frames: [6], fps: 1, loop: true, views: { frontSide: [38], side: [39], backSide: [40], back: [41] } },
      walk: { frames: range(0, 6), fps: 7 },
      react: { frames: [7, 8, 6], durations: [0.3, 0.7, 0.8] },
    },
    lines,
  });
}

export default [
  prisoner({ id: 'rusk', name: 'RUSK', glyph: 'Ʀ', sheet: 'villager-man', frameWidth: 58, frameHeight: 69, lines: ['Go. The waste hatch.'] }),
  prisoner({
    id: 'prisoner',
    name: 'PRISONER',
    glyph: 'Ƥ',
    sheet: 'villager-wanderer',
    frameWidth: 56,
    frameHeight: 69,
    lines: ['I was never on Tatooine. Tell them.', "They don't ask twice. Then the droid comes.", "You're not one of them. Get out while the door's open."],
  }),
];
