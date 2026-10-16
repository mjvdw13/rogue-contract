import { defineExplosion } from '../engine/defs.js';

// Explosions (PLAN.md Phase 1b T step 5f): styles made of particles, set off
// by id: things' `death.explosion`, projectiles' `explosion`, the `explode`
// trigger action, or `world.explode(id, x, y, z)` from code. Only for looks:
// damage is the exploder's own (`explode`, `splash`). Bursts without a `dir`
// face out of whatever the explosion hit (all round in mid-air); `'up'` rises.
// Mind the caps: 150 discs (fire and smoke) and 1000 points in all.

export default [
  // A rocket's burst: a small fireball, sparks, a few smoking chunks, embers
  // and a puff of dark smoke once the fire's gone.
  defineExplosion({
    id: 'small',
    light: { radius: 5, light: 112, time: 0.45 },
    particles: [
      { type: 'fire', count: 10, speed: [0.5, 2.5], radius: 0.15 },
      { type: 'spark', count: 24, speed: [3, 7] },
      { type: 'debris', count: 5, speed: [3, 6] },
      { type: 'ember', count: 10, speed: [0.5, 1.5], dir: 'up', spread: 0.8, delay: 0.1, over: 0.4 },
      { type: 'blast-smoke', count: 6, speed: [0.2, 0.6], radius: 0.25, dir: 'up', spread: 1, delay: [0.15, 0.25], over: 0.4 },
    ],
  }),
  // A fuel barrel or a probe droid going up: everything bigger, with
  // shrapnel, and smoke that keeps coming for a while.
  defineExplosion({
    id: 'large',
    light: { radius: 7, light: 128, time: 0.6 },
    particles: [
      { type: 'fire', count: 22, speed: [0.8, 4], radius: 0.3 },
      { type: 'spark', count: 40, speed: [3, 9] },
      { type: 'debris', count: 8, speed: [3, 8] },
      { type: 'shrapnel', count: 16, speed: [2, 6] },
      { type: 'ember', count: 20, speed: [0.5, 2], dir: 'up', spread: 0.9, delay: 0.15, over: 0.8 },
      { type: 'blast-smoke', count: 12, speed: [0.2, 0.8], radius: 0.4, dir: 'up', spread: 1, delay: [0.2, 0.35], over: 0.8 },
    ],
  }),
  // Bossk's concussion blast: a blue-white flash and a crackle of ion
  // sparks; no fire, so no smoke.
  defineExplosion({
    id: 'concussion',
    light: { radius: 6, light: 100, time: 0.35 },
    particles: [
      { type: 'fire-blue', count: 14, speed: [1, 3.5], radius: 0.15 },
      { type: 'ion-spark', count: 36, speed: [4, 9] },
      { type: 'spark', count: 12, speed: [2, 5] },
    ],
  }),
  // A droid or a panel shorting out: sparks, a crackle and a wisp of smoke.
  defineExplosion({
    id: 'sparks',
    light: { radius: 3, light: 64, time: 0.2 },
    particles: [
      { type: 'spark', count: 30, speed: [2, 6] },
      { type: 'ion-spark', count: 16, speed: [3, 7] },
      { type: 'smoke-wisp', count: 6, speed: [0.2, 0.5], radius: 0.1, dir: 'up', spread: 1, delay: 0.1, over: 0.5 },
    ],
  }),
  // A blast on sand or rock: a little fire, a spray of grit and a cloud of dust.
  defineExplosion({
    id: 'dirt',
    light: { radius: 5, light: 96, time: 0.35 },
    particles: [
      { type: 'fire', count: 6, speed: [0.5, 2], radius: 0.1 },
      { type: 'rock-chip', count: 30, speed: [2, 6] },
      { type: 'dust-puff', count: 14, speed: [0.6, 2], radius: 0.3, dir: 'up', spread: 1, over: 0.2 },
      { type: 'blast-smoke', count: 3, speed: [0.2, 0.5], radius: 0.2, dir: 'up', spread: 1, delay: 0.15, over: 0.3 },
      { type: 'debris', count: 3, speed: [3, 6] },
    ],
  }),
];
