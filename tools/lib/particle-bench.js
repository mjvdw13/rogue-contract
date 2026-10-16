// Particle bench kinds and a spawner that keeps a set number alive in front
// of the camera. Shared by the browser bench (tools/particles.html) and the
// headless one (Phase 1b T step 1). Browser-safe: no Node imports.

/** Palette index of colour k (0 dark .. count-1 light) in a named ramp. */
export function rampIndex(palette, name, k) {
  const [start, count] = palette.ramps[name];
  return start + Math.max(0, Math.min(count - 1, k));
}

/** Colours down a ramp from light index `from` to `to`, `n` steps. */
function ramp(palette, name, from, to, n) {
  const out = [];
  for (let i = 0; i < n; i++) out.push(rampIndex(palette, name, Math.round(from + ((to - from) * i) / Math.max(1, n - 1))));
  return out;
}

/**
 * The bench's kinds: one per way of drawing (dot, square, streak, disc) and
 * blend, each with a spawn velocity.
 */
export function benchKinds(palette) {
  const gy = (k) => rampIndex(palette, 'glow-yellow', k);
  return {
    dust: {
      label: 'Dust (dot, lit, solid)',
      type: { id: 'b-dust', colors: ramp(palette, 'sand', 9, 6, 4), life: [2, 4], size: 0.02, maxPx: 1, drag: 0.5, wind: 1 },
      vel: (r) => [r(-0.3, 0.3), r(-0.3, 0.3), r(-0.1, 0.1)],
    },
    shrapnel: {
      label: 'Shrapnel (square, lit, solid)',
      type: { id: 'b-shrapnel', colors: [...ramp(palette, 'gray', 14, 8, 3), ...ramp(palette, 'rust', 7, 4, 2)], life: [1.5, 3], size: 0.05, maxPx: 3, gravity: 9.8, bounce: 0.35, onFloor: 'stick', walls: 'bounce' },
      vel: (r) => [r(-2, 2), r(-2, 2), r(1, 4)],
    },
    spark: {
      label: 'Sparks (streak, glowing, add)',
      type: { id: 'b-spark', colors: [gy(6), gy(5), gy(4), gy(3), gy(2), gy(1), gy(0)], life: [0.4, 1], size: 0.02, streak: 0.04, fullbright: true, blend: 'add', gravity: 6, bounce: 0.5, onFloor: 'bounce', walls: 'bounce' },
      vel: (r) => [r(-3, 3), r(-3, 3), r(1, 5)],
    },
    smoke: {
      label: 'Smoke (disc, lit, half)',
      type: { id: 'b-smoke', colors: ramp(palette, 'gray', 9, 4, 5), life: [2, 4], size: 0.5, maxPx: 16, shape: 'disc', blend: 'half', drag: 0.8, gravity: -0.6 },
      vel: (r) => [r(-0.2, 0.2), r(-0.2, 0.2), r(0.2, 0.6)],
    },
    steam: {
      label: 'Steam (disc, lit, dither)',
      type: { id: 'b-steam', colors: ramp(palette, 'steel', 27, 22, 4), life: [1, 2.5], size: 0.4, maxPx: 16, shape: 'disc', blend: 'dither', alpha: 0.9, drag: 0.6, gravity: -1 },
      vel: (r) => [r(-0.3, 0.3), r(-0.3, 0.3), r(0.5, 1.5)],
    },
  };
}

/**
 * Keeps `count` particles of `kind` alive, spawned at random spots in the
 * view cone 1 to `far` units ahead, between the floor and 2.5 above it.
 */
export class BenchSpawner {
  constructor(world, kinds) {
    this.world = world;
    this.kinds = kinds;
    this.kind = 'spark';
    this.count = 1000;
    this.far = 10;
    const ps = world.particles;
    this.index = {};
    for (const [k, v] of Object.entries(kinds)) this.index[k] = ps.addType({ ...v.type, cap: Infinity });
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
    const kind = this.kinds[this.kind];
    const ti = this.index[this.kind];
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
