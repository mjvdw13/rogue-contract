/**
 * Content definition helpers. Every piece of game content (textures, weapons,
 * monsters, items, levels, sounds, music...) is a plain object passed through
 * one of these `define*` functions, which fill in defaults and normalize
 * shorthand so the engine can rely on a single shape.
 *
 * These are pure functions with no browser dependencies, so the same content
 * can be loaded by the game, by Node tools (tools/validate.mjs) and by tests.
 *
 * See MODDING.md for walkthroughs.
 */

/**
 * @typedef {number[] | {frames:number[], fps?:number, loop?:boolean, fireAt?:number|number[],
 *   fullbright?: boolean|number[], events?: Record<number,string>, durations?: number[]}} AnimSpec
 *   Frame numbers are indices into the sprite sheet. `fireAt`/`fullbright`/`events`
 *   refer to positions within this animation's `frames` list.
 *
 * @typedef {{src:string, frameWidth?:number, frameHeight?:number, glint?:number[][], glow?:number[][]}} SheetSpec
 *   `glint`: colours ([r, g, b]) that catch the light (armour highlights);
 *   `glow`: colours that always shine (see gfx/image.js `quantize`).
 *
 * @typedef {{kind:string, damage?:number|number[], pellets?:number, spread?:number, range?:number,
 *   projectile?:string, count?:number, sound?:string, hitSound?:string, missSound?:string,
 *   puff?:string, berserkMultiplier?:number, [key:string]:any}} AttackSpec
 *   kind: 'hitscan' | 'projectile' | 'melee' | any custom kind registered with defineAttack().
 *
 * @typedef {{type:string, count?:number, speed?:number|[number,number], spread?:number,
 *   dir?:[number,number,number]}} BurstSpec
 *   A burst of particles (world/particles.js `burst`): `count` of `type` at
 *   `speed` units a second, along `dir` (none: all round), `spread` 0 to 2.
 */

const ANIM_DEFAULTS = {
  idle: { fps: 4, loop: true },
  walk: { fps: 6, loop: true },
  fly: { fps: 10, loop: true },
  attack: { fps: 8, loop: false },
  melee: { fps: 8, loop: false },
  pain: { fps: 8, loop: false },
  death: { fps: 8, loop: false },
  gib: { fps: 10, loop: false },
  explode: { fps: 10, loop: false },
  fire: { fps: 12, loop: false },
  ready: { fps: 4, loop: true },
  react: { fps: 6, loop: true },
};

/**
 * Normalize an animation spec into
 * `{frames, durations, loop, fullbright[], events[], total}`.
 * @param {AnimSpec|number|null|undefined} spec
 */
export function normalizeAnim(spec, defaults = {}) {
  if (spec == null) return null;
  if (typeof spec === 'number') spec = [spec];
  if (Array.isArray(spec)) spec = { frames: spec };
  if (!Array.isArray(spec.frames) || spec.frames.length === 0) {
    throw new Error('Animation needs a non-empty "frames" list');
  }
  const frames = spec.frames.map((f) => Number(f));
  const fps = spec.fps ?? defaults.fps ?? 8;
  const durations = spec.durations ? spec.durations.map(Number) : frames.map(() => 1 / fps);
  const fb = spec.fullbright;
  const fullbright = frames.map((_, i) => fb === true || (Array.isArray(fb) && fb.includes(i)));
  const events = frames.map(() => null);
  if (spec.fireAt !== undefined) for (const i of [].concat(spec.fireAt)) events[i] = 'fire';
  if (spec.events) for (const [k, v] of Object.entries(spec.events)) events[Number(k)] = v;
  const total = durations.reduce((a, b) => a + b, 0);
  return { frames, durations, loop: spec.loop ?? defaults.loop ?? false, fullbright, events, total };
}

function normalizeAnims(anims = {}) {
  const out = {};
  for (const [name, spec] of Object.entries(anims)) {
    out[name] = normalizeAnim(spec, ANIM_DEFAULTS[name] ?? {});
  }
  return out;
}

function normalizeSheet(sheet, id) {
  if (!sheet) return null;
  if (typeof sheet === 'string') return { ref: sheet };
  return { id: sheet.id ?? id, src: sheet.src, frameWidth: sheet.frameWidth ?? 0, frameHeight: sheet.frameHeight ?? 0, glint: sheet.glint, glow: sheet.glow };
}

function requireId(def, what) {
  if (!def || typeof def !== 'object') throw new Error(`${what}: definition must be an object`);
  if (typeof def.id !== 'string' || !def.id) throw new Error(`${what}: missing string "id"`);
}

/** Normalize an attack: allow plain numbers and fill per-kind defaults. */
export function normalizeAttack(spec) {
  if (!spec) return null;
  const a = { ...spec };
  if (!a.kind) throw new Error('Attack needs a "kind" (hitscan, projectile, melee or a custom kind)');
  if (a.kind === 'hitscan') {
    a.pellets ??= 1;
    a.spread ??= 0;
    a.range ??= 96;
    a.damage ??= [5, 15];
  } else if (a.kind === 'melee') {
    a.range ??= 2.2;
    a.damage ??= [2, 20];
  } else if (a.kind === 'projectile') {
    a.count ??= 1;
    a.spread ??= 0;
  }
  return a;
}

// ---------------------------------------------------------------- textures

/**
 * A wall/floor/ceiling/sky texture. Walls and flats must be power-of-two sized
 * (64x64 recommended). Animated textures are horizontal strips of `frames`
 * square frames. `fence: true` marks a see-through texture for fences
 * (transparent pixels are holes); it may be any size, as it is never a floor.
 * `decal: true` marks one for decals (world/decals.js), likewise.
 * @param {{id:string, src:string, frames?:number, fps?:number, sky?:boolean, fence?:boolean, decal?:boolean}} def
 */
export function defineTexture(def) {
  requireId(def, 'Texture');
  return { frames: 1, fps: 4, sky: false, ...def, type: 'texture' };
}

/**
 * A low-poly 3D model, drawn in true 3D by render/models.js (like Dark Forces'
 * 3DO objects). Place it with a decoration whose `model` is this id.
 *
 * Vertices are [x, y, z] in world units, the origin on the floor under the
 * thing's centre. At angle 0 the model's axes are the world's: x east, y south,
 * z up. Each face is a convex polygon of vertex indices, wound so that the
 * right-hand normal (v1 - v0) x (v2 - v0) points out of the model. A face has
 * a `color` ([ramp, 0..1] or [r, g, b], snapped to the palette's lit colours)
 * or a `tex` (texture id) with one coordinate per vertex: `uv` in texture
 * repeats (as OBJ files have them), or `uvw` in world units, mapped at the
 * walls' 32 texels per unit whatever the texture's size. `glow` faces are
 * fullbright (an animated texture keeps animating); `twoSided` faces are
 * drawn from behind too.
 *
 * `lines` ([x0, y0, x1, y1] in model space) are optional wall segments for
 * collision; without them a solid model collides as its thing's cylinder.
 * @param {{id:string, vertices:number[][], faces:{v:number[], color?:any[], tex?:string,
 *   uv?:number[][], uvw?:number[][], glow?:boolean, twoSided?:boolean}[], lines?:number[][]}} def
 */
export function defineModel(def) {
  requireId(def, 'Model');
  const n = def.vertices?.length ?? 0;
  if (!n) throw new Error(`Model "${def.id}": needs "vertices"`);
  if (!def.faces?.length) throw new Error(`Model "${def.id}": needs "faces"`);
  def.faces.forEach((f, i) => {
    if (!Array.isArray(f.v) || f.v.length < 3 || f.v.some((k) => !(k >= 0 && k < n))) {
      throw new Error(`Model "${def.id}": face ${i} needs 3 or more vertex indices below ${n}`);
    }
    if (f.tex && (f.uv ?? f.uvw)?.length !== f.v.length) throw new Error(`Model "${def.id}": face ${i} needs one uv (or uvw) per vertex`);
    if (!f.tex && !f.color) throw new Error(`Model "${def.id}": face ${i} needs a color or a tex`);
  });
  return { lines: [], ...def, type: 'model' };
}

/** A sprite sheet shared by several things. @param {{id:string} & SheetSpec} def */
export function defineSheet(def) {
  requireId(def, 'Sheet');
  return { frameWidth: 0, frameHeight: 0, ...def, type: 'sheet' };
}

/** A standalone UI image (title screen, HUD panels...). */
export function defineImage(def) {
  requireId(def, 'Image');
  return { ...def, type: 'image' };
}

/**
 * A bitmap font: a PNG grid of cells starting at character `first` (default 32).
 * @param {{id:string, src:string, cellW:number, cellH:number, first?:number, spacing?:number,
 *   spaceWidth?:number, lineHeight?:number, upper?:boolean, mono?:boolean}} def
 */
export function defineFont(def) {
  requireId(def, 'Font');
  return { first: 32, spacing: 1, ...def, type: 'font' };
}

// ---------------------------------------------------------------- inventory

/**
 * An ammo type. `max` is the carry limit, `backpackMax` the limit after a backpack.
 * @param {{id:string, name:string, short?:string, max:number, backpackMax?:number}} def
 */
export function defineAmmo(def) {
  requireId(def, 'Ammo');
  return { short: def.name?.slice(0, 4).toUpperCase(), backpackMax: def.max * 2, ...def, type: 'ammo' };
}

/**
 * A player weapon. `light: { radius, light }` is its muzzle flash: it lights
 * the room round the player on the fire animation's fullbright frames.
 * (`flashLight` instead brightens the whole view, Doom's way.)
 * `reraise: true`: after each shot the hand drops out of view and comes back
 * up with the next one (a thrown detonator).
 * @param {{id:string, name:string, slot:number, ammo?:string|null, ammoPerShot?:number,
 *   sheet: SheetSpec, anims: {idle:AnimSpec, fire:AnimSpec}, fire: AttackSpec,
 *   offset?:[number,number], flashLight?:number, light?:{radius:number, light:number},
 *   noise?:boolean, priority?:number,
 *   accurateFirstShot?:boolean, sounds?:Record<string,string>, bob?:number, reraise?:boolean}} def
 */
export function defineWeapon(def) {
  requireId(def, 'Weapon');
  if (typeof def.slot !== 'number') throw new Error(`Weapon "${def.id}": needs a numeric "slot"`);
  return {
    ammo: null,
    ammoPerShot: 1,
    offset: [0, 0],
    flashLight: 0,
    noise: true,
    priority: def.slot,
    accurateFirstShot: false,
    bob: 1,
    sounds: {},
    ...def,
    type: 'weapon',
    sheet: normalizeSheet(def.sheet, `weapon:${def.id}`),
    anims: normalizeAnims(def.anims),
    fire: normalizeAttack(def.fire),
  };
}

// ---------------------------------------------------------------- things

/**
 * Every thing may have `light: { radius, light }`: while it shows a fullbright
 * frame (all the time, if the whole thing is fullbright), it lights the tiles
 * round it (dynamic light: a bolt in flight, a trooper's muzzle flash, an
 * explosion). Effects and bursting projectiles fade as their animation plays.
 */
function baseThing(def, kind, defaults) {
  requireId(def, kind);
  const merged = {
    name: def.id,
    radius: 0.5,
    height: 1.6,
    z: 0,
    scale: 1,
    solid: false,
    shootable: false,
    health: 0,
    fullbright: false,
    renderStyle: 'normal',
    sounds: {},
    hooks: {},
    ...defaults,
    ...def,
  };
  merged.kind = kind;
  merged.type = 'thing';
  merged.sheet = normalizeSheet(def.sheet, def.id);
  merged.anims = normalizeAnims(def.anims);
  return merged;
}

/**
 * A monster. Movement speed is in tiles per second; cooldowns in seconds.
 * Walkers step up to `stepHeight` (default 0.8) and won't walk off drops
 * deeper than `dropHeight` (default: their step height). `flying` monsters
 * ignore floors, hovering `z` above the floor their target stands on, and
 * climb or sink at `flySpeed` (default 3 per second). `death.explosion` is
 * an explosion (defineExplosion) set off where it dies; `death.particles` are
 * bursts thrown from the middle of the body when it's killed; once the
 * corpse lies still, it throws `corpse.bursts` of `corpse.particles`,
 * `corpse.every` seconds apart, `corpse.z` above the floor, each one way at
 * random (shootable decorations take both too).
 * @param {{id:string, name?:string, glyph?:string, sheet:SheetSpec, anims:Record<string,AnimSpec>,
 *   health:number, speed?:number, radius?:number, height?:number, painChance?:number,
 *   stepHeight?:number, dropHeight?:number, flying?:boolean, flySpeed?:number, z?:number,
 *   attack?:AttackSpec, melee?:AttackSpec, cooldown?:[number,number], reactionTime?:number,
 *   sightRange?:number, drops?:(string|{item:string, chance?:number})[], mass?:number,
 *   splashImmune?:boolean, boss?:boolean, sounds?:Record<string,string>,
 *   death?:{particles?:BurstSpec[], explosion?:string}, corpse?:{particles:BurstSpec[], bursts?:number|[number,number],
 *   every?:number|[number,number], z?:number}, hooks?:Record<string,Function>}} def
 */
export function defineMonster(def) {
  const m = baseThing(def, 'monster', {
    solid: true,
    shootable: true,
    health: 20,
    speed: 4,
    radius: 0.5, // fits one tile width, like the player
    height: 1.7,
    painChance: 0.5,
    reactionTime: 0.4,
    cooldown: [1, 2.5],
    sightRange: 40,
    drops: [],
    mass: 100,
    countKill: true,
    bleeds: true,
    infighting: true,
    splashImmune: false,
    boss: false,
  });
  m.attack = normalizeAttack(def.attack);
  m.melee = normalizeAttack(def.melee);
  m.drops = (m.drops ?? []).map((d) => (typeof d === 'string' ? { item: d, chance: 1 } : { chance: 1, ...d }));
  m.gibHealth ??= -m.health;
  return m;
}

/**
 * A friendly character, such as a coworker. Friendlies can't be hurt or
 * targeted: bullets, projectiles and explosions pass through them. They idle,
 * wander up to `wander` tiles from where they were placed (staying out of
 * doorways, narrow passages and hazards), and react when the player bumps into
 * them or uses them: they turn to the player, play `react` and say one of
 * their `lines`.
 * @param {{id:string, name:string, glyph?:string, sheet:SheetSpec,
 *   anims:{idle:AnimSpec, walk?:AnimSpec, react?:AnimSpec}, lines?:string[],
 *   wander?:number, speed?:number, idleTime?:[number,number], reactTime?:number,
 *   reactCooldown?:number, bubble?:string, sounds?:{react?:string},
 *   hooks?:{onReact?:Function}}} def
 */
export function defineNpc(def) {
  return baseThing(def, 'npc', {
    solid: true,
    shootable: false,
    radius: 0.5,
    height: 1.7,
    speed: 2.2,
    wander: 6,
    idleTime: [2, 5],
    reactTime: 1.8,
    reactCooldown: 2.5,
    lines: [],
  });
}

/**
 * A pickup. `pickup` effects: health, maxHealth, armor, armorClass, maxArmor, ammo{},
 * weapon, key, powerup, duration, backpack, map. Add new ones with definePickup().
 * @param {{id:string, name?:string, glyph?:string, sheet:SheetSpec, anims?:Record<string,AnimSpec>,
 *   pickup: Record<string, any>, message?:string, sound?:string, countItem?:boolean,
 *   hooks?:{onPickup?:Function}}} def
 */
export function defineItem(def) {
  const it = baseThing(def, 'item', { radius: 0.6, height: 0.8, countItem: false, sound: 'item', pickup: {} });
  if (!it.anims.idle) it.anims.idle = normalizeAnim([0], ANIM_DEFAULTS.idle);
  return it;
}

/**
 * Scenery: lamps, plants, barrels... Solid decorations block movement.
 * Shootable ones with `health` die (and optionally `explode`).
 * @param {{id:string, glyph?:string, sheet:SheetSpec, anims?:Record<string,AnimSpec>, solid?:boolean,
 *   radius?:number, height?:number, z?:number, hanging?:boolean, health?:number,
 *   explode?:{radius:number, damage:number, sound?:string}}} def
 */
export function defineDecoration(def) {
  const d = baseThing(def, 'decoration', { radius: 0.5, height: 1.6 });
  if (d.health > 0) d.shootable = def.shootable ?? true;
  if (!d.anims.idle) d.anims.idle = normalizeAnim([0], ANIM_DEFAULTS.idle);
  return d;
}

/**
 * A projectile (fireballs, rockets...). Speed in tiles/second. It flies from
 * its owner's fire height along the shot's slope; `z` instead starts it that
 * high above the owner's feet. Its z is the middle of the sprite. When it
 * bursts it sets off its `explosion` (defineExplosion), facing out of what
 * it hit.
 * `bounce` makes it bounce instead (a thrown detonator): thrown along the aim
 * plus `toss` upward, off walls, floors, ceilings and solid scenery, keeping
 * `restitution` (0..1) of its speed into what it hit and `friction` of the
 * rest; slower than `minSpeed` into the floor it stops bouncing and rolls,
 * losing `roll` of its speed a second. It goes off after `fuse` seconds, or
 * at once on a body; its `bounce` sound plays on a knock harder than
 * `minSpeed`.
 * @param {{id:string, sheet:SheetSpec, anims:{fly:AnimSpec, explode?:AnimSpec}, speed?:number,
 *   damage?:number|number[], radius?:number, splash?:{radius:number, damage:number},
 *   gravity?:number, z?:number, sounds?:{fire?:string, explode?:string, bounce?:string}, trail?:string, explosion?:string,
 *   bounce?:{restitution?:number, friction?:number, minSpeed?:number, roll?:number, fuse?:number, toss?:number}}} def
 */
export function defineProjectile(def) {
  const p = baseThing(def, 'projectile', {
    speed: 20,
    damage: [5, 20],
    radius: 0.24,
    height: 0.5,
    z: null,
    fullbright: true,
    gravity: 0,
    splash: null,
  });
  if (def.bounce) p.bounce = { restitution: 0.5, friction: 0.7, minSpeed: 1.5, roll: 3, fuse: 2.5, toss: 4, ...def.bounce };
  return p;
}

/**
 * A short-lived visual effect (bullet puffs, blood, explosions). It plays its
 * `idle` animation once and disappears.
 */
export function defineEffect(def) {
  const e = baseThing(def, 'effect', { rise: 0, fullbright: false });
  if (!e.anims.idle) throw new Error(`Effect "${def.id}": needs anims.idle`);
  e.anims.idle.loop = false;
  return e;
}

/**
 * A particle type (world/particles.js): sparks, embers, shrapnel, smoke,
 * steam, dust. Particles are points, not things: cheap enough for hundreds.
 * Colours over its life are palette ramp steps: `['glow-yellow', 6]`, or
 * `{ ramp: 'gray', from: 9, to: 4 }` for every step between. Sizes are in
 * world units (a tile is 1), speeds in units per second.
 * @param {{id:string, colors:any[], life?:number|number[], size?:number, maxPx?:number,
 *   shape?:'square'|'disc', streak?:number, gravity?:number, drag?:number, bounce?:number,
 *   onFloor?:'die'|'bounce'|'stick', walls?:'die'|'bounce', wind?:number,
 *   blend?:'solid'|'add'|'half'|'dither', alpha?:number, fadeIn?:number, fadeOut?:number, fade?:boolean, fullbright?:boolean,
 *   grow?:number, trail?:{type:string, every?:number, for?:number}, cap?:number}} def
 */
export function defineParticle(def) {
  requireId(def, 'Particle');
  if (!Array.isArray(def.colors) || !def.colors.length) throw new Error(`Particle "${def.id}": needs "colors"`);
  return { ...def, type: 'particle' };
}

/**
 * An explosion (world/explosions.js): a recipe of particle bursts, a flash of
 * light, a sound and optionally a sprite effect, set off by id from code
 * (`world.explode`), things' `death.explosion`, projectiles' `explosion` and
 * the `explode` trigger action. Only for looks: damage is the exploder's.
 * Each burst is a BurstSpec plus `delay` (seconds, or [min, max]), `over`
 * (its count spread over that many seconds), `radius` (they start anywhere
 * within it), `z` (above the centre) and `dir` 'up', 'out' (the way the
 * explosion faces; also what a burst with no `dir` does) or 'ring' (flat,
 * across the way it faces: along the floor or wall it hit).
 * `light: { radius, light, time }` is a flash that fades over `time` seconds.
 * `shake: { amount, time, radius }` jolts the view: `amount` (0 to 1, 1 the
 * hardest) right beside it, dying away over `time` seconds (0.5), less the
 * farther off, none from `radius` (12) away.
 * `then: [{ explosion, delay, offset, z }]` sets off other explosions after
 * this one: `delay` seconds later, `offset` to the side (a random way, not
 * into what it faces out of), `z` higher.
 * @param {{id:string, particles:(BurstSpec & {delay?:number|[number,number], over?:number, radius?:number,
 *   z?:number, dir?:'up'|'out'|'ring'|[number,number,number]})[], light?:{radius:number, light:number, time?:number},
 *   shake?:{amount?:number, time?:number, radius?:number},
 *   then?:{explosion:string, delay?:number|[number,number], offset?:number|[number,number], z?:number}[],
 *   sound?:string, effect?:string, name?:string}} def
 */
export function defineExplosion(def) {
  requireId(def, 'Explosion');
  if (!Array.isArray(def.particles)) throw new Error(`Explosion "${def.id}": needs "particles" (a list of bursts)`);
  return { ...def, type: 'explosion' };
}

// ---------------------------------------------------------------- audio

/**
 * A sound effect: either synthesized (`synth` parameters, see audio/synth.js)
 * or loaded from a file (`src`).
 * @param {{id:string, synth?:object, src?:string, volume?:number, pitchVariance?:number, priority?:number}} def
 */
export function defineSound(def) {
  requireId(def, 'Sound');
  if (!def.synth && !def.src) throw new Error(`Sound "${def.id}": needs "synth" or "src"`);
  return { volume: 1, pitchVariance: 0, ...def, type: 'sound' };
}

/**
 * A music track: a pattern-based song (see audio/music.js) or an audio file (`src`).
 * @param {{id:string, bpm?:number, src?:string}} def
 */
export function defineSong(def) {
  requireId(def, 'Song');
  return { bpm: 120, stepsPerBeat: 4, volume: 1, ...def, type: 'song' };
}

// ---------------------------------------------------------------- world

/**
 * A level. `tiles` is an ASCII grid (one string per row) of tile glyphs;
 * `things` is an optional overlay grid of the same size for monsters/items/
 * player starts (space or '.' = nothing). Glyphs come from the shared legend
 * (content/levels/legend.js) and can be overridden per level via `legend` and
 * `thingLegend`. `fog` darkens surfaces with distance (colormap levels per
 * tile); outdoors (under the sky), `haze: { color: [r, g, b], half }` fades
 * them toward a colour instead, halfway there at `half` tiles.
 * @param {{id:string, name:string, tiles:string[], things?:string[], legend?:object,
 *   thingLegend?:object, list?:object[], triggers?:object[], music?:string, sky?:string,
 *   fog?:number, haze?:{color:number[], half?:number}, par?:number, next?:string,
 *   secretNext?:string, defaults?:object}} def
 */
export function defineLevel(def) {
  requireId(def, 'Level');
  if (!Array.isArray(def.tiles) || def.tiles.length === 0) throw new Error(`Level "${def.id}": needs a "tiles" grid`);
  return {
    name: def.id,
    things: null,
    legend: {},
    thingLegend: {},
    list: [],
    triggers: [],
    fog: 0.05,
    par: 0,
    defaults: {},
    ...def,
    type: 'level',
  };
}

/**
 * An episode: an ordered list of level ids plus an optional finale.
 * @param {{id:string, name:string, levels:string[], finale?:object}} def
 */
export function defineEpisode(def) {
  requireId(def, 'Episode');
  if (!Array.isArray(def.levels) || def.levels.length === 0) throw new Error(`Episode "${def.id}": needs "levels"`);
  return { ...def, type: 'episode' };
}

/**
 * A cheat code typed during play.
 * @param {{code:string, name?:string, run:(game:any, world:any)=>string|void}} def
 */
export function defineCheat(def) {
  if (!def?.code || typeof def.run !== 'function') throw new Error('Cheat needs "code" and "run"');
  return { name: def.code, ...def, type: 'cheat' };
}

/** A custom trigger action: `fn(world, params, context)`. */
export function defineAction(name, fn) {
  return { name, fn, type: 'action' };
}

/** A custom attack kind: `fn(world, attacker, spec, angle)`. */
export function defineAttack(name, fn) {
  return { name, fn, type: 'attack' };
}

/** A custom pickup effect: `fn(world, player, value, item) => boolean` (true if consumed). */
export function definePickup(name, fn) {
  return { name, fn, type: 'pickup' };
}
