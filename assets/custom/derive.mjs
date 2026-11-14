// Derives more textures from the Dark Forces textures already in
// assets/custom/textures/ (written there by textures.mjs from the pack), and
// adds their entries to overrides.json. Run it after textures.mjs. See
// DISCLAIMER.md.
//
//   node assets/custom/derive.mjs
//
// A derived texture is a DF texture recoloured by a gradient map: each
// pixel's brightness picks a colour along `gradient` (dark to light), and
// `keep` of its own colour's difference from grey is kept, so streaks and
// stains stay visible. The canyon's sandstone and sand come from DF's grey
// cliff (Talay) and SecBase's rock floor.
//
// Mos Eisley's textures (`TOWN`) are recoloured straight from the pack
// (`df`, a texture's name in df-textures/), with no generated stand-in:
// src/content/textures.js loads them from here directly. `crop: [x, y, w,
// h]` takes part of the source (the plain top of a busy wall); `smooth: n`
// softens its grain (n passes of a 3x3 blur, wrapping round); `scale: [w,
// h]` shrinks it to w x h texels; `tile: [nx, ny]` repeats it (to widen a
// sky, or tile a shrunk one), and `fade: { color, from }` blends toward
// `color` from `from` (0 top, 1 bottom) down to the bottom row (a sky's
// haze at the horizon), and `rust: { color, amount, cell, seed }` stains it
// with blotches of rust that tile (a list of them stains it with each).
// `holes: true` keeps the source's see-through texels (a mesh).
// `turn: true` turns it a quarter (a pipe's picture for a pipe lying across the
// other way). `lip: [{ rows, color, amount }, ...]` paints bands down from the top row,
// each `rows` tall, `amount` of the way to `color` (a step's nosing and the
// shadow under it). `edge: { rows, amp, seed }` makes the texels above a
// wavy line round `rows` down from the top see-through (`amp` texels up and
// down, repeating across the width), its lip darkened a little: a band
// whose top edge isn't straight. A sky that goes round the horizon once
// (a level's `skyWrap: 1`) can have a sunset: `glow: { at, width, color,
// amount, dim }` warms it toward `color` round `at` (a share of the width:
// texel u is (360 - azimuth) / 360 of it, the engine's angles running
// clockwise), `width` its spread, strongest toward the bottom, and darkens
// the far side by up to `dim`; `suns: [{ at, row, rx, ry, color }]` paints
// soft discs (`row` their middle, the horizon 6 rows above the bottom). With no `gradient` a texture keeps the source's own
// colours (the bay's fuel pump panels).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodePNG, encodePNG } from '../../tools/art/lib/png.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const texDir = path.join(here, 'textures');

/** Tatooine sandstone, from pale dust to deep shadow. */
const SANDSTONE = [[24, 16, 12], [70, 48, 34], [124, 90, 62], [172, 134, 96], [210, 178, 136], [236, 216, 182]];

export const DERIVED = [
  // The canyon walls: sandstone, with darker and paler strata for the cliffs' ledges.
  { out: 'sandstone', from: 'canyon-rock', gradient: SANDSTONE, keep: 0.5, contrast: 1.05 },
  { out: 'sandstone-dark', from: 'canyon-rock', gradient: [[18, 10, 8], [56, 32, 24], [100, 62, 42], [140, 94, 64], [176, 132, 96]], keep: 0.5, contrast: 1.1 },
  { out: 'sandstone-pale', from: 'canyon-rock', gradient: [[40, 32, 24], [96, 80, 62], [150, 130, 102], [196, 178, 146], [232, 220, 196]], keep: 0.4, contrast: 0.95 },
  // The canyon floor: sand, and darker gravel in the washes.
  { out: 'desert-sand', from: 'sand', gradient: [[52, 38, 26], [104, 80, 56], [148, 118, 84], [182, 152, 112], [206, 180, 140]], keep: 0.2, contrast: 0.55 },
  { out: 'desert-gravel', from: 'sand', gradient: [[40, 30, 22], [86, 68, 48], [124, 100, 72], [158, 130, 96], [190, 164, 126]], keep: 0.2, contrast: 1.15 },
];

/**
 * A bay fitting's wear: blotches of orange rust and of dark soot and oil,
 * `amount` of the way to full (they tile on a square texture).
 */
const WORN = (cell, seed, amount = 1) => [
  { color: [128, 64, 28], amount: 0.7 * amount, cell, seed },
  { color: [18, 14, 10], amount: 0.65 * amount, cell, seed: seed + 10, from: 0.45 },
];
/** A pipe's plain copper (a gradient of one colour: the source's grain is dropped). */
const COPPER = [164, 102, 59];

/** Mos Eisley's walls, roofs, streets and sky: warm plaster and packed sand under a pale, dusty sky. */
// (Key colours from the palette's sand and beige ramps: pale tones between
// them snap to olive greys in the game.)
const PLASTER = [[96, 74, 48], [137, 109, 74], [179, 151, 109], [199, 172, 129], [216, 193, 152], [232, 214, 176]];
const WHITEWASH = [[95, 86, 66], [153, 141, 112], [181, 169, 138], [209, 198, 168], [236, 226, 198]];
const OCHRE = [[110, 76, 46], [176, 130, 88], [214, 160, 112], [224, 170, 120], [232, 186, 140], [240, 206, 166]];
const ROSE = [[110, 80, 60], [186, 150, 120], [226, 190, 156], [236, 200, 166], [240, 214, 184]];
const GREY = [[80, 76, 68], [124, 118, 106], [164, 156, 142], [180, 172, 156], [196, 188, 170], [214, 206, 188]];
const DURACRETE = [[56, 44, 32], [108, 92, 70], [156, 136, 106], [192, 172, 138], [216, 200, 168]];
export const TOWN = [
  // Smooth plaster: Gromas' plain speckled wall.
  { out: 'adobe', df: 'GWANO', crop: [0, 0, 128, 128], smooth: 1, gradient: PLASTER, keep: 0, contrast: 0.35 },
  // Whitewash, paler and cooler.
  { out: 'adobe-pale', df: 'GWANO', crop: [0, 0, 128, 128], smooth: 1, gradient: WHITEWASH, keep: 0, contrast: 0.35 },
  // More plasters, so a street isn't one colour: ochre (the palette's rust
  // ramp: it has no golden ochres, so it comes out terracotta), rose (a
  // pale peach, its skin ramp) and grey (its concrete ramp).
  { out: 'adobe-ochre', df: 'GWANO', crop: [0, 0, 128, 128], smooth: 1, gradient: OCHRE, keep: 0, contrast: 0.35 },
  { out: 'adobe-rose', df: 'GWANO', crop: [0, 0, 128, 128], smooth: 1, gradient: ROSE, keep: 0, contrast: 0.35 },
  { out: 'adobe-grey', df: 'GWANO', crop: [0, 0, 128, 128], smooth: 1, gradient: GREY, keep: 0, contrast: 0.35 },
  // The dirty foot of every wall: sand kicked up and rain-less grime, darker
  // toward the ground. A band 1 tile high shows its top 32 rows.
  { out: 'adobe-skirt', df: 'GWANO', crop: [0, 0, 128, 32], gradient: [[56, 40, 24], [96, 72, 46], [128, 100, 68], [150, 122, 86], [170, 144, 106]], keep: 0, contrast: 0.6, fade: { color: [84, 62, 40], from: 0 } },
  // The homestead's pits (lib/farm.js): bare earth above, warm tan to ochre
  // with Gromas' vertical runnels; the whitewash's wavy top edge, a tile
  // tall; and the red-ochre dado along the foot, darker toward the ground.
  { out: 'pit-earth', df: 'GWDIRTLT', gradient: [[70, 46, 26], [124, 88, 54], [168, 124, 80], [196, 154, 104], [218, 182, 132]], keep: 0, contrast: 0.75 },
  { out: 'pit-wash-edge', df: 'GWANO', crop: [0, 0, 128, 32], smooth: 1, gradient: WHITEWASH, keep: 0, contrast: 0.35, edge: { rows: 12, amp: 7, seed: 31 } },
  { out: 'pit-dado', df: 'GWANO', crop: [0, 0, 128, 32], smooth: 1, gradient: [[60, 24, 14], [102, 44, 26], [132, 62, 38], [150, 76, 48], [166, 92, 60]], keep: 0, contrast: 0.5, fade: { color: [54, 26, 16], from: 0.4 }, lip: [{ rows: 1, color: [196, 150, 112], amount: 0.35 }] },
  // Under the homestead (m2): the house's smooth white plaster (its rooms'
  // vaults, the kitchen's walls and counters), the dark damp duracrete of
  // the reservoir's and the cistern's vaults, a bronze grating (the
  // garage's round floor), a band of pipes along a wall (the bottom of a
  // pipe-run wall, 2 tiles tall) and a red rug (Jedi Knight-ish
  // squares from Jabba's ship, in deep reds).
  { out: 'plaster-white', df: 'GWANO', crop: [0, 0, 128, 128], smooth: 2, gradient: [[120, 112, 92], [178, 170, 146], [208, 202, 178], [226, 222, 202], [240, 238, 224]], keep: 0, contrast: 0.25 },
  { out: 'duracrete', df: 'GWANO', crop: [0, 0, 128, 128], smooth: 1, gradient: [[34, 30, 26], [70, 62, 52], [104, 94, 78], [130, 118, 98], [150, 138, 116]], keep: 0, contrast: 0.6, rust: [{ color: [22, 18, 14], amount: 0.5, cell: 32, seed: 211 }, { color: [90, 70, 46], amount: 0.25, cell: 16, seed: 213 }] },
  { out: 'grate-bronze', df: 'ZPGRTE3X', gradient: [[14, 10, 6], [52, 36, 22], [98, 70, 42], [140, 104, 64], [176, 138, 90]], keep: 0, contrast: 1, rust: [{ color: [10, 8, 6], amount: 0.4, cell: 32, seed: 215 }] },
  { out: 'pipe-band', df: 'IWAPIPE1', crop: [0, 64, 128, 64], gradient: [[16, 14, 12], [52, 46, 40], [96, 86, 74], [140, 128, 110], [190, 178, 156]], keep: 0.1, contrast: 1, rust: WORN(16, 217, 0.3) },
  { out: 'rug-red', df: 'JPSQUAR1', gradient: [[34, 10, 10], [80, 20, 18], [122, 34, 28], [156, 62, 44], [186, 120, 80]], keep: 0, contrast: 1 },
  // The courtyard's condenser panel (models/vaporator.js): Nar Shaddaa's
  // slatted vent in worn white, and JabShip's ring of fins as its gear disc.
  { out: 'panel-ribs', df: 'NPVENTS2', gradient: [[70, 68, 62], [130, 126, 116], [184, 180, 168], [214, 210, 198], [232, 228, 216]], keep: 0, contrast: 0.9, rust: WORN(16, 211, 0.35) },
  { out: 'gear-disc', df: 'JPCIRCL2', gradient: [[40, 40, 40], [96, 94, 88], [150, 146, 136], [196, 192, 180], [224, 220, 208]], keep: 0, contrast: 1.2 },
  // Weathered plaster, darker and dirtier, for the old quarter.
  { out: 'adobe-old', df: 'ZPMARBY1', gradient: [[34, 24, 16], [86, 62, 42], [136, 104, 72], [178, 144, 104], [206, 178, 136]], keep: 0.1, contrast: 0.7 },
  // Sun-bleached wooden planks (doors, shutters, stalls): TestBase's streaked granite.
  { out: 'planks', df: 'IWGRAN5', gradient: [[34, 24, 16], [86, 62, 42], [136, 104, 72], [178, 144, 104], [206, 178, 136]], keep: 0.1, contrast: 0.5 },
  // Mud brick where the plaster is gone.
  { out: 'adobe-brick', df: 'ZPBRICK1', gradient: [[30, 20, 12], [80, 56, 36], [130, 96, 64], [168, 132, 92], [196, 164, 120]], keep: 0.1, contrast: 1 },
  // Flat roofs of packed clay.
  { out: 'adobe-roof', df: 'IPGREYC2', gradient: [[50, 36, 24], [104, 80, 56], [146, 116, 82], [180, 150, 110], [204, 178, 136]], keep: 0.1, contrast: 0.8 },
  // The street: sand packed hard, and flagstones in the plazas.
  { out: 'street-sand', df: 'ZPROCK02', gradient: [[62, 46, 30], [116, 90, 62], [160, 128, 92], [192, 162, 120], [214, 188, 146]], keep: 0.1, contrast: 0.6 },
  // Loose sand the wind piles against the walls: paler and softer.
  { out: 'street-drift', df: 'ZPROCK02', smooth: 1, gradient: [[150, 120, 82], [199, 172, 129], [216, 193, 152], [232, 214, 176]], keep: 0, contrast: 0.5 },
  // Small pale tiles lining a doorway's jamb: ZPTILE4's bevelled square, 8 x 16
  // texels, repeated 8 by 4. The jamb lays them a quarter tile along the doorway
  // (Mark's reference has small ones) and half a tile across its depth, one row
  // each side of the door (models/door-jamb.js): 32 texels a tile both ways, as
  // the walls are.
  { out: 'door-jamb', df: 'ZPTILE4', scale: [8, 16], tile: [8, 4], gradient: [[104, 66, 44], [200, 150, 112], [234, 198, 160], [250, 228, 200]], keep: 0, contrast: 1 },
  { out: 'flagstone', df: 'IPDET1', gradient: [[44, 32, 22], [100, 78, 56], [150, 122, 90], [190, 162, 124], [220, 198, 160]], keep: 0.1, contrast: 0.9 },
  // Corrugated tin for lean-to roofs: TestBase's ribbed panel, its ribs
  // running down the texture, rusted (`rust`: blotches of rust that tile)
  // or galvanised grey going rusty.
  { out: 'metal-rust', df: 'ZWGRUV1', crop: [0, 0, 32, 64], tile: [2, 1], gradient: [[30, 16, 8], [74, 40, 18], [120, 66, 32], [160, 96, 52], [190, 130, 82]], keep: 0, contrast: 0.9, rust: { color: [52, 26, 12], amount: 0.6, cell: 16, seed: 1 } },
  { out: 'metal-grey', df: 'ZWGRUV1', crop: [0, 0, 32, 64], tile: [2, 1], gradient: [[40, 40, 40], [88, 86, 82], [130, 126, 118], [166, 160, 150], [196, 190, 178]], keep: 0, contrast: 0.9, rust: { color: [120, 64, 30], amount: 0.5, cell: 16, seed: 2 } },
  // The sandcrawler's hull (models/sandcrawler.js): Ramshed's ship plating,
  // its plain grid of panels, in rusty brown after Mark's pictures, with
  // orange rust, the faded yellow patches and soot toward the foot. Doubled
  // down so the stains tile both ways; the model draws it at twice the
  // walls' scale, so a panel is about a tile.
  { out: 'crawler-hull', df: 'IWSHIP0', crop: [384, 56, 128, 64], tile: [1, 2], gradient: [[30, 18, 12], [72, 44, 28], [112, 70, 44], [146, 98, 66], [176, 130, 94]], keep: 0, contrast: 1.1, rust: [{ color: [150, 70, 24], amount: 0.55, cell: 32, seed: 101 }, { color: [190, 150, 44], amount: 0.75, cell: 32, seed: 103, from: 0.62 }, { color: [22, 16, 12], amount: 0.4, cell: 32, seed: 105, from: 0.55 }] },
  // The smelter's melt (models/furnace.js), drawn glowing: Robotics' acid
  // floor run hot, dark red crust to yellow-white where it's hottest.
  { out: 'melt', df: 'RPACID01', gradient: [[48, 10, 4], [120, 24, 6], [200, 60, 10], [236, 112, 20], [250, 170, 50]], keep: 0, contrast: 1.4 },
  // The junk yard's ground (models/clutter.js, the deck plates): salvaged
  // plates laid on the sand to walk on. Generic's riveted plate in dusty
  // grey-brown, rusty and oily; and Sewers' rust-eaten sheet, its own rust
  // kept.
  { out: 'yard-plate', df: 'ZPRIVET1', gradient: [[34, 30, 26], [72, 66, 58], [112, 104, 92], [146, 136, 120], [174, 164, 146]], keep: 0, contrast: 1, rust: WORN(16, 141, 0.8) },
  { out: 'yard-plate-rust', df: 'SPMETAL1', gradient: [[30, 24, 20], [70, 60, 52], [108, 98, 86], [140, 130, 114]], keep: 0.6, contrast: 1, rust: WORN(16, 143, 0.4) },
  // The cargo pod's hull (models/clutter.js): the galvanised tin again, rusty
  // and scorched with soot.
  { out: 'pod-hull', df: 'ZWGRUV1', crop: [0, 0, 32, 64], tile: [2, 1], gradient: [[40, 40, 40], [88, 86, 82], [130, 126, 118], [166, 160, 150], [196, 190, 178]], keep: 0, contrast: 0.9, rust: [{ color: [120, 64, 30], amount: 0.5, cell: 16, seed: 2 }, ...WORN(16, 61, 0.8)] },
  // The drums' and canisters' bodies (models/clutter.js): the same tins with
  // soot and oil blotched over them.
  { out: 'drum-rust', df: 'ZWGRUV1', crop: [0, 0, 32, 64], tile: [2, 1], gradient: [[30, 16, 8], [74, 40, 18], [120, 66, 32], [160, 96, 52], [190, 130, 82]], keep: 0, contrast: 0.9, rust: [{ color: [52, 26, 12], amount: 0.6, cell: 16, seed: 1 }, { color: [18, 14, 10], amount: 0.45, cell: 16, seed: 71, from: 0.5 }] },
  { out: 'drum-grey', df: 'ZWGRUV1', crop: [0, 0, 32, 64], tile: [2, 1], gradient: [[40, 40, 40], [88, 86, 82], [130, 126, 118], [166, 160, 150], [196, 190, 178]], keep: 0, contrast: 0.9, rust: [{ color: [120, 64, 30], amount: 0.5, cell: 16, seed: 2 }, { color: [18, 14, 10], amount: 0.55, cell: 16, seed: 73, from: 0.45 }] },
  // The condenser tower's lid and cap (models/market.js): Generic's riveted
  // plate in weathered steel, one panel a facet, bolts at its corners.
  { out: 'cone-panel', df: 'ZPPANEL1', gradient: [[38, 36, 32], [84, 80, 74], [128, 124, 114], [164, 158, 146], [192, 186, 172]], keep: 0, contrast: 1.25, rust: WORN(16, 81, 0.25) },
  // Its condenser plates: JabShip's ring of radial fins, in steel, drawn on
  // each plate's faces, and a pale steel lip round each edge.
  { out: 'fin-disc', df: 'JPCIRCL2', gradient: [[26, 26, 28], [64, 64, 64], [112, 110, 104], [160, 156, 146], [196, 192, 180]], keep: 0, contrast: 1.3 },
  { out: 'fin-edge', df: 'IPDETPIP', crop: [32, 0, 16, 16], gradient: [[64, 64, 62], [110, 108, 104], [150, 146, 138], [182, 178, 168]], keep: 0, contrast: 0.8 },
  // Still water in the plaza's trough and basin (models/market.js): Talay's
  // rippled water, murky green-blue, glinting pale on the ripples.
  { out: 'water-murky', df: 'CFWATER4', gradient: [[16, 30, 32], [30, 56, 58], [50, 86, 88], [84, 120, 118], [146, 170, 160]], keep: 0, contrast: 1 },
  // The condenser tower's pipes (models/market.js): plain copper, rust and
  // soot blotched over it, no rings (Mark, 2026-10-21: too many of them).
  // The facets' light makes them round.
  { out: 'pipe-rust', df: 'IPDETPIP', crop: [39, 0, 1, 8], tile: [16, 8], gradient: [COPPER, COPPER], rust: WORN(8, 91, 0.6) },
  // The market stalls' wares (models/market.js): the landspeeder's mottled
  // panel in fresher paints than the bay's, lightly worn: goods for sale are
  // cared for, but this is still Tatooine.
  { out: 'ware-red', df: 'IWGREYC2', scale: [32, 32], gradient: [[66, 18, 14], [134, 34, 26], [176, 54, 42], [204, 88, 70]], keep: 0, contrast: 0.7, rust: WORN(16, 61, 0.25) },
  { out: 'ware-blue', df: 'IWGREYC2', scale: [32, 32], gradient: [[18, 28, 56], [38, 62, 112], [66, 98, 148], [112, 146, 186]], keep: 0, contrast: 0.7, rust: WORN(16, 63, 0.25) },
  { out: 'ware-yellow', df: 'IWGREYC2', scale: [32, 32], gradient: [[92, 72, 16], [154, 126, 32], [190, 162, 58], [216, 196, 110]], keep: 0, contrast: 0.7, rust: WORN(16, 65, 0.25) },
  { out: 'ware-teal', df: 'IWGREYC2', scale: [32, 32], gradient: [[16, 50, 50], [34, 92, 90], [62, 128, 122], [112, 164, 158]], keep: 0, contrast: 0.7, rust: WORN(16, 67, 0.25) },
  { out: 'ware-orange', df: 'IWGREYC2', scale: [32, 32], gradient: [[88, 44, 14], [150, 78, 28], [188, 110, 50], [212, 146, 98]], keep: 0, contrast: 0.7, rust: WORN(16, 69, 0.25) },
  { out: 'ware-white', df: 'IWGREYC2', scale: [32, 32], gradient: [[100, 98, 92], [160, 158, 150], [200, 198, 188], [224, 222, 212]], keep: 0, contrast: 0.7, rust: WORN(16, 71, 0.25) },
  // The condenser tower's bands and rings (models/market.js): the bay's
  // ribbed pipe in dark steel, unrusted, so a thin band has fine ribs and
  // reads as one band.
  { out: 'band-steel', df: 'IPDETPIP', crop: [32, 0, 16, 16], gradient: [[34, 34, 36], [54, 54, 56], [72, 72, 72], [92, 91, 88]], keep: 0, contrast: 0.8 },
  // Street clutter (models/clutter.js): cargo crates from Ramshed's, in
  // tan, grey and rust, and a heap of junk from TestBase's trash pile.
  { out: 'crate-tan', df: 'IPRMCRT3', gradient: [[56, 44, 28], [112, 90, 60], [160, 134, 96], [196, 172, 130], [222, 202, 162]], keep: 0.15, contrast: 0.85 },
  { out: 'crate-grey', df: 'IPRMCRT9', gradient: [[40, 40, 38], [86, 84, 78], [130, 126, 116], [170, 166, 154], [204, 198, 184]], keep: 0.4, contrast: 0.85 },
  { out: 'crate-rust', df: 'IPRMCRT8', gradient: [[44, 22, 10], [96, 52, 24], [146, 86, 44], [184, 122, 72], [212, 158, 108]], keep: 0.2, contrast: 0.85 },
  { out: 'junk', df: 'IPTRSHC1', gradient: [[22, 16, 10], [62, 48, 32], [110, 90, 64], [154, 132, 98], [196, 176, 138]], keep: 0.35, contrast: 1.1 },
  // Docking bays: pale duracrete (Talay's capitol walls), its foot braced by
  // angled buttresses; the plain panels above them; the floor in bolted slabs.
  { out: 'bay-wall-ribbed', df: 'TWCAP01', gradient: DURACRETE, keep: 0.1, contrast: 0.8 },
  { out: 'bay-wall', df: 'TWCAP01', crop: [0, 0, 128, 64], gradient: DURACRETE, keep: 0.1, contrast: 0.8 },
  { out: 'bay-floor', df: 'ZPCMENT2', scale: [128, 128], gradient: [[62, 46, 30], [116, 90, 62], [160, 128, 92], [192, 162, 120], [214, 188, 146]], keep: 0.1, contrast: 0.6 },
  // The bay's stair risers: the same duracrete in shade (the palette's sand
  // ramp, so it stays brown once lit), darker toward the
  // foot, under a pale worn nosing and its shadow line (`lip`). A face's top
  // row sits at the step's edge, so every step gets the lip and reads
  // against the lit treads above and below it.
  // The derelict bay's (m1.js, Mark 2026-11-01: dirtier): Bay 87's wall and
  // floor, darker and stained with soot, oil and rust.
  { out: 'derelict-wall', df: 'TWCAP01', crop: [0, 0, 128, 64], gradient: [[40, 30, 22], [86, 72, 54], [128, 110, 84], [160, 142, 112], [184, 168, 138]], keep: 0.1, contrast: 0.85, rust: [{ color: [110, 60, 30], amount: 0.2, cell: 64, seed: 171, from: 0.55 }, { color: [20, 16, 12], amount: 0.4, cell: 64, seed: 181, from: 0.5 }] },
  { out: 'derelict-floor', df: 'ZPCMENT2', scale: [128, 128], gradient: [[44, 32, 22], [92, 72, 50], [132, 106, 76], [162, 136, 100], [184, 160, 124]], keep: 0.1, contrast: 0.65, rust: [{ color: [16, 12, 8], amount: 0.7, cell: 32, seed: 173, from: 0.5 }, { color: [96, 56, 30], amount: 0.35, cell: 16, seed: 183 }] },
  { out: 'bay-step', df: 'TWCAP01', crop: [0, 0, 128, 32], gradient: [[62, 46, 28], [104, 80, 52], [128, 100, 68], [150, 120, 82]], keep: 0, contrast: 0.7, fade: { color: [62, 46, 28], from: 0.3 }, lip: [{ rows: 3, color: [232, 214, 176], amount: 0.7 }, { rows: 2, color: [28, 20, 12], amount: 0.7 }] },
  // Docking Bay 87's fuel pump (models/bay.js), cut from FuelStat's panels
  // and left in their own colours: the gauges and valve wheel for its front,
  // a hazard band, the louvres and brass plate of its sides, a grey machine
  // plate and, dark, the ribbed hose wound on its reel.
  { out: 'pump-front', df: 'IWFUEL2', crop: [2, 28, 54, 50], scale: [32, 32], rust: WORN(16, 21) },
  { out: 'pump-side', df: 'IWFUEL9', crop: [36, 26, 56, 102], scale: [32, 64], rust: WORN(16, 23) },
  { out: 'pump-hazard', df: 'NWWARN1', crop: [0, 8, 64, 16], rust: WORN(16, 25, 1.2) },
  { out: 'bay-plate', df: 'ZPGREYP1', rust: WORN(16, 27) },
  // Its fuel lines (models/bay.js): plain copper pipe, as the condenser
  // tower's but rustier, a manifold's front of brass elbow, truss and
  // gauge, and the valve wheel from the pump's panel.
  { out: 'bay-pipe', df: 'IPDETPIP', crop: [39, 0, 1, 8], tile: [16, 8], gradient: [COPPER, COPPER], rust: WORN(8, 29, 0.8) },
  { out: 'line-front', df: 'IWFUEL1', crop: [0, 32, 64, 96], scale: [64, 128], rust: WORN(16, 31) },
  { out: 'valve-wheel', df: 'IWFUEL2', crop: [20, 49, 18, 18], scale: [16, 16], rust: WORN(8, 33, 0.7) },
  { out: 'pump-hose', df: 'IWFUEL3', crop: [0, 32, 64, 64], gradient: [[6, 6, 6], [26, 26, 24], [52, 52, 48], [84, 84, 78]], keep: 0, contrast: 1, rust: WORN(16, 43, 0.5) },
  // The hoses on the floor: the same ribs in perished orange rubber.
  { out: 'hose-orange', df: 'IWFUEL3', crop: [0, 32, 64, 64], gradient: [[40, 18, 6], [96, 48, 18], [150, 80, 30], [190, 112, 50]], keep: 0, contrast: 1, rust: WORN(16, 45, 0.8) },
  // The X-34 landspeeder (models/speeder.js): Gromas' mottled grey panel
  // as its peach paint and the rose of its stripes, worn through to rust and
  // chipped grey-green where the paint has gone (Mark's photo of the prop);
  // the engines' metal, darker and rustier; and one of the Avenger's round
  // engine intakes for the front of each engine.
  { out: 'speeder-paint', df: 'IWGREYC2', gradient: [[110, 72, 54], [176, 128, 102], [212, 164, 136], [228, 186, 158], [238, 204, 180]], keep: 0, contrast: 0.6, rust: [{ color: [120, 62, 34], amount: 0.7, cell: 16, seed: 5, from: 0.64 }, { color: [118, 120, 98], amount: 0.5, cell: 8, seed: 7, from: 0.66 }] },
  { out: 'speeder-red', df: 'IWGREYC2', gradient: [[74, 32, 24], [130, 58, 46], [168, 84, 68], [188, 104, 86], [204, 124, 104]], keep: 0, contrast: 0.6, rust: { color: [80, 38, 20], amount: 0.6, cell: 16, seed: 6, from: 0.62 } },
  { out: 'speeder-metal', df: 'IWGREYC2', gradient: [[28, 24, 20], [66, 60, 54], [104, 98, 90], [134, 128, 118], [160, 154, 142]], keep: 0, contrast: 0.8, rust: { color: [112, 54, 28], amount: 0.6, cell: 16, seed: 8, from: 0.56 } },
  // The gutted freighter (models/freighter.js): plain plate, a seam a tile
  // (Mark, 2026-11-01: the tin was too patterned), sun-faded grey under soot
  // and rust; its engines darker and scorched.
  { out: 'freighter-hull', df: 'IWGREYC2', gradient: [[34, 30, 26], [84, 78, 70], [126, 120, 110], [154, 148, 136], [176, 170, 156]], keep: 0, contrast: 0.7, rust: [{ color: [118, 66, 34], amount: 0.35, cell: 8, seed: 151, from: 0.6 }, { color: [26, 22, 18], amount: 0.45, cell: 8, seed: 161, from: 0.5 }] },
  { out: 'freighter-engine', df: 'IWGREYC2', gradient: [[14, 12, 10], [40, 36, 32], [70, 64, 58], [96, 90, 82], [120, 112, 102]], keep: 0, contrast: 0.8, rust: [{ color: [96, 50, 26], amount: 0.5, cell: 16, seed: 153 }, { color: [8, 6, 4], amount: 0.8, cell: 16, seed: 163, from: 0.4 }] },
  // The freighter's hold (m1.js, Mark 2026-11-01: a derelict ship inside):
  // Jabba's ship's grey panelling, mesh deck and ceiling, grimed and rusted;
  // its machinery and pipes, dark, where panels are gone.
  { out: 'hold-wall', df: 'ZWJABPI1', gradient: [[22, 20, 18], [56, 52, 46], [92, 86, 76], [122, 114, 100], [144, 134, 118]], keep: 0.1, contrast: 0.85, rust: [{ color: [96, 54, 28], amount: 0.15, cell: 32, seed: 191 }, { color: [14, 12, 10], amount: 0.6, cell: 32, seed: 193, from: 0.55 }] },
  { out: 'hold-ceiling', df: 'JWBIG01', crop: [0, 128, 128, 128], gradient: [[16, 15, 14], [42, 40, 36], [70, 66, 60], [94, 88, 80], [112, 104, 94]], keep: 0, contrast: 0.85, rust: [{ color: [10, 9, 8], amount: 0.6, cell: 32, seed: 195 }] },
  { out: 'hold-floor', df: 'ZPJABMES', gradient: [[10, 9, 8], [36, 33, 30], [66, 60, 54], [94, 86, 76], [112, 102, 90]], keep: 0, contrast: 0.9, rust: [{ color: [70, 40, 22], amount: 0.4, cell: 16, seed: 197 }, { color: [6, 5, 4], amount: 0.6, cell: 32, seed: 199 }] },
  { out: 'hold-guts', df: 'JPMACH1', crop: [0, 12, 64, 40], scale: [64, 64], gradient: [[6, 6, 6], [30, 27, 24], [60, 54, 46], [92, 82, 68], [118, 104, 84]], keep: 0.15, contrast: 1 },
  { out: 'hold-pipes', df: 'ZPJABPI1', gradient: [[6, 6, 6], [28, 26, 24], [58, 54, 48], [88, 80, 70], [110, 100, 86]], keep: 0.1, contrast: 1, rust: [{ color: [90, 48, 24], amount: 0.35, cell: 16, seed: 201 }] },
  { out: 'speeder-intake', df: 'IWENGBAC', crop: [16, 12, 104, 104], scale: [32, 32], gradient: [[8, 8, 8], [34, 32, 30], [76, 72, 66], [128, 122, 112], [170, 164, 152]], keep: 0.2, contrast: 1 },
  // A scrapped astromech's dome (models/clutter.js, droid-dome): the
  // landspeeder's mottled panel in dirty white paint and in faded blue,
  // scorched and rusted through.
  { out: 'dome-white', df: 'IWGREYC2', scale: [32, 32], gradient: [[96, 94, 88], [150, 148, 140], [196, 194, 186], [224, 222, 214], [240, 238, 230]], keep: 0, contrast: 0.7, rust: WORN(16, 51, 0.9) },
  { out: 'dome-blue', df: 'IWGREYC2', scale: [32, 32], gradient: [[10, 22, 54], [28, 56, 112], [58, 100, 168], [96, 140, 196]], keep: 0, contrast: 0.7, rust: WORN(16, 53, 0.7) },
  // The skyhopper (models/farm.js, after Mark's T-16 references): a pane
  // of Talay's window, its soft highlight kept, as the cockpit's dark
  // tinted glass; the landspeeder's mottled grey, darker than the hull,
  // for the airfoils' rims, the glass's frame and the fittings; and the
  // skin of Dark Forces' own TIE engine, near black and oily, for the
  // machinery and guns under it. Its pale parts wear the dome's white.
  { out: 'hopper-glass', df: 'TWILI10A', crop: [12, 47, 44, 76], scale: [32, 64], gradient: [[12, 16, 22], [22, 30, 38], [36, 48, 58], [58, 74, 86], [92, 110, 122]], keep: 0, contrast: 1 },
  { out: 'hopper-metal', df: 'IWGREYC2', gradient: [[30, 30, 30], [68, 68, 66], [100, 100, 96], [126, 124, 118], [148, 146, 138]], keep: 0, contrast: 0.8, rust: WORN(16, 211, 0.4) },
  { out: 'hopper-dark', df: 'ENGTEXTS', gradient: [[8, 8, 8], [22, 22, 22], [36, 36, 34], [52, 50, 48], [70, 68, 64]], keep: 0.1, contrast: 1 },
  // The blast doors across the main street (m1.js), the one Imperial thing
  // the town has, years in the suns: Nar Shaddaa's grimy X-braced door and
  // streaked plate in sand-scoured steel, rust and soot over them, and its
  // faded warning stripes for the frame's foot. The door keeps a little of
  // its stripes' yellow (`keep`).
  { out: 'blast-door-rising', df: 'NDPIPES4', gradient: [[22, 18, 14], [62, 54, 44], [104, 96, 84], [142, 134, 118], [178, 170, 150]], keep: 0.35, contrast: 1, rust: [{ color: [128, 64, 28], amount: 0.6, cell: 32, seed: 101 }, { color: [18, 14, 10], amount: 0.6, cell: 16, seed: 111, from: 0.45 }] },
  // The derelict bay's balcony railing (m1.js): DF's grate as a railing, as
  // the Imperial one is, in rusty, sooted steel.
  { out: 'rail-rust', df: 'ZMGRATE1', scale: [64, 24], holes: true, gradient: [[26, 18, 12], [70, 54, 40], [112, 90, 70], [146, 124, 100]], keep: 0.2, contrast: 1.1, rust: WORN(8, 149, 1) },
  { out: 'blast-steel', df: 'NWGREY01', tile: [2, 1], gradient: [[30, 24, 18], [74, 66, 56], [112, 104, 92], [146, 138, 122], [176, 168, 150]], keep: 0, contrast: 1.1, rust: [{ color: [128, 64, 28], amount: 0.6, cell: 32, seed: 103 }, { color: [18, 14, 10], amount: 0.5, cell: 16, seed: 113, from: 0.55 }] },
  { out: 'blast-beam', df: 'NWEXT06', gradient: [[26, 20, 16], [68, 60, 50], [108, 100, 88], [144, 136, 120], [174, 166, 148]], keep: 0.2, contrast: 1.1, rust: WORN(16, 105, 0.7) },
  { out: 'blast-hazard', df: 'NPWRNFAD', gradient: [[34, 28, 20], [80, 70, 56], [128, 116, 94], [164, 150, 120]], keep: 0.6, contrast: 1, rust: WORN(16, 107, 1) },
  // The checkpoint (m1.js): Mos Eisley's barricades in SecBase's grey plate
  // (the garrison's wear it clean), dusted with sand, sooty, rust where
  // they're scraped; and the old quarter's door, Docking Bay 87's X-braced
  // door gone rustier.
  { out: 'barricade-worn', df: 'IWSECB2', tile: [2, 1], gradient: [[30, 28, 26], [74, 70, 64], [116, 110, 100], [150, 142, 128], [176, 168, 150]], keep: 0.3, contrast: 0.9, rust: [{ color: [176, 146, 104], amount: 0.55, cell: 32, seed: 121 }, { color: [128, 64, 28], amount: 0.5, cell: 16, seed: 123, from: 0.6 }, { color: [18, 14, 10], amount: 0.5, cell: 16, seed: 125, from: 0.5 }] },
  { out: 'door-gate-rising', df: 'RDBIG4', gradient: [[22, 20, 18], [58, 54, 48], [98, 92, 82], [138, 130, 116]], keep: 0.2, contrast: 1, rust: WORN(16, 127, 0.8) },
  // An evening for the homestead (m2.js, skyWrap 1): Robotics' cloudy sky
  // in mauve overhead to rose, a pale warm amber at the horizon, glowing in
  // the west-south-west where the two suns are setting (az 196 and 204, 14
  // and 18 degrees up: the lower one more orange), the east dimmer. Four
  // times wide, as it goes round once rather than twice.
  { out: 'sky-dusk', df: 'RESKY01', gradient: [[64, 46, 78], [108, 72, 104], [152, 98, 120], [190, 128, 132], [214, 160, 146]], keep: 0.15, contrast: 0.8, tile: [4, 1], fade: { color: [220, 164, 122], from: 0.5 },
    glow: { at: 0.444, width: 0.1, color: [244, 204, 146], amount: 0.75, dim: 0.12 },
    suns: [{ at: 0.4556, row: 217, rx: 7, ry: 6, color: [252, 168, 96] }, { at: 0.4333, row: 207, rx: 7, ry: 6, color: [254, 238, 206] }] },
  // A hazy day: Robotics' pale cloudy sky, twice as wide, warming to dust at the horizon.
  { out: 'sky-day', df: 'RESKY01', gradient: [[74, 128, 182], [120, 166, 206], [168, 198, 222], [214, 226, 236]], keep: 0.3, contrast: 0.9, tile: [2, 1], fade: { color: [212, 200, 174], from: 0.55 } },
];

/**
 * The battle station (m4, docs/mission4.md): pale cool grey walls, glossy
 * black decks, white light. As TOWN: straight from the pack, no generated
 * stand-in. `rects: [[x, y, w, h, colour]]` paints rectangles over the
 * result (a light bar, a painted line, a marker lamp: palette glow
 * colours, so they shine); `paint` draws one from nothing (PAINT below).
 */
const PALE = [[52, 54, 60], [100, 100, 99], [140, 139, 137], [182, 180, 176], [214, 212, 206]];
// (The corridor wall's: a narrow range, so the plate is nearly plain.)
const PALE_WALL = [[120, 120, 118], [140, 139, 137], [160, 159, 156], [182, 180, 176], [200, 198, 192]];
const GUNMETAL = [[9, 10, 14], [26, 29, 37], [45, 49, 61], [64, 70, 86], [84, 91, 111]];
const BLACK = [[4, 4, 6], [12, 13, 17], [22, 24, 30], [36, 38, 46], [58, 62, 74]];
const TUBE = [214, 232, 255];
const RED = [255, 40, 30];
const DIM_RED = [150, 10, 10];
// The pale wall floor to ceiling, for a room `rows` texels high (192: 6
// units; 256: 8): a dark trim under the ceiling, a seam every 2 units and
// a black skirting at the floor. Walls hang from the ceiling, so the rows
// under the skirting are never seen in a room that high.
const PALE_SEAMS = [[0, 0, 1, 256, [120, 120, 118]], [32, 0, 1, 256, [120, 120, 118]], ...[64, 128, 192].flatMap((y) => [[0, y, 64, 1, [100, 100, 99]], [0, y + 1, 64, 1, [196, 194, 188]]])];
const paleWall = (rows) => [
  ...PALE_SEAMS,
  [0, 0, 64, 10, [26, 29, 37]], [0, 10, 64, 1, [84, 91, 111]], [0, 11, 64, 1, [100, 100, 99]],
  [0, rows - 17, 64, 1, [100, 100, 99]], [0, rows - 16, 64, 1, [64, 70, 86]], [0, rows - 15, 64, 15, [12, 13, 17]],
];
// A switch's panel in it, its middle 1.3 units over the floor of a room 6 high.
const switchPanel = (lamp) => [[22, 140, 20, 20, [26, 29, 37]], [25, 143, 14, 6, lamp], [25, 152, 6, 5, [64, 70, 86]], [33, 152, 6, 5, [64, 70, 86]]];
const PALE_TALL = { df: 'IPEXFLR2', smooth: 2, tile: [1, 4], gradient: PALE_WALL, keep: 0, contrast: 0.25 };
export const STATION = [
  // The corridor wall: the Executor's pale panelled plate.
  { out: 'ds-wall', df: 'IPEXFLR2', smooth: 2, gradient: PALE_WALL, keep: 0, contrast: 0.25, rects: [[0, 0, 64, 1, [100, 100, 99]], [0, 1, 64, 1, [196, 194, 188]], [0, 0, 1, 64, [120, 120, 118]], [32, 0, 1, 64, [120, 120, 118]]] },
  // The same with the film's light column: a white bar in a dark recess,
  // floor to ceiling (the texture repeats up the wall).
  { out: 'ds-wall-light', df: 'IPEXFLR2', smooth: 2, gradient: PALE_WALL, keep: 0, contrast: 0.25, rects: [[0, 0, 64, 1, [100, 100, 99]], [0, 1, 64, 1, [196, 194, 188]], [20, 0, 24, 64, [26, 29, 37]], [22, 0, 1, 64, [84, 91, 111]], [41, 0, 1, 64, [84, 91, 111]], [27, 0, 10, 64, TUBE], [27, 30, 10, 2, [108, 114, 134]]] },
  // The corridor wall whole, for rooms 6 and 8 high: trim, seams, skirting.
  { out: 'ds-wall-6', ...PALE_TALL, rects: paleWall(192) },
  { out: 'ds-wall-8', ...PALE_TALL, rects: paleWall(256) },
  // Dark gunmetal panels (the hangar high up, the shaft), and the hangar's.
  { out: 'ds-wall-dark', df: 'IWADARK1', gradient: GUNMETAL, keep: 0, contrast: 1 },
  { out: 'ds-hangar-wall', df: 'IWADARK3', gradient: [[14, 15, 20], [36, 39, 48], [58, 62, 74], [80, 86, 100], [108, 114, 130]], keep: 0, contrast: 1 },
  // The hangar's wall with a light bar up it.
  { out: 'ds-hangar-light', df: 'IWADARK3', gradient: [[14, 15, 20], [36, 39, 48], [58, 62, 74], [80, 86, 100], [108, 114, 130]], keep: 0, contrast: 1, rects: [[22, 0, 20, 128, [12, 13, 17]], [23, 0, 1, 128, [84, 91, 111]], [40, 0, 1, 128, [84, 91, 111]], [28, 0, 8, 128, TUBE], [28, 62, 8, 2, [108, 114, 134]], [28, 126, 8, 2, [108, 114, 134]]] },
  // Machinery along the hangar's foot and in the maintenance tunnels.
  { out: 'ds-wall-greeble', df: 'IWAPIPE6', gradient: [[8, 9, 12], [30, 32, 40], [60, 64, 76], [96, 102, 116], [150, 156, 170]], keep: 0.25, contrast: 1 },
  // Bare structure where the panels aren't on yet: the X truss, in primer.
  { out: 'ds-girder', df: 'IWBGFUL3', gradient: [[14, 10, 10], [50, 34, 30], [92, 60, 50], [130, 92, 76], [168, 130, 110]], keep: 0, contrast: 1 },
  // Detention: black panels, slots of red light.
  { out: 'ds-det-wall', df: 'IWADARK1', gradient: BLACK, keep: 0, contrast: 1.1, rects: [[8, 40, 20, 3, RED], [36, 40, 20, 3, RED], [8, 104, 20, 3, RED], [36, 104, 20, 3, RED], [8, 43, 20, 1, DIM_RED], [36, 43, 20, 1, DIM_RED], [8, 107, 20, 1, DIM_RED], [36, 107, 20, 1, DIM_RED]] },
  // The compactor: the Detention Centre's stained wall, wetter and rustier.
  { out: 'ds-compactor-wall', df: 'IWCMPCTR', gradient: [[10, 10, 8], [36, 34, 28], [66, 62, 52], [96, 90, 76], [124, 116, 98]], keep: 0.5, contrast: 1, rust: [{ color: [96, 50, 22], amount: 0.5, cell: 32, seed: 301 }, { color: [10, 14, 10], amount: 0.5, cell: 16, seed: 303 }] },
  // A wall of displays (the control room, the briefing room).
  { out: 'ds-screen', df: 'IWPANEL2' },
  // Decks: glossy near-black plates; the hangar's, and its painted line.
  { out: 'ds-floor', df: 'IPADARK3', gradient: BLACK, keep: 0, contrast: 1.2 },
  { out: 'ds-floor-hangar', df: 'IPADARK4', gradient: BLACK, keep: 0, contrast: 1 },
  { out: 'ds-floor-line', df: 'IPADARK4', gradient: BLACK, keep: 0, contrast: 1, rects: [[0, 26, 64, 12, [140, 139, 137]], [0, 26, 64, 1, [100, 100, 99]], [0, 37, 64, 1, [100, 100, 99]]] },
  { out: 'ds-floor-grate', df: 'ZPGRTE3X', gradient: [[4, 4, 6], [20, 22, 28], [44, 48, 58], [72, 78, 92]], keep: 0, contrast: 1 },
  // The cell block's lane: the Detention Centre's grid of red light.
  { out: 'ds-det-floor-light', df: 'IPDTENRD' },
  { out: 'ds-ceiling', df: 'IPDETSQR', gradient: GUNMETAL, keep: 0, contrast: 1 },
  { out: 'ds-ceiling-light', df: 'IPALITE1' },
  // The station's skin far off (the trench, as the backdrop): plain plate,
  // a few lit windows.
  { out: 'ds-hull', df: 'IPADARK3', tile: [2, 2], gradient: [[30, 32, 38], [54, 58, 68], [76, 82, 96], [96, 102, 118]], keep: 0, contrast: 0.5, rects: [[9, 20, 2, 1, [255, 250, 200]], [70, 51, 1, 1, TUBE], [41, 90, 2, 1, [255, 236, 120]], [110, 12, 1, 1, [255, 250, 200]], [97, 113, 1, 2, TUBE], [22, 70, 1, 1, [255, 255, 255]]] },
  // Doors: the security base's twin-crest blast door (4 by 4), and the
  // Detention Centre's hatch for side rooms and cells (2 by 2), with a
  // key's colour for the locked ones.
  { out: 'ds-door', df: 'IDSECB1' },
  { out: 'ds-door-narrow', df: 'IDDET1' },
  { out: 'ds-door-red', df: 'IDDET1', rects: [[26, 52, 12, 4, RED]] },
  { out: 'ds-door-blue', df: 'IDDET1', rects: [[26, 52, 12, 4, [20, 150, 220]]] },
  // The switch: the pale wall of a room 6 high, a lit panel in it (red,
  // then green). One picture floor to ceiling, so the panel isn't repeated
  // up the wall.
  { out: 'ds-switch', ...PALE_TALL, rects: [...paleWall(192), ...switchPanel(RED)] },
  { out: 'ds-switch-on', ...PALE_TALL, rects: [...paleWall(192), ...switchPanel([70, 230, 60])] },
  // Space: only stars (Mark, 2026-11-10).
  { out: 'sky-space', paint: 'space', size: [1024, 256], stars: 1400, seed: 7 },
  // See-through: the field across the hangar's mouth, the control room's
  // window and a clean handrail.
  { out: 'ds-field', paint: 'field', size: [64, 64], color: [60, 220, 255], seed: 11 },
  { out: 'ds-window', paint: 'window', size: [64, 128], pane: 32, frame: [26, 29, 37, 255], glint: [144, 150, 168, 255], seed: 13 },
  { out: 'ds-railing', paint: 'railing', size: [64, 24], post: 32, color: [140, 139, 137, 255], dark: [64, 64, 64, 255] },
  // Skins for the models (models/station.js): the TIE fighter's solar
  // panel as Dark Forces drew it, its hull, machinery and window; crates;
  // consoles; plain metals and lamps.
  // The wing's panels as in Mark's schematic: black, fine lines up them
  // (the model fans them out from the hub).
  { out: 'tie-wing', paint: 'tieWing', size: [64, 64], panel: [10, 11, 14], line: [40, 43, 52], every: 3 },
  { out: 'tie-hull', df: 'IPGRDBLY', gradient: [[40, 46, 58], [84, 91, 111], [108, 114, 134], [144, 150, 168], [176, 184, 200]], keep: 0, contrast: 0.8 },
  { out: 'tie-dark', df: 'ENGTEXTS', scale: [32, 32], gradient: [[6, 6, 8], [20, 21, 26], [36, 38, 46], [56, 60, 72]], keep: 0, contrast: 1 },
  { out: 'tie-window', paint: 'tieWindow', size: [64, 64], glass: [20, 26, 38], frame: [144, 150, 168] },
  { out: 'ds-crate', df: 'IPRMCRT9', gradient: [[12, 13, 16], [36, 38, 46], [64, 68, 80], [100, 104, 116], [160, 164, 174]], keep: 0, contrast: 1 },
  { out: 'ds-crate-b', df: 'IPRMCRT9', gradient: PALE, keep: 0, contrast: 1 },
  { out: 'ds-console-top', df: 'IWPANEL2', crop: [44, 0, 64, 64] },
  { out: 'ds-console-side', df: 'IWADARK1', crop: [0, 0, 64, 32], gradient: GUNMETAL, keep: 0, contrast: 1 },
  { out: 'ds-metal', df: 'IPGRDBLY', scale: [32, 32], gradient: PALE, keep: 0, contrast: 0.6 },
  { out: 'ds-metal-dark', df: 'IPADARK3', scale: [32, 32], gradient: GUNMETAL, keep: 0, contrast: 0.8 },
  { out: 'ds-lamp', paint: 'flat', size: [16, 16], color: TUBE },
  { out: 'ds-lamp-red', paint: 'flat', size: [16, 16], color: RED },
];

/**
 * Mos Eisley's doors and windows: decals (see-through pictures on the
 * walls), cut from DF textures. `size: [w, h]` scales the source (after
 * `crop`) to that many texels (32 a tile); `mask` cuts its shape, `'arch'`
 * (a round top as wide as it) or `'round'` (corners of radius `r`), and
 * `rim` darkens a border `width` texels wide toward `color`: the shadow of
 * the opening's reveal, so a flat decal looks set into the wall.
 * `rust` stains it as it does the textures above, before the cut.
 */
const REVEAL = { width: 3, color: [52, 38, 26] };
/** Grey metal that has been out in the suns: rust in its darks. */
const RUSTY_GREY = [[26, 20, 14], [70, 58, 46], [116, 108, 96], [156, 150, 138], [196, 190, 176]];
const TEAL = [[4, 16, 18], [16, 58, 62], [44, 116, 118], [110, 190, 188]];
export const DECALS = [
  // An oval niche in the homestead's white plaster (Mark's references),
  // a tall oval (0.8 by 1.75 tiles), darker inside toward its top.
  { out: 'niche-oval', df: 'GWANO', crop: [0, 0, 64, 128], size: [26, 56], gradient: [[120, 112, 92], [178, 170, 146], [208, 202, 178], [226, 222, 202], [240, 238, 224]], keep: 0, contrast: 0.25, mask: 'oval', rim: { width: 2.5 } },
  // Doors after the film's (Mark's reference, 2026-10-17): a panel with a
  // lattice of braces (IDDOOR1), red-brown or grey, its corners rounded to
  // fit the tiled jamb round it (models/door-jamb.js), 2 tiles by 3.
  { out: 'door-red', df: 'IDDOOR1', crop: [0, 12, 64, 52], size: [64, 96], gradient: [[44, 22, 10], [90, 48, 24], [132, 72, 40], [166, 100, 64]], keep: 0, contrast: 0.9, mask: 'round', r: 11, rim: { width: 1.5, color: [24, 16, 10] } },
  { out: 'door-grey', df: 'IDDOOR1', crop: [0, 12, 64, 52], size: [64, 96], gradient: [[28, 28, 28], [68, 66, 62], [114, 110, 102], [156, 152, 142]], keep: 0, contrast: 0.9, mask: 'round', r: 11, rim: { width: 1.5, color: [24, 16, 10] } },
  // Over a door: a little striped panel, navy and orange (Nar Shaddaa's
  // louvres, their slats mapped dark to navy and light to orange); beside
  // it, the door's control panel (a DF switch as it is).
  { out: 'door-sign', df: 'NPVENTS1', crop: [8, 8, 48, 24], size: [32, 10], gradient: [[12, 7, 50], [24, 15, 74], [210, 110, 24], [255, 176, 72]], keep: 0, contrast: 1.3, mask: 'round', r: 1, rim: { width: 1, color: [40, 30, 20] } },
  { out: 'door-panel', df: 'ZASWIT04_0', size: [8, 16], mask: 'round', r: 1 },
  // A shop's roll-down shutter, 3 tiles wide: a strip of Nar Shaddaa's
  // corrugated door clear of its red sign, stretched sideways.
  { out: 'shutter', df: 'NDCORUG1', crop: [119, 0, 8, 96], size: [96, 72], gradient: [[30, 26, 22], [74, 66, 56], [118, 108, 92], [160, 150, 132]], keep: 0, contrast: 0.9, mask: 'round', r: 4, rim: REVEAL },
  // The cantina's smaller door (Mark's stills): weathered planks, 3 tiles
  // by 4, its top a half circle to fit the rounded arch over it.
  { out: 'door-planks', df: 'IWGRAN5', size: [96, 128], gradient: [[20, 15, 10], [48, 38, 28], [80, 66, 50], [112, 96, 76], [140, 124, 100]], keep: 0, contrast: 0.8, mask: 'arch', rim: REVEAL },
  // Docking Bay 87's door, 4 tiles by 4: Dark Forces' X-braced cargo door,
  // in the town's rusty grey.
  { out: 'door-bay', df: 'RDBIG4', size: [128, 128], gradient: [[22, 20, 18], [58, 54, 48], [98, 92, 82], [138, 130, 116]], keep: 0.2, contrast: 1, mask: 'round', r: 6, rim: { width: 1.5, color: [24, 16, 10] } },
  // Windows, a tile wide and 1.25 high to fill their notch (town.window()):
  // dark behind rusty bars, and teal louvred shutters.
  { out: 'window-bars', df: 'SPBARS1', size: [32, 40], gradient: [[8, 6, 4], [30, 22, 14], [80, 58, 36], [136, 98, 60]], keep: 0.2, contrast: 1, mask: 'round', r: 8, rim: REVEAL },
  { out: 'window-louvre', df: 'NPVENTS1', size: [32, 40], gradient: TEAL, keep: 0, contrast: 0.9, mask: 'arch', rim: REVEAL },
  // Things on the walls (town.vent()): grilles and slats over vents, a
  // round vent, a fan in its box and a row of gauges, in
  // weathered grey; `vent-slats` has no transparent edge, so the
  // `wall-unit` model wears it too.
  { out: 'vent-grille', df: 'IAFAN', crop: [0, 0, 64, 64], size: [32, 32], gradient: RUSTY_GREY, keep: 0.3, contrast: 1, mask: 'round', r: 3, rim: { width: 1.5, color: [30, 24, 18] } },
  { out: 'vent-slats', df: 'NPVENTS2', size: [64, 32], gradient: RUSTY_GREY, keep: 0.5, contrast: 1, rim: { width: 1.5, color: [30, 24, 18] } },
  { out: 'vent-round', df: 'SPGRATE1', size: [32, 32], gradient: RUSTY_GREY, keep: 0.5, contrast: 1, mask: 'round', r: 16, rim: { width: 2, color: [30, 24, 18] } },
  { out: 'wall-fan', df: 'IATRKDEV', crop: [0, 0, 64, 64], size: [32, 32], gradient: [[24, 20, 16], [70, 62, 52], [120, 110, 94], [170, 160, 140]], keep: 0.4, contrast: 1, mask: 'round', r: 3 },
  { out: 'wall-meter', df: 'SWSWITCH', size: [8, 32], mask: 'round', r: 1 },
  // Sheet metal the Jawas have patched the junk yard's walls with: Sewers'
  // rust-eaten sheet, Generic's bolted panel gone rusty and sooty, and the
  // lean-tos' corrugated tin, each with a dark edge where it stands off the
  // wall.
  { out: 'patch-rust', df: 'SPMETAL1', size: [48, 64], gradient: [[30, 22, 16], [72, 56, 44], [112, 94, 76], [146, 128, 106]], keep: 0.6, contrast: 1, mask: 'round', r: 2, rim: { width: 1, color: [40, 28, 18] } },
  { out: 'patch-plate', df: 'ZPPANEL1', size: [48, 40], gradient: [[36, 34, 30], [80, 76, 68], [124, 118, 106], [160, 152, 138], [186, 178, 162]], keep: 0, contrast: 1, rust: WORN(16, 145), mask: 'round', r: 3, rim: { width: 1.5, color: [24, 18, 12] } },
  { out: 'patch-tin', df: 'ZWGRUV1', crop: [0, 0, 32, 64], size: [40, 72], gradient: [[30, 16, 8], [74, 40, 18], [120, 66, 32], [160, 96, 52], [190, 130, 82]], keep: 0, contrast: 0.9, rust: WORN(16, 147, 0.7), mask: 'round', r: 1, rim: { width: 1, color: [40, 24, 14] } },
  // Brick bared where the plaster has fallen off a wall: the town's mud
  // brick cut to a ragged blob, crumbling at its edge.
  { out: 'brick-bare-1', df: 'ZPBRICK1', size: [64, 48], gradient: [[30, 20, 12], [80, 56, 36], [130, 96, 64], [168, 132, 92], [196, 164, 120]], keep: 0.1, contrast: 1, mask: 'blob', seed: 5 },
  { out: 'brick-bare-2', df: 'ZPBRICK1', crop: [0, 0, 48, 64], size: [48, 64], gradient: [[30, 20, 12], [80, 56, 36], [130, 96, 64], [168, 132, 92], [196, 164, 120]], keep: 0.1, contrast: 1, mask: 'blob', seed: 8 },
  // Oil soaked into the junk yard's sand (the `oil` models lie on it):
  // Robotics' acid pool near black, a dark sheen, cut to a ragged blob.
  { out: 'oil', df: 'RPACID01', size: [64, 64], gradient: [[8, 6, 4], [18, 14, 10], [30, 24, 18], [48, 40, 32]], keep: 0, contrast: 1, mask: 'blob', seed: 11 },
  // The landspeeder's intakes (models/speeder.js): Nar Shaddaa's slatted
  // vent, dark and rusty, framed in the hull's peach paint.
  { out: 'speeder-grille', df: 'NPVENTS2', size: [64, 32], gradient: [[14, 12, 10], [40, 34, 28], [76, 66, 56], [112, 100, 86]], keep: 0.3, contrast: 1, rim: { width: 2.5, color: [212, 164, 136] } },
  // Litter on the ground (the `litter` models' texture): the junk pile cut
  // to a ragged blob, see-through round it and through its gaps.
  { out: 'litter', df: 'IPTRSHC1', size: [64, 64], gradient: [[22, 16, 10], [62, 48, 32], [110, 90, 64], [154, 132, 98], [196, 176, 138]], keep: 0.35, contrast: 1.1, mask: 'blob', seed: 4 },
];

/**
 * Mos Eisley's doors (town.door()): a door decal again as a rising door's
 * panel, which must be a power-of-two size. The 64x96 door sits in the
 * bottom of a 64x128 texture (the panel hangs from its bottom edge, so the
 * top quarter is up in the wall over the opening and never shows), centred
 * across it (the engine centres a panel in its doorway: the 96-wide shutter
 * in a 128-wide one), and what was see-through, round its corners and
 * above it, is `fill` (the jamb's rounded tiles hide the corners).
 */
export const RISING = [
  { out: 'door-red-rising', from: 'door-red', size: [64, 128], fill: [24, 16, 10] },
  { out: 'door-grey-rising', from: 'door-grey', size: [64, 128], fill: [24, 16, 10] },
  { out: 'shutter-rising', from: 'shutter', size: [128, 128], fill: [52, 38, 26] },
  { out: 'door-planks-rising', from: 'door-planks', size: [128, 128], fill: [24, 16, 10] },
  { out: 'door-bay-rising', from: 'door-bay', size: [128, 128], fill: [24, 16, 10] },
];

/**
 * The edges of the street's sand drifts: one 64x64 texture for each way a
 * tile's corners can be sand or drift (bit 1 its north-west corner, 2
 * north-east, 4 south-east, 8 south-west), `street-drift-1` to `-14`. Each
 * texel blends the corners and adds a noise that repeats every tile, so a
 * drift's edge wanders across the tile and meets the next tile's edge
 * exactly. A quarter of the texture shows on each tile (the floors are
 * world-aligned, 64 texels to 2 tiles), so each quarter is cut the same.
 */
export const DRIFT_EDGES = { sand: 'street-sand', drift: 'street-drift', out: 'street-drift', amp: 0.7 };

/** Smooth value noise in 0-1 that repeats every `period` texels, over cells of `cell`. */
function periodicNoise(x, y, cell, period, seed) {
  const n = period / cell;
  const h = (i, j) => {
    let v = Math.imul(((i % n) + n) % n * 374761393 + (((j % n) + n) % n) * 668265263 + seed * 1442695041, 1274126177);
    v = Math.imul(v ^ (v >>> 13), 1103515245);
    return ((v ^ (v >>> 16)) >>> 0) / 4294967296;
  };
  const fx = x / cell;
  const fy = y / cell;
  const i = Math.floor(fx);
  const j = Math.floor(fy);
  const u = (fx - i) * (fx - i) * (3 - 2 * (fx - i));
  const v = (fy - j) * (fy - j) * (3 - 2 * (fy - j));
  const a = h(i, j) + (h(i + 1, j) - h(i, j)) * u;
  const b = h(i, j + 1) + (h(i + 1, j + 1) - h(i, j + 1)) * u;
  return a + (b - a) * v;
}

/** The drift edge for corner bits `m` (see DRIFT_EDGES), from the sand and drift images. */
export function driftEdge(sand, drift, m, amp = DRIFT_EDGES.amp) {
  const { width: w, height: h } = sand;
  const data = new Uint8Array(sand.data);
  const T = 32;
  const c = [m & 1, (m >> 1) & 1, (m >> 2) & 1, (m >> 3) & 1].map(Number);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const lx = x % T;
      const ly = y % T;
      const u = (lx + 0.5) / T;
      const v = (ly + 0.5) / T;
      const blend = (c[0] * (1 - u) + c[1] * u) * (1 - v) + (c[3] * (1 - u) + c[2] * u) * v;
      const n = periodicNoise(lx, ly, 8, T, 3) * 0.65 + periodicNoise(lx, ly, 4, T, 4) * 0.35;
      if (blend + amp * (n - 0.5) > 0.5) {
        const i = (y * w + x) * 4;
        data.set(drift.data.subarray(i, i + 4), i);
      }
    }
  }
  return { width: w, height: h, data };
}

/** Colour at position t (0..1) along a gradient of key colours. */
function along(keys, t) {
  const f = Math.max(0, Math.min(1, t)) * (keys.length - 1);
  const k = Math.min(keys.length - 2, Math.floor(f));
  const u = f - k;
  return [0, 1, 2].map((c) => keys[k][c] + (keys[k + 1][c] - keys[k][c]) * u);
}

/** Recolour an image by a gradient map (see above). */
export function gradientMap(img, { gradient, keep = 0, contrast = 1 }) {
  const d = img.data;
  // Normalise to the image's own brightness range, so dark and pale sources both use the whole gradient.
  let lo = 255;
  let hi = 0;
  const lum = (i) => d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 128) continue;
    lo = Math.min(lo, lum(i));
    hi = Math.max(hi, lum(i));
  }
  const out = new Uint8Array(d);
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 128) continue;
    const l = lum(i);
    const t = 0.5 + ((l - lo) / Math.max(1, hi - lo) - 0.5) * contrast;
    const c = along(gradient, t);
    for (let k = 0; k < 3; k++) out[i + k] = Math.round(Math.max(0, Math.min(255, c[k] + (d[i + k] - l) * keep)));
  }
  return { width: img.width, height: img.height, data: out };
}

/** Part of an image. */
function cropped(img, [x0, y0, w, h]) {
  const data = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) data.set(img.data.subarray(((y0 + y) * img.width + x0) * 4, ((y0 + y) * img.width + x0 + w) * 4), y * w * 4);
  return { width: w, height: h, data };
}

/** `n` passes of a 3x3 box blur, wrapping round the edges so the texture still tiles. */
function smoothed(img, n) {
  const { width: w, height: h } = img;
  let d = img.data;
  for (let pass = 0; pass < n; pass++) {
    const out = new Uint8Array(d);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        for (let k = 0; k < 3; k++) {
          let sum = 0;
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) sum += d[((((y + dy) % h) + h) % h * w + ((((x + dx) % w) + w) % w)) * 4 + k];
          out[(y * w + x) * 4 + k] = Math.round(sum / 9);
        }
      }
    }
    d = out;
  }
  return { width: w, height: h, data: d };
}

/** An image turned a quarter, clockwise. */
function turned(img) {
  const { width: w, height: h } = img;
  const data = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) data.set(img.data.subarray((y * w + x) * 4, (y * w + x) * 4 + 4), (x * h + (h - 1 - y)) * 4);
  return { width: h, height: w, data };
}

/** An image scaled to w x h (nearest texel). */
function resized(img, [w, h]) {
  const data = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const s = (Math.floor((y * img.height) / h) * img.width + Math.floor((x * img.width) / w)) * 4;
      data.set(img.data.subarray(s, s + 4), (y * w + x) * 4);
    }
  }
  return { width: w, height: h, data };
}

/** Cut a decal's shape out (see DECALS): transparent outside it, the rim darkened inside its edge. */
function masked(img, { mask, r = 0, rim, seed = 1 }) {
  const { width: w, height: h, data: d } = img;
  if (mask === 'oval') {
    // A niche: an oval cut into the plaster, darker inside toward its top
    // (the lip's shadow), its rim darkened by `rim`.
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const u = ((x + 0.5) / w) * 2 - 1;
        const v = ((y + 0.5) / h) * 2 - 1;
        const q = u * u + v * v;
        if (q >= 1) {
          d[i + 3] = 0;
          continue;
        }
        d[i + 3] = 255;
        const e = (1 - Math.sqrt(q)) * Math.min(w, h) * 0.5;
        const shade = 0.5 + 0.3 * ((v + 1) / 2) + (rim && e < rim.width ? -0.2 * (1 - e / rim.width) : 0);
        for (let k = 0; k < 3; k++) d[i + k] = Math.round(d[i + k] * shade);
      }
    }
    return img;
  }
  if (mask === 'blob') {
    // A ragged blob: in where a noise beats the distance from the middle,
    // with holes where the noise dips (the cut edge darkened by `rim`).
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const dist = Math.hypot((x + 0.5) / w - 0.5, (y + 0.5) / h - 0.5) * 2;
        const n = periodicNoise(x, y, 8, w, seed) * 0.6 + periodicNoise(x, y, 4, w, seed + 1) * 0.4;
        d[i + 3] = n * 1.25 - dist * 0.8 > 0.02 ? 255 : 0;
      }
    }
    return img;
  }
  // How far (in texels) a texel's centre is inside the shape; below 0 is outside.
  const depth = (x, y) => {
    const px = x + 0.5;
    const py = y + 0.5;
    let e = Math.min(px, w - px, h - py, py);
    // An arch rounds its top corners into one curve; a rounded box all four.
    const rr = mask === 'arch' ? w / 2 : r;
    const cy = py < rr ? rr : mask === 'round' && py > h - rr ? h - rr : null;
    if (cy !== null && (px < rr || px > w - rr)) {
      const cx = px < rr ? rr : w - rr;
      e = Math.min(e, rr - Math.hypot(px - cx, py - cy));
    }
    return e;
  };
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const e = depth(x, y);
      if (e <= 0) {
        d[i + 3] = 0;
        continue;
      }
      d[i + 3] = 255;
      if (rim && e < rim.width) {
        const t = 0.85 * (1 - e / rim.width) + 0.15;
        for (let k = 0; k < 3; k++) d[i + k] = Math.round(d[i + k] + (rim.color[k] - d[i + k]) * t);
      }
    }
  }
  return img;
}

/** Repeat an image nx by ny times. */
function tiled(img, [nx, ny]) {
  const w = img.width * nx;
  const h = img.height * ny;
  const data = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const s = ((y % img.height) * img.width + (x % img.width)) * 4;
      data.set(img.data.subarray(s, s + 4), (y * w + x) * 4);
    }
  }
  return { width: w, height: h, data };
}

/** Blend toward `color` from row `from` (a fraction of the height) to the bottom. */
function faded(img, { color, from }) {
  const d = img.data;
  for (let y = 0; y < img.height; y++) {
    const t = Math.max(0, (y / (img.height - 1) - from) / (1 - from));
    if (!t) continue;
    for (let x = 0; x < img.width; x++) {
      const i = (y * img.width + x) * 4;
      for (let k = 0; k < 3; k++) d[i + k] = Math.round(d[i + k] + (color[k] - d[i + k]) * t * t);
    }
  }
  return img;
}

/**
 * Rust: blotches of `color` where a noise that repeats with the texture
 * (it must be square) is above `from` (0.5, half the texture), up to
 * `amount` of the way, so it still tiles.
 */
function rusted(img, { color, amount, cell, seed, from = 0.5 }) {
  const d = img.data;
  // (A texture that isn't square wraps at its longer side, so it only tiles that way.)
  const period = Math.max(img.width, img.height);
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const n = periodicNoise(x, y, cell, period, seed) * 0.7 + periodicNoise(x, y, cell / 4, period, seed + 1) * 0.3;
      const t = Math.max(0, Math.min(1, (n - from) * 4)) * amount;
      if (!t) continue;
      const i = (y * img.width + x) * 4;
      for (let k = 0; k < 3; k++) d[i + k] = Math.round(d[i + k] + (color[k] - d[i + k]) * t);
    }
  }
  return img;
}

/** Clear the texels above a wavy line (see `edge` above), darkening its lip. */
function edged(img, { rows, amp, seed }) {
  const { width: w, data: d } = img;
  for (let x = 0; x < w; x++) {
    const n = periodicNoise(x, 0, 32, w, seed) * 0.7 + periodicNoise(x, 0, 8, w, seed + 1) * 0.3;
    const line = rows + amp * (2 * n - 1);
    for (let y = 0; y < img.height; y++) {
      const i = (y * w + x) * 4;
      if (y + 0.5 < line) d[i + 3] = 0;
      else if (y + 0.5 < line + 2) for (let k = 0; k < 3; k++) d[i + k] = Math.round(d[i + k] * 0.82);
    }
  }
  return img;
}

/** A sunset's glow round a point of the horizon, and the far side dimmed (see `glow` above). */
function glowed(img, { at, width, color, amount, dim = 0 }) {
  const { width: w, height: h, data: d } = img;
  for (let x = 0; x < w; x++) {
    let dx = Math.abs(x / w - at);
    dx = Math.min(dx, 1 - dx);
    const near = Math.exp(-((dx / width) ** 2));
    const broad = Math.exp(-((dx / (width * 3)) ** 2));
    for (let y = 0; y < h; y++) {
      const low = (y / (h - 1)) ** 2;
      const t = amount * near * (0.25 + 0.75 * low);
      const k = 1 - dim * (1 - broad);
      const i = (y * w + x) * 4;
      for (let c = 0; c < 3; c++) d[i + c] = Math.round((d[i + c] + (color[c] - d[i + c]) * t) * k);
    }
  }
  return img;
}

/** Soft discs: suns low over the horizon (see `suns` above), a faint halo round each. */
function sunned(img, suns) {
  const { width: w, data: d } = img;
  for (const { at, row, rx, ry, color } of suns) {
    const cx = at * w;
    for (let y = Math.floor(row - ry * 3); y <= Math.ceil(row + ry * 3); y++) {
      for (let x = Math.floor(cx - rx * 3); x <= Math.ceil(cx + rx * 3); x++) {
        if (y < 0 || y >= img.height) continue;
        const e = Math.hypot((x + 0.5 - cx) / rx, (y + 0.5 - row) / ry);
        const t = e < 0.85 ? 1 : e < 1.05 ? 1 - (e - 0.85) / 0.2 * 0.6 : 0.4 * Math.exp(-(((e - 1.05) / 0.8) ** 2));
        if (t <= 0.01) continue;
        const i = (y * w + (((x % w) + w) % w)) * 4;
        for (let c = 0; c < 3; c++) d[i + c] = Math.round(d[i + c] + (color[c] - d[i + c]) * t);
      }
    }
  }
  return img;
}

/** Bands painted down from the top row, one after another (see above). */
function lipped(img, bands) {
  const d = img.data;
  let y0 = 0;
  for (const { rows, color, amount } of bands) {
    for (let y = y0; y < Math.min(img.height, y0 + rows); y++) {
      for (let x = 0; x < img.width; x++) {
        const i = (y * img.width + x) * 4;
        for (let k = 0; k < 3; k++) d[i + k] = Math.round(d[i + k] + (color[k] - d[i + k]) * amount);
      }
    }
    y0 += rows;
  }
  return img;
}

/** The pack's textures by upper-case name. */
function packFiles() {
  const files = new Map();
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.toLowerCase().endsWith('.png')) files.set(e.name.slice(0, -4).toUpperCase(), p);
    }
  })(path.join(here, 'df-textures'));
  return files;
}

/** A TOWN texture from its source image: the steps above, in their order. */
function worked(img, spec) {
  if (spec.crop) img = cropped(img, spec.crop);
  if (spec.smooth) img = smoothed(img, spec.smooth);
  if (spec.scale) img = resized(img, spec.scale);
  if (spec.turn) img = turned(img);
  if (spec.tile) img = tiled(img, spec.tile);
  if (spec.gradient) img = gradientMap(img, spec);
  if (spec.fade) img = faded(img, spec.fade);
  if (spec.glow) img = glowed(img, spec.glow);
  if (spec.suns) img = sunned(img, spec.suns);
  for (const r of [spec.rust ?? []].flat()) img = rusted(img, r);
  if (spec.lip) img = lipped(img, spec.lip);
  if (!spec.holes) for (let i = 3; i < img.data.length; i += 4) img.data[i] = 255;
  if (spec.edge) img = edged(img, spec.edge);
  for (const [x, y, w, h, color] of spec.rects ?? []) fillRect(img, x, y, w, h, color);
  return img;
}

/** Fill a rectangle with one colour (`[r, g, b]`, or with a fourth number, its alpha). */
function fillRect(img, x0, y0, w, h, color) {
  for (let y = Math.max(0, y0); y < Math.min(img.height, y0 + h); y++) {
    for (let x = Math.max(0, x0); x < Math.min(img.width, x0 + w); x++) {
      const i = (y * img.width + x) * 4;
      img.data[i] = color[0];
      img.data[i + 1] = color[1];
      img.data[i + 2] = color[2];
      img.data[i + 3] = color[3] ?? 255;
    }
  }
}

/** A small repeatable random number for a texel. */
const hash = (x, y, seed) => {
  let h = (x * 374761393 + y * 668265263 + seed * 362437) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
const blank = (w, h, color = [0, 0, 0, 0]) => {
  const img = { width: w, height: h, data: new Uint8Array(w * h * 4) };
  fillRect(img, 0, 0, w, h, color);
  return img;
};

/** The station's textures drawn from nothing (`paint` in a STATION entry). */
const PAINT = {
  /** One flat colour. */
  flat: ({ size: [w, h], color }) => blank(w, h, [...color, 255]),
  /**
   * Space: black, stars of mixed brightness, and a planet (`planet: { at,
   * row, r, color }`, `at` a share of the width), lit from one side.
   */
  space({ size: [w, h], stars, seed, planet }) {
    const img = blank(w, h, [0, 0, 0, 255]);
    for (let n = 0; n < stars; n++) {
      const x = Math.floor(hash(n, 1, seed) * w);
      // None on the last rows: below the horizon the sky repeats its last row.
      const y = Math.floor(hash(n, 2, seed) * (h - 4));
      const b = hash(n, 3, seed);
      const v = b > 0.97 ? 255 : b > 0.8 ? 170 : 90;
      fillRect(img, x, y, 1, 1, [v, v, Math.min(255, v + 20)]);
    }
    if (planet) {
      const cx = planet.at * w;
      for (let y = Math.floor(planet.row - planet.r); y <= planet.row + planet.r; y++) {
        for (let x = Math.floor(cx - planet.r); x <= cx + planet.r; x++) {
          const dx = (x + 0.5 - cx) / planet.r;
          const dy = (y + 0.5 - planet.row) / planet.r;
          const d2 = dx * dx + dy * dy;
          if (d2 > 1) continue;
          // A sphere lit from the upper left; bands of dune and rock across it.
          const dz = Math.sqrt(1 - d2);
          const lit = Math.max(0, -0.6 * dx - 0.45 * dy + 0.55 * dz);
          const band = 0.85 + 0.15 * Math.sin(dy * 9 + Math.sin(dx * 4) * 1.5) + (hash(x >> 1, y >> 1, seed) - 0.5) * 0.12;
          const k = Math.min(1, lit * 1.35) * band;
          fillRect(img, x, y, 1, 1, planet.color.map((c) => Math.round(c * k)));
        }
      }
    }
    return img;
  },
  /** A magnetic field: see-through, a thin scatter of lit texels, denser along some rows. */
  field({ size: [w, h], color, seed }) {
    const img = blank(w, h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const line = y % 16 === 0;
        if (hash(x, y, seed) < (line ? 0.5 : (x + y) % 2 ? 0 : 0.14)) fillRect(img, x, y, 1, 1, color);
      }
    }
    return img;
  },
  /** A window: a dark frame round each pane, the glass see-through but for a few glints. */
  window({ size: [w, h], pane, frame, glint, seed }) {
    const img = blank(w, h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (x % pane < 2 || y < 2 || y >= h - 2) fillRect(img, x, y, 1, 1, frame);
        else if (hash(x + y, (x - y) >> 2, seed) < 0.003) fillRect(img, x, y, 1, 1, glint);
      }
    }
    return img;
  },
  /** A handrail: a rail along the top, a thin one under it, a post each `post` texels. */
  railing({ size: [w, h], post, color, dark }) {
    const img = blank(w, h);
    fillRect(img, 0, 0, w, 3, color);
    fillRect(img, 0, 3, w, 1, dark);
    fillRect(img, 0, 12, w, 1, color);
    for (let x = 0; x < w; x += post) fillRect(img, x, 0, 2, h, color);
    return img;
  },
  /** The TIE fighter's window: dark glass in a ring, eight spokes to a hub. */
  tieWing({ size: [w, h], panel, line, every }) {
    const img = blank(w, h, [...panel, 255]);
    for (let x = 1; x < w; x += every) fillRect(img, x, 0, 1, h, [...line, 255]);
    return img;
  },
  tieWindow({ size: [w, h], glass, frame }) {
    const img = blank(w, h, [...frame, 255]);
    const c = w / 2;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const dx = x + 0.5 - c;
        const dy = y + 0.5 - c;
        const r = Math.hypot(dx, dy) / c;
        const a = ((Math.atan2(dy, dx) / Math.PI) * 4 + 8.5) % 1;
        const oct = r * Math.cos((a - 0.5) * (Math.PI / 4));
        if (oct < 0.24 || (r < 0.9 && oct > 0.3 && Math.abs(a - 0.5) < 0.5 - 0.05 / r)) fillRect(img, x, y, 1, 1, glass.map((v) => Math.round(v * (1.25 - r * 0.5))));
      }
    }
    return img;
  },
};
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const pack = packFiles();
  const made = new Map();
  for (const spec of TOWN) {
    const img = worked(decodePNG(fs.readFileSync(pack.get(spec.df))), spec);
    made.set(spec.out, img);
    fs.writeFileSync(path.join(texDir, `${spec.out}.png`), encodePNG(img.width, img.height, img.data));
    console.log(`${spec.out}.png from ${spec.df} (${img.width}x${img.height})`);
  }
  for (const spec of STATION) {
    const img = spec.paint ? PAINT[spec.paint](spec) : worked(decodePNG(fs.readFileSync(pack.get(spec.df))), spec);
    made.set(spec.out, img);
    fs.writeFileSync(path.join(texDir, `${spec.out}.png`), encodePNG(img.width, img.height, img.data));
    console.log(`${spec.out}.png (${img.width}x${img.height}, the station's)`);
  }
  for (let m = 1; m < 15; m++) {
    const img = driftEdge(made.get(DRIFT_EDGES.sand), made.get(DRIFT_EDGES.drift), m);
    fs.writeFileSync(path.join(texDir, `${DRIFT_EDGES.out}-${m}.png`), encodePNG(img.width, img.height, img.data));
  }
  console.log(`${DRIFT_EDGES.out}-1..14.png, the drifts' edges`);
  for (const spec of DECALS) {
    let img = decodePNG(fs.readFileSync(pack.get(spec.df)));
    if (spec.crop) img = cropped(img, spec.crop);
    img = resized(img, spec.size);
    for (let i = 3; i < img.data.length; i += 4) img.data[i] = 255;
    if (spec.gradient) img = gradientMap(img, spec);
    for (const r of [spec.rust ?? []].flat()) img = rusted(img, r);
    img = masked(img, spec);
    made.set(spec.out, img);
    fs.writeFileSync(path.join(texDir, `${spec.out}.png`), encodePNG(img.width, img.height, img.data));
    console.log(`${spec.out}.png from ${spec.df} (${img.width}x${img.height}, a decal)`);
  }
  for (const spec of RISING) {
    const src = made.get(spec.from);
    const [w, h] = spec.size;
    const data = new Uint8Array(w * h * 4);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const o = (y * w + x) * 4;
        const sy = y - (h - src.height);
        const sx = x - (w - src.width) / 2;
        const i = (sy * src.width + sx) * 4;
        const a = sy >= 0 && sx >= 0 && sx < src.width ? src.data[i + 3] / 255 : 0;
        for (let k = 0; k < 3; k++) data[o + k] = Math.round(a * (a ? src.data[i + k] : 0) + (1 - a) * spec.fill[k]);
        data[o + 3] = 255;
      }
    }
    fs.writeFileSync(path.join(texDir, `${spec.out}.png`), encodePNG(w, h, data));
    console.log(`${spec.out}.png from ${spec.from}.png (${w}x${h}, a rising door's panel)`);
  }
  const overridesFile = path.join(here, 'overrides.json');
  const overrides = JSON.parse(fs.readFileSync(overridesFile, 'utf8'));
  for (const spec of DERIVED) {
    const src = decodePNG(fs.readFileSync(path.join(texDir, `${spec.from}.png`)));
    const img = gradientMap(src, spec);
    fs.writeFileSync(path.join(texDir, `${spec.out}.png`), encodePNG(img.width, img.height, img.data));
    overrides[`assets/textures/${spec.out}.png`] = { src: `assets/custom/textures/${spec.out}.png` };
    console.log(`${spec.out}.png from ${spec.from}.png (${img.width}x${img.height})`);
  }
  fs.writeFileSync(overridesFile, JSON.stringify(overrides, null, 2) + '\n');
}
