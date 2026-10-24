# Response sheet

Use these as factual starting points. Answer the person's question directly
and link only the relevant documentation.

**What is Agent StarCraft?** A free sound-notification plugin for coding agents
that plays original *StarCraft* voice lines. Native sounds support Claude Code,
Codex, and Gemini CLI; other tools can call the shared event interface. It is a
sibling of Agent Navi, Agent Johnny 5, Agent Warcraft, Agent Rocky, and Agent
Star Wars, and shares their runtime design.

**How is it different from peon-ping?** peon-ping is a much larger project with
hundreds of community sound packs across many games and IDEs, and it is a good
choice if you want that range. Agent StarCraft is one pack done in depth: usage
alarms from Claude Code's `StopFailure` error types, status-line minerals and
supply meters, a destructive-command alarm, Terran and Protoss factions with a
random race, and a zero-dependency Node runtime shared with its siblings. Do
not disparage peon-ping.

**Is it constantly talking?** Session, prompt, completion, and attention events
are enabled by default where supported. Use the attention preset to keep only
approvals, questions, ready notices, and resource alarms; mute individual
events; or mute everything. Error, tool-failure, subagent, compaction, and
session-end cues are off by default.

**Why did it say "I vote we frag this commander"?** You sent three prompts
within ten seconds, like clicking a StarCraft unit over and over.
`agent-starcraft mute annoyed` turns that off. Only timestamps are stored, never
prompt text.

**When does it say "Not enough minerals"?** When Claude Code stops a turn with a
`rate_limit`, `billing_error`, or `account_on_hold` error, or when a usage-limit
wait ends without resuming. With the optional status-line meter it also warns
at 80% of your tightest limit ("Not enough energy.") and plays the minerals line
at 100%. Codex and Gemini do not report API failures to hooks. See
[minerals and supply](../minerals.md).

**What is the supply meter?** Your context window shown as supply against the
200 cap: 142/200 means 71% of the window is used. At 85% it plays "Additional
supply depots required." or, for Protoss, "You must construct additional
pylons!" once, and re-arms after compaction. It reads the percentage Claude Code
already sends to the status line.

**Does the minerals meter know my real bill?** No. It reads the percentages
Claude Code sends to the status line and, if you set a budget, Claude Code's own
client-side cost estimate. It stores one level per session.

**Why Protoss lines from a zealot instead of a probe?** The original Probe only
speaks in electronic chirps, which make fine error and death sounds but poor
words. Protoss borrows its voice from the zealot, carrier, dragoon, templar, and
advisor. `agent-starcraft faction protoss` switches, `faction both` mixes, and
`faction random` keeps one race per session.

**What is the "nuclear launch" alarm?** When an approval's command matches a
short list of destructive patterns (recursive force deletes, force pushes, hard
resets, `git clean -f`, dropped or truncated tables, `mkfs`, `dd of=`,
`chmod -R 777`, and PowerShell recursive force removal), the approval plays
"Nuclear launch detected." or "Base is under attack." instead of the ordinary cue.

**Is the alarm a safety feature?** No. It is a louder sound. It never blocks or
approves anything, and an indirect or obfuscated command gets the ordinary cue.
Keep your normal permission settings.

**Does it read my commands?** Only to set a yes/no flag inside the short-lived
hook process. The command is never passed to the playback worker, logged, or
stored. Local playback state stores hashed identifiers with timestamps or meter
levels only.

**What are the easter eggs?** About 2% of session, prompt, ready, and completion
cues are replaced by a rare line ("Power overwhelming.", "In the pipe, five by
five.", "En Taro Adun!"). They never replace approval, question, error, or alarm
cues. `agent-starcraft mute easter-egg` turns them off.

**Does it send telemetry?** No. It runs locally without runtime telemetry, and
the site loads no analytics. GitHub and social platforms keep their own aggregate
metrics.

**Why do I hear nothing?** Check Node.js on the hook process's PATH, restart the
agent, verify the local audio player/device, and inspect the mute state. Codex
also requires hook trust review. Use `doctor` for diagnostics and
`preview terran-scv-good-to-go` for an explicit audio check.

**I hear two voices at once.** A sibling plugin (Agent Navi, Agent Johnny 5,
Agent Warcraft, Agent Rocky, or Agent Star Wars) is installed too. Enable one
per host; see the [install walkthrough](install.md#already-using-a-sibling-plugin).

**Will it play on my laptop from SSH, WSL, or a container?** Not automatically.
Audio plays where the hook runs. A working audio bridge must already exist if
the execution environment and speakers are on different machines.

**Do all hosts expose the same events?** No. Claude has question, idle, usage,
supply, tool-failure, and error mappings that Codex and Gemini lack. Completion
is not a task success detector. See [compatibility](../compatibility.md).

**Is there a Codex pet?** Not yet. The SCV and the Probe have reserved,
manifest-only slots; `pet install` says the art is not bundled and changes
nothing. See [Codex pets](../pets.md).

**Is this official Blizzard software?** No. StarCraft and its voice lines belong
to Blizzard Entertainment. Code and configuration use MIT; the bundled audio is
excluded, and its provenance notice is not permission from the rights holder.
See the [audio notice](../../audio/NOTICE.md). If Blizzard asks, the clips come out.

**Can I use my own audio?** Yes. Configure your own audio directory with a
`<clip>.wav` for every name in `agent-starcraft list`, using 16-bit PCM WAV for
player compatibility. See [configuration](../../README.md#configuration).

**Was every platform physically tested?** CI exercises Node 22/24 on macOS,
Linux, and Windows with simulated players. Package tests exercise installed
bundles. Neither proves physical speaker output on every surface. Current
campaign checks are recorded in [validation](validation.md).
