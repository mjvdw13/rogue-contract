/**
 * Action-based input. Physical keys/buttons ("codes") are bound to named
 * actions; game code only asks about actions. Codes:
 *   - keyboard: KeyboardEvent.code, e.g. 'KeyW', 'ArrowUp', 'Space'
 *   - mouse: 'Mouse0' (left), 'Mouse1' (middle), 'Mouse2' (right), 'WheelUp', 'WheelDown'
 *   - gamepad: 'Pad0'..'Pad16' (standard mapping button indices)
 */
export const DEFAULT_BINDINGS = {
  forward: ['KeyW', 'ArrowUp'],
  back: ['KeyS', 'ArrowDown'],
  strafeLeft: ['KeyA'],
  strafeRight: ['KeyD'],
  turnLeft: ['ArrowLeft'],
  turnRight: ['ArrowRight'],
  fire: ['Mouse0', 'KeyF', 'ControlLeft', 'ControlRight', 'Pad7', 'Pad6'],
  use: ['KeyE', 'Mouse2', 'Pad2'],
  run: ['ShiftLeft', 'ShiftRight'],
  jump: ['Space', 'Pad0'],
  crouch: ['KeyC', 'Pad1'],
  lookUp: ['PageUp', 'Home'],
  lookDown: ['PageDown', 'Delete'],
  lookCenter: ['End', 'Pad11'],
  automap: ['Tab', 'KeyM', 'Pad8'],
  nextWeapon: ['WheelDown', 'BracketRight', 'Pad5'],
  prevWeapon: ['WheelUp', 'BracketLeft', 'KeyQ', 'Pad4'],
  weapon1: ['Digit1'],
  weapon2: ['Digit2'],
  weapon3: ['Digit3'],
  weapon4: ['Digit4'],
  weapon5: ['Digit5'],
  weapon6: ['Digit6'],
  weapon7: ['Digit7'],
  weapon8: ['Digit8'],
  weapon9: ['Digit9'], // the concussion rifle
  zoomIn: ['Equal', 'NumpadAdd'],
  zoomOut: ['Minus', 'NumpadSubtract'],
  menu: ['Escape', 'Pad9'],
  menuUp: ['ArrowUp', 'KeyW', 'Pad12'],
  menuDown: ['ArrowDown', 'KeyS', 'Pad13'],
  menuLeft: ['ArrowLeft', 'KeyA', 'Pad14'],
  menuRight: ['ArrowRight', 'KeyD', 'Pad15'],
  menuSelect: ['Enter', 'NumpadEnter', 'Space', 'KeyE', 'Pad0'],
  menuBack: ['Escape', 'Backspace', 'Pad1', 'Pad9'],
  yes: ['KeyY', 'Enter', 'Pad0'],
  no: ['KeyN', 'Escape', 'Backspace', 'Pad1'],
};

// Keys whose browser default (scrolling, focus moves, quick find) would get in the way.
const PREVENT = new Set([
  'Tab', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Backspace', 'Slash', 'Quote',
  'AltLeft', 'AltRight', 'ControlLeft', 'ControlRight', 'KeyF', 'Minus', 'Equal',
]);

export class Input {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {Record<string,string[]>} [bindings]
   */
  constructor(canvas, bindings = DEFAULT_BINDINGS) {
    this.canvas = canvas;
    this.bindings = bindings;
    this.down = new Set();
    this.pressed = new Set();
    this.mouseDX = 0;
    this.mouseDY = 0;
    this.pointer = null; // {x, y} client coords of the mouse in menus
    this.clicks = []; // queued client-coordinate clicks for menus
    this.typed = ''; // recent letters, for cheat codes
    this.anyPressed = false;
    this.lastDevice = 'keyboard';
    /** Analog axes from sticks: -1..1 */
    this.analog = { move: 0, strafe: 0, turn: 0 };
    this.virtual = new Set(); // held virtual codes (gamepad)
    this.pointerLocked = false;
    this.onPointerLockChange = null;
    this._attach();
  }

  _attach() {
    const c = this.canvas;
    window.addEventListener('keydown', (e) => {
      if (e.code === 'F5' || e.code === 'F12' || e.code === 'F11' || (e.metaKey && e.code !== 'MetaLeft')) return;
      if (PREVENT.has(e.code) || e.code.startsWith('Arrow')) e.preventDefault();
      this.lastDevice = 'keyboard';
      if (!e.repeat) {
        this.down.add(e.code);
        this.pressed.add(e.code);
        this.anyPressed = true;
      }
      if (e.key && e.key.length === 1 && /[a-z0-9]/i.test(e.key)) {
        this.typed = (this.typed + e.key.toLowerCase()).slice(-16);
      }
    });
    window.addEventListener('keyup', (e) => {
      this.down.delete(e.code);
    });
    window.addEventListener('blur', () => {
      this.down.clear();
      this.virtual.clear();
    });

    c.addEventListener('mousedown', (e) => {
      const code = `Mouse${e.button}`;
      this.lastDevice = 'mouse';
      this.down.add(code);
      this.pressed.add(code);
      this.anyPressed = true;
      if (!this.pointerLocked) this.clicks.push({ x: e.clientX, y: e.clientY });
      c.focus();
    });
    window.addEventListener('mouseup', (e) => {
      this.down.delete(`Mouse${e.button}`);
    });
    c.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('mousemove', (e) => {
      if (this.pointerLocked) {
        // Ignore absurd spikes some browsers emit when the lock engages.
        if (Math.abs(e.movementX) < 400) this.mouseDX += e.movementX;
        if (Math.abs(e.movementY) < 400) this.mouseDY += e.movementY;
      } else {
        this.pointer = { x: e.clientX, y: e.clientY, moved: true };
      }
    });
    c.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        const code = e.deltaY < 0 ? 'WheelUp' : 'WheelDown';
        this.pressed.add(code);
      },
      { passive: false },
    );
    document.addEventListener('pointerlockchange', () => {
      this.pointerLocked = document.pointerLockElement === c;
      this.down.delete('Mouse0');
      this.onPointerLockChange?.(this.pointerLocked);
    });
  }

  /** Ask the browser to capture the mouse (must be called from a user gesture). */
  lockPointer() {
    if (this.pointerLocked || !this.canvas.requestPointerLock) return;
    try {
      const p = this.canvas.requestPointerLock({ unadjustedMovement: true });
      if (p && typeof p.catch === 'function') {
        p.catch(() => {
          try {
            this.canvas.requestPointerLock();
          } catch {
            /* ignore */
          }
        });
      }
    } catch {
      /* ignore */
    }
  }

  unlockPointer() {
    if (document.pointerLockElement) document.exitPointerLock?.();
  }

  _codes(action) {
    return this.bindings[action] ?? [];
  }

  /** Is any key bound to `action` currently held? */
  isDown(action) {
    for (const code of this._codes(action)) {
      if (this.down.has(code) || this.virtual.has(code)) return true;
    }
    return false;
  }

  /** Was a key bound to `action` pressed since the last tick? */
  wasPressed(action) {
    for (const code of this._codes(action)) if (this.pressed.has(code)) return true;
    return false;
  }

  /** Hold or release a virtual code. */
  setVirtual(code, held) {
    if (held) {
      if (!this.virtual.has(code)) {
        this.virtual.add(code);
        this.pressed.add(code);
        this.anyPressed = true;
      }
    } else {
      this.virtual.delete(code);
    }
  }

  consumeMouse() {
    const dx = this.mouseDX;
    const dy = this.mouseDY;
    this.mouseDX = 0;
    this.mouseDY = 0;
    return { dx, dy };
  }

  /** Check whether the typed buffer ends with a code; clears it on match. */
  typedCode(code) {
    if (this.typed.endsWith(code)) {
      this.typed = '';
      return true;
    }
    return false;
  }

  /** Clear one-tick edge state. Called after every simulation tick. */
  endTick() {
    this.pressed.clear();
    this.anyPressed = false;
    this.clicks.length = 0;
  }
}
