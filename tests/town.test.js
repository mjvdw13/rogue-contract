import test from 'node:test';
import assert from 'node:assert/strict';
import { Painter } from '../src/content/levels/lib/painter.js';
import { Town } from '../src/content/levels/lib/town.js';
import { buildLevel } from '../src/engine/world/level.js';
import { registry } from './helpers.js';

// The town kit (Mos Eisley): domes on the roofs, skirts on the walls, sand drifts.

function kit() {
  const p = new Painter(40, 40, { wall: 'adobe' });
  const town = new Town(p, { sky: 24 });
  p.rect(1, 1, 39, 39, town.street());
  return { p, town };
}

test('a house with a dome is topped by the widest dome that fits its top storey, with a rim of roof', () => {
  const { town } = kit();
  town.house(4, 4, 16, 14, { h: 6, r: 2, tiers: [{ box: [6, 6, 14, 14], h: 9 }], dome: true });
  assert.equal(town.things.length, 1);
  const d = town.things[0];
  assert.deepEqual([d.x, d.y, d.z], [10, 10, 9]);
  const deco = registry.things.get(d.type);
  assert.ok(deco, `${d.type} is a decoration`);
  assert.ok(deco.radius * 2 <= 8 - 1 && deco.radius * 2 > 8 - 3, `${d.type} fits the 8-wide storey with a rim`);
});

test("a dome is in the house's plaster unless it names another", () => {
  const { town } = kit();
  town.house(4, 4, 12, 12, { h: 6, wall: 'adobe-pale', dome: true });
  town.house(20, 4, 28, 12, { h: 6, wall: 'adobe-pale', dome: 'adobe' });
  assert.match(town.things[0].type, /-pale$/);
  assert.doesNotMatch(town.things[1].type, /-pale$/);
});

test('a dome casts a shadow', () => {
  const light = (withDome) => {
    const { p, town } = kit();
    town.house(14, 14, 26, 26, { h: 2, dome: withDome });
    town.finish();
    let sum = 0;
    for (let y = 0; y < 40; y++) for (let x = 0; x < 40; x++) sum += p.get(x, y).light ?? 0;
    return sum;
  };
  assert.ok(light(true) < light(false));
});

test('a roof too small for any dome gets none', () => {
  const { town } = kit();
  town.house(4, 4, 8, 8, { h: 6, dome: true });
  assert.equal(town.things.length, 0);
});

test("a building's walls, straight and rounded, have the skirt at their foot", () => {
  const { p, town } = kit();
  town.house(4, 4, 16, 14, { h: 6, r: 3 });
  town.circle(28, 28, 5, { inside: town.roofCell({ h: 5 }), wall: { wall: 'adobe', wallTop: 5 }, open: 'out' });
  const skirt = (c) => c.bands?.some((b) => b.tex === 'adobe-skirt');
  assert.ok(skirt(p.get(10, 4)), 'a straight wall');
  const arcs = [];
  for (let y = 0; y < 40; y++) for (let x = 0; x < 40; x++) if (p.get(x, y).line) arcs.push(p.get(x, y));
  assert.ok(arcs.length > 0 && arcs.every(skirt), 'every rounded corner and round wall');
  assert.ok(!skirt(p.get(20, 20)), 'not the street');
});

test('sand drifts lie along the walls in the sun, not in the open or the shade', () => {
  const { p, town } = kit();
  town.house(4, 4, 36, 10, { h: 2 });
  town.finish();
  town.drifts();
  const drift = (y) => Array.from({ length: 28 }, (_, k) => p.get(6 + k, y)).filter((c) => c.floor.startsWith('street-drift'));
  assert.ok(drift(10).length > 0, 'beside the wall');
  assert.equal(drift(30).length, 0, 'out in the open');
  assert.ok(drift(10).every((c) => c.light >= town.light), 'only in full sun');
});

test("a drift's edge tiles agree with their neighbours at every corner they share", () => {
  const { p, town } = kit();
  town.house(4, 4, 36, 10, { h: 2 });
  town.house(14, 20, 26, 30, { h: 3 });
  town.finish();
  town.drifts();
  // A tile's corners as drift bits (NW 1, NE 2, SE 4, SW 8), from its floor.
  const bits = ({ floor = '' }) => (floor === 'street-drift' ? 15 : floor.startsWith('street-drift-') ? Number(floor.slice(13)) : floor === 'street-sand' ? 0 : null);
  let edges = 0;
  for (let y = 1; y < 39; y++) {
    for (let x = 1; x < 39; x++) {
      const a = bits(p.get(x, y));
      if (a === null) continue;
      if (a > 0 && a < 15) edges++;
      const east = bits(p.get(x + 1, y));
      const south = bits(p.get(x, y + 1));
      if (east !== null) assert.equal(((a >> 1) & 1) | (((a >> 2) & 1) << 1), (east & 1) | (((east >> 3) & 1) << 1), `(${x}, ${y}) and east`);
      if (south !== null) assert.equal(((a >> 3) & 1) | (((a >> 2) & 1) << 1), (south & 1) | (((south >> 1) & 1) << 1), `(${x}, ${y}) and south`);
    }
  }
  assert.ok(edges > 0, 'some tiles are edges');
});

test('buildings pick their skirt, or none', () => {
  const { p, town } = kit();
  town.house(4, 4, 10, 10, { h: 4, skirt: 'plinth' });
  town.house(14, 4, 20, 10, { h: 4, skirt: null });
  town.house(24, 4, 30, 10, { h: 4 });
  assert.equal(p.get(6, 4).bands[0].tex, 'adobe-brick');
  assert.equal(p.get(16, 4).bands, undefined);
  assert.equal(p.get(26, 4).bands[0].tex, 'adobe-skirt', "the town's own");
  assert.throws(() => town.house(4, 20, 10, 26, { h: 4, skirt: 'gold' }), /no skirt "gold"/);
});

test('a door is set into its wall: a recess, the door on its back wall and a step outside', () => {
  const { p, town } = kit();
  town.house(4, 4, 16, 14, { h: 6 });
  town.door(10, 14, 'S', { h: 6, tex: 'door-teal' });
  // The recess: open below the lintel, a slab up to the roof.
  for (const x of [9, 10]) assert.equal(p.get(x, 13).floorZ, 0);
  assert.equal(p.get(9, 13).slab.bottom, 3);
  assert.equal(p.get(8, 13).floorZ, 6, 'wall beside it');
  // The door: on the recess's back wall (the edge at row 13), looking south, standing on the floor.
  assert.deepEqual(town.decals, [{ x: 10, y: 13, z: 1.5, face: 'S', tex: 'door-teal' }]);
  assert.equal(p.get(9, 14).floor, 'flagstone', 'a step outside');
  // Built into a level, the door is laid on that face.
  const level = { id: 't', name: 'T', ...p.build(), decals: town.decals, list: [{ type: 'player', x: 20, y: 20 }] };
  const { map, errors } = buildLevel(registry, level);
  assert.deepEqual(errors, []);
  assert.equal(map.decals.length, 1);
});

test('a window is set into its wall: a notch with a sill and a lintel, the window on its back wall', () => {
  const { p, town } = kit();
  town.house(4, 4, 16, 14, { h: 6, wall: 'adobe-pale', skirt: 'plinth', tiers: [{ box: [6, 4, 14, 10], h: 10 }] });
  town.window(10.5, 14, 'S', { z: 3, tex: 'window-louvre' });
  const c = p.get(10, 13);
  assert.equal(c.floorZ, 2.375, 'the sill');
  assert.deepEqual([c.slab.bottom, c.slab.top, c.slab.side], [3.625, 6, 'adobe-pale'], 'the lintel, up to the roof');
  assert.equal(c.bands[0].tex, 'adobe-brick', 'the skirt goes on under it');
  assert.equal(p.get(11, 13).floorZ, 6, 'the wall beside it');
  assert.deepEqual(town.decals[0], { x: 10.5, y: 13, z: 3, face: 'S', tex: 'window-louvre' });
  // On the upper storey, up to its own roof.
  town.window(10.5, 10, 'S', { z: 8 });
  assert.equal(p.get(10, 9).slab.top, 10);
  assert.throws(() => town.window(7.5, 14, 'S', { z: 9 }), /no wall/, 'not above the roof');
});
