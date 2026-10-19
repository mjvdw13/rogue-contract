// 3D models (see defineModel in src/engine/defs.js). Place one with a
// decoration whose `model` is its id (src/content/decor.js).
import terminal from './terminal.js';
import reactorRing from './reactor-ring.js';
import coolantTank from './coolant-tank.js';
import shuttle from './shuttle.js';
import barricade from './barricade.js';
import { boulderLarge, boulderSmall } from './boulder.js';
import floodlightTower from './floodlight-tower.js';
import { sensorMast, sensorDish } from './sensor-mast.js';
import domes from './dome.js';
import doorJamb, { doorJambThrough } from './door-jamb.js';
import arches from './arch.js';
import buttresses from './buttress.js';
import awnings from './awning.js';
import tin from './tin.js';
import pipes from './pipes.js';
import clutter from './clutter.js';
import landspeeder from './speeder.js';
import bay from './bay.js';
import moldyCrow from './crow.js';
import market from './market.js';

export default [terminal, reactorRing, coolantTank, shuttle, barricade, boulderLarge, boulderSmall, floodlightTower, sensorMast, sensorDish, ...domes, doorJamb, doorJambThrough, ...arches, ...buttresses, ...awnings, ...tin, ...pipes, ...clutter, landspeeder, ...bay, moldyCrow, ...market];
