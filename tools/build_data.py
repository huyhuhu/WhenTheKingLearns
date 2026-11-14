"""Gop tools/<level>_base.json va tools/<level>_vi.txt thanh data/<level>.js.

Cach dung: python tools/build_data.py n5 [duong_dan_jmdict_pairs.tsv]
"""
import json, os, re, sys

level = sys.argv[1] if len(sys.argv) > 1 else "n5"
pairs_path = sys.argv[2] if len(sys.argv) > 2 else None
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

with open(os.path.join(root, "tools", level + "_base.json"), encoding="utf-8") as f:
    base = json.load(f)

pairs = None
if pairs_path:
    with open(pairs_path, encoding="utf-8") as f:
        pairs = set(f.read().split("\n"))

hv = {}
rows = []
sessions = []
with open(os.path.join(root, "tools", level + "_vi.txt"), encoding="utf-8") as f:
    for line in f:
        line = line.strip()
        if line.startswith("@hv"):
            for item in line.split()[1:]:
                k, v = item.split("=")
                hv[k] = v
        elif line.startswith("# Buổi"):
            sessions.append([])
        elif line and not line.startswith("#"):
            k, k_hv, vi, story, vocab = line.split("|")
            hv[k] = k_hv
            rows.append((k, vi, story, vocab))
            sessions[-1].append(k)

errors = []

with open(os.path.join(root, "tools", level + "_vocab_en.json"), encoding="utf-8") as f:
    vocab_en = {k: re.sub(r"\s*\([^)]*\)", "", v).strip() for k, v in json.load(f).items()}
kanji_en = {}
with open(os.path.join(root, "tools", level + "_en.txt"), encoding="utf-8") as f:
    for line in f:
        line = line.strip()
        if line.startswith("@v "):
            w, r, en = line[3:].split("=")
            vocab_en[w + "	" + r] = en
        elif line and not line.startswith("#"):
            k, kw, m, story = line.split("|")
            kanji_en[k] = {"kw": kw, "m": m, "story": story}
is_kanji = lambda c: "一" <= c <= "鿿"
kanji = {}
for k, vi, story, vocab in rows:
    if k not in base:
        errors.append("khong co trong base: " + k)
        continue
    words = []
    for item in vocab.split(";"):
        w, r, meaning = item.split("=")
        if k not in w:
            errors.append("tu khong chua chu %s: %s" % (k, w))
        missing = [c for c in w if is_kanji(c) and c not in hv]
        if missing:
            errors.append("thieu Han-Viet: %s trong %s" % ("".join(missing), w))
            continue
        if pairs is not None and (w + "\t" + r) not in pairs:
            errors.append("khong khop JMdict: %s %s" % (w, r))
        en = vocab_en.get(w + "	" + r)
        if not en:
            errors.append("thieu nghia tieng Anh: %s %s" % (w, r))
        words.append([w, r, " ".join(hv[c] for c in w if is_kanji(c)), meaning, en])
    b = base[k]
    if k not in kanji_en:
        errors.append("thieu tieng Anh: " + k)
        continue
    kanji[k] = {
        "hv": hv[k], "vi": vi, "story": story, "en": kanji_en[k],
        "on": b["on"], "kun": b["kun"][:5],
        "strokes": b["strokes"], "paths": b["paths"], "vocab": words,
    }

for k in base:
    if k not in kanji:
        errors.append("chua soan: " + k)

if errors:
    sys.stdout.buffer.write(("\n".join(errors) + "\n").encode("utf-8"))
    sys.exit(1)

out = {"level": level.upper(), "sessions": sessions, "kanji": kanji}
os.makedirs(os.path.join(root, "data"), exist_ok=True)
with open(os.path.join(root, "data", level + ".js"), "w", encoding="utf-8") as f:
    f.write("window.KANJI_DATA = window.KANJI_DATA || {};\n")
    f.write("window.KANJI_DATA.%s = " % level)
    json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
    f.write(";\n")
print("OK: %d kanji, %d buoi, %d tu" % (len(kanji), len(sessions), sum(len(v["vocab"]) for v in kanji.values())))
