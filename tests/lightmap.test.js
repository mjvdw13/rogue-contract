import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLevel } from '../src/engine/world/level.js';
import { LightMap } from '../src/engine/world/lightmap.js';
import { LightEffects } from '../src/engine/world/lights.js';
import { Rng } from '../src/engine/core/rng.js';
import { Painter } from '../src/content/levels/lib/painter.js';
import { registry, room } from './helpers.js';

// Smooth light (PLAN.md Phase 1d step 2): light is interpolated between tile
// centres, without leaking through walls.

const ROOM = { floor: 'imp-floor', ceiling: 'imp-ceiling', ceilZ: 4 };
const close = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-3, `${msg ?? ''} (${a} vs ${b})`);

function lit(tiles, legend, opts) {
  const { map } = buildLevel(registry, room(tiles, ['', ' >'], { legend }));
  return { map, lm: new LightMap(map, opts) };
}

test('light is a tile\'s own at its centre and blends between open tiles', () => {
  const { lm } = lit(['#####', '#ab.#', '#####'], { '.': { ...ROOM, light: 100 }, a: { ...ROOM, light: 100 }, b: { ...ROOM, light: 200 } });
  close(lm.sample(1.5, 1.5), 100, 'a\'s centre');
  close(lm.sample(2.5, 1.5), 200, 'b\'s centre');
  close(lm.sample(2, 1.5), 150, 'halfway');
  close(lm.sample(2.25, 1.5), 175, 'a quarter of the way');
});

test('light doesn\'t leak through a wall', () => {
  // A dark room (x 1-2), a wall (x 3), a bright room (x 4-5).
  const { lm } = lit(['#######', '#..#bb#', '#..#bb#', '#######'], { '.': { ...ROOM, light: 64 }, b: { ...ROOM, light: 240 } });
  close(lm.sample(2.9, 1.5), 64, 'up against the wall on the dark side');
  close(lm.sample(4.1, 2.5), 240, 'up against it on the bright side');
});

test('occlusion darkens the light toward walls', () => {
  const plain = lit(['#####', '#...#', '#...#', '#...#', '#####'], { '.': { ...ROOM, light: 160 } });
  const shaded = lit(['#####', '#...#', '#...#', '#...#', '#####'], { '.': { ...ROOM, light: 160 } }, { occlusion: 32 });
  close(plain.lm.sample(1.01, 2.5), 160);
  assert.ok(shaded.lm.sample(1.01, 2.5) < 150, 'darker at the wall');
  close(shaded.lm.sample(2.5, 2.5), 160, 'the middle of the room is untouched');
});

test('the lower storey under a slab has its own light', () => {
  const { lm } = lit(['#####', '#.=.#', '#####'], {
    '.': { ...ROOM, light: 160, ceilZ: 8 },
    '=': { ...ROOM, light: 160, ceilZ: 8, slab: { bottom: 3, top: 3.5, light: 96 } },
  });
  close(lm.sample(2.5, 1.5, 0), 96, 'under the slab');
  close(lm.sample(2.5, 1.5, 1), 160, 'on top of it');
  close(lm.sample(2, 1.5, 0), 128, 'under its edge, blending with the room');
});

test('light effects and setLight reach the light map', () => {
  const { map, lm } = lit(['#####', '#.f.#', '#####'], { '.': { ...ROOM, light: 160 }, f: { ...ROOM, light: 200, lightFx: 'blink', lightMin: 40 } });
  const fx = new LightEffects(map, new Rng(1), lm);
  close(lm.sample(2.5, 1.5), 200);
  for (let k = 0; k < 40; k++) {
    fx.update(0.05);
    lm.update();
    if (map.light[map.index(2, 1)] === 40) break;
  }
  close(lm.sample(2.5, 1.5), 40, 'blinked off');
  fx.setLight([map.index(1, 1)], 80);
  lm.update();
  close(lm.sample(1.5, 1.5), 80, 'setLight');
});

test('tiles with the same lightSync pulse together, each in its own range', () => {
  const glow = (light) => ({ ...ROOM, light, lightFx: 'glow', lightMin: 40, lightSync: 'core' });
  const { map } = buildLevel(registry, room(['#######', '#a.b..#', '#.....#', '#....c#', '#######'], ['', ' >'], {
    legend: { '.': { ...ROOM, light: 100 }, a: glow(200), b: glow(120), c: glow(240) },
  }));
  const at = (x, y) => map.index(x, y);
  assert.equal(map.lightGroup[at(1, 1)], map.lightGroup[at(5, 3)], 'one group though far apart');
  assert.equal(map.lightGroup[at(1, 1)], map.lightGroup[at(3, 1)]);
  const fx = new LightEffects(map, new Rng(3));
  for (let k = 0; k < 7; k++) fx.update(0.1);
  // Each is the same way between its low end (40) and its own light.
  const f = (x, y, top) => (map.light[at(x, y)] - 40) / (top - 40);
  assert.ok(Math.abs(f(1, 1, 200) - f(5, 3, 240)) < 0.02 && Math.abs(f(1, 1, 200) - f(3, 1, 120)) < 0.03, 'in step');
  assert.ok(map.light[at(5, 3)] > map.light[at(1, 1)], 'each keeps its own brightness');
});

test('the painter paints round pools of light that fade to the floor round them', () => {
  const p = new Painter(20, 20, { wall: 'imp-panel' });
  p.rect(1, 1, 19, 19, { floor: 'imp-floor', ceiling: 'imp-ceiling', light: 120 });
  p.pool(10, 10, 4, 216, { lightSync: 'lamp' });
  const light = (x, y) => p.get(x, y).light;
  assert.equal(light(9, 9), 208, 'bright in the middle (in steps of 8)');
  assert.ok(light(12, 9) < light(10, 9) && light(12, 9) > 120, 'fading outward');
  assert.equal(light(15, 10), 120, 'untouched beyond its radius');
  assert.equal(p.get(9, 9).lightSync, 'lamp');
  assert.equal(p.get(15, 10).lightSync, undefined);
});
