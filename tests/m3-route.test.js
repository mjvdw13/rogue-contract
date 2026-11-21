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
// pressing use until the lift in front of it has come up; 'talk' talks to
// whoever is in front; 'flag=F' waits there until the story flag is set.
const ROUTE = [
  // The hollow, the slot, the ledge over the gulch (jumping its gap), down
  // the steps into the Jawas' scrapyard.
  [196, 126], [184, 123], [177, 128], [172, 134], [166, 139.5], [155, 142], [149.6, 142], [144, 142, 'jump'],
  [136, 141], [126, 139], [120, 140.5], [117, 146], [117, 150],
  // The cave, the squeeze (crouching), out into the burned camp.
  [108, 152], [101, 149.5], [96, 146, 'crouch'], [94, 143], [92, 140], [84, 134], [74, 130], [64, 130], [52, 124], [40, 121], [37, 116],
  // The climb, the high ledge to the notch, over the arch, down into the bowl.
  [36, 112], [34, 104], [38, 96], [52, 94], [66, 95], [80, 93], [92, 89.5], [101, 89.5], [121, 89.5], [125, 89.5], [128, 88], [128, 80],
  [132, 79], [132, 70], [121, 66],
  // The vent, crouching, into maintenance and up lift L1.
  [121, 62, 'crouch'], [121, 51, 'crouch'], [122, 46], [132, 42, 'z=6'],
  // Up the cut, through the excavation and the mess, the bunk room, the corridor.
  [132, 30], [132, 21], [130, 15], [137, 15, 'use'], [137.5, 22], [142, 24.5], [142, 30, 'use'], [142, 36], [142, 41.5, 'use'],
  // The general through the barred window, back to the office (the red key),
  // the red door, the vault's records, detention, Rusk.
  [159, 42], [154, 41.5], [154, 36, 'use'], [154, 41.5], [164.5, 42], [168, 42, 'use'], [170, 38], [172.5, 38.6], [173, 36],
  [173, 30, 'use'], [173, 26], [173, 20, 'use'], [189, 20], [189.5, 14.5, 'use', 'talk'], [189, 20, 'use'],
  // Down the back passage onto the generator's catwalk, down lift L2b, the overload switch.
  [190, 25, 'use'], [190, 47], [190, 51.5, 'use'], [191, 52.6, 'call'], [191, 55, 'z=-6'], [188, 62], [183.6, 66.5], [183.6, 68, 'face=180'],
  // Back up, round the ring to the hatch, the test bay, the blast door, the gantry, the jump, the pad.
  [188, 62], [191, 55, 'z=6'], [194.5, 55], [194.5, 68], [198, 68, 'use'], [210, 72], [211, 82], [211, 88],
  [211, 101.5], [214.6, 101.5], [222, 101.5, 'jump'], [222, 116, 'flag=crow-down'], [227, 102],
];

test('Mission 3 can be walked from the drop-off to the records, Rusk, the overload and the Crow', (t) => {
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
        if (what.includes('talk')) {
          // Face the nearest friendly.
          const them = world.things.filter((q) => !q.removed && q.kind === 'npc').sort((a, b) => Math.hypot(a.x - pt.x, a.y - pt.y) - Math.hypot(b.x - pt.x, b.y - pt.y))[0];
          pt.angle = Math.atan2(them.y - pt.y, them.x - pt.x);
          for (let i = 0; i < 600; i++, ticks++) {
            if (i % 30 === 0) input.tap('use');
            tick();
          }
          break;
        }
        const flag = what.find((w) => w.startsWith('flag='));
        if (flag) {
          for (let i = 0; i < 60 * 60 && !world.flags.has(flag.slice(5)); i++, ticks++) tick();
          assert.ok(world.flags.has(flag.slice(5)), `waited for ${flag.slice(5)}`);
          assert.ok(!world.exitRequested, 'and the level waits for Kyle to reach the pickup');
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
  assert.ok(world.flags.has('records'), 'the records were read');
  assert.ok(world.flags.has('rusk-free'), 'Rusk was spoken to');
  assert.ok(world.flags.has('overload'), 'the generator was overloaded');
  assert.equal(world.exitRequested, 'normal', 'the level ended on the pickup spot');
});
