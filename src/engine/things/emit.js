// A decoration's `emit`: bursts of particles it gives off while it stands
// (embers off a fire, steam off a vent). Cosmetic, so it uses the
// particles' own RNG and the game plays out the same.

/** How near the player (tiles, each way) emitters run: beyond it their particles would be specks. */
export const EMIT_RANGE = 32;

/** A number, or one picked at random in [min, max]. */
const between = (rng, v) => (Array.isArray(v) ? v[0] + (v[1] - v[0]) * rng.next() : v);

/**
 * Each of `t.def.emit` gives off its burst every `every` seconds (the first
 * at a random point in the first wait), from `at` in the thing's own frame
 * (as its model is built: x ahead at angle 0, y to its right, z up),
 * turned and scaled with it; a `dir` turns with it too. Not once it's
 * dead, nor while the player is more than EMIT_RANGE away.
 */
export function emitThink(world, t, dt) {
  const list = t.def.emit;
  if (!list || t.dead) return;
  const pt = world.player;
  if (Math.abs(pt.x - t.x) > EMIT_RANGE || Math.abs(pt.y - t.y) > EMIT_RANGE) return;
  const ps = world.particles;
  const rng = ps.rng;
  if (!t.emitWait) t.emitWait = list.map((e) => rng.next() * between(rng, e.every));
  const c = Math.cos(t.angle ?? 0);
  const s = Math.sin(t.angle ?? 0);
  const k = t.def.scale ?? 1;
  for (let i = 0; i < list.length; i++) {
    if ((t.emitWait[i] -= dt) > 0) continue;
    const e = list[i];
    t.emitWait[i] = between(rng, e.every);
    const [ax, ay, az] = e.at ?? [0, 0, 0];
    const dir = e.dir && [e.dir[0] * c - e.dir[1] * s, e.dir[0] * s + e.dir[1] * c, e.dir[2]];
    ps.burst(e.type, t.x + (ax * c - ay * s) * k, t.y + (ax * s + ay * c) * k, t.z + (t.bobZ ?? 0) + az * k, { ...e, dir });
  }
}
