"""Derive preview artifacts from the committed clips and any bundled pet atlas; never change source audio or art."""

import sys
import tempfile
import wave
from array import array
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont, ImageSequence

ROOT = Path(__file__).resolve().parent.parent
AUDIO = ROOT / "audio"
PREVIEWS = ROOT / "assets" / "previews"
FONTS = ROOT / "site" / "fonts"
PETS = ["scv", "probe"]
# (preview name, atlas row, frame count), matching Codex's v2 row order.
PET_STATES = [("idle", 0, 6), ("working", 7, 6), ("waiting", 6, 6), ("review", 8, 6), ("failure", 5, 8)]
# --check renders elsewhere and compares pixels: PNG bytes vary with each platform's zlib.
CHECK = "--check" in sys.argv[1:]
OUT = Path(tempfile.mkdtemp()) if CHECK else PREVIEWS
OUT.mkdir(parents=True, exist_ok=True)
# The Terran night and day palettes from site/styles.css.
NIGHT = {"bg": (14, 18, 22), "grid": (30, 38, 46), "ink": (225, 232, 238), "muted": (158, 171, 183), "em": (255, 194, 61), "line": (58, 70, 82)}
DAY = {"bg": (230, 232, 234), "grid": (208, 213, 218), "ink": (27, 34, 41), "muted": (71, 83, 95), "em": (138, 75, 0), "line": (154, 164, 174)}
MONITOR = (5, 8, 10)
AMBER = (242, 169, 0)
GREEN = (70, 224, 122)
PSIONIC = (79, 211, 255)
MINERAL = (79, 179, 255)
GAS = (61, 220, 132)
HEADLINE_CLIPS = [
    ("terran-scv-good-to-go", "SCV good to go, sir."),
    ("terran-scv-jobs-finished", "Job's finished."),
    ("terran-adjutant-not-enough-minerals", "Not enough minerals."),
    ("terran-adjutant-nuclear-launch", "Nuclear launch detected."),
    ("protoss-advisor-construct-pylons", "Construct additional pylons!"),
    ("protoss-zealot-my-life-for-aiur", "My life for Aiur!"),
]
DISPLAY = "oxanium-latin-700-normal.woff2"
BODY = "exo-2-latin-400-normal.woff2"
BOLD = "exo-2-latin-700-normal.woff2"
MONO = "share-tech-mono-latin-400-normal.woff2"


def font(name, size):
    return ImageFont.truetype(str(FONTS / name), size, layout_engine=ImageFont.Layout.BASIC)


def peaks(clip, columns):
    with wave.open(str(AUDIO / f"{clip}.wav")) as audio:
        samples = array("h", audio.readframes(audio.getnframes()))
    if sys.byteorder == "big":
        samples.byteswap()
    step = max(1, len(samples) // columns)
    values = [max((abs(value) for value in samples[i * step:(i + 1) * step]), default=0) / 32768 for i in range(columns)]
    top = max(values) or 1
    return [value / top for value in values]


def plating(width, height, palette=NIGHT):
    """Hull plating: the page background with its 48 px grid and a soft amber glow in the corner."""
    canvas = Image.new("RGBA", (width, height), palette["bg"] + (255,))
    draw = ImageDraw.Draw(canvas)
    for x in range(0, width, 48):
        draw.line((x, 0, x, height), fill=palette["grid"])
    for y in range(0, height, 48):
        draw.line((0, y, width, y), fill=palette["grid"])
    glow = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    ImageDraw.Draw(glow).ellipse((-width * 0.3, -height * 0.6, width * 0.5, height * 0.5), fill=AMBER + (34,))
    canvas.alpha_composite(glow.filter(ImageFilter.GaussianBlur(min(width, height) // 4)))
    return canvas


def bevel(draw, box, palette=NIGHT, cut=14):
    """A plated frame with clipped corners, as on the site's portrait panel."""
    left, top, right, bottom = box
    outline = [(left + cut, top), (right, top), (right, bottom - cut), (right - cut, bottom), (left, bottom), (left, top + cut)]
    draw.polygon(outline, fill=palette["line"])
    inset = [(x + (2 if x == left else -2 if x == right else 0), y + (2 if y == top else -2 if y == bottom else 0)) for x, y in outline]
    draw.polygon(inset, fill=MONITOR)


def monitor(size, clip, reveal=1.0, color=GREEN):
    """The dark unit monitor: scanlines, static, and the clip's waveform swept in up to `reveal`."""
    width, height = size
    canvas = Image.new("RGBA", size, MONITOR + (255,))
    draw = ImageDraw.Draw(canvas)
    seed = 7
    for _ in range(width * height // 260):
        seed = (seed * 1103515245 + 12345) & 0x7FFFFFFF
        x, y = seed % width, (seed >> 11) % height
        draw.point((x, y), fill=(60, 70, 76, 255))
    middle = height // 2
    columns = max(2, (width - 12) // 3)
    values = peaks(clip, columns)
    shown = int(columns * reveal)
    trace = Image.new("RGBA", size, (0, 0, 0, 0))
    lines = ImageDraw.Draw(trace)
    for index in range(columns):
        x = 6 + index * (width - 12) / columns
        if index < shown:
            amplitude = max(1, values[index] * height * 0.38)
            lines.line((x, middle - amplitude, x, middle + amplitude), fill=color + (255,), width=2)
        else:
            lines.line((x, middle, x + 3, middle), fill=color + (90,), width=1)
    canvas.alpha_composite(trace.filter(ImageFilter.GaussianBlur(4)))
    canvas.alpha_composite(trace)
    scan = Image.new("RGBA", size, (0, 0, 0, 0))
    scan_draw = ImageDraw.Draw(scan)
    for y in range(0, height, 3):
        scan_draw.line((0, y, width, y), fill=(0, 0, 0, 70))
    canvas.alpha_composite(scan)
    return canvas


def framed_monitor(canvas, box, clip, color=GREEN, palette=NIGHT):
    left, top, right, bottom = box
    draw = ImageDraw.Draw(canvas, "RGBA")
    bevel(draw, (left - 6, top - 6, right + 6, bottom + 6), palette)
    draw.rectangle((left - 3, top - 3, right + 3, bottom + 3), outline=AMBER, width=3)
    canvas.alpha_composite(monitor((right - left, bottom - top), clip, color=color), (left, top))


def headline(canvas, xy, size, limit, palette=NIGHT, words=("JOB'S", "FINISHED.")):
    draw = ImageDraw.Draw(canvas, "RGBA")
    x, y = xy
    first, second = words
    # Shrink to fit beside the monitor rather than running under it.
    while draw.textlength(f"{first} {second}", font=font(DISPLAY, size)) > limit:
        size -= 2
    display = font(DISPLAY, size)
    draw.text((x, y), first, font=display, fill=palette["ink"])
    offset = x + draw.textlength(f"{first} ", font=display)
    if palette is NIGHT:
        layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
        ImageDraw.Draw(layer).text((offset, y), second, font=display, fill=palette["em"] + (140,))
        canvas.alpha_composite(layer.filter(ImageFilter.GaussianBlur(12)))
    draw.text((offset, y), second, font=display, fill=palette["em"])


def eyebrow(canvas, xy, size, palette=NIGHT):
    draw = ImageDraw.Draw(canvas, "RGBA")
    x, y = xy
    draw.line((x, y + size // 2, x + 30, y + size // 2), fill=palette["em"], width=2)
    label = font(BOLD, size)
    for character in "AGENT STARCRAFT":
        draw.text((x + 44, y), character, font=label, fill=palette["em"])
        x += draw.textlength(character, font=label) + 5


def resources(canvas, xy):
    draw = ImageDraw.Draw(canvas, "RGBA")
    x, y = xy
    label = font(MONO, 26)
    for shape, color, value in (("mineral", MINERAL, "400"), ("gas", GAS, "0"), ("supply", (199, 206, 214), "11/16")):
        width = 56 + draw.textlength(value, font=label)
        draw.rectangle((x, y, x + width, y + 40), fill=MONITOR, outline=NIGHT["line"], width=2)
        if shape == "mineral":
            draw.polygon([(x + 21, y + 9), (x + 30, y + 18), (x + 26, y + 32), (x + 16, y + 32), (x + 12, y + 18)], fill=color)
        elif shape == "gas":
            draw.ellipse((x + 13, y + 15, x + 29, y + 31), fill=color)
            draw.polygon([(x + 21, y + 7), (x + 28, y + 20), (x + 14, y + 20)], fill=color)
        else:
            draw.polygon([(x + 12, y + 31), (x + 12, y + 19), (x + 21, y + 12), (x + 30, y + 19), (x + 30, y + 31)], fill=color)
        draw.text((x + 40, y + 6), value, font=label, fill=GREEN)
        x += width + 10


def crystal(draw, cx, top, height, edge=(6, 34, 61)):
    """The site's mineral crystal sigil, drawn as a polygon."""
    w = height * 0.29
    points = [(cx, top), (cx + w, top + height * 0.3), (cx + w * 0.5, top + height), (cx - w * 0.5, top + height), (cx - w, top + height * 0.3)]
    draw.polygon(points, fill=MINERAL, outline=edge, width=max(2, round(height / 24)))
    draw.line((cx, top, cx - w * 0.3, top + height * 0.32, cx, top + height), fill=edge, width=max(1, round(height / 40)))
    draw.line((cx, top, cx + w * 0.3, top + height * 0.32, cx, top + height), fill=edge, width=max(1, round(height / 40)))


# Pet previews appear automatically once a pet's art is bundled; the stubs ship without them.
for pet_id in PETS:
    sheet_path = ROOT / "pets" / pet_id / "spritesheet.webp"
    if not sheet_path.exists():
        continue
    sheet = Image.open(sheet_path).convert("RGBA")
    for name, row, count in PET_STATES:
        frames = []
        for column in range(count):
            canvas = plating(288, 288)
            bevel(ImageDraw.Draw(canvas), (8, 8, 280, 280))
            sprite = sheet.crop((column * 192, row * 208, (column + 1) * 192, (row + 1) * 208))
            canvas.alpha_composite(sprite, ((288 - 192) // 2, 288 - 208 - 24))
            frames.append(canvas.convert("RGB"))
        frames[0].save(OUT / f"{pet_id}-{name}.gif", save_all=True, append_images=frames[1:], duration=160, loop=0, disposal=2)

# Waveform previews: a sweep that reveals each clip, then holds.
label_font = font(BOLD, 18)
for clip, line in HEADLINE_CLIPS:
    color = PSIONIC if clip.startswith("protoss-") else GREEN
    frames = []
    steps = 14
    for step in range(steps + 1):
        canvas = plating(288, 200)
        draw = ImageDraw.Draw(canvas)
        bevel(draw, (8, 8, 280, 160))
        canvas.alpha_composite(monitor((260, 140), clip, reveal=step / steps, color=color), (14, 14))
        width = draw.textlength(line.upper(), font=label_font)
        draw.text(((288 - width) / 2, 168), line.upper(), font=label_font, fill=NIGHT["em"] if step == steps else NIGHT["muted"])
        frames.append(canvas.convert("RGB"))
    durations = [70] * steps + [1600]
    frames[0].save(OUT / f"{clip}.gif", save_all=True, append_images=frames[1:], duration=durations, loop=0, disposal=2)

# Fonts are the site's self-hosted OFL faces, so the cards match the page on every OS.
card = plating(1200, 630)
draw = ImageDraw.Draw(card, "RGBA")
eyebrow(card, (88, 92), 22)
headline(card, (82, 136), 118, 560)
draw.text((90, 300), "Your coding agent,", font=font(DISPLAY, 40), fill=NIGHT["ink"])
draw.text((90, 350), "reporting for duty.", font=font(DISPLAY, 40), fill=NIGHT["ink"])
for row, text in enumerate(["StarCraft sound cues for", "Claude Code, Codex, and Gemini CLI"]):
    draw.text((90, 466 + row * 38), text, font=font(BODY, 30), fill=NIGHT["muted"])
resources(card, (700, 92))
framed_monitor(card, (690, 172, 1110, 476), "terran-scv-jobs-finished")
draw.text((690, 506), "TERRAN + PROTOSS", font=font(BOLD, 26), fill=AMBER)
card.convert("RGB").save(OUT / "social.png")

# The README hero swaps between these with prefers-color-scheme.
for palette, name in ((NIGHT, "banner.png"), (DAY, "banner-light.png")):
    banner = plating(1280, 440, palette)
    draw = ImageDraw.Draw(banner, "RGBA")
    eyebrow(banner, (92, 80), 22, palette)
    headline(banner, (86, 118), 128, 620, palette)
    draw.text((94, 296), "Terran and Protoss sound cues", font=font(BODY, 32), fill=palette["muted"])
    draw.text((94, 340), "for coding agents.", font=font(BODY, 32), fill=palette["muted"])
    framed_monitor(banner, (770, 80, 1190, 360), "terran-scv-jobs-finished", palette=palette)
    banner.convert("RGB").save(OUT / name)

touch = Image.new("RGBA", (180, 180), NIGHT["bg"] + (255,))
draw = ImageDraw.Draw(touch, "RGBA")
draw.rounded_rectangle((6, 6, 173, 173), radius=18, fill=MONITOR + (255,), outline=AMBER, width=4)
crystal(draw, 90, 26, 128)
touch.convert("RGB").save(OUT / "touch-icon.png")

# The plugin listing icon: the validator asks for a square PNG of at least 512 px.
icon = Image.new("RGBA", (512, 512), NIGHT["bg"] + (255,))
draw = ImageDraw.Draw(icon, "RGBA")
draw.rounded_rectangle((16, 16, 495, 495), radius=52, fill=MONITOR + (255,), outline=AMBER, width=12)
crystal(draw, 256, 74, 364)
icon.convert("RGB").save(OUT / "icon.png")


def frames_of(path):
    with Image.open(path) as image:
        return [(item.convert("RGBA"), item.info.get("duration")) for item in ImageSequence.Iterator(image)]


if CHECK:
    stale = []
    for built in sorted(OUT.iterdir()):
        committed = PREVIEWS / built.name
        if not committed.exists():
            stale.append(built.name)
            continue
        expected, actual = frames_of(committed), frames_of(built)
        if len(expected) != len(actual) or any(a[1] != b[1] or ImageChops.difference(a[0], b[0]).getbbox(alpha_only=False) for a, b in zip(expected, actual)):
            stale.append(built.name)
    if stale:
        sys.exit(f"Preview assets are stale; run python3 scripts/build-assets.py: {', '.join(stale)}")
    print("Preview assets match the current clips and fonts")
else:
    print(f"Built preview assets in {OUT}")
