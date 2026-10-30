"""Cuts the sandtrooper commander: the sandtrooper's own frames with the heavy
rifle of sheet.jpg (AI-generated: the sandtrooper's in-game grid, from
`sandtrooper/cut.py --full`, scaled up about 2x on white and given the new
rifle) grafted on.

    python assets/custom/sandtrooper-commander/cut.py [--preview <png>]

Needs Python 3 with Pillow and numpy, and Node (to read the game's palette).
Writes assets/sprites/monsters/sandtrooper-commander.png, in the
sandtrooper's frame order (see sandtrooper/cut.py), in frames of 100x72 for
the longer rifle. `--preview` also writes the sheet 4x on grey, for checking.

The body is the sandtrooper's before its own rifle was redone
(sandtrooper/base.png: the T-21 and the orange pauldron), pixel for pixel.
The graft is ../graft.py's: from the new sheet comes only the rifle (dark
metal and the wooden stock), and the body it uncovers where the T-21
crossed it (only along the rifle's line: elsewhere the sheet's body,
redrawn grimier, would mottle the armour). The barrel is a solid tube
with a light highlight along it, too light to read as metal, so past the
body it is taken whole and its gaps filled (`solid`, `fill_gaps`). The sheet's mistakes are left out: the
aim and fire poses shoot straight at the player, but the sheet draws the
rifle side-on there (with a painted flash), so those keep the sandtrooper's
frames and get the heavy rifle's muzzle painted head-on (head_on()), the
game's red flash on its bore.
"""
import importlib.util
import sys
from pathlib import Path

import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
from graft import FH, FW, graft, grid_image, is_flash  # noqa: E402
from sheetcut import ROOT, palette, save, snap  # noqa: E402

spec = importlib.util.spec_from_file_location('sandtrooper_cut', HERE.parent / 'sandtrooper/cut.py')
trooper = importlib.util.module_from_spec(spec)
spec.loader.exec_module(trooper)

SOURCE = HERE / 'sheet.jpg'
TROOPER = HERE.parent / 'sandtrooper/base.png'  # the sandtrooper with its T-21
OUT = ROOT / 'assets/sprites/monsters/sandtrooper-commander.png'

# Where the grid lies on the sheet, (scale, dx, dy): grid pixel (x, y) is
# sheet pixel (dx + x * scale, dy + y * scale). Fitted on the bodies.
FIT = (2.052, -0.5, 0.0)
# How far the commander's frames reach past the sandtrooper's on each side
# (the rifle's barrel), and above it (the falling deaths' raised rifle).
# The sheet is read BELOW further down, for the dead pose's rifle.
SIDE, TOP, BELOW = 14, 4, 8

AIM, FIRE = 6, 7  # the sandtrooper's aim and fire frames: the rifle points at the viewer
# The sheet draws the rifle side-on there, so the commander keeps the
# sandtrooper's frames (the T-21 head-on, a dark block at the chest) and the
# heavy rifle's thick muzzle is painted in front, facing the viewer (head_on()):
# its centre per frame, in the commander's frame. The flash is on the bore.
MUZZLES = {AIM: (SIDE + 44, TOP + 24), FIRE: (SIDE + 46, TOP + 24)}
DEAD = 12  # its rifle is drawn below the body's base: lifted onto the ground
CORRIDOR = 3  # over the body, the sheet is taken this many px either side of the rifle's line
T21_DEAD = (50, 56, 72, 63)  # the T-21's barrel in the sandtrooper's dead frame (x0, y0, x1, y1), dark pixels

BACKDROP_DIST = 34  # how far from white the sheet's backdrop goes (JPEG noise)


def head_on(frame, centre, ramp):
    """Paints the heavy rifle pointing at the viewer onto `frame` (RGBA):
    the thick barrel's end, a round muzzle with a dark bore, lit from the
    upper right, and the wooden stock's edge beside the receiver. Drawn 8x
    and averaged down, so its edge blends into the body."""
    ss, cx, cy = 8, centre[0], centre[1]
    x0, y0, w, h = int(cx) - 10, int(cy) - 6, 16, 12
    ys, xs = (np.mgrid[0:h * ss, 0:w * ss] + 0.5) / ss
    xs, ys = xs + x0 - cx - 0.5, ys + y0 - cy - 0.5  # relative to the muzzle's centre
    col = np.zeros(xs.shape + (3,))
    cov = np.zeros(xs.shape)
    # The stock's edge, behind the receiver toward the shoulder.
    stock = (np.abs(ys + 1.6) < 1.1) & (xs > -8.5) & (xs < -4)
    col[stock], cov[stock] = (128, 80, 40), 1
    # The barrel, a short thick tube running back up-left into the receiver.
    bx, by = -2.5, -1.2  # its far end, from the muzzle's centre
    t = np.clip((xs * bx + ys * by) / (bx * bx + by * by), 0, 1)
    tube = np.hypot(xs - bx * t, ys - by * t) < 3.6
    shade = 60 + 35 * np.clip((xs - ys) / 5, -1, 1)
    col[tube], cov[tube] = np.stack([shade] * 3, -1)[tube], 1
    # The muzzle: a rim lit on its upper right, a dark lip, and the bore.
    r = np.hypot(xs, ys)
    lit = np.clip((xs - ys) / (np.sqrt(2) * np.maximum(r, 0.1)), -1, 1)
    rim = r < 4.0
    col[rim], cov[rim] = np.stack([85 + 80 * lit] * 3, -1)[rim], 1
    col[r < 2.4] = (38, 38, 40)
    col[r < 1.7] = (10, 10, 11)
    # Averaged down to the frame's pixels.
    blk = lambda a: a.reshape(h, ss, w, ss, *a.shape[2:]).mean((1, 3))  # noqa: E731
    c = blk(cov)
    rgb = blk(col * cov[..., None]) / np.maximum(c, 1e-3)[..., None]
    area = frame[y0:y0 + h, x0:x0 + w].astype(float)
    under = area[..., 3:] > 0
    mixed = np.where(under, c[..., None] * rgb + (1 - c[..., None]) * area[..., :3], rgb)
    paint = (c > 0.15) & under[..., 0] | (c >= 0.5)
    area[paint, :3] = snap(mixed[paint][None], ramp)[0]
    area[paint, 3] = 255
    frame[y0:y0 + h, x0:x0 + w] = area.astype(np.uint8)


def main():
    ramps = palette()[2]
    lit = np.concatenate([ramps[r] for r in ['gray', 'beige', 'concrete', 'orange', 'rust']])
    sheet_img = grid_image(SOURCE, FIT, SIDE, TOP, BELOW)
    trooper_sheet = np.asarray(Image.open(TROOPER).convert('RGBA'), float)
    frames = []
    for k, (r, i) in enumerate(trooper.FRAMES):
        old = trooper_sheet[:, k * FW:(k + 1) * FW]
        x0, y0 = i * FW, r * FH
        new = sheet_img[y0:y0 + TOP + FH + BELOW, x0:x0 + FW + 2 * SIDE]
        frame = np.zeros((FH + TOP, FW + 2 * SIDE, 4), np.uint8)
        if k in MUZZLES:
            frame[TOP:, SIDE:SIDE + FW] = old
            frame[is_flash(frame[..., :3]) & (frame[..., 3] > 0)] = 0
            head_on(frame, MUZZLES[k], lit)
            if k == FIRE:
                trooper.muzzle_flash(frame, *MUZZLES[k])
            frames.append(frame)
            continue
        fg = np.abs(255 - new).max(-1) > BACKDROP_DIST
        rgb, opaque, fresh = graft(old, new, fg, SIDE, TOP, T21_DEAD if k == DEAD else None,
                                   solid=True, fill_gaps=2, corridor=CORRIDOR)
        # The sandtrooper's pixels keep their exact colours; only new ones snap.
        keep = ~fresh
        frame[..., :3] = np.where(keep[..., None], np.clip(rgb, 0, 255), snap(rgb, lit)).astype(np.uint8)
        frame[..., 3] = np.where(opaque, 255, 0)
        frames.append(frame)
    save(np.concatenate(frames, 1), OUT, len(frames))


if __name__ == '__main__':
    main()
