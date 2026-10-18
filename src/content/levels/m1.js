import { defineLevel } from '../../engine/defs.js';
import { Painter } from './lib/painter.js';
import { Town } from './lib/town.js';

// MISSION 1: MOS EISLEY. The layout, route and numbers are in
// docs/mission1.md (area numbers below match its table). Painted in code on
// the fine grid (1 tile = 0.5 m) with the town kit (lib/town.js). Every
// building is a volume you can walk round: alleys between them, rounded
// corners, storeys set back, porches, domes and rooms inside. No flat fronts.

const W = 208;
const H = 152;
const SKY = 24;

const p = new Painter(W, H, { wall: 'adobe' });
const town = new Town(p, { sky: SKY });
const at = (type, x, y, extra = {}) => ({ type, x, y, ...extra });
// The plasters, plain ones the most common.
const PLASTERS = ['adobe', 'adobe', 'adobe-pale', 'adobe-pale', 'adobe-ochre', 'adobe-rose', 'adobe-grey'];
// The feet of the walls (lib/town.js, SKIRTS): not every house has one.
const SKIRTS = ['dirt', 'dirt', 'plinth', null];
const list = [];

// Everything not painted is the rest of the town, out of reach: blocks of
// different heights, so the skyline past the streets steps up and down
// rather than standing as one wall. Most get a dome once the streets are
// painted (below), so the skyline is Tatooine's.
const hash = (x, y) => {
  const k = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return k - Math.floor(k);
};
const blocks = [];
for (let y = 1; y < H - 1; y += 9) {
  for (let x = 1; x < W - 1; x += 11) {
    const h = 5 + Math.floor(hash(x, y) * 5);
    const box = [x, y, Math.min(x + 11, W - 1), Math.min(y + 9, H - 1)];
    const wall = PLASTERS[Math.floor(hash(x + 5, y + 2) * PLASTERS.length)];
    const skirt = SKIRTS[Math.floor(hash(x + 9, y + 4) * SKIRTS.length)];
    p.rect(...box, town.roofCell({ h, wall, skirt }));
    blocks.push({ box, h, wall });
  }
}

// ---------------------------------------------------------------- 2. the main street (west end)
// Open ground first: the street (64..76), a back lane north of the first
// row of houses (44..50) and one south of the second (94..100); the houses
// stand in it as islands, with alleys between them.
p.rect(2, 44, 62, 100, town.street());

// North row.
// A: a courtyard house. At the back of its porch a low gap (crouch) leads
// through to a little yard open to the sky, with an energy pack: a secret.
town.house(4, 50, 14, 63, { h: 6, r: 2, skirt: 'plinth' });
p.rect(7, 53, 12, 59, town.street(0, { secret: true }));
town.arch(8, 59, 10, 61, { h: 6, lintel: 1.2, light: 120 });
town.arch(8, 61, 10, 63, { h: 6, lintel: 3 });
list.push(at('energy-pack', 9.5, 55.5));
town.window(12.5, 63, 'S', { tex: 'window-louvre' }).window(4, 57.5, 'W');
// B: a house with a porch jutting into the street, a room behind it and a
// dome over the room.
town.house(16, 50, 28, 62, { h: 6, r: 3, wall: 'adobe-pale', skirt: null, dome: true });
town.room(19, 53, 25, 60, { h: 6, wall: 'adobe-pale', light: 128 });
town.arch(20, 60, 24, 62, { h: 6, lintel: 3, wall: 'adobe-pale' });
town.house(19, 62, 25, 66, { h: 4, r: 1, wall: 'adobe-pale', skirt: null });
town.arch(20, 62, 24, 66, { h: 4, lintel: 3, wall: 'adobe-pale' });
town.window(16, 56.5, 'W', { tex: 'window-louvre' });
// C: a round tower under a big dome, a low lean-to in front of it with an
// awning over the street.
// (The lean-to first: the tower's round wall rises from its roof.)
town.house(30, 59, 42, 63, { h: 4, r: 1 });
town.circle(35.5, 56.5, 5, { inside: town.roofCell({ h: 9, wall: 'adobe-ochre' }), wall: { wall: 'adobe-ochre', wallTop: 9 }, open: 'out' });
town.awning(31, 63, 41, 66, { z: 3.25 });
town.door(33, 63, 'S', { h: 4, tex: 'door-grey' });
town.door(38.5, 63, 'S', { h: 4, tex: 'shutter', tall: 2.25, width: 3, jamb: false, sign: false, panel: false });
town.dome(35.5, 56.5, 9, 9.5, { wall: 'adobe-ochre' });
// D: a two-storey house, its upper storey set back from the street, a
// small dome on top.
// (A shut door at the back of its porch.)
town.house(45, 51, 58, 63, { h: 6, r: 2, wall: 'adobe-rose', skirt: 'plinth', tiers: [{ box: [48, 51, 58, 58], h: 10, r: 2 }], dome: true });
town.arch(50, 61, 53, 63, { h: 6, lintel: 3.75, wall: 'adobe-rose' });
town.door(51.5, 61, 'S', { h: 6, depth: 0, panel: false });
town.window(48.5, 63, 'S', { z: 3.6 }).window(55.5, 63, 'S', { z: 3.6 }).window(53.5, 58, 'S', { z: 8, tex: 'window-louvre' });

// South row.
// E: a shop you can walk into, under an awning, with a dome over it.
town.house(4, 78, 17, 91, { h: 6, r: 3, dome: true });
town.room(7, 81, 15, 88, { h: 6, light: 128 });
town.room(9, 81, 12, 83, { h: 6, light: 160 }); // daylight through the door
town.arch(9, 78, 12, 81, { h: 6, lintel: 3 });
town.awning(6, 76, 16, 78, { z: 3.5 });
town.window(7.5, 78, 'N', { z: 2.2 }).window(13.5, 78, 'N', { z: 2.2 });
// F: a tall house in two steps.
town.house(20, 79, 30, 92, { h: 7, r: 2, wall: 'adobe-grey', skirt: null, tiers: [{ box: [22, 83, 30, 92], h: 10, r: 2 }], dome: true });
town.door(25, 79, 'N', { h: 7, tex: 'door-grey', wall: 'adobe-grey' });
town.window(22.5, 79, 'N', { z: 4 }).window(26.5, 83, 'N', { z: 8.5, tex: 'window-louvre' }).window(20, 86.5, 'W');
// A square, with a round house under a dome in it.
town.circle(41, 86, 4.5, { inside: town.roofCell({ h: 5, wall: 'adobe-rose', skirt: 'plinth' }), wall: { wall: 'adobe-rose', wallTop: 5 }, open: 'out', skirt: 'plinth' });
town.dome(41, 86, 5, 8.5, { wall: 'adobe-rose' });
// G: a low house on the square's east side.
town.house(53, 78, 61, 88, { h: 5, r: 2, wall: 'adobe-ochre', skirt: null, dome: true });
town.door(57, 78, 'N', { h: 5, wall: 'adobe-ochre' });
town.window(53, 83.5, 'W', { z: 3, tex: 'window-louvre' });

// For now the street ends at an exit (until the town goes on east).
p.rect(60, 64, 62, 76, town.street(0, { exit: true }));

// Domes on the blocks of town the streets left whole, two in three.
for (const { box: [x0, y0, x1, y1], h, wall } of blocks) {
  if (hash(x0 + 3, y0 + 7) > 0.67) continue;
  let whole = true;
  for (let y = y0; y < y1 && whole; y++) for (let x = x0; x < x1 && whole; x++) whole = p.get(x, y).floorZ === h && !p.get(x, y).slab;
  if (whole) town.dome((x0 + x1) / 2, (y0 + y1) / 2, h, Math.min(x1 - x0, y1 - y0) - 1.5, { wall });
}

town.finish();
town.drifts();
// Rain streaks, dust and stains on the walls (lib/town.js).
town.grime();
list.push(...town.things);

list.push(
  at('player', 4, 70, { angle: 0 }),
  at('villager-woman', 24, 70), at('villager-man', 38, 80), at('villager-boy', 12, 84),
  at('supply-crate', 14, 86.5),
  at('jawa', 50, 47), // in the north back lane
);

// Cables, ropes and cloth moving in the air (world/hangings.js). Each is
// tied 0.05 out from a straight stretch of wall, clear of the rounded
// corners.
const hangings = [
  // Cables across the main street, house to house.
  { type: 'cable', from: [10, 63.05, 5.4], to: [8.5, 77.95, 5.2], sag: 1 },
  { type: 'cable', from: [21.5, 66.05, 3.7], to: [27, 78.95, 6.2], sag: 0.8 },
  { type: 'cable', from: [54, 63.05, 5.5], to: [55.5, 77.95, 4.6], sag: 1 },
  // A long one high up, from C's tower to F's upper storey.
  { type: 'cable', from: [35.5, 61.55, 8.2], to: [24.5, 82.95, 9], sag: 1.5 },
  // Across the alley between A and B.
  { type: 'cable', from: [14.05, 55, 5.5], to: [15.95, 57, 5.2], sag: 0.3 },
  // Ropes hanging from walls.
  { type: 'rope', from: [6.5, 63.05, 5.6], length: 1.4 },
  { type: 'rope', from: [56, 58.05, 9.5], length: 2 },
  // A rag over B's porch doorway, like a curtain.
  { type: 'rag', from: [20.2, 66.05, 3.9], to: [23.8, 66.05, 3.9], length: 1.5 },
  // Cloth hanging from the awnings' front edges.
  { type: 'cloth-pale', from: [32, 66.05, 3.2], to: [35, 66.05, 3.2], length: 0.6 },
  { type: 'rag', from: [37, 66.05, 3.2], to: [40, 66.05, 3.2], length: 0.9 },
  { type: 'cloth-pale', from: [7, 75.95, 3.45], to: [11, 75.95, 3.45], length: 0.7 },
  // A long banner down G's west wall, facing the square.
  { type: 'rag', from: [52.95, 80.4, 4.8], to: [52.95, 81.8, 4.8], length: 2.4 },
  // A sheet slung across the north back lane, pinned at its corners.
  { type: 'cloth-pale', from: [12, 44.05, 4], to: [12.5, 49.95, 4], length: 1, pin: 'corners' },
];

export default defineLevel({
  id: 'm1',
  mapLabel: 'M1',
  name: 'MOS EISLEY',
  music: 'garrison',
  sky: 'sky-day',
  // A hazy afternoon: far streets fade into warm dust, halfway at 32 m.
  haze: { color: [212, 200, 174], half: 64 },
  // Dust catching the suns, drifting in still air: soft glints, as plain
  // `dust` was lost against the bright sand and glowing motes were too
  // intense (Mark). 360 in the 20 x 20 tiles round you would be as thick in
  // view as the 100 on the particle bench (2026-10-15); 240 still
  // distracted, and Mark halved that twice.
  weather: { type: 'glint', count: 60 },
  decals: town.decals,
  hangings,
  par: 600,
  ...p.build(),
  things: [],
  list,
});
