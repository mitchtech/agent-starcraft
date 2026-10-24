# Why I built Agent StarCraft

Coding agents spend part of their time waiting for a person, and part of it
finishing work you are not watching. I had already built Agent Navi, Agent
Johnny 5, and Agent Warcraft to give those moments a familiar sound. Agent
StarCraft gives them the one a lot of us heard first: an SCV reporting for duty.

Anyone who played in 1998 already knows the vocabulary. "SCV good to go, sir."
when a unit is trained. "Affirmative." when you give it an order. "Job's
finished." when the building is done. Those map onto a coding agent almost
without translation: a session starts, you send a prompt, a turn finishes.

StarCraft's economy maps even better than Warcraft's. "Not enough minerals." is
what the game says when you try to spend what you do not have, and coding agents
have exactly that failure: a rate limit, a billing error, a usage window that
ran out mid-task. Claude Code's `StopFailure` hook names the error type, so
those three can be told apart from a server error and get the minerals line.
Hitting the output token limit gets "Insufficient vespene gas."

The line I was most pleased to find a job for is "You must construct additional
pylons!" A context window behaves like StarCraft's supply cap: a hard ceiling
you hit mid-task and have to plan around. Claude Code already sends the status
line its context use, so an optional status-line command shows it as supply
against the 200 cap and plays the pylon line (or "Additional supply depots
required.") once when it crosses 85%. A second meter shows what is left of your
tightest usage limit as minerals. Each stores one number per session, and the
command always prints a line, because a status line that fails is worse than none.

StarCraft units also have tempers, and in StarCraft they are famous for it.
Clicking a unit over and over gets progressively stranger replies. Here, the
third prompt inside ten seconds gets "I vote we frag this commander." or, on
the Protoss side, a carrier that says "And still you procrastinate!" The hook
keeps three timestamps to decide that, never the prompt text.

The faction setting picks Terran (the default) or Protoss, mixes both, or picks
one at random per session, the way a Random player keeps their race for a whole
game. Every default cue has a line for both factions, so switching never
silences an event. The original Probe only speaks in beeps, so Protoss borrows
its voice from the zealot, carrier, dragoon, templar, and advisor, plus two
StarCraft II zealot lines where the original set had a gap.

The rest of the design is inherited from its siblings. Host hooks return
promptly and fail open on malformed input, missing audio, invalid configuration,
and playback failure. They never approve or block actions. Approvals for `rm
-rf` or a force push play "Nuclear launch detected.", a cue and not a safety
check; the command is reduced to a yes/no flag inside the hook and never stored.
The shared player uses Node.js 22+ with no npm runtime dependencies across
macOS, Linux, and Windows.

The audio got the same treatment as Warcraft's. A build script records each
source URL and hash and the output hash, and matches loudness across all 81
clips. I transcribed every result to confirm the words survived the trim, which
also caught a mislabeled source: "In the pipe, five by five." turned out to be
the dropship, not the battlecruiser, whose line is "Engage." Speech-to-text was
less help with Protoss; it heard "My life for Aiur!" as "My life for hire!",
which is a different and much less noble unit.

The SCV and the Probe have reserved slots as native Codex pets. The installer,
validation, and packaging are ready, and the art will arrive later as a pure
data change.

The project separates its licenses: MIT for code and configuration, and a
separate notice for the *StarCraft* recordings, which belong to Blizzard
Entertainment. There is no claim of official affiliation or ownership of the
characters or the audio.

If you try it, I would like to know which cues you keep, and whether "Job's
finished" after every turn is satisfying or too much. Those answers are more
useful than another feature imagined in advance of someone needing it.

[Install Agent StarCraft](https://github.com/mitchtech/agent-starcraft#install)
or [hear every clip](https://mitchtech.github.io/agent-starcraft/).
