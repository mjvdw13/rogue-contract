// Cuts the ripped Dark Forces enemy and weapon sheets into the game's monster and
// weapon frame layouts, and points overrides.json at the results. See DISCLAIMER.md.
//
//   node assets/custom/cut.mjs "<folder with the ripped sheets>"
//
// The game's layout: 0-3 walk, 4 aim, 5 fire, 6 pain, 7-11 death.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodePNG, encodePNG } from '../../tools/art/lib/png.js';

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
      return [
        walk(0, 28), walk(30, 58), walk(60, 87), walk(89, 117),
        attack(175, 204), attack(206, 235),
        fall(0, 32),
        fall(34, 69), fall(71, 109), fall(111, 152), fall(154, 198), fall(200, 243),
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
];

function cut({ file, asset, frames }) {
  const { width: W, data } = decodePNG(fs.readFileSync(path.join(dir, file)));
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
  fs.writeFileSync(path.join(here, `${asset}.png`), encodePNG(FW * n, FH, out));
  console.log(`${asset}.png: ${n} frames of ${FW}x${FH}`);
  return { src: `assets/custom/${asset}.png`, frameWidth: FW, frameHeight: FH, scale: SCALE };
}

// First-person weapons, drawn 1:1 at the bottom of the 320-wide view (Dark
// Forces drew them at the same size). Each frame is a box [x0, x1, y0, y1] on
// the sheet; every frame of a weapon keeps the same `anchor` ('left' or
// 'centre') on its bottom line, so the hand doesn't jump between frames.
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
];

function cutWeapon({ asset, anchor, padLeft, padBottom, frames }) {
  const { width: W, data } = decodePNG(fs.readFileSync(path.join(dir, WEAPON_SHEET)));
  const isBg = (x, y) => {
    const o = (y * W + x) * 4;
    return data[o] === 0 && data[o + 1] === 128 && data[o + 2] === 255;
  };
  const artW = Math.max(...frames.map(([x0, x1]) => x1 - x0 + 1));
  const FW = (padLeft + artW + 1) & ~1;
  const FH = Math.max(...frames.map(([, , y0, y1]) => y1 - y0 + 1)) + padBottom;
  const n = frames.length;
  const out = new Uint8Array(FW * n * FH * 4);
  frames.forEach(([x0, x1, y0, y1], f) => {
    const ox = f * FW + padLeft + (anchor === 'left' ? 0 : Math.floor((artW - (x1 - x0 + 1)) / 2));
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
  fs.writeFileSync(path.join(here, `${asset}.png`), encodePNG(FW * n, FH, out));
  console.log(`${asset}.png: ${n} frames of ${FW}x${FH}`);
  return { src: `assets/custom/${asset}.png`, frameWidth: FW, frameHeight: FH };
}

const overridesFile = path.join(here, 'overrides.json');
const overrides = fs.existsSync(overridesFile) ? JSON.parse(fs.readFileSync(overridesFile, 'utf8')) : {};
for (const sheet of SHEETS) {
  if (!fs.existsSync(path.join(dir, sheet.file))) {
    console.log(`skipped ${sheet.asset}: no "${sheet.file}"`);
    continue;
  }
  overrides[`assets/sprites/monsters/${sheet.asset}.png`] = cut(sheet);
}
if (fs.existsSync(path.join(dir, WEAPON_SHEET))) {
  for (const weapon of WEAPONS) overrides[`assets/sprites/weapons/${weapon.asset}.png`] = cutWeapon(weapon);
} else console.log(`skipped the weapons: no "${WEAPON_SHEET}"`);
fs.writeFileSync(overridesFile, JSON.stringify(overrides, null, 2) + '\n');
console.log('updated overrides.json');
