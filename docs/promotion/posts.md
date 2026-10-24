# Public post drafts

Owner review required before publishing. These drafts describe documented
behavior, not fabricated user results. Attach the matching captioned preview
from [demos.md](demos.md). Keep its preview label visible. Substitute a live clip
only after the native capture checklist passes. Recheck community rules and
flair on publication day. Use one primary destination per post.

## R1 - r/ClaudeCode weekly showcase

I built Agent StarCraft, a free sound-notification plugin for Claude Code. It
plays original *StarCraft* lines on agent events: "SCV good to go, sir." when a
session starts, "Orders, Captain?" for an approval, "Job's finished." when a
turn finishes. When Claude Code stops on a rate limit or billing error, the
adjutant tells you what every RTS player already knows: "Not enough minerals."

The attached clip is an illustrated sound preview, not a live hook recording.

Install from your terminal:

```bash
claude plugin marketplace add mitchtech/agent-starcraft
claude plugin install starcraft@agent-starcraft
```

It needs Node.js 22+ and local audio. Restart Claude Code after installation.
It runs locally with no runtime telemetry, and the hooks never approve or block
actions. Approvals for `rm -rf` or a force push get "Nuclear launch detected."
instead; that is a louder cue, not a safety check. Send three prompts in ten
seconds and you get the pissed lines, exactly like clicking a marine too often.

There is an optional status-line command with two meters: minerals for your
5-hour or weekly limit, and supply for your context window against the 200 cap.
At 85% context it plays "Additional supply depots required." Prefer Protoss?
`agent-starcraft faction protoss` gets you "My life for Aiur!" and "You must
construct additional pylons!"

Install details: https://github.com/mitchtech/agent-starcraft#install

Which cue would you turn off first? I am curious whether "Job's finished" on
every turn is satisfying or too much.

## R2 - r/codex showcase

Title: I built Agent StarCraft: Terran and Protoss sound cues for Codex

I made Agent StarCraft, a free plugin that plays original *StarCraft* lines in
local Codex sessions. Session start gets "SCV good to go, sir.", prompts get
"Affirmative.", approvals get "Orders, Captain?", and a finished turn gets
"Job's finished." Approvals whose command matches a short destructive list
(`rm -rf`, `git push --force`, `git reset --hard`, `DROP TABLE`, and similar)
get "Nuclear launch detected." Only a yes/no flag leaves the hook; the command
is never logged or stored. Subagents can say "You want a piece of me, boy?" if
you turn that cue on.

The attached video illustrates the sound; it is not a live Codex recording.

```bash
codex plugin marketplace add mitchtech/agent-starcraft
codex plugin add starcraft@agent-starcraft
```

Requirements: Node.js 22+, a local audio player/device, and a restart. Review
and trust the installed commands in Codex's hook settings. Installation alone
does not trust hooks.

There are no npm runtime dependencies or runtime telemetry. Hooks return
promptly and do not supply approval decisions. The rate-limit and supply alarms
are Claude Code only, because Codex does not report API failures or context use
to hooks. SSH/container execution plays where the hook runs, not automatically
on your laptop.

Install and compatibility details:
https://github.com/mitchtech/agent-starcraft#install

Where does setup get confusing: adding the marketplace, hook trust, or local
audio? If something fails, the host version and operating system would help me
reproduce it. Please leave private prompts and credentials out of reports.

## X1 - sound introduction

I built Agent StarCraft: original StarCraft sound cues for Claude Code, Codex, and Gemini CLI.

Turn finished: "Job's finished."
Force push approval: "Nuclear launch detected."

Local. No telemetry. Free. Clip: illustrated preview.

https://github.com/mitchtech/agent-starcraft#install

## X2 - minerals and supply

Claude Code tells hooks why a turn failed, and tells the status line how full
the context is. Agent StarCraft listens.

rate_limit: "Not enough minerals."
max_output_tokens: "Insufficient vespene gas."
Context at 85%: "Additional supply depots required."

https://github.com/mitchtech/agent-starcraft#minerals-and-supply-meters

## X3 - pissed units and Protoss

Send your coding agent three prompts in ten seconds and it reacts the way a
marine did in 1998: "I vote we frag this commander."

Prefer Protoss? agent-starcraft faction protoss. "And still you procrastinate!"
Can't decide? faction random keeps one race per session.

Clip: preview.

https://github.com/mitchtech/agent-starcraft#factions

## X4 - useful follow-up

Trying Agent StarCraft? Add the marketplace, install the plugin, then restart.

Codex also requires hook trust review. Remote sessions play audio on the
machine running the hook. Already running a sibling (Navi, Johnny 5, Warcraft, Rocky,
Star Wars)? Enable one per host.

https://github.com/mitchtech/agent-starcraft#install

## L1 - LinkedIn maker introduction

I built Agent StarCraft, a small sound-notification plugin for Claude Code,
Codex, and Gemini CLI. It plays original *StarCraft* lines when a coding agent
needs attention or finishes work, "Not enough minerals." when Claude Code stops
on a rate limit, and "You must construct additional pylons!" when the context
window is nearly full.

The attached video is an illustrated preview of the cues, rather than a live
agent recording. The project is free to try.

The engineering problem was making a notification useful without making it
part of the agent's control flow. The hooks return promptly, leave approval
decisions alone, and tolerate missing audio or malformed input. The runtime
requires Node.js 22+ and has no npm dependencies or telemetry.

Code and installation:
https://github.com/mitchtech/agent-starcraft#install

If you use local coding agents, which event deserves a sound: approval, a
finished turn, or running out of context?

## L2 - LinkedIn engineering follow-up

The most useful feature in Agent StarCraft started as a joke: playing "You must
construct additional pylons!" when a coding agent's context window fills up.

StarCraft's supply cap is a surprisingly good model for a context window. Both
are a hard ceiling you hit mid-task, both have to be planned around, and both
are easy to forget until the game stops you. Claude Code already sends the
status line `context_window.used_percentage`, so the meter shows it as supply
against the 200 cap (142/200 means 71% used) and warns once when it crosses
85%. Compaction drops the number and re-arms the warning.

A second meter does the same for usage limits as minerals, reading the 5-hour,
weekly, and spend-limit percentages and warning once at 80%. Each meter stores
one number per session under a hashed name, and the command always prints a
line, because a status line that crashes is worse than none.

The same restraint applies everywhere else. The destructive-command alarm
reduces a command to a single boolean inside the hook process, and the pissed
cue stores three timestamps, never prompt text.

The implementation and its tests are public:
https://github.com/mitchtech/agent-starcraft

## Replies and follow-up

Successful install: "Outstanding. Which host and OS are you using, and which
cues did you leave on?"

Continued use, after at least a week and only in a willing conversation:
"Have you kept the sounds enabled? If you muted or removed them, what led to that?"

Install problem: "Which host/version and OS are you using? Please share the
error with private paths and credentials removed. The diagnostics and hook
trust notes are in the README."

Alarm as safety: "It is only a louder sound. It never blocks anything, and an
indirect or obfuscated command gets the ordinary cue. Keep your normal
permission settings."

When someone has found it useful: "A GitHub star helps other people find it if
you'd like to support the project." Do not ask for Reddit votes or coordinated
engagement.
