import { ModelBuilder } from './lib/build.js';

// Mos Eisley's market and water plaza (levels/m1.js): stalls, the moisture
// condenser tower over the plaza and the dewback trough. The origin is on
// the floor under each one's middle; a stall is built looking south (+y),
// its counter at the front.

/** A ring of `n` points of radius `r` (x, y), turned by `turn` radians. */
const ring = (n, r, turn = 0) => Array.from({ length: n }, (_, i) => [Math.cos(turn + (i / n) * Math.PI * 2) * r, Math.sin(turn + (i / n) * Math.PI * 2) * r]);

const PIPE = ['rust', 0.32];
const WATER = [70, 112, 128];

/**
 * A market stall's counter and rack, under the kit's free-standing awning
 * (lib/town.js, stall()): a counter at the front in tin with a worn top,
 * power cells on it, and a rack at the back with wares on its shelf, 3
 * wide and 2.4 deep. The counter and the rack collide; between them is
 * room for the stallholder (1.35, a villager's width and a bit), open at
 * the ends.
 */
function stall() {
  const m = new ModelBuilder('market-stall');
  const [hw, hd] = [1.5, 1.2];
  const counter = [[-hw + 0.1, hd - 0.6], [hw - 0.1, hd - 0.6], [hw - 0.1, hd - 0.05], [-hw + 0.1, hd - 0.05]];
  const rack = [[-hw + 0.1, -hd + 0.05], [hw - 0.1, -hd + 0.05], [hw - 0.1, -hd + 0.45], [-hw + 0.1, -hd + 0.45]];
  m.prism(counter, 0, 1, { tex: 'metal-grey', top: { color: ['tan', 0.42] }, bottom: false });
  m.box([-hw + 0.08, hd - 0.63, 0], [hw - 0.08, hd - 0.02, 0.18], { color: ['gray', 0.18], top: false, bottom: false });
  m.prism(rack, 0, 1.45, { tex: 'metal-rust', top: { color: ['gray', 0.3] }, bottom: false });
  // Wares: boxes on the rack, power cells on the counter.
  const wares = [
    [-1.1, -0.95, 1.45, 0.4, 0.3, 0.3, ['steel', 0.5]],
    [-0.55, -0.95, 1.45, 0.3, 0.3, 0.45, ['tan', 0.6]],
    [0.05, -0.97, 1.45, 0.5, 0.25, 0.22, ['gray', 0.45]],
    [0.7, -0.95, 1.45, 0.35, 0.3, 0.38, ['rust', 0.45]],
  ];
  for (const [x, y, z, w, d, h, color] of wares) m.box([x - w / 2, y - d / 2, z], [x + w / 2, y + d / 2, z + h], { color, bottom: false });
  for (const [x, color] of [[0.55, ['yellow', 0.6]], [0.75, ['steel', 0.6]], [0.95, ['blood', 0.6]]]) {
    m.cylinder([x, hd - 0.33, 1], 0.07, 0.22, { segments: 6, color, bottom: false });
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
 * (about 10 m): a round duracrete cistern on a brick plinth, banded in
 * steel and lidded; a tapering column out of it with rings, and near its
 * top the condenser, a stack of wide thin plates; a collar and a pointed
 * cap, an antenna with a red beacon; two pipes down
 * into the cistern; and the water seller's tap on its south side over a
 * basin. It collides as its plinth and the basin.
 */
function condenserTower() {
  const m = new ModelBuilder('condenser-tower');
  const turn = Math.PI / 12;
  m.prism(ring(12, CISTERN.radius, turn), 0, 0.4, { tex: 'adobe-brick', bottom: false });
  m.cylinder([0, 0, 0.4], 2.3, 3, { segments: 12, turn, tex: 'bay-wall', top: false, bottom: false });
  for (const z of [1.2, 2.6]) m.cylinder([0, 0, z], 2.36, 0.12, { segments: 12, turn, color: ['gray', 0.25], top: false, bottom: false });
  m.loft(ring(12, 2.35, turn), 3.4, ring(12, 1.3, turn), CISTERN.height, { color: ['gray', 0.4], bottom: false, top: false });
  // The column, tapering, and its rings.
  const [z0, z1, r0, r1] = [CISTERN.height, 17, 1.0, 0.6];
  const rAt = (z) => r0 + ((z - z0) / (z1 - z0)) * (r1 - r0);
  m.loft(ring(10, r0, turn), z0, ring(10, r1, turn), z1, { tex: 'metal-grey', top: false, bottom: false });
  for (const z of [6.5, 9.5]) m.cylinder([0, 0, z], rAt(z) + 0.08, 0.2, { segments: 10, turn, color: ['gray', 0.22] });
  // The condenser: wide thin plates stacked up the top of the column.
  for (let k = 0; k < 6; k++) {
    const z = 11.6 + k * 0.85;
    m.cylinder([0, 0, z], 1.75 - k * 0.07, 0.12, { segments: 10, turn, color: ['steel', 0.5], bottom: { color: ['gray', 0.2] } });
  }
  // The collar, the cap and the antenna with its beacon.
  m.cylinder([0, 0, z1 - 0.2], 1.25, 0.3, { segments: 10, turn, color: ['gray', 0.35] });
  m.loft(ring(10, 1.05, turn), z1 + 0.1, ring(10, 0.22, turn), 18.6, { color: ['gray', 0.5], bottom: false });
  m.cylinder([0, 0, 18.6], 0.05, 2.1, { segments: 5, color: ['steel', 0.5], bottom: false, top: false });
  m.box([-0.1, -0.1, 20.7], [0.1, 0.1, TOWER_HEIGHT], { color: [255, 60, 40], glow: true });
  // Pipes from the column down into the cistern's lid.
  for (const x of [-1.15, 1.15]) {
    m.cylinder([x, 0, 3.7], 0.1, 4.6, { segments: 6, color: PIPE, bottom: false });
    m.box([x * 0.95 - 0.12, -0.12, 8.1], [x * 0.95 + 0.12, 0.12, 8.3], { color: ['gray', 0.2] });
  }
  // The tap on the south side: a pipe out of the tank, a valve wheel, a
  // spout down over a stone basin of water.
  m.cylinder([0, 2.25, 1.45], 0.08, 0.6, { axis: 'y', segments: 6, color: PIPE });
  m.cylinder([0, 2.8, 1.05], 0.07, 0.45, { segments: 6, color: PIPE, bottom: false });
  m.cylinder([0, 2.55, 1.55], 0.18, 0.05, { segments: 8, color: ['blood', 0.6] });
  m.box([-0.45, 2.45, 0], [0.45, 3.2, 0.5], { tex: 'flagstone', top: false, bottom: false });
  m.face([[-0.4, 2.5, 0.42], [0.4, 2.5, 0.42], [0.4, 3.15, 0.42], [-0.4, 3.15, 0.42]], { color: WATER }, [0, 2.8, 0]);
  m.outlineLines(ring(12, CISTERN.radius, turn));
  m.outlineLines([[-0.45, 2.2], [0.45, 2.2], [0.45, 3.2], [-0.45, 3.2]]);
  return m.build();
}

/**
 * A dewback trough: a long stone trough full of water, 3.2 by 0.9, its
 * walls a hand thick. It collides as its outline.
 */
function trough() {
  const m = new ModelBuilder('water-trough');
  const [hl, hw, h, t] = [1.6, 0.45, 0.75, 0.1];
  const stone = { tex: 'adobe-brick', top: { color: ['tan', 0.5] }, bottom: false };
  m.box([-hl, -hw, 0], [hl, -hw + t, h], stone);
  m.box([-hl, hw - t, 0], [hl, hw, h], stone);
  m.box([-hl, -hw + t, 0], [-hl + t, hw - t, h], stone);
  m.box([hl - t, -hw + t, 0], [hl, hw - t, h], stone);
  m.face([[-hl + t, -hw + t, h - 0.07], [hl - t, -hw + t, h - 0.07], [hl - t, hw - t, h - 0.07], [-hl + t, hw - t, h - 0.07]], { color: WATER }, [0, 0, 0]);
  m.outlineLines([[-hl, -hw], [hl, -hw], [hl, hw], [-hl, hw]]);
  return m.build();
}

export default [stall(), condenserTower(), trough()];
