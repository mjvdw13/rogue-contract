import { defineLevel } from '../../engine/defs.js';
import { Painter } from './lib/painter.js';

// MISSION 1: THE CANYON GARRISON. The layout, route and numbers are in
// docs/mission1.md (area numbers below match its table). Painted in code on
// the fine grid (1 tile = 0.5 m; the player is 1.7 tall and 1 wide).

const W = 128;
const H = 100;
const SKY = 24;

// ---- Cells
const rock = { wall: 'canyon-rock' };
const panel = { wall: 'imp-panel' };
const darkPanel = { wall: 'imp-panel-dark' };
const lights = { wall: 'imp-lights' };
const computer = { wall: 'imp-computer' };
// See-through fences on tile edges.
const railing = { tex: 'imp-railing', height: 0.75 };
const bars = { tex: 'imp-bars' };
const cage = { tex: 'imp-cage' };

/** Open desert under the night sky, in moonlight. */
const sand = (floorZ = 0, extra = {}) => ({ floor: 'sand', ceiling: 'sky', floorZ, ceilZ: SKY, light: 144, side: 'canyon-rock', ...extra });
/** An Imperial room. */
const room = (floorZ, ceilZ, extra = {}) => ({
  floor: 'imp-floor', ceiling: 'imp-ceiling', floorZ, ceilZ, light: 160, side: 'imp-panel-dark', upper: 'imp-panel', ...extra,
});
/** A rising door (a doorway, opening to `ceilZ`). */
const door = (floorZ, ceilZ, extra = {}) => ({
  door: 'imp-door', jamb: 'imp-jamb', style: 'rise', floor: 'imp-floor', ceiling: 'imp-ceiling', floorZ, ceilZ, light: 160, ...extra,
});
/** A lift platform between `stops`. */
const lift = (stops, ceilZ, extra = {}) => ({
  floor: 'lift-floor', ceiling: 'imp-ceiling', floorZ: stops[0], ceilZ, light: 160, side: 'imp-stripe', lift: { stops, wait: 3 }, ...extra,
});

const p = new Painter(W, H, rock);

// ---------------------------------------------------------------- the canyon
// 1. Start bowl, with a secret alcove behind a rock door in its west wall.
p.rect(6, 76, 30, 96, sand(0, { light: 152 }));
p.chamfer(6, 76, 30, 96, 4, rock, ['SW', 'SE', 'NW']);
p.rect(2, 80, 5, 84, sand(0, { secret: true, light: 112 }));
p.rect(5, 80, 6, 84, { door: 'canyon-rock', secret: true, floor: 'sand', ceiling: 'sky', floorZ: 0, ceilZ: SKY, light: 112 });

// 2. The gorge, winding north-east: narrow, so the moon barely reaches in.
p.rect(14, 60, 34, 76, sand(0, { light: 136 }));
p.chamfer(14, 60, 34, 76, 5, rock, ['NW', 'SE']);
p.rect(30, 70, 38, 76, sand(0, { light: 136 }));
p.chamfer(30, 70, 38, 76, 3, rock, ['NE', 'SE']);

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

// 4. The face: a locked main gate between light strips.
p.rect(44, 36, 52, 40, door(0, 6, { lock: 'remote', tag: 'maingate' }));
p.rect(40, 39, 44, 40, lights);
p.rect(52, 39, 56, 40, lights);
// Floodlight pools under the strips, and the lit gate between them.
p.light(39, 40, 45, 42, 200);
p.light(51, 40, 57, 42, 200);
p.light(45, 40, 51, 42, 168);

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
  p.light(x, 16, x + 2, 17, 184);
  p.light(x, 19, x + 2, 20, 184);
}
for (const x of [53, 69]) p.light(x, 17, x + 2, 19, 184);

// 9. The bunk room.
p.rect(48, 4, 60, 14, room(6, 10, { light: 128 }));
p.rect(53, 8, 55, 10, room(6, 10, { ceiling: 'imp-ceiling-light', light: 184 }));
p.light(48, 4, 51, 7, 120);
p.light(57, 4, 60, 7, 120);
p.chamfer(48, 4, 60, 14, 2, darkPanel, ['NW', 'NE']);
p.rect(52, 14, 55, 16, door(6, 10));

// 10. The officer's office.
p.rect(62, 4, 72, 14, room(6, 9, { light: 144 }));
p.rect(63, 5, 66, 8, room(6, 9, { ceiling: 'imp-ceiling-light', light: 192 })); // over the desk
p.chamfer(62, 4, 72, 14, 2, darkPanel, ['NE']);
p.rect(65, 14, 68, 16, door(6, 9));
// A barred window from the corridor into the office, over a sill.
p.rect(69, 14, 71, 16, room(7, 8.5, { light: 144, side: 'imp-panel', upper: 'imp-panel' }));
p.fence(69, 15, 71, 16, 'S', bars);

// 11. The red door, and 12. the data vault behind it: dark, walled in computer banks.
p.rect(76, 8, 94, 26, computer);
p.rect(76, 16, 78, 20, door(6, 9, { door: 'imp-door-red', lock: 'red' }));
// The screens' glow pulses along the banks.
p.rect(78, 10, 92, 24, room(6, 9, { light: 112 }));
const screens = { lightFx: 'glow', lightMin: 104 };
p.light(78, 10, 92, 11, 152, screens);
p.light(78, 23, 92, 24, 152, screens);
p.light(78, 11, 79, 23, 152, screens);
p.light(91, 11, 92, 23, 152, screens);
p.chamfer(78, 10, 92, 24, 2, darkPanel);
// The secret niche behind a computer bank.
p.rect(92, 14, 94, 18, { door: 'imp-computer', secret: true, floor: 'imp-floor', ceiling: 'imp-ceiling', floorZ: 6, ceilZ: 9, light: 112 });
p.rect(94, 13, 98, 19, room(6, 9, { light: 120, secret: true }));
// The south door onto the generator catwalk.
p.rect(83, 24, 87, 26, door(6, 9));

// 13. The generator chamber: a deep shaft, a catwalk ring, and the reactor column.
const genFloor = room(-6, 18, { floor: 'imp-grate', light: 112, tag: 'generator' });
const catwalk = room(6, 18, { floor: 'imp-grate', light: 152, side: 'imp-stripe', tag: 'generator' });
p.rect(72, 26, 108, 62, genFloor);
p.rect(72, 26, 108, 29, catwalk);
p.rect(72, 59, 108, 62, catwalk);
p.rect(72, 26, 75, 62, catwalk);
p.rect(105, 26, 108, 62, catwalk);
p.pillar(86, 40, 94, 48, 2, lights, genFloor);
// The column lights the shaft floor round it with a slow pulse.
p.light(84, 38, 96, 50, 200, { lightFx: 'glow', lightMin: 136 });
// Light strips on the chamber walls, lighting the catwalk in front of them.
for (const y of [33, 51]) {
  p.rect(71, y, 72, y + 3, lights).light(72, y, 75, y + 3, 184);
  p.rect(108, y, 109, y + 3, lights).light(105, y, 108, y + 3, 184);
}
for (const x of [96, 102]) p.rect(x, 25, x + 3, 26, lights).light(x, 26, x + 3, 29, 184);
for (const x of [80, 96]) p.rect(x, 62, x + 3, 63, lights).light(x, 59, x + 3, 62, 184);
p.rect(88, 29, 92, 40, catwalk);
p.rect(88, 48, 92, 59, catwalk);
// Railings along the catwalk ring's inner edge and both sides of the
// bridges, open where the lifts and bridges join the ring.
p.fence(74, 29, 75, 55, 'E', railing);
p.fence(105, 33, 106, 59, 'W', railing);
p.fence(75, 28, 88, 29, 'S', railing).fence(92, 28, 101, 29, 'S', railing);
p.fence(79, 59, 88, 60, 'N', railing).fence(92, 59, 105, 60, 'N', railing);
for (const [y0, y1] of [[29, 40], [48, 59]]) p.fence(88, y0, 89, y1, 'W', railing).fence(91, y0, 92, y1, 'E', railing);
// The bridges reach down to the floor, so the bottom is two halves (west and
// east of the column). Lifts L2 and L2b join each half to the catwalk ring.
p.rect(75, 55, 79, 59, lift([-6, 6], 18, { tag: 'generator' }));
p.rect(101, 29, 105, 33, lift([-6, 6], 18, { tag: 'generator' }));
// The overload switch on the column's east face, at the bottom.
p.rect(93, 43, 94, 45, {
  wall: 'imp-switch',
  switchTo: 'imp-switch-on',
  use: [
    { action: 'openDoors', tag: 'escape' },
    { action: 'setLight', tag: 'generator', light: 136, lightFx: 'flicker', lightMin: 72 },
    { action: 'message', text: 'GENERATOR OVERLOADED. THE ESCAPE HATCH IS OPEN.' },
  ],
});

// 14. The escape hatch in the east wall, opened by the overload switch.
p.rect(108, 42, 110, 46, door(6, 10, { lock: 'remote', tag: 'escape' }));

// ---------------------------------------------------------------- the way out
// 15. The gantry: stairs up to 8, out under the sky.
const gantry = (z) => sand(z, { floor: 'imp-grate', side: 'imp-panel-dark', light: 160 });
p.stairs(110, 42, 114, 46, 'E', 6.5, 0.5, gantry);
p.rect(114, 42, 118, 46, gantry(8));

// 16. The chasm (3 tiles), with lift L3 back up if you fall.
p.rect(118, 34, 121, 60, sand(-2, { light: 104 }));
p.rect(118, 56, 121, 60, lift([-2, 8], SKY, { ceiling: 'sky', light: 104 }));

// 17. The landing pad, floodlit. Stepping onto the marked pickup spot (it
// pulses) ends the mission.
p.rect(121, 34, 126, 60, sand(8, { floor: 'imp-floor', side: 'imp-panel-dark', light: 184 }));
p.rect(122, 43, 126, 47, sand(8, { floor: 'lift-floor', side: 'imp-panel-dark', light: 224, lightFx: 'glow', lightMin: 168, exit: true }));

// ---------------------------------------------------------------- things
const at = (type, x, y, extra = {}) => ({ type, x, y, ...extra });
const list = [
  at('player', 14.5, 90.5, { angle: 90 }),
  // The canyon.
  at('stormtrooper', 22, 50.5, { angle: 0 }), // sniper, ledge A
  at('stormtrooper', 59.5, 48.5, { angle: 180 }), // sniper, ledge B
  at('sandtrooper', 40.5, 42, { angle: 270 }),
  at('sandtrooper', 56.5, 42, { angle: 270 }),
  at('probe-droid', 44.5, 56.5, { skill: [3, 4, 5] }),
  // A band of Jawas scavenging in the gorge.
  at('jawa', 24, 76, { angle: 270 }), at('jawa', 30, 72, { angle: 225 }),
  at('jawa', 28, 62, { angle: 270, skill: [3, 4, 5] }),
  at('power-cell', 24.5, 68.5),
  at('med-kit', 26.5, 82.5, { skill: [1, 2] }),
  at('energy-pack', 59.5, 45.5),
  at('shield-unit', 3.5, 82),
  // Maintenance.
  at('stormtrooper', 36.5, 16.5, { angle: 270, ambush: true }),
  at('supply-crate', 28.5, 16), at('supply-crate', 30, 16),
  at('console', 39.5, 15.5),
  at('terminal', 34, 14.6, { angle: 270 }), at('terminal', 35.4, 14.6, { angle: 270 }),
  at('energy-pack', 28.5, 24.5),
  at('power-cell', 40.5, 24.5),
  // The barracks.
  at('stormtrooper', 68.5, 18, { angle: 180 }),
  at('ceiling-lamp', 54, 18), at('ceiling-lamp', 70, 18),
  at('stormtrooper', 51.5, 7.5, { angle: 270 }),
  at('stormtrooper', 57.5, 10.5, { angle: 270 }),
  at('stormtrooper', 54.5, 6.5, { angle: 270, skill: [4, 5] }),
  at('supply-crate', 50.5, 11.5), at('supply-crate', 56, 12),
  at('med-kit', 58.5, 6),
  at('officer', 66.5, 8.5, { angle: 270 }),
  at('keycard-red', 70.5, 6),
  at('console', 63.5, 6),
  // The vault.
  at('terminal', 85, 16.4, { angle: 90 }), at('terminal', 85, 17.6, { angle: 270 }),
  at('energy-pack', 85, 13.5),
  at('power-cell', 80.5, 21.5), at('power-cell', 89.5, 21.5),
  at('shield-unit', 96, 16),
  // The generator: containment rings turning round the column above the
  // catwalk, and coolant tanks on the shaft floor.
  at('reactor-ring', 90, 44, { z: 9, angle: 0 }), at('reactor-ring', 90, 44, { z: 13, angle: 45 }),
  at('coolant-tank', 78.5, 32.5), at('coolant-tank', 78.5, 36),
  at('coolant-tank', 101.5, 55.5), at('coolant-tank', 101.5, 52),
  at('probe-droid', 90, 34.5),
  at('stormtrooper', 80.5, 27.5, { angle: 270 }),
  at('stormtrooper', 106.5, 50.5, { angle: 180 }),
  at('stormtrooper', 80.5, 48.5, { angle: 0 }),
  at('fuel-barrel', 98.5, 44.5), at('fuel-barrel', 99.5, 46.5),
  at('med-kit', 97.5, 56.5),
  at('energy-pack', 73.5, 40.5),
  // The landing pad, with the pickup shuttle north of the marked spot.
  at('shuttle', 123.5, 38.5, { angle: 270 }),
  at('stormtrooper', 123.5, 49.5, { angle: 180 }),
  at('sandtrooper', 123.5, 54.5, { angle: 180 }),
];

export default defineLevel({
  id: 'm1',
  mapLabel: 'M1',
  name: 'THE CANYON GARRISON',
  music: 'garrison',
  sky: 'sky-night',
  par: 300,
  ...p.build(),
  things: [],
  list,
});
