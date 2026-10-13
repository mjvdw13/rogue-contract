import { LIGHT_FX } from './tilemap.js';

/** The default low end of a light effect: this far below the tile's light. */
const FX_RANGE = 96;
const lowEnd = (light, min) => (min ? Math.min(min, light) : Math.max(16, light - FX_RANGE));

/**
 * Animated lighting (Doom's sector light specials). Tiles that share a glyph
 * and effect form a group and change together. An effect swings between the
 * tile's light and its `lightMin` (by default 96 below).
 */
export class LightEffects {
  constructor(map, rng) {
    this.map = map;
    this.rng = rng;
    this.groups = [];
    const byGroup = new Map();
    for (let i = 0; i < map.w * map.h; i++) {
      const g = map.lightGroup[i];
      if (g < 0) continue;
      if (!byGroup.has(g)) byGroup.set(g, []);
      byGroup.get(g).push(i);
    }
    for (const tiles of byGroup.values()) this._addGroup(tiles, map.lightFx[tiles[0]], map.baseLight[tiles[0]], map.lightMin[tiles[0]]);
  }

  _addGroup(tiles, fx, light, min) {
    this.groups.push({
      tiles,
      fx,
      max: light,
      min: lowEnd(light, min),
      cur: light,
      timer: this.rng.range(0, 1),
      phase: this.rng.range(0, Math.PI * 2),
    });
  }

  update(dt) {
    const r = this.rng;
    for (const g of this.groups) {
      g.timer -= dt;
      switch (g.fx) {
        case LIGHT_FX.flicker:
          if (g.timer <= 0) {
            if (g.cur === g.max) {
              g.cur = g.min;
              g.timer = r.range(0.03, 0.2);
            } else {
              g.cur = g.max;
              g.timer = r.range(0.05, 1.8);
            }
          }
          break;
        case LIGHT_FX.strobe:
          if (g.timer <= 0) {
            if (g.cur === g.max) {
              g.cur = g.min;
              g.timer = r.range(0.5, 1);
            } else {
              g.cur = g.max;
              g.timer = 0.12;
            }
          }
          break;
        case LIGHT_FX.blink:
          if (g.timer <= 0) {
            g.cur = g.cur === g.max ? g.min : g.max;
            g.timer = 0.5;
          }
          break;
        case LIGHT_FX.glow:
          g.phase += dt * 2.5;
          g.cur = Math.round(g.min + (g.max - g.min) * (0.5 + 0.5 * Math.sin(g.phase)));
          break;
        case LIGHT_FX.fire:
          if (g.timer <= 0) {
            g.cur = Math.max(g.min, g.max - r.int(0, 3) * 16);
            g.timer = 0.11;
          }
          break;
        default:
          break;
      }
      for (const i of g.tiles) this.map.light[i] = g.cur;
    }
  }

  /**
   * Change the base light of tiles (trigger action); restarts their groups,
   * keeping each group's range. With `fx` ('none', 'flicker', ...), the tiles
   * leave their groups and change together with the new effect, between
   * `light` and `min`.
   */
  setLight(tiles, light, fx, min = 0) {
    const map = this.map;
    const set = new Set(tiles);
    for (const i of tiles) {
      map.baseLight[i] = light;
      map.light[i] = light;
    }
    if (fx !== undefined) {
      for (const g of this.groups) g.tiles = g.tiles.filter((i) => !set.has(i));
      this.groups = this.groups.filter((g) => g.tiles.length);
      const code = LIGHT_FX[fx] ?? 0;
      for (const i of tiles) {
        map.lightFx[i] = code;
        map.lightMin[i] = min;
      }
      if (code && tiles.length) this._addGroup([...tiles], code, light, min);
      return;
    }
    for (const g of this.groups) {
      if (g.tiles.some((i) => set.has(i))) {
        const range = g.max - g.min;
        g.max = light;
        g.min = Math.max(16, light - range);
        g.cur = light;
      }
    }
  }
}
