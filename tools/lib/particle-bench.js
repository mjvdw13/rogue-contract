// Particle bench kinds and a spawner that keeps a set number alive in front
// of the camera. Shared by the browser bench (tools/particles.html) and the
// headless one (PLAN.md Phase 1b T step 1). Browser-safe: no Node imports.
// The kinds are the content's particle types (src/content/particles.js), each
// with a spawn velocity.

/** The bench's kinds: one per way of drawing (dot, square, streak, disc) and blend. */
export const BENCH_KINDS = {
  dust: { label: 'Dust (dot, lit, solid)', vel: (r) => [r(-0.3, 0.3), r(-0.3, 0.3), r(-0.1, 0.1)] },
  shrapnel: { label: 'Shrapnel (square, lit, solid)', vel: (r) => [r(-2, 2), r(-2, 2), r(1, 4)] },
  spark: { label: 'Sparks (streak, glowing, add)', vel: (r) => [r(-3, 3), r(-3, 3), r(1, 5)] },
  ember: { label: 'Embers (dot, glowing, add)', vel: (r) => [r(-0.3, 0.3), r(-0.3, 0.3), r(0.2, 1)] },
  smoke: { label: 'Smoke (disc, lit, half)', vel: (r) => [r(-0.2, 0.2), r(-0.2, 0.2), r(0.2, 0.6)] },
  steam: { label: 'Steam (disc, lit, dither)', vel: (r) => [r(-0.3, 0.3), r(-0.3, 0.3), r(0.5, 1.5)] },
};

/**
 * Keeps `count` particles of `kind` alive, spawned at random spots in the
 * view cone 1 to `far` units ahead, between the floor and 2.5 above it. The
 * world's caps are lifted (up to the pool's size) while it runs.
 */
export class BenchSpawner {
  constructor(world) {
    this.world = world;
    this.kind = 'spark';
    this.count = 1000;
    this.far = 10;
    const ps = world.particles;
    ps.capPoints = ps.capDiscs = ps.cap;
    for (const k of Object.keys(BENCH_KINDS)) {
      const ti = ps.typeIndex(k);
      if (ti < 0) throw new Error(`No particle type "${k}" in the content`);
      ps.types[ti].cap = Infinity;
    }
    // Spawn positions use their own little generator, so runs repeat.
    this.seed = 1;
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
    const ti = ps.typeIndex(this.kind);
    if (this._last !== this.kind || ps.n > this.count) {
      ps.clear();
      this._last = this.kind;
    }
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
      const z = floor + r(0.05, Math.min(2.5, ceil - floor - 0.05));
      const [vx, vy, vz] = kind.vel(r);
      ps.spawn(ti, x, y, z, vx, vy, vz);
    }
  }
}
