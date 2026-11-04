import { defineLevel } from '../../engine/defs.js';
import { WALL, BOOTH, TAPS, CANOPY, LAMP_CORD, DOORWAY } from '../models/cantina.js';
import { Painter } from './lib/painter.js';
import { Town } from './lib/town.js';
import { CISTERN } from '../models/market.js';
import { BAY_HOSES } from '../models/bay.js';
import { JUNK_PILES } from '../models/junk-pile.js';
import { FREIGHTER } from '../models/freighter.js';

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
// A decal on a slanting wall from a to b, `t` of the way along it, its
// middle at height z.
const onSlant = ([ax, ay], [bx, by], t, z, tex, scale = 1) => ({ x: ax + (bx - ax) * t, y: ay + (by - ay) * t, z, face: 'angled', tex, ...(scale !== 1 && { scale }) });
// The plasters, plain ones the most common.
const PLASTERS = ['adobe', 'adobe', 'adobe-pale', 'adobe-pale', 'adobe-ochre', 'adobe-rose', 'adobe-grey'];
// The feet of the walls (lib/town.js, SKIRTS): not every house has one.
const SKIRTS = ['dirt', 'dirt', 'plinth', null];
const list = [];
// Light sources (lamps indoors), for the level's `lights`.
const lights = [];

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

// 11. The dewback stable, across the north back lane from B to D: a long low
// house open along its front between timber posts under a beam, a slatted
// roof the suns fall through in stripes, dim and dusty under the slats.
// Four stalls along the back wall behind plank rails, each 7 wide, the posts
// in line with the rails, a ring and a water trough in each. The patrol's
// spare dewbacks stand out in the aisle in the middle (their sprites are 6
// wide, so in a stall they cut through the rails), nose to nose at a feed
// trough (a halved drum), tied to the middle post. The third stall is being
// mucked out by the stable hand; the fourth holds the patrol's saddles on a
// rack, feed canisters and an Imperial supply crate.
const STABLE = { x0: 22, y0: 31, x1: 50, y1: 44 };
town.house(STABLE.x0 - 2, STABLE.y0 - 2, STABLE.x1 + 2, STABLE.y1, { h: 6, r: 1, wall: 'adobe-ochre' });
p.rect(STABLE.x0, STABLE.y0, STABLE.x1, STABLE.y1, town.street());
// The beam along the front, then the slats behind it.
p.rect(STABLE.x0, STABLE.y1 - 1, STABLE.x1, STABLE.y1, (x, y, c) => ({ ...c, slab: { bottom: 4.25, top: 5, floor: 'planks', ceiling: 'planks', side: 'planks', light: 144 } }));
town.slats(STABLE.x0, STABLE.y0, STABLE.x1, STABLE.y1 - 1, { z: 4.5 });
const STALL_RAILS = [29, 36, 43];
// (The rails are 6 long, placed by their middle.)
for (const x of STALL_RAILS) list.push(at('stall-rails', x, STABLE.y0 + 3), at('stable-post', x, STABLE.y1 - 0.5));
// The rings and troughs, and the dewbacks a sprite's half-width (3) or more
// clear of the rails and posts. (Things against the back wall are lit as
// under the slats: the light at the wall's foot is darker.)
const UNDER = 128;
town.fixture('hitching-ring', 27.5, STABLE.y0, 'S', { z: 1.3 }).fixture('hitching-ring', 30.5, STABLE.y0, 'S', { z: 1.3 });
list.push(
  at('dewback', 32.5, 41, { angle: 0 }), at('dewback', 39.5, 41, { angle: 180 }), at('feed-trough', 36, 40.9),
  at('water-trough', 25, 31.55, { lit: UNDER }), at('water-trough', 33, 31.55, { lit: UNDER }), at('water-trough', 39.5, 31.55, { lit: UNDER }),
  // The third stall, being mucked out.
  at('villager-man', 39.2, 35.6, { angle: 200, wander: 0 }), at('litter', 40.6, 34.4, { angle: 60 }), at('oil-small', 38.2, 33.6, { angle: 130 }),
  // The fourth: the patrol's tack and feed.
  at('crate-tan', 44.2, 32, { lit: UNDER }), at('canister-rust', 49.3, 32, { lit: UNDER }), at('canister-rust', 49.4, 32.7, { lit: UNDER }), at('canister', 48.7, 32.3, { lit: UNDER }),
  at('supply-crate', 48.8, 35.6),
  // In the aisle, a barrel of water by the west wall.
  at('barrel-grey', 22.6, 40.2),
);
list.push(at('saddle-rack', 46.5, STABLE.y0 + 0.01, { lit: UNDER }));
town.hangings.push(
  { type: 'cable', from: [35.95, 43.35, 1.6], to: [34.9, 41.1, 1.35], sag: 0.35 },
  { type: 'cable', from: [36.05, 43.35, 1.6], to: [37.1, 40.9, 1.35], sag: 0.35 },
);

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
p.rect(71, 49, 75, 58, town.street());
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
// I: a long low house, a wide shutter and a door under an awning. Its
// west corner is cut back at 45 degrees, so the alley to the junk yard
// opens wide onto the market and shows from across it (Mark, 2026-10-31:
// the way from the cantina was hard to find).
town.slanted([[75, 51], [86, 51], [86, 58], [78, 58], [75, 55]], { h: 4.5, skirt: 'plinth', dome: true });
town.door(80.5, 58, 'S', { h: 4.5, tex: 'shutter', tall: 2.25, width: 3, jamb: false, sign: false, panel: false });
town.door(84, 58, 'S', { h: 4.5 });
town.awning(78, 58, 86, 60, { z: 3, face: 'S', cloth: 'olive' });
// J: a tall house, its upper storey at the back, the speeder garage in it
// (its shutter rolled up: it's with the back alleys, below, whose yard its
// back shutter opens onto).
town.house(88, 47, 101, 58, { h: 7, r: 2, wall: 'adobe-grey', skirt: null, tiers: [{ box: [90, 47, 101, 53], h: 10, r: 2 }], dome: true });
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
town.stall(62, 60, 65, 64, 'E', { cloth: 'umber' }).stall(62, 76, 65, 80, 'E', { cloth: 'teal' }).stall(66, 77, 70, 80, 'N', { cloth: 'olive' });
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
town.room(140, 52, 146, 60, { h: 7, wall: 'adobe-grey', light: 128 });
town.arch(139, 54, 140, 57, { h: 7, lintel: 3, wall: 'adobe-grey' });
// The informant's den: a crate for a table with his datapad, a stool, his
// stock in crates, and a window onto the checkpoint's steps he watches
// from (too small to climb through), a terminal under it; a rag hung
// half across his doorway. The mouth outside: a downpipe and a window on
// the house opposite, crates at the foot of the steps, a cable over.
windowThrough(140, 142, 60, { sill: 1.4, top: 2.3, light: 128 });
p.light(140, 51, 147, 52, 128).light(146, 52, 147, 60, 128);
town.window(136, 55.5, 'E', { z: 3.4, tex: 'window-louvre' }).pipe(136, 58.4, 'E');
list.push(
  at('crate-tan', 144.6, 53.2, { angle: 6 }), at('cantina-datapad', 144.55, 53.2, { z: 0.9, angle: 30 }), at('cantina-stool', 143.6, 53.95),
  at('crate-rust-long', 145.2, 57.7, { angle: 90 }), at('crate-grey-small', 145.35, 56.2, { angle: 12 }), at('canister-rust', 140.6, 52.6),
  at('terminal', 142.7, 59.4, { angle: 90 }),
  at('cantina-lamp', 143, 55.5, { z: 4.5 - LAMP_CORD }),
  at('crate-tan', 136.55, 49.1, { angle: 85 }), at('barrel-rust', 136.45, 50.35), at('litter-small', 137.6, 52.4, { angle: 15 }),
);
lights.push({ x: 143, y: 55.5, z: 2.5, radius: 4, light: 32 });
town.hangings.push(
  { type: 'rag', from: [139.5, 54.1, 2.95], to: [139.5, 55.6, 2.95], length: 1.6 },
  { type: 'cable', from: [136.05, 53.4, 6.6], to: [138.95, 50.6, 5.8], sag: 0.4 },
);
// South of it, too tall to climb from the roofs behind.
p.rect(136, 73, 148, 86, town.street());
town.house(136, 73, 141, 86, { h: 8, r: 1, skirt: 'plinth' });
town.house(141, 73, 148, 86, { h: 9.5, r: 1, wall: 'adobe-pale' });

// 6. The rooftops east of the back lane's end, out of reach (Mark,
// 2026-11-01: no way up; the rubble that climbed onto them and the stair
// from the yard are gone). Light wells 3 wide between them, open to the lane.
p.rect(126, 92, 130, 118, town.street());
p.rect(130, 86, 149, 118, town.street());
town.house(118, 92, 126, 120, { h: 8 });
// South of the back door the cantina's storehouse, lower and its own, a
// slot between them (Mark, 2026-11-02: not one wall down the lane), so the
// cantina's back rises over its roof.
p.rect(124, 109, 126, 110, town.street());
town.house(121, 110, 126, 120, { h: 5.5, wall: 'adobe-pale', skirt: 'plinth' });
town.slanted([[132, 102], [138, 102], [138, 118], [130, 118], [130, 104]], { h: 4.75 });
town.house(138, 102, 149, 118, { h: 5.75, wall: 'adobe-ochre' });
town.house(130, 86, 140, 99, { h: 4.75, wall: 'adobe-pale' });
town.house(143, 86, 149, 102, { h: 5.25, wall: 'adobe-rose' });
town.block(126, 118, 150, 122, { h: 8 }).block(149, 96, 162, 118, { h: 8 });

// 19. The back lane: the cantina's service lane, in the shade of its back
// wall. Its empties wait by the back door for the brewer, its rubbish is
// piled across from them (a Jawa picking through it), and its machinery
// hangs on the wall: a power unit and its conduit, a water tank, the fan
// that draws the smoke out of the room. The rooftops' houses back onto the
// lane's east side, their washing strung across the light well between them
// (the corner at its mouth cut back, so it opens off the lane). The lane
// ends at a house whose door stands two steps up, on a little paved yard.
town.platform(126, 112, 130, 118, { h: 0.5, steps: 'N' });
town.door(128, 118, 'N', { h: 8, tex: 'door-grey', floorZ: 0.5 });
town.window(130, 92.5, 'W', { z: 2.6, tex: 'window-louvre' }).window(130, 108.5, 'W', { z: 2.4 }).window(140, 94.5, 'E', { z: 2.6 });
town.pipe(126, 89.5, 'E').pipe(130, 97.6, 'W').pipe(130, 115.5, 'W', { floorZ: 0.5 });
town.fixture('conduit-6', 126, 95.5, 'E', { z: 2.2 }).fixture('wall-tank', 126, 99.6, 'E', { z: 3.2 });
town.vent(126, 96.2, 'E', { z: 5.6, tex: 'wall-fan' }).vent(126, 110.2, 'E', { z: 4.4, tex: 'vent-grille' }).vent(126, 94.3, 'E', { z: 1.5, tex: 'wall-meter' });
// (The lane and the wells are backs: twice as weathered as the street.)
town.grimeBoxes.push([118, 86, 149, 122, 2]);
list.push(
  // The cantina's power, against its wall under the conduit.
  at('power-unit', 126.01, 92.4, { angle: 90 }),
  // Empties by the back door: kegs (drums), a canister or two, stacked crates.
  at('barrel-rust', 126.45, 100.9), at('barrel-grey', 126.5, 101.65), at('barrel-rust', 127.2, 101.25),
  at('barrel-rust', 126.45, 102.4), at('canister', 126.4, 103.2), at('canister-rust', 126.85, 103.35, { angle: 40 }),
  at('floor-spill-1', 127.3, 104.2, { angle: 30 }), at('floor-spill-2', 127.6, 107.4, { angle: 200 }),
  // The rubbish across the lane: a heap, a broken crate, scrap and litter,
  // grease soaked into the sand, and a Jawa going through it.
  at('junk-heap', 129.2, 108.6, { angle: 95 }), at('crate-rust-long', 129.5, 106.7, { angle: 78 }), at('scrap', 129.99, 110.4, { angle: 270 }),
  at('litter', 128.5, 109.8, { angle: 160 }), at('litter-small', 128.9, 105.9, { angle: 20 }), at('oil-small', 128.6, 107.9, { angle: 60 }),
  at('droid-dome', 128.7, 110.5, { angle: 300 }),
  at('jawa', 128.35, 108.2, { angle: 345, calm: { wander: 0 } }),
  // On the yard at the end: crates of bottles stacked against the cantina.
  at('crate-tan', 126.55, 113.6, { angle: 4 }), at('crate-grey-small', 126.5, 113.55, { z: 1.4, angle: 350 }),
  at('crate-rust-long', 126.5, 115.6, { angle: 92 }), at('crate-grey-small', 129.45, 116.9, { angle: 15 }),
  // The light well: a vaporator for the houses either side, a tank on the wall.
  at('vaporator', 141.7, 88.2), at('canister-rust', 142.4, 89.1),
);
town.fixture('wall-tank', 143, 96.6, 'W', { z: 2.2 });
town.hangings.push(
  // A cable over the lane from the cantina's roof to the house opposite,
  // and a rope down its back wall.
  { type: 'cable', from: [126.05, 97.5, 7.3], to: [129.95, 95.5, 4.4], sag: 0.6 },
  { type: 'rope', from: [126.05, 108.3, 7.6], length: 2.2 },
  // Washing across the light well: a sheet and a rag.
  { type: 'cloth-pale', from: [134.5, 99.05, 3.5], to: [134.9, 101.95, 3.5], length: 1.3, pin: 'corners' },
  { type: 'rag', from: [140.05, 91.2, 3.6], to: [142.95, 91.5, 3.6], length: 0.9 },
);

// Open ground in a convex polygon ([x, y] tile corners): every tile it
// touches, so the houses can cut their slanting walls into the ones on
// its edge.
const openPolygon = (points, cell) => {
  const n = points.length;
  const side = (i, x, y) => {
    const [[ax, ay], [bx, by]] = [points[i], points[(i + 1) % n]];
    return (bx - ax) * (y - ay) - (by - ay) * (x - ax);
  };
  const sign = Math.sign(side(0, ...points[2]));
  const inside = (x, y) => points.every((_, i) => side(i, x, y) * sign > 0);
  const xs = points.map((q) => q[0]);
  const ys = points.map((q) => q[1]);
  const at = [0.02, 0.5, 0.98];
  p.rect(Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys), (x, y, c) =>
    at.some((u) => at.some((v) => inside(x + u, y + v))) ? cell : c,
  );
};

// 9. The old quarter, on its rise: a square inside the gate, a north
// street along its north side, and the main street to the derelict bay's
// gate. It isn't one straight run (Mark, 2026-11-01): out of the square
// it heads east to a house front, bends south-east, then turns south to
// the gate, so each stretch hides the next and only the last shows the
// gate. Where it turns south a little square opens on its west side; a
// yard under the roofs comes into it by an alley. The crane over the
// bay's rim stands above the roofs ahead the whole way.
p.rect(148, 53, 188, 60, town.street(OQ));
p.rect(148, 60, 160, 76, town.street(OQ));
const QUARTER = town.street(OQ);
openPolygon([[160, 64], [170, 64], [170, 76], [160, 76]], QUARTER);
// The bend: its walls y = x - 106 (north-east) and y = x - 94 (south-west).
openPolygon([[170, 64], [189, 83], [189, 87], [181, 87], [170, 76]], QUARTER);
openPolygon([[181, 87], [189, 87], [189, 104], [181, 104]], QUARTER);
// The little square, its south side slanting down to the gate's forecourt,
// a step down from the street (2026-11-01: the sand drifts into it).
openPolygon([[174, 88], [183, 88], [183, 99], [174, 95]], town.street(OQ - 0.25));
// (The street past it stays up: the step is at its edge, x 181.)
p.rect(181, 88, 183, 100, (_, __, c) => (c.floorZ === OQ - 0.25 ? QUARTER : c));
p.rect(149, 86, 157, 96, town.street(OQ));
p.rect(157, 88, 174, 92, town.street(OQ));
// The gate square's south side houses stand apart (Mark, 2026-11-03: the
// slots half a metre wide read as cracks): a passage 1 m wide runs from
// the square's corner past the grey house to the yard, so the yard is a
// way round to the little square as well as a dead end off it.
p.rect(156, 76, 158, 88, QUARTER);
town.house(148, 76, 156, 86, { h: 8, r: 1, wall: 'adobe-grey' });
town.house(149, 96, 157, 104, { h: 7.5, wall: 'adobe-ochre', dome: true });
// South and west of it (north and east of it below, once the wash is cut):
// three houses along the bend's south-west side, each its own (Mark,
// 2026-11-02): the ochre one between the passage and a dead-end alley 1 m
// wide and 9 tiles deep, closed by its own low back room, where it keeps
// its stores; the rose one set back from the pale one's slanting front,
// so its end shows.
p.rect(165, 76, 167, 85, QUARTER);
openPolygon([[175, 81], [181, 87], [181, 88], [175, 82]], QUARTER);
town.house(158, 76, 165, 88, { h: OQ + 5.5, wall: 'adobe-ochre', dome: true });
town.block(165, 85, 167, 88, { h: OQ + 3.5, wall: 'adobe-ochre' }).pipe(165, 79.5, 'E', { floorZ: OQ });
list.push(at('crate-grey-small', 165.55, 84.45, { angle: 8 }), at('canister-rust', 166.45, 84.5), at('litter-small', 166.2, 81.6, { angle: 140 }));
town.slanted([[167, 76], [170, 76], [175, 81], [175, 88], [167, 88]], { h: OQ + 6.5, wall: 'adobe-pale', dome: true });
town.slanted([[175, 82], [181, 88], [175, 88]], { h: OQ + 5, wall: 'adobe-rose', skirt: 'plinth' });
// The alley's south side two houses, a slot between them.
p.rect(162, 92, 163, 95, QUARTER);
town.house(157, 92, 162, 104, { h: OQ + 5, wall: 'adobe', skirt: 'plinth' });
town.house(163, 92, 174, 104, { h: OQ + 6, wall: 'adobe-pale', dome: true }).block(162, 95, 163, 104, { h: OQ + 6, wall: 'adobe-pale' });
town.slanted([[174, 95], [183, 99], [183, 104], [174, 104]], { h: OQ + 5, wall: 'adobe-grey', dome: true });
// A room bridges the alley halfway, its underside a round-topped vault.
town.arch(164, 88, 168, 92, { h: OQ + 6, lintel: 3.5, floorZ: OQ, wall: 'adobe-pale', round: 'E' });

// 18. The dry wash, two steps below the old quarter: from the houses
// north of it south into the derelict bay. Steps go down into it at the north
// street's east end; it's the low way to the bay. It winds (Mark, 2026-11-01):
// south, a jog west, south, a jog east, south, then it narrows into the
// breach, 8 wide all along (5.7 across the jogs), so no stretch shows the next.
const WASH_CELL = town.street(WASH, { floor: 'desert-sand' });
p.rect(194, 53, 202, 60, WASH_CELL);
openPolygon([[194, 60], [202, 60], [197, 65], [189, 65]], WASH_CELL);
p.rect(189, 65, 197, 73, WASH_CELL);
openPolygon([[189, 73], [197, 73], [204, 80], [196, 80]], WASH_CELL);
p.rect(196, 80, 204, 96, WASH_CELL);
openPolygon([[196, 96], [204, 96], [198, 104], [194, 104]], WASH_CELL);
// Between the wash and the street, after both are cut. Not one wall on
// either street (Mark, 2026-11-02): on the north street the first house
// stands on its own, a passage 1.5 m wide through to the main street past
// it (2026-11-03: a slot half a metre wide didn't read as a gap), and the
// pale one set back behind a yard; on the bend the rose one set back from
// the pale one's line, and a dead-end alley 1 m wide running 10 tiles back
// between the pale one and the ochre one, the ochre one's side door in it;
// on the way to the bay's gate two houses, not one, a slot between them and
// the second a tile back from the street. The houses 3 m across or more
// wear domes (Mark, 2026-11-03: Mos Eisley's toppers, but not small ones).
p.rect(168, 60, 171, 64, QUARTER).rect(182, 66, 184, 78, QUARTER);
openPolygon([[170, 64], [171, 64], [176, 69], [176, 70]], QUARTER);
p.rect(187, 93, 192, 95, QUARTER).rect(189, 95, 190, 104, QUARTER);
town.house(160, 60, 168, 64, { h: OQ + 5, r: 1 });
town.slanted([[171, 60], [176, 60], [176, 69], [171, 64]], { h: OQ + 5.5, wall: 'adobe-rose' });
// The pale one 1.5 m back from the street behind a paved yard a step up, its
// neighbours' ends showing either side.
town.platform(176, 60, 184, 63, { h: OQ + 0.25 });
town.slanted([[176, 63], [182, 63], [182, 76], [176, 70]], { h: OQ + 6.5, wall: 'adobe-pale', dome: true }).block(182, 63, 184, 66, { h: OQ + 6.5, wall: 'adobe-pale' });
town.slanted([[184, 60], [194, 60], [189, 65], [184, 65]], { h: OQ + 5 });
town.house(184, 65, 189, 73, { h: OQ + 6, wall: 'adobe-ochre' });
town.door(184, 69, 'W', { h: OQ + 6, floorZ: OQ, tex: 'door-grey', wall: 'adobe-ochre', sign: false });
list.push(at('crate-tan', 182.6, 66.6, { angle: 12 }), at('barrel-grey', 183.45, 66.5));
town.slanted([[184, 73], [189, 73], [196, 80], [196, 83], [189, 83], [184, 78]], { h: OQ + 5.5, wall: 'adobe-rose', dome: true });
// (The domed house's back stands a tile back from the wash's bank.)
p.rect(195, 83, 196, 93, WASH_CELL);
// (The domed one 1 m out into the street, so its end and the ochre one's
// set-back front show from the gate.)
town.house(187, 83, 195, 93, { h: OQ + 7.5, dome: true });
town.slanted([[192, 93], [196, 93], [196, 96], [194, 104], [190, 104], [190, 95]], { h: OQ + 6.5, wall: 'adobe-ochre', skirt: 'plinth' });
// Its east bank: houses whose backs slant with it.
town.slanted([[202, 60], [207, 60], [207, 65], [197, 65]], { h: 7, wall: 'adobe-pale' });
town.slanted([[197, 73], [207, 73], [207, 80], [204, 80]], { h: 6.5, wall: 'adobe-grey' });
// Along its long straight stretch two houses, not the town's blocks in one
// line: a rose one, a slot, and a pale one a tile further back.
p.rect(204, 87, 206, 88, WASH_CELL).rect(204, 88, 205, 96, WASH_CELL);
town.house(204, 80, 207, 87, { h: 7, wall: 'adobe-rose', skirt: 'plinth' }).block(206, 87, 207, 88, { h: 7, wall: 'adobe-rose', skirt: 'plinth' });
town.house(205, 88, 207, 96, { h: 5.5, wall: 'adobe-pale' });
town.slanted([[204, 96], [207, 96], [207, 104], [198, 104]], { h: 8, wall: 'adobe-ochre' });
town.stair(188, 53, 194, 60, { up: 'W', from: WASH, top: OQ, rise: 0.25, floor: 'flagstone', side: 'adobe-brick' });
// Where the loud half's reinforcements come in: the north street's east
// end and the wash's north end.
tagTile(186, 57, 'quarter-north');
tagTile(198, 55, 'quarter-north');

// 9. The old quarter in detail (2026-11-01): older and emptier than the
// town below it. Its plaster weathers more and has fallen to the brick in
// places, doors are boarded up, old walls are propped with buttresses.
// The gate square: the house on its south side has lost its dome, fallen
// in (dome-broken, models/dome.js), its rubble come down into the square;
// a squatter sleeps against the wall under it; a hitching ring by a door
// nobody rides up to now. The north street, along its north side, in
// place of the blocks behind it: a rose house with its door boarded; a
// ruin whose roof fell in long ago, its walls broken to different heights
// and breached on the street, sand over its floor, where a hermit keeps a
// shrine of candles in a niche of its back wall and sleeps under a tarp; a
// tall house propped by buttresses, its door under a hood; one whose front
// is turned off the street's line; a grey one by the steps down to the wash.
town.grimeBoxes.push([148, 40, 196, 106, 1.6]);
town.window(148, 62.5, 'E', { z: OQ + 3.2 }).window(148, 70.5, 'E', { z: OQ + 4, tex: 'window-louvre' });
town.door(152.5, 76, 'N', { h: 8, floorZ: OQ, tex: 'door-planks', width: 3, tall: 4, round: true, jamb: false, sign: false, panel: false, wall: 'adobe-grey' });
town.things.push({ type: 'dome-broken-7-grey', x: 152, y: 80.5, z: 8, angle: 270 });
town.caster(152, 80.5, 3.5, 8, 3.3);
town.fixture('hitching-ring', 160, 61.8, 'W', { z: OQ + 1.5 });
// The north street's south side: the backs of the houses on the main street.
town.window(162.5, 60, 'N', { z: OQ + 2.6 }).pipe(166.6, 60, 'N', { floorZ: OQ });
town.door(173, 60, 'N', { h: OQ + 5.5, floorZ: OQ, wall: 'adobe-rose' });
town.window(179.5, 63, 'N', { z: OQ + 3.4, tex: 'window-louvre' }).buttress(182.4, 63, 'N', { h: OQ + 6.5, floorZ: OQ + 0.25, wall: 'adobe-pale' });
town.door(187.5, 60, 'N', { h: OQ + 5, floorZ: OQ, tex: 'door-planks', width: 3, tall: 4, round: true, jamb: false, sign: false, panel: false });
// Its north side.
town.house(148, 45, 155, 53, { h: 6.5, wall: 'adobe-rose', skirt: 'plinth', dome: true });
town.door(151.5, 53, 'S', { h: 6.5, floorZ: OQ, tex: 'door-planks', width: 3, tall: 4, round: true, jamb: false, sign: false, panel: false, wall: 'adobe-rose' });
town.window(148.5, 53, 'S', { z: OQ + 3.4, tex: 'window-louvre' }).pipe(154.4, 53, 'S', { floorZ: OQ });
// The ruin: its floor drifted sand, open to the sky; its walls each broken
// down to its own height, lower toward the street, breached at 158..160.
p.rect(156, 46, 162, 53, town.street(OQ, { floor: 'desert-sand' }));
for (const [x0, y0, x1, y1, h] of [
  [155, 45, 163, 46, 5], [155, 46, 156, 49, 5.5], [155, 49, 156, 53, 4.5],
  [162, 46, 163, 48, 4.5], [162, 48, 163, 51, 3], [162, 51, 163, 53, 2],
  [156, 52, 157, 53, 4], [157, 52, 158, 53, 2.25], [160, 52, 161, 53, 1.5], [161, 52, 162, 53, 3.25],
]) town.block(x0, y0, x1, y1, { h: OQ + h, wall: 'adobe-pale', skirt: 'dirt' });
// The shrine: a round-topped niche in the back wall, its shelf a little up.
town.arch(156, 45, 159, 46, { h: OQ + 5, lintel: 3.4, floorZ: OQ + 0.75, wall: 'adobe-pale', floor: 'flagstone', round: 'S' });
town.tarp(159, 46, 162, 49, { z: 2.5, face: 'S', rise: 0.5, cloth: 'umber', poles: 'front', floorZ: OQ });
lights.push({ x: 157.5, y: 45.8, z: OQ + 1.3, radius: 3, light: 48, fx: 'flicker', min: 30 });
// Alleys back from the street either side of the turned house, dead ends
// (Mark, 2026-11-03: slots half a metre wide read as cracks, not gaps): one
// 1.5 m wide back 9 tiles to the town behind, the tall house's washing
// hung across it and its water drum at the end; one 1 m wide past the
// grey house, ending at the foot of the comm tower.
p.rect(171, 44, 174, 53, QUARTER).rect(174, 52, 180, 53, QUARTER).rect(180, 46, 182, 53, QUARTER);
town.house(163, 44, 171, 53, { h: 7, wall: 'adobe', skirt: 'dirt', tiers: [{ box: [165, 44, 171, 50], h: 10 }], dome: true });
town.door(168, 53, 'S', { h: 7, floorZ: OQ, tex: 'door-grey' }).hood(168, 53, 'S', { h: 7, floorZ: OQ });
town.buttress(164.4, 53, 'S', { h: 7, floorZ: OQ }).buttress(170.2, 53, 'S', { h: 7, floorZ: OQ });
town.window(169.5, 49, 'S', { z: 8.4, tex: 'window-louvre' });
town.slanted([[174, 46], [180, 46], [180, 52], [174, 53]], { h: 6.5, wall: 'adobe-rose', dome: true });
town.house(182, 46, 188, 55, { h: 7.5, wall: 'adobe-grey', skirt: null, dome: true });
town.door(184, 55, 'S', { h: 7.5, floorZ: OQ, tex: 'door-grey', wall: 'adobe-grey' });
town.window(186.5, 55, 'S', { z: OQ + 3 }).pipe(187.4, 55, 'S', { floorZ: OQ });
town.window(171, 47.5, 'E', { z: OQ + 3.6, tex: 'window-louvre' });
list.push(at('barrel-grey', 172.5, 44.45), at('canister', 173.4, 44.5));
town.hangings.push(
  { type: 'cloth-pale', from: [171.05, 49.6, 3.9], to: [173.95, 50.2, 3.7], length: 1.2, pin: 'corners' },
  { type: 'rag', from: [171.05, 46.9, 4.4], to: [173.95, 46.6, 4.3], length: 0.9 },
);
// Plaster fallen to the brick, on the ruin and round the square and street.
for (const [x, y, z, face, tex, scale] of [
  [160.6, 46, 4.3, 'S', 'brick-bare-1', 1], [156, 48.3, 2.6, 'E', 'brick-bare-2', 1], [162, 47.4, 3.4, 'W', 'brick-bare-2', 0.8],
  [161.5, 53, 2.2, 'S', 'brick-bare-1', 0.7], [156.5, 53, 3.3, 'S', 'brick-bare-2', 0.7],
  [149.8, 76, 3.2, 'N', 'brick-bare-1', 1.1], [154.6, 76, 5.6, 'N', 'brick-bare-2', 0.9], [148, 63.6, 1.9, 'E', 'brick-bare-2', 0.8],
  [153.3, 53, 4.7, 'S', 'brick-bare-2', 0.9], [183.6, 55, 5.5, 'S', 'brick-bare-1', 0.9], [165.9, 60, 3.1, 'N', 'brick-bare-1', 0.8],
]) town.decals.push({ x, y, z, face, tex, ...(scale !== 1 && { scale }) });
list.push(
  // The gate square: the dome's rubble, the squatter's bed under the wall.
  at('rubble', 150.4, 75.15, { angle: 20 }), at('rubble', 155.1, 75.3, { angle: 140 }), at('rubble', 152.9, 74.6, { angle: 75 }),
  at('litter', 156.4, 73.2, { angle: 200 }), at('litter-small', 150.6, 71.4, { angle: 30 }),
  at('bedroll', 149.9, 75.42, { angle: 0 }), at('canister', 148.6, 75.4), at('crate-grey-small', 155.9, 75.4, { angle: 8 }),
  // The ruin: rubble, and the hermit's things under his tarp; the candles
  // in the niche. Rubble spilt out of the breach.
  at('rubble', 157.1, 50.7, { angle: 40 }), at('rubble', 161.2, 51.3, { angle: 200 }), at('rubble', 156.8, 47.6, { angle: 110 }),
  at('rubble', 158.7, 53.7, { angle: 10 }), at('rubble', 157.4, 53.45, { angle: 300 }), at('litter-small', 160.2, 54.4, { angle: 90 }),
  at('bedroll', 160.6, 47.2, { angle: 0 }), at('crate-tan', 161.3, 49.7, { angle: 20 }), at('canister-rust', 160.15, 49.95),
  at('candles', 157.5, 45.45, { z: OQ + 0.75, angle: 0 }), at('candles', 156.7, 45.6, { z: OQ + 0.75, angle: 140 }),
  at('villager-wanderer', 158.3, 48.3, {
    angle: 90,
    wander: 1,
    name: 'HERMIT',
    talk: [{ lines: ['The suns burn the same on all of us.', 'The quarter was full, once. Before the checkpoint.'] }],
  }),
  // The north street.
  at('barrel-rust', 186.3, 55.45), at('canister', 187.05, 55.4), at('vaporator', 177.4, 61.4), at('canister-rust', 178.3, 62.3),
  at('junk-heap', 149.6, 59.2, { angle: 80 }), at('litter', 170.4, 56.6, { angle: 60 }), at('litter-small', 179.2, 57.8, { angle: 250 }),
  at('rubble', 163.3, 59.4, { angle: 300 }),
  at('villager-woman', 166, 56.5, { wander: 4 }),
);
town.hangings.push(
  { type: 'rag', from: [165.4, 53.05, 5.9], to: [166.6, 53.05, 5.9], length: 2.4 },
  { type: 'cable', from: [185.5, 55.05, 6.6], to: [186.6, 59.95, 4.9], sag: 0.6 },
  { type: 'cable', from: [169.6, 53.05, 6.3], to: [174.5, 59.95, 5.4], sag: 0.9 },
  { type: 'rag', from: [150.2, 75.95, 6.6], to: [151, 75.95, 6.6], length: 1.6 },
);

// The street on from the gate square, its bends and the way to the bay:
// doors and windows on the houses' straight faces, odds and ends in the
// bend, and by the derelict bay's gate cargo nobody came back for. The
// alley under its bridge to the yard, doors along it. The yard under the
// roofs keeps the quarter's last water: three vaporators, a tank on the
// wall and drums under it, a woman minding them. The little square, a step
// down, is the squatters': a tarp tied to a wall over their bedrolls, a
// fire in a drum (models/quarter.js), scrap sheets propped against the
// wind, washing.
town.door(166, 64, 'S', { h: OQ + 5, floorZ: OQ, tex: 'door-red' }).window(162.5, 64, 'S', { z: OQ + 2.6, tex: 'window-louvre' });
town.door(161, 76, 'N', { h: OQ + 5.5, floorZ: OQ, tex: 'door-grey', wall: 'adobe-ochre' }).hood(161, 76, 'N', { h: OQ + 5.5, floorZ: OQ, wall: 'adobe-ochre' });
town.window(163.5, 76, 'N', { z: OQ + 3.2, tex: 'window-louvre' }).window(168.5, 76, 'N', { z: OQ + 3.8 });
town.door(160, 88, 'S', { h: OQ + 5.5, floorZ: OQ, wall: 'adobe-ochre' }).window(170.5, 88, 'S', { z: OQ + 3.4 });
town.door(171, 92, 'N', { h: OQ + 6, floorZ: OQ, tex: 'door-grey', wall: 'adobe-pale' }).pipe(161.4, 92, 'N', { floorZ: OQ });
town.door(178, 88, 'S', { h: OQ + 5, floorZ: OQ - 0.25, wall: 'adobe-rose' });
town.door(187, 89.5, 'W', { h: OQ + 7.5, floorZ: OQ, tex: 'door-red' }).window(190, 98.5, 'W', { z: OQ + 3.4 }).buttress(190, 101.4, 'W', { h: OQ + 6.5, floorZ: OQ, wall: 'adobe-ochre' });
town.window(183, 101.5, 'E', { z: OQ + 2.6 });
town.fixture('wall-tank', 153.5, 86, 'S', { z: OQ + 2.4 }).window(150.5, 86, 'S', { z: OQ + 4.2 });
town.door(153, 96, 'N', { h: 7.5, floorZ: OQ, wall: 'adobe-ochre', tex: 'door-grey' });
town.decals.push(
  onSlant([170, 76], [175, 81], 0.5, OQ + 3, 'brick-bare-2', 0.9), onSlant([176, 70], [182, 76], 0.4, OQ + 2.4, 'brick-bare-1'),
  onSlant([176, 70], [182, 76], 0.75, OQ + 1.8, 'patch-plate', 0.9), onSlant([175, 82], [181, 88], 0.6, OQ + 3.4, 'brick-bare-2', 0.8),
);
{
  // Scrap sheets leant on the little square's slanting south side.
  const slant = (x, out) => {
    const n = [4 / Math.hypot(4, 9), -9 / Math.hypot(4, 9)];
    const y = 95 + ((x - 174) * 4) / 9;
    return [Math.round((x + n[0] * out) * 1000) / 1000, Math.round((y + n[1] * out) * 1000) / 1000];
  };
  list.push(at('scrap', ...slant(177.5, 0.01), { angle: 156 }), at('scrap', ...slant(179.3, 0.01), { angle: 156 }));
}
list.push(
  // The bend: odds and ends, out of the patrol's way.
  at('junk-heap', 171.6, 74.4, { angle: 135 }), at('cargo-pod', 184.6, 82.6, { angle: 45 }), at('litter', 176.5, 77.6, { angle: 40 }),
  at('rubble', 182.8, 79.6, { angle: 210 }), at('litter-small', 166.4, 70.9, { angle: 100 }),
  // By the bay's gate.
  at('crate-tan', 189.4, 102.2, { angle: 6 }), at('crate-grey-small', 189.45, 102.15, { z: OQ + 0.9, angle: 30 }), at('crate-rust-long', 189.5, 100.1, { angle: 88 }),
  at('canister-rust', 183.6, 99.6),
  // The yard's water.
  at('vaporator', 151.2, 88.3), at('vaporator', 155.3, 89.2), at('vaporator', 151.5, 93.4),
  at('barrel-grey', 154.2, 86.45), at('barrel-grey', 154.95, 86.5), at('barrel-rust', 152.5, 86.45), at('canister', 156.3, 94.6),
  at('villager-woman', 153.6, 91.4, { angle: 180, wander: 1 }),
  // The squatters.
  at('bedroll', 175.0, 93.5, { angle: 90 }), at('bedroll', 176.2, 93.7, { angle: 85 }),
  at('fire-drum', 178.7, 93.1), at('canister', 175.4, 91.2), at('crate-tan', 177.6, 91.0, { angle: 20 }), at('junk-heap', 181.6, 90.3, { angle: 300 }),
  at('villager-woman', 176.6, 90.6, { wander: 2 }), at('villager-boy', 180.2, 92.2, { wander: 3 }), at('villager-man', 179.7, 94.3, { angle: 140, wander: 0 }),
);
lights.push({ x: 178.7, y: 93.1, z: 1.65, radius: 3.5, light: 40, fx: 'flicker', min: 24 });
town.tarp(174, 92, 177, 95, { z: 2.5, face: 'E', rise: 0.5, cloth: 'teal', poles: 'front', floorZ: OQ - 0.25 });
town.hangings.push(
  { type: 'rag', from: [174.05, 92.4, 3.7], to: [176.5, 88.05, 3.9], length: 0.9 },
  { type: 'cable', from: [181.6, 87.95, 4.9], to: [186.95, 90.4, 6.2], sag: 0.8 },
);

// 18. The dry wash in detail (2026-11-01): a flood channel, dry now. At its
// north end the floods come out of a culvert under a house, a round-topped
// drain with its bars torn out on one side; at its back a low crawl goes on
// into an old cistern, dark, where someone hid a med kit and energy (the
// secret, docs/mission1.md, Secrets 5). The last flood's line is a dirty
// band along the foot of every wall, the houses' downpipes run down into
// it, and what the water brought is left at the bends: rocks, scrap, drums
// half sunk in the sand, junk.
town.house(192, 42, 204, 53, { h: 8.5, wall: 'adobe-grey', skirt: null, dome: true });
town.arch(196, 49, 200, 53, { h: 8.5, lintel: 3.4, floorZ: WASH, wall: 'adobe-grey', floor: 'desert-sand', light: 88, round: 'S' });
p.fence(198, 53, 200, 54, 'N', { tex: 'rail-rust', height: 3 });
town.arch(197, 47, 199, 49, { h: 8.5, lintel: 1.2, floorZ: WASH, wall: 'adobe-grey', floor: 'desert-sand', light: 56 });
town.room(195, 43, 201, 47, { h: 8.5, floorZ: WASH, ceilZ: 2.4, floor: 'desert-sand', ceiling: 'adobe-roof', wall: 'adobe-grey', light: 56 });
p.rect(195, 43, 201, 49, (_, __, c) => (c.slab ? { ...c, secret: true } : c));
// (The culvert's and the cistern's walls in their own dark: no lower,
// or the dome's shadow on the roof over them takes it under nothing.)
p.light(194, 42, 202, 52, 88);
town.pipe(202, 57.5, 'W', { floorZ: WASH }).pipe(197, 69.6, 'W', { floorZ: WASH }).pipe(195, 87.5, 'E', { floorZ: WASH }).pipe(204, 85.5, 'W', { floorZ: WASH });
{
  // The flood line: dirt from the floor up to a tide mark about 1.3 up, the
  // same height along every wall, on its straight runs ([face, line, from,
  // to]) and its slants.
  // (grime-dust-2 is 4 wide and 1.25 tall: spaced evenly along each run,
  // overlapping, its middles 2 in from the ends.)
  const along = (len) => {
    const n = Math.max(1, Math.ceil((len - 4) / 2.6) + 1);
    return Array.from({ length: n }, (_, k) => (n === 1 ? len / 2 : 2 + ((len - 4) * k) / (n - 1)));
  };
  let flip = false;
  for (const [face, line, a0, a1] of [['W', 202, 53, 60], ['E', 189, 65, 73], ['W', 197, 65, 73], ['E', 196, 80, 83], ['E', 195, 83, 93], ['E', 196, 93, 96], ['W', 204, 80, 87], ['W', 205, 88, 96]]) {
    for (const d of along(a1 - a0)) {
      const a = Math.round((a0 + d) * 100) / 100;
      town.decals.push({ ...(face === 'N' || face === 'S' ? { x: a, y: line } : { x: line, y: a }), z: WASH + 0.68, face, tex: 'grime-dust-2', ...((flip = !flip) && { flip }) });
    }
  }
  for (const [a, b] of [[[194, 60], [189, 65]], [[202, 60], [197, 65]], [[189, 73], [196, 80]], [[197, 73], [204, 80]], [[196, 96], [194, 104]], [[204, 96], [198, 104]]]) {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    for (const d of along(len)) town.decals.push({ ...onSlant(a, b, Math.round((d / len) * 1000) / 1000, WASH + 0.68, 'grime-dust-2'), ...((flip = !flip) && { flip }) });
  }
}
list.push(
  // The cistern: what someone hid there.
  at('med-kit', 197.4, 44.6), at('energy-pack', 199.6, 45.3), at('canister-rust', 195.6, 43.6), at('litter-small', 198.6, 46.2, { angle: 40 }),
  // The culvert's mouth: the bars torn out, junk washed against the rest.
  at('scrap', 196.4, 53.6, { angle: 200 }), at('litter', 199.2, 54.2, { angle: 120 }), at('rubble', 195.3, 54.1, { angle: 60 }),
  // At the bends.
  at('boulder-small', 200.6, 61.4, { angle: 30 }), at('junk-heap', 199.2, 62.6, { angle: 210 }), at('barrel-rust', 201.1, 60.6, { z: -0.35 }),
  at('boulder-large', 190.8, 67.2, { angle: 75 }), at('canister-rust', 192.4, 66.1, { z: -0.25 }), at('litter', 193.4, 68.6, { angle: 300 }),
  at('crate-rust-long', 196.3, 75.1, { angle: 40 }), at('scrap', 199.2, 76.9, { angle: 225 }), at('barrel-grey', 201.4, 78.6, { z: -0.4 }),
  at('boulder-small', 197.4, 81.6, { angle: 140 }), at('rubble', 198.6, 82.4, { angle: 20 }), at('litter-small', 200.4, 86.9, { angle: 160 }),
  at('junk-heap', 203.4, 94.1, { angle: 20 }), at('barrel-rust', 204.1, 92.6, { z: -0.3 }), at('boulder-small', 197.2, 98.2, { angle: 250 }),
  at('litter', 199.6, 90.4, { angle: 70 }),
);
// Its walls weather like the old quarter's above it.
town.grimeBoxes.push([186, 40, 208, 106, 1.6]);

// 10. The derelict bay: an old docking bay half full of sand, a pit like
// Bay 87. Its gate is at the main street's end: a
// passage through its building onto a landing at the old quarter's height,
// and a flight down along the wall to the west (Mark, 2026-11-01: not out
// across the floor). The wash breaks in on the north-east, onto a ledge
// along the wall to the landing, so both ways in go down the one flight.
// The gutted freighter (Rusk in its hold, behind a door in the stern that
// opens once the fob has his signal), and a stand-in crane on the rim,
// seen down the street.
const DERELICT = { cx: 186, cy: 128, r: 18, floorZ: -5, rim: 7 };
p.rect(162, 104, W - 1, H - 1, town.roofCell({ h: DERELICT.rim, wall: 'derelict-wall', skirt: null }));
town.circle(DERELICT.cx, DERELICT.cy, DERELICT.r, {
  inside: town.street(DERELICT.floorZ, { floor: 'desert-sand', side: 'derelict-wall' }),
  wall: { wall: 'derelict-wall', wallTop: DERELICT.rim },
  seam: 90,
});
town.arch(183, 104, 189, 110, { h: DERELICT.rim, lintel: 4, floorZ: OQ, wall: 'derelict-wall', floor: 'derelict-floor' });
// West of the gate the flight: ten steps of 0.5, each a tile along the
// wall, a parapet a tile tall stepping down beside them (lib/town.js,
// wallStair). From the gate east to the wash's breach the balcony
// (Mark, 2026-11-01): one deck at the old quarter's height out over the
// pit, a slab with the sand under it, fenced by one straight railing you
// see the ship through, not a parapet stepping along the curve of the
// wall. The wall stands on the deck where it crosses it.
const LANDING = town.street(OQ, { floor: 'derelict-floor', side: 'derelict-wall' });
// Under it the steelwork holding it up (models/balcony.js), in its shade.
const BALCONY = { x0: 183, x1: 199, y1: 117, under: 120 };
const BALCONY_RAIL = { tex: 'rail-rust', height: 1 };
const BALCONY_DECK = { bottom: OQ - 0.35, top: OQ, floor: 'derelict-floor', ceiling: 'metal-rust', side: 'band-steel', light: town.light };
p.rect(183, 110, 189, 111, LANDING);
p.rect(BALCONY.x0, 110, BALCONY.x1, BALCONY.y1, (x, y, c) => {
  if (c.line) return { ...c, floorZ: OQ, floor: 'derelict-floor', side: 'derelict-wall' };
  return c.floorZ === DERELICT.floorZ ? { ...c, slab: BALCONY_DECK, light: BALCONY.under } : c;
});
p.fence(BALCONY.x0, BALCONY.y1 - 1, BALCONY.x1, BALCONY.y1, 'S', BALCONY_RAIL).fence(BALCONY.x0, 113, BALCONY.x0 + 1, BALCONY.y1, 'W', BALCONY_RAIL);
for (let y = 110; y < BALCONY.y1; y++) if (p.get(BALCONY.x1 - 1, y).slab) p.fence(BALCONY.x1 - 1, y, BALCONY.x1, y + 1, 'E', BALCONY_RAIL);
list.push(at('balcony-frame', BALCONY.x0, BALCONY.y1, { angle: 0, z: DERELICT.floorZ, lit: BALCONY.under }));
// Stores left under it: crates stacked, drums, a pod on its side.
list.push(
  at('bay-crate-grey', 189.6, 113.4, { z: DERELICT.floorZ, angle: 0 }), at('crate-tan', 189.4, 115.3, { z: DERELICT.floorZ, angle: 15 }),
  at('crate-rust-long', 185.6, 114.2, { z: DERELICT.floorZ, angle: 90 }), at('crate-grey-small', 185.7, 114.4, { z: DERELICT.floorZ + 0.7, angle: 30 }),
  at('barrel-rust', 193.4, 114.6, { z: DERELICT.floorZ }), at('barrel-grey', 194.1, 115.3, { z: DERELICT.floorZ }), at('canister-rust', 193.2, 115.6, { z: DERELICT.floorZ }),
  at('junk-heap', 197, 115.2, { z: DERELICT.floorZ, angle: 160 }),
);
town.wallStair(DERELICT.cx, DERELICT.cy, DERELICT.r, { against: 'N', width: 4, floor: 'derelict-floor', side: 'bay-step', parapet: 'derelict-wall', at: 182, run: 'W', top: OQ, from: DERELICT.floorZ });
// The breach: the wash runs on through the rim, 4 wide, a step down from
// the ledge, and the wall is gone where it meets it.
for (let x = 194; x < 198; x++) {
  for (let y = 104; y < 120; y++) {
    const c = p.get(x, y);
    if (c.line) p.set(x, y, LANDING);
    else if (c.floorZ === DERELICT.rim) p.set(x, y, town.street(WASH, { floor: 'desert-sand', side: 'derelict-wall' }));
  }
}
// The wall gave there: the rim either side broken down toward the gap (a
// tile lower at the pit's face, and still too tall to climb from the
// ledge or the wash), rubble along the gap's sides, and the wash's sand
// spilt through it across the ledge.
for (const [x, h] of [[192, 6], [193, 4.5], [198, 4.5], [199, 6]]) {
  for (let y = 104; y < 120; y++) {
    const c = p.get(x, y);
    if (c.line) p.set(x, y, { ...c, wallTop: h - 1 });
    else if (c.floorZ === DERELICT.rim) p.set(x, y, { ...c, floorZ: h + (y < 107 ? 0.5 : 0) });
  }
}
for (let x = 192; x < 198; x++) {
  for (let y = 108; y < 120; y++) {
    const c = p.get(x, y);
    if (c.floorZ === OQ && (x > 192 || c.line)) p.set(x, y, { ...c, floor: 'desert-sand' });
    else if (c.slab && x > 192 && y < 115) p.set(x, y, { ...c, slab: { ...c.slab, floor: 'desert-sand' } });
  }
}
list.push(
  at('rubble', 194.55, 105.6, { z: WASH, angle: 30 }), at('rubble', 197.4, 107.9, { z: WASH, angle: 200 }), at('rubble', 194.6, 109.8, { z: WASH, angle: 120 }),
  at('rubble', 193.6, 112.5, { z: OQ, angle: 75 }), at('litter-small', 196, 113.6, { z: OQ, angle: 15 }),
);
town.block(191, 106, 192, 107, { h: 18, wall: 'metal-rust', roof: 'metal-rust', skirt: null });
const HULL = { wall: 'freighter-hull', roof: 'freighter-hull', skirt: null };
// The freighter: the model is its outside (models/freighter.js), the
// tiles inside it its hold and the hold's walls.
town.house(172, 130, 190, 139, { h: DERELICT.floorZ + 5, r: 2, ...HULL });
list.push(at('freighter', 181, 134.5, { angle: 0, z: DERELICT.floorZ, lit: town.light }));
town.room(174, 131, 188, 138, { h: DERELICT.floorZ + 5, floorZ: DERELICT.floorZ, ceilZ: DERELICT.floorZ + 3.25, floor: 'hold-floor', ceiling: 'hold-ceiling', wall: 'hold-guts', light: 96 });
// Inside it's a ship's hold, left to rot (Mark, 2026-11-01): grimy
// panelling (the hull's walls inside are the hold's; outside the model
// covers them), a mesh deck, a frame across it every 2.5, panels gone from
// the walls and the ceiling so the ship's guts show, wires hanging out of
// the holes. (models/hold.js; the junk and the lamp further down.)
p.rect(172, 130, 191, 139, (_, __, c) => (c.side === 'freighter-hull' && c.floorZ > DERELICT.floorZ ? { ...c, side: 'hold-wall' } : c));
for (const [x, y] of [[175, 130], [182, 130], [183, 130], [178, 138], [186, 138], [173, 134]]) p.set(x, y, { ...p.get(x, y), side: 'hold-guts' });
const HOLD_HOLES = [[176, 132], [177, 132], [182, 136], [183, 136], [183, 137], [186, 133]];
for (const [x, y] of HOLD_HOLES) {
  const c = p.get(x, y);
  p.set(x, y, { ...c, slab: { ...c.slab, bottom: DERELICT.floorZ + 4, ceiling: 'hold-pipes', side: 'hold-guts' } });
}
// Where the hull's plating is gone the hold is open behind it
// (FREIGHTER.windows): the wall's tiles cut down to a sill, the ceiling
// over them, so you see the bay from the hold and the hold from the bay;
// and in the roof's hole the ceiling is gone, the sky over a shaft. (The
// sky at its full height: a sky lower than your eye hides everything
// beyond it above that height, and the balcony looks down over the hole.)
const holdAt = (mx, my) => [181 + mx, 134.5 + my];
const HOLD_SLAB = p.get(180, 134).slab;
for (const [x0, x1, z0, , s] of FREIGHTER.windows) {
  const y = s < 0 ? 130 : 138;
  for (let x = holdAt(x0, 0)[0]; x < holdAt(x1, 0)[0]; x++) p.set(x, y, { ...p.get(x, y), floorZ: DERELICT.floorZ + z0, side: 'hold-wall', slab: { ...HOLD_SLAB, side: 'hold-wall' }, light: 96 });
}
{
  const [sx0, sx1, sy0, sy1] = FREIGHTER.skylight;
  const [[x0, y0], [x1, y1]] = [holdAt(sx0, sy0), holdAt(sx1, sy1)];
  p.rect(x0, y0, x1, y1, (_, __, c) => ({ ...c, slab: undefined, ceilZ: SKY, light: 140 }));
}
for (const x of [175.5, 178, 180.6, 183, 185.5, 187.6]) list.push(at('hold-rib', x, 134.5, { z: DERELICT.floorZ, angle: 0, lit: 96 }));
town.arch(188, 132, 189, 137, { h: DERELICT.floorZ + 5, lintel: 3, floorZ: DERELICT.floorZ, wall: 'hold-wall', floor: 'hold-floor' });
town.door(190, 134.5, 'E', { h: DERELICT.floorZ + 5, tex: 'door-grey', width: 5, jamb: false, sign: false, panel: false, step: false, floorZ: DERELICT.floorZ, wall: 'freighter-hull' });
p.rect(189, 132, 190, 137, (_, __, c) => ({ ...c, floor: 'hold-floor', tag: 'hold-door', stayOpen: true }));
p.rect(174, 131, 188, 138, (_, __, c) => ({ ...c, tag: 'hold' }));
// Fitted out as Bay 87 was, and left: its ribs up the wall every 30
// degrees (a tile taller, the pit being deeper), clear of the stair, the
// ledge and the breach (45 to 135 degrees round); the lamps on the rim
// dead; soot scars; and against the wall what nobody took: scrap sheets
// leant on it, drums, crates broken open, junk and rubble, litter blown
// round the floor. Nothing in the way down the stair or to the hold.
const onDerelictWall = (type, deg, inset = 0.02, z = DERELICT.floorZ) => {
  const a = (deg * Math.PI) / 180;
  const r = DERELICT.r - inset;
  return at(type, Math.round((DERELICT.cx + r * Math.cos(a)) * 100) / 100, Math.round((DERELICT.cy - r * Math.sin(a)) * 100) / 100, { z, angle: (deg + 270) % 360 });
};
for (let deg = 15; deg < 360; deg += 30) if (deg < 45 || deg > 135) list.push(onDerelictWall('derelict-rib', deg));
for (const deg of [15, 195, 255, 345]) list.push(onDerelictWall('bay-rim-lamp-dead', deg, 0.02, DERELICT.rim));
list.push(
  onDerelictWall('scrap', 180), onDerelictWall('barrel-rust', 186, 0.5), onDerelictWall('canister-rust', 188.5, 0.4),
  onDerelictWall('bay-crate-rust-long', 206, 1.1), onDerelictWall('crate-grey-small', 209.5, 0.5),
  onDerelictWall('scrap', 232), onDerelictWall('junk-heap', 238, 1.4),
  onDerelictWall('barrel-rust', 262, 0.5), onDerelictWall('barrel-grey', 264.6, 0.5), onDerelictWall('canister-rust', 266.8, 0.4),
  onDerelictWall('scrap', 298), onDerelictWall('rubble', 303, 0.9), onDerelictWall('rubble', 307.5, 1.4),
  onDerelictWall('bay-crate-grey', 328, 1.4), onDerelictWall('crate-tan', 333.5, 0.6),
  onDerelictWall('junk-heap', 2, 1.5), onDerelictWall('scrap', 26), onDerelictWall('barrel-rust', 30.5, 0.5),
);
// More of it (Mark, 2026-11-01: fill the bay with junk): scaffolding left up
// against the freighter's flank over a hole in its plating and against the
// pit's wall; big cargo crates stacked south of the hull and by the wall,
// drums and canisters in huddles, a cargo pod, junk and scrap. The way from
// the stair's foot round to the hold's door stays open.
list.push(
  at('scaffold', 185.2, 129.45, { z: DERELICT.floorZ, angle: 180 }),
  onDerelictWall('scaffold-tall', 285, 0.35),
  // South of the hull: a stack of big crates, a long one, small ones round them.
  at('bay-crate-grey', 176, 142.4, { z: DERELICT.floorZ, angle: 0 }),
  at('bay-crate-tan', 176.2, 142.3, { z: DERELICT.floorZ + 2, angle: 10 }),
  at('bay-crate-rust-long', 180.4, 142.8, { z: DERELICT.floorZ, angle: 0 }),
  at('crate-tan', 178.6, 140.6, { z: DERELICT.floorZ, angle: 20 }),
  at('crate-grey-small', 182.6, 141.1, { z: DERELICT.floorZ, angle: 45 }),
  at('crate-rust-long', 184.6, 142.6, { z: DERELICT.floorZ, angle: 80 }),
  at('barrel-rust', 173.4, 141.2, { z: DERELICT.floorZ }), at('barrel-grey', 172.7, 142, { z: DERELICT.floorZ }),
  // East of the door's way: crates and drums by the wall.
  at('bay-crate-grey', 201.4, 131.6, { z: DERELICT.floorZ, angle: 15 }),
  at('crate-tan', 200.3, 134.2, { z: DERELICT.floorZ, angle: 30 }), at('crate-grey-small', 201.8, 135.3, { z: DERELICT.floorZ, angle: 0 }),
  at('barrel-rust', 199.6, 124.6, { z: DERELICT.floorZ }), at('canister-rust', 200.3, 125.3, { z: DERELICT.floorZ }),
  at('barrel-rust', 200.8, 124.4, { z: DERELICT.floorZ }), at('canister', 199.2, 125.6, { z: DERELICT.floorZ }),
  // West, past the cockpit's nose: a cargo pod, drums and a crate.
  at('cargo-pod', 166.2, 135.5, { z: DERELICT.floorZ, angle: 75 }),
  at('barrel-grey', 168.4, 139.5, { z: DERELICT.floorZ }), at('barrel-rust', 167.7, 140.3, { z: DERELICT.floorZ }),
  at('crate-rust-long', 167.4, 130.4, { z: DERELICT.floorZ, angle: 100 }),
  // Junk and scrap about.
  at('junk-heap', 170.6, 128.4, { z: DERELICT.floorZ, angle: 200 }),
  at('rubble', 197.4, 141.6, { z: DERELICT.floorZ, angle: 60 }), at('droid-dome', 198.6, 140.2, { z: DERELICT.floorZ, angle: 130 }),
);
// Litter and rubble about the floor, from a fixed seed: on the open sand,
// clear of the hull, its door and the foot of the stair.
{
  let s = 7300;
  const rnd = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
  const clear = [[170, 128, 192, 141], [189, 128, 198, 141], [164, 110, 178, 125]];
  for (let j = 0; j < 52; j++) {
    const a = rnd() * Math.PI * 2;
    const d = DERELICT.r - 1.5 - rnd() * 9;
    const [x, y] = [DERELICT.cx + d * Math.cos(a), DERELICT.cy - d * Math.sin(a)];
    const c = p.get(Math.floor(x), Math.floor(y));
    if (c.floorZ !== DERELICT.floorZ || c.line || clear.some(([x0, y0, x1, y1]) => x > x0 && x < x1 && y > y0 && y < y1)) continue;
    const type = ['litter', 'litter-small', 'litter-small', 'rubble', 'oil', 'oil-small'][Math.floor(rnd() * 6)];
    list.push(at(type, Math.round(x * 100) / 100, Math.round(y * 100) / 100, { z: DERELICT.floorZ, angle: Math.floor(rnd() * 24) * 15 }));
  }
}
// Soot round the wall from old exhausts and fires (degrees round from
// east, height, picture, size), more of it than in Bay 87.
const derelictDecals = [[8, -2, 1, 3.4], [33, 0.5, 2, 2.6], [152, -1.5, 2, 3.2], [176, 1, 1, 2.8], [214, -2.5, 1, 3.6], [243, 0, 2, 2.4], [271, -1.5, 1, 3.2], [292, 1.5, 2, 2.6], [322, -2, 1, 3.4], [352, 1, 2, 2.2]].map(([deg, z, k, scale]) => {
  const a = (deg * Math.PI) / 180;
  return { x: DERELICT.cx + DERELICT.r * Math.cos(a), y: DERELICT.cy - DERELICT.r * Math.sin(a), z, face: 'angled', tex: `grime-scorch-${k}`, scale };
});
// And dirtier (Mark, 2026-11-01): streaks and drips run down from the rim
// all the way round, and blotches of oil and damp low on the wall.
const DERELICT_STREAKS = ['grime-streaks-1', 'grime-drip-1', 'grime-streaks-2', 'grime-streaks-3', 'grime-drip-2'];
for (let deg = 4, k = 0; deg < 360; deg += 17, k++) {
  if (Math.abs(deg - 55) < 4 || Math.abs(deg - 89) < 4) continue; // the breach and the gate
  const a = (deg * Math.PI) / 180;
  const [x, y] = [DERELICT.cx + DERELICT.r * Math.cos(a), DERELICT.cy - DERELICT.r * Math.sin(a)];
  derelictDecals.push({ x, y, z: DERELICT.rim - 1.8 - (k % 3) * 0.4, face: 'angled', tex: DERELICT_STREAKS[k % 5], scale: 3 + (k % 2) * 0.6 });
  if (k % 2 && (deg < 45 || deg > 135)) derelictDecals.push({ x, y, z: DERELICT.floorZ + 1.1, face: 'angled', tex: k % 4 === 1 ? 'grime-blotch-1' : 'grime-blotch-2', scale: 2.4 });
}
// Shore power, never unplugged (Mark, 2026-11-01): nothing strung across
// the pit, where it would foul a ship coming down, only the bay's lines to
// the ship it fed, slack and heavy. One off the balcony's girder (where its
// power run is) down to the freighter's flank, one from a socket low on a
// rib to its stern. The ship's roof is at 0.8 (models/freighter.js).
const derelictHangings = [
  { type: 'cable', from: [191, 117.1, 0.05], to: [187.6, 130.3, 0.4], sag: 3.5 },
  { type: 'cable', from: [202.76, 132.49, -2.6], to: [189.2, 134.2, 0.82], sag: 1.8 },
];
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
// Its front on the yard in plaster, as Bay 87's is on the lane.
p.rect(62, 94, 87, 95, town.roofCell({ h: BAY86.rim, wall: 'adobe-grey' }));
town.circle(BAY86.cx, BAY86.cy, BAY86.r, {
  inside: town.street(BAY86.floorZ, { floor: 'bay-floor', side: 'bay-wall', bands: RIBBED }),
  wall: { wall: 'bay-wall', wallTop: BAY86.rim, bands: RIBBED },
  seam: 90,
});
town.arch(73, 94, 77, 98, { h: BAY86.rim, lintel: 4, wall: 'bay-wall', floor: 'bay-floor' });
p.rect(73, 98, 77, 100, town.street(0, { floor: 'bay-floor', side: 'bay-wall' }));
p.fence(73, 98, 77, 99, 'N', { tex: 'imp-bars', height: 4 });
// The gate dressed as Bay 87's door is: a round-topped hood and a buttress either side.
town.hood(75, 94, 'N', { h: BAY86.rim, width: 4, wall: 'adobe-grey' });
town.buttress(71.4, 94, 'N', { h: BAY86.rim, wall: 'adobe-grey' }).buttress(78.6, 94, 'N', { h: BAY86.rim, wall: 'adobe-grey' });
town.house(64, 107, 80, 117, { h: BAY86.floorZ + 3, r: 2, ...HULL });
// Fitted out as Bay 87 is, its pit as deep (models/bay.js): a rib every 30
// degrees round the wall, clear of the gate (70 to 86 degrees round); a
// lamp on the rim over every other one, two of them dead; fuel lines down
// to pumps in four of the bays between (the pump 8 degrees round from its
// line: 2 tiles, as in Bay 87's wider pit). Soot where exhausts hit the wall.
const onBay86Wall = (type, deg, z, inset = 0.02) => {
  const a = (deg * Math.PI) / 180;
  const r = BAY86.r - inset;
  return at(type, Math.round((BAY86.cx + r * Math.cos(a)) * 100) / 100, Math.round((BAY86.cy - r * Math.sin(a)) * 100) / 100, { z, angle: (deg + 270) % 360 });
};
for (let deg = 15; deg < 360; deg += 30) {
  if (deg > 60 && deg < 100) continue;
  list.push(onBay86Wall('bay-rib', deg, BAY86.floorZ));
  if (deg % 60 === 15) list.push(onBay86Wall(deg === 135 || deg === 255 ? 'bay-rim-lamp-dead' : 'bay-rim-lamp', deg, BAY86.rim));
}
for (const deg of [30, 150, 240, 300]) list.push(onBay86Wall('bay-fuel-line', deg, BAY86.floorZ), onBay86Wall('bay-fuel-pump', deg - 8, BAY86.floorZ));
const bay86Decals = [[22, -1.5, 1, 3], [118, 0.5, 2, 2.4], [168, -2, 1, 3.2], [212, 1, 2, 2.2], [262, -1, 1, 3], [318, 0.5, 2, 2.6]].map(([deg, z, k, scale]) => {
  const a = (deg * Math.PI) / 180;
  return { x: BAY86.cx + BAY86.r * Math.cos(a), y: BAY86.cy - BAY86.r * Math.sin(a), z, face: 'angled', tex: `grime-scorch-${k}`, scale };
});
// Customs going through the freighter's cargo: crates prised open beside
// the hull, their lids off (models/bay.js), small crates and drums out,
// what was in them strewn about (no pickups: you can't get in). From the
// gate you see down past the hull's flanks, so the open crates are there,
// their lids leant toward it; a closed one and the rest north and south.
const onBay86Floor = (type, x, y, extra = {}) => at(type, x, y, { ...extra, z: BAY86.floorZ + (extra.z ?? 0) });
list.push(
  // West of the hull.
  onBay86Floor('bay-crate-open-grey', 60.8, 111, { angle: 90 }), onBay86Floor('crate-tan', 62.7, 113.4, { angle: 25 }),
  onBay86Floor('barrel-grey', 61, 119.1), onBay86Floor('barrel-rust', 61.7, 119.8), onBay86Floor('canister', 60.8, 120.2, { angle: 30 }),
  onBay86Floor('litter', 62.6, 109.4, { angle: 15 }), onBay86Floor('litter-small', 63, 117.8, { angle: 60 }),
  // East of it.
  onBay86Floor('bay-crate-open-tan', 83.4, 117.2, { angle: 270 }), onBay86Floor('crate-rust-long', 82.8, 108.6, { angle: 95 }),
  onBay86Floor('crate-grey-small', 81.2, 115.4, { angle: 70 }), onBay86Floor('canister-rust', 81.5, 110.4, { angle: 80 }),
  onBay86Floor('litter-small', 81, 119.6, { angle: 45 }), onBay86Floor('oil-small', 80.9, 111.9),
  // North and south.
  onBay86Floor('bay-crate-grey', 67.2, 103.6, { angle: 6 }), onBay86Floor('bay-crate-open-long', 72.4, 120.2, { angle: 0 }),
  onBay86Floor('cargo-pod', 78.6, 121.8, { angle: 120 }), onBay86Floor('litter-small', 75.5, 123, { angle: 120 }),
);

// 4. The Jawa junk yard, north of the market: in by the alley between H and
// I, through a gate (shut until the broker hands over the fob) and two
// steps down into a front court, the furnace (models/furnace.js) on its
// north side and a side gate east into the back alleys. The trader isn't
// there (Mark, 2026-10-31): a passage slants up its north-west corner
// between two heaps of scrap, too tall to see over, to a lane along the
// low north wall. Through a breach in
// the wall, the sandcrawler (models/sandcrawler.js, seen from the market
// over I's low roof) has its ramp down over it, and the trader is in its
// hold.
const JUNK = -0.5;
const SCRAP = { wall: 'metal-rust', roof: 'metal-rust', skirt: null };
p.rect(54, 1, 101, 16, town.street(0, { floor: 'desert-sand' }));
town.block(54, 16, 88, 46, { h: 5, wall: 'adobe-brick', skirt: null });
// Walled in by the backs of the town's houses, in their plasters and
// heights, rather than one long brick wall (Mark, 2026-10-31: the walls
// were bare and flat); a dome over the tallest. Their heights are whole
// tiles over the court, for the downpipes. The north wall stays low brick,
// the town's edge.
town.block(54, 16, 56, 46, { h: 5.5, wall: 'adobe-grey', skirt: 'plinth' });
town.block(54, 41, 62, 46, { h: 6.5, wall: 'adobe-ochre', skirt: 'plinth' });
town.block(62, 41, 69, 46, { h: 4.5, wall: 'adobe', skirt: 'dirt' });
town.block(69, 41, 76, 46, { h: 5.5, wall: 'adobe-pale', skirt: 'dirt' });
town.block(76, 41, 88, 46, { h: 6.5, wall: 'adobe-grey', skirt: null });
town.block(84, 16, 88, 30, { h: 4.5, wall: 'adobe-rose', skirt: 'dirt' });
town.block(84, 30, 88, 41, { h: 5.5, wall: 'adobe', skirt: 'plinth' });
town.block(56, 16, 84, 18, { h: 2, wall: 'adobe-brick', skirt: null });
p.rect(56, 18, 84, 41, town.street(JUNK));
p.rect(71, 44, 75, 49, town.street());
town.arch(71, 41, 75, 44, { h: 5.5, wall: 'adobe-pale' });
// Its gate is planks like the side gate's, shut until the broker hands Kyle
// the fob: the junk yard is the fob's first stop (Mark, 2026-10-31).
p.rect(71, 41, 75, 44, (_, __, c) => ({ ...c, door: 'door-planks-rising', style: 'rise', lock: 'remote' }));
gateTag(71, 41, 75, 44, 'junk-gate');
town.stair(71, 39, 75, 41, { up: 'S', from: JUNK, top: 0, rise: 0.25, floor: 'flagstone', side: 'adobe-pale' });
town.arch(84, 37, 86, 40, { h: 5.5, wall: 'adobe' });
town.stair(82, 37, 84, 40, { up: 'E', from: JUNK, top: 0, rise: 0.25, floor: 'flagstone', side: 'adobe' });
// The side gate is weathered planks, shut until the trader keys in the
// signal and lets Kyle out the back (the alleys lead past the blast doors).
p.rect(84, 37, 86, 40, (_, __, c) => ({ ...c, door: 'door-planks-rising', style: 'rise', lock: 'remote' }));
gateTag(84, 37, 86, 40, 'side-gate');
// The two heaps, the passage between them 4 wide at its foot and opening
// out at the top into a clearing at the ramp's foot (Mark, 2026-10-31: the
// ramp mustn't touch the heaps), 3 tiles clear of it; the east one taller.
// Each is a pile of junk (models/junk-pile.js)
// on the yard's floor, colliding as its outline.
for (const [id, { at: [x, y], inside }] of Object.entries(JUNK_PILES)) list.push(at(id, x, y, { angle: 0, z: 0, ...(!inside && { lit: town.light }) }));
// The Jawas' cargo skiff parked in the court's west end, along the west
// heap's foot, hovering, its bow to the court.
list.push(at('cargo-skiff', 59.5, 35.1, { angle: 0, z: JUNK, lit: town.light }));
// The droids for sale in a row along the court's south wall, west of the
// steps from the gate, facing in, on a low deck of plating a step up off
// the sand, and two Jawas minding them: one by the row and one by the
// furnace (calm, so they stay put).
const DECK = JUNK + 0.25;
p.rect(56, 39, 68, 41, town.street(DECK, { floor: 'yard-plate', side: 'metal-rust' }));
list.push(
  at('astromech-blue', 58, 40.1, { angle: 90 }), at('power-droid-rust', 59.3, 40.15, { angle: 80 }),
  at('astromech-rust', 60.6, 40.1, { angle: 100 }), at('astromech-red', 61.9, 40.1, { angle: 85 }),
  at('power-droid', 63.3, 40.15, { angle: 95 }), at('astromech-blue', 64.6, 40.1, { angle: 75 }),
  at('crate-grey-small', 66.1, 40.3, { angle: 5 }), at('droid-dome', 66.1, 40.3, { z: DECK + 0.6, angle: 160 }),
  at('astromech-rust', 57.2, 38.8, { angle: 20 }),
  at('jawa', 62.4, 38.4, { angle: 45, calm: { wander: 0 } }), at('jawa', 76.2, 35, { angle: 30, calm: { wander: 0 } }),
);
// The scrap furnace against the east heap's foot, its mouth to the court.
list.push(at('furnace', 79.5, 32.7, { angle: 0, z: JUNK, lit: town.light }));
// The sandcrawler: the model is its outside, the tiles inside it its hold
// (the crawler's lower deck, dim, the length of it, up on its treads at 3)
// and the hold's walls. Its ramp is down over a breach in the wall, steps
// under the model's plate from the lane, junk piled either side of it and
// along the wall's outside so the desert stays out of reach.
list.push(at('sandcrawler', 80, 8, { angle: 0, z: 0, lit: town.light }));
// (The hold's walls and bulkheads in its light, not the sun's: their faces
// take the light between them and the floor, and in the sun's they'd be
// lit bright over the dim things in the hold.)
const HOLD = { ...SCRAP, h: 8, light: 96 };
town.block(64, 3, 90, 13, HOLD);
town.room(65, 4, 89, 12, { h: 8, floorZ: 3, ceilZ: 7.5, floor: 'imp-grate', ceiling: 'imp-panel-dark', wall: 'metal-rust', light: 96 });
town.arch(76, 12, 80, 13, { h: 8, lintel: 4, floorZ: 3, wall: 'metal-rust', roof: 'metal-rust', floor: 'imp-grate', light: 96 });
town.stair(76, 13, 80, 20, { up: 'N', from: JUNK, top: 3, rise: 0.5, floor: 'imp-grate', side: 'metal-rust' });
town.block(75, 13, 76, 18, { ...SCRAP, h: 5 }).block(80, 13, 81, 18, { ...SCRAP, h: 5 });
town.block(54, 14, 75, 16, { ...SCRAP, h: 2.5 }).block(81, 14, 101, 16, { ...SCRAP, h: 2.5 });
// The hold isn't laid out tidily (Mark, 2026-10-31: too organised): a
// bulkhead west of the doorway and another at the east end, and heaps of
// scrap on the floor (junk-pile-hold, -west), so from the top of the ramp
// you wind north round the heap ahead, through the gap past the bulkhead,
// west along the north wall and back south round the west heap to find
// the trader in the far corner. East of the doorway a dead end through
// the east bulkhead's gap, the droids for sale in it. Racks against what
// wall there's room on, crates and drums about, a lamp over each part.
// The floor is at 3, so things stacked on others are placed by their z.
town.block(73, 7, 74, 12, HOLD).block(84, 4, 85, 9, HOLD);
list.push(
  at('rack-b', 66.6, 4.05, { angle: 0 }), at('rack-c', 74.05, 10, { angle: 90 }), at('rack-a', 82.5, 11.95, { angle: 180 }),
  at('rack-a', 87, 4.05, { angle: 0 }), at('rack-c', 87.3, 11.95, { angle: 180 }),
  at('barrel-rust', 71.6, 4.6), at('canister-rust', 70.5, 4.5), at('barrel-grey', 75, 4.6), at('crate-grey-small', 76.1, 4.6, { angle: 20 }),
  at('power-unit', 65.05, 8.4, { angle: 90 }), at('crate-rust-long', 65.5, 6.2, { angle: 90 }), at('droid-dome', 65.5, 5.9, { z: 3.7, angle: 40 }),
  at('crate-tan', 65.9, 11.3, { angle: 10 }), at('crate-grey-small', 65.9, 11.3, { z: 3.9, angle: 35 }),
  at('astromech-rust', 85.9, 6.2, { angle: 200 }), at('power-droid', 86.3, 9.5, { angle: 170 }), at('astromech-red', 88.2, 9.9, { angle: 150 }),
  at('junk-heap', 88, 7, { angle: 80 }), at('barrel-rust', 83.3, 8.2), at('canister-rust', 80.6, 9.1),
  at('ceiling-lamp', 78.5, 9.6), at('ceiling-lamp', 68, 8.5), at('ceiling-lamp', 86.5, 8),
);
// Each lamp lights a pool of the hold round it; the corners between stay dim.
for (const [x, y] of [[78.5, 9.6], [68, 8.5], [86.5, 8]]) lights.push({ x, y, z: 5.5, radius: 5, light: 56 });
// The trader who sold Rusk a power coupling, in the hold's far south-west
// corner behind the west heap: with the fob in hand, he keys its
// transponder code in (the signal).
list.push(
  at('jawa', 66.6, 10.2, {
    angle: 80,
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

// The yard's ground and walls (Mark, 2026-10-31: bare and flat). A trodden
// path of salvaged deck plates laid on the sand from the foot of the gate's
// steps across the court, up the passage between the heaps to the ramp's
// foot; oil spilled into the sand, burns round the smelter, litter and odd
// scrap about. The walls patched with sheet metal here and there (decals,
// over their grime: the yard's walls are grimier than the town's), and
// drums, crates and scrap against them. Scattered from a fixed seed, kept
// off the heaps.
{
  let s = 4100;
  const rnd = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
  const r2 = (v) => Math.round(v * 100) / 100;
  const inPoly = (x, y, poly) => {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [[xi, yi], [xj, yj]] = [poly[i], poly[j]];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  };
  const heaps = [JUNK_PILES['junk-pile-west'].outline, JUNK_PILES['junk-pile-east'].outline];
  const ground = (x, y, pad = 0.6) => {
    const c = p.get(Math.floor(x), Math.floor(y));
    if (!c || c.wall || c.floorZ !== JUNK) return false;
    for (const [dx, dy] of [[0, 0], [pad, 0], [-pad, 0], [0, pad], [0, -pad]]) if (heaps.some((h) => inPoly(x + dx, y + dy, h))) return false;
    return true;
  };
  // The path, a plate every 1.5 tiles or so, some across it and some along,
  // turned a little, a few missing; each a hair above the last so their
  // overlaps don't flicker.
  const PATH = [[73, 38.4], [68.6, 35.6], [65.4, 32.6], [68.6, 28.6], [72.2, 25], [75.4, 22.3], [78, 20.7]];
  const PLATES = ['deck-plate', 'deck-plate-long', 'deck-plate-rust', 'deck-plate', 'deck-plate-rust'];
  let k = 0;
  for (let i = 0; i + 1 < PATH.length; i++) {
    const [[x0, y0], [x1, y1]] = [PATH[i], PATH[i + 1]];
    const len = Math.hypot(x1 - x0, y1 - y0);
    const heading = (Math.atan2(y0 - y1, x1 - x0) * 180) / Math.PI;
    for (let t = rnd() * 0.5; t < len; t += 1.4 + rnd() * 0.5) {
      if (rnd() < 0.15) continue;
      const side = (rnd() - 0.5) * 0.7;
      const x = x0 + ((x1 - x0) * t) / len + ((y1 - y0) / len) * side;
      const y = y0 + ((y1 - y0) * t) / len - ((x1 - x0) / len) * side;
      const across = rnd() < 0.6 ? 90 : 0;
      list.push(at(PLATES[Math.floor(rnd() * PLATES.length)], r2(x), r2(y), { z: JUNK + (k++ % 3) * 0.015, angle: Math.round(heading + across + (rnd() - 0.5) * 40) }));
    }
  }
  // Oil soaked into the sand all over the court, more under the skiff (it
  // drips), and burns round the smelter where melt has slopped.
  const scatter = (types, n, [x0, y0, x1, y1], pad) => {
    for (let j = 0; j < n; j++) {
      const [x, y] = [x0 + rnd() * (x1 - x0), y0 + rnd() * (y1 - y0)];
      const type = types[Math.floor(rnd() * types.length)];
      const angle = Math.floor(rnd() * 24) * 15;
      if (ground(x, y, pad)) list.push(at(type, r2(x), r2(y), { z: JUNK, angle }));
    }
  };
  scatter(['oil', 'oil-small', 'oil-small'], 16, [56, 18, 84, 39], 0.6);
  scatter(['oil', 'oil-small'], 4, [57, 33.5, 62, 37], 0.4);
  scatter(['floor-burn-1', 'floor-burn-2', 'oil-small'], 7, [75, 34, 84, 37.5], 0.6);
  scatter(['litter', 'litter-small', 'litter-small', 'rubble'], 18, [56, 18, 84, 39], 0.4);
}
// On the walls round the court and the lane: sheet metal patching them
// and brick bared where their plaster has fallen (decals: x or y along the
// wall, z the middle's height over the court, the texture and its scale),
// windows, downpipes and a box unit.
for (const [x, y, z, face, tex, scale] of [
  // The south wall, behind the droids and east of the gate's steps.
  [57.3, 41, 1.7, 'N', 'patch-tin', 1], [60.4, 41, 2.2, 'N', 'patch-plate', 1.1], [57.4, 41, 5, 'N', 'brick-bare-1', 1],
  [63.4, 41, 1.6, 'N', 'patch-rust', 1.1], [64.9, 41, 3.4, 'N', 'brick-bare-2', 1], [68.2, 41, 2.7, 'N', 'patch-plate', 1],
  [70, 41, 4.2, 'N', 'brick-bare-1', 0.9], [76.7, 41, 1.5, 'N', 'patch-rust', 1],
  [79, 41, 5.1, 'N', 'brick-bare-2', 1.1], [82.4, 41, 2.6, 'N', 'patch-plate', 0.9], [83.2, 41, 1.4, 'N', 'patch-tin', 1],
  // The west wall, behind the skiff.
  [56, 34.6, 2.2, 'E', 'patch-rust', 1.2], [56, 36.6, 3.8, 'E', 'brick-bare-1', 1], [56, 37.9, 1.3, 'E', 'patch-plate', 1],
  // The east wall, by the smelter and the side gate, and by the lane.
  [84, 33, 2.4, 'W', 'patch-tin', 1.2], [84, 31.6, 4.4, 'W', 'brick-bare-2', 1], [84, 36.3, 2.7, 'W', 'patch-plate', 1.1],
  [84, 21.6, 1.8, 'W', 'patch-rust', 1], [84, 23, 3.4, 'W', 'brick-bare-1', 0.8],
  // The lane's low north wall, east of the ramp.
  [82.3, 18, 0.8, 'S', 'patch-plate', 1],
]) town.decals.push({ x, y, z: JUNK + z, face, tex, ...(scale !== 1 && { scale }) });
town.window(58.5, 41, 'N', { z: JUNK + 4.2 }).window(80.5, 41, 'N', { z: JUNK + 4.4, tex: 'window-louvre' }).window(84, 19.5, 'W', { z: JUNK + 3.4 });
town.pipe(61.5, 41, 'N', { floorZ: JUNK }).pipe(79.3, 41, 'N', { floorZ: JUNK });
town.fixture('wall-unit', 66.6, 41, 'N', { z: JUNK + 2.2 });
// The yard's walls weather twice as much as the town's (`grime()`).
town.grimeBoxes.push([54, 16, 88, 46, 2]);
// Against the walls: drums and crates, scrap sheets leant on them, a power
// unit and a heap of junk, clear of the gates, the deck and the ramp.
list.push(
  at('barrel-rust', 75.9, 40.45), at('barrel-grey', 76.65, 40.6), at('canister-rust', 76.3, 39.85),
  at('scrap', 78.2, 40.99, { angle: 180 }), at('crate-tan', 80.7, 40.4, { angle: 184 }), at('crate-grey-small', 80.75, 40.4, { z: JUNK + 0.9, angle: 170 }),
  at('junk-heap', 82.4, 40.1, { angle: 200 }), at('droid-dome', 83, 39.4, { angle: 60 }),
  at('power-unit', 83.99, 35.9, { angle: 270 }), at('barrel-rust', 83.5, 34.7), at('canister', 83.55, 36.85),
  at('scrap', 56.01, 38.2, { angle: 90 }), at('barrel-rust', 56.5, 33.1),
  at('crate-rust-long', 83.45, 20.4, { angle: 90 }), at('barrel-rust', 83.5, 22.1), at('scrap', 81.6, 18.01, { angle: 0 }),
  at('canister-rust', 80.9, 18.5), at('litter', 82.4, 19.4, { angle: 40 }),
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
town.pipe(88, 51.5, 'W');
// The yard behind J is the garage's back yard: J's back shutter opens onto
// it, and the mechanic works out here in the light, an engine pulled out of
// a speeder laid on trestles over deck plates (models/garage.js), a power
// unit's hose run out to it, a power droid helping, fuel drums against the
// junk yard's wall, oil in the sand. A house on its north side, its door
// under a hood.
town.door(94.5, 49, 'N', { h: 10, tex: 'shutter', tall: 2.25, width: 3, jamb: false, sign: false, panel: false, wall: 'adobe-grey' });
town.window(91.5, 49, 'N', { z: 6.6 });
town.house(88, 29, 98, 36, { h: 6, wall: 'adobe-pale', tiers: [{ box: [89, 29, 97, 35], h: 8.5 }], dome: true });
town.door(91, 36, 'S', { h: 6, wall: 'adobe-pale' }).hood(91, 36, 'S', { h: 6, wall: 'adobe-pale' });
town.window(95.5, 36, 'S', { z: 3.3, tex: 'window-louvre' }).window(94.5, 34, 'S', { z: 7.1 });
town.window(98, 45.5, 'W', { z: 2.4 }).window(86, 43.5, 'E', { z: 3.8 });
town.pipe(97.4, 36, 'S').pipe(86, 47.2, 'E');
list.push(
  at('deck-plate', 92.6, 44.7, { angle: 4 }), at('deck-plate-rust', 94.6, 45.1, { angle: 350 }),
  at('speeder-engine', 93.5, 44.9, { angle: 12 }),
  at('power-unit', 97.4, 48.99, { angle: 180 }), at('barrel-grey', 96.2, 48.4),
  at('crate-grey-small', 91.1, 45.9, { angle: 20 }), at('crate-grey-small', 91.15, 45.9, { z: 0.6, angle: 55 }), at('canister', 95.8, 43.1),
  at('power-droid', 95.2, 46.6, { angle: 165 }),
  at('barrel-rust', 86.45, 41.9), at('barrel-grey', 86.5, 42.65), at('barrel-rust', 87.15, 42.25), at('canister-rust', 86.4, 44.6, { angle: 30 }),
  at('scrap', 89.6, 48.99, { angle: 180 }), at('cargo-pod', 88.9, 38.2, { angle: 95 }),
  at('oil', 93.9, 46.9, { angle: 70 }), at('oil-small', 90.2, 47.6, { angle: 10 }), at('oil-small', 96.4, 41.8, { angle: 140 }),
  at('litter-small', 89.6, 40.1, { angle: 210 }),
  // The mechanic, at the engine.
  at('villager-man', 92.6, 43.3, { angle: 290, wander: 0 }),
);
town.hangings.push(
  // The hose from the power unit, slack along the ground to the engine.
  { type: 'cable', from: [97.4, 48.8, 1.2], to: [94.2, 45.1, 0.9], sag: 0.9 },
  // A cable over the yard, J's back to the house opposite.
  { type: 'cable', from: [96.5, 48.95, 8.4], to: [92.6, 36.05, 5.4], sag: 1.1 },
);
// The garage inside J (Mark, 2026-11-02): its market shutter rolled up, so
// you walk in off the market (the back shutter stays down). The X-34 the
// yard's engine came out of sits on blocks, its right-hand side engine gone,
// a pit droid at the cut wires; a swoop hangs on a hoist; a bench of tools
// on the back wall; one lamp over the speeder; oil on the plates. Its walls
// are two tiles thick where the market and the alley see them, so their
// faces outside keep the sun (a face is lit halfway between its wall's
// light and the floor's in front, so the inner tiles take the garage's);
// the back and east walls are one. A pillar holds up the upper storey's
// front wall, under its window.
{
  const GARAGE = { x0: 90, y0: 50, x1: 100, y1: 56, ceilZ: 4.25, light: 128 };
  p.rect(GARAGE.x0, GARAGE.y0, GARAGE.x1, GARAGE.y1, (_, __, c) => (c.slab || c.wall ? c : {
    ...c, floor: 'yard-plate', floorZ: 0, ceiling: 'sky', ceilZ: town.sky,
    slab: { bottom: GARAGE.ceilZ, top: c.floorZ, floor: c.floor, ceiling: 'planks', side: 'adobe-grey', light: GARAGE.light },
  }));
  town.arch(93, 56, 96, 58, { h: 7, lintel: 2.25, wall: 'adobe-grey', floor: 'yard-plate' });
  // (The two-tile walls' inner tiles, and the east wall, in its light; the
  // back wall, whose far side shows in the yard, halfway.)
  p.light(89, 50, 90, 57, GARAGE.light).light(89, 56, 93, 57, GARAGE.light).light(96, 56, 101, 57, GARAGE.light).light(100, 50, 101, 56, GARAGE.light);
  p.light(89, 49, 101, 50, 168);
  list.push(
    at('shutter-rolled', 94.5, 58, { z: 2.25, angle: 0 }),
    at('landspeeder-blocks', 93.2, 53.4, { angle: 6 }),
    at('pit-droid', 92.6, 55.1, { angle: 95 }),
    at('swoop-hoist', 98.5, 53.4, { angle: 90 }),
    at('workbench', 91.5, 50.01, { angle: 0 }),
    at('cantina-lamp', 93.4, 53.9, { z: GARAGE.ceilZ - LAMP_CORD }),
    at('oil', 92.3, 54.4, { angle: 20 }), at('oil-small', 98.2, 53.1, { angle: 300 }), at('oil-small', 95.1, 51.4, { angle: 80 }),
    at('canister', 99.45, 50.6), at('litter-small', 90.6, 51.3, { angle: 120 }),
  );
  lights.push({ x: 93.4, y: 53.9, z: 3, radius: 4, light: 40 });
}
// The first lane slants up north-east between houses that each take their
// own plaster and height (Mark, 2026-11-01: no copies), so no wall runs
// the lane's length. On its north side the gun shop stands back from the
// slant in a notch, its shutter down for good; its back room is a secret
// (docs/mission1.md, Secrets 4), through a door in the plaster of the
// notch's side wall, half behind a crate: ammo and a thermal detonator left
// on a rack. Washing hangs across the lane.
lane(98, 29, 112, 45, -0.5, 38, 43, 0);
// The gun shop's house stands on its own (Mark, 2026-11-03: houses apart,
// with alleys you can walk into, and domes): the notch in front, an alley
// 1 m wide up its east side, 8 tiles back, washing across it.
p.rect(102, 33, 106, 36, town.street()).rect(106, 26, 108, 34, town.street());
town.slanted([[98, 26], [102, 26], [102, 36], [98, 38]], { h: 6, wall: 'adobe-grey' });
town.house(102, 26, 106, 33, { h: 7.5, wall: 'adobe-pale', skirt: null });
town.slanted([[108, 26], [112, 26], [112, 31], [108, 33]], { h: 5.5, wall: 'adobe-rose' });
// The south side two houses with an alley 1.5 m wide between them, back to
// the market's houses, and the ochre one set back half a tile.
p.rect(102, 41, 105, 47, town.street());
town.slanted([[98, 43], [102, 41], [102, 47], [98, 47]], { h: 4.5, wall: 'adobe-rose', skirt: 'plinth' });
town.slanted([[105, 40], [111, 37], [112, 37], [112, 47], [105, 47]], { h: 6.5, wall: 'adobe-ochre', dome: true });
town.door(104, 33, 'S', { h: 7.5, tex: 'shutter', tall: 2.25, width: 2, jamb: false, panel: false, wall: 'adobe-pale' });
{
  const GUNS = { h: 6, wall: 'adobe-grey', light: 88, ceilZ: 3.75 };
  town.room(99, 28, 101, 36, GUNS).room(101, 29, 102, 32, GUNS).room(102, 27, 105, 32, { ...GUNS, h: 7.5, wall: 'adobe-pale' });
  town.arch(101, 33, 102, 35, { h: 6, lintel: 3, wall: 'adobe-grey' });
  p.rect(101, 33, 102, 35, (_, __, c) => ({ ...c, door: 'adobe-grey', style: 'rise', secret: true }));
  p.rect(99, 28, 105, 36, (_, __, c) => (c.slab && !c.door ? { ...c, secret: true } : c));
  // (Its walls in its own dim light, not the sun's, where they've no face outside.)
  p.light(98, 26, 106, 32, GUNS.light).light(98, 32, 101, 36, GUNS.light).light(101, 32, 102, 33, GUNS.light);
  list.push(
    at('rack-b', 103.5, 27.05, { angle: 0 }), at('crate-tan', 99.6, 28.6, { angle: 10 }), at('crate-grey-small', 99.6, 28.6, { z: 0.9, angle: 40 }),
    at('barrel-rust', 99.5, 34.5), at('canister-rust', 99.45, 33.6),
    at('thermal-detonator', 103.5, 29.6), at('power-cell', 102.6, 30.8), at('power-cell', 99.8, 31),
    at('cantina-lamp', 102.5, 29.5, { z: GUNS.ceilZ - LAMP_CORD }),
    // Outside, a crate stood half across the door, and the shop's sign's drums.
    at('crate-tan', 102.62, 34.8, { angle: 8 }), at('canister', 105.3, 33.6), at('barrel-grey', 105.45, 34.5),
  );
  lights.push({ x: 102.5, y: 30, z: 2.5, radius: 4, light: 32 });
}
// Bare brick and patches where the lane's plaster has given way (decals on
// the slanting walls, at points along them: onSlant, at the top).
town.decals.push(
  onSlant([98, 38], [102, 36], 0.5, 2.1, 'brick-bare-2'), onSlant([105, 40], [111, 37], 0.25, 3.6, 'brick-bare-1', 1.1),
  onSlant([105, 40], [111, 37], 0.75, 3.4, 'patch-rust', 0.9), onSlant([108, 33], [112, 31], 0.4, 2.8, 'brick-bare-2', 0.9),
  onSlant([98, 43], [102, 41], 0.6, 3.1, 'patch-plate', 0.9),
);
// Washing across the lane: a tie point on each wall, square across from
// the north wall's at `x`, 0.05 out from both (past x 105 the south wall is
// the ochre house, set back half a tile).
const acrossLane = (x, z0, z1) => {
  const [nx, ny] = [1 / Math.sqrt(5), 2 / Math.sqrt(5)];
  const y = 38 - 0.5 * (x - 98);
  const d = 5 / Math.sqrt(1.25) - 0.1 + (x + 2 > 105 ? 0.5 * ny : 0);
  const r = (v) => Math.round(v * 100) / 100;
  return { from: [r(x + 0.05 * nx), r(y + 0.05 * ny), z0], to: [r(x + (0.05 + d) * nx), r(y + (0.05 + d) * ny), z1] };
};
town.hangings.push(
  { type: 'cloth-pale', ...acrossLane(99.6, 3.7, 3.5), length: 1.1, pin: 'corners' },
  { type: 'rag', from: [106.05, 29.6, 4], to: [107.95, 29.9, 3.9], length: 1 },
  { type: 'cable', ...acrossLane(103.3, 5.6, 4.1), sag: 0.5 },
  { type: 'rope', ...acrossLane(108.6, 4.6, 4.2), sag: 0.4 },
);
list.push(at('villager-woman', 107.4, 38.2, { wander: 2 }));
// The second yard, a step up, is the spacers': their hostel on its north
// side, a flophouse of bunks (models/hostel.js) you see through its open
// windows, its door under a hood with the striped sign in it; a spacer's
// astromech waits outside with the luggage. A tin lean-to on the south
// side keeps the hostel's water, a vaporator beside it; a house door in
// the west wall.
p.rect(112, 22, 126, 36, town.street(0.25, { side: 'adobe-brick' }));
town.house(112, 12, 126, 22, { h: 8, r: 1, wall: 'adobe-rose', dome: true });
town.room(113, 13, 125, 21, { h: 8, floorZ: 0.25, ceilZ: 5, wall: 'adobe-rose', light: 120 });
town.arch(118, 21, 120, 22, { h: 8, lintel: 3.5, floorZ: 0.25, wall: 'adobe-rose' });
town.hood(119, 22, 'S', { h: 8, floorZ: 0.25, wall: 'adobe-rose' });
town.decals.push({ x: 119, y: 22, z: 4.15, face: 'S', tex: 'door-sign' });
windowThrough(114, 116, 21, { sill: 1.4, top: 2.3, light: 120 });
windowThrough(122, 124, 21, { sill: 1.4, top: 2.3, light: 120 });
// (Its walls inside in its light, where they've no face outside.)
p.light(112, 12, 126, 13, 120).light(112, 13, 113, 21, 120).light(125, 13, 126, 21, 120);
town.house(114, 33, 120, 36, { h: 4, wall: 'adobe-grey', skirt: null });
town.leanTo(114, 33, 120, 36, { h: 3.75, face: 'N', floorZ: 0.25, seed: 21 });
town.door(116, 33, 'N', { h: 4, floorZ: 0.25, tex: 'door-grey', wall: 'adobe-grey' });
town.door(112, 28, 'E', { h: 5.5, floorZ: 0.25, wall: 'adobe-rose' });
town.fixture('wall-tank', 123.5, 36, 'N', { z: 2.8 }).pipe(124.4, 22, 'S', { floorZ: 0.25 });
list.push(
  at('bunk', 114.45, 13.52, { angle: 0 }), at('bunk-b', 116.95, 13.52, { angle: 0 }),
  at('bunk-b', 121.05, 13.52, { angle: 0 }), at('bunk', 123.55, 13.52, { angle: 0 }), at('bunk', 113.52, 17.6, { angle: 90 }),
  at('cargo-pod', 124.1, 18.2, { angle: 85 }), at('crate-grey-small', 124.35, 20.3, { angle: 10 }), at('canister', 113.5, 20.4),
  at('cantina-lamp', 116, 16.8, { z: 5 - LAMP_CORD }), at('cantina-lamp', 122, 16.8, { z: 5 - LAMP_CORD }),
  at('villager-adventurer', 118.6, 16.2, { angle: 20, wander: 0 }), at('villager-wanderer', 122.6, 15.8, { angle: 250, wander: 0 }),
  // Outside: the astromech and the luggage, the water shed's vaporator.
  at('astromech-blue', 121.4, 23.2, { angle: 200 }),
  at('cargo-pod', 115.6, 23.0, { angle: 2 }), at('crate-grey-small', 116.95, 22.75, { angle: 14 }), at('crate-grey-small', 116.9, 22.8, { z: 0.85, angle: 40 }),
  at('barrel-rust', 124.6, 22.7), at('litter-small', 119.8, 27.4, { angle: 70 }), at('litter', 123.5, 31.5, { angle: 200 }),
  at('vaporator', 121.6, 34.6), at('canister-rust', 122.45, 35.3),
  at('villager-adventurer', 118.2, 27.5, { wander: 3 }),
);
lights.push({ x: 116, y: 16.8, z: 3, radius: 4.5, light: 40 }, { x: 122, y: 16.8, z: 3, radius: 4.5, light: 40 });
// The second lane slants down south-east to the square, between four
// houses, and the alley's power comes off a box on its north wall: cables
// strung from it across the lane, along it and up to the roofs, each to a
// house that's tapped in.
lane(126, 23, 136, 39, 0.5, 26, 31, 0.25);
// Two houses a side, an alley between each pair (Mark, 2026-11-03: the
// slots were cracks), the two facing across the lane halfway down: on the
// north 1 m wide and 10 tiles back, the ochre house past it set back a
// tile; on the south 1.5 m wide and 10 back, the grey house past it set
// back half a tile. Too narrow for domes (none under 3 m across).
p.rect(130, 18, 132, 29, town.street(0.25)).rect(132, 27, 136, 31, town.street(0.25)).rect(130, 33, 133, 44, town.street(0.25));
town.slanted([[126, 18], [130, 18], [130, 28], [126, 26]], { h: 7 });
town.slanted([[132, 18], [136, 18], [136, 30], [132, 28]], { h: 8.5, wall: 'adobe-ochre' });
town.slanted([[126, 31], [130, 33], [130, 44], [126, 44]], { h: 6, wall: 'adobe-pale' });
town.slanted([[133, 35], [135, 36], [136, 36], [136, 44], [133, 44]], { h: 5, wall: 'adobe-grey', skirt: 'plinth' });
{
  // A point on the north wall at x (y = 26 + (x - 126) / 2), or on the
  // south one (y = 31 + ...), `out` into the lane; past the alleys, on the
  // houses set back (the ochre a tile, the grey half a tile).
  const n = [-1 / Math.sqrt(5), 2 / Math.sqrt(5)];
  const r = (v) => Math.round(v * 1000) / 1000;
  const north = (x, out, z) => [r(x + n[0] * out), r(26 + (x - 126) / 2 - (x > 131 ? 1 : 0) + n[1] * out), z];
  const south = (x, out, z) => [r(x - n[0] * out), r(31 + (x - 126) / 2 + (x > 133 ? 0.5 : 0) - n[1] * out), z];
  const [bx, by] = north(133.6, 0.01, 0);
  list.push(
    at('wall-unit', bx, by, { z: 2.5, angle: 333 }),
    at('barrel-grey', ...north(128.9, 0.42, 0).slice(0, 2)), at('junk-heap', ...south(128.6, 0.75, 0).slice(0, 2), { angle: 25 }),
    at('litter-small', 133.4, 32.4, { angle: 120 }),
  );
  town.decals.push({ x: r(132.8), y: r(28.4), z: 1.7, face: 'angled', tex: 'wall-meter' });
  town.hangings.push(
    { type: 'cable', from: north(133.55, 0.05, 3.1), to: south(129.6, 0.05, 4.4), sag: 0.5 },
    { type: 'cable', from: north(133.7, 0.05, 3.1), to: south(134.6, 0.05, 3.7), sag: 0.4 },
    { type: 'cable', from: north(133.8, 0.05, 3.2), to: north(135.4, 0.05, 8.3), sag: 0.2 },
    { type: 'cable', from: north(133.4, 0.05, 3.1), to: north(128.3, 0.05, 4.9), sag: 0.4 },
  );
}
// The square at the alleys' east end is the thug's: his back room off its
// north side through a round-topped arch, stacked with what he deals in
// (a rack of it, big crates, a terminal), the thug inside under a lamp, and
// his men at a game of sabacc on a crate in the square, cards on it, a
// stool left empty. Houses on its east and south sides.
p.rect(136, 30, 146, 42, town.street(OQ));
town.stair(136, 30, 138, 42, { up: 'E', from: 0.25, top: OQ, rise: 0.25, floor: 'flagstone', side: 'adobe-brick' });
town.house(136, 20, 146, 30, { h: 8, r: 1, wall: 'adobe-grey', dome: true });
town.room(137, 21, 145, 29, { h: 8, floorZ: OQ, ceilZ: 5.5, wall: 'adobe-grey', light: 112 });
town.arch(140, 29, 143, 30, { h: 8, lintel: 3.5, floorZ: OQ, wall: 'adobe-grey', round: 'S' });
windowThrough(137, 139, 29, { sill: 4.4, top: 5.2, light: 112 });
p.light(136, 20, 146, 21, 112).light(136, 21, 137, 29, 112).light(145, 21, 146, 29, 112);
// Its corners alleys 1 m wide, not joints (Mark, 2026-11-03): one east
// between the thug's neighbours, back 6 tiles, where his men keep their
// drums; one south past the rose house, back 5.
p.rect(146, 30, 152, 32, town.street(OQ)).rect(144, 42, 146, 47, town.street(OQ));
town.house(146, 32, 152, 47, { h: 8, wall: 'adobe', dome: true });
town.door(146, 36, 'W', { h: 8, floorZ: OQ, tex: 'door-red' }).buttress(146, 39.6, 'W', { h: 8, floorZ: OQ });
town.house(139, 42, 144, 47, { h: 7.5, wall: 'adobe-rose', skirt: 'dirt' });
town.window(142.5, 42, 'N', { z: OQ + 2.8, tex: 'window-louvre' }).pipe(143.6, 42, 'N', { floorZ: OQ });
town.door(136, 39, 'E', { h: 5, floorZ: OQ, tex: 'door-grey', wall: 'adobe-grey' });
list.push(
  at('rack-c', 140, 21.05, { angle: 0 }), at('bay-crate-grey', 138.1, 24.1, { angle: 4 }), at('bay-crate-tan', 143.9, 22.5, { angle: 352 }),
  at('crate-rust-long', 144.2, 26.7, { angle: 90 }), at('crate-tan', 137.8, 26.9, { angle: 12 }), at('crate-grey-small', 137.8, 26.9, { z: OQ + 0.9, angle: 50 }),
  at('terminal', 143.6, 24.6, { angle: 180 }),
  at('cantina-lamp', 141.5, 25, { z: 5.5 - LAMP_CORD }),
  at('villager-adventurer', 141.6, 23.6, { angle: 270, wander: 0 }),
  // The game.
  at('crate-tan', 141.6, 35.2, { angle: 30 }), at('cantina-datapad', 141.55, 35.15, { z: OQ + 0.9, angle: 75 }), at('canister', 142.75, 34.2),
  at('cantina-stool', 141.4, 36.6), at('cantina-stool', 142.8, 36.1),
  at('villager-man', 140.15, 35.4, { angle: 0, wander: 0 }), at('villager-adventurer', 143.05, 35.0, { angle: 180, wander: 0 }),
  at('villager-wanderer', 141.75, 33.55, { angle: 270, wander: 0 }),
  at('barrel-rust', 150.6, 30.5), at('barrel-rust', 151.45, 30.55), at('barrel-grey', 151.5, 31.4), at('litter', 138.6, 39.6, { angle: 300 }),
);
lights.push({ x: 141.5, y: 25, z: 3.5, radius: 5, light: 36 });
town.stair(136, 42, 139, 48, { up: 'N', top: OQ, rise: 0.25, floor: 'flagstone', side: 'adobe-brick' });

// Domes on the blocks of town the streets left whole, two in three.
for (const { box: [x0, y0, x1, y1], h, wall } of blocks) {
  if (hash(x0 + 3, y0 + 7) > 0.67) continue;
  let whole = true;
  for (let y = y0; y < y1 && whole; y++) for (let x = x0; x < x1 && whole; x++) whole = p.get(x, y).floorZ === h && !p.get(x, y).slab;
  if (whole) town.dome((x0 + x1) / 2, (y0 + y1) / 2, h, Math.min(x1 - x0, y1 - y0), { wall });
}

town.finish();
town.drifts();
// Rain streaks, dust and stains on the walls (lib/town.js).
town.grime();
// Inside the cantina, filthy (Mark): soot, dirt, stains and smudges thick on
// every wall from floor to ceiling.
town.grimeIndoors(87, 82, 127, 119, { amount: 4 });
// The garage in J: soot and oily smudges.
town.grimeIndoors(90, 50, 100, 56, { amount: 2.5, seed: 31 });
// The freighter's hold: grime on its walls, a lamp still flickering, and
// what was left: dead consoles, panels off the walls, wires out of the
// ceiling's holes (one live), junk. Rusk's spot in the middle stays clear.
town.grimeIndoors(172, 130, 191, 139, { amount: 3, seed: 29 });
lights.push({ x: 184.5, y: 134.5, z: DERELICT.floorZ + 3, radius: 5, light: 64, fx: 'flicker', min: 8 });
list.push(
  at('ceiling-lamp', 184.5, 134.5),
  at('hold-wires', 176.9, 132.5, { z: DERELICT.floorZ, angle: 30, lit: 96 }), at('hold-wires-live', 183.4, 136.6, { z: DERELICT.floorZ, angle: 0, lit: 96 }),
  at('hold-wires', 186.5, 133.5, { z: DERELICT.floorZ, angle: 200, lit: 96 }),
  at('hold-console', 178.6, 131, { z: DERELICT.floorZ, angle: 0, lit: 96 }), at('hold-console', 176.2, 138, { z: DERELICT.floorZ, angle: 180, lit: 96 }),
  at('hold-panel-leaning', 182.5, 131, { z: DERELICT.floorZ, angle: 0, lit: 96 }), at('hold-panel-leaning', 185.9, 138, { z: DERELICT.floorZ, angle: 180, lit: 96 }),
  at('hold-panel-down', 185, 134.6, { z: DERELICT.floorZ, angle: 20, lit: 96 }), at('hold-panel-down', 178.2, 136.4, { z: DERELICT.floorZ, angle: 75, lit: 96 }),
  at('junk-heap', 174.9, 132, { z: DERELICT.floorZ, angle: 30 }), at('droid-dome', 187.2, 131.7, { z: DERELICT.floorZ, angle: 140 }),
  at('barrel-rust', 174.7, 137.3, { z: DERELICT.floorZ }), at('canister-rust', 175.4, 137.4, { z: DERELICT.floorZ }),
  at('crate-grey-small', 187.2, 137.3, { z: DERELICT.floorZ, angle: 20 }), at('rubble', 181.6, 137.2, { z: DERELICT.floorZ, angle: 110 }),
  at('oil', 182.2, 133.2, { z: DERELICT.floorZ, angle: 40 }), at('oil-small', 176.6, 134.9, { z: DERELICT.floorZ, angle: 150 }),
  at('litter-small', 179.4, 136.9, { z: DERELICT.floorZ, angle: 60 }), at('litter-small', 186.4, 135.9, { z: DERELICT.floorZ, angle: 200 }),
);
// Crates, drums, canisters, cargo pods, junk and litter along the walls
// (lib/town.js), but none yet in the blocked-out middle and east third.
town.clutter({ keep: [[STABLE.x0, STABLE.y0, STABLE.x1, STABLE.y1], [92, 56, 97, 61], [126, 92, 130, 122], [130, 86, 150, 122], [136, 44, W, H], [54, 1, 146, 49], [57, 94, 87, 131], [87, 82, 126, 122], [85, 76, 102, 82]] });
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

// The mouth of the alley to the junk yard: the Jawas' junk spilling out of
// it onto the market, a scrapped droid by I's cut corner and a Jawa
// standing at it, who waves you up the alley once the broker has sent you.
list.push(
  at('canister-rust', 71.5, 57.3), at('crate-grey-small', 71.6, 58.4, { angle: 15 }), at('droid-dome', 71.6, 58.4, { z: 0.6, angle: 230 }),
  at('junk-heap', 76.7, 57.5, { angle: 45 }), at('astromech-rust', 75.9, 56.8, { angle: 300 }), at('power-droid-rust', 77.9, 58.7, { angle: 250 }),
  at('litter', 73.6, 59.6, { angle: 120 }), at('litter-small', 72.4, 54.2, { angle: 10 }),
  at('jawa', 75.4, 59.4, {
    angle: 270,
    calm: { wander: 0 },
    talk: [
      { unless: 'contract', lines: ['Utinni!'] },
      { lines: ['Utinni! (He waves you up the alley, to the junk yard.)'] },
    ],
  }),
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
const QUARTER_PATROL = [[153.5, 68], [165, 70], [178, 78], [185, 90]];
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
  at('villager-man', 152, 73, { wander: 2 }),
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
          'Across the market, up the alley by the Jawas.',
        ],
        set: 'contract',
      },
      { lines: ["You've got the job. Go.", 'The junk yard, Katarn. Up the alley by the Jawas.'] },
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
  // A sheet across the alley between H and I, and a rag strung over its
  // mouth.
  { type: 'cloth-pale', from: [71.05, 52, 4.1], to: [74.95, 52.6, 4.1], length: 1, pin: 'corners' },
  { type: 'rag', from: [71.05, 57.4, 3.9], to: [76.6, 56.6, 3.7], length: 1.1 },
  // A long banner down I's cut corner, marking the way to the Jawas.
  { type: 'rag', from: [75.91, 56.09, 4.4], to: [76.91, 57.09, 4.4], length: 2.8 },
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
  decals: [...town.decals, ...bayDecals, ...pitDecals, ...derelictDecals, ...bay86Decals],
  lights,
  hangings: [...hangings, ...derelictHangings, ...town.hangings],
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
