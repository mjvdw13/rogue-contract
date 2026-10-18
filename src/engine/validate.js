import { buildLevel } from './world/level.js';
import { F_EXIT, F_SOLID, F_VOID, LIGHT_FX } from './world/tilemap.js';
import { BUILTIN_ACTION_NAMES } from './world/actions.js';
import { blockedByMap, lineOfSight } from './world/physics.js';
import { BUILTIN_ATTACKS } from './combat/attacks.js';
import { BUILTIN_PICKUPS } from './things/pickups.js';
import { PARTICLE_BLENDS, PARTICLE_FLOORS, PARTICLE_SHAPES, PARTICLE_WALLS, POINT_CAP, DISC_CAP } from './world/particles.js';
import { Hangings, HANGING_SHAPES, HANGING_PINS } from './world/hangings.js';

const PICKUP_MODIFIERS = ['maxHealth', 'armorClass', 'maxArmor', 'duration', 'always'];
const TRIGGER_EVENTS = ['start', 'enter', 'use', 'killed', 'pickup'];
/** Faces per model before the validator warns (render cost). */
const MODEL_BUDGET = 400;

/**
 * Check a content registry for mistakes: missing references, broken levels,
 * unknown glyphs... Returns { errors, warnings } as readable strings. Used by
 * the game at startup and by `npm run validate`.
 * @param {import('./registry.js').Registry} reg
 */
export function validateContent(reg) {
  const errors = [...reg.errors];
  const warnings = [];
  const err = (m) => errors.push(m);
  const warn = (m) => warnings.push(m);

  if (!reg.paletteDef?.colors || reg.paletteDef.colors.length !== 256) err('Palette must have exactly 256 colors');

  const checkSheet = (owner, sheet) => {
    if (!sheet) return err(`${owner}: has no sprite sheet`);
    const s = reg.sheets.get(sheet.ref);
    if (!s) return err(`${owner}: unknown sheet "${sheet.ref}"`);
    if (!s.src) err(`${owner}: sheet "${sheet.ref}" has no src`);
    for (const key of ['glint', 'glow']) {
      const list = s[key];
      if (list === undefined) continue;
      const colour = (c) => Array.isArray(c) && c.length === 3 && c.every((v) => Number.isInteger(v) && v >= 0 && v <= 255);
      if (!Array.isArray(list) || !list.every(colour)) err(`${owner}: sheet "${sheet.ref}" ${key} must be a list of [r, g, b] colours (0-255)`);
    }
    return undefined;
  };
  const checkSound = (owner, id) => {
    if (id && !reg.sounds.has(id)) warn(`${owner}: unknown sound "${id}"`);
  };
  const checkAttack = (owner, a) => {
    if (!a) return;
    if (!BUILTIN_ATTACKS[a.kind] && !reg.attacks.has(a.kind)) err(`${owner}: unknown attack kind "${a.kind}"`);
    if (a.kind === 'projectile') {
      const p = reg.things.get(a.projectile);
      if (!p) err(`${owner}: unknown projectile "${a.projectile}"`);
      else if (p.kind !== 'projectile') err(`${owner}: "${a.projectile}" is not a projectile`);
    }
    if (a.puff && !reg.things.has(a.puff)) err(`${owner}: unknown puff effect "${a.puff}"`);
    if (a.lockOn !== undefined && !(a.lockOn > 0 && a.lockOn <= 90)) err(`${owner}: lockOn is degrees either side, above 0 and up to 90`);
    for (const k of ['sound', 'hitSound', 'missSound']) checkSound(owner, a[k]);
  };
  // A monster type's `calm`, or a placement's (which may also have a patrol).
  const CALM_FIELDS = ['lines', 'speed', 'wander', 'idleTime', 'patrol', 'loop'];
  const checkCalm = (owner, c, placed) => {
    if (placed && c === true) return;
    if (!c || typeof c !== 'object' || Array.isArray(c)) return err(`${owner}: "calm" must be true or an object`);
    for (const k of Object.keys(c)) {
      if (!CALM_FIELDS.includes(k)) err(`${owner}: calm has unknown field "${k}" (it takes ${CALM_FIELDS.join(', ')})`);
    }
    if (c.lines !== undefined && !(Array.isArray(c.lines) && c.lines.every((l) => typeof l === 'string'))) err(`${owner}: calm lines must be a list of strings`);
    if (c.speed !== undefined && !(typeof c.speed === 'number' && c.speed > 0)) err(`${owner}: calm speed must be above 0 (tiles a second)`);
    if (c.wander !== undefined && !(typeof c.wander === 'number' && c.wander >= 0)) err(`${owner}: calm wander must be a number of tiles, 0 or more`);
    const t = c.idleTime;
    if (t !== undefined && !(Array.isArray(t) && t.length === 2 && t.every((v) => typeof v === 'number' && v >= 0) && t[0] <= t[1])) {
      err(`${owner}: calm idleTime must be [min, max] seconds, 0 or more`);
    }
    if (c.loop !== undefined && typeof c.loop !== 'boolean') err(`${owner}: calm loop must be true or false`);
    if (c.patrol === undefined) return undefined;
    if (!placed) return err(`${owner}: a patrol belongs on a placement in a level, not on the type`);
    const point = (p) => Array.isArray(p) && p.length === 2 && p.every((v) => typeof v === 'number');
    if (!(Array.isArray(c.patrol) && c.patrol.length >= 2 && c.patrol.every(point))) err(`${owner}: calm patrol must be a list of two or more [x, y] points`);
    return undefined;
  };
  // A patrol walks straight from point to point (and from its spot to the
  // nearest), so each point must have room for the body and each walk a
  // clear line.
  const checkPatrol = (who, map, sp, def) => {
    const pts = sp.calm.patrol;
    const at = ([x, y]) => `(${x}, ${y})`;
    if (!def.anims.walk) warn(`${who} patrols but its type has no "walk" animation (it will stand still)`);
    for (const p of pts) {
      if (!map.inBounds(Math.floor(p[0]), Math.floor(p[1])) || blockedByMap(map, p[0], p[1], def.radius)) err(`${who}: patrol point ${at(p)} has no room for it to stand`);
    }
    const walks = pts.slice(1).map((p, i) => [pts[i], p]);
    if (sp.calm.loop) walks.push([pts[pts.length - 1], pts[0]]);
    const first = pts.reduce((a, p) => (Math.hypot(p[0] - sp.x, p[1] - sp.y) < Math.hypot(a[0] - sp.x, a[1] - sp.y) ? p : a));
    walks.push([[sp.x, sp.y], first]);
    for (const [a, p] of walks) {
      if (!lineOfSight(map, a[0], a[1], p[0], p[1])) err(`${who}: the patrol's walk from ${at(a)} to ${at(p)} is blocked (each walk is a straight line)`);
    }
  };
  const checkAnims = (owner, anims) => {
    for (const [name, anim] of Object.entries(anims ?? {})) {
      if (!anim) continue;
      for (const f of anim.views ? anim.views.flat() : anim.frames) {
        if (!Number.isInteger(f) || f < 0) err(`${owner}: animation "${name}" has a bad frame number ${f}`);
      }
    }
  };

  for (const t of reg.textures.values()) {
    if (!t.src) err(`Texture "${t.id}": missing src`);
    if (typeof t.grime !== 'boolean') err(`Texture "${t.id}": "grime" must be true or false`);
    else if (t.grime && (t.sky || t.fence || t.frames !== 1)) err(`Texture "${t.id}": grime is a still decal, not a sky, a fence or animated`);
  }

  for (const m of reg.models?.values() ?? []) {
    const owner = `model "${m.id}"`;
    for (const id of new Set(m.faces.map((f) => f.tex).filter(Boolean))) {
      if (!reg.textures.has(id)) err(`${owner}: unknown texture "${id}"`);
    }
    if (m.faces.length > MODEL_BUDGET) warn(`${owner}: ${m.faces.length} faces is over the budget of ${MODEL_BUDGET}`);
  }

  /** A thing's or weapon's `light: { radius, light }` (its glow lights the room). */
  const checkLight = (owner, l) => {
    if (l === undefined || l === null) return;
    if (typeof l !== 'object' || !(l.radius > 0) || typeof l.light !== 'number') err(`${owner}: "light" needs a "radius" above 0 and a "light" (how much it adds)`);
  };

  // A list of particle bursts: [{ type, count, speed, spread, dir }] (world/particles.js burst);
  // an explosion's (`timed`) may also have delay, over, radius, z and dir 'up', 'out' or 'ring'.
  const checkBursts = (owner, list, timed = false) => {
    if (list === undefined) return;
    if (!Array.isArray(list)) return err(`${owner}: "particles" must be a list of bursts`);
    for (const b of list) {
      if (!reg.particles.has(b?.type)) err(`${owner}: unknown particle type "${b?.type}"`);
      if (b?.count !== undefined && !(Number.isInteger(b.count) && b.count >= 1)) err(`${owner}: a burst's count must be a whole number, at least 1`);
      const speed = [].concat(b?.speed ?? 0);
      if (!speed.every((v) => typeof v === 'number' && v >= 0) || speed.length > 2) err(`${owner}: a burst's speed is units a second, or [min, max]`);
      if (b?.spread !== undefined && !(b.spread >= 0 && b.spread <= 2)) err(`${owner}: a burst's spread must be 0 to 2`);
      const named = timed && (b?.dir === 'up' || b?.dir === 'out' || b?.dir === 'ring');
      if (b?.dir !== undefined && !named && !(Array.isArray(b.dir) && b.dir.length === 3 && b.dir.every((v) => typeof v === 'number'))) {
        err(`${owner}: a burst's dir is [x, y, z]${timed ? ", 'up', 'out' or 'ring'" : ''}`);
      }
      if (!timed) continue;
      const delay = [].concat(b?.delay ?? 0);
      if (!delay.every((v) => typeof v === 'number' && v >= 0) || delay.length > 2) err(`${owner}: a burst's delay is seconds, or [min, max]`);
      for (const key of ['over', 'radius']) if (b?.[key] !== undefined && !(typeof b[key] === 'number' && b[key] >= 0)) err(`${owner}: a burst's ${key} must be a number, 0 or more`);
      if (b?.z !== undefined && typeof b.z !== 'number') err(`${owner}: a burst's z is a height above the centre`);
    }
    return undefined;
  };

  /** A reference to an explosion (defineExplosion) by id. */
  const checkExplosion = (owner, id) => {
    if (id !== undefined && !reg.explosions?.has(id)) err(`${owner}: unknown explosion "${id}"`);
  };

  for (const e of reg.explosions?.values() ?? []) {
    const owner = `explosion "${e.id}"`;
    checkBursts(owner, e.particles, true);
    if (e.light !== undefined) {
      checkLight(owner, e.light);
      if (e.light?.time !== undefined && !(e.light.time > 0)) err(`${owner}: the light's time is seconds, above 0`);
    }
    if (e.shake !== undefined) {
      const s = e.shake;
      if (!s || typeof s !== 'object') err(`${owner}: "shake" must be { amount, time, radius }`);
      else {
        if (s.amount !== undefined && !(s.amount > 0 && s.amount <= 1)) err(`${owner}: the shake's amount is above 0, at most 1`);
        if (s.time !== undefined && !(s.time > 0)) err(`${owner}: the shake's time is seconds, above 0`);
        if (s.radius !== undefined && !(s.radius > 0)) err(`${owner}: the shake's radius is above 0`);
      }
    }
    if (e.effect !== undefined && reg.things.get(e.effect)?.kind !== 'effect') err(`${owner}: unknown effect "${e.effect}"`);
    checkSound(owner, e.sound);
    if (e.then === undefined) continue;
    if (!Array.isArray(e.then)) {
      err(`${owner}: "then" must be a list of { explosion, delay, offset, z }`);
      continue;
    }
    for (const c of e.then) {
      checkExplosion(`${owner} then`, c?.explosion ?? '');
      for (const key of ['delay', 'offset']) {
        const v = [].concat(c?.[key] ?? 0);
        if (!v.every((n) => typeof n === 'number' && n >= 0) || v.length > 2) err(`${owner}: "then" ${key} is a number, 0 or more, or [min, max]`);
      }
      if (c?.z !== undefined && typeof c.z !== 'number') err(`${owner}: "then" z is a height above the centre`);
    }
  }
  // An explosion that (through `then`) sets itself off again would never stop.
  const looping = (id, seen) => {
    if (seen.has(id)) return true;
    seen.add(id);
    const then = reg.explosions?.get(id)?.then;
    const loops = Array.isArray(then) && then.some((c) => looping(c?.explosion, seen));
    seen.delete(id);
    return loops;
  };
  for (const e of reg.explosions?.values() ?? []) if (looping(e.id, new Set())) err(`explosion "${e.id}": "then" sets it off again (a loop)`);

  for (const t of reg.things.values()) {
    const owner = `${t.kind} "${t.id}"`;
    checkLight(owner, t.light);
    checkBursts(`${owner} death`, t.death?.particles);
    checkExplosion(`${owner} death`, t.death?.explosion);
    if (t.kind === 'projectile') checkExplosion(owner, t.explosion);
    if (t.kind === 'projectile' && t.bounce) {
      const b = t.bounce;
      for (const key of ['restitution', 'friction']) if (!(b[key] >= 0 && b[key] <= 1)) err(`${owner} bounce: ${key} must be 0 to 1`);
      for (const key of ['minSpeed', 'roll', 'toss', 'loft']) if (!(typeof b[key] === 'number' && b[key] >= 0)) err(`${owner} bounce: ${key} must be a number, 0 or more`);
      if (!(b.fuse > 0)) err(`${owner} bounce: fuse is seconds, above 0`);
      if (!(t.gravity > 0)) warn(`${owner}: bounces but has no gravity (it will fly straight until its fuse runs out)`);
    }
    if (t.corpse) {
      checkBursts(`${owner} corpse`, t.corpse.particles);
      const range = (v, lo) => [].concat(v).every((n) => typeof n === 'number' && n >= lo) && [].concat(v).length <= 2;
      if (t.corpse.bursts !== undefined && !range(t.corpse.bursts, 0)) err(`${owner} corpse: bursts is a count, or [min, max]`);
      if (t.corpse.every !== undefined && !range(t.corpse.every, 0)) err(`${owner} corpse: every is seconds, or [min, max]`);
      if (t.corpse.z !== undefined && typeof t.corpse.z !== 'number') err(`${owner} corpse: z is a height above the floor`);
    }
    if (t.model) {
      if (!reg.models.has(t.model)) err(`${owner}: unknown model "${t.model}"`);
    } else if (t.kind !== 'projectile' || t.sheet) checkSheet(owner, t.sheet); // (a projectile with no sheet flies unseen)
    checkAnims(owner, t.anims);
    for (const s of Object.values(t.sounds ?? {})) checkSound(owner, s);
    if (t.kind === 'monster') {
      if (!t.anims.walk && !t.anims.idle) err(`${owner}: needs a "walk" or "idle" animation`);
      if (!t.anims.death) err(`${owner}: needs a "death" animation`);
      if (!t.attack && !t.melee) warn(`${owner}: has no attack or melee`);
      if (t.attack && !t.anims.attack) warn(`${owner}: has an attack but no "attack" animation (it will fire instantly)`);
      checkAttack(owner, t.attack);
      checkAttack(owner, t.melee);
      for (const d of t.drops) if (!reg.things.has(d.item)) err(`${owner}: drops unknown item "${d.item}"`);
      checkCalm(owner, t.calm, false);
    }
    if (t.kind === 'item') {
      for (const [key, value] of Object.entries(t.pickup ?? {})) {
        if (PICKUP_MODIFIERS.includes(key)) continue;
        if (!BUILTIN_PICKUPS[key] && !reg.pickups.has(key)) err(`${owner}: unknown pickup effect "${key}"`);
        if (key === 'weapon' && !reg.weapons.has(value)) err(`${owner}: gives unknown weapon "${value}"`);
        if (key === 'ammo') for (const a of Object.keys(value)) if (!reg.ammo.has(a)) err(`${owner}: gives unknown ammo "${a}"`);
        if (key === 'key' && !(reg.config.keys ?? []).some((k) => k.id === value)) err(`${owner}: unknown key "${value}" (add it to config.keys)`);
      }
      checkSound(owner, t.sound);
    }
    if (t.kind === 'projectile' && t.sheet && !t.anims.fly && !t.anims.idle) err(`${owner}: needs a "fly" animation`);
    if (t.kind === 'projectile' && !(typeof t.proximity === 'number' && t.proximity >= 0)) err(`${owner}: proximity must be a number of tiles, 0 or more`);
    if (t.kind === 'projectile' && t.splash) {
      const sp = t.splash;
      if (!(sp.radius > 0)) err(`${owner} splash: radius must be above 0`);
      if (!(typeof sp.damage === 'number' && sp.damage >= 0)) err(`${owner} splash: damage must be a number, 0 or more`);
      if (sp.falloff !== undefined && typeof sp.falloff !== 'boolean') err(`${owner} splash: falloff is true or false`);
      if (sp.erupt !== undefined) checkExplosion(`${owner} splash erupt`, sp.erupt);
    }
    if (t.kind === 'npc') {
      if (!t.anims.idle) err(`${owner}: needs an "idle" animation`);
      if ((t.wander ?? 0) > 0 && !t.anims.walk) warn(`${owner}: wanders but has no "walk" animation (it will stand still)`);
      if (t.bubble && !reg.things.has(t.bubble)) err(`${owner}: unknown speech bubble effect "${t.bubble}"`);
      if (!Array.isArray(t.lines)) err(`${owner}: "lines" must be a list of strings`);
      if (!(typeof t.health === 'number' && t.health >= 0)) err(`${owner}: health must be a number, 0 or more`);
      if (!(t.fleeSpeed > 0)) err(`${owner}: fleeSpeed must be above 0`);
      if (!(t.fleeDistance > 0)) err(`${owner}: fleeDistance must be above 0`);
      if (t.health > 0 && !t.anims.death) warn(`${owner}: can be hurt but has no "death" animation (it vanishes when killed)`);
    }
    if (t.kind === 'decoration' && typeof t.fixed !== 'boolean') err(`${owner}: fixed must be true or false`);
    if (t.kind === 'decoration' && t.bob !== undefined && !(t.bob && t.bob.height >= 0 && t.bob.period > 0)) {
      err(`${owner}: "bob" needs a "height" of 0 or more and a "period" above 0 (seconds)`);
    }
    if (t.kind === 'decoration' && t.explode?.effect && !reg.things.has(t.explode.effect)) {
      err(`${owner}: unknown explosion effect "${t.explode.effect}"`);
    }
  }

  for (const w of reg.weapons.values()) {
    const owner = `weapon "${w.id}"`;
    checkSheet(owner, w.sheet);
    checkAnims(owner, w.anims);
    checkLight(owner, w.light);
    if (!w.anims.idle) err(`${owner}: needs an "idle" animation`);
    if (!w.anims.fire) err(`${owner}: needs a "fire" animation`);
    else if (!w.anims.fire.events.includes('fire')) err(`${owner}: its "fire" animation needs a fireAt frame`);
    if (w.ammo && !reg.ammo.has(w.ammo)) err(`${owner}: unknown ammo "${w.ammo}"`);
    if (w.reraise !== undefined && typeof w.reraise !== 'boolean') err(`${owner}: reraise must be true or false`);
    if (w.charge) {
      const c = w.charge;
      if (!(c.time > 0)) err(`${owner}: charge.time must be above 0`);
      if (!(c.min >= 0 && c.min <= 1)) err(`${owner}: charge.min must be 0 to 1`);
      if (!(c.sink >= 0)) err(`${owner}: charge.sink must be 0 or more`);
      if (!(c.pull >= 0)) err(`${owner}: charge.pull must be 0 or more`);
      if (w.fire?.kind !== 'projectile') warn(`${owner}: charge only changes thrown or fired projectiles`);
    }
    if (!w.fire) err(`${owner}: needs a "fire" attack`);
    checkAttack(owner, w.fire);
    for (const s of Object.values(w.sounds ?? {})) checkSound(owner, s);
  }

  const hero = reg.hero;
  if (!hero) err('Missing hero definition');
  else {
    for (const w of hero.startWeapons ?? []) if (!reg.weapons.has(w)) err(`hero: unknown start weapon "${w}"`);
    for (const a of Object.keys(hero.startAmmo ?? {})) if (!reg.ammo.has(a)) err(`hero: unknown start ammo "${a}"`);
  }

  for (const level of reg.levels.values()) {
    const owner = `Level "${level.id}"`;
    const keysPlaced = new Set();
    let built = null;
    for (let skill = 1; skill <= 5; skill++) {
      let b;
      try {
        b = buildLevel(reg, level, {
          skill,
          textureSlot: (id) => {
            if (!reg.textures.has(id) && skill === 3) err(`${owner}: unknown texture "${id}"`);
            return 0;
          },
        });
      } catch (e) {
        err(`${owner}: ${e.message}`);
        break;
      }
      if (skill === 3) {
        built = b;
        for (const e of b.errors) err(`${owner}: ${e}`);
      }
      for (const sp of b.spawns) {
        const def = reg.things.get(sp.type);
        if (!def) {
          if (skill === 3) err(`${owner}: unknown thing type "${sp.type}"`);
          continue;
        }
        if (def.kind === 'item' && def.pickup?.key) keysPlaced.add(def.pickup.key);
        if (sp.wander !== null && skill === 3) {
          if (def.kind !== 'npc') err(`${owner}: a ${sp.type} at (${sp.x}, ${sp.y}) has "wander", which only friendly characters take`);
          else if (!(typeof sp.wander === 'number' && sp.wander >= 0)) err(`${owner}: a ${sp.type} at (${sp.x}, ${sp.y}): "wander" must be a number of tiles, 0 or more`);
        }
        if (sp.calm !== null && skill === 3) {
          const who = `${owner}: a ${sp.type} at (${sp.x}, ${sp.y})`;
          if (def.kind !== 'monster') err(`${who} is placed "calm", which only monsters take (friendlies are always calm)`);
          else {
            const before = errors.length;
            checkCalm(who, sp.calm, true);
            if (errors.length === before && sp.calm.patrol) checkPatrol(who, b.map, sp, def);
          }
        }
        for (const d of sp.drops ?? []) {
          const item = reg.things.get(d.item);
          if (!item) {
            if (skill === 3) err(`${owner}: a ${sp.type} drops unknown item "${d.item}"`);
          } else if (item.pickup?.key && d.chance >= 1) keysPlaced.add(item.pickup.key);
        }
      }
    }
    if (!built) continue;
    const widths = new Set(level.tiles.map((r) => r.length));
    if (widths.size > 1) warn(`${owner}: tile rows have different lengths (short rows are padded with solid void)`);
    if (level.things && level.things.length > level.tiles.length) warn(`${owner}: things grid has more rows than tiles`);
    const map = built.map;
    let hasExit = false;
    for (let i = 0; i < map.w * map.h; i++) if (map.flags[i] & F_EXIT) hasExit = true;
    for (const u of map.uses.values()) if (u.actions.some((a) => ['exit', 'secretExit', 'finale'].includes(a.action))) hasExit = true;
    for (const t of level.triggers ?? []) {
      if ([].concat(t.do ?? []).some((a) => ['exit', 'secretExit', 'finale'].includes(a.action))) hasExit = true;
    }
    if (!hasExit) warn(`${owner}: has no exit (exit tile, exit switch or exit trigger)`);
    // Open tiles must be fenced in by walls: rays that reach the void draw garbage.
    const leaks = [];
    for (let y = 0; y < map.h && leaks.length < 5; y++) {
      for (let x = 0; x < map.w; x++) {
        if (map.flags[y * map.w + x] & F_SOLID) continue;
        let open = false;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= map.w || ny >= map.h || map.flags[ny * map.w + nx] & F_VOID) open = true;
          }
        }
        if (open) leaks.push(`(${x}, ${y})`);
      }
    }
    if (leaks.length) err(`${owner}: floor touches the outside of the map (surround it with walls) at ${leaks.join(', ')}`);
    for (const d of map.doors) {
      if (d.lock && d.lock !== 'remote' && !keysPlaced.has(d.lock)) warn(`${owner}: door at (${d.x}, ${d.y}) needs key "${d.lock}" but none is placed`);
    }
    const checkActions = (where, list) => {
      for (const a of [].concat(list ?? [])) {
        const name = typeof a === 'string' ? a : a.action;
        if (!BUILTIN_ACTION_NAMES.includes(name) && !reg.actions.has(name)) err(`${owner}: ${where} uses unknown action "${name}"`);
        const lit = name === 'setLight' && map.sourcesWithTag(a.tag).length;
        if (a.tag && !map.tags.has(a.tag) && !lit) err(`${owner}: ${where} refers to tag "${a.tag}" which no tile${name === 'setLight' ? ' or light' : ''} has`);
        if (a.thing && !reg.things.has(a.thing)) err(`${owner}: ${where} spawns unknown thing "${a.thing}"`);
        if (name === 'explode' && !reg.explosions?.has(a.explosion)) err(`${owner}: ${where} sets off unknown explosion "${a.explosion}"`);
        if (a.action === 'music' && a.id && !reg.songs.has(a.id)) warn(`${owner}: ${where} plays unknown song "${a.id}"`);
        if (a.action === 'setLight' && a.lightFx !== undefined && LIGHT_FX[a.lightFx] === undefined) err(`${owner}: ${where} sets unknown lightFx "${a.lightFx}"`);
      }
    };
    (level.triggers ?? []).forEach((t, i) => {
      const where = `trigger #${i + 1}`;
      if (!TRIGGER_EVENTS.includes(t.on)) err(`${owner}: ${where} has unknown event "${t.on}"`);
      if (t.on === 'killed' && t.tag) {
        if (!built.spawns.some((sp) => sp.tag === t.tag)) err(`${owner}: ${where} waits for monsters tagged "${t.tag}" but none are placed`);
      } else if (t.tag && !map.tags.has(t.tag)) err(`${owner}: ${where} refers to tag "${t.tag}" which no tile has`);
      if (t.thing && !reg.things.has(t.thing)) err(`${owner}: ${where} refers to unknown thing "${t.thing}"`);
      checkActions(where, t.do);
    });
    for (const u of map.uses.values()) checkActions('a switch', u.actions);
    if (level.music && !reg.songs.has(level.music)) warn(`${owner}: unknown music "${level.music}"`);
    if (level.sky && !reg.textures.has(level.sky)) err(`${owner}: unknown sky texture "${level.sky}"`);
    if (level.haze) {
      const c = level.haze.color;
      if (!Array.isArray(c) || c.length !== 3 || !c.every((v) => typeof v === 'number' && v >= 0 && v <= 255)) err(`${owner}: haze needs a "color" of three numbers 0-255, like [40, 36, 64]`);
      if (level.haze.half !== undefined && !(level.haze.half > 0)) err(`${owner}: haze "half" (the distance in tiles at which it's halfway) must be above 0`);
    }
    if (level.weather) checkWeather(reg, level.weather, owner, err);
    if (level.hangings !== undefined) checkHangings(reg, level, map, owner, err);
    for (const id of [level.next, level.secretNext]) if (id && !reg.levels.has(id)) err(`${owner}: next level "${id}" does not exist`);
  }

  if (reg.episodes.size === 0) err('No episodes defined');
  for (const ep of reg.episodes.values()) {
    for (const id of ep.levels) if (!reg.levels.has(id)) err(`Episode "${ep.id}": unknown level "${id}"`);
  }
  for (const f of ['small', 'big', 'hud', 'tiny']) if (!reg.fonts.has(f)) err(`Missing font "${f}"`);
  for (const c of reg.cheats) if (typeof c.run !== 'function') err(`Cheat "${c.code}" has no run()`);
  checkParticles(reg, err, warn);
  checkHangingTypes(reg, err);

  return { errors, warnings };
}

/** A level's weather: a particle type it can keep that many of, and numbers in range. */
function checkWeather(reg, w, owner, err) {
  const nums = (v, n, lo) => Array.isArray(v) && v.length === n && v.every((k) => typeof k === 'number' && k >= lo);
  const type = reg.particles.get(w.type);
  if (!type) return err(`${owner}: weather uses unknown particle type "${w.type}"`);
  const cap = Math.min(type.cap ?? Infinity, type.shape === 'disc' ? DISC_CAP : POINT_CAP);
  if (!Number.isInteger(w.count) || w.count < 1 || w.count > cap) err(`${owner}: weather "count" must be a whole number, 1 to ${cap} (the most "${w.type}" there can be at once)`);
  if (w.range !== undefined && !(typeof w.range === 'number' && w.range >= 1 && w.range <= 64)) err(`${owner}: weather "range" (tiles each way round the camera) must be 1 to 64`);
  if (w.z !== undefined && !(nums(w.z, 2, 0) && w.z[1] > w.z[0])) err(`${owner}: weather "z" must be [low, high] heights above the floor, like [0.05, 2.5]`);
  if (w.drift !== undefined && !nums(w.drift, 2, 0)) err(`${owner}: weather "drift" must be [across, up or down] speeds of 0 or more, like [0.3, 0.1]`);
  if (w.wind !== undefined && !nums(w.wind, 3, -Infinity)) err(`${owner}: weather "wind" must be [x, y, z] in units per second, like [3, 1, 0]`);
  return undefined;
}

/** Hanging types: the shape, a colour on a ramp, and numbers in range. */
function checkHangingTypes(reg, err) {
  const ramps = reg.paletteDef?.ramps ?? {};
  const num = (v, lo, hi) => typeof v === 'number' && v >= lo && v <= hi;
  const ranges = {
    width: [0.001, 1, "a rope's thickness in units"],
    spacing: [0.1, 4, 'units between points'],
    gravity: [0, 100, 'units per second per second'],
    drag: [0, 30, "how fast it takes up the air's speed, per second"],
    wind: [-10, 10, "the share of the level's wind that carries it"],
    breeze: [0, 10, 'units per second'],
    damping: [0, 1, 'the share of its speed kept each sixtieth of a second'],
    folds: [0, 1, 'units'],
  };
  for (const h of reg.hangings.values()) {
    const owner = `Hanging "${h.id}"`;
    if (!HANGING_SHAPES.includes(h.shape)) err(`${owner}: shape must be one of ${HANGING_SHAPES.join(', ')} (got "${h.shape}")`);
    if (h.color !== undefined) {
      const [ramp, t] = Array.isArray(h.color) ? h.color : [];
      if (!ramps[ramp] || !num(t ?? 0.5, 0, 1)) err(`${owner}: color must be [ramp, 0 to 1], like ['rust', 0.5]`);
    }
    for (const [key, [lo, hi, what]] of Object.entries(ranges)) {
      if (h[key] !== undefined && !num(h[key], lo, hi)) err(`${owner}: ${key} (${what}) must be ${lo} to ${hi}`);
    }
    if (h.stiffness !== undefined && !(Number.isInteger(h.stiffness) && h.stiffness >= 1 && h.stiffness <= 8)) err(`${owner}: stiffness (passes a step) must be a whole number, 1 to 8`);
    if (h.texture !== undefined) {
      if (h.shape !== 'cloth') err(`${owner}: only a cloth has a texture (a rope is its colour)`);
      else if (!reg.textures.has(h.texture)) err(`${owner}: unknown texture "${h.texture}"`);
    }
  }
}

/** A level's hangings: known types, points in the open, the numbers each shape needs, and room for them all. */
function checkHangings(reg, level, map, owner, err) {
  const list = level.hangings;
  if (!Array.isArray(list)) return err(`${owner}: "hangings" must be a list`);
  const num = (v, lo, hi) => typeof v === 'number' && v >= lo && v <= hi;
  let ok = true;
  list.forEach((s, k) => {
    const where = `${owner}: hanging ${k + 1}`;
    const bad = (m) => {
      err(`${where} ${m}`);
      ok = false;
    };
    const type = reg.hangings.get(s?.type);
    if (!type) return bad(`has unknown type "${s?.type}"`);
    const point = (key) => {
      const p = s[key];
      if (!Array.isArray(p) || p.length !== 3 || !p.every((v) => typeof v === 'number' && Number.isFinite(v))) return bad(`needs "${key}": [x, y, z]`);
      if (!map.inBounds(p[0] | 0, p[1] | 0) || p[0] < 0 || p[1] < 0) return bad(`"${key}" is off the map`);
      if (map.flags[(p[1] | 0) * map.w + (p[0] | 0)] & F_SOLID) return bad(`"${key}" is inside a wall (hang it just in front of one)`);
      if (map.floorAt(p[0], p[1], 0, p[2]) > p[2]) return bad(`"${key}" is below the floor there`);
      return undefined;
    };
    point('from');
    if (type.shape === 'cloth' || s.to !== undefined) point('to');
    if (type.shape === 'rope' && s.to !== undefined) {
      if (s.sag !== undefined && !num(s.sag, 0, 100)) bad('"sag" (how far its middle hangs below the line between its ends) must be 0 or more');
    } else if (s.length !== undefined && !num(s.length, 0.01, 100)) bad('"length" must be above 0');
    if (type.shape === 'cloth' && s.pin !== undefined && !HANGING_PINS.includes(s.pin)) bad(`"pin" must be one of ${HANGING_PINS.join(', ')}`);
    if (s.out !== undefined) {
      const o = s.out;
      if (type.shape !== 'cloth') bad('"out" is only for a cloth');
      else if (!Array.isArray(o) || o.length !== 3 || !o.every((v) => typeof v === 'number' && Number.isFinite(v))) bad('"out" must be [x, y, z]: the way from its top edge to its far edge');
      else if (!o.some((v) => v !== 0)) bad('"out" must not be [0, 0, 0]');
      else if (s.length !== undefined) bad('has both "out" and "length": a cloth with "out" is as long as it');
      if (s.sag !== undefined && !num(s.sag, 0, 100)) bad('"sag" (how far its middle sags) must be 0 or more');
    }
    if (s.light !== undefined && !num(s.light, 0, 255)) bad('"light" must be 0 to 255');
    return undefined;
  });
  // Room for them all (the level's hangings share one pool).
  if (ok) for (const e of new Hangings(map, [...reg.hangings.values()], list, reg.paletteDef?.ramps).errors) err(`${owner}: ${e}`);
  return undefined;
}

/** Particle types: colours by ramp and step, the enums, and numbers in range. */
function checkParticles(reg, err, warn) {
  const ramps = reg.paletteDef?.ramps ?? {};
  const num = (v, lo, hi) => typeof v === 'number' && v >= lo && v <= hi;
  const enums = { blend: PARTICLE_BLENDS, onFloor: PARTICLE_FLOORS, shape: PARTICLE_SHAPES, walls: PARTICLE_WALLS };
  if (reg.particles.size > 256) err(`At most 256 particle types (there are ${reg.particles.size})`);
  for (const p of reg.particles.values()) {
    const owner = `Particle "${p.id}"`;
    const step = (name, k) => {
      const r = ramps[name];
      if (!r) return err(`${owner}: unknown colour ramp "${name}"`);
      if (!Number.isInteger(k) || k < 0 || k >= r[1]) err(`${owner}: ramp "${name}" has steps 0 to ${r[1] - 1} (got ${k})`);
      return undefined;
    };
    for (const c of p.colors ?? []) {
      if (Number.isInteger(c) && c >= 0 && c < 255) continue;
      if (Array.isArray(c) && c.length === 2 && typeof c[0] === 'string') step(c[0], c[1]);
      else if (c && typeof c === 'object' && typeof c.ramp === 'string') {
        step(c.ramp, c.from);
        step(c.ramp, c.to);
      } else err(`${owner}: a colour must be [ramp, step], { ramp, from, to } or a palette index 0-254`);
    }
    for (const [key, list] of Object.entries(enums)) {
      if (p[key] !== undefined && !list.includes(p[key])) err(`${owner}: ${key} must be one of ${list.join(', ')} (got "${p[key]}")`);
    }
    const life = [].concat(p.life ?? 1);
    if (!life.every((v) => num(v, 0.001, 600)) || life.length > 2 || (life.length === 2 && life[1] < life[0])) err(`${owner}: life is seconds, or [min, max] (above 0)`);
    if (p.size !== undefined && !num(p.size, 0, 10)) err(`${owner}: size is in world units, 0 to 10`);
    if (p.maxPx !== undefined && !(Number.isInteger(p.maxPx) && p.maxPx >= 1 && p.maxPx <= 64)) err(`${owner}: maxPx must be a whole number of pixels, 1 to 64`);
    if (p.drag !== undefined && !num(p.drag, 0, 30)) err(`${owner}: drag (velocity lost per second) must be 0 to 30`);
    if (p.bounce !== undefined && !num(p.bounce, 0, 1)) err(`${owner}: bounce must be 0 to 1`);
    if (p.alpha !== undefined && !num(p.alpha, 0, 1)) err(`${owner}: alpha must be 0 to 1`);
    if (p.fadeIn !== undefined && !num(p.fadeIn, 0, 1)) err(`${owner}: fadeIn is a share of its life, 0 to 1`);
    if (p.fadeOut !== undefined && !num(p.fadeOut, 0.001, 1)) err(`${owner}: fadeOut is a share of its life, above 0 and at most 1`);
    for (const key of ['fadeIn', 'fadeOut']) {
      if (p[key] && p.blend !== 'dither' && !p.fade) warn(`${owner}: ${key} only works with blend 'dither', or with fade: true`);
    }
    if (p.fade && !['add', 'half'].includes(p.blend)) warn(`${owner}: fade is for blend 'add' or 'half' ('dither' always fades)`);
    if (p.streak !== undefined && !num(p.streak, 0, 1)) err(`${owner}: streak is seconds of travel, 0 to 1`);
    for (const key of ['gravity', 'wind']) if (p[key] !== undefined && typeof p[key] !== 'number') err(`${owner}: ${key} must be a number`);
    if (p.grow !== undefined && !num(p.grow, 0, 20)) err(`${owner}: grow is how many times its size it ends at, 0 to 20`);
    if (p.trail !== undefined) {
      const tr = p.trail;
      if (!reg.particles.has(tr?.type)) err(`${owner}: its trail has unknown particle type "${tr?.type}"`);
      else if (reg.particles.get(tr.type).trail) warn(`${owner}: its trail's type "${tr.type}" leaves a trail too`);
      if (tr?.every !== undefined && !num(tr.every, 0.001, 60)) err(`${owner}: trail.every is seconds between, above 0`);
      if (tr?.for !== undefined && !num(tr.for, 0, 600)) err(`${owner}: trail.for is seconds, 0 or more`);
    }
    const classCap = p.shape === 'disc' ? DISC_CAP : POINT_CAP;
    if (p.cap !== undefined && !(p.cap >= 1)) err(`${owner}: cap must be at least 1`);
    else if (p.cap > classCap) warn(`${owner}: cap ${p.cap} is above the ${p.shape === 'disc' ? 'disc' : 'point'} cap of ${classCap}`);
  }
}
