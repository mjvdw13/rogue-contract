import { ModelBuilder } from './lib/build.js';

// Small things for the old quarter (levels/m1.js).
//
// `candles`: the hermit's candles on the shelf of his shrine, a cluster of
// stubs of wax at different heights, each with its flame glowing, melted
// wax pooled round their feet. The origin on the shelf under the middle.
//
// `bedroll`: a squatter's bedding on the ground, a canvas roll laid out
// with its end rolled up for a pillow, built along x (BEDROLL.half each
// way), not solid.
//
// `fire-drum`: the squatters' fire, in a rusty drum with its lid cut off:
// a bed of glowing coals near its rim and a few tongues of flame over them
// (its embers and flames as particles are the decoration's `emit`).
// FIRE_DRUM.h is its rim.
export const BEDROLL = { half: 0.95, w: 0.38 };
export const FIRE_DRUM = { r: 0.32, h: 1 };

const WAX = { color: [196, 184, 150] };
const POOL = { color: [170, 156, 120] };
const FLAME = { color: [255, 196, 96], glow: true };

function candles() {
  const m = new ModelBuilder('candles');
  // [x, y, height, radius]
  const stubs = [[0, 0, 0.32, 0.045], [0.13, 0.06, 0.2, 0.04], [-0.1, 0.09, 0.24, 0.04], [0.06, -0.12, 0.15, 0.035], [-0.14, -0.07, 0.1, 0.04], [0.2, -0.05, 0.12, 0.03]];
  m.cylinder([0.02, 0, 0], 0.27, 0.015, { segments: 6, ...POOL, bottom: false });
  for (const [x, y, h, r] of stubs) {
    m.cylinder([x, y, 0.015], r, h, { segments: 5, ...WAX, bottom: false });
    // The flame: a small upright diamond over the wick.
    const z = 0.015 + h;
    m.face([[x - 0.022, y, z + 0.035], [x, y, z], [x + 0.022, y, z + 0.035], [x, y, z + 0.09]], { ...FLAME, twoSided: true });
    m.face([[x, y - 0.022, z + 0.035], [x, y, z], [x, y + 0.022, z + 0.035], [x, y, z + 0.09]], { ...FLAME, twoSided: true });
  }
  return m.build();
}

function bedroll() {
  const m = new ModelBuilder('bedroll');
  const { half: L, w: W } = BEDROLL;
  const canvas = { tex: 'awning-umber' };
  m.box([-L, -W, 0], [L - 0.35, W, 0.07], canvas);
  m.cylinder([L - 0.36, -W, 0.13], 0.13, 2 * W, { segments: 6, axis: 'y', tex: 'awning-sand' });
  return m.build();
}

function fireDrum() {
  const m = new ModelBuilder('fire-drum');
  const { r, h } = FIRE_DRUM;
  m.cylinder([0, 0, 0], r, h, { segments: 10, tex: 'drum-rust', twoSided: true, top: false, bottom: false });
  for (const z of [0.3, 0.68]) m.cylinder([0, 0, z], r + 0.02, 0.05, { segments: 10, color: ['gray', 0.25], top: false, bottom: false });
  m.cylinder([0, 0, h - 0.14], r - 0.01, 0.01, { segments: 10, color: [210, 84, 24], glow: true, bottom: false });
  // [angle round, out from the middle, height]
  for (const [a, d, t] of [[0.4, 0.1, 0.42], [2.5, 0.14, 0.3], [4.4, 0.08, 0.36], [5.6, 0.16, 0.24]]) {
    const [x, y] = [Math.cos(a) * d, Math.sin(a) * d];
    const z = h - 0.13;
    const w = 0.06;
    m.face([[x - w, y, z + t * 0.3], [x, y, z], [x + w, y, z + t * 0.3], [x, y, z + t]], { ...FLAME, twoSided: true });
    m.face([[x, y - w, z + t * 0.3], [x, y, z], [x, y + w, z + t * 0.3], [x, y, z + t]], { ...FLAME, twoSided: true });
  }
  return m.build();
}

export default [candles(), bedroll(), fireDrum()];
