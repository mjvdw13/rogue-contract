// The player: an original mercenary hired by the Rebellion. Starting stats
// and inventory. (No status-bar face for now; the HUD is reworked later.)
export default {
  health: 100,
  radius: 0.25,
  walkSpeed: 4.6, // tiles per second
  runSpeed: 7.8,
  startWeapons: ['fists', 'blaster'],
  startWeapon: 'blaster',
  startAmmo: { energy: 60 },
  blood: 'blood',
};
