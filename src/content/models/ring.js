import { ModelBuilder } from './lib/build.js';

// `hitching-ring`: a big iron ring hung from a staple on a wall, to tie a
// dewback to (Mark's film stills: one by the cantina's door). Built looking
// south, the wall's face on y 0 and the origin on it at the ring's foot;
// hang it with town.fixture(). RING.r is its radius: it stands 2r + the
// staple tall.
//
// `ring-post`: the round plaster post at the end of the cantina's front
// that its ring hangs on (Mark's stills), domed on top, POST.r round and
// POST.h tall, the origin on the ground under its middle (it collides as
// its cylinder); stand it against the wall and hang the ring on its side.
export const RING = { r: 0.4, bar: 0.05 };
export const POST = { r: 0.5, h: 3 };

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

function post() {
  const m = new ModelBuilder('ring-post');
  const { r, h } = POST;
  const plaster = { tex: 'adobe-pale', flat: true }; // lit as the walls round it
  const round = (rr) => Array.from({ length: SEG }, (_, i) => [Math.cos((i / SEG) * Math.PI * 2) * rr, Math.sin((i / SEG) * Math.PI * 2) * rr]);
  // The shaft, then its dome in three rings, a little flat cap on top.
  const cap = r * 0.75;
  m.loft(round(r), 0, round(r), h - cap, { ...plaster, top: false, bottom: false });
  for (let k = 0; k < 3; k++) {
    const [a0, a1] = [(k / 3) * (Math.PI / 2), ((k + 1) / 3) * (Math.PI / 2)];
    const [r0, r1] = [a0, a1].map((a) => Math.max(r * Math.cos(a), 0.1));
    m.loft(round(r0), h - cap + Math.sin(a0) * cap, round(r1), h - cap + Math.sin(a1) * cap, { ...plaster, top: k === 2 ? plaster : false, bottom: false });
  }
  return m.build();
}

export default [ring(), post()];
