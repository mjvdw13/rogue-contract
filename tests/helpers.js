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
