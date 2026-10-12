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

## Phase 1b: Look and feel (the current work)

Why: after the first Star Wars content pass (2026-10-12), Mark's verdict was
"low quality Star Wars knock-off, not real Star Wars". The textures are low
quality, the map geometry is blocky, and the enemies look like fake
characters, not hand-drawn art.

Decided (2026-10-12):

- **Claude does:** the finer grid (A), the real Mission 1 map (B), and
  better placeholder textures plus an import pipeline (C).
- **Outsourced later (D):** enemy and weapon sprites (a sprite artist, or 3D
  models rendered in Blender), probably hero textures, sound effects and
  music.
- **Order:** A, then B, then C. The Phase 1 gate (step 9) runs after A, on
  the converted sandbox.

### A. Finer grid: half-size tiles (do first)

Goal: walls, pillars, trims and steps half as thick as now, so rooms stop
looking like stacked boxes.

Approach: the engine keeps "1 tile = 1 world unit". Everything measured
against the tile doubles instead (a world scale of 2): bodies, speeds,
heights, ranges and texture density. A person becomes about two tiles tall,
and a corridor about two tiles wide. This leaves the geometry code (DDA,
renderer, collision) alone.

1. [x] **Audit** (2026-10-12). The tile-scale numbers to double (×2) or
       halve:
       - **Textures (`render/columns.js`).** Textures repeat once per unit.
         Flats use `world * tex.w`. Walls use `v = (anchor - camZ) * th`,
         and `u` is the fraction inside the tile (`face()` wants `u` in
         0..1). Slants use `u` in units. Door panels use `du` inside the
         tile. Change all of these to world units × `TEXELS_PER_UNIT` (64
         → 32), with `face()` taking `u` in world units. Sprites already
         use `TEXELS_PER_UNIT`.
       - **`config.js`.** `EYE_HEIGHT` 0.5.
       - **`player.js`:**
         - `BODY`: height 0.85, eyeHeight, crouchHeight 0.5,
           crouchEyeHeight 0.3, stepHeight 0.4, airStep 0.15, jumpSpeed
           4.2, gravity 14, fallDamageSpeed 9. Halve fallDamagePerSpeed 8.
         - View easing: step-up threshold 0.06, eye ease `dt * 2.5`,
           landing `impact > 3 / > 6`, `min(0.2, impact * 0.02)`, recovery
           `max(0.6, ...)`, bob 0.018, dead eye `0.1` and `dt * 0.9`, and
           the velocity cutoff 0.005.
       - **`world.js`.** `USE_RANGE` 1.3, `PICKUP_BELOW_FEET` 0.15,
         `GRAVITY` 14, the `_slide` sub-step 0.2, and the default player
         radius and height.
       - **`nav.js`.** `WALKER` step 0.4, drop 0.4, height 0.85.
       - **`monster.js`:**
         - Default ranges: sightRange 40, attack range 40, melee range 1.1.
         - Movement: speed 2, the `d < 5` direct rule, the door probe
           `+0.35`, strafe `d > 2`.
         - Flying: hover reach `+0.3`, flySpeed 1.5.
         - Momentum cutoff 0.01.
       - **`combat`:**
         - `aim.js`: `MISSILE_DROP` 0.1, and the auto-aim margin
           `min(0.1, ...)`.
         - `damage.js`: `PUFF_INSET` 0.06, the hitscan pullback 0.06, the
           z jitter 0.04, the default blast z `+0.4`, the inset
           `min(0.1, ...)`, `MELEE_REACH_Z` 0.25, and knockback
           (`0.02` / cap 1.2; player `0.004` / cap 0.35).
         - `attacks.js` and `defs.js`: default ranges (hitscan 48, melee
           1.1).
       - **`projectile.js`.** `STEP` 0.1, `CLEARANCE` 0.05, the burst
         pullback 0.15, the launch offset `+0.05`, the lob distance 6, and
         the `+0.1` lob fudge.
       - **`defs.js` defaults.** Thing radius 0.25 and height 0.8; monster
         speed 2, radius 0.3 and height 0.85; npc radius 0.28, height 0.85,
         speed 1.1 and wander 3; item radius 0.3 and height 0.4; decoration
         radius 0.25 and height 0.8; projectile speed 10, radius 0.12 and
         height 0.25.
       - **Lifts.** Default speed 1.5. (Doors open by fraction, so they're
         unaffected.)
       - **Lighting (`view.js`).** `DIMINISH` 20 (brightness at 1 unit),
         the `d < 0.25` clamp, and level `fog`, which is per unit, so it
         halves.
       - **Audio.** `NEAR` 1.6 and `FAR` 24.
       - **Raycasting.** `castRay` and `traceRay3D` default maximum 64, and
         the renderer's `MAX_STEPS` 160.
       - **Other engine numbers.** Noise `maxSteps` 26, the npc height clamp
         `0.82`, and levelcheck `MAX_GAP` 2. Check the automap zoom by eye.
       - **Content.** The hero (radius, walk and run speed), and every
         monster, item, decor and projectile radius, height, speed, `z`,
         range and explode/splash radius. Every level's heights, lift
         stops, `heightStep` and `fog`.
       - **Unchanged:** slopes (auto-aim, pitch), screen-space sizes
         (weapon bob, the HUD), and times.
2. [ ] **World-space texture mapping.** Today each tile shows a full 64 px
       texture (`render/columns.js`: `u = wx - floor(wx)`, and flats likewise).
       Map textures by world position instead, for walls, floors and
       ceilings, step faces, angled walls and door panels. Make
       `TEXELS_PER_UNIT` 32, so a 64 px texture spans 2 tiles (the same real
       size as today). Sprites use the same constant, so they come out the
       right size.
3. [ ] **Scale everything else ×2:**
       - **Player:** the hero body (height, eye, crouch, step, airStep,
         radius), walk and run speed, jump speed and gravity (both ×2: the
         jump is twice as high, with the same airtime), fall-damage speeds,
         view bob.
       - **Enemies and combat:** monster radius, height, speed,
         `stepHeight`, `z` and `flySpeed`; projectile speed and radius;
         attack, melee, sight and use ranges; splash and explode radii.
       - **Engine constants:** `PICKUP_BELOW_FEET`, `MELEE_REACH_Z`,
         `CLEARANCE`, `MISSILE_DROP` and `PUFF_INSET`; `castRay` maximum
         distances; the nav `WALKER` profile; levelcheck `MAX_GAP` (2 → 4
         tiles).
       - **World and presentation:** lift and door speeds, fog and light
         falloff per tile (halve), audio falloff distances, noise steps
         (26 → 52), automap zoom.
4. [ ] **Doors.** A doorway must now be 2+ tiles wide. Group adjacent door
       tiles of one glyph into one door that opens together, the way lifts
       group their tiles.
5. [ ] **Converter tool.** `tools/upscale-map.mjs` doubles an ASCII level:
       each glyph becomes 2x2, heights double, and thing positions double.
       Use it on the sandbox.
6. [ ] **Tests.** Most use tile positions and heights. Convert their test
       maps the same way, or rescale their numbers.
7. [ ] **Performance.** Rays cross about twice as many tiles. Time frames
       before and after (headless snapshots, and the browser fps counter).
       Note the result for the phone gate.
8. [ ] **Docs and check.** Update MODDING.md (heights, sizes), and check it
       in a real browser.

### B. Mission 1: the Canyon Garrison map (after A)

Build Phase 4's mission as a designed level, not a feature test. The
objectives and briefing (Phase 2) aren't in yet, so for now it ends at an
exit switch, with keycards.

Design rules (what makes it feel like Dark Forces):
- tall spaces, and catwalks over drops
- overlooks where snipers watch you
- angled walls everywhere
- varied ceiling heights, pools of light and dark corners
- a landmark in every area
- detail built as geometry: pillars, trims, consoles and window frames
- no long box corridors

1. [ ] Sketch first: write the area list (sizes, floor and ceiling heights,
       connections, landmarks) and an ASCII overview in `docs/mission1.md`.
2. [ ] Build it at the fine grid as `src/content/levels/m1.js`. It becomes
       the episode's level, and the sandbox goes back to being a test map
       outside the episode.
3. [ ] Lighting pass: light levels, flicker and light strips.
4. [ ] Enemies, items, skill variants and 2-3 secrets.
5. [ ] Validator, map viewer and screenshot review, then playtest.

### C. Better placeholder textures, and an import pipeline (after B)

1. [ ] Better generators: greebles, shadows baked into recesses, wear, colour
       variation, and more variants (6+ wall panels, trims, floor plates,
       lights). Decide on 128 px wall textures.
2. [ ] `tools/import-texture.mjs` for outside art: resize, snap to the
       palette, check the tiling, and write it into `assets/textures/`.

### D. To outsource (later; decide approach and budget with Mark)

- Enemy sprites, ideally from 8 angles with full animation sets. Either a
  sprite artist, or 3D models rendered by a Blender script Claude writes.
  This is closest to how Dark Forces did it.
- First-person weapon sprites.
- Hero textures: an artist, a licensed texture pack, or AI-generated images
  cleaned up.
- Recorded sound effects, and music (a composer or orchestral samples). The
  films' own sounds and music stay out.

### E. Leftovers from the first Star Wars pass

- [ ] HUD: the ARMS panel still shows slots 2-7, and the face panel is
      empty. Part of the Phase 2 HUD rework.
- [ ] The finale reuses the title and intermission pictures.
- [ ] MODDING.md and the README still describe Raccoon Alex content.
- [ ] The smoke test's screenshots 01-04 come out as a blank page with a
      broken-image icon, though its checks pass.

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
- 2026-10-12: First Star Wars pass (Phase 0's "replace the Alex content", and
  a start on Phase 3).
  - **Removed:** levels E1M1-E1M5, the coworkers, the bugs and the Pumpkin
    King, every weapon but fists, the office/basement/sewer textures, the
    old items, decor, music and the HUD face. The validator no longer
    requires a face.
  - **New art** (all generated in tools/art):
    - Imperial wall, floor, ceiling, door and switch textures, plus canyon
      rock, sand and a night sky.
    - A stormtrooper, an officer and a probe droid (a flyer that explodes).
    - Fists and a blaster pistol.
    - Med kits, shield units, power cells, energy packs and keycards.
    - Crates, fuel barrels, consoles and lamps.
    - Blaster bolts, a new title screen and an intermission backdrop.
  - **Content:**
    - The blaster fires visible projectile bolts on `energy` ammo. Troopers
      fire slower bolts you can dodge.
    - The sandbox is the only mission, rethemed as CANYON GARRISON.
    - A new original march, Star Wars-toned text, and the `mercenary`
      cheat.
    - The NPC tests use test-only friendlies (tests/fixtures/friendlies.js).
  - **Checks:** 82 tests, the validator and the smoke test pass.
  - **Still to do:**
    - The HUD: the ARMS panel still shows slots 2-7, and the face panel is
      empty.
    - The finale reuses the title and intermission pictures.
    - MODDING.md and the README still describe Alex content.
    - The smoke test's first four screenshots come out as a blank page with
      a broken-image icon. The checks still pass; not investigated yet.
- 2026-10-12: Mark reviewed the first pass. The verdict was "knock-off", not
  "real Star Wars". Planned Phase 1b (look and feel): the finer grid, then
  the Mission 1 map, then better placeholder textures. Enemy art, sound
  and music to be outsourced later. Starting Phase 1b step A1.

