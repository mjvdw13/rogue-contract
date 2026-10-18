# Mission 1: Mos Eisley (design)

The story's Map A (`docs/story.md`), and the vertical slice. Kyle walks east
through a calm Mos Eisley in daylight, finds Dace at the far end, then fights
back west through the same streets to the bay he landed in. This file is the
level's layout, how it's built, and the order it's built in. The story
(who says what, the switch, the fob) stays in `docs/story.md`.

The aim is a big town that feels lived in: sunlit streets with hard shadows,
people and aliens going about their day, troopers who ignore you until they
don't, and a dozen places that each look and sound different.

## Grid and size

- **208 × 152 tiles** (104 × 76 m), about 2.5 times the Canyon Garrison.
  The story's 150 × 110 was a first guess; the town needs the room for the
  areas below. Kyle runs at 15.6 tiles a second, so the long way across is
  about 15 seconds of running and a few minutes of walking and looking.
- `m1`, painted in code by the painter like `m3`, plus a town kit (below).
- Everything not painted is the back of a building or the town's outer wall.

## The map

```
  x 0        40        80        120       160       208
 y 0 +-------------------------------------------------+
     | 15 sand-   7 back alleys: hostel,    8 prefecture |
     | crawler    informant, thug, gun shop  comm tower  |
  40 | 4 Jawa     11 dewback  12 speeder     courtyard   |
     | junk yard  stable      garage                     |
  60 |== 2 main street == 2 market, 13 plaza =B== 5 ==   |
  76 |     lane                      19        9 old  18 |
     | 14 owner 16 customs     3 cantina  6 roof- quarter|
     |                                    tops   wash  : |
 104 | 1 Docking Bay 87   17 Bay 86              10 dere-|
 152 |                                           lict bay|
     +-------------------------------------------------+
  B: the blast doors across the main street (they shut at the switch)
  5: the checkpoint   18: the dry wash, north to south into 10
  19: the back lane behind the cantina, up onto 6
```

**Going east (calm):** Bay 87 → the lane → the main street → the cantina
(the contract and the fob) → the junk yard (the signal) → past the
checkpoint, with a pass from the alleys or over the rooftops → the old
quarter → the derelict bay (Dace).

**Coming back west (loud):** the derelict bay → the old quarter (across the
wash) → the checkpoint (now open, and fighting) or the rooftops (snipers now)
→ the blast doors are shut, so through the cantina's back lane and the
cantina, or round through the back alleys → the market → Bay 87, where the
Crow comes down.

## Areas

Boxes are x0..x1, y0..y1 in tiles; heights in units (1 unit = 0.5 m). The
street is at 0. The numbers 1-10 are the story's; 11 on are new.

| # | Area | Box | Floor | What's there |
|---|------|-----|-------|--------------|
| 1 | **Docking Bay 87** | 9..56, 100..149 | -5, sky | The start, and the pickup. A round pit open to the sky, 21 m across (centre 32, 125, radius 21), south of the first stretch's south back lane (the design's first box overlapped the south row). Duracrete walls 5.5 m tall, braced by buttresses along their foot (`bay-wall`, `bay-wall-ribbed`, from Talay's TWCAP01), twelve ribs up them every 30 degrees clear of the landing, a lamp on the rim over every other rib, fuel lines over the rim and down to four pumps, eight soot scars (`grime-scorch-1`, `-2`: decals on the angled wall). The bay door (4 wide, 4 high) opens off the back lane into a passage and onto a landing over the pit at street level; stairs go down from it (a step of 0.625 a tile). Hazy and quiet: dust drifting, a power droid shuffling, the bay owner's grumbling, a hum of fuel pumps. A maintenance pit in the middle of the floor where the Crow lands (28..35, 122..125, 2 deep, steel-lined, hazard stripes on its lips, two steps down at its west end); off its east end a crawlspace under the floor (a slab) with a shield unit: the secret. The Moldy Crow hovers just south of the pit, nose east and turned a little off square (until the drop-off flies it in and out); you can walk under it. |
| 2 | **Main street** | 4..136, 64..76 | 0, sky | 12-14 wide, sand over packed earth, adobe both sides with doorways, awnings, vaporators and signs. It bends a little (angled walls) so you never see straight down it. A sandtrooper patrol, villagers, Jawas arguing over a droid, a probe droid over the market. The prefecture's comm tower is the landmark to walk toward. |
| 2 | **The market** | 62..102, 58..82 | 0, sky | The street widens into a market: stalls with cloth awnings (shade you walk under), crates, baskets of fruit, a droid seller's pen, hanging cloth. The busiest place in town. |
| 13 | **Water plaza** | round, at (78, 70), r 9 | 0, sky | In the market: a moisture condenser tower (a tall 3D model, a landmark), a water seller and the queue at his tap, a dewback trough. |
| B | **Blast doors** | at x 104..106 | | Two Imperial blast doors across the street, open in the calm half: slid into slots in the walls either side, strips of dark steel easy to miss. The switch shuts them and splits the town in two. |
| 3 | **Chalmun's cantina** | 88..126, 84..122 | -2 | The classic. A dark entrance with a droid detector (and a "no droids" sign), steps down into a round main room (about 26 across, a true circle of angled walls). A round bar in the middle with the bartender, booths in alcoves round the edge under lower ceilings, each with a dim lamp. A bandstand with the band (its own music). Smoke hangs in the lamplight. Dark: 96-120, with pools at the bar and the booths. The broker's booth at the back. A back room, a storeroom and the kitchen; the back door opens onto the back lane (19). |
| 14 | **Bay owner's office** | 44..53, 101..105 | 0 | In the bay's building, east of its door: a red door off the lane and a window (open, at eye height) onto it. A cramped office with a terminal and crates, a desk, a tired owner ("Docking fees doubled. Imperials."), a power droid charging outside. |
| 16 | **Customs house** | 11..21, 99..106 | 0 | West of the bay door, jutting a tile into the lane: a grey Imperial prefab (corrugated `metal-grey`, its roof at 5, below the bay's) dropped among the adobe, a door and a window onto the lane, impounded cargo inside: the customs officer and his troopers come out of it. A counter, a terminal, a holo-notice of wanted faces (not Dace's yet). |
| 17 | **Docking Bay 86** | 58..86, 94..130 | -5, sky | Next door, shut. Through its barred gate you look down on customs troopers inspecting a battered freighter, crates opened on the floor. Atmosphere only; you can't get in. |
| 4 | **Jawa junk yard** | 6..46, 26..58 | 0, sky | Piles of droid parts and scrap behind a cage fence, a crane, a scrap furnace glowing, Jawa traders and their droids for sale. The trader who sold Dace the coupling. A side gate to the back alleys. |
| 15 | **The sandcrawler** | 2..22, 2..24 | out of reach | The Jawas' sandcrawler parked outside the town wall, seen over the junk yard: a huge 3D model and a landmark from the west half. |
| 11 | **Dewback stable** | 50..78, 40..58 | 0 | An open-fronted stable off the market: stalls, hay and water, a dewback or two (when the sprite exists), the patrol's spare mounts. Dim and dusty, shafts of light through the slatted roof. |
| 12 | **Speeder garage** | 80..100, 40..58 | 0 | A mechanic's garage: a landspeeder on blocks, a swoop on a hoist, tools, a pit droid. A back door into the alleys. |
| 7 | **Back alleys** | 48..132, 6..40 | 0, sky | Narrow (3-6 wide), angled, dark (120-136), with laundry lines and awnings overhead, steps and small yards. The informant's den, the thug's back room (the debt), a spacers' hostel (a flophouse with bunks), the shut gun shop (a secret: its back room). The quiet way past the blast doors, and an ambush when loud. |
| 19 | **The back lane** | 126..130, 78..124 | 0, sky | A narrow service lane behind the cantina, from the main street's east half south past the cantina's back door. Crates and a collapsed wall at its south end: the climb onto the rooftops. |
| 5 | **Checkpoint** | 136..146, 60..80 | 0, sky | Barricades across the street, a guard booth, a closed gate (`checkpoint`), floodlights on poles. "Old quarter's sealed, hunter." |
| 6 | **Rooftops** | 130..148, 78..112 | 4-8, sky | Flat roofs at different heights, a moisture tank, vaporators, a dome or two, washing on lines. Running jumps across gaps (up to 4 tiles), a plank across a wider one. The rooftop cache (secret: a better weapon). A drop down into the old quarter past the checkpoint. Snipers when loud. |
| 8 | **Prefecture** | 146..196, 6..54 | 0 | A walled Imperial compound, its gate on the old quarter's north street: a courtyard, a garage with a speeder bike, barracks, and the comm tower (the landmark, about 30 tall). Shut in the calm half. A terminal by the gate shows Dace's wanted file: "Jundland Range security". Its doors open at the switch and the reinforcements come out. |
| 9 | **Old quarter** | 146..206, 56..104 | 0, sky | Half-empty streets, sand drifting through broken walls, a collapsed dome, a few squatters and a hermit, a small shrine with candles. Quieter: wind instead of the market's noise. |
| 18 | **The dry wash** | 168..176, 54..104 | -3, sky | A flood channel through the old quarter, from a grated culvert under the prefecture's wall south into the derelict bay (which is why the bay is half full of sand). Crossed by two bridges (slabs: walk over or under) and a culvert under the old quarter's main street. A second way through, and a good place for a fight. |
| 10 | **Derelict bay** | 160..204, 104..148 | -6, sky | An abandoned docking bay half-buried in drifted sand, a gutted freighter (a 3D model) with its ramp down and its hold open, scaffolding, scrap. Dace is hiding in the hold. The flip happens here: troopers come in over the rim and through the bay door. |
| 20 | **Town edges** | the outer wall | | Where streets end at the edge of town, a low wall with the Dune Sea beyond: dunes and the Jundland's mesas in the backdrop, fading into the haze. The view at the end of the main street, past the junk yard, and from the rooftops. |

### Secrets (6)

1. The maintenance pit in Bay 87's floor: a shield unit.
2. The cantina's back room behind the storeroom: power cells and a piece of lore.
3. The rooftop cache: a better weapon (the E-11-style rifle, once it exists).
4. The gun shop's back room in the alleys: ammo and a thermal detonator.
5. Under the north bridge in the dry wash: a med kit and energy.
6. The junk yard's scrap furnace room: a shield unit.

## Light and air

A bright, hazy afternoon. The only daylight map in the game.

- **Sun** (open street): 208-216. **Shade** (one sun's shadow): 176.
  **Deep shade** (both suns' shadows, under awnings, alleys): 136-152.
- **Twin suns' shadows:** the town kit casts each building's shadow from two
  suns low in the south-west (42° and 50° up, 16° apart; `SUNS` in
  `lib/town.js`), so every
  building throws two overlapping shadows across the sand: a darker core
  where both overlap and a lighter fringe where only one does. Worked out
  from the heights when the level is built, so moving a building moves its
  shadows.
- **Sky:** `sky-day`, Dark Forces' pale cloudy sky (Robotics' RESKY01)
  recoloured and warmed to dust at the horizon. The suns aren't in it yet:
  that needs them painted onto the DF sky, and the sky to wrap once round
  the horizon instead of twice (a small engine change). **Haze:** a warm
  dusty tan ([212, 200, 174]), halfway at 32 m, so far streets and the
  backdrop fade into dust.
- **Interiors:** dim (112-144), with daylight falling through doorways and
  windows. The cantina is the darkest place (96-120).
- **Dust in the air:** `weather: { type: 'glint', count: 90 }`, specks
  catching the suns, drifting in still air everywhere under the sky and
  sinking slowly (2 cm/s), not rising like the generator's motes (Mark). Mark
  picked `dust` at 100 on the particle bench (2026-10-15), all in view;
  360 in the 20 x 20 tiles round the player put as many on screen (82 dust
  pixels a view on the bench, 88 here, over seven views of the street).
  Plain `dust` was too hard to see in the bright street, and the
  generator's glowing motes too intense (Mark), so `glint` adds dim sand
  colours to what's behind it. 240 of them still distracted,
  and Mark halved that twice: 60, a sixth of the bench's thickness. 90 (a
  quarter) is on trial (2026-10-18). Under 0.02 ms a frame.
  Still to come: blowing sand at the town's edges and in the old quarter.

## How it's built: the town kit

`src/content/levels/lib/town.js`, beside the painter. Checked against the
renderer (`render/columns.js`).

**No flat fronts** (Mark, 2026-10-17). Every building is a volume, not a
front: rounded corners, upper storeys set back, porches and lean-tos
jutting out, round towers, a dome on the roof, and doorways that lead into
rooms. A row of fronts that only vary in height looks like a film set.
Buildings may touch, share walls and back onto each other or the town's
edge; the player needn't be able to get behind them (Mark, the same day).
Check a street from several angles, not just down its length.

- **A building is a block of raised floor** (`house()`): tiles at the
  roof's height under the full sky, their `side` texture as the walls. From
  the street you see the wall up to the roofline and sky above it, and
  taller buildings behind over it. (A solid wall tile would stand as tall
  as the street's sky.) `tiers` stack set-back storeys on it.
- **Rounded corners and round buildings** (`house({ r })`, `circle()`) are
  angled walls along the arc with `wallTop` at the roof: the wall stops
  there and the view goes on over it (an engine feature made for this).
  A pit is a circle open inside (`open: 'in'`), its floor below the
  street. `circle({ seam })` runs the wall's texture on round the circle
  (each tile's `wallU`) instead of starting it afresh in each tile, so a
  wide texture (the bay's buttresses) isn't cut up; the seam goes where
  it's hidden.
- **Slanting fronts** (`slanted()`): a building on a convex outline whose
  slanting sides are angled walls (one to a tile), their plaster running
  on along the side (`wallU`) so grime can cross tiles. Past the market
  the street bends north with two of them, so you never see straight down
  it. They take no doors, windows or clutter.
- **Doorways and arches in an outside wall are slab tiles** (`arch()`):
  open below the lintel, the slab's top at the roof. A doorway with a plain
  lowered ceiling would show a wall from the lintel up to the street's sky.
  A low lintel makes a crawl gap.
- **Rooms** (`room()`) are the lower storey of a slab: the ceiling below,
  the roof on top, so a dome can stand on it and it shades the street like
  the rest of the building. Their walls are the building's raised floor
  round them, in its plaster.
- **No solid walls in or beside buildings.** A wall stands as tall as the
  sky in front of it, so `seal()` brings that sky down to the roofline, and
  a low sky hides everything behind it above that height (a notch in the
  building behind). Walls are for the map's edge; a shut door is the
  building's own raised floor faced in planks. A real door in an outside
  wall is an arch with a rising door in it (its tiles carry the slab), and
  the raised floor beside it counts as its walls.
- **Domes** are the toppers on the roofs, Tatooine's mark: models
  (`models/dome.js`, a dome on a drum over a lip) in nine widths, 3 to 11
  tiles across, in each plaster (`dome-9`, `dome-9-pale`).
  `house({ dome: true })` tops a building with the widest that fits its
  highest storey with a rim of roof round it; `town.dome()` places one
  anywhere (over a round building). Both cast shadows, and land in
  `town.things` for the level's list. Most blocks of the town past the
  streets get one too, so the skyline is domes. Keep a dome inside its roof:
  one hanging over a lower roof is clipped. 189 of them cost about 0.1 ms a
  frame.
- **Awnings** (`awning()`): a thin slab of cloth over the street is the
  shade you walk under and the striped underside you see; on it the cloth
  slopes up to the wall (0.3 a tile) in bays 2 tiles wide that sag between
  their ribs (models, `models/awning.js`), with poles under the front and
  a scalloped fringe along it. Four cloths (`red`, `teal`, `sand`,
  `olive`: generated, `tools/art/textures/awning.js`), 2 or 3 tiles deep,
  an even number wide, `face` the way the front looks. `valance` swaps the
  fixed fringe for a swaying one (a hanging, `valance-<cloth>`, or a
  `rag`), which lands in `town.hangings` for the level's `hangings`. The
  two in the first stretch (22 models) cost about 0.15 ms a frame.
- **Stalls** (`stall()`): a market stall is an awning that stands free
  (`awning({ wall: false })`: poles at all four corners, the bays' backs
  closed) over a box 4 or 6 wide and 3 deep, so its underside is the
  awning's striped slab, lit as shade (a model's roof seen from below
  came out dark). Under it a counter and a rack of wares
  (`market-stall`, `models/market.js`), with room between them for a
  stallholder placed with `wander: 0`. `clutter()` keeps off it.
- **Tin roofs** (`leanTo()`): sheets of corrugated tin on a lean-to,
  sloping from the taller wall behind it down past its front (0.25 a tile),
  overhanging the street by 0.6, each sheet a hair higher or lower than the
  last, rusty or galvanised (`metal-rust`, `metal-grey`, from DF's ribbed
  panel), a triangle of tin closing each end (`models/tin.js`). Seen
  mostly from down the street, over the roofline. An awning under one
  has to stay below the wall behind it (the kit says so if not).
- **Pipes, boxes and vents** on the walls: `pipe()` runs a downpipe from
  a wall's roofline to the street (as tall as the wall); `fixture()` hangs
  a model built for a wall (`conduit-<length>`, `wall-tank`, `wall-unit`,
  `models/pipes.js`) at a height; `vent()` puts a decal on one
  (`vent-grille`, `vent-slats`, `vent-round`, `wall-fan`, `wall-meter`,
  cut from DF grilles, louvres and panels by derive.mjs). All placed on a
  straight wall's edge like a door, and none under an awning (the
  awning's slab would cut through them).
- **Clutter** (`clutter()`, after `finish()` and `drifts()`): the things
  found on the street (`models/clutter.js`): cargo crates in three sizes
  (DF's Ramshed crates in tan, grey and rust), drums, pressure canisters,
  a cargo pod on skids, a power unit against a wall, a heap of junk and
  litter (DF's trash pile) with an astromech's dome, rubble of plaster and
  brick, scrap tin leaning on a wall and a moisture vaporator. Spacers'
  and traders' leftovers, never a real-world village's (no clay jars or
  grain sacks: Mark, 2026-10-18). All `fixed`, so the ones against a wall
  don't climb onto its roof. The kit sets them in groups (a stack of
  crates, two or three drums or canisters, a pod, junk, rubble, scrap, a
  power unit, or one thing alone) against the
  straight walls where the street is open 4 tiles out in front (so alleys
  stay clear), off doors, arches and low fixtures, the first group of a
  few tries that fits what's left of the wall; litter lies about the open
  street too. `amount` scales it; placed from a seed; `keep` boxes stay
  clear for things put there by hand, and the rest comes out the same. Hand-place the
  groups a place wants (the stall's counter, the vaporator on the
  square): the main street's walls are short between their doors and
  arches, so the kit finds little room there. About 160 in the first
  stretch cost about 0.2 ms a frame.
- **Tarps** (`tarp()`): a stall's cover, a cloth tied at its four corners
  to poles (or its back two to a wall), sagging and billowing (a hanging,
  `tarp-<cloth>`, the awning canvas). Its ground is in its shade
  (`shadows()` counts it as a roof), while the cloth is lit as the suns
  find it at its height. Dear up close (about 0.4 ms filling a third of
  the view), so one or two in a view.
- **Hangings** (the level's `hangings`, MODDING.md): cables strung across
  the street, ropes, and torn cloth (curtains, valances on the awnings,
  banners, sheets across the lanes) that sway in the breeze. Tie each
  0.05 out from a straight stretch of wall, clear of rounded corners; about
  10 cables and 10 cloths in view at once is the budget.
- **Grime** (`grime()`, after `finish()`): decals that darken the wall
  under them in its own colour (MODDING.md, Decals), so the plain plaster
  breaks up without any plaster repeating it. Every straight wall under
  the sky gets streaks off its roofline, dust above its foot along the
  street, stains and cracks; a window gets a drip under its sill and a
  door smudges by its controls. `town.grime({ amount })` scales it (0
  none, 1 the usual, 2 neglected) and a house's own `grime` replaces it on
  its walls. Placed at random from a seed, the same every time. Slanting
  fronts get it too; rounded corners and round walls get none.
- **Doors and windows** (`door()`, `window()`): a door is a recess a tile
  into a straight wall, 2 wide and 3 high (an arch), and follows the
  film's (Mark's reference, 2026-10-17): the door itself on the back wall
  (a decal: a lattice of braces in red-brown, `door-red`, or grey,
  `door-grey`), the jamb lined with pale tiles with rounded corners (the
  `door-jamb` model, inside the recess), the striped `door-sign` over the
  opening and the `door-panel` controls beside it (on the wall's face),
  and a flagstone step outside. The arch is optional. The lean-to shop has
  a `shutter`. Most doors are pictures on houses with nothing inside.
  `opens: true` makes a real one into a `room()` behind a wall a tile
  thick: a rising door (`door-red-rising`, `door-grey-rising`) standing
  halfway through the wall, so the jamb (`door-jamb-through`, lipped on
  both faces) shows half a tile deep either side, and its panel slides up
  into the wall over the opening. F and G have them. `depth: 0` puts it
  on the wall itself (the back of a porch). Windows are set in too (Mark: inset
  matters more than their shape): a notch a tile deep, the wall below it
  a sill and a slab over it up to the roof, the window (`window-bars`,
  `window-louvre`) on its back wall. Decals only go on straight faces, not
  round walls.
- **Plasters and the skirt:** houses come in five plasters (`adobe`,
  `adobe-pale`, `adobe-ochre`, `adobe-rose`, `adobe-grey`), domes in each.
  The palette has no golden ochres, so ochre comes out terracotta: use it
  sparingly, as the accent. A building's walls, rounded corners included,
  can have a band along their foot (`skirt`, `SKIRTS` in the kit): dirt
  (`adobe-skirt`, up to 1 tile), a plinth of mud brick (`adobe-brick`, up
  to 1.5) or none. Not all alike (Mark, 2026-10-17).
- **Sand drifts** (`drifts()`, after `finish()`): pale loose sand along the
  walls, in patches, only in full sun (pale sand in the shade snaps to
  olive greys and looks like puddles). Tile corners are sand or drift, and
  a tile with some of each takes one of 14 edge textures
  (`street-drift-1` to `-14`, made by `derive.mjs`), whose edge wanders
  through the tile on a noise that repeats every tile, so the drifts'
  outlines are soft and don't follow the grid (Mark: not blocky).
- **Shadows** (`shadows()`, run by `finish()` after `seal()`): see Light
  and air.
- **Glyphs:** the painter's glyph pool grows to several thousand for this
  many heights and shades.

The engine's limits still hold: no rooms over rooms except slabs, no
slopes (ramps are stairs), and characters are drawn facing you from every
angle unless their sheet has the other views (the villagers do).

## Props and models

- **Models (built):** domes, awnings, tarps, tin roofs, pipes and wall
  boxes, the street clutter (above), and an X-34 landspeeder
  (`models/speeder.js`) on the main street by C's awning, bobbing over a
  soft grime shadow (the garage's can be another of it), Docking Bay
  87's ribs, fuel lines, pumps and rim lamps (`models/bay.js`), and the
  market's stall counters, the moisture condenser tower over the water
  plaza (about 10 m, a duracrete cistern with the water seller's tap,
  condenser plates near its top, a red beacon) and a dewback trough
  (`models/market.js`).
- **Models (new):** swoop bike,
  droid parts, the sandcrawler, the gutted freighter, the comm tower,
  the cantina's round bar and booth tables, a power droid (until a sprite),
  water tanks, blast doors in their recesses.
  The Moldy Crow comes with the drop-off (story section 5).
- **Existing:** barricades, supply crates, terminals, consoles, floodlight
  towers (the checkpoint), boulders (the town's edge).
- **Doors and windows:** decals cut by `derive.mjs` (`DECALS`): the
  doors' lattice from IDDOOR1, the sign over them from NPVENTS1's slats
  (navy and orange), their controls ZASWIT04 as it is, the shutter from a
  strip of NDCORUG1, barred windows from SPBARS1, louvres from NPVENTS1.
  The jamb's tiles (`door-jamb`, a texture) are ZPTILE4's bevelled square,
  shrunk to a quarter tile (Mark's reference has small ones) and
  repeated. Doors that open use the door decals again as 64x128 panels
  (`RISING`: a panel must be a power of two).
- **Textures:** Dark Forces textures recoloured by
  `assets/custom/derive.mjs` (Mark, 2026-10-17: DF textures for now, none
  of our own, so no generated stand-ins). So far: plaster (`adobe`),
  whitewash (`adobe-pale`), terracotta (`adobe-ochre`), peach
  (`adobe-rose`), grey (`adobe-grey`) and the walls' dirty foot
  (`adobe-skirt`) from the plain top of Gromas' GWANO, weathered
  plaster (`adobe-old`) from ZPMARBY1, mud brick from ZPBRICK1, roofs from
  IPGREYC2, the street and its drifts from ZPROCK02, flagstones from IPDET1, planks from
  IWGRAN5. To come, the same way: doors and shutters, rusty metal, cloth
  (awnings, hangings), the bay's ribbed duracrete, the cantina's dark
  walls, floor and bar. Gradients use the palette's sand and beige ramps:
  pale tones between them snap to olive greys.
- **Decals:** from DF's signs and graffiti where they fit: shop signs, the
  cantina's sign, the Guild's mark, wanted posters, stains and blast scars.

## Characters

Calm in the first half (`docs/story.md`, "Mission 1's free roam"):
troopers stand posts and walk patrols, everyone else wanders and talks.

| Who | Where | Art |
|-----|-------|-----|
| Villagers (five kinds) | streets, market, plaza, old quarter | have |
| Jawas, Jawa traders | junk yard, market (the droid argument) | have the Jawa |
| Sandtroopers, a commander | patrols, checkpoint, customs | have |
| Stormtroopers, officers | prefecture, customs house | have |
| Probe droid | over the market | have |
| Bossk, Boba Fett | the cantina: hunters having a drink (calm) | have |
| Cantina customers: 4-6 kinds of alien | the cantina | **Mark** |
| The band | the cantina's bandstand | **Mark** |
| Bartender, broker, informant, thug | cantina, alleys | **Mark** |
| Customs officer, bay owner, water seller | bay, customs, plaza | **Mark** (the officer could be our officer recoloured) |
| Dace (a scout trooper without his helmet) | the derelict bay | **Mark** |
| Dewback, power droid | stable, bay, patrols | **Mark** |

## Sound

- **Ambient** (PLAN.md section 3's looping positional sounds): a town
  murmur in the market, wind at the edges and in the old quarter, the bay's
  fuel pumps, the garage's tools, the furnace in the junk yard.
- **Music:** a calm Mos Eisley track for the free roam, the cantina band
  (original: positional, louder inside, muffled outside), and the combat
  track the switch starts.
- **One-shots:** a ship taking off from a far bay now and then (with a
  model flying over the rooftops: the `fly` action), a dewback's call.

## Enemies and items by skill

The calm half has no fights; skills only change the loud half. Filled in
when the level is populated. The plan:

| Area | Every skill | 2+ | 3+ | 4+ |
|------|-------------|----|----|----|
| Derelict bay | the squad that takes Dace (left), 2 troopers on the rim | | a trooper at the bay door | |
| Old quarter | the patrol that passed you | a probe droid | | |
| Rooftops | | a sniper | 2 snipers | |
| Checkpoint | its guards behind the barricades | a commander | | |
| Prefecture | reinforcements out of the gate | | more | |
| Back alleys / cantina | an ambush on each way round | | | |
| Market | the patrol, the probe droid | | | |
| Bay 87 | customs troopers | | the customs officer fights | |

Med kits and ammo along the way back west, more on skills 1-2, as in `m3`.

## Build order

Each step is a commit Mark can try (`?map=m1`), with before and after
snapshots. The steps are in PLAN.md section 1.

1. **Daylight and the kit:** the day sky, haze, the first textures (adobe,
   street sand), the town kit, twin-sun shadows, `m1` with a test street.
2. **Docking Bay 87, the lane, the owner's office and customs:** the start.
3. **The main street, the market and the water plaza.**
4. **The cantina.**
5. **Bay 86, the stable and the garage.**
6. **The junk yard and the sandcrawler.**
7. **The back alleys and the back lane.**
8. **The checkpoint and the rooftops.**
9. **The prefecture.**
10. **The old quarter and the dry wash.**
11. **The derelict bay.**
12. **The skyline:** the backdrop, the town's edges.
13. **Life:** calm troopers and the town's switch, patrols, villagers,
    Jawas and aliens placed (story section 5's pieces as they're needed).
14. **Air and sound:** dust, emitters, ambient sound, the cantina band.
15. **The story:** conversations, the fob, the drop-off and pickup, the
    loud half's spawns, blast doors and per-skill fights.
16. **Tune:** light, frame time with a full market, the per-skill check.
