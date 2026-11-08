// The farm kit: a moisture farm's sunken pits, after the film's (Mark's
// reference images, docs/mission2.md "The look"). Run on a level painted
// with the town kit (lib/town.js), once the pits' doorways are dug.
//
//   town.circle(cx, cy, r, { inside: ..., wall: { wall: 'adobe-pale', wallTop: rim }, seam: 90 });
//   ... dig the doorways ...
//   pitWalls(p, cx, cy, r, { floorZ, wash: 4.5 });

import { valueNoise } from './noise.js';
import { HOOD, ROUND, hoodTop } from '../../models/arch.js';

const TAU = Math.PI * 2;

/**
 * A pit's walls in two tones: bare earth above (`pit-earth`, its runnels
 * running down), whitewashed plaster below up to `wash` over the floor, its
 * top edge wavy (`pit-wash-edge`, a tile tall, see-through above its line),
 * and a red-ochre dado along the foot (`pit-dado`, `dado` tall). The
 * whitewash's line wanders up and down by `wave` round the pit, and rises
 * in a bulge over each doorway (a dug tile through the wall whose slab's
 * underside is its lintel) to `over` above the lintel, so it is never a
 * straight line round the pit. The wall's angled tiles, the ground beside
 * the floor's edge, and the wall over each doorway (its slab's edge) all
 * take the bands. Returns the doorways found: { angle (radians, 0 east,
 * counter-clockwise), top, width }. `blind` adds doors with nothing behind
 * them (`blindDoor()`'s): { angle (degrees), top, width }.
 */
export function pitWalls(p, cx, cy, r, { floorZ, wash, wave = 0.6, over = 1, dado = 1, seed = 1, blind = [] }) {
  const near = (x, y) => Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
  const angleOf = (x, y) => Math.atan2(cy - (y + 0.5), x + 0.5 - cx);
  const x0 = Math.floor(cx - r) - 2;
  const y0 = Math.floor(cy - r) - 2;
  const x1 = Math.ceil(cx + r) + 2;
  const y1 = Math.ceil(cy + r) + 2;
  // The doorways: dug tiles in the wall's ring whose floor is in the pit
  // (its floor or a stair's), grouped by their lintel.
  const doors = [];
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const c = p.get(x, y);
      const d = near(x, y);
      if (!c?.slab || d < r - 1.5 || d > r + 1.5 || c.floorZ > c.slab.bottom) continue;
      const a = angleOf(x, y);
      const g = doors.find((o) => o.top === c.slab.bottom && Math.abs(angleDiff(o.angle, a)) * r < 6);
      if (g) g.tiles.push(a);
      else doors.push({ angle: a, top: c.slab.bottom, tiles: [a] });
    }
  }
  for (const o of doors) {
    const ref = o.tiles[0];
    const offs = o.tiles.map((a) => angleDiff(a, ref));
    const lo = Math.min(...offs);
    const hi = Math.max(...offs);
    o.angle = ref + (lo + hi) / 2;
    o.width = (hi - lo) * r + 1;
    delete o.tiles;
  }
  for (const b of blind) doors.push({ angle: (b.angle * Math.PI) / 180, top: b.top, width: b.width });
  // The whitewash's top at a point round the wall: a wander along the arc
  // (repeating once round), lifted over the doorways in a smooth bulge.
  const around = TAU * r;
  const line = (a) => {
    const s = (((a % TAU) + TAU) % TAU) * r;
    const n = mix(valueNoise(s, 0, 5, seed), valueNoise(s - around, 0, 5, seed), s / around);
    let z = floorZ + wash + wave * (2 * n - 1);
    for (const o of doors) {
      const off = Math.abs(angleDiff(a, o.angle)) * r;
      const reach = o.width / 2 + 2.5;
      if (off >= reach) continue;
      const t = 0.5 + 0.5 * Math.cos((Math.PI * off) / reach);
      z = Math.max(z, z + t * (o.top + over - z));
    }
    return Math.round(z * 32) / 32;
  };
  const bands = (a) => {
    const top = line(a);
    return [
      { to: floorZ + dado, tex: 'pit-dado' },
      { from: top - 1, to: top, tex: 'pit-wash-edge' },
      { to: top - 1, tex: 'adobe-pale' },
    ];
  };
  const pitFloor = (c) => c && !c.wall && !c.slab && c.floorZ !== undefined && c.floorZ < floorZ + wash;
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const c = p.get(x, y);
      if (!c) continue;
      const d = near(x, y);
      if (d < r - 1.5 || d > r + 1.5) continue;
      const a = angleOf(x, y);
      if (c.line && c.wallTop !== undefined && c.floorZ <= floorZ + 0.01) {
        // An angled tile of the wall.
        p.set(x, y, { ...c, wall: 'pit-earth', bands: bands(a) });
      } else if (c.slab && c.floorZ <= c.slab.bottom && doors.length) {
        // A doorway: the wall over it is its slab's edge.
        p.set(x, y, { ...c, slab: { ...c.slab, side: 'pit-earth' }, bands: bands(a) });
      } else if (!c.wall && !c.slab && c.floorZ > floorZ + wash && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => pitFloor(p.get(x + dx, y + dy)) && near(x + dx, y + dy) < d)) {
        // The ground beside the floor's edge, where the wall's face is its raised floor's.
        p.set(x, y, { ...c, side: 'pit-earth', bands: bands(a) });
      }
    }
  }
  return doors;
}

/** The model's turn for a thing looking `face` (built looking south). */
const TURN = { S: 0, E: 90, N: 180, W: 270 };

/**
 * A round-topped doorway through a pit's wall, after the film's: the dug
 * box (x0, y0, x1, y1, 3 or 4 tiles across) looking `face` into the pit,
 * its lintel `lintel` over `floorZ` (at least ROUND.rise + 1.8), its top
 * corners rounded (`arch-round-*` a tile each through it), and the thick
 * hood round it standing out of the wall (`arch-hood-*-deep`, whose back
 * reaches into the curving wall). Things go into `things`.
 */
export function pitDoorway(things, x0, y0, x1, y1, face, { floorZ, lintel, plaster = '-pale' }) {
  const ns = face === 'N' || face === 'S';
  const width = ns ? x1 - x0 : y1 - y0;
  if (!ROUND.widths.includes(width) || !HOOD.widths.includes(width)) throw new Error(`Farm: a doorway at (${x0}, ${y0}) is ${width} wide; there are arches ${ROUND.widths.join(' and ')} wide`);
  if (lintel - ROUND.rise < 1.8) throw new Error(`Farm: a doorway at (${x0}, ${y0}) needs its lintel at least ${1.8 + ROUND.rise} up`);
  const out = face === 'S' || face === 'E' ? 1 : -1;
  const [lo, hi] = ns ? [y0, y1] : [x0, x1];
  const front = out > 0 ? hi : lo;
  const mid = ns ? (x0 + x1) / 2 : (y0 + y1) / 2;
  const angle = TURN[face];
  for (let k = 0; k < hi - lo; k++) {
    const edge = front - out * k;
    things.push({ type: `arch-round-${width}${plaster}`, ...(ns ? { x: mid, y: edge } : { x: edge, y: mid }), z: floorZ + lintel - ROUND.rise, angle });
  }
  const at = front + out * 0.01;
  things.push({ type: `arch-hood-${width}${plaster}-deep`, ...(ns ? { x: mid, y: at } : { x: at, y: mid }), z: floorZ, angle });
}

/**
 * A blind door on a pit's wall (nothing behind it, so it never opens): a
 * plank door's picture (`door-planks`, 3 tiles by 4, round-topped) on the
 * curve at `angle` degrees round from the centre (0 east, counter-clockwise),
 * in a deep hood 3 wide. Decals go into `decals`, the hood into `things`.
 * Returns it for `pitWalls()`'s `blind`, so the whitewash rises over it.
 */
export function blindDoor(things, decals, cx, cy, r, angle, { floorZ, plaster = '-pale', tex = 'door-planks' }) {
  const a = (angle * Math.PI) / 180;
  const [ux, uy] = [Math.cos(a), -Math.sin(a)];
  const round = (v) => Math.round(v * 1000) / 1000;
  // The decal on the wall, a hair inside its line; the hood's face on the
  // chord across the opening, where the curve is nearest the pit's middle.
  decals.push({ x: round(cx + ux * (r - 0.05)), y: round(cy + uy * (r - 0.05)), z: floorZ + 2, face: 'angled', tex });
  const chord = Math.sqrt(r * r - 1.5 * 1.5);
  things.push({ type: `arch-hood-3${plaster}-deep`, x: round(cx + ux * (chord - 0.01)), y: round(cy + uy * (chord - 0.01)), z: floorZ, angle: (((angle + 270) % 360) + 360) % 360 });
  return { angle, top: floorZ + hoodTop(3) - 1, width: 3 };
}

/** The signed difference a - b of two angles, in -PI..PI. */
const angleDiff = (a, b) => ((((a - b + Math.PI) % TAU) + TAU) % TAU) - Math.PI;
const mix = (a, b, t) => a + (b - a) * t;
