/**
 * Blend tables for translucent drawing into the 8-bit framebuffer: 256 x 256
 * entries, `table[(src << 8) | dst]` is the palette colour nearest to the two
 * colours mixed (an exact search; both mixes are symmetric, so half the
 * pairs). Built once per palette (64 KB each, about 40 ms): the game builds
 * them while loading (Renderer.prepare).
 *
 * - `add`: src + dst, clamped (glows: sparks, fire)
 * - `half`: the average (smoke, steam, glass)
 */
const cache = new WeakMap();

/**
 * @param {import('./palette.js').Palette} palette
 * @param {'add'|'half'} mode
 * @returns {Uint8Array}
 */
export function blendTable(palette, mode) {
  let tables = cache.get(palette);
  if (!tables) cache.set(palette, (tables = {}));
  if (tables[mode]) return tables[mode];
  const rgb = palette.rgb;
  const out = new Uint8Array(65536);
  const add = mode === 'add';
  const memo = new Map();
  for (let s = 0; s < 256; s++) {
    const sr = rgb[s * 3];
    const sg = rgb[s * 3 + 1];
    const sb = rgb[s * 3 + 2];
    for (let d = s; d < 256; d++) {
      const dr = rgb[d * 3];
      const dg = rgb[d * 3 + 1];
      const db = rgb[d * 3 + 2];
      let r, g, b;
      if (add) {
        r = Math.min(255, sr + dr);
        g = Math.min(255, sg + dg);
        b = Math.min(255, sb + db);
      } else {
        r = (sr + dr) >> 1;
        g = (sg + dg) >> 1;
        b = (sb + db) >> 1;
      }
      const key = (r << 16) | (g << 8) | b;
      let c = memo.get(key);
      if (c === undefined) {
        c = palette.nearest(r, g, b);
        memo.set(key, c);
      }
      out[(s << 8) | d] = c;
      out[(d << 8) | s] = c;
    }
  }
  tables[mode] = out;
  return out;
}
