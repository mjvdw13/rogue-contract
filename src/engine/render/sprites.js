import { TEXELS_PER_UNIT, TRANSPARENT } from '../config.js';
import { F_SKY } from '../world/tilemap.js';

const visible = [];
let fuzzPos = 0;
/** Glint pixels are lit at the sprite's light plus this many times the glint light where it stands. */
export const GLINT_GAIN = 3;
const FUZZ = [1, -1, 1, -1, 1, 1, -1, 1, 1, -1, 1, 1, 1, -1, 1, 1, 1, -1, -1, -1, -1, 1, -1, -1, 1, 1, 1, 1, -1, 1, -1, 1];

/**
 * Draw billboard sprites for every visible thing, far to near, clipped
 * against the wall depth buffer, the ledge windows and any fence or model
 * pixels (view.mdepth, when one drew this frame).
 *
 * A thing is drawable when it has `sheet` (a Sheet), `frame` (index) and
 * position x/y/z. Optional: `fullbright` (current frame glows), `flipX`,
 * `def.scale`, `def.renderStyle` ('normal' | 'fuzz'). A frame's `glint` pixels
 * brighten with the glint light (`map.glintmap`) where the thing stands.
 *
 * @param {import('./view.js').View} view
 * @param {Array<any>} things
 * @param {import('../world/tilemap.js').TileMap} map
 */
export function drawSprites(view, things, map, fb, fbW, colormaps, skip) {
  const { W, H, x: px, y: py, dirX, dirY, planeX, planeY, fx, fy, camZ, horizon, zbuf } = view;
  const { segDist, segTop, segBot, segFirst, segCount, SEG } = view;
  const mdepth = view.depthValid ? view.mdepth : null;
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
    const scale = ((t.def?.scale ?? 1) * (t.sheet.scale ?? 1)) / TEXELS_PER_UNIT;
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

    const fuzz = t.def?.renderStyle === 'fuzz';
    let lv;
    // Glint pixels (armour highlights) brighten with the light sources that can see the sprite.
    let gv = -1;
    if (view.fixedColormap >= 0) lv = view.fixedColormap;
    else if (t.fullbright) lv = 0;
    else {
      // The smooth light where it stands, in its storey.
      const tile = map.inBounds(t.x | 0, t.y | 0) ? (t.y | 0) * map.w + (t.x | 0) : -1;
      const storey = tile >= 0 ? map.storeyAt(tile, (t.z ?? 0) + 0.5) : 0;
      const light = tile >= 0 && map.lightmap ? map.lightmap.sample(t.x, t.y, storey) : 128;
      // (Outdoors in haze, fading toward the haze colour.)
      const outdoor = tile >= 0 && (map.flags[tile] & F_SKY) !== 0;
      lv = view.row(light, depth, outdoor);
      if (frame.glint && !fuzz && tile >= 0 && map.glintmap) {
        const g = map.glintmap.sample(t.x, t.y, storey);
        if (g >= 1) gv = view.row(light + g * GLINT_GAIN, depth, outdoor);
      }
    }
    const cm = lv * 256;
    const gcm = gv * 256;
    const gmask = gv >= 0 ? frame.glint : null;
    const texScaleX = frame.w / spriteW;
    const texScaleY = frame.h / spriteH;
    const fh = frame.h;
    const cmData = frame.cm;

    for (let x = x0; x < x1; x++) {
      if (depth >= zbuf[x]) continue;
      // The rows still uncovered by ledges and overhangs nearer than the
      // sprite: the last batch of windows recorded nearer than it (or the
      // whole column), sb + first .. sb + last.
      const sb = x * SEG;
      let last = -1;
      for (let k = 0, n = segCount[x]; k < n && segDist[sb + k] < depth; k++) last = k;
      let first = last;
      while (first > 0 && !segFirst[sb + first]) first--;
      let tx = ((x + 0.5 - left) * texScaleX) | 0;
      if (tx >= frame.w) tx = frame.w - 1;
      if (t.flipX) tx = frame.w - 1 - tx;
      const ct = frame.top[tx];
      if (ct < 0) continue;
      const cb = frame.bottom[tx];
      const base = tx * fh;
      // (With no batch nearer, `first` and `last` are -1: one pass over the whole column.)
      for (let k = first; k <= last; k++) {
        const winTop = k < 0 ? 0 : segTop[sb + k];
        const winBot = k < 0 ? H : segBot[sb + k];
        let y0 = Math.ceil(top + ct / texScaleY - 0.5);
        let y1 = Math.ceil(top + (cb + 1) / texScaleY - 0.5);
        if (y0 < winTop) y0 = winTop;
        if (y1 > winBot) y1 = winBot;
        for (let y = y0; y < y1; y++) {
          let ty = ((y + 0.5 - top) * texScaleY) | 0;
          if (ty >= fh) ty = fh - 1;
          const c = cmData[base + ty];
          if (c === TRANSPARENT) continue;
          const o = y * fbW + x;
          if (mdepth && depth >= mdepth[o]) continue;
          if (fuzz) {
            const src = o + FUZZ[fuzzPos++ & 31] * fbW;
            fb[o] = colormaps[6 * 256 + fb[src < 0 || src >= fb.length ? o : src]];
          } else {
            fb[o] = colormaps[(gmask && gmask[base + ty] ? gcm : cm) + c];
          }
        }
      }
    }
  }
}
