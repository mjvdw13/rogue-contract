import test from 'node:test';
import assert from 'node:assert/strict';
import { makeWorld, mockInput, run } from './helpers.js';
import { FlowField, WALKER, UNREACHABLE } from '../src/engine/world/nav.js';
import { F_SOLID } from '../src/engine/world/tilemap.js';

// Mos Eisley as a chain (Mark, 2026-11-13): the broker, Rusk, the Crow.
// The fob comes with Kyle and points at the next place on the way in; Rusk
// takes it, and the way home is through the cantina.

/** Stand the player at (x, y) facing `angle` (content degrees), let them land, press use, let a moment pass. */
function talk(w, x, y, angle) {
  Object.assign(w.player, { x, y, angle: (-angle * Math.PI) / 180 });
  run(w, mockInput(), 0.6);
  w.use(w.player);
  run(w, mockInput(), 0.5);
}
/** Hear the broker out, until he's keyed Rusk into the fob. */
function takeContract(w) {
  for (let i = 0; i < 10 && !w.flags.has('signal'); i++) talk(w, 92.6, 104.4, 260);
}
/** Step onto (x, y) and let a moment pass. */
function stand(w, x, y) {
  Object.assign(w.player, { x, y });
  run(w, mockInput(), 0.3);
}
const door = (w, tag) => w.map.doors.find((d) => d.tag === tag);
const shut = (w, tag) => door(w, tag).state === 'closed';
const said = (w, who) => w.messages.filter((m) => m.startsWith(`${who}: `));
const points = (w) => w.signal?.tag;

test('in Mos Eisley the fob points the way in: the bay door, the cantina, the broker, the checkpoint, and past it Rusk', () => {
  const w = makeWorld('m1');
  run(w, mockInput(), 0.2);
  assert.equal(w.player.player.weapon, 'fob', 'Kyle lands holding the fob');
  assert.ok(said(w, 'JAN').length > 0, 'and Jan names the first stop');
  assert.equal(points(w), 'bay-door');
  stand(w, 32, 97);
  assert.equal(points(w), 'cantina-door', 'out on the lane it points at the cantina');
  stand(w, 94, 83.5);
  assert.equal(points(w), 'broker', 'in its door, at the broker');

  stand(w, 137.5, 67);
  assert.ok(shut(w, 'checkpoint'), 'without the pass the checkpoint stays shut');
  assert.ok(shut(w, 'hold-door'), 'and so does the hold');

  takeContract(w);
  assert.ok(w.flags.has('pass') && w.flags.has('contract'), 'one talk: the contract and the pass');
  assert.equal(points(w), 'checkpoint', "and the fob points at the checkpoint's gate");
  assert.ok(!shut(w, 'hold-door'), 'the hold opens');

  stand(w, 130.5, 67);
  stand(w, 137.5, 67);
  run(w, mockInput(), 2);
  assert.ok(!shut(w, 'checkpoint'), 'the troopers let Kyle through');
  stand(w, 149.5, 67);
  assert.equal(points(w), 'rusk', 'through the gate, it tracks Rusk');
  assert.equal(w.hostile, false, 'the town is calm all the while');
});

test("Mos Eisley: the junk yard and the alleys are open to explore; the switch shuts the blast doors and the alleys' mouth, so the way round is through the cantina", () => {
  const w = makeWorld('m1');
  run(w, mockInput(), 2);
  const offRoute = ['junk-gate', 'side-gate', 'alley-gate', 'mouth-gate'];
  assert.equal(door(w, 'blast-doors').state, 'open', 'the blast doors stand open when Kyle lands');
  for (const tag of offRoute) assert.ok(!shut(w, tag), `${tag} is open from the start`);
  for (const tag of ['lane-gate', 'cantina-back']) assert.ok(shut(w, tag), `${tag} is shut while the town is calm`);
  takeContract(w);
  stand(w, 184, 134.5);
  run(w, mockInput(), 3);
  assert.equal(w.hostile, true);
  assert.ok(shut(w, 'blast-doors'), 'the blast doors shut behind Kyle');
  assert.ok(shut(w, 'mouth-gate'), "and the alleys' mouth by the checkpoint");
  assert.ok(!shut(w, 'lane-gate') && !shut(w, 'cantina-back'), 'the back lane and the cantina are the way round');

  // From the checkpoint's foot a walker reaches the market, and only by the cantina's back door.
  const reaches = () => {
    const field = new FlowField(w.map, WALKER);
    field.update(137, 67, true, w.map.floorZ[67 * w.map.w + 137] + WALKER.step);
    return field.dist[field.nodeAt(80, 70)] !== UNREACHABLE;
  };
  assert.ok(reaches(), 'the market can be reached');
  for (const i of w.map.tilesWithTag('cantina-back')) w.map.flags[i] |= F_SOLID;
  assert.ok(!reaches(), "and not without the cantina's back door");
});

test('the way home from Mos Eisley: Rusk takes the fob, Kyle draws, Jan names the back lane, guards stand at its gate, and under the Crow the level ends', () => {
  const w = makeWorld('m1');
  w.player.player.god = true;
  stand(w, 34.5, 129.5);
  assert.equal(w.exitRequested ?? null, null, 'the Crow is no way out while the town is calm');

  takeContract(w);
  stand(w, 184, 134.5);
  run(w, mockInput(), 2);
  assert.equal(w.hostile, true);
  assert.ok(!w.player.player.weapons.has('fob'), 'Rusk takes the fob');
  assert.equal(w.player.player.weapon, 'blaster', 'and Kyle draws his blaster');
  assert.equal(w.signal, null);
  const guards = w.things.filter((t) => t.kind === 'monster' && !t.dead && t.x > 126 && t.x < 130 && t.y > 78 && t.y < 80);
  assert.equal(guards.length, 2, "two troopers at the back lane's gate");

  let jan = said(w, 'JAN').length;
  stand(w, 108, 70);
  assert.ok(said(w, 'JAN').length > jan, 'at the shut blast doors Jan names the back lane');
  jan = said(w, 'JAN').length;
  stand(w, 137.5, 67);
  assert.ok(said(w, 'JAN').length > jan, 'and at the checkpoint');
  stand(w, 34.5, 129.5);
  assert.equal(w.exitRequested, 'normal', 'and under the Crow the level ends');
});
