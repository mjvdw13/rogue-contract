# Mission 2: the Homestead (design)

The story's Map B (`docs/story.md`). The moisture farm that hid Rusk, at
the edge of the Jundland, at dusk (Mark, 2026-11-05: evening, not night).
The Empire is already cleaning up when the Crow comes in low through a
sandstorm: the farm is burning, troopers hold its yard, and Jan can't set
down, so she drops Kyle into the farm's garden pit. He works through the
tunnels between its three pits, finds the way to the cellar caved in and
barred, crosses the storm-swept yard to come at it through the burning
storehouse, finds Rusk's helmet recordings, and leaves by the garage to
hold the landing pad while something big walks out of the sand. All
combat, from the first room.

Third design (2026-11-05). Mark played the second blockout: the
interior (the tunnels, the passages with a glimpse of sky now and then)
is great and compelling; the exterior, a big open desert, was still bad,
and pushed the engine (long views cost frame time and planning). So the
farm is now the whole level: walled in by its windbreak, mostly under
the ground, with the storm and the evening sky over its pits, its yard
and the landing pad, and no view longer than about 60 tiles. The first
design (a ridge and a vaporator field) and the second (open desert, a
track) are in this file's history.

This file is the level's flow, its areas, its light and air, and the
order it's built in. Who says what stays in `docs/story.md`. Words in
capitals are stand-ins for Mark to rewrite.

## What makes it its own map

Borrowed from Mos Eisley (the town kit, `lib/town.js`): the farm's
whitewashed adobe (`adobe-pale`, grimy and scorched), domes,
round-topped arches and hoods, lattice doors, vaporators and the street
clutter (crates, drums, pods), grime and sand drifts, `circle()` for the
pits, `room()` for the rooms under the ground, the twin suns' shadows
(with new angles), and the checkpoint's worn barricades and floodlights
for the Imperials' gear.

Different by design, from Mos Eisley and from Mission 3's canyon:

| | Mos Eisley | The Canyon Garrison (m3) | The Homestead |
|---|---|---|---|
| Ground | Streets between walls, flat | A canyon floor between rock walls | Under the ground: tunnels and rooms between three round pits open to the sky; above, one walled yard |
| Walls | Plaster houses | Rock and Imperial metal | Whitewashed plaster gone grey with soot, round arches, the windbreak with sand drifted against it |
| Route | Out and back through the same streets | Up the canyon and into the garrison | Down into the pits, round the tunnels' loops, up into the storm for one dash, down again, out by the trench |
| Light | Noon: high suns, short shadows, 200 to 224 | Night | Evening: suns 14° and 18° up, the pits in dim shade under a glowing sky, lamplight and fire below ground |
| Air | Still: glints settling | Still | A sandstorm: sand streaming over the pits' rims and the windbreak in gusts, the haze swelling and clearing |

## Grid and size

- **128 × 140 tiles** (64 × 70 m): the farm inside its windbreak is
  102 × 88, the landing pad south of it 56 × 32. Small on the ground, but
  most of it is two storeys: tunnels and rooms under the yard.
- `m2`, painted in code by the painter with the town kit, like `m1`.
- The sky is at 32.
- **Views:** the windbreak (3 m) closes in the yard, and drifts too steep
  to climb close in the pad, so no view outdoors is longer than about 60
  tiles; beyond them, only the sky and the backdrop. Under the ground,
  views end at the next bend. Frame time stays at Mos Eisley's or below,
  and the monsters plan their way over the whole map (no `navReach`).

## The map

The surface, one character for 2 tiles across and 3 down:

```
  x   0       16      32      48      64      80      96      112     
y     +----------------------------------------------------------------+
   0  |                                                                |
   3  |                                                                |
   6  |                                                                |
   9  |     ###################################################        |
  12  |     #~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#        |
  15  |     #~~ooooooooooooooooooooooooooooooGGGGGGGoooooooo~~#        |
  18  |     #~~ooooooooooooooooooEEEEooooooooGGGGGGGoooooooo~~#        |
  21  |     #~~ooooooooooooooEEEEEEEEEoooooooGGGGGGGoooooooo~~#        |
  24  |     #~~ooooPPPPooooooEEEEEEEEEoooooooGGGGGGGoooooooo~~#        |
  27  |     #~~oooPPPPPPooo@oooooEEEEooooooooooooooooooooooo~~#        |
  30  |     #~~oooPPPPPPoooooooooooooooooooooooooooooooooooo~~#        |
  33  |     #~~ooooPPPPooooooooooooooooooooooooooooooooooooo~~#        |
  36  |     #~~ooooooooooooooooooooooooooooooooooooooooooooo~~#        |
  39  |     #~iiiiiiooooooooooooooooooo@oooooooooooo@ooooooo~~#        |
  42  |     #~iiiiiioooooooooooooooooooooooooooooooooooooooo~~#        |
  45  |     #~iiiiiioooooooooooCCCCCCCCooooooooooooooooooooo~~#        |
  48  |     #~iiiiiiooooooooooCCCCCCCCCCoooooooooooooooooooo~~#        |
  51  |     #~~ooooooooooooooCCCCCCCCCCCCooooooooooooooooooo~~#        |
  54  |     #~~ooooooooooooooCCCCCCCCCCCCooooooooooooooooooo~~#        |
  57  |     #~~ooooo@ooooooooCCCCCCCCCCCCooooooooooooooooooo~~#        |
  60  |     #~~oooooooooooooooCCCCCCCCCCoooooooooooooooooooo~~#        |
  63  |     #~~ooooooooooooooooCCCCCCCCooooooooooooooooooooo~~#        |
  66  |     #~~ooooooooooooooooooCCCCooooooooooooooooooooooo~~#        |
  69  |     #HHHHHooooooooooooooooooooooooooooooooQQQQQQoooo~~#        |
  72  |     #HHHHHoooooooooooooooooooooooooooooooQQQQQQQQooo~~#        |
  75  |     #HHHHHooooooooo@oooooooooooo@ooooooooQQQQQQQQooo~~#        |
  78  |     #~~ooooooooooooooooooooooooooooooooooQQQQQQQQooo~~#        |
  81  |     #~~ooooooooooooooooooooooooooooooooooooQQQQooooo~~#        |
  84  |     #~~ooooooooooooooooooooooooooooooooooootttoooooo~~#        |
  87  |     #~~ooooooooooooooooooooooooooooooooooootttoooooo~~#        |
  90  |     #~~ooooooooooooooooooooooooooooooooooootttoooooo~~#        |
  93  |     #~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ttt~~~~~~~~#        |
  96  |     #######################################ttt#########        |
  99  |                           dddd............................d... |
 102  |                           dddd............................d... |
 105  |                       ....dddd................................ |
 108  |                       ....dddd................................ |
 111  |                       .........................****.......d... |
 114  |                       .........................****.......d... |
 117  |                       ....dddd.................****.......dd   |
 120  |                           dddd............................dd   |
 123  |                           dddd............................dd   |
 126  |                           dddd............................dd   |
 129  |                           dddd............................dd   |
 132  |                           dddddddddddddddd...ddddddddddddddd   |
 135  |                                        .........               |
 138  |                                                                |
      +----------------------------------------------------------------+
  #  the windbreak, 3 m          ~  sand drifted against it (walkable, rising)
  o  the farm's yard             E  the entry dome     G  the generator shed (burning)
  H  the storehouse (burning)    i  the Imperials' staging point
  C  the main courtyard (a pit)  P  the garden pit (the drop-off)   Q  the garage pit
  t  the trench, and its gate through the windbreak
  @  a light well (a kerbed hole down to a tunnel)
  .  the landing pad, and the three cuts in the drifts round it
  d  drifts out of reach         **  the pickup spot
```

Under the ground, the same scale:

```
  x   0       16      32      48      64      80      96      112     
y     +----------------------------------------------------------------+
   0  |                                                                |
   3  |                                                                |
   6  |                                                                |
   9  |     ###################################################        |
  12  |     #ooooooooooooooooooooooooooooooooooooooooooooooooo#        |
  15  |     #ooooooooooooooooooooooooooooooooooooooooooooooooo#        |
  18  |     #ooooooooooooooooooooooooooooooooooeeooooooooooooo#        |
  21  |     #ooooooooooooooooooooooooooooooooooeeooooooooooooo#        |
  24  |     #ooooooPPPPoooooooooooeeoooooooooooeeooooooooooooo#        |
  27  |     #oooooPPPPPP---@---oooeeoooooooooooeeooooooooooooo#        |
  30  |     #oooooPPPPPP-------oooeeooooooooooo--ooooooooooooo#        |
  33  |     #ooooooPPPPoooooo--oooeeoooooqqqqqo--ooooooooooooo#        |
  36  |     #ooooooo--ooooooojjjjjjjjjoooqqqqqo--oorrrrooooooo#        |
  39  |     #ooooooo--ooooooojjjjjjjjj-@-qqqqq-----r@rrooooooo#        |
  42  |     #ooooooo--ooooooojjjjjjjjjoooqqqqqo--oorrrrooooooo#        |
  45  |     #ooooooo--oooooooooCCCCCCCCoooooooo--ooooooooooooo#        |
  48  |     #ooooooo--ooooooooCCCCCCCCCCoookkkkkkkoooooooooooo#        |
  51  |     #oooooowwwwwwwwooCCCCCCCCCCCCookkkkkkkoooooooooooo#        |
  54  |     #oooooowwwwwwww--CCCCCCCCCCCC--kkkkkkkoooooooooooo#        |
  57  |     #oooooow@wwwwwwooCCCCCCCCCCCCookkkkkkkoooooooooooo#        |
  60  |     #oooooowwwwwwwwoooCCCCCCCCCCoookkkkkkkoooooooooooo#        |
  63  |     #oohhh----oooooooooCCCCCCCCooooooooooooooooooooooo#        |
  66  |     #oohhhoo--oooooooooooCCCCooooooooooooooooooooooooo#        |
  69  |     #ooooooo--oooooooooooo--oooooooggggggoQQQQQQoooooo#        |
  72  |     #oeeoooo%%ooooooooossssssssooooggggggQQQQQQQQooooo#        |
  75  |     #oeeoooooo-----@---ssssssss-@--ggggggQQQQQQQQooooo#        |
  78  |     #oeeooooooovvoooooossssssssooooggggggQQQQQQQQooooo#        |
  81  |     #oeeooooxxxxxxxxxooooooooooooooooooooooQQQQooooooo#        |
  84  |     #----oooxxxxxxxxxooooooooooooooooooooootttoooooooo#        |
  87  |     #----vvvxxxxxxxxxooooooooooooooooooooootttoooooooo#        |
  90  |     #----oooxxxxxxxxxooooooooooooooooooooootttoooooooo#        |
  93  |     #ooooooooooooooooooooooooooooooooooooootttoooooooo#        |
  96  |     #######################################ttt#########        |
  99  |                           dddd............................d... |
 102  |                           dddd............................d... |
 105  |                       ....dddd................................ |
 108  |                       ....dddd................................ |
 111  |                       .........................****.......d... |
 114  |                       .........................****.......d... |
 117  |                       ....dddd.................****.......dd   |
 120  |                           dddd............................dd   |
 123  |                           dddd............................dd   |
 126  |                           dddd............................dd   |
 129  |                           dddd............................dd   |
 132  |                           dddddddddddddddd...ddddddddddddddd   |
 135  |                                        .........               |
 138  |                                                                |
      +----------------------------------------------------------------+
  o  the farm's yard overhead (slabs)     -  a tunnel
  e  a stair up (the entry dome's, the generator shed's hatch, the storehouse's)
  C  P  Q  the pits                       j  the junction
  w  the common room   k  the workshop   s  the storeroom   q  the family's quarters
  g  the garage        h  the hidey-hole (secret)          r  the well room (secret)
  x  the cellar (deeper)   v  a stair down to it   B  the cellar's barred door
  %  caved in (rubble)     @  a light well
```

**The way through:** the garden pit (the drop-off) → the tunnel east to
the junction → the main courtyard, troopers in it and on its rim → the
rooms and tunnels round it: the common room, the workshop, the
quarters, the storeroom → the long tunnel from the common room: the
hidey-hole, then rubble; the storeroom's tunnel west: rubble, and the
cellar's door, barred from the other side → up into the storm, by the
entry dome's stair or the generator shed's hatch → across the yard, past
the Imperials' staging point → into the burning storehouse and down its
stair → the old cistern passage → down into the cellar (the recordings)
→ the barred door opens (the family, fleeing, unbar it) → the storeroom's
tunnel → the garage, its shutters up → the garage pit → up the trench and
through the windbreak's gate → the landing pad, where Kyle holds the spot
until the Crow lands.

Three loops under the ground, so a fight can be flanked: the junction,
the garden pit, the common room and the courtyard; the junction, the
quarters, the workshop and the courtyard; and, once the barred door is
open, the courtyard, the storeroom, the cellar and the storehouse, up and
over the yard. The way out isn't the way in.

**What holds the player back:**

- Under the ground: the long tunnel south from the common room and the
  storeroom's tunnel west both end in rubble where they met (the raid's
  grenade brought the roof down), and the storeroom's tunnel turns south
  to the cellar's door, barred from the other side. So the cellar is
  reached from the surface, through the storehouse.
- Up to the yard: the entry dome's stair and the generator shed's hatch.
  Down: those, the storehouse's stair, or a jump into a pit or a light
  well (a drop of 6, which hurts a little: falls hurt from about 5.8).
  The only ways out of a pit are its arches; the light wells are too
  narrow to climb.
- The yard: the windbreak all round, 3 m, with sand drifted against its
  foot (you can walk up the drift but not onto the wall).
- The garage: its two shutters, on the storeroom's tunnel and on the
  garage pit, are down until Kyle has the recordings; then they roll up
  with the barred door (`garage`) and stay up. The garage pit and its
  trench are open to anyone who jumps in, but the gate leads only to the
  pad, which ends the level only once the Crow is called.
- The pad: drifts too steep to climb all round, cut in three places
  where the hold-out's troopers come in. It ends the level once the Crow
  is down, Jan's two minutes after the call (the `wait` action, PLAN.md
  section 6).

**What points the way** (stand-in words):

- In the garden pit, Jan: "I CAN'T SET DOWN WITH THEM ON THE GROUND.
  THIS IS AS CLOSE AS I GET." Kyle: "RUSK SAID THE CELLAR." Jan: "STORM'S
  COMING IN OFF THE DUNE SEA. CALL WHEN YOU'VE GOT IT."
- The water pipe on the tunnels' ceilings runs to the cistern, so it
  points at the cellar; at the rubble and the barred door, Kyle: "CAVED
  IN." / "BARRED FROM THE OTHER SIDE." / "THE STOREHOUSE HAD A WAY DOWN TO
  THE CISTERN." (a message trigger at each).
- On the yard, the storehouse burns, its door lit orange, across the yard
  from the entry dome's door.
- Picking up the recordings: heavy footsteps overhead, dust falls, Jan:
  "KYLE, SOMETHING BIG JUST WALKED OUT OF THE STORM. GET OUT OF THERE."
  The barred door and the garage's shutters roll up, the family's speeder
  roars away up the trench.
- At the trench's gate, Kyle calls the Crow. Jan: "TWO MINUTES!"

## Levels

Heights in units (1 unit = 0.5 m). The pad is at 0.

| Where | Floor | Notes |
|---|---|---|
| The windbreak | 6.5 | 3 m over the yard, out of reach; sand drifted against its foot rises to 2.5 |
| The farm's yard | 0.5 | |
| The entry dome, the sheds | 0.5, ceilings 4.5 | The dome's stair and the shed's hatch go down south, 12 steps of 0.5 |
| The pits | -5.5 | 6 under the yard, open to the sky; no parapets |
| The tunnels and rooms | -5.5, ceilings -1.5 (2 m) | Under the yard (slabs, their tops at 0.5); tunnels 4 wide |
| The light wells | -5.5, open to the sky | 2 x 2, kerbed on the yard (0.9) |
| The garage | -5.5, ceiling -1 | |
| The storehouse's stair, the old passage | 0.5 down to -5.5 | 12 steps south, then a rough sandstone passage |
| The cellar | -8.5, ceiling -4.5 | Six steps down from the old passage, and from the barred door; the cistern's pool 0.5 deeper |
| The trench | -5.5 to 0.5 | 12 steps up south out of the garage pit, then the gate through the windbreak |
| The pad | 0 | Its drifts rise 2 at once, then on up |

## Areas

Boxes are x0..x1, y0..y1 in tiles; circles are a centre and a radius.

| # | Area | Where | What's there |
|---|------|-------|--------------|
| 1 | **The garden pit** (the drop-off) | round, (28, 30), r 6 | A small pit, 12 across: the family's hydroponic garden, grow beds in rows under grow lamps (a cold blue-white light, unlike anything else on the map), a water tank. Sand streams over its rim. Jan drops Kyle in it and is gone. Quiet for a moment. Arches east (the tunnel to the junction) and south (the tunnel to the common room). |
| 2 | **The junction** | 44..62, 36..44 | Under the yard at the foot of the entry dome's stair: the tunnel west to the garden pit (35..48, 28..32, a light well in it), an arch south into the courtyard, a passage east to the quarters. A lamp, a trooper's barricade. |
| 3 | **The main courtyard** | round, (56, 56), r 12 | A round pit 24 across and 6 deep, open to the sky, its walls whitewashed plaster gone grey with soot, round-topped arches all round: the junction north, the common room west, the workshop east, the storeroom south. The suns are too low to reach in, so its floor is a dim pool against the lit rim, lit by its doorways and a cart burning; an overturned table, a broken droid, crates. Troopers in it and on the rim above. |
| 4a | **The common room** | 24..40, 50..64 | West of the courtyard (an arch through 40..45, 54..58) under a low vault: the family's table knocked over, a hearth, a bench, a skylight overhead. The tunnel north to the garden pit (26..30, 37..50) and the long tunnel south. |
| 4b | **The quarters** | 68..78, 34..46 | East of the junction (a passage through 62..68, 38..42, a light well in it): the family's sleeping alcoves, a chest turned out, a child's toy droid. A door east to the generator shed's tunnel. |
| 4c | **The workshop** | 72..86, 48..62 | East of the courtyard (an arch through 67..72, 54..58): the droid bench, a pit droid, tools, vaporator parts, a lamp on. The tunnel north (80..84, 31..48) to the generator shed's hatch. The tunnel south to the garage caved in (78..82, 62..64). |
| 4d | **The storeroom** | 48..64, 72..80 | South of the courtyard (an arch through 54..58, 67..72): shelves of canisters and food tins, crates, a power unit. A tunnel east to the garage's shutter (64..72, 74..78, a light well) and one west (30..48, 74..78, a light well) to the rubble and the cellar's barred door (32..36, 78..79) at the top of six steps down (32..36, 79..84). |
| 4e | **The long tunnel** | 26..30, 64..72 | South from the common room, older and rougher, the water pipe along its ceiling, a light well, one lamp out. Past the hidey-hole's door to the rubble (26..30, 72..74). |
| 4f | **The hidey-hole** | 16..22, 62..68 | Behind a door in the plaster (22..26, 64..66): where the family hid Rusk, his bedroll, an empty ration pack, scratches counting days on the wall. The first secret, with a line ("A SCOUT'S BEDROLL. SOMEONE SLEPT HERE A LONG TIME."). |
| 5 | **The yard** | 12..110, 12..96 | The farm's ground inside the windbreak, sand drifted against the wall's foot all round. On it: the entry dome, the three pits' rims (no parapets), the light wells' kerbs, the generator shed and the storehouse (both burning), the Imperials' staging point, two or three vaporators, cargo pods, a dead power droid. Troopers on the rims and behind the barricades. The storm is thickest here: sand pours over the windbreak in gusts. |
| 5a | **The entry dome** | round, (56, 24), r 6.5 | A round building under a dome, its door west under a porch (45..50, 22..26), a lamp inside. A square room (52..60, 20..28) and a stair down its middle (54..58, 24..36), 12 steps south under its wall and the yard into the junction. |
| 5b | **The generator shed** | 76..90, 14..26 | A blockhouse of corrugated tin over the farm's power unit, burning: flames out of its door and roof, a flickering light, smoke torn east. Its door on the west; a hatch in its floor and a stair down south (80..84, 19..31) to the workshop's tunnel. |
| 5c | **The Imperials' staging point** | 14..26, 40..50 | On the yard by the west windbreak: a floodlight tower lit for the evening, supply crates, barricades at a slant, a comm unit on a crate. The commander. |
| 5d | **The storehouse** | 13..23, 70..78 | A small domed store against the west windbreak, burning, its dome broken in (`dome-broken`), its door east onto the yard. Inside, past the fire, the family's stair down to the cistern (15..19, 72..84), 12 steps south. |
| 6 | **The old cistern passage** | 13..21, 84..92 | The way the family went for water before the tunnels: rough sandstone, low, the pipe dripping, a crate of tools. Six steps down east (21..26, 86..90) into the cellar. A side niche, behind a loose panel, is the third secret. |
| 7 | **The cellar** | 26..44, 82..94 | The objective. A vaulted cistern room, a dark pool along its south side (the farm's water), the pipe coming down into it, one lamp knocked over and still lit on the floor. Quiet and dark (64 to 80): no enemies. Rusk's helmet recordings in a sealed case behind a loose stone at its east end: picking them up starts the ending. The barred door at the top of the steps on its north side. |
| 8 | **The garage** | 72..84, 68..82 | Behind its two shutters (west on the storeroom's tunnel, east on the garage pit), down until the recordings are taken. Inside: oil, tools, a second speeder stripped for parts, the space where the family's speeder stood, its dust still in the air. A stock of ammo before the hold-out. |
| 8a | **The garage pit** | round, (92, 76), r 8 | The speeder bay, 16 across, open to the sky: oil stains, a fuel tank, a hoist. |
| 8b | **The trench** | 89..95, 83..100 | Out of the garage pit: a cut 6 wide climbing south, 12 steps of 0.5, walled in the farm's plaster, open to the sky, drifts on its steps; then a gate through the windbreak (96..100) onto the pad. |
| 9 | **The landing pad** | 62..118, 100..132; the spot 96..104, 112..120 | The family's landing pad outside the windbreak, in a hollow of drifts too steep to climb, cut in three places (west, south, east) where the wind has scoured gaps; the farm's beacon lamps round the spot, low rocks for cover. The storm at its worst. The hold-out comes through the cuts; at its end the prototype's shape walks out of the blowing sand in the south cut. Tuskens on the drifts' crest above, watching (Mark's sheet; until then nobody). |
| 10 | **The edges** | | The windbreak's top and the drifts' crests against the sky; beyond, only the backdrop: the Jundland's mountains to the north and east, the Dune Sea's dunes to the west and south, the suns setting over them. |

### Secrets (3)

1. The hidey-hole off the long tunnel: Rusk's bedroll, a med kit and a
   thermal detonator the family kept.
2. The well room (88..96, 36..44): a sealed room under the yard's east
   side, reached only by dropping down its light well (91..93, 39..41)
   from the yard; a secret door out west (84..88, 39..41) into the
   workshop's tunnel. A shield unit and an energy pack.
3. The old cistern passage's niche, behind a loose panel: power cells
   and a med kit.

## Light and air

An evening with a storm coming in. Nothing like Mos Eisley's bright,
still noon.

- **The suns:** both low in the west-south-west, setting over the dunes:
  azimuths about 196 and 204, 14° and 18° up (`town.finish(EVENING)`,
  the suns as data, as `SUNS` is for Mos Eisley). A building 6 tall
  throws shadows 20 to 30 tiles long to the east-north-east, so the
  windbreak's shadow lies across the yard's west side, the domes' shade
  behind them, and the pits are in shade all evening.
- **Levels:** sunlit open ground 176 (the town's 216), one sun's shadow
  -40, both -68, so deep shade is about 104. Walls facing the suns are
  lit by the sunlit ground in front of them; walls facing east are in
  their own shadow. Interiors 96 to 120, with lamps. The courtyard's floor
  104. The cellar 64 to 80. Fires 200 and over, flickering (`fx:
  'fire'`). The staging point's floodlight a pool of 64 over the sand;
  the light wells' shafts of evening light on the tunnels' floors; the
  garden pit's grow lamps a cold blue-white.
- **Sky:** `sky-dusk`, a new sky from Robotics' cloudy RESKY01
  (`derive.mjs`, as `sky-day` is): deep indigo overhead, violet and rose
  lower, amber at the horizon fading into the haze. Mos Eisley's sky
  wraps twice round the horizon; this one wraps once (a small engine
  change, a level's `skyWrap`), so the glow is in the west only and the
  east is dark, with the two suns painted low over the dunes.
- **Haze:** a dusky amber ([176, 120, 88], to try against the palette),
  halfway at 24 m in a lull (`half: 48`: the yard's far side a little
  hazed), 6 to 8 m in a full gust (12 to 16), when the far side of the
  yard and the windbreak go.
- **Blowing sand** (the new part, below).
- **The backdrop:** the Jundland's mountains far off to the north and
  east, low and pale over the windbreak (`canyonBackdrop`, as in `m3`),
  and dunes going on west and south, smooth low swells fading into the
  haze (a dune variant of it).

### Blowing sand

Sand streaming past on a west-south-west wind, coming in gusts that half
hide the far side of the yard and clear again, and streaming across the
pits' mouths, seen from below against the sky. Everything here is
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
  48 to 12 to 16 in a full gust (`haze.gust`), so the yard's far side
  and the troopers on it fade into the dust and come back. The view already
  rebuilds its haze table when `half` changes, so this costs nothing per
  pixel.
- **The sky goes into the sand too:** in a gust the sky's lower part
  fades toward the haze colour, so the horizon doesn't stay sharp while
  the ground beside it disappears.
- **Shelter:** the pits' floors, the trench, the light wells and the lee
  of the buildings and the windbreak should get less. Decide after looking: fewer there, or none.
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
  pit droids and power droids, the workbench and swoop hoist, terminals,
  a speeder bike.
- **New:** a farm vaporator (taller), fires on roofs and in doorways
  (decorations with fire, ember and smoke emitters, as the fire drum
  has), the water pipe along the tunnels' ceilings, the light wells'
  kerbs, grow beds and grow lamps, the family's table and hearth, the
  quarters' alcoves and a toy droid, shelves of tins, rubble and a broken
  support for the caved-in tunnels, a barred door, a burning cart.
- **Long shadows from models:** the vaporators are models, and the town
  kit's shadows only see tiles and domes. A tall thin caster per vaporator
  (content side, in `shadows()`) gives each its long shadow across the
  yard.

## Characters

| Who | Where | Art |
|-----|-------|-----|
| Sandtroopers, a commander | everywhere | have |
| Stormtroopers, an officer | the courtyard, the reinforcements | have |
| Probe droid | over the yard | have |
| The family (voices, then gone) | behind the garage's shutter | none needed |
| Tuskens | on the drifts above the landing pad, watching | **Mark** |
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
| The garden pit | none: a moment to look round | | | |
| The junction | 1 behind its barricade | | | 1 more |
| Main courtyard | 3 stormtroopers, 2 sandtroopers on the rim above | 1 more | the officer | 1 more on the rim |
| Rooms and tunnels | 1 in the common room, 1 in the workshop | 1 in the quarters | 1 in the storeroom | 1 in the long tunnel |
| Entry dome, the shed's hatch | | | 1 waiting in each stairwell | |
| The yard | 2 sandtroopers, the probe droid | 1 more | the staging point's commander | 2 more |
| The storehouse, the old passage | 1 by the fire | | | 1 in the passage |
| Cellar | none: quiet and dark | | | |
| Garage pit and trench | | | 1 at the trench's gate | |
| The hold-out | 4 through the cuts | 6 | 8 | 10 |

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
2. **The blockout** (built 2026-11-05): the whole map as plain volumes
   at their final heights, the real ways between them, stand-ins for the
   domes and buildings, message triggers standing in for the story.
   Played end to end. Mark's notes the same day: far too many
   vaporators; the way to the farm underwhelming, and walls in the
   distance; the farm too small.
   - **The redesign** (this file, 2026-11-05) and **the blockout again**
     at 288 × 256: open sand to dune crests, the track and its guide
     posts, a dozen vaporators, the farm with three pits and the tunnels.
     Built 2026-11-05; the flow field plans 96 steps out (`navReach`).
     Mark's notes: the interior great and compelling, the passages with
     a glimpse of sky; the exterior still bad, and pushing the engine.
   - **The third design** (this file, 2026-11-05): the farm walled in by
     its windbreak, Kyle dropped into the garden pit, one dash across
     the yard, the pad in a hollow of drifts; no view longer than about
     60 tiles. Then **the blockout again**.
3. **Evening:** the dusk sky, the suns, the haze, the light levels.
4. **Blowing sand:** the engine pieces, then the particles on the bench,
   then in the level.
5. **Each area in detail,** in the order you meet them: the garden pit
   and the junction; the courtyard and its rooms; the tunnels, the
   quarters and the light wells; the yard, the dome, the sheds and the
   staging point; the storehouse, the old passage and the cellar; the
   garage, its pit, the trench and the pad; the windbreak, the drifts and
   the backdrop.
6. **Fire and smoke:** the burning buildings, the courtyard's cart.
7. **Life:** the troopers by skill, the hold-out's waves.
8. **The story:** the recordings, the garage, `wait` and the pickup.
9. **Tune:** light, the sand's thickness and gusts, frame time, the
   per-skill check.
