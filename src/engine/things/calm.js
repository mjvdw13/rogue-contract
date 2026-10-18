import { Rng } from '../core/rng.js';
import { lineOfSight } from '../world/physics.js';
import { wanderArea } from './npc.js';

/**
 * Calm monsters: troopers and Jawas going about their business in a town
 * that hasn't turned on the player yet. A calm monster never looks for the
 * player, hears no gunfire and never attacks. It stands its post, strolls
 * round its spot as friendly characters do (`wander` tiles), or walks a
 * patrol: straight from point to point, pausing at each, there and back
 * (or round, with `loop`). Bumped or used, it turns to the player and says
 * one of its `lines`. Hurt, it turns normal (endCalm).
 *
 * Like friendlies, it rolls its own dice, seeded by where it stands, so
 * calm characters never change the random numbers the rest of the game sees.
 */

/** Make monster `m` calm: `spec` is its placement's `calm` (true, or fields over its type's). */
export function makeCalm(world, m, spec) {
  const c = { ...m.def.calm, ...(spec === true ? {} : spec) };
  const route = c.patrol ? c.patrol.map(([x, y]) => ({ x, y })) : null;
  m.rng = new Rng(Math.floor(m.x * 977 + m.y * 131) + 1);
  m.calm = {
    lines: c.lines ?? [],
    speed: c.speed,
    idleTime: c.idleTime,
    route,
    loop: !!c.loop,
    // The patrol point it heads for next (the nearest to start with), and which way along.
    leg: route ? nearest(m, route) : 0,
    dir: 1,
    mode: 'stand',
    resume: 'stand',
    goal: null,
    timer: m.rng.range(0.3, 2),
    blocked: 0,
    stuck: 0,
    dodge: 0,
    reactCooldown: 0,
    lastLine: -1,
  };
  if (!route) {
    m.wanderReach = c.wander ?? 0;
    m.area = wanderArea(world, m);
  }
  m.state = 'calm';
  if (!m.setAnim('idle', false)) m.setAnim('walk', false);
}

/** Turn a calm monster into a normal one: from now on it looks for the player. */
export function endCalm(m) {
  if (!m.calm) return;
  m.calm = null;
  if (m.dead) return;
  m.state = 'idle';
  m.timer = 0;
  if (!m.setAnim('idle', false)) m.setAnim('walk', false);
}

function nearest(m, route) {
  let best = 0;
  for (let i = 1; i < route.length; i++) {
    if (Math.hypot(route[i].x - m.x, route[i].y - m.y) < Math.hypot(route[best].x - m.x, route[best].y - m.y)) best = i;
  }
  return best;
}

function stand(m) {
  const c = m.calm;
  const [a, b] = c.idleTime;
  c.mode = 'stand';
  c.goal = null;
  c.timer = m.rng.range(a, b);
  if (!m.setAnim('idle', false)) m.setAnim('walk', false);
}

function walkTo(m, x, y) {
  const c = m.calm;
  if (!m.def.anims.walk) return stand(m);
  c.mode = 'walk';
  c.goal = { x, y };
  c.timer = c.route ? Infinity : 8;
  c.blocked = 0;
  c.stuck = 0;
  m.setAnim('walk', false);
}

/** The next patrol point after the one just reached: on along the route, back at its end (or round). */
function nextLeg(c) {
  const n = c.route.length;
  if (c.loop) return (c.leg + 1) % n;
  if (c.leg + c.dir < 0 || c.leg + c.dir >= n) c.dir = -c.dir;
  return c.leg + c.dir;
}

function startStroll(world, m) {
  const map = world.map;
  const tiles = [...m.area].filter((i) => {
    const x = (i % map.w) + 0.5;
    const y = Math.floor(i / map.w) + 0.5;
    return Math.hypot(x - m.x, y - m.y) > 0.8 && lineOfSight(map, m.x, m.y, x, y);
  });
  if (!tiles.length) return stand(m);
  const i = m.rng.pick(tiles);
  walkTo(m, (i % map.w) + 0.5 + m.rng.range(-0.2, 0.2), Math.floor(i / map.w) + 0.5 + m.rng.range(-0.2, 0.2));
}

/** Turn to the player and say a line. Returns false while it's still cooling down from the last one. */
export function calmReact(world, m) {
  const c = m.calm;
  if (!c || c.reactCooldown > 0 || m.dead) return false;
  if (c.mode !== 'react') c.resume = c.mode;
  c.mode = 'react';
  c.timer = 1.8;
  c.reactCooldown = 2.5;
  m.angle = m.angleTo(world.player);
  if (!m.setAnim('idle', false)) m.setAnim('walk', false);
  if (c.lines.length) {
    let k = m.rng.int(0, c.lines.length - 1);
    if (k === c.lastLine && c.lines.length > 1) k = (k + 1) % c.lines.length;
    c.lastLine = k;
    world.message(`${m.def.name.toUpperCase()}: ${c.lines[k]}`);
  }
  return true;
}

/** One tick of a calm monster (monsterThink hands over while its state is 'calm'). */
export function calmThink(world, m, dt) {
  const c = m.calm;
  c.reactCooldown = Math.max(0, c.reactCooldown - dt);
  if (world.playerBumped === m) {
    world.playerBumped = null;
    if (calmReact(world, m)) return;
  }
  switch (c.mode) {
    case 'react':
      c.timer -= dt;
      if (c.timer > 0) break;
      if (c.resume === 'walk' && c.goal) walkTo(m, c.goal.x, c.goal.y);
      else stand(m);
      break;
    case 'walk':
      walk(world, m, dt);
      break;
    default:
      c.timer -= dt;
      if (c.timer > 0) break;
      if (c.route) walkTo(m, c.route[c.leg].x, c.route[c.leg].y);
      else if (m.wanderReach > 0 && m.area.size > 1 && m.rng.chance(0.75)) startStroll(world, m);
      else stand(m);
  }
}

function walk(world, m, dt) {
  const c = m.calm;
  const dx = c.goal.x - m.x;
  const dy = c.goal.y - m.y;
  const d = Math.hypot(dx, dy);
  c.timer -= dt;
  if (d < 0.15 || c.timer <= 0) {
    if (c.route) c.leg = nextLeg(c);
    return stand(m);
  }
  let a = Math.atan2(dy, dx);
  if (c.stuck > 0) {
    // Stepping round whoever is in the way.
    c.stuck -= dt;
    a = c.dodge;
  }
  const s = Math.min(d, c.speed * dt);
  const { x, y } = m;
  m.angle = a;
  let moved = world.tryMove(m, Math.cos(a) * s, Math.sin(a) * s, true);
  // A stroll stays inside its area, as a friendly's does.
  if (moved && !c.route && !m.area.has(world.map.index(Math.floor(m.x), Math.floor(m.y)))) {
    m.x = x;
    m.y = y;
    moved = false;
  }
  if (moved) {
    c.blocked = 0;
    return;
  }
  if ((c.blocked += dt) < 0.4) return;
  // Blocked for a moment: a stroll gives up; a patrol steps aside and goes on.
  if (!c.route) return stand(m);
  c.blocked = 0;
  c.stuck = m.rng.range(0.3, 0.7);
  c.dodge = Math.atan2(dy, dx) + (m.rng.chance(0.5) ? 1 : -1) * (Math.PI / 2 + m.rng.range(0, 0.8));
}
