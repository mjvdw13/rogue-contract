import test from 'node:test';
import assert from 'node:assert/strict';
import content from '../src/content/index.js';
import { Registry } from '../src/engine/registry.js';
import { validateContent } from '../src/engine/validate.js';
import { room, makeWorld, mockInput, run } from './helpers.js';

// Traffic: a level's lanes, each sending a thing down a path every so often
// and taking it away at the end (ships crossing the sky).

const ROWS = ['##########', '#........#', '#........#', '#........#', '#........#', '##########'];
const yard = (extra = {}) => room(ROWS, ['', '', ' >'], { legend: { '.': { floor: 'imp-floor', ceiling: 'sky', ceilZ: 24, light: 160 } }, ...extra });
const PATH = [[1.5, 1.5, 10, 0, 0], [4.5, 4.5, 12, 0, 1], [8.5, 1.5, 10, 0, 1]];
const ships = (w) => w.things.filter((t) => t.def.id === 'tie-patrol');

test('a lane sends a ship down its path, takes it away at the end, and sends another later', () => {
  const w = makeWorld(yard({ traffic: [{ thing: 'tie-patrol', paths: [PATH], first: [1, 1], every: [3, 3] }] }));
  const input = mockInput();
  run(w, input, 0.9);
  assert.equal(ships(w).length, 0, 'none before its first is due');
  run(w, input, 0.2);
  const [ship] = ships(w);
  assert.ok(ship, 'the first sets off');
  assert.ok(Math.abs(ship.z - 10) < 0.5, 'at the height its path starts');
  run(w, input, 0.95);
  assert.ok(Math.abs(ship.x - 4.5) < 0.6 && Math.abs(ship.y - 4.5) < 0.6, `it goes by way of the middle keyframe (${ship.x.toFixed(2)}, ${ship.y.toFixed(2)})`);
  run(w, input, 1.2);
  assert.equal(ships(w).length, 0, 'gone once it reaches the end');
  assert.ok(ship.removed);
  run(w, input, 2.5);
  assert.equal(ships(w).length, 0, 'the lane waits');
  run(w, input, 0.8);
  assert.equal(ships(w).length, 1, 'and sends the next');
});

test('a ship in traffic moves at an even pace: no stop at a keyframe', () => {
  const w = makeWorld(yard({ traffic: [{ thing: 'tie-patrol', paths: [PATH], first: [0, 0], every: [9, 9] }] }));
  const input = mockInput();
  run(w, input, 0.9);
  const [ship] = ships(w);
  const before = [ship.x, ship.y];
  run(w, input, 0.2);
  assert.ok(Math.hypot(ship.x - before[0], ship.y - before[1]) > 0.4, 'still moving across the keyframe');
});

test('a lane with a count sends that many down the same path, one behind the other', () => {
  const w = makeWorld(yard({ traffic: [{ thing: 'tie-patrol', paths: [PATH], first: [0, 0], every: [9, 9], count: 2, gap: 0.5 }] }));
  const input = mockInput();
  run(w, input, 0.3);
  assert.equal(ships(w).length, 1);
  run(w, input, 0.5);
  const [a, b] = ships(w);
  assert.ok(a && b, 'the second follows');
  assert.ok(b.x < a.x, 'behind the first');
  run(w, input, 2);
  assert.equal(ships(w).length, 0, 'both gone, and no third');
});

test('traffic leaves the dice of the game alone', () => {
  const roll = (extra) => {
    const w = makeWorld(yard(extra));
    run(w, mockInput(), 3);
    return w.rng.next();
  };
  assert.equal(roll({ traffic: [{ thing: 'tie-patrol', paths: [PATH], first: [0, 0], every: [1, 2] }] }), roll({}));
});

test('the validator rejects traffic with an unknown or solid thing, a bad path or bad times', () => {
  const check = (lane) => validateContent(new Registry({ ...content, levels: [yard({ id: 'traffic-check', traffic: [lane] })] })).errors.filter((e) => e.includes('traffic'));
  const good = { thing: 'tie-patrol', paths: [PATH], every: [5, 9] };
  assert.deepEqual(check(good), []);
  assert.match(check({ ...good, thing: 'no-such-ship' })[0], /unknown thing/);
  assert.match(check({ ...good, thing: 'tie-fighter' })[0], /solid/);
  assert.match(check({ ...good, paths: [[[1.5, 1.5, 10, 0, 0]]] })[0], /keyframes/);
  assert.match(check({ ...good, paths: [[[1.5, 1.5, 10, 0, 0], [40, 1.5, 10, 0, 1]]] })[0], /leaves the map/);
  assert.match(check({ ...good, every: [0, 4] })[0], /every/);
  assert.match(check({ ...good, count: 0 })[0], /count/);
  assert.match(check({ ...good, speed: 3 })[0], /unknown field/);
});
