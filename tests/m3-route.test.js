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
  // The drop-off, west along the wash, up the slot canyon to the burned camp.
  [176, 138], [156, 152], [134, 160], [114, 158], [100, 155.5], [88, 147], [90, 137], [80, 129], [68, 127],
  [54, 131], [40, 124], [36, 116],
  // The scout post: up the neck, into the bunker, its switch, out through the gate.
  [35, 108], [37.5, 104], [42, 104, 'use'], [51, 104, 'face=0'], [42, 104], [37, 104], [35, 100], [35, 93],
  // Across the range, up the ledge path, over the arch, down into the bowl.
  [86, 37], [90, 38], [90, 47], [90, 61], [90, 89.5], [101, 89.5], [121, 89.5], [125, 89.5], [128, 88], [128, 80],
  [132, 79], [132, 70], [121, 66],
  // The vent, crouching, into maintenance and up lift L1.
  [121, 62, 'crouch'], [121, 51, 'crouch'], [122, 46], [132, 42, 'z=6'],
  // The barracks corridor, the office (the red key), the red door, the vault.
  [136, 41.5], [154, 41.5], [154, 36, 'use'], [154, 41.5], [164.5, 42], [168, 42, 'use'], [171, 44],
  // Out onto the generator's catwalk, down lift L2b, the overload switch.
  [173, 51.5, 'use'], [191, 51.5], [191, 52.6, 'call'], [191, 55, 'z=-6'], [188, 62], [183.6, 66.5], [183.6, 68, 'face=180'],
  // Back up, round the ring to the escape hatch, the gantry, the jump, the pad.
  [188, 62], [191, 55, 'z=6'], [194.5, 55], [194.5, 68], [197.5, 68, 'use'], [205.6, 68], [212, 69, 'jump'],
];

test('Mission 3 can be walked from the drop-off to the overload and the pad', (t) => {
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
