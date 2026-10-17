"""Grafting a new rifle onto the sandtrooper's frames, from a sheet an image AI
made of the sandtrooper's in-game grid (`sandtrooper/cut.py --full`, scaled
up about 2x) with the rifle changed. Used by sandtrooper-commander/cut.py and
sandtrooper/rifle.py; needs Pillow and numpy.

The body stays the sandtrooper's, pixel for pixel. From the sheet comes only
the rifle (dark metal and wood), and the body it uncovers where the old
rifle crossed it; old rifle pixels with backdrop behind them go. The sheet's
rifle has a hard dark outline, so its contour is eased toward the colours
round it.
"""
import numpy as np
from PIL import Image, ImageOps

from sheetcut import LUMA, blur3, components

FW, FH = 72, 68  # the sandtrooper's frames, and the grid's cells
FLASH = [(255, 250, 200), (255, 170, 30), (255, 40, 30), (210, 20, 20)]  # sandtrooper/cut.py's muzzle_flash()


def grid_image(source, fit, side, top, below, fill=(255, 255, 255)):
    """The sheet scaled onto the grid's pixels (area averaged), `fill` past its
    edges, reaching `side` px past the grid on each side, `top` above and
    `below` under it. `fit` = (scale, dx, dy): grid pixel (x, y) is sheet
    pixel (dx + x * scale, dy + y * scale)."""
    scale, dx, dy = fit
    pad = 40
    img = ImageOps.expand(Image.open(source).convert('RGB'), pad, fill=fill)
    w, h = FW * 13 + 2 * side, FH * 4 + top + below
    box = (pad + dx - side * scale, pad + dy - top * scale, pad + dx + (FW * 13 + side) * scale, pad + dy + (FH * 4 + below) * scale)
    return np.asarray(img.resize((w, h), Image.BOX, box=box), float)


def is_flash(rgb):
    """The game's red muzzle flash colours."""
    return np.isin(rgb.astype(int) @ [65536, 256, 1], [c[0] * 65536 + c[1] * 256 + c[2] for c in FLASH])


def gunlike(rgb):
    """The rifle's colours: dark metal, and the wooden stock (a dull brown,
    darker than the shoulder's orange)."""
    lum = rgb @ LUMA
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    metal = (lum < 95) & (np.ptp(rgb, -1) < 40)
    wood = (lum < 125) & (r - b > 35) & (r > g)
    return metal | wood


def soften(rgb, gun, opaque, amount=0.6):
    """Eases the rifle's contour (its pixels next to anything that isn't
    rifle) toward the mean of the opaque pixels round it, where it is darker:
    the sheet's outline becomes shading."""
    lum = rgb @ LUMA
    pad = np.pad(gun, 1)
    inner = pad[:-2, 1:-1] & pad[2:, 1:-1] & pad[1:-1, :-2] & pad[1:-1, 2:]
    edge = gun & ~inner
    w = opaque.astype(float)
    mean = blur3(lum * w) / np.maximum(blur3(w), 1e-3)
    gap = np.clip(mean - lum, 0, None)
    lifted = lum + amount * gap
    out = rgb.copy()
    out[edge] *= (lifted / np.maximum(lum, 1))[edge][:, None]
    return np.clip(out, 0, 255)


def majority(mask, within):
    """Within `within`, a pixel is in `mask` when most of its 3x3 block is:
    no single pixels flipping between the rifle and the body."""
    p = np.pad(mask, 1).astype(int)
    count = sum(p[1 + dy:p.shape[0] - 1 + dy, 1 + dx:p.shape[1] - 1 + dx] for dy in (-1, 0, 1) for dx in (-1, 0, 1))
    return np.where(within, count >= 5, mask)


def close(mask):
    """Fills the one-pixel gaps in `mask` (a 3x3 closing)."""
    def spread(m, op):
        p = np.pad(m, 1, constant_values=op is np.logical_and)
        out = p[1:-1, 1:-1].copy()
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                out = op(out, p[1 + dy:p.shape[0] - 1 + dy, 1 + dx:p.shape[1] - 1 + dx])
        return out
    return spread(spread(mask, np.logical_or), np.logical_and)


def graft(old, new, fg, side, top, dead_barrel=None, over_dark=False, fill_gaps=False, rows=None):
    """The sandtrooper's frame `old` (RGBA, FW x FH) with the rifle of `new`
    (the sheet over the frame, `side` px wider each side and `top` px above,
    and rows under it, RGB); `fg` is what on `new` isn't backdrop.
    `dead_barrel` (x0, y0, x1, y1 in the sandtrooper's frame), for the dead
    pose: the old rifle's barrel there goes (and nothing else of the
    body), and the new rifle, drawn below
    the body's base, is lifted onto the ground. `over_dark`: the new rifle
    also replaces the old frame's dark pixels (else only what it clearly
    changes, so the body stays exact). `fill_gaps`: the light gaps between
    the rifle's dark lines (its fins, at the frame's pixel size the
    backdrop's grey) are rifle too. `rows` (y0, y1 in the sandtrooper's
    frame): the rifle is only taken from these rows (the sheet's mistakes
    elsewhere). Returns the frame's colours,
    what is opaque, and what is new, cropped to the frame's height."""
    h, w = new.shape[:2]
    body = np.zeros((h, w, 4), float)
    body[top:top + FH, side:side + FW] = old
    # The sandtrooper's own flash goes: the new barrel ends elsewhere.
    body[is_flash(body[..., :3]) & (body[..., 3] > 0)] = 0
    was = body[..., 3] > 0
    rgb = body[..., :3]
    # This pose on the sheet: what touches the sandtrooper's body, not the
    # neighbours' barrels reaching in, nor loose blobs.
    lab, _ = components(fg)
    mine = np.isin(lab, [n for n in np.unique(lab[was & fg]) if n])
    lum_old, lum_new = rgb @ LUMA, new @ LUMA
    differs = np.abs(lum_new - lum_old) > 40
    gun = mine & gunlike(new) & (~was | differs | (over_dark & (lum_old < 80)))
    gun = majority(gun, was)
    if fill_gaps:
        gun = close(gun)
    if rows:
        band = np.zeros_like(gun)
        band[top + rows[0]:top + rows[1]] = True
        gun &= band
    # The old rifle where the sheet shows the body through it (the body's own
    # colours there), or nothing.
    old_gun = was & (lum_old < 80) & differs & ~gun
    uncovered = old_gun & mine
    gone = old_gun & ~mine
    out_rgb = rgb.copy()
    out_rgb[uncovered] = new[uncovered]
    if dead_barrel:
        # The corpse's rifle lies in front of it, its lowest row on the base.
        x0, y0, x1, y1 = dead_barrel
        barrel = np.zeros_like(was)
        barrel[top + y0:top + y1, side + x0:side + x1] = True
        # Nothing else of the corpse goes: the sheet's corpse needn't match.
        gone = (gone & barrel) | (barrel & was & (lum_old < 80))
        lift = max(0, np.nonzero(gun.any(1))[0].max() - (top + FH - 1))
        gun, new = np.roll(gun, -lift, 0), np.roll(new, -lift, 0)
    out_rgb[gun] = new[gun]
    opaque = (was & ~gone) | gun
    out_rgb = soften(out_rgb, gun, opaque)
    return out_rgb[:top + FH], opaque[:top + FH], (gun | uncovered)[:top + FH]
