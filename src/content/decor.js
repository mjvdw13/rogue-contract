import { defineDecoration } from '../engine/defs.js';

// Scenery. Solid ones block movement; ones with health can be shot (and
// `explode`).
const S = (name, w, h) => ({ src: `assets/sprites/decor/${name}.png`, frameWidth: w, frameHeight: h });

export default [
  defineDecoration({ id: 'supply-crate', glyph: 'x', sheet: S('supply-crate', 40, 40), solid: true, radius: 0.32, height: 0.6 }),
  defineDecoration({
    id: 'console',
    glyph: 'k',
    sheet: S('console', 32, 40),
    anims: { idle: { frames: [0, 1, 2], fps: 3, loop: true, fullbright: false } },
    solid: true,
    radius: 0.3,
  }),
  defineDecoration({ id: 'ceiling-lamp', glyph: 'l', sheet: S('ceiling-lamp', 48, 16), hanging: true, fullbright: true }),
  defineDecoration({
    id: 'fuel-barrel',
    glyph: 'f',
    sheet: S('fuel-barrel', 24, 32),
    anims: { idle: { frames: [0] }, death: { frames: [1, 2, 3, 4, 5], fps: 10, fullbright: [0, 1, 2, 3] } },
    solid: true,
    radius: 0.22,
    health: 20,
    bleeds: false,
    explode: { radius: 2.6, damage: 128, sound: 'explode' },
    sounds: { death: 'explode' },
  }),
];
