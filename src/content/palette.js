/**
 * The ROGUE CONTRACT palette: 256 colours (inherited from Raccoon Alex; the
 * Imperial greys, desert ochres and blaster glows all fit in its ramps).
 *
 * - Index 0 is black.
 * - Indices 1..223 are colour ramps (dark → light). Lighting darkens these.
 * - Indices 224..254 are FULLBRIGHT: they glow in the dark and ignore
 *   lighting (blaster bolts, LEDs, fire, screens, light strips). Use them in art
 *   for anything that should shine.
 * - Index 255 is transparent.
 *
 * Every PNG the game loads is snapped to these colours, so art from any
 * source automatically matches. Change a ramp here and regenerate the art
 * (npm run art) to re-theme the whole game.
 */

const RAMPS = [
  // name, count, key colours dark → light
  ['gray', 23, [10, 10, 12], [62, 62, 64], [128, 128, 126], [232, 230, 222]],
  ['concrete', 16, [22, 20, 17], [78, 72, 62], [146, 136, 118], [206, 196, 174]],
  ['rust', 24, [20, 10, 6], [70, 32, 16], [134, 64, 28], [180, 104, 52], [214, 156, 96]],
  ['skin', 16, [44, 24, 16], [110, 62, 42], [180, 118, 86], [238, 196, 160]],
  ['blood', 16, [26, 0, 0], [90, 6, 4], [160, 16, 10], [220, 48, 32]],
  ['orange', 12, [44, 16, 0], [130, 54, 8], [210, 110, 24], [255, 176, 72]],
  ['yellow', 12, [40, 34, 8], [120, 100, 30], [190, 170, 70], [242, 224, 130]],
  ['olive', 16, [12, 16, 6], [44, 52, 22], [96, 108, 52], [158, 172, 96]],
  ['toxic', 12, [4, 18, 6], [16, 70, 20], [50, 140, 40], [120, 210, 80]],
  ['teal', 12, [4, 16, 18], [16, 58, 62], [44, 116, 118], [110, 190, 188]],
  ['steel', 20, [6, 8, 18], [30, 38, 64], [76, 92, 130], [130, 150, 186], [190, 206, 232]],
  ['purple', 12, [12, 6, 22], [48, 24, 72], [100, 60, 140], [170, 124, 204]],
  ['flesh', 12, [26, 6, 14], [92, 30, 46], [168, 74, 96], [232, 140, 160]],
  ['beige', 12, [42, 38, 28], [104, 94, 72], [172, 160, 128], [236, 226, 198]],
  ['navy', 8, [4, 6, 16], [12, 18, 40], [26, 34, 68], [44, 56, 96]],
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

function build() {
  const colors = [[0, 0, 0]];
  const ramps = {};
  for (const [name, count, ...keys] of RAMPS) {
    ramps[name] = [colors.length, count];
    colors.push(...interpolate(keys, count));
  }
  if (colors.length !== 224) throw new Error(`Palette ramps must fill indices 0..223 (got ${colors.length})`);
  const fullbrightStart = colors.length;
  for (const [name, ...group] of GLOW_GROUPS) {
    ramps[name] = [colors.length, group.length];
    colors.push(...group);
  }
  if (colors.length !== 255) throw new Error(`Glow colours must fill 224..254 (got ${colors.length})`);
  colors.push([255, 0, 255]); // 255: transparent
  return { colors, ramps, fullbrightStart };
}

const built = build();

export default {
  colors: built.colors,
  ramps: built.ramps,
  fullbrightStart: built.fullbrightStart,
};
