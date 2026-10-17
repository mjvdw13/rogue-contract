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

/** A dome on a roof (or over a round building): placed, and casting its shadow. */
const DOMES = { 'dome-small': [1.5, 1.9], dome: [2.5, 3], 'dome-large': [4, 4.5] };
function dome(type, x, y, z) {
  list.push(at(type, x, y, { z }));
  town.caster(x, y, DOMES[type][0], z, DOMES[type][1]);
}

// Everything not painted is the rest of the town, out of reach: blocks of
// different heights, so the skyline past the streets steps up and down
// rather than standing as one wall.
for (let y = 1; y < H - 1; y += 9) {
  for (let x = 1; x < W - 1; x += 11) {
    const k = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    const h = 5 + Math.floor((k - Math.floor(k)) * 5);
    p.rect(x, y, Math.min(x + 11, W - 1), Math.min(y + 9, H - 1), town.roofCell({ h, wall: h % 2 ? 'adobe' : 'adobe-pale' }));
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
town.house(16, 50, 28, 62, { h: 6, r: 3, wall: 'adobe-pale' });
town.room(19, 53, 25, 60, { h: 6, wall: 'adobe-pale', light: 128 });
town.arch(20, 60, 24, 62, { h: 6, lintel: 3, wall: 'adobe-pale' });
town.house(19, 62, 25, 66, { h: 4, r: 1, wall: 'adobe-pale' });
town.arch(20, 62, 24, 66, { h: 4, lintel: 3, wall: 'adobe-pale' });
dome('dome', 22, 56.5, 6);
// C: a round tower under a big dome, a low lean-to in front of it with an
// awning over the street.
// (The lean-to first: the tower's round wall rises from its roof.)
town.house(30, 59, 42, 63, { h: 4, r: 1 });
town.circle(35.5, 56.5, 5, { inside: town.roofCell({ h: 9 }), wall: { wall: 'adobe', wallTop: 9 }, open: 'out' });
town.awning(31, 63, 41, 66, { z: 3.25 });
dome('dome-large', 35.5, 56.5, 9);
// D: a two-storey house, its upper storey set back from the street, a
// small dome on top.
// (The porch's back is the house itself, faced in planks: a shut door.)
town.house(45, 51, 58, 63, { h: 6, r: 2, tiers: [{ box: [48, 51, 58, 58], h: 10, r: 2 }] });
town.arch(50, 61, 53, 63, { h: 6, lintel: 3 });
p.rect(50, 60, 53, 61, town.roofCell({ h: 6, wall: 'planks' }));
dome('dome-small', 54.5, 54.5, 10);

// South row.
// E: a shop you can walk into, under an awning, with a dome over it.
town.house(4, 78, 17, 91, { h: 6, r: 3 });
town.room(7, 81, 15, 88, { h: 6, light: 128 });
town.room(9, 81, 12, 83, { h: 6, light: 160 }); // daylight through the door
town.arch(9, 78, 12, 81, { h: 6, lintel: 3 });
town.awning(6, 76, 16, 78, { z: 3.5 });
dome('dome', 11, 84.5, 6);
// F: a tall house in two steps.
town.house(20, 79, 30, 92, { h: 7, r: 2, wall: 'adobe-pale', tiers: [{ box: [22, 83, 30, 92], h: 10, r: 2 }] });
// A square, with a round house under a dome in it.
town.circle(41, 86, 4.5, { inside: town.roofCell({ h: 5 }), wall: { wall: 'adobe', wallTop: 5 }, open: 'out' });
dome('dome-large', 41, 86, 5);
// G: a low house on the square's east side.
town.house(53, 78, 61, 88, { h: 5, r: 2, wall: 'adobe-pale' });
dome('dome-small', 57, 83, 5);

// For now the street ends at an exit (until the town goes on east).
p.rect(60, 64, 62, 76, town.street(0, { exit: true }));

town.finish();

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
  par: 600,
  ...p.build(),
  things: [],
  list,
});
