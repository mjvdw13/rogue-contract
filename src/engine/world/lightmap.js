import { F_SOLID, F_SLAB, F_DOOR } from './tilemap.js';
import { falloff } from './lightsources.js';

/**
 * Smooth light. A tile's light is a sample at its centre, and light anywhere
 * is interpolated (bilinearly) between the four tile centres round it, so a
 * pool of light fades into the floor round it instead of ending in a square.
 * Light doesn't leak through walls: where one of the four samples is a wall,
 * it takes the average of the open ones beside it (less `occlusion`, which
 * darkens the light toward walls). There's one set of samples per storey: the
 * lower storey under a slab has its own light. Light sources (lightsources.js)
 * add to the tiles round them, and so do dynamic lights (muzzle flashes,
 * bolts, explosions: `setDynamic`, each frame).
 *
 * Each cell (the square between four tile centres) keeps its four samples, so
 * a lookup is a single bilinear blend. When tiles change light (light effects,
 * `setLight`), `touch` them and `update` recomputes the cells round them.
 */
export class LightMap {
  /**
   * @param {import('./tilemap.js').TileMap} map
   * @param {{occlusion?: number}} [opts] occlusion: how much darker (light
   *   units) the light gets toward a wall, at the wall's centre
   */
  constructor(map, { occlusion = 0 } = {}) {
    this.map = map;
    this.occlusion = occlusion;
    /** Cells are (w + 1) x (h + 1): cell (cx, cy) lies between tile centres cx - 1..cx and cy - 1..cy. */
    this.cw = map.w + 1;
    this.ch = map.h + 1;
    const n = this.cw * this.ch;
    this.cells = [new Float32Array(n * 4), new Float32Array(n * 4)];
    this.pending = [];
    this.stamp = new Uint32Array(n);
    this.gen = 0;
    // Dynamic light: this frame's, per storey, the tiles it's in, and the flood fill's state.
    const tiles = map.w * map.h;
    this.dyn = [new Float32Array(tiles), new Float32Array(tiles)];
    this.dynTiles = [];
    this.seen = new Uint32Array(tiles);
    this.floodGen = 0;
    this.queue = [];
    for (let cy = 0; cy < this.ch; cy++) for (let cx = 0; cx < this.cw; cx++) this._cell(cx, cy);
  }

  /** Tile (tx, ty)'s light in storey s, or -1 for a wall or outside the map. */
  _tile(tx, ty, s) {
    const map = this.map;
    if (tx < 0 || ty < 0 || tx >= map.w || ty >= map.h) return -1;
    const i = ty * map.w + tx;
    const f = map.flags[i];
    if (f & F_SOLID) return -1;
    const l = (s || !(f & F_SLAB) ? map.light[i] : map.light[i] + map.belowLight[i]) + map.srcLight[s][i] + this.dyn[s][i];
    return l < 0 ? 0 : l > 255 ? 255 : l;
  }

  _cell(cx, cy) {
    const k = (cy * this.cw + cx) * 4;
    for (let s = 0; s < 2; s++) {
      const v = this.cells[s];
      const a = this._tile(cx - 1, cy - 1, s);
      const b = this._tile(cx, cy - 1, s);
      const c = this._tile(cx - 1, cy, s);
      const d = this._tile(cx, cy, s);
      let sum = 0;
      let n = 0;
      for (const l of [a, b, c, d]) {
        if (l >= 0) {
          sum += l;
          n++;
        }
      }
      const fill = n ? Math.max(0, sum / n - this.occlusion) : 0;
      v[k] = a >= 0 ? a : fill;
      v[k + 1] = b >= 0 ? b : fill;
      v[k + 2] = c >= 0 ? c : fill;
      v[k + 3] = d >= 0 ? d : fill;
    }
  }

  /** Tile index i's light changed: recompute the cells round it at the next update. */
  touch(i) {
    this.pending.push(i);
  }

  /** Recompute the cells round every touched tile. */
  update() {
    if (!this.pending.length) return;
    const w = this.map.w;
    const gen = ++this.gen;
    for (const i of this.pending) {
      const tx = i % w;
      const ty = (i / w) | 0;
      for (let cy = ty; cy <= ty + 1; cy++) {
        for (let cx = tx; cx <= tx + 1; cx++) {
          const c = cy * this.cw + cx;
          if (this.stamp[c] === gen) continue;
          this.stamp[c] = gen;
          this._cell(cx, cy);
        }
      }
    }
    this.pending.length = 0;
  }

  /**
   * Set this frame's dynamic lights, replacing the last frame's:
   * `[{ x, y, z, radius, light }]`. Each spreads through open tiles (not
   * through walls or shut doors) to the tiles within its radius, fading like
   * a light source; under a slab it lights the storey its `z` is in.
   */
  setDynamic(lights) {
    const [d0, d1] = this.dyn;
    for (const i of this.dynTiles) {
      d0[i] = 0;
      d1[i] = 0;
      this.touch(i);
    }
    this.dynTiles.length = 0;
    for (const l of lights) this._flood(l);
  }

  _flood({ x, y, z = 0, radius: r, light }) {
    const map = this.map;
    const w = map.w;
    const tx = Math.floor(x);
    const ty = Math.floor(y);
    if (!map.inBounds(tx, ty)) return;
    const [d0, d1] = this.dyn;
    const { seen, queue } = this;
    const mark = ++this.floodGen;
    queue.length = 0;
    queue.push(ty * w + tx);
    seen[ty * w + tx] = mark;
    for (let q = 0; q < queue.length; q++) {
      const i = queue[q];
      const cx = i % w;
      const cy = (i / w) | 0;
      const f = map.flags[i];
      const add = light * falloff(Math.hypot(cx + 0.5 - x, cy + 0.5 - y), r);
      if (add > 0) {
        if (!d0[i] && !d1[i]) this.dynTiles.push(i);
        const storey = f & F_SLAB ? (z >= map.slabTop[i] ? 1 : 0) : 2;
        if (storey !== 1) d0[i] += add;
        if (storey !== 0) d1[i] += add;
        this.touch(i);
      }
      // A shut door is lit, but the light goes no further.
      if (f & F_DOOR && map.doors[map.doorIndex[i]].open < 0.5 && q > 0) continue;
      for (let k = 0; k < 4; k++) {
        const nx = cx + (k === 0 ? 1 : k === 1 ? -1 : 0);
        const ny = cy + (k === 2 ? 1 : k === 3 ? -1 : 0);
        if (nx < 0 || ny < 0 || nx >= w || ny >= map.h) continue;
        const n = ny * w + nx;
        if (seen[n] === mark || map.flags[n] & F_SOLID) continue;
        seen[n] = mark;
        if (Math.hypot(nx + 0.5 - x, ny + 0.5 - y) < r) queue.push(n);
      }
    }
  }

  /** The light at (x, y) in storey s (1: on a slab), interpolated between tile centres. */
  sample(x, y, s = 0) {
    let fx = x - 0.5;
    let fy = y - 0.5;
    if (fx < -0.5) fx = -0.5;
    else if (fx > this.cw - 1.5) fx = this.cw - 1.5;
    if (fy < -0.5) fy = -0.5;
    else if (fy > this.ch - 1.5) fy = this.ch - 1.5;
    const tx = Math.floor(fx);
    const ty = Math.floor(fy);
    const ax = fx - tx;
    const ay = fy - ty;
    const v = this.cells[s];
    const k = ((ty + 1) * this.cw + tx + 1) * 4;
    const top = v[k] + (v[k + 1] - v[k]) * ax;
    const bottom = v[k + 2] + (v[k + 3] - v[k + 2]) * ax;
    return top + (bottom - top) * ay;
  }
}
