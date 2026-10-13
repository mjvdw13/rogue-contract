import { SCREEN_W, SCREEN_H, VIEW_H } from '../config.js';

/**
 * Data-driven menus. A menu is
 *   { id, title, items: [ item... ], onBack? }
 * and an item is one of
 *   { label, action() }                               a button
 *   { label, slider: { get, set, min, max } }         left/right to change
 *   { label, choice: { get, set, options: [{value, label}] } }
 *   { label, toggle: { get, set } }
 *   { label, disabled: () => bool }                   greyed out
 *   { text: 'Some words', tint?, center? }             a line of small, unselectable text
 * Navigation works with keys, mouse/touch and gamepads.
 */
export class MenuSystem {
  constructor(game) {
    this.game = game;
    this.stack = [];
    this.confirm = null;
    this.time = 0;
    this.itemRects = [];
  }

  get active() {
    return this.stack.length > 0 || !!this.confirm;
  }

  get current() {
    return this.stack[this.stack.length - 1] ?? null;
  }

  open(menu) {
    const items = typeof menu.items === 'function' ? menu.items() : menu.items;
    const entry = { menu, items, index: menu.defaultIndex ?? 0 };
    if (!this._enabled(items[entry.index])) entry.index = this._firstSelectable(entry);
    this.stack.push(entry);
    this.game.audio.play('menu-open');
  }

  /** Replace the top menu (e.g. to refresh labels). */
  refresh() {
    const top = this.current;
    if (!top) return;
    top.items = typeof top.menu.items === 'function' ? top.menu.items() : top.menu.items;
    top.index = Math.min(top.index, top.items.length - 1);
  }

  back() {
    const top = this.stack.pop();
    this.game.audio.play('menu-back');
    top?.menu.onBack?.();
    if (!this.stack.length) this.game.onMenuClosed?.();
  }

  closeAll() {
    const had = this.stack.length > 0;
    this.stack = [];
    this.confirm = null;
    if (had) this.game.onMenuClosed?.();
  }

  /** Yes/no prompt: { text, onYes, onNo? } */
  ask(text, onYes, onNo) {
    this.confirm = { text, onYes, onNo };
    this.game.audio.play('menu-open');
  }

  _enabled(item) {
    return !!item && !item.separator && item.text === undefined && !(item.disabled && item.disabled());
  }

  _firstSelectable(entry) {
    const i = entry.items.findIndex((it) => this._enabled(it));
    return i < 0 ? 0 : i;
  }

  _move(entry, dir) {
    const n = entry.items.length;
    for (let k = 1; k <= n; k++) {
      const i = (entry.index + dir * k + n * 2) % n;
      if (this._enabled(entry.items[i])) {
        entry.index = i;
        this.game.audio.play('menu-move');
        return;
      }
    }
  }

  _adjust(item, dir) {
    if (item.slider) {
      const { get, set, min = 0, max = 10, step = 1 } = item.slider;
      set(Math.max(min, Math.min(max, get() + dir * step)));
      this.game.audio.play('menu-move');
    } else if (item.choice) {
      const { get, set, options } = item.choice;
      const i = options.findIndex((o) => o.value === get());
      set(options[(i + dir + options.length) % options.length].value);
      this.game.audio.play('menu-move');
    } else if (item.toggle) {
      item.toggle.set(!item.toggle.get());
      this.game.audio.play('menu-move');
    }
  }

  _activate(item) {
    if (!this._enabled(item)) return;
    if (item.action) {
      this.game.audio.play('menu-select');
      item.action();
    } else {
      this._adjust(item, 1);
    }
  }

  /** A client (CSS pixel) position in layout coordinates (the centre 320 columns). */
  _toLayout(x, y) {
    const pt = this.game.presenter.toScreen(x, y);
    pt.x -= this.game.surface.ox;
    return pt;
  }

  update(dt, input) {
    this.time += dt;
    if (this.confirm) {
      const c = this.confirm;
      const click = input.clicks[0];
      if (input.wasPressed('yes') || (click && this._toLayout(click.x, click.y).x < SCREEN_W / 2)) {
        this.confirm = null;
        this.game.audio.play('menu-select');
        c.onYes?.();
      } else if (input.wasPressed('no') || click) {
        this.confirm = null;
        this.game.audio.play('menu-back');
        c.onNo?.();
      }
      return;
    }
    const top = this.current;
    if (!top) return;
    const item = top.items[top.index];
    if (input.wasPressed('menuUp')) this._move(top, -1);
    else if (input.wasPressed('menuDown')) this._move(top, 1);
    else if (input.wasPressed('menuLeft')) this._adjust(item, -1);
    else if (input.wasPressed('menuRight')) this._adjust(item, 1);
    else if (input.wasPressed('menuBack') || input.wasPressed('menu')) this.back();
    else if (input.wasPressed('menuSelect')) this._activate(item);

    // Mouse / touch.
    if (input.pointer?.moved) {
      input.pointer.moved = false;
      const pt = this._toLayout(input.pointer.x, input.pointer.y);
      const hit = this.itemRects.find((r) => pt.y >= r.y && pt.y < r.y + r.h);
      if (hit && hit.index !== top.index && this._enabled(top.items[hit.index])) top.index = hit.index;
    }
    for (const click of input.clicks) {
      const pt = this._toLayout(click.x, click.y);
      const hit = this.itemRects.find((r) => pt.y >= r.y && pt.y < r.y + r.h && pt.x >= r.x - 20 && pt.x < r.x + r.w + 20);
      if (hit) {
        top.index = hit.index;
        const it = top.items[hit.index];
        if (it.slider || it.choice) this._adjust(it, pt.x < hit.x + hit.w / 2 ? -1 : 1);
        else this._activate(it);
      } else if (pt.y < 30 || pt.y > SCREEN_H - 20) {
        this.back();
      }
    }
  }

  draw(overGame) {
    const g = this.game;
    const s = g.surface;
    const pal = g.palette;
    if (overGame) s.shadeRect(s.left, 0, s.w, VIEW_H, pal.colormap(22));
    if (this.confirm) {
      this._drawConfirm();
      return;
    }
    const top = this.current;
    if (!top) return;
    const big = g.font('big');
    const gold = g.font('gold') ?? big;
    const small = g.font('small');
    const menu = top.menu;
    let y = menu.y ?? 24;
    if (menu.title && gold) {
      gold.draw(s, menu.title, menu.titleX ?? SCREEN_W / 2, y, { align: 'center' });
      y += 24;
    }
    if (menu.subtitle && small) {
      small.draw(s, menu.subtitle, SCREEN_W / 2, y - 4, { align: 'center', remap: pal.tint('gray', 'beige'), shadow: 0 });
      y += 10;
    }
    const lineH = menu.lineHeight ?? 17;
    const left = menu.x ?? 80;
    this.itemRects = [];
    top.items.forEach((item, i) => {
      if (item.separator) {
        y += 6;
        return;
      }
      if (item.text !== undefined) {
        if (small) {
          const tint = pal.tint('gray', item.tint ?? 'beige');
          small.draw(s, item.text, item.center ? SCREEN_W / 2 : (menu.textX ?? 20), y, { align: item.center ? 'center' : 'left', remap: tint, shadow: 0 });
        }
        y += 9;
        return;
      }
      const enabled = this._enabled(item);
      const font = menu.small ? small : big;
      const remap = !enabled ? pal.tint('blood', 'gray') : undefined;
      let label = item.label;
      if (item.toggle) label += item.toggle.get() ? ': ON' : ': OFF';
      if (item.choice) {
        const cur = item.choice.options.find((o) => o.value === item.choice.get());
        label += `: ${cur?.label ?? '?'}`;
      }
      if (font) font.draw(s, label, left, y, { remap, shadow: menu.small ? 0 : undefined });
      const w = font ? font.measure(label) : 100;
      if (item.slider) this._drawSlider(item.slider, left + w + 8, y + 4);
      this.itemRects.push({ index: i, x: left, y: y - 2, w: Math.max(w, 120), h: lineH });
      if (i === top.index) this._drawCursor(left - 22, y - 1);
      y += menu.small ? 11 : lineH;
    });
    if (menu.footer && small) {
      small.draw(s, menu.footer, SCREEN_W / 2, SCREEN_H - 12, { align: 'center', remap: pal.tint('gray', 'steel'), shadow: 0 });
    }
  }

  _drawCursor(x, y) {
    const sheet = this.game.assets.sheets.get('cursor');
    if (!sheet) return;
    const blink = Math.floor(this.time * 3) % 4 === 3 ? 1 : 0;
    const bob = Math.round(Math.sin(this.time * 6) * 1);
    this.game.surface.blit(sheet.frame(blink), x, y + bob);
  }

  _drawSlider(slider, x, y) {
    const s = this.game.surface;
    const pal = this.game.palette;
    const { get, min = 0, max = 10 } = slider;
    const n = max - min;
    const w = n * 6 + 6;
    s.fillRect(x, y, w, 7, pal.ramp('gray', 0.12));
    s.rect(x, y, w, 7, pal.ramp('blood', 0.5));
    const pos = x + 3 + ((get() - min) / Math.max(1, n)) * (w - 9);
    s.fillRect(pos, y + 1, 3, 5, pal.ramp('glow-yellow', 0.8));
  }

  _drawConfirm() {
    const g = this.game;
    const s = g.surface;
    const pal = g.palette;
    const small = g.font('small');
    if (!small) return;
    const lines = small.wrap(this.confirm.text, 250);
    const h = lines.length * 10 + 24;
    const y = Math.round(SCREEN_H / 2 - h / 2);
    s.shadeRect(s.left, 0, s.w, SCREEN_H, pal.colormap(26));
    s.fillRect(24, y, SCREEN_W - 48, h, pal.ramp('gray', 0.05));
    s.rect(24, y, SCREEN_W - 48, h, pal.ramp('blood', 0.6));
    lines.forEach((line, i) => {
      small.draw(s, line, SCREEN_W / 2, y + 8 + i * 10, { align: 'center', remap: pal.tint('gray', 'beige'), shadow: 0 });
    });
    small.draw(s, g.registry.strings.yesNo ?? '(PRESS Y OR N)', SCREEN_W / 2, y + h - 12, {
      align: 'center',
      remap: pal.tint('gray', 'glow-yellow'),
      shadow: 0,
    });
  }
}
