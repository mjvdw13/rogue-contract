# Plan: Rogue Contract

A Star Wars first-person shooter in the style of *Dark Forces* (LucasArts,
1995), for desktop browsers, on our own height-grid engine (forked from
Raccoon Alex). This file holds the decisions and the **open** work only.
Finished work goes in git history; the design notes of everything finished
up to 2026-10-17 are in [docs/plan-archive.md](docs/plan-archive.md).

How to use it: before starting a task, add its steps here (under the right
heading, or a new one) and tick them off as they land. When a whole item is
done, delete it, and record the reasoning in the commit message (and
MODDING.md, if content authors need it). Keep this file short.

## Decisions

| Question | Decision |
|---|---|
| Engine | **Height grid, our own** (2026-10-11, confirmed 2026-10-12). Tiles with their own floor and ceiling heights, rising doors, lifts, angled walls (one line per tile), two storeys per tile (slabs), see-through fences and 3D models for what the grid can't shape. Rejected: The Force Engine, GZDoom, Godot with TrenchBroom. No WebGL renderer (2026-10-15). |
| Platform | **Desktop browsers** (2026-10-12). No phone target: no phone performance gate, and no touch controls (removed 2026-10-17). |
| Scale | 1 tile = 0.5 m, 32 texels per tile; the player is 1.7 tall, eye at 1.25. |
| Resolution | **1x and 2x** (Mark, 2026-10-18): the 3D view at 320x200 or 640x400; the HUD and menus stay 320x200 pixel art, drawn as 2x2 blocks. Not 1.5x: the HUD's pixels come out unevenly 1 and 2 wide. |
| Story | **Bad Paper** (`docs/story.md`, 2026-10-13): a prequel to Dark Forces. Kyle Katarn takes a Guild bounty on Tatooine as cover for the Alliance; Jan Ors flies him in and out in the Moldy Crow. Only Mission 1 (Mos Eisley) is free roam; the rest is run-and-gun. |
| Scope | **A vertical slice first**, then decide on more missions. The slice is **Mission 1, Mos Eisley** (2026-10-17): the first level we make. The Canyon Garrison already built (`m3`) is the story's Mission 3. |
| Title and repo | **Rogue Contract**. Public repo `mjvdw13/rogue-contract`, served by GitHub Pages from `main`. "Star Wars" and "Dark Forces" stay out of the title. |
| Art, sound and rights | A non-commercial fan game. Mark's decisions (2026-10-12, 2026-10-15): ripped Dark Forces art and sound effects are committed in `assets/custom/` and used on the hosted site, through `overrides.json` and `sound-overrides.json`, with generated art and synth sounds as the fallback (and what tests and the smoke test use). Characters Mark makes with AI image tools are committed as our own art. Music stays original: no note-for-note John Williams. |

## Waiting on Mark

These need Mark to try something, or to decide. Don't start them without him.

- **Mos Eisley opens in stages** (`?map=m1`, 2026-10-31): when you land the
  blast doors are shut (a stand-in: a rising Imperial gate under a steel
  beam over the street), and so are plank gates across the alley between
  I and J and the junk yard's side gate. So the west end, the market, the
  cantina and the junk yard are all there is until the trader keys in
  the signal, which opens all three (the blast doors slowly, 2 s). The
  cantina's back door is locked until the switch, which shuts the blast
  doors again. To judge: whether the shut town reads as "not yet", the
  beam's look, and whether the alleys should open before the signal
  (they'd be side content then: the hostel, the thug, the gun shop).
  People now point the way (stand-in words): Jan on landing names the
  cantina, the broker the junk yard by the sandcrawler, the guard at the
  blast doors says they open when the garrison says so, the informant
  calls "Psst. Hunter. Want a pass?" at the checkpoint's foot, and at the
  switch Jan says the blast doors are sealed, then names the alleys and
  the cantina's back door at the checkpoint. To judge: the words, and
  whether that's enough without objectives.

- **Pushing past people** (`?map=m1`, 2026-10-31): walk into someone in the
  cantina (a villager, a Jawa, a trooper, Bossk) and keep walking. After
  0.3 s they give way, facing you and stepping back on their walk, slowed
  to the push, while you follow at their pace: 1.2 tiles a second, times
  100 / their mass (a Jawa 3, Bossk 0.8). Off-centre, they step aside and
  you slip by. Against a wall, the bar or someone else they stop, and you
  slide round them. They stay where you leave them (strollers walk back
  to their area). The first bump still says a line; a long push says no
  more. To judge: the speed (`body.pushSpeed` in `hero.js`), the delay
  (`body.pushDelay`), and whether pushing someone into a crowd should push
  the crowd too (today it stops at the next body).

- **Conversations** (`?map=m1`, 2026-10-31): press use on someone to talk;
  each use says the next line. The broker (in the cantina's west back
  alcove) gives the contract on Rusk in four lines and points you at the
  junk yard. The informant (in his den by the checkpoint) sends you away
  until the fob has the signal, then gives you the pass, which opens the
  checkpoint's gate (2026-10-30: the story in order). The lines are drafts
  from `docs/story.md`: the wording is yours. Bumping into someone repeats
  what they last said. You can talk from 3.5 tiles (doors stay at 2.6):
  the broker's table stops you 2.8 from him. To judge: whether use should
  move a conversation on this quickly (0.3 s between lines), and whether a
  line wants to stay up longer.

- **The tracking fob** (`?map=m1`, 2026-10-31, slot 8): the broker hands
  it over at the end of his lines, dark. The Jawa trader just inside the
  junk yard's gate has only "Utinni!" until you carry it; then he keys a
  code into it and it tracks Rusk, in the derelict bay's hold: an amber
  blink and a beep, every 1.4 s from across town down to 0.15 s up close,
  green when you face him. The hold's door, in the freighter's stern, is
  shut until then (2026-10-30), so the roofs can't find him first.
  Stepping into the hold takes the fob and turns the town. Until then your
  weapons stay holstered (2026-10-30), so the town can't turn early. The
  sprite is a generated stand-in (a dark puck in the gloved hand, the lens
  on top) held up right of centre; the beep is synthesized. To judge: the
  look, the beep, the blink's speeds and how wide "facing" is (15 degrees
  either side), and the trader's lines.

- **The cantina in detail** (`?map=m1`, 2026-10-30, after Mark's
  references; `models/cantina.js`). No skylight: over the bar the heavy
  ceiling opens into a shallow oval well whose top glows, a canopy ring
  in the ceiling's planks round it. The bar a pale U (a model) with a
  steel top and stools, the taps' column with its pipes up into the well,
  shelves of bottles either side of the back-bar's door. The booth niches
  are vaulted alcoves walled on three sides (short walls now close the
  ends that opened into the room), a booth in each and one on each cut
  corner: a half ring of red-seated bench, a table and a lamp. The cut
  corners are flat wall panels (no more sky along them). A hood round the
  street door, the droid detector in the vestibule, light over the stage,
  the back room stocked. The references weren't in this session (they
  aren't in the repo), so this follows the notes taken from them and the
  film; committing them (say `docs/references/`) would let later passes
  check against them. To judge: the well's size and glow, the booths'
  light, whether the walls should go grey, and the alcoves' changed shapes.
  Then (2026-10-30, after Mark's stills of the front): a tall arch cut
  into S's front with the door at its back, a smaller door, a hitching
  ring and a lit sign, no windows; the dome pod, three Jawas against the
  wall (standing: no sheet sits), a dewback at a trough and a drum out
  front, the two stalls there gone. Inside: Bossk and Boba Fett, two
  troopers at the steps, villagers standing in for the bartender, the
  broker (a conversation, below), customers and the band. To decide: Bossk
  and Boba Fett are calm monsters, so they fight when the town turns
  (Boba Fett has 200 health), which makes the cantina's way round the
  blast doors a hard fight; and whether a sitting pose for Jawas and
  customers is worth a sheet. Then filthy inside, floor and walls, and
  three Jawas at the bar and a booth (2026-10-30): how dirty. The alcoves'
  vaults are sooty too (Mark): their own grimy arches, a smoky stain along
  each crown and streaks hanging from the lintel at the mouth; the street
  door's arch as well. Then the entrance after a closer look at the two
  stills (2026-10-31): S's west end a block a tile taller cut back at 45
  degrees (the stills' near wall: from the market's west side, about
  85,77 looking 335, it's seen square with the pod in front and the arch
  front receding beside it, as in the stills); the arch beside that
  corner, taller (5.25); at its back an open doorway in a timber frame,
  dark, the sign over it inside the arch (orange, a red mark); the
  smaller door round-topped, of weathered planks, the Jawas in front of
  it; the ring on a round post in the corner by N; the dewback and trough
  along N's wall. To judge: how dark the doorway is, the corner block's
  height, and whether to add the film's oval vent on the roof over the
  arch.

- **Mos Eisley's east third, blocked out** (`?map=m1`, 2026-10-29; the
  areas in `docs/mission1.md`): plain volumes to try the route, no detail.
  Walk east past the blast doors: the street climbs two steps to the
  checkpoint's gate. Two ways past it: the informant's den, open to the
  alleys' mouth north of the street (the informant's pass opens the gate:
  use him), or the back lane to the rubble at its end, up onto the
  roofs, two running jumps and a drop into a yard in the old quarter.
  Then the slanting main street (or the dry wash, down steps at the north
  street's end) to the derelict bay; stepping into the stand-in hull's
  hold (Rusk) turns the town: the gate opens, troopers come over the
  bay's rim, in at the old quarter's north street and onto a roof. The stand-in ending: clear customs' two troopers in their office
  by Bay 87. To judge: the distances and the climb, the slant, whether
  the roofs read as a way over from the checkpoint, the derelict bay's
  depth. The comm tower stand-in (22 tall) is hidden from the market by
  K; the real one is a model and can stand taller. Also: grime and
  clutter now take a seed per wall, so building elsewhere no longer
  moves them, which re-rolled them all once (same look, other spots).

- **Mos Eisley's middle, blocked out** (`?map=m1`, 2026-10-29): the
  cantina, the junk yard, the alleys and Bay 86, as plain volumes. The
  cantina (relaid 2026-10-30 after Mark's references): in by S's door
  on the market, an entry that turns into the vestibule, two steps down
  into a wide room with its front corners cut at a slant, niches along
  the sides, a stage on the east; the U-shaped bar (now a model) under
  a well in the ceiling that glows, no sky (2026-10-30), open at the back
  into the back-bar, whose door leads
  through a back room and up two steps to the back door on the back
  lane, past the blast doors (go round the bar's east end, where the
  counter stops short). The junk yard: up the
  alley between H and I, through a gate and two steps down; a slanting
  heap of scrap, stand-ins for the crane and furnace, the sandcrawler
  (a block) over the low north wall. The alleys: up the alley between I
  and J (or through the junk yard's side gate) to a yard behind J, a
  slanting lane up to a second yard (the hostel's room off it), another
  up to a square at their east end (the thug's room off it),
  and two steps down to the mouth by the checkpoint. Bay 86: the yard
  past R ends at bars over the pit, customs troopers by a stand-in hull.
  Each way round the blast doors works on its own (checked with the
  street shut there). To judge: the cantina's size, the alleys' length
  and bends, whether the sandcrawler shows enough from the market.

- **Character sheets for Mos Eisley** (`docs/mission1.md`, Characters):
  cantina aliens (4-6 kinds), the band, the bartender, the broker, the
  informant, the thug, the customs officer, the bay owner, the water
  seller, Rusk, a dewback and a power droid. Until they exist, villagers
  stand in.
- **Mos Eisley's first look** (`?map=m1`, the west end of the main street,
  rebuilt with every building a volume: alleys, rounded corners, set-back
  storeys, a porch, a lean-to, a domed tower, a shop to walk into, and dome
  toppers on nearly every roof, sized to it):
  the sky and how dark the suns' shade is.
  Dust in the air: 90 soft `glint` specks round you, sinking slowly
  (`dust` was too hard to see, glowing motes too intense, then Mark
  halved the glints twice from 240 to 60). 90 is a trial of 50% more
  (2026-10-18): keep it or go back to 60? (`count` in m1.js).
  No suns painted on the sky (Mark, 2026-10-17). The textures are fine
  but a little monochrome: being worked on under Mission 1, "The look".

- **Hangings in Mos Eisley** (`?map=m1`): five cables (one high, from
  C's tower to F's upper storey), two ropes, a rag curtain over B's porch
  doorway, valances on the market stalls, a long banner on G's west wall and a
  sheet slung across the north back lane. The look (the generated
  `cloth-rag` and `cloth-pale`, their tears about 1 unit deep, so short
  cloths are mostly tatters), how fast and far they sway (`breeze`), and
  how many. 0.04 to 0.38 ms a frame at six views (headless, 320
  columns); the dearest is the lane's sheet up close.

- **Grime in Mos Eisley** (`?map=m1`): streaks off every straight
  roofline, dust above the walls' feet, stains and cracks, a drip under
  each window and smudges by the doors' controls (`town.grime()`, about
  0.2 ms a frame). How dark (the pictures' greys,
  `tools/art/textures/grime.js`) and how much (`town.grime({ amount })`,
  or a house's own `grime`). Rounded corners and round walls have none
  (the new slanting fronts past the market have it).

- **Awnings, tin, pipes and clutter in Mos Eisley** (`?map=m1`): cloth
  awnings on the market (I olive, and the stalls; off the houses since
  Mark's film stills, 2026-10-18), a
  tarp over a stall on the square, tin on C's lean-to and B's porch,
  downpipes, tanks, box units, conduits and vents on the walls, and the
  street clutter: crates, drums, pressure canisters, cargo pods, power
  units, junk and litter with droid domes, rubble, scrap and a vaporator
  (no jars or sacks: Mark, 2026-10-18), set along the walls by
  `town.clutter()` and by hand on the main street (a stall selling droid
  parts under the tarp). How they look, how much clutter (`amount`),
  whether the tarp and the valance sway too much, and whether more stalls
  should sway. The cloth redone (Mark, 2026-10-18: the stripes and
  scallops looked medieval): plain, muted and ragged, bleached in
  blotches, patched with scraps of other cloth, the hems torn to tatters;
  faded teal is the splash, and a dark `umber` for contrast (a
  stall). Whether the colours are right and the tears
  ragged enough. All the new models together cost 0.44 ms a frame on
  average over eight views, 0.75 at worst (headless, measured with the
  machine at about half its usual speed).

- **The landspeeder** (`?map=m1`, back on the main street in front of C,
  nose west, turned 15 degrees off the line of the street): the bob made
  subtler (Mark, 2026-10-18: 0.02 up and down every 3.2 s, was 0.05 every
  2.6) and the grime shadow, a third of the light under the hull. Whether
  the bob is right now, and the angle. About 0.7 ms a frame near it, 2.1
  standing over it (headless).

- **Docking Bay 87's floor** (`?map=m1`, round you at the start, Mark
  2026-10-18: more detail, big crates, hoses): crates 2 tall (above you)
  stacked two high on the west and south, a long rust crate, drums, and
  hoses from two pumps: one with its nozzle on the floor, one coiled.
  All round the edge, clear of the stairs, the pit and the Crow. Mark's
  first notes (2026-10-18) took out the hose into the Crow, the tool
  cart, the container and the repulsor pallet.
  The fuel pumps now wear DF's FuelStat panels (2026-10-20): whether the
  front's gauges, the hazard band and the dark rubber hose read right.

- **The Moldy Crow** (`?map=m1`, hovering in Docking Bay 87, nose east
  and turned 20 degrees south of it, in front of you at the start, a
  little south of the maintenance pit): its shape against the HWK-290
  views (the deep hull and raked bow, the fins, the wings angled down),
  its size (drawn at 0.8 of canon after Mark's first look: 23.2 long,
  18.9 across the wings), how it sits (2 off the floor, bobbing 0.04 over
  4 s, over soft shadows) and JK's textures on it (the cockpit windows
  high on the nose's flanks, the engines glowing cyan along the wings'
  trailing edges, the sponsons' and arms' fronts the grille and lights
  off the back's texture, no longer plain red; the pod's barrels
  thicker and longer after his second look, with collars and
  muzzles a little wider than the tubes, their bores black). Only
  its gun pod collides: you walk under the hull and wings, and shots at
  your height pass under them. Over the pit, the pod would block the way
  along it to the secret (the level checker isn't height-aware), hence
  the spot. 166 faces; about 1.5 ms a frame on average over eight views
  round the bay, 4 at worst (close up), the new barrels 0.15 and 0.8 of
  that (headless). Then it replaces the placeholder shuttle on
  m3's pad, and the drop-off flies it.

- **The main street east, the market and the water plaza** (`?map=m1`,
  2026-10-18): the street on to x 136 past the blast doors' frame (flush
  steel strips, easy to miss) and its bend; six stalls with their
  stallholders, the droid seller's pen, cables and cloth; the condenser
  tower (the landmark), the water seller and his queue under a teal tarp,
  the dewback trough. The cantina's front, the stable, the garage and the
  rooftops' first house are plain houses until their steps. The tower's
  look and height, the stalls, how full the market feels. Frame time
  (headless): the market adds about 1.2 ms a frame, the plaza 1.6 on
  average but 3 to 4 standing by the queue's tarp (not yet looked into:
  maybe drop the tarp or make it smaller).

- **Calm troopers and Jawas in Mos Eisley** (`?map=m1`, 2026-10-18,
  `things/calm.js`): most stand about. A commander and a trooper walk the
  main street side by side, from the west end to the blast doors and
  back; a second commander stands talking to a trooper in the market; a
  guard stands at the blast doors. Six Jawas: two haggling at the droid
  seller's pen, two standing by the street, one strolling the street and
  one the north back lane. Bump into one or press use to hear a line.
  Firing a blaster or hitting anyone turns the whole town at once (and
  since the east third's blockout, the `on: 'hostile'` trigger opens the
  checkpoint and brings stand-in troopers). After
  Mark's notes (2026-10-18): they stroll slower (troopers 1.2 tiles a
  second, Jawas 1.5), their legs keep pace (the new calm `stride`: 1.4
  tiles a walk cycle for a trooper, 0.9 for a Jawa), and they stand in
  the sheets' turnaround poses when stopped (the Jawa's has no side view,
  so side-on it shows the front turned a little). To check by eye: the leg speed, and
  the commanders' lines. Still open: the
  lines (the Jawaese is made up), and whether Jawas should run rather
  than fight when the town turns (the story has civilians run; Jawas are
  monsters, so they fight).

- **Real doors in Mos Eisley** (`?map=m1`, 2026-10-18): every door is a
  rising door; the ones with nothing behind are locked (the locked sound
  on use). The jambs' bevelled corners in the wall's plaster and skirt.
  The shops' shutters are doors too, D's porch is 4 wide so its door is
  centred, and Docking Bay 87's door is DF's X-braced cargo door, 4x4.
  Whether the bay door's grey is right, and whether any locked door
  should open into a room. The bay door now has a 4-wide round hood and a
  buttress either side of it (2026-10-20): whether it feels like Mos
  Eisley now (the hood hides the controls panel beside the door).

- **Round-topped arches in Mos Eisley** (`?map=m1`, after Mark's film
  stills): hoods standing out round F's, H's and M's doors (a half circle
  on two legs, 0.45 deep, taller than the door, its sign and controls
  inside), and B's, D's and K's porches rounded under their lintels. The
  hoods' fronts take the wall's light, so they read by the shade under the
  curve, as in the film; whether they want to be deeper or stand out more,
  and which other doors want one.

- **The dewback** (`?map=m1`, at the main street's north edge, at (44.5, 64.5)
  facing west, against blank wall between two doors; also in `?map=sandbox`):
  a decoration that stands about, solid, radius 1. Its size (2.1 tall to the
  saddle's horn, about 4.4 long), the colours (the palette's olive ramp makes
  the hide greyer than the sheet's green), the idle (the head up and the tail
  down three pixels, in three slices, with two in-between poses, and back
  every 4 s), and where it stands: it's only placed once so far, and the stable
  and the patrol want more. Place one with `at('dewback', x, y, { angle })`.

## Next up

In this order unless Mark says otherwise.

### 1. Mission 1: Mos Eisley

The story's Map A. The design (areas, light, the town kit, art and sound
lists) is `docs/mission1.md`. It pulls in the story pieces it needs from
section 5 as it goes (calm troopers, the town's switch, conversations, the
fob). Each step is a commit with snapshots, playable at `?map=m1`.

- [x] Design: `docs/mission1.md`.
- [x] **Daylight and the kit:** `sky-day` and a warm haze; DF textures
      recoloured; `lib/town.js`; a bigger glyph pool; `m1` with a first
      stretch of street (`?map=m1`).
- [ ] **The look** (Mark, 2026-10-17: get the first stretch right before
      new areas; it's a little monochrome, wants variation and detail such
      as doors). Snapshots before and after each step.
  - [x] Colour: more plasters (ochre, rose, grey) spread over the houses,
        a dirty skirt along every wall's foot (a band), sand drifts.
  - [x] Doors and windows, inset: doors after Mark's reference (a
        lattice door, a tiled jamb, a sign and controls) and windows in
        notches, cut from DF textures; `town.door()` and `town.window()`.
  - [ ] **Grime** (Mark, 2026-10-17: break up the plain plaster): decals
        that darken the wall under them instead of covering it, so one set
        fits every plaster and nothing repeats.
    - [x] Engine: `grime: true` decal textures (a texel's grey is the
          share of light it leaves), drawn as darker colormaps over what's
          there and fading out into the haze. Defs, validator, MODDING.md,
          tests; m3 and sandbox snapshots byte-identical.
    - [x] Art: generated grime decals: streaks, drips, blotches, smudges,
          cracks, dust above the skirt.
    - [x] Town kit: `town.grime()` weathers every straight wall under the
          sky (streaks from roof edges and under windows and signs,
          smudges by doors, cracks, blotches, dust), and a house's `grime`
          says how much (0 clean to 2 neglected). Frame time before and
          after.
    - [ ] Bare brick where the plaster has fallen: ordinary decals cut
          from `adobe-brick` with ragged edges.
    - [x] In Mos Eisley: snapshots, then Waiting on Mark.
  - [ ] **Docking Bay 87's fittings, textured** (Mark, 2026-10-20, the
        look guideline in CLAUDE.md): one object at a time from the DF
        pack, a commit and a check-in with Mark after each. Everything
        should look broken-down and dirty (Mark, 2026-10-20): rusty pipes,
        rust and soot on the panels (`WORN` in derive.mjs), dead lamps.
        Skipped as too far or too small to see (Mark, 2026-10-20): the
        rim lamps, the ribs' iron band and cap.
    - [x] Fuel pump (FuelStat's gauge panel, hazard band, louvres, ribbed
          hose on the reel).
    - [x] Fuel line: chrome pipes, FuelStat's brass elbow and gauge on
          the manifold, a valve wheel.
    - [x] The two hoses: ribbed rubber, orange and black, nozzle capped.
    - [x] Big crates' iron straps: skipped (Mark, 2026-10-21).
    - [x] The astromech dome (`models/clutter.js`, in the droid seller's
          pen and on the street: white paint, blue panels, scorched).
    - [x] The cargo pod (`models/clutter.js`, shared with the town):
          scorched tin, plate ends, rusty hoops, rubber skids.
    - [x] Barrels and canisters: soot blotched over their tin bodies
          (`drum-rust`, `drum-grey`), not their hoops and lids.
  - [ ] Waiting on Mark.
  - [ ] **The market's fittings, textured** (Mark, 2026-10-21): the same
        way, one object at a time, a commit and a check-in after each.
    - [x] Market stall (`models/market.js`): crates for wares, textured
          power cells, worn plate on the counter and rack tops, a rubber
          plinth.
    - [x] The condenser tower: plates, rings, collar, cap, pipes, tap,
          in the bay's worn plate, rusty pipe and valve wheel.
    - [x] The dewback trough: large stones like the tower's plinth, murky
          water (the tap's basin too).
    - [ ] The droid seller's power unit, scrap and junk heap (check what
          is still flat).
- [ ] **An X-34 landspeeder on the main street** (Mark, 2026-10-18, after
      his schematic and the weathered prop): a model, hovering, textured
      like the town.
  - [x] Textures: peach and rose paint and rusty engine metal from DF's
        IWGREYC2, the engines' intakes from IWENGBAC (derive.mjs); glass
        glints and a dithered shadow, generated.
  - [x] The model (`models/speeder.js`): the hull, the open cockpit with
        its seats and windscreen, the side intakes, three engines on
        their pylons. Collision lines; under the face budget.
  - [x] Parked on the main street; snapshots.
  - [ ] Waiting on Mark.
- [ ] **Buildings after the film** (Mark's stills, 2026-10-18; the shapes
      are in `docs/mission1.md`, "What the film shows"). A step at a time,
      checking in with Mark after each.
  - [x] Notes; awnings off the houses (I's on the market stays).
  - [x] Round-topped arches: a hood standing out round a door, and
        rounded openings on porches.
  - [x] Low walls, kerbs and steps: E's yard, kerbs on A and Q, N up
        three steps, doors a step up on C, H and Q.
  - [x] Sloping buttresses and a stair up a house's side: F and G,
        a stair up D's east side to a door on a landing.
  - [ ] Hitching rings on walls (the model is made, `models/ring.js`: one
        by the cantina's door so far); perforated canisters and engine
        rings in the clutter.
- [ ] **Block out the whole town first** (Mark, 2026-10-29: level design
      before details). Every area as plain volumes at their final
      heights, with the real ways between them and stand-ins for the
      landmarks; no clutter, grime, hangings or textured fittings. Each
      area gets a slant and a change of level (`docs/mission1.md`, "Off
      the grid, and up and down"). Message triggers stand in for the
      story until conversations and the fob exist.
  - [x] Paper pass: the map and area table in `docs/mission1.md` fitted
        to what's built, and the open questions answered there: where the
        junk yard goes, the two ways round the blast doors, the way past
        the checkpoint, the landmarks.
  - [x] The east third: the checkpoint, the rooftops, the old quarter
        and the dry wash, the derelict bay, the comm tower.
  - [x] The middle: the cantina's shell (its back door on the back lane,
        built with the rooftops), the alleys (on to the mouth by the
        checkpoint), the junk yard, Bay 86 to look into.
  - [ ] Play both halves (rough troopers for the loud half), then
        Waiting on Mark.
- [ ] **Guiding the player** (Mark, 2026-10-31): the town opens in stages,
      so the open part always holds the next stop, and people say where
      to go. Landing to the trader: the west end, the market, the cantina
      and the junk yard. The signal opens the east. The switch shuts the
      blast doors and opens the ways round them.
  - [x] Gates: the blast doors shut until the trader keys in the signal,
        and again at the switch (a steel beam over the street for now:
        the doors rise into it); the alley between I and J and the junk
        yard's side gate shut until the signal; the cantina's back door
        locked until the switch.
  - [x] Lines that point: Jan on landing (the cantina), the broker (the
        junk yard, by the sandcrawler), the guard at the blast doors (shut
        until the garrison says), the informant calling Kyle over at the
        checkpoint's foot, Jan at the switch and again at the checkpoint
        (the ways round).
  - [ ] Objectives, if Mark wants them: an `objective` action, its line
        shown when it changes and at the top of the automap.
- [ ] **Then each area in detail**, in the order the blockout suggests:
  - [ ] The cantina: entrance, steps down, the main room, the bar,
        booths, bandstand, back rooms. In detail after Mark's references
        (2026-10-30; no skylight, Mark), a step at a time:
    - [x] The ceiling closed: no opening to the sky and no drum. Over the
          bar a shallow oval well whose top glows, a canopy ring in the
          ceiling's planks round its edge hiding the tiles' steps.
    - [x] The bar, the taps and stools as models (`models/cantina.js`):
          the pale U, round at the door's end, its east arm short; the
          taps' column with pipes up into the well; the back-bar's shelves
          of bottles. No angled walls under the ceiling, so no sky along
          the bar.
    - [x] The cut front corners as flat wall panels (models lit as the
          walls) over square tiles, so their slits of sky go.
    - [x] Booths: round-topped arches over the niches, benches and round
          tables in them and along the cut corners, a lamp at each table.
    - [x] The way in: a hood round the street door, the vestibule's droid
          detector and a bulb over the steps. Warm light over the stage;
          the back room and storeroom stocked, a bulb in each. The walls
          stay pale plaster (the back building's outside is the same
          texture; dim, it reads grey): pools of light under the lamps.
    - [x] The entrance after Mark's stills (2026-10-30): a tall arch cut
          into S's front, its door in shade at the back; a smaller door
          beside it, a hitching ring, a glowing sign; no windows or hood.
          Out front the dome pod, Jawas against the wall, a dewback at a
          stone trough and a drum (the two stalls there go).
    - [x] Characters: Bossk at the bar, Boba Fett in the east alcove;
          villagers standing in for the bartender, the broker (a stand-in
          message), customers and the band; two calm troopers by the steps.
    - [x] The rounded arches lit as the walls round them (Mark,
          2026-10-30: they didn't match, in and out of the cantina).
    - [x] Filthy inside (Mark): grime thick on the walls and the floor,
          litter underfoot.
    - [x] Jawas inside.
    - [x] The secret back room behind the storeroom (docs/mission1.md,
          Secrets 2): a secret door in the plaster of the storeroom's
          north wall, half behind its crates, into a smuggler's hidey-hole:
          power cells, a stash, a dim bulb, and a ledger on a crate (lore).
    - [x] The entrance looked at closer (Mark, 2026-10-31, the two stills
          of the front): S's west end a taller block cut back at 45
          degrees (the stills' near wall, seen square), the arch beside it
          at the corner, taller; its door an open dark doorway in a timber
          frame, the lit sign over it inside the arch (not up on the
          front); the smaller door round-topped, of planks; the ring on a
          round post at the front's east end; the trough and dewback in
          the nook, the pod by the cut corner, the dome back.
    - [ ] Waiting on Mark.
  - [ ] Bay 86, the dewback stable and the speeder garage.
  - [ ] The Jawa junk yard and the sandcrawler.
  - [ ] The back alleys and the back lane.
  - [ ] The checkpoint and the rooftops.
  - [ ] The comm tower.
  - [ ] The old quarter and the dry wash.
  - [ ] The derelict bay and the gutted freighter.
  - [ ] The skyline: dunes and mesas in the backdrop, the town's edges.
- [ ] **Life:** the cantina's customers, the customs officer, the
      dewback with the patrol; the blast doors shutting and the music at
      the switch (the `on: 'hostile'` trigger opens the gates and brings
      stand-in reinforcements). Calm troopers and Jawas are placed.
- [ ] **Air and sound:** dust, emitters, ambient sound, the cantina band
      (sections 2 and 3).
- [ ] **The story:** the drop-off and pickup and the loud half (section
      5), in place of the blockout's last stand-ins: Rusk's hold (a door
      that opens with the signal; stepping in takes the fob and turns the
      town), and clearing customs as the pickup. Conversations and the fob
      are in.
- [ ] **Tune:** light, frame time with a full market, the per-skill table.

### 2. Hangings: cables and cloth that sway (Mark, 2026-10-17)

Cables strung between buildings, and ropes and ragged cloth hanging from
them, swaying gently in the air: life for Mos Eisley (the market's hanging
cloth, the alleys' laundry lines). Cosmetic, like particles: they never
touch gameplay, keep their own clock and never use `world.rng`. Budget:
the whole town's under 0.5 ms a frame, simulation and drawing together.

- **Simulation** (`world/hangings.js`): points in typed arrays (position,
  last position, pinned), links as index pairs with rest lengths (a
  cloth's run across each cell too, so it holds together as a sheet).
  Verlet: gravity, drag toward the air, `stiffness` passes over the links
  (forward then back), then tethers: each free point is never further
  from its pins than it was at rest (both ends of a strung cable: onto the
  circle where the two spheres meet), so long chains don't stretch and a
  cable keeps its sag. The air is the level's wind (times the type's
  `wind`) plus a breeze of slow waves travelling down the street. Each
  hanging steps every other tick (30 a second, half on even ticks and half
  on odd). Hangings more than 40 tiles from the camera hold still; all
  settle at load (2 s of steps).
- **Drawing** (`render/hangings.js`, and the model drawer for cloth): a
  rope segment is one span of rows per screen column, at least 1 px
  thick, clipped like particles and writing `mdepth`. A cloth is a model
  of one two-sided quad a cell, shaded by its slope, textured at 32
  texels a tile with the texture's bottom row on its hem (Mark,
  2026-10-17: the tears are transparent texels in the texture, not cut
  from the shape). `cloth-rag` and `cloth-pale` are generated
  (`tools/art/textures/cloth.js`).
- **Content:** `defineHanging` (MODDING.md, Hangings); level `hangings`.

Bench (Chromium, the Mos Eisley start, 504 columns, best of 6 batches of
60 frames, `renderer.hangingMs`, frames about 9.3 ms). Cables run right
across the street, cloths are 1 x 1 m and textured:

| count | cables, draw | cables, move | cloths, draw | cloths, move |
|-------|--------------|--------------|--------------|--------------|
| 10    | 0.12         | 0.02         | 0.32         | 0.03         |
| 20    | 0.21         | 0.03         | 0.45         | 0.05         |
| 40    | 0.44         | 0.06         | 0.79         | 0.12         |
| 80    | 0.89         | 0.13         | 1.32         | 0.22         |

So about 10 cables and 10 cloths in view at once is the budget (0.48 ms).
Found on
the way: the model drawer's per-pixel walk of the ledge windows was its
hottest line in Mos Eisley (now a binary search per column: models there
21% faster, byte-identical). The cap is 4096 points a level.

Steps:

- [x] First cuts of the simulation and drawing, and the bench.
- [x] The content and level fields: defs, validator, MODDING.md, tests.
- [x] In Mos Eisley: cables across the street, a few rags and a banner.
- [ ] Explosions push the hangings near them (a blast flaps the cloth).

### 3. Particles into the game (from the particle system, 2026-10-15)

The explosion styles (`src/content/explosions.js`) are only used by the
detonator (`large`) and the concussion rifle (`concussion`).

- [ ] The probe droid's death and the fuel barrel: a particle explosion
      instead of the `explosion` sprite (no sprite: Mark's decision).
- [ ] Rockets (Boba Fett): `small` where they burst, and a smoke trail.
- [ ] Sparks where blaster bolts hit walls (`bolt-spark`; `ion-spark` for the
      Jawa's ion bolts).
- [ ] **Emitters** in levels: steam vent, sparking panel, fire with embers
      and a light, reactor motes; tags, `setEmitter`, a distance cut-off.
      Validator, map viewer marks, MODDING.md. Then in Mission 3: the
      maintenance valve and broken light, the generator.
- [ ] **Weather:** sand and wind in the canyon (a wrapping box of particles
      round the camera, only under the sky). For Mos Eisley later: `dust` at
      about 100 (Mark: "perfect for sunny Mos Eisley").
      - [x] Level `weather: { type, count, range, z, drift, wind }`
            (world/weather.js): defs, validator, MODDING.md, tests; the
            snapshot tool fills it round the camera.
      - [x] Mos Eisley: `dust`, as thick in view as the bench's 100.
      - [ ] The canyon: sand on the wind, with gusts.
- [ ] Bench again with everything on (does the budget hold?).

### 4. Mission 3 (the Canyon Garrison): detail and immersion

Engine pieces still to build, each proven in the level as it lands:

- [ ] **Ambient sound:** looping positional sounds (muffled without line of
      sight) and occasional one-shots. DF has WIND1, MACHINE1/2, RUMBLE1,
      ELECTRIC in `assets/custom/sounds/`.
- [ ] **Scrolling textures:** `scroll: [u, v]` per texture (the reactor core,
      screens, the pad's guide lights).
- [ ] **Translucent sprites and fences** (the blend tables exist, from the
      particles): glass, shafts of light, holograms, force fields.
- [ ] **Models in pathfinding and sight:** solid models block the flow field
      and monster sight (low ones only below their top). Today a monster
      walks into a tank and stalls, and sees and shoots through it.
- [ ] Stretch: mipmaps for distant floors and walls (grates and rock shimmer).

Areas, each with screenshots before and after:

- [ ] **The canyon:** wind and blowing dust (with the emitters, weather and
      ambient sound above).
- [ ] **The garrison's face:** a base wall with the cliff above (bands), a
      concrete overhang over the gate strip with lights under it (a slab), the
      gate in a deep frame with hazard stripes, the vent mouth as a grilled
      duct, a lit control window above the gate.
- [ ] **The vent and maintenance:** shafts of light through the vent's grate,
      a fan, pipes along walls and ceiling, machinery, a workbench, steam from
      a valve, the broken light sparking, hum.
- [ ] **The barracks:** pilasters, ceiling beams, recessed light panels, signs
      and the crest; bunks and lockers; a desk and a holotable with a
      translucent hologram in the office.
- [ ] **The data vault:** rows of blinking server racks (models), a raised
      dais with the terminal, floor light strips, cold mist, server hum.
- [ ] **The generator** (the showpiece): the column in bands with a glowing,
      scrolling core and light rings, conduits, struts under the catwalks,
      hanging lamps, steam and sparks, a deep hum. The overload: a klaxon, red
      strobes, the lamps die, bursts of sparks and steam.
- [ ] **The way out:** a deep chasm, the gantry with a floodlight, the pad
      open to a view east down the canyon, landing lights, the **Moldy Crow**
      model in place of the placeholder shuttle.
- [ ] **Tune and check:** light and sound mix, frame time, cover round the new
      props, the per-skill check; `docs/mission3.md`.

### 5. Dark Forces systems

- [ ] A mission briefing screen (scrolling text over a picture).
- [ ] Mission objectives; the exit only works once they're done.
- [ ] A PDA screen with the map and the objectives.
- [ ] Lives and checkpoints instead of saves, extra-life pickups, lives on
      the HUD.
- [ ] **Smarter enemies around heights:** a monster with no walking route to
      the player holds still and shoots when it can see them (today it walks
      at them and stalls against the ledge); a sniper holds its ledge instead
      of pacing its edge; monsters ride lifts on purpose.
- [ ] A headlamp that drains batteries, infrared goggles and a gas mask.
- [ ] Music that switches between exploration and combat (like iMUSE).

### 6. For the story (`docs/story.md`)

Small or medium pieces, mostly extending existing code. Each new action or
trigger goes in the validator (it rejects unknown actions), MODDING.md and a
test. Order: the Crow pieces, then calm troopers and the switch, then
conversations, then the fob.

- [ ] **`fly` action:** moves a model decoration along timed keyframes (x, y,
      z, facing, seconds).
- [ ] **`cutscene` action:** the view from a tagged spot looking at a target
      for a few seconds, HUD and weapon hidden, input locked; use or fire
      skips. An override of `world.camera()`.
- [ ] **`wait` in trigger lists:** a trigger's actions can pause.
- [ ] **`remove` and `place` actions.**
- [ ] **`damage { tag, amount }` action** (the overload hurts the prototype).
- [ ] Nice to have: villagers who see a shooting
      running too (only the one hit runs today), factions (Tuskens
      against troopers).
- [ ] Fixes that go with these: the level checker skips models placed high or
      flying (the Crow); `spawn` stays quiet with `fog: false`; the headless
      play test skips opening cutscenes.

### 7. Content for the slice

- [ ] Enemies still missing: a commando, and the mini-boss (a prototype
      assault droid, an early Dark Trooper test).
- [ ] An E-11-style rifle.
- [ ] Items still missing: batteries (for the headlamp), the objective item
      (a data tape).
- [ ] The finale has its own picture (it reuses the title and intermission
      ones).

### 8. 2x resolution (Mark, 2026-10-18)

The 3D view drawn at 640x400 (twice 320x200 each way), the HUD and menus
as 2x2 blocks. It's in, behind `?res=2` (and `snapshot.mjs --res 2`); 1x
renders byte-identical to before. It costs 2.3 to 2.8 times the render
time (headless: Mos Eisley 18 to 45 ms, m3 12 to 28, sandbox 6.5 to 18).
Time 1x before and after a change here in one process, alternating
blocks of frames: separate runs on this machine drift by up to 20%.

- [ ] A setting in the options menu (1x or 2x, saved with the others),
      switching without a reload: rebuild the surface, the renderer's
      view, the presenter's buffers and the melt.
- [ ] Frame time in Chromium at 1x and 2x (Mos Eisley, m3, widescreen
      and 4:3) for the record; then Waiting on Mark: the look (sparks
      and ropes can be 1 pixel thin at 2x, the dithering is finer), and
      whether the menu should warn that 2x needs a fast machine.

## Small fixes and known rough edges

- [ ] A second `Registry` built from the same content pack finds no sprite
      sheets: the first replaces each def's inline `sheet` with a `{ ref }` in
      the shared objects. Only tools building two registries hit it; copy the
      defs instead of changing them.
- [ ] Long views over Mos Eisley fill a column's 48 windows (`view.SEG`),
      and things further off are then clipped by stale ones: a few hundred
      pixels a view differ from a renderer with room for all of them,
      mostly far models showing a pixel or two through nearer walls.
- [ ] Angled-wall tiles count as fully open for reachability, so a gap
      squeezed between two angled walls isn't checked.
- [ ] A walker chasing the player round the small rock in the sandbox's
      courtyard (diagonal tiles at 34-35, 28-29) stops against its east face
      and walks on the spot.
- [ ] The model builder restarts a cylinder's texture on each face; wrap it
      round.
- [ ] A low angled wall (`wallTop`) still stops bodies, shots and sight
      above its top, and its top isn't drawn as a surface (seen from above,
      it shows wall). Fine out of reach; needed before walkable round roofs.
- [ ] The generated Jawa's robe has stray pixels that snap to a glow colour
      (fix the generator's colour).

## Ideas, not planned

Kept so they aren't lost; none is scheduled.

- Two-sided angled lines (a diagonal ledge between two floor heights).
- Doors and lifts inside slab tiles, more than two storeys, slabs that stop
  sound, triggers for one storey only.
- Walkable model surfaces (a bridge you can cross or walk under).
- See-through rising gates, force fields that block or hurt, fences in the
  middle of a tile or at an angle.
- Particles: a sound per burst, blood as particles, rain, scorch decals.
- Glints: stronger when the source is on the viewer's side, shiny model
  faces, glints on the sandtrooper.
- `tools/import-texture.mjs` for outside art (resize, snap to the palette,
  check the tiling).
- Recorded music (a composer or orchestral samples).
