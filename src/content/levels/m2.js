import { defineLevel } from '../../engine/defs.js';
import { Painter } from './lib/painter.js';
import { Town } from './lib/town.js';
import { valueNoise } from './lib/noise.js';
import { pitWalls, pitDoorway, blindDoor } from './lib/farm.js';
import { SENSOR_Z, PANEL } from '../models/vaporator.js';
import { PUMP, GARAGE_RING } from '../models/farm.js';

// MISSION 2: THE HOMESTEAD. The layout, route and numbers are in
// docs/mission2.md (area numbers below match its table). The blockout:
// every area as plain volumes at its final heights, with the real ways
// between them. Painted in code on the fine grid (1 tile = 0.5 m) with the
// town kit (lib/town.js) for the farm's plaster, the pits and the rooms.
//
// The farm is a walk from its working end in the west to the house in the
// east, a chain of areas with one way on from each: dropped into the
// garden pit, along the pump tunnels, down through the farm's reservoir
// (a long dark hall under the sand) and up to the workshop pit; the way
// east caved in, so up through the generator shed into the work yard, where
// the officer carries the red key to the gate; up the lane to the house's
// great dome, down into its courtyard pit and through its rooms to the
// cellar (the recordings); then out by Rusk's way, down through caves
// under the pad and up into the garage pit, and up the trench onto the
// landing pad, where Jan won't land: through the wave of
// troopers and down the wash into the rocks, to the Crow on the flat.

const W = 208;
const H = 214;
const SKY = 32;
/** Open ground in the evening suns, before their shadows. */
const SUN = 176;

// Heights, in units (1 unit = 0.5 m). The landing pad is at 0.
const FARM = 0.5;
const WALL = FARM + 6;
/** The small pits' floors (the garden, workshop and garage pits) and the tunnels and rooms off them: 4 m under the farm. */
const PIT = -7.5;
/** The house's courtyard, the big pit, and its rooms: 6 m under the farm. */
const COURT = -11.5;
/** Halfway down the courtyard: where the dome's stair reaches its wall. */
const MID = COURT + 6;
const CELLAR = COURT - 3;
/** The reservoir's floor: 12 steps down from the pump room. */
const RESERVOIR = PIT - 6;
/** The pad, the drifts round it, the wash and the flat: lower than the farm, so the trench out is short. */
const OUT = -3.5;

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
const decals = [];
const quarter = (z) => Math.round(z * 4) / 4;

// ---- Cells
/** Desert sand: the drifts, the pad. */
const sand = (z = 0, extra = {}) => ({ floor: 'desert-sand', ceiling: 'sky', floorZ: z, ceilZ: SKY, light: SUN, side: 'desert-sand', ...extra });
/** The farm's packed yard; its edges (the walls of the rooms dug under it) are the farm's whitewash. */
const yard = (z = FARM, extra = {}) => ({ floor: 'street-sand', ceiling: 'sky', floorZ: z, ceilZ: SKY, light: SUN, side: 'adobe-pale', ...extra });

/** A tile's top: what you'd stand on there (a slab's top, a low angled wall's top, or its floor). */
const topOf = (c) => (c.slab ? c.slab.top : c.line && c.wallTop !== undefined ? c.wallTop : c.floorZ ?? 0);

// ---- Linings: what the dug rooms' walls and ceilings are (Mark's
// references: whitewash in the tunnels with the pits' red-ochre dado along
// the foot, smooth white plaster in the house, damp duracrete in the
// reservoir and the cistern, bare rock only in the caves).
/** The tunnels, the pump room, the workshop: whitewash, a red-ochre dado. */
const WHITEWASH = { wall: 'adobe-pale', dado: 'pit-dado', ceiling: 'adobe-pale' };
/** The house's rooms: smooth white plaster, walls and vault. */
const HOUSE = { wall: 'plaster-white', ceiling: 'plaster-white' };
/** The reservoir: duracrete walls with a line cast along them, a dark damp vault. */
const RESERVOIR_WALLS = { wall: 'derelict-wall', ceiling: 'duracrete' };
/** The cistern under the house, and the steps down to it. */
const CISTERN = { wall: 'duracrete', ceiling: 'duracrete' };
/** Bare rock: the caves, the niche behind the loose stone. */
const ROCK = { wall: 'sandstone', ceiling: 'sandstone-dark' };
/** Each dug tile's lining, by its index (the last dig over a tile wins). */
const linings = new Map();

/**
 * Space dug under the ground (or under a building) over the box: the lower
 * storey of a slab whose top is what was there (the yard, a drift, a
 * roof), so the surface stays as it was. `floorZ` and `ceilZ` may be
 * functions (of the tile, and of its floor), for a stair. `top` overrides
 * the slab's top (a doorway through a pit's wall, whose tiles were its low
 * angled wall). `lining` is what its walls and ceiling are (`lineDug()`).
 */
function under(x0, y0, x1, y1, { floorZ, ceilZ = (f) => f + 4, top, lining = WHITEWASH, floor = 'flagstone', ceiling = lining.ceiling, light = 112, side = lining.wall, extra = {} }) {
  p.rect(x0, y0, x1, y1, (x, y, old) => {
    linings.set(y * W + x, lining);
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
/** A tunnel or room under the farm's ground, at a pit's floor (the small pits' unless `floorZ` says), 2 m tall. */
const dig = (x0, y0, x1, y1, opts = {}) => under(x0, y0, x1, y1, { floorZ: PIT, ...opts });
/** A doorway through a pit's round wall at floor `z` (its tiles were the wall's low angled tiles). */
const arch = (z = PIT) => ({ floorZ: z, ceilZ: z + 3.5, top: FARM });
/** A round-topped doorway's lintel: high enough for its rounded corners (`pitDoorway()`). */
const LINTEL = 4.25;
/** A round-topped doorway through a pit's wall (rounded and hooded by `pitDoorway()` below). */
const roundArch = (z = PIT) => ({ floorZ: z, ceilZ: z + LINTEL, top: FARM });
/** The round-topped doorways: their boxes, the way they look, their floors. */
const DOORWAYS = [];
const doorway = (x0, y0, x1, y1, face, z = PIT) => {
  dig(x0, y0, x1, y1, roundArch(z));
  DOORWAYS.push([x0, y0, x1, y1, face, z]);
};
/**
 * A stair dug down a box toward the south, a step of 0.5 a tile from `from`
 * at row `start` (`y0` unless given), its ceiling stepping down with it. In
 * flights of `flight` steps with a flat landing of `landing` tiles between
 * them, down to `to` at the most.
 */
const stairDown = (x0, y0, x1, y1, from, { start = y0, flight = 8, landing = 2, to = -Infinity, ...opts } = {}) =>
  under(x0, y0, x1, y1, {
    floorZ: (x, y) => {
      const r = y - start, n = flight + landing;
      return Math.max(to, from - 0.5 * (Math.floor(r / n) * flight + Math.min(r % n, flight - 1)));
    },
    ceilZ: (f, old, t) => Math.min(old.slab ? old.slab.bottom : t - 0.25, f + 4.5),
    light: 96,
    ...opts,
  });

/**
 * A light well: a 2 x 2 shaft from the yard down into a tunnel or room, open
 * to the sky, with a kerb round its mouth on the yard (0.9, jumpable: a drop
 * of 8 or more, and it hurts). Too narrow to climb out of.
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

/**
 * Line the dug spaces (run once they're all dug): the tiles round each (the
 * ground it's dug into) show its lining's wall on the faces it sees, with
 * its dado along the foot, up to its ceiling and no higher, so the ground's
 * own faces up on the surface (a drift's steps) keep theirs. A solid tile
 * takes the wall. The slabs' edges seen from below (a lintel, a light
 * well's shaft) take it too, but not where the surface steps down past one.
 */
function lineDug() {
  const dug = (c) => c && c.slab && !c.line && c.floorZ < c.slab.bottom;
  const near = (x, y) => [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]];
  const faces = new Map();
  for (const [k, lining] of linings) {
    const x = k % W;
    const y = (k - x) / W;
    const c = p.get(x, y);
    if (!dug(c)) continue;
    const step = near(x, y).some(([nx, ny]) => {
      const n = p.get(nx, ny);
      return n && !dug(n) && !n.wall && topOf(n) >= c.slab.bottom && topOf(n) < c.slab.top;
    });
    if (!step) p.set(x, y, { ...c, slab: { ...c.slab, side: lining.wall } });
    for (const [nx, ny] of near(x, y)) {
      const n = p.get(nx, ny);
      if (!n || dug(n) || n.line || n.door) continue;
      const j = ny * W + nx;
      const f = faces.get(j) ?? { lining, floor: Infinity, top: -Infinity };
      if (c.slab.bottom > f.top) [f.lining, f.top] = [lining, c.slab.bottom];
      f.floor = Math.min(f.floor, c.floorZ);
      faces.set(j, f);
    }
  }
  for (const [j, { lining, floor, top }] of faces) {
    const x = j % W;
    const n = p.get(x, (j - x) / W);
    const dado = lining.dado ? [{ to: floor + 1, tex: lining.dado }] : [];
    if (n.wall) p.set(x, (j - x) / W, { ...n, wall: lining.wall, ...(dado.length && { bands: dado }) });
    else p.set(x, (j - x) / W, { ...n, bands: [...dado, { to: top, tex: lining.wall }, ...(n.bands ?? [])] });
  }
}

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

// ---------------------------------------------------------------- 10. the landing pad
// Outside the windbreak's south side, below the trench's gate: a hollow of
// drifts too steep to climb (2 at once, then on up), cut west and east
// where the wind has scoured gaps, each opening into a pocket out of sight
// (where the wave comes from), and south into the wash. Jan won't land on
// it with troopers coming; the farm's beacon lamps still lit round its spot.
const PAD = [150, 106, 196, 132];
p.rect(128, 92, W - 1, 142, (x, y, c) => (x < 190 && y < 106 ? c : sand(quarter(OUT + Math.min(6, 2 + 0.4 * boxDist(x, y, PAD) + 0.5 * valueNoise(x, y, 4, 42))))));
p.rect(...PAD, sand(OUT));
for (const box of [
  [142, 114, 150, 120], [134, 110, 142, 124], // the west cut and its pocket
  [196, 110, 202, 116], [198, 104, 204, 122], // the east cut
]) p.rect(...box, sand(OUT));
for (const [x, y] of [[168, 116], [176, 116], [168, 124], [176, 124]]) lights.push({ x, y, z: OUT + 1, radius: 3, light: 32 });
list.push(
  at('boulder-large', 158.5, 113, { angle: 30 }), at('boulder-small', 162.5, 126.5, { angle: 200 }),
  at('boulder-large', 186.5, 112, { angle: 140 }), at('boulder-small', 189, 125.2, { angle: 80 }),
  at('boulder-small', 154.5, 121.5, { angle: 310 }), at('boulder-large', 180.5, 129, { angle: 250 }),
);

// ---------------------------------------------------------------- 11. the wash
// South of the pad the rocks begin, the Jundland's edge, their tops 3.5 to
// 5 m up and out of reach. A dry stream bed winds down into them, 4 to 5.5 m
// wide: south 10 m (two steps down, then under a natural arch of rock),
// west 15 m (two more), then south-west (two more) onto the flat where the
// Crow sets down. Its walls stand 4 to 6 m over it at first, 5 to 7 m by the end.
const rockTop = (x, y) => quarter(OUT + 7 + 3 * valueNoise(x, y, 10, 43) + 0.75 * valueNoise(x, y, 3, 44));
p.rect(64, 142, W - 1, H - 1, (x, y) => ({ floor: 'desert-gravel', ceiling: 'sky', floorZ: rockTop(x, y), ceilZ: SKY, light: SUN, side: 'sandstone' }));
/** The wash's line, from the pad down to the flat. */
const WASH = [[174, 128], [174, 152], [164, 160], [136, 161], [124, 168], [116, 178]];
/** Where the floor drops, by the distance down the wash: two steps of 0.5 each. */
const DROPS = [14, 46, 70];
const washFloor = (s) => OUT - 0.5 * DROPS.reduce((n, d) => n + (s >= d) + (s >= d + 2), 0);
/** The nearest point on a line of points to (x, y): how far off the line, and how far along it. */
function along(line, x, y) {
  let best = { off: Infinity, s: 0 };
  let s0 = 0;
  for (let i = 1; i < line.length; i++) {
    const [ax, ay] = line[i - 1];
    const [bx, by] = line[i];
    const len = Math.hypot(bx - ax, by - ay);
    const t = Math.max(0, Math.min(1, ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / (len * len)));
    const off = Math.hypot(x - ax - t * (bx - ax), y - ay - t * (by - ay));
    if (off < best.off) best = { off, s: s0 + t * len };
    s0 += len;
  }
  return best;
}
/** The flat at the wash's foot (12, below): an oval about 26 x 16 m. */
const FLAT = { cx: 110, cy: 187, rx: 26, ry: 16, z: washFloor(Infinity) };
// Cut the wash and the flat into the rocks (and the wash's mouth through
// the drifts south of the pad), with ragged edges.
p.rect(64, 120, W - 1, H - 1, (x, y, c) => {
  const { off, s } = along(WASH, x + 0.5, y + 0.5);
  const inFlat = ((x + 0.5 - FLAT.cx) / FLAT.rx) ** 2 + ((y + 0.5 - FLAT.cy) / FLAT.ry) ** 2 < 0.85 + 0.3 * valueNoise(x, y, 5, 46);
  if (inFlat) return sand(FLAT.z, { tag: 'flat' });
  if (off >= 4 + 1.5 * valueNoise(x, y, 6, 45)) return c;
  const floor = sand(washFloor(s), { side: 'sandstone' });
  // The arch: a span of rock 1.5 m thick, 2.5 m over the floor.
  if (s >= 18 && s < 21) return { ...floor, slab: { bottom: floor.floorZ + 5, top: rockTop(x, y), floor: 'desert-gravel', ceiling: 'sandstone', side: 'sandstone', light: 112 } };
  return { ...floor, tag: s >= 82 ? 'flat' : c.tag };
});
// ---------------------------------------------------------------- 12. the flat
// Where the wash comes out of the rocks: a flat of sand at their foot, the
// lowest ground on the map. The Crow hovering on it, nose north-west, its
// landing lights on; under its middle, the level ends.
list.push(at('moldy-crow', 106, 190, { angle: 140 }));
p.rect(102, 186, 111, 195, (_, __, c) => ({ ...c, tag: 'pickup' }));
lights.push({ x: 106, y: 190, z: FLAT.z + 1, radius: 9, light: 72 });

// ---------------------------------------------------------------- 5. the work yard: the generator shed, the staging point, the gate
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

// ---------------------------------------------------------------- 7. the house: its great dome
// The entrance dome after the film's (Mark, 2026-11-07): a great dome on a
// block wider than it, lower wings either side, at the end of the lane, so
// it shows over the work yard's wall, over the gate: the destination. The
// way down starts outside: a sunken stairwell cut down from the lane's end,
// kerbed, six steps east to the door in its hood at the foot. Inside, under
// the dome, a hall at the stairwell's foot; six more steps down south in its
// floor, and on under the ground to the doorway halfway down the
// courtyard's north wall.
const DOME = { cx: 160, cy: 20, h: FARM + 8 };
/** The stairwell's foot, the door and the hall: six steps under the farm. */
const HALL = FARM - 3;
town.block(152, 14, 168, 26, { h: DOME.h, skirt: null });
town.block(154, 12, 166, 14, { h: FARM + 5, skirt: null }); // the north wing, against the windbreak
town.block(154, 26, 166, 29, { h: FARM + 5, skirt: null }); // the south wing
town.dome(DOME.cx, DOME.cy, DOME.h, 11);
town.room(153, 15, 167, 25, { h: DOME.h, floorZ: HALL, ceilZ: FARM + 4.5, light: 112 });
// The stairwell: from the lane's end east down six steps of 0.5 to its foot
// before the door, open to the sky, a kerb along its sides.
p.rect(143, 17, 152, 23, (x) => yard(Math.max(HALL, FARM - 0.5 * (x - 143)), { floor: 'flagstone' }));
town.kerb(143, 16, 152, 17, { h: FARM + 0.375 });
town.kerb(143, 23, 152, 24, { h: FARM + 0.375 });
// The door's opening, round-topped, in a hood standing out of the block.
town.arch(152, 18, 153, 22, { h: DOME.h, lintel: LINTEL, floorZ: HALL, floor: 'flagstone', light: 152, round: 'W' });
town.hood(152, 20, 'W', { h: DOME.h, width: 4, floorZ: HALL });
apron(138, 16, 143, 24);
lights.push({ x: 157, y: 17, z: HALL + 3, radius: 6, light: 48 });

// ---------------------------------------------------------------- 1, 4, 7, 9. the four pits
// Round pits open to the sky, their walls the farm's whitewash: the three
// small ones 8 deep (4 m), the house's courtyard, the big one, 12 (6 m). No
// parapets: one hides a pit from the troopers on its rim.
const pit = (cx, cy, r, floor = 'street-sand', z = PIT) => town.circle(cx, cy, r, { inside: yard(z, { floor }), wall: { wall: 'adobe-pale', wallTop: FARM }, seam: 90 });
pit(28, 46, 6, 'flagstone'); // 1. the garden pit, the drop-off
pit(80, 52, 8); // 4. the workshop pit
pit(160, 46, 12, 'street-sand', COURT); // 7. the house's courtyard
pit(180, 84, 7, 'flagstone'); // 9. the garage pit
lights.push({ x: 28, y: 46, z: PIT + 3.5, radius: 6, light: 64 }); // the grow lamps
lights.push({ x: 82, y: 56, z: PIT + 1, radius: 5, light: 48 }); // a speeder burning
lights.push({ x: 160, y: 50, z: COURT + 1, radius: 6, light: 56 }); // the cart burning

// ---------------------------------------------------------------- 2. the pump tunnels
// Under the garden court, east from the garden pit: the tunnel and the
// pump room (the water pipe goes down into its pump), its one way on the
// stair down to the reservoir. Tunnels 4 wide, ceilings at 2 m.
doorway(33, 44, 35, 48, 'W');
dig(35, 44, 50, 48);
dig(46, 46, 58, 58, { light: 104, floor: 'yard-plate' });
lights.push({ x: 52, y: 52, z: PIT + 3, radius: 6, light: 48 });
// Secret 1: the hidey-hole off the tunnel's north side, where the family
// hid Rusk, behind a door in the plaster.
dig(35, 34, 44, 40, { light: 72 });
dig(39, 40, 41, 44, { light: 72, ceilZ: PIT + 2.5 });
p.rect(39, 43, 41, 44, (_, __, c) => ({ ...c, door: 'adobe-pale', style: 'rise', secret: true }));
secret(35, 34, 44, 44);
list.push(at('med-kit', 36.5, 35.5), at('thermal-detonator', 42.5, 38.5));

// ---------------------------------------------------------------- 3. the reservoir
// The farm's water store, dug under the sand outside the windbreak's south
// side: 12 steps down from the pump room, in two flights, a hall 32 m long running east,
// 4.5 m to its vault, a walkway along its north side and the shallow pool
// beside it, a row of pillars in the pool, two shafts of evening light, the
// Imperials' work lamps. At its east end, 12 steps up north under the wall
// to the tunnel east of the workshop pit.
p.rect(40, 66, 112, 92, sand(FARM)); // the sand over it, out of reach
const vault = { ceilZ: RESERVOIR + 9, top: FARM, lining: RESERVOIR_WALLS, floor: 'derelict-floor', light: 80 };
stairDown(50, 58, 54, 74, PIT, { flight: 7, to: RESERVOIR, lining: RESERVOIR_WALLS, floor: 'derelict-floor' });
under(44, 74, 108, 86, { ...vault, floorZ: RESERVOIR });
under(44, 78, 108, 86, { ...vault, floorZ: RESERVOIR - 0.5, floor: 'water-murky', light: 72 });
// The walkway a grating over the damp.
p.rect(44, 74, 108, 78, (_, __, c) => (c.slab ? { ...c, floor: 'hold-floor' } : c));
for (const x of [56, 66, 76, 86, 96]) p.rect(x, 80, x + 2, 82, { wall: 'sandstone' });
stairDown(100, 58, 104, 74, PIT, { flight: 7, to: RESERVOIR, lining: RESERVOIR_WALLS, floor: 'derelict-floor' });
lights.push({ x: 70, y: 75.5, z: RESERVOIR + 1, radius: 7, light: 64 }, { x: 99, y: 75.5, z: RESERVOIR + 1, radius: 7, light: 64 });

// ---------------------------------------------------------------- 4. the workshop
// The droid workshop dug north of the workshop pit, the shed's stair coming
// down into it. Up from the reservoir, the tunnel runs west into the pit;
// east, toward the house, it caved in, in sight from the stair's head.
dig(70, 26, 88, 40, { light: 120, floor: 'yard-plate' });
doorway(78, 40, 82, 45, 'S');
// The shed's stair: down its west wall under the yard, eight steps, a
// landing, then eight more on down the workshop's west wall, open to the room.
stairDown(70, 14, 74, 26, 0);
stairDown(70, 26, 74, 32, 0, { start: 14, ceilZ: (f) => Math.min(FARM - 0.5, f + 4.5), light: 120 });
lights.push({ x: 84, y: 30, z: PIT + 3, radius: 6, light: 48 });
doorway(87, 50, 90, 54, 'W');
dig(90, 50, 110, 54, { light: 88 });
dig(100, 54, 104, 58, { light: 88 });
tag(100, 50, 110, 54, 'rubble');
list.push(at('boulder-small', 108.6, 51, { angle: 40 }), at('boulder-small', 109, 53.2, { angle: 160 }), at('boulder-small', 106.8, 52.4, { angle: 280 }));
// Secret 2: the well room south of the caved-in tunnel, reached only down
// its light well from the yard; a secret door out north into the tunnel.
dig(90, 56, 98, 62, { light: 88 });
dig(93, 54, 95, 56, { light: 88, ceilZ: PIT + 2.5 });
p.rect(93, 54, 95, 55, (_, __, c) => ({ ...c, door: 'adobe-pale', style: 'rise', secret: true }));
secret(90, 55, 98, 62);
list.push(at('shield-unit', 91.5, 60.5), at('energy-pack', 96.5, 60.5));

// ---------------------------------------------------------------- 7. the house's rooms
// Round the courtyard pit, under the house's ground: the dome's stair from
// the north, the common room west, the quarters east, the storeroom south,
// and a tunnel from the common room round to the storeroom (a loop for the
// fight).
// (Under the hall's ceiling while it's in the hall; then stepping down with the flight.)
stairDown(158, 22, 162, 32, HALL, { start: 21, flight: 7, to: MID, lining: HOUSE, ceilZ: (f, old, t) => (old.slab ? old.slab.bottom : Math.min(t - 0.25, f + 4.5)) });
doorway(158, 32, 162, 35, 'S', MID);
// From the doorway, halfway down the courtyard's north wall, a stair 3 wide
// down the wall's inside, east and round to the floor: a landing, then
// twelve steps of 0.5 (counted along its inner edge, so no step is more).
{
  const [cx, cy, r, wide] = [160, 46, 12, 4];
  const inner = r - wide;
  const LANDING = 0.2; // radians either side of north
  p.rect(cx - r, cy - r, cx + r, cy + 3, (x, y, c) => {
    if (c.floorZ !== COURT || c.line || c.wall || c.slab) return c;
    const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
    if (d < inner) return c;
    const turned = Math.atan2(y + 0.5 - cy, x + 0.5 - cx) + Math.PI / 2; // 0 at north, clockwise
    if (turned < -LANDING) return c;
    const f = MID - 0.5 * Math.max(0, Math.ceil((turned - LANDING) * inner));
    if (f <= COURT) return c;
    // The landing is a balcony over a blind door, whitewashed, a low
    // parapet along its edge; the flight's open side a red-ochre cheek.
    if (turned <= LANDING) return { ...c, floorZ: d < inner + 0.9 ? MID + 1 : MID, side: 'adobe-pale', bands: [{ to: COURT + 1, tex: 'pit-dado' }] };
    return { ...c, floorZ: f, side: 'pit-dado' };
  });
  list.push({ type: 'arch-hood-3-pale', x: cx, y: cy - inner + 0.01, z: COURT, angle: 0 });
}
dig(138, 40, 146, 52, { floorZ: COURT, light: 112, lining: HOUSE });
doorway(146, 44, 149, 48, 'E', COURT);
lights.push({ x: 142, y: 46, z: COURT + 3, radius: 6, light: 40 });
doorway(171, 44, 174, 48, 'W', COURT);
dig(174, 38, 186, 54, { floorZ: COURT, light: 96, lining: HOUSE });
lights.push({ x: 180, y: 46, z: COURT + 3, radius: 5, light: 32 });
doorway(158, 57, 162, 61, 'N', COURT);
// The kitchen: a galley straight on from the doorway, 2 m across, its
// vault low over the cupboards; the storeroom west of it, through a
// doorway at its far end.
dig(158, 61, 162, 71, { floorZ: COURT, ceilZ: COURT + 3.25, light: 112, lining: HOUSE });
// (The vault's step is the edge cells' slab, which takes the surface's sand
// where a drift steps down over it: plaster up to the vault.)
for (const x of [158, 161]) p.rect(x, 61, x + 1, 71, (_, __, c) => ({ ...c, slab: { ...c.slab, bottom: COURT + 2.75 }, bands: [{ to: COURT + 4, tex: 'plaster-white' }] }));
dig(156, 67, 158, 70, { floorZ: COURT, ceilZ: COURT + 3, light: 96, lining: HOUSE });
dig(150, 61, 156, 70, { floorZ: COURT, light: 96, lining: HOUSE });
lights.push({ x: 160, y: 66, z: COURT + 2.5, radius: 5, light: 48 }, { x: 153, y: 65, z: COURT + 3, radius: 4, light: 32 });
dig(140, 52, 144, 66, { floorZ: COURT, light: 88 });
dig(144, 62, 150, 66, { floorZ: COURT, light: 88 });

// The kitchen, after the film's (Mark's references): white built-in
// counters close along both walls with cupboards over them, a red stripe
// along their fronts and lights under them, the appliances stacked at the
// end. Crates in the storeroom. The common room has the red rug and oval
// niches round its walls.
for (const [type, x, y, face] of [
  ['kitchen-counter-5', 158, 64, 'E'], ['kitchen-counter-7', 162, 65, 'W'], ['kitchen-counter-2', 162, 69.5, 'W'],
  ['kitchen-appliances', 159.4, 71, 'N'], ['kitchen-appliances', 160.6, 71, 'N'],
]) town.fixture(type, x, y, face, { z: COURT });
list.push(at('supply-crate', 154.6, 61.9, { z: COURT, angle: 8 }), at('supply-crate', 154.8, 63.4, { z: COURT, angle: 352 }));
p.rect(140, 43, 145, 50, (_, __, c) => ({ ...c, floor: 'rug-red' }));
decals.push(
  ...[[42.5, 'E'], [49.5, 'E']].map(([y, face]) => ({ x: 138, y, z: COURT + 2.3, face, tex: 'niche-oval' })),
  ...[141, 144].map((x) => ({ x, y: 40, z: COURT + 2.3, face: 'S', tex: 'niche-oval' })),
  { x: 150, y: 68.5, z: COURT + 2.4, face: 'E', tex: 'niche-oval' },
);

// ---------------------------------------------------------------- 8. the cellar
// Six steps down from the storeroom: cold and dark, the cistern's pool along
// its south side, the lamp knocked over and still lit on the floor, the
// recordings behind a loose stone at its east end.
stairDown(152, 70, 156, 76, COURT - 0.5, { ceilZ: (f) => Math.min(COURT + 4, f + 4), light: 80, lining: HOUSE });
under(144, 76, 166, 88, { floorZ: CELLAR, ceilZ: CELLAR + 4, lining: CISTERN, light: 72 });
under(146, 83, 158, 87, { floorZ: CELLAR - 0.5, ceilZ: CELLAR + 4, floor: 'water-murky', lining: CISTERN, light: 64 });
lights.push({ x: 161.5, y: 79.5, z: CELLAR + 0.3, radius: 4, light: 40 });
tag(162, 77, 166, 81, 'recordings');
// Secret 3: a niche behind a loose panel in the cellar's west wall.
const niche = { floorZ: CELLAR, ceilZ: CELLAR + 2.5, floor: 'sandstone', lining: ROCK, light: 64 };
under(139, 78, 143, 84, niche);
under(143, 80, 144, 82, { ...niche, extra: { door: 'sandstone', style: 'rise', secret: true } });
secret(139, 78, 144, 84);
list.push(at('power-cell', 140.5, 79.5), at('med-kit', 140.5, 82.5));

// ---------------------------------------------------------------- 9. the garage, its pit, the trench
// Off the garage pit's north side, behind a roll-down shutter, down until
// the recordings are taken (out of sight: the caves come up into the pit).
// Round, after the film's (Mark's references): tan plaster under a dark
// ceiling, a ring of round amber lamps all the way round under it, a
// bronze grating in the middle sunk inside a red-ochre kerb, the console
// against the north wall with a lamp either side, and a thick
// rounded-square frame round the opening onto the pit. Dark and oily.
// The tiles are dug in steps round the circle; its wall is a model
// (models/farm.js, `garage-ring`) that collides along its curve.
const GARAGE = { cx: 180, cy: 65, grate: 3.5, ceil: PIT + 4.5 };
{
  const { cx, cy, grate, ceil } = GARAGE;
  const { r } = GARAGE_RING;
  const box = [173, 58, 187, 72];
  const ground = [];
  p.rect(...box, (x, y, c) => (ground.push([x, y, c]), c));
  dig(...box, { ceilZ: ceil, light: 80, floor: 'derelict-floor', lining: { wall: 'adobe', ceiling: 'hold-ceiling' } });
  // Every tile the circle reaches into is dug; the floor a step up round
  // the sunk grating, its edge the red-ochre kerb.
  for (const [x, y, old] of ground) {
    const near = Math.hypot(Math.max(x - cx, 0, cx - x - 1), Math.max(y - cy, 0, cy - y - 1));
    const c = p.get(x, y);
    if (near >= r) p.set(x, y, old);
    else if (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) < grate) p.set(x, y, { ...c, floor: 'grate-bronze' });
    else p.set(x, y, { ...c, floorZ: PIT + 0.25, side: 'pit-dado' });
  }
  list.push({ type: 'garage-ring', x: cx, y: cy, z: PIT + 0.25, angle: 0 });
  list.push({ type: 'garage-kerb', x: cx, y: cy, z: PIT, angle: 0 });
  // The console on the chord across the north wall.
  list.push({ type: 'garage-console', x: cx, y: cy - r + 0.45, z: PIT + 0.25, angle: 0 });
  // The frame round the opening, on the circle's foot; oil on the floor.
  list.push({ type: 'garage-frame-4', x: cx, y: 71.99, z: PIT, angle: 180 });
  list.push(at('floor-spill-2', 177, 67.5, { z: PIT, angle: 20 }), at('floor-spill-1', 183, 63, { z: PIT + 0.25, angle: 110 }), at('floor-spill-1', 180.5, 70, { z: PIT + 0.25, angle: 200 }));
  lights.push({ x: cx, y: cy, z: ceil - 0.5, radius: 8, light: 56 }, { x: cx, y: 60, z: PIT + 2, radius: 4, light: 40 });
}
// The hangar off the garage's east side (the film's, where the skyhopper
// stands through the second opening; Mark's notes, 2026-11-09): dug under
// the drifts beyond the windbreak, 8 m across and 13 long, its floor 2 m
// under the garage's and its roof at the ground, the roof's doors over the
// skyhopper. A grate catwalk at the garage's floor runs along its west and
// north walls behind a railing, and a stair goes down along the south
// wall. It's under solid rock, not a slab, so the catwalk can be one.
const HANGAR = { box: [190, 52, 207, 79], floor: PIT - 4, roof: 2, walk: PIT + 0.25 };
{
  const [x0, y0, x1, y1] = HANGAR.box;
  const { floor, roof, walk } = HANGAR;
  dig(187, 63, 190, 67, { floorZ: walk, ceilZ: walk + 3.5, floor: 'derelict-floor', lining: { wall: 'adobe', ceiling: 'hold-ceiling' }, light: 80 });
  list.push({ type: 'garage-frame-4', x: 186.99, y: 65, z: walk, angle: 270 });
  const room = { floor: 'derelict-floor', ceiling: 'hold-ceiling', floorZ: floor, ceilZ: roof, light: 124, side: 'hold-wall' };
  p.rect(x0, y0, x1, y1, room);
  p.rect(195, 58, 205, 72, { ...room, ceiling: 'door-bay-rising', ceilZ: roof + 0.5 });
  // Its walls: dark plating up to the catwalk, tan panels over it.
  const bands = [{ to: walk, tex: 'hold-wall' }, { to: roof + 0.5, tex: 'bay-wall' }];
  for (let y = y0 - 1; y <= y1; y++) {
    for (let x = x0 - 1; x <= x1; x++) {
      const c = p.get(x, y);
      if (!c || (x >= x0 && x < x1 && y >= y0 && y < y1)) continue;
      p.set(x, y, c.wall ? { ...c, wall: 'bay-wall', bands: [bands[0]] } : { ...c, bands: [...bands, ...(c.bands ?? [])] });
    }
  }
  const grate = { bottom: walk - 0.25, top: walk, floor: 'grate-bronze', ceiling: 'grate-bronze', side: 'metal-grey', light: 100 };
  p.rect(x0, y0, x0 + 3, y1, (_, __, c) => ({ ...c, slab: grate }));
  p.rect(x0 + 3, y0, x1, y0 + 3, (_, __, c) => ({ ...c, slab: grate }));
  for (let k = 0; k < 8; k++) p.rect(x0 + 3 + k, y1 - 3, x0 + 4 + k, y1, (_, __, c) => ({ ...c, floorZ: walk - 0.5 * (k + 1), side: 'hold-wall' }));
  const rail = { tex: 'rail-rust', height: 0.75 };
  p.fence(x0 + 2, y0 + 3, x0 + 3, y1 - 3, 'E', rail);
  p.fence(x0 + 3, y0 + 2, x1, y0 + 3, 'S', rail);
  p.fence(x0 + 3, y1 - 3, x0 + 11, y1 - 2, 'N', rail);
  list.push({ type: 'skyhopper', x: 200, y: 65, z: floor, angle: 180 });
  list.push(at('floor-spill-2', 198.5, 70.5, { z: floor, angle: 70 }), at('floor-spill-1', 201.5, 61, { z: floor, angle: 150 }));
  lights.push(
    { x: 200, y: 61, z: floor + 8, radius: 9, light: 56 },
    { x: 200, y: 70, z: floor + 8, radius: 9, light: 48 },
    { x: 191.5, y: 65, z: walk + 2.5, radius: 4, light: 40 },
  );
}
dig(178, 72, 182, 78, arch());
shutter(178, 72, 182, 73);
// The trench: out of the pit's south side, eight steps of 0.5 up south,
// then level to the gate through the windbreak onto the pad (lower than the
// farm); open to the sky, walled in the farm's plaster (its walls stand 2 m
// over the back plot, so it stays out of reach).
p.rect(177, 91, 183, 104, (x, y) => yard(Math.min(OUT, PIT + 0.5 * (y - 91)), { floor: 'flagstone' }));
town.block(175, 92, 177, 104, { h: FARM + 4, skirt: null });
town.block(183, 92, 185, 104, { h: FARM + 4, skirt: null });
town.arch(177, 104, 183, 106, { h: WALL, lintel: 4, floorZ: OUT, floor: 'flagstone', light: 136 });
tag(177, 102, 183, 106, 'trench-head');

// ---------------------------------------------------------------- 8a. the caves
// Rusk's way out: a panel in the cellar's south wall, opened by taking the
// recordings. Behind it his cut steps go down (6 of 0.5) into natural
// caves under the drifts and the pad: a cavern 7 m across, a low passage
// east under the pad, rising gently (a quarter step every tile or two),
// and on up north under the east windbreak into the garage pit's east side. One way, no turnings.
// Dark (56 to 72), lit by the troopers' lamps and the light through cracks.
const CAVE = [[145.5, 88], [145.5, 100], [138, 110], [140, 122], [152, 131], [172, 135], [189, 128], [190, 110], [190, 92], [190, 84]];
const CAVE_LEN = CAVE.slice(1).reduce((n, [x, y], i) => n + Math.hypot(x - CAVE[i][0], y - CAVE[i][1]), 0);
const STEPS = 7; // Rusk's cut steps end here (distance along the caves)
const CAVERN = [24, 52]; // the cavern, wide and tall
const CLIMB = 60; // from here the floor climbs to the garage pit's floor
const caveFloor = (s, x, y) => {
  if (s < 1) return CELLAR;
  if (s < STEPS) return CELLAR - 0.5 * Math.ceil(s - 1);
  const rough = quarter(CELLAR - 3.5 + valueNoise(x, y, 5, 47) - 0.5);
  if (s < CLIMB) return rough;
  const t = Math.min(1, (s - CLIMB) / (CAVE_LEN - 2 - CLIMB));
  return quarter(rough + t * (PIT - rough));
};
const caveWide = (s) => (s < STEPS ? 1.5 : s > CAVERN[0] && s < CAVERN[1] ? 2.5 + 4.5 * Math.sin((Math.PI * (s - CAVERN[0])) / (CAVERN[1] - CAVERN[0])) : 2.5);
const garagePit = (x, y) => Math.hypot(x + 0.5 - 180, y + 0.5 - 84) < 7.5;
p.rect(128, 76, 196, 142, (x, y, c) => {
  if (garagePit(x, y) || c.slab) return c;
  const { off, s } = along(CAVE, x + 0.5, y + 0.5);
  if (off >= caveWide(s) + (s < STEPS ? 0 : 0.8 * valueNoise(x, y, 3, 48))) return c;
  const f = caveFloor(s, x, y);
  const tall = s > CAVERN[0] && s < CAVERN[1] ? 4 + 5 * Math.sin((Math.PI * (s - CAVERN[0])) / (CAVERN[1] - CAVERN[0])) : 0;
  const top = topOf(c);
  const ceil = Math.min(top - 1, f + (s < STEPS ? 4 : 4.25 + tall + valueNoise(x, y, 4, 49)));
  linings.set(y * W + x, ROCK);
  return {
    floor: 'desert-gravel', ceiling: 'sky', floorZ: f, ceilZ: SKY, light: c.light ?? SUN, side: 'sandstone',
    slab: { bottom: quarter(ceil), top, floor: c.floor ?? 'desert-sand', ceiling: 'sandstone-dark', side: c.side ?? 'desert-sand', light: s < STEPS ? 64 : 72 },
  };
});
// The panel at the steps' head, and the arch into the garage pit.
p.rect(144, 88, 147, 89, (_, __, c) => ({ ...c, door: 'sandstone', style: 'rise', lock: 'remote', stayOpen: true, tag: 'bolthole' }));
dig(186, 82, 189, 87, arch());
tag(131, 106, 147, 124, 'tremor');
lights.push(
  { x: 145.5, y: 90, z: CELLAR + 2, radius: 4, light: 40 }, // the panel, lit from inside once it's open
  ...[
    [137, 112, 3.5, 5, 40], // a crack's light in the cavern
    [144, 121, 2, 6, 56], // the troopers' lamp
    [176, 134, 2, 5, 48], // a crack under the wash
    [190, 100, 2, 5, 48], // the troopers' lamp on the climb
  ].map(([x, y, up, radius, light]) => ({ x, y, z: caveFloor(along(CAVE, x, y).s, x, y) + up, radius, light })),
);

// ---------------------------------------------------------------- the light wells
// Shafts of evening light down into the tunnels and rooms: the pump
// tunnel, the pump room, the reservoir's two, the workshop, the house's
// loop tunnel and quarters, and the well room's (its only way in).
for (const [x, y] of [[40, 45], [51, 51], [61, 83], [81, 83], [84, 30], [141, 57], [179, 41], [93, 58]]) well(x, y);

lineDug();

// ---------------------------------------------------------------- the machinery under the ground
// After the cutaway in Mark's references: the farm's water pipe on its
// brackets from where it comes down out of the garden court, along the pump
// tunnel to the pump, along the reservoir's north wall over a band of
// pipework, and on east along the tunnel past the workshop pit until the
// cave-in (Jan: "follow the water pipe"). Conduit, tanks, units, gauges,
// vents and hatches where people work.
/**
 * The water pipe (models/farm.js) along a path of points on its axis,
 * [x, y, z, wall]: each leg straight along x, along y or upright, its
 * brackets back to the wall on side `wall` (N, E, S or W) of the point it
 * leaves from; a flanged joint at each turn, and where a leg over 16 long
 * is joined. Legs come in quarter tiles.
 */
function waterPipe(path) {
  const turn = { N: 0, W: 90, S: 180, E: 270 };
  const put = (type, x, y, z, wall) => list.push({ type, x, y, z, angle: turn[wall] });
  for (let i = 1; i < path.length; i++) {
    const [ax, ay, az, wall] = path[i - 1];
    const [bx, by, bz] = path[i];
    const len = Math.abs(bx - ax) + Math.abs(by - ay) + Math.abs(bz - az);
    const n = Math.ceil(len / 16);
    const piece = len / n;
    if ([ax !== bx, ay !== by, az !== bz].filter(Boolean).length !== 1 || piece * 4 !== Math.round(piece * 4)) throw new Error(`m2: the water pipe's leg from (${ax}, ${ay}, ${az}) to (${bx}, ${by}, ${bz}) must be straight and in quarter tiles`);
    for (let k = 0; k < n; k++) {
      if (az !== bz) put(`water-pipe-up-${piece}`, ax, ay, Math.min(az, bz) + k * piece, wall);
      else put(`water-pipe-${piece}`, ax + ((bx - ax) * (k + 0.5)) / n, ay + ((by - ay) * (k + 0.5)) / n, az, wall);
      if (k > 0) put('water-pipe-joint', ax + ((bx - ax) * k) / n, ay + ((by - ay) * k) / n, az + ((bz - az) * k) / n, wall);
    }
    if (i < path.length - 1) put('water-pipe-joint', bx, by, bz, path[i][3]);
  }
}
/** Where the pipe hangs: half a tile under a tunnel's ceiling. */
const HUNG = PIT + 3.5;
// Down out of the garden court, along the pump tunnel's north wall, round
// the step into the pump room, and down its wall into the pump.
const PUMP_AT = [54, 46 + 0.25 + PUMP.back];
waterPipe([[35.5, 44.25, PIT + 4, 'N'], [35.5, 44.25, HUNG, 'N'], [49.75, 44.25, HUNG, 'E'], [49.75, 46.25, HUNG, 'N'], [54, 46.25, HUNG, 'N'], [54, 46.25, PIT + PUMP.inlet]]);
list.push({ type: 'water-pump', x: PUMP_AT[0], y: PUMP_AT[1], z: PIT, angle: 0 });
// The reservoir: in through its west wall over the stairs' lintels, the
// whole length of the north wall, and up the east end into the vault.
const RES_PIPE = RESERVOIR + 5;
waterPipe([[43.75, 74.25, RES_PIPE, 'N'], [107.75, 74.25, RES_PIPE, 'E'], [107.75, 74.25, RESERVOIR + 9]]);
// Pipework along the foot of the north wall, under the pipe (not across
// the stairs' openings).
p.rect(44, 73, 108, 74, (_, __, c) => (c.slab ? c : { ...c, bands: [{ from: RESERVOIR, to: RESERVOIR + 2, tex: 'pipe-band' }, ...(c.bands ?? [])] }));
// Out of the ceiling past the workshop pit's doorway, east along the tunnel
// until it goes under the cave-in.
waterPipe([[90.5, 50.25, PIT + 4, 'N'], [90.5, 50.25, HUNG, 'N'], [106.5, 50.25, HUNG]]);
// Conduit, tanks, units and gauges on the walls; vents up by the ceilings;
// hatches in the floors.
const fittings = [
  ['conduit-10', 40.5, 48, 'N', PIT + 2.75], // the pump tunnel
  ['wall-tank', 58, 50.5, 'W', PIT + 1.6], ['wall-unit', 58, 54.5, 'W', PIT + 1.2], ['conduit-6', 55, 58, 'N', PIT + 2.75], // the pump room
  ['wall-unit', 80, 26, 'S', PIT + 1.2], ['conduit-12', 81, 26, 'S', PIT + 3], ['wall-tank', 88, 33, 'W', PIT + 1.6], ['conduit-8', 80, 40, 'N', PIT + 3.1], // the workshop
  ['conduit-8', 95, 54, 'N', PIT + 2.75], // the tunnel past the workshop pit
  ['conduit-12', 140, 59, 'E', COURT + 2.75], // the house's loop tunnel
];
for (const [type, x, y, face, z] of fittings) town.fixture(type, x, y, face, { z });
decals.push(
  { x: 51.6, y: 46, z: PIT + 1.7, face: 'S', tex: 'wall-meter' }, // by the pump
  { x: 46, y: 53, z: PIT + 3.2, face: 'E', tex: 'vent-grille' },
  { x: 47, y: 48, z: PIT + 3.3, face: 'N', tex: 'vent-round', scale: 0.8 },
  { x: 88, y: 29, z: PIT + 3.4, face: 'W', tex: 'vent-round' },
  { x: 76, y: 26, z: PIT + 3.4, face: 'S', tex: 'wall-fan' },
  { x: 86.5, y: 26, z: PIT + 1.6, face: 'S', tex: 'wall-meter' },
  { x: 108, y: 82, z: RESERVOIR + 3, face: 'W', tex: 'vent-grille', scale: 1.5 },
  { x: 44, y: 82, z: RESERVOIR + 3, face: 'E', tex: 'vent-grille', scale: 1.5 },
  { x: 107, y: 54, z: PIT + 3.3, face: 'N', tex: 'vent-round', scale: 0.8 },
);
list.push(at('floor-hatch', 56.5, 56, { z: PIT }), at('floor-hatch', 76.5, 37.5, { z: PIT, angle: 30 }));

// The pits' walls in two tones (lib/farm.js): whitewash to about 2.25 m in
// the small pits and 3 m in the courtyard, rising over each doorway, bare
// earth above it, the red-ochre dado at the foot.
// Round-topped doorways in thick hoods; blind plank doors round the walls
// (the farm's rooms we don't go into); the garage pit's two square.
for (const [x0, y0, x1, y1, face, z] of DOORWAYS) pitDoorway(list, x0, y0, x1, y1, face, { floorZ: z, lintel: LINTEL });
decals.push({ x: 160, y: 38, z: COURT + 2, face: 'S', tex: 'door-planks' }); // under the balcony
const blind = (cx, cy, r, z, angles) => angles.map((a) => blindDoor(list, decals, cx, cy, r, a, { floorZ: z }));
pitWalls(p, 28, 46, 6, { floorZ: PIT, wash: 4.5, over: 1.5, seed: 51, blind: blind(28, 46, 6, PIT, [160]) });
pitWalls(p, 80, 52, 8, { floorZ: PIT, wash: 4.5, over: 1.5, seed: 52, blind: blind(80, 52, 8, PIT, [215]) });
pitWalls(p, 160, 46, 12, { floorZ: COURT, wash: 6, over: 1.5, seed: 53, blind: blind(160, 46, 12, COURT, [135, 225]) });
// The courtyard's landmark: the condenser panel on its south-east wall, as
// tall as the whitewash, two vents on the rim over it.
{
  const a = (315 * Math.PI) / 180;
  const [ux, uy] = [Math.cos(a), -Math.sin(a)];
  const chord = Math.sqrt(12 * 12 - (PANEL.w / 2) ** 2);
  list.push({ type: 'condenser-panel', x: 160 + ux * chord, y: 46 + uy * chord, z: COURT, angle: 225 });
  for (const s of [-1.6, 1.6]) list.push(at('vaporator-cap', 160 + ux * 13 - uy * s, 46 + uy * 13 + ux * s, { z: FARM }));
}
pitWalls(p, 180, 84, 7, { floorZ: PIT, wash: 4.5, over: 1.5, seed: 54, blind: blind(180, 84, 7, PIT, [200]) });

// The farm's vaporators (models/vaporator.js, after the film's): a few in
// the garden court, seen from the pit; in the yard (off the line from the
// shed's door to the gate); in the lane. Each has its humidity sensor
// turning on its mast, and every other one a domed cap at its foot.
[[18.5, 30.5], [52.5, 30.5], [94.5, 30.5], [112.5, 58.5], [130.5, 22.5], [138.5, 13.5], [184.5, 64.5]].forEach(([x, y], k) => {
  const turn = Math.round(valueNoise(x, y, 1, 7) * 360);
  list.push(at('vaporator-farm', x, y, { z: FARM, angle: turn }), at('vaporator-sensor', x, y, { z: FARM + SENSOR_Z, angle: (turn * 7) % 360 }));
  // Its long thin shadow across the yard in the low suns.
  town.caster(x, y, 0.7, FARM, SENSOR_Z);
  if (k % 2 === 0) {
    const a = ((turn + 70) * Math.PI) / 180;
    list.push(at('vaporator-cap', x + Math.cos(a) * 1.9, y - Math.sin(a) * 1.9, { z: FARM }));
  }
});
// The courtyard's cluster, in the middle of the floor in the burning
// cart's light, clear of the curved stair, with room round it on every
// side: a tall and a shorter
// vaporator, the squat unit, domed caps at their feet (cover for the fight).
list.push(
  at('vaporator-tall', 161, 46.5, { z: COURT, angle: 200 }),
  at('vaporator-mid', 164, 44.2, { z: COURT, angle: 240 }),
  at('vaporator-squat', 158.2, 47.6, { z: COURT, angle: 160 }),
);
for (const [x, y] of [[159.6, 44.6], [162.6, 48.8], [165.6, 46.4], [156.6, 45.8]]) list.push(at('vaporator-cap', x, y, { z: COURT }));
// The lane's barricades.
list.push(at('barricade-worn', 137, 16.5, { angle: 100, z: FARM }), at('barricade-worn', 139.5, 13.5, { angle: 10, z: FARM }));

town.finish(EVENING);
// The dome's stairwell runs along the low suns, so its floor isn't as deep in
// shade as the walls' make it (and the wall over the door takes its light).
p.rect(143, 17, 152, 23, (_, __, c) => (c.light < 152 ? { ...c, light: 152 } : c));
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
  at('stormtrooper', 56.5, 47.5, { angle: 180, skill: HARD }),
  at('power-cell', 47.5, 56.5),
  // 3. The reservoir: troopers along the walkway and in the pool, in the
  // light of their lamps.
  at('stormtrooper', 72.5, 76.5, { angle: 180 }),
  at('stormtrooper', 94.5, 76.5, { angle: 180 }),
  at('stormtrooper', 84.5, 83.5, { angle: 180, skill: NOT_EASIEST }),
  at('stormtrooper', 104.5, 76.5, { angle: 180, skill: HARD }),
  at('med-kit', 46.5, 76.5, { skill: EASY }),
  at('energy-pack', 106.5, 84.5),
  // 4. The workshop pit, the rim above it, and the workshop.
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
  // 5. The work yard: troopers, the probe droid, the officer with the key.
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
  // 6. The lane.
  at('sandtrooper', 140.5, 15, { angle: 180, z: FARM }),
  at('sandtrooper', 142.5, 21.5, { angle: 180, z: FARM }),
  at('sandtrooper', 134.5, 14.5, { angle: 180, z: FARM, skill: NORMAL_UP }),
  at('med-kit', 127.5, 22.5, { z: FARM, skill: EASY }),
  // 7. The house: its ground and the courtyard's rim, the dome's stair, the
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
  // 8a. The caves: troopers who came down from the garage pit, searching
  // with lamps: two in the cavern, one or two on the climb.
  at('stormtrooper', 143.5, 120.5, { angle: 90 }),
  at('stormtrooper', 138.5, 116.5, { angle: 90, skill: NOT_EASIEST }),
  at('stormtrooper', 160.5, 132.5, { angle: 180, skill: HARD }),
  at('stormtrooper', 190.5, 104.5, { angle: 270 }),
  at('stormtrooper', 189.5, 96.5, { angle: 270, skill: NORMAL_UP }),
  at('med-kit', 141.5, 108.5, { skill: EASY }),
  at('power-cell', 180.5, 131.5),
  // 9. The garage: a stock of ammo before the wave.
  at('power-cell', 176.2, 61.2, { z: PIT + 0.25 }), at('power-cell', 177, 60.6, { z: PIT + 0.25 }), at('med-kit', 183.5, 69, { z: PIT + 0.25 }),
  at('energy-pack', 183.8, 61, { z: PIT + 0.25, skill: EASY }),
  at('power-cell', 204.5, 77, { z: HANGAR.floor }), // down on the hangar's floor
  // The trench's gate.
  at('sandtrooper', 180, 108.5, { angle: 90, skill: NORMAL_UP }),
  // 11. The wash: rocks for cover; troopers lying in wait down its long
  // stretch (they don't come for the shooting on the pad).
  at('med-kit', 171.5, 150.5, { skill: [1, 2, 3] }),
  at('energy-pack', 165.5, 154.5),
  at('stormtrooper', 140.5, 158.5, { angle: 0, ambush: true, skill: NOT_EASIEST }),
  at('stormtrooper', 133.5, 163.5, { angle: 30, ambush: true, skill: HARD }),
  // 12. The flat: troopers between the wash and the Crow, firing on it.
  at('stormtrooper', 114.5, 182.5, { angle: 60, ambush: true }),
  at('stormtrooper', 100.5, 177.5, { angle: 45, ambush: true }),
  at('stormtrooper', 121.5, 189.5, { angle: 90, ambush: true, skill: NORMAL_UP }),
  at('stormtrooper', 94.5, 185.5, { angle: 30, ambush: true, skill: HARD }),
);
list.push(
  at('boulder-large', 151, 157, { angle: 70 }), at('boulder-small', 159.5, 162.5, { angle: 190 }),
  at('boulder-small', 138, 163, { angle: 20 }), at('boulder-large', 117.5, 186.5, { angle: 300 }),
  at('boulder-small', 101, 181, { angle: 120 }), at('boulder-large', 125.5, 180, { angle: 210 }),
);

// Where the wave comes from when Kyle calls the Crow: the pockets beyond
// the pad's west and east cuts, and up the wash, round its bend.
for (const [x, y] of [[137, 115], [138, 121], [200, 118], [156, 158], [148, 160]]) p.set(x, y, { ...p.get(x, y), tag: 'wave' });

export default defineLevel({
  id: 'm2',
  mapLabel: 'M2',
  name: 'THE HOMESTEAD',
  music: 'garrison',
  // Evening: the suns setting in the west-south-west, the sky going round
  // once so the glow is there only, and a dusky amber haze.
  sky: 'sky-dusk',
  skyWrap: 1,
  // In a full gust the haze closes in to 7 m, and the sky's foot with it.
  haze: { color: [176, 120, 88], half: 48, gust: 14 },
  // Blowing sand on a west-south-west wind (1.5 m/s, gusting to 2.5 times
  // that every 6 to 14 seconds): grains streaking past, faint sheets low
  // across the view and ribbons over the ground, thicker in a gust. None
  // made in the pits, the trench or the lee of a wall (more than 1.5 m
  // standing over the floor within 3 m upwind), though what blows over a
  // pit's mouth keeps going.
  weather: [
    { type: 'sand-grain', count: 360, calm: 0.35, range: 8, z: [0.1, 2.2], drift: [0.6, 0.2], shelter: 3, wind: [2.8, -1, 0], gusts: { every: [6, 14], hold: [2, 5], rise: 1.5, fall: 2, strength: 2.5 } },
    { type: 'sand-veil', count: 30, calm: 0.2, range: 10, z: [0.2, 1.4], drift: [0.3, 0.05], shelter: 3 },
    { type: 'sand-snake', count: 200, calm: 0.3, range: 8, z: [0.02, 0.12], drift: [0.4, 0], shelter: 3 },
  ],
  lights,
  decals,
  par: 600,
  // The story, in stand-ins until the pieces exist (docs/mission2.md): Jan
  // names the house; the rubble sends Kyle up; the house shows over the
  // yard's wall; the gate wants the officer's key; the recordings start the
  // ending and open the garage; at the trench's gate Kyle calls the Crow,
  // Jan won't land on the pad and the wave comes; on the flat, Jan sees
  // him; under the Crow, the level ends.
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
        { action: 'message', text: "A PANEL GRINDS OPEN IN THE SOUTH WALL. KYLE: RUSK'S WAY OUT." },
        { action: 'openDoors', tag: 'bolthole' },
        { action: 'openDoors', tag: 'garage' },
      ],
    },
    {
      on: 'enter',
      tag: 'trench-head',
      if: 'recordings',
      do: [
        { action: 'message', text: "KYLE: JAN, I'VE GOT IT. COME GET ME." },
        { action: 'message', text: "JAN: NOT ON THAT PAD, THERE'S A SQUAD COMING OVER THE DRIFTS." },
        { action: 'message', text: "JAN: I'LL SET DOWN WHERE THE DRY WASH COMES OUT OF THE ROCKS, SOUTH OF YOU." },
        { action: 'setFlag', flag: 'called' },
        { action: 'spawn', thing: 'stormtrooper', tag: 'wave', fog: false },
      ],
    },
    { on: 'enter', tag: 'tremor', if: 'recordings', do: [{ action: 'message', text: 'THE GROUND SHAKES. SAND POURS FROM THE CRACKS OVERHEAD.' }] },
    { on: 'enter', tag: 'flat', if: 'called', do: [{ action: 'message', text: "JAN: THERE YOU ARE. THEY'RE SHOOTING AT MY SHIP, HURRY!" }] },
    { on: 'enter', tag: 'pickup', if: 'called', do: [{ action: 'message', text: 'JAN: GET ABOARD!' }, { action: 'exit' }] },
  ],
  ...p.build(),
  things: [],
  list,
});
