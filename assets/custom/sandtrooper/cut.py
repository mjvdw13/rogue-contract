"""Cuts the sandtrooper asset sheet (sheet.jpg, AI-generated art on a blue
backdrop) into the game's sandtrooper sprite sheet.

    python assets/custom/sandtrooper/cut.py [--preview <png>]

Needs Python 3 with Pillow and numpy, and Node (to read the game's palette).
The shared steps are in ../sheetcut.py.
Writes assets/sprites/monsters/sandtrooper.png. The frame order is the one in
src/content/monsters/sandtrooper.js: 0-5 walk, 6 aim, 7 fire, 8 pain,
9-12 death. `--preview` also writes the sheet 4x on grey, for checking.

The engine draws one view per frame, so only the front-facing poses are used.
"""
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
from sheetcut import DARK_FORCES, ROOT, assemble, components, cut_poses, key, load, save  # noqa: E402

SOURCE = HERE / 'sheet.jpg'
OUT = ROOT / 'assets/sprites/monsters/sandtrooper.png'

# Drawn at the Dark Forces sprites' density, about 37.6 px per unit (the
# game draws 32, so the monster's `scale` is 0.85). A standing sandtrooper
# is 191 px tall on the sheet and 1.76 units in the game.
SCALE = 1.76 * 32 / 0.85 / 191

# Each group is a box on the sheet, [x0, y0, x1, y1] inclusive, around
# `figures` poses side by side, and `base`: the sheet row of their feet (the
# frame's bottom row). A pose belongs to the box its middle is in. When the
# poses touch, each one's rifle barrel runs right into the next pose, ending
# at the measured `tips` (see split()).
GROUPS = [
    # The front-view walk.
    dict(box=(10, 30, 535, 232), figures=6, base=228, tips=[(121, 143), (205, 151), (284, 147), (365, 144.5), (450, 152.5)]),
    dict(box=(490, 236, 576, 418), figures=1, base=416),  # aim
    dict(box=(577, 236, 662, 418), figures=1, base=416),  # fire
    # "Taking damage" x3 and the faller death; only the first is used.
    dict(box=(5, 650, 452, 832), figures=4, base=829, tips=[(124, 744), None, None]),
    # A fall onto the back (captioned "aiming" on the sheet).
    dict(box=(745, 228, 862, 420), figures=1, base=417),
    dict(box=(862, 228, 982, 420), figures=1, base=417),
    dict(box=(982, 228, 1102, 420), figures=1, base=417),
    dict(box=(1102, 228, 1240, 420), figures=1, base=417),
]
# Sheet frame -> (group, figure): the walk, aim, fire, pain, and the death.
FRAMES = [(0, 0), (0, 1), (0, 2), (0, 3), (0, 4), (0, 5), (1, 0), (2, 0), (3, 0), (4, 0), (5, 0), (6, 0), (7, 0)]
FIRE_FRAME = 7
MUZZLE = (648, 291)  # the fire pose's muzzle, on the sheet

BACKDROP = (2, 125, 240)


def muzzle_flash(frame, x, y):
    """A red blaster flash centred on (x, y), in fullbright palette colours."""
    core, hot, red, dark = (255, 250, 200), (255, 170, 30), (255, 40, 30), (210, 20, 20)
    h, w = frame.shape[:2]
    for dy in range(-4, 5):
        for dx in range(-4, 5):
            d, spike = abs(dx) + abs(dy), dx == 0 or dy == 0
            colour = core if d <= 1 else hot if d <= 2 else red if d <= 3 else dark if spike and d <= 4 else None
            if colour and 0 <= x + dx < w and 0 <= y + dy < h:
                frame[y + dy, x + dx] = (*colour, 255)


def main():
    alpha, rgb = key(load(SOURCE), BACKDROP)
    lab, info = components(alpha >= 0.5)
    poses = [cut_poses(alpha, rgb, lab, info, g['box'], g['figures'], g.get('tips', ()), g['base']) for g in GROUPS]
    frames = [poses[gi][fi] for gi, fi in FRAMES]

    def flash(i, frame, box):
        if i == FIRE_FRAME:
            sx = frame.shape[1] / (box[2] - box[0])
            sy = frame.shape[0] / (box[3] - box[1])
            muzzle_flash(frame, int((MUZZLE[0] - box[0]) * sx) + 2, int((MUZZLE[1] - box[1]) * sy))

    # Restyled to match the Dark Forces stormtrooper it fights beside
    # (sheetcut.DARK_FORCES), in the armour's few ramps.
    sheet = assemble(frames, SCALE, draw=flash, style=DARK_FORCES, ramps=['gray', 'beige', 'concrete', 'orange'])
    save(sheet, OUT, len(frames))


if __name__ == '__main__':
    main()
