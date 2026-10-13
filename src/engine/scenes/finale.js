import { SCREEN_W, SCREEN_H, BACKDROP_EDGE } from '../config.js';

const CHARS_PER_SECOND = 14;

/**
 * End-of-episode text crawl, then an end picture. Episode `finale`:
 *   { text: 'Long story...', background: 'image-id', endImage: 'image-id', endText: 'THE END', music }
 */
export class FinaleScene {
  constructor(game, episode) {
    this.game = game;
    this.finale = episode.finale ?? {};
    this.time = 0;
    this.stage = 'text';
    const font = game.font('small');
    this.lines = font ? font.wrap(this.finale.text ?? '', SCREEN_W - 40) : [];
    this.totalChars = this.lines.reduce((n, l) => n + l.length, 0);
    // Fit the crawl on screen: tighten the leading if needed, then centre it.
    this.lineH = this.lines.length * 10 + 16 <= SCREEN_H ? 10 : 9;
    this.top = Math.max(6, Math.floor((SCREEN_H - this.lines.length * this.lineH) / 2));
  }

  enter() {
    this.game.playMusic(this.finale.music ?? 'finale');
    this.game.input.unlockPointer();
  }

  update(dt, input) {
    this.time += dt;
    const pressed = (input.anyPressed || input.clicks.length > 0) && this.time > 0.6;
    if (this.stage === 'text') {
      const shown = this.time * CHARS_PER_SECOND;
      if (pressed) {
        if (shown < this.totalChars) this.time = this.totalChars / CHARS_PER_SECOND + 0.01;
        else {
          this.stage = 'end';
          this.time = 0;
          this.game.wipeNext();
        }
      }
    } else if (pressed) {
      this.game.quitToTitle();
    }
  }

  render() {
    const g = this.game;
    const s = g.surface;
    const pal = g.palette;
    s.clear(0);
    if (this.stage === 'text') {
      const bg = g.assets.image(this.finale.background ?? 'finale-bg');
      if (bg) s.blitBackdrop(bg, pal.colormap(BACKDROP_EDGE));
      const font = g.font('small');
      let budget = Math.floor(this.time * CHARS_PER_SECOND);
      const remap = pal.tint('gray', 'beige');
      this.lines.forEach((line, i) => {
        if (budget <= 0) return;
        const part = line.slice(0, budget);
        budget -= line.length;
        font?.draw(s, part, 20, this.top + i * this.lineH, { remap, shadow: 0 });
      });
    } else {
      const img = g.assets.image(this.finale.endImage ?? 'finale-end');
      if (img) s.blitBackdrop(img, pal.colormap(BACKDROP_EDGE));
      const gold = g.font('gold') ?? g.font('big');
      if (this.finale.endText !== '') {
        gold?.draw(s, this.finale.endText ?? 'THE END', SCREEN_W / 2, SCREEN_H - 30, { align: 'center' });
      }
    }
  }
}
