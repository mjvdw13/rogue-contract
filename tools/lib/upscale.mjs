// Doubles (or k-times) the resolution of an ASCII level: each tile becomes a
// k x k block, heights scale by k, and things move to the matching spot. Used
// to bring maps drawn for the old 1-tile = 1-metre grid over to the finer
// grid (PLAN.md, Phase 1b A5), by tools/upscale-map.mjs and by tests.
//
// Angled walls are split properly: each sub-tile the wall line crosses gets
// its own (shorter) line, sub-tiles on the solid side become plain wall, and
// the rest become open floor. Fences stay on the sub-tiles along their edges.
// Those need new legend glyphs, which are added.
//
// Not converted: a level's own `fog` is per tile, so halve it by hand.
import { resolveLegend } from '../../src/engine/world/level.js';
import { slantLine, DIAGONALS } from '../../src/engine/world/slants.js';

const SPARE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ';

/** Scale the height fields of one legend entry. */
function scaleEntry(e, k) {
  const out = { ...e };
  for (const key of ['floorZ', 'ceilZ']) if (typeof out[key] === 'number') out[key] *= k;
  if (out.lift) out.lift = { ...out.lift, stops: out.lift.stops?.map((z) => z * k) };
  if (out.slab) out.slab = { ...out.slab, bottom: out.slab.bottom * k, top: out.slab.top * k };
  if (out.bands) out.bands = [].concat(out.bands).map((b) => ({ ...b, ...(b.from !== undefined && { from: b.from * k }), ...(b.to !== undefined && { to: b.to * k }) }));
  return out;
}

/** Clip segment a->b to the unit square at (sx, sy). Returns tile-local [ax, ay, bx, by] or null. */
function clipToSquare(ax, ay, bx, by, sx, sy) {
  let t0 = 0;
  let t1 = 1;
  const dx = bx - ax;
  const dy = by - ay;
  for (const [p, q] of [[-dx, ax - sx], [dx, sx + 1 - ax], [-dy, ay - sy], [dy, sy + 1 - ay]]) {
    if (Math.abs(p) < 1e-12) {
      if (q < 0) return null;
    } else {
      const r = q / p;
      if (p < 0) t0 = Math.max(t0, r);
      else t1 = Math.min(t1, r);
    }
  }
  if (t1 - t0 < 1e-9) return null;
  const snap = (v) => Math.round(v * 1e6) / 1e6;
  const line = [ax + dx * t0 - sx, ay + dy * t0 - sy, ax + dx * t1 - sx, ay + dy * t1 - sy].map(snap);
  return Math.hypot(line[2] - line[0], line[3] - line[1]) > 1e-6 ? line : null;
}

/**
 * @param {*} registry the content registry (for the shared legend)
 * @param {*} level a level definition
 * @param {number} [k] the factor (2 doubles the resolution)
 * @returns {*} a new level definition
 */
export function upscaleLevel(registry, level, k = 2) {
  const { tiles: resolved } = resolveLegend(registry, level);
  const legend = {};
  for (const [g, e] of Object.entries(level.legend ?? {})) legend[g] = scaleEntry(e, k);

  const used = new Set([...Object.keys(registry.tileLegend ?? {}), ...Object.keys(legend), ...level.tiles.join('')]);
  const spare = [...SPARE].filter((c) => !used.has(c));
  const made = new Map();
  /** A glyph for a generated legend entry (deduplicated). */
  const glyphFor = (entry) => {
    const key = JSON.stringify(entry);
    if (!made.has(key)) {
      const g = spare.shift();
      if (!g) throw new Error('Ran out of spare legend glyphs');
      made.set(key, g);
      legend[g] = entry;
    }
    return made.get(key);
  };

  /** The sub-tile glyph at (sx, sy) inside an angled-wall tile `g`. */
  const slantPart = (g, e, sx, sy) => {
    const line = slantLine(e);
    if (typeof line === 'string') return g;
    const [ax, ay, bx, by] = line.map((v) => v * k);
    const part = clipToSquare(ax, ay, bx, by, sx, sy);
    const { diagonal, line: _l, ...rest } = scaleEntry(e, k);
    if (part) {
      const preset = Object.entries(DIAGONALS).find(([, d]) => d.every((v, i) => Math.abs(v - part[i]) < 1e-9));
      if (preset && diagonal !== undefined && preset[0] === String(diagonal).toUpperCase()) return g;
      return glyphFor(preset ? { ...rest, diagonal: preset[0] } : { ...rest, line: part });
    }
    // Which side of the line is this sub-tile? (Solid is on the right of a -> b, y down.)
    const ex = bx - ax;
    const ey = by - ay;
    const side = (sx + 0.5 - ax) * -ey + (sy + 0.5 - ay) * ex;
    if (side > 0) return glyphFor({ wall: e.wall });
    const { wall, ...floor } = rest;
    return glyphFor(floor);
  };

  /** The sub-tile glyph at (sx, sy) inside a fenced tile `g`: only edges on the block's outside stay. */
  const fencePart = (g, e, sx, sy) => {
    const at = { N: sy === 0, S: sy === k - 1, W: sx === 0, E: sx === k - 1 };
    const edges = [...String(e.fence.edges ?? '').toUpperCase()].filter((c) => at[c]).join('');
    const { fence, ...rest } = scaleEntry(e, k);
    if (!edges) return glyphFor(rest);
    return glyphFor({ ...rest, fence: { ...fence, edges, ...(fence.height ? { height: fence.height * k } : {}) } });
  };

  const tiles = [];
  level.tiles.forEach((row) => {
    for (let sy = 0; sy < k; sy++) {
      let out = '';
      [...row].forEach((g) => {
        const e = resolved[g];
        const slanted = e && e.wall && (e.diagonal !== undefined || e.line !== undefined);
        for (let sx = 0; sx < k; sx++) out += slanted ? slantPart(g, e, sx, sy) : e?.fence ? fencePart(g, e, sx, sy) : g;
      });
      tiles.push(out);
    }
  });

  const grow = (rows) =>
    rows?.flatMap((row) => {
      const wide = [...row].map((c) => c.repeat(k)).join('');
      return Array.from({ length: k }, () => wide);
    });
  // Things go to the block's middle: the tile just right of and below its centre.
  const things = [];
  (level.things ?? []).forEach((row, y) => {
    [...row].forEach((c, x) => {
      if (c === ' ') return;
      const ty = y * k + (k >> 1);
      const tx = x * k + (k >> 1);
      while (things.length <= ty) things.push('');
      things[ty] = things[ty].padEnd(tx, ' ');
      things[ty] = things[ty].slice(0, tx) + c + things[ty].slice(tx + 1);
    });
  });

  const out = { ...level, tiles, legend, things };
  if (level.floorHeights) out.floorHeights = grow(level.floorHeights);
  if (level.ceilHeights) out.ceilHeights = grow(level.ceilHeights);
  if (level.heightStep !== undefined) out.heightStep = level.heightStep * k;
  if (level.heightBase !== undefined) out.heightBase = level.heightBase * k;
  if (level.defaults) out.defaults = scaleEntry(level.defaults, k);
  if (level.list) out.list = level.list.map((t) => ({ ...t, x: t.x * k, y: t.y * k }));
  return out;
}
