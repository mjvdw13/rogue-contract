#!/usr/bin/env node
// Browser smoke test. Serves the repo under /rogue-contract/ (the same subpath
// GitHub Pages uses), then in headless Chromium:
//   1. loads the title screen and starts a new game through the menus,
//   2. walks, shoots and opens the automap,
//   3. warps through every level with ?map=,
//   4. checks widescreen: the frame width follows the window (16:9, 21:9, 4:3),
// failing on any page error or console error. Screenshots go to .smoke/.
//
//   npm run smoke
//
// Needs Playwright: `npm i -D playwright && npx playwright install chromium`
// (or set PLAYWRIGHT_MODULE to an existing install).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import content from '../src/content/index.js';
import { Registry } from '../src/engine/registry.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, '.smoke');
const BASE = '/rogue-contract/';

async function loadPlaywright() {
  const candidates = [process.env.PLAYWRIGHT_MODULE, 'playwright', '@playwright/test'].filter(Boolean);
  for (const c of candidates) {
    try {
      const mod = await import(c.startsWith('/') ? pathToFileURL(path.join(c, 'index.js')).href : c);
      return mod.chromium ?? mod.default?.chromium;
    } catch {
      /* try the next one */
    }
  }
  console.error('Playwright not found. Install it with:\n  npm i -D playwright && npx playwright install chromium');
  process.exit(2);
}

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.jpg': 'image/jpeg' };

function serve() {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    if (!url.pathname.startsWith(BASE)) {
      res.writeHead(404).end('outside the site path (absolute URL used?)');
      console.log(`404 outside ${BASE}: ${url.pathname}`);
      return;
    }
    let file = path.join(root, decodeURIComponent(url.pathname.slice(BASE.length)));
    if (file.endsWith(path.sep) || file === root) file = path.join(file, 'index.html');
    if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404).end('not found');
      return;
    }
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

const chromium = await loadPlaywright();
const server = await serve();
const origin = `http://127.0.0.1:${server.address().port}${BASE}`;
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const problems = [];
let step = 0;

async function page(url, viewport = { width: 960, height: 720 }) {
  const p = await browser.newPage({ viewport });
  p.on('pageerror', (e) => problems.push(`${url}: ${e.message}`));
  p.on('console', (m) => {
    if (m.type() === 'error') problems.push(`${url}: console: ${m.text()}`);
  });
  await p.goto(origin + url);
  await p.waitForFunction(() => window.game?.scene && window.game.scene.constructor.name !== 'LoadingScene', null, { timeout: 30000 });
  return p;
}
const shot = (p, name) => p.screenshot({ path: path.join(outDir, `${String(++step).padStart(2, '0')}-${name}.png`) });
const scene = (p) => p.evaluate(() => window.game.scene.constructor.name);
const check = (cond, what) => {
  if (!cond) problems.push(what);
  console.log(`${cond ? 'ok  ' : 'FAIL'} ${what}`);
};

// 1. Title -> menus -> new game.
{
  const p = await page('index.html?mute');
  await p.waitForTimeout(800);
  check((await scene(p)) === 'TitleScene', 'boots to the title screen');
  await shot(p, 'title');
  await p.keyboard.press('Enter'); // open the main menu
  await p.waitForTimeout(300);
  await p.keyboard.press('Enter'); // NEW GAME
  await p.waitForTimeout(300);
  await shot(p, 'skill-menu');
  await p.keyboard.press('Enter'); // default skill
  const started = await p
    .waitForFunction(() => window.game.scene.constructor.name === 'LevelScene', null, { timeout: 20000 })
    .then(() => true, () => false);
  check(started, 'NEW GAME starts the first level');
  await p.waitForTimeout(1500); // let the screen melt finish and the weapon come up
  // 2. Play a little: walk forward, check the blaster is out, and fire it.
  await p.keyboard.down('KeyW');
  await p.waitForTimeout(700);
  await p.keyboard.up('KeyW');
  await p.waitForTimeout(500);
  const armed = await p.evaluate(() => ({ weapon: window.game.scene.world.player.player.weapon, ammo: { ...window.game.scene.world.player.player.ammo } }));
  check(armed.weapon === 'blaster', 'starts with the blaster out');
  await p.keyboard.down('KeyF');
  await p.waitForTimeout(1500);
  await p.keyboard.up('KeyF');
  const ammo = await p.evaluate(() => window.game.scene.world.player.player.ammo);
  check(Object.entries(armed.ammo).some(([k, v]) => ammo[k] < v), 'firing uses ammo');
  await shot(p, 'playing');
  await p.keyboard.press('Tab');
  await p.waitForTimeout(300);
  await shot(p, 'automap');
  await p.keyboard.press('Tab');
  await p.close();
}

// 3. Every level loads and renders.
for (const level of new Registry(content).levels.values()) {
  const p = await page(`index.html?map=${level.id}&mute&nomonsters`);
  await p.waitForFunction(() => window.game.scene.constructor.name === 'LevelScene', null, { timeout: 20000 }).catch(() => {});
  await p.waitForTimeout(800);
  const info = await p.evaluate(() => ({ scene: window.game.scene.constructor.name, id: window.game.scene.level?.id }));
  check(info.scene === 'LevelScene' && info.id === level.id, `?map=${level.id} loads ${level.name}`);
  await shot(p, level.id);
  await p.close();
}

// 4. Widescreen: the frame widens with the window, and the HUD and menus stay centred.
{
  const p = await page('index.html?mute', { width: 1280, height: 720 });
  await p.waitForTimeout(500);
  const width = () => p.evaluate(() => window.game.surface.w);
  check((await width()) === 426, `a 16:9 window gets a 426-column frame (got ${await width()})`);
  await shot(p, 'wide-title');
  await p.keyboard.press('Enter'); // main menu
  await p.waitForTimeout(300);
  await shot(p, 'wide-menu');
  await p.close();

  const q = await page('index.html?map=m1&mute&nomonsters', { width: 1280, height: 720 });
  await q.waitForFunction(() => window.game.scene.constructor.name === 'LevelScene', null, { timeout: 20000 }).catch(() => {});
  await q.waitForTimeout(1500);
  await shot(q, 'wide-playing');
  await q.keyboard.press('Tab');
  await q.waitForTimeout(300);
  await shot(q, 'wide-automap');
  await q.keyboard.press('Tab');
  await q.setViewportSize({ width: 1680, height: 720 });
  await q.waitForTimeout(300);
  check((await q.evaluate(() => window.game.surface.w)) === 560, 'a 21:9 window gets the widest frame, 560 columns');
  await shot(q, 'ultrawide-playing');
  await q.setViewportSize({ width: 960, height: 720 });
  await q.waitForTimeout(300);
  check((await q.evaluate(() => window.game.surface.w)) === 320, 'back at 4:3 the frame is 320 columns again');
  await q.close();

  const r = await page('index.html?mute&wide=0', { width: 1280, height: 720 });
  check((await r.evaluate(() => window.game.surface.w)) === 320, '?wide=0 keeps the 4:3 frame');
  await r.close();
}

await browser.close();
server.close();
console.log(`\nScreenshots in ${path.relative(root, outDir)}/`);
if (problems.length) {
  console.log(`\n${problems.length} problem(s):`);
  for (const pr of problems) console.log(`  ${pr}`);
  process.exit(1);
}
console.log('Smoke test passed.');
