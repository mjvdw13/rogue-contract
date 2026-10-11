const DEAD = 0.18;

function shape(v) {
  const a = Math.abs(v);
  if (a < DEAD) return 0;
  const t = (a - DEAD) / (1 - DEAD);
  return Math.sign(v) * t * t * (3 - 2 * t) * 0.35 + Math.sign(v) * t * 0.65;
}

/**
 * Polls standard-mapping gamepads (Xbox/PlayStation layouts) and feeds the
 * shared Input: buttons become 'Pad<n>' codes, sticks become analog axes.
 */
export class GamepadPoller {
  /** @param {import('./input.js').Input} input */
  constructor(input) {
    this.input = input;
    this.prev = new Map();
    this.connected = false;
    this.turnSpeed = 18; // "mouse pixels" per tick at full deflection
    window.addEventListener('gamepadconnected', () => {
      this.connected = true;
    });
  }

  poll() {
    if (!this.connected || !navigator.getGamepads) return;
    const pads = navigator.getGamepads();
    let any = false;
    for (const pad of pads) {
      if (!pad || !pad.connected) continue;
      any = true;
      const prev = this.prev.get(pad.index) ?? [];
      const now = [];
      pad.buttons.forEach((b, i) => {
        const pressed = b.pressed || b.value > 0.5;
        now[i] = pressed;
        if (pressed !== !!prev[i]) {
          this.input.setVirtual(`Pad${i}`, pressed);
          if (pressed) this.input.lastDevice = 'gamepad';
        }
      });
      this.prev.set(pad.index, now);
      const [lx = 0, ly = 0, rx = 0, ry = 0] = pad.axes;
      const strafe = shape(lx);
      const move = -shape(ly);
      const turn = shape(rx);
      if (strafe || move || turn) this.input.lastDevice = 'gamepad';
      this.input.analog.strafe = strafe || (this.input.lastDevice === 'gamepad' ? 0 : this.input.analog.strafe);
      this.input.analog.move = move || (this.input.lastDevice === 'gamepad' ? 0 : this.input.analog.move);
      if (turn) this.input.mouseDX += turn * this.turnSpeed;
      const lookY = shape(ry);
      if (lookY) this.input.mouseDY += lookY * this.turnSpeed * 0.6;
      break; // first active pad only
    }
    if (!any) this.connected = false;
  }
}
