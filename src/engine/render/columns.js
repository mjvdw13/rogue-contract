import { F_SOLID, F_DOOR, F_SKY, F_SLANT, F_SLAB } from '../world/tilemap.js';
import { DIMINISH, MAX_BRIGHTEN, LIGHT_BLACK, HAZE_RES, HAZE_LEN } from './view.js';
import { HAZE_ROW, HAZE_STEPS } from '../gfx/palette.js';
import { LightMap } from '../world/lightmap.js';
import { layoutDecals } from '../world/decals.js';
import { drawBackdropColumn } from './backdrop.js';
import { TEXELS_PER_UNIT as TPU, TRANSPARENT, SHADE_STEP } from '../config.js';

const MAX_STEPS = 320;
const TAU = Math.PI * 2;
/** Added to texture coordinates so they stay positive before masking. */
const V_BIAS = 1 << 16;
/** Fences one column can show (the nearest are kept). */
const MAX_FENCES = 32;
const fenceT = new Float32Array(MAX_FENCES);
const fenceA = new Int16Array(MAX_FENCES);
const fenceB = new Int16Array(MAX_FENCES);
const fenceSlot = new Int16Array(MAX_FENCES);
const fenceU = new Float32Array(MAX_FENCES);
const fenceTop = new Float32Array(MAX_FENCES);
const fenceLv = new Float32Array(MAX_FENCES);
const fenceHz = new Float32Array(MAX_FENCES);
/**
 * Ordered (4x4 Bayer) dithering between colormap levels, so smooth light
 * doesn't band: a level's fraction picks the brighter or darker colormap per
 * pixel in a fixed pattern. Thresholds are centred on 0, so on average a
 * pixel is as bright as plain rounding down made it.
 */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
/** This column's four thresholds (one per row, repeating every 4 rows). */
const thr = new Float32Array(4);
/** Per row, 1 / (y + 0.5 - horizon), this frame. */
let rowInv = new Float64Array(0);
/** A face's colormap row (times 256) for each of the four rows. */
const faceCm = new Int32Array(4);
/** Open windows of rows one column can keep (slabs split them). */
const MAX_WIN = 8;
const wTop = new Int16Array(MAX_WIN);
const wBot = new Int16Array(MAX_WIN);
/** The storey of the current tile each window looks into (1: on its slab). */
const wSt = new Uint8Array(MAX_WIN);

/**
 * Draw walls, floors, ceilings, sky and fences, one screen column at a time.
 *
 * Every tile has its own floor and ceiling height ("Doom on a grid"). Each
 * column casts a ray front to back through the tile grid while keeping a
 * window of rows that nothing has covered yet ([clipTop, clipBot)). In each
 * open tile it fills the window with that tile's floor and ceiling. Where the
 * ray crosses into a tile with a higher floor or a lower ceiling it draws that
 * step face. It stops at a solid wall, at a closed part of a door panel, or
 * when the window closes. A rising door's panel covers the window down to its
 * bottom edge, and the ray goes on under it.
 *
 * Slabs (two storeys in one tile) need more than one window: a bridge seen
 * from the side covers the middle of the column, with open rows above and
 * below it. So the column keeps a short list of windows. Each looks into one
 * storey of the tile the ray is in and behaves like the single window above
 * inside it: the storey's floor and ceiling (the slab's top or underside)
 * narrow it, and faces at the next boundary narrow it, or split it where a
 * slab's edge covers its middle. The column ends when every window is closed.
 *
 * The windows after each tile are recorded per column (view.segDist / segTop /
 * segBot, a batch per boundary starting where view.segFirst is set) so sprites
 * can be clipped by ledges and overhangs nearer than them. view.zbuf holds the
 * distance at which the column ended.
 *
 * Light is smooth (see world/lightmap.js): floors and ceilings take it
 * interpolated along the ray's stretch through each tile, faces where the
 * ray meets them, and every pixel is dithered between colormap levels.
 * Outdoors (seen from a sky tile) in a level with haze, surfaces fade toward
 * the haze colour with distance instead of darkening with fog: the
 * colormaps go on with haze tables (gfx/palette.js `hazeColormaps`), and the
 * haze step is dithered too.
 *
 * Decals (world/decals.js) are drawn over the wall and step faces they're
 * on (angled walls' too), clipped to each face; grime darkens the face's
 * pixels instead.
 *
 * Where the sky shows, a level's backdrop (render/backdrop.js) is drawn over
 * it: the sky's rows are marked as they're drawn, and once the column's
 * surfaces are done the backdrop is drawn into just those rows.
 *
 * Fences (see-through walls on tile edges) don't stop the ray: each one it
 * crosses is noted with the rows still open at that point, and once the
 * column's solid surfaces are drawn its fences are drawn far to near,
 * skipping transparent texels. Their pixels go into the depth buffer
 * (view.mdepth, set `depthValid`) so models and sprites behind them hide.
 *
 * @param {import('./view.js').View} view
 * @param {import('../world/tilemap.js').TileMap} map
 * @param {import('../assets.js').Texture[]} textures
 * @param {import('../assets.js').Texture|null} sky
 * @param {Uint8Array} fb framebuffer (palette indices)
 * @param {number} fbW framebuffer width
 * @param {Uint8Array} colormaps
 * @param {import('../world/backdrop.js').Backdrop|null} [backdrop] terrain drawn where the sky shows
 */
export function drawWorld(view, map, textures, sky, fb, fbW, colormaps, backdrop = null) {
  const { W, H, x: px, y: py, dirX, dirY, planeX, planeY, fy, camZ, horizon, zbuf, fog } = view;
  const { segDist, segTop, segBot, segFirst, segCount } = view;
  const SEG = view.SEG;
  const mw = map.w;
  const mh = map.h;
  const { flags, wallTex, doorIndex, doors, seen, floorZ, ceilZ, floorTex, ceilTex, sideTex, upperTex, slantIndex, slants } = map;
  const { fences, fenceAt } = map;
  const { slabBot, slabTop, slabTopTex, slabUnderTex, slabSideTex } = map;
  const { bandIndex, bandSets } = map;
  // Nothing in the level stands higher (TileMap.computeSkyline).
  const skyline = map.skyline;
  if (map.decalsDirty) layoutDecals(map, textures);
  const { edgeDecals, decalEdge, slantDecals } = map;
  const hasDecals = map.decals.length > 0;
  const hasFences = fences.length > 0;
  const mdepth = view.mdepth;
  const along = [0];
  const fixed = view.fixedColormap;
  const extra = view.extraLight;
  const lm = map.lightmap ?? (map.lightmap = new LightMap(map));
  lm.update();
  const hazeOn = view.hazeOn;
  const hazeTab = view.hazeTab;
  const bdBuf = view.bdBuf;

  // Sky: horizontal texel per column from the view angle; the texture spans 180 degrees.
  let skyOffset = 0;
  if (sky) {
    for (let x = 0; x < W; x++) {
      const camX = (2 * (x + 0.5)) / W - 1;
      let a = view.angle + Math.atan(camX * view.planeLen);
      a = ((a % TAU) + TAU) % TAU;
      view.skyU[x] = Math.floor((a / TAU) * sky.w * 2) % sky.w;
    }
    skyOffset = sky.h - 6 - Math.round(horizon);
  }

  // 1 / (y + 0.5 - horizon) per row: floors and ceilings take their distance from it.
  if (rowInv.length < H) rowInv = new Float64Array(H);
  for (let y = 0; y < H; y++) rowInv[y] = 1 / (y + 0.5 - horizon);

  /**
   * A face's colormap per row phase, for its fractional level lv and haze
   * step hz (0 indoors), dithered with this column's thresholds.
   */
  const setFaceCm = (lv, hz) => {
    for (let k = 0; k < 4; k++) {
      let l = fixed >= 0 ? fixed : (lv + thr[k]) | 0;
      if (l < 0) l = 0;
      else if (l > 31) l = 31;
      if (hz > 0) {
        const h = (hz + thr[k] + 0.5) | 0;
        if (h) l += HAZE_ROW + (h - 1) * 32;
      }
      faceCm[k] = l * 256;
    }
  };

  for (let x = 0; x < W; x++) {
    const camX = (2 * (x + 0.5)) / W - 1;
    for (let k = 0; k < 4; k++) thr[k] = (BAYER[(x & 3) + k * 4] + 0.5) / 16 - 0.5;
    const rdx = dirX + planeX * camX;
    const rdy = dirY + planeY * camX;
    let mapX = Math.floor(px);
    let mapY = Math.floor(py);
    const ddx = rdx === 0 ? 1e30 : Math.abs(1 / rdx);
    const ddy = rdy === 0 ? 1e30 : Math.abs(1 / rdy);
    let stepX;
    let stepY;
    let sdx;
    let sdy;
    if (rdx < 0) {
      stepX = -1;
      sdx = (px - mapX) * ddx;
    } else {
      stepX = 1;
      sdx = (mapX + 1 - px) * ddx;
    }
    if (rdy < 0) {
      stepY = -1;
      sdy = (py - mapY) * ddy;
    } else {
      stepY = 1;
      sdy = (mapY + 1 - py) * ddy;
    }
    const skyCol = sky ? view.skyU[x] : 0;
    // The rows that show sky (marked in bdBuf), for the backdrop.
    let skyLo = H;
    let skyHi = 0;
    const markSky = (a, b) => {
      if (a < skyLo) skyLo = a;
      if (b > skyHi) skyHi = b;
      for (let o = a * fbW + x; a < b; a++, o += fbW) bdBuf[o] = 1;
    };

    // The window being worked on (loaded from and stored back to wTop / wBot).
    let clipTop = 0;
    let clipBot = H;
    let nw = 0;
    let nseg = 0;
    const segBase = x * SEG;
    let cur = mapX >= 0 && mapY >= 0 && mapX < mw && mapY < mh ? mapY * mw + mapX : -1;
    let tEnter = 0;
    let end = 1e6;
    let nf = 0;
    /** The rising door whose panel this column has met (a panel on a tile edge is met from both tiles). */
    let panelDone = null;

    // Fill rows [a, b) of this column with a textured vertical face at distance t.
    // Textures are mapped in world units (TEXELS_PER_UNIT texels per unit), so
    // they run on across tiles: `u` is the position along the wall in world
    // units, and the texture's top row sits at height `anchor`.
    const face = (t, a, b, anchor, slot, u, lv, hz) => {
      if (a < clipTop) a = clipTop;
      if (b > clipBot) b = clipBot;
      if (b <= a) return;
      let o = a * fbW + x;
      if (slot < 0) {
        for (let y = a; y < b; y++, o += fbW) fb[o] = 0;
        return;
      }
      const tex = textures[slot];
      const th = tex.h;
      let tx = Math.floor(u * TPU) % tex.w;
      if (tx < 0) tx += tex.w;
      const col = tex.curCM;
      const colBase = tx * th;
      setFaceCm(lv, hz);
      const stepV = (TPU * t) / fy;
      let v = (anchor - camZ) * TPU + (a + 0.5 - horizon) * stepV + V_BIAS * th;
      const hMask = tex.hMask;
      if (hMask >= 0) {
        for (let y = a; y < b; y++, o += fbW, v += stepV) fb[o] = colormaps[faceCm[y & 3] + col[colBase + ((v | 0) & hMask)]];
      } else {
        for (let y = a; y < b; y++, o += fbW, v += stepV) fb[o] = colormaps[faceCm[y & 3] + col[colBase + ((v | 0) % th)]];
      }
    };
    // A fence face: like `face`, already clipped, with holes, writing the depth buffer.
    const fenceFace = (t, a, b, anchor, slot, u, lv, hz) => {
      const tex = textures[slot];
      const th = tex.h;
      let tx = Math.floor(u * TPU) % tex.w;
      if (tx < 0) tx += tex.w;
      const col = tex.curCM;
      const colBase = tx * th;
      setFaceCm(lv, hz);
      const stepV = (TPU * t) / fy;
      let v = (anchor - camZ) * TPU + (a + 0.5 - horizon) * stepV + V_BIAS * th;
      let o = a * fbW + x;
      for (let y = a; y < b; y++, o += fbW, v += stepV) {
        const c = col[colBase + ((v | 0) % th)];
        if (c === TRANSPARENT || t >= mdepth[o]) continue;
        fb[o] = colormaps[faceCm[y & 3] + c];
        mdepth[o] = t;
      }
    };
    /**
     * Wall bands: over a face from height `faceBot` to `faceTop`, each band's
     * texture over its heights (last to first, so the first that covers a
     * height is on top). A band's texture hangs from its top, or from the
     * face's top if it's open-ended.
     */
    const bandFaces = (t, faceTop, faceBot, bands, u, lv, hz) => {
      for (let j = bands.length - 1; j >= 0; j--) {
        const band = bands[j];
        const top = band.to < faceTop ? band.to : faceTop;
        const bot = band.from > faceBot ? band.from : faceBot;
        if (top > bot) face(t, rowOf(top, t), rowOf(bot, t), band.to < Infinity ? band.to : faceTop, band.tex, u, lv, hz);
      }
    };
    /**
     * Decals on a face from height `faceBot` to `faceTop` the ray meets at
     * distance t, at `pos` along the edge (mirrored when seen from the side that
     * reads backward), in the face's light (or unlit if they glow). Grime
     * (a texture with `shade`) darkens what's drawn there instead.
     */
    const decalFaces = (t, faceTop, faceBot, list, pos, mirrored, lv, hz) => {
      for (let j = 0; j < list.length; j++) {
        const d = list[j];
        if (pos < d.a0 || pos >= d.a1) continue;
        const top = d.z1 < faceTop ? d.z1 : faceTop;
        const bot = d.z0 > faceBot ? d.z0 : faceBot;
        if (top <= bot) continue;
        let a = rowOf(top, t);
        let b = rowOf(bot, t);
        if (a < clipTop) a = clipTop;
        if (b > clipBot) b = clipBot;
        if (b <= a) continue;
        const tex = textures[d.tex];
        const th = tex.h;
        let tx = (((mirrored !== d.flip ? d.a1 - pos : pos - d.a0) / (d.a1 - d.a0)) * tex.w) | 0;
        if (tx >= tex.w) tx = tex.w - 1;
        const colBase = tx * th;
        const scale = th / (d.z1 - d.z0);
        const stepV = (t / fy) * scale;
        let v = (d.z1 - camZ + ((a + 0.5 - horizon) * t) / fy) * scale;
        const shade = tex.shade;
        if (shade) {
          // Grime: darken what's there by the texel's levels, dithered,
          // less in haze (the haze in the pixel isn't the wall's to darken).
          const f = hz > 0 ? (1 - hz / (HAZE_STEPS - 1)) / SHADE_STEP : 1 / SHADE_STEP;
          const k0 = tex.shadeSpan[tx * 2];
          const k1 = tex.shadeSpan[tx * 2 + 1];
          if (f <= 0 || k1 <= k0) continue;
          // Only the rows over this texel column's grime (streaks are mostly bare).
          let y0 = a;
          if (v < k0) y0 = a + Math.ceil((k0 - v) / stepV);
          const y1 = Math.min(b, a + Math.ceil((k1 - v) / stepV));
          v += (y0 - a) * stepV;
          for (let y = y0, o = y0 * fbW + x; y < y1; y++, o += fbW, v += stepV) {
            let k = v | 0;
            if (k >= th) k = th - 1;
            else if (k < 0) k = 0;
            const s = shade[colBase + k];
            if (s === 0) continue;
            let l = (s * f + thr[y & 3] + 0.5) | 0;
            if (l <= 0) continue;
            if (l > 31) l = 31;
            fb[o] = colormaps[l * 256 + fb[o]];
          }
          continue;
        }
        const col = tex.curCM;
        setFaceCm(d.glow ? 0 : lv, d.glow ? 0 : hz);
        for (let y = a, o = a * fbW + x; y < b; y++, o += fbW, v += stepV) {
          let k = v | 0;
          if (k >= th) k = th - 1;
          else if (k < 0) k = 0;
          const c = col[colBase + k];
          if (c !== TRANSPARENT) fb[o] = colormaps[faceCm[y & 3] + c];
        }
      }
    };
    /** A texture's height in world units (faces hung from their bottom edge use it). */
    const texHeight = (slot) => (slot >= 0 ? textures[slot].h / TPU : 1);
    /**
     * The (fractional) colormap level of a face the ray meets at distance t,
     * in storey s: the smooth light there, and the faces' fake contrast.
     * Outdoors in haze (`out`), without the fog.
     */
    const faceLevel = (s, t, contrast, out) => (fixed >= 0 ? fixed : view.levelF(lm.sample(px + rdx * t, py + rdy * t, s), t) + contrast - (out ? t * fog : 0));
    /** A face's haze step at distance t (0 indoors). */
    const faceHaze = (t, out) => (out ? view.hazeF(t) : 0);
    /**
     * Rows [a, b) of this column's floor (kk > 0) or ceiling (kk < 0) in
     * texture `tex`, kk being (camZ - the plane's height) * fy: a row's
     * distance is kk / (y + 0.5 - horizon). The light runs from l0 at t0,
     * changing by dl per unit of distance; outdoors in haze (`hazy`), the
     * level is without the fog, in its haze step's tables. Levels are as
     * View.levelF's, and dithered.
     */
    const flatSpan = (a, b, kk, tex, hazy, t0, l0, dl) => {
      const tw = tex.w;
      const wm = tex.wMask;
      const hm = tex.hMask;
      const pix = tex.cur;
      let o = a * fbW + x;
      if (fixed >= 0) {
        const cm = fixed * 256;
        for (let y = a; y < b; y++, o += fbW) {
          const dist = kk * rowInv[y];
          fb[o] = colormaps[cm + pix[(((py + rdy * dist) * TPU) & hm) * tw + (((px + rdx * dist) * TPU) & wm)]];
        }
        return;
      }
      // The level before the light diminishing is c0 + c1 * dist; the
      // diminishing (DIMINISH / dist) is dk times the row's offset from the horizon.
      const c0 = (LIGHT_BLACK - l0 + t0 * dl) * 0.25 - extra;
      const c1 = (hazy ? 0 : fog) - dl * 0.25;
      const dk = DIMINISH / kk;
      for (let y = a; y < b; y++, o += fbW) {
        const dist = kk * rowInv[y];
        const tx = ((px + rdx * dist) * TPU) & wm;
        const ty = ((py + rdy * dist) * TPU) & hm;
        let br = dk * (y + 0.5 - horizon);
        if (br > MAX_BRIGHTEN) br = MAX_BRIGHTEN;
        const d = thr[y & 3];
        let lv = (c0 + c1 * dist - br + d) | 0;
        if (lv < 0) lv = 0;
        else if (lv > 31) lv = 31;
        if (hazy) {
          const hk = (dist * HAZE_RES) | 0;
          const h = (hazeTab[hk < HAZE_LEN ? hk : HAZE_LEN - 1] + d + 0.5) | 0;
          if (h) lv += HAZE_ROW + (h - 1) * 32;
        }
        fb[o] = colormaps[lv * 256 + pix[ty * tw + tx]];
      }
    };
    // Floor and ceiling of storey s of tile `i` between distances t0 and t1
    // (under a slab, the slab's underside is the ceiling; on it, its top the
    // floor). The light runs smoothly from where the ray enters to where it
    // leaves: l0 at t0, changing by dl per unit of distance.
    const flats = (i, s, t0, t1) => {
      const slab = (flags[i] & F_SLAB) !== 0;
      const hazy = hazeOn && (flags[i] & F_SKY) !== 0;
      // (The light is sampled only once some rows need it.)
      let lit = false;
      let l0 = 0;
      let dl = 0;
      const fz = slab && s ? slabTop[i] : floorZ[i];
      if (camZ > fz) {
        const k = (camZ - fz) * fy;
        let a = Math.ceil(horizon + k / t1 - 0.5);
        let b = t0 > 0 ? Math.ceil(horizon + k / t0 - 0.5) : clipBot;
        if (a < clipTop) a = clipTop;
        if (b > clipBot) b = clipBot;
        const slot = s ? slabTopTex[i] : floorTex[i];
        if (b > a) {
          if (slot < 0) {
            for (let y = a, o = a * fbW + x; y < b; y++, o += fbW) fb[o] = 0;
          } else {
            lit = true;
            l0 = lm.sample(px + rdx * t0, py + rdy * t0, s);
            dl = t1 > t0 ? (lm.sample(px + rdx * t1, py + rdy * t1, s) - l0) / (t1 - t0) : 0;
            flatSpan(a, b, k, textures[slot], hazy, t0, l0, dl);
          }
        }
        if (a < clipBot) clipBot = a < clipTop ? clipTop : a;
      }
      const cz = !s && slab ? slabBot[i] : ceilZ[i];
      if (cz > camZ) {
        const k = (cz - camZ) * fy;
        let a = t0 > 0 ? Math.ceil(horizon - k / t0 - 0.5) : clipTop;
        let b = Math.ceil(horizon - k / t1 - 0.5);
        if (a < clipTop) a = clipTop;
        if (b > clipBot) b = clipBot;
        if (b > a) {
          if (flags[i] & F_SKY && (s || !slab)) {
            if (backdrop) markSky(a, b);
            for (let y = a, o = a * fbW + x; y < b; y++, o += fbW) {
              if (!sky) {
                fb[o] = 0;
                continue;
              }
              let sy = y + skyOffset;
              if (sy < 0) sy = 0;
              else if (sy >= sky.h) sy = sky.h - 1;
              const c = sky.cur[sy * sky.w + skyCol];
              fb[o] = fixed >= 0 ? colormaps[fixed * 256 + c] : c;
            }
          } else {
            const slot = !s && slab ? slabUnderTex[i] : ceilTex[i];
            if (slot < 0) {
              for (let y = a, o = a * fbW + x; y < b; y++, o += fbW) fb[o] = 0;
            } else {
              if (!lit) {
                l0 = lm.sample(px + rdx * t0, py + rdy * t0, s);
                dl = t1 > t0 ? (lm.sample(px + rdx * t1, py + rdy * t1, s) - l0) / (t1 - t0) : 0;
              }
              flatSpan(a, b, -k, textures[slot], hazy, t0, l0, dl);
            }
          }
        }
        if (b > clipTop) clipTop = b > clipBot ? clipBot : b;
      }
    };
    // Record the open windows at distance t, as one batch (if it fits).
    const record = (t) => {
      if (nseg + nw > SEG) return;
      for (let k = 0; k < nw; k++) {
        segDist[segBase + nseg] = t;
        segTop[segBase + nseg] = wTop[k];
        segBot[segBase + nseg] = wBot[k];
        segFirst[segBase + nseg] = k === 0 ? 1 : 0;
        nseg++;
      }
    };
    // Drop closed windows.
    const compact = () => {
      let n = 0;
      for (let k = 0; k < nw; k++) {
        if (wBot[k] <= wTop[k]) continue;
        wTop[n] = wTop[k];
        wBot[n] = wBot[k];
        wSt[n] = wSt[k];
        n++;
      }
      nw = n;
    };
    // The sky "wall" between two sky tiles of different heights.
    const skyFill = (a, b) => {
      if (a < clipTop) a = clipTop;
      if (b > clipBot) b = clipBot;
      if (backdrop && b > a) markSky(a, b);
      for (let y = a, o = a * fbW + x; y < b; y++, o += fbW) {
        if (!sky) {
          fb[o] = 0;
          continue;
        }
        let sy = y + skyOffset;
        if (sy < 0) sy = 0;
        else if (sy >= sky.h) sy = sky.h - 1;
        const c = sky.cur[sy * sky.w + skyCol];
        fb[o] = fixed >= 0 ? colormaps[fixed * 256 + c] : c;
      }
    };
    const rowOf = (z, t) => Math.ceil(horizon + ((camZ - z) * fy) / t - 0.5);

    if (cur < 0) {
      for (let y = 0, o = x; y < H; y++, o += fbW) fb[o] = 0;
      zbuf[x] = 0;
      segCount[x] = 0;
      continue;
    }

    // One window to start with, in the camera's storey of its tile.
    nw = 1;
    wTop[0] = 0;
    wBot[0] = H;
    wSt[0] = flags[cur] & F_SLAB && camZ >= (slabBot[cur] + slabTop[cur]) / 2 ? 1 : 0;

    for (let step = 0; step < MAX_STEPS; step++) {
      // Distance at which the ray leaves the current tile, and which side it crosses.
      let side;
      let tExit;
      if (sdx < sdy) {
        tExit = sdx;
        sdx += ddx;
        mapX += stepX;
        side = 0;
      } else {
        tExit = sdy;
        sdy += ddy;
        mapY += stepY;
        side = 1;
      }
      if (tExit < 1e-4) tExit = 1e-4;
      // Outdoors in haze: faces seen from this tile fade toward the haze colour.
      const out = hazeOn && (flags[cur] & F_SKY) !== 0;

      // An angled wall in the current tile stops the ray where it crosses the line.
      // (Angled-wall tiles have no slab: their windows are all in storey 0.)
      // One that stops short of the ceiling (`wallTop`) stops it only up to
      // its top, and the view goes on over it; a ray that came in through
      // its solid side has drawn its back already (below), so carries on.
      if (flags[cur] & F_SLANT) {
        const sl = slants[slantIndex[cur]];
        const low = sl.top < ceilZ[cur];
        const t = sl.ray(px, py, rdx, rdy, along);
        if (t >= tEnter - 1e-6 && t <= tExit + 1e-6 && !(low && sl.solidAt(px + rdx * tEnter, py + rdy * tEnter))) {
          seen[cur] = 1;
          // Texture runs right-to-left from the second point (as seen from the
          // open side), from `wallU` on.
          const u = (1 - along[0]) * sl.len + sl.u;
          const lv = faceLevel(0, t, 0, out);
          const top = low ? sl.top : ceilZ[cur];
          const a = rowOf(top, t);
          const bands = bandIndex[cur] >= 0 ? bandSets[bandIndex[cur]] : null;
          const sDecals = hasDecals && slantDecals.size ? slantDecals.get(cur) : undefined;
          for (let k = 0; k < nw; k++) {
            clipTop = wTop[k];
            clipBot = wBot[k];
            flats(cur, 0, tEnter, t);
            face(t, a, rowOf(floorZ[cur], t), top, sl.tex, u, lv, faceHaze(t, out));
            if (bands) bandFaces(t, top, floorZ[cur], bands, u, lv, faceHaze(t, out));
            if (sDecals) decalFaces(t, top, floorZ[cur], sDecals, u, false, lv, faceHaze(t, out));
            if (a < clipBot) clipBot = a < clipTop ? clipTop : a;
            wTop[k] = clipTop;
            wBot[k] = clipBot;
          }
          if (!low) {
            end = t;
            break;
          }
          record(t);
          compact();
          if (!nw) {
            end = t;
            break;
          }
          tEnter = t;
        }
      }

      // A door panel in the current tile can stop the ray partway through it.
      if (flags[cur] & F_DOOR) {
        const door = doors[doorIndex[cur]];
        if (door.style === 'rise') {
          // A rising door's panel stands back in its doorway (perhaps on the
          // edge between two of its tiles: drawn once). Below its bottom edge
          // the ray carries on under it. Under a slab (the wall over a door
          // under the sky) it rises into the slab, and windows looking over
          // the slab don't see it.
          const t = door.axis === 'x' ? (rdx !== 0 ? (door.plane - px) / rdx : -1) : rdy !== 0 ? (door.plane - py) / rdy : -1;
          if (door.group !== panelDone && t > 1e-4 && t >= tEnter - 1e-6 && t <= tExit + 1e-6) {
            panelDone = door.group;
            const bz = door.bottomZ;
            const top = flags[cur] & F_SLAB ? slabBot[cur] : ceilZ[cur];
            if (bz < top) {
              seen[cur] = 1;
              // One door texture across the doorway, centred, reading left to right from both sides.
              const along = door.axis === 'x' ? py + rdy * t : px + rdx * t;
              const flip = door.axis === 'x' ? rdx < 0 : rdy > 0;
              const width = door.span1 - door.span0;
              const tw = door.tex >= 0 ? textures[door.tex].w / TPU : width;
              const u = (flip ? door.span1 - along : along - door.span0) - (width - tw) / 2;
              const b = rowOf(bz, t);
              const lv = faceLevel(0, t, door.axis === 'x' ? 1 : -1, out);
              for (let k = 0; k < nw; k++) {
                clipTop = wTop[k];
                clipBot = wBot[k];
                flats(cur, wSt[k], tEnter, t);
                if (!wSt[k]) {
                  face(t, rowOf(top, t), b, bz + texHeight(door.tex), door.tex, u, lv, faceHaze(t, out));
                  if (b > clipTop) clipTop = b > clipBot ? clipBot : b;
                }
                wTop[k] = clipTop;
                wBot[k] = clipBot;
              }
              record(t);
              compact();
              if (!nw) {
                end = t;
                break;
              }
              tEnter = t;
            }
          }
        } else if (!door.secret && step > 0) {
          const cx = cur % mw;
          const cy = (cur / mw) | 0;
          let t = -1;
          if (door.axis === 'x') {
            if (rdx !== 0) t = (cx + 0.5 - px) / rdx;
          } else if (rdy !== 0) t = (cy + 0.5 - py) / rdy;
          if (t >= tEnter && t <= tExit) {
            let du = door.axis === 'x' ? py + rdy * t - cy : px + rdx * t - cx;
            let blocked;
            if (door.style === 'split') {
              const half = door.open * 0.5;
              blocked = !(du > 0.5 - half && du < 0.5 + half);
              if (blocked) du = du < 0.5 ? du + half : du - half;
            } else {
              blocked = du >= door.open;
              if (blocked) du -= door.open;
            }
            if (blocked) {
              seen[cur] = 1;
              const lv = faceLevel(0, t, door.axis === 'x' ? 1 : -1, out);
              for (let k = 0; k < nw; k++) {
                clipTop = wTop[k];
                clipBot = wBot[k];
                flats(cur, 0, tEnter, t);
                face(t, rowOf(ceilZ[cur], t), rowOf(floorZ[cur], t), ceilZ[cur], door.tex, du + (door.axis === 'x' ? cy : cx), lv, faceHaze(t, out));
              }
              end = t;
              break;
            }
          }
        }
      }

      for (let k = 0; k < nw; k++) {
        clipTop = wTop[k];
        clipBot = wBot[k];
        flats(cur, wSt[k], tEnter, tExit);
        wTop[k] = clipTop;
        wBot[k] = clipBot;
      }

      if (mapX < 0 || mapY < 0 || mapX >= mw || mapY >= mh) {
        for (let k = 0; k < nw; k++) {
          clipTop = wTop[k];
          clipBot = wBot[k];
          face(tExit, clipTop, clipBot, 0, -1, 0, 0, 0);
        }
        end = tExit;
        break;
      }
      const next = mapY * mw + mapX;
      const f = flags[next];
      const contrast = side === 0 ? 1 : -1;
      const hz = faceHaze(tExit, out);
      // Position along the wall in world units (mirrored on two sides so
      // textures read left to right from every direction).
      const edgePos = side === 0 ? py + tExit * rdy : px + tExit * rdx;
      const mirrored = side === 0 ? rdx < 0 : rdy > 0;
      const wx = mirrored ? -edgePos : edgePos;
      // Decals on the face of the next tile toward this one.
      const dEdge = hasDecals ? next * 4 + (side === 0 ? (stepX > 0 ? 3 : 1) : stepY > 0 ? 0 : 2) : -1;
      const decals = dEdge >= 0 && decalEdge[dEdge] ? edgeDecals.get(dEdge) : null;

      let solid = (f & F_SOLID) !== 0;
      let tex = wallTex[next];
      let u = wx;
      // The top of a low angled wall entered from behind (-Infinity: none).
      let backTop = -Infinity;

      // A fence on this edge: note it, with the rows open here, and carry on.
      if (hasFences && !solid) {
        const fk = fenceAt[cur * 4 + (side === 0 ? (stepX > 0 ? 1 : 3) : stepY > 0 ? 2 : 0)];
        if (fk >= 0) {
          const fe = fences[fk];
          const top = map.fenceTop(fe);
          const bottom = map.fenceBottom(fe);
          const ra = rowOf(top, tExit);
          const rb = rowOf(bottom, tExit);
          const lv = faceLevel(flags[cur] & F_SLAB && slabTop[cur] <= bottom + 0.5 ? 1 : 0, tExit, contrast, out);
          for (let k = 0; k < nw; k++) {
            let a = ra;
            let b = rb;
            if (a < wTop[k]) a = wTop[k];
            if (b > wBot[k]) b = wBot[k];
            if (b > a && fe.tex >= 0) {
              if (nf === MAX_FENCES) nf--;
              fenceT[nf] = tExit;
              fenceA[nf] = a;
              fenceB[nf] = b;
              fenceSlot[nf] = fe.tex;
              fenceU[nf] = wx;
              fenceTop[nf] = top;
              fenceLv[nf] = lv;
              fenceHz[nf] = hz;
              nf++;
              seen[cur] = 1;
              seen[next] = 1;
            }
          }
        }
      }
      if (f & F_DOOR) {
        const door = doors[doorIndex[next]];
        if (door.secret) {
          // Secret doors sit flush with the wall around them and slide sideways.
          let du = door.axis === 'x' ? py + rdy * tExit - mapY : px + rdx * tExit - mapX;
          if (du >= door.open) {
            du -= door.open;
            du += door.axis === 'x' ? mapY : mapX;
            if (side === 0 ? rdx < 0 : rdy > 0) du = -du;
            solid = true;
            tex = door.tex;
            u = du;
          }
        }
      } else if (f & F_SLANT && slants[slantIndex[next]].solidAt(px + rdx * tExit, py + rdy * tExit)) {
        // Entering an angled-wall tile through its solid side: the back of the
        // wall. One with a top below the ceiling is a step up to its top
        // (below), which the view goes on over.
        if (slants[slantIndex[next]].top < ceilZ[next]) backTop = slants[slantIndex[next]].top;
        else {
          solid = true;
          tex = slants[slantIndex[next]].tex;
        }
      } else if (solid && flags[cur] & F_DOOR) {
        const jamb = doors[doorIndex[cur]].jamb;
        if (jamb >= 0) tex = jamb;
      }

      const curSlab = (flags[cur] & F_SLAB) !== 0;
      if (solid) {
        seen[next] = 1;
        // Wall bands: the wall's own texture, then each band's over its heights.
        const bands = bandIndex[next] >= 0 && tex === wallTex[next] ? bandSets[bandIndex[next]] : null;
        for (let k = 0; k < nw; k++) {
          clipTop = wTop[k];
          clipBot = wBot[k];
          const s = wSt[k];
          const fz = s ? slabTop[cur] : floorZ[cur];
          const cz = !s && curSlab ? slabBot[cur] : ceilZ[cur];
          const lv = faceLevel(s, tExit, contrast, out);
          face(tExit, rowOf(cz, tExit), rowOf(fz, tExit), cz, tex, u, lv, hz);
          if (bands) bandFaces(tExit, cz, fz, bands, u, lv, hz);
          if (decals) decalFaces(tExit, cz, fz, decals, edgePos, mirrored, lv, hz);
        }
        end = tExit;
        break;
      }

      // Step faces into the next open tile, in each window: a raised floor, a
      // lowered ceiling, and the edge of a slab, which may split the window.
      const fN = backTop > floorZ[next] ? backTop : floorZ[next];
      const cN = ceilZ[next];
      const nextSlab = (f & F_SLAB) !== 0;
      const sideN = backTop > -Infinity ? slants[slantIndex[next]].tex : sideTex[next];
      const nextBands = bandIndex[next] >= 0 ? bandSets[bandIndex[next]] : null;
      const n0 = nw;
      for (let k = 0; k < n0; k++) {
        clipTop = wTop[k];
        clipBot = wBot[k];
        const s = wSt[k];
        const fC = s ? slabTop[cur] : floorZ[cur];
        const cC = !s && curSlab ? slabBot[cur] : ceilZ[cur];
        if (fN > fC) {
          const a = rowOf(fN, tExit);
          seen[next] = 1;
          const lv = faceLevel(s, tExit, contrast, out);
          face(tExit, a, rowOf(fC, tExit), fN, sideN, wx, lv, hz);
          if (nextBands) bandFaces(tExit, fN, fC, nextBands, wx, lv, hz);
          if (decals) decalFaces(tExit, fN, fC, decals, edgePos, mirrored, lv, hz);
          if (a < clipBot) clipBot = a < clipTop ? clipTop : a;
        }
        if (cN < cC) {
          const b = rowOf(cN, tExit);
          if (flags[cur] & F_SKY && (s || !curSlab) && f & F_SKY) skyFill(rowOf(cC, tExit), b);
          else {
            seen[next] = 1;
            const lv = faceLevel(s, tExit, contrast, out);
            face(tExit, rowOf(cC, tExit), b, cN + texHeight(upperTex[next]), upperTex[next], wx, lv, hz);
            if (nextBands) bandFaces(tExit, cC, cN, nextBands, wx, lv, hz);
            if (decals) decalFaces(tExit, cC, cN, decals, edgePos, mirrored, lv, hz);
          }
          if (b > clipTop) clipTop = b > clipBot ? clipBot : b;
        }
        if (nextSlab && clipTop < clipBot && slabBot[next] < cC && slabTop[next] > fC) {
          const sTop = slabTop[next] < cC ? slabTop[next] : cC;
          const sBot = slabBot[next] > fC ? slabBot[next] : fC;
          const a = rowOf(sTop, tExit);
          const b = rowOf(sBot, tExit);
          if (b > clipTop && a < clipBot) {
            seen[next] = 1;
            const lv = faceLevel(s, tExit, contrast, out);
            face(tExit, a, b, slabTop[next], slabSideTex[next], wx, lv, hz);
            // (Decals on the edge too: a sign over a doorway, whose wall is its arch's slab.)
            if (decals) decalFaces(tExit, sTop, sBot, decals, edgePos, mirrored, lv, hz);
            // Above the edge stays open in this window, and below it in a new one.
            const bot = clipBot;
            if (a < clipBot) clipBot = a < clipTop ? clipTop : a;
            if (b < bot) {
              if (nw < MAX_WIN) {
                wTop[nw] = b > clipTop ? b : clipTop;
                wBot[nw] = bot;
                wSt[nw] = s;
                nw++;
              } else {
                // (Out of windows, which takes a pile of slabs: leave those rows black.)
                const keep = clipBot;
                clipBot = bot;
                face(tExit, b, bot, 0, -1, 0, 0, 0);
                clipBot = keep;
              }
            }
          }
        }
        wTop[k] = clipTop;
        wBot[k] = clipBot;
      }
      if (nw === 1) {
        // (The usual case, without slabs: one window.)
        if (nseg < SEG) {
          segDist[segBase + nseg] = tExit;
          segTop[segBase + nseg] = wTop[0];
          segBot[segBase + nseg] = wBot[0];
          segFirst[segBase + nseg] = 1;
          nseg++;
        }
      } else record(tExit);
      if (nw === 1 ? wBot[0] <= wTop[0] : (compact(), !nw)) {
        end = tExit;
        break;
      }
      // Looking out over the skyline: whatever lies further shows below the
      // rows still open, so they can only be sky. Fill them and stop (over a
      // town, rays would otherwise cross the rooftops to the map's edge).
      if (camZ < skyline) {
        const r = rowOf(skyline, tExit);
        let over = true;
        for (let k = 0; k < nw; k++) {
          if (wBot[k] > r) {
            over = false;
            break;
          }
        }
        if (over) {
          for (let k = 0; k < nw; k++) {
            clipTop = wTop[k];
            clipBot = wBot[k];
            skyFill(clipTop, clipBot);
          }
          end = tExit;
          break;
        }
      }
      // Which storey of the next tile each window looks into (by its middle row's height here).
      if (nextSlab) {
        const mid = (slabBot[next] + slabTop[next]) / 2;
        for (let k = 0; k < nw; k++) wSt[k] = camZ - (((wTop[k] + wBot[k]) / 2 - horizon) * tExit) / fy >= mid ? 1 : 0;
      } else if (curSlab) {
        for (let k = 0; k < nw; k++) wSt[k] = 0;
      }
      cur = next;
      tEnter = tExit;
    }

    zbuf[x] = end;
    segCount[x] = nseg;
    if (skyHi > skyLo) drawBackdropColumn(view, backdrop, textures, colormaps, fb, bdBuf, fbW, x, rdx, rdy, thr, skyLo, skyHi);
    if (nf) {
      if (!view.depthValid) {
        mdepth.fill(Infinity);
        view.depthValid = true;
      }
      for (let k = nf - 1; k >= 0; k--) fenceFace(fenceT[k], fenceA[k], fenceB[k], fenceTop[k], fenceSlot[k], fenceU[k], fenceLv[k], fenceHz[k]);
    }
  }
}
