#!/usr/bin/env node
// Renders the 3D view headlessly to a PNG, without a browser. It's handy for
// checking renderer changes and for looking at a spot in a level:
//
//   node tools/snapshot.mjs sandbox                       from the player start
//   node tools/snapshot.mjs sandbox --at 12.5,7.5,90      x,y,angle (content degrees: 0 east, 90 north)
//   node tools/snapshot.mjs sandbox --pitch 30 --z 0.2    look up 30 px, raise the eye 0.2 above the floor
//   node tools/snapshot.mjs sandbox --out shot.png --scale 3 --nomonsters
//   node tools/snapshot.mjs m3 --custom                   with the art overrides (the Dark Forces art)
//   node tools/snapshot.mjs m3 --doors 0.5                every door half open
//   node tools/snapshot.mjs sandbox --at 33.5,8.5,90 --top  on top of a slab (under it by default)
//
// The default output is tools/art/out/snapshots/<level>.png.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import content from '../src/content/index.js';
import { Registry } from '../src/engine/registry.js';
import { Palette } from '../src/engine/gfx/palette.js';
import { Surface } from '../src/engine/gfx/surface.js';
import { Assets } from '../src/engine/assets.js';
import { Renderer } from '../src/engine/render/renderer.js';
import { World } from '../src/engine/world/world.js';
import { Rng } from '../src/engine/core/rng.js';
import { contentAngle } from '../src/engine/world/level.js';
import { SCREEN_W, VIEW_H } from '../src/engine/config.js';
import { decodePNG, encodePNG } from './art/lib/png.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Build the renderer and assets headlessly (PNGs decoded from disk). With
 * `custom`, the art overrides in assets/custom/overrides.json are used, as
 * in the browser.
 * @param {{custom?:boolean}} [opts]
 * @returns {Promise<{registry:any, palette:Palette, assets:Assets, surface:Surface, renderer:Renderer}>}
 */
export async function headless({ custom = false } = {}) {
  const registry = new Registry(content);
  const palette = new Palette(registry.paletteDef);
  const assets = new Assets(registry, palette);
  assets._loadOverrides = async () => {
    assets.overrides = custom ? JSON.parse(fs.readFileSync(path.join(root, 'assets/custom/overrides.json'), 'utf8')) : {};
  };
  assets._readPixels = async (src) => decodePNG(fs.readFileSync(path.join(root, src)));
  await assets.loadAll();
  const surface = new Surface(SCREEN_W, VIEW_H);
  const renderer = new Renderer(surface, assets, palette);
  return { registry, palette, assets, surface, renderer };
}

/** Render one frame of `levelId` from a camera. Returns RGBA pixels of the view. */
export function snapshot(ctx, levelId, { at, pitch = 0, z, skill = 3, noMonsters = false, doors, top = false } = {}) {
  const { registry, palette, assets, surface, renderer } = ctx;
  const level = registry.levels.get(levelId);
  if (!level) throw new Error(`Unknown level "${levelId}"`);
  const world = new World({ registry, assets, rng: new Rng(1), settings: { noMonsters } }, level, { skill });
  const pt = world.player;
  if (doors !== undefined) for (const d of world.map.doors) d.open = doors;
  if (at) {
    pt.x = at[0];
    pt.y = at[1];
    if (at[2] !== undefined) pt.angle = contentAngle(at[2]);
    // (Under a slab, unless `top` stands on it.)
    if (world.floorAt) pt.z = world.floorAt(pt.x, pt.y, pt.radius, top ? Infinity : -Infinity);
  }
  // The level's weather, round where the camera is.
  world.weather?.fill(pt.x, pt.y);
  const cam = { ...world.camera(), horizonOffset: pitch };
  if (z !== undefined) cam.z = (pt.z ?? 0) + z;
  surface.clear(0);
  renderer.render(world, cam, { skip: pt });
  const rgba = new Uint8Array(surface.w * surface.h * 4);
  const pal = palette.rgb;
  for (let i = 0; i < surface.w * surface.h; i++) {
    const c = surface.px[i];
    rgba[i * 4] = pal[c * 3];
    rgba[i * 4 + 1] = pal[c * 3 + 1];
    rgba[i * 4 + 2] = pal[c * 3 + 2];
    rgba[i * 4 + 3] = 255;
  }
  return { width: surface.w, height: surface.h, data: rgba, world };
}

/** Nearest-neighbour upscale, with the 1.2 pixel aspect when `aspect` is set. */
export function upscale(img, scale, aspect = true) {
  const w = img.width * scale;
  const h = Math.round(img.height * scale * (aspect ? 1.2 : 1));
  const out = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    const sy = Math.min(img.height - 1, Math.floor((y / h) * img.height));
    for (let x = 0; x < w; x++) {
      const sx = Math.floor(x / scale);
      const s = (sy * img.width + sx) * 4;
      const o = (y * w + x) * 4;
      out[o] = img.data[s];
      out[o + 1] = img.data[s + 1];
      out[o + 2] = img.data[s + 2];
      out[o + 3] = 255;
    }
  }
  return { width: w, height: h, data: out };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const opt = (name, def) => (args.includes(name) ? args[args.indexOf(name) + 1] : def);
  const valued = new Set(['--at', '--pitch', '--z', '--out', '--scale', '--skill', '--doors']);
  const levelId = args.find((a, i) => !a.startsWith('--') && !valued.has(args[i - 1])) ?? 'sandbox';
  const at = opt('--at') ? opt('--at').split(',').map(Number) : undefined;
  const ctx = await headless({ custom: args.includes('--custom') });
  const shot = snapshot(ctx, levelId, {
    at,
    pitch: Number(opt('--pitch', 0)),
    z: opt('--z') !== undefined ? Number(opt('--z')) : undefined,
    skill: Number(opt('--skill', 3)),
    noMonsters: args.includes('--nomonsters'),
    doors: opt('--doors') !== undefined ? Number(opt('--doors')) : undefined,
    top: args.includes('--top'),
  });
  const out = path.resolve(opt('--out', path.join(root, 'tools/art/out/snapshots', `${levelId}.png`)));
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const big = upscale(shot, Number(opt('--scale', 2)));
  fs.writeFileSync(out, encodePNG(big.width, big.height, big.data));
  console.log(`Wrote ${path.relative(process.cwd(), out)}`);
}
