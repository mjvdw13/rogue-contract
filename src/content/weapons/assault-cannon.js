import { defineWeapon } from '../../engine/defs.js';

// Slot 10 (key 0): the assault cannon, as in Dark Forces. Big blue plasma
// balls, slow but hard (DF's 30 damage, three bolts' worth), five a second,
// one plasma each. 1 the shot, its edge lit blue, then 0 (DF's 14 ticks and
// 14 more held). DF drew it huge at the right (x 206), past the top and the
// right edge of the view.
export default defineWeapon({
  id: 'assault-cannon',
  name: 'ASSAULT CANNON',
  slot: 10,
  ammo: 'plasma',
  priority: 7,
  light: { radius: 5, light: 96 }, // the plasma's flash
  sheet: { src: 'assets/sprites/weapons/assault-cannon.png', frameWidth: 170, frameHeight: 325 },
  offset: [131, 12],
  anims: {
    idle: [0],
    fire: { frames: [1, 0], durations: [0.1, 0.1], fireAt: 0, fullbright: [0] },
  },
  fire: { kind: 'projectile', projectile: 'cannon-plasma', spread: 0.017 }, // DF's ±1°
  sounds: { fire: 'cannon-fire' },
});
