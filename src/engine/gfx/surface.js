import { TRANSPARENT } from '../config.js';

/**
 * An 8-bit palette-indexed drawing surface (the framebuffer and any scratch
 * buffers). All UI drawing happens at 1:1 pixel scale.
 *
 * `ox` is the draw origin: every drawing method shifts x by it. On a
 * widescreen framebuffer it centres the 320-column layout, so UI code keeps
 * using 0..320 and reaches the full width with x from -ox to w - ox.
 */
export class Surface {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.ox = 0;
    /** The pixel buffer's size and pixels per layout pixel (ScaledSurface's are bigger). */
    this.pw = w;
    this.ph = h;
    this.scale = 1;
    this.px = new Uint8Array(w * h);
  }

  /** Reallocate at a new width and centre a layout of `layoutW` columns in it. */
  resize(w, layoutW = w) {
    this.w = w;
    this.pw = w;
    this.ox = (w - layoutW) >> 1;
    this.px = new Uint8Array(w * this.h);
  }

  /** Left edge of the whole surface, in layout coordinates. */
  get left() {
    return -this.ox;
  }

  clear(color = 0) {
    this.px.fill(color);
  }

  pixel(x, y, c) {
    x = (x + this.ox) | 0;
    y |= 0;
    if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.px[y * this.w + x] = c;
  }

  fillRect(x, y, w, h, c) {
    x += this.ox;
    const x0 = Math.max(0, x | 0);
    const y0 = Math.max(0, y | 0);
    const x1 = Math.min(this.w, (x + w) | 0);
    const y1 = Math.min(this.h, (y + h) | 0);
    for (let yy = y0; yy < y1; yy++) this.px.fill(c, yy * this.w + x0, yy * this.w + x1);
  }

  /** Outline rectangle. */
  rect(x, y, w, h, c) {
    this.fillRect(x, y, w, 1, c);
    this.fillRect(x, y + h - 1, w, 1, c);
    this.fillRect(x, y, 1, h, c);
    this.fillRect(x + w - 1, y, 1, h, c);
  }

  /** Recolour a region through a 256-entry remap table (e.g. a darkening colormap). */
  shadeRect(x, y, w, h, remap) {
    x += this.ox;
    const x0 = Math.max(0, x | 0);
    const y0 = Math.max(0, y | 0);
    const x1 = Math.min(this.w, (x + w) | 0);
    const y1 = Math.min(this.h, (y + h) | 0);
    const px = this.px;
    for (let yy = y0; yy < y1; yy++) {
      let o = yy * this.w + x0;
      for (let xx = x0; xx < x1; xx++, o++) px[o] = remap[px[o]];
    }
  }

  /** Bresenham line, clipped per pixel. */
  line(x0, y0, x1, y1, c) {
    x0 = Math.round(x0);
    y0 = Math.round(y0);
    x1 = Math.round(x1);
    y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    let guard = 4096;
    while (guard-- > 0) {
      this.pixel(x0, y0, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x0 += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y0 += sy;
      }
    }
  }

  /**
   * Draw an indexed image (IndexedImage or Frame) with transparency.
   * @param {{width?:number,height?:number,pixels?:Uint8Array,w?:number,h?:number,px?:Uint8Array}} src
   * @param {{remap?: Uint8Array, flipX?: boolean, sx?: number, sy?: number, sw?: number, sh?: number}} [opts]
   */
  blit(src, dx, dy, opts = {}) {
    const srcW = src.width ?? src.w;
    const srcH = src.height ?? src.h;
    const pixels = src.pixels ?? src.px;
    const sx = opts.sx ?? 0;
    const sy = opts.sy ?? 0;
    const sw = opts.sw ?? srcW;
    const sh = opts.sh ?? srcH;
    const remap = opts.remap;
    const flip = opts.flipX;
    dx = (dx + this.ox) | 0;
    dy |= 0;
    const W = this.w;
    const px = this.px;
    for (let y = 0; y < sh; y++) {
      const ty = dy + y;
      if (ty < 0 || ty >= this.h) continue;
      const row = (sy + y) * srcW;
      for (let x = 0; x < sw; x++) {
        const tx = dx + x;
        if (tx < 0 || tx >= W) continue;
        const c = pixels[row + sx + (flip ? sw - 1 - x : x)];
        if (c === TRANSPARENT) continue;
        px[ty * W + tx] = remap ? remap[c] : c;
      }
    }
  }

  /**
   * Draw a full-screen picture centred on the layout. Pictures wider than
   * the layout (the generated ones are 560 wide) fill a widescreen surface
   * and are cropped on a narrower one. Where a picture is too narrow, it is
   * mirrored outward to fill the sides, through `edgeRemap` (a darkening
   * colormap) so the real picture stays the focus.
   */
  blitBackdrop(img, edgeRemap) {
    const w = img.width ?? img.w;
    const x0 = (this.w - 2 * this.ox - w) >> 1;
    this.blit(img, x0, 0);
    const side = Math.min(x0 + this.ox, w);
    if (side <= 0) return;
    this.blit(img, x0 - side, 0, { sx: 0, sw: side, flipX: true, remap: edgeRemap });
    this.blit(img, x0 + w, 0, { sx: w - side, sw: side, flipX: true, remap: edgeRemap });
  }

  /** Copy every pixel of another same-sized surface. */
  copyFrom(other) {
    this.px.set(other.px);
  }
}

/**
 * A surface whose pixel buffer is `scale` times the layout in each direction
 * (640x400 for 320x200 at scale 2), for drawing the 3D view at a higher
 * resolution. The 2D drawing methods still take layout coordinates and draw
 * each layout pixel as a 2x2 block, so the HUD and menus keep their pixel
 * art; the renderer draws into `px` at `pw` x `ph`.
 */
export class ScaledSurface extends Surface {
  constructor(w, h, scale) {
    super(w, h);
    this.scale = scale;
    this.pw = Math.round(w * scale);
    this.ph = Math.round(h * scale);
    this.px = new Uint8Array(this.pw * this.ph);
  }

  resize(w, layoutW = w) {
    this.w = w;
    this.pw = Math.round(w * this.scale);
    this.ox = (w - layoutW) >> 1;
    this.px = new Uint8Array(this.pw * this.ph);
  }

  pixel(x, y, c) {
    this.fillRect(Math.floor(x), Math.floor(y), 1, 1, c);
  }

  /** The buffer rectangle covering a layout rectangle (x already shifted by ox), clipped. */
  _span(x, y, w, h) {
    const k = this.scale;
    return [
      Math.max(0, Math.round((x | 0) * k)),
      Math.max(0, Math.round((y | 0) * k)),
      Math.min(this.pw, Math.round(((x + w) | 0) * k)),
      Math.min(Math.round(this.h * k), Math.round(((y + h) | 0) * k)),
    ];
  }

  fillRect(x, y, w, h, c) {
    const [x0, y0, x1, y1] = this._span(x + this.ox, y, w, h);
    for (let yy = y0; yy < y1; yy++) this.px.fill(c, yy * this.pw + x0, yy * this.pw + x1);
  }

  shadeRect(x, y, w, h, remap) {
    const [x0, y0, x1, y1] = this._span(x + this.ox, y, w, h);
    const px = this.px;
    for (let yy = y0; yy < y1; yy++) {
      let o = yy * this.pw + x0;
      for (let xx = x0; xx < x1; xx++, o++) px[o] = remap[px[o]];
    }
  }

  blit(src, dx, dy, opts = {}) {
    const srcW = src.width ?? src.w;
    const srcH = src.height ?? src.h;
    const pixels = src.pixels ?? src.px;
    const sx = opts.sx ?? 0;
    const sy = opts.sy ?? 0;
    const sw = opts.sw ?? srcW;
    const sh = opts.sh ?? srcH;
    const remap = opts.remap;
    const flip = opts.flipX;
    const k = this.scale;
    dx = (dx + this.ox) | 0;
    dy |= 0;
    const W = this.pw;
    const H = Math.round(this.h * k);
    const px = this.px;
    // Each buffer pixel takes the layout pixel its centre falls in.
    const tx0 = Math.max(0, Math.round(dx * k));
    const tx1 = Math.min(W, Math.round((dx + sw) * k));
    const ty0 = Math.max(0, Math.round(dy * k));
    const ty1 = Math.min(H, Math.round((dy + sh) * k));
    for (let ty = ty0; ty < ty1; ty++) {
      const v = Math.min(sh - 1, Math.floor((ty + 0.5) / k) - dy);
      const row = (sy + v) * srcW;
      for (let tx = tx0; tx < tx1; tx++) {
        const u = Math.min(sw - 1, Math.floor((tx + 0.5) / k) - dx);
        const c = pixels[row + sx + (flip ? sw - 1 - u : u)];
        if (c === TRANSPARENT) continue;
        px[ty * W + tx] = remap ? remap[c] : c;
      }
    }
  }
}
