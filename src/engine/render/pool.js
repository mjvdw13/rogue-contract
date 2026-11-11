import { drawWorld, prepareWorld } from './columns.js';
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
export const ID_SHIFT = 12;
export const CHUNK_MASK = (1 << ID_SHIFT) - 1;
const ID_MASK = (1 << (31 - ID_SHIFT)) - 1;

/** Columns in a chunk, per unit of the view's scale. */
const CHUNK_COLUMNS = 16;
/** A frame's workers are given this long (ms) to finish before the pool is turned off. */
const PATIENCE = 250;

/**
 * Worker threads that share the world pass (`drawWorld`) with the main
 * thread. A column of the view depends on no other, so each frame the
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
 * drawing. If one dies, or they take over a quarter second, the pool is
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
   */
  drawWorld(view, scene, cam, textures, fb, colormaps) {
    if (!this.alive) return false;
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
    // Fences write the depth buffer: cleared here, not by whichever thread meets one first.
    if (map.fences.length && !view.depthValid) {
      view.mdepth.fill(Infinity);
      view.depthValid = true;
    }
    const W = view.W;
    const size = CHUNK_COLUMNS * view.scale;
    const id = (this.id = (this.id + 1) & ID_MASK);
    ctl[CHUNK] = size;
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
    };
    try {
      for (const w of this.workers) w.postMessage(msg);
    } catch {
      // (Something in the level that can't be copied to a worker.)
      Atomics.store(ctl, CLAIM, (id << ID_SHIFT) | CHUNK_MASK);
      this.stop();
      return false;
    }
    for (;;) {
      const v = Atomics.load(ctl, CLAIM);
      const x0 = (v & CHUNK_MASK) * size;
      if (x0 >= W) break;
      if (Atomics.compareExchange(ctl, CLAIM, v, v + 1) !== v) continue;
      drawWorld(view, map, textures, sky, fb, W, colormaps, backdrop, x0, x0 + size < W ? x0 + size : W);
    }
    // The chunks are all taken: wait for the workers still drawing theirs.
    if (Atomics.load(ctl, BUSY) !== 0) {
      const t0 = performance.now();
      for (let spins = 1; Atomics.load(ctl, BUSY) !== 0; spins++) {
        if ((spins & 1023) === 0 && performance.now() - t0 > PATIENCE) {
          this.stop();
          return false;
        }
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
