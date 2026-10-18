import { ModelBuilder } from './lib/build.js';

// The jamb of a Mos Eisley doorway (Mark's reference, 2026-10-17): pale
// tiles lining the opening from the wall's face back to the door, its
// corners rounded. A thin tube just inside the town kit's door recess (2
// tiles wide, 3 high, 1 deep: lib/town.js, door()), with tiled lips filling
// the front corners round the curve. Built looking south (+y): the wall's
// face at y 0.5, the door at y -0.5; the kit turns it to face its wall.

const W = 1; // half the opening's width
const H = 3; // the opening's height
const R = 0.35; // the corners' radius
const E = 0.02; // inset from the recess's walls, so the tiles draw over them
const STEPS = 4; // segments per corner

const tile = { tex: 'door-jamb' };

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

const m = new ModelBuilder('door-jamb');
const pts = outline();
// The lining: one strip per edge of the outline, facing in toward the opening's middle.
for (let i = 0; i < pts.length; i++) {
  const [a, b] = [pts[i], pts[(i + 1) % pts.length]];
  const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  // A point behind the strip (away from the opening's middle), for its winding.
  const out = [mid[0] * 2, 0, mid[1] + (mid[1] - H / 2)];
  m.face([[a[0], 0.5, a[1]], [b[0], 0.5, b[1]], [b[0], -0.5, b[1]], [a[0], -0.5, a[1]]], tile, out);
}
// The lips: in the wall's face, between each rounded corner and the square corner of the recess.
for (let c = 0; c < 4; c++) {
  const sq = [[W, H], [-W, H], [-W, 0], [W, 0]][c];
  for (let k = 0; k < STEPS; k++) {
    const [a, b] = [pts[c * (STEPS + 1) + k], pts[c * (STEPS + 1) + k + 1]];
    m.face([[sq[0], 0.49, sq[1]], [a[0], 0.49, a[1]], [b[0], 0.49, b[1]]], tile, [0, 0, H / 2]);
  }
}

export default m.build();
