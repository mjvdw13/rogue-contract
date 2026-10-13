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

Credits: game and art by LucasArts. The enemy sheets were ripped by Crazy
Ivan, the weapons sheet by Dolphman.
