// Particle bench kinds and a spawner that keeps a set number alive in front
// of the camera. Shared by the browser bench (tools/particles.html) and the
// headless one (PLAN.md Phase 1b T step 1). Browser-safe: no Node imports.
// The kinds are the content's particle types (src/content/particles.js), each
// with a spawn velocity.

/**
 * The bench's kinds, one per content type: a label, a spawn velocity, and
 * optionally spawn heights above the floor (`z`, default 0.05 to 2.5) and the
 * level's wind while it runs (`wind`, default still air).
 */
export const BENCH_KINDS = {
  dust: { label: 'Dust (dot, lit, solid)', vel: (r) => [r(-0.3, 0.3), r(-0.3, 0.3), r(-0.1, 0.1)] },
  shrapnel: { label: 'Shrapnel (square, lit, solid)', vel: (r) => [r(-2, 2), r(-2, 2), r(1, 4)] },
  spark: { label: 'Sparks (streak, glowing, add)', vel: (r) => [r(-3, 3), r(-3, 3), r(1, 5)] },
  'bolt-spark': { label: 'Bolt sparks (streak, glowing, add)', vel: (r) => [r(-3, 3), r(-3, 3), r(1, 4)] },
  'ion-spark': { label: 'Ion sparks (streak, glowing, add)', vel: (r) => [r(-5, 5), r(-5, 5), r(-3, 4)] },
  ember: { label: 'Embers (dot, glowing, add)', vel: (r) => [r(-0.3, 0.3), r(-0.3, 0.3), r(0.2, 1)] },
  mote: { label: 'Motes (dot, glowing, add)', vel: (r) => [r(-0.1, 0.1), r(-0.1, 0.1), r(-0.05, 0.1)], z: [0.3, 3] },
  'rock-chip': { label: 'Rock chips (square, lit, solid)', vel: (r) => [r(-1.5, 1.5), r(-1.5, 1.5), r(1, 3.5)] },
  smoke: { label: 'Smoke (disc, lit, half)', vel: (r) => [r(-0.2, 0.2), r(-0.2, 0.2), r(0.2, 0.6)] },
  steam: { label: 'Steam (disc, lit, dither)', vel: (r) => [r(-0.3, 0.3), r(-0.3, 0.3), r(0.5, 1.5)] },
  'dust-puff': { label: 'Dust puffs (disc, lit, half, fading)', vel: (r) => [r(-0.6, 0.6), r(-0.6, 0.6), r(0.1, 0.6)], z: [0.05, 0.4] },
  mist: { label: 'Mist (disc, lit, half, fading)', vel: (r) => [r(-0.15, 0.15), r(-0.15, 0.15), 0], z: [0.05, 0.35] },
  'sand-gust': { label: 'Sand gusts (disc, lit, half, fading)', vel: (r) => [r(2, 4), r(0.5, 1.5), 0], z: [0.1, 0.8], wind: [3, 1, 0] },
  fire: { label: 'Fire (disc, glowing, add, swelling)', vel: (r) => [r(-0.5, 0.5), r(-0.5, 0.5), r(0, 1)], z: [0.3, 1.5] },
  'fire-blue': { label: 'Blue fire (disc, glowing, add, swelling)', vel: (r) => [r(-0.5, 0.5), r(-0.5, 0.5), r(0, 1)], z: [0.3, 1.5] },
  debris: { label: 'Debris (square, glowing, smoke trail)', vel: (r) => [r(-3, 3), r(-3, 3), r(2, 5)] },
  'smoke-wisp': { label: 'Smoke wisps (disc, lit, half, swelling)', vel: (r) => [r(-0.2, 0.2), r(-0.2, 0.2), r(0.2, 0.6)] },
  'blast-smoke': { label: 'Blast smoke (disc, lit, half, swelling)', vel: (r) => [r(-0.3, 0.3), r(-0.3, 0.3), r(0.2, 0.8)] },
};

/**
 * Keeps `count` particles of `kind` alive, spawned at random spots in the
 * view cone 1 to `far` units ahead, at its kind's heights above the floor. The
 * world's caps are lifted (up to the pool's size) while it runs; with no
 * kind ('') it spawns nothing and the real caps hold (to test explosions).
 */
export class BenchSpawner {
  constructor(world) {
    this.world = world;
    this.kind = 'spark';
    this.count = 1000;
    this.far = 10;
    const ps = world.particles;
    this.caps = { points: ps.capPoints, discs: ps.capDiscs, types: ps.types.map((t) => t.cap) };
    for (const k of Object.keys(BENCH_KINDS)) if (ps.typeIndex(k) < 0) throw new Error(`No particle type "${k}" in the content`);
    this.liftCaps(true);
    // Spawn positions use their own little generator, so runs repeat.
    this.seed = 1;
  }

  /** Lift the caps (up to the pool's size), or put the real ones back. */
  liftCaps(on) {
    const ps = this.world.particles;
    ps.capPoints = on ? ps.cap : this.caps.points;
    ps.capDiscs = on ? ps.cap : this.caps.discs;
    ps.types.forEach((t, i) => (t.cap = on ? Infinity : this.caps.types[i]));
  }

  rand(a, b) {
    this.seed = (this.seed * 1664525 + 1013904223) >>> 0;
    return a + ((b - a) * this.seed) / 4294967296;
  }

  /** Top the pool up to `count` of the current kind (others are cleared on a change). */
  fill(cam) {
    const ps = this.world.particles;
    const map = this.world.map;
    const kind = BENCH_KINDS[this.kind];
    if (this._last !== this.kind) {
      ps.clear();
      this._last = this.kind;
      ps.wind = kind?.wind ? [...kind.wind] : [0, 0, 0];
      this.liftCaps(!!kind);
    }
    if (!kind) return;
    const ti = ps.typeIndex(this.kind);
    if (ps.n > this.count) ps.clear();
    const [z0, z1] = kind.z ?? [0.05, 2.5];
    const r = (a, b) => this.rand(a, b);
    const dirX = Math.cos(cam.angle);
    const dirY = Math.sin(cam.angle);
    let tries = (this.count - ps.n) * 4;
    while (ps.n < this.count && tries-- > 0) {
      const d = r(1, this.far);
      const u = r(-0.9, 0.9) * d;
      const x = cam.x + dirX * d - dirY * u;
      const y = cam.y + dirY * d + dirX * u;
      if (!map.inBounds(x | 0, y | 0)) continue;
      const floor = map.floorAt(x, y, 0, (cam.z ?? 0) + 1);
      const ceil = map.ceilAt(x, y, 0, (cam.z ?? 0) + 1);
      const z = floor + r(z0, Math.min(z1, ceil - floor - 0.05));
      const [vx, vy, vz] = kind.vel(r);
      ps.spawn(ti, x, y, z, vx, vy, vz);
    }
  }
}
