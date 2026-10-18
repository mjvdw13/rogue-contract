import test from 'node:test';
import assert from 'node:assert/strict';
import content from '../src/content/index.js';
import { Registry } from '../src/engine/registry.js';
import { validateContent } from '../src/engine/validate.js';
import { headlessRenderer, makeWorld, mockInput, registry, room, run } from './helpers.js';

// Hangings (PLAN.md section 2): ropes and cloth hanging from fixed points,
// moving in the air. Cosmetic: these check that they hang, sway, stay
// pinned, sleep far away and draw where they should.

/** A yard under the sky, `w` tiles wide and 9 deep, the player at its west end facing east. */
function yard(hangings, extra = {}, w = 14) {
  const tiles = ['#'.repeat(w), ...Array.from({ length: 7 }, () => '#' + '_'.repeat(w - 2) + '#'), '#'.repeat(w)];
  return room(tiles, ['', '', '', '', ' >'], { hangings, ...extra });
}

/** Every point of the world's hangings, as [x, y, z]. */
function points(world) {
  const hs = world.hangings;
  return Array.from({ length: hs.n }, (_, i) => [hs.x[i], hs.y[i], hs.z[i]]);
}

test('a cable strung between two walls sags in the middle and holds that sag', () => {
  const world = makeWorld(yard([{ type: 'cable', from: [1.05, 4.5, 3], to: [12.95, 4.5, 3], sag: 0.5 }]));
  const lowest = () => Math.min(...points(world).map((p) => p[2]));
  assert.ok(Math.abs(lowest() - 2.5) < 0.15, `settled with its middle at ${lowest().toFixed(2)}`);
  run(world, mockInput(), 3);
  assert.ok(Math.abs(lowest() - 2.5) < 0.15, `still at ${lowest().toFixed(2)} after 3 s`);
});

test('a rope hangs straight down from where it is tied, its full length', () => {
  const world = makeWorld(yard([{ type: 'rope', from: [6.5, 4.5, 3], length: 2 }]));
  run(world, mockInput(), 2);
  const ps = points(world);
  const [x0, y0, z0] = ps[0];
  const [x1, y1, z1] = ps[ps.length - 1];
  assert.deepEqual([x0, y0, z0], [6.5, 4.5, 3]);
  assert.ok(z1 < 1.2 && z1 > 0.9, `its end hangs at ${z1.toFixed(2)}`);
  assert.ok(Math.hypot(x1 - x0, y1 - y0) < 0.5, 'and swings only a little');
});

test('pinned points never move, and the rest do', () => {
  const world = makeWorld(yard([{ type: 'rag', from: [5, 4.5, 3], to: [7, 4.5, 3], length: 1.5 }]));
  const hs = world.hangings;
  const before = points(world);
  run(world, mockInput(), 2);
  const after = points(world);
  let moved = 0;
  for (let i = 0; i < hs.n; i++) {
    if (!hs.free[i]) assert.deepEqual(after[i], before[i], `pinned point ${i} stays`);
    else if (Math.hypot(after[i][0] - before[i][0], after[i][1] - before[i][1]) > 1e-4) moved++;
  }
  assert.ok(moved > 0, 'the free points move in the breeze');
});

test("a cloth leans with the level's wind", () => {
  const cloth = [{ type: 'rag', from: [5, 4.5, 3], to: [7, 4.5, 3], length: 1.5 }];
  const lean = (wind) => {
    const world = makeWorld(yard(cloth, wind ? { weather: { type: 'dust', count: 1, wind } } : {}));
    run(world, mockInput(), 3);
    // How far east its hem hangs of its top, on average.
    const ps = points(world);
    const top = ps.filter((p) => p[2] > 2.99);
    const hem = ps.filter((p) => p[2] < 2.2);
    const mean = (list) => list.reduce((s, p) => s + p[0], 0) / list.length;
    return mean(hem) - mean(top);
  };
  const still = lean(null);
  const windy = lean([4, 0, 0]);
  assert.ok(windy > still + 0.1, `leans ${windy.toFixed(2)} east in the wind, ${still.toFixed(2)} in still air`);
});

test('a cloth tied against a wall sways, but never into the wall', () => {
  // Tied 0.05 out from the yard's north wall (its face at y 1), the wind blowing it at the wall.
  const level = yard([{ type: 'rag', from: [5, 1.05, 3], to: [7, 1.05, 3], length: 1.5 }], { weather: { type: 'dust', count: 1, wind: [0, -4, 0] } });
  const world = makeWorld(level);
  const before = points(world);
  for (let k = 0; k < 6; k++) {
    run(world, mockInput(), 0.5);
    for (const [, y] of points(world)) assert.ok(y > 1, `a point at y ${y.toFixed(3)} is in the wall`);
  }
  const moved = points(world).some((p, i) => Math.hypot(p[0] - before[i][0], p[2] - before[i][2]) > 1e-3);
  assert.ok(moved, 'and still moves');
});

test('hangings far from the player hold still', () => {
  const world = makeWorld(yard([{ type: 'rag', from: [90, 4.5, 3], to: [92, 4.5, 3], length: 1.5 }], {}, 100));
  const before = points(world);
  run(world, mockInput(), 1);
  assert.deepEqual(points(world), before);
});

test("hangings leave the game's random numbers alone", () => {
  const plain = makeWorld(yard([]));
  const hung = makeWorld(yard([{ type: 'rag', from: [5, 4.5, 3], to: [7, 4.5, 3], length: 1.5 }, { type: 'cable', from: [1.05, 4.5, 3], to: [12.95, 4.5, 3] }]));
  run(plain, mockInput(), 1);
  run(hung, mockInput(), 1);
  assert.equal(hung.rng.next(), plain.rng.next());
});

test('the validator checks a level\'s hangings', () => {
  const bad = (k, h) => room(['######', '#____#', '#____#', '######'], ['', ' >'], { id: `bad-hangings-${k}`, hangings: [h] });
  const levels = [
    bad(1, { type: 'washing', from: [1.5, 1.5, 1] }),
    bad(2, { type: 'rope', from: [0.5, 1.5, 1], length: 1 }),
    bad(3, { type: 'rag', from: [1.5, 1.5, 1], length: 1 }),
    bad(4, { type: 'rag', from: [1.5, 1.5, 1], to: [3.5, 1.5, 1], pin: 'middle' }),
    bad(5, { type: 'rope', from: [1.5, 1.5, -1], length: 1 }),
  ];
  const { errors } = validateContent(new Registry({ ...content, levels: [...content.levels, ...levels] }));
  const ours = (k) => errors.filter((e) => e.includes(`bad-hangings-${k}`));
  assert.ok(ours(1).some((e) => e.includes('unknown type "washing"')), ours(1).join('\n'));
  assert.ok(ours(2).some((e) => e.includes('inside a wall')), ours(2).join('\n'));
  assert.ok(ours(3).some((e) => e.includes('"to"')), ours(3).join('\n'));
  assert.ok(ours(4).some((e) => e.includes('"pin"')), ours(4).join('\n'));
  assert.ok(ours(5).some((e) => e.includes('below the floor')), ours(5).join('\n'));
});

const { shot } = await headlessRenderer();
const differs = (a, b) => a.some((v, i) => v !== b[i]);

test('a cable across the view draws over the wall behind it, and not through a wall in front', () => {
  const cable = [{ type: 'cable', from: [6, 1.05, 2], to: [6, 7.95, 2], sag: 0.3 }];
  const cam = { x: 1.5, y: 4.5, angle: 0, z: 1.25 };
  assert.ok(differs(shot(yard(cable), cam), shot(yard([]), cam)), 'the cable shows');
  // A wall right across the yard at x 4, between the eye and the cable.
  const walled = (h) => {
    const level = yard(h);
    level.tiles = level.tiles.map((r, y) => (y > 0 && y < 8 ? r.slice(0, 4) + '#' + r.slice(5) : r));
    return level;
  };
  assert.ok(!differs(shot(walled(cable), cam), shot(walled([]), cam)), 'none of it shows through the wall');
});

test('a cloth draws from either side', () => {
  const cloth = [{ type: 'rag', from: [6.5, 3.5, 2.5], to: [6.5, 5.5, 2.5], length: 1.5 }];
  for (const cam of [{ x: 1.5, y: 4.5, angle: 0, z: 1.25 }, { x: 11.5, y: 4.5, angle: Math.PI, z: 1.25 }]) {
    assert.ok(differs(shot(yard(cloth), cam), shot(yard([]), cam)), `seen looking ${cam.angle ? 'west' : 'east'}`);
  }
});

test("the scene shows through a cloth's transparent texels: its tears", () => {
  const cloth = [{ type: 'rag', from: [6.5, 3.5, 2.5], to: [6.5, 5.5, 2.5], length: 1.5 }];
  const cam = { x: 1.5, y: 4.5, angle: 0, z: 1.25 };
  const changed = (a, b) => a.reduce((n, v, i) => n + (v !== b[i]), 0);
  const empty = shot(yard([]), cam);
  const torn = changed(shot(yard(cloth), cam), empty);
  // The same cloth with no texture: plain colour, every cell solid.
  const def = registry.hangings.get('rag');
  const texture = def.texture;
  delete def.texture;
  try {
    const plain = changed(shot(yard(cloth), cam), empty);
    assert.ok(torn > 0 && torn < plain, `${torn} pixels torn, ${plain} plain`);
  } finally {
    def.texture = texture;
  }
});
