// A painter for big levels on the fine grid. Instead of typing a large ASCII
// grid, a level paints areas in code: rooms, corridors, chamfered corners,
// angled pillars, doors and lifts. Each cell is a plain legend entry (a wall,
// a floor with its own heights and light, a door, a lift...). `build()` dedupes
// the cells into legend glyphs and returns the ordinary `tiles` and `legend`
// of a level, so the engine, validator and map viewer see a normal level.
//
//   const p = new Painter(128, 100, { wall: 'canyon-rock' });
//   p.rect(10, 10, 30, 20, { floor: 'sand', ceiling: 'sky', ceilZ: 24 });
//   p.chamfer(10, 10, 30, 20, 3, { wall: 'canyon-rock' });
//   export default defineLevel({ id: 'm3', ...p.build(), list: [...] });

/** Glyphs for generated legend entries: printable ASCII, then Latin letters. */
const POOL = (() => {
  const out = [];
  for (let c = 33; c < 127; c++) out.push(String.fromCharCode(c));
  for (let c = 0xc0; c < 0x250; c++) if (c !== 0xd7 && c !== 0xf7) out.push(String.fromCharCode(c));
  return out;
})();

const CORNERS = ['NW', 'NE', 'SW', 'SE'];

export class Painter {
  /**
   * @param {number} w width in tiles
   * @param {number} h height in tiles
   * @param {object} fill the cell everything starts as (usually a wall)
   */
  constructor(w, h, fill) {
    this.w = w;
    this.h = h;
    this.cells = new Array(w * h).fill(fill);
  }

  get(x, y) {
    return x >= 0 && y >= 0 && x < this.w && y < this.h ? this.cells[y * this.w + x] : null;
  }

  set(x, y, cell) {
    if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.cells[y * this.w + x] = cell;
  }

  /** Fill the box x0 <= x < x1, y0 <= y < y1. `cell` may be a function (x, y, old) => cell. */
  rect(x0, y0, x1, y1, cell) {
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) this.set(x, y, typeof cell === 'function' ? cell(x, y, this.get(x, y)) : cell);
    }
    return this;
  }

  /**
   * Relight the open tiles of a box (a pool of light, a dark corner): they get
   * `light` and the fields in `extra` (say a `lightFx`). Walls and doors keep
   * theirs; angled walls are relit, as they stand on a floor.
   */
  light(x0, y0, x1, y1, light, extra = {}) {
    return this.rect(x0, y0, x1, y1, (x, y, old) => ((old.wall && !old.diagonal) || old.door ? old : { ...old, light, ...extra }));
  }

  /**
   * A round pool of light centred on (cx, cy) (in tiles, so 20.5 is a tile's
   * middle): open tiles within `r` brighten toward `light` at the middle,
   * fading smoothly to their own light at the rim (in steps of 8, to keep the
   * glyphs few). Tiles it brightens also get `extra`: say a `lightFx` with a
   * `lightSync` name, so the whole pool pulses as one.
   */
  pool(cx, cy, r, light, extra = {}) {
    return this.rect(Math.floor(cx - r), Math.floor(cy - r), Math.ceil(cx + r), Math.ceil(cy + r), (x, y, old) => {
      if ((old.wall && !old.diagonal) || old.door) return old;
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      if (d >= r) return old;
      const base = old.light ?? 160;
      const t = 1 - d / r;
      const l = Math.round((base + (light - base) * t * t * (3 - 2 * t)) / 8) * 8;
      return l > base ? { ...old, light: Math.min(255, l), ...extra } : old;
    });
  }

  /**
   * Put a fence (`{ tex, height? }`: a railing, bars, a grate) on the `edges`
   * ('N', 'NE'...) of every open tile in a box. Edges a tile already fences
   * are kept; a tile holds one fence texture.
   */
  fence(x0, y0, x1, y1, edges, fence) {
    return this.rect(x0, y0, x1, y1, (x, y, old) => {
      if ((old.wall && !old.diagonal) || old.door) return old;
      const have = old.fence?.edges ?? '';
      return { ...old, fence: { ...fence, edges: [...'NESW'].filter((c) => have.includes(c) || edges.includes(c)).join('') } };
    });
  }

  /**
   * Cut the corners of an open box with 45° angled walls, `n` tiles deep:
   * tiles on the diagonal get an angled wall of `wall` (keeping their floor),
   * and tiles beyond it become solid. `corners` picks which (default all).
   */
  chamfer(x0, y0, x1, y1, n, wall, corners = CORNERS) {
    for (const c of corners) this._corner(x0, y0, x1, y1, n, c, (floor) => ({ ...floor, ...wall, diagonal: c }), () => wall);
    return this;
  }

  /**
   * A solid block (a pillar, a column, a rock spire) whose corners are cut
   * by 45° angled walls `n` tiles deep, standing on `floor`.
   */
  pillar(x0, y0, x1, y1, n, wall, floor) {
    this.rect(x0, y0, x1, y1, wall);
    // A block's cut corner: the open side is the outside, so the solid corner is the opposite one.
    const opposite = { NW: 'SE', NE: 'SW', SW: 'NE', SE: 'NW' };
    for (const c of CORNERS) this._corner(x0, y0, x1, y1, n, c, () => ({ ...floor, ...wall, diagonal: opposite[c] }), () => floor);
    return this;
  }

  /** Paint corner `c` of a box: `onLine` for tiles on the diagonal, `beyond` for tiles past it (towards the corner). */
  _corner(x0, y0, x1, y1, n, c, onLine, beyond) {
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n - j; i++) {
        const x = c.endsWith('W') ? x0 + i : x1 - 1 - i;
        const y = c.startsWith('N') ? y0 + j : y1 - 1 - j;
        this.set(x, y, i + j === n - 1 ? onLine(this.get(x, y)) : beyond(this.get(x, y)));
      }
    }
  }

  /**
   * Stairs over a box: the floor climbs by `rise` per tile from `z0`, going
   * in `dir` ('N', 'S', 'E' or 'W'). `cell(z)` makes the cell for a height.
   */
  stairs(x0, y0, x1, y1, dir, z0, rise, cell) {
    return this.rect(x0, y0, x1, y1, (x, y) => {
      const k = { E: x - x0, W: x1 - 1 - x, S: y - y0, N: y1 - 1 - y }[dir];
      return cell(z0 + k * rise);
    });
  }

  /** The level's `tiles` and `legend`: one glyph per distinct cell. */
  build() {
    const legend = {};
    const glyphs = new Map();
    let next = 0;
    const tiles = [];
    for (let y = 0; y < this.h; y++) {
      let row = '';
      for (let x = 0; x < this.w; x++) {
        const cell = this.cells[y * this.w + x];
        const key = JSON.stringify(cell);
        let g = glyphs.get(key);
        if (!g) {
          g = POOL[next++];
          if (!g) throw new Error('Painter: too many different cells for the glyph pool');
          glyphs.set(key, g);
          legend[g] = cell;
        }
        row += g;
      }
      tiles.push(row);
    }
    return { tiles, legend };
  }
}
