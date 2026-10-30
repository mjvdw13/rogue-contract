import { ModelBuilder } from './lib/build.js';
import { PLASTERS } from './dome.js';

// Mos Eisley's round-topped arches (Mark's film stills, 2026-10-18).
//
// `arch-hood-<width>`: the deep hood that stands out from a wall round a
// door, taller than it: two legs and a half circle over them, in the
// wall's plaster. `width` is the opening inside it (3 or 4 tiles); the
// legs spring at HOOD.spring, so the top is at spring + width / 2 + band.
// Built looking south (+y): the wall's face at y 0, the origin on the
// floor at the hood's middle; the town kit turns it to face its wall.
//
// `arch-round-<width>`: rounds the top of a square opening (an `arch()`)
// of that width: the two corners under its lintel filled down to a half
// ellipse, ROUND.rise tall. A tile deep, behind its front face (y -1 to 0),
// the origin there where the curve springs from the sides; one a tile
// through. Its faces are `flat`, lit as walls are (by the light map in
// front of each, with the walls' contrast), so the faces flush with the wall
// match it and the curve under the opening reads as the plaster round it
// rather than in bands, one per segment.
// Each comes in the five plasters (`arch-hood-3-pale`, as the domes).

export const HOOD = { spring: 2.75, band: 0.45, depth: 0.45, widths: [3, 4] };
export const ROUND = { rise: 1.5, widths: [3, 4] };
const STEPS = 8; // segments round a hood's half circle
const CORNER = 6; // segments round each of a rounded opening's corners

export const ARCH_MODELS = [];
for (const [suffix, tex] of Object.entries(PLASTERS)) {
  for (const w of HOOD.widths) ARCH_MODELS.push({ id: `arch-hood-${w}${suffix}`, kind: 'hood', w, tex });
  for (const w of ROUND.widths) ARCH_MODELS.push({ id: `arch-round-${w}${suffix}`, kind: 'round', w, tex });
}

/** The top of a hood of inner width `w` over its floor. */
export const hoodTop = (w) => HOOD.spring + w / 2 + HOOD.band;

function hood(id, w, tex) {
  const m = new ModelBuilder(id);
  const s = { tex };
  const front = { tex, flat: true }; // lit as the wall it stands on
  const a = w / 2;
  const { spring, band: b, depth: d } = HOOD;
  // The legs: their backs against the wall, their feet on the floor and
  // their tops under the arch are hidden.
  for (const sign of [1, -1]) {
    const [x0, x1] = sign > 0 ? [a, a + b] : [-a - b, -a];
    m.box([x0, 0, 0], [x1, d, spring], { ...s, top: false, bottom: false, side: (i) => [false, s, front, s][i] });
    m.line(x0, 0, x0, d).line(x0, d, x1, d).line(x1, d, x1, 0);
  }
  // The half circle: a block a segment, its outer face, front and soffit
  // (the joints between segments and its back against the wall hidden).
  for (let k = 0; k < STEPS; k++) {
    const [t0, t1] = [(k / STEPS) * Math.PI, ((k + 1) / STEPS) * Math.PI];
    const at = (r, t) => [Math.cos(t) * r, spring + Math.sin(t) * r];
    const outline = [at(a, t0), at(a + b, t0), at(a + b, t1), at(a, t1)];
    m.prism(outline, 0, d, { ...s, axis: 'y', top: front, bottom: false, side: (i) => (i === 0 || i === 2 ? false : s) });
  }
  return m.build();
}

function round(id, w, tex) {
  const m = new ModelBuilder(id);
  const s = { tex };
  const front = { tex, flat: true }; // lit as the wall it stands on
  const a = w / 2;
  const v = ROUND.rise;
  // Each corner a fan of thin wedges from the square corner to the curve,
  // only the curve (the soffit) and the two faces showing.
  for (const sign of [1, -1]) {
    const corner = [sign * a, v];
    for (let k = 0; k < CORNER; k++) {
      const [t0, t1] = [(k / CORNER) * (Math.PI / 2), ((k + 1) / CORNER) * (Math.PI / 2)];
      const p0 = [sign * a * Math.cos(t0), v * Math.sin(t0)];
      const p1 = [sign * a * Math.cos(t1), v * Math.sin(t1)];
      m.prism([corner, p0, p1], -1, 0, { ...front, axis: 'y', top: front, bottom: front, side: (i) => (i === 1 ? front : false) });
    }
  }
  return m.build();
}

export default ARCH_MODELS.map((d) => (d.kind === 'hood' ? hood(d.id, d.w, d.tex) : round(d.id, d.w, d.tex)));
