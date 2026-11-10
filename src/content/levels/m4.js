import { defineLevel } from '../../engine/defs.js';
import { Painter } from './lib/painter.js';
import { valueNoise } from './lib/noise.js';

// MISSION 4: THE BATTLE STATION. The layout, route and numbers are in
// docs/mission4.md (area numbers below match its table). Painted in code on
// the fine grid (1 tile = 0.5 m; the player is 1.7 tall and 1 wide).

const W = 208;
const H = 152;

// ---- The kit's textures (docs/mission4.md, "The kit"). Until the station's
// own set (`ds-*`) is made, the Imperial base's stand in.
const T = {
  wall: 'imp-panel',
  wallLight: 'imp-lights',
  wallDark: 'imp-panel-dark',
  hangarWall: 'imp-panel-dark',
  greeble: 'imp-vent',
  detWall: 'imp-panel-dark',
  compactorWall: 'imp-vent',
  pipes: 'imp-vent',
  girder: 'imp-stripe',
  screen: 'imp-computer',
  floor: 'imp-floor',
  hangarFloor: 'imp-floor',
  hazard: 'lift-floor',
  grate: 'imp-grate',
  detFloor: 'imp-floor',
  detFloorLight: 'imp-ceiling-light',
  sludge: 'water-murky',
  ceiling: 'imp-ceiling',
  ceilingLight: 'imp-ceiling-light',
  liftFloor: 'lift-floor',
  door: 'imp-gate',
  doorJamb: 'imp-gate-jamb',
  doorNarrow: 'imp-door',
  doorRed: 'imp-door-red',
  doorBlue: 'imp-door-blue',
  jamb: 'imp-jamb',
  switchOff: 'imp-switch',
  switchOn: 'imp-switch-on',
  hull: 'imp-panel-dark',
  field: 'imp-cage',
  window: 'imp-bars',
  railing: 'imp-railing',
  edge: 'imp-stripe',
  sky: 'sky-night',
};

const hull = { wall: T.wallDark };
const railing = { tex: T.railing, height: 0.75 };

/** A room: deck, ceiling, its floor and ceiling heights. */
const room = (floorZ, ceilZ, extra = {}) => ({
  floor: T.floor, ceiling: T.ceiling, floorZ, ceilZ, light: 160, side: T.wallDark, upper: T.wall, ...extra,
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
/** Light sources, added area by area. */
const lamps = [];
const decals = [];

/**
 * A light column: a lit panel in the wall over (x0, y0)-(x1, y1) and its
 * lamp at (lx, ly), just in front of it.
 */
const column = (x0, y0, x1, y1, lx, ly) => {
  p.rect(x0, y0, x1, y1, { wall: T.wallLight });
  lamps.push({ x: lx, y: ly, radius: 5, light: 56 });
};

// ---------------------------------------------------------------- 1. the hangar
// Docking Bay 326: 32 m by 24 m and 11 m high, its mouth in the trench's
// east wall, 18 m wide and 7 m high, a magnetic field across it.
const hangar = (extra = {}) => room(0, 22, { floor: T.hangarFloor, side: T.hangarWall, upper: T.hangarWall, light: 144, ...extra });
p.rect(16, 56, 80, 104, hangar());
// Open space over the trench: beyond the deck's edge the floor is far
// below and the sky starts just above it, so nothing but sky shows out
// there, and the backdrop (the trench) is drawn over it.
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
p.rect(30, 46, 50, 54, room(0, 5, { light: 136 }));
p.rect(38, 54, 42, 56, door(0, { lock: 'remote', tag: 'troops', stayOpen: true, upper: T.hangarWall }));

// ---------------------------------------------------------------- 2. lobby and control room
p.rect(80, 98, 82, 102, door(0, { upper: T.hangarWall }));
p.rect(82, 94, 100, 106, room(0, 5, { light: 168 }));
p.chamfer(82, 94, 100, 106, 2, { wall: T.wall }, ['SW', 'SE', 'NE']);
p.rect(86, 90, 90, 94, lift([0, 8], 13));
// The control room, 4 m over the deck, its window on the hangar.
p.rect(82, 64, 98, 90, room(8, 13, { light: 152 }));
p.chamfer(82, 64, 98, 90, 2, { wall: T.wallDark }, ['NE', 'SE']);
p.rect(80, 66, 82, 88, room(9, 12, { light: 152, side: T.hangarWall, upper: T.hangarWall }));
p.fence(80, 66, 81, 88, 'W', { tex: T.window });
p.rect(84, 64, 96, 65, room(8, 13, { light: 176, lightFx: 'glow', lightMin: 136 }));
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
    else if (s === 221) p.set(x, y, { ...hall(), wall: T.wall, diagonal: 'NW' });
    else if (s === 230) p.set(x, y, { ...hall(), wall: T.wall, diagonal: 'SE' });
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
for (const [x, y] of [[130, 96], [135, 91], [140, 86]]) {
  p.rect(x - 1, y - 1, x + 1, y + 1, hall({ ceiling: T.ceilingLight, light: 208 }));
  lamps.push({ x, y, radius: 5, light: 48 });
}

// 3b. The briefing room, behind the blue door. Secret 2 behind its screens.
p.rect(104, 78, 122, 96, room(0, 6, { light: 136 }));
p.chamfer(104, 78, 122, 96, 3, { wall: T.wallDark });
p.pool(113, 87, 5, 200);
p.rect(112, 96, 114, 97, narrow(0, { door: T.doorBlue, lock: 'blue' }));
p.rect(108, 77, 118, 78, { wall: T.screen });
p.rect(112, 77, 114, 78, { door: T.screen, secret: true, floor: T.floor, ceiling: T.ceiling, floorZ: 0, ceilZ: 6, light: 120 });
p.rect(110, 73, 116, 77, room(0, 4, { light: 120, secret: true }));

// ---------------------------------------------------------------- 4. the lift hub
p.rect(160, 70, 180, 90, room(0, 8, { light: 168 }));
p.chamfer(160, 70, 180, 90, 6, { wall: T.wall });
p.pool(170, 80, 6, 216);
// North: the detention lift, a door at each stop.
p.rect(168, 68, 172, 70, door(0));
p.rect(168, 64, 172, 68, lift([0, 12], 18));
p.rect(168, 62, 172, 64, door(12));
// East: the pump room's door, opened from the far side.
p.rect(180, 78, 182, 82, door(0, { lock: 'remote', tag: 'hub-east', stayOpen: true }));
p.rect(182, 78, 186, 82, hall({ ceilZ: 5 }));

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
p.rect(169, 12, 171, 42, det(DET - 1, DET + 4, { floor: T.detFloorLight, light: 168 }));
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
// steep square duct down to the compactor, 0.75 a step.
p.rect(169, 10, 171, 12, narrow(DET - 1, { lock: 'remote', tag: 'chute', stayOpen: true, jamb: T.doorJamb, upper: T.detWall }));
const duct = (z) => ({ floor: T.grate, ceiling: T.grate, floorZ: z, ceilZ: z + 2.5, light: 104, side: T.greeble, upper: T.greeble });
p.rect(169, 4, 171, 10, duct(DET - 1));
p.stairs(171, 4, 186, 6, 'E', DET - 1.75, -0.75, duct);

// ---------------------------------------------------------------- 6. the trash compactor
const compactor = (extra = {}) => room(-6, 4, { floor: T.sludge, side: T.compactorWall, upper: T.compactorWall, light: 112, ...extra });
p.rect(186, 4, 202, 28, compactor());
p.rect(192, 12, 196, 16, compactor({ light: 160, lightFx: 'flicker', lightMin: 96 }));
// The pressure hatch, a step up out of the sludge.
p.rect(196, 28, 198, 30, narrow(-5.5, { jamb: T.doorJamb, upper: T.compactorWall }));

// ---------------------------------------------------------------- 7. maintenance and the pump room
const tunnel = (z, extra = {}) => ({ floor: T.grate, ceiling: T.ceiling, floorZ: z, ceilZ: z + 4, light: 120, side: T.pipes, upper: T.pipes, ...extra });
p.rect(195, 30, 199, 34, tunnel(-5.5));
p.stairs(195, 34, 199, 45, 'S', -5, 0.5, tunnel);
p.rect(195, 45, 199, 64, tunnel(0));
for (const y of [32, 48, 58]) p.pool(197, y + 0.5, 3, 176);
p.rect(195, 64, 199, 66, door(0, { upper: T.pipes }));
p.rect(186, 66, 204, 90, room(0, 6, { floor: T.grate, light: 128 }));
p.chamfer(186, 66, 204, 90, 3, { wall: T.wallDark });
p.pool(195, 78, 6, 192);
// The switch that opens the hub's east door: the way back.
p.rect(204, 77, 205, 79, {
  wall: T.switchOff,
  switchTo: T.switchOn,
  use: [{ action: 'openDoors', tag: 'hub-east' }, { action: 'message', text: 'LIFT HUB ACCESS UNSEALED.' }],
});
p.rect(193, 90, 197, 92, door(0));
p.rect(193, 92, 197, 100, tunnel(0, { light: 136 }));

// ---------------------------------------------------------------- 8. the tractor beam shaft
// A shaft with no bottom you can see: a ledge round it, a bridge from the
// north ledge to the column, a ledge round the column, all slabs, so the
// shaft runs on under them. The terminal is on the column's far side.
const pit = room(-60, 30, { floor: T.grate, side: T.wallDark, upper: T.wallDark, light: 96 });
const walk = { ...pit, light: 152, slab: { bottom: -0.5, top: 0, floor: T.grate, ceiling: T.grate, side: T.edge, light: 96 } };
p.rect(156, 100, 200, 144, pit);
p.rect(156, 100, 200, 104, walk);
p.rect(156, 140, 200, 144, walk);
p.rect(156, 100, 160, 144, walk);
p.rect(196, 100, 200, 144, walk);
p.rect(172, 116, 184, 128, walk);
p.rect(177, 104, 179, 116, walk);
p.rect(174, 118, 182, 126, { wall: T.wallLight });
// Railings round the outer ledge's inner edge, open at the bridge. None
// on the bridge or round the column.
p.fence(160, 103, 177, 104, 'S', railing).fence(179, 103, 196, 104, 'S', railing);
p.fence(160, 140, 196, 141, 'N', railing);
p.fence(159, 104, 160, 140, 'E', railing).fence(196, 104, 197, 140, 'W', railing);
// The column's glow, pulsing until the beam is off.
for (const [x, y] of [[178, 117], [178, 127], [173, 122], [183, 122]]) {
  lamps.push({ x, y, z: 2, radius: 9, light: 88, fx: 'glow', min: 24, tag: 'beam-lamps' });
}
p.rect(177, 125, 179, 126, {
  wall: T.switchOff,
  switchTo: T.switchOn,
  use: [
    { action: 'setFlag', flag: 'beam-off' },
    { action: 'setLight', tag: 'beam-lamps', light: 16, lightFx: 'none' },
    { action: 'openDoors', tag: 'out' },
    { action: 'openDoors', tag: 'troops' },
    { action: 'message', text: "TRACTOR BEAM 6 OFFLINE. JAN: THAT'S IT, WE'RE LOOSE. THE UNFINISHED DECKS WEST OF YOU RUN BACK TO THE BAY." },
  ],
});
p.rect(154, 120, 156, 124, door(0, { lock: 'remote', tag: 'out', stayOpen: true, upper: T.wallDark }));

// ---------------------------------------------------------------- 9. the unfinished sector
const bare = (floorZ, ceilZ, extra = {}) => room(floorZ, ceilZ, { floor: T.grate, side: T.girder, upper: T.girder, light: 104, ...extra });
// 9a. The bare deck: plates missing, so the way across zigzags (a step in
// each gap to climb out by).
p.rect(112, 112, 154, 136, bare(0, 8));
p.rect(122, 112, 126, 128, bare(-3, 8, { light: 88 }));
p.rect(122, 127, 126, 128, bare(-1.5, 8, { light: 88 }));
p.rect(136, 120, 140, 136, bare(-3, 8, { light: 88 }));
p.rect(136, 120, 140, 121, bare(-1.5, 8, { light: 88 }));
for (const [x, y] of [[148, 122], [131, 116], [130, 131], [116, 123]]) lamps.push({ x, y, radius: 7, light: 96 });
p.rect(108, 120, 112, 126, bare(0, 6));
// 9b. The panel yard, and stairs up its north wall to 4 m.
p.rect(78, 114, 108, 140, bare(0, 16));
p.stairs(82, 114, 98, 118, 'W', 0.5, 0.5, (z) => bare(z, 16));
p.rect(78, 114, 82, 118, bare(8, 16));
for (const [x, y] of [[100, 124], [88, 132], [84, 121]]) lamps.push({ x, y, radius: 7, light: 96 });
p.rect(76, 114, 78, 118, door(8, { upper: T.girder }));
// 9c. The open hull gallery: its outer wall isn't on yet, only a field
// between you and the trench.
p.rect(16, 114, 76, 140, bare(8, 20, { light: 112 }));
p.rect(15, 116, 16, 138, bare(8, 18, { ceiling: 'sky', light: 152 }));
p.fence(15, 116, 16, 138, 'W', { tex: T.field });
for (const x of [28, 44, 60]) lamps.push({ x, y: 128, radius: 8, light: 96 });
// North to the hangar's gantry.
p.rect(44, 106, 48, 114, bare(8, 12));
p.rect(44, 104, 48, 106, door(8, { upper: T.hangarWall }));

// ---------------------------------------------------------------- the trench
// Outside, the station's equatorial trench runs north to south past the
// mouth: 70 m across and deeper than the eye can follow, its far wall a
// little lower than this one, so the stars stand over it.
const B = { x: -224, y: -160, cell: 4, w: 64, h: 118 };
const heights = new Float32Array((B.w + 1) * (B.h + 1));
for (let j = 0; j <= B.h; j++) {
  for (let i = 0; i <= B.w; i++) {
    const x = B.x + i * B.cell;
    const y = B.y + j * B.cell;
    // Blocks of machinery and towers: noise in steps, so their tops are flat.
    const blocks = Math.floor(valueNoise(x, y, 14, 5) * 5) * 6 + Math.floor(valueNoise(x, y, 5, 9) * 3) * 3;
    let z;
    if (x >= 8) z = SPACE_Z; // under the station itself: never seen
    else if (x > -128) z = -80 + Math.floor(valueNoise(x, y, 9, 3) * 3) * 4; // the trench's floor
    else z = 4 + blocks + Math.min(40, (-128 - x) * 0.5); // the far wall, and the hull climbing away behind it
    heights[j * (B.w + 1) + i] = z;
  }
}

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
  at('supply-crate', 72.5, 94.5), at('supply-crate', 74, 95), at('supply-crate', 73, 96.4),
  at('supply-crate', 60.5, 98), at('supply-crate', 76.5, 60.5), at('supply-crate', 78, 62),
  at('thermal-detonator', 75.5, 96.5),
  at('stormtrooper', 62.5, 62.5, { angle: 180, skill: NORMAL_UP }),
  // 1a. The store (secret).
  at('shield-unit', 62, 109), at('power-cell', 70.5, 109.5), at('power-cell', 72, 108.5),
  // 1b. The troop bay: the squad that comes out when the beam is off.
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
  at('console', 84, 72), at('console', 84, 78), at('console', 84, 84),
  at('terminal', 96.6, 70.5, { angle: 180 }), at('terminal', 96.6, 84.5, { angle: 180 }),
  at('med-kit', 95.5, 66.5), at('power-cell', 84.5, 88.5),
  // 3. The ring corridor.
  at('stormtrooper', 122.5, 100.5, { angle: 180 }),
  at('stormtrooper', 134.5, 92.5, { angle: 225, skill: NOT_EASIEST }),
  at('officer', 148.5, 80.5, { angle: 180, skill: NORMAL_UP }),
  at('stormtrooper', 152.5, 79, { angle: 180 }),
  at('stormtrooper', 138.5, 88, { angle: 225, skill: HARD }),
  at('mouse-droid', 112.5, 100.5), at('mouse-droid', 144.5, 81.5),
  at('power-cell', 104.5, 102),
  // 3b. The briefing room.
  at('officer', 110.5, 84.5, { angle: 270 }), at('officer', 116.5, 86.5, { angle: 270, skill: NOT_EASIEST }),
  at('stormtrooper', 113.5, 81.5, { angle: 270, skill: NORMAL_UP }),
  at('shield-unit', 119, 81), at('med-kit', 107, 92.5, { skill: [1, 2, 3] }),
  at('concussion-rifle', 113, 75), at('power-cell', 111, 74.5), at('power-cell', 115, 74.5),
  // 4. The hub.
  at('stormtrooper', 166.5, 76.5, { angle: 180 }), at('stormtrooper', 174.5, 84.5, { angle: 180 }),
  at('stormtrooper', 170.5, 73.5, { angle: 270, skill: NORMAL_UP }),
  at('probe-droid', 172, 80, { skill: HARD }),
  at('med-kit', 163.5, 86.5), at('energy-pack', 176.5, 73.5),
  // 5. Detention: the officer at the desk carries the red keycard.
  at('officer', 170.5, 50.5, { angle: 270, drops: ['keycard-red'] }),
  at('stormtrooper', 164.5, 56.5, { angle: 270 }), at('stormtrooper', 176.5, 56.5, { angle: 270 }),
  at('stormtrooper', 170.5, 46.5, { angle: 270, skill: NORMAL_UP }),
  at('interrogation-droid', 165, 48, { skill: NOT_EASIEST }),
  at('console', 170, 54),
  at('med-kit', 162.5, 52.5), at('power-cell', 177.5, 49.5),
  at('interrogation-droid', 170, 26, { skill: NORMAL_UP }),
  at('stormtrooper', 170, 18, { angle: 270, skill: HARD }),
  at('interrogation-droid', 176.5, 34, { ambush: true, skill: HARD }),
  at('rusk', 163, 16, {
    angle: 0, tag: 'rusk', name: 'RUSK',
    talk: [{ lines: ['KATARN? YOU CAME UP HERE FOR ME?', "THEY'LL HAVE THE LIFT BY NOW. THE WASTE HATCH, END OF THE ROW. GO. I'LL KEEP BEHIND YOU."], set: 'rusk-free' }],
  }),
  at('prisoner', 176.5, 40, { angle: 180 }),
  at('energy-pack', 181.5, 22), at('thermal-detonator', 181.5, 21), at('thermal-detonator', 181.5, 23),
  at('med-kit', 176.5, 28, { skill: EASY }),
  // 6. The compactor.
  at('power-cell', 199.5, 8.5), at('med-kit', 189, 24.5),
  // 7. Maintenance and the pump room.
  at('stormtrooper', 197, 52.5, { angle: 90, skill: NOT_EASIEST }),
  at('stormtrooper', 190.5, 72.5, { angle: 90, ambush: true }), at('stormtrooper', 200.5, 84.5, { angle: 90, ambush: true }),
  at('probe-droid', 195, 80, { skill: NORMAL_UP }),
  at('coolant-tank', 190, 86), at('coolant-tank', 200, 70),
  at('energy-pack', 189.5, 80.5), at('med-kit', 201.5, 78),
  // 8. The shaft: troopers on the far ledges, probe droids over the drop.
  at('stormtrooper', 158, 110.5, { angle: 0, z: 0 }), at('stormtrooper', 198, 132.5, { angle: 180, z: 0 }),
  at('stormtrooper', 170.5, 142, { angle: 90, z: 0, skill: NOT_EASIEST }),
  at('stormtrooper', 186.5, 142, { angle: 90, z: 0, skill: HARD }),
  at('probe-droid', 166, 112, { z: 1, skill: NORMAL_UP }), at('probe-droid', 190, 134, { z: 1, skill: HARD }),
  at('med-kit', 198, 102, { z: 0 }), at('power-cell', 183, 127, { z: 0 }),
  // 9. The unfinished sector.
  at('stormtrooper', 146.5, 116.5, { angle: 0 }), at('stormtrooper', 130.5, 132.5, { angle: 0 }),
  at('stormtrooper', 116.5, 116.5, { angle: 0, skill: NOT_EASIEST }),
  at('probe-droid', 131, 122, { skill: NORMAL_UP }),
  at('power-cell', 124, 120), // down in the first gap
  at('stormtrooper', 100.5, 134.5, { angle: 0 }), at('stormtrooper', 80.5, 116, { angle: 0, skill: NOT_EASIEST }),
  at('officer', 90.5, 126.5, { angle: 0, skill: NORMAL_UP }),
  at('supply-crate', 96, 128), at('supply-crate', 97.4, 129), at('supply-crate', 86, 136),
  at('med-kit', 104.5, 138), at('energy-pack', 80, 138),
  at('stormtrooper', 62.5, 128.5, { angle: 0 }), at('stormtrooper', 40.5, 134.5, { angle: 0, skill: NOT_EASIEST }),
  at('stormtrooper', 24.5, 120.5, { angle: 0, skill: NORMAL_UP }),
  at('probe-droid', 30, 128, { skill: HARD }),
  at('med-kit', 46, 110), at('shield-unit', 20.5, 137.5, { skill: [1, 2, 3] }),
];

export default defineLevel({
  id: 'm4',
  mapLabel: 'M4',
  name: 'THE BATTLE STATION',
  music: 'garrison',
  sky: T.sky,
  skyWrap: 1,
  // Out over the trench, things fade to black a long way off.
  haze: { color: [0, 0, 0], half: 700 },
  par: 600,
  ...p.build(),
  lights: lamps,
  decals,
  backdrop: { ...B, heights, tex: T.hull, light: 200, moon: [0.8, 0, 0.6], far: 480 },
  things: [],
  list,
  triggers: [
    { on: 'start', do: [{ action: 'message', text: "JAN: THEY TOOK RUSK. I CAN'T LIFT WITH THAT BEAM ON US. THE ROOM OVER THE BAY, BEHIND THE GLASS: START THERE." }] },
    { on: 'talk', tag: 'rusk', if: 'rusk-free', do: [
      { action: 'openDoors', tag: 'chute' },
      { action: 'spawn', thing: 'stormtrooper', tag: 'alarm' },
      { action: 'message', text: 'ALARM: DETENTION BLOCK AA-19. THE WASTE HATCH IS OPEN.' },
    ] },
    { on: 'enter', tag: 'crow', unless: 'beam-off', once: false, do: [{ action: 'message', text: "JAN: NOT WHILE THAT BEAM'S ON US." }] },
    { on: 'enter', tag: 'crow', if: 'beam-off', do: [{ action: 'message', text: 'JAN: RUSK IS ABOARD. HOLD ON TO SOMETHING.' }, { action: 'exit' }] },
  ],
});
