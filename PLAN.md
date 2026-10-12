# Plan: Rogue Contract, a Dark Forces-style Star Wars game

A Star Wars first-person shooter that is heavily influenced by *Dark Forces*
(LucasArts, 1995). It is forked from Raccoon Alex's browser engine
(`C:\Mark\raccoon-alex`). This file is the durable plan: tick items off as they
land, and record new decisions here.

## Decisions (2026-10-11)

| Question | Decision |
|---|---|
| Engine | **Height grid.** Keep the tile grid, but give each tile its own floor and ceiling height. Add elevators, looking up and down, jump and crouch. Not a flat reskin, and not a full sector/portal engine. |
| Where | **New sibling repo**, `C:\Mark\rogue-contract` (first created as `dark-forces-clone`), copied from raccoon-alex with its history. Raccoon Alex stays untouched. |
| Story | **Original story in Dark Forces' style.** A new mercenary working for the Rebellion, Imperial bases, mission briefings and objectives, a serious tone. No Kyle Katarn retelling. |
| Scope | **A one-mission vertical slice first**, then decide whether to build more. |
| Title | **Rogue Contract** (chosen 2026-10-11). Repo `mjvdw13/rogue-contract`, public, served by GitHub Pages. "Star Wars" and "Dark Forces" stay out of the title. |
| Rights | A non-commercial fan game. All art, sound and music are generated or original. Nothing ripped from Dark Forces, and no note-for-note John Williams transcriptions. |

## Starting point

Raccoon Alex keeps the engine and the content apart. `src/engine/` doesn't
know which game it runs, and `src/content/` is plain data. The engine is
Wolfenstein-flat:

- every wall is 1 unit tall (`render/walls.js`)
- every floor is at height 0 (`render/flats.js`)
- collision only checks x and y (`world/physics.js`)
- combat is 2D (`combat/damage.js`)

The renderer already supports shifting the view up and down
(`view.horizonOffset`), which is how Dark Forces did looking up and down.

## Phase 0: Fork

- [x] Create the repo (now `C:\Mark\rogue-contract`), keeping the raccoon-alex history.
- [x] Rename the package, title and README, and keep `npm test`,
      `npm run validate` and CI passing.
- [ ] Replace the Alex content step by step as each Star Wars piece lands,
      always keeping a playable build.

## Phase 1: Height-grid engine (the biggest phase)

1. [x] **Map data.** Each tile gets `floorZ` and `ceilZ`, set through the
       legend (`'.': { floor, ceiling, floorZ: 0, ceilZ: 1.5 }`) or the
       optional `floorHeights` / `ceilHeights` grids. The defaults (0 and 1) reproduce today's flat
       maps exactly.
2. [x] **Renderer.** The ray doesn't stop at the first wall. As it crosses
       tiles it draws the step faces where the floor or ceiling changes height,
       plus each tile's floor and ceiling. A running top and bottom limit per
       screen column ("Doom on a grid") also lets sprites hide correctly behind
       ledges. The sky still works.
3. [x] **Player movement.** Gravity, a step-up height, jump, crouch (lower
       eyes and body), looking up and down (mouse, keys, gamepad), and damage
       from long falls.
4. [x] **Doors and lifts.** Doors rise into the ceiling like Dark Forces
       doors (an animated ceiling height). Elevators are tiles whose floor
       height moves between stops, triggered by a switch or by stepping on
       them.
5. [x] **Angled walls.** Each tile can hold one wall line, with its
       endpoints on the tile's edges at 1/8-tile positions. The renderer
       checks where each ray crosses the line, the same way it handles door
       panels.
       - Ship the four 45° presets first (`diagonal: 'NE' | 'NW' | 'SE' |
         'SW'`, naming the solid corner). They give chamfered room corners,
         octagonal rooms and angled corridors.
       - The data model already allows any angle (for example about 26.6°
         across two tiles), and chains of short lines for rounded corners.
       - Later: two-sided lines that separate two floor heights instead of
         wall and floor (diagonal ledges and step edges).
       - Collision is circle against line. Enemy pathfinding treats
         part-solid tiles as open, and collision keeps monsters out of the
         solid part (so angled corridors stay walkable). The automap, map viewer and validator
         draw and understand the lines.
       - Textures run along the line at a true 64 texels per unit, so they
         aren't stretched.
6. [x] **3D combat.** Shots aim along the camera's pitch with gentle
       vertical auto-aim. Projectiles move in 3D, hit floors, ceilings and
       angled walls. Explosions measure distance in 3D.
7. [x] **Enemies.** Monsters follow floor heights, and pathfinding knows
       how high they can climb. Flying enemies hover at their own height.
8. [x] **Tools.** The validator checks reachability with step and jump
       heights. The map viewer shades by height and draws angled walls. Add
       tests.
9. [ ] **Gate:** a sandbox map with stairs, a pit, a lift, a vent, a jump gap,
       a sniper on a ledge and chamfered corners. It must run near 60 fps on a
       phone.

Grid limits we accept: no rooms stacked over rooms, and no sloped floors.
Dark Forces had no slopes either. Walls can be at angles (step 5), but each
tile holds at most one wall line.

## Phase 2: Dark Forces systems

- [ ] A mission briefing screen (scrolling text over a picture) before each
      level.
- [ ] Mission objectives. The exit only works once they're done.
- [ ] A PDA screen with the map and an objectives checklist.
- [ ] Lives and checkpoints instead of saves, with extra-life pickups.
- [ ] HUD overlay: a full-screen view instead of the bottom status bar, with
      shield and health readouts in the corners, plus ammo and lives.
- [ ] **TODO: fill the whole screen (widescreen).** Today the game draws a
      fixed 320×200 frame shown at 4:3, with black bars on wider screens
      (`gfx/present.js` `resize()`).
      - Keep today's 4:3 view as the guaranteed centre: the same vertical
        view, the same 90° field of view in the middle 320 columns. On a
        wider screen, draw more world at the left and right edges instead of
        bars.
      - The framebuffer stays 200 px tall, and its width follows the window:
        320 at 4:3, about 427 at 16:9, wider on ultrawides. Cap it around
        21:9, and use bars past that.
      - The horizontal field of view grows with the width, so nothing in the
        centre moves or changes size.
      - This means making `SCREEN_W` / `VIEW_W` (about 47 uses) a runtime
        value. The per-column buffers (`zbuf`, the sprite clip windows, sky
        columns), the renderer, the weapon sprite, the CRT shader and the
        touch layout all follow.
      - The HUD, menus and full-screen pictures (title, briefing,
        intermission) stay laid out for the centre 320 columns, so nothing
        important is cut off on 4:3. Their backgrounds extend or tile to the
        edges.
      - Taller-than-4:3 screens keep their bars (we already ask phones to
        turn sideways).
      - The cost grows with the width: about 33% more columns at 16:9.
        Re-check the Phase 1 phone performance target.
      - Do it together with the HUD overlay above, since both rework the
        screen layout.
- [ ] Visible blaster bolts for both enemies and the player: slow and
      dodgeable, with inaccurate stormtroopers.
- [ ] **TODO: smarter enemies around heights** (left over from Phase 1
      step 7):
      - Monsters with no walking route to the player hold still and shoot
        when they can see them. Today they walk at the player and stall
        against the ledge face.
      - A sniper on a ledge holds its position instead of pacing along the
        edge.
      - Monsters ride lifts on purpose: wait for one, step on it and ride it
        to the player's level. Today they only end up on one by accident.
- [ ] A headlamp that drains batteries, infrared goggles and a gas mask.
- [ ] Music that switches between exploration and combat tracks when enemies
      wake up, like iMUSE.
- [ ] Stretch goal: enemies drawn from 8 angles, rendered from the clay
      models.

## Phase 3: Content for the slice

- [ ] **Palette:** Imperial greys and gloss blacks, desert ochre, and
      glowing red and green bolts.
- [ ] **Enemies:** Stormtrooper, Imperial Officer (drops keycards),
      Commando, Probe Droid, and an original mini-boss (a prototype assault
      droid).
- [ ] **Weapons:** fists, blaster pistol, E-11-style rifle and thermal
      detonators.
- [ ] **Items:** shield units, med kits, batteries, power cells, red and blue
      keycards, and the objective item (a data tape).
- [ ] **Textures:** Imperial wall panels, light strips, grates, canyon rock
      and sand, and a night sky.
- [ ] **Sounds:** synthesized blaster shots, droid beeps and door hisses.
- [ ] **Music:** original marches in a Star Wars style.

## Phase 4: Mission 1 (the vertical slice)

The player is an original mercenary hired by the Rebellion, who infiltrates an
Imperial garrison in a desert canyon:

1. Start in an outdoor canyon with ledges and snipers.
2. Get in through a crouch vent.
3. Take a lift up to the barracks.
4. Find an officer carrying the red keycard.
5. Reach the data vault (objective 1: steal the data tape).
6. Overload the generator (objective 2). The lights fail, so the headlamp is
   needed.
7. Escape across a jump gap to the landing pad.

The mission has 2 or 3 secrets and uses every new engine feature at least once
on purpose. Then playtest, tune the ammo budget and difficulty levels, and
update the smoke test.

## Phase 5: Ship

- [ ] README, CI and GitHub Pages, the same as Raccoon Alex.
- [ ] Decide whether to build more missions.

## Risks

- **Renderer speed and sprite clipping** in pure JS. That's why Phase 1 ends
  with a performance check before any content work.
- **Blocky architecture** from the grid. Angled walls (Phase 1, step 5) help.
  Otherwise lean on height variety, lighting and texture detail.

## Progress log

- 2026-10-11: Plan written. Starting Phase 0.
- 2026-10-11: Phase 0 done: forked with history, renamed the package, added
  the README note. The package name `dark-forces-clone` is a working name, and
  the title is still to be decided.
- 2026-10-11: Phase 1 steps 1-3 done.
  - **Map data:** `floorZ`, `ceilZ`, `side` and `upper` in the legend, plus
    `floorHeights` / `ceilHeights` grids. Documented in MODDING.md.
  - **Renderer:** the new column renderer (`render/columns.js`) replaces
    `walls.js` and `flats.js`. Flat maps render the same as before (under
    0.25% of pixels differ, all floating-point rounding at texel edges).
    Sprites are clipped by ledges using a per-column window.
  - **Player:** jump (Space / A / JUMP), crouch (C / B / DUCK), gravity, eased
    step-ups, fall damage, and mouse / key / stick look by y-shearing (±70 px).
    Collision checks floor and ceiling heights, and solid things only collide
    when they overlap in height.
  - **Sandbox map:** `?map=sandbox`, a test map for all of this.
  - **Tools:** `tools/snapshot.mjs` renders the 3D view headlessly.
  - **Tests:** `tests/heights.test.js` covers stairs, ledges, jumping,
    falling, crouching and the camera. 59 tests and the smoke test pass.
  - **Speed:** about 1-2 ms per frame for the world on a desktop, versus
    0.8-1.2 ms before. Recheck on a phone at the Phase 1 gate.
  - **Notes for later steps:**
    - Monsters snap to the floor and can walk off ledges (step 6 adds
      drop-off limits).
    - Hitscans and projectiles are still 2D (step 5).
    - The validator's reachability ignores heights (step 7).
    - Doors are still the sliding panels; rising doors and lifts are step 4.
- 2026-10-11: Added Phase 1 step 5, angled walls, after doors and lifts. It
  uses a line-in-tile data model, with the 45° presets first. Later steps
  renumbered 6-9. Height granularity, for reference:
  - heights are floats, so any value works
  - the grids use `heightStep` (default 1/8) times `0`-`z` plus `heightBase`
  - multiples of 1/8 keep textures aligned
- 2026-10-11: Phase 1 step 4 done.
  - **Rising doors** (`style: 'rise'`): the door tile's ceiling animates up
    to the lowest neighbouring ceiling. The lintel above it keeps its own
    `upper` texture. The shared doors now rise; the split elevator door stays.
  - **Lifts** (`lift: { stops, mode, speed, wait, on, moves }`) have three
    modes: return (the default), toggle and cycle. Riders move with the
    floor, a lift turns back instead of crushing, and `moves: 'both'` makes a
    closed cab. They start when you step on them, press use, or a trigger
    runs the new `lift` action.
  - **Sounds:** `lift-start` and `lift-stop`.
  - **Sandbox:** a rising door, a lift up to the sniper ledge, and a lift out
    of the pit.
  - **Tests:** `tests/lifts.test.js` (6 tests), plus a rising-door ray test.
    66 tests and the smoke test pass. Checked in a real browser too.
- 2026-10-11: Added a Phase 2 TODO: fill the whole screen on widescreen
  displays. Keep the 4:3 centre and draw more world at the edges (Hor+),
  instead of black bars.
- 2026-10-11: Phase 1 step 5 done: angled walls.
  - **Data:** `world/slants.js`. A tile holds one line with a solid side:
    `diagonal: 'NE' | 'NW' | 'SE' | 'SW'` presets, or a general `line: [ax,
    ay, bx, by]` with points on the tile edges. It's open floor on the other
    side.
  - **Renderer:** walls drawn where the ray crosses the line, plus the back
    face when a ray enters through the solid side. Texture spacing stays true
    along the line.
  - **Physics:** rays (sight, use, hitscans) stop at the line. Collision is
    circle against the clipped solid polygon. Players and monsters slide along
    angled walls (the move turned 45° each way). Projectiles burst on them.
  - **Maps:** the automap draws the lines, and the map viewer fills the
    solid side.
  - **Fix found on the way:** sliding treated a near-zero axis component
    (cos 90° ≈ 6e-17) as a successful slide.
  - **Sandbox:** chamfered corners in all three areas, a two-tile 26.6° wall,
    a diamond pillar and a triangular block.
  - **Tests:** `tests/slants.test.js` (6 tests). 72 tests pass. Checked in a
    real browser too.
  - **Still to do:** two-sided lines (a diagonal ledge between two floor
    heights) and the validator's view of the solid part. Reachability treats
    slant tiles as open for now.
- 2026-10-11: Fixed items being picked up by jumping over them. Pickups now
  need vertical reach: from 0.15 below the feet up to the top of the body.
- 2026-10-11: Named the game **Rogue Contract**.
  - Renamed the page title and link preview, the package, the README header,
    the smoke-test subpath and the content pack's `game` id and title.
  - The storage prefix is now `rogue-contract`, so it doesn't share saved
    settings with Raccoon Alex on the same github.io origin.
  - The local folder is still `C:\Mark\dark-forces-clone`.
- 2026-10-12: Published.
  - Public repo: https://github.com/mjvdw13/rogue-contract (remote
    `origin`; `upstream` still points at the local raccoon-alex).
  - GitHub Pages serves `main` from the root at
    https://mjvdw13.github.io/rogue-contract/. The CI workflow runs on every
    push.
  - Commits use only the GitHub no-reply identity, never a real email.
- 2026-10-12: Renamed the local folder to `C:\Mark\rogue-contract`.
- 2026-10-12: Phase 1 step 6 done: 3D combat.
  - **Trace:** `traceRay3D` in `world/physics.js` walks the height grid in
    3D. It stops at walls, door panels, angled walls, step faces, floors and
    ceilings. Rising doors are just their tile's ceiling. It also reports
    when a ray goes into the sky.
  - **Aim:** `combat/aim.js`. The player fires from the eye along the view
    pitch. Gentle vertical auto-aim bends a shot by at most 0.12 slope (about
    7°) onto a monster already in line horizontally. AUTO AIM in Options
    turns it off. Monsters fire from 60% of their height at the middle of
    their target. Every attack kind gets `opts.aim = { z, slope }`.
  - **Hitscans** hit bodies as 3D cylinders. Puffs land where the shot
    struck, and shots into the sky leave nothing.
  - **Projectiles** fly with vertical speed. Their z is now the sprite's
    centre. They burst on floors, ceilings and step faces, and vanish into
    the sky. Lobs land at the target's height. `defineProjectile`'s `z` is
    now optional: a start height above the owner's feet.
  - **Explosions** measure 3D distance to the nearest point of each body,
    and floors and ledges block them. **Melee** only reaches bodies at
    about the same height.
  - **Sight:** monsters see in 3D (from their fire height to the target's
    middle or head), so a ledge hides you when you stand under its edge.
  - **Tests:** `tests/combat3d.test.js` (11 tests). The chaos test now checks
    that something woke during the run, since monsters sleep again if the
    player dies. 84 tests, the validator and the smoke test pass. Rocket
    flight was checked in headless renders.
  - **Still to do:** step 7 (monsters walk off ledges, and flying monsters
    still snap to the floor).
- 2026-10-12: Phase 1 step 7 done: enemies and heights.
  - **Ledges:** walking monsters and friendlies follow Doom's dropoff rule.
    They won't stand straddling a drop deeper than their `dropHeight`
    (default: their step height), so they don't walk off ledges or hang over
    edges. Knockback can still push them off.
  - **Gravity:** monsters, friendlies, corpses and loose things fall to the
    floor instead of snapping down. They still step straight up.
  - **Routes:** the flow field plans per kind of body (step, drop, height,
    flying). `world.navFor(m)` keeps one field per profile, so a 1.1-tall
    beetle won't plan through a 0.9 vent that an ant fits. Diagonals don't
    cut corners across drops. Fields refresh every 0.25 s while a lift
    moves. Monsters go straight at a visible player only when the route
    isn't a long way round.
  - **Flyers:** `flying: true` monsters hover `z` above their target's floor,
    climb over raised floors ahead at `flySpeed`, and drop when they die. The
    firefly flies now (`z: 0.35`) as the test flyer.
  - **Tests:** `tests/enemies.test.js` (5 tests). 89 tests, the validator and
    the smoke test pass. With 70 awake monsters on e1m3, a tick costs about
    1.13 ms against 1.02 ms before.
  - **Not done:** monsters don't ride lifts on purpose, and one that can't
    reach the player just heads toward them and gets stuck at the ledge
    face. A sniper on a ledge paces along its edge.
- 2026-10-12: Recorded the rough edges from step 7 as a Phase 2 TODO
  (smarter enemies around heights).
- 2026-10-12: Phase 1 step 8 done: tools.
  - **Reachability** (`tools/lib/levelcheck.mjs`) searches standing spots
    (a tile at one of its floors, so each lift stop counts) using the hero's
    body. It handles 0.4 steps, jumps up to about 0.78 (less under a low
    ceiling), any drop, crouching through 0.5, lifts to every stop, and
    running jumps over gaps of up to two tiles. `canCross` and `bodyLimits`
    are exported for tests.
  - **One-way areas:** spots you can reach but can't get back to the start
    from, found by walking the moves backwards. `validate --verbose` lists
    them.
  - **Map viewer:** floors are shaded by height, with black edges for
    ledges too high to walk up, grey ones for steps, orange frames for lifts
    and cyan ones for crouch-only spaces. Angled walls were already drawn in
    step 5.
  - **Found on the way:** the sandbox's start-room window (sill 0.45,
    ceiling 1.05) can't be climbed through, which matches the game. You can't
    jump while crouched, and standing doesn't fit.
  - **Tests:** `tests/reach.test.js` (6 tests). 95 tests, the validator and
    the smoke test pass.
  - **Still rough:** angled-wall tiles count as fully open for reachability,
    so a gap squeezed between two angled walls isn't checked.
