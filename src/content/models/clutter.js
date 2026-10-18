import { ModelBuilder } from './lib/build.js';

// Things found on Mos Eisley's streets (lib/town.js, clutter()): crates,
// barrels, clay jars, sacks, junk and litter, rubble, scrap, a vaporator
// and a bench. Low-poly, most of them a few faces. Each is listed in
// CLUTTER with its decoration's size (solid ones block you and your shots).
// The origin is on the floor under the thing's middle, except for `scrap`
// and `bench`, built looking south (+y) with their backs on a wall at y = 0.

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
 * A clay jar: a body swelling from its foot and narrowing to a neck and a
 * lip, lofted in rings of 8, `h` tall; terracotta or pale clay.
 */
function jar(id, h, ramp, tone) {
  const m = new ModelBuilder(id);
  // [height, radius] going up, as shares of h.
  const profile = [[0, 0.22], [0.12, 0.34], [0.42, 0.42], [0.72, 0.32], [0.86, 0.17], [0.92, 0.16], [1, 0.21]];
  for (let i = 0; i + 1 < profile.length; i++) {
    const [z0, r0] = profile[i];
    const [z1, r1] = profile[i + 1];
    m.loft(ring(8, r0 * h), z0 * h, ring(8, r1 * h), z1 * h, {
      color: [ramp, tone - (i === profile.length - 2 ? 0.12 : 0)],
      bottom: false,
      top: i === profile.length - 2 ? { color: [ramp, 0.08] } : false,
    });
  }
  return m.build();
}

/** A sack of grain or sand: a lumpy pillow, lofted from a squashed ring. */
function sack(id, [w, d, h], ramp, tone) {
  const m = new ModelBuilder(id);
  const base = ring(8, 1).map(([x, y]) => [x * w * 0.48, y * d * 0.48]);
  const mid = ring(8, 1).map(([x, y]) => [x * w * 0.52, y * d * 0.5]);
  const top = ring(8, 1).map(([x, y]) => [x * w * 0.36, y * d * 0.3]);
  m.loft(base, 0, mid, h * 0.45, { color: [ramp, tone - 0.06], bottom: false, top: false });
  m.loft(mid, h * 0.45, top, h, { color: [ramp, tone], bottom: false, top: { color: [ramp, tone + 0.05] } });
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

/** A bench against a wall: planks on two blocks of stone. */
function bench() {
  const m = new ModelBuilder('bench');
  for (const x of [-0.65, 0.45]) m.box([x, 0.05, 0], [x + 0.2, 0.5, 0.38], { tex: 'flagstone', bottom: false });
  m.box([-0.8, 0.02, 0.38], [0.8, 0.55, 0.46], { tex: 'planks', bottom: { tex: 'planks' } });
  m.outlineLines([[-0.8, 0], [0.8, 0], [0.8, 0.55], [-0.8, 0.55]]);
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
  jar: { model: () => jar('jar', 0.85, 'rust', 0.45), solid: true, radius: 0.36, height: 0.85, depth: 0.75 },
  'jar-small': { model: () => jar('jar-small', 0.5, 'rust', 0.55), radius: 0.22, height: 0.5, depth: 0.45 },
  'jar-pale': { model: () => jar('jar-pale', 0.7, 'beige', 0.6), solid: true, radius: 0.3, height: 0.7, depth: 0.6 },
  sack: { model: () => sack('sack', [0.8, 0.5, 0.35], 'beige', 0.55), radius: 0.4, height: 0.35, depth: 0.5 },
  'sack-sand': { model: () => sack('sack-sand', [0.7, 0.45, 0.32], 'sand', 0.5), radius: 0.35, height: 0.32, depth: 0.45 },
  'junk-heap': { model: heap, radius: 1.1, height: 0.5, depth: 1.6 },
  litter: { model: () => litter('litter', 1.6), radius: 0.8, height: 0, depth: 1.6 },
  'litter-small': { model: () => litter('litter-small', 1), radius: 0.5, height: 0, depth: 1 },
  rubble: { model: rubble, radius: 0.7, height: 0.26, depth: 0.9 },
  scrap: { model: scrap, radius: 0.9, height: 1.6, depth: 0.7 },
  vaporator: { model: vaporator, solid: true, radius: 0.45, height: 3.7, depth: 1.1 },
  bench: { model: bench, solid: true, radius: 0.8, height: 0.46, depth: 0.55 },
};

export default Object.values(CLUTTER).map((c) => c.model());
