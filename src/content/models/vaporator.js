import { ModelBuilder } from './lib/build.js';

// The Homestead's moisture vaporators (levels/m2.js, docs/mission2.md, "The
// look"): in the courtyard, a cluster of stacked drums with thin rods
// standing round them, a squat unit and domed caps at their feet; on the
// farm's ground, tall thin lattice masts with a vane on top. Worn white
// paint over grey metal, dark collars, the farm's sand on them. The
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

/** The lattice mast's height to its top plate. */
const MAST = 10;

/**
 * A tall lattice vaporator for the farm's ground, 5 m: three legs leaning
 * in from a wide foot, braced across every 1.5 m, a drum at its foot, a
 * collector drum up its middle, and on top a vane, a flat blade on a pivot.
 */
function lattice() {
  const m = new ModelBuilder('vaporator-lattice');
  // The foot: a drum the legs stand round.
  collar(m, 0, 0.45, 0.2);
  drum(m, 0.2, 0.38, 1.4);
  collar(m, 1.6, 0.42, 0.15);
  // The legs, from radius 0.75 on the ground to 0.2 at the top.
  const at = (z) => 0.75 - (0.55 * z) / MAST;
  const leg = (k, z) => {
    const a = (k / 3) * Math.PI * 2 + Math.PI / 2;
    return [Math.cos(a) * at(z), Math.sin(a) * at(z), z];
  };
  for (let k = 0; k < 3; k++) strut(m, leg(k, 0), leg(k, MAST), 0.09, GREY);
  // Braces: a ring round at each level and a diagonal on each face.
  for (let z = 1.5; z < MAST; z += 3) {
    for (let k = 0; k < 3; k++) {
      strut(m, leg(k, z), leg((k + 1) % 3, z), 0.05, DARK);
      if (z + 3 <= MAST) strut(m, leg(k, z), leg((k + 1) % 3, z + 3), 0.04, DARK);
    }
  }
  // The collector: a thin drum up the middle, white.
  drum(m, 4, 0.22, 3);
  collar(m, 7, 0.26, 0.15);
  collar(m, 3.85, 0.26, 0.15);
  // The top plate, a mast for the vane, the pivot.
  m.cylinder([0, 0, MAST], 0.32, 0.1, { segments: 6, ...COLLAR });
  m.cylinder([0, 0, MAST + 0.1], 0.05, 1.1, { segments: 6, ...GREY, bottom: false });
  return m.build();
}

/** The lattice mast's vane: a flat blade on an arm, turning on its pivot (a decoration on the mast's top). */
function vane() {
  const m = new ModelBuilder('vaporator-vane');
  m.cylinder([0, 0, 0], 0.08, 0.2, { segments: 6, ...COLLAR });
  strut(m, [-0.6, 0, 0.1], [0.5, 0, 0.1], 0.05, DARK);
  m.face([[-0.55, 0, -0.25], [-1.35, 0, -0.15], [-1.35, 0, 0.55], [-0.55, 0, 0.4]], { ...WHITE, twoSided: true });
  m.cylinder([0.5, 0, 0.1], 0.09, 0.15, { segments: 6, axis: 'x', ...DARK });
  return m.build();
}

/** Each model's decoration size (for collision and the level checker). */
export const VAPORATORS = {
  'vaporator-tall': { model: tall, solid: true, radius: 1, height: 7.55 },
  'vaporator-mid': { model: mid, solid: true, radius: 0.85, height: 5.2 },
  'vaporator-squat': { model: squat, solid: true, radius: 0.85, height: 2.4 },
  'vaporator-cap': { model: cap, radius: 0.42, height: 0.93 },
  'vaporator-lattice': { model: lattice, solid: true, radius: 0.8, height: MAST + 1.2 },
};
/** How high the vane sits on the lattice mast. */
export const VANE_Z = MAST + 1.2;

export default [...Object.values(VAPORATORS).map((v) => v.model()), vane()];
