/** Nearest depth a rope is drawn at; segments are clipped here. */
const NEAR = 0.1;
/** Ropes are at most this many pixels thick, however near. */
const MAX_PX = 4;

// Scratch: each point of the rope being drawn, in camera space.
const camD = new Float64Array(64);
const camX = new Float64Array(64);
const camZ = new Float64Array(64);

/**
 * Draw the hangings' ropes: each segment a line from point to point, at
 * least a pixel thick, one span of rows per screen column it crosses, in the
 * rope's colour lit where the segment starts.
 * Every pixel is checked against the walls (zbuf), the ledge windows nearer
 * than it (as sprites are) and the depth of models and fences (mdepth), and
 * writes its own depth there, so sprites and particles behind it hide.
 * (The cloths are models: the model drawer draws them.)
 *
 * @param {import('./view.js').View} view
 * @param {import('../world/hangings.js').Hangings} hs
 * @param {Uint8Array} fb
 * @param {number} fbW
 * @param {Uint8Array} colormaps
 */
export function drawRopes(view, hs, fb, fbW, colormaps) {
  const { W, H, x: px, y: py, dirX, dirY, planeX, planeY, fy, horizon, zbuf, mdepth } = view;
  const { segDist, segTop, segBot, segFirst, segCount, SEG } = view;
  const invDet = 1 / (planeX * dirY - dirX * planeY);
  const halfW = W / 2;
  const fixed = view.fixedColormap;
  const { x: X, y: Y, z: Z, light, outdoor } = hs;
  for (const h of hs.list) {
    if (h.shape !== 'rope') continue;
    // Cull on its reach: wholly behind the eye, or off to the side.
    const cdx = h.cx - px;
    const cdy = h.cy - py;
    const cDepth = invDet * (-planeY * cdx + planeX * cdy);
    if (cDepth + h.radius < NEAR) continue;
    const cTx = invDet * (dirY * cdx - dirX * cdy);
    if (Math.abs(cTx) - h.radius > cDepth + h.radius) continue;
    const t = h.type;
    const n = h.np;
    for (let i = 0, p = h.p0; i < n; i++, p++) {
      const dx = X[p] - px;
      const dy = Y[p] - py;
      camD[i] = invDet * (-planeY * dx + planeX * dy);
      camX[i] = invDet * (dirY * dx - dirX * dy);
      camZ[i] = Z[p] - view.camZ;
    }
    for (let i = 0; i + 1 < n; i++) {
      let da = camD[i];
      let db = camD[i + 1];
      if (da < NEAR && db < NEAR) continue;
      let xa = camX[i];
      let xb = camX[i + 1];
      let za = camZ[i];
      let zb = camZ[i + 1];
      // Clip at the near plane.
      if (da < NEAR) {
        const q = (NEAR - da) / (db - da);
        xa += (xb - xa) * q;
        za += (zb - za) * q;
        da = NEAR;
      } else if (db < NEAR) {
        const q = (NEAR - db) / (da - db);
        xb += (xa - xb) * q;
        zb += (za - zb) * q;
        db = NEAR;
      }
      const iza = 1 / da;
      const izb = 1 / db;
      const sxa = halfW * (1 + xa * iza);
      const sya = horizon - za * fy * iza;
      const sxb = halfW * (1 + xb * izb);
      const syb = horizon - zb * fy * izb;
      if ((sxa < 0 && sxb < 0) || (sxa >= W && sxb >= W) || (sya < 0 && syb < 0) || (sya >= H && syb >= H)) continue;
      const p = h.p0 + i;
      let c = t.color;
      if (fixed >= 0) c = colormaps[fixed * 256 + c];
      else if (!t.fullbright) c = colormaps[view.row(light[p], (da + db) / 2, outdoor[p] === 1) * 256 + c];
      const lx = sxb - sxa;
      const ly = syb - sya;
      // Thickness by depth (the nearer end's, so it doesn't vary across a column).
      const wpx = t.width * fy;
      let th = wpx * (iza > izb ? iza : izb);
      if (th < 1) th = 1;
      else if (th > MAX_PX) th = MAX_PX;
      const half = th * 0.5;
      // One span per column: the rows the line crosses in it, thickened.
      let x0 = Math.floor((sxa < sxb ? sxa : sxb) - half);
      let x1 = Math.ceil((sxa > sxb ? sxa : sxb) + half);
      if (x0 < 0) x0 = 0;
      if (x1 > W) x1 = W;
      const flat = Math.abs(lx) < 1e-6;
      for (let x = x0; x < x1; x++) {
        let qa = 0;
        let qb = 1;
        if (!flat) {
          qa = (x - half - sxa) / lx;
          qb = (x + 1 + half - sxa) / lx;
          if (qa > qb) {
            const tmp = qa;
            qa = qb;
            qb = tmp;
          }
          if (qa < 0) qa = 0;
          if (qb > 1) qb = 1;
          if (qa > qb) continue;
        }
        const depth = 1 / (iza + (izb - iza) * (qa + qb) * 0.5);
        if (depth >= zbuf[x]) continue;
        let ta = sya + ly * qa;
        let tb = sya + ly * qb;
        if (ta > tb) {
          const tmp = ta;
          ta = tb;
          tb = tmp;
        }
        let ya = Math.round(ta - half + 0.5);
        let yb = Math.round(tb + half - 0.5);
        if (yb <= ya) yb = ya + 1;
        if (ya < 0) ya = 0;
        if (yb > H) yb = H;
        if (yb <= ya) continue;
        const sb = x * SEG;
        // The last window nearer than the rope (windows are recorded near to far): a binary search.
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
        for (let w = first; w <= last; w++) {
          let y0 = w < 0 ? 0 : segTop[sb + w];
          let y1 = w < 0 ? H : segBot[sb + w];
          if (y0 < ya) y0 = ya;
          if (y1 > yb) y1 = yb;
          for (let o = y0 * fbW + x, e = y1 * fbW + x; o < e; o += fbW) {
            if (depth < mdepth[o]) {
              mdepth[o] = depth;
              fb[o] = c;
            }
          }
        }
      }
    }
  }
}
