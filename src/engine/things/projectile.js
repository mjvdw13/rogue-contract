/** Projectiles (fireballs, rockets, lobbed trash) and short-lived effects. */

import { F_SKY } from '../world/tilemap.js';
import { aimAttack, missileZ } from '../combat/aim.js';

const STEP = 0.1;
/** A projectile's z is its centre; it bursts this close to a floor or ceiling. */
const CLEARANCE = 0.05;

function skyAt(map, x, y) {
  const tx = Math.floor(x);
  const ty = Math.floor(y);
  return map.inBounds(tx, ty) && (map.flags[ty * map.w + tx] & F_SKY) !== 0;
}

/** Burst, damaging what's around. `pull` backs it out of the wall it flew into. */
function explode(world, p, hit, pull = true) {
  if (p.state === 'exploding') return;
  p.state = 'exploding';
  p.vx = 0;
  p.vy = 0;
  p.vz = 0;
  if (pull) {
    p.x -= Math.cos(p.angle) * 0.15;
    p.y -= Math.sin(p.angle) * 0.15;
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
    if (map.solidPoint(nx, ny)) {
      explode(world, p, null);
      return;
    }
    const floor = map.floorAt(nx, ny);
    const ceil = map.ceilAt(nx, ny);
    if (nz - CLEARANCE < floor || nz + CLEARANCE > ceil) {
      // Already outside them where it was: it flew into the face of a step or
      // ledge. Otherwise it came down on the floor or up into the ceiling.
      const face = p.z - CLEARANCE < floor || p.z + CLEARANCE > ceil;
      const up = nz + CLEARANCE > ceil;
      // Into the sky (or an open sky face between two sky tiles): gone without a burst, as in Doom.
      if (up && skyAt(map, nx, ny) && (!face || skyAt(map, p.x, p.y))) {
        world.remove(p);
        return;
      }
      if (!face) {
        p.x = nx;
        p.y = ny;
        p.z = up ? ceil - CLEARANCE : floor + CLEARANCE;
      }
      explode(world, p, null, face);
      return;
    }
    for (const t of world.things) {
      if (t === p || t === p.owner || !t.shootable || t.dead || t.removed) continue;
      const r = t.radius + p.radius;
      const dx = t.x - nx;
      const dy = t.y - ny;
      if (dx * dx + dy * dy > r * r) continue;
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
  const off = (owner.radius ?? 0.25) + def.radius + 0.05;
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
  const floor = world.map.floorAt(p.x, p.y);
  const ceil = world.map.ceilAt(p.x, p.y);
  p.z = Math.max(floor + CLEARANCE, Math.min(ceil - CLEARANCE, p.z));
  if (def.gravity) {
    // Lob so it lands near the target (or 6 tiles ahead, plus the aim).
    const target = owner.target ?? null;
    const dist = target ? Math.hypot(target.x - owner.x, target.y - owner.y) : 6;
    const land = target ? target.z : p.z + aim.slope * dist;
    const time = Math.max(0.25, dist / speed);
    p.vz = (def.gravity * time) / 2 + (land - p.z) / time + 0.1;
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
