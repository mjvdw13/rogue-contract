// Shared helpers for the node --test suite: the real content pack, a
// headless World and a scriptable input.
import content from '../src/content/index.js';
import { Registry } from '../src/engine/registry.js';
import { defineLevel } from '../src/engine/defs.js';
import { World } from '../src/engine/world/world.js';
import { Rng } from '../src/engine/core/rng.js';
import friendlies, { bubbles } from './fixtures/friendlies.js';
import { upscaleLevel } from '../tools/lib/upscale.mjs';

export const registry = new Registry(content);

/** The content pack plus test-only friendlies (tests/fixtures/friendlies.js), for the NPC tests. */
export const npcRegistry = new Registry({ ...content, things: [...content.things, ...friendlies, ...bubbles] });

/** An input stand-in: `hold` actions stay down, `tap` actions fire once. */
export function mockInput() {
  const held = new Set();
  const taps = new Set();
  return {
    held,
    hold: (a) => held.add(a),
    release: (a) => held.delete(a),
    tap: (a) => taps.add(a),
    isDown: (a) => held.has(a),
    wasPressed: (a) => taps.has(a),
    endFrame: () => taps.clear(),
    analog: null,
  };
}

/** Build a World for a level def (or level id) without any browser bits. */
export function makeWorld(level, { skill = 3, seed = 1, noMonsters = false, registry: reg = registry } = {}) {
  const def = typeof level === 'string' ? reg.levels.get(level) : level;
  const messages = [];
  const world = new World(
    { registry: reg, rng: new Rng(seed), settings: { noMonsters }, hooks: { message: (t) => messages.push(t) } },
    def,
    { skill },
  );
  world.messages = messages;
  return world;
}

/** Run the world for `seconds` at 60 Hz with the given input. */
export function run(world, input, seconds, each) {
  const dt = 1 / 60;
  for (let i = 0; i < Math.round(seconds * 60); i++) {
    world.tick(dt, input);
    input.endFrame();
    each?.(world, i);
  }
}

/** A small test room: tiles and things as ASCII. */
export function room(tiles, things, extra = {}) {
  return defineLevel({ id: 'test', name: 'TEST', tiles, things, ...extra });
}

/**
 * A test room drawn on the old coarse grid (one character per metre) and
 * upscaled 2x to the real grid: every tile becomes 2x2 and legend heights
 * double. A thing drawn at coarse tile (x, y) stands at (2x + 1.5, 2y + 1.5),
 * which is `fine(x + 0.5)`. `list` positions just double.
 */
export function coarse(tiles, things, extra = {}) {
  return upscaleLevel(registry, room(tiles, things, extra), 2);
}

/** Where a coarse-grid tile-centre coordinate (like 1.5) ends up on the fine grid. */
export const fine = (p) => p * 2 + 0.5;

/**
 * A headless renderer with the content's own art (PNGs from disk, no art
 * overrides), for tests that look at rendered frames. Call once per file.
 */
export async function headlessRenderer() {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const { Palette } = await import('../src/engine/gfx/palette.js');
  const { Surface } = await import('../src/engine/gfx/surface.js');
  const { Assets } = await import('../src/engine/assets.js');
  const { Renderer } = await import('../src/engine/render/renderer.js');
  const { SCREEN_W, VIEW_H } = await import('../src/engine/config.js');
  const { decodePNG } = await import('../tools/art/lib/png.js');
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const palette = new Palette(registry.paletteDef);
  const assets = new Assets(registry, palette);
  assets._loadOverrides = async () => {
    assets.overrides = {};
  };
  assets._readPixels = async (src) => decodePNG(fs.readFileSync(path.join(root, src)));
  await assets.loadAll();
  const renderer = new Renderer(new Surface(SCREEN_W, VIEW_H), assets, palette);
  /** Render `level` from a camera; the frame's palette indices. */
  const shot = (level, cam) => {
    const w = new World({ registry, assets, rng: new Rng(1), settings: { noMonsters: true } }, level, { skill: 3 });
    renderer.surface.clear(0);
    renderer.render(w, cam, { skip: w.player });
    return Uint8Array.from(renderer.surface.px);
  };
  return { palette, assets, renderer, shot };
}
