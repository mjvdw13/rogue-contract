import { defineLevel } from '../../engine/defs.js';
import { Painter } from './lib/painter.js';
import { Town } from './lib/town.js';
import { valueNoise, smoothstep } from './lib/noise.js';

// MISSION 2: THE HOMESTEAD. The layout, route and numbers are in
// docs/mission2.md (area letters and numbers below match its table). The
// blockout: every area as plain volumes at its final heights, with the real
// ways between them. Painted in code on the fine grid (1 tile = 0.5 m) with
// the town kit (lib/town.js) for the farm's plaster, the pits and the rooms.
//
// The way through: the Crow's rock out in the desert (the drop-off), down
// its way on the east side, south-east along the farm's track past the
// roadblock and the Anvil, through the vaporator field to the farm's gate,
// down the entry dome's stair (or the generator shed's hatch) into the
// tunnels, round the main courtyard and its rooms, down the long tunnel to
// the cellar (the recordings), then back east through the garage and up the
// garage pit's trench to hold the pickup.

const W = 288;
const H = 256;
const SKY = 32;
/** Open ground in the evening suns, before their shadows. */
const SUN = 176;

// Heights, in units (1 unit = 0.5 m). The open sand is at 0.
const ROCK = 8;
const PERCH = 11;
const ANVIL = 10;
const FARM = 0.5;
const PIT = -5.5;
const CEIL = -1.5;
const CELLAR = -8.5;
/** How deep the dune crests round the map's edge are. */
const EDGE = 14;

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
/** Bare rock: the Crow's rock, the Anvil. */
const rock = (z, extra = {}) => ({ floor: 'sandstone', ceiling: 'sky', floorZ: z, ceilZ: SKY, light: SUN, side: 'sandstone', ...extra });
/** Desert sand. */
const sand = (z = 0, extra = {}) => ({ floor: 'desert-sand', ceiling: 'sky', floorZ: z, ceilZ: SKY, light: SUN, side: 'desert-sand', ...extra });
/** The farm's packed yard; its edges (the walls of the rooms dug under it) are the farm's whitewash. */
const yard = (z = FARM, extra = {}) => ({ floor: 'street-sand', ceiling: 'sky', floorZ: z, ceilZ: SKY, light: SUN, side: 'adobe-pale', ...extra });

/** A tile's top: what you'd stand on there (a slab's top, a low angled wall's top, or its floor). */
const topOf = (c) => (c.slab ? c.slab.top : c.line && c.wallTop !== undefined ? c.wallTop : c.floorZ ?? 0);

/**
 * Space dug under the ground (or under a building) over the box: the lower
 * storey of a slab whose top is what was there (the yard, a roof), so the
 * surface stays as it was. `floorZ` and `ceilZ` may be functions (of the
 * tile, and of its floor), for a stair. `top` overrides the slab's top (a
 * doorway through a pit's wall, whose tiles were its low angled wall).
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
const dig = (x0, y0, x1, y1, opts = {}) => under(x0, y0, x1, y1, { floorZ: PIT, top: FARM, ...opts });
/** A stair dug down a box toward the south, a step of 0.5 a tile from `from` at row `y0`, its ceiling stepping down with it. */
const stairDown = (x0, y0, x1, y1, from, opts = {}) =>
  under(x0, y0, x1, y1, {
    floorZ: (x, y) => from - 0.5 * (y - y0),
    ceilZ: (f, old, t) => Math.min(old.slab ? old.slab.bottom : t - 0.25, f + 4.5),
    light: 96,
    ...opts,
  });

/** Tag tiles of a box (for triggers and spawns), keeping what they are. */
const tag = (x0, y0, x1, y1, name) => p.rect(x0, y0, x1, y1, (_, __, c) => ({ ...c, tag: name }));
/** Mark a box's open tiles as a secret area. */
const secret = (x0, y0, x1, y1) => p.rect(x0, y0, x1, y1, (_, __, c) => (c.wall && !c.line ? c : { ...c, secret: true }));
/** Inside a squarish blob (a rock seen from above): a superellipse round (cx, cy), its edge roughened. */
const blob = (cx, cy, rx, ry, seed, n = 4) => (x, y) =>
  Math.abs((x + 0.5 - cx) / rx) ** n + Math.abs((y + 0.5 - cy) / ry) ** n < 1 - 0.25 * valueNoise(x, y, 3, seed);

// ---------------------------------------------------------------- the track's line
// The farm's track to Anchorhead: from the map's west edge past the Crow's
// rock to the farm's gate.
const TRACK = [[1, 60], [60, 58], [88, 78], [106, 100], [126, 118], [150, 136]];
/** How far (x, y) is from the track's middle, and how far along it that is. */
function onTrack(x, y) {
  let best = Infinity;
  let along = 0;
  let run = 0;
  for (let i = 1; i < TRACK.length; i++) {
    const [ax, ay] = TRACK[i - 1];
    const [bx, by] = TRACK[i];
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.hypot(dx, dy);
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (len * len)));
    const d = Math.hypot(x - ax - t * dx, y - ay - t * dy);
    if (d < best) {
      best = d;
      along = run + t * len;
    }
    run += len;
  }
  return { d: best, along };
}

// ---------------------------------------------------------------- 9. the open sand, 10. the edges
// Broad dunes up to 3, walkable all over (steps of a quarter, now and then
// a half). They flatten out round the farm and the places things stand,
// lie lower in the field (the farm keeps it), and ease off along the track.
// The outer 14 tiles rise as dune crests: walkable for 10, then a lip out
// of reach. No rock walls anywhere at the edge.
const FLAT = [
  // [x0, y0, x1, y1, how far the dunes take to come back]
  [146, 96, 248, 184, 14], // the farm
  [194, 184, 248, 218, 12], // the pickup
  [126, 100, 146, 118, 8], // the staging point
  [78, 68, 98, 88, 8], // the roadblock
  [80, 102, 110, 126, 6], // the Anvil and its climb
  [116, 164, 128, 176, 6], // the pump house
  [54, 54, 64, 60, 6], // the foot of the rock's way down
  [48, 192, 60, 202, 8], // the wrecked scout
];
const FIELD = [[116, 60, 250, 98], [96, 98, 148, 204]];
const inBox = (x, y, [x0, y0, x1, y1]) => x >= x0 && x < x1 && y >= y0 && y < y1;
const boxDist = (x, y, [x0, y0, x1, y1]) => Math.hypot(Math.max(x0 - x, 0, x - x1), Math.max(y0 - y, 0, y - y1));
function duneAt(x, y) {
  const n = 0.6 * valueNoise(x, y, 40, 21) + 0.4 * valueNoise(x, y, 17, 22);
  let z = 3 * smoothstep(0.3, 0.85, n);
  for (const b of FLAT) z *= smoothstep(2, b[4], boxDist(x, y, b));
  // (Eased in over a few tiles each side of the field's edge, or the edge is a cliff.)
  const field = Math.max(...FIELD.map((b) => smoothstep(-5, 5, inBox(x, y, b) ? Math.min(x - b[0], b[2] - x, y - b[1], b[3] - y) : -boxDist(x, y, b))));
  z *= 1 - 0.65 * field;
  z *= 0.5 + 0.5 * smoothstep(3, 9, onTrack(x, y).d);
  return z;
}
for (let y = 1; y < H - 1; y++) {
  for (let x = 1; x < W - 1; x++) {
    // (Its inner edge wanders, so the crests don't run in straight terraces.)
    const d = Math.min(x, y, W - 1 - x, H - 1 - y) - 4 * valueNoise(x, y, 14, 24) + 2;
    const z = duneAt(x, y);
    if (d >= EDGE) p.set(x, y, sand(quarter(z)));
    else if (d >= 4) p.set(x, y, sand(quarter(z * (0.5 + (0.5 * (d - 4)) / (EDGE - 4)) + 0.25 * (EDGE - d))));
    else p.set(x, y, sand(quarter(0.5 * z + 2.5 + 2 + 0.5 * valueNoise(x, y, 4, 23))));
  }
}

// ---------------------------------------------------------------- 2. the track
// Packed sand, darker than the drifts, following the dunes, 5 wide.
p.rect(1, 50, 152, 142, (x, y, c) => (onTrack(x + 0.5, y + 0.5).d < 2.5 && !c.wall ? { ...c, floor: 'desert-gravel' } : c));

// ---------------------------------------------------------------- 1. the Crow's rock, T. the Tuskens' perch
// A low flat-topped rock out in the sand, 4 m high: the drop-off. Its way
// down is a cut in its east side, sixteen steps south to the track.
const crowRock = blob(44, 34, 16, 12, 31);
const perch = blob(31, 26, 7, 6, 32);
p.rect(24, 18, 62, 48, (x, y, c) => (perch(x, y) ? rock(PERCH) : crowRock(x, y) ? rock(ROCK) : c));
p.rect(34, 24, 38, 28, rock(PERCH));
town.stair(38, 24, 44, 28, { up: 'W', top: PERCH, from: ROCK, floor: 'sandstone', side: 'sandstone' });
town.stair(56, 40, 62, 56, { up: 'N', top: ROCK, from: 0, floor: 'desert-gravel', side: 'sandstone' });
// Secret 1: a crawl (crouch) from the perch's back into a cleft walled by
// the rock's crag behind it, out of sight of the perch.
p.rect(25, 13, 37, 20, (x, y, c) => (y < 20 || !perch(x, y) ? rock(PERCH + 3) : c));
p.rect(28, 15, 34, 19, rock(PERCH, { floor: 'desert-gravel', light: 136 }));
p.rect(30, 19, 32, 20, rock(PERCH, { floor: 'desert-gravel', ceiling: 'sandstone-dark', ceilZ: PERCH + 1.2, light: 96 }));
secret(28, 15, 34, 20);
list.push(at('shield-unit', 29.5, 16.5), at('power-cell', 32.5, 16.5));

// ---------------------------------------------------------------- R. the roadblock
// Where the Imperials closed the track: barricades across it at a slant, a
// speeder burning on its side (a stand-in), crates, a floodlight.
list.push(
  at('barricade-worn', 85.5, 74.5, { angle: 35 }), at('barricade-worn', 90.5, 80, { angle: 35 }),
  at('landspeeder', 93.5, 75.5, { angle: 110 }),
  at('supply-crate', 82.5, 80.5), at('supply-crate', 83.6, 81.6),
  at('floodlight-tower-worn', 95.5, 83.5, { angle: 135 }),
);
lights.push({ x: 93, y: 81, z: 3, radius: 7, light: 56 });

// ---------------------------------------------------------------- A. the Anvil
// A lone butte beside the track, 5 m high and sheer, but for a climb of
// boulders up its east side, a step of 1 each (jumped).
const anvil = blob(93, 114, 11, 10, 33, 6);
p.rect(80, 102, 106, 126, (x, y, c) => (anvil(x, y) ? rock(ANVIL) : c));
for (let k = 1; k < ANVIL; k++) p.rect(104, 124 - 2 * k, 107, 126 - 2 * k, rock(k));
p.rect(100, 106, 104, 110, rock(ANVIL));
// Secret 3: a cleft in its west face, in by a crawl (crouch).
p.rect(84, 111, 88, 117, rock(0, { floor: 'desert-sand', light: 128 }));
p.rect(80, 113, 84, 115, (x, y, c) => (anvil(x, y) ? rock(0, { floor: 'desert-sand', ceiling: 'sandstone-dark', ceilZ: 1.2, light: 104 }) : c));
secret(80, 111, 88, 117);
list.push(at('energy-pack', 85.5, 112.5), at('shield-unit', 86.5, 115.5));

// ---------------------------------------------------------------- i. the staging point, h. the pump house
list.push(
  at('floodlight-tower-worn', 136.5, 105.5, { angle: 225 }),
  at('barricade-worn', 131, 113.5, { angle: 20 }), at('barricade-worn', 140, 114.5, { angle: 340 }),
  at('supply-crate', 142, 104.5), at('supply-crate', 143.4, 105.2), at('supply-crate', 142.6, 106.6),
  at('power-unit', 130.5, 104.5),
);
lights.push({ x: 137, y: 108, z: 3, radius: 8, light: 64 });
town.circle(122, 170, 4.5, { inside: town.roofCell({ h: 4, skirt: null }), wall: { wall: 'adobe-pale', wallTop: 4 }, open: 'out', skirt: null });
town.dome(122, 170, 4, 7.5);

// ---------------------------------------------------------------- 3. the farm's ground
// A hardpan yard two steps up from the sand (a step of 0.25 round it),
// behind a knee-high wall broken where the troopers came through; the gate
// on the west where the track comes in, and a gap at the trench's head.
p.rect(147, 97, 247, 183, yard(0.25));
p.rect(148, 98, 246, 182, yard());
const wallRun = (x0, y0, x1, y1) => town.lowWall(x0, y0, x1, y1, { h: FARM + 0.9 });
wallRun(148, 98, 149, 114); wallRun(148, 120, 149, 132); wallRun(148, 140, 149, 160); wallRun(148, 166, 149, 182);
wallRun(149, 98, 170, 99); wallRun(176, 98, 210, 99); wallRun(214, 98, 246, 99);
wallRun(245, 99, 246, 130); wallRun(245, 136, 246, 182);
wallRun(149, 181, 180, 182); wallRun(186, 181, 222, 182); wallRun(234, 181, 245, 182);

// G. The generator shed: a tin blockhouse (burning, with the detail), its
// door on the west; a hatch in its floor and a stair down south to the
// workshop's tunnel, the back way in.
town.house(212, 100, 226, 112, { h: FARM + 5, wall: 'metal-rust', skirt: null });
town.room(213, 101, 225, 111, { h: FARM + 5, floorZ: FARM, ceilZ: FARM + 4, wall: 'metal-rust', light: 96 });
town.arch(212, 104, 213, 107, { h: FARM + 5, lintel: 3, floorZ: FARM, wall: 'metal-rust', floor: 'street-sand', light: 96 });
lights.push({ x: 222, y: 104, z: FARM + 2, radius: 6, light: 64 });

// B. The storehouse: a small domed store (burning, its dome broken in,
// with the detail).
town.house(150, 158, 160, 166, { h: FARM + 5, r: 2, dome: true });

// E. The entry dome, its door west toward the gate under a porch. Inside, a
// square room (angled walls take no ceiling), and a stair down its middle,
// south, under the dome's wall and the yard to the junction.
const DOME = { cx: 192, cy: 110, r: 6.5, h: FARM + 5 };
town.circle(DOME.cx, DOME.cy, DOME.r, { inside: town.roofCell({ h: DOME.h }), wall: { wall: 'adobe-pale', wallTop: DOME.h }, open: 'out' });
town.dome(DOME.cx, DOME.cy, DOME.h, 11);
town.room(188, 106, 196, 114, { h: DOME.h, floorZ: FARM, ceilZ: FARM + 4, light: 112 });
town.house(181, 108, 186, 112, { h: FARM + 4 });
town.arch(181, 108, 186, 112, { h: FARM + 4, lintel: 3, floorZ: FARM, floor: 'flagstone', light: 128 });
town.arch(186, 108, 188, 112, { h: DOME.h, lintel: 3, floorZ: FARM, floor: 'flagstone', light: 128 });
lights.push({ x: 192, y: 107.5, z: FARM + 3.5, radius: 5, light: 48 });
// The beacon mast by the dome (a stand-in), its lamp high up; the
// Imperials' barricades and a floodlight before the door.
list.push(
  at('sensor-mast', 180.5, 103.5, { z: FARM }),
  at('barricade-worn', 175.5, 106.5, { angle: 80, z: FARM }), at('barricade-worn', 176, 114, { angle: 100, z: FARM }),
  at('floodlight-tower-worn', 173.5, 118.5, { angle: 30, z: FARM }),
);
lights.push({ x: 180.5, y: 103.5, z: 8.5, radius: 3, light: 40 }, { x: 175, y: 112, z: 3, radius: 7, light: 56 });

// ---------------------------------------------------------------- C, P, Q. the three pits
// Round pits 6 deep, open to the sky, their walls the farm's whitewash. No
// parapets: one hides a pit from the troopers on its rim.
const pit = (cx, cy, r, floor = 'street-sand') => town.circle(cx, cy, r, { inside: yard(PIT, { floor }), wall: { wall: 'adobe-pale', wallTop: FARM }, seam: 90 });
pit(192, 142, 12); // the main courtyard
pit(164, 116, 6, 'flagstone'); // the garden pit
pit(228, 162, 8, 'flagstone'); // the garage pit
lights.push({ x: 192, y: 146, z: PIT + 1, radius: 6, light: 56 }); // the cart burning
lights.push({ x: 164, y: 116, z: PIT + 3.5, radius: 6, light: 64 }); // the grow lamps

// ---------------------------------------------------------------- under the farm's ground
// Tunnels 4 wide and rooms at the pits' floor, their ceilings at 2 m, under
// the yard (slabs). Two loops: the junction, the garden pit, the common
// room and the courtyard; and the courtyard, the storeroom, the long tunnel
// and the common room.
const ARCH = { ceilZ: PIT + 3.5 };
// The entry dome's stair, twelve steps down to the junction.
stairDown(190, 110, 194, 122, 0);
// J. The junction, the arch south into the courtyard, the tunnel west to
// the garden pit.
dig(180, 122, 198, 130);
dig(190, 129, 194, 131, ARCH);
dig(171, 114, 184, 118);
dig(180, 118, 184, 122);
dig(169, 114, 171, 118, ARCH);
lights.push({ x: 189, y: 126, z: PIT + 3, radius: 6, light: 48 });
// 5a. The common room, west of the courtyard; the tunnel north to the
// garden pit.
dig(160, 136, 176, 150, { light: 112 });
dig(176, 140, 181, 144, ARCH);
dig(162, 123, 166, 136);
dig(162, 121, 166, 123, ARCH);
lights.push({ x: 168, y: 143, z: PIT + 3, radius: 6, light: 40 });
// 5b. The workshop, east of the courtyard; the tunnel north to the
// generator shed's hatch; the tunnel south to the garage caved in (a stub).
dig(208, 134, 222, 148, { light: 120 });
dig(203, 140, 208, 144, ARCH);
dig(216, 117, 220, 134);
stairDown(216, 105, 220, 117, 0);
dig(214, 148, 218, 150, { light: 72 });
lights.push({ x: 215, y: 140, z: PIT + 3, radius: 6, light: 48 });
// 5c. The storeroom, south of the courtyard; tunnels east to the garage's
// shutter and west to the long tunnel.
dig(184, 158, 200, 166, { light: 96 });
dig(190, 153, 194, 158, ARCH);
dig(200, 160, 208, 164);
dig(166, 160, 184, 164);
lights.push({ x: 192, y: 162, z: PIT + 3, radius: 5, light: 32 });
// 5d. The long tunnel, south from the common room to the cellar's stair.
dig(162, 150, 166, 164, { light: 88 });
// 5e. Secret 2: the hidey-hole off its west side, where the family hid
// Rusk, behind a door in the plaster.
dig(152, 152, 158, 158, { light: 72 });
dig(158, 154, 162, 156, { light: 72, ceilZ: PIT + 2.5 });
p.rect(161, 154, 162, 156, (_, __, c) => ({ ...c, door: 'adobe-pale', style: 'rise', secret: true }));
secret(152, 152, 161, 158);
list.push(at('med-kit', 153.5, 153.5), at('thermal-detonator', 156.5, 156.5));
// 5f. The cellar: six steps down into the cold, the cistern's pool along
// its south side; the lamp knocked over and still lit on the floor; the
// recordings behind a loose stone at its west end.
stairDown(162, 164, 166, 170, PIT - 0.5, { ceilZ: (f) => Math.min(CEIL, f + 4), light: 80 });
under(152, 170, 172, 180, { floorZ: CELLAR, ceilZ: CELLAR + 4, ceiling: 'sandstone-dark', light: 72 });
under(154, 175, 162, 179, { floorZ: CELLAR - 0.5, ceilZ: CELLAR + 4, floor: 'water-murky', ceiling: 'sandstone-dark', light: 64 });
lights.push({ x: 166.5, y: 173.5, z: CELLAR + 0.3, radius: 4, light: 40 });
tag(152, 171, 154, 174, 'recordings');

// ---------------------------------------------------------------- 6. the garage, Q. its pit, 6a. the trench
// Behind two roll-down shutters (on the storeroom's tunnel and on the
// garage pit), down until the recordings are taken; taller inside.
dig(208, 154, 220, 168, { ceilZ: PIT + 4.5, light: 104 });
dig(220, 158, 221, 166, { ceilZ: PIT + 4 });
const shutter = (x0, y0, x1, y1) => p.rect(x0, y0, x1, y1, (_, __, c) => ({ ...c, door: 'shutter-rising', style: 'rise', lock: 'remote', stayOpen: true, tag: 'garage' }));
shutter(207, 160, 208, 164);
shutter(220, 158, 221, 166);
lights.push({ x: 214, y: 161, z: PIT + 4, radius: 6, light: 40 });
// The trench: twelve steps of 0.5 up south out of the garage pit to the
// yard, open to the sky, walled in the farm's plaster.
p.rect(225, 169, 231, 182, (x, y) => yard(PIT + 0.5 * (y - 169), { floor: 'flagstone' }));
tag(225, 177, 231, 183, 'trench-head');

// ---------------------------------------------------------------- 8. the pickup
// The family's landing pad on the sand south of the farm, the farm's
// beacon lamps round the spot, low rocks for cover.
tag(214, 196, 222, 204, 'pickup');
for (const [x, y] of [[214, 196], [222, 196], [214, 204], [222, 204]]) lights.push({ x, y, z: 1, radius: 3, light: 32 });
list.push(
  at('boulder-large', 204.5, 192, { angle: 30 }), at('boulder-small', 209.5, 207.5, { angle: 200 }),
  at('boulder-large', 232.5, 194, { angle: 140 }), at('boulder-small', 236, 206.2, { angle: 80 }),
  at('boulder-small', 200.5, 201.5, { angle: 310 }), at('boulder-large', 226.5, 212, { angle: 250 }),
);

// ---------------------------------------------------------------- 9. the wrecked scout
// Well off the track in the empty south-west: a scout's speeder (a
// stand-in) and what he carried.
list.push(at('landspeeder', 54.5, 196.5, { angle: 200 }), at('energy-pack', 57, 198.5), at('med-kit', 52.5, 199.5));

town.finish(EVENING);
list.push(...town.things);

// ---------------------------------------------------------------- 2. the track's guide posts
// Every 14 tiles along the track, on alternate sides, 3.5 off its middle: a
// post (a stand-in) with a small amber lamp. Round the roadblock every other
// one is shot out.
{
  let run = 0;
  for (let i = 1; i < TRACK.length; i++) {
    const [ax, ay] = TRACK[i - 1];
    const [bx, by] = TRACK[i];
    const len = Math.hypot(bx - ax, by - ay);
    for (let s = 14 - (run % 14); s < len; s += 14) {
      const n = Math.round((run + s) / 14);
      const side = n % 2 ? 3.5 : -3.5;
      const x = ax + ((bx - ax) * s) / len - ((by - ay) / len) * side;
      const y = ay + ((by - ay) * s) / len + ((bx - ax) / len) * side;
      if (x < EDGE || x > 146) continue;
      const z = p.get(Math.floor(x), Math.floor(y)).floorZ;
      list.push(at('stable-post', Math.round(x * 2) / 2, Math.round(y * 2) / 2));
      const shotOut = Math.hypot(x - 88, y - 78) < 16 && n % 2 === 0;
      if (!shotOut) lights.push({ x: Math.round(x * 2) / 2, y: Math.round(y * 2) / 2, z: z + 2.1, radius: 3, light: 40 });
    }
    run += len;
  }
}

// ---------------------------------------------------------------- life (by skill, docs/mission2.md)
const NOT_EASIEST = [2, 3, 4, 5];
const NORMAL_UP = [3, 4, 5];
const HARD = [4, 5];
const EASY = [1, 2];
list.push(
  at('player', 46.5, 32.5, { angle: 324 }),
  // The roadblock, and one on the track past it.
  at('sandtrooper', 88.5, 76, { angle: 135 }),
  at('sandtrooper', 92.5, 81.5, { angle: 135 }),
  at('sandtrooper', 91.5, 72.5, { angle: 160, skill: NOT_EASIEST }),
  at('sandtrooper', 101.5, 93.5, { angle: 135, skill: HARD }),
  at('med-kit', 84.5, 82.5, { skill: [1, 2, 3] }),
  // The Anvil: one on top, over the track.
  at('sandtrooper', 98.5, 108.5, { angle: 45, z: ANVIL }),
  at('power-cell', 92.5, 116.5, { z: ANVIL }),
  // The field: troopers among the vaporators, a probe droid, the commander
  // at the staging point.
  at('sandtrooper', 118.5, 84.5, { angle: 225 }),
  at('sandtrooper', 150.5, 80.5, { angle: 225 }),
  at('sandtrooper', 112.5, 150.5, { angle: 90 }),
  at('probe-droid', 130.5, 92.5),
  at('sandtrooper', 180.5, 72.5, { angle: 225, skill: NOT_EASIEST }),
  at('sandtrooper-commander', 136.5, 110.5, { angle: 135, skill: NORMAL_UP }),
  at('sandtrooper', 210.5, 84.5, { angle: 225, skill: HARD }),
  at('sandtrooper', 104.5, 180.5, { angle: 45, skill: HARD }),
  at('med-kit', 139.5, 109.5),
  at('power-cell', 122.5, 160.5),
  // The farm's ground: on the courtyard's rim (shooting down into it), the
  // dome's door, the garden pit's rim, the shed.
  at('sandtrooper', 185.6, 130.6, { angle: 300, z: FARM }),
  at('sandtrooper', 201.5, 151.5, { angle: 135, z: FARM }),
  at('stormtrooper', 178.5, 110.5, { angle: 180, z: FARM }),
  at('sandtrooper', 171.5, 109.5, { angle: 225, z: FARM, skill: NOT_EASIEST }),
  at('sandtrooper', 208.5, 114.5, { angle: 180, z: FARM, skill: NORMAL_UP }),
  at('power-cell', 170.5, 128.5, { z: FARM }),
  // The stairwell and the junction.
  at('stormtrooper', 192, 117.5, { angle: 90, skill: NORMAL_UP }),
  at('stormtrooper', 185.5, 126, { angle: 0 }),
  // The courtyard.
  at('stormtrooper', 186.5, 140.5, { angle: 90 }),
  at('stormtrooper', 197.5, 145.5, { angle: 90 }),
  at('stormtrooper', 192.5, 150.5, { angle: 90 }),
  at('stormtrooper', 188.5, 147.5, { angle: 45, skill: NOT_EASIEST }),
  at('officer', 194.5, 136.5, { angle: 90, skill: NORMAL_UP }),
  at('energy-pack', 189.5, 136.5),
  // The rooms and tunnels.
  at('stormtrooper', 166.5, 142.5, { angle: 0 }),
  at('stormtrooper', 215.5, 140.5, { angle: 180 }),
  at('stormtrooper', 164.5, 114.5, { angle: 0, skill: NOT_EASIEST }),
  at('stormtrooper', 190.5, 162.5, { angle: 90, skill: NORMAL_UP }),
  at('stormtrooper', 164, 156.5, { angle: 90, skill: HARD }),
  at('med-kit', 162.5, 138.5, { skill: EASY }),
  // The garage: a stock of ammo before the hold-out.
  at('power-cell', 210.5, 156.5), at('power-cell', 211.5, 156.5), at('med-kit', 218.5, 166.5),
  at('energy-pack', 217.5, 156.5, { skill: EASY }),
  // The trench's head.
  at('sandtrooper', 228, 186.5, { angle: 90, skill: NORMAL_UP }),
);

// About a dozen vaporators, 20 to 30 tiles apart on a loose grid whose rows
// run north-east, so the long shadows cross them; two or three on the
// farm's ground. Stand-ins (the town's small vaporator) until the farm's own
// model. Placed last, clear of everything else.
{
  const keep = [[78, 100, 110, 128], [126, 100, 146, 118], [114, 162, 130, 178]];
  const placed = [...list];
  const clear = (x, y) => !keep.some((b) => inBox(x, y, b)) && onTrack(x, y).d > 7 && !placed.some((o) => Math.hypot(o.x - x, o.y - y) < 3);
  for (let i = -20; i < 20; i++) {
    for (let j = -20; j < 20; j++) {
      const x = 100 + i * 22 + j * 12 + ((i * 7 + j * 13) % 5);
      const y = 70 - i * 10 + j * 26 + ((i * 11 + j * 3) % 4);
      if (!FIELD.some(([x0, y0, x1, y1]) => inBox(x, y, [x0 + 3, y0 + 3, x1 - 3, y1 - 3])) || !clear(x, y)) continue;
      list.push(at('vaporator', x + 0.5, y + 0.5, { angle: Math.round(valueNoise(x, y, 1, 7) * 360) }));
    }
  }
  for (const [x, y] of [[158.5, 104.5], [236.5, 124.5], [239.5, 172.5]]) list.push(at('vaporator', x, y, { z: FARM, angle: Math.round(valueNoise(x, y, 1, 7) * 360) }));
}

// Where the hold-out's troopers come from when Kyle calls the Crow: over
// the dunes to the west and south.
for (const [x, y] of [[172, 214], [196, 230], [244, 226], [150, 194]]) p.set(x, y, { ...p.get(x, y), tag: 'wave' });

export default defineLevel({
  id: 'm2',
  mapLabel: 'M2',
  name: 'THE HOMESTEAD',
  music: 'garrison',
  sky: 'sky-night',
  // Stand-ins until the evening step: the night sky and a dusty haze, thin
  // enough between gusts that the farm is a shape from the Crow's rock.
  haze: { color: [120, 84, 72], half: 90 },
  lights,
  par: 600,
  // The open sand is nearly all walkable: planning the troopers' way round
  // over all of it would take about 8 ms each time Kyle crosses a tile. 96
  // steps covers the farm's ground and tunnels from anywhere in them.
  navReach: 96,
  // The story, in stand-ins until the pieces exist (docs/mission2.md): the
  // recordings start the ending and open the garage; at the trench's head
  // Kyle calls the Crow and the troopers come; the pickup ends the level
  // (Jan's two minutes, the `wait` action, still to come).
  triggers: [
    {
      on: 'start',
      do: [
        { action: 'message', text: "JAN: THAT'S AS CLOSE AS I GET. THEY'VE GOT GUNS ON THE FARM." },
        { action: 'message', text: 'KYLE: RUSK SAID THE CELLAR.' },
        { action: 'message', text: "JAN: FOLLOW THE FARM'S TRACK. THE MARKER LAMPS RUN ALL THE WAY IN. CALL WHEN YOU'VE GOT IT." },
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
