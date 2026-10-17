import { ModelBuilder } from './lib/build.js';

// Mos Eisley's domes: a plaster hemisphere on a low drum, set on a roof (or
// over a round building). Rings of 12 sides in five bands up to a small flat
// cap. Three sizes, built at size rather than scaled, so the plaster keeps
// the walls' texel size.
function dome(id, radius, tex) {
  const m = new ModelBuilder(id);
  const sides = 12;
  const ring = (r) => Array.from({ length: sides }, (_, i) => [Math.cos((i / sides) * Math.PI * 2) * r, Math.sin((i / sides) * Math.PI * 2) * r]);
  const drum = Math.min(0.5, radius * 0.15);
  m.prism(ring(radius), 0, drum, { tex, bottom: false, top: false });
  const bands = 5;
  for (let k = 0; k < bands; k++) {
    const a0 = (k / bands) * (Math.PI / 2) * 0.92;
    const a1 = ((k + 1) / bands) * (Math.PI / 2) * 0.92;
    m.loft(ring(radius * Math.cos(a0)), drum + radius * Math.sin(a0), ring(radius * Math.cos(a1)), drum + radius * Math.sin(a1), {
      tex,
      bottom: false,
      top: k === bands - 1 ? undefined : false,
    });
  }
  return m.build();
}

export const domeSmall = dome('dome-small', 1.5, 'adobe-pale');
export const domeMedium = dome('dome', 2.5, 'adobe-pale');
export const domeLarge = dome('dome-large', 4, 'adobe');
