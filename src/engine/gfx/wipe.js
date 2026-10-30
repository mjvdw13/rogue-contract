/**
 * Doom's screen "melt": columns of the previous screen slide down at
 * slightly different speeds to reveal the next one.
 */
export class MeltWipe {
  /** `w` x `h` is the layout; the screen is `scale` times that in each direction. */
  constructor(w, h, scale = 1) {
    this.w = w;
    this.h = h;
    this.scale = scale;
    this.old = new Uint8Array(Math.round(w * scale) * Math.round(h * scale));
    this.cols = w >> 1; // two-pixel-wide columns, like the original
    this.y = new Int16Array(this.cols);
    this.active = false;
    this.acc = 0;
  }

  /** Snapshot the current screen and begin melting it away. */
  start(px, rng) {
    this.old.set(px);
    this.y[0] = -rng.int(0, 15);
    for (let i = 1; i < this.cols; i++) {
      const r = rng.int(-1, 1);
      this.y[i] = Math.max(-15, Math.min(0, this.y[i - 1] + r));
    }
    this.active = true;
    this.acc = 0;
  }

  update(dt) {
    if (!this.active) return;
    this.acc += dt;
    const step = 1 / 35;
    while (this.acc >= step) {
      this.acc -= step;
      let done = true;
      for (let i = 0; i < this.cols; i++) {
        let y = this.y[i];
        if (y < 0) {
          y++;
          done = false;
        } else if (y < this.h) {
          y += y < 16 ? y + 1 : 8;
          if (y > this.h) y = this.h;
          done = false;
        }
        this.y[i] = y;
      }
      if (done) {
        this.active = false;
        return;
      }
    }
  }

  /** Draw the melting old screen on top of the new one. */
  draw(px) {
    if (!this.active) return;
    const k = this.scale;
    const w = Math.round(this.w * k);
    const h = Math.round(this.h * k);
    const old = this.old;
    for (let c = 0; c < this.cols; c++) {
      const dy = Math.round(Math.max(0, this.y[c]) * k);
      if (dy >= h) continue;
      for (let x = Math.round(c * 2 * k); x < Math.round((c + 1) * 2 * k); x++) {
        for (let y = h - 1; y >= dy; y--) px[y * w + x] = old[(y - dy) * w + x];
      }
    }
  }
}
