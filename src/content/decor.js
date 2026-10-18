import { defineDecoration } from '../engine/defs.js';
import { DOMES } from './models/dome.js';
import { AWNING_MODELS, AWNING_POLES, poleId } from './models/awning.js';
import { TIN_MODELS } from './models/tin.js';
import { PIPE_MODELS } from './models/pipes.js';
import { CLUTTER } from './models/clutter.js';
import { BAY_WALL } from './models/bay.js';
import { TOWER_HEIGHT } from './models/market.js';

// Scenery. Solid ones block movement; ones with health can be shot (and
// `explode`).
const S = (name, w, h) => ({ src: `assets/sprites/decor/${name}.png`, frameWidth: w, frameHeight: h });

export default [
  defineDecoration({ id: 'supply-crate', glyph: 'x', sheet: S('supply-crate', 40, 40), solid: true, radius: 0.64, height: 1.2 }),
  defineDecoration({
    id: 'console',
    glyph: 'k',
    sheet: S('console', 32, 40),
    anims: { idle: { frames: [0, 1, 2], fps: 3, loop: true, fullbright: false } },
    solid: true,
    radius: 0.6,
  }),
  // 3D models (src/content/models).
  defineDecoration({ id: 'terminal', model: 'terminal', solid: true, radius: 0.55, height: 1.1 }),
  defineDecoration({ id: 'reactor-ring', model: 'reactor-ring', spin: 0.5 }),
  defineDecoration({ id: 'coolant-tank', model: 'coolant-tank', solid: true, radius: 1, height: 3.6 }),
  defineDecoration({ id: 'shuttle', model: 'shuttle', solid: true, height: 3.5 }),
  defineDecoration({ id: 'barricade', model: 'barricade', solid: true, height: 1.15 }),
  defineDecoration({ id: 'boulder-large', model: 'boulder-large', solid: true, height: 1.8 }),
  defineDecoration({ id: 'boulder-small', model: 'boulder-small', solid: true, height: 0.8 }),
  defineDecoration({ id: 'floodlight-tower', model: 'floodlight-tower', solid: true, radius: 0.5, height: 7 }),
  defineDecoration({ id: 'sensor-mast', model: 'sensor-mast', solid: true, radius: 0.45, height: 8.1 }),
  defineDecoration({ id: 'sensor-dish', model: 'sensor-dish', spin: 0.9 }),
  // Mos Eisley's domes, on roofs and over round buildings.
  ...DOMES.map((d) => defineDecoration({ id: d.id, model: d.id, solid: true, radius: d.radius, height: d.height })),
  // The tiled jamb of a Mos Eisley doorway (inside the wall's recess, so it needn't be solid).
  defineDecoration({ id: 'door-jamb', model: 'door-jamb' }),
  defineDecoration({ id: 'door-jamb-through', model: 'door-jamb-through' }),
  // The town kit's models stay where it puts them (`fixed`): against and on
  // walls their radius reaches the roof, which they'd otherwise climb onto.
  // Mos Eisley's cloth awnings: their tops and ends over the kit's slab, and the poles under their fronts.
  ...AWNING_MODELS.map((id) => defineDecoration({ id, model: id, fixed: true })),
  ...AWNING_POLES.map((h) => defineDecoration({ id: poleId(h), model: poleId(h), solid: true, radius: 0.12, height: h, fixed: true })),
  // Tin roofs on Mos Eisley's lean-tos (on the roofs, out of reach).
  ...TIN_MODELS.map((id) => defineDecoration({ id, model: id, fixed: true })),
  // Pipes, conduits, a tank and a box unit on Mos Eisley's walls (against the wall, so not solid).
  ...PIPE_MODELS.map((id) => defineDecoration({ id, model: id, fixed: true })),
  // Things on Mos Eisley's streets: crates, drums, canisters, junk, rubble, scrap, a vaporator.
  ...Object.entries(CLUTTER).map(([id, c]) => defineDecoration({ id, model: id, solid: !!c.solid, radius: c.radius, height: c.height, fixed: true })),
  // An X-34 landspeeder parked on the street, hovering (models/speeder.js),
  // bobbing gently: it collides as its outline, as high as its windscreen.
  defineDecoration({ id: 'landspeeder', model: 'landspeeder', solid: true, height: 1.22, fixed: true, bob: { height: 0.02, period: 3.2 } }),
  // Docking Bay 87's fittings (models/bay.js): ribs up its wall and pumps (colliding as
  // their outlines), fuel lines down to the pumps, lamps on its rim.
  defineDecoration({ id: 'bay-rib', model: 'bay-rib', solid: true, height: BAY_WALL, fixed: true }),
  defineDecoration({ id: 'bay-fuel-line', model: 'bay-fuel-line', fixed: true }),
  defineDecoration({ id: 'bay-fuel-pump', model: 'bay-fuel-pump', solid: true, height: 1.7, fixed: true }),
  defineDecoration({ id: 'bay-rim-lamp', model: 'bay-rim-lamp', fixed: true }),
  // Mos Eisley's market (models/market.js): a stall's counter and rack
  // (colliding, as high as the rack), the condenser tower over the water
  // plaza (as its plinth) and the dewback trough.
  defineDecoration({ id: 'market-stall', model: 'market-stall', solid: true, height: 1.45, fixed: true }),
  defineDecoration({ id: 'condenser-tower', model: 'condenser-tower', solid: true, height: TOWER_HEIGHT, fixed: true }),
  defineDecoration({ id: 'water-trough', model: 'water-trough', solid: true, height: 0.75, fixed: true }),
  // The Moldy Crow, hovering (models/crow.js), bobbing gently, drawn at 0.8 of
  // canon size: only its gun pod is low enough to collide (as its outline);
  // you walk under the rest.
  defineDecoration({ id: 'moldy-crow', model: 'moldy-crow', solid: true, height: 8.2, scale: 0.8, fixed: true, bob: { height: 0.04, period: 4, roll: 1.2 } }),
  defineDecoration({ id: 'ceiling-lamp', glyph: 'l', sheet: S('ceiling-lamp', 48, 16), hanging: true, fullbright: true }),
  defineDecoration({
    id: 'fuel-barrel',
    glyph: 'f',
    sheet: S('fuel-barrel', 24, 32),
    anims: { idle: { frames: [0] }, death: { frames: [1, 2, 3, 4, 5], fps: 10, fullbright: [0, 1, 2, 3] } },
    solid: true,
    radius: 0.44,
    health: 20,
    bleeds: false,
    explode: { radius: 5.2, damage: 128, sound: 'explode' },
    sounds: { death: 'explode' },
  }),
];
