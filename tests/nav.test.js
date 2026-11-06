import test from 'node:test';
import assert from 'node:assert/strict';
import { FlowField, UNREACHABLE } from '../src/engine/world/nav.js';
import { buildLevel } from '../src/engine/world/level.js';
import { validateContent } from '../src/engine/validate.js';
import { Registry } from '../src/engine/registry.js';
import content from '../src/content/index.js';
import { registry, room, makeWorld } from './helpers.js';

test('the flow field routes around walls and respects locks', () => {
  const level = room(
    ['#########', '#...#...#', '#.#.#.#.#', '#.#...#.#', '#########', '#...1...#', '#########'],
    ['', ' ^'],
  );
  const { map } = buildLevel(registry, level, {});
  const nav = new FlowField(map);
  nav.update(1, 1, true);
  const d = (x, y) => nav.dist[y * map.w + x];
  assert.equal(d(1, 1), 0);
  assert.equal(d(3, 1), 2);
  assert.equal(d(5, 1), 8, 'has to go down and around the middle walls');
  assert.equal(d(7, 3), 12);
  nav.update(1, 5, true);
  assert.equal(d(7, 5), UNREACHABLE, 'the blue door is locked for monsters');
});

test('a flow field with a reach plans only that many steps out from the player', () => {
  const level = room(['##############', '#............#', '##############'], ['', ' ^']);
  const { map } = buildLevel(registry, level, {});
  const nav = new FlowField(map, undefined, 6);
  nav.update(1, 1, true);
  const d = (x) => nav.dist[map.w + x];
  assert.equal(d(7), 6, 'six steps out is planned');
  assert.equal(d(8), UNREACHABLE, 'seven steps out is beyond its reach');
});

test("a level's navReach limits the monsters' planning, and one beyond it heads straight for the player", () => {
  // A wall between the player and the trooper, with a way round at the top.
  const tiles = ['##########', '#........#', '#.######.#', '#.#....#.#', '#.#....#.#', '#.#....#.#', '##########'];
  const things = ['', '', '', ' ^      t'];
  const near = makeWorld(room(tiles, things));
  const far = makeWorld(room(tiles, things, { navReach: 4 }));
  const at = (w) => w.navFor(w.things.find((t) => t.def.kind === 'monster'));
  assert.equal(at(near).distanceAt(8, 3), 11, 'the whole map is planned by default: up, across and down');
  assert.equal(at(far).distanceAt(8, 3), UNREACHABLE, 'with a reach of 4 the trooper is beyond it');
  assert.equal(at(far).next(8.5, 3.5), null, 'so it has no route, and heads straight for the player');
});

test('the validator checks navReach', () => {
  const level = room(['#####', '#...#', '#####'], ['', ' ^'], { id: 'bad', navReach: 0 });
  const { errors } = validateContent(new Registry({ ...content, levels: [level] }));
  assert.deepEqual(errors.filter((e) => e.includes('navReach')), ['Level "bad": "navReach" (how many steps out the monsters plan their way to the player) must be a number, 1 or more']);
});
