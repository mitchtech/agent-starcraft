# Probe pet artwork

Michael J. Mitchell requested this StarCraft II-era Protoss Probe on October
23, 2026, and completed the artwork with Codex image generation on October
24, 2026. A canonical character image grounded the animation and direction
strips. No Blizzard game sprites, portraits, or models were extracted.

StarCraft, the Probe, and the Protoss belong to Blizzard Entertainment. This
project is not affiliated with or endorsed by Blizzard. Game audio has a
separate [rights notice](../../../audio/NOTICE.md).

Contributor rights in this artwork are licensed under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), as described in
[LICENSE.txt](LICENSE.txt). Suggested credit: "Probe pet artwork by Michael
J. Mitchell / mitchtech, CC BY 4.0, https://github.com/mitchtech/agent-starcraft."

## Format and validation

The local v2 atlas has nine animation states and sixteen clockwise look
directions, beginning at up. Its 1536 x 2288 transparent RGBA image contains
73 occupied cells and 15 transparent unused cells, each 192 x 208 pixels.
The lossless WebP preserves every decoded pixel from the original PNG.
The nine-row web export omits the look-direction rows.

The saved creation workflow passed structural and server preflight checks.
It stopped before account creation because a scanline quality heuristic
flagged intentional external negative space between the two prongs.
That historical result is not represented as a successful account upload.
Three saved blind reviews confirmed cardinal directions; the shallow
22.5-degree horizontal cue remained ambiguous, and intermediate angular
spacing received reviewed warnings. Those artwork characteristics are
preserved. Native desktop and terminal rendering remain unverified.

The original PNG is preserved in `assets/original/probe/spritesheet.png`.
`assets/probe-pet-revision.json` records source, active, and web-export hashes.
No account IDs or temporary upload links are distributed.
