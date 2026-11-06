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
// The farm is the whole level, walled in by its windbreak. The way
// through: dropped into the garden pit, through the tunnels to the main
// courtyard and the rooms round it; the way to the cellar caved in and
// barred, so up into the storm, across the yard and down through the
// burning storehouse to the cellar (the recordings); then the barred door
// and the garage open, out through the garage pit's trench to hold the
// landing pad.

const W = 128;
const H = 140;
const SKY = 32;
/** Open ground in the evening suns, before their shadows. */
const SUN = 176;

// Heights, in units (1 unit = 0.5 m). The landing pad is at 0.
const FARM = 0.5;
const WALL = FARM + 6;
const PIT = -5.5;
const CEIL = -1.5;
const CELLAR = -8.5;
/** The yard inside the windbreak. */
const YARD = [12, 12, 110, 96];

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

// ---------------------------------------------------------------- 5. the yard and the windbreak
// The farm's packed yard inside its windbreak (3 m), sand drifted against
// the wall's foot all round: walkable, rising a half step a tile to 2.5 at
// the wall, 2 to 5 tiles deep. Beyond the windbreak, nothing: the sky.
p.rect(...YARD, (x, y) => {
  const e = Math.min(x - YARD[0], YARD[2] - 1 - x, y - YARD[1], YARD[3] - 1 - y);
  const depth = 2 + 3 * valueNoise(x, y, 9, 41);
  const z = 0.5 * Math.max(0, Math.min(4, depth - e));
  return z > 0 ? sand(quarter(FARM + z)) : yard();
});
const windbreak = (x0, y0, x1, y1) => town.block(x0, y0, x1, y1, { h: WALL, skirt: null });
windbreak(10, 10, 112, 12);
windbreak(10, 12, 12, 96);
windbreak(110, 12, 112, 96);
windbreak(10, 96, 89, 98);
windbreak(95, 96, 112, 98);

// ---------------------------------------------------------------- 9. the landing pad
// Outside the windbreak's south side: a hollow of drifts too steep to climb
// (2 at once, then on up), cut in three places where the wind has scoured
// gaps, each opening into a pocket out of sight (where the hold-out comes
// from).
const PAD = [62, 98, 118, 132];
p.rect(44, 98, W - 1, H - 1, (x, y) => sand(quarter(Math.min(6, 2 + 0.4 * boxDist(x, y, PAD) + 0.5 * valueNoise(x, y, 4, 42)))));
p.rect(...PAD, sand(0));
for (const box of [
  [54, 110, 62, 116], [46, 106, 54, 120], // the west cut and its pocket
  [86, 132, 92, 136], [80, 134, 98, 138], // the south cut
  [118, 106, 124, 112], [120, 100, 126, 118], // the east cut
]) p.rect(...box, sand(0));
tag(96, 112, 104, 120, 'pickup');
for (const [x, y] of [[96, 112], [104, 112], [96, 120], [104, 120]]) lights.push({ x, y, z: 1, radius: 3, light: 32 });
list.push(
  at('boulder-large', 84.5, 104, { angle: 30 }), at('boulder-small', 88.5, 122.5, { angle: 200 }),
  at('boulder-large', 110.5, 108, { angle: 140 }), at('boulder-small', 112, 124.2, { angle: 80 }),
  at('boulder-small', 76.5, 116.5, { angle: 310 }), at('boulder-large', 102.5, 128, { angle: 250 }),
);

// ---------------------------------------------------------------- 5b. the generator shed, 5d. the storehouse, 5c. the staging point
// The shed: a tin blockhouse (burning, with the detail), its door on the
// west; a hatch in its floor and a stair down south to the workshop's
// tunnel.
town.house(76, 14, 90, 26, { h: FARM + 5, wall: 'metal-rust', skirt: null });
town.room(77, 15, 89, 25, { h: FARM + 5, floorZ: FARM, ceilZ: FARM + 4, wall: 'metal-rust', light: 96 });
town.arch(76, 18, 77, 21, { h: FARM + 5, lintel: 3, floorZ: FARM, wall: 'metal-rust', floor: 'street-sand', light: 96 });
lights.push({ x: 86, y: 18, z: FARM + 2, radius: 6, light: 64 });
// The storehouse: a small domed store against the west windbreak (burning,
// its dome broken in, with the detail), its door east onto the yard; inside,
// the family's stair down to the cistern.
town.house(13, 70, 23, 78, { h: FARM + 5, dome: true, skirt: null });
town.room(14, 71, 22, 77, { h: FARM + 5, floorZ: FARM, ceilZ: FARM + 4, light: 96 });
town.arch(22, 73, 23, 76, { h: FARM + 5, lintel: 3, floorZ: FARM, floor: 'flagstone', light: 96 });
lights.push({ x: 20, y: 74, z: FARM + 2, radius: 6, light: 64 });
// The Imperials' staging point, by the west windbreak: a lit floodlight,
// crates, barricades, a power unit.
list.push(
  at('floodlight-tower-worn', 20.5, 43.5, { angle: 315, z: FARM }),
  at('barricade-worn', 24, 49, { angle: 20, z: FARM }), at('barricade-worn', 30, 46.5, { angle: 100, z: FARM }),
  at('supply-crate', 19, 47.5, { z: FARM }), at('supply-crate', 20.4, 48.2, { z: FARM }), at('supply-crate', 19.6, 49.6, { z: FARM }),
  at('power-unit', 25.5, 42.5, { z: FARM }),
);
lights.push({ x: 22, y: 45.5, z: 3.5, radius: 8, light: 64 });

// ---------------------------------------------------------------- 5a. the entry dome
// A round building north of the courtyard, its door west under a porch.
// Inside, a square room (angled walls take no ceiling), and a stair down
// its middle, south, under the dome's wall and the yard to the junction.
const DOME = { cx: 56, cy: 24, r: 6.5, h: FARM + 5 };
town.circle(DOME.cx, DOME.cy, DOME.r, { inside: town.roofCell({ h: DOME.h }), wall: { wall: 'adobe-pale', wallTop: DOME.h }, open: 'out' });
town.dome(DOME.cx, DOME.cy, DOME.h, 11);
town.room(52, 20, 60, 28, { h: DOME.h, floorZ: FARM, ceilZ: FARM + 4, light: 112 });
town.house(45, 22, 50, 26, { h: FARM + 4 });
town.arch(45, 22, 50, 26, { h: FARM + 4, lintel: 3, floorZ: FARM, floor: 'flagstone', light: 128 });
town.arch(50, 22, 52, 26, { h: DOME.h, lintel: 3, floorZ: FARM, floor: 'flagstone', light: 128 });
lights.push({ x: 56, y: 21.5, z: FARM + 3.5, radius: 5, light: 48 });

// ---------------------------------------------------------------- 1, 3, 8a. the three pits
// Round pits 6 deep, open to the sky, their walls the farm's whitewash. No
// parapets: one hides a pit from the troopers on its rim.
const pit = (cx, cy, r, floor = 'street-sand') => town.circle(cx, cy, r, { inside: yard(PIT, { floor }), wall: { wall: 'adobe-pale', wallTop: FARM }, seam: 90 });
pit(28, 30, 6, 'flagstone'); // the garden pit, the drop-off
pit(56, 56, 12); // the main courtyard
pit(92, 76, 8, 'flagstone'); // the garage pit
lights.push({ x: 28, y: 30, z: PIT + 3.5, radius: 6, light: 64 }); // the grow lamps
lights.push({ x: 56, y: 60, z: PIT + 1, radius: 6, light: 56 }); // the cart burning

// ---------------------------------------------------------------- under the yard
// Tunnels 4 wide and rooms at the pits' floor, their ceilings at 2 m, under
// the yard (slabs). Three loops: the junction, the garden pit, the common
// room and the courtyard; the junction, the quarters, the workshop and the
// courtyard; and, once the barred door is open, the courtyard, the
// storeroom, the cellar and the storehouse, over the yard.
// The entry dome's stair, twelve steps down to the junction.
stairDown(54, 24, 58, 36, 0);
// 2. The junction; the arch south into the courtyard; the tunnel west to
// the garden pit.
dig(44, 36, 62, 44);
dig(54, 43, 58, 45, ARCH);
dig(35, 28, 48, 32);
dig(44, 32, 48, 36);
dig(33, 28, 35, 32, ARCH);
list.push(at('barricade-worn', 52, 41.5, { angle: 90 }));
lights.push({ x: 53, y: 40, z: PIT + 3, radius: 6, light: 48 });
// 4a. The common room, west of the courtyard; the tunnel north to the
// garden pit.
dig(24, 50, 40, 64, { light: 112 });
dig(40, 54, 45, 58, ARCH);
dig(26, 37, 30, 50);
dig(26, 35, 30, 37, ARCH);
lights.push({ x: 32, y: 57, z: PIT + 3, radius: 6, light: 40 });
// 4b. The quarters, east of the junction, a doorway east to the shed's
// tunnel.
dig(62, 38, 68, 42);
dig(68, 34, 78, 46, { light: 96 });
dig(78, 38, 80, 42, { ceilZ: PIT + 3 });
lights.push({ x: 73, y: 40, z: PIT + 3, radius: 5, light: 32 });
// 4c. The workshop, east of the courtyard; the tunnel north to the
// generator shed's hatch; the tunnel south to the garage caved in (a stub).
dig(72, 48, 86, 62, { light: 120 });
dig(67, 54, 72, 58, ARCH);
dig(80, 31, 84, 48);
stairDown(80, 19, 84, 31, 0);
dig(78, 62, 82, 64, { light: 72 });
lights.push({ x: 79, y: 54, z: PIT + 3, radius: 6, light: 48 });
// 4d. The storeroom, south of the courtyard; tunnels east to the garage's
// shutter and west to the rubble and the cellar's barred door.
dig(48, 72, 64, 80, { light: 96 });
dig(54, 67, 58, 72, ARCH);
dig(64, 74, 72, 78);
dig(30, 74, 48, 78);
lights.push({ x: 56, y: 76, z: PIT + 3, radius: 5, light: 32 });
// 4e. The long tunnel, south from the common room to the rubble where it
// met the storeroom's (26..30, 72..78 stays solid: caved in).
dig(26, 64, 30, 72, { light: 88 });
tag(26, 70, 30, 72, 'rubble');
tag(30, 74, 32, 78, 'rubble');
list.push(at('boulder-small', 28, 71.4, { angle: 40 }), at('boulder-small', 30.6, 76, { angle: 160 }));
// 4f. Secret 1: the hidey-hole off its west side, where the family hid
// Rusk, behind a door in the plaster.
dig(16, 64, 22, 70, { light: 72 });
dig(22, 66, 26, 68, { light: 72, ceilZ: PIT + 2.5 });
p.rect(25, 66, 26, 68, (_, __, c) => ({ ...c, door: 'adobe-pale', style: 'rise', secret: true }));
secret(16, 64, 25, 70);
list.push(at('med-kit', 17.5, 65.5), at('thermal-detonator', 20.5, 68.5));
// Secret 2: the well room under the yard's east side, reached only down its
// light well; a secret door out west into the workshop's tunnel.
dig(88, 36, 96, 44, { light: 88 });
dig(84, 39, 88, 41, { light: 88, ceilZ: PIT + 2.5 });
p.rect(84, 39, 85, 41, (_, __, c) => ({ ...c, door: 'adobe-pale', style: 'rise', secret: true }));
secret(85, 36, 96, 44);
list.push(at('shield-unit', 94.5, 37.5), at('energy-pack', 94.5, 42.5));

// ---------------------------------------------------------------- 5d, 6, 7. the storehouse's stair, the old passage, the cellar
// The family's stair down from the storehouse, twelve steps south; the old
// cistern passage; six steps down east into the cellar.
stairDown(15, 72, 19, 84, 0);
dig(13, 84, 21, 92, { ceilZ: PIT + 3.5, floor: 'sandstone', ceiling: 'sandstone-dark', light: 72 });
under(21, 86, 26, 90, { floorZ: (x) => PIT - 0.5 * (x - 20), ceilZ: (f) => Math.min(PIT + 3.5, f + 4), floor: 'sandstone', ceiling: 'sandstone-dark', light: 72 });
lights.push({ x: 17, y: 88, z: PIT + 2, radius: 4, light: 24 });
// Secret 3: a niche behind a loose panel in the passage's south wall.
dig(14, 93, 18, 95, { ceilZ: PIT + 2.5, floor: 'sandstone', ceiling: 'sandstone-dark', light: 64 });
dig(15, 92, 17, 93, { ceilZ: PIT + 2.5, floor: 'sandstone', ceiling: 'sandstone-dark', light: 64, extra: { door: 'sandstone', style: 'rise', secret: true } });
secret(14, 93, 18, 95);
list.push(at('power-cell', 15, 94), at('med-kit', 17, 94));
// The cellar: cold and dark, the cistern's pool along its south side; the
// lamp knocked over and still lit on the floor; the recordings behind a
// loose stone at its east end.
under(26, 84, 44, 94, { floorZ: CELLAR, ceilZ: CELLAR + 4, ceiling: 'sandstone-dark', light: 72 });
under(28, 89, 36, 93, { floorZ: CELLAR - 0.5, ceilZ: CELLAR + 4, floor: 'water-murky', ceiling: 'sandstone-dark', light: 64 });
lights.push({ x: 40.5, y: 87.5, z: CELLAR + 0.3, radius: 4, light: 40 });
tag(42, 85, 44, 89, 'recordings');
// The barred door, at the top of six steps down from the storeroom's
// tunnel: barred from the cellar's side until the family, fleeing, unbar it.
dig(32, 78, 36, 79);
stairDown(32, 79, 36, 84, PIT - 0.5, { ceilZ: (f) => Math.min(CEIL, f + 4), light: 80 });
const opensWithGarage = { style: 'rise', lock: 'remote', stayOpen: true, tag: 'garage' };
p.rect(32, 78, 36, 79, (_, __, c) => ({ ...c, door: 'shutter-rising', ...opensWithGarage }));
tag(32, 76, 36, 78, 'barred');

// ---------------------------------------------------------------- 8. the garage, 8b. the trench
// Behind two roll-down shutters (on the storeroom's tunnel and on the
// garage pit), down until the recordings are taken; taller inside.
dig(72, 68, 84, 82, { ceilZ: PIT + 4.5, light: 104 });
dig(84, 72, 85, 80, ARCH);
p.rect(71, 74, 72, 78, (_, __, c) => ({ ...c, door: 'shutter-rising', ...opensWithGarage }));
p.rect(84, 72, 85, 80, (_, __, c) => ({ ...c, door: 'shutter-rising', ...opensWithGarage }));
lights.push({ x: 78, y: 75, z: PIT + 4, radius: 6, light: 40 });
// The trench: twelve steps of 0.5 up south out of the garage pit to the
// yard, open to the sky, walled in the farm's plaster; then the gate
// through the windbreak, a step down onto the pad.
p.rect(89, 83, 95, 96, (x, y) => yard(PIT + 0.5 * (y - 83), { floor: 'flagstone' }));
town.arch(89, 96, 95, 98, { h: WALL, lintel: 4, floorZ: FARM, floor: 'flagstone', light: 136 });
tag(89, 94, 95, 98, 'trench-head');

// ---------------------------------------------------------------- the light wells
// Shafts of evening light down into the tunnels: the tunnel to the garden
// pit, the common room, the quarters' passage, the storeroom's two tunnels,
// and the well room's (its only way in).
for (const [x, y] of [[40, 28], [32, 58], [64, 39], [40, 75], [67, 75], [91, 39]]) well(x, y);

// The farm's vaporators on the yard (stand-ins: the town's small one).
for (const [x, y] of [[38.5, 18.5], [100.5, 30.5], [104.5, 88.5], [66.5, 90.5]]) list.push(at('vaporator', x, y, { z: FARM, angle: Math.round(valueNoise(x, y, 1, 7) * 360) }));

town.finish(EVENING);
list.push(...town.things);

// ---------------------------------------------------------------- life (by skill, docs/mission2.md)
const NOT_EASIEST = [2, 3, 4, 5];
const NORMAL_UP = [3, 4, 5];
const HARD = [4, 5];
const EASY = [1, 2];
list.push(
  // The garden pit: a moment to look round.
  at('player', 27.5, 31.5, { angle: 0 }),
  at('med-kit', 30.5, 26.5, { skill: EASY }),
  // The junction.
  at('stormtrooper', 50.5, 40, { angle: 180 }),
  at('stormtrooper', 58.5, 38.5, { angle: 180, skill: HARD }),
  // The courtyard, and the rim above it.
  at('stormtrooper', 50.5, 54.5, { angle: 90 }),
  at('stormtrooper', 61.5, 59.5, { angle: 90 }),
  at('stormtrooper', 56.5, 64.5, { angle: 90 }),
  at('stormtrooper', 52.5, 61.5, { angle: 45, skill: NOT_EASIEST }),
  at('officer', 58.5, 50.5, { angle: 90, skill: NORMAL_UP }),
  at('sandtrooper', 49.6, 44.6, { angle: 300, z: FARM }),
  at('sandtrooper', 65.5, 65.5, { angle: 135, z: FARM }),
  at('sandtrooper', 42.5, 58, { angle: 0, z: FARM, skill: HARD }),
  at('energy-pack', 53.5, 50.5),
  // The rooms and tunnels.
  at('stormtrooper', 30.5, 56.5, { angle: 0 }),
  at('stormtrooper', 79.5, 54.5, { angle: 180 }),
  at('stormtrooper', 73.5, 40.5, { angle: 180, skill: NOT_EASIEST }),
  at('stormtrooper', 54.5, 76.5, { angle: 90, skill: NORMAL_UP }),
  at('stormtrooper', 28, 66.5, { angle: 90, skill: HARD }),
  at('med-kit', 26.5, 52.5, { skill: EASY }),
  at('power-cell', 70.5, 36.5),
  // The stairwells up to the yard.
  at('stormtrooper', 56, 31.5, { angle: 90, skill: NORMAL_UP }),
  at('stormtrooper', 82, 26.5, { angle: 90, skill: NORMAL_UP }),
  // The yard: troopers, the probe droid, the commander at the staging point.
  at('sandtrooper', 30.5, 40.5, { angle: 0, z: FARM }),
  at('sandtrooper', 34.5, 66.5, { angle: 90, z: FARM }),
  at('probe-droid', 70.5, 28.5),
  at('sandtrooper', 88.5, 50.5, { angle: 180, z: FARM, skill: NOT_EASIEST }),
  at('sandtrooper-commander', 23.5, 45.5, { angle: 0, z: FARM, skill: NORMAL_UP }),
  at('sandtrooper', 100.5, 60.5, { angle: 180, z: FARM, skill: HARD }),
  at('sandtrooper', 44.5, 86.5, { angle: 90, z: FARM, skill: HARD }),
  at('power-cell', 40.5, 50.5, { z: FARM }),
  // The storehouse and the old passage.
  at('sandtrooper', 20.5, 75.5, { angle: 0 }),
  at('stormtrooper', 17, 89.5, { angle: 0, skill: HARD }),
  at('med-kit', 20.5, 72, { skill: [1, 2, 3] }),
  // The garage: a stock of ammo before the hold-out.
  at('power-cell', 74.5, 70.5), at('power-cell', 75.5, 70.5), at('med-kit', 82.5, 80.5),
  at('energy-pack', 81.5, 70.5, { skill: EASY }),
  // The trench's gate.
  at('sandtrooper', 92, 99.5, { angle: 90, skill: NORMAL_UP }),
);

// Where the hold-out's troopers come from when Kyle calls the Crow: the
// pockets beyond the pad's three cuts.
for (const [x, y] of [[49, 109], [50, 117], [89, 136], [123, 104]]) p.set(x, y, { ...p.get(x, y), tag: 'wave' });

export default defineLevel({
  id: 'm2',
  mapLabel: 'M2',
  name: 'THE HOMESTEAD',
  music: 'garrison',
  sky: 'sky-night',
  // Stand-ins until the evening step: the night sky and a dusty haze.
  haze: { color: [120, 84, 72], half: 48 },
  lights,
  par: 420,
  // The story, in stand-ins until the pieces exist (docs/mission2.md): the
  // rubble and the barred door send Kyle up and over; the recordings start
  // the ending and open the barred door and the garage; at the trench's
  // gate Kyle calls the Crow and the troopers come; the pickup ends the
  // level (Jan's two minutes, the `wait` action, still to come).
  triggers: [
    {
      on: 'start',
      do: [
        { action: 'message', text: "JAN: I CAN'T SET DOWN WITH THEM ON THE GROUND. THIS IS AS CLOSE AS I GET." },
        { action: 'message', text: 'KYLE: RUSK SAID THE CELLAR.' },
        { action: 'message', text: "JAN: STORM'S COMING IN OFF THE DUNE SEA. CALL WHEN YOU'VE GOT IT." },
      ],
    },
    { on: 'enter', tag: 'rubble', do: [{ action: 'message', text: 'KYLE: CAVED IN.' }] },
    {
      on: 'enter',
      tag: 'barred',
      do: [
        { action: 'message', text: 'BARRED FROM THE OTHER SIDE.' },
        { action: 'message', text: 'KYLE: THE STOREHOUSE HAD A WAY DOWN TO THE CISTERN.' },
      ],
    },
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
