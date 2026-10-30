const SECTOR = Math.PI / 4;

/**
 * Which view a viewer sees of a thing facing `angle` (radians), standing
 * (dx, dy) from it: 0 front, 1 front three-quarter, 2 side, 3 back
 * three-quarter, 4 back, in eight 45° sectors. View art shows the thing's
 * left side, so the view comes back negative (to be mirrored) when the
 * viewer is on its right: clockwise of its facing, as the map's y runs down.
 */
export function viewOf(angle, dx, dy) {
  let rel = (Math.atan2(dy, dx) - angle) % (2 * Math.PI);
  if (rel > Math.PI) rel -= 2 * Math.PI;
  else if (rel <= -Math.PI) rel += 2 * Math.PI;
  const view = Math.min(4, Math.round(Math.abs(rel) / SECTOR));
  return rel > 0 && view > 0 && view < 4 ? -view : view;
}

/**
 * Shared animation playback for things and first-person weapons. Subclasses
 * must provide `this.def.anims` (normalized animations from defs.js).
 */
export class Animated {
  constructor() {
    this.anim = null;
    this.animName = null;
    this.animPos = 0;
    this.animTime = 0;
    this.animDone = false;
    this.pendingEvent = null;
    this.frame = 0;
    this.fullbright = false;
  }

  /** Switch animation. Returns false if the definition has no such animation. */
  setAnim(name, restart = true) {
    const anim = this.def?.anims?.[name];
    if (!anim) return false;
    if (!restart && this.animName === name && !this.animDone) return true;
    this.anim = anim;
    this.animName = name;
    this.animPos = 0;
    this.animTime = 0;
    this.animDone = false;
    this.frame = anim.frames[0];
    this.fullbright = !!this.def.fullbright || anim.fullbright[0];
    this.pendingEvent = anim.events[0];
    return true;
  }

  /**
   * Advance by dt seconds. Frame events (e.g. 'fire') are reported through
   * onEvent. Returns true on the tick a non-looping animation finishes.
   */
  stepAnim(dt, onEvent) {
    const a = this.anim;
    if (!a) return false;
    if (this.pendingEvent) {
      const ev = this.pendingEvent;
      this.pendingEvent = null;
      onEvent?.(ev);
      if (this.anim !== a) return false;
    }
    if (this.animDone) return false;
    this.animTime += dt;
    while (this.animTime >= a.durations[this.animPos]) {
      this.animTime -= a.durations[this.animPos];
      if (this.animPos + 1 >= a.frames.length) {
        if (a.loop) {
          this.animPos = 0;
        } else {
          this.animDone = true;
          return true;
        }
      } else {
        this.animPos++;
      }
      this.frame = a.frames[this.animPos];
      this.fullbright = !!this.def.fullbright || a.fullbright[this.animPos];
      const ev = a.events[this.animPos];
      if (ev) {
        onEvent?.(ev);
        if (this.anim !== a) return false;
      }
    }
    return false;
  }
}
