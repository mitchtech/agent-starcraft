"""Write the nine-row web pet atlas from the active sprite sheet and record its hash. Requires requirements-dev.txt."""

import argparse
import hashlib
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent


def export(pet_id="scv"):
    SHEET = ROOT / "pets" / pet_id / "spritesheet.webp"
    EXPORT = ROOT / "assets" / "exports" / f"agent-starcraft-{pet_id}-pet-web.webp"
    REVISION = ROOT / "assets" / f"{pet_id}-pet-revision.json"
    if not SHEET.exists():
        print(f"{pet_id} pet art not bundled; skipping the web atlas")
        return
    with Image.open(SHEET) as source:
        # The web format keeps the nine animation rows and drops the two look-direction rows.
        web = source.convert("RGBA").crop((0, 0, 1536, 1872))
    EXPORT.parent.mkdir(parents=True, exist_ok=True)
    web.save(EXPORT, lossless=True, quality=100, method=6, exact=True)
    revision = json.loads(REVISION.read_text(encoding="utf-8"))
    revision["web"] = {"file": EXPORT.relative_to(ROOT).as_posix(), "sha256": hashlib.sha256(EXPORT.read_bytes()).hexdigest()}
    REVISION.write_text(json.dumps(revision, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {EXPORT.relative_to(ROOT)} ({EXPORT.stat().st_size} bytes)")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--pet", choices=["scv", "probe"])
    args = parser.parse_args()
    for pet_id in [args.pet] if args.pet else ["scv", "probe"]:
        export(pet_id)
