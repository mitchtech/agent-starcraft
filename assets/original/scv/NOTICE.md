# SCV pet artwork

This artwork depicts a StarCraft II-era Terran SCV. Michael J. Mitchell
requested it on October 23, 2026, and created it with Codex using built-in
image generation, completing validation on October 24, 2026. A canonical
character image grounded the animation and look-direction strips.
Deterministic processing extracted, registered, assembled, cleaned, and
validated the generated pixels. No sprites, portraits, or models were
extracted from Blizzard games.

StarCraft, the SCV, and the Terran belong to Blizzard Entertainment. This
project is not affiliated with or endorsed by Blizzard. Game audio has a
separate [rights notice](../../../audio/NOTICE.md).

The contributor's rights in this artwork are licensed under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), as described in
[LICENSE.txt](LICENSE.txt). Suggested credit: "SCV pet artwork by Michael
J. Mitchell / mitchtech, CC BY 4.0, https://github.com/mitchtech/agent-starcraft."

## Format and validation

- ID: `scv`; display name: `SCV`; sprite version: `2`.
- Transparent RGBA WebP, 1536 x 2288 pixels, with 192 x 208 cells.
- Nine animation rows: idle, moving right, moving left, waving, jumping,
  failure, waiting, working, and review.
- Two look rows: sixteen clockwise directions, beginning at up.
- 73 occupied cells and 15 fully transparent unused cells.

The final PNG passed structural, chroma, jump, registration, and visual
direction checks. Three isolated reviewers confirmed all cardinal gaze axes;
near-vertical intermediate yaw cues received labeled sequence review.
The active WebP preserves every decoded RGBA pixel from that PNG; encoding
adds no artwork, neutral cell, or animation frame. Native local host rendering
remains unverified.

## Source and active files

The original PNG, local host manifest, license, and provenance are preserved
in `assets/original/scv`. Account-pet identifiers and temporary upload links
are excluded from distribution. `assets/scv-pet-revision.json` records the
source, active, and web-export hashes.

| File | SHA-256 |
|---|---|
| Original PNG | `f2aeb18c5be84898ac546d8ece0bc3473a61307954fa5b445782780e04a7c36e` |
| Active WebP | `12d24983929fef6ff0139a103fbf66de5d2950d8e36a60ac728b37a28fc4a967` |

The WebP was encoded with Pillow using `lossless=True`, `quality=100`,
`method=6`, and `exact=True`. Decoded pixels and transparent RGB were checked
after encoding.
