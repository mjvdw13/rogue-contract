import { ModelBuilder } from './lib/build.js';

// Droids the Jawas have for sale in the junk yard (levels/m1.js): standing
// still, switched off. An astromech, a drum of a body on two side legs and
// a short middle one, its dome on top, in three paint jobs; and a power
// droid, a box walking on two stubby legs. About as tall as a Jawa. Each is
// listed in DROIDS with its decoration's size. The origin on the floor under
// the droid's middle; at angle 0 it faces east.

/** A ring of `n` points of radius `r` (x, y), turned by `turn` radians. */
const ring = (n, r, turn = 0) => Array.from({ length: n }, (_, i) => [Math.cos(turn + (i / n) * Math.PI * 2) * r, Math.sin(turn + (i / n) * Math.PI * 2) * r]);

const LEG = { tex: 'metal-grey', texScale: 0.5 };
const DARK = { color: [34, 30, 28] };

/**
 * An astromech: `body` the drum's paint, `trim` the panels round its top
 * and on its legs, `dome` the dome's.
 */
function astromech(id, { body, trim, dome }) {
  const m = new ModelBuilder(id);
  const r = 0.32;
  const [b0, b1] = [0.22, 0.92];
  // The drum, a band of trim panels round its top, and a dark vent low on its front.
  m.cylinder([0, 0, b0], r, b1 - b0 - 0.16, { segments: 8, turn: Math.PI / 8, tex: body, texScale: 0.3, top: false, bottom: DARK });
  m.cylinder([0, 0, b1 - 0.16], r, 0.16, { segments: 8, turn: Math.PI / 8, tex: trim, texScale: 0.3, top: false, bottom: false });
  m.box([r - 0.01, -0.1, 0.32], [r + 0.03, 0.1, 0.5], DARK);
  // The dome, in rings, and its eye.
  const tiers = [[b1, 0.32], [b1 + 0.13, 0.3], [b1 + 0.22, 0.23], [b1 + 0.3, 0.1]];
  for (let i = 0; i + 1 < tiers.length; i++) {
    const [z0, r0] = tiers[i];
    const [z1, r1] = tiers[i + 1];
    m.loft(ring(8, r0, Math.PI / 8), z0, ring(8, r1, Math.PI / 8), z1, {
      tex: dome,
      texScale: 0.3,
      bottom: false,
      top: i === tiers.length - 2 ? undefined : false,
      side: (k) => (i === 1 && k % 2 === 0 ? { tex: trim } : undefined),
    });
  }
  m.box([0.27, -0.05, b1 + 0.08], [0.31, 0.05, b1 + 0.15], DARK);
  // The side legs from the shoulders to their feet, and the middle leg.
  for (const s of [-1, 1]) {
    const [y0, y1] = s < 0 ? [-r - 0.12, -r] : [r, r + 0.12];
    m.prism([[-0.1, b1 - 0.05], [0.1, b1 - 0.05], [0.12, 0.15], [-0.12, 0.15]], y0, y1, { ...LEG, axis: 'y', sides: { tex: trim } });
    m.box([-0.2, y0 - 0.02, 0], [0.2, y1 + 0.02, 0.15], LEG);
  }
  m.box([-0.08, -0.08, 0], [0.08, 0.08, b0], LEG);
  m.outlineLines(ring(6, r + 0.12));
  return m.build();
}

/** A power droid: a box body, a grey band round its middle, on two stubby legs. */
function powerDroid(id, body) {
  const m = new ModelBuilder(id);
  const [w, d] = [0.34, 0.28];
  m.box([-d, -w, 0.3], [d, w, 1.05], { tex: body, texScale: 0.4, bottom: DARK });
  m.box([-d - 0.03, -w - 0.03, 0.6], [d + 0.03, w + 0.03, 0.7], { ...LEG, top: false, bottom: false });
  // A dark slot for its eye and a vent on its front, a lamp on its top.
  m.box([d - 0.01, -0.18, 0.85], [d + 0.02, 0.18, 0.92], DARK);
  m.box([d - 0.01, -0.12, 0.4], [d + 0.02, 0.12, 0.52], DARK);
  m.cylinder([-0.08, 0.15, 1.05], 0.06, 0.08, { segments: 6, color: [70, 64, 58] });
  for (const s of [-1, 1]) {
    m.box([-0.1, s * 0.2 - 0.07, 0.08], [0.1, s * 0.2 + 0.07, 0.3], LEG);
    m.box([-0.18, s * 0.2 - 0.1, 0], [0.18, s * 0.2 + 0.1, 0.08], LEG);
  }
  m.outlineLines([[-d, -w], [d, -w], [d, w], [-d, w]]);
  return m.build();
}

/** The droids: model, and their decorations' `radius` and `height`. All solid. */
export const DROIDS = {
  'astromech-blue': { model: () => astromech('astromech-blue', { body: 'dome-white', trim: 'dome-blue', dome: 'dome-white' }), radius: 0.45, height: 1.22 },
  'astromech-red': { model: () => astromech('astromech-red', { body: 'dome-white', trim: 'ware-red', dome: 'dome-white' }), radius: 0.45, height: 1.22 },
  'astromech-rust': { model: () => astromech('astromech-rust', { body: 'metal-rust', trim: 'metal-grey', dome: 'dome-white' }), radius: 0.45, height: 1.22 },
  'power-droid': { model: () => powerDroid('power-droid', 'metal-grey'), radius: 0.45, height: 1.1 },
  'power-droid-rust': { model: () => powerDroid('power-droid-rust', 'drum-rust'), radius: 0.45, height: 1.1 },
};

export default Object.values(DROIDS).map((d) => d.model());
