# Custom art

Use this folder to try out art from outside the generators, such as sprites
ripped from other games or your own drawings. New files here are ignored
by git, so they stay on your computer.

The exception is the Dark Forces art below, committed with `cut.mjs` and
`overrides.json`. The hosted game uses it too. Read `DISCLAIMER.md`: it
must not be redistributed.

## Overriding a game asset

`assets/custom/overrides.json` maps a committed asset to a replacement. The
game loads the replacement instead and logs `Art override: ...` in the
console, locally and on the hosted site. The automated smoke test never
reads this file.

`overrides.json` is committed, so an entry pointing at a file that is only
on your computer (an ignored file) can't load on the hosted site. The game
then falls back to the committed art, with a warning in the console. Keep
private entries out of the committed file.

```json
{
  "assets/sprites/monsters/stormtrooper.png": {
    "src": "assets/custom/stormtrooper.png",
    "frameWidth": 48,
    "frameHeight": 68,
    "scale": 0.85
  }
}
```

- `src` is the replacement image.
- `frameWidth` and `frameHeight` are optional, for a sprite sheet cut at a
  different frame size. Frames must keep the original's order (see the
  monster's `anims`).
- `scale` is optional, for art drawn at a different pixel size. The game
  draws 32 pixels per tile, so a sheet whose 1.76-tall trooper is 66 pixels
  tall needs `0.85`.

Delete `overrides.json`, or an entry in it, to go back to the committed art.

## The Dark Forces enemies and weapons

`cut.mjs` cuts the ripped Dark Forces stormtrooper, Imperial officer, probe
droid and Trandoshan (Bossk) sheets into the game's 12-frame monster layout
(the trooper, officer and Bossk with their walk from four more views after
it: front three-quarter, side, back three-quarter and back),
Boba Fett into the same with an 11th frame (his fall is four frames, and
his walk is made from the standing cell, as he only flies in Dark Forces,
and his standing cells from the four other views follow),
his rocket into its own six frames, the weapons
sheet into the fists, the blaster (the Bryar pistol) and the thermal
detonator, and the detonator in flight and its two pickups from the pickups
zip ("Pickups - Weapons, Ammo & Collectables": unpack it into the same
folder, so it holds `Pickups/`). It adds their
entries to `overrides.json`, keeping keys added by hand (`glint`, `glow`).
Give it the folder the sheets are in (their file names are listed in the
script). Boba Fett comes as a zip of separate cells: unpack it into the
same folder, so it holds `BOBAFETT.cells/`:

```
node assets/custom/cut.mjs "<folder with the sheets>"
```

Weapon sprites are drawn 1:1, so they have no `scale`; the cutter pads each
frame so the art lands where Dark Forces put it, given the weapon's `offset`.

## The Moldy Crow

`jk-crow/` holds Jedi Knight's Moldy Crow textures (the "PC _ Computer -
Star Wars_ Jedi Knight - Dark Forces II - Ships - The Moldy Crow" zip), as
they came. `crow.mjs` copies them into `textures/` with names that say
what each covers (`crow-hull-side`, `crow-wing` and so on; its `CROW` table
has JK's names), and `src/content/textures.js` loads them from there, with
no generated stand-in, like Mos Eisley's. The model is
`src/content/models/crow.js`.

```
node assets/custom/crow.mjs
```

## The Dark Forces textures

`textures.mjs` replaces each generated wall, floor, ceiling and sky texture
with one from the Dark Forces texture pack ("MS-DOS - Star Wars_ Dark Forces
- Miscellaneous - Textures" zip), writing them to `textures/` and adding
their entries to `overrides.json`. The picks are in the script's `TEXTURES`
table. Switches and key doors are composited: Dark Forces wall or door art
with its small switch or key panel laid on top:

```
node assets/custom/textures.mjs
```

It reads `df-textures/`: the whole pack (916 textures), sorted into folders
by what each texture shows (doors, door frames, walls, floors and ceilings,
lights, switches, rock and so on) rather than by level.
`df-textures/INDEX.md` lists every texture with its size and the level
folders it came from. To use another texture, look it up there and add it
to the `TEXTURES` table by name; the script finds it in any folder.

## The Dark Forces sounds

`sounds/` holds Dark Forces' sound effects ("Sound Effects.zip"), sorted
into folders by what each one is: weapons, impacts and explosions, doors,
lifts and switches, pickups and gear, the player, enemies, ambience,
vehicles and interface. `sounds/INDEX.md` says what each one is.

`sound-overrides.json` picks which the game plays: it maps a sound id (from
`src/content/sounds.js`) to a file and a volume. The file plays instead of
the synthesized sound, locally and on the hosted site; the synth stands in
until the file has loaded, and for good if it can't load. The automated
tests and smoke test never read this file. Each volume was set so the file
is about as loud as the synth sound it replaces.

```json
{
  "blaster-fire": { "src": "assets/custom/sounds/weapons/PISTOL-1.mp3", "volume": 1.08 }
}
```

To try other files or volumes, serve the repo (`npm run serve`) and open
`/tools/soundboard.html`: it plays every game sound's synth and its file side
by side, lets you pick another file and volume, and gives you the JSON to
paste into `sound-overrides.json`.

## The dewback

`dewback/sheet.jpg` is Mark's dewback sheet (eight poses on a blue backdrop).
`dewback/cut.py` writes `assets/sprites/decor/dewback.png`: five views
(front, front three-quarter, side, back three-quarter, back) in four poses,
at the Dark Forces sprites' pixel size, in the palette's olive, sand, rust
and beige ramps. The second pose is made in the cutter (the sheet has no
animation): the head rises three pixels and the tail drops three, in three slices
each, while the body and legs stay still, with two poses in between. The game
holds each end pose four seconds. It's a decoration (`dewback` in `src/content/decor.js`): it stands
at the angle it's placed at and doesn't move.

```
python assets/custom/dewback/cut.py [--preview preview.png]
```

## The sandtrooper

`sandtrooper/sheet.jpg` is an AI-generated asset sheet (not ripped art), so
its cut sheet is committed straight to
`assets/sprites/monsters/sandtrooper.png`, with no override. `cut.py` keys
out the blue backdrop, splits poses whose rifle barrels run into the next
pose (the barrel tips are measured by hand in its `GROUPS` table), scales
them down to the Dark Forces sprites' pixel size, restyles them to match
the Dark Forces stormtrooper (`sheetcut.DARK_FORCES`: a stocky build,
smoothed texture, strong contrast with deep shadows, side lighting, dark
contours, a few colour ramps) and snaps them to the palette. The rifle
barrels of the side and back three-quarter walks point left, into the pose
before. All 48 poses are cut and restyled together; the game's 37 frames
(the front poses, then the walk from the four other views) are picked from
them. `--full` also writes all 48 on a transparent grid in the sheet's
layout (12, 13, 12 and 11 a row, frames of the game's size), in the game's
colours and pixel size, for touching up by hand. These frames, with the
plain T-21 and an orange pauldron, go to `sandtrooper/base.png` (the
commander's body, below).

`rifle.py` (run by `cut.py`, or alone) then gives them a sharper T-21 and a
black pauldron, from `sandtrooper/rifle-sheet.jpg`: the in-game grid
redrawn by an image AI, about 2x on a grey checkerboard. The rifle is
grafted on as for the commander (`graft.py`, below), with the light gaps
between its barrel's fins kept as rifle; the orange pauldron is recoloured
black. The sheet's mistakes are left out: the aim and fire poses (drawn
side-on, though they shoot straight at the player) keep base.png's head-on
T-21, the falling pose's second rifle on the ground goes, and so does the
sheet's corpse under the dead pose's rifle. The frames are 100x72, like the
commander's, for the longer barrel. It needs Python 3 with Pillow and numpy:

```
python assets/custom/sandtrooper/cut.py --preview preview.png --full sandtrooper-full.png
```

## The sandtrooper commander

`sandtrooper-commander/sheet.jpg` is the sandtrooper's in-game grid
(`sandtrooper/cut.py --full`) given a heavy rifle (a thick barrel and a
wooden stock) by an image AI, scaled up about 2x on white. `cut.py` lays it
over the sandtrooper's frames from before its sharper rifle
(`sandtrooper/base.png`, with the orange pauldron) and takes only the rifle
from it (`graft.py`, shared with the sandtrooper's `rifle.py`), and the body
it uncovers where the T-21 crossed it, so the body stays the sandtrooper's
pixel for pixel. It leaves out the sheet's mistakes (the
flashes painted on the fire poses, a loose blob past the aim pose's
barrel), lifts the dead pose's rifle onto the ground, fills the light
highlight along the barrel (too light to read as metal, so it was left
see-through), and eases the rifle's hard dark outline toward the colours
round it. The aim and fire poses shoot
straight at the player, but the sheet draws the rifle side-on there, so
they keep the sandtrooper's frames and get the heavy rifle's muzzle painted
head-on in front of the chest, with the game's red flash on its bore. The
frames are 100x72, for the longer barrel:

```
python assets/custom/sandtrooper-commander/cut.py --preview preview.png
```

## The Jawa

`jawa/sheet.png` is a Jawa sprite sheet (painted pixel-art poses on a blue
backdrop); `jawa/cut.py` cuts it the same way into
`assets/sprites/monsters/jawa.png`. Every pose stands apart, so nothing
needs splitting. Jawas are 1.25 units tall, up to a trooper's chest. The eyes
and the muzzle flash snap to fullbright colours, so they glow in the dark.
The walk from the other views is found on the sheet (it has the villagers'
layout) and follows the front poses:

```
python assets/custom/jawa/cut.py --preview preview.png
```

## The villagers

`villagers/` holds five AI-generated villager sheets (a boy, a woman in a
head scarf, a spacer in a vest, a drifter and a bearded hermit), four on
blue and one on magenta. They share one layout of 48 poses, so `cut.py`
finds the poses itself (splitting the few that touch) and cuts 14 frames
of each into `assets/sprites/npcs/`: the front walk, a stand, a flinch, a
hunch and a fall-back death, then the walk and the stand from the four
other views (42 frames). The sheets mix up some front and back walk poses,
so each villager lists its own. They are restyled toward the Dark Forces
officer and Bossk (the realistic sprites, not the stormtrooper's hard
armour): soft contrast, gentle side light, and the source's dark line work
eased into shading, so nothing reads as a black outline (`STYLE` in
`cut.py`):

```
python assets/custom/villagers/cut.py --preview preview.png
```

The cutters share their steps (keying, scaling, the palette) through
`sheetcut.py`. Re-cutting the sandtrooper or the Jawa today gives
slightly different colours than the committed sheets, because the
palette was refitted after they were cut (Phase 1d step 1).

Credits: game and art by LucasArts. The enemy sheets were ripped by Crazy
Ivan, the weapons sheet by Dolphman.
