import { ModelBuilder } from './lib/build.js';

// Mos Eisley's lean-to roofs (lib/town.js, leanTo()): sheets of corrugated
// tin on a low building, sloping from the wall behind it down past its
// front, where they overhang the street. A sheet is 2 tiles wide and a hair
// thick; the kit lays them side by side, each a little higher or lower than
// the last, in rusty or galvanised tin, and closes each end with a
// triangle of tin. Built looking south (+y): the front wall's top edge
// along y = 0, z = 0 (the flat roof), the back at y = -depth.

/** The tin's rise per tile of depth, from the front up to the back. */
export const TIN_SLOPE = 0.25;
/** How far the sheets hang out past the front wall, and how high they start over the roof there. */
export const TIN_OVERHANG = 0.6;
const LIFT = 0.15;
const THICK = 0.05;

export const TIN_METALS = ['rust', 'grey'];
export const TIN_DEPTHS = [2, 3, 4, 5, 6];

/** A sheet: a thin slab from the back down over the front wall, its ribs running down the slope. */
function sheet(id, metal, depth) {
  const m = new ModelBuilder(id);
  const tex = { tex: `metal-${metal}` };
  const z = (y) => LIFT - y * TIN_SLOPE;
  // The profile across the slope, in [y, z], extruded along x.
  const profile = [
    [-depth, z(-depth)],
    [TIN_OVERHANG, z(TIN_OVERHANG)],
    [TIN_OVERHANG, z(TIN_OVERHANG) + THICK],
    [-depth, z(-depth) + THICK],
  ];
  m.prism(profile, -1, 1, { ...tex, axis: 'x' });
  return m.build();
}

/** An end: the triangle of tin under a sheet's end, from the roof up to it, seen from both sides. */
function end(id, metal, depth) {
  const m = new ModelBuilder(id);
  m.face([[0, 0, 0], [0, 0, LIFT], [0, -depth, LIFT + depth * TIN_SLOPE], [0, -depth, 0]], { tex: `metal-${metal}`, twoSided: true });
  return m.build();
}

export const TIN_MODELS = [];
const models = [];
for (const metal of TIN_METALS) {
  for (const depth of TIN_DEPTHS) {
    const id = `tin-${metal}-${depth}`;
    models.push(sheet(id, metal, depth), end(`${id}-end`, metal, depth));
    TIN_MODELS.push(id, `${id}-end`);
  }
}

export default models;
