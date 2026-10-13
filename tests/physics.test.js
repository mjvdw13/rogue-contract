import test from 'node:test';
import assert from 'node:assert/strict';
import { castRay, lineOfSight, blockedByMap } from '../src/engine/world/physics.js';
import { buildLevel } from '../src/engine/world/level.js';
import { registry, room } from './helpers.js';

const level = room(
  ['##########', '#........#', '#........#', '####D#####', '#........#', '###u######', '#........#', '##########'],
  ['', ' ^'],
  { legend: { u: { door: 'imp-panel', secret: true }, D: { door: 'imp-door', style: 'slide' } } },
);
const map = () => buildLevel(registry, level, {}).map;

test('rays stop at the first wall', () => {
  const m = map();
  const hit = castRay(m, 1.5, 1.5, 1, 0);
  assert.equal(hit.tx, 9);
  assert.ok(Math.abs(hit.dist - 7.5) < 1e-9);
});

test('closed doors block at their middle, open ones let rays through', () => {
  const m = map();
  const down = castRay(m, 4.5, 1.5, 0, 1);
  assert.ok(down.door, 'hits the door');
  assert.ok(Math.abs(down.dist - 2) < 1e-9, 'panel is at the tile centre (y = 3.5)');
  m.doors[0].open = 1;
  const through = castRay(m, 4.5, 1.5, 0, 1);
  assert.equal(through.door, null);
  assert.equal(through.passedDoor, m.doors[0]);
});

test('rising doors block at their panel, set back in the doorway, until mostly open', () => {
  const m = buildLevel(registry, { ...level, legend: { ...level.legend, D: { door: 'imp-door', style: 'rise' } } }, {}).map;
  const hit = castRay(m, 4.5, 1.5, 0, 1);
  assert.equal(hit.door, m.doors[0]);
  assert.ok(Math.abs(hit.dist - 2) < 1e-9, 'panel in the middle of the doorway, y = 3.5');
  m.doors[0].open = 0.7;
  const through = castRay(m, 4.5, 1.5, 0, 1);
  assert.equal(through.door, null);
  assert.equal(through.passedDoor, m.doors[0]);
});

test('secret doors block flush with the wall face', () => {
  const m = map();
  const hit = castRay(m, 3.5, 4.5, 0, 1);
  assert.equal(hit.door, m.doors[1]);
  assert.ok(Math.abs(hit.dist - 0.5) < 1e-9, 'face at y = 5');
});

test('line of sight and collision boxes', () => {
  const m = map();
  assert.ok(lineOfSight(m, 1.5, 1.5, 8.5, 2.5));
  assert.ok(!lineOfSight(m, 1.5, 1.5, 1.5, 4.5));
  assert.ok(!blockedByMap(m, 1.5, 1.5, 0.25));
  assert.ok(blockedByMap(m, 1.1, 1.5, 0.25), 'touches the west wall');
});
