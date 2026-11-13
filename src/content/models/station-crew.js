import { ModelBuilder } from './lib/build.js';

// The battle station's working gear (levels/m4.js): what the crews use,
// placed where they'd be using it. All face +x at angle 0, y to the right.
//
// `ds-service-stand`: a wheeled platform a tech climbs to reach a TIE's
// cockpit: a deck SERVICE.deck up on four legs, a ladder up its back (-x),
// rails along its sides, open at the front where the work is. The welding
// one (decor.js) spits sparks off its front edge.
//
// `ds-fuel-socket`: a fuel point on a wall (the origin on the wall's face,
// +x out of it): a striped box, a valve wheel and a lamp, a hose to a TIE.
//
// `ds-beacon`: a red warning lamp in a cage on a bracket (the origin on the
// wall's face): one each side of the hangar's mouth, blinking.
//
// `ds-tool-cart`: a tech's cart: a chest of drawers on casters, a tray on
// top with a few tools, a handle at the back (-x).

/** The service stand's deck height and its half sizes. */
export const SERVICE = { deck: 3.4, half: [0.8, 0.7] };
/** Where the welding stand's sparks fly from (its own frame). */
export const WELD = [0.95, 0, SERVICE.deck + 0.4];
/** The tool cart's top. */
export const CART = { top: 1 };

const METAL = { tex: 'ds-metal' };
const IRON = { tex: 'ds-metal-dark' };
const DARK = { tex: 'ds-wall-dark' };
const STRIPE = { tex: 'imp-stripe' };
const GRATE = { tex: 'ds-floor-grate' };
const RED = { tex: 'ds-lamp-red', glow: true };
const AMBER = { tex: 'ds-lamp', glow: true };

/** A square of half-width h round (cx, cy). */
const sq = (cx, cy, h) => [[cx - h, cy - h], [cx + h, cy - h], [cx + h, cy + h], [cx - h, cy + h]];
/** A strut of half-width h from a to b, square in plan. */
const strut = (m, [ax, ay, az], [bx, by, bz], h, style) => m.loft(sq(ax, ay, h), az, sq(bx, by, h), bz, { ...style, top: false, bottom: false });

function serviceStand() {
  const m = new ModelBuilder('ds-service-stand');
  const { deck: D, half: [a, b] } = SERVICE;
  // The base frame on four casters.
  for (const [x, y] of [[-a, -b], [a, -b], [a, b], [-a, b]]) m.box([x - 0.08, y - 0.08, 0], [x + 0.08, y + 0.08, 0.15], DARK);
  m.box([-a, -b, 0.15], [a, b, 0.3], { ...STRIPE, bottom: false });
  // Four legs up to the deck, braced across the sides.
  for (const [x, y] of [[-a, -b], [a, -b], [a, b], [-a, b]]) strut(m, [x * 0.92, y * 0.92, 0.3], [x * 0.92, y * 0.92, D - 0.1], 0.05, IRON);
  for (const s of [-1, 1]) strut(m, [-a * 0.92, s * b * 0.92, 0.3], [a * 0.92, s * b * 0.92, D - 0.1], 0.03, IRON);
  // The deck, a grating.
  m.box([-a, -b, D - 0.12], [a, b, D], { ...METAL, top: GRATE });
  // The ladder up its back.
  for (const s of [-1, 1]) strut(m, [-a - 0.9, s * 0.4, 0], [-a, s * 0.4, D], 0.035, METAL);
  for (let k = 1; k < 8; k++) {
    const t = k / 8;
    m.box([-a - 0.9 * (1 - t) - 0.06, -0.4, D * t - 0.03], [-a - 0.9 * (1 - t) + 0.06, 0.4, D * t], IRON);
  }
  // Rails along the sides, waist high over the deck.
  for (const s of [-1, 1]) {
    for (const x of [-a, a]) strut(m, [x * 0.95, s * b, D], [x * 0.95, s * b, D + 1], 0.03, METAL);
    m.box([-a, s * b - 0.03, D + 0.95], [a, s * b + 0.03, D + 1.02], STRIPE);
  }
  m.outlineLines([[-a - 0.9, -b], [a, -b], [a, b], [-a - 0.9, b]]);
  return m.build();
}

function fuelSocket() {
  const m = new ModelBuilder('ds-fuel-socket');
  // The box, striped, on the wall; a valve wheel on its front; its lamp.
  m.box([0, -0.45, 0.4], [0.25, 0.45, 1.5], { ...DARK, sides: STRIPE, bottom: false });
  m.cylinder([0.25, 0, 1.05], 0.05, 0.12, { axis: 'x', segments: 6, ...METAL });
  m.cylinder([0.37, 0, 1.05], 0.2, 0.04, { axis: 'x', segments: 8, ...IRON });
  m.box([0.25, 0.25, 1.3], [0.29, 0.38, 1.42], AMBER);
  // The hose's coupling, low on its front.
  m.cylinder([0.25, -0.25, 0.6], 0.09, 0.15, { axis: 'x', segments: 6, ...IRON });
  return m.build();
}

function beacon() {
  const m = new ModelBuilder('ds-beacon');
  // A bracket out of the wall, the lamp under a cage of four bars.
  m.box([0, -0.12, -0.08], [0.35, 0.12, 0.04], IRON);
  m.cylinder([0.35, 0, -0.38], 0.16, 0.3, { segments: 6, ...RED });
  for (let k = 0; k < 4; k++) {
    const t = (k * Math.PI) / 2 + Math.PI / 4;
    strut(m, [0.35 + Math.cos(t) * 0.2, Math.sin(t) * 0.2, -0.42], [0.35 + Math.cos(t) * 0.2, Math.sin(t) * 0.2, -0.04], 0.015, METAL);
  }
  m.cylinder([0.35, 0, -0.46], 0.2, 0.04, { segments: 6, ...IRON });
  return m.build();
}

function toolCart() {
  const m = new ModelBuilder('ds-tool-cart');
  const T = CART.top;
  for (const [x, y] of [[-0.4, -0.25], [0.4, -0.25], [0.4, 0.25], [-0.4, 0.25]]) m.box([x - 0.05, y - 0.05, 0], [x + 0.05, y + 0.05, 0.1], DARK);
  // The chest, its drawers' fronts as dark bands.
  m.box([-0.45, -0.3, 0.1], [0.45, 0.3, T - 0.1], { ...IRON, bottom: false });
  for (const z of [0.3, 0.5, 0.7]) m.box([-0.46, -0.31, z], [0.46, 0.31, z + 0.03], METAL);
  // The tray, a lip round it, and on it a driver, a meter and a spanner.
  m.box([-0.5, -0.33, T - 0.1], [0.5, 0.33, T - 0.06], METAL);
  for (const s of [-1, 1]) m.box([-0.5, s * 0.33 - 0.02, T - 0.06], [0.5, s * 0.33 + 0.02, T], METAL);
  m.box([-0.3, -0.15, T - 0.06], [-0.05, -0.05, T - 0.02], STRIPE);
  m.box([0.05, 0, T - 0.06], [0.3, 0.2, T + 0.04], DARK);
  m.box([0.1, 0.05, T + 0.04], [0.25, 0.15, T + 0.045], AMBER);
  strut(m, [-0.2, 0.15, T - 0.04], [0.0, 0.25, T - 0.04], 0.02, METAL);
  // The handle.
  for (const s of [-1, 1]) strut(m, [-0.45, s * 0.22, T - 0.2], [-0.62, s * 0.22, T + 0.1], 0.02, METAL);
  m.box([-0.65, -0.24, T + 0.08], [-0.6, 0.24, T + 0.13], METAL);
  return m.build();
}

export default [serviceStand(), fuelSocket(), beacon(), toolCart()];
