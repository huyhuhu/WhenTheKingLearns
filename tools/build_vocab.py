"""Gop tools/<level>_words/*.txt thanh data/vocab-<level>.js.

Cach dung: python tools/build_vocab.py n5
Moi file la mot buoi. Dinh dang moi dong xem dau file 01.txt.
"""
import glob, json, os, re, sys

level = sys.argv[1] if len(sys.argv) > 1 else "n5"
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

POS = {"n", "pron", "v1", "v2", "v3", "adj-i", "adj-na", "adv", "conj", "int", "exp", "num", "ctr", "suf", "pre", "adn"}
TAGS = {"song", "gia", "na", "am", "trung"}
is_kanji = lambda c: "一" <= c <= "鿿" or c == "々"
is_kata = lambda w: re.fullmatch(r"[ァ-ヶー・]+", w) is not None

hv = {}
with open(os.path.join(root, "tools", level + "_vi.txt"), encoding="utf-8") as f:
    for line in f:
        line = line.strip()
        if line.startswith("@hv"):
            for item in line.split()[1:]:
                k, v = item.split("=")
                hv[k] = v
        elif line and not line.startswith("#"):
            k, k_hv = line.split("|")[:2]
            hv[k] = k_hv

kdata_path = os.path.join(root, "data", level + ".js")
with open(kdata_path, encoding="utf-8") as f:
    text = f.read()
known_kanji = set(json.loads(text[text.index("{", text.index("=", text.index("\n"))):text.rindex("}") + 1])["kanji"])

errors, words, sessions, seen = [], [], [], {}


def check_sentence(ex, where):
    plain = re.sub(r"\{([^|}]+)\|[^}]+\}", "", ex)
    bad = [c for c in plain if is_kanji(c)]
    if bad:
        errors.append("%s: chu Han thieu furigana: %s" % (where, "".join(bad)))
    for base, ruby in re.findall(r"\{([^|}]+)\|([^}]+)\}", ex):
        if not any(is_kanji(c) for c in base):
            errors.append("%s: furigana tren chu khong phai Han: %s" % (where, base))


files = sorted(glob.glob(os.path.join(root, "tools", level + "_words", "*.txt")))
for path in files:
    ids = []
    name = os.path.basename(path)
    # @hv trong mot file chi ap dung cho file do: 楽 la NHAC trong 音楽 nhung LAC trong 楽しい
    fhv = dict(hv)
    with open(path, encoding="utf-8") as f:
        for n, line in enumerate(f, 1):
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if line.startswith("@hv"):
                for item in line.split()[1:]:
                    k, v = item.split("=")
                    fhv[k] = v
                continue
            where = "%s:%d" % (name, n)
            parts = re.split(r"\|(?![^{]*\})", line)
            if len(parts) != 10:
                errors.append("%s: can 10 truong, co %d" % (where, len(parts)))
                continue
            w, r, pos, vi, en, ex, ex_vi, ex_en, tags, tip = [p.strip() for p in parts]
            key = w + "|" + r
            if key in seen:
                errors.append("%s: trung voi %s: %s" % (where, seen[key], w))
                continue
            seen[key] = where
            if pos not in POS:
                errors.append("%s: tu loai la: %s" % (where, pos))
            if not (vi and en and ex and ex_vi and ex_en):
                errors.append("%s: thieu nghia hoac cau vi du" % where)
            if re.search(r"[^ぁ-ゖァ-ヶー～]", r):
                errors.append("%s: cach doc co ky tu la: %s" % (where, r))
            missing = [c for c in w if is_kanji(c) and c != "々" and c not in fhv]
            if missing:
                errors.append("%s: thieu Han-Viet: %s trong %s" % (where, "".join(missing), w))
                continue
            tag_list = tags.split()
            for t in tag_list:
                if t.split("=")[0] not in TAGS:
                    errors.append("%s: the la: %s" % (where, t))
            if "na" in tag_list and not tip:
                errors.append("%s: the na can meo nho" % where)
            check_sentence(ex, where)
            kanji_in_w = [c for c in w if is_kanji(c) and c != "々"]
            if kanji_in_w and all(c in known_kanji for c in kanji_in_w):
                tag_list.insert(0, "ghep")
            if is_kata(w):
                tag_list.insert(0, "su")
            word_hv = " ".join(fhv[c] for c in kanji_in_w)
            ids.append(len(words))
            words.append([w, r, word_hv, pos, vi, en, ex, ex_vi, ex_en, " ".join(tag_list), tip])
    sessions.append(ids)

for w in words:
    for t in w[9].split():
        if "=" in t:
            other = t.split("=", 1)[1]
            if not any(x[0] == other for x in words):
                errors.append("cap %s cua %s khong co trong danh sach" % (other, w[0]))

if errors:
    sys.stdout.buffer.write(("\n".join(errors) + "\n").encode("utf-8"))
    sys.exit(1)

out = {"level": level.upper(), "sessions": sessions, "words": words}
with open(os.path.join(root, "data", "vocab-" + level + ".js"), "w", encoding="utf-8") as f:
    f.write("window.VOCAB_DATA = window.VOCAB_DATA || {};\n")
    f.write("window.VOCAB_DATA.%s = " % level)
    json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
    f.write(";\n")
print("OK: %d tu, %d buoi" % (len(words), len(sessions)))
