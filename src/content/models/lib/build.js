// Builds low-poly models in code, the way the painter builds levels. Every
// primitive is convex, so its faces are wound outward automatically (each
// face's normal is turned away from the primitive's centre).
//
//   const m = new ModelBuilder('console');
//   m.box([-0.4, -0.3, 0], [0.4, 0.3, 0.9], { color: ['gray', 0.3], top: { color: ['steel', 0.6] } });
//   m.cylinder([0, 0, 0.9], 0.1, 0.3, { segments: 8, color: ['gray', 0.5] });
//   export default m.build();
//
// Units are world units (tiles); x east, y south, z up at angle 0, the origin
// on the floor under the thing. A face style is `{ color }` ([ramp, 0..1] or
// [r, g, b]) or `{ tex }` (a texture, projected onto the face at the walls'
// scale and kept upright; `texScale` enlarges it, `texOffset: [u, v]` shifts
// it, in world units; or `uv`, one [u, v] per point of a face(), in repeats
// of the texture), plus `glow`, `flat` and `twoSided`. `false` leaves the face out.
import { defineModel } from '../../../engine/defs.js';

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const centre = (pts) => pts.reduce((s, p) => [s[0] + p[0] / pts.length, s[1] + p[1] / pts.length, s[2] + p[2] / pts.length], [0, 0, 0]);

export class ModelBuilder {
  constructor(id) {
    this.id = id;
    this.vertices = [];
    this.faces = [];
    this.lines = [];
    this._index = new Map();
  }

  _vertex(p) {
    const key = p.map((c) => c.toFixed(5)).join(',');
    let i = this._index.get(key);
    if (i === undefined) {
      i = this.vertices.length;
      this.vertices.push(p.map((c) => +c.toFixed(5)));
      this._index.set(key, i);
    }
    return i;
  }

  /**
   * A convex polygon. With `inside` (a point), it's wound to face away from
   * it; otherwise the points' order is kept.
   */
  face(points, style, inside = null) {
    if (style === false) return this;
    let pts = points;
    if (inside) {
      const n = cross(sub(pts[1], pts[0]), sub(pts[2], pts[0]));
      if (dot(n, sub(centre(pts), inside)) < 0) pts = [...pts].reverse();
    }
    const f = { v: pts.map((p) => this._vertex(p)) };
    if (style.tex && style.uv) {
      // Given per point, in repeats of the texture (in the order passed in).
      f.tex = style.tex;
      f.uv = pts === points ? style.uv : [...style.uv].reverse();
    } else if (style.tex) {
      f.tex = style.tex;
      f.uvw = planarUV(pts, style.texScale ?? 1, style.texOffset ?? [0, 0]);
    } else f.color = style.color;
    if (style.glow) f.glow = true;
    if (style.twoSided) f.twoSided = true;
    if (style.flat) f.flat = true;
    this.faces.push(f);
    return this;
  }

  /**
   * A convex prism: the polygon `outline` extruded from `from` to `to` along
   * `style.axis` ('z' by default; the outline is then [x, y] points, for 'x'
   * it's [y, z] and for 'y' [x, z]). Styles: `top` (the `to` end), `bottom`,
   * `sides` (or `side(i)` for edge i), each over the base `style`.
   */
  prism(outline, from, to, style = {}) {
    return this.loft(outline, from, outline, to, style);
  }

  /**
   * A convex solid between two outlines of the same number of points: `a` at
   * `from` and `b` at `to` along `style.axis` (a tapered nose, a frustum).
   * Styles as for prism().
   */
  loft(a, from, b, to, style = {}) {
    const place = axisPlacer(style.axis ?? 'z');
    const lo = a.map(([u, v]) => place(u, v, from));
    const hi = b.map(([u, v]) => place(u, v, to));
    const mid = centre([...lo, ...hi]);
    this.face(hi, pick(style, 'top'), mid);
    this.face(lo, pick(style, 'bottom'), mid);
    for (let i = 0; i < a.length; i++) {
      const j = (i + 1) % a.length;
      const s = style.side?.(i) ?? pick(style, 'sides');
      this.face([lo[i], lo[j], hi[j], hi[i]], s, mid);
    }
    return this;
  }

  /** An axis-aligned box between two corners. */
  box([x0, y0, z0], [x1, y1, z1], style = {}) {
    return this.prism([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], z0, z1, style);
  }

  /**
   * A cylinder of `radius` from `base` along `axis` ('x', 'y' or 'z') for
   * `length`, with `segments` sides (default 8). The end caps are `top` and
   * `bottom` (the far and near end for 'x' and 'y').
   */
  cylinder(base, radius, length, style = {}) {
    const sides = style.segments ?? 8;
    const axis = style.axis ?? 'z';
    const turn = style.turn ?? 0;
    const ring = [];
    for (let i = 0; i < sides; i++) {
      const a = turn + (i / sides) * Math.PI * 2;
      ring.push([Math.cos(a) * radius, Math.sin(a) * radius]);
    }
    const place = axisPlacer(axis);
    const at = (a, b, h) => {
      const p = place(a, b, h);
      return [p[0] + base[0], p[1] + base[1], p[2] + base[2]];
    };
    const lo = ring.map(([a, b]) => at(a, b, 0));
    const hi = ring.map(([a, b]) => at(a, b, length));
    const mid = centre([...lo, ...hi]);
    this.face(hi, pick(style, 'top'), mid);
    this.face(lo, pick(style, 'bottom'), mid);
    for (let i = 0; i < sides; i++) {
      const j = (i + 1) % sides;
      this.face([lo[i], lo[j], hi[j], hi[i]], pick(style, 'sides'), mid);
    }
    return this;
  }

  /** A collision wall segment in model space. */
  line(x0, y0, x1, y1) {
    this.lines.push([x0, y0, x1, y1]);
    return this;
  }

  /** Collision walls around a convex outline. */
  outlineLines(outline) {
    for (let i = 0; i < outline.length; i++) {
      const [a, b] = [outline[i], outline[(i + 1) % outline.length]];
      this.line(a[0], a[1], b[0], b[1]);
    }
    return this;
  }

  build() {
    return defineModel({ id: this.id, vertices: this.vertices, faces: this.faces, lines: this.lines });
  }
}

/** Maps (a, b) in the plane across an axis, and h along it, to [x, y, z]. */
function axisPlacer(axis) {
  if (axis === 'x') return (a, b, h) => [h, a, b];
  if (axis === 'y') return (a, b, h) => [a, h, b];
  return (a, b, h) => [a, b, h];
}

/** A face style: `style[part]` over the base style (false leaves the face out). */
function pick(style, part) {
  const own = style[part];
  if (own === false) return false;
  const { top, bottom, sides, side, axis, segments, turn, ...base } = style;
  return { ...base, ...own };
}

/**
 * Texture coordinates in world units, projected onto the face's plane: on
 * upright faces u runs along the face and v down from z = 0 (textures stay
 * upright and line up with walls); flat faces use x and y.
 */
function planarUV(pts, scale, [ou, ov]) {
  const n = cross(sub(pts[1], pts[0]), sub(pts[2], pts[0]));
  const flat = Math.abs(n[2]) > Math.hypot(n[0], n[1]);
  let ua;
  let va;
  if (flat) {
    ua = [1, 0, 0];
    va = [0, 1, 0];
  } else {
    const h = [n[0], n[1], 0];
    const hl = Math.hypot(h[0], h[1]);
    ua = [-h[1] / hl, h[0] / hl, 0];
    va = [0, 0, -1];
  }
  return pts.map((p) => [dot(p, ua) / scale + ou, dot(p, va) / scale + ov]);
}
