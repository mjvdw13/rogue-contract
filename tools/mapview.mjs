#!/usr/bin/env node
// Renders levels as top-down PNGs for checking layouts:
//
//   node tools/mapview.mjs                 every level -> tools/art/out/maps/<id>.png
//   node tools/mapview.mjs e1m2 --skill 5  one level, things for skill 5
//   node tools/mapview.mjs --scale 12      bigger tiles
//
// Walls and floors use their texture's average colour (angled walls fill the
// solid side of their tile) (floors are dimmed by
// their light level). Doors are brown, or the colour of their key; switches
// have a yellow border; secret tiles are dotted purple; damaging floors are
// striped green. Monsters are red squares, coworkers green, items yellow,
// keys and weapons bright, decorations grey, the start is a white arrow.
// Areas the player can never reach are cross-hatched.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import content from '../src/content/index.js';
import { Registry } from '../src/engine/registry.js';
import { F_SOLID, F_DOOR, F_SKY, F_SECRET, F_DAMAGE, F_EXIT, F_USE, F_VOID, F_SLANT } from '../src/engine/world/tilemap.js';
import { decodePNG, encodePNG } from './art/lib/png.js';
import { analyseLevel } from './lib/levelcheck.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (name, def) => (args.includes(name) ? args[args.indexOf(name) + 1] : def);
const scale = Number(opt('--scale', 8));
const skill = Number(opt('--skill', 3));
const outDir = path.resolve(opt('--out', path.join(root, 'tools/art/out/maps')));
const only = args.filter((a, i) => !a.startsWith('--') && !['--scale', '--skill', '--out'].includes(args[i - 1]));

const reg = new Registry(content);
const avgCache = new Map();
function textureColor(id) {
  if (avgCache.has(id)) return avgCache.get(id);
  let col = [255, 0, 255];
  const t = reg.textures.get(id);
  try {
    const img = decodePNG(fs.readFileSync(path.join(root, t.src)));
    let r = 0;
    let g = 0;
    let b = 0;
    let n = 0;
    const w = Math.min(img.width, 64);
    for (let y = 0; y < img.height; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * img.width + x) * 4;
        if (img.data[i + 3] < 128) continue;
        r += img.data[i];
        g += img.data[i + 1];
        b += img.data[i + 2];
        n++;
      }
    }
    if (n) col = [r / n, g / n, b / n];
  } catch {
    /* missing texture: magenta */
  }
  avgCache.set(id, col);
  return col;
}

const KEY_COLORS = { blue: [60, 110, 255], yellow: [255, 220, 40], red: [255, 40, 40], remote: [150, 150, 150] };

function render(level) {
  const a = analyseLevel(reg, level, skill);
  const { map, spawns, playerStart, legend, glyphAt } = a.built;
  const S = scale;
  const W = map.w * S;
  const H = map.h * S;
  const px = new Uint8Array(W * H * 4);
  const put = (x, y, c) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = (y * W + x) * 4;
    px[i] = Math.max(0, Math.min(255, c[0]));
    px[i + 1] = Math.max(0, Math.min(255, c[1]));
    px[i + 2] = Math.max(0, Math.min(255, c[2]));
    px[i + 3] = 255;
  };
  const rect = (x, y, w, h, c) => {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) put(xx, yy, c);
  };
  const frame = (x, y, w, h, c) => {
    rect(x, y, w, 1, c);
    rect(x, y + h - 1, w, 1, c);
    rect(x, y, 1, h, c);
    rect(x + w - 1, y, 1, h, c);
  };
  for (let ty = 0; ty < map.h; ty++) {
    for (let tx = 0; tx < map.w; tx++) {
      const i = ty * map.w + tx;
      const f = map.flags[i];
      const e = legend[glyphAt[i]] ?? {};
      const x = tx * S;
      const y = ty * S;
      if (f & F_VOID) {
        rect(x, y, S, S, [0, 0, 0]);
        continue;
      }
      if (f & F_DOOR) {
        const d = map.doors[map.doorIndex[i]];
        const c = d.lock ? KEY_COLORS[d.lock] ?? [200, 0, 200] : d.secret ? [130, 60, 170] : [150, 100, 50];
        rect(x, y, S, S, [30, 24, 20]);
        if (d.axis === 'x') rect(x + (S >> 1) - 1, y, 2, S, c);
        else rect(x, y + (S >> 1) - 1, S, 2, c);
        continue;
      }
      if (f & F_SOLID) {
        const c = textureColor(e.wall).map((v) => v * 0.75);
        rect(x, y, S, S, c);
        if (f & F_USE) frame(x, y, S, S, map.uses.get(i)?.actions.some((u) => ['exit', 'secretExit', 'finale'].includes(u.action)) ? [40, 255, 60] : [255, 230, 40]);
        continue;
      }
      const light = map.baseLight[i] / 255;
      let c = (e.floor ? textureColor(e.floor) : [90, 90, 90]).map((v) => v * (0.35 + light * 0.75));
      if (f & F_SKY) c = [c[0] * 0.7 + 10, c[1] * 0.7 + 20, c[2] * 0.7 + 60];
      rect(x, y, S, S, c);
      if (f & F_SLANT) {
        // Angled wall: paint the solid side of the line in the wall's colour.
        const sl = map.slantAt(tx, ty);
        const wc = textureColor(e.wall).map((v) => v * 0.75);
        for (let yy = 0; yy < S; yy++) for (let xx = 0; xx < S; xx++) if (sl.solidAt(tx + (xx + 0.5) / S, ty + (yy + 0.5) / S)) put(x + xx, y + yy, wc);
      }
      if (f & F_DAMAGE) for (let k = 0; k < S; k += 3) rect(x, y + k, S, 1, [60, 220, 60]);
      if (f & F_SECRET) for (let yy = 1; yy < S; yy += 3) for (let xx = 1; xx < S; xx += 3) put(x + xx, y + yy, [200, 90, 255]);
      if (f & F_EXIT) frame(x, y, S, S, [40, 255, 60]);
      if (map.tag[i] >= 0) put(x, y, [0, 255, 255]);
      if (!a.reached[i]) for (let k = 0; k < S; k++) put(x + k, y + k, [255, 0, 0]);
    }
  }
  for (const s of spawns) {
    const def = reg.things.get(s.type);
    const x = Math.floor(s.x * S);
    const y = Math.floor(s.y * S);
    const k = Math.max(2, Math.round(S / 4));
    if (def?.kind === 'monster') {
      const big = (def.radius ?? 0.3) > 0.45 ? 2 : 1;
      rect(x - k * big, y - k * big, k * 2 * big, k * 2 * big, [230, 30, 30]);
      if (s.ambush) frame(x - k * big - 1, y - k * big - 1, k * 2 * big + 2, k * 2 * big + 2, [0, 0, 0]);
    } else if (def?.kind === 'item') {
      const keyCol = def.pickup?.key ? KEY_COLORS[def.pickup.key] : null;
      const weapon = def.pickup?.weapon;
      const c = keyCol ?? (weapon ? [255, 255, 255] : [240, 210, 60]);
      const r = keyCol || weapon ? k : Math.max(1, k >> 1);
      rect(x - r, y - r, r * 2, r * 2, c);
    } else if (def?.kind === 'npc') {
      rect(x - k, y - k, k * 2, k * 2, [40, 230, 90]);
      frame(x - k - 1, y - k - 1, k * 2 + 2, k * 2 + 2, [0, 0, 0]);
    } else if (def?.kind === 'decoration') {
      rect(x - 1, y - 1, 2, 2, [150, 150, 150]);
    }
  }
  if (playerStart) {
    const x = playerStart.x * S;
    const y = playerStart.y * S;
    for (let k = 0; k < S; k++) put(Math.round(x + Math.cos(playerStart.angle) * (k - S / 2)), Math.round(y + Math.sin(playerStart.angle) * (k - S / 2)), [255, 255, 255]);
    rect(Math.round(x - 1), Math.round(y - 1), 3, 3, [255, 255, 255]);
  }
  fs.mkdirSync(outDir, { recursive: true });
  const out = path.join(outDir, `${level.id}.png`);
  fs.writeFileSync(out, encodePNG(W, H, px));
  const p = a.problems.length ? `  PROBLEMS: ${a.problems.join('; ')}` : '';
  console.log(`${out}  (${map.w}x${map.h}, ${a.counts.monsters} monsters, ${a.counts.items} items, ${a.counts.secrets} secrets)${p}`);
}

for (const level of reg.levels.values()) if (!only.length || only.includes(level.id)) render(level);
