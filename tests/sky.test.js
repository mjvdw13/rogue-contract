import test from 'node:test';
import assert from 'node:assert/strict';
import content from '../src/content/index.js';
import { Registry } from '../src/engine/registry.js';
import { defineLevel } from '../src/engine/defs.js';
import { validateContent } from '../src/engine/validate.js';
import { headlessRenderer, room } from './helpers.js';

// The sky's texture goes round the horizon twice by default; a level's
// `skyWrap: 1` takes it round once, so a sunset's glow is on one side only.

const OPEN = { floor: 'imp-floor', ceiling: 'sky', ceilZ: 24, light: 160 };
const TILES = ['#####', '#...#', '#...#', '#...#', '#####'];
const level = (extra) => ({ ...room(TILES, ['', '  >'], { legend: { '.': OPEN, '#': { wall: 'imp-panel' } } }), sky: 'sky-day', ...extra });

const { renderer, shot } = await headlessRenderer();
/** The sky's texel column under each screen column, looking `angle` (radians). */
const skyCols = (lv, angle) => {
  shot(lv, { x: 2.5, y: 2.5, angle, z: 1 });
  return Array.from(renderer.view.skyU);
};

test('a sky that wraps twice looks the same behind you; once, it does not', () => {
  assert.deepEqual(skyCols(level({}), 0), skyCols(level({}), Math.PI), 'twice round: the same half ahead and behind');
  const once = level({ skyWrap: 1 });
  const ahead = skyCols(once, 0);
  const behind = skyCols(once, Math.PI);
  const w = Math.max(...ahead, ...behind) + 1;
  assert.notDeepEqual(ahead, behind);
  // Half a turn round is half the texture along.
  const w2 = renderer.assets.textures[renderer.assets.textureSlot('sky-day')].w;
  assert.ok(w <= w2);
  ahead.forEach((u, i) => assert.ok(Math.abs(((behind[i] - u + w2) % w2) - w2 / 2) <= 1, `column ${i}: ${u} and ${behind[i]}`));
});

test('a skyWrap that isn\'t a whole number of turns is an error', () => {
  const levels = [0, 1.5].map((skyWrap, k) => defineLevel({ ...level({ skyWrap }), id: `bad${k}` }));
  const { errors } = validateContent(new Registry({ ...content, levels }));
  assert.equal(errors.filter((e) => e.includes('skyWrap')).length, 2, errors.join('\n'));
});
