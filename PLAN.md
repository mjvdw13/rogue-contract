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
| Story, revisited (2026-10-13) | **Bad Paper, a prequel to Dark Forces** (`docs/story.md`), set a few months before Dark Forces' first mission. Kyle takes a Guild bounty on Tatooine as cover for the Alliance, and the contract turns on him: the Canyon Garrison is an early field test of Mohc's Dark Trooper project, and its prototype is Phase 3's mini-boss. **Only Mission 1 (Mos Eisley) is free roam:** calm troopers and the tracking fob, until Kyle finds his target and the shooting starts. From there it's straight run-and-gun, and later missions have no stealth or tracker. **The hero is Kyle Katarn** (Mark, 2026-10-13, replacing the earlier "no Kyle Katarn retelling"), and Jan Ors drops him off and picks him up in the Moldy Crow in every mission; the first mission opens with the Crow landing in a Mos Eisley docking bay. |
| Stacked spaces (2026-10-13) | **Two storeys per tile** (Phase 1c), before the story's maps. Mark wants to walk under other parts of the map. A tile can hold one solid slab, with a storey under it and one on top, like GZDoom's 3D floors. Considered instead: walkable 3D models (bridges only, no rooms under rooms) and overlapping layers joined by portals (Dark Forces' and Build's way: much bigger, for little more). |
| Rights | A non-commercial fan game. All art, sound and music are generated or original. Nothing ripped from Dark Forces, and no note-for-note John Williams transcriptions. Exception (Mark's decision, 2026-10-12): the ripped Dark Forces enemy and weapon sheets in `assets/custom/` are used, on the hosted site too (see Phase 1b D); likewise the Dark Forces sound effects (Mark's decision, 2026-10-15; see Phase 1b N). |

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

## Phase 1b: Look and feel

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
       - [x] Playtest bug (Mark, 2026-10-15): the escape hatch shut again
             a few seconds after the overload opens it, and stays
             remote-locked, so the way out is sealed. The hatch stays open
             (`stayOpen`). The level checker counted it as passable because
             a switch opens it: a remote door now counts only if it stays
             open or what opens it can be used again. A test pulls the
             overload switch and checks the hatch is still open later.

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

### M. The whole Dark Forces texture pack in the repo (done 2026-10-15)

Mark (2026-10-15): unpack the whole "MS-DOS - Star Wars_ Dark Forces -
Miscellaneous - Textures" zip into the repo, sorted by what each texture
shows rather than by level. Until now only the ~25 textures that
`textures.mjs` uses were committed (as the 32 game textures); the pack
itself lived outside the repo.

1. [x] Unpack into the scratchpad; list duplicate names across level
       folders and whether their pixels match.
2. [x] Contact sheets per level folder; look at every texture and give it
       a category (walls, doors, floors, switches, rock and so on).
3. [x] Copy into `assets/custom/df-textures/<category>/NAME.png`; one file
       per texture (identical duplicates once; different ones kept with a
       suffix).
4. [x] `assets/custom/df-textures/INDEX.md`: every texture with its size,
       category and the level folders it came from.
5. [x] `.gitignore` exception; `textures.mjs` reads the committed folder by
       default; README and DISCLAIMER mention it.
6. [x] Re-run `textures.mjs` against the new folder: the 32 game textures
       come out byte-identical. Commit.

### N. Dark Forces sound effects (done 2026-10-15)

Mark (2026-10-15): incorporate the sounds in "Sound Effects.zip" (146
Dark Forces sound effects as MP3s). They're ripped like the art, so they
go in the same way: kept in `assets/custom/`, swapped in by an override
file, with the synthesized sounds as the fallback (and what the tests and
smoke test hear).

Research:
- Every file is mono (stored as stereo), normalised to about 0 dBFS, with
  25-80 ms of silence before the sound (MP3 encoder delay) and ~0.4 s
  after. A shot that starts 50 ms late feels laggy, so the leading
  silence is cut when a file is decoded.
- Seven pairs are byte-for-byte the same sound under two names (EEEK2 /
  EEEK-2, EEEK3 / EEEK-3, EMISBY / EMISBY1, LASRBY1 / LASRFLY, SPLASH1 /
  SWIM-IN, BUTT1 / SWING, BUTT2 / PUNCH); each is kept once.
- Not in the pack: stormtrooper and officer voices, Kyle's pain grunts,
  menu sounds. Those stay synthesized.
- The engine already plays `src` sounds, but fetches them on first play
  (so the first shot is silent) and nothing preloads them.
- DF has sounds for things the game does silently or with `oof`: jump
  (JUMP-1), landing (LAND-1), a locked door (LOCKED-1), the probe droid's
  own shot (PROBFIR1), med kit (HEALTH1).

Decided (the mapping, by name; Mark to check by ear on the soundboard):

| Sound id | DF file | | Sound id | DF file |
| --- | --- | --- | --- | --- |
| blaster-fire | PISTOL-1 | | lift-start | ELEV2-1 |
| blaster-enemy | RIFLE-1 | | lift-stop | ELEV2-3 |
| droid-fire (new) | PROBFIR1 | | switch | SWITCH3 |
| bolt-hit | EX-TINY1 | | health-pickup (new) | HEALTH1 |
| explode | EX-MED1 | | item-ammo | AMMO |
| punch-swing | SWING | | weapon-pickup | WEAPON1 |
| punch-hit | PUNCH | | key-pickup | KEY |
| door-open | DOOR | | powerup (shield unit) | SHIELD1 |
| door-close | DOOR | | player-death | KYLEDIE1 |
| door-locked (new) | LOCKED-1 | | player-jump (new) | JUMP-1 |
| droid-sight | PROBALM | | player-land (new) | LAND-1 |
| droid-active | PROBALM2 | | | |

Each override's volume matches the loudness of the synth sound it
replaces, so the mix stays where it was tuned.

1. [x] `assets/custom/sounds/<category>/NAME.mp3`: the whole pack sorted
       by what each sound is (weapons, impacts and explosions, doors and
       lifts, pickups, player, enemies, ambience, vehicles, interface),
       with `INDEX.md` saying what each one is.
2. [x] New sound ids with synth fallbacks that keep today's sound
       (`door-locked` and `player-land` as `oof`, `droid-fire` as
       `blaster-enemy`, `health-pickup` as `item`) and a soft synth
       `player-jump`; the med kit, probe droid, hero and locked doors use
       them.
3. [x] Engine: `assets/custom/sound-overrides.json` (sound id -> `{ src,
       volume }`), loaded at boot unless under test automation; an
       override's file replaces the synth, and a file that fails to load
       falls back to it. File sounds start downloading at boot and decode
       when audio unlocks; leading silence is trimmed.
4. [x] `sound-overrides.json` with the mapping, volumes matched to the
       synth sounds' loudness.
5. [x] `tools/soundboard.html`: every game sound with its synth and its
       override side by side, and every DF file by folder, to audition
       and re-map.
6. [x] Tests (override applied, fallback on a failed load, silence
       trimming), README, DISCLAIMER, `.gitignore`, the Rights decision;
       check in the browser; validator and smoke test.

Later: ambience (WIND1 for the canyon, MACHINE1/2 and RUMBLE1 for the
generator, ELECTRIC) belongs to Phase 1d step 10, the looping positional
sounds.

### O. Boba Fett and Bossk (2026-10-15)

Mark (2026-10-15): add characters for Boba Fett and Bossk, from the ripped
Dark Forces "Boba Fett" zip (15 cells plus 15 cells of his projectile,
`BOBABALL`) and the "Trandoshan" sheet (Bossk, 823x194 on pure blue).
Neither is in `docs/story.md` yet, so they go in the sandbox only; where
they appear in the story is Mark's call.

Research:
- **Bossk's sheet** has a whole front-facing set: a four-frame walk with
  the concussion rifle shouldered, an aiming pose, a white "hit" flash (as
  the officer's sheet uses for pain), and a five-frame fall. No firing
  pose with a muzzle flash: the concussion blast carries its own glow.
  The DF pack has his voice (BOSSK-1/2/3, BOSSKDIE) and the concussion
  rifle (CONCUSS1, CONCUSS5).
- **Boba's cells** have only two front poses (standing, and a legs-apart
  stance) and a four-frame fall; the rest are other angles. In Dark Forces
  he flies with his jetpack, and the stance is his flying pose. His
  projectile's front cells are a fireball (3 frames) and a burst (3).
  There's no Boba voice in the sound pack.
- At Dark Forces' pixel density (`scale: 0.85`) Bossk is about 2 units
  tall (he's 1.9 m), but Boba comes out 2.3; DF drew him big.

Decided:
- **Bossk** (`bossk`, glyph `T`): a walker, tough and slow, firing slow
  concussion blasts that burst with splash damage. 90 health. His own
  voice (`bossk-sight`, `bossk-pain`, `bossk-death`), and
  `concussion-fire` / `concussion-hit` for the rifle. Layout: walk 0-3,
  aim 4, fire 5 (the aiming pose again, lit), pain 6, death 7-11.
- **Boba Fett** (`boba-fett`, glyph `F`): a flyer like the probe droid,
  hovering a unit off the floor, quick, firing fast rockets (the
  `BOBABALL` fireball) that burst with a small splash. 200 health and
  rarely flinches; `boss: true`. Drawn at `scale: 0.7` so he's 1.83 tall
  beside a trooper. Layout: hover 0 (the stance), fire 1 (the stance with
  the fireball at his gun), pain 2 (the first frame of the fall, briefly),
  death 2-5. Masked-human voice: the troopers' pain and death, a synth
  `rocket-fire`.
- **Committed art:** generated placeholder sheets in
  `tools/art/sprites/` (a Mandalorian in green and grey armour with a
  jetpack, and a scaly Trandoshan in an orange flight suit), and
  placeholder `rocket` and `concussion` projectiles in `fx.js`. The DF art
  goes in through `cut.mjs` and `overrides.json` as for the other rips;
  `cut.mjs` learns to read Boba's separate cells from his zip's folder.
  DF sounds go in `sound-overrides.json`.

1. [x] Placeholder sheets for both (`tools/art/sprites/hunters.js`, with
       the humanoid helpers now exported from `imperials.js`; the trooper and
       officer sheets come out byte-identical), and the two projectiles.
2. [x] `cut.mjs`: Bossk's sheet, Boba's cells, Boba's projectile; the
       overrides. Re-running it now keeps keys added by hand (`glint`,
       `glow`); the existing cut sheets come out byte-identical.
3. [x] Monsters, projectiles, sounds (synth, plus DF overrides: MISSILE1,
       EX-SMALL, CONCUSS1, CONCUSS5, BOSSK-1, BOSSK-3, BOSSKDIE). Volumes
       by the loudest 100 ms against the synth, the measure that gives back
       the existing volumes; the new synths were turned down to sit with
       the files, so no file goes above 1.37.
4. [x] One of each in the sandbox; tests, validator, smoke test;
       screenshots in game with and without the overrides.
5. [ ] Later, Mark's call: where they appear in the story, and Boba's
       other angles once enemies are drawn from several (Phase 2).

Mark (2026-10-15): Boba should walk around instead of flying. His cells
have no walk (in Dark Forces he only flies), so the walk is made from the
standing cell (000): stand, left knee up, stand, right knee up, the leg
below the hip lifted 5 pixels (thigh rows overdrawn, so the knee rises and
the foot leaves the floor). He goes on to the usual layout like Bossk:
walk 0-3, aim 4 (the stance, 001), fire 5 (the stance with the fireball),
pain 6 (the first frame of the fall), death 7-10 (the four-frame fall).
No longer `flying`; speed 4.8, a little quicker than a trooper.

6. [x] `cut.mjs`: a cell can `lift` a band of columns; Boba's new list.
       Drawn at `scale: 0.65` now, so standing (91 pixels with the
       rangefinder) he's 1.85 tall. `overrides.json` is now written with
       number lists on one line, so a re-run no longer spreads the hand-added
       `glint` and `glow` colours over five lines each.
7. [x] The placeholder sheet in `hunters.js` to the same layout (the
       trooper stride).
8. [x] `boba-fett.js`: walker, new anims; the sandbox comment.
9. [x] Tests, validator, smoke test; checked in game (Playwright) with and
       without the overrides: he walks on the floor and fires from the
       stance. Seen on the way: a walker (Boba or a trooper) chasing the
       player round the little rock in the courtyard (the diagonal tiles at
       34-35, 28-29) stops against its east face and walks on the spot. Not
       new; left for later.

### P. Door art centred top to bottom (done 2026-10-15)

Mark (2026-10-15): the door textures look slightly too low; make sure
they're centred vertically. The renderer hangs a rising door's 2-tall
texture exactly on its 2-tall doorway, so the offset is in the art:
IDDOOR1's inner panel is rows 8-60 of 64 (centre 34, not 31.5), with an
8-row dark edge and bevel on top and only 3 rows of bevel at the bottom.

1. [x] `textures.mjs`: roll IDDOOR1 up 3 rows (its three darkest top rows
       go under the bottom bevel, so each edge is 5-6 rows), before the key
       panels are stamped on, so they stay in the middle.
2. [x] Re-run `textures.mjs`; only the four door textures change. (It
       also spreads `overrides.json`'s glint and glow lists over several
       lines, as `derive.mjs` does; put back by hand. Left for later.)
3. [x] Looked at it in game (snapshot, m1, with the overrides): the panel
       now has an even edge top and bottom, the dark seam at the floor.
       Tests, validator, smoke test pass. Commit.

### Q. Canyon frame time (2026-10-15)

Mark (2026-10-15): the canyon start runs a bit slow on this computer.
Measured in Chrome at the m1 start (506 columns, 1536x730 window): the 3D
view takes about 16 ms a frame, everything else (update, HUD, present)
under 1 ms. Headless, the backdrop is about half of that: it fills each
column top to bottom (98k pixels a frame) when sky first shows, and only
about 8.5k of them end up on screen. Keep fixes simple.

1. [x] Draw the backdrop at the end of each column, only into the rows
       that showed sky (marked in `view.bdBuf` as the sky is drawn).
2. [x] Stop the backdrop's march where the ray leaves its grid
       (`Backdrop.exit`), not at `far` (256 tiles).
3. [x] Measured again: 18 snapshots of the canyon (6 spots, 3 pitches) are
       byte-identical before and after. Headless at 506 columns: 13 ms to
       7.7 ms. Chrome at 548 columns, old and new side by side: about 17 ms
       to 13.5 ms (this machine is noisy, plus or minus 1.5 ms).
4. What's left, not done (no cheap, plain fix): floors and ceilings
       (the per-pixel loops in `flats`) are about a third of the frame; the
       backdrop's march still costs 2 to 3 ms in Chrome (0.5 ms headless).
       Frame time grows with the window's width: a 1536x730 window is 548
       columns, against 427 at 16:9 and 320 with widescreen off.

### R. Eye height (done 2026-10-15)

Mark (2026-10-15): enemies look too tall when you stand next to them, and
sprites seem to float a bit. The cause is the eye: 1.0 unit, on a 1.7 body
(59% of its height; Doom's is 73%, a person's about 93%). A stormtrooper is
drawn 1.78 tall, so the horizon crosses it at the waist and its head is 0.78
above your eye; and so little floor shows below the horizon that sprites'
feet barely read as touching it. Rejected: smaller enemy sprites (they'd
shrink against the walls at every distance) and squashing sprites only up
close (still crops the head, and they'd change size as you walk up).

1. [x] `EYE_HEIGHT` 1 to 1.5 (88% of the body). On-screen sizes at a distance
       don't change; the horizon crosses enemies at the visor. Crouching eye
       stays 0.6. Most walkable space is 3+ tall (doors 2).
2. [x] Tests, validator, smoke test; a snapshot of m1 and the sandbox to
       look at. Commit and push.
3. [x] Mark (2026-10-15): lower it to 1.25 (74% of the body, about
       Doom's), pushed without running the tests.

### S. Renderer speed, deeper (2026-10-15)

Mark (2026-10-15), asked whether to move to WebGL: no; look deeper for
speed-ups without a big drawback (so no fewer columns, no lower quality).
Bench (scratchpad, m1 with the DF art, 548 columns, headless Node, best of
5): the canyon start (5 angles x 3 pitches) 6.7 ms, 8 indoor views 4.7 ms.
Profile: `flats` 40% (two divisions and a light calculation per pixel, and
two light samples per tile even where a tile shows no floor rows), the ray
march in `drawWorld` 21% (it builds 13 closures per column), the backdrop
9%, `face` 6%, `LightMap.sample` 5.5%, models 5% (culled only against the
view's edges, not against walls). Each step is checked against the bench's
23 views, byte-identical unless noted.

Chrome numbers below are the same views rendered in the game's page
(`game.renderer`, 548 columns, best of 5); Chrome runs this code about 1.6
times slower than Node on this machine, and is noisy (about 0.5 ms).

1. [x] `flats`: find the rows first, and sample the light only when there
       are some. Byte-identical. Chrome: canyon 11.1 to 10.6 ms.
2. [x] `flats` per pixel: no divisions (per-row reciprocals for the
       distance, and the light diminishing from them), in one `flatSpan`
       for floors and ceilings. 1 to 5 pixels in 110k differ in 5 of 23
       views (a rounding step at a colormap level). Chrome: 10.6 to 9.75
       ms, inside 7.9 to 6.8.
3. [x] Tried, not kept: building the per-column helpers once per frame;
       no measurable change. Also tried and dropped: reusing the boundary
       row and light sample between neighbouring tiles (no change), a
       column-major framebuffer (2% in Node), and V8's inlining limits
       raised (no change), so call overhead isn't it either.
4. [x] Models: skip a model whose nearest point is behind the walls in
       every column it could cover. Byte-identical. Things went from about
       1 ms to 0.2 ms at the canyon in Chrome.
5. [x] Backdrop: each 8 x 8 block of its grid keeps its highest corner
       (`Backdrop.blockMax`); the march passes over a block that can't
       reach the rows still open, taking the same samples elsewhere, so
       it's byte-identical. Samples per column at the canyon: about 150
       to 55. Chrome: about 1.7 to 1.4 ms.
6. [x] Measured in Chrome, then tests (one new for the block heights),
       validator, smoke test. Commit.
7. Result in Chrome: canyon 11.1 to about 9.3 ms (-16%), inside 8.1 to
   6.1 ms (-24%). What's left, measured by switching parts off: the ray
   march itself, drawing nothing, is about 5 ms at the canyon (30 tile
   steps a column on the fine grid, branchy work spread over many lines);
   floor and ceiling pixels about 2.5 ms; walls under 1 ms; backdrop 1.4
   ms. The next big step would be several threads (Web Workers splitting
   the columns), which needs cross-origin isolation for shared memory (on
   GitHub Pages only through a service-worker shim) and the world's
   changing state (doors, light, animated textures) sent to the workers
   every frame. Not started; Mark to decide.

### T. Particles (design 2026-10-15)

Mark (2026-10-15): a particle system for sparks (a broken panel, a droid
just killed), fire (embers rising from flames), wind and sand outdoors,
smoke and steam, shrapnel and more. Speed comes first: it must not cost
frame rate. This replaces Phase 1d step 9 (emitters) and does the
blending half of step 8 (translucency).

**The main idea: particles are points, not things.** A billboard sprite
is an object in `world.things`, a frame lookup, a sort, a texture walk per
column and a light sample. A particle is a slot in typed arrays, drawn as
a few pixels of one palette colour. That's the difference between about
50 sprites a frame and a few thousand particles.

**Budget.** 2000 live particles plus 400 of weather in under 0.5 ms a
frame in Chrome at 548 columns (simulation and drawing together), against
the canyon's 9.3 ms. Hard caps keep it there in the worst case.

**Simulation** (`world/particles.js`, run in `world.tick`, so it pauses
with the game):
- One pool of 4096, structure of arrays: `Float32Array`s for x, y, z, vx,
  vy, vz, age, life; `Uint8Array`/`Uint16Array`s for the type, the tile
  (cached), the light (cached). No objects and no garbage. Dead particles
  are swap-removed, so the live ones stay packed at the front. A full pool
  drops new spawns; each type also has its own cap.
- Per tick: gravity, drag (one multiply), wind (types with `wind` take the
  level's wind and gust), move. Collision only on the tile grid: the
  particle keeps its tile index and that tile's floor and ceiling, read
  again only when it crosses into a new tile. Below the floor: bounce
  (`bounce` 0..1, with friction), stick (shrapnel lies a moment, then
  fades), or die. In a solid tile: die, or bounce off that axis.
- Cosmetic only: its own small RNG, never `world.rng`, so gameplay stays
  deterministic in tests.
- Light: fullbright types skip it. Lit types sample the light map when
  spawned and again every 8 ticks (staggered by slot), not every frame.

**Drawing** (`render/particles.js`, after sprites, before the weapon):
- Per particle: camera transform (the sprite drawer's maths, a few
  multiplies), cull behind the eye and off screen, project.
- Size in world units becomes 1 to `maxPx` pixels by depth: a dot (1x1),
  a square (2x2, 3x3) or, for smoke and steam, a soft disc from small
  precomputed masks (radius up to 8 px). Fast types (sparks, sand) draw a
  short streak from where they were last frame to where they are (at
  most 8 px): motion reads at 60 Hz, and one particle looks like several.
- Occlusion, per pixel: against `zbuf` (walls) and the ledge windows, as
  sprites do, and against a per-pixel depth for models, fences and
  sprites. Today only models and fences fill `view.mdepth`; the sprite
  drawer also writes its depth there in frames that have particles (it
  clears the buffer first if nothing else did). Particles aren't sorted:
  dots don't need it, and additive blending doesn't care about order.
- Colour: each type has a ramp of palette indices over its life (a spark:
  white, yellow, orange, dull red; smoke: grey, darker, gone), picked by
  age. Lit types go through the colormap row for their light and
  distance (`view.row`, haze included, one call per particle).
- Blending, per type: `solid`; `add` and `half` through 256 x 256 blend
  tables built from the palette once (64 KB each, shared with step 8's
  translucent sprites); `dither` (screen-door: the 4x4 ordered pattern
  skips pixels by alpha, which also fades a particle out for free).
  Smoke and steam: `half` or `dither`; sparks and fire: `add`.

**Types and spawning** (content):
- `defineParticle({ id, colors, life, size, maxPx, gravity, drag,
  bounce, onFloor, blend, fullbright, streak, wind, cap })` in
  `src/content/particles.js`.
- Bursts from code and content: `world.particles.burst(type, x, y, z, {
  count, dir, spread, speed })`. Hooked into content: a monster's
  `death: { particles }` (the probe droid throws sparks and shrapnel),
  projectiles' `hit` (bolts spark on walls; rockets throw shrapnel and
  smoke) and `trail` (a rocket's smoke).
- **Emitters**: level `emitters: [{ x, y, z, type, dir?, rate | every,
  burst?, tag?, on? }]`: a steam vent (steady), a broken panel (a burst of
  sparks every 0.5 to 3 s, with a flash of dynamic light and, once step 10
  lands, a crackle), fire (flame particles plus rising embers plus a
  flickering light source). `setEmitter(tag, on)` from switches and
  scripts. An emitter more than about 24 tiles from the player doesn't
  spawn, and its rate falls off past half that.
- **Weather**: level `weather: { type, count, box, wind, gust }`. A fixed
  set of particles in a box round the camera (about 16 x 16 x 6 tiles)
  that wraps: one leaving a side comes in at the other, so nothing is
  ever spawned or killed. Drawn only in tiles under the sky (`F_SKY`), so
  sand doesn't blow indoors. The canyon: sand streaks on the wind, gusts
  from a slow noise, with a few bigger dust puffs (`dither`) low over the
  ground. Motes over the reactor are an emitter, not weather.

**Steps:**
1. [ ] **Bench first.** A scratchpad bench (as in S): the canyon start and
       the reactor with 0, 1000, 2000 and 4000 particles of each draw kind
       (dot, square, streak, disc) and blend; the numbers go here. Gives
       the caps and `maxPx` their values.
2. [ ] **Pool and simulation** (`world/particles.js`, `defineParticle`,
       validator): spawn, move, collide, bounce, stick, die; caps. Tests:
       a burst falls and bounces off the floor, stops at walls, never
       grows past the caps, and doesn't touch `world.rng`.
3. [ ] **Drawing** (`render/particles.js`): projection, dots, squares,
       streaks, discs; occlusion by walls, ledges, models, fences and
       sprites (sprites write depth when particles show); light and haze.
       Tests on small views (hidden behind a wall, in front of and behind a
       sprite, under a ledge).
4. [ ] **Blend tables** (`add`, `half`) and `dither`, built with the
       palette (cached per palette, checked against a brute-force
       nearest colour in a test).
5. [ ] **Content bursts:** sparks and shrapnel when a probe droid dies,
       sparks where bolts hit walls, shrapnel and smoke from rockets and
       concussion blasts, a smoke trail on rockets.
6. [ ] **Emitters** in levels: steam vent, sparking panel, fire (with
       embers and light), reactor motes; tags; distance cut-off. Validator,
       map viewer marks, MODDING.md. Placed in the sandbox, then where
       Mission 1 wants them (the maintenance valve and broken light, the
       generator).
7. [ ] **Weather:** sand and wind in the canyon.
8. [ ] Bench again with everything on (the budget holds?), tests, the
       validator, the smoke test, screenshots: sparks, steam, fire, the
       canyon's sand. Commit.

Later, if wanted: particles light themselves (each fire emitter already
has one light; per particle is too dear); a sound per burst; blood as
particles; rain for another level; decals left by particles (scorch
under fire).

## Phase 1c: Two storeys per tile (done 2026-10-13)

Mark (2026-10-13): we want to walk underneath other parts of the map. Today
every tile has one floor and one ceiling, so there are no bridges you can
walk under, no rooms under walkable ground and no upper floors over open
space. This comes before the story's maps (`docs/story.md`), which are
designed around it: the generator chamber's bridges no longer need to reach
down and split its floor, the homestead's rooms can lie under the ground
round its courtyard, and Mos Eisley's streets can have arches and upper
floors.

Decided (2026-10-13):
- **One slab per tile.** A legend entry's `slab: { bottom, top, floor,
  ceiling, side, light }` puts a solid layer from `bottom` to `top` inside
  the tile's open space. That gives a lower storey (the tile's floor up to
  the slab's underside) and an upper storey (the slab's top up to the
  tile's ceiling or sky). `floor` is the texture on the slab's top,
  `ceiling` its underside, `side` its edges, and `light` the lower storey's
  light (the tile's `light` lights the upper one).
- **Each storey can have its own walls.** An upper-storey wall over open
  space below is a tile whose ceiling stops at the slab; a lower-storey wall
  under an open upper floor is a raised floor. Both exist already, so rooms
  can stand on rooms with different layouts.
- **Which storey a body is in:** the upper one when the slab's top is
  within its step reach (its `z` plus how high it can step), else the lower
  one. `floorAt`, `ceilAt` and `lowFloorAt` take that reach; without one
  they answer for the upper storey. Projectiles and 3D rays use their own
  height.
- **Renderer:** each screen column keeps a short list of open row windows
  (up to 8) instead of one. Every window is in one storey of the tile the
  ray is crossing, and behaves like today's single window inside it. A
  slab's edge seen from the side covers the middle of a window and splits
  it. Each tile boundary records the column's whole set of windows (a
  batch), and sprites and models clip against the last batch nearer than
  them.
- **Maps without slabs render exactly as before:** pixel-identical
  snapshots of Mission 1 and the sandbox, before and after.
- **Placement:** things and the player start stand in the lower storey
  unless their `z` puts them on the slab.
- **First-version limits** (the validator rejects them): no slab in a door,
  lift or angled-wall tile; one slab per tile. A fence in a slab tile stands
  on the slab (a railing along a bridge). Sound travels through slabs.

1. [x] **Data and level format:** `F_SLAB` and per-tile slab arrays in
       `TileMap` (bottom, top, textures, the lower storey's light offset),
       the legend's `slab` in `level.js`, validator errors (a slab outside
       the tile's open space, too thin, or in a door, lift or angled-wall
       tile), the painter and the upscaler (heights double).
2. [x] **Renderer** (`render/columns.js`): open windows per column; each
       window's storey (its floor and ceiling, the slab's top and underside
       textures, the lower storey's light); the faces at each boundary per
       window, including slab edges that split a window; rising doors,
       angled walls and fences per window. Sprites and models clip against
       the window batches (`sprites.js`, `models.js`). Check: pixel-identical
       snapshots of today's maps, and frame times.
3. [x] **Sandbox showcase:** a bridge across a hall and a walkway over a
       room. (Built: a bridge across the hall's pit, a bunker under the
       sniper ledge, and a railed walkway out over the courtyard.) Snapshots from the side, from underneath, from on top and from
       above.
4. [x] **Movement and combat:** reach-aware `floorAt` / `ceilAt` /
       `lowFloorAt`; the player, monsters, gravity, flyers, lift riders,
       crouching; `traceRay3D` (slab tops, undersides and edges), projectiles,
       explosions, bullet puffs; fences on slabs; things placed with `z`; the
       player start's `z`.
5. [x] **Next to slabs:** a rising door beside a slab tile opens to the
       right storey's ceiling; sprites and models under a slab take the
       lower storey's light.
6. [x] **Pathfinding** (`world/nav.js`): the flow field over (tile,
       storey), so monsters cross bridges and walk under them.
7. [x] **Tools:** the level checker's standing spots per storey
       (`tools/lib/levelcheck.mjs`), the map viewer and the automap (the
       upper storey drawn over the lower), `snapshot.mjs`.
8. [x] **Tests and docs:** renderer, physics, combat, pathfinding and
       checker tests; MODDING.md.
9. [x] **Gate:** the sandbox's bridge runs near 60 fps in a desktop
       browser; all tests, the validator and the smoke test pass. (In
       headless Chromium at 16:9, slab views take 1.7-3.6 ms a frame;
       still to see on Mark's desktop.)

Later, if wanted: doors and lifts inside slab tiles, more than two storeys,
slabs that stop sound, triggers for one storey only.

- [x] **Used in Mission 1** (2026-10-13): the generator's catwalk ring and
      bridges are grate slabs over one open shaft floor, and a rock arch
      spans the gorge with a sniper on top.

## Phase 1d: Detail and immersion (from 2026-10-13)

Mark (2026-10-13): spend time on Mission 1 to really push its detail and
immersion, and fix the engine wherever it holds the level back.

### What holds it back (survey, 2026-10-13)

From screenshots of every area with the Dark Forces art, and the code:

- **Light is per tile, and steep.** A pool of light is a square of tiles
  with hard edges. Distance darkening (`view.js`: 4 light units per
  colormap level, `DIMINISH` 40, fog 0.15) turns anything 10 m away
  nearly black in a space lit at 144, so the generator chamber and the
  canyon read as black voids. Nothing gives light: bolts, muzzle flashes
  and explosions light nothing.
- **The canyon is a box.** Every rock wall rises straight to the sky
  height (12 m), so the sky is a sliver and the cliffs have no skyline.
  The floor is SecBase's grey rock (DF's dirt snapped to blood red in our
  palette), and distance fades to black instead of night haze.
- **One texture per wall tile, floor to ceiling.** The garrison's face
  can't have a base course with rock above it, and big walls (the reactor
  column, the canyon, the shaft) repeat one texture 10 m up. No decals:
  no signs, insignia, hazard stripes or scorch marks.
- **Rooms are boxes.** Flat ceilings, bare floors, no trim, few props
  (crates and consoles as sprites, four models).
- **Silent and still.** No ambient sound (reactor hum, wind, machinery),
  no particles (steam, sparks, dust), no translucency (glass, shafts of
  light, holograms).
- **The palette is Raccoon Alex's.** Snapping the DF art to it costs 11.6
  RGB on average (31 on the ceiling light, 22 on the jambs); it's thin on
  dark blue-greys, so dim SecBase walls go grey-black, and it has no sand.
- **Props confuse monsters.** Pathfinding and sight ignore 3D models, so a
  furnished room would trap and blind them.
- Smaller: grates and rock shimmer at a distance (no mipmaps); the model
  builder restarts a cylinder's texture on each face.

Frame time now: 4.3 ms on average at 16:9 (16 views of Mission 1,
headless Node, DF art). Budget for this phase: stay under about 8 ms.

### Decided (2026-10-13)

- **Engine first, then the level area by area**, each engine feature
  proven in the level as it lands. Screenshots before and after every
  area.
- **Smooth, placed light.** Light is kept at tile corners (a light map)
  and interpolated across floors, walls and things, with ordered
  dithering between colormap levels. Levels place **light sources**
  (lamps, strips, floodlights: position, radius, strength, effect), baked
  in with falloff and shadows from walls. A tile's `light` stays as its
  area's ambient light, so maps without sources look as before, only
  smoother.
- **Dynamic light:** bolts, muzzle flashes and explosions light their
  surroundings, through open tiles only.
- **A palette fitted to the art** (Phase 3's palette item, brought
  forward): ramps measured from the DF textures and sprites, with more
  blue-greys and dark tones and a desert range, keeping the ramp names
  the generated art and models use.
- **A semi-3D skyline** (Mark, 2026-10-13/14: the stepped ledges looked
  like "pieces of paper", and he didn't like the rock strata bands): the
  canyon's walls end in a low rim, and a backdrop (a coarse height grid
  past the edge of play, drawn voxel-style where the sky shows) climbs
  from the rim in smooth, moonlit slopes and ridges. No strata. Also
  tried and dropped: setting the edge back in the grid itself (the rock
  behind the face climbing in short steps to a ridge a few tiles in, then
  sky); Mark preferred the backdrop's ridges.
- New art is generated (`tools/art`), or cut and recoloured from the DF
  textures already in `assets/custom/textures/` (the pack itself is on
  Mark's machine).
- The pickup ship on the pad becomes the **Moldy Crow** (Jan picks Kyle
  up, `docs/story.md`): a new low-poly model.

### Engine

1. [x] **Palette fitted to the art.** Measure the colours of the DF
       textures, sprites and generated art; set the ramps' key colours and
       sizes from them (more `steel`, `navy` and near-black, a `sand` and
       `rock` range; fewer flesh, toxic and purple entries). Report the
       snapping error before and after, regenerate the art, check that
       dark colormap levels keep blue-greys blue. A sandy canyon floor
       (the DF rock recoloured, and a generated one).
2. [x] **Light map.** `world/lightmap.js` keeps light at tile corners per
       storey (the lower storey under slabs has its own), averaged over the
       open tiles round each corner, so light doesn't leak through walls;
       an optional darkening where walls meet (baked ambient occlusion).
       The renderer reads it: floors and ceilings per pixel, walls, step
       faces, slab edges, doors and angled walls along their length,
       sprites, models and the weapon at their position. Light levels are
       dithered (4x4 ordered) between colormap levels. Light effects keep
       working; a group can be synced by name, with each tile keeping its
       own range, so a whole pool pulses as one. Painter helpers for round
       pools.
3. [x] **Light sources.** Level `lights: [{ x, y, z?, radius, light, fx?,
       min?, tag? }]`, baked into the corners within `radius` that can see
       the source (line of sight over the grid; walls and doors block),
       with a smooth falloff. Animated sources keep their part per corner
       and update it each frame. `setLight` reaches sources by tag (the
       overload kills the generator's lamps). Validator, map viewer,
       MODDING.md, tests.
4. [x] **Dynamic light.** Projectiles, effects and weapons get `light: {
       radius, light }`: bolts light walls as they pass, muzzle flashes
       (the player's and monsters') and explosions flash the room. Added
       each frame by a small flood fill through open tiles, fading with the
       animation.
5. [x] **Distance and haze.** Retune the distance darkening so lit spaces
       read across a room, and add an outdoor haze: under the sky, surfaces
       fade toward a level's `haze` colour (colormaps blending to a
       colour) instead of to black.
6. [x] **Wall bands.** A wall tile can change texture with height:
       `bands: [{ from: 8, tex: 'canyon-rock' }, { to: 0.5, tex: 'imp-trim'
       }]`. The garrison's face with rock above, skirting trims, the
       reactor column's bands. Validator, map viewer, tests.
7. [x] **Decals.** Level `decals: [{ x, y, z, face, tex, glow? }]`: a
       see-through texture on a wall face or a step face (signs, the
       Imperial crest, hazard stripes, pipes, vents, panels). (Blaster
       bolts left scorch marks on walls; taken out 2026-10-14.)
8. [ ] **Translucency.** Blend tables (half and additive) built from the
       palette; sprites, effects and fences can be translucent or additive:
       steam, glass, shafts of light, holograms, force fields.
9. [ ] **Emitters.** Now a particle system: see Phase 1b T (design
       2026-10-15): steam vents, sparks from a broken panel, blowing
       dust, motes over the reactor.
10. [ ] **Ambient sound.** Looping positional sounds placed in a level,
        muffled where there's no line of sight, from looping synth sounds
        (seamless ends); occasional random one-shots (a distant cry, comm
        chatter). Reactor hum, wind, machinery, server racks, steam.
11. [ ] **Scrolling textures:** `scroll: [u, v]` per texture: energy in
        the reactor core, data on screens, the pad's guide lights.
12. [ ] **Models in pathfinding and sight.** Solid models block the flow
        field's tiles and monster sight (low ones only below their top);
        the builder wraps cylinder textures round.
13. [ ] Stretch: **mipmaps** for floors and walls in the distance (no
        shimmer on grates and rock).

- [x] **Glints on armour** (Mark, 2026-10-14: a happy accident worth
      making a feature; it will take some work). Done 2026-10-15.
      - **What happened.** Under Raccoon Alex's palette, the brightest
        highlight on the DF stormtrooper's armour (252,252,252: 287 pixels,
        2.4% of the sheet) had no lit colour near it and snapped to
        glow-yellow's white, so it was fullbright. In a dark room with a
        lamp, a trooper standing in shadow seemed to catch the lamp on their
        armour. Outdoors in the dark canyon, with nothing to reflect, the
        white looked out of place. The fitted palette (step 1) added a lit
        (253,253,253), and the highlights stopped glowing. The officer (208
        such pixels, 118 left) and the probe droid (345, 73 left) lost some
        too; check which of the rest are meant to glow.
      - **The feature.** Highlight pixels stay lit like the rest of the
        sprite, but brighten toward fullbright when a light source can see
        the sprite, even if the sprite stands in shadow. With no source
        about (the canyon at night) they're plain lit white.
      - **A sketch.** Mark the pixels per sheet (`glint: [[252, 252, 252]]`
        at import, kept as a mask beside the frames, or a small `glint`
        palette range). A second light map channel holds light from
        sources only (no ambient), baked like the light map, with line of
        sight but a longer reach than the source's own radius; dynamic
        lights add to it too, so a muzzle flash makes the troopers' armour
        flash in the dark. The sprite drawer uses the higher of the two
        levels for glint pixels. Maybe: stronger when the source is on the
        viewer's side of the sprite, a per-source `glint: false`, models
        with shiny faces.
      - **Check** with screenshots: a trooper in shadow in a lit room (the
        old look), in the dark canyon (no glints), under a muzzle flash and
        a passing bolt.
      - **Survey (2026-10-15).** The 252 whites are glints only on the DF
        stormtrooper (armour highlights in every frame). The officer's are
        the muzzle flash core, on its attack's fullbright frame already. The
        DF probe droid's are explosion sparks in its death frames, which
        aren't fullbright: they glowed by accident under the old palette and
        went lit with step 1, so the explosion no longer shines. The
        generated stormtrooper's highlights (255,255,255, 267 pixels) still
        snap to glow-yellow's white: fullbright everywhere, the old look in
        the canyon too. Also seen: 65 pixels of the generated Jawa's robe
        (190,120,65) snap to glow-lamp and glow faintly.
      - **The work** (done 2026-10-15):
        - [x] Import: a sheet (or its art override) can list `glint` colours
              and `glow` colours. `quantize` snaps glint pixels to lit
              colours only and keeps a mask of them (column-major on each
              frame, null when a frame has none); glow pixels snap to
              fullbright colours only. Node loaders (snapshot, tests) pass
              the options through.
        - [x] Glint light: each light source is baked a second time with
              twice its radius (`GLINT_REACH`) into `map.glintLight` (per
              storey), and a second light map (`world.glintmap`, sources
              only, no ambient) interpolates it. Animated sources and
              `setLight` update it; dynamic lights (muzzle flashes, bolts,
              explosions) add to it at twice their radius too. A source
              with `glint: false` stays out of it.
        - [x] Drawing: glint pixels of a sprite that isn't fullbright take
              the colormap row for its light plus `GLINT_GAIN` times the
              glint light there (haze and distance as for the sprite).
              Nothing changes with no source about, under fixed colormaps
              or the fuzz style.
        - [x] Content: `glint` on the stormtrooper (255,255,255 on the
              generated sheet, 252,252,252 on the DF override); `glow` on
              the DF probe droid (252,252,252: the death sparks shine again).
        - [x] Tests (the mask, the bake and reach, line of sight, dynamic
              lights, the drawn colours), the validator, MODDING.md, and
              screenshots of the four cases above with the DF art; tune
              `GLINT_REACH` and `GLINT_GAIN` from them (2 and 3 held up:
              no change). The validator checks the colour lists.
        - Later, if wanted: stronger when the source is on the viewer's side
          of the sprite; shiny faces on models; glints on the sandtrooper's
          armour; the Jawa robe's stray glow-lamp pixels (fix the
          generator's colour).

### Mission 1

14. [ ] **The canyon.** A skyline (done): the walls end in a low rim of
        rock out of reach, and a backdrop of slopes and ridges climbs from
        it past the edge of play (see Decided). A sandy floor with gravel
        channels and boulders (rock models, done). Imperial
        perimeter (done): floodlight towers (models and light sources), a
        sensor mast with a turning dish and a blinking beacon, barricades
        and crates by the gate. Moonlight and haze (done, step 5). Left:
        wind and blowing dust, with emitters and ambient sound (steps 9
        and 10).
15. [ ] **The garrison's face.** A base wall with the cliff above it
        (bands), a concrete overhang over the gate strip with lights under
        it (a slab), the gate in a deep frame with hazard stripes, the
        vent mouth as a grilled duct, a lit control window above the gate.
16. [ ] **The vent and maintenance.** Shafts of light through the vent's
        grate, a fan at its end. Pipes along the walls and ceiling (models
        and a duct slab), machinery, a workbench, steam from a valve, the
        broken light sparking, hum.
17. [ ] **The barracks.** The corridor with pilasters, ceiling beams and
        recessed light panels (sources), signs and the crest; bunk beds and
        lockers in the bunk room; a desk, chair and a holotable with a
        translucent hologram in the office, and a window out of it.
18. [ ] **The data vault.** Rows of blinking server racks (models) making
        aisles to fight through, a raised dais with the data terminal,
        floor light strips, cold mist, server hum.
19. [ ] **The generator** (the showpiece). The column in bands (plinth,
        a glowing core with scrolling energy, light rings), conduits from
        the walls into it, struts under the catwalks, banded shaft walls
        with vents and signs, hanging lamps; steam and sparks; a deep
        hum. The overload: a klaxon, red strobes, the lamps die, bursts of
        sparks and steam.
20. [ ] **The way out.** A deep chasm (lift L3 from the bottom), the gantry
        with a floodlight, the pad open to a view east down the canyon
        (the map grows east), landing lights, the Moldy Crow.
21. [ ] **Tune and check.** Light and sound mix, frame time, cover and
        enemy positions round the new props, the per-skill check; tests,
        the validator, the map viewer, the smoke test, MODDING.md and
        `docs/mission1.md`.

Order: 1-5 (the look), 6-7 with 14-15 (outside), 8-11 with 19 (the
generator), 12 with 16-18 (the interiors), then 20, 21 and 13. Each step
is committed with screenshots checked, and tests, the validator and the
smoke test passing.

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

### For the story (`docs/story.md`)

About a dozen pieces, all small or medium, and no new rendering technique:
most extend code that already exists. After Phase 1c (two storeys). Order: the Crow pieces first (every
mission uses them, and they give Mos Eisley's opening), then calm troopers
and the switch, then conversations, then the fob. Each new action or
trigger is registered and checked by the validator (`validate.js` rejects
unknown actions), documented in MODDING.md and covered by tests.

**Every mission: the Moldy Crow's drop-offs and pickups**

1. [ ] **`fly` action** (small): moves a model decoration along timed
       keyframes (x, y, z, facing, seconds). Collision already reads each
       thing's current position and height every tick (`world.js`
       `tryMove`), so a Crow up in the air blocks nothing.
2. [ ] **`cutscene` action** (small to medium): for a few seconds the view
       comes from a tagged spot looking at a target, the HUD and weapon are
       hidden and input is locked; use or fire skips it. An override of
       `world.camera()`, which the renderer draws from.
3. [ ] **`wait` in trigger lists** (small): a trigger's actions can pause,
       for the landing's timing, Jan's lines and Mission 2's "two
       minutes". Today a trigger runs all its actions at once.

**Mission 1's free roam**

4. [ ] **Calm monsters** (small to medium): a placed monster with `calm`
       skips the idle "can I see the player?" check (`monster.js`), stands
       its post or wanders, and says lines when bumped or used, using the
       friendly characters' reaction (today only `kind === 'npc'` gets
       bump reactions, `world.js` `tryMove`).
5. [ ] **The town's switch** (small): a `hostile` action turns every calm
       monster normal at once, with an `on: 'hostile'` trigger (blast
       doors, reinforcements, combat music). The player firing runs it too
       (hook it where a shot makes noise, `weapons.js` `if (def.noise)`), and
       so does any damage the player deals.
6. [ ] **Conversations** (small to medium): an `on: 'talk'` trigger raised
       from `npcReact` (`npc.js`), NPC lines that move on with each use, and
       story flags (`setFlag`, plus `if` on triggers).
7. [ ] **The tracking fob** (small to medium): a weapon with no attack (the
       weapon code assumes every weapon has `fire`), a per-tick weapon hook
       that blinks its light and beeps faster near the signal, a
       `setSignal` action (a tag, item or character), and a `takeWeapon`
       action to remove it at the end. Giving it is an ordinary weapon
       pickup in the broker's booth.
8. [ ] **`remove` and `place` actions** (small): Dace is taken in Mission
       1 and waits at the pad in Mission 3; Mohc leaves.
9. [ ] Nice to have: **patrol routes** (`patrol: 'street'` walks tiles
       tagged `street-1`, `street-2`... in order) and **civilians running
       away** when the town turns.

**Missions 2 and 3**

10. [ ] **`damage { tag, amount }` action** (small): the overload hurts the
        prototype.
11. [ ] Optional: **factions**, so Tuskens and troopers fight each other at
        the farm (monster infighting already sets `m.target`).

**Fixes and tools that go with these**

12. [ ] The level checker blocks the floor under a model's collision lines
        where it spawns (`tools/lib/levelcheck.mjs`). The Crow spawns in the
        air above the bay, so skip models placed high or marked as flying.
13. [ ] The `spawn` action always plays the teleport sound
        (`actions.js`); stay quiet when `fog: false`, for reinforcements.
14. [ ] The headless play test runs every level, so it skips opening
        cutscenes.

**Already above, and these maps lean on them:** briefings and objectives
(Jan and Kyle's briefings; the exit waits for objectives), and smarter
enemies around heights (Mission 1's rooftop snipers and the troopers on the
farm's pit rim would walk at Kyle and stall at the ledge).

**No engine work needed** (checked 2026-10-13):

- Mos Eisley's rooflines: a solid wall is drawn only up to the sky height
  of the tile in front of it (`columns.js`, the solid `face()` call), so a
  street whose sky sits just above the roofs shows the buildings with sky
  behind them. Design rule: where a roof is walkable, the sky over the
  streets beside it stays above Kyle's eye.
- Sunken docking bays and the farm's courtyard, flickering firelight
  (`lightFx`), blast doors (remote-locked doors and `closeDoors`),
  reinforcements (`spawn`), dust (`spawnEffect`), the checkpoint pass (a
  renamed keycard), the combat music switch (`music`), and importing 3D
  models.
- The real cost is art: the Moldy Crow model, the prototype and townsfolk
  sprites, adobe textures and a day sky (Phase 3 and Phase 1b D).

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

In the story (`docs/story.md`, 2026-10-13) this map is Mission 3, the Canyon
Garrison, and the hero is Kyle Katarn; Mos Eisley is the new Mission 1.
Which one is the slice is still open.

The player infiltrates an Imperial garrison in a desert canyon:

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
- 2026-10-13: The hero is Kyle Katarn (Mark), in the gap between his
  defection and Danuta, with Jan Ors flying the Moldy Crow. `docs/story.md`
  updated: Kyle takes the Guild contract as cover for the Alliance under a
  false licence, and the garrison's twist now unmasks him ("Kyle Katarn,
  Imperial deserter"). Every mission opens with a Crow drop-off and ends
  with a pickup, played in the level: Mission 1 opens on a camera at Docking
  Bay 87's rim as the Crow comes down. The finale hands over to Danuta. New
  engine items: flying models, a scripted camera, and delays in triggers.
- 2026-10-13: Free roam only in Mission 1 (Mark). `docs/story.md`
  updated: Mos Eisley is a loop. Kyle walks east through a calm town with
  the tracking fob, finds Dace in a derelict docking bay, and the shooting
  starts. The town turns hostile all at once, and he fights back west to
  the Crow in Docking Bay 87. Dace is taken there, so the Homestead becomes
  a straight combat mission (recovering his hidden recordings), and the
  Canyon Garrison stays a combat mission entered by the vent. Dropped:
  restricted zones, warnings, monster searching, the traced fob and
  throwing it. The story's engine items are listed under Phase 2.
- 2026-10-13: The story's engine work, checked against the code, is now a
  numbered list under Phase 2 ("For the story"): the Crow's `fly`,
  `cutscene` and `wait`; calm monsters and the `hostile` switch;
  conversations; the tracking fob; `remove`/`place` and `damage`; and the
  tool fixes that go with them (the level checker and flying models, the
  spawn sound, skipping cutscenes in tests). Mos Eisley's rooflines need no
  engine change.
- 2026-10-13: Planned Phase 1c, two storeys per tile (Mark: we want to walk
  under other parts of the map), ahead of the story's engine work. A tile
  can hold one solid slab; the renderer keeps several open windows per
  column; bodies pick a storey by their step reach. Starting on it.
- 2026-10-13: Phase 1c done: two storeys per tile.
  - **Data:** a legend `slab: { bottom, top, floor, ceiling, side, light }`
    (`F_SLAB`, per-tile slab arrays). `floorAt` / `ceilAt` / `lowFloorAt`
    take a `reach` and answer for the storey a body reaches (its feet plus
    its step: `world.reach`).
  - **Renderer:** up to 8 open row windows per column, each in one storey;
    a slab's edge splits a window. Each boundary records a batch of windows
    (`view.segFirst`), which sprites and models clip against. Maps without
    slabs render pixel-identically (640 seeded views of Mission 1 and the
    sandbox, both art sets); their frame time is up about 10% headless.
  - **Movement and combat:** walking, gravity, jumps and head bumps,
    crouching, flyers, lift riders, projectiles, bullet puffs and
    `traceRay3D` (shots, sight, explosions) keep to their storey. Things
    spawn under a slab unless their `z` reaches it (drops land where the
    body fell). A rising door beside a slab opens to the right storey;
    sprites and models under a slab take its light.
  - **Pathfinding:** the flow field's nodes are (tile, storey); where a slab
    is involved, a step needs the two storeys to overlap by the body's
    height. Railings on a bridge don't stop monsters walking underneath.
  - **Tools:** the level checker gives slab tiles two standing spots and
    checks things in their own storey; the map viewer shows a slab's top
    in a dotted frame; the automap draws a slab's edges; `snapshot.mjs
    --top` stands on a slab.
  - **Sandbox:** a bridge across the pit, a bunker under the sniper ledge, a
    railed walkway over the courtyard.
  - **Checks:** 140 tests (14 in `tests/storeys.test.js`), the validator and
    the smoke test pass; MODDING.md has a "Two storeys" section.
  - **Later:** doors and lifts in slab tiles, more storeys, slabs that stop
    sound, triggers per storey; Mission 1's generator bridges can now leave
    the floor whole.
- 2026-10-13: Two storeys in Mission 1 (Mark). The generator chamber's
  catwalk ring and its two bridges are grate slabs (5.5 to 6) instead of
  solid columns down to the shaft floor, so the bottom is one open space
  round the reactor column and out under the catwalks to the walls. Both
  lifts stay as two ways between the floor and the ring. Things on the
  catwalks stand on them (`z`). The shaft floor is lit at 128 (was 112, which
  reads black with the Dark Forces art), 120 under the catwalks with pools
  of 168 below the wall strips, and a power cell waits in the dark under the
  north-west corner. A natural rock arch spans the gorge (a slab from 4 to
  5), moonlit on top and in shadow underneath, with a sniper on top on
  skills 2-5 (monsters now 14/19/23/30/31). Reviewed in snapshots; the
  validator finds the exit, every item and no one-way areas on every skill.
  `docs/mission1.md` updated.
- 2026-10-13: Planned Phase 1d, detail and immersion (Mark: push Mission
  1's detail and immersion, and fix the engine where it holds the level
  back). A survey of every area found per-tile, steep lighting (black
  voids at a distance, nothing lights up), a boxed-in canyon with no
  skyline, one texture per wall tile and no decals, bare box rooms, no
  ambient sound, particles or translucency, a palette that fits the DF art
  poorly, and pathfinding and sight that ignore models. The plan: a fitted
  palette, a light map with placed and dynamic lights, haze, wall bands,
  decals, translucency, emitters, ambient sound, scrolling textures and
  models in pathfinding, then the level area by area, ending with the
  Moldy Crow on an open landing pad.
- 2026-10-13: Phase 1d step 1, a palette fitted to the art. New ramps
  measured from the DF textures and sprites (more `steel` blue-greys and
  near-blacks, `navy`, a `sand` range for the desert, fewer flesh, toxic
  and purple entries) and fitted colours placed by `tools/fit-palette.mjs`
  where the lit art is worst covered. The average snapping error once lit
  fell from 11.6 to 4.4 RGB (DF textures 4.3, sprites 5.1, generated art
  3.5). The generated art is regenerated. The canyon is Tatooine's now:
  sandstone cliffs in three strata and a sand floor with gravel, generated
  (`tools/art/textures/desert.js`) and derived from the DF rock by
  `assets/custom/derive.mjs`; textures with `fullbright: false` snap to lit
  colours only. The officer's rip turns from khaki to Imperial olive
  (`assets/custom/recolour.mjs`, run by `cut.mjs`). SecBase reads as its
  steel blue-grey instead of saturated blue, and stays blue in shadow.
- 2026-10-13: Phase 1d step 2, smooth light. `world/lightmap.js` samples
  light at tile centres (not corners, which flattened Mission 1's small
  pools: a lone 200 tile among 144s would have peaked at 158) and
  interpolates between them; a sample in a wall takes the average of the
  open ones beside it, so light never leaks through a wall, less a level's
  `occlusion`. One set per storey. Cells keep their four samples, and only
  cells round changed tiles are recomputed. The renderer interpolates light
  along each ray's stretch through a tile for floors and ceilings, samples
  it where the ray meets walls, step faces, slab edges, doors, angled walls
  and fences, and at sprites, models and the weapon, with 4x4 ordered
  dithering between colormap levels (centred, so as bright on average as
  before). Light effects keep a range per tile; `lightSync` names a group
  across the map. `Painter.pool()` paints round pools. Tried `occlusion: 24`
  on Mission 1: its dim rooms went black at the walls, so it stays off.
  Mission 1's frame time: 2.0 to 2.3 ms (headless, DF art). 149 tests.
- 2026-10-13: Phase 1d step 3, light sources. A level's `lights` are baked
  at load (`world/lightsources.js`) into a per-storey `srcLight` the light
  map adds to each tile: each reaches the tile centres it can see within
  its radius (2D line of sight; walls, angled walls and shut doors block),
  fading as (1 - (d/r)^2)^2. Under a slab it lights the storey its `z` is
  in. Sources with an `fx` join the light-effect groups (`sync` keeps time
  with a `lightSync`), applying the change in their strength to their
  tiles; `setLight` reaches sources by tag. Bad sources are level errors,
  and a `setLight` tag may name only sources. The map viewer draws them.
  Sampled at tile centres (not corners, as planned), like the light map.
  Mission 1: the gate floodlights, the barracks corridor's strips and
  lamps, and the generator's wall strips (a lamp over each catwalk and one
  under it) are sources now, in place of painted pools; the overload makes
  the generator's lamps sputter. 27 sources, 12 ms level load, frame time
  unchanged (2.3 ms), 0.05 ms a frame for the overload's flicker. 155 tests.
- 2026-10-13: Phase 1d step 4, dynamic light. Any thing (and a weapon) can
  have `light: { radius, light }`: it lights the room while it shows a
  fullbright frame, so bolts light what they pass all their flight, and
  monsters' and the blaster's muzzle flashes light it on their fullbright
  frames; effects and bursting bolts fade with their animation. Each frame
  `World.dynamicLights()` gathers them and `LightMap.setDynamic()` flood
  fills each through open tiles within its radius (walls and shut doors
  stop it; under a slab it lights the storey its height is in), clearing
  last frame's; only the cells round changed tiles are recomputed. The
  blaster's whole-view `flashLight` gives way to a local flash (radius 5,
  +96); troopers flash +80, bolts +64, explosions +128 over 6 tiles. A
  heavy firefight (20 bolts, 3 explosions) costs 0.2 ms a frame; rendering
  is unchanged. 161 tests.
- 2026-10-13: Phase 1d step 5, distance and haze. The distance curve is
  gentler: `DIMINISH` 40 to 24, the level at a light 7 lower
  (`LIGHT_BLACK` 212 for 240) and the default fog 0.15 to 0.05, so a space
  lit at 144 is level 5 at 1 m (as before), 11 at 2 m and 17 at 10 m (was
  25, near black): the gorge, the chamber's far walls and the vault's banks
  read now, and 104 still reads dark. A level's `haze: { color, half }`
  makes surfaces seen from sky tiles (and sprites and models standing in
  them) fade toward the colour instead of fogging darker: the palette
  builds haze tables after the colormaps (15 steps of 32 levels, 75 ms,
  kept per colour), and the renderer picks the step by distance, dithered
  like the light. Mission 1's haze is the sky's dusky purple, halfway at
  20 m. Frame time 2.3 to 2.9 ms (the haze's per-pixel work outdoors).
  165 tests.
- 2026-10-13: Phase 1d step 6 started, wall bands (engine). A glyph's
  `bands: [{ from?, to?, tex }]` change its wall's texture with height
  (first band wins, the wall's texture elsewhere, each hung from its top),
  and the faces of an open tile's raised floor and lowered ceiling (a
  gate's lintel). Parsed per glyph (`map.bandSets`), scaled by the
  upscaler, drawn over the face in the renderer; the map viewer shows a
  wall's top band. Tests share a headless renderer (`headlessRenderer()`
  in tests/helpers.js). 168 tests.
- 2026-10-13: Phase 1d step 6 done. Mission 1's garrison is dug into the
  cliff: its outside walls, and the faces over the gate and the vent
  mouth, stand 4 m (8) above the ground in front of them with the
  canyon's rock above, worked out from the map (skipped where the rock
  would show indoors, so the gantry's end wall, which is also the
  generator's, stays panel until steps 19-20). Trims and the reactor
  column's bands come with steps 17 and 19.
- 2026-10-13: Phase 1d step 7, decals. A level's `decals: [{ x, y, z,
  face, tex, scale?, glow?, flip? }]` put see-through pictures on wall
  faces, step faces and lintels: laid out by the renderer once their
  textures' sizes are known, on the tile edges they cover
  (`world/decals.js`), and drawn over each face they're on, clipped to it,
  in its light and haze. Projectiles with `scorch` leave scorch marks where
  they burst on walls or step faces (the last 48). New art
  (`tools/art/textures/decals.js`): scorch, the Empire's crest, hazard
  stripes, a sector sign, a vent. Mission 1: the crest over the gate with
  hazard stripes along its lintel, signs in the barracks corridor, vents in
  maintenance, stripes over the overload switch. The rest of the dressing
  comes with steps 15-19. 172 tests.
- 2026-10-13: Phase 1d step 14 started, the canyon's skyline. The rock
  within 3 tiles of the canyon (and of its angled corners) steps back in
  ledges out of reach: 8, 12 and 16 above the floor in front, plus noise,
  up to 22, so the rims are jagged against the sky. Each ledge's sky
  ceiling sits just above the highest rock behind it (the Doom sky trick),
  so the view stops at the skyline and sight lines and bolts can't pass
  over a ridge; rays stay short (frame time unchanged, 2.9 ms). The
  garrison and doors keep a wall of rock round them. Rock strata by height
  (wall bands: dark below 2.5, pale above 14) on every rock face, gravel
  channels across the sand (the gravel lightened to read as gravel, not
  stains), and angled corners capped at the skyline (one whose back faced
  open ground, where the gorge was painted over a corner, is floor now).
- 2026-10-13: the skyline again, after Mark's look: the ledges read as
  "pieces of paper" (from the floor you only ever see their faces, a tile
  apart, each with a sharp top), and the strata bands looked bad. Now the
  canyon's walls end at one low rim (4.5 to 6 m, smooth along the canyon,
  climbing to meet the taller cliff round the garrison), and a **backdrop**
  takes over above it: `world/backdrop.js` keeps a height grid past the
  edge of play and `render/backdrop.js` draws it voxel-space style (each
  column marches its ray over the grid near to far, filling spans), only
  for columns that show sky and only on sky pixels, with the faces'
  texture by height, moon shading by slope, light levels and haze like
  the rest. `canyonBackdrop()` builds Mission 1's: low over the open sky,
  climbing from the rim in smooth slopes and ridges (no terraces), with
  valleys between the far ridges, 96 tiles past the map. No strata.
  Frame time 3.0 to 3.4 ms; Mission 1's module takes 0.1 s to build it.
  176 tests.
- 2026-10-14: tried the other way to give the skyline depth, all in the
  grid: walls rising 5 to 7.5 m at the face, then the rock behind it
  climbing in short steps (smoothed tile to tile) to a ridge 3 to 7 tiles
  in, each tile's sky just above the highest rock behind it, then sky. It
  needed more painter glyphs than the pool had (per-tile heights). Side by
  side with the backdrop, Mark chose the backdrop. The trial isn't kept.
- 2026-10-14: scorch marks taken out (Mark: ugly, and they add little).
  Blaster bolts no longer mark the walls they burst on: the projectile
  `scorch` field, the world's scorch list, `removeDecal` and the scorch
  art are gone. Decals placed by levels are unchanged.
- 2026-10-14: Added a Phase 1d TODO: glints on armour. The fitted palette
  ended a happy accident: the DF stormtrooper's brightest armour highlight
  used to snap to a fullbright white, which read as a lamp's reflection in
  dark rooms but glowed for no reason in the dark canyon. The TODO makes it
  a feature: highlights that brighten only when a light source can see them.
- 2026-10-15: Phase 1d step 14, in chunks. First: barricades and crates by
  the gate. A `barricade` model (`models/barricade.js`): an armoured
  shield 2.6 long and 1.15 tall, sloped both sides, with yellow-on-black
  hazard stripes along each slope (faces, not a texture: the DF
  `imp-stripe` is a panel, not stripes) and two red lamps, on feet; solid,
  with collision lines round its footprint. Three across the approach to
  the gate, angled out, cover for the gate guards; supply crates stacked
  against the face by the light strips, one half hiding the vent mouth.
  Monsters still walk into models until step 12.
- 2026-10-15: step 14, boulders. `models/boulder.js` builds
  `boulder-large` (2.6 across, 1.8 tall) and `boulder-small` (1.3, 0.8):
  a lumpy outline lofted up in six tiers, each the one below shrunk and
  shifted (so the faces stay flat), rounded like a weathered rock. Rough
  stone (`desert-gravel`; the DF rock textures' block seams made the first
  try read as masonry), the top `sandstone-pale`. Ten along the walls'
  feet in the start bowl, the gorge and the bowl, off the way through.
  The angled rock pillars are left out: the models do the job.
- 2026-10-15: step 14, floodlight towers. A `floodlight-tower` model: a
  tapered steel mast 6.6 tall on a base plate, braced and banded yellow at
  its foot, a crossbar with two lamp heads tilted down (glowing lenses) and
  a red warning light on top. Two on the bowl's north corners, by the
  strip, facing into the bowl, each with a light source (radius 8, light
  64) a few tiles out in front: pools of light out in the bowl. The first
  masts (dark steel, thin) vanished against the cliff in shadow and left
  the lamps floating; the mast is lighter and thicker now.
- 2026-10-15: step 14, the sensor mast. `models/sensor-mast.js` builds
  `sensor-mast` (a thin steel mast 8 tall on a concrete footing, an
  equipment box with a lit panel and its cable, red and white bands near
  the top, a platform) and `sensor-dish` (a pivot, an arm, a shallow dish
  tipped up with a feed horn), placed as a spinning decoration (`spin`, like
  the reactor rings) on the platform. On ledge B, where the sniper
  stands; a light source with `fx: 'blink'` at the top is the beacon,
  lighting the rock round it on and off.
- 2026-10-15: step 14, the overhang. Along the start bowl's east wall the
  cliff juts out over the sand, 2.25 m up and 1.5 m thick, 1 to 2.5 m
  deep (deepest in the middle, ragged along its edge): a slab out of
  reach, in its own shadow underneath. A first try 0.75 m thick read as a
  thin shelf from the start; thicker, it reads as rock. Step 14's art is
  done but for wind and blowing dust, which wait for steps 9 and 10.
  Frame time on canyon views (headless, 4:3, DF art): 3.3 to 3.5 ms
  before step 14's props, 3.6 to 4.1 ms after.
- 2026-10-15: the overhang less flat (Mark: its bottom and top were too
  flat). Each tile has its own slab now, a wedge of rock thickening into
  the wall: the underside climbs from about 1.9 m at the wall to 2.3 m at
  the lip, the top falls from 4.4 m to 3.9 m, each with a lumpy offset
  (value noise, in steps of 12.5 cm). Seen from the bowl the underside
  steps and the top's silhouette is ragged. (Heights stay per tile: there
  are no sloped floors or slabs, so the surfaces step rather than slope.)
- 2026-10-15: the overhang taken out (Mark: he doesn't like it). The start
  bowl's east wall is a plain cliff again. Step 14 has no overhang.
- 2026-10-15: playtest fix, the escape hatch (Mark: the door in the reactor
  room wouldn't open). The overload switch opened it, but like any door it
  shut after 4 seconds, and being remote-locked it couldn't be opened again:
  by the time you'd ridden the lift back up to the ring, the way out was
  sealed. The hatch has `stayOpen` now. The level checker had passed it
  because a switch opens it; a remote door now counts as passable only if it
  stays open or what opens it can be used again (a `repeat` switch, a
  `once: false` trigger), and without the fix it reports Mission 1's exit
  unreachable. A new test pulls the overload switch and checks the hatch is
  still open 30 seconds later. MODDING.md updated. 176 tests, the validator
  and the smoke test pass.
- 2026-10-15: glints on armour (Phase 1d's TODO). A sprite sheet, or its art
  override, can list `glint` colours: those pixels snap to lit colours and
  are kept as a mask on each frame. They're drawn at the sprite's light plus
  3x (`GLINT_GAIN`) the glint light where it stands: light from sources
  only, each baked a second time at twice its radius (`GLINT_REACH`) into
  `map.glintLight`, read through a second light map (`world.glintmap`).
  Animated sources, `setLight` and dynamic lights (at twice their radius)
  update it; a source with `glint: false` stays out. The stormtrooper's
  highlights glint (252,252,252 on the DF art, 255,255,255 on the generated
  sheet, whose highlights had glowed everywhere). A sheet's `glow` colours
  snap to fullbright: the DF probe droid's death sparks shine again (lost
  with the fitted palette). Screenshots with the DF art: in the barracks
  corridor the armour catches the lamps as crisp white glints, softer on the
  generator floor 6 tiles from a lamp, none in the dark canyon, and they
  flash with a muzzle flash and a bolt passing 2.5 tiles away. Cost: 0.14
  ms a tick for the glint light with three flashes, rendering within noise.
  MODDING.md, the validator, 7 new tests (183); the validator and smoke test
  pass.
- 2026-10-15: fixed the backdrop's smearing (Mark: artifacts at some
  angles). Its texture column was x + y along the ray, the same for
  neighbouring columns when looking along the x = y diagonal, so the rock
  smeared into horizontal stripes and V shapes there (and was over-busy
  the other way). Now each corner of the grid notes which way its slope
  faces, and the texture runs along the face (y where it faces along x,
  else x), fixed to the world like a wall's. Checked from the start bowl,
  gorge, bowl and landing pad at every 30 degrees and all four diagonals.
  1 new test (184).
- 2026-10-15: Phase 1b M, the whole Dark Forces texture pack in the repo
  (Mark: unpack it, sorted by what the textures show). The zip's 918 PNGs
  are 916 textures in `assets/custom/df-textures/`, in 24 folders by
  content: walls 189, floors-ceilings 149, machinery 83, doors 76, lights
  55, computers-screens 55, grates-bars 37, switches-keys 37, door-frames
  29, stone-brick 28, signs-insignia 28, trims-strips 26, damaged 24,
  hazard-stripes 21, natural 19, sky 11, crates 10, ships 7, windows 7,
  3d-models 6, lifts 5, liquids 5, other 5, forcefields 4. Each was looked
  at on contact sheets. Gromas' recoloured generic textures are kept as
  `NAME_GROMAS`; two identical duplicates are kept once; `ZCSQUAR1` keeps
  both of the pack's versions. `INDEX.md` lists every texture with its size
  and the level folders it came from. `textures.mjs` reads the folder by
  default (no argument), and re-running it writes the 32 game textures
  byte-identical. README and DISCLAIMER updated.
- 2026-10-15: Phase 1b N, Dark Forces sound effects (Mark: incorporate
  "Sound Effects.zip"). The 146 MP3s are 139 sounds (seven were duplicates)
  in `assets/custom/sounds/`, in 9 folders by what they are, with
  `INDEX.md` saying what each is ("(guess)" where unsure). They play through
  `assets/custom/sound-overrides.json` (sound id -> `{ src, volume }`),
  loaded at boot like the art overrides and skipped under test automation:
  23 game sounds now use DF files (the blaster, trooper rifle, probe droid,
  bolt hits, explosions, fists, doors, lifts, switch, pickups, Kyle's death,
  jump and landing). Volumes match the loudness of the synth each replaces
  (loudest 50 ms), with doors, death and landing set by hand. The engine
  downloads override files at boot and decodes them when audio unlocks,
  cuts their leading silence (25-80 ms of MP3 padding), plays the synth
  until a file is decoded, and falls back to the synth for good if it
  fails. New sound ids with synth fallbacks that keep the old sounds:
  `droid-fire`, `door-locked`, `health-pickup`, `player-land`, plus a soft
  new `player-jump` (the hero's `sounds`). Not in the pack, so still
  synthesized: trooper, officer and Jawa voices, Kyle's pain, menus.
  `tools/soundboard.html` plays every game sound's synth and its file side
  by side, re-maps them and gives the JSON. Checked in Chrome: all 22 files
  decode (trimmed), no console errors. 4 new tests (188), the validator and
  smoke test pass.
- 2026-10-15: Phase 1b O: Boba Fett and Bossk. Bossk (`T`) walks and fires
  concussion blasts that burst; Boba Fett (`F`) flies on his jetpack and fires
  rockets. Ripped DF art and sounds through the overrides, generated
  placeholders committed. One of each in the sandbox. 188 tests, the
  validator and the smoke test pass.
- 2026-10-15: Added the `raccoon` cheat back (Mark asked): full health, god
  mode and everything, the same as `mercenary` (they share one function).
  The README's cheat list now matches `src/content/cheats.js`. 189 tests and
  the validator pass.
- 2026-10-15: Boba Fett walks instead of flying (Phase 1b O, steps 6-9). His
  walk is made from the standing cell with a knee lifted on each side; the
  usual layout (walk 0-3, aim 4, fire 5, pain 6, death 7-10) for the cut
  sheet and the placeholder. 189 tests, the validator and the smoke test
  pass.
- 2026-10-15: Phase 1b P: door art centred top to bottom. IDDOOR1 sat 3
  texels low in its image (8-row dark edge on top, 3 rows of bevel below);
  `textures.mjs` rolls it up 3 rows before the key panels go on, and the four
  door textures are re-cut. 189 tests, the validator and the smoke test pass.
- 2026-10-15: Phase 1b Q: canyon frame time. The backdrop filled every
  column top to bottom (98k pixels a frame, about 8.5k shown); now the sky's
  rows are marked and it draws only those, once the column is done, and its
  march stops where the ray leaves its grid. Same pixels (18 snapshots);
  m1 start 13 to 7.7 ms headless, about 17 to 13.5 ms in Chrome. 189 tests,
  the validator and the smoke test pass.
- 2026-10-15: Phase 1b R: eye height 1 to 1.5. Enemies looked too tall up
  close and sprites seemed to float: the eye was at 59% of the 1.7 body, so
  the horizon crossed a stormtrooper at the waist. Now it crosses at the
  visor; on-screen sizes at a distance are unchanged. Tests that assumed the
  old eye use `EYE_HEIGHT`. 189 tests, the validator and the smoke test
  pass.
- 2026-10-15: Phase 1b R: eye height 1.5 to 1.25 (Mark asked). Pushed
  without running the tests, as asked.
- 2026-10-15: Phase 1b S: renderer speed, deeper (Mark turned down WebGL).
  Floors and ceilings sample light only where they draw and do no
  divisions per pixel; models hidden behind walls are skipped; the
  backdrop passes over blocks of its grid too low to show. In Chrome at
  548 columns: canyon 11.1 to about 9.3 ms, indoors 8.1 to 6.1. Output is
  byte-identical except a few pixels a view at a colormap step. 190 tests,
  the validator and the smoke test pass.
