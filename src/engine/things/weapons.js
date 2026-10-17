import { Animated } from './anim.js';
import { performAttack } from '../combat/attacks.js';

const BOTTOM = 110; // pixels below the ready position when lowered
const RAISE_SPEED = 420; // pixels per second
const LOWER_SPEED = 480;

/** The first-person weapon: raising, lowering, idling and firing. */
export class WeaponState extends Animated {
  constructor() {
    super();
    this.def = null;
    this.state = 'raise';
    this.y = BOTTOM;
    this.refire = 0;
    this.flash = 0;
  }
}

export function hasAmmo(p, def) {
  if (!def || !def.ammo) return true;
  return (p.ammo[def.ammo] ?? 0) >= def.ammoPerShot;
}

/** The best owned weapon that has ammo (by `priority`), preferring non-melee. */
export function bestWeapon(registry, p, exclude = null) {
  let best = null;
  for (const id of p.weapons) {
    if (id === exclude) continue;
    const w = registry.weapons.get(id);
    if (!w || !hasAmmo(p, w)) continue;
    const score = (w.fire?.kind === 'melee' ? -1000 : 0) + (w.priority ?? 0) + (w.preferOnEmpty ?? 0);
    if (!best || score > best.score) best = { id, score };
  }
  return best?.id ?? null;
}

function ownedSorted(registry, p) {
  return [...p.weapons]
    .map((id) => registry.weapons.get(id))
    .filter(Boolean)
    .sort((a, b) => a.slot - b.slot || (a.order ?? 0) - (b.order ?? 0));
}

/** Number key: choose the weapon in a slot (cycling if several share it). */
export function selectSlot(registry, p, slot) {
  const inSlot = ownedSorted(registry, p).filter((w) => w.slot === slot);
  if (!inSlot.length) return;
  const current = p.pendingWeapon ?? p.weapon;
  const idx = inSlot.findIndex((w) => w.id === current);
  const next = inSlot[(idx + 1) % inSlot.length];
  if (next.id !== p.weapon || p.pendingWeapon) p.pendingWeapon = next.id === p.weapon ? null : next.id;
}

/** Mouse wheel / next-prev: step through owned weapons that have ammo. */
export function cycleWeapon(registry, p, dir) {
  const list = ownedSorted(registry, p).filter((w) => hasAmmo(p, w));
  if (list.length < 2) return;
  const current = p.pendingWeapon ?? p.weapon;
  const idx = list.findIndex((w) => w.id === current);
  const next = list[(idx + dir + list.length) % list.length];
  p.pendingWeapon = next.id === p.weapon ? null : next.id;
}

function fire(world, pt, def, ws) {
  const p = pt.player;
  if (def.ammo) {
    if ((p.ammo[def.ammo] ?? 0) < def.ammoPerShot) return;
    p.ammo[def.ammo] -= def.ammoPerShot;
  }
  const berserk = def.fire.kind === 'melee' && p.powers.berserk > 0;
  const mult = berserk ? (def.fire.berserkMultiplier ?? 10) : 1;
  performAttack(world, pt, def.fire, pt.angle, { accurate: def.accurateFirstShot && ws.refire === 0, damageMult: mult });
  if (def.sounds.fire) world.playSound(def.sounds.fire);
  if (def.noise) world.noiseAlert(pt);
}

/**
 * Per-tick weapon logic for the player.
 * @param {*} world
 * @param {*} pt player thing
 * @param {{isDown:(a:string)=>boolean, wasPressed:(a:string)=>boolean}} input
 */
export function weaponThink(world, pt, input, dt) {
  const p = pt.player;
  const reg = world.registry;
  const ws = p.weaponState;
  if (p.dead) {
    ws.y = Math.min(BOTTOM, ws.y + LOWER_SPEED * dt);
    return;
  }
  for (let s = 1; s <= 9; s++) if (input.wasPressed(`weapon${s}`)) selectSlot(reg, p, s);
  if (input.wasPressed('nextWeapon')) cycleWeapon(reg, p, 1);
  if (input.wasPressed('prevWeapon')) cycleWeapon(reg, p, -1);

  let def = reg.weapons.get(p.weapon);
  if (ws.def !== def) {
    ws.def = def;
    ws.setAnim('idle');
  }
  if (!def) return;
  if (ws.state === 'ready' && p.pendingWeapon && p.pendingWeapon !== p.weapon) ws.state = 'lower';

  switch (ws.state) {
    case 'lower':
      ws.y += LOWER_SPEED * dt;
      if (ws.y >= BOTTOM) {
        ws.y = BOTTOM;
        if (p.pendingWeapon) p.weapon = p.pendingWeapon;
        p.pendingWeapon = null;
        def = reg.weapons.get(p.weapon);
        ws.def = def;
        ws.setAnim('idle');
        ws.state = 'raise';
        if (def?.sounds.raise) world.playSound(def.sounds.raise);
      }
      break;
    case 'raise':
      ws.y -= RAISE_SPEED * dt;
      ws.stepAnim(dt);
      if (ws.y <= 0) {
        ws.y = 0;
        ws.state = 'ready';
      }
      break;
    case 'ready':
      ws.stepAnim(dt);
      if (input.isDown('fire')) {
        if (hasAmmo(p, def)) {
          ws.state = 'fire';
          ws.setAnim('fire');
        } else {
          const best = bestWeapon(reg, p, def.id);
          if (best && best !== p.weapon) p.pendingWeapon = best;
        }
      } else {
        ws.refire = 0;
      }
      break;
    case 'fire': {
      const done = ws.stepAnim(dt, (ev) => {
        if (ev === 'fire') fire(world, pt, def, ws);
        else if (ev.startsWith('sound:')) world.playSound(ev.slice(6));
      });
      if (done) {
        ws.refire++;
        if (def.reraise) {
          ws.state = 'reload';
        } else if (input.isDown('fire') && hasAmmo(p, def) && !p.pendingWeapon) {
          ws.setAnim('fire');
        } else {
          ws.state = 'ready';
          ws.setAnim('idle');
          if (!input.isDown('fire')) ws.refire = 0;
          if (!hasAmmo(p, def)) {
            const best = bestWeapon(reg, p, def.id);
            if (best && best !== p.weapon) p.pendingWeapon = best;
          }
        }
      }
      break;
    }
    case 'reload':
      // (`reraise`) The empty hand drops out of view; the next one comes up
      // (or, with none left, the best weapon that has ammo).
      ws.y += LOWER_SPEED * dt;
      if (ws.y >= BOTTOM) {
        if (!hasAmmo(p, def)) {
          const best = bestWeapon(reg, p, def.id);
          if (best && best !== p.weapon) p.pendingWeapon = best;
        }
        ws.state = 'lower';
      }
      break;
    default:
      ws.state = 'raise';
  }
  ws.flash = ws.state === 'fire' && ws.fullbright ? (def.flashLight ?? 0) : 0;
  p.fireHeld = input.isDown('fire') && ws.state === 'fire' ? (p.fireHeld ?? 0) + dt : 0;
}

/** Psprite list for the renderer (weapon sprite with bob). */
export function weaponSprites(world, pt) {
  const p = pt.player;
  const ws = p.weaponState;
  const def = ws.def;
  if (!def || !def.sheet) return [];
  const sheet = world.assets?.sheetFor(def);
  if (!sheet) return [];
  let bx = 0;
  let by = 0;
  if (ws.state !== 'fire') {
    const amt = p.bobAmount * (def.bob ?? 1);
    bx = Math.cos(p.bobPhase) * 7 * amt;
    by = Math.abs(Math.sin(p.bobPhase)) * 5 * amt;
  }
  return [
    {
      sheet,
      frame: ws.frame,
      x: (def.offset?.[0] ?? 0) + bx,
      y: (def.offset?.[1] ?? 0) + (world.registry?.config.weaponDrop ?? 0) + ws.y + by + 2,
      fullbright: ws.fullbright,
    },
  ];
}
