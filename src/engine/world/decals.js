import { EDGES } from './tilemap.js';
import { segDist2 } from './slants.js';
import { TEXELS_PER_UNIT as TPU } from '../config.js';

/**
 * Decals: see-through textures on wall faces and step faces (signs, the
 * Imperial crest, hazard stripes, vents). A level lists them as
 * `decals: [{ x, y, z, face, tex, scale?, glow?, flip? }]`: `face` is the way
 * the face looks ('N', 'E', 'S' or 'W'), (x, y) a point on that face's tile
 * edge (the decal's middle along it), `z` the height of its middle. Its size
 * is its texture's (TEXELS_PER_UNIT, 32 texels a tile: 64 is a metre) times
 * `scale`. `glow` ignores light;
 * `flip` mirrors it.
 *
 * `face: 'angled'` puts one on an angled wall (slants.js) instead: the one
 * nearest (x, y), within a tile, its middle where (x, y) is along it. On a
 * curve whose tiles' textures run on (`wallU`), it runs on round the curve
 * too; otherwise it stops at its tile's edge.
 *
 * Each decal is laid out on the tile edges it covers once its texture's size
 * is known (`layoutDecals`, by the renderer): `map.edgeDecals` maps an edge
 * (tile * 4 + face) to the decals on it, and `map.decalEdge` counts them;
 * `map.slantDecals` maps an angled wall's tile to the decals on it.
 */

/** A decal from a level's spec, or an error message. */
export function makeDecal(map, spec, slot) {
  const angled = spec.face === 'angled';
  const face = angled ? -1 : EDGES.indexOf(String(spec.face ?? '').toUpperCase());
  if (!angled && (face < 0 || String(spec.face).length !== 1)) return `needs a "face": 'N', 'E', 'S' or 'W' (the way it looks), or 'angled'`;
  if (![spec.x, spec.y, spec.z].every((v) => typeof v === 'number')) return 'needs an "x", a "y" and a "z"';
  if (!spec.tex) return 'needs a "tex"';
  if (spec.scale !== undefined && !(spec.scale > 0)) return '"scale" must be above 0';
  const d = { tex: slot(spec.tex), face, x: spec.x, y: spec.y, z: spec.z, scale: spec.scale ?? 1, glow: !!spec.glow, flip: !!spec.flip, edges: null };
  if (angled) {
    const sl = nearestSlant(map, spec.x, spec.y);
    if (!sl) return `at (${spec.x}, ${spec.y}) is 'angled' but has no angled wall within a tile`;
    // Where (x, y) is along it, in its texture's units (as the renderer runs them, from b).
    const s = ((spec.x - sl.ax) * sl.ex + (spec.y - sl.ay) * sl.ey) / (sl.len * sl.len);
    d.slant = sl;
    d.u = sl.u + (1 - Math.min(1, Math.max(0, s))) * sl.len;
    return d;
  }
  const [tx, ty] = ownerTile(d, Math.floor(d.face === 0 || d.face === 2 ? d.x : d.y));
  if (!map.inBounds(tx, ty)) return `at (${spec.x}, ${spec.y}) faces ${EDGES[face]} from outside the map`;
  return d;
}

/** The angled wall nearest (x, y) in the tiles round it, within a tile, or null. */
function nearestSlant(map, x, y) {
  let best = null;
  let bestD = 1;
  for (let ty = Math.floor(y) - 1; ty <= Math.floor(y) + 1; ty++) {
    for (let tx = Math.floor(x) - 1; tx <= Math.floor(x) + 1; tx++) {
      const sl = map.inBounds(tx, ty) ? map.slantAt(tx, ty) : null;
      if (!sl) continue;
      const d2 = segDist2(x, y, sl.ax, sl.ay, sl.bx, sl.by);
      if (d2 <= bestD) [best, bestD] = [sl, d2];
    }
  }
  return best;
}

/**
 * The angled wall chained on from `sl` toward `toA` (its first point) or
 * away (its second): in a tile round it, sharing that end, its texture
 * running on from this one's.
 */
function chained(map, sl, toA) {
  const [px, py] = toA ? [sl.ax, sl.ay] : [sl.bx, sl.by];
  for (let ty = sl.ty - 1; ty <= sl.ty + 1; ty++) {
    for (let tx = sl.tx - 1; tx <= sl.tx + 1; tx++) {
      const n = (tx !== sl.tx || ty !== sl.ty) && map.inBounds(tx, ty) ? map.slantAt(tx, ty) : null;
      if (!n) continue;
      const [qx, qy] = toA ? [n.bx, n.by] : [n.ax, n.ay];
      if (Math.abs(qx - px) > 1e-6 || Math.abs(qy - py) > 1e-6) continue;
      if (Math.abs(toA ? n.u - (sl.u + sl.len) : n.u + n.len - sl.u) < 1e-3) return n;
    }
  }
  return null;
}

/** Add a decal (laid out at the next layout). */
export function addDecal(map, d) {
  map.decals.push(d);
  map.decalsDirty = true;
}

/**
 * The tile whose face a decal is on, at tile `a` along the edge: the face
 * runs along the tile edge nearest (x, y), and belongs to the tile behind
 * it (a face looking north is a tile's north face).
 */
function ownerTile(d, a) {
  if (d.face === 0 || d.face === 2) {
    const line = Math.round(d.y);
    return [a, d.face === 0 ? line : line - 1];
  }
  const line = Math.round(d.x);
  return [d.face === 3 ? line : line - 1, a];
}

/**
 * Lay out the decals not yet placed, now their textures' sizes are known:
 * their extent along the edge (a0 to a1) and up (z0 to z1), and the edges
 * they cover.
 */
export function layoutDecals(map, textures) {
  for (const d of map.decals) {
    if (d.edges) continue;
    const tex = textures[d.tex];
    const w = ((tex?.w ?? TPU) / TPU) * d.scale;
    const h = ((tex?.h ?? TPU) / TPU) * d.scale;
    const mid = d.slant ? d.u : d.face === 0 || d.face === 2 ? d.x : d.y;
    d.a0 = mid - w / 2;
    d.a1 = mid + w / 2;
    d.z0 = d.z - h / 2;
    d.z1 = d.z + h / 2;
    d.edges = [];
    if (d.slant) {
      // Its tile's wall, and on along the chain each way while it covers them.
      for (const toA of [true, false]) {
        for (let sl = toA ? d.slant : chained(map, d.slant, false), k = 0; sl && k < map.w * map.h; sl = chained(map, sl, toA), k++) {
          if (sl.u >= d.a1 || sl.u + sl.len <= d.a0) break;
          const i = sl.ty * map.w + sl.tx;
          if (!map.slantDecals.has(i)) map.slantDecals.set(i, []);
          map.slantDecals.get(i).push(d);
          d.edges.push(i);
        }
      }
      continue;
    }
    for (let a = Math.floor(d.a0); a < d.a1; a++) {
      const [tx, ty] = ownerTile(d, a);
      if (!map.inBounds(tx, ty)) continue;
      const e = (ty * map.w + tx) * 4 + d.face;
      if (!map.edgeDecals.has(e)) map.edgeDecals.set(e, []);
      map.edgeDecals.get(e).push(d);
      map.decalEdge[e]++;
      d.edges.push(e);
    }
  }
  map.decalsDirty = false;
}
