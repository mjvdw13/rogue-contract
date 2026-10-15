import { ModelBuilder } from './lib/build.js';

// An Imperial floodlight tower: a tapered steel mast 6.6 tall on a base
// plate, braced at its foot and banded yellow, with a crossbar and two lamp heads at the top
// tilted down, their lenses glowing. The lamps face +x (east at angle 0).
// The light itself is a light source the level places in front of it.
const m = new ModelBuilder('floodlight-tower');
const steel = { color: ['steel', 0.6] };
const top = 6.6;
m.box([-0.55, -0.55, 0], [0.55, 0.55, 0.12], { color: ['gray', 0.22], bottom: false });
m.loft([[-0.3, -0.3], [0.3, -0.3], [0.3, 0.3], [-0.3, 0.3]], 0.12, [[-0.15, -0.15], [0.15, -0.15], [0.15, 0.15], [-0.15, 0.15]], top, { ...steel, bottom: false, top: { color: ['steel', 0.5] } });
// Braces from the plate's corners up the mast.
for (const [x, y] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
  m.loft([[x * 0.5 - 0.04, y * 0.5 - 0.04], [x * 0.5 + 0.04, y * 0.5 - 0.04], [x * 0.5 + 0.04, y * 0.5 + 0.04], [x * 0.5 - 0.04, y * 0.5 + 0.04]], 0.12,
    [[x * 0.27 - 0.03, y * 0.27 - 0.03], [x * 0.27 + 0.03, y * 0.27 - 0.03], [x * 0.27 + 0.03, y * 0.27 + 0.03], [x * 0.27 - 0.03, y * 0.27 + 0.03]], 1.4, { color: ['steel', 0.45], bottom: false, top: false });
}
// A yellow band round the foot of the mast, a hair proud of it.
m.loft([[-0.3, -0.3], [0.3, -0.3], [0.3, 0.3], [-0.3, 0.3]].map(([x, y]) => [x * 1.04, y * 1.04]), 0.9, [[-0.29, -0.29], [0.29, -0.29], [0.29, 0.29], [-0.29, 0.29]].map(([x, y]) => [x * 1.04, y * 1.04]), 1.2, { color: ['yellow', 0.8], top: false, bottom: false });
// The crossbar, and a red warning light on the very top.
m.box([-0.14, -1, top - 0.25], [0.14, 1, top - 0.05], { color: ['steel', 0.5] });
m.box([-0.06, -0.06, top], [0.06, 0.06, top + 0.1], { color: [255, 40, 30], glow: true, bottom: false });
// Lamp heads: a housing tilted down toward +x, its front a glowing lens.
// Side profile in x-z (a parallelogram leaning forward), extruded along y.
for (const y of [-0.65, 0.65]) {
  const z = top - 0.05;
  const back = [[-0.2, z + 0.1], [0.12, z - 0.05], [0.22, z + 0.35], [-0.1, z + 0.5]];
  m.prism(back, y - 0.3, y + 0.3, { axis: 'y', color: ['steel', 0.4], side: (i) => (i === 1 ? { color: [255, 255, 170], glow: true } : undefined) });
}

export default m.build();
