"""Cuts the sandtrooper commander: the sandtrooper's own frames with the heavy
rifle of sheet.jpg (AI-generated: the sandtrooper's in-game grid, from
`sandtrooper/cut.py --full`, scaled up about 2x on white and given the new
rifle) grafted on.

    python assets/custom/sandtrooper-commander/cut.py [--preview <png>]

Needs Python 3 with Pillow and numpy, and Node (to read the game's palette).
Writes assets/sprites/monsters/sandtrooper-commander.png, in the
sandtrooper's frame order (see sandtrooper/cut.py), in wider frames for the
longer rifle. `--preview` also writes the sheet 4x on grey, for checking.

The body stays the sandtrooper's, pixel for pixel. From the new sheet comes
only the rifle (dark metal and the wooden stock), and the body it uncovers
where the T-21 crossed it; T-21 pixels with backdrop behind them now go. The
sheet's mistakes are left out: the aim and fire poses shoot straight at the
player, but the sheet draws the rifle side-on there (with a painted flash),
so those keep the sandtrooper's frames and get the heavy rifle's muzzle
painted head-on (head_on()), the game's red flash on its bore. The sheet's
rifle has a hard dark outline, so its contour is eased toward the colours
round it.
"""
import importlib.util
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageOps

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
from sheetcut import LUMA, ROOT, blur3, components, palette, save, snap  # noqa: E402

spec = importlib.util.spec_from_file_location('sandtrooper_cut', HERE.parent / 'sandtrooper/cut.py')
trooper = importlib.util.module_from_spec(spec)
spec.loader.exec_module(trooper)

SOURCE = HERE / 'sheet.jpg'
TROOPER = ROOT / 'assets/sprites/monsters/sandtrooper.png'
OUT = ROOT / 'assets/sprites/monsters/sandtrooper-commander.png'

FW, FH = 72, 68  # the sandtrooper's frames, and the grid's cells
# Where the grid lies on the sheet: grid pixel (x, y) is sheet pixel
# (DX + x * SCALE, DY + y * SCALE). Fitted on the bodies.
SCALE, DX, DY = 2.052, -0.5, 0.0
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
T21_DEAD = (50, 56, 72, 63)  # the T-21's barrel in the sandtrooper's dead frame (x0, y0, x1, y1), dark pixels
FLASH = [(255, 250, 200), (255, 170, 30), (255, 40, 30), (210, 20, 20)]  # sandtrooper/cut.py's muzzle_flash()

BACKDROP_DIST = 34  # how far from white the sheet's backdrop goes (JPEG noise)


def grid_image():
    """The sheet scaled onto the grid's pixels (area averaged), white past its edges."""
    pad = 40
    img = ImageOps.expand(Image.open(SOURCE).convert('RGB'), pad, fill=(255, 255, 255))
    w, h = FW * 13 + 2 * SIDE, FH * 4 + TOP + BELOW
    box = (pad + DX - SIDE * SCALE, pad + DY - TOP * SCALE, pad + DX + (FW * 13 + SIDE) * SCALE, pad + DY + (FH * 4 + BELOW) * SCALE)
    return np.asarray(img.resize((w, h), Image.BOX, box=box), float)


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


def graft(old, new, k):
    """Frame k: the sandtrooper's frame `old` (RGBA, FW x FH) with the rifle of
    `new` (the sheet over the commander's frame and BELOW rows under it, RGB).
    Returns the frame's colours, what is opaque, and what is new."""
    h, w = new.shape[:2]
    body = np.zeros((h, w, 4), float)
    body[TOP:TOP + FH, SIDE:SIDE + FW] = old
    # The sandtrooper's own flash goes: the new barrel is longer.
    body[np.isin(body[..., :3] @ [65536, 256, 1], [c[0] * 65536 + c[1] * 256 + c[2] for c in FLASH]) & (body[..., 3] > 0)] = 0
    was = body[..., 3] > 0
    rgb = body[..., :3]
    dist = np.abs(255 - new).max(-1)
    fg = dist > BACKDROP_DIST
    # This pose on the sheet: what touches the sandtrooper's body, not the
    # neighbours' barrels reaching in, nor loose blobs.
    lab, _ = components(fg)
    mine = np.isin(lab, [n for n in np.unique(lab[was & fg]) if n])
    lum_old, lum_new = rgb @ LUMA, new @ LUMA
    differs = np.abs(lum_new - lum_old) > 40
    gun = mine & gunlike(new) & (~was | differs)
    gun = majority(gun, was)
    # The T-21 where the sheet shows the body through it (the body's own
    # colours there), or nothing.
    t21 = was & (lum_old < 80) & differs & ~gun
    uncovered = t21 & mine
    gone = t21 & ~mine
    out_rgb = rgb.copy()
    out_rgb[uncovered] = new[uncovered]
    if k == DEAD:
        # The corpse's rifle lies in front of it, its lowest row on the base.
        x0, y0, x1, y1 = T21_DEAD
        barrel = np.zeros_like(was)
        barrel[TOP + y0:TOP + y1, SIDE + x0:SIDE + x1] = True
        gone |= barrel & was & (lum_old < 80)
        lift = max(0, np.nonzero(gun.any(1))[0].max() - (TOP + FH - 1))
        gun, new = np.roll(gun, -lift, 0), np.roll(new, -lift, 0)
    out_rgb[gun] = new[gun]
    opaque = (was & ~gone) | gun
    out_rgb = soften(out_rgb, gun, opaque)
    return out_rgb[:TOP + FH], opaque[:TOP + FH], (gun | uncovered)[:TOP + FH]


def main():
    ramps = palette()[2]
    lit = np.concatenate([ramps[r] for r in ['gray', 'beige', 'concrete', 'orange', 'rust']])
    sheet_img = grid_image()
    trooper_sheet = np.asarray(Image.open(TROOPER).convert('RGBA'), float)
    frames = []
    for k, (r, i) in enumerate(trooper.FRAMES):
        old = trooper_sheet[:, k * FW:(k + 1) * FW]
        x0, y0 = i * FW, r * FH
        new = sheet_img[y0:y0 + TOP + FH + BELOW, x0:x0 + FW + 2 * SIDE]
        frame = np.zeros((FH + TOP, FW + 2 * SIDE, 4), np.uint8)
        if k in MUZZLES:
            frame[TOP:, SIDE:SIDE + FW] = old
            flash = np.isin(frame[..., :3].astype(int) @ [65536, 256, 1], [c[0] * 65536 + c[1] * 256 + c[2] for c in FLASH])
            frame[flash & (frame[..., 3] > 0)] = 0
            head_on(frame, MUZZLES[k], lit)
            if k == FIRE:
                trooper.muzzle_flash(frame, *MUZZLES[k])
            frames.append(frame)
            continue
        rgb, opaque, fresh = graft(old, new, k)
        # The sandtrooper's pixels keep their exact colours; only new ones snap.
        keep = ~fresh
        frame[..., :3] = np.where(keep[..., None], np.clip(rgb, 0, 255), snap(rgb, lit)).astype(np.uint8)
        frame[..., 3] = np.where(opaque, 255, 0)
        frames.append(frame)
    save(np.concatenate(frames, 1), OUT, len(frames))


if __name__ == '__main__':
    main()
