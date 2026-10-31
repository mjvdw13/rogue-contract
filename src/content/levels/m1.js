import { defineLevel } from '../../engine/defs.js';
import { WALL, BOOTH, TAPS, CANOPY, LAMP_CORD, DOORWAY } from '../models/cantina.js';
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
// down it, and runs on to the checkpoint.
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
// S: the cantina's front, plain plaster with no windows on the market
// (Mark's stills, 2026-10-30, looked at closer 2026-10-31). Its west end a
// block a tile taller, cut back at 45 degrees (the stills' near wall, seen
// square from the market's west side), then the straight front (91..102):
// the arch at the corner, a smaller door and the hitching ring on its post
// in the nook against N. They and the cantina behind are with the middle,
// below. The dome sits back over the hall.
town.slanted([[87, 86], [91, 82], [91, 92], [87, 92]], { h: 7, wall: 'adobe-pale' });
town.house(91, 82, 102, 92, { h: 6, wall: 'adobe-pale' });
town.dome(97, 88, 6, 8, { wall: 'adobe-pale' });


// Past the market. North side: K by the frame, a rounded porch cut into its
// front and a door at the back of it, L with its front slanting back to the
// north, M at the street's end under a hood.
town.house(102, 50, 112, 64, { h: 7, r: 2, wall: 'adobe-pale', skirt: null, dome: true });
town.arch(107, 61, 111, 64, { h: 7, lintel: 3.5, wall: 'adobe-pale', round: 'S' });
town.door(109, 61, 'S', { h: 7, tex: 'door-grey', wall: 'adobe-pale' });
town.window(102, 61.5, 'W', { z: 3.4, tex: 'window-louvre' }).window(106.5, 64, 'S', { z: 4.6 });
// The blast doors' frame: a strip of Imperial steel set into the walls
// either side of the street, and a beam over it the doors rise into (a
// stand-in for doors that slide out of the walls). Shut when Kyle lands,
// so the town east of here waits until the fob has Rusk's signal; they
// open then (the Empire wants him found: the fob is theirs), and shut
// again at the switch, splitting the town in two. 12 wide and 4 high,
// slow and heavy (2 s).
const GATE = { wall: 'blast-steel', roof: 'bay-plate', skirt: { tex: 'blast-hazard', to: 0.5 } };
town.block(104, 63, 106, 64, { ...GATE, h: 7 });
town.arch(104, 64, 106, 76, { ...GATE, wall: 'blast-beam', h: 6, lintel: 4, light: 176 });
p.rect(104, 64, 106, 76, (_, __, c) => ({ ...c, door: 'blast-door-rising', style: 'rise', lock: 'remote', tag: 'blast-doors', stayOpen: true, speed: 0.5 }));
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
// None in front of the cantina: that's open ground in Mark's stills.
town.stall(62, 60, 65, 64, 'E', { cloth: 'umber' }).stall(68, 59, 72, 62, 'S', { cloth: 'olive' }).stall(62, 76, 65, 80, 'E', { cloth: 'teal' });
town.stall(89, 59, 93, 62, 'S', { cloth: 'sand' });
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
// After the switch its terminal holds the bay door's lock: use the wall
// behind it (the terminal stands against it) to open the way to the Crow.
p.rect(16, 105, 17, 106, (_, __, c) => ({ ...c, tag: 'bay-controls' }));
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
// Customs locks it at the switch, and Jan says where its controls are when
// Kyle comes back along the lane to it.
p.rect(30, 100, 34, 101, (_, __, c) => ({ ...c, tag: 'bay-door' }));
p.rect(26, 95, 39, 100, (_, __, c) => ({ ...c, tag: 'bay-lane' }));
// A round-topped hood round the bay door, and a buttress either side of it.
town.hood(32, 100, 'N', { h: BAY.rim, width: 4, wall: 'adobe-grey' });
town.buttress(28.4, 100, 'N', { h: BAY.rim, wall: 'adobe-grey' }).buttress(35.6, 100, 'N', { h: BAY.rim, wall: 'adobe-grey' });
// Stairs down to the floor, a step every tile: risers in shaded duracrete
// under a pale nosing (bay-step), between the lit floor's treads.
const { bands: _stairBands, ...stairCell } = { ...bayFloor, side: 'bay-step' };
for (let k = 0; k < 7; k++) p.rect(30, 107 + k, 34, 108 + k, { ...stairCell, floorZ: (-(k + 1) * 5) / 8 });
// A cheek either side, a step above the treads beside it and as wide as the
// landing: the stair's sides are bay wall, not a stack of risers.
for (let k = 0; k < 7; k++) for (const x of [29, 34]) p.set(x, 107 + k, { ...bayFloor, floorZ: (-k * 5) / 8 });
// A maintenance pit in the middle of the floor, where ships set down: 8 by
// 4 tiles and 2 deep, lined in steel, hazard stripes along its lips and two
// steps down at its west end. Off its east end a crawlspace runs on under
// the floor, low and dark, with a shield unit in it: a secret.
const PIT = { x0: 28, y0: 122, x1: 36, y1: 126, floorZ: -7 };
const { bands: _, ...pitLip } = { ...bayFloor, side: 'bay-step' };
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

// ---------------------------------------------------------------- the east third (blockout)
// Roughed out to try the route before any detail (docs/mission1.md, the
// map): plain volumes at their final heights, the gates the only doors,
// stand-ins for the landmarks, and stand-in messages for the story until
// conversations and the fob exist. Mos Eisley is flat (Mark), so each
// part of town is a couple of steps (0.5) up or down from the next: the
// street climbs two steps to the checkpoint's gate and the old quarter,
// and the dry wash is two down from the old quarter. Only the derelict
// bay, a docking bay, is a pit.
const OQ = 0.5;
const WASH = 0;
// A gate's door tiles: shut until a trigger opens them by `tag`, then open for good.
const gateTag = (x0, y0, x1, y1, tag) => p.rect(x0, y0, x1, y1, (_, __, c) => ({ ...c, tag, stayOpen: true }));
// A tile tagged for a trigger (where a spawn appears).
const tagTile = (x, y, tag) => p.rect(x, y, x + 1, y + 1, (_, __, c) => ({ ...c, tag }));

// The comm tower, the town's landmark (a stand-in block, 11 m), stands
// where the street's bend points, among the houses north of the old
// quarter. (The Imperial prefecture that stood here is gone: Mos Eisley
// has no Imperial buildings, Mark 2026-10-30.)
town.block(178, 42, 182, 46, { h: 22, wall: 'adobe-grey', skirt: null });

// 5. The checkpoint: the street climbs two steps to the old quarter's rise
// and squeezes between two houses into a passage 4 wide, under a room
// that bridges it (Mark, 2026-10-31: a wall across the street with a door
// in it looked odd). The houses' fronts slant in toward the gap, so the
// street funnels into it; the passage is round-topped at both ends, and
// the town's heavy door (a docking bay's) is shut a tile in, in its shade.
// The Imperials set up here but built nothing (Mark): they keep the door
// shut, with barricades at the foot of the steps, floodlights and a guard
// post under a tarp. From the top both ways round are in sight: the
// alleys' mouth to the north and the back lane behind you.
p.rect(136, 61, 139, 73, town.street());
// Its foot, where the informant calls out (with the signal) and Jan names the ways round (after the switch).
p.rect(136, 61, 139, 73, (_, __, c) => ({ ...c, tag: 'checkpoint-foot' }));
town.stair(139, 61, 147, 73, { up: 'E', top: OQ, rise: 0.25, floor: 'flagstone', side: 'adobe-brick' });
// The informant's house reaches forward on the north; an ochre house,
// taller, on the south, in front of the pale one behind it. Two tiles in,
// a room in plain plaster bridges the gap between them, round-topped
// underneath, and the door is a tile further in.
town.slanted([[142, 61], [148, 61], [148, 65], [144, 65]], { h: 7, wall: 'adobe-grey', skirt: null });
town.slanted([[144, 69], [148, 69], [148, 73], [143, 73]], { h: 8, wall: 'adobe-ochre' });
const BRIDGE = { h: 6.5, wall: 'adobe', floorZ: OQ };
town.arch(146, 65, 147, 69, { ...BRIDGE, lintel: 5, round: 'W' });
town.door(147, 67, 'W', { ...BRIDGE, tex: 'door-gate', width: 4, tall: 4, jamb: false, sign: false, panel: false, step: false });
gateTag(147, 65, 148, 69, 'checkpoint');
// On the old quarter's side, a round hood over the door, as the town's doors have.
town.hood(148, 67, 'E', { h: 6.5, width: 4, floorZ: OQ, wall: 'adobe' });
town.tarp(140.2, 69.9, 142.9, 72.9, { z: OQ + 2.75, face: 'N', cloth: 'sand', floorZ: OQ });
// North of it the alleys' east mouth (the alleys come down into it, with
// the middle, below) and the informant's den, open to it.
p.rect(136, 48, 139, 61, town.street());
town.house(139, 48, 148, 61, { h: 7, r: 1, wall: 'adobe-grey', skirt: null });
town.room(140, 52, 146, 59, { h: 7, wall: 'adobe-grey', light: 128 });
town.arch(139, 54, 140, 57, { h: 7, lintel: 3, wall: 'adobe-grey' });
// South of it, too tall to climb from the roofs behind.
p.rect(136, 73, 148, 86, town.street());
town.house(136, 73, 141, 86, { h: 8, r: 1, skirt: 'plinth' });
town.house(141, 73, 148, 86, { h: 9.5, r: 1, wall: 'adobe-pale' });

// 6. The rooftops, the way over the checkpoint. The back lane runs on
// south to rubble where a wall fell, which climbs onto the first roof.
// Running jumps over light wells 3 wide (their floors open to the lane, so
// a fall walks back) lead east to the last roof, which drops into a yard
// in the old quarter; a stair climbs back up from the yard. The roofs stand
// clear of anything within a jump, so they lead nowhere else.
p.rect(126, 92, 130, 118, town.street());
p.rect(130, 86, 149, 118, town.street());
town.house(118, 92, 126, 120, { h: 8 });
const RUBBLE = { wall: 'adobe-brick', skirt: null };
[0.75, 1.75, 2.75, 3.75].forEach((h, k) => town.block(126, 110 + k * 2, 130, 112 + k * 2, { ...RUBBLE, h }));
town.house(130, 102, 138, 118, { h: 4.75 });
town.house(138, 102, 149, 118, { h: 5.75, wall: 'adobe-ochre' });
town.house(130, 86, 140, 99, { h: 4.75, wall: 'adobe-pale' });
town.house(143, 86, 149, 102, { h: 5.25, wall: 'adobe-rose' });
town.block(126, 118, 150, 122, { h: 8 }).block(149, 96, 162, 118, { h: 8 });

// 9. The old quarter, on its rise: a square inside the gate, a north
// street along its north side, and the main street slanting
// south-east from the square to the derelict bay's gate, its houses
// following the slant. The yard the roofs drop into opens onto the main
// street by an alley.
p.rect(148, 53, 188, 60, town.street(OQ));
p.rect(148, 60, 160, 76, town.street(OQ));
// (Between its two edges, y = 64 + 1.2 (x - 160) and 12 further south,
// and a tile beyond them: the houses cut their slanting walls into it.)
p.rect(160, 60, 196, 104, (x, y, c) => {
  const k = y + 0.5 - 1.2 * (x + 0.5 - 160);
  return k > 62 && k < 78 ? town.street(OQ) : c;
});
p.rect(149, 86, 157, 96, town.street(OQ));
p.rect(157, 88, 174, 92, town.street(OQ));
town.stair(149, 86, 151, 96, { up: 'N', from: OQ, top: 4 });
town.house(148, 76, 157, 86, { h: 8, r: 1, wall: 'adobe-grey' });
town.house(149, 96, 157, 104, { h: 7.5, wall: 'adobe-ochre' });
town.slanted([[160, 60], [170, 60], [170, 76], [160, 64]], { h: OQ + 5 });
town.slanted([[170, 60], [180, 60], [180, 88], [170, 76]], { h: OQ + 6.5, wall: 'adobe-pale', dome: true });
town.slanted([[180, 60], [186, 60], [186, 95], [180, 88]], { h: OQ + 5.5, wall: 'adobe-rose' });
town.slanted([[186, 60], [194, 60], [194, 104], [193, 104], [186, 95]], { h: OQ + 7.5, dome: true });
town.slanted([[157, 76], [160, 76], [170, 88], [157, 88]], { h: OQ + 5.5, wall: 'adobe-ochre' });
town.slanted([[157, 92], [173, 92], [175, 94], [183, 104], [157, 104]], { h: OQ + 6, wall: 'adobe-pale', dome: true });

// 18. The dry wash, two steps below the old quarter: from the houses
// north of it south into the derelict bay. Steps go down into it at the north
// street's east end; it's the low way to the bay.
p.rect(194, 53, 202, 116, town.street(WASH, { floor: 'desert-sand' }));
town.stair(188, 53, 194, 60, { up: 'W', from: WASH, top: OQ, rise: 0.25, floor: 'flagstone', side: 'adobe-brick' });
// Where the loud half's reinforcements come in: the north street's east
// end and the wash's north end.
tagTile(186, 55, 'quarter-north');
tagTile(198, 55, 'quarter-north');

// 10. The derelict bay: an old docking bay half full of sand, a pit like
// Bay 87. Its gate is at the main street's end: a
// passage through its building onto a landing at the old quarter's height,
// and stairs down. The wash breaks in on the north-east, down sand steps.
// A stand-in hull for the freighter (Rusk in its hold, behind a door in
// the stern that opens once the fob has his signal), and a stand-in crane
// on the rim, seen down the street.
const DERELICT = { cx: 186, cy: 128, r: 18, floorZ: -5, rim: 7 };
p.rect(162, 104, W - 1, H - 1, town.roofCell({ h: DERELICT.rim, wall: 'bay-wall', skirt: null }));
town.circle(DERELICT.cx, DERELICT.cy, DERELICT.r, {
  inside: town.street(DERELICT.floorZ, { floor: 'desert-sand', side: 'bay-wall' }),
  wall: { wall: 'bay-wall', wallTop: DERELICT.rim },
  seam: 90,
});
town.arch(183, 104, 189, 110, { h: DERELICT.rim, lintel: 4, floorZ: OQ, wall: 'bay-wall', floor: 'bay-floor' });
p.rect(183, 110, 189, 113, (_, __, c) => ({ ...c, floor: 'bay-floor', floorZ: OQ }));
town.stair(183, 113, 189, 125, { up: 'N', from: DERELICT.floorZ, top: OQ, floor: 'bay-floor', side: 'bay-wall' });
p.rect(194, 104, 202, 112, town.street(WASH, { floor: 'desert-sand', side: 'bay-wall' }));
town.stair(194, 112, 202, 122, { up: 'N', from: DERELICT.floorZ, top: WASH, floor: 'desert-sand', side: 'bay-wall' });
town.block(191, 106, 192, 107, { h: 18, wall: 'metal-rust', roof: 'metal-rust', skirt: null });
const HULL = { wall: 'metal-grey', roof: 'metal-grey', skirt: null };
town.house(172, 130, 190, 139, { h: DERELICT.floorZ + 5, r: 2, ...HULL });
town.room(174, 131, 188, 138, { h: DERELICT.floorZ + 5, floorZ: DERELICT.floorZ, ceilZ: DERELICT.floorZ + 3.25, floor: 'imp-floor', ceiling: 'imp-panel-dark', wall: 'metal-grey', light: 120 });
town.arch(188, 132, 189, 137, { h: DERELICT.floorZ + 5, lintel: 3, floorZ: DERELICT.floorZ, wall: 'metal-grey', floor: 'imp-floor' });
town.door(190, 134.5, 'E', { h: DERELICT.floorZ + 5, tex: 'door-grey', width: 5, jamb: false, sign: false, panel: false, step: false, floorZ: DERELICT.floorZ, wall: 'metal-grey' });
p.rect(189, 132, 190, 137, (_, __, c) => ({ ...c, floor: 'imp-floor', tag: 'hold-door', stayOpen: true }));
p.rect(174, 131, 188, 138, (_, __, c) => ({ ...c, tag: 'hold' }));
// Where the loud half's troopers come in: over the rim, and through the gate.
tagTile(170, 112, 'derelict-rim');
tagTile(205, 128, 'derelict-rim');
tagTile(186, 107, 'derelict-gate');
tagTile(143, 110, 'roof-sniper');

// ---------------------------------------------------------------- the middle (blockout)
// Roughed out as the east third is: the cantina south of the market, the
// Jawa junk yard north of it, the back alleys from the market round behind
// the north side's houses to the mouth by the checkpoint, and Bay 86 beside
// the cantina, seen through its gate. The cantina and the alleys are the
// two ways round the blast doors.

// 3. The cantina, laid out after Mark's references (2026-10-30: a fan
// floor plan, film stills, the diorama), with its door on the market (S).
// An entry turns into the vestibule, so the street can't see in, and two
// steps go down into a wide main room: its front corners cut at a slant,
// booth niches between buttress walls along its sides, a stage two steps
// up in an alcove on the east, two alcoves at the back. The bar is a long
// U, its round end to the door and the taps' column inside it, open at the
// back into the back-bar, under a shallow well in the ceiling lit from
// inside (no sky: Mark, 2026-10-30). The back-bar's door leads to a back
// room and a passage up two steps to the back door on the back lane, east
// of the blast doors.
/** Light sources (lamps), added area by area. */
const lights = [];
const CANTINA = { floorZ: -0.5, ceilZ: 3.5, h: 6, wall: WALL, light: 104 };
// A ceiling at `ceilZ` over the open floor in a box, the roof at `h` on
// it (as room() paints), for floors painted some other way: steps, a room
// with angled walls. Those can't take a ceiling, so they'd stay open to the
// sky, in the room's light: the cantina has none (its cut corners are
// panels, models/cantina.js).
const roofOver = (x0, y0, x1, y1, ceilZ, h) => p.rect(x0, y0, x1, y1, (_, __, c) => {
  if (c.line) return { ...c, light: CANTINA.light };
  if (c.wall || (c.floorZ ?? 0) >= ceilZ) return c;
  return { ...c, ceiling: 'sky', ceilZ: SKY, light: town.light, slab: { bottom: ceilZ, top: h, floor: town.roof, ceiling: 'planks', side: CANTINA.wall, light: CANTINA.light } };
});
{
  const { floorZ: F, ceilZ, h, wall, light } = CANTINA;
  const MASS = { h, wall, light, skirt: null };
  const floor = town.street(F, { floor: 'flagstone', side: wall });
  // The building behind S, in the room's light (S keeps the sun on its
  // front and on its dome, which takes the light of the roof under it).
  town.block(87, 88, 118, 119, MASS);
  // The main room, its two alcoves at the back, and the back-bar between them.
  p.rect(88, 90, 110, 107, floor).rect(90, 107, 94, 110, floor).rect(95, 107, 102, 110, floor).rect(103, 107, 107, 110, floor);
  // The front corners, cut at 45 degrees: square wall tiles behind each
  // diagonal and a panel of the wall on it (models/cantina.js), so the
  // ceiling runs right into the corner.
  for (let y = 90; y < 95; y++) town.block(88, y, 183 - y, y + 1, MASS).block(y + 15, y, 110, y + 1, MASS);
  town.things.push(at('cantina-corner', 91, 93, { z: F, angle: 45 }), at('cantina-corner', 107, 93, { z: F, angle: 315 }));
  town.block(88, 99, 92, 102, MASS).block(106, 99, 110, 101, MASS).block(106, 106, 110, 107, MASS);
  // Short walls closing the niches' ends, so each booth's alcove is walled
  // on three sides (and the corners' panels end in them).
  town.block(88, 95, 92, 96, MASS).block(106, 95, 110, 96, MASS).block(88, 105, 92, 106, MASS).block(88, 106, 90, 107, MASS);
  town.block(94, 106, 95, 110, MASS).block(102, 106, 103, 110, MASS);
  p.rect(105, 102, 106, 106, town.street(F + 0.25, { floor: 'planks', side: wall }));
  p.rect(106, 101, 110, 106, town.street(F + 0.5, { floor: 'planks', side: wall }));
  // Warm light over the stage, for the band (to come).
  lights.push({ x: 108, y: 102.5, z: F + 2.5, radius: 3.5, light: 56 }, { x: 108, y: 104.5, z: F + 2.5, radius: 3.5, light: 56 });
  // The bar (models/cantina.js): a pale U of counter round at the door's
  // end (centre 98.5, 100), its east arm stopping short for the bartender,
  // the taps' column inside it, and the back-bar's shelves on its back wall,
  // either side of its door.
  town.things.push(
    at('cantina-bar', 98.5, 100, { z: F, angle: 0 }),
    at('cantina-taps', 98.5, 100 + TAPS.y, { z: F, angle: 0 }),
    at('cantina-shelves', 96.5, 110, { z: F, angle: 0 }),
    at('cantina-shelves', 101, 110, { z: F, angle: 0 }),
  );
  // Stools round the round end and along the arms, half a tile out.
  for (const deg of [200, 235, 270, 305, 340]) {
    const a = (deg * Math.PI) / 180;
    town.things.push(at('cantina-stool', 98.5 + Math.cos(a) * 5, 100 + Math.sin(a) * 5, { z: F }));
  }
  town.things.push(at('cantina-stool', 93.5, 102.5, { z: F }), at('cantina-stool', 93.5, 104.75, { z: F }), at('cantina-stool', 103.5, 102.25, { z: F }));
  // Ceilings: the room's, and the booths' alcoves vaulted (round-topped
  // arches through their depth, models/arch.js) in the walls' plaster, 3.5
  // over the floor, sooty as the walls are. Three along the sides, two at
  // the back.
  roofOver(88, 90, 110, 110, ceilZ, h);
  const VAULT = { h, lintel: 3.5, floorZ: F, wall, floor: 'flagstone', light, grimy: true };
  town.arch(88, 96, 92, 99, { ...VAULT, round: 'E' }).arch(88, 102, 92, 105, { ...VAULT, round: 'E' }).arch(106, 96, 110, 99, { ...VAULT, round: 'W' });
  town.arch(90, 107, 94, 110, { ...VAULT, round: 'N' }).arch(103, 107, 107, 110, { ...VAULT, round: 'N' });
  // A booth in each alcove and on each cut corner (models/cantina.js), its
  // back to the wall, a lamp on its table lighting it.
  const booths = [
    [88, 97.5, 90], [88, 103.5, 90], [110, 97.5, 270], [92, 110, 180], [105, 110, 180],
    [91.28, 92.72, 45], [106.72, 92.72, 315],
  ];
  for (const [x, y, angle] of booths) {
    const a = ((angle - 90) * Math.PI) / 180;
    town.things.push(at('cantina-booth', x, y, { z: F, angle }));
    lights.push({ x: x + Math.cos(a) * BOOTH.table, y: y - Math.sin(a) * BOOTH.table, z: F + 1, radius: 3, light: 56 });
  }
  // Over the bar a shallow well in the ceiling, lit from inside, the canopy
  // ring hanging round it (models/cantina.js): every tile its oval reaches
  // into is the well, so the tiles' steps round the well's edge are behind
  // the ring. The well's top is the ring's; it glows (the model's), and the
  // tiles keep the room's light, so none spills in steps onto the ceiling
  // round it. A lamp in the well lights the bar.
  const WELL = { x: 98.5, y: 100.75, z: ceilZ - CANOPY.drop };
  const wellTop = WELL.z + CANOPY.band;
  if (F + TAPS.pipes !== wellTop) throw new Error(`m1: the taps' pipes reach ${F + TAPS.pipes}, the well's top is ${wellTop}`);
  p.rect(92, 93, 106, 108, (x, y, c) => {
    if (!c.slab || c.line) return c;
    const qx = Math.min(Math.max(WELL.x, x), x + 1);
    const qy = Math.min(Math.max(WELL.y, y), y + 1);
    if (((qx - WELL.x) / CANOPY.rx) ** 2 + ((qy - WELL.y) / CANOPY.ry) ** 2 >= 1) return c;
    return { ...c, slab: { ...c.slab, bottom: wellTop, ceiling: 'adobe-pale' } };
  });
  town.things.push(at('cantina-canopy', WELL.x, WELL.y, { z: WELL.z, angle: 0, lit: light + 16 }));
  lights.push({ x: WELL.x, y: WELL.y, z: wellTop - 0.25, radius: 6, light: 72 });
  // The way in, after Mark's stills (2026-10-30, looked at closer
  // 2026-10-31): a tall round-topped arch cut 3 deep into S's front by the
  // corner block, in shade, sooty as the cantina's vaults are (Mark). At its
  // back an open doorway in a timber frame, dark (the entry behind it dim),
  // the lit sign over it; the entry turns east into the vestibule, so the
  // street can't see in, and two steps go down. On S's front east of the
  // arch, in the street's plaster: a smaller round-topped door of planks
  // (shut), and the hitching ring on a round post in the corner by N.
  town.arch(92, 82, 96, 85, { h, lintel: 5.25, wall: 'adobe-pale', round: 'N', light: 136, grimy: true });
  town.room(93, 85, 95, 86, { h, ceilZ: DOORWAY.h, wall, light: 32 });
  town.room(92, 86, 98, 88, { h, ceilZ: 3.5, wall, light: 40 });
  town.room(96, 85, 101, 88, { h, ceilZ: 3.5, wall, light });
  town.stair(96, 88, 101, 90, { up: 'N', from: F, top: 0, rise: 0.25, floor: 'flagstone', side: wall });
  roofOver(96, 88, 101, 90, 3.5, h);
  town.things.push(at('cantina-doorframe', 94, 85, { angle: 180 }));
  town.fixture('cantina-sign', 94, 85, 'N', { z: DOORWAY.h + 0.45 });
  town.door(99.5, 82, 'N', { h, tex: 'door-planks', width: 3, tall: 4, wall: 'adobe-pale', jamb: false, sign: false, panel: false, round: true });
  town.things.push(at('ring-post', 101.5, 81.5), at('hitching-ring', 101.5, 80.99, { z: 1.5, angle: 180 }));
  // The droid detector on the vestibule's wall, and a bulb over the steps.
  town.fixture('cantina-detector', 101, 86.5, 'W', { z: 1 });
  town.things.push(at('cantina-lamp', 98.5, 87.5, { z: 3.5 - LAMP_CORD }));
  lights.push({ x: 98.5, y: 87.5, z: 2.5, radius: 4, light: 40 });
  // (S's walls round them in the room's light; the rooms' own tiles keep the
  // sun on the roof over them, under S's dome, which takes its light.)
  p.rect(91, 84, 102, 89, (_, __, c) => (c.slab || c.door ? c : { ...c, light }));
  // The way out: the back-bar's door, a back room, and a passage up two
  // steps to the back door.
  town.door(99, 111, 'S', { h, tex: 'door-grey', wall, opens: true, floorZ: F });
  town.room(93, 111, 115, 116, { h, floorZ: F, ceilZ, wall, light });
  town.room(112, 104, 115, 111, { h, floorZ: F, ceilZ, wall, light });
  town.room(115, 105, 118, 107, { h, floorZ: F, ceilZ, wall, light });
  town.stair(118, 105, 126, 107, { up: 'E', from: F, top: 0, rise: 0.25, floor: 'flagstone', side: wall });
  roofOver(118, 105, 126, 107, ceilZ, 8);
  town.door(126, 106, 'E', { h: 8, tex: 'door-grey', opens: true });
  // Locked until the switch: the back way is only wanted on the way home.
  p.rect(125, 105, 126, 107, (_, __, c) => ({ ...c, lock: 'remote', tag: 'cantina-back', stayOpen: true }));
  // The back room: kegs, crates and canisters along its walls, a power unit
  // in the far corner, the storeroom's crates and a cargo pod out of the
  // way to the back door; a bulb over each.
  town.things.push(
    at('crate-tan', 93.6, 111.7, { angle: 10 }), at('crate-grey-small', 93.5, 113.1), at('crate-tan', 93.6, 115.3, { angle: 95 }),
    at('barrel-rust', 95.1, 115.5), at('barrel-grey', 95.9, 115.6), at('barrel-rust', 96.7, 115.5), at('barrel-rust', 95.5, 114.8),
    at('canister', 101.6, 115.65), at('canister-rust', 102.1, 115.7),
    at('crate-rust-long', 107.5, 115.2, { angle: 0 }), at('crate-tan', 104.6, 115.3, { angle: 80 }), at('barrel-grey', 110.6, 115.5), at('power-unit', 114.2, 115.2),
    at('crate-grey-small', 105.5, 111.5, { angle: 20 }), at('barrel-rust', 106.4, 111.45),
    at('crate-tan', 112.6, 104.6, { angle: 5 }), at('crate-grey-small', 112.5, 105.9), at('cargo-pod', 114.15, 109.6, { angle: 90 }),
    at('cantina-lamp', 99.5, 113.5, { z: F + 4 - LAMP_CORD }), at('cantina-lamp', 108.5, 113.5, { z: F + 4 - LAMP_CORD }), at('cantina-lamp', 113.5, 107.5, { z: F + 4 - LAMP_CORD }),
  );
  lights.push({ x: 99.5, y: 113.5, z: F + 2.5, radius: 5, light: 40 }, { x: 108.5, y: 113.5, z: F + 2.5, radius: 5, light: 40 }, { x: 113.5, y: 107.5, z: F + 2.5, radius: 4, light: 32 });
  p.light(117, 103, 125, 108, light);
  // The secret back room (docs/mission1.md, Secrets 2): behind the
  // storeroom, through a secret door in the plaster of its north wall, half
  // hidden by its crates. A smuggler's hidey-hole, low and dim: a stash of
  // crates and drums, power cells, a bare bulb, and a ledger on a crate
  // (step up to it to read it).
  const HIDE = F + 3.25;
  town.room(112, 97, 117, 103, { h, floorZ: F, ceilZ: HIDE, wall, light: 96 });
  p.rect(112, 97, 117, 103, (_, __, c) => ({ ...c, secret: true }));
  town.arch(113, 103, 115, 104, { h, lintel: 2.5, floorZ: F, wall, floor: 'flagstone', light });
  p.rect(113, 103, 115, 104, (_, __, c) => ({ ...c, door: wall, style: 'rise', secret: true }));
  p.rect(112, 98, 115, 100, (_, __, c) => ({ ...c, tag: 'ledger' }));
  town.things.push(
    at('crate-tan', 112.9, 97.7, { angle: 8 }), at('cantina-datapad', 112.9, 97.75, { z: F + 0.9, angle: 20 }),
    at('crate-tan', 116.35, 97.7, { angle: 92 }), at('crate-grey-small', 116.35, 97.7, { z: F + 0.9, angle: 15 }),
    at('barrel-rust', 116.4, 99.4), at('barrel-grey', 116.4, 100.2), at('canister-rust', 112.5, 101.9),
    at('power-cell', 114.3, 98.3), at('power-cell', 114.9, 98.8), at('power-cell', 113.8, 100.6),
    at('litter-small', 115, 101.2, { angle: 30 }),
    at('cantina-lamp', 114.5, 100, { z: HIDE - LAMP_CORD }),
  );
  lights.push({ x: 114.5, y: 100, z: F + 2.2, radius: 3.5, light: 36 });
}

// 17. Docking Bay 86, next door: a pit like Bay 87, its door at the end of
// the yard past R. The door is a barred gate: through it you look down on
// customs troopers going through a battered freighter's cargo (a stand-in
// hull). You can't get in.
const BAY86 = { cx: 72, cy: 113, r: 14, floorZ: -5, rim: 6 };
const BAY86_WALL = { h: BAY86.rim, wall: 'bay-wall', skirt: null };
town.block(62, 94, 87, 100, BAY86_WALL).block(57, 100, 87, 130, BAY86_WALL);
town.circle(BAY86.cx, BAY86.cy, BAY86.r, {
  inside: town.street(BAY86.floorZ, { floor: 'bay-floor', side: 'bay-wall' }),
  wall: { wall: 'bay-wall', wallTop: BAY86.rim },
  seam: 90,
});
town.arch(73, 94, 77, 98, { h: BAY86.rim, lintel: 4, wall: 'bay-wall', floor: 'bay-floor' });
p.rect(73, 98, 77, 100, town.street(0, { floor: 'bay-floor', side: 'bay-wall' }));
p.fence(73, 98, 77, 99, 'N', { tex: 'imp-bars', height: 4 });
town.house(64, 107, 80, 117, { h: BAY86.floorZ + 3, r: 2, ...HULL });

// 4. The Jawa junk yard, north of the market: in by the alley between H and
// I, through a gate (shut until the broker hands over the fob) and two
// steps down into a front court, the furnace (a stand-in block) on its
// north side and a side gate east into the back alleys. The trader isn't
// there (Mark, 2026-10-31): a passage slants up its north-west corner
// between two heaps of scrap, too tall to see over, to a lane along the
// low north wall, a crane (a stand-in post) over it. Through a breach in
// the wall, the sandcrawler (a stand-in block, seen from the market over
// I's low roof) has its ramp down, and the trader is in its hold.
const JUNK = -0.5;
const SCRAP = { wall: 'metal-rust', roof: 'metal-rust', skirt: null };
p.rect(54, 1, 101, 16, town.street(0, { floor: 'desert-sand' }));
town.block(62, 4, 98, 14, { ...SCRAP, h: 20 });
town.block(54, 16, 88, 46, { h: 5, wall: 'adobe-brick', skirt: null });
town.block(56, 16, 84, 18, { h: 2, wall: 'adobe-brick', skirt: null });
p.rect(56, 18, 84, 41, town.street(JUNK));
p.rect(71, 44, 73, 49, town.street());
town.arch(71, 41, 73, 44, { h: 5, wall: 'adobe-brick' });
// Its gate is planks like the side gate's, shut until the broker hands Kyle
// the fob: the junk yard is the fob's first stop (Mark, 2026-10-31).
p.rect(71, 41, 73, 44, (_, __, c) => ({ ...c, door: 'door-planks-rising', style: 'rise', lock: 'remote' }));
gateTag(71, 41, 73, 44, 'junk-gate');
town.stair(71, 39, 73, 41, { up: 'S', from: JUNK, top: 0, rise: 0.25, floor: 'flagstone', side: 'adobe-brick' });
town.arch(84, 37, 86, 40, { h: 5, wall: 'adobe-brick' });
town.stair(82, 37, 84, 40, { up: 'E', from: JUNK, top: 0, rise: 0.25, floor: 'flagstone', side: 'adobe-brick' });
// The side gate is weathered planks, shut until the trader keys in the
// signal and lets Kyle out the back (the alleys lead past the blast doors).
p.rect(84, 37, 86, 40, (_, __, c) => ({ ...c, door: 'door-planks-rising', style: 'rise', lock: 'remote' }));
gateTag(84, 37, 86, 40, 'side-gate');
// The two heaps, the passage between them 3 to 5 wide; the east one taller.
town.slanted([[56, 18], [74, 18], [62, 32], [56, 32]], { ...SCRAP, h: JUNK + 2.5 });
town.slanted([[78, 21], [84, 21], [84, 31], [67, 31]], { ...SCRAP, h: JUNK + 3 });
town.block(81, 22, 82, 23, { ...SCRAP, h: 14 });
town.block(78, 31, 82, 33, { ...SCRAP, h: JUNK + 2 });
// The breach (two steps up to the desert) and the ramp (two more, in
// metal) into the hold, junk piled either side so the desert stays out of
// reach. The hold is the crawler's lower deck, dim, the length of it.
town.stair(79, 16, 82, 18, { up: 'N', from: JUNK, top: 0, rise: 0.25, floor: 'flagstone', side: 'adobe-brick' });
town.stair(79, 14, 82, 16, { up: 'N', from: 0, top: 0.5, rise: 0.25, floor: 'imp-grate', side: 'metal-rust' });
town.block(54, 14, 79, 16, { ...SCRAP, h: 2.5 }).block(82, 14, 101, 16, { ...SCRAP, h: 2.5 });
town.room(66, 6, 95, 13, { h: 20, floorZ: 0.5, ceilZ: 5, floor: 'imp-grate', ceiling: 'imp-panel-dark', wall: 'metal-rust', light: 96 });
town.arch(79, 13, 82, 14, { h: 20, lintel: 3.5, floorZ: 0.5, wall: 'metal-rust', roof: 'metal-rust', floor: 'imp-grate', light: 96 });
// The trader who sold Rusk a power coupling, at the hold's far west end,
// a turn left at the top of the ramp: with the fob in hand, he keys its
// transponder code in (the signal).
list.push(
  at('jawa', 68.5, 9.5, {
    angle: 0,
    tag: 'trader',
    name: 'Jawa trader',
    calm: { wander: 0 },
    talk: [
      { unless: 'contract', lines: ['Utinni!', 'Kkkt!'] },
      { unless: 'signal', lines: ["Utinni! M'um m'aloo... eeh-chu-ta?", "(He reads a code off a coupling's tag and keys it into your fob.)"], set: 'signal' },
      { lines: ['Utinni!'] },
    ],
  }),
);

// 7. The back alleys: from the market between I and J into a yard behind J
// (the junk yard's side gate off it), a lane slanting north-east to a
// second yard a step up (the spacers' hostel off it), another slanting
// south-east and up again to a square at the alleys' east end (the
// thug's back room off it), and two steps down into the mouth by the
// checkpoint. Narrow and bending: the quiet way round the blast doors.
// (A slanting lane: between its edges, k0 and k1 at x0 with `slope`, and a
// tile beyond them, for the houses to cut their walls into.)
const lane = (x0, y0, x1, y1, slope, k0, k1, floorZ) => p.rect(x0, y0, x1, y1, (x, y, c) => {
  const k = y + 0.5 - slope * (x + 0.5 - x0);
  return k > k0 - 1 && k < k1 + 1 ? town.street(floorZ) : c;
});
p.rect(86, 36, 98, 49, town.street());
// A gate of planks across the alley, past I's and J's rounded corners at
// its mouth on the market, shut until the signal, as the junk yard's side
// gate is.
town.door(87, 56, 'S', { h: 4.5, tex: 'door-planks', jamb: false, sign: false, panel: false, step: false });
gateTag(86, 55, 88, 56, 'alley-gate');
lane(98, 29, 112, 45, -0.5, 38, 43, 0);
town.slanted([[98, 26], [112, 26], [112, 31], [98, 38]], { h: 6, wall: 'adobe-grey' });
town.slanted([[98, 43], [112, 36], [112, 47], [98, 47]], { h: 5, wall: 'adobe-ochre' });
p.rect(112, 22, 126, 36, town.street(0.25, { side: 'adobe-brick' }));
town.house(112, 12, 126, 22, { h: 8, r: 1, wall: 'adobe-rose' });
town.room(113, 13, 125, 21, { h: 8, floorZ: 0.25, ceilZ: 5, wall: 'adobe-rose', light: 120 });
town.arch(118, 21, 120, 22, { h: 8, lintel: 3.5, floorZ: 0.25, wall: 'adobe-rose' });
lane(126, 23, 136, 39, 0.5, 26, 31, 0.25);
town.slanted([[126, 18], [136, 18], [136, 31], [126, 26]], { h: 7 });
town.slanted([[126, 31], [136, 36], [136, 44], [126, 44]], { h: 6, wall: 'adobe-pale' });
p.rect(136, 30, 146, 42, town.street(OQ));
town.stair(136, 30, 138, 42, { up: 'E', from: 0.25, top: OQ, rise: 0.25, floor: 'flagstone', side: 'adobe-brick' });
town.house(136, 20, 146, 30, { h: 8, r: 1, wall: 'adobe-grey' });
town.room(137, 21, 145, 29, { h: 8, floorZ: OQ, ceilZ: 5.5, wall: 'adobe-grey', light: 112 });
town.arch(140, 29, 143, 30, { h: 8, lintel: 3, floorZ: OQ, wall: 'adobe-grey' });
town.stair(136, 42, 139, 48, { up: 'N', top: OQ, rise: 0.25, floor: 'flagstone', side: 'adobe-brick' });

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
// Inside the cantina, filthy (Mark): soot, dirt, stains and smudges thick on
// every wall from floor to ceiling.
town.grimeIndoors(87, 82, 127, 119, { amount: 4 });
// Crates, drums, canisters, cargo pods, junk and litter along the walls
// (lib/town.js), but none yet in the blocked-out middle and east third.
town.clutter({ keep: [[126, 92, 130, 122], [130, 86, 150, 122], [136, 44, W, H], [54, 1, 146, 49], [57, 94, 87, 131], [87, 82, 126, 122], [85, 76, 102, 82]] });
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
  at('dewback', 44.5, 64.5, { angle: 180 }),
  // An X-34 landspeeder left in the middle of the square's quiet south-east
  // corner, out of the way, nose north-west at about 40 degrees to the walls
  // (Mark: near 45, but not exactly).
  at('landspeeder', 56.5, 93.8, { angle: 141 }),
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

// The blast doors have stood shut long enough for the street's rubbish to
// pile against their feet: rubble and litter in the corners, a rusty
// canister tucked in the south-west corner (the rest isn't solid, so the
// way through stays clear when they open).
list.push(
  at('rubble', 103.4, 64.7, { angle: 20 }), at('litter-small', 103.2, 67.5, { angle: 70 }), at('canister-rust', 103.35, 75.55),
  at('litter', 102.9, 74.6, { angle: 200 }), at('rubble', 106.6, 75.3, { angle: 140 }), at('litter-small', 106.8, 65.2, { angle: 310 }),
);

// The Moldy Crow, hovering in the bay in front of you, nose east and
// turned 20 degrees off square (Mark: parked too perfectly), a little south
// of the maintenance pit: its gun pod (solid) would block the way along the
// pit to its secret.
list.push(at('moldy-crow', 34, 128.5, { angle: 340 }));
// Under its middle, clear of the pit: back here once the bay is unlocked,
// the level ends.
p.rect(28, 126, 41, 133, (_, __, c) => ({ ...c, tag: 'crow' }));

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
// market, and a guard stands at the blast doors, looking down the street:
// use him and he says they're shut until the garrison says otherwise.
// Two Jawas haggle at the droid seller's pen and two more stand by the
// street; one strolls the street and one the north back lane.
const STREET_PATROL = [[12.5, 67], [60.5, 67], [101.5, 66]];
list.push(
  at('sandtrooper-commander', 14.5, 67, { calm: { patrol: STREET_PATROL, idleTime: [3, 3] } }),
  at('sandtrooper', 14.5, 68.6, { calm: { patrol: STREET_PATROL.map(([x, y]) => [x, y + 1.6]), idleTime: [3, 3] } }),
  at('sandtrooper-commander', 86.5, 61, { angle: 180, calm: { wander: 0 } }),
  at('sandtrooper', 84.5, 61, { angle: 0, calm: { wander: 0 } }),
  at('sandtrooper', 103, 71, {
    angle: 180,
    calm: { wander: 0 },
    talk: [
      { unless: 'signal', lines: ['The east is sealed, hunter.', 'The doors open when the garrison says so.'] },
      { lines: ['Orders came down. The east is open.'] },
    ],
  }),
  at('jawa', 95, 60.6, { angle: 0, calm: { wander: 0 } }), at('jawa', 99.2, 61, { angle: 180, calm: { wander: 0 } }),
  at('jawa', 22, 70, { angle: 90, calm: { wander: 0 } }), at('jawa', 116, 68, { angle: 180, calm: { wander: 0 } }),
  at('jawa', 68, 70, { calm: { wander: 3 } }), at('jawa', 50, 47, { calm: { wander: 4 } }),
);

// The east third's calm troopers, and the stand-ins for its people. The
// checkpoint's guards on its steps; a patrol walking the old quarter's main
// street; a guard on its north street. The informant (a villager until
// his sheet exists) in his den (use him for the pass), a squatter in the gate square, and Rusk (a
// villager too) in the freighter's hold. Customs' two troopers stand in
// their office, by the terminal that unlocks the bay at the end.
const CHECKPOINT_LINES = ["Old quarter's sealed, hunter.", 'No pass, no way through.'];
const QUARTER_PATROL = [[153.5, 68], [165.5, 79], [178.5, 94]];
list.push(
  at('sandtrooper', 144.6, 65.7, { angle: 180, calm: { wander: 0, lines: CHECKPOINT_LINES } }),
  at('sandtrooper', 144.6, 68.3, { angle: 180, calm: { wander: 0, lines: CHECKPOINT_LINES } }),
  at('sandtrooper-commander', 142, 67, { angle: 180, calm: { wander: 0, lines: CHECKPOINT_LINES } }),
  at('sandtrooper', 153.5, 68, { calm: { patrol: QUARTER_PATROL, idleTime: [3, 3] } }),
  at('sandtrooper', 155, 66.6, { calm: { patrol: QUARTER_PATROL.map(([x, y]) => [x + 1.5, y - 1.4]), idleTime: [3, 3] } }),
  at('sandtrooper', 171, 57.5, { angle: 270, calm: { wander: 0, lines: ['Move along.'] } }),
  // Two customs troopers in Bay 86, either side of the freighter.
  at('sandtrooper', 82.5, 113, { angle: 180, calm: { wander: 0 } }), at('sandtrooper', 61.5, 116, { angle: 0, calm: { wander: 0 } }),
  at('sandtrooper', 15.2, 102.4, { angle: 90, calm: { wander: 0, lines: ['Your papers check out, hunter.', 'Move along.'] } }),
  at('sandtrooper', 18.2, 102.2, { angle: 90, calm: { wander: 0, lines: ['Your papers check out, hunter.', 'Move along.'] } }),
  // The informant, in his den: once the fob has Rusk's signal, his pass
  // opens the checkpoint.
  at('villager-wanderer', 143, 55.5, {
    angle: 180,
    wander: 0,
    tag: 'informant',
    name: 'INFORMANT',
    talk: [
      { unless: 'signal', lines: ['Nothing for you, hunter.', "Come back when you know where you're going."] },
      { unless: 'pass', lines: ["You'll be wanting the old quarter.", "Here. A pass. The checkpoint won't stop you."], set: 'pass' },
      { lines: ['Go on, before someone sees us talking.'] },
    ],
  }),
  at('villager-man', 152, 73),
  // Rusk, in the freighter's hold: what the fob tracks once the trader's code is in.
  at('villager-man', 180, 134.5, { angle: 0, wander: 0, tag: 'rusk', name: 'RUSK' }),
  at('barricade-worn', 137.6, 63.6, { angle: 20 }), at('barricade-worn', 137.6, 69.8, { angle: 335 }),
  at('floodlight-tower-worn', 141.4, 62), at('floodlight-tower-worn', 139.7, 72.3),
  // What the troopers found in town: drums rolled in to close the gap
  // south of the barricades (the north one stays open, the alleys' mouth),
  // and a power unit for the floodlights, its cable on the ground.
  at('barrel-rust', 137.4, 71.75), at('barrel-grey', 138.05, 72.35), at('canister', 137.2, 72.55),
  at('power-unit', 140, 62.2, { angle: 270 }),
  // The guard post under the tarp: a terminal on crates brought in.
  at('crate-tan', 142.2, 72.2, { angle: 4 }), at('terminal', 142.2, 72.2, { z: OQ + 0.9, angle: 90 }),
  at('crate-grey-small', 141, 72.5, { angle: 350 }), at('cargo-pod', 141.6, 70.7, { angle: 85 }),
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
  // The water seller by his tap (a villager until his sheet exists), and the queue waiting for it.
  at('villager-man', 79.6, 73, { angle: 180, wander: 0 }),
  at('villager-woman', 78, 74.3, { angle: 90, wander: 0 }), at('villager-boy', 78.2, 75.5, { angle: 90, wander: 0 }),
  at('villager-wanderer', 77.9, 76.7, { angle: 100, wander: 0 }),
);

// The cantina's front, after Mark's stills (2026-10-30, 2026-10-31): the
// white dome pod in front of the cut corner, three Jawas against the wall
// in front of the smaller door, and in the nook against N a dewback at a
// stone trough along N's wall, and a drum.
list.push(
  at('dome-pod', 87.6, 81.6, { angle: 60 }),
  at('jawa', 97.3, 81.15, { angle: 80, calm: { wander: 0 } }), at('jawa', 98.05, 81.15, { angle: 95, calm: { wander: 0 } }), at('jawa', 98.8, 81.15, { angle: 100, calm: { wander: 0 } }),
  at('dewback', 99.8, 77.4, { angle: 90 }), at('water-trough', 101.5, 77.6, { angle: 90 }), at('barrel-grey', 96.6, 79.2),
);

// The cantina's people. Bossk drinking at the bar and Boba Fett watching
// the room from the east alcove, calm until the town turns (then they fight
// with the troopers). Two sandtroopers just in from the street at the foot
// of the steps. Villagers stand in, staying put, until Mark's sheets exist
// (docs/mission1.md, Characters): the bartender inside the bar, the broker
// in the west back alcove (use him to talk),
// customers at the bar and the booths, and the band on the stage.
list.push(
  at('bossk', 94.3, 96.8, { angle: 322, calm: { wander: 0, lines: ['Hsss. Find your own bounty.', 'This one is mine, hunter.'] } }),
  at('boba-fett', 106.9, 97.5, { angle: 180, calm: { wander: 0, lines: ['...', 'Not interested.'] } }),
  at('sandtrooper', 96.4, 91.2, { angle: 290, calm: { wander: 0 } }), at('sandtrooper', 100.6, 91.2, { angle: 250, calm: { wander: 0 } }),
  at('villager-man', 98.5, 104, { angle: 90, wander: 0 }),
  // The broker: the Guild's contract, then where to look (the fob is to come).
  at('villager-adventurer', 92, 107.3, {
    angle: 90,
    wander: 0,
    tag: 'broker',
    name: 'BROKER',
    talk: [
      {
        unless: 'contract',
        lines: [
          'Katarn. Sit down.',
          'The Guild has a contract on a deserter. A scout trooper, Rusk.',
          'He wiped his ID code, so this fob has nothing to track. Yet.',
          'The Jawas tag what they sell. Try their junk yard.',
          'North of the market. Look for the sandcrawler.',
        ],
        set: 'contract',
      },
      { lines: ["You've got the job. Go.", 'The junk yard, Katarn. Look for the sandcrawler.'] },
    ],
  }),
  at('villager-woman', 96.83, 94.86, { angle: 288, wander: 0 }), at('villager-wanderer', 100.17, 94.86, { angle: 252, wander: 0 }),
  at('villager-man', 93.3, 103.6, { angle: 0, wander: 0 }),
  at('villager-adventurer', 90.9, 97.5, { angle: 180, wander: 0 }), at('villager-woman', 93.6, 95, { angle: 135, wander: 0 }),
  at('villager-man', 104, 106.5, { angle: 0, wander: 0 }), at('villager-woman', 105.4, 106.5, { angle: 180, wander: 0 }),
  at('villager-man', 108.4, 102.4, { angle: 180, wander: 0 }), at('villager-wanderer', 108.9, 103.5, { angle: 180, wander: 0 }), at('villager-adventurer', 108.4, 104.6, { angle: 180, wander: 0 }),
);

// The cantina's floor, filthy too (Mark): spills, burns and scuffs all over
// it (models/stains.js, grime lying on the floor), dirt banked against the
// walls' feet and where it's tracked in (the foot of the steps, inside the
// street door), and litter underfoot. Scattered from a fixed seed, on floor
// under the cantina's ceilings only.
{
  let s = 1030;
  const rnd = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
  const indoors = (x, y) => {
    const c = p.get(Math.floor(x), Math.floor(y));
    return c && !c.wall && !c.door && c.slab && (c.floorZ ?? 0) < 0;
  };
  const scatter = (types, n, [x0, y0, x1, y1]) => {
    for (let k = 0; k < n; k++) {
      const [x, y] = [x0 + rnd() * (x1 - x0), y0 + rnd() * (y1 - y0)];
      const type = types[Math.floor(rnd() * types.length)];
      const angle = Math.floor(rnd() * 24) * 15;
      if (indoors(x, y)) list.push(at(type, Math.round(x * 100) / 100, Math.round(y * 100) / 100, { z: CANTINA.floorZ, angle }));
    }
  };
  const ROOM = [88, 90, 110, 107];
  const BACK = [93, 111, 115, 116];
  scatter(['floor-spill-1', 'floor-spill-2', 'floor-spill-1'], 48, ROOM);
  scatter(['floor-burn-1', 'floor-burn-2'], 12, ROOM);
  scatter(['floor-scuff'], 34, ROOM);
  scatter(['floor-spill-1', 'floor-spill-2', 'floor-scuff', 'floor-burn-1'], 18, BACK);
  scatter(['litter', 'litter-small', 'litter-small'], 12, ROOM);
  scatter(['litter', 'litter-small'], 4, BACK);
  // Dirt against the walls' feet: on about one in three floor tiles beside a
  // wall, its dark edge to the wall (angle 0 puts it to the south).
  const solid = (x, y) => {
    const c = p.get(x, y);
    return !c || c.wall || (!c.slab && (c.floorZ ?? 0) >= 5);
  };
  for (let y = 83; y < 119; y++) {
    for (let x = 87; x < 127; x++) {
      if (!indoors(x + 0.5, y + 0.5)) continue;
      for (const [dx, dy, angle] of [[0, -1, 180], [0, 1, 0], [1, 0, 90], [-1, 0, 270]]) {
        if (!solid(x + dx, y + dy) || rnd() > 0.33) continue;
        const type = rnd() < 0.5 ? 'floor-dirt-1' : 'floor-dirt-2';
        const off = 0.5 - (type === 'floor-dirt-1' ? 1 : 1.25) / 2;
        list.push(at(type, x + 0.5 + dx * off, y + 0.5 + dy * off, { z: CANTINA.floorZ, angle }));
      }
    }
  }
  list.push(at('floor-dirt-2', 98.5, 90.62, { z: CANTINA.floorZ, angle: 180 }), at('floor-dirt-1', 92, 86.5, { z: 0, angle: 180 }));
}

// Jawas in the cantina too (Mark): two at the bar's east side and one by the
// east corner's booth, calm until the town turns.
list.push(
  at('jawa', 103.6, 100.6, { angle: 180, calm: { wander: 0 } }), at('jawa', 103.7, 103.6, { angle: 170, calm: { wander: 0 } }),
  at('jawa', 104.3, 94.6, { angle: 45, calm: { wander: 0 } }),
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
  // At the checkpoint: one across the gap in front of the passage, and the
  // floodlight's from its power unit, slack on the ground.
  { type: 'cable', from: [145.3, 65.05, 5.8], to: [145.1, 68.95, 5.3], sag: 0.6 },
  { type: 'cable', from: [140.2, 62.2, 1.3], to: [141.3, 62, 1.5], sag: 1.1 },
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
  lights,
  hangings: [...hangings, ...town.hangings],
  par: 600,
  // Kyle's blaster stays holstered until the town turns, so it turns only
  // when he finds Rusk (Mark, 2026-10-30).
  holster: true,
  // The story so far: the broker's contract and the informant's pass are
  // conversations (the pass opens the checkpoint). Stand-ins until the fob
  // and the drop-off exist (docs/story.md): finding Rusk turns the town,
  // and the pickup is the way home: customs locks the bay, its terminal in
  // the customs house unlocks it, and back at the Crow the level ends.
  triggers: [
    // Jan on landing, so the first stop is named.
    { on: 'start', do: [{ action: 'message', text: "JAN: YOUR BROKER'S IN THE CANTINA, ON THE MARKET." }, { action: 'message', text: 'JAN: UP THE STAIRS AND EAST ALONG THE MAIN STREET.' }] },
    {
      on: 'enter',
      tag: 'ledger',
      do: [
        { action: 'message', text: "A LEDGER: 'PASSAGE FOR A SCOUT. NO NAME. PAID IN IMPERIAL SCRIP.'" },
        { action: 'message', text: "'WANTS OFF-WORLD BEFORE THE IMPERIALS' NEXT FIELD TEST IN THE JUNDLAND.'" },
      ],
    },
    { on: 'talk', tag: 'informant', if: 'pass', do: [{ action: 'openDoors', tag: 'checkpoint' }] },
    // At the checkpoint's foot with the signal and no pass, the informant calls Kyle over from his den.
    { on: 'enter', tag: 'checkpoint-foot', if: 'signal', unless: ['pass', 'loud'], do: [{ action: 'message', text: 'INFORMANT: PSST. HUNTER. WANT A PASS?' }] },
    // The fob: the broker gives it (dark) and the junk yard's gate opens,
    // the trader's code points it at Rusk, opens the hold and opens the east
    // (the blast doors, and the alleys from the market and the junk yard),
    // and in the hold Rusk pulls its Imperial tracer and the town turns.
    { on: 'talk', tag: 'broker', if: 'contract', do: [{ action: 'giveWeapon', weapon: 'fob' }, { action: 'message', text: 'THE BROKER HANDS YOU A TRACKING FOB.' }, { action: 'openDoors', tag: 'junk-gate' }] },
    {
      on: 'talk',
      tag: 'trader',
      if: 'signal',
      do: [
        { action: 'setSignal', tag: 'rusk' },
        { action: 'openDoors', tag: 'hold-door' },
        { action: 'openDoors', tag: 'blast-doors' },
        { action: 'openDoors', tag: 'side-gate' },
        { action: 'openDoors', tag: 'alley-gate' },
      ],
    },
    {
      on: 'enter',
      tag: 'hold',
      if: 'signal',
      do: [
        { action: 'message', text: "RUSK (STAND-IN): THAT FOB IS IMPERIAL. THEY'RE ALREADY HERE." },
        { action: 'takeWeapon', weapon: 'fob' },
        { action: 'setSignal' },
        { action: 'hostile' },
      ],
    },
    {
      on: 'hostile',
      do: [
        // The blast doors shut, so the way home is round them: Jan says so
        // here, and names the ways at the checkpoint's foot.
        { action: 'setFlag', flag: 'loud' },
        { action: 'message', text: "JAN: THEY'VE SEALED THE BLAST DOORS. GO ROUND THEM." },
        { action: 'closeDoors', tag: 'blast-doors' },
        { action: 'lockDoors', tag: 'bay-door' },
        { action: 'openDoors', tag: 'cantina-back' },
        { action: 'openDoors', tag: 'checkpoint' },
        { action: 'spawn', thing: 'sandtrooper', tag: 'derelict-rim' },
        { action: 'spawn', thing: 'sandtrooper', tag: 'derelict-gate' },
        { action: 'spawn', thing: 'sandtrooper', tag: 'quarter-north' },
        { action: 'spawn', thing: 'sandtrooper', tag: 'roof-sniper' },
      ],
    },
    { on: 'enter', tag: 'checkpoint-foot', if: 'loud', do: [{ action: 'message', text: "JAN: THE ALLEYS TO THE NORTH, OR THE CANTINA'S BACK DOOR." }] },
    // The way home: the bay door is locked, its controls in the customs house.
    { on: 'enter', tag: 'bay-lane', if: 'loud', unless: 'bay-open', do: [{ action: 'message', text: 'JAN: CUSTOMS HAS LOCKED THE BAY. ITS CONTROLS ARE IN THE CUSTOMS HOUSE, WEST ALONG THE LANE.' }] },
    {
      on: 'use',
      tag: 'bay-controls',
      if: 'loud',
      do: [
        { action: 'unlockDoors', tag: 'bay-door' },
        { action: 'setFlag', flag: 'bay-open' },
        { action: 'sound', id: 'switch' },
        { action: 'message', text: 'BAY 87 UNLOCKED.' },
        { action: 'message', text: 'JAN: GOT IT. GET TO THE CROW.' },
      ],
    },
    { on: 'enter', tag: 'crow', if: 'bay-open', do: [{ action: 'message', text: "JAN: CUSTOMS WON'T BE CHECKING PAPERS NOW." }, { action: 'takeWeapon', weapon: 'fob' }, { action: 'exit' }] },
  ],
  ...p.build(),
  things: [],
  list,
});
