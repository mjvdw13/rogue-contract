import { lineOfSight } from '../world/physics.js';
import { F_SOLID, F_DOOR, F_DAMAGE } from '../world/tilemap.js';
import { Rng } from '../core/rng.js';

/**
 * Friendly characters (coworkers). They are solid but not shootable, so every
 * attack passes through them and monsters never notice them. Each one idles,
 * strolls around the spot it was placed, and reacts when the player bumps into
 * it or presses use on it.
 */

const DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

/**
 * The tiles an NPC may stand on: open floor connected to its starting tile,
 * at most `def.wander` steps away, avoiding doors, hazards, the tiles next to
 * doors and one-tile-wide passages, so it never blocks the way.
 */
export function wanderArea(world, t) {
  const map = world.map;
  const radius = t.def.wander ?? 0;
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

/** Move a little, staying inside the NPC's area. Returns false if it couldn't. */
function step(world, t, dx, dy) {
  const { x, y } = t;
  if (!world.tryMove(t, dx, dy, true)) return false;
  if (!t.area.has(world.map.index(Math.floor(t.x), Math.floor(t.y)))) {
    t.x = x;
    t.y = y;
    return false;
  }
  return true;
}

/** Turn to the player, play the reaction and say something. */
export function npcReact(world, t) {
  if (t.reactCooldown > 0) return false;
  const def = t.def;
  const p = world.player;
  t.angle = t.angleTo(p);
  t.state = 'react';
  if (!t.setAnim('react')) t.setAnim('idle', false);
  t.timer = def.reactTime ?? 1.8;
  t.reactCooldown = def.reactCooldown ?? 2.5;
  const lines = def.lines ?? [];
  if (lines.length) {
    let k = t.rng.int(0, lines.length - 1);
    if (k === t.lastLine && lines.length > 1) k = (k + 1) % lines.length;
    t.lastLine = k;
    world.message(`${def.name}: ${lines[k]}`);
  }
  if (def.sounds?.react) world.playSoundFrom(def.sounds.react, t);
  const a = p.angleTo(t);
  if (def.bubble) {
    // Beside their head, on the player's right, and under the ceiling.
    const z = Math.min((def.height ?? 0.85) + 0.04, 0.82);
    world.spawnEffect(def.bubble, t.x - Math.sin(a) * 0.22, t.y + Math.cos(a) * 0.22, z);
  }
  // Shuffle half a step away from whoever bumped into them.
  step(world, t, Math.cos(a) * 0.15, Math.sin(a) * 0.15);
  def.hooks?.onReact?.(world, t);
  return true;
}

export function npcThink(world, t, dt) {
  t.stepAnim(dt, (ev) => {
    if (ev.startsWith('sound:')) world.playSoundFrom(ev.slice(6), t);
    else t.def.hooks?.onEvent?.(world, t, ev);
  });
  t.reactCooldown = Math.max(0, t.reactCooldown - dt);
  if (world.playerBumped === t) {
    world.playerBumped = null;
    if (npcReact(world, t)) return;
  }
  if (t.def.hooks?.onThink?.(world, t, dt) === true) return;

  switch (t.state) {
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
      if ((t.def.wander ?? 0) > 0 && t.area.size > 1 && t.rng.chance(0.75)) startWalk(world, t);
      else idle(world, t);
  }
}
