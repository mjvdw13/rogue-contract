import { ModelBuilder } from './lib/build.js';

// `balcony-frame`: the steelwork holding up the derelict bay's balcony
// (levels/m1.js), rusty I-beam posts along its open edge, a girder over
// them, joists back to the pit's wall and knee braces, with a power cable
// slung along the girder, and a junction box on a post, its panel hanging
// open and a cut cable dangling out of it, still live (its sparks are the
// decoration's `emit`, decor.js). Built in the balcony's own frame: the origin on
// the sand under its south-west corner, x east along its edge, -y north
// back to the wall, z up to the deck's underside.
export const BALCONY_FRAME = {
  /** From the sand to the deck's underside. */
  height: 5.15,
  /** The posts, east along the edge. */
  posts: [0.6, 4.6, 8.6, 12.6, 15.5],
  /** How far each post's joist runs back (north) to the wall. */
  joists: [6.9, 7, 6.2, 4.4, 2],
  /** Where the shorted junction box on the fourth post spits sparks: its open front, and its cut cable's end. */
  sparks: [[12.6, 0.15, 3], [12.85, 0.25, 1.75]],
};

const STEEL = { tex: 'metal-rust', texScale: 0.5 };
const BEAM = { tex: 'pipe-rust', texScale: 0.5 };
const PLATE = { tex: 'band-steel', texScale: 0.5 };
const CABLE = { color: [24, 22, 20] };
const EDGE = -0.35;

/** An I-beam from (x0, y0) to (x1, y1) at height z0 to z1, its flanges top and bottom (along x or y). */
function girder(m, [x0, y0], [x1, y1], z0, z1, style) {
  const alongX = Math.abs(x1 - x0) > Math.abs(y1 - y0);
  const f = 0.06;
  const w = 0.16;
  if (alongX) {
    m.box([x0, y0 - w, z1 - f], [x1, y0 + w, z1], { ...style, top: false });
    m.box([x0, y0 - w, z0], [x1, y0 + w, z0 + f], style);
    m.box([x0, y0 - 0.03, z0 + f], [x1, y0 + 0.03, z1 - f], { ...style, top: false, bottom: false });
  } else {
    m.box([x0 - w, Math.min(y0, y1), z1 - f], [x0 + w, Math.max(y0, y1), z1], { ...style, top: false });
    m.box([x0 - w, Math.min(y0, y1), z0], [x0 + w, Math.max(y0, y1), z0 + f], style);
    m.box([x0 - 0.03, Math.min(y0, y1), z0 + f], [x0 + 0.03, Math.max(y0, y1), z1 - f], { ...style, top: false, bottom: false });
  }
}

/** A flat strap from a to b (3D points), `w` wide, seen from both sides. */
function strap(m, a, b, w, style, across = 'y') {
  const d = { x: [w / 2, 0, 0], y: [0, w / 2, 0], z: [0, 0, w / 2] }[across];
  const at = (p, s) => [p[0] + s * d[0], p[1] + s * d[1], p[2] + s * d[2]];
  m.face([at(a, -1), at(a, 1), at(b, 1), at(b, -1)], { ...style, twoSided: true });
}

function frame() {
  const m = new ModelBuilder('balcony-frame');
  const { height: H, posts, joists } = BALCONY_FRAME;
  const top = H - 0.4;
  // The girder along the edge, over the posts, end to end.
  girder(m, [0, EDGE], [16, EDGE], top, H, STEEL);
  posts.forEach((x, i) => {
    const t = 0.15;
    // The post: an I-beam on a base plate, its flanges east and west.
    for (const s of [-1, 1]) m.box([x + s * t - (s > 0 ? 0.05 : 0), EDGE - t, 0], [x + s * t + (s < 0 ? 0.05 : 0), EDGE + t, top], { ...BEAM, top: false, bottom: false });
    m.box([x - t, EDGE - 0.03, 0], [x + t, EDGE + 0.03, top], { ...BEAM, top: false, bottom: false });
    m.box([x - 0.3, EDGE - 0.3, 0], [x + 0.3, EDGE + 0.3, 0.08], { ...PLATE, bottom: false });
    // Its joist back to the wall, and knee braces up to the girder and the joist.
    girder(m, [x, EDGE - 0.16], [x, -joists[i]], top, H, STEEL);
    const k = 1.1;
    for (const s of [-1, 1]) if (x + s * k > 0 && x + s * k < 16) strap(m, [x + s * 0.15, EDGE + 0.17, top - k], [x + s * k, EDGE + 0.17, top], 0.12, BEAM, 'y');
    if (joists[i] > 2.5) strap(m, [x + 0.17, EDGE - 0.15, top - k], [x + 0.17, EDGE - k, top], 0.12, BEAM, 'x');
    // Collides as its base plate.
    m.line(x - 0.3, EDGE - 0.3, x + 0.3, EDGE - 0.3).line(x + 0.3, EDGE - 0.3, x + 0.3, EDGE + 0.3).line(x + 0.3, EDGE + 0.3, x - 0.3, EDGE + 0.3).line(x - 0.3, EDGE + 0.3, x - 0.3, EDGE - 0.3);
  });
  // A power cable slung along the girder's face, sagging between the posts.
  for (let i = 0; i < posts.length - 1; i++) {
    const [a, b] = [posts[i] + 0.2, posts[i + 1] - 0.2];
    const sag = (u) => top - 0.05 - 0.55 * 4 * u * (1 - u);
    const n = 4;
    for (let j = 0; j < n; j++) {
      const [u0, u1] = [j / n, (j + 1) / n];
      strap(m, [a + (b - a) * u0, EDGE + 0.22, sag(u0)], [a + (b - a) * u1, EDGE + 0.22, sag(u1)], 0.07, CABLE, 'z');
    }
  }
  // The junction box on the fourth post's south face: its panel hanging
  // open off one hinge, the cable dropping out of its foot, cut short.
  const bx = posts[3];
  const y0 = EDGE + 0.17;
  m.box([bx - 0.3, y0, 2.6], [bx + 0.3, y0 + 0.25, 3.4], { ...STEEL, side: (i) => (i === 2 ? { color: [16, 14, 12] } : undefined) });
  m.face([[bx + 0.3, y0 + 0.25, 2.65], [bx + 0.55, y0 + 0.75, 2.72], [bx + 0.55, y0 + 0.75, 3.42], [bx + 0.3, y0 + 0.25, 3.35]], { ...STEEL, twoSided: true });
  // Inside, burnt-out boards and a contact still glowing.
  m.box([bx - 0.22, y0 + 0.2, 2.7], [bx + 0.22, y0 + 0.24, 3.3], { color: [44, 40, 34], bottom: false, top: false });
  m.box([bx - 0.08, y0 + 0.24, 2.95], [bx + 0.06, y0 + 0.26, 3.05], { color: [255, 180, 90], glow: true, bottom: false, top: false });
  const [cx, cy] = [bx + 0.15, y0 + 0.12];
  strap(m, [cx, cy, 2.6], [cx + 0.05, cy + 0.05, 2.1], 0.07, CABLE, 'x');
  strap(m, [cx + 0.05, cy + 0.05, 2.1], [BALCONY_FRAME.sparks[1][0], BALCONY_FRAME.sparks[1][1], BALCONY_FRAME.sparks[1][2]], 0.07, CABLE, 'x');
  return m.build();
}

export default [frame()];
