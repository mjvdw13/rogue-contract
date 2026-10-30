import test from 'node:test';
import assert from 'node:assert/strict';
import content from '../src/content/index.js';
import { Registry } from '../src/engine/registry.js';
import { validateContent } from '../src/engine/validate.js';
import { F_SKY } from '../src/engine/world/tilemap.js';
import { makeWorld, mockInput, room, run } from './helpers.js';

// Weather (PLAN.md section 2): dust kept in the air round the player, under
// the sky only.

const WEATHER = { type: 'dust', count: 100, range: 8 };

/** A yard under the sky, with a roofed room down its east side. */
function yard(width, roofed = 0) {
  const row = (c) => '#' + c.repeat(width - roofed - 2) + '.'.repeat(roofed) + '#';
  const tiles = ['#'.repeat(width), ...Array.from({ length: 30 }, () => row('_')), '#'.repeat(width)];
  return makeWorld(room(tiles, ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '  >'], { weather: WEATHER }));
}

/** The weather's particles: [x, y, tile] each. */
function motes(world) {
  const ps = world.particles;
  const ti = ps.typeIndex(WEATHER.type);
  const out = [];
  for (let i = 0; i < ps.n; i++) if (ps.type[i] === ti) out.push([ps.x[i], ps.y[i], ps.tile[i]]);
  return out;
}

test('dust fills the air round the player, and none drifts indoors', () => {
  const world = yard(40, 12);
  const pt = world.player;
  pt.x = 26;
  pt.y = 16;
  run(world, mockInput(), 3);
  const all = motes(world);
  assert.equal(all.length, WEATHER.count);
  for (const [x, y, tile] of all) {
    assert.ok(world.map.flags[tile] & F_SKY, `a mote at ${x.toFixed(1)}, ${y.toFixed(1)} is under the sky`);
    assert.ok(Math.abs(x - pt.x) <= WEATHER.range && Math.abs(y - pt.y) <= WEATHER.range, 'within range of the player');
  }
});

test('dust the player leaves behind comes round ahead of them', () => {
  const world = yard(80);
  const pt = world.player;
  pt.x = 20;
  pt.y = 16;
  run(world, mockInput(), 0.5);
  pt.x = 50;
  run(world, mockInput(), 1 / 60);
  const all = motes(world);
  assert.equal(all.length, WEATHER.count);
  assert.ok(all.every(([x, y]) => Math.abs(x - pt.x) <= WEATHER.range && Math.abs(y - pt.y) <= WEATHER.range));
  assert.ok(all.filter(([x]) => x > pt.x).length > WEATHER.count / 3, 'the air ahead is full');
});

test('the validator checks a level\'s weather', () => {
  const bad = (weather) => room(['###', '#_#', '###'], ['', ' >'], { id: `bad-weather-${Object.keys(weather).length}`, weather });
  const levels = [bad({ type: 'snow', count: 10 }), bad({ type: 'dust', count: 5000, range: 0 })];
  const { errors } = validateContent(new Registry({ ...content, levels: [...content.levels, ...levels] }));
  const ours = errors.filter((e) => e.includes('bad-weather'));
  assert.equal(ours.length, 3, ours.join('\n'));
  assert.ok(ours.some((e) => e.includes('unknown particle type "snow"')));
  assert.ok(ours.some((e) => e.includes('"count"')));
  assert.ok(ours.some((e) => e.includes('"range"')));
});
