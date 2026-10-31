import test from 'node:test';
import assert from 'node:assert/strict';
import { pushable } from '../src/engine/things/push.js';
import content from '../src/content/index.js';
import { Registry } from '../src/engine/registry.js';
import { validateContent } from '../src/engine/validate.js';
import { makeWorld, mockInput, room, run } from './helpers.js';

// A long hall, the player at its west end facing east.
const HALL = [
  '##################################',
  '#................................#',
  '#................................#',
  '#................................#',
  '#................................#',
  '#................................#',
  '#................................#',
  '#................................#',
  '##################################',
];
const hall = (list) => ({ ...room(HALL, []), list: [{ type: 'player', x: 2.5, y: 4.5, angle: 0 }, ...list] });

/** Hold forward for `seconds`, then let go. */
function walkInto(w, seconds, each) {
  const input = mockInput();
  input.hold('forward');
  run(w, input, seconds, each);
  input.release('forward');
  return input;
}

test('keep walking into a villager and they give way slowly, stepping back on their walk', () => {
  const w = makeWorld(hall([{ type: 'villager-man', x: 5.5, y: 4.5, angle: 270, wander: 0 }]));
  const man = w.things.find((t) => t.kind === 'npc');
  let walking = false;
  let facing = true;
  const input = walkInto(w, 4, () => {
    if (man.x - 5.5 < 0.5) return;
    walking ||= man.animName === 'walk';
    facing &&= Math.abs(Math.abs(man.angle) - Math.PI) < 0.2;
  });
  const pushed = man.x - 5.5;
  assert.ok(pushed > 1, `he gave way (${pushed.toFixed(2)} tiles)`);
  assert.ok(pushed < 4 * w.player.player.hero.walkSpeed * 0.5, 'slower than the player walks');
  assert.ok(w.player.x < man.x - man.radius, 'the player follows behind, not through him');
  assert.ok(man.x - w.player.x < man.radius + w.player.radius + 0.2, 'and stays against him');
  assert.ok(walking, 'he walks while pushed');
  assert.ok(facing, 'facing the player, stepping back');
  run(w, input, 1);
  const x = man.x;
  run(w, input, 2);
  assert.equal(man.x, x, 'let go, he stays where he was pushed');
  assert.notEqual(man.animName, 'walk', 'and stands');
});

test('pushed off-centre, someone steps aside out of the way', () => {
  const w = makeWorld(hall([{ type: 'villager-woman', x: 6.5, y: 4.8, angle: 180, wander: 0 }]));
  const woman = w.things.find((t) => t.kind === 'npc');
  walkInto(w, 6);
  assert.ok(woman.y > 4.9, `she moved aside (y ${woman.y.toFixed(2)})`);
  assert.ok(w.player.x > woman.x + 1, 'and the player got past her');
});

test('a wall stops someone being pushed, and the player stops too', () => {
  const w = makeWorld(hall([{ type: 'villager-man', x: 31.6, y: 4.5, wander: 0 }]));
  const man = w.things.find((t) => t.kind === 'npc');
  w.player.x = 29.5;
  walkInto(w, 3);
  assert.ok(man.x + man.radius <= 33 + 1e-9, 'he is not pushed into the wall');
  assert.ok(w.player.x < man.x - man.radius, 'the player is still behind him');
});

test('a calm trooper gives way too, a light Jawa quicker, and nobody once the town turns', () => {
  const pushFor = (type) => {
    const w = makeWorld(hall([{ type, x: 5.5, y: 4.5, angle: 180, calm: { wander: 0 } }]));
    const m = w.things.find((t) => t.kind === 'monster');
    walkInto(w, 3);
    return m.x - 5.5;
  };
  const trooper = pushFor('sandtrooper');
  const jawa = pushFor('jawa');
  assert.ok(trooper > 0.8, `the trooper gave way (${trooper.toFixed(2)})`);
  assert.ok(jawa > trooper, `the Jawa more (${jawa.toFixed(2)})`);

  const w = makeWorld(hall([{ type: 'sandtrooper', x: 5.5, y: 4.5, calm: { wander: 0 } }]));
  const m = w.things.find((t) => t.kind === 'monster');
  assert.ok(pushable(m));
  w.turnHostile();
  assert.ok(!pushable(m), 'a hostile trooper stands its ground');
});

test('a stroller pushed out of its area walks back into it', () => {
  const w = makeWorld(hall([{ type: 'villager-man', x: 5.5, y: 4.5, angle: 180, wander: 1 }]));
  const man = w.things.find((t) => t.kind === 'npc');
  const inside = () => man.area.has(w.map.index(Math.floor(man.x), Math.floor(man.y)));
  walkInto(w, 5);
  assert.ok(!inside(), `pushed out to ${man.x.toFixed(2)}`);
  w.player.x = 30.5;
  run(w, mockInput(), 40);
  assert.ok(inside(), `and back at ${man.x.toFixed(2)}, ${man.y.toFixed(2)}`);
});

test("the validator checks the hero's body fields", () => {
  const hero = { ...content.hero, body: { pushSpeed: -1, pushDelay: '0.3', shove: 2, stepHeight: 0.8 } };
  const { errors } = validateContent(new Registry({ ...content, hero, levels: [] }));
  assert.deepEqual(errors.filter((e) => e.startsWith('hero:')), [
    'hero: body.pushSpeed must be a number, 0 or more',
    'hero: body.pushDelay must be a number, 0 or more',
    'hero: unknown body field "shove"',
  ]);
});
