"""Cuts the Jawa sprite sheet (sheet.png, painted pixel-art poses on a blue
backdrop) into the game's Jawa sprite sheet.

    python assets/custom/jawa/cut.py [--preview <png>]

Needs Python 3 with Pillow and numpy, and Node (to read the game's palette).
The shared steps are in ../sheetcut.py. Writes
assets/sprites/monsters/jawa.png, in the frame order of
src/content/monsters/jawa.js: 0-5 walk, 6 aim, 7 fire, 8 pain, 9-12 death.

The engine draws one view per frame, so only the front-facing poses are used.
Every pose stands apart on the sheet, so each is cut on its own, with its
lowest pixel (feet, or body lying down) on the frame's bottom row.
"""
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
from sheetcut import ROOT, assemble, components, cut_poses, key, load, save  # noqa: E402

SOURCE = HERE / 'sheet.png'
OUT = ROOT / 'assets/sprites/monsters/jawa.png'
BACKDROP = (0, 2, 253)

# Jawas come up to a stormtrooper's chest: 1.25 units (a trooper is 1.76),
# drawn at the Dark Forces sprites' density (about 37.6 px per unit; the
# monster's `scale` is 0.85). A standing Jawa is 205 px tall on the sheet.
SCALE = 1.25 * 32 / 0.85 / 205

# Each frame's box on the sheet, [x0, y0, x1, y1]: a pose whose middle is
# inside it.
FRAMES = [
    # The front-view walk (row 1).
    (18, 10, 100, 214), (119, 10, 201, 215), (220, 10, 303, 215),
    (321, 9, 403, 213), (423, 10, 506, 213), (526, 9, 610, 214),
    # Aim, and fire with the muzzle flash (row 4).
    (13, 741, 111, 920), (132, 747, 253, 922),
    # Pain: the hunch (row 4).
    (395, 758, 520, 921),
    # Death: hit, falling back, lying, dead (row 2).
    (939, 267, 1073, 441), (1084, 269, 1234, 458), (1246, 343, 1398, 464), (1408, 399, 1582, 464),
]


def main():
    rgb_in = load(SOURCE)
    alpha, rgb = key(rgb_in, BACKDROP)
    lab, info = components(alpha >= 0.5)
    frames = [cut_poses(alpha, rgb, lab, info, box)[0] for box in FRAMES]
    # The eyes and the muzzle flash glow in the dark.
    r, g, b = rgb_in[..., 0], rgb_in[..., 1], rgb_in[..., 2]
    glow = ((r > 220) & (g > 150) & (b < 120)).astype(float)
    save(assemble(frames, SCALE, glow=glow), OUT, len(frames))


if __name__ == '__main__':
    main()
