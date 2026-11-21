import { defineNpc } from '../../engine/defs.js';

// Imperials who aren't there to fight. Mission 3's general (Mohc, though
// Kyle never learns his name), seen through the office's barred window as
// he leaves. An officer's sprite for now (Mark, 2026-11-20) until he has his
// own; a friendly character, so he can't be shot.
export default [
  defineNpc({
    id: 'general',
    name: 'GENERAL',
    glyph: 'Ǥ',
    sheet: { src: 'assets/sprites/monsters/officer.png', frameWidth: 64, frameHeight: 64 },
    radius: 0.5,
    height: 1.76,
    wander: 0,
    speed: 4,
    idleTime: [2, 6],
    anims: {
      idle: { frames: [1], fps: 1, loop: true, views: { frontSide: [13], side: [17], backSide: [21], back: [25] } },
      walk: { frames: [0, 1, 2, 3], fps: 6, views: { frontSide: [12, 13, 14, 15], side: [16, 17, 18, 19], backSide: [20, 21, 22, 23], back: [24, 25, 26, 27] } },
      react: { frames: [1], durations: [0.8] },
    },
    lines: ['Out of my way.'],
  }),
];
