import test from 'node:test';
import assert from 'node:assert/strict';
import { runActions } from '../src/engine/world/actions.js';
import { makeWorld, mockInput, run } from './helpers.js';

// Mission 4's last fight: switching the tractor beam off sends a squad into
// Docking Bay 326, where they wait for Kyle to come back over the gantry.

const inBay = (t) => t.kind === 'monster' && !t.dead && t.x > 16 && t.x < 80 && t.y > 56 && t.y < 100;

test('Mission 4: the beam going down sends a squad into the bay to wait, and they fight once Kyle is over it', () => {
  const w = makeWorld('m4', { skill: 3 });
  const pt = w.player;
  pt.player.notarget = true;
  pt.player.god = true;
  // At the terminal on the column, far from the bay.
  Object.assign(pt, { x: 178, y: 128.2, z: 0 });
  const before = w.things.filter(inBay).length;
  const terminal = [...w.map.uses.values()].find((u) => u.actions.some((a) => a.action === 'setFlag' && a.flag === 'beam-off'));
  runActions(w, terminal.actions);
  const squad = w.things.filter(inBay);
  assert.ok(squad.length - before >= 8, `a squad in the bay (${squad.length - before} came)`);
  run(w, mockInput(), 5);
  assert.ok(squad.every((m) => m.state === 'idle'), 'they wait there, rather than coming for him');
  // Out onto the gantry over the bay.
  pt.player.notarget = false;
  Object.assign(pt, { x: 46, y: 102, z: 8 });
  run(w, mockInput(), 2);
  const awake = squad.filter((m) => m.state !== 'idle').length;
  assert.ok(awake >= squad.length / 2, `most of them see him (${awake} of ${squad.length})`);
});
