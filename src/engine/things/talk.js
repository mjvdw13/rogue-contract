import { flagsAllow } from '../world/triggers.js';

/**
 * Conversations: a placement's `talk`, for a friendly or a calm monster.
 * Either a list of lines, said one per use and staying on the last, or a
 * list of branches `{ if?, unless?, lines, set? }`: each use takes the first
 * branch the story flags allow, says its next line (each branch keeps its
 * own place) and sets its `set` flags once its last line has been said.
 * Bumping into them repeats what they last said, without moving on.
 */

/** Shortest time between two lines when the player keeps pressing use (seconds). */
const TALK_GAP = 0.3;

/** A thing's conversation state from its placement's `talk`. */
export function makeTalk(spec) {
  const branches = spec.every((l) => typeof l === 'string') ? [{ lines: spec }] : spec;
  return { branches: branches.map((b) => ({ ...b, at: 0 })), said: null, time: -Infinity };
}

/**
 * Is `t` ready to react? Use moves a conversation on after a short gap;
 * anything else waits out `cooldown` (seconds left since the last reaction).
 */
export function readyToReact(world, t, used, cooldown) {
  return used && t.talk ? world.time - t.talk.time >= TALK_GAP : cooldown <= 0;
}

/**
 * What `t` says when the player uses it (`used`) or bumps into it: the next
 * line of its conversation, or (bumped) the one it last said; with no
 * conversation, one of `lines` at random, not the same twice running
 * (`state.lastLine` remembers). A story group `{ if?, unless?, lines }` in
 * `lines` adds its lines while the flags allow, so a townsperson can now and
 * then point the way to the story's next step. Undefined when it says nothing.
 */
export function pickLine(world, t, lines, state, used) {
  const talk = t.talk;
  if (talk) {
    if (!used) return talk.said ?? undefined;
    const b = talk.branches.find((b) => flagsAllow(world.flags, b));
    talk.time = world.time;
    if (!b) return undefined;
    talk.said = b.lines[b.at];
    if (b.at < b.lines.length - 1) b.at++;
    else for (const f of [].concat(b.set ?? [])) world.flags.add(f);
    return talk.said;
  }
  const pool = lines.some((l) => typeof l !== 'string') ? storyLines(world.flags, lines) : lines;
  if (!pool.length) return undefined;
  let k = t.rng.int(0, pool.length - 1);
  if (pool[k] === state.lastLine && pool.length > 1) k = (k + 1) % pool.length;
  state.lastLine = pool[k];
  return pool[k];
}

/** The plain lines, and the lines of each group the story's flags allow. */
function storyLines(flags, lines) {
  const out = [];
  for (const l of lines) {
    if (typeof l === 'string') out.push(l);
    else if (flagsAllow(flags, l)) out.push(...l.lines);
  }
  return out;
}
