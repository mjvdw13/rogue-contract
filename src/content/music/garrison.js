import { defineSong } from '../../engine/defs.js';
import { bass, lead, pad, kick, snare, hat, stab, tom } from './instruments.js';

// An original C minor march for the garrison: snare rolls, low brass stabs
// and a stern horn line over a marching bass.
export default defineSong({
  id: 'garrison',
  bpm: 104,
  echo: { time: 0.43, feedback: 0.25 },
  instruments: { bass, lead: { ...lead, wave: 'saw', cutoff: 1400, volume: 0.08 }, pad, stab, kick, snare, hat, tom },
  patterns: {
    roll: {
      bass: 'C2 . . . C2 . . . C2 . . . C2 . G1 .',
      snare: 'x . x x x . x x x . x x x x x x',
      kick: 'x . . . x . . . x . . . x . . .',
      pad: 'C2+G2+C3 . . . . . . . . . . . . . . .',
    },
    a: {
      bass: 'C2 . . C2 C2 . . . G#1 . . G#1 G#1 . . .',
      lead: 'C4 . . . C4 . D#4 . G4 . . . F4 D#4 D4 .',
      stab: 'C3+D#3+G3 - . . . . . . G#2+C3+D#3 - . . . . . .',
      kick: 'x . . . x . . . x . . . x . . .',
      snare: '. . x . . . x x . . x . . . x x',
      hat: 'x . x . x . x . x . x . x . x .',
    },
    b: {
      bass: 'G#1 . . G#1 G#1 . . . G1 . . G1 G1 . . .',
      lead: 'G#3 . . . G#3 . C4 . D#4 . D4 . C4 . A#3 .',
      stab: 'G#2+C3+D#3 - . . . . . . G2+B2+D3 - . . . . . .',
      kick: 'x . . . x . . . x . . . x . . .',
      snare: '. . x . . . x x . . x . . . x x',
      hat: 'x . x . x . x . x . x . x . x .',
    },
    c: {
      bass: 'F1 . . F1 F1 . . . G1 . . G1 G1 . B1 .',
      lead: 'C4 . D#4 . G4 . . . G#4 . G4 . F4 . D#4 .',
      stab: 'F2+G#2+C3 - . . . . . . G2+B2+D3 - . . . . . .',
      kick: 'x . . . x . . . x . . . x . x .',
      snare: '. . x . . . x x . . x . x x x x',
      hat: 'x . x . x . x . x . x . x . x .',
      tom: '. . . . . . . . . . . . x . x .',
    },
    end: {
      bass: 'C2 . . C2 C2 . . . C2 . . . G1 . . .',
      lead: 'C4 . . . . . . . . . . . . . . -',
      stab: 'C3+D#3+G3 - . . . . . . . . . . . . . .',
      kick: 'x . . . x . . . x . . . x . . .',
      snare: 'x . x x x . x x x . x x x x x x',
    },
  },
  sequence: ['roll', 'roll', 'a', 'b', 'a', 'c', 'a', 'b', 'a', 'end'],
  volume: 0.85,
});
