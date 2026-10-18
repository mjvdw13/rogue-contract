import { performAttack } from '../combat/attacks.js';
import { canSeeBody } from '../combat/aim.js';
import { calmThink } from './calm.js';

/**
 * Definition-driven monster AI, in the spirit of Doom's:
 *   idle   -> looks for the player (or wakes on gunfire / being shot)
 *   chase  -> walks the flow field toward its target, attacks when it can
 *             (flyers also rise and sink toward the target's height)
 *   attack -> plays the attack animation; the 'fire' frame event deals damage
 *   pain   -> flinches
 *   dead   -> death animation, then a corpse
 *   calm   -> goes about its business and never attacks (calm.js), until
 *             it or the town turns hostile (world.turnHostile)
 * Hooks on the definition (onSight, onThink, onAttack, onPain, onDeath,
 * onEvent) allow custom behaviour without changing this file.
 */

export function wakeMonster(world, m, target) {
  if (m.dead) return;
  if (target && !target.dead) m.target = target;
  else m.target ??= world.player;
  if (m.state !== 'idle') return;
  m.state = 'chase';
  m.reaction = (m.def.reactionTime ?? 0.4) * (world.skillInfo.fast ? 0.25 : 1);
  m.cooldown = Math.max(m.cooldown, 0);
  world.playSoundFrom(m.def.sounds.sight, m);
  if (!m.setAnim('walk', false)) m.setAnim('idle', false);
  m.def.hooks?.onSight?.(world, m);
}

export function monsterPain(world, m) {
  if (m.dead || !m.def.anims.pain) return;
  m.state = 'pain';
  m.setAnim('pain');
  world.playSoundFrom(m.def.sounds.pain, m);
}

function canSee(world, m, t) {
  if (!t || t.dead || t.removed) return false;
  if (t.player?.notarget) return false;
  if (m.distanceTo(t) > (m.def.sightRange ?? 80)) return false;
  return canSeeBody(world.map, m, t);
}

function fireAttack(world, m) {
  const spec = m.attackSpec ?? m.def.attack ?? m.def.melee;
  if (!spec || m.dead) return;
  const t = m.target;
  const angle = t ? m.angleTo(t) : m.angle;
  m.angle = angle;
  performAttack(world, m, spec, angle);
  const [a, b] = m.def.cooldown ?? [1, 2];
  m.cooldown = world.rng.range(a, b) * (world.skillInfo.cooldownMultiplier ?? 1);
  m.def.hooks?.onAttack?.(world, m, spec);
}

function chooseAttack(world, m, t, d, los) {
  const def = m.def;
  if (def.melee && los && d <= (def.melee.range ?? 2.2) + t.radius) return def.melee;
  if (!def.attack || !los || m.reaction > 0 || m.cooldown > 0) return null;
  const range = def.attack.range ?? 80;
  if (d > range) return null;
  const minRange = def.attack.minRange ?? 0;
  if (d < minRange) return null;
  // Closer targets get attacked more eagerly (like Doom's P_CheckMissileRange).
  const eagerness = def.aggression ?? 0.65;
  if (world.rng.next() < eagerness * (1 - (d / range) * 0.6)) return def.attack;
  m.cooldown = world.rng.range(0.15, 0.45);
  return null;
}

function startAttack(world, m, spec) {
  m.state = 'attack';
  m.attackSpec = spec;
  if (m.target) m.angle = m.angleTo(m.target);
  const anim = spec === m.def.melee && m.def.anims.melee ? 'melee' : 'attack';
  if (!m.setAnim(anim)) {
    fireAttack(world, m);
    m.state = 'chase';
  }
}

function moveToward(world, m, dt, t, d, los) {
  const speed = (m.def.speed ?? 4) * (world.skillInfo.monsterSpeed ?? 1);
  let gx;
  let gy;
  // The route to the player for this body. Head straight for a target in
  // view, unless the route is a long way round (a ledge or a pit between).
  const nav = t === world.player ? world.navFor(m) : null;
  const reach = world.reach(m);
  const direct = los && (!nav || (d < 10 && nav.distanceAt(Math.floor(m.x), Math.floor(m.y), reach) <= d + 4));
  if (m.stuck > 0) {
    m.stuck -= dt;
    gx = m.x + Math.cos(m.wander);
    gy = m.y + Math.sin(m.wander);
  } else if (direct) {
    gx = t.x;
    gy = t.y;
  } else if (nav) {
    const n = nav.next(m.x, m.y, reach);
    if (n) {
      gx = n.x;
      gy = n.y;
    } else {
      gx = t.x;
      gy = t.y;
    }
  } else {
    gx = t.x;
    gy = t.y;
  }
  // Doom-like zig-zagging.
  m.strafeTimer = (m.strafeTimer ?? 0) - dt;
  if (m.strafeTimer <= 0) {
    m.strafeTimer = world.rng.range(0.4, 1.4);
    m.strafe = los && d > 4 ? world.rng.pick([-0.5, 0, 0, 0.5]) : 0;
  }
  const a = Math.atan2(gy - m.y, gx - m.x) + (m.stuck > 0 ? 0 : (m.strafe ?? 0));
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  // Open doors in the way.
  const ax = Math.floor(m.x + ca * (m.radius + 0.7));
  const ay = Math.floor(m.y + sa * (m.radius + 0.7));
  const door = world.map.doorAt(ax, ay);
  if (door && !door.passable && !door.lock && !door.secret) world.openDoor(door);

  const step = speed * dt;
  const moved = world.tryMove(m, ca * step, sa * step, true);
  if (m.def.flying) hover(world, m, t, dt, ca, sa);
  if (!moved && m.stuck <= 0) {
    m.stuck = world.rng.range(0.3, 0.7);
    m.wander = a + (world.rng.chance(0.5) ? 1 : -1) * (Math.PI / 2 + world.rng.range(0, 0.8));
  }
  m.angle = a;
}

/**
 * Flyers rise or sink to hover their own height (`z`) above the floor their
 * target stands on, and climb over any raised floor just ahead.
 */
function hover(world, m, t, dt, ca, sa) {
  const reach = m.radius + 0.6;
  const ahead = world.map.floorAt(m.x + ca * reach, m.y + sa * reach, m.radius, world.reach(m));
  const want = Math.max(t.z, ahead) + (m.def.z ?? 0);
  const climb = (m.def.flySpeed ?? 3) * dt;
  m.z += Math.max(-climb, Math.min(climb, want - m.z));
}

function applyMomentum(world, t, dt) {
  if (t.vx === 0 && t.vy === 0) return;
  world.tryMove(t, t.vx * dt, t.vy * dt);
  const f = Math.pow(0.82, dt * 60);
  t.vx *= f;
  t.vy *= f;
  if (Math.abs(t.vx) < 0.02) t.vx = 0;
  if (Math.abs(t.vy) < 0.02) t.vy = 0;
}

export function monsterThink(world, m, dt) {
  applyMomentum(world, m, dt);
  // A calm stroll is slower than a chase: its walk plays slower to match, so the feet don't slide.
  const rate = m.calm && m.animName === 'walk' ? m.calm.speed / (m.def.speed || 1) : 1;
  const finished = m.stepAnim(dt * rate, (ev) => {
    if (ev === 'fire') fireAttack(world, m);
    else if (ev.startsWith('sound:')) world.playSoundFrom(ev.slice(6), m);
    else m.def.hooks?.onEvent?.(world, m, ev);
  });
  if (m.dead) return;
  if (m.def.hooks?.onThink?.(world, m, dt) === true) return;

  switch (m.state) {
    case 'calm':
      calmThink(world, m, dt);
      break;
    case 'idle': {
      m.timer -= dt;
      if (m.timer <= 0) {
        m.timer = world.rng.range(0.15, 0.3);
        if (canSee(world, m, world.player)) wakeMonster(world, m, world.player);
      }
      break;
    }
    case 'pain':
      if (finished || m.animDone) {
        m.state = 'chase';
        m.setAnim('walk');
      }
      break;
    case 'attack':
      if (m.target && !m.target.dead) m.angle = m.angleTo(m.target);
      if (finished || m.animDone) {
        m.state = 'chase';
        m.setAnim('walk');
      }
      break;
    case 'chase': {
      m.reaction -= dt;
      m.cooldown -= dt;
      let t = m.target;
      if (!t || t.dead || t.removed) {
        t = m.target = world.player && !world.player.dead ? world.player : null;
        if (!t) {
          m.state = 'idle';
          if (!m.setAnim('idle', false)) m.setAnim('walk', false);
          return;
        }
      }
      const d = m.distanceTo(t);
      const los = canSeeBody(world.map, m, t);
      const spec = chooseAttack(world, m, t, d, los);
      if (spec) {
        startAttack(world, m, spec);
        return;
      }
      moveToward(world, m, dt, t, d, los);
      if (m.def.sounds.active && world.rng.next() < dt * 0.08) world.playSoundFrom(m.def.sounds.active, m);
      break;
    }
    default:
      break;
  }
}

export { applyMomentum };
