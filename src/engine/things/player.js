import { EYE_HEIGHT, TICK } from '../config.js';
import { WeaponState, weaponThink, bestWeapon } from './weapons.js';
import { COLORMAP_INVERSE } from '../gfx/palette.js';

/** Doom's ground friction, converted from 35 Hz tics to our 60 Hz ticks. */
const FRICTION = Math.pow(0.90625, 35 / 60);

/**
 * Vertical movement defaults (world units: 1 = a tile = 64 texels). The hero
 * content can override any of them.
 */
export const BODY = {
  height: 0.85, // standing body height
  eyeHeight: EYE_HEIGHT,
  crouchHeight: 0.5,
  crouchEyeHeight: 0.3,
  crouchSpeed: 0.5, // speed multiplier while crouching
  stepHeight: 0.4, // highest step you walk up
  airStep: 0.15, // highest ledge edge you can scramble onto mid-jump
  jumpSpeed: 4.2, // units per second upwards
  gravity: 14, // units per second squared
  fallDamageSpeed: 9, // landing faster than this hurts...
  fallDamagePerSpeed: 8, // ...this much per unit/s over it
};

/** Furthest the view can tilt up or down, in pixels of horizon shift. */
export const MAX_PITCH = 70;
const LOOK_KEY_SPEED = 120; // pixels per second

/** Everything about the player that isn't position: inventory, health, powers, HUD state. */
export class PlayerState {
  /**
   * @param {import('../registry.js').Registry} registry
   * @param {*} [snapshot] carried-over inventory from the previous level
   */
  constructor(registry, snapshot) {
    const hero = registry.hero ?? {};
    this.registry = registry;
    this.hero = hero;
    this.health = hero.health ?? 100;
    this.armor = 0;
    this.armorClass = 0;
    this.weapons = new Set(hero.startWeapons ?? []);
    this.ammo = {};
    this.maxAmmo = {};
    for (const a of registry.ammo.values()) {
      this.ammo[a.id] = 0;
      this.maxAmmo[a.id] = a.max;
    }
    Object.assign(this.ammo, hero.startAmmo ?? {});
    this.backpack = false;
    this.weapon = hero.startWeapon ?? [...this.weapons][0] ?? null;
    this.pendingWeapon = null;
    this.keys = new Set();
    this.powers = { invulnerable: 0, nightvision: 0, hazard: 0, berserk: 0 };
    this.god = false;
    this.noclip = false;
    this.notarget = false;
    this.hasMap = false;
    this.damageCount = 0;
    this.bonusCount = 0;
    this.grinTime = -10;
    this.hurtTime = -10;
    this.lastDamage = 0;
    this.attackerAngle = null;
    this.fireHeld = 0;
    this.dead = false;
    this.deathTime = 0;
    this.body = { ...BODY, ...(hero.body ?? {}) };
    this.viewHeight = this.body.eyeHeight;
    /** Temporary eye offset that eases back to 0 (stepping up stairs, landing). */
    this.viewOffset = 0;
    this.crouching = false;
    this.onGround = true;
    this.bobPhase = 0;
    this.bobAmount = 0;
    this.weaponState = new WeaponState();
    if (snapshot) this.restore(snapshot);
  }

  /** Inventory carried between levels (keys and powerups are per level, as in Doom). */
  snapshot() {
    return {
      health: this.health,
      armor: this.armor,
      armorClass: this.armorClass,
      weapons: [...this.weapons],
      ammo: { ...this.ammo },
      backpack: this.backpack,
      weapon: this.weapon,
    };
  }

  restore(s) {
    this.health = s.health ?? this.health;
    this.armor = s.armor ?? 0;
    this.armorClass = s.armorClass ?? 0;
    if (Array.isArray(s.weapons)) {
      this.weapons = new Set(s.weapons.filter((w) => this.registry.weapons.has(w)));
    }
    for (const [k, v] of Object.entries(s.ammo ?? {})) if (k in this.ammo) this.ammo[k] = v;
    if (s.backpack) {
      this.backpack = true;
      for (const a of this.registry.ammo.values()) this.maxAmmo[a.id] = a.backpackMax;
    }
    if (s.weapon && this.weapons.has(s.weapon)) this.weapon = s.weapon;
    if (!this.weapons.has(this.weapon)) this.weapon = bestWeapon(this.registry, this) ?? [...this.weapons][0];
  }

  /** True when a powerup should be drawn (blinks during its last few seconds). */
  powerVisible(name, time) {
    const left = this.powers[name] ?? 0;
    if (left <= 0) return false;
    return left > 4 || Math.floor(time * 8) % 2 === 0;
  }
}

/**
 * Per-tick player control: turning, Doom-style momentum movement, using,
 * weapons, powerup timers and view bob.
 */
export function playerThink(world, pt, input, dt, settings = {}) {
  const p = pt.player;
  const hero = p.hero;

  for (const k of Object.keys(p.powers)) {
    if (Number.isFinite(p.powers[k]) && p.powers[k] > 0) p.powers[k] = Math.max(0, p.powers[k] - dt);
  }
  p.damageCount = Math.max(0, p.damageCount - dt * 30);
  p.bonusCount = Math.max(0, p.bonusCount - dt * 30);

  if (p.dead) {
    p.viewHeight = Math.max(0.1, p.viewHeight - dt * 0.9);
    pt.vx *= 0.9;
    pt.vy *= 0.9;
    verticalMove(world, pt, dt);
    weaponThink(world, pt, input, dt);
    if (world.time - p.deathTime > 1.2 && (input.wasPressed('use') || input.wasPressed('fire'))) world.requestRestart();
    return;
  }

  // Looking up and down with keys (the mouse is handled per frame by the scene).
  const look = (input.isDown('lookUp') ? 1 : 0) - (input.isDown('lookDown') ? 1 : 0);
  if (look) pt.pitch = clampPitch((pt.pitch ?? 0) + look * LOOK_KEY_SPEED * dt);
  if (input.wasPressed('lookCenter')) pt.pitch = 0;

  // Crouching: stand back up only where there's headroom.
  const body = p.body;
  const wantCrouch = input.isDown('crouch');
  if (wantCrouch) p.crouching = true;
  else if (p.crouching && world.ceilAt(pt.x, pt.y, pt.radius) - pt.z >= body.height) p.crouching = false;
  pt.height = p.crouching ? body.crouchHeight : body.height;
  const eye = p.crouching ? body.crouchEyeHeight : body.eyeHeight;
  if (p.viewHeight < eye) p.viewHeight = Math.min(eye, p.viewHeight + dt * 2.5);
  else if (p.viewHeight > eye) p.viewHeight = Math.max(eye, p.viewHeight - dt * 2.5);

  if (input.wasPressed('jump') && p.onGround && !p.crouching) {
    pt.vz = body.jumpSpeed;
    p.onGround = false;
    world.playSound(hero.sounds?.jump);
  }

  const run = !!settings.alwaysRun !== input.isDown('run');
  const turn = (input.isDown('turnRight') ? 1 : 0) - (input.isDown('turnLeft') ? 1 : 0);
  pt.angle += turn * (run ? 3.4 : 2.4) * dt;

  let fwd = (input.isDown('forward') ? 1 : 0) - (input.isDown('back') ? 1 : 0) + (input.analog?.move ?? 0);
  let side = (input.isDown('strafeRight') ? 1 : 0) - (input.isDown('strafeLeft') ? 1 : 0) + (input.analog?.strafe ?? 0);
  fwd = Math.max(-1, Math.min(1, fwd));
  side = Math.max(-1, Math.min(1, side));
  const len = Math.hypot(fwd, side);
  if (len > 1) {
    fwd /= len;
    side /= len;
  }
  const speed = (run ? (hero.runSpeed ?? 8) : (hero.walkSpeed ?? 4.8)) * (p.crouching ? body.crouchSpeed : 1);
  const ca = Math.cos(pt.angle);
  const sa = Math.sin(pt.angle);
  const wishX = ca * fwd - sa * side;
  const wishY = sa * fwd + ca * side;
  const ticks = dt / TICK;
  const accel = (speed * (1 - FRICTION)) / FRICTION;
  pt.vx += wishX * accel * ticks;
  pt.vy += wishY * accel * ticks;

  if (p.noclip) {
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
  } else {
    world.tryMove(pt, pt.vx * dt, pt.vy * dt);
  }
  verticalMove(world, pt, dt);
  const f = Math.pow(FRICTION, ticks);
  pt.vx *= f;
  pt.vy *= f;
  if (Math.abs(pt.vx) < 0.005) pt.vx = 0;
  if (Math.abs(pt.vy) < 0.005) pt.vy = 0;

  const moving = Math.hypot(pt.vx, pt.vy);
  const target = Math.min(1, moving / (hero.runSpeed ?? 8));
  p.bobAmount += (target - p.bobAmount) * Math.min(1, dt * 10);
  p.bobPhase += dt * (6 + 6 * target);

  if (input.wasPressed('use')) world.use(pt);
  weaponThink(world, pt, input, dt);
}

export function clampPitch(v) {
  return Math.max(-MAX_PITCH, Math.min(MAX_PITCH, v));
}

/**
 * Gravity, stepping up onto higher floors (with the view easing up after it),
 * landing (and fall damage), and bumping your head on the ceiling.
 */
function verticalMove(world, pt, dt) {
  const p = pt.player;
  const body = p.body;
  const floor = p.noclip ? world.floorAt(pt.x, pt.y, 0) : world.floorAt(pt.x, pt.y, pt.radius);
  const ceil = world.ceilAt(pt.x, pt.y, pt.radius);
  if (pt.z < floor) {
    // Walked up a step (or a floor rose under us): ease the eye up after it.
    p.viewOffset -= floor - pt.z;
    pt.z = floor;
    if (pt.vz < 0) pt.vz = 0;
  }
  if (pt.z > floor || pt.vz > 0) {
    pt.vz -= body.gravity * dt;
    pt.z += pt.vz * dt;
    if (pt.z + pt.height > ceil && pt.vz > 0) {
      pt.z = Math.max(floor, ceil - pt.height);
      pt.vz = 0;
    }
    if (pt.z <= floor) {
      const impact = -pt.vz;
      pt.z = floor;
      pt.vz = 0;
      if (!p.dead && impact > 3) {
        p.viewOffset -= Math.min(0.2, impact * 0.02);
        if (impact > 6) world.playSound(p.hero.sounds?.land ?? 'oof');
        if (impact > body.fallDamageSpeed && !p.noclip) {
          const amount = Math.round((impact - body.fallDamageSpeed) * body.fallDamagePerSpeed);
          world.damage(pt, amount, null, null, { environment: true, noThrust: true });
        }
      }
    }
  }
  p.onGround = pt.z <= floor + 1e-4;
  // The eye offset eases back: fast at first, like Doom's view height recovery.
  if (p.viewOffset < 0) p.viewOffset = Math.min(0, p.viewOffset + Math.max(0.6, -p.viewOffset * 10) * dt);
}

/** Camera for the renderer: eye position, bob, muzzle-flash light, powerup colormaps. */
export function playerCamera(world, pt) {
  const p = pt.player;
  const bob = p.dead ? 0 : Math.sin(p.bobPhase * 2) * 0.018 * p.bobAmount;
  let fixedColormap = -1;
  if (p.powerVisible('invulnerable', world.time)) fixedColormap = COLORMAP_INVERSE;
  else if (p.powerVisible('nightvision', world.time)) fixedColormap = 0;
  return {
    x: pt.x,
    y: pt.y,
    angle: pt.angle,
    z: pt.z + Math.max(0.05, p.viewHeight + p.viewOffset + bob),
    horizonOffset: pt.pitch ?? 0,
    extraLight: p.weaponState.flash ?? 0,
    fixedColormap,
  };
}
