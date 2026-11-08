// The farm kit: a moisture farm's sunken pits, after the film's (Mark's
// reference images, docs/mission2.md "The look"). Run on a level painted
// with the town kit (lib/town.js), once the pits' doorways are dug.
//
//   town.circle(cx, cy, r, { inside: ..., wall: { wall: 'adobe-pale', wallTop: rim }, seam: 90 });
//   ... dig the doorways ...
//   pitWalls(p, cx, cy, r, { floorZ, wash: 4.5 });

import { valueNoise } from './noise.js';

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
 * counter-clockwise), top, width }.
 */
export function pitWalls(p, cx, cy, r, { floorZ, wash, wave = 0.6, over = 1, dado = 1, seed = 1 }) {
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

/** The signed difference a - b of two angles, in -PI..PI. */
const angleDiff = (a, b) => ((((a - b + Math.PI) % TAU) + TAU) % TAU) - Math.PI;
const mix = (a, b, t) => a + (b - a) * t;
