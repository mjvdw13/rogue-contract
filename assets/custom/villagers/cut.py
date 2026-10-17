"""Cuts the five villager sprite sheets (painted pixel-art poses on a blue or
magenta backdrop) into the game's villager sprite sheets.

    python assets/custom/villagers/cut.py [--preview <png>]

Needs Python 3 with Pillow and numpy, and Node (to read the game's palette).
The shared steps are in ../sheetcut.py. Writes assets/sprites/npcs/<id>.png,
in the frame order of src/content/npcs/villagers.js: 0-5 walk, 6 stand, 7-8
flinch, 9 hunch (pain), 10-13 a fall-back death; then the walk from the
other views, six frames each (14-19 front three-quarter, 20-25 side, 26-31
back three-quarter, 32-37 back), and the stand from them (38-41).

Every sheet has the same layout of 48 poses in four rows
(sheetcut.LAYOUT), so the poses are found rather than measured by hand
(sheetcut.find_poses).
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
from sheetcut import ROOT, assemble, find_poses, key, load, pose, save  # noqa: E402

FRONT_WALK = [(0, i) for i in range(6)]

BACK_WALK = [(1, i) for i in range(6)]

# Each villager: its sheet, its backdrop colour, how tall it stands (a
# stormtrooper is 1.76), and its six front and six back walk poses, as
# (row, pose). The sheets mix the two up: some drew back views among the
# front walk, and fronts among the back walk, so those take front stands
# from row 2, and back poses from row 1 or twice over.
VILLAGERS = {
    'villager-boy': ('boy.jpg', (2, 62, 254), 1.5, FRONT_WALK, BACK_WALK),
    'villager-woman': ('woman.jpg', (176, 40, 142), 1.64, [(0, 0), (0, 1), (1, 0), (0, 2), (0, 3), (1, 1)],
                       [(1, 2), (1, 3), (1, 4), (1, 5), (0, 4), (0, 5)]),
    'villager-man': ('man.jpg', (0, 5, 254), 1.76, [(0, 0), (0, 1), (0, 2), (0, 3), (0, 5), (1, 0)],
                     [(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (0, 4)]),
    'villager-adventurer': ('adventurer.png', (2, 80, 215), 1.68, FRONT_WALK, [(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 3)]),
    'villager-wanderer': ('wanderer.png', (0, 77, 214), 1.78, FRONT_WALK, [(1, 1), (1, 3), (1, 4), (1, 5), (1, 1), (1, 3)]),
}

# The other frames, as (row, pose) on the sheet.
FRAMES = [
    (3, 6),  # standing, from the turnaround
    (1, 6), (1, 7),  # the flinch
    (3, 0),  # the hunch
    *[(1, i) for i in range(9, 13)],  # hit, falling back, lying, dead
]

# The walk's front three-quarter, side and back three-quarter views (the
# back is each villager's own), and the turnaround's stands in the same
# four views.
WALK_VIEWS = [[(0, i) for i in range(6, 12)], [(2, i) for i in range(6)], [(2, i) for i in range(6, 12)]]
STAND_VIEWS = [(3, 7), (3, 8), (3, 9), (3, 10)]

# A softer take on sheetcut.DARK_FORCES, matched to the Dark Forces officer
# and Bossk rather than the stormtrooper's hard armour: no S-curve or
# sharpening and a narrower tonal range (spread about 50, like theirs), a
# gentle side light, no darkened contour, and the source's thin dark line
# work eased toward the colour round it (`lift`), so seams read as shading
# rather than black outlines. Downscaled by area averaging (`box`), which
# doesn't ring at edges as Lanczos does. Snapped to the whole palette, for
# smooth shading.
STYLE = dict(widen=1.15, median=5, contrast=0.0, gamma=1.1, sharpen=0.0, side=(0.85, 1.05), outline=1.0, threshold=0.45,
             range=(14, 205), box=True, lift=0.75)


def cut(id, source, backdrop, height, walk, back):
    alpha, rgb = key(load(HERE / source), backdrop)
    rows = find_poses(alpha >= 0.5)
    order = walk + FRAMES + [p for view in WALK_VIEWS for p in view] + back + STAND_VIEWS
    frames = [pose(alpha, rgb, rows[r][i]) for r, i in order]
    # Drawn at the Dark Forces sprites' density (about 37.6 px per unit; the
    # NPC's `scale` is 0.85), measured on the standing pose.
    ys = np.nonzero(rows[3][6].any(1))[0]
    scale = height * 32 / 0.85 / (ys.max() + 1 - ys.min())
    sheet = assemble(frames, scale, style=STYLE)
    save(sheet, ROOT / f'assets/sprites/npcs/{id}.png', len(frames))
    return sheet


def main():
    preview = None
    if '--preview' in sys.argv:
        i = sys.argv.index('--preview')
        preview = sys.argv[i + 1]
        del sys.argv[i:i + 2]
    sheets = [cut(id, *spec) for id, spec in VILLAGERS.items()]
    if preview:
        # All five on grey, 4x, one under another.
        grey = np.array([96, 100, 104], np.uint8)
        w = max(s.shape[1] for s in sheets)
        view = np.concatenate([np.pad(np.where(s[..., 3:] > 0, s[..., :3], grey), ((2, 2), (0, w - s.shape[1]), (0, 0)), constant_values=96) for s in sheets])
        Image.fromarray(view).resize((view.shape[1] * 4, view.shape[0] * 4), Image.NEAREST).save(preview)


if __name__ == '__main__':
    main()
