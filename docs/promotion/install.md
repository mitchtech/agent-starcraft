# From install to first cue

Agent StarCraft is free to try. Sounds require Node.js 22+ on the agent's PATH and
local audio: `afplay` on macOS, a supported Linux player, or Windows PowerShell
on Windows. Remote hooks play on the remote machine unless an audio bridge is
already configured.

## Claude Code

Run in a terminal:

```bash
claude plugin marketplace add mitchtech/agent-starcraft
claude plugin install starcraft@agent-starcraft
```

Restart Claude Code. A new session should greet you with "SCV good to go, sir."
and the end of each turn should play "Job's finished.". In a disposable project,
request a harmless operation that requires approval under your existing
permission settings; it should play "Yes, sir?" or "Orders, Captain?" or, for a
file edit, "I read you.". Do not weaken permissions to make the demonstration
work. Use the explicit preview below to check audio separately.

## Codex

```bash
codex plugin marketplace add mitchtech/agent-starcraft
codex plugin add starcraft@agent-starcraft
```

Review and trust the installed hooks in Codex's hook settings, then restart.
Repeat the harmless approval check under your normal permission settings.
Installing or enabling the plugin alone does not establish hook trust.

## Already using a sibling plugin?

Agent Navi, Agent Johnny 5, Agent Warcraft, Agent Rocky, Agent Star Wars, and
Agent StarCraft all answer the same events. Enable one per host. For example,
`claude plugin disable warcraft@agent-warcraft` for Claude Code, or
`enabled = false` under `[plugins."warcraft@agent-warcraft"]` in
`~/.codex/config.toml` for Codex.

## Diagnose and preview without a global install

The bundled control skill supports requests such as "check the SCV's sound
status," "mute the SCV," "switch to Protoss," "turn off easter eggs," and
"use the attention preset." For an explicit terminal preview, use the repository CLI:

```bash
git clone https://github.com/mitchtech/agent-starcraft.git
cd agent-starcraft
node scripts/starcraft.mjs doctor
node scripts/starcraft.mjs preview terran-scv-jobs-finished
```

`doctor` does not play audio or change settings. `preview` explicitly plays a
clip even when muted; it is an audio check, not proof that a host hook fired.
These commands need no npm install. To hear the destructive-command path without
an agent:

```bash
node scripts/starcraft.mjs play approval_required --tool Bash --command "rm -rf build"
```

That passes the string to the matcher only; nothing is executed. The resource
alarms can be heard the same way:

```bash
node scripts/starcraft.mjs play out_of_minerals
node scripts/starcraft.mjs play supply_blocked
node scripts/starcraft.mjs faction protoss
node scripts/starcraft.mjs play supply_blocked
node scripts/starcraft.mjs faction terran
```

To check the status-line meters without Claude Code, pipe sample JSON in:

```bash
echo '{"rate_limits":{"five_hour":{"used_percentage":18}},"context_window":{"used_percentage":71}}' | node scripts/starcraft.mjs statusline
```

To keep only attention-related events:

```bash
node scripts/starcraft.mjs preset attention
node scripts/starcraft.mjs status
```

The attention preset turns off session, prompt, annoyed, completion, error,
tool-failure, subagent, compaction, and session-end cues. Approval, question,
ready, and resource-alarm events remain enabled where the host exposes them.

```bash
node scripts/starcraft.mjs mute all
node scripts/starcraft.mjs unmute all
node scripts/starcraft.mjs preset default
```

Mute/unmute preserves individual event preferences. The default preset restores
event enablement and preserves global mute, faction, and custom clip choices.

## Remove sounds

Use the command for the host you installed:

```bash
claude plugin uninstall starcraft@agent-starcraft
```

```bash
codex plugin remove starcraft@agent-starcraft
```

Restart the host. Persistent sound settings are stored separately from plugin
caches.

If a check fails, report the host/version, operating system, expected event,
and redacted diagnostic error through [GitHub Issues](https://github.com/mitchtech/agent-starcraft/issues).
Do not include prompts, transcripts, credentials, or private configuration.
