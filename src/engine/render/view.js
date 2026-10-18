import { VIEW_W, VIEW_H, PIXEL_ASPECT, FOV_DEG, LIGHT_LEVELS } from '../config.js';
import { HAZE_STEPS, HAZE_ROW } from '../gfx/palette.js';

/** The haze table's resolution: entries per tile of distance, and its length. */
export const HAZE_RES = 8;
export const HAZE_LEN = 4096;

/**
 * A surface's colormap level is (LIGHT_BLACK - light) / 4, less DIMINISH /
 * distance (Doom's light diminishing: nearby surfaces brighten, up to
 * MAX_BRIGHTEN levels), plus the level's fog per tile of distance. Tuned so
 * a space lit at 144 is about level 5 at 1 m, 11 at 2 m and 17 at 10 m:
 * lit spaces read across a room, and dark ones stay dark.
 */
export const DIMINISH = 24;
export const MAX_BRIGHTEN = 24;
export const LIGHT_BLACK = 212;

/**
 * Per-frame camera and projection state shared by the wall, flat, sprite and
 * weapon renderers.
 */
export class View {
  constructor(width = VIEW_W) {
    this.H = VIEW_H;
    /**
     * Per column, the uncovered windows of rows after each tile the ray crossed
     * (for sprite clipping): one batch per boundary, usually a single window,
     * more where slabs split the view. 48 of them, and room after for one
     * last batch where a ray stops at the skyline (columns.js).
     */
    this.SEG = 48 + 8;
    this.resize(width);
    this.lightStart = new Float32Array(256);
    this.x = 0;
    this.y = 0;
    this.angle = 0;
    this.dirX = 1;
    this.dirY = 0;
    this.planeX = 0;
    this.planeY = this.planeLen;
    this.camZ = 0.5;
    this.horizon = this.H / 2;
    this.fog = 0.125;
    this.extraLight = 0;
    this.fixedColormap = -1;
    /** Haze: on outdoors (under the sky) this frame, and the haze step (0 to HAZE_STEPS - 1, fractional) by distance. */
    this.hazeOn = false;
    this.hazeHalf = 0;
    this.hazeTab = new Float32Array(HAZE_LEN);
  }

  /**
   * Set the view width and size the per-column buffers. The focal length
   * stays at the 4:3 view's, so a wider view only adds field of view at the
   * edges (90 degrees across 320 columns, about 106 across 426).
   */
  resize(width) {
    this.W = width;
    this.fx = VIEW_W / 2 / Math.tan((FOV_DEG * Math.PI) / 360); // horizontal focal length (px)
    this.fy = this.fx / PIXEL_ASPECT; // vertical focal length (px), corrected for 4:3 display
    this.planeLen = this.W / 2 / this.fx;
    this.zbuf = new Float32Array(this.W);
    this.segDist = new Float32Array(this.W * this.SEG);
    this.segTop = new Int16Array(this.W * this.SEG);
    this.segBot = new Int16Array(this.W * this.SEG);
    /** Set on the first window of each batch. */
    this.segFirst = new Uint8Array(this.W * this.SEG);
    this.segCount = new Uint8Array(this.W);
    this.skyU = new Int32Array(this.W);
    /**
     * Per pixel, the depth of the nearest fence or model pixel (render/columns.js,
     * render/models.js), which sprites and models test against. Only cleared and
     * valid (`depthValid`) in frames where a fence or model drew.
     */
    this.mdepth = new Float32Array(this.W * this.H);
    this.depthValid = false;
    /** Marks the rows of a column that show sky, for the backdrop (render/backdrop.js); all 0 between columns. */
    this.bdBuf = new Uint8Array(this.W * this.H);
  }

  /**
   * @param {{x:number, y:number, angle:number, z?:number, extraLight?:number,
   *          fixedColormap?:number, horizonOffset?:number}} cam
   * @param {number} fog extra darkness per tile of distance
   * @param {{color:number[], half:number}|null} [haze] outdoors, surfaces
   *   fade toward the haze colour instead of darkening with distance: half
   *   way at `half` tiles
   */
  setup(cam, fog = 0.125, haze = null) {
    this.x = cam.x;
    this.y = cam.y;
    this.angle = cam.angle;
    this.dirX = Math.cos(cam.angle);
    this.dirY = Math.sin(cam.angle);
    this.planeX = -this.dirY * this.planeLen;
    this.planeY = this.dirX * this.planeLen;
    this.camZ = cam.z ?? 0.5;
    this.horizon = this.H / 2 + (cam.horizonOffset ?? 0);
    this.fog = fog;
    this.fixedColormap = cam.fixedColormap ?? -1;
    const extra = (cam.extraLight ?? 0) * 4;
    this.extraLight = extra;
    for (let l = 0; l < 256; l++) this.lightStart[l] = (LIGHT_BLACK - l) / 4 - extra;
    this.hazeOn = !!haze && this.fixedColormap < 0;
    if (this.hazeOn && haze.half !== this.hazeHalf) {
      this.hazeHalf = haze.half;
      for (let k = 0; k < HAZE_LEN; k++) this.hazeTab[k] = (HAZE_STEPS - 1) * (1 - Math.pow(0.5, k / HAZE_RES / haze.half));
    }
  }

  /** The haze step (fractional) at a distance. */
  hazeF(dist) {
    const k = (dist * HAZE_RES) | 0;
    return this.hazeTab[k < HAZE_LEN ? k : HAZE_LEN - 1];
  }

  /**
   * The colormap row for a surface lit `light` at `dist`, `shade` levels
   * darker: its level, or, outdoors in haze, its level without the fog in
   * the haze step's tables.
   */
  row(light, dist, outdoor, shade = 0) {
    if (this.fixedColormap >= 0) return this.fixedColormap;
    const out = outdoor && this.hazeOn;
    let l = (this.levelF(light, dist) - (out ? dist * this.fog : 0)) | 0;
    if (l < 0) l = 0;
    else if (l >= LIGHT_LEVELS) l = LIGHT_LEVELS - 1;
    l += shade;
    if (l >= LIGHT_LEVELS) l = LIGHT_LEVELS - 1;
    if (!out) return l;
    const h = Math.round(this.hazeF(dist));
    return h ? HAZE_ROW + (h - 1) * LIGHT_LEVELS + l : l;
  }

  /** Colormap level (0 = bright .. 31 = dark) for a light value (0-255, may be fractional) seen at a distance. */
  level(light, dist) {
    if (this.fixedColormap >= 0) return this.fixedColormap;
    const l = this.levelF(light, dist) | 0;
    return l < 0 ? 0 : l >= LIGHT_LEVELS ? LIGHT_LEVELS - 1 : l;
  }

  /** The colormap level before rounding and clamping, for dithering between levels. */
  levelF(light, dist) {
    const d = dist < 0.5 ? 0.5 : dist;
    let b = DIMINISH / d;
    if (b > MAX_BRIGHTEN) b = MAX_BRIGHTEN;
    return (LIGHT_BLACK - light) / 4 - this.extraLight - b + d * this.fog;
  }
}
