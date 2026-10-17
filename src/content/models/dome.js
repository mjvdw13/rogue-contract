import { ModelBuilder } from './lib/build.js';

// Mos Eisley's domes: the toppers on its roofs. A plaster dome on a short
// drum, over a lip a little wider than the drum, as on the film's houses.
// Built at size rather than scaled, so the plaster keeps the walls' texel
// size: one per width (3 to 11 tiles across) in each of the two plasters.
// The town kit picks the widest that fits a roof (lib/town.js).

/** How high a dome rises for its radius, over its lip and drum. */
const RISE = 0.9;
const LIP = 0.3;

function dome(id, radius, tex) {
  const m = new ModelBuilder(id);
  const sides = radius >= 3 ? 16 : 12;
  const ring = (r) => Array.from({ length: sides }, (_, i) => [Math.cos((i / sides) * Math.PI * 2) * r, Math.sin((i / sides) * Math.PI * 2) * r]);
  const r = radius - 0.25;
  const drum = Math.min(0.5, r * 0.15);
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

/** Every dome: `id` (`dome-<width>`, `-pale` in whitewash), `radius` and `height`, widest first. */
export const DOMES = [];
for (let width = 11; width >= 3; width--) {
  const radius = width / 2;
  const r = radius - 0.25;
  const height = LIP + Math.min(0.5, r * 0.15) + r * RISE;
  for (const [suffix, tex] of [['', 'adobe'], ['-pale', 'adobe-pale']]) {
    DOMES.push({ id: `dome-${width}${suffix}`, radius, height: Math.round(height * 100) / 100, tex });
  }
}

export default DOMES.map((d) => dome(d.id, d.radius, d.tex));
