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

test('a building with a slanting side stands an angled wall along it, its roof inside and the street outside', () => {
  const { p, town } = kit();
  town.slanted([[4, 4], [16, 4], [16, 10], [4, 14]], { h: 6 });
  assert.equal(p.get(10, 6).floorZ, 6, 'roof inside');
  assert.equal(p.get(10, 13).floorZ, 0, 'street outside');
  assert.equal(p.get(17, 6).floorZ, 0, 'street past its straight side');
  const lines = [];
  for (let y = 0; y < 40; y++) for (let x = 0; x < 40; x++) if (p.get(x, y).line) lines.push([x, y, p.get(x, y)]);
  assert.ok(lines.length >= 12, 'every tile along the slant');
  for (const [x, y, c] of lines) {
    assert.equal(c.wallTop, 6);
    assert.equal(c.floorZ, 0, 'the open side is the street');
    // The solid side is on the right going along the line (y down): into the building, up and left.
    const [ax, ay, bx, by] = c.line;
    const mid = [x + (ax + bx) / 2, y + (ay + by) / 2];
    const right = [-(by - ay), bx - ax];
    assert.ok(right[1] < 0, `the wall at (${x}, ${y}) faces the street`);
    assert.ok(mid[1] < 10 + ((16 - mid[0]) * 4) / 12 + 0.01 && mid[1] > 10 + ((16 - mid[0]) * 4) / 12 - 0.01, 'on the slant');
  }
});

test("a slanting front's plaster runs on along it, and grime weathers it", () => {
  const { p, town } = kit();
  town.slanted([[4, 4], [16, 4], [16, 10], [4, 14]], { h: 6 });
  town.finish().grime({ amount: 2 });
  const us = [];
  for (let x = 4; x < 16; x++) for (let y = 4; y < 15; y++) if (p.get(x, y).line) us.push(p.get(x, y).wallU);
  assert.equal(new Set(us).size, us.length, 'each tile starts its texture somewhere else along the side');
  assert.ok(Math.max(...us) > 11, "up to the side's length (12.6)");
  const angled = town.decals.filter((d) => d.face === 'angled');
  assert.ok(angled.length > 0, 'grime on the slant');
  for (const d of angled) assert.ok(Math.abs(d.y - (10 + ((16 - d.x) * 4) / 12)) < 0.02, `(${d.x}, ${d.y}) is on the slant`);
});

test('two slanting sides through one tile are an error', () => {
  const { town } = kit();
  assert.throws(() => town.slanted([[13, 5], [11, 8], [10, 6]], { h: 6 }), /two slanting walls/);
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

test('a door is set into its wall: a recess lined with tiles, a locked rising door in it and a step outside', () => {
  const { p, town } = kit();
  town.house(4, 4, 16, 14, { h: 6 });
  town.door(10, 14, 'S', { h: 6, tex: 'door-grey' });
  // The recess: open below the lintel (the door's top), a slab up to the roof.
  for (const x of [9, 10]) assert.equal(p.get(x, 13).floorZ, 0);
  assert.equal(p.get(9, 13).slab.bottom, 3);
  assert.equal(p.get(8, 13).floorZ, 6, 'wall beside it');
  // The recess's tiles are a rising door, locked: nothing is behind it.
  for (const x of [9, 10]) assert.deepEqual([p.get(x, 13).door, p.get(x, 13).style, p.get(x, 13).lock], ['door-grey-rising', 'rise', 'remote']);
  // The sign over the opening and the controls beside it, on the wall's face (row 14).
  const [sign, panel] = town.decals;
  assert.deepEqual([sign.tex, sign.y, sign.x], ['door-sign', 14, 10]);
  assert.ok(sign.z > 3, 'over the opening');
  assert.deepEqual([panel.tex, panel.y], ['door-panel', 14]);
  assert.ok(panel.x > 11, 'beside the opening');
  // The jamb: in the recess, turned to face the street, its bevelled corners on the wall's face.
  assert.deepEqual(town.things.map((t) => [t.type, t.x, t.y, t.angle]), [['door-jamb', 10, 13.5, 0], ['door-lips', 10, 14, 0], ['door-lips-foot-dirt', 10, 14, 0]]);
  assert.equal(p.get(9, 14).floor, 'flagstone', 'a step outside');
  // Built into a level, the door, sign and controls are all laid on faces.
  const level = { id: 't', name: 'T', ...p.build(), decals: town.decals, list: [{ type: 'player', x: 20, y: 20 }, ...town.things] };
  const { map, errors } = buildLevel(registry, level);
  assert.deepEqual(errors, []);
  assert.equal(map.decals.length, 2);
  assert.equal(map.doorAt(9, 13).lock, 'remote');
});

test('a door turns its jamb to face its wall', () => {
  const { town } = kit();
  town.house(4, 4, 16, 14, { h: 6 });
  town.door(10, 4, 'N', { h: 6 }).door(4, 9, 'W', { h: 6 }).door(16, 9, 'E', { h: 6 });
  const jambs = () => town.things.filter((t) => t.type === 'door-jamb');
  assert.deepEqual(jambs().map((t) => [t.x, t.y, t.angle]), [[10, 4.5, 180], [4.5, 9, 270], [15.5, 9, 90]]);
});

test('a door that opens stands halfway through a 1-tile wall into the room behind, under the roof', () => {
  const { p, town } = kit();
  town.house(4, 4, 16, 14, { h: 6 });
  town.room(6, 6, 14, 13, { h: 6 });
  town.door(10, 14, 'S', { h: 6, opens: true }).finish();
  // The wall's tiles at the opening (row 13) are a rising door with the wall over it as a slab.
  for (const x of [9, 10]) {
    const c = p.get(x, 13);
    assert.deepEqual([c.door, c.style, c.slab.bottom, c.slab.top, c.ceiling], ['door-red-rising', 'rise', 3, 6, 'sky']);
  }
  assert.equal(p.get(9, 14).ceilZ, 24, "the street's sky in front isn't brought down to the roof");
  // No picture on a back wall; the jamb in the middle of the wall, its bevelled corners on both faces.
  assert.ok(!town.decals.some((d) => d.tex === 'door-red'));
  assert.deepEqual(town.things.map((t) => [t.type, t.y, t.angle]), [
    ['door-jamb', 13.5, 0], ['door-lips', 14, 0], ['door-lips-foot-dirt', 14, 0], ['door-lips', 13, 180], ['door-lips-foot-dirt', 13, 180],
  ]);
  const level = { id: 't', name: 'T', ...p.build(), decals: town.decals, list: [{ type: 'player', x: 20, y: 20 }, ...town.things] };
  const { map, errors } = buildLevel(registry, level);
  assert.deepEqual(errors, []);
  const d = map.doorAt(9, 13);
  assert.deepEqual([d.axis, d.plane, d.openZ, d.group.length], ['y', 13.5, 3, 2]);
});

test("a door's bevelled corners are in the wall's plaster, the bottom ones in its skirt, lit as the wall is", () => {
  const { p, town } = kit();
  town.house(4, 4, 16, 14, { h: 6, wall: 'adobe-pale', skirt: 'plinth' });
  town.house(20, 4, 30, 14, { h: 6, wall: 'metal-grey', skirt: null });
  town.door(10, 14, 'S', { h: 6, wall: 'adobe-pale' }).door(25, 14, 'S', { h: 6, wall: 'metal-grey' }).finish();
  const lips = town.things.filter((t) => t.type.startsWith('door-lips'));
  assert.deepEqual(lips.map((t) => t.type), ['door-lips-pale', 'door-lips-foot-plinth', 'door-lips-metal', 'door-lips-foot-metal']);
  for (const t of lips) assert.ok(registry.things.get(t.type), `${t.type} is a decoration`);
  // (Every face flat: the renderer lights it as the wall round it.)
  assert.ok(lips.every((t) => registry.models.get(t.type).faces.every((f) => f.flat)), 'lit as the wall');
  const level = { id: 't', name: 'T', ...p.build(), decals: town.decals, list: [{ type: 'player', x: 20, y: 20 }, ...town.things] };
  assert.deepEqual(buildLevel(registry, level).errors, []);
});

test('a door that opens needs a room behind its wall', () => {
  const { town } = kit();
  town.house(4, 4, 16, 14, { h: 6 });
  assert.throws(() => town.door(10, 14, 'S', { h: 6, opens: true }), /needs a room behind it/);
});

test('a round-topped door has its opening rounded over the panel, and no jamb', () => {
  const { p, town } = kit();
  town.house(4, 4, 16, 14, { h: 6, wall: 'adobe-pale' });
  town.door(10.5, 14, 'S', { h: 6, tex: 'door-planks', width: 3, tall: 4, wall: 'adobe-pale', jamb: false, sign: false, panel: false, round: true });
  for (const x of [9, 10, 11]) assert.deepEqual([p.get(x, 13).door, p.get(x, 13).slab.bottom], ['door-planks-rising', 4]);
  // One rounded arch on the opening's face, a tile through: it covers the panel's corners.
  assert.deepEqual(town.things.map((t) => [t.type, t.x, t.y, t.angle]), [['arch-round-3-pale', 10.5, 14, 0]]);
  assert.throws(() => town.door(6, 4, 'N', { h: 6, round: true }), /can't have a jamb/);
  const level = { id: 't', name: 'T', ...p.build(), decals: town.decals, list: [{ type: 'player', x: 20, y: 20 }, ...town.things] };
  assert.deepEqual(buildLevel(registry, level).errors, []);
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

test("indoor grime dirties a room's walls from its floor to its ceiling, not an alcove's open mouth or the outside", () => {
  const build = () => {
    const { town } = kit();
    town.house(4, 4, 16, 14, { h: 6 });
    // A room 4 high, and an alcove off its south side, 3 high: open into it.
    town.room(6, 6, 14, 12, { h: 6, ceilZ: 4 }).room(10, 12, 13, 13, { h: 6, ceilZ: 3 });
    town.finish().grimeIndoors(0, 0, 40, 40, { amount: 2 });
    return town.decals;
  };
  const grime = build();
  assert.ok(grime.length > 10, `${grime.length} pieces`);
  assert.ok(grime.every((d) => d.tex.startsWith('grime-')));
  for (const d of grime) {
    assert.ok(d.z > 0 && d.z < 4, `between the room's floor and ceiling: ${JSON.stringify(d)}`);
    const inRoom = d.x >= 6 && d.x <= 14 && d.y >= 6 && d.y <= 13;
    assert.ok(inRoom, `on the room's walls, not the house's outside: ${JSON.stringify(d)}`);
  }
  assert.ok(!grime.some((d) => d.face === 'N' && d.y === 12 && d.x > 10 && d.x < 13), "none across the alcove's mouth");
  assert.ok(grime.some((d) => d.face === 'N' && d.y === 13 && d.x > 10 && d.x < 13), "the alcove's own back wall, though");
  assert.deepEqual(build(), grime, 'the same every time');
});

test("grime weathers a house's straight walls and the wall under its window, not its rounded corners or a clean house", () => {
  const { p, town } = kit();
  town.house(4, 4, 16, 14, { h: 6, r: 2 });
  town.window(10.5, 14, 'S', { z: 3 });
  town.house(20, 4, 32, 14, { h: 6, grime: 0 });
  town.finish();
  town.grime({ amount: 2 });
  const grime = town.decals.filter((d) => d.tex.startsWith('grime-'));
  assert.ok(grime.length > 4, `${grime.length} pieces`);
  for (const d of grime) {
    // On the first house's straight walls (each rounded corner takes its end tile).
    const ok = (d.face === 'S' && d.y === 14) || (d.face === 'N' && d.y === 4) ? d.x > 5 && d.x < 15 : (d.face === 'W' && d.x === 4) || (d.face === 'E' && d.x === 16) ? d.y > 5 && d.y < 13 : false;
    assert.ok(ok, `on a straight wall: ${JSON.stringify(d)}`);
  }
  const drip = grime.find((d) => d.tex.startsWith('grime-drip'));
  assert.ok(drip && drip.y === 14 && drip.z < 2.375, 'a drip under the sill');
  assert.equal(town.decals.at(-1).tex, 'window-bars', 'the window is drawn over the grime');
  const level = { id: 't', name: 'T', ...p.build(), decals: town.decals, list: [{ type: 'player', x: 20, y: 20 }, ...town.things] };
  assert.deepEqual(buildLevel(registry, level).errors, []);
});

test('an awning shades the street under it and stands its cloth, ends and poles along its front', () => {
  const { p, town } = kit();
  town.house(4, 4, 16, 10, { h: 6 });
  town.awning(6, 10, 14, 12, { z: 3.25, face: 'S', cloth: 'teal' });
  const c = p.get(8, 11);
  assert.equal(c.slab.bottom, 3.25, 'you walk under it');
  assert.ok(c.slab.light < c.light, 'in its shade');
  const types = town.things.map((t) => t.type);
  assert.equal(types.filter((t) => t === 'awning-teal-2').length, 4, 'a bay every 2 tiles of its 8');
  assert.equal(types.filter((t) => t === 'awning-teal-2-end').length, 2);
  const poles = town.things.filter((t) => t.type.startsWith('awning-pole'));
  assert.ok(poles.length >= 2 && poles.every((t) => t.y > 11 && t.y < 12), 'poles under its front');
  for (const t of town.things) assert.ok(registry.things.get(t.type), `${t.type} is a decoration`);
  assert.equal(town.hangings.length, 0, 'a fixed fringe, not a hanging');
});

test("an awning's valance can sway: bare bays, and a cloth hanging along its front", () => {
  const { town } = kit();
  town.house(4, 4, 10, 16, { h: 6 });
  town.awning(10, 6, 13, 14, { z: 3.5, face: 'E', cloth: 'red', valance: 'valance-red' });
  assert.ok(town.things.some((t) => t.type === 'awning-red-3-bare'));
  assert.equal(town.hangings.length, 1);
  const h = town.hangings[0];
  assert.equal(h.type, 'valance-red');
  assert.ok(h.from[0] > 13 && h.to[0] > 13, 'just in front of its front edge');
});

test('an awning of a size or height there are no models for is an error', () => {
  const { town } = kit();
  assert.throws(() => town.awning(6, 10, 13, 12, { z: 3.25 }), /even number/);
  assert.throws(() => town.awning(6, 10, 14, 14, { z: 3.25 }), /deep/);
  assert.throws(() => town.awning(6, 10, 14, 12, { z: 3.3 }), /quarter/);
});

test('a tarp is a cloth tied at four corners on poles, shading the ground under it but lit itself', () => {
  const { p, town } = kit();
  town.tarp(10, 10, 14, 14, { z: 2.75, face: 'W', rise: 0.5, cloth: 'red' });
  town.finish();
  assert.equal(town.hangings.length, 1);
  const h = town.hangings[0];
  assert.equal(h.type, 'tarp-red');
  assert.equal(h.pin, 'corners');
  assert.ok(h.from[2] > h.from[2] + h.out[2], 'its back edge is higher');
  assert.ok(h.out[0] < 0, 'its front looks west');
  assert.equal(town.things.filter((t) => t.type.startsWith('awning-pole')).length, 4);
  assert.ok(p.get(12, 12).light < town.light, 'the ground under it is in its shade');
  assert.equal(h.light, town.light, 'the cloth is in the sun');
});

test('a lean-to gets tin sheets along its front, an end at each side, and its shadow grows', () => {
  const light = (tin) => {
    const { p, town } = kit();
    town.house(4, 4, 16, 8, { h: 4 });
    if (tin) town.leanTo(4, 4, 16, 8, { h: 4, face: 'S', seed: 3 });
    town.finish();
    let sum = 0;
    for (let y = 0; y < 40; y++) for (let x = 0; x < 40; x++) sum += p.get(x, y).light ?? 0;
    return { sum, town };
  };
  const { sum, town } = light(true);
  const sheets = town.things.filter((t) => /^tin-\w+-4$/.test(t.type));
  const ends = town.things.filter((t) => t.type.endsWith('-end'));
  assert.equal(sheets.length, 6, 'a sheet every 2 tiles of its 12');
  assert.equal(ends.length, 2);
  assert.ok(sheets.every((t) => t.y === 8 && t.z >= 4), 'on its roof, along its front');
  for (const t of town.things) assert.ok(registry.things.get(t.type), `${t.type} is a decoration`);
  assert.ok(sum < light(false).sum, 'the tin shades a little more of the street');
});

test('an awning rising above the wall behind it is an error', () => {
  const { town } = kit();
  town.house(4, 4, 16, 10, { h: 4 });
  assert.throws(() => town.awning(6, 10, 14, 13, { z: 3.25, face: 'S' }), /above the wall behind it/);
});

test("a downpipe is as tall as its wall, and wall fixtures turn to face their wall, a hair out from it", () => {
  const { town } = kit();
  town.house(4, 4, 16, 10, { h: 6 });
  town.house(20, 4, 26, 12, { h: 4 });
  town.pipe(8.5, 10, 'S').pipe(26, 7, 'E').fixture('wall-tank', 4, 7, 'W', { z: 3 });
  const [a, b, tank] = town.things;
  assert.equal(a.type, 'pipe-6');
  assert.equal(b.type, 'pipe-4');
  assert.deepEqual([a.angle, b.angle, tank.angle], [0, 90, 270]);
  assert.ok(a.y > 10 && b.x > 26 && tank.x < 4, 'out on the street side of the wall');
  assert.equal(tank.z, 3);
  for (const t of town.things) assert.ok(registry.things.get(t.type), `${t.type} is a decoration`);
  assert.throws(() => town.pipe(30.5, 20, 'S'), /no wall for a downpipe/);
});

test('a vent is a decal on the wall', () => {
  const { town } = kit();
  town.house(4, 4, 16, 10, { h: 6 });
  town.vent(8, 10, 'S', { z: 4, tex: 'vent-round' });
  assert.deepEqual(town.decals.at(-1), { x: 8, y: 10, z: 4, face: 'S', tex: 'vent-round' });
  assert.ok(registry.textures.get('vent-round')?.decal);
});

test('a stall is a counter under an awning that stands free: poles at all four corners, its back closed, clutter kept off it', () => {
  const { p, town } = kit();
  town.house(4, 4, 36, 10, { h: 6 });
  town.stall(10, 12, 14, 15, 'S', { cloth: 'red' });
  assert.equal(p.get(12, 13).slab.bottom, 2.75, 'you walk under its roof');
  const poles = town.things.filter((t) => t.type.startsWith('awning-pole'));
  assert.ok(poles.some((t) => t.y < 13) && poles.some((t) => t.y > 14), 'poles at the back and the front');
  assert.equal(town.things.filter((t) => t.type === 'awning-red-3-back').length, 2, 'a back for each bay');
  const counter = town.things.find((t) => t.type === 'market-stall');
  assert.deepEqual([counter.x, counter.y, counter.angle], [12, 13.5, 0], 'the counter in the middle, at the front');
  for (const t of town.things) assert.ok(registry.things.get(t.type), `${t.type} is a decoration`);
  town.finish();
  town.clutter({ amount: 3 });
  const inside = town.things.filter((t) => t.type !== 'market-stall' && !t.type.startsWith('awning') && t.x >= 10 && t.x <= 14 && t.y >= 12 && t.y <= 15);
  assert.deepEqual(inside, [], 'no clutter in the stall');
  assert.throws(() => town.stall(20, 12, 25, 15, 'S'), /4 or 6 wide and 3 deep/);
});

test('clutter stands along the walls of the open street, off the doors, and leaves narrow alleys clear', () => {
  const make = () => {
    const { p, town } = kit();
    town.house(4, 4, 36, 12, { h: 6 });
    // Two houses with a 2-wide alley between them, on the far side of the street.
    town.house(4, 24, 18, 36, { h: 6 });
    town.house(20, 24, 36, 36, { h: 6 });
    town.door(20, 12, 'S', { h: 6 });
    town.finish();
    town.clutter({ amount: 2 });
    return { p, town };
  };
  const { town } = make();
  const placed = town.things.filter((t) => !t.type.startsWith('door') && !t.type.startsWith('litter'));
  assert.ok(placed.length > 10, `${placed.length} things`);
  for (const t of placed) {
    const nearWall = (t.y > 12 && t.y < 13.8) || (t.y < 24 && t.y > 22.2);
    assert.ok(nearWall, `${t.type} at (${t.x}, ${t.y}) is against a wall`);
    if (t.y < 14) assert.ok(t.x < 18.4 || t.x > 21.6, `${t.type} at ${t.x} is off the door`);
    assert.ok(!(t.x > 18 && t.x < 20 && t.y > 24), `${t.type} is not in the alley`);
    assert.ok(registry.things.get(t.type), `${t.type} is a decoration`);
  }
  assert.deepEqual(make().town.things, town.things, 'the same every time');
});

test("a wall's grime and clutter stay as they were when a building goes up elsewhere", () => {
  const make = (more) => {
    const { p, town } = kit();
    town.house(4, 4, 36, 12, { h: 6 });
    town.window(10.5, 12, 'S').door(20, 12, 'S', { h: 6 });
    if (more) town.house(4, 28, 36, 36, { h: 6 }).window(20.5, 28, 'N');
    town.finish();
    town.grime({ amount: 2 });
    town.clutter({ amount: 2 });
    const near = (t) => t.y < 20;
    return { decals: town.decals.filter(near), things: town.things.filter(near) };
  };
  const [alone, beside] = [make(false), make(true)];
  assert.ok(alone.decals.length > 4 && alone.things.length > 2, 'something to compare');
  assert.deepEqual(beside.decals, alone.decals, 'the same grime');
  assert.deepEqual(beside.things, alone.things, 'the same clutter');
});

test("a hood stands out round a door in the wall's plaster, lit as the wall is, and must fit under the roof", () => {
  const { town } = kit();
  town.house(4, 4, 16, 14, { h: 6, wall: 'adobe-pale' });
  town.door(10, 14, 'S', { h: 6, wall: 'adobe-pale' });
  town.hood(10, 14, 'S', { h: 6, wall: 'adobe-pale' });
  const hood = town.things.find((t) => t.type.startsWith('arch-hood'));
  assert.deepEqual([hood.type, hood.x, hood.angle], ['arch-hood-3-pale', 10, 0]);
  assert.ok(Math.abs(hood.y - 14) < 0.05, 'on the wall');
  assert.ok(registry.things.get(hood.type), 'a decoration');
  town.finish();
  assert.ok(hood.lit > 0, 'lit as the wall');
  assert.throws(() => town.hood(10, 14, 'S', { h: 4 }), /above the wall/);
  assert.throws(() => town.hood(10, 14, 'S', { h: 6, width: 5 }), /models for 3 and 4/);
});

test('a rounded arch fills the corners under its lintel, a model a tile through it, lit as the walls round it', () => {
  const { town } = kit();
  town.house(4, 4, 16, 14, { h: 6 });
  town.arch(8, 11, 12, 14, { h: 6, lintel: 3.5, round: 'S' });
  const rounds = town.things.filter((t) => t.type === 'arch-round-4');
  assert.deepEqual(rounds.map((t) => t.y), [14, 13, 12], 'from the front back');
  assert.ok(rounds.every((t) => t.x === 10 && t.z === 2 && t.angle === 0), 'springing 1.5 under the lintel');
  // (Every face flat, its curve too: the renderer lights it as the walls
  // round it, with no bands from the faces' turns.)
  assert.ok(registry.models.get('arch-round-4').faces.every((f) => f.flat), 'lit as the walls');
  assert.throws(() => town.arch(8, 11, 13, 14, { h: 6, lintel: 3.5, round: 'S' }), /models for 3 and 4/);
  assert.throws(() => town.arch(8, 11, 12, 14, { h: 6, lintel: 3, round: 'S' }), /head room/);
});

test('a grimy rounded arch (a vault indoors) takes the two sooty kinds in turns along it, the same arch with soot on', () => {
  const { town } = kit();
  town.house(4, 4, 16, 14, { h: 6, wall: 'adobe-pale' });
  town.arch(8, 10, 12, 14, { h: 6, lintel: 3.5, wall: 'adobe-pale', round: 'S', grimy: true });
  const rounds = town.things.filter((t) => t.type.startsWith('arch-round'));
  assert.deepEqual(rounds.map((t) => t.type), ['arch-round-4-pale-grimy-1', 'arch-round-4-pale-grimy-2', 'arch-round-4-pale-grimy-1', 'arch-round-4-pale-grimy-2']);
  const clean = registry.models.get('arch-round-4-pale');
  for (const id of ['arch-round-4-pale-grimy-1', 'arch-round-4-pale-grimy-2']) {
    const faces = registry.models.get(id).faces;
    const grime = faces.filter((f) => registry.textures.get(f.tex)?.grime);
    assert.ok(grime.length > 0, `${id} has soot`);
    assert.equal(faces.length - grime.length, clean.faces.length, `${id} is the same arch under it`);
  }
});

test("a platform stands over its box with steps down its sides, a rise apart, and a door on it is at its top", () => {
  const { p, town } = kit();
  town.house(4, 4, 16, 14, { h: 6 });
  town.platform(6, 14, 14, 16, { h: 0.75, steps: 'S' });
  town.door(10, 14, 'S', { h: 6, floorZ: 0.75 });
  assert.equal(p.get(8, 15).floorZ, 0.75);
  assert.equal(p.get(8, 15).floor, 'flagstone');
  assert.deepEqual([16, 17, 18].map((y) => p.get(8, y).floorZ), [0.5, 0.25, 0], 'two steps down, then the street');
  assert.equal(p.get(5, 15).floorZ, 0, 'no steps at its ends');
  assert.equal(p.get(9, 13).floorZ, 0.75, 'the doorway at its top');
  assert.throws(() => town.platform(20, 20, 24, 22, { h: 0.6 }), /whole number/);
});

test('a door a step up raises its step outside off the street, or sits on a kerb, and clutter keeps off the kerb', () => {
  const { p, town } = kit();
  town.house(4, 4, 16, 14, { h: 6 });
  town.door(10, 14, 'S', { h: 6, floorZ: 0.375 });
  assert.equal(p.get(9, 13).floorZ, 0.375, 'the doorway');
  assert.equal(p.get(9, 14).floorZ, 0.375, 'its step');
  assert.equal(p.get(9, 14).floor, 'flagstone');
  assert.equal(p.get(9, 15).floorZ, 0, 'the street');
  town.house(20, 4, 36, 14, { h: 6 });
  town.kerb(20, 14, 36, 15);
  town.door(28, 14, 'S', { h: 6, floorZ: 0.375 });
  assert.deepEqual([p.get(27, 14).floorZ, p.get(27, 14).floor], [0.375, 'flagstone'], 'its step on the kerb');
  assert.equal(p.get(24, 14).floor, 'adobe-roof', 'the kerb either side');
  town.finish();
  town.clutter({ amount: 2 });
  const placed = town.things.filter((t) => !t.type.startsWith('door') && !t.type.startsWith('litter'));
  assert.ok(placed.some((t) => t.x < 16), 'clutter along the house without a kerb');
  assert.ok(!placed.some((t) => t.x > 20 && t.y < 17), 'none along the kerb');
});

test('a stair rises a step a tile toward its top, from a step up at its foot to a landing, and must fit its box', () => {
  const { p, town } = kit();
  town.house(4, 4, 16, 14, { h: 8 });
  town.stair(16, 4, 18, 12, { up: 'N', top: 2 });
  assert.deepEqual([11, 10, 9, 8, 7, 6, 5, 4].map((y) => p.get(17, y).floorZ), [0.5, 1, 1.5, 2, 2, 2, 2, 2], 'four steps, then the landing');
  assert.equal(p.get(17, 12).floorZ, 0, 'the street at its foot');
  assert.equal(p.get(17, 8).ceiling, 'sky');
  town.stair(20, 20, 26, 21, { up: 'W', top: 1 });
  assert.deepEqual([25, 24, 23, 22].map((x) => p.get(x, 20).floorZ), [0.5, 1, 1, 1], 'up toward the west');
  assert.throws(() => town.stair(20, 30, 22, 32, { up: 'N', top: 2 }), /too short/);
  assert.throws(() => town.stair(20, 30, 22, 38, { up: 'N', top: 1.2 }), /whole number/);
});

test('a stair can climb from ground above or below the street', () => {
  const { p, town } = kit();
  town.stair(4, 4, 8, 6, { up: 'E', from: 1.5, top: 3 });
  assert.deepEqual([4, 5, 6, 7].map((x) => p.get(x, 4).floorZ), [2, 2.5, 3, 3], 'from a rise at 1.5');
  town.stair(10, 10, 12, 16, { up: 'N', from: -2, top: 0, rise: 1 });
  assert.deepEqual([15, 14, 13].map((y) => p.get(10, y).floorZ), [-1, 0, 0], 'out of a pit at -2');
  assert.throws(() => town.stair(20, 20, 24, 21, { up: 'E', from: 2, top: 2 }), /whole number/);
});

test("a buttress stands against its wall in the wall's plaster, the tallest just under the roof, solid, and must fit under it", () => {
  const { town } = kit();
  town.house(4, 4, 16, 14, { h: 5.5 });
  town.buttress(10, 14, 'S', { h: 5.5, wall: 'adobe-pale' });
  const b = town.things.find((t) => t.type.startsWith('buttress'));
  assert.deepEqual([b.type, b.x, b.angle], ['buttress-5-pale', 10, 0]);
  assert.ok(Math.abs(b.y - 14) < 0.05, 'on the wall');
  const deco = registry.things.get(b.type);
  assert.ok(deco?.solid, 'a solid decoration');
  assert.ok(registry.models.get(b.type).lines.length > 0, 'it collides as its footprint');
  assert.throws(() => town.buttress(10, 14, 'S', { h: 3 }), /under 2.5/);
  assert.throws(() => town.buttress(10, 14, 'S', { h: 5.5, top: 6 }), /above the wall/);
});
