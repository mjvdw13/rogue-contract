import { ModelBuilder } from './lib/build.js';

// Stains on a floor (the cantina's): a grime picture lying flat just above
// it, so it darkens the floor under it rather than covering it, as the
// speeder's shadow does. The origin on the floor at its middle; a thing's
// angle turns it. A `floor-dirt-*` is darkest along its +y edge (the
// picture's foot): lay that edge against a wall.
export const STAINS = [
  ['floor-spill-1', 'grime-blotch-1', 2, 1.5],
  ['floor-spill-2', 'grime-blotch-2', 3, 2],
  ['floor-burn-1', 'grime-scorch-1', 2, 2],
  ['floor-burn-2', 'grime-scorch-2', 3, 2.5],
  ['floor-scuff', 'grime-smudge', 1, 1.25],
  ['floor-dirt-1', 'grime-dust-1', 4, 1],
  ['floor-dirt-2', 'grime-dust-2', 4, 1.25],
];

function stain(id, tex, w, h) {
  const m = new ModelBuilder(id);
  const [a, b] = [w / 2, h / 2];
  m.face([[-a, -b, 0.01], [a, -b, 0.01], [a, b, 0.01], [-a, b, 0.01]], { tex, uv: [[0, 0], [1, 0], [1, 1], [0, 1]] }, [0, 0, -1]);
  return m.build();
}

export default STAINS.map(([id, tex, w, h]) => stain(id, tex, w, h));
