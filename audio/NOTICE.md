# Audio provenance and rights

The WAV files in this directory are derived from *StarCraft* (1998) and
*StarCraft: Brood War* (1998), with two Protoss lines from *StarCraft II*
(2010), all by Blizzard Entertainment. Blizzard Entertainment retains all rights
to the game audio, including every voice line here. StarCraft is a trademark of
Blizzard Entertainment. No ownership of these clips is claimed, and no
affiliation with or endorsement by Blizzard is implied.

The repository's MIT license covers source code and configuration only. It
does not cover these recordings or grant any rights to the game's audio.

The clips are included for personal, non-commercial use. This notice records
their provenance; it is not a license from the rights holder. They will be
removed on request from Blizzard Entertainment.

## Sources and processing

[`sources.json`](sources.json) lists every source URL, its SHA-256, and the hash
of each committed output. The sources are the original game files as hosted on
the StarCraft Wiki (starcraft.fandom.com) file pages, served from its
`static.wikia.nocookie.net` media host. Files with an `SC1` suffix are the
original StarCraft and Brood War recordings; the two without it are StarCraft II
recordings that fill gaps in the Protoss set. The wiki publishes no license for
the recordings. Every clip's words were checked against a speech-to-text
transcript before it was committed; lines in parentheses are non-verbal sounds.

The wiki's HTML pages sit behind a bot challenge, but its media host and API do
not, so `build-audio.py` downloads every source directly.

[`scripts/build-audio.py`](../scripts/build-audio.py) trims leading and trailing
room tone, applies one linear gain to reach -16 LUFS integrated with a peak
limiter, adds 10-20 ms fades, and writes 16-bit mono PCM WAV at 32 kHz.
`--check` verifies the committed files without downloading anything.

| File | Faction | Line | Length | Source |
|---|---|---|---|---|
| `terran-scv-good-to-go.wav` | Terran | SCV good to go, sir. | 1.71 s | StarCraft (`TerranSCVReady00SC1.ogg`) |
| `terran-battlecruiser-operational.wav` | Terran | Battlecruiser operational. | 2.52 s | StarCraft (`TerranBattlecruiserReady00SC1.ogg`) |
| `terran-scv-affirmative.wav` | Terran | Affirmative. | 0.84 s | StarCraft (`TerranSCVYes00SC1.ogg`) |
| `terran-scv-roger-that.wav` | Terran | Roger that. | 0.97 s | StarCraft (`TerranSCVYes01SC1.ogg`) |
| `terran-scv-right-away-sir.wav` | Terran | Right away, sir. | 1.04 s | StarCraft (`TerranSCVYes02SC1.ogg`) |
| `terran-scv-orders-received.wav` | Terran | Orders received. | 1.46 s | StarCraft (`TerranSCVYes03SC1.ogg`) |
| `terran-marine-go-go-go.wav` | Terran | Go, go, go! | 1.02 s | StarCraft (`TerranMarineYes00SC1.ogg`) |
| `terran-marine-outstanding.wav` | Terran | Outstanding. | 1.23 s | StarCraft (`TerranMarineYes02SC1.ogg`) |
| `terran-marine-rock-and-roll.wav` | Terran | Rock and roll. | 1.58 s | StarCraft (`TerranMarineYes03SC1.ogg`) |
| `terran-battlecruiser-make-it-happen.wav` | Terran | Make it happen. | 1.63 s | StarCraft (`TerranBattlecruiserYes00SC1.ogg`) |
| `terran-scv-cant-believe.wav` | Terran | I can't believe they put me in one of these things. | 2.19 s | StarCraft (`TerranSCVPissed03SC1.ogg`) |
| `terran-scv-claustrophobic.wav` | Terran | I told 'em I was claustrophobic. I gotta get outta here! | 3.29 s | StarCraft (`TerranSCVPissed05SC1.ogg`) |
| `terran-marine-frag-commander.wav` | Terran | I vote we frag this commander. | 2.61 s | StarCraft (`TerranMarinePissed03SC1.ogg`) |
| `terran-marine-neural-implants.wav` | Terran | If it weren't for these damn neural implants, you'd be a smoking crater by now! | 4.27 s | StarCraft (`TerranMarinePissed06SC1.ogg`) |
| `terran-battlecruiser-behind-schedule.wav` | Terran | We are getting way behind schedule. | 2.80 s | StarCraft (`TerranBattlecruiserPissed03SC1.ogg`) |
| `terran-scv-yes-sir.wav` | Terran | Yes, sir? | 0.78 s | StarCraft (`TerranSCVWhat00SC1.ogg`) |
| `terran-scv-orders-captain.wav` | Terran | Orders, Captain? | 1.09 s | StarCraft (`TerranSCVWhat01SC1.ogg`) |
| `terran-scv-i-read-you.wav` | Terran | I read you. | 1.10 s | StarCraft (`TerranSCVWhat02SC1.ogg`) |
| `terran-adjutant-nuclear-launch.wav` | Terran | Nuclear launch detected. | 2.21 s | StarCraft (`TerranAdjutantUpdate04SC1.ogg`) |
| `terran-adjutant-base-under-attack.wav` | Terran | Base is under attack. | 1.92 s | StarCraft (`TerranAdjutantUpdate00SC1.ogg`) |
| `terran-battlecruiser-receiving-transmission.wav` | Terran | Receiving transmission. | 2.27 s | StarCraft (`TerranBattlecruiserWhat01SC1.ogg`) |
| `terran-dropship-input-coordinates.wav` | Terran | Input coordinates. | 1.37 s | StarCraft (`TerranDropshipWhat03SC1.ogg`) |
| `terran-scv-reporting-for-duty.wav` | Terran | Reporting for duty. | 1.18 s | StarCraft (`TerranSCVWhat03SC1.ogg`) |
| `terran-scv-jobs-finished.wav` | Terran | Job's finished. | 0.97 s | StarCraft (`TerranSCVUpdate00SC1.ogg`) |
| `terran-adjutant-upgrade-complete.wav` | Terran | Upgrade complete. | 1.79 s | StarCraft (`TerranAdjutantUpdate06SC1.ogg`) |
| `terran-adjutant-not-enough-minerals.wav` | Terran | Not enough minerals. | 1.84 s | StarCraft (`TerranAdjutantError00SC1.ogg`) |
| `terran-adjutant-not-enough-energy.wav` | Terran | Not enough energy. | 1.87 s | StarCraft (`TerranAdjutantError06SC1.ogg`) |
| `terran-adjutant-insufficient-gas.wav` | Terran | Insufficient vespene gas. | 2.48 s | StarCraft (`TerranAdjutantError01SC1.ogg`) |
| `terran-adjutant-supply-depots.wav` | Terran | Additional supply depots required. | 2.94 s | StarCraft (`TerranAdjutantError02SC1.ogg`) |
| `terran-adjutant-abandoning-structure.wav` | Terran | Abandoning auxiliary structure. | 2.57 s | StarCraft (`TerranAdjutantUpdate05SC1.ogg`) |
| `terran-adjutant-landing-interrupted.wav` | Terran | Landing sequence interrupted. | 2.34 s | StarCraft (`TerranAdjutantError03SC1.ogg`) |
| `terran-marine-death.wav` | Terran | (marine death cry) | 1.48 s | StarCraft (`TerranMarineDeath00SC1.ogg`) |
| `terran-scv-cant-build-there.wav` | Terran | I can't build there. | 1.57 s | StarCraft (`TerranSCVError01SC1.ogg`) |
| `terran-scv-something-in-the-way.wav` | Terran | I can't build it. Something's in the way. | 2.40 s | StarCraft (`TerranSCVError00SC1.ogg`) |
| `terran-marine-piece-of-me.wav` | Terran | You want a piece of me, boy? | 1.72 s | StarCraft (`TerranMarineReady00SC1.ogg`) |
| `terran-ghost-exterminator.wav` | Terran | Somebody call for an exterminator? | 2.37 s | StarCraft (`TerranGhostReady00SC1.ogg`) |
| `terran-siege-tank-ready.wav` | Terran | Ready to roll out! | 1.22 s | StarCraft (`TerranSiegeTankReady00SC1.ogg`) |
| `terran-scv-death.wav` | Terran | (SCV destroyed) | 2.14 s | StarCraft (`TerranSCVDeath00SC1.ogg`) |
| `terran-adjutant-nuclear-missile-ready.wav` | Terran | Nuclear missile ready. | 1.83 s | StarCraft (`TerranAdjutantUpdate07SC1.ogg`) |
| `terran-marine-thats-the-stuff.wav` | Terran | That's the stuff. | 2.11 s | StarCraft (`TerranMarineStimPack00SC1.ogg`) |
| `terran-dropship-five-by-five.wav` | Terran | In the pipe, five by five. | 2.46 s | StarCraft (`TerranDropshipYes00SC1.ogg`) |
| `protoss-zealot-my-life-for-aiur.wav` | Protoss | My life for Aiur! | 1.76 s | StarCraft (`ProtossZealotReady00SC1.ogg`) |
| `protoss-carrier-has-arrived.wav` | Protoss | Carrier has arrived. | 1.71 s | StarCraft (`ProtossCarrierReady00SC1.ogg`) |
| `protoss-zealot-thus-i-serve.wav` | Protoss | Thus I serve. | 1.51 s | StarCraft (`ProtossZealotYes01SC1.ogg`) |
| `protoss-zealot-honor-guide-me.wav` | Protoss | Honor guide me. | 1.37 s | StarCraft (`ProtossZealotYes02SC1.ogg`) |
| `protoss-high-templar-it-shall-be-done.wav` | Protoss | It shall be done. | 1.80 s | StarCraft (`ProtossHighTemplarYes01SC1.ogg`) |
| `protoss-high-templar-my-path-is-set.wav` | Protoss | My path is set. | 1.97 s | StarCraft (`ProtossHighTemplarYes02SC1.ogg`) |
| `protoss-carrier-commencing.wav` | Protoss | Commencing. | 1.15 s | StarCraft (`ProtossCarrierYes00SC1.ogg`) |
| `protoss-dragoon-confirmed.wav` | Protoss | Confirmed. | 0.95 s | StarCraft (`ProtossDragoonYes00SC1.ogg`) |
| `protoss-dark-templar-so-be-it.wav` | Protoss | So be it. | 1.24 s | StarCraft (`ProtossDarkTemplarYes02SC1.ogg`) |
| `protoss-carrier-procrastinate.wav` | Protoss | And still you procrastinate! | 2.55 s | StarCraft (`ProtossCarrierPissed01SC1.ogg`) |
| `protoss-carrier-relieved.wav` | Protoss | Command, or you will be relieved. | 3.11 s | StarCraft (`ProtossCarrierPissed02SC1.ogg`) |
| `protoss-carrier-idle-threat.wav` | Protoss | This is not an idle threat. | 2.47 s | StarCraft (`ProtossCarrierPissed03SC1.ogg`) |
| `protoss-high-templar-thoughts-betray.wav` | Protoss | Your thoughts betray you. | 1.96 s | StarCraft (`ProtossHighTemplarPissed00SC1.ogg`) |
| `protoss-high-templar-lack-of-control.wav` | Protoss | I find your lack of control disturbing. | 2.92 s | StarCraft (`ProtossHighTemplarPissed03SC1.ogg`) |
| `protoss-zealot-ignorance-is-bliss.wav` | Protoss | It is said that ignorance is bliss. Tell me, is that true? | 4.93 s | StarCraft II (`Zealot_Pissed06.ogg`) |
| `protoss-carrier-instructions.wav` | Protoss | Instructions? | 1.31 s | StarCraft (`ProtossCarrierWhat00SC1.ogg`) |
| `protoss-carrier-your-command.wav` | Protoss | Your command? | 1.37 s | StarCraft (`ProtossCarrierWhat01SC1.ogg`) |
| `protoss-zealot-command-me.wav` | Protoss | Command me. | 1.19 s | StarCraft II (`Zealot_What02.ogg`) |
| `protoss-high-templar-state-thy-bidding.wav` | Protoss | State thy bidding. | 1.72 s | StarCraft (`ProtossHighTemplarWhat03SC1.ogg`) |
| `protoss-advisor-nuclear-launch.wav` | Protoss | Nuclear launch detected. | 1.84 s | StarCraft (`ProtossAdvisorUpdate04SC1.ogg`) |
| `protoss-advisor-under-attack.wav` | Protoss | We are under attack! | 1.40 s | StarCraft (`ProtossAdvisorUpdate00SC1.ogg`) |
| `protoss-dragoon-awaiting-instructions.wav` | Protoss | Awaiting instructions. | 1.49 s | StarCraft (`ProtossDragoonWhat01SC1.ogg`) |
| `protoss-zealot-i-long-for-combat.wav` | Protoss | I long for combat. | 1.81 s | StarCraft (`ProtossZealotWhat02SC1.ogg`) |
| `protoss-dragoon-i-am-needed.wav` | Protoss | I am needed. | 0.94 s | StarCraft (`ProtossDragoonWhat07SC1.ogg`) |
| `protoss-dark-templar-im-waiting.wav` | Protoss | I'm waiting. | 1.25 s | StarCraft (`ProtossDarkTemplarWhat02SC1.ogg`) |
| `protoss-advisor-research-complete.wav` | Protoss | Research complete. | 1.23 s | StarCraft (`ProtossAdvisorUpdate02SC1.ogg`) |
| `protoss-advisor-upgrade-complete.wav` | Protoss | Upgrade complete. | 1.29 s | StarCraft (`ProtossAdvisorUpdate06SC1.ogg`) |
| `protoss-advisor-not-enough-minerals.wav` | Protoss | You have not enough minerals. | 1.79 s | StarCraft (`ProtossAdvisorError00SC1.ogg`) |
| `protoss-advisor-not-enough-energy.wav` | Protoss | Not enough energy. | 1.54 s | StarCraft (`ProtossAdvisorError06SC1.ogg`) |
| `protoss-advisor-more-gas.wav` | Protoss | You require more vespene gas. | 2.16 s | StarCraft (`ProtossAdvisorError01SC1.ogg`) |
| `protoss-advisor-construct-pylons.wav` | Protoss | You must construct additional pylons! | 2.47 s | StarCraft (`ProtossAdvisorError02SC1.ogg`) |
| `protoss-archon-merging-complete.wav` | Protoss | The merging is complete. | 2.65 s | StarCraft (`ProtossArchonReady00SC1.ogg`) |
| `protoss-zealot-death.wav` | Protoss | (zealot death cry) | 1.72 s | StarCraft (`ProtossZealotDeath00SC1.ogg`) |
| `protoss-probe-error.wav` | Protoss | (probe error chirp) | 1.94 s | StarCraft (`ProtossProbeError00SC1.ogg`) |
| `protoss-dragoon-i-have-returned.wav` | Protoss | I have returned. | 1.45 s | StarCraft (`ProtossDragoonReady00SC1.ogg`) |
| `protoss-dark-templar-adun-toridas.wav` | Protoss | Adun Toridas. | 1.73 s | StarCraft (`ProtossDarkTemplarReady00SC1.ogg`) |
| `protoss-high-templar-khassar.wav` | Protoss | Khassar de Templari. | 2.60 s | StarCraft (`ProtossHighTemplarReady00SC1.ogg`) |
| `protoss-probe-death.wav` | Protoss | (probe destroyed) | 2.00 s | StarCraft (`ProtossProbeDeath00SC1.ogg`) |
| `protoss-zealot-en-taro-adun.wav` | Protoss | En Taro Adun! | 1.68 s | StarCraft (`ProtossZealotPissed00SC1.ogg`) |
| `protoss-archon-power-overwhelming.wav` | Protoss | Power overwhelming. | 2.58 s | StarCraft (`ProtossArchonWhat03SC1.ogg`) |

Use the user audio directory setting to supply your own replacement recordings
without editing installed plugin files.
