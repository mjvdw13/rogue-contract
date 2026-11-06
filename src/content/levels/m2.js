import { defineLevel } from '../../engine/defs.js';
import { Painter } from './lib/painter.js';
import { Town } from './lib/town.js';
import { valueNoise } from './lib/noise.js';

// MISSION 2: THE HOMESTEAD. The layout, route and numbers are in
// docs/mission2.md (area numbers below match its table). The blockout:
// every area as plain volumes at its final heights, with the real ways
// between them. Painted in code on the fine grid (1 tile = 0.5 m) with the
// town kit (lib/town.js) for the farm's plaster, the pit and the rooms.
//
// The way through: the shelf on the ridge (the drop-off), down the path in
// two legs, across the vaporator field, onto the farm, down the entry dome's
// stair into the sunken courtyard, round its rooms under the ground, down to
// the cellar (the recordings), then out through the garage and up its
// trench to hold the pickup.

const W = 144;
const H = 112;
const SKY = 32;
/** Open ground in the evening suns, before their shadows. */
const SUN = 176;

// Heights, in units (1 unit = 0.5 m). The field is at 0.
const SHELF = 12;
const CRAG = 14;
const LANDING = 8;
const FARM = 0.5;
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
const half = (z) => Math.round(z * 2) / 2;

// ---- Cells
/** Bare rock, out of reach or underfoot on the ridge. */
const rock = (z, extra = {}) => ({ floor: 'sandstone', ceiling: 'sky', floorZ: z, ceilZ: SKY, light: SUN, side: 'sandstone', ...extra });
/** The ridge's path and shelves: gravel over the rock. */
const ledge = (z, extra = {}) => rock(z, { floor: 'desert-gravel', ...extra });
/** Desert sand: the field, the dunes. */
const sand = (z = 0, extra = {}) => ({ floor: 'desert-sand', ceiling: 'sky', floorZ: z, ceilZ: SKY, light: SUN, side: 'desert-sand', ...extra });
/** The farm's packed yard; its edges (the walls of the rooms dug under it) are the farm's whitewash. */
const yard = (z = FARM, extra = {}) => ({ floor: 'street-sand', ceiling: 'sky', floorZ: z, ceilZ: SKY, light: SUN, side: 'adobe-pale', ...extra });

/** A tile's top: what you'd stand on there (a slab's top, a low angled wall's top, or its floor). */
const topOf = (c) => (c.slab ? c.slab.top : c.line && c.wallTop !== undefined ? c.wallTop : c.floorZ ?? 0);

/**
 * Space dug under the ground (or under a building) over the box: the lower
 * storey of a slab whose top is what was there (the yard, a roof), so the
 * surface stays as it was. `ceilZ` may be a function of the tile's floor,
 * for a stair. `top` overrides the slab's top (a doorway through the pit's
 * wall, whose tiles were its low angled wall).
 */
function under(x0, y0, x1, y1, { floorZ, ceilZ, top, floor = 'flagstone', ceiling = 'planks', light = 112, side = 'adobe-pale', extra = {} }) {
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

/** Tag tiles of a box (for triggers and spawns), keeping what they are. */
const tag = (x0, y0, x1, y1, name) => p.rect(x0, y0, x1, y1, (_, __, c) => ({ ...c, tag: name }));
/** Round off a box's corner `n` tiles deep with the ridge's rock (stepped: the blockout's rock has no angled walls). */
function rockCorner(x0, y0, x1, y1, n, corner) {
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n - j; i++) {
      const x = corner.endsWith('W') ? x0 + i : x1 - 1 - i;
      const y = corner.startsWith('N') ? y0 + j : y1 - 1 - j;
      p.set(x, y, rock(ridgeAt(x, y)));
    }
  }
}
/** Mark a box's open tiles as a secret area. */
const secret = (x0, y0, x1, y1) => p.rect(x0, y0, x1, y1, (_, __, c) => (c.wall && !c.line ? c : { ...c, secret: true }));

// ---------------------------------------------------------------- out of reach
// The Jundland's rock to the north and east, climbing in crags to 29; the
// Dune Sea's dunes to the west and south, rising from 3 at the field's
// edge (low, or their shadows would cover the field: the suns set over
// them).
const ridgeAt = (x, y) => half(19 + 7 * valueNoise(x, y, 7, 1) + 3 * valueNoise(x, y, 2.5, 2));
const duneAt = (x, y, depth) => half(3 + 0.35 * depth + valueNoise(x, y, 6, 3));
for (let y = 1; y < H - 1; y++) {
  for (let x = 1; x < W - 1; x++) {
    const ridge = (x < 80 && y < 36) || (x >= 80 && y < 34) || x >= 132;
    if (ridge) p.set(x, y, rock(ridgeAt(x, y)));
    else p.set(x, y, sand(duneAt(x, y, Math.max(6 - x, y - (x < 96 ? 104 : 106)))));
  }
}

// ---------------------------------------------------------------- 1. the shelf, 7. the crag, 2a. the path
// The drop-off: a shelf on the ridge's south face, the whole map below it.
// No lip along its edge: one just under eye height hides the farm (it's
// 13 down and 85 off). Stepping off is a fall of 6 to 12, Dark Forces' way.
p.rect(22, 8, 46, 24, ledge(SHELF));
rockCorner(22, 8, 46, 24, 5, 'NW');
rockCorner(22, 8, 46, 24, 3, 'NE');
// The Tuskens' lookout, four rock steps up from the shelf's west end,
// looking east over it to the farm. Walled by the crest on its other sides.
p.rect(6, 6, 18, 18, ledge(CRAG));
rockCorner(6, 6, 18, 18, 3, 'NW');
rockCorner(6, 6, 18, 18, 3, 'SW');
town.stair(18, 10, 22, 14, { up: 'W', top: CRAG, from: SHELF, floor: 'desert-gravel', side: 'sandstone' });
// Secret 1: a crawl between the rocks at its back (crouch) into a cleft.
p.rect(10, 4, 12, 6, rock(CRAG, { floor: 'desert-gravel', ceiling: 'sandstone-dark', ceilZ: CRAG + 1.2, light: 96 }));
p.rect(8, 1, 14, 4, ledge(CRAG, { light: 136 }));
secret(8, 1, 14, 6);
list.push(at('shield-unit', 10.5, 2.5), at('power-cell', 12.5, 2.5));

// Leg 1: east from the shelf, cut into the rock, eight steps down to the
// landing's height; rock on both sides.
p.rect(46, 15, 64, 21, ledge(LANDING));
town.stair(46, 15, 54, 21, { up: 'W', top: SHELF, from: LANDING, floor: 'desert-gravel', side: 'sandstone' });
p.rect(46, 21, 56, 24, rock(14));
p.rect(56, 21, 64, 24, rock(11));
// The landing: an overlook at the bend, open on its south over a lower
// shelf of rock.
p.rect(64, 14, 76, 32, ledge(LANDING));
rockCorner(64, 14, 76, 31, 4, 'NE');
p.rect(64, 32, 80, 36, rock(7));
// Leg 2: west along the cliff, sixteen steps down to the ridge's foot,
// open on its south side over a lower shelf of rock.
p.rect(44, 24, 64, 31, ledge(0));
town.stair(48, 24, 64, 31, { up: 'E', top: LANDING, from: 0, floor: 'desert-gravel', side: 'sandstone' });
p.rect(48, 31, 64, 36, rock(2.5));
// The ridge's foot, opening south into the field; rock west of it.
p.rect(1, 24, 30, 36, (x, y) => rock(half(4 + 3 * valueNoise(x, y, 5, 4))));
p.rect(30, 24, 48, 36, sand(0));

// ---------------------------------------------------------------- 2. the vaporator field, 9. the dunes
// Open sand at 0, with low dunes drifted over it a step or two high, in
// soft patches; the same south of the field.
const duneStep = (x, y) => {
  const n = valueNoise(x, y, 9, 5);
  return n > 0.78 ? 1 : n > 0.66 ? 0.5 : 0;
};
p.rect(6, 36, 80, 92, (x, y) => sand(duneStep(x, y)));
p.rect(6, 92, 96, 104, (x, y) => sand(duneStep(x, y)));
// The staging point and the pump house stand on flat ground.
p.rect(46, 50, 64, 66, sand(0));
p.rect(22, 70, 34, 82, sand(0));

// 2c. The pump house: a small round building with a dome on it (its door,
// shot in, comes with the detail).
town.circle(28, 76, 4.5, { inside: town.roofCell({ h: 4, skirt: null }), wall: { wall: 'adobe-pale', wallTop: 4 }, open: 'out', skirt: null });
town.dome(28, 76, 4, 7.5);

// 2b. The Imperials' staging point: a lit floodlight, crates, barricades.
list.push(
  at('floodlight-tower-worn', 54.5, 55.5, { angle: 315 }),
  at('barricade-worn', 51, 62, { angle: 20 }), at('barricade-worn', 57.5, 63, { angle: 340 }),
  at('supply-crate', 59, 53.5), at('supply-crate', 60.4, 54.2), at('supply-crate', 59.6, 55.6),
  at('power-unit', 52.5, 54),
);
lights.push({ x: 55.5, y: 57.5, z: 3, radius: 8, light: 64 });

// ---------------------------------------------------------------- 3. the farm's ground
// A hardpan yard two steps up from the field: a step of 0.25 outside a
// knee-high wall (0.9), broken in three places on the west and once on the
// south. The pickup ground south of it is the same yard.
p.rect(80, 34, 132, 92, yard());
p.rect(96, 92, 132, 106, yard());
p.rect(79, 36, 80, 92, yard(0.25));
p.rect(79, 92, 96, 93, yard(0.25));
p.rect(95, 93, 96, 104, yard(0.25));
const wallRun = (x0, y0, x1, y1) => town.lowWall(x0, y0, x1, y1, { h: FARM + 0.9 });
wallRun(80, 34, 81, 44).lowWall(80, 48, 81, 62, { h: FARM + 0.9 }).lowWall(80, 66, 81, 80, { h: FARM + 0.9 }).lowWall(80, 84, 81, 92, { h: FARM + 0.9 });
wallRun(80, 91, 86, 92).lowWall(90, 91, 96, 92, { h: FARM + 0.9 });

// G. The generator shed: a tin blockhouse (burning, with the detail). Secret
// 3: a crawlspace in its back half, in by a low gap in its east wall.
town.house(118, 36, 128, 44, { h: FARM + 4, wall: 'metal-rust', skirt: null });
town.room(122, 37, 127, 43, { h: FARM + 4, floorZ: FARM, ceilZ: FARM + 1.3, wall: 'metal-rust', light: 72 });
town.arch(127, 39, 128, 41, { h: FARM + 4, lintel: 1.2, floorZ: FARM, wall: 'metal-rust', floor: 'street-sand', light: 72 });
secret(122, 37, 128, 43);
list.push(at('energy-pack', 123.5, 40));

// B. The storehouse: a small domed store (burning, its dome broken in, with
// the detail), lighting the trench's head and the pickup ground.
town.house(120, 88, 130, 96, { h: FARM + 5, r: 2, dome: true });

// ---------------------------------------------------------------- 3a. the entry dome
// A round building north of the pit, its door west toward the field under a
// porch. Inside, a square room (angled walls take no ceiling), and a stair
// down its middle, south, under the dome's wall and the yard to the pit.
const DOME = { cx: 106, cy: 42, r: 6.5, h: FARM + 5 };
town.circle(DOME.cx, DOME.cy, DOME.r, { inside: town.roofCell({ h: DOME.h }), wall: { wall: 'adobe-pale', wallTop: DOME.h }, open: 'out' });
town.dome(DOME.cx, DOME.cy, DOME.h, 11);
town.room(102, 38, 110, 46, { h: DOME.h, floorZ: FARM, ceilZ: FARM + 4, light: 112 });
town.house(95, 40, 100, 44, { h: FARM + 4 });
town.arch(95, 40, 100, 44, { h: FARM + 4, lintel: 3, floorZ: FARM, floor: 'flagstone', light: 128 });
town.arch(100, 40, 102, 44, { h: DOME.h, lintel: 3, floorZ: FARM, floor: 'flagstone', light: 128 });
lights.push({ x: 106, y: 39.5, z: FARM + 3.5, radius: 5, light: 48 });
// The stair: twelve steps of 0.5, from the room's floor to the courtyard's,
// its ceiling stepping down with it once it's under the yard.
under(104, 42, 108, 54, {
  floorZ: (x, y) => FARM - 0.5 * (y - 41),
  ceilZ: (f, old, t) => Math.min(old.slab ? old.slab.bottom : t - 0.25, f + 4.5),
  light: 96,
});

// ---------------------------------------------------------------- 4. the sunken courtyard
// A round pit 20 across and 6 deep, open to the sky, its wall the farm's
// whitewash. No parapet: one hides the pit from the troopers on the rim.
const COURT = { cx: 106, cy: 64, r: 10 };
town.circle(COURT.cx, COURT.cy, COURT.r, {
  inside: yard(PIT, { floor: 'street-sand' }),
  wall: { wall: 'adobe-pale', wallTop: FARM },
  seam: 90,
});
// The passage from the dome's stair into the pit's north side.
under(104, 54, 108, 55, { floorZ: PIT, ceilZ: PIT + 4, top: FARM, light: 96 });

// ---------------------------------------------------------------- 5. the rooms under the ground
const ROOM = { floorZ: PIT, ceilZ: CEIL };
// 5a. The common room, west of the pit, and 5b. the storeroom south of it.
under(84, 58, 95, 70, { ...ROOM, light: 112 });
under(95, 62, 97, 66, { floorZ: PIT, ceilZ: PIT + 3.5, top: FARM, light: 112 });
under(84, 72, 95, 80, { ...ROOM, light: 96 });
under(88, 70, 90, 72, { floorZ: PIT, ceilZ: PIT + 3, light: 96 });
lights.push({ x: 89.5, y: 64, z: PIT + 3, radius: 6, light: 40 }, { x: 89.5, y: 76, z: PIT + 3, radius: 5, light: 32 });
// Secret 2: the hidey-hole behind the storeroom's west wall, where the
// family hid Rusk: a door in the plaster.
under(79, 73, 83, 78, { ...ROOM, light: 72 });
under(83, 74, 84, 76, { floorZ: PIT, ceilZ: PIT + 2.5, light: 72, extra: { door: 'adobe-pale', style: 'rise', secret: true } });
secret(79, 73, 83, 78);
list.push(at('med-kit', 80.5, 74.5), at('thermal-detonator', 81.5, 76.5));
// 5c. The workshop, east of the pit, and the stair down to 5d. the cellar.
under(117, 58, 128, 70, { ...ROOM, light: 120 });
under(115, 62, 117, 66, { floorZ: PIT, ceilZ: PIT + 3.5, top: FARM, light: 120 });
lights.push({ x: 122.5, y: 63, z: PIT + 3, radius: 6, light: 48 });
under(123, 70, 127, 76, { floorZ: (x, y) => PIT - 0.5 * (y - 69), ceilZ: (f) => Math.min(CEIL, f + 4), light: 80 });
// The cellar: cold and dark, the cistern's pool along its south-west.
under(117, 76, 131, 86, { floorZ: CELLAR, ceilZ: CELLAR + 4, ceiling: 'sandstone-dark', light: 72 });
under(118, 80, 124, 85, { floorZ: CELLAR - 0.5, ceilZ: CELLAR + 4, floor: 'water-murky', ceiling: 'sandstone-dark', light: 64 });
// The lamp knocked over and still lit on the floor; the recordings behind
// a loose stone in the east wall.
lights.push({ x: 126.5, y: 79.5, z: CELLAR + 0.3, radius: 4, light: 40 });
tag(129, 77, 131, 80, 'recordings');

// ---------------------------------------------------------------- 6. the garage and 6a. the trench
// South of the pit behind a roll-down shutter, down until the recordings
// are taken; taller inside (a speeder stood here).
under(98, 77, 115, 88, { floorZ: PIT, ceilZ: PIT + 4.5, light: 104 });
under(104, 73, 108, 77, { floorZ: PIT, ceilZ: PIT + 3, top: FARM, light: 104 });
p.rect(104, 76, 108, 77, (_, __, c) => ({ ...c, door: 'shutter-rising', style: 'rise', lock: 'remote', tag: 'garage' }));
lights.push({ x: 106.5, y: 82, z: PIT + 4, radius: 6, light: 40 });
// The trench: twelve steps of 0.5 up to the yard, open to the sky, walled
// in the farm's plaster.
p.rect(102, 88, 108, 99, (x, y) => yard(PIT + 0.5 * (y - 87), { floor: 'flagstone' }));
tag(102, 96, 108, 99, 'trench-head');

// ---------------------------------------------------------------- 8. the pickup
// The spot, east of the trench's head, the farm's beacon lamps round it.
tag(110, 98, 116, 104, 'pickup');
lights.push({ x: 110, y: 98, z: FARM + 1, radius: 3, light: 32 }, { x: 116, y: 104, z: FARM + 1, radius: 3, light: 32 });
list.push(
  at('boulder-large', 100.5, 103, { angle: 30 }), at('boulder-small', 104.5, 104.5, { angle: 200 }),
  at('boulder-large', 121.5, 101, { angle: 140 }), at('boulder-small', 125, 104.2, { angle: 80 }),
  at('boulder-small', 98.5, 96.5, { angle: 310 }),
);

town.finish(EVENING);
list.push(...town.things);

// ---------------------------------------------------------------- life (by skill, docs/mission2.md)
const NOT_EASIEST = [2, 3, 4, 5];
const NORMAL_UP = [3, 4, 5];
const HARD = [4, 5];
const EASY = [1, 2];
list.push(
  at('player', 34.5, 14.5, { angle: 325 }),
  // The landing, and one on leg 2.
  at('sandtrooper', 68.5, 22.5, { angle: 180 }),
  at('sandtrooper', 72.5, 27.5, { angle: 150 }),
  at('sandtrooper', 57.5, 27.5, { angle: 0, skill: NOT_EASIEST }),
  at('med-kit', 70.5, 17.5, { skill: [1, 2, 3] }),
  // The field: troopers in the rows, a probe droid, the commander at the
  // staging point.
  at('sandtrooper', 40.5, 50.5, { angle: 90 }),
  at('sandtrooper', 30.5, 62.5, { angle: 45 }),
  at('sandtrooper', 62.5, 80.5, { angle: 120 }),
  at('probe-droid', 46.5, 72.5),
  at('sandtrooper', 20.5, 84.5, { angle: 60, skill: NOT_EASIEST }),
  at('sandtrooper-commander', 55.5, 59.5, { angle: 135, skill: NORMAL_UP }),
  at('sandtrooper', 70.5, 46.5, { angle: 180, skill: HARD }),
  at('sandtrooper', 14.5, 60.5, { angle: 30, skill: HARD }),
  at('med-kit', 56.5, 61.5),
  at('power-cell', 30.5, 82.5),
  // The farm's ground: on the rim's edge (shooting down into the pit), the
  // dome's door, the shed.
  at('sandtrooper', 100.6, 54.4, { angle: 180, z: FARM }),
  at('sandtrooper', 112.9, 72.6, { angle: 135, z: FARM }),
  at('stormtrooper', 92.5, 42.5, { angle: 180, z: FARM }),
  at('sandtrooper', 112.4, 55, { angle: 225, z: FARM, skill: NOT_EASIEST }),
  at('sandtrooper', 115.5, 47.5, { angle: 180, z: FARM, skill: NORMAL_UP }),
  at('power-cell', 90.5, 50.5, { z: FARM }),
  // The stairwell.
  at('stormtrooper', 106, 52.5, { angle: 90, skill: NORMAL_UP }),
  // The courtyard.
  at('stormtrooper', 102.5, 62.5, { angle: 90 }),
  at('stormtrooper', 110.5, 66.5, { angle: 90 }),
  at('stormtrooper', 106.5, 70.5, { angle: 90 }),
  at('stormtrooper', 100.5, 68.5, { angle: 45, skill: NOT_EASIEST }),
  at('officer', 108.5, 60.5, { angle: 90, skill: NORMAL_UP }),
  at('energy-pack', 103.5, 58.5),
  // The rooms.
  at('stormtrooper', 87.5, 64.5, { angle: 0 }),
  at('stormtrooper', 122.5, 61.5, { angle: 180 }),
  at('stormtrooper', 90.5, 76.5, { angle: 0, skill: HARD }),
  at('med-kit', 86.5, 60.5, { skill: EASY }),
  // The garage: a stock of ammo before the hold-out.
  at('power-cell', 100.5, 80.5), at('power-cell', 101.5, 80.5), at('med-kit', 112.5, 85.5),
  at('energy-pack', 113.5, 79.5, { skill: EASY }),
  // The trench's head.
  at('sandtrooper', 105, 101.5, { angle: 90, z: FARM, skill: NORMAL_UP }),
);

// Vaporators in rows slanting north-east, so the long shadows cross them:
// one every 6 tiles along a row, rows 9 apart, a few missing. Stand-ins
// (the town's small vaporator) until the farm's own model. Placed last,
// clear of everything else.
{
  const keep = [[44, 48, 66, 68], [20, 68, 36, 84], [28, 34, 50, 42]];
  const placed = [...list];
  const clear = (x, y) => !keep.some(([x0, y0, x1, y1]) => x >= x0 && x < x1 && y >= y0 && y < y1) && !placed.some((o) => Math.hypot(o.x - x, o.y - y) < 2);
  for (let v = -60; v <= 60; v += 9) {
    for (let u = -80; u <= 80; u += 6) {
      // u along a row (north-east), v across the rows; centred on the field.
      const x = 43 + (u + v) / Math.SQRT2;
      const y = 64 + (v - u) / Math.SQRT2;
      if (x < 9 || x > 77 || y < 39 || y > 89 || !clear(x, y)) continue;
      if (valueNoise(x * 7, y * 7, 1, 6) < 0.18) continue;
      list.push(at('vaporator', Math.round(x * 2) / 2, Math.round(y * 2) / 2, { angle: Math.round(valueNoise(x, y, 1, 7) * 360) }));
    }
  }
}

// Where the hold-out's troopers come from when Kyle calls the Crow: out of
// the field and over the dunes.
for (const [x, y] of [[66, 86], [72, 70], [58, 98], [76, 100]]) p.set(x, y, { ...p.get(x, y), tag: 'wave' });

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
  // recordings start the ending and open the garage; at the trench's head
  // Kyle calls the Crow and the troopers come; the pickup ends the level
  // (Jan's two minutes, the `wait` action, still to come).
  triggers: [
    {
      on: 'start',
      do: [
        { action: 'message', text: "JAN: THAT'S THE FARM. LOOKS LIKE THE EMPIRE GOT HERE FIRST." },
        { action: 'message', text: 'KYLE: RUSK SAID THE CELLAR.' },
        { action: 'message', text: "JAN: STORM'S COMING IN OFF THE DUNE SEA. CALL WHEN YOU'VE GOT IT." },
      ],
    },
    {
      on: 'enter',
      tag: 'recordings',
      do: [
        { action: 'message', text: "A SEALED CASE BEHIND A LOOSE STONE: RUSK'S HELMET RECORDINGS." },
        { action: 'setFlag', flag: 'recordings' },
        { action: 'message', text: 'HEAVY FOOTSTEPS OVERHEAD.' },
        { action: 'message', text: 'JAN: KYLE, SOMETHING BIG JUST WALKED OUT OF THE FIELD. GET OUT OF THERE.' },
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
