import test from 'node:test';
import assert from 'node:assert/strict';
import content from '../src/content/index.js';
import { Registry } from '../src/engine/registry.js';
import { defineLevel } from '../src/engine/defs.js';
import { validateContent } from '../src/engine/validate.js';
import { LevelScene } from '../src/engine/scenes/level.js';
import { Hud } from '../src/engine/ui/hud.js';
import { Rng } from '../src/engine/core/rng.js';
import { makeWorld, mockInput, registry, room, run } from './helpers.js';

// A small hall, the player at its west end facing east, someone 2 tiles in front.
const HALL = ['##########', ...Array(5).fill('#........#'), '##########'];
const hall = (list, extra = {}) => ({ ...room(HALL, []), list: [{ type: 'player', x: 2.5, y: 3.5, angle: 0 }, ...list], ...extra });
const said = (w) => w.messages.filter((m) => m.includes(': '));

/** Press use on whoever stands in front, then let a moment pass. */
function talk(w) {
  w.use(w.player);
  run(w, mockInput(), 0.5);
}

test('a conversation moves on one line per use and stays on its last', () => {
  const w = makeWorld(hall([{ type: 'villager-man', x: 4.5, y: 3.5, wander: 0, name: 'BROKER', talk: ['Sit.', 'The job is Rusk.', 'Go.'] }]));
  for (let i = 0; i < 5; i++) talk(w);
  assert.deepEqual(said(w), ['BROKER: Sit.', 'BROKER: The job is Rusk.', 'BROKER: Go.', 'BROKER: Go.', 'BROKER: Go.']);
});

test('bumping into someone repeats what they last said, without moving on', () => {
  const w = makeWorld(hall([{ type: 'villager-man', x: 4.5, y: 3.5, wander: 0, talk: ['One.', 'Two.'] }]));
  const man = w.things.find((t) => t.kind === 'npc');
  w.playerBumped = man;
  run(w, mockInput(), 3);
  assert.deepEqual(said(w), [], 'nothing said yet, so nothing to repeat');
  talk(w);
  run(w, mockInput(), 3);
  w.playerBumped = man;
  run(w, mockInput(), 0.5);
  talk(w);
  assert.deepEqual(said(w), ['SPACER: One.', 'SPACER: One.', 'SPACER: Two.']);
});

test('the player talks across a table, to the nearest of two in line', () => {
  // Three and a half tiles off, past the reach of doors and switches (2.6).
  const across = makeWorld(hall([{ type: 'villager-man', x: 6.5, y: 3.5, wander: 0, name: 'BARTENDER', talk: ['What?'] }]));
  talk(across);
  assert.deepEqual(said(across), ['BARTENDER: What?']);

  const w = makeWorld(
    hall([
      { type: 'villager-man', x: 4.5, y: 3.5, wander: 0, name: 'NEAR', talk: ['Me.'] },
      { type: 'villager-man', x: 6.5, y: 3.5, wander: 0, name: 'FAR', talk: ['Not me.'] },
    ]),
  );
  // Far first in the list, so the order of the things isn't what picks.
  w.things.reverse();
  talk(w);
  assert.deepEqual(said(w), ['NEAR: Me.']);
});

test('story flags pick the branch, and a branch sets its flag on its last line', () => {
  const w = makeWorld(
    hall(
      [
        { type: 'villager-man', x: 4.5, y: 3.5, wander: 0, tag: 'broker', talk: [{ unless: 'met', lines: ['Hello.', 'Here is the job.'], set: 'met' }, { lines: ['Get going.'] }] },
      ],
      {
        triggers: [
          { on: 'talk', tag: 'broker', if: 'met', do: [{ action: 'message', text: 'GOT THE FOB.' }] },
          { on: 'talk', tag: 'broker', once: false, do: [{ action: 'setFlag', flag: 'spoke' }] },
        ],
      },
    ),
  );
  talk(w);
  assert.ok(w.flags.has('spoke'), 'a talk trigger runs on use');
  assert.ok(!w.flags.has('met'));
  assert.ok(!w.messages.includes('GOT THE FOB.'), 'the flagged trigger waits, still armed');
  talk(w);
  assert.ok(w.flags.has('met'), 'the last line of the first branch set its flag');
  talk(w);
  talk(w);
  assert.deepEqual(said(w), ['SPACER: Hello.', 'SPACER: Here is the job.', 'SPACER: Get going.', 'SPACER: Get going.']);
  assert.equal(w.messages.filter((m) => m === 'GOT THE FOB.').length, 1, 'it fired once its flag was set, and only once');
});

test('setFlag with value false clears a flag, and unless reads it', () => {
  const w = makeWorld(
    hall([], {
      triggers: [
        { on: 'start', do: [{ action: 'setFlag', flag: 'shut' }, { action: 'setFlag', flag: 'shut', value: false }] },
        { on: 'start', unless: 'shut', do: [{ action: 'message', text: 'OPEN.' }] },
      ],
    }),
  );
  assert.ok(!w.flags.has('shut'));
  assert.ok(w.messages.includes('OPEN.'));
});

test('a calm trooper talks under its placement name, and stops when the town turns', () => {
  const w = makeWorld(
    hall([{ type: 'sandtrooper', x: 4.5, y: 3.5, angle: 180, name: 'Officer', calm: { wander: 0 }, talk: ['Papers.'] }], {
      triggers: [{ on: 'talk', thing: 'sandtrooper', do: ['hostile'] }],
    }),
  );
  talk(w);
  assert.deepEqual(said(w), ['OFFICER: Papers.']);
  assert.ok(w.hostile, 'the talk trigger turned the town');
  talk(w);
  assert.deepEqual(said(w), ['OFFICER: Papers.'], 'a hostile trooper has nothing more to say');
});

test('the validator checks conversations, flags and talk triggers', () => {
  const level = defineLevel({
    ...hall(
      [
        { type: 'villager-man', x: 3.5, y: 2.5, talk: [{ lines: ['Hi.'], when: 'now' }] },
        { type: 'villager-man', x: 5.5, y: 2.5, talk: ['Hi.', { lines: ['Bye.'] }] },
        { type: 'villager-man', x: 7.5, y: 2.5, talk: [{ if: 'never', lines: [] }] },
        { type: 'sandtrooper', x: 3.5, y: 5.5, talk: ['Halt.'] },
        { type: 'villager-man', x: 5.5, y: 5.5, name: '' },
      ],
      {
        triggers: [
          { on: 'talk', tag: 'nobody', do: [] },
          { on: 'talk', do: [] },
          { on: 'start', if: 'missing', do: [{ action: 'setFlag' }] },
        ],
      },
    ),
    id: 'bad',
  });
  const { errors } = validateContent(new Registry({ ...content, levels: [level] }));
  assert.deepEqual(errors.filter((e) => /talk|flag|name/.test(e)), [
    'Level "bad": a villager-man at (3.5, 2.5): talk branch 1 has unknown field "when" (it takes if, unless, lines, set)',
    'Level "bad": a villager-man at (5.5, 2.5): "talk" is either all lines or all branches like { if, lines }, not a mix',
    'Level "bad": a villager-man at (7.5, 2.5): talk branch 1 needs "lines", a list of one or more strings',
    'Level "bad": a sandtrooper at (3.5, 5.5) has "talk", which only friendlies and calm monsters take',
    'Level "bad": a villager-man at (5.5, 5.5): "name" must be a name to speak under',
    'Level "bad": trigger #1 listens for talk from "nobody" but nothing placed has that tag',
    'Level "bad": trigger #2 listens for talk but names no "thing" or "tag"',
    'Level "bad": trigger #3 sets a flag but has no "flag" name',
    'Level "bad": a villager-man at (7.5, 2.5): talk branch 1 waits for flag "never", which nothing in the level sets (a setFlag action, or a talk branch\'s "set")',
    'Level "bad": trigger #3 waits for flag "missing", which nothing in the level sets (a setFlag action, or a talk branch\'s "set")',
  ]);
});

test("a level's start trigger has its say on screen when the level begins", () => {
  const game = { registry, rng: new Rng(1), debug: {}, settings: { messages: true }, playMusic() {} };
  game.hud = new Hud(game);
  game.hud.message('LEFT OVER FROM THE LAST LEVEL');
  const level = hall([], { triggers: [{ on: 'start', do: [{ action: 'message', text: 'JAN: THE CANTINA.' }] }] });
  new LevelScene(game, { level, skill: 3 }).enter();
  assert.deepEqual(game.hud.messages.map((m) => m.text), ['JAN: THE CANTINA.']);
});
