import { defineLevel } from '../../engine/defs.js';
import { Painter } from './lib/painter.js';
import { Town } from './lib/town.js';

// MISSION 1: MOS EISLEY. The layout, route and numbers are in
// docs/mission1.md (area numbers below match its table). Painted in code on
// the fine grid (1 tile = 0.5 m) with the town kit (lib/town.js): buildings
// are blocks of raised floor under the sky, so each has its own roofline.

const W = 208;
const H = 152;
const SKY = 24;

const p = new Painter(W, H, { wall: 'adobe' });
const town = new Town(p, { sky: SKY });

// Everything not painted is the town's buildings, out of reach, inside a
// ring of wall at the map's edge.
p.rect(1, 1, W - 1, H - 1, town.roofCell({ h: 6 }));

// ---------------------------------------------------------------- 2. the main street (west end)
p.rect(4, 64, 60, 76, town.street());

// North side: a row of houses of different heights, each with a doorway.
for (const [x0, x1, h, wall] of [[4, 14, 5, 'adobe'], [14, 22, 7, 'adobe-pale'], [22, 34, 6, 'adobe'], [34, 40, 9, 'adobe-pale'], [40, 52, 6, 'adobe-old'], [52, 60, 7, 'adobe']]) {
  town.block(x0, 56, x1, 64, { h, wall });
}
// Doorways: an arch through the front wall into a shallow porch, a shut
// door (planks) at its back.
for (const [x, h, wall] of [[8, 5, 'adobe'], [17, 7, 'adobe-pale'], [27, 6, 'adobe'], [45, 6, 'adobe-old']]) {
  town.arch(x, 62, x + 2, 64, { h, wall, lintel: 3 });
  p.rect(x, 61, x + 2, 62, { wall: 'planks' });
}

// Secret: the second door opens (a secret door in planks) on a little back
// yard open to the sky, with an energy pack.
p.rect(15, 57, 21, 61, town.street(0, { secret: true }));
p.rect(17, 61, 19, 62, { door: 'planks', secret: true, floor: 'street-sand', ceiling: 'adobe-roof', floorZ: 0, ceilZ: 3, light: 152 });
p.rect(16, 61, 17, 62, { wall: 'adobe-pale' }).rect(19, 61, 20, 62, { wall: 'adobe-pale' });

// South side: a shop under an awning, and a little square with a round house.
for (const [x0, x1, h, wall] of [[4, 18, 6, 'adobe'], [18, 30, 8, 'adobe-pale'], [52, 60, 5, 'adobe-old']]) {
  town.block(x0, 76, x1, 86, { h, wall });
}
town.arch(22, 76, 26, 77, { h: 8, wall: 'adobe-pale', lintel: 3 });
p.rect(22, 77, 26, 78, { wall: 'planks' });
town.awning(20, 74, 28, 76, { z: 4.5 });
// The square, and a round house in it (a dome to come).
p.rect(30, 76, 52, 94, town.street());
town.circle(41, 86, 4.5, { inside: town.roofCell({ h: 6 }), wall: { wall: 'adobe', ceilZ: 6 }, open: 'out' });

// For now the street ends at an exit (until the town goes on east).
p.rect(58, 64, 60, 76, town.street(0, { exit: true }));

town.shadows();

const at = (type, x, y, extra = {}) => ({ type, x, y, ...extra });
const list = [
  at('player', 6.5, 70, { angle: 0 }),
  at('villager-woman', 24, 70), at('villager-man', 38, 80), at('jawa', 48, 68),
  at('energy-pack', 18, 58.5), // secret: the back yard
];

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
