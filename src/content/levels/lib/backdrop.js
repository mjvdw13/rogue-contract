import { valueNoise, smoothstep } from './noise.js';

/**
 * A backdrop for a painted canyon level (see world/backdrop.js): rock that
 * starts at the canyon's rim and climbs away from the level's open sky, out
 * to `margin` tiles past the map, in smooth slopes and ridges (no steps, so
 * it reads as ground going up and back), with valleys between the far
 * ridges so they stand apart in layers.
 *
 * @param {import('./painter.js').Painter} p the painted level
 * @param {{margin?:number, cell?:number, seed?:number, rim:(x:number, y:number, base:number)=>number,
 *   tex:string, light?:number, moon?:number[], far?:number}} opts `rim` gives the
 *   rim's height next to the open floor at `base` (the level's own rim tiles)
 */
export function canyonBackdrop(p, { margin = 96, cell = 1, seed = 1, rim, ...look }) {
  const W = p.w + 2 * margin;
  const H = p.h + 2 * margin;
  // Distance from the open sky (a chamfer distance transform), carrying the
  // floor height of the nearest open tile.
  const dist = new Float32Array(W * H).fill(1e9);
  const base = new Float32Array(W * H);
  for (let y = 0; y < p.h; y++) {
    for (let x = 0; x < p.w; x++) {
      const c = p.get(x, y);
      // (Open sky the player can be under: not walls, doors, or scenery ledges.)
      if (c.wall || c.door || c.scenery || c.ceiling !== 'sky') continue;
      const k = (y + margin) * W + x + margin;
      dist[k] = 0;
      base[k] = c.floorZ ?? 0;
    }
  }
  const relax = (k, n, cost) => {
    if (dist[n] + cost < dist[k]) {
      dist[k] = dist[n] + cost;
      base[k] = base[n];
    }
  };
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const k = y * W + x;
      if (x > 0) relax(k, k - 1, 1);
      if (y > 0) relax(k, k - W, 1);
      if (x > 0 && y > 0) relax(k, k - W - 1, 1.414);
      if (x < W - 1 && y > 0) relax(k, k - W + 1, 1.414);
    }
  }
  for (let y = H - 1; y >= 0; y--) {
    for (let x = W - 1; x >= 0; x--) {
      const k = y * W + x;
      if (x < W - 1) relax(k, k + 1, 1);
      if (y < H - 1) relax(k, k + W, 1);
      if (x < W - 1 && y < H - 1) relax(k, k + W + 1, 1.414);
      if (x > 0 && y < H - 1) relax(k, k + W - 1, 1.414);
    }
  }
  const w = Math.floor(W / cell);
  const h = Math.floor(H / cell);
  const heights = new Float32Array((w + 1) * (h + 1));
  for (let j = 0; j <= h; j++) {
    for (let i = 0; i <= w; i++) {
      const tx = Math.min(W - 1, i * cell);
      const ty = Math.min(H - 1, j * cell);
      const d = dist[ty * W + tx];
      const b = base[ty * W + tx];
      const x = tx - margin;
      const y = ty - margin;
      let z;
      if (d < 0.5) z = b - 2;
      else {
        // From the rim, climbing: fast at first, then slower, broken by
        // ridges and boulders; valleys between the far ridges.
        const r = rim(x, y, b);
        const s = Math.max(0, d - 1);
        const climb = 8 * Math.sqrt(s) * (0.45 + 0.9 * valueNoise(x, y, 40, seed));
        const relief = (valueNoise(x, y, 13, seed + 2) - 0.5) * 10 * smoothstep(1, 6, s) + (valueNoise(x, y, 4, seed + 3) - 0.5) * 3 * smoothstep(0, 3, s);
        const valley = 30 * (1 - smoothstep(0.03, 0.16, Math.abs(valueNoise(x, y, 34, seed + 1) - 0.5))) * smoothstep(10, 24, s);
        z = r + Math.max(0, climb + relief - valley) * smoothstep(0, 1.5, s) + Math.min(0, climb + relief - valley) * smoothstep(8, 16, s);
      }
      heights[j * (w + 1) + i] = z;
    }
  }
  return { x: -margin, y: -margin, cell, w, h, heights, ...look };
}
