import { IndexedImage, quantize, loadImageElement, readPixels } from './gfx/image.js';
import { Sheet } from './gfx/sheet.js';
import { BitmapFont } from './gfx/font.js';
import { Model } from './gfx/model.js';

/** A wall/flat/sky texture ready for the renderer. Animated textures cycle frames. */
export class Texture {
  constructor(id, image, { frames = 1, fps = 4, sky = false } = {}) {
    this.id = id;
    this.sky = sky;
    this.fps = fps;
    const fw = Math.floor(image.width / Math.max(1, frames));
    this.w = fw;
    this.h = image.height;
    this.wMask = (fw & (fw - 1)) === 0 ? fw - 1 : -1;
    this.hMask = (this.h & (this.h - 1)) === 0 ? this.h - 1 : -1;
    this.frames = [];
    for (let f = 0; f < Math.max(1, frames); f++) {
      const px = new Uint8Array(fw * this.h);
      const cm = new Uint8Array(fw * this.h);
      for (let y = 0; y < this.h; y++) {
        for (let x = 0; x < fw; x++) {
          const c = image.pixels[y * image.width + f * fw + x];
          px[y * fw + x] = c;
          cm[x * this.h + y] = c;
        }
      }
      this.frames.push({ px, cm });
    }
    this.cur = this.frames[0].px;
    this.curCM = this.frames[0].cm;
  }

  animate(time) {
    const n = this.frames.length;
    if (n < 2) return;
    const f = this.frames[Math.floor(time * this.fps) % n];
    this.cur = f.px;
    this.curCM = f.cm;
  }
}

/**
 * Loads every image the content references, converts it to the palette and
 * builds textures, sprite sheets, fonts and UI images. Missing files become
 * checkerboard placeholders (and a console warning) instead of crashing.
 */
export class Assets {
  /**
   * @param {import('./registry.js').Registry} registry
   * @param {import('./gfx/palette.js').Palette} palette
   */
  constructor(registry, palette) {
    this.registry = registry;
    this.palette = palette;
    this.images = new Map(); // src -> IndexedImage
    this.textures = []; // slot -> Texture
    this.textureSlots = new Map(); // id -> slot
    this.sheets = new Map(); // id -> Sheet
    this.fonts = new Map(); // id -> BitmapFont
    this.ui = new Map(); // id -> IndexedImage
    this.models = new Map(); // id -> Model
    this.problems = [];
    this.animated = [];
  }

  placeholder(w = 64, h = 64) {
    return IndexedImage.placeholder(w, h, this.palette.ramp('flesh', 0.7), this.palette.ramp('gray', 0.1));
  }

  async _loadImage(src, opts = {}) {
    try {
      const img = await loadImageElement(src);
      return quantize(readPixels(img), this.palette, opts);
    } catch (err) {
      this.problems.push(String(err.message ?? err));
      console.warn(err);
      return null;
    }
  }

  /**
   * Art overrides: `assets/custom/overrides.json` maps an asset path to a
   * replacement, `{ src, frameWidth?, frameHeight?, scale? }`. The committed
   * file swaps in the Dark Forces sheets, on the hosted site too. Skipped
   * under test automation, so tests see the generated art.
   */
  async _loadOverrides() {
    this.overrides = {};
    if (globalThis.navigator?.webdriver) return;
    try {
      const res = await fetch('assets/custom/overrides.json', { cache: 'no-store' });
      if (res.ok) this.overrides = await res.json();
    } catch {
      // No overrides.
    }
    for (const [from, to] of Object.entries(this.overrides)) console.info(`Art override: ${from} -> ${to.src}`);
  }

  /** Load everything. `onProgress(done, total)` drives the loading bar. */
  async loadAll(onProgress = () => {}) {
    const reg = this.registry;
    await this._loadOverrides();
    const srcs = new Set();
    for (const t of reg.textures.values()) srcs.add(t.src);
    for (const s of reg.sheets.values()) if (s.src) srcs.add(s.src);
    for (const f of reg.fonts.values()) srcs.add(f.src);
    for (const i of reg.images.values()) srcs.add(i.src);
    const list = [...srcs].filter(Boolean);
    // Textures that never glow (`fullbright: false`: rock, sand) snap to lit colours only.
    const litOnly = new Set([...reg.textures.values()].filter((t) => t.fullbright === false).map((t) => t.src));
    // Sprite sheets can list glint and glow colours (an override's replace the sheet's).
    const sheetOf = new Map([...reg.sheets.values()].filter((s) => s.src).map((s) => [s.src, s]));
    const opts = (src, o) => ({ litOnly: litOnly.has(src), glint: o?.glint, glow: o?.glow });
    let done = 0;
    const total = list.length;
    onProgress(0, total);
    const queue = [...list];
    const workers = Array.from({ length: 8 }, async () => {
      while (queue.length) {
        const src = queue.shift();
        let img = null;
        if (this.overrides[src]) {
          // A missing override (say, a file only on someone's own computer) falls back to the committed art.
          img = await this._loadImage(this.overrides[src].src, opts(src, { ...sheetOf.get(src), ...this.overrides[src] }));
          if (!img) delete this.overrides[src];
        }
        this.images.set(src, img ?? (await this._loadImage(src, opts(src, sheetOf.get(src)))));
        done++;
        onProgress(done, total);
      }
    });
    await Promise.all(workers);
    this._build();
  }

  /** Load only fonts (so the loading screen can draw text). */
  async loadFonts() {
    for (const f of this.registry.fonts.values()) {
      if (!this.images.has(f.src)) this.images.set(f.src, await this._loadImage(f.src));
    }
    this._buildFonts();
  }

  _buildFonts() {
    for (const f of this.registry.fonts.values()) {
      const img = this.images.get(f.src);
      if (img) this.fonts.set(f.id, new BitmapFont(img, f));
    }
  }

  _build() {
    const reg = this.registry;
    // Slot 0 is the "missing texture" checkerboard.
    this.textures = [new Texture('__missing', this.placeholder())];
    this.textureSlots = new Map();
    for (const t0 of reg.textures.values()) {
      // An override can change the frame count (a still picture over an animated texture).
      const t = { ...t0, ...this.overrides?.[t0.src] };
      const img = this.images.get(t0.src) ?? this.placeholder(64 * (t.frames ?? 1), 64);
      const tex = new Texture(t.id, img, t);
      if (!t.sky && (tex.wMask < 0 || tex.hMask < 0)) {
        this.problems.push(`Texture "${t.id}" must be a power-of-two size (is ${tex.w}x${tex.h})`);
      }
      this.textureSlots.set(t.id, this.textures.length);
      this.textures.push(tex);
      if (tex.frames.length > 1) this.animated.push(tex);
    }
    for (const s of reg.sheets.values()) {
      const o = { ...s, ...this.overrides?.[s.src] };
      const img = this.images.get(s.src) ?? this.placeholder(o.frameWidth || 32, o.frameHeight || 32);
      const sheet = new Sheet(img, o.frameWidth || img.height, o.frameHeight || img.height);
      sheet.scale = o.scale ?? 1;
      this.sheets.set(s.id, sheet);
    }
    for (const m of reg.models?.values() ?? []) this.models.set(m.id, new Model(m, this.palette, (id) => this.textureSlot(id), this.textures));
    this._buildFonts();
    for (const i of reg.images.values()) {
      this.ui.set(i.id, this.images.get(i.src) ?? this.placeholder(32, 32));
    }
  }

  /** Renderer slot for a texture id (0 = missing). */
  textureSlot(id) {
    const slot = this.textureSlots.get(id);
    if (slot === undefined) {
      this.problems.push(`Unknown texture "${id}"`);
      return 0;
    }
    return slot;
  }

  /** The prepared 3D model for a thing definition's `model` id, or null. */
  modelFor(def) {
    return (def?.model && this.models.get(def.model)) || null;
  }

  /** Sprite sheet for a thing/weapon definition's `sheet` reference. */
  sheetFor(def) {
    const ref = def?.sheet?.ref;
    return (ref && this.sheets.get(ref)) || null;
  }

  font(id) {
    return this.fonts.get(id) ?? this.fonts.values().next().value ?? null;
  }

  image(id) {
    return this.ui.get(id) ?? null;
  }

  /** Advance animated textures. */
  animate(time) {
    for (const t of this.animated) t.animate(time);
  }
}
