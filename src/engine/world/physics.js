import { F_SOLID, F_DOOR } from './tilemap.js';

/**
 * Cast a ray through the tile grid. Stops at walls, the map edge and the
 * solid part of door panels (open parts of doors let the ray through).
 * @param {import('./tilemap.js').TileMap} map
 * @returns {{dist:number, tx:number, ty:number, door:any|null, passedDoor:any|null}}
 */
export function castRay(map, x, y, dx, dy, maxDist = 64) {
  let mapX = Math.floor(x);
  let mapY = Math.floor(y);
  const ddx = dx === 0 ? 1e30 : Math.abs(1 / dx);
  const ddy = dy === 0 ? 1e30 : Math.abs(1 / dy);
  let stepX;
  let stepY;
  let sdx;
  let sdy;
  if (dx < 0) {
    stepX = -1;
    sdx = (x - mapX) * ddx;
  } else {
    stepX = 1;
    sdx = (mapX + 1 - x) * ddx;
  }
  if (dy < 0) {
    stepY = -1;
    sdy = (y - mapY) * ddy;
  } else {
    stepY = 1;
    sdy = (mapY + 1 - y) * ddy;
  }
  let passedDoor = null;
  for (let i = 0; i < 256; i++) {
    let enter;
    if (sdx < sdy) {
      enter = sdx;
      sdx += ddx;
      mapX += stepX;
    } else {
      enter = sdy;
      sdy += ddy;
      mapY += stepY;
    }
    if (enter > maxDist) return { dist: maxDist, tx: mapX, ty: mapY, door: null, passedDoor };
    if (mapX < 0 || mapY < 0 || mapX >= map.w || mapY >= map.h) {
      return { dist: enter, tx: mapX, ty: mapY, door: null, passedDoor };
    }
    const idx = mapY * map.w + mapX;
    const f = map.flags[idx];
    if (f & F_DOOR) {
      const door = map.doors[map.doorIndex[idx]];
      if (door.style === 'rise') {
        // A rising door fills its tile; it stops rays until it's mostly open.
        if (door.open < 0.6) return { dist: enter, tx: mapX, ty: mapY, door, passedDoor };
        passedDoor ??= door;
        continue;
      }
      // Panels run through the tile centre; secret doors sit on the tile face.
      const t = door.secret ? enter : door.axis === 'x' ? (dx === 0 ? -1 : (mapX + 0.5 - x) / dx) : dy === 0 ? -1 : (mapY + 0.5 - y) / dy;
      if (t >= 0 && t <= maxDist) {
        const hx = x + dx * t;
        const hy = y + dy * t;
        if (door.secret || (Math.floor(hx) === mapX && Math.floor(hy) === mapY)) {
          const u = door.axis === 'x' ? hy - mapY : hx - mapX;
          const open = door.open;
          const gap = door.style === 'split' ? u > 0.5 - open / 2 && u < 0.5 + open / 2 : u < open;
          if (!gap) return { dist: t, tx: mapX, ty: mapY, door, passedDoor };
          passedDoor ??= door;
        }
      }
      continue;
    }
    if (f & F_SOLID) return { dist: enter, tx: mapX, ty: mapY, door: null, passedDoor };
  }
  return { dist: maxDist, tx: mapX, ty: mapY, door: null, passedDoor };
}

/** Is there a clear line between two points? */
export function lineOfSight(map, x0, y0, x1, y1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const d = Math.hypot(dx, dy);
  if (d < 1e-6) return true;
  return castRay(map, x0, y0, dx / d, dy / d, d).dist >= d - 1e-4;
}

/** Does a box of half-size r centred at (x, y) overlap any blocking tile? */
export function blockedByMap(map, x, y, r) {
  const x0 = Math.floor(x - r);
  const x1 = Math.floor(x + r);
  const y0 = Math.floor(y - r);
  const y1 = Math.floor(y + r);
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      if (map.blocks(tx, ty)) return true;
    }
  }
  return false;
}

/** Does a box at (x, y) touch a given tile? */
export function touchesTile(x, y, r, tx, ty) {
  return x + r > tx && x - r < tx + 1 && y + r > ty && y - r < ty + 1;
}

/**
 * Ray vs circle: distance along a unit ray to the circle, or -1.
 */
export function rayCircle(ox, oy, dx, dy, cx, cy, r) {
  const fx = cx - ox;
  const fy = cy - oy;
  const proj = fx * dx + fy * dy;
  if (proj <= 0) return -1;
  const perp2 = fx * fx + fy * fy - proj * proj;
  if (perp2 > r * r) return -1;
  return Math.max(0, proj - Math.sqrt(r * r - perp2));
}
