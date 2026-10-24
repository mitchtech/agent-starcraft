# Promotion validation

Campaign publications have not started. No social accounts were modified, no
messages were sent, and no directory submissions were made. Local evidence under
`dist/promotion/` is ignored by Git.

## Initial observations

Capture the first metrics snapshot after the v0.1.0 release and before any
promotion:

```bash
python3 docs/promotion/capture-metrics.py
```

Record the star and fork counts, the release asset IDs with their initial
download counts, and the traffic window here. Treat downloads and clones from
release verification and isolated install checks as validation activity, not
campaign adoption.

| Measure | Initial value | Captured |
|---|---|---|
| Stars / forks | Pending | Pending |
| Traffic window views / unique visitors | Pending | Pending |
| Release assets and downloads | Pending | Pending |

## Pre-release checks

Completed on October 24, 2026 against the local build:

- `npm run check`, `npm test` (47 tests), and `npm run test:package` passed.
- `python3 scripts/build-audio.py --check` verified all 81 clips. Each source
  and each built clip was transcribed with whisper.cpp to confirm the intended
  line survived trimming, and every clip is normalized to -16 LUFS integrated.
  The transcription caught one mislabeled source ("In the pipe, five by five."
  is the dropship, not the battlecruiser). Proper nouns such as "Aiur" and "En
  Taro Adun" were confirmed by ear rather than by transcript.
- `python3 scripts/check-pet.py` reported both pets as not bundled, as intended.
- `python3 scripts/build-assets.py --check` matched committed preview pixels.
- A local build of the site was checked in Chromium at 1280 x 900 and 390 x 844,
  in all four faction and theme combinations. There was no horizontal overflow,
  fonts loaded, the console showed no errors, and every palette's text pairs
  measured at or above WCAG AA contrast (lowest 5.35:1).
- Both promotional MP4s were rendered: 27 and 16 seconds, 1080 x 1080 H.264
  with AAC audio.

Known behavior: `afplay` holds the audio device for roughly 0.9 seconds after a
clip ends, and the global lock spans the player's whole run. A second cue
arriving within about 2.5 seconds of the first is dropped, as in the sibling
projects.

## Remaining native checks

The following have not been verified by automated, package, or browser checks:

- Physical speaker output from an actual Claude Code approval request.
- The destructive-command cue from an actual Claude Code `rm -rf` approval.
- An actual Claude Code `StopFailure` from a real rate limit.
- Physical speaker output from an actual trusted Codex approval request.
- End-to-end native behavior on Linux or Windows.
- The published Pages site (only a local build has been checked).

The committed MP4s are labeled illustrated previews, not proof of those checks.
Before publishing a claim of native behavior personally observed, complete the
[capture script](demos.md) and record host/version, OS, event, and result here.

| Check | Host/version | OS | Event/result | Evidence |
|---|---|---|---|---|
| Claude physical approval cue | Pending | Pending | Pending | Pending |
| Claude destructive-command cue | Pending | Pending | Pending | Pending |
| Claude rate-limit minerals cue | Pending | Pending | Pending | Pending |
| Claude supply-blocked cue from the status line | Pending | Pending | Pending | Pending |
| Codex trusted physical approval cue | Pending | Pending | Pending | Pending |
