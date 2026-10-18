import test from 'node:test';
import assert from 'node:assert/strict';
import content from '../src/content/index.js';
import { Registry } from '../src/engine/registry.js';
import { defineLevel } from '../src/engine/defs.js';
import { validateContent } from '../src/engine/validate.js';
import { makeWorld, mockInput, room, run } from './helpers.js';

// A long open hall, 30 x 7, the player at its west end facing east.
const HALL = ['################################', ...Array(7).fill('#..............................#'), '################################'];
const hall = (list) => ({ ...room(HALL, []), list: [{ type: 'player', x: 2.5, y: 4.5, angle: 0 }, ...list] });

const said = (w) => w.messages.filter((m) => m.includes(': '));

test('a calm sandtrooper in plain sight never shoots, even at gunfire', () => {
  const w = makeWorld(hall([{ type: 'sandtrooper', x: 8.5, y: 4.5, angle: 180, calm: true }]));
  const trooper = w.things.find((t) => t.kind === 'monster');
  assert.equal(trooper.state, 'calm');
  w.noiseAlert(w.player);
  run(w, mockInput(), 8);
  assert.equal(trooper.state, 'calm', 'it never noticed the player');
  assert.equal(w.player.player.health, 100);
  assert.ok(!w.things.some((t) => t.kind === 'projectile'), 'and never fired');
});

test('a calm Jawa strolls round its spot, no further than its wander', () => {
  const w = makeWorld(hall([{ type: 'jawa', x: 16.5, y: 4.5, calm: { wander: 3 } }]));
  const jawa = w.things.find((t) => t.kind === 'monster');
  let furthest = 0;
  let walked = 0;
  run(w, mockInput(), 40, () => {
    furthest = Math.max(furthest, Math.abs(jawa.x - 16.5), Math.abs(jawa.y - 4.5));
    if (jawa.animName === 'walk') walked++;
  });
  assert.ok(walked > 60, 'it went for walks');
  assert.ok(furthest > 1, `it left its spot (${furthest.toFixed(2)})`);
  assert.ok(furthest < 4, `but kept within 3 tiles of it (${furthest.toFixed(2)})`);
  assert.equal(jawa.state, 'calm');
});

test('a calm trooper with wander 0 stands its post', () => {
  const w = makeWorld(hall([{ type: 'sandtrooper', x: 16.5, y: 4.5, calm: { wander: 0 } }]));
  const trooper = w.things.find((t) => t.kind === 'monster');
  run(w, mockInput(), 20);
  assert.ok(Math.hypot(trooper.x - 16.5, trooper.y - 4.5) < 0.01);
});

test('a patrol walks its points there and back, pausing at each', () => {
  const patrol = [[8.5, 2.5], [26.5, 2.5], [26.5, 6.5]];
  const w = makeWorld(hall([{ type: 'sandtrooper', x: 10.5, y: 2.5, calm: { patrol, idleTime: [1, 1] } }]));
  const trooper = w.things.find((t) => t.kind === 'monster');
  const visits = [];
  run(w, mockInput(), 60, () => {
    const i = patrol.findIndex(([x, y]) => Math.hypot(trooper.x - x, trooper.y - y) < 0.2);
    if (i >= 0 && visits[visits.length - 1] !== i) visits.push(i);
  });
  assert.deepEqual(visits.slice(0, 5), [0, 1, 2, 1, 0], 'nearest first, along to the end, then back');
  assert.equal(trooper.state, 'calm');

  const round = makeWorld(hall([{ type: 'sandtrooper', x: 10.5, y: 2.5, calm: { patrol, loop: true, idleTime: [1, 1] } }]));
  const looper = round.things.find((t) => t.kind === 'monster');
  const order = [];
  run(round, mockInput(), 60, () => {
    const i = patrol.findIndex(([x, y]) => Math.hypot(looper.x - x, looper.y - y) < 0.2);
    if (i >= 0 && order[order.length - 1] !== i) order.push(i);
  });
  assert.deepEqual(order.slice(0, 5), [0, 1, 2, 0, 1], 'with loop it goes round');
});

test('a patrol steps round the player standing in its way, and goes on', () => {
  const w = makeWorld(hall([{ type: 'sandtrooper', x: 4.5, y: 4.5, calm: { patrol: [[4.5, 4.5], [26.5, 4.5]], idleTime: [0.5, 0.5] } }]));
  const trooper = w.things.find((t) => t.kind === 'monster');
  w.player.x = 14.5;
  w.player.y = 4.5;
  let furthest = 0;
  run(w, mockInput(), 20, () => (furthest = Math.max(furthest, trooper.x)));
  assert.ok(furthest > 26, `it got past to the far point (reached x ${furthest.toFixed(1)})`);
});

test('bumping into or using a calm trooper makes it turn and say a line', () => {
  const lines = ['Move along.', 'Hunter.'];
  const w = makeWorld(hall([{ type: 'sandtrooper', x: 5.5, y: 4.5, angle: 90, calm: { lines, wander: 0 } }]));
  const trooper = w.things.find((t) => t.kind === 'monster');
  const input = mockInput();
  input.hold('forward');
  run(w, input, 1.5);
  assert.ok(w.player.x < trooper.x - trooper.radius, 'the player cannot walk through it');
  assert.equal(said(w).length, 1, 'one line per bump, then a cooldown');
  assert.ok(lines.some((l) => said(w)[0] === `SANDTROOPER: ${l}`), said(w)[0]);
  assert.ok(Math.abs(trooper.angle - Math.PI) < 0.3, 'it turned to face the player');
  input.release('forward');
  run(w, input, 3);
  input.tap('use');
  run(w, input, 0.1);
  assert.equal(said(w).length, 2, 'use talks to it too');
  assert.notEqual(said(w)[0], said(w)[1], 'no line twice in a row');
});

test('a calm trooper that is shot turns on the player', () => {
  const w = makeWorld(hall([{ type: 'sandtrooper', x: 10.5, y: 4.5, calm: { wander: 0 } }]));
  const trooper = w.things.find((t) => t.kind === 'monster');
  w.damage(trooper, 1, w.player, w.player);
  assert.equal(trooper.calm, null);
  assert.notEqual(trooper.state, 'calm');
  run(w, mockInput(), 6);
  assert.ok(w.player.player.health < 100, 'it fought back');
});

// The town's switch. A Jawa beside the player, a trooper at the far end of
// the hall and one shut away behind a door, out of earshot.
const TOWN = [
  '################################',
  '#..............................#',
  '#..............................#',
  '#..............................#',
  '#####################D##########',
  '#..............................#',
  '#..............................#',
  '################################',
];
const town = (extra = {}) => ({
  ...room(TOWN, []),
  list: [
    { type: 'player', x: 2.5, y: 2.5, angle: 0 },
    { type: 'jawa', x: 5.5, y: 2.5, calm: { wander: 0 } },
    { type: 'sandtrooper', x: 28.5, y: 2.5, angle: 180, calm: { wander: 0 } },
    { type: 'sandtrooper', x: 28.5, y: 5.5, calm: { wander: 0 } },
  ],
  triggers: [{ on: 'hostile', do: [{ action: 'message', text: 'THE TOWN TURNS.' }] }],
  ...extra,
});
const calmOnes = (w) => w.things.filter((t) => t.kind === 'monster' && t.calm);

test('firing a blaster turns every calm monster, and runs the hostile trigger once', () => {
  const w = makeWorld(town());
  w.player.angle = Math.PI / 2; // at the wall, hitting no one
  const input = mockInput();
  input.hold('fire');
  run(w, input, 1);
  input.release('fire');
  assert.equal(calmOnes(w).length, 0, 'none is calm now');
  assert.deepEqual(w.messages.filter((m) => m === 'THE TOWN TURNS.'), ['THE TOWN TURNS.']);
  const [jawa, far, behind] = w.things.filter((t) => t.kind === 'monster');
  const awake = (m) => ['chase', 'attack', 'pain'].includes(m.state);
  assert.ok(awake(jawa), `the Jawa beside the player heard it (${jawa.state})`);
  assert.ok(awake(far), `so did the trooper down the hall (${far.state})`);
  assert.equal(behind.state, 'idle', 'the one behind the door did not, but is no longer calm');
  run(w, mockInput(), 5);
  assert.ok(w.player.player.health < 100, 'and they fight');
});

test('hurting anyone turns the town; so does the hostile action', () => {
  const punched = makeWorld(town());
  const jawa = punched.things.find((t) => t.def.id === 'jawa');
  punched.damage(jawa, 1, punched.player, punched.player);
  assert.equal(calmOnes(punched).length, 0);

  const story = makeWorld(town({ triggers: [{ on: 'start', do: ['hostile'] }] }));
  assert.equal(calmOnes(story).length, 0, 'a trigger can throw the switch');
  assert.ok(story.hostile);
});

test('with no calm monsters, gunfire runs no hostile trigger', () => {
  const w = makeWorld({ ...town(), list: [{ type: 'player', x: 2.5, y: 2.5, angle: 90 }] });
  const input = mockInput();
  input.hold('fire');
  run(w, input, 1);
  assert.equal(w.hostile, false);
  assert.equal(w.messages.filter((m) => m === 'THE TOWN TURNS.').length, 0);
});

test('the validator checks calm placements and patrols', () => {
  const level = defineLevel({
    ...hall([
      { type: 'sandtrooper', x: 4.5, y: 2.5, calm: { patrol: [[4.5, 2.5], [40.5, 2.5]] } },
      { type: 'sandtrooper', x: 6.5, y: 2.5, calm: { patrol: [[6.5, 2.5]], walk: true } },
      { type: 'jawa', x: 8.5, y: 2.5, calm: 'yes' },
      { type: 'med-kit', x: 9.5, y: 2.5, calm: true },
    ]),
    id: 'bad',
  });
  const { errors } = validateContent(new Registry({ ...content, levels: [level] }));
  assert.deepEqual(errors.filter((e) => e.includes('calm') || e.includes('patrol')), [
    'Level "bad": a sandtrooper at (4.5, 2.5): patrol point (40.5, 2.5) has no room for it to stand',
    'Level "bad": a sandtrooper at (4.5, 2.5): the patrol\'s walk from (4.5, 2.5) to (40.5, 2.5) is blocked (each walk is a straight line)',
    'Level "bad": a sandtrooper at (6.5, 2.5): calm has unknown field "walk" (it takes lines, speed, wander, idleTime, patrol, loop)',
    'Level "bad": a sandtrooper at (6.5, 2.5): calm patrol must be a list of two or more [x, y] points',
    'Level "bad": a jawa at (8.5, 2.5): "calm" must be true or an object',
    'Level "bad": a med-kit at (9.5, 2.5) is placed "calm", which only monsters take (friendlies are always calm)',
  ]);
});
