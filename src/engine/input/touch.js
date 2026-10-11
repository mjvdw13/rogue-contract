/**
 * On-screen controls for phones and tablets: a floating move stick on the
 * left, drag-to-look on the right, and fire/use/jump/duck/weapon/map/menu buttons.
 * Everything feeds the shared Input object, so game code is unaware of touch.
 */
export class TouchControls {
  /**
   * @param {HTMLElement} stage
   * @param {import('./input.js').Input} input
   */
  constructor(stage, input) {
    this.input = input;
    this.visible = false;
    this.lookSpeed = 2.2;
    this.root = document.createElement('div');
    this.root.id = 'touch';
    this.root.hidden = true;
    this.root.innerHTML = `
      <div class="zone move"></div>
      <div class="zone look"></div>
      <div class="stick" hidden><div class="knob"></div></div>
      <div class="btn fire">FIRE</div>
      <div class="btn use">USE</div>
      <div class="btn jump">JUMP</div>
      <div class="btn crouch">DUCK</div>
      <div class="btn weapon">WPN</div>
      <div class="btn map">MAP</div>
      <div class="btn menu">MENU</div>`;
    stage.appendChild(this.root);
    const hint = document.createElement('div');
    hint.id = 'rotate-hint';
    hint.textContent = 'TURN YOUR PHONE SIDEWAYS';
    stage.appendChild(hint);

    this._stick(this.root.querySelector('.zone.move'), this.root.querySelector('.stick'));
    this._look(this.root.querySelector('.zone.look'));
    this._hold(this.root.querySelector('.btn.fire'), 'TouchFire');
    this._tap(this.root.querySelector('.btn.use'), 'TouchUse');
    this._tap(this.root.querySelector('.btn.jump'), 'TouchJump');
    this._hold(this.root.querySelector('.btn.crouch'), 'TouchCrouch');
    this._tap(this.root.querySelector('.btn.weapon'), 'TouchWeapon');
    this._tap(this.root.querySelector('.btn.map'), 'TouchMap');
    this._tap(this.root.querySelector('.btn.menu'), 'TouchMenu');
  }

  setVisible(v) {
    if (v === this.visible) return;
    this.visible = v;
    this.root.hidden = !v;
    if (!v) {
      this.input.analog.move = 0;
      this.input.analog.strafe = 0;
      this.input.setVirtual('TouchFire', false);
      this.input.setVirtual('TouchCrouch', false);
    }
  }

  _stick(zone, stick) {
    const knob = stick.querySelector('.knob');
    const R = 48;
    let id = null;
    let ox = 0;
    let oy = 0;
    zone.addEventListener('pointerdown', (e) => {
      if (id !== null) return;
      id = e.pointerId;
      zone.setPointerCapture(id);
      ox = e.clientX;
      oy = e.clientY;
      stick.style.left = `${ox}px`;
      stick.style.top = `${oy}px`;
      knob.style.transform = '';
      stick.hidden = false;
      e.preventDefault();
    });
    zone.addEventListener('pointermove', (e) => {
      if (e.pointerId !== id) return;
      let dx = e.clientX - ox;
      let dy = e.clientY - oy;
      const len = Math.hypot(dx, dy);
      if (len > R) {
        dx = (dx / len) * R;
        dy = (dy / len) * R;
      }
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
      const dead = 0.12;
      const sx = dx / R;
      const sy = -dy / R;
      this.input.analog.strafe = Math.abs(sx) < dead ? 0 : sx;
      this.input.analog.move = Math.abs(sy) < dead ? 0 : sy;
    });
    const end = (e) => {
      if (e.pointerId !== id) return;
      id = null;
      stick.hidden = true;
      this.input.analog.move = 0;
      this.input.analog.strafe = 0;
    };
    zone.addEventListener('pointerup', end);
    zone.addEventListener('pointercancel', end);
  }

  _look(zone) {
    let id = null;
    let lx = 0;
    let ly = 0;
    zone.addEventListener('pointerdown', (e) => {
      if (id !== null) return;
      id = e.pointerId;
      zone.setPointerCapture(id);
      lx = e.clientX;
      ly = e.clientY;
      e.preventDefault();
    });
    zone.addEventListener('pointermove', (e) => {
      if (e.pointerId !== id) return;
      this.input.mouseDX += (e.clientX - lx) * this.lookSpeed;
      this.input.mouseDY += (e.clientY - ly) * this.lookSpeed;
      lx = e.clientX;
      ly = e.clientY;
    });
    const end = (e) => {
      if (e.pointerId === id) id = null;
    };
    zone.addEventListener('pointerup', end);
    zone.addEventListener('pointercancel', end);
  }

  _hold(btn, code) {
    btn.addEventListener('pointerdown', (e) => {
      btn.setPointerCapture(e.pointerId);
      btn.classList.add('active');
      this.input.setVirtual(code, true);
      e.preventDefault();
    });
    const up = () => {
      btn.classList.remove('active');
      this.input.setVirtual(code, false);
    };
    btn.addEventListener('pointerup', up);
    btn.addEventListener('pointercancel', up);
  }

  _tap(btn, code) {
    btn.addEventListener('pointerdown', (e) => {
      btn.classList.add('active');
      this.input.tap(code);
      e.preventDefault();
    });
    const up = () => btn.classList.remove('active');
    btn.addEventListener('pointerup', up);
    btn.addEventListener('pointercancel', up);
  }
}

/** Best guess at whether this device is primarily touch-driven. */
export function isTouchDevice() {
  return (
    (typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches) ||
    (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0 && !matchMedia?.('(pointer: fine)').matches)
  );
}
