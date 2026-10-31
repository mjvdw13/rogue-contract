// 3D models (see defineModel in src/engine/defs.js). Place one with a
// decoration whose `model` is its id (src/content/decor.js).
import terminal from './terminal.js';
import reactorRing from './reactor-ring.js';
import coolantTank from './coolant-tank.js';
import shuttle from './shuttle.js';
import barricades from './barricade.js';
import { boulderLarge, boulderSmall } from './boulder.js';
import floodlightTowers from './floodlight-tower.js';
import { sensorMast, sensorDish } from './sensor-mast.js';
import domes from './dome.js';
import doorJamb, { doorLips } from './door-jamb.js';
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
import cantina from './cantina.js';
import hitching from './ring.js';
import pod from './pod.js';
import stains from './stains.js';
import sandcrawler from './sandcrawler.js';
import junkPiles from './junk-pile.js';
import furnace from './furnace.js';
import crane from './crane.js';
import droids from './droids.js';
import racks from './rack.js';

export default [terminal, reactorRing, coolantTank, shuttle, ...barricades, boulderLarge, boulderSmall, ...floodlightTowers, sensorMast, sensorDish, ...domes, doorJamb, ...doorLips, ...arches, ...buttresses, ...awnings, ...tin, ...pipes, ...clutter, landspeeder, ...bay, moldyCrow, ...market, ...cantina, ...hitching, ...pod, ...stains, ...sandcrawler, ...junkPiles, ...furnace, ...crane, ...droids, ...racks];
