# Mission 2: the Homestead (design)

The story's Map B (`docs/story.md`). The moisture farm that hid Rusk, at
the edge of the Jundland, at dusk (Mark, 2026-11-05: evening, not night).
The Empire is already cleaning up when the Crow drops Kyle on the ridge
above it: the farm is burning and a sandstorm is blowing in off the Dune
Sea. Kyle fights down the ridge, across the vaporator field and into the
sunken courtyard, finds Rusk's helmet recordings in the cellar, and
holds the pickup spot while something big walks out of the sand. All
combat, from the first step.

This file is the level's flow, its areas, its light and air, and the
order it's built in. Who says what stays in `docs/story.md`. Words in
capitals are stand-ins for Mark to rewrite.

## What makes it its own map

Borrowed from Mos Eisley (the town kit, `lib/town.js`): the farm's
whitewashed adobe (`adobe-pale`, grimy and scorched), domes,
round-topped arches and hoods, lattice doors, vaporators and the street
clutter (crates, drums, pods), grime and sand drifts, `circle()` and
`wallStair()` for the pit, `room()` for the rooms under the ground, the
twin suns' shadows (with new angles), and the checkpoint's worn
barricades and floodlights for the Imperials' gear.

Different by design:

| | Mos Eisley | The Homestead |
|---|---|---|
| Ground | Streets between walls; flat (steps of 0.25 to 0.5) | Open desert and rock: long views broken by vaporator rows, dunes and blowing sand. Big drops: a ridge 6 m over the farm, a courtyard 3 m deep, a cellar under that |
| Buildings | A dense town, every block a house | Few and low: an entry dome, two sheds, the farm read by its domes and its pit. Most rooms are under the ground |
| Route | Out and back through the same streets, calm then loud | One way, north to south-east, and every step a fight, ending in a hold-out |
| Light | Noon: high suns (42° and 50°), short shadows, bright tan haze, 200 to 224 | Evening: suns 14° and 18° up in the west-south-west, shadows 20 to 30 tiles long across the field, a dusk sky glowing in the west and dark in the east, sunlit ground at 176 and deep shade at 104, fire and lamplight below ground |
| Air | Still: glints settling | A sandstorm coming in: sand streaming on the wind in gusts, the haze swelling and clearing with them |

## Grid and size

- **144 × 112 tiles** (72 × 56 m). The story's 110 × 90 was a first
  guess; the ridge's descent and the hold-out at the end need the room.
  The long way across is about 10 seconds of running.
- `m2`, painted in code by the painter with the town kit, like `m1`.
- The sky is at 32 (Mos Eisley's 24), so the ridge can stand over the
  field. Everything not painted is the ridge's rock (north and east) or
  dunes out of reach (west and south), with the backdrop beyond.

## The map

```
  x   0       24      48      72      96      120     144
y    +------------------------------------------------+
   0 |RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR|
   4 |RRTTTTTRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR|
   8 |RRTTTTT11111111RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR|
  12 |RRTTTTT11111111RRRRRRPPPPRRRRRRRRRRRRRRRRRRRRRRR|
  16 |RRRRRRR11111111ppppppPPPPRRRRRRRRRRRRRRRRRRRRRRR|
  20 |RRRRRRR11111111ppppppPPPPRRRRRRRRRRRRRRRRRRRRRRR|
  24 |RRRRRRRRRRfffffqqqqqqPPPPRRRRRRRRRRRRRRRRRRRRRRR|
  28 |RRRRRRRRRRfffffqqqqqqPPPPRRRRRRRRRRRRRRRRRRRRRRR|
  32 |RRRRRRRRRRfffffRRRRRRRRRRRRoooooooooooooooooRRRR|
  36 |dd2222222222222222222222222oooooooEEEooGGGGoRRRR|
  40 |dd2222222222222222222222222ooooooEEEEooGGGGoRRRR|
  44 |dd2222222222222222222222222oooooooEEEoooooooRRRR|
  48 |dd2222222222222222222222222ooooooooeooooooooRRRR|
  52 |dd22222222222222iiiii222222oooooooCCooooooooRRRR|
  56 |dd22222222222222iiiii222222owwwwCCCCCCokkkkoRRRR|
  60 |dd22222222222222iiiii222222owwwwCCCCCCCkkkkoRRRR|
  64 |dd2222222222222222222222222owwwwCCCCCCCkkkkoRRRR|
  68 |dd2222222222222222222222222oooooCCCCCCooooooRRRR|
  72 |dd222222hhh2222222222222222ossssooCCooooooooRRRR|
  76 |dd222222hhh2222222222222222ossssogggggoxxxxxRRRR|
  80 |dd2222222222222222222222222oooooogggggoxxxxxRRRR|
  84 |dd2222222222222222222222222oooooogggggooooooRRRR|
  88 |dd2222222222222222222222222ooooooottooooBBBoRRRR|
  92 |dduuuuuuuuuuuuuuuuuuuuuuuuuuuuuuoottooooBBBoRRRR|
  96 |DDuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu88tt8**88888RRRR|
 100 |DDuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu88888**88888RRRR|
 104 |DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDRRRR|
 108 |DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDRRRR|
     +------------------------------------------------+
  one character is 3 tiles across and 4 down
  R  the Jundland's rock, out of reach     D  dunes out of reach (the Dune Sea)
  1  the drop-off shelf     T  the Tuskens' crag     p q  the ridge path
  P  the landing            f  the ridge's foot      2  the vaporator field
  i  the Imperials' staging point          h  the pump house
  o  the farm's ground      E  the entry dome  e  its passage (underground)
  C  the sunken courtyard   G  the generator shed (burning)
  B  the storehouse (burning)
  under the ground: w the common room  s the storeroom  k the workshop
                    x the cellar  g the garage
  t  the garage's trench    u  low dunes    8  the pickup ground   **  the spot
```

**The way through:** the shelf (the drop-off) → east down the ridge
path to the landing → west down its second leg to the ridge's foot →
south-east across the vaporator field, past the Imperials' staging point
→ up onto the farm's ground → the entry dome's stair, down round its
wall → the passage under the ground → the sunken courtyard, troopers on
its rim → the rooms round it → the workshop, and down to the cellar
(the recordings) → the garage opens → up the trench → the pickup, where
Kyle holds the spot until the Crow lands.

No step goes back over ground already crossed, but the view does: from
the ridge you see the whole map you're about to fight through, and from
the pickup you look back north-west across the field to the ridge, into
the sunset, as the prototype walks out of the sand.

**What holds the player back:**

- The ridge: its path is the way down from the shelf. Leg 1 is cut
  through the rock, walled both sides. The shelf and the landing have no
  lip (one just under eye height hid the farm from the shelf), so stepping
  off is a fall of 6 to 12 that hurts, Dark Forces' way; leg 2 is open on
  its south over a lower shelf of rock.
- The farm's ground is two steps up from the field, behind a knee-high
  yard wall (`lowWall()`) broken in a few places, so the fight on the
  farm comes through its gaps.
- Into the courtyard: the entry dome's stair is the way down and the only
  way back up. No parapet round the rim: one 0.9 tall hid the pit from
  the troopers behind it. Jumping in (a drop of 6, which hurts a little:
  falls hurt from about 5.8) is allowed, Dark Forces' way: the rim's low
  angled walls stop bodies, shots and sight only below their top, so the
  troopers on the rim see and shoot down into the pit.
- The cellar: only from the workshop, down a stair behind it.
- The garage: its shutter onto the courtyard is down, the family behind it,
  until Kyle has the recordings. Then it rolls up and the family's speeder
  is heard roaring away up the trench (off screen: the garage is empty when
  Kyle gets there, their dust hanging in the trench). No escort, and no
  `remove` action needed.
- The pickup spot: it ends the level only once the Crow is down, which is
  Jan's two minutes after the call (the `wait` action, PLAN.md section 6).

**What points the way** (stand-in words):

- On the shelf, Jan: "THAT'S THE FARM. LOOKS LIKE THE EMPIRE GOT HERE
  FIRST." Kyle: "RUSK SAID THE CELLAR." Jan: "STORM'S COMING IN OFF THE
  DUNE SEA. I CAN'T SIT HERE. CALL WHEN YOU'VE GOT IT."
- The farm's smoke shows from everywhere: two columns, from the
  generator shed and the storehouse, torn east by the wind.
- The entry dome's door faces the field, lit, a trooper in it.
- In the courtyard, the workshop's arch is the one with light inside and
  the cellar's stair behind it; the garage's shutter is down, voices behind
  it ("WHO'S OUT THERE?").
- Picking up the recordings: heavy footsteps overhead, dust falls, Jan:
  "KYLE, SOMETHING BIG JUST WALKED OUT OF THE FIELD. GET OUT OF THERE."
  The garage rolls open.
- At the trench's head, Kyle calls the Crow. Jan: "TWO MINUTES!"

## Levels

Heights in units (1 unit = 0.5 m). The field is at 0.

| Where | Floor | Notes |
|---|---|---|
| The ridge's crest | 20 to 26 | Out of reach; the backdrop climbs on behind it |
| The Tuskens' crag | 14 | Four steps of 0.5 up from the shelf's west end |
| The drop-off shelf | 12 | 6 m over the field |
| The ridge path, leg 1 | 12 to 6 | East, 12 steps of 0.5 a tile, 4 to 6 wide, the rock face on its north |
| The landing | 6 | An overlook at the bend |
| Leg 2 | 6 to 0 | West, 12 steps, then the ridge's foot |
| The vaporator field | 0, dunes 0.25 to 1 | Dunes as raised sand in soft outlines (drift edges), steps under 0.8 so troopers follow |
| The farm's ground | 0.5 | Two steps of 0.25 up from the field, its yard wall 0.9 over it |
| The entry dome | 0.5, ceiling 4.5 | Its stair goes straight down south, 12 steps of 0.5, under its wall and the yard to the pit |
| The courtyard and its rooms | -5.5 | Rooms' ceilings at -1.5 (2 m), under the farm's ground (slabs, their tops at 0.5) |
| The garage | -5.5, ceiling -1 | Taller: the speeder came in and out |
| The cellar | -8.5, ceiling -4.5 | Six steps of 0.5 down from the workshop; the cistern's pool 0.5 deeper |
| The trench | -5.5 to 0.5 | 12 steps of 0.5 south (rows 88 to 98), open to the sky, walled in the farm's plaster |
| The pickup | 0.5 | The farm's yard going on south: low rocks (boulders) for cover, the spot marked by the farm's beacon lamps |

## Areas

Boxes are x0..x1, y0..y1 in tiles, as built in the blockout (2026-11-05).

| # | Area | Box | What's there |
|---|------|-----|--------------|
| 1 | **The drop-off shelf** | 22..46, 8..24 | A flat shelf of rock on the ridge's south face, the Crow's landing spot (it leaves at once). The whole map shows below: the field's rows, the farm's domes, the smoke, the pit's dark ring, the dunes to the west with the suns low over them. Sandstone, wind-scoured, boulders along its lip. Quiet for a moment: no enemies on the shelf. |
| 7 | **The Tuskens' crag** | 6..20, 6..18 | A side area up four rock steps from the shelf's west end: the Tuskens' lookout over the farm, a windbreak of hides on poles, a cold fire pit, a gaffi stick against a rock. Tuskens watching (with Mark's sheet; until then nobody). A crawl between boulders at its back is the first secret. |
| 2a | **The ridge path** | leg 1 46..64, 15..21; the landing 64..76, 14..32; leg 2 44..64, 24..31; the foot 30..48, 24..36 | Cut into the ridge's face: a cut through the rock stepping down east (8 steps), an overlook at the bend, and a ledge along the cliff stepping down west to the foot (16 steps). The farm stays in view the whole way down, and the troopers in the field can shoot up at you. Two sandtroopers on the landing (a dead speeder bike or two of theirs, crates). |
| 2 | **The vaporator field** | 6..80, 36..92 | The farm's rows of moisture vaporators, slanting (the rows run north-east to south-west, so the long shadows cross them), 4 to 5 tiles apart in a row, rows 8 apart. A taller farm vaporator than the town's (a new model, about 3 m). Low dunes drifted between the rows. Some vaporators knocked down and sparking, one on fire. Sandtroopers moving through, a probe droid. The sand is thickest here: on open ground a gust can hide a trooper ten tiles off. |
| 2b | **The Imperials' staging point** | 48..62, 52..64 | Where the raid came in: a floodlight tower lit for the evening (a pool of light on the sand), supply crates, barricades at a slant, a comm unit on a crate. The commander. |
| 2c | **The pump house** | 24..32, 72..80 | A small round building in the field (a dome on it, 7 across), the field's pump and water tank: cover in the open, its door shot in. |
| 3 | **The farm's ground** | 80..132, 34..92 | A hardpan yard two steps up from the field behind a knee-high yard wall, broken where the troopers came through. On it: the entry dome, the pit's parapet, the skylight domes over the rooms below (small domes, 7 across, light from them on the rooms' floors), the generator shed and the storehouse (both burning), a cargo pod, drums, a dead power droid, the family's beacon lamps (lit) by the trench's head. The Imperials' barricades and a second floodlight by the dome. Troopers on the rim shoot down into the courtyard. |
| 3a | **The entry dome** | round, at (106, 42), r 6.5 | The way down, north of the pit: a round building (13 across) under a dome, its door west toward the field under a porch, a lamp inside. Inside, a square room (102..110, 38..46: angled walls take no ceiling, so a round room can't be roofed) and a stair down its middle (104..108), 12 steps of 0.5 straight south, under the dome's wall and the yard, its ceiling stepping down with it, into the courtyard's north side. |
| G | **The generator shed** | 118..128, 36..44 | A blockhouse of corrugated tin over the farm's power unit, burning: flames out of its door and roof (fire decorations with embers), a flickering light, smoke torn east. A crawlspace under its floor is the third secret. |
| B | **The storehouse** | 120..130, 88..96 | A small domed store, burning, its dome broken in (`dome-broken`), crates spilt out of its door. Lights the trench's head and the pickup ground orange. |
| 4 | **The sunken courtyard** | round, at (106, 64), r 10 | A round pit 20 across and 6 deep, open to the sky, its walls whitewashed plaster gone grey with soot, round-topped arches all round into the rooms. The suns are too low to reach in, so its floor is a dim pool (104) against the lit rim, lit by its doorways and a fire: an overturned table, a broken droid, a crate pile, a cart burning. Troopers in it and on the rim above. |
| 5a | **The common room** | 84..95, 58..70 | West off the courtyard under a low vault: the family's table knocked over, a hearth, a bench along the wall, a skylight overhead. A door on to the storeroom. |
| 5b | **The storeroom** | 84..95, 72..80 | Shelves of canisters and food tins, crates, a power unit. Behind a shelf, a secret door into the hidey-hole (79..83, 73..78) where the family hid Rusk: his bedroll, an empty ration pack, scratches counting days on the wall. The second secret, with a line ("A SCOUT'S BEDROLL. SOMEONE SLEPT HERE A LONG TIME."). |
| 5c | **The workshop** | 117..128, 58..70 | East off the courtyard: the farm's droid bench, a pit droid, tools, vaporator parts, a lamp on. The stair to the cellar goes down south from its south-east corner (123..127, 70..76). |
| 5d | **The cellar** | 117..131, 76..86 | The objective. Six steps down into the cold: a vaulted cistern room, a dark pool along one side (the farm's water), pipes up into the ceiling, one lamp knocked over and still lit on the floor. Quiet and dark (64 to 80): no enemies. Rusk's helmet recordings in a sealed case behind a loose stone: picking them up starts the ending. |
| 6 | **The garage** | 98..115, 77..88 | South off the courtyard behind a roll-down shutter, down until the recordings are taken. Inside: oil, tools, a hoist, a second speeder stripped for parts, the space where the family's speeder stood, its dust still in the air. |
| 6a | **The trench** | 102..108, 88..99 | The garage's way out: a cut 6 wide climbing south, 12 steps of 0.5, walled in the farm's plaster, open to the sky; sand blown in drifts on its steps. |
| 8 | **The pickup** | 96..132, 92..106 | Open ground south of the farm, the trench's head on its north, low rocks scattered for cover, the farm's beacon lamps round a flat spot (the spot: 110..116, 98..104). From it, looking north-west: the farm burning, the field, the ridge black against the sunset. The hold-out comes at it from the field and over the dunes to the west, and from the farm. |
| 9 | **The dunes** | 6..96, 92..104 | Low dunes south of the field, walkable, rising into the Dune Sea out of reach. The way the reinforcements come at the end. |
| 10 | **The edges** | | North and east, the Jundland's rock (the backdrop climbs away behind it). West and south, the dunes going on into the haze, the suns setting over them. |

### Secrets (3)

1. The Tuskens' crag: a crawl between two boulders at its back into a
   cleft (crouch), with a shield unit and power cells.
2. The hidey-hole behind the storeroom: Rusk's bedroll, a med kit and a
   thermal detonator the family kept.
3. The generator shed's crawlspace: in under its floor from the back
   (crouch), clear of the fire, an energy pack.

## Light and air

An evening with a storm coming in. Nothing like Mos Eisley's bright,
still noon.

- **The suns:** both low in the west-south-west, setting over the dunes:
  azimuths about 196 and 204, 14° and 18° up (`town.finish(EVENING)`,
  the suns as data, as `SUNS` is for Mos Eisley). A building 6 tall
  throws shadows 20 to 30 tiles long to the east-north-east, so the
  field is striped with the vaporators' shadows and the farm's ground
  falls into the domes' shade behind them.
- **Levels:** sunlit open ground 176 (the town's 216), one sun's shadow
  -40, both -68, so deep shade is about 104. Walls facing the suns are
  lit by the sunlit ground in front of them; walls facing east are in
  their own shadow. Interiors 96 to 120, with lamps. The courtyard's floor
  104. The cellar 64 to 80. Fires 200 and over, flickering (`fx:
  'fire'`). The staging point's floodlight a pool of 64 over the sand.
- **Sky:** `sky-dusk`, a new sky from Robotics' cloudy RESKY01
  (`derive.mjs`, as `sky-day` is): deep indigo overhead, violet and rose
  lower, amber at the horizon fading into the haze. Mos Eisley's sky
  wraps twice round the horizon; this one wraps once (a small engine
  change, a level's `skyWrap`), so the glow is in the west only and the
  east is dark, with the two suns painted low over the dunes.
- **Haze:** a dusky amber ([176, 120, 88], to try against the palette),
  halfway at 24 m in a lull (`half: 48`), 8 m in a full gust.
- **Blowing sand** (the new part, below).
- **The backdrop:** the ridge's rock climbing away north and east
  (`canyonBackdrop`, as in `m3`), and dunes going on west and south,
  smooth low swells fading into the haze (a dune variant of it).

### Blowing sand

Sand streaming past on a west-south-west wind, coming in gusts that half
hide the far side of the field and clear again. Everything here is
cosmetic: its own RNG, never `world.rng`.

- **Gusts.** The wind has its own clock: a breeze most of the time, and
  every 6 to 14 seconds a gust that rises over about 1.5 seconds, holds 2
  to 5, and dies over 2. The gust's strength (0 to 1) drives everything
  else, so the sand, the haze and (later) the wind's sound rise and fall
  together. A level field, `weather.gusts: { every, hold, strength }`.
- **Three layers of particles** under the open sky (the weather's
  wrapping box round the camera, now taking a list of types):
  - `sand-grain`: fine streaks of sand flying past on the wind, a few
    hundred within 8 tiles, at every height up to head height. In a gust
    there are more, and they're faster and longer.
  - `sand-veil`: big faint sheets (`sand-gust`, tuned: half-blended
    discs) sweeping low across the view, a few dozen. These are what
    partly hide what's behind them close up.
  - `sand-snake`: sand running over the ground in ribbons, just above it,
    fast.
- **The haze swells with the gusts:** the haze's half distance falls from
  48 to 16 in a full gust (`haze.gust`), so the far rows, the ridge and
  the troopers fade into the dust and come back. The view already
  rebuilds its haze table when `half` changes, so this costs nothing per
  pixel.
- **The sky goes into the sand too:** in a gust the sky's lower part
  fades toward the haze colour, so the horizon doesn't stay sharp while
  the ground beside it disappears.
- **Shelter:** the courtyard, the trench and the lee of the buildings
  should get less. Decide after looking: fewer there, or none.
- **Indoors:** none (the weather keeps to sky tiles already), but the wind
  still heard.
- **Fair play:** a full gust hides a trooper beyond about 12 tiles. Should
  the troopers see no farther than the player then? For Mark to judge
  once it's in.
- **Budget:** under 0.3 ms a frame for all of it (the half-blended discs
  cost the most: `mist` at 40 is about 0.3 ms). Measure on the bench.
- Mos Eisley can use it later for the sand blowing at its edges and
  through the old quarter (`docs/mission1.md`, Light and air).

## Props and models

- **Have:** domes (and the broken dome), arches and hoods, lattice doors,
  shutters, the street clutter, vaporators (the town's small one), the
  fire drum, worn barricades and floodlight towers, boulders, the X-34,
  pit droids and power droids, the workbench and swoop hoist, terminals.
- **New:** a farm vaporator (taller), a fallen one, fires on roofs and in
  doorways (decorations with fire, ember and smoke emitters, as the fire
  drum has), the Tuskens' windbreak, a cistern's pipes, the family's table
  and hearth, shelves of tins, a burning cart.
- **Long shadows from models:** the vaporators are models, and the town
  kit's shadows only see tiles and domes. A tall thin caster per vaporator
  (content side, in `shadows()`) gives the field its striped look.

## Characters

| Who | Where | Art |
|-----|-------|-----|
| Sandtroopers, a commander | everywhere | have |
| Stormtroopers, an officer | the courtyard, the reinforcements | have |
| Probe droid | over the field | have |
| The family (voices, then gone) | behind the garage's shutter | none needed |
| Tuskens | the crag, watching | **Mark** |
| The prototype | walking out of the sand at the end | **Mark** |

## Sound

- **Ambient** (PLAN.md section 4's looping positional sounds, not built
  yet): the wind, rising and falling with the gusts (DF's WIND1), fire
  crackling at the burning buildings, the cistern's drip.
- **Music:** combat from the start.
- **One-shots:** the prototype's footsteps at the end, the family's
  speeder roaring away.

## Enemies and items by skill

All combat. Filled in when the level is populated. The plan:

| Area | Every skill | 2+ | 3+ | 4+ |
|------|-------------|----|----|----|
| Ridge path | 2 sandtroopers on the landing | 1 on leg 2 | | |
| Vaporator field | 3 sandtroopers in the rows, the probe droid | 1 more | the staging point's commander | 2 more |
| Farm's ground | 2 on the rim, 1 at the dome's door | 1 on the rim | 1 by the generator shed | |
| Entry dome | | | 1 waiting in the stairwell | |
| Courtyard | 3 stormtroopers, the rim above | 1 more | the officer | |
| Rooms | 1 in the common room, 1 in the workshop | | | 1 in the storeroom |
| Cellar | none: quiet and dark | | | |
| Trench | | | 1 at its head | |
| The hold-out | 4 coming from the field and the dunes | 6 | 8 | 10 |

Med kits and ammo along the way, more on skills 1 and 2, a stock of
ammo in the garage before the hold-out.

## Engine and content pieces it needs

| Piece | Where | Size |
|---|---|---|
| Weather as a list of types | `world/weather.js`, defs, validator, MODDING.md | Small |
| Gusts, carrying the particles harder | weather, particles' `wind` | Small |
| The haze swelling with the gusts | world, `render/view.js` (rebuilds its table already) | Small |
| The sky fading into the sand in a gust | `render/columns.js` (sky rows through a haze step) | Small, measured |
| A sky that wraps once (`skyWrap`) | `render/columns.js`, defs | Small |
| `wait` in trigger lists | PLAN.md section 6 | Small |
| The recordings: an objective item (a data tape) | PLAN.md section 7 | Small |
| Evening suns, model shadow casters | `lib/town.js` (content) | Small |
| A dune backdrop | `lib/backdrop.js` (content) | Small to medium |
| Tuskens, the prototype | Mark's sheets | Mark |

Not needed: driving (the family leaves off screen), `remove`, escorts.
`fly` and `cutscene` (section 6) come later for the drop-off and the
Crow landing at the pickup; until then a message stands in for each.

## Build order

Each step is a commit Mark can try (`?map=m2`), with snapshots. The steps
are in PLAN.md section 9.

1. **This design** (the paper pass), for Mark's OK on the flow (given
   2026-11-05).
2. **The blockout** (built 2026-11-05): the whole map as plain volumes at their final
   heights, the real ways between them, stand-ins for the domes and
   buildings, message triggers standing in for the story. Played end to
   end.
3. **Evening:** the dusk sky, the suns, the haze, the light levels.
4. **Blowing sand:** the engine pieces, then the particles on the bench,
   then in the level.
5. **Each area in detail,** in the order you meet them: the shelf and
   the path; the field and the staging point; the farm's ground and the
   dome; the courtyard and its rooms; the cellar; the garage, the trench
   and the pickup; the backdrop and the edges.
6. **Fire and smoke:** the burning buildings, the field's sparks.
7. **Life:** the troopers by skill, the hold-out's waves.
8. **The story:** the recordings, the garage, `wait` and the pickup.
9. **Tune:** light, the sand's thickness and gusts, frame time, the
   per-skill check.
