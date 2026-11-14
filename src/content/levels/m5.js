import { defineLevel } from '../../engine/defs.js';
import { Painter } from './lib/painter.js';
import { Town } from './lib/town.js';
import { FREIGHTER } from '../models/freighter.js';

// MISSION 5: BREAKERS' ROW, CORELLIA. The layout, route and numbers are in
// docs/mission5.md (area numbers below match its table). Painted in code on
// the fine grid (1 tile = 0.5 m; the player is 1.7 tall and 1 wide).
//
// A BLOCKOUT: areas 1 to 6 are laid out; east of the hauler the yard is
// bare ground with blocks standing in for the crane's legs (PLAN.md, item
// 12). Textures are stand-ins from the other levels' sets.

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
/**
 * A door with the sky on one side: the wall over it is a slab up to the
 * roof at `top`, as an arch's is. (A plain door there is a solid wall to
 * seal(), which brings the sky down to the floor beside it.)
 */
const skyDoor = (floorZ, top, extra = {}) => kit.street(floorZ, {
  floor: T.grate, side: T.machine, door: `${T.door}-rising`, style: 'rise',
  slab: { bottom: floorZ + 4, top, floor: T.roof, ceiling: T.machine, side: T.machine, light: 136 }, ...extra,
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
p.rect(96, 49, 98, 53, skyDoor(PUMP, 13, { light: 144, side: T.seaWall }));
for (const [x, y] of [[104, 44], [114, 44], [104, 54], [114, 54]]) p.rect(x, y, x + 4, y + 4, { wall: T.guts });
// The walk: stairs up the west wall beside the door, then a grate deck
// along the north and east walls to a plinth in the south-east corner.
const walk = room(PUMP, PUMP + 6, { slab: { bottom: PUMP + 2.5, top: PUMP + 3, floor: T.grate, ceiling: T.grate, side: T.step, light: 120 } });
p.stairs(98, 43, 101, 49, 'N', PUMP + 0.5, 0.5, (z) => room(z, PUMP + 6, { side: T.step }));
p.rect(98, 40, 124, 43, walk).rect(121, 43, 124, 54, walk);
p.rect(121, 54, 124, 58, room(PUMP + 3, PUMP + 6, { side: T.machine }));
p.fence(101, 42, 121, 43, 'S', { tex: T.railing, height: 1 }).fence(121, 43, 122, 54, 'W', { tex: T.railing, height: 1 });
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
p.rect(148, 56, 152, 79, under(GALLERY + 3.5));
// A fallen pipe across the gallery: crouch under it.
p.rect(148, 62, 152, 68, under(GALLERY + 1.2));

// ---------------------------------------------------------------- 4. Berth 1: the light freighter
// Mission 1's gutted freighter on the slip, nose west: the model is its
// outside (models/freighter.js), the tiles inside it its hold. The
// gallery runs on under its nose and its steps come up through the deck
// where the plates are gone; the stern hatch opens east onto the yard.
const HOLD = { x: 157, y: 83.5, h: 5, ceil: 3.25 };
const HULL = { wall: T.hull, roof: T.hull, skirt: null };
kit.house(148, 79, 166, 88, { h: HOLD.h, r: 2, ...HULL });
kit.room(150, 80, 164, 87, { h: HOLD.h, ceilZ: HOLD.ceil, floor: T.grate, ceiling: T.ceiling, wall: T.guts, light: 96 });
p.rect(148, 79, 167, 88, (x, y, c) => (c.side === T.hull && c.floorZ > 0 ? { ...c, side: T.machine } : c));
// Where the hull's plating is gone the hold is open behind it, and the
// sky shows through the hole in its roof (as Mission 1's).
{
  const holdSlab = p.get(156, 83).slab;
  for (const [x0, x1, z0, , side] of FREIGHTER.windows) {
    const y = side < 0 ? 79 : 87;
    for (let x = HOLD.x + x0; x < HOLD.x + x1; x++) p.set(x, y, { ...p.get(x, y), floorZ: z0, side: T.machine, slab: { ...holdSlab, side: T.machine }, light: 96 });
  }
  const [sx0, sx1, sy0, sy1] = FREIGHTER.skylight;
  p.rect(HOLD.x + sx0, HOLD.y + sy0, HOLD.x + sx1, HOLD.y + sy1, (x, y, c) => ({ ...c, slab: undefined, ceilZ: SKY, light: 140 }));
}
kit.arch(164, 81, 165, 86, { h: HOLD.h, lintel: 3, wall: T.machine, floor: T.grate });
kit.door(166, 83.5, 'E', { h: HOLD.h, tex: T.door, width: 5, opens: true, jamb: false, sign: false, panel: false, step: false, wall: T.hull });
p.rect(165, 81, 166, 86, (x, y, c) => ({ ...c, floor: T.grate }));
// The gallery's end under the freighter's nose, and ten steps up through
// the hold's deck along its north side.
p.rect(150, 79, 152, 80, (x, y, c) => ({ ...c, floor: T.grate, floorZ: GALLERY, slab: { bottom: GALLERY + 3.5, top: c.floorZ, floor: T.hull, ceiling: T.pipes, side: T.machine, light: 112 } }));
p.rect(150, 80, 160, 82, (x, y, c) => ({ ...c, floor: T.step, floorZ: Math.min(0, GALLERY + (x - 150) * 0.5), side: T.guts }));

// ---------------------------------------------------------------- 5. the cutting floor
// Between the freighter and the hauler: hull plates in stacks lying at
// angles (cover, and steps onto the low ones), a cutting lane sunk a
// step, the foreman's shed and the furnace along the north side.
const stack = (points, h) => kit.slanted(points, { h, wall: T.shackC, roof: T.yard, skirt: null });
stack([[174, 72], [182, 68], [184, 72], [176, 76]], 2);
stack([[186, 80], [196, 82], [195, 86], [185, 84]], 1);
stack([[176, 88], [182, 85], [184, 89], [178, 92]], 1.5);
kit.block(190, 62, 198, 66, { h: 3, wall: T.shackC, roof: T.yard });
kit.block(192, 62, 196, 66, { h: 4, wall: T.shackC, roof: T.yard });
p.rect(188, 70, 202, 76, (x) => ground(x === 188 || x === 201 ? -0.5 : -1, T.yard, { light: 152 }));
// The foreman's shed, its door to the south.
kit.house(176, 56, 186, 64, { h: 5, wall: T.shackB });
kit.room(177, 57, 185, 63, { h: 5, ceilZ: 3.5, floor: T.grate, ceiling: T.ceiling, wall: T.shackB, light: 136 });
kit.arch(180, 63, 183, 64, { h: 5, lintel: 3, wall: T.shackB, floor: T.grate });
// The furnace's block (the model and its glow come with the dressing).
kit.block(198, 56, 206, 62, { h: 8, wall: T.seaWall, roof: T.roof });

// ---------------------------------------------------------------- 6. Berth 2: the bulk hauler
// Cut across at x 206, stern east. Forward (206..240) the hold under the
// crew deck; aft (242..260) the reactor room under the bridge. A tile
// holds two storeys, so the ship is never three decks over one tile
// (docs/mission5.md, engine notes).
const DECK = 6;
const DECK_CEIL = 9.5;
const BRIDGE = 12;
// The hull: forward 11 high, the superstructure aft 17.
kit.block(206, 60, 240, 92, { h: 11, ...HULL });
kit.block(240, 60, 262, 92, { h: 17, ...HULL });
// 6a, 6c. The hold (0 to 5) and the crew deck over it (6 to 9.5), walls
// either side with the cabins behind them.
const hold = (extra = {}) => room(0, DECK_CEIL, {
  light: 104, upper: T.machine, slab: { bottom: 5, top: DECK, floor: T.grate, ceiling: T.ceiling, side: T.step, light: 88 }, ...extra,
});
p.rect(208, 66, 240, 86, { wall: T.machine });
p.rect(208, 68, 240, 84, hold());
// The cut face: the crew deck is cut back two tiles, the hull's roof
// still over them, so the yard looks into both decks.
p.rect(206, 68, 208, 84, ground(0, T.grate, { ceilZ: 11.25, light: 120, side: T.machine, slab: { bottom: DECK_CEIL, top: 11, floor: T.hull, ceiling: T.ceiling, side: T.hull, light: 120 } }));
// The crew deck has fallen into the hold along the north side.
p.rect(222, 68, 232, 76, room(0, DECK_CEIL, { light: 88 }));
// Deck plates gone over the bilge: runoff 2.25 down, two steps out.
for (const [x0, y0, x1, y1] of [[214, 78, 220, 82], [228, 70, 234, 73]]) {
  p.rect(x0, y0, x1, y1, (x, y, c) => ({ ...c, floorZ: -2.25, floor: T.water, side: T.guts }));
  p.rect(x0, y0, x0 + 1, y1, (x, y, c) => ({ ...c, floorZ: -0.75, floor: T.step }));
  p.rect(x0 + 1, y0, x0 + 2, y1, (x, y, c) => ({ ...c, floorZ: -1.5, floor: T.step }));
}
// The cargo lift at the cut face, hold to crew deck: dead until the
// reactor runs (the triggers call it).
p.rect(208, 74, 212, 78, room(0, DECK_CEIL, { floor: 'lift-floor', light: 104, side: T.step, tag: 'cargo-lift', lift: { stops: [0, DECK], wait: 3, on: [] } }));
// Where the squad comes in when the power's on.
for (const [x, y] of [[214, 70], [218, 82], [226, 80], [236, 70]]) p.set(x, y, { ...p.get(x, y), tag: 'hold-squad' });
// Secret 3: a smuggler's hold behind a loose panel in the south wall.
p.rect(234, 86, 240, 90, room(0, 2.5, { light: 96, secret: true }));
p.rect(236, 84, 238, 86, door(0, { door: T.guts, jamb: T.machine, ceilZ: 2.5, light: 96 }));
// Cabins off the crew deck: two a side, a door each in the hold's walls.
for (const [x0, x1] of [[210, 220], [222, 230]]) {
  for (const [y0, y1, wy] of [[62, 66, 66], [86, 90, 84]]) {
    if (y0 === 86 && x0 === 222) continue; // (the smuggler's hold is under this one's place)
    p.rect(x0, y0, x1, y1, room(DECK, DECK_CEIL, { light: 120 }));
    p.rect(x0 + 3, wy, x0 + 5, wy + 2, door(DECK, { ceilZ: DECK + 2.5, light: 120 }));
  }
}
// 6d. The way aft: a passage in the last cabin's place on the north
// side, a door through the bulkhead, and the stair up the hull's side
// to the bridge deck, the plating gone beside it.
p.rect(232, 62, 240, 66, room(DECK, DECK_CEIL, { light: 120 }));
p.rect(234, 66, 238, 68, door(DECK, { ceilZ: DECK + 3, light: 120 }));
p.rect(240, 61, 242, 67, { wall: T.machine });
p.rect(240, 62, 242, 66, skyDoor(DECK, 17));
kit.stair(242, 62, 260, 66, { up: 'E', top: BRIDGE, from: DECK, floor: T.grate, side: T.machine });
// (3 over each step: the sky comes down to the roofline beside the
// bulkhead's walls, and a body needs its head room under it.)
p.rect(242, 60, 254, 62, (x) => kit.roofCell({ h: Math.min(17, DECK + (x - 241) * 0.5 + 3), ...HULL }));
// 6b. The bulkhead and the reactor room behind it: a walk at 0 round a
// pit 2 deep, the reactor in it (to come), the start switch in the south
// wall. Its roof is the bridge's deck.
p.rect(240, 67, 242, 92, { wall: T.machine });
p.rect(240, 74, 242, 78, door(0, { light: 96 }));
// (Its north wall is a run of the hull, not solid wall: the stair's
// landing is beside it, and the sky would come down on it.)
kit.room(242, 68, 260, 86, { h: BRIDGE, floorZ: 0, ceilZ: 11, floor: T.grate, ceiling: T.pipes, wall: T.machine, roof: T.grate, light: 96 });
p.rect(245, 71, 257, 83, (x, y, c) => ({ ...c, floorZ: -2, side: T.guts }));
// Four steps down into the pit from the walk's west side.
p.rect(245, 75, 249, 79, (x, y, c) => ({ ...c, floorZ: -0.5 * (x - 244), floor: T.step }));
p.rect(250, 86, 252, 87, {
  wall: T.switchOff,
  switchTo: T.switchOn,
  use: [
    { action: 'setFlag', flag: 'power' },
    { action: 'setLight', tag: 'hauler-lamps', light: 80, lightFx: 'flicker', lightMin: 24 },
    { action: 'spawn', thing: 'stormtrooper', tag: 'hold-squad' },
    { action: 'message', text: "REACTOR START. SHIP'S POWER RESTORED: LIGHTING, CARGO LIFT." },
  ],
});
// 6e. The bridge, on the reactor room's roof: its own roof gone, its
// windows gone east and south (sills a step high in the hull's wall).
kit.arch(255, 66, 259, 68, { h: 17, lintel: 3, floorZ: BRIDGE, wall: T.hull, roof: T.hull, floor: T.grate });
p.rect(260, 70, 262, 84, kit.roofCell({ h: BRIDGE + 1, ...HULL }));
p.rect(244, 86, 250, 92, kit.roofCell({ h: BRIDGE + 1, ...HULL }));
// The door in its south wing, onto the gangway to the crane way.
kit.arch(252, 86, 256, 92, { h: 17, lintel: 3, floorZ: BRIDGE, wall: T.hull, roof: T.hull, floor: T.grate });
// (Blockout: the level ends here until the crane way is built.)
p.rect(252, 90, 256, 92, (x, y, c) => ({ ...c, exit: true }));
// The ship's lamps: dark until the reactor runs.
for (const [x, y, z] of [[214, 76, 4.5], [226, 80, 4.5], [236, 72, 4.5], [216, 72, 9], [236, 80, 9], [251, 70, 9], [251, 84, 9]]) {
  lamps.push({ x, y, z, radius: 7, light: 8, tag: 'hauler-lamps' });
}
kit.block(298, 92, 308, 104, { h: 30, wall: T.step, roof: T.step });
kit.block(298, 54, 308, 62, { h: 30, wall: T.step, roof: T.step });

// A room indoors (a ceiling, not the sky) inside a building shows from
// outside as a wall up to the sky, wherever something looks over the
// building's roof into it. So every tile of building next to one becomes
// solid wall: the sky comes down to the roofline beside a wall (seal()),
// and the view over the roof ends there. Buildings round a room are two
// tiles thick, so their outer faces stay.
{
  const indoors = (c) => c && !c.wall && !c.door && c.ceiling !== 'sky';
  const walls = [];
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const c = p.get(x, y);
      if (c.wall || c.door || c.slab || c.line || c.ceiling !== 'sky') continue;
      if (indoors(p.get(x + 1, y)) || indoors(p.get(x - 1, y)) || indoors(p.get(x, y + 1)) || indoors(p.get(x, y - 1))) walls.push([x, y]);
    }
  }
  for (const [x, y] of walls) p.set(x, y, { wall: T.machine });
}
// The sky comes down to the roofline beside every solid wall (and the
// map's edge). No shadows: the day is overcast.
kit.seal();

const list = [
  // 1. The pier's seaward end, facing the sea wall.
  at('player', 25, 136, { angle: 90 }),
  // Two dock troopers at the pier's head, and one in the pump house: the
  // first of the fights (the rest come with the fights' step, PLAN.md).
  at('stormtrooper', 23.5, 99.5, { angle: 270 }), at('stormtrooper', 27.5, 96.5, { angle: 270 }),
  at('stormtrooper', 110.5, 50.5, { angle: 180 }),
  at('energy-cell', 36.5, 100.5), at('energy-cell', 62.5, 54.5), at('med-kit', 100.5, 56.5),
  // Berth 1 to the hauler: one searching the freighter, two on the
  // cutting floor, one in the reactor room.
  at('stormtrooper', 161.5, 84.5, { angle: 180 }),
  at('stormtrooper', 186.5, 68.5, { angle: 180 }), at('stormtrooper', 198.5, 88.5, { angle: 180 }),
  at('stormtrooper', 250.5, 69.5, { angle: 180 }),
  at('freighter', HOLD.x, HOLD.y, { angle: 0, lit: DAY }),
  at('energy-cell', 181, 60), at('med-kit', 243.5, 84.5), at('energy-pack', 237, 88.5),
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
    // The hauler's cargo lift: dead until the reactor runs.
    { on: 'enter', tag: 'cargo-lift', unless: 'power', once: false, do: [{ action: 'message', text: 'CARGO LIFT: NO POWER.' }] },
    { on: 'enter', tag: 'cargo-lift', if: 'power', once: false, do: [{ action: 'lift', tag: 'cargo-lift' }] },
    { on: 'start', do: [{ action: 'message', text: "JAN: BREAKERS' ROW. FOUR BERTHS, AND THE BIG CRANE OVER THE LAST ONE. THE FRONT GATE'S IMPERIAL: GO ROUND, THROUGH THE BOTTOMS." }] },
  ],
});
