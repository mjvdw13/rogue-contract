import { ModelBuilder } from './lib/build.js';

// Boulders for the canyon floor. Each is a lumpy outline lofted up in
// tiers, rounded like a weathered rock: every tier the one below shrunk and
// shifted, so the faces between them stay flat, and the facets catch the
// light at different angles. Rough stone (the DF rock textures have block
// seams, which made them read as masonry), the top paler. Solid, with
// collision lines round the widest tier.

/** Tiers going up: [height (0..1 of tall), scale, lean (0..1 of `lean`)]. */
const TIERS = [[0, 0.8, 0], [0.12, 0.97, 0.05], [0.4, 1, 0.3], [0.7, 0.82, 0.65], [0.9, 0.55, 0.9], [1, 0.25, 1]];

/** A boulder `wide` across and `tall` high; `lumps` sets the outline (radius factors, going round). */
function boulder(id, wide, tall, lumps, lean = [0.12, -0.08]) {
  const m = new ModelBuilder(id);
  const outline = lumps.map((k, i) => {
    const a = (i / lumps.length) * Math.PI * 2;
    return [Math.cos(a) * k * wide * 0.5, Math.sin(a) * k * wide * 0.5];
  });
  const tier = ([, scale, l]) => outline.map(([x, y]) => [x * scale + lean[0] * l * wide, y * scale + lean[1] * l * wide]);
  const rock = { tex: 'desert-gravel' };
  for (let i = 0; i + 1 < TIERS.length; i++) {
    const last = i + 2 === TIERS.length;
    m.loft(tier(TIERS[i]), TIERS[i][0] * tall, tier(TIERS[i + 1]), TIERS[i + 1][0] * tall, {
      ...rock,
      bottom: false,
      top: last ? { tex: 'sandstone-pale' } : false,
    });
  }
  m.outlineLines(tier(TIERS[2]));
  return m.build();
}

export const boulderLarge = boulder('boulder-large', 2.6, 1.8, [1, 0.86, 1.08, 0.94, 0.8, 1.05, 0.9, 1.02, 0.88]);
export const boulderSmall = boulder('boulder-small', 1.3, 0.8, [1, 0.8, 1.1, 0.9, 0.95, 0.85, 1.05], [-0.1, 0.1]);
