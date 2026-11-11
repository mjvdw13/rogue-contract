import test from 'node:test';
import assert from 'node:assert/strict';
import { contentAngle } from '../src/engine/world/level.js';
import { makeWorld, mockInput } from './helpers.js';

// Mission 4's route, walked: the validator says every place can be reached,
// but not that a body fits (the waste chute's roof once caught your head on
// every step) or that a ledge is wide enough to turn a corner on.
//
// Each waypoint is [x, y, ...what]: 'use' taps use on the way there (doors);
// 'z=N' waits there until the floor is at N (lifts); 'face=A' turns to A
// degrees there and uses (switches); 'talk' talks to whoever is in front.
const ROUTE = [
  // The hangar, the lobby, the lift up, the control room's terminal.
  [77, 100], [84, 100, 'use'], [88, 97], [88, 92, 'z=8'], [88, 87], [96.6, 77, 'face=0'],
  // Down, the ring corridor, the hub, the lift to detention.
  [88, 87], [88, 92, 'z=0'], [88, 97], [98, 100], [104, 100, 'use'], [124, 100], [146, 80], [156, 80], [163, 80, 'use'],
  [165, 75], [170, 73], [170, 66, 'use', 'z=12'], [170, 60, 'use'], [170, 46], [170, 40, 'use'], [170, 16],
  // Rusk's cell, then the chute, the compactor, maintenance, the pump room's switch.
  [168, 16], [164.6, 16, 'use', 'talk'],
  [170, 16, 'use'], [170, 13], [170, 5, 'use'], [172, 5], [187, 5], [197, 26], [197, 31, 'use'], [197, 46], [197, 62], [197, 68, 'use'],
  [203.2, 78, 'face=0'],
  // The shaft: over the bridge, round the column to the terminal, and back.
  [195, 88], [195, 94, 'use'], [195, 102], [178, 102], [178, 116.5], [172.5, 116.5], [172.5, 127.5], [178, 127.3, 'face=90'],
  [172.5, 127.5], [172.5, 116.5], [178, 116.5], [178, 102], [158, 102], [158, 122],
  // The unfinished sector, the gantry, its lift, the Crow.
  [150, 122, 'use'], [146, 116], [130, 116], [130, 132], [118, 132], [116, 123],
  [104, 123], [99.5, 116], [80, 116], [74, 116, 'use'], [46, 116], [46, 110], [46, 102, 'use'], [26, 102], [22, 102, 'z=0'], [22, 96], [40, 80],
];

test('Mission 4 can be walked from the hangar to Rusk, the beam and back to the Crow', () => {
  const world = makeWorld('m4', { noMonsters: true });
  const input = mockInput();
  const pt = world.player;
  // The detention officer, who carries it, isn't there.
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
    for (;;) {
      const dx = x - pt.x;
      const dy = y - pt.y;
      if (Math.hypot(dx, dy) > 0.35) {
        pt.angle = Math.atan2(dy, dx);
        input.hold('forward');
        if (what.includes('use') && ticks % 20 === 0) input.tap('use');
      } else {
        input.release('forward');
        if (face) {
          pt.angle = contentAngle(Number(face.slice(5)));
          input.tap('use');
          tick();
          break;
        }
        if (what.includes('talk')) {
          for (let i = 0; i < 600; i++, ticks++) {
            if (i % 30 === 0) input.tap('use');
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
  }
  assert.ok(world.flags.has('rusk-free'), 'Rusk was spoken to');
  assert.ok(world.flags.has('beam-off'), 'the beam was cut');
  assert.equal(world.exitRequested, 'normal', 'the level ended under the Crow');
});
