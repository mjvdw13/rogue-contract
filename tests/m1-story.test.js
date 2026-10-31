import test from 'node:test';
import assert from 'node:assert/strict';
import { makeWorld, mockInput, run } from './helpers.js';

// Mos Eisley's calm half in order: the broker's fob, the trader's signal,
// then the informant's pass. Before the signal the checkpoint and the hold
// stay shut, so the roofs or the gate can't find Rusk first.

/** Stand the player at (x, y) facing `angle` (content degrees), press use, let a moment pass. */
function talk(w, x, y, angle) {
  Object.assign(w.player, { x, y, angle: (-angle * Math.PI) / 180 });
  run(w, mockInput(), 0.1);
  w.use(w.player);
  run(w, mockInput(), 0.5);
}
const door = (w, tag) => w.map.doors.find((d) => d.tag === tag);
const shut = (w, tag) => door(w, tag).state === 'closed';
const said = (w, who) => w.messages.filter((m) => m.startsWith(`${who}: `));

test('in Mos Eisley the informant has no pass, and the hold stays shut, until the trader keys in the signal', () => {
  const w = makeWorld('m1');
  const informant = () => talk(w, 141.5, 55.5, 0);
  const trader = () => talk(w, 70.5, 37.5, 90);
  const broker = () => talk(w, 92, 104.6, 270);

  for (let i = 0; i < 3; i++) informant();
  assert.ok(!w.flags.has('pass') && shut(w, 'checkpoint'), 'the informant sends Kyle away');
  trader();
  assert.ok(!w.flags.has('signal'), 'the trader has nothing for him without the contract');
  assert.ok(shut(w, 'hold-door'));

  for (let i = 0; i < 4; i++) broker();
  assert.ok(w.player.player.weapons.has('fob'), 'the broker hands over the fob');
  for (let i = 0; i < 2; i++) trader();
  assert.ok(w.flags.has('signal'));
  assert.equal(w.signalAt()?.tag, 'rusk', 'the fob tracks Rusk');
  assert.ok(!shut(w, 'hold-door'), 'and the hold opens');

  for (let i = 0; i < 2; i++) informant();
  assert.ok(!shut(w, 'checkpoint'), 'now the pass opens the checkpoint');
  assert.equal(said(w, 'INFORMANT').length, 5);
  assert.equal(w.hostile, false, 'the town is calm all the while');
});
