import { F_SOLID, F_DOOR } from './tilemap.js';

const UNREACHABLE = 32767;
const DIRS = [
  [1, 0], [-1, 0], [0, 1], [0, -1],
  [1, 1], [1, -1], [-1, 1], [-1, -1],
];

/** The body a flow field plans for: walkers by default. */
export const WALKER = { step: 0.4, drop: 0.4, height: 0.85, flying: false };

/**
 * A breadth-first distance field toward the player. Monsters walk downhill to
 * find their way around walls and through (unlocked) doors. Each field plans
 * for one kind of body (`profile`): how high it can step up, how far it will
 * step down, how tall it is, and whether it flies over floors altogether.
 */
export class FlowField {
  /** @param {*} map @param {{step:number, drop:number, height:number, flying:boolean}} [profile] */
  constructor(map, profile = WALKER) {
    this.map = map;
    this.profile = profile;
    this.dist = new Int16Array(map.w * map.h).fill(UNREACHABLE);
    this.queue = new Int32Array(map.w * map.h);
    this.origin = -1;
  }

  passable(i) {
    const f = this.map.flags[i];
    if (f & F_SOLID) return false;
    if (f & F_DOOR) {
      const d = this.map.doors[this.map.doorIndex[i]];
      return (!d.lock && !d.secret) || d.passable;
    }
    return true;
  }

  /**
   * Can this body walk (or fly) from tile a into the neighbouring tile b?
   * Doors count at their open height, since monsters open them.
   */
  canStep(a, b) {
    const map = this.map;
    const { step, drop, height, flying } = this.profile;
    let ceil = map.ceilZ[b];
    if (map.flags[b] & F_DOOR) {
      const door = map.doors[map.doorIndex[b]];
      if (door.style === 'rise') ceil = door.openZ;
    }
    if (ceil - map.floorZ[b] < height) return false;
    if (flying) return true;
    const rise = map.floorZ[b] - map.floorZ[a];
    return rise <= step + 1e-6 && -rise <= drop + 1e-6;
  }

  /** Recompute distances from a tile (cheap: a few thousand tiles). */
  update(tx, ty, force = false) {
    const map = this.map;
    if (!map.inBounds(tx, ty)) return;
    const origin = ty * map.w + tx;
    if (origin === this.origin && !force) return;
    this.origin = origin;
    const { dist, queue } = this;
    dist.fill(UNREACHABLE);
    let head = 0;
    let tail = 0;
    dist[origin] = 0;
    queue[tail++] = origin;
    const w = map.w;
    while (head < tail) {
      const c = queue[head++];
      const cx = c % w;
      const cy = (c / w) | 0;
      const nd = dist[c] + 1;
      for (let k = 0; k < 4; k++) {
        const nx = cx + DIRS[k][0];
        const ny = cy + DIRS[k][1];
        if (nx < 0 || ny < 0 || nx >= w || ny >= map.h) continue;
        const n = ny * w + nx;
        // The monster walks from n toward c, the way back to the player.
        if (dist[n] <= nd || !this.passable(n) || !this.canStep(n, c)) continue;
        dist[n] = nd;
        queue[tail++] = n;
      }
    }
  }

  distanceAt(tx, ty) {
    if (!this.map.inBounds(tx, ty)) return UNREACHABLE;
    return this.dist[ty * this.map.w + tx];
  }

  /**
   * The neighbouring tile centre to walk toward from (x, y), or null.
   * Diagonals are only taken when both side tiles are open and level enough
   * to cross (no corner cutting).
   */
  next(x, y) {
    const map = this.map;
    const tx = Math.floor(x);
    const ty = Math.floor(y);
    const here = this.distanceAt(tx, ty);
    const from = ty * map.w + tx;
    const open = (i) => this.passable(i) && this.canStep(from, i);
    let best = here;
    let bx = -1;
    let by = -1;
    for (const [dx, dy] of DIRS) {
      const nx = tx + dx;
      const ny = ty + dy;
      const d = this.distanceAt(nx, ny);
      const to = ny * map.w + nx;
      if (d >= best || !open(to)) continue;
      if (dx && dy) {
        // No cutting corners: both side tiles must join up with this one and the next.
        const sides = [ty * map.w + nx, ny * map.w + tx];
        if (sides.some((i) => !open(i) || !this.canStep(i, to))) continue;
      }
      best = d;
      bx = nx;
      by = ny;
    }
    if (bx < 0) return null;
    return { x: bx + 0.5, y: by + 0.5, tx: bx, ty: by };
  }
}

export { UNREACHABLE };
