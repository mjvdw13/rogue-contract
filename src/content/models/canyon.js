import { ModelBuilder } from './lib/build.js';

// Mission 3 (docs/mission3.md): the garrison's comm mast, the landmark
// seen up the canyon; the poles of the power line that runs out from the
// garrison along the way; the burned Tusken camp; the prototype's cradle.

/**
 * A straight bar of square section `r` (half its width) from `a` to `b`
 * ([x, y, z]): its ends are level squares, so a slanted bar is sheared
 * rather than turned (the braces of a lattice, too thin for it to show).
 */
function bar(m, a, b, r, style) {
  const sq = (x, y) => [[x - r, y - r], [x + r, y - r], [x + r, y + r], [x - r, y + r]];
  if (Math.abs(b[2] - a[2]) > 0.05) return m.loft(sq(a[0], a[1]), a[2], sq(b[0], b[1]), b[2], { ...style, top: false, bottom: false });
  // Level: a box along the longer side.
  const x0 = Math.min(a[0], b[0]) - r;
  const x1 = Math.max(a[0], b[0]) + r;
  const y0 = Math.min(a[1], b[1]) - r;
  const y1 = Math.max(a[1], b[1]) + r;
  return m.box([x0, y0, a[2] - r], [x1, y1, a[2] + r], style);
}

// The comm mast: a steel lattice tower 20 tall on a concrete footing,
// tapering from 2.2 wide to 0.6 (its members heavy enough to read at
// 40 m through the haze), braced in a zig-zag up each face, with
// dishes and a platform two thirds up and a whip aerial on top. Red
// beacons (fullbright, so they read through the haze) at the platform and
// the top; light sources beside them blink.
const mast = new ModelBuilder('comm-mast');
const TALL = 20;
const steel = { color: ['steel', 0.75] }; // pale, against the dark ridges behind it
const half = (z) => 1.1 - (0.8 * z) / TALL; // the lattice's half width at height z
mast.box([-1.5, -1.5, 0], [1.5, 1.5, 0.4], { color: ['concrete', 0.4], bottom: false });
const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
for (const [sx, sy] of corners) bar(mast, [sx * half(0.4), sy * half(0.4), 0.4], [sx * half(TALL), sy * half(TALL), TALL], 0.16, steel);
const RINGS = [0.4, 3.6, 6.8, 10, 13.2, 16.4, TALL];
for (let i = 0; i < RINGS.length; i++) {
  const z = RINGS[i];
  const h = half(z);
  for (let c = 0; c < 4; c++) {
    const [ax, ay] = corners[c];
    const [bx, by] = corners[(c + 1) % 4];
    if (i > 0) bar(mast, [ax * h, ay * h, z], [bx * h, by * h, z], 0.1, steel);
    // One brace across each face of the panel below, alternating its slope.
    if (i > 0) {
      const z0 = RINGS[i - 1];
      const h0 = half(z0);
      const [fx, fy, tx, ty] = i % 2 ? [ax, ay, bx, by] : [bx, by, ax, ay];
      bar(mast, [fx * h0, fy * h0, z0], [tx * h, ty * h, z], 0.08, steel);
    }
  }
}
// The platform at 13.2, a dish on two of its sides, the equipment box.
const PZ = 13.2;
mast.box([-1.2, -1.2, PZ], [1.2, 1.2, PZ + 0.12], { color: ['gray', 0.3] });
mast.box([-0.4, -0.4, PZ + 0.12], [0.4, 0.4, PZ + 1], { tex: 'imp-panel' });
const ring = (r, n = 8) => Array.from({ length: n }, (_, i) => [Math.cos((i / n) * Math.PI * 2) * r, Math.sin((i / n) * Math.PI * 2) * r]);
const up = (pts, dz) => pts.map(([a, z]) => [a, z + dz]);
mast.loft(up(ring(0.15), PZ + 1.4), 0.9, up(ring(0.7), PZ + 1.45), 1.2, { axis: 'x', color: ['steel', 0.35], top: { color: [200, 205, 210] } });
mast.loft(up(ring(0.15), PZ + 0.9), -0.9, up(ring(0.6), PZ + 0.95), -1.15, { axis: 'y', color: ['steel', 0.35], top: { color: [200, 205, 210] } });
// The whip aerial, banded red and white, on top.
for (let i = 0; i < 6; i++) {
  const z = TALL + i * 0.6;
  mast.cylinder([0, 0, z], 0.12, 0.6, { segments: 4, color: i % 2 ? [230, 230, 230] : ['blood', 0.6], top: false, bottom: false });
}
// The beacons: one on each corner of the platform and one on the top.
const beacon = { color: [255, 40, 30], glow: true };
for (const [sx, sy] of corners) mast.box([sx * 1.2 - 0.4, sy * 1.2 - 0.4, PZ + 0.12], [sx * 1.2 + 0.4, sy * 1.2 + 0.4, PZ + 0.9], beacon);
mast.box([-0.6, -0.6, TALL + 3.6], [0.6, 0.6, TALL + 4.8], beacon);
mast.outlineLines([[-1.5, -1.5], [1.5, -1.5], [1.5, 1.5], [-1.5, 1.5]]);

// A power line's pole: a steel post 7 tall on a footing, a crossarm with an
// insulator at each end (where the cables are tied: 0.95 out, 6.55 up), and
// a junction box low down.
const pole = new ModelBuilder('power-pole');
pole.box([-0.3, -0.3, 0], [0.3, 0.3, 0.25], { color: ['concrete', 0.4], bottom: false });
pole.loft([[-0.12, -0.12], [0.12, -0.12], [0.12, 0.12], [-0.12, 0.12]], 0.25, [[-0.08, -0.08], [0.08, -0.08], [0.08, 0.08], [-0.08, 0.08]], 7, { color: ['steel', 0.45], bottom: false });
pole.box([-0.06, -1.05, 6.3], [0.06, 1.05, 6.42], { color: ['steel', 0.35] });
for (const y of [-0.95, 0.95]) pole.cylinder([0, y, 6.42], 0.06, 0.14, { segments: 6, color: ['gray', 0.7] });
pole.box([0.1, -0.18, 1.2], [0.34, 0.18, 1.7], { tex: 'imp-panel' });
pole.box([0.341, -0.06, 1.5], [0.345, 0.06, 1.58], { color: [255, 170, 40], glow: true, bottom: false, top: false });

// A Tusken hut burned to its frame: seven poles leaning in to where they
// were lashed at the top, charred black, two of them burned through and
// fallen short; scraps of hide go on as hangings (the level's).
const tent = new ModelBuilder('tent-frame-burnt');
const charred = { color: ['gray', 0.07] };
const APEX = [0.1, -0.05, 2.3];
for (let i = 0; i < 7; i++) {
  const a = (i / 7) * Math.PI * 2 + 0.3;
  const foot = [Math.cos(a) * 1.6, Math.sin(a) * 1.6, 0];
  // A broken pole stops partway, its top a jagged stump.
  const k = i === 2 ? 0.45 : i === 5 ? 0.6 : 1;
  const top = foot.map((v, j) => v + (APEX[j] - v) * k);
  bar(tent, foot, top, 0.05, charred);
}
// The lashing ring at the top.
tent.cylinder([APEX[0], APEX[1], APEX[2] - 0.25], 0.22, 0.12, { segments: 6, color: ['gray', 0.1] });

// An ash heap where a hut's things burned: a low dark mound, a few embers
// still glowing in it (it smoulders: decor.js).
const ash = new ModelBuilder('ash-heap');
const blob = (r, k) => Array.from({ length: 8 }, (_, i) => {
  const a = (i / 8) * Math.PI * 2;
  const w = r * (1 + 0.18 * Math.sin(a * 3 + k));
  return [Math.cos(a) * w * 1.2, Math.sin(a) * w];
});
ash.loft(blob(0.95, 0), 0, blob(0.7, 0.4), 0.12, { color: ['gray', 0.22], top: false, bottom: false });
ash.loft(blob(0.7, 0.4), 0.12, blob(0.35, 0.9), 0.22, { color: ['gray', 0.27], top: { color: ['gray', 0.3] }, bottom: false });
for (const [x, y] of [[-0.2, 0.05], [0.18, -0.1], [0.05, 0.18]]) ash.box([x - 0.06, y - 0.06, 0.21], [x + 0.06, y + 0.06, 0.24], { color: [255, 110, 20], glow: true, bottom: false });

// The prototype's cradle in the test bay, empty: a base plate, two towers
// either side joined by a beam 7 up, the yoke that held its shoulders
// hanging from the beam, arm clamps open on the towers, a red light on
// each tower. Scorched where it stood.
const cradle = new ModelBuilder('test-cradle');
const dark = { color: ['steel', 0.25] };
cradle.box([-3, -2.2, 0], [3, 2.2, 0.3], { color: ['steel', 0.3], top: { color: ['gray', 0.12] }, bottom: false });
for (const sx of [-1, 1]) {
  const x = sx * 2.6;
  for (const sy of [-1, 1]) bar(cradle, [x, sy * 1.6, 0.3], [x, sy * 1.6, 7.2], 0.18, dark);
  for (const z of [1.5, 3.5, 5.5]) bar(cradle, [x, -1.6, z], [x, 1.6, z], 0.1, dark);
  // The arm clamp, swung open toward the middle.
  cradle.box([x - sx * 1.1, -0.35, 3.3], [x - sx * 0.2, 0.35, 3.7], { color: ['steel', 0.4] });
  cradle.box([x - 0.15, -0.15, 6.4], [x + 0.15, 0.15, 6.7], { color: [255, 40, 30], glow: true });
}
bar(cradle, [-2.8, 0, 7.2], [2.8, 0, 7.2], 0.25, dark);
cradle.box([-0.9, -0.5, 5.2], [0.9, 0.5, 5.6], { color: ['steel', 0.35] });
bar(cradle, [0, 0, 5.6], [0, 0, 7], 0.08, { color: ['gray', 0.2] });
cradle.outlineLines([[-3, -2.2], [3, -2.2], [3, 2.2], [-3, 2.2]]);

export default [mast.build(), pole.build(), tent.build(), ash.build(), cradle.build()];
