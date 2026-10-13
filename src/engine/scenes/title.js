import { SCREEN_W, SCREEN_H, BACKDROP_EDGE } from '../config.js';
import { mainMenu } from '../ui/menus.js';

/** The title screen. Any key opens the main menu. */
export class TitleScene {
  constructor(game) {
    this.game = game;
    this.time = 0;
  }

  enter() {
    const g = this.game;
    g.playMusic(g.registry.config.titleMusic ?? 'title');
    g.input.unlockPointer();
  }

  update(dt, input) {
    this.time += dt;
    if (!this.game.menu.active && this.time > 0.4 && (input.anyPressed || input.clicks.length)) {
      this.game.menu.open(mainMenu(this.game));
    }
  }

  render() {
    const g = this.game;
    const s = g.surface;
    s.clear(0);
    const img = g.assets.image('title');
    if (img) s.blitBackdrop(img, g.palette.colormap(BACKDROP_EDGE));
    const portrait = g.photoPortrait;
    const pos = g.registry.config.titlePortrait;
    if (portrait && pos) {
      s.blit(portrait, pos.x, pos.y);
      s.rect(pos.x - 1, pos.y - 1, portrait.width + 2, portrait.height + 2, g.palette.ramp('gray', 0.02));
    }
    // Dim the picture behind the menu so the items stay readable.
    if (g.menu.active) s.shadeRect(s.left, 0, s.w, SCREEN_H, g.palette.colormap(g.menu.stack.length > 1 ? 20 : 12));
    if (!g.menu.active && Math.floor(this.time * 2) % 2 === 0) {
      const small = g.font('small');
      const text = g.registry.strings.pressAnyKey ?? 'PRESS ANY KEY';
      small?.draw(s, text, SCREEN_W / 2, SCREEN_H - 14, {
        align: 'center',
        remap: g.palette.tint('gray', 'glow-yellow'),
        shadow: 0,
      });
    }
  }
}
