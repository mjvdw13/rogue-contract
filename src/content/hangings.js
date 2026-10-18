import { defineHanging, defineTexture } from '../engine/defs.js';

// Ropes, cables and cloth hanging from the buildings (world/hangings.js),
// placed by a level's `hangings`. Colours are palette ramps (palette.js).
// A cloth's texture gives it its weave, and its tears and holes as
// transparent texels (tools/art/textures/cloth.js).

export const clothTextures = ['cloth-rag', 'cloth-pale'].map((id) =>
  defineTexture({ id, src: `assets/textures/${id}.png`, fullbright: false }),
);

export default [
  // A power cable strung between houses: dark, heavy, barely moves.
  defineHanging({ id: 'cable', shape: 'rope', color: ['gray', 0.12], width: 0.05, breeze: 0.25, drag: 1 }),
  // A rope: lighter, swings more.
  defineHanging({ id: 'rope', shape: 'rope', color: ['sand', 0.45], width: 0.035, breeze: 0.6 }),
  // A rust-red rag, its hem torn to tatters.
  defineHanging({ id: 'rag', shape: 'cloth', texture: 'cloth-rag', color: ['rust', 0.55], breeze: 0.8, drag: 2.5 }),
  // A pale cloth, worn at the hem: a banner, an awning's hanging edge, laundry.
  defineHanging({ id: 'cloth-pale', shape: 'cloth', texture: 'cloth-pale', color: ['beige', 0.7], breeze: 0.8, drag: 2.5 }),
];
