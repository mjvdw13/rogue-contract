import test from 'node:test';
import assert from 'node:assert/strict';
import content from '../src/content/index.js';
import { Registry } from '../src/engine/registry.js';
import { validateContent } from '../src/engine/validate.js';
import { F_SKY } from '../src/engine/world/tilemap.js';
import { View } from '../src/engine/render/view.js';
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

// Blowing sand (docs/mission2.md): layers of types, gusts on a clock of
// their own that drive the wind, the number in the air and the haze, and
// shelter out of the wind.

const OPEN = ['#'.repeat(40), ...Array.from({ length: 30 }, () => '#' + '_'.repeat(38) + '#'), '#'.repeat(40)];
const START = ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '  >'];
const open = (weather, extra = {}) => makeWorld(room(OPEN, START, { weather, ...extra }));
const count = (world, type) => {
  const ps = world.particles;
  const ti = ps.typeIndex(type);
  let n = 0;
  for (let i = 0; i < ps.n; i++) if (ps.type[i] === ti) n++;
  return n;
};

test('weather can keep several types in the air at once', () => {
  const world = open([{ type: 'dust', count: 60 }, { type: 'glint', count: 40 }]);
  run(world, mockInput(), 1);
  assert.equal(count(world, 'dust'), 60);
  assert.equal(count(world, 'glint'), 40);
});

test('gusts come and go, and a layer thins out in the lulls', () => {
  const world = open({ type: 'dust', count: 100, calm: 0.25, wind: [2, 0, 0], gusts: { every: [1, 1], hold: [1, 1], rise: 0.5, fall: 0.5 } });
  const seen = new Set();
  for (let k = 0; k < 60; k++) {
    run(world, mockInput(), 0.1);
    seen.add(Math.round(world.weather.gust * 4));
  }
  assert.ok(seen.has(0) && seen.has(4) && [1, 2, 3].some((k) => seen.has(k)), `the gust went from nothing to full and back (${[...seen]})`);
  // (The extra ones aren't taken away: they die off, and fewer are made again.)
  world.weather.hold(0);
  run(world, mockInput(), 5);
  assert.equal(count(world, 'dust'), 25, 'a quarter in a lull');
  world.weather.hold(1);
  run(world, mockInput(), 0.5);
  assert.equal(count(world, 'dust'), 100, 'all of it in a full gust');
});

test('a gust carries a particle farther than the breeze does', () => {
  const travel = (g) => {
    const world = open({ type: 'glint', count: 1, wind: [2, 0, 0], gusts: { strength: 3 } });
    run(world, mockInput(), 0.1);
    world.weather.hold(g);
    const ps = world.particles;
    // (Alone in slot 0: the weather's glint comes after it, so removing that never moves it.)
    ps.clear();
    const i = ps.spawn(ps.typeIndex('dust'), 10.5, 10.5, 1, 0, 0, 0);
    const x0 = ps.x[i];
    for (let k = 0; k < 30; k++) world.tick(1 / 60, mockInput());
    return ps.x[i] - x0;
  };
  const calm = travel(0);
  const gust = travel(1);
  assert.ok(calm > 0, 'the breeze carries it east');
  assert.ok(gust > calm * 2, `farther in a gust (${gust.toFixed(2)} against ${calm.toFixed(2)})`);
});

test('the haze closes in in a gust, so a far wall fades more', () => {
  const world = open({ type: 'dust', count: 10, wind: [2, 0, 0], gusts: {} }, { haze: { color: [176, 120, 88], half: 48, gust: 12 } });
  run(world, mockInput(), 0.1);
  world.weather.hold(0);
  world.hazeGust();
  assert.equal(world.haze.half, 48);
  const view = new View();
  view.setup({ x: 0, y: 0, angle: 0 }, 0.05, world.haze);
  const calm = view.hazeF(30);
  world.weather.hold(1);
  world.hazeGust();
  assert.equal(world.haze.half, 12);
  view.setup({ x: 0, y: 0, angle: 0 }, 0.05, world.haze);
  assert.ok(view.hazeF(30) > calm + 3, `a wall 30 tiles off: ${view.hazeF(30).toFixed(1)} haze steps against ${calm.toFixed(1)}`);
});

test('no sand is made down in a pit, out of the wind', () => {
  // A pit 4 deep in the middle of the yard (x 15 to 24), the wind from the west.
  const tiles = OPEN.map((r, y) => (y > 0 && y < 31 ? '#' + '_'.repeat(14) + 'p'.repeat(10) + '_'.repeat(14) + '#' : r));
  const world = makeWorld(room(tiles, START, { legend: { p: { base: '_', floorZ: -4 } }, weather: { type: 'dust', count: 300, range: 16, shelter: 3, wind: [2, 0, 0] } }));
  const pt = world.player;
  pt.x = 20;
  pt.y = 15;
  world.weather.fill(pt.x, pt.y);
  const ps = world.particles;
  let inPit = 0;
  for (let i = 0; i < ps.n; i++) if (world.map.floorZ[ps.tile[i]] < -1) inPit++;
  assert.equal(inPit, 0, 'none made in the pit');
  assert.equal(count(world, 'dust'), 300, 'all of them made on the yard round it');
});

test('the validator checks blowing sand\'s fields', () => {
  const bad = (weather, k) => room(['###', '#_#', '###'], ['', ' >'], { id: `bad-sand-${k}`, weather });
  const levels = [
    bad([{ type: 'dust', count: 5, wind: [1, 0, 0] }, { type: 'glint', count: 5, wind: [2, 0, 0] }], 1),
    bad({ type: 'dust', count: 5, calm: 2, shelter: -1 }, 2),
    bad({ type: 'dust', count: 5, gusts: { every: [5, 2], strength: 0.5, gale: 1 } }, 3),
  ];
  const { errors } = validateContent(new Registry({ ...content, levels: [...content.levels, ...levels] }));
  const ours = errors.filter((e) => e.includes('bad-sand'));
  for (const what of ['"wind" on more than one layer', '"calm"', '"shelter"', '"every"', '"strength"', 'unknown field "gale"']) {
    assert.ok(ours.some((e) => e.includes(what)), `${what}:\n${ours.join('\n')}`);
  }
});
