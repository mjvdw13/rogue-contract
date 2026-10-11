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

/** Light effects a tile can have (Doom sector light specials). */
export const LIGHT_FX = { none: 0, flicker: 1, strobe: 2, glow: 3, fire: 4, blink: 5 };

/**
 * A door living in one tile. Sliding and split doors are a thin panel through
 * the tile centre: `axis: 'x'` means the plane is at constant x (you walk
 * through it along the x axis); `'y'` means constant y. Rising doors
 * (`style: 'rise'`, Dark Forces' kind) fill the tile: its ceiling rises from
 * the floor to `openZ`.
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
    this.openZ = spec.openZ ?? 1;
    this.lock = spec.lock ?? null; // key id, 'remote' (triggers only) or null
    this.secret = !!spec.secret;
    this.stayOpen = !!spec.stayOpen;
    this.tag = spec.tag ?? null;
    this.speed = spec.speed ?? 1.6; // fraction per second
    this.wait = spec.wait ?? 4;
    this.sounds = spec.sounds ?? {};
    this.open = 0;
    this.state = 'closed'; // closed | opening | open | closing
    this.timer = 0;
  }

  get passable() {
    return this.open >= 0.85;
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
    this.ceilZ = new Float32Array(n).fill(1);
    /** Texture for the faces of a raised floor (its sides) and of a lowered ceiling (its underside edge). */
    this.sideTex = new Int16Array(n).fill(-1);
    this.upperTex = new Int16Array(n).fill(-1);
    this.baseLight = new Uint8Array(n);
    this.light = new Uint8Array(n);
    this.lightFx = new Uint8Array(n);
    this.lightGroup = new Int32Array(n).fill(-1);
    this.damage = new Uint8Array(n);
    this.doorIndex = new Int16Array(n).fill(-1);
    this.liftIndex = new Int16Array(n).fill(-1);
    this.slantIndex = new Int16Array(n).fill(-1);
    /** @type {import('./slants.js').Slant[]} */
    this.slants = [];
    /** @type {import('./lifts.js').Lift[]} */
    this.lifts = [];
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

  /** True if the tile blocks movement (walls, void, closed doors, outside the map). */
  blocks(x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return true;
    const i = y * this.w + x;
    const f = this.flags[i];
    if (f & F_SOLID) return true;
    if (f & F_DOOR) return !this.doors[this.doorIndex[i]].passable;
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

  /** True if the tile blocks sight/bullets. Doors block until mostly open. */
  blocksSight(x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return true;
    const i = y * this.w + x;
    const f = this.flags[i];
    if (f & F_SOLID) return true;
    if (f & F_DOOR) return this.doors[this.doorIndex[i]].open < 0.6;
    return false;
  }

  /** Highest floor under a box of half-size r centred at (x, y), ignoring solid tiles. */
  floorAt(x, y, r = 0) {
    let best = -Infinity;
    const x0 = Math.floor(x - r);
    const x1 = Math.floor(x + r);
    const y0 = Math.floor(y - r);
    const y1 = Math.floor(y + r);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        if (!this.inBounds(tx, ty)) continue;
        const i = ty * this.w + tx;
        if (this.flags[i] & F_SOLID) continue;
        if (this.floorZ[i] > best) best = this.floorZ[i];
      }
    }
    return best === -Infinity ? 0 : best;
  }

  /** Lowest ceiling over a box of half-size r centred at (x, y), ignoring solid tiles. */
  ceilAt(x, y, r = 0) {
    let best = Infinity;
    const x0 = Math.floor(x - r);
    const x1 = Math.floor(x + r);
    const y0 = Math.floor(y - r);
    const y1 = Math.floor(y + r);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        if (!this.inBounds(tx, ty)) continue;
        const i = ty * this.w + tx;
        if (this.flags[i] & F_SOLID) continue;
        if (this.ceilZ[i] < best) best = this.ceilZ[i];
      }
    }
    return best === Infinity ? 1 : best;
  }

  tilesWithTag(name) {
    return this.tags.get(name) ?? [];
  }
}
