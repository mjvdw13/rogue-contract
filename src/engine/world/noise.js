import { F_SOLID, F_DOOR } from './tilemap.js';

/**
 * Doom's noise alert: gunfire wakes every monster that can "hear" it,
 * i.e. is connected to the shooter through open space (closed doors block).
 */
export function noiseAlert(world, source, maxSteps = 52) {
  const map = world.map;
  const w = map.w;
  const start = Math.floor(source.y) * w + Math.floor(source.x);
  if (start < 0 || start >= w * map.h) return;
  const heard = world._heard ?? (world._heard = new Uint8Array(w * map.h));
  const depth = world._heardDepth ?? (world._heardDepth = new Int16Array(w * map.h));
  heard.fill(0);
  const queue = [start];
  heard[start] = 1;
  depth[start] = 0;
  for (let head = 0; head < queue.length; head++) {
    const c = queue[head];
    if (depth[c] >= maxSteps) continue;
    const cx = c % w;
    const cy = (c / w) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= map.h) continue;
      const n = ny * w + nx;
      if (heard[n]) continue;
      const f = map.flags[n];
      if (f & F_SOLID) continue;
      if (f & F_DOOR && map.doors[map.doorIndex[n]].open < 0.5) continue;
      heard[n] = 1;
      depth[n] = depth[c] + 1;
      queue.push(n);
    }
  }
  for (const t of world.things) {
    if (t.kind !== 'monster' || t.dead || t.state !== 'idle' || t.ambush) continue;
    const i = Math.floor(t.y) * w + Math.floor(t.x);
    if (heard[i]) world.wakeMonster(t, source);
  }
}
