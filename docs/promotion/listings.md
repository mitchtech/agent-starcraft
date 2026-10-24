# Community listing drafts

Drafts only. Nothing here has been submitted. The owner reviews each
destination's current rules, eligibility, and format before submitting from
their own account, one listing at a time, after the v0.1.0 release and launch
checks are complete. Skip any destination that does not accept self-submitted
projects or hook-only plugins.

## Automatic discovery (no submission)

- **Gemini CLI extension gallery.** The `gemini-cli-extension` topic plus the
  root `gemini-extension.json` make the repository eligible; listing follows the
  gallery's validation and crawl schedule.
  [Requirements](https://geminicli.com/docs/extensions/releasing/)
- **GitHub topic pages.** `claude-code-plugin`, `codex-plugin`, `starcraft`, and
  the other repository topics surface it on GitHub's topic pages.

## Curated lists

For "awesome" lists of Claude Code plugins, hooks, or agent tooling, follow each
list's contributing guide (alphabetical placement, one line, no marketing
superlatives). Suggested entry:

```markdown
- [Agent StarCraft](https://github.com/mitchtech/agent-starcraft) - StarCraft Terran and Protoss sound cues for Claude Code, Codex, and Gemini CLI hooks, with status-line minerals and supply meters.
```

Category guidance: "Hooks" or "Notifications" where available; otherwise
"Plugins". Mention the sibling projects only if the list groups related
projects.

## Plugin directories

Some community directories index Claude Code and Codex plugin marketplaces.
Suggested short description (under 160 characters):

> StarCraft sound cues for coding agents: Job's finished, not enough minerals,
> and nuclear launch detected. Terran, Protoss, or random.

Suggested long description:

> Agent StarCraft plays original StarCraft and Brood War voice lines on Claude
> Code, Codex, and Gemini CLI events: a greeting at session start, an
> acknowledgment per prompt, a cue for approvals, "Nuclear launch detected."
> for destructive commands, and "Job's finished." when a turn ends. Claude Code
> rate limits play "Not enough minerals.", and an optional status-line command
> shows usage as minerals and context as supply ("You must construct additional
> pylons!" near the cap). Local, no telemetry, no runtime dependencies, never
> approves or blocks actions.

Install snippet for directories that show one:

```bash
claude plugin marketplace add mitchtech/agent-starcraft
claude plugin install starcraft@agent-starcraft
```

OpenAI's public plugin submission excludes lifecycle-hook plugins, so do not
submit there; the GitHub marketplace commands are the Codex distribution path.

## Notes for every listing

- Use the repository URL or the Pages site as the single link.
- Do not use Blizzard logos, portraits, or screenshots; the social card and
  waveform GIFs are the visuals.
- State the audio rights position plainly if asked: the clips belong to
  Blizzard Entertainment and are excluded from the MIT license.
- Record each submission in [campaign.csv](campaign.csv).
