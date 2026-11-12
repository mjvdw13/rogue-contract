import test from 'node:test';
import assert from 'node:assert/strict';
import { headlessRenderer, room } from './helpers.js';

// The side of a raised floor hangs its texture from a grid fixed in the
// world, not from its own top: the steps of a stair seen from its open side
// read as one wall, not a sawtooth.

const ROOM = { floor: 'imp-floor', ceiling: 'imp-ceiling', ceilZ: 4, light: 160 };
// A raised tile across column 8, its side 6.5 from the camera.
const step = (floorZ, extra) =>
  room(['##########', '#.......S#', '#.......S#', '#.......S#', '##########'], ['', ' >'], {
    legend: { '.': ROOM, '#': { wall: 'imp-panel' }, S: { ...ROOM, floorZ, side: 'imp-panel', ...extra } },
  });

const { renderer, shot } = await headlessRenderer();

test('two steps of different heights show the same texture at the same height', () => {
  const cam = { x: 1.5, y: 2.5, angle: 0, z: 1 };
  const { w } = renderer.surface;
  const { fy, horizon } = renderer.view;
  const x = w >> 1;
  const row = (z) => Math.ceil(horizon + ((cam.z - z) * fy) / 6.5 - 0.5);
  const column = (px, a, b) => Array.from({ length: b - a }, (_, k) => px[(a + k) * w + x]);
  // Over 0 to 0.75, which both steps' sides cover.
  const [a, b] = [row(0.75) + 1, row(0) - 1];
  assert.deepEqual(column(shot(step(0.75), cam), a, b), column(shot(step(1.5), cam), a, b), 'the side');
  // An open-ended band (up to the step's top) hangs from the grid too.
  const band = { bands: [{ from: 0.25, tex: 'sandstone' }] };
  const low = column(shot(step(0.75, band), cam), a, b);
  assert.deepEqual(low, column(shot(step(1.5, band), cam), a, b), 'the band');
  assert.notDeepEqual(low, column(shot(step(0.75), cam), a, b), 'and the band shows');
});
