import { ModelBuilder } from './lib/build.js';

// Mos Eisley's cloth awnings (lib/town.js, awning()). The kit lays a thin
// slab over the street as an awning's shade and underside; these stand on
// it: the cloth's sloped top, in bays 2 tiles wide that sag between their
// ribs, with a torn fringe along the front. Built looking south (+y):
// the front edge along y = 0, the wall at y = -depth, z = 0 the slab's top.
// The kit sets them along the front, an end cap at each end, and poles
// under the front corners; one that stands free (a market stall's) gets
// poles at the back too and its bays' backs closed.

/** The cloth's rise per tile of depth, from the front up to the wall. */
export const AWNING_SLOPE = 0.3;
/** A rib stands this far above the slab at the front; the cloth sags to it between. */
const RIB = 0.1;
/** The fringe's drop below the front edge (the hem texture is 16 texels). */
const FRINGE = 0.5;

/** The cloths (tools/art/textures/awning.js) and depths there are models for. */
export const AWNING_CLOTHS = ['red', 'teal', 'sand', 'olive', 'umber'];
export const AWNING_DEPTHS = [2, 3];
/** Pole heights (from the street to the slab's bottom), a quarter tile apart. */
export const AWNING_POLES = Array.from({ length: 13 }, (_, k) => 2.5 + k * 0.25);

/** A bay: the sloped top, and its fringe unless `bare` (when a swaying valance hangs there instead). */
function bay(id, cloth, depth, bare) {
  const m = new ModelBuilder(id);
  const tex = `awning-${cloth}`;
  const rise = depth * AWNING_SLOPE;
  // Two halves, each a plane from a rib down to the sag in the middle.
  for (const s of [-1, 1]) {
    const rib = [s, 0, RIB];
    const mid = [0, 0, 0];
    m.face([rib, mid, [0, -depth, rise], [s, -depth, rise + RIB]], { tex }, [s * 0.5, -depth / 2, -1]);
  }
  if (!bare) {
    // The fringe: the hem texture across the 2 tiles (64 texels), hanging
    // from the front edge as it sags, seen from both sides.
    const hem = `awning-${cloth}-hem`;
    for (const s of [-1, 1]) {
      const [u0, u1] = s < 0 ? [0, 0.5] : [0.5, 1];
      const pts = [[s < 0 ? -1 : 0, 0.01, s < 0 ? RIB : 0], [s < 0 ? 0 : 1, 0.01, s < 0 ? 0 : RIB]];
      const q = [pts[0], pts[1], [pts[1][0], 0.01, pts[1][2] - FRINGE], [pts[0][0], 0.01, pts[0][2] - FRINGE]];
      m.face(q, { tex: hem, twoSided: true, uv: [[u0, 0], [u1, 0], [u1, 1], [u0, 1]] });
    }
  }
  return m.build();
}

/** An end: the triangle between the slab and the sloped top, at x = 0, seen from both sides. */
function end(id, cloth, depth) {
  const m = new ModelBuilder(id);
  const rise = depth * AWNING_SLOPE;
  m.face([[0, 0, 0], [0, 0, RIB], [0, -depth, rise + RIB], [0, -depth, 0]], { tex: `awning-${cloth}`, twoSided: true });
  return m.build();
}

/**
 * A bay's back, for an awning that stands free (a stall's): the cloth from
 * the slab up to the sloped top at y = -depth, seen from both sides.
 */
function back(id, cloth, depth) {
  const m = new ModelBuilder(id);
  const rise = depth * AWNING_SLOPE;
  for (const s of [-1, 1]) m.face([[s, -depth, 0], [0, -depth, 0], [0, -depth, rise], [s, -depth, rise + RIB]], { tex: `awning-${cloth}`, twoSided: true });
  return m.build();
}

/** A pole from the street up to the slab's bottom: a thin dark post on a stone foot. */
function pole(id, h) {
  const m = new ModelBuilder(id);
  m.box([-0.12, -0.12, 0], [0.12, 0.12, 0.2], { tex: 'flagstone', bottom: false });
  m.cylinder([0, 0, 0.2], 0.06, h - 0.2, { segments: 6, color: ['rust', 0.25], bottom: false });
  return m.build();
}

/** Every awning model's id, for the decorations. */
export const AWNING_MODELS = [];
const models = [];
for (const cloth of AWNING_CLOTHS) {
  for (const depth of AWNING_DEPTHS) {
    const id = `awning-${cloth}-${depth}`;
    models.push(bay(id, cloth, depth, false), bay(`${id}-bare`, cloth, depth, true), end(`${id}-end`, cloth, depth), back(`${id}-back`, cloth, depth));
    AWNING_MODELS.push(id, `${id}-bare`, `${id}-end`, `${id}-back`);
  }
}
/** A pole's id for its height. */
export const poleId = (h) => `awning-pole-${Math.round(h * 100)}`;
for (const h of AWNING_POLES) {
  models.push(pole(poleId(h), h));
}

export default models;
