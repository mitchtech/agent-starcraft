"""Build labeled promotional previews from the committed clips, not host recordings."""

import hashlib
import json
import subprocess
import wave
from array import array
from pathlib import Path
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "assets" / "promotion"
OUT.mkdir(parents=True, exist_ok=True)
SIZE, FPS, RATE = 1080, 15, 32000
# The Terran night palette from site/styles.css; the portrait stays a dark monitor.
BG, INK, MUTED, AMBER, LINE = (14, 18, 22), (225, 232, 238), (158, 171, 183), (255, 194, 61), (58, 70, 82)
MONITOR, GREEN, PSIONIC = (5, 8, 10), (70, 224, 122), (79, 211, 255)
FONTS = ROOT / "site" / "fonts"
TITLE = FONTS / "oxanium-latin-700-normal.woff2"
BODY = FONTS / "exo-2-latin-400-normal.woff2"
LABEL = FONTS / "exo-2-latin-700-normal.woff2"


def samples(clip):
    with wave.open(str(ROOT / f"audio/{clip}.wav")) as source:
        assert (source.getframerate(), source.getnchannels(), source.getsampwidth()) == (RATE, 1, 2)
        data = array("h", source.readframes(source.getnframes()))
    if sys.byteorder == "big":
        data.byteswap()
    return data


def little_endian(data):
    copy = array("h", data)
    if sys.byteorder == "big":
        copy.byteswap()
    return copy.tobytes()


def peaks(data, columns):
    step = max(1, len(data) // columns)
    values = [max((abs(v) for v in data[i * step:(i + 1) * step]), default=0) for i in range(columns)]
    top = max(values) or 1
    return [value / top for value in values]


def text(draw, y, content, size=42, color=INK, face=BODY):
    font = ImageFont.truetype(str(face), size)
    for line in content.split("\n"):
        width = draw.textlength(line, font=font)
        if width > 940:
            raise ValueError(f"Caption exceeds safe width: {line}")
        draw.text(((SIZE - width) / 2, y), line, font=font, fill=color)
        y += size * 1.25


def card(title, subtitle, footer, command=None):
    image = Image.new("RGB", (SIZE, SIZE), BG)
    draw = ImageDraw.Draw(image)
    # Hull plating grid and a clipped-corner amber frame, as on the site.
    for step in range(0, SIZE, 48):
        draw.line((step, 0, step, SIZE), fill=(24, 31, 38))
        draw.line((0, step, SIZE, step), fill=(24, 31, 38))
    cut = 28
    corners = [(24 + cut, 24), (SIZE - 25, 24), (SIZE - 25, SIZE - 25 - cut), (SIZE - 25 - cut, SIZE - 25), (24, SIZE - 25), (24, 24 + cut)]
    draw.polygon(corners, outline=AMBER, width=4)
    text(draw, 90, "AGENT STARCRAFT", 30, AMBER, LABEL)
    text(draw, 150, title.upper(), 72, INK, TITLE)
    text(draw, 270, subtitle, 38)
    if command:
        text(draw, 790, command, 34, AMBER, LABEL)
    text(draw, 870, "github.com/mitchtech/agent-starcraft", 34, AMBER, LABEL)
    text(draw, 944, footer, 26, MUTED)
    return image


def scope(values, reveal, color=GREEN):
    """A 720 x 360 unit monitor with the waveform swept in up to `reveal` (0-1)."""
    width, height = 720, 360
    screen = Image.new("RGBA", (width, height), MONITOR + (255,))
    trace = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    lines = ImageDraw.Draw(trace)
    middle = height // 2
    shown = int(len(values) * reveal)
    for index, value in enumerate(values):
        x = 10 + index * (width - 20) / len(values)
        if index < shown:
            amplitude = max(1, value * height * 0.42)
            lines.line((x, middle - amplitude, x, middle + amplitude), fill=color + (255,), width=3)
        else:
            lines.line((x, middle, x + 4, middle), fill=color + (110,), width=2)
    screen.alpha_composite(trace.filter(ImageFilter.GaussianBlur(5)))
    screen.alpha_composite(trace)
    draw = ImageDraw.Draw(screen)
    for y in range(0, height, 3):
        draw.line((0, y, width, y), fill=(0, 0, 0, 60))
    draw.rectangle((0, 0, width - 1, height - 1), outline=AMBER, width=4)
    return screen


# (start, end, title, subtitle, command, cue clip or None)
sound_scenes = [
    (0, 4, "Session started", '"SCV good to go, sir."', None, "terran-scv-good-to-go"),
    (4, 8, "Approval needed", '"Orders, Captain?"', None, "terran-scv-orders-captain"),
    (8, 13, "Destructive command", '"Nuclear launch detected."', "$ git push --force origin main", "terran-adjutant-nuclear-launch"),
    (13, 17, "Turn finished", '"Job\'s finished."', None, "terran-scv-jobs-finished"),
    (17, 22, "Usage limit reached", '"Not enough minerals."', None, "terran-adjutant-not-enough-minerals"),
    (22, 27, "Job's finished.", "Local audio. No telemetry.\nNever approves or blocks anything.", None, None),
]
faction_scenes = [
    (0, 5, "Pick a faction", "Terran by default.\nProtoss, both, or random on request.", "agent-starcraft faction protoss", "protoss-zealot-my-life-for-aiur"),
    (5, 10, "Research complete.", "The same events, voiced by the Protoss.", "agent-starcraft faction protoss", "protoss-advisor-research-complete"),
    (10, 16, "Context nearly full", '"You must construct additional pylons!"', "agent-starcraft statusline", "protoss-advisor-construct-pylons"),
]
CUE_OFFSET = 0.5


def build(name, scenes, footer):
    duration = scenes[-1][1]
    temporary = ROOT / "dist/promotion/render"
    temporary.mkdir(parents=True, exist_ok=True)
    video = temporary / f"{name}.mp4"
    command = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
               "-f", "rawvideo", "-pixel_format", "rgb24", "-video_size", f"{SIZE}x{SIZE}",
               "-framerate", str(FPS), "-i", "pipe:0",
               "-frames:v", str(duration * FPS), "-c:v", "libx264", "-threads", "2",
               "-preset", "fast", "-crf", "26", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(video)]
    cards = [card(scene[2], scene[3], footer, scene[4]) for scene in scenes]
    clips = {scene[5]: samples(scene[5]) for scene in scenes if scene[5]}
    waves = {clip: peaks(data, 180) for clip, data in clips.items()}
    process = subprocess.Popen(command, stdin=subprocess.PIPE)
    try:
        for tick in range(duration * FPS):
            second = tick / FPS
            index = next(i for i, scene in enumerate(scenes) if scene[0] <= second < scene[1])
            start, clip = scenes[index][0], scenes[index][5]
            image = cards[index].copy()
            reveal = min(1.0, max(0.0, (second - start - CUE_OFFSET) / (len(clips[clip]) / RATE))) if clip else 1.0
            if clip:
                # The Protoss trace is psionic blue, as on the site.
                screen = scope(waves[clip], reveal, PSIONIC if clip.startswith("protoss-") else GREEN)
            else:
                screen = scope([0.01] * 180, 1.0)
            image.paste(screen.convert("RGB"), (180, 400))
            process.stdin.write(image.tobytes())
            if tick == FPS * 3:
                image.save(OUT / f"{name}.png")
    finally:
        process.stdin.close()
    if process.wait():
        raise RuntimeError(f"ffmpeg failed for {name}")
    track = bytearray(duration * RATE * 2)
    for scene in scenes:
        start, clip = scene[0], scene[5]
        if clip:
            data = little_endian(clips[clip])
            offset = int((start + CUE_OFFSET) * RATE) * 2
            track[offset:offset + len(data)] = data
    audio = temporary / f"{name}.wav"
    with wave.open(str(audio), "wb") as destination:
        destination.setparams((1, 2, RATE, 0, "NONE", "not compressed"))
        destination.writeframes(bytes(track))
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(video), "-i", str(audio),
                    "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "128k",
                    "-t", str(duration), "-movflags", "+faststart", str(OUT / f"{name}.mp4")], check=True)

    def timestamp(second):
        return f"00:{second // 60:02d}:{second % 60:02d},000"

    subtitles = [f"{index}\n{timestamp(start)} --> {timestamp(end)}\n{title}\n{subtitle}\n{footer}\n"
                 for index, (start, end, title, subtitle, *_) in enumerate(scenes, 1)]
    (OUT / f"{name}.srt").write_text("\n".join(subtitles))
    return sorted(clips)


used = build("sound-preview", sound_scenes, "Illustrated sound preview - not a live host recording")
used += build("faction-preview", faction_scenes, "Configuration preview - event coverage varies by host")
# A pet preview joins these once SCV or Probe art is bundled.
sources = [ROOT / f"audio/{clip}.wav" for clip in sorted(set(used))] + [TITLE, BODY, LABEL]


def record(path):
    return {"path": str(path.relative_to(ROOT)), "bytes": path.stat().st_size,
            "sha256": hashlib.sha256(path.read_bytes()).hexdigest()}


manifest = {
    "kind": "illustrated-previews", "dimensions": [SIZE, SIZE], "fps": FPS,
    "sources": [record(path) for path in sources],
    "artifacts": [record(path) for path in sorted(OUT.iterdir()) if path.suffix in (".mp4", ".png", ".srt")],
    "tools": {"Pillow": __import__("PIL").__version__, "ffmpeg": subprocess.check_output(
        ["ffmpeg", "-version"], text=True).splitlines()[0]},
    "credentials_used": [],
    "limitations": ["Not a live host or physical audio recording.",
                     "No claim of hook execution in these videos.",
                     "Audio is assembled from the bundled, separately noticed StarCraft clips."],
}
(OUT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
print(f"Built two captioned previews in {OUT.relative_to(ROOT)}")
