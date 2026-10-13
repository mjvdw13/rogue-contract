import { ModelBuilder } from './lib/build.js';

// A small Rebel shuttle on the landing pad: fuselage, tapered nose with the
// cockpit windows, two engine pods glowing at the back, short wings and a
// tail fin. The nose points +x; it's 6.9 long and 4.2 wide.
const m = new ModelBuilder('shuttle');
const hull = { color: ['beige', 0.75] };
const dark = { color: ['gray', 0.3] };
const glass = { color: [20, 150, 220], glow: true };

// Cross-section (y, z), floor to roof: a flattened hexagon.
const section = [[-1.0, 0.6], [1.0, 0.6], [1.25, 1.3], [0.85, 2.1], [-0.85, 2.1], [-1.25, 1.3]];
const scaled = (k, dz) => section.map(([y, z]) => [y * k, (z - 1.3) * k + 1.3 + dz]);
m.prism(section, -3.0, 2.0, { ...hull, axis: 'x', bottom: dark, side: (i) => (i === 0 ? dark : undefined) });
// The nose tapers to a blunt tip; its upper faces are the cockpit glass.
m.loft(section, 2.0, scaled(0.45, -0.15), 3.4, { ...hull, axis: 'x', side: (i) => (i === 2 || i === 3 || i === 4 ? glass : i === 0 ? dark : undefined) });
// Engine pods, glowing at the back (their near end along x).
for (const y of [-1.55, 1.55]) {
  m.cylinder([-3.4, y, 1.25], 0.55, 2.9, { segments: 8, axis: 'x', turn: Math.PI / 8, color: ['gray', 0.55], bottom: { color: [255, 120, 20], glow: true } });
  m.box([-2.6, y > 0 ? 1.1 : -1.3, 1.1], [-1.0, y > 0 ? 1.3 : -1.1, 1.4], hull);
}
// Wings, and the tail fin.
m.box([-2.4, -2.1, 1.35], [0.4, -1.2, 1.5], hull);
m.box([-2.4, 1.2, 1.35], [0.4, 2.1, 1.5], hull);
m.loft([[-0.12, 2.1], [0.12, 2.1], [0.08, 3.5], [-0.08, 3.5]], -2.9, [[-0.12, 2.1], [0.12, 2.1], [0.08, 3.5], [-0.08, 3.5]], -1.4, { ...hull, axis: 'x' });
// Landing struts.
for (const [x, y] of [[2.2, 0], [-2.4, -0.7], [-2.4, 0.7]]) m.box([x - 0.12, y - 0.12, 0], [x + 0.12, y + 0.12, 0.6], dark);

// Collision: the outline of the hull, wings and pods.
m.outlineLines([[3.4, -0.6], [3.4, 0.6], [2.0, 1.25], [0.4, 2.1], [-3.4, 2.1], [-3.4, -2.1], [0.4, -2.1], [2.0, -1.25]]);

export default m.build();
