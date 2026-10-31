import { ModelBuilder } from './lib/build.js';
import { PLASTERS } from './dome.js';

// Mos Eisley's round-topped arches (Mark's film stills, 2026-10-18).
//
// `arch-hood-<width>`: the deep hood that stands out from a wall round a
// door, taller than it: two legs and a half circle over them, in the
// wall's plaster. `width` is the opening inside it (3 or 4 tiles); the
// legs spring at HOOD.spring, so the top is at spring + width / 2 + band.
// Built looking south (+y): the wall's face at y 0, the origin on the
// floor at the hood's middle; the town kit turns it to face its wall.
//
// `arch-round-<width>`: rounds the top of a square opening (an `arch()`)
// of that width: the two corners under its lintel filled down to a half
// ellipse, ROUND.rise tall. A tile deep, behind its front face (y -1 to 0),
// the origin there where the curve springs from the sides; one a tile
// through. Its faces are `flat`, lit as walls are (by the light map in
// front of each, with the walls' contrast), so the faces flush with the wall
// match it and the curve under the opening reads as the plaster round it
// rather than in bands, one per segment.
// Each comes in the five plasters (`arch-hood-3-pale`, as the domes).
//
// `arch-round-<width><plaster>-grimy-<n>`: the same rounded arch, sooty, for
// vaults indoors (the cantina's alcoves): grime lying a hair inside its
// curve, a smoky stain along the crown fading down it (two bands over each
// other, so its edge is ragged), and streaks hanging from the lintel on its
// front face. (Streaks down the curve read as ribs across the vault.)
// Two of them, half a picture apart, to take turns along a vault so its
// soot runs on unbroken from tile to tile.

export const HOOD = { spring: 2.75, band: 0.45, depth: 0.45, widths: [3, 4] };
export const ROUND = { rise: 1.5, widths: [3, 4] };
const STEPS = 8; // segments round a hood's half circle
const CORNER = 6; // segments round each of a rounded opening's corners
/**
 * The grimy arches' soot: bands along the crown, each darkest along its
 * foot and laid from `from` (a share of the way up the curve) to the
 * crown, a quarter picture apart; and the streaks on the front. A band
 * spans two tiles of a vault's depth.
 */
const SOOT = { bands: [['grime-dust-1', 1 / 3, 0], ['grime-dust-2', 1 / 2, 0.25]], front: 'grime-streaks-3', kinds: 2 };

export const ARCH_MODELS = [];
for (const [suffix, tex] of Object.entries(PLASTERS)) {
  for (const w of HOOD.widths) ARCH_MODELS.push({ id: `arch-hood-${w}${suffix}`, kind: 'hood', w, tex });
  for (const w of ROUND.widths) {
    ARCH_MODELS.push({ id: `arch-round-${w}${suffix}`, kind: 'round', w, tex });
    for (let n = 0; n < SOOT.kinds; n++) ARCH_MODELS.push({ id: `arch-round-${w}${suffix}-grimy-${n + 1}`, kind: 'round', w, tex, grimy: n });
  }
}

/** The top of a hood of inner width `w` over its floor. */
export const hoodTop = (w) => HOOD.spring + w / 2 + HOOD.band;

function hood(id, w, tex) {
  const m = new ModelBuilder(id);
  const s = { tex };
  const front = { tex, flat: true }; // lit as the wall it stands on
  const a = w / 2;
  const { spring, band: b, depth: d } = HOOD;
  // The legs: their backs against the wall, their feet on the floor and
  // their tops under the arch are hidden.
  for (const sign of [1, -1]) {
    const [x0, x1] = sign > 0 ? [a, a + b] : [-a - b, -a];
    m.box([x0, 0, 0], [x1, d, spring], { ...s, top: false, bottom: false, side: (i) => [false, s, front, s][i] });
    m.line(x0, 0, x0, d).line(x0, d, x1, d).line(x1, d, x1, 0);
  }
  // The half circle: a block a segment, its outer face, front, soffit and
  // back (the joints between segments hidden). The back faces the wall, so
  // it only shows through the opening behind, once a door there opens (the
  // checkpoint's): without it the band's corners were see-through.
  for (let k = 0; k < STEPS; k++) {
    const [t0, t1] = [(k / STEPS) * Math.PI, ((k + 1) / STEPS) * Math.PI];
    const at = (r, t) => [Math.cos(t) * r, spring + Math.sin(t) * r];
    const outline = [at(a, t0), at(a + b, t0), at(a + b, t1), at(a, t1)];
    m.prism(outline, 0, d, { ...s, axis: 'y', top: front, bottom: s, side: (i) => (i === 0 || i === 2 ? false : s) });
  }
  return m.build();
}

function round(id, w, tex, grimy) {
  const m = new ModelBuilder(id);
  const s = { tex };
  const front = { tex, flat: true }; // lit as the wall it stands on
  const a = w / 2;
  const v = ROUND.rise;
  // Each corner a fan of thin wedges from the square corner to the curve,
  // only the curve (the soffit) and the two faces showing.
  for (const sign of [1, -1]) {
    const corner = [sign * a, v];
    for (let k = 0; k < CORNER; k++) {
      const [t0, t1] = [(k / CORNER) * (Math.PI / 2), ((k + 1) / CORNER) * (Math.PI / 2)];
      const p0 = [sign * a * Math.cos(t0), v * Math.sin(t0)];
      const p1 = [sign * a * Math.cos(t1), v * Math.sin(t1)];
      m.prism([corner, p0, p1], -1, 0, { ...front, axis: 'y', top: front, bottom: front, side: (i) => (i === 1 ? front : false) });
      if (grimy === undefined) continue;
      // Soot, a hair in from the curve (toward the opening's middle), each
      // band half its picture's width along the tile's depth, starting where
      // this kind's turn along the vault puts it (the other corner half a
      // picture on), darkest at the crown. On the front, streaks hanging
      // from the lintel.
      const s0 = t0 / (Math.PI / 2);
      const s1 = t1 / (Math.PI / 2);
      const [q0, q1] = [p0, p1].map(([x, z]) => [x * 0.995, z * 0.995]);
      const strip = [[q0[0], -1, q0[1]], [q1[0], -1, q1[1]], [q1[0], 0, q1[1]], [q0[0], 0, q0[1]]];
      const solid = [sign * a, -0.5, v];
      for (const [tex, from, shift] of SOOT.bands) {
        if (s0 < from - 1e-9) continue;
        const u0 = grimy * 0.5 + (sign > 0 ? 0 : 0.5) + shift;
        // (Inside the picture top to bottom: one whose height isn't a power
        // of two doesn't wrap.)
        const [va, vb] = [s0, s1].map((s) => Math.min((s - from) / (1 - from), 0.999));
        m.face(strip, { tex, uv: [[u0, va], [u0, vb], [u0 + 0.5, vb], [u0 + 0.5, va]] }, solid);
      }
      // (Its edge along the curve a hair back into the solid corner, so it
      // doesn't line the curve where a vault's tiles meet.)
      const inside = (n) => Math.min(Math.max(n, 0), 0.999); // (its picture doesn't wrap)
      const across = ([x, z]) => [inside(0.5 + x / (2 * a)), inside(1 - z / v)];
      const [r0, r1] = [p0, p1].map(([x, z]) => [x * 1.01 + sign * 0.005, z * 1.01 + 0.005]);
      m.face([corner, r0, r1].map(([x, z]) => [x, 0.01, z]), { tex: SOOT.front, uv: [corner, r0, r1].map(across) }, [0, -1, v / 2]);
    }
  }
  return m.build();
}

export default ARCH_MODELS.map((d) => (d.kind === 'hood' ? hood(d.id, d.w, d.tex) : round(d.id, d.w, d.tex, d.grimy)));
