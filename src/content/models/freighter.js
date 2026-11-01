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
  /**
   * Where the hold's walls and ceiling are open behind the holes in the
   * plating, so you see in and out (levels/m1.js opens the tiles): [x0,
   * x1, z0, z1, side] (side -1 north, 1 south) up to the hold's ceiling
   * at 3.25, their sills out of a jump's reach from the sand (1.8; a jump
   * reaches about 1.56), so the stern door still gates the hold. (Crouched,
   * 1 tall, you could crawl through from inside, onto the console under
   * the first.) The roof's: [x0, x1, y0, y1].
   */
  windows: [[-4, -2, 1.8, 3.25, -1], [3, 5, 2.4, 3.25, -1], [1, 3, 1.8, 3.25, 1]],
  skylight: [-4, -1, -1.5, 0.5],
};

// Plain plate, not corrugated tin (Mark, 2026-11-01: too patterned).
const HULL = { tex: 'freighter-hull', texScale: 2 };
const PATCH = { tex: 'yard-plate-rust', texScale: 1.5 };
const FRAME = { tex: 'freighter-hull', texScale: 0.5 };
// The engines: scorched dark plate, bands round them, a grille in the intake.
const ENGINE_SKIN = { tex: 'freighter-engine', texScale: 2 };
const BAND = { tex: 'band-steel', texScale: 1 };
const INTAKE = { tex: 'speeder-intake', texScale: 2 };
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
  // Its upper sides (edges 2 and 6) and roof (4) are laid in pieces round
  // the windows and the skylight, below.
  m.prism(SECTION, -6, X, { ...HULL, axis: 'x', top: false, bottom: false, side: (i) => (i === 0 || i === 2 || i === 4 || i === 6 ? false : undefined) });
  m.loft(FRONT, -9.3, SECTION, -6, { ...HULL, axis: 'x', top: false, side: (i) => (i === 0 ? false : undefined) });
  // The stern, round the hatch: either side of it, and over it.
  for (const piece of [clip(SECTION, ([y]) => -hw - y), clip(SECTION, ([y]) => y - hw), clip(clip(clip(SECTION, ([y]) => y + hw), ([y]) => hw - y), ([, z]) => z - ht)]) {
    m.face(piece.map(([y, z]) => [X, y, z]), HULL, MID);
  }
  // A rusty frame round the hatch.
  m.box([X, -hw - 0.2, ht], [X + 0.15, hw + 0.2, ht + 0.22], FRAME);
  for (const s of [-1, 1]) m.box([X, s > 0 ? hw : -hw - 0.2, 0], [X + 0.15, s > 0 ? hw + 0.2 : -hw, ht], FRAME);

  // Where the plating's gone: dark holes a hair proud of the side (s: -1
  // north, 1 south) or the roof, frames across them every 0.8. Where the
  // hold is open behind one (a window), the dark is left out round it, so
  // you see through.
  /** Rectangles ([a0, a1, b0, b1]) less the ones given: each cut leaves up to four. */
  const less = (rects, holes) => holes.reduce((out, o) => out.flatMap(([a0, a1, b0, b1]) => {
    const [p0, p1, q0, q1] = [Math.max(a0, o[0]), Math.min(a1, o[1]), Math.max(b0, o[2]), Math.min(b1, o[3])];
    if (p1 <= p0 || q1 <= q0) return [[a0, a1, b0, b1]];
    return [[a0, p0, b0, b1], [p1, a1, b0, b1], [p0, p1, b0, q0], [p0, p1, q1, b1]].filter(([u0, u1, v0, v1]) => u1 - u0 > 1e-6 && v1 - v0 > 1e-6);
  }), rects);
  // The hull's upper sides between chine and shoulder, and its roof, round the openings.
  for (const sd of [-1, 1]) {
    const wins = FREIGHTER.windows.filter((w) => w[4] === sd);
    for (const [a0, a1, b0, b1] of less([[-6, X, 1.2, 4.9]], wins)) {
      m.face([[a0, sd * side(b0), b0], [a1, sd * side(b0), b0], [a1, sd * side(b1), b1], [a0, sd * side(b1), b1]], HULL, MID);
    }
  }
  for (const [a0, a1, b0, b1] of less([[-6, X, -3.6, 3.6]], [FREIGHTER.skylight])) m.face([[a0, b0, ROOF], [a1, b0, ROOF], [a1, b1, ROOF], [a0, b1, ROOF]], HULL, MID);
  const sideHole = (x0, x1, z0, z1, s) => {
    for (const [a0, a1, b0, b1] of less([[x0, x1, z0, z1]], FREIGHTER.windows.filter((w) => w[4] === s))) {
      m.face([[a0, s * (side(b0) + 0.03), b0], [a1, s * (side(b0) + 0.03), b0], [a1, s * (side(b1) + 0.03), b1], [a0, s * (side(b1) + 0.03), b1]], HOLE, [(a0 + a1) / 2, 0, (b0 + b1) / 2]);
    }
    for (let x = x0 + 0.4; x < x1 - 0.2; x += 0.8) m.box([x - 0.07, s > 0 ? side(z0) - 0.05 : -side(z0) - 0.1, z0], [x + 0.07, s > 0 ? side(z0) + 0.1 : -side(z0) + 0.05, z1], FRAME);
  };
  const roofHole = (x0, x1, y0, y1) => {
    for (const [a0, a1, b0, b1] of less([[x0, x1, y0, y1]], [FREIGHTER.skylight])) {
      m.face([[a0, b0, ROOF + 0.03], [a1, b0, ROOF + 0.03], [a1, b1, ROOF + 0.03], [a0, b1, ROOF + 0.03]], HOLE, [(a0 + a1) / 2, (b0 + b1) / 2, 0]);
    }
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

  // Grime (Mark, 2026-11-01: dirtier, streaks): soot and rust streaked
  // down the sides from the shoulder, dust along the foot, soot down the
  // stern from the engines. Grime faces a hair proud of the plate darken
  // it. [picture, middle along the hull, width, top, height]
  const SIDE_GRIME = [
    ['grime-streaks-1', -8.4, 1.8, 4.85, 3], ['grime-drip-1', -6.6, 1.2, 4.8, 2.4], ['grime-streaks-3', -4.6, 2.2, 4.85, 2.6], ['grime-streaks-2', -2.4, 1.6, 4.85, 3.3],
    ['grime-drip-2', -0.6, 1.3, 4.8, 2.2], ['grime-streaks-1', 1.3, 2, 4.85, 3.1], ['grime-streaks-3', 3.6, 1.8, 4.85, 2.4], ['grime-drip-1', 5.4, 1.2, 4.8, 2.8],
    ['grime-streaks-2', 7.2, 2, 4.85, 3.4],
    ['grime-dust-1', -6, 4, 2.4, 1.2], ['grime-dust-2', -1.5, 4, 2.3, 1.1], ['grime-dust-1', 3, 4, 2.4, 1.2], ['grime-dust-2', 7, 3.6, 2.3, 1.1],
  ];
  const grimeFace = (pts, tex, inside) => m.face(pts, { tex, uv: [[0, 1], [1, 1], [1, 0], [0, 0]] }, inside);
  for (const s of [-1, 1]) {
    SIDE_GRIME.forEach(([tex, x, w, top, h], i) => {
      // The other side's are shifted along, so the two don't match.
      const xm = s > 0 ? x : -x + 0.7 * (i % 3);
      const [x0, x1, z0, z1] = [xm - w / 2, xm + w / 2, top - h, top];
      // The streaks twice over, a hair apart, to read through the plate's stains.
      for (const off of tex.startsWith('grime-dust') ? [0.04] : [0.04, 0.07]) {
        const y = (z) => s * (side(z) + off);
        const pts = [[x0, y(z0), z0], [x1, y(z0), z0], [x1, y(z1), z1], [x0, y(z1), z1]];
        grimeFace(s > 0 ? pts : [pts[1], pts[0], pts[3], pts[2]], tex, [xm, 0, (z0 + z1) / 2]);
      }
    });
  }
  // Down the stern under the engines, either side of the hatch.
  for (const [tex, y, w] of [['grime-scorch-1', -2.3, 2.2], ['grime-streaks-2', -3.9, 1.4], ['grime-scorch-2', 2.3, 2.2], ['grime-streaks-1', 3.8, 1.6]]) {
    const z1 = ROOF - 0.15;
    const z0 = Math.max(ht + 0.3, z1 - 2.6);
    grimeFace([[X + 0.03, y + w / 2, z0], [X + 0.03, y - w / 2, z0], [X + 0.03, y - w / 2, z1], [X + 0.03, y + w / 2, z1]], tex, MID);
  }

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
  m.cylinder([ENGINE.x0, 2.3, ENGINE.z], ENGINE.r, ENGINE.x1 - ENGINE.x0, { ...ENGINE_SKIN, axis: 'x', segments: 8, turn: Math.PI / 8, top: HOLE, bottom: INTAKE });
  for (const x of [ENGINE.x0 + 0.3, ENGINE.x1 - 0.7]) m.cylinder([x, 2.3, ENGINE.z], ENGINE.r + 0.06, 0.4, { ...BAND, axis: 'x', segments: 8, turn: Math.PI / 8, top: false, bottom: false });
  m.box([ENGINE.x0 + 1, 1.9, ROOF - 0.1], [ENGINE.x1 - 1, 2.7, ENGINE.z - 0.6], ENGINE_SKIN);
  for (const x of [ENGINE.x0, 3.4, 5.4, 7.4, ENGINE.x1 - 0.2]) {
    m.cylinder([x, -2.3, ENGINE.z], ENGINE.r, 0.2, { ...BAND, axis: 'x', segments: 8, turn: Math.PI / 8, top: false, bottom: false, twoSided: true });
  }
  for (const [y, z] of [[-2.3, ENGINE.z + 0.97], [-3.27, ENGINE.z], [-1.33, ENGINE.z]]) m.box([ENGINE.x0, y - 0.06, z - 0.06], [ENGINE.x1, y + 0.06, z + 0.06], BAND);
  m.cylinder([ENGINE.x0 + 0.6, -2.3, ENGINE.z], 0.42, ENGINE.x1 - ENGINE.x0 - 1.6, { ...GUTS, axis: 'x', segments: 6 });
  m.box([ENGINE.x0 + 1, -2.7, ROOF - 0.1], [ENGINE.x1 - 1, -1.9, ENGINE.z - 0.6], ENGINE_SKIN);
  return m.build();
}

export default [freighter()];
