/**
 * Draw first-person weapon sprites ("psprites") at 1:1 pixel scale, anchored
 * to the bottom centre of the view, lit by the light where the player stands.
 * The view spans the whole surface, so its centre is found past the draw
 * origin.
 *
 * @param {import('./view.js').View} view
 * @param {Array<{sheet:any, frame:number, x:number, y:number, fullbright?:boolean}>} list
 * @param {import('../gfx/surface.js').Surface} surface
 * @param {Uint8Array} colormaps
 * @param {number} level colormap level for non-fullbright frames
 */
export function drawPsprites(view, list, surface, colormaps, level) {
  for (const p of list) {
    if (!p || !p.sheet) continue;
    const frame = p.sheet.frame(p.frame);
    let lv = view.fixedColormap >= 0 ? view.fixedColormap : p.fullbright ? 0 : level;
    if (lv < 0) lv = 0;
    const remap = colormaps.subarray(lv * 256, lv * 256 + 256);
    const x = Math.round(view.W / view.scale / 2 - surface.ox - frame.w / 2 + p.x);
    const y = Math.round(view.H / view.scale - frame.h + p.y);
    surface.blit(frame, x, y, { remap });
  }
}
