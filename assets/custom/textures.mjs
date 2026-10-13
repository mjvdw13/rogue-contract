// Copies Dark Forces textures over the generated ones: one DF texture per
// game texture, written to assets/custom/textures/ and added to
// overrides.json. Switches and key doors are DF wall and door art with DF's
// small switch and key panels laid on top. See DISCLAIMER.md.
//
//   node assets/custom/textures.mjs "<the pack's Textures folder>"
//
// The folder is the "Textures" folder from the "MS-DOS - Star Wars_ Dark
// Forces - Miscellaneous - Textures" zip (subfolders per level; the script
// finds each file by name). Dark Forces draws about 8 texels per foot, close
// enough to the game's 32 per unit that textures keep their own size.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodePNG, encodePNG } from '../../tools/art/lib/png.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = process.argv[2];
if (!dir) throw new Error('usage: node assets/custom/textures.mjs <the pack\'s Textures folder>');

/** Every PNG under the pack, by upper-case name without the extension. */
const files = new Map();
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.toLowerCase().endsWith('.png')) files.set(e.name.slice(0, -4).toUpperCase(), p);
  }
})(dir);

function load(name) {
  const p = files.get(name);
  if (!p) throw new Error(`no ${name}.png in ${dir}`);
  const { width, height, data } = decodePNG(fs.readFileSync(p));
  return { w: width, h: height, data: new Uint8Array(data) };
}

/** Lay `top` on `base` at (x, y), skipping see-through pixels. */
function stamp(base, top, x, y) {
  for (let ty = 0; ty < top.h; ty++) {
    for (let tx = 0; tx < top.w; tx++) {
      const i = (ty * top.w + tx) * 4;
      if (top.data[i + 3] < 128) continue;
      const o = ((y + ty) * base.w + x + tx) * 4;
      base.data.set(top.data.subarray(i, i + 4), o);
    }
  }
  return base;
}

/** The top `h` rows (a 64x128 wall cut to one 64x64 tile, so a decal repeats like the generated switch). */
const crop = (img, h) => ({ w: img.w, h, data: img.data.slice(0, img.w * h * 4) });

/** Turn red into yellow (there is no yellow key panel). */
function redToYellow(img) {
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const [r, g, b] = [d[i], d[i + 1], d[i + 2]];
    if (r > 90 && r > g * 1.6 && r > b * 1.6) {
      d[i + 1] = Math.round(r * 0.82);
      d[i + 2] = Math.round(b * 0.3);
    }
  }
  return img;
}

const centred = (base, top) => stamp(base, top, (base.w - top.w) >> 1, (base.h - top.h) >> 1);

/** Squash or stretch to `h` rows (nearest row), keeping the width. */
function resizeRows(img, h) {
  const data = new Uint8Array(img.w * h * 4);
  for (let y = 0; y < h; y++) {
    const sy = Math.min(img.h - 1, Math.floor(((y + 0.5) * img.h) / h));
    data.set(img.data.subarray(sy * img.w * 4, (sy + 1) * img.w * 4), y * img.w * 4);
  }
  return { w: img.w, h, data };
}

// Game texture id -> a DF texture name, or a function building the image.
// `frames: 1` replaces an animated generated texture with a still one.
// `seeThrough: true` keeps the transparent pixels (fences); other walls are made solid.
const TEXTURES = {
  // Imperial walls
  'imp-panel': 'IWSECB2',
  'imp-panel-dark': 'ZWDARK2',
  'imp-lights': 'ZWHALL1L',
  'imp-stripe': 'IWLOWCON',
  'imp-vent': 'IPDUCTG',
  'imp-computer': { from: 'IWPANEL1', frames: 1 },
  // Floors and ceilings
  'imp-floor': 'IF3',
  'imp-grate': 'ZPGRTE1X',
  'imp-ceiling': 'IPSQAR2',
  'imp-ceiling-light': 'ZPLIT08',
  'lift-floor': 'ZPCIRCL1',
  // Doors and switches
  'imp-door': 'IDDOOR1',
  'imp-door-red': () => centred(load('IDDOOR1'), load('ZASWIT01_0')),
  'imp-door-blue': () => centred(load('IDDOOR1'), load('ZASWIT01_1')),
  'imp-door-yellow': () => centred(load('IDDOOR1'), redToYellow(load('ZASWIT01_0'))),
  'imp-jamb': 'IDJAMLCY',
  'imp-switch': () => centred(crop(load('IWSECB2'), 64), load('ZASWIT06_0')),
  'imp-switch-on': () => centred(crop(load('IWSECB2'), 64), load('ZASWIT06_1')),
  // The canyon outside
  'canyon-rock': 'ZWCLIFMD',
  sand: 'IPSEC1',
  'sky-night': 'CESUNSET',
  // See-through fences: the girder truss squashed to a 0.75-tall railing, bars and a lattice.
  'imp-railing': { build: () => resizeRows(load('ZMGRATE1'), 24), seeThrough: true },
  'imp-bars': { from: 'ZWBARS', seeThrough: true },
  'imp-cage': { from: 'ICDELEV', seeThrough: true },
};

const outDir = path.join(here, 'textures');
fs.mkdirSync(outDir, { recursive: true });
const overridesFile = path.join(here, 'overrides.json');
const overrides = fs.existsSync(overridesFile) ? JSON.parse(fs.readFileSync(overridesFile, 'utf8')) : {};
for (const [id, pick] of Object.entries(TEXTURES)) {
  const spec = typeof pick === 'object' ? pick : { from: pick };
  const build = typeof pick === 'function' ? pick : spec.build;
  const img = build ? build() : load(spec.from);
  if (!spec.seeThrough) for (let i = 3; i < img.data.length; i += 4) img.data[i] = 255; // walls are solid
  fs.writeFileSync(path.join(outDir, `${id}.png`), encodePNG(img.w, img.h, img.data));
  overrides[`assets/textures/${id}.png`] = { src: `assets/custom/textures/${id}.png`, ...(spec.frames ? { frames: spec.frames } : {}) };
  console.log(`${id}: ${build ? 'composited' : spec.from} (${img.w}x${img.h})`);
}
fs.writeFileSync(overridesFile, JSON.stringify(overrides, null, 2) + '\n');
console.log('updated overrides.json');
