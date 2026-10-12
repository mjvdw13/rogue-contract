import { defineFont, defineImage, defineSheet } from '../engine/defs.js';

export const fonts = [
  defineFont({ id: 'small', src: 'assets/ui/font-small.png', cellW: 6, cellH: 8, spaceWidth: 3, lineHeight: 9 }),
  defineFont({ id: 'big', src: 'assets/ui/font-big.png', cellW: 13, cellH: 17, spacing: -1, spaceWidth: 6, upper: true }),
  defineFont({ id: 'gold', src: 'assets/ui/font-gold.png', cellW: 13, cellH: 17, spacing: -1, spaceWidth: 6, upper: true }),
  defineFont({ id: 'hud', src: 'assets/ui/font-hud.png', cellW: 13, cellH: 17, spacing: -2, spaceWidth: 6, upper: true, mono: true }),
  defineFont({ id: 'tiny', src: 'assets/ui/font-tiny.png', cellW: 4, cellH: 6, spaceWidth: 2, upper: true }),
];

export const images = [
  defineImage({ id: 'title', src: 'assets/ui/title.png' }),
  defineImage({ id: 'statusbar', src: 'assets/ui/statusbar.png' }),
  defineImage({ id: 'intermission', src: 'assets/ui/intermission.png' }),
];

export const sheets = [
  defineSheet({ id: 'hud-icons', src: 'assets/ui/hud-icons.png', frameWidth: 8, frameHeight: 10 }),
  defineSheet({ id: 'cursor', src: 'assets/ui/cursor.png', frameWidth: 16, frameHeight: 16 }),
];
