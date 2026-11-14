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
//
// `ds-holo-table`: the control room's round plotting table, its top a
// projector ring; `ds-holo-ship` is what it shows over it (placed at
// HOLO.over): the captured freighter, a ship drawn in lines of blue
// light, turning slowly (decor.js spins it).
//
// `ds-holo-station`: what the briefing room's table shows: a sphere drawn
// in lines of blue light, HOLO_STATION.r across its radius, its rings of
// latitude and meridians, a dish in its northern half, and the half of it
// that isn't built yet left open (only the meridians there). Placed with
// its middle at its `z`; decor.js turns it.
//
// `ds-door-panel`: the control beside a door: a slim box on the wall (the
// origin on the wall's face), a lit readout and three buttons.
//
// `ds-panel-hoisted`: one wall panel (2 by 1, standing on its long edge
// along y) on its way up to the truss, a lifting eye at each top corner
// (the hoist's cables are hangings, from PANEL.eye).
//
// `ds-locker-bank`: four troopers' lockers against a wall (the origin on
// the wall's face, +x out of it), LOCKERS.width along it. `ds-bench`: a
// steel bench, BENCH.length along y.
//
// `ds-pipe-run-<len>`: three pipes along a tunnel's ceiling, `len` long
// along y and centred on the origin (placed at the ceiling: they hang
// below it), on a hanger every 2.
//
// `ds-bunk`: a cell's bunk, a slab hinged out of the back wall on two
// chains (the origin on the wall's face, +x out of it).

/** The service stand's deck height and its half sizes. */
export const SERVICE = { deck: 5.4, half: [0.8, 0.7] };
/** Where the welding stand's sparks fly from (its own frame). */
export const WELD = [0.95, 0, SERVICE.deck + 0.4];
/** The tool cart's top. */
export const CART = { top: 1 };
/** The plotting table's radius and top, and the hologram's height over the floor. */
export const HOLO = { r: 0.95, top: 1, over: 1.35 };
/** The station hologram's radius. */
export const HOLO_STATION = { r: 0.75 };
/** The hoisted panel's half length and height, and its lifting eyes (y, z). */
export const PANEL = { half: 1, tall: 2, eye: [0.85, 2.1] };
/** The locker bank's width along the wall, depth and height. */
export const LOCKERS = { width: 2.4, depth: 0.5, tall: 2.1 };
/** A bench's length and top. */
export const BENCH = { length: 2.4, top: 0.5 };
/** The pipe runs' lengths. */
export const PIPE_RUNS = [12, 18];
/** A bunk's depth out of the wall, length and top. */
export const BUNK = { depth: 0.9, length: 2.4, top: 0.95 };

const METAL = { tex: 'ds-metal' };
const IRON = { tex: 'ds-metal-dark' };
const DARK = { tex: 'ds-wall-dark' };
const STRIPE = { tex: 'imp-stripe' };
const GRATE = { tex: 'ds-floor-grate' };
const RED = { tex: 'ds-lamp-red', glow: true };
const AMBER = { tex: 'ds-lamp', glow: true };
const HOLO_BLUE = { color: [96, 176, 255], glow: true, twoSided: true };

/** A square of half-width h round (cx, cy). */
const sq = (cx, cy, h) => [[cx - h, cy - h], [cx + h, cy - h], [cx + h, cy + h], [cx - h, cy + h]];
/**
 * A line of light from a to b: two crossed ribbons `h` either side of it,
 * two-sided (two faces, where a strut would take four).
 */
function ribbon(m, a, b, h, style) {
  const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const cross = (u, v) => [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  const unit = (v) => {
    const l = Math.hypot(...v) || 1;
    return v.map((x) => (x / l) * h);
  };
  const p = unit(Math.abs(d[2]) > Math.hypot(d[0], d[1]) ? cross(d, [1, 0, 0]) : cross(d, [0, 0, 1]));
  const q = unit(cross(d, p));
  const mid = a.map((v, i) => (v + b[i]) / 2);
  for (const o of [p, q]) m.face([a.map((v, i) => v + o[i]), b.map((v, i) => v + o[i]), b.map((v, i) => v - o[i]), a.map((v, i) => v - o[i])], style, mid.map((v, i) => v + (o === p ? q : p)[i]));
}
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
  const rungs = Math.round(D * 2.4);
  for (let k = 1; k < rungs; k++) {
    const t = k / rungs;
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

function holoTable() {
  const m = new ModelBuilder('ds-holo-table');
  const { r, top } = HOLO;
  // A flared foot, the column, the top's dark rim and the projector's lit ring.
  m.cylinder([0, 0, 0], r * 0.7, 0.15, { segments: 12, ...IRON, bottom: false });
  m.cylinder([0, 0, 0.15], r * 0.4, top - 0.3, { segments: 12, ...DARK, top: false, bottom: false });
  m.cylinder([0, 0, top - 0.15], r, 0.15, { segments: 12, ...IRON });
  m.cylinder([0, 0, top], r * 0.75, 0.01, { segments: 12, ...HOLO_BLUE, twoSided: false, bottom: false });
  m.cylinder([0, 0, top + 0.01], r * 0.55, 0.01, { segments: 12, ...METAL, bottom: false });
  return m.build();
}

function holoShip() {
  const m = new ModelBuilder('ds-holo-ship');
  // A long flat hull, the cockpit forward, two engines aft: its edges in
  // thin lines of light, so the table shows through.
  const line = (a, b) => strut(m, a, b, 0.012, HOLO_BLUE);
  const deck = [[0.7, 0], [0.35, -0.22], [-0.45, -0.3], [-0.6, -0.15], [-0.6, 0.15], [-0.45, 0.3], [0.35, 0.22]];
  for (const z of [0, 0.12]) deck.forEach((p, i) => line([...p, z], [...deck[(i + 1) % deck.length], z]));
  for (const p of deck) line([...p, 0], [...p, 0.12]);
  // The cockpit's bubble and the engines' rings.
  line([0.35, -0.08, 0.12], [0.5, 0, 0.22]);
  line([0.35, 0.08, 0.12], [0.5, 0, 0.22]);
  line([0.5, 0, 0.22], [0.7, 0, 0.12]);
  for (const s of [-1, 1]) {
    line([-0.6, s * 0.18, 0.06], [-0.75, s * 0.18, 0.06]);
    line([-0.75, s * 0.1, 0.06], [-0.75, s * 0.26, 0.06]);
  }
  return m.build();
}

function holoStation() {
  const m = new ModelBuilder('ds-holo-station');
  const R = HOLO_STATION.r;
  const line = (a, b) => ribbon(m, a, b, 0.01, HOLO_BLUE);
  const at = (lat, lon) => [R * Math.cos(lat) * Math.cos(lon), R * Math.cos(lat) * Math.sin(lon), R * Math.sin(lat)];
  const N = 16;
  // Meridians all round; the rings of latitude only on the built half
  // (and the equator's trench all round).
  for (let k = 0; k < 8; k++) {
    const lon = (k * Math.PI) / 4;
    for (let j = 0; j < 8; j++) line(at(-Math.PI / 2 + (j * Math.PI) / 8, lon), at(-Math.PI / 2 + ((j + 1) * Math.PI) / 8, lon));
  }
  for (const lat of [-0.9, -0.5, 0, 0.5, 0.9]) {
    const half = lat !== 0;
    for (let k = 0; k < N; k++) {
      if (half && k >= N / 2 + 2) continue;
      line(at(lat, (k * 2 * Math.PI) / N), at(lat, ((k + 1) * 2 * Math.PI) / N));
    }
  }
  // The dish: a small ring set into the northern half, on the built side.
  const dl = 0.55;
  const dlon = Math.PI / 4;
  const c = at(dl, dlon);
  const n = c.map((v) => v / R);
  const u = [-Math.sin(dlon), Math.cos(dlon), 0];
  const w = [n[1] * u[2] - n[2] * u[1], n[2] * u[0] - n[0] * u[2], n[0] * u[1] - n[1] * u[0]];
  const ring = [];
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4;
    ring.push([0, 1, 2].map((i) => c[i] + (u[i] * Math.cos(a) + w[i] * Math.sin(a)) * 0.2));
  }
  ring.forEach((p, k) => line(p, ring[(k + 1) % 8]));
  return m.build();
}

function doorPanel() {
  const m = new ModelBuilder('ds-door-panel');
  m.box([0, -0.22, 1.0], [0.08, 0.22, 1.75], { ...DARK, bottom: false });
  m.face([[0.081, -0.16, 1.68], [0.081, 0.16, 1.68], [0.081, 0.16, 1.48], [0.081, -0.16, 1.48]], { tex: 'ds-screen', uv: [[0, 0], [0.5, 0], [0.5, 0.33], [0, 0.33]], glow: true }, [0, 0, 1.5]);
  m.box([0.08, -0.15, 1.18], [0.11, -0.05, 1.28], RED);
  m.box([0.08, 0.05, 1.18], [0.11, 0.15, 1.28], AMBER);
  m.box([0.08, -0.05, 1.32], [0.11, 0.05, 1.4], METAL);
  return m.build();
}

function panelHoisted() {
  const m = new ModelBuilder('ds-panel-hoisted');
  const { half: l, tall: h } = PANEL;
  m.box([-0.05, -l, 0], [0.05, l, h], { ...IRON, sides: { tex: 'ds-wall', uv: [[0, 0], [1, 0], [1, 1], [0, 1]] } });
  for (const s of [-1, 1]) m.box([-0.03, s * PANEL.eye[0] - 0.05, h], [0.03, s * PANEL.eye[0] + 0.05, PANEL.eye[1]], METAL);
  return m.build();
}

function lockerBank() {
  const m = new ModelBuilder('ds-locker-bank');
  const { width: w, depth: d, tall: h } = LOCKERS;
  m.box([0, -w / 2, 0], [d, w / 2, h], { ...METAL, bottom: false });
  // The doors' seams, a vent at the top of each and a handle; a kick plate.
  const door = w / 4;
  for (let k = 0; k < 4; k++) {
    const y0 = -w / 2 + k * door;
    m.box([d, y0 - 0.01, 0.1], [d + 0.01, y0 + 0.01, h - 0.05], IRON);
    for (const z of [h - 0.35, h - 0.28, h - 0.21]) m.box([d, y0 + 0.12, z], [d + 0.012, y0 + door - 0.12, z + 0.03], IRON);
    m.box([d, y0 + door - 0.12, 1.0], [d + 0.04, y0 + door - 0.08, 1.2], DARK);
  }
  m.box([0, -w / 2, 0], [d + 0.02, w / 2, 0.1], DARK);
  m.outlineLines([[0, -w / 2], [d, -w / 2], [d, w / 2], [0, w / 2]]);
  return m.build();
}

function bench() {
  const m = new ModelBuilder('ds-bench');
  const { length: l, top } = BENCH;
  m.box([-0.22, -l / 2, top - 0.06], [0.22, l / 2, top], METAL);
  for (const s of [-1, 1]) m.box([-0.18, s * (l / 2 - 0.3) - 0.04, 0], [0.18, s * (l / 2 - 0.3) + 0.04, top - 0.06], { ...IRON, bottom: false, top: false });
  return m.build();
}

function pipeRun(len) {
  const m = new ModelBuilder(`ds-pipe-run-${len}`);
  // Two thin pipes and a fat one, each lagged dark at its joints.
  for (const [x, r, style] of [[-0.45, 0.07, METAL], [-0.2, 0.07, IRON], [0.15, 0.14, METAL]]) {
    m.cylinder([x, -len / 2, -0.3], r, len, { axis: 'y', segments: 6, ...style, top: false, bottom: false });
    for (let y = -len / 2 + 1; y < len / 2; y += 3) m.cylinder([x, y - 0.1, -0.3], r + 0.025, 0.2, { axis: 'y', segments: 6, ...DARK });
  }
  // Hangers: a strap down from the ceiling and a bar under the pipes.
  for (let y = -len / 2 + 0.5; y < len / 2; y += 2) {
    m.box([-0.6, y - 0.03, -0.47], [0.35, y + 0.03, -0.44], IRON);
    for (const x of [-0.6, 0.35]) m.box([x - 0.02, y - 0.03, -0.47], [x + 0.02, y + 0.03, 0], IRON);
  }
  return m.build();
}

function bunk() {
  const m = new ModelBuilder('ds-bunk');
  const { depth: d, length: l, top } = BUNK;
  m.box([0, -l / 2, top - 0.12], [d, l / 2, top], { ...IRON, top: DARK });
  // A thin pad on it, and the chains up to the wall.
  m.box([0.08, -l / 2 + 0.1, top], [d - 0.08, l / 2 - 0.1, top + 0.06], { tex: 'ds-console-side' });
  for (const s of [-1, 1]) strut(m, [d - 0.04, s * (l / 2 - 0.06), top], [0, s * (l / 2 - 0.06), top + 0.9], 0.012, METAL);
  return m.build();
}

export default [serviceStand(), fuelSocket(), beacon(), toolCart(), holoTable(), holoShip(), holoStation(), doorPanel(), panelHoisted(), lockerBank(), bench(), ...PIPE_RUNS.map(pipeRun), bunk()];
