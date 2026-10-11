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
// { type, skill: [..], ambush: true, angle: 'N' }. Every monster/item/
// decoration also has its own `glyph` (see src/content/monsters etc.).
// Player starts: ^ (facing north/up)  > (east)  v (south)  < (west).

export default {
  tiles: {
    // ---- Office walls
    '#': { wall: 'drywall' },
    '+': { wall: 'drywall-outlet' },
    '!': { wall: 'drywall-blood' },
    C: { wall: 'cubicle' },
    c: { wall: 'cubicle-memo' },
    P: { wall: 'cubicle-poster' },
    Q: { wall: 'cubicle-beige' },
    W: { wall: 'wood-panel' },
    w: { wall: 'wood-panel-dark' },
    B: { wall: 'whiteboard' },
    N: { wall: 'window-night' },
    V: { wall: 'vending' },
    A: { wall: 'poster-alex' },
    E: { wall: 'elevator-wall' },
    // ---- Server room
    T: { wall: 'tech-panel' },
    t: { wall: 'tech-vent' },
    K: { wall: 'server-rack' },
    k: { wall: 'crt-wall' },
    Z: { wall: 'cable-wall' },
    // ---- Basement
    O: { wall: 'concrete' },
    o: { wall: 'concrete-dark' },
    H: { wall: 'concrete-stripe' },
    I: { wall: 'pipes' },
    J: { wall: 'rust-panel' },
    j: { wall: 'brick-dirty' },
    U: { wall: 'boiler' },
    // ---- Underworld
    G: { wall: 'sewer-brick' },
    g: { wall: 'sewer-brick-slime' },
    F: { wall: 'trash-wall' },
    f: { wall: 'flesh-trash' },
    Y: { wall: 'flesh-eye' },
    b: { wall: 'bone-wall' },

    // ---- Doors (they rise into the ceiling, Dark Forces-style; use them with E)
    D: { door: 'door-office', jamb: 'door-jamb', style: 'rise' },
    L: { door: 'door-elevator', jamb: 'door-jamb', style: 'split' },
    M: { door: 'door-metal', jamb: 'door-jamb', style: 'rise' },
    R: { door: 'door-rusty', jamb: 'door-jamb-rust', style: 'rise' },
    1: { door: 'door-blue', jamb: 'door-jamb', lock: 'blue', style: 'rise' },
    2: { door: 'door-yellow', jamb: 'door-jamb', lock: 'yellow', style: 'rise' },
    3: { door: 'door-red', jamb: 'door-jamb', lock: 'red', style: 'rise' },

    // ---- Switches
    X: { wall: 'switch-exit', use: 'exit', switchTo: 'switch-exit-on' },

    // ---- Floors
    '.': { floor: 'carpet', ceiling: 'ceiling-tile', light: 160 },
    ',': { floor: 'carpet', ceiling: 'ceiling-tile', light: 120 },
    ':': { floor: 'carpet', ceiling: 'ceiling-light', light: 208 },
    ';': { floor: 'carpet', ceiling: 'ceiling-light-broken', light: 184, lightFx: 'flicker' },
    _: { floor: 'linoleum', ceiling: 'ceiling-tile', light: 164 },
    '=': { floor: 'linoleum', ceiling: 'ceiling-light', light: 208 },
    r: { floor: 'carpet-red', ceiling: 'ceiling-stained', light: 144 },
    e: { floor: 'elevator-floor', ceiling: 'ceiling-light', light: 192 },
    n: { floor: 'server-floor', ceiling: 'ceiling-tile', light: 128 },
    m: { floor: 'server-floor', ceiling: 'ceiling-light', light: 176 },
    '-': { floor: 'concrete-floor', ceiling: 'concrete', light: 136 },
    '~': { floor: 'sewage', ceiling: 'sewer-brick', light: 136, damage: 6 },
    s: { floor: 'sewer-floor', ceiling: 'sewer-brick', light: 128 },
    l: { floor: 'landfill', ceiling: 'sky', light: 176 },
    d: { floor: 'dirt', ceiling: 'sky', light: 160 },
    '*': { floor: 'carpet', ceiling: 'sky', light: 168 },
    '?': { floor: 'carpet', ceiling: 'ceiling-tile', light: 160, secret: true },
  },

  things: {
    // Extra bugs on the harder skills only.
    '!': { type: 'ant', skill: [3, 4, 5] },
    '@': { type: 'firefly', skill: [3, 4, 5] },
    '&': { type: 'roach', skill: [3, 4, 5] },
    '%': { type: 'beetle', skill: [4, 5] },
    $: { type: 'mite', skill: [3, 4, 5] },
    '`': { type: 'garbage-collector', skill: [4, 5] },
    // Extra help on the easy skills only.
    '+': { type: 'donut', skill: [1, 2] },
    '=': { type: 'staples-box', skill: [1, 2] },
    '"': { type: 'cup-of-joe', skill: [1, 2] },
  },
};
