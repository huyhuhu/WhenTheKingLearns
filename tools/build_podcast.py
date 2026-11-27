"""Tao mp3 va lyric cho podcast tu podcast/scripts/*.json, roi ghi lai data/podcast.js.

Cach dung: tools/.venv/Scripts/python tools/build_podcast.py [id ...]
Khong truyen id thi tao lai tat ca. Cau da doc duoc cache nen tao lai rat nhanh.
"""
import asyncio, glob, hashlib, json, os, re, subprocess, sys

import edge_tts, imageio_ffmpeg, miniaudio
import numpy as np

SR = 24000
KBPS = 32
GAP_PIECE, GAP_SECTION = 0.12, 2.0
GAP = {("ja", "ja"): 1.3, ("ja", "vi"): 1.2, ("vi", "ja"): 0.8, ("vi", "vi"): 0.7}
DEFAULT_RATE = {"ja": "-15%", "jaInline": "-25%", "vi": "+0%"}
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
pod_dir = os.path.join(root, "podcast")
script_dir = os.path.join(pod_dir, "scripts")
audio_dir = os.path.join(pod_dir, "audio")
lyric_dir = os.path.join(root, "data", "podcast")
cache_dir = os.path.join(root, "tools", ".cache", "podcast")
RUBY = re.compile(r"\{([^|{}]+)\|([^{}]+)\}")
JA_SPAN = re.compile(r"「(.*?)」")
KANJI = re.compile(r"[㐀-鿿々]")
KANA = re.compile(r"[぀-ヿ]")
# Tu Latin co dang romaji trong loi tieng Viet: giong Viet doc sai, phai viet bang chu Nhat trong 「」
ROMAJI = re.compile(r"^(?:(?:kk|tt|pp|ss|tch)?(?:ky|gy|sh|ch|ny|hy|by|py|my|ry|ts|[kgsztdnhbpmrjfwy])?[aiueoāīūēō]h?"
                    r"|n(?![aiueoyāīūēō]))+$", re.I)
VI_PLAIN = set("hai bao cho chi sau nhi sao hoa tin nhau mua gia gian tai chu run ban chia che ngu chai ngon bia giao kia "
               "rau toa cha dao giun hoan hon nhai reo sai ten tia mai pin con tan san son man dan ton nhu mui rao bai gai "
               "dai tao nao boa chui sen niu home game time euro emotion hawaii indonesia mario tarantino edison missouri".split())
INDEX_KEYS = ("id", "level", "title", "summary", "format", "topics", "date", "duration", "audio", "size")


def out(text):
    sys.stdout.buffer.write((text + "\n").encode("utf-8"))


def ja_units(markup, warn):
    units, pos = [], 0
    for m in list(RUBY.finditer(markup)) + [None]:
        for c in markup[pos:m.start() if m else len(markup)]:
            if KANJI.match(c):
                warn("kanji thieu furigana: %s trong %s" % (c, markup))
            units.append({"d": c, "tts": c})
        if not m:
            break
        ruby = m.group(2)
        # "!" truoc cach doc: may doc theo kana thay vi tu doan cach doc cua kanji
        tts = ruby[1:] if ruby.startswith("!") else m.group(1)
        units.append({"d": m.group(1), "r": ruby.lstrip("!"), "tts": tts})
        pos = m.end()
    return units


def voice_of(spk, lang, rates):
    if lang == "vi" or "vi" not in spk:
        return spk[lang], spk.get("rate", rates[lang]), spk.get("pitch", "+0Hz")
    return spk[lang], rates[lang], "+0Hz"


def pieces_of(item, spk, rates, warn):
    if "ja" in item:
        v, r, p = voice_of(spk, "ja", rates)
        return [{"voice": v, "rate": r, "pitch": p, "units": ja_units(item["ja"], warn)}]
    pieces, pos, text = [], 0, item["text"]
    for m in list(JA_SPAN.finditer(text)) + [None]:
        vi = text[pos:m.start() if m else len(text)]
        if vi:
            if KANA.search(vi) or KANJI.search(vi):
                warn("chu Nhat nam ngoai 「」 trong cau tieng Viet: %s" % text)
            # Giong tieng Anh (loa tren tau) doc duoc ten ga bang chu Latin
            english = spk["vi"].startswith("en-")
            for w in re.findall(r"[^\W\d_]{3,}", vi):
                if not english and ROMAJI.match(w) and w.lower() not in VI_PLAIN:
                    warn("tu tieng Nhat viet bang chu Latin (doi sang chu Nhat trong 「」): %s" % w)
            speak = bool(re.search(r"\w", vi))
            v, r, p = voice_of(spk, "vi", rates)
            pieces.append({"voice": v, "rate": r, "pitch": p,
                           "units": [{"d": c, "tts": c if speak else ""} for c in vi]})
        if not m:
            break
        v, r, p = voice_of(spk, "ja", rates)
        units = [{"d": "「", "tts": ""}] + ja_units(m.group(1), warn) + [{"d": "」", "tts": ""}]
        pieces.append({"voice": v, "rate": rates["jaInline"], "pitch": p, "units": units})
        pos = m.end()
    return pieces


def tts_text(piece):
    return "".join(u["tts"] for u in piece["units"]).strip()


def clip_path(job):
    return os.path.join(cache_dir, hashlib.sha1("|".join(job).encode("utf-8")).hexdigest()[:20])


async def synth(job, sem):
    path = clip_path(job)
    if os.path.exists(path + ".json"):
        return
    voice, rate, pitch, text = job
    async with sem:
        for attempt in range(8):
            try:
                audio, words = bytearray(), []
                comm = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch, boundary="WordBoundary")
                async for ch in comm.stream():
                    if ch["type"] == "audio":
                        audio += ch["data"]
                    elif ch["type"] == "WordBoundary":
                        words.append([ch["offset"] / 1e7, (ch["offset"] + ch["duration"]) / 1e7, ch["text"]])
                if audio:
                    break
            except Exception:
                pass
            await asyncio.sleep(2 + attempt * 3)
        else:
            raise RuntimeError("TTS loi: %s %s" % (voice, text))
    with open(path + ".mp3", "wb") as f:
        f.write(audio)
    with open(path + ".json", "w", encoding="utf-8") as f:
        json.dump(words, f, ensure_ascii=False)


def load_clip(job):
    path = clip_path(job)
    with open(path + ".json", encoding="utf-8") as f:
        words = json.load(f)
    with open(path + ".mp3", "rb") as f:
        snd = miniaudio.decode(f.read(), output_format=miniaudio.SampleFormat.SIGNED16, nchannels=1, sample_rate=SR)
    x = np.frombuffer(snd.samples, dtype=np.int16).astype(np.float32) / 32768
    win = SR // 100
    n = len(x) // win
    rms = np.sqrt((x[:n * win].reshape(n, win) ** 2).mean(axis=1))
    voiced = np.nonzero(rms > 10 ** (-45 / 20))[0]
    a = max(0, voiced[0] * win - int(0.03 * SR))
    b = min(len(x), (voiced[-1] + 1) * win + int(0.08 * SR))
    level = np.sqrt((rms[voiced] ** 2).mean())
    x = x[a:b]
    x *= min(10 ** (-20 / 20) / level, 10 ** (-1 / 20) / max(np.abs(x).max(), 1e-6))
    shift = a / SR
    return x, [[max(0.0, s - shift), max(0.0, e - shift), w] for s, e, w in words]


def place_words(units, words, offset):
    text, owner = "", []
    for i, u in enumerate(units):
        text += u["tts"]
        owner += [i] * len(u["tts"])
    cur, missed = 0, 0
    for s, e, w in words:
        k = text.find(w, cur)
        if k < 0:
            missed += 1
            continue
        for i in set(owner[k:k + len(w)]):
            u = units[i]
            u["s"] = min(u.get("s", 1e9), offset + s)
            u["e"] = max(u.get("e", 0), offset + e)
        cur = k + len(w)
    return missed


def tokens_of(units, line_s):
    toks = []
    for u in units:
        timed = "s" in u
        last = toks[-1] if toks else None
        if (last and not u.get("r") and last[3] is None
                and last[1:3] == ([u["s"], u["e"]] if timed else [None, None])):
            last[0] += u["d"]
        else:
            toks.append([u["d"], u.get("s"), u.get("e"), u.get("r")])
    prev_e = line_s
    for i, t in enumerate(toks):
        if t[1] is None:
            nxt = next((x[1] for x in toks[i + 1:] if x[1] is not None), None)
            t[1] = t[2] = prev_e if i else (nxt if nxt is not None else line_s)
        prev_e = t[2]
    return [[d, round(s, 2), round(e, 2)] + ([r] if r else []) for d, s, e, r in toks]


def expand(script):
    lines, chapters = [], []
    for item in script["flow"]:
        if "sec" in item:
            chapters.append({"name": item["sec"], "at": len(lines)})
        elif "pause" in item:
            lines.append({"pause": item["pause"], "cue": item.get("cue")})
        elif "d" in item:
            ds = script["dialogue"] if item["d"] == "all" else [script["dialogue"][item["d"]]]
            lines += [dict(x) for x in ds]
        else:
            lines.append(dict(item))
    return lines, chapters


def write_json(path, obj):
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, separators=(",", ":"))
    os.replace(tmp, path)


async def build(path, cast):
    with open(path, encoding="utf-8") as f:
        script = json.load(f)
    sid = script["id"]
    warnings = []
    warn = lambda msg: warnings.append(msg)
    speakers = dict(cast)
    speakers.update(script.get("speakers", {}))
    rates = dict(DEFAULT_RATE, **script.get("rate", {}))
    lines, chapters = expand(script)
    for ln in lines:
        if "spk" in ln:
            if ln["spk"] not in speakers:
                raise ValueError("%s: khong co nhan vat %s" % (sid, ln["spk"]))
            if "ja" in ln and not (ln.get("ro") and ln.get("vi")):
                warn("cau tieng Nhat thieu ro/vi: %s" % ln["ja"])
            ln["pieces"] = pieces_of(ln, speakers[ln["spk"]], rates, warn)

    jobs = {(p["voice"], p["rate"], p["pitch"], tts_text(p))
            for ln in lines for p in ln.get("pieces", []) if tts_text(p)}
    sem = asyncio.Semaphore(3)
    await asyncio.gather(*(synth(j, sem) for j in jobs))

    audio, t, prev_lang, last_dur, missed, total = [], 0.0, None, 0.0, 0, 0
    chapter_at = {c["at"]: c for c in chapters}
    out_lines, used = [], set()

    def silence(sec):
        nonlocal t
        audio.append(np.zeros(int(sec * SR), dtype=np.float32))
        t += int(sec * SR) / SR

    for idx, ln in enumerate(lines):
        if idx in chapter_at:
            if idx:
                silence(GAP_SECTION)
            chapter_at[idx]["s"] = round(t, 2)
        if "pause" in ln:
            # "auto": du thoi gian de nguoi nghe nhac lai cau vua nghe
            sec = last_dur * 1.3 + 1.0 if ln["pause"] == "auto" else ln["pause"]
            if ln["cue"]:
                out_lines.append({"cue": ln["cue"], "s": round(t, 2), "e": round(t + sec, 2)})
            silence(sec)
            continue
        lang = "ja" if "ja" in ln else "vi"
        if prev_lang and idx not in chapter_at:
            silence(GAP[prev_lang, lang])
        line_s, units = t, []
        for i, p in enumerate(ln["pieces"]):
            text = tts_text(p)
            if text:
                if i and units:
                    silence(GAP_PIECE)
                x, words = load_clip((p["voice"], p["rate"], p["pitch"], text))
                missed += place_words(p["units"], words, t)
                total += len(words)
                audio.append(x)
                t += len(x) / SR
            units += p["units"]
        rec = {"spk": ln["spk"], "lang": lang, "s": round(line_s, 2), "e": round(t, 2), "t": tokens_of(units, line_s)}
        if lang == "ja":
            rec["ro"], rec["vi"] = ln.get("ro", ""), ln.get("vi", "")
        out_lines.append(rec)
        used.add(ln["spk"])
        prev_lang, last_dur = lang, t - line_s

    pcm = (np.clip(np.concatenate(audio), -1, 1) * 32767).astype(np.int16).tobytes()
    name = "%s.%s.mp3" % (sid, hashlib.sha1(pcm).hexdigest()[:8])
    mp3 = os.path.join(audio_dir, name)
    if not os.path.exists(mp3):
        for old in glob.glob(os.path.join(audio_dir, sid + ".*.mp3")):
            os.remove(old)
        subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), "-y", "-loglevel", "error", "-f", "s16le", "-ar", str(SR),
                        "-ac", "1", "-i", "pipe:0", "-c:a", "libmp3lame", "-b:a", "%dk" % KBPS,
                        "-metadata", "title=" + script["title"]["vi"], mp3], input=pcm, check=True)

    title_units = ja_units(script["title"]["ja"], warn)
    episode = {
        "id": sid, "level": script["level"],
        "title": {"vi": script["title"]["vi"], "ja": [[u["d"], u["r"]] if u.get("r") else [u["d"]] for u in title_units]},
        "summary": script.get("summary", ""), "format": script.get("format", ""),
        "topics": script.get("topics", []), "date": script.get("date", ""), "sources": script.get("sources", []),
        "duration": round(t, 2), "audio": name, "size": os.path.getsize(mp3),
        "speakers": {k: {"name": speakers[k]["name"]} for k in sorted(used)},
        "chapters": [{"name": c["name"], "s": c["s"]} for c in chapters if "s" in c],
        "lines": out_lines,
    }
    write_json(os.path.join(lyric_dir, sid + ".json"), episode)
    out("%s  %d:%02d  %.0f KB  tu %d/%d%s" % (sid, t // 60, t % 60, episode["size"] / 1024, total - missed, total,
                                               "" if not warnings else "  (%d canh bao)" % len(warnings)))
    for w in warnings:
        out("   ! " + w)


def write_index():
    with open(os.path.join(pod_dir, "config.json"), encoding="utf-8") as f:
        config = json.load(f)
    episodes = []
    for path in sorted(glob.glob(os.path.join(lyric_dir, "*.json"))):
        try:
            with open(path, encoding="utf-8") as f:
                ep = json.load(f)
        except ValueError:
            continue
        episodes.append({k: ep[k] for k in INDEX_KEYS if ep.get(k) not in (None, "", [])})
    with open(os.path.join(root, "data", "podcast.js"), "w", encoding="utf-8") as f:
        f.write("window.PODCAST = ")
        json.dump({"base": config["audioBase"], "episodes": episodes}, f, ensure_ascii=False, separators=(",", ":"))
        f.write(";\n")
    out("data/podcast.js: %d tap" % len(episodes))


async def main(ids):
    for d in (audio_dir, lyric_dir, cache_dir):
        os.makedirs(d, exist_ok=True)
    with open(os.path.join(pod_dir, "cast.json"), encoding="utf-8") as f:
        cast = json.load(f)
    paths = sorted(glob.glob(os.path.join(script_dir, "*.json")))
    if ids:
        paths = [p for p in paths if os.path.splitext(os.path.basename(p))[0] in ids]
    failed = []
    for p in paths:
        try:
            await build(p, cast)
        except RuntimeError as e:
            # Dich vu TTS hay loi tam thoi; bo qua tap nay, chay lai sau (cau da doc van con trong cache)
            failed.append(os.path.splitext(os.path.basename(p))[0])
            out("LOI %s: %s" % (failed[-1], e))
    write_index()
    if failed:
        out("Chua xong (chay lai): " + " ".join(failed))
        sys.exit(1)


asyncio.run(main(sys.argv[1:]))
