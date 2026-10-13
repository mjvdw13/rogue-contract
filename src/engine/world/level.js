import { TileMap, Door, F_SOLID, F_DOOR, F_SKY, F_SECRET, F_DAMAGE, F_EXIT, F_USE, F_VOID, F_SLANT, F_SLAB, LIGHT_FX, EDGES, EDGE_DX, EDGE_DY, OPPOSITE } from './tilemap.js';
import { buildLifts } from './lifts.js';
import { Slant, slantLine } from './slants.js';
import { addSources } from './lightsources.js';
import { makeDecal, addDecal } from './decals.js';
import { checkBackdrop } from './backdrop.js';

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
  /**
   * A glyph's `bands: [{ from?, to?, tex }]`: its wall's texture changes with
   * height (a band covers from `from` up to `to`, open-ended without one;
   * the first band that covers a height wins), and so do the faces of its
   * raised floor and lowered ceiling (a doorway's lintel). One set per glyph.
   */
  const bandSets = new Map();
  const bandSet = (glyph, bands) => {
    if (bandSets.has(glyph)) return bandSets.get(glyph);
    const set = [];
    for (const b of [].concat(bands)) {
      const where = `Tile glyph "${glyph}"`;
      if (!b?.tex) {
        errors.push(`${where}: a wall band needs a "tex"`);
        continue;
      }
      if ((b.from !== undefined && typeof b.from !== 'number') || (b.to !== undefined && typeof b.to !== 'number') || (b.from === undefined && b.to === undefined)) {
        errors.push(`${where}: a wall band needs a "from" or a "to" height (or both)`);
        continue;
      }
      if (b.from !== undefined && b.to !== undefined && !(b.to > b.from)) {
        errors.push(`${where}: a wall band's "to" must be above its "from"`);
        continue;
      }
      set.push({ from: b.from ?? -Infinity, to: b.to ?? Infinity, tex: slot(b.tex) });
    }
    const k = set.length ? map.bandSets.push(set) - 1 : -1;
    bandSets.set(glyph, k);
    return k;
  };
  /** A legend entry's `fence: { tex, edges, height? }` on tile i. */
  const addFence = (spec, x, y, i) => {
    const where = `Tile (${x}, ${y})`;
    if (map.flags[i] & (F_SOLID | F_DOOR)) return errors.push(`${where}: a fence needs an open tile, not a wall or door`);
    const edges = String(spec.edges ?? '').toUpperCase();
    if (!edges || [...edges].some((c, k) => !EDGES.includes(c) || edges.indexOf(c) !== k)) {
      return errors.push(`${where}: fence "edges" must be letters from NESW, like 'N' or 'NE' (got "${spec.edges}")`);
    }
    if (!spec.tex) return errors.push(`${where}: a fence needs a "tex"`);
    if (spec.height !== undefined && !(spec.height > 0)) return errors.push(`${where}: fence "height" must be above 0`);
    const k = map.fences.length;
    map.fences.push({ tex: slot(spec.tex), height: spec.height ?? 0, tile: i });
    for (const c of edges) map.fenceAt[i * 4 + EDGES.indexOf(c)] = k;
  };
  /**
   * A legend entry's `slab: { bottom, top, floor?, ceiling?, side?, light? }` on
   * tile i: a solid layer inside the tile's open space, with a storey under it
   * and one on top. Its textures default to the tile's floor (top), ceiling
   * (underside) and side (edges); `light` is the lower storey's light.
   */
  const addSlab = (spec, e, x, y, i, tex) => {
    const where = `Tile (${x}, ${y})`;
    if (map.flags[i] & (F_SOLID | F_DOOR | F_SLANT) || e.lift) return errors.push(`${where}: a slab needs an open tile, not a wall, door, lift or angled wall`);
    const { bottom, top } = spec;
    if (typeof bottom !== 'number' || typeof top !== 'number') return errors.push(`${where}: a slab needs "bottom" and "top" heights`);
    if (!(top > bottom)) return errors.push(`${where}: a slab's top must be above its bottom`);
    if (!(bottom > map.floorZ[i])) return errors.push(`${where}: a slab's bottom must be above the floor (${map.floorZ[i]}), or there's no storey under it`);
    if (!(top < map.ceilZ[i])) return errors.push(`${where}: a slab's top must be below the ceiling (${map.ceilZ[i]}), or there's no storey on it`);
    map.flags[i] |= F_SLAB;
    map.slabBot[i] = bottom;
    map.slabTop[i] = top;
    const topTex = spec.floor ?? tex.floor;
    const underTex = spec.ceiling ?? (tex.ceiling === 'sky' ? null : tex.ceiling) ?? topTex;
    const sideTex = spec.side ?? tex.side ?? topTex;
    if (topTex) map.slabTopTex[i] = slot(topTex);
    if (underTex) map.slabUnderTex[i] = slot(underTex);
    if (sideTex) map.slabSideTex[i] = slot(sideTex);
    if (spec.light !== undefined) map.belowLight[i] = spec.light - map.baseLight[i];
  };
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
      if (e.bands) map.bandIndex[i] = bandSet(glyph, e.bands);
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
      if (e.fence) addFence(e.fence, x, y, i);
      if (e.slab) addSlab(e.slab, e, x, y, i, { floor, ceiling, side });
    }
  }

  // Fences are seen and collided with from both sides: mirror each onto the neighbour.
  map.fences.forEach((f, k) => {
    const x = f.tile % w;
    const y = (f.tile / w) | 0;
    for (let edge = 0; edge < 4; edge++) {
      if (map.fenceAt[f.tile * 4 + edge] !== k) continue;
      const nx = x + EDGE_DX[edge];
      const ny = y + EDGE_DY[edge];
      const n = ny * w + nx;
      if (!map.inBounds(nx, ny) || map.flags[n] & (F_SOLID | F_VOID)) {
        errors.push(`Tile (${x}, ${y}): its fence on the ${EDGES[edge]} edge stands against a wall`);
        continue;
      }
      if (map.fenceAt[n * 4 + OPPOSITE[edge]] < 0) map.fenceAt[n * 4 + OPPOSITE[edge]] = k;
    }
  });

  // Doorways are usually several tiles wide: neighbouring door tiles of the
  // same door (the same door texture, style, lock and tag) form one door
  // (`group`) that opens and closes together. Their other fields may differ,
  // say a different lintel (`upper`) on each side.
  const doorKey = (i) => {
    const e = legend[glyphAt[i]];
    return [e.door, e.style, e.lock, e.tag, e.secret, e.jamb].join('|');
  };
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
        if (n && !n.group && doorKey(map.index(nx, ny)) === doorKey(map.index(d.x, d.y))) {
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
  // Where each panel stands. Sliding and split doors: through their tile's
  // centre. Rising doors: across the middle of the doorway's depth, so they
  // sit back from both faces. `span` is the doorway's extent across.
  for (const d of map.doors) {
    const along = (t) => (d.axis === 'x' ? t.x : t.y);
    const across = (t) => (d.axis === 'x' ? t.y : t.x);
    d.plane = d.style === 'rise' ? (Math.min(...d.group.map(along)) + Math.max(...d.group.map(along)) + 1) / 2 : along(d) + 0.5;
    d.span0 = Math.min(...d.group.map(across));
    d.span1 = Math.max(...d.group.map(across)) + 1;
  }

  // Door tiles without their own floor texture borrow a neighbour's. A rising
  // door's tiles are the recess it stands in: their ceiling is the top of the
  // opening, the door's own ceilZ if the legend gave one, else the lowest
  // ceiling beside them (so there's no lintel). The lintel face above the
  // opening is the tile's `upper` texture.
  for (const d of map.doors) {
    const i = map.index(d.x, d.y);
    // (Other door tiles don't count: their ceilings come down as they close.)
    const around = [[d.x + 1, d.y], [d.x - 1, d.y], [d.x, d.y + 1], [d.x, d.y - 1]]
      .filter(([nx, ny]) => map.inBounds(nx, ny) && !(map.flags[map.index(nx, ny)] & (F_SOLID | F_DOOR)))
      .map(([nx, ny]) => map.index(nx, ny));
    if (map.floorTex[i] < 0) map.floorTex[i] = around.map((n) => map.floorTex[n]).find((t) => t >= 0) ?? -1;
    d.floorZ = map.floorZ[i];
    if (d.style !== 'rise') continue;
    // (Beside a slab tile, the ceiling of the storey the doorway opens onto.)
    const ceilBeside = (n) => map.storeyCeil(n, map.storeyAt(n, d.floorZ + 0.5));
    d.openZ = !explicitCeil[i] && around.length ? Math.min(...around.map(ceilBeside)) : map.ceilZ[i];
    if (map.ceilTex[i] < 0) map.ceilTex[i] = d.jamb >= 0 ? d.jamb : d.tex;
    // The lintel above the opening (when a neighbour's ceiling is higher).
    if (map.upperTex[i] < 0) map.upperTex[i] = d.jamb >= 0 ? d.jamb : d.tex;
    map.ceilZ[i] = d.openZ;
  }

  buildLifts(map, glyphAt, legend);

  // Tiles sharing a glyph and light effect flicker together, like a Doom
  // sector. Tiles with the same `lightSync` name (and effect) do too,
  // wherever they are, each keeping its own light and range.
  let groups = 0;
  const synced = new Map();
  /** The group of a light effect with a sync name (a new one without). */
  const groupOf = (sync, fx) => {
    if (!sync) return groups++;
    const key = `${sync}|${fx}`;
    if (!synced.has(key)) synced.set(key, groups++);
    return synced.get(key);
  };
  for (let i = 0; i < w * h; i++) {
    if (!map.lightFx[i] || map.lightGroup[i] >= 0) continue;
    const sync = legend[glyphAt[i]]?.lightSync;
    if (sync) {
      map.lightGroup[i] = groupOf(sync, map.lightFx[i]);
      continue;
    }
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
  // Light sources, baked now (with the doors shut), in groups like the tiles.
  errors.push(...addSources(map, level.lights, groupOf));
  errors.push(...checkBackdrop(level.backdrop));
  // Decals on wall and step faces.
  (level.decals ?? []).forEach((spec, k) => {
    const d = makeDecal(map, spec, slot);
    if (typeof d === 'string') errors.push(`Decal ${k + 1}${spec.tex ? ` ("${spec.tex}")` : ''} ${d}`);
    else addDecal(map, d);
  });
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
      // Extra drops for this one monster (on top of its type's): a keycard an officer carries.
      drops: spec.drops ? spec.drops.map((d) => (typeof d === 'string' ? { item: d, chance: 1 } : { chance: 1, ...d })) : null,
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
      playerStart = { x: item.x, y: item.y, angle: contentAngle(item.angle ?? 90), z: item.z ?? null };
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
