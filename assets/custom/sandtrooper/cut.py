"""Cuts the sandtrooper asset sheet (sheet.jpg, AI-generated art on a blue
backdrop) into the game's sandtrooper sprite sheet.

    python assets/custom/sandtrooper/cut.py [--preview <png>] [--full <png>]

Needs Python 3 with Pillow and numpy, and Node (to read the game's palette).
The shared steps are in ../sheetcut.py.
Writes the frames to base.png (the T-21 and the orange pauldron: the
sandtrooper commander's body), then runs rifle.py, which gives them the
sharper T-21 and the black pauldron and writes
assets/sprites/monsters/sandtrooper.png. The frame order is the one in
src/content/monsters/sandtrooper.js: 0-5 walk, 6 aim, 7 fire, 8 pain,
9-12 death; then the walk from the other views, six frames each (13-18
front three-quarter, 19-24 side, 25-30 back three-quarter, 31-36 back);
37-41 standing, from the same five views (the sheet's turnaround).
`--preview` also writes the sheet 4x on grey, for checking.

Every one of the sheet's 48 poses is cut apart and restyled together, into
equal frames on a grid in the sheet's own layout (sheetcut.LAYOUT: 12, 13,
12 and 11 poses a row); the game's frames are picked from it, so they come
out exactly alike. `--full` writes that grid (transparent, the game's
colours and pixel size), for touching up by hand.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
from sheetcut import DARK_FORCES, LAYOUT, ROOT, assemble, components, cut_poses, key, load, save  # noqa: E402

SOURCE = HERE / 'sheet.jpg'
OUT = HERE / 'base.png'

# Drawn at the Dark Forces sprites' density, about 37.6 px per unit (the
# game draws 32, so the monster's `scale` is 0.85). A standing sandtrooper
# is 191 px tall on the sheet and 1.76 units in the game.
SCALE = 1.76 * 32 / 0.85 / 191


def one(x0, x1, y0, y1, base):
    """A box around one pose that stands apart."""
    return dict(box=(x0, y0, x1, y1), figures=1, base=base)


# Each group is a box on the sheet, [x0, y0, x1, y1] inclusive, around
# `figures` poses side by side, and `base`: the sheet row of their feet (the
# frame's bottom row). A pose belongs to the box its middle is in. When the
# poses touch, each one's rifle barrel runs right into the next pose, ending
# at the measured `tips`, or with `leftward` left into the one before (see
# split()); poses touching body to body split at their thinnest column
# (`thin`). In the sheet's order, so the poses come out in its layout.
GROUPS = [
    # Row 1: the front walk, the front three-quarter walk.
    dict(box=(10, 30, 535, 232), figures=6, base=228, tips=[(121, 143), (205, 151), (284, 147), (365, 144.5), (450, 152.5)]),
    *[one(x0, x1, 30, 232, 228) for x0, x1 in [(516, 624), (633, 737), (739, 851), (848, 966), (965, 1079), (1080, 1208)]],
    # Row 2: the back walk, aim, fire, a third aiming pose, and a fall onto
    # the back (captioned "aiming" on the sheet).
    *[one(x0, x1, 228, 419, 417) for x0, x1 in [(2, 87), (90, 167), (162, 246), (248, 325), (324, 407), (399, 488)]],
    dict(box=(490, 236, 576, 418), figures=1, base=416),
    dict(box=(577, 236, 662, 418), figures=1, base=416),
    dict(box=(663, 236, 746, 418), figures=1, base=416),
    dict(box=(745, 228, 862, 420), figures=1, base=417),
    dict(box=(862, 228, 982, 420), figures=1, base=417),
    dict(box=(982, 228, 1102, 420), figures=1, base=417),
    dict(box=(1102, 228, 1240, 420), figures=1, base=417),
    # Row 3: the side walk and the back three-quarter walk, their rifles
    # pointing left; most touch the pose before.
    *[one(x0, x1, 430, 612, 607) for x0, x1 in [(2, 117), (117, 251), (252, 387)]],
    dict(box=(383, 430, 609, 612), figures=2, base=607, tips=['gap'], leftward=True),
    dict(box=(604, 430, 1247, 612), figures=7, base=607, tips=['gap'] * 6, leftward=True),
    # Row 4: "taking damage" x3 and the faller death, the prone death, dead,
    # and the turnaround (front, three-quarter; side, back three-quarter
    # and back touch at the feet).
    dict(box=(5, 650, 452, 832), figures=4, base=829, tips=[(124, 744), None, None]),
    one(434, 567, 640, 835, 829),
    one(568, 686, 640, 835, 829),
    one(700, 790, 640, 835, 829),
    one(800, 862, 640, 835, 829),
    dict(box=(870, 640, 1100, 835), figures=3, base=829, thin=True),
]
# Sheet frame -> (row, pose) in the layout: the walk, aim, fire, pain, the
# death; the walk's front three-quarter, side, back three-quarter and back;
# the turnaround, standing (front, front three-quarter, side, back
# three-quarter, back).
FRAMES = [
    *[(0, i) for i in range(6)], (1, 6), (1, 7), (3, 0), *[(1, i) for i in range(9, 13)],
    *[(0, i) for i in range(6, 12)], *[(2, i) for i in range(12)], *[(1, i) for i in range(6)],
    *[(3, i) for i in range(6, 11)],
]
FIRE = (1, 7)
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
    full = None
    if '--full' in sys.argv:
        i = sys.argv.index('--full')
        full = sys.argv[i + 1]
        del sys.argv[i:i + 2]
    alpha, rgb = key(load(SOURCE), BACKDROP)
    lab, info = components(alpha >= 0.5)
    poses = [p for g in GROUPS for p in cut_poses(alpha, rgb, lab, info, g['box'], g['figures'], g.get('tips', ()), g['base'],
                                                    g.get('leftward', False), g.get('thin', False))]
    if len(poses) != sum(LAYOUT):
        raise SystemExit(f'expected {sum(LAYOUT)} poses, cut {len(poses)}')
    starts = np.cumsum([0] + LAYOUT)
    fire = starts[FIRE[0]] + FIRE[1]

    def flash(i, frame, box):
        if i == fire:
            sx = frame.shape[1] / (box[2] - box[0])
            sy = frame.shape[0] / (box[3] - box[1])
            muzzle_flash(frame, int((MUZZLE[0] - box[0]) * sx) + 2, int((MUZZLE[1] - box[1]) * sy))

    # Restyled to match the Dark Forces stormtrooper it fights beside
    # (sheetcut.DARK_FORCES), in the armour's few ramps.
    strip = assemble(poses, SCALE, draw=flash, style=DARK_FORCES, ramps=['gray', 'beige', 'concrete', 'orange'])
    fh, fw = strip.shape[0], strip.shape[1] // len(poses)
    frame = lambda k: strip[:, k * fw:(k + 1) * fw]  # noqa: E731
    save(np.concatenate([frame(starts[r] + i) for r, i in FRAMES], 1), OUT, len(FRAMES))
    if full:
        grid = np.zeros((fh * len(LAYOUT), fw * max(LAYOUT), 4), np.uint8)
        for r, n in enumerate(LAYOUT):
            for i in range(n):
                grid[r * fh:(r + 1) * fh, i * fw:(i + 1) * fw] = frame(starts[r] + i)
        Image.fromarray(grid, 'RGBA').save(full, optimize=True)
        print(f'{full}: {len(poses)} poses in rows of {LAYOUT}, frames of {fw}x{fh}')
    sys.path.insert(0, str(HERE))
    import rifle
    rifle.main()


if __name__ == '__main__':
    main()
