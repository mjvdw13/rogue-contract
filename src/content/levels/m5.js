import { defineLevel } from '../../engine/defs.js';
import { Painter } from './lib/painter.js';
import { Town } from './lib/town.js';
import { FREIGHTER } from '../models/freighter.js';

// MISSION 5: BREAKERS' ROW, CORELLIA. The layout, route and numbers are in
// docs/mission5.md (area numbers below match its table). Painted in code on
// the fine grid (1 tile = 0.5 m; the player is 1.7 tall and 1 wide).
//
// A BLOCKOUT: every area is laid out and the route runs from the pier to
// the apron (PLAN.md, item 12). The outdoor textures are Corellia's own
// (derive.mjs, CORELLIA); the rest are stand-ins from the other levels'
// sets. The great crane's legs are tiles; its top is a model.

const W = 352;
const H = 144;
/** The open sky's height: over the great crane (30). */
const SKY = 40;
/** The overcast day's light. */
const DAY = 168;
/** The harbour's water: runoff that burns. */
const SEA = -4;

// ---- Textures (the kit is docs/mission5.md's).
const T = {
  quay: 'quay',
  seaWall: 'sea-wall',
  dock: 'dock-floor',
  dockWall: 'dock-wall',
  water: 'harbour-water',
  street: 'derelict-floor',
  shack: 'shack-plate',
  shackB: 'shack-grey',
  shackC: 'shack-tin',
  roof: 'metal-rust',
  yard: 'slag',
  machine: 'hold-wall',
  guts: 'hold-guts',
  grate: 'hold-floor',
  ceiling: 'hold-ceiling',
  pipes: 'hold-pipes',
  step: 'band-steel',
  crane: 'crane-yellow',
  hullCut: 'hull-section',
  boxA: 'shack-green',
  boxB: 'shack-shutter',
  door: 'door-grey',
  jamb: 'imp-jamb',
  bars: 'imp-bars',
  railing: 'rail-rust',
  switchOff: 'imp-switch',
  switchOn: 'imp-switch-on',
  hull: 'freighter-hull',
  sky: 'sky-corellia',
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
// The four pumps: a plinth each, the tank on it (the dressing's).
const PUMPS = [[104, 44], [114, 44], [104, 54], [114, 54]];
for (const [x, y] of PUMPS) p.rect(x, y, x + 4, y + 4, room(PUMP + 2, PUMP + 6, { floor: T.step, side: T.guts }));
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
const stack = (points, h) => kit.slanted(points, { h, wall: T.hullCut, roof: T.hull, skirt: null });
stack([[174, 72], [182, 68], [184, 72], [176, 76]], 2);
stack([[186, 80], [196, 82], [195, 86], [185, 84]], 1);
stack([[176, 88], [182, 85], [184, 89], [178, 92]], 1.5);
kit.block(190, 62, 198, 66, { h: 3, wall: T.hullCut, roof: T.hull });
kit.block(192, 62, 196, 66, { h: 4, wall: T.hullCut, roof: T.hull });
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
// The ship's lamps: dark until the reactor runs.
for (const [x, y, z] of [[214, 76, 4.5], [226, 80, 4.5], [236, 72, 4.5], [216, 72, 9], [236, 80, 9], [251, 70, 9], [251, 84, 9]]) {
  lamps.push({ x, y, z, radius: 7, light: 8, tag: 'hauler-lamps' });
}
// The only way past the hauler is through it: a shed along its north
// side, a winch house across the quay at its stern.
kit.block(206, 56, 262, 60, { h: 10, wall: T.shackB });
kit.block(244, 92, 250, 104, { h: 8, wall: T.shackC });

// ---------------------------------------------------------------- 7. the crane way
// A crane rail on trestles along the quay, 12 up, from the bridge's
// gangway to the great crane's leg: a grate deck 2 m wide over the quay,
// the water beyond its south rail. A gap three tiles long to jump; a
// hoist back up for anyone who falls.
const RAIL = 12;
const way = ground(0, T.quay, { slab: { bottom: RAIL - 0.5, top: RAIL, floor: T.grate, ceiling: T.grate, side: T.step, light: DAY } });
const wayRail = { tex: T.railing, height: 0.75 };
p.rect(252, 92, 256, 96, way);
p.rect(252, 96, 298, 100, way);
p.rect(276, 96, 279, 100, ground(0));
p.fence(252, 92, 253, 96, 'W', wayRail).fence(255, 92, 256, 96, 'E', wayRail);
p.fence(256, 96, 298, 97, 'N', wayRail).fence(252, 99, 298, 100, 'S', wayRail).fence(252, 96, 253, 100, 'W', wayRail);
// The hoist, beside the rail west of the gap. (A lift can't hold a slab:
// the rail's south fence is open where it comes up.)
p.rect(266, 100, 270, 102, ground(0, 'lift-floor', { side: T.step, lift: { stops: [0, RAIL], wait: 3 } }));
p.rect(266, 99, 270, 100, way);
// 7a. Berth 3, under the rail's north side: a hull down to its keel
// and ribs (models to come). Secret 4 is on the keel.
p.rect(266, 76, 297, 78, ground(0.5, T.hullCut, { side: T.hullCut }));
p.rect(280, 76, 284, 78, ground(0.5, T.hullCut, { side: T.hullCut, secret: true }));
// A slip into the water, the way out of the harbour at this end.
p.stairs(284, 104, 288, 112, 'S', -0.5, -0.5, (z) => ground(z));

// ---------------------------------------------------------------- 8. the great crane's cab
// The crane's legs (its top is models/crane.js), the cab in the
// south one at the rail's height: the dock officer and the red keycard,
// a window east over the dry dock, a lift down its north side.
kit.block(298, 92, 308, 104, { h: 30, wall: T.crane, roof: T.step });
kit.block(298, 54, 308, 60, { h: 30, wall: T.crane, roof: T.step });
kit.room(299, 93, 307, 103, { h: 30, floorZ: RAIL, ceilZ: RAIL + 4, floor: T.grate, ceiling: T.ceiling, wall: T.crane, roof: T.step, light: 152 });
kit.arch(298, 96, 299, 100, { h: 30, lintel: 3, floorZ: RAIL, wall: T.crane, roof: T.step, floor: T.grate });
p.rect(307, 95, 308, 101, (x, y, c) => ({ ...p.get(306, 98), floorZ: RAIL + 1, side: T.step }));
kit.arch(300, 92, 304, 93, { h: 30, lintel: 3, floorZ: RAIL, wall: T.crane, roof: T.step, floor: T.grate });
p.rect(300, 88, 304, 92, ground(RAIL, 'lift-floor', { side: T.step, lift: { stops: [RAIL, 0], wait: 3 } }));

// ---------------------------------------------------------------- 9. Berth 4: the dry dock
// Long axis north to south: the floor 7.5 down, its west and east sides
// stepping down in two terraces 4 wide, the head wall sheer at the north
// end, the caisson and the sea at the south. Flights run along the west
// terraces at opposite ends, so the walk down is a zigzag.
const DOCK = -7.5;
const dock = (z) => ground(z, T.dock, { light: 152, side: T.dockWall });
p.rect(312, 60, 342, 100, dock(-2.5));
p.rect(316, 60, 338, 100, dock(-5));
p.rect(320, 60, 334, 100, dock(DOCK));
p.stairs(312, 96, 314, 100, 'S', -2, 0.5, dock);
p.rect(314, 60, 316, 66, (x, y) => dock(Math.max(-5, -3 - (65 - y) * 0.5)));
p.rect(318, 94, 320, 100, (x, y) => dock(Math.max(DOCK, -5.5 - (y - 94) * 0.5)));
// Keel blocks down the middle (the crates and the shuttle stand on the
// floor between them).
for (let y = 66; y < 96; y += 6) p.rect(326, y, 328, y + 2, dock(DOCK + 1));
// The dock's head: a building across its north end, the dispatch office
// in it at the floor's height behind the red door.
kit.block(308, 56, 346, 60, { h: 6, wall: T.seaWall });

// ---------------------------------------------------------------- 10. dispatch office and the apron
p.rect(324, 58, 330, 60, { wall: T.machine });
p.rect(325, 58, 329, 60, skyDoor(DOCK, 6, { lock: 'red' }));
p.rect(320, 46, 334, 58, room(DOCK, DOCK + 4, { light: 144 }));
// The manifest's terminal, in the north wall.
p.rect(325, 45, 327, 46, {
  wall: T.switchOff,
  switchTo: T.switchOn,
  use: [
    { action: 'setFlag', flag: 'manifest' },
    { action: 'message', text: "MANIFEST: REACTOR CORES, 40. HULL ALLOY, 600 TONNES. CONSIGNEE: 'ARC HAMMER'. NO PORT GIVEN." },
    { action: 'sound', id: 'alarm-klaxon' },
    { action: 'spawn', thing: 'bossk', tag: 'bossk-spot', wake: false, fog: false, angle: 270 },
    { action: 'spawn', thing: 'stormtrooper', tag: 'apron-squad', wake: false, fog: false, angle: 270 },
  ],
});
// Its lift up to the apron, and the apron: the pickup spot.
p.rect(330, 42, 334, 46, room(DOCK, 4, { floor: 'lift-floor', side: T.step, lift: { stops: [DOCK, 0], wait: 3 } }));
kit.arch(330, 40, 334, 42, { h: 12, lintel: 4, floor: T.quay });
p.rect(314, 22, 344, 40, ground(0));
p.rect(323, 25, 333, 33, (x, y, c) => ({ ...c, tag: 'crow' }));
/** The Crow's way in: from high over the dock's east side, round and down onto the spot, nose west. */
const CROW_IN = [[344, 50, 36, 135, 0], [338, 34, 16, 160, 4], [328, 29, 0, 180, 3.5]];
p.set(318, 30, { ...p.get(318, 30), tag: 'bossk-spot' });
for (const [x, y] of [[322, 36], [338, 34], [340, 26]]) p.set(x, y, { ...p.get(x, y), tag: 'apron-squad' });

// ================================================================ DRESSING
// Area by area (PLAN.md, item 12). Things with a purpose, and Star Wars:
// glow rods, landing clamps, droids, pods, repulsor craft, Aurebesh.
const dress = [];
/** A lit glow-rod pylon and its pool of light, or a dead one. */
const pylon = (x, y, z = 0, lit = true) => {
  dress.push(at(lit ? 'lamp-post' : 'lamp-post-dead', x, y));
  if (lit) lamps.push({ x, y, z: z + 4.4, radius: 5, light: 64 });
};

// ---------------------------------------------------------------- 1. the pier and the quay
// The pier: pylons down its sides (one dead), landing clamps where a ship
// is tied down, and a cargo skiff left at the quay's west end.
pylon(20.9, 108); pylon(29.1, 120); pylon(20.9, 132); pylon(29.1, 108, 0, false);
for (const [x, y] of [[21, 138.5], [29, 138.5], [21, 126], [29, 126], [15, 103.2], [35, 103.2]]) dress.push(at('bollard', x, y, { angle: 90 }));
dress.push(at('cargo-skiff', 13, 97, { angle: 0 }));
// Freight waiting on the gate, a power droid left standing by it; the
// Imperials' own gear at the bars: a floodlight and a barricade.
dress.push(
  at('cargo-pod', 33.5, 93.6, { angle: 0 }), at('canister', 35.6, 93.5), at('canister-rust', 36.4, 94.4),
  at('power-droid-rust', 37.2, 98.5, { angle: 180 }),
  at('floodlight-tower-worn', 43.6, 96.9, { angle: 180 }), at('barricade-worn', 41.5, 100.6, { angle: 90 }),
);
kit.door(38, 94, 'W', { h: 6, tex: 'door-grey', wall: T.shackB, jamb: false });
kit.pipe(12, 92, 'S').pipe(31, 92, 'S');
kit.fixture('conduit-10', 15, 92, 'S', { z: 5 });
// The Bottoms' name over the arch, lit.
decals.push({ x: 25, y: 92, z: 5.6, face: 'S', tex: 'sign-bottoms' });

// ---------------------------------------------------------------- 2. the Bottoms
// Lower street. West side: a door, a lean-to with a flue beside it,
// windows over. East side: the shuttered droid shop under the lit sign,
// its power unit, a dead astromech and a dome outside it.
kit.door(20, 82, 'E', { h: 10, tex: 'door-grey', wall: T.shackB, jamb: false });
kit.door(30, 85, 'W', { h: 6, tex: 'door-red', wall: T.shack, jamb: false });
kit.block(20, 64, 22, 70, { h: 4, wall: T.shackC });
kit.leanTo(20, 64, 22, 70, { h: 3, face: 'E', floorZ: 1 });
kit.fixture('vent-stack', 20, 72.5, 'E', { z: 1 });
kit.window(20, 77.5, 'E', { z: 5 }).window(20, 85.5, 'E', { z: 6.5, tex: 'window-louvre' });
kit.pipe(20, 87, 'E').pipe(30, 81, 'W');
kit.fixture('conduit-8', 20, 80, 'E', { z: 4 }).fixture('wall-unit', 30, 83, 'W', { z: 2.4 });
kit.vent(30, 76.5, 'W', { z: 1.6, tex: 'shutter' }).vent(30, 74, 'W', { z: 4.5, tex: 'wall-fan' }).vent(20, 75, 'E', { z: 3, tex: 'wall-meter' });
kit.fixture('shack-sign', 30, 78.5, 'W', { z: 3.6 });
lamps.push({ x: 28.6, y: 78.5, z: 4.4, radius: 5, light: 72 });
dress.push(
  at('power-unit', 29.2, 79.6), at('astromech-rust', 28.9, 75.2, { angle: 200 }), at('droid-dome', 28.7, 73.7),
  at('canister-rust', 21, 80.3), at('canister', 21.1, 79.2),
);
kit.hangings.push(
  { type: 'cable', from: [20.05, 78, 8], to: [29.95, 76, 7.4], sag: 1.3 },
  { type: 'cable', from: [20.05, 84, 7.2], to: [29.95, 86, 5.6], sag: 1 },
  { type: 'cable', from: [20.05, 66, 8.5], to: [29.95, 74, 9], sag: 1.6 },
);
// The bend: a landspeeder parked along its south side, scrap by it.
dress.push(at('landspeeder', 50, 59.2, { angle: 28 }), at('scrap', 44.5, 62.6), at('canister-rust', 37, 59.2));
pylon(31.2, 61.2, 1);
// Upper street. Doors and windows either side, a lean-to against the
// south shacks, a flue, cables across, a tank on the wall; freight under
// the conveyor (cover when the sweep squad comes down), a power droid.
kit.door(64, 46, 'S', { h: 10, tex: 'door-grey', wall: T.shackC, jamb: false, floorZ: 2 });
kit.door(82, 56, 'N', { h: 11, tex: 'door-red', wall: T.shackB, jamb: false, floorZ: 2 });
kit.window(88.5, 46, 'S', { z: 5.5 }).window(66.5, 56, 'N', { z: 6, tex: 'window-louvre' }).window(79.5, 46, 'S', { z: 5.5, tex: 'window-louvre' });
kit.pipe(78, 46, 'S', { floorZ: 2 }).pipe(68, 56, 'N', { floorZ: 2 });
kit.block(86, 54, 92, 56, { h: 6, wall: T.shackC });
kit.leanTo(86, 54, 92, 56, { h: 3, face: 'N', floorZ: 3 });
kit.fixture('vent-stack', 67.5, 46, 'S', { z: 2 }).fixture('conduit-6', 91, 46, 'S', { z: 6 }).fixture('wall-tank', 94, 56, 'N', { z: 3 });
kit.vent(84, 46, 'S', { z: 4.6, tex: 'vent-slats' }).vent(62, 56, 'N', { z: 4.4, tex: 'wall-meter' });
kit.hangings.push(
  { type: 'cable', from: [62, 46.05, 9], to: [66, 55.95, 8.4], sag: 1.4 },
  { type: 'cable', from: [88, 46.05, 7.6], to: [84, 55.95, 9.5], sag: 1.2 },
  { type: 'cable', from: [78, 46.05, 7], to: [79, 55.95, 8], sag: 0.9 },
);
dress.push(
  at('bay-crate-rust-long', 73, 54.6, { angle: 0 }), at('cargo-pod', 71.6, 47.4), at('power-droid-rust', 80.5, 54.4, { angle: 90 }),
  at('canister', 66.2, 47), at('canister-rust', 83.6, 55),
);
pylon(61, 55.2, 2); pylon(94.8, 47, 3);

// ---------------------------------------------------------------- 3. pump house and gallery
// A coolant tank humming on each plinth, pipes under the ceiling, joints
// leaking steam, a power droid plugged in by the door, a hose left out.
for (const [x, y] of PUMPS) dress.push(at('coolant-tank-running', x + 2, y + 2));
dress.push(
  at('ds-pipe-run-12', 111, 50, { z: PUMP + 6, angle: 0 }), at('ds-pipe-run-12', 111, 51, { z: PUMP + 6, angle: 90 }),
  at('ds-steam-pipe', 98.02, 56, { angle: 0 }), at('ds-steam-pipe', 110, 57.98, { angle: 90 }), at('ds-steam-pipe', 120.98, 50, { angle: 180 }),
  at('ceiling-lamp', 102, 51), at('ceiling-lamp', 111, 51), at('ceiling-lamp', 119.5, 51),
  at('power-droid', 101.5, 55.5, { angle: 90 }), at('bay-hose-coil', 109.5, 50.2), at('canister', 119.4, 56.6),
);
kit.grimeIndoors(98, 40, 124, 58, { amount: 2, seed: 53 });
// The stairs and the gallery: steam off the joints, pipes overhead, one
// lamp at the corner.
dress.push(
  at('ds-steam-pipe', 133, 47.02, { angle: 270 }), at('ds-steam-pipe', 148.02, 58, { angle: 0 }), at('ds-steam-pipe', 151.98, 72, { angle: 180 }),
  at('ds-pipe-run-12', 150, 56, { z: GALLERY + 3.5, angle: 0 }), at('ds-pipe-run-12', 150, 73.5, { z: GALLERY + 3.5, angle: 0 }),
  at('ceiling-lamp', 150, 49),
);
kit.grimeIndoors(144, 47, 152, 56, { amount: 2.5, seed: 59 });

// ---------------------------------------------------------------- 4. Berth 1
// The freighter's hold as Mission 1 left it: ribs, wires out of the
// ceiling (one live), panels off, a dead console.
for (const x of [153, 156, 159, 162]) dress.push(at('hold-rib', x, HOLD.y, { angle: 0, lit: 96 }));
dress.push(
  at('hold-wires', 155, 85.4, { angle: 30, lit: 96 }), at('hold-wires-live', 161.4, 84.6, { angle: 0, lit: 96 }),
  at('hold-console', 157.5, 87, { angle: 180, lit: 96 }),
  at('hold-panel-leaning', 162.6, 87, { angle: 180, lit: 96 }), at('hold-panel-down', 160.4, 84.6, { angle: 20, lit: 96 }),
);
kit.grimeIndoors(150, 80, 164, 87, { amount: 3, seed: 61 });
// The slip round it: the berth's number on the yard's wall, a scaffold
// against the hull, a plasma cutter at work on the stern, plates stacked
// as they come off, and two pit droids doing the carrying.
decals.push({ x: 130, y: 76, z: 4.5, face: 'E', tex: 'berth-1', scale: 2 });
dress.push(
  at('scaffold', 157, 88.2, { angle: 0 }),
  at('cutting-torch', 169.6, 78.6, { angle: 200 }),
  at('plate-stack', 171.5, 89.5, { angle: 15 }), at('plate-stack', 143.5, 90, { angle: 80 }),
  at('pit-droid', 169, 87.6, { angle: 150 }), at('pit-droid', 145.6, 86.4, { angle: 30 }),
  at('cargo-pod', 138, 66), at('power-unit', 168.2, 80),
);
pylon(133, 64); pylon(133, 89);

// ---------------------------------------------------------------- 5. the cutting floor
// The stacks are cut hull (the tiles above). In the lane a skyhopper is
// coming apart under two plasma cutters, work lamps on it; the furnace
// burns in front of its block, fed from a heap, its stack smoking over
// the roof; a skiff waits at the quay with the next load.
dress.push(
  at('skyhopper', 195.5, 73, { angle: 200 }),
  at('cutting-torch', 191.6, 71.6, { angle: 340 }), at('cutting-torch', 199.6, 74.6, { angle: 160 }),
  at('work-lamp', 190.2, 74.6), at('work-lamp', 200.6, 71),
  at('furnace', 201.5, 64.4, { angle: 0 }), at('smokestack', 202, 59, { lit: DAY }),
  at('junk-heap', 196.6, 67.4), at('scrap', 204.4, 66.6), at('pit-droid', 198, 66.4, { angle: 60 }),
  at('plate-stack', 172, 66, { angle: 20 }), at('plate-stack', 187, 92.5, { angle: 100 }), at('plate-stack', 203, 86, { angle: 75 }),
  at('speeder-engine', 187.5, 65.6, { angle: 40 }), at('power-droid-rust', 175, 65.4, { angle: 270 }),
  at('cargo-skiff', 178, 96.5, { angle: 0 }), at('cargo-pod', 174, 94.6), at('canister-rust', 175.5, 95.3),
);
lamps.push({ x: 201.5, y: 65, z: 1.5, radius: 7, light: 96 }, { x: 191, y: 73, z: 1, radius: 5, light: 72 }, { x: 200, y: 73, z: 1, radius: 5, light: 72 });
pylon(169, 58); pylon(204.6, 99);
// The foreman's shed: his terminal and bench, a lamp, a comm unit by the door.
dress.push(at('terminal', 178.6, 58.2, { angle: 270 }), at('workbench', 183.4, 59.5, { angle: 90 }), at('ceiling-lamp', 181, 60));
kit.fixture('comm-unit', 184.5, 64, 'S', { z: 1.2 });
kit.grimeIndoors(177, 57, 185, 63, { amount: 2, seed: 67 });
// Berth 2's number on the hauler's cut hull.
decals.push({ x: 206, y: 65, z: 5.5, face: 'W', tex: 'berth-2', scale: 2 });

// ---------------------------------------------------------------- the quay
// Freight boxes stacked on the waterfront, either side by turns, so no
// view runs its whole length (the longest looks were the slowest frames).
for (const [x0, y0, x1, y1, h, tex] of [
  [62, 92, 70, 99, 5, T.boxA], [94, 97, 102, 104, 6, T.boxB], [122, 92, 130, 98, 5, T.boxB], [148, 97, 156, 104, 5, T.boxA],
  [214, 92, 224, 98, 6, T.boxA], [232, 98, 240, 104, 5, T.boxB],
]) kit.block(x0, y0, x1, y1, { h, wall: tex, roof: T.roof });

// ---------------------------------------------------------------- 6. the hauler
// The hold: frames across it every 5, freight left in it (cover for the
// fight back to the lift), the fallen deck's plates on the floor under
// its broken edge, wires down (one live), panels off, steam off the
// joints. Before the power the only light is the day through the cut
// and three work lamps.
for (const x of [213, 218, 223, 228, 233, 238]) dress.push(at('hold-rib-wide', x, 76, { angle: 0, lit: 104 }));
dress.push(
  at('ds-container', 216.5, 70.6, { angle: 0 }), at('ds-container', 230.5, 81.4, { angle: 90 }), at('ds-crate', 224.5, 82.4), at('ds-crate', 237.4, 81.6),
  at('cargo-pod', 221, 78.6), at('canister-rust', 212.6, 82.6), at('bay-crate-rust-long', 235, 76.6, { angle: 90 }),
  at('deck-plate-long', 226, 71.4, { angle: 25 }), at('deck-plate', 229.4, 74, { angle: 70 }), at('deck-plate-rust', 223.6, 73.6, { angle: 140 }),
  at('rubble', 227.6, 69.4), at('scrap', 224.4, 69.6),
  at('deck-edge', 225, 76, { z: DECK, angle: 180, lit: 104 }), at('deck-edge', 229.5, 76, { z: DECK, angle: 180, lit: 104 }),
  at('deck-edge', 222, 71.5, { z: DECK, angle: 90, lit: 104 }), at('deck-edge', 232, 72.5, { z: DECK, angle: 270, lit: 104 }),
  at('hold-wires-run', 217, 73, { angle: 0, lit: 104 }), at('hold-wires-run', 236, 78.5, { angle: 90, lit: 104 }),
  at('hold-wires-live', 220, 81, { z: 1, angle: 0, lit: 104 }),
  at('hold-panel-leaning', 215.5, 68, { angle: 0, lit: 104 }), at('hold-panel-leaning', 228.5, 84, { angle: 180, lit: 104 }), at('hold-panel-down', 220.5, 73.4, { angle: 30, lit: 104 }),
  at('ds-steam-pipe', 222, 83.98, { angle: 90 }), at('ds-steam-pipe', 234, 68.02, { angle: 270 }),
  at('work-lamp', 212.6, 72.4), at('work-lamp', 227, 77.6), at('work-lamp', 238.6, 72.6),
);
lamps.push(
  { x: 207, y: 76, z: 2.5, radius: 9, light: 150 }, { x: 207, y: 76, z: 8, radius: 8, light: 150 },
  { x: 212.6, y: 72.4, z: 2, radius: 5, light: 96 }, { x: 227, y: 77.6, z: 2, radius: 5, light: 96 }, { x: 238.6, y: 72.6, z: 2, radius: 5, light: 96 },
);
kit.grimeIndoors(208, 68, 240, 84, { amount: 3, seed: 71 });
// The crew deck: wires out of its ceiling, a bunk in each cabin.
dress.push(
  at('hold-wires', 216, 80.5, { z: DECK + 1.5, angle: 60, lit: 120 }), at('hold-wires', 236, 71, { z: DECK + 1.5, angle: 200, lit: 120 }),
  at('ds-bunk', 210.02, 64, { z: DECK, angle: 0 }), at('ds-bunk', 222.02, 64, { z: DECK, angle: 0 }), at('ds-bunk', 219.98, 88, { z: DECK, angle: 180 }),
);
// The reactor room: the ring in its pit, a coolant tank at two corners,
// a terminal by the start switch; its glow comes up with the power.
dress.push(
  at('reactor-ring', 251, 77, { z: -2 }),
  at('coolant-tank', 243.6, 69.6), at('coolant-tank', 258.4, 84.4),
  at('terminal', 254, 85.2, { angle: 90 }), at('ds-steam-pipe', 242.02, 82, { angle: 0 }),
);
lamps.push({ x: 251, y: 77, z: 0, radius: 9, light: 8, tag: 'hauler-lamps' });
kit.grimeIndoors(242, 68, 260, 86, { amount: 2, seed: 73 });
// The bridge, open to the sky: dead consoles under the empty windows,
// two seats left facing them.
dress.push(
  at('hold-console', 247, 68, { z: BRIDGE, angle: 0 }), at('hold-console', 252, 68, { z: BRIDGE, angle: 0 }),
  at('hold-console', 260, 74, { z: BRIDGE, angle: 270 }), at('hold-console', 260, 79.5, { z: BRIDGE, angle: 270 }),
  at('ds-chair', 258, 74, { z: BRIDGE, angle: 0 }), at('ds-chair', 258, 79.5, { z: BRIDGE, angle: 0 }),
  at('hold-panel-down', 249, 80, { z: BRIDGE, angle: 50 }),
);

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
  // The great crane's top (models/crane.js), midway between its legs.
  at('great-crane', 303, 79, { angle: 0, lit: DAY }),
  // The crane way's trestles and spans (models/yard5.js), the gap
  // between the spans; the hoist's frame round its lift.
  ...[254.5, 262.5, 273.5, 281.5, 289.5].map((x) => at('crane-way-trestle', x, 98, { angle: 0, lit: DAY })),
  at('crane-way-span-24', 252, 98, { angle: 0, lit: DAY }), at('crane-way-span-19', 279, 98, { angle: 0, lit: DAY }),
  at('yard-hoist', 268, 101, { angle: 0, lit: DAY }),
  // Berth 3: the frames of a hull on its keel (the tiles), more of them
  // burnt off toward the stern; keel blocks left beside it.
  ...[['berth-rib', 268], ['berth-rib', 272], ['berth-rib-cut', 276], ['berth-rib', 280], ['berth-rib-stub', 284], ['berth-rib-cut', 288, 180], ['berth-rib', 292], ['berth-rib-stub', 296, 180]]
    .map(([type, x, angle = 0]) => at(type, x, 77, { angle, lit: DAY })),
  at('keel-block', 274, 74.3), at('keel-block', 286, 79.7), at('keel-block', 294, 74.3),
  at('energy-cell', 181, 60), at('med-kit', 243.5, 84.5), at('energy-pack', 237, 88.5),
  // The crane way to the dock: one on the cab's side of the gap, the
  // dock officer in the cab (the red keycard), three in the dock.
  at('stormtrooper', 292.5, 98, { angle: 180, z: RAIL }),
  at('officer', 304.5, 98.5, { angle: 180, drops: ['keycard-red'] }),
  at('stormtrooper', 323.5, 70.5, { angle: 90 }), at('stormtrooper', 331.5, 86.5, { angle: 90 }), at('stormtrooper', 317.5, 80.5, { angle: 180 }),
  at('lambda-shuttle', 327, 44 + 36, { angle: 90, z: DOCK }),
  at('energy-pack', 282, 77, { z: 0.5 }), at('med-kit', 301, 101.5), at('med-kit', 322, 56),
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
  haze: { color: [150, 142, 112], half: 44, indoors: true },
  par: 660,
  ...p.build(),
  lights: lamps,
  decals: [...decals, ...kit.decals],
  hangings: [...kit.hangings],
  things: [],
  list: [...list, ...dress, ...kit.things],
  triggers: [
    // The way out (Mark, 2026-11-14): once Bossk is dead the Crow comes in
    // over the dock and sets down on the apron; reach it and the level ends.
    { on: 'killed', thing: 'bossk', do: [
      { action: 'message', text: "JAN: THAT'S HIM DOWN. I'M COMING IN." },
      { action: 'fly', thing: 'moldy-crow', path: CROW_IN, then: [
        { action: 'setFlag', flag: 'crow-down' },
        { action: 'message', text: 'JAN: RAMP IS DOWN. MOVE.' },
      ] },
    ] },
    { on: 'enter', tag: 'crow', if: 'crow-down', do: [{ action: 'exit' }] },
    // The hauler's cargo lift: dead until the reactor runs.
    { on: 'enter', tag: 'cargo-lift', unless: 'power', once: false, do: [{ action: 'message', text: 'CARGO LIFT: NO POWER.' }] },
    { on: 'enter', tag: 'cargo-lift', if: 'power', once: false, do: [{ action: 'lift', tag: 'cargo-lift' }] },
    { on: 'start', do: [{ action: 'message', text: "JAN: BREAKERS' ROW. FOUR BERTHS, AND THE BIG CRANE OVER THE LAST ONE. THE FRONT GATE'S IMPERIAL: GO ROUND, THROUGH THE BOTTOMS." }] },
  ],
});
