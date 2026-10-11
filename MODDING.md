# Modding Raccoon Alex

Everything that makes this game *Raccoon Alex* lives in `src/content/` as plain
data. The engine in `src/engine/` never mentions Alex. It only reads that
content pack. Each new monster, weapon, item, level, sound or song is a small
definition in a file, plus one line in an index.

This guide covers each kind of content in turn: monsters, coworkers, weapons,
items, scenery, levels, textures, sounds, music, cheats and custom behaviour.
All paths are relative to the repository root.

## The workflow

1. Add or change a definition in `src/content/`.
2. Run `npm run validate`. It checks every reference (sprites, sounds,
   projectiles, glyphs, textures), that every file exists, and that each level's
   exit, keys and secrets can be reached from the start. It also prints an
   ammo budget for each level.
3. Reload the game. Jump straight to a level with
   `index.html?map=e1m2&skill=3`, and add `&god` or `&nomonsters` while
   testing.
4. Run `npm test` before you push.

The game also validates the content when it boots, and prints any problem in
the browser console.

Every `define*()` helper used below lives in `src/engine/defs.js`, together
with JSDoc types, so editors like VS Code autocomplete the fields.

## Art

- **Format:** PNG. Transparency comes from the alpha channel, or use magenta
  `#FF00FF`.
- **Palette:** when a PNG loads, each pixel is snapped to the nearest colour of
  the 256-colour palette in `src/content/palette.js`. Art from any source ends
  up with the same gritty look. The 31 glow colours at the end of the palette
  are *fullbright*: they ignore lighting, so use them for eyes, flames, screens
  and LEDs.
- **Sprite sheets:** frames of equal size, left to right and wrapping onto new
  rows. Frame 0 is the top-left frame. Things always face the player (there
  are no 8-angle rotations), and the bottom of the frame stands on the floor.
  64 pixels is one tile, so a 64×64 frame fits a dog-sized bug, and a
  person-sized coworker is about 50–56 pixels tall.
- **Textures:** walls and flats are 64×64. An animated texture is a horizontal
  strip of 64×64 frames.
- **The built-in art** comes from code in `tools/art/`. Run `npm run art`, or
  `node tools/art/generate.mjs --only ant --preview`. It uses a small
  software "clay" renderer (`tools/art/lib/model.js`), and a rig for
  humanoids (`lib/rig.js`). You can also just draw PNGs by hand. If you
  hand-edit a generated PNG, don't regenerate that asset afterwards, or your
  edits will be overwritten.

## Monsters

Make a file in `src/content/monsters/`, import it in
`src/content/monsters/index.js`, and draw the sheet.

```js
import { defineMonster } from '../../engine/defs.js';

export default defineMonster({
  id: 'temp',                 // unique id
  name: 'Rabid Temp',
  glyph: 't',                 // its letter in level maps (must be unused)
  sheet: { src: 'assets/sprites/monsters/temp.png', frameWidth: 64, frameHeight: 64 },
  health: 40,
  speed: 2.6,                 // tiles per second
  radius: 0.3,                // collision radius in tiles
  painChance: 0.6,            // chance to flinch when hit
  reactionTime: 0.4,          // seconds before reacting after being woken
  cooldown: [1, 2.2],         // seconds between attacks (random in range)
  aggression: 0.65,           // how eagerly it attacks when it could
  attack: { kind: 'projectile', projectile: 'exception-fireball', range: 30, minRange: 1.5 },
  melee: { kind: 'melee', damage: [6, 18], range: 1.1, hitSound: 'claw' },
  anims: {
    idle: { frames: [0, 1], fps: 2, loop: true },
    walk: { frames: [0, 1, 2, 3], fps: 6 },
    attack: { frames: [4, 5, 4], durations: [0.3, 0.15, 0.2], fireAt: 1, fullbright: [1] },
    melee: { frames: [4, 5], fps: 8, fireAt: 1 },
    pain: [6],
    death: { frames: [7, 8, 9, 10], fps: 8 },
  },
  sounds: { sight: 'firefly-sight', active: 'firefly-active', pain: 'firefly-pain', death: 'firefly-death' },
  blood: 'ichor',             // effect when hit (bugs bleed green)
  drops: ['staples-clip', { item: 'donut', chance: 0.25 }],
});
```

**Animations.** Each one is either a list of frame numbers or
`{ frames, fps | durations, loop, fireAt, fullbright, events }`. `fireAt` is
the position (within `frames`) at which the attack happens. `fullbright` lists
the positions that ignore lighting (muzzle flashes). `events` maps a position
to a string such as `'sound:pumpkin-rustle'`, or to anything a hook wants.
A monster needs `walk` (or `idle`) and `death`. The last death frame stays on
the floor as the corpse.

**Attacks.** An attack is one of:

- `{ kind: 'hitscan', damage: [3, 12], spread: 0.1, range: 24, pellets: 1, sound }`
- `{ kind: 'projectile', projectile: 'exception-fireball', count: 1, spread: 0 }`
- `{ kind: 'melee', damage: [10, 30], range: 1.1, hitSound }`
- a custom kind (see *Custom behaviour*)

Damage is either a `[min, max]` range or a number.

**Other fields:** `scale` (sprite size), `height`, `mass` (knockback),
`sightRange`, `splashImmune`, `infighting: false`, `boss: true`,
`renderStyle: 'fuzz'` (shimmering, partly invisible), `countKill: false`.

**Hooks** run your own code: `onSpawn(world, self)`, `onSight(world, self)`,
`onThink(world, self, dt)` (return `true` to skip the normal AI that tick),
`onAttack(world, self, attack)`, `onPain(world, self, source, amount)`,
`onDeath(world, self, source)` and `onEvent(world, self, eventName)`. The Pumpkin
King in `monsters/pumpkin-king.js` uses `onThink` to cackle for reinforcements.

## Coworkers (friendly characters)

`src/content/coworkers.js` defines Alex's coworkers with `defineNpc()`.
Friendlies are solid, so you bump into them, but they can't be hurt.
Bullets, projectiles and explosions pass through them, and monsters never
target them. Each one idles and wanders up to `wander` tiles from where it was
placed. It stays out of doorways, hazards and one-tile passages, so it never
blocks the way. When Alex bumps into one or presses use on it, it turns to
him, plays `react`, says one of its `lines` (shown as `NAME: line`), plays
`sounds.react` and pops up a `bubble` effect.

```js
defineNpc({
  id: 'vera',
  name: 'VERA',
  glyph: '2',
  sheet: { src: 'assets/sprites/coworkers/vera.png', frameWidth: 64, frameHeight: 64 },
  wander: 3,                // tiles from the spot; 0 = stays put
  speed: 0.8,
  idleTime: [3, 6],         // seconds between strolls
  anims: { idle: { frames: [0, 1], durations: [2.8, 1.6], loop: true }, walk: [2, 3, 4, 5], react: [6] },
  lines: ['Cool.', 'Wow. Riveting.'],
  bubble: 'bubble-dots',    // an effect from content/effects.js
  sounds: { react: 'npc-hmph' },
});
```

Animation frame events like `events: { 2: 'sound:npc-sigh' }` play a sound
(Dale sighs on his idle loop). `hooks.onReact(world, self)` and
`hooks.onThink(world, self, dt)` add custom behaviour.

The sprites are hand-drawn pixel art, one file per coworker in
`tools/art/sprites/people/`. Each character is drawn as text grids, one
character per pixel and a legend of palette colours, split into parts (head,
body, arms, legs) so poses can reuse them. `compose()` stamps the parts onto a
frame and `paint()` finishes it: dithered blends between shades, a light
fabric grain, soft edges between materials, and a shadow-side outline instead
of a black one (all in `tools/art/lib/pixels.js`). Edit a grid, then run
`npm run art -- --only coworker-<id>`.

## Weapons

Make a file in `src/content/weapons/`, add it to `weapons/index.js`, and make a
pickup item for it (see *Items*).

```js
import { defineWeapon } from '../../engine/defs.js';

export default defineWeapon({
  id: 'hole-punch',
  name: 'HOLE PUNCH',
  slot: 3,                        // number key; several weapons can share a slot
  ammo: 'tacks',                  // or null for melee
  ammoPerShot: 1,
  priority: 3,                    // auto-switch preference when picking up ammo
  flashLight: 1,                  // lights up the room when firing (0-2)
  sheet: { src: 'assets/sprites/weapons/hole-punch.png', frameWidth: 128, frameHeight: 96 },
  anims: {
    idle: [0],
    fire: { frames: [1, 2, 0], durations: [0.08, 0.15, 0.2], fireAt: 0, fullbright: [0] },
  },
  fire: { kind: 'hitscan', damage: [5, 15], pellets: 3, spread: 0.06, range: 40 },
  sounds: { fire: 'tack-fire' },
});
```

View sprites are drawn at the bottom centre of the view, which is 320×168
pixels. Use `offset: [x, y]` to nudge yours. The fire animation's length sets
the rate of fire. `accurateFirstShot: true` makes a single shot perfectly
accurate when you aren't holding the trigger. New ammo types go in
`src/content/ammo.js` as `defineAmmo({ id, name, short, max, clip })`.

## Items

Items live in `src/content/items/` (health, armor, ammo, weapons, keys and
powerups).

```js
defineItem({
  id: 'energy-drink',
  name: 'Energy Drink',
  glyph: 'v',
  sheet: { src: 'assets/sprites/items/energy-drink.png', frameWidth: 16, frameHeight: 24 },
  pickup: { health: 15, maxHealth: 150 },
  message: 'Chugged an energy drink. Your eye twitches.',
  sound: 'item-slurp',
  countItem: true,             // counts toward ITEMS on the tally screen
});
```

Built-in `pickup` effects (combine as many as you like):

| Effect | Meaning |
|---|---|
| `health: n` | Heal `n`, up to `maxHealth` (default 100) |
| `armor: n` | Add caffeine (armor), up to `maxArmor` (default 200). With `armorClass: 1` or `2`, set it to `n` with that absorption (⅓ or ½) |
| `ammo: { staples: 10 }` | Give ammo (doubled on the easiest and hardest skills) |
| `weapon: 'id'` | Give a weapon and switch to it |
| `key: 'blue'` | Give a key (the ids are listed in `config.keys`) |
| `powerup: 'invulnerable' \| 'nightvision' \| 'hazard' \| 'berserk'` | Timed powerup (`duration` in seconds, default 30). Berserk lasts the whole level |
| `backpack: true` | Double ammo capacity and give a clip of each ammo type |
| `map: true` | Reveal the automap |

Add `always: true` to pick an item up even when it gives nothing.
`hooks: { onPickup(world, player, item) }` runs extra code. New effect kinds can
be added with `definePickup` (see *Custom behaviour*).

## Scenery, projectiles and effects

- **Decorations** are defined in `src/content/decor.js` with
  `defineDecoration({ id, glyph, sheet, solid, radius, hanging, anims })`. Give
  one `health` and `explode: { radius, damage, sound, effect }` to make a
  barrel that explodes (see `toxic-drum`).
- **Projectiles** are defined in `src/content/effects.js` with
  `defineProjectile({ id, sheet, anims: { fly, explode }, speed, damage, splash: { radius, damage }, gravity, sounds })`.
- **Effects** such as puffs, blood, bug ichor and explosions use
  `defineEffect({ id, sheet, anims: { idle } })`. An effect disappears when its
  animation ends.

## Levels

A level is an ASCII map. Copy `src/content/levels/e1m1.js`, rename it, add it to
`src/content/levels/index.js`, and put its id in an episode's `levels` list.

```js
import { defineLevel } from '../../engine/defs.js';

export default defineLevel({
  id: 'e1m6',
  mapLabel: 'E1M6',
  name: 'THE ROOF',
  music: 'office',
  sky: 'sky-city',
  par: 120,                  // seconds, shown on the tally screen
  fog: 0.3,                  // extra darkness with distance
  tiles: [
    '###########',
    '#....#....#',
    '#.:..D..:.#',           // D: a door, : a bright floor tile
    '#....#....#',
    '#1#########',           // 1: a door that needs the blue badge
    '#.#',                   // short rows are padded with solid nothing
    '#X#',                   // X: the exit switch
  ],
  things: [
    '',
    ' >  b  i',              // player start facing east, blue badge, ant
    '        d',             // a donut
  ],
  legend: {},                // per-level tile glyphs (see below)
  thingLegend: {},           // per-level thing glyphs
  triggers: [],
});
```

### Tiles

The shared glyphs are in `src/content/levels/legend.js`, and each level can add
more or override them in `legend`. A glyph means one of these:

```js
// A wall:
'#': { wall: 'drywall' },
// A floor (the ceiling: 'sky' opens it to the sky):
'.': { floor: 'carpet', ceiling: 'ceiling-tile', light: 160 },
// A door ('slide' or 'split'; lock: 'blue' | 'yellow' | 'red' | 'remote'):
'D': { door: 'door-office', jamb: 'door-jamb' },
// A switch (use it to run actions):
'X': { wall: 'switch-exit', use: 'exit', switchTo: 'switch-exit-on' },
// Copy another glyph and change some of it:
'a': { base: '.', light: 220, lightFx: 'flicker', tag: 'hall' },
```

Floor options:

- `light`: 0–255. 120 is dark, 160 is normal, 200 and up is bright.
- `lightFx`: `'flicker'`, `'strobe'`, `'blink'`, `'glow'` or `'fire'`.
  Neighbouring tiles that share a glyph flicker together.
- `damage`: hurts every second while standing on it (waders protect).
- `secret: true`: entering a connected group of these counts as one secret.
- `exit: true`: stepping here ends the level.
- `tag`: a name that triggers and actions can refer to.

### Heights

Every floor tile has its own floor and ceiling height, in world units: one
unit is one tile, or 64 texels of a wall texture. The defaults, `floorZ: 0` and
`ceilZ: 1`, give the classic flat look.

```js
'h': { floor: 'server-floor', ceiling: 'ceiling-light', floorZ: 0.5, ceilZ: 2.5, side: 'tech-panel' },
'p': { base: 'h', floorZ: -0.75 },               // a pit
'v': { base: '.', floorZ: 0.25, ceilZ: 1 },      // a crawl space: crouch to get in
```

- `floorZ` / `ceilZ`: the heights. A solid wall is drawn from the floor to the
  ceiling of the tile in front of it, so a tall sky courtyard (`ceiling: 'sky',
  ceilZ: 3`) gets tall walls.
- `side`: the texture on the faces of a raised floor (steps, ledges, platform
  edges). It defaults to the floor texture.
- `upper`: the texture under a lowered ceiling (the lintel above a door, the
  mouth of a vent). It defaults to `side`, then to the ceiling texture.
- Level-wide defaults go in the level's `defaults: { floorZ, ceilZ, side, upper }`.

For stairs and terrain, a level can paint heights over the tiles with
`floorHeights` and `ceilHeights`. These grids line up with `tiles`. Each
character is a number of `heightStep`s (default 0.125) above `heightBase`
(default 0): `0`-`9`, then `a`-`z` for 10-35. A space or `.` keeps the
legend's height.

```js
floorHeights: [
  '',
  '         1234',    // four steps of 0.125 up to a 0.5 platform
],
```

How the player moves (all overridable in `hero.js` as `body: {...}`): steps up
to 0.4 are walked up, a jump rises about 0.63, and anything up to about 0.78
can be jumped onto. The standing body is 0.85 tall, or 0.5 crouched. A space
must be at least that tall to move through, measured as the lowest ceiling
minus the highest floor under the player. Falls faster than 9 units per second
(about a 3-unit drop) hurt. Monsters walk up steps of up to 0.4 (their
`stepHeight`), and anything that isn't `flying` follows the floor.

Door options:

- `jamb`: the texture of the walls beside the door.
- `style: 'split'`: an elevator-style door that opens from the middle.
- `secret: true`: the door looks exactly like the wall around it (give it that
  wall's texture), stays open, and hides from the automap and from monsters
  until it's found.
- `lock: 'remote'`: only triggers can open the door.
- `wait`, `speed`, `tag` and `sounds` are also available.

Doors need walls on two opposite sides. A space is solid nothingness: keep
every floor tile enclosed by walls (the validator checks this).

### Things

The `things` grid lines up with `tiles`. Put a thing's glyph on a floor tile.
The player start is `^ > v <` (facing north, east, south or west). Every
monster, item and decoration has a `glyph` in its definition. Glyphs for
skill-specific placement are in the shared `things` legend: `!` is an Off-By-One Ant
on skill 3 and up, and `+` is a donut on skills 1–2. Add your own in
`thingLegend`:

```js
thingLegend: {
  Z: { type: 'firefly', tag: 'closet-flies' },  // tag it for triggers
  9: { type: 'beetle', skill: [3, 4, 5] },      // only on these skills
  8: { type: 'ant', ambush: true, angle: 'W' }  // ambush: waits until it sees you
},
```

You can also place things precisely with
`list: [{ type: 'donut', x: 3.5, y: 7.25 }]`.

### Triggers and actions

```js
triggers: [
  { on: 'start', do: [{ action: 'message', text: 'THE ROOF. IT IS RAINING.' }] },
  { on: 'enter', tag: 'hall', do: [{ action: 'openDoors', tag: 'closet' }] },
  { on: 'use', tag: 'panel', do: ['exit'] },
  { on: 'pickup', thing: 'badge-red', do: [{ action: 'spawn', thing: 'firefly', tag: 'spawn-spot' }] },
  { on: 'killed', tag: 'closet-flies', do: [{ action: 'setLight', tag: 'hall', light: 200 }] },
  { on: 'killed', thing: 'pumpkin-king', do: [{ action: 'finale' }] },
],
```

Events:

- `start`: when the level begins.
- `enter`: the player steps on a tile with that tag.
- `use`: the player uses a wall with that tag.
- `pickup`: the player picks up that item.
- `killed`: every monster of that type (`thing`) or with that tag is dead.

A trigger fires once unless you add `once: false`.

Actions:

- `openDoors` / `closeDoors` `{ tag }`
- `exit`, `secretExit` (goes to the level's `secretNext`) and `finale` (ends
  the episode)
- `message` `{ text }`, `sound` `{ id }` and `music` `{ id }`
- `spawn` `{ thing, tag }`: a monster or item appears in teleport fog on every
  tile with the tag
- `setLight` `{ tag, light }`
- `teleport` `{ tag, angle }`: moves the player to the first tile with the tag

### Checking a level

- `npm run validate` reports problems such as an unreachable exit, a key that
  can't be found, a sealed-off secret, a thing inside a wall, unknown glyphs,
  doors without walls, or a low ammo budget.
- `node tools/mapview.mjs e1m6` writes `tools/art/out/maps/e1m6.png`, a
  top-down picture with monsters in red, items in yellow, keys in their colour
  and unreachable floor cross-hatched. Add `--skill 5` to see nightmare
  placement.

Tips from the built-in maps:

- Give each level two or three secrets and a key or two.
- Aim for an ammo budget of about 2× (the validator shows it).
- Make the start room quiet. Monsters wake up when they hear gunfire, unless
  a closed door is in the way.

### Episodes

`src/content/levels/index.js` defines the episodes:
`defineEpisode({ id, name, levels: [...], map, finale: { text, background, endImage, endText, music } })`.
If there is more than one episode, the menu asks which one to play.

`map: { spots: { e1m1: [82, 34], ... } }` places each level on the
intermission picture (`assets/ui/intermission.png`, 320×200). Between levels,
finished levels are crossed out and a blinking "YOU ARE HERE" marks the next
one.

## Textures

Put a 64×64 PNG in `assets/textures/` and add its name to the `STATIC` list in
`src/content/textures.js`. For an animated texture, add it to `ANIMATED` with
`{ frames, fps }`. Sky textures (`sky: true`) are wide panoramas.

## Sounds

Sounds are defined in `src/content/sounds.js`. Each one is either synthesized
from parameters or loaded from a file:

```js
defineSound({ id: 'stapler-jam', synth: { wave: 'square', freq: 300, freqEnd: 80, duration: 0.2, bits: 6 } }),
defineSound({ id: 'scream', src: 'assets/sounds/scream.wav', volume: 0.8 }),
```

Synth parameters:

- `wave`: `square`, `pulse`, `saw`, `triangle`, `sine` or `noise`.
- `freq` / `freqEnd` (a slide), `duty`, `noiseHold`.
- An envelope: `attack`, `decay`, `sustain`, `release`.
- `vibrato`, `lowpass` (a cutoff, or `[start, end]` for a sweep) and
  `highpass`.
- `distortion`, `bits` and `downsample` for crunch.
- `repeat` (`{ count, interval, decay, pitch }`), `echo` and `layers` (extra
  sounds mixed on top).

The full list is at the top of `src/engine/audio/synth.js`. `pitchVariance`
randomizes the pitch a little each time the sound plays.

## Music

Songs are tracker patterns, in `src/content/music/`:

```js
defineSong({
  id: 'roof',
  bpm: 120,
  instruments: { bass, lead, kick, snare, hat },   // patches from music/instruments.js
  patterns: {
    a: {
      bass: 'A1 . A2 A1 . A1 C2 A1 | G1 . G2 G1 . G1 E1 G1',
      kick: 'x . . . x . . . | x . . . x . x .',
      hat:  'x o x o x o x o',                     // shorter patterns loop
    },
  },
  sequence: ['a', 'a'],
});
```

Each token is one step (16th notes by default):

- A note: `C#3`. Join notes with `+` for a chord (`A2+C3+E3`). Add `!` for an
  accent.
- `.` holds the previous note.
- `-` releases it.
- `x`, `X` and `o` are drum hits (normal, accented and soft).
- `|` is ignored, so use it to make bars easier to read.

Instruments are synth patches (`wave`, `cutoff`, `resonance`, an envelope,
`unison`, `vibrato`, `echo`) or drums (`{ drum: 'kick' }`). A song can also be
an audio file: `defineSong({ id, src: 'assets/music/theme.ogg' })`.

## Cheats, strings, hero and config

- `src/content/cheats.js`: `defineCheat({ code: 'idclev##', run(game, world, a, b) {...} })`.
  Each `#` matches one digit, and the digits are passed as arguments.
  Return a message to show it.
- `src/content/strings.js` holds all the text: menus, skill names, quit
  messages, the help screen and the finale.
- `src/content/hero.js` sets the starting health, weapons, ammo, speed and
  face (see `assets/custom/README.md` for using a photo).
- `src/content/config.js` sets the key colours and names, the title and
  intermission music, and where the photo portrait goes on the title screen.
- `src/content/palette.js` holds the colour ramps. Change one and run
  `npm run art` to re-theme everything.

## Custom behaviour

When data isn't enough, register code in `src/content/index.js`:

```js
import { defineAction, defineAttack, definePickup } from '../engine/defs.js';

export default {
  // ...
  actions: [
    // { action: 'shake', seconds: 1 } in any trigger
    defineAction('shake', (world, params) => world.message('THE BUILDING SHUDDERS')),
  ],
  attacks: [
    // { kind: 'triple-exception' } in any monster or weapon
    defineAttack('triple-exception', (world, attacker, spec, angle) => {
      for (const d of [-0.2, 0, 0.2]) world.spawnProjectile('exception-fireball', attacker, angle + d, spec);
      return true;
    }),
  ],
  pickups: [
    // pickup: { coffeeBreak: 5 } in any item
    definePickup('coffeeBreak', (world, player, value) => {
      player.health = Math.min(200, player.health + value);
      return true; // consumed
    }),
  ],
};
```

`world` (see `src/engine/world/world.js`) offers:

- `spawn(type, x, y, angle)`
- `damage(target, amount, inflictor, source)`
- `radiusDamage(x, y, radius, damage, inflictor, source)`
- `hitscan(shooter, angle, range, damage)`
- `message(text)`
- `playSound(id)` and `playSoundFrom(id, thing)`
- `map`, `things`, `player`, `rng` and `stats`

## Making a different game

The engine knows nothing about Alex. To start a different game, copy
`src/content/` and change it: the palette, strings, hero, art and levels. Then
point `src/main.js` at the new pack.
