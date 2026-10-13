import test from 'node:test';
import assert from 'node:assert/strict';
import { tryPickup } from '../src/engine/things/pickups.js';
import { makeWorld, mockInput, room, run } from './helpers.js';

const arena = room(['#########', '#.......#', '#.......#', '#.......#', '#########'], ['', ' >     t']);

test('armor absorbs a third (class 1) or half (class 2) of the damage', () => {
  const w = makeWorld(arena, { noMonsters: true });
  const p = w.player.player;
  p.armor = 100;
  p.armorClass = 1;
  w.damage(w.player, 30, null, null);
  assert.equal(p.armor, 90);
  assert.equal(p.health, 80);
  p.armorClass = 2;
  w.damage(w.player, 30, null, null);
  assert.equal(p.armor, 75);
  assert.equal(p.health, 65);
});

test('running out of armor drops the armor class', () => {
  const w = makeWorld(arena, { noMonsters: true });
  const p = w.player.player;
  p.armor = 5;
  p.armorClass = 2;
  w.damage(w.player, 40, null, null);
  assert.equal(p.armor, 0);
  assert.equal(p.armorClass, 0);
  assert.equal(p.health, 65);
});

test('the easiest skill halves the damage the player takes', () => {
  const w = makeWorld(arena, { noMonsters: true, skill: 1 });
  w.damage(w.player, 30, null, null);
  assert.equal(w.player.player.health, 85);
});

test('god mode ignores damage', () => {
  const w = makeWorld(arena, { noMonsters: true });
  w.player.player.god = true;
  w.damage(w.player, 500, null, null);
  assert.equal(w.player.player.health, 100);
});

test('killing a monster counts the kill and drops its item', () => {
  const w = makeWorld(arena);
  const trooper = w.things.find((t) => t.kind === 'monster');
  assert.ok(trooper);
  w.damage(trooper, 1000, w.player, w.player);
  assert.ok(trooper.dead);
  assert.equal(w.stats.kills, 1);
  // Troopers drop a power cell most of the time: a few more make it certain enough.
  for (let k = 0; k < 6; k++) w.damage(w.spawn('stormtrooper', 5.5, 2.5), 1000, w.player, w.player);
  run(w, mockInput(), 0.5);
  assert.ok(w.things.some((t) => t.def.id === 'power-cell'), 'troopers drop power cells');
});

test('pickups respect their limits', () => {
  const w = makeWorld(arena, { noMonsters: true });
  const p = w.player.player;
  const item = (id) => w.spawn(id, 2.5, 2.5);
  assert.equal(tryPickup(w, w.player, item('med-kit')), false, 'full health: the med kit stays');
  p.health = 95;
  assert.equal(tryPickup(w, w.player, item('med-kit')), true);
  assert.equal(p.health, 100);
  assert.equal(tryPickup(w, w.player, item('shield-unit')), true);
  assert.equal(p.armor, 20);
  p.armor = 200;
  assert.equal(tryPickup(w, w.player, item('shield-unit')), false, 'shields are capped at 200');
  p.ammo.energy = p.maxAmmo.energy;
  assert.equal(tryPickup(w, w.player, item('energy-pack')), false, 'ammo is capped');
});

test('the mercenary starts with fists and a blaster', () => {
  const w = makeWorld(arena, { noMonsters: true });
  const p = w.player.player;
  assert.deepEqual([...p.weapons], ['fists', 'blaster']);
  assert.equal(p.weapon, 'blaster');
  assert.equal(p.ammo.energy, 60);
});

test('the blaster hits what it is pointed at', () => {
  const w = makeWorld(arena);
  const trooper = w.things.find((t) => t.kind === 'monster');
  w.player.player.notarget = true;
  const input = mockInput();
  input.hold('fire');
  const start = w.player.player.ammo.energy;
  run(w, input, 3);
  assert.ok(w.player.player.ammo.energy < start, 'energy was spent');
  assert.ok(trooper.dead, 'the trooper in front of the player went down');
});

test('effects (puffs, blood, explosions) play once and disappear', () => {
  const w = makeWorld(arena, { noMonsters: true });
  const fx = ['puff', 'blood', 'explosion'].map((id) => w.spawnEffect(id, 4.5, 2.5, 0.5));
  run(w, mockInput(), 1);
  for (const e of fx) assert.ok(e.removed, `${e.def.id} is gone`);
});

test('a monster placed with its own drops drops them on top of its type\'s', () => {
  const level = room(['#########', '#.......#', '#########'], [''], {
    list: [{ type: 'player', x: 1.5, y: 1.5, angle: 0 }, { type: 'officer', x: 6.5, y: 1.5, drops: ['keycard-red'] }],
  });
  const w = makeWorld(level);
  const officer = w.things.find((t) => t.def.id === 'officer');
  w.damage(officer, 1000, w.player, w.player);
  run(w, mockInput(), 0.5);
  const key = w.things.find((t) => t.def.id === 'keycard-red');
  assert.ok(key, 'the officer drops the red keycard');
  assert.ok(key.dropped);
  assert.ok(Math.hypot(key.x - 6.5, key.y - 1.5) < 0.5, 'at the body');
  // Other officers keep only their type's drops.
  const other = w.spawn('officer', 4.5, 1.5);
  assert.equal(other.drops, null);
});
