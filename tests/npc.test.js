import test from 'node:test';
import assert from 'node:assert/strict';
import { wanderArea } from '../src/engine/things/npc.js';
import { lockOn } from '../src/engine/combat/aim.js';
import content from '../src/content/index.js';
import { Registry } from '../src/engine/registry.js';
import { defineNpc, defineLevel } from '../src/engine/defs.js';
import friendlies from './fixtures/friendlies.js';
import { validateContent } from '../src/engine/validate.js';
import { makeWorld, mockInput, room, run, npcRegistry } from './helpers.js';

// The friendlies are test-only (tests/fixtures/friendlies.js).
const world = (level, opts = {}) => makeWorld(level, { ...opts, registry: npcRegistry });

// Dale ('1') never wanders, so he makes a reliable target to shoot past.
const hall = room(['###########', '#.........#', '#.........#', '#.........#', '###########'], ['', '', ' >  1   t']);

const npc = (w, id) => w.things.find((t) => t.def.id === id);
const said = (w, name) => w.messages.filter((m) => m.startsWith(`${name}: `));

test('friendlies: bullets, explosions and bolts pass through them', () => {
  const w = world(hall);
  const dale = npc(w, 'dale');
  const trooper = w.things.find((t) => t.kind === 'monster');
  assert.equal(dale.kind, 'npc');
  assert.equal(w.stats.totalKills, 1, 'coworkers are not counted as kills');
  assert.equal(w.hitscan(w.player, 0, 20, 5), trooper, 'a shot straight through Dale hits the trooper behind him');
  assert.equal(trooper.health, trooper.def.health - 5);
  w.radiusDamage(dale.x, dale.y, 3, 500, null, w.player);
  w.damage(dale, 1000, w.player, w.player);
  assert.ok(!dale.dead && !dale.removed, 'Dale is fine');

  const quiet = world(hall, { noMonsters: true });
  const shooter = { x: 8.5, y: 2.5, radius: 0.3, kind: 'monster' };
  quiet.spawnProjectile('trooper-bolt', shooter, Math.PI);
  run(quiet, mockInput(), 2);
  assert.ok(quiet.player.player.health < 100, 'the bolt went through Dale and hit the player');
});

test('bumping into a coworker makes them react', () => {
  const w = world(hall, { noMonsters: true });
  const dale = npc(w, 'dale');
  const input = mockInput();
  input.hold('forward');
  run(w, input, 1.5);
  assert.ok(w.player.x < dale.x - dale.radius, 'the player cannot walk through Dale');
  assert.equal(said(w, 'DALE').length, 1, 'one line per bump, then a cooldown');
  assert.equal(dale.state, 'react');
  const bubble = w.things.find((t) => t.def.id === 'bubble-ugh' && !t.removed);
  assert.ok(bubble, 'a speech bubble pops up');
  input.release('forward');
  run(w, input, 2.5);
  assert.ok(bubble.removed, 'and goes away again');
  assert.equal(dale.state, 'idle');
});

test('pressing use on a coworker makes them say something new', () => {
  const w = world(hall, { noMonsters: true });
  const input = mockInput();
  w.player.x = 3.6;
  input.tap('use');
  run(w, input, 0.1);
  input.tap('use');
  run(w, input, 0.1);
  assert.equal(said(w, 'DALE').length, 1, 'mashing use is ignored during the cooldown');
  run(w, input, 3);
  input.tap('use');
  run(w, input, 0.1);
  const lines = said(w, 'DALE');
  assert.equal(lines.length, 2);
  assert.notEqual(lines[0], lines[1], 'no line twice in a row');
});

// Terry ('8') may wander 4 tiles from (3, 2). A door, a sewage puddle and a
// one-tile passage to a second room are all within reach.
const office = room(
  [
    '#############',
    '#.....#######',
    '#.....D.....#',
    '#.....#######',
    '#~~...#######',
    '###.#########',
    '###.#########',
    '##...########',
    '##...########',
    '#############',
  ],
  ['', '', '   8     <'],
);

test('coworkers stay out of doorways, hazards and narrow passages', () => {
  const w = world(office, { noMonsters: true });
  const terry = npc(w, 'terry');
  const at = (x, y) => w.map.index(x, y);
  assert.equal(terry.area.size, 17);
  for (const [x, y] of [[3, 2], [1, 1], [5, 1], [5, 4], [3, 4]]) assert.ok(terry.area.has(at(x, y)), `(${x}, ${y}) is fine`);
  for (const [x, y, why] of [[6, 2, 'the door'], [5, 2, 'next to the door'], [1, 4, 'sewage'], [3, 5, 'a narrow passage'], [3, 7, 'past the passage']]) {
    assert.ok(!terry.area.has(at(x, y)), `not ${why}`);
  }
  // A coworker placed in a doorway or corridor just stays put.
  assert.equal(wanderArea(w, { x: 3.5, y: 5.5, def: { wander: 3 } }).size, 0);

  const input = mockInput();
  let far = 0;
  run(w, input, 90, () => {
    assert.ok(terry.area.has(at(Math.floor(terry.x), Math.floor(terry.y))), 'Terry stays inside his area');
    far = Math.max(far, Math.hypot(terry.x - 3.5, terry.y - 2.5));
  });
  assert.ok(far > 0.8, 'and does wander around');
});

test("a coworker placed with its own wander keeps to that instead of its type's", () => {
  const level = { ...office, things: undefined, list: [{ type: 'player', x: 10.5, y: 2.5, angle: 180 }, { type: 'terry', x: 3.5, y: 2.5, wander: 0 }, { type: 'terry', x: 3.5, y: 8.5, wander: 1 }] };
  const w = world(level, { noMonsters: true });
  const [still, near] = w.things.filter((t) => t.def.id === 'terry');
  assert.equal(still.area.size, 1, 'wander 0: only the tile it stands on');
  assert.ok(near.area.size > 1 && near.area.size <= 5, 'wander 1: the tiles next to it');
  run(w, mockInput(), 30);
  assert.ok(Math.hypot(still.x - 3.5, still.y - 2.5) < 0.01, 'it stands where it was put');

  const bad = defineLevel({ ...level, id: 'bad', list: [...level.list, { type: 'terry', x: 4.5, y: 3.5, wander: -1 }, { type: 'stormtrooper', x: 4.5, y: 1.5, wander: 2 }] });
  const { errors } = validateContent(new Registry({ ...content, things: [...content.things, ...friendlies], levels: [bad] }));
  assert.deepEqual(errors.filter((e) => e.includes('"wander"')), [
    'Level "bad": a terry at (4.5, 3.5): "wander" must be a number of tiles, 0 or more',
    'Level "bad": a stormtrooper at (4.5, 1.5) has "wander", which only friendly characters take',
  ]);
});

test('monsters never go after coworkers', () => {
  const w = world(room(['#########', '#.......#', '#.......#', '#.......#', '#########'], ['', ' > 0  t', '    2']));
  w.player.player.god = true;
  const monster = w.things.find((t) => t.kind === 'monster');
  run(w, mockInput(), 15, () => assert.notEqual(monster.target?.kind, 'npc'));
  assert.ok(monster.target === w.player, 'the trooper went for the player');
  assert.ok(w.things.filter((t) => t.kind === 'npc').every((t) => !t.dead && !t.removed));
});

// A villager ('w') beside the player, in a corridor that turns south at its
// east end.
const lane = room(
  ['#############', '#...........#', '#...........#', '#...........#', '#########...#', '        #...#', '        #...#', '        #...#', '        #####'],
  ['', '', ' >  w'],
);

test('a shot villager flinches, then runs from the player round the corner, and stops talking', () => {
  const w = world(lane);
  const villager = npc(w, 'villager-woman');
  assert.ok(villager.shootable, 'villagers can be hit');
  w.damage(villager, 5, w.player, w.player);
  assert.equal(villager.state, 'pain');
  assert.ok(!villager.dead);
  run(w, mockInput(), 0.6);
  assert.equal(villager.state, 'flee');
  run(w, mockInput(), 4);
  assert.ok(villager.y > 5, `she went round the corner, away from the player (at ${villager.x.toFixed(1)}, ${villager.y.toFixed(1)})`);
  assert.equal(villager.state, 'flee', 'still scared');
  w.player.x = villager.x;
  w.player.y = villager.y - 1.2;
  w.player.angle = Math.PI / 2;
  w.use(w.player);
  assert.equal(said(w, 'TOWNSWOMAN').length, 0, 'she has nothing to say');
});

test('the player locks on to a villager as to a monster, and can kill one', () => {
  const w = world(hall, { noMonsters: true });
  const villager = w.spawn('villager-man', 7.5, 2.9, Math.PI);
  const lock = lockOn(w, w.player, 0, 5);
  assert.ok(lock && Math.abs(lock.angle - w.player.angleTo(villager)) < 1e-9, 'lock-on turns the shot to them');
  w.damage(villager, 1000, w.player, w.player);
  assert.ok(villager.dead && !villager.removed, 'a corpse stays');
  assert.equal(villager.animName, 'death');
  assert.equal(w.stats.kills, 0, 'not counted as a kill');
  assert.equal(lockOn(w, w.player, 0, 5), null, 'nothing to lock on to now');
});

test('the validator checks a friendly that can be hurt', () => {
  const S = { src: 'assets/sprites/monsters/officer.png', frameWidth: 64, frameHeight: 64 };
  const bad = defineNpc({ id: 'bad-npc', name: 'BAD', sheet: S, wander: 0, anims: { idle: [0] }, health: 10, fleeSpeed: 0, fleeDistance: -1 });
  const { errors, warnings } = validateContent(new Registry({ ...content, things: [...content.things, bad] }));
  assert.deepEqual(errors.filter((e) => e.includes('bad-npc')), ['npc "bad-npc": fleeSpeed must be above 0', 'npc "bad-npc": fleeDistance must be above 0']);
  assert.deepEqual(warnings.filter((e) => e.includes('bad-npc')), ['npc "bad-npc": can be hurt but has no "death" animation (it vanishes when killed)']);
});
