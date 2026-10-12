import { traceRay3D, rayCylinder, lineOfSight3D } from '../world/physics.js';
import { aimAttack, aimZ } from './aim.js';

/** Puffs and blood stay this far inside the floor and ceiling. */
const PUFF_INSET = 0.06;

/**
 * Apply damage to a thing. `inflictor` is what hit it (projectile, shooter),
 * `source` is who is responsible (for infighting and the HUD face).
 */
export function damage(world, target, amount, inflictor, source, opts = {}) {
  if (!target || target.dead || target.removed || !target.shootable) return;
  amount = Math.round(amount);
  if (amount <= 0) return;

  if (target.player) {
    damagePlayer(world, target, amount, inflictor, source, opts);
    return;
  }

  // Knockback.
  if (inflictor && !opts.noThrust) {
    const a = Math.atan2(target.y - inflictor.y, target.x - inflictor.x);
    const k = (amount * 0.02) / Math.max(0.2, (target.def.mass ?? 100) / 100);
    target.vx += Math.cos(a) * Math.min(k, 1.2);
    target.vy += Math.sin(a) * Math.min(k, 1.2);
  }

  target.health -= amount;
  if (target.health <= 0) {
    kill(world, target, source);
    return;
  }
  target.def.hooks?.onPain?.(world, target, source, amount);
  if (target.kind !== 'monster') return;

  // Infighting: monsters hit by other monsters turn on them (except their own kind).
  if (source && source !== target && !source.dead && source !== target.target) {
    const sameKind = source.kind === 'monster' && source.def.id === target.def.id;
    if (source.player || (target.def.infighting && source.kind === 'monster' && !sameKind)) {
      target.target = source;
    }
  }
  if (target.state === 'idle') world.wakeMonster(target, source?.kind === 'monster' && !source.dead ? source : world.player);
  if (world.rng.chance(target.def.painChance ?? 0)) world.monsterPain(target);
}

function damagePlayer(world, target, amount, inflictor, source, opts) {
  const p = target.player;
  if (p.god || p.powers.invulnerable > 0 || p.dead) return;
  amount *= world.skillInfo.damageTaken ?? 1;
  if (opts.environment && p.powers.hazard > 0) return;
  if (p.armorClass && !opts.ignoreArmor) {
    let saved = Math.floor(amount * (p.armorClass === 1 ? 1 / 3 : 1 / 2));
    if (p.armor <= saved) {
      saved = p.armor;
      p.armorClass = 0;
    }
    p.armor -= saved;
    amount -= saved;
  }
  amount = Math.max(1, Math.round(amount));
  p.health -= amount;
  p.damageCount = Math.min(100, p.damageCount + amount);
  p.lastDamage = amount;
  p.hurtTime = world.time;
  if (source && source !== target) p.attackerAngle = Math.atan2(source.y - target.y, source.x - target.x);
  else p.attackerAngle = null;
  if (inflictor && !opts.noThrust && inflictor !== target) {
    const a = Math.atan2(target.y - inflictor.y, target.x - inflictor.x);
    const k = Math.min(0.35, amount * 0.004);
    target.vx += Math.cos(a) * k;
    target.vy += Math.sin(a) * k;
  }
  if (p.health <= 0) {
    p.health = 0;
    world.playerDied(source);
  } else {
    world.playSound(p.health < 25 ? 'player-pain-low' : 'player-pain', { fallback: 'player-pain' });
  }
}

/** Kill a thing: death animation, drops, kill stats, hooks and triggers. */
export function kill(world, target, source) {
  if (target.dead) return;
  const def = target.def;
  target.dead = true;
  target.solid = false;
  target.shootable = false;
  target.state = 'dead';
  target.vx *= 0.5;
  target.vy *= 0.5;
  const gib = def.anims?.gib && target.health < (def.gibHealth ?? -def.health);
  if (!target.setAnim(gib ? 'gib' : 'death')) {
    if (def.kind !== 'monster') target.removed = true;
  }
  world.playSoundFrom(gib ? (def.sounds.gib ?? def.sounds.death) : def.sounds.death, target);
  if (def.kind === 'monster' && def.countKill) world.stats.kills++;
  for (const drop of def.drops ?? []) {
    if (world.rng.chance(drop.chance ?? 1)) {
      const it = world.spawn(drop.item, target.x + world.rng.signed() * 0.15, target.y + world.rng.signed() * 0.15);
      if (it) it.dropped = true;
    }
  }
  if (def.explode) {
    const ex = def.explode;
    radiusDamage(world, target.x, target.y, ex.radius ?? 2, ex.damage ?? 100, target, source ?? target, aimZ(target));
    if (ex.effect) world.spawn(ex.effect, target.x, target.y);
    if (ex.sound) world.playSoundFrom(ex.sound, target);
  }
  def.hooks?.onDeath?.(world, target, source);
  world.triggers?.killed(target);
}

/**
 * Explosion damage: falls off linearly with the 3D distance from (x, y, z) to
 * the nearest point of each body, and floors, ledges and walls block it. `z`
 * defaults to the middle of a standing body above the floor there.
 */
export function radiusDamage(world, x, y, radius, maxDamage, inflictor, source, z = world.map.floorAt(x, y) + 0.4) {
  for (const t of [...world.things]) {
    if (!t.shootable || t.dead || t.removed) continue;
    if (t.def.splashImmune) continue;
    const across = Math.max(0, Math.hypot(t.x - x, t.y - y) - t.radius);
    const vertical = Math.max(0, t.z - z, z - t.z - t.height);
    const d = Math.hypot(across, vertical);
    if (d >= radius) continue;
    // Sight to the nearest height on the body, a little inside it so the line
    // doesn't graze the floor it stands on.
    const inset = Math.min(0.1, t.height / 4);
    const tz = Math.max(t.z + inset, Math.min(t.z + t.height - inset, z));
    if (!lineOfSight3D(world.map, x, y, z, t.x, t.y, tz)) continue;
    const dmg = maxDamage * (1 - d / radius);
    damage(world, t, dmg, inflictor ?? { x, y }, source);
  }
}

/**
 * Instant bullet trace in 3D, from the attacker's fire height along `aim`'s
 * slope. Hits the first body before a wall, floor or ceiling, and leaves a
 * puff (or blood) where it struck. Shots into the sky leave nothing.
 */
export function hitscan(world, shooter, angle, range, amount, spec = {}, aim = aimAttack(world, shooter, angle, range)) {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const { z, slope } = aim;
  const wall = traceRay3D(world.map, shooter.x, shooter.y, z, dx, dy, slope, range);
  let best = null;
  let bestT = wall.dist;
  for (const t of world.things) {
    if (t === shooter || !t.shootable || t.dead || t.removed) continue;
    const hit = rayCylinder(shooter.x, shooter.y, z, dx, dy, slope, t.x, t.y, t.radius, t.z, t.z + t.height);
    if (hit >= 0 && hit < bestT) {
      bestT = hit;
      best = t;
    }
  }
  const back = Math.max(0, bestT - 0.06);
  const hx = shooter.x + dx * back;
  const hy = shooter.y + dy * back;
  const floor = world.map.floorAt(hx, hy);
  const ceil = world.map.ceilAt(hx, hy);
  const hz = Math.max(floor + PUFF_INSET, Math.min(ceil - PUFF_INSET, z + slope * back + world.rng.signed() * 0.04));
  if (best) {
    damage(world, best, amount, shooter, shooter);
    const fx = best.def.bleeds === false ? (spec.puff ?? 'puff') : (best.def.blood ?? 'blood');
    world.spawnEffect(fx, hx, hy, hz);
  } else if (wall.hit && !wall.sky) {
    world.spawnEffect(spec.puff ?? 'puff', hx, hy, hz);
  }
  return best;
}

/** How far above or below its own body a melee attack still reaches. */
const MELEE_REACH_Z = 0.25;

/** Nearest shootable thing within melee reach and in front of the attacker. */
export function meleeTarget(world, attacker, angle, range, arc = 0.7) {
  let best = null;
  let bestD = Infinity;
  for (const t of world.things) {
    if (t === attacker || !t.shootable || t.dead || t.removed) continue;
    const d = Math.hypot(t.x - attacker.x, t.y - attacker.y) - t.radius - attacker.radius;
    if (d > range - attacker.radius || d >= bestD) continue;
    let da = Math.atan2(t.y - attacker.y, t.x - attacker.x) - angle;
    da = Math.atan2(Math.sin(da), Math.cos(da));
    if (Math.abs(da) > arc) continue;
    // Within reach up and down too: bodies overlapping in height, give or take a little.
    if (t.z > attacker.z + attacker.height + MELEE_REACH_Z || attacker.z > t.z + t.height + MELEE_REACH_Z) continue;
    if (!lineOfSight3D(world.map, attacker.x, attacker.y, aimZ(attacker), t.x, t.y, aimZ(t))) continue;
    best = t;
    bestD = d;
  }
  return best;
}
