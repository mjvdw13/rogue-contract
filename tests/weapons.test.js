import test from 'node:test';
import assert from 'node:assert/strict';
import { makeWorld, mockInput, room, run } from './helpers.js';

// The weapons after Dark Forces' (the rifle, repeater, fusion cutter, mines,
// mortar and assault cannon): what the engine does for them.

const hall = () => room(['##############', '#............#', '#............#', '#............#', '##############'], ['', '', ' >']);

/** A world with the player holding `weapon`, raised, with plenty of its ammo. */
function holding(weapon) {
  const w = makeWorld(hall(), { noMonsters: true });
  const p = w.player.player;
  const def = w.registry.weapons.get(weapon);
  p.weapons.add(weapon);
  p.weapon = weapon;
  if (def.ammo) p.ammo[def.ammo] = 100;
  const input = mockInput();
  run(w, input, 0.5); // raised
  return { w, p, def, input };
}

test('a weapon with a cycle fires its barrels one after another, and round again', () => {
  const { w, p, def, input } = holding('fusion-cutter');
  const shots = [];
  const ws = p.weaponState;
  const fire = ws.setAnim.bind(ws);
  ws.setAnim = (name) => {
    if (name !== 'idle') shots.push(name);
    return fire(name);
  };
  input.hold('fire');
  const n = def.cycle.length + 2;
  run(w, input, 3);
  assert.deepEqual(shots.slice(0, n), [...def.cycle, def.cycle[0], def.cycle[1]]);
});

test('a cycle starts again from its first barrel when the weapon comes back up', () => {
  const { w, p, def, input } = holding('fusion-cutter');
  const ws = p.weaponState;
  input.hold('fire');
  run(w, input, 0.5);
  input.release('fire');
  run(w, input, 0.3);
  assert.ok(ws.shot > 1, 'fired a few');
  p.weapons.add('blaster');
  p.ammo.energy = 50;
  p.pendingWeapon = 'blaster';
  run(w, input, 1);
  p.pendingWeapon = 'fusion-cutter';
  run(w, input, 1);
  const shots = [];
  const fire = ws.setAnim.bind(ws);
  ws.setAnim = (name) => {
    if (name !== 'idle') shots.push(name);
    return fire(name);
  };
  input.hold('fire');
  run(w, input, 0.1);
  assert.equal(shots[0], def.cycle[0]);
});

/** Set down a mine, and let it come to rest. Returns it. */
function setMine(w, input) {
  input.hold('fire');
  run(w, input, 0.1);
  input.release('fire');
  run(w, input, 1);
  return w.things.find((t) => t.def.id === 'mine-placed');
}

test('a mine is set down just in front of you and lies on the floor', () => {
  const { w, p, input } = holding('mines');
  const ammo = p.ammo.mine;
  const mine = setMine(w, input);
  assert.ok(mine, 'set down');
  assert.equal(p.ammo.mine, ammo - 1);
  assert.ok(mine.resting, 'lying still');
  const ahead = mine.x - w.player.x;
  assert.ok(ahead > 0.5 && ahead < 3, `just in front (${ahead.toFixed(2)} tiles)`);
  assert.equal(p.weaponState.def.id, 'mines', 'the next one comes up');
});

test('a mine goes off when someone walks into it', () => {
  const { w, input } = holding('mines');
  const mine = setMine(w, input);
  w.player.x -= 3; // well back
  const trooper = w.spawn('stormtrooper', mine.x + 0.4, mine.y, Math.PI);
  run(w, input, 0.1);
  assert.ok(mine.state === 'exploding' || mine.removed, 'gone off');
  assert.ok(trooper.dead || trooper.health < trooper.def.health, 'the trooper caught it');
});

test('left alone, a mine goes off when its fuse runs out', () => {
  const { w, input } = holding('mines');
  const mine = setMine(w, input);
  w.player.x -= 5;
  assert.ok(!mine.removed && mine.state !== 'exploding', 'still lying there');
  run(w, input, mine.def.bounce.fuse);
  assert.ok(mine.state === 'exploding' || mine.removed, 'gone off');
});

test('a mortar round arcs up and comes down to burst on the floor, well out', () => {
  const TALL = { '.': { floor: 'imp-floor', ceiling: 'imp-ceiling', light: 160, ceilZ: 10 } };
  const long = room(['#'.repeat(32), ...Array(3).fill(`#${'.'.repeat(30)}#`), '#'.repeat(32)], ['', '', ' >'], { legend: TALL });
  const w = makeWorld(long, { noMonsters: true });
  const p = w.player.player;
  p.weapons.add('mortar');
  p.weapon = 'mortar';
  p.ammo.shell = 3;
  const input = mockInput();
  run(w, input, 0.5);
  input.hold('fire');
  run(w, input, 0.05);
  input.release('fire');
  const round = w.things.find((t) => t.def.id === 'mortar-round');
  assert.ok(round, 'fired');
  const startZ = round.z;
  let top = startZ;
  run(w, input, 3, () => {
    if (round.state !== 'exploding') top = Math.max(top, round.z);
  });
  assert.equal(round.state, 'exploding', 'burst');
  assert.ok(top > startZ + 1, `went up (${(top - startZ).toFixed(1)} above the gun)`);
  assert.ok(round.z < w.map.floorAt(round.x, round.y) + 0.5, 'on the floor');
  const out = round.x - w.player.x;
  assert.ok(out > 6, `well out (${out.toFixed(1)} tiles)`);
});

test('key 0 picks the weapon in slot 10', () => {
  const { w, p, input } = holding('blaster');
  const ten = [...w.registry.weapons.values()].find((d) => d.slot === 10);
  assert.ok(ten, 'something in slot 10');
  p.weapons.add(ten.id);
  if (ten.ammo) p.ammo[ten.ammo] = 50;
  input.tap('weapon10');
  run(w, input, 1);
  assert.equal(p.weapon, ten.id);
});
