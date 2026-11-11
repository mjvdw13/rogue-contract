/**
 * Whether typed arrays can be shared with worker threads here: in a page
 * that is cross-origin isolated (see sw.js), and in Node.
 */
export const CAN_SHARE = typeof SharedArrayBuffer !== 'undefined' && globalThis.crossOriginIsolated !== false;

/**
 * A typed array of `n` zeros that worker threads can be handed without a
 * copy (render/pool.js), where the page may share memory; a plain one
 * elsewhere. For what the world renderer reads and writes: the framebuffer,
 * the view's buffers, the map's arrays, the textures.
 * @template T
 * @param {new (b: any) => T} Type e.g. Uint8Array
 * @param {number} n its length
 * @returns {T}
 */
export function shared(Type, n) {
  return CAN_SHARE ? new Type(new SharedArrayBuffer(n * Type.BYTES_PER_ELEMENT)) : new Type(n);
}
