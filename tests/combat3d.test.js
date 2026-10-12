import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLevel } from '../src/engine/world/level.js';
import { traceRay3D, rayCylinder } from '../src/engine/world/physics.js';
import { performAttack } from '../src/engine/combat/attacks.js';
import { pitchSlope, AUTOAIM_SLOPE } from '../src/engine/combat/aim.js';
import { makeWorld, mockInput, room, run, registry } from './helpers.js';

const TALL = { floor: 'carpet', ceiling: 'ceiling-tile', light: 160, ceilZ: 3 };
const GUN = { kind: 'hitscan', damage: 1000, spread: 0, range: 48 };

// A corridor running east from the player start (facing east at (1.5, 1.5)).
// `row` is the tiles east of the start; the legend gives each glyph a height.
function corridor(row, legend = {}) {
  const w = row.length + 3;
  return room(['#'.repeat(w), `#.${row}#`, '#'.repeat(w)], ['', ' >'], { legend: { '.': TALL, ...legend } });
}

// The ledge from x = 6 on is a full unit up.
const ledge = corridor('....hhh', { h: { ...TALL, floorZ: 1 } });

function setup(level) {
  return makeWorld(level, { noMonsters: true });
}

const SKY = { ...TALL, ceiling: 'sky', ceilZ: 2 };

function ant(w, x, y = 1.5) {
  const a = w.spawn('ant', x, y);
  a.health = 1;
  return a;
}

test('a 3D ray stops at floors, ceilings and the faces of steps', () => {
  const map = buildLevel(registry, ledge).map;
  const level = traceRay3D(map, 1.5, 1.5, 0.5, 1, 0, 0, 20);
  assert.equal(level.hit, 'wall', 'a level ray meets the ledge face');
  assert.ok(Math.abs(level.dist - 4.5) < 1e-9, `at x = 6 (dist ${level.dist})`);
  const down = traceRay3D(map, 1.5, 1.5, 0.5, 1, 0, -0.25, 20);
  assert.equal(down.hit, 'floor');
  assert.ok(Math.abs(down.dist - 2) < 1e-9 && Math.abs(down.z) < 1e-9, 'lands two tiles out');
  const up = traceRay3D(map, 1.5, 1.5, 0.5, 1, 0, 1, 20);
  assert.equal(up.hit, 'ceiling');
  assert.ok(Math.abs(up.z - 3) < 1e-9);
  const over = traceRay3D(map, 1.5, 1.5, 0.5, 1, 0, 0.2, 20);
  assert.ok(over.dist > 4.5, 'a ray climbing over the ledge edge carries on');
});

test('the sky swallows rays, and a closed rising door stops them', () => {
  const open = corridor('....', { '.': SKY });
  const sky = traceRay3D(buildLevel(registry, open).map, 1.5, 1.5, 0.5, 1, 0, 0.5, 20);
  assert.equal(sky.hit, 'ceiling');
  assert.equal(sky.sky, true);
  const door = corridor('.D..', { D: { door: 'door-metal', style: 'rise' } });
  const shut = traceRay3D(buildLevel(registry, door).map, 1.5, 1.5, 0.5, 1, 0, 0, 20);
  assert.equal(shut.hit, 'wall');
  assert.ok(Math.abs(shut.dist - 1.5) < 1e-9, 'stops at the door');
});

test('ray vs body: over its head misses, through it hits', () => {
  assert.ok(rayCylinder(0, 0, 0.5, 1, 0, 0, 5, 0, 0.3, 0, 0.8) > 4.6, 'level shot hits the near side');
  assert.equal(rayCylinder(0, 0, 0.5, 1, 0, 0.1, 5, 0, 0.3, 0, 0.8), -1, 'climbing shot passes over');
  assert.ok(rayCylinder(0, 0, 2, 1, 0, -0.3, 5, 0, 0.3, 0, 0.8) > 0, 'downward shot drops into it');
});

test('the player shoots along the view pitch: level shots hit the ledge, aimed ones hit the ant on it', () => {
  const w = setup(ledge);
  w.settings.autoAim = false;
  const a = ant(w, 7.5);
  performAttack(w, w.player, GUN, 0);
  assert.equal(a.dead, false, 'a level shot hits the ledge face below it');
  // Look up at the ant's middle: from the eye at 0.5 up to 1 + 0.425, six tiles away.
  const slopePerPixel = pitchSlope({ pitch: 1 });
  w.player.pitch = (1.425 - 0.5) / 6 / slopePerPixel;
  performAttack(w, w.player, GUN, 0);
  assert.equal(a.dead, true, 'looking up at it hits');
});

test('gentle auto-aim lifts a shot onto a body, but only by a little', () => {
  const near = setup(corridor('...hhh', { h: { ...TALL, floorZ: 0.75 } }));
  const a = ant(near, 5.5);
  performAttack(near, near.player, GUN, 0);
  assert.equal(a.dead, true, 'a monster just above the line of fire still gets hit');

  const far = setup(corridor('...hhh', { h: { ...TALL, floorZ: 2 } }));
  const b = ant(far, 5.5);
  performAttack(far, far.player, GUN, 0);
  assert.equal(b.dead, false, `auto-aim doesn't bend shots more than ${AUTOAIM_SLOPE}`);
});

test('monsters on a ledge shoot down at the player', () => {
  const w = setup(ledge);
  const a = ant(w, 7.5);
  a.target = w.player;
  performAttack(w, a, { ...GUN, damage: 10 }, a.angleTo(w.player));
  assert.equal(w.player.player.health, 90);
});

test('a ledge hides the player from a monster on top until they step back', () => {
  const w = setup(ledge);
  const a = ant(w, 7.5);
  w.player.x = 5.5; // right under the ledge edge
  const sees = (m) => {
    m.state = 'idle';
    m.timer = 0;
    run(w, mockInput(), 0.05);
    return m.state !== 'idle';
  };
  assert.equal(sees(a), false, 'the ledge hides the player standing below its edge');
  w.player.x = 1.5;
  assert.equal(sees(a), true, 'from further back the player is in view');
});

test('a rocket aimed down bursts on the floor; one fired level bursts on the step face', () => {
  const w = setup(ledge);
  const down = w.spawnProjectile('toner-rocket', w.player, 0, {}, { z: 0.5, slope: -0.25 });
  run(w, mockInput(), 0.5);
  assert.equal(down.state, 'exploding');
  assert.ok(down.x < 4.6 && down.z < 0.1, `on the floor near x = 4.4 (${down.x.toFixed(2)}, ${down.z.toFixed(2)})`);

  const level = w.spawnProjectile('toner-rocket', w.player, 0, {}, { z: 0.5, slope: 0 });
  run(w, mockInput(), 0.5);
  assert.equal(level.state, 'exploding');
  assert.ok(level.x < 6 && level.x > 5.5, `against the ledge face (${level.x.toFixed(2)})`);
});

test('a projectile fired into the sky vanishes without bursting', () => {
  const w = setup(corridor('....', { '.': SKY }));
  const p = w.spawnProjectile('toner-rocket', w.player, 0, {}, { z: 0.5, slope: 1 });
  let burst = false;
  run(w, mockInput(), 1, () => (burst ||= p.state === 'exploding'));
  assert.equal(p.removed, true);
  assert.equal(burst, false);
});

test('explosions measure 3D distance and stop at ledges', () => {
  const w = setup(ledge);
  const below = ant(w, 4.5);
  const above = ant(w, 6.5);
  below.health = above.health = 100;
  // A blast on the floor by the ledge face: the ant on the floor is hurt,
  // the one up on the ledge (as close across) is shielded.
  w.radiusDamage(5.5, 1.5, 2.5, 100, null, null, 0.1);
  assert.ok(below.health < 100, 'the ant on the floor is hurt');
  assert.equal(above.health, 100, 'the ledge shields the ant on top');
  // High in the air the same blast misses the floor ant.
  const air = setup(corridor('......'));
  const c = ant(air, 4.5);
  c.health = 100;
  air.radiusDamage(4.5, 1.5, 1.5, 100, null, null, 2.6);
  assert.equal(c.health, 100, 'too far above to reach');
  air.radiusDamage(4.5, 1.5, 1.5, 100, null, null, 1.2);
  assert.ok(c.health < 100, 'a blast just over its head reaches');
});

test('melee only reaches bodies at about the same height', () => {
  const w = setup(corridor('....'));
  const a = ant(w, 2.3);
  const fist = { kind: 'melee', damage: 1000, range: 1.1 };
  a.z = 1.2; // as if hovering a unit above the floor
  performAttack(w, w.player, fist, 0);
  assert.equal(a.dead, false, 'well above the player: out of reach');
  a.z = 0;
  performAttack(w, w.player, fist, 0);
  assert.equal(a.dead, true, 'level with it: hit');
});
