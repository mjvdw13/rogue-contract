/**
 * Pushing past people. Walk into a friendly or a calm character and keep
 * walking: after `body.pushDelay` seconds they give way, stepping back from
 * the player at `body.pushSpeed` tiles a second (times 100 / their `mass`, so
 * a Jawa gives way quicker than Bossk) while the player follows at their
 * pace. They step along the line between the two, so a push off-centre moves
 * them aside. Walls, ledges and other bodies still stop them; against one
 * the player slides round them instead.
 */

/** How far apart (beyond touching) still counts as pressing against someone. */
const CONTACT = 0.1;
/** The gap the player keeps while pushing. */
const GAP = 0.02;
/** How directly the player must walk into them: within 60 degrees. */
const PRESSING = Math.cos(Math.PI / 3);
/** How long they keep stepping after the last push (so a missed tick doesn't stop the walk). */
const HOLD = 0.15;

/** Can the player push thing `o`? Friendlies and calm monsters, standing. */
export function pushable(o) {
  return (o.kind === 'npc' || !!o.calm) && o.solid && !o.dead && !o.removed;
}

/**
 * How fast thing `t`'s walk plays while it's pushed, given the speed its walk
 * is drawn for: slowed (or quickened) to the push, so the feet keep to the floor.
 */
export function shoveRate(t, walkSpeed) {
  return t.shoved > 0 && walkSpeed > 0 ? t.shoveSpeed / walkSpeed : 1;
}

/** The pushable body the player is pressing against, walking along unit (ux, uy), or null. */
function pressedAgainst(world, pt, ux, uy) {
  let best = null;
  let most = PRESSING;
  for (const o of world.things) {
    if (o === pt || !pushable(o)) continue;
    if (o.z >= pt.z + pt.height || pt.z >= o.z + o.height) continue;
    const dx = o.x - pt.x;
    const dy = o.y - pt.y;
    const d = Math.hypot(dx, dy);
    if (d < 1e-6 || d > pt.radius + o.radius + CONTACT) continue;
    const into = (dx * ux + dy * uy) / d;
    if (into > most) {
      best = o;
      most = into;
    }
  }
  return best;
}

/**
 * The player's push, before it moves: `wishX`, `wishY` is the way the player
 * is walking. Moves whoever gives way and sets the player's speed toward
 * them to what they gave.
 */
export function pushThink(world, pt, wishX, wishY, dt) {
  const p = pt.player;
  const wish = Math.hypot(wishX, wishY);
  const o = wish > 0 && p.onGround ? pressedAgainst(world, pt, wishX / wish, wishY / wish) : null;
  if (o !== p.pushing) {
    p.pushing = o;
    p.pushTime = 0;
  }
  if (!o) return;
  p.pushTime += dt;
  if (p.pushTime < p.body.pushDelay) return;
  const d = Math.hypot(o.x - pt.x, o.y - pt.y);
  const nx = (o.x - pt.x) / d;
  const ny = (o.y - pt.y) / d;
  const speed = (p.body.pushSpeed * 100) / (o.def.mass ?? 100);
  const { x, y } = o;
  world.tryMove(o, nx * speed * dt, ny * speed * dt, true);
  const gave = Math.max(0, (o.x - x) * nx + (o.y - y) * ny);
  // Facing the player, stepping back (only if they really moved, not pressed to a wall).
  if (gave > speed * dt * 0.25) {
    o.shoved = HOLD;
    o.shoveSpeed = speed;
    o.angle = o.angleTo(pt);
    o.setAnim('walk', false);
  }
  // The player keeps pace with them, closing any gap but a hair (touching
  // exactly, rounding could count the move as pressing further in).
  const gap = d - pt.radius - o.radius;
  const keep = (gave + Math.max(0, gap - GAP)) / dt;
  const toward = pt.vx * nx + pt.vy * ny;
  pt.vx += (keep - toward) * nx;
  pt.vy += (keep - toward) * ny;
}
