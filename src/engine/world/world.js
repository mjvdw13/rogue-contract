import { buildLevel } from './level.js';
import { F_SECRET, F_DAMAGE, F_EXIT, F_USE } from './tilemap.js';
import { Backdrop } from './backdrop.js';
import { initNpc, npcThink, npcReact, npcPain } from '../things/npc.js';
import { castRay, blockedByMap, fenceBlocks, rayCircle, slantNear } from './physics.js';
import { updateDoors, openDoor, closeDoor } from './doors.js';
import { updateLifts, startLift, liftAt } from './lifts.js';
import { LightEffects } from './lights.js';
import { LightMap } from './lightmap.js';
import { Particles } from './particles.js';
import { Explosions } from './explosions.js';
import { GLINT_REACH } from './lightsources.js';
import { FlowField, WALKER } from './nav.js';
import { noiseAlert } from './noise.js';
import { Triggers } from './triggers.js';
import { runActions } from './actions.js';
import { Thing } from '../things/thing.js';
import { overlap } from '../things/shape.js';
import { PlayerState, playerThink, playerCamera } from '../things/player.js';
import { monsterThink, wakeMonster, monsterPain, applyMomentum } from '../things/monster.js';
import { projectileThink, launchProjectile, effectThink } from '../things/projectile.js';
import { tryPickup } from '../things/pickups.js';
import { damage, radiusDamage, hitscan, meleeTarget, corpseThink } from '../combat/damage.js';
import { weaponSprites, bestWeapon } from '../things/weapons.js';
import { TEXELS_PER_UNIT } from '../config.js';

/** Difficulty settings (1 = easiest .. 5 = nightmare). Placement per skill is up to each level. */
export const SKILLS = {
  1: { damageTaken: 0.5, ammoMultiplier: 2, monsterSpeed: 1, cooldownMultiplier: 1.35, fast: false },
  2: { damageTaken: 1, ammoMultiplier: 1, monsterSpeed: 1, cooldownMultiplier: 1.15, fast: false },
  3: { damageTaken: 1, ammoMultiplier: 1, monsterSpeed: 1, cooldownMultiplier: 1, fast: false },
  4: { damageTaken: 1, ammoMultiplier: 1, monsterSpeed: 1.05, cooldownMultiplier: 0.9, fast: false },
  5: { damageTaken: 1, ammoMultiplier: 2, monsterSpeed: 1.45, cooldownMultiplier: 0.55, fast: true },
};

const USE_RANGE = 2.6;
/**
 * Items are in reach from slightly above them (Doom allows 8 map units, about
 * a quarter of a tile here) up to the top of the player's body. Jumping over
 * an item doesn't pick it up.
 */
const PICKUP_BELOW_FEET = 0.3;
const FLOOR_DAMAGE_INTERVAL = 0.9;
/** Gravity for everything but the player (who has its own in the hero's body). */
const GRAVITY = 28;
/** How far a walking body may hang over the edge of a drop it won't step off. */
const OVERHANG = 0.15;
/** A sprite frame's height in world units, as the sprite renderer draws it. */
const spriteHeight = (sheet, def) => (sheet.fh * (def?.scale ?? 1) * (sheet.scale ?? 1)) / TEXELS_PER_UNIT;
/** While a lift moves, flow fields are refreshed this often (seconds). */
const NAV_REFRESH = 0.25;

/**
 * One running level: the map, every thing in it, and the rules that tie
 * them together. Rendering, input and audio live outside; the world only
 * calls `services` (audio, hud messages, music) when it needs them.
 */
/** How far through its animation a thing is (0-1). */
function animProgress(t) {
  const a = t.anim;
  if (!a) return 0;
  let done = t.animTime;
  let total = 0;
  for (let k = 0; k < a.durations.length; k++) {
    total += a.durations[k];
    if (k < t.animPos) done += a.durations[k];
  }
  return t.animDone ? 1 : total > 0 ? Math.min(1, done / total) : 0;
}

export class World {
  /**
   * @param {{registry:any, assets?:any, audio?:any, rng:any, settings?:any, hooks?:any}} services
   * @param {*} level a defineLevel() result
   * @param {{skill?:number, snapshot?:any}} [opts]
   */
  constructor(services, level, { skill = 3, snapshot = null } = {}) {
    this.registry = services.registry;
    this.assets = services.assets ?? null;
    this.audio = services.audio ?? null;
    this.rng = services.rng;
    this.settings = services.settings ?? {};
    this.hooks = services.hooks ?? {};
    this.game = services.game ?? null;
    this.level = level;
    this.skill = skill;
    this.skillInfo = SKILLS[skill] ?? SKILLS[3];
    this.time = 0;
    this.things = [];
    this.exitRequested = null;
    this.restartRequested = false;
    this.lastNoise = -1;
    this.floorTimer = 0;
    /** The friendly NPC the player last walked into (it reacts on its next think). */
    this.playerBumped = null;

    const slot = this.assets ? (id) => this.assets.textureSlot(id) : () => 0;
    const built = buildLevel(this.registry, level, { skill, textureSlot: slot });
    this.buildErrors = built.errors;
    this.map = built.map;
    this.fog = level.fog ?? 0.05;
    /** Outdoors, surfaces fade toward this colour with distance (halfway at `half` tiles) instead of darkening. */
    this.haze = level.haze ? { color: level.haze.color, half: level.haze.half ?? 40 } : null;
    /** Terrain past the edge of play, drawn where the sky shows (world/backdrop.js). */
    this.backdrop = level.backdrop ? new Backdrop(level.backdrop, (id) => (this.assets ? this.assets.textureSlot(id) : 0)) : null;
    this.skyTexture = level.sky && this.assets ? this.assets.textures[this.assets.textureSlot(level.sky)] : null;
    /** Smooth light, interpolated between tile centres (the renderer reads `map.lightmap`). */
    this.lightmap = new LightMap(this.map, { occlusion: level.occlusion ?? 0 });
    this.map.lightmap = this.lightmap;
    /** Light from sources only, reaching further, for glints on sprites (the renderer reads `map.glintmap`). */
    this.glintmap = new LightMap(this.map, { glint: true });
    this.map.glintmap = this.glintmap;
    /** Sparks, smoke, sand: cosmetic, drawn as points (render/particles.js). */
    this.particles = new Particles(this.map, [...this.registry.particles.values()], this.registry.paletteDef?.ramps);
    /** Explosions made of particles, a flash and a sound (world/explosions.js), set off with explode(). */
    this.explosions = new Explosions(this);
    this.lights = new LightEffects(this.map, this.rng, this.lightmap);
    this.nav = new FlowField(this.map);
    /** Flow fields per kind of body (see navFor), the walker's being `nav`. */
    this.navFields = new Map([[navKey(WALKER), this.nav]]);
    this.navRefresh = 0;
    this.triggers = new Triggers(this, level.triggers);

    this.stats = { kills: 0, totalKills: 0, items: 0, totalItems: 0, secrets: 0, totalSecrets: 0, time: 0 };
    this._initSecrets();

    // Player.
    const hero = this.registry.hero ?? {};
    const start = built.playerStart ?? { x: 1.5, y: 1.5, angle: 0 };
    this.playerDef = {
      id: 'player',
      kind: 'player',
      radius: hero.radius ?? 0.5,
      height: hero.body?.height ?? 1.7,
      health: hero.health ?? 100,
      solid: true,
      shootable: true,
      anims: {},
      sounds: hero.sounds ?? {},
      hooks: {},
      bleeds: true,
      blood: hero.blood ?? 'blood',
      mass: 100,
    };
    this.player = new Thing(this.playerDef, start.x, start.y, start.angle);
    this.player.player = new PlayerState(this.registry, snapshot);
    // (The lower storey under a slab, unless the start's `z` puts it on top.)
    this.player.z = this.map.floorAt(start.x, start.y, this.player.radius, (start.z ?? -Infinity) + 0.5);
    this.player.pitch = 0;
    this.player.health = this.player.player.health;
    this.things.push(this.player);
    this._lastTile = -1;

    for (const s of built.spawns) {
      if (this.settings.noMonsters && this.registry.things.get(s.type)?.kind === 'monster') continue;
      const t = this.spawn(s.type, s.x, s.y, s.angle);
      if (!t) continue;
      t.ambush = s.ambush;
      t.tag = s.tag;
      t.drops = s.drops;
      if (s.z !== null && s.z !== undefined) t.z = s.z;
      if (t.kind === 'monster' && t.def.countKill) this.stats.totalKills++;
      if (t.kind === 'item' && t.def.countItem) this.stats.totalItems++;
      // (The renderer stops rays over the skyline: keep tall scenery, a
      // dome on a roof, under it.)
      this.map.skyline = Math.max(this.map.skyline, t.z + (t.height ?? 0) + 1);
    }
    this.nav.update(Math.floor(start.x), Math.floor(start.y), true, this.reach(this.player));
    this.triggers.start();
  }

  _initSecrets() {
    const map = this.map;
    this.secretGroup = new Int16Array(map.w * map.h).fill(-1);
    let groups = 0;
    for (let i = 0; i < map.w * map.h; i++) {
      if (!(map.flags[i] & F_SECRET) || this.secretGroup[i] >= 0) continue;
      const g = groups++;
      const stack = [i];
      this.secretGroup[i] = g;
      while (stack.length) {
        const c = stack.pop();
        const cx = c % map.w;
        const cy = (c / map.w) | 0;
        for (const [nx, ny] of [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]]) {
          if (!map.inBounds(nx, ny)) continue;
          const n = ny * map.w + nx;
          if (map.flags[n] & F_SECRET && this.secretGroup[n] < 0) {
            this.secretGroup[n] = g;
            stack.push(n);
          }
        }
      }
    }
    this.secretFound = new Uint8Array(groups);
    this.stats.totalSecrets = groups;
  }

  // ------------------------------------------------------------ things

  /**
   * Create a thing of a registered type. Returns null for unknown types. Under
   * a slab it goes in the lower storey, unless `z` (a height it's dropped
   * from, say a monster's feet) reaches the slab's top.
   */
  spawn(type, x, y, angle = 0, z = null) {
    const def = this.registry.things.get(type);
    if (!def) {
      console.warn(`Unknown thing type "${type}"`);
      return null;
    }
    const t = new Thing(def, x, y, angle);
    t.sheet = this.assets?.sheetFor(def) ?? null;
    t.model = this.assets?.modelFor(def) ?? null;
    if (def.kind === 'projectile') {
      if (!t.setAnim('fly')) t.setAnim('idle');
    } else if (!t.setAnim('idle')) {
      t.setAnim('walk');
    }
    if (t.solid) this.unstick(t);
    if (def.kind === 'monster') t.timer = this.rng.range(0, 0.3);
    if (def.kind === 'npc') initNpc(this, t);
    const reach = (z ?? -Infinity) + 0.5;
    if (def.kind === 'decoration' && def.hanging) t.z = this.map.ceilAt(x, y, 0, reach) - (t.sheet ? spriteHeight(t.sheet, def) : t.height);
    else if (def.kind !== 'projectile' && def.kind !== 'effect') t.z = this.map.floorAt(x, y, 0, reach) + (def.z ?? 0);
    this.things.push(t);
    def.hooks?.onSpawn?.(this, t);
    return t;
  }

  /**
   * Things wider than half a tile, placed at a tile centre beside a wall,
   * would start with their body in the wall and be stuck there. Move them to
   * the nearest spot that's clear (searching outward a little at a time).
   */
  unstick(t) {
    if (!blockedByMap(this.map, t.x, t.y, t.radius)) return;
    for (let d = 0.05; d <= 1; d += 0.05) {
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2;
        const x = t.x + Math.cos(a) * d;
        const y = t.y + Math.sin(a) * d;
        if (!blockedByMap(this.map, x, y, t.radius)) {
          t.x = x;
          t.y = y;
          return;
        }
      }
    }
  }

  remove(t) {
    t.removed = true;
  }

  spawnEffect(id, x, y, z = 0) {
    if (!id || !this.registry.things.has(id)) return null;
    const e = this.spawn(id, x, y);
    if (e) e.z = z - (e.sheet ? spriteHeight(e.sheet, e.def) * 0.5 : 0);
    return e;
  }

  /**
   * Set off explosion `id` (defineExplosion) at (x, y, z): particles, a flash
   * and a sound, for looks only. `dir` is the way it faces (out of what it
   * hit); near the floor it faces up.
   */
  explode(id, x, y, z, opts) {
    return this.explosions.explode(id, x, y, z, opts);
  }

  spawnProjectile(id, owner, angle, spec, aim) {
    return launchProjectile(this, id, owner, angle, spec, aim);
  }

  // ------------------------------------------------------------ movement

  /**
   * Highest floor under a box of half-size r at (x, y). Under a slab, the
   * floor of the storey a body reaching up to `reach` is in (see reach()).
   */
  floorAt(x, y, r = 0, reach = Infinity) {
    return this.map.floorAt(x, y, r, reach);
  }

  /** Lowest ceiling over a box of half-size r at (x, y) (storeys as in floorAt). */
  ceilAt(x, y, r = 0, reach = Infinity) {
    return this.map.ceilAt(x, y, r, reach);
  }

  /**
   * How high thing `t` reaches for a floor: its feet plus the step it can
   * take. A slab whose top is within reach is under it (it's on the upper
   * storey); a higher one is over it.
   */
  reach(t) {
    return t.z + this.stepHeight(t);
  }

  /**
   * Can thing `t` stand at (x, y)? Checks walls, closed doors, floors too high
   * to step onto, ceilings too low to fit under, and solid things at the same
   * height. A `walk` also won't leave the body straddling a drop deeper than
   * the thing steps down (Doom's dropoff rule): monsters and friendlies don't
   * walk off ledges or hang over their edges, but can be knocked off.
   */
  checkPosition(t, x, y, walk = false) {
    const map = this.map;
    if (blockedByMap(map, x, y, t.radius)) return false;
    if (t.kind !== 'projectile' && fenceBlocks(map, x, y, t.radius, t.z, t.z + t.height)) return false;
    const reach = this.reach(t);
    const floor = map.floorAt(x, y, t.radius, reach);
    const ceil = map.ceilAt(x, y, t.radius, reach);
    if (floor - t.z > this.stepHeight(t)) return false;
    if (walk && !t.player && !t.def.flying) {
      // A body may hang a little over an edge (OVERHANG), so it needn't be
      // exactly centred on a one-tile-wide step to stand on it.
      const r = Math.max(0, t.radius - OVERHANG);
      const straddle = map.floorAt(x, y, r, reach) - map.lowFloorAt(x, y, r, reach);
      // (Already straddling one, say after a push, it may still move to straddle less.)
      const now = map.floorAt(t.x, t.y, r, reach) - map.lowFloorAt(t.x, t.y, r, reach);
      if (straddle > this.dropHeight(t) + 1e-6 && straddle > now - 1e-6) return false;
    }
    if (ceil - Math.max(floor, t.z) < t.height) return false;
    if (!t.solid) return true;
    for (const o of this.things) {
      if (o === t || !o.solid || o.removed) continue;
      if (t.kind === 'projectile' || o.kind === 'projectile') continue;
      if (o.z >= t.z + t.height || t.z >= o.z + o.height) continue;
      // (Model scenery with `lines` collides as those walls, others as cylinders.)
      const depth = overlap(o, x, y, t.radius);
      if (depth > 0) {
        // Allow moving apart if already overlapping.
        if (depth > overlap(o, t.x, t.y, t.radius)) {
          if (t === this.player && o.kind === 'npc') this.playerBumped = o;
          return false;
        }
      }
    }
    return true;
  }

  /** How high a step thing `t` can walk up right now. */
  stepHeight(t) {
    if (t.player) {
      const body = t.player.body;
      return t.player.onGround ? body.stepHeight : body.airStep;
    }
    return t.def.stepHeight ?? WALKER.step;
  }

  /** How far down a monster or friendly will walk off a ledge (Doom: no further than it steps up). */
  dropHeight(t) {
    return t.def.dropHeight ?? this.stepHeight(t);
  }

  /**
   * Where a walking thing stands at its position: the floor, plus any `z`
   * offset of its def (a flyer's `z` is its hover height, so not for those).
   */
  groundZ(t) {
    return this.map.floorAt(t.x, t.y, t.radius, this.reach(t)) + (t.def.flying ? 0 : (t.def.z ?? 0));
  }

  /**
   * Move with wall sliding. Returns true if the thing moved at all. `walk`
   * moves (a monster's own steps) won't go off ledges; pushes can. Walkers
   * step straight up onto higher floors and fall down to lower ones (see fall).
   */
  tryMove(t, dx, dy, walk = false) {
    const moved = this._slide(t, dx, dy, walk);
    if (moved && !t.player && !(t.def.flying && !t.dead)) t.z = Math.max(t.z, this.groundZ(t));
    return moved;
  }

  /**
   * Gravity for things other than the player: falling to the floor (riding a
   * lift down included). Live flyers instead stay between the floor and
   * ceiling; dead ones drop.
   */
  fall(t, dt) {
    if (t.def.hanging) return;
    if (t.def.flying && !t.dead) {
      const reach = this.reach(t);
      const floor = this.map.floorAt(t.x, t.y, t.radius, reach);
      const top = this.map.ceilAt(t.x, t.y, t.radius, reach) - t.height;
      t.z = Math.max(floor, Math.min(Math.max(floor, top), t.z));
      return;
    }
    const ground = this.groundZ(t);
    if (t.z <= ground) {
      t.z = ground;
      t.vz = 0;
      return;
    }
    t.vz -= GRAVITY * dt;
    t.z += t.vz * dt;
    if (t.z <= ground) {
      t.z = ground;
      t.vz = 0;
    }
  }

  /** The flow field toward the player for a monster's kind of body. */
  navFor(t) {
    if (t.navField) return t.navField;
    const profile = {
      step: this.stepHeight(t),
      drop: this.dropHeight(t),
      height: t.height,
      flying: !!t.def.flying,
    };
    const key = navKey(profile);
    let field = this.navFields.get(key);
    if (!field) {
      field = new FlowField(this.map, profile);
      field.update(Math.floor(this.player.x), Math.floor(this.player.y), true, this.reach(this.player));
      this.navFields.set(key, field);
    }
    t.navField = field;
    return field;
  }

  _slide(t, dx, dy, walk = false) {
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 0.4));
    let moved = false;
    for (let i = 0; i < steps; i++) {
      const sx = dx / steps;
      const sy = dy / steps;
      if (this.checkPosition(t, t.x + sx, t.y + sy, walk)) {
        t.x += sx;
        t.y += sy;
        moved = true;
        continue;
      }
      // (Tiny components, like cos(90 degrees), don't count as a slide.)
      let slid = false;
      if (Math.abs(sx) > 1e-9 && this.checkPosition(t, t.x + sx, t.y, walk)) {
        t.x += sx;
        slid = true;
      } else if (t.player) t.vx = 0;
      if (Math.abs(sy) > 1e-9 && this.checkPosition(t, t.x, t.y + sy, walk)) {
        t.y += sy;
        slid = true;
      } else if (t.player) t.vy = 0;
      // Against an angled wall, slide along it: try the move turned 45 degrees each way.
      if (!slid && slantNear(this.map, t.x, t.y, t.radius + 0.25)) {
        for (const turn of [Math.PI / 4, -Math.PI / 4]) {
          const c = Math.cos(turn) * Math.SQRT1_2;
          const s = Math.sin(turn) * Math.SQRT1_2;
          const mx = sx * c - sy * s;
          const my = sx * s + sy * c;
          if (this.checkPosition(t, t.x + mx, t.y + my, walk)) {
            t.x += mx;
            t.y += my;
            slid = true;
            break;
          }
        }
      }
      moved = moved || slid;
      if (!slid) break;
    }
    return moved;
  }

  /** Is any solid thing standing in tile (tx, ty)? */
  tileOccupied(tx, ty) {
    for (const t of this.things) {
      if (!t.solid || t.removed) continue;
      if (t.x + t.radius > tx && t.x - t.radius < tx + 1 && t.y + t.radius > ty && t.y - t.radius < ty + 1) return true;
    }
    return false;
  }

  // ------------------------------------------------------------ combat

  damage(target, amount, inflictor, source, opts) {
    damage(this, target, amount, inflictor, source, opts);
    if (target?.player) target.health = target.player.health;
  }

  radiusDamage(x, y, radius, amount, inflictor, source, z, opts) {
    return radiusDamage(this, x, y, radius, amount, inflictor, source, z, opts);
  }

  hitscan(shooter, angle, range, amount, spec, aim) {
    return hitscan(this, shooter, angle, range, amount, spec, aim);
  }

  meleeTarget(attacker, angle, range, arc) {
    return meleeTarget(this, attacker, angle, range, arc);
  }

  wakeMonster(m, target) {
    wakeMonster(this, m, target);
  }

  npcPain(t) {
    npcPain(this, t);
  }

  monsterPain(m) {
    monsterPain(this, m);
  }

  noiseAlert(source) {
    if (this.time - this.lastNoise < 0.15) return;
    this.lastNoise = this.time;
    noiseAlert(this, source);
  }

  playerDied(source) {
    const pt = this.player;
    const p = pt.player;
    if (p.dead) return;
    p.dead = true;
    p.deathTime = this.time;
    p.killer = source ?? null;
    pt.dead = true;
    pt.shootable = false;
    this.playSound('player-death');
    this.hooks.onPlayerDeath?.(this);
  }

  /** After picking up ammo with an empty gun, switch to something that can use it. */
  autoSwitchForAmmo(ammoId) {
    const p = this.player?.player;
    if (!p) return;
    const cur = this.registry.weapons.get(p.weapon);
    const curEmpty = cur?.ammo && (p.ammo[cur.ammo] ?? 0) < cur.ammoPerShot;
    if (cur && cur.fire?.kind !== 'melee' && !curEmpty) return;
    let best = null;
    for (const id of p.weapons) {
      const w = this.registry.weapons.get(id);
      if (w?.ammo === ammoId && (!best || (w.priority ?? 0) > (best.priority ?? 0))) best = w;
    }
    if (best && best.id !== p.weapon) p.pendingWeapon = best.id;
  }

  // ------------------------------------------------------------ interaction

  openDoor(d) {
    return openDoor(this, d);
  }

  /** The player presses "use": doors, switches and tagged walls in front of them. */
  use(pt) {
    const dx = Math.cos(pt.angle);
    const dy = Math.sin(pt.angle);
    const hit = castRay(this.map, pt.x, pt.y, dx, dy, USE_RANGE);
    // Friendly characters (NPCs) in front of the player get talked to first.
    for (const t of this.things) {
      if (t.kind !== 'npc' || t.removed || t.dead) continue;
      const d = rayCircle(pt.x, pt.y, dx, dy, t.x, t.y, t.radius + 0.1);
      if (d >= 0 && d < Math.min(hit.dist, USE_RANGE)) {
        npcReact(this, t);
        return;
      }
    }
    if (hit.door) {
      this._useDoor(hit.door, pt);
      return;
    }
    if (hit.passedDoor && hit.passedDoor.state === 'open' && !hit.passedDoor.stayOpen) {
      closeDoor(this, hit.passedDoor);
      return;
    }
    if (hit.dist < USE_RANGE && this.map.inBounds(hit.tx, hit.ty)) {
      const i = this.map.index(hit.tx, hit.ty);
      if (this.map.flags[i] & F_USE) {
        this._useSwitch(i, hit.tx, hit.ty);
        return;
      }
      if (this.triggers.useTile(i)) return;
    }
    // A lift underfoot or just ahead.
    const map = this.map;
    for (const d of [0, 0.9]) {
      const tx = Math.floor(pt.x + dx * d);
      const ty = Math.floor(pt.y + dy * d);
      const lift = map.inBounds(tx, ty) ? liftAt(map, ty * map.w + tx) : null;
      if (lift?.on.has('use')) {
        if (!startLift(this, lift)) this.playSound('oof');
        return;
      }
    }
    if (hit.dist < USE_RANGE) this.playSound('oof');
  }

  _useDoor(d, pt) {
    const p = pt.player;
    if (d.lock === 'remote') {
      this.playSound('door-locked');
      return;
    }
    if (d.lock && !p.keys.has(d.lock)) {
      const key = this.registry.config.keys?.find((k) => k.id === d.lock);
      this.message(this.registry.text('needKey', { key: key?.name ?? d.lock }));
      this.playSound('door-locked');
      return;
    }
    if (d.state === 'open' || d.state === 'opening') {
      if (!d.stayOpen) closeDoor(this, d);
    } else {
      openDoor(this, d);
    }
  }

  _useSwitch(i, tx, ty) {
    const u = this.map.uses.get(i);
    if (!u || (u.used && !u.repeat)) {
      this.playSound('oof');
      return;
    }
    u.used = true;
    if (u.switchTo >= 0) {
      const old = this.map.wallTex[i];
      this.map.wallTex[i] = u.switchTo;
      if (u.repeat) u.switchTo = old;
    }
    this.playSoundAt(u.sound ?? 'switch', tx + 0.5, ty + 0.5);
    runActions(this, u.actions, { tile: i });
    this.triggers.useTile(i);
  }

  requestExit(kind = 'normal') {
    if (!this.exitRequested) this.exitRequested = kind;
  }

  requestRestart() {
    this.restartRequested = true;
  }

  message(text) {
    this.hooks.message?.(text);
  }

  // ------------------------------------------------------------ audio

  playSound(id, opts) {
    if (id) this.audio?.play(id, opts);
  }

  playSoundAt(id, x, y) {
    if (!id || !this.audio) return;
    const p = this.player;
    this.audio.playAt(id, x, y, p.x, p.y, p.angle);
  }

  playSoundFrom(id, thing) {
    if (!id || !thing) return;
    if (thing === this.player) this.playSound(id);
    else this.playSoundAt(id, thing.x, thing.y);
  }

  // ------------------------------------------------------------ simulation

  tick(dt, input) {
    this.time += dt;
    this.stats.time += dt;
    this.lights.update(dt);
    updateDoors(this, dt);
    updateLifts(this, dt);

    const pt = this.player;
    playerThink(this, pt, input, dt, this.settings);
    pt.health = pt.player.health;
    if (!pt.player.dead) {
      this._playerTile();
      this._pickups();
    }

    const list = this.things;
    for (let i = 0; i < list.length; i++) {
      const t = list[i];
      if (t.removed || t === pt) continue;
      switch (t.kind) {
        case 'monster':
          monsterThink(this, t, dt);
          this.fall(t, dt);
          corpseThink(this, t, dt);
          break;
        case 'projectile':
          projectileThink(this, t, dt);
          break;
        case 'effect':
          effectThink(this, t, dt);
          break;
        case 'npc':
          applyMomentum(this, t, dt);
          npcThink(this, t, dt);
          this.fall(t, dt);
          break;
        default:
          if (t.def.spin) t.angle += t.def.spin * dt;
          applyMomentum(this, t, dt);
          this.fall(t, dt);
          t.stepAnim(dt);
          corpseThink(this, t, dt);
          t.def.hooks?.onThink?.(this, t, dt);
      }
    }
    if (list.some((t) => t.removed)) this.things = list.filter((t) => !t.removed);
    this.explosions.update(dt);
    this.particles.update(dt);
    const dyn = this.dynamicLights();
    this.lightmap.setDynamic(dyn);
    this.lightmap.update();
    this.glintmap.setDynamic(dyn.map((l) => ({ ...l, radius: l.radius * GLINT_REACH })));
    this.glintmap.update();
    // Moving lifts change floor heights, so routes are refreshed while they run.
    this.navRefresh -= dt;
    const refresh = this.navRefresh <= 0 && this.map.lifts.some((l) => l.state === 'moving');
    if (refresh) this.navRefresh = NAV_REFRESH;
    for (const field of this.navFields.values()) field.update(Math.floor(pt.x), Math.floor(pt.y), refresh, this.reach(pt));
  }

  /**
   * This frame's dynamic lights: things with a `light` while they glow (a
   * fullbright frame: a bolt, a muzzle flash, an explosion), effects and
   * bursting bolts fading as their animation plays, explosions' flashes and
   * the player's muzzle flash.
   */
  dynamicLights() {
    const out = this.explosions.lights([]);
    for (const t of this.things) {
      const l = t.def.light;
      if (!l || !t.fullbright || t.removed) continue;
      let light = l.light;
      if (t.kind === 'effect' || (t.kind === 'projectile' && t.animName === 'explode')) light *= 1 - animProgress(t);
      if (light >= 1) out.push({ x: t.x, y: t.y, z: t.z, radius: l.radius, light });
    }
    const pt = this.player;
    const ws = pt?.player?.weaponState;
    const wl = ws?.def?.light;
    if (wl && ws.state === 'fire' && ws.fullbright) out.push({ x: pt.x, y: pt.y, z: pt.z + pt.player.viewHeight, radius: wl.radius, light: wl.light });
    return out;
  }

  _playerTile() {
    const pt = this.player;
    const tx = Math.floor(pt.x);
    const ty = Math.floor(pt.y);
    if (!this.map.inBounds(tx, ty)) return;
    const i = ty * this.map.w + tx;
    const f = this.map.flags[i];
    if (i !== this._lastTile) {
      this._lastTile = i;
      if (f & F_SECRET) {
        const g = this.secretGroup[i];
        if (g >= 0 && !this.secretFound[g]) {
          this.secretFound[g] = 1;
          this.stats.secrets++;
          this.message(this.registry.text('secretFound'));
          this.playSound('secret');
        }
      }
      this.triggers.enterTile(i);
      const lift = liftAt(this.map, i);
      if (lift?.on.has('enter')) startLift(this, lift);
      if (f & F_EXIT) this.requestExit('normal');
    }
    if (f & F_DAMAGE) {
      this.floorTimer -= 1 / 60;
      if (this.floorTimer <= 0) {
        this.floorTimer = FLOOR_DAMAGE_INTERVAL;
        this.damage(pt, this.map.damage[i], null, null, { environment: true, noThrust: true, ignoreArmor: false });
      }
    } else {
      this.floorTimer = 0.3;
    }
  }

  _pickups() {
    const pt = this.player;
    for (const t of this.things) {
      if (t.kind !== 'item' || t.removed) continue;
      const r = t.radius + pt.radius;
      if ((t.x - pt.x) ** 2 + (t.y - pt.y) ** 2 > r * r) continue;
      const dz = t.z - pt.z;
      if (dz < -PICKUP_BELOW_FEET || dz > pt.height) continue;
      if (!tryPickup(this, pt, t)) continue;
      t.removed = true;
      const p = pt.player;
      p.bonusCount = Math.min(p.bonusCount + 18, 60);
      if (t.def.message) this.message(t.def.message);
      this.playSound(t.def.sound ?? 'item');
      if (t.def.countItem && !t.dropped) this.stats.items++;
      this.triggers.pickup(t);
    }
    pt.health = pt.player.health;
  }

  // ------------------------------------------------------------ rendering helpers

  camera() {
    return playerCamera(this, this.player);
  }

  psprites() {
    return weaponSprites(this, this.player);
  }

  bestWeapon() {
    return bestWeapon(this.registry, this.player.player);
  }
}

function navKey(p) {
  return `${p.flying ? 'fly' : 'walk'}:${p.step}:${p.drop}:${p.height}`;
}
