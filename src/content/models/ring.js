import { ModelBuilder } from './lib/build.js';

// `hitching-ring`: a big iron ring hung from a staple on a wall, to tie a
// dewback to (Mark's film stills: one by the cantina's door). Built looking
// south, the wall's face on y 0 and the origin on it at the ring's foot;
// hang it with town.fixture(). RING.r is its radius: it stands 2r + the
// staple tall.
export const RING = { r: 0.4, bar: 0.05 };

const IRON = { tex: 'metal-rust' };
const SEG = 12;

function ring() {
  const m = new ModelBuilder('hitching-ring');
  const { r, bar } = RING;
  // The ring in the wall's plane, a hand's width out from it, segment by
  // segment round its centre (r up from its foot).
  const at = (rr, a) => [Math.cos(a) * rr, r + Math.sin(a) * rr];
  for (let k = 0; k < SEG; k++) {
    const [a0, a1] = [(k / SEG) * Math.PI * 2, ((k + 1) / SEG) * Math.PI * 2];
    m.prism([at(r - bar, a0), at(r + bar, a0), at(r + bar, a1), at(r - bar, a1)], 0.1, 0.2, { ...IRON, axis: 'y', side: (i) => (i === 1 || i === 3 ? IRON : false) });
  }
  // The staple: a plate on the wall and a lug out to the ring's top.
  m.box([-0.12, 0, 2 * r - 0.05], [0.12, 0.04, 2 * r + 0.2], { ...IRON, bottom: false });
  m.box([-0.04, 0.04, 2 * r - 0.02], [0.04, 0.16, 2 * r + 0.12], IRON);
  return m.build();
}

export default [ring()];
