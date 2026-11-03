import { ModelBuilder } from './lib/build.js';

// The dewback stable off the north back lane (levels/m1.js).
//
// `stall-rails`: the plank rails between two stalls, three boards nailed to
// posts, run out from the back wall along +y, STALL.len long, the origin on
// the floor under their middle (so they take the stall's light, not the
// wall's). Low enough to see the dewbacks over, and through. It collides as
// a thin outline.
//
// `stable-post`: a square timber post under the beam along the stable's
// open front, STABLE_POST.h tall to the beam's underside, a brace up to it
// each side along x. It collides as its cylinder.
//
// `feed-trough`: a drum cut in half along its length and laid on two iron
// trestles, full of feed. Built along x (FEED.half each side), the origin
// on the floor under its middle; it collides as its outline.
//
// `saddle-rack`: two dewback saddles (the Imperial patrol's spares) on two
// timber bars out from a wall, each with a brace under it. Built looking
// south, its back on y 0, so hang it with town.fixture(); the saddles'
// flaps hang either side of each bar, along x.
export const STALL = { len: 6, top: 1.35 };
export const STABLE_POST = { h: 4.25, w: 0.12 };
export const FEED = { half: 0.6, r: 0.32, top: 0.78 };

const WOOD = { tex: 'planks' };
const IRON = { tex: 'pipe-rust', texScale: 0.25 };
const DRUM = { tex: 'drum-rust', twoSided: true };
const LEATHER = { tex: 'awning-umber', twoSided: true };
const BLANKET = { tex: 'awning-sand', twoSided: true };

function stallRails() {
  const m = new ModelBuilder('stall-rails');
  const { top } = STALL;
  const half = STALL.len / 2;
  const p = 0.06;
  for (const y of [-half + p, 0, half - p]) m.box([-p, y - p, 0], [p, y + p, top], WOOD);
  // The boards on the posts' east faces, the top one a hand under their tops.
  for (const z of [0.3, 0.72, 1.12]) m.box([p, -half + 0.02, z], [p + 0.04, half - 0.02, z + 0.18], WOOD);
  m.outlineLines([[-p, -half], [p + 0.04, -half], [p + 0.04, half], [-p, half]]);
  return m.build();
}

function stablePost() {
  const m = new ModelBuilder('stable-post');
  const { h, w } = STABLE_POST;
  m.box([-w, -w, 0], [w, w, h], { ...WOOD, top: false });
  // A brace from the post up to the beam either side, along it.
  const sq = (cx) => [[cx - 0.05, -0.05], [cx + 0.05, -0.05], [cx + 0.05, 0.05], [cx - 0.05, 0.05]];
  for (const s of [-1, 1]) m.loft(sq(s * w), h - 0.9, sq(s * 0.85), h, { ...WOOD, top: false, bottom: false });
  return m.build();
}

function feedTrough() {
  const m = new ModelBuilder('feed-trough');
  const { half: L, r, top } = FEED;
  const zc = top;
  const N = 6;
  // The half drum: its rim at `top`, its belly r under it, open on top.
  const at = (k) => {
    const a = Math.PI + (k / N) * Math.PI;
    return [Math.cos(a) * r, zc + Math.sin(a) * r];
  };
  for (let k = 0; k < N; k++) {
    const [[y0, z0], [y1, z1]] = [at(k), at(k + 1)];
    m.face([[-L, y0, z0], [L, y0, z0], [L, y1, z1], [-L, y1, z1]], DRUM);
  }
  // Its ends, half discs.
  for (const x of [-L, L]) m.face(Array.from({ length: N + 1 }, (_, k) => [x, ...at(k)]), DRUM);
  // The feed, a dark mash a little under the rim.
  m.face([[-L + 0.01, -r * 0.92, zc - 0.08], [L - 0.01, -r * 0.92, zc - 0.08], [L - 0.01, r * 0.92, zc - 0.08], [-L + 0.01, r * 0.92, zc - 0.08]], { tex: 'adobe-skirt' }, [0, 0, 0]);
  // The trestles: a bar under the belly and two splayed legs, at each end.
  for (const x of [-L + 0.15, L - 0.15]) {
    m.box([x - 0.04, -r * 0.8, zc - r - 0.06], [x + 0.04, r * 0.8, zc - r], IRON);
    for (const s of [-1, 1]) {
      const sq = (cy, k) => [[x - k, cy - k], [x + k, cy - k], [x + k, cy + k], [x - k, cy + k]];
      m.loft(sq(s * r * 0.95, 0.03), 0, sq(s * r * 0.6, 0.03), zc - r - 0.06, { ...IRON, top: false, bottom: false });
    }
  }
  m.outlineLines([[-L, -r], [L, -r], [L, r], [-L, r]]);
  return m.build();
}

function saddleRack() {
  const m = new ModelBuilder('saddle-rack');
  // (Dewback-sized: a saddle as long as a third of the beast's back.)
  const bar = 1.3;
  for (const x of [-0.8, 0.8]) {
    // The bar out from the wall and its brace.
    m.box([x - 0.06, 0, bar - 0.12], [x + 0.06, 1.2, bar], WOOD);
    const sq = (y) => [[x - 0.05, y], [x + 0.05, y], [x + 0.05, y + 0.1], [x - 0.05, y + 0.1]];
    m.loft(sq(0), bar - 0.8, sq(0.7), bar - 0.12, { ...WOOD, top: false, bottom: false });
    // The saddle on it: a seat with a rise at the back (by the wall) and
    // a pommel at the front, its pale blanket hanging down either side, a
    // stirrup under each.
    const [y0, y1] = [0.15, 1.05];
    m.box([x - 0.32, y0, bar], [x + 0.32, y1, bar + 0.14], LEATHER);
    m.box([x - 0.28, y0, bar + 0.14], [x + 0.28, y0 + 0.15, bar + 0.42], LEATHER);
    m.box([x - 0.1, y1 - 0.15, bar + 0.14], [x + 0.1, y1, bar + 0.32], LEATHER);
    for (const s of [-1, 1]) {
      const xo = x + s * 0.32;
      const xl = x + s * 0.4;
      m.face([[xo, y0 + 0.07, bar], [xo, y1 - 0.07, bar], [xl, y1 - 0.15, bar - 0.75], [xl, y0 + 0.15, bar - 0.75]], BLANKET);
      m.box([xl - 0.02, 0.55, bar - 0.98], [xl + 0.02, 0.65, bar - 0.7], IRON);
      m.box([xl - 0.08, 0.5, bar - 1.04], [xl + 0.08, 0.7, bar - 0.98], IRON);
    }
  }
  return m.build();
}

export default [stallRails(), stablePost(), feedTrough(), saddleRack()];
