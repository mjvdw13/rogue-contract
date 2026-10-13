# Custom art

Use this folder to try out art from outside the generators, such as sprites
ripped from other games or photos of real people. New files here are ignored
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

`cut.mjs` cuts the ripped Dark Forces stormtrooper, Imperial officer and
probe droid sheets into the game's 12-frame monster layout, and the weapons
sheet into the fists and the blaster (the Bryar pistol). It adds their
entries to `overrides.json`. Give it the folder the sheets are in (their
file names are listed in the script):

```
node assets/custom/cut.mjs "<folder with the sheets>"
```

Weapon sprites are drawn 1:1, so they have no `scale`; the cutter pads each
frame so the art lands where Dark Forces put it, given the weapon's `offset`.

## The Dark Forces textures

`textures.mjs` replaces each generated wall, floor, ceiling and sky texture
with one from the Dark Forces texture pack ("MS-DOS - Star Wars_ Dark Forces
- Miscellaneous - Textures" zip), writing them to `textures/` and adding
their entries to `overrides.json`. The picks are in the script's `TEXTURES`
table. Switches and key doors are composited: Dark Forces wall or door art
with its small switch or key panel laid on top. Give it the zip's
`Textures` folder:

```
node assets/custom/textures.mjs "<the pack's Textures folder>"
```

## The sandtrooper

`sandtrooper/sheet.jpg` is an AI-generated asset sheet (not ripped art), so
its cut sheet is committed straight to
`assets/sprites/monsters/sandtrooper.png`, with no override. `cut.py` keys
out the blue backdrop, splits poses whose rifle barrels run into the next
pose (the barrel tips are measured by hand in its `GROUPS` table), scales
them down to the Dark Forces sprites' pixel size and snaps them to the
palette. Only the front-facing poses are used. It needs Python 3 with
Pillow and numpy:

```
python assets/custom/sandtrooper/cut.py --preview preview.png
```

## The Jawa

`jawa/sheet.png` is a Jawa sprite sheet (painted pixel-art poses on a blue
backdrop); `jawa/cut.py` cuts it the same way into
`assets/sprites/monsters/jawa.png`. Every pose stands apart, so nothing
needs splitting. Jawas are 1.25 units tall, up to a trooper's chest. The eyes
and the muzzle flash snap to fullbright colours, so they glow in the dark:

```
python assets/custom/jawa/cut.py --preview preview.png
```

Both cutters share their steps (keying, scaling, the palette) through
`sheetcut.py`.

Credits: game and art by LucasArts. The enemy sheets were ripped by Crazy
Ivan, the weapons sheet by Dolphman.
