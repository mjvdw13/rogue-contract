import { World } from '../world/world.js';
import { clampPitch } from '../things/player.js';
import { VIEW_H } from '../config.js';
import { HUD_CLEAR } from '../ui/hud.js';
import { PAL_NORMAL, PAL_RED_START, NUM_RED, PAL_BONUS_START, NUM_BONUS, PAL_HAZARD, PAL_NIGHTVISION } from '../gfx/palette.js';

/** Gameplay: one level in progress. */
export class LevelScene {
  /**
   * @param {*} game
   * @param {{level:any, episode:any, skill:number, snapshot:any}} opts
   */
  constructor(game, opts) {
    this.game = game;
    this.level = opts.level;
    this.episode = opts.episode;
    this.skill = opts.skill;
    this.snapshot = opts.snapshot ?? null;
    this.world = null;
  }

  get showTouch() {
    return true;
  }

  get wantsPointerLock() {
    return true;
  }

  enter() {
    const g = this.game;
    this.world = new World(
      {
        registry: g.registry,
        assets: g.assets,
        audio: g.audio,
        rng: g.rng,
        game: g,
        settings: {
          get alwaysRun() {
            return g.settings.alwaysRun;
          },
          get autoAim() {
            return g.settings.autoAim;
          },
          noMonsters: g.debug.noMonsters,
        },
        hooks: {
          message: (text) => g.hud.message(text),
          onPlayerDeath: () => g.hud.message(g.registry.strings.deathMessage ?? 'YOU DIED'),
        },
      },
      this.level,
      { skill: this.skill, snapshot: this.snapshot },
    );
    for (const err of this.world.buildErrors) console.warn(`[${this.level.id}] ${err}`);
    g.hud.reset();
    g.hud.faceSheet = g.faceSheet;
    const p = this.world.player.player;
    if (g.debug.god) p.god = true;
    if (g.debug.allWeapons) g.giveEverything(this.world);
    g.playMusic(this.level.music);
    if (this.level.intro) g.hud.message(this.level.intro);
  }

  update(dt, input) {
    const g = this.game;
    const w = this.world;
    if (input.wasPressed('menu')) {
      g.pause();
      return;
    }
    if (input.wasPressed('automap')) g.hud.automap = !g.hud.automap;
    if (g.hud.automap) {
      if (input.isDown('zoomIn')) g.hud.mapScale = Math.min(12, g.hud.mapScale * (1 + dt * 2));
      if (input.isDown('zoomOut')) g.hud.mapScale = Math.max(1, g.hud.mapScale / (1 + dt * 2));
    }
    w.tick(dt, input);
    g.hud.update(dt, w);
    if (w.exitRequested) g.levelComplete(this, w.exitRequested);
    else if (w.restartRequested) g.restartLevel();
  }

  /** Called every rendered frame (not just ticks) for smooth mouse look. */
  frame(dt, input) {
    const { dx, dy } = input.consumeMouse();
    const p = this.world.player;
    if (p.player.dead) return;
    const settings = this.game.settings;
    const sens = 0.0006 + settings.mouseSensitivity * 0.00034;
    if (dx) p.angle += dx * sens;
    // Mouse look tilts the view (Dark Forces-style y-shearing), in horizon pixels.
    if (dy && settings.mouseLook) p.pitch = clampPitch((p.pitch ?? 0) - dy * sens * 130 * (settings.invertMouseY ? -1 : 1));
  }

  render() {
    const g = this.game;
    const w = this.world;
    if (g.hud.automap) g.hud.drawAutomap(w);
    else g.renderer.render(w, w.camera(), { psprites: w.psprites(), skip: w.player });
    g.hud.drawHud(w);
    g.hud.drawMessages();
    const p = w.player.player;
    if (p.dead && w.time - p.deathTime > 1.2 && Math.floor(w.time * 2) % 2 === 0) {
      g.hud.drawCentered(g.registry.strings.respawnPrompt ?? 'PRESS USE TO TRY AGAIN', VIEW_H - HUD_CLEAR - 12, 'glow-yellow');
    }
  }

  /** Doom-style full-screen palette flashes. */
  paletteIndex() {
    const w = this.world;
    const p = w.player.player;
    let red = p.damageCount;
    if (p.powers.berserk > 0) {
      const since = w.time - (p.berserkTime ?? -100);
      red = Math.max(red, 12 * 4 - since * 6);
    }
    if (p.dead) red = Math.max(red, 20);
    if (red > 0) return PAL_RED_START + Math.min(NUM_RED - 1, Math.floor((red + 7) / 8));
    if (p.bonusCount > 0) return PAL_BONUS_START + Math.min(NUM_BONUS - 1, Math.floor((p.bonusCount + 7) / 8));
    if (p.powerVisible('hazard', w.time)) return PAL_HAZARD;
    if (p.powerVisible('nightvision', w.time)) return PAL_NIGHTVISION;
    return PAL_NORMAL;
  }
}
