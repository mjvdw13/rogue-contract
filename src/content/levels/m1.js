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
town.leanTo(19, 62, 25, 66, { h: 4, face: 'S', seed: 9 });
town.window(16, 56.5, 'W', { tex: 'window-louvre' });
// C: a round tower under a big dome, a low lean-to in front of it with an
// awning over the street.
// (The lean-to first: the tower's round wall rises from its roof.)
town.house(30, 59, 42, 63, { h: 4, r: 1 });
town.leanTo(30, 59, 42, 63, { h: 4, face: 'S' });
town.circle(35.5, 56.5, 5, { inside: town.roofCell({ h: 9, wall: 'adobe-ochre' }), wall: { wall: 'adobe-ochre', wallTop: 9 }, open: 'out' });
town.awning(31, 63, 41, 65, { z: 3, face: 'S', cloth: 'teal' });
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
town.awning(6, 76, 16, 78, { z: 3.5, face: 'N', cloth: 'red', valance: 'valance-red' });
town.window(7.5, 78, 'N', { z: 2.2 }).window(13.5, 78, 'N', { z: 2.2 });
// F: a tall house in two steps, a door that opens into a room behind it
// (the front under the lower roof, the back under the upper storey).
town.house(20, 79, 30, 92, { h: 7, r: 2, wall: 'adobe-grey', skirt: null, tiers: [{ box: [22, 83, 30, 92], h: 10, r: 2 }], dome: true });
town.room(23, 80, 28, 83, { h: 7, wall: 'adobe-grey', light: 136 });
// (A passage to the back clear of the upper window over row 83.)
town.room(24, 83, 26, 84, { h: 10, wall: 'adobe-grey', light: 128 });
town.room(24, 84, 28, 90, { h: 10, wall: 'adobe-grey', light: 120 });
town.door(25, 79, 'N', { h: 7, tex: 'door-grey', wall: 'adobe-grey', opens: true });
town.window(22.5, 79, 'N', { z: 4 }).window(26.5, 83, 'N', { z: 8.5, tex: 'window-louvre' }).window(20, 86.5, 'W');
// A square, with a round house under a dome in it.
town.circle(41, 86, 4.5, { inside: town.roofCell({ h: 5, wall: 'adobe-rose', skirt: 'plinth' }), wall: { wall: 'adobe-rose', wallTop: 5 }, open: 'out', skirt: 'plinth' });
town.dome(41, 86, 5, 8.5, { wall: 'adobe-rose' });
// G: a low house on the square's east side, its red door opening into a room.
town.house(53, 78, 61, 88, { h: 5, r: 2, wall: 'adobe-ochre', skirt: null, dome: true });
town.room(55, 79, 59, 87, { h: 5, ceilZ: 4.25, wall: 'adobe-ochre', light: 128 });
town.door(57, 78, 'N', { h: 5, wall: 'adobe-ochre', opens: true });
town.window(53, 83.5, 'W', { z: 3, tex: 'window-louvre' });
// A stall on the square in front of G, under a tarp that billows.
town.tarp(46, 80, 50, 84, { z: 2.75, face: 'W', rise: 0.5, cloth: 'red' });

// ---------------------------------------------------------------- 1. Docking Bay 87
// South of the south back lane: a round pit 21 m across under the sky, its
// floor 2.5 m below the street and its duracrete walls 5.5 m tall, braced
// at the foot. The bay door (4 wide) opens off the lane into a passage
// through the bay's building and onto a landing over the pit, at street
// level; stairs go down from it. The episode starts on the bay floor.
const BAY = { cx: 32, cy: 125, r: 21, floorZ: -5, rim: 6 };
// (The buttresses along the foot of the walls, and of the landing and stairs.)
const RIBBED = [{ to: 3, tex: 'bay-wall-ribbed' }];
const bayFloor = town.street(BAY.floorZ, { floor: 'bay-floor', side: 'bay-wall', bands: RIBBED });
p.rect(9, 100, 56, 149, town.roofCell({ h: BAY.rim, wall: 'bay-wall', skirt: null }));
// Its front on the lane, in plaster.
p.rect(9, 100, 56, 101, town.roofCell({ h: BAY.rim, wall: 'adobe-grey' }));
town.circle(BAY.cx, BAY.cy, BAY.r, {
  inside: bayFloor,
  wall: { wall: 'bay-wall', wallTop: BAY.rim, bands: RIBBED },
  seam: 90, // behind the landing
});
// The landing, at street level, and the passage out to the door through
// the wall over it.
p.rect(29, 104, 35, 107, (_, __, c) => ({ ...c, floor: 'bay-floor', floorZ: 0 }));
town.arch(30, 101, 34, 105, { h: BAY.rim, lintel: 4, wall: 'bay-wall', floor: 'bay-floor', light: 144 });
town.door(32, 100, 'N', { h: BAY.rim, tex: 'door-grey', width: 4, tall: 4, wall: 'adobe-grey', jamb: false, opens: true });
// Stairs down to the floor, a step every tile.
for (let k = 0; k < 7; k++) p.rect(30, 107 + k, 34, 108 + k, { ...bayFloor, floorZ: (-(k + 1) * 5) / 8 });
// A maintenance pit in the middle of the floor, where ships set down: 8 by
// 4 tiles and 2 deep, lined in steel, hazard stripes along its lips and two
// steps down at its west end. Off its east end a crawlspace runs on under
// the floor, low and dark, with a shield unit in it: a secret.
const PIT = { x0: 28, y0: 122, x1: 36, y1: 126, floorZ: -7 };
const { bands: _, ...pitLip } = { ...bayFloor, side: 'imp-panel-dark' };
p.rect(PIT.x0 - 1, PIT.y0 - 1, PIT.x1 + 5, PIT.y1 + 1, pitLip);
p.rect(PIT.x0, PIT.y0, PIT.x1, PIT.y1, { ...pitLip, floor: 'imp-grate', floorZ: PIT.floorZ });
p.rect(PIT.x0, PIT.y0, PIT.x0 + 1, PIT.y1, { ...pitLip, floorZ: -5.625 });
p.rect(PIT.x0 + 1, PIT.y0, PIT.x0 + 2, PIT.y1, { ...pitLip, floorZ: -6.25 });
p.rect(PIT.x1, PIT.y0 + 1, PIT.x1 + 4, PIT.y1 - 1, {
  ...pitLip,
  floor: 'imp-grate',
  floorZ: PIT.floorZ,
  secret: true,
  slab: { bottom: BAY.floorZ - 0.2, top: BAY.floorZ, floor: 'bay-floor', ceiling: 'imp-panel-dark', side: 'imp-panel-dark', light: 96 },
});
const pitDecals = [29, 31, 33, 35].flatMap((x) => [
  { x, y: PIT.y0, z: BAY.floorZ - 0.25, face: 'S', tex: 'decal-hazard' },
  { x, y: PIT.y1, z: BAY.floorZ - 0.25, face: 'N', tex: 'decal-hazard' },
]);

// Blast scars: soot round the wall where ships' exhausts and blaster fire
// hit it (degrees round from east, height, picture, size).
const SCARS = [[18, -1.5, 1, 3.5], [52, 1, 2, 2.2], [138, -2, 2, 3], [171, 1.5, 1, 2.4], [206, -1, 2, 3.4], [247, -2, 1, 3], [292, 0, 2, 2.8], [334, 2, 1, 2.2]];
const bayDecals = SCARS.map(([deg, z, k, scale]) => {
  const a = (deg * Math.PI) / 180;
  return { x: BAY.cx + BAY.r * Math.cos(a), y: BAY.cy - BAY.r * Math.sin(a), z, face: 'angled', tex: `grime-scorch-${k}`, scale };
});
// Fittings round the wall (models/bay.js), each turned to face the
// centre: a rib every 30 degrees clear of the landing, a lamp on the rim
// over every other one, and fuel lines down to pumps in four of the bays
// between them.
const onBayWall = (type, deg, z) => {
  const a = (deg * Math.PI) / 180;
  const r = BAY.r - 0.02;
  return at(type, BAY.cx + r * Math.cos(a), BAY.cy - r * Math.sin(a), { z, angle: (deg + 270) % 360 });
};
for (let deg = 15; deg < 360; deg += 30) {
  list.push(onBayWall('bay-rib', deg, BAY.floorZ));
  if (deg % 60 === 15) list.push(onBayWall('bay-rim-lamp', deg, BAY.rim));
}
for (const deg of [30, 150, 240, 300]) list.push(onBayWall('bay-fuel-line', deg, BAY.floorZ), onBayWall('bay-fuel-pump', deg - 5.5, BAY.floorZ));

// Pipes, vents and boxes on the walls (lib/town.js): downpipes off the
// roofs, a tank and a box unit in the alleys, conduits, vents and a fan.
town.pipe(6.5, 63, 'S').pipe(4, 53, 'W').pipe(47.2, 63, 'S').pipe(27.6, 79, 'N').pipe(53, 85.5, 'W');
town.fixture('wall-tank', 14, 56.5, 'E', { z: 3.2 }).fixture('wall-tank', 17, 84.5, 'E', { z: 3 });
town.fixture('wall-unit', 45, 56, 'W', { z: 2.4 }).fixture('wall-unit', 30, 83.5, 'E', { z: 2.2 });
town.fixture('conduit-4', 49.5, 63, 'S', { z: 5.2 }).fixture('conduit-6', 30, 87.5, 'E', { z: 4.6 }).fixture('conduit-3', 57.5, 78, 'N', { z: 4.2 });
town.vent(35.6, 63, 'S', { z: 2.3, tex: 'wall-fan' }).vent(36.4, 63, 'S', { z: 1.5, tex: 'wall-meter' });
town.vent(23, 79, 'N', { z: 1.1, tex: 'vent-slats' }).vent(55.6, 78, 'N', { z: 3.6, tex: 'vent-round' });
town.vent(9, 63, 'S', { z: 4.6, tex: 'vent-grille' });
town.vent(16, 53.5, 'W', { z: 4, tex: 'vent-round' }).vent(28, 55, 'E', { z: 3.4, tex: 'vent-slats' });

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
// Crates, drums, canisters, cargo pods, junk and litter along the walls
// (lib/town.js), clear of where the landspeeder is parked.
const SPEEDER = [55, 65.25];
town.clutter({ keep: [[SPEEDER[0] - 1.6, 63, SPEEDER[0] + 1.6, SPEEDER[1] + 2.4]] });
list.push(...town.things);

// Hand-placed along the main street and on the square (the kit's
// clutter() fills the rest): crates against the porch, canisters by A, a
// stack by D, a cargo pod by F, a vaporator on the square, and the stall's
// counter under its tarp, selling droid parts.
list.push(
  at('canister', 6.85, 63.35, { angle: 10 }), at('canister-rust', 7.35, 63.3, { angle: 40 }),
  at('crate-tan', 18.4, 65.45, { angle: 274 }), at('crate-grey-small', 18.45, 65.4, { z: 0.9, angle: 262 }), at('crate-grey-small', 18.6, 64.45, { angle: 280 }),
  at('crate-rust-long', 48.3, 63.5, { angle: 3 }), at('crate-grey-small', 48.1, 63.45, { z: 0.7, angle: 350 }), at('barrel-rust', 49.6, 64.2),
  at('cargo-pod', 22.3, 78.5, { angle: 176 }), at('canister', 23.45, 78.6),
  at('vaporator', 34.2, 80.4),
  // An X-34 landspeeder pulled up nose first to D's front, east of its porch.
  at('landspeeder', ...SPEEDER, { angle: 92 }),
  at('crate-rust-long', 46.9, 82, { angle: 90 }), at('droid-dome', 46.9, 81.6, { z: 0.7, angle: 200 }), at('crate-grey-small', 46.85, 82.4, { z: 0.7, angle: 85 }),
  at('crate-tan', 49, 81.1, { angle: 95 }), at('barrel-grey', 49.1, 83), at('litter-small', 45, 83, { angle: 40 }),
);

list.push(
  at('player', 32, 134, { angle: 90 }),
  at('supply-crate', 14, 86.5),
  at('shield-unit', 38.5, 124), // secret: the crawlspace off the bay's maintenance pit
  at('jawa', 50, 47), // in the north back lane
);

// Townsfolk (npcs/villagers.js), all five kinds, each strolling up to 5
// tiles from its spot: most on the main street and the square, a few in
// the back lanes and an alley, and some indoors (the shop, B's room, G's).
list.push(
  // The main street.
  at('villager-boy', 9, 73), at('villager-woman', 24, 70), at('villager-wanderer', 33, 67),
  at('villager-adventurer', 46, 71), at('villager-man', 55, 73),
  // The square and the stall.
  at('villager-man', 38, 80), at('villager-woman', 49, 87),
  // The back lanes and the alley between E and F.
  at('villager-woman', 34, 47), at('villager-wanderer', 30, 97), at('villager-adventurer', 18.5, 88),
  // Indoors: the shop, B's room and G's.
  at('villager-boy', 12, 84), at('villager-woman', 22, 56), at('villager-man', 57, 84),
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
  // A torn rag hanging under C's awning, over its shutter.
  { type: 'rag', from: [37.2, 64.75, 2.95], to: [39.8, 64.75, 2.95], length: 0.9 },
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
  // distracted, and Mark halved that twice to 60. 90 on trial (Mark,
  // 2026-10-18).
  weather: { type: 'glint', count: 90 },
  decals: [...town.decals, ...bayDecals, ...pitDecals],
  hangings: [...hangings, ...town.hangings],
  par: 600,
  ...p.build(),
  things: [],
  list,
});
