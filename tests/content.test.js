import test from 'node:test';
import assert from 'node:assert/strict';
import { validateContent } from '../src/engine/validate.js';
import { analyseLevel, ammoBudget } from '../tools/lib/levelcheck.mjs';
import { Game } from '../src/engine/game.js';
import { registry, makeWorld, mockInput, run } from './helpers.js';

test('the content pack validates without errors', () => {
  const { errors } = validateContent(registry);
  assert.deepEqual(errors, []);
});

test('the episode lists every level once, in order', () => {
  const ep = registry.firstEpisode();
  assert.deepEqual(ep.levels, ['e1m1', 'e1m2', 'e1m3', 'e1m4', 'e1m5']);
  assert.ok(ep.finale?.text);
});

for (const level of registry.levels.values()) {
  test(`${level.id}: exit, keys and secrets are reachable on every skill`, () => {
    for (const skill of [1, 3, 5]) {
      const a = analyseLevel(registry, level, skill);
      assert.deepEqual(a.problems, [], `skill ${skill}`);
      assert.ok(a.exit, `skill ${skill}: exit reachable`);
    }
    const a = analyseLevel(registry, level, 3);
    assert.ok(a.counts.secrets >= 1, 'has secrets');
    assert.ok(ammoBudget(registry, a).ratio >= 1.5, 'enough ammo for the monsters');
  });

  test(`${level.id}: simulates a minute of chaos without errors`, () => {
    for (const skill of [1, 5]) {
      const w = makeWorld(level, { skill, seed: 7 });
      // Start deep in the level (by the item farthest from the start) so the
      // shooting wakes the neighbourhood up.
      const far = w.things
        .filter((t) => t.kind === 'item')
        .sort((a, b) => b.distanceTo(w.player) - a.distanceTo(w.player))[0];
      w.player.x = far.x;
      w.player.y = far.y;
      const input = mockInput();
      input.hold('fire');
      input.hold('forward');
      let turns = 0;
      // Monsters go back to sleep if the player dies, so watch the whole run.
      let woke = false;
      run(w, input, 60, (world, frame) => {
        if (frame % 45 === 0) {
          // Wander: turn now and then, open doors in front, keep shooting.
          world.player.angle += 0.9 + (turns++ % 3) * 0.7;
          input.tap('use');
        }
        if (world.player.player.dead) world.player.player.god = true;
        woke ||= world.things.some((t) => t.kind === 'monster' && t.state !== 'idle');
      });
      assert.ok(w.time > 59);
      assert.ok(woke, `skill ${skill}: the noise woke something up`);
    }
  });
}

test('killing the Pumpkin King rolls the finale', () => {
  const w = makeWorld('e1m5');
  const king = w.things.find((t) => t.def.id === 'pumpkin-king');
  w.damage(king, 99999, w.player, w.player);
  assert.equal(w.exitRequested, 'finale');
});

test("the staple gun waits in E1M1's lobby, among the coworkers", () => {
  const w = makeWorld('e1m1');
  const gun = w.things.find((t) => t.def.id === 'pickup-staple-gun');
  assert.ok(gun, 'the staple gun is in E1M1');
  const coworkers = w.things.filter((t) => t.kind === 'npc');
  assert.ok(coworkers.length > 0);
  for (const c of coworkers) assert.ok(Math.hypot(c.x - gun.x, c.y - gun.y) < 8, `${c.def.id} is in the same room`);
});

test('the raccoon cheat gives god mode, every weapon and every badge', () => {
  const w = makeWorld('e1m1');
  const game = { registry, giveEverything: Game.prototype.giveEverything };
  const p = w.player.player;
  for (let k = 0; k < 2; k++) {
    registry.cheats.find((c) => c.code === 'raccoon').run(game, w);
    assert.equal(p.god, true, 'stays on when typed again');
  }
  assert.deepEqual([...p.weapons].sort(), [...registry.weapons.keys()].sort());
  assert.deepEqual([...p.keys].sort(), ['blue', 'red', 'yellow']);
});

test('the conference room ambush opens the closets', () => {
  const w = makeWorld('e1m1');
  const shotgun = w.things.find((t) => t.def.id === 'pickup-tack-shotgun');
  w.player.x = shotgun.x;
  w.player.y = shotgun.y;
  run(w, mockInput(), 0.2);
  assert.ok(w.player.player.weapons.has('tack-shotgun'));
  const closets = w.map.doors.filter((d) => d.tag === 'closets');
  assert.equal(closets.length, 2);
  assert.ok(closets.every((d) => d.state === 'opening' || d.state === 'open'));
});

test('the E1M1 lobby is safe until Alex walks out of it', () => {
  const w = makeWorld('e1m1', { skill: 5 });
  const inLobby = (t) => t.x >= 6 && t.x < 19 && t.y >= 20 && t.y < 37;
  assert.equal(w.things.filter((t) => t.kind === 'monster' && inLobby(t)).length, 0, 'no monsters in the lobby');
  assert.equal(w.things.filter((t) => t.kind === 'npc' && inLobby(t)).length, 5, 'the coworkers are there');
  // Its doors are shut, so shooting in there wakes nobody.
  w.player.x = 12.5;
  w.player.y = 28.5;
  const input = mockInput();
  input.hold('fire');
  run(w, input, 10);
  assert.ok(w.things.filter((t) => t.kind === 'monster').every((t) => t.state === 'idle'));
  assert.ok(!w.messages.some((m) => m.includes('SCREAMING')));
  // Stepping out through the north door starts the night.
  w.player.y = 18.5;
  run(w, mockInput(), 0.1);
  assert.ok(w.messages.some((m) => m.includes('SCREAMING')));
});
