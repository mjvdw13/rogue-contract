// A worker thread of the world renderer's pool (render/pool.js, which
// says what the messages hold and how the columns are shared out). It keeps
// a copy of what `drawWorld` and `drawModels` read that isn't in shared
// memory, and draws the columns it claims of each frame: the world's, then
// the models'.
import { View } from './view.js';
import { drawWorld } from './columns.js';
import { drawModels } from './models.js';
import { CLAIM, BUSY, CHUNK, WORKED, WDONE, MCLAIM, MCHUNK, MWORKED, THING, ID_SHIFT, CHUNK_MASK } from './pool.js';
import { TileMap, Door } from '../world/tilemap.js';
import { Slant } from '../world/slants.js';
import { LightMap } from '../world/lightmap.js';
import { Backdrop } from '../world/backdrop.js';

/** @type {Int32Array} */
let ctl;
let textures = [];
/** @type {View} */
let view;
let fb;
let cms;
let map = null;
let backdrop = null;
let doorOpen = null;
/** The models, by the number the pool gave them. */
const models = [];
/** Stand-ins for the things with models, remade from their places each frame (and kept). */
const things = [];
/** The things' places, shared with the pool. */
let placed = null;

function handle(m) {
  if (m.ctl) ctl = m.ctl;
  if (m.textures) textures = m.textures;
  if (m.view) {
    view = new View(m.view.W, m.view.scale);
    Object.assign(view, m.view.buffers);
    fb = m.view.fb;
  }
  if (m.cms) cms = m.cms;
  if (m.scene) {
    // The copies come without their classes.
    map = Object.setPrototypeOf(m.scene.map, TileMap.prototype);
    for (const d of map.doors) Object.setPrototypeOf(d, Door.prototype);
    for (const s of map.slants) Object.setPrototypeOf(s, Slant.prototype);
    Object.setPrototypeOf(map.lightmap, LightMap.prototype);
    backdrop = m.scene.backdrop ? Object.setPrototypeOf(m.scene.backdrop, Backdrop.prototype) : null;
    doorOpen = m.scene.doorOpen;
  }
  if (m.frame) frame(m.frame);
}

function frame(f) {
  // What changed since the last frame, even if this one's columns are gone.
  if (f.anim) {
    for (let k = 0; k < f.anim.length; k += 2) {
      const t = textures[f.anim[k]];
      const fr = t.frames[f.anim[k + 1]];
      t.cur = fr.px;
      t.curCM = fr.cm;
    }
  }
  if (f.models?.added) for (const m of f.models.added) models.push(m);
  if (f.models?.buf) placed = f.models.buf;
  if ((Atomics.load(ctl, CLAIM) >>> ID_SHIFT) !== f.id) return;
  Atomics.add(ctl, BUSY, 1);
  try {
    const doors = map.doors;
    for (let k = 0; k < doors.length; k++) doors[k].open = doorOpen[k];
    view.setup(f.cam, f.fog, f.haze);
    view.depthValid = true;
    view.skyWrap = f.skyWrap;
    view.skyHaze = f.skyHaze;
    const sky = f.sky >= 0 ? textures[f.sky] : null;
    const W = view.W;
    const size = ctl[CHUNK];
    for (;;) {
      const v = Atomics.load(ctl, CLAIM);
      const x0 = (v & CHUNK_MASK) * size;
      if (v >>> ID_SHIFT !== f.id || x0 >= W) break;
      if (Atomics.compareExchange(ctl, CLAIM, v, v + 1) !== v) continue;
      drawWorld(view, map, textures, sky, fb, W, cms, backdrop, x0, x0 + size < W ? x0 + size : W);
      if (Atomics.add(ctl, WDONE, 1) + 1 === Math.ceil(W / size)) Atomics.notify(ctl, WDONE);
      Atomics.add(ctl, WORKED, 1);
    }
    if (f.models) drawThings(f, W, size);
  } finally {
    Atomics.sub(ctl, BUSY, 1);
  }
}

/** The models' pass: once every column of the world is drawn, the model chunks this thread claims. */
function drawThings(f, W, size) {
  const chunks = Math.ceil(W / size);
  // (Asleep, not spinning: a spinning thread slows the one sharing its core.)
  for (let v; (v = Atomics.load(ctl, WDONE)) < chunks; ) {
    if (Atomics.load(ctl, CLAIM) >>> ID_SHIFT !== f.id) return;
    Atomics.wait(ctl, WDONE, v, 2);
  }
  const p = placed;
  const n = f.models.n;
  things.length = n;
  for (let k = 0, o = 0; k < n; k++, o += THING) {
    const t = (things[k] ??= { model: null, x: 0, y: 0, z: 0, angle: 0, bobZ: 0, bobRoll: 0, def: { scale: 1 }, fixedLight: -1 });
    t.model = models[p[o]];
    t.x = p[o + 1];
    t.y = p[o + 2];
    t.z = p[o + 3];
    t.angle = p[o + 4];
    t.bobZ = p[o + 5];
    t.bobRoll = p[o + 6];
    t.def.scale = p[o + 7];
    t.fixedLight = p[o + 8];
  }
  const msize = ctl[MCHUNK];
  for (;;) {
    const v = Atomics.load(ctl, MCLAIM);
    const x0 = (v & CHUNK_MASK) * msize;
    if (v >>> ID_SHIFT !== f.id || x0 >= W) break;
    if (Atomics.compareExchange(ctl, MCLAIM, v, v + 1) !== v) continue;
    drawModels(view, things, map, textures, fb, W, cms, null, x0, x0 + msize);
    Atomics.add(ctl, MWORKED, 1);
  }
}

// A web worker, or one of Node's (the tests and tools/bench.mjs).
if (typeof self !== 'undefined' && typeof self.postMessage === 'function') {
  self.onmessage = (e) => handle(e.data);
} else {
  const { parentPort } = await import('node:worker_threads');
  parentPort.on('message', handle);
}
