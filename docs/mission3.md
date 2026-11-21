# Mission 3: the Canyon Garrison (design)

The story's Mission 3 (`docs/story.md`): Kyle breaks into the Imperial
garrison dug into a canyon in the Jundland at night, frees Rusk, takes the
test records from the vault and overloads the generator under the
prototype's test bay. Jan picks him up on the garrison's own pad.

This is the second design (2026-11-20, PLAN.md item 4). The first map
(128 x 100, par 300, a route of 61 s at a walk) was built before Missions
1, 2, 4 and 5. Its night look and its light stay; its canyon, gate,
maintenance, barracks, vault and generator stay as they were, moved 88
east and 24 south, and the new areas go round them.

## Story

- **The drop-off.** The Crow sets Kyle down in a dry wash south-east of
  the garrison and lifts off again. JAN: "The garrison's in the cliff at
  the head of the canyon. See the mast? Their pad's up on the right. I'll
  pick you up there."
- **What the canyon shows.** Jawas stripping a wrecked skyhopper. Then a
  Tusken camp burned flat, troopers picking over it: what the prototype
  did (Rusk saw it). Then the range where it was tested, and the scout
  post that guarded it (Rusk's unit).
- **Mohc.** Through the office's barred window, an Imperial general (an
  officer's sprite for now: Mark, 2026-11-20) hurries out of a far door.
  He's gone before Kyle can get round. His shuttle leaves the pad as Kyle
  comes out on the cliff.
- **Rusk** is in the new detention block's last cell. He talks, sets
  `rusk-free` and says he'll keep behind Kyle (as in Mission 4); he's
  aboard at the end.
- **The records** are on the vault's dais (a terminal that sets
  `records`, as Mission 5's manifest). Its text names the test bay and
  the generator under it.
- **The prototype** is the story's boss, but it waits for Mark's sprite
  sheet (2026-11-20). Until then its cradle in the test bay is empty, and
  the generator's fight is a squad and a commander.
- **The exit** works once Rusk is free and the records are taken: the
  Crow comes in to the pad when its squad is dead.

## What makes it work

- **The goal is seen first.** From the drop-off: up the reach to the
  north-west, the garrison's face lit across the bowl, the rock spire in
  front of it with the **comm mast** on top, red beacons blinking; and up
  on the right, the pad on its cliff with the general's shuttle on it.
  The reach ends under the bowl's lip, too steep to climb: the way is
  round, west by the old range road. The mast is in view again from the
  range and the ledge path, and over the bowl.
- **A chain, not a hub.** Fourteen areas in a line, one way on from each.
  Loops only inside an area, for fights. The old start bowl is a pocket
  off the gorge, under the arch.
- **The Empire thickens.** Jawas, then a burned camp with a patrol, then
  a scout post with a gate, then the range with a sniper tower, then the
  bowl's walls, floodlights and banners.
- **Height.** Down in the wash (-6), the slot canyon climbing out (-2),
  up to the range (0), up the ledge path (5) and over the arch, down into
  the bowl (0), in at 6, down to the generator's floor (-6), out on the
  cliff at 6 to 10, high over where you started.
- **One change of state.** The overload: the klaxon, red light pulsing
  through the generator, the test bay and the way out, lamps dying,
  steam and sparks, the test bay's blast door opening and the squads
  that wait behind it.
- **Length.** A walk of the route with no monsters of 105 to 125 s
  (Mission 4: 105, Mission 5: 123), par 600.

## Flow

```
[1 the wash: the Crow sets Kyle down] (the reach: the goal seen, too steep)
   -> [2 the dry wash west: Jawas at the wreck]
   -> [3 the slot canyon, climbing] -> [4 the burned camp]
   -> [5 the scout post: the bunker's switch opens its gate]
   -> [6 the test range] -> [7 the ledge path, up its east wall] -> [8 the arch]
   -> down into [9 the bowl under the garrison] -> the vent
   -> [10 the vent and maintenance] -> lift up -> [11 the cut and the excavation]
   -> [12 the mess hall, the bunk room, the corridor; the office (red key), Mohc]
   -> red door -> [13 the vault: the records] -> [14 detention: Rusk]
   -> down the back passage -> [15 the generator: the overload]
   -> the hatch -> [16 the test bay: the blast door] -> [17 the cliff gantry]
   -> the jump -> [18 the pad: the last fight, the Crow]
```

| Step | Goal | How the player knows |
|---|---|---|
| 1 | The garrison | Jan's line; the mast and the lit face up the reach; the pad up on the right |
| 1-2 | Round by the west | The reach ends in a cliff under the bowl's lip; the wash goes on west |
| 3-4 | On up the canyon | One way; the power line's poles start at the camp |
| 5 | Through the post | Its gate is shut across the neck; the bunker's lit window; the switch inside |
| 6-8 | Over the arch | The range is walled in; the poles go up the ledge path; the mast over the rim |
| 9 | In by the vent | The gate is shut and guarded; Jan names the vent from the arch |
| 10-11 | On through the works | One way |
| 12 | The red key | The officer, seen through the barred window with Mohc |
| 13 | The records | The red door at the corridor's end; the vault's lit dais |
| 14 | Rusk | The records name him; the PA calls his transfer; his name over his head |
| 15 | The overload | The records name the generator; signs; the hum growing |
| 16-18 | The pad | The klaxon; the hatch and the blast door open; one way, up |

## Areas (x, y in tiles; heights in units)

The map is 240 x 176. Everything not painted is rock (outside) or the
garrison's structure (inside). Kept areas are the first map's, moved by
(+88, +24).

| # | Area | Box (x0..x1, y0..y1) | Floor / ceiling | Notes |
|---|------|----------------------|-----------------|-------|
| 1 | The wash, drop-off | 176..236, 118..170 | -6 / sky | Wide, sandy, gravel channels. Start (186.5, 124.5) facing north-west up the reach. The Crow sets down beside and leaves. |
| 1a | The reach | a band 16 wide from (184, 122) to (140, 92) | -6 / sky | Ends at a cliff under the bowl's south lip (133..147, 84..86: rock at +2 along the bowl's edge, 8 over the reach). The view: the face, the mesa and the mast. |
| 1b | The pad's cliff | 218..236, 86..124 | (the pad, 10) | Seen from the wash: its edge 16 over the wash floor, the shuttle on it, its landing lights. |
| 2 | The dry wash | 104..176, 146..172 | -6 / sky | West from the drop-off. Jawas stripping a wrecked skyhopper (128, 160). Boulders. |
| 3 | The slot canyon | from (106, 158) north-west to (68, 126), 4 to 6 wide | -6 up to -2 | Winding, its walls close; two short flights of rock steps. |
| 4 | The burned camp | 28..70, 112..146 | -2 / sky | Chamfered bowl. Tents burned to their frames (charred cloth on poles), embers, smoke, scorched ground, a broken moisture vaporator. Troopers picking over it. The power line's first pole. |
| 5 | The scout post | neck 30..40, 96..112; bunker 40..52, 96..110 | neck -2 up to 0; bunker 0 / 4 | The canyon narrows to a neck climbing to 0, shut at its head (y 96..98) by a wall with a 4-wide gate (remote, `postgate`). The bunker in the rock on the neck's east side: its door, a window over the neck, a terminal and the switch that opens the gate. |
| 6 | The test range | 12..88, 28..96 | 0 / sky | Broad and flat, walled in by rock. Targets (worn barricades, a blasted landspeeder, scorch marks), a sniper tower (a platform at 6, no way up), the power line's poles crossing it north-east. |
| 7 | The ledge path | 88..92, 40..88 | 0 up to 5 | Cut along the range's east wall (an Imperial road: grate steps, a railing on the drop), the poles beside it. Rises in flights to 5, turns east at its south end through a notch (92..102, 88..91). |
| 8 | The arch | 102..122, 88..91 | top 5 | The first map's rock arch, now walked over: the gorge 2.5 m below, the old start bowl beyond. Down its east end by rock steps (126..130, 80..91) north into the bowl. |
| 8a | The gorge and the old start bowl | 102..126, 84..100; 94..118, 100..120 | 0 / sky | A pocket under the arch, off the route. Secret 1: the rock alcove (90..94, 104..108), a shield. |
| 9 | The bowl | 108..150, 68..84 | 0 / sky | The first map's. The spire (123..129, 73..79) is now a rock mesa 7 m high (scenery, no way up) with the comm mast on it. Ledge A (west, 5): a sniper. Ledge B (east, 3): secret 2. The rock lip along the south-east over the reach. |
| 9a | The garrison's face | strip 114..158, 60..68 | 0 | The first map's: the gate (134..138), the crest, hazard stripes, light strips. Now: banners either side of the gate, cables from the face to the floodlight towers and the mast, barricades. |
| 10 | The vent | 120..122, 50..64 | 0.5 / 1.7 | Crouch. Halfway, a fan turning in a shaft overhead, light falling through it. |
| 10a | Maintenance | 114..130, 38..50 | 0 / 5 | The first map's. Lift L1 (130..134, 40..44) up to 6, now opening north only. |
| 11 | The cut | 130..134, 20..40 | 6 / 10 | A tunnel in raw rock: steel ribs, work lamps, cables along the wall. |
| 11a | The excavation | 112..134, 4..20 | 6 / 12 | Unfinished: raw rock, a half-built wall of panels, a cave-in, girders, a cable reel, work lamps. The door east into the mess (134..135, 14..16). |
| 12 | The mess hall | 135..160, 6..27 | 6 / 10 | Tables and benches, a serving counter. Door south (141..143, 27..28) into the bunk room. |
| 12a | The bunk room | 136..148, 28..39 | 6 / 10 | The first map's; bunks now. Door to the corridor (141..143, 39..40). |
| 12b | The corridor | 135..165, 40..44 | 6 / 10 | The first map's, walled at its west end. |
| 12c | The office | 150..160, 28..39 | 6 / 9 | The first map's: the officer with the red key, the barred window (157..159, 39..40). Mohc's door (160..161, 31..33, never opens for Kyle). |
| 13 | The vault | 166..180, 34..49 | 6 / 9 | The first map's: the red door (165..166, 41..43). The records on a lit dais in the middle. The south door is gone; a door north (172..174, 33..34) into detention. Secret 3: the niche behind a computer bank (182..186, 37..43). |
| 14 | Detention | 160..192, 10..33 | 6 / 10 | Control (166..180, 26..33) over the vault, a lane east (166..192, 18..22) with cells north and south behind bars; Rusk in the last on the north. From the lane's east end a passage (188..191, 22..50) down the back to the generator's north catwalk. |
| 15 | The generator | 160..196, 50..86 | -6 / 18 | The first map's: the catwalk ring at 6, the column, lifts L2 and L2b, the overload switch on the column's east face. |
| 16 | The test bay | 197..226, 54..84 | 6 / 20 | Cut into the rock. The prototype's cradle in the middle (a gantry frame, clamps, cables hanging), the target wall east scorched and pocked. The hatch from the generator (196..197, 67..69) and the blast door south (209..213, 84..85), both opened by the overload. |
| 17 | The cliff gantry | 207..215, 85..100 | 6 up to 10 / sky | Grate on the cliff face, railings, a floodlight. Below: the reach and the wash. |
| 17a | The chasm | 215..218, 86..116 | -6 / sky | The 3-tile jump. Lift L3 (215..218, 110..116) back up if you fall. |
| 18 | The pad | 218..236, 86..124 | 10 / sky | Floodlit, landing lights. The shuttle until Kyle reaches the gantry. The pickup spot (225..229, 100..104). |

## The kit (design language)

- **Outside:** the first map's: sandstone walls rising to a rim, gravel
  channels in the sand, the backdrop's ridges, boulders. New: the comm
  mast (a lattice tower with red beacons), the power line (poles with
  cables between them), Imperial banners on the face, the burned camp.
- **Inside: dug into the cliff.** Where Missions 4 and 5 are all metal,
  the garrison is rock: `sandstone` walls and ceilings where it's raw
  (the cut, the excavation, the test bay, the vent's fan shaft), the
  first map's Imperial panels (`imp-*`) bolted over it where it's
  finished (the barracks, the vault, detention, the generator), and rock
  showing above them where a room is taller than its panels.
- **Not the station.** The Imperial set here is dark blue-grey and worn
  (grime down the walls), lit blue-white. The station's pale grey models
  (`ds-*`) only where they're the same gear (tables, lockers, bunks,
  girders, work lamps).

## Light and air

The first map's light is kept, area by area. New areas:

- **The wash and the reach:** moonlight 144, the reach's floor in the
  cliffs' shadow 128. The pad's floodlights and the face's lights seen far
  off.
- **The slot canyon:** 120 to 128, the moon hardly reaching in.
- **The burned camp:** 144, with the embers' warm glow (light sources,
  flickering, +32).
- **The scout post:** the bunker 160 inside, a lamp over its door and the
  gate (+48).
- **The range:** 152 (open), the tower's floodlight pool.
- **The cut and the excavation:** 120, work lamps in pools (+64).
- **The mess:** 160, lit ceiling panels. **Detention:** 128, red light
  over the cells (the only red before the alarm).
- **The test bay:** 128, a pool over the cradle (192).
- **The alarm:** the generator, the test bay, the gantry and the pad's
  landing lights pulse red-dark (`setLight`), the klaxon sounds.
- **Air:** still and cold: no storm. A thin `dust` in the air outside
  (a few motes catching the floodlights), and a light wind high up
  (`wind: [0.6, -0.3, 0]`) that moves the banners and the cables.

## Secrets (3)

1. The old start bowl's rock alcove (a shield unit).
2. Ledge B in the bowl (an energy pack, a view down on the gate).
3. The vault's niche behind a computer bank (a shield unit).

## Enemies and items by skill

To settle in the fights step: about 16 monsters on skill 1, 26 on 3,
36 on 5, by area: the camp (a patrol of 3), the scout post (2 and a
sniper on the bunker's roof), the range (the tower sniper, a beat of
2, a probe droid), the bowl (the first map's), maintenance (the ambush),
the excavation (2), the mess (3), the barracks and office (the first
map's), the vault (2), detention (a guard and the officer), the
generator (the first map's), and after the overload the test bay's
squad and the pad's (spawned, waiting). Detonators along the way (there's
no try-out pile at the start: Mark, 2026-11-20), E-11s from the troopers.

## Engine notes

- **The landmark.** A model shows over the rim only if the 2D line to it
  runs through open tiles (checked 2026-11-20): behind solid rock it's
  hidden. So the mast stands in the open (on the spire's mesa, a raised
  floor) and the reach and the range are laid out to look at it. A thing
  is also cut off at its tile's ceiling, and an open tile's sky starts at
  24: over the bowl it starts at 40, so the mast (34 at its tip) stands
  whole. Through 37 m of haze its steel has to be pale and heavy and its
  beacons big (fullbright faces take the haze too).
- **The drop.** Monsters in the bowl can see down into the reach; it's
  out of their reach both ways (the lip is 8 over the reach floor).
- **Shortcuts.** The chasm under the pad doesn't open into the wash, so
  its lift can't take Kyle from the start to the pad.
- **Mohc leaving** needs a `remove` action (PLAN.md section 6): built
  with this.
- **Frame time:** the range and the wash are big open places: bench them
  at the blockout.

## Checked

- 2026-11-20, before: the first map's route, 61 s at a walk; bench at
  640 x 400, headless, one thread: 8.6 ms on average, 16.2 at the 90th
  percentile, 18.7 at worst.
