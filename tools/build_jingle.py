"""Tao doan nhac ngan phat giua hai tap podcast: audio/jingle.mp3.

Cach dung: tools/.venv/Scripts/python tools/build_jingle.py
"""
import os, subprocess

import imageio_ffmpeg
import numpy as np

SR = 44100
LENGTH = 6.0
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NOTE = {"C3": 130.81, "G3": 196.00, "C4": 261.63, "E4": 329.63, "G4": 392.00,
        "C5": 523.25, "D5": 587.33, "E5": 659.25, "G5": 783.99, "A5": 880.00, "C6": 1046.50}
# (thoi diem giay, not, do lon) - giai dieu ngu cung Do truong
MELODY = [(0.4, "E5", 1), (0.7, "G5", 0.9), (1.0, "A5", 0.9), (1.3, "C6", 1),
          (1.9, "A5", 0.8), (2.2, "G5", 0.8), (2.5, "D5", 0.8), (2.8, "E5", 1), (3.1, "C5", 0.9), (3.9, "G5", 0.5), (4.3, "C6", 0.45)]
t = np.arange(int(SR * LENGTH)) / SR
out = np.zeros_like(t)


def pluck(start, freq, amp):
    s = t - start
    on = s >= 0
    tone = np.zeros_like(t)
    for k, a in enumerate((1.0, 0.45, 0.2, 0.1), start=1):
        tone += a * np.sin(2 * np.pi * k * freq * s) * np.exp(-s * (2.2 + 1.8 * k))
    tone *= np.clip(s / 0.005, 0, 1)
    return np.where(on, tone * amp, 0)


for start, name, amp in MELODY:
    out += 0.32 * pluck(start, NOTE[name], amp)
for start in (0.4, 3.1):
    out += 0.25 * pluck(start, NOTE["C3"], 1) + 0.15 * pluck(start, NOTE["G3"], 1)

pad = sum(np.sin(2 * np.pi * NOTE[n] * t) + 0.5 * np.sin(2 * np.pi * NOTE[n] * 1.003 * t) for n in ("C4", "E4", "G4"))
env = np.clip((t - 0.3) / 1.2, 0, 1) * np.clip((LENGTH - 0.2 - t) / 1.6, 0, 1)
out += 0.035 * pad * env

# Vang nhe kieu Schroeder: vai bo loc comb song song
wet = np.zeros_like(out)
for delay_ms, fb in ((29.7, 0.72), (37.1, 0.7), (41.1, 0.68), (43.7, 0.66)):
    d = int(SR * delay_ms / 1000)
    y = out.copy()
    for i in range(d, len(y)):
        y[i] += fb * y[i - d]
    wet += y
out = out + 0.12 * wet

out *= np.clip((LENGTH - t) / 1.2, 0, 1)
out *= min(10 ** (-23 / 20) / np.sqrt((out ** 2).mean()), 10 ** (-1 / 20) / np.abs(out).max())
pcm = (out * 32767).astype(np.int16).tobytes()
path = os.path.join(root, "audio", "jingle.mp3")
subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), "-y", "-loglevel", "error", "-f", "s16le", "-ar", str(SR), "-ac", "1",
                "-i", "pipe:0", "-c:a", "libmp3lame", "-b:a", "64k", path], input=pcm, check=True)
print("%s %.1f KB, rms %.1f dBFS" % (path, os.path.getsize(path) / 1024, 20 * np.log10(np.sqrt((out ** 2).mean()))))
