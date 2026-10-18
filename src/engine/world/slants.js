/**
 * Angled walls. A tile can hold one wall line between two points on its
 * edges. One side of the line is solid wall and the other is open floor with
 * the tile's own floor and ceiling. The solid side is on the right as you go
 * from the first point to the second, looking at the map as drawn (north up).
 *
 * An angled wall stands up to the tile's ceiling, or stops short of it at
 * `wallTop`: under the sky, a rounded corner as tall as its building, with
 * the view going on over it. Its texture starts afresh in each tile unless
 * `wallU` says how far along it the tile's wall begins (a curve made of
 * chained tiles, the texture running on round it).
 *
 * The four 45° presets name the corner that is solid:
 *   NE ◥   NW ◤   SE ◢   SW ◣
 */

/** Tile-local endpoints [ax, ay, bx, by] (y down) for each preset. */
export const DIAGONALS = {
  NE: [1, 1, 0, 0],
  SW: [0, 0, 1, 1],
  NW: [1, 0, 0, 1],
  SE: [0, 1, 1, 0],
};

/** An angled wall in world coordinates, with what collision and the renderer need. */
export class Slant {
  /**
   * @param {number[]} line tile-local [ax, ay, bx, by]
   * @param {number} tx tile x
   * @param {number} ty tile y
   * @param {number} tex texture slot of the wall face
   * @param {number} [top] the wall's top, if it stops below the tile's ceiling
   * @param {number} [u] where along its texture the wall starts, in units
   */
  constructor(line, tx, ty, tex, top = Infinity, u = 0) {
    const [ax, ay, bx, by] = line;
    this.tx = tx;
    this.ty = ty;
    this.ax = tx + ax;
    this.ay = ty + ay;
    this.bx = tx + bx;
    this.by = ty + by;
    this.ex = this.bx - this.ax;
    this.ey = this.by - this.ay;
    this.len = Math.hypot(this.ex, this.ey);
    // Unit normal pointing into the solid side (right of a -> b with y down).
    this.nx = -this.ey / this.len;
    this.ny = this.ex / this.len;
    this.tex = tex;
    /** Where the wall stops (Infinity: at the tile's ceiling). */
    this.top = top;
    /** Where along its texture the face starts, at the second point (units). */
    this.u = u;
    this.poly = clipSquare(tx, ty, this);
  }

  /** Signed distance from the line: > 0 on the solid side. */
  side(x, y) {
    return (x - this.ax) * this.nx + (y - this.ay) * this.ny;
  }

  /** Is the point inside this tile's solid part? */
  solidAt(x, y) {
    return this.side(x, y) > 1e-9;
  }

  /**
   * Where a ray (ox, oy) + (dx, dy) * t crosses the wall line. Returns t, or
   * -1 if it misses the segment or runs parallel. `outS` (optional array)
   * receives the position along the line, 0 at a and 1 at b.
   */
  ray(ox, oy, dx, dy, outS) {
    const den = dx * this.ey - dy * this.ex;
    if (den > -1e-12 && den < 1e-12) return -1;
    const wx = this.ax - ox;
    const wy = this.ay - oy;
    const t = (wx * this.ey - wy * this.ex) / den;
    const s = (wx * dy - wy * dx) / den;
    if (s < -1e-9 || s > 1 + 1e-9) return -1;
    if (outS) outS[0] = s;
    return t;
  }

  /** Does a circle of radius r at (x, y) overlap the solid part of the tile? */
  touchesCircle(x, y, r) {
    const poly = this.poly;
    const n = poly.length;
    if (n < 3) return false;
    let inside = true;
    for (let i = 0; i < n; i++) {
      const [x0, y0] = poly[i];
      const [x1, y1] = poly[(i + 1) % n];
      // Polygon winding is clockwise on screen (y down): inside is to the right.
      if ((x1 - x0) * (y - y0) - (y1 - y0) * (x - x0) < 0) inside = false;
      if (segDist2(x, y, x0, y0, x1, y1) < r * r) return true;
    }
    return inside;
  }
}

/** Squared distance from a point to the segment (x0, y0)-(x1, y1). */
export function segDist2(px, py, x0, y0, x1, y1) {
  const ex = x1 - x0;
  const ey = y1 - y0;
  const l2 = ex * ex + ey * ey;
  let t = l2 > 0 ? ((px - x0) * ex + (py - y0) * ey) / l2 : 0;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  const dx = px - (x0 + ex * t);
  const dy = py - (y0 + ey * t);
  return dx * dx + dy * dy;
}

/** The tile square clipped to the slant's solid side (clockwise, y down). */
function clipSquare(tx, ty, sl) {
  const square = [[tx, ty], [tx + 1, ty], [tx + 1, ty + 1], [tx, ty + 1]];
  const out = [];
  for (let i = 0; i < 4; i++) {
    const p = square[i];
    const q = square[(i + 1) % 4];
    const sp = sl.side(p[0], p[1]);
    const sq = sl.side(q[0], q[1]);
    if (sp >= -1e-9) out.push(p);
    if ((sp > 1e-9 && sq < -1e-9) || (sp < -1e-9 && sq > 1e-9)) {
      const k = sp / (sp - sq);
      out.push([p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k]);
    }
  }
  return out;
}

/**
 * Parse a legend entry's angled wall: `diagonal: 'NE'` or `line: [ax, ay, bx, by]`
 * (tile units, points on the tile's edges). Returns tile-local endpoints or an
 * error string.
 */
export function slantLine(entry) {
  if (entry.diagonal !== undefined) {
    const line = DIAGONALS[String(entry.diagonal).toUpperCase()];
    return line ?? `unknown diagonal "${entry.diagonal}" (use NE, NW, SE or SW)`;
  }
  const line = entry.line;
  if (!Array.isArray(line) || line.length !== 4 || line.some((v) => typeof v !== 'number' || v < 0 || v > 1)) {
    return '"line" must be [ax, ay, bx, by] with each value from 0 to 1';
  }
  const onEdge = (x, y) => x === 0 || x === 1 || y === 0 || y === 1;
  if (!onEdge(line[0], line[1]) || !onEdge(line[2], line[3])) return '"line" endpoints must be on the tile edges';
  if (line[0] === line[2] && line[1] === line[3]) return '"line" needs two different points';
  return line;
}
