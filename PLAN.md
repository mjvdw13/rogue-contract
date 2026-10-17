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
| Scope | **A vertical slice first**, then decide on more missions. |
| Title and repo | **Rogue Contract**. Public repo `mjvdw13/rogue-contract`, served by GitHub Pages from `main`. "Star Wars" and "Dark Forces" stay out of the title. |
| Art, sound and rights | A non-commercial fan game. Mark's decisions (2026-10-12, 2026-10-15): ripped Dark Forces art and sound effects are committed in `assets/custom/` and used on the hosted site, through `overrides.json` and `sound-overrides.json`, with generated art and synth sounds as the fallback (and what tests and the smoke test use). Characters Mark makes with AI image tools are committed as our own art. Music stays original: no note-for-note John Williams. |

## Waiting on Mark

These need Mark to try something, or to decide. Don't start them without him.

- [ ] **Thermal detonator:** try a quick tap (back to the old low toss)
      and a long throw (the high arc, unchanged).
- [ ] **Concussion rifle:** try a shot into a crate or a villager (it
      bursts on them now).
- [ ] **Boba Fett and Bossk:** where they appear in the story (sandbox only
      today).
- [ ] **Which mission is the vertical slice:** the Canyon Garrison (built, the
      story's Mission 3) or Mos Eisley (the story's Mission 1).
- [ ] **More renderer speed:** the next step would be Web Workers splitting
      the columns (needs cross-origin isolation, a service-worker shim on
      Pages). The canyon draws in about 9.3 ms in Chrome now.

## Next up

In this order unless Mark says otherwise.

### 1. Particles into the game (from the particle system, 2026-10-15)

The explosion styles (`src/content/explosions.js`) are only used by the
detonator (`large`) and the concussion rifle (`concussion`).

- [ ] The probe droid's death and the fuel barrel: a particle explosion
      instead of the `explosion` sprite (no sprite: Mark's decision).
- [ ] Rockets (Boba Fett): `small` where they burst, and a smoke trail.
- [ ] Sparks where blaster bolts hit walls (`bolt-spark`; `ion-spark` for the
      Jawa's ion bolts).
- [ ] **Emitters** in levels: steam vent, sparking panel, fire with embers
      and a light, reactor motes; tags, `setEmitter`, a distance cut-off.
      Validator, map viewer marks, MODDING.md. Then in Mission 1: the
      maintenance valve and broken light, the generator.
- [ ] **Weather:** sand and wind in the canyon (a wrapping box of particles
      round the camera, only under the sky). For Mos Eisley later: `dust` at
      about 100 (Mark: "perfect for sunny Mos Eisley").
- [ ] Bench again with everything on (does the budget hold?).

### 2. Mission 1: detail and immersion

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
      props, the per-skill check; `docs/mission1.md`.

### 3. Dark Forces systems

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

### 4. For the story (`docs/story.md`)

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
- [ ] Nice to have: patrol routes, civilians running away, factions (Tuskens
      against troopers).
- [ ] Fixes that go with these: the level checker skips models placed high or
      flying (the Crow); `spawn` stays quiet with `fog: false`; the headless
      play test skips opening cutscenes.

### 5. Content for the slice

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
