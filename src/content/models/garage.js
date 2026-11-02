import { ModelBuilder } from './lib/build.js';
import { engine } from './speeder.js';

// `speeder-engine`: one of an X-34's side engines, pulled out of a speeder
// in the garage behind J (levels/m1.js) and laid on two rusty trestles to
// be worked on. The same engine as the landspeeder's (models/speeder.js),
// its intake toward +x, at about waist height. ENGINE.top is how tall it
// stands; it collides as a cylinder ENGINE.r round.
export const ENGINE = { z: 0.85, r: 0.62, top: 1.06 };

const IRON = { tex: 'pipe-rust', texScale: 0.25 };

function speederEngine() {
  const m = new ModelBuilder('speeder-engine');
  engine(m, 0.5, 0, ENGINE.z);
  // The trestles: a saddle under the engine on two legs splayed out each
  // side, one under the cowl and one under the exhaust.
  const top = ENGINE.z - 0.2;
  for (const x of [0.28, -0.42]) {
    m.box([x - 0.05, -0.3, top - 0.06], [x + 0.05, 0.3, top], IRON);
    for (const s of [-1, 1]) {
      const sq = (cx, cy, h) => [[cx - h, cy - h], [cx + h, cy - h], [cx + h, cy + h], [cx - h, cy + h]];
      m.loft(sq(x, s * 0.42, 0.035), 0, sq(x, s * 0.26, 0.03), top - 0.06, { ...IRON, bottom: false, top: false });
    }
  }
  return m.build();
}

export default [speederEngine()];
