import { F_SOLID, F_DOOR, F_SKY, F_SLANT, F_SLAB } from './tilemap.js';
import { segDist2 } from './slants.js';

/**
 * Cast a ray through the tile grid. Stops at walls, the map edge and the
 * solid part of door panels (open parts of doors let the ray through).
 * @param {import('./tilemap.js').TileMap} map
 * @returns {{dist:number, tx:number, ty:number, door:any|null, passedDoor:any|null}}
 */
export function castRay(map, x, y, dx, dy, maxDist = 128) {
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
  // An angled wall in the starting tile.
  const start = map.slantAt(mapX, mapY);
  if (start) {
    const t = start.ray(x, y, dx, dy);
    const leave = Math.min(sdx, sdy);
    if (t >= 0 && t <= leave && t <= maxDist) return { dist: t, tx: mapX, ty: mapY, door: null, passedDoor, slant: start };
  }
  // A rising door's panel ahead in the starting tile (standing in its recess).
  const startDoor = map.doorAt(mapX, mapY);
  if (startDoor?.style === 'rise') {
    const t = risePanel(startDoor, x, y, dx, dy, 0, Math.min(sdx, sdy), maxDist);
    if (t >= 0) return { dist: t, tx: mapX, ty: mapY, door: startDoor, passedDoor };
    if (t === -2) passedDoor = startDoor;
  }
  for (let i = 0; i < 512; i++) {
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
    if (f & F_SLANT) {
      const sl = map.slants[map.slantIndex[idx]];
      if (sl.solidAt(x + dx * enter, y + dy * enter)) return { dist: enter, tx: mapX, ty: mapY, door: null, passedDoor, slant: sl };
      const t = sl.ray(x, y, dx, dy);
      if (t >= enter && t <= Math.min(sdx, sdy) && t <= maxDist) return { dist: t, tx: mapX, ty: mapY, door: null, passedDoor, slant: sl };
      continue;
    }
    if (f & F_DOOR) {
      const door = map.doors[map.doorIndex[idx]];
      if (door.style === 'rise') {
        // A rising door's panel stops rays until it's mostly open.
        const t = risePanel(door, x, y, dx, dy, enter, Math.min(sdx, sdy), maxDist);
        if (t >= 0) return { dist: t, tx: mapX, ty: mapY, door, passedDoor };
        if (t === -2) passedDoor ??= door;
        continue;
      }
      const t = doorPanel(door, x, y, dx, dy, mapX, mapY, enter, maxDist);
      if (t >= 0) return { dist: t, tx: mapX, ty: mapY, door, passedDoor };
      if (t === -2) passedDoor ??= door;
      continue;
    }
    if (f & F_SOLID) return { dist: enter, tx: mapX, ty: mapY, door: null, passedDoor };
  }
  return { dist: maxDist, tx: mapX, ty: mapY, door: null, passedDoor };
}

/** Slack for a rising door's panel on a tile edge (a ray may meet it on either side). */
const EDGE_EPS = 1e-7;

/**
 * Where a ray meets a rising door's panel between distances `enter` and
 * `leave` (the stretch inside one of its tiles). Returns the distance if the
 * panel blocks the ray (it does until mostly open), -2 if the ray passes the
 * open door, or -1 if it doesn't reach the panel here.
 */
function risePanel(door, x, y, dx, dy, enter, leave, maxDist) {
  const t = door.planeHit(x, y, dx, dy);
  if (t < 0 || t < enter - EDGE_EPS || t > leave + EDGE_EPS || t > maxDist) return -1;
  return door.open < 0.6 ? t : -2;
}

/**
 * Where a ray meets a sliding or secret door's panel inside tile (mapX, mapY),
 * which it entered at distance `enter`. Returns the distance if the panel
 * blocks the ray, -2 if the ray slips through the open gap, or -1 if it
 * doesn't cross the panel inside this tile.
 */
function doorPanel(door, x, y, dx, dy, mapX, mapY, enter, maxDist) {
  // Panels run through the tile centre; secret doors sit on the tile face.
  const t = door.secret ? enter : door.axis === 'x' ? (dx === 0 ? -1 : (mapX + 0.5 - x) / dx) : dy === 0 ? -1 : (mapY + 0.5 - y) / dy;
  if (t < 0 || t > maxDist) return -1;
  const hx = x + dx * t;
  const hy = y + dy * t;
  if (!door.secret && (Math.floor(hx) !== mapX || Math.floor(hy) !== mapY)) return -1;
  const u = door.axis === 'x' ? hy - mapY : hx - mapX;
  const open = door.open;
  const gap = door.style === 'split' ? u > 0.5 - open / 2 && u < 0.5 + open / 2 : u < open;
  return gap ? -2 : t;
}

/**
 * Trace a ray through the height grid in 3D: from (x, y, z) along the unit
 * horizontal direction (dx, dy), rising `slope` units per unit of horizontal
 * distance. It stops at walls, door panels (a rising door's only above its
 * bottom edge), angled walls, the faces of raised floors and lowered ceilings,
 * and the floor or ceiling itself. Under a slab it keeps to its storey: the
 * slab's top is a floor, its underside a ceiling and its edges walls.
 * Distances are horizontal.
 *
 * `hit` is 'wall', 'floor', 'ceiling', or null if nothing was hit within
 * `maxDist`. `sky` is true when the ray went up into the sky.
 * @returns {{dist:number, z:number, hit:'wall'|'floor'|'ceiling'|null, sky:boolean, tx:number, ty:number}}
 */
export function traceRay3D(map, x, y, z, dx, dy, slope, maxDist = 128) {
  const { flags, floorZ, ceilZ, slabBot, slabTop } = map;
  let mapX = Math.floor(x);
  let mapY = Math.floor(y);
  const ddx = dx === 0 ? 1e30 : Math.abs(1 / dx);
  const ddy = dy === 0 ? 1e30 : Math.abs(1 / dy);
  const stepX = dx < 0 ? -1 : 1;
  const stepY = dy < 0 ? -1 : 1;
  let sdx = (dx < 0 ? x - mapX : mapX + 1 - x) * ddx;
  let sdy = (dy < 0 ? y - mapY : mapY + 1 - y) * ddy;
  const result = (dist, hit, sky = false) => ({ dist, z: z + slope * dist, hit, sky, tx: mapX, ty: mapY });
  if (!map.inBounds(mapX, mapY)) return result(0, 'wall');
  let enter = 0;
  // The storey of the current tile the ray is in (1: on its slab).
  const i0 = mapY * map.w + mapX;
  let st = flags[i0] & F_SLAB && z >= (slabBot[i0] + slabTop[i0]) / 2 ? 1 : 0;
  // Where the ray reaches height h (never before it entered the current tile).
  const crossing = (h) => (slope === 0 ? enter : Math.max(enter, (h - z) / slope));
  for (let i = 0; i < 1024; i++) {
    const idx = mapY * map.w + mapX;
    const f = flags[idx];
    const leave = Math.min(sdx, sdy, maxDist);
    // An angled wall or a door panel standing inside this tile.
    let block = Infinity;
    if (f & F_SLANT) {
      const t = map.slants[map.slantIndex[idx]].ray(x, y, dx, dy);
      if (t >= enter && t <= leave) block = t;
    } else if (f & F_DOOR) {
      const door = map.doors[map.doorIndex[idx]];
      if (door.style !== 'rise') {
        const t = doorPanel(door, x, y, dx, dy, mapX, mapY, enter, maxDist);
        if (t >= 0 && t <= leave) block = t;
      } else {
        // A rising door's panel, above its bottom edge (shots pass under a half-open door).
        const t = door.planeHit(x, y, dx, dy);
        if (t >= enter - EDGE_EPS && t <= leave + EDGE_EPS && z + slope * t > door.bottomZ) block = Math.max(t, enter);
      }
    }
    // Does the ray reach this storey's floor or ceiling before it leaves?
    const end = Math.min(leave, block);
    const zEnd = z + slope * end;
    const slab = (f & F_SLAB) !== 0;
    const fz = slab && st ? slabTop[idx] : floorZ[idx];
    const cz = slab && !st ? slabBot[idx] : ceilZ[idx];
    const sky = (f & F_SKY) !== 0 && (!slab || st === 1);
    if (zEnd < fz) return result(crossing(fz), 'floor');
    if (zEnd > cz) return result(crossing(cz), 'ceiling', sky);
    if (block < Infinity) return result(block, 'wall');
    if (leave >= maxDist) return result(maxDist, null);

    if (sdx < sdy) {
      enter = sdx;
      sdx += ddx;
      mapX += stepX;
    } else {
      enter = sdy;
      sdy += ddy;
      mapY += stepY;
    }
    if (!map.inBounds(mapX, mapY)) return result(enter, 'wall');
    const n = mapY * map.w + mapX;
    const nf = flags[n];
    if (nf & F_SOLID) return result(enter, 'wall');
    if (nf & F_SLANT && map.slants[map.slantIndex[n]].solidAt(x + dx * enter, y + dy * enter)) return result(enter, 'wall');
    // The face of a raised floor or a lowered ceiling (open sky between two
    // sky tiles), or a slab's edge; else on into the storey at that height.
    const ze = z + slope * enter;
    if (ze < floorZ[n]) return result(enter, 'wall');
    if (ze > ceilZ[n]) return result(enter, 'wall', sky && (nf & F_SKY) !== 0);
    if (nf & F_SLAB) {
      if (ze > slabBot[n] && ze < slabTop[n]) return result(enter, 'wall');
      st = ze >= slabTop[n] ? 1 : 0;
    } else st = 0;
  }
  return result(maxDist, null);
}

/** Is there a clear 3D line between two points (through the height grid)? */
export function lineOfSight3D(map, x0, y0, z0, x1, y1, z1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const d = Math.hypot(dx, dy);
  if (d < 1e-6) return true;
  return traceRay3D(map, x0, y0, z0, dx / d, dy / d, (z1 - z0) / d, d).dist >= d - 1e-4;
}

/** Is there a clear line between two points? */
export function lineOfSight(map, x0, y0, x1, y1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const d = Math.hypot(dx, dy);
  if (d < 1e-6) return true;
  return castRay(map, x0, y0, dx / d, dy / d, d).dist >= d - 1e-4;
}

/**
 * Does a box of half-size r centred at (x, y) overlap any blocking tile or the
 * closed panel of a rising door, or a circle of radius r overlap the solid side
 * of an angled wall?
 */
export function blockedByMap(map, x, y, r) {
  const x0 = Math.floor(x - r);
  const x1 = Math.max(x0, Math.ceil(x + r) - 1); // (a box exactly touching an edge stays out)
  const y0 = Math.floor(y - r);
  const y1 = Math.max(y0, Math.ceil(y + r) - 1);
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      if (map.blocks(tx, ty)) return true;
      if (map.flags[ty * map.w + tx] & F_DOOR && map.panelBlocks(tx, ty, x, y, r)) return true;
      if (map.flags[ty * map.w + tx] & F_SLANT && map.slants[map.slantIndex[ty * map.w + tx]].touchesCircle(x, y, r)) return true;
    }
  }
  return false;
}

/**
 * Does a body of radius r at (x, y), between heights `bottom` and `top`,
 * touch a fence (a railing, bars)? Only the part below the fence's top
 * counts, so a body above a low railing passes over it.
 */
export function fenceBlocks(map, x, y, r, bottom, top) {
  if (!map.fences.length) return false;
  const r2 = r * r;
  for (let ty = Math.floor(y - r); ty <= Math.floor(y + r); ty++) {
    for (let tx = Math.floor(x - r); tx <= Math.floor(x + r); tx++) {
      if (!map.inBounds(tx, ty)) continue;
      const base = (ty * map.w + tx) * 4;
      for (let edge = 0; edge < 4; edge++) {
        const k = map.fenceAt[base + edge];
        if (k < 0) continue;
        const f = map.fences[k];
        if (bottom >= map.fenceTop(f) - 1e-6 || top <= map.fenceBottom(f)) continue;
        // The edge as a segment: N, E, S, W.
        const ax = edge === 1 ? tx + 1 : tx;
        const ay = edge === 2 ? ty + 1 : ty;
        const bx = edge === 3 ? tx : tx + 1;
        const by = edge === 0 ? ty : ty + 1;
        if (segDist2(x, y, ax, ay, bx, by) < r2 - 1e-9) return true;
      }
    }
  }
  return false;
}

/** Is there an angled wall in any tile a box of half-size r at (x, y) touches? */
export function slantNear(map, x, y, r) {
  for (let ty = Math.floor(y - r); ty <= Math.max(Math.floor(y - r), Math.ceil(y + r) - 1); ty++) {
    for (let tx = Math.floor(x - r); tx <= Math.max(Math.floor(x - r), Math.ceil(x + r) - 1); tx++) {
      if (map.inBounds(tx, ty) && map.flags[ty * map.w + tx] & F_SLANT) return true;
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

/**
 * 3D ray vs an upright cylinder (a thing's body): the horizontal distance at
 * which a ray from (ox, oy, oz) along unit (dx, dy) with `slope` first
 * touches the cylinder at (cx, cy) between heights `bottom` and `top`, or -1.
 */
export function rayCylinder(ox, oy, oz, dx, dy, slope, cx, cy, r, bottom, top) {
  const fx = cx - ox;
  const fy = cy - oy;
  const proj = fx * dx + fy * dy;
  const perp2 = fx * fx + fy * fy - proj * proj;
  if (perp2 > r * r) return -1;
  const half = Math.sqrt(r * r - perp2);
  let t0 = Math.max(0, proj - half);
  let t1 = proj + half;
  if (t1 <= 0) return -1;
  if (slope === 0) return oz >= bottom && oz <= top ? t0 : -1;
  const ta = (bottom - oz) / slope;
  const tb = (top - oz) / slope;
  t0 = Math.max(t0, Math.min(ta, tb));
  t1 = Math.min(t1, Math.max(ta, tb));
  return t0 <= t1 ? t0 : -1;
}
