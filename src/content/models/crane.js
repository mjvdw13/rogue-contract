import { ModelBuilder } from './lib/build.js';
import { rod } from './junk-pile.js';

// `crane`: the Jawas' rusty crane standing in the junk yard's east heap
// (levels/m1.js), its jib out over the furnace's hopper. A lattice mast of
// four corner posts braced across each face, a cab on its side near the top,
// and on top the jib, a girder reaching out with a short tail behind it
// and a counterweight on the tail, stayed from a peak over the mast. A
// cable hangs from the jib's tip to a block and a hook. The origin on the
// ground under the mast; at angle 0 the jib reaches east. Nothing collides:
// the mast stands in the heap and the rest is overhead.
export const CRANE = {
  /** The mast's top (the jib's underside), its peak, and how far the jib reaches. */
  top: 10,
  peak: 12,
  reach: 6.4,
  /** The hook's bottom. */
  hook: 4.6,
};

const RUST = { tex: 'metal-rust' };
const DARK = { tex: 'metal-grey', texScale: 0.5 };
const HOLE = { color: [20, 16, 12] };

function crane() {
  const m = new ModelBuilder('crane');
  const { top: T, peak: P, reach: R, hook: H } = CRANE;
  const w = 0.5;
  // The mast: corner posts, and every 2 a rung and a brace across each face.
  const corners = [[-w, -w], [w, -w], [w, w], [-w, w]];
  for (const [x, y] of corners) rod(m, [x, y, 0], [x, y, T], 0.08, 4, RUST);
  for (let z = 2; z <= T; z += 2) {
    for (let i = 0; i < 4; i++) {
      const [a, b] = [corners[i], corners[(i + 1) % 4]];
      rod(m, [...a, z], [...b, z], 0.05, 3, RUST);
      const flip = (z / 2 + i) % 2;
      rod(m, [...(flip ? a : b), z - 2], [...(flip ? b : a), z], 0.04, 3, RUST);
    }
  }
  // The cab, on the jib's side of the mast below its top, a dark window
  // to the jib.
  m.box([w, -0.6, T - 2.2], [w + 1.1, 0.6, T - 0.6], { ...RUST, top: DARK });
  m.face([[w + 1.13, -0.4, T - 1.6], [w + 1.13, 0.4, T - 1.6], [w + 1.13, 0.4, T - 0.9], [w + 1.13, -0.4, T - 0.9]], HOLE, [0, 0, T - 1.2]);
  // The jib and its tail, a girder; the counterweight on the tail; the
  // peak and its stays to the tip and the tail's end.
  const tail = -2.6;
  m.box([tail, -0.2, T], [R + 0.2, 0.2, T + 0.4], { ...RUST, top: DARK, bottom: DARK });
  m.box([tail, -0.45, T - 0.9], [tail + 1.1, 0.45, T + 0.6], DARK);
  rod(m, [0, 0, T + 0.4], [0, 0, P], 0.12, 4, RUST);
  rod(m, [0, 0, P], [R, 0, T + 0.4], 0.04, 3, DARK);
  rod(m, [0, 0, P], [tail + 0.5, 0, T + 0.6], 0.04, 3, DARK);
  // The cable from the tip to the block, and the hook under it.
  rod(m, [R, 0, T], [R, 0, H + 1], 0.03, 3, DARK);
  m.box([R - 0.18, -0.12, H + 0.6], [R + 0.18, 0.12, H + 1], DARK);
  rod(m, [R, 0, H + 0.6], [R, 0, H + 0.15], 0.05, 4, DARK);
  rod(m, [R - 0.05, 0, H], [R + 0.3, 0, H], 0.05, 4, DARK);
  rod(m, [R + 0.3, 0, H], [R + 0.3, 0, H + 0.3], 0.05, 4, DARK);
  return m.build();
}

export default [crane()];
