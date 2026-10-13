import test from 'node:test';
import assert from 'node:assert/strict';
import content from '../src/content/index.js';
import { Registry } from '../src/engine/registry.js';
import { defineEffect } from '../src/engine/defs.js';
import { validateContent } from '../src/engine/validate.js';
import { buildLevel } from '../src/engine/world/level.js';
import { LightMap } from '../src/engine/world/lightmap.js';
import { falloff } from '../src/engine/world/lightsources.js';
import { makeWorld, mockInput, registry, room, run } from './helpers.js';

// Dynamic light (PLAN.md Phase 1d step 4): bolts, muzzle flashes and
// explosions light the tiles round them, through open tiles only.

const ROOM = { floor: 'imp-floor', ceiling: 'imp-ceiling', ceilZ: 4, light: 64 };
const close = (a, b, msg, eps = 1e-3) => assert.ok(Math.abs(a - b) < eps, `${msg ?? ''} (${a} vs ${b})`);
const OPEN = ['###########', '#.........#', '#.........#', '#.........#', '#.........#', '#.........#', '###########'];

function lit(tiles, legend = {}) {
  const { map } = buildLevel(registry, room(tiles, ['', ' >'], { legend: { '.': ROOM, ...legend } }));
  return { map, lm: new LightMap(map) };
}

test('a dynamic light lights the tiles round it for one frame', () => {
  const { lm } = lit(OPEN);
  lm.setDynamic([{ x: 5.5, y: 3.5, radius: 3, light: 100 }]);
  lm.update();
  close(lm.sample(5.5, 3.5), 164, 'all of it at its centre');
  close(lm.sample(6.5, 3.5), 64 + 100 * falloff(1, 3), 'fading');
  close(lm.sample(8.5, 3.5), 64, 'none at its radius');
  lm.setDynamic([{ x: 2.5, y: 2.5, radius: 2, light: 50 }]);
  lm.update();
  close(lm.sample(5.5, 3.5), 64, 'gone the next frame');
  close(lm.sample(2.5, 2.5), 114, 'and the new one is there');
  lm.setDynamic([]);
  lm.update();
  close(lm.sample(2.5, 2.5), 64, 'none left');
  assert.equal(lm.dynTiles.length, 0);
});

test('dynamic light spreads through open tiles, not walls or shut doors', () => {
  // Two rooms side by side: a solid wall at x 4 between them, a rising door at (4, 2).
  const tiles = ['#########', '#...#...#', '#...D...#', '#...#...#', '#########'];
  const { map, lm } = lit(tiles, { D: { door: 'imp-door', style: 'rise', ceilZ: 2 } });
  lm.setDynamic([{ x: 3.5, y: 1.5, radius: 3, light: 100 }]);
  lm.update();
  close(lm.sample(5.5, 1.5), 64, 'not through the wall or the shut door');
  assert.ok(lm.sample(3.5, 2.5) > 64, 'its own room is lit');
  map.doors[0].open = 1;
  lm.setDynamic([{ x: 3.5, y: 1.5, radius: 3, light: 100 }]);
  lm.update();
  assert.ok(lm.sample(5.5, 2.5) > 64, 'through the open door');
});

test('under a slab a dynamic light lights the storey it is in', () => {
  const tiles = ['#######', '#.===.#', '#######'];
  const { lm } = lit(tiles, { '=': { ...ROOM, ceilZ: 8, slab: { bottom: 3, top: 3.5 } }, '.': { ...ROOM, ceilZ: 8 } });
  lm.setDynamic([{ x: 3.5, y: 1.5, z: 1, radius: 2, light: 80 }]);
  lm.update();
  close(lm.sample(3.5, 1.5, 0), 144, 'under it');
  close(lm.sample(3.5, 1.5, 1), 64, 'not on top');
  lm.setDynamic([{ x: 3.5, y: 1.5, z: 4, radius: 2, light: 80 }]);
  lm.update();
  close(lm.sample(3.5, 1.5, 1), 144, 'on top');
  close(lm.sample(3.5, 1.5, 0), 64, 'not under it');
});

test('an explosion flashes the room and fades as it plays', () => {
  const w = makeWorld(room(OPEN, ['', ' >'], { legend: { '.': ROOM } }), { noMonsters: true });
  w.player.x = 1.5;
  w.player.y = 5.5;
  const input = mockInput();
  w.spawn('explosion', 7.5, 2.5);
  run(w, input, 1 / 60);
  const first = w.lightmap.sample(7.5, 2.5);
  assert.ok(first > 64 + 100, `bright at first (${first})`);
  run(w, input, 0.2);
  const later = w.lightmap.sample(7.5, 2.5);
  assert.ok(later < first && later > 64, `fading (${later})`);
  run(w, input, 0.5);
  close(w.lightmap.sample(7.5, 2.5), 64, 'gone when it is');
});

test('the blaster\'s muzzle flash and its bolt light the room', () => {
  const w = makeWorld(room(['#################', '#...............#', '#...............#', '#...............#', '#################'], ['', ' >'], { legend: { '.': ROOM } }), {
    noMonsters: true,
  });
  w.player.x = 2.5;
  w.player.y = 2.5;
  w.player.angle = 0;
  const input = mockInput();
  run(w, input, 0.6); // raise the weapon
  input.hold('fire');
  let flash = 0;
  let bolt = 0;
  run(w, input, 0.3, (world) => {
    flash = Math.max(flash, world.lightmap.sample(2.5, 2.5));
    const b = world.things.find((t) => t.def.id === 'blaster-bolt' && t.animName !== 'explode');
    if (b && b.x > 6) bolt = Math.max(bolt, world.lightmap.sample(b.x, b.y) - 64);
  });
  assert.ok(flash > 64 + 50, `the flash lights the player's tile (${flash})`);
  assert.ok(bolt > 40, `the bolt lights the floor it flies over (+${bolt})`);
});

test('the validator checks a glowing thing\'s light', () => {
  const glow = defineEffect({ id: 'bad-glow', sheet: { src: 'assets/sprites/fx/puff.png', frameWidth: 16, frameHeight: 16 }, anims: { idle: [0] }, light: { light: 50 } });
  const { errors } = validateContent(new Registry({ ...content, things: [...content.things, glow] }));
  assert.deepEqual(errors.filter((e) => e.includes('bad-glow')), ['effect "bad-glow": "light" needs a "radius" above 0 and a "light" (how much it adds)']);
});
