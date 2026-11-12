import { ModelBuilder } from './lib/build.js';
import { buildSpeeder } from './speeder.js';
import { rng, rod } from './junk-pile.js';

// The Homestead's workshop pit and the tunnel past it (levels/m2.js,
// docs/mission2.md area 4).
//
// `speeder-wreck`: the family's X-34, stripped (both side engines gone) and
// set on blocks in the pit, then burnt in the raid (models/speeder.js). Its
// decoration burns (decor.js).
//
// `cave-in`: the tunnel east toward the house brought down by the raid's
// grenade. A slope of earth and rock from the floor up to the ceiling,
// filling the tunnel's end: CAVE_IN.foot from its origin west to the slope's
// foot, CAVE_IN.half either side (the tunnel's walls), up to CAVE_IN.h (the
// ceiling). Slabs of the vault's whitewashed plaster lie on it; the steel
// prop that held the ceiling stands snapped at the foot, its top half thrown
// up the slope, and a beam hangs down out of the hole. Collides as its
// outline, to the ceiling. Its decoration trickles sand out of the hole.
export const CAVE_IN = { foot: 2.6, back: 2, half: 2, h: 4 };

const EARTH = { tex: 'pit-earth' };
const ROCK = { tex: 'sandstone' };
const PLASTER = { tex: 'adobe-pale' };
const STEEL = { tex: 'metal-rust' };

const smooth = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

/** A box centred at c, `size` [x, y, z], turned `yaw` about z, its +x end tipped up by `tip` (lying on a slope rising east). */
function slabTipped(m, c, [sx, sy, sz], yaw, tip, style) {
  const [cw, sw, ct, st] = [Math.cos(yaw), Math.sin(yaw), Math.cos(tip), Math.sin(tip)];
  const at = (x, y, z) => {
    const [x1, y1, z1] = [x * cw - y * sw, x * sw + y * cw, z];
    return [c[0] + x1 * ct - z1 * st, c[1] + y1, c[2] + x1 * st + z1 * ct];
  };
  const [hx, hy, hz] = [sx / 2, sy / 2, sz / 2];
  const v = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]].map(([a, b, d]) => at(a * hx, b * hy, d * hz));
  for (const f of [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]]) m.face(f.map((i) => v[i]), style, c);
}

function caveIn() {
  const m = new ModelBuilder('cave-in');
  const { foot, back, half, h } = CAVE_IN;
  const rnd = rng(23);
  // The slope: a grid of points from the foot (x = -foot) east, rising
  // smoothly to the ceiling by x = 0.4, lumpy, a little higher against the
  // walls, where it slumped less.
  const xs = [-foot, -2.1, -1.6, -1.1, -0.6, -0.1, 0.4, back];
  const ys = [-half, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, half];
  const grid = xs.map((x, i) => ys.map((y, j) => {
    const edge = i === 0 || i === xs.length - 1;
    const wall = Math.abs(y) / half;
    const z = edge ? (i === 0 ? 0 : h) : Math.min(h - 0.02, h * smooth((x + foot) / (foot + 0.4)) * (0.88 + 0.12 * wall) + (rnd() - 0.5) * 0.35);
    const dx = i === 0 ? (rnd() - 0.5) * 0.5 : edge ? 0 : (rnd() - 0.5) * 0.15;
    return [x + dx, y + (j === 0 || j === ys.length - 1 ? 0 : (rnd() - 0.5) * 0.12), Math.max(0, z)];
  }));
  const below = (pts) => [(pts[0][0] + pts[1][0] + pts[2][0]) / 3 + 1, (pts[0][1] + pts[1][1] + pts[2][1]) / 3, (pts[0][2] + pts[1][2] + pts[2][2]) / 3 - 1];
  for (let i = 0; i + 1 < xs.length; i++) {
    for (let j = 0; j + 1 < ys.length; j++) {
      const [a, b, c, d] = [grid[i][j], grid[i][j + 1], grid[i + 1][j + 1], grid[i + 1][j]];
      // Rock showing through the earth here and there.
      const style = rnd() < 0.3 ? ROCK : EARTH;
      m.face([a, b, c], style, below([a, b, c]));
      m.face([a, c, d], style, below([a, c, d]));
    }
  }
  // Where the slope is at x, y (between the grid's points).
  const surface = (x, y) => {
    const i = Math.max(0, Math.min(xs.length - 2, xs.findIndex((v, k) => x < xs[k + 1])));
    const t = Math.max(0, Math.min(1, (x - xs[i]) / (xs[i + 1] - xs[i])));
    const j = Math.max(0, Math.min(ys.length - 1, Math.round((y + half) / 0.5)));
    return grid[i][j][2] * (1 - t) + grid[i + 1][j][2] * t;
  };
  // Slabs of the vault's plaster and lumps of rock lying on the slope.
  const bits = [
    [-2.2, -0.9, 0.9, 0.6, 0.12, 0.4, PLASTER], [-1.5, 0.8, 1.1, 0.7, 0.14, -0.3, PLASTER], [-0.9, -0.3, 0.8, 0.8, 0.12, 0.7, PLASTER],
    [-1.9, 1.4, 0.5, 0.4, 0.3, 0.2, ROCK], [-1.2, -1.5, 0.6, 0.45, 0.35, -0.5, ROCK], [-2.4, 0.4, 0.4, 0.35, 0.25, 0.9, ROCK],
    [-0.6, 1.3, 0.6, 0.5, 0.3, 0.1, ROCK], [-0.4, -1.2, 0.9, 0.5, 0.12, 0.5, PLASTER],
  ];
  for (const [x, y, sx, sy, sz, yaw, style] of bits) {
    // Tipped along the slope, a little sunk into it.
    const tip = Math.atan2(surface(x + 0.3, y) - surface(x - 0.3, y), 0.6);
    slabTipped(m, [x, y, surface(x, y) + sz * 0.25], [sx, sy, sz], yaw, tip, style);
  }
  // The steel prop that held the ceiling, at the slope's foot by the north
  // wall: snapped 1.3 up, its upper half thrown up the slope.
  m.box([-foot - 0.25, -half + 0.12, 0], [-foot - 0.05, -half + 0.32, 1.3], STEEL);
  m.box([-foot - 0.25, -half + 0.12, 1.3], [-foot - 0.14, -half + 0.32, 1.42], STEEL);
  rod(m, [-foot + 0.3, -half + 0.35, surface(-foot + 0.3, -half + 0.35) + 0.12], [-0.6, -half + 0.55, surface(-0.6, -half + 0.55) + 0.12], 0.1, 4, STEEL);
  // The cross beam it held, one end still in the ceiling, hanging down
  // across the hole onto the slope.
  rod(m, [0.2, half - 0.3, h - 0.08], [-1.7, 0.4, surface(-1.7, 0.4) + 0.1], 0.1, 4, STEEL);
  m.outlineLines([[-foot, -half], [back, -half], [back, half], [-foot, half]]);
  return m.build();
}

export const WORKSHOP_MODELS = ['speeder-wreck', 'cave-in'];

export default [buildSpeeder('speeder-wreck', { blocks: true, burnt: true }), caveIn()];
