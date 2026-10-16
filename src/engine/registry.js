/**
 * The registry holds every piece of content for a game, indexed by id. It is
 * built from a "content pack" object (see src/content/index.js) and is pure
 * data, so Node tools and tests can load it too.
 */
export class Registry {
  constructor(pack) {
    this.game = { id: 'game', title: 'GAME', ...(pack.game ?? {}) };
    this.paletteDef = pack.palette;
    this.strings = pack.strings ?? {};
    this.hero = pack.hero ?? null;
    this.config = pack.config ?? {};
    this.errors = [];

    this.textures = new Map();
    this.models = new Map();
    this.sheets = new Map();
    this.images = new Map();
    this.fonts = new Map();
    this.ammo = new Map();
    this.weapons = new Map();
    this.things = new Map();
    this.sounds = new Map();
    this.particles = new Map();
    this.songs = new Map();
    this.levels = new Map();
    this.episodes = new Map();
    this.cheats = [];
    this.actions = new Map();
    this.attacks = new Map();
    this.pickups = new Map();

    this._addAll(pack.textures, this.textures, 'texture');
    this._addAll(pack.models, this.models, 'model');
    this._addAll(pack.sheets, this.sheets, 'sheet');
    this._addAll(pack.images, this.images, 'image');
    this._addAll(pack.fonts, this.fonts, 'font');
    this._addAll(pack.ammo, this.ammo, 'ammo');
    this._addAll(pack.weapons, this.weapons, 'weapon');
    this._addAll(pack.things, this.things, 'thing');
    this._addAll(pack.sounds, this.sounds, 'sound');
    this._addAll(pack.particles, this.particles, 'particle');
    this._addAll(pack.songs, this.songs, 'song');
    this._addAll(pack.levels, this.levels, 'level');
    this._addAll(pack.episodes, this.episodes, 'episode');
    this.cheats = [...(pack.cheats ?? [])];
    for (const a of pack.actions ?? []) this.actions.set(a.name, a.fn);
    for (const a of pack.attacks ?? []) this.attacks.set(a.name, a.fn);
    for (const p of pack.pickups ?? []) this.pickups.set(p.name, p.fn);

    // Inline sprite sheets on things/weapons/hero become registered sheets.
    for (const t of this.things.values()) this._inlineSheet(t);
    for (const w of this.weapons.values()) this._inlineSheet(w);
    if (this.hero?.face?.sheet) this.hero.face.sheet = this._inlineSheetSpec(this.hero.face.sheet, 'hero:face');

    // Glyph legends: shared tiles + shared things + each thing's own glyph.
    this.tileLegend = { ...(pack.legend?.tiles ?? {}) };
    this.thingLegend = { ...(pack.legend?.things ?? {}) };
    for (const t of this.things.values()) {
      if (!t.glyph) continue;
      const existing = this.thingLegend[t.glyph];
      const existingType = typeof existing === 'string' ? existing : existing?.type;
      if (existing && existingType !== t.id) {
        this.errors.push(`Thing glyph "${t.glyph}" is used by both "${existingType}" and "${t.id}"`);
      } else {
        this.thingLegend[t.glyph] = t.id;
      }
    }
  }

  _addAll(list, map, kind) {
    for (const def of list ?? []) {
      if (!def || !def.id) {
        this.errors.push(`A ${kind} definition is missing its id`);
        continue;
      }
      if (map.has(def.id)) this.errors.push(`Duplicate ${kind} id "${def.id}"`);
      map.set(def.id, def);
    }
  }

  _inlineSheetSpec(sheet, id) {
    if (!sheet) return null;
    if (sheet.ref) return sheet;
    const sid = sheet.id ?? id;
    if (!this.sheets.has(sid)) {
      this.sheets.set(sid, { type: 'sheet', id: sid, src: sheet.src, frameWidth: sheet.frameWidth, frameHeight: sheet.frameHeight, glint: sheet.glint, glow: sheet.glow });
    }
    return { ref: sid };
  }

  _inlineSheet(def) {
    if (def.sheet) def.sheet = this._inlineSheetSpec(def.sheet, def.sheet.id ?? def.sheet.ref ?? def.id);
  }

  /** Thing definition by id (throws with a readable message when missing). */
  thing(id) {
    const t = this.things.get(id);
    if (!t) throw new Error(`Unknown thing "${id}"`);
    return t;
  }

  /** Look up a string with {placeholders}. */
  text(key, vars = {}) {
    const s = this.strings[key];
    if (typeof s !== 'string') return key;
    return s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? String(vars[k]) : `{${k}}`));
  }

  /** Levels of an episode in order. */
  episodeLevels(episodeId) {
    const ep = this.episodes.get(episodeId);
    return ep ? ep.levels.map((id) => this.levels.get(id)).filter(Boolean) : [];
  }

  firstEpisode() {
    return this.episodes.values().next().value ?? null;
  }
}
