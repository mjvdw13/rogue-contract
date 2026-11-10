# Mission 2: the Homestead (design)

The story's Map B (`docs/story.md`). The moisture farm that hid Rusk, at
the edge of the Jundland, at dusk (Mark, 2026-11-05: evening, not night).
The Empire is already cleaning up when the Crow comes in low through a
sandstorm: the farm is burning, troopers hold it, and Jan can't set down,
so she drops Kyle into the farm's garden pit at its west end. Rusk's
cellar is under the house at the east end. Kyle works east to it: along
the pump tunnels, down through the farm's reservoir and up into the
workshop pit, up through the burning generator shed into the work yard, where an officer carries the key to the house's
gate, up the lane to the house's great dome, down into its courtyard pit
and through its rooms to the cellar, where he finds Rusk's helmet
recordings. Then out by Rusk's way, down through caves under the pad
and up into the garage pit, and on up the trench onto the landing pad, where Jan
won't land: through a wave of troopers and down a dry wash into the
rocks to the Crow, while something big walks out of the sand. All
combat, from the first room.

Fourth design (2026-11-06). Mark played the third blockout: the walled
farm's direction is right and the feel more correct, but the level felt
small and too open-ended, "one big open area that's a bit overwhelming
to navigate": hunting round rather than progressing. The yard was one
walled square 49 × 42 m over a web of tunnels with three loops, all open
at once; the cellar was found by elimination (two dead ends, then up,
across, and into a storehouse like any other building); and nothing
ahead to aim for. So the farm is now a walk from its working end to the
house, west to east:

- **One destination, named and seen.** Jan names it at the start (the
  cellar under the house, the big dome at the east end). The house's
  great dome is the tallest thing on the farm, and you first see it
  coming up into the work yard, straight ahead over the gate. From then
  on it's ahead of you.
- **A chain of areas, one way on from each.** Loops only inside an area,
  for the fights (the house's rooms round its courtyard).
- **Each area its own look, light and fight**, so you know you've moved
  on.
- **Gates you read on sight:** the caved-in tunnel (in view from where
  you come in) sends you up; the gate's red lock wants the officer's key
  (Dark Forces' way); the recordings open Rusk's way out of the cellar.
- **Walking east, away from the sunset:** the low suns behind you light
  the house's west face against the darkening east.

**The reservoir** (2026-11-06). Mark played the fourth blockout: on the
right track; stretch it out, the underground most, with another segment
rather than more complex ones. So the pump room no longer opens straight
into the workshop pit. Its one way on is a stair 16 steps down into the
farm's reservoir, one long dark hall under the sand outside the
windbreak, and 16 steps up at its far end to the tunnel beside the
workshop pit. One more area in the chain, a kind of space the farm
didn't have (one tall hall, water, pillars, a long sightline), and the
route a quarter longer: 505 steps, from 393.

**The ending stretched** (2026-11-06). Mark liked the reservoir and
asked for more at the other end: the level ended as soon as you came out
of the trench, the pickup spot ten tiles from its gate. Now Jan won't
land on the pad with a squad coming over the drifts; she sets down
where a dry wash comes out of the rocks south of the farm. Kyle gets
through the wave on the pad (some of it coming up the wash at him), then
follows the wash down into the rocks, under a natural arch and round a
bend, to the flat at its foot, where the Crow is waiting with troopers
firing on it. Two more areas in the chain and a new kind of ground (rock,
a winding gorge, the lowest ground on the map); the route 636 steps,
from 505.

**The caves** (2026-11-06). Mark asked for the level longer, and of
three options (a vaporator field before the garden pit, the house's
roofs, caves under the farm) picked the caves. Taking the recordings
opens a panel in the cellar's south wall: Rusk's way out. His cut steps
go down into natural caves under the drifts and the pad: a cavern 7 m
across and 6 m tall, a low passage east under the pad, and a long climb
north under the windbreak into the garage pit. Rough rock underground,
unlike the reservoir's built hall, and the big thing's footsteps
overhead before you see it. The storeroom's shutter into the garage is
gone (the garage opens only on its pit), so the caves are the one way
on. The route 745 steps, from 631.

**Deeper pits** (2026-11-07, after Mark's notes on the caves: the flow is
right, but 3 m is too shallow for a moisture farm): every pit 6 m deep,
and everything under them down by the same 3 m. The three stairs from
the surface each get 12 more steps: the shed's runs on down the
workshop's west wall; the dome's comes out halfway down the courtyard's
north wall and a stair curves down the wall's inside to the east; the
trench runs on down into the garage pit as a straight flight to the
garage's shutter. The route about 32 steps longer.

**Shorter stairs** (2026-11-07, Mark: the courtyard's stair curving round
its wall is good, the others too long). No flight over 8 steps, and a
landing between flights. Depth by size: the courtyard, the big pit,
stays 6 m; the garden, workshop and garage pits 4 m, with their tunnels
and rooms. The shed's stair 8, a landing, 8 (from 24 unbroken); the
dome's 6, a landing, 6, then the doorway and the curve; the reservoir 6 m
under the farm, each of its stairs 12 in two flights (from 16
unbroken). The pad, its drifts, the wash and the flat 1.75 m lower (all
outside the windbreak, so nothing joins up): the trench 8 steps out of
the garage pit's south rim (from 24). The caves shallower: Rusk's steps
6 (from 12), and the floor rising gently from the passage under the pad
(a quarter step every tile or two) instead of a steep climb. The route
the same length (733 steps on the same points, from 737); the climbing
is what's less.

The first design (a ridge and a vaporator field), the second (open
desert, a track) and the third (the walled farm round one yard) are in
this file's history.

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
| Ground | Streets between walls, flat | A canyon floor between rock walls | Four round pits open to the sky, tunnels and rooms under the ground between them, the reservoir's long vault and the caves deeper still; above, a walled yard, a lane and the house's ground; at the end, a dry wash winding down through the rocks |
| Walls | Plaster houses | Rock and Imperial metal | Whitewashed plaster gone grey with soot, round arches, the windbreak with sand drifted against it |
| Route | Out and back through the same streets | Up the canyon and into the garrison | One way, west to east: down, along, deeper, up into the storm, across, down again, deeper, deeper still through the caves, up and out by the trench, down the wash to the Crow |
| Light | Noon: high suns, short shadows, 200 to 224 | Night | Evening: suns 14° and 18° up, the pits in dim shade under a glowing sky, lamplight and fire below ground |
| Air | Still: glints settling | Still | A sandstorm: sand streaming over the pits' rims and the windbreak in gusts, the haze swelling and clearing |

## The look (Mark's reference images, 2026-11-07)

Fourteen pictures of a sunken moisture farm: the film set in the desert
(a courtyard pit, an entrance dome on the flat, a garage mound), a
cutaway drawing of a whole farm, film stills of a garage and a kitchen,
and a game's take on the pit. They set the farm's vocabulary: borrow
the parts, keep our own layout. What they show, by part:

**The pits' walls: two tones, not one.**
- Above, bare earth: warm tan to ochre, rough and slightly bulging, with
  vertical runnels; rough scrub on the rim here and there. The rim is a
  rounded lip of earth, no parapet (as built).
- Below, a band of whitewashed plaster up to about the doorways' tops
  (2.5 to 3.5 m in a 6 m pit), its top edge **wavy and uneven**, rising
  in a bulge over each arch and dipping between them. Never a straight
  line round the pit. Grimy and stained low down.
- A red-ochre dado: a band of red-brown paint along the wall's foot
  (about 0.5 m), and on the stairs' sides and treads.

**Doorways.** Round-topped, set in a thick, rounded surround that bulges
out of the wall like a lip (a hood of plaster, not a flat frame), deep
reveals. Doors: dark plank doors in the arch, or an oval red-orange
door. Some doorways are square under a flat slab lintel instead,
especially low ones at the pit's floor. Small oval niches and blind
windows in the plaster.

**Stairs.** Straight flights along the pit's wall up to a doorway or a
landing halfway up the wall, a solid plastered cheek on the open side
(painted red-ochre), a landing in front of the door. A landing can be a
**balcony**: a ledge along the wall over a doorway below, with a low
plaster parapet, planters on it.

**The courtyard's machinery.**
- **A condenser panel:** a tall flat panel on the pit's wall, about 3 m
  wide and as tall as the whitewash, white, ribbed in horizontal slats
  with a big round gear-like disc on it, two small fittings (antennae or
  vents) on the rim above it. The courtyard's landmark.
- **Vaporator clusters** in the middle of the floor: two or three tall
  stacked cylinders (drums of different widths, collars and joints,
  2.5 to 4 m tall) with thin rods standing round them, and low
  **domed caps** (silver hemispheres on short stalks, 0.4 to 0.6 m) at
  their feet. A shorter squat unit beside them.
- Under the cluster in the cutaway: a round water tank sunk in the
  floor with a glass window, pipes out of its sides. Pipes run through
  the rock between rooms.
- Crates stacked by doorways, planters with greenery, a power droid.

**The entrance dome** (on the flat over the pit): the dome sits on a
low rectangular block, wider than the dome, with lower wings either
side. The arched door is in a **hood that projects forward** from the
block, a rounded arch on two thick jambs. In front of it a **sunken
stairwell** edged by a stone kerb: you go down from outside, before the
door. Grimy and darker at the foot, the plaster cracked. A small panel
by the door, crates and drums against the walls. Mark (2026-11-07): the
great dome takes this, the way down starting outside in its stairwell
rather than in a hall.

**The garage** (on the flat in the references): a low wide mound,
almost flush with the ground, with a **ring of round windows** under its
rim, glowing amber at dusk. Ours stays in its pit (Mark, 2026-11-07), so
only its inside is borrowed: a round room, a **ring of round amber lamps** all the
way round under the ceiling, a **round grating floor** in the middle
inside a low kerb, a big console against the wall (dials, a round
gauge, lit buttons, two small screens), wall lamps, rounded-square
openings with thick frames, cables and pipes on the walls, dark and
oily. Bright through its openings against the dim inside.

**The kitchen and rooms:** a smooth white vault, glossy white built-in
counters along both sides with cupboards over them, a red or salmon
stripe along the cupboards, appliances set in niches (boxes with small
lit panels), rounded corners everywhere; the rough plaster wall shows
where the fittings stop, with oval niches in it. A rug in the living
rooms (red, patterned). Rooms at different heights, joined by short
stairs.

**On the flat:** tall thin vaporators (Mark, 2026-11-07: the film's, a
mast with a humidity sensor on top), small squat units and domed caps
scattered, a few crates.

**The sky:** with the suns 5 to 15° up, the sky is rose to mauve all
over, warmer and paler at the horizon, the two suns big pale discs, the
lower one more orange. Less indigo than the plan's sky.

What we change on purpose: the farm is burning and searched, so
everything above gets soot over the white, scorch over the doorways,
broken crates and the Imperials' gear in among it. Not used: palm-frond
shades and real-world plants (Star Wars, not a real village).

**Under the ground, as built** (2026-11-08). Each dug space names its
lining, and `lineDug()` in `m2.js` puts it on the ground round it, up to
the space's ceiling only, so nothing on the surface changes:
- **The tunnels, the pump room, the workshop:** whitewash, with the pits'
  red-ochre dado along the foot and a whitewashed vault. Riveted deck
  plates (`yard-plate`) on the floors where people work.
- **The house's rooms and the dome's stair:** smooth white plaster
  (`plaster-white`), walls and vault, no dado.
- **The reservoir:** cast duracrete walls (`derelict-wall`), a dark damp
  vault (`duracrete`), an oily concrete floor (`derelict-floor`).
- **The cellar (the cistern):** damp duracrete, walls and vault.
- **The caves and the niche:** bare rock (`sandstone`), the only places
  it's used underground.

The machinery (`models/farm.js`): the farm's water pipe, copper on iron
brackets half a tile under the tunnels' ceilings, comes down out of the
garden court, runs along the pump tunnel's north wall and down the pump
room's wall into the pump (a grey housing, its motor, a gauge, the outlet
down through a red-wheeled valve). In the reservoir it runs the whole
north wall over the stairs' lintels, over a band of pipework along the
wall's foot, and up the east end into the vault; past the workshop pit it
runs east along the tunnel until it goes under the cave-in. Conduit,
wall tanks and units, gauges, vents and fans on the working rooms' walls;
round hatches in the pump room's and workshop's floors; the reservoir's
walkway a grating.

**The garage** (as built): round, 7 m across, tan plaster under a dark
metal ceiling. The tiles are dug in steps round the circle; its wall is a
model (`garage-ring`) that collides along its curve, with the dark band
under the ceiling, two round amber lamps to each of its 34 panels, and a
glowing globe on a bracket either side of the console. In the middle, a
bronze grating sunk a quarter step inside a round red-ochre kerb (a
model over the tiles' stepped edge). The console against the north wall:
a big gauge, two lit screens, dials, lamps and lit buttons. A thick frame
with rounded top corners round the opening onto the pit. Oil on the floor.

**The hangar** (Mark's notes, 2026-11-09: the film's garage has the
skyhopper in the next room): through a second framed opening in the
garage's east side, under the windbreak, into a hangar dug under the
drifts beyond it (190..206, 52..78), 8 m across and 13 long. Its floor is
2 m under the garage's and its roof 1 m over the ground (6.75 m), the
roof's doors over the middle. A grate catwalk at the garage's floor runs
along its west and north walls behind a rusty railing, and a stair goes
down along the south wall. On the floor, the family's skyhopper
(`skyhopper`, `models/farm.js`, a T-16 after Mark's references,
2026-11-09): taller than it's long (11 tall, 6.6 long), a cockpit body
triangular from the front with its windscreen and a band of windows, a
tall upper airfoil (leading edge upright, trailing edge swept, two domes,
a red mark at its tip), the airspeed sensor along the ridge, two lower
airfoils splayed down to the floor like legs, the engine and gear slung
under the body with a laser cannon. Light grey riveted panels
(`cone-panel`). You can walk in under its body. Dark plating up to the
catwalk, tan panels over it, brighter than the garage, so it shows bright through the opening.

**The kitchen and the common room** (as built; made cosier after Mark's
notes, 2026-11-09): the kitchen is a galley straight on from the
courtyard's south doorway, 4 tiles across and 10 deep (158..162, 61..71),
as in the film's still looking down it to the bright doorway. White
built-in counters close along both walls (a dark kick, cupboard doors, a
worktop with a rounded nose), with cupboards over them carrying a red
stripe and lights under them; the vault low (3.25, stepping down to 2.75
over the cupboards); two stacks of appliances against the far end (dark
windows, lit buttons, a red trim). A doorway at the far end's west side
into the storeroom (150..156, 61..70: crates, an oval niche in its west
wall, the stair down to the cellar). The common room has the red rug and
four tall oval niches round its walls (`niche-oval`, a decal).

## Grid and size

- **208 × 214 tiles** (104 × 107 m). The farm inside its windbreak is an
  L: a strip 176 × 52 along the north (the garden court, the work yard,
  the lane, the house), and the house's end running on south to 92
  deep (the back plot over the cellar, the garage pit). The landing pad
  is south of that, 46 × 26 in its drifts. The reservoir is dug under
  the sand outside the windbreak's south side, 64 × 12. South of the
  pad, the rocks: the wash winds 45 m down through them to the flat
  where the Crow sets down, 26 × 16 m. The caves run under the drifts
  west of the pad, its south edge and the east windbreak, about 67 m
  from the cellar to the garage pit.
- `m2`, painted in code by the painter with the town kit, like `m1`.
- The sky is at 32.
- **The route:** the shortest way from the garden pit to the pickup
  under the Crow, by way of the officer, is about 773 steps (the
  monsters' flow field, tile to tile; 4 fewer since the stairs were
  shortened, 737 to 733 on the same points): 32 more than 745 when the
  pits were deepened (measured on the same points: 703 to 735; 8 more up the
  shed's stair, 16 more down into the courtyard, 8 more through the
  caves to the foot of the garage pit's flight). At 745 it was 143 to
  the workshop pit, 136 across the yard to the gate, 60 to the
  courtyard, 47 to the recordings, 29 back across the cellar to Rusk's
  panel, 150 through the caves to the garage pit, 24 up the trench to
  the pad, 156 down the wash to the Crow. Before the caves it was 631 (89 from the recordings out to the
  pad); before the ending was stretched, 505 (the pickup on the pad); the fourth blockout's
  393 (59 to the workshop pit), the third's 292, before any hunting
  round. All of it is forward.
- **Views:** inner walls 3 m tall split the farm into compounds, so no
  view outdoors is longer than about 75 tiles (the shed's door to the
  dome, over the gate); beyond the windbreak, only the sky and the
  backdrop. Under the ground, views end at the next bend, but for the
  reservoir's hall, 64 tiles end to end, and the caves' climb, about
  40. In the wash, views end at its
  bends (its long stretch about 35 tiles).
- **Measured** on the blockout (2026-11-06, `node` on this machine, the
  same bench run on Mos Eisley for comparison): a view draws in 8 to 22
  ms (Mos Eisley 12 to 65); a monster's plan takes 0.4 to 1.1 ms (Mos
  Eisley up to 2.7 here; the third blockout about 2). No `navReach`.
  With the reservoir, plans take 0.3 to 0.6 ms, and a view in the
  reservoir draws in 3 to 4 ms. On the pad, in the wash and on the
  flat, a view draws in 6 to 17 ms, and plans take 0.5 to 0.9 ms.

## The map

The surface, one character for 4 tiles across and 6 down:

```
  x   0       32      64      96      128     160     192
y     +----------------------------------------------------+
    6 |  ##############################################    |
   12 |  #:::::::::::::#SSSSooooooooooGooooooDDDDooooo#    |
   18 |  #:::::::::::::#SSSSooooooooooGooooDDDDDDooooo#    |
   24 |  #:::::::::::::#oooooooooooooo######ooDDoooooo#    |
   30 |  #:::::::::::::#oooo@oooiiiioo#::::#oooooooooo#    |
   36 |  #:::::::::::::#ooooooooiiiioo#::::#oCCCCoo@@o#    |
   42 |  #:::PP::@:::::#ooKKoooooooooo#::::#CCCCCCo@@o#    |
   48 |  #:::PP::::@@::#oKKKKooooooooo#::::#CCCCCCoooo#    |
   54 |  #:::::::::::::#oKKKKo@ooooooo#:::@#ooCCoooooo#    |
   60 |  #################################:#oooooooooo#    |
   66 |                                  ##############    |
   72 |                                    #::::::::::#    |
   78 |               @    @               #::::::QQQQ#    |
   84 |               @    @               #::::::QQQQ#    |
   90 |                                    #:::::::tt:#dddd|
   96 |                                    #:::::::tt:#dddd|
  102 |                                  ##############d..d|
  108 |                                d..dd..............d|
  114 |                                d..................d|
  120 |                                d..dd............ddd|
  126 |                                ddddd............ddd|
  132 |                                dddddddddd,,dddddddd|
  138 |                                dddddddddd,,,ddddddd|
  144 |                ^^^^^^^^^^^^^^^^^^^^^^^^^^nnn^^^^^^^|
  150 |                ^^^^^^^^^^^^^^^^^^^^^^^^^,,,,^^^^^^^|
  156 |                ^^^^^^^^^^^^^^^^,,,,,,,,,,,^^^^^^^^^|
  162 |                ^^^^^^^^^^^^^^,,,,,^^^^^^^^^^^^^^^^^|
  168 |                ^^^^^^^^^^^,,,,,^^^^^^^^^^^^^^^^^^^^|
  174 |                ^^^^^^,,,,,,,,,,,^^^^^^^^^^^^^^^^^^^|
  180 |                ^^^^^,,,,,,,,,,,,,^^^^^^^^^^^^^^^^^^|
  186 |                ^^^^^,,,,MMM,,,,,^^^^^^^^^^^^^^^^^^^|
  192 |                ^^^^^^,,,,,,,,,,,^^^^^^^^^^^^^^^^^^^|
  198 |                ^^^^^^^^^,,,,,^^^^^^^^^^^^^^^^^^^^^^|
  204 |                ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^|
      +----------------------------------------------------+
  #  the windbreak and the walls inside it, 3 m (sand drifted against their foot)
  o  ground you can walk: the work yard, the lane, the house's ground
  :  ground out of reach: the garden court, the plots behind the lane and the house
  P  the garden pit (the drop-off)    K  the workshop pit    C  the house's courtyard pit
  Q  the garage pit    S  the generator shed    i  the Imperials' staging point
  G  the farm's gate (the red lock)    D  the house's great dome and its stairwell
  t  the trench, and its gate through the windbreak    @  a light well (outside: the reservoir's)
  .  the landing pad, and the cuts west and east in the drifts round it
  d  drifts out of reach    ^  the rocks, their tops out of reach
  ,  the wash and the flat, below the pad    n  the rock arch over the wash
  M  the Crow, set down on the flat (under it, the pickup)
```

Under the ground, the same scale:

```
  x   0       32      64      96      128     160     192
y     +----------------------------------------------------+
    6 |  ##############################################    |
   12 |  #               ee           #               #    |
   18 |  #               ee           #       ee      #    |
   24 |  #              kkkkk            ###  ee      #    |
   30 |  #     hhh      kkkkk              # C-CC     #    |
   36 |  #   PPhhh      kkkkk            wwwCCCCCCqqqq#    |
   42 |  #  PPP----ppp   KKKK            ww-CCCCCCqqqq#    |
   48 |  #  PPPP  pppp   KKKK----%%      wwwCCCCCCqqqq#    |
   54 |  #        pppp   KKKKrrr-         -  CCCC gggg#    |
   60 |  ##########e############e#########--sssss-=ggg#    |
   66 |            ee           e          #ssssss=ggg#    |
   72 |           RRRRRRRRRRRRRRRR         #xvxxx  == #    |
   78 |           RRRRRRRRRRRRRRRR       nnxxxxxx QQQQ#    |
   84 |           RRRRRRRRRRRRRRRR         xxxxxx QQQQ#    |
   90 |                                    #       tt ddddd|
   96 |                                    #       tt ddddd|
  102 |                                  #############dd..d|
      +----------------------------------------------------+
  -  a tunnel     e  a stair (the shed's hatch; the dome's; the reservoir's two)
  R  the reservoir (deeper, under the sand outside the windbreak)
  P  K  C  Q  the pits                p  the pump room     h  the hidey-hole (secret)
  k  the workshop    %  caved in (rubble)    r  the well room (secret)
  w  the common room    q  the quarters    s  the storeroom    v  the stair down to the cellar
  x  the cellar (deeper)    n  its niche (secret)    g  the garage    =  its shutters
```

**The way through,** one area to the next:

```
 WEST, the suns setting                                     EAST, the night coming

 1 garden pit ──> 2 pump tunnels ──down──> 3 reservoir ──up──> 4 workshop pit
   drop-off         the pipe,                a long dark          first fight in
   quiet, blue      light wells              hall: water,         the open; the way
                                             pillars, lamps       east caved in
                                                                        │ up the shed's stair
                                                                        v
 6 the lane <────────────── the gate, the red key <────────────── 5 work yard
   the dome straight ahead                                          the storm, fire,
     │                                                              the officer's key
     v
 7 the house ──> 8 the cellar ──down──> 8a the caves ──up──> 9 garage pit, ──> 10 the pad
   the dome, its    the recordings;     Rusk's steps, the       trench, out      Jan won't land;
   pit, its rooms   dark, quiet         cavern, the climb       into the storm   the wave
                                                                │ south
                                                                v
                                    12 the flat <──down── 11 the wash
                                       the Crow,             into the rocks,
                                       troopers on it        under the arch
```

1. **The garden pit** (the drop-off): quiet, cold blue grow lamps. Jan
   names the goal. One arch out, east.
2. **The pump tunnels:** east under the garden court to the pump room,
   the water pipe overhead (follow the pipe), two light wells. One or
   two troopers. The pump room's one way on is the stair down beside
   its pump.
3. **The reservoir:** 12 steps down into the farm's water store under
   the sand outside the windbreak: one hall 32 m long running east, 4.5
   m to its vault, dark, a walkway along its north side and a shallow
   pool beside it, a row of pillars in the pool, two shafts of evening
   light, the Imperials' work lamps, the pipe along its wall. Troopers
   down its length: a long fight from pillar to pillar. At its far end,
   12 steps up.
4. **The workshop pit:** up into the tunnel beside it. East, toward the
   house, it caved in, the rubble right there; west, the pit, open to the
   sky. The first fight in the open, troopers on its floor and on the
   rim above. The one way on is north, through the workshop to the
   generator shed's stair.
5. **The work yard:** up the stair and out of the burning shed's door
   facing east: across the yard, the gate with its red lock, and over it
   the house's dome. The staging point's floodlight to the right; the
   officer there has the key. Look back down into the workshop pit.
6. **The lane:** through the gate, a lane 6 m wide running east straight
   at the dome's stairwell, troopers behind barricades, the dome growing.
7. **The house:** the dome's hall and its stair down into the courtyard
   pit (the big fight, troopers on the rim and below), the family's
   rooms round it: the common room, the quarters, the storeroom, a
   tunnel from the common room round to the storeroom. The storeroom's
   stair goes down.
8. **The cellar:** under the house, dark, quiet, no one. The recordings.
   Footsteps overhead; a panel in the south wall grinds open.
8a. **The caves:** Rusk's way out. His cut steps go down 6 into the
   dark, then natural caves under the drifts and the pad: a cavern 7 m
   across and 6 m tall, troopers searching it with a lamp; the ground
   shakes, sand pours from the cracks; a low passage east under the pad,
   rising, then a long gentle climb north, more troopers coming down it, up into the
   garage pit's east side.
9. **The garage pit and the trench:** out of the caves into the pit
   (the garage's shutter up off its north side, the ammo inside), up the
   trench in the storm.
10. **The pad:** Kyle calls the Crow. Jan won't land with a squad
    coming over the drifts; she'll set down where the dry wash comes out
    of the rocks. The wave: troopers through the cuts west and east, and
    up the wash.
11. **The wash:** south out of the pad's hollow and down into the rocks,
    under a natural arch, round a bend and west, down again: boulders for
    cover, troopers lying in wait.
12. **The flat:** the wash comes out onto a flat at the foot of the
    rocks, the Crow hovering on it, troopers firing on it. Under the
    Crow, the level ends.

**What holds the player back** (each gate in sight of the way round it):

- The garden pit and the workshop pit: 8 deep (4 m), their only ways
  out their arches. The garden court over the pump tunnels is out of reach.
- The pump room: its one way on is the stair down to the reservoir.
- The reservoir: under the sand outside the windbreak, out of reach
  above; its two shafts of light too narrow to climb.
- The tunnel at the head of the reservoir's stair: east, toward the
  house, caved in a few tiles on (the raid's grenade), the rubble in
  sight from the stair's head; west, the workshop pit. From the pit, the
  stair north is the only way on.
- The work yard: walls 3 m all round (sand drifted against their foot:
  you can walk up the drift but not onto the wall). The gate wants the
  red key, which the officer at the staging point carries on every skill.
  The validator's reach check confirms the lane can't be reached without
  it.
- The lane: walled both sides; it opens only at its east end, onto the
  house's ground at the dome's stairwell.
- The house's ground: walled in. Down by the dome's stair, or a jump
  into the courtyard pit or a light well (a drop of 12, which hurts:
  falls hurt from about 5.8).
- The cellar: Rusk's panel in its south wall is shut until Kyle has
  the recordings; then it opens (`bolthole`) and stays open. The stair
  back up only leads back into the house.
- The caves: one way, no turnings, under the ground out of reach above.
- The garage: its shutter on the garage pit is down until Kyle has the
  recordings, then up (`garage`); its wall to the storeroom is blank.
  The garage pit sits in the back plot,
  out of reach, so the trench and the pad come only after the cellar.
- The trench's walls stand 2 m over the back plot at its top, so the way
  out is only through the gate.
- The pad: drifts too steep to climb all round, cut west and east into
  pockets (where the wave comes from) and south into the wash, the one
  way on.
- The wash and the flat: walled by the rocks, their tops 3.5 m and more
  over the pad, out of reach; one way down, no side turnings.

**What points the way** (stand-in words):

- In the garden pit, Jan: "I CAN'T SET DOWN WITH THEM ON THE GROUND.
  THIS IS AS CLOSE AS I GET." Kyle: "RUSK SAID THE CELLAR, UNDER THE
  HOUSE." Jan: "THE BIG DOME AT THE EAST END. FOLLOW THE WATER PIPE. CALL
  WHEN YOU HAVE IT."
- The water pipe on the tunnels' ceilings, down into the reservoir and
  along its wall, then on east toward the house's cistern (in the detail
  step).
- At the head of the reservoir's stair, the rubble in sight, Kyle:
  "CAVED IN. UP AND OVER, THEN."
- Out of the shed's door: the gate dead ahead with the dome over it.
  Kyle: "THERE'S THE HOUSE." At the gate, without the key: "AN IMPERIAL
  LOCK ON THE FARM'S GATE. THE OFFICER WILL HAVE THE KEY." The staging
  point's floodlight marks where he is.
- In the lane, the dome straight ahead; its stairwell and door lit.
- Picking up the recordings: heavy footsteps overhead, dust falls, Jan:
  "KYLE, SOMETHING BIG JUST WALKED OUT OF THE STORM. GET OUT OF THERE."
  A panel in the cellar's south wall grinds open; Kyle: "RUSK'S WAY
  OUT." (Later: the family's speeder roars away up the trench.)
- In the cavern, the ground shakes and sand pours from the cracks: the
  big thing walking overhead.
- At the trench's gate, Kyle calls the Crow. Jan: "NOT ON THAT PAD,
  THERE'S A SQUAD COMING OVER THE DRIFTS." "I'LL SET DOWN WHERE THE DRY
  WASH COMES OUT OF THE ROCKS, SOUTH OF YOU." The wash's mouth is ahead
  across the pad, the rock arch over it in sight.
- Out of the wash's last bend, the Crow on the flat. Jan: "THERE YOU
  ARE. THEY'RE SHOOTING AT MY SHIP, HURRY!"

## Levels

Heights in units (1 unit = 0.5 m). The landing pad is at -3.5 (0 before the stairs were shortened).

| Where | Floor | Notes |
|---|---|---|
| The windbreak and the walls inside it | 6.5 | 3 m over the ground, out of reach; sand drifted against their foot rises to 2.5 |
| The farm's ground (the yard, the lane, the house's) | 0.5 | |
| The generator shed | 0.5, ceiling 4.5 | Its hatch and stair go down south, 8 steps of 0.5 under the yard, a landing, 8 more on down the workshop's west wall |
| The house's great dome | its stairwell's foot and hall -2.5, the hall's ceiling 5 | Its block 8.5 (4 m), the wings 5.5, the dome on it 5.5 more; the stairwell goes down east from the lane, 6 steps, to the door; inside, 6 more down south to -5.5, on to a doorway halfway down the courtyard's wall; 12 more curve down the wall's inside to the floor |
| The pits | -7.5; the courtyard -11.5 | The garden, workshop and garage pits 8 (4 m) under the ground, the courtyard 12 (6 m); open to the sky; no parapets |
| The tunnels and rooms | as their pit's floor, ceilings 4 over (2 m) | Under the ground (slabs, their tops at 0.5); tunnels 4 wide |
| The light wells | as the room under them, open to the sky | 2 x 2, kerbed on the ground (0.9); jumping down one hurts (about 17 into the small pits' tunnels, 36 into the house's, 44 into the reservoir) |
| The reservoir | -13.5, its vault -4.5 (4.5 m) | 12 steps down from the pump room and 12 up at its east end, each 7 and 5 with a landing between; its pool 0.5 deeper; under the sand outside the windbreak (its top 0.5) |
| The garage | -7.5, ceiling -3 | |
| The cellar | -14.5, ceiling -10.5 | Six steps down from the storeroom; the cistern's pool 0.5 deeper |
| The caves | -14.5 down to about -18, then up to -7.5 | Rusk's 6 steps down; the cavern's floor rough (±0.5), its roof up to 6.5 m; the passages 2 to 2.5 m; the floor rising from the passage under the pad, 10.5 over about 36 m, a quarter step every tile or two |
| The trench | -7.5 to -3.5 | 8 steps up south out of the garage pit's south rim, then level to the gate through the windbreak |
| The pad | -3.5 | Its drifts rise 2 at once, then on up |
| The rocks | 3.5 to 7.25 | Out of reach: the wash's walls, 4 to 7 m over its floor |
| The wash | -3.5 to -6.5 | Three drops of two steps of 0.5; the arch 2.5 m over it, 1.5 m thick |
| The flat | -6.5 | The lowest ground on the map |

## Areas

Boxes are x0..x1, y0..y1 in tiles; circles are a centre and a radius. As
built in the fourth blockout, with the reservoir and the stretched
ending (2026-11-06).

| # | Area | Where | What's there |
|---|------|-------|--------------|
| 1 | **The garden pit** (the drop-off) | round, (28, 46), r 6 | A small pit, 12 across: the family's hydroponic garden, grow beds in rows under grow lamps (a cold blue-white light, unlike anything else on the map), a water tank. Sand streams over its rim. Jan drops Kyle in it and is gone. Quiet for a moment. One arch, east. Round it, the garden court (12..64, 12..64), out of reach: a few vaporators against the sky. |
| 2 | **The pump tunnels** | 33..58, 44..58 | East from the garden pit (35..50, 44..48, a light well) to the pump room (46..58, 46..58: the farm's pump, the water pipe going down into it, a light well), its one way on the stair down beside the pump (50..54, 58..74, 12 steps, a landing halfway) to the reservoir. Older and rougher than the house's tunnels, the pipe along the ceiling. |
| 3 | **The reservoir** | 44..108, 74..86 | The farm's water store, dug under the sand outside the windbreak's south side (out of reach above): one hall 32 × 6 m, 4.5 m to its vault (floor -13.5), dark (72 to 80), sandstone. A walkway along its north side (74..78), a shallow pool beside it (0.5 deeper), five pillars in a row in the pool, two shafts of evening light down into the water (61, 83 and 81, 83), the Imperials' work lamps, the pipe along its north wall. The stair from the pump room comes in at its west end; at its east end, 12 steps up north (100..104, 58..74, a landing halfway) under the wall to the tunnel beside the workshop pit. |
| 4 | **The workshop pit** | round, (80, 52), r 8 | 16 across, open to the sky: oil, droid parts, a stripped speeder burning. Troopers on its floor and on the rim above. You come in by its east arch, from the tunnel (87..110, 50..54) the reservoir's stair comes up into (100..104, 54..58): east, toward the house, the tunnel caved in (106..110), the rubble in sight from the stair's head. An arch north to the workshop. |
| 4a | **The workshop** | 70..88, 26..40 | North of the pit under the yard: the droid bench, a pit droid, tools, vaporator parts, a lamp on, a light well. The generator shed's stair comes down into its north-west corner (70..74, 14..26) and on down its west wall to the floor (26..38), open to the room. |
| 5 | **The work yard** | 66..124, 12..64 | 29 × 26 m, walled, sand drifted against the walls. In it: the generator shed, the staging point, the workshop pit's rim, the well room's light well, two vaporators, cargo pods, a dead power droid. The storm is thickest here. |
| 5a | **The generator shed** | 68..84, 12..24 | A tin blockhouse in the yard's north-west corner over the farm's power unit, burning: flames out of its roof, a flickering light, smoke torn east. The hatch and stair in its floor; its door east (83, 15..20), onto the yard, facing the gate. |
| 5b | **The Imperials' staging point** | 102..118, 30..44 | In the middle of the yard, off the line from the shed to the gate: a floodlight tower lit for the evening, supply crates, barricades at a slant, a comm unit on a crate. The officer with the red key; the commander on skill 3 and up. |
| 5c | **The gate** | 124..126, 15..21 | The farm's gate in the yard's east wall, straight across from the shed's door, 6 wide: the Imperials' red lock on it (a stand-in Imperial door), a lamp over it. |
| 6 | **The lane** | 126..146, 12..24 | 20 long and 6 m wide between the windbreak and a wall, running east from the gate straight at the dome's stairwell. A vaporator either side, barricades, troopers behind them. The plot south of it (126..144, 26..64) is out of reach. |
| 7 | **The house's ground** | 146..188, 12..70 | Walled in: the great dome, the courtyard pit's rim (no parapets), two light wells' kerbs, a vaporator. Troopers on the rim. |
| 7a | **The great dome** | 152..168, 14..26 | The entrance dome after the film's, the tallest thing on the farm: a block 4 m tall (wings 2.5 m north and south), an 11-wide dome on it. The way down starts outside: a sunken stairwell from the lane's end (143..152, 17..23, kerbed), 6 steps east to the door at its foot, round-topped in a hood. Inside, a hall (153..167, 15..25) at the stairwell's foot, and in its floor a stair (158..162, 22..32), 6 more south under the ground to the courtyard pit's north doorway, halfway down its wall. |
| 7b | **The courtyard** | round, (160, 46), r 12 | A round pit 24 across and 6 m deep, open to the sky, its walls whitewashed plaster gone grey with soot, round-topped arches all round: the dome's stair north (its arch halfway up the wall, a stair 3 wide curving down the wall's inside to the east, 12 steps), the common room west, the quarters east, the storeroom south. The suns are too low to reach in, so its floor is a dim pool against the lit rim, lit by its doorways and a cart burning; an overturned table, a broken droid, crates. The big fight: troopers in it and on the rim above. |
| 7c | **The common room** | 138..146, 40..52 | West of the courtyard under a low vault: the family's table knocked over, a hearth, a bench. A tunnel south (140..144, 52..66, a light well) and east (144..150, 62..66) round to the storeroom: the loop. |
| 7d | **The quarters** | 174..186, 38..54 | East of the courtyard (its arch 171..174, 49..53, south of the wall stair's foot): the family's sleeping alcoves, a chest turned out, a child's toy droid, a light well. |
| 7e | **The kitchen and the storeroom** | 158..162, 61..71; 150..156, 61..70 | South of the courtyard: the kitchen a narrow galley, the storeroom west of it through a doorway at its far end, crates in it. The stair down to the cellar at the storeroom's south (152..156, 70..76). |
| 8 | **The cellar** | 144..166, 76..88 | The objective. A vaulted cistern room, a dark pool along its south side (the house's own store), the pipe coming down into it, one lamp knocked over and still lit on the floor. Quiet and dark (64 to 80): no enemies. Rusk's helmet recordings in a sealed case behind a loose stone at its east end (162..166, 77..81): picking them up starts the ending and opens Rusk's panel in the south wall (144..147, 88). |
| 8a | **The caves** | from (145, 88) down to (140, 122), east to (189, 128), north to (190, 84) | Rusk's way out. His cut steps, 3 wide, 12 down south; then natural rock: the cavern (about 131..148, 104..128), 7 m across at its widest and 6 m to its roof, troopers searching it by a lamp, light through a crack; a low passage east under the pad's south edge and the wash, 5 m wide; then the climb north under the east windbreak, troopers coming down it, into the garage pit's east arch (186..189, 82..87). Dark (64 to 72). |
| 9 | **The garage** | 174..186, 58..72 | Behind its shutter on the garage pit's arch, down until the recordings are taken. Inside: oil, tools, a second speeder stripped for parts, the space where the family's speeder stood, its dust still in the air. A stock of ammo before the wave. |
| 9a | **The garage pit** | round, (180, 84), r 7 | The speeder bay, 14 across and 4 m deep, open to the sky, in the back plot (out of reach from above), the trench going up out of its south rim: oil stains, a fuel tank, a hoist. |
| 9b | **The trench** | 177..183, 91..106 | Out of the garage pit's south rim: a cut 6 wide, 8 steps of 0.5 up south, then level, walled in the farm's plaster, open to the sky, drifts on its steps; then a gate through the windbreak (104..106) onto the pad. |
| 10 | **The landing pad** | 150..196, 106..132 | The family's landing pad outside the windbreak, in a hollow of drifts too steep to climb, cut west and east where the wind has scoured gaps (pockets beyond them, out of sight), and south into the wash; the farm's beacon lamps still lit round its spot (168..176, 116..124), low rocks for cover. The storm at its worst. Jan won't land on it. The wave comes through the cuts and up the wash; the prototype's shape walks out of the blowing sand behind (later). Tuskens on the drifts' crest above, watching (Mark's sheet; until then nobody). |
| 11 | **The wash** | from (174, 128) down to (116, 178) | A dry stream bed winding down into the rocks at the Jundland's edge, 4 to 5.5 m wide, its rock walls 4 to 7 m: south 10 m out of the pad's hollow (two steps down, then under a natural arch of rock 1.5 m thick and 2.5 m up), round a bend, west 15 m along its long stretch (two more steps), then south-west (two more). Boulders for cover; troopers lying in wait down the long stretch (they don't come for the shooting on the pad). A med kit under the arch (skills 1 to 3), an energy pack at the bend. |
| 12 | **The flat** | about 84..136, 171..203 | Where the wash comes out of the rocks: a flat of sand 26 × 16 m at their foot, the lowest ground on the map, rock all round. The Crow hovering on it, nose north-west, its landing lights on; troopers between the wash and the ship, firing on it; boulders. Under the Crow's middle (102..111, 186..195), the level ends. |
| 13 | **The edges** | | The windbreak's top, the drifts' crests and the rocks' tops against the sky; beyond, only the backdrop: the Jundland's mountains to the north, east and south, the Dune Sea's dunes to the west, the suns setting over them. |

### Secrets (3)

1. The hidey-hole off the pump tunnel (35..44, 34..40), behind a door in
   the plaster (39..41, 43): where the family hid Rusk, his bedroll, an
   empty ration pack, scratches counting days on the wall; a med kit and
   a thermal detonator the family kept. A line ("A SCOUT'S BEDROLL.
   SOMEONE SLEPT HERE A LONG TIME.").
2. The well room (90..98, 56..62): sealed under the yard south of the
   caved-in tunnel, reached only by dropping down its light well (93, 58)
   from the yard; a secret door out north (93..95, 54) into the caved-in
   tunnel. A shield unit and an energy pack.
3. The cellar's niche (139..143, 78..84), behind a loose panel in its
   west wall: power cells and a med kit.

## Light and air

An evening with a storm coming in. Nothing like Mos Eisley's bright,
still noon.

- **The suns:** both low in the west-south-west, setting over the dunes:
  azimuths about 196 and 204, 14° and 18° up (`town.finish(EVENING)`,
  the suns as data, as `SUNS` is for Mos Eisley). A building 6 tall
  throws shadows 20 to 30 tiles long to the east-north-east, so the
  walls' shadows lie across each compound's west side, the dome's shade
  behind it, and the pits are in shade all evening. Kyle walks east,
  away from them: ahead, the house's west face lit by the last sun
  against the darkening east.
- **Levels:** sunlit open ground 176 (the town's 216), one sun's shadow
  -40, both -68, so deep shade is about 104. Walls facing the suns are
  lit by the sunlit ground in front of them; walls facing east are in
  their own shadow. Interiors 96 to 120, with lamps. The courtyard's floor
  104. The reservoir 72 to 80, with the
  Imperials' work lamps. The cellar 64 to 80. Fires 200 and over, flickering (`fx:
  'fire'`). The staging point's floodlight a pool of 64 over the sand;
  the light wells' shafts of evening light on the tunnels' floors; the
  garden pit's grow lamps a cold blue-white.
- **Sky:** `sky-dusk`, a new sky from Robotics' cloudy RESKY01
  (`derive.mjs`, as `sky-day` is): mauve overhead (a touch of indigo at
  most, after Mark's references), rose lower, a warm pale amber at the
  horizon fading into the haze. Mos Eisley's sky
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
  shutters, the street clutter, the farm's vaporators
  (`models/vaporator.js`, after the film's, Mark's references
  2026-11-07: a 3.9 m one with a mast and a turning humidity sensor on the
  ground, the courtyard's cluster of a 3.4 m and a 2.25 m one, a squat
  unit and domed caps, all from the same parts), the fire drum, worn barricades and floodlight towers, boulders, the X-34,
  pit droids and power droids, the workbench and swoop hoist, terminals,
  a speeder bike, the Imperial red door (the gate's stand-in).
- **New** (the look's details are in "The look", above): the condenser panel, the round
  doorway surrounds and their wavy whitewash, the garage's ring lamps,
  grating and console, the kitchen's white counters, fires on roofs and in doorways
  (decorations with fire, ember and smoke emitters, as the fire drum
  has), the water pipe along the tunnels' ceilings, the farm's pump, the
  reservoir's pillars and the Imperials' work lamps, the
  light wells' kerbs, grow beds and grow lamps, the family's table and
  hearth, the quarters' alcoves and a toy droid, shelves of tins, rubble
  and a broken support for the caved-in tunnel, the farm's gate with the
  Imperials' red lock clamped on it, a burning speeder and a burning
  cart.
- **Long shadows from models:** the vaporators are models, and the town
  kit's shadows only see tiles and domes. A tall thin caster per vaporator
  (content side, in `shadows()`) gives each its long shadow across the
  yard.

## Characters

| Who | Where | Art |
|-----|-------|-----|
| Sandtroopers, a commander | everywhere | have |
| Stormtroopers, officers | the tunnels, the pits, the house; the work yard's officer carries the red key | have |
| Probe droid | over the yard | have |
| The family (voices, then gone) | in the garage, before the cellar | none needed |
| Tuskens | on the drifts above the landing pad, watching | **Mark** |
| The prototype | walking out of the sand at the end | **Mark** |

## Sound

- **Ambient** (PLAN.md section 4's looping positional sounds, not built
  yet): the wind, rising and falling with the gusts (DF's WIND1), fire
  crackling at the burning buildings, the drip and echo of the
  reservoir and the cistern.
- **Music:** combat from the start.
- **One-shots:** the prototype's footsteps at the end, the family's
  speeder roaring away.

## Enemies and items by skill

All combat. As placed in the blockout (25, 42 and 53 monsters on skills
1, 3 and 5, and the wave's 5 on top), to be tuned in the life step:

| Area | Every skill | 2+ | 3+ | 4+ |
|------|-------------|----|----|----|
| The garden pit | none: a moment to look round | | | |
| The pump tunnels | 1 | | | 1 more |
| The reservoir | 2 on the walkway | 1 more in the pool | | 1 more by the far stair |
| The workshop pit | 2 below, 2 on the rim above | 1 more below | | 1 more on the rim |
| The workshop | 1 | | 1 more by the stair | |
| The generator shed | | | 1 at the hatch | |
| The work yard | the officer (the red key), 2 sandtroopers, the probe droid | 1 more | the commander | 2 more |
| The lane | 2 behind its barricades | | 1 more | |
| The house's ground | 2 on the courtyard's rim | 1 more | | 1 more |
| The dome's stair | | | 1 | |
| The courtyard | 3 stormtroopers | 1 more | an officer | 1 more |
| The house's rooms | 1 in the common room, 1 in the storeroom | 1 in the quarters | | 1 in the loop tunnel |
| The cellar | none: quiet and dark | | | |
| The caves | 1 in the cavern, 1 on the climb | 1 more in the cavern | 1 more on the climb | 1 in the passage |
| The trench's gate | | | 1 on the pad | |
| The wave, when Kyle calls | 5 stormtroopers: 2 through the west cut, 1 through the east, 2 up the wash (the plan: more on the higher skills) | | | |
| The wash | | 1 lying in wait | | 1 more |
| The flat | 2 between the wash and the Crow | | 1 more | 1 more |

Med kits and ammo along the way, more on skills 1 and 2, a stock of
ammo in the garage before the wave, a med kit and an energy pack in the
wash.

## Engine and content pieces it needs

| Piece | Where | Size |
|---|---|---|
| Weather as a list of types | `world/weather.js`, defs, validator, MODDING.md | Small |
| Gusts, carrying the particles harder | weather, particles' `wind` | Small |
| The haze swelling with the gusts | world, `render/view.js` (rebuilds its table already) | Small |
| The sky fading into the sand in a gust | `render/columns.js` (sky rows through a haze step) | Small, measured |
| A sky that wraps once (`skyWrap`) | `render/columns.js`, defs | Small |
| The recordings: an objective item (a data tape) | PLAN.md section 7 | Small |
| Evening suns, model shadow casters | `lib/town.js` (content) | Small |
| A dune backdrop | `lib/backdrop.js` (content) | Small to medium |
| Tuskens, the prototype | Mark's sheets | Mark |

Not needed: driving (the family leaves off screen), `remove`, escorts,
`wait` (Jan lands while Kyle fights down the wash). `fly` and `cutscene`
(section 6) come later for the drop-off and the Crow taking off at the
end; until then a message stands in for each, and the Crow is on the
flat from the start.

## Build order

Each step is a commit Mark can try (`?map=m2`), with snapshots. The steps
are in PLAN.md section 9.

1. **The design** (the paper pass), for Mark's OK on the flow (given
   2026-11-05).
2. **The blockout** (built 2026-11-05): the whole map as plain volumes
   at their final heights, the real ways between them, stand-ins for the
   domes and buildings, message triggers standing in for the story.
   Played end to end. Mark's notes the same day: far too many
   vaporators; the way to the farm underwhelming, and walls in the
   distance; the farm too small.
   - **The redesign** (2026-11-05) and **the blockout again** at 288 ×
     256: open sand to dune crests, the track and its guide posts, a
     dozen vaporators, the farm with three pits and the tunnels. Mark's
     notes: the interior great and compelling, the passages with a
     glimpse of sky; the exterior still bad, and pushing the engine.
   - **The third design** (2026-11-05): the farm walled in by its
     windbreak, Kyle dropped into the garden pit, one dash across the
     yard, the pad in a hollow of drifts. Then **the blockout again**.
     Mark's notes (2026-11-06): the direction right, the feel more
     correct; but small, too open-ended, one big open area to hunt round.
   - **The fourth design** (this file, 2026-11-06): a walk west to east
     to the house, a chain of areas with one way on from each, the house
     named at the start and seen from the work yard on. Then **the
     blockout again** (built 2026-11-06). Mark's notes the same day: on
     the right track; stretch it out, the underground most, with another
     segment, not more complex ones.
   - **The reservoir** (2026-11-06): between the pump tunnels and the
     workshop pit, in the design and the blockout. Mark's notes: he loves
     it; more, at the end: get through a wave of stormtroopers and find
     Jan, instead of ending as you come out of the trench.
   - **The ending stretched** (2026-11-06): Jan won't land on the pad;
     the wave, the wash and the flat with the Crow, in the design and
     the blockout. Mark asked for it longer still.
   - **The caves** (2026-11-06): Rusk's way out of the cellar, through
     caves under the pad to the garage pit, in the design and the
     blockout.
3. **Evening:** the dusk sky, the suns, the haze, the light levels.
4. **Blowing sand:** the engine pieces, then the particles on the bench,
   then in the level.
5. **Each area in detail,** in the order you meet them: the garden pit
   and the pump tunnels; the reservoir; the workshop pit and the workshop; the work
   yard, the generator shed, the staging point and the gate; the lane and
   the great dome; the courtyard and the house's rooms; the cellar; the
   caves; the garage, its pit, the trench and the pad; the wash and the flat; the
   windbreak, the drifts, the rocks and the backdrop.
6. **Fire and smoke:** the generator shed, the house's roof, the
   workshop pit's speeder and the courtyard's cart.
7. **Life:** the troopers by skill, the wave by skill.
8. **The story:** the recordings, Rusk's panel, the tremors, the call, the Crow on the
   flat and the pickup.
9. **Tune:** light, the sand's thickness and gusts, frame time, the
   per-skill check.
