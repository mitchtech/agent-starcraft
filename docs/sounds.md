# Sound notes

Why each event plays what it plays, what else would fit, and how to change it.
Clip ids and exact lines are in the [README event table](../README.md#sounds);
sources and processing are in the [audio notice](../audio/NOTICE.md).

## Mapping

| Event | Terran | Protoss | Why |
|---|---|---|---|
| `session_started` | SCV "SCV good to go, sir.", Battlecruiser "Battlecruiser operational." | Zealot "My life for Aiur!", Carrier "Carrier has arrived." | Unit-trained lines: a session is a new unit reporting in. |
| `prompt_submitted` | SCV and marine acknowledgments ("Affirmative.", "Rock and roll."), Battlecruiser "Make it happen." | Zealot, templar, carrier, dragoon, and dark templar acknowledgments ("Thus I serve.", "It shall be done.") | Every StarCraft unit answers an order; a prompt is an order. |
| `annoyed` | SCV and marine pissed lines, Battlecruiser "We are getting way behind schedule." | Carrier "And still you procrastinate!", "Command, or you will be relieved.", templar pissed lines | StarCraft invented the escalating click joke. The carrier's lines read as if written for an impatient developer. |
| `approval_required` | SCV "Yes, sir?", "Orders, Captain?" | Carrier "Instructions?", "Your command?", Zealot "Command me." | Selection lines: the unit is waiting for your decision. |
| Approval for shell or edit | SCV "I read you." | High Templar "State thy bidding." | A quieter acknowledgment for the most common approvals. |
| Approval for a destructive command | Adjutant "Nuclear launch detected.", "Base is under attack." | Advisor "Nuclear launch detected.", "We are under attack!" | The most recognizable alarm in the game, for commands you cannot take back. |
| `input_required` | Battlecruiser "Receiving transmission.", Dropship "Input coordinates." | Dragoon "Awaiting instructions." | The agent is asking for information, not permission. "Input coordinates" fits a form. |
| `ready_for_input` | SCV "Reporting for duty." | Zealot "I long for combat.", Dragoon "I am needed.", Dark Templar "I'm waiting." | Idle units asking for work. |
| `turn_completed` | SCV "Job's finished.", Adjutant "Upgrade complete." | Advisor "Research complete.", "Upgrade complete." | Construction and research finishing. The original Probe only beeps, so the advisor speaks for Protoss. |
| `out_of_minerals` | Adjutant "Not enough minerals." | Advisor "You have not enough minerals." | Rate limits and billing errors are spending what you do not have. |
| `minerals_low` | Adjutant "Not enough energy." | Advisor "Not enough energy." | A warning before the hard stop; StarCraft has no "minerals low" line. |
| `out_of_gas` | Adjutant "Insufficient vespene gas." | Advisor "You require more vespene gas." | The second resource, for the second limit (output tokens). |
| `supply_blocked` | Adjutant "Additional supply depots required." | Advisor "You must construct additional pylons!" | The supply cap is a context window: a hard ceiling you hit mid-task and have to plan around. |
| `context_compacting` | Adjutant "Abandoning auxiliary structure." | Archon "The merging is complete." | Compaction discards context (Terran) or fuses it (Protoss). |
| `error` | Adjutant "Landing sequence interrupted.", a marine's death cry | A zealot's death cry | Something failed that is not about usage. Off by default. |
| `tool_failed` | SCV "I can't build there.", "I can't build it. Something's in the way." | The Probe's error chirp | A command that could not run. Off by default. |
| `subagent_started` | Marine "You want a piece of me, boy?", Ghost "Somebody call for an exterminator?", Siege Tank "Ready to roll out!" | Dragoon "I have returned.", Dark Templar "Adun Toridas.", High Templar "Khassar de Templari." | A subagent is a new unit joining the fight. Off by default. |
| `session_ended` | The SCV's death | The Probe's death | Off by default. |
| Easter egg | "Nuclear missile ready.", "That's the stuff.", "In the pipe, five by five." | "En Taro Adun!", "Power overwhelming." | Famous lines that fit no event, played rarely in place of a routine cue. |

## Alternatives that fit

The wiki hosts every original unit's lines; these were considered and are easy
to swap in through configuration once you add the WAVs to a custom audio
directory:

- **Firebat** for `annoyed`: "Got any questions about propane?", "Is something burning?"
- **Medic** for `ready_for_input`: "Need medical attention?", "Where does it hurt?"
- **Science Vessel** for `annoyed`: "Do any of you fools know how to shut off this infernal contraption?"
- **Dropship** for `annoyed`: "Keep your arms and legs inside until this ride comes to a full and complete stop."
- **Archon** for `annoyed`: "It all looks so different on this side!"
- **Valkyrie** for `ready_for_input`: "Don't keep me waiting."

Zerg are not included by design; their units mostly do not speak.

## Changing a mapping

Point an event at any bundled clip in `~/.config/agent-starcraft/config.json`:

```json
{ "events": { "turn_completed": { "clips": ["protoss-advisor-upgrade-complete"] } } }
```

To bundle a new clip, add an entry to `audio/sources.json` and its id to
`CLIPS` in `scripts/starcraft.mjs`, rebuild with `scripts/build-audio.py`, and
verify the words with a speech-to-text pass. The StarCraft Wiki's MediaWiki API
lists every file (`api.php?action=query&list=allimages&aiprefix=TerranMedic`),
and files ending in `SC1.ogg` are the original recordings. See
[distribution maintenance](distribution.md#audio).
