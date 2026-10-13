#!/usr/bin/env node
// Checks the content pack without a browser:
//   - every definition and reference (same checks the game runs at startup)
//   - every asset file exists, and PNG sizes fit their frame sizes
//   - every level: the exit is reachable from the start, keys can be found,
//     secrets can be entered, nothing is stuck in a wall. Reachability knows
//     heights: steps, jumps, drops, crouching, lifts and jump gaps
//
//   node tools/validate.mjs            summary + problems (exit code 1 on errors)
//   node tools/validate.mjs --verbose  also list unreachable items and one-way areas
//                                      (drops you can't climb back out of) per level
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import content from '../src/content/index.js';
import { Registry } from '../src/engine/registry.js';
import { validateContent } from '../src/engine/validate.js';
import { readPNGSize } from './art/lib/png.js';
import { analyseLevel, ammoBudget } from './lib/levelcheck.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const verbose = process.argv.includes('--verbose');

const reg = new Registry(content);
const { errors, warnings } = validateContent(reg);

// ---- Asset files.
const pngSize = (src, owner) => {
  const file = path.join(root, src);
  if (!fs.existsSync(file)) {
    errors.push(`${owner}: file not found: ${src}`);
    return null;
  }
  if (!src.toLowerCase().endsWith('.png')) return null;
  try {
    return readPNGSize(fs.readFileSync(file));
  } catch (e) {
    errors.push(`${owner}: ${src} is not a valid PNG (${e.message})`);
    return null;
  }
};
for (const t of reg.textures.values()) {
  const size = pngSize(t.src, `texture "${t.id}"`);
  if (!size || t.sky || t.fence) continue;
  if (size.height !== 64 || size.width !== 64 * (t.frames ?? 1)) {
    errors.push(`texture "${t.id}": expected ${64 * (t.frames ?? 1)}x64 pixels, got ${size.width}x${size.height}`);
  }
}
for (const s of reg.sheets.values()) {
  const size = pngSize(s.src, `sheet "${s.id}"`);
  if (!size || !s.frameWidth) continue;
  if (size.width % s.frameWidth || size.height % (s.frameHeight || size.height)) {
    warnings.push(`sheet "${s.id}": ${size.width}x${size.height} is not a whole number of ${s.frameWidth}x${s.frameHeight} frames`);
  }
}
for (const i of reg.images.values()) pngSize(i.src, `image "${i.id}"`);
for (const f of reg.fonts.values()) pngSize(f.src, `font "${f.id}"`);
for (const s of reg.sounds.values()) if (s.src) pngSize(s.src, `sound "${s.id}"`);
for (const s of reg.songs.values()) if (s.src) pngSize(s.src, `song "${s.id}"`);

// ---- Levels.
const rows = [];
for (const level of reg.levels.values()) {
  const owner = `Level "${level.id}"`;
  let normal;
  try {
    normal = analyseLevel(reg, level, 3);
  } catch (e) {
    errors.push(`${owner}: ${e.message}`);
    continue;
  }
  for (const p of normal.problems) errors.push(`${owner}: ${p}`);
  if (verbose) for (const n of [...normal.notes, ...normal.oneWay]) warnings.push(`${owner}: ${n}`);
  else if (normal.notes.length) warnings.push(`${owner}: ${normal.notes.length} item(s) can't be reached (--verbose lists them)`);
  for (const skill of [1, 5]) {
    const a = analyseLevel(reg, level, skill);
    for (const p of a.problems) if (!normal.problems.includes(p)) errors.push(`${owner} (skill ${skill}): ${p}`);
  }
  const easy = analyseLevel(reg, level, 1).counts;
  const hard = analyseLevel(reg, level, 5).counts;
  const { map } = normal.built;
  const budget = ammoBudget(reg, normal);
  if (budget.ratio < 1.2) warnings.push(`${owner}: ammo budget is tight (${budget.ratio.toFixed(2)}x the monsters' health on skill 3)`);
  rows.push({
    id: level.id,
    name: level.name,
    size: `${map.w}x${map.h}`,
    monsters: `${easy.monsters}/${normal.counts.monsters}/${hard.monsters}`,
    items: normal.counts.items,
    secrets: normal.counts.secrets,
    keys: [...normal.keys].join(',') || '-',
    ammo: `${budget.ratio.toFixed(1)}x`,
  });
}

console.log('Levels (monsters on skill 1/3/5; ammo = damage available / monster health on skill 3):');
for (const r of rows) {
  console.log(`  ${r.id.padEnd(6)} ${r.name.padEnd(26)} ${r.size.padEnd(7)} monsters ${r.monsters.padEnd(10)} items ${String(r.items).padEnd(4)} ammo ${r.ammo.padEnd(5)} secrets ${r.secrets}  keys ${r.keys}`);
}
for (const w of warnings) console.log(`warning: ${w}`);
for (const e of errors) console.log(`ERROR: ${e}`);
console.log(`\n${errors.length} error(s), ${warnings.length} warning(s)`);
process.exit(errors.length ? 1 : 0);
