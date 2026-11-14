import { defineLevel } from '../../engine/defs.js';
import { Painter } from './lib/painter.js';
import { Town } from './lib/town.js';

// MISSION 5: BREAKERS' ROW, CORELLIA. The layout, route and numbers are in
// docs/mission5.md (area numbers below match its table). Painted in code on
// the fine grid (1 tile = 0.5 m; the player is 1.7 tall and 1 wide).
//
// A BLOCKOUT: areas 1 to 3 are laid out; the yard east of x 130 is bare
// ground with blocks standing in for the hauler and the crane (PLAN.md,
// item 12). Textures are stand-ins from the other levels' sets.

const W = 352;
const H = 144;
/** The open sky's height: over the great crane (30). */
const SKY = 40;
/** The overcast day's light. */
const DAY = 168;
/** The harbour's water: runoff that burns. */
const SEA = -4;

// ---- Stand-in textures (the kit is docs/mission5.md's; a CORELLIA set is to come).
const T = {
  quay: 'duracrete',
  seaWall: 'derelict-wall',
  water: 'water-murky',
  street: 'derelict-floor',
  shack: 'metal-rust',
  shackB: 'metal-grey',
  shackC: 'yard-plate-rust',
  roof: 'metal-rust',
  yard: 'yard-plate',
  machine: 'hold-wall',
  guts: 'hold-guts',
  grate: 'hold-floor',
  ceiling: 'hold-ceiling',
  pipes: 'hold-pipes',
  step: 'band-steel',
  door: 'door-grey',
  jamb: 'imp-jamb',
  bars: 'imp-bars',
  railing: 'rail-rust',
  switchOff: 'imp-switch',
  switchOn: 'imp-switch-on',
  hull: 'freighter-hull',
  sky: 'sky-dusk',
};

const p = new Painter(W, H, { wall: T.seaWall });
const kit = new Town(p, { sky: SKY, light: DAY, wall: T.shack, roof: T.roof, floor: T.street, skirt: null });
const lamps = [];
const decals = [];
const at = (type, x, y, extra = {}) => ({ type, x, y, ...extra });

/** Open ground under the sky. */
const ground = (floorZ, floor = T.quay, extra = {}) => kit.street(floorZ, { floor, side: T.seaWall, ...extra });
/** A room indoors: its floor and ceiling heights. */
const room = (floorZ, ceilZ, extra = {}) => ({
  floor: T.grate, ceiling: T.ceiling, floorZ, ceilZ, light: 136, side: T.machine, upper: T.machine, ...extra,
});
/** A door, 4 wide, in a wall 2 thick. */
const door = (floorZ, extra = {}) => ({
  door: T.door, jamb: T.jamb, style: 'rise', floor: T.grate, ceiling: T.ceiling, upper: T.machine,
  floorZ, ceilZ: floorZ + 4, light: 136, ...extra,
});

// ---------------------------------------------------------------- the ground plan
// Everything north of the waterfront is building until something is cut
// into it: the Bottoms west of x 130, the yard's sheds east of it.
p.rect(1, 1, W - 1, 96, kit.roofCell({ h: 12 }));
// The harbour, out to the map's edge.
p.rect(1, 104, W - 1, H - 1, ground(SEA, T.water, { damage: 20, side: T.seaWall }));
// The quay: the waterfront road, west to east under the sea wall and along
// the yard's berths.
p.rect(1, 92, W - 1, 104, ground(0));
// The sea wall, 4 m high, from the west edge to the yard.
kit.block(1, 88, 130, 92, { h: 8, wall: T.seaWall, roof: T.seaWall });

// ---------------------------------------------------------------- 1. Pier 12
// A concrete finger pier, 5 m wide and 18 m long. The Crow sets Kyle down
// at its seaward end; the row and the crane are along the waterfront to
// the east.
p.rect(20, 104, 30, 140, ground(0));
// The gatehouse and the Row's gate: bars across the road, the yard beyond.
kit.block(38, 92, 46, 96, { h: 6, wall: T.shackB });
kit.block(44, 102, 46, 104, { h: 6, wall: T.shackB });
p.fence(45, 96, 46, 102, 'E', { tex: T.bars, height: 4 });
// The quay's west end, closed off by a shed.
kit.block(1, 92, 8, 104, { h: 7, wall: T.shackC });
// The arch through the sea wall into the Bottoms.
kit.arch(22, 88, 28, 92, { h: 8, lintel: 4, wall: T.seaWall, roof: T.seaWall, floor: T.quay, light: 136 });

// 1a. Under the pier (secret 1): steps down the quay's face beside it to a
// boat landing a step over the water.
p.stairs(18, 104, 20, 110, 'N', -3, 0.5, (z) => ground(z, T.quay));
p.rect(16, 110, 20, 124, ground(-3, T.quay));
p.rect(16, 124, 20, 130, ground(-3, T.quay, { secret: true }));

// ---------------------------------------------------------------- 2. The Bottoms
// One crooked street from the arch to the pump house: north, north-east
// on the slant, then east, climbing 3 in all by pairs of steps. Shacks of
// scavenged plate stacked either side (volumes, an alley between two).
const street = (z, extra = {}) => kit.street(z, { light: 144, ...extra });
// Lower street.
p.rect(20, 62, 30, 88, (x, y) => street(y >= 76 ? 0 : y === 75 ? 0.5 : 1));
// The bend: a parallelogram from (30, 62..72) to (60, 46..56), and the
// alley's mouth; the slanted shacks below trim its edges.
const bendZ = (x) => (x < 40 ? 1 : x === 40 ? 1.5 : 2);
p.rect(30, 44, 60, 74, (x, y, old) => {
  const top = 62 - ((x + 0.5 - 30) * 16) / 30;
  return y + 1.5 > top && y - 0.5 < top + 10 ? street(bendZ(x)) : old;
});
// Upper street, toward the crane.
p.rect(60, 46, 96, 56, (x) => street(x < 84 ? 2 : x === 84 ? 2.5 : 3));
// The shacks along the bend, their street sides on the slant.
kit.slanted([[30, 62], [30, 46], [45, 46], [45, 54]], { h: 9, wall: T.shack });
kit.slanted([[48, 53], [48, 44], [60, 44], [60, 46]], { h: 7, wall: T.shackB });
kit.slanted([[30, 72], [45, 64], [45, 80], [30, 80]], { h: 11, wall: T.shackC });
kit.slanted([[45, 64], [60, 56], [60, 72], [45, 72]], { h: 8, wall: T.shackB });
// The rest, in different heights and plates, storeys set back on top.
kit.house(8, 60, 20, 88, { h: 10, wall: T.shackB, tiers: [{ box: [8, 64, 16, 80], h: 14 }] });
kit.house(30, 80, 46, 88, { h: 6, wall: T.shack });
kit.house(8, 40, 30, 60, { h: 13, wall: T.shackC, tiers: [{ box: [10, 42, 24, 54], h: 17 }] });
kit.house(60, 30, 70, 46, { h: 10, wall: T.shackC, tiers: [{ box: [60, 32, 68, 42], h: 15 }] });
kit.house(76, 34, 96, 46, { h: 8, wall: T.shack, tiers: [{ box: [80, 34, 92, 42], h: 13 }] });
kit.house(60, 56, 70, 70, { h: 9, wall: T.shack });
kit.house(76, 56, 96, 68, { h: 11, wall: T.shackB, tiers: [{ box: [78, 60, 90, 68], h: 16 }] });
// The lower street's sides and the block shut in the street's end.
p.rect(20, 60, 30, 62, kit.roofCell({ h: 13, wall: T.shackC }));
// The ore conveyor: a covered bridge on trestles over the upper street,
// from the works inland to the sea wall.
kit.block(70, 8, 76, 46, { h: 10, wall: T.shackB });
kit.block(70, 56, 76, 88, { h: 10, wall: T.shackB });
p.rect(70, 46, 76, 56, (x, y, old) => ({ ...old, slab: { bottom: 8, top: 10, floor: T.roof, ceiling: T.shackB, side: T.shackB, light: 120 } }));
// The alley between the two north shacks, and the yard behind them
// (secret 2): a crate, a lean-to's roof, a ledge, a back room.
p.rect(45, 44, 48, 54, street(2, { light: 120 }));
p.rect(42, 36, 52, 44, street(2, { light: 120 }));
kit.block(50, 36, 52, 38, { h: 3.2, wall: T.shackC });
kit.block(46, 36, 50, 38, { h: 4.4, wall: T.shack });
kit.block(42, 36, 46, 38, { h: 5.6, wall: T.shackB });
p.rect(40, 30, 48, 36, street(5.6, { light: 136, secret: true }));

// ---------------------------------------------------------------- 3. Pump house and pipe gallery
// The pump house shuts the street's end, the yard's wall behind it. Four
// pumps on the floor, a walk 3 up round the north and east walls, the
// sluice's switch at its end. Under the walk, stairs go down east to the
// gallery's door, seen shut from the floor.
const PUMP = 3;
kit.block(96, 36, 130, 62, { h: 13, wall: T.seaWall, roof: T.roof });
p.rect(98, 40, 124, 58, room(PUMP, PUMP + 6));
// (A door wants solid wall at its jambs, not a building's raised floor.)
p.rect(96, 48, 98, 54, { wall: T.seaWall });
p.rect(96, 49, 98, 53, door(PUMP, { upper: T.seaWall }));
for (const [x, y] of [[104, 44], [114, 44], [104, 54], [114, 54]]) p.rect(x, y, x + 4, y + 4, { wall: T.guts });
// The walk: stairs up the north wall from the door's end, then a grate
// deck to a plinth in the south-east corner.
const walk = room(PUMP, PUMP + 6, { slab: { bottom: PUMP + 2.5, top: PUMP + 3, floor: T.grate, ceiling: T.grate, side: T.step, light: 120 } });
p.stairs(98, 40, 104, 43, 'E', PUMP + 0.5, 0.5, (z) => room(z, PUMP + 6, { side: T.step }));
p.rect(104, 40, 124, 43, walk).rect(121, 43, 124, 54, walk);
p.rect(121, 54, 124, 58, room(PUMP + 3, PUMP + 6, { side: T.machine }));
p.fence(104, 42, 121, 43, 'S', { tex: T.railing, height: 1 }).fence(121, 43, 122, 54, 'W', { tex: T.railing, height: 1 });
p.rect(122, 58, 123, 59, {
  wall: T.switchOff,
  switchTo: T.switchOn,
  use: [{ action: 'openDoors', tag: 'sluice' }, { action: 'message', text: 'SLUICE GATE OPEN. PIPE GALLERY DRAINED.' }],
});
// The stairs down: 16 steps of 0.5 from the pump floor to the gallery,
// 5 under the yard, the roof stepping down with them.
const GALLERY = -5;
p.rect(124, 47, 126, 51, room(PUMP, PUMP + 4));
p.stairs(126, 47, 142, 51, 'E', PUMP - 0.5, -0.5, (z) => room(z, z + 4.5, { light: 112, side: T.step }));
p.rect(142, 46, 144, 52, { wall: T.machine });
p.rect(142, 47, 144, 51, door(GALLERY, { lock: 'remote', tag: 'sluice', stayOpen: true, ceilZ: GALLERY + 3.5, light: 112 }));
// The gallery: east, then south under the yard to Berth 1's slip. Under
// the open yard it's the lower storey of the ground (a slab).
const gallery = (extra = {}) => room(GALLERY, GALLERY + 3.5, { light: 112, ceiling: T.pipes, ...extra });
p.rect(144, 47, 152, 51, gallery());
p.rect(148, 51, 152, 56, gallery());

// ---------------------------------------------------------------- the yard (stand-in)
// Bare ground east of the yard's wall, and blocks where the hauler and
// the great crane's legs will stand, to judge the haze and the skyline.
p.rect(130, 56, W - 1, 92, ground(0, T.yard));
const under = (bottom) => ground(GALLERY, T.grate, { slab: { bottom, top: 0, floor: T.yard, ceiling: T.pipes, side: T.machine, light: 112 } });
p.rect(148, 56, 152, 80, under(GALLERY + 3.5));
// (Blockout: the level ends at the gallery's end until Berth 1 is built.)
p.rect(148, 78, 152, 80, under(GALLERY + 3.5));
p.rect(148, 78, 152, 80, (x, y, old) => ({ ...old, exit: true }));
// A fallen pipe across the gallery: crouch under it.
p.rect(148, 62, 152, 68, under(GALLERY + 1.2));
kit.block(206, 60, 262, 92, { h: 17, wall: T.hull, roof: T.hull });
kit.block(298, 92, 308, 104, { h: 30, wall: T.step, roof: T.step });
kit.block(298, 54, 308, 62, { h: 30, wall: T.step, roof: T.step });

// The sky comes down to the roofline beside every solid wall (the map's
// edge). No shadows: the day is overcast.
kit.seal();

const list = [
  // 1. The pier's seaward end, facing the sea wall.
  at('player', 25, 136, { angle: 90 }),
  // Two dock troopers at the pier's head, and one in the pump house: the
  // first of the fights (the rest come with the fights' step, PLAN.md).
  at('stormtrooper', 23.5, 99.5, { angle: 270 }), at('stormtrooper', 27.5, 96.5, { angle: 270 }),
  at('stormtrooper', 110.5, 50.5, { angle: 180 }),
  at('energy-cell', 36.5, 100.5), at('energy-cell', 62.5, 54.5), at('med-kit', 100.5, 56.5),
  // Secret 1 and 2.
  at('shield-unit', 18, 127), at('energy-pack', 44, 33),
];

export default defineLevel({
  id: 'm5',
  mapLabel: 'M5',
  name: "BREAKERS' ROW",
  music: 'station',
  sky: T.sky,
  skyWrap: 1,
  // Smog: the far end of the row is a shape in yellow-grey air.
  haze: { color: [150, 142, 112], half: 44 },
  par: 660,
  ...p.build(),
  lights: lamps,
  decals: [...decals, ...kit.decals],
  hangings: [...kit.hangings],
  things: [],
  list: [...list, ...kit.things],
  triggers: [
    { on: 'start', do: [{ action: 'message', text: "JAN: BREAKERS' ROW. FOUR BERTHS, AND THE BIG CRANE OVER THE LAST ONE. THE FRONT GATE'S IMPERIAL: GO ROUND, THROUGH THE BOTTOMS." }] },
  ],
});
