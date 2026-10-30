# Mission 1: Mos Eisley (design)

The story's Map A (`docs/story.md`), and the vertical slice. Kyle walks east
through a calm Mos Eisley in daylight, finds Rusk at the far end, then fights
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

Fitted to what's built on 2026-10-29 (the paper pass before the blockout,
Mark's OK the same day: the junk yard north of the market, the old quarter
on a rise). The whole town is blocked out: the east third and the middle
(the cantina, the junk yard, the alleys, Bay 86).

```
  x 0          30        60        90       120       150       180
y    +----------------------------------------------------------------------+
   0 |                                                                      |
   6 |                     SSSSSSSSSSSS                                     |
  12 |                                     77777                            |
  18 |                   444444444         77777   7777                     |
  24 |                   444444444         777777  7777                     |
  30 |       ttttttttttt 444444444        777777 777777                     |
  36 |       ttttttttttt 444444444 777777          7777                     |
  42 | 22222222222222222222        7777            7              T         |
  48 | 222222222222222222222222222277772222222222227                        |
  54 | 222222222222222222222222222277772222222222227   9999999999999999ww   |
  60 | 2222222222222222222222222222222222222222222255559999999999999999ww   |
  66 | 2222222222222222222222222*22222222B2222222225555G9999\9999999999ww   |
  72 | 22222222222222222222222222222222222222222L22    99999\\\99999999ww   |
  78 | 22222222222222222222222222222222222222222L22    9999999\\9999999ww   |
  84 | 222222222222222222222222222222222        L66666699999999\\\99999ww   |
  90 | 222222222222222222222222222233333333     L6666669999999999\\9999ww   |
  96 | 222ccc22222222222222        33333333     L666666999999999999\999ww   |
 102 |    ccc  1111  ooo  xxxxxxxx 3333333333333L6666666               ww   |
 108 |     11111111111   xxxxxxxxxx  3333333    L6666666          0000 ww   |
 114 |    1111111111111   xxxxxxxx              L6666666       0000000000   |
 120 |    11111111111111   xxxxxx                             000000000000  |
 126 |    11111111111111                                      000000000000  |
 132 |     111111111111                                       000000000000  |
 138 |      111111111                                           00000000    |
 144 |                                                                      |
 150 |                                                                      |
     +----------------------------------------------------------------------+
  one character is 3 tiles across and 6 down; blank is the town out of reach
  2  built: the west end, the market and the street past it, houses and all
  *  the condenser tower      B  the blast doors      G  the checkpoint's gate
  T  the comm tower           \  the old quarter's slanting street
  1 Bay 87   c customs   o owner's office   x Bay 86   3 cantina   L back lane
  4 junk yard   S sandcrawler   t stable   7 back alleys   5 checkpoint
  6 rooftops   9 old quarter   w dry wash   0 derelict bay
```

**Going east (calm):** Bay 87 → the south back lane → the main street →
the market, the hub → the cantina, south of it (the contract and the fob)
→ the junk yard, north of it (the signal) → east past the blast doors to
the checkpoint → past it with a pass (the informant, in the alleys by the
checkpoint) or over the rooftops (from the back lane) → down the old
quarter's slanting street → the derelict bay (Rusk). The main street is
walked once each way: the cantina and the junk yard face each other across
the market. (With the junk yard in the far west, as first designed, the
way from the bay to the market was walked three times before the shooting.)

**Coming back west (loud):** the derelict bay → the old quarter, or along
the dry wash → the checkpoint (open now, troopers behind its barricades)
or the rooftops (snipers now) → the blast doors are shut, so through the
back lane and the cantina, or west through the alleys → the market → the
main street → Bay 87, where the Crow comes down.

**What holds the player back:**

- The checkpoint's gate opens for the pass, and at the switch.
- The freighter's hold in the derelict bay stays shut until the fob has
  the signal, so going over the rooftops early finds nothing. (Not yet:
  in the blockout the hold is open, and stepping into it turns the town.)
- The Jawa trader has nothing to say until Kyle carries the fob.
- The blast doors shut at the switch, so the way home is round them.

**Levels and slants** (above, "Off the grid, and up and down"): Mos
Eisley is flat (Mark, 2026-10-30), so each part of town stands a couple
of steps (0.5) up or down from the next. The street is at 0 and the town
rises a little to the east: the old quarter two steps up at 0.5, so the
checkpoint's gate stands at the top of two steps; the alleys climb a step at a time to 0.5. Below the street:
the junk yard and the cantina two steps down at -0.5, and the dry wash
two steps under the old quarter, at 0. Only the docking bays are pits
(-5), as in the film. Slants: the
street's bend past the market (built), the alleys, the junk yard's fence,
the checkpoint's barricades and the old quarter's main street. The
town has no Imperial buildings (Mark, 2026-10-30): the checkpoint is the
Imperials' gear set up in the town's own gatehouse, and only the blast
doors are theirs.

**Landmarks:** the condenser tower marks the hub (built). The comm tower,
about 30 tall with a red beacon, stands where the street's bend points
(at 180, 44). The haze halves what's left every 64 tiles, so from the west
end (about 150 away) a fifth of it shows, from the market a third, and
from past the blast doors half. The blockout's stand-in, a block 22 tall
(blocks stop under the town's sky at 24), shows from the checkpoint and
the old quarter but not from the market, where K hides it: a tower there
must stand over 26 to clear K, so the real one is a model, which the sky
doesn't cap. The sandcrawler shows over I's low roof from the market, and marks
the way to the Jawas. A rusty crane stands over the derelict bay's rim, at
the end of the old quarter's slanting street.

## Areas

Boxes are x0..x1, y0..y1 in tiles; heights in units (1 unit = 0.5 m). The
street is at 0. The numbers 1-10 are the story's; 11 on are new.

| # | Area | Box | Floor | What's there |
|---|------|-----|-------|--------------|
| 1 | **Docking Bay 87** | 9..56, 100..149 | -5, sky | The start, and the pickup. A round pit open to the sky, 21 m across (centre 32, 125, radius 21), south of the first stretch's south back lane (the design's first box overlapped the south row). Duracrete walls 5.5 m tall, braced by buttresses along their foot (`bay-wall`, `bay-wall-ribbed`, from Talay's TWCAP01), twelve ribs up them every 30 degrees clear of the landing, a lamp on the rim over every other rib, fuel lines over the rim and down to four pumps, hoses out from two of them across the floor (one left lying by the Crow, one coiled), big crates stacked two high round the edge and drums (`models/bay.js`), eight soot scars (`grime-scorch-1`, `-2`: decals on the angled wall). The bay door (4 wide, 4 high) opens off the back lane into a passage and onto a landing over the pit at street level; stairs go down from it (a step of 0.625 a tile, risers in `bay-step`: shaded duracrete under a pale nosing, between cheeks a step higher whose sides are bay wall). Hazy and quiet: dust drifting, a power droid shuffling, the bay owner's grumbling, a hum of fuel pumps. A maintenance pit in the middle of the floor where the Crow lands (28..35, 122..125, 2 deep, steel-lined, hazard stripes on its lips, two steps down at its west end); off its east end a crawlspace under the floor (a slab) with a shield unit: the secret. The Moldy Crow hovers just south of the pit, nose east and turned a little off square (until the drop-off flies it in and out); you can walk under it. |
| 2 | **Main street** (built) | 2..136, 61..78 | 0, sky | 12-15 wide, sand over packed earth, adobe both sides. In the west end (2..62, 44..100) the houses stand as islands with alleys between them: a back lane to the north (44..50), one to the south with the bay door on it (92..100), and a square with a round house in it. Past the market the street narrows through the blast doors' frame and bends north between two slanted fronts (L and O), so you never see straight down it, toward the comm tower. A sandtrooper patrol, villagers, Jawas, a probe droid over the market. |
| 2 | **The market** | 62..102, 58..82 | 0, sky | The street widens into a market: stalls with cloth awnings (shade you walk under), crates, baskets of fruit, a droid seller's pen, hanging cloth. The busiest place in town. |
| 13 | **Water plaza** | round, at (78, 70), r 9 | 0, sky | In the market: a moisture condenser tower (a tall 3D model, a landmark), a water seller and the queue at his tap, a dewback trough. |
| B | **Blast doors** | at x 104..106 | | Two Imperial blast doors across the street, open in the calm half: slid into slots in the walls either side, strips of dark steel easy to miss. The switch shuts them and splits the town in two. |
| 3 | **Chalmun's cantina** (detailed, 2026-10-30) | 87..126, 82..117 | -0.5 | Laid out after Mark's references (2026-10-30: a fan floor plan, film stills, the diorama; and his still of 2026-10-18: the bar a pale ring under a big oval opening in a low, heavy ceiling, lit from above, its taps and pipes behind it; arched alcoves round the walls; grey, dim and hazy). Its front is S, on the market's south side west of the blast doors, and its back door opens onto the back lane (19) east of them: one of the two ways round them when they shut. In by a tall round-topped arch cut 3 deep into S's front (90..94, 82..85, its top 4.75 up, after Mark's stills of 2026-10-30; sooty, a grimy arch as the alcoves' vaults are), its door in shade at the back: an entry turns east into the vestibule (the droid detector on its east wall, a red lens in a steel box; a "no droids" sign to come), so the street can't see the room, and two steps go down into the main room (88..110, 90..107). It's wide, its front corners cut at 45 degrees (two booths on each), with booth alcoves between buttress walls along both sides (two on the west, one on the east, each 3 wide and walled on three sides), a stage two steps up in an alcove on the east (the band), and two alcoves at the back (the broker's booth in one). The alcoves are vaulted (round-topped arches through their depth, in the walls' plaster, 3.5 over the floor; the grimy ones, `town.arch({ grimy })`: a smoky stain along each crown, streaks hanging from the lintel), each with a booth (`models/cantina.js`): a half ring of bench with a worn red seat round a table, a lamp on it lighting the alcove. One more booth stands on each cut corner. The bar is a long U (94..103, 95..106), a model (`models/cantina.js`): a pale counter with a steel top, its round end to the door, its east arm stopping short for the bartender, the taps' column inside it with its pipes up into the ceiling, stools round it. It's open at the back between two pillars into the back-bar (95..102, 107..110), shelves of bottles on its back wall either side of its door. Over the bar the heavy ceiling (4 up) opens into a shallow oval well (no sky: Mark, 2026-10-30), a canopy ring in the ceiling's planks round its edge and its top glowing, lit from above; a lamp in it lights the bar. The back-bar's door leads to a back room (93..115, 111..116: kegs, crates and canisters along its walls, a power unit in the far corner, a bare bulb or two) and a passage up two steps to the back door (126, 106). Its front corners are cut by flat panels of the wall (models: angled walls can't take a ceiling, so built of them they showed the sky). Dark: 104, a pool of light round the bar. S's front is plain, no windows, as in the stills: east of the arch a little lit sign up by its shoulder, a smaller door (shut) and a hitching ring; out front the white dome pod by the west corner, three Jawas against the wall (standing: no sheet has them sitting), and in the nook by the east corner a dewback at a stone trough and a drum (the two stalls that stood there went). Warm light over the stage. Filthy inside (Mark): soot, dirt, stains and smudges thick on every wall (`town.grimeIndoors()`), spills, burns, scuffs and dirt banked against the walls on the floor (`models/stains.js`), litter underfoot. Inside: Bossk drinking at the bar and Boba Fett watching from the east alcove (calm until the town turns, then they fight), two sandtroopers at the foot of the steps, three Jawas (two at the bar's east side, one by the east corner's booth), and villagers standing in for the bartender, the broker (in the west back alcove, with a stand-in message), customers and the band. To come: the band, the customers and the cantina's people as Mark's sheets arrive, the "no droids" sign, the back room's secret. |
| 14 | **Bay owner's office** (built) | 44..54, 101..106 | 0 | In the bay's building, east of its door: a red door off the lane and a window (open, at eye height) onto it. A cramped office with a terminal and crates, a desk, a tired owner ("Docking fees doubled. Imperials."), a power droid charging outside. |
| 16 | **Customs house** (built) | 11..22, 99..107 | 0 | West of the bay door, jutting a tile into the lane: a grey Imperial prefab (corrugated `metal-grey`, its roof at 5, below the bay's) dropped among the adobe, a door and a window onto the lane, impounded cargo inside: the customs officer and his troopers come out of it. A counter, a terminal, a holo-notice of wanted faces (not Rusk's yet). |
| 17 | **Docking Bay 86** (blocked out) | round, at (72, 113), r 14 | -5, sky | Next door, shut, at the end of the yard past R (73..87, 82..94): a passage 4 wide (73..77) through its building, and bars 4 high (`imp-bars`) across it at the edge of a landing over the pit. Through them you look down on customs troopers either side of a battered freighter (a stand-in hull for now, 64..80, 107..117), crates opened on the floor (to come). Atmosphere only; you can't get in. |
| 4 | **Jawa junk yard** (blocked out) | 56..84, 18..41 | -0.5, sky | North of the market, facing the cantina across it (moved from the far west, Mark's OK 2026-10-29). In from the market by the alley between H and I (71..73), through a gate and two steps down. Its north wall is low (2.5 over the yard), with the desert and the sandcrawler over it. Blocked out: a heap of scrap slanting across its west side (the fence goes along it with the detail), a stand-in post for the crane and a block for the furnace. Piles of droid parts and scrap behind a cage fence that runs on a slant across the yard, a crane, a scrap furnace glowing, Jawa traders and their droids for sale. The trader who sold Rusk the coupling. A side gate east into the back alleys (84..86, 37..40, two steps up to the yard behind J). |
| 15 | **The sandcrawler** | 62..98, 4..14 | out of reach | The Jawas' sandcrawler parked in the desert outside the town wall behind the junk yard: a huge 3D model (about 20 tall), seen from the market over I's low roof, so it points the way to the Jawas. A stand-in block 20 tall for now: from the market's south half its top shows over I. |
| 11 | **Dewback stable** | 20..54, 28..44 | 0 | Later, a side area. An open-fronted stable off the north back lane, behind A to D: stalls, hay and water, a dewback or two, the patrol's spare mounts. Dim and dusty, shafts of light through the slatted roof. |
| 12 | **Speeder garage** | J, 88..101, 47..58 | 0 | Later, a side area. J's garage door is on the market (built). Inside, a mechanic's garage: a landspeeder on blocks, a swoop on a hoist, tools, a pit droid. A back door into the alleys. |
| 7 | **Back alleys** (blocked out) | 86..146, 12..58 | 0 to 0.5, sky | Narrow (3-6 wide), dark (120-136), with laundry lines and awnings overhead. From the market between I and J (86..88) into a yard behind J (86..98, 36..47, the junk yard's side gate on its west), a lane slanting north-east between two slanted houses to a second yard a step up at 0.25 (112..126, 22..36, the spacers' hostel off its north side), a lane slanting south-east and up again to a square at 0.5 at their east end (136..146, 30..42, the thug's back room off its north side), and two steps of 0.25 down into the mouth by the checkpoint (136..139). They bend at slants, never two straight walls for long, with small yards. The informant's den near the east mouth, the thug's back room deeper in (the debt), a spacers' hostel (a flophouse with bunks), the shut gun shop (a secret: its back room). The quiet way past the blast doors, and an ambush when loud. |
| 19 | **The back lane** (blocked out) | 126..130, 73..118 | 0, sky | A narrow service lane behind the cantina, straight south off the street just west of the checkpoint, so the rubble at its end shows from its mouth. The cantina's back door about halfway (y 100). At its end rubble where a wall fell climbs in four jumps of 1 (0.75 to 3.75) onto the rooftops; crates come with the detail. |
| 5 | **Checkpoint** (blocked out) | 136..148, 61..73 | 0 to 0.5, sky | The street climbs two steps of 0.25 (139..141) to the old quarter's rise, to the old quarter's gatehouse, the town's own adobe arch across the street (145..148), its heavy door 4 wide (a docking bay's; tag `checkpoint`: the pass or the switch opens it, for good). The Imperials set up here but built nothing (Mark, 2026-10-30): barricades at a slant at the foot of the steps, floodlights, a guard post under a tarp (a terminal on a crate). Two troopers and a commander on the steps: "Old quarter's sealed, hunter." From the steps both ways round are in sight: the alleys' mouth to the north, and behind you the back lane. North of the street the informant's den, open to the alleys' mouth (136..139, 48..61), where the alleys come down two steps. When loud, the troopers hold the top of the steps. |
| 6 | **Rooftops** (blocked out) | 126..149, 86..118 | 4.75-5.75, sky | Four flat roofs east of the back lane's end: from the rubble onto the first (4.75), a running jump north over a light well 3 wide to the second (4.75), one east over another to the third (5.25), which drops into a yard in the old quarter (149..157, 86..96); a stair up the yard's side (to 4) climbs back, so the roofs work both ways. The fourth (5.75, a jump up from the first) is for the cache (secret: a better weapon). The wells' floors open onto the lane, so a fall walks back; the roofs stand more than a jump under everything round them, so they lead nowhere else. To come: a moisture tank, vaporators, washing on lines, a plank across a wider gap. A sniper when loud. |
| 8 | **Comm tower** (a stand-in) | at (180, 44) | out of reach | The town's landmark among the houses north of the old quarter, where the street's bend points: about 30 tall, a red beacon on top (a stand-in block 22 tall for now). The Imperial prefecture that stood here first is gone (Mark, 2026-10-30: Mos Eisley has no Imperial buildings). Rusk's wanted file ("Jundland Range security", the first hint of the garrison) is on the terminal at the checkpoint's guard post instead, and the loud half's reinforcements come in at the old quarter's north street. |
| 9 | **Old quarter** (blocked out) | 148..194, 53..104 | 0.5, sky | On a rise past the checkpoint (Mark's OK 2026-10-29). A square inside the gate (148..160, 60..76), a north street along the houses on its north side (53..60), and the main street, about 8 wide, slanting south-east from the square to the derelict bay's gate (its edges y = 64 + 1.2 (x - 160) and 12 further south); six houses follow the slant, their doors (to come) on their short straight faces. The yard the roofs drop into opens onto the main street by an alley (157..174, 88..92). Half-empty, sand drifting through broken walls, a collapsed dome, a few squatters and a hermit, a small shrine with candles. Quieter: wind instead of the market's noise. |
| 18 | **The dry wash** (blocked out) | 194..202, 53..116 | 0, sky | A flood channel two steps below the old quarter, along its east side from the houses north of it (a grated culvert, to come) south into the derelict bay (which is why the bay is half full of sand). Two steps go down into it at the north street's east end, and it breaks into the bay on the north-east, down sand steps. The low way to the bay and back, beside the main street, and a good place for a fight. (The main street runs nearly along it, so it crosses no bridge.) |
| 10 | **Derelict bay** (blocked out) | round, at (186, 128), r 18 | -5, sky | An abandoned docking bay half-buried in drifted sand, its rim at 7, its floor 5.5 below the old quarter (a pit like Bay 87): from its gate at the end of the slanting street a passage leads onto a landing at 0.5, and eleven steps of 0.5 go down (half-buried in drifts, to come). A rusty crane over the rim (a stand-in post for now, seen from the rooftops), a gutted freighter (a stand-in hull for now, 172..190, 130..139) with its hold open at the stern, scaffolding, scrap. Rusk is hiding in the hold. The flip happens here: troopers come in over the rim and through the gate. |
| 20 | **Town edges** | the outer wall | | Where streets end at the edge of town, a low wall with the Dune Sea beyond: dunes and the Jundland's mesas in the backdrop, fading into the haze. The view west from the main street's end, north past the sandcrawler, and from the rooftops. |

### Secrets (6)

1. The maintenance pit in Bay 87's floor: a shield unit.
2. The cantina's back room behind the storeroom: power cells and a piece of lore.
3. The rooftop cache: a better weapon (the E-11-style rifle, once it exists).
4. The gun shop's back room in the alleys: ammo and a thermal detonator.
5. In the culvert at the dry wash's north end, under the houses' wall: a med kit and energy.
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

**Off the grid, and up and down** (Mark, 2026-10-29). Look everywhere for
small chances to break the right angle and the flat street, so the town
doesn't feel rigid. Neither needs to be dramatic.

- **Angles:** buildings turned a little off the grid, streets and alleys
  that bend or run on a slant, a square that isn't square, a lane leaving
  the street at a slant (`slanted()`). A slanting side takes no door or
  window, so an off-angle building keeps a straight stretch for its door.
- **Heights:** parts of town a couple of steps up or down from the
  street: a quarter on higher ground, a lane dropping into a lower yard, a
  terrace over a square (`platform()`, `stair()`, or ground painted at its
  own `floorZ`). Small: Mos Eisley is flat (Mark, 2026-10-30), so a change
  of level is two steps of 0.25 (0.5 in all), never a flight; only the
  docking bays are pits. There are no slopes, so a change of level is
  steps, each under the 0.8 anyone walks up where monsters must follow.
- Check each area for both: somewhere you look along a slant, and
  somewhere you step up or down.

**What the film shows** (Mark's stills, 2026-10-18: A New Hope, The
Mandalorian, Outlaws, and the Special Edition's wide shots):

- **Plain walls, few openings.** Long runs of cream plaster, a door or two,
  a small window high up. Variety comes from the shapes and the shade,
  not from decoration.
- **Round-topped arches** are the town's mark. A deep hood that stands out
  from the wall, taller than the door it frames, its top a half circle; and
  round-topped openings into dark porches and niches. Doors themselves are
  the lattice doors with the tiled jamb, sign and panel (built).
- **Walls lean in** and are thicker at the foot; sloping buttresses and
  stairs run down a wall from the roof to the street.
- **The street isn't flat.** Knee-high walls round yards, raised
  platforms a few steps up, a kerb along a wall's foot, doors a step up.
- **Hitching rings** (big hoops) on the walls by doors; junk against the
  walls: perforated canisters, engine rings, old drums.
- **Hardly any awnings** on buildings. Awnings are the market's, the
  stalls' and the free-standing tents'. A building gets one only where it
  fronts the market.
- **Pipes, cables and junk:** the film has fewer than we do. Ours stay
  (Mark: he likes them).

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
  A low lintel makes a crawl gap. `round` rounds its top (Mark's stills,
  2026-10-18): models fill the corners under the lintel down to a half
  ellipse 1.5 tall (`arch-round-3`, `-4`, `models/arch.js`), one a tile
  through, so the lintel must be 3.3 or more up. B's, D's and K's porches.
- **Hoods** (`hood()`): the film's deep round-topped arch standing out
  from a wall round a door, taller than it (`arch-hood-3` and `-4`, 4.7 and
  5.2 tall, inside the wall's roofline; the door's sign and controls sit
  inside it). F, H and M have one. The faces flush with the wall are
  `flat` (MODDING.md, Models) and lit as the wall is (`lit`, set by
  `finish()` from the wall's tile and the street's), so a hood reads by
  the shade under its curve, not by a change of colour.
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
- **Low walls, kerbs and steps** (the film's street isn't flat):
  `lowWall()` is a yard wall of raised floor a tile thick, 0.9 tall: just
  over the 0.8 anyone walks up, so monsters go round by the gate, but low
  enough to jump. `kerb()` is a strip 0.375 high along a wall's foot, in
  its plaster or its skirt (A's in brick). `platform()` raises a paved box
  with steps down its sides, 0.25 apart (N is three steps up). A door
  with `floorZ` is a step up, its step outside raised to it, or on the
  kerb (C, H, Q). Clutter and grime keep off all three.
- **Buttresses and stairs** (the film's walls lean on them):
  `buttress()` is a pier of the wall's plaster hugging it (Mark: the
  first, long wedges, were too triangular): 0.9 deep at the foot, leaning
  in to 0.3, then a short cap back to the wall, 1.25 wide narrowing to 1.
  Heights 3.5 to 9.5 half a tile apart (`models/buttress.js`), so one ends
  half a tile under any roof. It collides as its footprint, so you can't
  climb it. F has three along its blank east wall onto the square, G one
  on its west. `stair()` is a flight of raised floor, a
  step a tile 0.5 apart, up to a landing: D's runs up its east side to a
  shut door 3.5 up. `from` starts it on ground above or below the street
  (the old quarter's 0.5, a bay's floor). A landing must be more than a jump (1.56) under the
  roofs beside it, or it's a way onto them (the rooftops are their own step).
- **Awnings** (`awning()`, on the market only, see above): a thin slab of cloth over the street is the
  shade you walk under and the cloth's underside you see; on it the cloth
  slopes up to the wall (0.3 a tile) in bays 2 tiles wide that sag between
  their ribs (models, `models/awning.js`), with poles under the front and
  a torn fringe along it. Five cloths, plain and ragged, bleached and
  patched, not striped (`red` a faded rust, `teal` the splash of colour,
  `sand`, `olive`, `umber` dark for contrast: generated,
  `tools/art/textures/awning.js`), 2 or 3 tiles deep,
  an even number wide, `face` the way the front looks. `valance` swaps the
  fixed fringe for a swaying one (a hanging, `valance-<cloth>`, or a
  `rag`), which lands in `town.hangings` for the level's `hangings`. The
  two in the first stretch (22 models) cost about 0.15 ms a frame.
- **Stalls** (`stall()`): a market stall is an awning that stands free
  (`awning({ wall: false })`: poles at all four corners, the bays' backs
  closed) over a box 4 or 6 wide and 3 deep, so its underside is the
  awning's slab, lit as shade (a model's roof seen from below
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
  street too. `amount` scales it; placed from a seed, each wall and tile
  from its own (mixed from where it is), so building elsewhere leaves the
  rest as it was; `keep` boxes stay clear for things put there by hand,
  and the rest comes out the same. Hand-place the
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
  its walls. Placed at random from a seed, the same every time, each wall
  and opening from its own (mixed from where it is), so building elsewhere
  leaves the rest as it was. Slanting
  fronts get it too; rounded corners and round walls get none.
- **Doors and windows** (`door()`, `window()`): a door is a recess a tile
  into a straight wall, 2 wide and 3 high (an arch), and follows the
  film's (Mark's reference, 2026-10-17): a rising door standing halfway
  through the recess (a lattice of braces in red-brown, `door-red-rising`,
  or grey, `door-grey-rising`, the panel sliding up into the wall over
  the opening), the jamb lined with pale tiles with rounded corners (the
  `door-jamb` model; its bevelled corners on the wall's face are
  `door-lips` in the wall's plaster and light, the bottom pair in its
  skirt, so the opening reads as rounded in the wall), the striped
  `door-sign` over the opening and the `door-panel` controls beside it
  (on the wall's face), and a flagstone step outside. Every door is a
  real one (Mark, 2026-10-18): most have nothing behind them and are
  locked (`lock: 'remote'`, the locked sound on use); `opens: true` opens
  into a `room()` behind the wall, the jamb showing on both faces (F, G,
  the customs house, the bay owner's office). Variants: the shops'
  roll-down `shutter-rising` (3 wide, 2.25 high, no jamb) and Docking Bay
  87's 4x4 `door-bay-rising` (DF's X-braced RDBIG4). A door at the back
  of a porch is set into the wall behind it (D, M). Windows are set in too (Mark: inset
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
| Stormtroopers, officers | customs house, the reinforcements | have |
| Probe droid | over the market | have |
| Bossk, Boba Fett | the cantina: hunters having a drink (calm) | have |
| Cantina customers: 4-6 kinds of alien | the cantina | **Mark** |
| The band | the cantina's bandstand | **Mark** |
| Bartender, broker, informant, thug | cantina, alleys | **Mark** |
| Customs officer, bay owner, water seller | bay, customs, plaza | **Mark** (the officer could be our officer recoloured) |
| Rusk (a scout trooper without his helmet) | the derelict bay | **Mark** |
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
| Derelict bay | the squad that takes Rusk (left), 2 troopers on the rim | | a trooper at the bay door | |
| Old quarter | the patrol that passed you | a probe droid | | |
| Rooftops | | a sniper | 2 snipers | |
| Checkpoint | its guards behind the barricades | a commander | | |
| Old quarter's north street | reinforcements coming in | | more | |
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
4. **The blockout** (Mark, 2026-10-29: level design before details): the
   rest of the town as plain volumes at their final heights, with the
   real ways between them and stand-ins for the landmarks, the east third
   first (the checkpoint, the rooftops and the back lane, the old quarter
   and the wash, the derelict bay: done 2026-10-29), then
   the middle (the cantina's shell, the alleys, the junk yard, Bay 86:
   done 2026-10-29).
   Both halves played end to end, with message triggers standing in for
   the story.
5. **Each area in detail**, in the order the blockout suggests: the
   cantina; Bay 86, the stable and the garage; the junk yard and the
   sandcrawler; the back alleys and the back lane; the checkpoint and the
   rooftops; the comm tower; the old quarter and the dry wash; the
   derelict bay.
6. **The skyline:** the backdrop, the town's edges.
7. **Life:** calm troopers and the town's switch, patrols, villagers,
   Jawas and aliens placed (story section 5's pieces as they're needed).
8. **Air and sound:** dust, emitters, ambient sound, the cantina band.
9. **The story:** conversations, the fob, the drop-off and pickup, the
   loud half's spawns, blast doors and per-skill fights.
10. **Tune:** light, frame time with a full market, the per-skill check.
