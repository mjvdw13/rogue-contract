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

test('a trooper on a beat walks its patrol while it has not seen the player', () => {
  const patrol = [[10.5, 2.5], [26.5, 2.5]];
  const w = makeWorld(hall([{ type: 'stormtrooper', x: 12.5, y: 2.5, beat: { patrol, idleTime: [1, 1] } }]));
  w.player.player.notarget = true;
  const trooper = w.things.find((t) => t.kind === 'monster');
  const visits = [];
  run(w, mockInput(), 40, () => {
    const i = patrol.findIndex(([x, y]) => Math.hypot(trooper.x - x, trooper.y - y) < 0.2);
    if (i >= 0 && visits[visits.length - 1] !== i) visits.push(i);
  });
  assert.deepEqual(visits.slice(0, 3), [0, 1, 0], 'there and back');
  assert.equal(trooper.state, 'idle', 'still on the lookout');
});

test('a trooper on a beat drops it for good once it sees the player, and fights', () => {
  const w = makeWorld(hall([{ type: 'stormtrooper', x: 20.5, y: 4.5, beat: { patrol: [[20.5, 4.5], [28.5, 4.5]] } }]));
  const trooper = w.things.find((t) => t.kind === 'monster');
  run(w, mockInput(), 3);
  assert.notEqual(trooper.state, 'idle');
  assert.equal(trooper.beat, null, 'its beat is forgotten');
  run(w, mockInput(), 5);
  assert.ok(w.player.player.health < 100 || w.things.some((t) => t.kind === 'projectile'), 'it fires on the player');
});

test('the validator checks beats', () => {
  const level = defineLevel({
    ...hall([
      { type: 'stormtrooper', x: 4.5, y: 2.5, beat: { patrol: [[4.5, 2.5], [40.5, 2.5]] } },
      { type: 'stormtrooper', x: 6.5, y: 2.5, beat: { patrol: [[6.5, 2.5], [8.5, 2.5]], lines: ['Hm.'] } },
      { type: 'stormtrooper', x: 8.5, y: 6.5, beat: { speed: 2 } },
      { type: 'stormtrooper', x: 10.5, y: 6.5, calm: true, beat: { patrol: [[10.5, 6.5], [12.5, 6.5]] } },
      { type: 'med-kit', x: 9.5, y: 2.5, beat: { patrol: [[9.5, 2.5], [9.5, 4.5]] } },
    ]),
    id: 'bad',
  });
  const { errors } = validateContent(new Registry({ ...content, levels: [level] }));
  assert.deepEqual(errors.filter((e) => e.includes('beat') || e.includes('patrol')), [
    'Level "bad": a stormtrooper at (4.5, 2.5): patrol point (40.5, 2.5) has no room for it to stand',
    'Level "bad": a stormtrooper at (4.5, 2.5): the patrol\'s walk from (4.5, 2.5) to (40.5, 2.5) is blocked (each walk is a straight line)',
    'Level "bad": a stormtrooper at (6.5, 2.5): beat has unknown field "lines" (it takes patrol, loop, speed, stride, idleTime)',
    'Level "bad": a stormtrooper at (8.5, 6.5): beat needs a "patrol" (two or more [x, y] points)',
    'Level "bad": a stormtrooper at (10.5, 6.5) has both "calm" and "beat" (a calm one patrols with calm.patrol)',
    'Level "bad": a med-kit at (9.5, 2.5) has a "beat", which only monsters take',
  ]);
});
