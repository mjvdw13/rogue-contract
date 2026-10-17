import test from 'node:test';
import assert from 'node:assert/strict';
import { defineExplosion, defineParticle } from '../src/engine/defs.js';
import { Particles, DISC_CAP, POINT_CAP } from '../src/engine/world/particles.js';
import { buildLevel } from '../src/engine/world/level.js';
import { runActions } from '../src/engine/world/actions.js';
import { World } from '../src/engine/world/world.js';
import { Rng } from '../src/engine/core/rng.js';
import { Registry } from '../src/engine/registry.js';
import { validateContent } from '../src/engine/validate.js';
import content from '../src/content/index.js';
import { registry, room, makeWorld, headlessRenderer, mockInput } from './helpers.js';

// Explosions made of particles (PLAN.md Phase 1b T step 5f), and the two
// particle features they brought: `grow` and `trail`.

const ROOM = { floor: 'imp-floor', ceiling: 'imp-ceiling', ceilZ: 4, light: 64 };
const OPEN = ['#############', '#...........#', '#...........#', '#...........#', '#...........#', '#...........#', '#############'];
const DT = 1 / 60;
const ramps = registry.paletteDef.ramps;
const level = () => room(OPEN, ['', ' >'], { legend: { '.': ROOM } });

/** A registry with the content plus these explosions. */
const withExplosions = (...list) => new Registry({ ...content, explosions: [...content.explosions, ...list] });

const tick = (w, seconds, each) => {
  for (let k = 0; k < Math.round(seconds / DT); k++) {
    w.tick(DT, mockInput());
    each?.(k);
  }
};
const live = (w, id) => w.particles.types[w.particles.typeIndex(id)].live;

test('a trail drops its type every so often while the particle flies, for its first seconds only', () => {
  const { map } = buildLevel(registry, level());
  const ps = new Particles(map, [
    defineParticle({ id: 'puff', colors: [1], life: 10 }),
    defineParticle({ id: 'chunk', colors: [1], life: 10, trail: { type: 'puff', every: 0.1, for: 0.55 } }),
    defineParticle({ id: 'lying', colors: [1], life: 10, gravity: 10, onFloor: 'stick', trail: { type: 'puff', every: 0.1 } }),
  ]);
  ps.spawn('chunk', 2.5, 3.5, 2, 1, 0, 0);
  for (let k = 0; k < 60; k++) ps.update(DT);
  assert.equal(ps.types[0].live, 5, 'at 0.1 to 0.5 s, none after');
  // Each puff is dropped where the chunk was.
  for (let i = 0; i < ps.n; i++) if (ps.type[i] === 0) assert.ok(ps.x[i] > 2.5 && ps.x[i] < 3.2);

  ps.clear();
  ps.spawn('lying', 5.5, 3.5, 0.05);
  for (let k = 0; k < 15; k++) ps.update(DT);
  const landed = ps.types[0].live;
  for (let k = 0; k < 60; k++) ps.update(DT);
  assert.equal(ps.types[0].live, landed, 'none once it lies on the floor');
});

test('bursts with a radius start within it, not all at one point, and never under the floor', () => {
  const { map } = buildLevel(registry, level());
  const ps = new Particles(map, [defineParticle({ id: 'p', colors: [1], life: 10 })]);
  ps.burst('p', 5.5, 3.5, 0.2, { count: 100, radius: 0.5, speed: 0 });
  assert.equal(ps.n, 100);
  const spots = new Set();
  for (let i = 0; i < ps.n; i++) {
    assert.ok(Math.hypot(ps.x[i] - 5.5, ps.y[i] - 3.5, ps.z[i] - 0.2) <= 0.5 + 1e-5);
    assert.ok(ps.z[i] >= ps.floor[i]);
    spots.add(`${ps.x[i]},${ps.y[i]}`);
  }
  assert.ok(spots.size > 90);
});

test('grow: a disc swells to that many times its size by the end of its life', async () => {
  const { renderer } = await headlessRenderer();
  const green = ramps['glow-green'][0] + 2;
  const w = new World({ registry, assets: renderer.assets, rng: new Rng(1), settings: { noMonsters: true } }, level(), { skill: 3 });
  const ps = w.particles;
  ps.addType(defineParticle({ id: 'swell', colors: [green], fullbright: true, size: 0.5, grow: 3, maxPx: 32, shape: 'disc', life: 10 }));
  Object.assign(w.player, { x: 2.5, y: 3.5, angle: 0 });
  const count = () => {
    renderer.surface.clear(0);
    renderer.render(w, w.camera(), { skip: w.player });
    return renderer.surface.px.reduce((n, v) => n + (v === green), 0);
  };
  const s = ps.spawn('swell', 10.5, 3.5, 1.25);
  const small = count();
  ps.age[s] = 9.99;
  const big = count();
  assert.ok(small > 10, `${small} pixels at first`);
  assert.ok(big / small > 6 && big / small < 12, `about 9 times the area: ${small} then ${big}`);
});

test('an explosion throws its bursts now, after their delay, or spread over a while, and flashes', () => {
  const reg = withExplosions(
    defineExplosion({
      id: 'test',
      light: { radius: 4, light: 100, time: 0.5 },
      particles: [
        { type: 'spark', count: 10 },
        { type: 'shrapnel', count: 6, delay: 0.25 },
        { type: 'ember', count: 12, delay: 0.1, over: 0.6 },
      ],
    }),
  );
  const w = makeWorld(level(), { noMonsters: true, registry: reg });
  const state = w.rng.state;
  assert.equal(w.explode('no-such', 5.5, 3.5, 1.5), false);
  assert.equal(w.explode('test', 5.5, 3.5, 1.5), true);
  assert.equal(live(w, 'spark'), 10);
  assert.equal(live(w, 'shrapnel') + live(w, 'ember'), 0, 'the rest wait');
  const flash = () => w.dynamicLights().find((l) => l.radius === 4)?.light ?? 0;
  assert.equal(flash(), 100);
  tick(w, 0.2);
  assert.ok(flash() > 50 && flash() < 70, `fading: ${flash()}`);
  assert.equal(live(w, 'shrapnel'), 0);
  const embers = live(w, 'ember');
  assert.ok(embers > 0 && embers < 6, `embers coming a few at a time: ${embers}`);
  tick(w, 0.1);
  assert.equal(live(w, 'shrapnel'), 6, 'all at once after its delay');
  tick(w, 0.45);
  assert.equal(live(w, 'ember'), 12, 'all out by delay + over');
  assert.equal(flash(), 0, 'the flash is gone');
  assert.equal(w.explosions.pending.length, 0);
  assert.equal(w.rng.state, state, "explosions don't touch the world's RNG");
});

test("an explosion faces out of what it hit: bursts keep to that side, 'up' ones rise", () => {
  const reg = withExplosions(
    defineExplosion({ id: 'test', particles: [{ type: 'spark', count: 60, speed: [2, 3] }, { type: 'ember', count: 20, dir: 'up', spread: 0.3 }] }),
  );
  const w = makeWorld(level(), { noMonsters: true, registry: reg });
  const ps = w.particles;
  const sparks = ps.typeIndex('spark');
  const each = (fn) => {
    for (let i = 0; i < ps.n; i++) fn(i, ps.type[i] === sparks);
  };
  // In mid-air: all round.
  w.explode('test', 5.5, 3.5, 2);
  let down = 0;
  each((i, spark) => spark && ps.vz[i] < 0 && down++);
  assert.ok(down > 15, `some sparks go down in mid-air (${down})`);
  each((i, spark) => !spark && assert.ok(ps.vz[i] > 0, 'embers rise'));
  // On the floor: none into it.
  ps.clear();
  w.explode('test', 5.5, 3.5, 0.1);
  each((i, spark) => spark && assert.ok(ps.vz[i] >= 0));
  // Against a wall facing -x: none into the wall.
  ps.clear();
  w.explode('test', 11.8, 3.5, 2, { dir: [-1, 0, 0] });
  each((i, spark) => spark && assert.ok(ps.vx[i] <= 0));
});

test("'then' sets off another explosion later, off to the side, never into the wall", () => {
  const reg = withExplosions(
    defineExplosion({ id: 'after', light: { radius: 2, light: 50 }, particles: [{ type: 'ember', count: 5, speed: 0 }] }),
    defineExplosion({ id: 'main', light: { radius: 4, light: 100 }, particles: [{ type: 'spark', count: 5 }], then: [{ explosion: 'after', delay: 0.2, offset: 0.8, z: 0.3 }] }),
  );
  const w = makeWorld(level(), { noMonsters: true, registry: reg });
  w.explode('main', 5.5, 3.5, 1);
  assert.equal(live(w, 'ember'), 0, 'not yet');
  tick(w, 0.15);
  assert.equal(live(w, 'ember'), 0);
  tick(w, 0.1);
  assert.equal(live(w, 'ember'), 5, 'after its delay');
  const flash = w.explosions.flashes.find((f) => f.radius === 2);
  assert.ok(Math.abs(Math.hypot(flash.x - 5.5, flash.y - 3.5) - 0.8) < 1e-9, 'offset to the side');
  assert.equal(flash.z, 1.3);
  assert.equal(w.explosions.pending.length, 0);
  // Against a wall facing -x, many times: never behind it, never in it.
  for (let k = 0; k < 40; k++) {
    w.explosions.clear();
    w.explode('main', 11.9, 3.5, 1, { dir: [-1, 0, 0] });
    tick(w, 0.25);
    const f = w.explosions.flashes.find((l) => l.radius === 2);
    assert.ok(f.x <= 11.9 && f.x < 12 - 0.1, `beside, not into the wall (${f.x})`);
  }
  // Toward a wall nearer than the offset: stops short of it.
  for (let k = 0; k < 40; k++) {
    w.explosions.clear();
    w.explode('main', 1.3, 1.3, 1);
    tick(w, 0.25);
    const f = w.explosions.flashes.find((l) => l.radius === 2);
    assert.ok(f.x > 1 && f.y > 1, `inside the room (${f.x}, ${f.y})`);
  }
});

test("a 'ring' burst flies flat across the way the explosion faces", () => {
  const reg = withExplosions(defineExplosion({ id: 'test', particles: [{ type: 'ion-spark', count: 40, speed: [2, 3], dir: 'ring' }] }));
  const w = makeWorld(level(), { noMonsters: true, registry: reg });
  const ps = w.particles;
  w.explode('test', 5.5, 3.5, 0.1);
  assert.equal(ps.n, 40);
  for (let i = 0; i < ps.n; i++) assert.ok(Math.abs(ps.vz[i]) < 1e-9 && Math.hypot(ps.vx[i], ps.vy[i]) >= 2, 'flat along the floor');
  ps.clear();
  w.explode('test', 11.9, 3.5, 2, { dir: [-1, 0, 0] });
  for (let i = 0; i < ps.n; i++) assert.ok(Math.abs(ps.vx[i]) < 1e-9, 'flat along the wall');
  let up = 0;
  for (let i = 0; i < ps.n; i++) if (Math.abs(ps.vz[i]) > 1) up++;
  assert.ok(up > 5, `in the wall's plane, so some go up or down (${up})`);
});

test("things' death.explosion goes off where they die", () => {
  const droid = content.things.find((t) => t.id === 'probe-droid');
  const reg = new Registry({ ...content, things: [...content.things.filter((t) => t !== droid), { ...droid, corpse: undefined, death: { explosion: 'large' } }] });
  const w = makeWorld(level(), { noMonsters: true, registry: reg });
  const d = w.spawn('probe-droid', 8.5, 3.5);
  d.z = 0.9;
  w.damage(d, 1000, w.player, w.player);
  assert.ok(live(w, 'fire') > 0 && live(w, 'spark') > 0);
  assert.ok(w.explosions.flashes.length === 1 && w.explosions.pending.length > 0);
});

test("a projectile's explosion goes off where it bursts, facing back out of the wall", () => {
  const rocket = content.things.find((t) => t.id === 'rocket');
  const reg = new Registry({
    ...content,
    things: [...content.things.filter((t) => t !== rocket), { ...rocket, explosion: 'test' }],
    explosions: [defineExplosion({ id: 'test', particles: [{ type: 'spark', count: 40, speed: [2, 3] }] })],
  });
  const w = makeWorld(level(), { noMonsters: true, registry: reg });
  const p = w.spawn('rocket', 8.5, 3.5);
  Object.assign(p, { z: 1.5, vx: 24, vy: 0, vz: 0, angle: 0 });
  tick(w, 0.3);
  const ps = w.particles;
  assert.equal(ps.n, 40);
  for (let i = 0; i < ps.n; i++) assert.ok(ps.x[i] < 12 && ps.vx[i] <= 1e-6, 'back out of the wall');
});

test("the 'explode' action sets one off above the floor at a spot", () => {
  const w = makeWorld(level(), { noMonsters: true });
  runActions(w, [{ action: 'explode', explosion: 'small', x: 6.5, y: 3.5 }]);
  assert.ok(live(w, 'fire') > 0);
  assert.equal(w.explosions.flashes[0].z, 0.5);
});

test('one of each style stays inside the caps', () => {
  for (const e of registry.explosions.values()) {
    const w = makeWorld(level(), { noMonsters: true });
    const ps = w.particles;
    w.explode(e.id, 6.5, 3.5, 1.2);
    let discs = 0;
    let points = 0;
    tick(w, 4, () => {
      discs = Math.max(discs, ps.discs);
      points = Math.max(points, ps.points);
    });
    assert.ok(discs <= DISC_CAP / 2, `"${e.id}": ${discs} discs at most, leaving half the cap`);
    assert.ok(points <= POINT_CAP / 4, `"${e.id}": ${points} points at most`);
    assert.equal(ps.n, 0, `"${e.id}" is all gone after 4 s`);
  }
});

test('the validator checks explosions, the things that use them, trails and grow', () => {
  const droid = content.things.find((t) => t.id === 'probe-droid');
  const rocket = content.things.find((t) => t.id === 'rocket');
  const bad = new Registry({
    ...content,
    things: [...content.things.filter((t) => t !== droid && t !== rocket), { ...droid, death: { explosion: 'nope' } }, { ...rocket, explosion: 'gone' }],
    particles: [...content.particles, defineParticle({ id: 'x1', colors: [1], grow: -1, trail: { type: 'missing', every: 0 } })],
    explosions: [
      defineExplosion({
        id: 'bad',
        light: { radius: 0, light: 10, time: -1 },
        effect: 'probe-droid',
        sound: 'no-sound',
        particles: [{ type: 'no-such', delay: [-1], over: 'x', radius: -2, dir: 'sideways' }],
        then: [{ explosion: 'nothing', offset: -1 }],
      }),
      defineExplosion({ id: 'ping', particles: [], then: [{ explosion: 'pong' }] }),
      defineExplosion({ id: 'pong', particles: [], then: [{ explosion: 'ping', delay: 1 }] }),
    ],
  });
  const { errors, warnings } = validateContent(bad);
  const has = (s) => assert.ok(errors.some((e) => e.includes(s)), `expected "${s}" in ${JSON.stringify(errors)}`);
  has('death: unknown explosion "nope"');
  has('projectile "rocket": unknown explosion "gone"');
  has('grow');
  has('trail has unknown particle type "missing"');
  has('trail.every');
  for (const s of ['unknown particle type "no-such"', 'delay', 'over', 'radius', "'out' or 'ring'", 'light', "time", 'unknown effect "probe-droid"']) {
    has(`explosion "bad"`);
    has(s);
  }
  has('explosion "bad" then: unknown explosion "nothing"');
  has('"then" offset');
  has('explosion "ping": "then" sets it off again (a loop)');
  assert.ok(warnings.some((e) => e.startsWith('explosion "bad"') && e.includes('no-sound')), 'its sound');
  assert.deepEqual(
    validateContent(registry).errors.filter((e) => e.startsWith('explosion') || e.startsWith('Particle')),
    [],
    "the content's own pass",
  );
});
