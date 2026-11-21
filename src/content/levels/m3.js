import { defineLevel } from '../../engine/defs.js';
import { Painter } from './lib/painter.js';
import { valueNoise } from './lib/noise.js';
import { canyonBackdrop } from './lib/backdrop.js';

// MISSION 3: THE CANYON GARRISON. The layout, route and numbers are in
// docs/mission3.md (area numbers below match its table). Painted in code on
// the fine grid (1 tile = 0.5 m; the player is 1.7 tall and 1 wide). The
// first map's areas (the gorge, the bowl, the garrison) are where they were,
// moved 88 east and 24 south; the canyon before them is new.

const W = 240;
const H = 176;
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
/** A blast gate: one 4x4 door (the main gate's, the test bay's). */
const gate = (floorZ, extra = {}) => door(floorZ, { door: 'imp-gate', jamb: 'imp-gate-jamb', ceilZ: floorZ + 4, ...extra });
/** The wall above a door on a side where the room is too tall for the lit lintel (it would repeat up the wall). */
const tallSide = { upper: 'imp-panel' };
/** A lift platform between `stops`. */
const lift = (stops, ceilZ, extra = {}) => ({
  floor: 'lift-floor', ceiling: 'imp-ceiling', floorZ: stops[0], ceilZ, light: 160, side: 'imp-stripe', lift: { stops, wait: 3 }, ...extra,
});

const p = new Painter(W, H, rock);
/** Ropes, cables and cloth (world/hangings.js): the banners and the power line. */
const hangings = [];
/** Light sources (lamps and light strips), added area by area. */
const lamps = [];
/** Decals (signs, the crest, hazard stripes, vents) on wall faces, area by area. */
const decals = [];
/** Tiles carved by `carve()`, whose stepped rock edges are cut to 45 degrees at the end. */
const carved = new Set();

/**
 * Carve a winding canyon along a line of points `[x, y, r]`: every rock tile
 * within `r` (eased between points) of the line becomes `cell(z)`, its floor
 * running from `z0` at the first point to `z1` at the last by the distance
 * along the line, in steps of `step` (rock steps; 0 for a smooth slope).
 */
function carve(points, cell, { z0 = 0, z1 = z0, step = 0.5 } = {}) {
  const lens = [0];
  for (let i = 1; i < points.length; i++) lens.push(lens[i - 1] + Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]));
  const total = lens[lens.length - 1] || 1;
  const best = new Map(); // tile -> [distance from the line, its share of the way along]
  for (let i = 1; i < points.length; i++) {
    const [ax, ay, ar] = points[i - 1];
    const [bx, by, br] = points[i];
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy || 1;
    const r = Math.max(ar, br);
    for (let y = Math.floor(Math.min(ay, by) - r); y <= Math.ceil(Math.max(ay, by) + r); y++) {
      for (let x = Math.floor(Math.min(ax, bx) - r); x <= Math.ceil(Math.max(ax, bx) + r); x++) {
        const t = Math.max(0, Math.min(1, ((x + 0.5 - ax) * dx + (y + 0.5 - ay) * dy) / len2));
        const d = Math.hypot(x + 0.5 - ax - dx * t, y + 0.5 - ay - dy * t);
        if (d > ar + (br - ar) * t) continue;
        const k = y * W + x;
        const along = (lens[i - 1] + t * (lens[i] - lens[i - 1])) / total;
        if (!best.has(k) || best.get(k)[0] > d) best.set(k, [d, along]);
      }
    }
  }
  for (const [k, [, along]] of best) {
    const x = k % W;
    const y = (k / W) | 0;
    const old = p.get(x, y);
    if (!old || !(old.wall === 'sandstone' && !old.diagonal)) continue;
    let z = z0 + (z1 - z0) * along;
    if (step) z = z0 < z1 ? Math.min(z1, Math.floor((z - z0) / step) * step + z0) : Math.max(z1, z0 - Math.floor((z0 - z) / step) * step);
    p.set(x, y, cell(z));
    carved.add(k);
  }
}

// ---------------------------------------------------------------- the canyon, before the garrison
// Canyon country, explored rather than crossed: a slot, a ledge over a
// gulch full of Jawas, their scrapyard, a cave, the burned camp, a climb
// and a high ledge to the arch. No Imperial building before the garrison;
// only their beacons, set in the rock along the way (things below).

/** Under a rock overhang or a chockstone wedged across a slot: a slab of rock you walk under. */
const chock = (bottom) => ({ bottom, top: bottom + 1.5, floor: 'desert-gravel', ceiling: 'sandstone-dark', side: 'sandstone', light: 112 });
/** A cave: gravel underfoot, rock overhead `head` above the floor, dark. */
const cave = (head = 4) => (z) => ({ floor: 'desert-gravel', ceiling: 'sandstone-dark', floorZ: z, ceilZ: z + head, light: 104, side: 'sandstone', upper: 'sandstone' });

// 1. The hollow where the Crow sets Kyle down, facing west into the rock.
carve([[216, 128, 6], [204, 126, 8], [194, 126, 4]], (z) => sand(z), { z0: -6 });

// 2. The slot: a crack 3 wide winding west, rising a little, two
// chockstones wedged across it overhead.
carve([[194, 126, 1.8], [184, 123, 1.6], [177, 128, 1.6], [172, 134, 1.6], [166, 139, 1.8]], (z) => sand(z, { light: 124 }), { z0: -6, z1: -4 });
for (const [x, y] of [[184, 123], [172, 134]]) p.rect(x - 2, y - 2, x + 3, y + 3, (x1, y1, old) => (!old.wall && old.ceiling === 'sky' && old.floorZ <= -4 ? { ...old, light: 104, slab: chock(old.floorZ + 3.5) } : old));

// 3. The Jawa gulch: a ledge along its north wall, 3 m over its floor,
// with a gap to jump; the Jawas below and on the far side.
carve([[166, 140, 1.7], [152, 142, 1.6], [136, 141, 1.6], [126, 139, 1.7]], (z) => sand(z, { light: 136 }), { z0: -4 });
carve([[166, 150, 6], [150, 151, 8], [134, 150, 7], [122, 148, 5]], (z) => sand(z, { light: 136 }), { z0: -10 });
// Rock steps down off the ledge's west end to the gulch floor.
carve([[126, 139, 1.6], [120, 140, 1.6], [116, 145, 1.6]], (z) => sand(z, { light: 128 }), { z0: -4.5, z1: -10 });

// 4. The scrapyard at the gulch's west end (things below), and 5. the cave
// out of it: west, a squeeze where the roof comes down (crouch), then up
// north-west to the camp. Moonlight through cracks in its roof.
carve([[116, 150, 1.6], [108, 152, 2], [100, 149, 1.4]], cave(4), { z0: -10, z1: -8 });
carve([[100, 149, 1.4], [96, 146, 1.4]], cave(1.3), { z0: -8 });
carve([[96, 146, 1.6], [92, 140, 2.5], [84, 134, 1.6], [74, 130, 1.8]], cave(4), { z0: -8, z1: -2.5 });
for (const [x, y] of [[108, 152], [92, 140]]) p.pool(x + 0.5, y + 0.5, 3, 144);

// 6. The burned camp: a hollow in the rock open to the sky.
carve([[68, 128, 7], [54, 131, 11], [40, 127, 10], [36, 117, 6]], (z) => sand(z), { z0: -2 });

// 7. The climb out of the camp's north end, and the high ledge east along
// a dry gorge to the notch over the arch.
carve([[36, 113, 1.8], [34, 104, 1.8], [38, 96, 1.8]], (z) => sand(z, { light: 140 }), { z0: -2, z1: 5 });
carve([[38, 96, 1.7], [52, 94, 1.6], [66, 95, 1.6], [80, 93, 1.7], [92, 89.5, 1.6]], (z) => sand(z, { light: 144 }), { z0: 5 });
carve([[45, 114, 3], [44, 108, 3], [52, 101, 4.5], [64, 99, 4.5], [76, 97.5, 4], [86, 95, 2.5]], (z) => sand(z, { light: 120 }), { z0: -2 });
p.rect(92, 88, 102, 91, sand(5, { tag: 'notch' }));

// Blades of rock 1 or 2 tiles thick left standing between two carves (the
// gulch ledge and the gulch floor, the camp and the dry gorge's head)
// become floor, the higher side's: a ledge ends at its own cliff edge, not
// behind a thin wall, and no knife of rock stands 5 m tall in the open.
{
  const open = (x, y) => {
    const c = p.get(x, y);
    return carved.has(y * W + x) && c && !c.wall && !c.door && c.ceiling === 'sky' ? c : null;
  };
  const fill = [];
  for (const k of carved) {
    const x0 = k % W;
    const y0 = (k / W) | 0;
    const a = open(x0, y0);
    if (!a) continue;
    for (const [dx, dy] of [[1, 0], [0, 1]]) {
      for (let t = 1; t <= 2; t++) {
        const run = [];
        for (let i = 1; i <= t; i++) run.push([x0 + dx * i, y0 + dy * i]);
        if (!run.every(([x, y]) => p.get(x, y)?.wall === 'sandstone' && !p.get(x, y).diagonal)) break;
        const b = open(x0 + dx * (t + 1), y0 + dy * (t + 1));
        if (!b) continue;
        const hi = (a.floorZ ?? 0) >= (b.floorZ ?? 0) ? a : b;
        for (const [x, y] of run) fill.push([x, y, hi]);
      }
    }
  }
  for (const [x, y, c] of fill) {
    const old = p.get(x, y);
    if (old.wall || (old.floorZ ?? 0) < (c.floorZ ?? 0)) {
      p.set(x, y, c);
      carved.add(y * W + x);
    }
  }
}
// The gap: the ledge has fallen away for 3 tiles.
p.rect(146, 140, 149, 145, (x, y, old) => (!old.wall && old.floorZ === -4 ? { ...old, floorZ: -10 } : old));

// ---------------------------------------------------------------- the gorge and the bowl (the first map's)
// The old start bowl, now a pocket under the arch, with a secret alcove
// behind a rock door in its west wall.
p.rect(94, 100, 118, 120, sand(0, { light: 152 }));
p.chamfer(94, 100, 118, 120, 4, rock, ['SW', 'SE', 'NW']);
p.rect(90, 104, 93, 108, sand(0, { secret: true, light: 112 }));
p.rect(93, 104, 94, 108, { door: 'sandstone', secret: true, floor: 'desert-sand', ceiling: 'sky', floorZ: 0, ceilZ: 8, light: 112 });

// The gorge, winding north-east: narrow, so the moon barely reaches in.
p.rect(102, 84, 122, 100, sand(0, { light: 136 }));
p.chamfer(102, 84, 122, 100, 5, rock, ['NW', 'SE']);
p.rect(118, 94, 126, 100, sand(0, { light: 136 }));
p.chamfer(118, 94, 126, 100, 3, rock, ['NE', 'SE']);
// The rock arch: a natural stone bridge across the gorge, 2 m up (a slab:
// you walk under it, or over it from the ledge path), moonlit on top, in
// its own shadow underneath.
const arch = { bottom: 4, top: 5, floor: 'desert-sand', ceiling: 'sandstone-dark', side: 'sandstone', light: 112 };
p.rect(102, 88, 122, 91, (x, y, old) => (old.wall ? old : { ...old, light: 152, slab: arch }));

// 9. The bowl under the garrison: a rock mesa in the middle with the comm
// mast on it, sniper ledges.
p.rect(108, 68, 150, 84, sand());
p.chamfer(108, 68, 150, 84, 4, rock, ['SE']);
const mesa = sand(14, { floor: 'desert-gravel', light: 152, scenery: true });
p.rect(124, 73, 128, 79, mesa).rect(123, 74, 129, 78, mesa);
p.light(123, 70, 129, 73, 128); // the mesa's moon shadow
// Ledge A (west, 2.5 m up): no way up; a sniper's post.
p.rect(108, 68, 112, 82, sand(5, { light: 136 }));
// Ledge B (east, 1.5 m up), with rock steps down its south end. A secret.
p.rect(145, 68, 150, 78, sand(3, { secret: true, light: 136 }));
p.stairs(145, 78, 150, 83, 'N', 0.5, 0.5, (z) => sand(z));

// Off the arch's east end, a landing and rock steps down north into the bowl.
p.rect(122, 87, 130, 92, sand(4.5));
p.stairs(126, 79, 130, 87, 'S', 0.5, 0.5, (z) => sand(z));

// The strip along the garrison's face, in its shadow.
p.rect(114, 64, 158, 68, sand(0, { light: 120 }));
// Floodlight towers on the bowl's north corners (things below) light it
// from above the strip: each throws a pool of light out into the bowl.
lamps.push({ x: 122.5, y: 72.5, z: 3, radius: 8, light: 64 }, { x: 140.5, y: 72, z: 3, radius: 8, light: 64 });
// A sensor mast on ledge B (things below), its dish turning, a beacon
// blinking beside it; the comm mast's beacons on the mesa.
lamps.push({ x: 149, y: 76, z: 11.6, radius: 4, light: 56, fx: 'blink' });
lamps.push({ x: 126, y: 76, z: 27.5, radius: 6, light: 48, fx: 'blink' });

// Over the bowl and its strip, the sky starts higher (40, not 24),
// so the mast (34 at its tip) is drawn whole: things in a tile are cut off
// at its ceiling. The garrison's face is drawn up to it too, a taller cliff.
p.rect(108, 60, 151, 87, (x, y, old) => (!old.wall && !old.door && old.ceiling === 'sky' ? { ...old, ceilZ: 40 } : old));

// ---------------------------------------------------------------- the garrison
// Everything inside is Imperial wall until carved out.
p.rect(112, 26, 200, 64, panel);
p.rect(158, 48, 200, 90, panel);

// The face: a locked main gate (one 4x4 blast door) between light strips.
p.rect(134, 60, 138, 64, gate(0, { lock: 'remote', tag: 'maingate', ...tallSide }));
p.rect(128, 63, 132, 64, lights);
p.rect(140, 63, 144, 64, lights);
// Floodlights in the strips, throwing pools of light on the sand, and a
// weaker light over the gate between them.
lamps.push({ x: 130, y: 64.3, radius: 6, light: 96 }, { x: 142, y: 64.3, radius: 6, light: 96 }, { x: 136, y: 64.3, radius: 5, light: 40 });
// The Empire's crest over the gate, and hazard stripes along its lintel.
decals.push(
  { x: 136, y: 64, z: 6.1, face: 'S', tex: 'decal-crest', scale: 1.5 },
  { x: 135, y: 64, z: 4.25, face: 'S', tex: 'decal-hazard' },
  { x: 137, y: 64, z: 4.25, face: 'S', tex: 'decal-hazard' },
);
// Grime down the face, the desert's dust and the rain it gets once a year.
for (const [x, tex] of [[116.5, 'grime-streaks-1'], [123, 'grime-streaks-3'], [132.5, 'grime-streaks-2'], [139.5, 'grime-streaks-2'], [149.5, 'grime-streaks-1'], [155, 'grime-streaks-3']]) {
  decals.push({ x, y: 64, z: 5.6, face: 'S', tex });
}
decals.push({ x: 31, y: 98, z: 5.4, face: 'S', tex: 'grime-streaks-2' }, { x: 39, y: 98, z: 5.4, face: 'S', tex: 'grime-streaks-1' });

// 10. The crawl vent through the face (crouch: 1.2 clear).
p.rect(120, 50, 122, 64, {
  floor: 'imp-grate', ceiling: 'imp-grate', floorZ: 0.5, ceilZ: 1.7, light: 112, side: 'imp-vent', upper: 'imp-vent',
});
p.light(120, 55, 122, 58, 144); // light falling through a grate halfway

// Maintenance: dim, with a lit panel in the middle, dark corners and a
// broken light flickering in the south-east.
p.rect(114, 38, 130, 50, room(0, 5, { floor: 'imp-grate', light: 128 }));
p.rect(120, 42, 124, 46, room(0, 5, { floor: 'imp-grate', ceiling: 'imp-ceiling-light', light: 192 }));
p.rect(126, 46, 128, 48, room(0, 5, { floor: 'imp-grate', ceiling: 'imp-ceiling-light', light: 176, lightFx: 'flicker', lightMin: 96 }));
p.light(114, 38, 117, 41, 120);
p.light(114, 47, 117, 50, 120);
// Vents high on the north wall.
decals.push({ x: 125.5, y: 38, z: 4.2, face: 'S', tex: 'decal-vent' }, { x: 128.5, y: 38, z: 4.2, face: 'S', tex: 'decal-vent' });
p.chamfer(114, 38, 130, 50, 2, darkPanel, ['NW', 'SW']);
// A storage cage round the crates in the north-west.
p.fence(116, 38, 117, 41, 'W', cage).fence(118, 38, 119, 41, 'E', cage).fence(116, 40, 119, 41, 'S', cage);

// Lift L1: from maintenance (0) up to the cut (6).
p.rect(130, 40, 134, 44, lift([0, 6], 12));

// 11. The cut: a tunnel north in raw rock from the top of L1, and the
// excavation it opens into, unfinished. A door east into the mess.
/** A room cut in the rock: sandstone walls and ceiling, a grate floor. */
const cut = (floorZ, ceilZ, extra = {}) => ({
  floor: 'imp-grate', ceiling: 'sandstone-dark', floorZ, ceilZ, light: 120, side: 'sandstone', upper: 'sandstone', ...extra,
});
p.rect(128, 2, 136, 40, rock);
p.rect(110, 2, 136, 22, rock);
p.rect(130, 20, 134, 40, cut(6, 10));
p.rect(112, 4, 134, 20, cut(6, 12, { floor: 'desert-gravel', light: 112 }));
p.chamfer(112, 4, 134, 20, 4, rock, ['NW', 'SW']);
// Work lamps in pools along the tunnel and in the excavation.
for (const [x, y] of [[132, 34], [132, 25], [126, 12], [117, 9]]) p.pool(x, y, 4, 168);

// 12. The mess hall, over the bunk room and the office.
p.rect(134, 4, 162, 28, panel);
p.rect(135, 6, 160, 27, room(6, 10, { light: 152, tag: 'mess' }));
for (const x of [140, 148, 155]) p.rect(x, 12, x + 2, 20, room(6, 10, { ceiling: 'imp-ceiling-light', light: 192 }));
p.chamfer(135, 6, 160, 27, 2, darkPanel, ['NE', 'SE']);
p.rect(141, 27, 143, 28, door(6));
p.rect(134, 14, 135, 16, door(6));

// The barracks corridor, with light strips along its walls: pools of
// light under the ceiling panels, the strips and the hanging lamps.
p.rect(135, 40, 164, 44, room(6, 10, { light: 144 }));
for (const x of [138, 146, 154]) p.rect(x, 41, x + 2, 43, room(6, 10, { ceiling: 'imp-ceiling-light', light: 208 }));
for (const x of [136, 150, 160]) {
  p.rect(x, 39, x + 2, 40, lights);
  p.rect(x, 44, x + 2, 45, lights);
  lamps.push({ x: x + 1, y: 40.3, radius: 3, light: 48 }, { x: x + 1, y: 43.7, radius: 3, light: 48 });
}
for (const x of [141, 157]) lamps.push({ x: x + 1, y: 42, radius: 4, light: 48 });
// Sector signs on the walls.
decals.push({ x: 144, y: 40, z: 8.4, face: 'S', tex: 'decal-sign' }, { x: 155, y: 44, z: 8.4, face: 'N', tex: 'decal-sign' });

// The bunk room.
p.rect(136, 28, 148, 39, room(6, 10, { light: 128 }));
p.rect(141, 32, 143, 34, room(6, 10, { ceiling: 'imp-ceiling-light', light: 184 }));
p.light(136, 28, 139, 31, 120);
p.light(145, 28, 148, 31, 120);
p.chamfer(136, 28, 148, 39, 2, darkPanel, ['NW', 'NE']);
p.rect(141, 39, 143, 40, door(6));

// The officer's office.
p.rect(150, 28, 160, 39, room(6, 9, { light: 144 }));
p.rect(151, 29, 154, 32, room(6, 9, { ceiling: 'imp-ceiling-light', light: 192 })); // over the desk
p.chamfer(150, 28, 160, 39, 2, darkPanel, ['NE']);
p.rect(153, 39, 155, 40, door(6, { lock: 'remote', tag: 'office' }));
// A barred window from the corridor into the office, over a sill.
p.rect(157, 39, 159, 40, room(7, 8.5, { light: 144, side: 'imp-panel', upper: 'imp-panel' }));
p.fence(157, 39, 159, 40, 'S', bars);
// The general's door in the east wall, to his own way out (it never opens
// for Kyle).
p.rect(160, 31, 161, 33, door(6, { lock: 'remote', tag: 'mohc-door', ...tallSide }));
p.rect(161, 30, 164, 34, room(6, 9, { light: 128 }));

// The red door, and the data vault behind it: dark, walled in computer banks.
p.rect(164, 32, 182, 50, computer);
p.rect(164, 40, 165, 44, room(6, 10, { light: 144 })); // the corridor's end, up to the vault's wall
p.rect(165, 41, 166, 43, door(6, { door: 'imp-door-red', lock: 'red' }));
// The screens' glow pulses along the banks.
p.rect(166, 34, 180, 49, room(6, 9, { light: 112 }));
const screens = { lightFx: 'glow', lightMin: 104 };
p.light(166, 34, 180, 35, 152, screens);
p.light(166, 48, 180, 49, 152, screens);
p.light(166, 35, 167, 48, 152, screens);
p.light(179, 35, 180, 48, 152, screens);
p.chamfer(166, 34, 180, 49, 2, darkPanel);
// The secret niche behind a computer bank.
p.rect(180, 38, 182, 42, { door: 'imp-computer', secret: true, floor: 'imp-floor', ceiling: 'imp-ceiling', floorZ: 6, ceilZ: 9, light: 112 });
p.rect(182, 37, 186, 43, room(6, 9, { light: 120, secret: true }));
// 14. Detention, over the vault: its control room, a door north into the
// lane of cells, Rusk's at the far end, and a passage down the back to the
// generator's north catwalk.
p.rect(160, 8, 194, 26, panel);
p.rect(166, 24, 180, 33, room(6, 10, { light: 144 }));
p.chamfer(166, 24, 180, 33, 2, darkPanel, ['NW', 'NE']);
p.rect(172, 33, 174, 34, door(6, { upper: 'imp-computer', lock: 'remote', tag: 'cellblock' }));
p.rect(162, 18, 192, 23, room(6, 10, { light: 128 }));
p.rect(172, 23, 174, 24, door(6));
// Six cells north of the lane, 4 wide, bars on their fronts; Rusk's, the
// last, has a door.
for (let k = 0; k < 6; k++) {
  const x0 = 162 + k * 5;
  if (k < 5) {
    p.rect(x0, 11, x0 + 4, 18, room(6, 10, { light: 112 }));
    p.fence(x0, 17, x0 + 4, 18, 'S', bars);
  } else p.rect(x0, 11, x0 + 4, 17, room(6, 10, { light: 120 }));
}
p.rect(188, 17, 190, 18, door(6));
// Red light over the cells: the only red before the alarm.
for (let k = 0; k < 6; k++) lamps.push({ x: 164 + k * 5, y: 14, z: 9, radius: 3, light: 40 });
p.rect(189, 23, 191, 24, door(6, { lock: 'remote', tag: 'backstairs' }));
p.rect(188, 24, 192, 49, room(6, 10, { light: 136 }));
p.rect(189, 49, 191, 50, door(6, { ...tallSide }));

// The generator chamber: a deep shaft round the reactor column, with a
// catwalk ring and two bridges 6 up. The catwalks are grate slabs (two
// storeys), so the shaft floor runs on underneath them, dark, all the way
// round the column and to the walls.
const genFloor = room(-6, 18, { floor: 'imp-grate', light: 128, tag: 'generator' });
const grate = { bottom: 5.5, top: 6, floor: 'imp-grate', ceiling: 'imp-grate', side: 'imp-stripe', light: 120 };
const catwalk = { ...genFloor, light: 152, slab: grate };
p.rect(160, 50, 196, 86, genFloor);
p.rect(160, 50, 196, 53, catwalk);
p.rect(160, 83, 196, 86, catwalk);
p.rect(160, 50, 163, 86, catwalk);
p.rect(193, 50, 196, 86, catwalk);
// The column in bands: a hazard band at its foot and where the catwalks
// meet it, its lit core between, dark plates up into the dark.
const column = {
  wall: 'imp-lights',
  bands: [{ to: -4.5, tex: 'imp-stripe' }, { from: 5, to: 6.5, tex: 'imp-stripe' }, { from: 15, tex: 'imp-panel-dark' }],
};
p.pillar(174, 64, 182, 72, 2, column, genFloor);
// The column lights the shaft floor round it with a slow pulse.
p.light(172, 62, 184, 74, 200, { lightFx: 'glow', lightMin: 136 });
// Light strips on the chamber walls, lighting the catwalk in front of them,
// and lamps under it lighting the floor below. The overload breaks them.
/** A light strip on the wall over (x0, y0)-(x1, y1), and its two lamps at (lx, ly): one over the catwalk, one under it. */
const strip = (x0, y0, x1, y1, lx, ly) => {
  p.rect(x0, y0, x1, y1, lights);
  lamps.push({ x: lx, y: ly, z: 7, radius: 4, light: 48, tag: 'gen-lamps' }, { x: lx, y: ly, radius: 4, light: 56, tag: 'gen-lamps' });
};
for (const y of [57, 75]) {
  strip(159, y, 160, y + 3, 160.3, y + 1.5);
  strip(196, y, 197, y + 3, 195.7, y + 1.5);
}
for (const x of [168, 182]) strip(x, 49, x + 3, 50, x + 1.5, 50.3);
for (const x of [168, 184]) strip(x, 86, x + 3, 87, x + 1.5, 85.7);
p.rect(176, 53, 180, 64, catwalk);
p.rect(176, 72, 180, 83, catwalk);
// Railings along the catwalk ring's inner edge and both sides of the
// bridges, open where the lifts and bridges join the ring.
p.fence(162, 53, 163, 79, 'E', railing);
p.fence(193, 57, 194, 83, 'W', railing);
p.fence(163, 52, 176, 53, 'S', railing).fence(180, 52, 189, 53, 'S', railing);
p.fence(167, 83, 176, 84, 'N', railing).fence(180, 83, 193, 84, 'N', railing);
for (const [y0, y1] of [[53, 64], [72, 83]]) p.fence(176, y0, 177, y1, 'W', railing).fence(179, y0, 180, y1, 'E', railing);
// Lifts L2 (south-west) and L2b (north-east) run between the floor and the ring.
p.rect(163, 79, 167, 83, lift([-6, 6], 18, { tag: 'generator' }));
p.rect(189, 53, 193, 57, lift([-6, 6], 18, { tag: 'generator' }));
// The overload switch on the column's east face, at the bottom, under
// hazard stripes.
decals.push({ x: 182, y: 68, z: -3.6, face: 'E', tex: 'decal-hazard' });
p.rect(181, 67, 182, 69, {
  wall: 'imp-switch',
  switchTo: 'imp-switch-on',
  use: [
    { action: 'setFlag', flag: 'overload' },
    { action: 'openDoors', tag: 'escape' },
    { action: 'setLight', tag: 'generator', light: 136, lightFx: 'flicker', lightMin: 72 },
    { action: 'setLight', tag: 'gen-lamps', light: 32, lightFx: 'flicker', lightMin: 0 },
    { action: 'setLight', tag: 'testbay', light: 168, lightFx: 'glow', lightMin: 64 },
    { action: 'setLight', tag: 'bay-squad', light: 168, lightFx: 'glow', lightMin: 64 },
    { action: 'sound', id: 'alarm-klaxon' },
    // Bursts of sparks round the column's foot as it goes.
    { action: 'explode', explosion: 'sparks', tag: 'gen-burst', z: 1 },
    { action: 'message', text: "GENERATOR OVERLOADED. JAN: THE WHOLE CLIFF'S LIGHTING UP. GET OUT: THE HATCH EAST, THEN UP TO THE PAD." },
    // Rusk is behind Kyle from here (and aboard at the end).
    { action: 'remove', tag: 'rusk' },
    // The squads sent to the test bay and the pad wait for him there.
    { action: 'spawn', thing: 'stormtrooper', tag: 'bay-squad', wake: false, angle: 180, fog: false },
    { action: 'spawn', thing: 'stormtrooper', tag: 'bay-more', wake: false, angle: 180, fog: false, skill: [3, 4, 5] },
    { action: 'spawn', thing: 'sandtrooper', tag: 'pad-squad', wake: false, angle: 180, fog: false },
    { action: 'spawn', thing: 'sandtrooper-commander', tag: 'pad-more', wake: false, angle: 180, fog: false, skill: [2, 3, 4, 5] },
  ],
});

// The escape hatch in the east wall, opened by the overload switch
// (once, so it stays open: shut, the way out would be sealed).
p.rect(196, 67, 197, 69, door(6, { lock: 'remote', tag: 'escape', stayOpen: true, ...tallSide }));

// ---------------------------------------------------------------- the way out
// 16. The test bay, cut in the rock east of the generator: the prototype's
// cradle in the middle, its blast door south onto the cliff.
p.rect(197, 50, 230, 88, rock);
p.rect(197, 52, 226, 84, cut(6, 20, { floor: 'imp-floor', light: 128, tag: 'testbay' }));
p.chamfer(197, 52, 226, 84, 5, rock, ['NE', 'SE']);
p.pool(211.5, 68, 7, 192, { tag: 'testbay' });
/** Tag single tiles (where a squad appears, where a line is said). */
const tagTiles = (tag, spots) => {
  for (const [x, y] of spots) p.set(x, y, { ...p.get(x, y), tag });
};
tagTiles('bay-squad', [[216, 60], [219, 72], [214, 80]]);
tagTiles('bay-more', [[204, 58], [222, 66]]);
p.rect(209, 84, 213, 86, gate(6, { lock: 'remote', tag: 'escape', stayOpen: true, ...tallSide }));

// 17. The cliff gantry: grate on the cliff face, down from the blast door
// and up in a flight to 10, railings on the drop. Below, a bay of the wash.
const gantry = (z, extra = {}) => sand(z, { floor: 'imp-grate', side: 'imp-panel-dark', light: 160, ...extra });
carve([[206, 108, 6], [204, 120, 8]], (z) => sand(z, { light: 128 }), { z0: -6 });
p.rect(207, 86, 215, 92, gantry(6, { tag: 'gantry' }));
p.stairs(207, 92, 215, 100, 'S', 6.5, 0.5, gantry);
p.rect(207, 100, 215, 104, gantry(10));
p.fence(207, 92, 208, 104, 'W', railing).fence(207, 103, 215, 104, 'S', railing);
lamps.push({ x: 211, y: 86.3, z: 5, radius: 6, light: 72 });

// 17a. The chasm (3 tiles) between the gantry and the pad, with lift L3
// back up if you fall.
p.rect(215, 86, 218, 116, sand(-6, { light: 104 }));
p.rect(215, 110, 218, 116, lift([-6, 10], SKY, { ceiling: 'sky', light: 104 }));

// 18. The landing pad on its cliff over the wash, floodlit, a railing on
// its south edge. Stepping onto the marked pickup spot (it pulses) ends
// the mission.
const pad = (extra = {}) => sand(10, { floor: 'imp-floor', side: 'imp-panel-dark', light: 184, ...extra });
p.rect(218, 86, 236, 124, pad());
p.chamfer(218, 86, 236, 124, 4, rock, ['NE', 'SE']);
p.fence(222, 123, 232, 124, 'S', railing);
p.rect(225, 100, 229, 104, pad({ floor: 'lift-floor', light: 224, lightFx: 'glow', lightMin: 168, tag: 'pickup' }));
tagTiles('pad-squad', [[222, 112], [231, 108], [226, 116]]);
tagTiles('pad-more', [[229, 118]]);

// ---------------------------------------------------------------- story tiles
/** Tag the open tiles of a box that have no tag yet (where a line is said, a door opens). */
const tagBox = (x0, y0, x1, y1, tag) => p.rect(x0, y0, x1, y1, (x, y, old) => (old.wall || old.door || old.tag ? old : { ...old, tag }));
tagBox(48, 125, 60, 137, 'camp');
tagBox(156, 40, 162, 44, 'window'); // the corridor by the office's barred window
tagBox(146, 40, 156, 44, 'office-near'); // and by its door
tagBox(171, 38, 176, 45, 'records'); // round the vault's dais

// The sky over the wash, the reach, the gantry and the pad starts at 48:
// the general's shuttle stands 19 tall on the pad, and the Crow flies in
// over the wash (things are cut off at their tile's ceiling).
p.rect(140, 86, W, H, (x, y, old) => (!old.wall && !old.door && old.ceiling === 'sky' ? { ...old, ceilZ: 48 } : old));

// ---------------------------------------------------------------- the canyon's edges
// The carved canyons' stepped rock edges, cut to 45 degrees: a rock tile
// with open ground on two sides that meet at a corner (and rock on the
// other two) becomes an angled wall standing on that ground.
const OPEN = (c) => c && !c.wall && !c.door && c.ceiling === 'sky';
const cuts = [];
for (const k of carved) {
  const x0 = k % W;
  const y0 = (k / W) | 0;
  for (const [x, y] of [[x0 + 1, y0], [x0 - 1, y0], [x0, y0 + 1], [x0, y0 - 1]]) {
    const c = p.get(x, y);
    if (!c || c.wall !== 'sandstone' || c.diagonal) continue;
    const n = p.get(x, y - 1);
    const s = p.get(x, y + 1);
    const e = p.get(x + 1, y);
    const w = p.get(x - 1, y);
    for (const [a, b, solid] of [[n, e, 'SW'], [n, w, 'SE'], [s, e, 'NW'], [s, w, 'NE']]) {
      const opp = { SW: [s, w], SE: [s, e], NW: [n, w], NE: [n, e] }[solid];
      if (OPEN(a) && OPEN(b) && a.floorZ === b.floorZ && !a.slab && !b.slab && opp.every((o) => o?.wall === 'sandstone')) {
        cuts.push([x, y, { ...a, ...rock, diagonal: solid }]);
        break;
      }
    }
  }
}
for (const [x, y, c] of cuts) p.set(x, y, c);

// ---------------------------------------------------------------- the skyline
// The canyon's rock walls end 4.5 to 6 m up at a rim: one tile of rock out
// of reach, its sky just above it so the view ends there. Above and behind
// the rim the backdrop takes over (lib/backdrop.js), climbing from the rim's
// height into slopes and ridges. The rim rises toward the taller cliff the
// garrison is built into (the rock round it, and doors, stay walls) and
// stays off the map's edge.
const noise = valueNoise;
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
const near4 = (x, y) => [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]];
/** The rim's height above an open floor at `base`: smooth along the canyon, not tile by tile. */
const rimHeight = (x, y, base) => base + 9 + noise(x, y, 8, 7) * 2.5 + noise(x, y, 3, 8) * 0.75;
// The rim: rock beside the canyon's open tiles and its angled corners.
const rim = new Map(); // tile -> { x, y, base }
for (let y = 1; y < H - 1; y++) {
  for (let x = 1; x < W - 1; x++) {
    const c = p.get(x, y);
    if (!isAir(c) && !(c.wall === 'sandstone' && c.diagonal)) continue;
    for (const [nx, ny] of near4(x, y)) {
      const k = ny * W + nx;
      if (nx < 1 || ny < 1 || nx >= W - 1 || ny >= H - 1 || !isRock(p.get(nx, ny)) || indoorNear(nx, ny)) continue;
      const base = c.floorZ ?? 0;
      if (!rim.has(k) || rim.get(k).base < base) rim.set(k, { x: nx, y: ny, base });
    }
  }
}
// The tall rock left standing (round the garrison and doors) beside open
// sky: the rim climbs to meet it.
const tall = [];
for (let y = 1; y < H - 1; y++) {
  for (let x = 1; x < W - 1; x++) {
    if (isRock(p.get(x, y)) && !rim.has(y * W + x) && near4(x, y).some(([nx, ny]) => isAir(p.get(nx, ny)) && p.get(nx, ny).ceilZ >= SKY)) tall.push([x, y]);
  }
}
for (const t of rim.values()) {
  let h = rimHeight(t.x, t.y, t.base);
  for (const [x, y] of tall) {
    const d = Math.max(Math.abs(x - t.x), Math.abs(y - t.y));
    if (d < 8) h = Math.max(h, SKY - 1 - d * 2);
  }
  t.h = Math.round(Math.min(SKY - 1, h) * 4) / 4;
  p.set(t.x, t.y, { floor: 'desert-gravel', ceiling: 'sky', floorZ: t.h, ceilZ: t.h + 0.25, side: 'sandstone', light: 144, scenery: true });
}
// Angled rock corners stop at the lowest rim beside them (at the highest,
// each stood up as a thin spike on the skyline), or with none beside them
// where a rim there would.
for (let y = 1; y < H - 1; y++) {
  for (let x = 1; x < W - 1; x++) {
    const c = p.get(x, y);
    if (c.wall !== 'sandstone' || !c.diagonal || c.ceiling !== 'sky') continue;
    let top = Infinity;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) top = Math.min(top, rim.get((y + dy) * W + x + dx)?.h ?? Infinity);
    if (top === Infinity) top = Math.min(SKY - 1, rimHeight(x, y, c.floorZ ?? 0));
    p.set(x, y, { ...c, ceilZ: top + 0.25 });
  }
}
/** The rim's height near (x, y) for the backdrop: the rim tile's there, else the formula. */
const rimAt = (x, y, base) => rim.get(Math.round(y) * W + Math.round(x))?.h ?? rimHeight(x, y, base);
// Gravel in channels across the sand.
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const c = p.get(x, y);
    if (!c.wall && c.floor === 'desert-sand' && Math.abs(noise(x, y, 6, 21) - 0.5) < 0.045) p.set(x, y, { ...c, floor: 'desert-gravel' });
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
/** Things placed by the dressing below, before the list. */
const placed = [];

// The Empire's banners, 1 x 2 m, hung from the top of an Imperial wall:
// (x0, y0)-(x1, y1) along the face, `z` where they're tied.
const banner = (x0, y0, x1, y1, z) => hangings.push({ type: 'imp-banner', from: [x0, y0, z], to: [x1, y1, z], length: 4 });
// Either side of the main gate, outside the light strips.
banner(125, 64.05, 127, 64.05, 7.8);
banner(145, 64.05, 147, 64.05, 7.8);

/**
 * The open tile nearest (x, y), within 5, with rock (a wall, or a cliff
 * standing 4 over it) on one side: where something set in the rock face
 * goes. Gives the point on the face, the way out of it and the floor.
 */
function wallSpot(x, y) {
  let best = null;
  for (let ty = Math.floor(y - 5); ty <= y + 5; ty++) {
    for (let tx = Math.floor(x - 5); tx <= x + 5; tx++) {
      const c = p.get(tx, ty);
      if (!c || c.wall || c.door || c.scenery) continue;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const n = p.get(tx + dx, ty + dy);
        if (!n || !((n.wall === 'sandstone' && !n.diagonal) || (n.scenery && n.floorZ > (c.floorZ ?? 0) + 4))) continue;
        const d = Math.hypot(tx + 0.5 - x, ty + 0.5 - y);
        if (!best || d < best.d) best = { d, x: tx + 0.5 + dx * 0.49, y: ty + 0.5 + dy * 0.49, out: Math.atan2(dy, -dx) * (180 / Math.PI), floor: c.floorZ ?? 0 };
      }
    }
  }
  return best;
}
// The Empire's perimeter beacons, set in the rock along the way: blinking
// red, a little above head height. The first signs of the garrison.
for (const [x, y] of [[181, 125], [158, 140], [132, 139], [76, 128], [34, 108], [58, 93], [84, 92]]) {
  const w = wallSpot(x, y);
  placed.push(at('rock-beacon', w.x, w.y, { angle: w.out, z: w.floor + 2.4 }));
  lamps.push({ x: w.x, y: w.y, z: w.floor + 2.4, radius: 2.5, light: 40, fx: 'blink' });
}

// From the face to the floodlight towers and up to the mast on the mesa.
hangings.push(
  { type: 'cable', from: [124.5, 64.05, 7.4], to: [119.8, 69.2, 6.6], sag: 0.8 },
  { type: 'cable', from: [146.5, 64.05, 7.4], to: [143.8, 68.6, 6.6], sag: 0.6 },
  { type: 'cable', from: [131, 66.6, 6.5], to: [128.6, 74.4, 14.6], sag: 0.9 },
);
// Skills (docs/mission3.md has the table): 1-2 thin out the fights and add
// med kits; 4-5 add a trooper or two to most areas.
const EASY = [1, 2];
const NOT_EASIEST = [2, 3, 4, 5];
const NORMAL_UP = [3, 4, 5];
const HARD = [4, 5];
// The burned camp (floor -2): three huts burned to their frames, scraps
// of hide still hanging off them, ash heaps smouldering, scorched ground.
placed.push(
  at('tent-frame-burnt', 50, 128, { angle: 20, z: -2 }), at('tent-frame-burnt', 58.5, 134, { angle: 200, z: -2 }),
  at('tent-frame-burnt', 43, 133.5, { angle: 110, z: -2 }),
  at('floor-burn-2', 50, 128, { angle: 30 }), at('floor-burn-2', 58.5, 134, { angle: 160 }), at('floor-burn-1', 43, 133.5),
  at('floor-burn-1', 55, 126.5, { angle: 70 }), at('floor-burn-1', 46.5, 138, { angle: 250 }),
  at('ash-heap', 53.5, 130.5), at('ash-heap', 47, 129, { angle: 90 }), at('ash-heap', 61, 128.5, { angle: 200 }),
);
for (const [x, y] of [[53.5, 130.5], [47, 129], [61, 128.5]]) lamps.push({ x, y, z: -1.4, radius: 3, light: 32, fx: 'fire' });
hangings.push(
  { type: 'rag', from: [49.3, 127.4, -0.1], to: [50.9, 128.3, 0], length: 1.2 },
  { type: 'rag', from: [57.8, 133.2, -0.3], to: [59.3, 134.4, -0.2], length: 0.9 },
);
// The Jawas' scrapyard at the gulch's west end: a skyhopper that came down
// in the canyon, stripped; crates of what they've taken; their fire.
placed.push(
  at('skyhopper', 129, 152, { angle: 30, z: -10 }), at('floor-burn-1', 129, 152, { z: -10 }),
  at('bay-crate-open-tan', 123, 147.5, { angle: 15, z: -10 }), at('bay-crate-tan', 125, 155, { angle: 80, z: -10 }),
  at('fire-drum', 120.5, 152.5, { z: -10 }),
);
lamps.push({ x: 120.5, y: 152.5, z: -8.8, radius: 4, light: 56, fx: 'fire' });

// ---- The garrison inside.
// The cut: ribs of girder against its rock walls, work lamps, a cable run
// along the west wall.
for (const y of [23, 29, 35]) placed.push(at('ds-girder-post', 130.35, y), at('ds-girder-post', 133.65, y));
placed.push(at('work-lamp', 133.4, 32, { angle: 180, z: 6 }), at('work-lamp', 130.6, 26, { angle: 0, z: 6 }));
hangings.push({ type: 'cable', from: [130.05, 21, 9.6], to: [130.05, 39, 9.5], sag: 0.5 }, { type: 'hose', from: [133.95, 22, 9.7], to: [133.95, 38, 9.6], sag: 0.7 });
// The excavation: the rock face they're cutting back, a cave-in in the far
// corner (sand still trickling), girders up, panels and a reel waiting,
// rubble, work lamps.
placed.push(
  at('cave-in', 115.5, 9.5, { angle: 45, z: 6 }),
  at('ds-girder-post', 122, 8, { z: 6 }), at('ds-girder-post', 122, 16, { z: 6 }), at('ds-girder-post', 128, 8, { z: 6 }), at('ds-girder-post', 128, 16, { z: 6 }),
  at('ds-panel-stack', 125, 18, { angle: 80, z: 6 }), at('ds-panel-stack', 118.5, 17.5, { angle: 10, z: 6 }), at('ds-cable-reel', 131.5, 6.5, { z: 6 }),
  at('boulder-small', 114.5, 14.5, { angle: 60, z: 6 }), at('boulder-small', 119, 6, { angle: 200, z: 6 }),
  at('work-lamp', 126, 12, { angle: 225, z: 6 }), at('work-lamp', 117, 13, { angle: 45, z: 6 }),
  at('ds-crate', 132, 18.5, { angle: 15, z: 6 }),
);
// The mess: two round tables with their chairs, a counter along the west
// wall, lockers by the door to the bunks.
for (const [tx, ty] of [[143, 16], [153, 16]]) {
  placed.push(at('ds-table', tx, ty, { z: 6 }));
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2 + 0.3;
    placed.push(at('ds-chair', tx + Math.cos(a) * 3.9, ty - Math.sin(a) * 3.9, { angle: (a * 180) / Math.PI + 180, z: 6 }));
  }
}
placed.push(
  ...[9, 13, 21].map((y) => at('ds-console-wall', 135.02, y, { angle: 0, z: 6 })),
  at('ds-locker-bank', 138, 26.98, { angle: 90, z: 6 }), at('ds-locker-bank', 146, 26.98, { angle: 90, z: 6 }),
);
// The bunks, two on each side wall.
for (const y of [32.5, 36.5]) placed.push(at('ds-bunk', 136.02, y, { angle: 0, z: 6 }), at('ds-bunk', 147.98, y, { angle: 180, z: 6 }));
// The office: the general's desk.
placed.push(at('ds-desk', 155, 31, { angle: 270, z: 6 }), at('ds-chair', 155, 29.6, { angle: 270, z: 6 }));
// Detention: a bunk in each cell, the desk in the control room.
for (let k = 0; k < 6; k++) placed.push(at('ds-bunk', 164 + k * 5, 11.02, { angle: 270, z: 6 }));
placed.push(at('ds-desk', 173, 27.5, { angle: 90, z: 6 }), at('ds-console-wall', 166.02, 29, { angle: 0, z: 6 }), at('ds-console-wall', 179.98, 29, { angle: 180, z: 6 }));
// The test bay: the prototype's empty cradle, scorch marks where it was
// tried, cables and hoses hanging from the rock over it, a pipe leaking
// steam by the hatch and a live cable spitting sparks.
placed.push(
  at('test-cradle', 211.5, 68, { angle: 90, z: 6 }),
  at('floor-burn-2', 211.5, 68), at('floor-burn-2', 218, 74, { angle: 60 }), at('floor-burn-1', 205, 62, { angle: 140 }), at('floor-burn-1', 221, 61),
  at('ds-steam-pipe', 197.02, 63, { angle: 0, z: 6 }),
  at('ds-cables-live', 218, 76, { z: 20 }),
  at('ds-console-wall', 211.5, 52.02, { angle: 270, z: 6 }), at('ds-console-wall', 207, 52.02, { angle: 270, z: 6 }),
);
hangings.push(
  { type: 'hose', from: [210.6, 67, 19.9], length: 9 },
  { type: 'hose', from: [212.4, 69, 19.9], length: 10 },
  { type: 'cable', from: [205, 60, 19.9], to: [218, 76, 19.9], sag: 3 },
);
// The target wall at the bay's east end, scorched and pocked.
for (const [y, z, tex] of [[60, 9, 'grime-scorch-1'], [65, 12, 'grime-scorch-2'], [70, 8.5, 'grime-scorch-1'], [74, 11, 'grime-scorch-2'], [77, 9.5, 'grime-scorch-1']]) {
  decals.push({ x: 226, y, z, face: 'W', tex });
}

// The generator: rings glowing round the column at its foot (arcs crackle
// off them once it's overloaded), live cables and leaking pipes on the
// floor's walls, conduits from the walls to the column, girders holding
// up the catwalk ring.
placed.push(
  at('gen-ring', 178, 68, { z: -5 }), at('gen-ring', 178, 68, { z: -2.5 }), at('gen-ring', 178, 68, { z: 16 }),
  at('ds-steam-pipe', 160.02, 70, { angle: 0, z: -6 }), at('ds-steam-pipe', 195.98, 62, { angle: 180, z: -6 }),
  at('ds-cables-live', 170, 76, { z: 18 }), at('ds-cables-live', 188, 58, { z: 18 }),
  ...[[165, 66], [165, 74], [191, 64], [191, 72], [170, 55], [186, 55], [170, 81], [186, 81]].map(([x, y]) => at('ds-girder-post', x, y, { z: -6 })),
);
hangings.push(
  { type: 'hose', from: [160.05, 64, 15], to: [173.95, 66, 13], sag: 2.5 },
  { type: 'hose', from: [195.95, 70, 15.5], to: [182.05, 69, 12.5], sag: 2.5 },
  { type: 'cable', from: [178, 50.05, 16], to: [178, 63.95, 14], sag: 2 },
  { type: 'cable', from: [176, 85.95, 16.5], to: [176.5, 72.05, 13.5], sag: 2.2 },
);
for (const [x, y] of [[172, 66], [184, 70], [176, 74], [180, 62]]) p.set(x, y, { ...p.get(x, y), tag: 'gen-burst' });

// ---- The fights and finds in the new canyon and rooms (docs/mission3.md,
// Enemies and items by skill).
const SKILL = { EASY: [1, 2], NOT_EASIEST: [2, 3, 4, 5], NORMAL_UP: [3, 4, 5], HARD: [4, 5] };
const fights = [
  // The gulch: Jawas on its floor, shooting up at the ledge.
  at('jawa', 154, 152, { angle: 90 }), at('jawa', 140, 154, { angle: 90 }), at('jawa', 160, 155, { angle: 120 }),
  at('jawa', 136, 149, { angle: 60, skill: SKILL.NORMAL_UP }), at('jawa', 146, 156, { angle: 90, skill: SKILL.HARD }),
  // Their scrapyard at its west end, and two in the cave.
  at('jawa', 122, 150, { angle: 0 }), at('jawa', 126.5, 148, { angle: 30 }), at('jawa', 124, 153.5, { angle: 0, skill: SKILL.NOT_EASIEST }),
  at('jawa', 104, 151.5, { angle: 0, skill: SKILL.NORMAL_UP }), at('jawa', 88, 137, { angle: 315 }),
  // The camp: two picking over what the fire left.
  at('jawa', 52, 133, { angle: 0, skill: SKILL.NOT_EASIEST }), at('jawa', 45, 126, { angle: 300 }),
  // Over the dry gorge, a probe droid: the first Imperial Kyle meets.
  at('probe-droid', 66, 100, { skill: SKILL.NOT_EASIEST }),
  // The notch: a trooper watching the way over the arch.
  at('stormtrooper', 96, 89.5, { angle: 180, z: 5, skill: SKILL.NOT_EASIEST }),
  // The cut: one at the top of the tunnel; the excavation's crew.
  at('stormtrooper', 132, 22, { angle: 270, z: 6 }),
  at('stormtrooper', 124, 9, { angle: 315, z: 6 }), at('stormtrooper', 118, 14, { angle: 0, z: 6, skill: SKILL.NORMAL_UP }),
  at('officer', 129, 15, { angle: 180, z: 6, skill: SKILL.HARD }),
  // The mess: at the tables, and one by the counter.
  at('stormtrooper', 148, 11, { angle: 180, z: 6 }), at('stormtrooper', 157, 21, { angle: 180, z: 6 }),
  at('stormtrooper', 138, 10, { angle: 0, z: 6, skill: SKILL.NORMAL_UP }),
  at('stormtrooper', 150, 23, { angle: 90, z: 6, skill: [5] }),
  // Detention: the desk's officer and a guard on the lane.
  at('officer', 173, 30, { angle: 270, z: 6 }),
  at('stormtrooper', 182, 20, { angle: 180, z: 6, skill: SKILL.NORMAL_UP }),
];
const finds = [
  at('energy-cell', 176, 129), // the slot
  at('thermal-detonator', 138, 141), at('med-kit', 150, 152, { skill: [1, 2, 3] }), // the gulch
  at('energy-pack', 124, 150), at('energy-cell', 92, 140), // the scrapyard, the cave
  at('med-kit', 58, 138), at('energy-pack', 38, 132), // the camp
  at('energy-pack', 70, 94.5), at('energy-cell', 60, 100), // the high ledge, the dry gorge under it
  at('energy-cell', 131, 38.5), at('thermal-detonator', 114, 18), at('med-kit', 132, 6, { skill: [1, 2, 3] }), // the cut, the excavation
  at('energy-pack', 158, 8.5), at('med-kit', 136.5, 25), // the mess
  at('med-kit', 177, 31, { skill: [1, 2, 3] }), at('energy-cell', 191, 21), // detention
  at('thermal-detonator', 200, 56), at('thermal-detonator', 201, 57), at('energy-pack', 223, 54.5), // the test bay
];

const list = [
  ...placed,
  ...fights,
  ...finds,
  // The drop-off, facing north-west up the reach to the garrison.
  at('player', 205.5, 126.5, { angle: 180 }),
  // The canyon: snipers on both ledges and the rock arch, two gate guards and
  // their commanders, a probe droid round the mesa, and a band of Jawas
  // scavenging in the gorge.
  at('stormtrooper', 112.5, 89.5, { angle: 270, z: 5, skill: NOT_EASIEST }), // sniper, on the arch
  at('stormtrooper', 110, 74.5, { angle: 0 }), // sniper, ledge A
  at('stormtrooper', 147.5, 72.5, { angle: 180 }), // sniper, ledge B
  at('sandtrooper', 128.5, 66, { angle: 270 }),
  at('sandtrooper', 144.5, 66, { angle: 270, skill: NOT_EASIEST }),
  at('sandtrooper', 118.5, 76.5, { angle: 270, skill: HARD }), // under ledge A
  at('sandtrooper', 141.5, 79.5, { angle: 200, skill: NOT_EASIEST }), // by the big boulder, facing the gorge
  // Sandtrooper commanders: one at the gate between its guards, one by the
  // vent mouth, the way in once the gate holds.
  at('sandtrooper-commander', 136.5, 66.5, { angle: 270, skill: NOT_EASIEST }),
  at('sandtrooper-commander', 121.5, 67.5, { angle: 270, skill: NORMAL_UP }),
  at('probe-droid', 132.5, 82, { skill: NORMAL_UP }),
  // Barricades across the approach to the gate, angled out, the guards
  // behind them, and supply crates stacked against the face by the strips
  // (one half hides the vent mouth).
  at('barricade', 131, 70, { angle: 250 }), at('barricade', 141, 70, { angle: 290 }),
  at('barricade', 125.5, 71.5, { angle: 270 }),
  at('floodlight-tower', 119.5, 69.5, { angle: 315 }), at('floodlight-tower', 144, 68.8, { angle: 225 }),
  at('sensor-mast', 149, 76), at('sensor-dish', 149, 76, { z: 11.1 }),
  // The comm mast on the mesa: the landmark.
  at('comm-mast', 126, 76, { z: 14, angle: 20 }),
  at('supply-crate', 146.5, 65.2), at('supply-crate', 147.9, 65.4), at('supply-crate', 147, 66.6),
  at('supply-crate', 126.2, 65.2), at('supply-crate', 123.3, 65),
  // Boulders fallen from the walls, along their feet and off the way through.
  at('boulder-large', 97, 111.5, { angle: 30 }), at('boulder-small', 95.8, 109.2, { angle: 200 }),
  at('boulder-large', 114.5, 116.5, { angle: 140 }), at('boulder-small', 99, 103.5, { angle: 80 }),
  at('boulder-small', 104.5, 96, { angle: 310 }), at('boulder-large', 119.5, 86.5, { angle: 250 }),
  at('boulder-large', 115, 81.5, { angle: 100 }), at('boulder-small', 117.6, 82.6, { angle: 20 }),
  at('boulder-small', 133.4, 77.5, { angle: 160 }), at('boulder-large', 139, 82, { angle: 300 }),
  at('jawa', 112, 100, { angle: 270 }), at('jawa', 118, 96, { angle: 225 }),
  at('jawa', 116, 86, { angle: 270, skill: NORMAL_UP }),
  at('jawa', 106.5, 90.5, { angle: 315, skill: HARD }),
  at('energy-cell', 112.5, 92.5),
  at('med-kit', 117.5, 66.5, { skill: [1, 2, 3] }), // after the gate guards, by the vent
  at('thermal-detonator', 118.5, 66.5),
  at('energy-pack', 147.5, 69.5), // secret: ledge B
  at('shield-unit', 91.5, 106), // secret: the rock alcove
  // The vent: an energy cell where light falls through the grate.
  at('energy-cell', 121, 56.5),
  // Maintenance: an ambush by the lift (two on the hard skills).
  at('stormtrooper', 124.5, 40.5, { angle: 270, ambush: true }),
  at('stormtrooper', 115.5, 44.5, { angle: 0, ambush: true, skill: HARD }),
  at('supply-crate', 116.5, 40), at('supply-crate', 118, 40),
  at('console', 127.5, 39.5),
  at('terminal', 122, 38.6, { angle: 270 }), at('terminal', 123.4, 38.6, { angle: 270 }),
  at('energy-pack', 116.5, 48.5),
  at('thermal-detonator', 117.5, 48.5),
  at('energy-cell', 128.5, 48.5),
  // The barracks: the officer carries the red keycard.
  at('stormtrooper', 156.5, 42, { angle: 180 }),
  at('stormtrooper', 162.5, 42, { angle: 180, skill: NORMAL_UP }), // by the red door
  at('ceiling-lamp', 142, 42), at('ceiling-lamp', 158, 42),
  at('stormtrooper', 139.5, 31.5, { angle: 270 }),
  at('stormtrooper', 145.5, 34.5, { angle: 270, skill: NOT_EASIEST }),
  at('stormtrooper', 142.5, 30.5, { angle: 270, skill: HARD }),
  at('med-kit', 146.5, 30),
  at('officer', 154.5, 32.5, { angle: 270, drops: ['keycard-red'] }),
  // The general, by his own door (an officer's sprite for now: Mark).
  at('general', 158.5, 32, { angle: 0, tag: 'general' }),
  // Rusk, in the last cell.
  at('rusk', 189.5, 13, {
    angle: 270, tag: 'rusk', name: 'RUSK',
    talk: [{ lines: ['KATARN? THEY TOLD ME NOBODY WAS COMING.', "THE BACK STAIRS AT THE END OF THE BLOCK GO DOWN TO THE GENERATOR. I'VE SEEN THE CODE. GO, I'LL KEEP BEHIND YOU."], set: 'rusk-free' }],
  }),
  at('med-kit', 158.5, 30, { skill: EASY }),
  at('console', 151.5, 30),
  // The vault: guards against the far computer banks, lit by the screens'
  // glow, facing the red door.
  at('stormtrooper', 179.4, 38.5, { angle: 180 }),
  at('stormtrooper', 179.4, 44.5, { angle: 180, skill: NORMAL_UP }),
  at('officer', 171.5, 46.5, { angle: 90, skill: HARD }),
  at('terminal', 173, 40.4, { angle: 90 }), at('terminal', 173, 41.6, { angle: 270 }),
  at('energy-pack', 173, 37.5),
  at('energy-cell', 168.5, 45.5), at('energy-cell', 177.5, 45.5),
  at('shield-unit', 184, 40), // secret: the niche
  // The generator: containment rings turning round the column above the
  // catwalk, and coolant tanks on the shaft floor. Things on the catwalks
  // stand on them (z 6); the rest are on the shaft floor, under them.
  at('reactor-ring', 178, 68, { z: 9, angle: 0 }), at('reactor-ring', 178, 68, { z: 13, angle: 45 }),
  at('coolant-tank-running', 166.5, 56.5), at('coolant-tank', 166.5, 60),
  at('coolant-tank', 189.5, 79.5), at('coolant-tank', 189.5, 76),
  at('probe-droid', 178, 58.5, { z: 6.9 }), // over the north bridge
  at('probe-droid', 168.5, 64.5, { skill: [5] }), // down in the west half
  at('stormtrooper', 168.5, 51.5, { angle: 270, z: 6 }),
  at('stormtrooper', 194.5, 74.5, { angle: 180, z: 6, skill: NOT_EASIEST }),
  at('stormtrooper', 184.5, 84.5, { angle: 90, z: 6, skill: HARD }),
  at('stormtrooper', 168.5, 72.5, { angle: 0 }),
  at('fuel-barrel', 186.5, 68.5), at('fuel-barrel', 187.5, 70.5),
  at('med-kit', 185.5, 80.5),
  at('energy-pack', 161.5, 64.5, { z: 6 }),
  at('energy-cell', 161.5, 51.5), // in the dark under the north-west corner of the ring
  // The gantry: a med kit before the last fight (the pad's squad comes
  // with the overload).
  at('med-kit', 213, 90, { skill: [1, 2, 3] }),
  // The landing pad, with the general's shuttle north of the marked spot.
  at('lambda-shuttle', 227, 93, { angle: 90 }),
];

export default defineLevel({
  id: 'm3',
  mapLabel: 'M1',
  name: 'THE CANYON GARRISON',
  music: 'garrison',
  sky: 'sky-night',
  // Outdoors, the canyon fades into the night's purple haze (the colour of
  // the sky low down), halfway at 20 m.
  haze: { color: [32, 24, 64], half: 40 },
  par: 600,
  // Still, cold air: a little dust drifting through the floodlights, and a
  // breeze high up that moves the banners and the cables. No storm.
  weather: { type: 'dust', count: 70, wind: [0.6, -0.3, 0] },
  // A pair of TIEs on patrol now and then, in from the east over the wash
  // and away north-west over the bowl (where the sky is high enough to
  // show them), heard as they pass.
  traffic: [
    { thing: 'tie-patrol', count: 2, gap: 0.45, first: [25, 50], every: [70, 140], paths: [
      [[239, 150, 30, 145, 0], [190, 118, 32, 145, 3], [150, 90, 34, 145, 3], [110, 60, 36, 140, 3]],
      [[239, 110, 34, 160, 0], [200, 100, 34, 160, 3], [150, 80, 36, 150, 3], [108, 62, 36, 150, 3]],
    ] },
  ],
  hangings,
  ...p.build(),
  lights: lamps,
  decals,
  // Above and behind the rim, rock climbs into slopes and ridges out to
  // 48 m past the map, fading into the haze: the skyline in depth.
  // Low over the level's own rock (its passages wind through big masses of
  // it), climbing only past the map's edge.
  backdrop: canyonBackdrop(p, {
    low: true,
    rim: rimAt,
    tex: 'sandstone',
    light: 168,
  }),
  things: [],
  triggers: [
    // The drop-off: the Crow lifts off and goes south-east, low over the wash.
    { on: 'start', do: [
      { action: 'fly', thing: 'moldy-crow-inbound', path: [[213, 129, 0, 180, 0], [214, 130, 6, 180, 2.5], [226, 150, 26, 130, 4], [236, 172, 36, 120, 4]] },
      { action: 'message', text: "JAN: THE GARRISON'S IN THE CLIFFS NORTH-WEST OF HERE. THESE CANYONS ARE JAWA COUNTRY: WATCH THE LEDGES. I'LL PICK YOU UP ON THEIR PAD." },
    ] },
    { on: 'enter', tag: 'camp', do: [{ action: 'message', text: "JAN: A TUSKEN CAMP. WHATEVER BURNED IT WASN'T CARRYING A BLASTER." }] },
    { on: 'enter', tag: 'notch', do: [{ action: 'message', text: "JAN: THE GATE'S SEALED. THERE'S A VENT LEFT OF IT, BEHIND THE CRATES." }] },
    { on: 'enter', tag: 'mess', do: [
      { action: 'sound', id: 'pa-chime' },
      { action: 'message', text: 'PA: BLOCK C, PRISONER TRANSFER AT 0600. THE GENERAL\'S SHUTTLE LEAVES AT 0500.' },
    ] },
    // The general, seen through the office's barred window, hurries out of
    // his own door; by the time Kyle is round at the office's, he's gone.
    { on: 'enter', tag: 'window', do: [
      { action: 'openDoors', tag: 'mohc-door' },
      { action: 'setFlag', flag: 'saw-general' },
      { action: 'message', text: 'THROUGH THE BARS: AN IMPERIAL GENERAL, LEAVING IN A HURRY BY A DOOR AT THE BACK.' },
    ] },
    { on: 'enter', tag: 'office-near', if: 'saw-general', do: [
      { action: 'remove', tag: 'general' },
      { action: 'closeDoors', tag: 'mohc-door' },
      { action: 'unlockDoors', tag: 'office' },
    ] },
    { on: 'enter', tag: 'records', do: [
      { action: 'setFlag', flag: 'records' },
      { action: 'unlockDoors', tag: 'cellblock' },
      { action: 'message', text: "TEST RECORDS: 'ASSAULT DROID PROTOTYPE, TRIAL 3: TUSKEN CAMP, JUNDLAND. TRIAL 4: A MOISTURE FARM.' A TRANSFER ORDER: RUSK, T., BLOCK C. THE CELL BLOCK DOOR UNLOCKS." },
    ] },
    { on: 'talk', tag: 'rusk', if: 'rusk-free', do: [
      { action: 'unlockDoors', tag: 'backstairs' },
      { action: 'message', text: 'THE BACK STAIRS ARE OPEN.' },
    ] },
    // Out on the cliff: the general's shuttle goes, and the Crow comes in.
    { on: 'enter', tag: 'gantry', if: 'overload', do: [
      { action: 'message', text: "JAN: THAT'S THE GENERAL'S SHUTTLE. LET HIM GO. I'M COMING IN." },
      { action: 'fly', thing: 'lambda-shuttle', path: [[227, 93, 10, 90, 0], [227, 93, 16, 90, 3], [229, 70, 26, 90, 4], [236, 4, 28, 90, 5]], then: [
        { action: 'fly', thing: 'moldy-crow-inbound', path: [[236, 172, 36, 120, 0], [232, 140, 28, 110, 4], [227, 112, 16, 90, 4], [227, 102, 10, 90, 3]], then: [
          { action: 'setFlag', flag: 'crow-down' },
        ] },
      ] },
    ] },
    { on: 'enter', tag: 'pickup', if: 'crow-down', do: [{ action: 'message', text: "JAN: RUSK'S ABOARD. HOLD ON TO SOMETHING." }, { action: 'exit' }] },
  ],
  list,
});
