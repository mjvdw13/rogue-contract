import { lineOfSight } from '../world/physics.js';
import { F_SOLID, F_DOOR, F_DAMAGE } from '../world/tilemap.js';
import { Rng } from '../core/rng.js';
import { UNREACHABLE } from '../world/nav.js';
import { pickLine, readyToReact } from './talk.js';
import { shoveRate } from './push.js';

/**
 * Friendly characters (townsfolk, coworkers). They are solid, and monsters
 * never notice them. Each one idles, strolls around the spot it was placed,
 * and reacts when the player bumps into it or presses use on it. Without
 * `health` every attack passes through them; with it they can be shot, and
 * once hurt they flee the player for good.
 */

const DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

/** How far an NPC may stroll: its placement's `wander`, else its type's. */
const reachOf = (t) => t.wanderReach ?? t.def.wander ?? 0;

/**
 * The tiles an NPC may stand on: open floor connected to its starting tile,
 * at most its `wander` steps away (the placement's, else the type's),
 * avoiding doors, hazards, the tiles next to doors and one-tile-wide
 * passages, so it never blocks the way.
 */
export function wanderArea(world, t) {
  const map = world.map;
  const radius = reachOf(t);
  const open = (x, y) => map.inBounds(x, y) && !(map.flags[map.index(x, y)] & (F_SOLID | F_DOOR | F_DAMAGE));
  const roomy = (x, y) => !((!open(x - 1, y) && !open(x + 1, y)) || (!open(x, y - 1) && !open(x, y + 1)));
  const byDoor = (x, y) => DIRS.some(([dx, dy]) => map.inBounds(x + dx, y + dy) && map.flags[map.index(x + dx, y + dy)] & F_DOOR);
  const ok = (x, y) => open(x, y) && roomy(x, y) && !byDoor(x, y);
  const hx = Math.floor(t.x);
  const hy = Math.floor(t.y);
  const area = new Set();
  if (!ok(hx, hy)) return area;
  const dist = new Map([[map.index(hx, hy), 0]]);
  const queue = [map.index(hx, hy)];
  while (queue.length) {
    const c = queue.shift();
    area.add(c);
    const d = dist.get(c);
    if (d >= radius) continue;
    const cx = c % map.w;
    const cy = (c / map.w) | 0;
    for (const [dx, dy] of DIRS) {
      const n = map.index(cx + dx, cy + dy);
      if (dist.has(n) || !ok(cx + dx, cy + dy)) continue;
      dist.set(n, d + 1);
      queue.push(n);
    }
  }
  return area;
}

export function initNpc(world, t) {
  t.area = wanderArea(world, t);
  // Their own dice, seeded by where they stand: friendlies never change the
  // random numbers the rest of the game sees (monsters, damage, demos).
  t.rng = new Rng(Math.floor(t.x * 977 + t.y * 131) + 1);
  t.state = 'idle';
  t.timer = t.rng.range(0.3, 2);
  t.reactCooldown = 0;
  t.stuck = 0;
  t.lastLine = -1;
  t.scared = false;
}

function idle(world, t) {
  const [a, b] = t.def.idleTime ?? [2, 5];
  t.state = 'idle';
  t.setAnim('idle', false);
  t.timer = t.rng.range(a, b);
}

function startWalk(world, t) {
  const map = world.map;
  const tiles = [...t.area].filter((i) => {
    const x = (i % map.w) + 0.5;
    const y = Math.floor(i / map.w) + 0.5;
    const d = Math.hypot(x - t.x, y - t.y);
    return d > 0.8 && lineOfSight(map, t.x, t.y, x, y);
  });
  if (!tiles.length || !t.def.anims.walk) return idle(world, t);
  const i = t.rng.pick(tiles);
  t.goal = [(i % map.w) + 0.5 + t.rng.range(-0.2, 0.2), Math.floor(i / map.w) + 0.5 + t.rng.range(-0.2, 0.2)];
  t.state = 'walk';
  t.setAnim('walk', false);
  t.timer = 8;
  t.stuck = 0;
}

/**
 * Move a little, not leaving the NPC's area (pushed out of it, it may walk
 * back in; with no area, it stays put). Returns false if it couldn't.
 */
function step(world, t, dx, dy) {
  const { x, y } = t;
  const inside = (x, y) => t.area.has(world.map.index(Math.floor(x), Math.floor(y)));
  if (!world.tryMove(t, dx, dy, true)) return false;
  if (!inside(t.x, t.y) && (inside(x, y) || t.area.size === 0)) {
    t.x = x;
    t.y = y;
    return false;
  }
  return true;
}

/**
 * Turn to the player, play the reaction and say something: the next line of
 * a conversation when the player uses them (`used`), see talk.js.
 */
export function npcReact(world, t, used = false) {
  if (t.scared || t.dead || !readyToReact(world, t, used, t.reactCooldown)) return false;
  const def = t.def;
  const p = world.player;
  t.angle = t.angleTo(p);
  t.state = 'react';
  if (!t.setAnim('react')) t.setAnim('idle', false);
  t.timer = def.reactTime ?? 1.8;
  t.reactCooldown = def.reactCooldown ?? 2.5;
  const line = pickLine(world, t, def.lines ?? [], t, used);
  if (line !== undefined) world.message(`${t.speaker ?? def.name}: ${line}`);
  if (def.sounds?.react) world.playSoundFrom(def.sounds.react, t);
  const a = p.angleTo(t);
  if (def.bubble) {
    // Beside their head, on the player's right, and under the ceiling.
    const z = Math.min((def.height ?? 1.7) + 0.08, 1.64);
    world.spawnEffect(def.bubble, t.x - Math.sin(a) * 0.22, t.y + Math.cos(a) * 0.22, z);
  }
  // Shuffle half a step away from whoever bumped into them.
  step(world, t, Math.cos(a) * 0.15, Math.sin(a) * 0.15);
  def.hooks?.onReact?.(world, t);
  return true;
}

/**
 * Hurt and still standing (see damage.js): the first time, it flinches
 * (`pain`), then flees the player from then on. Later hits only make it cry
 * out.
 */
export function npcPain(world, t) {
  world.playSoundFrom(t.def.sounds?.pain, t);
  if (t.scared) return;
  t.scared = true;
  t.stuck = 0;
  t.state = 'pain';
  if (!t.setAnim('pain')) startFlee(t);
}

function startFlee(t) {
  t.state = 'flee';
  if (!t.setAnim('flee', false)) t.setAnim('walk', false);
}

/** Stand still, cowering, until the player comes near again. */
function cower(t) {
  t.setAnim('idle', false);
}

/**
 * Run from the player: uphill along the player's flow field (through doors,
 * up steps and round walls), or straight away from them with no route
 * between. It stops when it's `fleeDistance` from them, or cornered.
 */
function flee(world, t, dt) {
  const p = world.player;
  if (p.player?.dead || t.distanceTo(p) >= (t.def.fleeDistance ?? 20)) return cower(t);
  let a;
  if (t.stuck > 0) {
    t.stuck -= dt;
    a = t.dodge;
  } else {
    const nav = world.navFor(t);
    const reach = world.reach(t);
    const n = nav.next(t.x, t.y, reach, true);
    if (n) a = Math.atan2(n.y - t.y, n.x - t.x);
    else if (nav.distanceAt(Math.floor(t.x), Math.floor(t.y), reach) === UNREACHABLE) a = p.angleTo(t);
    else return cower(t);
  }
  if (!t.setAnim('flee', false)) t.setAnim('walk', false);
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  // Open doors in the way, as monsters do.
  const door = world.map.doorAt(Math.floor(t.x + ca * (t.radius + 0.7)), Math.floor(t.y + sa * (t.radius + 0.7)));
  if (door && !door.passable && !door.lock && !door.secret) world.openDoor(door);
  const s = (t.def.fleeSpeed ?? 6) * dt;
  t.angle = a;
  if (!world.tryMove(t, ca * s, sa * s, true) && t.stuck <= 0) {
    // Blocked (another body, a ledge): dodge sideways for a moment.
    t.stuck = t.rng.range(0.3, 0.7);
    t.dodge = a + (t.rng.chance(0.5) ? 1 : -1) * (Math.PI / 2 + t.rng.range(0, 0.8));
  }
}

export function npcThink(world, t, dt) {
  t.stepAnim(dt * shoveRate(t, t.def.speed), (ev) => {
    if (ev.startsWith('sound:')) world.playSoundFrom(ev.slice(6), t);
    else t.def.hooks?.onEvent?.(world, t, ev);
  });
  if (t.dead) return;
  t.reactCooldown = Math.max(0, t.reactCooldown - dt);
  if (world.playerBumped === t) {
    world.playerBumped = null;
    if (npcReact(world, t)) return;
  }
  if (t.def.hooks?.onThink?.(world, t, dt) === true) return;
  if (t.shoved > 0) {
    // Giving way to the player's push (push.js moves it), then back to what it was doing.
    t.shoved -= dt;
    if (t.shoved <= 0) {
      if (t.scared) startFlee(t);
      else idle(world, t);
    }
    return;
  }

  switch (t.state) {
    case 'pain':
      if (t.animDone) startFlee(t);
      break;
    case 'flee':
      flee(world, t, dt);
      break;
    case 'react':
      t.timer -= dt;
      if (t.timer <= 0) idle(world, t);
      break;
    case 'walk': {
      const dx = t.goal[0] - t.x;
      const dy = t.goal[1] - t.y;
      const d = Math.hypot(dx, dy);
      t.timer -= dt;
      if (d < 0.12 || t.timer <= 0) {
        idle(world, t);
        break;
      }
      const s = Math.min(d, (t.def.speed ?? 1.1) * dt);
      t.angle = Math.atan2(dy, dx);
      if (step(world, t, (dx / d) * s, (dy / d) * s)) t.stuck = 0;
      else if ((t.stuck += dt) > 0.4) idle(world, t);
      break;
    }
    default:
      t.timer -= dt;
      if (t.timer > 0) break;
      if (reachOf(t) > 0 && t.area.size > 1 && t.rng.chance(0.75)) startWalk(world, t);
      else idle(world, t);
  }
}
