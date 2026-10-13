import { ModelBuilder } from './lib/build.js';

// A coolant tank for the generator floor: a steel drum on a plinth, with a
// glowing band, a cap and a pipe stub. About 2 wide and 3.6 tall.
const m = new ModelBuilder('coolant-tank');
const steel = { tex: 'imp-panel', top: { color: ['gray', 0.72] } };
m.cylinder([0, 0, 0], 1.0, 0.3, { segments: 12, color: ['gray', 0.25], bottom: false });
m.cylinder([0, 0, 0.3], 0.9, 1.2, { ...steel, segments: 12, bottom: false, top: false });
m.cylinder([0, 0, 1.5], 0.94, 0.25, { segments: 12, color: [60, 220, 255], glow: true, bottom: false, top: false });
m.cylinder([0, 0, 1.75], 0.9, 1.35, { ...steel, segments: 12, bottom: false });
m.cylinder([0, 0, 3.1], 0.45, 0.4, { segments: 8, color: ['gray', 0.35], bottom: false, top: { color: ['gray', 0.5] } });
m.cylinder([0.8, 0, 2.4], 0.18, 0.5, { segments: 6, axis: 'x', color: ['gray', 0.3], bottom: false });

export default m.build();
