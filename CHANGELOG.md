# Changelog

## 0.2.0 - 2026-11-07

Meet the SCV: a native custom pet for Codex desktop and Codex CLI.

- Bundle the SCV v2 pet with nine animations and sixteen look directions, preserve the original PNG in `assets/original/scv`, and record lossless WebP provenance and artwork licensing (CC BY 4.0). Releases now attach `agent-starcraft-scv-pet.zip` and the nine-row `agent-starcraft-scv-pet-web.webp`.
- Showcase the pet on the site: the Terran hero monitor shows the SCV acting out each cue, with the waveform along its feet, and a pet section plays every animation and look direction, with ZIP, CLI, and web-atlas install paths. The Protoss portrait keeps its emblem and the Probe slot shows its art as pending.
- The site reads which pets have art from a `pets/index.json` written by `scripts/build-site.mjs`, so Probe art will appear without code changes.
- Add SCV animation GIFs to the README, put the SCV on the banners, social card, touch icon, and plugin icon, and add a captioned `pet-preview.mp4`.

## 0.1.1 - 2026-10-28

Structured data for the site and notes on how each line was chosen.

- Add schema.org `SoftwareApplication` structured data to the site, matching Agent Johnny 5.
- Add [sound notes](docs/sounds.md): why each event plays its lines, alternatives that fit, and how to change or add a clip.

## 0.1.0 - 2026-10-24

StarCraft sound cues for coding agents: Job's finished, not enough minerals, and nuclear launch detected. Built on the Agent Warcraft v0.3.0 runtime.

- Play 81 original *StarCraft* and *Brood War* lines (two Protoss lines from *StarCraft II*) for Claude Code, Codex, and Gemini CLI, plus a generic `play` interface for other agents.
- Choose a faction: Terran (SCV, marine, battlecruiser, adjutant; the default), Protoss (zealot, carrier, dragoon, templar, advisor), `both`, or `random`, which keeps one race per session. Every default cue has lines for both factions.
- Sound "Nuclear launch detected." instead of the ordinary approval cue when an approval is for a destructive command, without blocking, logging, or storing it.
- Map Claude Code `StopFailure` errors to resource alarms: rate limits, billing errors, and accounts on hold play `out_of_minerals` ("Not enough minerals."); the output token limit plays `out_of_gas` ("Insufficient vespene gas.").
- Add `agent-starcraft statusline`, a status-line command with a minerals meter (your tightest usage limit or a dollar budget) and a supply meter (your context window against the 200 cap). Each cues once per session as it rises: `minerals_low`, `out_of_minerals`, and `supply_blocked` ("You must construct additional pylons!").
- Turn the third prompt inside ten seconds into an `annoyed` cue ("And still you procrastinate!"), as when a StarCraft unit is clicked repeatedly.
- Add off-by-default `subagent_started`, `tool_failed`, `context_compacting`, `session_ended`, and `error` cues, and rare easter eggs ("Power overwhelming.").
- Record every clip's source and processing in `audio/sources.json`, rebuildable with `scripts/build-audio.py`, and verify the committed audio offline in CI.
- Reserve manifest-only Codex pet slots for the SCV and the Probe. `pet install` reports that the art is not bundled and changes nothing; art can land later as a data-only change.
- Publish a site with Terran and Protoss palettes in night and day themes, a live waveform portrait, a hotkey command card, and the full event map.
