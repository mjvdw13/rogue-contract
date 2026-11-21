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

- **The drop-off.** The Crow sets Kyle down in a hollow in the rock
  south-east of the garrison and lifts off again. JAN: "The garrison's in
  the cliffs north-west of here. These canyons are Jawa country: watch the
  ledges. I'll pick you up on their pad."
- **What the canyon shows.** Jawas, everywhere: in the gulch, in their
  scrapyard round a skyhopper they've brought down, in the cave. Then a
  Tusken camp burned flat: what the prototype did (Rusk saw it). No
  Imperial building until the garrison (Mark, 2026-11-20); only their
  perimeter beacons set in the rock along the way, red and blinking, and
  a probe droid over the dry gorge.
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
- **The chain of locks.** The office's door opens once the general has
  gone (seen through the window). Reading the records unlocks the cell
  block's door north of the vault; talking to Rusk unlocks the back
  stairs down to the generator. So the overload comes after both.
- **The exit.** Coming out on the gantry after the overload, the
  general's shuttle lifts off the pad and goes north; then the Crow
  comes in over the hollow and sets down on the pickup spot. Reaching it
  ends the level (`crow-down`).

## What makes it work

- **Exploring, not crossing** (Mark, 2026-11-20, after the first cut:
  a backtracking start and a lot of boring walking). The canyon is tight
  and changes every few seconds: a slot with chockstones overhead, a
  ledge over a gulch with a gap to jump and Jawas shooting up from below,
  rock steps down into their scrapyard, a dark cave with a squeeze to
  crouch through, the burned camp, a climb and a high ledge over a dry
  gorge to the arch. Start facing the way on.
- **Hints of the Empire.** Perimeter beacons in the rock (seven, red,
  blinking) from the slot onward, closer together toward the end; a
  probe droid over the dry gorge; then the arch's sniper, and over the
  bowl the garrison's face, banners and the comm mast.
- **A chain, not a hub.** Areas in a line, one way on from each. A fall
  off a ledge lands somewhere that leads back (the gulch floor is the
  route; the dry gorge joins the camp). The old start bowl is a pocket
  off the gorge, under the arch.
- **Height.** The hollow (-6), the slot rising (-4), the ledge over the
  gulch (-4 over -10), down into the scrapyard (-10), the cave climbing
  to the camp (-2), the climb and the high ledge (5), over the arch, down
  into the bowl (0), in at 6, down to the generator's floor (-6), out on
  the cliff at 6 to 10, high over where you started.
- **One change of state.** The overload: the klaxon, red light pulsing
  through the generator, the test bay and the way out, lamps dying,
  steam and sparks, the test bay's blast door opening and the squads
  that wait behind it.
- **Length.** A walk of the route with no monsters of 105 to 125 s
  (Mission 4: 105, Mission 5: 123), par 600.

## Flow

```
[1 the hollow: the Crow sets Kyle down] -> [2 the slot, chockstones overhead]
   -> [3 the ledge over the Jawa gulch, a gap to jump] -> steps down
   -> [4 the Jawas' scrapyard] -> [5 the cave, a squeeze] -> [6 the burned camp]
   -> [7 the climb and the high ledge over the dry gorge] -> [8 the arch]
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
| 1-2 | Into the rock | Jan's line; the hollow's only way out is the slot west; the first beacon in it |
| 3-4 | Along the gulch | The ledge; Jawas below; its far end steps down into their scrapyard |
| 5-6 | Through the cave | The scrapyard's one way on; moonlight through its roof; the camp's sky at its end |
| 7-8 | Up and over | The climb at the camp's north end; beacons along the high ledge; the arch beyond the notch |
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
| 1 | The hollow, drop-off | round (204, 126) | -6 / sky | Start (205.5, 126.5) facing west. The Crow sets down beside and leaves. Opens north to a bay under the cliff gantry (seen from below). |
| 2 | The slot | (194, 126) to (166, 139), 3 wide | -6 up to -4 | Winding; two chockstones wedged across it overhead (slabs). A beacon. |
| 3 | The ledge over the gulch | (166, 140) to (126, 139), 3 wide | -4 | Along the gulch's north wall, 3 m over its floor; a 3-tile gap at x 146..148 to jump (a fall lands on the gulch floor, the way on). A beacon. |
| 3a | The gulch | round (150, 151), 16 wide | -10 / sky | Jawas. Rock steps (126, 139) to (116, 145) down off the ledge's west end. |
| 4 | The scrapyard | the gulch's west end, round (124, 150) | -10 | A skyhopper the Jawas brought down, their crates and fire. A beacon. |
| 5 | The cave | (116, 150) to (74, 130) | -10 up to -2.5 / 4 over the floor | Dark, gravel; a squeeze (96..100, 146..149) 1.3 high to crouch through; moonlight through cracks in two places. |
| 6 | The burned camp | 28..76, 112..142 | -2 / sky | Tusken huts burned to their frames, scraps of hide, ash heaps smouldering, scorched ground. Two Jawas scavenging. A beacon at its east end. |
| 7 | The climb and the high ledge | (36, 111) to (38, 96); then to (92, 89.5) | -2 up to 5; 5 | Uneven rock steps up the camp's north end, a landing halfway; the ledge east along the north side of a dry gorge (floor -2, joining the camp) to the notch (92..102, 88..91). A probe droid over the gorge; beacons. |
| 8 | The arch | 102..122, 88..91 | top 5 | The first map's rock arch, now walked over: the gorge 2.5 m below, the old start bowl beyond. Down its east end by rock steps (126..130, 80..91) north into the bowl. |
| 8a | The gorge and the old start bowl | 102..126, 84..100; 94..118, 100..120 | 0 / sky | A pocket under the arch, off the route. Secret 1: the rock alcove (90..94, 104..108), a shield. |
| 9 | The bowl | 108..150, 68..84 | 0 / sky | The first map's. The spire (123..129, 73..79) is now a rock mesa 7 m high (scenery, no way up) with the comm mast on it. Ledge A (west, 5): a sniper. Ledge B (east, 3): secret 2. |
| 9a | The garrison's face | strip 114..158, 60..68 | 0 | The first map's: the gate (134..138), the crest, hazard stripes, light strips. Now: banners either side of the gate, cables from the face to the floodlight towers and up to the mast, barricades. |
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
| 17 | The cliff gantry | 207..215, 85..100 | 6 up to 10 / sky | Grate on the cliff face, railings, a floodlight. Below: a bay of the hollow where Kyle started. |
| 17a | The chasm | 215..218, 86..116 | -6 / sky | The 3-tile jump. Lift L3 (215..218, 110..116) back up if you fall. |
| 18 | The pad | 218..236, 86..124 | 10 / sky | Floodlit, landing lights. The shuttle until Kyle reaches the gantry. The pickup spot (225..229, 100..104). |

## The kit (design language)

- **Outside:** the first map's: sandstone walls rising to a rim (in the
  wide places, shelves of darker rock at their foot, 1.25 to 2.25 m), gravel
  channels in the sand, the backdrop's ridges, boulders. New: the comm
  mast (a lattice tower with red beacons) over the bowl, the Imperial
  beacons set in the rock (`rock-beacon`: a dark housing, a red lens, a
  blinking light), chockstones over the slot, the Jawas' scrapyard,
  Imperial banners on the face, the burned camp. Nothing real-world (the
  first cut's power line on poles was: Mark, 2026-11-20).
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

- **The hollow and the gulch:** moonlight 136 to 144. The slot 124, the
  rock steps 128, the cave 104 with two shafts of moonlight (144).
- **The burned camp:** 144, with the embers' warm glow (light sources,
  flickering, +32). The scrapyard's fire (+56).
- **The beacons:** each a small blinking red light (+40).
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

As placed (validator): 25 monsters on skill 1, 45 on 3, 55 on 5, plus the
squads the overload brings (3 and 2 more from skill 3 in the test bay, 3
and a commander from skill 2 on the pad). By area: Jawas in the gulch (3
to 5), the scrapyard (2 to 3), the cave (1 to 2) and the camp (1 to 2); a
probe droid over the dry gorge; the arch's sniper and the notch's
trooper; the bowl (the first map's); maintenance (the ambush); the cut
(1); the excavation (2 to 3 with an officer); the mess (2 to 4); the
barracks and office (the first map's); the vault (the first map's);
detention (the officer and a guard); the generator (the first map's).
Med kits, cells, packs and detonators along the way (no try-out pile at
the start: Mark, 2026-11-20), E-11s from the troopers. Ammo 15.6x.

## Engine notes

- **The landmark.** A model shows over the rim only if the 2D line to it
  runs through open tiles (checked 2026-11-20): behind solid rock it's
  hidden. So the mast stands in the open (on the spire's mesa, a raised
  floor), seen over the bowl. A thing
  is also cut off at its tile's ceiling, and an open tile's sky starts at
  24: over the bowl it starts at 40, so the mast (34 at its tip) stands
  whole. Through 37 m of haze its steel has to be pale and heavy and its
  beacons big (fullbright faces take the haze too).
- **Shortcuts.** The chasm under the pad doesn't open into the hollow, so
  its lift can't take Kyle from the start to the pad.
- **Mohc leaving** uses the `remove` action (built for this): when the
  player, having seen him through the window, comes back past the
  office's door, he's taken away and his door shuts.
- **Flights over the hollow and the pad** need the sky high: those tiles'
  sky starts at 48 (the Lambda shuttle stands 19 tall on the pad at 10).
- **Beacons on the rock** are placed by `wallSpot()` in `m3.js`: the
  open tile nearest a point with rock (a wall, or a rim 4 over it) on one
  side; the beacon goes on that face, facing out.

## Checked

- 2026-11-20, before: the first map's route, 61 s at a walk; bench at
  640 x 400, headless, one thread: 8.6 ms on average, 16.2 at the 90th
  percentile, 18.7 at worst.
- 2026-11-20, after: `tests/m3-route.test.js` walks the route with no
  monsters, hollow to the Crow (the jump on the gulch ledge, the squeeze,
  the records, Rusk, the overload, waiting for the Crow): 156 s. Bench
  the same way: 8.6 ms on average, 17.4 at the 90th percentile, 19.6 at
  worst. `npm test`, `npm run validate` (0 errors, 0 warnings) and
  `npm run smoke` pass. Every area looked at in snapshots with the Dark
  Forces art. Not checked: the fights by playing, anything in a browser,
  the sounds by ear.
