// Every pickup. To add one: define it in one of these files (or a new file
// imported here). Its `glyph` becomes usable in level maps.
import health from './health.js';
import armor from './armor.js';
import ammo from './ammo.js';
import weapons from './weapons.js';
import keys from './keys.js';

export default [...health, ...armor, ...ammo, ...weapons, ...keys];
