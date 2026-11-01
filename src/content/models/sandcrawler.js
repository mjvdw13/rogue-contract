import { ModelBuilder } from './lib/build.js';

// `sandcrawler`: the Jawas' sandcrawler parked behind the junk yard, its
// main shapes after Mark's pictures (2026-10-31): a tall slab-sided hull on
// four tread units, a band round its foot standing a little proud, the back
// stepped down, the roof rising gently to a prow that overhangs a long
// raking front. A crease runs up each side from the front's foot to the
// roof, and ahead of it the side bevels in toward the front, so the prow
// takes the light differently. Vents along the prow's top, a small window
// each side, ports along the band, slots in the treads' housings. Its side
// door is open and the ramp lowered from it. The
// origin on the ground under its middle; at angle 0 the prow points east and
// the door is in the south side. 36 long, 20 tall at the prow, 10.8 wide.
// The hold inside is the level's (tiles), within the hull: the door is
// where its doorway is, the ramp over its steps.
export const CRAWLER = {
  /** The hull's bottom, over the treads; the hold's floor, a deck above it. */
  belly: 2.5,
  deck: 3,
  /** Half its width (the band stands `lip` proud of it). */
  half: 5.4,
  lip: 0.3,
  /** The door in the south side: along the hull, and its top. */
  door: [-4, 0],
  doorTop: 7,
  /** How far out from the side the lowered ramp reaches, and its slope (down per tile). */
  ramp: 7.3,
  slope: 0.5,
};

// Rusty plating, a panel about a tile (derive.mjs); the door and housings'
// grey metal; the openings' dark.
const HULL = { tex: 'crawler-hull', texScale: 2 };
const DARK = { tex: 'metal-grey', texScale: 0.5 };
const TREAD = { color: [58, 64, 52] };
const HOLE = { color: [20, 16, 12] };

/** The side profile (x along it, z up): the band's and the body's, convex. */
const { belly: G, half: Y, lip: L } = CRAWLER;
const BAND_TOP = 5;
// Where the hold's doorway ends (its walls are the level's, inside this).
const INNER = 5;
// The front rakes back from its foot to under the prow (1 forward for 2.4 up).
const rake = (z) => 11.5 + (z - G) * 0.41;
const BAND = [[-18.3, G], [rake(G), G], [rake(BAND_TOP), BAND_TOP], [-18.3, BAND_TOP]];
// The body's corners: A and B its foot, C the top of the rake and D the
// prow's tip, E and F the stepped back; K is where the crease meets the roof.
const [A, B, C, D, E, F] = [[-18, BAND_TOP], [rake(BAND_TOP), BAND_TOP], [rake(17.4), 17.4], [18, 19.8], [-16.5, 17], [-18, 16]];
const roof = (x) => E[1] + ((x - E[0]) * (D[1] - E[1])) / (D[0] - E[0]);
const K = [4, roof(4)];
/** How far the prow's front edge stands in from the side, at C and D (so its facet is flat). */
const BEVEL = 1.4;
const insetAt = ([x, z]) => {
  const along = (q) => (q[0] - B[0]) * (K[1] - B[1]) - (q[1] - B[1]) * (K[0] - B[0]);
  return (BEVEL * along([x, z])) / along(D);
};

function sandcrawler() {
  const m = new ModelBuilder('sandcrawler');
  const [d0, d1] = CRAWLER.door;
  // The band and the body: prisms across the hull, the south side (y > 0)
  // built in pieces round the door.
  const across = (outline, y0, y1, style) => m.prism(outline, y0, y1, { ...HULL, axis: 'y', ...style });
  /** A profile cut to x in [x0, x1] (its edges clipped there). */
  const cut = (outline, x0, x1) => {
    const out = [];
    for (let i = 0; i < outline.length; i++) {
      const a = outline[i];
      const b = outline[(i + 1) % outline.length];
      if (a[0] >= x0 && a[0] <= x1) out.push(a);
      // Where the edge crosses x0 or x1, in the order it meets them.
      const ts = [x0, x1].filter((xc) => (a[0] - xc) * (b[0] - xc) < 0).map((xc) => (xc - a[0]) / (b[0] - a[0]));
      for (const t of ts.sort((p, q) => p - q)) out.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]);
    }
    return out;
  };
  // The band: north of the hold's doorway, whole; south of it, either side
  // of the door (the door goes up from the deck through it). Between them
  // it's open: through the door, the level's doorway.
  const spans = [[-Infinity, d0], [d1, Infinity]];
  across(BAND, -Y - L, INNER, { top: false });
  for (const [x0, x1] of spans) across(cut(BAND, x0, x1), INNER, Y + L, { bottom: false });
  // The body, face by face (it has no underside, which would show in the
  // hold; the band's top covers it from outside). Each side: behind the
  // crease, flat (on the south round the door), and ahead of it the prow's
  // facet, bevelled in to the front.
  const MID = [0, 0, 11];
  const at = ([x, z], y) => [x, y, z];
  const pro = (q, s) => at(q, s * (Y - insetAt(q)));
  const REAR = [A, B, K, E, F];
  m.face(REAR.map((q) => at(q, -Y)), HULL, MID);
  for (const [x0, x1] of spans) m.face(cut(REAR, x0, x1).map((q) => at(q, Y)), HULL, MID);
  m.face(cut(REAR, d0, d1).map(([x, zz]) => at([x, Math.max(zz, CRAWLER.doorTop)], Y)), HULL, MID);
  for (const s of [-1, 1]) m.face([at(B, s * Y), pro(C, s), pro(D, s), at(K, s * Y)], HULL, MID);
  // The rake, the prow's lip, the roof, and the back and its step.
  m.face([at(B, -Y), at(B, Y), pro(C, 1), pro(C, -1)], HULL, MID);
  m.face([pro(C, -1), pro(C, 1), pro(D, 1), pro(D, -1)], HULL, MID);
  m.face([at(E, -Y), at(K, -Y), pro(D, -1), pro(D, 1), at(K, Y), at(E, Y)], HULL, MID);
  m.face([at(F, -Y), at(F, Y), at(E, Y), at(E, -Y)], HULL, MID);
  m.face([at(A, -Y), at(A, Y), at(F, Y), at(F, -Y)], HULL, MID);
  /** A dark opening on a side (s: -1 north, 1 south), a hair proud of the face at |y|. */
  const hole = (x0, x1, z0, z1, y, s) => m.face([[x0, s * y, z0], [x1, s * y, z0], [x1, s * y, z1], [x0, s * y, z1]], HOLE, [(x0 + x1) / 2, 0, (z0 + z1) / 2]);
  // A small window high on each side, and ports along the band.
  for (const s of [-1, 1]) {
    hole(-7, -5.6, 11, 12.4, Y + 0.04, s);
    for (let x = -16.5; x < 10; x += 3) if (s < 0 || x + 0.35 < d0 - 0.5 || x > d1 + 0.5) hole(x, x + 0.35, 3.9, 4.25, Y + L + 0.03, s);
  }
  // Vents in a row along the prow's lip, a hair in front of it.
  const lipX = (zz) => C[0] + ((zz - C[1]) * (D[0] - C[0])) / (D[1] - C[1]) + 0.04;
  const [v0, v1] = [18.3, 19.1];
  const across0 = -(Y - BEVEL) + 0.45;
  for (let k = 0; k < 6; k++) {
    const ya = across0 + k * 1.5;
    m.face([[lipX(v0), ya, v0], [lipX(v0), ya + 1, v0], [lipX(v1), ya + 1, v1], [lipX(v1), ya, v1]], HOLE, [0, ya + 0.5, (v0 + v1) / 2]);
  }
  // The door's jambs and head, dark. The jambs stand a hair in from the
  // doorway's walls: level with them, the two flicker through each other.
  // (No sill: the steps' tiles are its floor, and a model under a floor
  // still shows through it.)
  const [j0, j1] = [d0 + 0.04, d1 - 0.04];
  m.face([[j0, INNER, CRAWLER.doorTop], [j1, INNER, CRAWLER.doorTop], [j1, Y + L, CRAWLER.doorTop], [j0, Y + L, CRAWLER.doorTop]], { ...DARK, twoSided: true });
  for (const x of [j0, j1]) m.face([[x, INNER, G], [x, Y + L, G], [x, Y + L, CRAWLER.doorTop], [x, INNER, CRAWLER.doorTop]], { ...DARK, twoSided: true });
  // The ramp: a thick plate from the sill down and out, the hold's level at
  // the top and the ground's at its foot.
  const z = (y) => CRAWLER.deck + 0.3 - (y - (Y + L)) * CRAWLER.slope;
  const y1 = Y + L + CRAWLER.ramp;
  const plate = [[Y + L, z(Y + L)], [y1, z(y1)], [y1, z(y1) - 0.25], [Y + L, z(Y + L) - 0.25]];
  m.prism(plate.map(([y, zz]) => [y, zz]), d0, d1, { ...HULL, axis: 'x', top: HULL, bottom: HULL, texScale: 1 });
  // Four tread units: housings with rounded ends, the treads' dark belt round them.
  for (const [x0, x1] of [[-16.5, -7], [0.5, 10.5]]) {
    for (const s of [-1, 1]) {
      const [ya, yb] = s < 0 ? [-Y + 0.2, -Y + 2.8] : [Y - 2.8, Y - 0.2];
      const unit = [[x0 + 0.9, 0], [x1 - 0.9, 0], [x1, 1.1], [x1 - 0.5, G], [x0 + 0.5, G], [x0, 1.1]];
      m.prism(unit, ya, yb, { ...TREAD, axis: 'y' });
      // The housing over the belt, on its outer side.
      const out = s < 0 ? [ya - 0.15, ya + 0.05] : [yb - 0.05, yb + 0.15];
      m.prism([[x0 + 1.2, 0.35], [x1 - 1.2, 0.35], [x1 - 1.2, 2.2], [x0 + 1.2, 2.2]], out[0], out[1], { ...DARK, axis: 'y' });
      // Three slots in it.
      const mid = (x0 + x1) / 2;
      for (const dx of [-1.2, 0, 1.2]) hole(mid + dx - 0.1, mid + dx + 0.1, 0.9, 1.7, Math.abs(s < 0 ? out[0] : out[1]) + 0.03, s);
    }
  }
  return m.build();
}

export default [sandcrawler()];
