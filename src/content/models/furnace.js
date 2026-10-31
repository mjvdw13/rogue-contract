import { ModelBuilder } from './lib/build.js';

// `furnace`: the Jawas' scrap furnace in the junk yard's court (levels/m1.js),
// against the foot of the east heap. A squat kiln of rusty plate on a grey
// plinth, narrowing a little to its top, a band round its middle. Its mouth
// is in the south side, glowing, behind a grate of bars, a hood over it and
// a sill under it for the slag. A hopper on its top at the back (the junk
// goes in there) and a stack up from it. The origin on the floor under its
// middle; at angle 0 the mouth faces south. 4.2 by 2.4, the body 2.3 tall,
// the stack's top at 6.
export const FURNACE = {
  /** Half the plinth's length and depth: it collides as that. */
  half: [2.1, 1.2],
  /** The body's top. */
  top: 2.3,
};

const RUST = { tex: 'metal-rust' };
const DARK = { tex: 'metal-grey', texScale: 0.5 };
const HOLE = { color: [20, 16, 12] };
const GLOW = { color: [255, 150, 50], glow: true };

function furnace() {
  const m = new ModelBuilder('furnace');
  const [hx, hy] = FURNACE.half;
  const plinth = 0.3;
  // The body tapers from (bx, by) at the plinth to (tx, ty) at the top.
  const [bx, by, tx, ty] = [1.9, 1, 1.6, 0.8];
  const rect = (x, y) => [[-x, -y], [x, -y], [x, y], [-x, y]];
  /** The body's half-size at height z. */
  const at = (z) => {
    const k = (z - plinth) / (FURNACE.top - plinth);
    return [bx + (tx - bx) * k, by + (ty - by) * k];
  };
  m.box([-hx, -hy, 0], [hx, hy, plinth], DARK);
  m.loft(rect(bx, by), plinth, rect(tx, ty), FURNACE.top, { ...RUST, axis: 'z', top: DARK });
  // A band of grey plate round its middle, standing a little proud.
  const [b0, b1] = [1.3, 1.45];
  const band = (z) => at(z).map((v) => v + 0.05);
  m.loft(rect(...band(b0)), b0, rect(...band(b1)), b1, { ...DARK, top: false, bottom: false });
  // The mouth, on the south face's slope, a hair proud of it: the glow, a
  // grate of bars in front, the hood over it and the sill under it.
  const [m0, m1, mw] = [0.55, 1.2, 0.7];
  const y = (z) => at(z)[1];
  m.face([[-mw, y(m0) + 0.02, m0], [mw, y(m0) + 0.02, m0], [mw, y(m1) + 0.02, m1], [-mw, y(m1) + 0.02, m1]], GLOW, [0, 0, m0]);
  for (let k = 0; k < 5; k++) {
    const x = -mw + 0.12 + (k * (2 * mw - 0.24)) / 4;
    m.box([x - 0.04, y(m0) + 0.04, m0], [x + 0.04, y(m0) + 0.12, m1], { color: [34, 28, 24] });
  }
  for (const [z0, z1] of [[m0 - 0.08, m0], [m1, m1 + 0.08]]) m.box([-mw - 0.08, y(m1) + 0.02, z0], [mw + 0.08, y(m0) + 0.12, z1], DARK);
  m.box([-mw - 0.25, y(1.6), 1.6], [mw + 0.25, y(1.6) + 0.45, 1.78], DARK);
  m.box([-mw - 0.1, y(0.4), 0.3], [mw + 0.1, y(0.4) + 0.4, 0.42], DARK);
  // Soot up the front from under the hood to the top.
  const [s0, s1, sw] = [1.78, FURNACE.top, 1.1];
  m.face([[-sw, y(s0) + 0.02, s0], [sw, y(s0) + 0.02, s0], [sw, y(s1) + 0.02, s1], [-sw, y(s1) + 0.02, s1]], { tex: 'grime-scorch-1', uv: [[0, 1], [1, 1], [1, 0], [0, 0]] });
  // The hopper at the back, wider at its mouth, dark inside.
  const T = FURNACE.top;
  m.loft([[-1.3, -0.7], [-0.3, -0.7], [-0.3, 0.2], [-1.3, 0.2]], T, [[-1.6, -1], [0, -1], [0, 0.5], [-1.6, 0.5]], T + 0.8, { ...RUST, top: HOLE, bottom: false });
  // The stack, a collar where it leaves the top and a cap.
  const S = [0.95, -0.2];
  m.cylinder([...S, T], 0.4, 0.3, { ...DARK, bottom: false });
  m.cylinder([...S, T + 0.3], 0.3, 3.4, { ...RUST, top: false, bottom: false });
  m.cylinder([...S, T + 3.3], 0.38, 0.4, { ...DARK, top: HOLE, bottom: DARK });
  m.outlineLines(rect(hx, hy));
  return m.build();
}

export default [furnace()];
