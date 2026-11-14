import test from 'node:test';
import assert from 'node:assert/strict';
import { contentAngle } from '../src/engine/world/level.js';
import { makeWorld, mockInput } from './helpers.js';

// Mission 5's route, walked (as Mission 4's is): the validator says every
// place can be reached, but not that a body fits up a stair, under a pipe
// or through a door.
//
// Each waypoint is [x, y, ...what]: 'use' taps use on the way there (doors);
// 'z=N' waits there until the floor is at N (lifts); 'face=A' turns to A
// degrees there and uses (switches); 'crouch' goes there crouching; 'jump'
// jumps on setting off.
const ROUTE = [
  // The pier, the arch, the Bottoms: north, the slant, east to the pump house.
  [25, 100], [25, 90], [25, 70], [28, 66], [45, 59], [60, 51], [94, 51], [99.5, 51, 'use'],
  // Up the walk to the sluice's switch, and back down.
  [99.5, 50], [99.5, 41.5], [120, 41.5], [122.5, 45], [122.5, 57.2, 'face=270'],
  [122.5, 45], [120, 41.5], [99.5, 41.5], [99.5, 50], [102, 51],
  // The stairs down, the sluice door, the gallery, the crouch under the pipe.
  [125, 49], [141, 49], [146, 49, 'use'], [150, 53], [150, 61], [150, 69, 'crouch'], [150, 78],
  // Up through the freighter's deck and out of its stern hatch.
  [151, 79.5], [150.6, 81], [161, 81], [163, 83.5], [168.5, 83.5, 'use'],
  // The cutting floor, the hauler's hold, the bulkhead, the reactor's switch.
  [172, 78], [204, 78], [210, 76], [213, 76], [239, 76], [243.5, 76, 'use'], [243.5, 84.5], [251, 85.2, 'face=270'],
  // Back through the hold to the lift, the crew deck, the way aft, the stair, the bridge.
  [243.5, 84.5], [243.5, 76], [238, 76, 'use'], [213, 76], [210, 76, 'z=6'], [214, 78.5], [233.5, 78.5], [236, 70],
  [236, 64, 'use'], [244, 64, 'use'], [257, 64], [257, 70, 'use'], [254, 80],
  // The gangway, the crane way and its gap, the cab, its lift down.
  [254, 94], [257, 98], [275.3, 98], [282, 98, 'jump', 'z=12'], [296, 98], [302, 98], [302, 94], [302, 90, 'z=0'], [306, 90],
  // The dock: down the west terraces' flights, across the floor to the red door.
  [310, 101], [313, 101], [313, 95], [313, 67], [315, 66.5], [315, 60.8], [317, 61], [317, 93], [319, 93.5], [319, 99],
  [322.5, 99], [323, 62], [327, 61.5], [327, 56, 'use'],
  // The manifest, the lift, the apron, the Crow's spot.
  [326, 46.7, 'face=90'], [332, 44, 'z=0'], [332, 38], [328, 29],
];

test('Mission 5 can be walked from the pier to the manifest and the apron', () => {
  const world = makeWorld('m5', { noMonsters: true });
  const input = mockInput();
  const pt = world.player;
  // The squad the reactor brings isn't the route's business.
  pt.health = 1e6;
  // The dock officer, who carries it, isn't there.
  pt.player.keys.add('red');
  const dt = 1 / 60;
  const tick = () => {
    world.tick(dt, input);
    input.endFrame();
  };
  let ticks = 0;
  for (const [x, y, ...what] of ROUTE) {
    if (world.exitRequested) break;
    const lift = what.find((w) => w.startsWith('z='));
    const face = what.find((w) => w.startsWith('face='));
    const started = ticks;
    if (what.includes('crouch')) input.hold('crouch');
    let jump = what.includes('jump');
    for (;;) {
      const dx = x - pt.x;
      const dy = y - pt.y;
      if (Math.hypot(dx, dy) > 0.35) {
        pt.angle = Math.atan2(dy, dx);
        input.hold('forward');
        if (jump) input.tap('jump');
        jump = false;
        if (what.includes('use') && ticks % 20 === 0) input.tap('use');
      } else {
        input.release('forward');
        if (face) {
          pt.angle = contentAngle(Number(face.slice(5)));
          input.tap('use');
          tick();
          break;
        }
        if (!lift || Math.abs(pt.z - Number(lift.slice(2))) < 0.05) break;
      }
      tick();
      ticks++;
      if (world.exitRequested) break;
      assert.ok(ticks - started < 40 * 60, `stuck on the way to ${x}, ${y} (at ${pt.x.toFixed(1)}, ${pt.y.toFixed(1)}, z ${pt.z.toFixed(1)})`);
    }
    input.release('forward');
    input.release('crouch');
  }
  assert.ok(world.flags.has('power'), 'the reactor was started');
  assert.ok(world.flags.has('manifest'), 'the manifest was taken');
  assert.equal(world.exitRequested, 'normal', 'the level ended');
});
