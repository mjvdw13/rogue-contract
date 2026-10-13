import test from 'node:test';
import assert from 'node:assert/strict';
import { analyseLevel, bodyLimits, canCross } from '../tools/lib/levelcheck.mjs';
import { room, registry } from './helpers.js';

const TALL = { floor: 'imp-floor', ceiling: 'imp-ceiling', light: 160, ceilZ: 6 };
const at = (floorZ, ceilZ = 6) => ({ ...TALL, floorZ, ceilZ });

/** Which open tiles of row 1 the player can reach, as a string: '.' reached, 'x' not. */
function reach(row, legend) {
  const level = room(['#'.repeat(row.length + 2), `#${row}#`, '#'.repeat(row.length + 2)], ['', ' >'], { legend: { '.': TALL, ...legend } });
  const a = analyseLevel(registry, level);
  const w = a.built.map.w;
  let out = '';
  for (let x = 1; x <= row.length; x++) out += a.reached[w + x] ? '.' : 'x';
  return { out, oneWay: a.oneWay };
}

test('the body limits come from the hero: a 0.8 step, and a jump onto about 1.56', () => {
  const b = bodyLimits(registry);
  assert.equal(b.step, 0.8);
  assert.ok(Math.abs(b.apex + b.airStep - 1.56) < 0.01, `jump reach ${(b.apex + b.airStep).toFixed(3)}`);
  assert.equal(canCross(b, 0, 6, 1.4, 6), true, 'jump onto 1.4');
  assert.equal(canCross(b, 0, 6, 1.8, 6), false, 'not onto 1.8');
  assert.equal(canCross(b, 2, 6, 0, 6), true, 'drops are fine');
});

test('steps are walked, ledges up to a jump are climbed, higher ones are not', () => {
  assert.equal(reach('..ab', { a: at(0.8), b: at(1.6) }).out, '....', 'a step, then another');
  assert.equal(reach('..j.', { j: at(1.2) }).out, '....', 'jumped onto 1.2');
  assert.equal(reach('..H.', { H: at(2) }).out, '..xx', 'two units is too high, and walls off the far side');
});

test('a low ceiling stops the jump, and crouching gets under low ceilings', () => {
  // 1.2 up from under a 2.2 ceiling: the head hits it after 0.5.
  assert.equal(reach('..j', { '.': at(0, 2.2), j: at(1.2, 3.2) }).out, '..x');
  assert.equal(reach('..v..', { v: at(0, 1.2) }).out, '.....', 'crouch through a 1.2 vent');
  assert.equal(reach('..v..', { v: at(0, 0.8) }).out, '..xxx', 'nothing gets through 0.8');
});

test('a lift carries the player up to a ledge too high to climb', () => {
  const lift = { ...TALL, lift: { stops: [0, 2] } };
  assert.equal(reach('..LH', { H: at(2), L: lift }).out, '....');
});

test('a running jump clears a gap of up to four tiles; wider ones are a one-way drop', () => {
  const legend = { '.': at(2), p: at(0) };
  const four = reach('..pppp..', legend);
  assert.equal(four.out, '........');
  assert.equal(four.oneWay.length, 1, 'dropping into the pit is still one-way');
  const five = reach('..ppppp..', legend);
  assert.equal(five.out, '.......xx', 'too far to jump, and no way up out of the pit');
  assert.match(five.oneWay[0], /5 tile\(s\) near \(3, 1\)/);
});

test('a pit with stairs out of it is not one-way', () => {
  const legend = { a: at(-0.5), b: at(-1), p: at(-1.5) };
  assert.deepEqual(reach('..abpp', legend).oneWay, []);
});

test('a key a reachable monster always drops opens its door', () => {
  const level = (drops) =>
    room(['#######', '#..3..#', '#######'], [''], {
      list: [{ type: 'player', x: 1.5, y: 1.5, angle: 0 }, { type: 'officer', x: 2.5, y: 1.5, drops }],
    });
  const past = (a) => a.reached[a.built.map.w + 5];
  assert.ok(past(analyseLevel(registry, level(['keycard-red']))), 'the officer carries the key');
  assert.ok(!past(analyseLevel(registry, level(undefined))), 'no key: the door stays shut');
  assert.ok(!past(analyseLevel(registry, level([{ item: 'keycard-red', chance: 0.5 }]))), 'a key it only might drop does not count');
});
