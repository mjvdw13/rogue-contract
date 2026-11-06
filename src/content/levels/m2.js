import { defineLevel } from '../../engine/defs.js';
import { Painter } from './lib/painter.js';
import { Town } from './lib/town.js';
import { valueNoise } from './lib/noise.js';

// MISSION 2: THE HOMESTEAD. The layout, route and numbers are in
// docs/mission2.md (area numbers below match its table). The blockout:
// every area as plain volumes at its final heights, with the real ways
// between them. Painted in code on the fine grid (1 tile = 0.5 m) with the
// town kit (lib/town.js) for the farm's plaster, the pits and the rooms.
//
// The farm is a walk from its working end in the west to the house in the
// east, a chain of areas with one way on from each: dropped into the
// garden pit, along the pump tunnels to the workshop pit; the way east
// caved in, so up through the generator shed into the work yard, where
// the officer carries the red key to the gate; up the lane to the house's
// great dome, down into its courtyard pit and through its rooms to the
// cellar (the recordings); then out through the garage, its pit and the
// trench to hold the landing pad.

const W = 208;
const H = 142;
const SKY = 32;
/** Open ground in the evening suns, before their shadows. */
const SUN = 176;

// Heights, in units (1 unit = 0.5 m). The landing pad is at 0.
const FARM = 0.5;
const WALL = FARM + 6;
const PIT = -5.5;
const CEIL = -1.5;
const CELLAR = -8.5;

/** The suns at evening, low in the west-south-west, so the shadows run long to the east-north-east. */
const EVENING = [
  { az: 196, elev: 14, drop: 40 },
  { az: 204, elev: 18, drop: 28 },
];

const p = new Painter(W, H, { wall: 'sandstone' });
const town = new Town(p, { sky: SKY, light: SUN, wall: 'adobe-pale', floor: 'desert-sand' });
const at = (type, x, y, extra = {}) => ({ type, x, y, ...extra });
const list = [];
const lights = [];
const quarter = (z) => Math.round(z * 4) / 4;

// ---- Cells
/** Desert sand: the drifts, the pad. */
const sand = (z = 0, extra = {}) => ({ floor: 'desert-sand', ceiling: 'sky', floorZ: z, ceilZ: SKY, light: SUN, side: 'desert-sand', ...extra });
/** The farm's packed yard; its edges (the walls of the rooms dug under it) are the farm's whitewash. */
const yard = (z = FARM, extra = {}) => ({ floor: 'street-sand', ceiling: 'sky', floorZ: z, ceilZ: SKY, light: SUN, side: 'adobe-pale', ...extra });

/** A tile's top: what you'd stand on there (a slab's top, a low angled wall's top, or its floor). */
const topOf = (c) => (c.slab ? c.slab.top : c.line && c.wallTop !== undefined ? c.wallTop : c.floorZ ?? 0);

/**
 * Space dug under the ground (or under a building) over the box: the lower
 * storey of a slab whose top is what was there (the yard, a drift, a
 * roof), so the surface stays as it was. `floorZ` and `ceilZ` may be
 * functions (of the tile, and of its floor), for a stair. `top` overrides
 * the slab's top (a doorway through a pit's wall, whose tiles were its low
 * angled wall).
 */
function under(x0, y0, x1, y1, { floorZ, ceilZ = CEIL, top, floor = 'flagstone', ceiling = 'planks', light = 112, side = 'adobe-pale', extra = {} }) {
  p.rect(x0, y0, x1, y1, (x, y, old) => {
    const f = typeof floorZ === 'function' ? floorZ(x, y) : floorZ;
    const t = top ?? topOf(old);
    const c = typeof ceilZ === 'function' ? ceilZ(f, old, t) : ceilZ;
    const surface = old.line ? yard(t) : old;
    return {
      floor, ceiling: 'sky', floorZ: f, ceilZ: SKY, light: surface.light ?? SUN, side,
      slab: { bottom: c, top: t, floor: surface.floor ?? 'street-sand', ceiling, side: surface.side ?? side, light },
      ...extra,
    };
  });
}
/** A tunnel or room under the farm's ground, at the pits' floor. */
const dig = (x0, y0, x1, y1, opts = {}) => under(x0, y0, x1, y1, { floorZ: PIT, ...opts });
/** A doorway through a pit's round wall (its tiles were the wall's low angled tiles). */
const ARCH = { ceilZ: PIT + 3.5, top: FARM };
/** A stair dug down a box toward the south, a step of 0.5 a tile from `from` at row `y0`, its ceiling stepping down with it. */
const stairDown = (x0, y0, x1, y1, from, opts = {}) =>
  under(x0, y0, x1, y1, {
    floorZ: (x, y) => from - 0.5 * (y - y0),
    ceilZ: (f, old, t) => Math.min(old.slab ? old.slab.bottom : t - 0.25, f + 4.5),
    light: 96,
    ...opts,
  });

/**
 * A light well: a 2 x 2 shaft from the yard down into a tunnel or room, open
 * to the sky, with a kerb round its mouth on the yard (0.9, jumpable: a drop
 * of 6 into the tunnel). Too narrow to climb out of.
 */
function well(x, y) {
  p.rect(x - 1, y - 1, x + 3, y + 3, (_, __, c) => (c.slab ? { ...c, slab: { ...c.slab, top: c.slab.top + 0.9 } } : { ...c, floorZ: c.floorZ + 0.9 }));
  p.rect(x, y, x + 2, y + 2, (_, __, c) => ({ floor: c.floor, ceiling: 'sky', floorZ: c.floorZ, ceilZ: SKY, light: 136, side: 'adobe-pale' }));
}

/** Tag tiles of a box (for triggers and spawns), keeping what they are. */
const tag = (x0, y0, x1, y1, name) => p.rect(x0, y0, x1, y1, (_, __, c) => ({ ...c, tag: name }));
/** Mark a box's open tiles as a secret area. */
const secret = (x0, y0, x1, y1) => p.rect(x0, y0, x1, y1, (_, __, c) => (c.wall && !c.line ? c : { ...c, secret: true }));
const boxDist = (x, y, [x0, y0, x1, y1]) => Math.hypot(Math.max(x0 - x, 0, x - (x1 - 1)), Math.max(y0 - y, 0, y - (y1 - 1)));
/** A roll-down shutter over a box of dug tiles, up once the recordings are taken. */
const shutter = (x0, y0, x1, y1) => p.rect(x0, y0, x1, y1, (_, __, c) => ({ ...c, door: 'shutter-rising', style: 'rise', lock: 'remote', stayOpen: true, tag: 'garage' }));

// ---------------------------------------------------------------- the farm's ground and its walls
// The farm's packed ground inside its windbreak (3 m), an L: a strip along
// the north, and the house's end running on south to the pad. Walls as
// tall split it into compounds: the garden court (out of reach, over the
// pump tunnels), the work yard, the lane, the house's ground, and the back
// plot (out of reach, over the cellar and round the garage pit). Sand
// drifts against every wall's foot: walkable, rising a half step a tile to
// 2 at the wall, 2 to 4 tiles deep.
const GROUND = [[12, 12, 188, 64], [138, 64, 188, 104]];
for (const box of GROUND) p.rect(...box, yard());
const walls = [];
const windbreak = (x0, y0, x1, y1) => {
  walls.push([x0, y0, x1, y1]);
  town.block(x0, y0, x1, y1, { h: WALL, skirt: null });
};
windbreak(10, 10, 190, 12); // the windbreak, north
windbreak(10, 12, 12, 66); // west
windbreak(188, 12, 190, 106); // east
windbreak(10, 64, 138, 66); // south of the garden court, the work yard and the lane
windbreak(126, 24, 144, 26); // the lane | the plot south of it (out of reach)
windbreak(144, 26, 146, 106); // that plot | the house, and the back plot's west side
windbreak(138, 104, 177, 106); // south, either side of the trench's gate
windbreak(183, 104, 188, 106);
windbreak(64, 12, 66, 64); // the garden court | the work yard
windbreak(124, 12, 126, 64); // the work yard | the lane (the gate in it)
windbreak(138, 70, 188, 72); // the house | the back plot
for (const box of GROUND) {
  p.rect(...box, (x, y, c) => {
    if (c.floor !== 'street-sand' || c.floorZ !== FARM) return c;
    const e = Math.min(...walls.map((b) => boxDist(x, y, b))) - 1;
    const z = 0.5 * Math.max(0, Math.min(4, 2 + 2 * valueNoise(x, y, 9, 41) - e));
    return z > 0 ? sand(quarter(FARM + z)) : c;
  });
}
/** Swept ground in front of a doorway or gate: no drift to climb. */
const apron = (x0, y0, x1, y1) => p.rect(x0, y0, x1, y1, yard());

// ---------------------------------------------------------------- 9. the landing pad
// Outside the windbreak's south side, below the trench's gate: a hollow of
// drifts too steep to climb (2 at once, then on up), cut in three places
// where the wind has scoured gaps, each opening into a pocket out of sight
// (where the hold-out comes from).
const PAD = [150, 106, 196, 132];
p.rect(128, 92, W - 1, H - 1, (x, y, c) => (x < 190 && y < 106 ? c : sand(quarter(Math.min(6, 2 + 0.4 * boxDist(x, y, PAD) + 0.5 * valueNoise(x, y, 4, 42))))));
p.rect(...PAD, sand(0));
for (const box of [
  [142, 114, 150, 120], [134, 110, 142, 124], // the west cut and its pocket
  [166, 132, 172, 136], [160, 134, 178, 138], // the south cut
  [196, 110, 202, 116], [198, 104, 204, 122], // the east cut
]) p.rect(...box, sand(0));
tag(168, 116, 176, 124, 'pickup');
for (const [x, y] of [[168, 116], [176, 116], [168, 124], [176, 124]]) lights.push({ x, y, z: 1, radius: 3, light: 32 });
list.push(
  at('boulder-large', 158.5, 113, { angle: 30 }), at('boulder-small', 162.5, 126.5, { angle: 200 }),
  at('boulder-large', 186.5, 112, { angle: 140 }), at('boulder-small', 189, 125.2, { angle: 80 }),
  at('boulder-small', 154.5, 121.5, { angle: 310 }), at('boulder-large', 180.5, 129, { angle: 250 }),
);

// ---------------------------------------------------------------- 4. the work yard: the generator shed, the staging point, the gate
// The generator shed: a tin blockhouse in the yard's north-west corner
// (burning, with the detail), its door east; a hatch in its floor and a
// stair down south to the workshop. Coming up it you step out facing east,
// the house's dome over the yard's far wall.
town.house(68, 12, 84, 24, { h: FARM + 5, wall: 'metal-rust', skirt: null });
town.room(69, 13, 83, 23, { h: FARM + 5, floorZ: FARM, ceilZ: FARM + 4, wall: 'metal-rust', light: 96 });
town.arch(83, 15, 84, 20, { h: FARM + 5, lintel: 3, floorZ: FARM, wall: 'metal-rust', floor: 'street-sand', light: 96 });
apron(84, 14, 88, 21);
tag(84, 14, 88, 21, 'reveal');
lights.push({ x: 80, y: 20, z: FARM + 2, radius: 6, light: 64 });
// The Imperials' staging point, in the middle of the yard: a lit
// floodlight, crates, barricades, a power unit. The officer here carries
// the gate's key.
list.push(
  at('floodlight-tower-worn', 110.5, 33.5, { angle: 225, z: FARM }),
  at('barricade-worn', 105, 41, { angle: 20, z: FARM }), at('barricade-worn', 113, 43, { angle: 100, z: FARM }),
  at('supply-crate', 104, 35.5, { z: FARM }), at('supply-crate', 105.4, 36.2, { z: FARM }), at('supply-crate', 104.6, 37.6, { z: FARM }),
  at('power-unit', 115.5, 31.5, { z: FARM }),
);
lights.push({ x: 109, y: 37, z: 3.5, radius: 8, light: 64 });
// The farm's gate onto the lane, in the yard's east wall straight across
// from the shed's door: the Imperials' red lock on it, a lamp over it.
town.arch(124, 15, 126, 21, { h: WALL, lintel: 4, floorZ: FARM, floor: 'flagstone', light: 136 });
p.rect(125, 15, 126, 21, (_, __, c) => ({ ...c, door: 'imp-door-red', style: 'rise', lock: 'red' }));
apron(119, 13, 124, 23);
apron(126, 13, 131, 23);
tag(118, 13, 124, 23, 'gate');
lights.push({ x: 122, y: 18, z: FARM + 4, radius: 5, light: 48 });

// ---------------------------------------------------------------- 6. the house: its great dome
// A round building at the end of the lane, its door west under a porch,
// tall (its wall 6.5 m, the dome on it 2.75 m more), so it shows over the
// work yard's wall, over the gate: the destination. Inside, a square hall, and a stair
// down its middle, south, under its wall and the ground into the
// courtyard pit.
const DOME = { cx: 160, cy: 20, r: 8, h: FARM + 13 };
town.circle(DOME.cx, DOME.cy, DOME.r, { inside: town.roofCell({ h: DOME.h }), wall: { wall: 'adobe-pale', wallTop: DOME.h }, open: 'out' });
town.dome(DOME.cx, DOME.cy, DOME.h, 11);
town.room(155, 15, 165, 25, { h: DOME.h, floorZ: FARM, ceilZ: FARM + 6, light: 112 });
town.house(146, 18, 152, 22, { h: FARM + 4 });
town.arch(146, 18, 152, 22, { h: FARM + 4, lintel: 3, floorZ: FARM, floor: 'flagstone', light: 128 });
town.arch(152, 18, 155, 22, { h: DOME.h, lintel: 3, floorZ: FARM, floor: 'flagstone', light: 128 });
apron(140, 16, 146, 24);
lights.push({ x: 160, y: 16.5, z: FARM + 5, radius: 6, light: 48 });

// ---------------------------------------------------------------- 1, 3, 6, 8. the four pits
// Round pits 6 deep, open to the sky, their walls the farm's whitewash. No
// parapets: one hides a pit from the troopers on its rim.
const pit = (cx, cy, r, floor = 'street-sand') => town.circle(cx, cy, r, { inside: yard(PIT, { floor }), wall: { wall: 'adobe-pale', wallTop: FARM }, seam: 90 });
pit(28, 46, 6, 'flagstone'); // 1. the garden pit, the drop-off
pit(80, 52, 8); // 3. the workshop pit
pit(160, 46, 12); // 6. the house's courtyard
pit(180, 84, 7, 'flagstone'); // 8. the garage pit
lights.push({ x: 28, y: 46, z: PIT + 3.5, radius: 6, light: 64 }); // the grow lamps
lights.push({ x: 82, y: 56, z: PIT + 1, radius: 5, light: 48 }); // a speeder burning
lights.push({ x: 160, y: 50, z: PIT + 1, radius: 6, light: 56 }); // the cart burning

// ---------------------------------------------------------------- 2. the pump tunnels
// Under the garden court, east from the garden pit: the tunnel, the pump
// room (the water pipe goes down into its pump), and on east under the
// court's wall into the workshop pit. Tunnels 4 wide, ceilings at 2 m.
dig(33, 44, 35, 48, ARCH);
dig(35, 44, 50, 48);
dig(46, 46, 58, 58, { light: 104 });
dig(58, 50, 70, 54);
dig(70, 50, 73, 54, ARCH);
lights.push({ x: 52, y: 52, z: PIT + 3, radius: 6, light: 48 });
// Secret 1: the hidey-hole off the tunnel's north side, where the family
// hid Rusk, behind a door in the plaster.
dig(35, 34, 44, 40, { light: 72 });
dig(39, 40, 41, 44, { light: 72, ceilZ: PIT + 2.5 });
p.rect(39, 43, 41, 44, (_, __, c) => ({ ...c, door: 'adobe-pale', style: 'rise', secret: true }));
secret(35, 34, 44, 44);
list.push(at('med-kit', 36.5, 35.5), at('thermal-detonator', 42.5, 38.5));

// ---------------------------------------------------------------- 3. the workshop
// The droid workshop dug north of the workshop pit, the shed's stair coming
// down into it. The tunnel east from the pit toward the house caved in
// after ten tiles, in sight from the pit's west arch.
dig(70, 26, 88, 40, { light: 120 });
dig(78, 40, 82, 45, ARCH);
stairDown(74, 14, 78, 26, 0);
lights.push({ x: 84, y: 30, z: PIT + 3, radius: 6, light: 48 });
dig(87, 50, 90, 54, ARCH);
dig(90, 50, 100, 54, { light: 88 });
tag(96, 50, 100, 54, 'rubble');
list.push(at('boulder-small', 98.6, 51, { angle: 40 }), at('boulder-small', 99, 53.2, { angle: 160 }));
// Secret 2: the well room south of the caved-in tunnel, reached only down
// its light well from the yard; a secret door out north into the tunnel.
dig(90, 56, 98, 62, { light: 88 });
dig(93, 54, 95, 56, { light: 88, ceilZ: PIT + 2.5 });
p.rect(93, 54, 95, 55, (_, __, c) => ({ ...c, door: 'adobe-pale', style: 'rise', secret: true }));
secret(90, 55, 98, 62);
list.push(at('shield-unit', 91.5, 60.5), at('energy-pack', 96.5, 60.5));

// ---------------------------------------------------------------- 6. the house's rooms
// Round the courtyard pit, under the house's ground: the dome's stair from
// the north, the common room west, the quarters east, the storeroom south,
// and a tunnel from the common room round to the storeroom (a loop for the
// fight).
stairDown(158, 20, 162, 32, 0);
dig(158, 32, 162, 35, ARCH);
dig(138, 40, 146, 52, { light: 112 });
dig(146, 44, 149, 48, ARCH);
lights.push({ x: 142, y: 46, z: PIT + 3, radius: 6, light: 40 });
dig(171, 44, 174, 48, ARCH);
dig(174, 38, 186, 54, { light: 96 });
lights.push({ x: 180, y: 46, z: PIT + 3, radius: 5, light: 32 });
dig(158, 57, 162, 61, ARCH);
dig(150, 61, 170, 70, { light: 96 });
lights.push({ x: 160, y: 65, z: PIT + 3, radius: 5, light: 32 });
dig(140, 52, 144, 66, { light: 88 });
dig(144, 62, 150, 66, { light: 88 });

// ---------------------------------------------------------------- 7. the cellar
// Six steps down from the storeroom: cold and dark, the cistern's pool along
// its south side, the lamp knocked over and still lit on the floor, the
// recordings behind a loose stone at its east end.
stairDown(152, 70, 156, 76, PIT - 0.5, { ceilZ: (f) => Math.min(CEIL, f + 4), light: 80 });
under(144, 76, 166, 88, { floorZ: CELLAR, ceilZ: CELLAR + 4, ceiling: 'sandstone-dark', light: 72 });
under(146, 83, 158, 87, { floorZ: CELLAR - 0.5, ceilZ: CELLAR + 4, floor: 'water-murky', ceiling: 'sandstone-dark', light: 64 });
lights.push({ x: 161.5, y: 79.5, z: CELLAR + 0.3, radius: 4, light: 40 });
tag(162, 77, 166, 81, 'recordings');
// Secret 3: a niche behind a loose panel in the cellar's west wall.
const niche = { floorZ: CELLAR, ceilZ: CELLAR + 2.5, floor: 'sandstone', ceiling: 'sandstone-dark', side: 'sandstone', light: 64 };
under(139, 78, 143, 84, niche);
under(143, 80, 144, 82, { ...niche, extra: { door: 'sandstone', style: 'rise', secret: true } });
secret(139, 78, 144, 84);
list.push(at('power-cell', 140.5, 79.5), at('med-kit', 140.5, 82.5));

// ---------------------------------------------------------------- 8. the garage, its pit, the trench
// Off the storeroom's east side, behind a roll-down shutter, and out by
// another into the garage pit: both down until the recordings are taken.
// Taller inside.
dig(170, 63, 174, 67);
shutter(173, 63, 174, 67);
dig(174, 58, 186, 72, { ceilZ: PIT + 4.5, light: 104 });
dig(178, 72, 182, 78, ARCH);
shutter(178, 72, 182, 73);
lights.push({ x: 180, y: 64, z: PIT + 4, radius: 6, light: 40 });
// The trench: twelve steps of 0.5 up south out of the garage pit, open to
// the sky, walled in the farm's plaster (its walls stand 2 m over the back
// plot at the top, so it stays out of reach); then the gate through the
// windbreak onto the pad.
p.rect(177, 91, 183, 104, (x, y) => yard(PIT + 0.5 * (y - 91), { floor: 'flagstone' }));
town.block(175, 92, 177, 104, { h: FARM + 4, skirt: null });
town.block(183, 92, 185, 104, { h: FARM + 4, skirt: null });
town.arch(177, 104, 183, 106, { h: WALL, lintel: 4, floorZ: FARM, floor: 'flagstone', light: 136 });
tag(177, 102, 183, 106, 'trench-head');

// ---------------------------------------------------------------- the light wells
// Shafts of evening light down into the tunnels and rooms: the pump
// tunnel, the pump room, the tunnel to the workshop pit, the workshop, the
// house's loop tunnel and quarters, and the well room's (its only way in).
for (const [x, y] of [[40, 45], [51, 51], [61, 51], [84, 30], [141, 57], [179, 41], [93, 58]]) well(x, y);

// The farm's vaporators (stand-ins: the town's small one): a few in the
// garden court, seen from the pit; in the yard (off the line from the
// shed's door to the gate); in the lane.
for (const [x, y] of [[18.5, 30.5], [52.5, 30.5], [94.5, 30.5], [112.5, 58.5], [130.5, 22.5], [138.5, 13.5], [184.5, 64.5]]) {
  list.push(at('vaporator', x, y, { z: FARM, angle: Math.round(valueNoise(x, y, 1, 7) * 360) }));
}
// The lane's barricades.
list.push(at('barricade-worn', 137, 16.5, { angle: 100, z: FARM }), at('barricade-worn', 141, 21, { angle: 80, z: FARM }));

town.finish(EVENING);
list.push(...town.things);

// ---------------------------------------------------------------- life (by skill, docs/mission2.md)
const NOT_EASIEST = [2, 3, 4, 5];
const NORMAL_UP = [3, 4, 5];
const HARD = [4, 5];
const EASY = [1, 2];
list.push(
  // 1. The garden pit: a moment to look round.
  at('player', 26.5, 47.5, { angle: 0 }),
  at('med-kit', 30.5, 42.5, { skill: EASY }),
  // 2. The pump tunnels.
  at('stormtrooper', 52.5, 54.5, { angle: 180 }),
  at('stormtrooper', 66.5, 52, { angle: 180, skill: NOT_EASIEST }),
  at('stormtrooper', 56.5, 47.5, { angle: 180, skill: HARD }),
  at('power-cell', 47.5, 56.5),
  // 3. The workshop pit, the rim above it, and the workshop.
  at('stormtrooper', 78.5, 49.5, { angle: 180 }),
  at('stormtrooper', 83.5, 56.5, { angle: 180 }),
  at('stormtrooper', 84.5, 47.5, { angle: 180, skill: NOT_EASIEST }),
  at('sandtrooper', 76.5, 41.5, { angle: 270, z: FARM }),
  at('sandtrooper', 90.5, 58.5, { angle: 180, z: FARM }),
  at('sandtrooper', 70.5, 60.5, { angle: 0, z: FARM, skill: HARD }),
  at('stormtrooper', 82.5, 30.5, { angle: 270 }),
  at('stormtrooper', 76, 27.5, { angle: 270, skill: NORMAL_UP }),
  at('med-kit', 72.5, 37.5, { skill: [1, 2, 3] }),
  at('energy-pack', 86.5, 27.5),
  // 4. The work yard: troopers, the probe droid, the officer with the key.
  at('stormtrooper', 76, 15.5, { angle: 270, skill: NORMAL_UP }),
  at('officer', 108.5, 38.5, { angle: 180, z: FARM, drops: ['keycard-red'] }),
  at('sandtrooper', 102.5, 44.5, { angle: 180, z: FARM }),
  at('sandtrooper', 116.5, 24.5, { angle: 180, z: FARM }),
  at('probe-droid', 98.5, 28.5),
  at('sandtrooper', 118.5, 56.5, { angle: 180, z: FARM, skill: NOT_EASIEST }),
  at('sandtrooper-commander', 112.5, 37.5, { angle: 180, z: FARM, skill: NORMAL_UP }),
  at('sandtrooper', 92.5, 22.5, { angle: 180, z: FARM, skill: HARD }),
  at('sandtrooper', 100.5, 58.5, { angle: 90, z: FARM, skill: HARD }),
  at('power-cell', 106.5, 35.5, { z: FARM }),
  // 5. The lane.
  at('sandtrooper', 140.5, 15, { angle: 180, z: FARM }),
  at('sandtrooper', 142.5, 21.5, { angle: 180, z: FARM }),
  at('sandtrooper', 134.5, 14.5, { angle: 180, z: FARM, skill: NORMAL_UP }),
  at('med-kit', 127.5, 22.5, { z: FARM, skill: EASY }),
  // 6. The house: its ground and the courtyard's rim, the dome's stair, the
  // courtyard, the rooms.
  at('sandtrooper', 149.5, 30.5, { angle: 180, z: FARM }),
  at('sandtrooper', 176.5, 32.5, { angle: 180, z: FARM }),
  at('sandtrooper', 170.5, 62.5, { angle: 90, z: FARM, skill: NOT_EASIEST }),
  at('sandtrooper', 146.5, 60.5, { angle: 90, z: FARM, skill: HARD }),
  at('stormtrooper', 160, 28.5, { angle: 90, skill: NORMAL_UP }),
  at('stormtrooper', 154.5, 44.5, { angle: 90 }),
  at('stormtrooper', 165.5, 49.5, { angle: 90 }),
  at('stormtrooper', 160.5, 54.5, { angle: 90 }),
  at('stormtrooper', 156.5, 51.5, { angle: 45, skill: NOT_EASIEST }),
  at('officer', 162.5, 40.5, { angle: 90, skill: NORMAL_UP }),
  at('stormtrooper', 162.5, 45.5, { angle: 90, skill: HARD }),
  at('energy-pack', 157.5, 40.5),
  at('stormtrooper', 141.5, 44.5, { angle: 0 }),
  at('stormtrooper', 180.5, 46.5, { angle: 180, skill: NOT_EASIEST }),
  at('stormtrooper', 160.5, 66.5, { angle: 90 }),
  at('stormtrooper', 142, 60.5, { angle: 90, skill: HARD }),
  at('med-kit', 139.5, 41.5, { skill: EASY }),
  at('power-cell', 184.5, 39.5),
  at('med-kit', 151.5, 68.5, { skill: [1, 2, 3] }),
  // 8. The garage: a stock of ammo before the hold-out.
  at('power-cell', 175.5, 59.5), at('power-cell', 176.5, 59.5), at('med-kit', 184.5, 70.5),
  at('energy-pack', 184.5, 59.5, { skill: EASY }),
  // The trench's gate.
  at('sandtrooper', 180, 108.5, { angle: 90, skill: NORMAL_UP }),
);

// Where the hold-out's troopers come from when Kyle calls the Crow: the
// pockets beyond the pad's three cuts.
for (const [x, y] of [[137, 115], [138, 121], [169, 136], [201, 107]]) p.set(x, y, { ...p.get(x, y), tag: 'wave' });

export default defineLevel({
  id: 'm2',
  mapLabel: 'M2',
  name: 'THE HOMESTEAD',
  music: 'garrison',
  sky: 'sky-night',
  // Stand-ins until the evening step: the night sky and a dusty haze.
  haze: { color: [120, 84, 72], half: 48 },
  lights,
  par: 540,
  // The story, in stand-ins until the pieces exist (docs/mission2.md): Jan
  // names the house; the rubble sends Kyle up; the house shows over the
  // yard's wall; the gate wants the officer's key; the recordings start the
  // ending and open the garage; at the trench's gate Kyle calls the Crow and
  // the troopers come; the pickup ends the level (Jan's two minutes, the
  // `wait` action, still to come).
  triggers: [
    {
      on: 'start',
      do: [
        { action: 'message', text: "JAN: I CAN'T SET DOWN WITH THEM ON THE GROUND. THIS IS AS CLOSE AS I GET." },
        { action: 'message', text: "KYLE: RUSK SAID THE CELLAR, UNDER THE HOUSE." },
        { action: 'message', text: 'JAN: THE BIG DOME AT THE EAST END. FOLLOW THE WATER PIPE. CALL WHEN YOU HAVE IT.' },
      ],
    },
    { on: 'enter', tag: 'rubble', do: [{ action: 'message', text: 'KYLE: CAVED IN. UP AND OVER, THEN.' }] },
    { on: 'enter', tag: 'reveal', do: [{ action: 'message', text: "KYLE: THERE'S THE HOUSE." }] },
    { on: 'pickup', thing: 'keycard-red', do: [{ action: 'setFlag', flag: 'key' }] },
    { on: 'enter', tag: 'gate', unless: 'key', do: [{ action: 'message', text: "AN IMPERIAL LOCK ON THE FARM'S GATE. THE OFFICER WILL HAVE THE KEY." }] },
    {
      on: 'enter',
      tag: 'recordings',
      do: [
        { action: 'message', text: "A SEALED CASE BEHIND A LOOSE STONE: RUSK'S HELMET RECORDINGS." },
        { action: 'setFlag', flag: 'recordings' },
        { action: 'message', text: 'HEAVY FOOTSTEPS OVERHEAD.' },
        { action: 'message', text: 'JAN: KYLE, SOMETHING BIG JUST WALKED OUT OF THE STORM. GET OUT OF THERE.' },
        { action: 'openDoors', tag: 'garage' },
      ],
    },
    {
      on: 'enter',
      tag: 'trench-head',
      if: 'recordings',
      do: [
        { action: 'message', text: "KYLE: JAN, I'VE GOT IT. COME GET ME." },
        { action: 'message', text: 'JAN: TWO MINUTES!' },
        { action: 'setFlag', flag: 'called' },
        { action: 'spawn', thing: 'sandtrooper', tag: 'wave', fog: false },
      ],
    },
    { on: 'enter', tag: 'pickup', if: 'called', do: [{ action: 'message', text: 'JAN: GET ABOARD!' }, { action: 'exit' }] },
  ],
  ...p.build(),
  things: [],
  list,
});
