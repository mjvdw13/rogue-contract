// The shared map legend. Every level can use these glyphs, and can add or
// override glyphs in its own `legend` / `thingLegend`.
//
// TILE entries (the `tiles` grid):
//   { wall: 'texture' }                                  solid wall
//   { wall: 'texture', use: 'exit', switchTo: 'tex' }    usable switch (any trigger action)
//   { door: 'texture', jamb?, lock?, style? ('rise' | 'slide' | 'split'), secret?, tag? }
//   { floor, ..., lift: { stops: [0, 1.5], mode?, speed?, wait?, on?, moves? } }  a lift
//   { floor, ceiling ('sky' for open air), light (0-255), lightFx?, damage?, secret?, exit?, tag? }
//   { base: '.', ...changes }                            copy another glyph and change parts
// A space is solid nothingness outside the map.
//
// THING entries (the `things` grid) map a glyph to a thing id, or to
// { type, skill: [..], ambush: true, angle: 'N', z: 2 } (z: a height to place
// it at, instead of on the floor). Every monster/item/
// decoration also has its own `glyph` (see src/content/monsters etc.).
// Player starts: ^ (facing north/up)  > (east)  v (south)  < (west).

export default {
  tiles: {
    // ---- Imperial walls
    '#': { wall: 'imp-panel' },
    '=': { wall: 'imp-panel-dark' },
    L: { wall: 'imp-lights' },
    K: { wall: 'imp-computer' },
    V: { wall: 'imp-vent' },
    H: { wall: 'imp-stripe' },
    // ---- The canyon
    R: { wall: 'canyon-rock' },

    // ---- Doors (they rise into the ceiling, Dark Forces-style; use them with E)
    D: { door: 'imp-door', jamb: 'imp-jamb', style: 'rise' },
    1: { door: 'imp-door-blue', jamb: 'imp-jamb', lock: 'blue', style: 'rise' },
    2: { door: 'imp-door-yellow', jamb: 'imp-jamb', lock: 'yellow', style: 'rise' },
    3: { door: 'imp-door-red', jamb: 'imp-jamb', lock: 'red', style: 'rise' },

    // ---- Switches
    X: { wall: 'imp-switch', use: 'exit', switchTo: 'imp-switch-on' },

    // ---- Floors
    '.': { floor: 'imp-floor', ceiling: 'imp-ceiling', light: 160, side: 'imp-panel-dark' },
    ',': { floor: 'imp-floor', ceiling: 'imp-ceiling', light: 112, side: 'imp-panel-dark' },
    ':': { floor: 'imp-floor', ceiling: 'imp-ceiling-light', light: 208, side: 'imp-panel-dark' },
    g: { floor: 'imp-grate', ceiling: 'imp-ceiling', light: 144, side: 'imp-panel-dark' },
    _: { floor: 'sand', ceiling: 'sky', light: 176, side: 'canyon-rock' },
    '?': { floor: 'imp-floor', ceiling: 'imp-ceiling', light: 160, secret: true },
  },

  things: {
    // Extra enemies on the harder skills only.
    '!': { type: 'stormtrooper', skill: [3, 4, 5] },
    '@': { type: 'probe-droid', skill: [4, 5] },
    // Extra help on the easy skills only.
    '+': { type: 'med-kit', skill: [1, 2] },
    '"': { type: 'shield-unit', skill: [1, 2] },
    '%': { type: 'energy-pack', skill: [1, 2] },
  },
};
