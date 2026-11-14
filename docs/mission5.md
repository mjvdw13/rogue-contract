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
   -> [10 dispatch office: the manifest] -> lift up -> the apron: the Crow.
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
| 10 | The Crow | Jan's line; one lift up |

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
| 3 | Pump house | 100..124, 40..58 | 3 / 9 | Door at 100, 47..51. Four pumps, steam. A walk at 6 round the north and east walls, stairs up to it: the sluice switch at its end. A grate in the floor looks down on the gallery's shut door. |
| 3 | Pipe gallery | 124..150, 44..50, then 146..152, 50..80 | 3 down to -2 / 4 high | Stairs down, the sluice door (`remote`, tag `sluice`) at 130, then east and south under the yard wall (x 128). Pipes, grate floor over runoff, a crouch under a fallen pipe (y 62..68). Steps up at its south end. |
| 4 | Berth 1: the light freighter | hold 150..164, 80..87 | -2 up to 0 / 3.25 | Mission 1's freighter (`models/freighter.js`) on the slip, nose west. The gallery's steps come up through its deck where the plates are gone. Ribs, wires, panels, a live wire. A trooper searching it. The stern hatch (166, 81..86) opens east. |
| 4 | Slip 1 | 130..176, 62..104 | 0, stepping to -2 at the water | The yard's west end, the wall with BERTH 1 on it. Only the part east of the freighter is on the route. |
| 5 | The cutting floor | 168..206, 56..104 | 0 / sky | Hull plates in stacks 1 to 3 high (cover, and steps onto them), a cutting lane sunk 1 with torches working (sparks), the furnace in the north-east corner (the `furnace` model, its glow, a stack smoking), the foreman's shed (176..186, 56..64). Off the grid: the stacks lie at angles. |
| 6 | Berth 2: the bulk hauler | hull 206..262, 60..92 | two decks and the bridge | Cut across at x 206: from the cutting floor you see its decks in section, and the lift's platform at the cut. Hull walls 2 thick. Forward (208..240) it's the hold under the crew deck; aft (242..260) the reactor room under the bridge. |
| 6a | Lower hold | 208..240, 64..88 | 0 / 5 | 16 m by 12 m. Frames across it every 2.5, containers, deck plates gone over the bilge (-2.25, runoff, two steps out). Dark. The cargo lift (208..212, 74..78; 0 to 6) stands at the cut face, open to the yard, dead. Secret 3: a smuggler's hold behind a loose panel (238, 84..86). |
| 6b | Reactor room | 242..260, 66..86 | -2 / 11 | Through the bulkhead (240..242, door 74..78). A walk at 0 round the pit, the reactor (`reactor-ring`) in it. The start switch on the east wall: sets `power`, lights the ship, wakes the lift, spawns the squad in the hold. The fight is the way back to the lift. |
| 6c | Crew deck | spine 212..240, 74..78; cabins north 64..73, south 79..88 | 6 / 9.5 | From the lift, aft. Cabins either side (bunks, a galley: pickups, a weapon). North of the spine at 222..232 the deck has fallen into the hold: an edge to look down from, and to be shot at from. |
| 6d | Aft stair | 242..254, 62..66 | 6 up to 12 | From the spine's end through the bulkhead and up the hull's north side, over the reactor room's walk. Plating gone beside it: the yard and the smog. |
| 6e | Bridge | 244..260, 66..86 | 12 / 16 | Over the reactor. Its windows are gone east and south: the crane, the dock, the sun. Dead consoles, wires everywhere, roof panels gone (sky, and haze coming down). A door in its south wing (252..256, 86..90) onto a gangway to the crane way. |
| 7 | The crane way | 252..300, 96..100 | a slab, top 12 / sky | A crane rail on trestles along the quay, 2 m wide, the water 16 below on the south. Grate deck: the quay shows through. A 3-tile gap at 276..279 (a jump). A hoist at 268 back up from the quay if you fall. Probe droids come in over the water; a trooper on the cab's balcony. |
| 7a | Berth 3: the ribs | 264..298, 60..94 | 0 stepping to -1 / sky | A hull cut down to its keel and frames, seen from above. Reached only by falling or by the hoist. Secret 4: a crate on the keel. |
| 8 | The crane's cab | 298..308, 92..104 | 12 / 16 | In the south leg of the great gantry. The dock officer (the red keycard), a console, a window north over the dock. Lift (300..304, 88..92), 12 to 0. |
| 9 | Berth 4: the dry dock | 308..346, 58..102 | rim 0; steps -2.5, -5; floor -7.5 / sky | Long axis north to south. The floor is 320..334, 60..100. West and east sides step down in two terraces 4 wide (-2.5 at 312..316 and 338..342, -5 at 316..320 and 334..338). Flights between them at opposite ends, so the walk down is a zigzag; you can also jump down. The caisson gate at the south end, the sea behind it. Keel blocks down the middle, the sealed crates stacked on them, a shuttle (`lambda-shuttle`) taking them on. The gantry's beam overhead, a hook hanging. The main fight. |
| 10 | Dispatch office | 320..334, 46..58 | -7.5 / -3 | In the dock's head wall. Red door (325..329, 58). Screens, files, the manifest terminal (sets `manifest`, sounds the alarm). Lift (330..334, 42..46), -7.5 to 0. |
| 10 | The apron | 314..344, 24..42 | 0 / sky | The pickup spot. The last squad, and Bossk. The exit is the marked spot, `if` `manifest`. |

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
