import { ModelBuilder } from './lib/build.js';

// Scaffolding left standing in the derelict bay (levels/m1.js): rusty
// poles, plank decks and cross braces, put up against the gutted freighter
// and the pit's wall by whoever stripped them, and left. Some planks are
// gone and the top deck is half laid. Built looking south (+y) with its
// back at y = 0, against what it stands by; `bays` of 2 along x, a deck
// every 1.5 up.
export const SCAFFOLDS = {
  scaffold: { bays: 2, decks: 3 },
  'scaffold-tall': { bays: 3, decks: 5 },
};
const BAY = 2;
const DECK = 1.5;
const DEPTH = 1.2;
const POLE = { tex: 'pipe-rust', texScale: 0.25 };
const PLANK = { tex: 'planks', texScale: 1 };
const DARK = { color: [40, 30, 22] };

/** How tall a scaffold stands (its poles' tops). */
export const scaffoldHeight = (id) => SCAFFOLDS[id].decks * DECK + 0.6;

function scaffold(id) {
  const { bays, decks } = SCAFFOLDS[id];
  const m = new ModelBuilder(id);
  const L = (bays * BAY) / 2;
  const top = scaffoldHeight(id);
  const t = 0.05;
  // Posts at each bay's ends, front and back (a hair off the wall).
  for (let i = 0; i <= bays; i++) {
    const x = -L + i * BAY;
    for (const y of [0.15, DEPTH]) m.box([x - t, y - t, 0], [x + t, y + t, top], { ...POLE, bottom: false, top: false });
  }
  // Each deck: ledgers along front and back, the planks laid on them.
  for (let k = 1; k <= decks; k++) {
    const z = k * DECK;
    for (const y of [0.15, DEPTH]) m.box([-L, y - t, z - 0.1], [L, y + t, z - 0.02], { ...POLE, top: false, side: (i) => (i === 1 || i === 3 ? false : undefined) });
    for (let i = 0; i < bays; i++) {
      // The boards: a bay's planks as one deck, a gap where one's missing
      // (now and then), and the top deck half laid.
      const gap = (i * 7 + k * 3) % 5;
      const y1 = k === decks ? 0.7 : DEPTH;
      const deck = (ya, yb) => m.box([-L + i * BAY + 0.05, ya, z - 0.02], [-L + (i + 1) * BAY - 0.05, yb, z + 0.04], { ...PLANK, bottom: DARK });
      if (gap > 0 && gap < 3 && k < decks) {
        deck(0.15, 0.15 + gap * 0.3);
        deck(0.45 + gap * 0.3, y1);
      } else deck(0.15, y1);
    }
    // A guard rail along the front of each deck.
    m.box([-L, DEPTH - t, z + 0.9], [L, DEPTH + t, z + 0.96], { ...POLE, side: (i) => (i === 1 || i === 3 ? false : undefined) });
  }
  // Cross braces on the front, one diagonal a bay, alternating.
  for (let i = 0; i < bays; i++) {
    const [x0, x1] = i % 2 ? [-L + (i + 1) * BAY, -L + i * BAY] : [-L + i * BAY, -L + (i + 1) * BAY];
    for (let k = 0; k < decks; k++) {
      const [z0, z1] = [k * DECK + 0.1, (k + 1) * DECK - 0.15];
      const y = DEPTH + t + 0.01;
      m.face([[x0, y, z0], [x0, y, z0 + 0.1], [x1, y, z1], [x1, y, z1 - 0.1]], { ...POLE, twoSided: true });
    }
  }
  // A ladder up the east end, between the posts.
  const lx = L - 0.05;
  for (const y of [0.4, 0.85]) m.box([lx - t, y - 0.03, 0], [lx + t, y + 0.03, decks * DECK], POLE);
  for (let z = 0.4; z < decks * DECK; z += 0.5) m.box([lx - 0.03, 0.4, z], [lx + 0.03, 0.85, z + 0.04], { ...POLE, top: false, bottom: false });
  m.outlineLines([[-L - t, 0], [L + t, 0], [L + t, DEPTH + t], [-L - t, DEPTH + t]]);
  return m.build();
}

export default Object.keys(SCAFFOLDS).map(scaffold);
