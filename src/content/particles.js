import { defineParticle } from '../engine/defs.js';

// Particle types (PLAN.md Phase 1b T): points and discs drawn straight into
// the frame, far cheaper than sprites. Colours run over each particle's life,
// as palette ramp steps counted from the ramp's dark end. At most 1000 points
// and 150 discs live at once (world/particles.js), so each type keeps a cap
// of its own well inside those.

export default [
  // Hot sparks: glowing streaks that fall, bounce and cool from white to red.
  defineParticle({
    id: 'spark',
    colors: [{ ramp: 'glow-yellow', from: 6, to: 0 }],
    life: [0.4, 1],
    size: 0.02,
    streak: 0.04,
    fullbright: true,
    blend: 'add',
    gravity: 6,
    bounce: 0.5,
    onFloor: 'bounce',
    walls: 'bounce',
    cap: 400,
  }),
  // Embers rising from a fire: slow, drifting, fading out.
  defineParticle({
    id: 'ember',
    colors: [['glow-yellow', 4], ['glow-yellow', 2], ['glow-yellow', 1], ['glow-red', 2], ['glow-red', 0]],
    life: [0.8, 1.8],
    size: 0.02,
    maxPx: 2,
    fullbright: true,
    blend: 'add',
    gravity: -1.2,
    drag: 1.5,
    wind: 0.5,
    onFloor: 'die',
    cap: 200,
  }),
  // Shrapnel: bits of metal that fly, bounce once or twice and lie a moment.
  defineParticle({
    id: 'shrapnel',
    colors: [{ ramp: 'gray', from: 14, to: 8 }, ['rust', 6], ['rust', 4]],
    life: [1.5, 3],
    size: 0.05,
    maxPx: 3,
    gravity: 9.8,
    bounce: 0.35,
    onFloor: 'stick',
    walls: 'bounce',
    cap: 200,
  }),
  // Smoke: grey puffs that rise, slow down and thin out.
  defineParticle({
    id: 'smoke',
    colors: [{ ramp: 'gray', from: 9, to: 4 }],
    life: [2, 4],
    size: 0.5,
    maxPx: 16,
    shape: 'disc',
    blend: 'half',
    gravity: -0.6,
    drag: 0.8,
    wind: 0.6,
    onFloor: 'die',
    cap: 100,
  }),
  // Steam: pale, dithered puffs that rise fast and vanish.
  defineParticle({
    id: 'steam',
    colors: [{ ramp: 'steel', from: 27, to: 22 }],
    life: [1, 2.5],
    size: 0.4,
    maxPx: 16,
    shape: 'disc',
    blend: 'dither',
    alpha: 0.9,
    gravity: -1,
    drag: 0.6,
    wind: 0.4,
    onFloor: 'die',
    cap: 100,
  }),
  // Dust and sand: single motes carried on the wind.
  defineParticle({
    id: 'dust',
    colors: [{ ramp: 'sand', from: 9, to: 6 }],
    life: [2, 4],
    size: 0.02,
    maxPx: 1,
    drag: 0.5,
    wind: 1,
    onFloor: 'die',
    cap: 500,
  }),
];
