"""Cuts the dewback sheet (sheet.jpg, painted pixel-art poses on a blue
backdrop) into the game's dewback decoration sprite.

    python assets/custom/dewback/cut.py [--preview <png>]

Needs Python 3 with Pillow and numpy, and Node (to read the game's palette).
The shared steps are in ../sheetcut.py. Writes
assets/sprites/decor/dewback.png, in the frame order of the `dewback` in
src/content/decor.js: 0-4 standing, seen from the front, the front
three-quarter, the side, the back three-quarter and the back; then 5-9,
10-14 and 15-19 the same five views a third, two thirds and all the way to
the head raised and the tail lowered.

The sheet has eight poses and no animation, so the second pose is made here:
the head rises three pixels and the tail drops three (in three slices each),
and the body and legs stay still, with two poses in between. The game holds
each end pose for four seconds and passes through the others.

The views face left (the game mirrors them for the other side): the sheet's
front three-quarter faces right, so it's flipped.
"""
import sys
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
from sheetcut import ROOT, assemble, components, cut_poses, key, load, save  # noqa: E402

SOURCE = HERE / 'sheet.jpg'
OUT = ROOT / 'assets/sprites/decor/dewback.png'
BACKDROP = (1, 54, 248)

# A dewback stands 2.1 units to the top of its saddle's horn (a trooper is
# 1.76), so about 4.4 long, drawn at the Dark Forces sprites' density (about
# 37.6 px per unit; the decoration's `scale` is 0.85). The side view
# (row 3, left) is 242 px tall on the sheet.
SCALE = 2.1 * 32 / 0.85 / 242

# Each view's box on the sheet, [x0, y0, x1, y1] (a pose whose middle is
# inside it), and whether to flip it to face left: front, front
# three-quarter, side, back three-quarter, back.
VIEWS = [
    ((60, 20, 240, 265), False),
    ((260, 20, 650, 265), True),
    ((50, 580, 580, 830), False),
    ((310, 300, 650, 550), False),
    ((60, 300, 240, 550), False),
]

# The sprite's look: the villagers' soft take on Dark Forces (sheetcut.DARK_FORCES),
# a little stockier.
STYLE = dict(widen=1.08, median=3, contrast=0.0, gamma=1.1, sharpen=0.5, side=(0.85, 1.05), outline=1.0, threshold=0.45,
             range=(14, 205), box=True, lift=0.75)

# The palette's greens, browns and tans (the saddle, the belly).
RAMPS = ['olive', 'sand', 'rust', 'beige', 'concrete', 'gray', 'flesh']

# The restyle mutes colour; the hide's green is pushed back up first.
SATURATION = 1.25

# The idle shifts between two poses: the sheet's own (head down, tail up) and
# one with the head raised and the tail lowered, as if it were swinging on its
# hips, with two poses in between. The body and legs never move (moving them
# looked like the whole sprite bobbing). The head and tail move in three
# slices each, one, two and three pixels out from the body, so the step where
# they join it is small. Per
# view (front three-quarter, side, back three-quarter): the slices as
# (first column, end column, rows down), head first. The front and back views
# stay still: the head and tail point at or away from the camera. Columns where
# a foot reaches the ground (within FOOT_REACH rows) stay still too.
MOVES = {
    1: [(0, 60, -3), (60, 76, -2), (76, 92, -1), (148, 162, 1), (162, 176, 2), (176, 224, 3)],
    2: [(0, 52, -3), (52, 66, -2), (66, 80, -1), (152, 172, 1), (172, 195, 2), (195, 224, 3)],
    3: [(0, 48, -3), (48, 60, -2), (60, 72, -1), (138, 152, 1), (152, 166, 2), (166, 224, 3)],
}
# The poses in between: the share of the full move, in thirds.
STEPS = 3
FOOT_REACH = 10


def mirror(p, width):
    return dict(mask=p['mask'][:, ::-1], alpha=p['alpha'][:, ::-1], rgb=p['rgb'][:, ::-1], centre=width - p['centre'], base=p['base'])


def raise_head(frame, slices, step):
    """The frame with its head and tail moved by the slices' rows (negative is
    up) `step` thirds of the way, everything else as it was. A column moves
    whole, so neither stretches."""
    h, w = frame.shape[:2]
    out = frame.copy()
    solid = frame[..., 3] > 0
    for x0, x1, full in slices:
        dy = int(np.sign(full)) * int(abs(full) * step / STEPS + 0.5)
        for x in range(x0, x1):
            rows = np.nonzero(solid[:, x])[0]
            if not dy or not len(rows) or h - 1 - rows.max() <= FOOT_REACH:
                continue
            out[:, x] = 0
            if dy < 0:
                out[: h + dy, x] = frame[-dy:, x]
            else:
                out[dy:, x] = frame[: h - dy, x]
    return out


def main():
    alpha, rgb = key(load(SOURCE), BACKDROP)
    grey = (rgb @ [0.3, 0.59, 0.11])[..., None]
    rgb = np.clip(grey + (rgb - grey) * SATURATION, 0, 255)
    lab, info = components(alpha >= 0.5)
    width = alpha.shape[1]
    poses = []
    for box, flip in VIEWS:
        p = cut_poses(alpha, rgb, lab, info, box)[0]
        poses.append(mirror(p, width) if flip else p)
    strip = assemble(poses, SCALE, style=STYLE, ramps=RAMPS)
    n = len(poses)
    fw = strip.shape[1] // n
    frames = [strip[:, i * fw:(i + 1) * fw] for i in range(n)]
    sheet = [*frames]
    for step in range(1, STEPS + 1):
        sheet += [raise_head(f, MOVES[i], step) if i in MOVES else f for i, f in enumerate(frames)]
    save(np.concatenate(sheet, 1), OUT, len(sheet))


if __name__ == '__main__':
    main()
