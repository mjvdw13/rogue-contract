import { defineCheat } from '../engine/defs.js';

// Type these during play. '#' matches one digit.
export default [
  defineCheat({
    code: 'iddqd',
    run(game, world) {
      const p = world.player.player;
      p.god = !p.god;
      if (p.god) p.health = Math.max(p.health, 100);
      return p.god ? 'GOD MODE ON' : 'GOD MODE OFF';
    },
  }),
  defineCheat({
    code: 'idkfa',
    run(game, world) {
      game.giveEverything(world);
      return 'FULL LOADOUT';
    },
  }),
  defineCheat({
    // Invincible, every weapon and keycard, full ammo and shields. Unlike
    // iddqd it doesn't toggle: typing it again keeps you invincible.
    code: 'mercenary',
    run(game, world) {
      game.giveEverything(world);
      const p = world.player.player;
      p.god = true;
      p.health = Math.max(p.health, 100);
      return 'NOBODY SHOOTS BACK';
    },
  }),
  defineCheat({
    code: 'idclip',
    run(game, world) {
      const p = world.player.player;
      p.noclip = !p.noclip;
      return p.noclip ? 'NO CLIPPING MODE ON' : 'NO CLIPPING MODE OFF';
    },
  }),
  defineCheat({
    code: 'iddt',
    run(game) {
      game.hud.revealThings = !game.hud.revealThings;
      return game.hud.revealThings ? 'MAP REVEALED' : 'MAP HIDDEN';
    },
  }),
  defineCheat({
    code: 'idclev##',
    run(game, world, a, b) {
      const ep = Number(a);
      const map = Number(b);
      const episode = [...game.registry.episodes.values()][ep - 1];
      const id = episode?.levels[map - 1];
      if (!id) return 'NO SUCH LEVEL';
      game.startLevel(id, world.player.player.snapshot());
      return `WARPING TO ${id.toUpperCase()}`;
    },
  }),
];
