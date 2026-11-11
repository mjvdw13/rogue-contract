// The world renderer's pool of worker threads (src/engine/render/pool.js),
// on Node's worker_threads, for the tests and tools/bench.mjs.
import { Worker } from 'node:worker_threads';
import { WorldPool } from '../../src/engine/render/pool.js';

/**
 * A pool of `workers` worker threads (the main thread draws as well). They
 * don't keep the process running; `pool.stop()` ends them.
 */
export function nodePool(workers) {
  return new WorldPool(workers, () => {
    const w = new Worker(new URL('../../src/engine/render/worker.js', import.meta.url));
    w.unref();
    return w;
  });
}
