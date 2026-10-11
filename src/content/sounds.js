import { defineSound } from '../engine/defs.js';

// Every sound effect, synthesized from parameters (see src/engine/audio/synth.js).
// To use a recorded sound instead: defineSound({ id: 'staple-fire', src: 'assets/sounds/staple.wav' }).

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
const squeak = (freq, duration = 0.07, volume = 0.35) => ({ wave: 'sine', freq, freqEnd: freq * 1.3, duration, attack: 0.005, release: duration * 0.6, volume, vibrato: { rate: 30, depth: 1 } });
const chitter = (freq, count, interval, volume = 0.3) => ({ ...click(freq, volume), highpass: 800, repeat: { count, interval, decay: 0.92 } });
const hiss = (duration, volume = 0.5) => ({ wave: 'noise', duration, attack: 0.04, release: duration * 0.6, highpass: 3500, volume });
// A deep, evil "ha... ha... ha...", each laugh a little lower.
const cackle = (freq, count, interval, volume = 0.6) => ({
  ...groan(freq, freq * 0.8, interval * 0.7, volume, { lowpass: 1200, vibrato: { rate: 9, depth: 1.2 } }),
  repeat: { count, interval, pitch: 0.94, decay: 0.92 },
});
const buzz = (freq, duration, volume = 0.4, extra = {}) => ({
  wave: 'saw', freq, duration, attack: 0.03, release: duration * 0.4, lowpass: 2500, vibrato: { rate: 45, depth: 0.5 }, volume,
  layers: [{ wave: 'noise', duration, attack: 0.03, release: duration * 0.4, highpass: 3000, volume: volume * 0.3 }],
  ...extra,
});

export default [
  // --------------------------------------------------------- weapons
  defineSound({
    id: 'staple-fire',
    synth: { ...burst(0.2, [7000, 700], 0.85, 2), layers: [thump(190, 60, 0.12, 0.6), click(2200, 0.3)], ...crunch },
    pitchVariance: 0.06,
  }),
  defineSound({
    id: 'tack-fire',
    synth: { ...burst(0.5, [5000, 300], 1, 3), distortion: 0.5, layers: [thump(110, 35, 0.35, 1), click(1600, 0.35)], ...crunch },
    pitchVariance: 0.04,
  }),
  defineSound({
    id: 'tack-pump',
    synth: { ...click(700, 0.5), highpass: 300, layers: [{ ...burst(0.05, [3000, 1500], 0.4), delay: 0 }, { ...click(500, 0.5), delay: 0.16 }, { ...burst(0.05, [2500, 1200], 0.4), delay: 0.16 }] },
  }),
  defineSound({
    id: 'typewriter-fire',
    synth: { ...burst(0.12, [8000, 1500], 0.75, 2), layers: [click(2600, 0.45), thump(160, 70, 0.08, 0.5), { ...click(3200, 0.2), delay: 0.03 }], ...crunch },
    pitchVariance: 0.08,
  }),
  defineSound({
    id: 'toner-fire',
    synth: { wave: 'noise', duration: 0.5, attack: 0.01, release: 0.4, lowpass: [400, 3500], volume: 0.8, noiseHold: 2, layers: [thump(90, 50, 0.25, 0.6)] },
  }),
  defineSound({
    id: 'explode',
    synth: {
      wave: 'noise', duration: 1.1, attack: 0.002, decay: 0.2, sustain: 0.45, release: 0.8, lowpass: [2400, 150], noiseHold: 4,
      distortion: 0.5, volume: 1, layers: [thump(70, 28, 0.7, 1)], ...crunch,
    },
    pitchVariance: 0.08,
  }),
  defineSound({
    id: 'bfc-charge',
    synth: {
      wave: 'saw', freq: 90, freqEnd: 700, duration: 0.6, attack: 0.05, release: 0.1, lowpass: [400, 3000], vibrato: { rate: 14, depth: 1 }, volume: 0.6,
      layers: [{ wave: 'noise', duration: 0.6, noiseHold: 40, lowpass: 900, volume: 0.35, release: 0.2 }],
    },
  }),
  defineSound({
    id: 'bfc-fire',
    synth: { wave: 'noise', duration: 0.7, attack: 0.01, release: 0.5, lowpass: [3000, 400], noiseHold: 3, volume: 0.9, distortion: 0.4, layers: [thump(60, 30, 0.5, 1), { wave: 'sine', freq: 300, freqEnd: 80, duration: 0.6, vibrato: { rate: 20, depth: 2 }, volume: 0.4 }] },
  }),
  defineSound({
    id: 'bfc-explode',
    synth: {
      wave: 'noise', duration: 1.6, attack: 0.002, decay: 0.3, sustain: 0.5, release: 1.2, lowpass: [3000, 100], noiseHold: 5, distortion: 0.6, volume: 1,
      layers: [thump(55, 22, 1.2, 1), { wave: 'noise', duration: 1.4, delay: 0.2, highpass: 3000, volume: 0.2, release: 1 }],
      ...crunch,
    },
  }),
  defineSound({ id: 'paw-swipe', synth: { wave: 'noise', duration: 0.16, attack: 0.03, release: 0.1, highpass: 1200, lowpass: [5000, 1500], volume: 0.5 }, pitchVariance: 0.1 }),
  defineSound({ id: 'paw-hit', synth: { ...thump(140, 50, 0.14, 0.9), layers: [burst(0.06, [3000, 600], 0.6)] }, pitchVariance: 0.1 }),

  // --------------------------------------------------------- world
  defineSound({
    id: 'door-open',
    synth: { wave: 'saw', freq: 55, freqEnd: 85, duration: 0.75, attack: 0.05, release: 0.2, lowpass: 700, volume: 0.45, vibrato: { rate: 30, depth: 0.5 }, layers: [{ wave: 'noise', duration: 0.75, lowpass: 1400, volume: 0.25, release: 0.2 }] },
  }),
  defineSound({
    id: 'door-close',
    synth: { wave: 'saw', freq: 85, freqEnd: 55, duration: 0.6, attack: 0.05, release: 0.1, lowpass: 700, volume: 0.45, vibrato: { rate: 30, depth: 0.5 }, layers: [{ ...thump(90, 40, 0.2, 0.9), delay: 0.55 }, { ...burst(0.1, [2000, 400], 0.5), delay: 0.55 }] },
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
  defineSound({ id: 'item-food', synth: { ...burst(0.06, [1800, 600], 0.6, 6), repeat: { count: 3, interval: 0.08, decay: 0.8 } } }),
  defineSound({ id: 'item-slurp', synth: { wave: 'sine', freq: 250, freqEnd: 900, duration: 0.35, attack: 0.02, release: 0.1, vibrato: { rate: 16, depth: 1.5 }, volume: 0.45, layers: [{ wave: 'noise', duration: 0.35, lowpass: 1200, volume: 0.15 }] } }),
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

  // --------------------------------------------------------- monsters
  // The bugs chitter, buzz and hiss.
  defineSound({ id: 'ant-sight', synth: { ...chitter(2600, 8, 0.04, 0.35), layers: [hiss(0.35, 0.2)] } }),
  defineSound({ id: 'ant-active', synth: chitter(2200, 4, 0.06, 0.25) }),
  defineSound({ id: 'ant-pain', synth: { wave: 'square', freq: 1800, freqEnd: 900, duration: 0.12, release: 0.08, volume: 0.3, layers: [burst(0.1, [6000, 2000], 0.3)] } }),
  defineSound({ id: 'ant-death', synth: { ...burst(0.25, [5000, 600], 0.7, 2), layers: [chitter(1500, 5, 0.05, 0.3), thump(140, 60, 0.1, 0.4)] } }),
  defineSound({
    id: 'acid-spit',
    synth: { wave: 'noise', duration: 0.25, attack: 0.005, release: 0.2, highpass: 1800, lowpass: [8000, 2500], volume: 0.6, layers: [{ wave: 'sine', freq: 600, freqEnd: 200, duration: 0.08, volume: 0.3 }] },
    pitchVariance: 0.08,
  }),

  defineSound({ id: 'firefly-sight', synth: buzz(220, 0.6, 0.45, { freqEnd: 330 }) }),
  defineSound({ id: 'firefly-active', synth: buzz(200, 0.5, 0.3) }),
  defineSound({ id: 'firefly-pain', synth: buzz(340, 0.18, 0.45, { freqEnd: 260 }) }),
  defineSound({ id: 'firefly-death', synth: buzz(300, 0.9, 0.45, { freqEnd: 60 }) }),
  defineSound({ id: 'claw', synth: { wave: 'noise', duration: 0.18, attack: 0.02, release: 0.12, highpass: 1500, volume: 0.5, layers: [thump(160, 60, 0.1, 0.5)] } }),

  defineSound({ id: 'roach-sight', synth: { ...hiss(0.7, 0.6), layers: [chitter(3000, 10, 0.03, 0.3)] } }),
  defineSound({ id: 'roach-active', synth: chitter(3400, 6, 0.035, 0.22) }),
  defineSound({ id: 'roach-pain', synth: hiss(0.2, 0.55) }),
  defineSound({ id: 'roach-death', synth: { ...burst(0.35, [4000, 500], 0.8, 3), layers: [hiss(0.6, 0.35), chitter(2000, 6, 0.06, 0.25)] } }),
  defineSound({ id: 'roach-bite', synth: { ...burst(0.12, [5000, 800], 0.7, 2), layers: [click(1800, 0.4), { ...click(2400, 0.4), delay: 0.06 }] } }),

  defineSound({
    id: 'beetle-sight', // stridulation: a slow, rasping creak
    synth: {
      wave: 'saw', freq: 90, duration: 0.05, attack: 0.005, release: 0.04, lowpass: 1800, distortion: 0.5, volume: 0.6, repeat: { count: 14, interval: 0.055, decay: 0.98 },
      layers: [{ wave: 'noise', duration: 0.9, release: 0.5, lowpass: 900, noiseHold: 4, volume: 0.3 }],
    },
  }),
  defineSound({ id: 'beetle-active', synth: { wave: 'saw', freq: 80, duration: 0.05, attack: 0.005, release: 0.04, lowpass: 1500, distortion: 0.5, volume: 0.4, repeat: { count: 6, interval: 0.07, decay: 0.95 } } }),
  defineSound({ id: 'beetle-pain', synth: { ...burst(0.2, [3000, 400], 0.7, 3), layers: [{ wave: 'saw', freq: 140, freqEnd: 90, duration: 0.2, release: 0.15, lowpass: 700, volume: 0.5 }] } }),
  defineSound({
    id: 'beetle-death',
    synth: {
      wave: 'saw', freq: 120, freqEnd: 40, duration: 1.2, attack: 0.01, release: 0.9, lowpass: 900, distortion: 0.6, volume: 0.7,
      layers: [burst(0.5, [3500, 300], 0.7, 4), { ...click(900, 0.4), repeat: { count: 8, interval: 0.12, pitch: 0.9, decay: 0.85 }, delay: 0.2 }],
    },
  }),
  defineSound({ id: 'mandible-snap', synth: { ...click(1100, 0.7), layers: [thump(120, 50, 0.2, 0.9), burst(0.12, [5000, 1200], 0.5, 2)] } }),
  defineSound({ id: 'acid-launch', synth: { wave: 'sine', freq: 300, freqEnd: 1100, duration: 0.4, attack: 0.01, release: 0.25, vibrato: { rate: 25, depth: 2 }, volume: 0.45, layers: [burst(0.4, [800, 3000], 0.35)] } }),
  defineSound({ id: 'acid-hit', synth: { ...burst(0.4, [5000, 1200], 0.6, 2), highpass: 600, layers: [{ wave: 'noise', duration: 0.5, release: 0.4, highpass: 3000, volume: 0.3 }] } }),

  defineSound({ id: 'mite-sight', synth: chitter(4200, 6, 0.03, 0.25) }),
  defineSound({ id: 'mite-active', synth: chitter(4600, 3, 0.04, 0.18) }),
  defineSound({ id: 'mite-pain', synth: squeak(3200, 0.08, 0.3) }),
  defineSound({ id: 'mite-death', synth: { ...thump(400, 90, 0.08, 0.6), layers: [burst(0.15, [3000, 600], 0.5, 2)] } }), // a wet pop
  defineSound({ id: 'mite-bite', synth: { ...burst(0.05, [6000, 2000], 0.4), layers: [click(3000, 0.3)] } }),

  defineSound({
    id: 'collector-sight',
    synth: { wave: 'saw', freq: 48, freqEnd: 40, duration: 1.1, attack: 0.1, release: 0.5, lowpass: 380, distortion: 0.9, volume: 0.8, layers: [{ wave: 'noise', duration: 1.1, lowpass: 600, noiseHold: 6, volume: 0.5, release: 0.6 }, chitter(1200, 6, 0.08, 0.3)] },
  }),
  defineSound({ id: 'collector-active', synth: { wave: 'noise', duration: 0.08, highpass: 900, lowpass: 3000, volume: 0.35, noiseHold: 3, repeat: { count: 5, interval: 0.09, decay: 0.85 } } }),
  defineSound({ id: 'collector-pain', synth: { ...burst(0.3, [2500, 300], 0.8, 5), layers: [thump(90, 40, 0.2, 0.6)] } }),
  defineSound({
    id: 'collector-death',
    synth: { wave: 'noise', duration: 1.4, attack: 0.01, release: 1, lowpass: [2000, 200], noiseHold: 6, volume: 0.9, layers: [{ ...click(1300, 0.4), repeat: { count: 6, interval: 0.17, pitch: 0.9, decay: 0.85 }, delay: 0.3 }] },
  }),
  defineSound({ id: 'shell-slam', synth: { ...thump(80, 35, 0.3, 1), layers: [burst(0.2, [2000, 300], 0.7, 4)] } }),
  defineSound({ id: 'trash-throw', synth: { wave: 'noise', duration: 0.3, attack: 0.05, release: 0.2, lowpass: [600, 2000], volume: 0.5 } }),
  defineSound({ id: 'trash-splat', synth: { ...burst(0.35, [1500, 200], 0.9, 3), layers: [thump(100, 40, 0.2, 0.8)] } }),

  defineSound({ id: 'fireball-launch', synth: { wave: 'noise', duration: 0.4, attack: 0.02, release: 0.3, lowpass: [700, 3200], volume: 0.6, layers: [{ wave: 'noise', duration: 0.4, noiseHold: 25, volume: 0.2, lowpass: 2000 }] } }),
  defineSound({ id: 'fireball-hit', synth: { ...burst(0.45, [3500, 300], 0.8, 3), distortion: 0.3, layers: [{ wave: 'noise', duration: 0.4, noiseHold: 30, volume: 0.25 }] } }),

  defineSound({ id: 'pumpkin-sight', synth: { ...cackle(150, 6, 0.2, 0.65), layers: [groan(55, 42, 1.6, 0.5, { lowpass: 380 })] } }),
  defineSound({ id: 'pumpkin-active', synth: cackle(170, 3, 0.16, 0.45) }),
  defineSound({ id: 'pumpkin-pain', synth: { ...groan(120, 70, 0.45, 0.7), layers: [burst(0.25, [1200, 200], 0.6, 4), thump(90, 40, 0.25, 0.6)] } }),
  defineSound({
    id: 'pumpkin-death',
    synth: {
      ...groan(130, 40, 2.2, 0.75, { lowpass: 700 }),
      layers: [
        // The rind splitting, then a wet burst of pulp and a long burning crackle.
        { ...burst(0.5, [3000, 200], 0.9, 3), delay: 0.5 },
        { wave: 'noise', duration: 3, attack: 0.2, release: 2.5, lowpass: [2500, 400], noiseHold: 18, volume: 0.45, delay: 0.6 },
        { ...thump(70, 25, 1.5, 1), delay: 0.5 },
      ],
    },
  }),
  defineSound({ id: 'pumpkin-rustle', synth: { wave: 'noise', duration: 0.3, attack: 0.08, release: 0.2, lowpass: [500, 1400], noiseHold: 4, volume: 0.35 } }),
  defineSound({ id: 'pumpkin-cackle', synth: cackle(190, 8, 0.15, 0.7) }),
  defineSound({ id: 'pumpkin-spit', synth: { ...thump(160, 60, 0.2, 0.7), layers: [{ wave: 'noise', duration: 0.5, attack: 0.02, release: 0.4, lowpass: [700, 3200], volume: 0.6 }, { wave: 'noise', duration: 0.45, noiseHold: 25, volume: 0.2, lowpass: 2000, delay: 0.05 }] } }),

  // --------------------------------------------------------- coworkers
  defineSound({
    id: 'npc-sigh', // a long, tired exhale
    synth: {
      wave: 'noise', duration: 1.1, attack: 0.2, decay: 0.3, sustain: 0.6, release: 0.6, lowpass: [1700, 380], volume: 0.35,
      layers: [{ wave: 'saw', freq: 180, freqEnd: 115, duration: 0.9, attack: 0.12, release: 0.5, lowpass: 480, volume: 0.1, vibrato: { rate: 4, depth: 0.3 } }],
    },
  }),
  defineSound({
    id: 'npc-hmph', // an unimpressed "hm"
    synth: { wave: 'saw', freq: 165, freqEnd: 150, duration: 0.24, attack: 0.02, release: 0.14, lowpass: 600, volume: 0.32, layers: [{ wave: 'noise', duration: 0.12, release: 0.1, lowpass: 1300, volume: 0.22 }] },
  }),
  defineSound({
    id: 'npc-phone', // tinny chatter from the handset
    synth: {
      wave: 'square', freq: 620, duration: 0.07, attack: 0.005, release: 0.05, highpass: 500, lowpass: 2200, volume: 0.22, vibrato: { rate: 18, depth: 2 },
      repeat: { count: 6, interval: 0.1, decay: 0.93, pitch: 1.04 },
      layers: [{ wave: 'square', freq: 470, duration: 0.06, release: 0.05, highpass: 500, lowpass: 2000, volume: 0.18, delay: 0.05, repeat: { count: 5, interval: 0.12, pitch: 0.97 } }],
    },
  }),
  defineSound({
    id: 'npc-huh', // a rising "huh?"
    synth: { wave: 'saw', freq: 150, freqEnd: 290, slide: 0.26, duration: 0.32, attack: 0.03, release: 0.15, lowpass: 900, volume: 0.32, vibrato: { rate: 6, depth: 0.2 } },
  }),
  defineSound({
    id: 'npc-yay', // a happy little "yay!"
    synth: {
      wave: 'triangle', freq: 520, freqEnd: 780, slide: 0.12, duration: 0.3, attack: 0.02, release: 0.14, volume: 0.4, vibrato: { rate: 9, depth: 0.4 },
      layers: [{ wave: 'triangle', freq: 780, freqEnd: 1040, duration: 0.25, delay: 0.16, release: 0.15, volume: 0.32 }],
    },
  }),
];
