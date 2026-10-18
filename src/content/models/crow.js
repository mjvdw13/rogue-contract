import { ModelBuilder } from './lib/build.js';

// The Moldy Crow, Kyle's modified HWK-290, hovering where it's set down: a
// long, deep hull, its deck sloping gently down to a raked bow that comes
// to a point in plan, the cockpit windows high on its flanks; at the back,
// an arm out of each side carrying a tall fin and a broad wing angled
// down, its engines glowing along its trailing edge; a gun pod under the
// belly. Shapes after the HWK-290 views Mark found (2026-10-18), textured
// with Jedi Knight's Crow (JK's names in assets/custom/crow.mjs): grey
// paint and orange rust, as in Dark Forces' cutscenes. The nose points +x.
// Built at about canon size against you (29 long, 23.6 across the wings),
// it's drawn at 0.8 (decor.js; Mark: it felt too big), so it's 23.2 long,
// 18.9 across and 8.2 tall at its fins, its hull floating 2 off the ground.
const m = new ModelBuilder('moldy-crow');

const METAL = { color: ['gray', 0.35] };
const DARK = { color: ['gray', 0.16] };

/** The hull's bottom: how high it hovers (2 once drawn at 0.8, clear of you at 1.7). */
const G = 2.5;

/**
 * A face textured with `tex`, its uv worked out from each point by `uvAt`
 * (in repeats of the texture).
 */
function textured(pts, tex, uvAt, inside, extra = {}) {
  m.face(pts, { tex, uv: pts.map(uvAt), ...extra }, inside);
}

/**
 * A six-faced solid from its four bottom and four top corners (in the same
 * order round), each face's style picked by `styles`: top, bottom, and
 * side(i) for the side from corner i to i + 1. A style is false (left out),
 * a face style, or [tex, uvAt, extra] for textured().
 */
function block(lo, hi, styles) {
  const pts = [...lo, ...hi];
  const mid = pts.reduce((s, p) => [s[0] + p[0] / 8, s[1] + p[1] / 8, s[2] + p[2] / 8], [0, 0, 0]);
  const put = (face, style) => {
    if (style === false) return;
    if (Array.isArray(style)) textured(face, style[0], style[1], mid, style[2]);
    else m.face(face, style, mid);
  };
  put(hi, styles.top);
  put(lo, styles.bottom);
  for (let i = 0; i < 4; i++) put([lo[i], lo[(i + 1) % 4], hi[(i + 1) % 4], hi[i]], styles.side(i));
}

// ---------------------------------------------------------------- the hull
// Its cross-section, (y, z) above its bottom: a flat belly, chamfered up to
// upright flanks, chamfered again to a narrower deck. Edges from corner i
// to i + 1: 0 the belly, 1 to 3 the starboard (south) flank, lower
// chamfer, side and upper chamfer, 4 the deck, 5 to 7 back down to port.
const SECTION = [[-1.9, 0], [1.9, 0], [2.1, 0.6], [2.1, 2.9], [1.4, 3.6], [-1.4, 3.6], [-2.1, 2.9], [-2.1, 0.6]];
/**
 * Where the section is along the hull, and its width and height there: a
 * box at the back, narrowing from x = -1; the deck slopes from 3.6 at x = 1
 * to 2.6 at 12.1, where the bow rakes forward and down to its tip at the
 * bottom, at 13.9.
 */
const STATIONS = [[-14, 1, 1], [-1, 1, 1], [1, 0.86, 1], [5, 0.72, 0.9], [9, 0.5, 0.8], [12.1, 0.26, 0.72], [13.9, 0.06, 0.06]];
const NOSE = -1;
const ring = ([x, kw, kh]) => SECTION.map(([y, z]) => [x, y * kw, G + z * kh]);

for (let s = 0; s + 1 < STATIONS.length; s++) {
  const a = ring(STATIONS[s]);
  const b = ring(STATIONS[s + 1]);
  const inside = [...a, ...b].reduce((c, q) => [c[0] + q[0] / 16, c[1] + q[1] / 16, c[2] + q[2] / 16], [0, 0, 0]);
  for (let i = 0; i < 8; i++) {
    const j = (i + 1) % 8;
    const pts = [a[i], a[j], b[j], b[i]];
    // The section's own heights (before the nose shrinks it), so a flank's
    // texture runs from its top to its bottom all the way to the nose.
    const z0 = [SECTION[i][1], SECTION[j][1], SECTION[j][1], SECTION[i][1]];
    let uv;
    let tex;
    if (i === 0) {
      tex = 'crow-belly';
      uv = pts.map(([x, y]) => [(x + 14) / 28, 0.5 + y / 3.8]);
    } else if (i >= 3 && i <= 5) {
      // The deck and its chamfers, seen from above: the whole texture
      // across the hull's widest, its nose at the nose.
      tex = 'crow-hull-top';
      uv = pts.map(([x, y]) => [0.5 + y / 4.2, (14 - x) / 28]);
    } else if (s === 0) {
      tex = 'crow-side';
      uv = pts.map(([x], k) => [(x + 14) / 13, (2.9 - z0[k]) / 2.9]);
    } else {
      // The nose's flanks: the texture's nose (its left) at the nose, so
      // the starboard flank is its mirror image.
      tex = 'crow-hull-side';
      uv = pts.map(([x], k) => [(14 - x) / (14 - NOSE), (2.9 - z0[k]) / 2.9]);
    }
    m.face(pts, { tex, uv }, inside);
  }
}
// The back, with its tail lights and grille, and the tip of the bow.
const back = ring(STATIONS[0]);
textured(back, 'crow-rear', ([, y, z]) => [0.5 + y / 4.2, 1 - (z - G) / 3.6], [0, 0, G + 1.8]);
const [, tw, th] = STATIONS[STATIONS.length - 1];
textured(ring(STATIONS[STATIONS.length - 1]), 'crow-nose', ([, y, z]) => [0.5 + y / (4.2 * tw), 1 - (z - G) / (3.6 * th)], [0, 0, G]);

// ---------------------------------------------------------------- sides and back
// The arms out of the back, which carry the fins and wings; their fronts
// the lights off the top of the back's texture, the sponsons' its grille.
const ARM = { x: [-14, -7.6], y: [2, 3.9], z: [G + 0.9, G + 2.5] };
for (const s of [-1, 1]) {
  // A sponson either side, where the nose begins.
  const sp = { x: [-4.2, -1], y: [2, 3.05], z: [G + 1, G + 2.4] };
  const front = (b, v0, v1) => ([, y, z]) => [(s * y - b.y[0]) / (b.y[1] - b.y[0]), v0 + ((b.z[1] - z) / (b.z[1] - b.z[0])) * (v1 - v0)];
  const corners = (b, z) => [[b.x[1], s * b.y[0], z], [b.x[1], s * b.y[1], z], [b.x[0], s * b.y[1], z], [b.x[0], s * b.y[0], z]];
  block(corners(sp, sp.z[0]), corners(sp, sp.z[1]), {
    top: ['crow-ribs', ([x, y]) => [(x + 4.2) / 3.2, (s * y - 2) / 1.05]],
    bottom: { tex: 'crow-belly' },
    // (0 the front, 1 the outer face, 2 the back, 3 against the hull.)
    side: (i) => [['crow-rear', front(sp, 0.7, 1)], ['crow-panel', ([x, , z]) => [(x + 4.2) / 3.2, (sp.z[1] - z) / 1.4]], { tex: 'crow-side' }, false][i],
  });
  block(corners(ARM, ARM.z[0]), corners(ARM, ARM.z[1]), {
    top: ['crow-ribs', ([x, y]) => [(x + 14) / 6.4, (s * y - 2) / 1.9]],
    bottom: { tex: 'crow-belly' },
    side: (i) => [['crow-rear', front(ARM, 0, 0.36)], { tex: 'crow-side' }, DARK, false][i],
  });

  // The fin: tall and thin on the arm, leaning out a little, its top cut back.
  const FIN = 7.7;
  const finLo = [[-10.2, s * 3.05, ARM.z[1]], [-10.2, s * 3.55, ARM.z[1]], [-14, s * 3.55, ARM.z[1]], [-14, s * 3.05, ARM.z[1]]];
  const finHi = [[-11.4, s * 3.45, G + FIN], [-11.4, s * 3.85, G + FIN], [-14, s * 3.85, G + FIN], [-14, s * 3.45, G + FIN]];
  const finV = (z) => (G + FIN - z) / (G + FIN - ARM.z[1]);
  // (Across an edge: 0 on its inner corners, at 3.05 and 3.45 out, 1 on its outer, at 3.55 and 3.85.)
  const across = ([, y]) => (s * y > 3.5 ? 1 : 0);
  block(finLo, finHi, {
    top: { tex: 'crow-side' },
    bottom: false,
    side: (i) => (i % 2 === 1
      ? ['crow-fin', ([x, , z]) => [(x + 14) / 3.8, finV(z)]]
      : ['crow-ladder', (p) => [across(p), finV(p[2])]]),
  });

  // The wing: broad and angled down, its leading edge a grille and its
  // trailing edge the engines, glowing.
  const W = { x: [-15.1, -8.3], y: [3.9, 11.8], z: [G + 1.45, G + 0.3], t: 0.9 };
  const wing = (dz) => [[W.x[1], s * W.y[0], W.z[0] + dz], [W.x[1], s * W.y[1], W.z[1] + dz], [W.x[0], s * W.y[1], W.z[1] + dz], [W.x[0], s * W.y[0], W.z[0] + dz]];
  const span = (y) => (s * y - W.y[0]) / (W.y[1] - W.y[0]);
  const chord = (x) => (W.x[1] - x) / (W.x[1] - W.x[0]);
  // (Down an edge: 0 on its top, 1 on its bottom; the top is above the bottom everywhere.)
  const lo = wing(0);
  const hi = wing(W.t);
  const down = (p) => (hi.some((q) => q[0] === p[0] && q[1] === p[1] && q[2] === p[2]) ? 0 : 1);
  block(lo, hi, {
    top: ['crow-wing', ([x, y]) => [span(y), chord(x)]],
    bottom: ['crow-wing', ([x, y]) => [span(y), chord(x)]],
    // (0 the leading edge, 1 the tip, 2 the trailing edge, 3 the root.)
    side: (i) => [
      ['crow-grille', (p) => [span(p[1]), down(p)]],
      ['crow-ladder', (p) => [down(p), chord(p[0])]],
      ['crow-engine', (p) => [span(p[1]), down(p)], { glow: true }],
      DARK,
    ][i],
  });
}

// ---------------------------------------------------------------- under it
// The gun pod under the belly, flat and wide, with two barrels forward.
const ZB = G - 1.35;
const ZT = G - 0.25;
const ZM = (ZB + ZT) / 2;
const pod = [[-0.9, ZB], [0.9, ZB], [1.2, ZM], [0.9, ZT], [-0.9, ZT], [-1.2, ZM]];
const podFront = pod.map(([y, z]) => [y * 0.8, ZM + (z - ZM) * 0.75]);
m.prism(pod, -1.4, 1.3, { axis: 'x', sides: { tex: 'crow-gun' }, bottom: DARK, top: false });
m.loft(pod, 1.3, podFront, 1.7, { axis: 'x', sides: { tex: 'crow-gun' }, bottom: false, top: DARK });
m.box([-0.8, -0.5, ZT], [0.6, 0.5, G], { ...METAL, top: false });
// Each barrel: a collar at the pod, the tube, and a muzzle only a little
// wider (Mark: not too thick), its black bore standing just proud of its
// face so it reads from the front.
const BORE = { color: [0, 0, 0] };
for (const y of [-0.55, 0.55]) {
  m.cylinder([1.7, y, ZM], 0.27, 0.35, { segments: 8, axis: 'x', sides: METAL, bottom: false, top: DARK });
  m.cylinder([2.05, y, ZM], 0.19, 2.25, { segments: 6, axis: 'x', sides: { tex: 'crow-barrel' }, bottom: false, top: false });
  m.cylinder([4.3, y, ZM], 0.23, 0.5, { segments: 8, axis: 'x', sides: METAL, bottom: DARK, top: DARK });
  m.cylinder([4.8, y, ZM], 0.13, 0.02, { segments: 8, axis: 'x', sides: false, bottom: false, top: BORE });
}

// Its shadow on the ground, dithered (the landspeeder's): under the hull,
// and under each wing.
const SHADOW = { tex: 'speeder-shadow', uv: [[0, 0], [1, 0], [1, 1], [0, 1]] };
const shadow = (x0, y0, x1, y1) => m.face([[x1, y0, 0.01], [x1, y1, 0.01], [x0, y1, 0.01], [x0, y0, 0.01]], SHADOW, [0, 0, -1]);
shadow(-15, -2.8, 14.5, 2.8);
for (const s of [-1, 1]) shadow(-15.6, s * 3.2, -7.8, s * 12.2);

// Collision: round the gun pod and its barrels, the only part as low as
// you are; you can walk under the hull and wings (2 up and more, drawn at 0.8).
m.outlineLines([[-1.4, -1.2], [1.3, -1.2], [1.7, -0.96], [4.8, -0.8], [4.8, 0.8], [1.7, 0.96], [1.3, 1.2], [-1.4, 1.2]]);

export default m.build();
