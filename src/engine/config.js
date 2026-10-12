// Engine-wide constants. Content never needs to change these; they define the
// "virtual hardware" the game runs on (a 320x200 VGA-style screen).

export const SCREEN_W = 320;
export const SCREEN_H = 200;
export const STATUS_H = 32;
export const VIEW_W = SCREEN_W;
export const VIEW_H = SCREEN_H - STATUS_H;

/** 320x200 is displayed at 4:3, so every pixel is 1.2x taller than it is wide. */
export const PIXEL_ASPECT = 1.2;

export const TICK_RATE = 60;
export const TICK = 1 / TICK_RATE;

/**
 * Texture density: texels per world unit (1 unit = 1 map tile). A 64px
 * texture spans two tiles, about the height of a person.
 */
export const TEXELS_PER_UNIT = 32;

/** Number of light levels in the colormap (0 = full bright, 31 = black). */
export const LIGHT_LEVELS = 32;

/** Palette index reserved for "transparent" in every indexed image. */
export const TRANSPARENT = 255;

export const FOV_DEG = 90;
export const EYE_HEIGHT = 1;
