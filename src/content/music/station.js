import { defineSong } from '../../engine/defs.js';
import { sub, lead, pad, bell, kick, tom, hat } from './instruments.js';

// An original slow D minor piece for the battle station (m4): a low drone
// that never lets up, a heartbeat of drums, a horn call that climbs a
// minor third and falls back, and far-off bells. Slower and emptier than
// the garrison's march: the place is too big to hurry in.
export default defineSong({
  id: 'station',
  bpm: 76,
  echo: { time: 0.59, feedback: 0.35 },
  instruments: { sub, lead: { ...lead, wave: 'saw', cutoff: 1100, volume: 0.07 }, pad, bell: { ...bell, volume: 0.08 }, kick, tom: { ...tom, volume: 0.22 }, hat: { ...hat, volume: 0.05 } },
  patterns: {
    drone: {
      sub: 'D1 - - - - - - - D1 - - - - - - -',
      pad: 'D2+A2+D3 . . . . . . . . . . . . . . .',
      kick: 'x . . x . . . . x . . x . . . .',
    },
    a: {
      sub: 'D1 - - - - - - - D1 - - - - - C1 -',
      pad: 'D2+A2+F3 . . . . . . . . . . . . . . .',
      lead: 'D3 - - - F3 - - - E3 - - - D3 - - .',
      kick: 'x . . x . . . . x . . x . . . .',
      hat: '. . x . . . x . . . x . . . x .',
    },
    b: {
      sub: 'A#0 - - - - - - - A#0 - - - - - - -',
      pad: 'A#1+F2+D3 . . . . . . . . . . . . . . .',
      lead: 'F3 - - - A3 - - - G3 - - - F3 - E3 -',
      kick: 'x . . x . . . . x . . x . . . .',
      hat: '. . x . . . x . . . x . . . x .',
      bell: '. . . . . . . . . . D5 . . . A4 .',
    },
    c: {
      sub: 'G0 - - - - - - - A0 - - - - - - -',
      pad: 'G1+D2+A#2 . . . . . . . A1+E2+C#3 . . . . . . .',
      lead: 'G3 - - - A#3 - - - A3 - - - - - - .',
      kick: 'x . . x . . . . x . . x . . x .',
      tom: '. . . . . . . . . . . . x . x x',
      hat: '. . x . . . x . . . x . . . x .',
    },
    still: {
      sub: 'D1 - - - - - - - - - - - - - - -',
      pad: 'D2+A2+D3 . . . . . . . . . . . . . . .',
      bell: 'D5 . . . . . A4 . . . . . F4 . . .',
      kick: 'x . . . . . . . x . . . . . . .',
    },
  },
  sequence: ['drone', 'drone', 'a', 'b', 'a', 'c', 'still', 'a', 'b', 'c', 'drone', 'still'],
  volume: 0.85,
});
