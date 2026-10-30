import { defineHanging, defineTexture } from '../engine/defs.js';
import { AWNING_CLOTHS } from './models/awning.js';

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
  defineHanging({ id: 'rag', shape: 'cloth', texture: 'cloth-rag', color: ['rust', 0.55], breeze: 1.2, drag: 3.25 }),
  // A pale cloth, worn at the hem: a banner, an awning's hanging edge, laundry.
  defineHanging({ id: 'cloth-pale', shape: 'cloth', texture: 'cloth-pale', color: ['beige', 0.7], breeze: 1.2, drag: 3.25 }),
  // An awning's valance, swaying: its torn front edge (64 x 16, half a
  // tile deep), in each of the awning cloths.
  ...AWNING_CLOTHS.map((c) =>
    defineHanging({ id: `valance-${c}`, shape: 'cloth', texture: `awning-${c}-hem`, color: ['beige', 0.7], breeze: 1.2, drag: 3.25 }),
  ),
  // A tarp over a stall, tied at its corners (lib/town.js, tarp()): the
  // awning canvas, a coarser grid (it's wide), billowing a little.
  ...AWNING_CLOTHS.map((c) =>
    defineHanging({ id: `tarp-${c}`, shape: 'cloth', texture: `awning-${c}`, color: ['beige', 0.7], spacing: 0.5, folds: 0.03, breeze: 0.8, drag: 2.5 }),
  ),
];
