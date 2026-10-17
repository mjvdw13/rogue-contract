import { SCREEN_W, SCREEN_H } from './config.js';
import { Registry } from './registry.js';
import { validateContent } from './validate.js';
import { Palette, PAL_NORMAL } from './gfx/palette.js';
import { Surface } from './gfx/surface.js';
import { Presenter } from './gfx/present.js';
import { MeltWipe } from './gfx/wipe.js';
import { Assets } from './assets.js';
import { Input } from './input/input.js';
import { TouchControls, isTouchDevice } from './input/touch.js';
import { GamepadPoller } from './input/gamepad.js';
import { AudioSystem } from './audio/audio.js';
import { Storage, DEFAULT_SETTINGS } from './core/storage.js';
import { Loop } from './core/loop.js';
import { Rng } from './core/rng.js';
import { Renderer } from './render/renderer.js';
import { Hud } from './ui/hud.js';
import { MenuSystem } from './ui/menu.js';
import { pauseMenu } from './ui/menus.js';
import { LoadingScene } from './scenes/loading.js';
import { TitleScene } from './scenes/title.js';
import { LevelScene } from './scenes/level.js';
import { IntermissionScene } from './scenes/intermission.js';
import { FinaleScene } from './scenes/finale.js';

/**
 * The game shell: owns the screen, input, audio, assets and the current
 * scene (title, level, intermission, finale), and runs the session (which
 * episode, skill and level you're on).
 */
export class Game {
  /**
   * @param {{canvas: HTMLCanvasElement, stage: HTMLElement, content: any, params?: URLSearchParams}} opts
   */
  constructor({ canvas, stage, content, params = new URLSearchParams() }) {
    this.canvas = canvas;
    this.registry = new Registry(content);
    const { errors, warnings } = validateContent(this.registry);
    this.contentErrors = errors;
    for (const w of warnings) console.warn(`[content] ${w}`);
    for (const e of errors) console.error(`[content] ${e}`);

    this.params = params;
    this.debug = {
      god: params.has('god'),
      noMonsters: params.has('nomonsters'),
      allWeapons: params.has('all'),
      map: params.get('map') ?? params.get('warp'),
      skill: params.has('skill') ? Number(params.get('skill')) : null,
    };
    this.palette = new Palette(this.registry.paletteDef);
    this.surface = new Surface(SCREEN_W, SCREEN_H);
    this.storage = new Storage(this.registry.game.storagePrefix ?? this.registry.game.id);
    this.settings = this.storage.load('settings', DEFAULT_SETTINGS);
    if (params.has('fps')) this.settings.showFps = true;
    if (params.has('crt')) this.settings.crt = params.get('crt');
    if (params.has('wide')) this.settings.widescreen = params.get('wide') !== '0';
    this.progress = this.storage.load('progress', {});
    this.presenter = new Presenter(canvas, { preferGL: params.get('gl') !== '0', wide: this.settings.widescreen });
    this.input = new Input(canvas);
    this.input.onPointerLockChange = (locked) => {
      if (!locked && this.scene?.wantsPointerLock && !this.menu.active) this.pause();
    };
    this.input.onTouch = () => {
      if (this.settings.touchControls === 'auto') this.touchSeen = true;
    };
    this.touch = new TouchControls(stage, this.input);
    this.touchSeen = isTouchDevice();
    this.gamepad = new GamepadPoller(this.input);
    this.audio = new AudioSystem(this.registry, this.settings);
    if (params.has('mute')) this.audio.setMuted(true);
    this.assets = new Assets(this.registry, this.palette);
    this.rng = new Rng(params.has('seed') ? Number(params.get('seed')) : Date.now() & 0xffffffff);
    this.wipe = new MeltWipe(SCREEN_W, SCREEN_H);
    this.renderer = new Renderer(this.surface, this.assets, this.palette);
    this.hud = new Hud(this);
    this.menu = new MenuSystem(this);
    this.scene = null;
    this.time = 0;
    this.session = null;
    this.loop = new Loop({ update: (dt) => this.update(dt), render: (dt) => this.render(dt) });
    this.applySettings(false);

    canvas.addEventListener('click', () => {
      if (this.scene?.wantsPointerLock && !this.menu.active && !this.touchActive) this.input.lockPointer();
    });
    window.addEventListener('beforeunload', (e) => {
      if (this.scene instanceof LevelScene && !this.menu.active && !this.scene.world?.player.player.dead) {
        e.preventDefault();
        e.returnValue = '';
      }
    });
  }

  font(id) {
    const f = this.registry.config.fonts?.[id] ?? id;
    return this.assets.fonts.get(f) ?? null;
  }

  get touchActive() {
    const mode = this.settings.touchControls;
    return mode === 'on' || (mode === 'auto' && this.touchSeen);
  }

  // ------------------------------------------------------------ boot

  async boot(onStatus = () => {}) {
    const loading = new LoadingScene(this);
    this.scene = loading;
    await this.assets.loadFonts();
    onStatus('fonts');
    this.loop.start();
    await Promise.all([this.assets.loadAll((done, total) => loading.progress(done, total)), this.audio.loadOverrides()]);
    for (const p of this.assets.problems) console.warn(`[assets] ${p}`);
    this.renderer.prepare();
    onStatus('ready');
    if (this.contentErrors.length) {
      console.error(`${this.contentErrors.length} content error(s); see above.`);
    }
    if (this.debug.map) {
      const level = this.registry.levels.get(this.debug.map) ?? [...this.registry.levels.values()].find((l) => l.mapLabel?.toLowerCase() === this.debug.map.toLowerCase());
      if (level) {
        const episode = [...this.registry.episodes.values()].find((e) => e.levels.includes(level.id)) ?? this.registry.firstEpisode();
        this.session = { episodeId: episode.id, skill: this.debug.skill ?? 3 };
        this.startLevel(level.id, null);
        return;
      }
      console.warn(`No level "${this.debug.map}"`);
    }
    this.setScene(new TitleScene(this));
  }

  // ------------------------------------------------------------ frame

  update(dt) {
    this.time += dt;
    const input = this.input;
    this.gamepad.poll();
    if (input.anyPressed || input.clicks.length) this.audio.unlock();
    if (this.scene instanceof LevelScene && !this.menu.active) this._cheats();
    if (this.menu.active) this.menu.update(dt, input);
    else this.scene?.update(dt, input);
    this.wipe.update(dt);
    input.endTick();
  }

  render(dt) {
    if (this.presenter.w !== this.surface.w) this._resizeScreen(this.presenter.w);
    const s = this.surface;
    const scene = this.scene;
    if (scene?.frame && !this.menu.active) scene.frame(dt, this.input);
    else this.input.consumeMouse();
    this.assets.animate(this.time);
    scene?.render(dt);
    if (this.menu.active) this.menu.draw(scene instanceof LevelScene);
    this.wipe.draw(s.px);
    if (this.settings.showFps) {
      const f = this.font('small');
      f?.draw(s, `${this.loop.fps} FPS`, s.w - s.ox - 3, 3, { align: 'right', remap: this.palette.tint('gray', 'glow-green'), shadow: 0 });
    }
    const pal = this.menu.active ? PAL_NORMAL : (scene?.paletteIndex?.() ?? PAL_NORMAL);
    this.presenter.present(s.px, this.palette.palettes[pal], this.time);
    const inGame = scene instanceof LevelScene && !this.menu.active;
    this.touch.setVisible(inGame && this.touchActive);
    this.canvas.classList.toggle('in-game', inGame && this.input.pointerLocked);
  }

  /** Follow the presenter to a new framebuffer width (the window's shape changed). */
  _resizeScreen(w) {
    this.surface.resize(w, SCREEN_W);
    this.wipe = new MeltWipe(w, SCREEN_H);
  }

  /** Switch scenes with Doom's screen melt. */
  setScene(scene, wipe = true) {
    if (wipe && this.scene && !(this.scene instanceof LoadingScene)) this.wipe.start(this.surface.px, this.rng);
    this.scene?.exit?.();
    this.scene = scene;
    scene.enter?.();
  }

  /** Melt to whatever renders next frame. */
  wipeNext() {
    this.wipe.start(this.surface.px, this.rng);
  }

  // ------------------------------------------------------------ settings

  applySettings(save = true) {
    this.presenter.setMode(this.settings.crt);
    this.presenter.setWide(this.settings.widescreen);
    this.audio.setVolumes(this.settings);
    if (save) this.storage.save('settings', this.settings);
  }

  playMusic(id) {
    if (!id) return;
    this.audio.playMusic(id);
  }

  // ------------------------------------------------------------ session

  newGame(episodeId, skill) {
    this.menu.closeAll();
    const episode = this.registry.episodes.get(episodeId) ?? this.registry.firstEpisode();
    this.session = { episodeId: episode.id, skill };
    this.startLevel(episode.levels[0], null);
  }

  savedProgress() {
    const entry = Object.entries(this.progress).find(([id]) => this.registry.episodes.has(id));
    if (!entry) return null;
    const [episodeId, p] = entry;
    if (!this.registry.levels.has(p.levelId)) return null;
    return { episodeId, ...p };
  }

  continueGame() {
    const saved = this.savedProgress();
    if (!saved) return;
    this.menu.closeAll();
    this.session = { episodeId: saved.episodeId, skill: saved.skill ?? 3 };
    this.startLevel(saved.levelId, saved.snapshot ?? null);
  }

  startLevel(levelId, snapshot) {
    const level = this.registry.levels.get(levelId);
    if (!level) {
      console.error(`Unknown level "${levelId}"`);
      this.quitToTitle();
      return;
    }
    const episode = this.registry.episodes.get(this.session.episodeId);
    const skill = this.session.skill;
    this.session.levelId = levelId;
    this.session.snapshot = snapshot;
    // Remember the furthest level reached (with the inventory you entered it with).
    const order = episode?.levels ?? [];
    const prev = this.progress[episode?.id];
    if (!prev || order.indexOf(levelId) >= order.indexOf(prev.levelId) || prev.skill !== skill) {
      this.progress = { [episode.id]: { levelId, skill, snapshot } };
      this.storage.save('progress', this.progress);
    }
    this.setScene(new LevelScene(this, { level, episode, skill, snapshot }));
  }

  restartLevel() {
    this.menu.closeAll();
    if (!this.session?.levelId) return;
    this.startLevel(this.session.levelId, this.session.snapshot);
  }

  /** The level's exit was reached: intermission, then the next level or the finale. */
  levelComplete(scene, kind) {
    const level = scene.level;
    const episode = scene.episode;
    const world = scene.world;
    const p = world.player.player;
    const order = episode.levels;
    let nextId = null;
    if (kind === 'secret') nextId = level.secretNext ?? null;
    if (!nextId && kind !== 'finale') nextId = level.next ?? order[order.indexOf(level.id) + 1] ?? null;
    const next = nextId ? this.registry.levels.get(nextId) : null;
    const snapshot = p.snapshot();
    this.input.unlockPointer();
    this.setScene(
      new IntermissionScene(this, {
        level,
        next,
        episode,
        stats: { ...world.stats },
        onDone: () => {
          if (next) this.startLevel(next.id, snapshot);
          else this.finale(episode);
        },
      }),
    );
  }

  finale(episode) {
    delete this.progress[episode.id];
    this.storage.save('progress', this.progress);
    this.setScene(new FinaleScene(this, episode));
  }

  pause() {
    if (this.menu.active) return;
    this.input.unlockPointer();
    this.menu.open(pauseMenu(this));
  }

  resume() {
    this.menu.closeAll();
  }

  onMenuClosed() {
    if (this.scene instanceof TitleScene) return;
    if (this.scene?.wantsPointerLock && !this.touchActive) this.input.lockPointer();
  }

  quitToTitle() {
    this.menu.closeAll();
    this.session = null;
    this.setScene(new TitleScene(this));
  }

  quitMessage() {
    const list = this.registry.strings.quitMessages ?? ['Are you sure you want to quit?'];
    return this.rng.pick(list);
  }

  /** "Quit" from the main menu: there's no OS to return to, so say goodbye. */
  quit() {
    this.menu.closeAll();
    this.audio.play('quit');
    this.setScene(new GoodbyeScene(this));
  }

  // ------------------------------------------------------------ cheats

  _cheats() {
    const typed = this.input.typed;
    if (!typed) return;
    for (const cheat of this.registry.cheats) {
      const pattern = cheat.code.toLowerCase().replace(/#/g, '(\\d)');
      const m = new RegExp(`${pattern}$`).exec(typed);
      if (!m) continue;
      this.input.typed = '';
      const world = this.scene.world;
      const result = cheat.run(this, world, ...m.slice(1));
      this.hud.message(`!${result ?? this.registry.strings.cheatActivated ?? 'CHEAT ACTIVATED'}`);
      return;
    }
  }

  /** All weapons, full ammo, all keys (used by a cheat and ?all). */
  giveEverything(world) {
    const p = world.player.player;
    for (const w of this.registry.weapons.keys()) p.weapons.add(w);
    if (!p.backpack) {
      p.backpack = true;
      for (const a of this.registry.ammo.values()) p.maxAmmo[a.id] = a.backpackMax;
    }
    for (const a of this.registry.ammo.values()) p.ammo[a.id] = p.maxAmmo[a.id];
    for (const k of this.registry.config.keys ?? []) p.keys.add(k.id);
    p.armor = Math.max(p.armor, 200);
    p.armorClass = 2;
  }
}

/** "It's now safe to turn off your computer." */
class GoodbyeScene {
  constructor(game) {
    this.game = game;
    this.time = 0;
  }

  enter() {
    this.game.audio.stopMusic();
  }

  update(dt, input) {
    this.time += dt;
    if (this.time > 1 && (input.anyPressed || input.clicks.length)) this.game.setScene(new TitleScene(this.game));
  }

  render() {
    const g = this.game;
    const s = g.surface;
    s.clear(0);
    const f = g.font('small');
    const lines = g.registry.strings.goodbye ?? ["It's now safe to turn off", 'your computer.'];
    lines.forEach((line, i) => {
      f?.draw(s, line, SCREEN_W / 2, SCREEN_H / 2 - 10 + i * 10, { align: 'center', remap: g.palette.tint('gray', 'glow-amber') });
    });
  }
}
