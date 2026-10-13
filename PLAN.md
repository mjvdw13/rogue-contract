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
| Title | **Rogue Contract** (chosen 2026-10-11). Repo `mjvdw13/rogue-contract`, public, served by GitHub Pages. It also holds ripped Dark Forces art for local testing (Mark's decision, 2026-10-12; see Phase 1b D). "Star Wars" and "Dark Forces" stay out of the title. |
| Engine, revisited (2026-10-12) | **Stay on our height-grid engine.** Considered instead: The Force Engine (needs the original Dark Forces files, so it can only host a mod; desktop only), GZDoom (true sectors and slopes, but desktop only) and Godot with TrenchBroom (no grid limits, but a full rebuild). Fill the grid's visual gaps with 3D models (Phase 1b F). |
| Platforms (2026-10-12) | **Desktop browsers.** Phones are no longer a target: no phone performance gate, and touch controls aren't required. |
| Story, revisited (2026-10-13) | **Bad Paper, a prequel to Dark Forces** (`docs/story.md`), set a few months before Dark Forces' first mission. A licensed bounty hunter on Tatooine takes a contract that turns on them: the Canyon Garrison is an early field test of Mohc's Dark Trooper project, and its prototype is Phase 3's mini-boss. Calm missions, where enemies leave you alone until an alarm, alternate with combat. The tracking fob is a mechanic. Still the original hero, with no Kyle Katarn retelling. |
| Rights | A non-commercial fan game. All art, sound and music are generated or original. Nothing ripped from Dark Forces, and no note-for-note John Williams transcriptions. Exception (Mark's decision, 2026-10-12): the ripped Dark Forces enemy and weapon sheets in `assets/custom/` are used, on the hosted site too (see Phase 1b D). |

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
       a sniper on a ledge and chamfered corners. It must run near 60 fps in a
       desktop browser. (It was a phone target until 2026-10-12.)

Grid limits we accept: no rooms stacked over rooms, and no sloped floors.
Dark Forces had no slopes either. Walls can be at angles (step 5), but each
tile holds at most one wall line. 3D models (Phase 1b F) can add shapes the
grid can't (curves, ship hulls, machinery), but only as decoration: nobody
walks on or under them.

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
- **Added (2026-10-12):** F, 3D models, after C.
- **Added (2026-10-12):** G, widescreen, moved up from Phase 2. Done now,
  before B3.
- **Added (2026-10-12):** H, the corner HUD and a lower weapon, moved up
  from Phase 2. Done now, before B3.
- **Changed (2026-10-12):** Mark wants engine work next rather than more
  of Mission 1, so F (3D models) goes before B3-B5 and C.

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
2. [x] **World-space texture mapping** (done 2026-10-12, still at 64
       texels per unit; 4 sandbox views render pixel-identical). The switch
       to 32 comes with step 3. Today each tile shows a full 64 px
       texture (`render/columns.js`: `u = wx - floor(wx)`, and flats likewise).
       Map textures by world position instead, for walls, floors and
       ceilings, step faces, angled walls and door panels. Make
       `TEXELS_PER_UNIT` 32, so a 64 px texture spans 2 tiles (the same real
       size as today). Sprites use the same constant, so they come out the
       right size.
3. [x] **Scale everything else ×2:**
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
4. [x] **Doors.** A doorway must now be 2+ tiles wide. Group adjacent door
       tiles of one glyph into one door that opens together, the way lifts
       group their tiles.
5. [x] **Converter tool.** `tools/upscale-map.mjs` doubles an ASCII level:
       each glyph becomes 2x2, heights double, and thing positions double.
       Use it on the sandbox.
6. [x] **Tests.** Most use tile positions and heights. Convert their test
       maps the same way, or rescale their numbers.
7. [x] **Performance.** Rays cross about twice as many tiles. Time frames
       before and after (headless snapshots, and the browser fps counter).
       Note the result for the phone gate.
8. [x] **Docs and check.** Update MODDING.md (heights, sizes), and check it
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

1. [x] Sketch first: the area table, route, secrets and enemies are in
       `docs/mission1.md` (done 2026-10-12). Decided there: the map is
       painted in code by `src/content/levels/lib/painter.js`, not typed as
       ASCII.
2. [x] Build it at the fine grid as `src/content/levels/m1.js` (first build,
       2026-10-12). It becomes
       the episode's level, and the sandbox goes back to being a test map
       outside the episode.
3. [x] Lighting pass: light levels, flicker and light strips (done
       2026-10-12; the levels are in `docs/mission1.md`). Light is per tile (walls take the light of the tile in
       front of them), so pools of light and dark corners are painted as
       tiles.
       - [x] Fix hanging decorations and effects sizing themselves at 64
             texels per unit (leftover E): the ceiling lamps sit right.
       - [x] `snapshot.mjs --custom`: render with the Dark Forces art
             overrides, read from disk, for reviewing the look.
       - [x] Engine: `lightMin` in the legend (the low end of a tile's
             light effect, instead of always 96 below), and `setLight`
             taking an optional `lightFx`, so the overload can make the
             generator chamber flicker. Tests, MODDING.md.
       - [x] Canyon: a night (moonlit) base, a darker gorge and vent,
             shadow along the garrison face, floodlight pools under the
             gate's light strips, a dark secret alcove.
       - [x] Interiors: darker bases with bright pools under ceiling lights
             and lamps, dark chamfered corners, a broken flickering light
             in maintenance, monitor glow pulsing along the vault's
             computer banks.
       - [x] Generator: a dark shaft bottom, a slow pulse round the reactor
             column, light strips on the catwalk walls; the overload drops
             it to a dim flicker.
       - [x] The way out: a dark chasm, a floodlit pad, the pickup spot
             pulsing.
       - [x] Screenshots of every area before and after; tests, validator,
             smoke test.
4. [x] Enemies, items, skill variants and 2-3 secrets (done 2026-10-13).
       A first placement went in with the map: 20 monsters, 13 items and
       3 secrets, with only 4 things varying by skill and an empty vault.
       This pass makes the skills real and fills the gaps:
       - [x] Engine: a placed monster can carry its own `drops` (added to
             its type's), so the officer drops the red keycard, as Dark
             Forces' officers do. The validator and reachability check
             count keys dropped by reachable monsters. Tests, MODDING.md.
       - [x] Enemies by skill: fewer on 1-2, extra on 4-5 (bowl, gorge,
             maintenance, barracks, generator, pad). Guards for the vault
             (empty today).
       - [x] Items by skill: med kits where fights end (the bowl's strip,
             the gantry) on 1-3, the start bowl's useless med kit moved, a
             power cell in the vent.
       - [x] Secrets: check all 3 count once each and are reachable.
       - [x] A per-skill table in `docs/mission1.md`; the validator's
             counts, map viewer at skills 1, 3 and 5, tests, smoke test.
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
- Ripped art (e.g. Dark Forces sprites) goes in through
  `assets/custom/overrides.json`. The Dark Forces sheets are committed in
  the public repo with `assets/custom/DISCLAIMER.md` (Mark's decision,
  2026-10-12).
- [x] **The hosted site uses the Dark Forces art** (Mark's decision,
      2026-10-12). Overrides are read everywhere, not only on localhost;
      the smoke test still skips them. An override image that fails to
      load falls back to the committed art. Update the comment in
      `assets.js`, `assets/custom/README.md` and `DISCLAIMER.md`.
- [x] **Dark Forces textures** (Mark, 2026-10-12, from his texture pack
      zip). `assets/custom/textures.mjs` copies or composites one DF texture
      per generated texture into `assets/custom/textures/` and adds the
      overrides. Switches and key doors are DF wall/door art with DF's
      small switch and key panels laid on top. Texture overrides can change
      the frame count (the console is static). Review in screenshots of
      Mission 1, then tune the picks.
- [x] Key doors show their key panel once per 64x64 tile, so a big door
      shows it four times (fixed by Phase 1b L: door art is fitted to the door). Make door textures one panel per door (a
      128x128 door texture, or draw the panel only once per door).

### E. Leftovers from the first Star Wars pass

- [x] HUD: the ARMS panel still shows slots 2-7, and the face panel is
      empty. Both go with the corner HUD (H).
- [ ] The finale reuses the title and intermission pictures.
- [ ] MODDING.md and the README still describe Raccoon Alex content.
- [ ] The smoke test's screenshots 01-04 come out as a blank page with a
      broken-image icon, though its checks pass.
- [ ] The options menu doesn't fit: its 11 big-font rows need about 210
      px, so SHOW FPS is cut off at the bottom and the rows touch. Use the
      small font, or split it into sub-menus (video, controls).
- [x] Hanging decorations and effect sprites still size themselves at 64
      texels per unit (`world.js`: `sheet.fh / 64`). Since the finer grid
      it is 32, so ceiling lamps hang half their height into the ceiling.

### F. 3D models, like Dark Forces' 3DO objects (the current work, from 2026-10-12)

Goal: low-poly models drawn in true 3D inside the grid world (consoles,
crates, pipes, a reactor, a parked ship, mouse droids), clipped by walls and
ledges the same way sprites are. They hide the blockiness the grid can't
avoid. Mark chose this as the next engine work (2026-10-12), ahead of
multi-angle sprites, smarter enemies and dynamic lighting.

Decided (2026-10-12):
- **Model format:** `defineModel({ id, vertices, faces, lines? })` in a new
  `models` list in the content pack. Vertices are `[x, y, z]` in world units
  (tiles), the origin at the floor under the thing's centre; at angle 0 the
  model's axes are the world's (x east, y south, z up). Each face is a
  convex polygon `{ v: [i, j, k, ...], color, tex?, uv?, glow?, twoSided? }`,
  wound so the right-hand normal `(v1-v0) x (v2-v0)` points outward. `color`
  is `[ramp, 0..1]` or an RGB triple (snapped to the palette's lit colours
  at load); `tex` with per-vertex `uv` (in texture repeats) maps a texture.
- **Sorting with sprites: a depth buffer, not a shared far-to-near order.**
  Models draw after the walls and before the sprites, writing their depth
  per pixel; sprite pixels behind a model pixel are skipped. Models need no
  sorting among themselves either. The buffer is only cleared and checked
  in frames where a model drew.
- **Lighting:** the tile light at the model's position with the usual
  distance fade, plus a fixed light direction shading each face (up to a
  few colormap levels darker). `glow` faces are fullbright.
- **Generated models in code**, with a small builder (boxes, prisms,
  cylinders, with automatic winding), as content files in
  `src/content/models/`. `tools/import-model.mjs` converts a Blender OBJ
  (with its MTL colours) into the same format.

1. [x] **Renderer** (`render/models.js`):
       - Move vertices into camera space with the sprite transform.
       - Drop faces pointing away from the camera (world-space normal test,
         unless `twoSided`). Clip polygons at the near plane.
       - Fill polygons column by column, interpolating 1/depth (and u/depth,
         v/depth) along edges, so textures are perspective-correct.
       - Each pixel is checked against `zbuf` and the ledge windows
         (`segDist` / `segTop` / `segBot`) at its own depth.
2. [x] **Depth buffer with sprites** (`view.mdepth`), as decided above.
3. [x] **Model format and pipeline.** `defineModel`, registry and asset
       loading (colours to palette indices, texture slots), the builder,
       and `tools/import-model.mjs` for OBJ + MTL. Triangle budget: a few
       hundred per model.
4. [x] **Game integration.**
       - A decoration with `model`, placed with a facing angle; `scale` and
         an optional `spin` (radians per second).
       - Collision is the thing's cylinder for small models. Big ones list
         `lines` (wall segments in model space): circle-against-segment
         collision for movement.
       - Solid models stop hitscan shots and projectiles (a puff, no
         damage), using the cylinder or the lines.
5. [x] **Tools.** The map viewer draws model footprints. The validator
       checks model ids and texture names, and warns when a solid model
       blocks the route.
6. [x] **Tests and a showcase.** Unit tests for clipping and culling;
       headless snapshot checks (a model behind a ledge, beside a sprite,
       cut by the near plane). Then place a few in Mission 1: consoles, the
       generator and a ship on the pad. Time frames before and after.

Follow-ups found on the way:
- [ ] Monsters see and aim through models (line of sight only knows the
      map). Fine for low scenery; a ship or a tank should block sight.
- [ ] Pathfinding doesn't know about models: a monster can walk into a
      tank and stall, as with sprite crates today.
- [ ] Builder textures restart on each face of a cylinder (each face is
      projected on its own); wrap them round instead.
- [ ] Better showcase art: the shuttle is a placeholder shape. Models made
      in Blender (or by a modeller) are the real thing.

Later, if wanted: walkable model surfaces (a bridge you can cross or walk
under). That changes physics and pathfinding, which assume one floor per
tile, so it's a separate, larger job.

### G. Widescreen: fill the whole screen (done 2026-10-12)

Today the game draws a fixed 320x200 frame shown at 4:3, with black bars on
wider screens (`gfx/present.js` `resize()`). Moved up from Phase 2
(2026-10-12).

What it should do:
- Keep today's 4:3 view as the guaranteed centre: the same vertical view and
  the same 90 degree field of view in the middle 320 columns. On a wider
  screen, draw more world at the left and right edges instead of bars.
- The framebuffer stays 200 px tall, and its width follows the window: 320
  at 4:3, about 427 at 16:9, wider on ultrawides. Cap it at 21:9 (560), and
  use bars past that. Screens narrower than 4:3 keep bars top and bottom.
- The horizontal field of view grows with the width, so nothing in the
  centre moves or changes size.
- The HUD, menus and full-screen pictures (title, intermission, finale) stay
  laid out for the centre 320 columns, so nothing important is cut off on
  4:3. Their backgrounds extend to the edges. (The bottom status bar has
  since been replaced by the corner HUD, H.)
- An options toggle keeps the old 4:3 frame for anyone who wants it.
- The generated title and intermission pictures are painted 560x200, so
  they fill even a 21:9 screen. A 320-wide picture (from a mod) is mirrored
  and darkened at the sides instead.

How:
1. [x] **Runtime width.** `SCREEN_W` stays 320 and now means the 4:3
       layout width; the framebuffer's width is `surface.w`. The presenter picks the frame width from the
       window and reallocates its buffers and texture; the game resizes the
       framebuffer, the melt wipe and the view to match.
2. [x] **Renderer.** `View` sizes its per-column buffers (`zbuf`, the
       sprite clip windows, sky columns) to the width, and widens
       `planeLen` so the focal length stays at 320's. The weapon sprite
       stays centred.
3. [x] **2D layout.** `Surface` gets a draw origin (`ox`): all 2D drawing
       is offset so UI code keeps working in centre-320 coordinates.
       Full-width parts (screen shading, the automap, backgrounds, the
       status bar's sides, the FPS counter) are drawn across the whole
       width on purpose. Mouse clicks on menus map through the same origin.
4. [x] **Options.** A widescreen on/off toggle in the options menu, and
       `?wide=0` in the URL.
5. [x] **Tests and checks.** Unit tests for the width rule and for the
       centre view staying the same; the smoke test adds a 16:9 run. Check
       title, menus, level, automap, intermission and finale in a browser at
       4:3, 16:9 and 21:9, and time frames at 16:9 (about 33% more columns).

### H. Corner HUD and a lower weapon (done 2026-10-12)

Mark (2026-10-12): the weapon is far too high and hides the action. Move it
down, and replace the bottom status bar with readouts in the bottom left and
right corners only, like Dark Forces. Moved up from Phase 2.

1. [x] **Full-height view.** The 3D view fills all 200 rows (`VIEW_H` =
       `SCREEN_H`); the status bar art and its panel layout go.
2. [x] **Corner panels.** Left: SHIELD and HEALTH. Right: the current
       weapon's ammo and the keycards. Small generated panel art
       (`hud-left.png`, `hud-right.png`) with the big HUD digits. On
       widescreen they sit at the real screen corners. The ARMS, face and
       ammo-tally panels are dropped.
3. [x] **Lower weapon.** Weapons now sit on the screen's bottom edge (32
       px lower than above the bar). `weaponDrop` in the content config
       lowers every weapon further: 24 px, picked from screenshots.
4. [x] **Fix-ups.** The automap's level name and the respawn prompt move
       clear of the corner panels; check menus over the game.
5. [x] **Checks.** Tests, validator, smoke test; screenshots at 4:3 and
       16:9, with the generated and the Dark Forces weapons.

### I. A sandtrooper enemy (2026-10-12)

Mark gave an AI-generated asset sheet (sandtrooper with a T-21 repeating
blaster: front, side and back walks, aiming, hit reactions and two death
falls, on a blue backdrop, as a 1264x848 JPEG). Make it a new enemy.

Decided: the engine draws one view per frame (no rotations), so only the
front-facing poses are used. The art is drawn at the Dark Forces sprites'
density (about 37 px per unit, `scale: 0.85`), so a sandtrooper matches the
Dark Forces stormtrooper beside it. The sheet is our own art, not a rip, so
the cut sheet is committed straight into `assets/sprites/monsters/` (no
override); the source and the cutter live in `assets/custom/sandtrooper/`.

1. [x] **Cutter** (`assets/custom/sandtrooper/cut.py`, Python with Pillow
       and numpy, as JPEG decoding is needed): key out the blue with soft
       edges and remove the blue spill, then cut the frames. Figures whose
       rifle barrels run into the next figure are split along the barrel:
       the barrel goes to its owner, and the gap it leaves in the neighbour
       is filled from the surrounding pixels. Scale down with the alpha
       premultiplied, keep the body centred and the feet on the bottom row,
       and snap to the palette's lit colours (so armour highlights don't
       glow in the dark).
2. [x] **Frames:** walk (the six front-view cycle frames), aim and fire
       (the front "aiming" poses; fire gets a red muzzle flash in
       fullbright colours), pain (the first "taking damage" pose), death
       (the four-frame fall onto the back, captioned "aiming" on the
       sheet: all four poses stand apart, unlike the "faller" row).
3. [x] **Monster** `src/content/monsters/sandtrooper.js`: tougher and
       faster-firing than the stormtrooper (the T-21 is a repeating
       rifle): bursts of three bolts, 45 health (30 for a stormtrooper).
       Glyph `s`.
4. [x] **Placement:** a few in Mission 1's canyon (sandtroopers belong
       outdoors) and one in the sandbox.
5. [x] **Checks:** tests, the validator and the smoke test; screenshots
       of sandtroopers in game (walking, firing, dying).
6. [ ] Later, if wanted: the side and back views (walk cycles at four
       angles are on the sheet), once enemies are drawn from several
       angles (Phase 2 stretch goal).

### J. A Jawa (2026-10-12)

Mark gave a Jawa sprite sheet (1619x971 PNG, painted pixel-art style on a
blue backdrop: front, side and back walks, aiming and firing with a muzzle
flash, a hit-and-fall death and a slump death). Jawas are small: first
half an adult's height; Mark then asked for them up to a stormtrooper's
chest (1.25 units).

Decided: a hostile enemy (the sheet has aiming and firing poses): small
(1.25 tall, radius 0.3), weak and quick, firing slow ion bolts. Drawn at
the same pixel density as the other enemies, so a standing Jawa is about
47 px tall. Front-facing poses only, as for the sandtrooper. Its eyes and
muzzle flash keep their glow (snapped to fullbright colours).

1. [x] Move the sandtrooper cutter's shared steps into
       `assets/custom/sheetcut.py`; the sandtrooper's output must not
       change.
2. [x] `assets/custom/jawa/cut.py`: walk (front cycle, 6), aim and fire
       (the crouched pose with the flash), pain (the hunch), death (hit,
       falling, lying, dead). Every frame's feet (or body, lying down) on
       the bottom row.
3. [x] Monster `jawa`, an `ion-bolt` projectile, high chattering sounds,
       glyph `j`.
4. [x] A few in Mission 1's canyon, one in the sandbox; tests, validator,
       smoke test, screenshots beside a stormtrooper.

### K. See-through walls: railings, bars and grates (done 2026-10-12)

Mark chose this as the next engine work: Dark Forces' transparent mid
textures. The texture pack has about 30 textures with real transparency
(bars `ZWBARS`, the girder truss `ZMGRATE1`, the lattice `ICDELEV`, gates,
window frames, holo glass, blast holes). Its force field (`IFORCFLD`) is
opaque, so force fields need blending and come later.

Decided (2026-10-12):
- **Fences sit on tile edges.** A legend entry gets
  `fence: { tex, edges: 'NE', height? }`: the tile's north and east edges
  carry the texture. With `height` the fence stands that high on the
  tile's floor (a railing); without it, it runs floor to ceiling (bars). It
  rides a lift with its tile.
- **Rendering:** when a column's ray crosses a fenced edge it records the
  fence (distance, texture position, light, the rows still open) and keeps
  going. After the column's solid surfaces it draws its fences far to near,
  skipping transparent texels. Fence pixels write the per-pixel depth
  buffer the models use (`mdepth`), so sprites and models behind a bar are
  hidden and ones in front draw over it.
- **What they stop:** bodies (circle against the edge, only below the
  fence's top, so you can jump over a low railing). Sight, hitscan shots
  and projectiles pass through. Monster pathfinding won't cross a fenced
  edge (flyers cross low ones); the validator's reachability doesn't
  either.

1. [x] Engine: legend parsing and per-edge storage (mirrored on the
       neighbour), the renderer's fence pass and the shared depth buffer,
       collision, pathfinding.
2. [x] Tools: the validator (bad edges, a fence against a wall), the
       reachability check, the map viewer and automap draw fences, the
       upscaler splits them.
3. [x] Textures: generated placeholders with transparency (`imp-railing`,
       `imp-bars`, `imp-cage`), and the Dark Forces ones as overrides
       (`ZMGRATE1` squashed to a 0.75-tall railing, `ZWBARS`, `ICDELEV`).
4. [x] Mission 1: railings round the generator's catwalk ring and along its
       bridges, a barred window from the barracks corridor into the
       officer's office, a storage cage round the maintenance crates.
5. [x] Tests (rendering, depth against sprites, collision, jumping a low
       railing, pathfinding, shots passing), MODDING.md, screenshots, the
       validator and smoke test.

Later: see-through doors (a barred gate that rises), force fields (a
blended or stippled texture that blocks or hurts), decals on solid walls,
and fences in the middle of a tile or at an angle. More of the pack's
see-through textures (gates, window frames, holo glass, blast holes) can
go in as fence textures when a level wants them.

Found on the way:
- [ ] A second `Registry` built from the same content pack finds no sprite
      sheets: the first one replaces each def's inline `sheet` with a
      `{ ref }` in the shared content objects. Only tools that build two
      registries hit it; copy the defs instead of changing them.

### L. Doors you can find (done 2026-10-13)

Mark: doors are hard to find (a door tile looks like any other wall), and
they're too thick (the whole doorway, a full tile or two, rises as one
block). He liked the older doors, which sat inset into the wall. Use the
proper door textures from the texture pack.

Research:
- **The older doors** (before `698b326`, Raccoon Alex's Wolfenstein kind)
  were a thin panel through the middle of the door tile, so they sat half a
  tile back from the wall face, with jamb texture on the doorway's sides.
- **Dark Forces doors** are a thin door sector set back in the doorway.
  The frame doesn't move: the sides are jamb textures (light strips and a
  small control panel), and the wall continues above the door as a lintel.
  The door texture moves up with the door's ceiling, so it slides up into
  the lintel. A DF door texture is one whole door: `IDDOOR1` (SecBase's grey
  X-braced door) is 64x64, which at our 32 texels per unit is 2 wide by 2
  tall (the player is 1.7). Today's 3-4 wide, 4-6 tall M1 doors tile it 2x2
  and more, so a door reads as wall panelling.
- **The films:** Imperial doors are thin slabs that drop or rise like a
  guillotine (or slide sideways), set in a deep frame.
- **The pack's door art:** doors `IDDOOR1` (= `ZDIMPER1`), `ZDIMPER4/5`
  (the big dark door with the red ring), `IDBLKDOR` (a round blast door,
  128x128), `ZDBIGDR1-4`; jambs `IDJAMPNL` (32x64: a blue light strip and a
  control panel, exactly one tile wide), `IDJAMLCY`, `ZDJAML2Y`; the lintel
  strip `IDJAMLCX` (a horizontal row of blue lights).

Decided:
- **Rising doors become a thin panel set back in the doorway.** The door
  tiles are an open recess (floor, a lowered ceiling at the door's top, the
  jamb texture on its sides). The panel stands across the middle of the
  doorway's depth (in a 2-deep M1 doorway that's 1 tile back from each
  face) and rises into the lintel, its texture moving with its bottom edge.
  The room's wall above the opening is the lintel face (`upper`).
- **One door texture per door.** The panel's texture is anchored to the
  doorway (centred across it, bottom edge up), not to world position, so a
  door shows its art once, and key panels show once (closes the Phase 1b D
  item).
- **Collision, sight and shots use the panel**, not the whole tile: you can
  step into the recess, shots and projectiles stop at the panel (3D shots
  pass under a half-open door), and a door won't close on a body in its
  panel's way. Slide, split and secret doors are unchanged.
- **Mission 1's doors resized to the art:** standard doors 2 wide, 2 tall
  (`IDDOOR1`), with a lit lintel and jambs; the main gate a 4x4 blast door
  (`IDBLKDOR`).

1. [x] Engine: the panel plane and span per door group, the renderer's
       panel (partly open: it draws the panel and narrows the window, and
       the ray goes on below it), `castRay` / `traceRay3D` / body collision /
       projectiles against the panel, closing checks bodies at the panel.
2. [x] Textures: `imp-lintel` (new), `imp-gate` (new), `imp-jamb` and the
       doors; generated placeholders and the DF overrides (`IDJAMPNL`,
       `IDJAMLCX` strip, `IDBLKDOR`).
3. [x] Mission 1 and the sandbox: doors 2 wide and 2 tall with lintels, the
       gate 4x4.
4. [x] Tests (panel position, a body in the recess, shots under a half-open
       door, texture once per door), MODDING.md, screenshots before and
       after, validator and smoke test.
5. [x] Faster doors (Mark: "This is Star Wars!"): open and close in under
       0.3 s instead of about 0.6, with shorter, snappier whoosh sounds.
6. [x] Half-depth jambs (Mark, 2026-10-13): a jamb's depth is half the
       wall's thickness, so thin the walls at Mission 1's doors to 1 tile
       (the panel in the middle, jambs half a tile deep). No engine change:
       1-deep doorways already work. The main gate stays deep.
       - [x] Bunk room and office grow a row south; the barred window's
             sill is 1 deep too.
       - [x] The red door: the corridor runs one tile further east.
       - [x] The generator door: the vault grows a row south (its screens
             and chamfers move with it); the door's one tile shows the
             computer banks above it on both sides.
       - [x] The escape hatch: a one-tile landing outside it, at the top of
             the gantry.
       - [x] Jambs: `imp-jamb` becomes half a tile wide (16 texels, the
             middle of IDJAMPNL with its light strip); the gate keeps the
             full IDJAMPNL as `imp-gate-jamb`.
       - [x] Screenshots, tests, the validator and smoke test.

## Phase 2: Dark Forces systems

- [ ] A mission briefing screen (scrolling text over a picture) before each
      level.
- [ ] Mission objectives. The exit only works once they're done.
- [ ] A PDA screen with the map and an objectives checklist.
- [ ] Lives and checkpoints instead of saves, with extra-life pickups.
- [ ] Lives on the HUD, once lives exist (the corner HUD itself is Phase 1b
      H).
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
      droid: an early Dark Trooper test, see `docs/story.md`).
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
- **Blocky architecture** from the grid. Angled walls (Phase 1, step 5) and
  3D models (Phase 1b F) help. Otherwise lean on height variety, lighting
  and texture detail.

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
- 2026-10-12: Phase 1b A3 and A5 are in progress on branch `finer-grid`
  (not merged; `main` is still the coarse grid).
  - **Done on the branch:**
    - All the engine and content numbers from the A1 audit are doubled:
      `TEXELS_PER_UNIT` is 32, and the default ceiling (2), height step
      (0.25) and fog (0.15) changed too.
    - The converter (`tools/lib/upscale.mjs` and `tools/upscale-map.mjs`)
      works, and the sandbox has been converted with it (`DD` is now a 2x2
      door).
  - **Next:**
    1. A4: the validator rejects the 2x2 door ("needs walls on two opposite
       sides"). In `world/level.js` (around line 197), count neighbouring
       door tiles of the same glyph as part of the door, and group them (a
       `door.group` that `openDoor`/`closeDoor` in `world/doors.js` apply
       together, like lifts).
    2. A6: fix the tests. They still use coarse-grid positions and heights.
       Upscale their test maps with `upscaleLevel` and double their
       coordinates and heights.
    3. A7 (performance) and A8 (docs: MODDING.md heights and sizes, and a
       browser check), then merge into main.
- 2026-10-12: Phase 1b A (the finer grid) done, merged from `finer-grid`.
  - **Scale:** the world is measured at twice the old scale. A tile is half
    a metre. The player is 1.7 tall with radius 0.5, and textures and
    sprites use 32 texels per tile.
  - **Doors:** neighbouring door tiles of one glyph form a group that opens
    and closes together.
  - **Collision fixes found on the way:**
    - Things spawned with their body in a wall are nudged clear.
    - A box that only touches a tile edge no longer counts as being in that
      tile.
    - A walking body may hang 0.15 over a drop edge (`OVERHANG`).
    - Walking humans are radius 0.5, so they fit one tile and can take
      stairs. At 0.56 they stalled on the stair edges.
  - **Tests:** the `coarse()` and `fine()` test helpers draw maps the old
    way and upscale them. `tests/finegrid.test.js` covers the converter,
    door groups and unsticking. 85 tests, the validator and the smoke test
    pass.
  - **Performance:** desktop, headless, average over 5 sandbox views: 1.47
    ms per frame before, about 1.8 ms after (+25%). Recheck at the phone
    gate.
  - **Next:** Phase 1b B, the Mission 1 map. Start with the sketch in
    `docs/mission1.md`.
- 2026-10-12: Phase 1b B2: first build of Mission 1 (`m1`).
  - **The map:** painted in code by `levels/lib/painter.js` (rects,
    chamfers, angled pillars, stairs, and dedupe into glyphs), 128x100. It's
    now the episode's level; the sandbox stays a test map.
  - **The route:** all 17 areas from `docs/mission1.md`, with 3 secrets, the
    red keycard, and the overload switch that opens the escape hatch. The
    exit is a marked pickup spot on the pad (a full-height switch column
    looked wrong).
  - **Fixes found on the way:**
    - The generator's bridges reach down to its floor and split the bottom
      in two, so the east half got its own lift (L2b).
    - Lift L2 has to touch the catwalks. The validator's one-way check
      caught both.
    - The chaos test now starts beside the farthest enemy, since a far item
      can be in a sealed room.
  - **Checks:** the validator is clean, and 87 tests and the smoke test
    pass.
  - **Next:**
    - B3 lighting pass: the generator is still dim, and the canyon is flat.
    - B4 enemy and item tuning: ammo is 15x the budget, far too generous.
    - B5 playtest in a browser.
- 2026-10-12: Local art overrides. `assets/custom/overrides.json` (ignored by
  git) swaps a committed asset for a local file, optionally with its own frame
  size and a draw `scale` (sheets now carry `scale`). It is only read on
  localhost, never under test automation. Mark's ripped Dark Forces
  stormtrooper, Imperial officer and probe droid sheets are cut locally by
  `assets/custom/cut.mjs` into the 12-frame monster layout and drawn at scale
  0.85. The same script cuts the weapons sheet into the fists and the blaster
  (the Bryar pistol), drawn 1:1 and padded into Dark Forces' screen positions.
  The public build keeps the procedural enemies and weapons.
- 2026-10-12: Engine review. Mark worried the grid limits the maps, so we
  compared The Force Engine, GZDoom and Godot (see Decisions). We're staying
  on our engine and adding 3D models (Phase 1b F). Phones are dropped as a
  target, and the Phase 1 gate now means a desktop browser.
- 2026-10-12: The ripped Dark Forces sheets, `cut.mjs` and `overrides.json`
  are committed in `assets/custom/`, with `DISCLAIMER.md` (Mark owns the
  game; don't redistribute). The repo stays public: Mark's decision.
- 2026-10-12: Phase 1b G: widescreen, moved up from Phase 2 and done.
  - **How:** the presenter picks the frame width from the window's shape
    (`screenWidth()` in `config.js`: 320 at 4:3, 426 at 16:9, capped at 560
    for 21:9). The game resizes the framebuffer and the melt wipe to match,
    and the view resizes its column buffers. The focal length stays at
    320's, so the centre 320 columns are exactly the old 4:3 view.
  - **2D layout:** `Surface.ox` is a draw origin that centres the
    320-column layout, so the HUD, menus and pictures needed few changes.
    Shading, the automap and the status bar's frame span the full width.
  - **Art:** the title and intermission pictures are generated at 560x200.
  - **Options:** a WIDESCREEN toggle and `?wide=0`. The TOUCH PAD row is
    gone (phones aren't a target), so the menu has its old 11 rows.
  - **Checks:** `tests/widescreen.test.js` (4 tests), and a 16:9 / 21:9 /
    4:3 pass in the smoke test. 91 tests, the validator and the smoke test
    pass. Screenshots of the title, menus, level, automap, intermission and
    finale at 4:3 and 16:9 look right.
  - **Speed:** in headless Chromium, the 3D view takes 2.8-3.4 ms at 320
    columns and 4.2 ms at 426, well inside a 60 fps frame.
  - **Found:** the options menu was already too tall for the screen (added
    to E).
  - **Next:** B3, the lighting pass.
- 2026-10-12: The hosted site now uses the Dark Forces art (Mark's
  decision). Overrides were only read on localhost, so the pushed sheets
  never showed on GitHub Pages. Now `overrides.json` is read everywhere
  except under test automation. An override image that fails to load falls
  back to the committed art. Checked under the `/rogue-contract/` subpath
  with the automation flag hidden: all five overrides load, and a blocked
  stormtrooper sheet falls back. 91 tests and the smoke test pass.
- 2026-10-12: Phase 1b H: the corner HUD and a lower weapon (Mark: the
  weapon hid the action).
  - **HUD:** the status bar is gone and the 3D view fills all 200 rows.
    Two generated panels sit in the bottom corners (the real screen
    corners on widescreen): SHIELD and HEALTH on the left, the weapon's
    ammo and the keycards on the right. ARMS, the empty face panel and the
    ammo tally are dropped.
  - **Weapon:** it now stands on the screen's bottom edge (32 px lower),
    plus `weaponDrop: 24` in `content/config.js` for every weapon: 56 px
    lower in all. Checked with the generated and the Dark Forces art.
  - **Fix-ups:** the automap's level name and the respawn prompt sit above
    the panels.
  - **Checks:** 91 tests, the validator and the smoke test pass;
    screenshots at 4:3 and 16:9.
  - **Next:** B3, the lighting pass.
- 2026-10-12: Dark Forces textures, from Mark's texture pack zip (918
  textures, all power-of-two sizes, at about our texel density).
  `assets/custom/textures.mjs` maps all 21 generated textures to DF ones
  (SecBase walls and doors, Generic floors and lights, Talay's night sky)
  and composites the switches and key doors from DF's small switch and key
  panels. Texture overrides can now change the frame count (the console is
  a still picture). The dirt floor (ZPDIRT01) snapped to blood red in our
  palette, so the canyon floor is SecBase's grey rock (IPSEC1), matching the
  grey cliffs. Reviewed in screenshots of 13 spots in Mission 1. Found: key
  panels repeat on big doors (logged in Phase 1b D).
- 2026-10-12: Phase 1b I: a sandtrooper enemy, from Mark's AI-generated
  asset sheet. `assets/custom/sandtrooper/cut.py` (Python, Pillow) keys out
  the blue backdrop with soft edges, unmixes the blue fringe, splits the
  walk and hit-reaction rows where each rifle's barrel crosses the next
  pose (barrel tips measured by hand; the hole in the neighbour is filled
  from around it), scales to the Dark Forces sprites' density (13 frames
  of 58x68, `scale: 0.85`) and snaps to the palette's lit colours. The
  fire frame gets a red muzzle flash. The monster fires 3-bolt bursts and
  has 45 health. Two canyon stormtroopers and one on the landing pad in
  Mission 1 are now sandtroopers, plus one in the sandbox. Screenshots
  beside the Dark Forces stormtrooper: same height and pixel size. 91
  tests, the validator and the smoke test pass.
- 2026-10-12: Phase 1b F: 3D models (Mark chose this as the next engine
  work, ahead of more of Mission 1).
  - **Renderer** (`render/models.js`): camera-space transform, back-face
    culling, near-plane clipping, column-by-column filling with
    perspective-correct textures, per-pixel checks against walls, ledge
    windows and a model depth buffer that sprites test too. Faces are
    shaded by a fixed light (wrapping round, so cylinders read as round).
  - **Format:** `defineModel` (flat colours, or textures with `uv` in
    repeats or `uvw` in world units at the walls' scale; `glow`,
    `twoSided`, collision `lines`), `ModelBuilder` (boxes, prisms, lofts,
    cylinders) and `tools/import-model.mjs` for Blender OBJ + MTL.
  - **Game:** decorations with `model`, `spin` and a placement `z`; solid
    models collide as cylinders or as their lines, and stop hitscan shots
    and projectiles.
  - **Tools:** the validator checks model ids, textures and the face budget;
    the level checker blocks tiles under model lines; the map viewer draws
    them.
  - **Showcase in Mission 1:** terminals in maintenance and the vault, two
    turning containment rings round the generator column, four coolant
    tanks on the shaft floor, and a shuttle on the landing pad (the pad's
    stormtrooper moved south of the exit).
  - **Speed:** models add 0.06-0.2 ms a frame in Mission 1, and 0.74 ms
    with the shuttle filling a 560-wide view (Node, headless).
  - **Checks:** 103 tests (12 new), the validator and the smoke test pass.
- 2026-10-12: Phase 1b J: a Jawa enemy, from Mark's Jawa sprite sheet. The
  sandtrooper cutter's shared steps moved to `assets/custom/sheetcut.py`
  (the sandtrooper sheet comes out pixel-identical); `assets/custom/jawa/
  cut.py` cuts 13 frames of 50x49 (walk, aim, fire with the flash, pain,
  a fall-back death). The Jawa is 1.25 tall (up to a trooper's chest; first
  cut at 0.95, half a trooper, which Mark found too short), 12 health,
  quick, and fires slow `ion-bolt`s; its eyes and muzzle flash glow. Three
  in Mission 1's gorge (the third from skill 3), one in the sandbox.
  Screenshots beside the stormtrooper and sandtrooper. 103 tests, the
  validator and the smoke test pass.
- 2026-10-12: The sandtrooper restyled to match the Dark Forces stormtrooper
  (Mark: it looked too realistic beside it, lacking definition and
  blockiness). Measured on a walk frame, the DF trooper has a much wider
  tonal range (brightness spread 75 vs 44, darkest/brightest twentieths
  17/232 vs 41/185), more hard steps between pixels (28% vs 15%), dark
  contours (68 vs 101), fewer colours (38 vs 73) and a stockier build.
  `sheetcut.py` gained an optional style stage (`DARK_FORCES`): widen 15%,
  median-smooth the source's dirt texture, sharpen, an S-curve contrast
  stretch, light from the right, darkened contours, and snapping to only
  the armour's ramps (gray, beige, concrete, orange). Now: spread 61, 10/206
  (the armour is beige, not white), hard steps 23%, contours 59, 50
  colours. Frames are 66x68. The Jawa (already in a pixel-art style) is
  unchanged.
- 2026-10-12: Jawa ion blasts (Mark: blue, a cloud of electricity zapping
  through the air). A generated `ion-blast` sprite (`tools/art/sprites/
  fx.js`): a flickering blue-white cloud with jagged arcs that change every
  frame (4 frames at 20 fps), then a burst of arcs leaping out where it
  hits (3 frames), all fullbright. Its own sounds: `ion-fire`, a buzzing
  bit-crushed zap, and `ion-hit`, a quick crackle.
- 2026-10-12: Phase 1b B3, Mission 1's lighting pass. Light is per tile and
  walls take the light of the tile in front, so pools and dark corners are
  painted as tiles (`Painter.light()` relights the open tiles of a box).
  With the Dark Forces textures 120 already reads dark and under ~110 black,
  so dark places stay at 112-128 and contrast comes from bright pools: a
  moonlit canyon (144, was a flat 176 that read as daylight), floodlights
  under the gate's strips, pools under ceiling panels, strips and lamps,
  dark corners, a broken flickering light in maintenance, the vault's
  screens pulsing, a slow pulse round the reactor column, new light strips
  on the generator walls, and a pulsing pickup spot. Engine: `lightMin` in
  the legend (the low end of an effect), `setLight` with `lightFx` /
  `lightMin` (the overload now leaves the chamber in a dim flicker, 136 down
  to 72, instead of a flat black 72), an unknown `lightFx` is an error.
  Hanging decorations and effects size themselves at 32 texels per unit, so
  the ceiling lamps hang from the ceiling instead of half inside it.
  `snapshot.mjs --custom` renders with the Dark Forces art. 108 tests (5
  new), the validator and the smoke test pass.
- 2026-10-12: Phase 1b K, see-through walls (Dark Forces' transparent mid
  textures). A legend `fence: { tex, edges, height? }` puts a railing, bars
  or a grate on tile edges, stored on both tiles beside the edge. The
  column renderer notes each fence its ray crosses (with the rows still
  open there), keeps going, and draws them far to near after the column's
  solid surfaces, skipping transparent texels and writing the depth buffer
  the models use, so sprites and models behind bars show only through the
  holes. Bodies are stopped below the fence's top (a low railing can be
  jumped); sight, shots and projectiles pass. Pathfinding and the
  validator's reachability don't cross fences (flyers go over low ones);
  the map viewer, automap and upscaler know them. Textures: `imp-railing`
  (DF `ZMGRATE1` truss squashed to 0.75 tall), `imp-bars` (`ZWBARS`),
  `imp-cage` (`ICDELEV`), with generated placeholders; fence textures may be
  any size. Mission 1: railings round the generator's catwalk ring and its
  bridges, a barred window from the barracks corridor into the officer's
  office, a cage round the maintenance crates. The fence pass adds about
  0.6 ms a frame in railing-heavy generator views (560 wide, Node). 118
  tests (10 new), the validator and the smoke test pass.
- 2026-10-13: Phase 1b L, doors you can find (Mark: doors were hard to find
  and too thick; he liked the older inset doors). Rising doors are now a thin
  panel standing across the middle of the doorway's depth, which slides up
  into the top of the opening (Dark Forces' door sector, the films' guillotine
  doors). The doorway is an open recess as tall as the opening, with lit jambs
  on its sides and the lintel above. The renderer draws the panel set back,
  narrows the column's window to below its bottom edge and carries on under
  it. Bodies, `castRay`, `traceRay3D` (shots pass under a half-open door) and
  projectiles stop at the panel, not the tile; a door closes on someone
  standing in its recess but not on someone in its panel's way. Door art is
  fitted to the doorway (centred, hung from its bottom edge), so one door
  texture shows one door and key panels show once. Door tiles group by their
  door fields, not by glyph, so each side can have its own lintel. Textures
  (Dark Forces pack): `imp-door` IDDOOR1 (2x2), `imp-jamb` IDJAMPNL (32x64,
  a light strip and control panel), the new `imp-lintel` (IDJAMLCX's row of
  lights rolled to the bottom edge) and `imp-gate` (IDBLKDOR, 4x4), with
  generated placeholders. Wall textures may now be any power-of-two size
  (validator). Mission 1's doors resized to the art: 2 wide and 2 tall with
  lit lintels (the plain wall above where a room is tall), the main gate a
  4x4 blast door. `snapshot.mjs --doors <open>` sets every door's state for
  review. 124 tests (6 new in `doors.test.js`), the validator and the smoke
  test pass.
- 2026-10-13: Faster doors (Mark: "This is Star Wars!"). The default door
  speed is 3.5 (was 1.6): a door opens or closes in 0.29 s, and you can walk
  through after 0.24 s. The door sounds are shorter to match: a 0.3 s whoosh
  open, and a whoosh and thump closing. MODDING.md gives the default. 124
  tests and the validator pass.
- 2026-10-13: Half-depth jambs (Mark: make the jambs half as thick). A
  rising door's jambs are half its wall's thickness deep, so no new grid was
  needed: Mission 1's walls are 1 tile thick at its doors now (jambs half a
  tile deep), the main gate's stays 4 deep. The bunk room, office and vault
  grew a row toward their doors (the barred window's sill is 1 deep too), the
  corridor runs a tile further to the red door, and the escape hatch has a
  one-tile landing outside. `imp-jamb` is now IDJAMPNL's middle 16 columns
  (its light strip); the gate and the sandbox's 2-deep door use the whole
  IDJAMPNL as `imp-gate-jamb`. docs/mission1.md and MODDING.md updated. 124
  tests, the validator and the smoke test pass.
- 2026-10-13: Phase 1b B4, Mission 1's enemies, items and skills. A monster
  placed in a level can carry its own `drops` (on top of its type's), so the
  officer now drops the red keycard, as Dark Forces' officers do; the
  validator, the reachability check and the ammo budget count drops a
  placed monster always makes, and the map viewer marks a carried key with a
  ringed dot. Mission 1 now has 14/18/22/29/30 monsters on skills 1-5 (was
  17/17/19/20/20): skills 1-2 drop a gate guard, a bunk-room trooper, a
  catwalk trooper and the pad's sandtrooper; 4-5 add a sandtrooper under
  ledge A, a Jawa, a second maintenance ambusher, a bunk-room trooper, a
  vault officer, a south catwalk trooper and a pad trooper (skill 5 a second
  probe droid). The vault, empty before, has guards against its far banks,
  lit by the screens' glow. Med kits moved to where fights end: by the vent
  mouth and on the gantry (skills 1-3) and in the office (1-2); the start
  bowl's (useless at full health) is gone, and the vent has a power cell.
  The 3 secrets each count once. `docs/mission1.md` has the per-skill table.
  126 tests (2 new), the validator and the smoke test pass.
- 2026-10-13: Story and map ideas drafted in `docs/story.md`, not decided
  yet. Two storylines that start on Tatooine: Dead Drop (a Rebel contract,
  closest to Dark Forces) and Bad Paper (a bounty contract that turns on the
  hunter, closest to *The Mandalorian*). Both put a calm Mos Eisley mission
  before the Canyon Garrison. Two map sketches (Mos Eisley, a moisture-farm
  homestead), and the engine work calm missions need (calm enemies and an
  alarm, patrols, holstering, conversations).
- 2026-10-13: Story chosen: Bad Paper, as a prequel to Dark Forces (see
  Decisions). `docs/story.md` is rewritten around it: how it ties into Dark
  Forces (Mohc's prototype, Jan Ors at the end), three missions (Mos Eisley,
  the Homestead, the Canyon Garrison with a calm front half), the tracking
  fob as a mechanic (a tool, then the tracer that betrays you, then a decoy
  to throw), and the engine work: calm enemies and an alarm, the fob,
  searching, patrols, conversations. Open: Dark Forces cameos, the hero's
  ending and name, and confirming Mos Eisley first with no-fail alarms.
