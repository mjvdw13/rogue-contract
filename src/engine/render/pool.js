import { drawWorld, prepareWorld } from './columns.js';
import { drawModels, NEAR } from './models.js';
import { CAN_SHARE } from '../core/shared.js';

// The control words the threads share (an Int32Array):
/** The frame's number (from bit ID_SHIFT up) and the next chunk of columns nobody has taken. */
export const CLAIM = 0;
/** How many workers are drawing. */
export const BUSY = 1;
/** Columns in a chunk. */
export const CHUNK = 2;
/** Chunks workers have drawn, ever (the tests look). */
export const WORKED = 3;
/** The world's chunks drawn this frame: the models wait for them all. */
export const WDONE = 4;
/** The frame's number and the next chunk of model columns nobody has taken (as CLAIM). */
export const MCLAIM = 5;
/** Columns in a chunk of the models' pass. */
export const MCHUNK = 6;
/** Chunks of model columns workers have drawn, ever (the tests look). */
export const MWORKED = 7;
/** Numbers a thing's place takes in a frame's message: model, x, y, z, angle, bobZ, bobRoll, scale, fixedLight. */
export const THING = 9;
export const ID_SHIFT = 12;
export const CHUNK_MASK = (1 << ID_SHIFT) - 1;
const ID_MASK = (1 << (31 - ID_SHIFT)) - 1;

/** Columns in a chunk, per unit of the view's scale. */
const CHUNK_COLUMNS = 16;
/**
 * Columns in a chunk of the models' pass, per unit of the view's scale:
 * wider, as a model is set up again in each chunk it reaches (20 and 40
 * measured alike, 80 slower).
 */
const MODEL_COLUMNS = 40;
/** A frame's workers are given this long (ms) to finish before the pool is turned off. */
const PATIENCE = 250;

/**
 * Worker threads that share the world pass (`drawWorld`), and then the
 * models (`drawModels`), with the main thread. A column of the view depends on no other, so each frame the
 * columns go out in chunks of 16 from a shared counter, to whichever thread
 * asks next (the busy part of a view gets shared out, not left to one
 * thread), and the main thread draws too. The picture is the same to the
 * byte as one thread's.
 *
 * What `drawWorld` reads and writes is in shared memory (core/shared.js):
 * the framebuffer, the view's buffers, the map's arrays, the light map,
 * the textures, the colormaps. The rest a worker keeps a copy of
 * (render/worker.js), sent when it changes: the textures' sizes (once), the
 * view's size, and a level's doors, angled walls, fences, wall bands,
 * decals and backdrop, none of which change after a level is built except
 * how far each door is open, which goes in a shared array each frame. A
 * frame's message then holds only the camera.
 *
 * Messages are how a frame starts, so a worker can wake late: it then finds
 * the frame's columns gone, or the next frame begun (the frame's number is
 * in the counter, and a chunk is claimed by compare-and-exchange), and
 * draws nothing. The main thread waits only for the workers that are
 * drawing.
 *
 * The models go over the world, so they wait until its columns are all
 * drawn; then they go out in chunks of 40 columns the same way. A model
 * comes out the same whichever chunk draws it, as each pixel still sees the
 * models in the same order. The models themselves are sent once (only
 * cloths change shape, and they are drawn after, on the main thread); each
 * frame the places of the things in front of the camera go in a shared
 * array (Mos Eisley has 1,300 things with models: copying them all to
 * every worker cost 0.6 ms a frame). If one dies, or they take over a quarter second, the pool is
 * turned off for good and the caller draws the frame itself.
 */
export class WorldPool {
  /**
   * @param {number} workers how many worker threads (the main thread draws as well)
   * @param {() => any} spawn makes one: a web Worker or one of Node's worker_threads, running render/worker.js
   */
  constructor(workers, spawn) {
    this.alive = CAN_SHARE && workers > 0;
    this.workers = [];
    if (!this.alive) return;
    this.ctl = new Int32Array(new SharedArrayBuffer(16 * 4));
    this.id = 0;
    // What the workers were last sent.
    this.sent = { textures: null, count: 0, zbuf: null, fb: null, cms: null, map: null, blockTops: null };
    this.animFrame = new Map();
    this.doorOpen = null;
    /** The models sent to the workers, by their number there. */
    this.modelIds = new Map();
    /** The things' places (THING numbers each), shared with the workers; grown as needed. */
    this.placed = new Float64Array(new SharedArrayBuffer(64 * THING * 8));
    this.sentPlaced = null;
    /** The same things, for this thread's share. */
    this.visible = [];
    /** Whether the last frame's models were drawn here, and when the world was done (ms after the start). */
    this.drewModels = false;
    this.worldMs = 0;
    try {
      for (let k = 0; k < workers; k++) {
        const w = spawn();
        const die = () => this.stop();
        if (w.addEventListener) {
          w.addEventListener('error', die);
          w.addEventListener('messageerror', die);
        } else w.on('error', die);
        w.postMessage({ ctl: this.ctl });
        this.workers.push(w);
      }
    } catch {
      this.stop();
    }
  }

  /** Threads drawing, the main one included. */
  get threads() {
    return this.alive ? this.workers.length + 1 : 1;
  }

  /** Chunks of columns the workers have drawn, ever. */
  get workerChunks() {
    return this.alive ? Atomics.load(this.ctl, WORKED) : 0;
  }

  /** Chunks of model columns the workers have drawn, ever. */
  get workerModelChunks() {
    return this.alive ? Atomics.load(this.ctl, MWORKED) : 0;
  }

  /** Turn the pool off, for good. */
  stop() {
    this.alive = false;
    for (const w of this.workers) w.terminate();
    this.workers.length = 0;
  }

  /**
   * Draw the world as `drawWorld` does, on every thread. Returns false if
   * the pool is off or failed (the caller then draws the frame itself).
   * @param {import('./view.js').View} view set up for the frame
   * @param {object} scene the Renderer's (the World)
   * @param {{x:number, y:number, angle:number}} cam what the view was set up from
   * @param {any[]|null} [things] with these, the models are drawn too (`drewModels`)
   * @param {any} [skip] the thing not to draw (the player)
   */
  drawWorld(view, scene, cam, textures, fb, colormaps, things = null, skip = null) {
    this.drewModels = false;
    if (!this.alive) return false;
    const t0 = performance.now();
    const map = scene.map;
    const sky = scene.skyTexture ?? null;
    const backdrop = scene.backdrop ?? null;
    const { ctl, sent } = this;
    prepareWorld(map, textures);
    const msg = {};
    if (sent.textures !== textures || sent.count !== textures.length) {
      sent.textures = textures;
      sent.count = textures.length;
      msg.textures = textures;
      this.animFrame.clear();
    }
    if (sent.zbuf !== view.zbuf || sent.fb !== fb) {
      sent.zbuf = view.zbuf;
      sent.fb = fb;
      const { zbuf, segDist, segTop, segBot, segFirst, segCount, mdepth } = view;
      msg.view = { W: view.W, scale: view.scale, fb, buffers: { zbuf, segDist, segTop, segBot, segFirst, segCount, mdepth } };
    }
    if (sent.cms !== colormaps) {
      sent.cms = colormaps;
      msg.cms = colormaps;
    }
    if (sent.map !== map || sent.blockTops !== map.blockTops) {
      sent.map = map;
      sent.blockTops = map.blockTops;
      this.doorOpen = new Float32Array(new SharedArrayBuffer(Math.max(1, map.doors.length) * 4));
      msg.scene = { map: mapCopy(map), backdrop, doorOpen: this.doorOpen };
    }
    // Animated textures whose frame has changed.
    let anim = null;
    for (let k = 0; k < textures.length; k++) {
      const t = textures[k];
      if (t.frames.length < 2) continue;
      let f = 0;
      while (t.frames[f].px !== t.cur) f++;
      if (this.animFrame.get(k) === f) continue;
      this.animFrame.set(k, f);
      (anim ??= []).push(k, f);
    }
    const doors = map.doors;
    for (let k = 0; k < doors.length; k++) this.doorOpen[k] = doors[k].open;
    // The things with models in front of the camera (as drawModels first
    // culls them): each one's place, and the models the workers haven't had.
    let placed = 0;
    let added = null;
    const visible = this.visible;
    visible.length = 0;
    if (things) {
      const { x: px, y: py, dirX, dirY, planeX, planeY } = view;
      const invDet = 1 / (planeX * dirY - dirX * planeY);
      let o = 0;
      for (const t of things) {
          if (!t.model || t === skip || t.removed || t.hidden) continue;
          const r = t.model.radius * (t.def?.scale ?? 1);
          const cdx = t.x - px;
          const cdy = t.y - py;
          const cDepth = invDet * (-planeY * cdx + planeX * cdy);
          if (cDepth + r < NEAR) continue;
          const cTx = invDet * (dirY * cdx - dirX * cdy);
          if (Math.abs(cTx) - r > cDepth + r) continue;
          if (o + THING > this.placed.length) {
            const bigger = new Float64Array(new SharedArrayBuffer(this.placed.length * 2 * 8));
            bigger.set(this.placed);
            this.placed = bigger;
          }
          placed++;
          visible.push(t);
          let mi = this.modelIds.get(t.model);
          if (mi === undefined) {
            mi = this.modelIds.size;
            this.modelIds.set(t.model, mi);
            (added ??= []).push(t.model);
          }
          const p = this.placed;
          p[o] = mi;
          p[o + 1] = t.x;
          p[o + 2] = t.y;
          p[o + 3] = t.z ?? 0;
          p[o + 4] = t.angle ?? 0;
          p[o + 5] = t.bobZ ?? 0;
          p[o + 6] = t.bobRoll ?? 0;
          p[o + 7] = t.def?.scale ?? 1;
          p[o + 8] = t.fixedLight >= 0 ? t.fixedLight : -1;
          o += THING;
      }
    }
    // Fences and models write the depth buffer: cleared here, not by whichever thread meets one first.
    if ((map.fences.length || placed) && !view.depthValid) {
      view.mdepth.fill(Infinity);
      view.depthValid = true;
    }
    const W = view.W;
    const size = CHUNK_COLUMNS * view.scale;
    const msize = MODEL_COLUMNS * view.scale;
    const id = (this.id = (this.id + 1) & ID_MASK);
    ctl[CHUNK] = size;
    ctl[MCHUNK] = msize;
    Atomics.store(ctl, WDONE, 0);
    Atomics.store(ctl, MCLAIM, id << ID_SHIFT);
    Atomics.store(ctl, CLAIM, id << ID_SHIFT);
    msg.frame = {
      id,
      cam: { x: cam.x, y: cam.y, angle: cam.angle, z: cam.z, horizonOffset: cam.horizonOffset, extraLight: cam.extraLight, fixedColormap: cam.fixedColormap },
      fog: view.fog,
      haze: scene.haze ? { half: scene.haze.half } : null,
      skyWrap: view.skyWrap,
      skyHaze: view.skyHaze,
      sky: sky ? textures.indexOf(sky) : -1,
      anim,
      models: placed ? { added, n: placed, buf: this.sentPlaced !== this.placed ? (this.sentPlaced = this.placed) : null } : null,
    };
    try {
      for (const w of this.workers) w.postMessage(msg);
    } catch {
      // (Something in the level that can't be copied to a worker.)
      Atomics.store(ctl, CLAIM, (id << ID_SHIFT) | CHUNK_MASK);
      Atomics.store(ctl, MCLAIM, (id << ID_SHIFT) | CHUNK_MASK);
      this.stop();
      view.depthValid = false;
      return false;
    }
    for (;;) {
      const v = Atomics.load(ctl, CLAIM);
      const x0 = (v & CHUNK_MASK) * size;
      if (x0 >= W) break;
      if (Atomics.compareExchange(ctl, CLAIM, v, v + 1) !== v) continue;
      drawWorld(view, map, textures, sky, fb, W, colormaps, backdrop, x0, x0 + size < W ? x0 + size : W);
      if (Atomics.add(ctl, WDONE, 1) + 1 === Math.ceil(W / size)) Atomics.notify(ctl, WDONE);
    }
    if (placed) {
      // The models go over what the world drew, so every column of it must be done first.
      const chunks = Math.ceil(W / size);
      if (!this.wait(() => Atomics.load(ctl, WDONE) < chunks)) {
        view.depthValid = false;
        return false;
      }
      this.worldMs = performance.now() - t0;
      for (;;) {
        const v = Atomics.load(ctl, MCLAIM);
        const x0 = (v & CHUNK_MASK) * msize;
        if (x0 >= W) break;
        if (Atomics.compareExchange(ctl, MCLAIM, v, v + 1) !== v) continue;
        drawModels(view, visible, map, textures, fb, W, colormaps, null, x0, x0 + msize);
      }
    }
    // The chunks are all taken: wait for the workers still drawing theirs.
    if (!this.wait(() => Atomics.load(ctl, BUSY) !== 0)) {
      view.depthValid = false;
      return false;
    }
    // (With no thing in front of the camera there was nothing to draw.)
    if (things) this.drewModels = true;
    else this.worldMs = performance.now() - t0;
    return true;
  }

  /** Spin while `busy()`; false (and the pool turned off) if that takes over PATIENCE. */
  wait(busy) {
    if (!busy()) return true;
    const t0 = performance.now();
    for (let spins = 1; busy(); spins++) {
      if ((spins & 1023) === 0 && performance.now() - t0 > PATIENCE) {
        this.stop();
        return false;
      }
    }
    return true;
  }
}

/** What `drawWorld` reads of a map: the shared arrays as they are, the rest to be copied. */
function mapCopy(map) {
  const lm = map.lightmap;
  const copy = { lightmap: { cw: lm.cw, ch: lm.ch, cells: lm.cells, pending: [] }, decalsDirty: false };
  for (const k of [
    'w', 'h', 'flags', 'wallTex', 'floorTex', 'ceilTex', 'floorZ', 'ceilZ', 'sideTex', 'upperTex', 'seen',
    'slabBot', 'slabTop', 'slabTopTex', 'slabUnderTex', 'slabSideTex',
    'doorIndex', 'doors', 'slantIndex', 'slants', 'fences', 'fenceAt', 'bandIndex', 'bandSets',
    'decals', 'edgeDecals', 'decalEdge', 'slantDecals',
    'skyline', 'blockTops', 'blockW', 'blockH', 'skyMargin',
  ]) {
    copy[k] = map[k];
  }
  return copy;
}

/** A pool of web workers: one a logical core less one, 7 at most, or `workers` of them. */
export function browserPool(workers = Math.min(7, (globalThis.navigator?.hardwareConcurrency ?? 1) - 1)) {
  return new WorldPool(workers, () => new Worker(new URL('./worker.js', import.meta.url), { type: 'module' }));
}
