import { F_SKY } from './tilemap.js';

/**
 * Weather: `count` particles of one type kept alive in a square round the
 * camera, `range` tiles each way, only in tiles under the sky. One the camera
 * leaves behind comes round to the far side of the square (it wraps), so
 * moving doesn't empty the air ahead; ones that die (of age, or on the floor)
 * are made again at a random spot in the square. Cosmetic: the particles'
 * own RNG.
 */
export class Weather {
  /**
   * @param {import('./particles.js').Particles} particles
   * @param {import('./tilemap.js').TileMap} map
   * @param {{type:string, count:number, range?:number, z?:number[], drift?:number[], wind?:number[]}} def
   */
  constructor(particles, map, def) {
    this.ps = particles;
    this.map = map;
    this.ti = particles.typeIndex(def.type);
    this.count = def.count;
    this.range = def.range ?? 10;
    /** Heights above the floor where they're made. */
    this.z = def.z ?? [0.05, 2.5];
    /** Random speed each is made with: across, and up or down. */
    this.drift = def.drift ?? [0.3, 0.1];
    /** The level's wind (units per second), which carries every particle type with `wind`. */
    this.wind = def.wind ?? null;
    if (this.wind) particles.wind = [...this.wind];
    this.filled = false;
  }

  /** Fill the square round (cx, cy) at once, the particles part-way through their lives (the level's start, or a jump). */
  fill(cx, cy) {
    const ps = this.ps;
    for (let i = ps.n - 1; i >= 0; i--) if (ps.type[i] === this.ti) ps.remove(i);
    let tries = this.count * 4;
    while (this._live() < this.count && tries-- > 0) {
      const i = this._make(cx, cy);
      if (i >= 0) ps.age[i] = ps.life[i] * ps.rng.next();
    }
    this.filled = true;
  }

  /** After the particles move: wrap the ones the camera left behind, drop ones indoors, make new ones for the dead. */
  update(cx, cy) {
    if (this.ti < 0) return;
    if (!this.filled) return this.fill(cx, cy);
    const ps = this.ps;
    const flags = this.map.flags;
    const r = this.range;
    const side = r * 2;
    // Backwards: remove() moves the last particle into slot i, and that one's been seen.
    for (let i = ps.n - 1; i >= 0; i--) {
      if (ps.type[i] !== this.ti) continue;
      const x = ps.x[i];
      const y = ps.y[i];
      const ox = x - (cx - r);
      const oy = y - (cy - r);
      if (ox < 0 || ox >= side || oy < 0 || oy >= side) {
        // Round to the far side, as high above the floor there as it was here.
        const nx = cx - r + (((ox % side) + side) % side);
        const ny = cy - r + (((oy % side) + side) % side);
        const above = ps.z[i] - ps.floor[i];
        const tile = this.map.inBounds(nx | 0, ny | 0) ? (ny | 0) * this.map.w + (nx | 0) : -1;
        if (tile < 0 || !(flags[tile] & F_SKY) || !ps.move(i, nx, ny, this.map.floorZ[tile] + above)) ps.remove(i);
      } else if (!(flags[ps.tile[i]] & F_SKY)) ps.remove(i);
    }
    let tries = (this.count - this._live()) * 2;
    while (tries-- > 0 && this._live() < this.count) this._make(cx, cy);
  }

  _live() {
    return this.ps.types[this.ti].live;
  }

  /** One particle at a random spot in the square under the sky, or -1. */
  _make(cx, cy) {
    const ps = this.ps;
    const map = this.map;
    const rng = ps.rng;
    const x = cx + (rng.next() * 2 - 1) * this.range;
    const y = cy + (rng.next() * 2 - 1) * this.range;
    if (!map.inBounds(x | 0, y | 0)) return -1;
    const tile = (y | 0) * map.w + (x | 0);
    if (!(map.flags[tile] & F_SKY)) return -1;
    const floor = map.floorZ[tile];
    const [z0, z1] = this.z;
    const top = Math.min(z1, map.ceilZ[tile] - floor - 0.05);
    if (top <= z0) return -1;
    const [h, v] = this.drift;
    const z = floor + z0 + (top - z0) * rng.next();
    return ps.spawn(this.ti, x, y, z, (rng.next() * 2 - 1) * h, (rng.next() * 2 - 1) * h, (rng.next() * 2 - 1) * v);
  }
}
