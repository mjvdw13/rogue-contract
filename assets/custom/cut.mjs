// Cuts the ripped Dark Forces enemy and weapon sheets into the game's monster and
// weapon frame layouts, and points overrides.json at the results. See DISCLAIMER.md.
//
//   node assets/custom/cut.mjs "<folder with the ripped sheets>"
//
// The game's layout: 0-3 walk, 4 aim, 5 fire, 6 pain, 7-11 death; then the
// walk from the other views (12-15 front three-quarter, 16-19 side, 20-23
// back three-quarter, 24-27 back). Every side view faces left.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodePNG, encodePNG } from '../../tools/art/lib/png.js';
import { RECOLOUR, recolour } from './recolour.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = process.argv[2];
if (!dir) throw new Error('usage: node assets/custom/cut.mjs <folder with the ripped sheets>');

// Dark Forces enemies are drawn at about 37 pixels per metre (a 1.76-tall
// trooper is 66 pixels); the game draws 32 per unit. Same for every sheet.
const SCALE = 0.85;

// Each frame is a box on the sheet, [x0, x1, y0, y1] inclusive, and `base`:
// the sheet row that lands on the frame's bottom (the feet, or for a hovering
// droid the line its row hangs from). Boxes come from measuring the sheets.
const row = (y0, y1, base = y1) => (x0, x1, top = y0) => ({ box: [x0, x1, top, y1], base });
const SHEETS = [
  {
    file: 'MS-DOS - Star Wars_ Dark Forces - Enemies - Stormtrooper.png',
    asset: 'stormtrooper',
    frames: (() => {
      const walk = row(0, 67);
      const attack = row(69, 135);
      const fall = row(205, 271);
      // Six frames a view on this sheet; the first four of each are used.
      const side = row(137, 203);
      return [
        walk(0, 28), walk(30, 58), walk(60, 87), walk(89, 117),
        attack(175, 204), attack(206, 235),
        fall(0, 32),
        fall(34, 69), fall(71, 109), fall(111, 152), fall(154, 198), fall(200, 243),
        walk(181, 222), walk(224, 263), walk(265, 305), walk(307, 346),
        side(0, 38), side(40, 89), side(91, 139), side(141, 176),
        side(269, 295), side(297, 334), side(336, 373), side(375, 400),
        attack(0, 27), attack(29, 56), attack(58, 85), attack(87, 114),
      ];
    })(),
  },
  {
    file: 'MS-DOS - Star Wars_ Dark Forces - Enemies - Imperial Officer.png',
    asset: 'officer',
    frames: (() => {
      const walk = row(0, 69);
      const r2 = row(71, 148);
      return [
        walk(0, 27), walk(29, 55), walk(57, 82), walk(84, 111),
        r2(0, 25), r2(27, 52), // aim; fire, with the muzzle flash
        r2(93, 125), // the white flash of a blaster hit
        r2(127, 170), r2(172, 218), r2(261, 301),
        r2(303, 348, 100), r2(350, 401, 100), // below the ripper's credit
        walk(113, 147), walk(149, 175), walk(177, 209), walk(211, 234),
        walk(236, 277), walk(279, 301), walk(303, 348), walk(350, 370),
        walk(372, 406), walk(408, 432), walk(434, 473), walk(475, 496),
        walk(498, 523), walk(525, 550), walk(552, 576), walk(578, 604),
      ];
    })(),
  },
  {
    file: 'MS-DOS - Star Wars_ Dark Forces - Enemies - Probe Droid.png',
    asset: 'probe-droid',
    frames: (() => {
      // Hovering frames hang from their tops (rows 0 and 71), so the body
      // doesn't bob with the legs. Wreckage lies on the floor.
      const hover = row(0, 68);
      const hover2 = (x0, x1) => ({ box: [x0, x1, 71, 71 + 68], base: 71 + 68 });
      const wreck = row(69, 157);
      return [
        hover(0, 50), hover(52, 98), hover(100, 142), hover(144, 183),
        hover(0, 50), hover2(459, 511), // aim; fire, with the red flash
        hover2(401, 457), // "Flinch!"
        wreck(0, 77), wreck(79, 157), wreck(159, 225), wreck(227, 313), wreck(315, 399),
      ];
    })(),
  },
  {
    // Bossk. No firing pose with a flash (the concussion blast glows on its
    // own), so fire repeats the aiming pose.
    file: 'MS-DOS - Star Wars_ Dark Forces - Enemies - Trandoshan.png',
    asset: 'bossk',
    frames: (() => {
      const walk = row(0, 98);
      const low = row(0, 100); // the back views stand two rows lower
      const stand = row(101, 191, 190);
      const fall = row(101, 191);
      return [
        walk(0, 30), walk(32, 61), walk(63, 92), walk(94, 123),
        stand(0, 42), stand(0, 42), // aim; fire
        stand(93, 134), // the white flash of a hit
        fall(180, 221), fall(223, 285), fall(287, 359), fall(361, 428), fall(430, 494),
        walk(125, 166), walk(168, 211), walk(213, 265), walk(267, 312),
        walk(314, 370), walk(372, 422), walk(424, 478), walk(480, 527),
        low(529, 574), low(576, 614), low(616, 655), low(657, 695),
        low(697, 727), low(729, 758), low(760, 789), low(791, 820),
      ];
    })(),
  },
  {
    // Boba Fett, from the separate cells of his zip (unpack it into the
    // folder). Only two poses face the viewer: standing (000) and the
    // legs-apart stance he flies in (001). In Dark Forces he never walks, so
    // the walk is the standing pose with one knee and then the other lifted.
    // He aims in the stance, and fires with his fireball (BOBABALL 000) at
    // the gun. Dark Forces drew him big (2.3 units at the others' scale), so
    // he's scaled down to 1.83.
    cells: {
      folder: 'BOBAFETT.cells',
      list: [
        '000.PNG', { file: '000.PNG', lift: { x: [0, 20], y: 57, by: 5 } },
        '000.PNG', { file: '000.PNG', lift: { x: [21, 44], y: 57, by: 5 } },
        '001.PNG', { file: '001.PNG', over: [{ file: 'BOBABALL.cells/000.PNG', x: 58, y: 34 }] },
        '002.PNG', // pain: the first frame of the fall
        '002.PNG', '003.PNG', '004.PNG', '005.PNG',
        // Standing, from the other views: front three-quarter, side, back
        // three-quarter, back (his walk from them, as he never walks).
        '007.PNG', '009.PNG', '011.PNG', '013.PNG',
      ],
    },
    asset: 'boba-fett',
    scale: 0.65,
  },
  {
    // Boba Fett's fireball: in flight (000-002, facing the viewer) and its
    // burst (012-014).
    cells: { folder: 'BOBAFETT.cells/BOBABALL.cells', list: ['000.PNG', '001.PNG', '002.PNG', '012.PNG', '013.PNG', '014.PNG'], align: 'middle' },
    asset: 'rocket',
    out: 'assets/sprites/fx/rocket.png',
  },
  // The thermal detonator: in flight (WDET), and the pickups (one, IDET, and
  // a belt of them, IDETS), from the pickups zip (unpack it into the folder,
  // so it holds `Pickups/`).
  { cells: { folder: 'Pickups/WDET.cells', list: ['000.PNG'], align: 'middle' }, asset: 'thermal-detonator-ball', out: 'assets/sprites/fx/thermal-detonator.png' },
  { cells: { folder: 'Pickups/IDET.cells', list: ['000.PNG'] }, asset: 'thermal-detonator-item', out: 'assets/sprites/items/thermal-detonator.png' },
  { cells: { folder: 'Pickups/IDETS.cells', list: ['000.PNG'] }, asset: 'detonator-belt', out: 'assets/sprites/items/detonator-belt.png' },
];

/**
 * Lays separate cells (one PNG per frame, transparent round the figure) side
 * by side on a pure blue strip, so they cut like a sheet. `align` 'bottom'
 * stands figures on one line; 'middle' centres them (projectiles). A cell's
 * `over` lays other cells on it, centred at (x, y), and its `lift` moves the
 * columns x[0]..x[1] from row y down up by `by` pixels (a leg lifted at the
 * knee: the rows above are drawn over, the foot leaves the floor).
 */
function strip({ folder, list, align = 'bottom' }) {
  const load = (file) => decodePNG(fs.readFileSync(path.join(dir, folder, file)));
  const lift = (img, { x: [x0, x1], y, by }) => {
    const data = new Uint8Array(img.data);
    for (let x = x0; x <= Math.min(x1, img.width - 1); x++) {
      for (let yy = y - by; yy < img.height; yy++) {
        const from = yy + by;
        const i = (yy * img.width + x) * 4;
        if (from < img.height) data.set(img.data.subarray((from * img.width + x) * 4, (from * img.width + x) * 4 + 4), i);
        else data.fill(0, i, i + 4);
      }
    }
    return { ...img, data };
  };
  const cells = list
    .map((c) => (typeof c === 'string' ? { file: c } : c))
    .map((c) => ({ img: c.lift ? lift(load(c.file), c.lift) : load(c.file), over: (c.over ?? []).map((o) => ({ ...o, img: load(o.file) })) }));
  const H = Math.max(...cells.map((c) => c.img.height));
  const W = cells.reduce((w, c) => w + c.img.width + 1, 0);
  const data = new Uint8Array(W * H * 4);
  for (let i = 0; i < data.length; i += 4) data.set([0, 0, 255, 255], i);
  const paint = (img, ox, oy) => {
    for (let y = 0; y < img.height; y++) {
      for (let x = 0; x < img.width; x++) {
        const i = (y * img.width + x) * 4;
        if (img.data[i + 3] < 128 || ox + x < 0 || ox + x >= W || oy + y < 0 || oy + y >= H) continue;
        data.set(img.data.subarray(i, i + 3), ((oy + y) * W + ox + x) * 4);
      }
    }
  };
  const frames = [];
  let x0 = 0;
  for (const { img, over } of cells) {
    const y0 = align === 'bottom' ? H - img.height : Math.floor((H - img.height) / 2);
    paint(img, x0, y0);
    for (const o of over) paint(o.img, x0 + o.x - Math.floor(o.img.width / 2), y0 + o.y - Math.floor(o.img.height / 2));
    frames.push({ box: [x0, x0 + img.width - 1, 0, H - 1], base: H - 1 });
    x0 += img.width + 1;
  }
  return { image: { width: W, data }, frames };
}

function cut({ file, cells, asset, scale = SCALE, ...sheet }) {
  const { image, frames } = cells ? strip(cells) : { image: decodePNG(fs.readFileSync(path.join(dir, file))), frames: sheet.frames };
  const { width: W, data } = image;
  // The background is pure blue.
  const isBg = (x, y) => {
    const o = (y * W + x) * 4;
    return data[o] === 0 && data[o + 1] === 0 && data[o + 2] === 255;
  };
  // Trim each box to its pixels, so frames centre on the figure.
  const trimmed = frames.map(({ box: [x0, x1, y0, y1], base }) => {
    let l = Infinity, r = -1, t = Infinity;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (!isBg(x, y)) (l = Math.min(l, x)), (r = Math.max(r, x)), (t = Math.min(t, y));
    return { l, r, t, b: Math.min(y1, base), base };
  });
  const FW = Math.max(...trimmed.map((f) => f.r - f.l + 1)) + 1 & ~1;
  const FH = Math.max(...trimmed.map((f) => f.base - f.t + 1));
  const n = frames.length;
  const out = new Uint8Array(FW * n * FH * 4);
  trimmed.forEach(({ l, r, t, b, base }, f) => {
    const ox = f * FW + Math.floor((FW - (r - l + 1)) / 2);
    for (let y = t; y <= b; y++) {
      for (let x = l; x <= r; x++) {
        if (isBg(x, y)) continue;
        const i = (y * W + x) * 4;
        const o = ((FH - 1 - (base - y)) * FW * n + ox + x - l) * 4;
        out.set(data.subarray(i, i + 3), o);
        out[o + 3] = 255;
      }
    }
  });
  if (RECOLOUR[asset]) recolour(out, RECOLOUR[asset]);
  fs.writeFileSync(path.join(here, `${asset}.png`), encodePNG(FW * n, FH, out));
  console.log(`${asset}.png: ${n} frames of ${FW}x${FH}`);
  return { src: `assets/custom/${asset}.png`, frameWidth: FW, frameHeight: FH, scale };
}

// First-person weapons, drawn 1:1 at the bottom of the 320-wide view (Dark
// Forces drew them at the same size). Each frame is a box [x0, x1, y0, y1] on
// the sheet; every frame of a weapon keeps the same `anchor` ('left',
// 'centre' or 'right') on its bottom line, so the hand doesn't jump between frames.
// `padLeft` pushes the art right of the weapon's `offset` in its definition,
// and `padBottom` lifts it back up by the offset's downward part.
const WEAPON_SHEET = 'MS-DOS - Star Wars_ Dark Forces - Miscellaneous - Weapons.png';
const WEAPONS = [
  {
    // fists.js: offset [0, 4]; 0 idle, 1-3 the punch. The arm comes in at the
    // bottom left of each frame, so frames line up on that corner.
    asset: 'fists',
    anchor: 'left',
    padLeft: 130,
    padBottom: 4,
    frames: [[164, 286, 72, 140], [450, 599, 44, 138], [295, 442, 18, 139], [450, 599, 44, 138]],
  },
  {
    // blaster.js: offset [24, 12]; 0 idle, 1 fire (lit), 2-3 recoil. The
    // Bryar pistol.
    asset: 'blaster',
    anchor: 'centre',
    padLeft: 32,
    padBottom: 12,
    frames: [[626, 708, 40, 133], [722, 802, 17, 133], [815, 899, 21, 133], [626, 708, 40, 133]],
  },
  {
    // thermal-detonator.js: offset [40, 0]; 0 the fist holding one, 1 the
    // open hand after the throw. The arm comes in at the bottom right, so
    // frames line up on that corner. (A stray two-pixel speck by the open
    // hand's wrist is left out.)
    asset: 'thermal-detonator',
    anchor: 'right',
    padLeft: 0,
    padBottom: 0,
    frames: [[9, 111, 167, 281], [119, 241, 148, 281]],
    erase: [[180, 272], [180, 273]],
  },
];

function cutWeapon({ asset, anchor, padLeft, padBottom, frames, erase = [] }) {
  const { width: W, data } = decodePNG(fs.readFileSync(path.join(dir, WEAPON_SHEET)));
  const isBg = (x, y) => {
    const o = (y * W + x) * 4;
    return (data[o] === 0 && data[o + 1] === 128 && data[o + 2] === 255) || erase.some(([ex, ey]) => ex === x && ey === y);
  };
  const artW = Math.max(...frames.map(([x0, x1]) => x1 - x0 + 1));
  const FW = (padLeft + artW + 1) & ~1;
  const FH = Math.max(...frames.map(([, , y0, y1]) => y1 - y0 + 1)) + padBottom;
  const n = frames.length;
  const out = new Uint8Array(FW * n * FH * 4);
  frames.forEach(([x0, x1, y0, y1], f) => {
    const spare = artW - (x1 - x0 + 1);
    const ox = f * FW + padLeft + (anchor === 'left' ? 0 : anchor === 'right' ? spare : Math.floor(spare / 2));
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        if (isBg(x, y)) continue;
        const i = (y * W + x) * 4;
        const o = ((FH - 1 - padBottom - (y1 - y)) * FW * n + ox + x - x0) * 4;
        out.set(data.subarray(i, i + 3), o);
        out[o + 3] = 255;
      }
    }
  });
  if (RECOLOUR[asset]) recolour(out, RECOLOUR[asset]);
  fs.writeFileSync(path.join(here, `${asset}.png`), encodePNG(FW * n, FH, out));
  console.log(`${asset}.png: ${n} frames of ${FW}x${FH}`);
  return { src: `assets/custom/${asset}.png`, frameWidth: FW, frameHeight: FH };
}

const overridesFile = path.join(here, 'overrides.json');
const overrides = fs.existsSync(overridesFile) ? JSON.parse(fs.readFileSync(overridesFile, 'utf8')) : {};
for (const sheet of SHEETS) {
  const source = sheet.file ?? sheet.cells.folder;
  if (!fs.existsSync(path.join(dir, source))) {
    console.log(`skipped ${sheet.asset}: no "${source}"`);
    continue;
  }
  // (Keys added by hand, such as `glint` and `glow`, are kept.)
  const key = sheet.out ?? `assets/sprites/monsters/${sheet.asset}.png`;
  overrides[key] = { ...overrides[key], ...cut(sheet) };
}
if (fs.existsSync(path.join(dir, WEAPON_SHEET))) {
  for (const weapon of WEAPONS) {
    const key = `assets/sprites/weapons/${weapon.asset}.png`;
    overrides[key] = { ...overrides[key], ...cutWeapon(weapon) };
  }
} else console.log(`skipped the weapons: no "${WEAPON_SHEET}"`);
// Lists of numbers, and lists of those (colours), stay on one line.
const inline = (json) => json.replace(/\[\s*((?:-?[\d.]+|\[[^[\]]*\])(?:,\s*(?:-?[\d.]+|\[[^[\]]*\]))*)\s*\]/g, (_, items) => `[${items.replace(/\s+/g, '').replace(/,/g, ', ')}]`);
fs.writeFileSync(overridesFile, inline(JSON.stringify(overrides, null, 2)) + '\n');
console.log('updated overrides.json');
