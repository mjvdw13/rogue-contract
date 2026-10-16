// The ROGUE CONTRACT content pack: everything that makes this game *this* game.
// The engine (src/engine) knows nothing about it; it only reads this pack.
import palette from './palette.js';
import strings from './strings.js';
import config from './config.js';
import hero from './hero.js';
import textures from './textures.js';
import models from './models/index.js';
import { fonts, images, sheets } from './ui.js';
import ammo from './ammo.js';
import weapons from './weapons/index.js';
import monsters from './monsters/index.js';
import items from './items/index.js';
import decorations from './decor.js';
import { effects, projectiles } from './effects.js';
import sounds from './sounds.js';
import particles from './particles.js';
import songs from './music/index.js';
import legend from './levels/legend.js';
import { levels, episodes } from './levels/index.js';
import cheats from './cheats.js';

export default {
  game: { id: 'rogue-contract', title: 'ROGUE CONTRACT', storagePrefix: 'rogue-contract' },
  palette,
  strings,
  config,
  hero,
  textures,
  models,
  fonts,
  images,
  sheets,
  ammo,
  weapons,
  things: [...monsters, ...items, ...decorations, ...effects, ...projectiles],
  sounds,
  particles,
  songs,
  legend,
  levels,
  episodes,
  cheats,
  // Custom behaviour hooks: defineAction / defineAttack / definePickup results.
  actions: [],
  attacks: [],
  pickups: [],
};
