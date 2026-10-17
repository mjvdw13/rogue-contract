import { defineWeapon } from '../../engine/defs.js';

// Slot 4: thermal detonators, thrown by hand. One clanks round, bouncing off
// walls and floors, and goes off a couple of seconds later (or at once on a
// body). The fist holding one (0); the open hand after the throw (1), which
// drops away as the next one comes up. Thrown when fire is let go: a tap
// tosses it a few tiles, held a second it goes a long way.
export default defineWeapon({
  id: 'thermal-detonator',
  name: 'THERMAL DETONATOR',
  slot: 4,
  ammo: 'detonator',
  priority: 1, // never picked over the blaster when one runs dry
  sheet: { src: 'assets/sprites/weapons/thermal-detonator.png', frameWidth: 124, frameHeight: 134 },
  offset: [40, 28], // low, as the blaster, so the fist doesn't hide the view
  anims: {
    idle: [0],
    fire: { frames: [0, 1], durations: [0.04, 0.22], fireAt: 1 },
  },
  fire: { kind: 'projectile', projectile: 'detonator-thrown', spread: 0.02 },
  reraise: true,
  charge: { time: 1, min: 0.2, sink: 36, pull: 0.18 }, // the fist pulls back hard as fire goes down
  sounds: { fire: 'detonator-throw' },
});
