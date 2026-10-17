"""Cuts the five villager sprite sheets (painted pixel-art poses on a blue or
magenta backdrop) into the game's villager sprite sheets.

    python assets/custom/villagers/cut.py [--preview <png>]

Needs Python 3 with Pillow and numpy, and Node (to read the game's palette).
The shared steps are in ../sheetcut.py. Writes assets/sprites/npcs/<id>.png,
in the frame order of src/content/npcs/villagers.js: 0-5 walk, 6 stand, 7-8
flinch, 9 hunch (pain), 10-13 a fall-back death.

Every sheet has the same layout of 51 poses in four rows, so the poses are
found rather than measured by hand: the large shapes, grouped into rows by
where their feet are, left to right. Row 1: front walk (6), side walk (6).
Row 2: front and back stands (6), flinch and guard (3), the fall-back death
(4). Row 3: side walk (6), back three-quarter walk (6). Row 4: the hunch and
slump death (6), a turnaround (5). Only the front-facing poses are used, as
the engine draws one view per frame.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
from sheetcut import ROOT, assemble, body_centre, components, grow, key, load, save  # noqa: E402

FRONT_WALK = [(0, i) for i in range(6)]

# Each villager: its sheet, its backdrop colour, how tall it stands (a
# stormtrooper is 1.76) and its six front walk poses, as (row, pose). Two
# sheets drew back views among the front walk, so those take front stands
# from row 2 instead.
VILLAGERS = {
    'villager-boy': ('boy.jpg', (2, 62, 254), 1.5, FRONT_WALK),
    'villager-woman': ('woman.jpg', (176, 40, 142), 1.64, [(0, 0), (0, 1), (1, 0), (0, 2), (0, 3), (1, 1)]),
    'villager-man': ('man.jpg', (0, 5, 254), 1.76, [(0, 0), (0, 1), (0, 2), (0, 3), (0, 5), (1, 0)]),
    'villager-adventurer': ('adventurer.png', (2, 80, 215), 1.68, FRONT_WALK),
    'villager-wanderer': ('wanderer.png', (0, 77, 214), 1.78, FRONT_WALK),
}

ROWS = [12, 13, 12, 11]

# The other frames, as (row, pose) on the sheet.
FRAMES = [
    (3, 6),  # standing, from the turnaround
    (1, 6), (1, 7),  # the flinch
    (3, 0),  # the hunch
    *[(1, i) for i in range(9, 13)],  # hit, falling back, lying, dead
]

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


def find_poses(mask):
    """Each pose's mask, row by row, left to right. Some poses touch: a foot
    on the head below, or an elbow on the next pose. So the rows are split
    at the emptiest line near each quarter of the sheet, and in a row with
    too few shapes the widest is split at its thinnest column until the
    count is right. Specks beside a pose (a lock of hair) go with it."""
    h = mask.shape[0]
    counts = mask.sum(1)
    cuts = [0]
    for k in range(1, len(ROWS)):
        lo, hi = int((k / len(ROWS) - 1 / 12) * h), int((k / len(ROWS) + 1 / 12) * h)
        cuts.append(lo + int(np.argmin(counts[lo:hi])))
    cuts.append(h)
    rows = []
    for (top, bottom), expected in zip(zip(cuts, cuts[1:]), ROWS):
        band = np.zeros_like(mask)
        band[top:bottom] = mask[top:bottom]
        lab, info = components(band)
        sizes = sorted((c['size'] for c in info.values()), reverse=True)
        big = [n for n, c in info.items() if c['size'] >= 0.15 * sizes[min(5, len(sizes) - 1)]]
        poses = [lab == n for n in big]
        while len(poses) < expected:
            k = max(range(len(poses)), key=lambda i: np.ptp(np.nonzero(poses[i].any(0))[0]))
            cols = np.nonzero(poses[k].any(0))[0]
            x0, x1 = cols.min(), cols.max()
            mid = slice(x0 + (x1 - x0) // 5, x1 - (x1 - x0) // 5)
            x = mid.start + int(np.argmin(poses[k].sum(0)[mid]))
            left = poses[k].copy()
            left[:, x:] = False
            poses[k] &= ~left
            poses.insert(k, left)
        if len(poses) != expected:
            raise SystemExit(f'expected {ROWS} poses per row, found {len(poses)} in the row at {top}-{bottom}')
        for n, c in info.items():
            if n not in big:
                speck = lab == n
                for p in poses:
                    if (grow(p, 3) & speck).any():
                        p |= speck
                        break
        poses.sort(key=lambda p: np.nonzero(p.any(0))[0].min())
        rows.append(poses)
    return rows


def pose(alpha, rgb, mask):
    """A pose for assemble(), its lowest pixel (feet, or body lying down) on
    the frame's bottom row."""
    return dict(mask=mask, alpha=np.where(mask, alpha, 0), rgb=rgb, centre=body_centre(mask), base=int(np.nonzero(mask.any(1))[0].max()))


def cut(id, source, backdrop, height, walk):
    alpha, rgb = key(load(HERE / source), backdrop)
    rows = find_poses(alpha >= 0.5)
    frames = [pose(alpha, rgb, rows[r][i]) for r, i in walk + FRAMES]
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
