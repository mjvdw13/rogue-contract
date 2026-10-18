import { ModelBuilder } from './lib/build.js';

// Things found on Mos Eisley's streets (lib/town.js, clutter()): cargo
// crates, drums, pressure canisters, a cargo pod, a power unit, junk and
// litter with a droid's dome, rubble, scrap and a vaporator. Spacers' and
// traders' leftovers: no clay jars or grain sacks (Mark, 2026-10-18: it
// must feel Star Wars, not a desert village). Low-poly, most of them a few
// faces. Each is listed in CLUTTER with its decoration's size (solid ones
// block you and your shots). The origin is on the floor under the thing's
// middle, except for `scrap` and `power-unit`, built looking south (+y)
// with their backs on a wall at y = 0.

/** A ring of `n` points of radius `r` (x, y), turned by `turn` radians. */
const ring = (n, r, turn = 0) => Array.from({ length: n }, (_, i) => [Math.cos(turn + (i / n) * Math.PI * 2) * r, Math.sin(turn + (i / n) * Math.PI * 2) * r]);

/** A cargo crate `w` x `d` x `h` in a crate texture, its top a shade paler. */
function crate(id, tex, [w, d, h]) {
  const m = new ModelBuilder(id);
  // (One crate picture across its widest face: the texture is 2 tiles, so
  // scaled by half that width, and shifted so its edge is on the crate's.)
  m.box([-w / 2, -d / 2, 0], [w / 2, d / 2, h], { tex, texScale: Math.max(w, h) / 2, texOffset: [1, 0], bottom: false });
  m.outlineLines([[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]]);
  return m.build();
}

/** A drum: a cylinder in `tex` with two raised hoops and a lid. */
function barrel(id, tex) {
  const m = new ModelBuilder(id);
  const r = 0.32;
  const h = 1;
  m.cylinder([0, 0, 0], r, h, { segments: 10, tex, top: { color: ['gray', 0.35] }, bottom: false });
  for (const z of [0.3, 0.68]) m.cylinder([0, 0, z], r + 0.02, 0.05, { segments: 10, color: ['gray', 0.25], top: false, bottom: false });
  m.cylinder([0.12, 0.08, h], 0.05, 0.03, { segments: 6, color: ['gray', 0.15], bottom: false });
  return m.build();
}

/**
 * A pressure canister: a grey or rusty cylinder on a dark foot, its
 * shoulder narrowing to a valve with a handwheel, a painted band round its
 * middle. About 1 tall.
 */
function canister(id, tex, band) {
  const m = new ModelBuilder(id);
  const r = 0.2;
  m.cylinder([0, 0, 0], r + 0.02, 0.08, { segments: 8, color: ['gray', 0.18], bottom: false, top: false });
  m.cylinder([0, 0, 0.08], r, 0.72, { segments: 8, tex, top: false, bottom: false });
  m.cylinder([0, 0, 0.5], r + 0.01, 0.1, { segments: 8, color: band, top: false, bottom: false });
  m.loft(ring(8, r), 0.8, ring(8, 0.09), 0.92, { color: ['gray', 0.45], bottom: false, top: { color: ['gray', 0.3] } });
  m.cylinder([0, 0, 0.92], 0.04, 0.08, { segments: 6, color: ['gray', 0.2], bottom: false });
  m.cylinder([0, 0, 0.98], 0.1, 0.025, { segments: 6, color: ['rust', 0.45] });
  return m.build();
}

/**
 * A cargo pod: a long eight-sided canister lying on two skids, its ends
 * chamfered, hooped near each end, a status light glowing green on one.
 */
function pod() {
  const m = new ModelBuilder('cargo-pod');
  const r = 0.38;
  const z = 0.47;
  const L = 0.55;
  const oct = ring(8, r, Math.PI / 8).map(([a, b]) => [a, b + z]);
  m.prism(oct, -L, L, { axis: 'x', tex: 'metal-grey', top: false, bottom: false });
  for (const s of [-1, 1]) {
    const end = ring(8, r * 0.68, Math.PI / 8).map(([a, b]) => [a, b + z]);
    m.loft(oct, s * L, end, s * (L + 0.14), { axis: 'x', color: ['gray', 0.42], bottom: false, top: { color: ['gray', 0.3] } });
    m.prism(ring(8, r + 0.025, Math.PI / 8).map(([a, b]) => [a, b + z]), s * (L - 0.16), s * (L - 0.08), { axis: 'x', color: ['orange', 0.35], top: false, bottom: false });
  }
  m.box([L + 0.13, -0.05, z - 0.05], [L + 0.15, 0.05, z + 0.05], { color: [70, 230, 60], glow: true, bottom: false });
  for (const y of [-0.22, 0.22]) m.box([-0.6, y - 0.06, 0], [0.6, y + 0.06, 0.12], { color: ['gray', 0.2], bottom: false });
  m.outlineLines([[-0.7, -0.38], [0.7, -0.38], [0.7, 0.38], [-0.7, 0.38]]);
  return m.build();
}

/**
 * A power unit against a wall: a metal case with slats on its front, two
 * status lights, and a cable up out of its lid into the wall.
 */
function powerUnit() {
  const m = new ModelBuilder('power-unit');
  m.box([-0.6, 0.04, 0], [0.6, 0.6, 1], { tex: 'metal-grey', bottom: false, side: (i) => (i === 2 ? { tex: 'vent-slats', texOffset: [0.4, 0] } : undefined) });
  m.box([-0.65, 0, 1], [0.65, 0.65, 1.1], { color: ['gray', 0.3] });
  m.box([-0.45, 0.6, 0.8], [-0.37, 0.62, 0.88], { color: [70, 230, 60], glow: true, bottom: false });
  m.box([-0.3, 0.6, 0.8], [-0.22, 0.62, 0.88], { color: [255, 40, 30], glow: true, bottom: false });
  m.cylinder([0.4, 0.3, 1.1], 0.06, 0.5, { segments: 6, color: ['gray', 0.15], bottom: false });
  m.box([0.33, 0, 1.55], [0.47, 0.37, 1.67], { color: ['gray', 0.15] });
  m.outlineLines([[-0.65, 0], [0.65, 0], [0.65, 0.65], [-0.65, 0.65]]);
  return m.build();
}

/**
 * An astromech's dome off a scrapped droid: a silver dome lofted in rings,
 * blue panels round its middle and a red eye.
 */
function droidDome() {
  const m = new ModelBuilder('droid-dome');
  const tiers = [[0, 0.3], [0.13, 0.28], [0.22, 0.22], [0.29, 0.1]];
  for (let i = 0; i + 1 < tiers.length; i++) {
    const [z0, r0] = tiers[i];
    const [z1, r1] = tiers[i + 1];
    m.loft(ring(8, r0), z0, ring(8, r1), z1, {
      color: ['steel', 0.85],
      bottom: i === 0 ? { color: ['gray', 0.15] } : false,
      top: i === tiers.length - 2 ? undefined : false,
      side: (k) => (i === 1 && k % 2 === 0 ? { color: ['steel', 0.35] } : undefined),
    });
  }
  m.box([0.255, -0.05, 0.08], [0.29, 0.05, 0.15], { color: [255, 40, 30], glow: true, bottom: false });
  return m.build();
}

/** A heap of junk: a low lumpy mound in the junk texture, with a crate and a pipe sticking out. */
function heap() {
  const m = new ModelBuilder('junk-heap');
  const lumps = [1, 0.8, 1.1, 0.9, 1.05, 0.75, 1, 0.85, 0.95];
  const outline = lumps.map((k, i) => {
    const a = (i / lumps.length) * Math.PI * 2;
    return [Math.cos(a) * k * 1.1, Math.sin(a) * k * 0.8];
  });
  const tiers = [[0, 1], [0.25, 0.75], [0.45, 0.4]];
  for (let i = 0; i + 1 < tiers.length; i++) {
    const at = ([, s]) => outline.map(([x, y]) => [x * s + 0.1 * i, y * s]);
    m.loft(at(tiers[i]), tiers[i][0], at(tiers[i + 1]), tiers[i + 1][0], { tex: 'junk', bottom: false, top: i === tiers.length - 2 ? undefined : false });
  }
  // A small crate half buried, tipped; a pipe lying across.
  m.box([-0.75, -0.2, 0.05], [-0.3, 0.25, 0.5], { tex: 'crate-grey', texScale: 0.5, bottom: false });
  m.cylinder([-0.2, 0.35, 0.22], 0.06, 1.1, { axis: 'x', segments: 6, color: ['rust', 0.3] });
  return m.build();
}

/** Litter: the litter texture flat on the ground, `s` across (its gaps see-through). */
function litter(id, s) {
  const m = new ModelBuilder(id);
  m.face([[-s / 2, -s / 2, 0.02], [s / 2, -s / 2, 0.02], [s / 2, s / 2, 0.02], [-s / 2, s / 2, 0.02]], {
    tex: 'litter',
    uv: [[0, 0], [1, 0], [1, 1], [0, 1]],
  }, [0, 0, -1]);
  return m.build();
}

/** Rubble: chunks of fallen plaster and brick at a wall's foot, about 1.4 across. */
function rubble() {
  const m = new ModelBuilder('rubble');
  const chunks = [
    [0, 0, 0.3, 0.26, 'adobe-brick'],
    [0.45, 0.15, 0.22, 0.18, 'adobe'],
    [-0.4, 0.2, 0.2, 0.14, 'adobe'],
    [0.15, -0.35, 0.18, 0.15, 'adobe-brick'],
    [-0.2, -0.3, 0.14, 0.1, 'adobe'],
    [0.6, -0.2, 0.12, 0.09, 'adobe-brick'],
  ];
  chunks.forEach(([x, y, r, h, tex], k) => {
    const base = ring(5, r, k).map(([u, v]) => [x + u, y + v]);
    const top = ring(5, r * 0.6, k + 0.4).map(([u, v]) => [x + u + 0.03, y + v - 0.02]);
    m.loft(base, 0, top, h, { tex, bottom: false });
  });
  return m.build();
}

/** Scrap against a wall: two sheets of tin leaning on it and a length of pipe. */
function scrap() {
  const m = new ModelBuilder('scrap');
  m.face([[-0.9, 0.55, 0], [-0.1, 0.55, 0], [-0.1, 0.05, 1.5], [-0.9, 0.05, 1.5]], { tex: 'metal-rust', twoSided: true });
  m.face([[-0.3, 0.45, 0], [0.5, 0.65, 0], [0.55, 0.12, 1.25], [-0.25, 0.04, 1.2]], { tex: 'metal-grey', twoSided: true });
  m.cylinder([0.65, 0.35, 0], 0.07, 1.6, { segments: 6, color: ['rust', 0.25] });
  return m.build();
}

/**
 * A moisture vaporator: a tall column on a three-legged foot, in grey metal
 * banded with rings, fins round its middle and a cap, about twice your
 * height.
 */
function vaporator() {
  const m = new ModelBuilder('vaporator');
  const grey = { tex: 'metal-grey' };
  m.loft(ring(8, 0.5, Math.PI / 8), 0, ring(8, 0.32, Math.PI / 8), 0.5, { ...grey, bottom: false, top: false });
  m.cylinder([0, 0, 0.5], 0.3, 1.5, { segments: 8, turn: Math.PI / 8, ...grey, top: false, bottom: false });
  m.cylinder([0, 0, 2], 0.42, 0.25, { segments: 8, turn: Math.PI / 8, color: ['gray', 0.4] });
  m.cylinder([0, 0, 2.25], 0.22, 1.2, { segments: 8, turn: Math.PI / 8, ...grey, top: false, bottom: false });
  for (const z of [1, 1.6, 2.7]) m.cylinder([0, 0, z], z > 2 ? 0.26 : 0.34, 0.08, { segments: 8, turn: Math.PI / 8, color: ['gray', 0.2], bottom: false });
  // Fins: thin plates standing out round the upper column.
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
    const [c, s] = [Math.cos(a), Math.sin(a)];
    m.face([[c * 0.22, s * 0.22, 2.4], [c * 0.55, s * 0.55, 2.5], [c * 0.55, s * 0.55, 3.2], [c * 0.22, s * 0.22, 3.3]], { color: ['gray', 0.5], twoSided: true });
  }
  m.loft(ring(8, 0.26, Math.PI / 8), 3.45, ring(8, 0.08, Math.PI / 8), 3.7, { color: ['gray', 0.55], bottom: { color: ['gray', 0.3] } });
  return m.build();
}

/**
 * The clutter: model id, its decoration's `solid`, `radius` and `height`
 * (for collision and the level checker), and how deep it stands out from a
 * wall when the kit sets it against one (`depth`).
 */
export const CLUTTER = {
  'crate-tan': { model: () => crate('crate-tan', 'crate-tan', [0.9, 0.9, 0.9]), solid: true, radius: 0.55, height: 0.9, depth: 0.9 },
  'crate-grey-small': { model: () => crate('crate-grey-small', 'crate-grey', [0.6, 0.6, 0.6]), solid: true, radius: 0.4, height: 0.6, depth: 0.6 },
  'crate-rust-long': { model: () => crate('crate-rust-long', 'crate-rust', [1.4, 0.8, 0.7]), solid: true, radius: 0.75, height: 0.7, depth: 0.8 },
  'barrel-rust': { model: () => barrel('barrel-rust', 'metal-rust'), solid: true, radius: 0.34, height: 1, depth: 0.7 },
  'barrel-grey': { model: () => barrel('barrel-grey', 'metal-grey'), solid: true, radius: 0.34, height: 1, depth: 0.7 },
  canister: { model: () => canister('canister', 'metal-grey', ['yellow', 0.6]), solid: true, radius: 0.22, height: 1, depth: 0.45 },
  'canister-rust': { model: () => canister('canister-rust', 'metal-rust', ['gray', 0.6]), solid: true, radius: 0.22, height: 1, depth: 0.45 },
  'cargo-pod': { model: pod, solid: true, radius: 0.75, height: 0.85, depth: 0.8 },
  'power-unit': { model: powerUnit, solid: true, radius: 0.7, height: 1.67, depth: 0.65 },
  'droid-dome': { model: droidDome, radius: 0.3, height: 0.3, depth: 0.6 },
  'junk-heap': { model: heap, radius: 1.1, height: 0.5, depth: 1.6 },
  litter: { model: () => litter('litter', 1.6), radius: 0.8, height: 0, depth: 1.6 },
  'litter-small': { model: () => litter('litter-small', 1), radius: 0.5, height: 0, depth: 1 },
  rubble: { model: rubble, radius: 0.7, height: 0.26, depth: 0.9 },
  scrap: { model: scrap, radius: 0.9, height: 1.6, depth: 0.7 },
  vaporator: { model: vaporator, solid: true, radius: 0.45, height: 3.7, depth: 1.1 },
};

export default Object.values(CLUTTER).map((c) => c.model());
