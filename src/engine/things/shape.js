import { rayCylinder } from '../world/physics.js';

/**
 * Collision shapes. A thing is an upright cylinder (radius, height), except a
 * thing whose model lists `lines`: then it's those wall segments, turned and
 * scaled with the thing, between its z and z + height.
 */

/** Solid model scenery stops shots (a puff, no damage) even when it can't be hurt. */
export const blocksShots = (t) => !!t.model && t.solid && !t.removed;

/** The thing's wall segments in world space, [x0, y0, x1, y1, ...], or null for a cylinder. */
export function shapeLines(t) {
  const lines = t.model?.lines;
  if (!lines?.length) return null;
  const a = t.angle ?? 0;
  if (t._shape && t._shapeX === t.x && t._shapeY === t.y && t._shapeA === a) return t._shape;
  const out = footprint(lines, t.x, t.y, a, t.def?.scale ?? 1);
  t._shape = out;
  t._shapeX = t.x;
  t._shapeY = t.y;
  t._shapeA = a;
  return out;
}

/** Model-space `lines` placed at (x, y), turned by `angle` and scaled: [x0, y0, x1, y1, ...]. */
export function footprint(lines, x, y, angle, scale = 1) {
  const c = Math.cos(angle) * scale;
  const sn = Math.sin(angle) * scale;
  const out = new Float64Array(lines.length * 4);
  lines.forEach(([x0, y0, x1, y1], i) => {
    out.set([x + x0 * c - y0 * sn, y + x0 * sn + y0 * c, x + x1 * c - y1 * sn, y + x1 * sn + y1 * c], i * 4);
  });
  return out;
}

/** Squared distance from a point to the nearest of the segments. */
export function linesDist2(seg, x, y) {
  let best = Infinity;
  for (let i = 0; i < seg.length; i += 4) {
    const ax = seg[i];
    const ay = seg[i + 1];
    const dx = seg[i + 2] - ax;
    const dy = seg[i + 3] - ay;
    const len2 = dx * dx + dy * dy;
    let q = len2 > 0 ? ((x - ax) * dx + (y - ay) * dy) / len2 : 0;
    q = q < 0 ? 0 : q > 1 ? 1 : q;
    const ex = ax + dx * q - x;
    const ey = ay + dy * q - y;
    const d2 = ex * ex + ey * ey;
    if (d2 < best) best = d2;
  }
  return best;
}

/** How deep a circle at (x, y) reaches into the thing's footprint (> 0: overlapping). */
export function overlap(t, x, y, r) {
  const seg = shapeLines(t);
  if (seg) return r - Math.sqrt(linesDist2(seg, x, y));
  return t.radius + r - Math.hypot(t.x - x, t.y - y);
}

/**
 * 3D ray vs the thing's shape: the horizontal distance along unit (dx, dy),
 * climbing at `slope`, to where it first hits, or -1.
 */
export function rayShape(t, ox, oy, oz, dx, dy, slope) {
  const seg = shapeLines(t);
  if (!seg) return rayCylinder(ox, oy, oz, dx, dy, slope, t.x, t.y, t.radius, t.z, t.z + t.height);
  let best = -1;
  for (let i = 0; i < seg.length; i += 4) {
    const ax = seg[i];
    const ay = seg[i + 1];
    const ex = seg[i + 2] - ax;
    const ey = seg[i + 3] - ay;
    const den = dx * ey - dy * ex;
    if (Math.abs(den) < 1e-12) continue;
    const d = ((ax - ox) * ey - (ay - oy) * ex) / den;
    const q = ((ax - ox) * dy - (ay - oy) * dx) / den;
    if (d < 0 || q < 0 || q > 1) continue;
    const z = oz + slope * d;
    if (z < t.z || z > t.z + t.height) continue;
    if (best < 0 || d < best) best = d;
  }
  return best;
}
