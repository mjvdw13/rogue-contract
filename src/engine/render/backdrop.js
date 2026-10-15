import { TEXELS_PER_UNIT as TPU } from '../config.js';
import { HAZE_ROW } from '../gfx/palette.js';

/**
 * Draw one screen column of a backdrop (world/backdrop.js) into the
 * framebuffer `fb`, over the sky: voxel-space style, marching the column's
 * ray out over the height grid from near to far and filling each sample's
 * span up to the rows nearer samples have covered. Spans take the face
 * texture for each row's height, so cliffs show their strata. The world
 * renderer calls this once a column is done, with the rows that showed sky
 * marked (non-zero) in `sky` between rows `lo` and `hi`; only those rows
 * are drawn (the sky stays where the backdrop doesn't reach), and the marks
 * are cleared.
 *
 * @param {import('./view.js').View} view
 * @param {import('../world/backdrop.js').Backdrop} bd
 * @param {Float32Array} thr the column's four dither thresholds
 */
export function drawBackdropColumn(view, bd, textures, colormaps, fb, sky, fbW, x, rdx, rdy, thr, lo, hi) {
  const { horizon, fy, camZ, fixedColormap: fixed } = view;
  const px = view.x;
  const py = view.y;
  // Outdoors in haze it fades toward the haze colour instead of fogging darker.
  const hazeOn = view.hazeOn;
  let ybuf = hi;
  let t = 1;
  let dt = 0.25;
  // (Past where the ray leaves the grid there's nothing to draw.)
  const exit = bd.exit(px, py, rdx, rdy);
  const far = exit < bd.far ? exit : bd.far;
  while (t < far && ybuf > lo) {
    const wx = px + rdx * t;
    const wy = py + rdy * t;
    const h = bd.heightAt(wx, wy);
    if (h > -Infinity) {
      let top = Math.ceil(horizon + ((camZ - h) * fy) / t - 0.5);
      if (top < ybuf) {
        if (top < lo) top = lo;
        const lv = fixed >= 0 ? fixed : view.levelF(bd.lightAt(wx, wy), t) - (hazeOn ? t * view.fog : 0);
        const hz = hazeOn && fixed < 0 ? view.hazeF(t) : 0;
        const u = (bd.faceU(wx, wy) * TPU) | 0;
        const zStep = t / fy;
        let z = camZ - (top + 0.5 - horizon) * zStep;
        for (let y = top, o = top * fbW + x; y < ybuf; y++, o += fbW, z -= zStep) {
          if (!sky[o]) continue;
          const tex = textures[bd.texAt(z)];
          const th = tex.h;
          const tw = tex.w;
          let v = ((-z * TPU) | 0) % th;
          if (v < 0) v += th;
          let tu = u % tw;
          if (tu < 0) tu += tw;
          const d = thr[y & 3];
          let l = fixed >= 0 ? fixed : (lv + d) | 0;
          if (l < 0) l = 0;
          else if (l > 31) l = 31;
          if (hz > 0) {
            const k = (hz + d + 0.5) | 0;
            if (k) l += HAZE_ROW + (k - 1) * 32;
          }
          fb[o] = colormaps[l * 256 + tex.curCM[tu * th + v]];
        }
        ybuf = top;
      }
    }
    t += dt;
    dt = t * 0.012 > 0.25 ? t * 0.012 : 0.25;
  }
  for (let y = lo, o = lo * fbW + x; y < hi; y++, o += fbW) sky[o] = 0;
}
