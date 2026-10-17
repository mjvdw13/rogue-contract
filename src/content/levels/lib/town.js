// The town kit: Mos Eisley's buildings, doorways, round walls, awnings and
// the twin suns' shadows, painted with a Painter (painter.js). The reasons
// behind each piece are in docs/mission1.md ("How it's built").
//
//   const p = new Painter(208, 152, BLOCK);
//   const town = new Town(p, { sky: 24 });
//   p.rect(4, 64, 52, 76, town.street());
//   town.block(10, 56, 20, 64, { h: 6 });
//   town.arch(14, 63, 16, 64, { h: 6, lintel: 3 });
//   town.shadows();

/**
 * The suns, low in the south-west: content azimuth (degrees, 0 east,
 * counter-clockwise), elevation (degrees) and how much light each one's
 * shadow takes away.
 */
export const SUNS = [
  { az: 222, elev: 42, drop: 48 },
  { az: 238, elev: 50, drop: 32 },
];

export class Town {
  /**
   * @param {import('./painter.js').Painter} p
   * @param {{sky?:number, light?:number, wall?:string, roof?:string, floor?:string}} opts
   *   `sky`: the height of the open sky over walkable ground; `light`: sunlight.
   */
  constructor(p, { sky = 24, light = 216, wall = 'adobe', roof = 'adobe-roof', floor = 'street-sand' } = {}) {
    this.p = p;
    this.sky = sky;
    this.light = light;
    this.wall = wall;
    this.roof = roof;
    this.floor = floor;
  }

  /** Open ground in the sun at `floorZ`. */
  street(floorZ = 0, extra = {}) {
    return { floor: this.floor, ceiling: 'sky', floorZ, ceilZ: this.sky, light: this.light, side: this.wall, ...extra };
  }

  /**
   * A roof at `h`: a block of raised floor whose sides are the building's
   * walls. Out of reach (`walk` false), its sky sits just above it, so walls
   * behind it (the map's edge) stay low; a walkable roof gets the full sky.
   */
  roofCell({ h, wall = this.wall, roof = this.roof, walk = false, light = this.light, extra = {} }) {
    return { floor: roof, ceiling: 'sky', floorZ: h, ceilZ: walk ? this.sky : h + 0.25, light, side: wall, ...extra };
  }

  /** A building (or part of one) over a box: see `roofCell`. */
  block(x0, y0, x1, y1, opts) {
    this.p.rect(x0, y0, x1, y1, this.roofCell(opts));
    return this;
  }

  /**
   * A doorway or arch through a building's outside wall: open below
   * `lintel`, the wall over it up to the roof at `h` (a slab, so the street's
   * sky doesn't put a wall above the roofline). A door panel, if any, goes
   * a tile further in.
   */
  arch(x0, y0, x1, y1, { h, lintel = 3, floorZ = 0, wall = this.wall, roof = this.roof, floor = this.floor, light = 152, walk = false }) {
    const slab = { bottom: floorZ + lintel, top: h, floor: roof, ceiling: wall, side: wall, light };
    this.p.rect(x0, y0, x1, y1, { floor, ceiling: 'sky', floorZ, ceilZ: walk ? this.sky : h + 0.25, light: this.light, side: wall, slab });
    return this;
  }

  /**
   * A cloth awning (or any thin cover) over the open tiles of a box, at
   * `z`: you walk under it, in its shade (`light` below it).
   */
  awning(x0, y0, x1, y1, { z = 4.5, cloth = 'planks', light = 160 } = {}) {
    this.p.rect(x0, y0, x1, y1, (x, y, old) => {
      if (old.wall || old.door || old.slab || old.ceiling !== 'sky') return old;
      return { ...old, slab: { bottom: z, top: z + 0.125, floor: cloth, ceiling: cloth, side: cloth, light } };
    });
    return this;
  }

  /**
   * A round space or building: tiles inside the circle at (cx, cy) radius
   * `r` get `inside`, tiles outside it (within the box round it) `outside`
   * (leave it out to keep them), and tiles the circle crosses get an angled
   * wall along it, the open side's cell plus `wall` (say `{ wall: 'adobe',
   * ceilZ: 6 }`: under the sky, an angled wall stands as tall as its own
   * tile's ceiling). `open: 'in'` (a room, a pit) or `'out'` (a round
   * building, a pillar) says which side people walk on.
   */
  circle(cx, cy, r, { inside, outside, wall, open = 'in' }) {
    const p = this.p;
    for (let y = Math.floor(cy - r) - 1; y <= Math.ceil(cy + r); y++) {
      for (let x = Math.floor(cx - r) - 1; x <= Math.ceil(cx + r); x++) {
        const corners = [[x, y], [x + 1, y], [x + 1, y + 1], [x, y + 1]];
        const ins = corners.map(([u, v]) => Math.hypot(u - cx, v - cy) < r);
        const n = ins.filter(Boolean).length;
        const pts = n === 0 || n === 4 ? [] : crossings(corners, cx, cy, r);
        if (pts.length !== 2) {
          // Wholly on one side (or a corner just grazed): by its middle.
          const centreIn = Math.hypot(x + 0.5 - cx, y + 0.5 - cy) < r;
          if (centreIn) p.set(x, y, inside);
          else if (outside) p.set(x, y, outside);
          continue;
        }
        // Order the points so the solid side is on the right going from the
        // first to the second (y down): outward for a room, inward for a building.
        let [a, b] = pts;
        const mx = (a[0] + b[0]) / 2 - cx;
        const my = (a[1] + b[1]) / 2 - cy;
        const right = [-(b[1] - a[1]), b[0] - a[0]];
        const solidOut = open === 'in';
        if ((right[0] * mx + right[1] * my > 0) !== solidOut) [a, b] = [b, a];
        const base = open === 'in' ? inside : outside ?? p.get(x, y);
        const r4 = (v) => Math.round(v * 1000) / 1000;
        p.set(x, y, { ...base, ...wall, line: [r4(a[0] - x), r4(a[1] - y), r4(b[0] - x), r4(b[1] - y)] });
      }
    }
    return this;
  }

  /**
   * Shade the ground the buildings shadow from each sun: every open tile
   * under the sky (and every walkable top: a roof, an awning) loses each
   * sun's `drop` in proportion to how much of it that sun can't see,
   * sampled at four points per tile, so shadow edges come out soft. Run it
   * once everything is painted; tiles keep their own light as the sunlit one.
   */
  shadows(suns = SUNS) {
    const { p } = this;
    const { w, h } = p;
    const top = this._tops();
    const dirs = suns.map((s) => {
      const a = (s.az * Math.PI) / 180;
      return { dx: Math.cos(a), dy: -Math.sin(a), rise: Math.tan((s.elev * Math.PI) / 180), drop: s.drop };
    });
    let tallest = 0;
    for (const t of top) if (t > tallest && t < Infinity) tallest = t;
    const out = [];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const c = p.get(x, y);
        if ((c.wall && !c.line && !c.diagonal) || c.door || c.ceiling !== 'sky') continue;
        const z = c.slab ? c.slab.top : c.floorZ ?? 0;
        let drop = 0;
        for (const d of dirs) {
          const reach = (tallest - z) / d.rise;
          let hidden = 0;
          for (const [sx, sy] of SAMPLES) {
            for (let s = 0.4; s <= reach; s += 0.4) {
              const tx = Math.floor(x + sx + d.dx * s);
              const ty = Math.floor(y + sy + d.dy * s);
              if (tx < 0 || ty < 0 || tx >= w || ty >= h) break;
              // (Not its own tile: an angled wall's top is above its floor.)
              if ((tx !== x || ty !== y) && top[ty * w + tx] > z + s * d.rise) {
                hidden++;
                break;
              }
            }
          }
          drop += (d.drop * hidden) / SAMPLES.length;
        }
        if (drop > 0) out.push([x, y, { ...c, light: Math.round((c.light - drop) / 8) * 8 }]);
      }
    }
    for (const [x, y, c] of out) p.set(x, y, c);
    return this;
  }

  /** Each tile's top for shadows: ground, roofs and slabs by their height; walls, doors and interiors as tall as the highest open top beside them. */
  _tops() {
    const { p } = this;
    const { w, h } = p;
    const top = new Float32Array(w * h).fill(-Infinity);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const c = p.get(x, y);
        if (c.wall && (c.line || c.diagonal)) top[y * w + x] = c.ceilZ;
        else if (!c.wall && !c.door && c.ceiling === 'sky') top[y * w + x] = c.slab ? Math.max(c.slab.top, c.floorZ ?? 0) : c.floorZ ?? 0;
      }
    }
    // Indoors and walls: the roof round them, spreading in from the sky tiles.
    for (let pass = 0; pass < 8; pass++) {
      let changed = false;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = y * w + x;
          if (top[i] > -Infinity) continue;
          let best = -Infinity;
          if (x > 0) best = Math.max(best, top[i - 1]);
          if (x < w - 1) best = Math.max(best, top[i + 1]);
          if (y > 0) best = Math.max(best, top[i - w]);
          if (y < h - 1) best = Math.max(best, top[i + w]);
          if (best > -Infinity) {
            top[i] = best;
            changed = true;
          }
        }
      }
      if (!changed) break;
    }
    for (let i = 0; i < top.length; i++) if (top[i] === -Infinity) top[i] = 0;
    return top;
  }
}

const SAMPLES = [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]];

/** Where a circle crosses a tile's edges (its corners in order round it). */
function crossings(corners, cx, cy, r) {
  const pts = [];
  for (let k = 0; k < 4; k++) {
    const [ax, ay] = corners[k];
    const [bx, by] = corners[(k + 1) % 4];
    const dx = bx - ax;
    const dy = by - ay;
    // |a + t d - c|^2 = r^2
    const fx = ax - cx;
    const fy = ay - cy;
    const A = dx * dx + dy * dy;
    const B = 2 * (fx * dx + fy * dy);
    const C = fx * fx + fy * fy - r * r;
    const disc = B * B - 4 * A * C;
    if (disc < 0) continue;
    for (const sgn of [-1, 1]) {
      const t = (-B + sgn * Math.sqrt(disc)) / (2 * A);
      if (t > 1e-6 && t < 1 - 1e-6) pts.push([ax + t * dx, ay + t * dy]);
    }
  }
  return pts;
}
