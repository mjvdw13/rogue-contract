import { runActions } from './actions.js';

/**
 * Level triggers: run actions when something happens.
 *   { on: 'start' }                        when the level begins
 *   { on: 'enter', tag: 'hall' }           player steps on a tile with the tag
 *   { on: 'use', tag: 'panel' }            player uses a wall tile with the tag
 *   { on: 'killed', thing: 'firefly' }     every thing of that type is dead
 *   { on: 'killed', tag: 'ambush' }        every monster spawned with that tag is dead
 *   { on: 'pickup', thing: 'badge-red' }   player picks up that item
 *   { on: 'hostile' }                      the calm monsters turn (world.turnHostile)
 *   { on: 'talk', tag: 'broker' }          the player uses a character with the tag
 *   { on: 'talk', thing: 'jawa' }          ... or of that type (each time they react)
 * Add `once: false` to let a trigger fire repeatedly. Actions go in `do`.
 * `if` and `unless` (a story flag, or a list) make it wait for flags: it
 * fires only while every `if` flag is set and no `unless` flag is. A `once`
 * trigger skipped for its flags stays armed.
 */

/** Do the story flags allow `spec` (its `if` and `unless`, each a flag or a list)? */
export function flagsAllow(flags, spec) {
  for (const f of [].concat(spec.if ?? [])) if (!flags.has(f)) return false;
  for (const f of [].concat(spec.unless ?? [])) if (flags.has(f)) return false;
  return true;
}

export class Triggers {
  constructor(world, defs = []) {
    this.world = world;
    this.list = defs.map((d) => ({ ...d, once: d.once ?? true, fired: false }));
  }

  _fire(t, ctx) {
    if ((t.once && t.fired) || !flagsAllow(this.world.flags, t)) return false;
    t.fired = true;
    runActions(this.world, t.do, ctx);
    return true;
  }

  start() {
    for (const t of this.list) if (t.on === 'start') this._fire(t, {});
  }

  enterTile(tileIndex) {
    const tag = this.world.map.tag[tileIndex];
    if (tag < 0) return;
    const name = this.world.map.tagNames[tag];
    for (const t of this.list) if (t.on === 'enter' && t.tag === name) this._fire(t, { tile: tileIndex });
  }

  useTile(tileIndex) {
    const tag = this.world.map.tag[tileIndex];
    if (tag < 0) return false;
    const name = this.world.map.tagNames[tag];
    let any = false;
    for (const t of this.list) {
      if (t.on === 'use' && t.tag === name && this._fire(t, { tile: tileIndex })) any = true;
    }
    return any;
  }

  killed(thing) {
    for (const t of this.list) {
      if (t.on !== 'killed' || (t.once && t.fired)) continue;
      const matches = (o) => (t.thing ? o.def.id === t.thing : t.tag ? o.tag === t.tag : false);
      if (!matches(thing)) continue;
      const alive = this.world.things.some((o) => o.kind === 'monster' && !o.dead && !o.removed && matches(o));
      if (!alive) this._fire(t, { thing });
    }
  }

  pickup(item) {
    for (const t of this.list) if (t.on === 'pickup' && t.thing === item.def.id) this._fire(t, { thing: item });
  }

  hostile() {
    for (const t of this.list) if (t.on === 'hostile') this._fire(t, {});
  }

  /** The player used `thing` (a friendly or a calm monster) and it reacted. */
  talk(thing) {
    for (const t of this.list) {
      if (t.on === 'talk' && (t.thing ? thing.def.id === t.thing : thing.tag === t.tag)) this._fire(t, { thing });
    }
  }
}
