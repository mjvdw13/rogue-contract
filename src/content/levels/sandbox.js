import { defineLevel } from '../../engine/defs.js';

// SANDBOX: a test map for the height engine (open it with ?map=sandbox). It
// isn't part of any episode.
//
// The start room (x 1-8, ceiling 1.5) has stairs east up to a tall server hall
// (floor 0.5, ceiling 2.5). A pit (floor -0.75) splits the hall: jump the
// two-tile gap, or drop in and climb the stairs south out of it into the
// courtyard. The courtyard is open to the sky, with walls 3 units tall and a
// sniper ledge (floor 1.25) along its south side. A low vent (floor 0.25,
// ceiling 1, crouch to get through) leads from the courtyard back up into
// the east half of the hall. A window looks from the start room into the
// courtyard through a rising door. The north end of the pit is a secret.
// Lifts: one at the south end of the pit back up to the hall, and one at the
// courtyard's east end up to the sniper ledge.
export default defineLevel({
  id: 'sandbox',
  mapLabel: 'SBX',
  name: 'HEIGHT SANDBOX',
  music: 'office',
  sky: 'sky-city',
  par: 60,
  legend: {
    '.': { floor: 'concrete-floor', ceiling: 'concrete', light: 160, ceilZ: 1.5, side: 'concrete-stripe' },
    s: { base: '.' }, // stairs: heights come from floorHeights
    h: { floor: 'server-floor', ceiling: 'ceiling-light', light: 184, floorZ: 0.5, ceilZ: 2.5, side: 'tech-panel' },
    p: { floor: 'sewer-floor', ceiling: 'ceiling-light', light: 120, floorZ: -0.75, ceilZ: 2.5, side: 'sewer-brick' },
    P: { base: 'p', secret: true }, // the pit's north end
    q: { floor: 'sewer-floor', ceiling: 'concrete', light: 136, floorZ: -0.375, ceilZ: 1.5, side: 'sewer-brick' },
    // Clearance 0.75: too low to stand in (0.85), and 0.5 where it meets the hall floor, just enough crouched.
    v: { floor: 'metal-grate', ceiling: 'metal-grate', light: 128, floorZ: 0.25, ceilZ: 1, side: 'tech-vent', upper: 'tech-panel' },
    w: { floor: 'concrete-floor', ceiling: 'concrete', light: 160, floorZ: 0.45, ceilZ: 1.05, side: 'concrete', upper: 'concrete' },
    y: { floor: 'dirt', ceiling: 'sky', light: 176, ceilZ: 3, side: 'brick-dirty' },
    L: { base: 'y', floorZ: 1.25, side: 'concrete-stripe' },
    D: { door: 'door-metal', jamb: 'door-jamb', style: 'rise', floor: 'concrete-floor', ceiling: 'concrete', upper: 'concrete' },
    // Lifts: step on (or press use) and they rise, wait, and come back down.
    e: { base: 'y', floor: 'elevator-floor', side: 'rust-panel', lift: { stops: [0, 1.25], wait: 3 } },
    f: { base: 'p', floor: 'metal-grate', side: 'rust-panel', lift: { stops: [-0.75, 0.5], wait: 3 } },
  },
  thingLegend: {
    9: { type: 'ant', angle: 'S' },
  },
  tiles: [
    'OOOOOOOOOOOOOOOOOOOOOOOO',
    'O........OOOOhhhpPhhhhhO',
    'O........OOOOhhhpphhhhhO',
    'O........sssshhhpphhhhhO',
    'X........sssshhhpphhhhhO',
    'O........sssshhhpphhhhhO',
    'O........OOOOhhhpphhhhhO',
    'O........OOOOhhhffhhhhhO',
    'OOOODOwwOOOOOOOOqqOOvOOO',
    'OyyyyyyyyyyyyyyyyyyyyyyO',
    'OyyyyyyyyyyyyyyyyyyyyyyO',
    'OyyyyyyyyyyyyyyyyyyyyyyO',
    'OyyyyyyyyyyyyyyyyyyyyyyO',
    'OyyyyyyyyyyyyyyyyyyyyyyO',
    'OyyyyyyyyyyyyyyyyyyyyyyO',
    'OyyyyyyyyyyyyyyyyyyyyyyO',
    'OyyyyyyyyyyyyyyyyyyyyyyO',
    'OyyyyyyyyyyyyyyyyyyyyeeO',
    'OLLLLLLLLLLLLLLLLLLLLLLO',
    'OOOOOOOOOOOOOOOOOOOOOOOO',
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
    '',
    '                    9',
    ' >              d',
    '',
    '              S      t',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '     S     9',
  ],
});
