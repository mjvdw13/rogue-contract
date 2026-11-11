#!/usr/bin/env node
// Times the 3D view headlessly, from seeded spots a player can reach, with
// the Dark Forces art (what players see):
//
//   node tools/bench.mjs                      every mission, 1x 4:3
//   node tools/bench.mjs m1 m4 --res 2        640x400
//   node tools/bench.mjs m1 --wide            426 columns (16:9)
//   node tools/bench.mjs m1 --views 80 --time 2
//   node tools/bench.mjs m1 --base DIR        against another copy of src/engine (see below)
//   node tools/bench.mjs m1 --worst 5         list the slowest views (for tools/snapshot.mjs --at)
//
// Per level: the average, 90th percentile and worst frame over the views
// (each view's best of several frames), and the share of each stage.
//
// Separate runs on one machine drift by up to 20%, so to judge a change,
// copy src/engine somewhere before making it and pass `--base` that copy:
// both renderers then draw the same views in one process, in alternating
// blocks, and the frames are compared byte for byte.
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { headless } from './snapshot.mjs';
import { World } from '../src/engine/world/world.js';
import { Rng } from '../src/engine/core/rng.js';
import { analyseLevel } from './lib/levelcheck.mjs';
import { SCREEN_W, screenWidth } from '../src/engine/config.js';

const args = process.argv.slice(2);
const opt = (name, def) => (args.includes(name) ? args[args.indexOf(name) + 1] : def);
const valued = new Set(['--res', '--views', '--time', '--base', '--worst', '--reps']);
const levels = args.filter((a, i) => !a.startsWith('--') && !valued.has(args[i - 1]));
const res = Number(opt('--res', 1));
const nViews = Number(opt('--views', 40));
const reps = Number(opt('--reps', 5));
const playTime = Number(opt('--time', 1));
const worst = Number(opt('--worst', 0));
const wide = args.includes('--wide');
const baseDir = opt('--base');

const ctx = await headless({ custom: true, scale: res });
const { registry, assets, surface, palette } = ctx;
if (wide) surface.resize(screenWidth(16 / 9), SCREEN_W);
const renderers = [{ name: 'now', r: ctx.renderer }];
if (baseDir) {
  const mod = await import(pathToFileURL(path.resolve(baseDir, 'render/renderer.js')).href);
  renderers.unshift({ name: 'base', r: new mod.Renderer(surface, assets, palette) });
}
for (const { r } of renderers) r.prepare();

const STAGES = ['world', 'models', 'hangings', 'sprites', 'particles'];
const still = { isDown: () => false, wasPressed: () => false, endFrame() {}, analog: null };
const pct = (sorted, p) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];
const fmt = (n) => n.toFixed(2).padStart(6);

for (const id of levels.length ? levels : ['m1', 'm2', 'm3', 'm4']) {
  const level = registry.levels.get(id);
  if (!level) throw new Error(`Unknown level "${id}"`);
  const world = new World({ registry, assets, rng: new Rng(1), settings: {} }, level, { skill: 3 });
  const map = world.map;
  // Seeded spots among the tiles a player can reach.
  const { reached } = analyseLevel(registry, level, 3);
  const open = [];
  for (let i = 0; i < reached.length; i++) if (reached[i]) open.push(i);
  const rng = new Rng(7);
  const views = [];
  for (let k = 0; k < nViews; k++) {
    const i = open[Math.floor(rng.next() * open.length)];
    views.push({ x: (i % map.w) + 0.5, y: Math.floor(i / map.w) + 0.5, angle: rng.next() * Math.PI * 2 });
  }
  // Some play first, so emitters' particles are in the air.
  const pt = world.player;
  for (let k = 0; k < Math.round(playTime * 60); k++) world.tick(1 / 60, still);
  const cams = views.map((v) => {
    pt.x = v.x;
    pt.y = v.y;
    pt.angle = v.angle;
    pt.z = world.floorAt(pt.x, pt.y, pt.radius, -Infinity);
    world.weather?.fill(pt.x, pt.y);
    return { ...world.camera(), v };
  });

  const best = renderers.map(() => new Float64Array(nViews).fill(Infinity));
  const stage = renderers.map(() => STAGES.map(() => new Float64Array(nViews).fill(Infinity)));
  const frames = renderers.map(() => []);
  let differ = 0;
  for (let rep = 0; rep < reps + 1; rep++) {
    for (let k = 0; k < nViews; k++) {
      for (let j = 0; j < renderers.length; j++) {
        const r = renderers[j].r;
        surface.clear(0);
        const t0 = performance.now();
        r.render(world, cams[k], { skip: pt });
        const ms = performance.now() - t0;
        // (The first pass warms the JIT up.)
        if (rep === 0) {
          if (renderers.length > 1) frames[j][k] = Uint8Array.from(surface.px);
          continue;
        }
        if (ms < best[j][k]) best[j][k] = ms;
        STAGES.forEach((s, q) => {
          const v = r.ms?.[s] ?? 0;
          if (v < stage[j][q][k]) stage[j][q][k] = v;
        });
      }
    }
  }
  if (renderers.length > 1) for (let k = 0; k < nViews; k++) if (Buffer.compare(frames[0][k], frames[1][k]) !== 0) differ++;

  console.log(`${id}  ${surface.pw}x${surface.ph}, ${nViews} views, ms a frame`);
  renderers.forEach(({ name }, j) => {
    const sorted = Float64Array.from(best[j]).sort();
    const avg = sorted.reduce((a, b) => a + b, 0) / nViews;
    const parts = STAGES.map((s, q) => {
      const a = stage[j][q].reduce((x, y) => x + (y === Infinity ? 0 : y), 0) / nViews;
      return a >= 0.005 ? `${s} ${a.toFixed(2)}` : null;
    }).filter(Boolean);
    console.log(`  ${name.padEnd(5)} avg ${fmt(avg)}  p90 ${fmt(pct(sorted, 0.9))}  worst ${fmt(sorted[nViews - 1])}   ${parts.join(', ')}`);
  });
  if (renderers.length > 1) {
    const a = best[0].reduce((x, y) => x + y, 0);
    const b = best[1].reduce((x, y) => x + y, 0);
    console.log(`  now is ${((1 - b / a) * 100).toFixed(1)}% faster; ${differ ? `${differ} of ${nViews} frames differ` : 'every frame the same'}`);
  }
  if (worst) {
    const order = [...best[renderers.length - 1].keys()].sort((a, b) => best[renderers.length - 1][b] - best[renderers.length - 1][a]);
    for (const k of order.slice(0, worst)) {
      const v = cams[k].v;
      // (Content degrees: 0 east, 90 north.)
      const deg = ((((-v.angle * 180) / Math.PI) % 360) + 360) % 360;
      const parts = STAGES.map((s, q) => `${s} ${stage[renderers.length - 1][q][k].toFixed(1)}`).slice(0, 2);
      console.log(`    ${fmt(best[renderers.length - 1][k])} ms  --at ${v.x},${v.y},${deg.toFixed(0)}   ${parts.join(', ')}`);
    }
  }
}
