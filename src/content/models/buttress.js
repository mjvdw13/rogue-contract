import { ModelBuilder } from './lib/build.js';
import { PLASTERS } from './dome.js';

// Mos Eisley's buttresses (Mark's film stills, 2026-10-18): a pier of
// plaster hugging a wall, thicker at the foot and leaning in as it rises
// (the film's walls are battered), up to a short sloping cap just under
// the roofline.
//
// `buttress-<top>`: `top` tall at the wall (3.5 to 9.5, half a tile apart,
// so one ends under any roof), BUTTRESS.foot deep at the street and
// BUTTRESS.head under its cap, which rises BUTTRESS.cap to the wall. Built
// looking south (+y): the wall's face at y 0, the origin on the floor at
// the pier's middle; the town kit turns it to face its wall. Its back and
// underside are hidden. It collides as its footprint (lines), so you can't
// climb it. Each comes in the five plasters (`buttress-5-pale`, as the
// domes).

export const BUTTRESS = { tops: [3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5], foot: 0.9, head: 0.3, cap: 0.6, wide: 1.25, narrow: 1 };

export const BUTTRESS_MODELS = [];
for (const [suffix, tex] of Object.entries(PLASTERS)) {
  for (const top of BUTTRESS.tops) BUTTRESS_MODELS.push({ id: `buttress-${top}${suffix}`, top, tex });
}

function buttress(id, top, tex) {
  const m = new ModelBuilder(id);
  const s = { tex };
  const { foot, head, cap, wide, narrow } = BUTTRESS;
  const shoulder = top - cap;
  // Half its width at height z: it narrows evenly from foot to top, so
  // each side is one flat face.
  const w = (z) => (wide + ((narrow - wide) * z) / top) / 2;
  const inside = [0, head / 2, top / 2];
  for (const sign of [1, -1]) {
    m.face([[sign * w(0), 0, 0], [sign * w(0), foot, 0], [sign * w(shoulder), head, shoulder], [sign * w(top), 0, top]], s, inside);
  }
  // Its leaning front, then the cap back to the wall.
  m.face([[-w(0), foot, 0], [w(0), foot, 0], [w(shoulder), head, shoulder], [-w(shoulder), head, shoulder]], s, inside);
  m.face([[-w(shoulder), head, shoulder], [w(shoulder), head, shoulder], [w(top), 0, top], [-w(top), 0, top]], s, inside);
  m.outlineLines([[-w(0), 0], [-w(0), foot], [w(0), foot], [w(0), 0]]);
  return m.build();
}

export default BUTTRESS_MODELS.map((d) => buttress(d.id, d.top, d.tex));
