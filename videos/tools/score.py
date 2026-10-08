#!/usr/bin/env python3
"""Altiarc — original scores + SFX stems for the two isometric films.

Deterministic offline synthesis (numpy + scipy). Each film gets:
  <project>/audio/music.wav   the composed music bed, cut to the picture
  <project>/audio/sfx.wav     the sound-design stem, built from <project>/audio/sfx-cues.json

Usage:  python score.py ville   <project_dir>
        python score.py chatbot <project_dir>
"""
import json
import sys
import wave
from pathlib import Path

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt, sosfilt_zi

SR = 48000
RNG = np.random.default_rng(20261008)


# ── Basics ──────────────────────────────────────────────────────────────────
def hz(note):
    """'A4' / 'C#3' / 'Bb2' → frequency."""
    names = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}
    n = names[note[0]]
    i = 1
    if note[i] == "#":
        n += 1
        i += 1
    elif note[i] == "b":
        n -= 1
        i += 1
    octave = int(note[i:])
    return 440.0 * 2 ** ((n + 12 * (octave + 1) - 69) / 12)


def buf(seconds):
    return np.zeros((int(seconds * SR) + SR, 2))


def add(track, sig, t, gain=1.0, pan=0.0):
    """Mix a mono or stereo signal into `track` at time t (equal-power pan)."""
    i = int(round(t * SR))
    if i >= len(track) or len(sig) == 0:
        return
    if sig.ndim == 1:
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        sig = np.stack([sig * l, sig * r], axis=1) * np.sqrt(2)
    n = min(len(sig), len(track) - i)
    track[i : i + n] += sig[:n] * gain


def env_adsr(n, a, d, s, r, hold=None):
    a, d, r = int(a * SR), int(d * SR), int(r * SR)
    hold = n - r if hold is None else int(hold * SR)
    e = np.zeros(n)
    k = np.arange(n)
    e = np.where(k < a, k / max(a, 1), e)
    dd = (k >= a) & (k < a + d)
    e = np.where(dd, 1 - (1 - s) * (k - a) / max(d, 1), e)
    e = np.where((k >= a + d) & (k < hold), s, e)
    rel = k >= hold
    start = e[hold - 1] if 0 < hold <= n else s
    e = np.where(rel, start * np.clip(1 - (k - hold) / max(r, 1), 0, 1), e)
    return e


def lowpass(x, fc, order=2):
    sos = butter(order, min(fc, SR * 0.45) / (SR / 2), "low", output="sos")
    return sosfilt(sos, x, axis=0)


def highpass(x, fc, order=2):
    sos = butter(order, fc / (SR / 2), "high", output="sos")
    return sosfilt(sos, x, axis=0)


def bandpass(x, lo, hi, order=2):
    sos = butter(order, [lo / (SR / 2), min(hi, SR * 0.45) / (SR / 2)], "band", output="sos")
    return sosfilt(sos, x, axis=0)


def sweep_lowpass(x, cutoff_fn, block=512):
    """Time-varying low-pass: cutoff_fn(t_seconds) → Hz, evaluated per block."""
    out = np.zeros_like(x)
    zi = None
    for s in range(0, len(x), block):
        fc = float(np.clip(cutoff_fn(s / SR), 40, SR * 0.45))
        sos = butter(2, fc / (SR / 2), "low", output="sos")
        if zi is None:
            zi = np.stack([sosfilt_zi(sos)] * x.shape[1], axis=-1) * 0
        seg, zi = sosfilt(sos, x[s : s + block], axis=0, zi=zi)
        out[s : s + block] = seg
    return out


def saw(f, n, detune_cents=0.0, phase=0.0):
    """Band-limited saw (additive)."""
    f = f * 2 ** (detune_cents / 1200)
    t = np.arange(n) / SR
    out = np.zeros(n)
    k = 1
    while f * k < SR * 0.42 and k < 40:
        out += np.sin(2 * np.pi * f * k * t + phase * k) / k
        k += 1
    return out * 0.55


def tri(f, n):
    t = np.arange(n) / SR
    return 2 / np.pi * np.arcsin(np.sin(2 * np.pi * f * t))


def sine(f, n, phase=0.0):
    return np.sin(2 * np.pi * f * np.arange(n) / SR + phase)


def make_ir(seconds=2.6, damp=3.2, seed=7):
    r = np.random.default_rng(seed)
    n = int(seconds * SR)
    t = np.arange(n) / SR
    decay = np.exp(-damp * t)
    ir = r.standard_normal((n, 2)) * decay[:, None]
    ir = lowpass(ir, 6500)
    ir[: int(0.012 * SR)] *= np.linspace(0, 1, int(0.012 * SR))[:, None]
    return ir / np.sqrt(np.sum(ir**2) / 2)


IR_HALL = make_ir(2.8, 2.6, 7)
IR_ROOM = make_ir(1.2, 5.5, 11)


def reverb(x, ir, wet):
    w = np.stack([fftconvolve(x[:, c], ir[:, c])[: len(x)] for c in range(2)], axis=1)
    return x + w * wet


def delay(x, seconds, feedback=0.35, wet=0.3, pingpong=True):
    d = int(seconds * SR)
    out = x.copy()
    tap = x.copy()
    for k in range(1, 6):
        tap = np.roll(tap, d, axis=0)
        tap[:d] = 0
        tap = tap * feedback
        if pingpong:
            tap = tap[:, ::-1]
        out += tap * (wet / feedback)
    return out


def duck(x, hits, depth=0.45, release=0.22):
    """Sidechain-style ducking on kick hit times."""
    g = np.ones(len(x))
    for t in hits:
        i = int(t * SR)
        n = int(release * SR)
        if i >= len(g):
            continue
        seg = 1 - depth * (1 - np.arange(min(n, len(g) - i)) / n) ** 2
        g[i : i + len(seg)] = np.minimum(g[i : i + len(seg)], seg)
    return x * g[:, None]


def fade(x, t0, t1, rising):
    i0, i1 = int(t0 * SR), int(t1 * SR)
    g = np.ones(len(x))
    ramp = np.linspace(0, 1, max(i1 - i0, 1))
    ramp = ramp**2 if rising else (1 - ramp) ** 2
    if rising:
        g[:i0] = 0
        g[i0:i1] = ramp[: len(g[i0:i1])]
    else:
        g[i0:i1] = ramp[: len(g[i0:i1])]
        g[i1:] = 0
    return x * g[:, None]


# ── Instruments ─────────────────────────────────────────────────────────────
def pad(notes, dur, bright=1800, attack=0.9, release=1.4):
    n = int((dur + release) * SR)
    out = np.zeros((n, 2))
    for j, nt in enumerate(notes):
        f = hz(nt)
        for c, det in ((0, -7), (1, 7)):
            out[:, c] += saw(f, n, det, phase=j * 0.7 + c) + 0.6 * saw(f, n, -det * 0.4, phase=j)
    out = lowpass(out, bright, 2)
    e = env_adsr(n, attack, 0.6, 0.85, release, hold=dur)
    return out * e[:, None] / (len(notes) * 1.6)


def pluck(f, dur=0.35, bright=4200, decay=7.0):
    n = int((dur + 0.3) * SR)
    t = np.arange(n) / SR
    x = saw(f, n, 0) + 0.5 * saw(f, n, 9)
    x = sweep_lowpass(np.stack([x, x], 1), lambda s: bright * np.exp(-s * decay) + 300)[:, 0]
    e = np.exp(-t * decay * 0.55) * env_adsr(n, 0.003, 0.05, 1, 0.08, hold=dur)
    return x * e * 0.6


def bell(f, dur=1.6, ratio=3.5, index=2.4, decay=3.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    mod = np.sin(2 * np.pi * f * ratio * t) * index * np.exp(-t * decay * 1.6)
    x = np.sin(2 * np.pi * f * t + mod) * np.exp(-t * decay)
    x[: int(0.002 * SR)] *= np.linspace(0, 1, int(0.002 * SR))
    return x * 0.5


def kalimba(f, dur=1.1):
    n = int(dur * SR)
    t = np.arange(n) / SR
    mod = np.sin(2 * np.pi * f * 5.0 * t) * 1.6 * np.exp(-t * 18)
    x = np.sin(2 * np.pi * f * t + mod) * np.exp(-t * 4.2)
    x += 0.25 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t * 9)
    x[: int(0.002 * SR)] *= np.linspace(0, 1, int(0.002 * SR))
    return x * 0.55


def epiano(notes, dur=1.8):
    n = int((dur + 0.8) * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for nt in notes:
        f = hz(nt)
        mod = np.sin(2 * np.pi * f * t) * 1.3 * np.exp(-t * 3.5)
        out += np.sin(2 * np.pi * f * t + mod) * np.exp(-t * 1.1)
    out *= 1 + 0.18 * np.sin(2 * np.pi * 4.6 * t)
    out *= env_adsr(n, 0.004, 0.2, 1, 0.5, hold=dur)
    return out / len(notes) * 0.7


def bass(f, dur, kind="pluck"):
    n = int((dur + 0.05) * SR)
    t = np.arange(n) / SR
    if kind == "sub":
        x = sine(f, n) + 0.25 * tri(f * 2, n)
        e = env_adsr(n, 0.01, 0.1, 0.9, 0.08, hold=dur)
    else:
        x = sine(f, n) + 0.45 * saw(f, n) * np.exp(-t * 14)
        e = np.exp(-t * 3.0) * env_adsr(n, 0.004, 0.05, 1, 0.05, hold=dur)
    x = np.tanh(x * 1.4) / np.tanh(1.4)
    return lowpass(x, 900) * e * 0.8


def kick(gain=1.0, punch=1.0):
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    f = 46 + 95 * np.exp(-t * 32) * punch
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * np.exp(-t * 7.5)
    x += 0.35 * RNG.standard_normal(n) * np.exp(-t * 180)
    return np.tanh(x * 1.6) * 0.8 * gain


def clap():
    n = int(0.35 * SR)
    t = np.arange(n) / SR
    x = RNG.standard_normal(n)
    e = np.zeros(n)
    for k, off in enumerate((0, 0.011, 0.022)):
        i = int(off * SR)
        e[i:] += np.exp(-(t[i:] - off) * (60 if k < 2 else 16))
    return bandpass(x * e, 900, 5200) * 0.45


def snap():
    n = int(0.18 * SR)
    t = np.arange(n) / SR
    x = bandpass(RNG.standard_normal(n), 1500, 7000) * np.exp(-t * 45)
    return x * 0.55 + 0.25 * sine(1800, n) * np.exp(-t * 80)


def hat(open_=False):
    n = int((0.35 if open_ else 0.06) * SR)
    t = np.arange(n) / SR
    x = highpass(RNG.standard_normal(n), 7500)
    return x * np.exp(-t * (9 if open_ else 70)) * 0.32


def shaker():
    n = int(0.09 * SR)
    t = np.arange(n) / SR
    x = bandpass(RNG.standard_normal(n), 4500, 11000)
    return x * np.sin(np.pi * np.clip(t / 0.09, 0, 1)) ** 2 * 0.18


def riser(dur, top=6000):
    n = int(dur * SR)
    t = np.arange(n) / SR
    noise = RNG.standard_normal((n, 2))
    x = sweep_lowpass(noise, lambda s: 300 + (top - 300) * (s / dur) ** 2)
    f = 110 * 2 ** (2.5 * t / dur)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x[:, 0] += 0.25 * np.sin(ph)
    x[:, 1] += 0.25 * np.sin(ph * 1.005)
    return x * ((t / dur) ** 1.8)[:, None] * 0.35


def impact():
    n = int(3.5 * SR)
    t = np.arange(n) / SR
    f = 34 + 70 * np.exp(-t * 9)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.6)
    crash = highpass(RNG.standard_normal(n), 2500) * np.exp(-t * 2.2) * 0.22
    x = np.stack([boom + crash, boom + np.roll(crash, 37)], 1)
    return np.tanh(x * 1.3) * 0.8


# ── Shared helpers for scores ───────────────────────────────────────────────
class Grid:
    def __init__(self, offset, bpm=120):
        self.o = offset
        self.b = 60 / bpm

    def bar(self, k, beat=0.0):
        return self.o + (k * 4 + beat) * self.b


def drums(mus, grid, bars, pattern, hits_out, gain=1.0):
    """pattern: dict instrument → list of beat positions within the bar (0..4)."""
    for k in bars:
        for inst, beats in pattern.items():
            for b in beats:
                t = grid.bar(k, b)
                if inst == "kick":
                    add(mus, kick(), t, 0.95 * gain)
                    hits_out.append(t)
                elif inst == "clap":
                    add(mus, clap(), t, 0.7 * gain, 0.05)
                elif inst == "snap":
                    add(mus, snap(), t, 0.55 * gain, -0.1)
                elif inst == "hat":
                    add(mus, hat(), t, 0.55 * gain, 0.3)
                elif inst == "ohat":
                    add(mus, hat(True), t, 0.35 * gain, 0.3)
                elif inst == "shaker":
                    add(mus, shaker(), t, 0.7 * gain, -0.35)


def master(x, target_rms_db=-17.0, ceiling=0.89):
    x = highpass(x, 28)
    rms = np.sqrt(np.mean(x**2) + 1e-12)
    x = x * (10 ** (target_rms_db / 20) / rms)
    # Soft limiter.
    return np.tanh(x / ceiling) * ceiling


def write_wav(path, x):
    path.parent.mkdir(parents=True, exist_ok=True)
    y = np.clip(x, -1, 1)
    pcm = (y * 32767).astype("<i2")
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def read_mp3(path):
    import subprocess

    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(path), "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"],
        capture_output=True,
        check=True,
    ).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).astype(np.float64)


def build_sfx(project, length):
    cues = json.loads((project / "audio" / "sfx-cues.json").read_text())
    stem = buf(length)
    cache = {}
    for c in cues["cues"]:
        f = c["file"]
        if f not in cache:
            cache[f] = read_mp3(project / f)
        add(stem, cache[f], c["t"], c.get("gain", 1.0), c.get("pan", 0.0))
    stem = reverb(stem, IR_ROOM, 0.12)
    return stem[: int(length * SR)]


# ── Score: La ville isométrique (26 s) ──────────────────────────────────────
def score_ville(L=26.0):
    g = Grid(0.9)  # downbeats: 0.9 2.9 4.9 6.9(drop) … 18.9 20.9 22.9(impact) 24.9
    mus = buf(L)
    pads = buf(L)
    arps = buf(L)
    hits = []
    prog = {
        "Am": (["A3", "C4", "E4", "G4"], "A1"),
        "F": (["F3", "A3", "C4", "E4"], "F1"),
        "C": (["C4", "E4", "G4", "D5"], "C2"),
        "G": (["G3", "B3", "D4", "A4"], "G1"),
        "Dm": (["D3", "F3", "A3", "C4"], "D2"),
        "Esus": (["E3", "A3", "B3", "D4"], "E1"),
    }
    # Opening swell (macro shot) + intro bars.
    add(pads, pad(["A2", "E3", "A3"], 1.2, 900, 0.8, 1.2), 0.0, 0.5)
    for k, ch in ((0, "Am"), (1, "F")):
        add(pads, pad(prog[ch][0], 2.0, 1400, 0.6, 1.2), g.bar(k), 0.55)
        add(mus, bass(hz(prog[ch][1]) * 2, 1.9, "sub"), g.bar(k), 0.3)
    # Heartbeat on the city reveal.
    for t in (g.bar(1), g.bar(1, 1)):
        add(mus, kick(0.6, 0.6), t, 0.6)
    # Friction bar: tension pulse + riser + roll, then a breath before the drop.
    for half, ch in ((0, "Dm"), (2, "Esus")):
        add(pads, pad(prog[ch][0], 1.0, 1700, 0.15, 0.6), g.bar(2, half), 0.9)
    for s in range(16):
        f = hz("E2") if s >= 8 else hz("D2")
        add(mus, bass(f, 0.11), g.bar(2, s * 0.25), 0.5 + 0.02 * s)
    add(mus, riser(2.0), g.bar(2), 0.9)
    for s in range(12):
        add(mus, snap(), g.bar(2, 1 + s * (0.25 if s < 8 else 0.125)), 0.18 + 0.04 * s)
    # Groove (drop at 6.9): Am F C G | Am F C | G breakdown.
    groove = ["Am", "F", "C", "G", "Am", "F", "C"]
    for i, ch in enumerate(groove):
        k = 3 + i
        add(pads, pad(prog[ch][0], 2.0, 2200, 0.08, 0.8), g.bar(k), 0.75)
        root = hz(prog[ch][1])
        for s in range(8):
            if s in (0, 3, 4, 6, 7):
                add(mus, bass(root * (2 if s % 4 == 3 else 1), 0.22), g.bar(k, s * 0.5), 0.75)
        tones = [hz(n) * 2 for n in prog[ch][0]]
        order = [0, 1, 2, 3, 2, 1, 2, 3, 0, 2, 1, 3, 2, 1, 3, 2]
        for s in range(16):
            add(arps, pluck(tones[order[s]], 0.12, 3600, 9), g.bar(k, s * 0.25), 0.22, 0.35 if s % 2 else -0.35)
    drums(mus, g, range(3, 10), {"kick": [0, 1, 2, 3], "clap": [1, 3], "hat": [0.5, 1.5, 2.5, 3.5], "shaker": [x * 0.25 for x in range(16)]}, hits)
    # Bell accents on the three screens (chat / workflow / ROI open on downbeats).
    for t, nt in ((g.bar(5), "E5"), (g.bar(7), "G5"), (g.bar(9), "C6")):
        add(arps, bell(hz(nt), 1.8), t, 0.35)
    # Breakdown + build into the signature.
    add(pads, pad(prog["G"][0], 2.0, 1200, 0.3, 0.8), g.bar(10), 0.8)
    add(mus, bass(hz("G1"), 1.9, "sub"), g.bar(10), 0.5)
    add(mus, riser(2.0, 8000), g.bar(10), 1.1)
    for s in range(8):
        add(mus, kick(0.5, 0.5), g.bar(10, s * 0.5), 0.25 + 0.06 * s)
    # Signature: impact + Cmaj9 bloom held to the end.
    add(mus, impact(), g.bar(11), 0.9)
    add(pads, pad(["C3", "G3", "B3", "D4", "E4"], 2.6, 2600, 0.02, 1.4), g.bar(11), 1.1)
    add(mus, bass(hz("C2"), 2.6, "sub"), g.bar(11), 0.6)
    for i, nt in enumerate(["G5", "E5", "D6", "B5", "G6"]):
        add(arps, bell(hz(nt), 2.0, 2.0, 1.4, 2.4), g.bar(11, 1 + i * 0.75), 0.22, -0.4 + 0.2 * i)

    pads = highpass(pads, 170)
    pads = duck(pads, [h for h in hits if h >= g.bar(3)], 0.35)
    arps = duck(delay(arps, g.b * 0.75, 0.32, 0.22), [h for h in hits if h >= g.bar(3)], 0.25)
    mix = mus + pads * 0.9 + arps
    mix = reverb(mix, IR_HALL, 0.16)
    mix = fade(mix, 0.0, 0.5, True)
    mix = fade(mix, 25.0, 26.0, False)
    return master(mix[: int(L * SR)])


# ── Score: La boutique 24/7 (27 s) ──────────────────────────────────────────
def score_chatbot(L=27.0):
    g = Grid(1.15)  # downbeats: 1.15 3.15(open) 5.15 7.15 … 13.15(dusk) 15.15(lamps) 17.15 … 23.15(impact)
    mus = buf(L)
    pads = buf(L)
    keys = buf(L)
    hits = []
    C = {
        "Dm9": (["D3", "F3", "A3", "C4", "E4"], "D2"),
        "Bb": (["Bb2", "D3", "F3", "A3"], "Bb1"),
        "F": (["F3", "A3", "C4", "E4"], "F1"),
        "Am": (["A2", "C3", "E3", "G3"], "A1"),
        "C": (["C3", "E3", "G3", "D4"], "C2"),
        "F9": (["F3", "C4", "E4", "G4", "A4"], "F1"),
    }
    penta = ["F4", "G4", "A4", "C5", "D5", "F5", "G5", "A5"]
    # Night intro: the chatbot wakes up (three notes on the blink).
    add(pads, pad(C["Dm9"][0], 1.2, 800, 1.0, 1.4), 0.0, 0.85)
    for i, nt in enumerate(["A4", "C5", "F5"]):
        add(keys, kalimba(hz(nt)), 0.32 + i * 0.16, 0.4, -0.2 + 0.2 * i)
    # Dawn: brightening pad.
    dawn = pad(C["Bb"][0], 2.0, 2400, 0.8, 1.2)
    add(pads, sweep_lowpass(dawn, lambda s: 500 + 2600 * min(1, s / 2.2)), g.bar(0), 0.6)
    add(mus, bass(hz("Bb1") * 2, 1.9, "sub"), g.bar(0), 0.22)
    # Day (bars 1–5): F Am Bb C F.
    day = ["F", "Am", "Bb", "C", "F"]
    hook = [[0, 2, 4, 3], [2, 4, 5, 4], [3, 2, 1, 2], [4, 5, 7, 6], [5, 4, 2, 0]]
    for i, ch in enumerate(day):
        k = 1 + i
        add(pads, pad(C[ch][0], 2.0, 3000, 0.25, 0.9), g.bar(k), 0.7)
        root = hz(C[ch][1])
        for s, b in enumerate((0, 1.5, 2, 3, 3.5)):
            add(mus, bass(root * (2 if s == 3 else 1), 0.3), g.bar(k, b), 0.7 if k > 1 else 0.45)
        for j, idx in enumerate(hook[i]):
            add(keys, kalimba(hz(penta[idx])), g.bar(k, j * 1.0 + (0.5 if j % 2 else 0)), 0.42, 0.3 if j % 2 else -0.3)
        tones = [hz(n) * 2 for n in C[ch][0]]
        for s in range(8):
            add(keys, pluck(tones[(s * 2) % len(tones)], 0.1, 3200, 10), g.bar(k, s * 0.5 + 0.25), 0.12, 0.45 if s % 2 else -0.45)
    drums(mus, g, [1], {"shaker": [x * 0.5 for x in range(8)], "kick": [0, 2]}, hits, 0.7)
    drums(mus, g, range(2, 6), {"kick": [0, 1, 2, 3], "snap": [1, 3], "hat": [0.5, 1.5, 2.5, 3.5], "shaker": [x * 0.25 for x in range(16)]}, hits, 0.85)
    # Answer burst (six beams at 6.15) — a bright chord stab.
    for i, nt in enumerate(["F5", "A5", "C6"]):
        add(keys, bell(hz(nt), 1.4, 2.0, 1.6, 3.2), 6.15, 0.18, -0.3 + 0.3 * i)
    # Dusk (bars 6–7): Dm → Bb, the whole bed filters down, groove thins out.
    for i, ch in enumerate(["Dm9", "Bb"]):
        k = 6 + i
        add(pads, pad(C[ch][0], 2.0, 2200, 0.4, 1.0), g.bar(k), 0.8)
        add(mus, bass(hz(C[ch][1]), 1.9, "sub"), g.bar(k), 0.55)
        tones = [hz(n) * 2 for n in C[ch][0]]
        for s in range(8):
            add(keys, kalimba(tones[(s * 3) % len(tones)], 0.8), g.bar(k, s * 0.5), 0.2, 0.4 if s % 2 else -0.4)
    drums(mus, g, [6], {"kick": [0, 1, 2, 3], "snap": [1, 3], "shaker": [x * 0.5 for x in range(8)]}, hits, 0.7)
    drums(mus, g, [7], {"kick": [0, 2.5], "snap": [2]}, hits, 0.6)
    # Night (bars 8–10): Dm9 Bb F — e-piano, sub, half-time drums, delayed kalimba recall.
    for i, ch in enumerate(["Dm9", "Bb", "F"]):
        k = 8 + i
        add(pads, pad(C[ch][0], 2.0, 1300, 0.6, 1.2), g.bar(k), 0.45)
        add(keys, epiano(C[ch][0], 1.9), g.bar(k), 0.36)
        add(keys, epiano(C[ch][0][1:], 0.9), g.bar(k, 2.5), 0.2)
        add(mus, bass(hz(C[ch][1]), 1.0, "sub"), g.bar(k), 0.5)
        add(mus, bass(hz(C[ch][1]), 0.8, "sub"), g.bar(k, 2.5), 0.4)
        for j, idx in enumerate(hook[i % len(hook)]):
            add(keys, kalimba(hz(penta[idx])), g.bar(k, 0.5 + j * 0.75), 0.28, 0.25 if j % 2 else -0.25)
    drums(mus, g, range(8, 11), {"kick": [0, 2.5], "snap": [2], "hat": [0.5, 1.5, 2.5, 3.5]}, hits, 0.55)
    # Build into the signature, a breath, then impact + Fmaj9 bloom.
    add(mus, riser(1.95, 7000), g.bar(10, 0.1), 0.9)
    for s in range(8):
        add(mus, snap(), g.bar(10, 2 + s * 0.25), 0.15 + 0.05 * s)
    add(mus, impact(), g.bar(11), 0.85)
    add(pads, pad(C["F9"][0], 3.0, 2800, 0.02, 1.6), g.bar(11), 1.1)
    add(mus, bass(hz("F1"), 3.0, "sub"), g.bar(11), 0.6)
    for i, nt in enumerate(["C6", "A5", "G5", "F5"]):
        add(keys, bell(hz(nt), 2.0, 2.0, 1.3, 2.2), g.bar(11, 0.9 + i * 0.6), 0.2, 0.4 - 0.25 * i)

    # Dusk/night colour: the day stems close their filters across the sunset.
    def dusk_cut(s):
        if s < 13.15:
            return 16000
        if s < 16.2:
            return 16000 * (1 - (s - 13.15) / 3.05) ** 2 + 2200
        return 2200 if s < 23.1 else 12000

    keys = highpass(sweep_lowpass(delay(keys, g.b * 0.75, 0.38, 0.28), dusk_cut), 120)
    pads = highpass(pads, 170)
    pads = duck(pads, [h for h in hits if g.bar(2) <= h < g.bar(7)], 0.3)
    mix = mus + pads * 0.85 + keys
    mix = reverb(mix, IR_HALL, 0.2)
    mix = fade(mix, 0.0, 0.6, True)
    mix = fade(mix, 26.1, 27.0, False)
    return master(mix[: int(L * SR)])


def main():
    film, project = sys.argv[1], Path(sys.argv[2])
    if film == "ville":
        L = 26.0
        music = score_ville(L)
    else:
        L = 27.0
        music = score_chatbot(L)
    write_wav(project / "audio" / "music.wav", music)
    sfx = build_sfx(project, L)
    write_wav(project / "audio" / "sfx.wav", sfx)
    import subprocess

    for stem in ("music", "sfx"):
        src = project / "audio" / f"{stem}.wav"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-c:a", "aac", "-b:a", "256k", str(src.with_suffix(".m4a"))], check=True)
    mix = music[: len(sfx)] + sfx
    for name, x in (("music", music), ("sfx", sfx), ("mix", mix)):
        rms = 20 * np.log10(np.sqrt(np.mean(x**2)) + 1e-12)
        print(f"{name}: rms {rms:.1f} dBFS  peak {np.abs(x).max():.2f}")


if __name__ == "__main__":
    main()
