// The player: an original mercenary hired by the Rebellion. Starting stats
// and inventory. (No status-bar face for now; the HUD is reworked later.)
export default {
  health: 100,
  radius: 0.5,
  walkSpeed: 9.2, // tiles per second
  runSpeed: 15.6,
  startWeapons: ['fists', 'blaster'],
  startWeapon: 'blaster',
  startAmmo: { energy: 60 },
  blood: 'blood',
  sounds: { jump: 'player-jump', land: 'player-land' },
};
