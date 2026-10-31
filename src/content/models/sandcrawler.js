import { ModelBuilder } from './lib/build.js';

// `sandcrawler`: the Jawas' sandcrawler parked behind the junk yard, its
// main shapes after Mark's pictures (2026-10-31): a tall slab-sided hull on
// four tread units, a band round its foot standing a little proud, the back
// stepped down, the roof rising gently to a prow that overhangs a long
// raking front. Its side door is open and the ramp lowered from it. The
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

const HULL = { tex: 'metal-rust' };
const DARK = { tex: 'metal-grey', texScale: 0.5 };
const TREAD = { color: [58, 64, 52] };

/** The side profile (x along it, z up): the band's and the body's, convex. */
const { belly: G, half: Y, lip: L } = CRAWLER;
const BAND_TOP = 5;
// Where the hold's doorway ends (its walls are the level's, inside this).
const INNER = 5;
// The front rakes back from its foot to under the prow (1 forward for 2.4 up).
const rake = (z) => 11.5 + (z - G) * 0.41;
const BAND = [[-18.3, G], [rake(G), G], [rake(BAND_TOP), BAND_TOP], [-18.3, BAND_TOP]];
const BODY = [[-18, BAND_TOP], [rake(BAND_TOP), BAND_TOP], [rake(17.4), 17.4], [18, 19.8], [-16.5, 17], [-18, 16]];

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
  // North of the hold's doorway, whole; south of it, either side of the
  // door and over it (the door goes up from the deck through the band).
  // Between them it's open: through the door, the level's doorway.
  const spans = [[-Infinity, d0], [d1, Infinity]];
  // (The body's underside would show in the hold: it's left out, and the
  // band's top covers it from outside.)
  for (const [outline, half] of [[BAND, Y + L], [BODY, Y]]) {
    const under = outline === BODY ? { side: (i) => (i === 0 ? false : undefined) } : {};
    across(outline, -half, INNER, { top: false, ...under });
    for (const [x0, x1] of spans) across(cut(outline, x0, x1), INNER, half, { bottom: false, ...under });
    const over = cut(outline, d0, d1).map(([x, z]) => [x, Math.max(z, CRAWLER.doorTop)]);
    if (Math.max(...over.map((q) => q[1])) > CRAWLER.doorTop) across(over, INNER, half, { bottom: false });
  }
  // The door's jambs and head, dark, and the sill under it.
  m.face([[d0, INNER, CRAWLER.doorTop], [d1, INNER, CRAWLER.doorTop], [d1, Y + L, CRAWLER.doorTop], [d0, Y + L, CRAWLER.doorTop]], { ...DARK, twoSided: true });
  for (const x of [d0, d1]) m.face([[x, INNER, G], [x, Y + L, G], [x, Y + L, CRAWLER.doorTop], [x, INNER, CRAWLER.doorTop]], { ...DARK, twoSided: true });
  m.box([d0, INNER, G], [d1, Y + L, CRAWLER.deck], DARK);
  // The ramp: a thick plate from the sill down and out, the hold's level at
  // the top and the ground's at its foot.
  const z = (y) => CRAWLER.deck + 0.3 - (y - (Y + L)) * CRAWLER.slope;
  const y1 = Y + L + CRAWLER.ramp;
  const plate = [[Y + L, z(Y + L)], [y1, z(y1)], [y1, z(y1) - 0.25], [Y + L, z(Y + L) - 0.25]];
  m.prism(plate.map(([y, zz]) => [y, zz]), d0, d1, { ...HULL, axis: 'x', top: HULL, bottom: HULL, texScale: 0.5 });
  // Four tread units: housings with rounded ends, the treads' dark belt round them.
  for (const [x0, x1] of [[-16.5, -7], [0.5, 10.5]]) {
    for (const s of [-1, 1]) {
      const [ya, yb] = s < 0 ? [-Y + 0.2, -Y + 2.8] : [Y - 2.8, Y - 0.2];
      const unit = [[x0 + 0.9, 0], [x1 - 0.9, 0], [x1, 1.1], [x1 - 0.5, G], [x0 + 0.5, G], [x0, 1.1]];
      m.prism(unit, ya, yb, { ...TREAD, axis: 'y' });
      // The housing over the belt, on its outer side.
      const out = s < 0 ? [ya - 0.15, ya + 0.05] : [yb - 0.05, yb + 0.15];
      m.prism([[x0 + 1.2, 0.35], [x1 - 1.2, 0.35], [x1 - 1.2, 2.2], [x0 + 1.2, 2.2]], out[0], out[1], { ...DARK, axis: 'y' });
    }
  }
  return m.build();
}

export default [sandcrawler()];
