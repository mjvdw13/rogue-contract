import { TileMap, Door, F_SOLID, F_DOOR, F_SKY, F_SECRET, F_DAMAGE, F_EXIT, F_USE, F_VOID, F_SLANT, LIGHT_FX } from './tilemap.js';
import { buildLifts } from './lifts.js';
import { Slant, slantLine } from './slants.js';

/** Glyphs in the `things` layer that place the player start, with facing. */
export const PLAYER_START_GLYPHS = { '^': 90, '>': 0, v: 270, '<': 180 };

const COMPASS = { E: 0, NE: 45, N: 90, NW: 135, W: 180, SW: 225, S: 270, SE: 315 };

/**
 * Convert a content angle to radians. Content angles are in degrees with
 * 0 = east and 90 = north (up on the ASCII map), or compass strings 'N', 'SE'...
 * Internally the map's y axis points down, so angles run clockwise.
 */
export function contentAngle(a) {
  if (a === undefined || a === null) return 0;
  const deg = typeof a === 'string' ? (COMPASS[a.toUpperCase()] ?? 0) : Number(a);
  return (-deg * Math.PI) / 180;
}

/** Merge the shared legend with the level's overrides and resolve `base:` inheritance. */
export function resolveLegend(registry, level) {
  const raw = { ...(registry.tileLegend ?? {}), ...(level.legend ?? {}) };
  const resolved = {};
  const resolve = (glyph, depth) => {
    if (resolved[glyph]) return resolved[glyph];
    const entry = raw[glyph];
    if (!entry) return null;
    if (depth > 10) throw new Error(`Legend glyph "${glyph}" has a circular "base"`);
    let out = { ...entry };
    if (entry.base !== undefined) {
      const parent = resolve(entry.base, depth + 1);
      if (!parent) throw new Error(`Legend glyph "${glyph}" has unknown base "${entry.base}"`);
      out = { ...parent, ...entry };
      delete out.base;
    }
    resolved[glyph] = out;
    return out;
  };
  for (const g of Object.keys(raw)) resolve(g, 0);
  const things = { ...(registry.thingLegend ?? {}), ...(level.thingLegend ?? {}) };
  return { tiles: resolved, things };
}

function normalizeSpawn(entry) {
  if (typeof entry === 'string') return { type: entry };
  return { ...entry };
}

function skillSet(skill) {
  if (skill === undefined || skill === null) return null;
  if (Array.isArray(skill)) return new Set(skill);
  if (typeof skill === 'object') {
    const s = new Set();
    for (let i = skill.min ?? 1; i <= (skill.max ?? 5); i++) s.add(i);
    return s;
  }
  return new Set([skill]);
}

/**
 * Parse a level definition into runtime data.
 * @param {*} registry content registry (needs tileLegend/thingLegend)
 * @param {*} level a defineLevel() result
 * @param {{skill?: number, textureSlot?: (id:string)=>number}} [opts]
 */
export function buildLevel(registry, level, opts = {}) {
  const skill = opts.skill ?? 3;
  const slot = opts.textureSlot ?? (() => 0);
  const { tiles: legend, things: thingLegend } = resolveLegend(registry, level);
  const defaults = { floor: undefined, ceiling: undefined, light: 160, ...(level.defaults ?? {}) };
  const step = level.heightStep ?? 0.25;
  const base = level.heightBase ?? 0;
  /** A height from a `floorHeights` / `ceilHeights` grid: 0-9 then a-z count steps; space or '.' means "use the legend". */
  const heightOverride = (grid, x, y) => {
    const ch = grid?.[y]?.[x];
    if (ch === undefined || ch === ' ' || ch === '.') return undefined;
    const n = parseInt(ch, 36);
    if (Number.isNaN(n)) {
      errors.push(`Bad height "${ch}" at (${x}, ${y}) (use 0-9 and a-z)`);
      return undefined;
    }
    return base + n * step;
  };
  const rows = level.tiles;
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  const map = new TileMap(w, h);
  const errors = [];
  const spawns = [];
  let playerStart = null;
  const glyphAt = new Array(w * h);
  const explicitCeil = new Uint8Array(w * h);

  const tagIndex = (name) => {
    let idx = map.tagNames.indexOf(name);
    if (idx < 0) {
      idx = map.tagNames.length;
      map.tagNames.push(name);
      map.tags.set(name, []);
    }
    return idx;
  };

  const badFx = new Set();
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const glyph = rows[y][x] ?? ' ';
      const i = y * w + x;
      glyphAt[i] = glyph;
      if (glyph === ' ') {
        map.flags[i] = F_SOLID | F_VOID;
        continue;
      }
      const e = legend[glyph];
      if (!e) {
        errors.push(`Unknown tile glyph "${glyph}" at (${x}, ${y})`);
        map.flags[i] = F_SOLID | F_VOID;
        continue;
      }
      const light = e.light ?? defaults.light;
      map.baseLight[i] = light;
      map.light[i] = light;
      map.lightFx[i] = LIGHT_FX[e.lightFx ?? 'none'] ?? 0;
      if (e.lightFx && LIGHT_FX[e.lightFx] === undefined && !badFx.has(glyph)) {
        badFx.add(glyph);
        errors.push(`Tile glyph "${glyph}" has unknown lightFx "${e.lightFx}"`);
      }
      map.lightMin[i] = e.lightMin ?? 0;
      const floor = e.floor ?? defaults.floor;
      const ceiling = e.ceiling ?? defaults.ceiling;
      if (floor) map.floorTex[i] = slot(floor);
      if (ceiling === 'sky') map.flags[i] |= F_SKY;
      else if (ceiling) map.ceilTex[i] = slot(ceiling);
      map.floorZ[i] = heightOverride(level.floorHeights, x, y) ?? e.floorZ ?? defaults.floorZ ?? 0;
      const ceilOverride = heightOverride(level.ceilHeights, x, y) ?? e.ceilZ;
      map.ceilZ[i] = ceilOverride ?? defaults.ceilZ ?? 2;
      if (e.door && ceilOverride !== undefined) explicitCeil[i] = 1;
      // Step faces: a raised floor shows its `side`, a lowered ceiling its `upper`.
      const side = e.side ?? defaults.side ?? floor;
      const upper = e.upper ?? e.side ?? defaults.upper ?? defaults.side ?? (ceiling === 'sky' ? null : ceiling);
      if (side) map.sideTex[i] = slot(side);
      if (upper) map.upperTex[i] = slot(upper);
      if (map.ceilZ[i] < map.floorZ[i]) errors.push(`Tile (${x}, ${y}) has its ceiling below its floor`);

      if (e.wall && (e.diagonal !== undefined || e.line !== undefined)) {
        // An angled wall: the tile stays open floor on one side of the line.
        const line = slantLine(e);
        if (typeof line === 'string') errors.push(`Tile (${x}, ${y}): ${line}`);
        else {
          map.flags[i] |= F_SLANT;
          map.slantIndex[i] = map.slants.length;
          map.slants.push(new Slant(line, x, y, slot(e.wall)));
        }
      } else if (e.wall) {
        map.flags[i] |= F_SOLID;
        map.wallTex[i] = slot(e.wall);
        if (e.use) {
          map.flags[i] |= F_USE;
          map.uses.set(i, {
            actions: [].concat(e.use).map((a) => (typeof a === 'string' ? { action: a } : a)),
            switchTo: e.switchTo ? slot(e.switchTo) : -1,
            repeat: !!e.repeat,
            sound: e.useSound,
            used: false,
          });
        }
      } else if (e.door) {
        map.flags[i] |= F_DOOR;
        map.doorIndex[i] = map.doors.length;
        map.doors.push(
          new Door({
            x,
            y,
            tex: slot(e.door),
            jamb: e.jamb ? slot(e.jamb) : -1,
            lock: e.lock ?? null,
            style: e.style,
            secret: e.secret,
            stayOpen: e.stayOpen ?? e.secret,
            tag: e.tag ?? null,
            speed: e.speed,
            wait: e.wait,
            sounds: e.sounds,
          }),
        );
      } else {
        if (e.damage) {
          map.flags[i] |= F_DAMAGE;
          map.damage[i] = e.damage;
        }
        if (e.secret) map.flags[i] |= F_SECRET;
        if (e.exit) map.flags[i] |= F_EXIT;
      }
      if (e.tag) {
        const t = tagIndex(e.tag);
        map.tag[i] = t;
        map.tags.get(e.tag).push(i);
      }
    }
  }

  // Doorways are usually several tiles wide: neighbouring door tiles drawn
  // with the same glyph form one door (`group`) that opens and closes together.
  for (const d of map.doors) {
    if (d.group) continue;
    const group = [];
    const stack = [d];
    d.group = group;
    while (stack.length) {
      const c = stack.pop();
      group.push(c);
      for (const [nx, ny] of [[c.x + 1, c.y], [c.x - 1, c.y], [c.x, c.y + 1], [c.x, c.y - 1]]) {
        const n = map.doorAt(nx, ny);
        if (n && !n.group && glyphAt[map.index(nx, ny)] === glyphAt[map.index(d.x, d.y)]) {
          n.group = group;
          stack.push(n);
        }
      }
    }
  }

  // Door orientation: the panel spans the gap between the two walls beside the
  // doorway (looking across the door's other tiles).
  const isDoorOf = (d, x, y) => d.group.includes(map.doorAt(x, y));
  const wallPast = (d, dx, dy) => {
    let x = d.x + dx;
    let y = d.y + dy;
    while (map.inBounds(x, y) && isDoorOf(d, x, y)) {
      x += dx;
      y += dy;
    }
    return !map.inBounds(x, y) || (map.flags[map.index(x, y)] & F_SOLID) !== 0;
  };
  for (const d of map.doors) {
    if (wallPast(d, 0, -1) && wallPast(d, 0, 1)) d.axis = 'x';
    else if (wallPast(d, -1, 0) && wallPast(d, 1, 0)) d.axis = 'y';
    else errors.push(`Door at (${d.x}, ${d.y}) needs walls on two opposite sides`);
  }

  // Door tiles without their own floor texture borrow a neighbour's. Rising
  // doors start closed: their ceiling sits on the floor, and the renderer
  // draws the door texture on the face under it. They open to their own ceilZ if the legend gave one,
  // else to the lowest ceiling beside them (so there's no lintel).
  for (const d of map.doors) {
    const i = map.index(d.x, d.y);
    // (Other door tiles don't count: their ceilings come down as they close.)
    const around = [[d.x + 1, d.y], [d.x - 1, d.y], [d.x, d.y + 1], [d.x, d.y - 1]]
      .filter(([nx, ny]) => map.inBounds(nx, ny) && !(map.flags[map.index(nx, ny)] & (F_SOLID | F_DOOR)))
      .map(([nx, ny]) => map.index(nx, ny));
    if (map.floorTex[i] < 0) map.floorTex[i] = around.map((n) => map.floorTex[n]).find((t) => t >= 0) ?? -1;
    if (d.style !== 'rise') continue;
    d.openZ = !explicitCeil[i] && around.length ? Math.min(...around.map((n) => map.ceilZ[n])) : map.ceilZ[i];
    if (map.ceilTex[i] < 0) map.ceilTex[i] = d.tex;
    // The lintel above the opening (when a neighbour's ceiling is higher).
    if (map.upperTex[i] < 0) map.upperTex[i] = d.jamb >= 0 ? d.jamb : d.tex;
    map.ceilZ[i] = map.floorZ[i];
  }

  buildLifts(map, glyphAt, legend);

  // Tiles sharing a glyph and light effect flicker together, like a Doom sector.
  let groups = 0;
  for (let i = 0; i < w * h; i++) {
    if (!map.lightFx[i] || map.lightGroup[i] >= 0) continue;
    const g = groups++;
    const stack = [i];
    map.lightGroup[i] = g;
    while (stack.length) {
      const c = stack.pop();
      const cx = c % w;
      const cy = (c / w) | 0;
      for (const [nx, ny] of [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]]) {
        if (!map.inBounds(nx, ny)) continue;
        const n = ny * w + nx;
        if (map.lightGroup[n] < 0 && map.lightFx[n] === map.lightFx[i] && glyphAt[n] === glyphAt[i]) {
          map.lightGroup[n] = g;
          stack.push(n);
        }
      }
    }
  }
  map.lightGroupCount = groups;

  // Things overlay.
  const addSpawn = (spec, x, y, where) => {
    const skills = skillSet(spec.skill);
    if (skills && !skills.has(skill)) return;
    if (!spec.type) {
      errors.push(`Thing ${where} has no "type"`);
      return;
    }
    spawns.push({
      type: spec.type,
      x,
      y,
      angle: contentAngle(spec.angle ?? 270),
      ambush: !!spec.ambush,
      tag: spec.tag ?? null,
      z: spec.z ?? null,
    });
  };

  if (level.things) {
    for (let y = 0; y < level.things.length; y++) {
      const row = level.things[y];
      for (let x = 0; x < row.length; x++) {
        const ch = row[x];
        if (ch === ' ' || ch === '.') continue;
        if (PLAYER_START_GLYPHS[ch] !== undefined) {
          playerStart = { x: x + 0.5, y: y + 0.5, angle: contentAngle(PLAYER_START_GLYPHS[ch]) };
          continue;
        }
        const entry = thingLegend[ch];
        if (!entry) {
          errors.push(`Unknown thing glyph "${ch}" at (${x}, ${y})`);
          continue;
        }
        addSpawn(normalizeSpawn(entry), x + 0.5, y + 0.5, `"${ch}" at (${x}, ${y})`);
      }
    }
  }
  for (const item of level.list ?? []) {
    if (item.type === 'player') {
      playerStart = { x: item.x, y: item.y, angle: contentAngle(item.angle ?? 90) };
      continue;
    }
    addSpawn(item, item.x, item.y, `in list at (${item.x}, ${item.y})`);
  }
  if (!playerStart) errors.push('Level has no player start (put ^ > v or < in the things grid)');
  else {
    const px = Math.floor(playerStart.x);
    const py = Math.floor(playerStart.y);
    if (map.blocks(px, py)) errors.push(`Player start (${px}, ${py}) is inside a wall`);
  }

  return { map, spawns, playerStart, errors, legend, glyphAt };
}
