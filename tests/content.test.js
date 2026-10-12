import test from 'node:test';
import assert from 'node:assert/strict';
import { validateContent } from '../src/engine/validate.js';
import { analyseLevel, ammoBudget } from '../tools/lib/levelcheck.mjs';
import { Game } from '../src/engine/game.js';
import { blockedByMap } from '../src/engine/world/physics.js';
import { registry, makeWorld, mockInput, run } from './helpers.js';

test('the content pack validates without errors', () => {
  const { errors } = validateContent(registry);
  assert.deepEqual(errors, []);
});

test('the episode lists every level once, in order', () => {
  const ep = registry.firstEpisode();
  assert.deepEqual(ep.levels, ['m1']);
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
      // Start deep in the level, next to the enemy farthest from the start,
      // so the shooting wakes the neighbourhood up.
      const far = w.things.filter((t) => t.kind === 'monster').sort((a, b) => b.distanceTo(w.player) - a.distanceTo(w.player))[0];
      const spot = [0, 1, 2, 3, 4, 5, 6, 7]
        .map((k) => [far.x + Math.cos((k * Math.PI) / 4) * 2, far.y + Math.sin((k * Math.PI) / 4) * 2])
        .find(([x, y]) => !blockedByMap(w.map, x, y, w.player.radius) && w.map.floorAt(x, y) === w.map.floorAt(far.x, far.y));
      [w.player.x, w.player.y] = spot ?? [far.x, far.y];
      w.player.z = w.map.floorAt(w.player.x, w.player.y, w.player.radius);
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

test('the garrison is held by stormtroopers, an officer and a probe droid', () => {
  const w = makeWorld('sandbox');
  const ids = w.things.filter((t) => t.kind === 'monster').map((t) => t.def.id);
  for (const id of ['stormtrooper', 'officer', 'probe-droid']) assert.ok(ids.includes(id), `has a ${id}`);
  assert.ok(w.things.every((t) => t.kind !== 'npc'), 'no friendlies (yet)');
});

test('the mercenary cheat gives god mode, every weapon and every keycard', () => {
  const w = makeWorld('sandbox');
  const game = { registry, giveEverything: Game.prototype.giveEverything };
  const p = w.player.player;
  for (let k = 0; k < 2; k++) {
    registry.cheats.find((c) => c.code === 'mercenary').run(game, w);
    assert.equal(p.god, true, 'stays on when typed again');
  }
  assert.deepEqual([...p.weapons].sort(), [...registry.weapons.keys()].sort());
  assert.deepEqual([...p.keys].sort(), ['blue', 'red', 'yellow']);
});
