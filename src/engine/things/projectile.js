/** Projectiles (fireballs, rockets, lobbed trash) and short-lived effects. */

import { F_SKY, F_SLAB } from '../world/tilemap.js';
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
 * Burst, damaging what's around. `pull` backs it out of the wall it flew
 * into. Its `explosion` faces `face` (out of the floor or ceiling it hit),
 * else back the way it came (out of a wall), else all round (a body hit).
 * A `splash.erupt` explosion goes up from the floor under every body the
 * splash hurt, and under the burst too unless it hit a body (Dark Forces'
 * concussion rifle).
 */
function explode(world, p, hit, pull = true, face = null) {
  if (p.state === 'exploding') return;
  p.state = 'exploding';
  const dir = face ?? (hit ? null : [-p.vx, -p.vy, 0]);
  p.vx = 0;
  p.vy = 0;
  p.vz = 0;
  if (pull) {
    p.x -= Math.cos(p.angle) * 0.3;
    p.y -= Math.sin(p.angle) * 0.3;
  }
  const splash = p.def.splash;
  if (splash) {
    const hurt = world.radiusDamage(p.x, p.y, splash.radius ?? 2, splash.damage ?? 100, p, p.owner, p.z, { falloff: splash.falloff ?? true });
    if (splash.erupt) {
      const up = [0, 0, 1];
      for (const t of hurt) world.explode(splash.erupt, t.x, t.y, world.map.floorAt(t.x, t.y, 0, t.z), { dir: up });
      if (!hit) world.explode(splash.erupt, p.x, p.y, world.map.floorAt(p.x, p.y, 0, p.z), { dir: up });
    }
  }
  world.playSoundFrom(p.def.sounds.explode, p);
  if (p.def.explosion) world.explode(p.def.explosion, p.x, p.y, p.z, { dir });
  p.def.hooks?.onExplode?.(world, p, hit);
  if (!p.setAnim('explode')) world.remove(p);
}

/**
 * A bouncing projectile (`bounce`: a thrown detonator). It bounces off walls,
 * floors, ceilings, doors and solid scenery, keeping `restitution` of its
 * speed into what it hit and `friction` of the rest, then rolls to a stop.
 * It goes off when its fuse (`life`) runs out, or at once on a body. It rests
 * with its centre `radius` above the floor, so its sprite sits on it.
 */
function bounceThink(world, p, dt) {
  const b = p.def.bounce;
  p.life -= dt;
  if (p.life <= 0) {
    explode(world, p, null, false, p.resting ? [0, 0, 1] : null);
    return;
  }
  const map = world.map;
  const lift = p.radius;
  // A lift rising under it carries it up.
  const under = map.floorAt(p.x, p.y, 0, p.z);
  if (p.z - lift < under && under - (p.z - lift) < 0.5) p.z = under + lift;
  let hit = 0; // the hardest knock this tick (its speed into what it hit)
  const speed = Math.hypot(p.vx, p.vy, p.vz);
  const steps = Math.max(1, Math.ceil((speed * dt) / STEP));
  const sdt = dt / steps;
  for (let s = 0; s < steps; s++) {
    p.vz -= (p.def.gravity ?? 0) * sdt;
    let nx = p.x + p.vx * sdt;
    let ny = p.y + p.vy * sdt;
    let nz = p.z + p.vz * sdt;
    // Walls, doors and the faces of steps and ledges: turn back along the
    // axis that's blocked (both, into a corner).
    const blocked = (x, y) =>
      map.solidPoint(x, y) ||
      (map.doors.length > 0 && map.panelCrossed(p.x, p.y, x, y, nz)) ||
      map.floorAt(x, y, 0, p.z) > p.z - lift + 0.05 ||
      map.ceilAt(x, y, 0, p.z) < p.z + lift - 0.05;
    if (blocked(nx, ny)) {
      const bx = blocked(nx, p.y);
      const by = blocked(p.x, ny);
      const knock = (bx || !by ? Math.abs(p.vx) : 0) + (by || !bx ? Math.abs(p.vy) : 0);
      if (bx || !by) p.vx = -p.vx * b.restitution;
      if (by || !bx) p.vy = -p.vy * b.restitution;
      p.vz *= b.friction;
      hit = Math.max(hit, knock);
      nx = p.x;
      ny = p.y;
    }
    // Solid scenery: back off it, away from its middle.
    for (const t of world.things) {
      if (t === p || t.dead || t.removed || t.shootable || !blocksShots(t)) continue;
      if (overlap(t, nx, ny, p.radius) <= 0 || nz < t.z - p.radius || nz > t.z + t.height + p.radius) continue;
      const dx = p.x - t.x;
      const dy = p.y - t.y;
      const d = Math.hypot(dx, dy) || 1;
      const into = -(p.vx * dx + p.vy * dy) / d;
      if (into > 0) {
        p.vx = (p.vx + ((1 + b.restitution) * into * dx) / d) * b.friction;
        p.vy = (p.vy + ((1 + b.restitution) * into * dy) / d) * b.friction;
        hit = Math.max(hit, into);
      }
      nx = p.x;
      ny = p.y;
    }
    // Floor and ceiling.
    const floor = map.floorAt(nx, ny, 0, p.z);
    const ceil = map.ceilAt(nx, ny, 0, p.z);
    if (nz + lift > ceil) {
      if (skyAt(map, nx, ny, p.z)) {
        world.remove(p);
        return;
      }
      hit = Math.max(hit, p.vz);
      p.vz = -p.vz * b.restitution;
      nz = ceil - lift;
    }
    p.resting = false;
    if (nz - lift <= floor) {
      nz = floor + lift;
      if (p.vz < 0) {
        hit = Math.max(hit, -p.vz);
        // Too slow to bounce: it lies there (and rolls).
        p.vz = -p.vz > b.minSpeed ? -p.vz * b.restitution : 0;
        p.vx *= b.friction;
        p.vy *= b.friction;
      }
      if (p.vz === 0) {
        p.resting = true;
        const roll = Math.max(0, 1 - b.roll * sdt);
        p.vx *= roll;
        p.vy *= roll;
      }
    }
    // A body (not its thrower's): it goes off at once.
    for (const t of world.things) {
      if (t === p || t === p.owner || !t.shootable || t.dead || t.removed) continue;
      if (t.model ? overlap(t, nx, ny, p.radius) <= 0 : (t.x - nx) ** 2 + (t.y - ny) ** 2 > (t.radius + p.radius) ** 2) continue;
      if (nz < t.z - p.radius || nz > t.z + t.height + p.radius) continue;
      p.x = nx;
      p.y = ny;
      p.z = nz;
      world.damage(t, world.rng.roll(p.def.damage), p, p.owner);
      explode(world, p, t, false);
      return;
    }
    p.x = nx;
    p.y = ny;
    p.z = nz;
  }
  if (Math.hypot(p.vx, p.vy) > 0.01) p.angle = Math.atan2(p.vy, p.vx);
  if (hit > b.minSpeed && p.def.sounds.bounce) world.playSoundFrom(p.def.sounds.bounce, p);
}

export function projectileThink(world, p, dt) {
  if (p.state === 'exploding') {
    if (p.stepAnim(dt) || p.animDone) world.remove(p);
    return;
  }
  p.stepAnim(dt);
  if (p.def.bounce) {
    bounceThink(world, p, dt);
    return;
  }
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
      }
      explode(world, p, null, face, face ? null : [0, 0, up ? -1 : 1]);
      return;
    }
    for (const t of world.things) {
      if (t === p || t === p.owner || t.dead || t.removed) continue;
      if (!t.shootable) {
        // Solid model scenery (with `hitsSolid`, anything solid): a burst against it, no damage.
        if (!(blocksShots(t) || (p.def.hitsSolid && t.solid)) || overlap(t, nx, ny, p.radius) <= 0) continue;
        if (nz < t.z - p.radius || nz > t.z + t.height + p.radius) continue;
        explode(world, p, null, true);
        return;
      }
      if (t.model ? overlap(t, nx, ny, p.radius) <= 0 : (t.x - nx) ** 2 + (t.y - ny) ** 2 > (t.radius + p.radius) ** 2) continue;
      if (nz < t.z - p.radius || nz > t.z + t.height + p.radius) continue;
      const owner = p.owner;
      // Monsters are immune to their own species' projectiles (as in Doom).
      const sameKind = owner && owner.kind === 'monster' && t.kind === 'monster' && t.def.id === owner.def.id;
      const amount = world.rng.roll(p.def.damage);
      if (!sameKind && amount > 0) world.damage(t, amount, p, owner);
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
  // (`power`: how hard a wound-up throw was let go, 0 to 1; see a weapon's `charge`.)
  const speed = def.speed * (owner.kind === 'monster' && world.skillInfo.fast ? 1.4 : 1) * (spec.power ?? 1);
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
  if (def.bounce) {
    // Thrown: along the aim, tossed up, higher the harder it was thrown.
    p.vz = aim.slope * speed + def.bounce.toss + def.bounce.loft * (spec.power ?? 1);
  } else if (def.gravity) {
    // Lob so it lands near the target (or 12 tiles ahead, plus the aim).
    const target = owner.target ?? null;
    const dist = target ? Math.hypot(target.x - owner.x, target.y - owner.y) : 12;
    const land = target ? target.z : p.z + aim.slope * dist;
    const time = Math.max(0.25, dist / speed);
    p.vz = (def.gravity * time) / 2 + (land - p.z) / time + 0.2;
  } else {
    p.vz = aim.slope * speed;
  }
  p.life = def.bounce?.fuse ?? def.life ?? 10;
  world.playSoundFrom(def.sounds.fire, owner);
  // If it spawned inside a wall, burst immediately (a bouncer starts from
  // the thrower instead, and bounces off it).
  if (world.map.blocks(Math.floor(p.x), Math.floor(p.y))) {
    if (!def.bounce) explode(world, p, null);
    else {
      p.x = owner.x;
      p.y = owner.y;
    }
  }
  return p;
}

export function effectThink(world, e, dt) {
  if (e.def.rise) e.z += e.def.rise * dt;
  if (e.stepAnim(dt) || e.animDone) world.remove(e);
}
