// The enemy roster. To add one: create a file like the others, draw a sprite
// sheet (tools/art/sprites/imperials.js), and import it here. Its `glyph`
// becomes usable in level maps.
import stormtrooper from './stormtrooper.js';
import sandtrooper from './sandtrooper.js';
import officer from './officer.js';
import probeDroid from './probe-droid.js';

export default [stormtrooper, sandtrooper, officer, probeDroid];
