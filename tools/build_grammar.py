"""Gop tools/<level>_grammar/*.txt thanh data/grammar-<level>.js.

Cach dung: python tools/build_grammar.py n5          kiem tra va sinh du lieu
           python tools/build_grammar.py n5 --pod    liet ke cau podcast khop "search:" de chon "pod:"
Moi file la mot bai. Dinh dang xem dau file 01.txt.
"""
import glob, hashlib, json, os, re, sys

args = [a for a in sys.argv[1:] if not a.startswith("--")]
level = args[0] if args else "n5"
list_pod = "--pod" in sys.argv
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

is_kanji = lambda c: "一" <= c <= "鿿" or c == "々"
RUBY = re.compile(r"\{([^|}]+)\|([^}]+)\}")
SPLIT = re.compile(r"\|(?![^{]*\})")
ENDS = "。？！」"
MIN = {"ex": 3, "q": 8, "o": 6, "t": 5, "e": 3, "c": 3}


def load_js(path):
    with open(path, encoding="utf-8") as f:
        text = f.read()
    return json.loads(text[text.index("{", text.index("=", text.index("\n"))):text.rindex("}") + 1])


def base(s):
    return RUBY.sub(r"\1", s)


def kana(s):
    return RUBY.sub(r"\2", s)


def plain(s):
    return base(re.sub(r"[\[\]<>]", "", s))


vocab = load_js(os.path.join(root, "data", "vocab-" + level + ".js"))["words"]
forms = []
for i, w in enumerate(vocab):
    text = w[0].replace("～", "")
    has_kanji = any(is_kanji(c) for c in text)
    if not has_kanji and (len(text) < 3 or w[3] in ("int", "suf", "pre")):
        continue
    if w[3] in ("v1", "v2", "adj-i") and has_kanji and len(text) > 1:
        text = text[:-1]
    forms.append((text, i))
forms.sort(key=lambda x: -len(x[0]))


def words_in(s):
    p, out, used = plain(s), [], set()
    for text, i in forms:
        at = p.find(text)
        if at < 0 or any(at <= u < at + len(text) for u in used):
            continue
        used.update(range(at, at + len(text)))
        out.append(i)
    return sorted(out)


pod_lines = {}
for path in sorted(glob.glob(os.path.join(root, "data", "podcast", level + "-*.json"))):
    with open(path, encoding="utf-8") as f:
        ep = json.load(f)
    pod_lines[ep["id"]] = [(l["s"], "".join(t[0] for t in l["t"])) for l in ep["lines"] if l.get("lang") == "ja"]

errors, lessons, patterns, sents, sent_index = [], [], [], [], {}


def check_ja(s, where):
    if s.count("[") != s.count("]") or s.count("<") != s.count(">") or s.count("[") > 1 or s.count("<") > 1:
        errors.append("%s: dau [] hoac <> sai" % where)
    p = RUBY.sub("", re.sub(r"[\[\]<>]", "", s))
    bad = [c for c in p if is_kanji(c)]
    if bad:
        errors.append("%s: chu Han thieu furigana: %s" % (where, "".join(bad)))
    for b, r in RUBY.findall(s):
        if not any(is_kanji(c) for c in b):
            errors.append("%s: furigana tren chu khong phai Han: %s" % (where, b))
    if plain(s)[-1:] not in ENDS:
        errors.append("%s: cau phai ket thuc bang dau cau" % where)


def add_sentence(raw, where, is_q):
    parts = [p.strip() for p in SPLIT.split(raw)]
    if len(parts) < 3:
        errors.append("%s: can it nhat tieng Nhat | VI | EN" % where)
        return None, {}
    ja, vi, en = parts[:3]
    check_ja(ja, where)
    fields = {}
    for p in parts[3:]:
        m = re.match(r"(o|t|e|ev|ee|c):\s*(.*)$", p)
        if not m:
            errors.append("%s: truong la: %s" % (where, p))
            continue
        fields[m.group(1)] = m.group(2).strip()
    if not is_q and fields:
        errors.append("%s: cau ex khong co truong bai tap" % where)
    opts = tiles = err = conj = 0
    has_blank = "[" in ja
    if has_blank != ("o" in fields):
        errors.append("%s: cho duc lo [..] va o: phai di cung nhau" % where)
    if "o" in fields:
        opts = [x.strip() for x in fields["o"].split("/")]
        ans = base(re.search(r"\[(.*?)\]", ja).group(1)) if has_blank else ""
        if len(opts) != 3 or len(set(opts)) != 3 or ans in [base(o) for o in opts] or not all(opts):
            errors.append("%s: o: can 3 phuong an sai khac nhau va khac dap an" % where)
    if "t" in fields:
        m = re.match(r"(.+?)\s*\*([1-4])$", fields["t"])
        pieces = [x.strip() for x in m.group(1).split("/")] if m else []
        if not m or len(pieces) != 4 or not all(pieces):
            errors.append("%s: t: can 4 manh va *vi tri" % where)
        else:
            if "".join(plain(x) for x in pieces) not in plain(ja):
                errors.append("%s: t: ghep 4 manh khong ra mot doan cua cau" % where)
            if len(set(plain(x) for x in pieces)) < 4:
                errors.append("%s: t: 4 manh phai khac nhau" % where)
            for x in pieces:
                check_ja(x + "。", where + " (manh)")
            tiles = [pieces, int(m.group(2))]
    if "e" in fields:
        m = re.match(r"([1-4])\s*>\s*(.+)$", fields["e"])
        if not tiles or not m:
            errors.append("%s: e: can t: va dang 'so > sai'" % where)
        elif plain(m.group(2)) == plain(tiles[0][int(m.group(1)) - 1]):
            errors.append("%s: e: manh sai trung manh dung" % where)
        elif not fields.get("ev") or not fields.get("ee"):
            errors.append("%s: e: can ev: va ee:" % where)
        else:
            check_ja(m.group(2) + "。", where + " (e)")
            err = [int(m.group(1)), m.group(2).strip(), fields["ev"], fields["ee"]]
    has_conj = "<" in ja
    if has_conj != ("c" in fields):
        errors.append("%s: cho chia <..> va c: phai di cung nhau" % where)
    if "c" in fields:
        check_ja(fields["c"] + "。", where + " (c)")
        conj = fields["c"]
    if not (vi and en):
        errors.append("%s: thieu ban dich" % where)
    key = plain(ja)
    # Cau bai tap duoc trung voi cau vi du, nhung khong trung voi cau bai tap khac
    kind = "q" if is_q else "ex"
    if (key, kind) in sent_index:
        errors.append("%s: cau trung voi %s" % (where, sent_index[(key, kind)][1]))
    aid = hashlib.sha1(key.encode("utf-8")).hexdigest()[:10]
    sent_index[(key, kind)] = (len(sents), where)
    sents.append([ja, vi, en, opts, tiles, err, conj, words_in(ja), aid])
    return len(sents) - 1, {"o": opts != 0, "t": tiles != 0, "e": err != 0, "c": conj != 0}


def pair(v, where, key, need=True):
    if not v:
        if need:
            errors.append("%s: thieu %s" % (where, key))
        return 0
    p = [x.strip() for x in SPLIT.split(v)]
    if len(p) != 2 or not all(p):
        errors.append("%s: %s can 'VI | EN'" % (where, key))
        return 0
    return p


def finish(cur, where):
    if not cur:
        return
    pw = "%s (mau %s)" % (where, cur.get("form", "?"))
    for k in ("form", "name", "explain"):
        if not cur.get(k):
            errors.append("%s: thieu %s" % (pw, k))
    count = {"ex": len(cur["ex"]), "q": len(cur["q"]), "o": 0, "t": 0, "e": 0, "c": 0}
    for f in cur["flags"]:
        for k in f:
            if f[k]:
                count[k] += 1
    need = dict(MIN)
    if cur.get("kind") != "conj":
        need["c"] = 0
    for k in need:
        if count[k] < need[k]:
            errors.append("%s: can it nhat %d %s, co %d" % (pw, need[k], k, count[k]))
    pod = 0
    if cur.get("pod"):
        m = re.match(r"(\S+)\s+(\d+)$", cur["pod"])
        lines = pod_lines.get(m.group(1)) if m else None
        if not lines or int(m.group(2)) >= len(lines):
            errors.append("%s: pod: khong tim thay %s" % (pw, cur["pod"]))
        else:
            s, text = lines[int(m.group(2))]
            pod = [m.group(1), s, text]
    patterns.append({
        "f": cur.get("form", ""), "n": pair(cur.get("name"), pw, "name"), "x": pair(cur.get("explain"), pw, "explain"),
        "no": pair(cur.get("note"), pw, "note", False), "cp": pair(cur.get("compare"), pw, "compare", False),
        "tip": cur.get("tip", ""), "pod": pod, "conj": 1 if cur.get("kind") == "conj" else 0,
        "ex": cur["ex"], "q": cur["q"], "re": cur.get("search", "")
    })
    lessons[-1].append(len(patterns) - 1)


files = sorted(glob.glob(os.path.join(root, "tools", level + "_grammar", "*.txt")))
for path in files:
    name = os.path.basename(path)
    lessons.append([])
    cur = None
    with open(path, encoding="utf-8") as f:
        for n, line in enumerate(f, 1):
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            where = "%s:%d" % (name, n)
            if line == "@p":
                finish(cur, where)
                cur = {"ex": [], "q": [], "flags": []}
                continue
            m = re.match(r"(\w+):\s*(.*)$", line)
            if not cur or not m:
                errors.append("%s: dong khong hop le" % where)
                continue
            k, v = m.group(1), m.group(2)
            if k in ("ex", "q"):
                sid, flags = add_sentence(v, where, k == "q")
                if sid is not None:
                    cur[k].append(sid)
                    if k == "q":
                        cur["flags"].append(flags)
            elif k in ("form", "name", "explain", "note", "compare", "tip", "search", "pod", "kind"):
                if k in cur:
                    errors.append("%s: lap lai %s" % (where, k))
                cur[k] = v
            else:
                errors.append("%s: khoa la: %s" % (where, k))
    finish(cur, name)

if list_pod:
    for i, p in enumerate(patterns):
        if not p["re"]:
            continue
        rx = re.compile(p["re"])
        hits, seen = [], set()
        for ep in pod_lines:
            for j, (s, t) in enumerate(pod_lines[ep]):
                if rx.search(t) and t not in seen:
                    seen.add(t)
                    hits.append((ep, j, t))
        out = "%d %s: %d cau\n" % (i, p["f"], len(hits)) + "".join("   pod: %s %d   %s\n" % h for h in hits[:6])
        sys.stdout.buffer.write(out.encode("utf-8"))
    sys.exit(0)

if errors:
    sys.stdout.buffer.write(("\n".join(errors) + "\n").encode("utf-8"))
    sys.exit(1)

for p in patterns:
    del p["re"]
out = {"level": level.upper(), "lessons": lessons, "patterns": patterns, "s": sents}
with open(os.path.join(root, "data", "grammar-" + level + ".js"), "w", encoding="utf-8") as f:
    f.write("window.GRAMMAR_DATA = window.GRAMMAR_DATA || {};\n")
    f.write("window.GRAMMAR_DATA.%s = " % level)
    json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
    f.write(";\n")
print("OK: %d bai, %d mau, %d cau" % (len(lessons), len(patterns), len(sents)))
