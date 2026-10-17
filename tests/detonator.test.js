import test from 'node:test';
import assert from 'node:assert/strict';
import { makeWorld, mockInput, room, run } from './helpers.js';

// The thermal detonator (PLAN.md Phase 1b U): a projectile that bounces
// (`bounce`), and a weapon whose hand drops away after each throw (`reraise`)
// and that throws when fire is let go, harder the longer it was held (`charge`).

const TALL = { '.': { floor: 'imp-floor', ceiling: 'imp-ceiling', light: 160, ceilZ: 8 } };
const hall = () => room(['##############', '#............#', '#............#', '#............#', '##############'], ['', '', ' >'], { legend: TALL });

/** Throw one from the player, level (slope 0) from `z`; the sounds it makes are in `w.heard`. */
function toss(w, angle = 0, z = 1) {
  w.heard = [];
  const play = w.playSoundFrom.bind(w);
  w.playSoundFrom = (id, t) => {
    if (id) w.heard.push({ id, time: w.time });
    return play(id, t);
  };
  return w.spawnProjectile('detonator-thrown', w.player, angle, {}, { z, slope: 0 });
}

test('a thrown detonator bounces off the wall and comes back, without going off', () => {
  const w = makeWorld(hall(), { noMonsters: true });
  const p = toss(w);
  let far = 0;
  let back = false;
  run(w, mockInput(), 2, () => {
    far = Math.max(far, p.x);
    if (p.vx < 0) back = true;
  });
  assert.ok(far > 11 && far < 13, `reached the far wall, not through it (${far.toFixed(2)})`);
  assert.ok(back, 'turned back off it');
  assert.ok(!p.removed && p.state !== 'exploding', 'still waiting for its fuse');
});

test('it bounces a few times, clanking, loses speed and comes to rest on the floor', () => {
  const w = makeWorld(hall(), { noMonsters: true });
  const p = toss(w, 0, 2);
  run(w, mockInput(), 2.2);
  const clanks = w.heard.filter((s) => s.id === 'detonator-bounce');
  assert.ok(clanks.length >= 3, `clanked ${clanks.length} times`);
  assert.ok(clanks.at(-1).time < 1.6, 'and not while it rolls or lies there');
  assert.ok(p.resting, 'lying on the floor');
  assert.ok(Math.abs(p.z - p.radius) < 1e-9, 'its centre its radius above the floor');
  assert.ok(Math.hypot(p.vx, p.vy, p.vz) < 0.05, 'stopped');
});

test('it goes off when its fuse runs out, hurting what is round it', () => {
  const w = makeWorld(hall(), { noMonsters: true });
  const p = toss(w);
  p.x = 6.5;
  p.y = 2.5;
  p.vx = p.vy = 0;
  const trooper = w.spawn('stormtrooper', 8.5, 2.5, Math.PI);
  const health = trooper.health;
  run(w, mockInput(), p.def.bounce.fuse - 0.1);
  assert.ok(!p.removed && p.state !== 'exploding', 'not yet');
  run(w, mockInput(), 0.2);
  assert.ok(p.removed || p.state === 'exploding', 'gone off');
  assert.ok(trooper.dead || trooper.health < health, 'the blast reached the trooper');
  assert.ok(w.heard.some((s) => s.id === 'detonator-explode'));
});

test('it goes off at once on a body', () => {
  const w = makeWorld(hall(), { noMonsters: true });
  const trooper = w.spawn('stormtrooper', 5.5, 2.5, Math.PI);
  const p = toss(w);
  run(w, mockInput(), 0.4);
  assert.ok(p.removed || p.state === 'exploding', 'burst on the trooper');
  assert.ok(p.x < 6, `where the trooper stands (${p.x.toFixed(2)})`);
  assert.ok(trooper.dead || trooper.health < trooper.def.health);
});

/** A player holding `n` detonators, the hand up and ready. */
function armed(n = 2) {
  const w = makeWorld(hall(), { noMonsters: true });
  const p = w.player.player;
  p.weapons.add('thermal-detonator');
  p.ammo.detonator = n;
  p.weapon = 'thermal-detonator';
  const input = mockInput();
  run(w, input, 0.5); // raised
  return { w, p, input };
}

/** Hold fire `hold` seconds and let go; the detonator thrown and the throw's power. */
function throwFor(w, input, hold) {
  input.hold('fire');
  run(w, input, hold);
  input.release('fire');
  let det = null;
  run(w, input, 0.2, () => (det ??= w.things.find((t) => t.def.id === 'detonator-thrown')));
  return { det, power: w.player.player.weaponState.power };
}

test('nothing is thrown while fire is held; letting go throws it', () => {
  const { w, p, input } = armed();
  input.hold('fire');
  run(w, input, 1.5);
  assert.equal(p.weaponState.state, 'charge', 'wound up');
  assert.equal(p.ammo.detonator, 2);
  assert.ok(!w.things.some((t) => t.def.id === 'detonator-thrown'), 'still in the hand');
  assert.ok(p.weaponState.y > 0, 'the hand sunk back');
  input.release('fire');
  run(w, input, 0.1);
  assert.equal(p.ammo.detonator, 1, 'thrown');
  assert.ok(w.things.some((t) => t.def.id === 'detonator-thrown'));
});

test('a tap is a short toss; held down, a long throw', () => {
  const tap = armed();
  const short = throwFor(tap.w, tap.input, 1 / 60);
  const hold = armed();
  const long = throwFor(hold.w, hold.input, 1.2);
  const def = tap.p.weaponState.def.charge;
  assert.ok(Math.abs(short.power - def.min) < 0.05, `a tap: about the least power (${short.power.toFixed(2)})`);
  assert.equal(long.power, 1, 'held a second or more: full power');
  const speed = (d) => Math.hypot(d.vx, d.vy);
  assert.ok(speed(long.det) > 2.5 * speed(short.det), 'the long throw flies much faster');
});

test('changing weapon while winding up drops the throw', () => {
  const { w, p, input } = armed();
  p.weapons.add('blaster');
  p.ammo.energy = 20;
  input.hold('fire');
  run(w, input, 0.3);
  input.tap('weapon2');
  run(w, input, 0.05);
  input.release('fire');
  run(w, input, 1);
  assert.equal(p.weapon, 'blaster');
  assert.equal(p.ammo.detonator, 2, 'nothing thrown');
});

test('after a throw the hand drops away and the next one comes up; with none left, the blaster', () => {
  const { w, p, input } = armed();
  const ws = p.weaponState;
  assert.equal(ws.state, 'ready');
  const states = new Set();
  input.hold('fire');
  run(w, input, 0.2);
  input.release('fire');
  run(w, input, 0.4, () => states.add(ws.state));
  assert.equal(p.ammo.detonator, 1, 'threw one');
  assert.ok(states.has('reload'), 'the empty hand went down');
  run(w, input, 1);
  assert.equal(ws.state, 'ready', 'and the next one came up');
  assert.equal(ws.y, 0, 'all the way up');
  assert.equal(p.weapon, 'thermal-detonator');
  assert.equal(ws.frame, 0, 'the fist holding it');
  input.hold('fire');
  run(w, input, 0.2);
  input.release('fire');
  run(w, input, 0.4);
  assert.equal(p.ammo.detonator, 0);
  run(w, input, 1.2);
  assert.equal(p.weapon, 'blaster', 'none left: the blaster');
});
