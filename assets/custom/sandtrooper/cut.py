"""Cuts the sandtrooper asset sheet (sheet.jpg, AI-generated art on a blue
backdrop) into the game's sandtrooper sprite sheet.

    python assets/custom/sandtrooper/cut.py [--preview <png>]

Needs Python 3 with Pillow and numpy, and Node (to read the game's palette).
Writes assets/sprites/monsters/sandtrooper.png. The frame order is the one in
src/content/monsters/sandtrooper.js: 0-5 walk, 6 aim, 7 fire, 8 pain,
9-12 death. `--preview` also writes the sheet 4x on grey, for checking.

The engine draws one view per frame, so only the front-facing poses are used.
"""
import collections
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
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

BACKDROP = np.array([2.0, 125.0, 240.0])


def lit_colours():
    """The palette's lit colours. Fullbright ones would glow in the dark."""
    url = (ROOT / 'src/content/palette.js').as_uri()
    js = f"import p from '{url}'; console.log(JSON.stringify(p))"
    pal = json.loads(subprocess.run(['node', '--input-type=module', '-e', js], capture_output=True, text=True, check=True).stdout)
    return np.array(pal['colors'][1:pal['fullbrightStart']], float)


def key(rgb):
    """Soft alpha from how blue a pixel is, and its colour with the backdrop taken out."""
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    blueness = b - np.maximum(r, 0.7 * g)  # the backdrop is about 145, armour below 40
    alpha = np.clip((115 - blueness) / 70, 0, 1)
    a = np.maximum(alpha, 0.05)[..., None]
    fg = np.clip((rgb - (1 - a) * BACKDROP) / a, 0, 255)
    # Remove the backdrop's spill: nothing on a sandtrooper is blue or teal.
    fg[..., 1] = np.minimum(fg[..., 1], fg[..., 0] + 12)
    fg[..., 2] = np.minimum(fg[..., 2], fg[..., 1] + 8)
    return alpha, fg


def components(mask):
    """4-connected components of a boolean mask: a label array and each label's bbox and size."""
    h, w = mask.shape
    lab = np.zeros((h, w), int)
    info = {}
    for y0, x0 in zip(*np.nonzero(mask)):
        if lab[y0, x0]:
            continue
        n = len(info) + 1
        lab[y0, x0] = n
        q = collections.deque([(y0, x0)])
        xs, ys = [x0, x0], [y0, y0]
        size = 0
        while q:
            y, x = q.popleft()
            size += 1
            xs[0], xs[1], ys[0], ys[1] = min(xs[0], x), max(xs[1], x), min(ys[0], y), max(ys[1], y)
            for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not lab[ny, nx]:
                    lab[ny, nx] = n
                    q.append((ny, nx))
        info[n] = dict(x0=xs[0], x1=xs[1], y0=ys[0], y1=ys[1], size=size)
    return lab, info


def grow(mask, steps):
    for _ in range(steps):
        mask = mask | np.roll(mask, 1, 0) | np.roll(mask, -1, 0) | np.roll(mask, 1, 1) | np.roll(mask, -1, 1)
    return mask


def group_mask(lab, info, box):
    """The poses whose middles are in a box. Specks count only beside a pose
    (an antenna tip), so the sheet's captions are left out."""
    x0, y0, x1, y1 = box
    inside = [n for n, c in info.items() if x0 <= (c['x0'] + c['x1']) / 2 <= x1 and y0 <= (c['y0'] + c['y1']) / 2 <= y1]
    big = np.isin(lab, [n for n in inside if info[n]['size'] >= 300])
    near = grow(big, 3)
    small = [n for n in inside if info[n]['size'] < 300 and near[lab == n].any()]
    return big | np.isin(lab, small)


def runs(flags):
    """[start, end] of each run of True."""
    out, start = [], None
    for i, f in enumerate(list(flags) + [False]):
        if f and start is None:
            start = i
        elif not f and start is not None:
            out.append([start, i - 1])
            start = None
    return out


def split(mask, figures, tips):
    """Splits touching poses whose rifles point right into the next pose.

    Bodies are the runs of tall columns. Between two bodies only the left
    pose's barrel shows; a line through it and the measured tip follows the
    barrel over the next pose. The barrel is thick for a few pixels past the
    gap, then a thin rod. It goes to its owner; where it crossed the next
    pose, the hole is filled from around it.
    Returns a (mask, filled) per pose; `filled` marks the pixels to fill.
    """
    h, w = mask.shape
    counts = mask.sum(0)
    bodies = [r for r in runs(counts > 14) if r[1] - r[0] >= 25]
    if len(bodies) != figures:
        raise SystemExit(f'expected {figures} bodies, found {bodies}')
    # Every pixel first goes to the nearest body.
    owner = np.full((h, w), -1)
    ys, xs = np.nonzero(mask)
    gaps = np.array([np.where(xs < a, a - xs, np.where(xs > b, xs - b, 0)) for a, b in bodies])
    owner[ys, xs] = np.argmin(gaps, 0)
    filled = [np.zeros((h, w), bool) for _ in range(figures)]
    for k, tip in enumerate(tips):
        if tip is None:
            continue
        g0, g1 = bodies[k][1] + 1, bodies[k + 1][0] - 1
        pts, thick = [], []
        for x in range(g0, g1 + 1):
            segs = runs(mask[:, x])
            if len(segs) == 1 and 4 <= segs[0][1] - segs[0][0] + 1 <= 16:
                pts.append((x, (segs[0][0] + segs[0][1]) / 2))
                thick.append(segs[0][1] - segs[0][0] + 1)
        if not pts:
            raise SystemExit(f'no barrel between bodies {k} and {k + 1}')
        px, py = zip(*pts, tip)
        m, c = np.polyfit(px, py, 1, w=[1] * len(pts) + [len(pts)])
        for x in range(g0, int(tip[0]) + 1):
            yc = m * x + c
            half = max(thick) / 2 + 1.5 if x <= g1 + 11 else 2
            band = np.arange(int(np.ceil(yc - half)), int(np.floor(yc + half)) + 1)
            band = band[mask[band, x]]
            # Over the next pose: fill the hole if that pose shows on both sides of it.
            above, below = int(yc - half - 2), int(yc + half + 2)
            if x > g1 and owner[above, x] == k + 1 and owner[below, x] == k + 1:
                filled[k + 1][band, x] = True
            owner[band, x] = k
    return [((owner == k) | filled[k], filled[k]) for k in range(figures)]


def inpaint(rgb, known, holes):
    """Fills `holes` by repeatedly averaging the known neighbours."""
    rgb = rgb.copy()
    known = known & ~holes
    todo = holes.copy()
    while todo.any():
        acc = np.zeros_like(rgb)
        n = np.zeros(known.shape)
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                if dy or dx:
                    acc += np.roll(rgb * known[..., None], (dy, dx), (0, 1))
                    n += np.roll(known, (dy, dx), (0, 1))
        ready = todo & (n > 0)
        if not ready.any():
            break
        rgb[ready] = acc[ready] / n[ready][:, None]
        known = known | ready
        todo &= ~ready
    return rgb


def body_centre(mask):
    """The middle of the columns tall enough to be body, not rifle."""
    counts = mask.sum(0)
    cols = np.nonzero(counts >= 0.35 * counts.max())[0]
    return (cols.min() + cols.max() + 1) / 2


def snap(rgb, colours):
    """Nearest palette colour, by the game's own distance (palette.js colorDist)."""
    flat = rgb.reshape(-1, 1, 3)
    p = colours[None]
    rm = (flat[..., 0] + p[..., 0]) / 2
    d = flat - p
    dist = (2 + rm / 256) * d[..., 0] ** 2 + 4 * d[..., 1] ** 2 + (2 + (255 - rm) / 256) * d[..., 2] ** 2
    return colours[np.argmin(dist, 1)].reshape(rgb.shape)


def resample(arr, box, size, pad=64):
    """Scales a box of `arr` to `size`; the box may run off the sheet's edges."""
    padded = np.pad(arr.astype(np.float32), pad)
    box = tuple(v + pad for v in box)
    return np.asarray(Image.fromarray(padded).resize(size, Image.LANCZOS, box=box))


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
    alpha, rgb = key(np.asarray(Image.open(SOURCE).convert('RGB'), float))
    lab, info = components(alpha >= 0.5)
    lit = lit_colours()

    poses = []  # per group, per figure
    for g in GROUPS:
        mask = group_mask(lab, info, g['box'])
        parts = split(mask, g['figures'], g['tips']) if g['figures'] > 1 else [(mask, np.zeros_like(mask))]
        out = []
        for m, filled in parts:
            a = np.where(m, alpha, 0)
            a[filled] = 1
            col = inpaint(rgb, m, filled) if filled.any() else rgb
            out.append(dict(mask=m, alpha=a, rgb=col, centre=body_centre(m & ~filled), base=g['base']))
        poses.append(out)

    frames = [poses[gi][fi] for gi, fi in FRAMES]
    # One frame size for all: wide enough for the farthest pixel either side
    # of the body's centre, tall enough for the tallest pose.
    reach, height = 0, 0
    for f in frames:
        ys, xs = np.nonzero(f['mask'])
        reach = max(reach, f['centre'] - xs.min(), xs.max() + 1 - f['centre'])
        height = max(height, f['base'] + 1 - ys.min())
    fw = int(np.ceil(2 * reach * SCALE)) + 2 & ~1
    fh = int(np.ceil(height * SCALE)) + 1
    sheet = np.zeros((fh, fw * len(frames), 4), np.uint8)
    for i, f in enumerate(frames):
        box = (f['centre'] - fw / 2 / SCALE, f['base'] + 1 - fh / SCALE, f['centre'] + fw / 2 / SCALE, f['base'] + 1)
        a = resample(f['alpha'], box, (fw, fh))
        rgb = np.stack([resample(f['rgb'][..., c] * f['alpha'], box, (fw, fh)) for c in range(3)], -1)
        rgb = np.clip(rgb / np.maximum(a, 1e-3)[..., None], 0, 255)
        frame = np.zeros((fh, fw, 4), np.uint8)
        frame[..., :3] = snap(rgb, lit)
        frame[..., 3] = np.where(a >= 0.5, 255, 0)
        if i == FIRE_FRAME:
            muzzle_flash(frame, int((MUZZLE[0] - box[0]) * SCALE) + 2, int((MUZZLE[1] - box[1]) * SCALE))
        sheet[:, i * fw:(i + 1) * fw] = frame
    Image.fromarray(sheet, 'RGBA').save(OUT, optimize=True)
    print(f'{OUT.relative_to(ROOT).as_posix()}: {len(frames)} frames of {fw}x{fh}')

    if '--preview' in sys.argv:
        grey = np.array([96, 100, 104], np.uint8)
        view = np.where(sheet[..., 3:] > 0, sheet[..., :3], grey)
        Image.fromarray(view).resize((view.shape[1] * 4, fh * 4), Image.NEAREST).save(sys.argv[sys.argv.index('--preview') + 1])


if __name__ == '__main__':
    main()
