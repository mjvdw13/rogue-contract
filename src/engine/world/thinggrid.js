/**
 * Solid things by block, so a collision test only looks at the things near
 * it: a town has over a thousand solid props, and every step of every mover
 * used to test them all. Each thing is listed in every block its
 * footprint's box touches. The world keeps the grid up to date: for every
 * thing at the start of a tick (one moved some other way, turned non-solid
 * or removed since), and during it after each move and spawn. Outside a
 * tick (tests and tools move things by hand) it's brought up to date before
 * each test.
 */

/** Tiles a block. */
export const BLOCK = 4;

export class ThingGrid {
  /** @param {number} w @param {number} h the map's size in tiles */
  constructor(w, h) {
    this.bw = Math.max(1, Math.ceil(w / BLOCK));
    this.bh = Math.max(1, Math.ceil(h / BLOCK));
    /** @type {any[][]} the things in each block */
    this.cells = Array.from({ length: this.bw * this.bh }, () => []);
    /** Up to date and kept so: during a tick. */
    this.fresh = false;
  }

  /** List every thing where it is now. */
  sync(things) {
    for (let i = 0; i < things.length; i++) this.update(things[i]);
  }

  /** The block column of x (things off the map count as in the edge blocks). */
  col(x) {
    const b = Math.floor(x / BLOCK);
    return b < 0 ? 0 : b >= this.bw ? this.bw - 1 : b;
  }

  /** The block row of y. */
  row(y) {
    const b = Math.floor(y / BLOCK);
    return b < 0 ? 0 : b >= this.bh ? this.bh - 1 : b;
  }

  /** List thing `t` where it is now, or take it out if it no longer collides. */
  update(t) {
    let x0 = -1;
    let y0 = -1;
    let x1 = -1;
    let y1 = -1;
    if (t.solid && !t.removed && t.kind !== 'projectile') {
      const lines = t.model?.lines;
      const r = lines?.length ? t.model.linesReach * (t.def?.scale ?? 1) : t.radius;
      x0 = this.col(t.x - r);
      x1 = this.col(t.x + r);
      y0 = this.row(t.y - r);
      y1 = this.row(t.y + r);
    }
    if (x0 === t.gx0 && y0 === t.gy0 && x1 === t.gx1 && y1 === t.gy1) return;
    if (t.gx0 >= 0) {
      for (let by = t.gy0; by <= t.gy1; by++) {
        for (let bx = t.gx0; bx <= t.gx1; bx++) {
          const cell = this.cells[by * this.bw + bx];
          const i = cell.indexOf(t);
          if (i < 0) continue;
          cell[i] = cell[cell.length - 1];
          cell.pop();
        }
      }
    }
    for (let by = y0; by <= y1 && x0 >= 0; by++) {
      for (let bx = x0; bx <= x1; bx++) this.cells[by * this.bw + bx].push(t);
    }
    t.gx0 = x0;
    t.gy0 = y0;
    t.gx1 = x1;
    t.gy1 = y1;
  }
}
