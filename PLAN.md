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

- **The TIE rebuilt from Mark's schematic** (`?map=m4`, 2026-11-13). Canon
  proportions at 0.8: wings 11.4 long and 14 tall (were 8 by 10), the ball
  4 across, its top now 14.4. Grey frame and spokes over plain black panels  (Mark: no lines), the hub through the wing, the angled pylons, a framed window
  with a glass middle pane, red cannon mouths and back lamps. The racks,
  fuel hoses and welding stand (its deck now 5.4 up) moved to fit. To judge:
  the size in the hangar.
- **The hangar without the shuttle** (`?map=m4`, 2026-11-13): large cargo in
  its place and round the deck, containers two high with crates on top, as
  cover for the last fight. To judge: enough, too much, where.

- **Mission 1 as a chain** (`?map=m1`, 2026-11-13; `docs/mission1.md`, "A
  chain through an open town"). After Mark's first play of it: the fob's
  few stops and the cantina on the way back kept; the junk yard, the
  sandcrawler, the back alleys and their streets open again (from the
  start, off the way: the trader is just a Jawa now); the hangar's direct
  way up the square kept; Rusk takes the fob again, and the HUD pip is
  gone. The way to the back lane from the shut blast doors: the cantina's
  sign over the lane's gate, a floodlight tower on its corner that shows
  down the street from the blast doors, two troopers posted at the gate
  after the switch, and Jan naming the lane in front of the blast doors
  and at the checkpoint. The alleys' mouth by the checkpoint shuts at the
  switch, so the cantina stays the only way round (a test checks it).
  After Mark's next note (the back door still hard to find): the back door
  is now on the lane's west side 4 tiles past the gate, and the lane ends
  in a house's blank end just after it (the light well, the yard and the
  storehouse out of play; the empties and the spare cells moved to the
  lane's end). Inside, a straight service corridor 2 wide and 25 long, a
  bulb at each end, runs south to the old passage up from the back room.
  To judge: whether the lane is easy enough to find now, the tower and
  sign (too much, too little), the guards, Jan's lines, and whether the
  corridor is too long (the cantina's back room is 25 tiles south).

- **The rest of Dark Forces' weapons** (`?map=sandbox&god`, 2026-11-11):
  all in the sandbox's start room, in a row east of you (3 rifle, 5
  repeater, 6 fusion cutter, 7 mines, 8 mortar, 0 assault cannon), primary
  fire only, with DF's own ammo. Numbers from The Force Engine's data,
  scaled as the pistol and detonator are; the art is DF's, placed where DF
  drew it. To judge: how each one feels and sounds (rate, damage, spread);
  the mine's blast (210 over 6 tiles) and the mortar's (115 over 5) and
  its range (about 12 tiles, further looking up); the assault cannon
  hiding the right third of the view, as DF's did; the two stand-in
  sprites (the repeater's amber bolt and the cannon's blue ball: DF's
  aren't in the rips). Stormtroopers now drop their rifle every time (15
  energy once you have one), so the missions have more energy. The
  concussion rifle is on power cells now, with 30 from its pickup and two
  cells beside it in Missions 3 and 4: enough? No mission has the new
  weapons or power, plasma, shells or mines yet: where should they go?
  Volumes of the new sounds were guessed (1.0, or the rifle's 0.87).

- **Mission 2's garden pit and pump tunnels, dressed** (`?map=m2`,
  2026-11-11, the first of "Each area in detail"): the garden indoors
  (Mark: no pour, the hydroponics inside), a grow room 8 m by 4 m through
  a new round-topped doorway in the garden pit's south side, four beds in
  two rows down either side of the way in, plants under lamp frames whose
  strips glow a cold blue-white, lit only by them. The garden's tank stays
  in the pit by the east arch, the water pipe coming down the wall into
  it. You start at (24, 46), facing the arch. The hidey-hole: scuffs on the tunnel
  floor and a grubby patch by its panel, Rusk's bedroll, eleven groups of
  days scratched over it (`grime-tally`), a crate, a canister, ration
  wrappers, and the doc's line as you step in. The pump room: the pump's
  power unit, spare filter cartridges on the west wall, a bench on the
  south wall, oil, scrap, and two filter tanks fed from the ceiling
  between the light well and the stair (cover). To judge: the plants'
  green and the lamps' colour, the grow room's size and darkness, the tally,
  and whether the start is a good first look.

- **Mission 2's reservoir, dressed** (`?map=m2`, 2026-11-11): the five
  pillars round now (duracrete models standing in the pool, a plinth, a
  rusty band where the water once stood, a flared capital under the
  vault), a damp line along the walls' foot, the walkway's lip in rusty
  steel. Iron grates across the light wells' feet, sand trickling through
  into the shafts and dust catching the light.
  The Imperials' two work lamps on tripods (Mission 4's), aimed into the
  pool, cabled along the walkway to a power unit at the west end; crates
  and a cable reel by the east stair. The water pipe's middle joint leaks,
  dripping onto the walkway (`drip`). To judge: the pillars' size and
  colour (they read dark red-brown in the haze), whether the lamps want a
  visible beam, and whether the darkness is right now.

- **Mission 2's workshop pit and workshop, dressed** (`?map=m2`,
  2026-11-11; up the reservoir's east stair): the cave-in is a slope of
  earth and rock to the ceiling now, slabs of the vault's plaster on it,
  the steel prop snapped at its foot and its top thrown up the slope, a
  beam hanging out of the hole, sand trickling down, cracks along the
  tunnel's walls; the water pipe runs into it. In the pit, the family's
  X-34 stripped, on blocks and burnt (a new `flame` particle, embers and
  dark smoke, a flickering light), oil round it, scrap, a junk heap, a
  droid dome, drums, crates and a dead power droid round the wall, two
  scorch marks behind the speeder. In the workshop, the droid bench and
  its tool board on the north wall under a hanging lamp, a pit droid at
  an astromech half taken apart (its dome on the floor), a vaporator's
  lower stage in for repair with its cap off, a rack of parts, scrap. The
  shed's stair: soot down its walls, a crate on the landing. To judge:
  the flames (size, how many), whether the burnt hull reads as burnt (it's
  rusty grey plate), the scorch marks (they read as round blast marks, not
  soot), and whether the workshop wants more in it (it's 9 m by 7 m).
  The well room (the secret) is as it was.

- **Mission 2's work yard, dressed** (`?map=m2`, 2026-11-11; up the
  shed's stair from the workshop): in the generator shed, the farm's
  generator (a new model: a drum on a skid with cooling rings, gauges at
  its east end, one lamp dead, its stack up into the roof), a rusty
  railing along the stair's open side so the way down is at its north
  end, fuel drums, the fuse box and conduit; outside, the tin patched and
  streaked, soot over the door. The gate is the farm's own X-braced gate
  now, with the Imperials' red lock (a dark box, a red stripe and lamp,
  its cable to the gate) clamped on the wall beside it. After Mark's note
  (2026-11-11) the gate opens from the lock, not the gate itself: use the
  lock with the officer's key and the gate rises and stays up (without
  the key the lock says it wants it; the gate just sounds locked). At the staging point, a comm unit on a crate, the
  floodlight cabled to its power unit, a cargo pod; more pods along the
  yard's walls and a dead power droid by the shed. The light wells' kerbs
  are whitewashed with a flagstone coping. To judge: whether the lock
  reads as clamped on (it's on the wall, not the gate), its two lines, the generator's
  size, and whether the yard wants more. The shed isn't burning yet:
  that's in "Fire and smoke".

- **Mission 2's lane and great dome, dressed** (`?map=m2`, 2026-11-11;
  through the gate): a third barricade across the lane with crates behind
  it, blaster scorches along both walls, a cargo pod shoved aside, litter.
  At the porch, an amber lamp either side of the hood (the south one shot
  out), soot by the opening, sand and rubble down the steps; the house's
  door blown in and lying on the hall's floor. In the hall, a lamp hung
  under the dome, the family's astromech shut down in a corner, crates
  and a canister knocked about, boot scuffs. To judge: the fallen door
  (the door's picture on planks), whether the hall wants more (furniture
  for an entrance hall), and the lamps.

- **Mission 4's last fight** (`?map=m4`, 2026-11-13, after Mark's note
  that the return to the hangar was anti-climactic): switching the beam
  off sends the garrison into the bay to wait for Kyle, troopers and
  officers in an arc round the Crow facing the gantry (10 on skill 1 up
  to 21 on 4-5, plus the troop bay's squad); the klaxon and Jan's warning
  as you step out onto the gantry; detonators, an energy pack and med kits
  for it. The `spawn` action learned `wake: false`, `angle` and `skill`.
  To judge: the size of it on each skill, where they stand, and whether
  the Crow should only take off once the deck is clear (now you can run
  for the ramp under fire).

- **Mission 4, more life and detail** (`?map=m4`, 2026-11-13, after
  "add more life and detail to m4"): troopers walk beats until they see
  you (a new `beat` placement field): a pair marching the ring corridor
  in step, one round the hub's column, one on the shaft's west ledge, the
  officer on the corridor's last straight, and others on the bare deck,
  the gallery and (skill 3+) the hangar deck. The hangar's crew at work:
  fuel hoses from the north wall to the two west TIEs, the east one's
  cockpit welded from a service stand (sparks, flicker, a power droid, a
  tool cart), red beacons blinking at the mouth. The control room's
  plotting table with the Crow turning over it in blue light; the
  briefing room's table with the half-built station turning over it.
  Door panels, the lobby's security post, bunks in the cells, cell
  monitors in detention control (which now pulses with the alarm), a
  second prisoner (a pilot, three lines), the troop bay's lockers and
  benches, pipes and a loose live cable in the maintenance tunnel, a post
  welded on the bare deck, a panel hoisted in the gallery. Heard: emitter
  bursts may play sounds, so cables crackle, pipes hiss, the welder buzzes
  (DF's WELD-1), the pump room hums (MACHINE2), the fields hum (RUMBLE1),
  the beam's coupling hums (ELECTRIC) and arcs until it's off (emitters
  wait on story flags), the compactor's eye bubbles and gurgles (CREATUR1),
  the turbolifts whine (ELEV3), and the PA speaks three times. To judge:
  whether the patrols make the fights better or worse (they see you
  sooner), the holograms' blue and size, the volumes of the new sounds
  (all guessed, none heard), how often the PA speaks, and whether any
  area wants more or less. Stains on the hangar deck were tried and
  don't show on its dark texture.

- **Mission 4, the Battle Station** (`?map=m4`, 2026-11-10,
  `docs/mission4.md`): the whole level, made in one session without you
  and then gone over area by area. The hangar with the Crow, three TIE
  fighters and a shuttle, its mouth open on the stars; the control room
  behind the glass and its terminal; the pale ring corridor with light
  bars; the briefing room behind the blue door; the lift hub; detention
  block AA-19 (black and red, ten cells, Rusk in the last on the left);
  the waste chute, the compactor (something in the water), maintenance;
  the tractor beam shaft and its terminal; the unfinished sector and the
  gantry back over the hangar; out under the Crow once the beam is off.
  A test walks the route, so it can be finished; nobody has played the
  fights. To judge: the story (the doc's proposal: where it sits, Rusk
  freed here or not), the flow and the sizes, the look of each area, the
  mouse droid, the models (the TIE, the shuttle, the table), the `station`
  song and the alarm, and whether the alarm sealing the detention lift
  is right. Added 2026-11-11, to look at: sparks off the live cables
  in the unfinished sector (how often, how bright the flashes), the
  steam off the pipes in the tunnels, pump room and compactor (thin or
  thick enough), the vents in the corridor walls, the flickering ceiling
  panel on the slant. The shuttle, rebuilt from Mark's references
  (2026-11-12): 17 long and 19 tall (about 0.43 of canon, to fit under
  the bay's roof), the drive across its stern, the long cockpit wedge,
  the swept fin, the wings folded up (a knee out at 45 degrees, then
  the panel upright, leaning 3 in), the ramp;
  moved east to 66.5, 82.5 to fit. To judge: the size against the TIEs
  and the Crow, the wings' knee and lean, how pale it reads in the bay's light.
- **Mission 2 under the ground** (`?map=m2`, 2026-11-08, after the
  references): the rooms lined by what they are (whitewash and the
  red-ochre dado in the tunnels, white plaster in the house, duracrete in
  the reservoir and cistern, rock only in the caves); the water pipe from
  the garden court to the cave-in, the pump, conduit, tanks, vents,
  hatches, deck plates and the reservoir's grating; the garage round (the
  amber lamp ring, the sunk grating in its kerb, the console, the framed
  opening); the storeroom as the kitchen (white counters, cupboards with
  the red stripe, appliances) and the common room's red rug and oval
  niches. To judge: whether the white reads white enough in the rooms'
  light, the reservoir's walls (busy?), the size of the garage's kerb.
  After Mark's notes (2026-11-09): the hangar off the garage (a catwalk
  over the skyhopper, the floor 2 m down), and the kitchen a narrow galley
  with the storeroom beside it. The skyhopper redone as a T-16, measured off the
  schematics in Mark's references (2026-11-09). To judge: the skyhopper's look and size,
  the catwalk's railing, whether the galley is cosy enough.

- **Mission 2's pits, dome, evening and blowing sand** (`?map=m2`,
  2026-11-08): the pits' walls in two tones (earth above, whitewash with a
  wavy edge rising over each doorway, a red-ochre dado), round-topped
  doorways in thick hoods, blind plank doors round the walls, the
  courtyard stair's red-ochre cheek and its balcony, the condenser panel
  on the courtyard's south-east wall; the great dome on its block with
  the sunken stairwell from the lane's end; the dusk sky (going round
  once, the suns low in the west-south-west), the amber haze, the
  vaporators' long shadows; blowing sand on a west-south-west wind,
  gusting every 6 to 14 s (grains, faint veils, ribbons over the ground),
  the haze closing to 7 m in a full gust, none down in the pits or in a
  wall's lee. To judge: how thick the sand is and how often the gusts
  come, the sky's colours (the palette turns some mauve to brown), the
  whitewash in shade (it reads grey-green), whether troopers should see
  no farther than the player in a gust. Not done: an oval red door.

- **Mission 2's vaporators, in the level** (`?map=m2`, 2026-11-07,
  `models/vaporator.js`): the film's vaporator in place of the seven
  stand-ins on the farm's ground (sensor turning, a cap by every other),
  and the courtyard's cluster in the middle of its floor, in the burning
  cart's light (in the wall's shadow it was a black shape). To judge:
  the looks in play and the cluster as cover. Offered, not asked for: a
  cleaner, brighter white texture, as the worn white reads grey in the
  evening light.

- **Mission 2's pits and shorter stairs** (`?map=m2`, 2026-11-07): after
  Mark's notes on the 6 m pits (the courtyard's curved stair good, the
  others too long), the courtyard stays 6 m and the garden, workshop and
  garage pits are 4 m. No flight over 8 steps, landings between: the
  shed's 8 + 8, the dome's 6 + 6 then the curve, the reservoir's 7 + 5
  each way. The pad, the wash and the flat 1.75 m lower, so the trench is
  8 steps. The caves shallower, the climb out a gentle slope. To judge:
  the depths, the stairs, and the light wells (about 17 health into the
  small pits' tunnels, the well room's secret among them; 36 into the
  house's).
- **Mission 2's fourth blockout, with the reservoir, the stretched
  ending and the caves** (`?map=m2`, 2026-11-06), a walk west to east to the house
  (`docs/mission2.md`):
  the garden pit, the pump tunnels, down into the reservoir (a long dark
  hall under the sand, added after Mark's notes on the fourth: on the
  right track, stretch it out with another underground segment), up
  beside the workshop pit (the way east caved in, in sight), up through
  the generator shed into the work yard facing the gate with the house's
  great dome over it, the officer's red key, the lane straight at the
  dome, its stair down into the courtyard pit and the rooms round it, the
  cellar, then Rusk's way out (picked by Mark from three options to make
  it longer): a panel opens as you take the recordings, his steps down
  into caves under the pad, a cavern with troopers searching it, a low
  passage east and a long climb up into the garage pit, then the trench
  to the pad, where
  Jan won't land (after Mark's notes on the reservoir: he loves it; get
  through a wave of stormtroopers and find Jan): the wave of five, two of
  them up the wash, then down the wash into the rocks, under its arch,
  to the Crow on the flat with troopers firing on it. The route is 745
  steps (631 before the caves, 505 before the ending, 393 before the
  reservoir). To judge: the caves (their length, the dark, the fight in
  the cavern, whether the panel reads as the way on), the ending (the
  wave's size, the wash's length, finding the Crow), whether
  the level is now long enough, and what's still open: the reservoir's
  darkness, the dome as the destination, the key hunt, the lane (short,
  10 m), where the fights are. The sky and haze are still stand-ins (the
  night sky).

- **Finding the way** (`?map=m1`, 2026-11-03, after Mark's play test:
  maze-like, unclear who to talk to, the fob pointing down alleys). Four
  of the eleven proposals:
  - The fob points at two places (after Mark's note, 2026-11-04): the
    trader's signal points it at the checkpoint's gate, and through the
    gate at Rusk, straight at each. (Following the route round every
    corner was too confusing; that option, `track.route`, stays in the
    engine, unused.)
  - Names over heads (after Mark's note, 2026-11-04): the broker, the Jawa
    trader, the informant, the hermit and Rusk show their names over their
    heads while in sight, up to 24 tiles off. Townsfolk show none.
  - The back lane is shut by a gate of planks four tiles in until the
    switch, which opens it with the cantina's back door.
  - The eight empty dead-end alleys each hold a med kit or cells at their
    far end, in sight from the mouth, with a crate, bedroll or pod.
  - Townsfolk's hints (after Mark's note, 2026-11-04): each kind of
    townsperson has four ordinary lines and, for some steps of the story,
    one that points to the next (the cantina, the junk yard, the man by
    the checkpoint, the freighter in the old bay, round the blast doors
    and the customs house), so about one bump in five is a hint, and it
    changes as the story moves on (`villagers.js`). The checkpoint's
    troopers say the pass checks out once you have it.
  To judge: whether the fob's two points lead well enough, the names'
  size, range and colour, the lane's gate, whether the alleys' finds
  are worth the walk, and the hints' words and how often they come.
  Still open from the list:
  the automap draws nothing of the town (houses are raised floor), the
  people who matter calling you over, Jan naming each next step,
  objectives, real landmarks (the comm tower, the
  crane), and the blast doors opening as an event.

- **Bay 86 fitted out** (`?map=m1`, 2026-11-03; through the barred gate
  at the end of the yard past R): ribs, rim lamps (two dead), four fuel
  lines and pumps, the ribbed foot and soot, as in Bay 87. Customs' search:
  big crates prised open (`bay-crate-open-*`, no top, the lid leant
  against the side or lying in front), small crates, drums and litter.
  The gate's front is grey plaster now, with a hood and a buttress either
  side. The stand-in hull hides most of the floor from the gate, so the
  open crates are on its flanks, where you can see down to them. To
  judge: whether you see enough of the search from the gate, and whether
  the hull should become a real ship (a model) next.

- **The dewback stable** (`?map=m1`, 2026-11-02): across the north back
  lane from B to D, out of play since 2026-11-05 (Mark chose to wall the
  lane off): glimpsed over the yard wall from the alleys, its top half
  and roof (`idclip` walks through the wall to look in). Its front is
  open between timber posts under a beam, and the suns fall through its
  slatted roof in stripes (dim under the slats, walls too). Four stalls behind plank
  rails, each with a ring and a water trough; one being mucked out by the
  stable hand, one with the patrol's saddles on a rack, feed and an
  Imperial crate. The patrol's two spare dewbacks stand in the aisle in the
  middle, nose to nose at a feed trough, tied to the middle post (moved out
  of the stalls: their sprites cut through the rails). To judge: whether
  to keep it, now it's only glimpsed (it costs frame time only while in
  sight), or bring it back another way.
- **The speeder garage** (`?map=m1`, 2026-11-02): J on the market, open
  from the start, its shutter rolled up (its bottom slat under the
  lintel, the roller's box inside). The X-34 whose engine lies in the yard
  sits on timber blocks, its right-hand side engine gone and the cut wires
  hanging, a pit droid (a new model) at them with a spanner; a red swoop
  (new) hangs on chains from a hoist on a rusty gantry; a steel bench
  along the back wall with a vice, tools and a board of tools over it; one
  lamp over the speeder; a steel-plate floor, oil and soot. The back
  shutter onto the yard stays down. A plaster pillar stands in the room,
  under the upper storey's window (a window can't be cut over a room).
  To judge: the swoop (does it read?), the pillar, and whether the inside
  shows enough from the market (it's dim against the sun).
- **Smooth motion** (2026-11-02): the view is now drawn between the last
  two ticks, so walking should look steady on a 120 or 144 Hz screen and
  never judder at 60. To judge: whether it feels smoother, and whether the
  movement lag it adds (up to a sixtieth of a second; turning has none)
  shows. Monsters and NPCs still step at 60 Hz.
- **Buildings, not one wall** (`?map=m1`, 2026-11-02, after Mark's note
  that the detailed streets had become unbroken runs of fronts): where
  houses stood butted together on one line, a slot half a metre wide now
  runs back between them (closed a few tiles in, never through to the
  next street), and often the second house stands half a tile to a tile
  back, so the joint shows as a step and a dark crack. The back alleys:
  the first lane's south side, both sides of the second lane, the thug's
  square's south-east corner. The old quarter: three breaks along the
  north street (one closed by a low brick wall, the pale house a tile
  back), the ochre house on the gate square between two slots, the rose
  houses on the bend set back from their neighbours' slanting fronts,
  the alley's south side two houses, and the way to the bay's gate two
  houses where there was one 21 tiles long. The wash: the domed house's
  back a tile back, and two houses with a slot on the east bank instead
  of the town's filler blocks. The back lane: south of the back door the
  cantina's storehouse is its own lower building, a slot between. To
  judge: whether it's enough (the slots show best close up; from along a
  street the steps do the work), and whether some slots should be wide
  enough to step into.
  Then (2026-11-03, Mark: still too short, still on rails), the old
  quarter's north street as a trial of real gaps: an alley 1.5 m wide and
  9 tiles deep between the buttressed house and the turned one (washing
  across it, a water drum at the end), one 1 m wide past the turned one
  ending at the comm tower's foot, the grey house pushed 1 m out into the
  street so its side shows, the first house on the south side on its own
  with rounded corners and a passage 1.5 m wide past it through to the
  main street, and the pale domed house 1.5 m back behind a paved yard a
  step up (its vaporator there). Mark OK'd it. Then the rest of the old
  quarter: a passage 1 m wide from the gate square's corner past the grey
  house to the water yard (a second way to the little square), a dead-end
  alley 1 m wide between the ochre and pale houses on the main street,
  closed by the ochre one's low back room (its stores at the end), one
  off the bend's north-east side between the pale and ochre houses (the
  ochre one's side door in it), and the domed house by the bay's gate 1 m
  out into the street. To judge: the new way through the yard.
  Then the back alleys: on the first lane the south slot is an alley
  1.5 m wide back to the market's houses, and the gun shop's house stands
  on its own, an alley 1 m wide up its east side with washing across it;
  on the second lane an alley each side, facing across the lane halfway
  (1 m on the north, the ochre house past it a tile back; 1.5 m on the
  south), the power box and its cables moved with the ochre wall; the
  thug's square's corners alleys 1 m wide (his men's drums in the east
  one). To judge: whether the second lane's alleys facing each other
  read as a crossing (they could be staggered, with narrower houses).
  Then the dry wash and the back lane (2026-11-03). The wash: a passage
  1 m wide from the main street down two steps into it, between the rose
  house and the tall one; on the east bank the pale house at the bend
  runs back to the town's edge, a dead-end alley 1 m wide and 7 back
  between it and the grey one, and the rose house 1 m out into
  the wash, so its ends show from along it (the wash 3 m wide there). The
  back lane: an alley 1 m wide from the lane through to the north light
  well; the storehouse's slot an alley 1 m wide and 5 back; the last house
  on the east side 1 m back behind a wider paved yard, so the one before
  shows its end. To judge: whether the wash's new way up to the street
  is wanted (it's a third way between them).
- **Domes: only the big ones** (`?map=m1`, 2026-11-03). Mark didn't like
  the day's bigger domes (as wide as the roof, the taller profile, placed
  where the widest fits): they're back as they were, a rim of roof round
  each, and none under 3.5 m across (Mark: the small ones read as bumps).
  47 went and 51 are left: 14 in the streets (the market's round houses,
  the cantina, the hostel, the thug's back room, the old quarter's big
  pale house and the culvert house, three at the west end), the fallen-in
  one, and 36 on the town's blocks round the edge. The narrow houses (the
  lanes, most of the old quarter, the market's two-storey ones) go
  without. To judge: whether the streets have enough.
- **The remaining streets, detailed** (`?map=m1`, 2026-11-01): each its
  own place, built from the town's pieces.
  The back lane: the cantina's empties by its back door, its rubbish
  across the lane with a Jawa in it, its power unit, conduit, tank and fan
  on the back wall; washing in the rooftops' light wells (a vaporator in
  the north one, the south one's corner cut back); a house door two steps
  up on a paved yard at the dead end, crates of bottles stacked there.
  To judge: whether it's too tidy or too busy for a back lane.
  The alleys' west half: the yard behind J is the garage's back yard (J's
  back shutter, a speeder's engine pulled and laid on trestles, a new model
  reusing the speeder's, with a hose to a power unit, a power droid, the
  mechanic, fuel drums and oil); a house with a hooded door on its north
  side. The first lane's two long walls are now five houses of different
  plaster and height, with bare brick, patches and washing. The gun shop
  stands back from it in a notch, shutter down; its back room is the
  fourth secret (a door in the notch's west wall, half behind a crate: a
  rack, a thermal detonator, power cells). To judge: the engine, and
  whether the secret door is too easy or too hard to find.
  The alleys' east half: the hostel's yard (a hooded door, open windows
  onto bunks, a new model, and spacers; an astromech and luggage outside;
  a tin lean-to and a vaporator), the second lane's power tap (a box on
  the wall, cables fanning out from it), the thug's square (his back room
  of contraband through a round arch, his men at sabacc on a crate), and
  the informant's den furnished, with a window onto the checkpoint. To
  judge: whether the bunks read, and the square's game without a sitting
  pose.
  The old quarter's gate square and north street: older and emptier
  (grime 1.6, bare brick, boarded round-topped doors, buttresses). The
  house south of the gate square has lost its dome (a new broken-dome
  model) and its rubble lies below, a squatter's bedroll under it, a
  hitching ring on the next house. Along the north street, houses in place
  of blank blocks: one boarded up, one propped by buttresses, one turned
  off the street's line, and a roofless ruin breached on the street where
  a hermit sleeps under a tarp and keeps a shrine of flickering candles in
  a niche (stand-in lines when you use him). To judge: whether the broken
  dome reads from the square (the house's front hides all but its jagged
  crown), and the hermit's words.
  The old quarter's bends, alley, yard and little square: the bend's long
  south-west wall is three houses now; doors, windows and odds and ends
  along the way, cargo left by the bay's gate. The alley runs under a room
  that bridges it (a round-topped vault). The yard under the roofs holds
  the quarter's water (three vaporators, a tank, drums, a woman minding
  them). The little square is one step (0.25) down from the street, which
  answers the question of a step there below, and it's the squatters':
  a tarp over bedrolls, a fire in a drum (embers, a thin smoke, a
  flickering light), scrap sheets against the wind, washing. To judge: the
  step, and the fire (its particle flames were too big and came out).
  The dry wash: at its north end a culvert under a domed house, a
  round-topped drain with a rusty grate (the bay's railing) over half its
  mouth; at its back a crawl into a dark cistern, the fifth secret (a med
  kit and energy). A flood line along the foot of every wall, downpipes
  draining into it, and rocks, scrap, half-sunk drums and junk left at the
  bends. To judge: whether the flood line reads as one (it's close to the
  walls' dirt skirts), and the grate (the railing stretched to 3 tall).
  New models: `speeder-engine` (models/garage.js, the landspeeder's own
  engine), `bunk`, `bunk-b` (models/hostel.js), `dome-broken-7-grey`
  (models/dome.js), `candles`, `bedroll`, `fire-drum` (models/quarter.js).
  Cost: 1.1 to 2.4 ms a frame more over eight views of the new streets
  (headless, both builds timed in one process, best of six blocks); one
  view, into the ruin, 5.3, mostly because it now sees past the breach
  instead of a blank wall a tile away.

- **The ways to the derelict bay, less straight** (`?map=m1`, 2026-11-01):
  the old quarter's street now runs east out of the gate square to a house
  front, bends south-east, then turns south to the bay's gate; a little
  square opens where it turns, the yard's alley coming into it. The wash
  winds: south, a jog west, south, a jog east, then it narrows into the
  breach. Each stretch hides the next, both stay 8 wide, and the crane
  post shows over the roofs ahead. To judge: whether it's still easy to
  find the way, and whether the street wants a step up or down at the
  little square (both routes are flat today).

- **The derelict bay, after your second notes** (`?map=m1`, 2026-11-01):
  the balcony runs from the gate to the wash's breach under one straight
  rusty railing; under it a rusty steel frame, stores, and a shorted
  junction box spitting sparks; the freighter streaked and sooty. Inside
  the freighter a derelict hold (`models/hold.js`, `hold-*` textures):
  ship panelling, mesh deck, frames, panels gone from walls and ceiling,
  hanging wires (one live), a flickering lamp, dead consoles; three holes
  in the plating and one in the roof you see through, in and out. To
  judge: the hold's look and darkness, the sparks, the two shore-power
  cables (balcony girder and east wall to the ship), and whether the wall's
  stepped face under the balcony shows too much.

- **Sliding along angled walls and objects** (any map, 2026-10-31): you
  should glide along a diagonal wall or a turned barricade as you do along
  a flat wall, instead of sticking. Bodies are now round against solid
  tiles too, so outer corners are rounded off. To judge: the feel, and
  whether rounded corners are welcome.

- **The way home** (`?map=m1`, 2026-10-31): at the switch customs locks
  Docking Bay 87's door. Back on the lane in front of it Jan says its
  controls are in the customs house; use its terminal (past the two
  troopers) to unlock it, and walking under the Crow ends the level. To
  judge: Jan's stand-in lines, and whether the terminal wants a lit screen
  or a sound of its own.

- **The fob, easier to read** (`?map=m1`, slot 8, 2026-10-31): red turned
  away, yellow roughly toward the signal, green facing it. Far off (80
  tiles or more) green is within 25 degrees and yellow within 70; close by
  (4 tiles) 45 and 100, in proportion between. And it was slow to answer:
  far off it blinks every 1.4 s, so a turn showed only at the next blink.
  Now turning into another colour blinks at once. To judge: the angles
  (`track` in `weapons/fob.js`) and the yellow.

- **The blast doors, weathered** (`?map=m1`, 2026-10-31): no longer the
  Imperial base's dark panels. The door is Nar Shaddaa's X-braced door
  (NDPIPES4) and the beam its grilled plate (NWEXT06), in sun-bleached
  steel with rust running along the braces and soot over it; the frame's
  strips streaky plate (NWGREY01), its foot faded warning stripes
  (NPWRNFAD); rubble, litter and a rusty canister in the corners
  (`blast-*` in `derive.mjs`). To judge: how rusty, whether the door's
  three repeats show too much, and whether it wants sand drifted against
  it (the drifts stop a tile short of a door today).

- **The checkpoint, rebuilt** (`?map=m1`, 2026-10-31): no wall across the
  street. The street squeezes between two houses whose fronts slant in
  (the informant's grey one reaching forward, an ochre one on the south),
  into a gap open to the sky, then a passage under a lower room in plain
  plaster, round-topped, the heavy door a tile in (now rustier,
  `door-gate`), under a round hood on the old quarter's side. A cable
  across the gap. The gear is Mos Eisley's own: barricades in dusty,
  sooty grey plate with faded stripes and one lamp dead, floodlight masts
  in rusty steel with one lamp dead, drums closing the gap south of the
  barricades, a power unit and its slack cable. To judge: whether the
  passage reads as a way through, the bridge's height and plaster, how
  pale the barricades are, and whether the terminal (still clean) wants
  the same wear.

- **The junk yard, deeper** (`?map=m1`, 2026-10-31): the
  trader is no longer at the gate. Down into a front court, then a
  passage slanting up between two heaps of scrap (3 to 5 wide, too tall
  to see over) to a lane along the north wall, through a breach and up
  the sandcrawler's ramp into its hold: dim, the length of the crawler,
  the trader at its far west end (layout OK'd by Mark, 2026-10-31). The
  sandcrawler is a model now, plated in rusty panels with the yellow
  patches (`crawler-hull`, from Ramshed's ship plating), the prow's side
  bevelled in ahead of a crease, vents, a window and ports:
  the hold is up on its deck at 3 and its ramp comes down over the wall.
  To judge: its proportions (36 long, 20 tall, the hull 2.5 off the
  ground), the ramp's steepness (0.5 a tile), the plating's colour and
  how big its panels are (a tile each), and whether the crease shows.
  The heaps are piles of junk now: lumpy mounds of the junk texture
  rising from the floor (the west 4.2 high, the east 4.6), steep at the
  foot, with plates, pipes, girders, drums, crates and the odd droid
  dome sticking out. To judge: their height and steepness, and how much
  junk sticks out (about one piece every 2 tiles of slope).
  The cage fence round the west heap is gone (Mark, 2026-10-31).
  The smelter is a vat of molten metal now (Mark, 2026-10-31: first the
  kiln and crane didn't look Star Wars, then make it a trough of melt
  with embers and fire): an open trough of rusty plate against the east
  heap's foot, its rim 0.8 high, full of glowing melt with a dark crust
  (`melt`, from Robotics' acid floor) and scrap half sunk in it, on a
  heater with glowing slots, a spout trickling into a mould of ingots, a
  chute from the heap and hoses to a power unit. Embers and now and then
  a spit of sparks come off it (a decoration's new `emit`; the flames
  and smoke were too much, Mark, 2026-10-31). The crane is gone; a repulsorlift cargo skiff
  is parked in the court's west end along the west heap instead, hovering
  and bobbing: a flat hull with a blunt bow, a rail round its deck, a
  steering post at the stern, two engine pods, crates, a drum and a dome
  on its deck. To judge: both their looks, the skiff's size (5.8 long),
  and whether the embers are right now.
  Droids for sale stand in a row along the court's south wall, west of
  the steps (models, `astromech-blue`, `-red`, `-rust`, `power-droid`,
  `-rust`, about a Jawa's height), a Jawa minding them and another by the
  furnace. To judge: whether the row should be messier or spread round
  the court, and the paint (the white is dusty grey).
  The hold is no longer tidy (Mark: too organised): a bulkhead west of
  the doorway and one at the east end, and two heaps of scrap on its
  floor (`junk-pile-hold`, `-west`, too tall to see over). From the ramp
  you go north round the heap ahead, through the gap past the bulkhead,
  west along the north wall and back south round the west heap to the
  trader in the far corner. East of the doorway is a dead end with the
  droids for sale. A few racks of wares where there's wall for them,
  crates and drums about. Its walls are lit as dimly as the hold (they
  had the sun's light, bright over the dark things in it), and each of
  its three lamps lights a pool round it (5 tiles, +56), the corners
  between dim. To judge: whether the way round is long enough, and the
  light.
  The yard smoulders: dark smoke rises from two spots on each big heap
  (`smoulder`, 4-6 s, swelling and thinning as it goes), and steam wisps
  from grilles either side of the sandcrawler's door, a jet hissing out of
  one every 3-8 s. To judge: how thick the smoke is (Mark found the
  smelter's too much), and whether the steam reads from across the yard.
  The ground and walls less bare: the brick wall is now the backs of
  houses, each its own plaster and height (5 to 7 over the court),
  grimier than the town's, a brick plinth or dirty foot,
  windows, two downpipes and a box unit; sheet metal patches (`patch-*`,
  from Sewers' rusty sheet, a bolted panel and the lean-tos' tin) and
  brick bared where plaster has fallen (`brick-bare-*`). On the ground, a
  trodden path of deck plates (`deck-plate*`, from Generic's riveted plate
  and the rusty sheet) from the gate's steps up the passage to the ramp,
  black oil soaked into the sand (`oil`), burns by the smelter, litter, and
  drums, crates and scrap against the walls. The droids stand on a deck of
  plating a step up. The way there easier to find: the alley between H
  and I is 4 tiles wide (was 2), and I's west corner is cut back at 45
  degrees so its mouth opens 7 wide onto the market; the gate is 4 wide
  too. The olive stall that stood in front of it is on the market's south
  side now; the Jawas' junk spills out of the mouth (a scrapped astromech,
  a power droid, junk, a drum), a long rag hangs down I's cut corner and a
  Jawa stands there ("Utinni!", and once the broker has sent you, he waves
  you up the alley). The broker says "Across the market, up the alley by
  the Jawas" instead of "Look for the sandcrawler": it can't be seen from
  the market (I's roof hides it, even with the roofs behind lowered). To
  judge: the patches read as sheet metal
  (their dark edge can look like a frame), how black the oil is (paler
  turns olive), and the plaster colours.

- **Mos Eisley opens in stages** (`?map=m1`, 2026-10-31; the blast doors
  open from the start since 2026-11-04, after Mark's note that shut they
  spoiled the surprise): the main street is open from the landing to the
  checkpoint, through the blast doors (a stand-in: a rising gate under a
  steel beam over the street, risen). Plank gates shut the ways off it
  into the alleys: across the alley between I and J, the junk yard's side
  gate, and across the alleys' east mouth past the informant's den, so
  the street ends at the checkpoint, the den a dead end off its foot. The
  trader's signal opens all three. The junk yard's own gate (planks in
  the arch off the alley between H and I) is shut until the broker hands
  over the fob (Mark, 2026-10-31), so the cantina comes first. The
  cantina's back door is locked until the switch, which shuts the blast
  doors (slowly, 2 s). The alleys still open at the signal (Mark,
  2026-11-05), side content then: the hostel, the thug, the gun shop.
  And the west end is less open (Mark, 2026-11-05): the north back lane
  walled off behind the north row (a yard wall 2.5 tall, a storehouse 6
  tall behind D), so its gaps are alleys ending at the wall, each dead
  end with a find (cells by A, an energy pack between A and B, a med kit
  past D's stair). To judge: whether the open doors and their beam give
  the switch away, and whether the west end reads as one street now.
  People now point the way (stand-in words): Jan on landing names the
  cantina, the broker the junk yard by the sandcrawler, the guard at the
  blast doors moves you along, the informant
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
  it over at the end of his lines, dark. The Jawa trader in the
  sandcrawler's hold has only "Utinni!" until you carry it; then he keys a
  code into it and it tracks Rusk, in the derelict bay's hold: an amber
  blink and a beep, every 1.4 s from across town down to 0.15 s up close,
  green when you face him. The hold's door, in the freighter's stern, is
  shut until then (2026-10-30), so nothing can find him first.
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
  checkpoint's gate. The way past it: the informant's den, open to the
  alleys' mouth north of the street (the informant's pass opens the gate:
  use him). The rooftops behind it are out of reach (Mark, 2026-11-01: the
  rubble up onto them and the stair down into the old quarter are gone).
  Then the slanting main street (or the dry wash, down steps at the north
  street's end) to the derelict bay; stepping into the stand-in hull's
  hold (Rusk) turns the town: the gate opens, troopers come over the
  bay's rim, in at the old quarter's north street and onto a roof. The stand-in ending: clear customs' two troopers in their office
  by Bay 87. To judge: the distances and the climb, the slant, the derelict bay's
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

### 0. Stairs' sides hung from one height (Mark, 2026-11-12)

Since step sides hang from a world grid, review every stair (interior ones
too) for walls whose texture still steps down with the stair.

- [ ] M2's dug stairs (`stairDown()`): the walls beside a flight hang from
      the flight's highest ceiling, not each step's own.
- [ ] Review the rest (M2's curved courtyard stair and the garage's,
      M1's, M3's, M4's) by snapshots; list which need it, ask Mark.

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
    - [ ] Bare brick where the plaster has fallen: the decals are made
          (`brick-bare-1`, `-2`, in the junk yard); spread them over the town.
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
  - [x] Play both halves (Mark played the whole level, 2026-11-01: no
        notes).
- [ ] **Guiding the player** (Mark, 2026-10-31): the town opens in stages,
      so the open part always holds the next stop, and people say where
      to go. Landing to the trader: the main street to the checkpoint,
      the cantina and the junk yard. The signal opens the alleys. The
      switch shuts the blast doors and opens the ways round them.
  - [x] Gates: the blast doors shut at the switch (a steel beam over the
        street for now: the doors rise into it; open until then since
        2026-11-04); the alley between I and J, the junk yard's side gate
        and the alleys' east mouth shut until the signal; the cantina's
        back door locked until the switch.
  - [x] Lines that point: Jan on landing (the cantina), the broker (the
        junk yard, by the sandcrawler), the guard at the blast doors, the
        informant calling Kyle over at the
        checkpoint's foot, Jan at the switch and again at the checkpoint
        (the ways round).
  - [ ] Objectives, if Mark wants them: an `objective` action, its line
        shown when it changes and at the top of the automap.
- [ ] **The gates, weathered** (Mark, 2026-10-31): the blast doors and the
      checkpoint looked clean and new, the Imperial base's dark panels and
      bright stripes. Make them dirty, rusty and lived-in like the town,
      one at a time, a commit and a check-in after each.
  - [x] The blast doors: sand-scoured, rust-streaked steel (DF's grimy Nar
        Shaddaa doors and walls, recoloured), faded hazard stripes, rubble
        and litter against them.
  - [ ] Waiting on Mark.
  - [x] The checkpoint: the barricades and floodlights dusty and chipped
        (Mos Eisley's own copies, so m3's stay as they are), and the
        troopers' setup made of what they found in town. And no wall
        across the street (Mark): a passage between two houses, gated.
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
    - [x] Bay 86 dressed as Bay 87 is: ribs, rim lamps (some dead),
          fuel lines and pumps, ribbed foot, scorch marks, crates opened
          round the freighter; the gate with a hood and buttresses.
    - [x] The dewback stable (Mark, 2026-11-02): a long low house off the
          north back lane, behind B to D, its front open between timber
          posts, a slatted plank roof the suns fall through in stripes
          (`town.slats()`); stalls along the back behind plank rails
          (`models/stable.js`), two dewbacks (the patrol's spare mounts),
          water and feed, the patrol's saddles, a stable hand.
    - [x] The speeder garage (Mark, 2026-11-02): J hollowed into a
          workshop, its market shutter rolled up so you walk in (the back
          shutter onto the yard stays down: the yard waits for the
          signal); an X-34 on blocks with an engine gone (the one on the
          trestles in the yard), a swoop on a hoist, a bench and tools, a
          pit droid, a lamp, oil on the floor.
    - [ ] Waiting on Mark.
  - [ ] The Jawa junk yard and the sandcrawler.
    - [x] Laid out deeper (Mark, 2026-10-31: the trader shouldn't stand
          at the gate): a front court, a passage slanting north-west to
          north-east between two heaps of scrap, a lane along the north
          wall, a breach in it, and the sandcrawler's ramp up into its
          hold, where the trader is. Blocked out.
    - [x] The sandcrawler's main shape, a 3D model after Mark's pictures:
          the hull, band, stepped back, prow over a raking front, four
          tread units, the side door open and its ramp down over the
          wall; the hold lifted to its deck (3).
    - [x] The hull's look: a texture of panels with rust and the
          yellow patches (`crawler-hull`), the crease up the prow's side,
          the vents along the prow's top, the small window, the ports
          along the band, the housings' slots.
    - [x] The heaps as piles of junk, not slabs: a lumpy mound for
          each (a model, colliding as its outline), droid parts, plates
          and pipes sticking out.
    - [x] The court and the hold: the furnace and the crane as models,
          droids for sale in the court with Jawas minding them, the
          hold's racks and clutter.
    - [x] Mark's notes (2026-10-31: the crane and furnace don't look Star
          Wars): no crane, a cargo skiff parked in the court instead; the
          furnace a vat of molten metal giving off embers and sparks.
    - [x] Mark's note (2026-10-31: the hold is too organised): bulkheads
          and heaps of scrap on its floor, so you wind round them to find
          the trader.
    - [x] Mark's note (2026-10-31: the things in the hold are dark, its
          walls bright): the walls in the hold's light, its lamps lit.
    - [x] Mark's note (2026-10-31: a shelf in a wall, the doorway's frame
          flickers from inside): the rack on the west bulkhead turned
          round; the door's jambs off the doorway's walls, no sill box.
    - [x] Mark's note (2026-10-31: make the yard feel alive): smoke
          rising from the heaps, steam at the sandcrawler's door.
    - [x] Mark's note (2026-10-31: the ground and walls are bare and
          flat): a trodden path of salvaged deck plates from the gate to
          the ramp, oil, burns and litter on the sand, the droids for sale
          on a low deck of plating; the walls the backs of houses, patched
          with sheet metal and bare brick, junk and drums against them.
    - [x] Mark's note (2026-10-31: hard to find from the cantina): the
          alley between H and I wider, its mouth flared open onto the
          market (I's corner cut back), the stall in front of it moved
          aside, and the Jawas' junk spilling out of it with a Jawa at
          the mouth.
    - [ ] Ask Mark about a second way in (through I's shop).
    - [ ] Waiting on Mark.
  - [ ] The remaining streets in detail (Mark, 2026-11-01: every house
        Mos Eisley's, none of them copies, each area its own content). A
        commit each, in the order you walk them:
    - [x] The back lane: the cantina's empties and rubbish, its machinery
          on the back wall, a raised yard at the dead end, washing in the
          light well; the rooftops' faces on the lane.
    - [x] The alleys' west half: the gate, the yard behind J (the
          garage's back), the first slanting lane; the gun shop's back
          room (Secrets, 4).
    - [x] The alleys' east half: the hostel's yard, the second lane, the
          thug's square, the mouth and the informant's den.
    - [x] The old quarter: the gate square and the north street.
    - [x] The old quarter: the street's bends, the little square, the yard
          and its alley (ruins, the shrine, squatters).
    - [x] The dry wash: the culvert (Secrets, 5), what the floods left at
          the bends, the flood line.
    - [ ] Waiting on Mark.
  - [ ] The comm tower.
  - [ ] The derelict bay and the gutted freighter.
    - [x] Its stairs (Mark, 2026-11-01: the flight ran 12 tiles straight
          out to the middle of the pit): a kit piece, `town.wallStair`, a
          flight down a round pit's wall that hugs it, a step per tile
          column, a parapet on its open side; a short landing at the gate
          with a parapet, the flight running west along the wall.
    - [x] One way down (Mark, 2026-11-01: no straight steps): the wash's
          sand steps gone, its breach onto a ledge along the wall to the
          landing (`town.wallLedge`), so both ways in take the one flight.
    - [x] The pit fitted out as Bay 87 was, and left: ribs (a tile
          taller), dead lamps on the rim, soot scars, scrap, drums, crates
          and junk against the wall, litter and rubble on the sand.
    - [x] The breach: broken edges where the wall gave, sand spilt
          through it onto the ledge.
    - [x] The gutted freighter (a model, in place of the stand-in hull),
          Rusk's hold in its stern.
    - [ ] Mark's notes (2026-11-01), a commit each:
      - [x] The top of the stairs a balcony out over the pit, with a
            railing you see the ship through (not a solid parapet).
      - [x] The ship less patterned: the hull's plating and the engines.
      - [x] More junk: scaffolding, cargo boxes, etc.
      - [x] Everything dirtier.
    - [ ] Mark's second notes (2026-11-01), a commit each:
      - [x] The balcony runs on east to the breach, one straight railing,
            no stepped parapet along the wall.
      - [x] Under the balcony: posts, girders and a better underside, junk
            stored under it.
      - [x] The ship dirtier: streaks down its sides.
      - [x] Sparks spitting from something in the bay.
    - [ ] The freighter's interior (Mark, 2026-11-01), a commit each:
      - [x] A ship's hold, derelict: dirty ship panelling, a mesh deck,
            ribs across it, panels gone from the walls and ceiling.
      - [x] Wires hanging from the holes, a lamp flickering, broken
            fittings and junk (in the same commit).
      - [x] Holes in the hull you see in and out through (not big enough
            to climb through, so the hold's door still gates Rusk).
    - [ ] Waiting on Mark.
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
- [x] Frame time in headless Chromium (2026-11-02, the render alone, 40
      seeded views each, best of 3): Mos Eisley 7.6 ms on average at 1x
      4:3 (90th percentile 13.4, worst 17.9), 16.8 at 2x (28.0, 39.4),
      10.1 widescreen (16.8, 24.4); m3 3.0 at 1x (4.7, 7.7), 9.9 at 2x
      (17.6, 26.2), 6.0 widescreen (10.5, 11.3). The tick: 0.75 and 0.1.
- [ ] Waiting on Mark: the look (sparks and ropes can be 1 pixel thin at
      2x, the dithering is finer), and whether the menu should warn that
      2x needs a fast machine.

### 9. Mission 2: the Homestead (Mark, 2026-11-05)

The story's Map B, at evening instead of night, with blowing sand that
half hides the view in gusts, Mos Eisley's styles but its own design and
light. The design (the flow, areas, heights, light and sand, enemies by
skill, secrets) is `docs/mission2.md`. Mark asked for the whole level's
flow mapped before any part is built. Each step is a commit with
snapshots, playable at `?map=m2`.

- [x] Design: `docs/mission2.md` (the paper pass).
- [x] The blockout: `m2` (144 x 112, sky 32), `?map=m2`.
- [x] The redesign after Mark's notes (2026-11-05): `docs/mission2.md`, and the
      second blockout (288 x 256, open sand, the track, three pits and
      tunnels; the flow field plans 96 steps out, `navReach`).
- [x] The third design after Mark's notes on the second blockout
      (2026-11-05): `docs/mission2.md`, and the third blockout (128 x 140,
      the farm walled in, dropped into the garden pit).
- [x] The fourth design after Mark's notes on the third blockout
      (2026-11-06): `docs/mission2.md`, and the fourth blockout (208 x
      142, a walk west to east to the house, one way on from each area).
- [x] The reservoir after Mark's notes on the fourth blockout
      (2026-11-06: on the right track; stretch it out with another
      underground segment, not more complex ones): `docs/mission2.md`,
      and in the blockout between the pump tunnels and the workshop pit
      (the route 505 steps, from 393).
- [x] The ending stretched after Mark's notes on the reservoir
      (2026-11-06: don't end as you come out of the trench; get through a
      wave of stormtroopers and find Jan): `docs/mission2.md`, and in the
      blockout (the map 72 tiles taller): Jan won't land on the pad, the
      wave of five, the wash winding down into the rocks under an arch,
      the Crow on the flat at its foot (the route 636 steps, from 505).
- [x] The caves after Mark asked for it longer (2026-11-06): Rusk's way
      out of the cellar, down through caves under the pad and up into
      the garage pit (the route 745 steps, from 631).
- [x] **The pits' walls and doorways** (from the references, before
      "Each area in detail"; a kit in `lib/town.js` or a new
      `lib/farm.js`, used by every pit):
  - [x] Two tones: bare earth above (tan to ochre, runnels), whitewash
        below with a wavy top edge rising over each arch, a red-ochre
        dado at the foot (`lib/farm.js`, `pitWalls()`: wall bands, the
        edge a band with see-through texels, bands on the slab over a
        doorway).
  - [x] Round-topped doorways in a thick bulging surround, plank doors
        or an oval red door; low square doorways under slab lintels
        (`pitDoorway()`, `blindDoor()`: seven round-topped, blind plank
        doors round each pit, the garage pit's two square; no oval door
        yet).
  - [x] The stairs' red-ochre cheeks, and a balcony with a low parapet
        over a doorway where a stair lands (the courtyard's landing, over
        a blind door).
  - [x] The courtyard's condenser panel (ribbed white, its gear disc,
        two fittings on the rim above): its landmark (`condenser-panel`,
        on the south-east wall; two domed caps on the rim as the vents).
  - [x] The great dome as the entrance dome (Mark, 2026-11-07: yes, the
        way down starts outside): on a block with low wings, its door in
        a projecting hood at the foot of a sunken stairwell, kerbed,
        cut down from the lane's end. The first flight (6) in the
        stairwell, the door at its foot, the landing and second flight
        (6) inside under the dome, then the doorway halfway down the
        courtyard's wall and the curve as now. The hall goes; the porch
        becomes the hood. Update `docs/mission2.md` (7a, Levels) when
        built.
- [x] **Evening:**
  - [x] `sky-dusk` (`derive.mjs`, from RESKY01): mauve overhead to rose
        to a pale warm amber at the horizon, fading into the haze (Mark's
        references: rose and mauve all over, little indigo).
  - [x] The suns low in the west-south-west (`town.finish(EVENING)`: 196
        and 204, 14 and 18 degrees up), so the shadows run 20 to 30 tiles
        (in with the blockout).
  - [x] Light levels: ground 176, deep shade about 104, interiors 96 to
        120, the courtyard 104, the cellar 64 to 80; the haze (amber,
        `half: 48` in a lull), checked against the palette.
  - [x] A sky that wraps once round the horizon (a level's `skyWrap`:
        defs, validator, MODDING.md, a test), so the glow is in the west
        only; the two suns painted low on it.
  - [x] The vaporators' long shadows: a thin caster per vaporator in the
        kit's `shadows()`.
- [x] **Blowing sand** (all cosmetic, its own RNG):
  - [x] `weather` takes a list of types (defs, validator, MODDING.md, a
        test); one object still works.
  - [x] Gusts: `weather.gusts: { every, hold, strength }`, a clock of its
        own driving the wind (and so every type with `wind`) and the
        number in the air; a test that a gust carries a particle farther.
  - [x] The haze swells in a gust (`haze.gust`, its half distance in a
        full gust); a test that a far wall fades more in a gust.
  - [x] The sky's lower part fades into the haze in a gust (measured:
        the sky's rows are in the hot loop).
  - [x] The particles on the bench (`tools/particles.html`): `sand-grain`
        (fine streaks on the wind), `sand-veil` (big faint sheets low
        across the view), `sand-snake` (ribbons over the ground); then in
        `m2`. Frame cost under 0.3 ms (measured in the yard: about 0.35
        ms in a full gust, nothing in a lull).
  - [x] Shelter in the pits, the trench and the lee of the buildings and
        rocks: fewer, or none (decide after looking): none made in a lee
        (`shelter`), what blows over keeps going.
  - [x] Waiting on Mark: how thick, how often the gusts come, and whether
        troopers should see no farther than the player in one (above).
- [ ] **Each area in detail,** in the order you meet them, snapshots
      before and after each:
  - [ ] The courtyard and the house's rooms: round-topped arches, the
        overturned table, the cart, the common room's hearth and table,
        the quarters' alcoves and toy droid, the storeroom's shelves.
  - [ ] The cellar: the vaulted cistern, its dark pool, the pipe, the
        lamp on the floor, the case behind the loose stone, the niche
        (secret).
  - [ ] The garage, its pit, the trench and the pad: the stripped
        speeder, the hoist, drifts on the trench's steps, the windbreak's
        gate, the beacon lamps round the spot, low rocks.
  - [ ] The wash and the flat: rock that reads as rock (the sandstone
        texture looks laid in blocks), sand drifted against the walls'
        feet, the arch, the dry bed's gravel, the Crow's landing lights.
  - [ ] The windbreak, its drifts and the backdrop: sand drifted against
        the wall, the pad's drifts and cuts, the Jundland far off
        (`canyonBackdrop`) and a dune variant for the west and south.
- [ ] **Fire and smoke:** the generator shed and the house's roof burning
      (fire decorations with fire, ember and smoke emitters, flickering
      lights), the workshop pit's speeder and the courtyard's cart; the
      smoke torn east by the wind.
- [ ] **Life:** the troopers by skill (`docs/mission2.md`'s table), the
      probe droid, items and ammo, the wave by skill (a `skill` on the
      `spawn` action, or more troopers placed lying in wait).
- [ ] **The story:** the recordings (the data tape, section 7) start the
      ending; footsteps and falling dust; the garage rolls open, the
      family's speeder heard leaving; the call; the Crow on the flat;
      the pickup as the exit. Stand-in words.
- [ ] Waiting on Mark: the Tuskens' sheet (on the pad's drifts) and the prototype's
      (walking out of the sand at the end); the words.
- [ ] **Tune and check:** light, the sand, frame time, the per-skill check;
      update `docs/mission2.md`.

### 10. Mission 4: the Battle Station (Mark, 2026-11-10)

A level on the first Death Star: a hangar, hallways and a detention
block at least, fresh but familiar. The design (story proposal, flow,
areas, the kit, light, secrets) is `docs/mission4.md`. Painted in code as
Mission 3 is. Each step is a commit, playable at `?map=m4`.

- [x] Design: `docs/mission4.md`.
- [x] The kit: textures (`ds-*`, `sky-space`, from the DF pack by
      `derive.mjs`, STATION), models (`models/station.js`), the mouse
      droid and the interrogation droid.
- [x] The blockout, the starfield outside (Mark, 2026-11-10: no trench,
      no planet), and a finishing pass over every area with snapshots:
      skirting and trim, light bars, signs, the hub's column, the alarm,
      the `station` song, `alarm-klaxon` and `beam-down`.
- [x] The route walked by a test (`tests/m4-route.test.js`); frame time
      measured (`docs/mission4.md`, Checked).
- [ ] Still to make, if Mark wants them: a turbolift sound, the
      compactor's groan, the field's hum; 4-tall side doors; a sprite for
      whoever Kyle sees in the briefing room.
- [ ] Waiting on Mark: where it sits in the story, the look, the fights
      (nobody has played it), the song.

### 11. Frame time (Mark, 2026-11-10)

Smooth on every computer. Measured with `tools/bench.mjs` (headless, 40
seeded views a level, the Dark Forces art, each view's best of several
frames running): at 320x200 Mos Eisley averages 6.5 to 7 ms a frame, its
90th percentile 13 and its worst views 15 to 18; m2, m3 and m4 average
3 to 5.5, worst 7 to 15. The world pass (`drawWorld`) is 70 to 85% of a
frame, models most of the rest. Of the world pass about a third is
filling pixels and the rest is the ray's work per tile crossed (10,000
tiles a frame in Mos Eisley), spread thinly over the whole loop: no one
line is hot, the helpers are already inlined or cheap to call, and a
cold cache costs only 7%. So changes that keep every pixel are worth
5% here and there; a big gain needs one of the choices below.

- [x] The bench, and the renderer's time by stage (`Renderer.ms`).
- [x] `drawWorld`'s helpers made once a frame, not once a column.
- [x] Garbage: 1.5 MB a frame down to 0.5 (the worst views 2.3 to 0.7).
      A fraction clamped to an imported constant was boxed at every
      floor and ceiling pixel; distances are handed to the big helpers
      in an array (`REG`) instead of as arguments.
- [ ] The rest of the garbage: `drawWorld`'s calls to `face`,
      `decalFaces`, `faceLevel` and `walkBlocks` (0.5 MB a frame in the
      worst views), the same way.
- [ ] Draw in threads (Mark, 2026-11-11): the world pass's columns
      shared out among worker threads. Nothing looks different. A
      throwaway test in Node (this laptop: 4 cores, 8 threads, a 15 W
      chip; every frame byte for byte one thread's) made the pass 1.3
      times faster on 2 threads, 1.6 on 3, 2.1 to 2.4 on 4 and 2.8 to
      3.5 on 8: Mos Eisley's worst frames from 15 to 18 ms to 8 or 9.
      Columns go out 16 at a time from a shared counter (the busy part
      of the view gets shared out), and the main thread draws too.
  - [x] `drawWorld` draws a range of columns (`view.x0` to `x1`), and
        what it works out once a frame is kept for the frame's other
        ranges. Bytes the same, no slower.
  - [x] Shared memory (`core/shared.js`): the framebuffer, the view's
        buffers, the map's arrays, the light map's cells, the textures
        and the colormaps are allocated shared where the page may
        (`crossOriginIsolated`, and in Node), plain arrays elsewhere.
  - [x] The pool (`render/pool.js`) and its worker (`render/worker.js`):
        the worker gets the textures once, a level's map when it
        changes (the arrays shared; doors, angled walls, fences, bands,
        decals and the backdrop copied, the doors' opening sent each
        frame), and each frame the camera. A worker that wakes late
        just finds no columns left; one that dies, or takes over a
        quarter second, turns the pool off and the frame is drawn
        again on one thread. `tools/bench.mjs --threads N`. A test: a
        minute of play in every level, each frame drawn both ways, the
        same bytes.
  - [x] The browser: a service worker gives the pages the two headers
        shared memory needs (GitHub Pages can't set them); the first
        visit reloads once when it's in. The pool starts at boot with
        one worker a logical core less one (7 at most); `?threads=0`
        turns it off, and so does anything failing. Smoke test.
  - [x] Measured in headless Chromium (Mos Eisley, 40 seeded views, each
        drawn with and without the pool in the same page; the machine
        was busy, so the ratios matter more than the times): the world
        pass 1.8 times faster on 2 threads, 2.4 on 4, 2.8 on 8 (3.0 at
        640x400); the whole frame 1.5, 1.8 and 1.8, the 90th percentile
        from 16 or 17 ms to 10 or 11. The models are now the bigger
        part of the worst frames.
  - [x] The models drawn on the threads too, after the world (bench, 8
        threads, against the world alone threaded: Mos Eisley 4.4 to 3.6
        ms on average, the 90th percentile 8.2-9.8 to 6.4-6.6; Mission 4
        2.7 to 2.3 and 5.3 to 4.2; on 4 threads 10% on average).
  - [ ] Waiting on Mark: to try on the site. The frame rate and the
        threads drawing show in the corner all the time for now (8
        threads on this laptop): put it back behind the SHOW FPS
        setting (`game.js`) once this is settled. `?threads=0`
        is the old way, for comparing. The first visit reloads itself
        once, before the loading screen. Worth trying on the slowest
        machine to hand, and in Firefox and Safari if there's one about.
- [ ] Waiting on Mark: which of these to build.
  - Low detail, by itself: when frames run late, draw every other
    column and double it (Doom's low detail), back to full when there's
    time. About 1.8 times faster while it's on; things look blockier
    side to side. Could be a setting too. A day's work.
  - The models' light per face span instead of per pixel, and their
    textures stepped in runs of 8 pixels: models 1.3 to 1.5 times
    faster (they are 15 to 30% of the worst frames); a level of light
    can land a pixel off.
  - The palette lookup in the shader, not in a loop (the frame goes to
    the card as 1 byte a pixel): about 0.1 ms at 1x, 0.3 at 2x. Nothing
    looks different. Small.

### 12. Mission 5: Breakers' Row, Corellia (Mark, 2026-11-14)

A level in a Corellian ship-breaking yard, built on the look of Mission
1's gutted freighter (its textures, the panels off, the hanging wires and
sparks, the haze). The design (story proposal, flow, areas with boxes,
the kit, light, secrets, risks) is `docs/mission5.md`: read it first.
Painted in code as Missions 3 and 4 are (`src/content/levels/m5.js`).
Each step is a commit, playable at `?map=m5`. Area numbers are the
design's.

Steps marked (parallel) don't touch `m5.js` and can be done by another
session at the same time as the blockout; say here which one you've
taken. The blockout steps are in order, one session at a time.

- [x] Design: `docs/mission5.md`.
- [x] Blockout A, areas 1 to 3 (pier, quay, sea wall, the Bottoms, pump
      house, pipe gallery), stand-in textures, a stand-in sky
      (`sky-dusk`), the yard as bare ground with blocks for the hauler
      and the crane's legs. The level ends at the gallery's south end
      (a temporary exit) until Berth 1 is there.
- [ ] **Found in blockout A, to settle:** from the pier the hauler (180
      tiles off) and the crane's legs (270) are faint shapes, nearly the
      haze's colour at `half: 44`. The crane needs its beacons as lights
      and its shape in the sky's picture, or a longer haze (64, as Mos
      Eisley's); try both once the crane's model exists. And the map's
      south-east edge shows as a low wall on the horizon over the water
      from the pier: the skyline step must end the sea cleanly.
- [x] Blockout B, areas 4 to 6 (Berth 1 with Mission 1's freighter and
      the steps up through its deck; the cutting floor with slanted plate
      stacks, a sunk lane, the shed; the hauler: hold, bulkhead, reactor
      room, the lift at the cut face, crew deck and cabins, aft stair,
      bridge). The `power` flag: lift, lamps, the squad. The level ends
      at the bridge's south door until the crane way is there.
- [ ] **Blockout C, areas 7 to 10** (gangway, crane way with its gap and
      hoist, Berth 3 below, the cab and its lift, the dry dock's
      terraces and flights, the office, its lift, the apron, the exit
      `if` `manifest`). Red keycard on the cab's officer.
- [ ] **The route walked by a test** (`tests/m5-route.test.js`): it
      walks from the pier to the bridge now; extend it with blockout C.
      Then frame time on the cutting floor and in the dock
      (`tools/bench.mjs`), before any dressing.
- [ ] (parallel) **Textures**: a CORELLIA set in
      `assets/custom/derive.mjs` from the Dark Forces pack (the design
      lists them: quay concrete, sea wall, shack walls, shutter, harbour
      water, slag ground, wet dock concrete, crane paint, the hull's cut
      section, berth numbers 1 to 4 and an Aurebesh sign as decals), with
      generated stand-ins in `tools/art` so tests see them.
- [ ] (parallel) **The sky**: `sky-corellia`, once round (`skyWrap: 1`):
      overcast, a dirty yellow glow and a pale sun low in the east, smoke.
      Far shapes painted in: stacks, yard platforms over the water.
- [ ] (parallel) **Models, the yard's big pieces** (`models/yard5.js` or
      as fits): the great gantry crane (legs, beam, cab, hook, beacons),
      the crane way's trestle and rail, the ribs of Berth 3, keel blocks,
      a smokestack, a hoist. Snapshots in the sandbox.
- [ ] (parallel) **Models, the small pieces**: `hold-rib` taking a span
      (the hauler's hold is 24 wide; Mission 1's must come out the same),
      a long run of hanging wires, the fallen deck's edge, plate stacks,
      a cutting torch on a stand (sparks, `weld-arc`), lamp post,
      bollard, shack dressing (lean-to, vent stack, the lit sign).
- [ ] **Dressing, area by area**, with snapshots (`--custom`), swapping
      the stand-ins for the kit: 1 and 2; 3 and 4; 5; 6 (the most work:
      ribs, wires, panels, grime, before and after the power); 7 and 8;
      9 and 10. One commit an area or pair. Dressing has a purpose, and
      it's sci-fi (canisters, pods, droid parts).
- [ ] **Light and air**: the haze's colour and half distance, soot
      flakes (`weather`), the wind, smoke from the stacks and the
      furnace, steam in the pump house and the hauler, lamps and pools
      by the design's numbers, the reactor's change of light.
- [ ] **The skyline**: the slum climbing behind the sea wall, the stacks,
      the platforms (a backdrop or scenery blocks; `lib/backdrop.js` is
      a canyon's, so this may want its own).
- [ ] **Fights and items**: enemies by skill (a table in the design, as
      Mission 4's), beats for the patrols, the sweep squad, the hold's
      ambush on `power`, the dock, the apron; pickups, a weapon each
      third; the four secrets. The validator's ammo budget near Missions
      3 and 4's (about 12).
- [ ] **Words and sound**: Jan's lines and the yard's PA at each gate
      (stand-ins), the dead lift's message, the manifest; a harbour
      ambience (gulls are out: machinery, a horn far off), the reactor's
      start; a song (`corellia`) or a stand-in from the existing ones.
- [ ] **Checked**: `npm test`, `npm run validate`, smoke; the design's
      "Checked" section (route time, frame times, what nobody has played).
      Then under Waiting on Mark: the look, the fights, the song.

## Small fixes and known rough edges

- [ ] A second `Registry` built from the same content pack finds no sprite
      sheets: the first replaces each def's inline `sheet` with a `{ ref }` in
      the shared objects. Only tools building two registries hit it; copy the
      defs instead of changing them.
- [ ] Angled-wall tiles count as fully open for reachability, so a gap
      squeezed between two angled walls isn't checked.
- [ ] A walker chasing the player round the small rock in the sandbox's
      courtyard (diagonal tiles at 34-35, 28-29) stops against its east face
      and walks on the spot.
- [ ] The model builder restarts a cylinder's texture on each face; wrap it
      round.
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
- Thin far things (poles, cables, small sprites) under a pixel wide are
  point sampled, so they can flicker in and out as you move.
- Rendering throws away about 1.6 MB a frame (Mos Eisley, 2026-11-02):
  numbers boxed for calls to `drawWorld`'s closures too big to inline,
  and the 15 closures made per column. The collections cost about 0.1 ms
  a frame on average, with the odd pause up to 7.5 ms headless. Passing
  those numbers another way would mean restructuring `drawWorld`.
  Caching static models' world-space vertices would save about 2% of a
  frame.
- `tools/import-texture.mjs` for outside art (resize, snap to the palette,
  check the tiling).
- Recorded music (a composer or orchestral samples).
