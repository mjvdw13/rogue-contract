import test from 'node:test';
import assert from 'node:assert/strict';
import { Backdrop, checkBackdrop } from '../src/engine/world/backdrop.js';
import { buildLevel } from '../src/engine/world/level.js';
import { TRANSPARENT } from '../src/engine/config.js';
import { headlessRenderer, registry, room } from './helpers.js';

// The backdrop (Phase 1d, Mark's semi-3D skyline): terrain past the edge of
// play, drawn where the sky shows.

/** A 4 x 4 cell grid from (-2, -2), one tile a cell, rising eastward by 2 a tile. */
const ramp = () => {
  const heights = [];
  for (let j = 0; j <= 4; j++) for (let i = 0; i <= 4; i++) heights.push(i * 2);
  return { x: -2, y: -2, cell: 1, w: 4, h: 4, heights, tex: 'sandstone' };
};

test('heights blend between the grid\'s corners, and are -Infinity off it', () => {
  const bd = new Backdrop(ramp(), () => 0);
  assert.equal(bd.heightAt(-2, -2), 0);
  assert.equal(bd.heightAt(-0.5, 0), 3);
  assert.equal(bd.heightAt(1.25, 1), 6.5);
  assert.equal(bd.heightAt(-3, 0), -Infinity);
  assert.equal(bd.heightAt(0, 2.5), -Infinity);
});

test('slopes facing the moon are lit brighter', () => {
  const east = new Backdrop({ ...ramp(), moon: [1, 0, 1] }, () => 0);
  const west = new Backdrop({ ...ramp(), moon: [-1, 0, 1] }, () => 0);
  // The ramp rises eastward, so it faces west.
  assert.ok(west.lightAt(0, 0) > east.lightAt(0, 0));
});

test('the texture runs along a face, fixed to the world whichever way it is seen', () => {
  // The ramp faces west, so its texture runs along y, like a wall's.
  const bd = new Backdrop(ramp(), () => 0);
  assert.equal(bd.faceU(0.5, 1.25), 1.25);
  assert.equal(bd.faceU(-1, -0.75), -0.75);
  // Turned to face north, it runs along x.
  const heights = [];
  for (let j = 0; j <= 4; j++) for (let i = 0; i <= 4; i++) heights.push(j * 2);
  assert.equal(new Backdrop({ ...ramp(), heights }, () => 0).faceU(0.5, 1.25), 0.5);
});

test('a bad backdrop is a level error', () => {
  assert.deepEqual(checkBackdrop(ramp()), []);
  const errors = checkBackdrop({ ...ramp(), heights: [1, 2], tex: undefined });
  assert.equal(errors.length, 2, errors.join('\n'));
  assert.match(errors.join(' '), /"tex"/);
  assert.match(errors.join(' '), /25 "heights"/);
  const { errors: built } = buildLevel(registry, room(['###', '#.#', '###'], ['', ' >'], { backdrop: { ...ramp(), cell: 0 } }));
  assert.ok(built.some((e) => /"cell"/.test(e)));
});

const { renderer, shot } = await headlessRenderer();

test('the backdrop shows where the sky did, and nowhere else', () => {
  // An open-sky yard, looking east at a low wall with a mountain behind it.
  const yard = ['##########', '#........#', '#........#', '#........#', '##########'];
  const legend = { '.': { floor: 'imp-floor', ceiling: 'sky', ceilZ: 3, light: 160 } };
  const heights = [];
  for (let j = 0; j <= 20; j++) for (let i = 0; i <= 40; i++) heights.push(i > 20 ? 6 + (i - 20) : 0);
  const mountain = { x: -10, y: -8, cell: 1, w: 40, h: 20, heights, tex: 'sandstone' };
  const cam = { x: 1.5, y: 2.5, angle: 0, z: 1 };
  const plain = shot(room(yard, ['', ' >'], { legend, sky: 'sky-night' }), cam);
  const hills = shot(room(yard, ['', ' >'], { legend, sky: 'sky-night', backdrop: mountain }), cam);
  const { w, h } = renderer.surface;
  const { fy, horizon } = renderer.view;
  // The wall (x 9, 7.5 away) tops out at 3; the mountain rises behind it.
  const wallTop = Math.ceil(horizon + ((cam.z - 3) * fy) / 7.5 - 0.5);
  let changedAbove = 0;
  for (let i = 0; i < plain.length; i++) {
    if (plain[i] === hills[i]) continue;
    const y = (i / w) | 0;
    assert.ok(y < wallTop, `only above the wall (row ${y})`);
    changedAbove++;
  }
  assert.ok(changedAbove > w * 5, `the mountain shows over the wall (${changedAbove} pixels)`);
  assert.equal(renderer.view.bdBuf.length, w * h);
  assert.ok(renderer.view.bdBuf.some((c) => c !== TRANSPARENT));
});
