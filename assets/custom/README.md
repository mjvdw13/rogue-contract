# Local art (never published)

Everything in this folder except this README is ignored by git, so it stays
on your computer. Use it to try out art that must not go on GitHub Pages,
such as sprites ripped from other games or photos of real people. Don't
force-add anything from here: once it's on GitHub, it's public.

## Overriding a game asset

`assets/custom/overrides.json` maps a committed asset to a local replacement.
When the game runs on `localhost` or `127.0.0.1`, it loads the replacement
instead and logs `Local art override: ...` in the console. The public site
and the automated smoke test never read this file.

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
