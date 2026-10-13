import { TRANSPARENT } from '../config.js';

/** Nearest depth drawn; polygons are clipped here. */
export const NEAR = 0.05;
/** Direction the light comes from (x east, y south, z up): from above, north-west. */
const LIGHT = (() => {
  const v = [-0.5, -0.35, 0.8];
  const l = Math.hypot(...v);
  return v.map((c) => c / l);
})();
/** Colormap levels darker for a face turned fully away from the light. */
export const SHADE = 8;
const MAX_POLY = 16;

// Scratch space: per-vertex camera space, and the clipped polygon.
let camD = new Float64Array(256);
let camX = new Float64Array(256);
let camZ_ = new Float64Array(256);
let worldX = new Float64Array(256);
let worldY = new Float64Array(256);
let worldZ = new Float64Array(256);
const inD = new Float64Array(MAX_POLY);
const inX = new Float64Array(MAX_POLY);
const inZ = new Float64Array(MAX_POLY);
const inU = new Float64Array(MAX_POLY);
const inV = new Float64Array(MAX_POLY);
const sx = new Float64Array(MAX_POLY);
const sy = new Float64Array(MAX_POLY);
const siz = new Float64Array(MAX_POLY);
const suz = new Float64Array(MAX_POLY);
const svz = new Float64Array(MAX_POLY);

/**
 * Draw every visible thing that has a `model` (gfx/model.js), in true 3D.
 *
 * Vertices go into camera space with the sprite transform. Faces pointing away
 * from the camera are dropped, the rest are clipped at the near plane and
 * filled column by column: 1/depth (and u/depth, v/depth for textures) is
 * linear in screen space, so it is interpolated along the edges and down each
 * column. Every pixel is checked at its own depth against the wall depth
 * (`zbuf`), the ledge windows (`segDist` / `segTop` / `segBot`) and the
 * model depth buffer (`mdepth`), which sprites test against afterwards.
 *
 * @param {import('./view.js').View} view
 * @param {Array<any>} things
 * @param {import('../world/tilemap.js').TileMap} map
 * @param {import('../assets.js').Texture[]} textures
 * @returns {boolean} whether the depth buffer is in use (a fence or model may have drawn)
 */
export function drawModels(view, things, map, textures, fb, fbW, colormaps, skip) {
  const { W, H, x: px, y: py, dirX, dirY, planeX, planeY, fy, camZ, horizon, zbuf, mdepth } = view;
  const { segDist, segTop, segBot, segFirst, segCount, SEG } = view;
  const invDet = 1 / (planeX * dirY - dirX * planeY);
  const halfW = W / 2;
  let cleared = view.depthValid;

  for (const t of things) {
    const model = t.model;
    if (!model || t === skip || t.removed || t.hidden) continue;
    const s = t.def?.scale ?? 1;
    // Cull on the bounding cylinder.
    const r = model.radius * s;
    const cdx = t.x - px;
    const cdy = t.y - py;
    const cDepth = invDet * (-planeY * cdx + planeX * cdy);
    if (cDepth + r < NEAR) continue;
    const cTx = invDet * (dirY * cdx - dirX * cdy);
    if (Math.abs(cTx) - r > cDepth + r) continue;

    const nv = model.verts.length / 3;
    if (camD.length < nv) {
      const n = nv * 2;
      [camD, camX, camZ_, worldX, worldY, worldZ] = [0, 0, 0, 0, 0, 0].map(() => new Float64Array(n));
    }
    const c = Math.cos(t.angle ?? 0);
    const sn = Math.sin(t.angle ?? 0);
    const tz = t.z ?? 0;
    const vs = model.verts;
    for (let i = 0; i < nv; i++) {
      const mx = vs[i * 3] * s;
      const my = vs[i * 3 + 1] * s;
      const wx = t.x + mx * c - my * sn;
      const wy = t.y + mx * sn + my * c;
      const wz = tz + vs[i * 3 + 2] * s;
      worldX[i] = wx;
      worldY[i] = wy;
      worldZ[i] = wz;
      const dx = wx - px;
      const dy = wy - py;
      camD[i] = invDet * (-planeY * dx + planeX * dy);
      camX[i] = invDet * (dirY * dx - dirX * dy);
      camZ_[i] = wz - camZ;
    }

    const tile = map.inBounds(t.x | 0, t.y | 0) ? (t.y | 0) * map.w + (t.x | 0) : -1;
    const light = tile >= 0 && map.lightmap ? map.lightmap.sample(t.x, t.y, map.storeyAt(tile, (t.z ?? 0) + 0.5)) : 128;
    const fixed = view.fixedColormap;

    for (const f of model.faces) {
      const idx = f.v;
      const m = idx.length;
      if (m > MAX_POLY - 2) continue;
      // Facing: the world-space normal against the eye.
      let nx = f.nx * c - f.ny * sn;
      let ny = f.nx * sn + f.ny * c;
      let nz = f.nz;
      const v0 = idx[0];
      const facing = nx * (px - worldX[v0]) + ny * (py - worldY[v0]) + nz * (camZ - worldZ[v0]);
      if (facing <= 0) {
        if (!f.twoSided) continue;
        nx = -nx;
        ny = -ny;
        nz = -nz;
      }

      // Clip at the near plane (Sutherland-Hodgman), in camera space.
      let k = 0;
      const uv = f.uv;
      for (let i = 0; i < m; i++) {
        const a = idx[i];
        const b = idx[(i + 1) % m];
        const da = camD[a];
        const db = camD[b];
        if (da >= NEAR) {
          inD[k] = da;
          inX[k] = camX[a];
          inZ[k] = camZ_[a];
          if (uv) {
            inU[k] = uv[i * 2];
            inV[k] = uv[i * 2 + 1];
          }
          k++;
        }
        if (da >= NEAR !== db >= NEAR) {
          const q = (NEAR - da) / (db - da);
          inD[k] = NEAR;
          inX[k] = camX[a] + (camX[b] - camX[a]) * q;
          inZ[k] = camZ_[a] + (camZ_[b] - camZ_[a]) * q;
          if (uv) {
            const j = (i + 1) % m;
            inU[k] = uv[i * 2] + (uv[j * 2] - uv[i * 2]) * q;
            inV[k] = uv[i * 2 + 1] + (uv[j * 2 + 1] - uv[i * 2 + 1]) * q;
          }
          k++;
        }
      }
      if (k < 3) continue;

      // Project.
      let minX = Infinity;
      let maxX = -Infinity;
      for (let i = 0; i < k; i++) {
        const iz = 1 / inD[i];
        sx[i] = halfW * (1 + inX[i] * iz);
        sy[i] = horizon - inZ[i] * fy * iz;
        siz[i] = iz;
        if (uv) {
          suz[i] = inU[i] * iz;
          svz[i] = inV[i] * iz;
        }
        if (sx[i] < minX) minX = sx[i];
        if (sx[i] > maxX) maxX = sx[i];
      }
      let x0 = Math.ceil(minX - 0.5);
      let x1 = Math.ceil(maxX - 0.5);
      if (x0 < 0) x0 = 0;
      if (x1 > W) x1 = W;
      if (x1 <= x0) continue;

      if (!cleared) {
        mdepth.fill(Infinity);
        cleared = true;
      }

      // Light: the tile's light and distance, darkened on faces turned from
      // the light. The shading wraps all the way round, so faces turned away
      // still differ from each other.
      const lit = (nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2] + 1) / 2;
      const shade = Math.round(SHADE * (1 - lit));
      const glow = f.glow;
      const color = f.color;
      const tex = f.slot >= 0 ? textures[f.slot] : null;
      const tw = tex ? tex.w : 0;
      const th = tex ? tex.h : 0;
      const wm = tex ? tex.wMask : 0;
      const hm = tex ? tex.hMask : 0;
      const pix = tex ? tex.cur : null;

      for (let x = x0; x < x1; x++) {
        const xc = x + 0.5;
        // Where the column crosses the polygon's edges: the top and bottom of its span.
        let n = 0;
        let yA = 0;
        let izA = 0;
        let uA = 0;
        let vA = 0;
        let yB = 0;
        let izB = 0;
        let uB = 0;
        let vB = 0;
        for (let i = 0; i < k; i++) {
          const j = i + 1 === k ? 0 : i + 1;
          const xa = sx[i];
          const xb = sx[j];
          if (!((xa <= xc && xc < xb) || (xb <= xc && xc < xa))) continue;
          const q = (xc - xa) / (xb - xa);
          const y = sy[i] + (sy[j] - sy[i]) * q;
          const iz = siz[i] + (siz[j] - siz[i]) * q;
          const u = uv ? suz[i] + (suz[j] - suz[i]) * q : 0;
          const v = uv ? svz[i] + (svz[j] - svz[i]) * q : 0;
          if (n === 0) {
            yA = y;
            izA = iz;
            uA = u;
            vA = v;
          } else {
            yB = y;
            izB = iz;
            uB = u;
            vB = v;
          }
          if (++n === 2) break;
        }
        if (n < 2) continue;
        if (yB < yA) {
          let tmp = yA;
          yA = yB;
          yB = tmp;
          tmp = izA;
          izA = izB;
          izB = tmp;
          tmp = uA;
          uA = uB;
          uB = tmp;
          tmp = vA;
          vA = vB;
          vB = tmp;
        }
        const span = yB - yA;
        if (span <= 0) continue;
        let y0 = Math.ceil(yA - 0.5);
        let y1 = Math.ceil(yB - 0.5);
        if (y0 < 0) y0 = 0;
        if (y1 > H) y1 = H;
        if (y1 <= y0) continue;

        const wallT = zbuf[x];
        const sb = x * SEG;
        const ns = segCount[x];
        let seg = 0; // ledge windows nearer than the pixel: segments [0, seg)
        const dIz = (izB - izA) / span;
        const dU = (uB - uA) / span;
        const dV = (vB - vA) / span;
        for (let y = y0; y < y1; y++) {
          const along = y + 0.5 - yA;
          const iz = izA + dIz * along;
          const depth = 1 / iz;
          if (depth >= wallT) continue;
          const o = y * fbW + x;
          if (depth >= mdepth[o]) continue;
          while (seg < ns && segDist[sb + seg] < depth) seg++;
          while (seg > 0 && segDist[sb + seg - 1] >= depth) seg--;
          if (seg > 0) {
            // Inside one of the windows of the last batch nearer than the pixel?
            let k = seg - 1;
            while (!(y >= segTop[sb + k] && y < segBot[sb + k]) && !segFirst[sb + k]) k--;
            if (!(y >= segTop[sb + k] && y < segBot[sb + k])) continue;
          }
          let ci;
          if (pix) {
            const u = (uA + dU * along) * depth;
            const v = (vA + dV * along) * depth;
            ci = pix[(Math.floor(v * th) & hm) * tw + (Math.floor(u * tw) & wm)];
            if (ci === TRANSPARENT) continue;
          } else ci = color;
          let lv;
          if (fixed >= 0) lv = fixed;
          else if (glow) lv = 0;
          else {
            lv = view.level(light, depth) + shade;
            if (lv > 31) lv = 31;
          }
          mdepth[o] = depth;
          fb[o] = colormaps[lv * 256 + ci];
        }
      }
    }
  }
  return cleared;
}
