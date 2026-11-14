import { View } from './view.js';
import { drawWorld } from './columns.js';
import { drawSprites } from './sprites.js';
import { drawModels } from './models.js';
import { drawPsprites } from './psprite.js';
import { drawParticles } from './particles.js';
import { drawRopes } from './hangings.js';
import { blendTable } from '../gfx/blend.js';
import { BLEND_ADD, BLEND_HALF } from '../world/particles.js';

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
    this.view = new View(surface.pw, surface.scale);
    /** Blend tables by particle blend mode, built when first needed. */
    this.blendTables = null;
    /** Last frame's particle drawing time (ms), for benches and debug readouts. */
    this.particleMs = 0;
    /** Last frame's hangings drawing time (ms), likewise. */
    this.hangingMs = 0;
    /**
     * Worker threads to share the world pass with (render/pool.js), or null.
     * @type {import('./pool.js').WorldPool|null}
     */
    this.pool = null;
    /** Last frame's time by stage (ms), for tools/bench.mjs. */
    this.ms = { world: 0, models: 0, hangings: 0, sprites: 0, particles: 0 };
  }

  /** Build what the first frames would otherwise stop to build (the particles' blend tables). */
  prepare() {
    if (this.blendTables) return;
    this.blendTables = [];
    this.blendTables[BLEND_ADD] = blendTable(this.palette, 'add');
    this.blendTables[BLEND_HALF] = blendTable(this.palette, 'half');
  }

  /**
   * @param {{map:any, things:any[], skyTexture:any, fog:number, haze?:{color:number[], half:number}|null,
   *   backdrop?:import('../world/backdrop.js').Backdrop|null, particles?:import('../world/particles.js').Particles,
   *   hangings?:import('../world/hangings.js').Hangings}} scene
   * @param {{x:number,y:number,angle:number,z?:number,extraLight?:number,fixedColormap?:number}} cam
   * @param {{psprites?:any[], skip?:any}} [extras]
   */
  render(scene, cam, extras = {}) {
    const view = this.view;
    const s = this.surface;
    const textures = this.assets.textures;
    const cms = scene.haze ? this.palette.hazeColormaps(scene.haze.color) : this.palette.colormaps;
    if (view.W !== s.pw) view.resize(s.pw);
    view.setup(cam, scene.fog ?? 0.25, scene.haze ?? null);
    view.depthValid = false;
    view.skyWrap = scene.skyWrap ?? 2;
    // In a gust, with a haze that swells in them, the sky's lower part goes into the haze too.
    view.skyHaze = scene.weather && scene.hazeHalf && scene.hazeHalf[1] !== scene.hazeHalf[0] ? scene.weather.gust : 0;
    const ms = this.ms;
    const tw = performance.now();
    // On every thread, with a pool; on this one without, or if the pool fails.
    // (The pool draws the models too, after the world.)
    const pool = this.pool;
    let tm;
    if (pool?.drawWorld(view, scene, cam, textures, s.px, cms, scene.things, extras.skip)) {
      tm = tw + pool.worldMs;
      if (!pool.drewModels) view.depthValid = drawModels(view, scene.things, scene.map, textures, s.px, s.pw, cms, extras.skip);
    } else {
      drawWorld(view, scene.map, textures, scene.skyTexture ?? null, s.px, s.pw, cms, scene.backdrop ?? null);
      tm = performance.now();
      view.depthValid = drawModels(view, scene.things, scene.map, textures, s.px, s.pw, cms, extras.skip);
    }
    ms.world = tm - tw;
    ms.models = performance.now() - tm;
    // Hangings: the cloths are models; the ropes write their depth, so what's behind them hides.
    const hangings = scene.hangings?.list.length ? scene.hangings : null;
    if (hangings) {
      const t0 = performance.now();
      if (hangings.cloths.length) view.depthValid = drawModels(view, hangings.cloths, scene.map, textures, s.px, s.pw, cms, null);
      if (hangings.cloths.length < hangings.list.length) {
        if (!view.depthValid) {
          view.mdepth.fill(Infinity);
          view.depthValid = true;
        }
        drawRopes(view, hangings, s.px, s.pw, cms);
      }
      this.hangingMs = performance.now() - t0;
    } else this.hangingMs = 0;
    // With particles about, sprites keep their depth per pixel too (in mdepth), so particles behind them hide.
    const particles = scene.particles?.n ? scene.particles : null;
    if (particles && !view.depthValid) {
      view.mdepth.fill(Infinity);
      view.depthValid = true;
    }
    const ts = performance.now();
    drawSprites(view, scene.things, scene.map, s.px, s.pw, cms, extras.skip, !!particles);
    ms.sprites = performance.now() - ts;
    if (particles) {
      this.prepare();
      const t0 = performance.now();
      drawParticles(view, particles, scene.map, s.px, s.pw, cms, this.blendTables);
      this.particleMs = performance.now() - t0;
    } else this.particleMs = 0;
    ms.hangings = this.hangingMs;
    ms.particles = this.particleMs;
    if (extras.psprites?.length) {
      const map = scene.map;
      const tx = Math.floor(cam.x);
      const ty = Math.floor(cam.y);
      const light = map.inBounds(tx, ty) && map.lightmap ? map.lightmap.sample(cam.x, cam.y, map.storeyAt(ty * map.w + tx, cam.z)) : 160;
      drawPsprites(view, extras.psprites, s, cms, view.level(light, 1.2));
    }
  }
}
