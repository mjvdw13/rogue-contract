import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLevel } from '../src/engine/world/level.js';
import { castRay, traceRay3D, lineOfSight3D, blockedByMap } from '../src/engine/world/physics.js';
import { Slant, DIAGONALS } from '../src/engine/world/slants.js';
import { makeWorld, mockInput, room, coarse, run, registry, headlessRenderer } from './helpers.js';

const FLOOR = { floor: 'imp-floor', ceiling: 'imp-ceiling', light: 160 };

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
const chamferTiles = ['#######', '#....n#', '#.....#', '#.....#', '#.....#', '#.....#', '#######'];
const chamferThings = ['', '', '', '', '', ' ^'];
const chamferExtra = { legend: { '.': FLOOR, n: { ...FLOOR, wall: 'imp-panel', diagonal: 'NE' } } };
const chamfer = room(chamferTiles, chamferThings, chamferExtra);

test('angled-wall tiles parse as open floor with a slant, and bad lines are errors', () => {
  const b = buildLevel(registry, chamfer);
  assert.deepEqual(b.errors, []);
  const s = b.map.slantAt(5, 1);
  assert.ok(s);
  assert.equal(b.map.blocks(5, 1), false, 'the tile itself is open');
  assert.ok(b.map.solidPoint(5.9, 1.1));
  assert.ok(!b.map.solidPoint(5.1, 1.9));
  const bad = buildLevel(registry, room(['###', '#x#', '###'], [''], { legend: { x: { ...FLOOR, wall: 'imp-panel', line: [0.5, 0.5, 1, 1] } } }));
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
  const block = buildLevel(registry, room(['#######', '#.....#', '#..n..#', '#.....#', '#######'], [''], { legend: { '.': FLOOR, n: { ...FLOOR, wall: 'imp-panel', diagonal: 'NE' } } })).map;
  const back = castRay(block, 3.5, 1.2, 0, 1); // heading south into the block's north edge
  assert.ok(back.slant && Math.abs(back.dist - 0.8) < 1e-9, `back face at y = 2 (dist ${back.dist})`);
});

test('the player stops at a chamfered corner and slides along it', () => {
  // The same room upscaled to the real grid, so the player (radius 0.5) fits:
  // the corner's angled wall now runs through tiles (10, 2) and (11, 3).
  const w = makeWorld(coarse(chamferTiles, chamferThings, chamferExtra));
  const pt = w.player;
  const s = w.map.slantAt(10, 2);
  // Walk diagonally straight into the corner.
  pt.x = 7;
  pt.y = 7;
  pt.angle = -Math.PI / 4;
  const input = mockInput();
  input.hold('forward');
  run(w, input, 2);
  assert.ok(-s.side(pt.x, pt.y) >= pt.radius - 1e-3, `kept clear of the line (gap ${(-s.side(pt.x, pt.y)).toFixed(3)})`);
  // Walk straight north up the east side: the wall turns you west along it.
  pt.x = 11.2;
  pt.y = 9;
  pt.angle = -Math.PI / 2;
  run(w, input, 2);
  assert.ok(pt.y < 5.2, `got up into the corner (y=${pt.y.toFixed(2)})`);
  assert.ok(pt.x < 11, `slid west along the wall (x=${pt.x.toFixed(2)})`);
  assert.ok(-s.side(pt.x, pt.y) >= pt.radius - 1e-3, 'still clear of the line');
});

test('projectiles burst on angled walls', () => {
  const w = makeWorld(chamfer, { noMonsters: true });
  const p = w.spawnProjectile('trooper-bolt', w.player, -Math.PI / 4, {});
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

// ------------------------------------------------------------ low angled walls

const { renderer, shot } = await headlessRenderer();
const OPEN = { floor: 'desert-sand', ceiling: 'sky', ceilZ: 8, light: 176 };
/**
 * A yard under the sky with a tall block at each end, and (with `wallTop`) a
 * low angled wall across the middle, solid on its east half. The rows above
 * the horizon, looking along `angle` from (x, 2.5).
 */
function overWall(wallTop, x, angle) {
  const row = (m) => `#BB....${m}....BB#`;
  const level = room(['#'.repeat(17), row('.'), row('.'), row(wallTop ? 's' : '.'), row('.'), row('.'), '#'.repeat(17)], [], {
    legend: {
      '.': OPEN,
      B: { ...OPEN, floorZ: 5 },
      s: { ...OPEN, wall: 'imp-panel', line: [0.5, 1, 0.5, 0], wallTop },
    },
    sky: 'sky-night',
  });
  const px = shot(level, { x, y: 3.5, angle, z: 1.25 });
  return px.subarray(0, renderer.surface.w * (renderer.surface.h / 2 - 4));
}

test('an angled wall can stop short of the sky, and the view goes on over it from the front and from behind', () => {
  // Without a wall, the far block shows above the horizon.
  assert.deepEqual(overWall(0.75, 3.5, 0), overWall(undefined, 3.5, 0), 'from the front (west), the far block shows over it');
  assert.deepEqual(overWall(0.75, 13.5, Math.PI), overWall(undefined, 13.5, Math.PI), 'from behind (east), its back stands no taller than its top');
});

test('"wallTop" must lie between the floor and the ceiling, on an angled wall', () => {
  const tile = (extra) => buildLevel(registry, room(['####', '#x.#', '####'], ['', '  ^'], { legend: { '.': OPEN, x: { ...OPEN, ...extra } } })).errors;
  assert.deepEqual(tile({ wall: 'imp-panel', diagonal: 'NE', wallTop: 3 }), []);
  assert.ok(tile({ wall: 'imp-panel', diagonal: 'NE', wallTop: 9 }).some((e) => e.includes('wallTop')), 'above the ceiling');
  assert.ok(tile({ wall: 'imp-panel', diagonal: 'NE', wallTop: 0 }).some((e) => e.includes('wallTop')), 'at the floor');
  assert.ok(tile({ wallTop: 3 }).some((e) => e.includes('only for angled walls')), 'on open floor');
});

/**
 * A pit's rim, as a round pit's is built: the west of the yard is a pit 4
 * deep (floor -3), the east ground at 1, and between them a column of
 * angled-wall tiles at x 7, solid on their east half, whose wall stops at
 * the ground's height (`wallTop` 1). `rim` swaps those tiles for others.
 */
function rimLevel({ rim, things = [''] } = {}) {
  const row = (m) => `#pppppp${m}gggggg#`;
  return room(['#'.repeat(15), row('s'), row('s'), row('s'), row('s'), row('s'), '#'.repeat(15)], things, {
    legend: {
      p: { ...OPEN, floorZ: -3 },
      g: { ...OPEN, floorZ: 1 },
      s: rim ?? { ...OPEN, floorZ: -3, wall: 'imp-panel', line: [0.5, 1, 0.5, 0], wallTop: 1 },
    },
    sky: 'sky-night',
  });
}

test('a shot passes over a low angled wall above its top, comes down on its top, and stops at its face below it', () => {
  const m = buildLevel(registry, rimLevel()).map;
  // West from the ground, level at 2: over the rim and the pit to the far wall.
  const over = traceRay3D(m, 11.5, 3.5, 2, -1, 0, 0);
  assert.ok(over.hit === 'wall' && Math.abs(over.dist - 10.5) < 1e-6, `reached the far wall (${over.hit} at ${over.dist})`);
  // Coming down: over the ground's edge at x 8 (z 1.1), onto the wall's top at x 7.9.
  const down = traceRay3D(m, 8.4, 3.5, 1.5, -1, 0, -1);
  assert.ok(down.hit === 'floor' && Math.abs(down.dist - 0.5) < 1e-6, `landed on its top (${down.hit} at ${down.dist})`);
  // East from down in the pit: its face, at x 7.5.
  const face = traceRay3D(m, 3.5, 3.5, -1.75, 1, 0, 0);
  assert.ok(face.hit === 'wall' && Math.abs(face.dist - 4) < 1e-6, `stopped at the face (${face.hit} at ${face.dist})`);
});

test("someone on a pit's rim sees down into it over the rim's low angled walls, but not through them from below", () => {
  const m = buildLevel(registry, rimLevel()).map;
  assert.ok(lineOfSight3D(m, 8.5, 3.5, 2.25, 3.5, 3.5, -2.5), "from the rim's edge to the pit floor");
  assert.ok(!lineOfSight3D(m, 3.5, 3.5, -1.75, 11.5, 3.5, 2.25), 'from the pit up through the wall to the ground beyond');
});

test("a body at a low angled wall's top stands on it and walks off it into the pit; below its top the wall stops it", () => {
  const m = buildLevel(registry, rimLevel()).map;
  assert.ok(!blockedByMap(m, 8.2, 3.5, 0.5, 1), 'feet at its top: over it');
  assert.ok(blockedByMap(m, 8.2, 3.5, 0.5, 0.5), 'feet below its top: against it');
  assert.ok(blockedByMap(m, 8.2, 3.5, 0.5), 'no height given: every angled wall blocks, as before');
  assert.equal(m.floorAt(8.4, 3.5, 0.5, 1.8), 1, 'over its solid half, its top is the floor');
  assert.equal(m.floorAt(8.4, 3.5, 0.5, 0.8), 1, 'the ground beside it, when its top is out of reach');
  assert.equal(m.floorAt(7.1, 3.5, 0.3, 1.8), -3, 'past its line, the pit');
  // Walking west off the ground: over the rim and down into the pit.
  const w = makeWorld(rimLevel({ things: ['', '', '', '           <'] }), { noMonsters: true });
  const pt = w.player;
  const input = mockInput();
  input.hold('forward');
  run(w, input, 1.5);
  assert.ok(pt.x < 7.5 && Math.abs(pt.z + 3) < 1e-6, `fell into the pit (${pt.x.toFixed(2)}, z ${pt.z.toFixed(2)})`);
  // And back east: the wall stops the body below its top.
  pt.angle = 0;
  run(w, input, 1.5);
  assert.ok(pt.x <= 7.5 - pt.radius + 1e-3, `stopped at the wall (x ${pt.x.toFixed(3)})`);
});

test("seen from above, a low angled wall's top is drawn as ground, with no wall over it", () => {
  // A wall nearly on the tile's west edge is all solid top: from the ground
  // looking down across it, it draws as the ground would (no pit floor
  // through it, no step up from the pit's floor at its far edge).
  const cam = { x: 12.5, y: 3.5, angle: Math.PI, z: 4.25 };
  const low = shot(rimLevel({ rim: { ...OPEN, floorZ: -3, wall: 'imp-panel', line: [0.02, 1, 0.02, 0], wallTop: 1 } }), cam);
  const ground = shot(rimLevel({ rim: { ...OPEN, floorZ: 1 } }), cam);
  let differ = 0;
  for (let i = 0; i < low.length; i++) if (low[i] !== ground[i]) differ++;
  assert.ok(differ < low.length * 0.005, `${differ} of ${low.length} pixels differ`);
});

/**
 * A yard with a wall across it, north to south, solid on its east half, its
 * texture starting `wallU` along; the view looking east at it from (3.5, 3.5).
 */
function wallAlong(wallU) {
  const row = (m) => `#.......${m}.......#`;
  const level = room(['#'.repeat(17), ...Array.from({ length: 5 }, () => row('s')), '#'.repeat(17)], [], {
    legend: { '.': OPEN, s: { ...OPEN, wall: 'imp-panel', line: [0.5, 1, 0.5, 0], wallU } },
    sky: 'sky-night',
  });
  return shot(level, { x: 3.5, y: 3.5, angle: 0, z: 1.25 });
}

test('an angled wall\'s texture starts where its "wallU" says, so it can run on round a curve', () => {
  // imp-panel is 64 texels wide: it repeats every 2 tiles.
  assert.deepEqual(wallAlong(2), wallAlong(undefined), 'a whole texture along looks the same');
  assert.notDeepEqual(wallAlong(0.5), wallAlong(undefined), 'half a tile along moves the texture');
  const tile = (extra) => buildLevel(registry, room(['####', '#x.#', '####'], ['', '  ^'], { legend: { '.': OPEN, x: { ...OPEN, ...extra } } })).errors;
  assert.deepEqual(tile({ wall: 'imp-panel', diagonal: 'NE', wallU: 1.5 }), []);
  assert.ok(tile({ wall: 'imp-panel', diagonal: 'NE', wallU: 'far' }).some((e) => e.includes('wallU')), 'not a number');
  assert.ok(tile({ wallU: 1 }).some((e) => e.includes('only for angled walls')), 'on open floor');
});
