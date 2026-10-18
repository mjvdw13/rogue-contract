import { ModelBuilder } from './lib/build.js';

// An X-34 landspeeder, parked and hovering over the street: a long hull
// with a round nose and an open cockpit for two behind a curved windscreen,
// intakes along its flanks, and three engines at the back, two on pylons
// at its sides and one high on a raked fin. Proportions from Mark's
// schematic (2026-10-18), at about 1.25 times life size against you (the
// town's doors are big too); the paint worn like the film's prop: peach
// with rose stripes, rust and bare grey-green where it's chipped. The nose
// points +x; it's 4.2 long and 2.5 wide over the engines, its hull floating
// 0.38 off the ground.
const m = new ModelBuilder('landspeeder');

const PAINT = { tex: 'speeder-paint' };
const RED = { tex: 'speeder-red' };
const METAL = { tex: 'speeder-metal' };
const DARK = { color: ['gray', 0.16] };
const SEAT = { color: ['gray', 0.22] };

// The hull's cross-section: a flat bottom, flanks bulging out widest a
// little under halfway up, a flat deck. W is its half-width, ZB its bottom
// and H its height; the deck is at ZB + H.
const W = 0.68;
const ZB = 0.38;
const H = 0.5;
const ZT = ZB + H;
/** The intakes run along the flanks between these heights, one speeder-grille high. */
const BAND = [ZB + 0.15 * H, ZB + 0.75 * H];
const GRILLE = { tex: 'speeder-grille', texScale: BAND[1] - BAND[0], texOffset: [0, BAND[1] / (BAND[1] - BAND[0])] };

/**
 * The section, `kw` and `kh` of the full width and height (round its
 * middle, for the nose). Its edges, from the bottom round to the deck and
 * back: 0 the bottom, 1 and 9 the lower flanks, 2, 3, 7 and 8 the band the
 * intakes are in, 4 and 6 the shoulders under the deck's edge, 5 the deck.
 */
function section(kw = 1, kh = 1) {
  const w = W * kw;
  const mid = ZB + 0.45 * H;
  const z = (f) => mid + (ZB + f * H - mid) * kh;
  const right = [[0.55 * w, z(0)], [0.88 * w, z(0.15)], [w, z(0.42)], [0.96 * w, z(0.75)], [0.8 * w, z(1)]];
  return [[-0.55 * w, z(0)], ...right, ...right.reverse().map(([y, zz]) => [-y, zz])].slice(0, 10);
}
/** Styles for the section's edges: the bottom and lower flanks rose, the band `band`, rose shoulders, the deck peach. */
const hull = (band) => (i) => (i <= 1 || i === 9 ? RED : i === 4 || i === 6 ? RED : i === 5 ? PAINT : band);

/** One length of hull, from x0 (forward) back to x1, between two sections. */
function hullPart(x0, a, x1, b, band, ends = {}) {
  m.loft(a, x0, b, x1, { axis: 'x', side: hull(band), bottom: ends.front ?? false, top: ends.back ?? false });
}

// The nose: round in plan (a half circle of radius W), blunter in profile.
const NOSE = 1.4;
const nose = [[0, 1], [25, 0.99], [45, 0.95], [62, 0.86], [76, 0.72], [86, 0.5]].map(([deg, kh]) => {
  const a = (deg * Math.PI) / 180;
  return { x: NOSE + W * Math.sin(a), s: section(Math.cos(a), kh) };
});
// (The intakes wrap round it, but for a strip of paint down the middle.)
hullPart(nose[5].x, nose[5].s, nose[4].x, nose[4].s, PAINT, { front: PAINT });
for (let k = 4; k > 0; k--) hullPart(nose[k].x, nose[k].s, nose[k - 1].x, nose[k - 1].s, k === 4 ? PAINT : GRILLE);

// The front deck, to the cockpit; its back end is the dashboard.
const COCKPIT = [0.69, -0.82];
hullPart(NOSE, section(), COCKPIT[0], section(), GRILLE, { back: DARK });

// The cockpit: the hull below its floor, and a rim down each side (the
// deck's edge, its shoulder and the top of its flank) with the opening
// between them. The intakes end under the seats.
const ZF = ZB + 0.5 * H;
const core = [[-0.55 * W, ZB], [0.55 * W, ZB], [0.88 * W, ZB + 0.15 * H], [W, ZB + 0.42 * H], [0.99 * W, ZF], [-0.99 * W, ZF], [-W, ZB + 0.42 * H], [-0.88 * W, ZB + 0.15 * H]];
const coreStyle = (band) => (i) => (i <= 1 || i === 7 ? RED : i === 4 ? DARK : band);
const rim = (s) => [[0.7 * W, ZT], [0.8 * W, ZT], [0.96 * W, ZB + 0.75 * H], [0.99 * W, ZF], [0.7 * W, ZF]].map(([y, z]) => [s * y, z]);
const rimStyle = (band) => (i) => [PAINT, RED, band, false, DARK][i];
const SEATS = -0.2;
for (const [x0, x1, band] of [[COCKPIT[0], SEATS, GRILLE], [SEATS, COCKPIT[1], PAINT]]) {
  m.prism(core, x0, x1, { axis: 'x', side: coreStyle(band), top: false, bottom: false });
  for (const s of [-1, 1]) m.prism(rim(s), x0, x1, { axis: 'x', side: rimStyle(band), top: false, bottom: false });
}

// The rear deck, behind the seats (its front the bulkhead), and a plate
// across the back.
hullPart(COCKPIT[1], section(), -1.17, section(), PAINT, { front: DARK, back: METAL });
m.box([-1.24, -0.42, ZB + 0.08], [-1.17, 0.42, ZT - 0.1], { ...METAL, bottom: false });

// A rose stripe down the middle of the front deck, as on the film's.
m.face([[1.78, -0.025, ZT + 0.004], [1.78, 0.025, ZT + 0.004], [COCKPIT[0], 0.025, ZT + 0.004], [COCKPIT[0], -0.025, ZT + 0.004]], RED, [1, 0, 0]);

// In the cockpit: the dashboard's console with its lights, the driver's
// yoke on the left (north, at angle 0), and two seats.
m.box([0.46, -0.42, ZF], [COCKPIT[0], 0.42, ZT - 0.05], { color: ['gray', 0.28], bottom: false });
for (const [y, c] of [[-0.3, [70, 230, 60]], [-0.22, [255, 40, 30]], [0.1, [255, 176, 0]], [0.18, [70, 230, 60]]]) {
  m.box([0.55, y - 0.025, ZT - 0.05], [0.6, y + 0.025, ZT - 0.035], { color: c, glow: true, bottom: false });
}
m.box([0.3, -0.24, ZT - 0.12], [0.46, -0.2, ZT - 0.08], DARK);
m.box([0.27, -0.36, ZT - 0.13], [0.31, -0.08, ZT - 0.06], DARK);
for (const y of [-0.22, 0.22]) {
  m.box([-0.6, y - 0.18, ZF], [-0.3, y + 0.18, ZF + 0.14], { ...SEAT, top: { color: ['gray', 0.3] }, bottom: false });
  // The back, leaning back, its top showing over the deck.
  m.loft([[-0.58, y - 0.18], [-0.72, y - 0.18], [-0.72, y + 0.18], [-0.58, y + 0.18]], ZF, [[-0.68, y - 0.16], [-0.8, y - 0.16], [-0.8, y + 0.16], [-0.68, y + 0.16]], ZT + 0.2, { ...SEAT, top: { color: ['gray', 0.3] }, bottom: false });
}

// The windscreen: curved glass from the dashboard's top up and back over
// the front of the cockpit, its sides running back along the rims. Seen
// through from both sides (speeder-glass is clear but for glints and dust).
const GLASS = { tex: 'speeder-glass', twoSided: true };
const G = 0.7 * W;
const ZG = ZT + 0.34;
const base = [-G, -0.18, 0.18, G];
const top = [-0.4, -0.15, 0.15, 0.4];
const topX = [-0.02, 0.06, 0.06, -0.02];
for (let i = 0; i < 3; i++) {
  m.face([[COCKPIT[0], base[i], ZT], [COCKPIT[0], base[i + 1], ZT], [topX[i + 1], top[i + 1], ZG], [topX[i], top[i], ZG]], GLASS);
}
for (const s of [-1, 1]) {
  m.face([[COCKPIT[0], s * G, ZT], [SEATS - 0.05, s * G, ZT], [SEATS - 0.05, s * 0.44, ZT + 0.2], [-0.02, s * 0.4, ZG]], GLASS);
}

/**
 * An engine `len` long, its intake at x (facing forward) and its centre at
 * (y, z): a rose cowl round the intake, the grey body with a rose band, and
 * a tapered exhaust.
 */
function engine(x, y, z, len = 0.99) {
  const r = 0.18;
  const R = r + 0.02;
  const ring = (k) => Array.from({ length: 8 }, (_, i) => {
    const a = Math.PI / 8 + (i / 8) * Math.PI * 2;
    return [y + Math.cos(a) * r * k, z + Math.sin(a) * r * k];
  });
  // (The intake: IWENGBAC's round fan, one across the cowl's face.)
  const s = 2 * R;
  const intake = { tex: 'speeder-intake', texScale: s, texOffset: [-(y - R) / s, (z + R) / s] };
  m.cylinder([x - 0.3, y, z], R, 0.3, { segments: 8, axis: 'x', turn: Math.PI / 8, ...RED, top: intake, bottom: false });
  m.cylinder([x - len + 0.14, y, z], r, len - 0.44, { segments: 8, axis: 'x', turn: Math.PI / 8, ...METAL, top: false, bottom: false });
  m.cylinder([x - 0.68, y, z], r + 0.008, 0.08, { segments: 8, axis: 'x', turn: Math.PI / 8, ...RED, top: false, bottom: false });
  m.loft(ring(1), x - len + 0.14, ring(0.66), x - len, { axis: 'x', ...METAL, bottom: false, top: DARK });
}
for (const s of [-1, 1]) {
  engine(-0.2, s * 1.07, 0.72);
  // Its pylon: swept back from the hull's flank to the engine, rose along its leading edge.
  m.loft([[-0.23, 0.62], [-1.15, 0.62], [-1.15, 0.84], [-0.23, 0.84]], s * 0.6, [[-0.55, 0.66], [-1.05, 0.66], [-1.05, 0.79], [-0.55, 0.79]], s * 0.93, {
    axis: 'y', side: (i) => [PAINT, METAL, PAINT, RED][i], top: false, bottom: false,
  });
}
engine(-1.1, 0, 1.24);
// The centre engine's fin, raked back from the rear deck.
m.loft([[-0.84, -0.07], [-1.24, -0.07], [-1.24, 0.07], [-0.84, 0.07]], ZT - 0.02, [[-1.22, -0.05], [-1.68, -0.05], [-1.68, 0.05], [-1.22, 0.05]], 1.1, {
  side: (i) => [PAINT, METAL, PAINT, RED][i], top: false, bottom: false,
});

// Its shadow on the street, just above the ground: speeder-shadow is
// grime, so it darkens the street under it a little rather than covering
// it, and stays down while the speeder bobs.
m.face([[2.05, -0.95, 0.01], [2.05, 0.95, 0.01], [-1.35, 0.95, 0.01], [-1.35, -0.95, 0.01]], { tex: 'speeder-shadow', uv: [[0, 0], [1, 0], [1, 1], [0, 1]] }, [0, 0, -1]);

// Collision: round the hull and the side engines (the centre one is overhead).
m.outlineLines([[2.08, -0.35], [2.08, 0.35], [1.6, 0.68], [-0.2, 1.27], [-1.2, 1.27], [-1.3, 0.4], [-1.3, -0.4], [-1.2, -1.27], [-0.2, -1.27], [1.6, -0.68]]);

export default m.build();
