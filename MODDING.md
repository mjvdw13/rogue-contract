# Modding Rogue Contract

Everything that makes this game *Rogue Contract* lives in `src/content/` as
plain data. The engine in `src/engine/` never mentions Star Wars. It only
reads that content pack. Each new monster, weapon, item, level, sound or song
is a small definition in a file, plus one line in an index.

This guide covers each kind of content in turn: monsters, friendly characters, weapons,
items, scenery, levels, textures, sounds, music, cheats and custom behaviour.
All paths are relative to the repository root.

## The workflow

1. Add or change a definition in `src/content/`.
2. Run `npm run validate`. It checks every reference (sprites, sounds,
   projectiles, glyphs, textures), that every file exists, and that each level's
   exit, keys and secrets can be reached from the start. It also prints an
   ammo budget for each level.
3. Reload the game. Jump straight to a level with
   `index.html?map=m1&skill=3`, and add `&god` or `&nomonsters` while
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
  and LEDs. A texture defined with `fullbright: false` (rock, sand) only
  snaps to the lit colours, so no stray pixel of it glows.
- **Sprite sheets:** frames of equal size, left to right and wrapping onto new
  rows. Frame 0 is the top-left frame. A thing shows its front from every
  side unless its animations list `views` (below), and the bottom of the
  frame stands on the floor.
  32 pixels is one tile, so a person about 56 pixels tall stands about 1.75
  tiles high, and fills a 64×64 frame.
- **Glints and glows:** a sheet can list exact colours (`[r, g, b]`) that
  behave differently from the rest of its art. `glint` colours are
  highlights that catch the light, like the shine on a stormtrooper's
  armour: they're lit like the rest of the sprite, but brighten toward
  fullbright when a light source can see the thing, even if it stands in
  shadow, and flash with muzzle flashes and passing bolts. With no source
  about (a canyon at night) they're plain lit white. `glow` colours always
  shine, as if they were fullbright (sparks in an explosion):
  `sheet: { src: '...', frameWidth: 64, frameHeight: 64, glint: [[255, 255, 255]] }`.
  An art override (`assets/custom/overrides.json`) can set its own `glint`
  and `glow` for its art.
- **Textures:** walls and flats are usually 64×64, and span two tiles (32
  texels per tile), about the height of a person. Any power-of-two size from
  16 to 256 works (a door's art is one whole door). Textures are laid out by
  world position, so they run on across tiles; a rising door's art is laid
  out on the door instead. An animated texture is a horizontal strip of
  frames.
- **The built-in art** comes from code in `tools/art/`. Run `npm run art`, or
  `node tools/art/generate.mjs --only stormtrooper --preview`. It uses a small
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
  id: 'scout-trooper',        // unique id
  name: 'Scout Trooper',
  glyph: 'q',                 // its letter in level maps (must be unused)
  sheet: { src: 'assets/sprites/monsters/scout-trooper.png', frameWidth: 64, frameHeight: 64 },
  health: 40,
  speed: 2.6,                 // tiles per second
  radius: 0.3,                // collision radius in tiles
  painChance: 0.6,            // chance to flinch when hit
  reactionTime: 0.4,          // seconds before reacting after being woken
  cooldown: [1, 2.2],         // seconds between attacks (random in range)
  aggression: 0.65,           // how eagerly it attacks when it could
  attack: { kind: 'projectile', projectile: 'trooper-bolt', spread: 0.07, range: 60, sound: 'blaster-enemy' },
  melee: { kind: 'melee', damage: [6, 18], range: 1.1, hitSound: 'punch-hit' },
  anims: {
    idle: { frames: [0, 1], fps: 2, loop: true },
    walk: { frames: [0, 1, 2, 3], fps: 6 },
    attack: { frames: [4, 5, 4], durations: [0.3, 0.15, 0.2], fireAt: 1, fullbright: [1] },
    melee: { frames: [4, 5], fps: 8, fireAt: 1 },
    pain: [6],
    death: { frames: [7, 8, 9, 10], fps: 8 },
  },
  sounds: { sight: 'trooper-sight', pain: 'trooper-pain', death: 'trooper-death' },
  drops: ['power-cell', { item: 'med-kit', chance: 0.25 }],
});
```

**Animations.** Each one is either a list of frame numbers or
`{ frames, fps | durations, loop, fireAt, fullbright, events }`. `fireAt` is
the position (within `frames`) at which the attack happens. `fullbright` lists
the positions that ignore lighting (muzzle flashes). `events` maps a position
to a string such as `'sound:droid-active'`, or to anything a hook wants.
A monster needs `walk` (or `idle`) and `death`. The last death frame stays on
the floor as the corpse.

**Views.** `frames` is the animation seen from the front. Add `views` to show
it from the other sides, as Dark Forces did:

```js
walk: {
  frames: [0, 1, 2, 3], fps: 6,
  views: { frontSide: [12, 13, 14, 15], side: [16, 17, 18, 19], backSide: [20, 21, 22, 23], back: [24, 25, 26, 27] },
},
```

Each view is as long as `frames`, drawn with the figure facing the
viewer's left (so it shows its left side): `frontSide` is the front
three-quarter view, `side` the profile, `backSide` the back three-quarter.
Seen from its right, the art is mirrored, so five views cover eight
directions. A view left out uses the nearest one given. Which one shows
depends on where the thing faces (its placed `angle`; monsters turn to
where they walk and to whom they shoot, NPCs to where they stroll and to
whoever bumps them). Attacks and pain usually face the player, and deaths
can look the same from every side, so `walk` and `idle` are the ones that
need views. A view frame past the end of the sheet draws the front frame,
so an art override can add views the committed sheet lacks.

**Attacks.** An attack is one of:

- `{ kind: 'hitscan', damage: [3, 12], spread: 0.1, range: 24, pellets: 1, sound }`
- `{ kind: 'projectile', projectile: 'trooper-bolt', count: 1, spread: 0 }`
- `{ kind: 'melee', damage: [10, 30], range: 1.1, hitSound }`
- a custom kind (see *Custom behaviour*)

Damage is either a `[min, max]` range or a number.

Attacks are 3D. Monsters aim at the middle of their target's body, and shots
start most of the way up the monster (the player fires from the eye, along
the view's pitch, with a gentle vertical auto-aim that can be switched off in
Options). Bullets and projectiles stop at floors, ceilings and the faces of
steps and ledges, and shots into the sky simply vanish. Explosions measure
3D distance, so a blast on the floor below a ledge doesn't reach over it.

**Other fields:** `scale` (sprite size), `height`, `mass` (knockback),
`sightRange`, `splashImmune`, `bleeds: false` (a puff instead of `blood` when hit: droids), `infighting: false`, `boss: true`,
`renderStyle: 'fuzz'` (shimmering, partly invisible), `countKill: false`,
`stepHeight`, `dropHeight`, `flying: true` with `z` and `flySpeed` (see
*Heights* under Levels).

**Hooks** run your own code: `onSpawn(world, self)`, `onSight(world, self)`,
`onThink(world, self, dt)` (return `true` to skip the normal AI that tick),
`onAttack(world, self, attack)`, `onPain(world, self, source, amount)`,
`onDeath(world, self, source)` and `onEvent(world, self, eventName)`.

## Friendly characters

`src/content/npcs/villagers.js` defines the townsfolk with `defineNpc()`.
Friendlies are solid, so you bump into them, but they can't be hurt.
Bullets, projectiles and explosions pass through them (a projectile with
`hitsSolid` bursts on them, harmlessly), and monsters never
target them. Each one idles and wanders up to `wander` tiles from where it was
placed. It stays out of doorways, hazards and one-tile passages, so it never
blocks the way. When the player bumps into one or presses use on it, it turns to
them, plays `react`, says one of its `lines` (shown as `NAME: line`), plays
`sounds.react` and pops up a `bubble` effect.

```js
defineNpc({
  id: 'moisture-farmer',
  name: 'FARMER',
  glyph: 'z',
  sheet: { src: 'assets/sprites/npcs/moisture-farmer.png', frameWidth: 64, frameHeight: 64 },
  wander: 3,                // tiles from the spot; 0 = stays put
  speed: 0.8,
  idleTime: [3, 6],         // seconds between strolls
  anims: { idle: { frames: [0, 1], durations: [2.8, 1.6], loop: true }, walk: [2, 3, 4, 5], react: [6] },
  lines: ['Vaporators don't fix themselves.', 'Storm's coming in off the Dune Sea.'],
  bubble: 'bubble-dots',    // optional: an effect (defineEffect) that pops up over them
  sounds: { react: 'npc-hmph' }, // optional: any sound id
});
```

Animation frame events like `events: { 2: 'sound:npc-sigh' }` play a sound.
`hooks.onReact(world, self)` and
`hooks.onThink(world, self, dt)` add custom behaviour.

The villagers' sheets are cut from character sheets by
`assets/custom/villagers/cut.py` (Python, Pillow), like the sandtroopers and
the Jawa; see `assets/custom/README.md`.

## Weapons

Make a file in `src/content/weapons/`, add it to `weapons/index.js`, and make a
pickup item for it (see *Items*).

```js
import { defineWeapon } from '../../engine/defs.js';

export default defineWeapon({
  id: 'repeater',
  name: 'REPEATER',
  slot: 3,                        // number key; several weapons can share a slot
  ammo: 'energy',                 // or null for melee
  ammoPerShot: 1,
  priority: 3,                    // auto-switch preference when picking up ammo
  light: { radius: 5, light: 96 }, // the muzzle flash lights the room round you
  sheet: { src: 'assets/sprites/weapons/repeater.png', frameWidth: 128, frameHeight: 96 },
  anims: {
    idle: [0],
    fire: { frames: [1, 2, 0], durations: [0.08, 0.15, 0.2], fireAt: 0, fullbright: [0] },
  },
  fire: { kind: 'hitscan', damage: [5, 15], pellets: 3, spread: 0.06, range: 40 },
  sounds: { fire: 'blaster-fire' },
});
```

View sprites are drawn at the bottom centre of the screen, which is 320×200
pixels at 4:3 (wider on widescreen; the centre stays put). Use `offset: [x, y]`
to nudge yours. `weaponDrop` in `src/content/config.js` lowers every weapon by
the same number of pixels. The HUD panels in the bottom corners draw over the
weapon. The fire animation's length sets the rate of fire. `accurateFirstShot: true` makes a single shot perfectly
accurate when you aren't holding the trigger. New ammo types go in
`src/content/ammo.js` as `defineAmmo({ id, name, short, max, clip })`.
`lockOn: 5` in `fire` aims it Dark Forces' way: of the monsters you can
see, the nearest one within 5° either side of the crosshair (or under it, so
one close up is hard to miss) gets the shot, turned and tilted onto it
however high or low it stands (see `concussion-rifle.js`). Without it,
shots only get Doom's small nudge up or down onto a body already under the
crosshair. Turning auto-aim off in the options turns both off.
`light` is the muzzle flash: on the fire animation's `fullbright` frames it
lights the room round you (see *Glowing things* below). `flashLight: 1`
(0-2) instead brightens the whole view, Doom's way.
`reraise: true` drops the hand out of view after each shot and brings the
next one up (a thrown weapon: see `thermal-detonator.js`); with none left,
it switches to your best weapon with ammo.
`charge: { time: 1, min: 0.2, sink: 36, pull: 0.18 }` throws when fire is
let go instead of when it's pressed. Pressing fire pulls the hand back,
down `sink` pixels over `pull` seconds, and it stays there while fire is
held. The throw's power runs from `min` for a tap to
1 for a hold of `time` seconds or more, and it scales the projectile's
`speed` (and a bouncer's `loft`), so a tap is a short, low toss. Changing
weapon while winding up drops the throw.

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
| `armor: n` | Add shields (armor), up to `maxArmor` (default 200). With `armorClass: 1` or `2`, set it to `n` with that absorption (⅓ or ½) |
| `ammo: { energy: 15 }` | Give ammo (doubled on the easiest and hardest skills) |
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
  Give one `bounce` to make it bounce instead of bursting on what it hits
  (a thrown detonator, `detonator-thrown`):

  ```js
  gravity: 28,
  bounce: {
    toss: 4.25,         // thrown along your aim, plus this much upward speed
    loft: 8.75,         // and this much more times the throw's power (a weapon's `charge`)
    restitution: 0.55,  // share of its speed into a wall or floor it keeps (0-1)
    friction: 0.75,     // share of the rest it keeps at each bounce (0-1)
    minSpeed: 1.5,      // slower than this into the floor, it stops bouncing and rolls
    roll: 3,            // rolling, it loses this much of its speed a second
    fuse: 2.5,          // seconds until it goes off (at once on a body)
  },
  sounds: { bounce: 'detonator-bounce', explode: 'detonator-explode' },
  ```

  It bounces off walls, floors, ceilings, doors and solid scenery, and a
  lift rising under it carries it up. Its `bounce` sound plays on each
  knock harder than `minSpeed`. It goes off where it lies (its `explosion`
  facing up off the floor), with its `splash`, which can hurt its thrower.

  A `splash` hurts every body within `radius` of the burst (walls and
  floors shelter them), `damage` falling off with distance. Dark Forces'
  concussion rifle (`concussion-shot`) works another way:

  ```js
  damage: 0,          // no damage itself; the splash does it all
  splash: {
    radius: 3.3,
    damage: 60,
    falloff: false,   // every body caught takes the full damage
    erupt: 'concussion', // an explosion going up from the floor under each one
  },
  ```

  With `erupt`, one more goes up from the floor where it struck a wall or
  floor, but none where it hit a body (that body erupts already). A
  projectile with no `sheet` flies unseen.

  A projectile flies through what it can't hurt, except solid model
  scenery. `hitsSolid: true` bursts it on anything solid as well (sprite
  scenery such as crates, and friendly characters, who still take no harm).
  The concussion shot has it, since it's unseen.
- **Effects** such as puffs, blood and sprite explosions use
  `defineEffect({ id, sheet, anims: { idle } })`. An effect disappears when its
  animation ends.

**Glowing things.** Any thing can have `light: { radius, light }`: while it
shows a fullbright frame (all the time, if the whole thing is `fullbright`,
like a bolt or an explosion) it lights the tiles round it, adding up to
`light` at its centre and fading out at `radius` tiles. The light spreads
through open tiles, never through walls or shut doors, and is worked out
every frame, so a bolt lights the walls it flies past. Effects and bursting
projectiles fade as their animation plays. On a monster it's the muzzle
flash, on its attack's `fullbright` frames:

```js
light: { radius: 3.5, light: 80 }, // a stormtrooper's muzzle flash
```

### 3D models

Low-poly models are drawn in true 3D, like Dark Forces' 3DO objects:
clipped by walls and ledges, and hiding sprites behind them. A model is
defined with `defineModel` (see `src/engine/defs.js`) and listed in
`src/content/models/index.js`; a decoration places it:

```js
defineDecoration({ id: 'terminal', model: 'terminal', solid: true, radius: 0.55, height: 1.1 })
defineDecoration({ id: 'reactor-ring', model: 'reactor-ring', spin: 0.5 }) // radians per second
```

- **Units and axes:** world units (a tile is 1, the player 1.76 tall), the
  origin on the floor under the thing; at angle 0 the model faces east (+x),
  y is south, z up. The level's `angle` turns it, `scale` sizes it, and a
  thing's `z` places it at a height instead of on the floor.
- **Faces** are convex polygons wound so the right-hand normal points out.
  Each has a `color` (`[ramp, 0..1]` or `[r, g, b]`) or a `tex` with `uv`
  (texture repeats) or `uvw` (world units, at the walls' scale). `glow`
  makes a face fullbright (animated textures keep animating), and `twoSided`
  draws it from behind too. Faces are shaded by a fixed light from above.
- **Building in code:** `ModelBuilder` in `src/content/models/lib/build.js`
  makes boxes, prisms, lofts (tapered prisms) and cylinders along any axis,
  winds their faces, and projects textures upright at the walls' scale.
- **From Blender:** export OBJ (Y up, -Z forward) with materials, then
  `node tools/import-model.mjs ship.obj --glow Lights`. A material whose
  texture file is named after a game texture uses it; others use their
  colour. Keep models to a few hundred triangles (the validator warns over
  400).
- **Collision:** a solid model collides as its cylinder (`radius`,
  `height`), or as its `lines` (wall segments in model space) when it has
  them, for long shapes like a ship. Solid models stop shots and
  projectiles. The level checker treats the tiles under the lines as
  blocked, and the map viewer draws them in pink.

### Particles

Sparks, embers, shrapnel, smoke, steam and dust are **particles**: points
and small discs drawn straight into the frame, far cheaper than sprites, so
a scene can have hundreds. They're defined in `src/content/particles.js`:

```js
defineParticle({
  id: 'spark',
  colors: [{ ramp: 'glow-yellow', from: 6, to: 0 }], // white-hot to red over its life
  life: [0.4, 1],     // seconds, picked at random between the two
  size: 0.02,         // world units; drawn 1 to maxPx pixels across
  streak: 0.04,       // draw a streak back along its velocity, this many seconds long
  fullbright: true,   // glows (otherwise it's lit by the light where it is)
  blend: 'add',
  gravity: 6,         // units per second per second (negative rises)
  bounce: 0.5,
  onFloor: 'bounce',
  walls: 'bounce',
  cap: 400,
})
```

- `colors`: the colour over the particle's life, first to last. Each entry
  is a palette ramp and a step counted from its dark end (`['gray', 9]`),
  or `{ ramp, from, to }` for every step between two (either way round).
- `shape`: `'square'` (the default; dots and small squares, `maxPx`
  default 3) or `'disc'` (round puffs for smoke and steam). `maxPx` is at
  most 64: a big disc right in front of you still stops at 64 pixels.
- `blend`: `'solid'`, `'add'` (glows: sparks, fire), `'half'` (see-through:
  smoke) or `'dither'` (a screen-door pattern that thins out as the particle
  ages; `alpha` sets how solid it is at its most, and `fadeIn`, the share
  of its life it takes to fade in, so mist doesn't pop up). `fade: true`
  makes an `add` or `half` type thin out the same way: soft while it's
  strong, and still fading in and out. `fadeOut` is the share of its life
  it spends fading out, at the end (1, the default: its whole life), so a
  fireball can stay solid and then go.
- `grow`: a disc or square swells to this many times its `size` by the end
  of its life (a fireball 2.5, smoke 2); below 1 it shrinks.
- `trail: { type: 'smoke-wisp', every: 0.08, for: 0.8 }`: while it flies,
  it drops one particle of `type` every `every` seconds, for its first
  `for` seconds (all its life if left out), and none once it lies on the
  floor. Burning debris trails smoke this way. Trails count against their
  own type's cap.
- `drag`: the share of its speed lost per second (toward the wind, for
  types with `wind`). `wind`: how much of the level's wind carries it (1:
  all of it).
- `onFloor`: `'die'` (the default), `'bounce'` or `'stick'` (lies there
  until its life is up; it still bounces off a hard landing). `walls`:
  `'die'` (the default) or `'bounce'`. Particles stop at ceilings.
- **Caps:** at most 1000 points and 150 discs live at once (discs cost by
  the pixels they cover); past that, new ones aren't made. `cap` limits one
  type within those, so smoke can't crowd out sparks.

Code makes them with `world.particles.burst('spark', x, y, z, { count: 20,
dir: [1, 0, 0.5], spread: 0.6, speed: [2, 5] })` (`spread` 0 is straight
along `dir`, 1 a hemisphere round it, 2 all round) or one at a time with
`world.particles.spawn('smoke', x, y, z, vx, vy, vz)`. Particles are only
for looks: they never touch the game's random numbers, so they can't change
what happens.

Content throws bursts too. A monster (or a shootable decoration) with
`death: { particles: [{ type: 'shrapnel', count: 30, speed: [2, 6] }] }`
throws them from the middle of its body when it's killed; each burst takes
the same `count`, `dir`, `spread` and `speed`. With `corpse`, the wreck
keeps sparking once it has landed, as the probe droid's does:

```js
corpse: {
  bursts: [3, 5],      // how many (a number, or a range)
  every: [0.25, 0.9],  // seconds between them; the first comes this long after it lands
  z: 0.3,              // how high above the floor they start (the default)
  particles: [{ type: 'spark', count: 14, speed: [2, 5] }],
},
```

Each corpse burst shoots one way, picked at random (up and out), in a tight
jet (`spread` 0.3 unless it says otherwise).

To see what they cost, serve the repo and open `tools/particles.html`: it
runs Mission 1 with any number of one type in front of you, and times them.

### Explosions

An **explosion** is a named recipe of particle bursts with a flash of light,
set off by id wherever one is wanted. The styles are in
`src/content/explosions.js`:

```js
defineExplosion({
  id: 'small',
  light: { radius: 5, light: 112, time: 0.45 }, // a flash that fades over `time` seconds
  sound: 'rocket-hit',  // optional
  effect: 'explosion',  // optional: a sprite effect played with it
  particles: [
    { type: 'fire', count: 10, speed: [0.5, 2.5], radius: 0.15 },
    { type: 'spark', count: 10, speed: [3, 7] },
    { type: 'debris', count: 5, speed: [3, 6] },
    { type: 'ember', count: 10, speed: [0.5, 1.5], dir: 'up', spread: 0.8, delay: 0.1, over: 0.4 },
    { type: 'blast-smoke', count: 6, speed: [0.2, 0.6], radius: 0.25, dir: 'up', delay: [0.15, 0.25], over: 0.4 },
  ],
})
```

Each burst takes `type`, `count`, `speed` and `spread` as above, and:

- `delay`: seconds before it starts (or `[min, max]`), so smoke can follow
  the fire. `over`: its `count` comes out spread over this many seconds
  instead of all at once.
- `radius`: each particle starts anywhere within this distance of the
  centre, so a fireball fills a ball rather than growing from a point.
- `z`: start this far above the centre.
- `dir`: `'up'`, a vector `[x, y, z]`, or `'out'` (the default): the way
  the explosion faces. One set off against a wall or on the floor faces
  out of it, and its `'out'` bursts keep to that side (a hemisphere at
  most); one in mid-air throws them all round.
  `'ring'` throws them flat instead, across the way it faces: a ring
  running out along the floor or the wall it hit (round the upright in
  mid-air), like the flat flash of the `concussion` style.

A style can set off others after it with `then`, say a second, smaller
blast beside the first (`large` does this with `secondary`, a fireball
with no shrapnel or smoke of its own):

```js
then: [{ explosion: 'secondary', delay: [0.2, 0.3], offset: [0.6, 0.9], z: 0.2 }],
```

`delay` is seconds after this one, `offset` how far to the side (a random
way, never back into the wall or floor it hit, and stopping short of any
wall), `z` how much higher. Each can be a number or `[min, max]`. The
validator refuses a loop (a style that, through `then`, sets itself off).

A style can shake the view too. `extra-large` shakes it the hardest:

```js
shake: { amount: 1, time: 0.6, radius: 16 },
```

The rest shake it less, the smaller the blast, for a shorter time and from
nearer: `large` 0.6, `concussion` 0.45, `small` 0.35, `dirt` 0.3,
`secondary` 0.25 (on top of the blast that set it off), `sparks` just a
tick (0.1, within 4 tiles). Keep 1 for the really big ones.

`amount` is how hard right beside it, above 0 and at most 1 (the hardest
the engine shakes). It dies away fast, then slowly, over `time` seconds
(0.5 if left out), and is weaker the farther you are, with none from
`radius` (12) away. Shakes close together add up, still at most 1. Only
the view moves: the eye jolts up and down, the view tips and turns a
little, and your aim stays where it was.

Set one off with:

- `death: { explosion: 'large' }` on a monster or shootable decoration
  (where it dies, from the middle of its body);
- `explosion: 'small'` on a projectile (where it bursts, facing out of the
  wall, floor or ceiling it hit);
- the trigger action `{ action: 'explode', explosion: 'large', tag:
  'reactor' }` (or `x, y`), `z` above the floor (0.5 by default);
- code: `world.explode('large', x, y, z, { dir: [1, 0, 0] })`.

Explosions are only for looks: the damage stays with `explode` (things)
and `splash` (projectiles). Keep an eye on the caps: one `large` (with its
`secondary` after it) uses about 73 of the 150 discs at its peak, and one
`extra-large` (a fireball that fills a hall, of discs up to 64 pixels
across) about 70, so two at once already crowd each other. The bench page (`tools/particles.html`) sets them off on the floor,
in the air or on the wall in front of you, once or every few seconds, with
the real caps and a count of what's live.

## Levels

A level is an ASCII map. Add a file in `src/content/levels/`, import it in
`src/content/levels/index.js`, and put its id in an episode's `levels` list.
`sandbox.js` is a typed map like the one below; Mission 1 (`m1.js`) is too
big to type, so it's painted in code by `levels/lib/painter.js` (rooms,
chamfers, stairs, lifts), which hands the game an ordinary map.

```js
import { defineLevel } from '../../engine/defs.js';

export default defineLevel({
  id: 'm2',
  mapLabel: 'M2',
  name: 'THE HOMESTEAD',
  music: 'garrison',
  sky: 'sky-night',
  par: 120,                  // seconds, shown on the tally screen
  fog: 0.05,                 // extra darkness with distance (the default)
  haze: { color: [32, 24, 64], half: 40 }, // outdoors, fade to this colour
  tiles: [
    '###########',
    '#....#....#',
    '#.:..D..:.#',           // D: a door, : a bright floor tile
    '#....#....#',
    '#1#########',           // 1: a door that needs the blue keycard
    '#.#',                   // short rows are padded with solid nothing
    '#X#',                   // X: the exit switch
  ],
  things: [
    '',
    ' >  b  t',              // player start facing east, blue keycard, stormtrooper
    '        h',             // a med kit
  ],
  legend: {},                // per-level tile glyphs (see below)
  thingLegend: {},           // per-level thing glyphs
  triggers: [],
});
```

Surfaces get darker with distance: nearby ones brighten (like Doom), and
`fog` darkens far ones a little more (colormap levels per tile). A space lit
at 144 reads at 10 m; one at 104 stays dark. With `haze`, surfaces under the
sky (seen from a sky tile) fade toward the haze colour with distance
instead, halfway there at `half` tiles (40 by default): a night canyon
fades into purple air rather than black. Pick a colour like the sky's near
the horizon. Indoors, haze changes nothing.

### Tiles

The shared glyphs are in `src/content/levels/legend.js`, and each level can add
more or override them in `legend`. A glyph means one of these:

```js
// A wall:
'#': { wall: 'imp-panel' },
// A floor (the ceiling: 'sky' opens it to the sky):
'.': { floor: 'imp-floor', ceiling: 'imp-ceiling', light: 160 },
// A door ('rise', 'slide' or 'split'; lock: 'blue' | 'yellow' | 'red' | 'remote'):
'D': { door: 'imp-door', jamb: 'imp-jamb', upper: 'imp-lintel', style: 'rise' },
// A switch (use it to run actions):
'X': { wall: 'imp-switch', use: 'exit', switchTo: 'imp-switch-on' },
// Copy another glyph and change some of it:
'a': { base: '.', light: 220, lightFx: 'flicker', tag: 'hall' },
```

Floor options:

- `light`: 0–255. 120 is dark, 160 is normal, 200 and up is bright. Light
  is smooth: a tile's light is its centre's, and in between it blends from
  tile to tile (never through a wall), dithered between shades. So a pool of
  light fades into the floor round it, and lights the walls beside it.
- `lightFx`: `'flicker'`, `'strobe'`, `'blink'`, `'glow'` or `'fire'`.
  Neighbouring tiles that share a glyph flicker together.
- `lightMin`: the low end of the effect (16–255). By default it is 96 below
  `light`; a pulse that barely dims, say, is `light: 152, lightMin: 120`.
- `lightSync`: a name. Tiles with the same name and effect change together,
  wherever they are, each between its own `light` and `lightMin`: a graded
  pool pulses as one.
- `damage`: hurts every second while standing on it (waders protect).
- `secret: true`: entering a connected group of these counts as one secret.
- `exit: true`: stepping here ends the level.
- `tag`: a name that triggers and actions can refer to.

A level's `occlusion` (light units, 0 by default) darkens the light toward
walls, as if corners caught less of it. In a painted level,
`p.pool(cx, cy, r, light, extra)` paints a round pool of light: tiles within
`r` of the centre brighten toward `light`, fading to their own light at the
rim, and get `extra` (say `{ lightFx: 'glow', lightSync: 'core' }`).

### Wall bands

A wall can change texture with height: Imperial panels with the cliff's
rock above them, or a trim along the floor.

```js
'W': { wall: 'imp-panel', bands: [{ from: 8, tex: 'sandstone' }, { to: 0.5, tex: 'imp-stripe' }] },
```

A band covers from `from` up to `to` (leave one out and it runs on up or
down); the first band that covers a height wins, and the wall's own texture
fills the rest. A band's texture hangs from its top (from the face's top if
it runs on up), so it lines up across walls of different heights. On an
open tile or a doorway, `bands` change the faces of its raised floor and
lowered ceiling (a gate's lintel) the same way. The map viewer shows a wall
by its top band.

### Decals

Signs, crests, hazard stripes and vents go on wall faces as decals: see-through
pictures over the wall (or a step's face, or a doorway's lintel). A level
lists them in `decals`:

```js
decals: [
  // The crest over the gate: on the face looking south along the edge at y 40.
  { x: 48, y: 40, z: 6, face: 'S', tex: 'decal-crest', scale: 1.5 },
  { x: 56, y: 16, z: 8.4, face: 'S', tex: 'decal-sign' },
],
```

- `face`: the way the face looks, `'N'`, `'E'`, `'S'` or `'W'`. It's the face
  along the tile edge nearest (`x`, `y`): `face: 'S'` at `y: 40` is the south
  face of the walls in row 39, seen from row 40.
- `x` or `y` along the edge is the decal's middle, and `z` the height of its
  middle.
- Its size is its texture's (32 texels a tile, so a 64x64 picture is 2 tiles,
  a metre) times `scale`. Transparent texels show the wall.
- `glow: true` ignores the light (a lit screen); `flip: true` mirrors it.

Decal textures are defined with `decal: true` (`src/content/textures.js`) and
drawn by `tools/art/textures/decals.js`. The map viewer marks decals with a
white tick.

### Backdrop: terrain past the edge of play

A level under the sky can have a backdrop: rock (cliffs, slopes, mesas)
beyond where anyone can go, drawn wherever the sky would show, in real
perspective. It's a coarse height grid, so the skyline has depth: slopes
going back, ridges behind ridges, fading into the haze as you move.
Nothing stands on it, hits it or sees through it; it only replaces sky.

```js
backdrop: { x: -96, y: -96, cell: 1, w: 320, h: 292, heights, tex: 'sandstone', light: 168 },
```

`x`, `y` are its corner in tiles, `w` x `h` its size in cells of `cell`
tiles, and `heights` the (w + 1) x (h + 1) corner heights, row by row. Its
faces take `tex` (or `bands` of textures by height, as for walls). It's lit
by `light`, shaded by its slopes against the `moon` direction (default from
the north-west, high up), and drawn out to `far` tiles (256). Keep it low
over the playable area: it's drawn behind the level's walls, so a peak in
the middle of a canyon would show above the canyon's rims.

`canyonBackdrop(p, { rim, tex, light })` (`src/content/levels/lib/backdrop.js`)
makes one for a painted level: low over its open sky, starting at the
canyon's rim (`rim(x, y, floor)` gives its height) and climbing away in
smooth slopes and ridges, out to 96 tiles past the map. Mission 1 ends its
canyon walls in a low rim of rock (one tile out of reach, with its sky just
above it so the view ends there) and lets the backdrop take over above it.

### Light sources

A lamp, a light strip or a floodlight is a light source: it adds light to
the floor, walls and things round it, and walls cast its shadows. A level
lists them in `lights`:

```js
lights: [
  // A ceiling lamp: 96 more light under it, fading out 5 tiles away.
  { x: 20.5, y: 14.5, radius: 5, light: 96 },
  // A warning beacon, pulsing with the tiles that have `lightSync: 'alarm'`.
  { x: 31, y: 8, radius: 4, light: 120, fx: 'glow', min: 20, sync: 'alarm' },
  // A lamp on a catwalk (a slab whose top is at 3): it lights the top.
  { x: 12.5, y: 6.5, z: 4, radius: 4, light: 80, tag: 'gen-lamps' },
],
```

- `x`, `y`: where it is (tiles; 20.5 is the middle of tile 20).
- `radius`: how far its light reaches (tiles). It's brightest at its centre
  and fades smoothly to nothing at the radius.
- `light`: how much light it adds at its centre (light units; tiles have
  0–255, and the total stops at 255).
- `z`: its height. Where a slab is, it lights the storey it's in: on the
  slab, or (without a `z`) under it. Elsewhere there's one storey to light.
- `fx`, `min`, `sync`: an effect like a tile's (`'flicker'`, `'glow'` ...),
  swinging between `light` and `min` (0 by default: fully off). With a
  `sync` name it keeps time with the tiles of that `lightSync` and the other
  sources with that `sync`.
- `tag`: `setLight` with the tag sets its `light` (and effect), so a
  trigger can switch it off: `{ action: 'setLight', tag: 'gen-lamps', light: 0 }`.
- `glint: false`: it doesn't make glints shine (see Art). Otherwise a source
  makes glints catch its light out to twice its radius, where it can see.

It lights the tiles whose centres it can see. Walls, angled walls and doors
block it (doors are shut when it's worked out, so it stays in its room). A
light source shows as a ringed white dot in `tools/mapview.mjs`, and its light
in the floor round it. Light sources cost nothing to draw; one with an effect
costs a little each time it changes.

### Heights

Every floor tile has its own floor and ceiling height, in world units: one
unit is one tile, or 32 texels of a wall texture. The grid is fine: a person
is about two tiles tall and one tile wide, so a corridor is usually 3-4 tiles
wide and a doorway 2-3. The defaults, `floorZ: 0` and `ceilZ: 2`, give a low,
flat room.

```js
'h': { floor: 'imp-floor', ceiling: 'imp-ceiling-light', floorZ: 1, ceilZ: 5, side: 'imp-panel-dark' },
'p': { base: 'h', floorZ: -1.5 },                // a pit
'v': { base: '.', floorZ: 0.5, ceilZ: 2 },       // a crawl space: crouch to get in
```

A map drawn for the old coarse grid (one tile per metre) can be converted
with `node tools/upscale-map.mjs <level-id>`: every tile becomes 2x2, heights
double, things move with them, and angled walls are split across the new
tiles. Copy the comments across by hand, and halve the level's own `fog` if it
set one.

- `floorZ` / `ceilZ`: the heights. A solid wall is drawn from the floor to the
  ceiling of the tile in front of it, so a tall sky courtyard (`ceiling: 'sky',
  ceilZ: 6`) gets tall walls.
- `side`: the texture on the faces of a raised floor (steps, ledges, platform
  edges). It defaults to the floor texture.
- `upper`: the texture under a lowered ceiling (the lintel above a door, the
  mouth of a vent). It defaults to `side`, then to the ceiling texture.
- Level-wide defaults go in the level's `defaults: { floorZ, ceilZ, side, upper }`.

For stairs and terrain, a level can paint heights over the tiles with
`floorHeights` and `ceilHeights`. These grids line up with `tiles`. Each
character is a number of `heightStep`s (default 0.25) above `heightBase`
(default 0): `0`-`9`, then `a`-`z` for 10-35. A space or `.` keeps the
legend's height.

```js
floorHeights: [
  '',
  '         1234',    // four steps of 0.25 up to a 1-high platform
],
```

How the player moves (all overridable in `hero.js` as `body: {...}`): steps up
to 0.8 are walked up, a jump rises about 1.26, and anything up to about 1.56
can be jumped onto. The standing body is 1.7 tall and 1 wide (radius 0.5), or
1 tall crouched. A space must be at least that tall to move through, measured
as the lowest ceiling minus the highest floor under the player. Falls faster
than 18 units per second (about a 6-unit drop) hurt.

Monsters walk up steps of up to 0.8 (their `stepHeight`) and won't walk off a
drop deeper than their `dropHeight` (by default the same as the step), so a
monster on a ledge stays up there unless stairs lead down. A blast can still
knock it off, and it falls. Monsters find their way along routes their body
fits: the step and drop limits, and ceilings at least as high as they are
tall. A `flying: true` monster ignores floors: it hovers `z` above the floor
its target stands on (the probe droid hovers at 0.9), climbs over ledges in
its way at `flySpeed` (default 3 a second), and falls when it dies. Give
walking monsters a radius of 0.5 at most, so they fit on a one-tile step.

Doorways are usually wider than one tile. Neighbouring door tiles of the
same door (the same `door` texture, `style`, `lock` and `tag`) are one door:
they open and close together. Their other fields may differ, say a different
`upper` on each side.

Door options:

- `jamb`: the texture of the walls beside the door (a rising door's recess).
- `style`: how it opens.
  - `'rise'` (the shared doors): Dark Forces-style. The doorway is an open
    recess, and the door is a thin panel standing across the middle of its
    depth (in a doorway 2 tiles deep, 1 tile back from each face), which
    slides up into the top of the opening. You can step into the recess;
    the panel stops bodies, sight and shots, and a half-open door lets shots
    pass under it. The opening is as tall as its own `ceilZ` if you give
    one, else the lowest ceiling beside it. Where a room's ceiling is
    higher, the wall above the opening is the door tile's `upper` texture
    (the lintel; default: the jamb). The door's art is fitted to the doorway,
    centred and hung from its bottom edge, so a texture the doorway's size
    shows once (the shared `imp-door` is 2×2, `imp-gate` 4×4). The jambs
    are half the wall's thickness deep: in a wall 1 tile thick they're half
    a tile, so use `imp-jamb` (16 wide); in a wall 2 tiles thick use
    `imp-gate-jamb` (32 wide). `imp-lintel` (lights along its bottom edge,
    for a lintel 1-2 tall) goes above.
  - `'slide'` (the default): a panel through the middle of the tile slides
    sideways.
  - `'split'`: an elevator-style panel that opens from the middle.
- `secret: true`: the door looks exactly like the wall around it (give it that
  wall's texture), stays open, and hides from the automap and from monsters
  until it's found.
- `lock: 'remote'`: only triggers can open the door. Like any door it shuts
  again after `wait` seconds, and the player can't reopen it, so a remote
  door opened once (a one-shot switch or trigger) on the way through needs
  `stayOpen: true`. The level checker counts a remote door as passable only
  if it stays open, or if what opens it can be used again (`repeat` on a
  switch, `once: false` on a trigger).
- `stayOpen: true`: once open, the door stays open.
- `speed`: how much of the door opens (or closes) per second, default 3.5:
  under 0.3 seconds, Star Wars-fast.
- `wait`, `tag` and `sounds` are also available.

Doors need walls on two opposite sides. A space is solid nothingness: keep
every floor tile enclosed by walls (the validator checks this).

### Angled walls

A floor tile can hold one angled wall: a line across the tile, solid on one
side and open floor (with the tile's own floor, ceiling and heights) on the
other. Give the entry a `wall` texture plus either a 45° preset or a line:

```js
'{': { base: '.', wall: 'tech-panel', diagonal: 'NW' },        // chamfered corner, NW solid
'i': { base: '.', wall: 'concrete', line: [1, 0.5, 0, 1] },    // any angle
```

- `diagonal`: `'NE'`, `'NW'`, `'SE'` or `'SW'` names the corner that is
  solid. Four of them around a point make a diamond pillar.
- `line: [ax, ay, bx, by]`: two points on the tile's edges, in tile units
  (0 to 1, y down). The solid side is on the right as you go from the first
  point to the second, looking at the map as drawn. Chain tiles for longer
  or shallower walls. For example `[1, 0.5, 0, 1]` then `[1, 0, 0, 0.5]` in
  the tile to its east makes a wall about 26.6° off horizontal across two
  tiles.

The wall texture runs along the line at 32 texels per unit, so it isn't
stretched. Players and monsters slide along angled walls, and shots, sight
and projectiles stop at them. Monsters path through these tiles like open
floor and let collision keep them out of the solid part. Put walls (or more
angled tiles) against the solid side; it renders as wall if you can see it.

### Fences: railings, bars and grates

A floor tile can carry a see-through wall on any of its edges, like Dark
Forces' transparent walls. Transparent pixels in the texture are holes you
see and shoot through:

```js
'r': { base: '.', fence: { tex: 'imp-railing', edges: 'E', height: 0.75 } },  // a railing on the east edge
'b': { base: '.', fence: { tex: 'imp-bars', edges: 'NS' } },                  // bars, floor to ceiling
```

- `tex`: a fence texture (see Textures).
- `edges`: which edges of the tile, any of `N`, `E`, `S` and `W`. The tile
  beyond the edge must be open floor too (not a wall).
- `height`: how high the fence stands on the tile's floor. Without it, it
  runs from the floor to the ceiling. The texture hangs from the fence's top
  and repeats down. A fence on a lift rides with it.

Bodies can't pass a fence below its top, so you can jump over a low railing
but not through bars. Sight, shots and projectiles go through (the holes and
the bars alike). Monsters don't path across a fenced edge, except flyers over
a low one, and the validator's reachability check never crosses one. Sprites
and 3D models behind a fence show only through its holes. The map viewer
draws fences as pale lines (dashed when low).

In a painted level, `p.fence(x0, y0, x1, y1, 'E', { tex, height })` puts a
fence on that edge of every open tile in the box.

### Two storeys: slabs

A floor tile can hold a slab: a solid layer partway up its open space. That
gives the tile two storeys, one under the slab and one on top, so you can
walk under a bridge, dig a room under a courtyard, or put a walkway over a
hall:

```js
// A bridge across a tall hall: walk under it on the floor, or along its top.
'=': { base: 'h', slab: { bottom: 3, top: 3.5, floor: 'imp-grate', side: 'imp-stripe', ceiling: 'imp-panel-dark', light: 120 } },
// The same with a railing along its north side (it stands on the slab).
'n': { base: '=', fence: { tex: 'imp-railing', edges: 'N', height: 0.75 } },
```

- `bottom` / `top`: the slab's underside and top. The lower storey runs from
  the tile's floor up to `bottom`, the upper one from `top` up to the
  tile's ceiling (or sky). Both must have some height.
- `floor`: the texture on the slab's top. It defaults to the tile's floor.
- `ceiling`: its underside. It defaults to the tile's ceiling (or its
  `floor`, under a sky).
- `side`: its edges, seen where the slab ends. It defaults to the tile's
  `side`.
- `light`: the lower storey's light. The tile's own `light` lights the upper
  one.

Each storey can have its own walls, with the heights you already have. A
wall on the upper storey standing over open space below is a tile whose
ceiling stops at the slab's underside (`ceilZ: 3`, no slab); a wall on the
lower storey under an open upper floor is a raised floor up to the slab's
top (`floorZ: 3.5`). So rooms can stand on rooms with different layouts.

The player and monsters are in the upper storey when the slab's top is
within their step (or a jump's reach), else in the lower one: you can't
walk into a slab's edge, you bump your head on its underside, and you drop
off the end of a bridge. Shots, projectiles, sight and explosions keep to
their storey too. A fence on a slab tile stands on the slab, so a railing
along a bridge stops bodies on top and lets them walk underneath.
Monsters plan routes over and under bridges.

Things are placed in the lower storey unless their `z` puts them on the
slab: `{ type: 'stormtrooper', x: 20.5, y: 12, z: 3.5 }` stands on the
bridge, and so can the player start. A monster's drops land on the storey
it died on.

Not yet: a slab in a door, lift or angled-wall tile (the validator says
so), more than one slab per tile, and slabs that stop sound.

### Lifts

Give a floor glyph a `lift` and its tiles become a lift (an elevator, in Dark
Forces' terms). Connected tiles with the same glyph move together.

```js
'e': { base: '.', floor: 'elevator-floor', side: 'rust-panel', tag: 'cargo',
       lift: { stops: [0, 1.25], mode: 'return', speed: 1.5, wait: 3 } },
```

- `stops`: floor heights it moves between. It starts at `stops[start ?? 0]`.
- `mode`:
  - `'return'` (the default): goes to the next stop, waits `wait` seconds,
    and comes back.
  - `'toggle'`: moves one stop per activation and stays there.
  - `'cycle'`: runs between its stops on its own (`auto: false` to hold it).
- `on`: what starts it, `['enter', 'use']` by default. `'enter'` means
  stepping onto it. `'use'` means pressing use while on it or facing it.
  Triggers can start it too, with `{ action: 'lift', tag, to }`.
- `moves: 'both'` carries the ceiling along too (a closed cab).
- `speed` is in units per second. `sounds: { start, stop }` override
  `lift-start` and `lift-stop`.

Things standing on a lift ride with it. A lift that would squeeze someone
against the ceiling turns back.

### Things

The `things` grid lines up with `tiles`. Put a thing's glyph on a floor tile.
The player start is `^ > v <` (facing north, east, south or west). Every
monster, item and decoration has a `glyph` in its definition. Glyphs for
skill-specific placement are in the shared `things` legend: `!` is a
stormtrooper on skill 3 and up, and `+` is a med kit on skills 1–2. Add your own in
`thingLegend`:

```js
thingLegend: {
  Z: { type: 'probe-droid', tag: 'closet-droids' }, // tag it for triggers
  9: { type: 'sandtrooper', skill: [3, 4, 5] },     // only on these skills
  8: { type: 'jawa', ambush: true, angle: 'W' }     // ambush: waits until it sees you
},
```

A monster can carry extra drops of its own, on top of its type's `drops`:
`{ type: 'officer', drops: ['keycard-red'] }` drops the red keycard where
it dies. The validator and the reachability check count a key that a
reachable monster always drops (chance 1) as placed.

You can also place things precisely with
`list: [{ type: 'med-kit', x: 3.5, y: 7.25 }]`. A `z` there puts a thing (or
the player start) on top of a slab rather than under it.

### Triggers and actions

```js
triggers: [
  { on: 'start', do: [{ action: 'message', text: 'THE HOMESTEAD. TWIN SUNSET.' }] },
  { on: 'enter', tag: 'hall', do: [{ action: 'openDoors', tag: 'closet' }] },
  { on: 'use', tag: 'panel', do: ['exit'] },
  { on: 'pickup', thing: 'keycard-red', do: [{ action: 'spawn', thing: 'stormtrooper', tag: 'spawn-spot' }] },
  { on: 'killed', tag: 'closet-droids', do: [{ action: 'setLight', tag: 'hall', light: 200 }] },
  { on: 'killed', thing: 'boba-fett', do: [{ action: 'finale' }] },
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
- `setLight` `{ tag, light, lightFx?, lightMin? }`: without `lightFx`,
  tiles keep their effect and its range. With it (`'none'` for still), all
  the tagged tiles change together with the new effect, from `light` down to
  `lightMin`. Light sources with the tag get `light` as their strength (and
  `lightFx` and `lightMin` as their effect).
- `lift` `{ tag, to }`: starts the lifts with the tag (to stop index `to`, or
  the next stop)
- `teleport` `{ tag, angle }`: moves the player to the first tile with the tag

### Checking a level

- `npm run validate` reports problems such as an unreachable exit, a key that
  can't be found, a sealed-off secret, a thing inside a wall, unknown glyphs,
  doors without walls, or a low ammo budget.
- Reachability knows heights, using the hero's `body`. The player walks up
  steps of up to 0.8 and jumps onto ledges of up to about 1.56, less under a
  low ceiling. Any drop is allowed. Crouching gets through spaces 1 high.
  Lifts reach every stop. A running jump clears a gap of up to four tiles,
  landing no higher than a step.
- `npm run validate -- --verbose` also lists unreachable items and one-way
  areas: places the player can drop into but never get back out of to the
  start. Some are on purpose, but a pit with no lift or stairs out is a trap.
- `node tools/mapview.mjs m1` writes `tools/art/out/maps/m1.png`, a
  top-down picture with monsters in red, items in yellow, keys in their colour
  and unreachable floor cross-hatched. Floors are shaded by height (higher is
  brighter), with a black edge where a ledge is too high to walk up and a grey
  one at a step. Lifts have an orange frame, and crouch-only spaces a cyan
  one. A slab tile shows the slab's top in a dotted white frame. Add
  `--skill 5` to see nightmare placement.
- The reachability check treats each storey of a slab tile as its own place:
  an item on a bridge you can't climb onto is unreachable, even if you can
  walk under it.

Tips from the built-in maps:

- Give each level two or three secrets and a key or two.
- Aim for an ammo budget of about 2× (the validator shows it).
- Make the start room quiet. Monsters wake up when they hear gunfire, unless
  a closed door is in the way.

### Episodes

`src/content/levels/index.js` defines the episodes:
`defineEpisode({ id, name, levels: [...], map, finale: { text, background, endImage, endText, music } })`.
If there is more than one episode, the menu asks which one to play.

`map: { spots: { m1: [160, 100], ... } }` places each level on the
intermission picture (`assets/ui/intermission.png`). Spots are in the
picture's centre 320×200, which is all a 4:3 screen shows. Full-screen
pictures can be 560×200 so they also fill a 21:9 screen; a 320-wide picture is
mirrored and darkened at the sides instead. Between levels,
finished levels are crossed out and a blinking "YOU ARE HERE" marks the next
one.

## Textures

Put a 64×64 PNG (or any power-of-two size from 16 to 256) in `assets/textures/` and add its name to the `STATIC` list in
`src/content/textures.js`. For an animated texture, add it to `ANIMATED` with
`{ frames, fps }`. Sky textures (`sky: true`) are wide panoramas. Fence
textures (`fence: true`, the `FENCES` list) may be any size and use
transparent pixels for their holes; at 32 texels per unit, a 64×24 railing
is 2 units wide and 0.75 tall. Textures that should never glow (the
`DESERT` list: sandstone, sand, gravel) are defined with `fullbright:
false`.

## Sounds

Sounds are defined in `src/content/sounds.js`. Each one is either synthesized
from parameters or loaded from a file:

```js
defineSound({ id: 'droid-beep', synth: { wave: 'square', freq: 300, freqEnd: 80, duration: 0.2, bits: 6 } }),
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
randomizes the pitch a little each time the sound plays. A file's leading
silence (MP3s start with some) is cut so it plays the moment it's triggered.

To swap recorded files in for synthesized sounds without touching
`sounds.js`, list them in `assets/custom/sound-overrides.json` (see
`assets/custom/README.md`); `tools/soundboard.html` plays them side by side.

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
- `src/content/hero.js` sets the starting health, weapons, ammo, speed,
  body and `sounds` (`jump` and `land`).
- `src/content/config.js` sets the key colours and names, the title and
  intermission music, and how far below the screen's edge weapons sit.
- `src/content/palette.js` holds the colour ramps and the fitted colours
  after them. Change one and run `npm run art` to re-theme everything.
  `node tools/fit-palette.mjs` scores how well the palette fits the art
  (the average colour error once lit), and `--fit 40` fits 40 free colours
  where the art needs them most.

## Custom behaviour

When data isn't enough, register code in `src/content/index.js`:

```js
import { defineAction, defineAttack, definePickup } from '../engine/defs.js';

export default {
  // ...
  actions: [
    // { action: 'rumble' } in any trigger
    defineAction('rumble', (world, params) => world.message('THE GARRISON SHUDDERS')),
  ],
  attacks: [
    // { kind: 'triple-bolt' } in any monster or weapon
    // opts.aim is { z, slope }: where the attack starts and how steeply it climbs.
    defineAttack('triple-bolt', (world, attacker, spec, angle, opts) => {
      for (const d of [-0.2, 0, 0.2]) world.spawnProjectile('trooper-bolt', attacker, angle + d, spec, opts.aim);
      return true;
    }),
  ],
  pickups: [
    // pickup: { bacta: 5 } in any item
    definePickup('bacta', (world, player, value) => {
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

The engine knows nothing about Star Wars. To start a different game, copy
`src/content/` and change it: the palette, strings, hero, art and levels. Then
point `src/main.js` at the new pack.
