// 3D models (see defineModel in src/engine/defs.js). Place one with a
// decoration whose `model` is its id (src/content/decor.js).
import terminal from './terminal.js';
import reactorRing from './reactor-ring.js';
import coolantTank from './coolant-tank.js';
import shuttle from './shuttle.js';
import barricade from './barricade.js';
import { boulderLarge, boulderSmall } from './boulder.js';

export default [terminal, reactorRing, coolantTank, shuttle, barricade, boulderLarge, boulderSmall];
