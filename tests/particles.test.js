import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLevel } from '../src/engine/world/level.js';
import { Particles, particleColors, POINT_CAP, DISC_CAP } from '../src/engine/world/particles.js';
import { blendTable } from '../src/engine/gfx/blend.js';
import { Palette } from '../src/engine/gfx/palette.js';
import { defineParticle } from '../src/engine/defs.js';
import { World } from '../src/engine/world/world.js';
import { Rng } from '../src/engine/core/rng.js';
import { Registry } from '../src/engine/registry.js';
import { validateContent } from '../src/engine/validate.js';
import content from '../src/content/index.js';
import { registry, room, makeWorld, headlessRenderer, mockInput } from './helpers.js';

// Particles (PLAN.md Phase 1b T): a pool of points and discs, moved on the
// tile grid and drawn straight into the frame.

const ROOM = { floor: 'imp-floor', ceiling: 'imp-ceiling', ceilZ: 4, light: 64 };
const OPEN = ['#############', '#...........#', '#...........#', '#...........#', '#...........#', '#...........#', '#############'];
const DT = 1 / 60;
const ramps = registry.paletteDef.ramps;
const palette = new Palette(registry.paletteDef);

/** A pool over a test room, with the given types (defineParticle specs). */
function pool(types, tiles = OPEN) {
  const { map } = buildLevel(registry, room(tiles, ['', ' >'], { legend: { '.': ROOM } }));
  return new Particles(map, types.map((t) => defineParticle({ colors: [['gray', 10]], life: 10, ...t })), ramps);
}

const step = (ps, seconds, each) => {
  for (let i = 0; i < Math.round(seconds / DT); i++) {
    ps.update(DT);
    each?.(i);
  }
};

test('colours resolve by ramp and step, from the dark end, and as runs', () => {
  const [gray] = ramps.gray;
  assert.deepEqual(particleColors([['gray', 0], ['gray', 3], 17], ramps), [gray, gray + 3, 17]);
  assert.deepEqual(particleColors([{ ramp: 'gray', from: 5, to: 2 }], ramps), [gray + 5, gray + 4, gray + 3, gray + 2]);
  assert.deepEqual(particleColors([{ ramp: 'gray', from: 1, to: 3 }], ramps), [gray + 1, gray + 2, gray + 3]);
  assert.equal(particleColors([['gray', 99]], ramps)[0], gray + ramps.gray[1] - 1, 'a step past the end is clamped');
  const w = makeWorld(room(OPEN, ['', ' >'], { legend: { '.': ROOM } }));
  const spark = w.particles.types[w.particles.typeIndex('spark')];
  assert.equal(spark.colors[0], ramps['glow-yellow'][0] + 6, "the content's spark starts white-hot");
  assert.equal(spark.colors.length, 7);
});

test('a particle falls, bounces lower each time, and never goes through the floor', () => {
  const ps = pool([{ id: 'ball', gravity: 10, bounce: 0.5, onFloor: 'bounce' }]);
  ps.spawn('ball', 5.5, 3.5, 1);
  let lowest = Infinity;
  let bounces = 0;
  let lastVz = 0;
  let peakAfter = 0;
  step(ps, 2, () => {
    lowest = Math.min(lowest, ps.z[0]);
    if (lastVz < 0 && ps.vz[0] > 0) bounces++;
    if (bounces) peakAfter = Math.max(peakAfter, ps.z[0]);
    lastVz = ps.vz[0];
  });
  assert.equal(ps.n, 1);
  assert.ok(lowest >= 0, `stays on the floor (lowest ${lowest})`);
  assert.ok(bounces >= 2, `bounces (${bounces})`);
  assert.ok(peakAfter < 0.5, `loses height (${peakAfter})`);
});

test('shrapnel sticks to the floor; others die there', () => {
  const ps = pool([
    { id: 'stick', gravity: 10, onFloor: 'stick', life: 5 },
    { id: 'die', gravity: 10, onFloor: 'die' },
  ]);
  ps.spawn('stick', 5.5, 3.5, 0.5);
  ps.spawn('die', 6.5, 3.5, 0.5);
  step(ps, 1);
  assert.equal(ps.n, 1);
  assert.equal(ps.types[ps.type[0]].id, 'stick');
  assert.equal(ps.z[0], 0);
  assert.equal(ps.rest[0], 1);
  const x = ps.x[0];
  step(ps, 1);
  assert.equal(ps.x[0], x, 'it lies still');
  step(ps, 4);
  assert.equal(ps.n, 0, 'and goes when its life is up');
});

test('walls kill particles, or bounce them back', () => {
  const ps = pool([{ id: 'die' }, { id: 'bounce', walls: 'bounce', bounce: 1 }]);
  ps.spawn('die', 10.5, 2.5, 1, 4, 0, 0);
  ps.spawn('bounce', 10.5, 3.5, 1, 4, 0, 0);
  step(ps, 1);
  assert.equal(ps.n, 1);
  assert.equal(ps.types[ps.type[0]].id, 'bounce');
  assert.ok(ps.x[0] < 12 && ps.vx[0] < 0, `turned back (x ${ps.x[0]}, vx ${ps.vx[0]})`);
  assert.equal(ps.spawn('die', 0.5, 0.5, 1), -1, 'nothing spawns inside a wall');
  assert.equal(ps.spawn('die', -3, 2, 1), -1, 'or off the map');
});

test('ceilings stop rising particles', () => {
  const ps = pool([{ id: 'up', gravity: -5 }]);
  ps.spawn('up', 5.5, 3.5, 3);
  step(ps, 2);
  assert.equal(ps.n, 1);
  assert.ok(ps.z[0] <= ROOM.ceilZ + 1e-6, `under the ceiling (${ps.z[0]})`);
});

test('caps: each type has its own, and points and discs their class caps', () => {
  const ps = pool([{ id: 'few', cap: 5 }, { id: 'dot' }, { id: 'puff', shape: 'disc' }]);
  assert.equal(ps.burst('few', 5.5, 3.5, 1, { count: 10 }), 5);
  assert.equal(ps.n, 5);
  ps.clear();
  for (let i = 0; i < POINT_CAP + 50; i++) ps.spawn('dot', 5.5, 3.5, 1);
  for (let i = 0; i < DISC_CAP + 50; i++) ps.spawn('puff', 5.5, 3.5, 1);
  assert.equal(ps.points, POINT_CAP);
  assert.equal(ps.discs, DISC_CAP);
  assert.equal(ps.n, POINT_CAP + DISC_CAP);
  // Dying frees room.
  ps.life.fill(0.01, 0, 100);
  ps.update(DT);
  assert.equal(ps.n, POINT_CAP + DISC_CAP - 100);
  assert.notEqual(ps.spawn('dot', 5.5, 3.5, 1), -1);
});

test('dead particles are swapped out; the live ones keep their state', () => {
  const ps = pool([{ id: 'a' }, { id: 'b' }]);
  for (let i = 0; i < 20; i++) {
    const s = ps.spawn(i % 2 ? 'b' : 'a', 2.5 + i * 0.4, 3.5, 1);
    ps.life[s] = i % 3 === 0 ? 0.05 : 10;
    ps.z[s] = 1 + i / 100; // a tag to find each one by
  }
  step(ps, 0.2);
  const left = [...ps.z.slice(0, ps.n)].map((z) => Math.round((z - 1) * 100)).sort((a, b) => a - b);
  assert.deepEqual(left, [...Array(20).keys()].filter((i) => i % 3 !== 0));
  for (let i = 0; i < ps.n; i++) assert.ok(Math.abs(ps.x[i] - (2.5 + Math.round((ps.z[i] - 1) * 100) * 0.4)) < 1e-5, `particle ${i} kept its x`);
  const live = ps.types.map((t) => t.live);
  assert.equal(live[0] + live[1], ps.n);
});

test('wind carries the types that feel it, in proportion', () => {
  const ps = pool([{ id: 'sand', wind: 1, drag: 2 }, { id: 'half', wind: 0.5, drag: 2 }, { id: 'rock', drag: 2 }]);
  ps.wind = [3, 0, 0];
  ps.spawn('sand', 3.5, 2.5, 1);
  ps.spawn('half', 3.5, 3.5, 1);
  ps.spawn('rock', 3.5, 4.5, 1);
  step(ps, 3);
  const vx = (id) => ps.vx[[0, 1, 2].find((i) => ps.types[ps.type[i]].id === id)];
  assert.ok(Math.abs(vx('sand') - 3) < 0.1, `sand moves with the wind (${vx('sand')})`);
  assert.ok(Math.abs(vx('half') - 1.5) < 0.1, `half as much (${vx('half')})`);
  assert.equal(vx('rock'), 0);
});

test("bursts go along their direction, and particles don't touch the world's RNG", () => {
  const w = makeWorld(room(OPEN, ['', ' >'], { legend: { '.': ROOM } }));
  const state = w.rng.state;
  const ps = w.particles;
  ps.burst('spark', 5.5, 3.5, 1, { count: 50, dir: [1, 0, 0], spread: 0.5, speed: [2, 2] });
  assert.equal(ps.n, 50);
  for (let i = 0; i < ps.n; i++) assert.ok(ps.vx[i] > 0, 'all forward');
  step(ps, 0.5);
  assert.equal(w.rng.state, state);
  const straight = new Particles(w.map, [defineParticle({ id: 'p', colors: [1] })]);
  straight.burst('p', 5.5, 3.5, 1, { count: 3, dir: [0, 2, 0], spread: 0, speed: 4 });
  for (let i = 0; i < 3; i++) assert.deepEqual([straight.vx[i], straight.vy[i], straight.vz[i]].map((v) => Math.round(v * 1e4) / 1e4), [0, 4, 0]);
});

test('the validator checks particle types', () => {
  const bad = new Registry({
    ...content,
    particles: [
      defineParticle({ id: 'x1', colors: [['no-such-ramp', 1]] }),
      defineParticle({ id: 'x2', colors: [['gray', 400]], blend: 'glow', drag: 99 }),
      defineParticle({ id: 'x3', colors: [1], life: [3, 1], maxPx: 0.5, shape: 'disc', cap: 9999 }),
    ],
  });
  const { errors, warnings } = validateContent(bad);
  const has = (list, s) => assert.ok(list.some((e) => e.includes(s)), `expected "${s}" in ${JSON.stringify(list)}`);
  has(errors, 'unknown colour ramp "no-such-ramp"');
  has(errors, 'ramp "gray" has steps 0 to');
  has(errors, 'blend must be one of');
  has(errors, 'drag');
  has(errors, 'life is seconds');
  has(errors, 'maxPx');
  has(warnings, 'above the disc cap');
  assert.deepEqual(validateContent(registry).errors.filter((e) => e.startsWith('Particle')), [], "the content's own types pass");
});

test('blend tables: add and half mix colours, and are built once per palette', () => {
  const add = blendTable(palette, 'add');
  const half = blendTable(palette, 'half');
  assert.equal(blendTable(palette, 'add'), add, 'cached');
  const rgb = (i) => [...palette.rgb.slice(i * 3, i * 3 + 3)];
  for (let d = 0; d < 255; d += 7) {
    assert.deepEqual(rgb(add[(0 << 8) | d]), rgb(d), 'adding black changes nothing');
    assert.deepEqual(rgb(half[(d << 8) | d]), rgb(d), 'half of a colour with itself is itself');
  }
  // Every entry is the palette's nearest colour to the true mix, either way round.
  const rng = new Rng(7);
  for (let k = 0; k < 300; k++) {
    const s = rng.int(0, 255);
    const d = rng.int(0, 255);
    const [a, b] = [rgb(s), rgb(d)];
    assert.equal(add[(s << 8) | d], palette.nearest(...a.map((v, j) => Math.min(255, v + b[j]))), `add ${s} + ${d}`);
    assert.equal(half[(s << 8) | d], palette.nearest(...a.map((v, j) => (v + b[j]) >> 1)), `half ${s} + ${d}`);
    assert.equal(half[(s << 8) | d], half[(d << 8) | s]);
  }
});

test('drawing: particles show in the open, hide behind walls and sprites, and show in front of sprites', async () => {
  const { renderer } = await headlessRenderer();
  const green = ramps['glow-green'][0] + 2;
  const WALLED = ['#############', '#...........#', '#...........#', '#.....#.....#', '#...........#', '#...........#', '#############'];
  /** A world with a 2x2-pixel fullbright marker type, the player at (2.5, 3.5) looking east. */
  const scene = (tiles = OPEN) => {
    const w = new World({ registry, assets: renderer.assets, rng: new Rng(1), settings: { noMonsters: true } }, room(tiles, ['', ' >'], { legend: { '.': ROOM } }), { skill: 3 });
    w.particles.addType(defineParticle({ id: 'mark', colors: [green], fullbright: true, size: 0.1, maxPx: 2, life: 10 }));
    Object.assign(w.player, { x: 2.5, y: 3.5, angle: 0 });
    return w;
  };
  const count = (w) => {
    renderer.surface.clear(0);
    renderer.render(w, w.camera(), { skip: w.player });
    return renderer.surface.px.reduce((n, c) => n + (c === green), 0);
  };
  let w = scene();
  assert.equal(count(w), 0, '(no marker colour without particles)');
  w.particles.spawn('mark', 9.5, 3.5, 1);
  assert.ok(count(w) >= 1, 'in the open: drawn');
  w = scene(WALLED);
  w.particles.spawn('mark', 9.5, 3.5, 1);
  assert.equal(count(w), 0, 'behind a wall: hidden');
  w.particles.spawn('mark', 4.5, 3.5, 1);
  assert.ok(count(w) >= 1, 'before the wall: drawn');
  // A stormtrooper at x 6.5 covers the view's middle at chest height.
  w = scene();
  w.spawn('stormtrooper', 6.5, 3.5, Math.PI);
  w.particles.spawn('mark', 9.5, 3.5, 1);
  assert.equal(count(w), 0, 'behind a sprite: hidden');
  w.particles.spawn('mark', 5, 3.5, 1);
  assert.ok(count(w) >= 1, 'in front of it: drawn');
  // A deck (a slab from 2 to 2.5) across the room's far half, seen from 4 up: what's under it hides.
  const tall = { ...ROOM, ceilZ: 8 };
  const deck = room(['#############', '#....=====..#', '#....=====..#', '#....=====..#', '#....=====..#', '#....=====..#', '#############'], ['', ' >'], {
    legend: { '.': tall, '=': { ...tall, slab: { bottom: 2, top: 2.5 } } },
  });
  w = new World({ registry, assets: renderer.assets, rng: new Rng(1), settings: { noMonsters: true } }, deck, { skill: 3 });
  w.particles.addType(defineParticle({ id: 'mark', colors: [green], fullbright: true, size: 0.1, maxPx: 2, life: 10 }));
  Object.assign(w.player, { x: 2.5, y: 3.5, angle: 0 });
  const high = () => {
    renderer.surface.clear(0);
    renderer.render(w, { ...w.camera(), z: 4 }, { skip: w.player });
    return renderer.surface.px.reduce((n, c) => n + (c === green), 0);
  };
  w.particles.spawn('mark', 8.5, 3.5, 1);
  assert.equal(high(), 0, 'under the deck, seen from above: hidden');
  w.particles.spawn('mark', 8.5, 3.5, 3.5);
  assert.ok(high() >= 1, 'over it: drawn');
});

test('drawing: discs cover their area, streaks run along their velocity, dither fades with age, lit ones darken', async () => {
  const { renderer } = await headlessRenderer();
  const green = ramps['glow-green'][0] + 2;
  const w = new World({ registry, assets: renderer.assets, rng: new Rng(1), settings: { noMonsters: true } }, room(OPEN, ['', ' >'], { legend: { '.': ROOM } }), { skill: 3 });
  const ps = w.particles;
  ps.addType(defineParticle({ id: 'disc', colors: [green], fullbright: true, size: 5, maxPx: 20, shape: 'disc', life: 10 }));
  ps.addType(defineParticle({ id: 'fade', colors: [green], fullbright: true, size: 5, maxPx: 20, shape: 'disc', blend: 'dither', life: 10 }));
  ps.addType(defineParticle({ id: 'streak', colors: [green], fullbright: true, streak: 0.05, life: 10 }));
  ps.addType(defineParticle({ id: 'lit', colors: [ramps.gray[0] + 15], size: 0.3, maxPx: 6, life: 10 }));
  Object.assign(w.player, { x: 2.5, y: 3.5, angle: 0 });
  const frame = () => {
    renderer.surface.clear(0);
    renderer.render(w, w.camera(), { skip: w.player });
    return renderer.surface.px;
  };
  const count = (c = green) => frame().reduce((n, v) => n + (v === c), 0);
  const view = renderer.view;

  ps.spawn('disc', 8.5, 3.5, 1.25);
  const area = count();
  // maxPx 20 tall: an ellipse 10 px high and 10 * fx / fy wide (radii).
  const expect = Math.PI * 10 * 10 * (view.fx / view.fy);
  assert.ok(Math.abs(area - expect) / expect < 0.15, `disc area ${area}, about ${Math.round(expect)}`);

  ps.clear();
  const s = ps.spawn('fade', 8.5, 3.5, 1.25);
  const full = count();
  ps.age[s] = 5;
  const halfWay = count();
  ps.age[s] = 9.9;
  // A full core (0.6 of the radius) and a half-covered rim: 0.36 + 0.64 / 2 of the area.
  assert.ok(Math.abs(full / area - 0.68) < 0.08, `dither at full strength: ${full} of ${area} pixels`);
  assert.ok(Math.abs(halfWay / full - 0.5) < 0.1, `dither: ${full} then ${halfWay} pixels`);
  assert.ok(count() < 0.05 * full, 'nearly gone at the end');

  ps.clear();
  ps.spawn('streak', 6.5, 3.5, 1.25, 0, -60, 0);
  const px = frame();
  const cols = new Set();
  const rows = new Set();
  for (let i = 0; i < px.length; i++) if (px[i] === green) cols.add(i % renderer.surface.w), rows.add((i / renderer.surface.w) | 0);
  assert.ok(cols.size >= 6 && rows.size <= 2, `a sideways streak: ${cols.size} columns, ${rows.size} rows`);

  ps.clear();
  ps.spawn('lit', 8.5, 3.5, 1.25);
  assert.equal(count(ramps.gray[0] + 15), 0, 'a lit particle in a dim room is drawn darker than its colour');
  const t = ps.types[ps.typeIndex('lit')];
  t.fullbright = true;
  assert.ok(count(ramps.gray[0] + 15) > 0, '(fullbright, its own colour)');
});

test("every bench kind is one of the content's particle types", async () => {
  const { BENCH_KINDS } = await import('../tools/lib/particle-bench.js');
  for (const id of Object.keys(BENCH_KINDS)) assert.ok(registry.particles.has(id), `"${id}"`);
  for (const id of registry.particles.keys()) assert.ok(BENCH_KINDS[id], `the bench lists "${id}"`);
});

test('dither particles with fadeIn fade in, then out', async () => {
  const { renderer } = await headlessRenderer();
  const green = ramps['glow-green'][0] + 2;
  const w = new World({ registry, assets: renderer.assets, rng: new Rng(1), settings: { noMonsters: true } }, room(OPEN, ['', ' >'], { legend: { '.': ROOM } }), { skill: 3 });
  const ps = w.particles;
  ps.addType(defineParticle({ id: 'fog', colors: [green], fullbright: true, size: 5, maxPx: 20, shape: 'disc', blend: 'dither', fadeIn: 0.5, life: 10 }));
  Object.assign(w.player, { x: 2.5, y: 3.5, angle: 0 });
  const s = ps.spawn('fog', 8.5, 3.5, 1.25);
  const at = (age) => {
    ps.age[s] = age;
    renderer.surface.clear(0);
    renderer.render(w, w.camera(), { skip: w.player });
    return renderer.surface.px.reduce((n, c) => n + (c === green), 0);
  };
  const [start, quarter, half, late] = [at(0), at(2.5), at(5), at(8)];
  assert.equal(start, 0, 'invisible when born');
  assert.ok(quarter > 0 && quarter < half, `fading in (${quarter} then ${half} pixels)`);
  assert.ok(late < half, `then out (${late})`);
});

test('a probe droid sparks only once its wreck has landed, in tight jets one way each', () => {
  const w = makeWorld(room(OPEN, ['', ' >'], { legend: { '.': ROOM } }), { noMonsters: true });
  const droid = w.spawn('probe-droid', 8.5, 3.5);
  droid.z = 0.9;
  const state = w.rng.state;
  w.damage(droid, 1000, w.player, w.player);
  assert.ok(droid.dead);
  assert.equal(w.particles.n, 0, 'nothing as it blows up');
  const ps = w.particles;
  const bursts = droid.corpseBursts;
  assert.ok(bursts >= 3 && bursts <= 5);
  let seen = 0;
  for (let k = 0; k < 6 * 60 && droid.corpseBursts > 0; k++) {
    const before = droid.corpseBursts;
    w.tick(DT, mockInput());
    if (droid.corpseBursts === before) continue;
    assert.ok(droid.animDone && droid.z === 0, 'only once it lies still');
    // The newest burst is at the end of the pool: its sparks fly much the same way.
    const jet = [];
    for (let i = 0; i < ps.n; i++) if (ps.age[i] < DT * 1.5) jet.push([ps.vx[i], ps.vy[i], ps.vz[i]].map((v, _, a) => v / Math.hypot(...a)));
    assert.equal(jet.length, 14);
    const mean = [0, 1, 2].map((c) => jet.reduce((s, v) => s + v[c], 0) / jet.length);
    assert.ok(Math.hypot(...mean) > 0.85, `clustered (mean length ${Math.hypot(...mean).toFixed(2)})`);
    seen++;
  }
  assert.equal(seen, bursts);
  assert.equal(w.rng.state, state, "the sparks don't touch the world's RNG");
});

test('death bursts come from the middle of the body as it dies', () => {
  const droid = content.things.find((t) => t.id === 'probe-droid');
  const reg = new Registry({ ...content, things: [...content.things.filter((t) => t !== droid), { ...droid, corpse: undefined, death: { particles: [{ type: 'shrapnel', count: 20 }] } }] });
  const w = makeWorld(room(OPEN, ['', ' >'], { legend: { '.': ROOM } }), { noMonsters: true, registry: reg });
  const d = w.spawn('probe-droid', 8.5, 3.5);
  w.damage(d, 1000, w.player, w.player);
  assert.equal(w.particles.n, 20);
  for (let i = 0; i < w.particles.n; i++) assert.equal(w.particles.z[i], Math.fround(d.z + d.height / 2));
});

test('the validator checks death and corpse bursts', () => {
  const droid = content.things.find((t) => t.id === 'probe-droid');
  const bad = new Registry({
    ...content,
    things: [
      ...content.things.filter((t) => t !== droid),
      { ...droid, death: { particles: [{ type: 'no-such', count: 0.5, speed: [-1], spread: 3 }] }, corpse: { bursts: 'x', every: [-1], particles: [{ type: 'nope' }] } },
    ],
  });
  const { errors } = validateContent(bad);
  const has = (s) => assert.ok(errors.some((e) => e.includes(s)), `expected "${s}" in ${JSON.stringify(errors)}`);
  for (const s of ['unknown particle type "no-such"', 'count', 'speed', 'spread']) has(s);
  has('corpse: unknown particle type "nope"');
  has('corpse: bursts');
  has('corpse: every');
});
