import test from 'node:test';
import assert from 'node:assert/strict';
import { Painter } from '../src/content/levels/lib/painter.js';
import { Town } from '../src/content/levels/lib/town.js';
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
  const drift = (y) => Array.from({ length: 28 }, (_, k) => p.get(6 + k, y)).filter((c) => c.floor === 'street-drift');
  assert.ok(drift(10).length > 0, 'beside the wall');
  assert.equal(drift(30).length, 0, 'out in the open');
  assert.ok(drift(10).every((c) => c.light >= town.light), 'only in full sun');
});
