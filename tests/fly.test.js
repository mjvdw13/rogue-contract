import test from 'node:test';
import assert from 'node:assert/strict';
import { runActions } from '../src/engine/world/actions.js';
import { contentAngle } from '../src/engine/world/level.js';
import content from '../src/content/index.js';
import { Registry } from '../src/engine/registry.js';
import { validateContent } from '../src/engine/validate.js';
import { room, makeWorld, mockInput, run } from './helpers.js';

// The fly action: a thing flown along timed keyframes (a ship coming in to
// land), and what happens when it gets there.

const ROWS = ['##########', '#........#', '#........#', '#........#', '#........#', '##########'];
const yard = (extra = {}) => room(ROWS, ['', '', ' >'], { legend: { '.': { floor: 'imp-floor', ceiling: 'sky', ceilZ: 24, light: 160, tag: 'pad' } }, ...extra });
const PATH = [[2.5, 2.5, 10, 0, 0], [6.5, 3.5, 4, 90, 2], [6.5, 3.5, 0, 90, 1]];

test('a thing told to fly appears at the start of its path, follows it and arrives on time', () => {
  const w = makeWorld(yard());
  const input = mockInput();
  assert.ok(!w.things.some((t) => t.def.id === 'moldy-crow'), 'no ship to begin with');
  runActions(w, [{ action: 'fly', thing: 'moldy-crow', path: PATH }]);
  const ship = w.things.find((t) => t.def.id === 'moldy-crow');
  assert.ok(ship, 'one is made at the first keyframe');
  assert.deepEqual([ship.x, ship.y, ship.z], [2.5, 2.5, 10]);
  run(w, input, 1);
  assert.ok(ship.x > 2.5 && ship.x < 6.5 && ship.z < 10 && ship.z > 4, 'halfway along the first leg it is between its ends');
  run(w, input, 1.5);
  assert.ok(Math.abs(ship.x - 6.5) < 1e-6 && ship.z < 4 && ship.z > 0, 'on the second leg it is over its spot, coming down');
  run(w, input, 0.6);
  assert.deepEqual([ship.x, ship.y, ship.z], [6.5, 3.5, 0], 'it ends on its last keyframe');
  assert.ok(Math.abs(ship.angle - contentAngle(90)) < 1e-6, 'facing the way the keyframe says');
  assert.equal(w.flights.length, 0, 'and the flight is over');
});

test('when a flight arrives its "then" actions run, and not before', () => {
  const w = makeWorld(yard({
    triggers: [{ on: 'enter', tag: 'pad', if: 'down', do: ['exit'] }],
  }));
  const input = mockInput();
  runActions(w, [{ action: 'fly', thing: 'moldy-crow', path: PATH, then: [{ action: 'setFlag', flag: 'down' }] }]);
  run(w, input, 2.9);
  assert.ok(!w.flags.has('down'), 'still in the air');
  run(w, input, 0.2);
  assert.ok(w.flags.has('down'), 'landed');
});

test('a thing already in the level is the one flown', () => {
  const w = makeWorld(yard());
  const ship = w.spawn('moldy-crow', 4.5, 2.5);
  runActions(w, [{ action: 'fly', thing: 'moldy-crow', path: PATH }]);
  assert.equal(w.things.filter((t) => t.def.id === 'moldy-crow').length, 1);
  assert.deepEqual([ship.x, ship.y, ship.z], [2.5, 2.5, 10], 'moved to the start of the path');
});

test('the validator rejects a flight with a bad path, and reads the flags its "then" sets', () => {
  const check = (fly) => {
    const level = yard({ id: 'fly-check', triggers: [{ on: 'start', do: [fly] }, { on: 'enter', tag: 'pad', if: 'down', do: ['exit'] }] });
    return validateContent(new Registry({ ...content, levels: [level] })).errors.filter((e) => e.includes('fly') || e.includes('flag'));
  };
  const good = { action: 'fly', thing: 'moldy-crow', path: PATH, then: [{ action: 'setFlag', flag: 'down' }] };
  assert.deepEqual(check(good), []);
  assert.ok(check({ ...good, path: [PATH[0]] }).some((e) => /two or more keyframes/.test(e)), 'one keyframe is no path');
  assert.ok(check({ ...good, path: [PATH[0], [6.5, 3.5, 0, 90, 0]] }).some((e) => /two or more keyframes/.test(e)), 'a leg needs its seconds');
  assert.ok(check({ ...good, path: [PATH[0], [60, 3.5, 0, 90, 2]] }).some((e) => /leaves the map/.test(e)), 'a path stays on the map');
  assert.ok(check({ ...good, then: [] }).some((e) => /flag "down"/.test(e)), 'a flag nothing sets is still an error');
});
