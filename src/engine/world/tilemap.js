// Tile flags.
export const F_SOLID = 1;
export const F_DOOR = 2;
export const F_SKY = 4;
export const F_SECRET = 8;
export const F_DAMAGE = 16;
export const F_EXIT = 32;
export const F_USE = 64;
export const F_VOID = 128;
/** The tile holds an angled wall (see slants.js): part solid, part open. */
export const F_SLANT = 256;
/**
 * The tile holds a slab: a solid layer from `slabBot` to `slabTop` inside its
 * open space. That gives two storeys: the lower one from the floor up to the
 * slab's underside, and the upper one from the slab's top up to the ceiling.
 */
export const F_SLAB = 512;

/** Tile edges, in the order of `TileMap.fenceAt`: north, east, south, west. */
export const EDGES = 'NESW';
/** The neighbour across each edge, and the edge that faces back. */
export const EDGE_DX = [0, 1, 0, -1];
export const EDGE_DY = [-1, 0, 1, 0];
export const OPPOSITE = [2, 3, 0, 1];

/** Light effects a tile can have (Doom sector light specials). */
export const LIGHT_FX = { none: 0, flicker: 1, strobe: 2, glow: 3, fire: 4, blink: 5 };

/**
 * A door living in one tile. Every door is a thin panel standing in the plane
 * `plane`: `axis: 'x'` means the plane is at constant x (you walk through it
 * along the x axis); `'y'` means constant y. Sliding and split doors run
 * through the tile centre. Rising doors (`style: 'rise'`, Dark Forces' kind)
 * stand across the middle of the whole doorway's depth, set back from both
 * faces; the door tiles are an open recess with their ceiling at `openZ`, and
 * the panel rises from the floor into it. `span0`..`span1` is the doorway's
 * extent across (the other axis), so a rising door's texture fits the door.
 */
export class Door {
  constructor(spec) {
    this.x = spec.x;
    this.y = spec.y;
    this.tex = spec.tex;
    this.jamb = spec.jamb ?? -1;
    this.axis = spec.axis ?? 'x';
    this.style = spec.style ?? 'slide'; // 'slide' | 'split' | 'rise'
    /** For rising doors: the ceiling height when fully open (set by the level builder). */
    this.openZ = spec.openZ ?? 2;
    /** Floor height of the doorway (set by the level builder). */
    this.floorZ = spec.floorZ ?? 0;
    /** Where the panel stands, and the doorway's extent across (set by the level builder). */
    this.plane = spec.plane ?? (this.axis === 'x' ? this.x : this.y) + 0.5;
    this.span0 = spec.span0 ?? (this.axis === 'x' ? this.y : this.x);
    this.span1 = spec.span1 ?? this.span0 + 1;
    this.lock = spec.lock ?? null; // key id, 'remote' (triggers only) or null
    this.secret = !!spec.secret;
    this.stayOpen = !!spec.stayOpen;
    this.tag = spec.tag ?? null;
    this.speed = spec.speed ?? 3.5; // fraction per second (Star Wars doors snap open)
    this.wait = spec.wait ?? 4;
    this.sounds = spec.sounds ?? {};
    this.open = 0;
    this.state = 'closed'; // closed | opening | open | closing
    this.timer = 0;
  }

  get passable() {
    return this.open >= 0.85;
  }

  /** A rising door's bottom edge (it rises from the floor to openZ). */
  get bottomZ() {
    return this.floorZ + this.open * (this.openZ - this.floorZ);
  }

  /**
   * Where a ray from (x, y) along (dx, dy) meets the panel's plane, or -1 if it
   * runs parallel or the plane is behind it.
   */
  planeHit(x, y, dx, dy) {
    const d = this.axis === 'x' ? dx : dy;
    if (d === 0) return -1;
    const t = (this.plane - (this.axis === 'x' ? x : y)) / d;
    return t >= 0 ? t : -1;
  }

  /** Does a body of radius r at (x, y) reach across the panel's plane? */
  touchesPanel(x, y, r) {
    return Math.abs((this.axis === 'x' ? x : y) - this.plane) < r;
  }
}

/** The runtime grid for a level. All per-tile data lives in flat typed arrays. */
export class TileMap {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    const n = w * h;
    this.flags = new Uint16Array(n);
    this.wallTex = new Int16Array(n).fill(-1);
    this.floorTex = new Int16Array(n).fill(-1);
    this.ceilTex = new Int16Array(n).fill(-1);
    /** Floor and ceiling heights in world units (1 = one tile = 64 texels). */
    this.floorZ = new Float32Array(n);
    this.ceilZ = new Float32Array(n).fill(2);
    /** Texture for the faces of a raised floor (its sides) and of a lowered ceiling (its underside edge). */
    this.sideTex = new Int16Array(n).fill(-1);
    this.upperTex = new Int16Array(n).fill(-1);
    this.baseLight = new Uint8Array(n);
    this.light = new Uint8Array(n);
    this.lightFx = new Uint8Array(n);
    /** The low end of a tile's light effect (0: the default, 96 below its light). */
    this.lightMin = new Uint8Array(n);
    this.lightGroup = new Int32Array(n).fill(-1);
    /**
     * Slabs (`F_SLAB`): the solid layer's bottom and top, the textures on its
     * top (the upper storey's floor), underside (the lower storey's ceiling)
     * and edges, and how much lighter or darker the lower storey is than the
     * tile's light.
     */
    this.slabBot = new Float32Array(n);
    this.slabTop = new Float32Array(n);
    this.slabTopTex = new Int16Array(n).fill(-1);
    this.slabUnderTex = new Int16Array(n).fill(-1);
    this.slabSideTex = new Int16Array(n).fill(-1);
    this.belowLight = new Int16Array(n);
    /**
     * Light added by placed light sources (see lightsources.js), one array
     * per storey (the lower storey, or the only one, then the top of a slab),
     * and the sources themselves.
     */
    this.srcLight = [new Float32Array(n), new Float32Array(n)];
    /** The sources' light again, reaching further, for glints (lightsources.js), per storey. */
    this.glintLight = [new Float32Array(n), new Float32Array(n)];
    /** @type {import('./lightsources.js').LightSource[]} */
    this.sources = [];
    /**
     * Wall bands: a tile whose wall (or step faces) change texture with
     * height has a band set (`bandSets[bandIndex[i]]`): `{ from, to, tex }`
     * spans, first match winning, its own texture elsewhere.
     */
    this.bandIndex = new Int16Array(n).fill(-1);
    /** @type {{from:number, to:number, tex:number}[][]} */
    this.bandSets = [];
    /**
     * Decals (see decals.js): all of them, the ones on each tile edge
     * (tile * 4 + face), and how many each edge has. Laid out by the
     * renderer when `decalsDirty`.
     */
    this.decals = [];
    this.edgeDecals = new Map();
    this.decalEdge = new Uint8Array(n * 4);
    this.decalsDirty = false;
    this.damage = new Uint8Array(n);
    this.doorIndex = new Int16Array(n).fill(-1);
    this.liftIndex = new Int16Array(n).fill(-1);
    this.slantIndex = new Int16Array(n).fill(-1);
    /** @type {import('./slants.js').Slant[]} */
    this.slants = [];
    /** @type {import('./lifts.js').Lift[]} */
    this.lifts = [];
    /**
     * See-through walls on tile edges (railings, bars, grates): `fenceAt[i * 4 + edge]`
     * is an index into `fences`, set on both tiles beside the edge, or -1.
     * @type {{tex:number, height:number, tile:number}[]}
     */
    this.fences = [];
    this.fenceAt = new Int16Array(n * 4).fill(-1);
    this.tag = new Int16Array(n).fill(-1);
    this.seen = new Uint8Array(n);
    /** @type {Door[]} */
    this.doors = [];
    /** tag name -> tile indices */
    this.tags = new Map();
    this.tagNames = [];
    /** tile index -> {actions, switchTo, repeat, used} for usable walls */
    this.uses = new Map();
  }

  index(x, y) {
    return y * this.w + x;
  }

  inBounds(x, y) {
    return x >= 0 && y >= 0 && x < this.w && y < this.h;
  }

  /** Door object at a tile, or null. */
  doorAt(x, y) {
    if (!this.inBounds(x, y)) return null;
    const d = this.doorIndex[y * this.w + x];
    return d >= 0 ? this.doors[d] : null;
  }

  /**
   * True if the tile blocks movement (walls, void, closed doors, outside the
   * map). A rising door's tiles are an open recess: only its panel blocks
   * (see `panelBlocks`).
   */
  blocks(x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return true;
    const i = y * this.w + x;
    const f = this.flags[i];
    if (f & F_SOLID) return true;
    if (f & F_DOOR) {
      const d = this.doors[this.doorIndex[i]];
      return d.style !== 'rise' && !d.passable;
    }
    return false;
  }

  /** Does the closed part of a rising door's panel in tile (x, y) stop a body of radius r at (px, py)? */
  panelBlocks(x, y, px, py, r) {
    const d = this.doorAt(x, y);
    return !!d && d.style === 'rise' && !d.passable && d.touchesPanel(px, py, r);
  }

  /**
   * Does a point moving from (x0, y0) to (x1, y1) at height z cross the closed
   * part of a rising door's panel (projectiles)?
   */
  panelCrossed(x0, y0, x1, y1, z) {
    for (const [px, py] of [[x0, y0], [x1, y1]]) {
      const d = this.doorAt(Math.floor(px), Math.floor(py));
      if (!d || d.style !== 'rise' || z < d.bottomZ) continue;
      const a = (d.axis === 'x' ? x0 : y0) - d.plane;
      const b = (d.axis === 'x' ? x1 : y1) - d.plane;
      if ((a < 0 && b >= 0) || (a > 0 && b <= 0)) return true;
    }
    return false;
  }

  /** The angled wall in a tile, or null. */
  slantAt(x, y) {
    if (!this.inBounds(x, y)) return null;
    const s = this.slantIndex[y * this.w + x];
    return s >= 0 ? this.slants[s] : null;
  }

  /** Is the point (x, y) inside something solid: a blocking tile or the solid side of an angled wall? */
  solidPoint(x, y) {
    const tx = Math.floor(x);
    const ty = Math.floor(y);
    if (this.blocks(tx, ty)) return true;
    const s = this.slantAt(tx, ty);
    return s ? s.solidAt(x, y) : false;
  }

  /** The fence on the edge between neighbouring tiles a and b, or null. */
  fenceBetween(a, b) {
    const d = b - a;
    const edge = d === -this.w ? 0 : d === 1 ? 1 : d === this.w ? 2 : d === -1 ? 3 : -1;
    if (edge < 0) return null;
    const k = this.fenceAt[a * 4 + edge];
    return k >= 0 ? this.fences[k] : null;
  }

  /**
   * A fence's bottom and top: it stands on its tile's floor (on the slab, in a
   * tile with one), `height` high or up to the ceiling.
   */
  fenceBottom(f) {
    return this.flags[f.tile] & F_SLAB ? this.slabTop[f.tile] : this.floorZ[f.tile];
  }

  fenceTop(f) {
    return f.height ? this.fenceBottom(f) + f.height : this.ceilZ[f.tile];
  }

  /** True if the tile blocks sight/bullets. Doors block until mostly open. */
  blocksSight(x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return true;
    const i = y * this.w + x;
    const f = this.flags[i];
    if (f & F_SOLID) return true;
    if (f & F_DOOR) return this.doors[this.doorIndex[i]].open < 0.6;
    return false;
  }

  /**
   * The storey of tile i that a body reaching up to height `reach` is in: 1
   * (on the slab) when the tile has a slab whose top is within reach, else 0.
   * A body's reach is its feet plus how high it can step; a point's (a
   * projectile, a ray) is its own height.
   */
  storeyAt(i, reach = Infinity) {
    return this.flags[i] & F_SLAB && this.slabTop[i] <= reach ? 1 : 0;
  }

  /** The floor of storey s of tile i. */
  storeyFloor(i, s) {
    return s ? this.slabTop[i] : this.floorZ[i];
  }

  /** The ceiling of storey s of tile i. */
  storeyCeil(i, s) {
    return !s && this.flags[i] & F_SLAB ? this.slabBot[i] : this.ceilZ[i];
  }

  /** The light of storey s of tile i. */
  storeyLight(i, s) {
    const l = (s || !(this.flags[i] & F_SLAB) ? this.light[i] : this.light[i] + this.belowLight[i]) + this.srcLight[s ? 1 : 0][i];
    return l < 0 ? 0 : l > 255 ? 255 : l;
  }

  /**
   * Highest floor under a box of half-size r centred at (x, y), ignoring solid
   * tiles. In a tile with a slab, the floor of the storey a body reaching up
   * to `reach` is in (see storeyAt): the slab's top by default.
   */
  floorAt(x, y, r = 0, reach = Infinity) {
    let best = -Infinity;
    const x0 = Math.floor(x - r);
    const x1 = Math.max(x0, Math.ceil(x + r) - 1); // (a box exactly touching an edge stays out)
    const y0 = Math.floor(y - r);
    const y1 = Math.max(y0, Math.ceil(y + r) - 1);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        if (!this.inBounds(tx, ty)) continue;
        const i = ty * this.w + tx;
        const f = this.flags[i];
        if (f & F_SOLID) continue;
        const z = f & F_SLAB && this.slabTop[i] <= reach ? this.slabTop[i] : this.floorZ[i];
        if (z > best) best = z;
      }
    }
    return best === -Infinity ? 0 : best;
  }

  /** Lowest floor under a box of half-size r centred at (x, y), ignoring solid tiles (storeys as in floorAt). */
  lowFloorAt(x, y, r = 0, reach = Infinity) {
    let best = Infinity;
    for (let ty = Math.floor(y - r); ty <= Math.max(Math.floor(y - r), Math.ceil(y + r) - 1); ty++) {
      for (let tx = Math.floor(x - r); tx <= Math.max(Math.floor(x - r), Math.ceil(x + r) - 1); tx++) {
        if (!this.inBounds(tx, ty)) continue;
        const i = ty * this.w + tx;
        const f = this.flags[i];
        if (f & F_SOLID) continue;
        const z = f & F_SLAB && this.slabTop[i] <= reach ? this.slabTop[i] : this.floorZ[i];
        if (z < best) best = z;
      }
    }
    return best === Infinity ? 0 : best;
  }

  /**
   * Lowest ceiling over a box of half-size r centred at (x, y), ignoring solid
   * tiles. In a tile with a slab, the ceiling of the storey a body reaching up
   * to `reach` is in: the slab's underside for the lower storey.
   */
  ceilAt(x, y, r = 0, reach = Infinity) {
    let best = Infinity;
    const x0 = Math.floor(x - r);
    const x1 = Math.max(x0, Math.ceil(x + r) - 1); // (a box exactly touching an edge stays out)
    const y0 = Math.floor(y - r);
    const y1 = Math.max(y0, Math.ceil(y + r) - 1);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        if (!this.inBounds(tx, ty)) continue;
        const i = ty * this.w + tx;
        const f = this.flags[i];
        if (f & F_SOLID) continue;
        const z = f & F_SLAB && !(this.slabTop[i] <= reach) ? this.slabBot[i] : this.ceilZ[i];
        if (z < best) best = z;
      }
    }
    return best === Infinity ? 2 : best;
  }

  tilesWithTag(name) {
    return this.tags.get(name) ?? [];
  }

  sourcesWithTag(name) {
    return this.sources.filter((s) => s.tag === name);
  }
}
