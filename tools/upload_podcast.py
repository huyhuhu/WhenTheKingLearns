"""Day cac file mp3 podcast con thieu len Cloudflare R2.

Can: podcast/config.json co "audioBase" (URL public cua bucket) va "bucket" (ten bucket),
va da dang nhap bang `npx wrangler login`.
Cach dung: python tools/upload_podcast.py
"""
import glob, json, os, shutil, subprocess, sys, urllib.error, urllib.request

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def exists(url):
    try:
        req = urllib.request.Request(url, method="HEAD", headers={"User-Agent": "podcast-uploader"})
        with urllib.request.urlopen(req, timeout=20) as r:
            return r.status == 200
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return False
        raise


def main():
    with open(os.path.join(root, "podcast", "config.json"), encoding="utf-8") as f:
        config = json.load(f)
    base, bucket = config.get("audioBase", "").rstrip("/") + "/", config.get("bucket", "")
    if base == "/" or not bucket:
        sys.exit("Hay dien audioBase va bucket trong podcast/config.json truoc.")
    npx = shutil.which("npx") or sys.exit("Khong tim thay npx (can cai Node.js).")
    names = []
    for path in glob.glob(os.path.join(root, "data", "podcast", "*.json")):
        with open(path, encoding="utf-8") as f:
            names.append(json.load(f)["audio"])
    sent = 0
    for name in sorted(names):
        if exists(base + name):
            continue
        print("upload", name)
        subprocess.run([npx, "wrangler", "r2", "object", "put", "%s/%s" % (bucket, name),
                        "--file", os.path.join(root, "podcast", "audio", name),
                        "--content-type", "audio/mpeg",
                        "--cache-control", "public, max-age=31536000, immutable", "--remote"], check=True)
        sent += 1
    print("Da upload %d file, %d file da co san." % (sent, len(names) - sent))


main()
