import { ModelBuilder } from './lib/build.js';

// The Homestead's moisture vaporators (levels/m2.js, docs/mission2.md, "The
// look"), all in the film's parts (Mark's references, 2026-11-07). In the
// courtyard, a cluster of two vaporators without masts, a squat unit and
// domed caps at their feet; on the farm's ground, the tall ones, a sensor
// turning on a mast. Worn white paint, the farm's sand on them. The origin
// is on the floor under each one's middle, the front +y. Mos Eisley keeps
// its own small vaporator (models/clutter.js).

/** A ring of `n` points of radius `r` (x, y), turned by `turn` radians. */
const ring = (n, r, turn = 0) => Array.from({ length: n }, (_, i) => [Math.cos(turn + (i / n) * Math.PI * 2) * r, Math.sin(turn + (i / n) * Math.PI * 2) * r]);

const N = 10;
const TURN = Math.PI / N;
const PAINT = { tex: 'ware-white' };
const SHADE = { tex: 'dome-white' };

/** A dome of radius `r` on `z`, in `steps` bands; its tip a point. */
function dome(m, z, r, style, steps = 3, at = [0, 0]) {
  const band = (k) => {
    const a = (k / steps) * (Math.PI / 2);
    return [r * Math.cos(a), z + r * Math.sin(a)];
  };
  const shift = (pts) => pts.map(([x, y]) => [x + at[0], y + at[1]]);
  for (let k = 0; k < steps; k++) {
    const [r0, z0] = band(k);
    const [r1, z1] = band(k + 1);
    const top = k === steps - 1;
    m.loft(shift(ring(N, r0, TURN)), z0, shift(ring(N, top ? 0.001 : r1, TURN)), z1, { ...style, top: false, bottom: false });
  }
}

/** A thin square beam `w` wide from point `a` to `b` (its four sides, no ends). */
function strut(m, a, b, w, style) {
  const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const len = Math.hypot(...d);
  const t = d.map((v) => v / len);
  // Two directions across the beam: one level (or along x when upright), the other square to both.
  let u = Math.abs(t[2]) > 0.95 ? [1, 0, 0] : [-t[1], t[0], 0];
  const ul = Math.hypot(...u);
  u = u.map((v) => (v / ul) * (w / 2));
  const v = [t[1] * u[2] - t[2] * u[1], t[2] * u[0] - t[0] * u[2], t[0] * u[1] - t[1] * u[0]];
  const corner = (p, su, sv) => [p[0] + su * u[0] + sv * v[0], p[1] + su * u[1] + sv * v[1], p[2] + su * u[2] + sv * v[2]];
  const signs = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
  const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
  for (let i = 0; i < 4; i++) {
    const [s0, s1] = [signs[i], signs[(i + 1) % 4]];
    m.face([corner(a, ...s0), corner(a, ...s1), corner(b, ...s1), corner(b, ...s0)], style, mid);
  }
}

/** A white drum with a lid (its bottom sits on the piece below, unless `under`). */
const block = (m, z, r, h, style = PAINT, under = false) => m.cylinder([0, 0, z], r, h, { segments: 8, turn: Math.PI / 8, ...style, bottom: under && style });

/** A stub `len` long sticking out sideways from the column, along `axis` ('x' or 'y'), `dir` 1 or -1, offset `at` across. */
function stub(m, axis, dir, from, z, r, len, style = PAINT, at = 0) {
  const base = axis === 'x' ? [dir > 0 ? from : -from - len, at, z] : [at, dir > 0 ? from : -from - len, z];
  // (Its end against the column is hidden: the near end going +, the far end going -.)
  m.cylinder(base, r, len, { segments: 6, axis, ...style, [dir > 0 ? 'bottom' : 'top']: false });
}

/** The flared foot a vaporator stands on, `h` tall, from radius `r0` to `r1`. */
const foot = (m, r0, r1, h = 0.28) => m.loft(ring(N, r0, TURN), 0, ring(N, r1, TURN), h, { ...SHADE, bottom: false });

/** Louvres on a box's front (its +y face at `y`), from `x0` to `x1` and `z0` to `z1`. */
const louvres = (m, x0, x1, z0, z1, y) => m.box([x0, y + 0.001, z0], [x1, y + 0.01, z1], { tex: 'vent-slats', texScale: x1 - x0, top: false, bottom: false });

/** Monitor dials on a front (+y) at `y`, at `x` and heights `zs`. */
const dials = (m, x, zs, y) => zs.forEach((z) => stub(m, 'y', 1, y, z, 0.15, 0.1, { tex: 'vent-round', top: { tex: 'vent-round' } }, x));

/** The air intake's ribs: `n` thin discs from `z`, alternately `r` and a little narrower. Returns the top. */
function ribs(m, z, r, n) {
  for (let k = 0; k < n; k++) block(m, z + k * 0.1, k % 2 ? r - 0.06 : r, 0.1, k % 2 ? SHADE : PAINT);
  return z + n * 0.1;
}

/** A banded column from `z`: drums `[h, r]`, the thin bands between them a shade darker. Returns the top. */
function column(m, z, parts) {
  for (const [h, r] of parts) {
    block(m, z, r, h, h < 0.15 ? SHADE : PAINT);
    z += h;
  }
  return z;
}

/**
 * Chiller bars standing round a vaporator: at radius `r` and `angles`
 * (degrees), from its foot to `top`, a joint at `joint`, rounded tops, and
 * arms in to the body (to radius `inner`) at each height in `arms`.
 */
function bars(m, r, angles, top, joint, arms, inner) {
  for (const a of angles) {
    const [x, y] = [Math.cos((a * Math.PI) / 180) * r, Math.sin((a * Math.PI) / 180) * r];
    m.cylinder([x, y, 0.28], 0.11, top - 0.28, { segments: 6, ...PAINT, bottom: false, top: false });
    m.cylinder([x, y, joint], 0.13, 0.12, { segments: 6, ...SHADE });
    dome(m, top, 0.11, PAINT, 1, [x, y]);
    for (const h of arms) strut(m, [(x * inner) / r, (y * inner) / r, h], [x, y, h], 0.14, PAINT);
  }
}

/**
 * The courtyard cluster's tall vaporator, 3.4 m: the farm one's parts
 * without its mast. The pump with louvres on its front, a wide drum with
 * dials, a coupling and a pipe out of its side, the brain discs, the ribbed
 * intake, a drum with a valve, a banded column and a domed top. Four
 * chiller bars stand round it.
 */
function tall() {
  const m = new ModelBuilder('vaporator-tall');
  foot(m, 0.95, 0.66);
  block(m, 0.28, 0.62, 1.07);
  m.box([-0.42, 0.4, 0.28], [0.42, 0.74, 1.25], { ...PAINT, bottom: false });
  louvres(m, -0.32, 0.32, 0.4, 1.12, 0.74);
  block(m, 1.35, 0.68, 0.12, SHADE, true);
  block(m, 1.47, 0.6, 1.4);
  m.box([0.45, -0.32, 1.65], [0.78, 0.32, 2.6], { ...PAINT, bottom: false });
  stub(m, 'x', 1, 0.78, 1.95, 0.15, 0.1, { tex: 'vent-round', top: { tex: 'vent-round' } });
  stub(m, 'x', 1, 0.78, 2.35, 0.15, 0.1, { tex: 'vent-round', top: { tex: 'vent-round' } });
  stub(m, 'y', 1, 0.58, 2.2, 0.17, 0.12, SHADE);
  stub(m, 'x', -1, 0.58, 2.1, 0.14, 0.45);
  block(m, 2.87, 0.74, 0.22, PAINT, true);
  block(m, 3.09, 0.7, 0.22);
  let z = ribs(m, 3.31, 0.46, 4);
  block(m, z, 0.44, 1.2);
  stub(m, 'x', 1, 0.42, z + 0.5, 0.15, 0.22, SHADE);
  z = column(m, z + 1.2, [[0.1, 0.47], [0.45, 0.34], [0.08, 0.3], [0.5, 0.33], [0.08, 0.29], [0.4, 0.31]]);
  stub(m, 'y', 1, 0.3, z - 0.7, 0.07, 0.2);
  dome(m, z, 0.31, PAINT, 2);
  bars(m, 1.05, [45, 135, 225, 315], 6, 2.9, [0.32, 2.98], 0.6);
  return m.build();
}

/**
 * The cluster's second vaporator, 2.25 m: the pump with two dials and
 * louvres, a drum with a coupling and a side pipe, a brain disc, ribs, a
 * short banded column and a cone. Three chiller bars round it.
 */
function mid() {
  const m = new ModelBuilder('vaporator-mid');
  foot(m, 0.8, 0.56);
  block(m, 0.28, 0.52, 0.95);
  m.box([-0.38, 0.32, 0.28], [0.3, 0.62, 1.15], { ...PAINT, bottom: false });
  dials(m, -0.18, [0.55, 0.9], 0.62);
  louvres(m, 0.02, 0.26, 0.4, 1.05, 0.62);
  block(m, 1.23, 0.56, 0.1, SHADE, true);
  block(m, 1.33, 0.5, 1.15);
  stub(m, 'y', 1, 0.48, 1.9, 0.16, 0.12, SHADE);
  stub(m, 'x', 1, 0.48, 1.8, 0.12, 0.4);
  block(m, 2.48, 0.62, 0.22, PAINT, true);
  let z = ribs(m, 2.7, 0.4, 3);
  z = column(m, z, [[0.45, 0.32], [0.08, 0.28], [0.45, 0.31], [0.08, 0.27]]);
  stub(m, 'x', -1, 0.3, z - 0.6, 0.13, 0.18, SHADE);
  m.loft(ring(N, 0.29, TURN), z, ring(N, 0.17, TURN), z + 0.4, { ...PAINT, bottom: false, top: SHADE });
  bars(m, 0.9, [90, 210, 330], 4.4, 2.2, [0.32, 2.58], 0.5);
  return m.build();
}

/**
 * The squat unit, 1.1 m: the film's parts cut short. A wide drum with
 * louvres and two dials on its front, a pipe out of its side, a brain disc
 * for a lid and a dome on it.
 */
function squat() {
  const m = new ModelBuilder('vaporator-squat');
  foot(m, 1, 0.82, 0.22);
  block(m, 0.22, 0.78, 1.1);
  m.box([-0.5, 0.55, 0.3], [0.5, 0.88, 1.2], { ...PAINT, bottom: false });
  louvres(m, -0.05, 0.42, 0.4, 1.1, 0.88);
  dials(m, -0.28, [0.6, 0.95], 0.88);
  stub(m, 'x', -1, 0.76, 0.7, 0.14, 0.35);
  block(m, 1.32, 0.88, 0.18, PAINT, true);
  dome(m, 1.5, 0.7, SHADE, 3);
  return m.build();
}

/** A domed cap, 0.5 m: a silver dome on a short stalk, a collar round its foot. */
function cap() {
  const m = new ModelBuilder('vaporator-cap');
  m.cylinder([0, 0, 0], 0.32, 0.1, { segments: N, turn: TURN, ...SHADE, bottom: false });
  m.cylinder([0, 0, 0.1], 0.1, 0.35, { segments: 6, ...PAINT, top: false, bottom: false });
  m.cylinder([0, 0, 0.45], 0.42, 0.06, { segments: N, turn: TURN, ...PAINT, top: false });
  dome(m, 0.51, 0.42, SHADE, 3);
  return m.build();
}

/** The farm vaporator's body, to the top of its telemetry cone, and its mast's top. */
const BODY = 7.75;
const MAST = 10.75;

/**
 * A moisture vaporator for the farm's ground, after the film's (Mark's
 * references, 2026-11-07): 5.4 m to its sensor. A flared foot, the water
 * pump, the condenser box (louvres on its front, two monitor dials beside
 * them), the coolant section with its coupling and a pipe out of its side,
 * the brain unit's wide discs, the ribbed air intake, a narrow column of
 * banded drums with valves and sensors on it, the telemetry cone and a
 * thin mast; three chiller bars stand round it, joined to it at its foot
 * and its middle. The humidity sensor on the mast's top is its own model,
 * turning.
 */
function farm() {
  const m = new ModelBuilder('vaporator-farm');
  // The foot, flared, and the pump unit: a drum with a box on its front.
  m.loft(ring(N, 1, TURN), 0, ring(N, 0.62, TURN), 0.3, { ...SHADE, bottom: false });
  block(m, 0.3, 0.58, 1);
  m.box([-0.5, 0.2, 0.3], [0.62, 0.72, 1.25], { ...PAINT, bottom: false });
  m.box([-0.42, 0.721, 0.5], [-0.12, 0.73, 1.05], { color: ['gray', 0.25], bottom: false, top: false });
  block(m, 1.3, 0.42, 0.2, SHADE);
  // The condenser: a box, louvres on its front's right, two dials on its left.
  m.box([-0.7, -0.55, 1.5], [0.78, 0.65, 2.8], PAINT);
  m.box([0.05, 0.651, 1.6], [0.7, 0.66, 2.7], { tex: 'vent-slats', texScale: 0.65, top: false, bottom: false });
  dials(m, -0.4, [1.85, 2.3], 0.65);
  block(m, 2.8, 0.55, 0.17, SHADE);
  // The coolant section: its coupling on the front, a pipe out of the left side.
  block(m, 2.97, 0.62, 0.83);
  stub(m, 'y', 1, 0.6, 3.35, 0.18, 0.12, SHADE);
  stub(m, 'y', 1, 0.7, 3.35, 0.09, 0.06, { color: ['gray', 0.3] });
  stub(m, 'x', -1, 0.6, 3.4, 0.14, 0.5);
  // The frame's middle ring, and the brain unit's two wide discs.
  block(m, 3.8, 0.66, 0.2, SHADE);
  block(m, 4, 0.74, 0.24, PAINT, true);
  block(m, 4.24, 0.7, 0.26);
  // The air intake, ribbed; the column, drums with narrow bands at the
  // joins; a pressure relief valve and sensors on it.
  let z = ribs(m, 4.5, 0.46, 4);
  z = column(m, z, [[0.4, 0.34], [0.08, 0.3], [0.5, 0.33], [0.08, 0.29], [0.4, 0.33], [0.08, 0.29], [0.45, 0.31], [0.08, 0.27], [0.33, 0.3]]);
  stub(m, 'x', 1, 0.3, 5.1, 0.16, 0.25, SHADE);
  stub(m, 'y', 1, 0.3, 5.6, 0.12, 0.12, SHADE);
  stub(m, 'x', -1, 0.3, 6.1, 0.07, 0.25);
  stub(m, 'x', 1, 0.3, 6.5, 0.07, 0.2);
  // The telemetry cone, a stub on it, and the mast.
  m.loft(ring(N, 0.3, TURN), z, ring(N, 0.19, TURN), BODY, { ...PAINT, bottom: false, top: { ...SHADE } });
  stub(m, 'x', 1, 0.22, BODY - 0.3, 0.05, 0.25);
  m.cylinder([0, 0, BODY], 0.07, MAST - BODY, { segments: 6, ...PAINT, bottom: false });
  bars(m, 1.1, [115, 235, 355], 4.9, 2.6, [0.38, 3.9], 0.55);
  return m.build();
}

/** The humidity sensor on the farm vaporator's mast: two slatted vanes on a crossbar, turning on a hub. */
function sensor() {
  const m = new ModelBuilder('vaporator-sensor');
  m.cylinder([0, 0, 0], 0.09, 0.18, { segments: 6, ...SHADE });
  strut(m, [-0.6, 0, 0.09], [0.6, 0, 0.09], 0.05, PAINT);
  for (const d of [-1, 1]) {
    m.box([d * 0.35 - 0.2, -0.03, -0.12], [d * 0.35 + 0.2, 0.03, 0.3], { ...PAINT });
    m.box([d * 0.35 - 0.005, -0.04, -0.12], [d * 0.35 + 0.005, 0.04, 0.3], { color: ['gray', 0.3] });
  }
  return m.build();
}

/**
 * The courtyard's condenser panel, its landmark (Mark's references): a tall
 * flat panel on the pit's wall, white, ribbed in level slats, framed, with
 * a big gear-like disc on it. Built looking south, its back against the
 * wall at y 0 (and reaching PANEL.sink back into it, so a curving wall
 * leaves no gap), its middle at x 0, on the floor.
 */
export const PANEL = { w: 6, h: 5.5, d: 0.35, sink: 1, disc: 1.35 };
function panel() {
  const m = new ModelBuilder('condenser-panel');
  const { w, h, d, sink, disc } = PANEL;
  const a = w / 2;
  const rim = 0.3;
  const front = { tex: 'panel-ribs', flat: true };
  // The frame round it (standing out a little further), and the ribbed plate inside it.
  for (const [x0, x1, z0, z1] of [[-a, -a + rim, 0, h], [a - rim, a, 0, h], [-a + rim, a - rim, h - rim, h], [-a + rim, a - rim, 0, rim]]) {
    m.box([x0, -sink, z0], [x1, d + 0.1, z1], { ...PAINT, bottom: false, side: (i) => (i === 0 ? false : i === 2 ? { ...PAINT, flat: true } : PAINT) });
  }
  m.face([[-a + rim, d, rim], [a - rim, d, rim], [a - rim, d, h - rim], [-a + rim, d, h - rim]], front, [0, 0, h / 2]);
  // The disc: a drum standing out of the plate, its face the gear.
  const n = 12; // (a face has at most 16 corners once clipped)
  const cz = h * 0.55;
  const pts = Array.from({ length: n }, (_, i) => {
    const t = (i / n) * Math.PI * 2;
    return [Math.cos(t) * disc, Math.sin(t) * disc];
  });
  const at = pts.map(([x, z]) => [x, d + 0.25, cz + z]);
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    m.face([[pts[i][0], d, cz + pts[i][1]], [pts[j][0], d, cz + pts[j][1]], [pts[j][0], d + 0.25, cz + pts[j][1]], [pts[i][0], d + 0.25, cz + pts[i][1]]], SHADE, [0, d + 0.12, cz]);
  }
  m.face(at, { tex: 'gear-disc', flat: true, uv: pts.map(([x, z]) => [0.5 + x / (2 * disc), 0.5 - z / (2 * disc)]) }, [0, 0, cz]);
  m.line(-a, -sink, -a, d + 0.1).line(-a, d + 0.1, a, d + 0.1).line(a, d + 0.1, a, -sink);
  return m.build();
}

/** Each model's decoration size (for collision and the level checker). */
export const VAPORATORS = {
  'vaporator-tall': { model: tall, solid: true, radius: 1.15, height: 6.85 },
  'vaporator-mid': { model: mid, solid: true, radius: 1, height: 4.5 },
  'vaporator-squat': { model: squat, solid: true, radius: 1, height: 2.2 },
  'vaporator-cap': { model: cap, radius: 0.42, height: 0.93 },
  'vaporator-farm': { model: farm, solid: true, radius: 1.2, height: BODY },
};
/** How high the humidity sensor sits on the farm vaporator. */
export const SENSOR_Z = MAST;

export default [...Object.values(VAPORATORS).map((v) => v.model()), sensor(), panel()];
