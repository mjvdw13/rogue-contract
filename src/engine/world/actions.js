import { openDoor, closeDoor } from './doors.js';
import { startLift } from './lifts.js';

/**
 * Built-in trigger actions. Triggers in a level run lists of these:
 *   { action: 'openDoors', tag: 'vault' }
 * Content can add its own with defineAction(name, fn) — see MODDING.md.
 * Every action receives (world, params, context).
 */
export const BUILTIN_ACTIONS = {
  /** Open every door with the tag (even remote-locked ones). */
  openDoors(world, { tag }) {
    for (const d of world.map.doors) if (d.tag === tag) openDoor(world, d);
  },
  closeDoors(world, { tag }) {
    for (const d of world.map.doors) if (d.tag === tag) closeDoor(world, d);
  },
  /** Start every lift with the tag (optionally to stop index `to`). */
  lift(world, { tag, to }) {
    for (const l of world.map.lifts) if (l.tag === tag) startLift(world, l, to);
  },
  /** Finish the level (normal exit). */
  exit(world) {
    world.requestExit('normal');
  },
  /** Finish the level through the secret exit (uses the level's `secretNext`). */
  secretExit(world) {
    world.requestExit('secret');
  },
  /** End the episode and roll the finale. */
  finale(world) {
    world.requestExit('finale');
  },
  message(world, { text }) {
    world.message(text);
  },
  sound(world, { id }) {
    world.playSound(id);
  },
  /** Spawn things at the centre of every tile with `tag` (or at x, y). */
  spawn(world, { thing, tag, x, y, fog = true }) {
    const spots = tag
      ? world.map.tilesWithTag(tag).map((i) => ({ x: (i % world.map.w) + 0.5, y: Math.floor(i / world.map.w) + 0.5 }))
      : [{ x, y }];
    for (const s of spots) {
      const t = world.spawn(thing, s.x, s.y, world.player ? world.player.angle + Math.PI : 0);
      if (t?.kind === 'monster') world.stats.totalKills += t.def.countKill ? 1 : 0;
      if (fog && world.registry.things.has('teleport-fog')) world.spawn('teleport-fog', s.x, s.y);
      if (t?.kind === 'monster') world.wakeMonster(t, world.player);
    }
    world.playSoundAt('teleport', spots[0].x, spots[0].y);
  },
  /**
   * Set the light level of tagged tiles, and the strength of tagged light
   * sources, and optionally their effect (`lightFx`, `lightMin`).
   */
  setLight(world, { tag, light, lightFx, lightMin }) {
    world.lights.setLight(world.map.tilesWithTag(tag), light, lightFx, lightMin, world.map.sourcesWithTag(tag));
  },
  /**
   * Set off an explosion (defineExplosion) at the centre of every tile with
   * `tag` (or at x, y), `z` above the floor there (default 0.5). Only for
   * looks: it hurts nothing.
   */
  explode(world, { explosion, tag, x, y, z = 0.5 }) {
    const spots = tag
      ? world.map.tilesWithTag(tag).map((i) => ({ x: (i % world.map.w) + 0.5, y: Math.floor(i / world.map.w) + 0.5 }))
      : [{ x, y }];
    for (const s of spots) world.explode(explosion, s.x, s.y, world.map.floorAt(s.x, s.y) + z);
  },
  /** Move the player to the first tile with the tag. */
  teleport(world, { tag, angle }) {
    const [i] = world.map.tilesWithTag(tag);
    if (i === undefined || !world.player) return;
    world.player.x = (i % world.map.w) + 0.5;
    world.player.y = Math.floor(i / world.map.w) + 0.5;
    if (angle !== undefined) world.player.angle = (-angle * Math.PI) / 180;
    if (world.registry.things.has('teleport-fog')) world.spawn('teleport-fog', world.player.x, world.player.y);
    world.playSound('teleport');
  },
  /** The town's switch: every calm monster turns normal, and `on: 'hostile'` triggers run. */
  hostile(world) {
    world.turnHostile();
  },
  /** Set a story flag (or clear it, with `value: false`) for triggers' and conversations' `if` and `unless`. */
  setFlag(world, { flag, value = true }) {
    if (value) world.flags.add(flag);
    else world.flags.delete(flag);
  },
  /** Change the music. */
  music(world, { id }) {
    world.game?.playMusic?.(id);
  },
};

export const BUILTIN_ACTION_NAMES = Object.keys(BUILTIN_ACTIONS);

/** Run a list of action specs. */
export function runActions(world, actions, context = {}) {
  for (const a of [].concat(actions ?? [])) {
    const spec = typeof a === 'string' ? { action: a } : a;
    const fn = BUILTIN_ACTIONS[spec.action] ?? world.registry.actions.get(spec.action);
    if (!fn) {
      console.warn(`Unknown action "${spec.action}"`);
      continue;
    }
    fn(world, spec, context);
  }
}
