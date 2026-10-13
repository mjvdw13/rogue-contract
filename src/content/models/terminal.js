import { ModelBuilder } from './lib/build.js';

// An Imperial computer terminal: a panelled cabinet with a sloped desk and
// a glowing, animated screen (the wall computer texture), facing +x (east at
// angle 0).
const m = new ModelBuilder('terminal');
const body = { tex: 'imp-panel-dark' };
// Side profile in the x-z plane: the front is low, the back tall.
const front = 0.3;
const back = -0.3;
const low = 0.78;
const high = 1.08;
// Along y the prism's end caps are its sides; edge 0 is the floor, left out.
m.prism([[back, 0], [front, 0], [front, low], [back, high]], -0.5, 0.5, { ...body, axis: 'y', side: (i) => (i === 0 ? false : i === 2 ? { color: ['gray', 0.45] } : undefined) });
// The screen, a hair above the sloped desk.
const slope = [front - back, low - high];
const len = Math.hypot(...slope);
const n = [-slope[1] / len, slope[0] / len]; // the desk's normal in x-z
const at = (t, y) => [back + slope[0] * t + n[0] * 0.012, y, high + slope[1] * t + n[1] * 0.012];
m.face([at(0.15, -0.38), at(0.15, 0.38), at(0.8, 0.38), at(0.8, -0.38)], { tex: 'imp-computer', glow: true }, [0, 0, 0.4]);
// A kick plate and a light strip along the front.
m.box([front, -0.46, 0.04], [front + 0.03, 0.46, 0.2], { color: ['gray', 0.18], bottom: false });
m.box([front, -0.4, 0.55], [front + 0.02, 0.4, 0.6], { color: [255, 40, 30], glow: true, bottom: false });

export default m.build();
