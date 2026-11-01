import { ModelBuilder } from './lib/build.js';

// The gutted freighter's hold (levels/m1.js, models/freighter.js), fitted
// out inside as a ship and left: ribs across it, wires hanging where the
// ceiling's panels are gone, panels fallen off the walls, a dead console.
export const HOLD = {
  /** Half the hold's width, wall to wall, and its height to the ceiling. */
  half: 3.5,
  height: 3.25,
};

const RIB = { tex: 'metal-rust', texScale: 0.5 };
const PANEL = { tex: 'hold-wall', texScale: 1 };

/** A flat strip from a to b (3D points), `w` wide across `across` ('x', 'y' or 'z'), seen from both sides. */
function strap(m, a, b, w, style, across) {
  const d = { x: [w / 2, 0, 0], y: [0, w / 2, 0], z: [0, 0, w / 2] }[across];
  const at = (p, s) => [p[0] + s * d[0], p[1] + s * d[1], p[2] + s * d[2]];
  m.face([at(a, -1), at(a, 1), at(b, 1), at(b, -1)], { ...style, twoSided: true });
}

// `hold-rib`: a frame across the hold, wall to wall and under the ceiling,
// gussets in its top corners. Built across y, the origin on the deck in
// the middle of the hold.
function rib() {
  const m = new ModelBuilder('hold-rib');
  const { half: h, height: H } = HOLD;
  const [w, d] = [0.16, 0.18];
  for (const s of [-1, 1]) {
    const y = s * h;
    m.box([-w, Math.min(y, y - s * d), 0], [w, Math.max(y, y - s * d), H], { ...RIB, top: false, bottom: false });
    // The gusset: a plate across the corner, both sides.
    const [y0, y1] = [y - s * d, y - s * (d + 0.7)];
    m.face([[0, y0, H - d], [0, y0, H - d - 0.7], [0, y1, H - d]], { ...RIB, twoSided: true });
  }
  m.box([-w, -h, H - d], [w, h, H], { ...RIB, top: false, side: (i) => (i === 1 || i === 3 ? false : undefined) });
  return m.build();
}

// Wires hanging out of a hole in the ceiling: loops sagging between points
// in the hole and loose ends dangling, dull insulation. The origin on the
// deck under the hole; `top` is the hole's height. The live one's end
// spits sparks (decor.js).
export const WIRES = {
  'hold-wires': { top: 4, spark: null },
  'hold-wires-live': { top: 4, spark: [0.35, 0.2, 1.95] },
};
const INSULATION = [[24, 22, 20], [70, 30, 24], [18, 18, 20], [96, 82, 30], [30, 34, 44]];

function wires(id) {
  const { top, spark } = WIRES[id];
  const m = new ModelBuilder(id);
  const c = (i) => ({ color: INSULATION[i % INSULATION.length] });
  // Loops: [x0, y0, x1, y1, how low they sag].
  const loops = [[-0.45, -0.3, 0.4, -0.1, 2.3], [-0.2, 0.35, 0.45, 0.3, 2.6], [-0.4, 0.1, 0.1, -0.4, 2.45]];
  loops.forEach(([x0, y0, x1, y1, low], i) => {
    const n = 6;
    const pt = (u) => [x0 + (x1 - x0) * u, y0 + (y1 - y0) * u, top - (top - low) * Math.sin(Math.PI * u)];
    for (let j = 0; j < n; j++) strap(m, pt(j / n), pt((j + 1) / n), 0.05, c(i), Math.abs(x1 - x0) > Math.abs(y1 - y0) ? 'y' : 'x');
  });
  // Loose ends, curling a little as they fall.
  const ends = [[-0.1, -0.15, 2.1], [0.3, 0.25, 2.4], ...(spark ? [[spark[0], spark[1], spark[2]]] : [[0.35, 0.2, 2.2]])];
  ends.forEach(([x, y, low], i) => {
    const pts = [[x - 0.1, y, top], [x - 0.05, y + 0.05, (top + low) / 2 + 0.3], [x + 0.05, y, (top + low) / 2 - 0.2], [x, y, low]];
    for (let j = 0; j < pts.length - 1; j++) strap(m, pts[j], pts[j + 1], 0.05, c(i + 3), 'x');
  });
  return m.build();
}

// `hold-panel-leaning`: a wall panel fallen off, leant against the wall
// (its back at y = 0, the panel tipping out to +y). `hold-panel-down`: one
// flat on the deck.
function panelLeaning() {
  const m = new ModelBuilder('hold-panel-leaning');
  m.face([[-0.5, 0.55, 0], [0.5, 0.55, 0], [0.5, 0.05, 1.9], [-0.5, 0.05, 1.9]], { ...PANEL, twoSided: true });
  return m.build();
}
function panelDown() {
  const m = new ModelBuilder('hold-panel-down');
  m.box([-0.5, -0.95, 0], [0.5, 0.95, 0.04], { ...PANEL, bottom: false });
  return m.build();
}

// `hold-console`: a dead console against the wall (its back at y = 0,
// facing +y): a cabinet, a sloped desk with its screen dark and cracked
// and its panel hanging open below.
export const CONSOLE = { width: 1.4, depth: 0.7, height: 1.15 };
function console_() {
  const m = new ModelBuilder('hold-console');
  const { width: w, depth: d, height: h } = CONSOLE;
  const a = w / 2;
  m.box([-a, 0, 0], [a, 0.35, h + 0.5], { ...PANEL, bottom: false });
  m.prism([[0.35, 0], [d, 0], [d, 0.85], [0.35, h]], -a, a, { ...PANEL, axis: 'x', bottom: false, side: (i) => (i === 0 || i === 3 ? false : i === 2 ? { color: [20, 26, 28] } : { tex: 'hold-guts', texScale: 0.5 }) });
  // Two indicator lamps still lit on the desk's edge, dim.
  for (const [x, col] of [[-0.45, [150, 60, 40]], [-0.3, [150, 120, 50]]]) m.box([x - 0.03, d - 0.02, 0.86], [x + 0.03, d + 0.01, 0.9], { color: col, glow: true, bottom: false });
  // The panel under the desk hanging open off its bottom hinge.
  m.face([[-0.35, d + 0.02, 0.15], [0.35, d + 0.02, 0.15], [0.35, d + 0.45, 0.5], [-0.35, d + 0.45, 0.5]], { ...PANEL, twoSided: true });
  m.outlineLines([[-a, 0], [a, 0], [a, d], [-a, d]]);
  return m.build();
}

export default [rib(), ...Object.keys(WIRES).map(wires), panelLeaning(), panelDown(), console_()];
