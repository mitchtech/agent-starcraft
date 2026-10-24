# Minerals, gas, and supply

Agent StarCraft has two ways to tell you that you are running dry: hook events
when a turn has already failed, and an optional status-line command that warns
you before it does. Minerals stand for your usage limits or budget, vespene gas
for the output token limit, and supply for the context window.

## Hook events

Claude Code runs `StopFailure` instead of `Stop` when a turn ends on an API
error. Its `error` field names the failure type:

| `error` | Shared event | Terran / Protoss | Default |
|---|---|---|---|
| `rate_limit`, `billing_error`, `account_on_hold` | `out_of_minerals` | "Not enough minerals." / "You have not enough minerals." | On |
| `max_output_tokens` | `out_of_gas` | "Insufficient vespene gas." / "You require more vespene gas." | On |
| Any other type, or none | `error` | "Landing sequence interrupted." or a marine's death cry / a zealot's death cry | Off |

Claude Code's usage-limit notifications map as follows:

| `notification_type` | Shared event | Why |
|---|---|---|
| `quota_auto_resume_disabled` | `out_of_minerals` | The wait for a usage limit ended without continuing your task |
| `quota_auto_resume_stale` | `ready_for_input` | The limit reset while the computer slept; Claude Code is waiting for Enter |
| `quota_auto_resume_fired` | none | The task continued on its own |

Codex and Gemini CLI do not report API failures to hooks. Wrappers around them
can call `agent-starcraft play out_of_minerals` themselves.

## The status-line meters

`agent-starcraft statusline` reads the JSON that Claude Code sends to a status
line command on stdin. It prints one line and exits.

```text
◆ 62% minerals (5h) · 84/200 supply
◆ 18% minerals (7d) low · 142/200 supply
◆ $1.25 minerals low · 176/200 supply blocked
◆ 0% minerals (spend) out
◆ 40/200 supply
◆
```

### Minerals

Minerals are whatever is left of your **tightest** limit, chosen from these
sources:

- `rate_limits.five_hour.used_percentage` (5h). Claude.ai Pro and Max plans
  report this after the first response in a session.
- `rate_limits.seven_day.used_percentage` (7d), reported on the same plans.
- `rate_limits.spend_limit.used_percentage` (spend), reported behind a Claude
  apps gateway with a spend limit.
- `cost.total_cost_usd` against `minerals.budgetUsd`, when you set a budget.
  This is Claude Code's client-side estimate at list price. It resets when
  `/clear` starts a new session, so treat it as a per-session budget.

### Supply

Supply is your context window against StarCraft's 200 cap: 142/200 means 71% of
the window is in use. It reads `context_window.used_percentage`, which Claude
Code computes from input tokens, and falls back to `total_input_tokens /
context_window_size` when the percentage is missing. Both can be absent early
in a session, in which case the supply part is left out.

A bare `◆` means no meter has data yet, which is normal before the first
response in a session. The same bare line appears if the input or configuration
can't be read: the meters never fail the status line.

### Cues

- Crossing `minerals.lowPercent` used (default 80) plays `minerals_low`: "Not
  enough energy."
- Reaching 100% plays `out_of_minerals`.
- Crossing `supply.lowPercent` of the context window (default 85) plays
  `supply_blocked`: "Additional supply depots required." / "You must construct
  additional pylons!"

Each cue plays once per session per rise. When a meter falls back, as when a
5-hour window resets or `/compact` empties the context, it re-arms, and the
next crossing plays again. A single status-line update plays at most one cue;
the minerals alarm outranks supply. Mute any of them with `agent-starcraft mute
minerals_low`, `mute out_of_minerals`, or `mute supply_blocked`.

### Setup

The status line runs outside the plugin, so it needs the standalone command:

```bash
npm install -g github:mitchtech/agent-starcraft
```

If you have no status line yet, add this to `~/.claude/settings.json`:

```json
{ "statusLine": { "type": "command", "command": "agent-starcraft statusline" } }
```

If you already have a status line script, keep it and append the meters. The
script receives the JSON once on stdin, so save it before using it twice:

```bash
#!/bin/sh
input=$(cat)
mine=$(printf '%s' "$input" | your-existing-statusline)
meters=$(printf '%s' "$input" | agent-starcraft statusline)
printf '%s  %s\n' "$mine" "$meters"
```

### Settings

```json
{ "minerals": { "budgetUsd": 20, "lowPercent": 75 }, "supply": { "lowPercent": 90 } }
```

| Setting | Default | Meaning |
|---|---|---|
| `minerals.budgetUsd` | `null` | Per-session dollar budget, or `null` to use rate limits only |
| `minerals.lowPercent` | `80` | Percent used at which `minerals_low` plays; between 0 and 100 |
| `supply.lowPercent` | `85` | Percent of the context window at which `supply_blocked` plays; between 0 and 100 |

Claude Code compacts automatically near the end of the window, so a supply
threshold close to 100 may never be reached. The meters store one level each
per session under a hashed name in the state directory. Nothing about your
usage, cost, or context is written anywhere else.
