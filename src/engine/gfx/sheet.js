import { TRANSPARENT } from '../config.js';

/**
 * One frame of a sprite sheet, stored both row-major (for 1:1 UI blits) and
 * column-major with per-column opaque spans (for fast scaled sprite drawing).
 * `glint` (row-major in, kept column-major) marks the pixels that catch the
 * light; null when the frame has none.
 */
export class Frame {
  constructor(w, h, px, glint = null) {
    this.w = w;
    this.h = h;
    this.px = px;
    this.cm = new Uint8Array(w * h);
    this.glint = null;
    this.top = new Int16Array(w).fill(-1);
    this.bottom = new Int16Array(w).fill(-1);
    for (let x = 0; x < w; x++) {
      for (let y = 0; y < h; y++) {
        const c = px[y * w + x];
        this.cm[x * h + y] = c;
        if (glint?.[y * w + x] && c !== TRANSPARENT) (this.glint ??= new Uint8Array(w * h))[x * h + y] = 1;
        if (c !== TRANSPARENT) {
          if (this.top[x] < 0) this.top[x] = y;
          this.bottom[x] = y;
        }
      }
    }
  }
}

/**
 * A sprite sheet: a PNG cut into equally sized frames, numbered left-to-right,
 * top-to-bottom starting at 0.
 */
export class Sheet {
  /**
   * @param {import('./image.js').IndexedImage} image
   * @param {number} frameWidth
   * @param {number} frameHeight
   */
  constructor(image, frameWidth, frameHeight) {
    this.image = image;
    this.fw = frameWidth || image.width;
    this.fh = frameHeight || image.height;
    /** Drawn size multiplier, for art drawn at a different pixel scale (see Assets overrides). */
    this.scale = 1;
    this.cols = Math.max(1, Math.floor(image.width / this.fw));
    this.rows = Math.max(1, Math.floor(image.height / this.fh));
    this.frames = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const px = new Uint8Array(this.fw * this.fh);
        const glint = image.glint ? new Uint8Array(this.fw * this.fh) : null;
        for (let y = 0; y < this.fh; y++) {
          const sy = r * this.fh + y;
          for (let x = 0; x < this.fw; x++) {
            const sx = c * this.fw + x;
            const inside = sx < image.width && sy < image.height;
            px[y * this.fw + x] = inside ? image.pixels[sy * image.width + sx] : TRANSPARENT;
            if (glint && inside) glint[y * this.fw + x] = image.glint[sy * image.width + sx];
          }
        }
        this.frames.push(new Frame(this.fw, this.fh, px, glint));
      }
    }
  }

  get count() {
    return this.frames.length;
  }

  frame(i) {
    const n = this.frames.length;
    return this.frames[((i % n) + n) % n];
  }
}
