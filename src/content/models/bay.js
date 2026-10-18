import { ModelBuilder } from './lib/build.js';

// Docking Bay 87's fittings (Mos Eisley, levels/m1.js), round its pit's
// wall. Built looking south (+y), the wall's face along y = 0 and the
// origin on it at the foot (the rim's lamps: on its top); the level turns
// them to face the pit's centre. The wall is 11 tall, floor to rim.

const WALL = { tex: 'bay-wall' };
const IRON = ['gray', 0.22];
const PIPE = ['rust', 0.32];

/** How tall the pit's wall is, floor to rim. */
export const BAY_WALL = 11;

/**
 * A rib up the wall, floor to rim: a plinth, a buttress sloping back into a
 * square shaft, an iron band at street level and a cap block on the rim.
 * It collides as its plinth's outline.
 */
function rib() {
  const m = new ModelBuilder('bay-rib');
  const h = BAY_WALL;
  m.box([-0.6, 0, 0], [0.6, 1.1, 0.6], WALL);
  m.loft([[-0.45, 0], [0.45, 0], [0.45, 0.95], [-0.45, 0.95]], 0.6, [[-0.4, 0], [0.4, 0], [0.4, 0.45], [-0.4, 0.45]], 3, { ...WALL, bottom: false });
  m.box([-0.4, 0, 3], [0.4, 0.45, h - 0.4], { ...WALL, top: false, bottom: false });
  m.box([-0.44, 0, 5.2], [0.44, 0.49, 5.45], { color: IRON, bottom: { color: ['gray', 0.12] } });
  m.box([-0.55, 0, h - 0.4], [0.55, 0.6, h], { ...WALL, top: { color: ['tan', 0.55] } });
  m.outlineLines([[-0.6, 0], [0.6, 0], [0.6, 1.1], [-0.6, 1.1]]);
  return m.build();
}

/**
 * Fuel lines down the wall from the rim: two pipes clamped to it, coming
 * over the rim and down into a manifold block on the floor, a red valve wheel on
 * its front and a pipe off its side along the floor to a pump.
 */
function fuelLine() {
  const m = new ModelBuilder('bay-fuel-line');
  const h = BAY_WALL;
  for (const x of [-0.22, 0.22]) {
    m.cylinder([x, 0.2, 1.3], 0.08, h - 1.05, { segments: 6, color: PIPE, top: false, bottom: false });
    // Over the rim and back across its top.
    m.box([x - 0.09, -0.7, h + 0.16], [x + 0.09, 0.29, h + 0.34], { color: PIPE, bottom: false });
  }
  for (let z = 2.8; z < h - 0.5; z += 1.6) m.box([-0.4, 0, z], [0.4, 0.32, z + 0.08], { color: IRON, bottom: false });
  // The manifold, the valve and the pipe off to the pump.
  m.box([-0.5, 0, 0], [0.5, 0.5, 1.4], { color: ['gray', 0.3], top: { color: ['gray', 0.4] }, bottom: false });
  m.box([-0.5, 0.5, 1.2], [0.5, 0.53, 1.32], { color: ['yellow', 0.7] });
  m.cylinder([0, 0.5, 0.95], 0.2, 0.06, { axis: 'y', segments: 8, color: ['red', 0.45] });
  m.cylinder([0, 0.56, 0.95], 0.05, 0.12, { axis: 'y', segments: 6, color: IRON });
  m.cylinder([0.5, 0.25, 0.85], 0.07, 0.9, { axis: 'x', segments: 6, color: PIPE });
  return m.build();
}

/**
 * A fuel pump standing on the floor against the wall: a cabinet with a
 * hazard band, a lit gauge, a hose wound on a reel at its side and a
 * nozzle in a holster on its front. It collides as its outline.
 */
function fuelPump() {
  const m = new ModelBuilder('bay-fuel-pump');
  m.box([-0.6, 0, 0], [0.6, 0.85, 0.15], { color: ['gray', 0.2], bottom: false });
  m.box([-0.55, 0, 0.15], [0.55, 0.75, 1.55], { color: ['gray', 0.42], top: false, bottom: false });
  m.box([-0.58, 0, 1.55], [0.58, 0.8, 1.7], { color: ['gray', 0.3], bottom: { color: ['gray', 0.15] } });
  m.box([-0.56, 0, 0.3], [0.56, 0.76, 0.5], { color: ['yellow', 0.75], top: false, bottom: false });
  // The gauge and a status lamp, lit.
  m.box([-0.3, 0.75, 1.05], [0.1, 0.77, 1.35], { color: ['gray', 0.08] });
  m.box([-0.26, 0.77, 1.1], [0.06, 0.78, 1.3], { color: [255, 190, 60], glow: true });
  m.box([0.22, 0.75, 1.2], [0.34, 0.8, 1.32], { color: [90, 255, 90], glow: true });
  // The reel and its hose, and the nozzle.
  m.cylinder([0.55, 0.38, 0.95], 0.3, 0.12, { axis: 'x', segments: 10, color: ['gray', 0.3] });
  m.cylinder([0.67, 0.38, 0.95], 0.22, 0.14, { axis: 'x', segments: 10, color: ['gray', 0.1] });
  m.box([0.1, 0.75, 0.6], [0.3, 0.9, 0.95], { color: IRON, bottom: false });
  m.box([0.15, 0.78, 0.9], [0.25, 0.98, 1.0], { color: ['red', 0.4] });
  m.outlineLines([[-0.6, 0], [0.6, 0], [0.6, 0.85], [-0.6, 0.85]]);
  return m.build();
}

/**
 * A lamp on the rim, out over the pit: a post on the wall's top, an arm
 * reaching out and a lamp head at its end, its lens glowing down.
 */
function rimLamp() {
  const m = new ModelBuilder('bay-rim-lamp');
  m.box([-0.3, -0.7, 0], [0.3, -0.1, 0.12], { color: IRON, bottom: false });
  m.box([-0.08, -0.48, 0.12], [0.08, -0.32, 1.5], { color: ['steel', 0.45], bottom: false });
  m.box([-0.07, -0.48, 1.36], [0.07, 1.3, 1.5], { color: ['steel', 0.45] });
  // A strut from the post up to the arm.
  m.loft([[-0.04, -0.46], [0.04, -0.46], [0.04, -0.38], [-0.04, -0.38]], 0.6, [[-0.04, 0.42], [0.04, 0.42], [0.04, 0.5], [-0.04, 0.5]], 1.36, { color: ['steel', 0.35], top: false, bottom: false });
  m.box([-0.22, 1.05, 1.1], [0.22, 1.55, 1.42], { color: ['gray', 0.3], bottom: { color: [255, 250, 200], glow: true } });
  m.box([-0.04, 1.26, 1.5], [0.04, 1.34, 1.58], { color: [255, 60, 40], glow: true, bottom: false });
  return m.build();
}

export default [rib(), fuelLine(), fuelPump(), rimLamp()];
