import { ModelBuilder } from './lib/build.js';

// `freighter`: the gutted freighter in the derelict bay (levels/m1.js), a
// battered light freighter that came down on its belly and was left.
// Scavengers have had half its plating, so its frames show through, and
// one of the two engines on its back is stripped to its rings. A blunt
// hull with a raked front and the cockpit in a pod on its starboard side
// forward. Built nose west (-x), starboard north (-y); the origin on the
// ground under the middle of the hold. The hold is the level's (tiles, 18
// by 9 and 5 tall, Rusk in it): the hull is built round it, and its stern
// hatch is the hold's door, so the stern is open there.
export const FREIGHTER = {
  /** The stern, a hair behind the hold's end wall (level with it, the two flicker). */
  stern: 9.05,
  /** The stern hatch: half its width, and its top (the hold's door). */
  hatch: [2.5, 3],
};

const HULL = { tex: 'metal-grey', texScale: 2 };
const PATCH = { tex: 'metal-rust', texScale: 1 };
const FRAME = { tex: 'metal-rust', texScale: 0.5 };
const HOLE = { color: [18, 15, 12] };
const GUTS = { color: ['gray', 0.22] };
const GLASS = { color: [34, 46, 54] };

// The hull's cross-section (y across, z up), convex, round the hold's 9 by
// 5; and the front's, lower over the raked nose.
const SECTION = [[-4.8, 0], [4.8, 0], [5, 1.2], [4.8, 4.9], [3.6, 5.8], [-3.6, 5.8], [-4.8, 4.9], [-5, 1.2]];
const FRONT = [[-4.8, 0], [4.8, 0], [5, 1.2], [4.75, 5.05], [3.4, 5.15], [-3.4, 5.15], [-4.75, 5.05], [-5, 1.2]];
const ROOF = 5.8;
/** How far out the hull's side is at height z (between its chine and its shoulder). */
const side = (z) => 5 - (0.2 * (z - 1.2)) / 3.7;

/** A convex polygon (y, z) cut by a line: keep where `f` is 0 or more (f linear). */
function clip(poly, f) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const [fa, fb] = [f(a), f(b)];
    if (fa >= 0) out.push(a);
    if (fa * fb < 0) {
      const t = fa / (fa - fb);
      out.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]);
    }
  }
  return out;
}

function freighter() {
  const m = new ModelBuilder('freighter');
  const { stern: X, hatch: [hw, ht] } = FREIGHTER;
  const MID = [0, 0, 3];
  // The hull, the raked nose before it (no underside: it's on the ground).
  m.prism(SECTION, -6, X, { ...HULL, axis: 'x', top: false, bottom: false, side: (i) => (i === 0 ? false : undefined) });
  m.loft(FRONT, -9.3, SECTION, -6, { ...HULL, axis: 'x', top: false, side: (i) => (i === 0 ? false : undefined) });
  // The stern, round the hatch: either side of it, and over it.
  for (const piece of [clip(SECTION, ([y]) => -hw - y), clip(SECTION, ([y]) => y - hw), clip(clip(clip(SECTION, ([y]) => y + hw), ([y]) => hw - y), ([, z]) => z - ht)]) {
    m.face(piece.map(([y, z]) => [X, y, z]), HULL, MID);
  }
  // A rusty frame round the hatch.
  m.box([X, -hw - 0.2, ht], [X + 0.15, hw + 0.2, ht + 0.22], FRAME);
  for (const s of [-1, 1]) m.box([X, s > 0 ? hw : -hw - 0.2, 0], [X + 0.15, s > 0 ? hw + 0.2 : -hw, ht], FRAME);

  // Where the plating's gone: dark holes a hair proud of the side (s: -1
  // north, 1 south) or the roof, frames across them every 0.8.
  const sideHole = (x0, x1, z0, z1, s) => {
    m.face([[x0, s * (side(z0) + 0.03), z0], [x1, s * (side(z0) + 0.03), z0], [x1, s * (side(z1) + 0.03), z1], [x0, s * (side(z1) + 0.03), z1]], HOLE, [(x0 + x1) / 2, 0, (z0 + z1) / 2]);
    for (let x = x0 + 0.4; x < x1 - 0.2; x += 0.8) m.box([x - 0.07, s > 0 ? side(z0) - 0.05 : -side(z0) - 0.1, z0], [x + 0.07, s > 0 ? side(z0) + 0.1 : -side(z0) + 0.05, z1], FRAME);
  };
  const roofHole = (x0, x1, y0, y1) => {
    m.face([[x0, y0, ROOF + 0.03], [x1, y0, ROOF + 0.03], [x1, y1, ROOF + 0.03], [x0, y1, ROOF + 0.03]], HOLE, [(x0 + x1) / 2, (y0 + y1) / 2, 0]);
    for (let x = x0 + 0.4; x < x1 - 0.2; x += 0.8) m.box([x - 0.07, y0, ROOF - 0.05], [x + 0.07, y1, ROOF + 0.1], FRAME);
  };
  sideHole(-4.4, -1.2, 1.8, 4.3, -1);
  sideHole(2.6, 5.8, 2.4, 4.5, -1);
  sideHole(-7.6, -5.2, 2, 4.1, 1);
  sideHole(0.4, 3.6, 1.5, 3.9, 1);
  roofHole(-4.2, -0.2, -2.2, 1.4);
  // Plates that were patched once, in rust.
  const patch = (x0, x1, z0, z1, s) => m.face([[x0, s * (side(z0) + 0.02), z0], [x1, s * (side(z0) + 0.02), z0], [x1, s * (side(z1) + 0.02), z1], [x0, s * (side(z1) + 0.02), z1]], PATCH, [(x0 + x1) / 2, 0, (z0 + z1) / 2]);
  patch(-8.4, -6.2, 1.3, 2.9, -1);
  patch(5.2, 7.6, 1.4, 3.2, 1);
  patch(-3.2, -0.8, 3.9, 4.7, 1);

  // The cockpit: a pod along the starboard side forward, its windows round
  // its nose, dark, and a neck back into the hull.
  const POD = { y: -5.9, z: 3.5, r: 1.25 };
  const ring = (r, dz = 0) => Array.from({ length: 8 }, (_, i) => {
    const a = Math.PI / 8 + (i / 8) * Math.PI * 2;
    return [POD.y + Math.cos(a) * r, POD.z + dz + Math.sin(a) * r];
  });
  m.prism(ring(POD.r), -11.2, -3.2, { ...HULL, axis: 'x', bottom: false });
  m.loft(ring(0.55, -0.2), -12.4, ring(POD.r), -11.2, { ...HULL, axis: 'x', top: false, side: (i) => (i >= 1 && i <= 3 ? GLASS : undefined) });

  // The engines on its back, aft: the south one whole, its intake and
  // nozzle dark; the north one stripped to its rings, the rails between
  // them and the core.
  const ENGINE = { x0: 1.4, x1: 9.6, z: 6.6, r: 1.05 };
  m.cylinder([ENGINE.x0, 2.3, ENGINE.z], ENGINE.r, ENGINE.x1 - ENGINE.x0, { ...HULL, axis: 'x', segments: 8, turn: Math.PI / 8, top: HOLE, bottom: HOLE });
  m.box([ENGINE.x0 + 1, 1.9, ROOF - 0.1], [ENGINE.x1 - 1, 2.7, ENGINE.z - 0.6], FRAME);
  for (const x of [ENGINE.x0, 3.4, 5.4, 7.4, ENGINE.x1 - 0.2]) {
    m.cylinder([x, -2.3, ENGINE.z], ENGINE.r, 0.2, { ...FRAME, axis: 'x', segments: 8, turn: Math.PI / 8, top: false, bottom: false, twoSided: true });
  }
  for (const [y, z] of [[-2.3, ENGINE.z + 0.97], [-3.27, ENGINE.z], [-1.33, ENGINE.z]]) m.box([ENGINE.x0, y - 0.06, z - 0.06], [ENGINE.x1, y + 0.06, z + 0.06], FRAME);
  m.cylinder([ENGINE.x0 + 0.6, -2.3, ENGINE.z], 0.42, ENGINE.x1 - ENGINE.x0 - 1.6, { ...GUTS, axis: 'x', segments: 6 });
  m.box([ENGINE.x0 + 1, -2.7, ROOF - 0.1], [ENGINE.x1 - 1, -1.9, ENGINE.z - 0.6], FRAME);
  return m.build();
}

export default [freighter()];
