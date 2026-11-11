import test from 'node:test';
import assert from 'node:assert/strict';
import { registry, headlessRenderer } from './helpers.js';
import { World } from '../src/engine/world/world.js';
import { Rng } from '../src/engine/core/rng.js';
import { Renderer } from '../src/engine/render/renderer.js';
import { WorldPool } from '../src/engine/render/pool.js';
import { F_SOLID, F_VOID } from '../src/engine/world/tilemap.js';
import { nodePool } from '../tools/lib/threads.mjs';

const still = { isDown: () => false, wasPressed: () => false, endFrame() {}, analog: null };

/** Views of a level as it plays: `each(world, cam, k)` at `n` seeded spots, a sixth of a second of play between them. */
function tour(assets, id, n, each) {
  const world = new World({ registry, assets, rng: new Rng(1), settings: {} }, registry.levels.get(id), { skill: 3 });
  const map = world.map;
  const open = [];
  for (let i = 0; i < map.w * map.h; i++) if (!(map.flags[i] & (F_SOLID | F_VOID))) open.push(i);
  const rng = new Rng(11);
  const pt = world.player;
  for (let k = 0; k < n; k++) {
    for (let t = 0; t < 10; t++) world.tick(1 / 60, still);
    // (Half the views with every door part open.)
    if (k * 2 >= n) for (const d of map.doors) d.open = 0.2 + 0.6 * rng.next();
    const i = open[Math.floor(rng.next() * open.length)];
    pt.x = (i % map.w) + 0.5;
    pt.y = Math.floor(i / map.w) + 0.5;
    pt.angle = rng.next() * Math.PI * 2;
    pt.z = world.floorAt(pt.x, pt.y, pt.radius, -Infinity);
    each(world, world.camera(), k);
  }
}

test('the world drawn on worker threads is the same, to the byte, as on one', async () => {
  const { assets, palette, renderer } = await headlessRenderer();
  const surface = renderer.surface;
  const threaded = new Renderer(surface, assets, palette);
  const pool = nodePool(3);
  threaded.pool = pool;
  try {
    const draw = (r, world, cam) => {
      surface.clear(0);
      r.render(world, cam, { skip: world.player });
      return Uint8Array.from(surface.px);
    };
    // Until the workers are up, the main thread draws every column itself.
    for (let tries = 0; tries < 500 && pool.workerChunks === 0; tries++) {
      tour(assets, 'sandbox', 2, (world, cam) => draw(threaded, world, cam));
      await new Promise((done) => setTimeout(done, 20));
    }
    assert.ok(pool.workerChunks > 0, 'the workers drew some columns');
    for (const level of registry.levels.values()) {
      tour(assets, level.id, 24, (world, cam, k) => {
        const one = draw(renderer, world, cam);
        const many = draw(threaded, world, cam);
        assert.ok(Buffer.compare(one, many) === 0, `${level.id}, view ${k} at ${cam.x},${cam.y}`);
        assert.deepEqual(threaded.view.zbuf, renderer.view.zbuf, `${level.id}, view ${k}: the columns' depths`);
      });
    }
    assert.ok(pool.alive, 'the pool is still on');
  } finally {
    pool.stop();
  }
});

test('a pool whose workers fail turns itself off, and the frame is drawn on one thread', async () => {
  const { assets, palette, renderer } = await headlessRenderer();
  const surface = renderer.surface;
  const broken = new Renderer(surface, assets, palette);
  let ended = 0;
  const pool = new WorldPool(2, () => ({
    on() {},
    postMessage(m) {
      if (m.frame) throw new Error('gone');
    },
    terminate() {
      ended++;
    },
  }));
  broken.pool = pool;
  tour(assets, 'sandbox', 3, (world, cam) => {
    surface.clear(0);
    renderer.render(world, cam, { skip: world.player });
    const one = Uint8Array.from(surface.px);
    surface.clear(0);
    broken.render(world, cam, { skip: world.player });
    assert.ok(Buffer.compare(one, surface.px) === 0);
  });
  assert.equal(pool.alive, false);
  assert.equal(ended, 2);
});
