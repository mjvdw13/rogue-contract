import { ModelBuilder } from './lib/build.js';

// A containment ring that turns around the generator column: a band of
// metal with a glowing inner face and a glowing strip round the outside
// (broken by every fourth segment, so the turning shows), radius 4.9.
const m = new ModelBuilder('reactor-ring');
const R = 4.9;
const W = 0.35; // radial depth
const H = 0.4; // height
const N = 16;
const metal = { color: ['steel', 0.45] };
const glow = { color: [60, 220, 255], glow: true };
for (let i = 0; i < N; i++) {
  const a0 = (i / N) * Math.PI * 2;
  const a1 = ((i + 1) / N) * Math.PI * 2;
  const pt = (a, r, z) => [Math.cos(a) * r, Math.sin(a) * r, z];
  const inside = pt((a0 + a1) / 2, R, H / 2);
  const [i0, i1, o0, o1] = [pt(a0, R - W / 2, 0), pt(a1, R - W / 2, 0), pt(a0, R + W / 2, 0), pt(a1, R + W / 2, 0)];
  const up = (p) => [p[0], p[1], H];
  m.face([o0, o1, up(o1), up(o0)], i % 4 === 0 ? { color: ['steel', 0.7] } : { tex: 'imp-stripe' }, inside);
  // A glowing strip round the outside, a hair proud of the band.
  const strip = (a, z) => pt(a, R + W / 2 + 0.01, z);
  if (i % 4) m.face([strip(a0, 0.16), strip(a1, 0.16), strip(a1, 0.24), strip(a0, 0.24)], glow, inside);
  m.face([i0, i1, up(i1), up(i0)], glow, inside);
  m.face([up(i0), up(i1), up(o1), up(o0)], metal, inside);
  m.face([i0, i1, o1, o0], metal, inside);
}

export default m.build();
