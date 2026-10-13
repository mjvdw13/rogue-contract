import { defineSound } from '../engine/defs.js';

// Every sound effect, synthesized from parameters (see src/engine/audio/synth.js).
// To use a recorded sound instead: defineSound({ id: 'blaster-fire', src: 'assets/sounds/blaster.wav' }).

const crunch = { bits: 7 };

// Reusable building blocks.
const thump = (freq = 120, end = 45, duration = 0.18, volume = 0.8) => ({ wave: 'sine', freq, freqEnd: end, duration, attack: 0.002, release: duration * 0.9, volume });
const burst = (duration = 0.2, lowpass = [6000, 800], volume = 0.8, noiseHold = 1) => ({ wave: 'noise', duration, attack: 0.001, release: duration * 0.95, lowpass, volume, noiseHold });
const click = (freq = 1400, volume = 0.4) => ({ wave: 'square', freq, freqEnd: freq * 0.7, duration: 0.025, attack: 0.001, release: 0.02, volume });
const groan = (freq, end, duration, volume = 0.7, extra = {}) => ({
  wave: 'saw', freq, freqEnd: end, duration, attack: 0.04, release: duration * 0.4, lowpass: 900,
  vibrato: { rate: 5, depth: 0.6 }, volume, distortion: 0.3,
  layers: [{ wave: 'noise', duration, attack: 0.05, release: duration * 0.5, lowpass: 700, volume: 0.25 }],
  ...extra,
});
const hiss = (duration, volume = 0.5) => ({ wave: 'noise', duration, attack: 0.04, release: duration * 0.6, highpass: 3500, volume });

export default [
  // --------------------------------------------------------- weapons
  // Blasters: a bright descending zap over a crack of noise.
  defineSound({
    id: 'blaster-fire',
    synth: {
      wave: 'saw', freq: 1500, freqEnd: 180, duration: 0.22, attack: 0.002, release: 0.18, lowpass: [6000, 900], volume: 0.55,
      layers: [{ wave: 'square', freq: 900, freqEnd: 120, duration: 0.16, release: 0.12, volume: 0.3 }, burst(0.06, [8000, 2000], 0.5)],
      echo: { time: 0.07, feedback: 0.3, mix: 0.35 },
    },
    pitchVariance: 0.05,
  }),
  defineSound({
    id: 'blaster-enemy',
    synth: {
      wave: 'saw', freq: 1100, freqEnd: 140, duration: 0.24, attack: 0.002, release: 0.2, lowpass: [4500, 700], volume: 0.45,
      layers: [{ wave: 'square', freq: 700, freqEnd: 100, duration: 0.18, release: 0.14, volume: 0.25 }],
    },
    pitchVariance: 0.08,
  }),
  defineSound({ id: 'bolt-hit', synth: { ...burst(0.12, [6000, 900], 0.55, 2), layers: [thump(220, 90, 0.08, 0.4)] }, pitchVariance: 0.1 }),
  defineSound({
    id: 'explode',
    synth: {
      wave: 'noise', duration: 1.1, attack: 0.002, decay: 0.2, sustain: 0.45, release: 0.8, lowpass: [2400, 150], noiseHold: 4,
      distortion: 0.5, volume: 1, layers: [thump(70, 28, 0.7, 1)], ...crunch,
    },
    pitchVariance: 0.08,
  }),
  defineSound({ id: 'punch-swing', synth: { wave: 'noise', duration: 0.16, attack: 0.03, release: 0.1, highpass: 1200, lowpass: [5000, 1500], volume: 0.5 }, pitchVariance: 0.1 }),
  defineSound({ id: 'punch-hit', synth: { ...thump(140, 50, 0.14, 0.9), layers: [burst(0.06, [3000, 600], 0.6)] }, pitchVariance: 0.1 }),

  // --------------------------------------------------------- world
  defineSound({
    id: 'door-open',
    synth: { ...hiss(0.6, 0.5), layers: [{ wave: 'saw', freq: 70, freqEnd: 110, duration: 0.55, attack: 0.03, release: 0.2, lowpass: 600, volume: 0.35, vibrato: { rate: 30, depth: 0.5 } }] },
  }),
  defineSound({
    id: 'door-close',
    synth: { ...hiss(0.5, 0.45), layers: [{ wave: 'saw', freq: 110, freqEnd: 70, duration: 0.45, attack: 0.03, release: 0.1, lowpass: 600, volume: 0.35 }, { ...thump(90, 40, 0.2, 0.8), delay: 0.45 }] },
  }),
  defineSound({
    id: 'lift-start',
    synth: { wave: 'saw', freq: 40, freqEnd: 70, duration: 0.9, attack: 0.08, release: 0.3, lowpass: 500, volume: 0.4, vibrato: { rate: 18, depth: 0.6 }, layers: [{ ...thump(70, 40, 0.15, 0.6) }, { wave: 'noise', duration: 0.9, lowpass: 900, volume: 0.15, release: 0.3 }] },
  }),
  defineSound({
    id: 'lift-stop',
    synth: { ...thump(80, 35, 0.25, 0.9), layers: [burst(0.08, [1800, 300], 0.45), { ...click(500, 0.4), delay: 0.05 }] },
  }),
  defineSound({ id: 'switch', synth: { ...click(1200, 0.6), layers: [burst(0.04, [4000, 2000], 0.4), { ...click(800, 0.5), delay: 0.09 }] } }),
  defineSound({
    id: 'secret',
    synth: { wave: 'triangle', freq: 523, duration: 0.14, attack: 0.005, release: 0.1, volume: 0.5, repeat: { count: 4, interval: 0.09, pitch: 1.26 }, echo: { time: 0.12, feedback: 0.4, mix: 0.5 } },
  }),
  defineSound({ id: 'oof', synth: groan(150, 95, 0.22, 0.6) }),
  defineSound({
    id: 'teleport',
    synth: { wave: 'sine', freq: 200, freqEnd: 1600, duration: 0.7, attack: 0.02, release: 0.3, vibrato: { rate: 18, depth: 2 }, volume: 0.5, layers: [{ wave: 'noise', duration: 0.7, highpass: 3000, volume: 0.2, release: 0.5 }] },
  }),

  // --------------------------------------------------------- items
  defineSound({ id: 'item', synth: { wave: 'square', freq: 880, freqEnd: 1320, duration: 0.09, attack: 0.002, release: 0.05, volume: 0.35, duty: 0.25 } }),
  defineSound({ id: 'item-ammo', synth: { ...click(1800, 0.45), layers: [{ ...click(2600, 0.35), delay: 0.05 }, { ...burst(0.05, [6000, 3000], 0.3), delay: 0.02 }] } }),
  defineSound({
    id: 'weapon-pickup',
    synth: { wave: 'saw', freq: 110, duration: 0.45, attack: 0.01, release: 0.3, lowpass: 2500, volume: 0.45, layers: [{ wave: 'saw', freq: 165, duration: 0.45, release: 0.3, lowpass: 2500, volume: 0.4 }, { wave: 'square', freq: 440, duration: 0.07, volume: 0.25, duty: 0.25, repeat: { count: 4, interval: 0.06, pitch: 1.19 }, delay: 0.05 }], ...crunch },
  }),
  defineSound({ id: 'key-pickup', synth: { wave: 'triangle', freq: 1046, duration: 0.3, release: 0.25, volume: 0.45, layers: [{ wave: 'triangle', freq: 1568, duration: 0.35, delay: 0.08, release: 0.3, volume: 0.4 }] } }),
  defineSound({
    id: 'powerup',
    synth: { wave: 'square', duty: 0.25, freq: 392, duration: 0.09, release: 0.06, volume: 0.35, repeat: { count: 6, interval: 0.07, pitch: 1.122 }, echo: { time: 0.1, feedback: 0.45, mix: 0.6 } },
  }),

  // --------------------------------------------------------- player
  defineSound({ id: 'player-pain', synth: groan(240, 130, 0.25, 0.7) }),
  defineSound({ id: 'player-pain-low', synth: groan(200, 110, 0.3, 0.7, { vibrato: { rate: 9, depth: 1.5 } }) }),
  defineSound({
    id: 'player-death',
    synth: {
      ...groan(230, 60, 1.1, 0.8),
      // ...and then, finally, a snore.
      layers: [
        { wave: 'noise', duration: 1.1, release: 0.5, lowpass: 700, volume: 0.25 },
        { wave: 'noise', duration: 0.7, delay: 1.3, attack: 0.3, release: 0.3, lowpass: 260, noiseHold: 12, volume: 0.5 },
        { wave: 'noise', duration: 0.7, delay: 2.3, attack: 0.3, release: 0.3, lowpass: 260, noiseHold: 12, volume: 0.45 },
      ],
    },
  }),

  // --------------------------------------------------------- menus / screens
  defineSound({ id: 'menu-open', synth: { wave: 'square', freq: 440, freqEnd: 660, duration: 0.06, volume: 0.3, duty: 0.25 } }),
  defineSound({ id: 'menu-move', synth: { wave: 'square', freq: 600, duration: 0.03, volume: 0.25, duty: 0.25 } }),
  defineSound({ id: 'menu-select', synth: { ...burst(0.12, [6000, 900], 0.6, 2), layers: [thump(180, 70, 0.1, 0.5)], ...crunch } }),
  defineSound({ id: 'menu-back', synth: { wave: 'square', freq: 500, freqEnd: 300, duration: 0.07, volume: 0.3, duty: 0.25 } }),
  defineSound({ id: 'tally', synth: { wave: 'square', freq: 1100, duration: 0.02, volume: 0.25 } }),
  defineSound({ id: 'tally-done', synth: { ...burst(0.25, [5000, 500], 0.8, 2), layers: [thump(110, 45, 0.2, 0.8)], ...crunch } }),
  defineSound({
    id: 'quit',
    synth: { wave: 'saw', freq: 300, duration: 0.32, attack: 0.02, release: 0.1, lowpass: 1200, volume: 0.5, vibrato: { rate: 6, depth: 0.4 }, repeat: { count: 4, interval: 0.36, pitch: 0.94 } },
  }),

  // --------------------------------------------------------- enemies
  // Troopers: a burst of radio static and a clipped two-tone chirp.
  defineSound({
    id: 'trooper-sight',
    synth: { ...burst(0.25, [3500, 1800], 0.35, 3), highpass: 900, layers: [{ wave: 'square', freq: 1250, duration: 0.05, release: 0.03, volume: 0.25, delay: 0.22 }, { wave: 'square', freq: 940, duration: 0.05, release: 0.03, volume: 0.25, delay: 0.29 }] },
  }),
  defineSound({ id: 'trooper-pain', synth: groan(240, 170, 0.22, 0.5, { lowpass: 1400, distortion: 0.5 }), pitchVariance: 0.1 }),
  defineSound({ id: 'trooper-death', synth: groan(260, 90, 0.6, 0.6, { lowpass: 1200, distortion: 0.5 }), pitchVariance: 0.08 }),
  // Jawas: quick, high chattering, and squeaks.
  defineSound({
    id: 'jawa-sight',
    synth: { wave: 'square', duty: 0.4, freq: 820, freqEnd: 1150, duration: 0.06, release: 0.04, lowpass: 3000, volume: 0.3, repeat: { count: 5, interval: 0.075, pitch: 1.12, decay: 0.92 } },
    pitchVariance: 0.12,
  }),
  defineSound({ id: 'jawa-pain', synth: groan(620, 430, 0.14, 0.45, { lowpass: 2600 }), pitchVariance: 0.12 }),
  defineSound({ id: 'jawa-death', synth: groan(700, 220, 0.5, 0.5, { lowpass: 2400, vibrato: { rate: 14, depth: 2 } }), pitchVariance: 0.1 }),
  // The probe droid: electronic warbles.
  defineSound({
    id: 'droid-sight',
    synth: { wave: 'square', duty: 0.25, freq: 600, duration: 0.07, release: 0.05, volume: 0.3, repeat: { count: 5, interval: 0.08, pitch: 1.3, decay: 0.9 } },
  }),
  defineSound({ id: 'droid-active', synth: { wave: 'sine', freq: 900, freqEnd: 1400, duration: 0.3, release: 0.1, volume: 0.25, vibrato: { rate: 18, depth: 1.5 } } }),
  defineSound({ id: 'droid-pain', synth: { wave: 'square', duty: 0.3, freq: 1600, freqEnd: 400, duration: 0.15, release: 0.08, volume: 0.3, ...crunch } }),
];
