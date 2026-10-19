import { ModelBuilder } from './lib/build.js';
import { PLASTERS } from './dome.js';

// Mos Eisley's sloping buttresses (Mark's film stills, 2026-10-18): a wedge
// of plaster against a wall, from near the roofline down to a blunt toe on
// the street, wider at the foot, as the film's walls are thicker there.
//
// `buttress-<top>`: `top` tall at the wall, BUTTRESS.slope times that out
// from it, its toe BUTTRESS.toe high. Built looking south (+y): the wall's
// face at y 0, the origin on the floor at the buttress's middle; the town
// kit turns it to face its wall. Its back and underside are hidden. It
// collides as its footprint (lines), so you can't climb it. Each comes in
// the five plasters (`buttress-5-pale`, as the domes).

export const BUTTRESS = { tops: [4, 5, 6], slope: 0.4, toe: 0.4, foot: 1.5, head: 1 };

export const BUTTRESS_MODELS = [];
for (const [suffix, tex] of Object.entries(PLASTERS)) {
  for (const top of BUTTRESS.tops) BUTTRESS_MODELS.push({ id: `buttress-${top}${suffix}`, top, tex });
}

function buttress(id, top, tex) {
  const m = new ModelBuilder(id);
  const s = { tex };
  const { slope, toe, foot, head } = BUTTRESS;
  const d = top * slope;
  // Half its width at height z: it narrows evenly from foot to head, so
  // each side is one flat face.
  const w = (z) => (foot + ((head - foot) * z) / top) / 2;
  const inside = [0, d / 3, top / 3];
  for (const sign of [1, -1]) {
    m.face([[sign * w(0), 0, 0], [sign * w(0), d, 0], [sign * w(toe), d, toe], [sign * w(top), 0, top]], s, inside);
  }
  // The toe's front, then the slope up to the wall.
  m.face([[-w(0), d, 0], [w(0), d, 0], [w(toe), d, toe], [-w(toe), d, toe]], s, inside);
  m.face([[-w(toe), d, toe], [w(toe), d, toe], [w(top), 0, top], [-w(top), 0, top]], s, inside);
  m.outlineLines([[-w(0), 0], [-w(0), d], [w(0), d], [w(0), 0]]);
  return m.build();
}

export default BUTTRESS_MODELS.map((d) => buttress(d.id, d.top, d.tex));
