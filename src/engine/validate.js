import { buildLevel } from './world/level.js';
import { F_EXIT, F_SOLID, F_VOID } from './world/tilemap.js';
import { BUILTIN_ACTION_NAMES } from './world/actions.js';
import { BUILTIN_ATTACKS } from './combat/attacks.js';
import { BUILTIN_PICKUPS } from './things/pickups.js';

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
    for (const k of ['sound', 'hitSound', 'missSound']) checkSound(owner, a[k]);
  };
  const checkAnims = (owner, anims) => {
    for (const [name, anim] of Object.entries(anims ?? {})) {
      if (!anim) continue;
      for (const f of anim.frames) {
        if (!Number.isInteger(f) || f < 0) err(`${owner}: animation "${name}" has a bad frame number ${f}`);
      }
    }
  };

  for (const t of reg.textures.values()) if (!t.src) err(`Texture "${t.id}": missing src`);

  for (const m of reg.models?.values() ?? []) {
    const owner = `model "${m.id}"`;
    for (const id of new Set(m.faces.map((f) => f.tex).filter(Boolean))) {
      if (!reg.textures.has(id)) err(`${owner}: unknown texture "${id}"`);
    }
    if (m.faces.length > MODEL_BUDGET) warn(`${owner}: ${m.faces.length} faces is over the budget of ${MODEL_BUDGET}`);
  }

  for (const t of reg.things.values()) {
    const owner = `${t.kind} "${t.id}"`;
    if (t.model) {
      if (!reg.models.has(t.model)) err(`${owner}: unknown model "${t.model}"`);
    } else checkSheet(owner, t.sheet);
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
    if (t.kind === 'projectile' && !t.anims.fly && !t.anims.idle) err(`${owner}: needs a "fly" animation`);
    if (t.kind === 'npc') {
      if (!t.anims.idle) err(`${owner}: needs an "idle" animation`);
      if ((t.wander ?? 0) > 0 && !t.anims.walk) warn(`${owner}: wanders but has no "walk" animation (it will stand still)`);
      if (t.bubble && !reg.things.has(t.bubble)) err(`${owner}: unknown speech bubble effect "${t.bubble}"`);
      if (!Array.isArray(t.lines)) err(`${owner}: "lines" must be a list of strings`);
    }
    if (t.kind === 'decoration' && t.explode?.effect && !reg.things.has(t.explode.effect)) {
      err(`${owner}: unknown explosion effect "${t.explode.effect}"`);
    }
  }

  for (const w of reg.weapons.values()) {
    const owner = `weapon "${w.id}"`;
    checkSheet(owner, w.sheet);
    checkAnims(owner, w.anims);
    if (!w.anims.idle) err(`${owner}: needs an "idle" animation`);
    if (!w.anims.fire) err(`${owner}: needs a "fire" animation`);
    else if (!w.anims.fire.events.includes('fire')) err(`${owner}: its "fire" animation needs a fireAt frame`);
    if (w.ammo && !reg.ammo.has(w.ammo)) err(`${owner}: unknown ammo "${w.ammo}"`);
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
        if (a.tag && !map.tags.has(a.tag)) err(`${owner}: ${where} refers to tag "${a.tag}" which no tile has`);
        if (a.thing && !reg.things.has(a.thing)) err(`${owner}: ${where} spawns unknown thing "${a.thing}"`);
        if (a.action === 'music' && a.id && !reg.songs.has(a.id)) warn(`${owner}: ${where} plays unknown song "${a.id}"`);
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
    for (const id of [level.next, level.secretNext]) if (id && !reg.levels.has(id)) err(`${owner}: next level "${id}" does not exist`);
  }

  if (reg.episodes.size === 0) err('No episodes defined');
  for (const ep of reg.episodes.values()) {
    for (const id of ep.levels) if (!reg.levels.has(id)) err(`Episode "${ep.id}": unknown level "${id}"`);
  }
  for (const f of ['small', 'big', 'hud', 'tiny']) if (!reg.fonts.has(f)) err(`Missing font "${f}"`);
  for (const c of reg.cheats) if (typeof c.run !== 'function') err(`Cheat "${c.code}" has no run()`);

  return { errors, warnings };
}
