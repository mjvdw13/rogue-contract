import test from 'node:test';
import assert from 'node:assert/strict';
import { makeWorld, mockInput, room, run } from './helpers.js';

// The concussion rifle (PLAN.md Phase 1b AB), after Dark Forces: an unseen,
// fast shot; where it lands, every body in the splash takes the full damage
// and erupts in a `concussion` blast at its feet (`splash.falloff: false`,
// `splash.erupt`), and one more goes up where it struck a wall or floor.

const TALL = { '.': { floor: 'imp-floor', ceiling: 'imp-ceiling', light: 160, ceilZ: 8 } };
const hall = () => room(['##############', '#............#', '#............#', '#............#', '##############'], ['', '', ' >'], { legend: TALL });

/** A world that notes the explosions set off, in `w.blasts`, with where each body stood then. */
function world() {
  const w = makeWorld(hall(), { noMonsters: true });
  w.blasts = [];
  const explode = w.explode.bind(w);
  w.explode = (id, x, y, z, opts) => {
    w.blasts.push({ id, x, y, z, at: new Map(w.things.map((t) => [t, [t.x, t.y]])) });
    return explode(id, x, y, z, opts);
  };
  return w;
}

/** Fire one from the player, level from 1 above the floor. */
const shoot = (w, angle = 0) => w.spawnProjectile('concussion-shot', w.player, angle, {}, { z: 1, slope: 0 });

test('the shot flies unseen and fast', () => {
  const w = world();
  const p = shoot(w);
  const x0 = p.x;
  assert.equal(p.sheet, null, 'no sprite');
  run(w, mockInput(), 0.1);
  assert.ok(Math.abs(p.x - x0 - 5.5) < 0.2, `55 tiles a second (${((p.x - x0) * 10).toFixed(1)})`);
});

test('off a wall: everyone in the splash takes the same damage and erupts at their feet, and one more blast goes up there', () => {
  const w = world();
  // Beside the shot's path (not hit by it), near the far wall and further off; one out of reach.
  const near = w.spawn('bossk', 11.5, 1.4, Math.PI);
  const mid = w.spawn('bossk', 9.5, 3.6, Math.PI);
  const far = w.spawn('bossk', 5.5, 1.5, Math.PI);
  const hp = near.health;
  shoot(w);
  run(w, mockInput(), 0.4);
  const { damage } = w.registry.things.get('concussion-shot').splash;
  assert.equal(hp - near.health, damage, 'the full damage near the blast');
  assert.equal(hp - mid.health, damage, 'and the same further off');
  assert.equal(far.health, hp, 'none out of reach');
  const conc = w.blasts.filter((b) => b.id === 'concussion');
  assert.equal(conc.length, 3, 'one at each body and one where it struck');
  const under = (b, t) => b.x === b.at.get(t)[0] && b.y === b.at.get(t)[1] && b.z === 0;
  for (const t of [near, mid]) assert.ok(conc.some((b) => under(b, t)), 'under each of them, on the floor');
  const wall = conc.find((b) => b.x > 12);
  assert.ok(wall && wall.z === 0, 'by the wall, on the floor below where it struck');
});

test('on a body: no blast where it struck, only the body erupting', () => {
  const w = world();
  const bossk = w.spawn('bossk', 6.5, 2.5, Math.PI);
  shoot(w);
  run(w, mockInput(), 0.3);
  assert.ok(bossk.health < bossk.def.health, 'hurt');
  const conc = w.blasts.filter((b) => b.id === 'concussion');
  assert.equal(conc.length, 1);
  const [x, y] = conc[0].at.get(bossk);
  assert.ok(conc[0].x === x && conc[0].y === y && conc[0].z === 0, 'at its feet');
});

test('fired at a wall up close, it hurts you too', () => {
  const w = world();
  const health = w.player.player.health;
  shoot(w, Math.PI);
  run(w, mockInput(), 0.2);
  assert.ok(w.player.player.health < health, `${health} to ${w.player.player.health}`);
});

test('the rifle fires one shot for four energy, and slowly', () => {
  const w = world();
  const p = w.player.player;
  p.weapons.add('concussion-rifle');
  p.weapon = 'concussion-rifle';
  p.ammo.energy = 20;
  const input = mockInput();
  run(w, input, 0.5); // raised
  input.hold('fire');
  run(w, input, 0.5);
  assert.equal(p.ammo.energy, 16, 'one shot in the first half second');
  run(w, input, 0.4);
  assert.equal(p.ammo.energy, 12, 'the next after 0.8 s');
});

test('Bossk drops his rifle', () => {
  const w = world();
  const bossk = w.spawn('bossk', 6.5, 2.5, Math.PI);
  w.damage(bossk, 1000, null, w.player);
  run(w, mockInput(), 2);
  assert.ok(w.things.some((t) => t.def.id === 'concussion-rifle' && !t.removed));
});

test("Bossk's shot does the same to you", () => {
  const w = world();
  const bossk = w.spawn('bossk', 9.5, 2.5, Math.PI);
  const health = w.player.player.health;
  w.spawnProjectile('concussion-shot', bossk, Math.PI, {}, { z: 1, slope: 0 });
  run(w, mockInput(), 0.3);
  assert.ok(w.player.player.health < health, 'hurt');
  const [x, y] = w.blasts[0].at.get(w.player);
  assert.ok(w.blasts.some((b) => b.id === 'concussion' && b.x === x && b.y === y), 'erupting at your feet');
});
