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
/** Hear the broker out, until he hands over the fob. */
function takeContract(w) {
  for (let i = 0; i < 10 && !w.player.player.weapons.has('fob'); i++) talk(w, 92, 104.6, 270);
}
/** Talk to the Jawa trader in the sandcrawler's hold, from the top of its ramp's turn. */
const trader = (w) => talk(w, 69, 8, 180);
const door = (w, tag) => w.map.doors.find((d) => d.tag === tag);
const shut = (w, tag) => door(w, tag).state === 'closed';
const said = (w, who) => w.messages.filter((m) => m.startsWith(`${who}: `));

test('in Mos Eisley the informant has no pass, and the hold stays shut, until the trader keys in the signal', () => {
  const w = makeWorld('m1');
  const informant = () => talk(w, 141.5, 55.5, 0);

  for (let i = 0; i < 3; i++) informant();
  assert.ok(!w.flags.has('pass') && shut(w, 'checkpoint'), 'the informant sends Kyle away');
  trader(w);
  assert.ok(!w.flags.has('signal'), 'the trader has nothing for him without the contract');
  assert.ok(shut(w, 'hold-door'));

  takeContract(w);
  assert.ok(w.player.player.weapons.has('fob'), 'the broker hands over the fob');
  for (let i = 0; i < 2; i++) trader(w);
  assert.ok(w.flags.has('signal'));
  assert.equal(w.signalAt()?.tag, 'rusk', 'the fob tracks Rusk');
  assert.ok(!shut(w, 'hold-door'), 'and the hold opens');

  for (let i = 0; i < 2; i++) informant();
  assert.ok(!shut(w, 'checkpoint'), 'now the pass opens the checkpoint');
  assert.equal(said(w, 'INFORMANT').length, 5);
  assert.equal(w.hostile, false, 'the town is calm all the while');
});

test('Mos Eisley opens in stages: the junk yard waits for the fob, the east for the signal, and the switch shuts the blast doors and opens the cantina\'s back door', () => {
  const w = makeWorld('m1');
  const east = ['blast-doors', 'side-gate', 'alley-gate'];
  for (const tag of ['junk-gate', ...east, 'cantina-back']) assert.ok(shut(w, tag), `${tag} is shut when Kyle lands`);

  takeContract(w);
  run(w, mockInput(), 1);
  assert.equal(door(w, 'junk-gate').state, 'open', 'the fob opens the junk yard, for good');
  for (const tag of east) assert.ok(shut(w, tag), `${tag} still waits for the signal`);
  for (let i = 0; i < 2; i++) trader(w);
  run(w, mockInput(), 3);
  for (const tag of east) assert.equal(door(w, tag).state, 'open', `the signal opens ${tag}, for good`);
  assert.ok(shut(w, 'cantina-back'), "the cantina's back door stays locked while the town is calm");

  // Into the freighter's hold: Rusk, and the switch.
  Object.assign(w.player, { x: 184, y: 134.5 });
  run(w, mockInput(), 3);
  assert.equal(w.hostile, true);
  assert.ok(shut(w, 'blast-doors'), 'the blast doors shut behind Kyle');
  assert.ok(!shut(w, 'cantina-back') && !shut(w, 'side-gate') && !shut(w, 'alley-gate'), 'the ways round them are open');
});

test('in Mos Eisley people point the way: Jan on landing, the informant at the checkpoint, Jan again at the switch', () => {
  const w = makeWorld('m1');
  const foot = () => {
    Object.assign(w.player, { x: 137.5, y: 67 });
    run(w, mockInput(), 0.2);
    Object.assign(w.player, { x: 130.5, y: 67 });
    run(w, mockInput(), 0.2);
  };
  assert.ok(said(w, 'JAN').length > 0, 'Jan names the first stop on landing');

  takeContract(w);
  for (let i = 0; i < 2; i++) trader(w);
  foot();
  foot();
  assert.equal(said(w, 'INFORMANT').length, 1, 'with the signal, the informant calls Kyle over, once');

  const jan = said(w, 'JAN').length;
  Object.assign(w.player, { x: 184, y: 134.5 });
  run(w, mockInput(), 0.5);
  assert.equal(w.hostile, true);
  assert.ok(said(w, 'JAN').length > jan, 'Jan speaks up at the switch');
  const atSwitch = said(w, 'JAN').length;
  foot();
  assert.ok(said(w, 'JAN').length > atSwitch, 'and names the ways round at the checkpoint');
  assert.equal(said(w, 'INFORMANT').length, 1, 'the informant keeps quiet now');
});

test('the way home from Mos Eisley: customs locks the bay at the switch, the customs terminal unlocks it, and back at the Crow the level ends', () => {
  const w = makeWorld('m1');
  w.player.player.god = true;
  const crow = () => {
    Object.assign(w.player, { x: 34.5, y: 129.5 });
    run(w, mockInput(), 0.2);
    Object.assign(w.player, { x: 32, y: 135.5 });
    run(w, mockInput(), 0.2);
  };
  crow();
  assert.equal(w.exitRequested ?? null, null, 'the Crow is no way out while the town is calm');

  takeContract(w);
  for (let i = 0; i < 2; i++) trader(w);
  Object.assign(w.player, { x: 184, y: 134.5 });
  run(w, mockInput(), 3);
  assert.equal(w.hostile, true);

  // Back along the lane to the bay door, facing it.
  const jan = said(w, 'JAN').length;
  talk(w, 32, 98.4, 270);
  assert.ok(shut(w, 'bay-door'), 'customs has locked it');
  assert.ok(said(w, 'JAN').length > jan, 'and Jan says where its controls are');

  talk(w, 16.5, 103, 270); // the customs terminal
  assert.ok(w.flags.has('bay-open'));
  talk(w, 32, 98.4, 270);
  assert.ok(!shut(w, 'bay-door'), 'now the bay door opens');
  assert.equal(w.exitRequested ?? null, null);
  crow();
  assert.equal(w.exitRequested, 'normal', 'and under the Crow the level ends');
});
