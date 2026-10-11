/** Projectiles (fireballs, rockets, lobbed trash) and short-lived effects. */

const STEP = 0.1;

function explode(world, p, hit) {
  if (p.state === 'exploding') return;
  p.state = 'exploding';
  p.vx = 0;
  p.vy = 0;
  p.vz = 0;
  // Pull the explosion back out of the wall a little.
  p.x -= Math.cos(p.angle) * 0.15;
  p.y -= Math.sin(p.angle) * 0.15;
  if (p.def.splash) {
    world.radiusDamage(p.x, p.y, p.def.splash.radius ?? 2, p.def.splash.damage ?? 100, p, p.owner);
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
  const speed = Math.hypot(p.vx, p.vy);
  const steps = Math.max(1, Math.ceil((speed * dt) / STEP));
  const sdt = dt / steps;
  const gravity = p.def.gravity ?? 0;
  for (let s = 0; s < steps; s++) {
    const nx = p.x + p.vx * sdt;
    const ny = p.y + p.vy * sdt;
    if (gravity) {
      p.vz -= gravity * sdt;
      p.z += p.vz * sdt;
      if (p.z <= 0) {
        p.z = 0;
        explode(world, p, null);
        return;
      }
    }
    if (world.map.solidPoint(nx, ny)) {
      explode(world, p, null);
      return;
    }
    for (const t of world.things) {
      if (t === p || t === p.owner || !t.shootable || t.dead || t.removed) continue;
      const r = t.radius + p.radius;
      const dx = t.x - nx;
      const dy = t.y - ny;
      if (dx * dx + dy * dy > r * r) continue;
      if (gravity && p.z > t.z + t.height) continue;
      const owner = p.owner;
      // Monsters are immune to their own species' projectiles (as in Doom).
      const sameKind = owner && owner.kind === 'monster' && t.kind === 'monster' && t.def.id === owner.def.id;
      if (!sameKind) world.damage(t, world.rng.roll(p.def.damage), p, owner);
      p.x = nx;
      p.y = ny;
      explode(world, p, t);
      return;
    }
    p.x = nx;
    p.y = ny;
  }
}

/** Spawn a projectile from `owner` toward `angle`. */
export function launchProjectile(world, id, owner, angle, spec = {}) {
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
  p.z = spec.z ?? def.z ?? 0.4;
  if (def.gravity) {
    // Lob so it lands near the target (or at 6 tiles).
    const target = owner.target ?? null;
    const dist = target ? Math.hypot(target.x - owner.x, target.y - owner.y) : 6;
    const time = Math.max(0.25, dist / speed);
    p.vz = (def.gravity * time) / 2 - p.z / time + 0.1;
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
