import { ModelBuilder } from './lib/build.js';
import { rod } from './junk-pile.js';

// `cargo-skiff`: the Jawas' repulsorlift cargo skiff, parked and hovering
// in the junk yard's court (levels/m1.js), junk loaded on its deck. A long
// flat hull, narrowing to a blunt bow, its sides sloping in underneath to
// the repulsor plate; a low rail round the deck on posts; a steering post
// at the stern with its vane; two engine pods along the stern's sides. The
// bow points +x; 5.8 long, 2.2 wide, its hull floating 0.4 off the ground.
export const SKIFF = {
  /** Half its length and width (it collides as that box), and its rail's top. */
  half: [2.9, 1.1],
  rail: 1.55,
};

const HULL = { tex: 'crawler-hull', texScale: 1 };
const DECK = { tex: 'bay-plate', texScale: 0.5 };
const DARK = { tex: 'metal-grey', texScale: 0.5 };
// (No texture: as the engines' ends, over a textured style.)
const HOLE = { tex: null, color: [20, 16, 12] };

function skiff() {
  const m = new ModelBuilder('cargo-skiff');
  const [L, W] = SKIFF.half;
  const [zb, zd] = [0.4, 0.95];
  // The hull: the deck's outline, and inset under it the repulsor plate.
  const deck = [[-L, -W], [L - 0.8, -W], [L, -W + 0.5], [L, W - 0.5], [L - 0.8, W], [-L, W]];
  const under = deck.map(([x, y]) => [x * 0.9 - 0.1, y * 0.75]);
  m.loft(under, zb, deck, zd, { ...HULL, top: DECK, bottom: DARK });
  // A dark seam of vents along each side, a hair proud.
  for (const s of [-1, 1]) {
    const y = s * (W * 0.9 + 0.02);
    for (let x = -L + 0.6; x < L - 1.4; x += 0.9) m.face([[x, y, 0.62], [x + 0.5, y, 0.62], [x + 0.5, y, 0.72], [x, y, 0.72]], HOLE, [x + 0.25, 0, 0.67]);
  }
  // The rail: posts round the deck's edge and a bar along their tops,
  // open at the stern.
  const R = SKIFF.rail;
  const edge = [[-L + 0.15, -W + 0.12], [L - 0.85, -W + 0.12], [L - 0.12, -W + 0.55], [L - 0.12, W - 0.55], [L - 0.85, W - 0.12], [-L + 0.15, W - 0.12]];
  for (const [x, y] of edge) rod(m, [x, y, zd], [x, y, R], 0.04, 4, DARK);
  for (let i = 0; i + 1 < edge.length; i++) rod(m, [...edge[i], R], [...edge[i + 1], R], 0.035, 4, DARK);
  // The steering post at the stern, its vane, and its little console.
  m.box([-L + 0.3, -0.2, zd], [-L + 0.7, 0.2, zd + 0.9], { ...HULL, top: DARK });
  m.box([-L + 0.7, -0.18, zd + 0.7], [-L + 0.74, 0.18, zd + 0.88], { color: [255, 170, 60], glow: true, bottom: false, top: false });
  m.face([[-L + 0.5, 0, zd + 0.9], [-L + 0.15, 0, zd + 0.9], [-L + 0.05, 0, zd + 1.4], [-L + 0.3, 0, zd + 1.4]], { ...HULL, twoSided: true });
  // Two engine pods along the stern's sides, their exhausts dark.
  for (const s of [-1, 1]) {
    m.cylinder([-L - 0.1, s * (W - 0.2), 0.7], 0.18, 1.2, { axis: 'x', segments: 8, ...DARK, bottom: HOLE, top: HULL });
  }
  // Junk on the deck: crates, a drum on its side, a droid's dome, a sheet of plate.
  m.box([-1.4, -0.85, zd], [-0.5, 0.05, zd + 0.7], { tex: 'crate-rust', texScale: 0.5, bottom: false });
  m.box([-0.4, -0.8, zd], [0.2, -0.2, zd + 0.5], { tex: 'crate-grey', texScale: 0.5, bottom: false });
  m.box([-1.3, 0.2, zd], [-0.6, 0.8, zd + 0.45], { tex: 'crate-tan', texScale: 0.5, bottom: false });
  m.cylinder([0.4, 0.35, zd + 0.3], 0.3, 1, { axis: 'x', segments: 8, tex: 'drum-rust', texScale: 0.3 });
  m.loft([[0.9, -0.55], [1.25, -0.75], [1.6, -0.55], [1.6, -0.25], [1.25, -0.05], [0.9, -0.25]], zd, [[1.0, -0.5], [1.25, -0.65], [1.5, -0.5], [1.5, -0.3], [1.25, -0.15], [1.0, -0.3]], zd + 0.18, { tex: 'dome-white', texScale: 0.3, bottom: false });
  m.face([[1.8, 0.85, zd], [2.4, 0.4, zd], [2.4, 0.3, zd + 0.5], [1.8, 0.75, zd + 0.6]], { tex: 'metal-rust', twoSided: true });
  m.outlineLines([[-L - 0.2, -W], [L, -W], [L, W], [-L - 0.2, W]]);
  return m.build();
}

export default [skiff()];
