import { Animated } from './anim.js';

let nextId = 1;

/**
 * Every object in the world — monsters, items, decorations, projectiles,
 * effects and the player — is a Thing driven by its definition (`def`).
 * Behaviour lives in the think functions (monster.js, projectile.js...).
 */
export class Thing extends Animated {
  constructor(def, x, y, angle = 0) {
    super();
    this.id = nextId++;
    this.def = def;
    this.kind = def.kind;
    this.x = x;
    this.y = y;
    this.z = def.z ?? 0;
    this.angle = angle;
    this.radius = def.radius ?? 0.25;
    this.height = def.height ?? 0.8;
    this.health = def.health ?? 0;
    this.solid = !!def.solid;
    this.shootable = !!def.shootable;
    this.vx = 0;
    this.vy = 0;
    this.vz = 0;
    /** Seconds left of giving way to the player's push, and how fast (push.js). */
    this.shoved = 0;
    this.shoveSpeed = 0;
    this.removed = false;
    this.hidden = false;
    this.dead = false;
    /** @type {import('../gfx/sheet.js').Sheet|null} */
    this.sheet = null;
    this.fullbright = !!def.fullbright;
    this.flipX = false;
    this.state = 'idle';
    this.target = null;
    this.timer = 0;
    this.cooldown = 0;
    this.reaction = 0;
    this.ambush = false;
    this.tag = null;
    /** Extra drops placed with this thing in the level, on top of its type's. */
    this.drops = null;
    this.owner = null;
    this.dropped = false;
    this.player = null;
  }

  distanceTo(other) {
    return Math.hypot(other.x - this.x, other.y - this.y);
  }

  angleTo(other) {
    return Math.atan2(other.y - this.y, other.x - this.x);
  }
}
