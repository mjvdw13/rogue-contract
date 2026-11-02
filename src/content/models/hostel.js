import { ModelBuilder } from './lib/build.js';

// Bunks in the spacers' hostel off the back alleys (levels/m1.js): two
// berths of scuffed plate on four rusty posts, a canvas bedroll and a
// rolled pillow on each, a rail along the top berth. Built along x (2.2
// long, 1 wide, BUNK.top tall), its back to a wall on the north (-y) at
// angle 0 and its open side south, the origin on the floor under its
// middle; it collides as its outline. Two beddings, so a row of them isn't
// all alike.
export const BUNK = { half: 1.1, w: 0.5, top: 2.1 };
export const BUNKS = { bunk: ['sand', 'umber'], 'bunk-b': ['teal', 'olive'] };

const POST = { tex: 'pipe-rust', texScale: 0.25 };
const PLATE = { tex: 'metal-grey', texScale: 0.5 };

function bunk(id, [low, high]) {
  const m = new ModelBuilder(id);
  const { half: L, w: W, top } = BUNK;
  const p = 0.04;
  for (const x of [-L + p, L - p]) for (const y of [-W + p, W - p]) m.box([x - p, y - p, 0], [x + p, y + p, top], POST);
  [[0.45, low], [1.45, high]].forEach(([z, cloth]) => {
    const roll = { tex: `awning-${cloth}` };
    m.box([-L + 0.02, -W + 0.02, z - 0.05], [L - 0.02, W - 0.02, z], PLATE);
    m.box([-L + 0.12, -W + 0.08, z], [L - 0.34, W - 0.08, z + 0.13], roll);
    m.box([L - 0.3, -W + 0.12, z], [L - 0.08, W - 0.12, z + 0.11], roll);
  });
  m.box([-L + 0.05, W - 0.07, 1.78], [L - 0.05, W - 0.02, 1.82], POST);
  m.outlineLines([[-L, -W], [L, -W], [L, W], [-L, W]]);
  return m.build();
}

export default Object.entries(BUNKS).map(([id, cloths]) => bunk(id, cloths));
