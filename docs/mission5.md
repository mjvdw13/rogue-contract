# Mission 5: Breakers' Row (design)

A level on Corellia (Mark, 2026-11-14): a big industrial planet of slums
and shipyards, built on the look of the gutted freighter Rusk hides in
(Mission 1): its panelling, the panels off the walls, the wires hanging
and spitting sparks, the haze. To be painted in code as Missions 3 and 4
are (`src/content/levels/m5.js`, `lib/painter.js`), playable at `?map=m5`.
Being built: PLAN.md (item 12) has the steps and how far they've got.

The idea in one line: **a ship-breaking yard on the Coronet waterfront.
Ships come here to be cut up, and Kyle goes down the row of them, each
further gone than the last, to the great crane at the end.**

## Story (Mark, 2026-11-14: the Arc Hammer and Bossk are in)

- **Why Corellia.** The garrison's records give the maker's stamp on the
  prototype's frame: a yard on Corellia. The Empire has taken over a
  breakers' yard in Coronet's docks. Ships go in for scrap, and their
  reactor cores and hull metal come out in sealed crates, signed for by
  Mohc's people. The yard's dispatch office has the manifest: what was
  shipped, and where to.
- **The job.** Reach the dispatch office under the great crane at the end
  of the row and take the manifest.
- **The irony of a prequel, again.** The manifest's last line is a ship's
  name Kyle has never heard: ARC HAMMER. (Dark Forces' last mission is
  aboard it.)
- **Bossk.** In the cantina he said "This one is mine, hunter." The
  Guild's contract on Kyle is still open, and Corellia is a hunter's
  town. He is the last fight, on the apron where the Crow comes in. He's
  a monster already.

Sample lines (stand-ins, like every level's):

> JAN: Breakers' Row. Four berths, and the big crane over the last one.
> The dispatch office is under it.
>
> KYLE: And the front gate?
>
> JAN: Imperial. Go round, through the Bottoms.

Decided (Mark, 2026-11-14): the flow, the manifest's Arc Hammer, Bossk
as the last fight, and the name, Breakers' Row. **Still to decide:**
where it sits in the story (after the garrison, or after the station);
whether the yard's workers appear (no sprite yet: droids and troopers
only for now).

## What makes it work

- **The goal is seen first and all the way.** The great gantry crane
  stands over the last berth, red beacons on it, against a dirty yellow
  sun low in the smog. It's ahead from the pier at the start, down the
  slum's upper street, across the cutting floor, out of the hauler's
  bridge, and then you're on its rail.
- **A chain, not a hub.** Ten areas in a line from west to east, one way
  on from each. Loops only inside an area, for fights. The berths are
  numbered on the walls in letters two metres tall (BERTH 1 to 4), so the
  player counts their way along.
- **Each ship is further gone.** Berth 1 is a light freighter, whole but
  gutted (Mission 1's, again). Berth 2 is a bulk hauler cut in half, its
  decks open like a doll's house. Berth 3 is only ribs and a keel. Berth
  4 is an empty dry dock: what was in it is in the crates.
- **In and out, low and high.** Open pier, tight street, tunnel, hold,
  open yard, a ship from the bilge to the bridge, a rail
  12 up over the water, then down a stepped pit. No two areas in a row
  feel the same, and the height climbs to the crane way before the drop
  into the dock.
- **One change of state.** The hauler is dead and dark until Kyle starts
  its reactor. Then its lamps come up, its cut cables all spit at once,
  its lift works, and the troopers know where he is.
- **Length.** About as long as Mission 4 and a little more: par 660 s.

## Flow

```
[1 Pier 12: the Crow] -> the sea wall's arch (the Row's gate is shut)
   -> [2 The Bottoms: slum street, up and round] -> [3 pump house: the sluice switch]
   -> [3 pipe gallery under the yard wall] -> up through the deck of
   -> [4 Berth 1: the light freighter's hold] -> stern hatch
   -> [5 the cutting floor: plate stacks, the furnace]
   -> [6 Berth 2: the bulk hauler] lower hold -> reactor room (power on)
        -> back through the hold to the cargo lift at the cut face
        -> crew deck -> aft stair -> bridge
   -> gangway -> [7 the crane way, 12 up, over Berth 3's ribs]
   -> [8 the great crane's cab: the red keycard] -> lift down
   -> [9 Berth 4: the dry dock, down its steps] -> red door
   -> [10 dispatch office: the manifest] -> lift up -> the apron: Bossk
   -> the Crow flies in -> reach it.
```

| Step | Goal | How the player knows |
|---|---|---|
| 1 | The crane | Jan's line; it's on the skyline to the east. The Row's gate is shut and guarded, the arch in the sea wall is open |
| 2 | The pump house at the top of the street | One street; signs (a pipe stencil); the yard's wall behind it |
| 3 | The sluice | The gallery's door is seen first, shut, through a grate; the switch is on the walk above the pumps |
| 4 | Out of the freighter | One way: its stern hatch, daylight through it |
| 5 | The hauler | It fills the east side of the floor, cut open; BERTH 2 over it |
| 6 | Power, then up | The lift at the cut face is dead and says so; cables lead aft to the reactor. After: its lamp is lit, seen down the length of the hold |
| 6 | The bridge | Jan's line; the crane fills its empty windows |
| 7 | The cab | The rail leads to it; its lit window |
| 8 | The dock | The cab's window looks down into it; the officer's key; the lift |
| 9 | The red door in the dock's head wall | Lit red; the only door down there |
| 10 | Bossk, then the Crow | Jan's line; one lift up. Jan says she's coming in when he falls; the ship comes down in front of you |

## Areas (x, y in tiles; heights in units)

The map is 352 x 144, west to east. North is up (y 0). The harbour is
everything south of y 104: water at -4 (`damage`: the runoff burns),
with the slips as the ways back out. Everything not painted is building
or yard wall. Boxes are x0..x1, y0..y1, a starting point for the
blockout, not final.

| # | Area | Box | Floor / ceiling | Notes |
|---|------|-----|-----------------|-------|
| 1 | Pier 12 | 20..30, 104..140 | 0 / sky | A concrete finger pier, 5 m wide and 18 m long. Start (25, 136) facing north, the Crow behind (it leaves). Lamp posts, bollards, a pipe run along its east edge. Two dock troopers at its head. East along the waterfront: the row's hulks and the crane. |
| 1 | Quay and the Row's gate | 8..46, 92..104 | 0 / sky | A gatehouse (38..46, 92..96). The gate east (44..46, 96..102) is bars and a blast door: you see the yard road, you don't get in. |
| 1 | Sea wall | 0..128, 88..92 | wall, 8 high | The arch at 22..28. |
| 1a | Under the pier | 16..20, 116..130 | -3 / sky | Secret 1: steps down the pier's west side to a boat landing. |
| 2 | Lower street | 20..30, 62..88 | 0 up to 1 / sky | Shacks stacked two and three high either side, pipes across overhead, a shuttered shop, a lit sign. Residents run indoors. |
| 2 | The bend | from (30, 62) to (60, 46) | 1 up to 2 / sky | The street runs north-east on the slant, 8 wide. An alley off its north side (secret 2: over a crate and an awning to a back room). |
| 2 | Upper street | 60..96, 44..54 | 2 up to 3 / sky | East, toward the crane. The ore conveyor crosses overhead on trestles at 70..76 (a slab, 8 to 10). A sweep squad comes down it. |
| 3 | Pump house | 98..124, 40..58 | 3 / 9 | Door at 96..98, 49..53. Four pumps, steam. Stairs up the west wall beside the door (98..101, 43..49) to a walk at 6 along the north and east walls, to a plinth in the south-east corner: the sluice switch in the wall there. Under the walk, in the east wall, stairs go down to the gallery's door, seen shut from the floor. |
| 3 | Pipe gallery | stairs 124..142, 47..51; then 144..152, 47..51 and 148..152, 51..80 | 3 down to -5 / 3.5 high | Sixteen steps down, the sluice door (`remote`, tag `sluice`) at 142..144, then east and south, 5 under the yard (the lower storey of its ground). Pipes, grate floor over runoff, a crouch under a fallen pipe (y 62..68). It ends under the freighter's nose. |
| 4 | Berth 1: the light freighter | hold 150..164, 80..87 | -5 up to 0 / 3.25 | Mission 1's freighter (`models/freighter.js`) on the slip, nose west. The gallery's ten steps come up through its deck along the north side (150..160, 80..82), where the plates are gone. Ribs, wires, panels, a live wire. A trooper searching it. The stern hatch (166, 81..86) opens east. |
| 4 | Slip 1 | 130..176, 62..104 | 0, stepping to -2 at the water | The yard's west end, the wall with BERTH 1 on it. Only the part east of the freighter is on the route. |
| 5 | The cutting floor | 168..206, 56..104 | 0 / sky | Hull plates in stacks 1 to 3 high (cover, and steps onto them), a cutting lane sunk 1 with torches working (sparks), the furnace in the north-east corner (the `furnace` model, its glow, a stack smoking), the foreman's shed (176..186, 56..64). Off the grid: the stacks lie at angles. |
| 6 | Berth 2: the bulk hauler | hull 206..262, 60..92 | two decks and the bridge | Cut across at x 206: from the cutting floor you see its decks in section, and the lift's platform at the cut. Hull walls 2 thick. Forward (208..240) it's the hold under the crew deck; aft (242..260) the reactor room under the bridge. |
| 6a | Lower hold | 208..240, 68..84 | 0 / 5 | 16 m by 8 m, solid walls either side (66..68, 84..86). Frames across it every 2.5, containers, deck plates gone over the bilge in two places (-2.25, runoff, two steps out). Dark. The cargo lift (208..212, 74..78; 0 to 6) stands at the cut face, dead: stepping on it says so until `power` is set, then calls it. Secret 3: a smuggler's hold (234..240, 86..90) behind a loose panel in the south wall (236..238). |
| 6b | Reactor room | 242..260, 68..86 | 0, the pit -2 / 11 | Through the bulkhead (240..242, door 74..78). A walk 3 wide round the pit (245..257, 71..83; four steps down on its west side), the reactor (`reactor-ring`) in it. The start switch in the south wall (250..252, 86): sets `power`, lights the ship's lamps (`hauler-lamps`), spawns the squad in the hold (`hold-squad`). The fight is the way back to the lift. |
| 6c | Crew deck | 212..240, 68..84 | 6 / 9.5 | The whole deck over the hold (a slab, 5 to 6), from the lift, aft. Along the north side at 222..232, 68..76 it has fallen into the hold: an edge to look down from, and to be shot at from. Cabins behind doors in the hold's walls: two north (62..66), one south (86..90), 2 m deep (bunks, pickups, a weapon). At the cut face the deck stops two tiles short (206..208), the hull's roof still over the gap. |
| 6d | Aft stair | passage 232..240, 62..66; stair 242..254, 62..66 | 6 up to 12 | A door in the north wall (234..238) into a passage, a door through the bulkhead, and twelve steps up the hull's north side under the sky to a landing (254..260). |
| 6e | Bridge | 242..260, 68..86 | 12 / sky | The reactor room's roof. Its own roof is gone (a tile holds two storeys: the reactor room and this deck): a tub of hull walls 5 high, the sills a step high where its windows were, east and south: the crane, the dock, the sun. Dead consoles, wires. In from the landing by an arch (255..259, 66..68); out by an arch in its south wing (252..256, 86..92) onto a gangway to the crane way. |
| 7 | The crane way | gangway 252..256, 92..96; rail 252..298, 96..100 | a slab, top 12 / sky | A crane rail on trestles along the quay, 2 m wide, the water 16 below on the south. Grate deck: the quay shows through. Railings 0.75 high. A 3-tile gap at 276..279 (a jump). A hoist (266..270, 100..102; 0 to 12) back up from the quay if you fall. Probe droids come in over the water; a trooper on the cab's side of the gap. |
| 7 | Past the hauler | 206..262, 56..60 and 244..250, 92..104 | buildings | A shed along the hauler's north side and a winch house across the quay at its stern: the only way east is through the ship. |
| 7a | Berth 3: the ribs | 264..298, 60..92 | 0 / sky | A hull cut down to its keel and frames, seen from above. Reached by falling off the rail, or from the dock's rim. Secret 4: a crate on the keel (280..284, 76..78). A slip into the water at 284..288, 104..112: the way out of the harbour at this end. |
| 8 | The crane's cab | 299..307, 93..103 | 12 / 16 | In the south leg of the great gantry (298..308, 92..104, 30 high; the north leg 298..308, 54..60). In from the rail by an arch in its west wall. The dock officer (the red keycard), a console, a window east over the dock (sill 1). Lift (300..304, 88..92), 12 to 0, by an arch in its north wall. |
| 9 | Berth 4: the dry dock | 312..342, 60..100 | rim 0; steps -2.5, -5; floor -7.5 / sky | Long axis north to south. The floor is 320..334. West and east sides step down in two terraces 4 wide (-2.5 at 312..316 and 338..342, -5 at 316..320 and 334..338). Three flights on the west side, each along the terraces so it's walked onto from its end: rim to -2.5 at the south end (312..314, 96..100), -2.5 to -5 at the north end (314..316, 60..66), -5 to the floor at the south end (318..320, 94..100): the walk down is a zigzag, or you jump. The caisson is the quay at the south end, the sea behind it. Keel blocks down the middle (326..328, every 6), the sealed crates between them, a shuttle (`lambda-shuttle`) taking them on. The gantry's beam overhead, a hook hanging. The main fight. |
| 10 | Dispatch office | 320..334, 46..58 | -7.5 / -3.5 | In the building across the dock's head (308..346, 56..60). Red door (325..329, 58..60). Screens, files, the manifest's terminal in the north wall (325..327): sets `manifest`, sounds the alarm, brings Bossk and the last squad onto the apron (waiting, unseen). Lift (330..334, 42..46), -7.5 to 0. |
| 10 | The apron | 314..344, 22..40 | 0 / sky | The last squad, and Bossk. When Bossk is dead (Mark, 2026-11-14) the Crow flies in over the dock and sets down on the pickup spot (323..333, 25..33, tag `crow`; the `fly` action, 7.5 s); the level ends when Kyle reaches it (`if` `crow-down`), not before. |

## The kit (design language)

**The freighter's, grown.** Everything inside a ship uses Mission 1's
hold kit as it is: `hold-wall` (grimy panelling), `hold-guts` (a panel
off, the ship's guts behind), `hold-floor` (the mesh deck),
`hold-ceiling`, `hold-pipes` (in the ceiling's holes), `freighter-hull`
and `metal-rust` outside. Models `hold-rib`, `hold-wires`,
`hold-wires-live`, `hold-console`, `hold-panel-leaning`,
`hold-panel-down`, `ceiling-lamp`. Grime on every wall
(`grimeIndoors`). New for the hauler: ribs for wider holds (the rib
model takes a span), a longer run of hanging wires, a fallen deck's
edge (bent plate and broken frames), a bulkhead door.

**Each area changes one thing:**

- **Pier and quay:** pale stained concrete, joints and tyre marks; rusty
  bollards and rails (`rail-rust`); pipes along the edge (`models/pipes.js`).
  Open and bright, the brightest place in the level.
- **The Bottoms:** patchwork. Walls of scavenged hull plate and
  corrugated sheet, no two shacks the same colour of rust; stacked two
  and three high, the upper ones stepping out over the street; pipes and
  cables across (hangings); one lit sign in Aurebesh. Buildings are
  volumes with alleys between. A slant and two changes of level.
- **Pump house and gallery:** green-grey machine walls, grate floors,
  steam (`steam`, `steam-hiss`), the pumps' hum, runoff under the grates.
- **The cutting floor:** bare ground black with slag, plates in stacks,
  the torches' sparks (`weld-arc`), the furnace's orange glow against
  the grey day.
- **The hauler:** the hold kit, bigger and darker. Before the power:
  work lamps and daylight through the cut. After: every lamp up,
  flickering, and the cables spitting.
- **The crane way:** yellow paint gone to rust, grate deck, cables
  hanging from the rail (hangings that sway), wind.
- **The dry dock:** wet dark concrete in steps, weed and rust stains
  down them, flood marks, numbers painted on the steps; Imperial crates,
  clean, the only clean things in the yard.

**Outside:** an overcast sky, `sky-corellia`, going round once: grey
cloud, a dirty yellow glow and a pale sun low in the east, smoke going
up into it. The skyline beyond play (a backdrop, or scenery blocks and
models): the slum climbing behind the sea wall to the north, smokestacks
(smoke from each), shipyard platforms on their piers far over the water.

New textures (from the Dark Forces pack by `derive.mjs`, a CORELLIA
set): quay concrete and its edge, sea wall, three or four shack walls,
shutter, harbour water, slag ground, dock concrete (wet, with a flood
line), crane paint, hull section (the cut edge of decks and frames),
berth numbers and the Aurebesh sign (decals), the sky.

New models: the great gantry crane (legs, beam, cab, hook, beacons),
the crane way's trestles and rail, a lamp post, a bollard, plate
stacks, a cutting torch on a stand, the ribs of Berth 3, keel blocks,
the fallen deck's edge, a wide hold rib, shack dressing (a lean-to, a
vent stack, the sign), a smokestack, a hoist.

## Light and air

- **Haze** (the thing to get right): outdoors everything fades into
  yellow-grey smog, about `haze: { color: [150, 142, 112], half: 44 }`.
  Thick enough that the far end of the row is a silhouette, thin enough
  that the crane still shows from the pier (its beacons are lights, and
  the sky's picture can carry its shape if the haze takes the model).
- **Indoors** the engine has no haze: the hold's look in Mission 1 is
  fog, low light and dither. The hauler adds drifting steam and smoke
  (particles) and shafts of daylight through its holes, where the haze
  does reach in. If Mark wants real haze indoors, that's an engine
  capability to add (a level's `hazeIndoors`), not planned.
- **Weather:** soot flakes drifting down outdoors (a light `weather`
  layer), a wind off the water that carries the smoke east.
- Outdoors 168 (overcast: flatter than Tatooine's 200+). The Bottoms'
  street 144, alleys 120, a pool under the sign. Pump house 136, the
  gallery 112 with lamps. Freighter 96, a flickering lamp. Cutting floor
  160, the furnace's corner glowing. Hauler: 88 to 104 before the power
  with work lamps in pools, 128 after with flickering strips; the
  reactor room pulsing once it runs. Dock 152, the office 144.

## Secrets (4)

1. Under the pier: steps down its side to a boat landing (a shield unit).
2. The Bottoms: over a crate and an awning to a shack's back room.
3. The hauler's lower hold: a smuggler's compartment behind a loose
   panel (Corellian freighters have them).
4. Berth 3: a crate on the keel among the ribs, for anyone who drops
   off the crane way.

## Enemies and items (a first sketch; the table comes with the fights)

Stormtroopers and officers throughout (the dock's garrison), probe
droids outdoors over the water and the dock. A calm start: two troopers
on the pier. The street's sweep squad is the first real fight; the
freighter holds one surprise; the cutting floor is the first open fight
with cover; the hauler is close work in the dark, then an ambush from
below when the power comes on; the crane way is exposed, shot at from
ahead and by droids; the dock is the big one, fought downhill; the
apron is short and hot. A weapon each third: one in the freighter, one
in the hauler's cabins, heavy ammo before the dock.

## Engine notes and risks

- **Seeing the crane from far off.** Checked in the first blockout with
  stand-in blocks: at `half: 44` the hauler (180 tiles from the pier) and
  the crane's legs (270) are faint shapes close to the haze's colour.
  The crane needs its beacons as lights and its shape in the sky's
  picture, or a longer haze. (A ray used to stop after 320 tiles and
  leave far walls black; the renderer's limit now follows the map's
  size.)
- **Under the yard.** The pipe gallery under open ground is the lower
  storey of the ground's slab (floor -5, the slab from -1.5 to 0), so it
  is 5 down, not 2; the steps up into the freighter climb from -5.
- **Doors want solid wall at their jambs**, not a building's raised
  floor (the validator says so).
- **A room indoors inside a building** (a ceiling, not the sky: the
  pump house, the gallery's stairs, the hauler's forward decks) shows
  from outside as a wall up to the sky wherever something looks over
  the building's roof into it. `m5.js` ends with a pass that turns every
  tile of building next to such a room into solid wall; the sky comes
  down to the roofline beside a wall, and the view ends there. So
  buildings round a room are two tiles thick. Where a room opens onto
  the yard (the hauler's cut face) the open tiles' own sky sits just
  over their roof.
- **A door with the sky on one side** is a sky tile with a slab over
  the opening (`skyDoor`, as the town kit's doors): a plain door is a
  solid wall to `seal()`, and the sky comes down to head height beside
  it. The same goes for solid wall beside a stair under the sky: the
  bridge's stair has hull (raised floor), not wall, on both sides.
- **Two storeys a tile.** A tile holds a floor and one slab, so the
  hauler never has three decks over one tile: forward it's the hold
  under the crew deck, aft the reactor room under the bridge (and under
  the aft stair). The crew deck's roof is the hull: nobody walks on it.
- **The view over the water** is sky tiles at -4 out to the map's edge,
  as Mission 4's hangar mouth.
- **The reactor's switch** changes light by `setLight` on tagged tiles
  and lamps, and unlocks the lift (`unlockDoors` or a `lift` action):
  no new engine work expected.
- **Frame time:** the cutting floor and the dock are the open places.
  Measure them at the blockout (`tools/bench.mjs`), before dressing.

## Checked (the blockout, 2026-11-14)

- `tests/m5-route.test.js` walks the whole route with no monsters, pier
  to apron: the sluice's switch, the crouch, the freighter, the reactor
  and the lift, the stair, the jump on the crane way, the cab's lift,
  the dock's three flights, the red door, the manifest. It found the
  pump house's stairs couldn't be stepped onto from the side, and the
  sky coming down to head height beside plain doors under it; both are
  in the engine notes.
- Frame time, headless at 640 x 400, 40 views (`tools/bench.mjs m5 --res
  2`): 18 ms on average, 37 at worst (Mission 4 on the same run: 11 and
  42). The worst three are all looks along the quay, 350 tiles of open
  waterfront; cargo and sheds standing on it will cut them short.
- Not checked: anything by eye in a browser, the fights (twelve
  stand-in troopers), the look (stand-in textures, sky and crane).

