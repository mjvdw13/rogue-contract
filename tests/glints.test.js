import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLevel } from '../src/engine/world/level.js';
import { LightMap } from '../src/engine/world/lightmap.js';
import { falloff, GLINT_REACH } from '../src/engine/world/lightsources.js';
import { runActions } from '../src/engine/world/actions.js';
import { quantize } from '../src/engine/gfx/image.js';
import { Sheet } from '../src/engine/gfx/sheet.js';
import { Palette } from '../src/engine/gfx/palette.js';
import { World } from '../src/engine/world/world.js';
import { Rng } from '../src/engine/core/rng.js';
import { TRANSPARENT } from '../src/engine/config.js';
import { registry, room, headlessRenderer } from './helpers.js';

// Glints on armour (PLAN.md Phase 1d): marked highlight pixels on a sprite
// brighten with the light sources that can see it, even in shadow.

const ROOM = { floor: 'imp-floor', ceiling: 'imp-ceiling', ceilZ: 4, light: 64 };
const close = (a, b, msg, eps = 1e-3) => assert.ok(Math.abs(a - b) < eps, `${msg ?? ''} (${a} vs ${b})`);
const OPEN = ['#############', '#...........#', '#...........#', '#...........#', '#...........#', '#...........#', '#############'];
const palette = new Palette(registry.paletteDef);

function glinty(tiles, lights, extra = {}) {
  const built = buildLevel(registry, room(tiles, ['', ' >'], { ...extra, legend: { '.': ROOM, ...extra.legend }, lights }));
  return { ...built, gm: new LightMap(built.map, { glint: true }) };
}

/** RGBA pixels from rows of [r, g, b] (null: transparent). */
function rgba(rows) {
  const height = rows.length;
  const width = rows[0].length;
  const data = new Uint8Array(width * height * 4);
  rows.flat().forEach((c, i) => data.set(c ? [...c, 255] : [0, 0, 0, 0], i * 4));
  return { width, height, data };
}

test('quantize keeps a mask of glint pixels, snapped to lit colours, and snaps glow pixels to fullbright ones', () => {
  const W = [255, 255, 255];
  const G = [120, 120, 120];
  const img = quantize(rgba([[W, G, null], [G, W, W]]), palette, { glint: [W] });
  assert.deepEqual([...img.glint], [1, 0, 0, 0, 1, 1]);
  assert.ok(img.pixels[0] < palette.fullbrightStart, 'pure white is a glow colour, but a glint stays lit');
  assert.ok(quantize(rgba([[W]]), palette).pixels[0] >= palette.fullbrightStart, '(unmarked, it would glow)');
  assert.equal(quantize(rgba([[W, G]]), palette).glint, null, 'no list, no mask');
  assert.equal(quantize(rgba([[G]]), palette, { glint: [W] }).glint, null, 'no glint pixels, no mask');
  const glow = quantize(rgba([[[252, 252, 252], G]]), palette, { glow: [[252, 252, 252]] });
  assert.ok(glow.pixels[0] >= palette.fullbrightStart && glow.pixels[0] !== TRANSPARENT, 'a glow colour shines');
  assert.ok(glow.pixels[1] < palette.fullbrightStart, 'the rest stays lit');
});

test('a sheet cuts the glint mask into its frames, column-major, null where a frame has none', () => {
  const W = [255, 255, 255];
  const G = [120, 120, 120];
  // Two 2x2 frames side by side: glints in the first one only.
  const img = quantize(rgba([[W, G, G, G], [G, W, G, null]]), palette, { glint: [W] });
  const sheet = new Sheet(img, 2, 2);
  assert.deepEqual([...sheet.frame(0).glint], [1, 0, 0, 1]);
  assert.equal(sheet.frame(1).glint, null);
});

test('the stormtrooper\'s sheet carries its glint colours into the registry', () => {
  const t = registry.things.get('stormtrooper');
  assert.deepEqual(registry.sheets.get(t.sheet.ref).glint, [[255, 255, 255]]);
});

test('glint light comes from sources only, and reaches twice as far as their light', () => {
  const { map, gm, errors } = glinty(OPEN, [{ x: 4.5, y: 3.5, radius: 3, light: 90 }]);
  assert.deepEqual(errors, []);
  close(gm.sample(4.5, 3.5), 90, 'all of it at the centre, with no ambient light');
  close(gm.sample(9.5, 3.5), 90 * falloff(5, 3 * GLINT_REACH), 'past the light\'s radius it still glints');
  assert.equal(map.srcLight[0][map.index(9, 3)], 0, '(where the light itself doesn\'t reach)');
  const none = glinty(OPEN, [{ x: 4.5, y: 3.5, radius: 3, light: 90, glint: false }]);
  close(none.gm.sample(4.5, 3.5), 0, 'glint: false keeps a source out of it');
  assert.ok(none.map.srcLight[0][none.map.index(4, 3)] > 0, '(it still lights)');
});

test('walls block glint light, and setLight and dynamic lights change it', () => {
  const stub = ['#############', '#.....#.....#', '#.....#.....#', '#.....#.....#', '#...........#', '#...........#', '#############'];
  const { gm } = glinty(stub, [{ x: 3.5, y: 2.5, radius: 4, light: 90 }]);
  close(gm.sample(8.5, 2.5), 0, 'in the wall\'s shadow');
  assert.ok(gm.sample(8.5, 5.5) > 0, 'round the end of the wall');

  const w = new World({ registry, rng: new Rng(1), settings: { noMonsters: true } }, room(OPEN, ['', ' >'], { legend: { '.': ROOM }, lights: [{ x: 4.5, y: 3.5, radius: 3, light: 90, tag: 'lamp' }] }), { skill: 3 });
  assert.ok(w.glintmap.sample(9.5, 3.5) > 0);
  runActions(w, [{ action: 'setLight', tag: 'lamp', light: 0 }], {});
  w.tick(1 / 60, { isDown: () => false, wasPressed: () => false, endFrame() {}, analog: null });
  close(w.glintmap.sample(9.5, 3.5), 0, 'the lamp turned off');
  w.glintmap.setDynamic([{ x: 4.5, y: 3.5, radius: 3 * GLINT_REACH, light: 80 }]);
  w.glintmap.update();
  close(w.glintmap.sample(4.5, 3.5), 80, 'a flash adds to it');
});

test('glint pixels draw brighter where a source sees the sprite, and nothing changes without one', async () => {
  const { assets, renderer } = await headlessRenderer();
  /** Render a stormtrooper at (9.5, 3.5) seen from (3.5, 3.5): the frame, with and without glints. */
  const shots = (lights, { fullbright = false } = {}) => {
    const w = new World({ registry, assets, rng: new Rng(1), settings: { noMonsters: true } }, room(OPEN, ['', ' >'], { legend: { '.': ROOM }, lights }), { skill: 3 });
    const t = w.spawn('stormtrooper', 9.5, 3.5, Math.PI);
    t.fullbright = fullbright;
    Object.assign(w.player, { x: 3.5, y: 3.5, angle: 0 });
    const shot = () => {
      renderer.surface.clear(0);
      renderer.render(w, w.camera(), { skip: w.player });
      return Uint8Array.from(renderer.surface.px);
    };
    const on = shot();
    const gm = w.map.glintmap;
    w.map.glintmap = null;
    const off = shot();
    w.map.glintmap = gm;
    return { on, off, w };
  };
  const lum = (c) => palette.rgb[c * 3] * 0.3 + palette.rgb[c * 3 + 1] * 0.59 + palette.rgb[c * 3 + 2] * 0.11;
  // The lamp's light stops short of the trooper; its glint light reaches it.
  const lamp = [{ x: 6.5, y: 1.5, radius: 3, light: 120 }];
  const { on, off, w } = shots(lamp);
  assert.equal(w.map.srcLight[0][w.map.index(9, 3)], 0, '(the trooper stands in shadow)');
  let brighter = 0;
  for (let i = 0; i < on.length; i++) {
    if (on[i] === off[i]) continue;
    assert.ok(lum(on[i]) > lum(off[i]), 'only brighter');
    brighter++;
  }
  assert.ok(brighter > 0, 'some armour catches the lamp');
  const dark = shots([]);
  assert.deepEqual(dark.on, dark.off, 'no source about: plain lit');
  const glowing = shots(lamp, { fullbright: true });
  assert.deepEqual(glowing.on, glowing.off, 'a fullbright frame is already as bright as it gets');
});

test('the validator checks glint and glow colours', async () => {
  const { validateContent } = await import('../src/engine/validate.js');
  const { Registry } = await import('../src/engine/registry.js');
  const content = (await import('../src/content/index.js')).default;
  const sheet = { src: 'assets/sprites/monsters/stormtrooper.png', frameWidth: 64, frameHeight: 64, glint: [[300, 0, 0]], glow: 'white' };
  const things = content.things.map((t) => (t.id === 'stormtrooper' ? { ...t, sheet } : t));
  const { errors } = validateContent(new Registry({ ...content, things }));
  assert.equal(errors.filter((e) => /glint|glow/.test(e)).length, 2, errors.join('\n'));
});
