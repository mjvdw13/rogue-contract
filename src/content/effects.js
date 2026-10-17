import { defineEffect, defineProjectile } from '../engine/defs.js';

const FX = (name, w, h) => ({ src: `assets/sprites/fx/${name}.png`, frameWidth: w, frameHeight: h });

export const effects = [
  defineEffect({ id: 'puff', sheet: FX('puff', 16, 16), anims: { idle: { frames: [0, 1, 2, 3], fps: 14, fullbright: [0] } }, rise: 0.3 }),
  defineEffect({ id: 'blood', sheet: FX('blood', 16, 16), anims: { idle: { frames: [0, 1, 2], fps: 10 } }, rise: -0.4 }),
  defineEffect({ id: 'explosion', sheet: FX('explosion', 64, 64), anims: { idle: { frames: [0, 1, 2, 3, 4], fps: 12 } }, fullbright: true, light: { radius: 6, light: 128 } }),
];

// Blaster bolts are projectiles: fast enough to feel like a gun, slow enough
// to see (and, from troopers, to dodge). They light the walls they pass.
const BOLT = {
  sheet: FX('blaster-bolt', 32, 32),
  anims: { fly: { frames: [0, 1], fps: 12, loop: true }, explode: { frames: [2, 3, 4], fps: 16 } },
  radius: 0.16,
  light: { radius: 3, light: 64 },
  sounds: { explode: 'bolt-hit' },
};

export const projectiles = [
  defineProjectile({ id: 'blaster-bolt', ...BOLT, speed: 60, damage: [10, 20] }),
  defineProjectile({ id: 'trooper-bolt', ...BOLT, speed: 28, damage: [5, 12] }),
  // A Jawa's ion blaster: a slow, weak, crackling cloud of blue electricity.
  defineProjectile({
    id: 'ion-bolt',
    sheet: FX('ion-blast', 32, 32),
    anims: { fly: { frames: [0, 1, 2, 3], fps: 20, loop: true }, explode: { frames: [4, 5, 6], fps: 16 } },
    radius: 0.2,
    light: { radius: 2.5, light: 48 },
    speed: 22,
    damage: [3, 8],
    sounds: { explode: 'ion-hit' },
  }),
  // Boba Fett's rocket: a fast fireball that bursts with a small splash.
  defineProjectile({
    id: 'rocket',
    sheet: FX('rocket', 32, 32),
    anims: { fly: { frames: [0, 1, 2], fps: 12, loop: true }, explode: { frames: [3, 4, 5], fps: 12 } },
    radius: 0.2,
    light: { radius: 4, light: 96 },
    speed: 24,
    damage: [8, 16],
    splash: { radius: 2, damage: 24 },
    sounds: { explode: 'rocket-hit' },
  }),
  // A thermal detonator, thrown: a dark ball that bounces and clanks round,
  // then goes off as a `large` explosion (or at once on a body). It's lit by
  // the room, so it can be lost in the dark.
  defineProjectile({
    id: 'detonator-thrown',
    sheet: FX('thermal-detonator', 16, 16),
    anims: { fly: [0] },
    fullbright: false,
    radius: 0.2,
    speed: 18, // a full throw (a weapon's `charge` scales it down for a short toss)
    gravity: 28,
    damage: [20, 30],
    splash: { radius: 4, damage: 140 },
    // A tap (power 0.2) is the old low toss: 3.6 out, 6 up. A full throw is
    // lobbed high: 18 out, 13 up, peaking about three tiles above the hand.
    bounce: { restitution: 0.55, friction: 0.75, minSpeed: 1.5, roll: 3, fuse: 2.5, toss: 4.25, loft: 8.75 },
    explosion: 'large',
    sounds: { bounce: 'detonator-bounce', explode: 'detonator-explode' },
  }),
  // The concussion rifle's shot (yours and Bossk's), as in Dark Forces: unseen
  // and fast, no damage itself. Where it lands, everything within the splash
  // takes the full damage and erupts in a `concussion` blast at its feet; off
  // a wall or floor, one more goes up there. Being unseen, it bursts on
  // crates and villagers too rather than vanish through them.
  defineProjectile({
    id: 'concussion-shot',
    hitsSolid: true,
    radius: 0.1,
    speed: 55,
    life: 5,
    damage: 0,
    splash: { radius: 3.3, damage: 60, falloff: false, erupt: 'concussion' },
    sounds: { fire: 'concussion-fire', explode: 'concussion-hit' },
  }),
];
