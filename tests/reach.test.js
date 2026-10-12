import test from 'node:test';
import assert from 'node:assert/strict';
import { analyseLevel, bodyLimits, canCross } from '../tools/lib/levelcheck.mjs';
import { room, registry } from './helpers.js';

const TALL = { floor: 'carpet', ceiling: 'ceiling-tile', light: 160, ceilZ: 3 };
const at = (floorZ, ceilZ = 3) => ({ ...TALL, floorZ, ceilZ });

/** Which open tiles of row 1 the player can reach, as a string: '.' reached, 'x' not. */
function reach(row, legend) {
  const level = room(['#'.repeat(row.length + 2), `#${row}#`, '#'.repeat(row.length + 2)], ['', ' >'], { legend: { '.': TALL, ...legend } });
  const a = analyseLevel(registry, level);
  const w = a.built.map.w;
  let out = '';
  for (let x = 1; x <= row.length; x++) out += a.reached[w + x] ? '.' : 'x';
  return { out, oneWay: a.oneWay };
}

test('the body limits come from the hero: a 0.4 step, and a jump onto about 0.78', () => {
  const b = bodyLimits(registry);
  assert.equal(b.step, 0.4);
  assert.ok(Math.abs(b.apex + b.airStep - 0.78) < 0.01, `jump reach ${(b.apex + b.airStep).toFixed(3)}`);
  assert.equal(canCross(b, 0, 3, 0.7, 3), true, 'jump onto 0.7');
  assert.equal(canCross(b, 0, 3, 0.9, 3), false, 'not onto 0.9');
  assert.equal(canCross(b, 1, 3, 0, 3), true, 'drops are fine');
});

test('steps are walked, ledges up to a jump are climbed, higher ones are not', () => {
  assert.equal(reach('..ab', { a: at(0.4), b: at(0.8) }).out, '....', 'a step, then another');
  assert.equal(reach('..j.', { j: at(0.6) }).out, '....', 'jumped onto 0.6');
  assert.equal(reach('..H.', { H: at(1) }).out, '..xx', 'a full unit is too high, and walls off the far side');
});

test('a low ceiling stops the jump, and crouching gets under low ceilings', () => {
  // 0.6 up from under a 1.1 ceiling: the head hits it after 0.25.
  assert.equal(reach('..j', { '.': at(0, 1.1), j: at(0.6, 1.6) }).out, '..x');
  assert.equal(reach('..v..', { v: at(0, 0.6) }).out, '.....', 'crouch through a 0.6 vent');
  assert.equal(reach('..v..', { v: at(0, 0.4) }).out, '..xxx', 'nothing gets through 0.4');
});

test('a lift carries the player up to a ledge too high to climb', () => {
  const lift = { ...TALL, lift: { stops: [0, 1] } };
  assert.equal(reach('..LH', { H: at(1), L: lift }).out, '....');
});

test('a running jump clears a gap of up to two tiles; wider ones are a one-way drop', () => {
  const legend = { '.': at(1), p: at(0) };
  const two = reach('..pp..', legend);
  assert.equal(two.out, '......');
  assert.equal(two.oneWay.length, 1, 'dropping into the pit is still one-way');
  const three = reach('..ppp..', legend);
  assert.equal(three.out, '.....xx', 'too far to jump, and no way up out of the pit');
  assert.match(three.oneWay[0], /3 tile\(s\) near \(3, 1\)/);
});

test('a pit with stairs out of it is not one-way', () => {
  const legend = { a: at(-0.25), b: at(-0.5), p: at(-0.75) };
  assert.deepEqual(reach('..abpp', legend).oneWay, []);
});
