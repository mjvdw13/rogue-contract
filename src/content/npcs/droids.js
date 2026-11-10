import { defineNpc } from '../../engine/defs.js';

// The battle station's droids that mean no harm.
//
// The mouse droid (MSE-6): a small black box on wheels that scurries about
// the corridors on errands. Bumped or used, it chatters and squeals. Shot, it
// squeals and bolts, as the one in the film does; killed, it throws sparks
// and lies on its back. The sheet is generated (tools/art/sprites/station.js):
// the drive cycle from five sides, four frames each (front 0-3, front
// three-quarter 4-7, side 8-11, back three-quarter 12-15, back 16-19; the
// lamp is lit on the even frames), then a hop (20), a knock (21) and the
// wreck (22-25).
const drive = (from) => [from, from + 1, from + 2, from + 3];
const driveViews = { frontSide: drive(4), side: drive(8), backSide: drive(12), back: drive(16) };
// Standing: the lamp blinks, the wheels are still.
const stand = (from) => [from, from + 1];
const standViews = { frontSide: stand(4), side: stand(8), backSide: stand(12), back: stand(16) };

export const mouseDroid = defineNpc({
  id: 'mouse-droid',
  name: 'MOUSE DROID',
  glyph: 'M',
  sheet: { src: 'assets/sprites/npcs/mouse-droid.png', frameWidth: 40, frameHeight: 24 },
  radius: 0.4,
  height: 0.5,
  // Quick dashes a long way down the corridor, and hardly a pause between.
  speed: 5,
  wander: 10,
  idleTime: [0.4, 1.6],
  reactTime: 0.8,
  reactCooldown: 1.5,
  health: 10,
  fleeSpeed: 9,
  fleeDistance: 24,
  mass: 30,
  bleeds: false, // a puff where it's hit, not blood
  anims: {
    idle: { frames: stand(0), durations: [1.2, 0.3], loop: true, views: standViews },
    walk: { frames: drive(0), fps: 14, views: driveViews },
    flee: { frames: drive(0), fps: 24, views: driveViews },
    react: { frames: [20, 0, 20, 0], durations: [0.1, 0.1, 0.1, 0.5] },
    pain: { frames: [21], durations: [0.25] },
    death: { frames: [22, 23, 24, 25], fps: 10 },
  },
  lines: ['BEEP-BEEP!', 'WHIRRR...', '*SQUEAL*', 'BIP. BIP-BIP.', '*CHITTER*'],
  sounds: { react: 'mouse-droid-squeal', pain: 'mouse-droid-squeal', death: 'droid-pain' },
  death: { particles: [{ type: 'spark', count: 12, speed: [2, 5] }] },
});

export default [mouseDroid];
