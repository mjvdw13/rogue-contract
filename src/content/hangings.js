import { defineHanging } from '../engine/defs.js';

// Ropes, cables and cloth hanging from the buildings (world/hangings.js),
// placed by a level's `hangings`. Colours are palette ramps (palette.js).

export default [
  // A power cable strung between houses: dark, heavy, barely moves.
  defineHanging({ id: 'cable', shape: 'rope', color: ['gray', 0.12], width: 0.05, breeze: 0.25, drag: 1 }),
  // A rope: lighter, swings more.
  defineHanging({ id: 'rope', shape: 'rope', color: ['sand', 0.45], width: 0.035, breeze: 0.6 }),
  // A rag of rust-red cloth.
  defineHanging({ id: 'rag', shape: 'cloth', color: ['rust', 0.55], breeze: 0.8, drag: 2.5 }),
  // A pale cloth: a banner, an awning's hanging edge, laundry.
  defineHanging({ id: 'cloth-pale', shape: 'cloth', color: ['beige', 0.7], breeze: 0.8, drag: 2.5 }),
];
