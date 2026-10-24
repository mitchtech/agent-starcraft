# Codex pets

Agent StarCraft reserves two native Codex pet slots: the **SCV** (Terran, the
default) and the **Probe** (Protoss). In this release both are manifest-only
stubs. The installer, validation, previews, and release packaging are ready;
the artwork is not bundled yet.

## Current behavior

```bash
agent-starcraft pet status          # SCV: not-bundled
agent-starcraft pet status probe    # Probe: not-bundled
agent-starcraft pet install         # explains that the art is not bundled; changes nothing
agent-starcraft doctor --pet probe  # exits 1 until art ships
```

`not-bundled` is a healthy state: `pet status` exits 0 and nothing in
`$CODEX_HOME/pets` (default `~/.codex/pets`) is touched. Codex's native pet
feature can create a pet in the meantime. Sounds work the same with or without
a pet.

## When the art lands

Each pet becomes a standard Codex v2 bundle in `pets/<id>/`:

| File | Purpose |
|---|---|
| `pet.json` | Manifest: `id`, `displayName`, `description`, `spriteVersionNumber: 2`, `spritesheetPath` |
| `spritesheet.webp` | Transparent RGBA atlas, 1536 x 2288: 8 columns x 11 rows of 192 x 208 cells |
| `LICENSE.txt` | License for the artwork |
| `NOTICE.md` | Provenance and credit |

Rows, in order: idle (6 frames), moving right (8), moving left (8), waving (4),
jumping (5), failure (8), waiting (6), working (6), review (6), and two look
rows of 8 frames covering sixteen directions clockwise from up. Unused cells
must be fully transparent with no RGB residue under zero alpha.

`agent-starcraft pet install [scv|probe]` will then copy the bundle into
`$CODEX_HOME/pets/<id>` with an ownership record, keep a backup with
`--replace`, and refuse to remove changed or unmanaged files. It never selects
the pet; refresh the Codex desktop pet picker, or enter `/pets SCV` or
`/pets Probe` in a graphics-capable Codex CLI terminal. Releases will attach
`agent-starcraft-scv-pet.zip` and `agent-starcraft-probe-pet.zip` for
installation without Node.js, plus nine-row web atlases for ChatGPT/Codex web
pet uploads.

The art must be original. No sprites, portraits, or models may be extracted
from Blizzard games. StarCraft, the SCV, and the Probe belong to Blizzard
Entertainment; this project is not affiliated with or endorsed by Blizzard.
