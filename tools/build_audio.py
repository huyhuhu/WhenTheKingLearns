"""Tao file doc tieng Nhat cho moi cach doc trong data/*.js bang edge-tts.

Cach dung: python tools/build_audio.py [kana can tao lai ...]
Chi tao cac file con thieu (va cac kana truyen vao), roi ghi lai data/audio.js.
"""
import asyncio, glob, json, os, re, sys

import edge_tts

VOICE = "ja-JP-NanamiNeural"
# Kana tran de bi doc thanh than tu; them dau cau de may doc nhu mot tu.
# Doi van ban o day thi tang so phien ban de trinh duyet tai lai file.
OVERRIDES = {
    "うお": ("うお。", 2),
}
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out_dir = os.path.join(root, "audio", "ja")


# Phai giong het ham norm() trong js/speech.js
def norm(text):
    text = re.sub(r"[.\-\s]", "", text)
    return "".join(chr(ord(c) - 0x60) if "ァ" <= c <= "ヶ" else c for c in text)


def file_name(key):
    return "".join("%04x" % ord(c) for c in key) + ".mp3"


def collect():
    keys = set()
    for path in glob.glob(os.path.join(root, "data", "n*.js")):
        with open(path, encoding="utf-8") as f:
            text = f.read()
        data = json.loads(text[text.index("{", text.index("=", text.index("\n"))):text.rindex("}") + 1])
        for k in data["kanji"].values():
            for r in k["on"] + k["kun"]:
                keys.add(norm(r))
            for v in k["vocab"]:
                keys.add(norm(v[1]))
    keys.discard("")
    return sorted(keys)


async def make(key, sem, failed, force):
    path = os.path.join(out_dir, file_name(key))
    if not force and os.path.exists(path) and os.path.getsize(path) > 0:
        return
    text = OVERRIDES.get(key, (key, 1))[0]
    async with sem:
        for attempt in range(3):
            try:
                await edge_tts.Communicate(text, VOICE).save(path)
                if os.path.getsize(path) > 0:
                    return
            except Exception:
                await asyncio.sleep(1 + attempt)
        if os.path.exists(path):
            os.remove(path)
        failed.append(key)


async def main():
    os.makedirs(out_dir, exist_ok=True)
    keys = collect()
    failed = []
    sem = asyncio.Semaphore(6)
    force = set(sys.argv[1:])
    await asyncio.gather(*(make(k, sem, failed, k in force) for k in keys))
    done = [k for k in keys if os.path.exists(os.path.join(out_dir, file_name(k)))]
    with open(os.path.join(root, "data", "audio.js"), "w", encoding="utf-8") as f:
        f.write("window.AUDIO_SET = ")
        json.dump({k: OVERRIDES.get(k, (k, 1))[1] for k in done}, f, ensure_ascii=False, separators=(",", ":"))
        f.write(";\n")
    print("%d/%d file, %d loi" % (len(done), len(keys), len(failed)))
    if failed:
        sys.stdout.buffer.write(("\n".join(failed) + "\n").encode("utf-8"))


asyncio.run(main())
