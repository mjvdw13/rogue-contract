// The town kit: Mos Eisley's buildings, doorways, round walls, awnings and
// the twin suns' shadows, painted with a Painter (painter.js). The reasons
// behind each piece are in docs/mission1.md ("How it's built").
//
//   const p = new Painter(208, 152, BLOCK);
//   const town = new Town(p, { sky: 24 });
//   p.rect(4, 64, 52, 76, town.street());
//   town.block(10, 56, 20, 64, { h: 6 });
//   town.arch(14, 63, 16, 64, { h: 6, lintel: 3 });
//   town.house(24, 50, 36, 62, { h: 6, r: 2, dome: true });
//   town.door(30, 62, 'S', { h: 6, tex: 'door-teal' });
//   town.finish();
//   list.push(...town.things);  // the domes
//   decals: town.decals,        // the doors and windows

import { DOMES } from '../../models/dome.js';
import { valueNoise } from './noise.js';

/**
 * The suns, low in the south-west: content azimuth (degrees, 0 east,
 * counter-clockwise), elevation (degrees) and how much light each one's
 * shadow takes away.
 */
export const SUNS = [
  { az: 222, elev: 42, drop: 48 },
  { az: 238, elev: 50, drop: 32 },
];

/**
 * The feet of the buildings' walls: a band of `tex` up to height `to`. A
 * building picks one by name with `skirt` (or gives its own `{ tex, to }`,
 * or null for none), so they aren't all alike.
 */
export const SKIRTS = {
  // Dirt kicked up from the street, darker toward the ground.
  dirt: { tex: 'adobe-skirt', to: 1 },
  // A plinth of bare mud brick under the plaster.
  plinth: { tex: 'adobe-brick', to: 1.5 },
};

export class Town {
  /**
   * @param {import('./painter.js').Painter} p
   * @param {{sky?:number, light?:number, wall?:string, roof?:string, floor?:string}} opts
   *   `sky`: the height of the open sky over walkable ground; `light`: sunlight.
   *   `skirt`: the foot of a building's walls unless it says otherwise (see
   *   `SKIRTS`; null for none).
   */
  constructor(p, { sky = 24, light = 216, wall = 'adobe', roof = 'adobe-roof', floor = 'street-sand', skirt = 'dirt' } = {}) {
    this.p = p;
    this.sky = sky;
    this.light = light;
    this.wall = wall;
    this.roof = roof;
    this.floor = floor;
    this.skirt = skirt;
    /** Round props that cast shadows (domes): [x, y, radius, base, height]. */
    this.casters = [];
    /** Things the kit places (domes), for the level's list. */
    this.things = [];
    /** Decals the kit places (doors, windows), for the level's `decals`. */
    this.decals = [];
  }

  /**
   * A dome on a roof at `z`, centred on (x, y): the widest that's no more
   * than `width` tiles across (3 to 11), in plaster `wall` (any of the
   * domes' plasters, else plain 'adobe'). It casts a shadow. Keep it inside
   * its roof: one hanging over a lower roof is clipped.
   */
  dome(x, y, z, width, { wall = this.wall } = {}) {
    const tex = DOMES.some((o) => o.tex === wall) ? wall : 'adobe';
    const d = DOMES.find((o) => o.tex === tex && o.radius * 2 <= width);
    if (!d) return this;
    this.things.push({ type: d.id, x, y, z });
    return this.caster(x, y, d.radius, z, d.height);
  }

  /**
   * A round prop (a dome, `radius` across its base at `base`, rising
   * `height`) that casts a shadow like the buildings do.
   */
  caster(x, y, radius, base, height) {
    this.casters.push([x, y, radius, base, height]);
    return this;
  }

  /** Open ground in the sun at `floorZ`. */
  street(floorZ = 0, extra = {}) {
    return { floor: this.floor, ceiling: 'sky', floorZ, ceilZ: this.sky, light: this.light, side: this.wall, ...extra };
  }

  /**
   * A roof at `h`: a block of raised floor whose sides are the building's
   * walls, with its `skirt` at their foot (the town's, unless it names
   * another or null).
   */
  roofCell({ h, wall = this.wall, roof = this.roof, light = this.light, skirt, extra = {} }) {
    const bands = this._bands(skirt);
    return { floor: roof, ceiling: 'sky', floorZ: h, ceilZ: this.sky, light, side: wall, ...(bands && { bands }), ...extra };
  }

  /** The wall bands for a building's `skirt` (undefined: the town's). */
  _bands(skirt) {
    const s = skirt === undefined ? this.skirt : skirt;
    const k = typeof s === 'string' ? SKIRTS[s] : s;
    if (typeof s === 'string' && !k) throw new Error(`Town: no skirt "${s}"`);
    return k ? [{ to: k.to, tex: k.tex }] : undefined;
  }

  /**
   * Sand drifts: loose sand (`tex`) piled against the walls along the
   * street, on open ground (in the street's own floor) within `reach`
   * tiles of a building, thinning out in patches by a noise. Only in full
   * sun: pale sand in the shade snaps to the palette's olive greys and looks
   * like puddles. Run it after `finish()`.
   *
   * Each tile corner is sand or drift, and a tile with some of each takes
   * the edge texture for its corners (`tex-1` to `tex-14`, made by
   * assets/custom/derive.mjs): the drift's edge wanders through the tile
   * rather than following the grid.
   */
  drifts({ tex = 'street-drift', reach = 3, seed = 7 } = {}) {
    const { p } = this;
    const { w, h } = p;
    const open = (c) => c && !c.wall && !c.door && c.ceiling === 'sky' && !c.slab && c.floor === this.floor && c.light >= this.light;
    // How much each tile wants drift: open ground near a building by
    // distance and a noise, a building's foot a little, anything else not at all.
    const score = new Float32Array(w * h).fill(-1);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const c = p.get(x, y);
        if (!open(c)) {
          if (c.floorZ > 1 && !c.wall && !c.slab) score[y * w + x] = 0.4;
          continue;
        }
        let near = Infinity;
        for (let dy = -reach; dy <= reach; dy++) {
          for (let dx = -reach; dx <= reach; dx++) {
            const n = p.get(x + dx, y + dy);
            if (n && (n.floorZ ?? 0) > (c.floorZ ?? 0) + 1) near = Math.min(near, Math.max(Math.abs(dx), Math.abs(dy)));
          }
        }
        if (near <= reach) score[y * w + x] = valueNoise(x, y, 4, seed) - 0.2 - (near - 1) * 0.2;
      }
    }
    // A corner is drift when the tiles round it want it, and none of them is
    // ground that can't take it (so no edge stops short at a tile's side).
    const corner = new Uint8Array((w + 1) * (h + 1));
    for (let y = 1; y < h; y++) {
      for (let x = 1; x < w; x++) {
        const s = [score[(y - 1) * w + x - 1], score[(y - 1) * w + x], score[y * w + x], score[y * w + x - 1]];
        if (s.every((v) => v > -1) && s[0] + s[1] + s[2] + s[3] > 0) corner[y * (w + 1) + x] = 1;
      }
    }
    const out = [];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const c = p.get(x, y);
        if (!open(c)) continue;
        const k = y * (w + 1) + x;
        const m = corner[k] | (corner[k + 1] << 1) | (corner[k + w + 2] << 2) | (corner[k + w + 1] << 3);
        if (m) out.push([x, y, { ...c, floor: m === 15 ? tex : `${tex}-${m}` }]);
      }
    }
    for (const [x, y, c] of out) p.set(x, y, c);
    return this;
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
  arch(x0, y0, x1, y1, { h, lintel = 3, floorZ = 0, wall = this.wall, roof = this.roof, floor = this.floor, light = 152 }) {
    const slab = { bottom: floorZ + lintel, top: h, floor: roof, ceiling: wall, side: wall, light };
    this.p.rect(x0, y0, x1, y1, { floor, ceiling: 'sky', floorZ, ceilZ: this.sky, light: this.light, side: wall, slab });
    return this;
  }

  /**
   * A shut door in a building's straight outside wall: a recess `depth`
   * tiles into the wall (an `arch()`, open below `lintel`), the door (a
   * decal, `tex`, `tall` tiles high) on its back wall, and a flagstone step
   * in front. (x, y) is the middle of the doorway on the wall's edge and
   * `face` the way the door looks ('N', 'E', 'S' or 'W'): `door(30, 62,
   * 'S', ...)` is in the south wall of a building ending at row 62. Keep
   * `width` even with (x, y) on a tile corner, or odd with it halfway along
   * a tile. `depth: 0` cuts nothing and puts the door on the wall itself
   * (the back of a porch), without a step.
   */
  door(x, y, face, { h, tex = 'door-steel', tall = 3, width = 2, depth = 1, lintel = tall, floorZ = 0, wall = this.wall, step = depth > 0 }) {
    const along = face === 'N' || face === 'S' ? x : y;
    const a0 = Math.round(along - width / 2);
    const a1 = a0 + width;
    const out = face === 'S' || face === 'E' ? 1 : -1;
    const line = face === 'N' || face === 'S' ? y : x;
    const back = line - out * depth;
    if (depth > 0) {
      const [b0, b1] = [Math.min(line, back), Math.max(line, back)];
      if (face === 'N' || face === 'S') this.arch(a0, b0, a1, b1, { h, lintel, floorZ, wall });
      else this.arch(b0, a0, b1, a1, { h, lintel, floorZ, wall });
    }
    if (step) {
      const s = out > 0 ? line : line - 1;
      const paint = (c) => (c.floor === this.floor && !c.wall ? { ...c, floor: 'flagstone' } : c);
      if (face === 'N' || face === 'S') this.p.rect(a0, s, a1, s + 1, (_, __, c) => paint(c));
      else this.p.rect(s, a0, s + 1, a1, (_, __, c) => paint(c));
    }
    const at = face === 'N' || face === 'S' ? { x, y: back } : { x: back, y };
    this.decals.push({ ...at, z: floorZ + tall / 2, face, tex });
    return this;
  }

  /**
   * A window set into a building's straight outside wall, its middle at
   * height `z`, at (x, y) on the wall's edge, looking `face` (as for
   * `door`): a notch a tile deep and `width` wide (keep (x, y) halfway
   * along a tile for an odd width), open `tall` tiles high, the wall below
   * it a sill and a slab over it up to the roof. The window (a decal,
   * `tex`) is on the notch's back wall. The roof's height, plaster and
   * skirt come from the wall it's cut into, so it works on any storey.
   */
  window(x, y, face, { z = 3.5, tex = 'window-bars', width = 1, tall = 1.25, light = 152 } = {}) {
    const ns = face === 'N' || face === 'S';
    const along = ns ? x : y;
    const a0 = Math.round(along - width / 2);
    const out = face === 'S' || face === 'E' ? 1 : -1;
    const line = ns ? y : x;
    // The tiles of wall behind the edge, and the edge of the notch's back wall.
    const row = out > 0 ? line - 1 : line;
    const back = line - out;
    const [sill, top] = [z - tall / 2, z + tall / 2];
    for (let a = a0; a < a0 + width; a++) {
      const [tx, ty] = ns ? [a, row] : [row, a];
      const c = this.p.get(tx, ty);
      if (!c || c.wall || c.slab || !(c.floorZ >= top + 0.25)) throw new Error(`Town: no wall at (${tx}, ${ty}) for a window up to ${top}`);
      const wall = c.side ?? this.wall;
      this.p.set(tx, ty, { ...c, floorZ: sill, slab: { bottom: top, top: c.floorZ, floor: c.floor, ceiling: wall, side: wall, light } });
    }
    this.decals.push({ ...(ns ? { x: a0 + width / 2, y: back } : { x: back, y: a0 + width / 2 }), z, face, tex });
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
   * wallTop: 6 }`: under the sky, the wall stops at its building's roof and
   * the view goes on over it). `open: 'in'` (a room, a pit) or `'out'` (a
   * round building, a pillar) says which side people walk on. A round
   * building's wall gets its `skirt` (see `roofCell`).
   */
  circle(cx, cy, r, { inside, outside, wall, open = 'in', skirt }) {
    // (A round building's wall gets its skirt at its foot.)
    const bands = open === 'out' && wall ? this._bands(skirt) : undefined;
    if (bands) wall = { bands, ...wall };
    for (let y = Math.floor(cy - r) - 1; y <= Math.ceil(cy + r); y++) {
      for (let x = Math.floor(cx - r) - 1; x <= Math.ceil(cx + r); x++) this._arcTile(x, y, cx, cy, r, { inside, outside, wall, open });
    }
    return this;
  }

  /**
   * A building: a volume over the box, its corners rounded to radius `r`
   * (0: square), its roof at `h` (see `roofCell` for `wall`, `roof`,
   * `light` and `skirt`). `tiers` stack more of it on top, each a box (`[x0, y0, x1, y1]`)
   * inside it with its own `h` and `r`: a storey set back from the street.
   * The ground round the rounded corners keeps whatever was there.
   * `dome` tops it with a dome (a topper) on its highest box, as wide as
   * fits with a rim of roof round it: `true` in the wall's plaster, or a
   * plaster's name.
   */
  house(x0, y0, x1, y1, { h, r = 0, tiers = [], dome, ...opts }) {
    this._rounded(x0, y0, x1, y1, r, h, opts);
    for (const t of tiers) this._rounded(...t.box, t.r ?? 0, t.h, { ...opts, ...t });
    if (dome) {
      const t = tiers.at(-1);
      const [bx0, by0, bx1, by1] = t ? t.box : [x0, y0, x1, y1];
      const wall = typeof dome === 'string' ? dome : t?.wall ?? opts.wall;
      this.dome((bx0 + bx1) / 2, (by0 + by1) / 2, t ? t.h : h, Math.min(bx1 - bx0, by1 - by0) - 1.5, { wall });
    }
    return this;
  }

  /** A rounded box of roof at `h`; corner tiles outside the arc keep their cell. */
  _rounded(x0, y0, x1, y1, r, h, opts) {
    const p = this.p;
    const inside = this.roofCell({ ...opts, h });
    const bands = this._bands(opts.skirt);
    const wall = { wall: opts.wall ?? this.wall, wallTop: h, ...(bands && { bands }) };
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const cx = x < x0 + r ? x0 + r : x >= x1 - r ? x1 - r : null;
        const cy = y < y0 + r ? y0 + r : y >= y1 - r ? y1 - r : null;
        if (cx === null || cy === null) p.set(x, y, inside);
        // A corner: the arc round (cx, cy), a building on top of what's there.
        else this._arcTile(x, y, cx, cy, r, { inside, wall, open: 'out' });
      }
    }
  }

  /** One tile of a circle (see `circle`). */
  _arcTile(x, y, cx, cy, r, { inside, outside, wall, open }) {
    const p = this.p;
    const corners = [[x, y], [x + 1, y], [x + 1, y + 1], [x, y + 1]];
    const n = corners.filter(([u, v]) => Math.hypot(u - cx, v - cy) < r).length;
    const pts = n === 0 || n === 4 ? [] : crossings(corners, cx, cy, r);
    if (pts.length !== 2) {
      // Wholly on one side (or a corner just grazed): by its middle.
      if (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) < r) p.set(x, y, inside);
      else if (outside) p.set(x, y, outside);
      return;
    }
    // Order the points so the solid side is on the right going from the
    // first to the second (y down): outward for a room, inward for a building.
    let [a, b] = pts;
    const mx = (a[0] + b[0]) / 2 - cx;
    const my = (a[1] + b[1]) / 2 - cy;
    const right = [-(b[1] - a[1]), b[0] - a[0]];
    if ((right[0] * mx + right[1] * my > 0) !== (open === 'in')) [a, b] = [b, a];
    const base = open === 'in' ? inside : outside ?? p.get(x, y);
    const r4 = (v) => Math.round(v * 1000) / 1000;
    p.set(x, y, { ...base, ...wall, line: [r4(a[0] - x), r4(a[1] - y), r4(b[0] - x), r4(b[1] - y)] });
  }

  /**
   * A room inside a building whose roof is at `h`: the lower storey of a
   * slab, its ceiling at `ceilZ`, the roof on top (so a dome can stand on
   * it, and it shades the street like the rest of the building). Its walls
   * are the building's raised floor round it.
   */
  room(x0, y0, x1, y1, { h, floorZ = 0, ceilZ = 4.5, floor = 'flagstone', ceiling = 'planks', wall = this.wall, roof = this.roof, light = 136 }) {
    const slab = { bottom: ceilZ, top: h, floor: roof, ceiling, side: wall, light };
    this.p.rect(x0, y0, x1, y1, { floor, ceiling: 'sky', floorZ, ceilZ: this.sky, light: this.light, side: wall, slab });
    return this;
  }

  /**
   * Finish the town once everything is painted: `seal()`, then `shadows()`.
   */
  finish(suns = SUNS) {
    return this.seal().shadows(suns);
  }

  /**
   * A solid wall stands as tall as the sky of the tile in front of it, so
   * the sky beside every wall (the map's edge, a shut door's frame, the back
   * of a porch) comes down to the roofline round that wall: the highest
   * open floor in the 5x5 round it (a door is two tiles deep), plus a hair.
   */
  seal() {
    const { p } = this;
    const solid = (c) => c && ((c.wall && !c.line && !c.diagonal) || c.door);
    const fixes = new Map();
    for (let y = 0; y < p.h; y++) {
      for (let x = 0; x < p.w; x++) {
        if (!solid(p.get(x, y))) continue;
        let top = 0;
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            const n = p.get(x + dx, y + dy);
            if (n && !solid(n) && n.ceiling === 'sky') top = Math.max(top, n.slab ? n.slab.top : n.floorZ ?? 0);
          }
        }
        for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
          const n = p.get(nx, ny);
          if (!n || solid(n) || n.ceiling !== 'sky') continue;
          const k = ny * p.w + nx;
          fixes.set(k, Math.min(fixes.get(k) ?? Infinity, Math.max(top, n.slab ? n.slab.top : n.floorZ ?? 0) + 0.25));
        }
      }
    }
    for (const [k, ceilZ] of fixes) {
      const x = k % p.w;
      const y = (k - x) / p.w;
      const c = p.get(x, y);
      if (ceilZ < c.ceilZ) p.set(x, y, { ...c, ceilZ });
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
    // (A dome takes its light from the roof under it, so that roof isn't
    // shaded by the domes.)
    const top = this._tops();
    const bare = this._tops(false);
    const under = new Uint8Array(w * h);
    for (const [cx, cy, r] of this.casters) {
      for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
        for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
          if (x >= 0 && y >= 0 && x < w && y < h && Math.hypot(x + 0.5 - cx, y + 0.5 - cy) < r) under[y * w + x] = 1;
        }
      }
    }
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
        const tops = under[y * w + x] ? bare : top;
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
              if ((tx !== x || ty !== y) && tops[ty * w + tx] > z + s * d.rise) {
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
  _tops(domes = true) {
    const { p } = this;
    const { w, h } = p;
    const top = new Float32Array(w * h).fill(-Infinity);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const c = p.get(x, y);
        if (c.wall && (c.line || c.diagonal)) top[y * w + x] = c.wallTop ?? c.ceilZ;
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
    // Domes: a hemisphere's height over each tile.
    for (const [cx, cy, r, base, height] of domes ? this.casters : []) {
      for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
        for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
          const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy) / r;
          if (d < 1 && x >= 0 && y >= 0 && x < w && y < h) top[y * w + x] = Math.max(top[y * w + x], base + height * Math.sqrt(1 - d * d));
        }
      }
    }
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
