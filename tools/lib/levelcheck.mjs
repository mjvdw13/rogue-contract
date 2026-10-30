// Static level analysis for the dev tools: reachability from the player start
// (collecting keys as it goes), exits, secrets and per-skill thing counts.
// Reachability knows heights: what the hero's body can walk up, jump onto,
// drop from, crouch under and jump across, and where lifts carry it. Fences
// are never crossed (not even by jumping a low railing).
import { buildLevel } from '../../src/engine/world/level.js';
import { F_SOLID, F_DOOR, F_EXIT, F_USE, F_SECRET, F_SLAB } from '../../src/engine/world/tilemap.js';
import { BODY } from '../../src/engine/things/player.js';
import { footprint } from '../../src/engine/things/shape.js';

const EXIT_ACTIONS = ['exit', 'secretExit', 'finale'];
const actionsOf = (list) => [].concat(list ?? []).map((a) => (typeof a === 'string' ? { action: a } : a));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const EPS = 1e-6;
/** Widest gap (in tiles) a running jump is counted on to clear. */
const MAX_GAP = 4;

/** World-space collision lines of a model decoration spawn, or null. */
export function modelFootprint(reg, def, spawn) {
  const lines = def?.model ? reg.models.get(def.model)?.lines : null;
  return lines?.length ? footprint(lines, spawn.x, spawn.y, spawn.angle ?? 0, def.scale ?? 1) : null;
}

/**
 * What the player's body can do, from the hero's `body` settings: walk up
 * `step`, jump `apex` high and scramble `airStep` more onto a ledge, stand
 * `stand` tall or crouch to `crouch`.
 */
export function bodyLimits(reg) {
  const b = { ...BODY, ...(reg.hero?.body ?? {}) };
  return {
    step: b.stepHeight,
    airStep: b.airStep,
    apex: (b.jumpSpeed * b.jumpSpeed) / (2 * b.gravity),
    stand: b.height,
    crouch: b.crouchHeight,
  };
}

/**
 * The floors a player can stand at in each tile, as [floor, ceiling] pairs:
 * one for most tiles, one per stop on a lift, two under and on a slab (the
 * storey's index is its spot's), nothing in a solid tile. Rising doors count
 * as open.
 */
function standingSpots(map) {
  const spots = [];
  for (let i = 0; i < map.w * map.h; i++) {
    const f = map.flags[i];
    if (f & F_SOLID) {
      spots.push([]);
      continue;
    }
    const lift = map.liftIndex[i] >= 0 ? map.lifts[map.liftIndex[i]] : null;
    if (lift) {
      const room = lift.headroom[lift.tiles.indexOf(i)];
      spots.push(lift.stops.map((z) => [z, lift.moves === 'both' ? z + room : map.ceilZ[i]]));
      continue;
    }
    if (f & F_SLAB) {
      spots.push([
        [map.floorZ[i], map.slabBot[i]],
        [map.slabTop[i], map.ceilZ[i]],
      ]);
      continue;
    }
    let ceil = map.ceilZ[i];
    if (f & F_DOOR) {
      const d = map.doors[map.doorIndex[i]];
      if (d.style === 'rise') ceil = d.openZ;
    }
    spots.push([[map.floorZ[i], ceil]]);
  }
  return spots;
}

/**
 * Can the body get from a spot (floor fa, ceiling ca) into the neighbouring
 * one (fb, cb)? Drops are always fine. Rises up to a step are walked, higher
 * ones need a standing jump whose head stays under both ceilings. Crouching
 * gets through anything at least `crouch` high.
 */
export function canCross(body, fa, ca, fb, cb) {
  if (cb - fb < body.crouch - EPS || Math.min(ca, cb) - Math.max(fa, fb) < body.crouch - EPS) return false;
  const rise = fb - fa;
  if (rise <= body.step + EPS) return true;
  if (ca - fa < body.stand - EPS) return false;
  const jump = Math.min(body.apex, Math.min(ca, cb) - fa - body.stand);
  return rise <= jump + body.airStep + EPS;
}

/**
 * Analyse one level at one skill.
 * @returns {{ built, reached: Uint8Array, keys: Set<string>, exit: boolean, problems: string[], notes: string[], oneWay: string[], counts: object }}
 */
export function analyseLevel(reg, level, skill = 3) {
  const built = buildLevel(reg, level, { skill, textureSlot: () => 0 });
  const { map, spawns, playerStart } = built;
  const W = map.w;
  const problems = [];
  const notes = [];

  // Tags that some trigger or switch can open (remote doors behind them count
  // as passable if they stay open, or if what opens them can be used again).
  const openable = new Set();
  const reopenable = new Set();
  const collect = (list, again) => {
    for (const a of actionsOf(list)) {
      if (a.action !== 'openDoors' || !a.tag) continue;
      openable.add(a.tag);
      if (again) reopenable.add(a.tag);
    }
  };
  for (const t of level.triggers ?? []) collect(t.do, t.once === false);
  for (const u of map.uses.values()) collect(u.actions, u.repeat);

  // Solid, indestructible decorations block their tile for walking purposes.
  const blocked = new Uint8Array(W * map.h);
  const slabBlocked = new Uint8Array(W * map.h);
  const byTile = new Map();
  for (const s of spawns) {
    const def = reg.things.get(s.type);
    const i = Math.floor(s.y) * W + Math.floor(s.x);
    if (!byTile.has(i)) byTile.set(i, []);
    byTile.get(i).push({ ...s, def });
    if (def?.kind === 'decoration' && def.solid && !def.health) {
      // (Under or on a slab, only its own storey.)
      if (map.flags[i] & F_SLAB) slabBlocked[i] |= 1 << map.storeyAt(i, (s.z ?? -Infinity) + 0.5);
      else blocked[i] = 1;
      // A big model blocks every tile its collision lines cross.
      const seg = modelFootprint(reg, def, s);
      for (let j = 0; seg && j < seg.length; j += 4) {
        const n = Math.ceil(Math.hypot(seg[j + 2] - seg[j], seg[j + 3] - seg[j + 1]) / 0.05);
        for (let q = 0; q <= n; q++) {
          const x = Math.floor(seg[j] + ((seg[j + 2] - seg[j]) * q) / n);
          const y = Math.floor(seg[j + 1] + ((seg[j + 3] - seg[j + 1]) * q) / n);
          if (map.inBounds(x, y)) blocked[y * W + x] = 1;
        }
      }
    }
  }

  const keys = new Set();
  const reached = new Uint8Array(W * map.h);
  const passable = (i) => {
    const f = map.flags[i];
    if (f & F_DOOR) {
      const d = map.doors[map.doorIndex[i]];
      if (!d.lock) return true;
      if (d.lock === 'remote') return d.stayOpen ? openable.has(d.tag) : reopenable.has(d.tag);
      return keys.has(d.lock);
    }
    return !(f & F_SOLID) && !blocked[i];
  };
  if (!playerStart) return { built, reached, keys, exit: false, problems: ['no player start'], notes, oneWay: [], counts: {} };

  // Search over standing spots (a tile, at one of its floors), not just tiles.
  const body = bodyLimits(reg);
  const spots = standingSpots(map);
  const base = new Int32Array(W * map.h + 1);
  for (let i = 0; i < W * map.h; i++) base[i + 1] = base[i] + spots[i].length;
  const visited = new Uint8Array(base[W * map.h]);
  const start = Math.floor(playerStart.y) * W + Math.floor(playerStart.x);
  const startFloor = map.storeyFloor(start, map.storeyAt(start, (playerStart.z ?? -Infinity) + 0.5));
  const startSpot = Math.max(0, spots[start].findIndex(([z]) => Math.abs(z - startFloor) < EPS));
  /**
   * Does a fence on the edge between tiles a and b stop a body crossing at
   * floor height z? Always, between tiles without slabs; beside a slab only
   * where it stands at the body's height (not a railing on a bridge overhead).
   */
  const fenceStops = (a, b, z) => {
    const f = map.fenceBetween(a, b);
    if (!f) return false;
    if (!((map.flags[a] | map.flags[b]) & F_SLAB)) return true;
    return map.fenceBottom(f) < z + body.stand - EPS && map.fenceTop(f) > z + EPS;
  };
  // Every spot you can move to from spot k of tile c: call go(tile, spot).
  const moves = (c, k, go) => {
    const [fa, ca] = spots[c][k];
    const lift = map.liftIndex[c];
    // A lift carries you to each of its stops.
    if (lift >= 0) for (let s = 0; s < spots[c].length; s++) if (s !== k) go(c, s);
    const cx = c % W;
    const cy = (c / W) | 0;
    for (const [dx, dy] of DIRS) {
      // Walking, climbing or dropping into the next tile...
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= map.h) continue;
      const n = ny * W + nx;
      if (!passable(n)) continue;
      spots[n].forEach(([fb, cb], s) => {
        // (Tiles of one lift move together.)
        if (lift >= 0 && map.liftIndex[n] === lift && s !== k) return;
        if (slabBlocked[n] & (1 << s) || fenceStops(c, n, Math.max(fa, fb))) return;
        if (canCross(body, fa, ca, fb, cb)) go(n, s);
      });
      // ...or a running jump over a gap of up to MAX_GAP tiles (no higher
      // than the take-off), landing no higher than a step, with headroom to
      // stand all the way across.
      if (ca - fa < body.stand - EPS) continue;
      for (let gap = 1; gap <= MAX_GAP; gap++) {
        const mid = (cy + dy * gap) * W + cx + dx * gap;
        const lx = cx + dx * (gap + 1);
        const ly = cy + dy * (gap + 1);
        if (!passable(mid) || map.flags[mid] & F_DOOR) break;
        if (fenceStops(mid - dy * W - dx, mid, fa)) break;
        // Over a slab tile, one of its storeys has to be clear at the jump's height.
        const clear = ([fm, cm]) => fm <= fa + EPS && cm - fa >= body.stand - EPS;
        if (map.flags[mid] & F_SLAB ? !spots[mid].some(clear) : !spots[mid].every(clear)) break;
        if (lx < 0 || ly < 0 || lx >= W || ly >= map.h) break;
        const land = ly * W + lx;
        if (!passable(land) || fenceStops(mid, land, fa)) break;
        spots[land].forEach(([fb, cb], s) => {
          if (slabBlocked[land] & (1 << s)) return;
          if (fb - fa <= body.step + EPS && canCross(body, fa, ca, fb, cb)) go(land, s);
        });
      }
    }
  };

  /** Is a placed thing reached: its tile, in its storey (under a slab unless its z is on it)? */
  const thingReached = (t) => {
    const i = Math.floor(t.y) * W + Math.floor(t.x);
    if (!(map.flags[i] & F_SLAB)) return reached[i] === 1;
    return visited[base[i] + map.storeyAt(i, (t.z ?? -Infinity) + 0.5)] === 1;
  };

  let changed = true;
  while (changed) {
    changed = false;
    visited.fill(0);
    reached.fill(0);
    const stack = [];
    const visit = (i, k) => {
      if (visited[base[i] + k]) return;
      visited[base[i] + k] = 1;
      reached[i] = 1;
      stack.push(i, k);
    };
    visit(start, startSpot);
    while (stack.length) {
      const k = stack.pop();
      moves(stack.pop(), k, visit);
    }
    for (const [i, list] of byTile) {
      if (!reached[i]) continue;
      for (const t of list) {
        if (!thingReached(t)) continue;
        // A key lying there, or one a monster there always drops when killed.
        const carried = (t.drops ?? []).filter((d) => d.chance >= 1).map((d) => reg.things.get(d.item)?.pickup?.key);
        for (const key of [t.def?.pickup?.key, ...carried]) {
          if (key && !keys.has(key)) {
            keys.add(key);
            changed = true;
          }
        }
      }
    }
  }

  // One-way areas: places you can get to (by dropping, say) but can't get
  // back to the start from. Walk the moves backwards from the start.
  const back = Array.from({ length: visited.length }, () => []);
  for (let c = 0; c < W * map.h; c++) {
    for (let k = 0; k < spots[c].length; k++) {
      if (visited[base[c] + k]) moves(c, k, (n, s) => back[base[n] + s].push(base[c] + k));
    }
  }
  const returns = new Uint8Array(visited.length);
  const queue = [base[start] + startSpot];
  returns[queue[0]] = 1;
  while (queue.length) for (const p of back[queue.pop()]) if (!returns[p]) queue.push(p), (returns[p] = 1);
  const stuck = new Uint8Array(W * map.h);
  for (let c = 0; c < W * map.h; c++) {
    for (let k = 0; k < spots[c].length; k++) if (visited[base[c] + k] && !returns[base[c] + k]) stuck[c] = 1;
  }
  const oneWay = [];
  for (let i = 0; i < W * map.h; i++) {
    if (!stuck[i]) continue;
    // Gather the connected patch of such tiles.
    let size = 0;
    const patch = [i];
    stuck[i] = 0;
    while (patch.length) {
      const c = patch.pop();
      size++;
      for (const [dx, dy] of DIRS) {
        const nx = (c % W) + dx;
        const ny = ((c / W) | 0) + dy;
        const n = ny * W + nx;
        if (nx >= 0 && ny >= 0 && nx < W && ny < map.h && stuck[n]) patch.push(n), (stuck[n] = 0);
      }
    }
    oneWay.push(`${size} tile(s) near (${i % W}, ${(i / W) | 0}) can be reached but not left back to the start`);
  }

  // Exits: exit floors, exit switches next to a reached tile, exit triggers on reached tags.
  const near = (i) => {
    const x = i % W;
    const y = (i / W) | 0;
    return [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]].some(([nx, ny]) => nx >= 0 && ny >= 0 && nx < W && ny < map.h && reached[ny * W + nx]);
  };
  let exit = false;
  for (let i = 0; i < W * map.h; i++) {
    if (map.flags[i] & F_EXIT && reached[i]) exit = true;
    if (map.flags[i] & F_USE && near(i) && map.uses.get(i)?.actions.some((a) => EXIT_ACTIONS.includes(a.action))) exit = true;
  }
  for (const t of level.triggers ?? []) {
    if (!actionsOf(t.do).some((a) => EXIT_ACTIONS.includes(a.action))) continue;
    if (t.on === 'start') exit = true;
    if ((t.on === 'enter' || t.on === 'use') && map.tilesWithTag(t.tag).some((i) => reached[i] || near(i))) exit = true;
    if (t.on === 'killed' || t.on === 'pickup') {
      const targets = spawns.filter((s) => (t.thing ? s.type === t.thing : s.tag === t.tag));
      if (targets.some(thingReached)) exit = true;
    }
  }
  if (!exit) problems.push('the exit cannot be reached from the start');

  // Things that can never be reached.
  const counts = { monsters: 0, items: 0, decorations: 0, byType: {} };
  for (const [i, list] of byTile) {
    for (const t of list) {
      const kind = t.def?.kind;
      if (kind === 'monster') counts.monsters++;
      else if (kind === 'item') counts.items++;
      else if (kind === 'decoration') counts.decorations++;
      counts.byType[t.type] = (counts.byType[t.type] ?? 0) + 1;
      // (A model that isn't solid may be centred in a wall: a ring round a column.)
      if (map.flags[i] & F_SOLID && !(t.def?.model && !t.def.solid)) problems.push(`${t.type} at (${i % W}, ${(i / W) | 0}) is inside a wall`);
      else if (!thingReached(t) && kind === 'item') notes.push(`${t.type} at (${i % W}, ${(i / W) | 0}) is unreachable`);
      if (kind === 'item' && t.def.pickup?.key && !thingReached(t)) problems.push(`key ${t.type} at (${i % W}, ${(i / W) | 0}) is unreachable`);
    }
  }
  for (const d of map.doors) {
    if (d.lock && d.lock !== 'remote' && !keys.has(d.lock)) problems.push(`door at (${d.x}, ${d.y}) needs the ${d.lock} key, which can't be reached`);
  }

  // Secret groups (connected secret tiles) and whether each can be reached.
  let secrets = 0;
  const seen = new Uint8Array(W * map.h);
  for (let i = 0; i < W * map.h; i++) {
    if (!(map.flags[i] & F_SECRET) || seen[i]) continue;
    secrets++;
    let ok = false;
    const stack = [i];
    seen[i] = 1;
    while (stack.length) {
      const c = stack.pop();
      if (reached[c]) ok = true;
      const cx = c % W;
      const cy = (c / W) | 0;
      for (const [nx, ny] of [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]]) {
        const n = ny * W + nx;
        if (nx < 0 || ny < 0 || nx >= W || ny >= map.h || seen[n] || !(map.flags[n] & F_SECRET)) continue;
        seen[n] = 1;
        stack.push(n);
      }
    }
    if (!ok) problems.push(`secret area near (${i % W}, ${(i / W) | 0}) can't be reached`);
  }
  counts.secrets = secrets;
  return { built, reached, thingReached, keys, exit, problems, notes, oneWay, counts };
}

const avg = (d) => (Array.isArray(d) ? (d[0] + d[1]) / 2 : d ?? 0);

/** Average damage one unit of each ammo type can deal with the best weapon that uses it. */
export function ammoValues(reg) {
  const values = {};
  for (const w of reg.weapons.values()) {
    if (!w.ammo || !w.fire) continue;
    let dmg = 0;
    if (w.fire.kind === 'projectile') {
      const p = reg.things.get(w.fire.projectile);
      dmg = avg(p?.damage) + (p?.splash?.damage ?? 0) * 0.5;
    } else {
      dmg = avg(w.fire.damage) * (w.fire.pellets ?? 1);
    }
    const perUnit = dmg / (w.ammoPerShot ?? 1);
    values[w.ammo] = Math.max(values[w.ammo] ?? 0, perUnit);
  }
  return values;
}

/**
 * Rough ammo budget: damage the reachable ammo (plus monster drops) can deal,
 * divided by the total health of the monsters. Doom levels usually sit
 * around 2; under 1.2 means players will run dry.
 */
export function ammoBudget(reg, analysis) {
  const values = ammoValues(reg);
  const { map, spawns } = analysis.built;
  let damage = 0;
  let health = 0;
  const addAmmo = (ammo) => {
    for (const [id, n] of Object.entries(ammo ?? {})) damage += n * (values[id] ?? 0);
  };
  for (const s of spawns) {
    const def = reg.things.get(s.type);
    if (!def) continue;
    if (def.kind === 'monster') {
      health += def.health ?? 0;
      for (const d of [...(def.drops ?? []), ...(s.drops ?? [])]) addAmmo(reg.things.get(d.item)?.pickup?.ammo);
    } else if (def.kind === 'item' && (analysis.thingReached ? analysis.thingReached(s) : analysis.reached[Math.floor(s.y) * map.w + Math.floor(s.x)])) {
      addAmmo(def.pickup?.ammo);
    }
  }
  return { damage, health, ratio: health ? damage / health : Infinity };
}
