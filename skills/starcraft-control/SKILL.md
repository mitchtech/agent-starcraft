---
name: starcraft-control
disable-model-invocation: false
description: >-
  Inspect and control Agent StarCraft Terran and Protoss sound notifications without changing pet selection.
  TRIGGER when: the user says "mute the SCV", "unmute the SCV", "mute the probe",
  "mute the adjutant", "stop the advisor", "SCV status", "Agent StarCraft status",
  "switch to Protoss", "switch to Terran", "Protoss mode", "Terran mode", "random race",
  "use both races", "use both factions", "use the probe", "en taro adun off",
  "turn off prompt sounds", "turn off job's finished", "turn off research complete",
  "enable approval sounds", "StarCraft attention mode", "turn off easter eggs",
  "stop the annoyed lines", "stop the pissed lines", "enable subagent sounds",
  "enable tool failure sounds", "enable compaction sounds", "turn on session end sounds",
  "mineral alarm", "not enough minerals sound", "set a mineral budget", "supply meter",
  "statusline mineral meter", "construct additional pylons", "supply depots required",
  "nuclear launch detected", "preview an SCV sound", "play nuclear launch detected",
  or asks to inspect or adjust Agent StarCraft notifications.
  DO NOT TRIGGER when: the user wants operating system volume controls, unrelated
  notification settings, Agent Navi controls (use navi-control), Agent Johnny 5
  controls (use johnny5-control), Agent Warcraft controls (use warcraft-control),
  Agent Rocky controls (use rocky-control), Agent Star Wars controls (use
  starwars-control), pet artwork, or pet selection through the host picker.
---

# Agent StarCraft sound controls

Resolve this installed SKILL.md's directory. The bundled CLI is
`../../scripts/starcraft.mjs` relative to it. Run it with Node and a quoted absolute
path, rather than assuming a global `agent-starcraft` executable is installed.

- Inspect: `status`, `status --json`, `list`, or `config --effective`.
- Mute/unmute: `mute EVENT|easter-egg|all` or `unmute EVENT|easter-egg|all`.
- Faction: `faction terran`, `faction protoss`, `faction both`, or `faction random`.
- Presets: `preset attention` or `preset default`.
- Requested sound preview: `preview CLIP`.

Use `list` to resolve supported event and clip names. Translate a clear request
into the corresponding event:

| Request | Event |
|---|---|
| Prompt sounds ("Affirmative", "Thus I serve") | `prompt_submitted` |
| Annoyed lines on rapid prompts ("And still you procrastinate!") | `annoyed` |
| Approval sounds, including the destructive-command alarm | `approval_required` |
| Questions ("Receiving transmission") | `input_required` |
| Idle or ready notices ("Reporting for duty", "I long for combat") | `ready_for_input` |
| "Job's finished" / "Research complete" | `turn_completed` |
| Rate limit, billing, or budget exhausted ("Not enough minerals") | `out_of_minerals` |
| Status-line low-minerals warning ("Not enough energy") | `minerals_low` |
| Output token limit ("Insufficient vespene gas") | `out_of_gas` |
| Context window nearly full ("You must construct additional pylons!") | `supply_blocked` |
| Other API errors | `error` |
| Failed tool calls ("I can't build there") | `tool_failed` |
| Subagents starting ("You want a piece of me, boy?") | `subagent_started` |
| Compaction ("The merging is complete") | `context_compacting` |
| Session end | `session_ended` |
| Rare lines ("Power overwhelming", "In the pipe, five by five") | `easter-egg` |

Terran is the SCV, marine, battlecruiser, and adjutant; Protoss is the zealot,
carrier, dragoon, templar, and advisor. "Use the probe" means `faction protoss`.
`random` picks one race per session and keeps it, like a Random player. The
destructive alarm ("Nuclear launch detected.") is part of `approval_required`; it
cannot be muted separately without muting approvals. Ask only when the requested
event is unclear.

The minerals and supply meters are a status-line command, not a hook. When asked
to set them up or to set a budget, explain the `minerals.budgetUsd`,
`minerals.lowPercent`, and `supply.lowPercent` settings in the config file and the
`statusline` command documented in `docs/minerals.md`, and show the user the line
to add. Do not edit the host's settings or status line yourself.

Change preferences only when the user requests that change. Inspection and
troubleshooting do not imply muting, unmuting, switching factions, applying a
preset, or playing audio. Always specify an event or explicit `all`. Global
mute/unmute preserves event preferences. Presets change event enablement and
preserve clips, faction, and global mute.

Changes persist outside plugin caches and take effect on the next hook. Report
the resulting status. If `AGENT_STARCRAFT_MUTE` overrides the saved preference, explain
that the user must change it in the agent's launch environment. Do not modify
shell startup files or host configuration automatically.

Pet installation and selection are independent. These controls never change
pets, register hooks, or approve agent actions.
