import test from 'node:test';
import assert from 'node:assert/strict';
import { makeWorld, mockInput, room, coarse, run } from './helpers.js';

const FLOOR = { floor: 'imp-floor', ceiling: 'imp-ceiling', light: 160 };

// A room whose north-east side is one long angled wall, four coarse tiles of it.
const angled = coarse(
  ['##########', '#...n#####', '#....n####', '#.....n###', '#......n##', '#........#', '#........#', '#........#', '#........#', '##########'],
  ['', '', '', '', '', '', '', '', ' ^'],
  { legend: { '.': FLOOR, n: { ...FLOOR, wall: 'imp-panel', diagonal: 'NE' } } },
);

/**
 * Walk into a wall at 30 degrees off straight on, aiming at (tx, ty), for a
 * second: how far along the wall the player got. `normal` is the angle
 * straight into the wall.
 */
function slideAlong(normal, tx, ty) {
  const w = makeWorld(angled, { noMonsters: true });
  const pt = w.player;
  const a = normal + Math.PI / 6;
  pt.x = tx - Math.cos(a) * 2;
  pt.y = ty - Math.sin(a) * 2;
  pt.angle = a;
  const x = pt.x;
  const y = pt.y;
  const input = mockInput();
  input.hold('forward');
  run(w, input, 1);
  const ux = Math.cos(normal + Math.PI / 2);
  const uy = Math.sin(normal + Math.PI / 2);
  return { along: (pt.x - x) * ux + (pt.y - y) * uy, w };
}

test('the player slides along an angled wall as freely as along a flat one', () => {
  // The flat south wall (y = 18), and the angled wall (normal north-east, through (12, 6)).
  const flat = slideAlong(Math.PI / 2, 8, 17.5).along;
  const { along, w } = slideAlong(-Math.PI / 4, 12 - Math.SQRT1_2 * 0.5, 6 + Math.SQRT1_2 * 0.5);
  assert.ok(flat > 1, `slid along the flat wall (${flat.toFixed(2)})`);
  assert.ok(along > flat * 0.85, `as far along the angled wall (${along.toFixed(2)} against ${flat.toFixed(2)})`);
  const s = w.map.slantAt(10, 4);
  assert.ok(-s.side(w.player.x, w.player.y) >= w.player.radius - 1e-3, 'and kept clear of it');
});

test('walking into a model turned at an angle, the player slides round it', () => {
  const hall = ['##################################', ...Array(14).fill('#................................#'), '##################################'];
  for (const angle of [30, 60]) {
    const w = makeWorld({ ...room(hall, []), list: [{ type: 'player', x: 4.5, y: 8, angle: 0 }] }, { noMonsters: true });
    const block = w.spawn('barricade', 10, 8, (angle * Math.PI) / 180);
    const input = mockInput();
    input.hold('forward');
    run(w, input, 2);
    assert.ok(w.player.x > block.x + 2, `got past the barricade turned ${angle} degrees (x ${w.player.x.toFixed(2)})`);
  }
});
