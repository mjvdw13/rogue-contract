import { defineLevel } from '../../engine/defs.js';
import { Painter } from './lib/painter.js';
import { Town } from './lib/town.js';

// MISSION 4: THE BATTLE STATION. The layout, route and numbers are in
// docs/mission4.md (area numbers below match its table). Painted in code on
// the fine grid (1 tile = 0.5 m; the player is 1.7 tall and 1 wide).

const W = 208;
const H = 152;

// ---- The kit's textures (docs/mission4.md, "The kit"; assets/custom/derive.mjs, STATION).
const T = {
  wall: 'ds-wall',
  wall6: 'ds-wall-6',
  wall8: 'ds-wall-8',
  wallLight: 'ds-wall-light',
  wallDark: 'ds-wall-dark',
  hangarWall: 'ds-hangar-wall',
  hangarLight: 'ds-hangar-light',
  greeble: 'ds-wall-greeble',
  detWall: 'ds-det-wall',
  compactorWall: 'ds-compactor-wall',
  pipes: 'ds-wall-greeble',
  girder: 'ds-girder',
  screen: 'ds-screen',
  floor: 'ds-floor',
  hangarFloor: 'ds-floor-hangar',
  hazard: 'ds-floor-line',
  grate: 'ds-floor-grate',
  detFloor: 'ds-floor',
  detFloorLight: 'ds-det-floor-light',
  sludge: 'water-murky',
  ceiling: 'ds-ceiling',
  ceilingLight: 'ds-ceiling-light',
  liftFloor: 'lift-floor',
  door: 'ds-door',
  doorJamb: 'imp-gate-jamb',
  doorNarrow: 'ds-door-narrow',
  doorRed: 'ds-door-red',
  doorBlue: 'ds-door-blue',
  jamb: 'imp-jamb',
  switchOff: 'ds-switch',
  switchOn: 'ds-switch-on',
  hull: 'ds-hull',
  field: 'ds-field',
  window: 'ds-window',
  railing: 'ds-railing',
  edge: 'imp-stripe',
  sky: 'sky-space',
};

const hull = { wall: T.wallDark };
const railing = { tex: T.railing, height: 0.75 };

/**
 * The pale wall for a room `h` high. Walls hang from the ceiling, so the
 * ones with a trim and a skirting are one picture for each height.
 */
const pale = (h) => (h === 6 ? T.wall6 : h === 8 ? T.wall8 : T.wall);
/** A room: deck, ceiling, its floor and ceiling heights. */
const room = (floorZ, ceilZ, extra = {}) => ({
  floor: T.floor, ceiling: T.ceiling, floorZ, ceilZ, light: 160, side: T.wallDark, upper: pale(ceilZ - floorZ), ...extra,
});
/** A blast door, 4 wide and 4 tall, in a wall 2 thick. */
const door = (floorZ, extra = {}) => ({
  door: T.door, jamb: T.doorJamb, style: 'rise', floor: T.floor, ceiling: T.ceiling, upper: T.wall,
  floorZ, ceilZ: floorZ + 4, light: 160, ...extra,
});
/** A side door, 2 wide and 2 tall, in a wall 1 thick. */
const narrow = (floorZ, extra = {}) => ({
  door: T.doorNarrow, jamb: T.jamb, style: 'rise', floor: T.floor, ceiling: T.ceiling, upper: T.wall,
  floorZ, ceilZ: floorZ + 2, light: 160, ...extra,
});
/** A turbolift's platform between `stops`. */
const lift = (stops, ceilZ, extra = {}, spec = {}) => ({
  floor: T.liftFloor, ceiling: T.ceiling, floorZ: stops[spec.start ?? 0], ceilZ, light: 176, side: T.edge, upper: T.wall,
  lift: { stops, wait: 3, ...spec }, ...extra,
});

const p = new Painter(W, H, hull);
/** The town kit, for its circles (the shaft). */
const kit = new Town(p, { skirt: null });
/** Light sources, added area by area. */
const lamps = [];
const decals = [
  // The crest high on the hangar's east wall, over the control room's window.
  { x: 80, y: 77, z: 17, face: 'W', tex: 'decal-crest', scale: 3 },
  // Signs by the doors: the lobby's, the briefing room's, the detention
  // lift's, the cell block's; hazard stripes by the shaft's.
  { x: 80, y: 96.5, z: 2.4, face: 'W', tex: 'decal-sign' },
  { x: 110.5, y: 97, z: 2.4, face: 'S', tex: 'decal-sign' },
  { x: 167, y: 70, z: 2.4, face: 'S', tex: 'decal-sign' },
  { x: 167.5, y: 44, z: 14.4, face: 'S', tex: 'decal-sign' },
  { x: 193, y: 103, z: 2.4, face: 'E', tex: 'decal-hazard' },
  // Vents low in the long pale walls: the ring corridor's two straights,
  // the lobby, the hub; a sign on the hub's south wall.
  // (None at x 113 on the north side: the blue door is there.)
  { x: 123, y: 97, z: 1.1, face: 'S', tex: 'decal-vent' },
  ...[113, 123].map((x) => ({ x, y: 103, z: 1.1, face: 'N', tex: 'decal-vent' })),
  ...[145, 152].flatMap((x) => [{ x, y: 77, z: 1.1, face: 'S', tex: 'decal-vent' }, { x, y: 83, z: 1.1, face: 'N', tex: 'decal-vent' }]),
  { x: 92, y: 94, z: 1.1, face: 'S', tex: 'decal-vent' }, { x: 91, y: 106, z: 1.1, face: 'N', tex: 'decal-vent' },
  { x: 167, y: 90, z: 1.1, face: 'N', tex: 'decal-vent' }, { x: 173, y: 90, z: 1.1, face: 'N', tex: 'decal-vent' },
  { x: 170, y: 90, z: 2.4, face: 'N', tex: 'decal-sign' },
  // The compactor's walls, streaked and stained down to the sludge.
  ...[[190, 'grime-drip-1'], [194.5, 'grime-streaks-2'], [199, 'grime-drip-2']].flatMap(([x, tex]) => [
    { x, y: 4, z: 1, face: 'S', tex, scale: 2 }, { x: x - 1.5, y: 28, z: 1, face: 'N', tex, scale: 2, flip: true },
  ]),
  ...[[8, 'grime-streaks-1'], [15, 'grime-blotch-1'], [23, 'grime-streaks-3']].flatMap(([y, tex]) => [
    { x: 186, y, z: 1, face: 'E', tex, scale: 2 }, { x: 202, y: y + 2, z: 1, face: 'W', tex, scale: 2, flip: true },
  ]),
];

/**
 * A light column: a lit panel in the wall over (x0, y0)-(x1, y1) and its
 * lamp at (lx, ly), just in front of it.
 */
const column = (x0, y0, x1, y1, lx, ly) => {
  p.rect(x0, y0, x1, y1, { wall: T.wallLight });
  lamps.push({ x: lx, y: ly, radius: 5, light: 56 });
};

// ---------------------------------------------------------------- 1. the hangar
// Docking Bay 326: 32 m by 24 m and 11 m high, its mouth in the station's
// hull, 18 m wide and 7 m high, a magnetic field across it.
const hangar = (extra = {}) => room(0, 22, { floor: T.hangarFloor, side: T.hangarWall, upper: T.hangarWall, light: 144, ...extra });
p.rect(16, 56, 80, 104, hangar());
// Open space: beyond the deck's edge the floor is far below and the sky
// starts just above it, so nothing but stars shows out there (Mark,
// 2026-11-10: just a starfield).
const SPACE_Z = -90;
const space = { floor: T.hull, ceiling: 'sky', floorZ: SPACE_Z, ceilZ: SPACE_Z + 0.5, light: 0, side: T.hull, scenery: true };
p.rect(1, 48, 15, 148, space);
// The mouth: one column of deck under a lintel, the field on its outer
// edge. It's a sky tile: sky only shows between two of them.
p.rect(15, 62, 16, 98, hangar({ ceiling: 'sky', ceilZ: 14, light: 176 }));
p.fence(15, 62, 16, 98, 'W', { tex: T.field });
// Hazard stripes along the mouth, and a pool of light under each lamp bar.
p.rect(16, 62, 18, 98, hangar({ floor: T.hazard, light: 168 }));
for (const x of [28, 48, 68]) for (const y of [68, 92]) p.pool(x, y, 9, 200);
// Painted guide lines in from the mouth, either side of the pad.
for (const y of [72, 86]) p.rect(18, y, 34, y + 2, (x, ty, old) => ({ ...old, floor: T.hazard }));
// Light bars up the walls.
for (const [x, y] of [[20, 55], [34, 55], [46, 55], [60, 55], [74, 55], [30, 104], [54, 104], [62, 104], [74, 104], [80, 61], [80, 91], [80, 95], [15, 59], [15, 101]]) {
  p.rect(x, y, x + 1, y + 1, { wall: T.hangarLight });
  lamps.push({ x: x === 15 ? 16.5 : x === 80 ? 79.5 : x + 0.5, y: y === 55 ? 56.5 : y === 104 ? 103.5 : y + 0.5, z: 3, radius: 6, light: 40 });
}
// Red beacons either side of the mouth, blinking together (and the gallery's).
for (const y of [61, 99]) lamps.push({ x: 16.7, y, z: 9.5, radius: 5, light: 64, fx: 'blink', min: 0, sync: 'mouth' });
for (const y of [115.4, 138.6]) lamps.push({ x: 16.7, y, z: 14.5, radius: 5, light: 64, fx: 'blink', min: 0, sync: 'mouth' });
// The east TIE's cockpit frame being welded: the arc's flicker.
lamps.push({ x: 69, y: 65.4, z: 3.8, radius: 5, light: 96, fx: 'flicker', min: 0 });
// The tiles under the Crow: the way out, once the beam is off.
p.rect(36, 77, 44, 83, (x, y, old) => ({ ...old, tag: 'crow' }));

// The gantry along the south wall, 4 m up: the way back in from the
// unfinished sector. A lift at its west end, resting at the top.
const gantry = hangar({ light: 152, slab: { bottom: 7.5, top: 8, floor: T.grate, ceiling: T.grate, side: T.edge, light: 120 } });
p.rect(24, 100, 60, 104, gantry);
p.fence(24, 100, 60, 101, 'N', railing).fence(59, 100, 60, 104, 'E', railing);
p.rect(20, 100, 24, 104, lift([0, 8], 22, { upper: T.hangarWall }, { start: 1 }));

// 1a. The cargo lift in the deck, down to a store under the wall (secret 1).
p.rect(64, 98, 70, 104, lift([0, -8], 22, { floor: T.hazard, upper: T.hangarWall }));
const store = room(-8, -3, { light: 120, secret: true, upper: T.hangarWall });
p.rect(64, 104, 70, 106, store);
p.rect(60, 106, 74, 112, store);

// 1b. The troop bay behind the north wall: shut until the beam is off.
p.rect(30, 46, 50, 54, room(0, 6, { light: 136 }));
p.rect(38, 54, 42, 56, door(0, { lock: 'remote', tag: 'troops', stayOpen: true, upper: T.hangarWall }));

// ---------------------------------------------------------------- 2. lobby and control room
p.rect(80, 98, 82, 102, door(0, { upper: T.hangarWall }));
p.rect(82, 94, 100, 106, room(0, 6, { light: 168 }));
p.chamfer(82, 94, 100, 106, 2, { wall: T.wall6 }, ['SW', 'SE', 'NE']);
column(86, 106, 88, 107, 87, 105.7);
column(94, 106, 96, 107, 95, 105.7);
column(94, 93, 96, 94, 95, 94.3);
p.rect(86, 90, 90, 94, lift([0, 8], 14));
// The control room, 4 m over the deck, its window on the hangar.
p.rect(82, 64, 98, 90, room(8, 14, { light: 152 }));
p.chamfer(82, 64, 98, 90, 2, { wall: T.wall6 }, ['NE', 'SE']);
p.rect(80, 66, 82, 88, room(9, 12, { light: 152, side: T.hangarWall, upper: T.hangarWall }));
p.fence(80, 66, 81, 88, 'W', { tex: T.window });
p.rect(84, 64, 96, 65, room(8, 14, { light: 176, lightFx: 'glow', lightMin: 136 }));
p.rect(84, 63, 96, 64, { wall: T.screen });
// The terminal: it opens the ring door.
p.rect(98, 76, 99, 78, {
  wall: T.switchOff,
  switchTo: T.switchOn,
  use: [
    { action: 'openDoors', tag: 'ring' },
    { action: 'message', text: 'PRISONER: DETENTION BLOCK AA-19. TRACTOR BEAM 6: SHAFT 12, COUPLING TERMINAL. RING CORRIDOR UNSEALED.' },
  ],
});
p.rect(100, 98, 102, 102, door(0, { lock: 'remote', tag: 'ring', stayOpen: true }));

// ---------------------------------------------------------------- 3. the ring corridor
const hall = (extra = {}) => room(0, 6, extra);
// East from the lobby, then north-east at 45 degrees, then east to the hub.
// Along the slant x + y is constant: the band's edges are angled walls.
for (let y = 60; y < 112; y++) {
  for (let x = 118; x < 152; x++) {
    const s = x + y;
    const d = x - y;
    if (d < 24 || d > 68 || !p.get(x, y).wall) continue;
    if (s >= 222 && s < 230) p.set(x, y, hall());
    else if (s === 221) p.set(x, y, { ...hall(), wall: T.wall6, diagonal: 'NW' });
    else if (s === 230) p.set(x, y, { ...hall(), wall: T.wall6, diagonal: 'SE' });
  }
}
p.rect(102, 97, 126, 103, hall());
p.rect(142, 77, 158, 83, hall());
p.rect(158, 78, 160, 82, door(0));
// Light columns on both sides and a lit panel in the ceiling between each pair.
for (const x of [106, 118]) {
  column(x, 96, x + 2, 97, x + 1, 97.3);
  column(x, 103, x + 2, 104, x + 1, 102.7);
  p.rect(x, 99, x + 2, 101, hall({ ceiling: T.ceilingLight, light: 208 }));
}
for (const x of [148, 154]) {
  column(x, 76, x + 2, 77, x + 1, 77.3);
  column(x, 83, x + 2, 84, x + 1, 82.7);
  p.rect(x, 79, x + 2, 81, hall({ ceiling: T.ceilingLight, light: 208 }));
}
// (The middle panel on the slant has a fault: it flickers.)
for (const [x, y, faulty] of [[130, 96], [135, 91, true], [140, 86]]) {
  p.rect(x - 1, y - 1, x + 1, y + 1, hall({ ceiling: T.ceilingLight, light: 208, ...(faulty && { lightFx: 'flicker', lightMin: 136 }) }));
  lamps.push({ x, y, radius: 5, light: 48, ...(faulty && { fx: 'flicker', min: 0 }) });
}

// 3b. The briefing room, behind the blue door. Secret 2 behind its screens.
p.rect(104, 78, 122, 96, room(0, 6, { light: 136 }));
p.chamfer(104, 78, 122, 96, 3, { wall: T.wall6 });
p.pool(113, 87, 5, 200);
// Coming up to the table you read what's on it.
p.rect(108, 91, 118, 93, (x, y, old) => (old.wall ? old : { ...old, tag: 'file' }));
p.rect(112, 96, 114, 97, narrow(0, { door: T.doorBlue, lock: 'blue' }));
p.rect(108, 77, 118, 78, { wall: T.screen });
p.rect(112, 77, 114, 78, { door: T.screen, secret: true, floor: T.floor, ceiling: T.ceiling, floorZ: 0, ceilZ: 6, light: 120 });
p.rect(110, 73, 116, 77, room(0, 4, { light: 120, secret: true }));

// ---------------------------------------------------------------- 4. the lift hub
p.rect(160, 70, 180, 90, room(0, 8, { light: 168 }));
p.chamfer(160, 70, 180, 90, 6, { wall: T.wall8 });
p.pool(170, 80, 7, 216);
// A light column in the middle, so no door looks straight at another.
p.rect(168, 78, 172, 82, { wall: T.wallLight });
for (const [x, y] of [[170, 77.3], [170, 82.7], [167.3, 80], [172.7, 80]]) lamps.push({ x, y, z: 3, radius: 6, light: 48 });
// North: the detention lift, a door at each stop.
p.rect(168, 68, 172, 70, door(0));
p.rect(168, 64, 172, 68, lift([0, 12], 18));
// (The top door is sealed by the alarm: the chute is the way out then.)
p.rect(168, 62, 172, 64, door(12, { tag: 'det-lift' }));
// East: the pump room's door, opened from the far side.
p.rect(180, 78, 182, 82, door(0, { lock: 'remote', tag: 'hub-east', stayOpen: true }));
p.rect(182, 78, 186, 82, hall({ upper: T.wallDark }));

// ---------------------------------------------------------------- 5. detention block AA-19
const DET = 12;
const det = (floorZ, ceilZ, extra = {}) => room(floorZ, ceilZ, { floor: T.detFloor, side: T.detWall, upper: T.detWall, light: 120, ...extra });
p.rect(160, 44, 180, 62, det(DET, DET + 5, { light: 136 }));
p.chamfer(160, 44, 180, 62, 4, { wall: T.detWall });
p.pool(170, 53, 5, 184);
// Where the alarm's troopers come in, by the lift door.
for (const x of [166, 174]) p.rect(x, 58, x + 1, 59, (tx, ty, old) => ({ ...old, tag: 'alarm' }));
// The red door, and the cell corridor: a sunken lane between two kerbs,
// its floor a grid of red light, five cells a side.
p.rect(169, 43, 171, 44, narrow(DET, { door: T.doorRed, lock: 'red', upper: T.detWall }));
p.rect(167, 12, 173, 43, det(DET - 0.5, DET + 4));
p.rect(169, 12, 171, 42, det(DET - 1, DET + 4, { floor: T.detFloorLight, light: 168, tag: 'lane' }));
for (let k = 0; k < 5; k++) {
  const y = 14 + 6 * k;
  for (const [x0, x1, dx] of [[161, 166, 166], [174, 179, 173]]) {
    p.rect(x0, y, x1, y + 4, det(DET - 0.5, DET + 3, { light: 104 }));
    p.rect(dx, y + 1, dx + 1, y + 3, narrow(DET - 0.5, { upper: T.detWall }));
  }
}
// Secret 3: a loose panel at the back of the second cell on the east.
p.rect(179, 21, 180, 23, { door: T.detWall, secret: true, floor: T.detFloor, ceiling: T.ceiling, floorZ: DET - 0.5, ceilZ: DET + 1.5, light: 104 });
p.rect(180, 20, 183, 24, det(DET - 0.5, DET + 2, { light: 104, secret: true }));
// The chute: a hatch in the end wall, opened once Rusk has spoken, and a
// steep duct down to the compactor, 0.75 a step (4 high: under a lower
// roof a body a tile wide catches its head on the next step's).
p.rect(169, 10, 171, 12, narrow(DET - 1, { lock: 'remote', tag: 'chute', stayOpen: true, jamb: T.doorJamb, upper: T.detWall }));
const duct = (z) => ({ floor: T.grate, ceiling: T.grate, floorZ: z, ceilZ: z + 4, light: 104, side: T.greeble, upper: T.greeble });
p.rect(169, 4, 171, 10, duct(DET - 1));
p.stairs(171, 4, 186, 6, 'E', DET - 1.75, -0.75, duct);

// ---------------------------------------------------------------- 6. the trash compactor
const compactor = (extra = {}) => room(-6, 4, { floor: T.sludge, side: T.compactorWall, upper: T.compactorWall, light: 136, ...extra });
p.rect(186, 4, 202, 28, compactor());
p.rect(191, 11, 197, 17, compactor({ light: 192, lightFx: 'flicker', lightMin: 112 }));
// The pressure hatch, a step up out of the sludge.
p.rect(196, 28, 198, 30, narrow(-5.5, { jamb: T.doorJamb, upper: T.compactorWall }));

// ---------------------------------------------------------------- 7. maintenance and the pump room
const tunnel = (z, extra = {}) => ({ floor: T.grate, ceiling: T.ceiling, floorZ: z, ceilZ: z + 4, light: 120, side: T.pipes, upper: T.pipes, ...extra });
p.rect(195, 30, 199, 34, tunnel(-5.5));
p.stairs(195, 34, 199, 45, 'S', -5, 0.5, tunnel);
p.rect(195, 45, 199, 64, tunnel(0));
for (const y of [32, 48, 58]) p.pool(197, y + 0.5, 3, 176);
p.rect(195, 64, 199, 66, door(0, { upper: T.pipes }));
p.rect(186, 66, 204, 90, room(0, 6, { floor: T.grate, light: 144, upper: T.wallDark }));
p.chamfer(186, 66, 204, 90, 3, { wall: T.wallDark });
p.pool(195, 78, 6, 192);
// Four pumps, floor to ceiling.
for (const x of [190, 198]) for (const y of [70, 84]) p.rect(x, y, x + 2, y + 2, { wall: T.pipes });
// The switch that opens the hub's east door: the way back.
p.rect(204, 77, 205, 79, {
  wall: T.switchOff,
  switchTo: T.switchOn,
  use: [{ action: 'openDoors', tag: 'hub-east' }, { action: 'message', text: 'LIFT HUB ACCESS UNSEALED.' }],
});
p.rect(193, 90, 197, 92, door(0, { upper: T.wallDark }));
p.rect(193, 92, 197, 112, tunnel(0, { light: 136 }));

// ---------------------------------------------------------------- 8. the tractor beam shaft
// A round shaft with no bottom you can see, 22 across its radius. A ledge
// 4 wide round its wall and one 3.5 wide round the column in its middle
// are the tops of solid rings (angled walls with a `wallTop`), so their
// rims are smooth circles and nothing fences them. A bridge (a slab, 2 m
// wide) from the north ledge to the column. The terminal is in a block
// on the column's far side.
const [SX, SY] = [178, 122];
const SHAFT = { r: 22, ledge: 18, island: 7.5, column: 4 };
const pit = room(-150, 30, { floor: T.grate, side: T.wallDark, upper: T.wallDark, light: 112 });
const ledge = { ...pit, floorZ: 0, light: 152 };
const walk = { ...pit, light: 152, slab: { bottom: -0.5, top: 0, floor: T.grate, ceiling: T.grate, side: T.edge, light: 96 } };
kit.circle(SX, SY, SHAFT.r, { inside: ledge, wall: { wall: T.wallDark }, seam: 90 });
// The ways in: the tunnel's mouth in the north-east, the west door.
for (let y = 100; y < 112; y++) for (let x = 193; x < 197; x++) if (p.get(x, y).line) p.set(x, y, tunnel(0, { light: 136 }));
p.rect(156, 120, 157, 124, ledge);
// Light columns round the wall, a lamp at each.
for (let k = 0; k < 8; k++) {
  const a = ((k + 0.5) * Math.PI) / 4;
  const [x, y] = [Math.floor(SX + Math.cos(a) * (SHAFT.r - 0.3)), Math.floor(SY + Math.sin(a) * (SHAFT.r - 0.3))];
  if (p.get(x, y).line) p.set(x, y, { ...p.get(x, y), wall: T.wallLight });
  lamps.push({ x: SX + Math.cos(a) * (SHAFT.r - 2), y: SY + Math.sin(a) * (SHAFT.r - 2), z: 3, radius: 7, light: 56 });
}
kit.circle(SX, SY, SHAFT.ledge, { inside: pit, wall: { wall: T.wallDark, wallTop: 0 } });
kit.circle(SX, SY, SHAFT.island, { inside: ledge, wall: { wall: T.wallDark, wallTop: 0 }, open: 'out' });
kit.circle(SX, SY, SHAFT.column, { inside: { wall: T.wallLight }, wall: { wall: T.wallLight }, open: 'out' });
p.rect(176, 103, 180, 116, walk);
// The column's glow, pulsing until the beam is off.
for (const [x, y] of [[178, 116], [178, 128.5], [172, 122], [184, 122]]) {
  lamps.push({ x, y, z: 2, radius: 9, light: 88, fx: 'glow', min: 24, tag: 'beam-lamps' });
}
// The terminal's block, proud of the column's south side.
p.rect(176, 125, 180, 127, { wall: T.wallDark });
p.rect(177, 126, 179, 127, {
  wall: T.switchOff,
  switchTo: T.switchOn,
  use: [
    { action: 'setFlag', flag: 'beam-off' },
    { action: 'sound', id: 'beam-down' },
    { action: 'setLight', tag: 'beam-lamps', light: 16, lightFx: 'none' },
    { action: 'openDoors', tag: 'out' },
    { action: 'openDoors', tag: 'troops' },
    { action: 'message', text: "TRACTOR BEAM 6 OFFLINE. JAN: THAT'S IT, WE'RE LOOSE. THE UNFINISHED DECKS WEST OF YOU RUN BACK TO THE BAY." },
  ],
});
p.rect(154, 120, 156, 124, door(0, { lock: 'remote', tag: 'out', stayOpen: true, upper: T.wallDark }));

// ---------------------------------------------------------------- 9. the unfinished sector
const bare = (floorZ, ceilZ, extra = {}) => room(floorZ, ceilZ, { floor: T.grate, side: T.girder, upper: T.girder, light: 120, ...extra });
// 9a. The bare deck: plates missing, so the way across zigzags (two steps
// of 0.75 in each gap to walk out by: you can't walk up more than 0.8).
p.rect(112, 112, 154, 136, bare(0, 8));
const gap = (z) => bare(z, 8, { light: 88 });
p.rect(122, 112, 126, 128, gap(-2.25));
p.rect(122, 126, 126, 127, gap(-1.5));
p.rect(122, 127, 126, 128, gap(-0.75));
p.rect(136, 120, 140, 136, gap(-2.25));
p.rect(136, 121, 140, 122, gap(-1.5));
p.rect(136, 120, 140, 121, gap(-0.75));
for (const [x, y] of [[148, 122], [131, 116], [130, 131]]) lamps.push({ x, y, radius: 9, light: 112 });
// A girder post being welded: the arc's flicker.
lamps.push({ x: 118, y: 133.2, z: 3.8, radius: 5, light: 96, fx: 'flicker', min: 0 });
// The west work lamp is on the blink.
lamps.push({ x: 116, y: 123, radius: 9, light: 112, fx: 'flicker', min: 32 });
p.rect(108, 120, 112, 126, bare(0, 6));
// Cut cables hang from the ceilings where the panels aren't on; the live
// ones spit sparks and light the deck in flashes. [x, y, ceiling].
const LIVE_CABLES = [[138, 127, 8], [120, 118, 8], [110, 124.5, 6], [45.2, 110, 12]];
const DEAD_CABLES = [[146, 118, 8], [129, 123, 8], [116, 132, 8], [150, 130, 8], [80, 116.5, 16]];
for (const [x, y] of LIVE_CABLES) lamps.push({ x, y, radius: 6, light: 72, fx: 'flicker', min: 0 });
// 9b. The panel yard, and stairs up its north wall to 4 m.
p.rect(78, 114, 108, 140, bare(0, 16));
p.stairs(82, 114, 98, 118, 'W', 0.5, 0.5, (z) => bare(z, 16));
p.rect(78, 114, 82, 118, bare(8, 16));
for (const [x, y] of [[100, 124], [88, 132], [84, 121]]) lamps.push({ x, y, radius: 9, light: 112 });
p.rect(76, 114, 78, 118, door(8, { upper: T.girder }));
// 9c. The open hull gallery: its outer wall isn't on yet, only a field
// between you and the stars.
p.rect(16, 114, 76, 140, bare(8, 20, { light: 112 }));
p.rect(15, 116, 16, 138, bare(8, 18, { ceiling: 'sky', light: 152 }));
p.fence(15, 116, 16, 138, 'W', { tex: T.field });
for (const x of [28, 44, 60]) lamps.push({ x, y: 128, radius: 10, light: 112 });
// North to the hangar's gantry.
p.rect(44, 106, 48, 114, bare(8, 12));
p.rect(44, 104, 48, 106, door(8, { upper: T.hangarWall }));

// ---------------------------------------------------------------- the walls
// Every room is dug out of the station's dark structure; the walls round
// it take its own panelling (its `upper`: pale in the corridors, black in
// detention, bare truss where the station isn't finished).
const lining = [];
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    if (p.get(x, y) !== hull) continue;
    let tex = null;
    for (let dy = -1; dy <= 1 && !tex; dy++) {
      for (let dx = -1; dx <= 1 && !tex; dx++) {
        const n = p.get(x + dx, y + dy);
        if (n && !n.wall && !n.door && n.ceiling !== 'sky' && n.upper) tex = n.upper;
      }
    }
    if (tex && tex !== T.wallDark) lining.push([x, y, { wall: tex }]);
  }
}
for (const [x, y, c] of lining) p.set(x, y, c);

// ---------------------------------------------------------------- things
const at = (type, x, y, extra = {}) => ({ type, x, y, ...extra });
// Skills (docs/mission4.md has the table).
const EASY = [1, 2];
const NOT_EASIEST = [2, 3, 4, 5];
const NORMAL_UP = [3, 4, 5];
const HARD = [4, 5];
const list = [
  // 1. The hangar: quiet at the start. The Crow in the middle, nose to the mouth.
  at('player', 47.5, 84.5, { angle: 0 }),
  at('moldy-crow', 40, 80, { angle: 180 }),
  at('mouse-droid', 58.5, 76.5), at('mouse-droid', 30.5, 92.5),
  // Three TIE fighters in their cradles along the north wall, a rack over
  // each; a shuttle and cargo in the south-east; lamp bars under the roof.
  ...[25, 55, 69].flatMap((x) => [at('tie-fighter', x, 63.5, { angle: 270 }), at('tie-rack', x, 63.5, { angle: 270, z: 12.3 })]),
  at('lambda-shuttle', 66.5, 82.5, { angle: 180 }),
  at('ds-container', 74, 92.5, { angle: 90 }), at('ds-container', 76.5, 88, { angle: 0 }),
  at('ds-crate', 71, 95.5), at('ds-crate-tall', 72.8, 95.5), at('ds-crate', 60.5, 97),
  at('ds-crate', 77, 60.5), at('ds-crate', 78.2, 62.4, { angle: 20 }), at('ds-crate-tall', 78.4, 58.2),
  at('ds-crate', 18.5, 100), at('ds-crate-tall', 18.5, 58.5), at('ds-container', 22, 58.2, { angle: 0 }),
  ...[28, 48, 68].flatMap((x) => [68, 92].map((y) => at('ds-ceiling-lamp-bar', x, y, { z: 22 }))),
  // The trapezoid surrounds of the hangar's doors.
  at('ds-doorframe', 79.85, 100, { angle: 180 }), at('ds-doorframe', 40, 56.15, { angle: 270 }),
  at('thermal-detonator', 75.5, 96.5),
  // The deck crew's work: the two west TIEs fuelling from points in the
  // wall, the east one's cockpit frame being welded from a service stand,
  // a power droid feeding the torch, a tool cart; beacons at the mouth.
  at('ds-fuel-socket', 27.5, 56.02, { angle: 270 }), at('ds-fuel-socket', 57.5, 56.02, { angle: 270 }),
  at('ds-service-stand-welding', 69, 66.3, { angle: 90 }),
  at('power-droid', 71.6, 67.4, { angle: 150 }), at('ds-tool-cart', 66.4, 67.6, { angle: 20 }),
  at('ds-beacon-field', 16.02, 61, { angle: 0, z: 10 }), at('ds-beacon', 16.02, 99, { angle: 0, z: 10 }),
  // A trooper walking the deck between the fighters and the shuttle.
  at('stormtrooper', 62.5, 70.5, { angle: 180, skill: NORMAL_UP, beat: { patrol: [[74.5, 70.5], [50.5, 70.5]], idleTime: [2, 4] } }),
  // 1a. The store (secret).
  at('shield-unit', 62, 109), at('energy-cell', 70.5, 109.5), at('energy-cell', 72, 108.5),
  // 1b. The troop bay: the squad that comes out when the beam is off. Their
  // lockers along the back wall, benches either side of the door.
  ...[33, 37.5, 42.5, 47].map((x) => at('ds-locker-bank', x, 46.02, { angle: 270 })),
  at('ds-bench', 33.5, 52.6, { angle: 90 }), at('ds-bench', 46.5, 52.6, { angle: 90 }),
  at('stormtrooper', 34.5, 49.5, { angle: 270 }), at('stormtrooper', 38.5, 50.5, { angle: 270 }),
  at('stormtrooper', 42.5, 49.5, { angle: 270 }), at('stormtrooper', 46.5, 50.5, { angle: 270, skill: NOT_EASIEST }),
  at('officer', 40.5, 48, { angle: 270, skill: NOT_EASIEST }),
  at('stormtrooper', 32.5, 51.5, { angle: 270, skill: NORMAL_UP }), at('stormtrooper', 47.5, 48, { angle: 270, skill: HARD }),
  at('probe-droid', 40, 51.5, { skill: HARD }),
  // 2. The lobby and the control room; the deck officer carries the blue keycard.
  at('stormtrooper', 92.5, 97.5, { angle: 180 }),
  at('stormtrooper', 96.5, 103.5, { angle: 180, skill: NOT_EASIEST }),
  at('officer', 90.5, 72.5, { angle: 270, drops: ['keycard-blue'] }),
  at('stormtrooper', 94.5, 82.5, { angle: 270 }),
  at('stormtrooper', 85.5, 68.5, { angle: 270, skill: NORMAL_UP }),
  at('ds-console', 83.2, 71, { angle: 0 }), at('ds-console', 83.2, 77, { angle: 0 }), at('ds-console', 83.2, 83, { angle: 0 }),
  at('ds-console-wall', 97.9, 68, { angle: 180 }), at('ds-console-wall', 97.9, 86, { angle: 180 }),
  // The plotting table: the deck officer watching the ship they took.
  at('ds-holo-table', 91, 78), at('ds-holo-ship', 91, 78, { z: 8 + 1.35 }),
  at('med-kit', 95.5, 66.5), at('energy-cell', 84.5, 88.5),
  // The lobby's security post, watching the door in from the hangar; the
  // doors' control panels.
  at('ds-console', 97.6, 96.6, { angle: 180 }),
  at('ds-door-panel', 82.02, 97, { angle: 0 }), at('ds-door-panel', 99.98, 103, { angle: 180 }),
  at('ds-door-panel', 115.2, 97.02, { angle: 270 }), at('ds-door-panel', 172.6, 44.02, { angle: 270, z: DET }),
  // 3. The ring corridor: a pair marching the first straight in step.
  ...[[98.5], [101.5, NOT_EASIEST]].map(([y, skill]) => at('stormtrooper', 122.5, y, {
    angle: 180, ...(skill && { skill }), beat: { patrol: [[106.5, y], [124.5, y]], idleTime: [3, 3] },
  })),
  at('stormtrooper', 134.5, 92.5, { angle: 225, skill: NOT_EASIEST }),
  at('officer', 148.5, 80.5, { angle: 180, skill: NORMAL_UP, beat: { patrol: [[143.5, 80.5], [156.5, 80.5]], idleTime: [3, 6] } }),
  at('stormtrooper', 152.5, 79, { angle: 180 }),
  at('stormtrooper', 138.5, 88, { angle: 225, skill: HARD }),
  at('mouse-droid', 112.5, 100.5), at('mouse-droid', 144.5, 81.5),
  at('ds-doorframe', 102.15, 100, { angle: 0 }), at('ds-doorframe', 157.85, 80, { angle: 180 }),
  at('energy-cell', 104.5, 102),
  // 3b. The briefing room.
  at('officer', 110.5, 84.5, { angle: 270 }), at('officer', 116.5, 86.5, { angle: 270, skill: NOT_EASIEST }),
  at('stormtrooper', 113.5, 81.5, { angle: 270, skill: NORMAL_UP }),
  at('ds-table', 113, 87),
  // Over it, the project: a sphere in blue light, half of it not built yet.
  at('ds-holo-station', 113, 87, { z: 2.15 }),
  ...Array.from({ length: 8 }, (_, k) => at('ds-chair', 113 + 4.3 * Math.cos((k * Math.PI) / 4), 87 + 4.3 * Math.sin((k * Math.PI) / 4), { angle: 180 - k * 45 })),
  at('shield-unit', 119, 81), at('med-kit', 107, 92.5, { skill: [1, 2, 3] }),
  at('concussion-rifle', 113, 75), at('power-cell', 111, 74.5), at('power-cell', 115, 74.5),
  // 4. The hub.
  // One walks round the column.
  at('stormtrooper', 166.5, 74.5, { angle: 0, beat: { patrol: [[164.5, 74.5], [175.5, 74.5], [175.5, 85.5], [164.5, 85.5]], loop: true, idleTime: [1, 2] } }),
  at('stormtrooper', 174.5, 84.5, { angle: 180 }),
  at('stormtrooper', 170.5, 73.5, { angle: 270, skill: NORMAL_UP }),
  at('probe-droid', 175.5, 80, { skill: HARD }),
  at('ds-doorframe', 160.15, 80, { angle: 0 }), at('ds-doorframe', 170, 70.15, { angle: 270 }), at('ds-doorframe', 179.85, 80, { angle: 180 }),
  at('med-kit', 163.5, 86.5), at('energy-pack', 176.5, 73.5),
  // 5. Detention: the officer at the desk carries the red keycard.
  at('officer', 170.5, 50.5, { angle: 270, drops: ['keycard-red'] }),
  at('stormtrooper', 164.5, 56.5, { angle: 270 }), at('stormtrooper', 176.5, 56.5, { angle: 270 }),
  at('stormtrooper', 170.5, 46.5, { angle: 270, skill: NORMAL_UP }),
  at('interrogation-droid', 165, 48, { skill: NOT_EASIEST }),
  at('ds-desk', 170, 54, { angle: 90 }), at('ds-camera', 162, 46, { angle: 315, z: DET + 5 }), at('ds-camera', 178, 46, { angle: 225, z: DET + 5 }),
  at('med-kit', 162.5, 52.5), at('energy-cell', 177.5, 49.5),
  at('interrogation-droid', 170, 26, { skill: NORMAL_UP }),
  at('stormtrooper', 170, 18, { angle: 270, skill: HARD }),
  at('interrogation-droid', 176.5, 34, { ambush: true, skill: HARD }),
  at('rusk', 163, 16, {
    angle: 0, tag: 'rusk', name: 'RUSK',
    talk: [{ lines: ['KATARN? YOU CAME UP HERE FOR ME?', "THEY'LL HAVE THE LIFT BY NOW. THE WASTE HATCH, END OF THE ROW. GO. I'LL KEEP BEHIND YOU."], set: 'rusk-free' }],
  }),
  at('prisoner', 176.5, 40, { angle: 180 }),
  // A bunk in each cell (not over the loose panel in the second on the east).
  ...[0, 1, 2, 3, 4].flatMap((k) => [
    at('ds-bunk', 161.02, 16 + 6 * k, { angle: 0 }),
    ...(k === 1 ? [] : [at('ds-bunk', 178.98, 16 + 6 * k, { angle: 180 })]),
  ]),
  at('energy-pack', 181.5, 22), at('thermal-detonator', 181.5, 21), at('thermal-detonator', 181.5, 23),
  at('med-kit', 176.5, 28, { skill: EASY }),
  // 6. The compactor.
  at('dianoga-eye', 194.5, 19.5, { angle: 100 }),
  at('ds-crate', 190, 9, { angle: 30 }), at('ds-panel-stack', 198, 22, { angle: 70 }), at('ds-cable-reel', 191, 20),
  at('ds-girder-beam', 196, 9, { angle: 40, z: -5.8 }), at('ds-panel-stack', 189, 14, { angle: 10 }),
  at('energy-cell', 199.5, 8.5), at('med-kit', 189, 24.5),
  // 7. Maintenance and the pump room.
  at('stormtrooper', 197, 52.5, { angle: 90, skill: NOT_EASIEST }),
  at('stormtrooper', 189.5, 74.5, { angle: 90, ambush: true }), at('stormtrooper', 200.5, 82.5, { angle: 90, ambush: true }),
  at('probe-droid', 195, 80, { skill: NORMAL_UP }),
  at('coolant-tank-running', 189, 77), at('coolant-tank', 201, 82),
  // Leaking pipes: in the compactor, up the tunnels, on three of the pumps.
  at('ds-steam-pipe', 186.02, 20, { angle: 0 }), at('ds-steam-pipe', 201.98, 12, { angle: 180 }),
  at('ds-steam-pipe', 195.02, 32, { angle: 0 }), at('ds-steam-pipe', 195.02, 50, { angle: 0 }), at('ds-steam-pipe', 198.98, 57, { angle: 180 }),
  at('ds-steam-pipe', 191, 72.02, { angle: 270 }), at('ds-steam-pipe', 199, 83.98, { angle: 90 }), at('ds-steam-pipe', 197.98, 71, { angle: 180 }),
  at('ds-steam-pipe', 193.02, 96, { angle: 0 }),
  at('energy-pack', 189.5, 80.5), at('med-kit', 201.5, 78),
  // 8. The shaft: troopers round the ledge, probe droids over the drop.
  at('stormtrooper', 161, 112, { angle: 0, beat: { patrol: [[160.7, 112], [158.1, 120.3], [159.2, 128.8]], idleTime: [2, 4] } }), at('stormtrooper', 195.5, 131, { angle: 180 }),
  at('stormtrooper', 171, 140.5, { angle: 90, skill: NOT_EASIEST }),
  at('stormtrooper', 185.5, 140.3, { angle: 90, skill: HARD }),
  at('probe-droid', 166, 112, { z: 1, skill: NORMAL_UP }), at('probe-droid', 190, 134, { z: 1, skill: HARD }),
  at('tractor-terminal', 176.5, 127.05, { angle: 270, z: 0 }), at('tractor-terminal', 179.5, 127.05, { angle: 270, z: 0 }),
  // Lit rings round the column, down into the shaft and up out of sight.
  // (The ones by the walks carry the beam's power: they crackle and hum
  // until it's off.)
  ...[-26, -12, 3.2, 11, 20].map((z) => at(z === 3.2 || z === 11 ? 'ds-beam-ring-live' : 'ds-beam-ring', SX, SY, { z })),
  at('med-kit', 191.5, 107.5), at('energy-cell', 183.5, 125),
  // 9. The unfinished sector.
  at('stormtrooper', 146.5, 116.5, { angle: 0, beat: { patrol: [[146.5, 116.5], [146.5, 129]], idleTime: [2, 5] } }), at('stormtrooper', 130.5, 132.5, { angle: 0 }),
  at('stormtrooper', 116.5, 116.5, { angle: 0, skill: NOT_EASIEST }),
  at('probe-droid', 131, 122, { skill: NORMAL_UP }),
  at('energy-cell', 124, 120), // down in the first gap
  at('stormtrooper', 100.5, 134.5, { angle: 0 }), at('stormtrooper', 80.5, 116, { angle: 0, skill: NOT_EASIEST }),
  at('officer', 90.5, 126.5, { angle: 0, skill: NORMAL_UP }),
  // Work lamps where the light is, girders up through the bare deck,
  // panels and cable waiting to go on.
  at('work-lamp', 148, 123, { angle: 200 }), at('work-lamp', 131, 115, { angle: 270 }), at('work-lamp', 130, 132.5, { angle: 90 }), at('work-lamp', 116, 124.5, { angle: 0 }),
  at('work-lamp', 100, 125, { angle: 200 }), at('work-lamp', 88, 133, { angle: 45 }), at('work-lamp', 84, 122, { angle: 270 }),
  // (A beam across the top of each post.)
  ...[118, 130, 144].flatMap((x) => [114, 134].flatMap((y) => [at('ds-girder-post', x, y), at('ds-girder-beam', x, y, { angle: 90, z: 6 })])),
  ...[84, 96].flatMap((x) => [124, 136].flatMap((y) => [at('ds-girder-post', x, y), at('ds-girder-beam', x, y, { angle: 90, z: 6 })])),
  ...LIVE_CABLES.map(([x, y, z], k) => at('ds-cables-live', x, y, { z, angle: 70 * k })),
  ...DEAD_CABLES.map(([x, y, z], k) => at('ds-cables', x, y, { z, angle: 40 + 110 * k })),
  at('ds-panel-stack', 146, 132, { angle: 15 }), at('ds-panel-stack', 114, 133), at('ds-cable-reel', 150, 114.5), at('ds-cable-reel', 119, 121),
  at('ds-panel-stack', 96, 128), at('ds-panel-stack', 98.6, 129, { angle: 80 }), at('ds-crate', 86, 136), at('ds-cable-reel', 104, 116),
  at('ds-crate-tall', 92, 138), at('ds-container', 102, 136, { angle: 0 }),
  ...[24, 36, 52, 64].flatMap((x) => [117, 137].flatMap((y) => [at('ds-girder-post', x, y), at('ds-girder-beam', x, y, { angle: 90, z: 14 })])),
  at('work-lamp', 28, 129, { angle: 180 }), at('work-lamp', 44, 127, { angle: 180 }), at('work-lamp', 60, 129, { angle: 180 }),
  at('ds-panel-stack', 34, 122), at('ds-panel-stack', 56, 134, { angle: 60 }), at('ds-cable-reel', 21, 132), at('ds-crate', 68, 118),
  at('med-kit', 104.5, 138), at('energy-pack', 80, 138),
  // Work going on: a post on the bare deck welded from a stand; in the
  // gallery a panel hoisted up toward the truss, a cart below.
  at('ds-service-stand-welding', 118, 132.4, { angle: 270 }), at('ds-tool-cart', 116.2, 131.6, { angle: 300 }),
  at('ds-panel-hoisted', 22, 128, { angle: 0, z: 13 }), at('ds-tool-cart', 24.5, 131.5, { angle: 100 }),
  at('stormtrooper', 62.5, 124.5, { angle: 0, beat: { patrol: [[64.5, 124.5], [22.5, 124.5]], idleTime: [2, 4] } }), at('stormtrooper', 40.5, 134.5, { angle: 0, skill: NOT_EASIEST }),
  at('stormtrooper', 24.5, 120.5, { angle: 0, skill: NORMAL_UP }),
  at('probe-droid', 30, 128, { skill: HARD }),
  at('med-kit', 46, 110), at('shield-unit', 20.5, 137.5, { skill: [1, 2, 3] }),
  // Beacons at either end of the gallery's field, the north one humming.
  at('ds-beacon-field', 16.02, 115.4, { angle: 0, z: 15 }), at('ds-beacon', 16.02, 138.6, { angle: 0, z: 15 }),
];

export default defineLevel({
  id: 'm4',
  mapLabel: 'M4',
  name: 'THE BATTLE STATION',
  music: 'station',
  sky: T.sky,
  skyWrap: 1,
  par: 600,
  ...p.build(),
  lights: lamps,
  decals,
  hangings: [
    // Fuel hoses from the wall to the two west TIEs' balls.
    ...[25, 55].map((x) => ({ type: 'hose', from: [x + 2.75, 56.45, 0.6], to: [x + 0.3, 62.9, 3.6], sag: 1.6 })),
    // The power droid's lead up to the welder's torch.
    { type: 'cable', from: [71.4, 67.2, 0.7], to: [69.5, 66.1, 3.45], sag: 0.5 },
    // The hoisted panel's cables up to the gallery's ceiling.
    ...[-0.85, 0.85].map((dy) => ({ type: 'cable', from: [22, 128 + dy, 15.1], to: [22, 128 + dy * 1.4, 19.95], sag: 0.05 })),
  ],
  things: [],
  list,
  triggers: [
    { on: 'start', do: [{ action: 'message', text: "JAN: THEY TOOK RUSK. I CAN'T LIFT WITH THAT BEAM ON US. THE ROOM OVER THE BAY, BEHIND THE GLASS: START THERE." }] },
    { on: 'talk', tag: 'rusk', if: 'rusk-free', do: [
      { action: 'openDoors', tag: 'chute' },
      { action: 'spawn', thing: 'stormtrooper', tag: 'alarm' },
      { action: 'sound', id: 'alarm-klaxon' },
      { action: 'setLight', tag: 'lane', light: 216, lightFx: 'glow', lightMin: 88 },
      { action: 'lockDoors', tag: 'det-lift' },
      { action: 'closeDoors', tag: 'det-lift' },
      { action: 'message', text: 'ALARM: DETENTION BLOCK AA-19. LIFT SEALED. THE WASTE HATCH IS OPEN.' },
    ] },
    { on: 'enter', tag: 'file', do: [{ action: 'message', text: "ON THE TABLE: 'DARK TROOPER PROJECT, PHASE ONE. APPROVED. FIELD TRIALS TO FOLLOW THE TEST OF THIS STATION'S PRIMARY WEAPON.'" }] },
    { on: 'enter', tag: 'crow', unless: 'beam-off', once: false, do: [{ action: 'message', text: "JAN: NOT WHILE THAT BEAM'S ON US." }] },
    { on: 'enter', tag: 'crow', if: 'beam-off', do: [{ action: 'message', text: 'JAN: RUSK IS ABOARD. HOLD ON TO SOMETHING.' }, { action: 'exit' }] },
  ],
});
