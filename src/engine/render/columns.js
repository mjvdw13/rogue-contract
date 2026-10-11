import { F_SOLID, F_DOOR, F_SKY } from '../world/tilemap.js';
import { DIMINISH } from './view.js';

const MAX_STEPS = 160;
const TAU = Math.PI * 2;
/** Added to texture coordinates so they stay positive before masking. */
const V_BIAS = 1 << 16;

/**
 * Draw walls, floors, ceilings and sky, one screen column at a time.
 *
 * Every tile has its own floor and ceiling height ("Doom on a grid"). Each
 * column casts a ray front to back through the tile grid while keeping a
 * window of rows that nothing has covered yet ([clipTop, clipBot)). In each
 * open tile it fills the window with that tile's floor and ceiling. Where the
 * ray crosses into a tile with a higher floor or a lower ceiling it draws that
 * step face. It stops at a solid wall, at a closed part of a door panel, or
 * when the window closes.
 *
 * The window after each tile is recorded per column (view.segDist / segTop /
 * segBot) so sprites can be clipped by ledges and overhangs nearer than them.
 * view.zbuf holds the distance at which the column ended.
 *
 * @param {import('./view.js').View} view
 * @param {import('../world/tilemap.js').TileMap} map
 * @param {import('../assets.js').Texture[]} textures
 * @param {import('../assets.js').Texture|null} sky
 * @param {Uint8Array} fb framebuffer (palette indices)
 * @param {number} fbW framebuffer width
 * @param {Uint8Array} colormaps
 */
export function drawWorld(view, map, textures, sky, fb, fbW, colormaps) {
  const { W, H, x: px, y: py, dirX, dirY, planeX, planeY, fy, camZ, horizon, zbuf, fog } = view;
  const { segDist, segTop, segBot, segCount, lightStart } = view;
  const SEG = view.SEG;
  const mw = map.w;
  const mh = map.h;
  const { flags, wallTex, doorIndex, doors, light, seen, floorZ, ceilZ, floorTex, ceilTex, sideTex, upperTex } = map;
  const fixed = view.fixedColormap;

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

  /** Colormap level for a floor/ceiling pixel at a distance under a tile light. */
  const flatLevel = (l, dist) => {
    if (fixed >= 0) return fixed;
    let b = DIMINISH / (dist < 0.25 ? 0.25 : dist);
    if (b > 24) b = 24;
    const lv = (lightStart[l] - b + dist * fog) | 0;
    return lv < 0 ? 0 : lv > 31 ? 31 : lv;
  };

  for (let x = 0; x < W; x++) {
    const camX = (2 * (x + 0.5)) / W - 1;
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

    let clipTop = 0;
    let clipBot = H;
    let nseg = 0;
    const segBase = x * SEG;
    let cur = mapX >= 0 && mapY >= 0 && mapX < mw && mapY < mh ? mapY * mw + mapX : -1;
    let tEnter = 0;
    let end = 1e6;

    // Fill rows [a, b) of this column with a textured vertical face at distance t.
    // The texture's top row sits at height `anchor` and repeats every unit.
    const face = (t, a, b, anchor, slot, u, lv) => {
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
      let tx = (u * tex.w) | 0;
      if (tx >= tex.w) tx = tex.w - 1;
      const col = tex.curCM;
      const colBase = tx * th;
      const cm = lv * 256;
      const stepV = (th * t) / fy;
      let v = (anchor - camZ) * th + (a + 0.5 - horizon) * stepV + V_BIAS * th;
      const hMask = tex.hMask;
      if (hMask >= 0) {
        for (let y = a; y < b; y++, o += fbW, v += stepV) fb[o] = colormaps[cm + col[colBase + ((v | 0) & hMask)]];
      } else {
        for (let y = a; y < b; y++, o += fbW, v += stepV) fb[o] = colormaps[cm + col[colBase + ((v | 0) % th)]];
      }
    };
    const faceLevel = (tile, t, contrast) => {
      let lv = view.level(light[tile], t) + (fixed >= 0 ? 0 : contrast);
      if (lv < 0) lv = 0;
      else if (lv > 31 && fixed < 0) lv = 31;
      return lv;
    };
    // Floor and ceiling of tile `i` between distances t0 and t1.
    const flats = (i, t0, t1) => {
      const l = light[i];
      const fz = floorZ[i];
      if (camZ > fz) {
        const k = (camZ - fz) * fy;
        let a = Math.ceil(horizon + k / t1 - 0.5);
        let b = t0 > 0 ? Math.ceil(horizon + k / t0 - 0.5) : clipBot;
        if (a < clipTop) a = clipTop;
        if (b > clipBot) b = clipBot;
        const slot = floorTex[i];
        if (b > a) {
          if (slot < 0) {
            for (let y = a, o = a * fbW + x; y < b; y++, o += fbW) fb[o] = 0;
          } else {
            const tex = textures[slot];
            const tw = tex.w;
            const th = tex.h;
            const wm = tex.wMask;
            const hm = tex.hMask;
            const pix = tex.cur;
            for (let y = a, o = a * fbW + x; y < b; y++, o += fbW) {
              const dist = k / (y + 0.5 - horizon);
              const tx = ((px + rdx * dist) * tw) & wm;
              const ty = ((py + rdy * dist) * th) & hm;
              fb[o] = colormaps[flatLevel(l, dist) * 256 + pix[ty * tw + tx]];
            }
          }
        }
        if (a < clipBot) clipBot = a < clipTop ? clipTop : a;
      }
      const cz = ceilZ[i];
      if (cz > camZ) {
        const k = (cz - camZ) * fy;
        let a = t0 > 0 ? Math.ceil(horizon - k / t0 - 0.5) : clipTop;
        let b = Math.ceil(horizon - k / t1 - 0.5);
        if (a < clipTop) a = clipTop;
        if (b > clipBot) b = clipBot;
        if (b > a) {
          if (flags[i] & F_SKY) {
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
            const slot = ceilTex[i];
            if (slot < 0) {
              for (let y = a, o = a * fbW + x; y < b; y++, o += fbW) fb[o] = 0;
            } else {
              const tex = textures[slot];
              const tw = tex.w;
              const th = tex.h;
              const wm = tex.wMask;
              const hm = tex.hMask;
              const pix = tex.cur;
              for (let y = a, o = a * fbW + x; y < b; y++, o += fbW) {
                const dist = k / (horizon - y - 0.5);
                const tx = ((px + rdx * dist) * tw) & wm;
                const ty = ((py + rdy * dist) * th) & hm;
                fb[o] = colormaps[flatLevel(l, dist) * 256 + pix[ty * tw + tx]];
              }
            }
          }
        }
        if (b > clipTop) clipTop = b > clipBot ? clipBot : b;
      }
    };
    const record = (t) => {
      if (nseg < SEG) {
        segDist[segBase + nseg] = t;
        segTop[segBase + nseg] = clipTop;
        segBot[segBase + nseg] = clipBot;
        nseg++;
      }
    };
    // The sky "wall" between two sky tiles of different heights.
    const skyFill = (a, b) => {
      if (a < clipTop) a = clipTop;
      if (b > clipBot) b = clipBot;
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

      // A door panel in the current tile can stop the ray partway through it.
      if (flags[cur] & F_DOOR && step > 0) {
        const door = doors[doorIndex[cur]];
        // Rising doors are drawn as the tile's lowered ceiling, not as a panel.
        if (!door.secret && door.style !== 'rise') {
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
              flats(cur, tEnter, t);
              seen[cur] = 1;
              face(t, rowOf(ceilZ[cur], t), rowOf(floorZ[cur], t), ceilZ[cur], door.tex, du, faceLevel(cur, t, door.axis === 'x' ? 1 : -1));
              end = t;
              break;
            }
          }
        }
      }

      flats(cur, tEnter, tExit);

      if (mapX < 0 || mapY < 0 || mapX >= mw || mapY >= mh) {
        face(tExit, clipTop, clipBot, 0, -1, 0, 0);
        end = tExit;
        break;
      }
      const next = mapY * mw + mapX;
      const f = flags[next];
      const contrast = side === 0 ? 1 : -1;
      let wx = side === 0 ? py + tExit * rdy : px + tExit * rdx;
      wx -= Math.floor(wx);
      if (side === 0 ? rdx < 0 : rdy > 0) wx = 1 - wx;

      let solid = (f & F_SOLID) !== 0;
      let tex = wallTex[next];
      let u = wx;
      if (f & F_DOOR) {
        const door = doors[doorIndex[next]];
        if (door.secret) {
          // Secret doors sit flush with the wall around them and slide sideways.
          let du = door.axis === 'x' ? py + rdy * tExit - mapY : px + rdx * tExit - mapX;
          if (du >= door.open) {
            du -= door.open;
            if (side === 0 ? rdx < 0 : rdy > 0) du = 1 - du;
            solid = true;
            tex = door.tex;
            u = du;
          }
        }
      } else if (solid && flags[cur] & F_DOOR) {
        const jamb = doors[doorIndex[cur]].jamb;
        if (jamb >= 0) tex = jamb;
      }

      if (solid) {
        seen[next] = 1;
        face(tExit, rowOf(ceilZ[cur], tExit), rowOf(floorZ[cur], tExit), ceilZ[cur], tex, u, faceLevel(cur, tExit, contrast));
        end = tExit;
        break;
      }

      // Step faces into the next open tile.
      const fN = floorZ[next];
      const cN = ceilZ[next];
      const fC = floorZ[cur];
      const cC = ceilZ[cur];
      if (fN > fC) {
        const a = rowOf(fN, tExit);
        seen[next] = 1;
        face(tExit, a, rowOf(fC, tExit), fN, sideTex[next], wx, faceLevel(cur, tExit, contrast));
        if (a < clipBot) clipBot = a < clipTop ? clipTop : a;
      }
      if (cN < cC) {
        const b = rowOf(cN, tExit);
        if (flags[cur] & F_SKY && flags[next] & F_SKY) skyFill(rowOf(cC, tExit), b);
        else {
          seen[next] = 1;
          const lv = faceLevel(cur, tExit, contrast);
          const top = rowOf(cC, tExit);
          const door = f & F_DOOR ? doors[doorIndex[next]] : null;
          if (door?.style === 'rise') {
            // The lintel above the opening keeps the tile's upper texture; only
            // the moving part below openZ is the door, anchored to its bottom edge.
            const split = cC > door.openZ ? rowOf(door.openZ, tExit) : top;
            if (split > top) face(tExit, top, split, cC, upperTex[next], wx, lv);
            face(tExit, split, b, cN + 1, door.tex, wx, lv);
          } else {
            face(tExit, top, b, cN + 1, upperTex[next], wx, lv);
          }
        }
        if (b > clipTop) clipTop = b > clipBot ? clipBot : b;
      }
      record(tExit);
      if (clipTop >= clipBot) {
        end = tExit;
        break;
      }
      cur = next;
      tEnter = tExit;
    }

    zbuf[x] = end;
    segCount[x] = nseg;
  }
}
