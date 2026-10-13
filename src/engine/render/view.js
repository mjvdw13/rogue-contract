import { VIEW_W, VIEW_H, PIXEL_ASPECT, FOV_DEG, LIGHT_LEVELS } from '../config.js';

/** How much nearby surfaces brighten (Doom's light diminishing), in colormap levels at 1 tile. */
export const DIMINISH = 40;
const MAX_BRIGHTEN = 24;

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
     * more where slabs split the view.
     */
    this.SEG = 48;
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
    this.fixedColormap = -1;
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
  }

  /**
   * @param {{x:number, y:number, angle:number, z?:number, extraLight?:number,
   *          fixedColormap?:number, horizonOffset?:number}} cam
   * @param {number} fog extra darkness per tile of distance
   */
  setup(cam, fog = 0.125) {
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
    for (let l = 0; l < 256; l++) this.lightStart[l] = (240 - l) / 4 - extra;
  }

  /** Colormap level (0 = bright .. 31 = dark) for a tile light value seen at a distance. */
  level(light, dist) {
    if (this.fixedColormap >= 0) return this.fixedColormap;
    const d = dist < 0.5 ? 0.5 : dist;
    let b = DIMINISH / d;
    if (b > MAX_BRIGHTEN) b = MAX_BRIGHTEN;
    const l = (this.lightStart[light] - b + d * this.fog) | 0;
    return l < 0 ? 0 : l >= LIGHT_LEVELS ? LIGHT_LEVELS - 1 : l;
  }
}
