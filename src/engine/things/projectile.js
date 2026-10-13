/** Projectiles (fireballs, rockets, lobbed trash) and short-lived effects. */

import { F_SKY, F_SLAB, F_SOLID } from '../world/tilemap.js';
import { aimAttack, missileZ } from '../combat/aim.js';
import { blocksShots, overlap } from './shape.js';

const STEP = 0.2;
/** A projectile's z is its centre; it bursts this close to a floor or ceiling. */
const CLEARANCE = 0.1;

/** Is the ceiling at (x, y) sky, for something at height z (under a slab it's the slab)? */
function skyAt(map, x, y, z) {
  const tx = Math.floor(x);
  const ty = Math.floor(y);
  if (!map.inBounds(tx, ty)) return false;
  const i = ty * map.w + tx;
  return (map.flags[i] & F_SKY) !== 0 && !(map.flags[i] & F_SLAB && map.storeyAt(i, z) === 0);
}

/**
 * The tile edge a step from (x0, y0) to (x1, y1) crosses first: the face
 * it meets (0-3: N E S W, the way that face looks), where, and how far
 * along the step (0-1); null if it stays in one tile.
 */
function crossedFace(x0, y0, x1, y1) {
  const tx0 = Math.floor(x0);
  const ty0 = Math.floor(y0);
  const tx1 = Math.floor(x1);
  const ty1 = Math.floor(y1);
  const ex = tx1 > tx0 ? tx0 + 1 : tx0;
  const ey = ty1 > ty0 ? ty0 + 1 : ty0;
  const sx = tx1 !== tx0 ? (ex - x0) / (x1 - x0) : Infinity;
  const sy = ty1 !== ty0 ? (ey - y0) / (y1 - y0) : Infinity;
  if (sx === Infinity && sy === Infinity) return null;
  if (sx <= sy) return { face: tx1 > tx0 ? 3 : 1, x: ex, y: y0 + (y1 - y0) * sx, s: sx };
  return { face: ty1 > ty0 ? 0 : 2, x: x0 + (x1 - x0) * sy, y: ey, s: sy };
}

/** A scorch mark where a projectile met a wall or step face on its way to (nx, ny, nz). */
function scorch(world, p, nx, ny, nz) {
  if (!p.def.scorch) return;
  const hit = crossedFace(p.x, p.y, nx, ny);
  if (hit) world.scorch(p.def.scorch, hit.x, hit.y, p.z + (nz - p.z) * hit.s, hit.face);
}

/** Burst, damaging what's around. `pull` backs it out of the wall it flew into. */
function explode(world, p, hit, pull = true) {
  if (p.state === 'exploding') return;
  p.state = 'exploding';
  p.vx = 0;
  p.vy = 0;
  p.vz = 0;
  if (pull) {
    p.x -= Math.cos(p.angle) * 0.3;
    p.y -= Math.sin(p.angle) * 0.3;
  }
  if (p.def.splash) {
    world.radiusDamage(p.x, p.y, p.def.splash.radius ?? 2, p.def.splash.damage ?? 100, p, p.owner, p.z);
  }
  world.playSoundFrom(p.def.sounds.explode, p);
  p.def.hooks?.onExplode?.(world, p, hit);
  if (!p.setAnim('explode')) world.remove(p);
}

export function projectileThink(world, p, dt) {
  if (p.state === 'exploding') {
    if (p.stepAnim(dt) || p.animDone) world.remove(p);
    return;
  }
  p.stepAnim(dt);
  p.life = (p.life ?? 10) - dt;
  if (p.life <= 0) {
    world.remove(p);
    return;
  }
  const map = world.map;
  const speed = Math.hypot(p.vx, p.vy, p.vz);
  const steps = Math.max(1, Math.ceil((speed * dt) / STEP));
  const sdt = dt / steps;
  const gravity = p.def.gravity ?? 0;
  for (let s = 0; s < steps; s++) {
    if (gravity) p.vz -= gravity * sdt;
    const nx = p.x + p.vx * sdt;
    const ny = p.y + p.vy * sdt;
    const nz = p.z + p.vz * sdt;
    if (map.solidPoint(nx, ny) || (map.doors.length && map.panelCrossed(p.x, p.y, nx, ny, nz))) {
      // (A solid wall's face; not an angled wall's, which stands inside its tile.)
      if (map.flags[Math.floor(ny) * map.w + Math.floor(nx)] & F_SOLID) scorch(world, p, nx, ny, nz);
      explode(world, p, null);
      return;
    }
    // (Under a slab, the storey it's flying in: by its height before this step.)
    const floor = map.floorAt(nx, ny, 0, p.z);
    const ceil = map.ceilAt(nx, ny, 0, p.z);
    if (nz - CLEARANCE < floor || nz + CLEARANCE > ceil) {
      // Already outside them where it was: it flew into the face of a step or
      // ledge. Otherwise it came down on the floor or up into the ceiling.
      const face = p.z - CLEARANCE < floor || p.z + CLEARANCE > ceil;
      const up = nz + CLEARANCE > ceil;
      // Into the sky (or an open sky face between two sky tiles): gone without a burst, as in Doom.
      if (up && skyAt(map, nx, ny, p.z) && (!face || skyAt(map, p.x, p.y, p.z))) {
        world.remove(p);
        return;
      }
      if (!face) {
        p.x = nx;
        p.y = ny;
        p.z = up ? ceil - CLEARANCE : floor + CLEARANCE;
      } else scorch(world, p, nx, ny, nz);
      explode(world, p, null, face);
      return;
    }
    for (const t of world.things) {
      if (t === p || t === p.owner || t.dead || t.removed) continue;
      if (!t.shootable) {
        // Solid model scenery: a burst against it, no damage.
        if (!blocksShots(t) || overlap(t, nx, ny, p.radius) <= 0) continue;
        if (nz < t.z - p.radius || nz > t.z + t.height + p.radius) continue;
        explode(world, p, null, true);
        return;
      }
      if (t.model ? overlap(t, nx, ny, p.radius) <= 0 : (t.x - nx) ** 2 + (t.y - ny) ** 2 > (t.radius + p.radius) ** 2) continue;
      if (nz < t.z - p.radius || nz > t.z + t.height + p.radius) continue;
      const owner = p.owner;
      // Monsters are immune to their own species' projectiles (as in Doom).
      const sameKind = owner && owner.kind === 'monster' && t.kind === 'monster' && t.def.id === owner.def.id;
      if (!sameKind) world.damage(t, world.rng.roll(p.def.damage), p, owner);
      p.x = nx;
      p.y = ny;
      p.z = nz;
      explode(world, p, t);
      return;
    }
    p.x = nx;
    p.y = ny;
    p.z = nz;
  }
}

/**
 * Spawn a projectile from `owner` toward `angle`, climbing along `aim`'s slope
 * (see aim.js). A spec or def `z` instead starts it that high above the
 * owner's feet. Lobbed (gravity) projectiles arc to land near the target.
 */
export function launchProjectile(world, id, owner, angle, spec = {}, aim = aimAttack(world, owner, angle)) {
  const def = world.registry.things.get(id);
  if (!def) {
    console.warn(`Unknown projectile "${id}"`);
    return null;
  }
  const off = (owner.radius ?? 0.5) + def.radius + 0.1;
  const p = world.spawn(id, owner.x + Math.cos(angle) * off, owner.y + Math.sin(angle) * off, angle);
  if (!p) return null;
  const speed = def.speed * (owner.kind === 'monster' && world.skillInfo.fast ? 1.4 : 1);
  p.owner = owner;
  p.state = 'flying';
  p.vx = Math.cos(angle) * speed;
  p.vy = Math.sin(angle) * speed;
  const z = spec.z ?? def.z;
  p.z = z != null ? owner.z + z : missileZ(owner, aim);
  // Keep it inside the room it was fired in.
  const floor = world.map.floorAt(p.x, p.y, 0, p.z);
  const ceil = world.map.ceilAt(p.x, p.y, 0, p.z);
  p.z = Math.max(floor + CLEARANCE, Math.min(ceil - CLEARANCE, p.z));
  if (def.gravity) {
    // Lob so it lands near the target (or 12 tiles ahead, plus the aim).
    const target = owner.target ?? null;
    const dist = target ? Math.hypot(target.x - owner.x, target.y - owner.y) : 12;
    const land = target ? target.z : p.z + aim.slope * dist;
    const time = Math.max(0.25, dist / speed);
    p.vz = (def.gravity * time) / 2 + (land - p.z) / time + 0.2;
  } else {
    p.vz = aim.slope * speed;
  }
  p.life = def.life ?? 10;
  world.playSoundFrom(def.sounds.fire, owner);
  // If it spawned inside a wall, burst immediately.
  if (world.map.blocks(Math.floor(p.x), Math.floor(p.y))) explode(world, p, null);
  return p;
}

export function effectThink(world, e, dt) {
  if (e.def.rise) e.z += e.def.rise * dt;
  if (e.stepAnim(dt) || e.animDone) world.remove(e);
}
