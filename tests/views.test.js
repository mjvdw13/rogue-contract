import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeAnim } from '../src/engine/defs.js';
import { viewOf } from '../src/engine/things/anim.js';
import { World } from '../src/engine/world/world.js';
import { Rng } from '../src/engine/core/rng.js';
import { registry, room, headlessRenderer } from './helpers.js';

// Characters seen from every side (PLAN.md Phase 1b W): an animation's
// `views` show it from the thing's left, mirrored from its right.

test('viewOf: eight sectors round a thing, mirrored on its right', () => {
  // Facing east; the map's y runs down, so north (its left) is -y.
  const at = (dx, dy, angle = 0) => viewOf(angle, dx, dy);
  assert.equal(at(1, 0), 0, 'in front');
  assert.equal(at(1, -1), 1, 'front left');
  assert.equal(at(0, -1), 2, 'left');
  assert.equal(at(-1, -1), 3, 'back left');
  assert.equal(at(-1, 0), 4, 'behind');
  assert.equal(at(1, 1), -1, 'front right: mirrored');
  assert.equal(at(0, 1), -2, 'right: mirrored');
  assert.equal(at(-1, 1), -3, 'back right: mirrored');
  assert.equal(at(-1, 0.01), 4, 'just right of behind is still the back, unmirrored');
  // Facing south (+y): a viewer to the east is on its left.
  assert.equal(at(1, 0, Math.PI / 2), 2);
  assert.equal(at(0, 1, Math.PI / 2 + 4 * Math.PI), 0, 'any whole turns');
  assert.equal(at(Math.cos(0.3), Math.sin(0.3)), 0, 'within 22.5° of the front');
  assert.equal(at(Math.cos(0.5), -Math.sin(0.5)), 1, 'past 22.5° to the left');
});

test('views: five lists front to back, a missing one from the nearest given', () => {
  const a = normalizeAnim({ frames: [0, 1], views: { side: [2, 3], back: [4, 5] } });
  assert.deepEqual(a.views, [[0, 1], [0, 1], [2, 3], [2, 3], [4, 5]], 'a tie takes the view nearer the front');
  assert.deepEqual(normalizeAnim({ frames: [0], views: { back: 9 } }).views, [[0], [0], [0], [9], [9]]);
  assert.equal(normalizeAnim([0, 1]).views, null);
  assert.throws(() => normalizeAnim({ frames: [0, 1], views: { side: [2] } }), /it needs 2/);
  assert.throws(() => normalizeAnim({ frames: [0], views: { left: [2] } }), /unknown view "left"/);
  assert.throws(() => normalizeAnim({ frames: [0], views: [[1]] }), /must be an object/);
});

test('sprites draw the view the camera sees, mirrored on the right, and the front for a frame past the sheet', async () => {
  const { assets, renderer } = await headlessRenderer();
  const OPEN = ['#############', '#...........#', '#...........#', '#...........#', '#...........#', '#...........#', '#############'];
  const ROOM = { floor: 'imp-floor', ceiling: 'imp-ceiling', ceilZ: 4, light: 200 };
  // A stormtrooper (the placeholder sheet: 12 frames) at (9.5, 3.5), seen from (3.5, 3.5).
  const shot = (angle, setup) => {
    const w = new World({ registry, assets, rng: new Rng(1), settings: { noMonsters: true } }, room(OPEN, ['', ' >'], { legend: { '.': ROOM } }), { skill: 3 });
    const t = w.spawn('stormtrooper', 9.5, 3.5, angle);
    Object.assign(w.player, { x: 3.5, y: 3.5, angle: 0 });
    setup(t);
    renderer.surface.clear(0);
    renderer.render(w, w.camera(), { skip: w.player });
    return Uint8Array.from(renderer.surface.px);
  };
  const plain = (frame, flipX = false) => (t) => Object.assign(t, { anim: null, frame, flipX });
  const viewed = (views) => (t) => Object.assign(t, { anim: normalizeAnim({ frames: [0], views }), animPos: 0, frame: 0 });
  const views = { frontSide: [3], side: [7], backSide: [9], back: [11] };
  assert.notDeepEqual(shot(0, plain(7)), shot(0, plain(0)), '(the frames differ)');
  assert.notDeepEqual(shot(0, plain(7, true)), shot(0, plain(7)), '(and mirror differently)');

  // The camera is west of the trooper.
  assert.deepEqual(shot(Math.PI, viewed(views)), shot(0, plain(0)), 'facing the camera: the front');
  assert.deepEqual(shot(0, viewed(views)), shot(0, plain(11)), 'facing away: the back');
  assert.deepEqual(shot(-Math.PI / 2, viewed(views)), shot(0, plain(7)), 'facing north, its left to the camera: the side');
  assert.deepEqual(shot(Math.PI / 2, viewed(views)), shot(0, plain(7, true)), 'facing south, its right to the camera: the side, mirrored');
  assert.deepEqual(shot(-Math.PI * 0.75, viewed(views)), shot(0, plain(3)), 'facing north-west: the front three-quarter');
  assert.deepEqual(shot(Math.PI * 0.25, viewed(views)), shot(0, plain(9, true)), 'facing south-east: the back three-quarter, mirrored');
  assert.deepEqual(shot(Math.PI / 2, viewed({ side: [40] })), shot(0, plain(0)), 'a view past the sheet: the front frame');
});
