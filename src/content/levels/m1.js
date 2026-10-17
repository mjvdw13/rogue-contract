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
    const wall = h % 2 ? 'adobe' : 'adobe-pale';
    p.rect(...box, town.roofCell({ h, wall }));
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
town.house(4, 50, 14, 63, { h: 6, r: 2 });
p.rect(7, 53, 12, 59, town.street(0, { secret: true }));
town.arch(8, 59, 10, 61, { h: 6, lintel: 1.2, light: 120 });
town.arch(8, 61, 10, 63, { h: 6, lintel: 3 });
list.push(at('energy-pack', 9.5, 55.5));
// B: a house with a porch jutting into the street, a room behind it and a
// dome over the room.
town.house(16, 50, 28, 62, { h: 6, r: 3, wall: 'adobe-pale', dome: true });
town.room(19, 53, 25, 60, { h: 6, wall: 'adobe-pale', light: 128 });
town.arch(20, 60, 24, 62, { h: 6, lintel: 3, wall: 'adobe-pale' });
town.house(19, 62, 25, 66, { h: 4, r: 1, wall: 'adobe-pale' });
town.arch(20, 62, 24, 66, { h: 4, lintel: 3, wall: 'adobe-pale' });
// C: a round tower under a big dome, a low lean-to in front of it with an
// awning over the street.
// (The lean-to first: the tower's round wall rises from its roof.)
town.house(30, 59, 42, 63, { h: 4, r: 1 });
town.circle(35.5, 56.5, 5, { inside: town.roofCell({ h: 9 }), wall: { wall: 'adobe', wallTop: 9 }, open: 'out' });
town.awning(31, 63, 41, 66, { z: 3.25 });
town.dome(35.5, 56.5, 9, 9.5);
// D: a two-storey house, its upper storey set back from the street, a
// small dome on top.
// (The porch's back is the house itself, faced in planks: a shut door.)
town.house(45, 51, 58, 63, { h: 6, r: 2, tiers: [{ box: [48, 51, 58, 58], h: 10, r: 2 }], dome: true });
town.arch(50, 61, 53, 63, { h: 6, lintel: 3 });
p.rect(50, 60, 53, 61, town.roofCell({ h: 6, wall: 'planks' }));

// South row.
// E: a shop you can walk into, under an awning, with a dome over it.
town.house(4, 78, 17, 91, { h: 6, r: 3, dome: true });
town.room(7, 81, 15, 88, { h: 6, light: 128 });
town.room(9, 81, 12, 83, { h: 6, light: 160 }); // daylight through the door
town.arch(9, 78, 12, 81, { h: 6, lintel: 3 });
town.awning(6, 76, 16, 78, { z: 3.5 });
// F: a tall house in two steps.
town.house(20, 79, 30, 92, { h: 7, r: 2, wall: 'adobe-pale', tiers: [{ box: [22, 83, 30, 92], h: 10, r: 2 }], dome: true });
// A square, with a round house under a dome in it.
town.circle(41, 86, 4.5, { inside: town.roofCell({ h: 5 }), wall: { wall: 'adobe', wallTop: 5 }, open: 'out' });
town.dome(41, 86, 5, 8.5);
// G: a low house on the square's east side.
town.house(53, 78, 61, 88, { h: 5, r: 2, wall: 'adobe-pale', dome: true });

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
list.push(...town.things);

list.push(
  at('player', 4, 70, { angle: 0 }),
  at('villager-woman', 24, 70), at('villager-man', 38, 80), at('villager-boy', 12, 84),
  at('supply-crate', 14, 86.5),
  at('jawa', 50, 47), // in the north back lane
);

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
  // view as the 100 on the particle bench (2026-10-15); 240 is a third fewer.
  weather: { type: 'glint', count: 240 },
  par: 600,
  ...p.build(),
  things: [],
  list,
});
