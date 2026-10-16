/**
 * Blend tables for translucent drawing into the 8-bit framebuffer: 256 x 256
 * entries, `table[(src << 8) | dst]` is the palette colour nearest to the two
 * colours mixed. Built once per palette (64 KB each).
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
  for (let s = 0; s < 256; s++) {
    const sr = rgb[s * 3];
    const sg = rgb[s * 3 + 1];
    const sb = rgb[s * 3 + 2];
    for (let d = 0; d < 256; d++) {
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
      out[(s << 8) | d] = palette.lookup(r, g, b);
    }
  }
  tables[mode] = out;
  return out;
}
