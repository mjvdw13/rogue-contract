import { VIEW_W, VIEW_H } from '../config.js';
import { FaceController } from './face.js';
import { F_SOLID, F_DOOR, F_USE, F_EXIT, F_VOID } from '../world/tilemap.js';

/** Status-bar panel layout (x, width); matches assets/ui/statusbar.png. */
export const PANELS = {
  ammo: [2, 44],
  health: [48, 56],
  arms: [106, 34],
  face: [142, 36],
  armor: [180, 56],
  keys: [238, 12],
  tally: [252, 66],
};

/** A plain column of the status bar (inside the ammo panel), repeated out to the edges on widescreen. */
const BAR_FILL_COL = 24;

const MESSAGE_TIME = 4;

/**
 * Doom-style status bar, pickup messages and the automap.
 */
export class Hud {
  /** @param {*} game */
  constructor(game) {
    this.game = game;
    this.messages = [];
    this.automap = false;
    this.mapScale = 3; // pixels per tile
    this.face = new FaceController(game.rng);
    this.faceSheet = null;
    this.revealThings = false;
  }

  reset() {
    this.messages = [];
    this.automap = false;
    this.face = new FaceController(this.game.rng);
  }

  message(text) {
    if (!text) return;
    if (!this.game.settings.messages && !text.startsWith('!')) return;
    this.messages.push({ text: text.replace(/^!/, ''), time: MESSAGE_TIME });
    if (this.messages.length > 3) this.messages.shift();
  }

  update(dt, world) {
    this.face.update(dt, world);
    for (const m of this.messages) m.time -= dt;
    this.messages = this.messages.filter((m) => m.time > 0);
  }

  _tint(name) {
    return this.game.palette.tint('gray', name);
  }

  _number(font, value, right, y, remap) {
    const text = String(value);
    font.draw(this.game.surface, text, right, y, { align: 'right', remap });
  }

  drawStatusBar(world) {
    const g = this.game;
    const s = g.surface;
    const reg = g.registry;
    const Y = VIEW_H;
    const bar = g.assets.image('statusbar');
    if (bar) {
      s.blit(bar, 0, Y);
      // On widescreen, continue the bar's frame to the edges with one of its plain columns.
      for (let x = s.left; x < 0; x++) s.blit(bar, x, Y, { sx: BAR_FILL_COL, sw: 1 });
      for (let x = bar.width; x < s.w - s.ox; x++) s.blit(bar, x, Y, { sx: BAR_FILL_COL, sw: 1 });
    } else s.fillRect(s.left, Y, s.w, 32, g.palette.ramp('steel', 0.25));
    const p = world.player.player;
    const hud = g.font('hud');
    const tiny = g.font('tiny');
    const labelTint = this._tint('steel');
    const labels = reg.strings.hud ?? {};

    const panel = (name) => PANELS[name];
    const label = (name, text) => {
      const [x, w] = panel(name);
      tiny?.draw(s, text, x + Math.floor(w / 2), Y + 23, { align: 'center', remap: labelTint });
    };

    // Ammo for the current weapon.
    const w = reg.weapons.get(p.weapon);
    if (w?.ammo && hud) this._number(hud, p.ammo[w.ammo] ?? 0, panel('ammo')[0] + panel('ammo')[1] - 2, Y + 5);
    label('ammo', labels.ammo ?? 'AMMO');

    // Health.
    if (hud) this._number(hud, `${Math.max(0, Math.ceil(p.health))}%`, panel('health')[0] + panel('health')[1] - 2, Y + 5);
    label('health', labels.health ?? 'HEALTH');

    // Arms: weapon slots 2..7.
    const [ax] = panel('arms');
    const owned = new Set([...p.weapons].map((id) => reg.weapons.get(id)?.slot));
    for (let slot = 2; slot <= 7; slot++) {
      const i = slot - 2;
      const x = ax + 7 + (i % 3) * 9;
      const y = Y + 6 + Math.floor(i / 3) * 8;
      tiny?.draw(s, String(slot), x, y, { remap: owned.has(slot) ? this._tint('glow-yellow') : this._tint('steel') });
    }
    label('arms', labels.arms ?? 'ARMS');

    // Face.
    const [fx, fw] = panel('face');
    if (this.faceSheet) {
      const frame = this.faceSheet.frame(this.face.frame);
      s.blit(frame, fx + Math.floor((fw - frame.w) / 2), Y + 2);
    }

    // Armour.
    if (hud) this._number(hud, `${Math.max(0, Math.round(p.armor))}%`, panel('armor')[0] + panel('armor')[1] - 2, Y + 5);
    label('armor', labels.armor ?? 'ARMOR');

    // Keys.
    const icons = g.assets.sheets.get('hud-icons');
    const [kx] = panel('keys');
    (reg.config.keys ?? []).forEach((k, i) => {
      if (p.keys.has(k.id) && icons) s.blit(icons.frame(k.icon ?? i), kx + 2, Y + 3 + i * 9);
    });

    // Ammo tally.
    const [tx, tw] = panel('tally');
    let row = 0;
    for (const a of reg.ammo.values()) {
      const y = Y + 5 + row * 6;
      const have = p.ammo[a.id] ?? 0;
      const remap = this._tint('glow-yellow');
      tiny?.draw(s, a.short ?? a.id.slice(0, 4).toUpperCase(), tx + 3, y, { remap: labelTint });
      tiny?.draw(s, String(have), tx + 41, y, { align: 'right', remap });
      tiny?.draw(s, '/', tx + 45, y, { remap: labelTint });
      tiny?.draw(s, String(p.maxAmmo[a.id] ?? a.max), tx + tw - 3, y, { align: 'right', remap });
      if (++row >= 4) break;
    }
  }

  drawMessages() {
    const g = this.game;
    const font = g.font('small');
    if (!font) return;
    const remap = this._tint(g.registry.config.colors?.message ?? 'beige');
    this.messages.forEach((m, i) => {
      font.draw(g.surface, m.text, 3, 3 + i * 9, { remap, shadow: g.palette.ramp('gray', 0) });
    });
  }

  drawCentered(text, y, tint = 'beige') {
    const g = this.game;
    const font = g.font('small');
    if (!font) return;
    font.draw(g.surface, text, VIEW_W / 2, y, { align: 'center', remap: this._tint(tint), shadow: 0 });
  }

  /** Top-down map of everything the player has seen (Tab). */
  drawAutomap(world) {
    const g = this.game;
    const s = g.surface;
    const pal = g.palette;
    const map = world.map;
    const pt = world.player;
    const p = pt.player;
    // The map covers the whole view, past the centre 320 columns on widescreen.
    const mapL = s.left;
    const mapR = s.w - s.ox;
    s.fillRect(mapL, 0, s.w, VIEW_H, 0);
    const scale = this.mapScale;
    const cx = VIEW_W / 2;
    const cy = VIEW_H / 2;
    const sx = (x) => cx + (x - pt.x) * scale;
    const sy = (y) => cy + (y - pt.y) * scale;
    const cWall = pal.ramp('blood', 0.85);
    const cHidden = pal.ramp('gray', 0.35);
    const cDoor = pal.ramp('yellow', 0.8);
    const cSwitch = pal.ramp('toxic', 0.9);
    const cExit = pal.ramp('glow-green', 1);
    const keyColor = (lock) => {
      const k = (g.registry.config.keys ?? []).find((kk) => kk.id === lock);
      return k?.ramp ? pal.ramp(k.ramp, 0.8) : cDoor;
    };
    const tilesX = Math.ceil(s.w / scale / 2) + 2;
    const tilesY = Math.ceil(VIEW_H / scale / 2) + 2;
    const x0 = Math.max(0, Math.floor(pt.x) - tilesX);
    const x1 = Math.min(map.w - 1, Math.floor(pt.x) + tilesX);
    const y0 = Math.max(0, Math.floor(pt.y) - tilesY);
    const y1 = Math.min(map.h - 1, Math.floor(pt.y) + tilesY);
    const clipLine = (ax, ay, bx, by, c) => {
      if (Math.max(ax, bx) < mapL || Math.min(ax, bx) >= mapR || Math.max(ay, by) < 0 || Math.min(ay, by) >= VIEW_H) return;
      const old = s.h;
      s.h = VIEW_H;
      s.line(ax, ay, bx, by, c);
      s.h = old;
    };
    // Closed secret doors look like plain wall on the map until found.
    const hiddenDoor = (i) => map.flags[i] & F_DOOR && map.doors[map.doorIndex[i]].secret && map.doors[map.doorIndex[i]].state === 'closed';
    // An edge next to an angled-wall tile counts as open only where that tile is open.
    const open = (x, y, ex, ey) => {
      if (!map.inBounds(x, y) || map.flags[y * map.w + x] & F_SOLID || hiddenDoor(y * map.w + x)) return false;
      const sl = map.slantAt(x, y);
      return !sl || !sl.solidAt(ex, ey);
    };
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const i = y * map.w + x;
        const f = map.flags[i];
        const seen = map.seen[i] || this.revealThings;
        if (!seen && !p.hasMap) continue;
        if (f & F_DOOR && !hiddenDoor(i)) {
          const d = map.doors[map.doorIndex[i]];
          const c = !seen ? cHidden : d.lock && d.lock !== 'remote' ? keyColor(d.lock) : cDoor;
          if (d.axis === 'x') clipLine(sx(x + 0.5), sy(y), sx(x + 0.5), sy(y + 1), c);
          else clipLine(sx(x), sy(y + 0.5), sx(x + 1), sy(y + 0.5), c);
          continue;
        }
        if ((!(f & F_SOLID) && !hiddenDoor(i)) || f & F_VOID) {
          if (f & F_EXIT && seen) s.fillRect(sx(x + 0.3), sy(y + 0.3), Math.max(1, scale * 0.4), Math.max(1, scale * 0.4), cExit);
          const sl = map.slantAt(x, y);
          if (sl) clipLine(sx(sl.ax), sy(sl.ay), sx(sl.bx), sy(sl.by), seen ? cWall : cHidden);
          continue;
        }
        const c = !seen ? cHidden : f & F_USE ? cSwitch : cWall;
        if (open(x, y - 1, x + 0.5, y - 0.01)) clipLine(sx(x), sy(y), sx(x + 1), sy(y), c);
        if (open(x, y + 1, x + 0.5, y + 1.01)) clipLine(sx(x), sy(y + 1), sx(x + 1), sy(y + 1), c);
        if (open(x - 1, y, x - 0.01, y + 0.5)) clipLine(sx(x), sy(y), sx(x), sy(y + 1), c);
        if (open(x + 1, y, x + 1.01, y + 0.5)) clipLine(sx(x + 1), sy(y), sx(x + 1), sy(y + 1), c);
      }
    }
    if (this.revealThings) {
      for (const t of world.things) {
        if (t === pt || t.removed) continue;
        let c = pal.ramp('steel', 0.6);
        if (t.kind === 'monster') c = t.dead ? pal.ramp('gray', 0.4) : pal.ramp('glow-red', 1);
        else if (t.kind === 'npc') c = pal.ramp('glow-green', 1);
        else if (t.kind === 'item') c = pal.ramp('glow-yellow', 0.6);
        s.fillRect(sx(t.x) - 1, sy(t.y) - 1, 2, 2, c);
      }
    }
    // Player arrow.
    const a = pt.angle;
    const L = Math.max(4, scale * 0.9);
    const tip = [cx + Math.cos(a) * L, cy + Math.sin(a) * L];
    const left = [cx + Math.cos(a + 2.5) * L * 0.6, cy + Math.sin(a + 2.5) * L * 0.6];
    const right = [cx + Math.cos(a - 2.5) * L * 0.6, cy + Math.sin(a - 2.5) * L * 0.6];
    const white = pal.ramp('glow-yellow', 1);
    clipLine(left[0], left[1], tip[0], tip[1], white);
    clipLine(right[0], right[1], tip[0], tip[1], white);
    clipLine(left[0], left[1], right[0], right[1], white);

    const font = g.font('small');
    if (font) {
      const remap = this._tint('beige');
      const st = world.stats;
      const name = `${world.level.mapLabel ?? world.level.id.toUpperCase()}: ${world.level.name}`;
      font.draw(s, name, 3, VIEW_H - 10, { remap, shadow: 0 });
      const lab = g.registry.strings.automap ?? {};
      font.draw(s, `${lab.kills ?? 'K'} ${st.kills}/${st.totalKills}`, 3, 3, { remap, shadow: 0 });
      font.draw(s, `${lab.items ?? 'I'} ${st.items}/${st.totalItems}`, 3, 12, { remap, shadow: 0 });
      font.draw(s, `${lab.secrets ?? 'S'} ${st.secrets}/${st.totalSecrets}`, 3, 21, { remap, shadow: 0 });
    }
  }
}
