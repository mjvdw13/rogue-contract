import test from 'node:test';
import assert from 'node:assert/strict';
import content from '../src/content/index.js';
import { Registry } from '../src/engine/registry.js';
import { validateContent } from '../src/engine/validate.js';
import { defineTexture } from '../src/engine/defs.js';
import { room, headlessRenderer } from './helpers.js';

// A texture's `scroll`: its picture moves across the floors and ceilings
// it's on (water with a current), and nowhere else.

const ROWS = ['#######', '#.....#', '#.....#', '#.....#', '#######'];
const pool = () => room(ROWS, ['', '', ' >'], { legend: { '.': { floor: 'imp-floor', ceiling: 'imp-ceiling', light: 200 } } });
const CAM = { x: 1.5, y: 2.5, z: 1.25, angle: 0, pitch: 0 };

test('a scrolling floor is drawn further along as time passes, and back where it began after a whole picture', async () => {
  const { assets, shot } = await headlessRenderer();
  const tex = assets.textures[assets.textureSlot('imp-floor')];
  const turns = tex.w / 32;
  try {
    const level = pool();
    const still = shot(level, CAM);
    tex.scroll = [1, 0];
    tex.animate(0);
    assert.ok(Buffer.compare(shot(level, CAM), still) === 0, 'at the start it is where a still one is');
    tex.animate(turns / 2);
    const moved = shot(level, CAM);
    assert.ok(Buffer.compare(moved, still) !== 0, 'half a picture on, the floor has changed');
    const half = still.length / 2;
    assert.ok(Buffer.compare(moved.subarray(0, half), still.subarray(0, half)) === 0, 'the ceiling and the walls over the horizon have not');
    tex.animate(turns);
    assert.ok(Buffer.compare(shot(level, CAM), still) === 0, 'a whole picture on, it is back');
  } finally {
    tex.scroll = null;
    tex.off.fill(0);
  }
});

test('the validator rejects a scroll that is not two speeds, or on a sky, a fence or a decal', () => {
  const check = (extra) => validateContent(new Registry({ ...content, levels: [{ ...pool(), id: 'scroll-check-level' }], textures: [...content.textures, defineTexture({ id: 'scroll-check', src: 'assets/textures/imp-floor.png', ...extra })] })).errors.filter((e) => e.includes('scroll-check'));
  assert.deepEqual(check({ scroll: [0.3, -0.1] }), []);
  assert.match(check({ scroll: 0.3 })[0], /scroll/);
  assert.match(check({ scroll: [0.3, 'fast'] })[0], /scroll/);
  assert.match(check({ scroll: [0.3, 0], fence: true })[0], /only a floor/);
});
