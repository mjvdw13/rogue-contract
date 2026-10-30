import { VIEW_W, VIEW_H, SCREEN_H } from '../config.js';
import { F_SOLID, F_DOOR, F_USE, F_EXIT, F_VOID, F_SLAB } from '../world/tilemap.js';

/**
 * Corner HUD layout: each panel's size and its readout insets [x, y, w, h].
 * Matches assets/ui/hud-left.png and hud-right.png (tools/art/ui/hud.js).
 */
export const CORNERS = {
  left: { w: 112, h: 32, slots: { shield: [3, 3, 52, 27], health: [57, 3, 52, 27] } },
  right: { w: 72, h: 32, slots: { ammo: [17, 3, 52, 27], keys: [3, 3, 12, 27] } },
};

/** How far up from the bottom the automap's level name and other prompts must stay to clear the corner panels. */
export const HUD_CLEAR = CORNERS.left.h + 4;

const MESSAGE_TIME = 4;

/**
 * Dark Forces-style corner readouts, pickup messages and the automap.
 */
export class Hud {
  /** @param {*} game */
  constructor(game) {
    this.game = game;
    this.messages = [];
    this.automap = false;
    this.mapScale = 3; // pixels per tile
    this.revealThings = false;
  }

  reset() {
    this.messages = [];
    this.automap = false;
  }

  message(text) {
    if (!text) return;
    if (!this.game.settings.messages && !text.startsWith('!')) return;
    this.messages.push({ text: text.replace(/^!/, ''), time: MESSAGE_TIME });
    if (this.messages.length > 3) this.messages.shift();
  }

  update(dt) {
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

  /** Readouts in the bottom corners of the screen (the real corners on widescreen): shield and health left, ammo and keys right. */
  drawHud(world) {
    const g = this.game;
    const s = g.surface;
    const reg = g.registry;
    const p = world.player.player;
    const hud = g.font('hud');
    const tiny = g.font('tiny');
    const labelTint = this._tint('steel');
    const labels = reg.strings.hud ?? {};
    const L = { x: s.left, y: SCREEN_H - CORNERS.left.h };
    const R = { x: s.w - s.ox - CORNERS.right.w, y: SCREEN_H - CORNERS.right.h };
    const leftImg = g.assets.image('hud-left');
    const rightImg = g.assets.image('hud-right');
    if (leftImg) s.blit(leftImg, L.x, L.y);
    if (rightImg) s.blit(rightImg, R.x, R.y);

    const readout = (at, [x, y, w], value, label) => {
      if (hud && value !== null) this._number(hud, value, at.x + x + w - 2, at.y + y + 2);
      tiny?.draw(s, label, at.x + x + Math.floor(w / 2), at.y + y + 20, { align: 'center', remap: labelTint });
    };
    const slotsL = CORNERS.left.slots;
    const slotsR = CORNERS.right.slots;
    readout(L, slotsL.shield, `${Math.max(0, Math.round(p.armor))}%`, labels.armor ?? 'SHIELD');
    readout(L, slotsL.health, `${Math.max(0, Math.ceil(p.health))}%`, labels.health ?? 'HEALTH');
    const w = reg.weapons.get(p.weapon);
    readout(R, slotsR.ammo, w?.ammo ? (p.ammo[w.ammo] ?? 0) : null, labels.ammo ?? 'AMMO');

    // Keycards, stacked in the outer slot.
    const icons = g.assets.sheets.get('hud-icons');
    const [kx, ky] = slotsR.keys;
    (reg.config.keys ?? []).forEach((k, i) => {
      if (p.keys.has(k.id) && icons) s.blit(icons.frame(k.icon ?? i), R.x + kx + 2, R.y + ky + i * 9);
    });
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
    const cFence = pal.ramp('gray', 0.6);
    const cSlab = pal.ramp('gray', 0.45);
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
          // A slab's edges where it meets open floor without one (a bridge's sides).
          if (f & F_SLAB) {
            const c = seen ? cSlab : cHidden;
            const bare = (nx, ny) => map.inBounds(nx, ny) && !(map.flags[ny * map.w + nx] & (F_SOLID | F_SLAB));
            if (bare(x, y - 1)) clipLine(sx(x), sy(y), sx(x + 1), sy(y), c);
            if (bare(x, y + 1)) clipLine(sx(x), sy(y + 1), sx(x + 1), sy(y + 1), c);
            if (bare(x - 1, y)) clipLine(sx(x), sy(y), sx(x), sy(y + 1), c);
            if (bare(x + 1, y)) clipLine(sx(x + 1), sy(y), sx(x + 1), sy(y + 1), c);
          }
          // Fences on this tile's edges (each is drawn from both tiles beside it).
          for (let edge = 0; edge < 4; edge++) {
            if (map.fenceAt[i * 4 + edge] < 0) continue;
            const c = seen ? cFence : cHidden;
            if (edge === 0) clipLine(sx(x), sy(y), sx(x + 1), sy(y), c);
            else if (edge === 1) clipLine(sx(x + 1), sy(y), sx(x + 1), sy(y + 1), c);
            else if (edge === 2) clipLine(sx(x), sy(y + 1), sx(x + 1), sy(y + 1), c);
            else clipLine(sx(x), sy(y), sx(x), sy(y + 1), c);
          }
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
        else if (t.kind === 'npc') c = t.dead ? pal.ramp('gray', 0.4) : pal.ramp('glow-green', 1);
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
      font.draw(s, name, 3, VIEW_H - HUD_CLEAR - 9, { remap, shadow: 0 });
      const lab = g.registry.strings.automap ?? {};
      font.draw(s, `${lab.kills ?? 'K'} ${st.kills}/${st.totalKills}`, 3, 3, { remap, shadow: 0 });
      font.draw(s, `${lab.items ?? 'I'} ${st.items}/${st.totalItems}`, 3, 12, { remap, shadow: 0 });
      font.draw(s, `${lab.secrets ?? 'S'} ${st.secrets}/${st.totalSecrets}`, 3, 21, { remap, shadow: 0 });
    }
  }
}
