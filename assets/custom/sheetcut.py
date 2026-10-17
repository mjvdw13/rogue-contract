"""Shared steps for cutting character asset sheets (poses drawn on a flat
backdrop colour) into the game's sprite sheets. Used by sandtrooper/cut.py
and jawa/cut.py; needs Pillow and numpy, and Node (for the game's palette).

    alpha, rgb = key(load(SOURCE), BACKDROP)
    lab, info = components(alpha >= 0.5)
    poses = cut_poses(alpha, rgb, lab, info, box)   # one box, one or more poses
    sheet = assemble([...poses], SCALE)
    save(sheet, OUT)
"""
import collections
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[2]


def load(path):
    return np.asarray(Image.open(path).convert('RGB'), float)


def palette():
    """The game's palette: its lit colours (index 0 is black, 255 transparent),
    its glowing (fullbright) ones, and the lit colours of each named ramp."""
    url = (ROOT / 'src/content/palette.js').as_uri()
    js = f"import p from '{url}'; console.log(JSON.stringify(p))"
    pal = json.loads(subprocess.run(['node', '--input-type=module', '-e', js], capture_output=True, text=True, check=True).stdout)
    colours = np.array(pal['colors'], float)
    start = pal['fullbrightStart']
    ramps = {name: colours[i:i + n] for name, (i, n) in pal['ramps'].items() if i < start}
    return colours[1:start], colours[start:255], ramps


def key(rgb, backdrop):
    """Soft alpha from how much a pixel looks like the backdrop (blue, or
    magenta when the backdrop is red as well as blue), and its colour with
    the backdrop taken out."""
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    if backdrop[0] > 100:
        magentaness = np.minimum(r, b) - g  # a magenta backdrop is 90 or more, the art below -15
        alpha = np.clip((98 - magentaness) / 115, 0, 1)
    else:
        blueness = b - np.maximum(r, 0.7 * g)  # a blue backdrop is 140 or more, the art below 40
        alpha = np.clip((115 - blueness) / 70, 0, 1)
    a = np.maximum(alpha, 0.05)[..., None]
    fg = np.clip((rgb - (1 - a) * np.asarray(backdrop, float)) / a, 0, 255)
    # Remove the backdrop's spill: nothing on these characters is blue, teal or purple.
    if backdrop[0] <= 100:
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
    """The poses whose middles are in a box [x0, y0, x1, y1]. Specks count only
    beside a pose (an antenna tip), so the sheet's captions are left out."""
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
    """The middle of the columns tall enough to be body, not a gun."""
    counts = mask.sum(0)
    cols = np.nonzero(counts >= 0.35 * counts.max())[0]
    return (cols.min() + cols.max() + 1) / 2


def cut_poses(alpha, rgb, lab, info, box, figures=1, tips=(), base=None):
    """The poses in a box, left to right. `base` is the sheet row of their
    feet (the frame's bottom row); by default each pose's own lowest pixel."""
    mask = group_mask(lab, info, box)
    parts = split(mask, figures, tips) if figures > 1 else [(mask, np.zeros_like(mask))]
    out = []
    for m, filled in parts:
        a = np.where(m, alpha, 0)
        a[filled] = 1
        col = inpaint(rgb, m, filled) if filled.any() else rgb
        bottom = base if base is not None else int(np.nonzero(m.any(1))[0].max())
        out.append(dict(mask=m, alpha=a, rgb=col, centre=body_centre(m & ~filled), base=bottom))
    return out


def snap(rgb, colours):
    """Nearest palette colour, by the game's own distance (palette.js colorDist)."""
    flat = rgb.reshape(-1, 1, 3)
    p = colours[None]
    rm = (flat[..., 0] + p[..., 0]) / 2
    d = flat - p
    dist = (2 + rm / 256) * d[..., 0] ** 2 + 4 * d[..., 1] ** 2 + (2 + (255 - rm) / 256) * d[..., 2] ** 2
    return colours[np.argmin(dist, 1)].reshape(rgb.shape)


def resample(arr, box, size, pad=64, filter=Image.LANCZOS):
    """Scales a box of `arr` to `size`; the box may run off the sheet's edges."""
    padded = np.pad(arr.astype(np.float32), pad)
    box = tuple(v + pad for v in box)
    return np.asarray(Image.fromarray(padded).resize(size, filter, box=box))


LUMA = np.array([0.3, 0.59, 0.11])

# The Dark Forces sprites' look (see dark_forces() below), as measured on the
# stormtrooper: a wide tonal range (brightness spread 75 of 255, its darkest
# and brightest twentieths at 17 and 232), hard steps between flat areas,
# dark contours, few colour ramps, side lighting and a stocky build.
DARK_FORCES = dict(widen=1.15, median=5, contrast=0.9, gamma=1.0, sharpen=1.0, side=(0.6, 1.2), outline=0.55, threshold=0.45)


def blur3(a):
    """A 3x3 binomial blur."""
    p = np.pad(a, 1, mode='edge')
    h = (p[:, :-2] + 2 * p[:, 1:-1] + p[:, 2:]) / 4
    return (h[:-2] + 2 * h[1:-1] + h[2:]) / 4


def dark_forces(rgb, opaque, style, tones):
    """Pushes a scaled-down frame toward the Dark Forces sprites' look:
    sharpened, its brightness stretched over the sheet's `tones` (3rd and
    97th percentiles) with an S-curve (`contrast`) and a `gamma` that deepens
    the shadows, lit from one side (`side`: brightness at the body's left and
    right edges), and its contour darkened (`outline`). Optional: `range`,
    the darkest and brightest output (default 8 to 248); `lift`, how far
    pixels much darker than the opaque pixels round them (line work) are
    eased toward them, and with `liftEdges` the contour's too."""
    lo, hi = tones
    lum = rgb @ LUMA
    sharp = lum + style['sharpen'] * (lum - blur3(lum))
    t = np.clip((sharp - lo) / (hi - lo), 0, 1)
    k = style['contrast']
    t = (1 - k) * t + k * t * t * (3 - 2 * t)
    dark, light = style.get('range', (8, 248))
    target = 255 * ((dark + (light - dark) * t) / 255) ** style['gamma']
    rgb = rgb * (target / np.maximum(lum, 1))[..., None]
    cols = np.nonzero(opaque.any(0))[0]
    if len(cols):
        left, right = style['side']
        x = np.clip((np.arange(rgb.shape[1]) - cols.min()) / max(1, cols.max() - cols.min()), 0, 1)
        rgb = rgb * (left + (right - left) * x)[None, :, None]
    pad = np.pad(opaque, 1)
    edge = opaque & ~(pad[:-2, 1:-1] & pad[2:, 1:-1] & pad[1:-1, :-2] & pad[1:-1, 2:])
    if style.get('lift'):
        # Ease pixels much darker than the opaque pixels round them (the
        # source's line work) toward them, so seams read as shading.
        lum = rgb @ LUMA
        w = opaque.astype(float)
        mean = blur3(lum * w) / np.maximum(blur3(w), 1e-3)
        gap = np.clip(mean - lum - style.get('liftAbove', 12), 0, None)
        lifted = lum + style['lift'] * gap
        some = opaque if style.get('liftEdges') else opaque & ~edge
        rgb[some] *= (lifted / np.maximum(lum, 1))[some][:, None]
    rgb[edge] *= style['outline']
    return np.clip(rgb, 0, 255)


def assemble(frames, scale, glow=None, draw=None, style=None, ramps=None):
    """Scales the poses down into one strip of equal frames: each keeps its
    body centred and its base on the bottom row. Colours snap to the
    palette's lit colours (only those of `ramps`, a list of ramp names, when
    given), except where `glow` (a sheet-sized mask of glowing pixels, like
    eyes or a muzzle flash) covers most of a pixel: those snap to the
    fullbright colours. `style` (like DARK_FORCES) restyles the frames:
    `widen` stretches them across, `median` smooths the source's fine
    texture first, `box` scales by area averaging instead of Lanczos,
    `threshold` is how covered a pixel must be to be opaque, and the rest
    goes to dark_forces(). `draw(i, frame, box)` may paint on
    frame i (an RGBA array; `box` is its area on the sheet)."""
    lit, glows, ramp_colours = palette()
    if ramps:
        lit = np.concatenate([ramp_colours[r] for r in ramps])
    sx = scale * (style['widen'] if style else 1)
    threshold = style['threshold'] if style else 0.5
    reach, height = 0, 0
    for f in frames:
        ys, xs = np.nonzero(f['mask'])
        reach = max(reach, f['centre'] - xs.min(), xs.max() + 1 - f['centre'])
        height = max(height, f['base'] + 1 - ys.min())
    fw = int(np.ceil(2 * reach * sx)) + 2 & ~1
    fh = int(np.ceil(height * scale)) + 1
    if style:
        tones = np.percentile(np.concatenate([f['rgb'][f['mask']] for f in frames]) @ LUMA, [3, 97])
    sheet = np.zeros((fh, fw * len(frames), 4), np.uint8)
    for i, f in enumerate(frames):
        box = (f['centre'] - fw / 2 / sx, f['base'] + 1 - fh / scale, f['centre'] + fw / 2 / sx, f['base'] + 1)
        src = f['rgb']
        if style and style.get('median'):
            src = np.asarray(Image.fromarray(np.clip(src, 0, 255).astype(np.uint8)).filter(ImageFilter.MedianFilter(style['median']))).astype(float)
        a = resample(f['alpha'], box, (fw, fh))
        rf = Image.BOX if style and style.get('box') else Image.LANCZOS
        rgb = np.stack([resample(src[..., c] * f['alpha'], box, (fw, fh), filter=rf) for c in range(3)], -1)
        # The colour, like the alpha, may have been scaled by another filter.
        a_rgb = resample(f['alpha'], box, (fw, fh), filter=rf) if rf != Image.LANCZOS else a
        rgb = np.clip(rgb / np.maximum(a_rgb, 1e-3)[..., None], 0, 255)
        opaque = a >= threshold
        if style:
            rgb = dark_forces(rgb, opaque, style, tones)
        frame = np.zeros((fh, fw, 4), np.uint8)
        frame[..., :3] = snap(rgb, lit)
        if glow is not None:
            g = resample(glow * f['mask'], box, (fw, fh)) >= 0.35
            if g.any():
                frame[g, :3] = snap(rgb[g][None], glows)[0]
        frame[..., 3] = np.where(opaque, 255, 0)
        if draw:
            draw(i, frame, box)
        sheet[:, i * fw:(i + 1) * fw] = frame
    return sheet


def save(sheet, out, frames):
    """Writes the sheet, and with `--preview <png>` on the command line a 4x copy on grey."""
    Image.fromarray(sheet, 'RGBA').save(out, optimize=True)
    fh, w = sheet.shape[:2]
    print(f'{Path(out).relative_to(ROOT).as_posix()}: {frames} frames of {w // frames}x{fh}')
    if '--preview' in sys.argv:
        grey = np.array([96, 100, 104], np.uint8)
        view = np.where(sheet[..., 3:] > 0, sheet[..., :3], grey)
        Image.fromarray(view).resize((w * 4, fh * 4), Image.NEAREST).save(sys.argv[sys.argv.index('--preview') + 1])
