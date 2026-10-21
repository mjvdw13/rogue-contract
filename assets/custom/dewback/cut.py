"""Cuts the dewback sheet (sheet.jpg, painted pixel-art poses on a blue
backdrop) into the game's dewback decoration sprite.

    python assets/custom/dewback/cut.py [--preview <png>]

Needs Python 3 with Pillow and numpy, and Node (to read the game's palette).
The shared steps are in ../sheetcut.py. Writes
assets/sprites/decor/dewback.png, in the frame order of the `dewback` in
src/content/decor.js: 0-4 standing, seen from the front, the front
three-quarter, the side, the back three-quarter and the back; then 5-9 the
same five views breathing in.

The sheet has eight poses and no animation, so the breathing is made here:
the whole body (head and tail too) lifts one pixel, and the legs lengthen to
keep the feet on the ground. The game plays the standing frame, then the lift.

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

# How far the body lifts at the top of a breath (one pixel is plenty at this
# size), and how far up the legs (rows above the ground) the stretch is
# hidden: in the shin, which is narrow, rather than the spread toes.
LIFT = 1
STRETCH_AT = 9
# Columns this close to a foot's belong to its leg.
LEG_REACH = 6


def mirror(p, width):
    return dict(mask=p['mask'][:, ::-1], alpha=p['alpha'][:, ::-1], rgb=p['rgb'][:, ::-1], centre=width - p['centre'], base=p['base'])


def breathe(frame, lift, headroom):
    """The frame with its body `lift` pixels higher. Everything moves as one
    piece, so the head and tail rise whole. The feet stay on the ground: in
    the columns of the legs, a row of the shin (STRETCH_AT up) repeats to close
    the gap, so the legs lengthen by `lift` there, out of sight. `headroom` rows of blank at the top
    take the lift."""
    h = frame.shape[0]
    out = np.zeros_like(frame)
    out[: h - lift] = frame[lift:]
    feet = frame[h - 1, :, 3] > 0
    legs = feet.copy()
    for d in range(1, LEG_REACH + 1):
        legs[d:] |= feet[:-d]
        legs[:-d] |= feet[d:]
    r0 = h - STRETCH_AT - 1
    out[r0 - lift + 1 : r0 + 1, legs] = frame[r0, legs]
    out[r0 + 1 :, legs] = frame[r0 + 1 :, legs]
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
    # Headroom for the lift, on every frame.
    top = LIFT
    strip = np.concatenate([np.zeros((top, strip.shape[1], 4), np.uint8), strip])
    frames = [strip[:, i * fw:(i + 1) * fw] for i in range(n)]
    sheet = [*frames, *[breathe(f, LIFT, top) for f in frames]]
    save(np.concatenate(sheet, 1), OUT, len(sheet))


if __name__ == '__main__':
    main()
