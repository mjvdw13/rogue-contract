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
| Story | **Bad Paper** (`docs/story.md`, 2026-10-13): a prequel to Dark Forces. Kyle Katarn takes a Guild bounty on Tatooine as cover for the Alliance; Jan Ors flies him in and out in the Moldy Crow. Only Mission 1 (Mos Eisley) is free roam; the rest is run-and-gun. |
| Scope | **A vertical slice first**, then decide on more missions. The slice is **Mission 1, Mos Eisley** (2026-10-17): the first level we make. The Canyon Garrison already built (`m3`) is the story's Mission 3. |
| Title and repo | **Rogue Contract**. Public repo `mjvdw13/rogue-contract`, served by GitHub Pages from `main`. "Star Wars" and "Dark Forces" stay out of the title. |
| Art, sound and rights | A non-commercial fan game. Mark's decisions (2026-10-12, 2026-10-15): ripped Dark Forces art and sound effects are committed in `assets/custom/` and used on the hosted site, through `overrides.json` and `sound-overrides.json`, with generated art and synth sounds as the fallback (and what tests and the smoke test use). Characters Mark makes with AI image tools are committed as our own art. Music stays original: no note-for-note John Williams. |

## Waiting on Mark

These need Mark to try something, or to decide. Don't start them without him.

- **Character sheets for Mos Eisley** (`docs/mission1.md`, Characters):
  cantina aliens (4-6 kinds), the band, the bartender, the broker, the
  informant, the thug, the customs officer, the bay owner, the water
  seller, Dace, a dewback and a power droid. Until they exist, villagers
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
  doorway, valances on both awnings, a long banner on G's west wall and a
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
  or a house's own `grime`). Rounded corners and round walls have none:
  decals only go on tile edges.

- **Awnings, tin, pipes and clutter in Mos Eisley** (`?map=m1`): cloth
  awnings in stripes and canvas (C teal with a fixed fringe, E red with a
  swaying valance), a tarp over a stall on the square, tin on C's lean-to
  and B's porch, downpipes, tanks, box units, conduits and vents on the
  walls, and the street clutter: crates, drums, pressure canisters,
  cargo pods, power units, junk and litter with droid domes, rubble,
  scrap and a vaporator (no jars or sacks: Mark, 2026-10-18), set along
  the walls by `town.clutter()` and by hand on the main street (a stall
  selling droid parts under the tarp). How they look, how
  much clutter (`amount`), whether the tarp and the valance sway too much,
  and whether more awnings should sway. All the new models together cost
  0.44 ms a frame on average over eight views, 0.75 at worst (headless,
  measured with the machine at about half its usual speed).

- **The landspeeder** (`?map=m1`, on the main street by C's awning, nose
  west): how it looks against your references (its size, about 1.25 times
  life against you, 4.2 long; how pink the paint comes out once the
  palette has it, as it leans terracotta; how much rust), its dithered
  shadow, and where it's parked. 289 faces. It costs about 1 ms a frame
  to draw when it's near (2.4 at worst, standing over it; headless, the
  machine busy), 0.3 of that the shadow: say if the shadow should go.
  Should it bob as it hovers (a new decoration field)?

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
  - [ ] Waiting on Mark.
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
- [ ] **Docking Bay 87**, the lane, the owner's office, the customs house.
      The episode starts in `m1`. The design's boxes overlap the first
      stretch's south row, so the bay goes south of the south back lane
      (centre 32, 126, 44 tiles across), its door on the lane, and the
      alleys between the south row's houses are the lane up to the
      main street.
  - [x] The pit: floor at -5 under the sky, round walls up to a rim at 6
        (duracrete, derived from DF), a landing inside the door at street
        level and stairs down from it, the bay door (4 wide, rising) onto
        the back lane, the player's start on the bay floor. Snapshots.
  - [x] Decals on angled walls (the engine: placed by a point on the
        wall, running on round a curve with `wallU`), and blast scars on
        the bay's walls (soot grime).
  - [x] The walls' ribs (models round the circle), fuel lines and pumps,
        gantry lamps on the rim.
  - [x] The maintenance pit in the floor where the Crow lands (secret: a
        shield unit).
  - [ ] The owner's office (a window onto the lane) and the customs house
        (a grey prefab) by the bay door.
  - [ ] `docs/mission1.md` to match, then Waiting on Mark.
- [ ] **The main street, the market and the water plaza** (stalls,
      awnings, the condenser tower).
- [ ] **The cantina:** entrance, steps down, the round room, the bar,
      booths, bandstand, back rooms.
- [ ] **Bay 86, the dewback stable and the speeder garage.**
- [ ] **The Jawa junk yard and the sandcrawler.**
- [ ] **The back alleys and the back lane.**
- [ ] **The checkpoint and the rooftops.**
- [ ] **The prefecture** and its comm tower.
- [ ] **The old quarter and the dry wash.**
- [ ] **The derelict bay** and the gutted freighter.
- [ ] **The skyline:** dunes and mesas in the backdrop, the town's edges.
- [ ] **Life:** calm troopers and the switch (section 5), patrols,
      villagers, Jawas and the cantina's customers placed.
- [ ] **Air and sound:** dust, emitters, ambient sound, the cantina band
      (sections 2 and 3).
- [ ] **The story:** conversations, the fob, the drop-off and pickup, the
      loud half (section 5).
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
- [ ] **Calm monsters:** `calm` skips the idle sight check, stands its post or
      wanders, and says lines when bumped or used (as NPCs do).
- [ ] **The town's switch:** a `hostile` action and an `on: 'hostile'`
      trigger turn every calm monster normal; the player firing or dealing
      damage runs it.
- [ ] **Conversations:** an `on: 'talk'` trigger from `npcReact`, lines that
      move on with each use, story flags (`setFlag`, `if` on triggers).
- [ ] **The tracking fob:** a weapon with no attack, a per-tick weapon hook
      (blinks and beeps faster near the signal), `setSignal` and `takeWeapon`
      actions.
- [ ] **`remove` and `place` actions.**
- [ ] **`damage { tag, amount }` action** (the overload hurts the prototype).
- [ ] Nice to have: patrol routes, villagers who see a shooting
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
