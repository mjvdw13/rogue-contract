# Working on Rogue Contract

A Dark Forces-style Star Wars fan FPS for desktop browsers: plain ES modules,
no build step, no runtime dependencies. The repository root is the website
(GitHub Pages serves `main`). Mark owns the project and makes the creative
calls.

## Start here

- **[PLAN.md](PLAN.md)**: decisions, what's waiting on Mark, and the open
  to-dos in order. Read it before starting anything.
- **[MODDING.md](MODDING.md)**: every content field and what it does. The
  reference for content work, and the place to document new fields.
- `docs/story.md` (the story), `docs/mission3.md` (Mission 3's design,
  per-skill placement table), `docs/plan-archive.md` (why finished features
  work the way they do: search it by feature name before redesigning one).

## Layout

```
src/engine/      the engine; never mentions Star Wars or any content id
  defs.js        define*() helpers: every content field, its defaults and JSDoc
  validate.js    content checks (also run at boot and by npm run validate)
  registry.js    turns the content pack into maps by id
  game.js        the shell: screen, input, audio, scenes, settings
  world/         simulation: world.js (the World), tilemap, level parsing
                 (level.js), physics and rays, doors, lifts, lights, light
                 map, particles, explosions, nav (flow fields), triggers/actions
  things/        per-kind think functions: player, monster, npc, projectile,
                 weapons (the weapon state machine), pickups, anim
  combat/        aim (auto-aim, lockOn), attacks, damage (hitscan, splash)
  render/        columns.js (the world renderer, one hot function), sprites,
                 models, particles, backdrop, psprite (the weapon), view
  gfx/ audio/ input/ ui/ scenes/ core/
src/content/     the game as data: monsters/, weapons/, items/, npcs/,
                 models/, levels/ (m3 is painted in code by levels/lib/painter.js;
                 sandbox is a typed test map with one of everything), sounds,
                 particles, explosions, palette, strings, config
assets/          generated art (from tools/art; don't hand-edit, it's regenerated)
assets/custom/   Dark Forces rips, Mark's character sheets and their cutters,
                 overrides.json / sound-overrides.json (see its README.md)
tools/           validate, snapshot (headless 3D render), mapview, smoke,
                 art/ (generators), lib/levelcheck.mjs (reachability),
                 particles.html (particle/explosion bench), soundboard.html
tests/           node --test; helpers.js has makeWorld, room, run, mockInput,
                 headlessRenderer
```

The engine/content split is the core rule: engine code reads fields from
definitions, never ids. A content change shouldn't need an engine change
unless it adds a capability.

## Commands

```sh
npm test                 # ~12 s, all tests (includes a minute of play in every level)
node --test tests/x.test.js   # one file, while iterating
npm run validate         # ~2 s, content and level checks; must be 0 errors, 0 warnings
npm run smoke            # ~30 s, headless Chromium (Playwright); CI runs it on every push
node tools/snapshot.mjs m3 --custom --at X,Y,ANGLE [--pitch P] [--scale 2] --out file.png
node tools/mapview.mjs m3 [--skill 5]    # top-down map PNG in tools/art/out/maps/
npm run art -- --only NAME               # regenerate one generated asset
npm run serve                            # http://localhost:8080/?map=sandbox&god
```

`snapshot.mjs --custom` renders with the Dark Forces art, which is what
players see; without it, the generated stand-ins (what tests use). Angles
are content degrees: 0 east, 90 north. Look at your snapshots: it's the
only way to check visual work without a browser.

## How work is done here

1. **Plan first.** Add the task's steps to PLAN.md before starting, tick
   them as they land, and delete the item when it's all done. No progress
   log: the commit message is the record.
2. **A new content field** goes through all of: `defs.js` (default + JSDoc),
   the engine code, `validate.js` (reject bad values with a readable
   message), MODDING.md, and a test. Unknown actions, triggers and ids are
   validator errors.
3. **Tests** describe behaviour in plain sentences ("a thrown detonator
   bounces off the wall and comes back") and build tiny maps with `room()`.
   Test engine behaviour, not tuning: don't assert a content value Mark is
   likely to retune (a speed, a count, a colour). Tuning is checked by
   looking (snapshots) and by Mark playing.
4. **Renderer changes** that should look the same are checked by rendering
   a set of snapshots before and after and comparing bytes. `drawWorld` in
   `render/columns.js` is one long function on purpose (closures and calls
   per column cost frame time); measure before restructuring it.
5. **Before committing:** `npm test` and `npm run validate`. Run the smoke
   test when you touch boot, scenes, menus, the HUD, asset loading or
   `index.html`; otherwise CI catches it.
6. **Commit and push to `main`** when a step is done and checked, one
   focused change per commit (Mark likes small updates he can try). Only
   the GitHub no-reply identity (`334615706+mjvdw13@users.noreply.github.com`),
   never a real email, in commits, files or anything sent to GitHub.
7. **Mark tries things and gives notes.** When a feature needs his eye or
   ear (feel, tuning, looks), finish it, push, and put it under "Waiting on
   Mark" in PLAN.md rather than guessing further.

## Conventions

- **Writing** (comments, docs, commit messages, PLAN.md): plain, short
  sentences, British spelling (colour, centre, armour). Say what a thing
  does and why, with the numbers that matter.
- **Commit messages:** a title like `Area: what changed` (`Concussion rifle:
  locks on Dark Forces' way, and taller blasts`), then a paragraph on why
  and the measured result. End with the Co-Authored-By line.
- **Units:** 1 tile = 1 world unit = 0.5 m; 32 texels per tile; the player
  is 1.7 tall, radius 0.5, eye 1.25. Speeds are tiles per second, times in
  seconds. Content angles are degrees, counter-clockwise, 0 east.
- **Code style:** match the file. Small JSDoc on exported functions,
  comments that explain why. Hot paths (render, particles) use typed arrays
  and avoid allocation per frame.
- **Determinism:** gameplay uses `world.rng`; cosmetic things (particles,
  explosions' looks) use their own RNG so tests stay deterministic.

## Art and sound pipeline

- `tools/art/` generates every committed PNG (`npm run art`). These are
  stand-ins: the tests and smoke test see them.
- `assets/custom/overrides.json` swaps in Dark Forces art (cut by
  `assets/custom/cut.mjs` and `textures.mjs`); `sound-overrides.json` swaps
  in Dark Forces sounds. Both load on the hosted site, never under test
  automation, and fall back to the stand-ins if a file fails.
- Character sheets Mark makes (sandtroopers, Jawa, villagers) are cut by
  Python scripts in `assets/custom/<name>/cut.py` (Pillow, numpy), sharing
  `sheetcut.py` and `graft.py`. Re-running a cutter must reproduce the
  committed sheet unless the change is intended.
- Ripped art and sound are committed to the public repo by Mark's choice;
  that's settled.

## Gotchas

- Windows machine, Git Bash and PowerShell. Files are stored with LF line
  endings (`core.autocrlf` converts on checkout); write LF.
- Another Claude session may be working in the same checkout. Check `git
  status` before editing, and don't commit files you didn't change.
- A second `Registry` built from the same content pack loses its sheets
  (the first one rewrites the shared defs). Tests share the one in
  `tests/helpers.js`.
- The validator builds every level on all five skills, so a level error
  shows up there before the game.
