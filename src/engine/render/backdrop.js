import { TRANSPARENT, TEXELS_PER_UNIT as TPU } from '../config.js';
import { HAZE_ROW } from '../gfx/palette.js';

/**
 * Draw one screen column of a backdrop (world/backdrop.js) into `out` (the
 * view's backdrop buffer, laid out like the framebuffer): voxel-space style,
 * marching the column's ray out over the height grid from near to far and
 * filling each sample's span up to the rows nearer samples have covered.
 * Spans take the face texture for each row's height, so cliffs show their
 * strata. Rows it doesn't reach are TRANSPARENT (the sky shows). The world
 * renderer calls this for a column the first time it draws sky there, and
 * puts the backdrop's pixels in place of the sky's.
 *
 * @param {import('./view.js').View} view
 * @param {import('../world/backdrop.js').Backdrop} bd
 * @param {Float32Array} thr the column's four dither thresholds
 */
export function drawBackdropColumn(view, bd, textures, colormaps, out, fbW, x, rdx, rdy, thr) {
  const { H, horizon, fy, camZ, fixedColormap: fixed } = view;
  const px = view.x;
  const py = view.y;
  // Outdoors in haze it fades toward the haze colour instead of fogging darker.
  const hazeOn = view.hazeOn;
  for (let y = 0, o = x; y < H; y++, o += fbW) out[o] = TRANSPARENT;
  let ybuf = H;
  let t = 1;
  let dt = 0.25;
  while (t < bd.far && ybuf > 0) {
    const wx = px + rdx * t;
    const wy = py + rdy * t;
    const h = bd.heightAt(wx, wy);
    if (h > -Infinity) {
      let top = Math.ceil(horizon + ((camZ - h) * fy) / t - 0.5);
      if (top < ybuf) {
        if (top < 0) top = 0;
        const lv = fixed >= 0 ? fixed : view.levelF(bd.lightAt(wx, wy), t) - (hazeOn ? t * view.fog : 0);
        const hz = hazeOn && fixed < 0 ? view.hazeF(t) : 0;
        const u = ((wx + wy) * TPU) | 0;
        const zStep = t / fy;
        let z = camZ - (top + 0.5 - horizon) * zStep;
        for (let y = top, o = top * fbW + x; y < ybuf; y++, o += fbW, z -= zStep) {
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
          out[o] = colormaps[l * 256 + tex.curCM[tu * th + v]];
        }
        ybuf = top;
      }
    }
    t += dt;
    dt = t * 0.012 > 0.25 ? t * 0.012 : 0.25;
  }
}
