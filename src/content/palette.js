/**
 * The ROGUE CONTRACT palette: 256 colours, fitted to the art (Phase 1d): ramps
 * for the Imperial blue-greys, the night sky, the desert and the enemies,
 * and free colours placed by tools/fit-palette.mjs where the lit art needs
 * them most.
 *
 * - Index 0 is black.
 * - Indices 1..223 are colour ramps (dark → light), then the fitted
 *   colours. Lighting darkens these.
 * - Indices 224..254 are FULLBRIGHT: they glow in the dark and ignore
 *   lighting (blaster bolts, LEDs, fire, screens, light strips). Use them in art
 *   for anything that should shine.
 * - Index 255 is transparent.
 *
 * Every PNG the game loads is snapped to these colours, so art from any
 * source automatically matches. Change a ramp here and regenerate the art
 * (npm run art) to re-theme the whole game.
 */

export const RAMPS = [
  // name, count, key colours dark → light
  ['gray', 20, [8, 8, 9], [36, 36, 37], [64, 64, 64], [100, 100, 99], [140, 139, 137], [182, 180, 176], [232, 230, 224]],
  // SecBase's blue-greys: the walls, floors and ceilings.
  ['steel', 28, [9, 10, 14], [26, 29, 37], [45, 49, 61], [64, 70, 86], [84, 91, 111], [108, 114, 134], [144, 150, 168], [198, 206, 222]],
  ['navy', 8, [2, 2, 10], [5, 3, 28], [12, 7, 50], [24, 15, 74], [40, 30, 102]],
  ['purple', 6, [36, 18, 86], [60, 34, 116], [86, 56, 146], [132, 104, 192]],
  ['concrete', 8, [22, 20, 17], [62, 58, 51], [110, 104, 93], [162, 154, 140], [206, 196, 174]],
  // The desert: sand, sandstone and dust.
  ['sand', 12, [28, 20, 12], [62, 46, 28], [104, 80, 52], [150, 120, 82], [196, 168, 124], [232, 214, 176]],
  // Jawa robes, leather, rust.
  ['rust', 12, [22, 12, 6], [63, 37, 11], [104, 61, 26], [148, 88, 43], [207, 127, 76], [232, 176, 128]],
  ['skin', 6, [44, 24, 16], [110, 62, 42], [180, 118, 86], [238, 196, 160]],
  ['blood', 8, [26, 0, 0], [90, 6, 4], [150, 20, 12], [220, 48, 32]],
  ['orange', 6, [44, 16, 0], [130, 54, 8], [210, 110, 24], [255, 176, 72]],
  ['yellow', 6, [40, 34, 8], [120, 100, 30], [190, 170, 70], [242, 224, 130]],
  // Officers' uniforms.
  ['olive', 8, [16, 16, 10], [44, 46, 30], [70, 70, 50], [104, 104, 78], [150, 150, 118]],
  ['toxic', 4, [4, 18, 6], [16, 70, 20], [50, 140, 40], [120, 210, 80]],
  ['teal', 4, [4, 16, 18], [16, 58, 62], [44, 116, 118], [110, 190, 188]],
  ['flesh', 3, [26, 6, 14], [92, 30, 46], [168, 74, 96], [232, 140, 160]],
  // Sandtrooper armour.
  ['beige', 8, [42, 38, 28], [104, 94, 72], [172, 160, 128], [236, 226, 198]],
];

/** Glowing colours, indices 224..254, in groups ordered dark → light. */
const GLOW_GROUPS = [
  ['glow-yellow', [255, 70, 10], [255, 120, 20], [255, 170, 30], [255, 210, 60], [255, 236, 120], [255, 250, 200], [255, 255, 255]],
  ['glow-red', [150, 10, 10], [210, 20, 20], [255, 40, 30]],
  ['glow-green', [10, 110, 20], [20, 170, 30], [70, 230, 60], [170, 255, 140]],
  ['glow-cyan', [10, 90, 160], [20, 150, 220], [60, 220, 255], [170, 250, 255]],
  ['glow-magenta', [190, 20, 150], [255, 60, 200], [255, 150, 240]],
  ['glow-purple', [140, 80, 255], [200, 150, 255]],
  ['glow-lamp', [190, 120, 60], [232, 166, 92], [255, 214, 150]],
  ['glow-tube', [170, 192, 232], [214, 232, 255]],
  ['glow-amber', [200, 120, 0], [255, 176, 0]],
  ['glow-pale', [255, 255, 170]],
];

/**
 * Free colours, placed where the ramps cover the art worst once it's lit:
 * fitted by `node tools/fit-palette.mjs --fit 76` (rerun it after the ramps
 * or the art change much). Sorted dark to light.
 */
const FITTED = [
  [16, 18, 22], [0, 14, 105], [21, 23, 28], [23, 23, 23], [25, 28, 34], [12, 37, 48],
  [31, 31, 31], [0, 26, 149], [0, 24, 216], [39, 39, 39], [48, 48, 48], [44, 48, 59],
  [8, 63, 98], [23, 63, 78], [176, 0, 0], [40, 59, 78], [56, 56, 56], [0, 62, 178],
  [211, 0, 0], [52, 68, 78], [65, 65, 65], [11, 84, 127], [0, 75, 215], [37, 84, 110],
  [252, 0, 0], [26, 96, 111], [77, 77, 76], [210, 20, 20], [55, 86, 109], [0, 88, 252],
  [13, 104, 156], [110, 81, 17], [89, 89, 89], [73, 96, 110], [48, 109, 143], [91, 102, 110],
  [34, 125, 145], [100, 100, 100], [17, 128, 187], [146, 96, 14], [146, 91, 65], [71, 117, 143],
  [255, 47, 25], [142, 116, 0], [113, 112, 112], [59, 136, 178], [96, 125, 145], [20, 150, 220],
  [123, 123, 123], [0, 209, 0], [42, 156, 181], [88, 145, 177], [137, 137, 136], [178, 142, 0],
  [72, 164, 215], [146, 146, 146], [119, 156, 178], [51, 187, 217], [106, 174, 215], [160, 160, 160],
  [147, 167, 181], [212, 170, 0], [84, 192, 252], [60, 220, 255], [178, 178, 178], [143, 189, 215],
  [255, 171, 25], [124, 204, 252], [189, 189, 189], [178, 199, 217], [252, 207, 0], [207, 207, 207],
  [168, 222, 252], [170, 255, 140], [210, 235, 253], [253, 253, 253],
];

function interpolate(keys, count) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0 : (i / (count - 1)) * (keys.length - 1);
    const k = Math.min(keys.length - 2, Math.floor(t));
    const f = t - k;
    const a = keys[k];
    const b = keys[k + 1];
    out.push([0, 1, 2].map((c) => Math.round(a[c] + (b[c] - a[c]) * f)));
  }
  return out;
}

/** The ramps' colours, in palette order from index 1. */
export function rampColors() {
  return RAMPS.flatMap(([, count, ...keys]) => interpolate(keys, count));
}

/** The palette: black, the ramps, then `fitted` (free colours) up to 223, the glow colours and transparent. */
export function buildPalette(fitted = FITTED) {
  const colors = [[0, 0, 0]];
  const ramps = {};
  for (const [name, count, ...keys] of RAMPS) {
    ramps[name] = [colors.length, count];
    colors.push(...interpolate(keys, count));
  }
  if (fitted.length) {
    ramps.fitted = [colors.length, fitted.length];
    colors.push(...fitted);
  }
  if (colors.length > 224) throw new Error(`Palette ramps and fitted colours must fit in indices 0..223 (got ${colors.length})`);
  // (Short of colours while the free ones are being fitted: black fills the gap.)
  while (colors.length < 224) colors.push([0, 0, 0]);
  const fullbrightStart = colors.length;
  for (const [name, ...group] of GLOW_GROUPS) {
    ramps[name] = [colors.length, group.length];
    colors.push(...group);
  }
  if (colors.length !== 255) throw new Error(`Glow colours must fill 224..254 (got ${colors.length})`);
  colors.push([255, 0, 255]); // 255: transparent
  return { colors, ramps, fullbrightStart };
}

const built = buildPalette();

export default {
  colors: built.colors,
  ramps: built.ramps,
  fullbrightStart: built.fullbrightStart,
};
