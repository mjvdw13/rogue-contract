import { F_SOLID, F_SLAB, LIGHT_FX } from './tilemap.js';
import { lineOfSight } from './physics.js';

/**
 * Placed light sources (lamps, light strips, floodlights). A level lists
 * them as `lights: [{ x, y, z?, radius, light, fx?, min?, sync?, tag? }]`:
 * each adds up to `light` (light units) to the tiles round it, most at its
 * centre and fading smoothly to nothing at `radius` (in tiles). It only
 * reaches tiles whose centres it can see over the grid, so walls and closed
 * doors cast shadows. Under a slab it lights the storey its `z` is in (the
 * lower one without a `z`). A source with an `fx` flickers or pulses like a
 * tile, between `light` and `min` (0 by default: fully off); with a `sync`
 * name it keeps time with the tiles and sources of that `lightSync`.
 *
 * Sources add into the map's `srcLight` (one array per storey), which the
 * light map adds to each tile's own light.
 */

/** How a source's light fades: all of it at its centre, none at its radius. */
export function falloff(d, r) {
  if (d >= r) return 0;
  const q = 1 - (d * d) / (r * r);
  return q * q;
}

/**
 * @typedef {object} LightSource
 * @property {number} x
 * @property {number} y
 * @property {number|undefined} z
 * @property {number} radius
 * @property {number} light its strength: what it adds at its centre, at full
 * @property {number} min the low end of its effect
 * @property {number} fx its effect (a LIGHT_FX code)
 * @property {string|undefined} tag
 * @property {number} group its light-effect group (-1: none)
 * @property {number} cur the strength it adds now
 * @property {{tiles: number[], weights: number[], storeys: number[]}} baked
 */

/**
 * Bake a level's light sources into the map (`map.sources`, `map.srcLight`).
 * `groupOf(sync, fx)` gives the light-effect group of an animated source.
 * Returns the problems with them.
 * @returns {string[]}
 */
export function addSources(map, specs, groupOf) {
  const errors = [];
  (specs ?? []).forEach((s, k) => {
    const where = `Light ${k + 1}${s.tag ? ` ("${s.tag}")` : ''}`;
    const bad = (msg) => errors.push(`${where} ${msg}`);
    if (typeof s.x !== 'number' || typeof s.y !== 'number') return bad('needs an "x" and a "y"');
    const tx = Math.floor(s.x);
    const ty = Math.floor(s.y);
    if (!map.inBounds(tx, ty)) return bad(`at (${s.x}, ${s.y}) is outside the map`);
    if (map.flags[ty * map.w + tx] & F_SOLID) return bad(`at (${s.x}, ${s.y}) is inside a wall`);
    if (!(s.radius > 0)) return bad('needs a "radius" above 0');
    if (typeof s.light !== 'number') return bad('needs a "light" (how much it adds at its centre)');
    if (s.fx !== undefined && LIGHT_FX[s.fx] === undefined) return bad(`has unknown fx "${s.fx}"`);
    const fx = LIGHT_FX[s.fx ?? 'none'];
    /** @type {LightSource} */
    const src = {
      x: s.x,
      y: s.y,
      z: s.z,
      radius: s.radius,
      light: s.light,
      min: Math.min(s.min ?? 0, s.light),
      fx,
      tag: s.tag,
      group: fx ? groupOf(s.sync, fx) : -1,
      cur: s.light,
      baked: bakeSource(map, s),
    };
    applySource(map, src.baked, src.cur);
    map.sources.push(src);
  });
  return errors;
}

/**
 * Bake a source: the tiles it reaches, each one's share of its light (0-1),
 * and the storey it lights in each (0 or 1 in a slab tile, 2 for both
 * elsewhere).
 */
export function bakeSource(map, spec) {
  const { x, y, radius: r } = spec;
  const tiles = [];
  const weights = [];
  const storeys = [];
  for (let ty = Math.floor(y - r); ty <= Math.ceil(y + r); ty++) {
    for (let tx = Math.floor(x - r); tx <= Math.ceil(x + r); tx++) {
      if (!map.inBounds(tx, ty)) continue;
      const i = ty * map.w + tx;
      const f = map.flags[i];
      if (f & F_SOLID) continue;
      const cx = tx + 0.5;
      const cy = ty + 0.5;
      const d = Math.hypot(cx - x, cy - y);
      const w = falloff(d, r);
      if (w < 0.004) continue;
      // (Its own tile always; others only in sight.)
      if (d > 0.75 && !lineOfSight(map, x, y, cx, cy)) continue;
      tiles.push(i);
      weights.push(w);
      storeys.push(f & F_SLAB ? (spec.z !== undefined && spec.z >= map.slabTop[i] ? 1 : 0) : 2);
    }
  }
  return { tiles, weights, storeys };
}

/** Add `amount` of a baked source's light into the map (negative takes it away), touching the light map. */
export function applySource(map, baked, amount, lightmap) {
  if (!amount) return;
  const [s0, s1] = map.srcLight;
  const { tiles, weights, storeys } = baked;
  for (let k = 0; k < tiles.length; k++) {
    const i = tiles[k];
    const add = weights[k] * amount;
    if (storeys[k] !== 1) s0[i] += add;
    if (storeys[k] !== 0) s1[i] += add;
    lightmap?.touch(i);
  }
}
