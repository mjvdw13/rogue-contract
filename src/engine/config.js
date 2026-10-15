// Engine-wide constants. Content never needs to change these; they define the
// "virtual hardware" the game runs on (a 320x200 VGA-style screen).

/**
 * The 4:3 layout width. The framebuffer can be wider (see screenWidth), but
 * all 2D layout (HUD, menus, pictures) is done for these centre 320 columns.
 */
export const SCREEN_W = 320;
export const SCREEN_H = 200;
/** The 4:3 view width; the 3D view's focal length is set for this width. */
export const VIEW_W = SCREEN_W;
/** The 3D view fills the screen's height; the HUD sits over its bottom corners. */
export const VIEW_H = SCREEN_H;

/** 320x200 is displayed at 4:3, so every pixel is 1.2x taller than it is wide. */
export const PIXEL_ASPECT = 1.2;

/** Colormap level for the mirrored sides of full-screen pictures on widescreen. */
export const BACKDROP_EDGE = 14;

/** The widest framebuffer: 21:9. Wider windows get bars at the sides. */
export const MAX_SCREEN_W = 560;

/**
 * Framebuffer width for a window of the given aspect (width / height): 320
 * at 4:3 or narrower, about 427 at 16:9, capped at 21:9. Always even, so the
 * centre 320 columns sit at a whole-pixel offset.
 */
export function screenWidth(aspect) {
  const w = Math.round((SCREEN_H * PIXEL_ASPECT * aspect) / 2) * 2;
  return Math.max(SCREEN_W, Math.min(MAX_SCREEN_W, w || SCREEN_W));
}

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
/** The standing eye above the feet, on a 1.7 body: high enough that a person-sized enemy reads as your height. */
export const EYE_HEIGHT = 1.25;
