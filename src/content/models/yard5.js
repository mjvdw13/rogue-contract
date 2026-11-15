import { ModelBuilder } from './lib/build.js';

// The big pieces of Mission 5's breaking yard (levels/m5.js; the great
// crane is models/crane.js): the crane way's trestles and girders, the
// skeleton of the ship on Berth 3, keel blocks, a smokestack, the hoist.
// Sizes are tiles (0.5 m); x east, y south.

const YELLOW = { tex: 'crane-yellow', texScale: 2 };
const RUST = { tex: 'metal-rust', texScale: 2 };
const STEEL = { tex: 'blast-steel', texScale: 2 };
const HAZARD = { tex: 'blast-hazard' };
const RED = { color: [255, 40, 30], glow: true };

/** A flat strip between two 3D points, `w` wide across x, y or z, seen from both sides. */
function strap(m, a, b, w, style, across) {
  const d = { x: [w / 2, 0, 0], y: [0, w / 2, 0], z: [0, 0, w / 2] }[across];
  const at = (p, s) => [p[0] + s * d[0], p[1] + s * d[1], p[2] + s * d[2]];
  m.face([at(a, -1), at(a, 1), at(b, 1), at(b, -1)], { ...style, twoSided: true });
}

/**
 * A beam from [u0, v0] to [u1, v1] in the plane across `axis`, `t` thick in
 * that plane, from `from` to `to` along the axis.
 */
function beam(m, [u0, v0], [u1, v1], t, from, to, style) {
  const l = Math.hypot(u1 - u0, v1 - v0);
  const [nu, nv] = [(-(v1 - v0) / l) * t * 0.5, ((u1 - u0) / l) * t * 0.5];
  m.prism([[u0 - nu, v0 - nv], [u1 - nu, v1 - nv], [u1 + nu, v1 + nv], [u0 + nu, v0 + nv]], from, to, style);
}

// ---------------------------------------------------------------- the crane way
// A crane rail on trestles along the quay. The deck is the level's slab
// (2 m wide, its top at `top`); a trestle is an A-frame bent under it,
// and a span is the pair of girders under the deck's edges with the
// crane's rails on top, as long as the run it carries.
export const CRANE_WAY = {
  /** The deck's top and its thickness (the level's slab). */
  top: 12,
  deck: 0.5,
  /** Half the deck's width. */
  half: 2,
  /** How far a trestle's feet stand out from the middle. */
  foot: 3.6,
  /** The spans, by id: how long each is. */
  spans: { 'crane-way-span-24': 24, 'crane-way-span-19': 19 },
};

function trestle() {
  const m = new ModelBuilder('crane-way-trestle');
  const { top, deck, half, foot } = CRANE_WAY;
  const under = top - deck;
  const cap = under - 1.2;
  for (const s of [-1, 1]) {
    // A leg leaning in from its foot to the cap, on a concrete footing.
    beam(m, [s * foot, 0.5], [s * (half - 0.3), cap], 0.7, -0.35, 0.35, { axis: 'x', ...YELLOW, top: false, bottom: false });
    m.box([-0.7, s * foot - 0.7, 0], [0.7, s * foot + 0.7, 0.5], { tex: 'quay', bottom: false });
    m.outlineLines([[-0.6, s * foot - 0.6], [0.6, s * foot - 0.6], [0.6, s * foot + 0.6], [-0.6, s * foot + 0.6]]);
  }
  // The cap under the girders, a tie half way up, and crossed braces.
  m.box([-0.4, -half - 0.4, cap], [0.4, half + 0.4, under - 1.2 + 0.7], YELLOW);
  const at = (z) => foot - ((z - 0.5) / (cap - 0.5)) * (foot - half + 0.3);
  const mid = cap * 0.5;
  m.box([-0.2, -at(mid), mid - 0.25], [0.2, at(mid), mid + 0.25], { ...YELLOW, side: (i) => (i === 0 || i === 2 ? false : undefined) });
  for (const [z0, z1] of [[0.8, mid - 0.25], [mid + 0.25, cap]]) {
    strap(m, [0, -at(z0), z0], [0, at(z1), z1], 0.3, RUST, 'z');
    strap(m, [0, at(z0), z0], [0, -at(z1), z1], 0.3, RUST, 'z');
  }
  return m.build();
}

function span(id) {
  const m = new ModelBuilder(id);
  const L = CRANE_WAY.spans[id];
  const { top, deck, half } = CRANE_WAY;
  const under = top - deck;
  for (const s of [-1, 1]) {
    // The girder under the deck's edge, and the crane's rail on the deck.
    const [y0, y1] = s < 0 ? [-half - 0.1, -half + 0.5] : [half - 0.5, half + 0.1];
    m.box([0, y0, under - 1.2 + 0.7], [L, y1, under + 0.02], { ...YELLOW, top: false });
    m.box([0, s * 1.3 - 0.1, top], [L, s * 1.3 + 0.1, top + 0.12], { ...STEEL, bottom: false });
  }
  // Ties between the girders, every 4 or so.
  const n = Math.round(L / 4);
  for (let i = 0; i <= n; i++) {
    const x = Math.min(L - 0.3, Math.max(0, (i * L) / n - 0.15));
    m.box([x, -half + 0.5, under - 0.45], [x + 0.3, half - 0.5, under - 0.05], { ...RUST, top: false, side: (k) => (k === 0 || k === 2 ? false : undefined) });
  }
  return m.build();
}

// ---------------------------------------------------------------- Berth 3's hull
// A starship cut down to its skeleton (Mark, 2026-11-14: curved ribs
// standing on a keel read as a boat's). Its frames are closed rings, as a
// fuselage's are: a flat belly, a chine, a straight side, a shoulder and a
// roof, with a deck beam across at the chine's top. `berth-rib` is a whole
// ring, `-cut` has its roof and south shoulder burnt off, `-stub` is the
// belly and one chine. Built across y, the origin on the spine's line (the
// level's tiles). Between two rings, 4 apart: `berth-stringers` (the
// longerons at the ring's corners; `-low` only the chines'), and
// `berth-plating` (the skin still on one side and shoulder, north; turn
// it for south). At the stern, `berth-engines`: the engine bulkhead and
// its thrusters, looking +x.
export const BERTH_RIB = {
  /** Half the hull's beam, and the ring's height. */
  half: 11,
  height: 10.5,
  /** Where the sides stand, from the spine: they collide. */
  post: 11,
  /** The ring's line from the spine out and round to the roof's middle, [y, z]. */
  line: [[0.9, 0.25], [7, 0.3], [11, 3.6], [11, 7.4], [7.5, 10.5], [0, 10.5]],
  /** By id: how many of the line's pieces the north and south sides keep. */
  kinds: { 'berth-rib': [5, 5], 'berth-rib-cut': [5, 3], 'berth-rib-stub': [2, 1] },
  /** The rings' spacing: a stringer's and a plate's length. */
  bay: 4,
};
const HULL_SKIN = { tex: 'freighter-hull', texScale: 4 };
const CUT = { tex: null, color: [150, 140, 120] };
const DARK = { tex: null, color: [18, 15, 12] };

function berthRib(id) {
  const m = new ModelBuilder(id);
  const { line, post, kinds } = BERTH_RIB;
  const full = line.length - 1;
  kinds[id].forEach((keep, k) => {
    const s = k ? 1 : -1;
    for (let i = 0; i < keep; i++) {
      const [a, b] = [line[i], line[i + 1]];
      const last = i === keep - 1;
      // The frame, thinner as it climbs; a cut end shows bright metal.
      const style = { axis: 'x', ...RUST, side: (e) => (e === 3 ? false : e === 1 ? (last && keep < full ? CUT : last ? undefined : false) : undefined) };
      beam(m, [s * a[0], a[1]], [s * b[0], b[1]], 0.5 - i * 0.04, -0.25, 0.25, style);
    }
    // The side stops you; the belly lies low enough to step over.
    if (keep > 2) m.outlineLines([[-0.3, s * post - 0.5], [0.3, s * post - 0.5], [0.3, s * post + 0.5], [-0.3, s * post + 0.5]]);
  });
  // The deck beam across at the chine's top, where both sides still stand
  // (overhead: you walk under it), and a stanchion either side of the spine.
  if (kinds[id][0] > 2 && kinds[id][1] > 2) {
    const z = line[2][1];
    m.box([-0.15, -line[2][0], z - 0.2], [0.15, line[2][0], z + 0.2], { ...STEEL, bottom: STEEL });
    for (const s of [-1, 1]) m.box([-0.12, s * 4 - 0.12, 0.3], [0.12, s * 4 + 0.12, z - 0.2], { ...STEEL, top: false, bottom: false });
  }
  return m.build();
}

function berthStringers(id, picks) {
  const m = new ModelBuilder(id);
  const { line, bay } = BERTH_RIB;
  for (const s of [-1, 1]) {
    for (const i of picks) {
      const [y, z] = line[i];
      m.box([0.25, s * y - 0.13, z - 0.13], [bay - 0.25, s * y + 0.13, z + 0.13], { ...STEEL, axis: 'z' });
    }
  }
  return m.build();
}

function berthPlating() {
  const m = new ModelBuilder('berth-plating');
  const { line, bay, post } = BERTH_RIB;
  // The side's skin and the shoulder's, a hair outside the frames, seen
  // from both sides; its torn edge is the cutters' last line.
  const out = 0.3;
  const [a, b, c] = [line[2], line[3], line[4]];
  m.face([[0, -a[0] - out, a[1] - 1], [bay, -a[0] - out, a[1] - 1], [bay, -b[0] - out, b[1]], [0, -b[0] - out, b[1]]], { ...HULL_SKIN, twoSided: true });
  m.face([[0, -b[0] - out, b[1]], [bay, -b[0] - out, b[1]], [bay * 0.6, -c[0] - 0.6, c[1] + 0.15], [0, -c[0] - 0.6, c[1] + 0.15]], { ...HULL_SKIN, twoSided: true });
  m.outlineLines([[0, -post - 0.5], [bay, -post - 0.5], [bay, -post + 0.2], [0, -post + 0.2]]);
  return m.build();
}

/** The engine block: the bulkhead's thickness, the thrusters' length, and where the big three sit, [y, z]. */
export const BERTH_ENGINES = { wall: 0.6, length: 5, radius: 3.1, at: [[-6.6, 6.4], [0, 6.4], [6.6, 6.4]], small: [[-3.3, 2], [3.3, 2]] };

function berthEngines() {
  const m = new ModelBuilder('berth-engines');
  const { line, half } = BERTH_RIB;
  const { wall, length, radius: R, at, small } = BERTH_ENGINES;
  // The bulkhead: the ring's outline filled, plated aft, the decks' cut
  // edges forward where the hull was burnt away from it.
  // (In two halves: a face of more than eight sides isn't filled whole.)
  for (const s of [-1, 1]) {
    const halfRing = [[0, line[1][1]], ...line.slice(1).map(([y, z]) => [s * y, z])];
    m.prism(halfRing, 0, wall, { axis: 'x', ...HULL_SKIN, bottom: { tex: 'hull-section', texScale: 4 }, side: (i) => (i === 5 ? false : undefined) });
  }
  const round = (r, n, dy, dz) => Array.from({ length: n }, (_, i) => [dy + Math.cos(((i + 0.5) / n) * Math.PI * 2) * r, dz + Math.sin(((i + 0.5) / n) * Math.PI * 2) * r]);
  const SKIN = { tex: 'freighter-engine', texScale: 2 };
  const BAND = { tex: 'band-steel', texScale: 1 };
  at.forEach(([y, z], k) => {
    // (The north one is gone: its mount's ring, bright where it was cut,
    // and the dark hole behind it.)
    if (k === 0) {
      m.prism(round(R * 0.8, 8, y, z), wall, wall + 0.5, { axis: 'x', ...BAND, top: DARK, bottom: false, sides: CUT });
      return;
    }
    // A drum out of the bulkhead, a band, then the bell flaring to its
    // rim; inside the rim it's dark, the injector's cone deep in it.
    m.prism(round(R * 0.8, 8, y, z), wall, wall + length * 0.45, { axis: 'x', ...SKIN, top: false, bottom: false });
    m.prism(round(R * 0.86, 8, y, z), wall + length * 0.4, wall + length * 0.5, { axis: 'x', ...BAND, bottom: false });
    m.loft(round(R * 0.7, 8, y, z), wall + length * 0.5, round(R, 8, y, z), wall + length, { axis: 'x', ...SKIN, top: false, bottom: false, twoSided: true });
    m.face(round(R * 0.7, 8, y, z).map(([u, v]) => [wall + length * 0.52, u, v]), DARK, [0, y, z]);
    m.loft(round(R * 0.32, 6, y, z), wall + length * 0.52, round(R * 0.12, 6, y, z), wall + length * 0.8, { axis: 'x', ...BAND, bottom: false });
  });
  for (const [y, z] of small) {
    m.prism(round(1.1, 8, y, z), wall, wall + length * 0.55, { axis: 'x', ...SKIN, top: DARK, bottom: false });
    m.prism(round(1.2, 8, y, z), wall + length * 0.45, wall + length * 0.55, { axis: 'x', ...BAND, top: false, bottom: false });
  }
  m.outlineLines([[0, -half], [wall + length * 0.6, -half], [wall + length * 0.6, half], [0, half]]);
  return m.build();
}

// `keel-block`: a berth cradle: a durasteel block a hull's weight sat on,
// a striped foot, its repulsor pad dead on top.
export const KEEL_BLOCK = { half: [1, 0.7], height: 1.2 };

function keelBlock() {
  const m = new ModelBuilder('keel-block');
  const { half: [hx, hy], height: H } = KEEL_BLOCK;
  const rect = (x, y) => [[-x, -y], [x, -y], [x, y], [-x, y]];
  m.box([-hx, -hy, 0], [hx, hy, 0.35], { ...HAZARD, top: STEEL, bottom: false });
  m.loft(rect(hx - 0.1, hy - 0.1), 0.35, rect(hx - 0.35, hy - 0.25), H - 0.1, { ...STEEL, texScale: 1, bottom: false, top: false });
  m.box([-hx + 0.3, -hy + 0.2, H - 0.1], [hx - 0.3, hy - 0.2, H], { ...RUST, texScale: 1, bottom: false, top: { tex: null, color: [30, 44, 52] } });
  m.outlineLines(rect(hx, hy));
  return m.build();
}

// ---------------------------------------------------------------- a smokestack
// A refinery stack: a tapering shaft on a plinth, banded, soot round its
// mouth, two service rings with running lights, a sensor spike on its rim. Its smoke is the decoration's.
export const STACK = { height: 34, radius: 2.4, mouth: 1.5 };

function smokestack() {
  const m = new ModelBuilder('smokestack');
  const { height: H, radius: R, mouth } = STACK;
  const ring = (r, n = 10) => Array.from({ length: n }, (_, i) => [Math.cos((i / n) * Math.PI * 2) * r, Math.sin((i / n) * Math.PI * 2) * r]);
  const shaft = { tex: 'sea-wall', texScale: 2 };
  m.box([-R - 0.6, -R - 0.6, 0], [R + 0.6, R + 0.6, 2.5], { tex: 'quay', bottom: false });
  const at = (z) => R - ((z - 2.5) / (H - 2.5)) * (R - mouth);
  const cuts = [2.5, H * 0.45, H * 0.45 + 1, H - 4, H];
  const styles = [shaft, { ...HAZARD, texScale: 2 }, shaft, { tex: 'slag', texScale: 2 }];
  for (let i = 0; i < 4; i++) m.loft(ring(at(cuts[i])), cuts[i], ring(at(cuts[i + 1])), cuts[i + 1], { ...styles[i], bottom: false, top: i === 3 ? { tex: null, color: [10, 9, 8] } : false });
  // Two service rings with running lights, and a sensor spike on the rim.
  for (const z of [H * 0.45 + 1.4, H - 5]) {
    m.loft(ring(at(z) + 0.9, 8), z, ring(at(z) + 0.9, 8), z + 0.35, { ...STEEL });
    for (const [x, y] of ring(at(z) + 0.95, 4)) m.box([x - 0.2, y - 0.2, z + 0.35], [x + 0.2, y + 0.2, z + 0.75], { ...RED, bottom: false });
  }
  const sq = (r) => [[mouth - r, -r], [mouth + r, -r], [mouth + r, r], [mouth - r, r]];
  m.loft(sq(0.15), H, sq(0.03), H + 4, { ...STEEL, bottom: false });
  m.box([mouth - 0.25, -0.25, H + 4], [mouth + 0.25, 0.25, H + 4.5], { ...RED, bottom: false });
  m.outlineLines([[-R - 0.6, -R - 0.6], [R + 0.6, -R - 0.6], [R + 0.6, R + 0.6], [-R - 0.6, R + 0.6]]);
  return m.build();
}

// ---------------------------------------------------------------- the hoist
// The frame of the lift beside the crane way: two posts on the lift's
// seaward side, a head over the platform with its sheave, striped feet.
// The platform is the level's lift. The origin is the middle of the
// platform, which is 4 by 2; the posts stand a hair south of it.
export const YARD_HOIST = { half: [2, 1], top: 14.5 };

function hoist() {
  const m = new ModelBuilder('yard-hoist');
  const { half: [hx, hy], top } = YARD_HOIST;
  const y = hy + 0.35;
  for (const s of [-1, 1]) {
    const x = s * (hx + 0.1);
    m.box([x - 0.25, y - 0.25, 0], [x + 0.25, y + 0.25, 1.5], { ...HAZARD, bottom: false, top: false });
    m.box([x - 0.25, y - 0.25, 1.5], [x + 0.25, y + 0.25, top], { ...YELLOW, bottom: false });
    m.outlineLines([[x - 0.25, y - 0.25], [x + 0.25, y - 0.25], [x + 0.25, y + 0.25], [x - 0.25, y + 0.25]]);
    // An arm from the post's head out over the platform, and its knee.
    m.box([x - 0.2, -0.3, top - 0.6], [x + 0.2, y - 0.25, top], YELLOW);
    strap(m, [x, y - 0.25, top - 2.2], [x, 0, top - 0.6], 0.3, RUST, 'x');
  }
  // The head beam and the sheave's housing; ties down the posts.
  m.box([-hx - 0.1, -0.3, top - 0.6], [hx + 0.1, 0.3, top], YELLOW);
  m.box([-0.6, -0.5, top - 1.3], [0.6, 0.5, top - 0.6], STEEL);
  for (let z = 4; z < top - 2; z += 3.5) m.box([-hx, y - 0.1, z], [hx, y + 0.1, z + 0.3], { ...RUST, side: (i) => (i === 1 || i === 3 ? false : undefined) });
  return m.build();
}

export default [trestle(), ...Object.keys(CRANE_WAY.spans).map(span), ...Object.keys(BERTH_RIB.kinds).map(berthRib),
  berthStringers('berth-stringers', [2, 3, 4]), berthStringers('berth-stringers-low', [2]), berthPlating(), berthEngines(), keelBlock(), smokestack(), hoist()];
