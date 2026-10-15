/**
 * A backdrop: terrain past the edge of play (distant cliffs, mesas and
 * ridges), a coarse height grid drawn wherever the sky would show (see
 * render/backdrop.js), so the skyline has depth: layer behind layer, fading
 * into the haze. It's scenery only; nothing stands on it or hits it.
 *
 * A level gives `backdrop: { x, y, cell, w, h, heights, tex, bands?, light?,
 * moon?, far? }`: the grid's corner (x, y) in tiles, its size in cells of
 * `cell` tiles, and the heights at its (w + 1) x (h + 1) corners, row by
 * row. Its faces take `tex`, or a band's texture by height (`bands` as for
 * walls). It's lit by `light` (moonlight), shaded by its slope against the
 * `moon` direction, and drawn out to `far` tiles.
 */
export class Backdrop {
  /**
   * @param {*} def the level's `backdrop`
   * @param {(id:string)=>number} slot a texture's slot
   */
  constructor(def, slot) {
    this.x0 = def.x;
    this.y0 = def.y;
    this.cell = def.cell;
    this.w = def.w;
    this.h = def.h;
    this.heights = Float32Array.from(def.heights);
    this.far = def.far ?? 256;
    this.tex = slot(def.tex);
    this.bands = (def.bands ?? []).map((b) => ({ from: b.from ?? -Infinity, to: b.to ?? Infinity, tex: slot(b.tex) }));
    // The light at each corner: brighter where the slope faces the moon.
    const [mx, my, mz] = def.moon ?? [-0.45, -0.55, 0.7];
    const ml = Math.hypot(mx, my, mz);
    const base = def.light ?? 150;
    const cw = this.w + 1;
    this.light = new Uint8Array(cw * (this.h + 1));
    // Which way each corner's slope faces: 1 if more along x (its texture
    // then runs along y, as on a wall), else 0.
    this.facesX = new Uint8Array(cw * (this.h + 1));
    for (let j = 0; j <= this.h; j++) {
      for (let i = 0; i <= this.w; i++) {
        const hx = (this._corner(i + 1, j) - this._corner(i - 1, j)) / (2 * this.cell);
        const hy = (this._corner(i, j + 1) - this._corner(i, j - 1)) / (2 * this.cell);
        const nl = Math.hypot(hx, hy, 1);
        const lit = Math.max(0, (-hx * mx - hy * my + mz) / (nl * ml));
        // (The slope's shading is what makes it read as ground going back.)
        this.light[j * cw + i] = Math.max(0, Math.min(255, base * (0.62 + 0.55 * lit)));
        this.facesX[j * cw + i] = Math.abs(hx) > Math.abs(hy) ? 1 : 0;
      }
    }
  }

  _corner(i, j) {
    const ci = i < 0 ? 0 : i > this.w ? this.w : i;
    const cj = j < 0 ? 0 : j > this.h ? this.h : j;
    return this.heights[cj * (this.w + 1) + ci];
  }

  /** The height at (x, y), between the corners round it; -Infinity off the grid. */
  heightAt(x, y) {
    const fx = (x - this.x0) / this.cell;
    const fy = (y - this.y0) / this.cell;
    if (fx < 0 || fy < 0 || fx >= this.w || fy >= this.h) return -Infinity;
    const i = fx | 0;
    const j = fy | 0;
    const u = fx - i;
    const v = fy - j;
    const cw = this.w + 1;
    const k = j * cw + i;
    const hs = this.heights;
    const a = hs[k] + (hs[k + 1] - hs[k]) * u;
    const b = hs[k + cw] + (hs[k + cw + 1] - hs[k + cw]) * u;
    return a + (b - a) * v;
  }

  /** The light at (x, y) (the nearest corner's). */
  lightAt(x, y) {
    const i = Math.round((x - this.x0) / this.cell);
    const j = Math.round((y - this.y0) / this.cell);
    return this.light[(j < 0 ? 0 : j > this.h ? this.h : j) * (this.w + 1) + (i < 0 ? 0 : i > this.w ? this.w : i)];
  }

  /**
   * The texture's column coordinate (in tiles) at (x, y): along the face, so
   * it's fixed to the world whichever way it's seen from (y where the slope
   * there faces along x, else x).
   */
  faceU(x, y) {
    const i = Math.round((x - this.x0) / this.cell);
    const j = Math.round((y - this.y0) / this.cell);
    return this.facesX[(j < 0 ? 0 : j > this.h ? this.h : j) * (this.w + 1) + (i < 0 ? 0 : i > this.w ? this.w : i)] ? y : x;
  }

  /** The texture for faces at height z. */
  texAt(z) {
    for (const b of this.bands) if (z >= b.from && z < b.to) return b.tex;
    return this.tex;
  }
}

/** Problems with a level's backdrop. */
export function checkBackdrop(def) {
  if (!def) return [];
  const errors = [];
  for (const k of ['x', 'y', 'cell', 'w', 'h']) if (typeof def[k] !== 'number') errors.push(`backdrop needs a number "${k}"`);
  if (!(def.cell > 0)) errors.push('backdrop "cell" must be above 0');
  if (!def.tex) errors.push('backdrop needs a "tex"');
  const n = (def.w + 1) * (def.h + 1);
  if (!def.heights || def.heights.length !== n) errors.push(`backdrop needs ${n} "heights" ((w + 1) x (h + 1) corners), has ${def.heights?.length ?? 0}`);
  return errors;
}
