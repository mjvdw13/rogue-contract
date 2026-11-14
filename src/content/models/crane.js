import { ModelBuilder } from './lib/build.js';

// `great-crane`: the gantry crane over Berth 4 (levels/m5.js), the goal
// seen from the pier on. Its two legs are the level's tiles (the cab is a
// room in the south one); the model is everything on top of them: twin
// girders spanning the legs, a machinery house on the girders, a boom out
// east over the dry dock with a mag-grapple hanging from its trolley, a
// counter-jib and its weight to the west, an A-frame and its stays, and
// red beacons. Yellow paint gone to rust.
//
// The origin is on the ground midway between the legs; x east, y south,
// as the level's. Sizes are tiles (0.5 m).
export const CRANE = {
  /** The legs' tops, where the girders sit. */
  top: 30,
  /** Half the girders' length: they overhang each leg a little. */
  half: 27,
  /** The legs' near faces from the origin, north and south. */
  legs: [-19, 13],
  /** The boom's tip, east of the origin. */
  reach: 32,
  /** The grapple's place along the boom, and its lowest point. */
  hook: [24, 5.2],
  /** The beacons, [x, y, z], for the level's lights. */
  beacons: [[0, 0, 39.5], [32, 0, 36], [-16, 0, 35.5], [0, -27, 33.5], [0, 27, 33.5]],
};

const YELLOW = { tex: 'crane-yellow', texScale: 4 };
const HULL = { tex: 'hull-section', texScale: 4 };
const RUST = { tex: 'metal-rust', texScale: 2 };
const STEEL = { tex: 'blast-steel', texScale: 2 };
const HAZARD = { tex: 'blast-hazard', texScale: 2 };
const CABLE = { color: [34, 30, 26], twoSided: true };
const RED = { color: [255, 40, 30], glow: true };
const MAG = { tex: null, color: [120, 200, 255], glow: true };
const LIT = { tex: null, color: [226, 196, 110], glow: true };

function greatCrane() {
  const m = new ModelBuilder('great-crane');
  const { top: T, half: L, legs: [north, south], reach, hook: [hx, hz] } = CRANE;

  // A cap on each leg, a little proud of it.
  m.box([-5.5, south - 0.5, T], [5.5, south + 12.5, T + 0.6], STEEL);
  m.box([-5.5, north - 6.5, T], [5.5, north + 0.5, T + 0.6], STEEL);
  // The twin girders, the sky between them, tied across at their ends.
  for (const x of [-4, 2]) m.box([x, -L, T + 0.6], [x + 2, L, T + 3.5], YELLOW);
  for (const y of [-L, L - 1]) m.box([-2, y, T + 1], [2, y + 1, T + 3], { ...YELLOW, side: (i) => (i === 1 || i === 3 ? false : undefined) });
  // A haunch under each girder where it leaves a leg.
  for (const x of [-4, 2]) {
    m.prism([[south, T + 0.6], [south, T - 6], [south - 7, T + 0.6]], x, x + 2, { axis: 'x', ...YELLOW });
    m.prism([[north, T + 0.6], [north, T - 6], [north + 7, T + 0.6]], x, x + 2, { axis: 'x', ...YELLOW });
  }

  // The machinery house on the girders, a lit window toward the dock.
  const [h0, h1] = [T + 3.5, T + 7.5];
  m.box([-4.5, -4, h0], [4.5, 4, h1], { ...RUST, top: HULL });
  m.face([[4.52, -2.5, h0 + 2], [4.52, 2.5, h0 + 2], [4.52, 2.5, h0 + 3], [4.52, -2.5, h0 + 3]], LIT, [0, 0, h0]);
  // The boom east over the dock: flat underneath for the trolley, its
  // back falling to the tip, the last of it striped.
  const boom = (x0, x1) => {
    const z = (x) => h1 - 0.5 - ((x - 4.5) / (reach - 4.5)) * 1.5;
    const w = (x) => 2.5 - ((x - 4.5) / (reach - 4.5)) * 1.3;
    const end = (x) => [[-w(x), T + 4], [w(x), T + 4], [w(x), z(x)], [-w(x), z(x)]];
    return [end(x0), x0, end(x1), x1];
  };
  m.loft(...boom(4.5, reach - 3), { axis: 'x', ...YELLOW, bottom: false, top: false });
  m.loft(...boom(reach - 3, reach), { axis: 'x', ...HAZARD, bottom: false });
  // The counter-jib west, and its weight slung under the end.
  m.box([-16, -2, T + 4], [-4.5, 2, T + 5.5], { ...YELLOW, top: undefined });
  m.box([-16.5, -2.6, T + 1], [-11.5, 2.6, T + 4], HULL);
  // The A-frame over the house, and the stays down to the boom's tip and
  // the counter-jib's end: each a pair of crossed strips, so it shows
  // from any side.
  const apex = [0, 0, 39.5];
  for (const y of [-3.4, 2.8]) m.loft([[-1, y], [1, y], [1, y + 0.6], [-1, y + 0.6]], h1, [[-0.3, y * 0.1], [0.3, y * 0.1], [0.3, y * 0.1 + 0.3], [-0.3, y * 0.1 + 0.3]], apex[2], { ...YELLOW, bottom: false });
  const stay = ([x0, y0, z0], [x1, y1, z1], t = 0.14) => {
    m.face([[x0, y0, z0 - t], [x0, y0, z0 + t], [x1, y1, z1 + t], [x1, y1, z1 - t]], CABLE);
    m.face([[x0, y0 - t, z0], [x0, y0 + t, z0], [x1, y1 + t, z1], [x1, y1 - t, z1]], CABLE);
  };
  for (const y of [-0.8, 0.8]) {
    stay([0, y * 0.3, apex[2] - 0.2], [reach - 1, y, 35.6]);
    stay([0, y * 0.3, apex[2] - 0.2], [-15.5, y * 2, T + 5.5]);
  }

  // The trolley under the boom, the falls, and the mag-grapple: a drum
  // with its emitter plate glowing underneath and four claws round it.
  m.box([hx - 1.5, -1.5, T + 3.2], [hx + 1.5, 1.5, T + 4], STEEL);
  const head = hz + 1.3;
  for (const [x, y] of [[-0.6, -0.3], [0.6, 0.3]]) stay([hx + x, y, T + 3.2], [hx + x, y, head + 1.6], 0.09);
  m.cylinder([hx, 0, head + 0.3], 1.3, 1.3, { segments: 8, ...HAZARD, top: STEEL, bottom: false });
  m.cylinder([hx, 0, head], 1.05, 0.3, { segments: 8, ...STEEL, top: false, bottom: MAG });
  for (const [cx, cy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const [x, y] = [hx + cx * 1.45, cy * 1.45];
    const sq = (px, py, r) => [[px - r, py - r], [px + r, py - r], [px + r, py + r], [px - r, py + r]];
    m.loft(sq(x, y, 0.22), head + 1.1, sq(x - cx * 0.5, y - cy * 0.5, 0.1), hz, { ...STEEL, top: false });
  }

  // The beacons: a tile across, to show as a point from the pier.
  for (const [x, y, z] of CRANE.beacons) m.box([x - 0.5, y - 0.5, z], [x + 0.5, y + 0.5, z + 1], { ...RED, bottom: false });
  return m.build();
}

export default [greatCrane()];
