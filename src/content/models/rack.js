import { ModelBuilder } from './lib/build.js';
import { rng } from './junk-pile.js';

// Racks of shelves in the sandcrawler's hold (levels/m1.js), loaded with the
// Jawas' wares: boxes, drums, droids' domes and lengths of pipe, laid out by
// a seeded shuffle so each rack is the same every time but differs from the
// next. Grey steel shelves on rusty posts, 3 wide, 0.8 deep and 2.9 tall. Built
// looking south (+y), its back on a wall at y = 0; it collides as its
// outline.
export const RACK = { half: 1.5, depth: 0.8, height: 2.9 };

const STEEL = { tex: 'metal-grey', texScale: 0.5 };
const POST = { tex: 'metal-rust', texScale: 0.5 };
const BOXES = ['crate-grey', 'crate-rust', 'crate-tan', 'junk'];
const DRUMS = ['drum-rust', 'drum-grey'];

/** A ring of `n` points of radius `r` round (x, y). */
const ring = (n, r, x = 0, y = 0) => Array.from({ length: n }, (_, i) => [x + Math.cos((i / n) * Math.PI * 2) * r, y + Math.sin((i / n) * Math.PI * 2) * r]);

function rack(id, seed) {
  const m = new ModelBuilder(id);
  const rnd = rng(seed);
  const { half: w, depth: d, height: h } = RACK;
  const shelves = [0.15, 1.05, 1.95, h - 0.05];
  // Posts at the ends and in the middle, front and back.
  for (const x of [-w, 0, w - 0.08]) for (const y of [0.02, d - 0.08]) m.box([x, y, 0], [x + 0.08, y + 0.06, h], POST);
  for (const z of shelves) m.box([-w, 0.02, z - 0.05], [w, d - 0.02, z], STEEL);
  // The wares on each shelf but the top, left to right, a gap between them.
  for (const z of shelves.slice(0, -1)) {
    for (let x = -w + 0.1 + rnd() * 0.2; x < w - 0.35; ) {
      const pick = rnd();
      const y = 0.15 + rnd() * 0.1;
      if (pick < 0.45) {
        const [bw, bh] = [0.3 + rnd() * 0.35, 0.2 + rnd() * 0.4];
        if (x + bw > w - 0.08) break;
        m.box([x, y, z], [x + bw, Math.min(d - 0.05, y + 0.3 + rnd() * 0.25), z + bh], { tex: BOXES[Math.floor(rnd() * BOXES.length)], texScale: 0.5, bottom: false });
        x += bw + 0.06 + rnd() * 0.15;
      } else if (pick < 0.7) {
        const r = 0.12 + rnd() * 0.07;
        m.cylinder([x + r, y + r, z], r, 0.3 + rnd() * 0.25, { segments: 6, tex: DRUMS[Math.floor(rnd() * DRUMS.length)], texScale: 0.3, bottom: false });
        x += 2 * r + 0.06 + rnd() * 0.15;
      } else if (pick < 0.85) {
        // An astromech's dome, a ring of blue panels round it.
        const [cx, cy, r] = [x + 0.22, y + 0.24, 0.22];
        m.loft(ring(6, r, cx, cy), z, ring(6, r * 0.8, cx, cy), z + 0.12, { tex: 'dome-blue', texScale: 0.3, bottom: false, top: false });
        m.loft(ring(6, r * 0.8, cx, cy), z + 0.12, ring(6, r * 0.3, cx, cy), z + 0.22, { tex: 'dome-white', texScale: 0.3, bottom: false });
        x += 2 * r + 0.08 + rnd() * 0.15;
      } else {
        // A length of pipe lying along the shelf.
        const len = Math.min(0.6 + rnd() * 0.5, w - 0.1 - x);
        if (len < 0.4) break;
        m.cylinder([x, y + 0.2, z + 0.07], 0.07, len, { axis: 'x', segments: 6, tex: 'pipe-rust', texScale: 0.3 });
        x += len + 0.08;
      }
    }
  }
  m.outlineLines([[-w, 0], [w, 0], [w, d], [-w, d]]);
  return m.build();
}

export const RACKS = ['rack-a', 'rack-b', 'rack-c'];

export default RACKS.map((id, i) => rack(id, 17 + i * 6));
