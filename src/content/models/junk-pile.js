import { ModelBuilder } from './lib/build.js';

// The Jawa junk yard's two heaps of scrap in Mos Eisley (levels/m1.js), as
// piles of junk rather than slabs (Mark, 2026-10-31): a lumpy mound of junk
// from the floor at `floor` up `rise` to a rough crest, with junk sticking
// out of it: sheets of plate, pipes and girders, drums and crates half
// buried, an astromech's dome. Laid out by a seeded shuffle, so it's the
// same every time. It collides as its outline (the level has no tiles
// there), too tall to climb, so its slope can start at the floor. The
// outlines are in the level's tiles; the model's origin is at `at`, the
// outline's middle, at z 0.
const PILES = {
  'junk-pile-west': { outline: [[56, 18], [74, 18], [62, 32], [56, 32]], floor: -0.5, rise: 4.2, seed: 7 },
  'junk-pile-east': { outline: [[80, 24], [84, 24], [84, 31], [67, 31]], floor: -0.5, rise: 4.6, seed: 11 },
};

/** The middle of an outline (its points' average). */
const middle = (pts) => [pts.reduce((s, q) => s + q[0], 0) / pts.length, pts.reduce((s, q) => s + q[1], 0) / pts.length];

/** Each heap's outline (tiles), its floor, how high the pile rises off it, and where the model goes. */
export const JUNK_PILES = Object.fromEntries(Object.entries(PILES).map(([id, p]) => [id, { ...p, at: middle(p.outline) }]));

const JUNK = { tex: 'junk' };
const PLATES = ['metal-rust', 'metal-grey', 'bay-plate', 'crawler-hull'];
const PIPES = ['metal-rust', 'pump-hose', 'metal-grey'];

/** A small seeded random number generator (mulberry32), 0..1. */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (v) => {
  const l = Math.hypot(...v);
  return [v[0] / l, v[1] / l, v[2] / l];
};
const below = (pts) => {
  const c = pts.reduce((s, q) => add(s, q, 1 / pts.length), [0, 0, 0]);
  return [c[0], c[1], c[2] - 1];
};

/** A rod of `sides` sides and radius `r` from a to b, at any slant (a pipe, a girder). */
export function rod(m, a, b, r, sides, style) {
  const d = unit(add(b, a, -1));
  const u = unit(cross(d, Math.abs(d[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0]));
  const v = cross(d, u);
  const ring = (c) => Array.from({ length: sides }, (_, i) => {
    const t = (i / sides) * Math.PI * 2 + Math.PI / sides;
    return add(add(c, u, Math.cos(t) * r), v, Math.sin(t) * r);
  });
  const [lo, hi] = [ring(a), ring(b)];
  const mid = add(a, add(b, a, -1), 0.5);
  for (let i = 0; i < sides; i++) m.face([lo[i], lo[(i + 1) % sides], hi[(i + 1) % sides], hi[i]], style, mid);
  m.face(hi, { color: ['gray', 0.12] }, mid);
}

function pile(id, { outline, floor, rise, seed }) {
  const m = new ModelBuilder(id);
  const rnd = rng(seed);
  const [cx, cy] = middle(outline);
  // The rim: the outline in model space, a point every 2 tiles or so.
  const rim = [];
  for (let i = 0; i < outline.length; i++) {
    const [a, b] = [outline[i], outline[(i + 1) % outline.length]];
    const n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 2));
    for (let k = 0; k < n; k++) rim.push([a[0] + ((b[0] - a[0]) * k) / n - cx, a[1] + ((b[1] - a[1]) * k) / n - cy]);
  }
  const N = rim.length;
  // Rings in toward the middle (how far out, and how high up the rise),
  // each point but the rim's nudged about, so the pile is lumpy: steep at
  // its foot, as junk heaped against itself stands.
  const RINGS = [[1, 0], [0.8, 0.42], [0.55, 0.78], [0.25, 0.95]];
  const rings = RINGS.map(([s, up], k) => rim.map(([x, y]) => {
    const wob = k === 0 ? 0 : 0.3;
    return [x * s + (rnd() - 0.5) * wob, y * s + (rnd() - 0.5) * wob, floor + (k === 0 ? -0.05 : up * rise + (rnd() - 0.4) * 0.6)];
  }));
  const peak = [(rnd() - 0.5) * 0.6, (rnd() - 0.5) * 0.6, floor + rise + 0.2];
  // The slopes, each face turned upward, and the crest.
  for (let i = 0; i < N; i++) {
    const j = (i + 1) % N;
    for (let k = 0; k + 1 < rings.length; k++) {
      const [p, q, r, s] = [rings[k][i], rings[k][j], rings[k + 1][j], rings[k + 1][i]];
      m.face([p, q, r], JUNK, below([p, q, r]));
      m.face([p, r, s], JUNK, below([p, r, s]));
    }
    const [p, q] = [rings.at(-1)[i], rings.at(-1)[j]];
    m.face([p, q, peak], JUNK, below([p, q, peak]));
  }
  // Junk sticking out of the slopes: at a point part way up each patch of
  // it (between two rings), now and then, facing out from the rim there.
  for (let k = 0; k + 1 < rings.length; k++) {
    for (let i = 0; i < N; i++) {
      if (rnd() > 0.35) continue;
      const j = (i + 1) % N;
      const [u, v] = [0.2 + rnd() * 0.6, 0.15 + rnd() * 0.5];
      const lerp = (a, b, t) => add(a, add(b, a, -1), t);
      const at = lerp(lerp(rings[k][i], rings[k][j], u), lerp(rings[k + 1][i], rings[k + 1][j], u), v);
      // Out from the rim: across its side, away from the middle.
      const [a, b] = [rim[i], rim[j]];
      let out = unit([b[1] - a[1], a[0] - b[0], 0]);
      if (out[0] * a[0] + out[1] * a[1] < 0) out = [-out[0], -out[1], 0];
      junk(m, rnd, at, out);
    }
  }
  m.outlineLines(rim);
  return m.build();
}

/** One piece of junk half buried at `at` on the slope, facing `out`. */
function junk(m, rnd, at, out) {
  const turn = (rnd() - 0.5) * 1.6;
  const d = [out[0] * Math.cos(turn) - out[1] * Math.sin(turn), out[0] * Math.sin(turn) + out[1] * Math.cos(turn), 0];
  const side = [-d[1], d[0], 0];
  const pickOf = (list) => list[Math.floor(rnd() * list.length)];
  const kind = rnd();
  if (kind < 0.35) {
    // A sheet of plate, leaning out of the pile.
    const [w, h, lean] = [0.7 + rnd() * 0.9, 0.6 + rnd() * 0.8, 0.3 + rnd() * 0.7];
    const foot = add(at, [0, 0, -0.25]);
    const [b0, b1] = [add(foot, side, -w / 2), add(foot, side, w / 2)];
    const rise = add([0, 0, h * Math.cos(lean)], d, h * Math.sin(lean));
    m.face([b0, b1, add(b1, rise), add(b0, rise)], { tex: pickOf(PLATES), twoSided: true });
  } else if (kind < 0.65) {
    // A pipe or a girder, poking up and out at a slant.
    const lift = 0.25 + rnd() * 0.7;
    const dir = add([0, 0, Math.sin(lift)], d, Math.cos(lift));
    const len = 1 + rnd() * 1.1;
    const girder = rnd() < 0.3;
    const a = add(at, dir, -0.4);
    rod(m, a, add(a, dir, len), girder ? 0.11 : 0.05 + rnd() * 0.07, girder ? 4 : 6, { tex: girder ? 'metal-grey' : pickOf(PIPES) });
  } else if (kind < 0.8) {
    // A drum lying on its side, along the slope or across it.
    const axis = Math.abs(d[0]) > Math.abs(d[1]) ? 'y' : 'x';
    const base = axis === 'x' ? [at[0] - 0.5, at[1], at[2] + 0.08] : [at[0], at[1] - 0.5, at[2] + 0.08];
    m.cylinder(base, 0.32, 1, { axis, segments: 6, tex: rnd() < 0.6 ? 'drum-rust' : 'drum-grey', top: { color: ['gray', 0.3] }, bottom: { color: ['gray', 0.25] } });
  } else if (kind < 0.92) {
    // A crate, sunk to half its height.
    const s = 0.55 + rnd() * 0.4;
    m.box([at[0] - s / 2, at[1] - s / 2, at[2] - s / 2], [at[0] + s / 2, at[1] + s / 2, at[2] + s / 2], { tex: rnd() < 0.5 ? 'crate-grey' : 'crate-rust', texScale: s / 2, bottom: false });
  } else {
    // An astromech's dome off a scrapped droid, in dirty white with a blue band.
    const tiers = [[0, 0.3], [0.13, 0.28], [0.22, 0.22], [0.29, 0.1]];
    const ring = (r) => Array.from({ length: 6 }, (_, i) => [at[0] + Math.cos((i / 6) * Math.PI * 2) * r, at[1] + Math.sin((i / 6) * Math.PI * 2) * r]);
    for (let t = 0; t + 1 < tiers.length; t++) {
      m.loft(ring(tiers[t][1]), at[2] - 0.05 + tiers[t][0], ring(tiers[t + 1][1]), at[2] - 0.05 + tiers[t + 1][0], {
        tex: t === 1 ? 'dome-blue' : 'dome-white',
        texScale: 0.3,
        bottom: false,
        top: t === tiers.length - 2 ? undefined : false,
      });
    }
  }
}

/** How high a pile stands, for its collision (its crest, near enough). */
export const pileHeight = ({ floor, rise }) => floor + rise;

// The cage fence penning the west heap in (docs/story.md: "a yard of droid
// parts behind a cage fence"), on the slant along its foot, 0.6 out from
// it, from the north wall to the west wall: diamond mesh panels about 2
// wide between rusty posts, set up from whatever came to hand, so the
// panels' tops and the posts' lean vary and some are patched with a sheet
// of plate. `path` is in the level's tiles; the model's origin is at `at`,
// its middle, at z 0.
const CAGE = { path: [[74.8, 18], [62.3, 32.6], [56, 32.6]], floor: -0.5, h: 2.6, seed: 5 };
const MESH = 'cage-rust';
const POST = { tex: 'metal-rust' };

/** The cage fence: its id, where it goes and how high it stands (for its collision). */
export const JUNK_CAGE = { id: 'junk-cage', at: middle(CAGE.path), height: CAGE.floor + CAGE.h + 0.2 };

function cage({ path, floor, h, seed }) {
  const m = new ModelBuilder(JUNK_CAGE.id);
  const rnd = rng(seed);
  const [cx, cy] = JUNK_CAGE.at;
  const pts = path.map(([x, y]) => [x - cx, y - cy]);
  // The posts: at each corner and every 2 tiles or so between, each
  // leaning a little, and how high the panel either side reaches on it.
  const posts = [];
  for (let i = 0; i + 1 < pts.length; i++) {
    const [a, b] = [pts[i], pts[i + 1]];
    const n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 2));
    for (let k = i === 0 ? 0 : 1; k <= n; k++) posts.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);
  }
  const lean = posts.map(() => [(rnd() - 0.5) * 0.16, (rnd() - 0.5) * 0.16]);
  const top = posts.map(() => floor + h + (rnd() - 0.5) * 0.3);
  /** A point on post i, `z` up it (following its lean). */
  const on = (i, z) => {
    const t = (z - floor) / h;
    return [posts[i][0] + lean[i][0] * t, posts[i][1] + lean[i][1] * t, z];
  };
  for (let i = 0; i + 1 < posts.length; i++) {
    // The panel's top dips to the lower of its two posts' and a bit under.
    const z1 = Math.min(top[i], top[i + 1]) - 0.15;
    m.face([on(i, floor), on(i + 1, floor), on(i + 1, z1), on(i, z1)], { tex: MESH, twoSided: true, uv: [[0, 1], [1, 1], [1, 0], [0, 0]] });
    // Now and then a sheet of plate wired over its lower part, a hair off it.
    if (rnd() < 0.25) {
      const zp = floor + 0.6 + rnd() * 0.7;
      const [a, b] = [on(i, floor + 0.1), on(i + 1, floor + 0.1)];
      const nx = (b[1] - a[1]) / Math.hypot(b[0] - a[0], b[1] - a[1]);
      const ny = -(b[0] - a[0]) / Math.hypot(b[0] - a[0], b[1] - a[1]);
      const s = rnd() < 0.5 ? 0.04 : -0.04;
      const off = (p, z) => [p[0] + nx * s, p[1] + ny * s, z];
      const [inA, inB] = [0.15 + rnd() * 0.2, 0.15 + rnd() * 0.2];
      const lerp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
      const [pa, pb] = [lerp(a, b, inA), lerp(b, a, inB)];
      m.face([off(pa, floor + 0.1), off(pb, floor + 0.1), off(pb, zp), off(pa, zp)], { tex: PLATES[Math.floor(rnd() * PLATES.length)], twoSided: true });
    }
  }
  for (let i = 0; i < posts.length; i++) rod(m, [...posts[i], floor - 0.05], on(i, top[i]), 0.07, 4, POST);
  for (let i = 0; i + 1 < pts.length; i++) m.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
  return m.build();
}

export default [...Object.entries(PILES).map(([id, p]) => pile(id, p)), cage(CAGE)];
