import { ModelBuilder } from './lib/build.js';

// Mos Eisley's domes: the toppers on its roofs. A plaster dome on a short
// drum, over a lip a little wider than the drum, as on the film's houses.
// Not taller: a full half-sphere on a tall drum read as a tall bump rather
// than a bigger dome (Mark, 2026-11-03).
// Built at size rather than scaled, so the plaster keeps the walls' texel
// size: one per width (3 to 11 tiles across) in each plaster.
// The town kit picks the widest that fits a roof (lib/town.js).

/** How high a dome rises for its radius, over its lip and drum. */
const RISE = 0.9;
const LIP = 0.3;
/** The drum's height for a dome of radius `r` (inside the lip). */
const drumOf = (r) => Math.min(0.5, r * 0.15);

function dome(id, radius, tex) {
  const m = new ModelBuilder(id);
  const sides = radius >= 3 ? 16 : 12;
  const ring = (r) => Array.from({ length: sides }, (_, i) => [Math.cos((i / sides) * Math.PI * 2) * r, Math.sin((i / sides) * Math.PI * 2) * r]);
  const r = radius - 0.25;
  const drum = drumOf(r);
  m.prism(ring(radius), 0, LIP, { tex, bottom: false });
  m.prism(ring(r), LIP, LIP + drum, { tex, bottom: false, top: false });
  const bands = radius >= 3 ? 6 : 5;
  for (let k = 0; k < bands; k++) {
    const a0 = (k / bands) * (Math.PI / 2) * 0.92;
    const a1 = ((k + 1) / bands) * (Math.PI / 2) * 0.92;
    m.loft(ring(r * Math.cos(a0)), LIP + drum + r * RISE * Math.sin(a0), ring(r * Math.cos(a1)), LIP + drum + r * RISE * Math.sin(a1), {
      tex,
      bottom: false,
      top: k === bands - 1 ? undefined : false,
    });
  }
  return m.build();
}

/** The plasters domes come in, by the suffix on their ids. */
export const PLASTERS = { '': 'adobe', '-pale': 'adobe-pale', '-ochre': 'adobe-ochre', '-rose': 'adobe-rose', '-grey': 'adobe-grey' };

/** Every dome: `id` (`dome-<width>`, then its plaster's suffix), `radius`, `height` and `tex`, widest first. */
export const DOMES = [];
for (let width = 11; width >= 3; width--) {
  const radius = width / 2;
  const r = radius - 0.25;
  const height = LIP + drumOf(r) + r * RISE;
  for (const [suffix, tex] of Object.entries(PLASTERS)) {
    DOMES.push({ id: `dome-${width}${suffix}`, radius, height: Math.round(height * 100) / 100, tex });
  }
}

/**
 * A dome fallen in (the old quarter, levels/m1.js): its crown gone and a
 * ragged hole torn down one side, the plaster drawn on both faces so you
 * see its inside through the hole. `cut` gives, for each of its 16 sides,
 * how many of its 6 bands still stand.
 */
function brokenDome(id, radius, tex, cut) {
  const m = new ModelBuilder(id);
  const sides = 16;
  const ring = (r) => Array.from({ length: sides }, (_, i) => [Math.cos((i / sides) * Math.PI * 2) * r, Math.sin((i / sides) * Math.PI * 2) * r]);
  const r = radius - 0.25;
  const drum = drumOf(r);
  m.prism(ring(radius), 0, LIP, { tex, bottom: false });
  m.prism(ring(r), LIP, LIP + drum, { tex, bottom: false, top: false });
  const bands = 6;
  const at = (k) => (k / bands) * (Math.PI / 2) * 0.92;
  const pt = (i, a) => {
    const [x, y] = ring(r * Math.cos(a))[i % sides];
    return [x, y, LIP + drum + r * RISE * Math.sin(a)];
  };
  for (let i = 0; i < sides; i++) {
    for (let k = 0; k < cut[i]; k++) {
      m.face([pt(i, at(k)), pt(i + 1, at(k)), pt(i + 1, at(k + 1)), pt(i, at(k + 1))], { tex, twoSided: true }, [0, 0, 0]);
    }
  }
  return m.build();
}

/** The fallen-in domes: `id`, `radius`, `height` (as it stood) and `tex`. */
export const BROKEN_DOMES = [{ id: 'dome-broken-7-grey', radius: 3.5, tex: 'adobe-grey', cut: [6, 6, 6, 5, 4, 2, 1, 1, 0, 1, 2, 2, 4, 5, 6, 6] }].map((d) => {
  const r = d.radius - 0.25;
  return { ...d, height: Math.round((LIP + drumOf(r) + r * RISE) * 100) / 100 };
});

export default [...DOMES.map((d) => dome(d.id, d.radius, d.tex)), ...BROKEN_DOMES.map((d) => brokenDome(d.id, d.radius, d.tex, d.cut))];
