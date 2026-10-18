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
 * Add `once: false` to let a trigger fire repeatedly. Actions go in `do`.
 */
export class Triggers {
  constructor(world, defs = []) {
    this.world = world;
    this.list = defs.map((d) => ({ ...d, once: d.once ?? true, fired: false }));
  }

  _fire(t, ctx) {
    if (t.once && t.fired) return;
    t.fired = true;
    runActions(this.world, t.do, ctx);
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
      if (t.on === 'use' && t.tag === name && !(t.once && t.fired)) {
        this._fire(t, { tile: tileIndex });
        any = true;
      }
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
}
