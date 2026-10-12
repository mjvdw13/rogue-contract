import { VIEW_W, PIXEL_ASPECT, FOV_DEG } from '../config.js';
import { rayCircle, lineOfSight3D } from '../world/physics.js';

/** Vertical focal length of the view in pixels: turns pitch (horizon pixels) into a slope. */
const FOCAL_Y = VIEW_W / 2 / Math.tan((FOV_DEG * Math.PI) / 360) / PIXEL_ASPECT;

/**
 * How far auto-aim bends a player's shot up or down, as a slope (about 7°).
 * It only nudges the shot onto a body the crosshair is already on
 * horizontally; it never turns it sideways.
 */
export const AUTOAIM_SLOPE = 0.12;

/** Player missiles leave a little below the eye, so they don't fill the view. */
const MISSILE_DROP = 0.2;

/** Height a thing's shots start from: the player's eye, or most of the way up a monster. */
export function fireZ(t) {
  if (t.player) return t.z + t.player.viewHeight + t.player.viewOffset;
  return t.z + t.height * 0.6;
}

/** Height a shot aims for on a target: the middle of its body. */
export function aimZ(t) {
  return t.z + t.height / 2;
}

/** Can `a` see `b`'s body (its middle or its head) from the height it shoots from? */
export function canSeeBody(map, a, b) {
  const z = fireZ(a);
  return lineOfSight3D(map, a.x, a.y, z, b.x, b.y, aimZ(b)) || lineOfSight3D(map, a.x, a.y, z, b.x, b.y, b.z + b.height * 0.9);
}

/** The slope the player's view is pitched at (positive looks up). */
export function pitchSlope(pt) {
  return (pt.pitch ?? 0) / FOCAL_Y;
}

/**
 * Where an attack starts and how steeply it climbs. Players shoot along their
 * view pitch, nudged onto a monster in the line of fire (unless auto-aim is
 * off). Monsters aim straight at their target's body.
 * @returns {{z:number, slope:number}}
 */
export function aimAttack(world, attacker, angle, range = 96) {
  const z = fireZ(attacker);
  if (attacker.player) {
    const slope = pitchSlope(attacker);
    return { z, slope: world.settings.autoAim === false ? slope : autoAim(world, attacker, angle, z, slope, range) };
  }
  const t = attacker.target;
  if (!t || t.dead || t.removed) return { z, slope: 0 };
  const d = Math.max(0.1, attacker.distanceTo(t));
  return { z, slope: (aimZ(t) - z) / d };
}

/** Start height for a missile fired with a given aim. */
export function missileZ(attacker, aim) {
  return attacker.player ? aim.z - MISSILE_DROP : aim.z;
}

/**
 * Doom-style vertical auto-aim: of the monsters the shot passes over or under
 * (and that the shooter can see), the nearest one within AUTOAIM_SLOPE of the
 * view gets the shot bent just far enough to land on its body.
 */
function autoAim(world, shooter, angle, z, slope, range) {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  let best = slope;
  let bestD = Infinity;
  for (const t of world.things) {
    if (t === shooter || t.kind !== 'monster' || !t.shootable || t.dead || t.removed) continue;
    const d = rayCircle(shooter.x, shooter.y, dx, dy, t.x, t.y, t.radius);
    if (d < 0 || d > range || d >= bestD) continue;
    const at = Math.max(0.1, d);
    // The slopes that land on its body, with a little margin inside the edges.
    const margin = Math.min(0.2, t.height * 0.2);
    const lo = (t.z + margin - z) / at;
    const hi = (t.z + t.height - margin - z) / at;
    const want = Math.min(hi, Math.max(lo, slope));
    if (Math.abs(want - slope) > AUTOAIM_SLOPE) continue;
    if (!lineOfSight3D(world.map, shooter.x, shooter.y, z, t.x, t.y, z + want * Math.hypot(t.x - shooter.x, t.y - shooter.y))) continue;
    best = want;
    bestD = d;
  }
  return best;
}
