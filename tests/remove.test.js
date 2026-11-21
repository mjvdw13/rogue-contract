import test from 'node:test';
import assert from 'node:assert/strict';
import content from '../src/content/index.js';
import { Registry } from '../src/engine/registry.js';
import { validateContent } from '../src/engine/validate.js';
import { runActions } from '../src/engine/world/actions.js';
import { makeWorld, room } from './helpers.js';

// A room with two officers, one tagged, and a med kit.
const ROOM = { floor: 'imp-floor', ceiling: 'imp-ceiling', light: 160, ceilZ: 4 };
const level = (extra = {}) =>
  room(['##########', '#........#', '#........#', '#........#', '##########'], ['', '', ' >'], {
    legend: { '.': ROOM },
    list: [
      { type: 'officer', x: 6.5, y: 1.5, tag: 'general' },
      { type: 'officer', x: 7.5, y: 3.5 },
      { type: 'med-kit', x: 4.5, y: 3.5 },
    ],
    ...extra,
  });
const left = (w, id) => w.things.filter((t) => !t.removed && t.def.id === id);

test('remove takes away the placed things with the tag, and nothing else', () => {
  const w = makeWorld(level());
  runActions(w, [{ action: 'remove', tag: 'general' }]);
  assert.equal(left(w, 'officer').length, 1);
  assert.ok(left(w, 'officer')[0].tag !== 'general');
  assert.equal(left(w, 'med-kit').length, 1);
});

test('remove with a thing and no tag takes away every thing of that type', () => {
  const w = makeWorld(level());
  runActions(w, [{ action: 'remove', thing: 'officer' }]);
  assert.equal(left(w, 'officer').length, 0);
  assert.equal(left(w, 'med-kit').length, 1);
});

test('the validator wants a remove to name a tag on placed things, or a type', () => {
  const bad = {
    ...level({ triggers: [{ on: 'start', do: [{ action: 'remove' }, { action: 'remove', tag: 'nobody' }] }] }),
    id: 'bad',
  };
  const { errors } = validateContent(new Registry({ ...content, levels: [bad] }));
  const has = (s) => assert.ok(errors.some((e) => e.includes(s)), `expected "${s}" in ${JSON.stringify(errors)}`);
  has('remove needs a "tag" (placed things) or a "thing" (a type)');
  has('removes things tagged "nobody" but none are placed');
});
