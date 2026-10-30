import { ModelBuilder } from './lib/build.js';
import { PLASTERS } from './dome.js';

// The jamb of a Mos Eisley doorway (Mark's reference, 2026-10-17): pale
// tiles lining the opening from the wall's face back to the door, its
// corners rounded. A thin tube just inside the town kit's door recess (2
// tiles wide, 3 high, 1 deep: lib/town.js, door()). Built looking south
// (+y): the wall's face at y 0.5, the wall's back (or the recess's) at y
// -0.5; the kit turns it to face its wall.
//
// `door-lips-<wall>`: the bevelled corners round the curve on the wall's
// face, filling the square corners of the recess down to the rounded
// lining, in the wall's own texture. The faces are `flat`, lit as the wall
// round them (render/models.js), so the opening reads as rounded in the
// wall rather than framed in tiles. Built looking south with the wall's
// face at y 0; a door through a wall has a pair, one on each face. The top
// corners are one model per plaster (`door-lips-pale`, as the domes) and
// `door-lips-metal` for grey metal walls; the bottom ones
// (`door-lips-foot-pale`) come in those and in the skirts' textures too
// (`door-lips-foot-plinth`), as the wall's foot is.

const W = 1; // half the opening's width
const H = 3; // the opening's height
const R = 0.35; // the corners' radius
const E = 0.02; // inset from the recess's walls, so the tiles draw over them
const STEPS = 4; // segments per corner

/** The walls doors' lips come in, by the models' suffix. */
export const LIP_WALLS = { ...PLASTERS, '-metal': 'metal-grey' };
/** And their feet: the walls, and the skirts along their foot (lib/town.js, SKIRTS). */
export const LIP_FEET = { ...LIP_WALLS, '-dirt': 'adobe-skirt', '-plinth': 'adobe-brick' };

/** The opening's outline, [x, z] round it: rounded corners inset by E. */
function outline() {
  const pts = [];
  const corners = [
    [W - E - R, H - E - R, 0], // top right, from straight right round to straight up
    [-W + E + R, H - E - R, 90],
    [-W + E + R, E + R, 180],
    [W - E - R, E + R, 270],
  ];
  for (const [cx, cz, a0] of corners) {
    for (let k = 0; k <= STEPS; k++) {
      const a = ((a0 + (k / STEPS) * 90) * Math.PI) / 180;
      pts.push([cx + Math.cos(a) * R, cz + Math.sin(a) * R]);
    }
  }
  return pts;
}

// The lining's tiles: a quarter tile along the opening's edge, and
// stretched to half a tile across its depth, so one row runs from the
// wall's face back to the door on each side of it (Mark, 2026-10-30: two
// did). They run on round the corners from the middle of the sill.
const ALONG = 0.25;
const DEEP = 0.5;
const SQUARES = 8; // the jamb picture's squares each way (derive.mjs)

/** The lining: one strip per edge of the outline, facing in toward the opening's middle. */
function jamb() {
  const m = new ModelBuilder('door-jamb');
  const pts = outline();
  // How far round the outline each point is, and where the sill's middle is.
  const s = [0];
  let sill = 0;
  for (let i = 0; i < pts.length; i++) {
    const [a, b] = [pts[i], pts[(i + 1) % pts.length]];
    if (Math.abs(a[1] - E) < 1e-9 && Math.abs(b[1] - E) < 1e-9 && a[0] < 0 && b[0] > 0) sill = s[i] - a[0];
    s.push(s[i] + Math.hypot(b[0] - a[0], b[1] - a[1]));
  }
  const u = (k) => (s[k] - sill) / (ALONG * SQUARES);
  const front = 1 / (DEEP * SQUARES); // the wall's face; the back's 0
  for (let i = 0; i < pts.length; i++) {
    const [a, b] = [pts[i], pts[(i + 1) % pts.length]];
    const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    // A point behind the strip (away from the opening's middle), for its winding.
    const out = [mid[0] * 2, 0, mid[1] + (mid[1] - H / 2)];
    const uv = [[u(i), front], [u(i + 1), front], [u(i + 1), 0], [u(i), 0]];
    m.face([[a[0], 0.5, a[1]], [b[0], 0.5, b[1]], [b[0], -0.5, b[1]], [a[0], -0.5, a[1]]], { tex: 'door-jamb', uv }, out);
  }
  return m.build();
}

/** The lips: in the wall's face, between each rounded corner (`corners`, of the outline's) and the square corner of the recess. */
function lips(id, tex, corners) {
  const m = new ModelBuilder(id);
  const pts = outline();
  const y = -0.01; // a hair inside the wall's face, over the recess's sides
  for (const c of corners) {
    const sq = [[W, H], [-W, H], [-W, 0], [W, 0]][c];
    for (let k = 0; k < STEPS; k++) {
      const [a, b] = [pts[c * (STEPS + 1) + k], pts[c * (STEPS + 1) + k + 1]];
      m.face([[sq[0], y, sq[1]], [a[0], y, a[1]], [b[0], y, b[1]]], { tex, flat: true }, [0, y - 1, H / 2]);
    }
  }
  return m.build();
}

export default jamb();
export const doorLips = [
  ...Object.entries(LIP_WALLS).map(([suffix, tex]) => lips(`door-lips${suffix}`, tex, [0, 1])),
  ...Object.entries(LIP_FEET).map(([suffix, tex]) => lips(`door-lips-foot${suffix}`, tex, [2, 3])),
];
