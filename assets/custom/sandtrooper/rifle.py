"""Gives the sandtrooper its sharper T-21 and black pauldron: the frames cut from
sheet.jpg (base.png, written by cut.py) with the rifle of rifle-sheet.jpg
grafted on (AI-generated: the sandtrooper's in-game grid, from
`cut.py --full`, scaled up about 2x on a grey checkerboard and given a more
defined rifle and a black pauldron).

    python assets/custom/sandtrooper/rifle.py [--preview <png>]

Needs Python 3 with Pillow and numpy, and Node (to read the game's palette).
cut.py runs it after writing base.png. Writes
assets/sprites/monsters/sandtrooper.png, in cut.py's frame order, in frames
of 100x72 (the commander's) for the longer barrel.

The graft is ../graft.py's: the body stays base.png's but for the rifle,
which here also takes over the dark pixels it lies on (the stock and the
pauldron behind it are black on the sheet), and the light gaps between its
barrel's fins. Where the sheet doesn't show it, the orange pauldron is
recoloured to black armour, keeping its shading. The aim and fire poses
shoot straight at the player, but the sheet draws the rifle side-on there,
so they keep base.png's frames (the T-21 head-on at the chest).
"""
import importlib.util
import sys
from pathlib import Path

import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
from graft import FH, FW, graft, grid_image  # noqa: E402
from sheetcut import LUMA, ROOT, palette, save, snap  # noqa: E402

SOURCE = HERE / 'rifle-sheet.jpg'
BASE = HERE / 'base.png'
OUT = ROOT / 'assets/sprites/monsters/sandtrooper.png'

# Where the grid lies on the sheet, (scale, dx, dy): grid pixel (x, y) is
# sheet pixel (dx + x * scale, dy + y * scale). Fitted on the bodies.
FIT = (2.052, 0.0, 0.5)
SIDE, TOP, BELOW = 14, 4, 8  # how far past each frame the sheet is read
AIM, FIRE = 6, 7  # the rifle points at the viewer: kept
DEAD = 12  # its rifle is drawn below the body's base: lifted onto the ground
T21_DEAD = (50, 56, 72, 63)  # the old T-21's barrel in the dead frame (x0, y0, x1, y1)
# Where the rifle is, in rows of the sandtrooper's frame (y0, y1), where the
# sheet drew more: a second rifle on the ground under the falling pose, and
# under the dead one a corpse that doesn't match ours.
RIFLE_ROWS = {11: (0, 52), 12: (56, FH + BELOW)}
CHECKER = (112, 148)  # the backdrop: neutral greys this bright (two squares, JPEG noise)
PAULDRON = 0.32  # the black pauldron's brightness, of the orange one's


def backdrop(rgb):
    """The sheet's grey checkerboard: neutral, and between its two greys."""
    lum = rgb @ LUMA
    return (lum >= CHECKER[0]) & (lum <= CHECKER[1]) & (np.ptp(rgb, -1) <= 10)


def blacken(frame, orange, grays):
    """The pauldron: the frame's orange pixels as black armour, as bright as
    PAULDRON of the orange, in the gray ramp."""
    rgb = frame[..., :3].astype(float)
    m = np.isin(rgb.astype(int) @ [65536, 256, 1], [int(c[0]) * 65536 + int(c[1]) * 256 + int(c[2]) for c in orange])
    m &= frame[..., 3] > 0
    lum = rgb[m] @ LUMA * PAULDRON
    frame[m, :3] = snap(np.stack([lum] * 3, -1)[None], grays)[0]
    return frame


def main():
    ramps = palette()[2]
    lit = np.concatenate([ramps[r] for r in ['gray', 'beige', 'concrete']])
    sheet_img = grid_image(SOURCE, FIT, SIDE, TOP, BELOW, fill=(130, 130, 130))
    base = np.asarray(Image.open(BASE).convert('RGBA'))
    spec = importlib.util.spec_from_file_location('sandtrooper_cut', HERE / 'cut.py')
    cut = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(cut)
    frames = []
    for k, (r, i) in enumerate(cut.FRAMES):
        old = blacken(base[:, k * FW:(k + 1) * FW].copy(), ramps['orange'], ramps['gray'])
        if k in (AIM, FIRE):
            frames.append(np.pad(old, ((TOP, 0), (SIDE, SIDE), (0, 0))))
            continue
        x0, y0 = i * FW, r * FH
        new = sheet_img[y0:y0 + TOP + FH + BELOW, x0:x0 + FW + 2 * SIDE]
        rgb, opaque, fresh = graft(old.astype(float), new, ~backdrop(new), SIDE, TOP, T21_DEAD if k == DEAD else None,
                                   over_dark=k != DEAD, fill_gaps=True, rows=RIFLE_ROWS.get(k))
        frame = np.zeros((FH + TOP, FW + 2 * SIDE, 4), np.uint8)
        frame[..., :3] = np.where(fresh[..., None], snap(rgb, lit), np.clip(rgb, 0, 255)).astype(np.uint8)
        frame[..., 3] = np.where(opaque, 255, 0)
        frames.append(frame)
    save(np.concatenate(frames, 1), OUT, len(frames))


if __name__ == '__main__':
    main()
