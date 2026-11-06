# Mission 2: the Homestead (design)

The story's Map B (`docs/story.md`). The moisture farm that hid Rusk,
out in the sand at the edge of the Jundland, at dusk (Mark, 2026-11-05:
evening, not night). The Empire is already cleaning up when the Crow
sets Kyle down on a rock out in the desert, as close as Jan dares: the
farm is burning on the horizon and a sandstorm is blowing in off the
Dune Sea. Kyle follows the farm's track across the open sand, its marker
lamps leading him through the dust, crosses the vaporator field, goes
down under the farm, works through the tunnels between its three pits
to Rusk's helmet recordings in the cellar, and holds the pickup spot
while something big walks out of the sand. All combat, from the first
step.

Redesigned after Mark played the first blockout (2026-11-05): far fewer
vaporators, spread out; a much bigger map, with long stretches of sand
before its edge and no walls in the distance; a track with guide posts
to show the way to the farm; and a bigger farm, with a main pit, two
smaller ones, and tunnels joining them to explore.

This file is the level's flow, its areas, its light and air, and the
order it's built in. Who says what stays in `docs/story.md`. Words in
capitals are stand-ins for Mark to rewrite.

## What makes it its own map

Borrowed from Mos Eisley (the town kit, `lib/town.js`): the farm's
whitewashed adobe (`adobe-pale`, grimy and scorched), domes,
round-topped arches and hoods, lattice doors, vaporators and the street
clutter (crates, drums, pods), grime and sand drifts, `circle()` and
`wallStair()` for the pits, `room()` for the rooms under the ground, the
twin suns' shadows (with new angles), and the checkpoint's worn
barricades and floodlights for the Imperials' gear.

Different by design:

| | Mos Eisley | The Homestead |
|---|---|---|
| Ground | Streets between walls; flat (steps of 0.25 to 0.5) | Open desert: long stretches of sand in broad dunes, two lone rocks standing out of it, a thin field of vaporators. No walls: the map ends in dune crests in the haze. Under the farm, three pits 3 m deep, tunnels between them, and a cellar under those |
| Buildings | A dense town, every block a house | Few and low: an entry dome, two sheds, a pump house. The farm is read by its domes, its pits and its smoke. Most rooms are under the ground |
| Route | Out and back through the same streets, calm then loud | One way, north-west to south-east, along a track you can leave at will; under the farm, a network with loops; every step a fight, ending in a hold-out |
| Light | Noon: high suns (42° and 50°), short shadows, bright tan haze, 200 to 224 | Evening: suns 14° and 18° up in the west-south-west, shadows 20 to 30 tiles long across the sand, a dusk sky glowing in the west and dark in the east, sunlit ground at 176 and deep shade at 104, the track's lamps, fire and lamplight below ground |
| Air | Still: glints settling | A sandstorm coming in: sand streaming on the wind in gusts, the haze swelling and clearing with them |

## Grid and size

- **288 × 256 tiles** (144 × 128 m): over twice Mos Eisley's ground
  (208 × 152), most of it open sand. The track from the drop-off to the
  farm's gate is about 135 tiles, 10 seconds of running with nothing in
  the way; the far corners are about 25 seconds apart.
- The sand is walkable to 14 tiles from every edge, then rises into dune
  crests out of reach. From the farm the nearest crest is 30 to 90 tiles
  off, in the haze; from the drop-off, the farm is about 170 tiles away.
- `m2`, painted in code by the painter with the town kit, like `m1`.
- The sky is at 32, over the rocks' tops and the crests.
- The Jundland's mountains are the backdrop's, not walls: far off to the
  north and east, over the crests.
- **Cost, measured on the blockout:** open sand lets the view run 200
  tiles before anything stops it, and the monsters' flow field covers
  about 60,000 walkable tiles (all of Mos Eisley is 32,000 tiles). If
  either costs too much: end the view's rays where the haze is full (the
  sky's horizon is the haze colour, so nothing shows past it), and plan
  the flow field only so far round the player.

## The map

The whole map, one character for 4 tiles across and 6 down:

```
  x   0       32      64      96      128     160     192     224     256     
y     +------------------------------------------------------------------------+
   0  |DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD|
   6  |DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD|
  12  |DDD.................................................................DDDD|
  18  |DDD...TTT111111.....................................................DDDD|
  24  |DDD...TTT111111.....................................................DDDD|
  30  |DDD...111111111.....................................................DDDD|
  36  |DDD...111111111.....................................................DDDD|
  42  |DDD...11111111/.....................................................DDDD|
  48  |DDD.........../.....................................................DDDD|
  54  |DDD...==========....................................................DDDD|
  60  |DDD.............==...........,YY,,,,,,,,,,,,,Y,,,,,,,,,,,,,,,,......DDDD|
  66  |DDD...............==.........,,,,,,,,,,,,,,,,Y,,,,,,,,,,,,,,,,......DDDD|
  72  |DDD.................RRRR.....,,,,,,,,,,Y,,,,,,,,,,,,,,,,,,Y,,,......DDDD|
  78  |DDD.................RRRR.....,,,,,,,,,,,,,,,,,,,,,,,,YY,,,,,,,......DDDD|
  84  |DDD....................==....,,,,Y,,,,,,,,,,,,,,,,,,,YY,,,,,,,......DDDD|
  90  |DDD.....................==...,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,......DDDD|
  96  |DDD.....................,==,,,,,,,,,,oooooooooooooooooooooooo.......DDDD|
 102  |DDD.................AAAAAA,==,,,iiii,ooooooooooEEooooGGGooooo.......DDDD|
 108  |DDD.................AAAAAA,,,=,,iiii,oooPPooooEEEEoooGGGooooo.......DDDD|
 114  |DDD.................AAAAAA,,,,==,,,,,oooPPooooooooooooooooooo.......DDDD|
 120  |DDD.................AAAAAA,,,,,,==,,,oooooooooooooooooooooooo.......DDDD|
 126  |DDD.....................,,Y,,,,,,,==,oooooooooooooooooooooooo.......DDDD|
 132  |DDD.....................,,,,,,,,,,,,=oooooooooCCCCooooooooooo.......DDDD|
 138  |DDD.....................,,,,,,,,,,,,,ooooooooCCCCCCoooooooooo.......DDDD|
 144  |DDD.....................,,,,,,,,,,YY,ooooooooCCCCCCoooooooooo.......DDDD|
 150  |DDD.....................,,,,YY,,,,,,,ooooooooooCCoooooooooooo.......DDDD|
 156  |DDD.....................,,,,YY,,,,,,,oBBBooooooooooooooQQQQoo.......DDDD|
 162  |DDD.....................,,,,,,,,,,,,,oBBBooooooooooooooQQQQoo.......DDDD|
 168  |DDD.....................,,,,,hhh,,,,,ooooooooooooooooooottooo.......DDDD|
 174  |DDD.....................,,,,,,,,,,,,,ooooooooooooooooooottooo.......DDDD|
 180  |DDD.....................,,,,,,,Y,,,,,...................tt..........DDDD|
 186  |DDD.....................,,Y,,,,,,,,,,............888888888888.......DDDD|
 192  |DDD.....................,,Y,,,,,,,,,,............888888888888.......DDDD|
 198  |DDD.....................,,,,,,,,,,,,,............8888**888888.......DDDD|
 204  |DDD..............................................888888888888.......DDDD|
 210  |DDD..............................................888888888888.......DDDD|
 216  |DDD.................................................................DDDD|
 222  |DDD.................................................................DDDD|
 228  |DDD.................................................................DDDD|
 234  |DDD.................................................................DDDD|
 240  |DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD|
 246  |DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD|
 252  |DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD|
      +------------------------------------------------------------------------+
  D  dune crests out of reach        .  open sand, broad dunes
  1  the Crow's rock (the drop-off)  T  the Tuskens' perch   /  its way down
  =  the farm's track (guide posts along it)
  R  the roadblock     A  the Anvil (a lone butte)
  ,  the vaporator field   Y  a vaporator (about a dozen in all)
  i  the Imperials' staging point    h  the pump house
  o  the farm's ground   E  the entry dome   G  the generator shed (burning)
  B  the storehouse (burning)
  C  the main courtyard (a pit)   P  the garden pit   Q  the garage pit
  t  the garage pit's trench      8  the pickup ground   **  the spot
```

The farm, one character for 2 tiles across and 3 down, showing what's
under the ground:

```
  x   148     164     180     196     212     228     244     
y     +--------------------------------------------------+
  98  |ooooooooooooooooooooooooooooooooooooooooooooooooo.|
 101  |ooooooooooooooooooooooooooooooooooooooooooooooooo.|
 104  |ooooooooooooooooooooEEEEooooooooooooooooooooooooo.|
 107  |oooooooooooooooooooEEEEEEoooooooooooooooooooooooo.|
 110  |ooooooPPPPoooooooooEEEEEEoooooooooooooooooooooooo.|
 113  |oooooPPPPPP-------ooEeeEooooooooooeeooooooooooooo.|
 116  |oooooPPPPPP-------oooeeoooooooooooeeooooooooooooo.|
 119  |ooooooPPPPoooooo--oooeeoooooooooooeeooooooooooooo.|
 122  |ooooooo--ooooooo--oooeeoooooooooooeeooooooooooooo.|
 125  |ooooooo--ooooooo---------ooooooooo--ooooooooooooo.|
 128  |ooooooo--ooooooo---------ooooooooo--ooooooooooooo.|
 131  |ooooooo--oooooooooCCCCCCCCoooooooo--ooooooooooooo.|
 134  |ooooooo--ooooooooCCCCCCCCCCoookkkkkkkoooooooooooo.|
 137  |oooooowwwwwwwwooCCCCCCCCCCCCookkkkkkkoooooooooooo.|
 140  |oooooowwwwwwww--CCCCCCCCCCCC--kkkkkkkoooooooooooo.|
 143  |oooooowwwwwwwwooCCCCCCCCCCCCookkkkkkkoooooooooooo.|
 146  |oooooowwwwwwwwoooCCCCCCCCCCoookkkkkkkoooooooooooo.|
 149  |ooooooo--oooooooooCCCCCCCCooooooo%%oooooooooooooo.|
 152  |oorrroo--oooooooooooCCCCooooooooo%%oooooooooooooo.|
 155  |oorrroo--oooooooooooo--oooooooggggggoQQQQQQoooooo.|
 158  |ooooooo--ooooooooossssssssooooggggggQQQQQQQQooooo.|
 161  |ooooooo-----------ssssssss----ggggggQQQQQQQQooooo.|
 164  |ooooooo--ooooooooossssssssooooggggggQQQQQQQQooooo.|
 167  |ooooooovvoooooooooooooooooooooooooooooQQQQooooooo.|
 170  |ooooooovvoooooooooooooooooooooooooooootttoooooooo.|
 173  |ooxxxxxxxxxxooooooooooooooooooooooooootttoooooooo.|
 176  |ooxxxxxxxxxxooooooooooooooooooooooooootttoooooooo.|
 179  |ooxxxxxxxxxxooooooooooooooooooooooooootttoooooooo.|
 182  |......................................ttt.........|
 185  |........................8888888888888888888888888.|
      +--------------------------------------------------+
  o  the farm's ground over the tunnels (slabs)   -  a tunnel
  E  the entry dome   e  a stair down (the dome's, the generator shed's hatch)
  C  the main courtyard   P  the garden pit   Q  the garage pit   t  its trench
  w  the common room   k  the workshop   s  the storeroom   g  the garage
  v  the cellar's stair   x  the cellar (deeper)   r  the hidey-hole (secret)
  %  the caved-in tunnel (rubble)
```

**The way through:** the Crow's rock (the drop-off) → down its way on
the east side to the track → south-east along the track, guide posts
lit → the roadblock, the first fight → past the Anvil, a sniper on it →
into the vaporator field, past the staging point → the farm's gate →
the entry dome's stair (or the generator shed's hatch round the back,
or a jump into a pit) → the junction under the dome → the main courtyard,
troopers on its rim → the rooms and tunnels round it: the common room,
the workshop, the storeroom, the garden pit → the long tunnel south from
the common room, following the water pipe → down to the cellar (the
recordings) → back east by the storeroom's tunnel → the garage opens →
the garage pit → up the trench → the pickup, where Kyle holds the spot
until the Crow lands.

The ground under the farm has two loops, so a fight can be flanked and
the way back from the cellar isn't the way in: the junction, the garden
pit, the common room and the courtyard; and the courtyard, the
storeroom, the long tunnel and the common room. The view goes back over
the whole route at the end: from the pickup you look north-west across
the farm and the field to the Crow's rock, into the sunset, as the
prototype walks out of the sand.

**What holds the player back:**

- The desert is open: the track is the easy way, not the only one. The
  crests stop you at the edge. Off the track there's less cover, and the
  troopers see a long way between gusts.
- The Crow's rock: its way down is on its east side. Stepping off
  elsewhere is a fall of 8 that hurts (falls hurt from about 5.8), Dark
  Forces' way.
- The Anvil: sheer all round but for a climb of boulders on its east
  side, jumped one at a time.
- The farm's ground is two steps up from the sand, behind a knee-high
  yard wall (`lowWall()`) broken in a few places; the gate is where the
  track comes in.
- Under the farm: the entry dome's stair and the generator shed's hatch
  are the ways down and back up. Jumping into a pit (a drop of 6, which
  hurts a little) is allowed, but the only ways out of a pit are its
  arches. The rims have no parapet, so the troopers on them see and shoot
  down into the pits.
- The workshop's tunnel south to the garage is caved in (rubble): the
  garage is reached from the storeroom's side.
- The cellar: only by the long tunnel's stair.
- The garage: its two shutters, on the storeroom's tunnel and on the
  garage pit, are down, the family behind them, until Kyle has the
  recordings. Then both roll up (`garage`) and the family's speeder is
  heard roaring away up the trench (off screen: the garage is empty when
  Kyle gets there, their dust hanging in it). The garage pit and its
  trench are open from the start, to anyone who jumps in, but lead
  nowhere until then.
- The pickup spot: it ends the level only once the Crow is down, Jan's
  two minutes after the call (the `wait` action, PLAN.md section 6).

**What points the way** (stand-in words):

- On the Crow's rock, Jan: "THAT'S AS CLOSE AS I GET. THEY'VE GOT GUNS
  ON THE FARM." Kyle: "RUSK SAID THE CELLAR." Jan: "FOLLOW THE FARM'S
  TRACK. THE MARKER LAMPS RUN ALL THE WAY IN. CALL WHEN YOU'VE GOT IT."
- The track: packed sand, darker and smoother than the drifts beside it,
  with guide posts every 14 tiles or so on alternate sides, each a pole
  about 2 m tall with a small amber lamp. In a gust, the lamps are what
  you can see. Near the roadblock a few are shot out.
- The farm shows from the rock as a shape in the haze: its two smoke
  columns, torn east by the wind, and the beacon mast by the entry dome,
  a red lamp at its top.
- The entry dome's door faces the gate, lit, a trooper in it.
- Under the ground: lamps at the junctions; the water pipe on the
  tunnels' ceilings runs from the pump house to the cistern, so following
  it finds the cellar.
- Picking up the recordings: heavy footsteps overhead, dust falls, Jan:
  "KYLE, SOMETHING BIG JUST WALKED OUT OF THE FIELD. GET OUT OF THERE."
  The garage's shutters roll up, and the family's speeder roars away.
- At the trench's head, Kyle calls the Crow. Jan: "TWO MINUTES!"

## Levels

Heights in units (1 unit = 0.5 m). The open sand is at 0.

| Where | Floor | Notes |
|---|---|---|
| The dune crests | rising to 4, then out of reach | The map's edge, 14 tiles deep |
| The open sand and the track | 0, dunes up to 3 | Broad dunes, steps of 0.25 a tile at most, so troopers follow |
| The Crow's rock | 8 | 4 m over the sand: the drop-off and the view |
| The Tuskens' perch | 11 | Six rock steps of 0.5 up from the rock's top |
| The rock's way down | 8 to 0 | 16 steps of 0.5 down south, on its east side |
| The Anvil | 10 | Sheer; a climb of boulders on its east side, steps of 1 (jumped) |
| The farm's ground | 0.5 | Two steps of 0.25 up from the sand, its yard wall 0.9 over it |
| The entry dome | 0.5, ceiling 4.5 | Its stair goes straight down south, 12 steps of 0.5, into the junction |
| The generator shed | 0.5 | Its hatch's stair down south, 12 steps of 0.5, to the workshop's tunnel |
| The pits | -5.5 | 6 under the yard, open to the sky |
| The tunnels and rooms | -5.5, ceilings -1.5 (2 m) | Under the farm's ground (slabs, their tops at 0.5); tunnels 4 wide |
| The garage | -5.5, ceiling -1 | Taller: the speeder came in and out |
| The cellar | -8.5, ceiling -4.5 | Six steps of 0.5 down from the long tunnel; the cistern's pool 0.5 deeper |
| The trench | -5.5 to 0.5 | 12 steps of 0.5 up south out of the garage pit |
| The pickup | 0 to 0.5 | The family's landing pad, on the sand south of the farm |

## Areas

Boxes are x0..x1, y0..y1 in tiles; circles are a centre and a radius.

| # | Area | Where | What's there |
|---|------|-------|--------------|
| 1 | **The Crow's rock** (the drop-off) | 24..60, 20..46; its way down 56..62, 40..56 | A low flat-topped rock standing out of the sand, 4 m high, wind-scoured sandstone. The Crow sets Kyle down on top and leaves at once. The desert shows all round: the track's lamps snaking away south-east, the Anvil halfway, the farm on the horizon (smoke, the beacon mast), the suns low over the dunes to the west. Quiet for a moment: no enemies on the rock. |
| T | **The Tuskens' perch** | 24..36, 20..30 | Up six rock steps at the rock's north-west corner: the Tuskens' lookout over the farm, a windbreak of hides on poles, a cold fire pit, a gaffi stick against a rock. Tuskens watching (with Mark's sheet; until then nobody). A crawl between boulders at its back is the first secret. |
| 2 | **The track** | From the west edge (14, 60) past the rock's foot (60, 58), (88, 78), (106, 100), (126, 118) to the gate (148, 136) | The farm's track to Anchorhead, 5 wide, packed sand following the dunes, about 135 tiles from the rock to the gate. Guide posts all along it (see What points the way). Open to the sky and to the troopers' sight. |
| R | **The roadblock** | 80..96, 70..86 | Where the Imperials closed the track: barricades across it at a slant, a speeder bike burning on its side, crates, a floodlight, the guide posts round it shot out. The first fight. |
| A | **The Anvil** | 82..104, 104..124 | A lone butte beside the track, 5 m high, its top flat: a sandtrooper sniper over the track. The climb of boulders on its east side gets you up to him. A cleft in its west face is the third secret. |
| 2b | **The vaporator field** | North of the farm 116..250, 60..98; west of it 96..148, 98..204 | About a dozen farm vaporators, 20 to 30 tiles apart on a loose slanting grid (the rows run north-east to south-west, so the long shadows cross them), each standing in its own drift: landmarks and cover in the open. Two knocked down and sparking. Sandtroopers moving through, a probe droid. |
| i | **The Imperials' staging point** | 128..144, 102..116 | Where the raid came in, north of the track just short of the gate: a floodlight tower lit for the evening (a pool of light on the sand), supply crates, barricades at a slant, a comm unit on a crate. The commander. |
| h | **The pump house** | round, (122, 170), r 4.5 | A small round building in the field (a dome on it, 9 across), the field's pump and tank: cover in the open, its door shot in. Its water pipe runs east under the yard wall to the cistern. |
| 3 | **The farm's ground** | 148..246, 98..182 | A hardpan yard two steps up from the sand behind a knee-high yard wall, broken where the troopers came through; the gate on its west where the track comes in (148, 132..140). On it: the entry dome, the three pits' rims, the skylight domes over the common room and the workshop (small domes, 7 across, light from them on the rooms' floors), the generator shed and the storehouse (both burning), the beacon mast by the dome, two or three vaporators, cargo pods, a dead power droid, the Imperials' barricades and a second floodlight by the dome. Troopers on the rims shoot down into the pits. |
| E | **The entry dome** | round, (192, 110), r 6.5 | The way down: a round building (13 across) under a dome, its door west toward the gate under a porch, a lamp inside. Inside, a square room (188..196, 106..114: angled walls take no ceiling, so a round room can't be roofed) and a stair down its middle (190..194, 112..124), 12 steps of 0.5 straight south under its wall and the yard, its ceiling stepping down with it, into the junction. |
| G | **The generator shed** | 212..226, 100..112 | A blockhouse of corrugated tin over the farm's power unit, burning: flames out of its door and roof, a flickering light, smoke torn east. A hatch in its floor, behind the burning unit, and a stair down south (216..220, 112..124) to the workshop's tunnel: the back way in. |
| B | **The storehouse** | 152..164, 158..168 | A small domed store, burning, its dome broken in (`dome-broken`), crates spilt out of its door. |
| C | **The main courtyard** | round, (192, 142), r 12 | A round pit 24 across and 6 deep, open to the sky, its walls whitewashed plaster gone grey with soot, round-topped arches into the ways round it: the junction north, the common room west, the workshop east, the storeroom south. The suns are too low to reach in, so its floor is a dim pool (104) against the lit rim, lit by its doorways and a fire: an overturned table, a broken droid, a crate pile, a cart burning. Troopers in it and on the rim above. |
| P | **The garden pit** | round, (164, 116), r 6 | A small pit, 12 across: the family's hydroponic garden, grow beds in rows under grow lamps (a cold blue-white light, unlike anything else on the map), a water tank. Arches east (the tunnel to the junction) and south (the tunnel to the common room). |
| Q | **The garage pit** | round, (228, 162), r 8 | The speeder bay, 16 across, open to the sky: oil stains, a fuel tank, a hoist. The garage's shutter on its west side, down; the trench climbing south out of it. |
| J | **The junction** | 180..198, 124..130 | Under the yard at the dome's stair's foot: an arch south into the courtyard, a tunnel west (170..184, 114..118, turning south at 180..184) to the garden pit. A lamp, a trooper's barricade. |
| 5a | **The common room** | 160..176, 136..150 | West of the courtyard (an arch through 176..181, 140..144) under a low vault: the family's table knocked over, a hearth, a bench along the wall, a skylight overhead. A tunnel north to the garden pit (162..166, 122..136) and the long tunnel south. |
| 5b | **The workshop** | 208..222, 134..148 | East of the courtyard (an arch through 203..208, 140..144): the farm's droid bench, a pit droid, tools, vaporator parts, a lamp on. A tunnel north to the generator shed's hatch (216..220, 124..134). The tunnel south to the garage (214..218, 148..154) is caved in: rubble and a broken support, the raid's work. |
| 5c | **The storeroom** | 184..200, 158..166 | South of the courtyard (an arch through 190..194, 153..158): shelves of canisters and food tins, crates, a power unit. A tunnel east to the garage's shutter (200..208, 160..164) and one west to the long tunnel (166..184, 160..164). |
| 5d | **The long tunnel** | 162..166, 150..166 | South from the common room, older and rougher, the water pipe along its ceiling, one lamp out. Past the hidey-hole's secret door (158..162, 154..156) to the cellar's stair (162..166, 166..172). |
| 5e | **The hidey-hole** | 152..158, 152..158 | Where the family hid Rusk: his bedroll, an empty ration pack, scratches counting days on the wall. The second secret, with a line ("A SCOUT'S BEDROLL. SOMEONE SLEPT HERE A LONG TIME."). |
| 5f | **The cellar** | 152..172, 172..182 | The objective. Six steps down into the cold: a vaulted cistern room, a dark pool along one side (the farm's water), the pipe coming down into it, one lamp knocked over and still lit on the floor. Quiet and dark (64 to 80): no enemies. Rusk's helmet recordings in a sealed case behind a loose stone: picking them up starts the ending. |
| 6 | **The garage** | 208..220, 154..168 | Behind its two shutters (west on the storeroom's tunnel, east on the garage pit), down until the recordings are taken. Inside: oil, tools, a second speeder stripped for parts, the space where the family's speeder stood, its dust still in the air. A stock of ammo before the hold-out. |
| 6a | **The trench** | 225..231, 170..184 | Out of the garage pit: a cut 6 wide climbing south, 12 steps of 0.5, walled in the farm's plaster, open to the sky, sand blown in drifts on its steps. |
| 8 | **The pickup** | 196..246, 184..216; the spot 214..222, 196..204 | The family's landing pad on the sand south of the farm, the trench's head on its north, low rocks scattered for cover, the farm's beacon lamps round the spot. From it, looking north-west: the farm burning, the field, the Crow's rock black against the sunset. The hold-out comes at it over the dunes from the west and south, and from the farm. |
| 9 | **The open sand** | everything else | Broad dunes up to 1.5 m, walkable all over. The south-west quarter (14..96, 124..240) is empty desert, the way the hold-out's waves come. Out in it, well off the track, a scout trooper's speeder bike lies wrecked, the scout dead beside it (the Tuskens' work): an energy pack and a med kit for whoever wanders. |
| 10 | **The edges** | the outer 14 tiles | Dune crests all round, rising out of reach, in the haze. The Jundland's mountains far off in the backdrop to the north and east; to the west and south, the dunes going on, the suns setting over them. |

### Secrets (3)

1. The Tuskens' perch: a crawl between two boulders at its back into a
   cleft (crouch), with a shield unit and power cells.
2. The hidey-hole off the long tunnel: Rusk's bedroll, a med kit and a
   thermal detonator the family kept.
3. The Anvil's cleft: in behind a boulder on its west face (crouch), out
   of the sniper's sight, an energy pack and armour.

## Light and air

An evening with a storm coming in. Nothing like Mos Eisley's bright,
still noon.

- **The suns:** both low in the west-south-west, setting over the dunes:
  azimuths about 196 and 204, 14° and 18° up (`town.finish(EVENING)`,
  the suns as data, as `SUNS` is for Mos Eisley). A building 6 tall
  throws shadows 20 to 30 tiles long to the east-north-east, so each
  vaporator lays a long stripe across the sand and the farm's ground
  falls into the domes' shade behind them.
- **Levels:** sunlit open ground 176 (the town's 216), one sun's shadow
  -40, both -68, so deep shade is about 104. Walls facing the suns are
  lit by the sunlit ground in front of them; walls facing east are in
  their own shadow. Interiors 96 to 120, with lamps. The courtyard's floor
  104. The cellar 64 to 80. Fires 200 and over, flickering (`fx:
  'fire'`). The staging point's floodlight a pool of 64 over the sand;
  the guide posts' lamps small amber pools along the track; the garden
  pit's grow lamps a cold blue-white.
- **Sky:** `sky-dusk`, a new sky from Robotics' cloudy RESKY01
  (`derive.mjs`, as `sky-day` is): deep indigo overhead, violet and rose
  lower, amber at the horizon fading into the haze. Mos Eisley's sky
  wraps twice round the horizon; this one wraps once (a small engine
  change, a level's `skyWrap`), so the glow is in the west only and the
  east is dark, with the two suns painted low over the dunes.
- **Haze:** a dusky amber ([176, 120, 88], to try against the palette),
  halfway at about 45 m in a lull (`half: 90`, so from the Crow's rock
  the farm, 170 tiles off, is a shape in the haze), 8 to 12 m in a full
  gust (16 to 24).
- **Blowing sand** (the new part, below).
- **The backdrop:** the Jundland's mountains far off to the north and
  east, low and pale over the crests (`canyonBackdrop`, as in `m3`),
  and dunes going on west and south, smooth low swells fading into the
  haze (a dune variant of it).

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
  90 to 16 to 24 in a full gust (`haze.gust`), so the farm, the
  vaporators and the troopers fade into the dust and come back, the
  guide posts' lamps last of all. The view already
  rebuilds its haze table when `half` changes, so this costs nothing per
  pixel.
- **The sky goes into the sand too:** in a gust the sky's lower part
  fades toward the haze colour, so the horizon doesn't stay sharp while
  the ground beside it disappears.
- **Shelter:** the pits, the trench and the lee of the buildings and
  rocks should get less. Decide after looking: fewer there, or none.
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
- **New:** a farm vaporator (taller), a fallen one, the track's guide
  post (a pole with a small amber lamp, and one knocked down), the farm's
  beacon mast (tall, a red lamp at its top), fires on roofs and in
  doorways (decorations with fire, ember and smoke emitters, as the fire
  drum has), the Tuskens' windbreak, the water pipe along the tunnels'
  ceilings, grow beds and grow lamps, the family's table and hearth,
  shelves of tins, rubble and a broken support for the caved-in tunnel,
  a burning cart, a wrecked speeder bike.
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
| Tuskens | the perch on the Crow's rock, watching | **Mark** |
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
| The track | 2 sandtroopers at the roadblock | 1 more there | | 1 on the track past it |
| The Anvil | 1 sandtrooper on top, over the track | | | |
| Vaporator field | 3 sandtroopers among the vaporators, the probe droid | 1 more | the staging point's commander | 2 more |
| Farm's ground | 2 on the main courtyard's rim, 1 at the dome's door | 1 on the garden pit's rim | 1 by the generator shed | |
| Entry dome | | | 1 waiting in the stairwell | |
| The junction | 1 behind its barricade | | | |
| Main courtyard | 3 stormtroopers, the rim above | 1 more | the officer | |
| Rooms and tunnels | 1 in the common room, 1 in the workshop | 1 in the garden pit | 1 in the storeroom | 1 in the long tunnel |
| Cellar | none: quiet and dark | | | |
| Garage pit and trench | | | 1 at the trench's head | |
| The hold-out | 4 coming over the dunes and from the farm | 6 | 8 | 10 |

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
| Rays that end where the haze is full, only if open sand costs too much | `render/columns.js` | Small, measured |
| A flow field planned only so far round the player, only if it costs | `world/nav.js` | Small, measured |
| The guide post and the beacon mast | content models | Small |
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
     Frame time and validate time measured.
3. **Evening:** the dusk sky, the suns, the haze, the light levels.
4. **Blowing sand:** the engine pieces, then the particles on the bench,
   then in the level.
5. **Each area in detail,** in the order you meet them: the Crow's rock,
   the track, the roadblock and the Anvil; the field and the staging
   point; the farm's ground and the dome; the courtyard and the rooms;
   the tunnels and the garden pit; the cellar; the garage, its pit, the
   trench and the pickup; the open sand, the backdrop and the edges.
6. **Fire and smoke:** the burning buildings, the field's sparks.
7. **Life:** the troopers by skill, the hold-out's waves.
8. **The story:** the recordings, the garage, `wait` and the pickup.
9. **Tune:** light, the sand's thickness and gusts, frame time, the
   per-skill check.
