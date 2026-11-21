import test from 'node:test';
import assert from 'node:assert/strict';
import { contentAngle } from '../src/engine/world/level.js';
import { makeWorld, mockInput } from './helpers.js';

// Mission 3's route, walked (as Missions 4 and 5's are): the validator says
// every place can be reached, but not that a body fits through the vent, up
// a stair or over the chasm. The time it takes is reported (the level's
// length at a walk, with no fights).
//
// Each waypoint is [x, y, ...what]: 'use' taps use on the way there (doors,
// calling lifts); 'z=N' waits there until the floor is at N (lifts);
// 'face=A' turns to A degrees there and uses (switches); 'crouch' goes
// there crouching; 'jump' jumps on setting off; 'call' stands there
// pressing use until the lift in front of it has come up.
const ROUTE = [
  // The start bowl, the gorge under the arch, the bowl under the garrison.
  [18, 82], [23, 72], [24, 62], [30, 51], [33, 42.5],
  // The vent, crouching, into maintenance and up lift L1.
  [33, 38, 'crouch'], [33, 27, 'crouch'], [34, 22], [44, 18, 'z=6'],
  // The barracks corridor, the office (the red key), the red door, the vault.
  [48, 17.5], [66, 17.5], [66, 12, 'use'], [66, 17.5], [76.5, 18], [80, 18, 'use'], [83, 20],
  // Out onto the generator's catwalk, down lift L2b, the overload switch.
  [85, 27.5, 'use'], [103, 27.5], [103, 28.6, 'call'], [103, 31, 'z=-6'], [100, 38], [95.6, 42.5], [95.6, 44, 'face=180'],
  // Back up, round the ring to the escape hatch, the gantry, the jump, the pad.
  [100, 38], [103, 31, 'z=6'], [106.5, 31], [106.5, 44], [109.5, 44, 'use'], [117.6, 44], [124, 45, 'jump'],
];

test('Mission 3 can be walked from the canyon to the overload and the pad', (t) => {
  const world = makeWorld('m3', { noMonsters: true });
  const input = mockInput();
  const pt = world.player;
  // The officer, who carries it, isn't there.
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
        if (what.includes('call')) {
          for (let i = 0; i < 6 * 60; i++, ticks++) {
            if (i % 20 === 0) input.tap('use');
            tick();
          }
          break;
        }
        if (!lift || Math.abs(pt.z - Number(lift.slice(2))) < 0.05) break;
      }
      tick();
      ticks++;
      if (world.exitRequested) break;
      assert.ok(pt.health > 0, `died on the way to ${x}, ${y} (at ${pt.x.toFixed(1)}, ${pt.y.toFixed(1)}, z ${pt.z.toFixed(1)})`);
      assert.ok(ticks - started < 40 * 60, `stuck on the way to ${x}, ${y} (at ${pt.x.toFixed(1)}, ${pt.y.toFixed(1)}, z ${pt.z.toFixed(1)})`);
    }
    input.release('forward');
    input.release('crouch');
  }
  t.diagnostic(`the route takes ${(ticks / 60).toFixed(0)} s at a walk`);
  assert.equal(world.exitRequested, 'normal', 'the level ended on the pickup spot');
});
