import test from 'node:test';
import assert from 'node:assert/strict';
import content from '../src/content/index.js';
import { Registry } from '../src/engine/registry.js';
import { validateContent } from '../src/engine/validate.js';
import { runActions } from '../src/engine/world/actions.js';
import { makeWorld, mockInput, room, run } from './helpers.js';

// A hall, the player at its west end, two spots tagged at its east end
// behind a wall with a gap: out of the player's sight until they come round.
const ROOM = { floor: 'imp-floor', ceiling: 'imp-ceiling', light: 160, ceilZ: 4 };
const TILES = [
  '####################',
  '#.........#........#',
  '#.........#.....S..#',
  '#...................',
  '#.........#.....S..#',
  '#.........#........#',
  '####################',
];
const level = () => room(TILES.map((r) => r.replace(/.$/, '#')), ['', '', '', ' >'], { legend: { '.': ROOM, S: { ...ROOM, tag: 'squad' } } });
const spawned = (w) => w.things.filter((t) => t.kind === 'monster');

test('a spawned trooper comes for the player at once', () => {
  const w = makeWorld(level());
  runActions(w, [{ action: 'spawn', thing: 'stormtrooper', tag: 'squad' }]);
  assert.equal(spawned(w).length, 2);
  assert.ok(spawned(w).every((t) => t.state === 'chase'));
});

test('with wake: false a spawned squad waits where it is, facing its angle, until it sees the player', () => {
  const w = makeWorld(level());
  runActions(w, [{ action: 'spawn', thing: 'stormtrooper', tag: 'squad', wake: false, angle: 180, fog: false }]);
  const squad = spawned(w);
  assert.equal(squad.length, 2);
  assert.ok(!w.things.some((t) => t.def?.id === 'teleport-fog'), 'brought in unseen');
  for (const t of squad) assert.ok(Math.abs(Math.cos(t.angle) + 1) < 1e-9, 'facing west');
  run(w, mockInput(), 3);
  assert.ok(squad.every((t) => t.state === 'idle' && Math.abs(t.x - 16.5) < 0.01), 'still waiting');
  w.player.x = 12.5;
  w.player.y = 3.5;
  run(w, mockInput(), 1);
  assert.ok(squad.every((t) => t.state !== 'idle'), 'it sees the player come round the wall');
});

test('with noMonsters a spawn brings no monsters, as the level brings none at the start', () => {
  const w = makeWorld(level(), { noMonsters: true });
  runActions(w, [{ action: 'spawn', thing: 'stormtrooper', tag: 'squad' }]);
  assert.equal(spawned(w).length, 0);
});

test('a spawn with a skill list happens only on those skills', () => {
  const w = makeWorld(level(), { skill: 3 });
  runActions(w, [{ action: 'spawn', thing: 'stormtrooper', tag: 'squad', skill: [4, 5] }]);
  assert.equal(spawned(w).length, 0);
  runActions(w, [{ action: 'spawn', thing: 'stormtrooper', tag: 'squad', skill: [3] }]);
  assert.equal(spawned(w).length, 2);
});

test('the validator checks the wake, angle and skill of a spawn', () => {
  const bad = { ...level(), id: 'bad', triggers: [{ on: 'start', do: [{ action: 'spawn', thing: 'stormtrooper', tag: 'squad', wake: 'no', angle: [1], skill: [0, 6] }] }] };
  const { errors } = validateContent(new Registry({ ...content, levels: [bad] }));
  const has = (s) => assert.ok(errors.some((e) => e.includes(s)), `expected "${s}" in ${JSON.stringify(errors)}`);
  has('spawn "wake" must be true or false');
  has('spawn "angle" is content degrees');
  has('spawn "skill" must be a list of skills, 1 to 5');
});
