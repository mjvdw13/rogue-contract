import { ModelBuilder } from './lib/build.js';

// Chalmun's cantina in Mos Eisley (levels/m1.js), after Mark's references
// (2026-10-30: a fan floor plan, film stills, the diorama; his still of
// 2026-10-18: the bar a pale ring under a big oval opening in a low, heavy
// ceiling, lit from above, its taps and pipes behind it).
//
// `cantina-bar`: a pale U of counter, its round end to the door (north, -y)
// and its arms running south, the east one stopping short for the
// bartender's way in. The origin is on the floor at the round end's
// centre. It collides as its counter's lines, only as high as the counter.
//
// `cantina-taps`: the taps' column inside the U, a band of taps round it
// and its pipes up into the well over the bar. The origin on the floor at
// its middle (TAPS.y south of the bar's).
//
// `cantina-shelves`: a unit of shelves of bottles, 2 wide, against the
// back-bar's back wall (one each side of its door). Built looking north
// (-y), its back on y 0, the origin on the floor at its middle.
//
// `cantina-stool`: a bar stool, a seat on a post on a round foot.
//
// `cantina-booth`: a booth, a half ring of bench in the walls' plaster with
// a worn red seat, round a table with a lamp on it, its back to a wall.
// Built looking south, its back on y 0, the origin on the floor at its
// middle; the table's centre is BOOTH.table out from the wall. It collides
// round its bench's ends and the table's front.
//
// `cantina-corner`: a front corner of the room, cut at 45 degrees: a flat
// stretch of the walls' plaster, floor to ceiling, standing on the
// diagonal in front of square wall tiles (angled walls can't take a
// ceiling, so a corner built of them showed the sky). Built along x,
// looking south, the origin on the floor at its middle; it collides along
// its face. Its face is lit as the walls are.
//
// `cantina-detector`: the droid detector on the vestibule's wall, a steel
// box with a red lens. Built looking south, its back on y 0 (a fixture).
//
// `cantina-sign`: the little lit sign up on the front by the arch's
// shoulder (Mark's stills), a box glowing orange. Built looking south, its
// back on y 0 (a fixture).
//
// `cantina-lamp`: a bare bulb glowing on a cord, hung from a ceiling: the
// origin at the bulb's foot, the cord LAMP_CORD up to the ceiling.
//
// `cantina-canopy`: the ring round the well in the ceiling over the bar, an
// oval band in the ceiling's planks hanging below it and rising to the
// well's top, so the well's edge, stepped by the tiles, is hidden behind
// it: the heavy ceiling's edge round a bright opening. The well's top
// glows, lit from above. The origin at the oval's middle, at the band's
// foot. The level paints the well to fit it (CANOPY): every tile the oval
// reaches into.

/** The cantina's walls: plaster (the level's walls and the corners' panels). */
export const WALL = 'adobe-pale';
/** A cut corner's panel: its length (6 tiles each way) and height (the room's). */
export const CORNER = { len: 6 * Math.SQRT2, h: 4 };
/** How far a `cantina-lamp`'s cord runs up from its bulb's foot to the ceiling. */
export const LAMP_CORD = 0.75;
/** A booth: how far out from the wall its table stands, and its bench's outer radius round it. */
export const BOOTH = { table: 1.5, r: 1.45 };
/** The counter: radii of its round end, its arms' lengths south, its top. */
export const BAR = { outer: 4.5, inner: 3.5, west: 6, east: 4, top: 0.97 };
/**
 * The canopy's oval (its outer radii, east-west and north-south), how far
 * below the room's ceiling it hangs, the band's height (up to the well's
 * top) and thickness.
 */
export const CANOPY = { rx: 4.6, ry: 5.6, drop: 0.5, band: 1.25, thick: 0.12 };
/**
 * The taps' column inside the U: where (south of the bar's origin), how wide,
 * and how high over the floor its pipes reach: the well's top, in a room 4
 * high (the level checks it).
 */
export const TAPS = { y: 1.75, r: 0.9, pipes: 4 - CANOPY.drop + CANOPY.band };

const SEG = 10; // segments round the counter's round end
const RING = 28; // segments round the canopy

const PALE = { tex: 'adobe-pale' }; // the counter's front
const WOOD = { tex: 'planks' }; // the bartender's side, the shelves, the canopy (as the ceiling)
const STEEL = { tex: 'metal-grey' }; // the counter's top, the column
const TRIM = { tex: 'band-steel' };

/** A point at angle `a` on the circle (or oval) of radii `rx`, `ry`. */
const on = (rx, ry, a) => [Math.cos(a) * rx, Math.sin(a) * ry];

function bar() {
  const m = new ModelBuilder('cantina-bar');
  const { outer: RO, inner: RI, west, east, top: T } = BAR;
  const body = T - 0.12; // the body's top, under the counter's top
  const lip = 0.08; // the top's overhang at the front
  const front = (i, faces) => faces[i] ?? false;
  // The round end, west by north to east: blocks of counter, the joints
  // between them hidden.
  for (let k = 0; k < SEG; k++) {
    const [a0, a1] = [Math.PI + (k / SEG) * Math.PI, Math.PI + ((k + 1) / SEG) * Math.PI];
    m.prism([on(RO, RO, a0), on(RO, RO, a1), on(RI, RI, a1), on(RI, RI, a0)], 0, body, { top: false, bottom: false, side: (i) => front(i, [PALE, false, WOOD]) });
    m.prism([on(RO + lip, RO + lip, a0), on(RO + lip, RO + lip, a1), on(RI, RI, a1), on(RI, RI, a0)], body, T, { ...STEEL, bottom: false, side: (i) => front(i, [STEEL, false, STEEL]) });
    m.line(...on(RO, RO, a0), ...on(RO, RO, a1)).line(...on(RI, RI, a0), ...on(RI, RI, a1));
  }
  // The arms: the west one to the back-bar's pillar, the east one short.
  m.box([-RO, 0, 0], [-RI, west, body], { top: false, bottom: false, side: (i) => front(i, [false, WOOD, false, PALE]) });
  m.box([-RO - lip, 0, body], [-RI, west, T], { ...STEEL, bottom: false, side: (i) => front(i, [false, STEEL, false, STEEL]) });
  m.box([RI, 0, 0], [RO, east, body], { top: false, bottom: false, side: (i) => front(i, [false, PALE, PALE, WOOD]) });
  m.box([RI, 0, body], [RO + lip, east + lip, T], { ...STEEL, bottom: false, side: (i) => front(i, [false, STEEL, STEEL, STEEL]) });
  m.line(-RO, 0, -RO, west).line(-RI, 0, -RI, west);
  m.line(RO, 0, RO, east).line(RO, east, RI, east).line(RI, east, RI, 0);

  return m.build();
}

function taps() {
  const m = new ModelBuilder('cantina-taps');
  // A steel drum, a band of taps round it, a cap, and pipes up from it
  // into the well.
  const { r, pipes } = TAPS;
  m.cylinder([0, 0, 0], r, 1.2, { ...STEEL, segments: 10, bottom: false });
  m.cylinder([0, 0, 1.2], r * 0.8, 0.3, { ...TRIM, segments: 10, bottom: false });
  for (let k = 0; k < 8; k++) {
    // A spout out from the drum, and its nozzle turned down.
    const a = (k / 8) * Math.PI * 2 + Math.PI / 8;
    const [c, s] = [Math.cos(a), Math.sin(a)];
    const at = (u, v) => [c * u - s * v, s * u + c * v];
    m.prism([at(r - 0.02, -0.04), at(r + 0.22, -0.04), at(r + 0.22, 0.04), at(r - 0.02, 0.04)], 1.0, 1.08, { ...TRIM, bottom: TRIM });
    m.prism([at(r + 0.14, -0.035), at(r + 0.21, -0.035), at(r + 0.21, 0.035), at(r + 0.14, 0.035)], 0.9, 1.0, { ...TRIM, top: false });
  }
  for (const [px, py] of [[-0.35, -0.2], [0.35, -0.2], [-0.2, 0.35], [0.25, 0.3]]) {
    m.cylinder([px, py, 1.5], 0.08, pipes - 1.5, { ...STEEL, segments: 6, top: false, bottom: false });
  }
  return m.build();
}

function stool() {
  const m = new ModelBuilder('cantina-stool');
  m.cylinder([0, 0, 0], 0.2, 0.05, { ...TRIM, segments: 8, bottom: false });
  m.cylinder([0, 0, 0.05], 0.05, 0.55, { ...TRIM, segments: 6, top: false, bottom: false });
  m.cylinder([0, 0, 0.6], 0.26, 0.1, { ...STEEL, segments: 10 });
  return m.build();
}

const SEAT = { tex: 'ware-red' };
const GLOW = { color: [255, 210, 140], glow: true };

function booth() {
  const m = new ModelBuilder('cantina-booth');
  const C = BOOTH.table;
  const [ro, rb, ri] = [BOOTH.r, BOOTH.r - 0.15, 0.95]; // the back's outside and inside, the seat's front
  const N = 8;
  const P = (r, a) => [Math.cos(a) * r, C + Math.sin(a) * r];
  for (let k = 0; k < N; k++) {
    const [a0, a1] = [Math.PI + (k / N) * Math.PI, Math.PI + ((k + 1) / N) * Math.PI];
    // The seat, and the back behind it up to shoulder height; their
    // joints, outsides (to the walls) and undersides hidden, but the ends.
    const end = (i) => (i === 3 && k === 0) || (i === 1 && k === N - 1);
    m.prism([P(rb, a0), P(rb, a1), P(ri, a1), P(ri, a0)], 0, 0.45, { ...SEAT, bottom: false, side: (i) => (i === 2 || end(i) ? SEAT : false) });
    m.prism([P(ro, a0), P(ro, a1), P(rb, a1), P(rb, a0)], 0, 1.1, { tex: WALL, bottom: false, side: (i) => (i === 2 || end(i) ? { tex: WALL } : false) });
  }
  // The table: a foot, a post and a round top, a lamp glowing on it.
  m.cylinder([0, C, 0], 0.3, 0.05, { ...TRIM, segments: 8, bottom: false });
  m.cylinder([0, C, 0.05], 0.08, 0.63, { ...TRIM, segments: 6, top: false, bottom: false });
  m.cylinder([0, C, 0.68], 0.55, 0.06, { ...WOOD, segments: 10 });
  m.cylinder([0.2, C - 0.15, 0.74], 0.07, 0.16, { ...GLOW, segments: 6, bottom: false });
  m.cylinder([0.2, C - 0.15, 0.9], 0.1, 0.03, { ...TRIM, segments: 6 });
  m.line(-ro, 0, -ro, C).line(-ro, C, -0.6, C + 0.6).line(-0.6, C + 0.6, 0.6, C + 0.6).line(0.6, C + 0.6, ro, C).line(ro, C, ro, 0);
  return m.build();
}

function detector() {
  const m = new ModelBuilder('cantina-detector');
  m.box([-0.25, 0, 0], [0.25, 0.22, 0.55], { ...STEEL, side: (i) => (i === 0 ? false : STEEL) });
  m.box([-0.18, 0.22, 0.08], [0.18, 0.24, 0.26], { tex: 'vent-grille', side: (i) => (i === 0 ? false : TRIM) });
  m.box([-0.08, 0.22, 0.36], [0.08, 0.27, 0.46], { color: [255, 40, 30], glow: true, side: (i) => (i === 0 ? false : { color: [255, 40, 30], glow: true }) });
  m.cylinder([0.18, 0.11, 0.55], 0.015, 0.25, { ...TRIM, segments: 4, bottom: false });
  return m.build();
}

function sign() {
  const m = new ModelBuilder('cantina-sign');
  const lit = { color: [255, 150, 60], glow: true };
  m.box([-0.22, 0, 0], [0.22, 0.1, 0.32], { ...TRIM, side: (i) => (i === 0 ? false : i === 2 ? lit : TRIM) });
  return m.build();
}

function lamp() {
  const m = new ModelBuilder('cantina-lamp');
  m.cylinder([0, 0, 0.2], 0.015, LAMP_CORD - 0.2, { ...TRIM, segments: 4, top: false, bottom: false });
  m.box([-0.07, -0.07, 0.06], [0.07, 0.07, 0.2], { ...TRIM, top: false });
  m.box([-0.06, -0.06, 0], [0.06, 0.06, 0.06], GLOW);
  return m.build();
}

// The grime on a corner's panel (decals only go on the grid's walls): soot
// down from the ceiling, dirt along its foot, a stain and smudges, as
// grimeIndoors() puts on the walls round it. [picture, its middle along the
// panel, its middle up it, its width and height.]
const CORNER_GRIME = [
  ['grime-streaks-1', -2.6, 2.6, 2, 2.8], ['grime-streaks-3', 0.4, 3, 3, 2], ['grime-streaks-2', 2.9, 2.7, 1.8, 2.6],
  ['grime-dust-1', -2, 0.5, 4, 1], ['grime-dust-2', 2, 0.6, 4, 1.25],
  ['grime-blotch-2', -0.6, 1.7, 2.4, 1.6], ['grime-smudge', 1.6, 1.3, 1, 1.25], ['grime-smudge', -3.3, 1.2, 0.9, 1.1],
];

function corner() {
  const m = new ModelBuilder('cantina-corner');
  const [a, h] = [CORNER.len / 2, CORNER.h];
  m.face([[-a, 0, 0], [a, 0, 0], [a, 0, h], [-a, 0, h]], { tex: WALL, flat: true }, [0, -1, h / 2]);
  // (A hair in front of the panel, so it darkens it.)
  for (const [tex, x, z, w, gh] of CORNER_GRIME) {
    const [l, r, b, t] = [x - w / 2, x + w / 2, z - gh / 2, z + gh / 2];
    m.face([[l, 0.01, b], [r, 0.01, b], [r, 0.01, t], [l, 0.01, t]], { tex, uv: [[0, 1], [1, 1], [1, 0], [0, 0]] }, [x, -1, z]);
  }
  m.line(-a, 0, a, 0);
  return m.build();
}

// Bottles: glass in a few colours.
const GLASS = [[60, 110, 70], [120, 70, 40], [70, 90, 130], [150, 140, 90], [110, 50, 60]];

function shelves() {
  const m = new ModelBuilder('cantina-shelves');
  const [w, d, h] = [0.95, 0.9, 2.2]; // half its width, its depth, its height
  // The back and sides, and the shelf boards across.
  m.box([-w, 0, 0], [w, 0.1, h], { ...WOOD, bottom: false });
  for (const sx of [-1, 1]) m.box([sx * w - 0.1, -d, 0], [sx * w + 0.1, 0.1, h], { ...WOOD, bottom: false });
  const boards = [0, 0.75, 1.45, 2.15];
  for (const z of boards) m.box([-w + 0.1, -d, z], [w - 0.1, 0, z + 0.07], { ...WOOD, bottom: z > 0 ? WOOD : false });
  // Bottles along the three shelves, spaced unevenly.
  let n = 0;
  for (const z of boards.slice(0, 3)) {
    for (let x = -w + 0.35; x < w - 0.2; x += 0.38 + ((n * 7) % 5) * 0.06) {
      const tall = 0.32 + ((n * 3) % 4) * 0.06;
      const color = GLASS[n % GLASS.length];
      const y = -0.35 - ((n * 5) % 3) * 0.12;
      // (Its back, to the wall, hidden.)
      m.box([x - 0.08, y - 0.08, z + 0.07], [x + 0.08, y + 0.08, z + 0.07 + tall], { color, bottom: false, side: (i) => (i === 2 ? false : { color }) });
      n++;
    }
  }
  m.line(-w - 0.1, -d, w + 0.1, -d);
  return m.build();
}


function canopy() {
  const m = new ModelBuilder('cantina-canopy');
  const { rx, ry, band, thick: t } = CANOPY;
  // Lit as the ceiling round it (the level gives it the room's light), not
  // shaded by its faces' turn.
  const edge = { ...WOOD, flat: true };
  for (let k = 0; k < RING; k++) {
    const [a0, a1] = [(k / RING) * Math.PI * 2, ((k + 1) / RING) * Math.PI * 2];
    m.prism([on(rx, ry, a0), on(rx, ry, a1), on(rx - t, ry - t, a1), on(rx - t, ry - t, a0)], 0, band, { ...edge, top: false, side: (i) => (i === 1 || i === 3 ? false : edge) });
  }
  // The well's top, glowing (its brightness its own, so the tiles' light
  // stays low and doesn't spill onto the ceiling round it), facing down: in
  // four quarters, as the renderer takes polygons of up to 16 points.
  const q = RING / 4;
  for (let s = 0; s < 4; s++) {
    const rim = Array.from({ length: q + 1 }, (_, k) => [...on(rx - t, ry - t, ((s * q + k) / RING) * Math.PI * 2), band - 0.01]);
    m.face([[0, 0, band - 0.01], ...rim], { tex: 'adobe-pale', glow: true }, [0, 0, band + 1]);
  }
  return m.build();
}

export default [bar(), taps(), stool(), booth(), corner(), detector(), sign(), lamp(), shelves(), canopy()];
