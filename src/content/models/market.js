import { ModelBuilder } from './lib/build.js';

// Mos Eisley's market and water plaza (levels/m1.js): stalls, the moisture
// condenser tower over the plaza and the dewback trough. The origin is on
// the floor under each one's middle; a stall is built looking south (+y),
// its counter at the front.

/** A ring of `n` points of radius `r` (x, y), turned by `turn` radians. */
const ring = (n, r, turn = 0) => Array.from({ length: n }, (_, i) => [Math.cos(turn + (i / n) * Math.PI * 2) * r, Math.sin(turn + (i / n) * Math.PI * 2) * r]);

/**
 * A rusty pipe `len` long (a cylinder's style): its rings run round it
 * whichever way it lies, one every `period`, the same on every facet.
 */
const pipe = (len, period = 0.16) => ({ tex: 'pipe-rings', sides: { uv: [[0, len / period], [1, len / period], [1, 0], [0, 0]] } });
/** A round picture's uv on an `n`-sided disc turned by `turn` (a cylinder's end). */
const disc = (n, turn = 0) => Array.from({ length: n }, (_, i) => [0.5 + 0.5 * Math.cos(turn + (i / n) * Math.PI * 2), 0.5 - 0.5 * Math.sin(turn + (i / n) * Math.PI * 2)]);
// A valve wheel's picture, drawn on a twelve-sided disc.
const WHEEL = disc(12);
/**
 * A loft's sides with one panel picture each, `rows` of them stacked up the
 * side: the picture follows the side's edges, so a tapering side tapers it.
 */
const panels = (tex, rows = 1) => ({ tex, side: () => ({ tex, uv: [[1, rows], [0, rows], [0, 0], [1, 0]] }) });
// Still, murky water (the trough and the tap's basin).
const WATER = { tex: 'water-murky' };
// Large stones: the brick texture's second course and its mortar (v from the
// mortar above to the course's foot), stretched to a stone wall's height,
// two stones to a repeat; and the course without its mortar, for their tops.
const STONE = [15 / 64, 32 / 64];
const STONE_TOP = [16 / 64, 32 / 64];

/**
 * A box of large stones, one course as tall as the box, the stones `len`
 * long, their joints starting from each side's corner and their tops on its
 * top (laid along its longer way).
 */
function stoneBox(m, [x0, y0, z0], [x1, y1, z1], len = 0.8) {
  const edges = [x1 - x0, y1 - y0, x1 - x0, y1 - y0].map((l) => l / (2 * len));
  const [a, b] = STONE_TOP;
  const n = Math.max(x1 - x0, y1 - y0) / (2 * len);
  const top = x1 - x0 >= y1 - y0 ? [[0, a], [n, a], [n, b], [0, b]] : [[0, a], [0, b], [n, b], [n, a]];
  m.box([x0, y0, z0], [x1, y1, z1], {
    bottom: false,
    top: { tex: 'adobe-brick', uv: top },
    side: (i) => ({ tex: 'adobe-brick', uv: [[0, STONE[1]], [edges[i], STONE[1]], [edges[i], STONE[0]], [0, STONE[0]]] }),
  });
}

/**
 * A market stall's counter and rack, under the kit's free-standing awning
 * (lib/town.js, stall()): a counter at the front in tin with a worn plate
 * top on a rubber plinth, power cells on it, and a rack at the back with
 * bright wares on its shelf (cloth, a droid's head, a scanner, cells), 3
 * wide and 2.4 deep. The counter and the rack collide; between them is
 * room for the stallholder (1.35, a villager's width and a bit), open at
 * the ends.
 */
function stall() {
  const m = new ModelBuilder('market-stall');
  const [hw, hd] = [1.5, 1.2];
  const counter = [[-hw + 0.1, hd - 0.6], [hw - 0.1, hd - 0.6], [hw - 0.1, hd - 0.05], [-hw + 0.1, hd - 0.05]];
  const rack = [[-hw + 0.1, -hd + 0.05], [hw - 0.1, -hd + 0.05], [hw - 0.1, -hd + 0.45], [-hw + 0.1, -hd + 0.45]];
  m.prism(counter, 0, 1, { tex: 'metal-grey', top: { tex: 'bay-plate' }, bottom: false });
  m.box([-hw + 0.08, hd - 0.63, 0], [hw - 0.08, hd - 0.02, 0.18], { tex: 'pump-hose', top: false, bottom: false });
  m.prism(rack, 0, 1.45, { tex: 'metal-rust', top: { tex: 'bay-plate' }, bottom: false });
  // Wares, each its own kind of thing in bright, clean colours: on the rack
  // folded bolts of cloth, a droid's head, a scanner with a lit screen and a
  // cluster of coloured cells; on the counter more power cells.
  const [wy, wz] = [-0.95, 1.45];
  [['ware-red', -0.04, 0.46], ['ware-teal', 0.03, 0.42], ['ware-yellow', -0.02, 0.38]].forEach(([tex, dx, w], i) => {
    m.box([-1.05 + dx - w / 2, wy - 0.14, wz + i * 0.1], [-1.05 + dx + w / 2, wy + 0.14, wz + i * 0.1 + 0.1], { tex, texScale: 0.25, bottom: false });
  });
  const dome = (r) => ring(8, r).map(([a, b]) => [a - 0.55, b + wy]);
  m.loft(dome(0.17), wz, dome(0.15), wz + 0.1, { tex: 'ware-white', texScale: 0.25, bottom: false, top: false, side: (k) => (k % 2 === 0 ? { tex: 'ware-blue' } : undefined) });
  m.loft(dome(0.15), wz + 0.1, dome(0.06), wz + 0.22, { tex: 'ware-white', texScale: 0.25, bottom: false });
  m.box([-0.58, wy + 0.1, wz + 0.04], [-0.52, wy + 0.18, wz + 0.1], { color: [255, 50, 40], glow: true, bottom: false });
  m.box([-0.2, wy - 0.12, wz], [0.3, wy + 0.12, wz + 0.2], { tex: 'ware-orange', texScale: 0.25, bottom: false });
  m.box([-0.12, wy + 0.12, wz + 0.05], [0.22, wy + 0.14, wz + 0.17], { color: [90, 235, 190], glow: true, bottom: false });
  m.cylinder([0.25, wy - 0.06, wz + 0.2], 0.015, 0.16, { segments: 4, color: ['steel', 0.6], bottom: false });
  for (const [x, y, h, tex] of [[0.62, wy - 0.05, 0.34, 'ware-blue'], [0.78, wy + 0.04, 0.42, 'ware-red'], [0.7, wy + 0.1, 0.26, 'ware-yellow']]) {
    m.cylinder([x, y, wz], 0.07, h, { segments: 6, tex, texScale: 0.15, top: { color: ['steel', 0.6] }, bottom: false });
  }
  for (const [x, tex] of [[0.55, 'ware-yellow'], [0.75, 'ware-teal'], [0.95, 'ware-red']]) {
    m.cylinder([x, hd - 0.33, 1], 0.07, 0.22, { segments: 6, tex, texScale: 0.15, top: { color: ['steel', 0.6] }, bottom: false });
  }
  m.outlineLines(counter).outlineLines(rack);
  return m.build();
}

/** The condenser tower's height, to its beacon. */
export const TOWER_HEIGHT = 20.9;
/** The tower's cistern: its plinth's radius and the tank's top. */
export const CISTERN = { radius: 2.6, height: 4 };

/**
 * The moisture condenser tower over the water plaza, the market's landmark
 * (about 10 m): a round duracrete cistern on a stone plinth, banded in
 * steel and lidded in riveted panels; a tapering column out of it with
 * rings, and near its top the condenser, a stack of wide thin plates with
 * radial fins; a collar and a pointed panelled cap, an antenna with a red
 * beacon; two pipes down
 * into the cistern; and the water seller's tap on its south side over a
 * basin. It collides as its plinth and the basin.
 */
function condenserTower() {
  const m = new ModelBuilder('condenser-tower');
  const turn = Math.PI / 12;
  // The plinth: one course of large stones, two to a facet, joints on the
  // corners and in the middle, carried over its rim.
  m.prism(ring(12, CISTERN.radius, turn), 0, 0.4, { top: false, bottom: false, side: () => ({ tex: 'adobe-brick', uv: [[1, STONE[1]], [0, STONE[1]], [0, STONE[0]], [1, STONE[0]]] }) });
  const [rimOut, rimIn] = [ring(12, CISTERN.radius, turn), ring(12, 2.3, turn)];
  for (let i = 0; i < 12; i++) {
    const j = (i + 1) % 12;
    const at = ([x, y]) => [x, y, 0.4];
    m.face([at(rimOut[i]), at(rimOut[j]), at(rimIn[j]), at(rimIn[i])], { tex: 'adobe-brick', uv: [[1, STONE_TOP[1]], [0, STONE_TOP[1]], [0, STONE_TOP[0]], [1, STONE_TOP[0]]] }, [0, 0, 0]);
  }
  m.cylinder([0, 0, 0.4], 2.3, 3, { segments: 12, turn, tex: 'bay-wall', top: false, bottom: false });
  for (const z of [1.2, 2.6]) m.cylinder([0, 0, z], 2.36, 0.12, { segments: 12, turn, tex: 'band-steel', texScale: 0.16, top: false, bottom: false });
  m.loft(ring(12, 2.35, turn), 3.4, ring(12, 1.3, turn), CISTERN.height, { ...panels('cone-panel'), bottom: false, top: false });
  // The column, tapering, and its rings.
  const [z0, z1, r0, r1] = [CISTERN.height, 17, 1.0, 0.6];
  const rAt = (z) => r0 + ((z - z0) / (z1 - z0)) * (r1 - r0);
  m.loft(ring(10, r0, turn), z0, ring(10, r1, turn), z1, { tex: 'metal-grey', top: false, bottom: false });
  for (const z of [6.5, 9.5]) m.cylinder([0, 0, z], rAt(z) + 0.08, 0.2, { segments: 10, turn, tex: 'band-steel', texScale: 0.16 });
  // The condenser: wide thin plates stacked up the top of the column, a
  // ring of radial fins drawn on each face and a pale lip round the edge.
  const fins = { tex: 'fin-disc', uv: disc(10, turn) };
  for (let k = 0; k < 6; k++) {
    const z = 11.6 + k * 0.85;
    m.cylinder([0, 0, z], 1.75 - k * 0.07, 0.12, { segments: 10, turn, tex: 'fin-edge', texScale: 0.16, top: fins, bottom: fins });
  }
  // The collar, the cap and the antenna with its beacon.
  m.cylinder([0, 0, z1 - 0.2], 1.25, 0.3, { segments: 10, turn, tex: 'band-steel', texScale: 0.16 });
  m.loft(ring(10, 1.05, turn), z1 + 0.1, ring(10, 0.22, turn), 18.6, { ...panels('cone-panel', 2), bottom: false, top: { tex: 'cone-panel' } });
  m.cylinder([0, 0, 18.6], 0.05, 2.1, { segments: 5, ...pipe(2.1, 0.1), bottom: false, top: false });
  m.box([-0.1, -0.1, 20.7], [0.1, 0.1, TOWER_HEIGHT], { color: [255, 60, 40], glow: true });
  // Pipes from the column down into the cistern's lid.
  for (const x of [-1.15, 1.15]) {
    m.cylinder([x, 0, 3.7], 0.1, 4.6, { segments: 6, ...pipe(4.6), bottom: false });
    m.box([x * 0.95 - 0.12, -0.12, 8.1], [x * 0.95 + 0.12, 0.12, 8.3], { tex: 'bay-plate' });
  }
  // The tap on the south side: a pipe out of the tank, a valve wheel, a
  // spout down over a basin of water walled in large stones like the plinth.
  m.cylinder([0, 2.25, 1.45], 0.08, 0.6, { axis: 'y', segments: 6, ...pipe(0.6) });
  m.cylinder([0, 2.8, 1.05], 0.07, 0.45, { segments: 6, ...pipe(0.45), bottom: false });
  m.cylinder([0, 2.55, 1.55], 0.18, 0.05, { segments: 12, tex: 'pump-hose', top: { tex: 'valve-wheel', uv: WHEEL } });
  const [bx, by0, by1, bh, bt] = [0.45, 2.45, 3.2, 0.5, 0.1];
  stoneBox(m, [-bx, by0, 0], [bx, by0 + bt, bh], 0.45);
  stoneBox(m, [-bx, by1 - bt, 0], [bx, by1, bh], 0.45);
  stoneBox(m, [-bx, by0 + bt, 0], [-bx + bt, by1 - bt, bh], 0.45);
  stoneBox(m, [bx - bt, by0 + bt, 0], [bx, by1 - bt, bh], 0.45);
  m.face([[-bx + bt, by0 + bt, bh - 0.07], [bx - bt, by0 + bt, bh - 0.07], [bx - bt, by1 - bt, bh - 0.07], [-bx + bt, by1 - bt, bh - 0.07]], WATER, [0, 2.8, 0]);
  m.outlineLines(ring(12, CISTERN.radius, turn));
  m.outlineLines([[-0.45, 2.2], [0.45, 2.2], [0.45, 3.2], [-0.45, 3.2]]);
  return m.build();
}

/**
 * A dewback trough: a long trough of large stones like the tower's plinth,
 * full of murky water, 3.2 by 0.9, its walls a hand thick. It collides as
 * its outline.
 */
function trough() {
  const m = new ModelBuilder('water-trough');
  const [hl, hw, h, t] = [1.6, 0.45, 0.75, 0.1];
  stoneBox(m, [-hl, -hw, 0], [hl, -hw + t, h]);
  stoneBox(m, [-hl, hw - t, 0], [hl, hw, h]);
  stoneBox(m, [-hl, -hw + t, 0], [-hl + t, hw - t, h]);
  stoneBox(m, [hl - t, -hw + t, 0], [hl, hw - t, h]);
  m.face([[-hl + t, -hw + t, h - 0.07], [hl - t, -hw + t, h - 0.07], [hl - t, hw - t, h - 0.07], [-hl + t, hw - t, h - 0.07]], WATER, [0, 0, 0]);
  m.outlineLines([[-hl, -hw], [hl, -hw], [hl, hw], [-hl, hw]]);
  return m.build();
}

export default [stall(), condenserTower(), trough()];
