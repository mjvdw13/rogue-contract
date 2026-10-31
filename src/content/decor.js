import { defineDecoration } from '../engine/defs.js';
import { DOMES } from './models/dome.js';
import { ARCH_MODELS } from './models/arch.js';
import { LIP_WALLS, LIP_FEET } from './models/door-jamb.js';
import { BUTTRESS_MODELS } from './models/buttress.js';
import { AWNING_MODELS, AWNING_POLES, poleId } from './models/awning.js';
import { TIN_MODELS } from './models/tin.js';
import { PIPE_MODELS } from './models/pipes.js';
import { CLUTTER } from './models/clutter.js';
import { JUNK_PILES, pileHeight } from './models/junk-pile.js';
import { BAY_WALL, BAY_HOSES } from './models/bay.js';
import { TOWER_HEIGHT } from './models/market.js';
import { BAR, TAPS, CORNER } from './models/cantina.js';
import { POD } from './models/pod.js';
import { POST } from './models/ring.js';
import { STAINS } from './models/stains.js';

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
  // A dewback, standing about with its saddle on (cut from Mark's sheet by
  // assets/custom/dewback/cut.py). Frames 0-4 stand, seen from the front,
  // front three-quarter, side, back three-quarter and back; 5-9, 10-14 and 15-19
  // the same views a third, two thirds and all the way to head raised and tail
  // lowered. It holds each end pose four seconds, moving between them in 0.9.
  // It faces its placed angle and never moves.
  defineDecoration({
    id: 'dewback',
    glyph: 'D',
    sheet: S('dewback', 224, 81),
    scale: 0.85,
    solid: true,
    radius: 1,
    height: 1.9,
    anims: {
      idle: {
        frames: [0, 5, 10, 15, 10, 5],
        durations: [4, 0.3, 0.3, 4, 0.3, 0.3],
        loop: true,
        views: {
          frontSide: [1, 6, 11, 16, 11, 6],
          side: [2, 7, 12, 17, 12, 7],
          backSide: [3, 8, 13, 18, 13, 8],
          back: [4, 9, 14, 19, 14, 9],
        },
      },
    },
  }),
  // 3D models (src/content/models).
  defineDecoration({ id: 'terminal', model: 'terminal', solid: true, radius: 0.55, height: 1.1 }),
  defineDecoration({ id: 'reactor-ring', model: 'reactor-ring', spin: 0.5 }),
  defineDecoration({ id: 'coolant-tank', model: 'coolant-tank', solid: true, radius: 1, height: 3.6 }),
  defineDecoration({ id: 'shuttle', model: 'shuttle', solid: true, height: 3.5 }),
  defineDecoration({ id: 'barricade', model: 'barricade', solid: true, height: 1.15 }),
  // Mos Eisley's, dusty and worn (models/barricade.js).
  defineDecoration({ id: 'barricade-worn', model: 'barricade-worn', solid: true, height: 1.15 }),
  defineDecoration({ id: 'boulder-large', model: 'boulder-large', solid: true, height: 1.8 }),
  defineDecoration({ id: 'boulder-small', model: 'boulder-small', solid: true, height: 0.8 }),
  defineDecoration({ id: 'floodlight-tower', model: 'floodlight-tower', solid: true, radius: 0.5, height: 7 }),
  defineDecoration({ id: 'floodlight-tower-worn', model: 'floodlight-tower-worn', solid: true, radius: 0.5, height: 7 }), // Mos Eisley's
  defineDecoration({ id: 'sensor-mast', model: 'sensor-mast', solid: true, radius: 0.45, height: 8.1 }),
  defineDecoration({ id: 'sensor-dish', model: 'sensor-dish', spin: 0.9 }),
  // Mos Eisley's domes, on roofs and over round buildings.
  ...DOMES.map((d) => defineDecoration({ id: d.id, model: d.id, solid: true, radius: d.radius, height: d.height })),
  // The tiled jamb of a Mos Eisley doorway (inside the wall's recess, so it needn't be solid).
  defineDecoration({ id: 'door-jamb', model: 'door-jamb' }),
  // Its bevelled corners on the wall's face, in the wall's plaster (on the wall, so `fixed`).
  ...[...Object.keys(LIP_WALLS).map((s) => `door-lips${s}`), ...Object.keys(LIP_FEET).map((s) => `door-lips-foot${s}`)].map((id) => defineDecoration({ id, model: id, fixed: true })),
  // Round-topped arches: hoods standing out round doors (their legs collide)
  // and the rounded tops of openings, overhead.
  ...ARCH_MODELS.map((d) => defineDecoration({ id: d.id, model: d.id, solid: d.kind === 'hood', fixed: true })),
  // Sloping buttresses against walls (they collide as their footprints).
  ...BUTTRESS_MODELS.map((d) => defineDecoration({ id: d.id, model: d.id, solid: true, fixed: true })),
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
  // On its floor: big crates (they stack: place one 2 up on another),
  // colliding as their outlines; hoses out from the pumps, underfoot.
  defineDecoration({ id: 'bay-crate-grey', model: 'bay-crate-grey', solid: true, height: 2, fixed: true }),
  defineDecoration({ id: 'bay-crate-tan', model: 'bay-crate-tan', solid: true, height: 2, fixed: true }),
  defineDecoration({ id: 'bay-crate-rust-long', model: 'bay-crate-rust-long', solid: true, height: 1.6, fixed: true }),
  ...BAY_HOSES.map(({ id }) => defineDecoration({ id, model: id, fixed: true })),
  // Mos Eisley's market (models/market.js): a stall's counter and rack
  // (colliding, as high as the rack), the condenser tower over the water
  // plaza (as its plinth) and the dewback trough.
  defineDecoration({ id: 'market-stall', model: 'market-stall', solid: true, height: 1.45, fixed: true }),
  defineDecoration({ id: 'condenser-tower', model: 'condenser-tower', solid: true, height: TOWER_HEIGHT, fixed: true }),
  defineDecoration({ id: 'water-trough', model: 'water-trough', solid: true, height: 0.75, fixed: true }),
  // Chalmun's cantina (models/cantina.js): the bar (colliding as its
  // counter's lines, only as high as the counter, so shots go over it), the
  // taps' column inside it (as tall as its pipes), stools round it, the
  // booths (colliding round their benches and tables, as high as their
  // backs), the cut front corners' panels, the back-bar's shelves, and the
  // canopy ring round the well over the bar, hanging from the ceiling.
  defineDecoration({ id: 'cantina-bar', model: 'cantina-bar', solid: true, height: BAR.top, fixed: true }),
  defineDecoration({ id: 'cantina-taps', model: 'cantina-taps', solid: true, radius: TAPS.r + 0.05, height: TAPS.pipes, fixed: true }),
  defineDecoration({ id: 'cantina-stool', model: 'cantina-stool', solid: true, radius: 0.26, height: 0.7, fixed: true }),
  defineDecoration({ id: 'cantina-booth', model: 'cantina-booth', solid: true, height: 1.1, fixed: true }),
  defineDecoration({ id: 'cantina-corner', model: 'cantina-corner', solid: true, height: CORNER.h, fixed: true }),
  defineDecoration({ id: 'cantina-shelves', model: 'cantina-shelves', solid: true, height: 2.2, fixed: true }),
  defineDecoration({ id: 'cantina-canopy', model: 'cantina-canopy', fixed: true }),
  // The vestibule's droid detector on its wall, the lit sign over the
  // doorway and the timber frame round it, and bare bulbs hung from ceilings.
  defineDecoration({ id: 'cantina-detector', model: 'cantina-detector', fixed: true }),
  defineDecoration({ id: 'cantina-sign', model: 'cantina-sign', fixed: true }),
  defineDecoration({ id: 'cantina-doorframe', model: 'cantina-doorframe', fixed: true }),
  defineDecoration({ id: 'cantina-lamp', model: 'cantina-lamp', fixed: true }),
  defineDecoration({ id: 'cantina-datapad', model: 'cantina-datapad', fixed: true }),
  // On Mos Eisley's walls and streets after Mark's film stills: a hitching
  // ring and the post the cantina's hangs on (models/ring.js), and the
  // white dome pod by the cantina (models/pod.js), colliding as their
  // cylinders.
  defineDecoration({ id: 'hitching-ring', model: 'hitching-ring', fixed: true }),
  defineDecoration({ id: 'ring-post', model: 'ring-post', solid: true, radius: POST.r, height: POST.h, fixed: true }),
  defineDecoration({ id: 'dome-pod', model: 'dome-pod', solid: true, radius: POD.r, height: POD.h, fixed: true }),
  // Stains lying on floors (models/stains.js): grime, darkening the floor.
  ...STAINS.map(([id]) => defineDecoration({ id, model: id, fixed: true })),
  // The Moldy Crow, hovering (models/crow.js), bobbing gently, drawn at 0.8 of
  // canon size: only its gun pod is low enough to collide (as its outline);
  // you walk under the rest.
  defineDecoration({ id: 'moldy-crow', model: 'moldy-crow', solid: true, height: 8.2, scale: 0.8, fixed: true, bob: { height: 0.04, period: 4, roll: 0.6 } }),
  // The Jawas' sandcrawler (models/sandcrawler.js): the level's tiles are its
  // hold and collide; the model is its outside.
  defineDecoration({ id: 'sandcrawler', model: 'sandcrawler', fixed: true }),
  // The junk yard's heaps (models/junk-pile.js), colliding as their
  // outlines, as high as their crests, too tall to climb.
  ...Object.entries(JUNK_PILES).map(([id, p]) => defineDecoration({ id, model: id, solid: true, height: pileHeight(p), fixed: true })),
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
