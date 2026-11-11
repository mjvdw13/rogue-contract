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
  run(w, input, 3, () => shots.length < n);
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
