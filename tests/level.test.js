import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLevel, resolveLegend, contentAngle } from '../src/engine/world/level.js';
import { F_SOLID, F_DOOR, F_SKY, F_SECRET, F_DAMAGE, F_EXIT } from '../src/engine/world/tilemap.js';
import { registry, room } from './helpers.js';

test('legend entries inherit from their base and can be overridden per level', () => {
  const level = room(['#'], [''], { legend: { k: { base: '.', light: 40, tag: 'dark' }, '.': { floor: 'imp-grate', light: 99 } } });
  const { tiles } = resolveLegend(registry, level);
  assert.equal(tiles.k.floor, 'imp-grate');
  assert.equal(tiles.k.light, 40);
  assert.equal(tiles.k.tag, 'dark');
  assert.equal(tiles['#'].wall, 'imp-panel');
});

test('circular legend bases are reported', () => {
  const level = room(['#'], [''], { legend: { a: { base: 'b' }, b: { base: 'a' } } });
  assert.throws(() => resolveLegend(registry, level), /circular/);
});

test('tiles, doors, flags and the player start are parsed', () => {
  const level = room(
    ['#######', '#..D.~#', '#?#####', '#*:##X#', '#######'],
    ['       ', ' >     ', '       '],
    { legend: { '?': { base: '.', secret: true }, ':': { base: '.', exit: true }, '~': { base: '.', damage: 6 }, '*': { base: '_' } } },
  );
  const b = buildLevel(registry, level, { skill: 3 });
  assert.deepEqual(b.errors, []);
  const at = (x, y) => b.map.flags[y * b.map.w + x];
  assert.ok(at(0, 0) & F_SOLID);
  assert.ok(at(3, 1) & F_DOOR);
  assert.equal(b.map.doors[0].axis, 'x', 'walls above and below: the panel runs north-south');
  assert.ok(at(5, 1) & F_DAMAGE);
  assert.ok(at(1, 2) & F_SECRET);
  assert.ok(at(1, 3) & F_SKY);
  assert.ok(at(2, 3) & F_EXIT);
  assert.equal(b.map.uses.size, 1, 'the exit switch is usable');
  assert.deepEqual([b.playerStart.x, b.playerStart.y], [1.5, 1.5]);
  assert.equal(b.playerStart.angle, contentAngle(0));
});

test('things are filtered by skill and unknown glyphs are errors', () => {
  const level = room(['#####', '#...#', '#####'], ['', ' ^!?']);
  const easy = buildLevel(registry, level, { skill: 1 });
  const hard = buildLevel(registry, level, { skill: 4 });
  assert.equal(easy.spawns.filter((s) => s.type === 'stormtrooper').length, 0, '"!" ants only appear on skill 3+');
  assert.equal(hard.spawns.filter((s) => s.type === 'stormtrooper').length, 1);
  assert.ok(hard.errors.some((e) => e.includes('Unknown thing glyph "?"')));
});

test('a door needs walls on two opposite sides', () => {
  const b = buildLevel(registry, room(['#####', '#.D.#', '#...#', '#####'], ['', ' ^']), {});
  assert.ok(b.errors.some((e) => e.includes('needs walls')));
});

test('content angles: degrees counter-clockwise with north up', () => {
  assert.equal(contentAngle(0), -0);
  assert.equal(contentAngle('N'), (-90 * Math.PI) / 180);
  assert.equal(contentAngle(180), -Math.PI);
});
