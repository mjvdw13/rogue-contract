import { TEXELS_PER_UNIT, TRANSPARENT } from '../config.js';

const visible = [];
let fuzzPos = 0;
const FUZZ = [1, -1, 1, -1, 1, 1, -1, 1, 1, -1, 1, 1, 1, -1, 1, 1, 1, -1, -1, -1, -1, 1, -1, -1, 1, 1, 1, 1, -1, 1, -1, 1];

/**
 * Draw billboard sprites for every visible thing, far to near, clipped
 * against the wall depth buffer.
 *
 * A thing is drawable when it has `sheet` (a Sheet), `frame` (index) and
 * position x/y/z. Optional: `fullbright` (current frame glows), `flipX`,
 * `def.scale`, `def.renderStyle` ('normal' | 'fuzz').
 *
 * @param {import('./view.js').View} view
 * @param {Array<any>} things
 * @param {import('../world/tilemap.js').TileMap} map
 */
export function drawSprites(view, things, map, fb, fbW, colormaps, skip) {
  const { W, H, x: px, y: py, dirX, dirY, planeX, planeY, fx, fy, camZ, horizon, zbuf } = view;
  const { segDist, segTop, segBot, segCount, SEG } = view;
  const invDet = 1 / (planeX * dirY - dirX * planeY);
  visible.length = 0;
  for (const t of things) {
    if (t === skip || t.removed || t.hidden || !t.sheet) continue;
    const dx = t.x - px;
    const dy = t.y - py;
    const depth = invDet * (-planeY * dx + planeX * dy);
    if (depth < 0.08) continue;
    const tx = invDet * (dirY * dx - dirX * dy);
    // Rough horizontal cull (sprites are at most a few units wide).
    if (Math.abs(tx / depth) > 1 + 3 / depth) continue;
    t._depth = depth;
    t._tx = tx;
    visible.push(t);
  }
  visible.sort((a, b) => b._depth - a._depth);

  for (const t of visible) {
    const frame = t.sheet.frame(t.frame);
    const depth = t._depth;
    const scale = (t.def?.scale ?? 1) / TEXELS_PER_UNIT;
    const spriteW = (frame.w * scale * fx) / depth;
    const spriteH = (frame.h * scale * fy) / depth;
    if (spriteW < 0.5 || spriteH < 0.5) continue;
    const screenX = (W / 2) * (1 + t._tx / depth);
    const left = screenX - spriteW / 2;
    // Projectiles hang centred on their z; everything else stands on it.
    const z = t.kind === 'projectile' ? t.z - (frame.h * scale) / 2 : t.z ?? 0;
    const bottom = horizon + ((camZ - z) * fy) / depth;
    const top = bottom - spriteH;

    let x0 = Math.ceil(left - 0.5);
    let x1 = Math.ceil(left + spriteW - 0.5);
    if (x0 < 0) x0 = 0;
    if (x1 > W) x1 = W;
    if (x1 <= x0) continue;

    let lv;
    if (view.fixedColormap >= 0) lv = view.fixedColormap;
    else if (t.fullbright) lv = 0;
    else {
      const tile = map.inBounds(t.x | 0, t.y | 0) ? (t.y | 0) * map.w + (t.x | 0) : -1;
      lv = view.level(tile >= 0 ? map.light[tile] : 128, depth);
    }
    const cm = lv * 256;
    const fuzz = t.def?.renderStyle === 'fuzz';
    const texScaleX = frame.w / spriteW;
    const texScaleY = frame.h / spriteH;
    const fh = frame.h;
    const cmData = frame.cm;

    for (let x = x0; x < x1; x++) {
      if (depth >= zbuf[x]) continue;
      // The rows still uncovered by ledges and overhangs nearer than the sprite.
      let winTop = 0;
      let winBot = H;
      const sb = x * SEG;
      for (let k = 0, n = segCount[x]; k < n && segDist[sb + k] < depth; k++) {
        winTop = segTop[sb + k];
        winBot = segBot[sb + k];
      }
      if (winBot <= winTop) continue;
      let tx = ((x + 0.5 - left) * texScaleX) | 0;
      if (tx >= frame.w) tx = frame.w - 1;
      if (t.flipX) tx = frame.w - 1 - tx;
      const ct = frame.top[tx];
      if (ct < 0) continue;
      const cb = frame.bottom[tx];
      let y0 = Math.ceil(top + ct / texScaleY - 0.5);
      let y1 = Math.ceil(top + (cb + 1) / texScaleY - 0.5);
      if (y0 < winTop) y0 = winTop;
      if (y1 > winBot) y1 = winBot;
      const base = tx * fh;
      for (let y = y0; y < y1; y++) {
        let ty = ((y + 0.5 - top) * texScaleY) | 0;
        if (ty >= fh) ty = fh - 1;
        const c = cmData[base + ty];
        if (c === TRANSPARENT) continue;
        const o = y * fbW + x;
        if (fuzz) {
          const src = o + FUZZ[fuzzPos++ & 31] * fbW;
          fb[o] = colormaps[6 * 256 + fb[src < 0 || src >= fb.length ? o : src]];
        } else {
          fb[o] = colormaps[cm + c];
        }
      }
    }
  }
}
