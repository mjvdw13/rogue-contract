// Shared helpers for the node --test suite: the real content pack, a
// headless World and a scriptable input.
import content from '../src/content/index.js';
import { Registry } from '../src/engine/registry.js';
import { defineLevel } from '../src/engine/defs.js';
import { World } from '../src/engine/world/world.js';
import { Rng } from '../src/engine/core/rng.js';
import friendlies, { bubbles } from './fixtures/friendlies.js';

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
