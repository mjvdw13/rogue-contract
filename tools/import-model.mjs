#!/usr/bin/env node
// Turns a Blender OBJ export (and its MTL) into a game model file:
//
//   node tools/import-model.mjs ship.obj [--id shuttle] [--scale 1] [--glow Lights,Engine] [--out <file.js>]
//
// Export from Blender as OBJ with the defaults (Y up, -Z forward), with
// materials. One Blender unit is one tile (the player is 1.76 tall); the
// model's front (Blender's front view) faces east at angle 0. A material
// whose texture file is named after a game texture (imp-panel.png) uses that
// texture with the OBJ's UVs; otherwise its colour is used. `--glow` lists
// materials drawn fullbright. The result goes to src/content/models/<id>.js;
// add it to src/content/models/index.js.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import content from '../src/content/index.js';
import { Registry } from '../src/engine/registry.js';
import { defineModel } from '../src/engine/defs.js';
import { parseOBJ, parseMTL } from './lib/obj.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BUDGET = 400;

const args = process.argv.slice(2);
const opt = (name, def) => (args.includes(name) ? args[args.indexOf(name) + 1] : def);
const file = args.find((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'));
if (!file) {
  console.error('usage: node tools/import-model.mjs <file.obj> [--id name] [--scale 1] [--glow mat,mat] [--out file.js]');
  process.exit(1);
}
const id = opt('--id', path.basename(file, path.extname(file)).toLowerCase().replace(/[^a-z0-9]+/g, '-'));
const out = path.resolve(opt('--out', path.join(root, 'src/content/models', `${id}.js`)));
const glowing = new Set((opt('--glow', '') || '').split(',').filter(Boolean));

const text = fs.readFileSync(file, 'utf8');
let materials = {};
const lib = text.match(/^mtllib\s+(.+)$/m)?.[1]?.trim();
if (lib) {
  const mtl = path.join(path.dirname(file), lib);
  if (fs.existsSync(mtl)) materials = parseMTL(fs.readFileSync(mtl, 'utf8'));
  else console.warn(`warning: no "${lib}" next to the OBJ; using grey`);
}
const registry = new Registry(content);
const texture = (f) => {
  const name = path.basename(f, path.extname(f));
  return registry.textures.has(name) ? name : null;
};
const { vertices, faces, warnings } = parseOBJ(text, { materials, scale: Number(opt('--scale', 1)), texture, glow: (m) => glowing.has(m) });
defineModel({ id, vertices, faces }); // throws if anything is malformed
for (const w of warnings) console.warn(`warning: ${w}`);
if (faces.length > BUDGET) console.warn(`warning: ${faces.length} triangles is over the budget of ${BUDGET}`);

const defsPath = path.relative(path.dirname(out), path.join(root, 'src/engine/defs.js')).replace(/\\/g, '/');
const lines = [
  `// Imported from ${path.basename(file)} by tools/import-model.mjs. Re-import rather than edit by hand.`,
  `import { defineModel } from '${defsPath}';`,
  '',
  'export default defineModel({',
  `  id: '${id}',`,
  '  vertices: [',
  ...vertices.map((v) => `    ${JSON.stringify(v).replace(/,/g, ', ')},`),
  '  ],',
  '  faces: [',
  ...faces.map((f) => `    { ${JSON.stringify(f).slice(1, -1).replace(/"(\w+)":/g, '$1: ').replace(/"/g, "'").replace(/,(?=\S)/g, ', ')} },`),
  '  ],',
  '});',
  '',
];
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, lines.join('\n'));
const xs = vertices.map((v) => v[0]);
const ys = vertices.map((v) => v[1]);
const zs = vertices.map((v) => v[2]);
const span = (a) => `${Math.min(...a).toFixed(2)}..${Math.max(...a).toFixed(2)}`;
console.log(`${path.relative(process.cwd(), out)}: ${vertices.length} vertices, ${faces.length} triangles; x ${span(xs)}, y ${span(ys)}, z ${span(zs)}`);
console.log(`Add it to src/content/models/index.js, then place it with a decoration whose model is "${id}".`);
