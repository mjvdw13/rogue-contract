import { SCREEN_W, BACKDROP_EDGE } from '../config.js';

function clock(seconds) {
  const s = Math.floor(seconds);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

const pct = (a, b) => (b ? Math.floor((a * 100) / b) : 100);

/** "Level finished" stats screen, counting up Doom-style. */
export class IntermissionScene {
  /**
   * @param {*} game
   * @param {{level:any, next:any|null, episode?:any, stats:any, onDone:()=>void}} info
   */
  constructor(game, info) {
    this.game = game;
    this.info = info;
    const st = info.stats;
    this.targets = {
      kills: pct(st.kills, st.totalKills),
      items: pct(st.items, st.totalItems),
      secrets: pct(st.secrets, st.totalSecrets),
      time: Math.floor(st.time),
    };
    this.shown = { kills: -1, items: -1, secrets: -1, time: -1 };
    this.stage = 0; // 0 kills, 1 items, 2 secrets, 3 time, 4 done, 5 entering
    this.acc = 0;
    this.time = 0;
    this.pause = 0.6;
  }

  enter() {
    this.game.playMusic(this.game.registry.config.intermissionMusic ?? 'intermission');
    this.game.input.unlockPointer();
  }

  _skip() {
    for (const k of Object.keys(this.targets)) this.shown[k] = this.targets[k];
    this.stage = 4;
    this.game.audio.play('tally-done');
  }

  update(dt, input) {
    this.time += dt;
    const pressed = input.anyPressed || input.clicks.length > 0;
    if (pressed && this.time > 0.5) {
      if (this.stage < 4) this._skip();
      else if (this.stage === 4 && this.info.next) {
        this.stage = 5;
        this.time = 0.5;
      } else {
        this.info.onDone();
        return;
      }
    }
    if (this.stage === 5 && this.time > 3) {
      this.info.onDone();
      return;
    }
    if (this.pause > 0) {
      this.pause -= dt;
      return;
    }
    if (this.stage >= 4) return;
    const key = ['kills', 'items', 'secrets', 'time'][this.stage];
    this.acc += dt;
    while (this.acc >= 1 / 30) {
      this.acc -= 1 / 30;
      const step = key === 'time' ? Math.max(1, Math.ceil(this.targets.time / 40)) : 2;
      this.shown[key] = Math.min(this.targets[key], Math.max(0, this.shown[key]) + step);
      if (Math.floor(this.time * 30) % 3 === 0) this.game.audio.play('tally');
      if (this.shown[key] >= this.targets[key]) {
        this.game.audio.play('tally-done');
        this.stage++;
        this.pause = 0.5;
        break;
      }
    }
  }

  render() {
    const g = this.game;
    const s = g.surface;
    const pal = g.palette;
    s.clear(0);
    const bg = g.assets.image('intermission');
    if (bg) s.blitBackdrop(bg, pal.colormap(BACKDROP_EDGE));
    const big = g.font('big');
    const gold = g.font('gold') ?? big;
    const small = g.font('small');
    const str = g.registry.strings.intermission ?? {};
    const level = this.info.level;
    if (this.stage < 5) {
      gold?.draw(s, level.name, SCREEN_W / 2, 10, { align: 'center' });
      small?.draw(s, str.finished ?? 'FINISHED', SCREEN_W / 2, 30, { align: 'center', remap: pal.tint('gray', 'beige'), shadow: 0 });
      const rows = [
        [str.kills ?? 'KILLS', this.shown.kills, '%'],
        [str.items ?? 'ITEMS', this.shown.items, '%'],
        [str.secrets ?? 'SECRET', this.shown.secrets, '%'],
      ];
      rows.forEach(([label, value, suffix], i) => {
        const y = 52 + i * 22;
        big?.draw(s, label, 50, y);
        if (value >= 0) big?.draw(s, `${value}${suffix}`, 270, y, { align: 'right' });
      });
      const y = 52 + 3 * 22 + 6;
      big?.draw(s, str.time ?? 'TIME', 50, y);
      if (this.shown.time >= 0) big?.draw(s, clock(this.shown.time), 150, y, { align: 'right' });
      if (level.par) {
        big?.draw(s, str.par ?? 'PAR', 170, y);
        big?.draw(s, clock(level.par), 290, y, { align: 'right' });
      }
    } else if (this._hasMap()) {
      this._drawMap();
      small?.draw(s, str.entering ?? 'ENTERING', SCREEN_W / 2, 4, { align: 'center', remap: pal.tint('gray', 'beige'), shadow: 0 });
      gold?.draw(s, this.info.next.name, SCREEN_W / 2, 13, { align: 'center' });
    } else {
      small?.draw(s, str.entering ?? 'ENTERING', SCREEN_W / 2, 70, { align: 'center', remap: pal.tint('gray', 'beige'), shadow: 0 });
      gold?.draw(s, this.info.next.name, SCREEN_W / 2, 84, { align: 'center' });
    }
  }

  /** Episodes can give each level a spot on the intermission picture: map: { spots: { e1m1: [x, y] } }. */
  _hasMap() {
    return !!this.info.episode?.map?.spots;
  }

  /** Doom-style route map: finished levels crossed out, a blinking marker on the next one. */
  _drawMap() {
    const s = this.game.surface;
    const pal = this.game.palette;
    const { levels } = this.info.episode;
    const spots = this.info.episode.map.spots;
    const red = pal.ramp('glow-red', 1);
    const dark = pal.ramp('blood', 0.15);
    const done = levels.indexOf(this.info.level.id);
    for (let i = 0; i <= done; i++) {
      const p = spots[levels[i]];
      if (!p) continue;
      const [x, y] = p;
      for (const [dx, c] of [[1, dark], [0, red]]) {
        s.line(x - 3 + dx, y - 3 + dx, x + 3 + dx, y + 3 + dx, c);
        s.line(x - 3 + dx, y - 2 + dx, x + 2 + dx, y + 3 + dx, c);
        s.line(x + 3 + dx, y - 3 + dx, x - 3 + dx, y + 3 + dx, c);
        s.line(x + 3 + dx, y - 2 + dx, x - 2 + dx, y + 3 + dx, c);
      }
    }
    const next = this.info.next && spots[this.info.next.id];
    if (!next || Math.floor(this.time * 3) % 3 === 2) return;
    const [x, y] = next;
    const yellow = pal.ramp('glow-yellow', 0.6);
    s.fillRect(x - 2, y - 2, 5, 5, yellow);
    s.rect(x - 3, y - 3, 7, 7, dark);
    const tiny = this.game.font('tiny');
    const label = this.game.registry.strings.intermission?.youAreHere ?? 'YOU ARE HERE';
    const right = x < SCREEN_W - 70;
    const lx = right ? x + 8 : x - 8;
    s.line(right ? x + 4 : x - 4, y, lx, y, yellow);
    tiny?.draw(s, label, right ? lx + 2 : lx - 2, y - 2, { align: right ? 'left' : 'right', remap: pal.tint('gray', 'glow-yellow'), shadow: 0 });
  }
}
