"""Ve lai logo (giong icons/logo.svg) thanh cac file PNG va favicon.ico. Can Pillow."""
import os

from PIL import Image, ImageDraw

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out = os.path.join(root, "icons")
RED, PAPER = (194, 69, 45, 255), (255, 253, 248, 255)
STROKES = [((17, 18), (47, 18)), ((20, 32), (44, 32)), ((14, 46), (50, 46)), ((32, 18), (32, 46))]


def draw(size, radius=14):
    scale = 8 * size / 64
    big = Image.new("RGBA", (8 * size, 8 * size), (0, 0, 0, 0))
    d = ImageDraw.Draw(big)
    d.rounded_rectangle([0, 0, 8 * size - 1, 8 * size - 1], radius=radius * scale, fill=RED)
    half = 3 * scale
    for (x1, y1), (x2, y2) in STROKES:
        d.line([x1 * scale, y1 * scale, x2 * scale, y2 * scale], fill=PAPER, width=int(6 * scale))
        for x, y in ((x1, y1), (x2, y2)):
            d.ellipse([x * scale - half, y * scale - half, x * scale + half, y * scale + half], fill=PAPER)
    return big.resize((size, size), Image.LANCZOS)


draw(192).save(os.path.join(out, "icon-192.png"))
draw(512).save(os.path.join(out, "icon-512.png"))
# iOS tu bo goc nen ban nay de nen vuong
draw(180, radius=0).save(os.path.join(out, "apple-touch-icon.png"))
draw(48).save(os.path.join(root, "favicon.ico"), sizes=[(16, 16), (32, 32), (48, 48)])
print("ok")
