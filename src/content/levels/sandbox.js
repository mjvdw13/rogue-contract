import { defineLevel } from '../../engine/defs.js';

// CANYON GARRISON (id 'sandbox'): for now the only mission, and the test map
// for the height engine (open it directly with ?map=sandbox).
//
// The start room (x 1-8, ceiling 1.5) has stairs east up to a tall hall
// (floor 0.5, ceiling 2.5) held by a stormtrooper and an officer. A pit
// (floor -0.75) splits the hall: jump the two-tile gap, or drop in and climb
// the stairs south out of it into the courtyard. The courtyard is open to the
// night sky, with canyon walls 3 units tall, a probe droid, and a sniper
// ledge (floor 1.25) along its south side. A low vent (floor 0.25, ceiling 1,
// crouch to get through) leads from the courtyard back up into the east half
// of the hall. A window looks from the start room into the courtyard through
// a rising door. The north end of the pit is a secret. Lifts: one at the
// south end of the pit back up to the hall, and one at the courtyard's east
// end up to the sniper ledge. Angled walls: chamfered corners everywhere, a
// shallow two-tile computer bank in the start room, a diamond pillar and a
// triangular block in the courtyard. The exit switch is on the start room's
// west wall.
export default defineLevel({
  id: 'sandbox',
  mapLabel: 'M1',
  name: 'CANYON GARRISON',
  music: 'garrison',
  sky: 'sky-night',
  par: 60,
  legend: {
    '.': { floor: 'imp-floor', ceiling: 'imp-ceiling', light: 160, ceilZ: 1.5, side: 'imp-stripe' },
    s: { base: '.' }, // stairs: heights come from floorHeights
    h: { floor: 'imp-floor', ceiling: 'imp-ceiling-light', light: 184, floorZ: 0.5, ceilZ: 2.5, side: 'imp-panel-dark' },
    p: { floor: 'imp-grate', ceiling: 'imp-ceiling-light', light: 120, floorZ: -0.75, ceilZ: 2.5, side: 'imp-panel-dark' },
    P: { base: 'p', secret: true }, // the pit's north end
    q: { floor: 'imp-grate', ceiling: 'imp-ceiling', light: 136, floorZ: -0.375, ceilZ: 1.5, side: 'imp-panel-dark' },
    // Clearance 0.75: too low to stand in (0.85), and 0.5 where it meets the hall floor, just enough crouched.
    v: { floor: 'imp-grate', ceiling: 'imp-grate', light: 128, floorZ: 0.25, ceilZ: 1, side: 'imp-vent', upper: 'imp-panel' },
    w: { floor: 'imp-floor', ceiling: 'imp-ceiling', light: 160, floorZ: 0.45, ceilZ: 1.05, side: 'imp-panel', upper: 'imp-panel' },
    y: { floor: 'sand', ceiling: 'sky', light: 176, ceilZ: 3, side: 'canyon-rock' },
    L: { base: 'y', floorZ: 1.25, side: 'canyon-rock' },
    // Building walls inside, canyon rock around the courtyard.
    O: { wall: 'imp-panel' },
    Q: { wall: 'canyon-rock' },
    // Angled walls. Chamfered corners name their solid corner (NW, NE, SW, SE).
    '{': { base: '.', wall: 'imp-panel', diagonal: 'NW' },
    '}': { base: '.', wall: 'imp-panel', diagonal: 'NE' },
    '[': { base: '.', wall: 'imp-panel', diagonal: 'SW' },
    ']': { base: '.', wall: 'imp-panel', diagonal: 'SE' },
    // A shallower (about 26.6 degree) wall across two tiles, solid to the north.
    i: { base: '.', wall: 'imp-computer', line: [1, 0.5, 0, 1] },
    j: { base: '.', wall: 'imp-computer', line: [1, 0, 0, 0.5] },
    '(': { base: 'h', wall: 'imp-panel-dark', diagonal: 'NW' },
    ')': { base: 'h', wall: 'imp-panel-dark', diagonal: 'NE' },
    '<': { base: 'h', wall: 'imp-panel-dark', diagonal: 'SW' },
    '>': { base: 'h', wall: 'imp-panel-dark', diagonal: 'SE' },
    // Courtyard corners, plus a diamond pillar (four tiles, solid towards its
    // centre) and a lone triangular block. Keypad layout: 7 NW, 9 NE, 4 SW, 6 SE.
    7: { base: 'y', wall: 'canyon-rock', diagonal: 'NW' },
    9: { base: 'y', wall: 'canyon-rock', diagonal: 'NE' },
    4: { base: 'y', wall: 'canyon-rock', diagonal: 'SW' },
    6: { base: 'y', wall: 'canyon-rock', diagonal: 'SE' },
    D: { door: 'imp-door', jamb: 'imp-jamb', style: 'rise', floor: 'imp-floor', ceiling: 'imp-ceiling', upper: 'imp-panel' },
    // Lifts: step on (or press use) and they rise, wait, and come back down.
    e: { base: 'y', floor: 'lift-floor', side: 'imp-stripe', lift: { stops: [0, 1.25], wait: 3 } },
    f: { base: 'p', floor: 'lift-floor', side: 'imp-stripe', lift: { stops: [-0.75, 0.5], wait: 3 } },
  },
  thingLegend: {
    9: { type: 'stormtrooper', angle: 'S' },
  },
  tiles: [
    'OOOOOOOOOOOOOOOOOOOOOOOO',
    'O{...ij.}OOOO(hhpPhhhh)O',
    'O........OOOOhhhpphhhhhO',
    'O........sssshhhpphhhhhO',
    'X........sssshhhpphhhhhO',
    'O........sssshhhpphhhhhO',
    'O........OOOOhhhpphhhhhO',
    'O[......]OOOO<hhffhhhh>O',
    'OOOODOwwOOOOOOOOqqOOvOOO',
    'Q7yyyyyyyyyyyyyyyyyyyy9Q',
    'QyyyyyyyyyyyyyyyyyyyyyyQ',
    'QyyyyyyyyyyyyyyyyyyyyyyQ',
    'Qyyyyyyyyy64yyyyyyyyyyyQ',
    'Qyyyyyyyyy97yyyyyyyyyyyQ',
    'Qyyyyyyyyyyyyyyyy9yyyyyQ',
    'QyyyyyyyyyyyyyyyyyyyyyyQ',
    'QyyyyyyyyyyyyyyyyyyyyyyQ',
    'Q4yyyyyyyyyyyyyyyyyyyeeQ',
    'QLLLLLLLLLLLLLLLLLLLLLLQ',
    'QQQQQQQQQQQQQQQQQQQQQQQQ',
  ],
  floorHeights: [
    '',
    '',
    '',
    '         1234',
    '         1234',
    '         1234',
  ],
  things: [
    '',
    '',
    '        k',
    '                    9',
    ' >              h   o',
    '                l',
    '  x           C      c',
    '',
    '',
    '',
    '   xx',
    '',
    '                  p',
    '',
    '',
    '      f',
    '',
    '',
    '     a     9',
  ],
});
