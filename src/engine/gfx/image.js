import { TRANSPARENT } from '../config.js';

/** A palette-indexed image. Pixel value 255 (TRANSPARENT) is never drawn. */
export class IndexedImage {
  constructor(width, height, pixels) {
    this.width = width;
    this.height = height;
    this.pixels = pixels ?? new Uint8Array(width * height).fill(TRANSPARENT);
    /** Which pixels are glints (see `quantize`), or null. */
    this.glint = null;
  }

  /** Magenta/black checkerboard used when an asset is missing. */
  static placeholder(width, height, a, b) {
    const img = new IndexedImage(width, height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        img.pixels[y * width + x] = ((x >> 3) + (y >> 3)) & 1 ? a : b;
      }
    }
    return img;
  }

  /** Copy of a sub-rectangle. */
  crop(sx, sy, w, h) {
    const out = new IndexedImage(w, h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const px = sx + x;
        const py = sy + y;
        if (px >= 0 && py >= 0 && px < this.width && py < this.height) {
          out.pixels[y * w + x] = this.pixels[py * this.width + px];
        }
      }
    }
    return out;
  }
}

const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

/**
 * Convert RGBA pixels into palette indices. Alpha < 128 and pure magenta
 * (#FF00FF) become transparent. `dither` (0..64) adds ordered Bayer dithering,
 * which gives photos a crunchy 80s look.
 *
 * `glint` and `glow` list exact colours ([r, g, b]): glint pixels (armour
 * highlights that catch the light) snap to lit colours only and are kept in
 * the image's `glint` mask (1 per glint pixel; null when there are none);
 * glow pixels snap to fullbright colours only.
 * @param {{width:number, height:number, data: Uint8ClampedArray|Uint8Array}} rgba
 * @param {import('./palette.js').Palette} palette
 */
export function quantize(rgba, palette, { dither = 0, litOnly = false, glint = null, glow = null } = {}) {
  const { width, height, data } = rgba;
  const out = new Uint8Array(width * height);
  const pack = (list) => (list?.length ? new Set(list.map(([r, g, b]) => (r << 16) | (g << 8) | b)) : null);
  const glints = pack(glint);
  const glows = pack(glow);
  let mask = null;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const o = i * 4;
      let r = data[o];
      let g = data[o + 1];
      let b = data[o + 2];
      if (data[o + 3] < 128 || (r === 255 && g === 0 && b === 255)) {
        out[i] = TRANSPARENT;
        continue;
      }
      if (glints || glows) {
        const key = (r << 16) | (g << 8) | b;
        if (glints?.has(key)) {
          mask ??= new Uint8Array(width * height);
          mask[i] = 1;
          out[i] = palette.lookup(r, g, b, true);
          continue;
        }
        if (glows?.has(key)) {
          out[i] = palette.nearestGlow(r, g, b);
          continue;
        }
      }
      if (dither) {
        const d = (BAYER4[(y & 3) * 4 + (x & 3)] / 16 - 0.5) * dither;
        r = Math.max(0, Math.min(255, r + d)) | 0;
        g = Math.max(0, Math.min(255, g + d)) | 0;
        b = Math.max(0, Math.min(255, b + d)) | 0;
      }
      out[i] = palette.lookup(r, g, b, litOnly);
    }
  }
  const img = new IndexedImage(width, height, out);
  img.glint = mask;
  return img;
}

/** Load an <img>. Resolves with the element once decoded. */
export function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load image "${src}"`));
    img.src = src;
  });
}

function makeCanvas(w, h) {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

/** Read RGBA pixels from an image element, optionally cropped. */
export function readPixels(img, crop) {
  const [sx, sy, sw, sh] = crop ?? [0, 0, img.naturalWidth || img.width, img.naturalHeight || img.height];
  const canvas = makeCanvas(sw, sh);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
  return ctx.getImageData(0, 0, sw, sh);
}

