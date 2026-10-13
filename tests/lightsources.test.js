import test from 'node:test';
import assert from 'node:assert/strict';
import content from '../src/content/index.js';
import { Registry } from '../src/engine/registry.js';
import { buildLevel } from '../src/engine/world/level.js';
import { LightMap } from '../src/engine/world/lightmap.js';
import { LightEffects } from '../src/engine/world/lights.js';
import { falloff } from '../src/engine/world/lightsources.js';
import { runActions } from '../src/engine/world/actions.js';
import { validateContent } from '../src/engine/validate.js';
import { Rng } from '../src/engine/core/rng.js';
import { LIGHT_FX } from '../src/engine/world/tilemap.js';
import { makeWorld, registry, room } from './helpers.js';

// Light sources (PLAN.md Phase 1d step 3): placed lamps that add light round
// them, fading to nothing at their radius, blocked by walls and shut doors.

const ROOM = { floor: 'imp-floor', ceiling: 'imp-ceiling', ceilZ: 4, light: 64 };
const close = (a, b, msg, eps = 1e-3) => assert.ok(Math.abs(a - b) < eps, `${msg ?? ''} (${a} vs ${b})`);
const OPEN = ['###########', '#.........#', '#.........#', '#.........#', '#.........#', '#.........#', '###########'];

function lit(tiles, lights, extra = {}) {
  const built = buildLevel(registry, room(tiles, ['', ' >'], { ...extra, legend: { '.': ROOM, ...extra.legend }, lights }));
  return { ...built, lm: new LightMap(built.map) };
}

test('a source adds its light at its centre, fading to nothing at its radius', () => {
  const { map, lm, errors } = lit(OPEN, [{ x: 5.5, y: 3.5, radius: 4, light: 120 }]);
  assert.deepEqual(errors, []);
  close(lm.sample(5.5, 3.5), 64 + 120, 'all of it at the centre');
  close(lm.sample(7.5, 3.5), 64 + 120 * falloff(2, 4), 'some of it 2 tiles away');
  close(lm.sample(9.5, 3.5), 64, 'none at its radius');
  assert.ok(lm.sample(6.5, 3.5) > lm.sample(7.5, 3.5), 'fading outward');
  assert.equal(map.light[map.index(5, 3)], 64, 'the tile\'s own light is unchanged');
});

test('a wall casts a shadow, and a shut door keeps the light in', () => {
  // A wall stub at (5, 2..3) between the lamp at (3.5, 2.5) and the tiles east of it.
  const stub = ['###########', '#.........#', '#....#....#', '#....#....#', '#.........#', '#.........#', '#.........#', '###########'];
  const { lm } = lit(stub, [{ x: 3.5, y: 2.5, radius: 6, light: 120 }]);
  close(lm.sample(6.5, 2.5), 64, 'in the wall\'s shadow');
  assert.ok(lm.sample(6.5, 6.5) > 64, 'round the end of the wall it reaches');
  // Two rooms and a rising door between them.
  const rooms = ['#########', '#...#...#', '#...D...#', '#...#...#', '#########'];
  const door = { door: 'imp-door', style: 'rise', ceilZ: 2 };
  const shut = lit(rooms, [{ x: 2.5, y: 2.5, radius: 6, light: 120 }], { legend: { D: door } });
  close(shut.lm.sample(6.5, 2.5), 64, 'the next room stays dark');
  assert.ok(shut.lm.sample(3.5, 2.5) > 100, 'this one is lit');
});

test('under a slab a source lights the storey its height is in', () => {
  const tiles = ['#######', '#.===.#', '#######'];
  const legend = { '=': { ...ROOM, ceilZ: 8, slab: { bottom: 3, top: 3.5 } }, '.': { ...ROOM, ceilZ: 8 } };
  const below = lit(tiles, [{ x: 3.5, y: 1.5, radius: 3, light: 100 }], { legend });
  close(below.lm.sample(3.5, 1.5, 0), 164, 'without a z: under the slab');
  close(below.lm.sample(3.5, 1.5, 1), 64, 'not on it');
  const above = lit(tiles, [{ x: 3.5, y: 1.5, z: 4.5, radius: 3, light: 100 }], { legend });
  close(above.lm.sample(3.5, 1.5, 1), 164, 'high up: on top of the slab');
  close(above.lm.sample(3.5, 1.5, 0), 64, 'not under it');
  close(above.lm.sample(1.5, 1.5, 0), 64 + 100 * falloff(2, 3), 'beside the slab: the one storey there');
});

test('an animated source swings between its light and its min, in step with its sync', () => {
  const legend = { f: { ...ROOM, light: 200, lightFx: 'blink', lightMin: 40, lightSync: 'alarm' } };
  const tiles = ['###########', '#f........#', '###########'];
  const { map, lm } = lit(tiles, [{ x: 7.5, y: 1.5, radius: 2, light: 100, fx: 'blink', min: 20, sync: 'alarm' }], { legend });
  const fx = new LightEffects(map, new Rng(1), lm);
  const src = map.sources[0];
  assert.equal(src.group, map.lightGroup[map.index(1, 1)], 'one group with the alarm tiles');
  let off = false;
  for (let k = 0; k < 40 && !off; k++) {
    fx.update(0.05);
    lm.update();
    off = map.light[map.index(1, 1)] === 40;
  }
  assert.ok(off, 'the tiles blinked off');
  assert.equal(src.cur, 20, 'and the lamp with them');
  close(lm.sample(7.5, 1.5), 64 + 20, 'down to its min');
  for (let k = 0; k < 20 && map.light[map.index(1, 1)] === 40; k++) {
    fx.update(0.05);
    lm.update();
  }
  close(lm.sample(7.5, 1.5), 64 + 100, 'and back up');
});

test('setLight reaches sources by their tag', () => {
  const w = makeWorld(room(OPEN, ['', ' >'], { legend: { '.': ROOM }, lights: [{ x: 5.5, y: 3.5, radius: 3, light: 120, tag: 'lamp' }] }));
  close(w.lightmap.sample(5.5, 3.5), 184);
  runActions(w, [{ action: 'setLight', tag: 'lamp', light: 0 }]);
  w.lightmap.update();
  close(w.lightmap.sample(5.5, 3.5), 64, 'switched off');
  runActions(w, [{ action: 'setLight', tag: 'lamp', light: 80, lightFx: 'flicker', lightMin: 10 }]);
  const src = w.map.sources[0];
  assert.equal(src.fx, LIGHT_FX.flicker, 'flickering now');
  assert.ok(w.lights.groups.some((g) => g.sources.includes(src)));
  for (let k = 0; k < 100; k++) w.lights.update(0.05);
  w.lightmap.update();
  assert.ok([10, 80].includes(src.cur), 'between its min and its light');
  close(w.lightmap.sample(5.5, 3.5), 64 + src.cur, 'and the light map follows', 1e-2);
});

test('bad sources are level errors, and a setLight tag may name only sources', () => {
  const { errors } = lit(OPEN, [
    { x: 0.5, y: 0.5, radius: 3, light: 50 },
    { x: 3.5, y: 3.5, light: 50 },
    { x: 3.5, y: 3.5, radius: 2, light: 50, fx: 'sparkle' },
    { y: 2, radius: 2, light: 50 },
  ]);
  assert.equal(errors.length, 4, errors.join('\n'));
  assert.match(errors[0], /inside a wall/);
  assert.match(errors[1], /radius/);
  assert.match(errors[2], /unknown fx "sparkle"/);
  assert.match(errors[3], /"x" and a "y"/);
  const level = room(OPEN, ['', ' >'], {
    id: 'lamps',
    legend: { '.': ROOM },
    lights: [{ x: 5.5, y: 3.5, radius: 3, light: 120, tag: 'lamp' }],
    triggers: [{ on: 'start', do: [{ action: 'setLight', tag: 'lamp', light: 0 }, { action: 'openDoors', tag: 'lamp' }] }],
  });
  const { errors: found } = validateContent(new Registry({ ...content, levels: [level] }));
  const mine = found.filter((e) => e.includes('"lamps"'));
  assert.equal(mine.length, 1, mine.join('\n'));
  assert.match(mine[0], /openDoors" refers to tag "lamp" which no tile has|which no tile has/);
});
