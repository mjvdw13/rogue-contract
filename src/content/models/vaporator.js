import { ModelBuilder } from './lib/build.js';

// The Homestead's moisture vaporators (levels/m2.js, docs/mission2.md, "The
// look"): in the courtyard, a cluster of stacked drums with thin rods
// standing round them, a squat unit and domed caps at their feet; on the
// farm's ground, the film's tall vaporators, a sensor turning on a mast.
// Worn white paint over grey metal, the farm's sand on them. The
// origin is on the floor under each one's middle. Mos Eisley keeps its own
// small vaporator (models/clutter.js).

/** A ring of `n` points of radius `r` (x, y), turned by `turn` radians. */
const ring = (n, r, turn = 0) => Array.from({ length: n }, (_, i) => [Math.cos(turn + (i / n) * Math.PI * 2) * r, Math.sin(turn + (i / n) * Math.PI * 2) * r]);

const WHITE = { tex: 'dome-white' };
const COLLAR = { tex: 'band-steel' };
const GREY = { tex: 'metal-grey' };
const DARK = { color: ['gray', 0.2] };
const N = 10;
const TURN = Math.PI / N;

/** A drum: a plain side, open ends (a collar or a cap covers them). */
const drum = (m, z, r, h, style = WHITE) => m.cylinder([0, 0, z], r, h, { segments: N, turn: TURN, ...style, top: false, bottom: false });

/** A collar: a short dark band a little wider than the drums it joins, closed top and bottom. */
const collar = (m, z, r, h = 0.22) => m.cylinder([0, 0, z], r, h, { segments: N, turn: TURN, ...COLLAR, top: DARK, bottom: DARK });

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

/** Rods standing round a column: `n` thin rods at radius `r`, `h` tall, braced to it at `braces` heights. */
function rods(m, n, r, h, braces, turn = 0) {
  for (const [x, y] of ring(n, r, turn)) {
    strut(m, [x, y, 0], [x, y, h], 0.07, GREY);
    m.cylinder([x, y, h], 0.06, 0.08, { segments: 6, color: ['gray', 0.3], bottom: false });
    for (const [z, inner] of braces) strut(m, [x * (inner / r), y * (inner / r), z], [x, y, z], 0.05, DARK);
  }
}

/** The cluster's tall vaporator, 4 m: three drums narrowing up, collars between, a domed top, four rods round it. */
function tall() {
  const m = new ModelBuilder('vaporator-tall');
  collar(m, 0, 0.72, 0.35);
  drum(m, 0.35, 0.58, 2.6);
  collar(m, 2.95, 0.66, 0.25);
  drum(m, 3.2, 0.44, 2.1);
  collar(m, 5.3, 0.5, 0.2);
  drum(m, 5.5, 0.3, 1.6, GREY);
  collar(m, 7.1, 0.36, 0.15);
  dome(m, 7.25, 0.3, WHITE);
  // The rods: four, nearly its height, braced at the collars.
  rods(m, 4, 0.95, 6.8, [[3.05, 0.66], [5.4, 0.5]], Math.PI / 4);
  // A pipe out of its foot into the floor (the tank under it), and a valve box.
  m.box([0.55, -0.18, 0], [0.85, 0.18, 0.7], { ...GREY, top: DARK });
  return m.build();
}

/** The cluster's second vaporator, 2.75 m: two drums and a cap, three rods. */
function mid() {
  const m = new ModelBuilder('vaporator-mid');
  collar(m, 0, 0.6, 0.3);
  drum(m, 0.3, 0.48, 2.3);
  collar(m, 2.6, 0.55, 0.22);
  drum(m, 2.82, 0.32, 1.9);
  collar(m, 4.72, 0.38, 0.15);
  dome(m, 4.87, 0.32, WHITE);
  rods(m, 3, 0.8, 4.9, [[2.7, 0.55]], Math.PI / 6);
  return m.build();
}

/** The squat unit, 1.2 m: a wide low drum with a domed lid and a vent on its side. */
function squat() {
  const m = new ModelBuilder('vaporator-squat');
  collar(m, 0, 0.82, 0.25);
  drum(m, 0.25, 0.75, 1.3);
  collar(m, 1.55, 0.8, 0.15);
  dome(m, 1.7, 0.7, WHITE, 3);
  // A vent on its side, standing a little proud.
  m.box([0.74, -0.25, 0.5], [0.8, 0.25, 1.1], { tex: 'vent-slats', top: DARK, bottom: false });
  return m.build();
}

/** A domed cap, 0.5 m: a silver dome on a short stalk, a collar round its foot. */
function cap() {
  const m = new ModelBuilder('vaporator-cap');
  m.cylinder([0, 0, 0], 0.32, 0.1, { segments: N, turn: TURN, ...COLLAR, bottom: false });
  m.cylinder([0, 0, 0.1], 0.1, 0.35, { segments: 6, ...GREY, top: false, bottom: false });
  m.cylinder([0, 0, 0.45], 0.42, 0.06, { segments: N, turn: TURN, ...COLLAR, top: false });
  dome(m, 0.51, 0.42, { color: ['steel', 0.7] }, 3);
  return m.build();
}

/** The farm vaporator's body, to the top of its telemetry cone, and its mast's top. */
const BODY = 7.75;
const MAST = 10.75;
const PAINT = { tex: 'ware-white' };
const SHADE = { tex: 'dome-white' };

/** A white drum with a lid (its bottom sits on the piece below, unless `under`). */
const block = (m, z, r, h, style = PAINT, under = false) => m.cylinder([0, 0, z], r, h, { segments: 8, turn: Math.PI / 8, ...style, bottom: under && style });
/** A stub `len` long sticking out sideways from the column, along `axis` ('x' or 'y'), `dir` 1 or -1. */
function stub(m, axis, dir, from, z, r, len, style = PAINT, at = 0) {
  const base = axis === 'x' ? [dir > 0 ? from : -from - len, at, z] : [at, dir > 0 ? from : -from - len, z];
  // (Its end against the column is hidden: the near end going +, the far end going -.)
  m.cylinder(base, r, len, { segments: 6, axis, ...style, [dir > 0 ? 'bottom' : 'top']: false });
}

/**
 * A moisture vaporator for the farm's ground, after the film's (Mark's
 * references, 2026-11-07): 5.4 m to its sensor. A flared foot, the water
 * pump, the condenser box (louvres on its front, two monitor dials beside
 * them), the coolant section with its coupling and a pipe out of its side,
 * the brain unit's wide discs, the ribbed air intake, a narrow column of
 * banded drums with valves and sensors on it, the telemetry cone and a
 * thin mast; three chiller bars stand round it, joined to it at its foot
 * and its middle. Its front is +y. The humidity sensor on the mast's top is
 * its own model, turning.
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
  for (const z of [1.85, 2.3]) stub(m, 'y', 1, 0.65, z, 0.16, 0.12, { tex: 'vent-round', top: { tex: 'vent-round' } }, -0.4);
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
  // The air intake: ribbed.
  for (let k = 0; k < 4; k++) block(m, 4.5 + k * 0.1, k % 2 ? 0.4 : 0.46, 0.1, k % 2 ? SHADE : PAINT);
  // The column: drums with bands between, a pressure relief valve, sensors.
  let z = 4.9;
  // (Narrow bands between the drums mark the joins.)
  for (const [h, r] of [[0.4, 0.34], [0.08, 0.3], [0.5, 0.33], [0.08, 0.29], [0.4, 0.33], [0.08, 0.29], [0.45, 0.31], [0.08, 0.27], [0.33, 0.3]]) {
    block(m, z, r, h, r < 0.3 || h < 0.1 ? SHADE : PAINT);
    z += h;
  }
  stub(m, 'x', 1, 0.3, 5.1, 0.16, 0.25, SHADE);
  stub(m, 'y', 1, 0.3, 5.6, 0.12, 0.12, SHADE);
  stub(m, 'x', -1, 0.3, 6.1, 0.07, 0.25);
  stub(m, 'x', 1, 0.3, 6.5, 0.07, 0.2);
  // The telemetry cone, a stub on it, and the mast.
  m.loft(ring(N, 0.3, TURN), z, ring(N, 0.19, TURN), BODY, { ...PAINT, bottom: false, top: { ...SHADE } });
  stub(m, 'x', 1, 0.22, BODY - 0.3, 0.05, 0.25);
  m.cylinder([0, 0, BODY], 0.07, MAST - BODY, { segments: 6, ...PAINT, bottom: false });
  // The chiller bars: three round it, a joint partway up, rounded tops,
  // arms to the column at its foot and its middle ring.
  for (const a of [115, 235, 355]) {
    const [x, y] = [Math.cos((a * Math.PI) / 180) * 1.1, Math.sin((a * Math.PI) / 180) * 1.1];
    m.cylinder([x, y, 0.3], 0.11, 4.6, { segments: 6, ...PAINT, bottom: false, top: false });
    m.cylinder([x, y, 2.6], 0.13, 0.12, { segments: 6, ...SHADE });
    dome(m, 4.9, 0.11, PAINT, 1, [x, y]);
    for (const h of [0.3, 3.82]) strut(m, [x * 0.5, y * 0.5, h + 0.08], [x, y, h + 0.08], 0.14, PAINT);
  }
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

/** Each model's decoration size (for collision and the level checker). */
export const VAPORATORS = {
  'vaporator-tall': { model: tall, solid: true, radius: 1, height: 7.55 },
  'vaporator-mid': { model: mid, solid: true, radius: 0.85, height: 5.2 },
  'vaporator-squat': { model: squat, solid: true, radius: 0.85, height: 2.4 },
  'vaporator-cap': { model: cap, radius: 0.42, height: 0.93 },
  'vaporator-farm': { model: farm, solid: true, radius: 1.2, height: BODY },
};
/** How high the humidity sensor sits on the farm vaporator. */
export const SENSOR_Z = MAST;

export default [...Object.values(VAPORATORS).map((v) => v.model()), sensor()];
