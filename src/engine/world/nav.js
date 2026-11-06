import { F_SOLID, F_DOOR, F_SLAB } from './tilemap.js';

const UNREACHABLE = 32767;
const DIRS = [
  [1, 0], [-1, 0], [0, 1], [0, -1],
  [1, 1], [1, -1], [-1, 1], [-1, -1],
];

/**
 * The body a flow field plans for: walkers by default. `doors`, if given,
 * picks the doors it plans through whatever their lock (a tracker's route
 * goes through doors the story will open); else it takes any door that
 * isn't locked or secret.
 */
export const WALKER = { step: 0.8, drop: 0.8, height: 1.7, flying: false };

/**
 * A breadth-first distance field toward the player. Monsters walk downhill to
 * find their way around walls and through (unlocked) doors. Each field plans
 * for one kind of body (`profile`): how high it can step up, how far it will
 * step down, how tall it is, and whether it flies over floors altogether.
 *
 * It plans over storeys: node `i` is tile i's ground storey, and node `n + i`
 * (n = the tile count) the storey on top of tile i's slab, if it has one. So
 * `dist[i]` is still a tile's distance on maps without slabs.
 */
export class FlowField {
  /**
   * @param {*} map @param {{step:number, drop:number, height:number, flying:boolean}} [profile]
   * @param {number} [limit] plan only this many steps out from the player
   *   (a level's `navReach`): further tiles stay UNREACHABLE, so a body
   *   there heads straight for the player, and each update costs only the
   *   tiles within reach (a big open map has tens of thousands)
   */
  constructor(map, profile = WALKER, limit = Infinity) {
    this.map = map;
    this.profile = profile;
    this.limit = limit;
    this.n = map.w * map.h;
    this.dist = new Int16Array(this.n * 2).fill(UNREACHABLE);
    this.queue = new Int32Array(this.n * 2);
    this.origin = -1;
  }

  passable(i) {
    const f = this.map.flags[i];
    if (f & F_SOLID) return false;
    if (f & F_DOOR) {
      const d = this.map.doors[this.map.doorIndex[i]];
      if (this.profile.doors) return this.profile.doors(d) || d.passable;
      return (!d.lock && !d.secret) || d.passable;
    }
    return true;
  }

  /** The node for storey s of tile i (s = 1: on its slab). */
  node(i, s) {
    return s ? this.n + i : i;
  }

  /** The node of tile (tx, ty) for a body reaching up to `reach` (see TileMap.storeyAt). */
  nodeAt(tx, ty, reach = Infinity) {
    const i = ty * this.map.w + tx;
    return this.node(i, this.map.storeyAt(i, reach));
  }

  /**
   * Can this body walk (or fly) from node a into the neighbouring node b (or,
   * given tiles, from tile a into tile b)? Doors count at their open height,
   * since monsters open them. Where a slab is involved, the two storeys must
   * also overlap by the body's height where they meet, so it fits through.
   */
  canStep(a, b) {
    const map = this.map;
    const n = this.n;
    const sa = a >= n ? 1 : 0;
    const sb = b >= n ? 1 : 0;
    const ta = sa ? a - n : a;
    const tb = sb ? b - n : b;
    const { step, drop, height, flying } = this.profile;
    const floorA = map.storeyFloor(ta, sa);
    const floorB = map.storeyFloor(tb, sb);
    const slabs = (map.flags[ta] | map.flags[tb]) & F_SLAB;
    let ceil = map.storeyCeil(tb, sb);
    if (map.flags[tb] & F_DOOR) {
      const door = map.doors[map.doorIndex[tb]];
      if (door.style === 'rise') ceil = door.openZ;
    }
    // Fences (railings, bars) block the edge; flyers go over low ones. Beside
    // a slab, only where the fence is at the body's height (not a railing on
    // a bridge overhead).
    const fence = map.fences.length ? map.fenceBetween(ta, tb) : null;
    if (fence && !(flying && fence.height)) {
      const bottom = Math.max(floorA, floorB);
      if (!slabs || (map.fenceBottom(fence) < bottom + height && map.fenceTop(fence) > bottom)) return false;
    }
    if (ceil - floorB < height) return false;
    if (slabs && Math.min(ceil, map.storeyCeil(ta, sa)) - Math.max(floorA, floorB) < height) return false;
    if (flying) return true;
    const rise = floorB - floorA;
    return rise <= step + 1e-6 && -rise <= drop + 1e-6;
  }

  /**
   * Recompute distances from a tile (cheap: a few thousand tiles), in the
   * storey a body reaching up to `reach` is in there.
   */
  update(tx, ty, force = false, reach = Infinity) {
    const map = this.map;
    if (!map.inBounds(tx, ty)) return;
    const origin = this.nodeAt(tx, ty, reach);
    if (origin === this.origin && !force) return;
    this.origin = origin;
    const { dist, queue } = this;
    dist.fill(UNREACHABLE);
    let head = 0;
    let tail = 0;
    dist[origin] = 0;
    queue[tail++] = origin;
    const w = map.w;
    const N = this.n;
    const flags = map.flags;
    const limit = this.limit;
    while (head < tail) {
      const c = queue[head++];
      const ct = c >= N ? c - N : c;
      const cx = ct % w;
      const cy = (ct / w) | 0;
      const nd = dist[c] + 1;
      // (Breadth first: every node after this one is as far or further.)
      if (nd > limit) break;
      for (let k = 0; k < 4; k++) {
        const nx = cx + DIRS[k][0];
        const ny = cy + DIRS[k][1];
        if (nx < 0 || ny < 0 || nx >= w || ny >= map.h) continue;
        const t = ny * w + nx;
        if (!this.passable(t)) continue;
        // Each storey of the neighbour (just the one, without a slab).
        for (let n = t, last = flags[t] & F_SLAB ? N + t : t; n <= last; n += N) {
          // The monster walks from n toward c, the way back to the player.
          if (dist[n] <= nd || !this.canStep(n, c)) continue;
          dist[n] = nd;
          queue[tail++] = n;
        }
      }
    }
  }

  /** Steps to the player from tile (tx, ty), in the storey a body reaching up to `reach` is in. */
  distanceAt(tx, ty, reach = Infinity) {
    if (!this.map.inBounds(tx, ty)) return UNREACHABLE;
    return this.dist[this.nodeAt(tx, ty, reach)];
  }

  /**
   * The neighbouring tile centre to walk toward from (x, y), for a body
   * reaching up to `reach`, or null. Diagonals are only taken when both side
   * tiles are open and level enough to cross (no corner cutting). `away`:
   * the neighbour furthest from the player instead (a body fleeing them),
   * or null with none further away, or no route to the player at all.
   */
  next(x, y, reach = Infinity, away = false) {
    const map = this.map;
    const N = this.n;
    const tx = Math.floor(x);
    const ty = Math.floor(y);
    if (!map.inBounds(tx, ty)) return null;
    const from = this.nodeAt(tx, ty, reach);
    const here = this.dist[from];
    if (away && here === UNREACHABLE) return null;
    /** The storeys of tile i (as nodes) this body can step into from node a. */
    const into = (a, i) => {
      if (!this.passable(i)) return [];
      const out = [];
      for (let n = i, last = map.flags[i] & F_SLAB ? N + i : i; n <= last; n += N) if (this.canStep(a, n)) out.push(n);
      return out;
    };
    let best = here;
    let bx = -1;
    let by = -1;
    let bn = -1;
    for (const [dx, dy] of DIRS) {
      const nx = tx + dx;
      const ny = ty + dy;
      if (!map.inBounds(nx, ny)) continue;
      for (const to of into(from, ny * map.w + nx)) {
        const d = this.dist[to];
        if (away ? d <= best || d === UNREACHABLE : d >= best) continue;
        if (dx && dy) {
          // No cutting corners: both side tiles must join up with this one and the next.
          const sides = [ty * map.w + nx, ny * map.w + tx];
          if (sides.some((i) => !into(from, i).some((s) => this.canStep(s, to)))) continue;
        }
        best = d;
        bx = nx;
        by = ny;
        bn = to;
      }
    }
    if (bx < 0) return null;
    return { x: bx + 0.5, y: by + 0.5, tx: bx, ty: by, node: bn };
  }

  /**
   * Can this body walk in a straight line from (ax, ay), reaching up to
   * `reach`, to the middle of tile (tx, ty)? Each tile the line crosses must
   * be one it can step into from the last (through a corner, the tile across
   * the x edge first). Returns the node it ends in, or -1.
   */
  straight(ax, ay, reach, tx, ty) {
    const map = this.map;
    const N = this.n;
    let x = Math.floor(ax);
    let y = Math.floor(ay);
    if (!map.inBounds(x, y)) return -1;
    let node = this.nodeAt(x, y, reach);
    const dx = tx + 0.5 - ax;
    const dy = ty + 0.5 - ay;
    const sx = Math.sign(dx);
    const sy = Math.sign(dy);
    const ddx = sx ? Math.abs(1 / dx) : Infinity;
    const ddy = sy ? Math.abs(1 / dy) : Infinity;
    let mx = sx > 0 ? (x + 1 - ax) * ddx : sx < 0 ? (ax - x) * ddx : Infinity;
    let my = sy > 0 ? (y + 1 - ay) * ddy : sy < 0 ? (ay - y) * ddy : Infinity;
    for (let k = 0; (x !== tx || y !== ty) && k < 512; k++) {
      if (mx <= my) {
        x += sx;
        mx += ddx;
      } else {
        y += sy;
        my += ddy;
      }
      const i = y * map.w + x;
      if (!map.inBounds(x, y) || !this.passable(i)) return -1;
      let into = -1;
      for (let n = i, last = map.flags[i] & F_SLAB ? N + i : i; n <= last && into < 0; n += N) if (this.canStep(node, n)) into = n;
      if (into < 0) return -1;
      node = into;
    }
    return node;
  }
}

export { UNREACHABLE };
