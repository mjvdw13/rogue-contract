import { F_SKY } from '../world/tilemap.js';
import { BLEND_SOLID, BLEND_ADD, BLEND_HALF, BLEND_DITHER } from '../world/particles.js';

/** 4x4 ordered dither thresholds (0..15) for `dither` particles. */
const BAYER = new Uint8Array([0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]);
/** Streaks are at most this many pixels long. */
const MAX_STREAK = 8;

/**
 * Colormap rows for lit particles, cached per frame (view.row is too dear per
 * particle): by outdoors, light / 2 and a distance bucket (1/8 tile apart up
 * to 16 tiles, then 1 tile apart). Entries are valid when their stamp is
 * this frame's.
 */
const ROW_KEYS = 2 * 128 * 256;
const rowCache = new Uint16Array(ROW_KEYS);
const rowStamp = new Uint32Array(ROW_KEYS);
let frameNo = 0;

function litRow(view, light, depth, outdoor) {
  let b = depth < 16 ? (depth * 8) | 0 : 112 + (depth | 0);
  if (b > 255) b = 255;
  const key = (((outdoor << 7) | (light >> 1)) << 8) | b;
  if (rowStamp[key] !== frameNo) {
    rowStamp[key] = frameNo;
    rowCache[key] = view.row((light | 1) - 0.5, b < 128 ? (b + 0.5) / 8 : b - 111.5, outdoor === 1);
  }
  return rowCache[key];
}

// This frame's state, shared by span() (set at the top of drawParticles).
let gFb = null;
let gFbW = 0;
let gView = null;
/** @type {Float32Array} */
let gMdepth = new Float32Array(0);
/** @type {Uint8Array} */
let gTable = new Uint8Array(0);
let gBlend = 0;
let gAlpha = 16;

/**
 * Draw rows ya..yb-1 of column x in colour c at `depth`, clipped against the
 * walls (zbuf), the ledge windows nearer than it (as sprites are) and the
 * per-pixel depth of models, fences and sprites.
 */
function span(x, ya, yb, depth, c) {
  const view = gView;
  if (depth >= view.zbuf[x]) return;
  const { segDist, segTop, segBot, segFirst, segCount, SEG, H } = view;
  const sb = x * SEG;
  // The last window nearer than the particle (windows are recorded near to far): a binary search.
  let lo = 0;
  let hi = segCount[x];
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (segDist[sb + mid] < depth) lo = mid + 1;
    else hi = mid;
  }
  const last = lo - 1;
  let first = last;
  while (first > 0 && !segFirst[sb + first]) first--;
  for (let k = first; k <= last; k++) {
    let y0 = k < 0 ? 0 : segTop[sb + k];
    let y1 = k < 0 ? H : segBot[sb + k];
    if (y0 < ya) y0 = ya;
    if (y1 > yb) y1 = yb;
    if (y1 > y0) rows(x, y0, y1, depth, c);
  }
}

/** The pixels of rows y0..y1-1 of column x, each tested against mdepth: one tight loop per blend. */
function rows(x, y0, y1, depth, c) {
  const fb = gFb;
  const fbW = gFbW;
  const mdepth = gMdepth;
  let o = y0 * fbW + x;
  const end = y1 * fbW + x;
  switch (gBlend) {
    case BLEND_SOLID:
      for (; o < end; o += fbW) if (depth < mdepth[o]) fb[o] = c;
      break;
    case BLEND_DITHER: {
      // Whole rows of the 4x4 pattern that pass for this column, as a 4-bit mask.
      const a = gAlpha;
      const col = x & 3;
      let mask = 0;
      for (let r = 0; r < 4; r++) if (a > BAYER[(r << 2) | col]) mask |= 1 << r;
      if (!mask) return;
      for (let y = y0; o < end; o += fbW, y++) if (mask & (1 << (y & 3)) && depth < mdepth[o]) fb[o] = c;
      break;
    }
    default: {
      const table = gTable;
      const hi = c << 8;
      for (; o < end; o += fbW) if (depth < mdepth[o]) fb[o] = table[hi | fb[o]];
    }
  }
}

/**
 * Draw the live particles: dots and squares, round discs, or streaks back
 * along their velocity, in one palette colour each (by age), lit like a
 * sprite where they are unless fullbright. Not sorted: they're small, and
 * additive blending doesn't care about order.
 *
 * @param {import('./view.js').View} view
 * @param {import('../world/particles.js').Particles} ps
 * @param {import('../world/tilemap.js').TileMap} map
 * @param {Uint8Array} fb
 * @param {number} fbW
 * @param {Uint8Array} colormaps
 * @param {Uint8Array[]} tables blend tables by mode (BLEND_ADD, BLEND_HALF)
 */
export function drawParticles(view, ps, map, fb, fbW, colormaps, tables) {
  const n = ps.n;
  if (!n) return;
  const { W, H, x: px, y: py, dirX, dirY, planeX, planeY, fx, fy, camZ, horizon } = view;
  gFb = fb;
  gFbW = fbW;
  gView = view;
  // (The renderer makes mdepth valid in frames with particles: sprites write their depth there.)
  if (!view.depthValid) {
    view.mdepth.fill(Infinity);
    view.depthValid = true;
  }
  gMdepth = view.mdepth;
  frameNo = (frameNo + 1) >>> 0 || 1;
  const invDet = 1 / (planeX * dirY - dirX * planeY);
  const halfW = W / 2;
  const fixed = view.fixedColormap;
  const flags = map.flags;
  const { x: X, y: Y, z: Z, vx: VX, vy: VY, vz: VZ, age, life, type, light, tile, types } = ps;
  for (let i = 0; i < n; i++) {
    const dx = X[i] - px;
    const dy = Y[i] - py;
    const depth = invDet * (-planeY * dx + planeX * dy);
    if (depth < 0.1) continue;
    const inv = 1 / depth;
    const sx = halfW * (1 + invDet * (dirY * dx - dirX * dy) * inv);
    const sy = horizon + (camZ - Z[i]) * fy * inv;
    if (sx < -MAX_STREAK || sx >= W + MAX_STREAK || sy < -MAX_STREAK || sy >= H + MAX_STREAK) continue;
    const t = types[type[i]];
    const f = age[i] / life[i];
    let c = t.colors[(f * t.colors.length) | 0];
    if (fixed >= 0) c = colormaps[fixed * 256 + c];
    else if (!t.fullbright) c = colormaps[litRow(view, light[i], depth, (flags[tile[i]] & F_SKY) !== 0 ? 1 : 0) * 256 + c];
    gBlend = t.blend;
    if (t.blend === BLEND_ADD || t.blend === BLEND_HALF) gTable = tables[t.blend];
    gAlpha = (t.alpha * (1 - f) * 16) | 0;

    if (t.streak) {
      // From where it was `streak` seconds ago to where it is.
      const s = t.streak;
      const bx = dx - VX[i] * s;
      const by = dy - VY[i] * s;
      const bd = invDet * (-planeY * bx + planeX * by);
      let ex = sx;
      let ey = sy;
      if (bd > 0.1) {
        ex = halfW * (1 + (invDet * (dirY * bx - dirX * by)) / bd);
        ey = horizon + ((camZ - Z[i] + VZ[i] * s) * fy) / bd;
      }
      let lx = ex - sx;
      let ly = ey - sy;
      let steps = Math.max(Math.abs(lx), Math.abs(ly)) | 0;
      if (steps > MAX_STREAK) {
        const k = MAX_STREAK / steps;
        lx *= k;
        ly *= k;
        steps = MAX_STREAK;
      }
      const stepX = steps ? lx / steps : 0;
      const stepY = steps ? ly / steps : 0;
      for (let k = 0; k <= steps; k++) {
        const qx = (sx + stepX * k) | 0;
        const qy = (sy + stepY * k) | 0;
        if (qx < 0 || qx >= W || qy < 0 || qy >= H) continue;
        span(qx, qy, qy + 1, depth, c);
      }
      continue;
    }

    let ry = t.size * fy * inv * 0.5;
    const maxR = t.maxPx * 0.5;
    if (ry > maxR) ry = maxR;
    const rx = ry * (fx / fy);
    if (t.disc && ry >= 1) {
      // Round: each column's half-height from the ellipse.
      let x0 = Math.ceil(sx - rx - 0.5);
      let x1 = Math.ceil(sx + rx - 0.5);
      if (x0 < 0) x0 = 0;
      if (x1 > W) x1 = W;
      for (let x = x0; x < x1; x++) {
        const u = (x + 0.5 - sx) / rx;
        const h = ry * Math.sqrt(1 - u * u);
        let ya = Math.ceil(sy - h - 0.5);
        let yb = Math.ceil(sy + h - 0.5);
        if (ya < 0) ya = 0;
        if (yb > H) yb = H;
        if (yb > ya) span(x, ya, yb, depth, c);
      }
      continue;
    }
    // A square, at least one pixel.
    let x0 = Math.ceil(sx - rx - 0.5);
    let x1 = Math.ceil(sx + rx - 0.5);
    if (x1 <= x0) x1 = x0 + 1;
    let ya = Math.ceil(sy - ry - 0.5);
    let yb = Math.ceil(sy + ry - 0.5);
    if (yb <= ya) yb = ya + 1;
    if (x0 < 0) x0 = 0;
    if (x1 > W) x1 = W;
    if (ya < 0) ya = 0;
    if (yb > H) yb = H;
    if (yb <= ya) continue;
    for (let x = x0; x < x1; x++) span(x, ya, yb, depth, c);
  }
  gFb = null;
  gView = null;
}
