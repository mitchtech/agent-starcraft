# Changelog

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
