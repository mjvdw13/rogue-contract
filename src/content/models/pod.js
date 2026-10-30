import { ModelBuilder } from './lib/build.js';

// `dome-pod`: the white dome pod standing in the street by the cantina
// (Mark's film stills): a dome over red and blue bands and a ribbed skirt,
// a round blue window in its side, on four stubby legs. The origin on the
// ground under its middle; at angle 0 its window looks east. POD is how
// wide and tall it is (it collides as its cylinder).
export const POD = { r: 1.35, h: 2.75 };

const WHITE = { tex: 'ware-white' };
const STEEL = { tex: 'band-steel' };
const RING = 12;

/** A ring of RING points of radius `r`. */
const ring = (r) => Array.from({ length: RING }, (_, i) => [Math.cos((i / RING) * Math.PI * 2) * r, Math.sin((i / RING) * Math.PI * 2) * r]);

function pod() {
  const m = new ModelBuilder('dome-pod');
  const R = POD.r;
  // Four stubby legs on round feet, and the base ring they hold up.
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
    const [x, y] = [Math.cos(a) * 0.85, Math.sin(a) * 0.85];
    m.cylinder([x, y, 0], 0.2, 0.06, { ...STEEL, segments: 6, bottom: false });
    m.box([x - 0.08, y - 0.08, 0.06], [x + 0.08, y + 0.08, 0.4], { ...STEEL, top: false, bottom: false });
  }
  m.loft(ring(R - 0.15), 0.4, ring(R - 0.05), 0.55, { ...STEEL, bottom: STEEL, top: false });
  // The ribbed skirt, flaring a little, then the bands: red, white, blue.
  m.loft(ring(R - 0.05), 0.55, ring(R), 1.1, { tex: 'speeder-grille', top: false, bottom: false });
  m.prism(ring(R), 1.1, 1.2, { tex: 'ware-red', top: false, bottom: false });
  m.prism(ring(R), 1.2, 1.3, { ...WHITE, top: false, bottom: false });
  m.prism(ring(R), 1.3, 1.4, { tex: 'ware-blue', top: false, bottom: false });
  // The dome, in four courses to its top.
  const course = [[R, 1.4], [R * 0.95, 1.8], [R * 0.8, 2.2], [R * 0.52, 2.55], [R * 0.12, POD.h]];
  for (let i = 0; i < course.length - 1; i++) {
    const [[r0, z0], [r1, z1]] = [course[i], course[i + 1]];
    m.loft(ring(r0), z0, ring(r1), z1, { ...WHITE, bottom: false, top: i === course.length - 2 ? WHITE : false });
  }
  // The window: a round blue lens in a white rim, bulging out of the dome's
  // side (east at angle 0).
  m.cylinder([R * 0.85, 0, 1.95], 0.42, 0.22, { ...WHITE, axis: 'x', segments: 10, bottom: false, top: { color: [70, 96, 170] } });
  m.cylinder([R * 0.85 + 0.22, 0, 1.95], 0.34, 0.05, { color: [52, 74, 150], axis: 'x', segments: 10, bottom: false });
  return m.build();
}

export default [pod()];
