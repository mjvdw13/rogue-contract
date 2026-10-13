import { LIGHT_FX } from './tilemap.js';
import { applySource } from './lightsources.js';

/** The default low end of a light effect: this far below the tile's light. */
const FX_RANGE = 96;
const lowEnd = (light, min) => (min ? Math.min(min, light) : Math.max(16, light - FX_RANGE));

/**
 * Animated lighting (Doom's sector light specials). Tiles that share a glyph
 * and effect form a group and change together; so do tiles that share a
 * `lightSync` name, however far apart, and light sources with that `sync`.
 * Each tile swings between its own light and its own `lightMin` (by default
 * 96 below), so a graded pool of light pulses as one; a source swings between
 * its strength and its `min`. Changed tiles are passed to the light map
 * (`touch`).
 */
export class LightEffects {
  /**
   * @param {*} map
   * @param {*} rng
   * @param {import('./lightmap.js').LightMap|null} [lightmap]
   */
  constructor(map, rng, lightmap = null) {
    this.map = map;
    this.rng = rng;
    this.lightmap = lightmap;
    const n = map.w * map.h;
    /** Each tile's range: its light, and the low end of its effect. */
    this.max = new Uint8Array(n);
    this.min = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      this.max[i] = map.baseLight[i];
      this.min[i] = lowEnd(map.baseLight[i], map.lightMin[i]);
    }
    this.groups = [];
    const byGroup = new Map();
    const groupFor = (g, fx) => {
      if (!byGroup.has(g)) byGroup.set(g, { tiles: [], sources: [], fx });
      return byGroup.get(g);
    };
    for (let i = 0; i < n; i++) {
      const g = map.lightGroup[i];
      if (g >= 0) groupFor(g, map.lightFx[i]).tiles.push(i);
    }
    for (const src of map.sources ?? []) if (src.group >= 0) groupFor(src.group, src.fx).sources.push(src);
    for (const { tiles, sources, fx } of byGroup.values()) this._addGroup(tiles, fx, sources);
  }

  /** A group: `f` is where its tiles and sources are between their low end (0) and full (1); fire uses `drop`. */
  _addGroup(tiles, fx, sources = []) {
    this.groups.push({ tiles, sources, fx, f: 1, drop: 0, timer: this.rng.range(0, 1), phase: this.rng.range(0, Math.PI * 2) });
  }

  update(dt) {
    const r = this.rng;
    const { map, max, min, lightmap } = this;
    for (const g of this.groups) {
      g.timer -= dt;
      switch (g.fx) {
        case LIGHT_FX.flicker:
          if (g.timer <= 0) {
            if (g.f === 1) {
              g.f = 0;
              g.timer = r.range(0.03, 0.2);
            } else {
              g.f = 1;
              g.timer = r.range(0.05, 1.8);
            }
          }
          break;
        case LIGHT_FX.strobe:
          if (g.timer <= 0) {
            if (g.f === 1) {
              g.f = 0;
              g.timer = r.range(0.5, 1);
            } else {
              g.f = 1;
              g.timer = 0.12;
            }
          }
          break;
        case LIGHT_FX.blink:
          if (g.timer <= 0) {
            g.f = g.f === 1 ? 0 : 1;
            g.timer = 0.5;
          }
          break;
        case LIGHT_FX.glow:
          g.phase += dt * 2.5;
          g.f = 0.5 + 0.5 * Math.sin(g.phase);
          break;
        case LIGHT_FX.fire:
          if (g.timer <= 0) {
            g.drop = r.int(0, 3) * 16;
            g.timer = 0.11;
          }
          break;
        default:
          break;
      }
      for (const i of g.tiles) {
        const l = g.fx === LIGHT_FX.fire ? Math.max(min[i], max[i] - g.drop) : Math.round(min[i] + (max[i] - min[i]) * g.f);
        if (map.light[i] === l) continue;
        map.light[i] = l;
        lightmap?.touch(i);
      }
      for (const src of g.sources) this._setSource(src, g.fx === LIGHT_FX.fire ? Math.max(src.min, src.light - g.drop) : Math.round(src.min + (src.light - src.min) * g.f));
    }
  }

  /** Change how much light a source adds now. */
  _setSource(src, amount) {
    if (amount === src.cur) return;
    applySource(this.map, src.baked, amount - src.cur, this.lightmap);
    src.cur = amount;
  }

  /**
   * Change the base light of tiles (trigger action), and the strength of
   * light sources; restarts their groups, each tile keeping its range. With
   * `fx` ('none', 'flicker', ...), the tiles and sources leave their groups
   * and change together with the new effect, between `light` and `min`.
   */
  setLight(tiles, light, fx, min = 0, sources = []) {
    const map = this.map;
    const set = new Set(tiles);
    const srcSet = new Set(sources);
    for (const i of tiles) {
      map.baseLight[i] = light;
      map.light[i] = light;
      this.lightmap?.touch(i);
    }
    for (const src of sources) {
      src.light = light;
      src.min = Math.min(fx !== undefined ? min : src.min, light);
      this._setSource(src, light);
    }
    if (fx !== undefined) {
      for (const g of this.groups) {
        g.tiles = g.tiles.filter((i) => !set.has(i));
        g.sources = g.sources.filter((src) => !srcSet.has(src));
      }
      this.groups = this.groups.filter((g) => g.tiles.length || g.sources.length);
      const code = LIGHT_FX[fx] ?? 0;
      for (const i of tiles) {
        map.lightFx[i] = code;
        map.lightMin[i] = min;
        this.max[i] = light;
        this.min[i] = lowEnd(light, min);
      }
      for (const src of sources) src.fx = code;
      if (code && (tiles.length || sources.length)) this._addGroup([...tiles], code, [...sources]);
      return;
    }
    for (const i of tiles) {
      const range = this.max[i] - this.min[i];
      this.max[i] = light;
      this.min[i] = Math.max(16, light - range);
    }
    for (const g of this.groups) {
      if (g.tiles.some((i) => set.has(i)) || g.sources.some((src) => srcSet.has(src))) {
        g.f = 1;
        g.drop = 0;
      }
    }
  }
}
