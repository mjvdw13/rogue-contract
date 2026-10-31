import test from 'node:test';
import assert from 'node:assert/strict';
import content from '../src/content/index.js';
import { Registry } from '../src/engine/registry.js';
import { defineLevel, defineWeapon } from '../src/engine/defs.js';
import { validateContent } from '../src/engine/validate.js';
import { runActions } from '../src/engine/world/actions.js';
import { makeWorld, mockInput, registry, room, run } from './helpers.js';

// A long hall, 60 x 5, the player at its west end facing east.
const HALL = ['#'.repeat(62), ...Array(5).fill(`#${'.'.repeat(60)}#`), '#'.repeat(62)];
const hall = (list = [], extra = {}) => ({ ...room(HALL, []), list: [{ type: 'player', x: 2.5, y: 3.5, angle: 0 }, ...list], ...extra });

/** A world with the fob in hand, counting its beeps. */
function holding(level) {
  const w = makeWorld(level);
  w.beeps = 0;
  w.playSound = (id) => id === 'fob-beep' && w.beeps++;
  runActions(w, [{ action: 'giveWeapon', weapon: 'fob' }]);
  run(w, mockInput(), 1.5);
  assert.equal(w.player.player.weapon, 'fob', 'giveWeapon switches to it');
  return w;
}
const ws = (w) => w.player.player.weaponState;

/** Run `fn` with the fob's bands set here, so the tests don't hang on its tuning. */
function withTrack(track, fn) {
  const fob = registry.weapons.get('fob');
  const saved = fob.track;
  fob.track = { near: 4, far: 80, blink: [0.15, 1.4], facing: 15, warm: null, ...track };
  try {
    fn();
  } finally {
    fob.track = saved;
  }
}
/** The fob in hand, tracking Rusk at (x, 3.5); the player at (2.5, 3.5). */
function tracking(x) {
  const w = holding(hall([{ type: 'villager-man', x, y: 3.5, wander: 0, tag: 'rusk' }]));
  runActions(w, [{ action: 'setSignal', tag: 'rusk' }]);
  return w;
}
/** What each blink shows over `time` seconds (on the tick it beeps). */
function blinks(w, time = 3) {
  const seen = new Set();
  let beeps = w.beeps;
  run(w, mockInput(), time, () => {
    if (w.beeps > beeps) seen.add(ws(w).animName);
    beeps = w.beeps;
  });
  return [...seen];
}
const turn = (w, deg) => (w.player.angle = (-deg * Math.PI) / 180);

test('the fob stays dark with nothing to track, and firing it does nothing', () => {
  const w = holding(hall([{ type: 'sandtrooper', x: 8.5, y: 3.5, angle: 180, calm: true }]));
  const input = mockInput();
  input.hold('fire');
  run(w, input, 3);
  assert.equal(w.beeps, 0);
  assert.equal(ws(w).animName, 'idle');
  assert.equal(w.hostile, false, 'no noise: the town stays calm');
  assert.ok(!w.things.some((t) => t.kind === 'projectile'));
});

test('the fob blinks faster the nearer the signal', () => {
  const beeps = (x) => {
    const w = holding(hall([{ type: 'villager-man', x, y: 3.5, wander: 0, tag: 'rusk' }]));
    runActions(w, [{ action: 'setSignal', tag: 'rusk' }]);
    run(w, mockInput(), 10);
    return w.beeps;
  };
  const near = beeps(5.5);
  const far = beeps(58.5);
  assert.ok(far >= 4, `it blinks far off too (${far} in 10 s)`);
  assert.ok(near > far * 3, `near: ${near} blinks, far: ${far}`);
});

test('the fob blinks green facing the signal, yellow roughly toward it, and red turned away', () => {
  withTrack({ facing: 20, warm: 60 }, () => {
    const w = tracking(20.5);
    assert.deepEqual(blinks(w), ['litFacing'], 'facing it');
    turn(w, 40);
    assert.deepEqual(blinks(w), ['litWarm'], 'roughly toward it');
    turn(w, -90);
    assert.deepEqual(blinks(w), ['lit'], 'turned away');
  });
});

test("the fob's bands are wider the nearer the signal", () => {
  withTrack({ facing: [45, 10] }, () => {
    const near = tracking(6.5);
    turn(near, 30);
    assert.deepEqual(blinks(near), ['litFacing'], '30 degrees off, close by');
    const far = tracking(58.5);
    turn(far, 30);
    assert.deepEqual(blinks(far), ['lit'], '30 degrees off, far away');
  });
});

test('turning onto the signal lights the fob at once, not at its next blink', () => {
  withTrack({ facing: 20, warm: 60 }, () => {
    const w = tracking(58.5); // far: a second between blinks
    turn(w, 120);
    assert.deepEqual(blinks(w, 1.5), ['lit']);
    run(w, mockInput(), 0.2);
    turn(w, 0);
    const beeps = w.beeps;
    assert.deepEqual(blinks(w, 0.1), ['litFacing'], 'it blinks green straight away');
    assert.equal(w.beeps, beeps + 1);
    run(w, mockInput(), 0.5);
    assert.equal(w.beeps, beeps + 1, 'then keeps its far-off pace while the band holds');
  });
});

test('the signal follows a tagged thing, else its tiles, or the nearest of a type; none goes dark', () => {
  const w = makeWorld(
    hall(
      [
        { type: 'villager-man', x: 40.5, y: 2.5, wander: 0, tag: 'rusk' },
        { type: 'villager-woman', x: 30.5, y: 2.5, wander: 0 },
        { type: 'villager-woman', x: 10.5, y: 4.5, wander: 0 },
      ],
      { legend: { b: { tag: 'bay' } }, tiles: HALL.map((r, y) => (y === 5 ? `#${'.'.repeat(49)}bb${'.'.repeat(9)}#` : r)) },
    ),
  );
  runActions(w, [{ action: 'setSignal', tag: 'rusk' }]);
  const rusk = w.things.find((t) => t.tag === 'rusk');
  rusk.x = 42.5;
  assert.equal(w.signalAt(), rusk, 'it follows him');
  runActions(w, [{ action: 'setSignal', tag: 'bay' }]);
  assert.deepEqual(w.signalAt(), { x: 51, y: 5.5 }, 'the middle of the tagged tiles');
  runActions(w, [{ action: 'setSignal', thing: 'villager-woman' }]);
  assert.equal(w.signalAt().x, 10.5, 'the nearest of the type');
  runActions(w, [{ action: 'setSignal' }]);
  assert.equal(w.signalAt(), null);
});

test('takeWeapon takes the fob from the hand and switches to the best weapon', () => {
  const w = holding(hall());
  runActions(w, [{ action: 'takeWeapon', weapon: 'fob' }]);
  run(w, mockInput(), 1.5);
  const p = w.player.player;
  assert.ok(!p.weapons.has('fob'));
  assert.equal(p.weapon, 'blaster');
});

test('a weapon with no attack is never picked when another runs dry', () => {
  const w = holding(hall());
  const p = w.player.player;
  p.pendingWeapon = 'blaster';
  run(w, mockInput(), 1.5);
  p.ammo.energy = 0;
  const input = mockInput();
  input.hold('fire');
  run(w, input, 1.5);
  assert.equal(p.weapon, 'fists');
});

test('the validator checks trackers and the fob actions', () => {
  const tracker = defineWeapon({
    id: 'bad-tracker',
    name: 'BAD',
    slot: 7,
    sheet: { src: 'assets/sprites/weapons/fob.png', frameWidth: 96, frameHeight: 96 },
    anims: { idle: [0] },
    track: { near: 10, far: 5, blink: [0], facing: 200, warm: [10, 200], beep: true },
    charge: { time: 1 },
  });
  const level = defineLevel({
    ...hall([], {
      triggers: [
        {
          on: 'start',
          do: [
            { action: 'giveWeapon', weapon: 'lightsaber' },
            { action: 'takeWeapon', weapon: 'fob' },
            { action: 'setSignal', tag: 'nowhere' },
            { action: 'setSignal', thing: 'nobody' },
          ],
        },
      ],
    }),
    id: 'bad',
  });
  const { errors } = validateContent(new Registry({ ...content, weapons: [...content.weapons, tracker], levels: [level] }));
  assert.deepEqual(errors.filter((e) => e.includes('bad')), [
    'weapon "bad-tracker": has no "fire" attack, so charge and reraise do nothing',
    'weapon "bad-tracker": track has unknown field "beep" (it takes near, far, blink, facing, warm)',
    'weapon "bad-tracker": track needs near (tiles, 0 or more) below far',
    'weapon "bad-tracker": track blink must be [near, far] seconds between blinks, above 0',
    'weapon "bad-tracker": track facing must be 0 to 180 degrees, or [near, far] of them',
    'weapon "bad-tracker": track warm must be 0 to 180 degrees, or [near, far] of them',
    'weapon "bad-tracker": track warm needs a "litWarm" animation (its blink when roughly facing the signal)',
    'weapon "bad-tracker": a tracker needs a "lit" animation (its blink)',
    'Level "bad": trigger #1 gives unknown weapon "lightsaber"',
    'Level "bad": trigger #1 refers to tag "nowhere" which no tile or placed thing has',
    'Level "bad": trigger #1 tracks unknown thing "nobody"',
  ]);
});
