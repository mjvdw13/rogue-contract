/** Smooth value noise in 0-1 over cells of `size` tiles (for painting levels). */
export function valueNoise(x, y, size, seed) {
  const h = (i, j) => {
    let v = Math.imul(i * 374761393 + j * 668265263 + seed * 1442695041, 1274126177);
    v = Math.imul(v ^ (v >>> 13), 1103515245);
    return ((v ^ (v >>> 16)) >>> 0) / 4294967296;
  };
  const fx = x / size;
  const fy = y / size;
  const i = Math.floor(fx);
  const j = Math.floor(fy);
  const u = (fx - i) * (fx - i) * (3 - 2 * (fx - i));
  const v = (fy - j) * (fy - j) * (3 - 2 * (fy - j));
  const a = h(i, j) + (h(i + 1, j) - h(i, j)) * u;
  const b = h(i, j + 1) + (h(i + 1, j + 1) - h(i, j + 1)) * u;
  return a + (b - a) * v;
}

/** 0 below `a`, 1 above `b`, smooth between. */
export const smoothstep = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
