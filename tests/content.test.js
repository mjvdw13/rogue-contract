import test from 'node:test';
import assert from 'node:assert/strict';
import { validateContent } from '../src/engine/validate.js';
import { analyseLevel, ammoBudget } from '../tools/lib/levelcheck.mjs';
import { Game } from '../src/engine/game.js';
import { blockedByMap } from '../src/engine/world/physics.js';
import { readFileSync } from 'node:fs';
import villagers from '../src/content/npcs/villagers.js';
import { registry, makeWorld, mockInput, room, run } from './helpers.js';

const VILLAGERS = ['villager-boy', 'villager-woman', 'villager-man', 'villager-adventurer', 'villager-wanderer'];

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

test('m1: the overload opens the escape hatch for good', () => {
  const w = makeWorld('m1', { noMonsters: true });
  const i = 43 * w.map.w + 93; // the overload switch
  assert.ok(w.map.uses.has(i));
  w._useSwitch(i, 93, 43);
  run(w, mockInput(), 30);
  const hatch = w.map.doors.filter((d) => d.tag === 'escape');
  assert.ok(hatch.length);
  for (const d of hatch) assert.equal(d.state, 'open');
});

test('the garrison is held by stormtroopers, sandtroopers and their commander, Jawas, an officer and a probe droid', () => {
  const w = makeWorld('sandbox');
  const ids = w.things.filter((t) => t.kind === 'monster').map((t) => t.def.id);
  for (const id of ['stormtrooper', 'sandtrooper', 'sandtrooper-commander', 'jawa', 'officer', 'probe-droid']) assert.ok(ids.includes(id), `has a ${id}`);
  const npcs = w.things.filter((t) => t.kind === 'npc').map((t) => t.def.id);
  assert.deepEqual(npcs.sort(), VILLAGERS.slice().sort(), 'and the villagers stroll about the start room');
});

test('every villager, sandtrooper, commander and Jawa sheet holds all its frames and views, and a villager says a line when used', () => {
  const cut = [...villagers.map((def) => [def, 42]), ...['sandtrooper', 'sandtrooper-commander', 'jawa'].map((id) => [registry.things.get(id), 37])];
  for (const [def, count] of cut) {
    const id = def.id;
    const sheet = registry.sheets.get(def.sheet.ref);
    const png = readFileSync(new URL(`../${sheet.src}`, import.meta.url));
    assert.equal(png.readUInt32BE(16), count * sheet.frameWidth, `${id}: ${count} frames across`);
    assert.equal(png.readUInt32BE(20), sheet.frameHeight, `${id}: one row`);
    const frames = Object.values(def.anims).flatMap((a) => (a.views ? a.views.flat() : a.frames));
    assert.equal(Math.max(...frames), count - 1, `${id}: its animations and views use the whole sheet, and stay on it`);
    assert.ok(def.anims.walk.views && def.anims.idle.views, `${id}: walks and idles from every side`);
  }
  const w = makeWorld(room(['#########', '#.......#', '#.......#', '#.......#', '#########'], ['', '', ' >m']), { noMonsters: true });
  const input = mockInput();
  input.tap('use');
  run(w, input, 0.1);
  const spacer = villagers.find((v) => v.id === 'villager-man');
  const line = w.messages.find((m) => m.startsWith('SPACER: '));
  assert.ok(line && spacer.lines.includes(line.slice(8)), 'the spacer answers');
});

for (const code of ['mercenary', 'raccoon']) {
  test(`the ${code} cheat gives full health, god mode, every weapon and every keycard`, () => {
    const w = makeWorld('sandbox');
    const game = { registry, giveEverything: Game.prototype.giveEverything };
    const p = w.player.player;
    p.health = 12;
    for (let k = 0; k < 2; k++) {
      registry.cheats.find((c) => c.code === code).run(game, w);
      assert.equal(p.god, true, 'stays on when typed again');
    }
    assert.equal(p.health, 100);
    assert.deepEqual([...p.weapons].sort(), [...registry.weapons.keys()].sort());
    assert.deepEqual([...p.keys].sort(), ['blue', 'red', 'yellow']);
    for (const a of registry.ammo.values()) assert.equal(p.ammo[a.id], a.backpackMax);
  });
}
