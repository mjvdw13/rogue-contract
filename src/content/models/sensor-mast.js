import { ModelBuilder } from './lib/build.js';

// An Imperial sensor mast: a thin steel mast 8 tall on a footing, with an
// equipment box and a cable run partway up and a small platform on top. The
// sensor dish that turns on the platform is its own model (below), placed
// as a spinning decoration at the mast's top; a blinking light source
// beside it is the beacon.
const mast = new ModelBuilder('sensor-mast');
const tall = 8;
mast.box([-0.45, -0.45, 0], [0.45, 0.45, 0.3], { color: ['concrete', 0.45], bottom: false });
mast.loft([[-0.16, -0.16], [0.16, -0.16], [0.16, 0.16], [-0.16, 0.16]], 0.3, [[-0.1, -0.1], [0.1, -0.1], [0.1, 0.1], [-0.1, 0.1]], tall, { color: ['steel', 0.55], bottom: false, top: false });
// The equipment box on the mast's side, with a lit panel, and its cable.
mast.box([0.12, -0.25, 2.2], [0.5, 0.25, 2.9], { tex: 'imp-panel' });
mast.box([0.505, -0.12, 2.6], [0.51, 0.12, 2.75], { color: [60, 220, 255], glow: true, bottom: false, top: false });
mast.box([0.15, -0.04, 0.3], [0.23, 0.04, 2.2], { color: ['gray', 0.15], bottom: false, top: false });
// Bands of red and white near the top, and the platform.
for (let i = 0; i < 4; i++) {
  const z = tall - 1.6 + i * 0.3;
  mast.loft([[-0.12, -0.12], [0.12, -0.12], [0.12, 0.12], [-0.12, 0.12]], z, [[-0.12, -0.12], [0.12, -0.12], [0.12, 0.12], [-0.12, 0.12]], z + 0.3, { color: i % 2 ? [230, 230, 230] : ['blood', 0.6], top: false, bottom: false });
}
mast.cylinder([0, 0, tall], 0.45, 0.1, { segments: 8, color: ['steel', 0.45] });

// The dish: a pivot, an arm, and a shallow dish facing +x, tipped up.
const dish = new ModelBuilder('sensor-dish');
dish.cylinder([0, 0, 0], 0.12, 0.5, { segments: 6, color: ['steel', 0.5], bottom: false });
dish.box([-0.35, -0.06, 0.4], [0.1, 0.06, 0.52], { color: ['steel', 0.4] });
const ring = (r, n = 10) => Array.from({ length: n }, (_, i) => [Math.cos((i / n) * Math.PI * 2) * r, Math.sin((i / n) * Math.PI * 2) * r]);
// Along x the outline is [y, z]; the dish is centred 0.95 up.
const up = (pts, dz) => pts.map(([y, z]) => [y, z + dz]);
dish.loft(up(ring(0.18), 0.95), -0.3, up(ring(0.8), 1.05), 0.05, {
  axis: 'x',
  color: ['steel', 0.35],
  top: { color: [200, 205, 210] },
  bottom: { color: ['steel', 0.3] },
});
// The feed horn in front of the dish, on a strut.
dish.box([0.05, -0.03, 0.98], [0.55, 0.03, 1.04], { color: ['gray', 0.35] });
dish.box([0.55, -0.07, 0.94], [0.65, 0.07, 1.08], { color: ['gray', 0.25] });

export const sensorMast = mast.build();
export const sensorDish = dish.build();
