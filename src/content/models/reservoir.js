import { ModelBuilder } from './lib/build.js';

// The Homestead's reservoir (levels/m2.js, docs/mission2.md area 3).
//
// `res-pillar`: one of the round duracrete pillars standing in the pool,
// RES_PILLAR.h from the pool's floor to the vault: a plinth, the shaft, a
// rusty band where the water once stood, a capital flaring out under the
// vault. Collides as a circle (its decoration's radius).
//
// `well-grate`: the iron grate across a light well's foot, where its shaft
// comes through the vault: a frame WELL_GRATE.half each way and bars along
// x. Not solid. Its decoration trickles sand and dust down the shaft of
// light (decor.js).
//
// `floor-cable-<len>`: the Imperials' power cable lying along the floor,
// `len` long along x, wandering a little either side and meeting y = 0 at
// both ends so lengths join. Not solid.
export const RES_PILLAR = { r: 0.8, h: 9.5, mark: 1.6 };
export const WELL_GRATE = { half: 1 };
export const FLOOR_CABLES = [4, 8];

const IRON = { color: ['gray', 0.22] };
const CABLE = { color: [28, 26, 24] };

function pillar() {
  const m = new ModelBuilder('res-pillar');
  const { r, h, mark } = RES_PILLAR;
  m.cylinder([0, 0, 0], r + 0.2, 0.6, { segments: 10, tex: 'derelict-wall', bottom: false });
  m.cylinder([0, 0, 0.6], r, h - 1.3, { segments: 10, tex: 'duracrete', bottom: false, top: false });
  m.cylinder([0, 0, mark], r + 0.02, 0.12, { segments: 10, tex: 'pipe-rust', bottom: false, top: false });
  const ring = (rad) => Array.from({ length: 10 }, (_, i) => [Math.cos((i / 10) * Math.PI * 2) * rad, Math.sin((i / 10) * Math.PI * 2) * rad]);
  m.loft(ring(r), h - 0.7, ring(r + 0.35), h - 0.15, { tex: 'duracrete', bottom: false, top: false });
  m.cylinder([0, 0, h - 0.15], r + 0.35, 0.15, { segments: 10, tex: 'derelict-wall', bottom: false });
  return m.build();
}

function grate() {
  const m = new ModelBuilder('well-grate');
  const a = WELL_GRATE.half;
  const t = 0.08;
  m.box([-a, -a, 0], [a, -a + t, t], IRON);
  m.box([-a, a - t, 0], [a, a, t], IRON);
  m.box([-a, -a, 0], [-a + t, a, t], IRON);
  m.box([a - t, -a, 0], [a, a, t], IRON);
  for (let y = -a + 0.4; y < a - 0.1; y += 0.4) m.box([-a, y - 0.025, 0], [a, y + 0.025, t * 0.8], { tex: 'pipe-rust' });
  return m.build();
}

function cable(len) {
  const m = new ModelBuilder(`floor-cable-${len}`);
  const n = len * 2;
  const w = 0.035;
  const at = (i) => {
    const x = -len / 2 + (i / n) * len;
    return [x, 0.12 * Math.sin((i / n) * Math.PI * 2 * (len / 4)) * Math.sin((i / n) * Math.PI)];
  };
  for (let i = 0; i < n; i++) {
    const [x0, y0] = at(i);
    const [x1, y1] = at(i + 1);
    m.face([[x0, y0 - w, 0.03], [x1, y1 - w, 0.03], [x1, y1 + w, 0.03], [x0, y0 + w, 0.03]], CABLE, [(x0 + x1) / 2, (y0 + y1) / 2, -1]);
  }
  return m.build();
}

export const RESERVOIR_MODELS = ['res-pillar', 'well-grate', ...FLOOR_CABLES.map((l) => `floor-cable-${l}`)];

export default [pillar(), grate(), ...FLOOR_CABLES.map(cable)];
