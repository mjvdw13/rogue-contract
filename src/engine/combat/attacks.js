import { aimAttack } from './aim.js';

/**
 * Attack kinds shared by player weapons and monsters. An attack spec looks like
 *   { kind: 'hitscan', damage: [5, 15], pellets: 7, spread: 0.1, range: 40 }
 *   { kind: 'projectile', projectile: 'toner-rocket', count: 1, spread: 0 }
 *   { kind: 'melee', damage: [2, 20], range: 1.1, hitSound: 'punch' }
 * Content can register more kinds with defineAttack(name, fn). Every kind gets
 * `opts.aim` ({z, slope}): the height the attack starts from and how steeply
 * it climbs (see aim.js).
 */
export const BUILTIN_ATTACKS = {
  hitscan(world, attacker, spec, angle, opts) {
    const pellets = spec.pellets ?? 1;
    for (let i = 0; i < pellets; i++) {
      const spread = opts.accurate && pellets === 1 ? 0 : (spec.spread ?? 0);
      const a = angle + world.rng.signed() * spread;
      world.hitscan(attacker, a, spec.range ?? 48, world.rng.roll(spec.damage) * (opts.damageMult ?? 1), spec, opts.aim);
    }
    return true;
  },

  melee(world, attacker, spec, angle, opts) {
    const target = world.meleeTarget(attacker, angle, spec.range ?? 1.1, spec.arc ?? 0.7);
    if (!target) {
      if (spec.missSound) world.playSoundFrom(spec.missSound, attacker);
      return false;
    }
    if (attacker.player) attacker.angle = attacker.angleTo(target);
    const dmg = world.rng.roll(spec.damage) * (opts.damageMult ?? 1);
    world.damage(target, dmg, attacker, attacker);
    if (spec.hitSound) world.playSoundFrom(spec.hitSound, attacker);
    return true;
  },

  projectile(world, attacker, spec, angle, opts) {
    const count = spec.count ?? 1;
    for (let i = 0; i < count; i++) {
      const a =
        count > 1 ? angle + (i - (count - 1) / 2) * (spec.spread ?? 0.1) : angle + world.rng.signed() * (spec.spread ?? 0);
      world.spawnProjectile(spec.projectile, attacker, a, spec, opts.aim);
    }
    return true;
  },
};

/** Perform an attack of any kind from `attacker` toward `angle`. */
export function performAttack(world, attacker, spec, angle, opts = {}) {
  if (!spec) return false;
  const fn = BUILTIN_ATTACKS[spec.kind] ?? world.registry.attacks.get(spec.kind);
  if (!fn) {
    console.warn(`Unknown attack kind "${spec.kind}"`);
    return false;
  }
  if (spec.sound) world.playSoundFrom(spec.sound, attacker);
  return fn(world, attacker, spec, angle, { ...opts, aim: opts.aim ?? aimAttack(world, attacker, angle, spec.range) });
}
