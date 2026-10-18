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
//   town.door(30, 62, 'S', { h: 6, tex: 'door-grey' });
//   town.finish();
//   town.grime();
//   list.push(...town.things);  // the domes, jambs and awnings
//   decals: town.decals,        // the doors, windows and grime
//   hangings: town.hangings,    // the awnings' valances

import { DOMES } from '../../models/dome.js';
import { AWNING_CLOTHS, AWNING_DEPTHS, AWNING_POLES, AWNING_SLOPE, poleId } from '../../models/awning.js';
import { TIN_DEPTHS, TIN_METALS, TIN_SLOPE } from '../../models/tin.js';
import { PIPE_HEIGHTS } from '../../models/pipes.js';
import { CLUTTER } from '../../models/clutter.js';
import { valueNoise, random } from './noise.js';

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

/**
 * The grime decals (tools/art/textures/grime.js) by what they're for, with
 * their sizes in tiles (32 texels a tile).
 */
const GRIME = {
  streaks: [['grime-streaks-1', 2, 3], ['grime-streaks-2', 2, 3], ['grime-streaks-3', 3, 2]],
  drip: [['grime-drip-1', 1, 2], ['grime-drip-2', 1.25, 1.5]],
  blotch: [['grime-blotch-1', 2, 1.5], ['grime-blotch-2', 3, 2]],
  smudge: [['grime-smudge', 1, 1.25]],
  crack: [['grime-crack-1', 1, 2], ['grime-crack-2', 1.25, 1.5]],
  dust: [['grime-dust-1', 4, 1], ['grime-dust-2', 4, 1.25]],
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
    /** Decals the kit places (doors, windows, grime), for the level's `decals`. */
    this.decals = [];
    /** Doors and windows, for `grime()`: where their drips and smudges go. */
    this.openings = [];
    /** Houses with their own `grime`: [x0, y0, x1, y1, amount]. */
    this.grimeBoxes = [];
    /** Hangings the kit places (awnings' valances, tarps), for the level's `hangings`. */
    this.hangings = [];
    /** Tarps, for their light: { cx, cy, hanging }. */
    this.tarps = [];
    /** Covers over a box at a height, for the shadows (tarps, tin roofs): { box, z }. */
    this.covers = [];
    /** Slanting walls (`slanted()`), for `grime()`: { a, b, top, inward: a point inside }. */
    this.slants = [];
    /** The boxes stalls stand in, kept clear by `clutter()`. */
    this.stalls = [];
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
   * A shut door in a building's straight outside wall (after the film's:
   * Mark's reference, 2026-10-17): a recess `depth` tiles into the wall and
   * `width` wide (an `arch()`, open below `lintel`), lined with pale tiles
   * (the `door-jamb` model, for the usual 2 by 3 opening, unless `jamb` is
   * false), the door (a decal, `tex`, `tall` tiles high) on its back wall
   * and a flagstone step in front. On the wall's face, a `sign` over the
   * opening (a striped panel) and a `panel` beside it (its controls), unless
   * they're false. (x, y) is the middle of the doorway on the wall's edge
   * and `face` the way the door looks ('N', 'E', 'S' or 'W'): `door(30, 62,
   * 'S', ...)` is in the south wall of a building ending at row 62. Keep
   * (x, y) on a tile corner for an even `width`, halfway along a tile for an
   * odd one. `depth: 0` cuts nothing and puts the door on the wall itself
   * (the back of a porch), without a jamb or a step.
   *
   * `opens: true` makes it a real door into a `room()` behind a wall 1
   * tile thick: a rising door (its panel `tex` + '-rising', 64x128) standing
   * halfway through the wall, so the tiled jamb (`door-jamb-through`,
   * lipped on both faces) shows half a tile deep either side; the wall over
   * it is a slab up to the roof, as an arch's is. Shut doors stay pictures
   * on houses with nothing inside.
   */
  door(x, y, face, { h, tex = 'door-red', tall = 3, width = 2, depth = 1, lintel = tall, jamb = depth > 0, sign = true, panel = true, floorZ = 0, wall = this.wall, step = depth > 0, opens = false }) {
    const ns = face === 'N' || face === 'S';
    const along = ns ? x : y;
    const a0 = Math.round(along - width / 2);
    const a1 = a0 + width;
    const mid = (a0 + a1) / 2;
    const out = face === 'S' || face === 'E' ? 1 : -1;
    const line = ns ? y : x;
    const back = line - out * depth;
    if (opens && depth !== 1) throw new Error(`Town: a door that opens at (${x}, ${y}) needs a wall 1 tile thick (depth 1)`);
    if (depth > 0) {
      const [b0, b1] = [Math.min(line, back), Math.max(line, back)];
      if (ns) this.arch(a0, b0, a1, b1, { h, lintel, floorZ, wall });
      else this.arch(b0, a0, b1, a1, { h, lintel, floorZ, wall });
    }
    if (opens) {
      // The arch's tiles become the door's, with a room behind them.
      const row = out > 0 ? line - 1 : line;
      for (let a = a0; a < a1; a++) {
        const [tx, ty] = ns ? [a, row] : [row, a];
        const [bx, by] = ns ? [a, row - out] : [row - out, a];
        const inside = this.p.get(bx, by);
        if (!inside || inside.wall || inside.door || (inside.floorZ ?? 0) > floorZ + 0.5) {
          throw new Error(`Town: a door that opens at (${x}, ${y}) needs a room behind it, at (${bx}, ${by})`);
        }
        this.p.set(tx, ty, { ...this.p.get(tx, ty), floor: 'flagstone', door: `${tex}-rising`, style: 'rise' });
      }
    }
    if (step) {
      const s = out > 0 ? line : line - 1;
      const paint = (c) => (c.floor === this.floor && !c.wall ? { ...c, floor: 'flagstone' } : c);
      if (ns) this.p.rect(a0, s, a1, s + 1, (_, __, c) => paint(c));
      else this.p.rect(s, a0, s + 1, a1, (_, __, c) => paint(c));
    }
    const at = (a, edge) => (ns ? { x: a, y: edge } : { x: edge, y: a });
    if (!opens) this.decals.push({ ...at(mid, back), z: floorZ + tall / 2, face, tex });
    if (jamb) {
      // (The model is built looking south; content angles turn it counter-clockwise.)
      const angle = { S: 0, E: 90, N: 180, W: 270 }[face];
      this.things.push({ type: opens ? 'door-jamb-through' : 'door-jamb', ...at(mid, (line + back) / 2), z: floorZ, angle });
    }
    // Sign and controls on the wall round the opening (on the back wall without a recess).
    const wallAt = depth > 0 ? line : back;
    if (sign) this.decals.push({ ...at(mid, wallAt), z: floorZ + tall + 0.4, face, tex: 'door-sign' });
    if (panel) this.decals.push({ ...at(mid + width / 2 + 0.35, wallAt), z: floorZ + 1.6, face, tex: 'door-panel' });
    this.openings.push({ kind: 'door', face, line: wallAt, a0, a1, floorZ, panel: panel ? mid + width / 2 + 0.35 : null });
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
    this.openings.push({ kind: 'window', face, line, a0, a1: a0 + width, floorZ: sill });
    return this;
  }

  /**
   * A cloth awning over the open tiles of a box against a wall, looking
   * `face` ('N', 'E', 'S' or 'W': the way its front edge looks, away from
   * the wall), its underside at `z` above `floorZ`: you walk under it, in
   * its shade (`light`). A thin slab is its underside and shade; on it the
   * cloth slopes up to the wall in bays 2 tiles wide that sag between their
   * ribs (models/awning.js), on poles under the front corners and every
   * few tiles between. `cloth` is one of AWNING_CLOTHS; the box is 2 or 3
   * tiles deep (from the wall), an even number wide, and `z` a quarter
   * between 2.5 and 5.5. `valance` is the front edge: 'fringe' (a fixed
   * scalloped hem), a hanging type to sway there instead (`valance-<cloth>`
   * for its own hem, or 'rag'), or null for none. Hangings go in
   * `this.hangings`, for the level's `hangings`. With `wall: false` it
   * stands free (a stall's roof): poles under the back corners too, and
   * the cloth closed at the back.
   */
  awning(x0, y0, x1, y1, { z = 3.5, face = 'S', cloth = 'red', light = 160, valance = 'fringe', floorZ = 0, poles = 4, wall = true } = {}) {
    const ns = face === 'N' || face === 'S';
    const out = face === 'S' || face === 'E' ? 1 : -1;
    const [a0, a1] = ns ? [x0, x1] : [y0, y1];
    const depth = ns ? y1 - y0 : x1 - x0;
    const front = { S: y1, N: y0, E: x1, W: x0 }[face];
    const where = `Town: the awning at (${x0}, ${y0})`;
    if (!AWNING_CLOTHS.includes(cloth)) throw new Error(`${where} has no cloth "${cloth}" (${AWNING_CLOTHS.join(', ')})`);
    if (!AWNING_DEPTHS.includes(depth)) throw new Error(`${where} is ${depth} deep: awnings are ${AWNING_DEPTHS.join(' or ')}`);
    if ((a1 - a0) % 2) throw new Error(`${where} is ${a1 - a0} wide: awnings are an even number of tiles wide`);
    if (!AWNING_POLES.includes(z)) throw new Error(`${where}: "z" must be a quarter from 2.5 to 5.5`);
    const tex = `awning-${cloth}`;
    const under = ns ? tex : `${tex}-x`;
    const top = floorZ + z + 0.125;
    // The wall it's against must stand above its back edge.
    // (The row of tiles behind it, a doorway's lintel counting as wall.)
    const row = front - out * depth - (out > 0 ? 1 : 0);
    let wallTop = 0;
    for (let a = a0; a < a1; a++) {
      const c = this.p.get(...(ns ? [a, row] : [row, a]));
      if (c) wallTop = Math.max(wallTop, c.slab ? c.slab.top : c.floorZ ?? 0);
    }
    const backZ = top + 0.1 + depth * AWNING_SLOPE;
    if (wall && wallTop < backZ) throw new Error(`${where} rises to ${backZ.toFixed(2)} at the back, above the wall behind it (${wallTop}): lower it or make it shallower`);
    this.p.rect(x0, y0, x1, y1, (x, y, old) => {
      if (old.wall || old.door || old.slab || old.ceiling !== 'sky') return old;
      return { ...old, slab: { bottom: floorZ + z, top, floor: under, ceiling: under, side: tex, light } };
    });
    const angle = { S: 0, E: 90, N: 180, W: 270 }[face];
    const at = (a, edge) => (ns ? { x: a, y: edge } : { x: edge, y: a });
    const bare = valance !== 'fringe' ? '-bare' : '';
    for (let a = a0; a < a1; a += 2) this.things.push({ type: `${tex}-${depth}${bare}`, ...at(a + 1, front), z: top, angle });
    for (const a of [a0, a1]) this.things.push({ type: `${tex}-${depth}-end`, ...at(a, front), z: top, angle });
    // Poles under the front, the ends' inset a little, the rest spread evenly between.
    const span = a1 - a0 - 0.4;
    const n = Math.max(1, Math.ceil(span / poles));
    for (let k = 0; k <= n; k++) this.things.push({ type: poleId(z), ...at(a0 + 0.2 + (span * k) / n, front - out * 0.2) });
    if (!wall) {
      const rear = front - out * depth;
      for (const a of [a0 + 0.2, a1 - 0.2]) this.things.push({ type: poleId(z), ...at(a, rear + out * 0.2) });
      for (let a = a0; a < a1; a += 2) this.things.push({ type: `${tex}-${depth}-back`, ...at(a + 1, front), z: top, angle });
    }
    if (valance && valance !== 'fringe') {
      const e = front + out * 0.05;
      const tie = (a) => (ns ? [a, e, top - 0.06] : [e, a, top - 0.06]);
      this.hangings.push({ type: valance, from: tie(a0 + 0.1), to: tie(a1 - 0.1), length: 0.5 });
    }
    return this;
  }

  /**
   * A tarp over a box (a market stall): a cloth tied at its four corners,
   * `z` above `floorZ`, sagging `sag` in its middle and billowing in the
   * breeze (a hanging, `tarp-<cloth>`, in `this.hangings`). With `face`,
   * its front looks that way and its back edge is `rise` higher; poles hold
   * up its corners ('all', or 'front' when its back is tied to a wall, or
   * 'none'). The ground under it is in its shade (`shadows()`), and the
   * cloth is lit as the suns find it up there. Pole heights are quarters
   * from 2.5 to 5.5.
   */
  tarp(x0, y0, x1, y1, { z = 3, face = 'S', rise = 0, cloth = 'sand', sag = 0.3, poles = 'all', floorZ = 0 } = {}) {
    const where = `Town: the tarp at (${x0}, ${y0})`;
    if (!AWNING_CLOTHS.includes(cloth)) throw new Error(`${where} has no cloth "${cloth}" (${AWNING_CLOTHS.join(', ')})`);
    const e = 0.1;
    // Its corners going round: back left, back right, front right, front left (looking out).
    const box = [[x0 + e, y0 + e], [x1 - e, y0 + e], [x1 - e, y1 - e], [x0 + e, y1 - e]];
    const turn = { S: 0, W: 1, N: 2, E: 3 }[face];
    if (turn === undefined) throw new Error(`${where}: "face" must be N, E, S or W`);
    const [bl, br, fr, fl] = [0, 1, 2, 3].map((k) => box[(k + turn) % 4]);
    const back = floorZ + z + rise;
    const front = floorZ + z;
    const hanging = {
      type: `tarp-${cloth}`,
      from: [...bl, back],
      to: [...br, back],
      out: [fl[0] - bl[0], fl[1] - bl[1], front - back],
      sag,
      pin: 'corners',
    };
    this.hangings.push(hanging);
    this.tarps.push({ cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, hanging });
    this.covers.push({ box: [x0, y0, x1, y1], z: front - sag });
    const pole = (pt, h) => {
      if (!AWNING_POLES.includes(h)) throw new Error(`${where}: a pole ${h} high (poles are quarters from 2.5 to 5.5)`);
      this.things.push({ type: poleId(h), x: pt[0], y: pt[1], z: floorZ });
    };
    if (poles !== 'none') {
      pole(fl, z);
      pole(fr, z);
      if (poles === 'all') {
        pole(bl, z + rise);
        pole(br, z + rise);
      }
    }
    return this;
  }

  /**
   * A market stall: a counter and a rack of wares (models/market.js) under
   * a free-standing awning over the box (`awning()` with `wall: false`), its
   * counter at the front, which looks `face` ('N', 'E', 'S' or 'W'). The box
   * is 4 or 6 tiles wide and 3 deep; the counter stands in its middle, with
   * room for a stallholder between it and the rack. `cloth` and `z` are the
   * awning's (2.75 high by default); `clutter()` keeps off the box.
   */
  stall(x0, y0, x1, y1, face, { cloth = 'sand', z = 2.75, valance = 'fringe' } = {}) {
    const where = `Town: the stall at (${x0}, ${y0})`;
    const angle = { S: 0, E: 90, N: 180, W: 270 }[face];
    if (angle === undefined) throw new Error(`${where}: "face" must be N, E, S or W`);
    const ns = face === 'N' || face === 'S';
    const [wide, deep] = ns ? [x1 - x0, y1 - y0] : [y1 - y0, x1 - x0];
    if (deep !== 3 || (wide !== 4 && wide !== 6)) throw new Error(`${where} is ${wide} wide and ${deep} deep: stalls are 4 or 6 wide and 3 deep`);
    this.awning(x0, y0, x1, y1, { z, face, cloth, valance, wall: false });
    this.things.push({ type: 'market-stall', x: (x0 + x1) / 2, y: (y0 + y1) / 2, angle });
    this.stalls.push([x0, y0, x1, y1]);
    return this;
  }

  /**
   * A downpipe down a building's straight outside wall, from its roofline
   * to the street: (x, y) on the wall's edge, `face` the way the wall looks
   * (as for `door`). Its height is the wall's, from the tile behind it.
   */
  pipe(x, y, face, { floorZ = 0 } = {}) {
    const [bx, by] = this._behind(x, y, face);
    const c = this.p.get(bx, by);
    const h = Math.round((c?.slab ? c.slab.top : c?.floorZ ?? 0) - floorZ);
    if (!PIPE_HEIGHTS.includes(h)) throw new Error(`Town: no wall for a downpipe at (${x}, ${y}) (its wall is ${h} high; pipes are ${PIPE_HEIGHTS[0]} to ${PIPE_HEIGHTS.at(-1)})`);
    return this.fixture(`pipe-${h}`, x, y, face, { z: floorZ });
  }

  /**
   * A model made to hang on a wall (built looking south, its back on y = 0:
   * a `conduit-<length>`, the `wall-tank`, the `wall-unit`), at (x, y) on
   * a straight wall's edge, its base at height `z`, turned to look `face`.
   */
  fixture(type, x, y, face, { z = 0 } = {}) {
    const angle = { S: 0, E: 90, N: 180, W: 270 }[face];
    if (angle === undefined) throw new Error(`Town: "${type}" at (${x}, ${y}) needs a face (N, E, S or W)`);
    // (A hair out from the wall, so it takes its light from the street in front.)
    const out = face === 'S' || face === 'E' ? 0.01 : -0.01;
    const ns = face === 'N' || face === 'S';
    this.things.push({ type, x: ns ? x : x + out, y: ns ? y + out : y, z, angle });
    // (Low ones, so clutter keeps clear of them.)
    if (z < 1.5) this.openings.push({ kind: 'fixture', face, line: ns ? y : x, a0: (ns ? x : y) - 0.5, a1: (ns ? x : y) + 0.5, floorZ: z });
    return this;
  }

  /**
   * A vent, fan or gauge on a wall (a decal: `vent-grille`, `vent-slats`,
   * `vent-round`, `wall-fan`, `wall-meter`), its middle at height `z`, at
   * (x, y) on a straight wall's edge, looking `face`.
   */
  vent(x, y, face, { z = 3, tex = 'vent-grille', scale } = {}) {
    this.decals.push({ x, y, z, face, tex, ...(scale !== undefined && { scale }) });
    return this;
  }

  /** The tile behind (x, y) on a wall's edge that looks `face`: the wall's own tile. */
  _behind(x, y, face) {
    if (face === 'S') return [Math.floor(x), y - 1];
    if (face === 'N') return [Math.floor(x), y];
    if (face === 'E') return [x - 1, Math.floor(y)];
    return [x, Math.floor(y)];
  }

  /**
   * A tin roof on a lean-to (a low building against a taller one): sheets of
   * corrugated tin over the box of its roof (at `h` above `floorZ`),
   * sloping from the back (against the taller wall) down past its front,
   * where they overhang the street (models/tin.js). `face` is the way its
   * front looks. The box is 2 to 6 tiles deep and an even number wide.
   * `metal` is 'rust', 'grey' or 'mix' (mostly rust, a grey sheet here and
   * there, from `seed`); each sheet sits a little higher or lower than the
   * last, so they read as separate sheets.
   */
  leanTo(x0, y0, x1, y1, { h, face = 'S', metal = 'mix', floorZ = 0, seed = 5 } = {}) {
    const ns = face === 'N' || face === 'S';
    const [a0, a1] = ns ? [x0, x1] : [y0, y1];
    const depth = ns ? y1 - y0 : x1 - x0;
    const front = { S: y1, N: y0, E: x1, W: x0 }[face];
    const where = `Town: the lean-to at (${x0}, ${y0})`;
    if (front === undefined) throw new Error(`${where}: "face" must be N, E, S or W`);
    if (!TIN_DEPTHS.includes(depth)) throw new Error(`${where} is ${depth} deep: tin roofs are ${TIN_DEPTHS.join(', ')}`);
    if ((a1 - a0) % 2) throw new Error(`${where} is ${a1 - a0} wide: tin roofs are an even number of tiles wide`);
    if (metal !== 'mix' && !TIN_METALS.includes(metal)) throw new Error(`${where} has no metal "${metal}" (${TIN_METALS.join(', ')} or mix)`);
    const r = random(seed);
    const angle = { S: 0, E: 90, N: 180, W: 270 }[face];
    const at = (a) => (ns ? { x: a, y: front } : { x: front, y: a });
    const z = floorZ + h;
    let last = null;
    for (let a = a0; a < a1; a += 2) {
      const m = metal === 'mix' ? (r() < 0.25 ? 'grey' : 'rust') : metal;
      this.things.push({ type: `tin-${m}-${depth}`, ...at(a + 1), z: Math.round((z + ((a - a0) / 2) % 2 * 0.03) * 100) / 100, angle });
      if (a === a0) this.things.push({ type: `tin-${m}-${depth}-end`, ...at(a), z, angle });
      last = m;
    }
    this.things.push({ type: `tin-${last}-${depth}-end`, ...at(a1), z, angle });
    this.covers.push({ box: [x0, y0, x1, y1], z: z + 0.15 + (depth * TIN_SLOPE) / 2 });
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
   * building's wall gets its `skirt` (see `roofCell`). With `seam`
   * (degrees, 0 east, 90 north) the wall's texture runs on round the
   * circle from there (`wallU`) instead of starting afresh in each tile:
   * put the seam where it's hidden.
   */
  circle(cx, cy, r, { inside, outside, wall, open = 'in', skirt, seam }) {
    // (A round building's wall gets its skirt at its foot.)
    const bands = open === 'out' && wall ? this._bands(skirt) : undefined;
    if (bands) wall = { bands, ...wall };
    for (let y = Math.floor(cy - r) - 1; y <= Math.ceil(cy + r); y++) {
      for (let x = Math.floor(cx - r) - 1; x <= Math.ceil(cx + r); x++) this._arcTile(x, y, cx, cy, r, { inside, outside, wall, open, seam });
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
   * plaster's name. `grime` says how weathered its walls are (see
   * `grime()`).
   */
  house(x0, y0, x1, y1, { h, r = 0, tiers = [], dome, grime, ...opts }) {
    if (grime !== undefined) this.grimeBoxes.push([x0, y0, x1, y1, grime]);
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

  /**
   * A building whose outline is a convex polygon (`points`, [x, y] on tile
   * corners, going either way round): its sides along the grid are ordinary
   * walls and its slanting sides angled walls, so a street can bend. Each
   * tile can hold one slanting side, so two may only meet at a corner where
   * they go off into different tiles. Otherwise as `house()` without
   * `tiers`: `h`, `wall`, `roof`, `skirt`, `light`, `grime`, and `dome`
   * tops it with the widest dome that fits round its middle. A slanting
   * wall's plaster runs on from tile to tile (`wallU`), so its decals can
   * cross tiles, and `grime()` weathers it; it gets no doors, windows or
   * clutter.
   */
  slanted(points, { h, dome, grime, ...opts }) {
    const p = this.p;
    const n = points.length;
    const xs = points.map((q) => q[0]);
    const ys = points.map((q) => q[1]);
    const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    if (grime !== undefined) this.grimeBoxes.push([x0, y0, x1, y1, grime]);
    const inside = this.roofCell({ ...opts, h });
    const bands = this._bands(opts.skirt);
    const wall = { wall: opts.wall ?? this.wall, wallTop: h, ...(bands && { bands }) };
    const cx = xs.reduce((s, v) => s + v, 0) / n;
    const cy = ys.reduce((s, v) => s + v, 0) / n;
    const edges = points.map((a, i) => [a, points[(i + 1) % n]]);
    // Which side of the line a-b a point is on (signed), and inside: the centre's side of every edge.
    const side = ([ax, ay], [bx, by], x, y) => (bx - ax) * (y - ay) - (by - ay) * (x - ax);
    const within = (x, y) => edges.every(([a, b]) => side(a, b, x, y) * side(a, b, cx, cy) > 0);
    const slants = edges.filter(([a, b]) => a[0] !== b[0] && a[1] !== b[1]);
    const r4 = (v) => Math.round(v * 1000) / 1000;
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const cuts = slants.map((edge) => ({ edge, pts: segmentCrossings(...edge, x, y) })).filter((c) => c.pts.length === 2);
        if (cuts.length > 1) throw new Error(`Town: two slanting walls cross the tile (${x}, ${y})`);
        if (!cuts.length) {
          if (within(x + 0.5, y + 0.5)) p.set(x, y, inside);
          continue;
        }
        // The building's side on the right going from the first point to the second (y down).
        let [a, b] = cuts[0].pts;
        const right = [-(b[1] - a[1]), b[0] - a[0]];
        if (right[0] * (cx - (a[0] + b[0]) / 2) + right[1] * (cy - (a[1] + b[1]) / 2) < 0) [a, b] = [b, a];
        // The texture runs on along the whole side, back from the end the line points to.
        const [e0, e1] = cuts[0].edge;
        const end = (b[0] - a[0]) * (e1[0] - e0[0]) + (b[1] - a[1]) * (e1[1] - e0[1]) > 0 ? e1 : e0;
        const wallU = r4(Math.hypot(end[0] - b[0], end[1] - b[1]));
        p.set(x, y, { ...p.get(x, y), ...wall, line: [r4(a[0] - x), r4(a[1] - y), r4(b[0] - x), r4(b[1] - y)], wallU });
      }
    }
    for (const [a, b] of slants) this.slants.push({ a, b, top: h, inward: [cx, cy], skirt: bands?.[0]?.to ?? 0 });
    if (dome) {
      // As wide as the nearest side is from the middle allows, with a rim.
      const reach = Math.min(...edges.map(([a, b]) => Math.abs(side(a, b, cx, cy)) / Math.hypot(b[0] - a[0], b[1] - a[1])));
      this.dome(cx, cy, h, reach * 2 - 1.5, { wall: typeof dome === 'string' ? dome : opts.wall });
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
  _arcTile(x, y, cx, cy, r, { inside, outside, wall, open, seam }) {
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
    const cell = { ...base, ...wall, line: [r4(a[0] - x), r4(a[1] - y), r4(b[0] - x), r4(b[1] - y)] };
    if (seam !== undefined) {
      // The texture runs from the second point back to the first: how far
      // round from the seam the second point is, going that way.
      const turn = (q) => (((Math.atan2(cy - q[1], q[0] - cx) - (seam * Math.PI) / 180) % TAU) + TAU) % TAU;
      const [ta, tb] = [turn(a), turn(b)];
      const ccw = (ta - tb + TAU) % TAU < Math.PI;
      cell.wallU = r4(r * (ccw ? tb : TAU - tb));
    }
    p.set(x, y, cell);
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
   * Weather the buildings' straight walls under the sky with grime (decals
   * that darken the wall, in its own colour): streaks off each roofline,
   * dust above the foot of the walls along the street, stains and cracks,
   * a drip under each window and smudges by each door's controls. `amount`
   * scales it (0 none, 1 the usual, 2 neglected); a house's own `grime`
   * replaces it on its walls. Placed at random from `seed`, the same every
   * time. Run it after `finish()`. Slanting walls (`slanted()`) get
   * streaks, dust, stains and cracks too; rounded corners and round walls
   * get none.
   */
  grime({ amount = 1, seed = 11 } = {}) {
    const { p } = this;
    const r = random(seed);
    const out = [];
    const ns = (face) => face === 'N' || face === 'S';
    // The tile a face belongs to (behind it), and the one in front, at tile `a` along its edge `line`.
    const behind = (face, line, a) => (face === 'S' ? [a, line - 1] : face === 'N' ? [a, line] : face === 'E' ? [line - 1, a] : [line, a]);
    const before = (face, line, a) => (face === 'S' ? [a, line] : face === 'N' ? [a, line - 1] : face === 'E' ? [line, a] : [line - 1, a]);
    const levelAt = ([x, y]) => {
      let g = amount;
      for (const [x0, y0, x1, y1, k] of this.grimeBoxes) if (x >= x0 && x < x1 && y >= y0 && y < y1) g = k;
      return g;
    };
    // One of `kind` round `a` along the edge `line` (kept inside lo..hi),
    // its middle at `z`, or its top at `top`, or its bottom at `bottom`.
    // Returns its width, or nothing if it doesn't fit.
    const put = (kind, face, line, a, lo, hi, { scale = 1, z, top, bottom }) => {
      const [tex, w, h] = r.pick(GRIME[kind]);
      const half = (w * scale) / 2;
      const flip = r() < 0.5;
      if (hi - lo < half * 2) return undefined;
      const mid = Math.min(hi - half, Math.max(lo + half, a));
      const zz = z ?? (top !== undefined ? top - (h * scale) / 2 : bottom + (h * scale) / 2);
      const round = (v) => Math.round(v * 100) / 100;
      // (On a slanting wall, `line` is the slant and `mid` how far along it.)
      const t = face === 'angled' ? mid / line.len : 0;
      const at =
        face === 'angled'
          ? { x: round(line.a[0] + (line.b[0] - line.a[0]) * t), y: round(line.a[1] + (line.b[1] - line.a[1]) * t) }
          : ns(face)
            ? { x: round(mid), y: line }
            : { x: line, y: round(mid) };
      out.push({ ...at, z: round(zz), face, tex, ...(scale !== 1 && { scale: round(scale) }), ...(flip && { flip }) });
      return w * scale;
    };
    const height = (c) => (c.slab ? c.slab.top : c.floorZ ?? 0);
    const open = (c) => c && !c.wall && !c.door && c.ceiling === 'sky' && (!c.slab || c.slab.top - c.slab.bottom <= 0.25);
    // (A door that opens is an arch with a panel in it: the wall over it weathers.)
    const building = (c) => c && !c.wall && (!c.door || c.slab) && c.ceiling === 'sky';

    // Runs of straight wall: the same face, ground, roofline and grime.
    const runs = [];
    for (const face of 'NESW') {
      const lines = (ns(face) ? p.h : p.w) + 1;
      const length = ns(face) ? p.w : p.h;
      for (let line = 0; line < lines; line++) {
        let run = null;
        for (let a = 0; a <= length; a++) {
          let edge = null;
          const back = behind(face, line, a);
          const b = a < length ? p.get(...back) : null;
          const f = a < length ? p.get(...before(face, line, a)) : null;
          if (open(f) && building(b) && height(b) - (f.floorZ ?? 0) >= 2) {
            edge = { bot: f.floorZ ?? 0, top: height(b), g: levelAt(back), street: f.floor === this.floor, skirt: b.bands?.[0]?.to ?? 0 };
          }
          const same = run && edge && edge.bot === run.bot && edge.top === run.top && edge.g === run.g && edge.street === run.street;
          if (same) run.a1 = a + 1;
          else {
            if (run) runs.push(run);
            run = edge && { ...edge, face, line, a0: a, a1: a + 1 };
          }
        }
      }
    }

    // The slanting walls (`slanted()`), each one run along its length.
    for (const s of this.slants) {
      const len = Math.hypot(s.b[0] - s.a[0], s.b[1] - s.a[1]);
      const mid = [(s.a[0] + s.b[0]) / 2, (s.a[1] + s.b[1]) / 2];
      const d = Math.hypot(s.inward[0] - mid[0], s.inward[1] - mid[1]);
      const step = (k) => [Math.floor(mid[0] + ((s.inward[0] - mid[0]) / d) * k), Math.floor(mid[1] + ((s.inward[1] - mid[1]) / d) * k)];
      const front = p.get(...step(-0.7));
      if (!open(front)) continue;
      runs.push({ face: 'angled', line: { ...s, len }, a0: 0, a1: len, bot: front.floorZ ?? 0, top: s.top, g: levelAt(step(0.7)), street: front.floor === this.floor, skirt: s.skirt });
    }

    for (const { face, line, a0, a1, bot, top, g, street, skirt } of runs) {
      if (g <= 0) continue;
      const len = a1 - a0;
      const tall = top - bot;
      const [lo, hi] = [a0 + 0.15, a1 - 0.15];
      // Streaks off the roofline, with gaps between.
      for (let a = a0 + r.range(0, 1.5); a < a1; a += r.range(0.5, 3) / g) {
        if (r() < 0.75 * g) a += put('streaks', face, line, a + 1, lo, hi, { scale: Math.min(r.range(0.8, 1.2), (tall - 0.8) / 3), top }) ?? 0;
      }
      // Dust kicked up against the walls along the street, above the skirt.
      if (street) {
        for (let a = a0 + r.range(0, 1); a < a1 - 1; a += r.range(2, 4)) {
          if (r() < 0.5 * g) put('dust', face, line, a + 1.5, lo, hi, { scale: r.range(0.6, 1), bottom: bot + Math.max(0.05, skirt - 0.4) });
        }
      }
      // Stains and cracks anywhere on the wall.
      for (let k = Math.round((len / 5) * g * r.range(0.5, 1.5)); k > 0; k--) {
        put('blotch', face, line, r.range(a0, a1), lo, hi, { scale: r.range(0.7, 1.2), z: r.range(bot + 1.2, top - 1) });
      }
      for (let k = Math.round((len / 14) * g * r.range(0, 1.5)); k > 0; k--) {
        put('crack', face, line, r.range(a0, a1), lo, hi, { scale: r.range(0.6, 1), top: top - r.range(0.3, 1.5) });
      }
    }

    // A drip under each window's sill; smudges by each door's controls.
    for (const o of this.openings) {
      const g = levelAt(behind(o.face, o.line, Math.floor((o.a0 + o.a1) / 2)));
      if (g <= 0) continue;
      const mid = (o.a0 + o.a1) / 2;
      if (o.kind === 'window' && r() < 0.6 + 0.2 * g) {
        put('drip', o.face, o.line, mid + r.range(-0.15, 0.15), o.a0 - 0.5, o.a1 + 0.5, { scale: r.range(0.75, 1.1), top: o.floorZ });
      }
      if (o.kind === 'door' && o.panel !== null) {
        put('smudge', o.face, o.line, o.panel + r.range(-0.1, 0.25), o.panel - 1, o.panel + 1, { scale: r.range(0.8, 1.1), z: o.floorZ + 1.4 });
      }
    }
    // (First, so the signs and doors are drawn over their walls' grime.)
    this.decals.unshift(...out);
    return this;
  }

  /**
   * Things found on the street (models/clutter.js), set in groups against
   * the buildings' straight walls where the street is open in front of
   * them (`clear` tiles of it, so alleys stay free), clear of doors, low
   * fixtures and arches: stacks of crates, drums, pressure canisters, a
   * cargo pod, junk with litter and a droid's dome, rubble, scrap and power
   * units. Litter lies about the open
   * street too. `amount` scales how much (1 the usual, 2 a mess); placed at
   * random from `seed`, the same every time. `keep` boxes ([x0, y0, x1, y1])
   * are left clear for things placed by hand (a group with anything in one
   * is left out, and the rest come out as they would without it), and so
   * are the stalls' (`stall()`). Run it
   * after `finish()` (and after `drifts()`).
   */
  clutter({ amount = 1, seed = 13, clear = 4, keep: kept = [] } = {}) {
    const { p } = this;
    const keep = [...kept, ...this.stalls];
    const r = random(seed);
    const ns = (face) => face === 'N' || face === 'S';
    const street = (c) => c && !c.wall && !c.door && c.ceiling === 'sky' && (!c.slab || c.slab.top - c.slab.bottom <= 0.25) && (c.floor === this.floor || c.floor.startsWith('street-drift'));
    // (A raised floor: not an arch or an awning, whose slabs stand over open ground; a window's sill is.)
    const building = (c) => c && !c.wall && !c.door && c.ceiling === 'sky' && (c.floorZ ?? 0) >= 1.2;
    // The tile behind an edge, and the k-th tile out in front of it.
    const tileAt = (face, line, a, k) => {
      const out = face === 'S' || face === 'E' ? 1 : -1;
      const row = out > 0 ? line + k : line - 1 - k;
      return ns(face) ? [a, row] : [row, a];
    };
    // Runs of straight wall with open street in front.
    const runs = [];
    for (const face of 'NESW') {
      const lines = (ns(face) ? p.h : p.w) + 1;
      const length = ns(face) ? p.w : p.h;
      for (let line = 0; line < lines; line++) {
        let run = null;
        for (let a = 0; a <= length; a++) {
          let ok = a < length && building(p.get(...tileAt(face, line, a, -1)));
          for (let k = 0; ok && k < clear; k++) {
            const c = p.get(...tileAt(face, line, a, k));
            ok = street(c) && (c.floorZ ?? 0) === 0;
          }
          if (ok && run) run.a1 = a + 1;
          else if (ok) run = { face, line, a0: a, a1: a + 1 };
          else if (run) {
            runs.push(run);
            run = null;
          }
        }
      }
    }
    // What a group is made of: [type, along, out (from its middle), stacked on top at z].
    const GROUPS = [
      ['crates', 3, () => [['crate-tan', 0, 0], ...(r() < 0.6 ? [['crate-grey-small', r.range(-0.15, 0.15), 0, 0.9]] : []), ...(r() < 0.5 ? [['crate-rust-long', 1.35, 0.05]] : [['crate-grey-small', 0.85, 0.1]])]],
      ['barrels', 2, () => [['barrel-rust', 0, 0], [r() < 0.5 ? 'barrel-grey' : 'barrel-rust', 0.7, 0.05], ...(r() < 0.4 ? [['barrel-rust', 0.35, 0.65]] : [])]],
      ['canisters', 2, () => [['canister', 0, 0], [r() < 0.5 ? 'canister-rust' : 'canister', 0.48, 0.05], ...(r() < 0.6 ? [['canister-rust', -0.45, 0.12]] : [])]],
      ['pod', 1.5, () => [['cargo-pod', 0, 0], ...(r() < 0.5 ? [['canister', 1.05, 0.1]] : [['crate-grey-small', 1.15, 0.05]])]],
      ['junk', 1.5, () => [['junk-heap', 0.4, 0.1], ['litter', 1.4, 0.7], ['litter-small', -0.6, 0.8], ...(r() < 0.6 ? [['droid-dome', -0.95, 0.15]] : [])]],
      ['rubble', 1.5, () => [['rubble', 0, 0], ['litter-small', 0.9, 0.5]]],
      ['scrap', 1, () => [['scrap', 0, 'wall'], ['litter-small', 0.9, 0.6]]],
      ['power', 0.8, () => [['power-unit', 0, 'wall'], ...(r() < 0.5 ? [['barrel-grey', 1.1, 0.05]] : [])]],
      ['single', 2, () => [[r.pick(['barrel-rust', 'barrel-grey', 'crate-tan', 'canister', 'canister-rust', 'crate-grey-small']), 0, 0]]],
    ];
    const total = GROUPS.reduce((n, g) => n + g[1], 0);
    const pick = () => {
      let k = r() * total;
      for (const g of GROUPS) if ((k -= g[1]) < 0) return g;
      return GROUPS[0];
    };
    const blocked = (face, line, lo, hi) =>
      this.openings.some((o) => o.face === face && o.line === line && o.kind !== 'window' && o.a1 + 0.6 > lo && o.a0 - 0.6 < hi);
    const round = (v) => Math.round(v * 100) / 100;
    for (const { face, line, a0, a1 } of runs) {
      const out = face === 'S' || face === 'E' ? 1 : -1;
      const angle = { S: 0, E: 90, N: 180, W: 270 }[face];
      // Along the run: now and then a group (the first of a few tries that
      // fits what's left before the run's end and is off the doors), then a gap.
      let a = a0 + 0.3 + r.range(0, 2) / amount;
      while (a < a1 - 0.9) {
        if (r() > 0.7 * amount) {
          a += r.range(1, 3);
          continue;
        }
        let placed = null;
        for (let tries = 0; tries < 4 && !placed; tries++) {
          const items = pick()[2]();
          const span = items.reduce((m, [type, along]) => [Math.min(m[0], along - CLUTTER[type].depth / 2), Math.max(m[1], along + CLUTTER[type].depth / 2)], [0, 0]);
          const at = a - span[0];
          if (at + span[1] <= a1 - 0.3 && !blocked(face, line, a, at + span[1])) placed = { items, at, end: at + span[1] };
        }
        if (!placed) {
          a += 1;
          continue;
        }
        const group = [];
        for (const [type, along, off, z] of placed.items) {
          const c = CLUTTER[type];
          const u = placed.at + along;
          if (off === 'wall') {
            // Built against a wall: on the wall's edge, a hair out, facing away from it.
            const d = out * 0.01;
            group.push({ type, ...(ns(face) ? { x: round(u), y: line + d } : { x: line + d, y: round(u) }), angle });
            continue;
          }
          const d = line + out * (c.depth / 2 + 0.06 + off);
          const turn = angle + Math.round(r.range(-12, 12));
          group.push({ type, ...(ns(face) ? { x: round(u), y: round(d) } : { x: round(d), y: round(u) }), angle: turn, ...(z !== undefined && { z }) });
        }
        if (!group.some((t) => keep.some(([x0, y0, x1, y1]) => t.x >= x0 && t.x <= x1 && t.y >= y0 && t.y <= y1))) this.things.push(...group);
        a = placed.end + r.range(1, 4) / amount;
      }
    }
    // Litter about the open street, away from the walls.
    for (let y = 0; y < p.h; y++) {
      for (let x = 0; x < p.w; x++) {
        if (r() > 0.006 * amount) continue;
        let open = true;
        for (let dy = -2; dy <= 2 && open; dy++) for (let dx = -2; dx <= 2 && open; dx++) open = street(p.get(x + dx, y + dy)) && (p.get(x + dx, y + dy).floorZ ?? 0) === 0;
        const type = open && (r() < 0.5 ? 'litter' : 'litter-small');
        const angle = open && Math.round(r.range(0, 360));
        if (open && !keep.some(([x0, y0, x1, y1]) => x + 0.5 >= x0 && x + 0.5 <= x1 && y + 0.5 >= y0 && y + 0.5 <= y1)) this.things.push({ type, x: x + 0.5, y: y + 0.5, angle });
      }
    }
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
    // (A door with a slab is under the roof, as an arch is: not a wall.)
    const solid = (c) => c && ((c.wall && !c.line && !c.diagonal) || (c.door && !c.slab));
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
    // How much light the suns' shadows take from the tile (x, y) at height z.
    const dropAt = (x, y, z, tops) => {
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
      return drop;
    };
    const out = [];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const c = p.get(x, y);
        if ((c.wall && !c.line && !c.diagonal) || (c.door && !c.slab) || c.ceiling !== 'sky') continue;
        const z = c.slab ? c.slab.top : c.floorZ ?? 0;
        const drop = dropAt(x, y, z, under[y * w + x] ? bare : top);
        if (drop > 0) out.push([x, y, { ...c, light: Math.round((c.light - drop) / 8) * 8 }]);
      }
    }
    for (const [x, y, c] of out) p.set(x, y, c);
    // A tarp is lit as the sun finds it up there, over the shade it makes.
    for (const t of this.tarps) {
      const z = Math.min(t.hanging.from[2], t.hanging.to[2]);
      t.hanging.light = Math.round((this.light - dropAt(Math.floor(t.cx), Math.floor(t.cy), z, top)) / 8) * 8;
    }
    return this;
  }

  /** Each tile's top for shadows: ground, roofs and slabs (a door's too) by their height; walls, shut doors and interiors as tall as the highest open top beside them. */
  _tops(domes = true) {
    const { p } = this;
    const { w, h } = p;
    const top = new Float32Array(w * h).fill(-Infinity);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const c = p.get(x, y);
        if (c.wall && (c.line || c.diagonal)) top[y * w + x] = c.wallTop ?? c.ceilZ;
        else if (!c.wall && (!c.door || c.slab) && c.ceiling === 'sky') top[y * w + x] = c.slab ? Math.max(c.slab.top, c.floorZ ?? 0) : c.floorZ ?? 0;
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
    // Covers: a tarp's lowest edge over the ground under it, a tin roof's middle.
    for (const { box: [x0, y0, x1, y1], z } of this.covers) {
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) top[y * w + x] = Math.max(top[y * w + x], z);
    }
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

const TAU = Math.PI * 2;
const SAMPLES = [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]];

/**
 * Where the segment a-b crosses the edges of the tile (x, y): the distinct
 * points (two when it runs through the tile, fewer when it only touches it).
 */
function segmentCrossings(a, b, x, y) {
  const corners = [[x, y], [x + 1, y], [x + 1, y + 1], [x, y + 1]];
  const d = [b[0] - a[0], b[1] - a[1]];
  const pts = [];
  for (let k = 0; k < 4; k++) {
    const c = corners[k];
    const e = [corners[(k + 1) % 4][0] - c[0], corners[(k + 1) % 4][1] - c[1]];
    const den = d[0] * e[1] - d[1] * e[0];
    if (Math.abs(den) < 1e-9) continue;
    const t = ((c[0] - a[0]) * e[1] - (c[1] - a[1]) * e[0]) / den;
    const s = ((c[0] - a[0]) * d[1] - (c[1] - a[1]) * d[0]) / den;
    if (t < -1e-9 || t > 1 + 1e-9 || s < -1e-9 || s > 1 + 1e-9) continue;
    const q = [a[0] + t * d[0], a[1] + t * d[1]];
    if (!pts.some((o) => Math.hypot(o[0] - q[0], o[1] - q[1]) < 1e-6)) pts.push(q);
  }
  return pts;
}

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
