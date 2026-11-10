// The friendly characters. To add one: create a file like villagers.js and
// import it here. Its `glyph` becomes usable in level maps.
import villagers from './villagers.js';
import droids from './droids.js';
import prisoners from './prisoners.js';

export default [...villagers, ...droids, ...prisoners];
