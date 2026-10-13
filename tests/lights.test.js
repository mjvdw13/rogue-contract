import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLevel } from '../src/engine/world/level.js';
import { LIGHT_FX } from '../src/engine/world/tilemap.js';
import { World } from '../src/engine/world/world.js';
import { Rng } from '../src/engine/core/rng.js';
import { TEXELS_PER_UNIT } from '../src/engine/config.js';
import { Assets } from '../src/engine/assets.js';
import { Palette } from '../src/engine/gfx/palette.js';
import { registry, room, makeWorld, mockInput, run } from './helpers.js';

const lit = (legend) => room(['#####', '#.ab#', '#####'], ['', ' >'], { legend });

/** The lowest and highest light a tile shows over `seconds`. */
function range(world, x, y, seconds = 20) {
  const i = y * world.map.w + x;
  let lo = 255;
  let hi = 0;
  for (let k = 0; k < seconds * 60; k++) {
    world.lights.update(1 / 60);
    lo = Math.min(lo, world.map.light[i]);
    hi = Math.max(hi, world.map.light[i]);
  }
  return [lo, hi];
}

test('a light effect swings down to lightMin, or 96 below by default', () => {
  const w = makeWorld(lit({ a: { base: '.', light: 200, lightFx: 'flicker' }, b: { base: '.', light: 200, lightFx: 'flicker', lightMin: 150 } }));
  assert.deepEqual(range(w, 2, 1), [104, 200]);
  assert.deepEqual(range(w, 3, 1), [150, 200]);
});

test('an unknown lightFx is an error', () => {
  const b = buildLevel(registry, lit({ a: { base: '.', lightFx: 'disco' } }), {});
  assert.ok(b.errors.some((e) => e.includes('unknown lightFx "disco"')));
});

test('setLight keeps a group range, or gives the tiles a new effect', () => {
  const w = makeWorld(lit({ a: { base: '.', light: 200, lightFx: 'glow', lightMin: 180, tag: 'room' }, b: { base: '.', light: 160, tag: 'room' } }));
  const tiles = w.map.tilesWithTag('room');
  w.lights.setLight(tiles, 120);
  assert.deepEqual(range(w, 2, 1), [100, 120], 'the glow keeps its 20 range');
  assert.deepEqual(range(w, 3, 1), [120, 120], 'a still tile stays still');

  w.lights.setLight(tiles, 100, 'flicker', 40);
  assert.equal(w.map.lightFx[1 * w.map.w + 3], LIGHT_FX.flicker);
  const a = [];
  const b = [];
  for (let k = 0; k < 600; k++) {
    w.lights.update(1 / 60);
    a.push(w.map.light[w.map.w + 2]);
    b.push(w.map.light[w.map.w + 3]);
  }
  assert.deepEqual(a, b, 'the retagged tiles flicker together');
  assert.deepEqual([Math.min(...a), Math.max(...a)], [40, 100]);

  w.lights.setLight(tiles, 90, 'none');
  assert.deepEqual(range(w, 2, 1), [90, 90], "'none' stops the effect");
  assert.equal(w.lights.groups.length, 0);
});

test('the setLight action passes lightFx and lightMin on', () => {
  const level = lit({ a: { base: '.', light: 200, tag: 'room' } });
  level.triggers = [{ on: 'start', do: [{ action: 'setLight', tag: 'room', light: 150, lightFx: 'strobe', lightMin: 50 }] }];
  const w = makeWorld(level);
  run(w, mockInput(), 0.05);
  assert.deepEqual(range(w, 2, 1), [50, 150]);
});

test('a hanging decoration hangs its sprite height below the ceiling', async () => {
  const assets = new Assets(registry, new Palette(registry.paletteDef));
  assets._loadOverrides = async () => {
    assets.overrides = {};
  };
  assets._loadImage = async () => null;
  await assets.loadAll();
  const level = room(['#####', '#...#', '#####'], ['', ' >'], { legend: { '.': { floor: 'imp-floor', ceiling: 'imp-ceiling', ceilZ: 5 } } });
  level.list = [{ type: 'ceiling-lamp', x: 2.5, y: 1.5 }];
  const w = new World({ registry, assets, rng: new Rng(1), settings: {} }, level, { skill: 3 });
  const lamp = w.things.find((t) => t.def.id === 'ceiling-lamp');
  // As the sprite renderer sizes it: the lamp's top touches the ceiling.
  const height = (lamp.sheet.frame(0).h * (lamp.sheet.scale ?? 1)) / TEXELS_PER_UNIT;
  assert.ok(height > 0);
  assert.equal(lamp.z, 5 - height);
});
