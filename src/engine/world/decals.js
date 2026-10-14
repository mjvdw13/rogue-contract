import { EDGES } from './tilemap.js';
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
 * Each decal is laid out on the tile edges it covers once its texture's size
 * is known (`layoutDecals`, by the renderer): `map.edgeDecals` maps an edge
 * (tile * 4 + face) to the decals on it, and `map.decalEdge` counts them.
 */

/** A decal from a level's spec, or an error message. */
export function makeDecal(map, spec, slot) {
  const face = EDGES.indexOf(String(spec.face ?? '').toUpperCase());
  if (face < 0 || String(spec.face).length !== 1) return `needs a "face": 'N', 'E', 'S' or 'W' (the way it looks)`;
  if (![spec.x, spec.y, spec.z].every((v) => typeof v === 'number')) return 'needs an "x", a "y" and a "z"';
  if (!spec.tex) return 'needs a "tex"';
  if (spec.scale !== undefined && !(spec.scale > 0)) return '"scale" must be above 0';
  const d = { tex: slot(spec.tex), face, x: spec.x, y: spec.y, z: spec.z, scale: spec.scale ?? 1, glow: !!spec.glow, flip: !!spec.flip, edges: null };
  const [tx, ty] = ownerTile(d, Math.floor(d.face === 0 || d.face === 2 ? d.x : d.y));
  if (!map.inBounds(tx, ty)) return `at (${spec.x}, ${spec.y}) faces ${EDGES[face]} from outside the map`;
  return d;
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
    const mid = d.face === 0 || d.face === 2 ? d.x : d.y;
    d.a0 = mid - w / 2;
    d.a1 = mid + w / 2;
    d.z0 = d.z - h / 2;
    d.z1 = d.z + h / 2;
    d.edges = [];
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
