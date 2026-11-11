import { ModelBuilder } from './lib/build.js';

// The battle station's props (levels/m4.js): the first Death Star's hangar,
// its control rooms, the detention block, the conference room, the tractor
// beam's terminal, the unfinished decks and the trash compactor. All face
// +x (east at angle 0) unless said.
//
// `tie-fighter`: a TIE/LN parked on the hangar deck in a low cradle (a rail
// under each wing, a beam between them), at about 0.8 of canon: two
// hexagonal solar wings TIE.wing either side, the ball cockpit between them
// on its pylons, the round window forward. It collides along its wings, its
// cradle and across under the ball.
//
// `tie-rack`: the gantry a TIE hangs from: two rails along y, RACK.half
// each way, a trolley, and a pair of jaws over each wing. The origin is at
// its top (the ceiling); it hangs RACK.drop below. RACK.over a floor, its
// jaws hold a parked TIE's wings.
//
// `ds-console`: a waist-high control console, DESK.half each way along y,
// its lit top sloping down to you. `ds-console-wall`: a bank of them for a
// wall, its back on x = 0, a tactical display over its desk.
//
// `ds-desk`: the detention block's control desk, an arc (ARC.arc degrees,
// ARC.outer round a centre ARC.centre along x) bulging toward +x, its
// controls sloping in toward whoever stands behind it. It collides along
// the arc.
//
// `ds-table`: the conference room's round black table, a lit disc in its
// middle. `ds-chair`: a high-backed swivel chair.
//
// `ds-crate`, `ds-crate-tall`, `ds-container`: cargo. They collide as their
// outlines (so they stand against walls and stack: place one CRATE.size up
// on another).
//
// `ds-doorframe`: the surround of a doorway DOORFRAME.width wide and
// DOORFRAME.tall high: two posts leaning in and a lintel, DOORFRAME.deep
// thick, centred on the doorway's middle with its front toward +x. Lit as
// the wall is (`flat`). The posts stand outside the opening at the floor
// and lean DOORFRAME.lean in over it by the top.
//
// `tractor-terminal`: the tractor beam's power terminal, a narrow pedestal
// with two big levers, a gauge and lamps, its back on x = 0 (the column).
//
// `ds-girder-post`, `ds-girder-beam`: bare I-beams of the unfinished decks,
// the post up from the origin, the beam along y on the origin (its foot at
// the height it's placed). `ds-panel-stack`: wall panels waiting to go up.
// `ds-cable-reel`: a drum of cable lying on its flange. `work-lamp`: a work
// light on a tripod, its head shining toward +x.
//
// `ds-camera`: a security camera under a ceiling (the origin at the
// ceiling), looking toward +x and down. `ds-ceiling-lamp-bar`: a light bar
// along y under a ceiling (the origin at the ceiling).
//
// `dianoga-eye`: the thing in the trash compactor: an eye on a stalk, up
// out of the water, looking toward +x.
//
// `lambda-shuttle`: a Lambda-class shuttle landed on its gear, its wings
// folded up, the tall fin on its back, a ramp down under its chin. It
// collides as its body's outline.

/** The TIE: its wings' planes (either side of the middle), its ball's centre height and radius, its top. */
export const TIE = { wing: 5, z: 5.3, ball: 1.8, top: 10.3 };
/** The rack: its rails' reach along y, how far its jaws hang below the ceiling, and how high over a deck it holds a parked TIE. */
export const RACK = { half: 6, drop: 1.2, over: 11.1 };
/** The console: its reach along y, its depth, its top. */
export const DESK = { half: 1, depth: 0.9, top: 1.1 };
/** The wall bank: its reach along y, its depth out of the wall, its top. */
export const BANK = { half: 1, depth: 0.7, top: 2.2 };
/** The detention desk's arc: its radii, where its centre is along x, its sweep in degrees, its top. */
export const ARC = { inner: 2.1, outer: 2.9, centre: -2, arc: 120, top: 1.1 };
/** The conference table and a chair. */
export const TABLE = { r: 3.25, top: 0.8 };
export const CHAIR = { r: 0.4, top: 1.5 };
/** Cargo: a crate's side, the tall one's height, the container's half length, half width and height. */
export const CRATE = { size: 1.5, tall: 2.6 };
export const CONTAINER = { half: [2.04, 1.04], top: 2.2 };
/** The door surround: the doorway it fits, how thick it stands, how far its posts lean in, its top. */
export const DOORFRAME = { width: 4, tall: 4, deep: 0.3, lean: 0.5, top: 4.6 };
/** The unfinished decks': a girder's length and width, the stack's and the reel's sizes, the work lamp's. */
export const GIRDER = { length: 6, width: 0.4 };
export const PANEL_STACK = { half: [0.6, 1.1], top: 0.8 };
export const REEL = { r: 0.6, top: 0.8 };
export const WORK_LAMP = { r: 0.3, top: 2.2 };
/** Cut cables hanging from a bare ceiling (the origin is on the ceiling): how low the live one's end hangs, where it sparks. */
export const CABLES = { 'ds-cables': null, 'ds-cables-live': [0.3, 0.2, -2.6] };
/** The shuttle: its top (the fin's). */
export const LAMBDA = { top: 14 };

const HULL = { tex: 'tie-hull' };
const DARK = { tex: 'tie-dark' };
const METAL = { tex: 'ds-metal' };
const IRON = { tex: 'ds-metal-dark' };
const WALL = { tex: 'ds-wall' };
const GUNMETAL = { tex: 'ds-wall-dark' };
const BLACK = { tex: 'ds-floor' };
const BODY = { tex: 'ds-console-side' };
const WHITE = { tex: 'ds-lamp', glow: true };
const RED = { tex: 'ds-lamp-red', glow: true };
const SHADOW = { tex: 'speeder-shadow', uv: [[0, 0], [1, 0], [1, 1], [0, 1]] };

/** The whole of a texture on a four-cornered face: top left, top right, bottom right, bottom left. */
const FULL = [[0, 0], [1, 0], [1, 1], [0, 1]];
/** A lit panel showing the whole of `tex`. */
const lit = (tex, uv = FULL) => ({ tex, uv, glow: true });

/** A square of half-width h round (cx, cy). */
const sq = (cx, cy, h) => [[cx - h, cy - h], [cx + h, cy - h], [cx + h, cy + h], [cx - h, cy + h]];
/** A strut of half-width h from a (x, y, z) to b: square in plan, lofted. */
const strut = (m, [ax, ay, az], [bx, by, bz], h, style) => m.loft(sq(ax, ay, h), az, sq(bx, by, h), bz, { ...style, top: false, bottom: false });
/** A rectangle a by b either side of (cx, cy), turned `deg`. */
const turned = (cx, cy, a, b, deg) => {
  const [c, s] = [Math.cos((deg * Math.PI) / 180), Math.sin((deg * Math.PI) / 180)];
  return [[-a, -b], [a, -b], [a, b], [-a, b]].map(([x, y]) => [cx + x * c - y * s, cy + x * s + y * c]);
};
const middle = (pts) => pts.reduce((a, p) => [a[0] + p[0] / pts.length, a[1] + p[1] / pts.length, a[2] + p[2] / pts.length], [0, 0, 0]);

/**
 * A flat plate round the corners of its middle surface (a convex outline),
 * `t` either side along `n`; `edge` styles its rims.
 */
function plate(m, corners, n, t, style, edge = style) {
  const off = (p, k) => [p[0] + n[0] * t * k, p[1] + n[1] * t * k, p[2] + n[2] * t * k];
  const mid = middle(corners);
  for (const k of [-1, 1]) m.face(corners.map((p) => off(p, k)), style, mid);
  for (let i = 0; i < corners.length; i++) {
    const [a, b] = [corners[i], corners[(i + 1) % corners.length]];
    m.face([off(a, 1), off(b, 1), off(b, -1), off(a, -1)], edge, mid);
  }
}

/**
 * A box whose upright faces each show the whole of `side`'s texture, the
 * right way round from outside, and its top the whole of `top`'s.
 */
function texBox(m, [x0, y0, z0], [x1, y1, z1], side, top = side) {
  const mid = [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2];
  const quad = (pts, style) => m.face(pts, { ...style, uv: FULL }, mid);
  quad([[x1, y1, z1], [x1, y0, z1], [x1, y0, z0], [x1, y1, z0]], side);
  quad([[x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [x0, y0, z0]], side);
  quad([[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]], side);
  quad([[x1, y0, z1], [x0, y0, z1], [x0, y0, z0], [x1, y0, z0]], side);
  quad([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], top);
}

/** A panel on a face that looks toward +x, at `x`: from y0 (its left, seen from in front) to y1, z0 up to z1. */
const facing = (m, x, [y0, y1], [z0, z1], style) => m.face([[x, y0, z1], [x, y1, z1], [x, y1, z0], [x, y0, z0]], style, [x - 1, 0, (z0 + z1) / 2]);

function tieFighter() {
  const m = new ModelBuilder('tie-fighter');
  const { wing: Y, z: ZC } = TIE;
  // A wing: a hexagon 8 long and 10 tall, pointed fore and aft, its six
  // solar panels round a hub, a dark spoke to each corner and a dark rim.
  const HEX = [[4, 0], [2, 5], [-2, 5], [-4, 0], [-2, -5], [2, -5]];
  const T = 0.1;
  const HUB = 0.22;
  for (const s of [-1, 1]) {
    // (`out` is away from the ball.)
    const P = ([x, z], k, out) => [x * k, s * (Y + out), ZC + z * k];
    const inside = [0, s * Y, ZC];
    for (let i = 0; i < 6; i++) {
      const [a, b] = [HEX[i], HEX[(i + 1) % 6]];
      m.face([P(a, 1, T), P(b, 1, T), P(b, 1, -T), P(a, 1, -T)], DARK, inside);
      const l = Math.hypot(...a);
      const p = [(-a[1] / l) * 0.14, (a[0] / l) * 0.14];
      for (const o of [-1, 1]) {
        // One panel of the six: the texture's foot along the wing's edge.
        m.face([P(a, HUB, o * T), P(b, HUB, o * T), P(b, 1, o * T), P(a, 1, o * T)], { tex: 'tie-wing', uv: [[0.5 - HUB / 2, HUB], [0.5 + HUB / 2, HUB], [1, 1], [0, 1]] }, inside);
        const Q = (k, w) => [a[0] * k + p[0] * w, s * (Y + o * (T + 0.02)), ZC + a[1] * k + p[1] * w];
        m.face([Q(HUB, -1), Q(HUB, 1), Q(0.97, 1), Q(0.97, -1)], DARK, inside);
      }
    }
    // The hub: a plate outside, and inside the boss the pylon runs into.
    m.face(HEX.map((h) => P(h, HUB + 0.04, T + 0.04)), IRON, inside);
    const boss = (k) => HEX.map(([x, z]) => [x * k, ZC + z * k]);
    m.loft(boss(0.3), s * (Y - T), boss(0.2), s * (Y - T - 0.4), { axis: 'y', ...IRON, bottom: false });
    // The pylon, broad at the ball and narrowing to the wing.
    const rect = (a, b) => [[-a, ZC - b], [a, ZC - b], [a, ZC + b], [-a, ZC + b]];
    m.loft(rect(0.95, 0.75), s * 1.3, rect(0.5, 0.42), s * (Y - T - 0.4), { axis: 'y', ...HULL, top: false, bottom: false });
  }

  // The ball: rings round its fore-and-aft axis, the window its front, the
  // engines' plate its back.
  const ring = (r) => Array.from({ length: 10 }, (_, i) => {
    const a = Math.PI / 10 + (i / 10) * Math.PI * 2;
    return [Math.cos(a) * r, ZC + Math.sin(a) * r];
  });
  const RINGS = [[-1.5, 1], [-0.85, 1.59], [0, TIE.ball], [0.85, 1.59], [1.5, 1]];
  const WINDOW = { tex: 'tie-window', uv: ring(1).map(([y, z]) => [0.5 - y / 2, 0.5 - (z - ZC) / 2]) };
  for (let i = 0; i + 1 < RINGS.length; i++) {
    const [[x0, r0], [x1, r1]] = [RINGS[i], RINGS[i + 1]];
    m.loft(ring(r0), x0, ring(r1), x1, { axis: 'x', ...HULL, bottom: i === 0 ? DARK : false, top: i === 3 ? WINDOW : false });
  }
  // The twin ion engines, red in the back plate; the hatch on top; the two
  // cannons under the window.
  for (const y of [-0.4, 0.4]) m.face([[-1.52, y - 0.17, ZC + 0.1], [-1.52, y + 0.17, ZC + 0.1], [-1.52, y + 0.17, ZC - 0.1], [-1.52, y - 0.17, ZC - 0.1]], RED, [0, 0, ZC]);
  m.cylinder([0, 0, ZC + TIE.ball - 0.12], 0.6, 0.22, { segments: 8, ...IRON, bottom: false });
  for (const y of [-0.45, 0.45]) m.box([0.95, y - 0.07, ZC - 1.12], [1.8, y + 0.07, ZC - 0.98], IRON);

  // The cradle: a rail under each wing with two cheeks holding its foot,
  // and a beam between the rails.
  for (const s of [-1, 1]) {
    m.box([-3, s * Y - 0.5, 0], [3, s * Y + 0.5, 0.35], { ...IRON, bottom: false });
    for (const x of [-2.4, 2.4]) m.box([x - 0.2, s * Y - 0.32, 0.35], [x + 0.2, s * Y + 0.32, 1.2], { ...METAL, bottom: false });
  }
  m.box([-0.3, -Y + 0.5, 0], [0.3, Y - 0.5, 0.2], { ...IRON, bottom: false });
  m.face([[4.6, -Y - 1, 0.01], [4.6, Y + 1, 0.01], [-4.6, Y + 1, 0.01], [-4.6, -Y - 1, 0.01]], SHADOW, [0, 0, -1]);

  // Collision: the rails, the wings past them, and across under the ball
  // (nobody gets in between the wings behind it and stuck).
  for (const s of [-1, 1]) {
    m.outlineLines([[-3, s * Y - 0.5], [3, s * Y - 0.5], [3, s * Y + 0.5], [-3, s * Y + 0.5]]);
    m.line(-4, s * Y, -3, s * Y);
    m.line(3, s * Y, 4, s * Y);
  }
  m.line(0, -Y + 0.5, 0, Y - 0.5);
  return m.build();
}

function tieRack() {
  const m = new ModelBuilder('tie-rack');
  const { half: L, drop } = RACK;
  // Two rails under the ceiling and the ties between them.
  for (const x of [-1.2, 1.2]) m.box([x - 0.15, -L, -0.35], [x + 0.15, L, 0], { ...IRON, top: false });
  for (const y of [-3, 3]) m.box([-1.05, y - 0.12, -0.3], [1.05, y + 0.12, -0.08], METAL);
  // Over each wing a carriage, and two jaws down either side of its top edge.
  for (const s of [-1, 1]) {
    m.box([-1.5, s * TIE.wing - 0.45, -0.75], [1.5, s * TIE.wing + 0.45, -0.35], { ...METAL, top: false });
    for (const o of [-1, 1]) m.box([-1.3, s * TIE.wing + o * 0.3 - 0.08, -drop], [1.3, s * TIE.wing + o * 0.3 + 0.08, -0.75], { ...IRON, top: false });
  }
  // The trolley in the middle, a red lamp on its front.
  m.box([-0.7, -0.7, -0.8], [0.7, 0.7, -0.35], { ...DARK, top: false });
  facing(m, 0.71, [0.15, -0.15], [-0.65, -0.53], RED);
  return m.build();
}

/** The desk's sloped top between y = -half and half: the texture's top along its back, read from in front. */
const SLOPE = { ...lit('ds-console-top', [[1, 1], [1, 0], [0, 0], [0, 1]]) };

function controlConsole() {
  const m = new ModelBuilder('ds-console');
  const { half: a, depth: d, top } = DESK;
  const [back, front, low] = [-d / 2, d / 2, top - 0.25];
  // Side profile in x-z: low at the front. Edge 0 is the floor, 2 the top.
  m.prism([[back, 0], [front, 0], [front, low], [back, top]], -a, a, { ...BODY, axis: 'y', side: (i) => (i === 0 ? false : i === 2 ? SLOPE : undefined) });
  // A dark kick along its foot, and a strip of light under the top's lip.
  m.box([front, -a + 0.05, 0], [front + 0.02, a - 0.05, 0.14], { ...IRON, bottom: false });
  facing(m, front + 0.012, [a - 0.1, -a + 0.1], [low - 0.1, low - 0.05], WHITE);
  m.outlineLines([[back, -a], [front, -a], [front, a], [back, a]]);
  return m.build();
}

function consoleWall() {
  const m = new ModelBuilder('ds-console-wall');
  const { half: a, depth: d, top } = BANK;
  // The desk: edge 0 the floor, 1 its front, 2 the lit slope, 3 under the
  // bank, 4 the wall.
  m.prism([[0, 0], [d, 0], [d, 0.85], [0.32, 1], [0, 1]], -a, a, { ...BODY, axis: 'y', side: (i) => (i === 0 || i > 2 ? false : i === 2 ? SLOPE : undefined) });
  m.box([d, -a + 0.05, 0], [d + 0.02, a - 0.05, 0.14], { ...IRON, bottom: false });
  // The bank over it, the display in its face and a row of lamps under that.
  m.prism([[0, 1], [0.32, 1], [0.32, top], [0, top]], -a, a, { ...GUNMETAL, axis: 'y', side: (i) => (i === 0 || i === 3 ? false : undefined) });
  facing(m, 0.335, [a - 0.2, -a + 0.2], [1.3, 2.1], lit('ds-screen'));
  [RED, WHITE, WHITE, RED, WHITE].forEach((lamp, k) => facing(m, 0.33, [0.78 - k * 0.2, 0.68 - k * 0.2], [1.1, 1.18], lamp));
  m.outlineLines([[0, -a], [d, -a], [d, a], [0, a]]);
  return m.build();
}

function detentionDesk() {
  const m = new ModelBuilder('ds-desk');
  const { inner: ri, outer: ro, centre: cx, arc, top } = ARC;
  const n = 6;
  const half = ((arc / 2) * Math.PI) / 180;
  const rm = ro - 0.25;
  const low = top - 0.22;
  const at = (k, r, z) => {
    const a = -half + (2 * half * k) / n;
    return [cx + Math.cos(a) * r, Math.sin(a) * r, z];
  };
  for (let k = 0; k < n; k++) {
    const inside = at(k + 0.5, (ri + ro) / 2, 0.5);
    m.face([at(k, ro, 0), at(k + 1, ro, 0), at(k + 1, ro, top), at(k, ro, top)], BODY, inside);
    m.face([at(k, ri, 0), at(k + 1, ri, 0), at(k + 1, ri, low), at(k, ri, low)], BODY, inside);
    // A pale ledge along the front, and the controls sloping in from it:
    // half the texture on each piece, so it runs three times round.
    m.face([at(k, ro, top), at(k + 1, ro, top), at(k + 1, rm, top), at(k, rm, top)], METAL, inside);
    const u = (k % 2) / 2;
    m.face([at(k, rm, top), at(k + 1, rm, top), at(k + 1, ri, low), at(k, ri, low)], lit('ds-console-top', [[u, 0], [u + 0.5, 0], [u + 0.5, 1], [u, 1]]), inside);
  }
  for (const k of [0, n]) m.face([at(k, ri, 0), at(k, ro, 0), at(k, ro, top), at(k, rm, top), at(k, ri, low)], BODY, at(n / 2, (ri + ro) / 2, 0.5));
  // Lamps on the ledge: red at the ends, white in the middle.
  [[0.5, RED], [3, WHITE], [5.5, RED]].forEach(([k, lamp]) => {
    const [x, y] = at(k, ro - 0.12, 0);
    m.cylinder([x, y, top], 0.07, 0.06, { segments: 6, ...IRON, top: lamp, bottom: false });
  });
  // Collision: round the arc.
  const outline = [];
  for (let k = 0; k <= n; k++) outline.push(at(k, ro, 0));
  for (let k = n; k >= 0; k--) outline.push(at(k, ri, 0));
  m.outlineLines(outline);
  return m.build();
}

function conferenceTable() {
  const m = new ModelBuilder('ds-table');
  const { r, top } = TABLE;
  const n = 16;
  const at = (k, rr, z) => [Math.cos((k / n) * Math.PI * 2) * rr, Math.sin((k / n) * Math.PI * 2) * rr, z];
  // The drum it stands on, the black top, its pale rim and edge.
  m.cylinder([0, 0, 0], 1.3, top - 0.16, { segments: 8, ...IRON, top: false, bottom: false });
  m.cylinder([0, 0, top - 0.16], r, 0.16, { segments: n, ...METAL, top: BLACK, bottom: IRON });
  for (let k = 0; k < n; k++) m.face([at(k, r - 0.3, top + 0.004), at(k + 1, r - 0.3, top + 0.004), at(k + 1, r, top + 0.004), at(k, r, top + 0.004)], METAL, [0, 0, 0]);
  // The lit disc in its middle, in a dark ring.
  m.cylinder([0, 0, top], 1.05, 0.03, { segments: 12, ...IRON, bottom: false });
  m.cylinder([0, 0, top + 0.03], 0.9, 0.012, { segments: 12, ...WHITE, bottom: false });
  return m.build();
}

function chair() {
  const m = new ModelBuilder('ds-chair');
  // A round foot, the stem, the seat, the tall back leaning away, the arms.
  m.cylinder([0, 0, 0], 0.32, 0.05, { segments: 8, ...IRON, bottom: false });
  m.cylinder([0, 0, 0.05], 0.05, 0.4, { segments: 6, ...METAL, top: false, bottom: false });
  m.box([-0.35, -0.4, 0.45], [0.4, 0.4, 0.58], BLACK);
  m.loft([[-0.45, -0.45], [-0.3, -0.45], [-0.3, 0.45], [-0.45, 0.45]], 0.5, [[-0.54, -0.36], [-0.42, -0.36], [-0.42, 0.36], [-0.54, 0.36]], CHAIR.top, { ...BLACK, bottom: false });
  for (const s of [-1, 1]) m.box([-0.3, s > 0 ? 0.36 : -0.45, 0.58], [0.3, s > 0 ? 0.45 : -0.36, 0.8], { ...IRON, bottom: false });
  return m.build();
}

function crate(id, height, tex) {
  const m = new ModelBuilder(id);
  const a = CRATE.size / 2;
  texBox(m, [-a, -a, 0], [a, a, height], { tex });
  m.outlineLines([[-a, -a], [a, -a], [a, a], [-a, a]]);
  return m.build();
}

function container() {
  const m = new ModelBuilder('ds-container');
  const [a, b] = CONTAINER.half;
  const top = CONTAINER.top;
  // The box between a pale skid and a pale lid.
  m.box([-2, -1, 0.1], [2, 1, top - 0.1], { ...GUNMETAL, top: false, bottom: false });
  m.box([-a, -b, 0], [a, b, 0.1], { ...METAL, bottom: false });
  m.box([-a, -b, top - 0.1], [a, b, top], METAL);
  // Pale posts on its corners, dark ribs along its sides.
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      m.box([Math.min(sx * 1.88, sx * a), Math.min(sy * 0.88, sy * b), 0.1], [Math.max(sx * 1.88, sx * a), Math.max(sy * 0.88, sy * b), top - 0.1], { ...METAL, top: false, bottom: false });
    }
  }
  for (const sy of [-1, 1]) {
    for (const x of [-1.2, -0.4, 0.4, 1.2]) m.box([x - 0.06, sy > 0 ? 1 : -b, 0.1], [x + 0.06, sy > 0 ? b : -1, top - 0.1], { ...IRON, top: false, bottom: false });
  }
  // Its doors' seam and latch, at the +x end.
  m.box([2, -0.03, 0.2], [2.02, 0.03, top - 0.2], { ...IRON, top: false, bottom: false });
  m.box([2, -0.3, 1], [2.04, 0.3, 1.12], METAL);
  m.outlineLines([[-a, -b], [a, -b], [a, b], [-a, b]]);
  return m.build();
}

function doorframe() {
  const m = new ModelBuilder('ds-doorframe');
  const { width, tall, deep, lean, top } = DOORFRAME;
  const [a, d] = [width / 2, deep / 2];
  const PALE = { ...WALL, flat: true };
  const EDGE = { ...GUNMETAL, flat: true };
  // The posts' outer faces lean in as their inner ones do, a little less.
  const outer = (z) => a + 0.7 - 0.1 * z;
  for (const s of [-1, 1]) {
    // Edge 0 the floor, 1 its outer face, 2 under the lintel, 3 the inner face (dark).
    m.prism([[s * a, 0], [s * outer(0), 0], [s * outer(tall), tall], [s * (a - lean), tall]], -d, d, { ...PALE, axis: 'x', bottom: false, side: (i) => (i === 0 || i === 2 ? false : i === 3 ? EDGE : undefined) });
  }
  // The lintel: edge 0 its underside (dark), 2 its top.
  m.prism([[-outer(tall), tall], [outer(tall), tall], [outer(top), top], [-outer(top), top]], -d, d, { ...PALE, axis: 'x', bottom: false, side: (i) => (i === 0 ? EDGE : undefined) });
  // A dark line round the opening on its face.
  const x = d + 0.012;
  const strip = (pts) => m.face(pts.map(([y, z]) => [x, y, z]), EDGE, [0, 0, tall / 2]);
  for (const s of [-1, 1]) strip([[s * a, 0], [s * (a + 0.12), 0], [s * (a - lean + 0.12), tall], [s * (a - lean), tall]]);
  strip([[-(a - lean + 0.12), tall], [a - lean + 0.12, tall], [a - lean + 0.12, tall + 0.12], [-(a - lean + 0.12), tall + 0.12]]);
  return m.build();
}

function tractorTerminal() {
  const m = new ModelBuilder('tractor-terminal');
  // The pedestal, the control shelf sloping down to you, the panel over it.
  m.prism([[0, 0], [0.5, 0], [0.5, 0.95], [0, 0.95]], -0.4, 0.4, { ...GUNMETAL, axis: 'y', side: (i) => (i === 0 || i === 3 ? false : undefined) });
  m.prism([[0, 0.95], [0.6, 0.95], [0.6, 1.05], [0, 1.2]], -0.5, 0.5, { ...IRON, axis: 'y', side: (i) => (i === 3 ? false : i === 2 ? SLOPE : undefined) });
  m.prism([[0, 1.2], [0.3, 1.2], [0.3, 2.14], [0, 2.14]], -0.5, 0.5, { ...METAL, axis: 'y', side: (i) => (i === 0 || i === 3 ? false : undefined) });
  m.box([0, -0.52, 2.14], [0.34, 0.52, 2.2], IRON);
  // The gauge, lit, and a row of lamps under it, red and white.
  facing(m, 0.312, [0.38, -0.38], [1.72, 2.06], lit('ds-screen'));
  [RED, WHITE, RED, RED, WHITE].forEach((lamp, k) => facing(m, 0.312, [0.4 - k * 0.17, 0.28 - k * 0.17], [1.5, 1.6], lamp));
  // The two big levers, out of the shelf, their grips across.
  for (const y of [-0.25, 0.25]) {
    strut(m, [0.3, y, 1.1], [0.62, y, 1.46], 0.025, METAL);
    m.box([0.56, y - 0.13, 1.44], [0.68, y + 0.13, 1.52], DARK);
  }
  return m.build();
}

/** The truss in an I-beam's web: once across it, repeating along it. */
const TRUSS = (uv) => ({ tex: 'ds-girder', uv });

function girderPost() {
  const m = new ModelBuilder('ds-girder-post');
  const [w, h] = [GIRDER.width / 2, GIRDER.length];
  // Two flanges and the web between them.
  for (const s of [-1, 1]) m.box([s > 0 ? w - 0.05 : -w, -w, 0], [s > 0 ? w : -w + 0.05, w, h], { ...IRON, bottom: false });
  const n = h / (2 * w - 0.1) / 2;
  for (const s of [-1, 1]) m.face([[-w + 0.05, s * 0.025, h], [w - 0.05, s * 0.025, h], [w - 0.05, s * 0.025, 0], [-w + 0.05, s * 0.025, 0]], TRUSS([[0, 0], [1, 0], [1, n], [0, n]]), [0, 0, h / 2]);
  return m.build();
}

function girderBeam() {
  const m = new ModelBuilder('ds-girder-beam');
  const [w, l] = [GIRDER.width / 2, GIRDER.length / 2];
  for (const z of [0, 2 * w - 0.05]) m.box([-w, -l, z], [w, l, z + 0.05], IRON);
  const n = (2 * l) / (2 * w - 0.1) / 2;
  for (const s of [-1, 1]) m.face([[s * 0.025, -l, 2 * w - 0.05], [s * 0.025, l, 2 * w - 0.05], [s * 0.025, l, 0.05], [s * 0.025, -l, 0.05]], TRUSS([[0, 0], [n, 0], [n, 1], [0, 1]]), [0, 0, w]);
  return m.build();
}

function panelStack() {
  const m = new ModelBuilder('ds-panel-stack');
  // Wall panels 2 by 1 laid one on another, none quite square on the last.
  const LIE = [[0, 0, 0], [0.04, -0.03, 4], [-0.04, 0.02, -3], [0.02, 0.05, 6], [-0.05, -0.02, -5], [0.03, 0, 2], [0.06, 0.05, 11]];
  const t = PANEL_STACK.top / LIE.length;
  LIE.forEach(([x, y, deg], k) => {
    m.prism(turned(x, y, 0.5, 1, deg), k * t, (k + 1) * t - 0.01, { ...IRON, top: { tex: 'ds-wall', uv: [[0, 0], [0, 0.5], [1, 0.5], [1, 0]] }, bottom: false });
  });
  const [a, b] = PANEL_STACK.half;
  m.outlineLines([[-a, -b], [a, -b], [a, b], [-a, b]]);
  return m.build();
}

function cableReel() {
  const m = new ModelBuilder('ds-cable-reel');
  const { r, top } = REEL;
  // Two flanges, the cable wound on the core between them, the hub's hole
  // dark in the top, and the cable's end trailing off across the floor.
  m.cylinder([0, 0, 0], r, 0.07, { segments: 10, ...METAL, bottom: false });
  m.cylinder([0, 0, 0.07], r - 0.14, top - 0.14, { segments: 10, tex: 'hold-pipes', top: false, bottom: false });
  m.cylinder([0, 0, top - 0.07], r, 0.07, { segments: 10, ...METAL });
  m.cylinder([0, 0, top], 0.16, 0.01, { segments: 8, ...DARK, bottom: false });
  m.prism(turned(0.75, 0.3, 0.45, 0.035, 25), 0, 0.07, { ...DARK, bottom: false });
  return m.build();
}

function workLamp() {
  const m = new ModelBuilder('work-lamp');
  // Three legs up to a collar, the mast, and the lamp's head across its top.
  for (let k = 0; k < 3; k++) {
    const a = Math.PI / 3 + (k * Math.PI * 2) / 3;
    strut(m, [Math.cos(a) * 0.5, Math.sin(a) * 0.5, 0], [Math.cos(a) * 0.04, Math.sin(a) * 0.04, 1.5], 0.03, IRON);
  }
  m.box([-0.035, -0.035, 1.45], [0.035, 0.035, 1.86], { ...METAL, bottom: false, top: false });
  m.box([-0.1, -0.36, 1.84], [0.08, 0.36, WORK_LAMP.top], IRON);
  facing(m, 0.09, [0.32, -0.32], [1.88, WORK_LAMP.top - 0.04], WHITE);
  return m.build();
}

// `ds-cables`, `ds-cables-live`: a bundle of cables out of a ceiling whose
// panels aren't on yet: loops sagging between two holes and cut ends
// hanging. The origin is on the ceiling; the live one's longest end
// spits sparks (decor.js).
function cables(id) {
  const m = new ModelBuilder(id);
  const spark = CABLES[id];
  const SHEATH = [{ tex: 'hose-orange' }, METAL, { tex: 'hold-pipes' }];
  // A plate on the ceiling at each hole.
  for (const [x, y] of [[-0.5, -0.2], [0.45, 0.15]]) m.box([x - 0.2, y - 0.2, -0.04], [x + 0.2, y + 0.2, 0], { ...IRON, top: false });
  // Loops: [x0, y0, x1, y1, how low they sag].
  const loops = [[-0.5, -0.25, 0.45, 0.1, 1.5], [-0.45, -0.1, 0.5, 0.2, 2.1], [-0.55, -0.2, 0.4, 0.25, 1.1]];
  loops.forEach(([x0, y0, x1, y1, low], i) => {
    const n = 6;
    const pt = (u) => [x0 + (x1 - x0) * u, y0 + (y1 - y0) * u, -low * Math.sin(Math.PI * u)];
    for (let j = 0; j < n; j++) strut(m, pt(j / n), pt((j + 1) / n), 0.04, SHEATH[i]);
  });
  // Cut ends, curling a little as they fall.
  const ends = [[-0.45, -0.2, -1.8], [0.5, 0.05, -1.3], spark ?? [0.3, 0.2, -2.2]];
  ends.forEach(([x, y, low], i) => {
    const pts = [[x - 0.1, y, 0], [x - 0.05, y + 0.05, low / 2 + 0.3], [x + 0.05, y, low / 2 - 0.2], [x, y, low]];
    for (let j = 0; j < pts.length - 1; j++) strut(m, pts[j], pts[j + 1], 0.04, SHEATH[(i + 1) % 3]);
  });
  // The live end's bare core, glowing.
  if (spark) m.box([spark[0] - 0.03, spark[1] - 0.03, spark[2] - 0.06], [spark[0] + 0.03, spark[1] + 0.03, spark[2]], WHITE);
  return m.build();
}

function camera() {
  const m = new ModelBuilder('ds-camera');
  // A plate on the ceiling, a stem, and the camera's body tipped down.
  m.box([-0.1, -0.1, -0.05], [0.1, 0.1, 0], { ...IRON, top: false });
  m.box([-0.03, -0.03, -0.2], [0.03, 0.03, -0.05], { ...IRON, top: false, bottom: false });
  // (u along the body, w up from its axis, tipped 20 degrees.)
  const [c, s] = [Math.cos(-0.35), Math.sin(-0.35)];
  const R = (u, w) => [0.04 + u * c - w * s, -0.28 + u * s + w * c];
  const slab = (u0, u1, w0, w1, y, style) => m.prism([R(u0, w0), R(u1, w0), R(u1, w1), R(u0, w1)], -y, y, { axis: 'y', ...style });
  slab(-0.22, 0.2, -0.085, 0.085, 0.1, METAL);
  // The lens, dark, and a red lamp over it.
  slab(0.2, 0.3, -0.06, 0.05, 0.06, DARK);
  slab(0.2, 0.215, 0.055, 0.08, 0.03, RED);
  return m.build();
}

function ceilingLampBar() {
  const m = new ModelBuilder('ds-ceiling-lamp-bar');
  // A dark housing on the ceiling, its lens glowing under it.
  m.box([-0.15, -1.5, -0.1], [0.15, 1.5, 0], { ...IRON, top: false });
  m.box([-0.11, -1.46, -0.13], [0.11, 1.46, -0.1], { ...WHITE, top: false });
  return m.build();
}

function dianogaEye() {
  const m = new ModelBuilder('dianoga-eye');
  const STALK = { color: ['olive', 0.5] };
  const LID = { color: ['rust', 0.34] };
  const EYE = { color: ['beige', 0.92] };
  // The stalk, bending a little as it rises (it starts under the water, so
  // its foot stays hidden as it bobs).
  const round = (cx, r) => Array.from({ length: 6 }, (_, i) => [cx + Math.cos((i / 6) * Math.PI * 2) * r, Math.sin((i / 6) * Math.PI * 2) * r]);
  const UP = [[-0.3, 0, 0.1], [0.3, 0.03, 0.085], [0.65, 0.08, 0.07], [0.92, 0.05, 0.06]];
  for (let i = 0; i + 1 < UP.length; i++) {
    m.loft(round(UP[i][1], UP[i][2]), UP[i][0], round(UP[i + 1][1], UP[i + 1][2]), UP[i + 1][0], { ...STALK, top: false, bottom: false });
  }
  // The eye: a fleshy socket and lid behind, the pale ball forward, its
  // pupil and a glint.
  const [X, Z] = [0.05, 0.98];
  const ring = (r) => Array.from({ length: 6 }, (_, i) => [Math.cos((i / 6) * Math.PI * 2) * r, Z + Math.sin((i / 6) * Math.PI * 2) * r]);
  m.loft(ring(0.07), X - 0.14, ring(0.15), X - 0.05, { axis: 'x', ...LID, top: false });
  m.loft(ring(0.15), X - 0.05, ring(0.15), X + 0.05, { axis: 'x', ...LID, top: false, bottom: false });
  m.loft(ring(0.15), X + 0.05, ring(0.09), X + 0.15, { axis: 'x', ...EYE, bottom: false });
  m.face(ring(0.05).map(([y, z]) => [X + 0.155, y, z]), { color: ['gray', 0.04] }, [0, 0, Z]);
  m.face([[X + 0.16, -0.035, Z + 0.035], [X + 0.16, -0.012, Z + 0.035], [X + 0.16, -0.012, Z + 0.012], [X + 0.16, -0.035, Z + 0.012]], { color: [255, 255, 255], glow: true }, [0, 0, Z]);
  return m.build();
}

function lambdaShuttle() {
  const m = new ModelBuilder('lambda-shuttle');
  const GLASS = { color: [14, 18, 28] };
  /** The belly's height off the deck, on its gear. */
  const G = 1.1;
  const up = (pts) => pts.map(([y, z]) => [y, z + G]);
  // The body's cross-section (y, z over the belly): edge 0 the belly, 3 the roof.
  const BODY_ = up([[-1.7, 0], [1.7, 0], [2.5, 1.4], [2, 3.6], [-2, 3.6], [-2.5, 1.4]]);
  const NECK = up([[-0.9, 0.5], [0.9, 0.5], [1.3, 1.4], [1, 2.7], [-1, 2.7], [-1.3, 1.4]]);
  const NOSE = up([[-0.6, 0.5], [0.6, 0.5], [0.8, 0.9], [0.6, 1.3], [-0.6, 1.3], [-0.8, 0.9]]);
  const belly = (i) => (i === 0 ? IRON : undefined);
  // The body, its back the engines' plate; the neck narrowing forward; the
  // cockpit, its roof raked down to the nose.
  m.prism(BODY_, -6, 1, { axis: 'x', ...WALL, top: false, bottom: DARK, side: belly });
  m.loft(BODY_, 1, NECK, 3.6, { axis: 'x', ...WALL, top: false, bottom: false, side: belly });
  m.loft(NECK, 3.6, NOSE, 6, { axis: 'x', ...WALL, bottom: false, top: METAL, side: belly });
  // The windows: a band across the raked roof and one down each side of it.
  const rake = (t, y, lift = 0.02) => [3.6 + 2.4 * t, y * (1 - 0.4 * t), G + 2.7 - 1.4 * t + lift];
  m.face([rake(0.12, -0.9), rake(0.12, 0.9), rake(0.8, 0.9), rake(0.8, -0.9)], GLASS, [4.5, 0, G + 1]);
  for (const s of [-1, 1]) {
    const side = (t, k) => [3.6 + 2.4 * t, s * (1 + 0.3 * k - (0.4 + 0.2 * k) * t + 0.02), G + 2.7 - 1.3 * k - (1.4 - 0.9 * k) * t];
    m.face([side(0.12, 0.1), side(0.8, 0.1), side(0.8, 0.7), side(0.12, 0.7)], GLASS, [4.5, 0, G + 1.5]);
  }
  // The engines: two pale bars of light across the back.
  for (const z of [G + 1.3, G + 2.3]) m.face([[-6.02, -1.6, z + 0.5], [-6.02, 1.6, z + 0.5], [-6.02, 1.6, z], [-6.02, -1.6, z]], { color: [214, 232, 255], glow: true }, [0, 0, z]);

  // The fin on its back, swept to a narrower top.
  const ROOF = G + 3.6;
  plate(m, [[-5.8, 0, ROOF], [0.4, 0, ROOF], [-2.4, 0, LAMBDA.top], [-5.2, 0, LAMBDA.top]], [0, 1, 0], 0.14, WALL, METAL);
  // Each wing folded up from its hinge along the body's shoulder, leaning
  // out a little; the hinge's housing, a cannon at its front.
  const [dy, dz] = [1.3, 9.1];
  const len = Math.hypot(dy, dz);
  for (const s of [-1, 1]) {
    const W = (x, t) => [x, s * (2.75 + dy * t), G + 1.7 + dz * t];
    plate(m, [W(-5.5, 0), W(0.5, 0), W(-1.9, 1), W(-5, 1)], [0, (s * dz) / len, -dy / len], 0.11, WALL, METAL);
    m.box([-5.7, s > 0 ? 2.25 : -3.15, G + 1], [0.7, s > 0 ? 3.15 : -2.25, G + 2.2], METAL);
    m.box([0.7, s * 2.7 - 0.12, G + 1.45], [2, s * 2.7 + 0.12, G + 1.69], { ...DARK, bottom: false });
  }

  // Its gear: two legs under the body's back and one under the neck, on
  // pads; the ramp down from under the cockpit.
  for (const [x, y] of [[-4.2, -1.3], [-4.2, 1.3], [0.4, 0]]) {
    m.box([x - 0.16, y - 0.16, 0.1], [x + 0.16, y + 0.16, G], { ...IRON, top: false, bottom: false });
    m.box([x - 0.5, y - 0.4, 0], [x + 0.5, y + 0.4, 0.1], { ...METAL, bottom: false });
  }
  const [rx, rz] = [2.6, G + 0.5];
  const rl = Math.hypot(rx, rz);
  plate(m, [[3.2, -0.7, G + 0.5], [3.2, 0.7, G + 0.5], [3.2 + rx, 0.7, 0.04], [3.2 + rx, -0.7, 0.04]], [rz / rl, 0, rx / rl], 0.04, IRON);
  // Its shadow on the deck.
  m.face([[6.3, -3.6, 0.01], [6.3, 3.6, 0.01], [-6.5, 3.6, 0.01], [-6.5, -3.6, 0.01]], SHADOW, [0, 0, -1]);

  // Collision: the body's outline, housings to nose.
  m.outlineLines([[-6, -3.15], [1, -3.15], [3.6, -1.4], [6, -0.8], [6, 0.8], [3.6, 1.4], [1, 3.15], [-6, 3.15]]);
  return m.build();
}

export default [
  tieFighter(),
  tieRack(),
  controlConsole(),
  consoleWall(),
  detentionDesk(),
  conferenceTable(),
  chair(),
  crate('ds-crate', CRATE.size, 'ds-crate'),
  crate('ds-crate-tall', CRATE.tall, 'ds-crate-b'),
  container(),
  doorframe(),
  tractorTerminal(),
  girderPost(),
  girderBeam(),
  panelStack(),
  cableReel(),
  workLamp(),
  ...Object.keys(CABLES).map(cables),
  camera(),
  ceilingLampBar(),
  dianogaEye(),
  lambdaShuttle(),
];
