import { View } from './view.js';
import { drawWorld } from './columns.js';
import { drawSprites } from './sprites.js';
import { drawModels } from './models.js';
import { drawPsprites } from './psprite.js';

/** Renders the 3D view of a world into the 8-bit framebuffer. */
export class Renderer {
  /**
   * @param {import('../gfx/surface.js').Surface} surface
   * @param {import('../assets.js').Assets} assets
   * @param {import('../gfx/palette.js').Palette} palette
   */
  constructor(surface, assets, palette) {
    this.surface = surface;
    this.assets = assets;
    this.palette = palette;
    this.view = new View();
  }

  /**
   * @param {{map:any, things:any[], skyTexture:any, fog:number}} scene
   * @param {{x:number,y:number,angle:number,z?:number,extraLight?:number,fixedColormap?:number}} cam
   * @param {{psprites?:any[], skip?:any}} [extras]
   */
  render(scene, cam, extras = {}) {
    const view = this.view;
    const s = this.surface;
    const textures = this.assets.textures;
    const cms = this.palette.colormaps;
    if (view.W !== s.w) view.resize(s.w);
    view.setup(cam, scene.fog ?? 0.25);
    drawWorld(view, scene.map, textures, scene.skyTexture ?? null, s.px, s.w, cms);
    view.modelsDrawn = drawModels(view, scene.things, scene.map, textures, s.px, s.w, cms, extras.skip);
    drawSprites(view, scene.things, scene.map, s.px, s.w, cms, extras.skip);
    if (extras.psprites?.length) {
      const map = scene.map;
      const tx = Math.floor(cam.x);
      const ty = Math.floor(cam.y);
      const light = map.inBounds(tx, ty) ? map.light[ty * map.w + tx] : 160;
      drawPsprites(view, extras.psprites, s, cms, view.level(light, 1.2));
    }
  }
}
