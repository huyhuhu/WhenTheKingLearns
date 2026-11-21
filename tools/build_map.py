"""Tao ban do Nhat Ban cho muc Tu vung tu du lieu Natural Earth (mien cong cong).

Cach dung: tools/.venv/Scripts/python tools/build_map.py
Tai du lieu vao tools/.cache (lan dau), ghi data/map-japan.js, data/map-relief.webp, data/map-paper.webp.
Can goi pyshp, pillow, numpy.
"""
import io, json, math, os, urllib.request, zipfile

import numpy as np
import shapefile
from PIL import Image

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cache = os.path.join(root, "tools", ".cache")
BASE = "https://naciscdn.org/naturalearth/"
SRC = {
    "admin1": "10m/cultural/ne_10m_admin_1_states_provinces.zip",
    "admin0": "10m/cultural/ne_10m_admin_0_countries.zip",
    "lakes": "10m/physical/ne_10m_lakes.zip",
    "rivers": "10m/physical/ne_10m_rivers_lake_centerlines.zip",
    "relief": "10m/raster/SR_HR.zip",
}

# Buoi -> ma tinh ISO 3166-2 (JP-xx). Niigata (15), Nagano (20) de danh cho N4.
REGIONS = [
    [25, 26], [40, 41, 43, 44, 45, 46], [29, 30], [31, 32, 33, 34, 35], [36, 37, 38, 39], [27, 28], [21], [13],
    [23, 24], [16, 17, 18], [1], [42], [2, 3, 4, 5, 6, 7], [8, 9, 10, 11, 12, 14], [19, 22], [47],
]
# Vi tri nhan tu chon (kinh do, vi do) cho vung ma tam hinh lech khoi dat lien.
LABELS = {12: (129.8, 32.95)}

W = 2000
LAT0 = 37.5
C = math.cos(math.radians(LAT0))
MAIN = (128.4, 146.2, 29.6, 45.75)
INSET = (122.8, 130.2, 24.0, 29.6)
K = W / ((MAIN[1] - MAIN[0]) * C)
H = round((MAIN[3] - MAIN[2]) * K)
KI = K * 0.72
IW = round((INSET[1] - INSET[0]) * C * KI)
IH = round((INSET[3] - INSET[2]) * KI)
IX, IY = W - IW - 30, H - IH - 30
TOL = 1.0
RELIEF_SCALE = 2.5


def fetch(name):
    os.makedirs(cache, exist_ok=True)
    path = os.path.join(cache, os.path.basename(SRC[name]))
    if not os.path.exists(path) or os.path.getsize(path) == 0:
        print("tai", SRC[name])
        urllib.request.urlretrieve(BASE + SRC[name], path)
    return path


def records(name):
    z = zipfile.ZipFile(fetch(name))
    stem = os.path.splitext(os.path.basename(SRC[name]))[0]
    r = shapefile.Reader(shp=io.BytesIO(z.read(stem + ".shp")), dbf=io.BytesIO(z.read(stem + ".dbf")),
                         shx=io.BytesIO(z.read(stem + ".shx")), encoding="utf-8", encodingErrors="replace")
    for sr in r.iterShapeRecords():
        yield sr.record.as_dict(), sr.shape


def parts(shape):
    idx = list(shape.parts) + [len(shape.points)]
    return [shape.points[idx[i]:idx[i + 1]] for i in range(len(idx) - 1)]


def in_box(lon, lat, box):
    return box[0] <= lon <= box[1] and box[2] <= lat <= box[3]


def proj(lon, lat, inset=False):
    if inset:
        return IX + (lon - INSET[0]) * C * KI, IY + (INSET[3] - lat) * KI
    return (lon - MAIN[0]) * C * K, (MAIN[3] - lat) * K


def quant(pts):
    out = []
    for x, y in pts:
        p = (int(round(x)), int(round(y)))
        if not out or out[-1] != p:
            out.append(p)
    if len(out) > 1 and out[0] == out[-1]:
        out.pop()
    return out


def dp(pts, tol):
    if len(pts) < 3:
        return list(range(len(pts)))
    keep = {0, len(pts) - 1}
    stack = [(0, len(pts) - 1)]
    while stack:
        a, b = stack.pop()
        (ax, ay), (bx, by) = pts[a], pts[b]
        dx, dy = bx - ax, by - ay
        L = math.hypot(dx, dy)
        best, bi = 0, -1
        for i in range(a + 1, b):
            px, py = pts[i]
            d = abs(dy * (px - ax) - dx * (py - ay)) / L if L else math.hypot(px - ax, py - ay)
            if d > best:
                best, bi = d, i
        if best > tol:
            keep.add(bi)
            stack += [(a, bi), (bi, b)]
    return sorted(keep)


def simp_ring(q):
    qq = q + [q[0]]
    return [qq[i] for i in dp(qq, TOL)][:-1]


def area(r):
    return sum(r[i][0] * r[(i + 1) % len(r)][1] - r[(i + 1) % len(r)][0] * r[i][1] for i in range(len(r))) / 2


def centroid(r):
    a = area(r) or 1
    cx = sum((r[i][0] + r[(i + 1) % len(r)][0]) * (r[i][0] * r[(i + 1) % len(r)][1] - r[(i + 1) % len(r)][0] * r[i][1]) for i in range(len(r)))
    cy = sum((r[i][1] + r[(i + 1) % len(r)][1]) * (r[i][0] * r[(i + 1) % len(r)][1] - r[(i + 1) % len(r)][0] * r[i][1]) for i in range(len(r)))
    return cx / (6 * a), cy / (6 * a)


def path(rings, closed=True):
    out = []
    for r in rings:
        if len(r) < 2:
            continue
        s = "M%d %d" % r[0]
        rel = []
        for i in range(1, len(r)):
            rel.append("%d %d" % (r[i][0] - r[i - 1][0], r[i][1] - r[i - 1][1]))
        s += "l" + " ".join(rel).replace(" -", "-")
        out.append(s + ("z" if closed else ""))
    return "".join(out)


def clip(ring, x0, y0, x1, y1):
    """Sutherland-Hodgman cat da giac theo hinh chu nhat."""
    def cut(pts, inside, inter):
        out = []
        for i in range(len(pts)):
            a, b = pts[i - 1], pts[i]
            if inside(b):
                if not inside(a):
                    out.append(inter(a, b))
                out.append(b)
            elif inside(a):
                out.append(inter(a, b))
        return out

    def ix(x):
        return lambda a, b: (x, a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]))

    def iy(y):
        return lambda a, b: (a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]), y)

    pts = ring
    for inside, inter in ((lambda p: p[0] >= x0, ix(x0)), (lambda p: p[0] <= x1, ix(x1)),
                          (lambda p: p[1] >= y0, iy(y0)), (lambda p: p[1] <= y1, iy(y1))):
        if not pts:
            break
        pts = cut(pts, inside, inter)
    return pts


def place(ring):
    lon = sum(p[0] for p in ring) / len(ring)
    lat = sum(p[1] for p in ring) / len(ring)
    if lat < INSET[3] and in_box(lon, lat, INSET):
        return True
    if in_box(lon, lat, MAIN):
        return False
    return None


# ---------- tinh va vung ----------
region_of = {}
for i, codes in enumerate(REGIONS):
    for c in codes:
        region_of[c] = i + 1

rings = []
for rec, shape in records("admin1"):
    if rec["adm0_a3"] != "JPN":
        continue
    code = int(rec["iso_3166_2"].split("-")[1])
    for part in parts(shape):
        side = place(part)
        if side is None:
            continue
        q = quant([proj(lon, lat, side) for lon, lat in part])
        if len(q) >= 3:
            rings.append({"code": code, "pts": q, "inset": side})

edges = {}
for ri, r in enumerate(rings):
    P = r["pts"]
    for i in range(len(P)):
        a, b = P[i], P[(i + 1) % len(P)]
        edges.setdefault((min(a, b), max(a, b)), set()).add(r["code"])

incident = {}
for (a, b), own in edges.items():
    incident.setdefault(a, []).append(frozenset(own))
    incident.setdefault(b, []).append(frozenset(own))
junction = {v for v, lst in incident.items() if len(lst) != 2 or lst[0] != lst[1]}

keep = set(junction)
arcs = {}
for r in rings:
    P = r["pts"]
    js = [i for i, p in enumerate(P) if p in junction]
    if not js:
        start = P.index(min(P))
        P = P[start:] + P[:start]
        js = [0]
        keep.add(P[0])
    js.append(js[0] + len(P))
    for a, b in zip(js, js[1:]):
        chain = [P[i % len(P)] for i in range(a, b + 1)]
        if chain[0] > chain[-1]:
            chain.reverse()
        key = tuple(chain)
        if key in arcs:
            continue
        own = edges[(min(chain[0], chain[1]), max(chain[0], chain[1]))]
        kept = [chain[i] for i in dp(chain, TOL)]
        keep.update(kept)
        arcs[key] = (own, kept)

for r in rings:
    r["pts"] = [p for p in r["pts"] if p in keep]

coast, borders, prefs = [], [], []
for own, kept in arcs.values():
    codes = list(own)
    if len(codes) == 1:
        coast.append(kept)
    elif region_of.get(codes[0], 0) == region_of.get(codes[1], 0):
        prefs.append(kept)
    else:
        borders.append(kept)

regions = []
for n in range(1, len(REGIONS) + 1):
    rs = [r["pts"] for r in rings if region_of.get(r["code"]) == n and len(r["pts"]) >= 3]
    big = max(rs, key=lambda x: abs(area(x)))
    lx, ly = proj(*LABELS[n]) if n in LABELS else centroid(big)
    regions.append({"d": path(rs), "x": round(lx), "y": round(ly)})
wild = path([r["pts"] for r in rings if r["code"] not in region_of and len(r["pts"]) >= 3])

# ---------- nuoc lang gieng, ho, song ----------
PAD = 40
others = []
for rec, shape in records("admin0"):
    if rec.get("ADM0_A3") == "JPN":
        continue
    for part in parts(shape):
        lons = [p[0] for p in part]
        lats = [p[1] for p in part]
        if max(lons) < MAIN[0] - 2 or min(lons) > MAIN[1] + 2 or max(lats) < MAIN[2] - 2 or min(lats) > MAIN[3] + 2:
            continue
        c = clip([proj(lon, lat) for lon, lat in part], -PAD, -PAD, W + PAD, H + PAD)
        q = quant(c)
        if len(q) >= 3 and abs(area(q)) > 20:
            others.append(simp_ring(q))

lakes = []
for rec, shape in records("lakes"):
    for part in parts(shape):
        side = place(part)
        if side is None:
            continue
        q = quant([proj(lon, lat, side) for lon, lat in part])
        if len(q) >= 3 and abs(area(q)) > 40:
            lakes.append(simp_ring(q))

rivers = []
for rec, shape in records("rivers"):
    for part in parts(shape):
        side = place(part)
        if side is None:
            continue
        q = quant([proj(lon, lat, side) for lon, lat in part])
        if len(q) >= 2:
            rivers.append([q[i] for i in dp(q, TOL)])

out = {
    "w": W, "h": H, "inset": [IX, IY, IW, IH],
    "regions": regions, "wild": wild,
    "coast": path(coast, False), "borders": path(borders, False), "prefs": path(prefs, False),
    "others": path(others), "lakes": path(lakes), "rivers": path(rivers, False),
}
with open(os.path.join(root, "data", "map-japan.js"), "w", encoding="utf-8") as f:
    f.write("window.MAP_JAPAN = ")
    json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
    f.write(";\n")

# ---------- lop bong dia hinh ----------
Image.MAX_IMAGE_PIXELS = None
z = zipfile.ZipFile(fetch("relief"))
tif = os.path.join(cache, "sr", "SR_HR.tif")
if not os.path.exists(tif):
    z.extract("SR_HR.tif", os.path.join(cache, "sr"))
src = Image.open(tif)


def crop(box, w, h):
    px = (round((box[0] + 180) * 60), round((90 - box[3]) * 60), round((box[1] + 180) * 60), round((90 - box[2]) * 60))
    return src.crop(px).resize((round(w / RELIEF_SCALE), round(h / RELIEF_SCALE)), Image.LANCZOS)


canvas = Image.new("L", (round(W / RELIEF_SCALE), round(H / RELIEF_SCALE)), 206)
canvas.paste(crop(MAIN, W, H), (0, 0))
canvas.paste(crop(INSET, IW, IH), (round(IX / RELIEF_SCALE), round(IY / RELIEF_SCALE)))
# 206 la gia tri vung phang cua SR_HR: toi hon la bong, sang hon la suon don nang
v = np.asarray(canvas).astype(np.float32) - 206
rgb = np.where(v < 0, 40, 255).astype(np.uint8)
alpha = np.clip(np.where(v < 0, -v / 110, v / 50) * 255, 0, 255).astype(np.uint8)
img = np.dstack([rgb, rgb, rgb, alpha])
Image.fromarray(img, "RGBA").save(os.path.join(root, "data", "map-relief.webp"), "WEBP", quality=60, method=6)

# ---------- van giay washi (lap lai) ----------
rs = np.random.RandomState(7)
T = 160
noise = rs.rand(T, T).astype(np.float32)
for _ in range(2):
    noise = (noise + np.roll(noise, 1, 0) + np.roll(noise, 1, 1) + np.roll(noise, -1, 0) + np.roll(noise, -1, 1)) / 5
fib = np.zeros((T, T), np.float32)
for _ in range(90):
    x, y, ang, ln = rs.randint(T), rs.randint(T), rs.rand() * math.pi, rs.randint(8, 40)
    for t in range(ln):
        fib[int(y + t * math.sin(ang)) % T, int(x + t * math.cos(ang)) % T] += 0.6
tex = (noise - noise.mean()) * 3 + fib
a = np.clip(np.abs(tex) * 60, 0, 70).astype(np.uint8)
c = np.where(tex < 0, 255, 60).astype(np.uint8)
Image.fromarray(np.dstack([c, c, c, a]), "RGBA").save(os.path.join(root, "data", "map-paper.webp"), "WEBP", quality=45)

sizes = {n: os.path.getsize(os.path.join(root, "data", n)) for n in ("map-japan.js", "map-relief.webp", "map-paper.webp")}
print("ban do %dx%d, %d vung; %s" % (W, H, len(regions), ", ".join("%s %d KB" % (k, v // 1024) for k, v in sizes.items())))
