#!/usr/bin/env node
// Prints a level at k times its resolution (default 2) as a level module, to
// bring a map drawn for the old coarse grid over to the fine grid. Comments
// in the original are lost: copy them across by hand.
//
//   node tools/upscale-map.mjs sandbox > src/content/levels/sandbox.js
//   node tools/upscale-map.mjs sandbox --k 2
import content from '../src/content/index.js';
import { Registry } from '../src/engine/registry.js';
import { upscaleLevel } from './lib/upscale.mjs';

const args = process.argv.slice(2);
const k = args.includes('--k') ? Number(args[args.indexOf('--k') + 1]) : 2;
const id = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--k');
const reg = new Registry(content);
const level = reg.levels.get(id);
if (!level) {
  console.error(`Unknown level "${id}". Levels: ${[...reg.levels.keys()].join(', ')}`);
  process.exit(1);
}

const ident = /^[A-Za-z_$][\w$]*$/;
const key = (k) => (ident.test(k) ? k : `'${k.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`);
const str = (s) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

/** A small JS literal printer: one array element per line for string arrays, short things inline. */
function print(v, indent = '') {
  const inner = `${indent}  `;
  if (typeof v === 'string') return str(v);
  if (typeof v !== 'object' || v === null) return String(v);
  if (Array.isArray(v)) {
    if (v.every((x) => typeof x === 'string') && v.length > 1) return `[\n${v.map((x) => `${inner}${str(x)},`).join('\n')}\n${indent}]`;
    const flat = `[${v.map((x) => print(x, inner)).join(', ')}]`;
    return flat.length < 90 && !flat.includes('\n') ? flat : `[\n${v.map((x) => `${inner}${print(x, inner)},`).join('\n')}\n${indent}]`;
  }
  const entries = Object.entries(v).filter(([, x]) => x !== undefined && typeof x !== 'function');
  const flat = `{ ${entries.map(([k2, x]) => `${key(k2)}: ${print(x, inner)}`).join(', ')} }`;
  if (flat.length < 100 && !flat.includes('\n')) return flat;
  return `{\n${entries.map(([k2, x]) => `${inner}${key(k2)}: ${print(x, inner)},`).join('\n')}\n${indent}}`;
}

// Only the fields a level file sets (defineLevel fills in the rest again).
const out = upscaleLevel(reg, level, k);
const fields = ['id', 'mapLabel', 'name', 'music', 'sky', 'par', 'fog', 'defaults', 'heightStep', 'heightBase', 'legend', 'thingLegend', 'tiles', 'floorHeights', 'ceilHeights', 'things', 'list', 'triggers'];
const empty = (v) => v === undefined || (Array.isArray(v) ? !v.length : typeof v === 'object' && v !== null && !Object.keys(v).length);
const def = Object.fromEntries(fields.filter((f) => !empty(out[f]) && f !== 'fog').map((f) => [f, out[f]]));
process.stdout.write(`import { defineLevel } from '../../engine/defs.js';\n\n// Upscaled ${k}x by tools/upscale-map.mjs.\nexport default defineLevel(${print(def)});\n`);
