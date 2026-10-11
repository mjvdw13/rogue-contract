import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLevel } from '../src/engine/world/level.js';
import { castRay } from '../src/engine/world/physics.js';
import { Slant, DIAGONALS } from '../src/engine/world/slants.js';
import { makeWorld, mockInput, room, run, registry } from './helpers.js';

const FLOOR = { floor: 'carpet', ceiling: 'ceiling-tile', light: 160 };

test('each diagonal preset is solid in the corner it names', () => {
  const corners = { NE: [0.9, 0.1], NW: [0.1, 0.1], SE: [0.9, 0.9], SW: [0.1, 0.9] };
  for (const [name, line] of Object.entries(DIAGONALS)) {
    const s = new Slant(line, 3, 4, 0);
    for (const [corner, [cx, cy]] of Object.entries(corners)) {
      assert.equal(s.solidAt(3 + cx, 4 + cy), corner === name, `${name}: corner ${corner}`);
    }
  }
});

test('a ray meets a 45 degree wall where the geometry says', () => {
  const s = new Slant(DIAGONALS.NE, 0, 0, 0); // line from (1,1) to (0,0)
  const out = [0];
  const t = s.ray(0, 0.5, 1, 0, out); // heading east along y = 0.5
  assert.ok(Math.abs(t - 0.5) < 1e-9, `hits at x = 0.5 (t=${t})`);
  assert.ok(Math.abs(out[0] - 0.5) < 1e-9, 'halfway along the line');
  assert.ok(s.ray(0, 0.5, 0, 1) < 0, 'the crossing is behind a ray heading away (callers ignore it)');
  assert.equal(s.ray(0, 0.5, 1, 1), -1, 'parallel rays never cross');
});

// A 5x5 room whose north-east corner is chamfered.
const chamfer = room(
  ['#######', '#....n#', '#.....#', '#.....#', '#.....#', '#.....#', '#######'],
  ['', '', '', '', '', ' ^'],
  { legend: { '.': FLOOR, n: { ...FLOOR, wall: 'drywall', diagonal: 'NE' } } },
);

test('angled-wall tiles parse as open floor with a slant, and bad lines are errors', () => {
  const b = buildLevel(registry, chamfer);
  assert.deepEqual(b.errors, []);
  const s = b.map.slantAt(5, 1);
  assert.ok(s);
  assert.equal(b.map.blocks(5, 1), false, 'the tile itself is open');
  assert.ok(b.map.solidPoint(5.9, 1.1));
  assert.ok(!b.map.solidPoint(5.1, 1.9));
  const bad = buildLevel(registry, room(['###', '#x#', '###'], [''], { legend: { x: { ...FLOOR, wall: 'drywall', line: [0.5, 0.5, 1, 1] } } }));
  assert.ok(bad.errors.some((e) => e.includes('on the tile edges')));
});

test('rays stop at angled walls from the front and from behind', () => {
  const m = buildLevel(registry, chamfer).map;
  // From the room toward the corner, diagonally: the line x + y = 7 (tile 5,1 is x 5-6, y 1-2).
  const d = Math.SQRT1_2;
  const hit = castRay(m, 3.5, 3.5, d, -d);
  assert.ok(hit.slant, 'hit the angled wall');
  // Point on the line: (3.5 + t d, 3.5 - t d) with x - y = 4 (line through (6,2) and (5,1)).
  const hx = 3.5 + hit.dist * d;
  const hy = 3.5 - hit.dist * d;
  assert.ok(Math.abs(hx - hy - 4) < 1e-6, `on the line (${hx.toFixed(3)}, ${hy.toFixed(3)})`);
  // A triangular block in the open, entered through its solid side.
  const block = buildLevel(registry, room(['#######', '#.....#', '#..n..#', '#.....#', '#######'], [''], { legend: { '.': FLOOR, n: { ...FLOOR, wall: 'drywall', diagonal: 'NE' } } })).map;
  const back = castRay(block, 3.5, 1.2, 0, 1); // heading south into the block's north edge
  assert.ok(back.slant && Math.abs(back.dist - 0.8) < 1e-9, `back face at y = 2 (dist ${back.dist})`);
});

test('the player stops at a chamfered corner and slides along it', () => {
  const w = makeWorld(chamfer);
  const pt = w.player;
  const s = w.map.slantAt(5, 1);
  // Walk diagonally straight into the corner.
  pt.x = 3.5;
  pt.y = 3.5;
  pt.angle = -Math.PI / 4;
  const input = mockInput();
  input.hold('forward');
  run(w, input, 2);
  assert.ok(-s.side(pt.x, pt.y) >= pt.radius - 1e-3, `kept clear of the line (gap ${(-s.side(pt.x, pt.y)).toFixed(3)})`);
  // Walk straight north up the east side: the wall turns you west along it.
  pt.x = 5.6;
  pt.y = 4.5;
  pt.angle = -Math.PI / 2;
  run(w, input, 2);
  assert.ok(pt.y < 2.6, `got up into the corner (y=${pt.y.toFixed(2)})`);
  assert.ok(pt.x < 5.5, `slid west along the wall (x=${pt.x.toFixed(2)})`);
  assert.ok(-s.side(pt.x, pt.y) >= pt.radius - 1e-3, 'still clear of the line');
});

test('projectiles burst on angled walls', () => {
  const w = makeWorld(chamfer, { noMonsters: true });
  const p = w.spawnProjectile('exception-fireball', w.player, -Math.PI / 4, {});
  p.x = 4.5;
  p.y = 2.5;
  let burst = false;
  run(w, mockInput(), 1, () => {
    if (p.state === 'exploding' && !burst) {
      burst = true;
      assert.ok(p.x < 5.9 && p.y > 1.1, `burst before reaching the corner (${p.x.toFixed(2)}, ${p.y.toFixed(2)})`);
    }
  });
  assert.ok(burst, 'it exploded');
});
