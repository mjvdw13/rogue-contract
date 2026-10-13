import { defineLevel } from '../../engine/defs.js';
import { Painter } from './lib/painter.js';

// MISSION 1: THE CANYON GARRISON. The layout, route and numbers are in
// docs/mission1.md (area numbers below match its table). Painted in code on
// the fine grid (1 tile = 0.5 m; the player is 1.7 tall and 1 wide).

const W = 128;
const H = 100;
const SKY = 24;

// ---- Cells
const rock = { wall: 'sandstone' };
const panel = { wall: 'imp-panel' };
const darkPanel = { wall: 'imp-panel-dark' };
const lights = { wall: 'imp-lights' };
const computer = { wall: 'imp-computer' };
// See-through fences on tile edges.
const railing = { tex: 'imp-railing', height: 0.75 };
const bars = { tex: 'imp-bars' };
const cage = { tex: 'imp-cage' };

/** Open desert under the night sky, in moonlight. */
const sand = (floorZ = 0, extra = {}) => ({ floor: 'desert-sand', ceiling: 'sky', floorZ, ceilZ: SKY, light: 144, side: 'sandstone', ...extra });
/** An Imperial room. */
const room = (floorZ, ceilZ, extra = {}) => ({
  floor: 'imp-floor', ceiling: 'imp-ceiling', floorZ, ceilZ, light: 160, side: 'imp-panel-dark', upper: 'imp-panel', ...extra,
});
/**
 * A rising door: a doorway through a wall 1 tile thick, its panel in the
 * middle, lit jambs half a tile deep on its sides and a lit lintel over the
 * opening. The door art is one 2x2 door (Dark Forces' IDDOOR1), so doorways
 * are 2 wide and 2 tall.
 */
const door = (floorZ, extra = {}) => ({
  door: 'imp-door', jamb: 'imp-jamb', style: 'rise', floor: 'imp-floor', ceiling: 'imp-ceiling', upper: 'imp-lintel',
  floorZ, ceilZ: floorZ + 2, light: 160, ...extra,
});
/** The wall above a door on a side where the room is too tall for the lit lintel (it would repeat up the wall). */
const tallSide = { upper: 'imp-panel' };
/** A lift platform between `stops`. */
const lift = (stops, ceilZ, extra = {}) => ({
  floor: 'lift-floor', ceiling: 'imp-ceiling', floorZ: stops[0], ceilZ, light: 160, side: 'imp-stripe', lift: { stops, wait: 3 }, ...extra,
});

const p = new Painter(W, H, rock);
/** Light sources (lamps and light strips), added area by area. */
const lamps = [];
/** Decals (signs, the crest, hazard stripes, vents) on wall faces, area by area. */
const decals = [];

// ---------------------------------------------------------------- the canyon
// 1. Start bowl, with a secret alcove behind a rock door in its west wall.
p.rect(6, 76, 30, 96, sand(0, { light: 152 }));
p.chamfer(6, 76, 30, 96, 4, rock, ['SW', 'SE', 'NW']);
p.rect(2, 80, 5, 84, sand(0, { secret: true, light: 112 }));
p.rect(5, 80, 6, 84, { door: 'sandstone', secret: true, floor: 'desert-sand', ceiling: 'sky', floorZ: 0, ceilZ: 8, light: 112 });

// 2. The gorge, winding north-east: narrow, so the moon barely reaches in.
p.rect(14, 60, 34, 76, sand(0, { light: 136 }));
p.chamfer(14, 60, 34, 76, 5, rock, ['NW', 'SE']);
p.rect(30, 70, 38, 76, sand(0, { light: 136 }));
p.chamfer(30, 70, 38, 76, 3, rock, ['NE', 'SE']);
// The rock arch: a natural stone bridge across the gorge, 2 m up (a slab:
// you walk under it), moonlit on top, in its own shadow underneath. A sniper
// on top watches the way in from the start bowl; there's no way up.
const arch = { bottom: 4, top: 5, floor: 'desert-sand', ceiling: 'sandstone-dark', side: 'sandstone', light: 112 };
p.rect(14, 64, 34, 67, (x, y, old) => (old.wall ? old : { ...old, light: 152, slab: arch }));

// 3. The bowl under the garrison: a rock spire in the middle, sniper ledges.
p.rect(20, 44, 62, 60, sand());
p.chamfer(20, 44, 62, 60, 4, rock, ['SE']);
p.pillar(35, 49, 41, 55, 2, rock, sand());
p.light(35, 46, 41, 49, 128); // the spire's moon shadow
// Ledge A (west, 2.5 m up): no way up; a sniper's post.
p.rect(20, 44, 24, 58, sand(5, { light: 136 }));
// Ledge B (east, 1.5 m up), with rock steps down its south end. A secret.
p.rect(57, 44, 62, 54, sand(3, { secret: true, light: 136 }));
p.stairs(57, 54, 62, 59, 'N', 0.5, 0.5, (z) => sand(z));

// The strip along the garrison's face, in its shadow.
p.rect(26, 40, 70, 44, sand(0, { light: 120 }));

// ---------------------------------------------------------------- the garrison
// Everything inside is Imperial wall until carved out.
p.rect(24, 2, 112, 40, panel);
p.rect(70, 24, 112, 66, panel);

// 4. The face: a locked main gate (one 4x4 blast door) between light strips.
p.rect(46, 36, 50, 40, door(0, { door: 'imp-gate', jamb: 'imp-gate-jamb', ceilZ: 4, lock: 'remote', tag: 'maingate', ...tallSide }));
p.rect(40, 39, 44, 40, lights);
p.rect(52, 39, 56, 40, lights);
// Floodlights in the strips, throwing pools of light on the sand, and a
// weaker light over the gate between them.
lamps.push({ x: 42, y: 40.3, radius: 6, light: 96 }, { x: 54, y: 40.3, radius: 6, light: 96 }, { x: 48, y: 40.3, radius: 5, light: 40 });
// The Empire's crest over the gate, and hazard stripes along its lintel.
decals.push(
  { x: 48, y: 40, z: 6.1, face: 'S', tex: 'decal-crest', scale: 1.5 },
  { x: 47, y: 40, z: 4.25, face: 'S', tex: 'decal-hazard' },
  { x: 49, y: 40, z: 4.25, face: 'S', tex: 'decal-hazard' },
);

// 5. The crawl vent through the face (crouch: 1.2 clear).
p.rect(32, 26, 34, 40, {
  floor: 'imp-grate', ceiling: 'imp-grate', floorZ: 0.5, ceilZ: 1.7, light: 112, side: 'imp-vent', upper: 'imp-vent',
});
p.light(32, 31, 34, 34, 144); // light falling through a grate halfway

// 6. Maintenance: dim, with a lit panel in the middle, dark corners and a
// broken light flickering in the south-east.
p.rect(26, 14, 42, 26, room(0, 5, { floor: 'imp-grate', light: 128 }));
p.rect(32, 18, 36, 22, room(0, 5, { floor: 'imp-grate', ceiling: 'imp-ceiling-light', light: 192 }));
p.rect(38, 22, 40, 24, room(0, 5, { floor: 'imp-grate', ceiling: 'imp-ceiling-light', light: 176, lightFx: 'flicker', lightMin: 96 }));
p.light(26, 14, 29, 17, 120);
p.light(26, 23, 29, 26, 120);
// Vents high on the north wall.
decals.push({ x: 37.5, y: 14, z: 4.2, face: 'S', tex: 'decal-vent' }, { x: 40.5, y: 14, z: 4.2, face: 'S', tex: 'decal-vent' });
p.chamfer(26, 14, 42, 26, 2, darkPanel, ['NW', 'SW']);
// A storage cage round the crates in the north-west.
p.fence(28, 14, 29, 17, 'W', cage).fence(30, 14, 31, 17, 'E', cage).fence(28, 16, 31, 17, 'S', cage);

// 7. Lift L1: from maintenance (0) up to the barracks (6).
p.rect(42, 16, 46, 20, lift([0, 6], 12));

// 8. The barracks corridor, with light strips along its walls: pools of
// light under the ceiling panels, the strips and the hanging lamps.
p.rect(46, 16, 76, 20, room(6, 10, { light: 144 }));
for (const x of [50, 58, 66]) p.rect(x, 17, x + 2, 19, room(6, 10, { ceiling: 'imp-ceiling-light', light: 208 }));
for (const x of [48, 62, 72]) {
  p.rect(x, 15, x + 2, 16, lights);
  p.rect(x, 20, x + 2, 21, lights);
  lamps.push({ x: x + 1, y: 16.3, radius: 3, light: 48 }, { x: x + 1, y: 19.7, radius: 3, light: 48 });
}
for (const x of [53, 69]) lamps.push({ x: x + 1, y: 18, radius: 4, light: 48 });
// Sector signs on the walls.
decals.push({ x: 56, y: 16, z: 8.4, face: 'S', tex: 'decal-sign' }, { x: 67, y: 20, z: 8.4, face: 'N', tex: 'decal-sign' });

// 9. The bunk room.
p.rect(48, 4, 60, 15, room(6, 10, { light: 128 }));
p.rect(53, 8, 55, 10, room(6, 10, { ceiling: 'imp-ceiling-light', light: 184 }));
p.light(48, 4, 51, 7, 120);
p.light(57, 4, 60, 7, 120);
p.chamfer(48, 4, 60, 15, 2, darkPanel, ['NW', 'NE']);
p.rect(53, 15, 55, 16, door(6));

// 10. The officer's office.
p.rect(62, 4, 72, 15, room(6, 9, { light: 144 }));
p.rect(63, 5, 66, 8, room(6, 9, { ceiling: 'imp-ceiling-light', light: 192 })); // over the desk
p.chamfer(62, 4, 72, 15, 2, darkPanel, ['NE']);
p.rect(65, 15, 67, 16, door(6));
// A barred window from the corridor into the office, over a sill.
p.rect(69, 15, 71, 16, room(7, 8.5, { light: 144, side: 'imp-panel', upper: 'imp-panel' }));
p.fence(69, 15, 71, 16, 'S', bars);

// 11. The red door, and 12. the data vault behind it: dark, walled in computer banks.
p.rect(76, 8, 94, 26, computer);
p.rect(76, 16, 77, 20, room(6, 10, { light: 144 })); // the corridor's end, up to the vault's wall
p.rect(77, 17, 78, 19, door(6, { door: 'imp-door-red', lock: 'red' }));
// The screens' glow pulses along the banks.
p.rect(78, 10, 92, 25, room(6, 9, { light: 112 }));
const screens = { lightFx: 'glow', lightMin: 104 };
p.light(78, 10, 92, 11, 152, screens);
p.light(78, 24, 92, 25, 152, screens);
p.light(78, 11, 79, 24, 152, screens);
p.light(91, 11, 92, 24, 152, screens);
p.chamfer(78, 10, 92, 25, 2, darkPanel);
// The secret niche behind a computer bank.
p.rect(92, 14, 94, 18, { door: 'imp-computer', secret: true, floor: 'imp-floor', ceiling: 'imp-ceiling', floorZ: 6, ceilZ: 9, light: 112 });
p.rect(94, 13, 98, 19, room(6, 9, { light: 120, secret: true }));
// The south door onto the generator catwalk.
// (Above it on both sides: the computer banks, as the generator side is too tall for the lit lintel.)
p.rect(84, 25, 86, 26, door(6, { upper: 'imp-computer' }));

// 13. The generator chamber: a deep shaft round the reactor column, with a
// catwalk ring and two bridges 6 up. The catwalks are grate slabs (two
// storeys), so the shaft floor runs on underneath them, dark, all the way
// round the column and to the walls.
const genFloor = room(-6, 18, { floor: 'imp-grate', light: 128, tag: 'generator' });
const grate = { bottom: 5.5, top: 6, floor: 'imp-grate', ceiling: 'imp-grate', side: 'imp-stripe', light: 120 };
const catwalk = { ...genFloor, light: 152, slab: grate };
p.rect(72, 26, 108, 62, genFloor);
p.rect(72, 26, 108, 29, catwalk);
p.rect(72, 59, 108, 62, catwalk);
p.rect(72, 26, 75, 62, catwalk);
p.rect(105, 26, 108, 62, catwalk);
p.pillar(86, 40, 94, 48, 2, lights, genFloor);
// The column lights the shaft floor round it with a slow pulse.
p.light(84, 38, 96, 50, 200, { lightFx: 'glow', lightMin: 136 });
// Light strips on the chamber walls, lighting the catwalk in front of them,
// and lamps under it lighting the floor below. The overload breaks them.
/** A light strip on the wall over (x0, y0)-(x1, y1), and its two lamps at (lx, ly): one over the catwalk, one under it. */
const strip = (x0, y0, x1, y1, lx, ly) => {
  p.rect(x0, y0, x1, y1, lights);
  lamps.push({ x: lx, y: ly, z: 7, radius: 4, light: 48, tag: 'gen-lamps' }, { x: lx, y: ly, radius: 4, light: 56, tag: 'gen-lamps' });
};
for (const y of [33, 51]) {
  strip(71, y, 72, y + 3, 72.3, y + 1.5);
  strip(108, y, 109, y + 3, 107.7, y + 1.5);
}
for (const x of [96, 102]) strip(x, 25, x + 3, 26, x + 1.5, 26.3);
for (const x of [80, 96]) strip(x, 62, x + 3, 63, x + 1.5, 61.7);
p.rect(88, 29, 92, 40, catwalk);
p.rect(88, 48, 92, 59, catwalk);
// Railings along the catwalk ring's inner edge and both sides of the
// bridges, open where the lifts and bridges join the ring.
p.fence(74, 29, 75, 55, 'E', railing);
p.fence(105, 33, 106, 59, 'W', railing);
p.fence(75, 28, 88, 29, 'S', railing).fence(92, 28, 101, 29, 'S', railing);
p.fence(79, 59, 88, 60, 'N', railing).fence(92, 59, 105, 60, 'N', railing);
for (const [y0, y1] of [[29, 40], [48, 59]]) p.fence(88, y0, 89, y1, 'W', railing).fence(91, y0, 92, y1, 'E', railing);
// Lifts L2 (south-west) and L2b (north-east) run between the floor and the ring.
p.rect(75, 55, 79, 59, lift([-6, 6], 18, { tag: 'generator' }));
p.rect(101, 29, 105, 33, lift([-6, 6], 18, { tag: 'generator' }));
// The overload switch on the column's east face, at the bottom, under
// hazard stripes.
decals.push({ x: 94, y: 44, z: -3.6, face: 'E', tex: 'decal-hazard' });
p.rect(93, 43, 94, 45, {
  wall: 'imp-switch',
  switchTo: 'imp-switch-on',
  use: [
    { action: 'openDoors', tag: 'escape' },
    { action: 'setLight', tag: 'generator', light: 136, lightFx: 'flicker', lightMin: 72 },
    { action: 'setLight', tag: 'gen-lamps', light: 32, lightFx: 'flicker', lightMin: 0 },
    { action: 'message', text: 'GENERATOR OVERLOADED. THE ESCAPE HATCH IS OPEN.' },
  ],
});

// 14. The escape hatch in the east wall, opened by the overload switch.
p.rect(108, 43, 109, 45, door(6, { lock: 'remote', tag: 'escape', ...tallSide }));

// ---------------------------------------------------------------- the way out
// 15. The gantry: stairs up to 8, out under the sky.
const gantry = (z) => sand(z, { floor: 'imp-grate', side: 'imp-panel-dark', light: 160 });
p.stairs(110, 42, 114, 46, 'E', 6.5, 0.5, gantry);
p.rect(114, 42, 118, 46, gantry(8));
p.rect(109, 42, 110, 46, gantry(6)); // a landing outside the escape hatch

// 16. The chasm (3 tiles), with lift L3 back up if you fall.
p.rect(118, 34, 121, 60, sand(-2, { light: 104 }));
p.rect(118, 56, 121, 60, lift([-2, 8], SKY, { ceiling: 'sky', light: 104 }));

// 17. The landing pad, floodlit. Stepping onto the marked pickup spot (it
// pulses) ends the mission.
p.rect(121, 34, 126, 60, sand(8, { floor: 'imp-floor', side: 'imp-panel-dark', light: 184 }));
p.rect(122, 43, 126, 47, sand(8, { floor: 'lift-floor', side: 'imp-panel-dark', light: 224, lightFx: 'glow', lightMin: 168, exit: true }));

// ---------------------------------------------------------------- the skyline
// The canyon's rock steps back from its floor in ledges (raised rock under
// the sky, out of reach), rising by ring to about 20 with noise, so the rims
// are jagged against the sky. Each ledge's sky ceiling sits just above the
// highest rock behind it, so the view (and sight and bolts) stop at the
// skyline instead of passing over a ridge. Not next to the garrison, which
// keeps a wall of rock round it, nor at the map's edge.
/** Smooth value noise in 0-1 over cells of `size` tiles. */
const noise = (x, y, size, seed) => {
  const h = (i, j) => {
    let v = Math.imul(i * 374761393 + j * 668265263 + seed * 1442695041, 1274126177);
    v = Math.imul(v ^ (v >>> 13), 1103515245);
    return ((v ^ (v >>> 16)) >>> 0) / 4294967296;
  };
  const fx = x / size;
  const fy = y / size;
  const i = Math.floor(fx);
  const j = Math.floor(fy);
  const u = (fx - i) * (fx - i) * (3 - 2 * (fx - i));
  const v = (fy - j) * (fy - j) * (3 - 2 * (fy - j));
  const a = h(i, j) + (h(i + 1, j) - h(i, j)) * u;
  const b = h(i, j + 1) + (h(i + 1, j + 1) - h(i, j + 1)) * u;
  return a + (b - a) * v;
};
const isRock = (c) => c?.wall === 'sandstone' && !c.diagonal;
const isAir = (c) => c && !c.wall && !c.door && c.ceiling === 'sky';
// An angled rock corner whose solid side faces open ground (where one area
// was painted over another's corner) would show its back: it's floor.
for (let y = 1; y < H - 1; y++) {
  for (let x = 1; x < W - 1; x++) {
    const c = p.get(x, y);
    if (c.wall !== 'sandstone' || !c.diagonal) continue;
    const back = [...c.diagonal].map((e) => p.get(x + (e === 'E' ? 1 : e === 'W' ? -1 : 0), y + (e === 'S' ? 1 : e === 'N' ? -1 : 0)));
    if (back.some(isAir)) {
      const { wall, diagonal, ...floor } = c;
      p.set(x, y, floor);
    }
  }
}
const indoorNear = (x, y) => {
  // (Doors keep the walls they slide between.)
  if ([p.get(x + 1, y), p.get(x - 1, y), p.get(x, y + 1), p.get(x, y - 1)].some((n) => n?.door)) return true;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const n = p.get(x + dx, y + dy);
      if (n && ((n.wall && n.wall !== 'sandstone') || (n.door && n.door !== 'sandstone') || (!n.wall && n.ceiling !== 'sky'))) return true;
    }
  }
  return false;
};
const LEDGE_RISE = [0, 8, 12, 16];
const ring = new Map(); // tile -> { d, base, h }
let front = [];
// (From the canyon's open tiles, and its angled rock corners, which have floor on one side.)
for (let y = 1; y < H - 1; y++) {
  for (let x = 1; x < W - 1; x++) {
    const c = p.get(x, y);
    if (isAir(c) || (c.wall === 'sandstone' && c.diagonal)) front.push([x, y, c.floorZ ?? 0]);
  }
}
for (let d = 1; d < LEDGE_RISE.length; d++) {
  const next = [];
  for (const [x, y, base] of front) {
    for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
      const k = ny * W + nx;
      if (nx < 1 || ny < 1 || nx >= W - 1 || ny >= H - 1 || ring.has(k) || !isRock(p.get(nx, ny)) || indoorNear(nx, ny)) continue;
      const h = Math.min(SKY - 2, base + LEDGE_RISE[d] + noise(nx, ny, 3, 7) * 4 + noise(nx, ny, 9, 8) * 2);
      ring.set(k, { x: nx, y: ny, d, base, h, top: h });
      next.push([nx, ny, base]);
    }
  }
  front = next;
}
// Each ledge's ceiling: the highest rock from it outward.
const ledges = [...ring.values()].sort((a, b) => b.d - a.d);
for (const t of ledges) {
  for (const [nx, ny] of [[t.x + 1, t.y], [t.x - 1, t.y], [t.x, t.y + 1], [t.x, t.y - 1]]) {
    const n = ring.get(ny * W + nx);
    if (n && n.d > t.d) t.top = Math.max(t.top, n.top);
  }
}
for (const t of ledges) {
  p.set(t.x, t.y, {
    floor: 'desert-gravel', ceiling: 'sky', floorZ: Math.round(t.h * 4) / 4, ceilZ: Math.round(t.top * 4) / 4 + 0.25, side: 'sandstone', light: 144,
  });
}
// Angled rock corners stop at the skyline beside them, not at the sky.
for (let y = 1; y < H - 1; y++) {
  for (let x = 1; x < W - 1; x++) {
    const c = p.get(x, y);
    if (c.wall !== 'sandstone' || !c.diagonal) continue;
    let top = -Infinity;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) top = Math.max(top, ring.get((y + dy) * W + x + dx)?.top ?? -Infinity);
    if (top > -Infinity) p.set(x, y, { ...c, ceilZ: Math.round(top * 4) / 4 + 0.25 });
  }
}
// Rock strata by height: a dark base, pale up high. Gravel in channels
// across the sand.
const strata = [{ to: 2.5, tex: 'sandstone-dark' }, { from: 14, tex: 'sandstone-pale' }];
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const c = p.get(x, y);
    if (c.wall === 'sandstone' || (!c.wall && c.side === 'sandstone')) p.set(x, y, { ...c, bands: strata });
    if (!c.wall && c.floor === 'desert-sand' && Math.abs(noise(x, y, 6, 21) - 0.5) < 0.045) p.set(x, y, { ...p.get(x, y), floor: 'desert-gravel' });
  }
}

// ---------------------------------------------------------------- the cliff
// The garrison is dug into the cliff: outside, its walls stand 4 m above the
// ground in front of them with the rock face above (wall bands), and so do
// the faces over its openings (the gate's lintel, above the vent mouth).
// Not where the rock would show indoors (a room as tall as where it starts).
const IMPERIAL = new Set(['imp-panel', 'imp-panel-dark', 'imp-lights']);
const outside = (c) => c && !c.wall && !c.door && c.ceiling === 'sky';
const cliff = [];
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const c = p.get(x, y);
    if (c.wall ? !IMPERIAL.has(c.wall) : outside(c)) continue;
    const around = [p.get(x + 1, y), p.get(x - 1, y), p.get(x, y + 1), p.get(x, y - 1)].filter((n) => n && !n.wall);
    const out = around.filter(outside);
    if (!out.length) continue;
    const from = Math.max(...out.map((n) => n.floorZ ?? 0)) + 8;
    if (around.some((n) => !outside(n) && (n.ceilZ ?? 0) > from)) continue;
    cliff.push([x, y, { ...c, bands: [{ from, tex: 'sandstone' }] }]);
  }
}
for (const [x, y, c] of cliff) p.set(x, y, c);

// ---------------------------------------------------------------- things
const at = (type, x, y, extra = {}) => ({ type, x, y, ...extra });
// Skills (docs/mission1.md has the table): 1-2 thin out the fights and add
// med kits; 4-5 add a trooper or two to most areas.
const EASY = [1, 2];
const NOT_EASIEST = [2, 3, 4, 5];
const NORMAL_UP = [3, 4, 5];
const HARD = [4, 5];
const list = [
  at('player', 14.5, 90.5, { angle: 90 }),
  // The canyon: snipers on both ledges and the rock arch, two gate guards, a
  // probe droid round the spire, and a band of Jawas scavenging in the gorge.
  at('stormtrooper', 24.5, 65.5, { angle: 270, z: 5, skill: NOT_EASIEST }), // sniper, on the arch
  at('stormtrooper', 22, 50.5, { angle: 0 }), // sniper, ledge A
  at('stormtrooper', 59.5, 48.5, { angle: 180 }), // sniper, ledge B
  at('sandtrooper', 40.5, 42, { angle: 270 }),
  at('sandtrooper', 56.5, 42, { angle: 270, skill: NOT_EASIEST }),
  at('sandtrooper', 30.5, 52.5, { angle: 270, skill: HARD }), // under ledge A
  at('probe-droid', 44.5, 56.5, { skill: NORMAL_UP }),
  at('jawa', 24, 76, { angle: 270 }), at('jawa', 30, 72, { angle: 225 }),
  at('jawa', 28, 62, { angle: 270, skill: NORMAL_UP }),
  at('jawa', 18.5, 66.5, { angle: 315, skill: HARD }),
  at('power-cell', 24.5, 68.5),
  at('med-kit', 29.5, 42.5, { skill: [1, 2, 3] }), // after the gate guards, by the vent
  at('energy-pack', 59.5, 45.5), // secret: ledge B
  at('shield-unit', 3.5, 82), // secret: the rock alcove
  // The vent: a power cell where light falls through the grate.
  at('power-cell', 33, 32.5),
  // Maintenance: an ambush by the lift (two on the hard skills).
  at('stormtrooper', 36.5, 16.5, { angle: 270, ambush: true }),
  at('stormtrooper', 27.5, 20.5, { angle: 0, ambush: true, skill: HARD }),
  at('supply-crate', 28.5, 16), at('supply-crate', 30, 16),
  at('console', 39.5, 15.5),
  at('terminal', 34, 14.6, { angle: 270 }), at('terminal', 35.4, 14.6, { angle: 270 }),
  at('energy-pack', 28.5, 24.5),
  at('power-cell', 40.5, 24.5),
  // The barracks: the officer carries the red keycard.
  at('stormtrooper', 68.5, 18, { angle: 180 }),
  at('stormtrooper', 74.5, 18, { angle: 180, skill: NORMAL_UP }), // by the red door
  at('ceiling-lamp', 54, 18), at('ceiling-lamp', 70, 18),
  at('stormtrooper', 51.5, 7.5, { angle: 270 }),
  at('stormtrooper', 57.5, 10.5, { angle: 270, skill: NOT_EASIEST }),
  at('stormtrooper', 54.5, 6.5, { angle: 270, skill: HARD }),
  at('supply-crate', 50.5, 11.5), at('supply-crate', 56, 12),
  at('med-kit', 58.5, 6),
  at('officer', 66.5, 8.5, { angle: 270, drops: ['keycard-red'] }),
  at('med-kit', 70.5, 6, { skill: EASY }),
  at('console', 63.5, 6),
  // The vault: guards against the far computer banks, lit by the screens'
  // glow, facing the red door.
  at('stormtrooper', 91.4, 14.5, { angle: 180 }),
  at('stormtrooper', 91.4, 20.5, { angle: 180, skill: NORMAL_UP }),
  at('officer', 83.5, 22.5, { angle: 90, skill: HARD }),
  at('terminal', 85, 16.4, { angle: 90 }), at('terminal', 85, 17.6, { angle: 270 }),
  at('energy-pack', 85, 13.5),
  at('power-cell', 80.5, 21.5), at('power-cell', 89.5, 21.5),
  at('shield-unit', 96, 16), // secret: the niche
  // The generator: containment rings turning round the column above the
  // catwalk, and coolant tanks on the shaft floor. Things on the catwalks
  // stand on them (z 6); the rest are on the shaft floor, under them.
  at('reactor-ring', 90, 44, { z: 9, angle: 0 }), at('reactor-ring', 90, 44, { z: 13, angle: 45 }),
  at('coolant-tank', 78.5, 32.5), at('coolant-tank', 78.5, 36),
  at('coolant-tank', 101.5, 55.5), at('coolant-tank', 101.5, 52),
  at('probe-droid', 90, 34.5, { z: 6.9 }), // over the north bridge
  at('probe-droid', 80.5, 40.5, { skill: [5] }), // down in the west half
  at('stormtrooper', 80.5, 27.5, { angle: 270, z: 6 }),
  at('stormtrooper', 106.5, 50.5, { angle: 180, z: 6, skill: NOT_EASIEST }),
  at('stormtrooper', 96.5, 60.5, { angle: 90, z: 6, skill: HARD }),
  at('stormtrooper', 80.5, 48.5, { angle: 0 }),
  at('fuel-barrel', 98.5, 44.5), at('fuel-barrel', 99.5, 46.5),
  at('med-kit', 97.5, 56.5),
  at('energy-pack', 73.5, 40.5, { z: 6 }),
  at('power-cell', 73.5, 27.5), // in the dark under the north-west corner of the ring
  // The gantry: a med kit before the last fight.
  at('med-kit', 115.5, 44, { skill: [1, 2, 3] }),
  // The landing pad, with the pickup shuttle north of the marked spot.
  at('shuttle', 123.5, 38.5, { angle: 270 }),
  at('stormtrooper', 123.5, 49.5, { angle: 180 }),
  at('sandtrooper', 123.5, 54.5, { angle: 180, skill: NOT_EASIEST }),
  at('stormtrooper', 125, 52.5, { angle: 180, skill: HARD }),
];

export default defineLevel({
  id: 'm1',
  mapLabel: 'M1',
  name: 'THE CANYON GARRISON',
  music: 'garrison',
  sky: 'sky-night',
  // Outdoors, the canyon fades into the night's purple haze (the colour of
  // the sky low down), halfway at 20 m.
  haze: { color: [32, 24, 64], half: 40 },
  par: 300,
  ...p.build(),
  lights: lamps,
  decals,
  things: [],
  list,
});
