import { TICK } from '../config.js';

const MAX_FRAME = 0.25;
const MAX_STEPS = 10;

/**
 * Fixed-timestep loop: `update(TICK)` runs at a steady 60 Hz no matter the
 * display refresh rate, `render(frameDt)` runs once per animation frame.
 */
export class Loop {
  constructor({ update, render }) {
    this.update = update;
    this.render = render;
    this.acc = 0;
    this.last = 0;
    this.running = false;
    this.fps = 0;
    this._fpsFrames = 0;
    this._fpsTime = 0;
    this._frame = this._frame.bind(this);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    requestAnimationFrame(this._frame);
  }

  stop() {
    this.running = false;
  }

  /** How far this frame is from the last tick to the next (0 to 1). */
  get alpha() {
    return this.acc >= TICK ? 1 : this.acc / TICK;
  }

  _frame(now) {
    if (!this.running) return;
    let dt = (now - this.last) / 1000;
    this.last = now;
    if (dt > MAX_FRAME) dt = MAX_FRAME;
    if (dt < 0) dt = 0;

    this.acc += dt;
    let steps = 0;
    while (this.acc >= TICK && steps < MAX_STEPS) {
      this.update(TICK);
      this.acc -= TICK;
      steps++;
    }
    if (steps >= MAX_STEPS) this.acc = 0;

    this.render(dt);

    this._fpsFrames++;
    this._fpsTime += dt;
    if (this._fpsTime >= 0.5) {
      this.fps = Math.round(this._fpsFrames / this._fpsTime);
      this._fpsFrames = 0;
      this._fpsTime = 0;
    }
    requestAnimationFrame(this._frame);
  }
}
