import { defineLevel } from '../../engine/defs.js';
import { Painter } from './lib/painter.js';
import { Town } from './lib/town.js';
import { CISTERN } from '../models/market.js';
import { BAY_HOSES } from '../models/bay.js';

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
// A kerb along its front either side of the porch.
town.kerb(6, 63, 8, 64, { skirt: 'plinth' }).kerb(10, 63, 12, 64, { skirt: 'plinth' });
// B: a house with a porch jutting into the street under a rounded arch, a
// room behind it and a dome over the room.
town.house(16, 50, 28, 62, { h: 6, r: 3, wall: 'adobe-pale', skirt: null, dome: true });
town.room(19, 53, 25, 60, { h: 6, wall: 'adobe-pale', light: 128 });
town.arch(20, 60, 24, 62, { h: 6, lintel: 3, wall: 'adobe-pale' });
town.house(19, 62, 25, 66, { h: 4, r: 1, wall: 'adobe-pale', skirt: null });
town.arch(20, 62, 24, 66, { h: 4, lintel: 3.5, wall: 'adobe-pale', round: 'S' });
town.leanTo(19, 62, 25, 66, { h: 4, face: 'S', seed: 9 });
town.window(16, 56.5, 'W', { tex: 'window-louvre' });
// C: a round tower under a big dome, a low lean-to in front of it.
// (The lean-to first: the tower's round wall rises from its roof.)
town.house(30, 59, 42, 63, { h: 4, r: 1 });
town.leanTo(30, 59, 42, 63, { h: 4, face: 'S' });
town.circle(35.5, 56.5, 5, { inside: town.roofCell({ h: 9, wall: 'adobe-ochre' }), wall: { wall: 'adobe-ochre', wallTop: 9 }, open: 'out' });
town.door(33, 63, 'S', { h: 4, tex: 'door-grey', floorZ: 0.375 });
town.door(38.5, 63, 'S', { h: 4, tex: 'shutter', tall: 2.25, width: 3, jamb: false, sign: false, panel: false });
town.dome(35.5, 56.5, 9, 9.5, { wall: 'adobe-ochre' });
// D: a two-storey house, its upper storey set back from the street, a
// small dome on top, and a rounded porch.
// (A locked door in the wall at the back of its porch.)
town.house(45, 51, 58, 63, { h: 6, r: 2, wall: 'adobe-rose', skirt: 'plinth', tiers: [{ box: [48, 51, 58, 58], h: 10, r: 2 }], dome: true });
town.arch(50, 61, 54, 63, { h: 6, lintel: 3.75, wall: 'adobe-rose', round: 'S' });
town.door(52, 61, 'S', { h: 6, wall: 'adobe-rose', panel: false });
town.window(48.5, 63, 'S', { z: 3.6 }).window(55.5, 63, 'S', { z: 3.6 }).window(53.5, 58, 'S', { z: 8, tex: 'window-louvre' });
// A stair up its east side from the street to a shut door on a landing,
// 3.5 up: too far under the roofs either side to climb onto them.
town.stair(58, 53, 60, 61, { up: 'N', top: 3.5, side: 'adobe-rose' });
town.door(58, 54, 'E', { h: 10, wall: 'adobe-rose', floorZ: 3.5 });

// South row.
// E: a shop you can walk into, with a dome over it, and a yard in front
// inside knee-high walls, its gate before the door. (The side walls meet
// the house's rounded corners, too close to squeeze past.)
town.house(4, 78, 17, 91, { h: 6, r: 3, dome: true });
town.lowWall(4, 74, 9, 75).lowWall(12, 74, 17, 75).lowWall(4, 75, 5, 79).lowWall(16, 75, 17, 79);
town.room(7, 81, 15, 88, { h: 6, light: 128 });
town.room(9, 81, 12, 83, { h: 6, light: 160 }); // daylight through the door
town.arch(9, 78, 12, 81, { h: 6, lintel: 3 });
town.window(7.5, 78, 'N', { z: 2.2 }).window(13.5, 78, 'N', { z: 2.2 });
// F: a tall house in two steps, a door that opens into a room behind it
// (the front under the lower roof, the back under the upper storey).
town.house(20, 79, 30, 92, { h: 7, r: 2, wall: 'adobe-grey', skirt: null, tiers: [{ box: [22, 83, 30, 92], h: 10, r: 2 }], dome: true });
town.room(23, 80, 28, 83, { h: 7, wall: 'adobe-grey', light: 136 });
// (A passage to the back clear of the upper window over row 83.)
town.room(24, 83, 26, 84, { h: 10, wall: 'adobe-grey', light: 128 });
town.room(24, 84, 28, 90, { h: 10, wall: 'adobe-grey', light: 120 });
town.door(25, 79, 'N', { h: 7, tex: 'door-grey', wall: 'adobe-grey', opens: true });
town.hood(25, 79, 'N', { h: 7, wall: 'adobe-grey' });
town.window(22.5, 79, 'N', { z: 4 }).window(26.5, 83, 'N', { z: 8.5, tex: 'window-louvre' }).window(20, 86.5, 'W');
// Buttresses along its blank east wall onto the square.
town.buttress(30, 82.5, 'E', { h: 7, wall: 'adobe-grey' }).buttress(30, 86.5, 'E', { h: 10, wall: 'adobe-grey' }).buttress(30, 89.2, 'E', { h: 10, wall: 'adobe-grey' });
// A square, with a round house under a dome in it.
town.circle(41, 86, 4.5, { inside: town.roofCell({ h: 5, wall: 'adobe-rose', skirt: 'plinth' }), wall: { wall: 'adobe-rose', wallTop: 5 }, open: 'out', skirt: 'plinth' });
town.dome(41, 86, 5, 8.5, { wall: 'adobe-rose' });
// G: a low house on the square's east side, its red door opening into a room.
town.house(53, 78, 61, 88, { h: 5, r: 2, wall: 'adobe-ochre', skirt: null, dome: true });
town.room(55, 79, 59, 87, { h: 5, ceilZ: 4.25, wall: 'adobe-ochre', light: 128 });
town.door(57, 78, 'N', { h: 5, wall: 'adobe-ochre', opens: true });
town.window(53, 83.5, 'W', { z: 3, tex: 'window-louvre' });
town.buttress(53, 85.2, 'W', { h: 5, wall: 'adobe-ochre' });
// A stall on the square in front of G, under a tarp that billows.
town.tarp(46, 80, 50, 84, { z: 2.75, face: 'W', rise: 0.5, cloth: 'red' });

// ---------------------------------------------------------------- 2. the main street (east) and the market
// East of the first stretch the street widens into the market (y 58..82,
// x 62..102), the water plaza in its middle. Past the market it narrows
// between the frame the blast doors slide out of (x 104..106), then bends
// north a little (angled fronts, `slanted()`), so you never see straight
// down it, and runs on to the checkpoint (for now an exit at its end).
p.rect(62, 58, 102, 82, town.street());
p.rect(102, 58, 136, 80, town.street());
// Alleys off the market, between its houses.
p.rect(71, 49, 73, 58, town.street());
p.rect(86, 49, 88, 58, town.street());
p.rect(61, 82, 63, 96, town.street());
p.rect(73, 82, 87, 94, town.street());
// The back lane behind the cantina, off the street's south side.
p.rect(126, 73, 130, 92, town.street());
// Ground under the houses' plots too, for their rounded back corners.
for (const lot of [[62, 48, 71, 58], [73, 51, 86, 58], [88, 47, 101, 58], [102, 50, 112, 64], [126, 50, 136, 61], [63, 82, 73, 92], [87, 82, 102, 92], [102, 76, 114, 86], [130, 73, 136, 86]]) {
  p.rect(...lot, town.street());
}

// The market's north side.
// H: a house in two steps, the upper storey at the back, a dome on top.
town.house(62, 48, 71, 58, { h: 6, r: 2, wall: 'adobe-pale', skirt: 'plinth', tiers: [{ box: [62, 48, 71, 54], h: 9, r: 2 }], dome: true });
town.door(66, 58, 'S', { h: 6, tex: 'door-grey', wall: 'adobe-pale', floorZ: 0.375 });
town.hood(66, 58, 'S', { h: 6, wall: 'adobe-pale' });
town.window(68.5, 58, 'S', { z: 3.2 }).window(66.5, 54, 'S', { z: 7.2, tex: 'window-louvre' });
// I: a long low house, a wide shutter and a door under an awning.
town.house(73, 51, 86, 58, { h: 4.5, r: 1, skirt: 'plinth', dome: true });
town.door(76.5, 58, 'S', { h: 4.5, tex: 'shutter', tall: 2.25, width: 3, jamb: false, sign: false, panel: false });
town.door(82, 58, 'S', { h: 4.5 });
town.awning(74, 58, 86, 60, { z: 3, face: 'S', cloth: 'olive' });
// J: a tall house over a garage door, its upper storey at the back.
town.house(88, 47, 101, 58, { h: 7, r: 2, wall: 'adobe-grey', skirt: null, tiers: [{ box: [90, 47, 101, 53], h: 10, r: 2 }], dome: true });
town.door(94.5, 58, 'S', { h: 7, tex: 'shutter', tall: 2.25, width: 3, jamb: false, sign: false, panel: false, wall: 'adobe-grey' });
town.window(90.5, 58, 'S', { z: 4.5 }).window(98.5, 58, 'S', { z: 4.5, tex: 'window-louvre' }).window(96.5, 53, 'S', { z: 8.4 });

// The market's south side.
// Q: a house facing the market, a kerb along its front and its door on it.
town.house(63, 82, 73, 92, { h: 6, r: 2, dome: true });
town.kerb(65, 81, 71, 82);
town.door(68, 82, 'N', { h: 6, floorZ: 0.375 });
town.window(65.5, 82, 'N', { z: 2.2 }).window(73, 87.5, 'E');
// R: a round house under a dome.
town.circle(80, 88, 5, { inside: town.roofCell({ h: 7, wall: 'adobe-rose', skirt: null }), wall: { wall: 'adobe-rose', wallTop: 7 }, open: 'out', skirt: null });
town.dome(80, 88, 7, 9.5, { wall: 'adobe-rose' });
// S: where the cantina's front will be (its own step): a long house, its door shut.
town.house(87, 82, 102, 92, { h: 6, r: 3, wall: 'adobe-pale', dome: true });
town.door(94, 82, 'N', { h: 6, tex: 'door-grey', wall: 'adobe-pale' });
town.window(90.5, 82, 'N', { z: 3.4, tex: 'window-louvre' }).window(98.5, 82, 'N', { z: 3.4, tex: 'window-louvre' });


// Past the market. North side: K by the frame, a rounded porch cut into its
// front and a door at the back of it, L with its front slanting back to the
// north, M at the street's end under a hood.
town.house(102, 50, 112, 64, { h: 7, r: 2, wall: 'adobe-pale', skirt: null, dome: true });
town.arch(107, 61, 111, 64, { h: 7, lintel: 3.5, wall: 'adobe-pale', round: 'S' });
town.door(109, 61, 'S', { h: 7, tex: 'door-grey', wall: 'adobe-pale' });
town.window(102, 61.5, 'W', { z: 3.4, tex: 'window-louvre' }).window(106.5, 64, 'S', { z: 4.6 });
// The blast doors' frame: a strip of Imperial steel set into the walls
// either side of the street, the slots the doors slide out of when the
// town shuts (the story's switch). Easy to miss while they're open.
const GATE = { wall: 'imp-panel-dark', roof: 'imp-floor', skirt: { tex: 'imp-stripe', to: 0.5 } };
town.block(104, 63, 106, 64, { ...GATE, h: 7 });
town.slanted([[112, 52], [126, 52], [126, 61], [122, 61], [112, 64]], { h: 6, wall: 'adobe-ochre', dome: 'adobe' });
town.house(126, 50, 136, 61, { h: 8, r: 2, tiers: [{ box: [128, 50, 136, 57], h: 11, r: 2 }], dome: true });
town.door(130, 61, 'S', { h: 8, tex: 'door-red' });
town.hood(130, 61, 'S', { h: 8 });
town.window(132.5, 61, 'S', { z: 3.4 }).window(133.5, 57, 'S', { z: 9.4, tex: 'window-louvre' });
// South side: N by the frame, O slanting back to the south, the back lane,
// then P (the first of the rooftops). N stands on a platform three steps up.
town.house(102, 76, 114, 86, { h: 6, r: 2, wall: 'adobe-rose', skirt: 'plinth', dome: true });
town.platform(106, 74, 112, 76, { h: 0.75, steps: 'N' });
town.door(110, 76, 'N', { h: 6, wall: 'adobe-rose', floorZ: 0.75 });
town.window(107.5, 76, 'N', { z: 2.2, tex: 'window-louvre' });
town.block(104, 76, 106, 77, { ...GATE, h: 6 });
town.slanted([[114, 76], [124, 73], [126, 73], [126, 86], [114, 86]], { h: 5, wall: 'adobe-grey', skirt: null, dome: true });
town.house(130, 73, 136, 86, { h: 8, r: 1, wall: 'adobe-pale', tiers: [{ box: [132, 77, 136, 86], h: 11, r: 1 }] });
town.door(133, 73, 'N', { h: 8, tex: 'door-grey', wall: 'adobe-pale' });
town.window(130, 79.5, 'W', { z: 4.4, tex: 'window-louvre' });

// The market: stalls round its edges (lib/town.js, stall()), so the way
// across from the street to the blast doors stays open, each a counter
// and a rack of wares under a canvas roof with the stallholder between
// them; and in the north-east corner the droid seller's pen, behind a cage.
town.stall(62, 60, 65, 64, 'E', { cloth: 'umber' }).stall(68, 59, 72, 62, 'S', { cloth: 'olive' }).stall(62, 76, 65, 80, 'E', { cloth: 'teal' });
town.stall(89, 59, 93, 62, 'S', { cloth: 'sand' }).stall(89, 77, 93, 80, 'N', { cloth: 'red', valance: 'valance-red' }).stall(97, 77, 101, 80, 'N', { cloth: 'olive' });
// 13. The water plaza, in the market's middle: a round paving round the
// moisture condenser tower (models/market.js), the landmark, the water
// seller's tap on its south side with a tarp over the queue, and a
// dewback trough. The tower's cistern and column cast shadows.
const PLAZA = { cx: 78, cy: 70, r: 8.5 };
p.rect(PLAZA.cx - 9, PLAZA.cy - 9, PLAZA.cx + 9, PLAZA.cy + 9, (x, y, c) => (Math.hypot(x + 0.5 - PLAZA.cx, y + 0.5 - PLAZA.cy) < PLAZA.r ? { ...c, floor: 'flagstone' } : c));
town.caster(PLAZA.cx, PLAZA.cy, CISTERN.radius, 0, CISTERN.height).caster(PLAZA.cx, PLAZA.cy, 1, CISTERN.height, 13);
town.tarp(76, 74, 80, 78, { z: 3, face: 'S', rise: 0.25, cloth: 'teal' });
const CAGE = { tex: 'imp-cage', height: 1.5 };
p.fence(96, 58, 97, 60, 'W', CAGE).fence(96, 62, 97, 64, 'W', CAGE).fence(96, 63, 102, 64, 'S', CAGE);

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
// A window cut through a front wall in row `y`, from x0 to x1: open
// (Tatooine's are), at eye height between a sill and a lintel, so you see
// in from the lane and out from the room behind. Too low to climb through.
const windowThrough = (x0, x1, y, { sill = 1.1, top = 2.25, light = 136 } = {}) => {
  for (let x = x0; x < x1; x++) {
    const c = p.get(x, y);
    p.set(x, y, { ...c, floorZ: sill, slab: { bottom: top, top: c.floorZ, floor: c.floor, ceiling: c.side, side: c.side, light } });
  }
};
// The customs house, west of the bay door: a grey prefab lower than the
// bay, jutting a tile into the lane, its door into an office with a
// terminal and impounded cargo, a window by the door.
town.house(11, 99, 22, 107, { h: 5, wall: 'metal-grey', roof: 'metal-grey', skirt: null });
town.room(12, 100, 21, 105, { h: 5, ceilZ: 4, floor: 'imp-floor', ceiling: 'imp-panel-dark', wall: 'metal-grey', light: 136 });
town.door(15, 99, 'N', { h: 5, tex: 'door-grey', wall: 'metal-grey', opens: true });
windowThrough(18, 20, 99);
// The bay owner's office, east of the door, in the bay's building: a red
// door and a wide window onto the lane, to watch who comes and goes.
town.room(44, 101, 54, 106, { h: BAY.rim, wall: 'adobe-grey', light: 128 });
town.door(46, 100, 'N', { h: BAY.rim, tex: 'door-red', wall: 'adobe-grey', opens: true });
windowThrough(49, 53, 100);
list.push(
  at('terminal', 16.5, 104.3, { angle: 90 }), at('crate-grey-small', 13, 101.2, { angle: 5 }), at('crate-rust-long', 13.2, 103.4, { angle: 92 }),
  at('cargo-pod', 20.2, 101.5, { angle: 270 }),
  at('terminal', 51, 101.6, { angle: 270 }), at('crate-tan', 44.8, 105.2, { angle: 12 }), at('canister', 53.3, 105.3), at('power-unit', 45, 102),
);
town.circle(BAY.cx, BAY.cy, BAY.r, {
  inside: bayFloor,
  wall: { wall: 'bay-wall', wallTop: BAY.rim, bands: RIBBED },
  seam: 90, // behind the landing
});
// The landing, at street level, and the passage out to the door through
// the wall over it.
p.rect(29, 104, 35, 107, (_, __, c) => ({ ...c, floor: 'bay-floor', floorZ: 0 }));
town.arch(30, 101, 34, 105, { h: BAY.rim, lintel: 4, wall: 'bay-wall', floor: 'bay-floor', light: 144 });
town.door(32, 100, 'N', { h: BAY.rim, tex: 'door-bay', width: 4, tall: 4, wall: 'adobe-grey', jamb: false, opens: true });
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
// On the floor, round the edge where ships don't set down (none of it in
// the way of the stairs, the pit or the Crow's nose and wings): drums by
// the stairs, crates stacked two high on the west and south sides, more on
// the east, drums by the south-west pump, and hoses out from two pumps: one
// left lying by the Crow, one coiled (models/bay.js, BAY_HOSES).
const onBayFloor = (type, x, y, extra = {}) => at(type, x, y, { ...extra, z: BAY.floorZ + (extra.z ?? 0) });
list.push(
  onBayFloor('barrel-rust', 18.4, 115.4), onBayFloor('barrel-rust', 19.1, 116.1), onBayFloor('canister', 18.2, 116.4, { angle: 30 }),
  onBayFloor('bay-crate-grey', 14.6, 124.6, { angle: 8 }), onBayFloor('bay-crate-tan', 14.3, 127.1, { angle: 356 }),
  onBayFloor('bay-crate-grey', 14.7, 124.8, { z: 2, angle: 21 }), onBayFloor('bay-crate-rust-long', 17.6, 125.6, { angle: 92 }),
  onBayFloor('barrel-grey', 17.3, 122.7), onBayFloor('canister-rust', 18.2, 128.1, { angle: 50 }),
  onBayFloor('bay-crate-tan', 48.9, 129.6, { angle: 342 }), onBayFloor('crate-tan', 49, 129.5, { z: 2, angle: 330 }),
  onBayFloor('bay-crate-grey', 45.4, 137.4, { angle: 48 }), onBayFloor('cargo-pod', 43, 140.3, { angle: 60 }),
  onBayFloor('bay-crate-tan', 30.5, 143.3, { angle: 4 }), onBayFloor('bay-crate-grey', 30.4, 143.4, { z: 2, angle: 352 }),
  onBayFloor('bay-crate-rust-long', 33.9, 143.1, { angle: 359 }), onBayFloor('crate-grey-small', 34.6, 143.2, { z: 1.6, angle: 20 }),
  onBayFloor('barrel-rust', 17.8, 137), onBayFloor('barrel-grey', 18.5, 136.3), onBayFloor('crate-grey-small', 17.5, 135.6, { angle: 15 }),
  ...BAY_HOSES.map(({ id, path: [[x, y]] }) => onBayFloor(id, BAY.cx + x, BAY.cy + y, { angle: 0 })),
);

// Pipes, vents and boxes on the walls (lib/town.js): downpipes off the
// roofs, a tank and a box unit in the alleys, conduits, vents and a fan.
town.pipe(6.5, 63, 'S').pipe(4, 53, 'W').pipe(47.2, 63, 'S').pipe(27.6, 79, 'N').pipe(53, 85.5, 'W');
town.fixture('wall-tank', 14, 56.5, 'E', { z: 3.2 }).fixture('wall-tank', 17, 84.5, 'E', { z: 3 });
town.fixture('wall-unit', 45, 56, 'W', { z: 2.4 }).fixture('wall-unit', 30, 83.5, 'E', { z: 2.2 });
town.fixture('conduit-4', 49.5, 63, 'S', { z: 5.2 }).fixture('conduit-6', 30, 87.5, 'E', { z: 4.6 }).fixture('conduit-3', 57.5, 78, 'N', { z: 4.2 });
town.vent(35.6, 63, 'S', { z: 2.3, tex: 'wall-fan' }).vent(36.4, 63, 'S', { z: 1.5, tex: 'wall-meter' });
town.vent(22.2, 79, 'N', { z: 1.1, tex: 'vent-slats' }).vent(55.6, 78, 'N', { z: 3.6, tex: 'vent-round' });
town.vent(9, 63, 'S', { z: 4.6, tex: 'vent-grille' });
town.vent(16, 53.5, 'W', { z: 4, tex: 'vent-round' }).vent(28, 55, 'E', { z: 3.4, tex: 'vent-slats' });

// For now the street ends at an exit (until the checkpoint).
p.rect(134, 61, 136, 73, town.street(0, { exit: true }));

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
// (lib/town.js).
town.clutter();
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
  // An X-34 landspeeder left on the main street in front of C, nose west,
  // turned a little off the line of the street (Mark: not square to the houses).
  at('landspeeder', 37.5, 74.4, { angle: 165 }),
  at('crate-rust-long', 46.9, 82, { angle: 90 }), at('droid-dome', 46.9, 81.6, { z: 0.7, angle: 200 }), at('crate-grey-small', 46.85, 82.4, { z: 0.7, angle: 85 }),
  at('crate-tan', 49, 81.1, { angle: 95 }), at('barrel-grey', 49.1, 83), at('litter-small', 45, 83, { angle: 40 }),
);

// The water plaza: the tower, water cans by the tap, and the trough.
list.push(
  at('condenser-tower', PLAZA.cx, PLAZA.cy, { angle: 0 }),
  at('canister', 80.7, 72.4, { angle: 20 }), at('canister', 81.15, 72.75, { angle: 70 }), at('crate-grey-small', 81.1, 73.6, { angle: 12 }),
  at('water-trough', 80, 63.4, { angle: 0 }),
);

// The market: wares on the stalls' counters, and in the droid seller's pen
// droids' domes, parts and power units for sale.
list.push(
  at('droid-dome', 64.37, 61.3, { z: 1, angle: 30 }), at('crate-grey-small', 90.3, 61.37, { z: 1, angle: 8 }), at('droid-dome', 98.4, 77.63, { z: 1, angle: 200 }),
  at('power-unit', 99.5, 58.01, { angle: 0 }), at('scrap', 101.99, 59.6, { angle: 270 }), at('junk-heap', 98.6, 61.4, { angle: 15 }),
  at('droid-dome', 97.6, 60.3, { angle: 120 }), at('droid-dome', 100.4, 62.5, { angle: 290 }), at('canister-rust', 101.2, 61.2),
  at('crate-grey-small', 97.3, 62.8, { angle: 20 }), at('droid-dome', 97.3, 62.8, { z: 0.6, angle: 75 }),
);

// The Moldy Crow, hovering in the bay in front of you, nose east and
// turned 20 degrees off square (Mark: parked too perfectly), a little south
// of the maintenance pit: its gun pod (solid) would block the way along the
// pit to its secret.
list.push(at('moldy-crow', 34, 128.5, { angle: 340 }));

list.push(
  at('player', 32, 134, { angle: 90 }),
  at('supply-crate', 14, 86.5),
  at('shield-unit', 38.5, 124), // secret: the crawlspace off the bay's maintenance pit
);

// Calm until the town turns (things/calm.js, docs/story.md): sandtroopers
// and Jawas about town, none of them after you yet. Most stand about. One
// patrol, a commander and a trooper side by side, walks the main street
// from the west end to the blast doors and back, passing north of the
// condenser tower. A second commander stands talking to a trooper in the
// market, and a guard stands at the blast doors, looking down the street.
// Two Jawas haggle at the droid seller's pen and two more stand by the
// street; one strolls the street and one the north back lane.
const STREET_PATROL = [[12.5, 67], [60.5, 67], [101.5, 66]];
list.push(
  at('sandtrooper-commander', 14.5, 67, { calm: { patrol: STREET_PATROL, idleTime: [3, 3] } }),
  at('sandtrooper', 14.5, 68.6, { calm: { patrol: STREET_PATROL.map(([x, y]) => [x, y + 1.6]), idleTime: [3, 3] } }),
  at('sandtrooper-commander', 86.5, 61, { angle: 180, calm: { wander: 0 } }),
  at('sandtrooper', 84.5, 61, { angle: 0, calm: { wander: 0 } }),
  at('sandtrooper', 103, 71, { angle: 180, calm: { wander: 0 } }),
  at('jawa', 95, 60.6, { angle: 0, calm: { wander: 0 } }), at('jawa', 99.2, 61, { angle: 180, calm: { wander: 0 } }),
  at('jawa', 22, 70, { angle: 90, calm: { wander: 0 } }), at('jawa', 116, 68, { angle: 180, calm: { wander: 0 } }),
  at('jawa', 68, 70, { calm: { wander: 3 } }), at('jawa', 50, 47, { calm: { wander: 4 } }),
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
  // The market, and past the blast doors.
  at('villager-woman', 70, 66), at('villager-adventurer', 85, 63), at('villager-man', 95, 70), at('villager-boy', 66, 74),
  at('villager-wanderer', 88, 75), at('villager-man', 118, 67),
  // Stallholders behind their counters, staying there.
  at('villager-man', 63.43, 62, { angle: 0, wander: 0 }), at('villager-woman', 91, 60.43, { angle: 270, wander: 0 }),
  at('villager-wanderer', 99, 78.57, { angle: 90, wander: 0 }),
  // The water seller by his tap (a villager until his sheet exists), and the queue waiting for it.
  at('villager-man', 79.6, 73, { angle: 180, wander: 0 }),
  at('villager-woman', 78, 74.3, { angle: 90, wander: 0 }), at('villager-boy', 78.2, 75.5, { angle: 90, wander: 0 }),
  at('villager-wanderer', 77.9, 76.7, { angle: 100, wander: 0 }),
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
  // A torn rag hanging over C's shutter.
  { type: 'rag', from: [37.2, 63.05, 2.95], to: [39.8, 63.05, 2.95], length: 0.9 },
  // A long banner down G's west wall, facing the square.
  { type: 'rag', from: [52.95, 80.4, 4.8], to: [52.95, 81.8, 4.8], length: 2.4 },
  // A sheet slung across the north back lane, pinned at its corners.
  { type: 'cloth-pale', from: [12, 44.05, 4], to: [12.5, 49.95, 4], length: 1, pin: 'corners' },
  // Cables across the market and the street past it.
  { type: 'cable', from: [70, 58.05, 5.4], to: [70.5, 81.95, 5.2], sag: 1.5 },
  { type: 'cable', from: [97, 58.05, 6.6], to: [96.5, 81.95, 5.6], sag: 1.6 },
  { type: 'cable', from: [108, 64.05, 6.6], to: [108.5, 75.95, 5.6], sag: 1 },
  { type: 'cable', from: [128.5, 61.05, 7.5], to: [125, 72.95, 4.6], sag: 1 },
  // A long banner down J's front, by the garage door.
  { type: 'rag', from: [91.6, 58.05, 6.2], to: [92.8, 58.05, 6.2], length: 2.6 },
  // A sheet across the alley between H and I.
  { type: 'cloth-pale', from: [71.05, 55, 4.1], to: [72.95, 55.6, 4.1], length: 1, pin: 'corners' },
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
