import { ModelBuilder } from './lib/build.js';

// An Imperial barricade: an armoured shield 2.6 long and 1.15 tall, sloped
// on both sides, with a band of hazard stripes along each slope and two red
// lamps on the front, on feet at its ends. It faces +x (east at angle 0); its length runs along y.
const m = new ModelBuilder('barricade');
const half = 1.3;
const base = 0.32;
const top = 0.14;
const tall = 1.15;
// Side profile in the x-z plane; along y the prism's end caps are its ends.
// Edge 0 is the floor (left out), 1 the front, 2 the top, 3 the back.
m.prism([[-base, 0.1], [base, 0.1], [top, tall], [-top, tall]], -half, half, {
  tex: 'imp-panel',
  axis: 'y',
  side: (i) => (i === 0 ? false : i === 2 ? { color: ['steel', 0.55] } : undefined),
  top: { color: ['steel', 0.3] },
  bottom: { color: ['steel', 0.3] },
});
// Feet at the ends, and a kick plate under the shield between them.
for (const y of [-half + 0.15, half - 0.25]) m.box([-0.42, y, 0], [0.42, y + 0.1, 0.12], { color: ['gray', 0.25], bottom: false });
m.box([-0.28, -half + 0.25, 0], [0.28, half - 0.25, 0.1], { color: ['gray', 0.15], bottom: false, top: false });
// A band of hazard stripes near the top of each slope, a hair proud of it
// (yellow slanted stripes on black), and two red lamps on the front.
const slope = [top - base, tall - 0.1];
const len = Math.hypot(...slope);
const black = { color: ['gray', 0.08] };
const yellow = { color: ['yellow', 0.85] };
for (const s of [1, -1]) {
  const n = [(s * slope[1]) / len, (-slope[0]) / len]; // the slope's outward normal in x-z
  const at = (t, y, off = 0.012) => [s * (base + slope[0] * t) + n[0] * off, y, 0.1 + slope[1] * t + n[1] * off];
  const [t0, t1] = [0.72, 0.88];
  const end = half - 0.05;
  m.face([at(t0, -end), at(t0, end), at(t1, end), at(t1, -end)], black, [0, 0, 0.5]);
  for (let y = -end; y + 0.27 <= end; y += 0.3) {
    m.face([at(t0, y, 0.02), at(t0, y + 0.15, 0.02), at(t1, y + 0.27, 0.02), at(t1, y + 0.12, 0.02)], yellow, [0, 0, 0.5]);
  }
  if (s === 1) for (const y of [-0.9, 0.9]) m.face([at(0.93, y - 0.08), at(0.93, y + 0.08), at(0.98, y + 0.08), at(0.98, y - 0.08)], { color: [255, 40, 30], glow: true }, [0, 0, 0.5]);
}
m.outlineLines([[base, -half], [base, half], [-base, half], [-base, -half]]);

export default m.build();
