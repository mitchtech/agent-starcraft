import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { copyFileSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, symlinkSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { configuration, dangerous, DEFAULTS, enlist, escalate, locations, meterCue, minerals, normalize, playback, player, race, reserve, status, supply, updateConfiguration } from '../scripts/starcraft.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = join(ROOT, 'scripts', 'starcraft.mjs');
const json = path => JSON.parse(readFileSync(join(ROOT, path), 'utf8'));

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'agent starcraft '));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const env = { ...process.env, AGENT_STARCRAFT_CONFIG: join(root, 'config.json'), AGENT_STARCRAFT_STATE_DIR: join(root, 'state'), AGENT_STARCRAFT_MUTE: '0' };
  delete env.AGENT_STARCRAFT_AUDIO_DIR;
  return { root, env, settings: () => configuration(env) };
}

test('host payloads map to shared events and shell/edit approval cues', () => {
  for (const agent of ['claude', 'codex']) {
    for (const [native, event] of [['SessionStart', 'session_started'], ['UserPromptSubmit', 'prompt_submitted'], ['PermissionRequest', 'approval_required'], ['Stop', 'turn_completed']]) {
      assert.equal(normalize({ hook_event_name: native, session_id: 'one' }, agent).event, event);
    }
    for (const tool_name of ['Bash', 'PowerShell', 'apply_patch', 'Write', 'Edit', 'NotebookEdit']) assert.equal(normalize({ hook_event_name: 'PermissionRequest', tool_name }, agent).change, true);
    assert.equal(normalize({ hook_event_name: 'PermissionRequest', tool_name: 'WebFetch' }, agent).change, false);
    assert.equal(normalize({ hook_event_name: 'PreToolUse', tool_name: 'Bash' }, agent), null);
  }
  const notification = normalize({ hook_event_name: 'Notification', notification_type: 'permission_prompt' }, 'claude');
  assert.equal(notification.event, 'approval_required');
  assert.equal(notification.change, false);
  assert.equal(notification.fallback, true);
  for (const notification_type of ['elicitation_dialog', 'elicitation_url_dialog', 'agent_needs_input']) assert.equal(normalize({ hook_event_name: 'Notification', notification_type }, 'claude').event, 'input_required');
  assert.equal(normalize({ hook_event_name: 'Notification', notification_type: 'idle_prompt' }, 'claude').event, 'ready_for_input');
  assert.equal(normalize({ hook_event_name: 'Notification', notification_type: 'idle_prompt' }, 'codex'), null);
  assert.equal(normalize({ hook_event_name: 'StopFailure' }, 'claude').event, 'error');
  assert.equal(normalize({ hook_event_name: 'StopFailure' }, 'codex'), null);
});

test('subagent completion, compaction, unknown payloads, and continuing Stop stay silent', () => {
  for (const payload of [null, [], 'text', {}, { hook_event_name: 'Unknown' }, { hook_event_name: 'SubagentStop' }, { hook_event_name: 'SessionStart', source: 'compact' }, { hook_event_name: 'SessionStart', agent_id: 'child' }, { hook_event_name: 'Stop', agent_id: 'child' }, { hook_event_name: 'Stop', stop_hook_active: true }]) assert.equal(normalize(payload, 'claude'), null);
  assert.equal(normalize({ hook_event_name: 'PermissionRequest', agent_id: 'child' }, 'claude').event, 'approval_required');
});

test('config preserves defaults, merges event overrides, and resolves user audio outside plugins', t => {
  const f = fixture(t);
  assert.deepEqual(f.settings().config.events, DEFAULTS.events);
  writeFileSync(f.env.AGENT_STARCRAFT_CONFIG, JSON.stringify({ muted: true, audioDir: './my audio', events: { prompt_submitted: { clips: ['terran-marine-rock-and-roll'] }, session_ended: { enabled: true } } }));
  const { config } = f.settings();
  assert.equal(config.muted, false); // Environment override wins.
  assert.equal(config.audioDir, join(f.root, 'my audio'));
  assert.deepEqual(config.events.prompt_submitted.clips, ['terran-marine-rock-and-roll']);
  assert.equal(config.events.session_ended.enabled, true);
  assert.equal(config.events.error.enabled, false);
  assert.equal(configuration({ ...f.env, AGENT_STARCRAFT_AUDIO_DIR: join(f.root, 'override') }).config.audioDir, join(f.root, 'override'));
});

test('invalid config and invalid sound names are rejected by diagnostics', t => {
  const f = fixture(t);
  for (const value of [[], { unknown: true }, { muted: 'yes' }, { cooldownMs: -1 }, { events: null }, { events: { unknown: {} } }, { events: { session_started: { clips: [] } } }, { events: { session_started: { clips: ['../outside'] } } }, { events: { session_started: { enabled: 'yes' } } }, { events: { approval_required: { dangerClips: ['nope'] } } }, { easterEgg: null }, { easterEgg: { chance: 2 } }, { easterEgg: { chance: -0.1 } }, { easterEgg: { clips: [] } }, { easterEgg: { rate: 0.5 } }, { faction: 'orcs' }, { minerals: null }, { minerals: { budgetUsd: 0 } }, { minerals: { lowPercent: 100 } }, { minerals: { cap: 1 } }, { supply: null }, { supply: { lowPercent: 0 } }, { supply: { cap: 1 } }, JSON.parse('{"events":{"__proto__":{"enabled":true}}}')]) {
    writeFileSync(f.env.AGENT_STARCRAFT_CONFIG, JSON.stringify(value));
    assert.throws(f.settings);
  }
  writeFileSync(f.env.AGENT_STARCRAFT_CONFIG, '{');
  assert.throws(f.settings);
});

test('configuration uses native Windows and XDG paths', () => {
  assert.equal(locations({ APPDATA: '/roaming', LOCALAPPDATA: '/local' }, 'win32').config, resolve('/roaming/agent-starcraft/config.json'));
  assert.equal(locations({ XDG_CONFIG_HOME: '/config', XDG_STATE_HOME: '/state' }, 'linux').state, resolve('/state/agent-starcraft'));
});

test('platform players prefer native backends and treat Windows filenames as data', () => {
  const audio = "C:/my audio/it's $safe.wav";
  assert.deepEqual(player(audio, 'darwin', () => true), ['afplay', audio]);
  assert.equal(player(audio, 'linux', name => name === 'pw-play')[0], 'pw-play');
  assert.equal(player(audio, 'linux', name => name === 'aplay')[0], 'aplay');
  assert.equal(player(audio, 'linux', () => true)[0], 'paplay');
  assert.deepEqual(player(audio, 'linux', name => name === 'ffplay'), ['ffplay', '-nodisp', '-autoexit', '-loglevel', 'quiet', audio]);
  const windows = player(audio, 'win32', () => true);
  assert.equal(windows[0], 'powershell.exe');
  assert.ok(windows.at(-1).includes('$env:AGENT_STARCRAFT_PLAY_FILE'));
  assert.ok(!windows.at(-1).includes(audio));
  for (const platform of ['darwin', 'linux', 'win32', 'unknown']) assert.equal(player(audio, platform, () => false), null);
});

test('global playback lock, per-session cooldown, delayed approvals, and stale recovery', t => {
  const f = fixture(t);
  const { paths, config } = f.settings();
  const event = { agent: 'claude', session: 'private-session-name', event: 'approval_required' };
  const release = reserve(paths, event, config, 10000);
  assert.equal(typeof release, 'function');
  assert.equal(reserve(paths, { ...event, session: 'other' }, config, 10100), null);
  release();
  assert.equal(reserve(paths, event, config, 10500), null);
  assert.equal(reserve(paths, { ...event, fallback: true }, config, 16000), null);
  reserve(paths, { ...event, session: 'other' }, config, 10500)();
  reserve(paths, event, config, 21000)();
  const lock = join(paths.state, 'playback.lock');
  mkdirSync(lock);
  utimesSync(lock, new Date(0), new Date(0));
  reserve(paths, event, config, 50000)();
});

test('playback obeys mute, event toggles, custom clips, and tool approval mapping', t => {
  const f = fixture(t);
  const settings = f.settings();
  settings.config.cooldownMs = 0;
  const played = [];
  const options = { random: () => 0.5, player: audio => ['fake-player', audio], run: (command, args, opts) => { played.push({ command, args, opts }); return { status: 0 }; } };
  const event = { agent: 'generic', session: 'one', event: 'prompt_submitted' };
  settings.config.events.prompt_submitted.clips = ['terran-marine-rock-and-roll'];
  assert.equal(playback(event, settings, options), true);
  assert.equal(played[0].args[0], join(ROOT, 'audio', 'terran-marine-rock-and-roll.wav'));
  assert.equal(played[0].opts.timeout, 10000);
  assert.equal(playback({ ...event, event: 'approval_required', change: true }, settings, options), true);
  assert.equal(played[1].args[0], join(ROOT, 'audio', 'terran-scv-i-read-you.wav'));
  assert.equal(playback({ ...event, event: 'error' }, settings, options), false);
  settings.config.muted = true;
  assert.equal(playback(event, settings, options), false);
  assert.equal(played.length, 2);
});

test('missing audio, missing players, and player errors release state and report failures', t => {
  const f = fixture(t);
  const settings = f.settings();
  const event = { agent: 'generic', session: 'one', event: 'session_started' };
  assert.throws(() => playback(event, settings, { player: () => null }), /player/);
  settings.config.audioDir = join(f.root, 'missing');
  assert.throws(() => playback(event, settings), /Missing audio/);
  settings.config.audioDir = join(ROOT, 'audio');
  settings.config.cooldownMs = 0;
  assert.throws(() => playback(event, settings, { player: () => ['fake'], run: () => ({ status: 1 }) }), /failed/);
  assert.equal(playback(event, settings, { player: () => ['fake'], run: () => ({ status: 0 }) }), true);
});

test('hook failures never block; Codex Stop emits only neutral JSON', t => {
  const f = fixture(t);
  const env = { ...f.env, AGENT_STARCRAFT_MUTE: '1' };
  for (const agent of ['claude', 'codex']) {
    for (const input of ['bad json', '[]', '{}', '{"hook_event_name":"Unknown"}', '{"hook_event_name":"SessionStart"}']) {
      const result = spawnSync(process.execPath, [SCRIPT, 'hook', '--agent', agent], { input, env, encoding: 'utf8', timeout: 3000 });
      assert.equal(result.status, 0);
      assert.equal(result.stdout, '');
      assert.equal(result.stderr, '');
    }
  }
  writeFileSync(f.env.AGENT_STARCRAFT_CONFIG, '{');
  const stop = spawnSync(process.execPath, [SCRIPT, 'hook', '--agent', 'codex'], { input: '{"hook_event_name":"Stop"}', env, encoding: 'utf8', timeout: 3000 });
  assert.equal(stop.status, 0);
  assert.deepEqual(JSON.parse(stop.stdout), {});
  assert.equal(stop.stderr, '');
});

test('CLI diagnostics report problems, generic events respect mute, and previews validate names', t => {
  const f = fixture(t);
  const run = args => spawnSync(process.execPath, [SCRIPT, ...args], { env: { ...f.env, AGENT_STARCRAFT_MUTE: '1', AGENT_STARCRAFT_AUDIO_DIR: join(f.root, 'missing') }, encoding: 'utf8', timeout: 3000 });
  assert.deepEqual(JSON.parse(run(['config']).stdout), DEFAULTS);
  assert.equal(run(['play', 'approval_required', '--tool', 'Bash', '--session', 'one']).status, 0);
  assert.equal(run(['play', 'unknown']).status, 1);
  assert.equal(run(['preview', 'unknown']).status, 1);
  assert.match(run(['preview', 'terran-scv-good-to-go']).stderr, /Missing audio/);
  assert.match(run(['doctor']).stdout, /missing terran-scv-good-to-go/);
  assert.equal(run(['doctor']).status, 1);
});

test('npm console entry works through a symlink', { skip: process.platform === 'win32' }, t => {
  const f = fixture(t);
  const bin = join(f.root, 'agent-starcraft');
  symlinkSync(SCRIPT, bin);
  const result = spawnSync(process.execPath, [bin, 'config'], { env: f.env, encoding: 'utf8', timeout: 3000 });
  assert.deepEqual(JSON.parse(result.stdout), DEFAULTS);
});

test('both hosts execute registered commands with spaces and shell metacharacters in plugin paths', t => {
  const f = fixture(t);
  const pluginRoot = join(f.root, "SCV's $folder (test)");
  mkdirSync(join(pluginRoot, 'scripts'), { recursive: true });
  copyFileSync(SCRIPT, join(pluginRoot, 'scripts', 'starcraft.mjs'));
  copyFileSync(join(ROOT, 'scripts', 'pet.mjs'), join(pluginRoot, 'scripts', 'pet.mjs'));
  const env = { ...f.env, AGENT_STARCRAFT_MUTE: '1', PLUGIN_ROOT: pluginRoot, CLAUDE_PLUGIN_ROOT: pluginRoot };
  for (const agent of ['claude', 'codex']) {
    const hooks = json(`hooks/${agent}.json`).hooks;
    for (const event of Object.keys(hooks)) {
      const hook = hooks[event][0].hooks[0];
      const options = { env, input: JSON.stringify({ hook_event_name: event, source: 'startup', session_id: 'test' }), encoding: 'utf8', timeout: 3000 };
      const result = agent === 'claude'
        ? spawnSync(hook.command, hook.args.map(arg => arg.replace('${CLAUDE_PLUGIN_ROOT}', pluginRoot)), options)
        : spawnSync(hook.command, { ...options, shell: true });
      assert.equal(result.status, 0, result.stderr);
      assert.equal(result.stderr, '');
      assert.equal(result.stdout, agent === 'codex' && event === 'Stop' ? '{}\n' : '');
    }
  }
});

test('metadata and host hook registrations stay consistent and load exactly one hook file', () => {
  const portable = json('plugin.json');
  const claude = json('.claude-plugin/plugin.json');
  const packageInfo = json('package.json');
  assert.equal(portable.name, claude.name);
  assert.equal(portable.version, claude.version);
  assert.equal(portable.version, packageInfo.version);
  assert.equal(json('.claude-plugin/marketplace.json').name, 'agent-starcraft');
  assert.equal(json('.agents/plugins/marketplace.json').name, 'agent-starcraft');
  assert.equal(claude.hooks, './hooks/claude.json');
  assert.equal(portable.extensions['com.openai'].hooks, './hooks/codex.json');
  for (const agent of ['claude', 'codex']) {
    const hooks = json(`hooks/${agent}.json`).hooks;
    assert.ok(!hooks.PreToolUse && !hooks.SubagentStop);
    assert.ok(hooks.PermissionRequest && hooks.Stop);
    for (const groups of Object.values(hooks)) for (const group of groups) {
      assert.equal(group.hooks.length, 1);
      assert.equal(group.hooks[0].type, 'command');
    }
  }
  assert.ok(!json('hooks/codex.json').hooks.Notification);
});

test('Gemini lifecycle and permission notifications use explicit host contracts', () => {
  for (const [native, expected] of [['SessionStart', 'session_started'], ['BeforeAgent', 'prompt_submitted'], ['AfterAgent', 'turn_completed']]) {
    assert.equal(normalize({ hook_event_name: native, session_id: 'gemini-session' }, 'gemini').event, expected);
  }
  assert.equal(normalize({ hook_event_name: 'Notification', notification_type: 'ToolPermission', details: { tool_name: 'run_shell_command' } }, 'gemini').change, true);
  assert.equal(normalize({ hook_event_name: 'Notification', notification_type: 'ToolPermission' }, 'gemini').event, 'approval_required');
  for (const payload of [{ hook_event_name: 'Notification', notification_type: 'permission_prompt' }, { hook_event_name: 'SessionStart', source: 'compact' }, { hook_event_name: 'AfterAgent', stop_hook_active: true }, { hook_event_name: 'PermissionRequest' }]) assert.equal(normalize(payload, 'gemini'), null);
});

test('Gemini hooks always return neutral JSON without exposing input or errors', t => {
  const f = fixture(t);
  writeFileSync(f.env.AGENT_STARCRAFT_CONFIG, '{');
  for (const input of ['bad json', '[]', '{}', '{"hook_event_name":"AfterAgent","prompt":"private"}']) {
    const result = spawnSync(process.execPath, [SCRIPT, 'hook', '--agent', 'gemini'], { env: f.env, input, encoding: 'utf8', timeout: 3000 });
    assert.equal(result.status, 0);
    assert.deepEqual(JSON.parse(result.stdout), {});
    assert.equal(result.stderr, '');
  }
});

test('corrupted disposable timestamps recover without losing subsequent cooldown', t => {
  const f = fixture(t);
  const { paths, config } = f.settings();
  const event = { agent: 'generic', session: 'one', event: 'session_started' };
  reserve(paths, event, config, 10000)();
  const key = createHash('sha256').update('generic:one:session_started').digest('hex');
  const stamp = join(paths.state, `${key}.json`);
  for (const corrupt of ['{', 'null']) {
    writeFileSync(stamp, corrupt);
    reserve(paths, event, config, 20000)();
    assert.deepEqual(JSON.parse(readFileSync(stamp, 'utf8')), { time: 20000 });
    assert.equal(reserve(paths, event, config, 20500), null);
    assert.deepEqual(readdirSync(paths.state), [`${key}.json`]);
  }
});

test('previews bypass event cooldown, leave timestamps alone, and retain overlap protection', t => {
  const f = fixture(t);
  const settings = f.settings();
  settings.config.cooldownMs = 60000;
  const event = { agent: 'generic', session: 'one', event: 'session_started' };
  const options = { player: () => ['fake-player'], run: () => ({ status: 0 }) };
  assert.equal(playback(event, settings, options), true);
  const before = readdirSync(settings.paths.state).map(name => readFileSync(join(settings.paths.state, name), 'utf8'));
  assert.equal(playback(event, settings, { ...options, clip: 'terran-scv-good-to-go', preview: true }), true);
  assert.equal(playback(event, settings, { ...options, clip: 'protoss-zealot-my-life-for-aiur', preview: true }), true);
  assert.deepEqual(readdirSync(settings.paths.state).map(name => readFileSync(join(settings.paths.state, name), 'utf8')), before);
  const release = reserve(settings.paths, event, settings.config, Date.now(), true);
  assert.equal(playback(event, settings, { ...options, preview: true }), false);
  release();
});

test('persistent controls preserve custom clips and make environment precedence visible', t => {
  const f = fixture(t);
  const env = { ...f.env }; delete env.AGENT_STARCRAFT_MUTE;
  writeFileSync(env.AGENT_STARCRAFT_CONFIG, JSON.stringify({ audioDir: './my audio', cooldownMs: 2500, events: { prompt_submitted: { clips: ['terran-marine-rock-and-roll'] } } }));
  updateConfiguration('mute', 'prompt_submitted', env);
  assert.equal(configuration(env).config.events.prompt_submitted.enabled, false);
  updateConfiguration('mute', 'all', env);
  updateConfiguration('unmute', 'all', env);
  assert.equal(configuration(env).config.muted, false);
  assert.equal(configuration(env).config.events.prompt_submitted.enabled, false);
  updateConfiguration('unmute', 'prompt_submitted', env);
  updateConfiguration('preset', 'attention', env);
  let current = configuration(env).config;
  assert.equal(current.events.session_started.enabled, false);
  assert.equal(current.events.ready_for_input.enabled, true);
  assert.deepEqual(current.events.prompt_submitted.clips, ['terran-marine-rock-and-roll']);
  assert.equal(current.events.out_of_minerals.enabled, true);
  assert.equal(current.events.turn_completed.enabled, false);
  assert.equal(current.cooldownMs, 2500);
  assert.equal(JSON.parse(readFileSync(env.AGENT_STARCRAFT_CONFIG)).audioDir, './my audio');
  updateConfiguration('preset', 'default', env);
  assert.equal(configuration(env).config.events.prompt_submitted.enabled, true);
  updateConfiguration('unmute', 'all', { ...env, AGENT_STARCRAFT_MUTE: '1' });
  assert.equal(status({ ...env, AGENT_STARCRAFT_MUTE: '1' }).config.muted, true);
  assert.equal(status({ ...env, AGENT_STARCRAFT_MUTE: '1' }).environmentOverrides.AGENT_STARCRAFT_MUTE, '1');
  const before = readFileSync(env.AGENT_STARCRAFT_CONFIG, 'utf8');
  for (const [command, target] of [['mute', undefined], ['unmute', 'typo'], ['preset', 'typo'], ['faction', 'zerg']]) assert.throws(() => updateConfiguration(command, target, env));
  assert.equal(readFileSync(env.AGENT_STARCRAFT_CONFIG, 'utf8'), before);
  writeFileSync(env.AGENT_STARCRAFT_CONFIG, '{');
  assert.throws(() => updateConfiguration('mute', 'all', env));
  assert.equal(readFileSync(env.AGENT_STARCRAFT_CONFIG, 'utf8'), '{');
});

test('control CLI requires explicit targets and prints effective configuration', t => {
  const f = fixture(t);
  const env = { ...f.env }; delete env.AGENT_STARCRAFT_MUTE;
  const run = args => spawnSync(process.execPath, [SCRIPT, ...args], { env, encoding: 'utf8', timeout: 3000 });
  assert.equal(run(['mute']).status, 1);
  assert.equal(run(['mute', 'typo']).status, 1);
  assert.equal(run(['mute', 'all']).status, 0);
  assert.equal(JSON.parse(run(['status', '--json']).stdout).config.muted, true);
  assert.equal(JSON.parse(run(['config', '--effective']).stdout).muted, true);
  assert.ok(JSON.parse(run(['list', '--json']).stdout).clips.includes('terran-scv-jobs-finished'));
  assert.equal(run(['unmute', 'all']).status, 0);
});

test('compaction and session end map for Claude, Codex, and Gemini but stay silent for subagents', () => {
  for (const agent of ['claude', 'codex']) {
    assert.equal(normalize({ hook_event_name: 'PreCompact', trigger: 'auto' }, agent).event, 'context_compacting');
    assert.equal(normalize({ hook_event_name: 'SessionEnd', reason: 'other' }, agent).event, 'session_ended');
    for (const hook_event_name of ['PreCompact', 'SessionEnd']) assert.equal(normalize({ hook_event_name, agent_id: 'child' }, agent), null);
  }
  assert.equal(normalize({ hook_event_name: 'PreCompress' }, 'gemini').event, 'context_compacting');
  assert.equal(normalize({ hook_event_name: 'SessionEnd' }, 'gemini').event, 'session_ended');
  assert.equal(normalize({ hook_event_name: 'PreCompress' }, 'claude'), null);
  for (const event of ['context_compacting', 'session_ended']) assert.equal(DEFAULTS.events[event].enabled, false);
});

test('destructive commands are recognized without flagging routine ones', () => {
  for (const command of ['rm -rf build', 'rm -r -f x', 'rm --recursive --force x', 'sudo rm -fr /', 'rm -Rf x', 'git push --force origin main', 'git push -f',
    'git reset --hard HEAD~1', 'git clean -fdx', 'psql -c "DROP TABLE users"', 'TRUNCATE TABLE x', 'mkfs.ext4 /dev/sda1', 'dd if=x of=/dev/sda',
    'chmod -R 777 /var', 'Remove-Item -Recurse -Force C:\\x', 'rmdir /s /q build', 'cd /tmp && rm -rf cache']) assert.equal(dangerous(command), true, command);
  for (const command of ['rm file.txt', 'rm -r dir', 'rm -f file', 'git push', 'git push --force-with-lease', 'git reset HEAD~1', 'git clean -n', 'echo rm',
    'ls -rf', 'grep -rf patterns x', 'npm run format', 'drop tables', 'chmod 755 x', 'rm x; ls -rf', '', undefined, 42]) assert.equal(dangerous(command), false, String(command));
});

test('approvals for destructive commands are flagged in every host without carrying the command', () => {
  const secret = 'rm -rf /home/someone/private-project';
  for (const agent of ['claude', 'codex']) {
    const event = normalize({ hook_event_name: 'PermissionRequest', tool_name: 'Bash', tool_input: { command: secret }, session_id: 's' }, agent);
    assert.equal(event.danger, true);
    assert.equal(event.change, true);
    assert.ok(!JSON.stringify(event).includes('private-project'));
    assert.equal(normalize({ hook_event_name: 'PermissionRequest', tool_name: 'Bash', tool_input: { command: 'npm test' } }, agent).danger, false);
    assert.equal(normalize({ hook_event_name: 'PermissionRequest', tool_name: 'WebFetch' }, agent).danger, false);
    assert.equal(normalize({ hook_event_name: 'UserPromptSubmit', tool_input: { command: secret } }, agent).danger, false);
  }
  const gemini = normalize({ hook_event_name: 'Notification', notification_type: 'ToolPermission', details: { tool_name: 'run_shell_command', command: secret } }, 'gemini');
  assert.equal(gemini.danger, true);
  assert.ok(!JSON.stringify(gemini).includes('private-project'));
  assert.equal(normalize({ hook_event_name: 'Notification', notification_type: 'permission_prompt' }, 'claude').danger, false);
});

test('clip priority is danger, then change, then rare easter eggs, then the event clips', t => {
  const f = fixture(t);
  const settings = f.settings();
  settings.config.cooldownMs = 0;
  const played = [];
  const sequence = values => { let index = 0; return () => values[index++ % values.length]; };
  const play = (event, random) => {
    playback({ agent: 'generic', session: String(played.length), ...event }, settings, { random, player: audio => ['fake', audio], run: (command, args) => { played.push(args[0].split(/[\\/]/).at(-1)); return { status: 0 }; } });
    return played.at(-1);
  };
  assert.equal(play({ event: 'approval_required', danger: true, change: true }, sequence([0])), 'terran-adjutant-nuclear-launch.wav');
  assert.equal(play({ event: 'approval_required', change: true }, sequence([0])), 'terran-scv-i-read-you.wav');
  assert.equal(play({ event: 'approval_required' }, sequence([0])), 'terran-scv-yes-sir.wav');
  assert.equal(play({ event: 'prompt_submitted' }, sequence([0.01, 0])), 'terran-adjutant-nuclear-missile-ready.wav');
  assert.equal(play({ event: 'prompt_submitted' }, sequence([0.5, 0])), 'terran-scv-affirmative.wav');
  assert.equal(play({ event: 'session_started' }, sequence([0.019, 0.99])), 'terran-dropship-five-by-five.wav');
  for (const event of ['approval_required', 'input_required']) assert.ok(!DEFAULTS.easterEgg.clips.map(clip => `${clip}.wav`).includes(play({ event }, sequence([0]))));
  settings.config.events.error.enabled = true;
  assert.equal(play({ event: 'error' }, sequence([0])), 'terran-adjutant-landing-interrupted.wav');
  settings.config.easterEgg.chance = 0;
  assert.equal(play({ event: 'prompt_submitted' }, sequence([0])), 'terran-scv-affirmative.wav');
});

test('playback state never stores commands, sessions, or prompts in readable form', t => {
  const f = fixture(t);
  const settings = f.settings();
  const payload = { hook_event_name: 'PermissionRequest', tool_name: 'Bash', tool_input: { command: 'rm -rf secret-dir' }, session_id: 'secret-session', prompt: 'secret prompt' };
  playback(normalize(payload, 'claude'), settings, { random: () => 0, player: () => ['fake'], run: () => ({ status: 0 }) });
  const files = readdirSync(settings.paths.state);
  assert.equal(files.length, 1);
  assert.match(files[0], /^[a-f0-9]{64}\.json$/);
  assert.deepEqual(Object.keys(JSON.parse(readFileSync(join(settings.paths.state, files[0]), 'utf8'))), ['time']);
});

test('easter eggs are configurable, mutable by name, and visible in status', t => {
  const f = fixture(t);
  const env = { ...f.env }; delete env.AGENT_STARCRAFT_MUTE;
  assert.deepEqual(configuration(env).config.easterEgg, DEFAULTS.easterEgg);
  writeFileSync(env.AGENT_STARCRAFT_CONFIG, JSON.stringify({ easterEgg: { clips: ['protoss-archon-power-overwhelming'] } }));
  assert.deepEqual(configuration(env).config.easterEgg, { chance: 0.02, clips: ['protoss-archon-power-overwhelming'] });
  updateConfiguration('mute', 'easter-egg', env);
  assert.deepEqual(configuration(env).config.easterEgg, { chance: 0, clips: ['protoss-archon-power-overwhelming'] });
  const run = args => spawnSync(process.execPath, [SCRIPT, ...args], { env, encoding: 'utf8', timeout: 3000 });
  assert.match(run(['status']).stdout, /easter-egg: off/);
  assert.equal(run(['unmute', 'easter-egg']).status, 0);
  assert.equal(configuration(env).config.easterEgg.chance, DEFAULTS.easterEgg.chance);
  assert.match(run(['status']).stdout, /easter-egg: 2% protoss-archon-power-overwhelming/);
  const silent = spawnSync(process.execPath, [SCRIPT, 'play', 'approval_required', '--tool', 'Bash', '--command', 'rm -rf x'], { env: { ...env, AGENT_STARCRAFT_AUDIO_DIR: join(f.root, 'missing') }, encoding: 'utf8', timeout: 3000 });
  assert.match(silent.stderr, /Missing audio: .*terran-adjutant-(nuclear-launch|base-under-attack)\.wav/);
});

test('every configured clip ships as audio and the catalog matches the provenance manifest', () => {
  const { clips } = JSON.parse(spawnSync(process.execPath, [SCRIPT, 'list', '--json'], { encoding: 'utf8' }).stdout);
  assert.deepEqual(json('audio/sources.json').clips.map(clip => clip.id), clips);
  const used = [...Object.values(DEFAULTS.events).flatMap(rule => [...rule.clips, ...(rule.changeClips || []), ...(rule.dangerClips || [])]), ...DEFAULTS.easterEgg.clips];
  for (const clip of used) assert.ok(clips.includes(clip), clip);
  for (const clip of clips) assert.ok(readFileSync(join(ROOT, 'audio', `${clip}.wav`)).subarray(0, 4).toString() === 'RIFF', clip);
  for (const clip of json('audio/sources.json').clips) assert.ok(clip.id.startsWith({ terran: 'terran-', protoss: 'protoss-' }[clip.faction]), clip.id);
  // Every default cue has a clip in each faction, so switching factions never silences an event.
  for (const list of [...Object.values(DEFAULTS.events).flatMap(rule => [rule.clips, rule.changeClips, rule.dangerClips].filter(Boolean)), DEFAULTS.easterEgg.clips]) {
    for (const prefix of ['terran-', 'protoss-']) assert.ok(list.some(clip => clip.startsWith(prefix)), `${prefix} ${list}`);
  }
});

test('StopFailure types, quota notifications, subagent starts, and tool failures map to StarCraft cues', () => {
  for (const error of ['rate_limit', 'billing_error', 'account_on_hold']) assert.equal(normalize({ hook_event_name: 'StopFailure', error }, 'claude').event, 'out_of_minerals');
  assert.equal(normalize({ hook_event_name: 'StopFailure', error: 'max_output_tokens' }, 'claude').event, 'out_of_gas');
  for (const error of ['server_error', 'overloaded', 'invalid_request', 'unknown', undefined]) assert.equal(normalize({ hook_event_name: 'StopFailure', error }, 'claude').event, 'error');
  assert.equal(normalize({ hook_event_name: 'Notification', notification_type: 'quota_auto_resume_disabled' }, 'claude').event, 'out_of_minerals');
  assert.equal(normalize({ hook_event_name: 'Notification', notification_type: 'quota_auto_resume_stale' }, 'claude').event, 'ready_for_input');
  assert.equal(normalize({ hook_event_name: 'Notification', notification_type: 'quota_auto_resume_fired' }, 'claude'), null);
  for (const agent of ['claude', 'codex']) assert.equal(normalize({ hook_event_name: 'SubagentStart', agent_id: 'child', agent_type: 'Explore' }, agent).event, 'subagent_started');
  assert.equal(normalize({ hook_event_name: 'PostToolUseFailure', tool_name: 'Bash', error: 'Exit code 1' }, 'claude').event, 'tool_failed');
  assert.equal(normalize({ hook_event_name: 'PostToolUseFailure', tool_name: 'Bash', is_interrupt: true }, 'claude'), null);
  assert.equal(normalize({ hook_event_name: 'PostToolUseFailure', tool_name: 'Bash' }, 'codex'), null);
  assert.equal(normalize({ hook_event_name: 'AfterTool', tool_response: { error: 'x' } }, 'gemini'), null);
  for (const event of ['out_of_minerals', 'out_of_gas', 'minerals_low', 'supply_blocked', 'annoyed', 'turn_completed']) assert.equal(DEFAULTS.events[event].enabled, true, event);
  for (const event of ['tool_failed', 'subagent_started', 'context_compacting']) assert.equal(DEFAULTS.events[event].enabled, false, event);
});

test('faction selection filters clips, falls back for custom lists, and persists', t => {
  const list = ['terran-scv-jobs-finished', 'protoss-advisor-research-complete'];
  assert.deepEqual(enlist(list, 'terran'), ['terran-scv-jobs-finished']);
  assert.deepEqual(enlist(list, 'protoss'), ['protoss-advisor-research-complete']);
  assert.deepEqual(enlist(list, 'both'), list);
  assert.deepEqual(enlist(['terran-marine-go-go-go'], 'protoss'), ['terran-marine-go-go-go']);
  const f = fixture(t);
  const env = { ...f.env }; delete env.AGENT_STARCRAFT_MUTE;
  assert.equal(configuration(env).config.faction, 'terran');
  updateConfiguration('faction', 'protoss', env);
  const settings = configuration(env);
  assert.equal(settings.config.faction, 'protoss');
  const played = [];
  const options = { random: () => 0.5, player: audio => ['fake', audio], run: (command, args) => { played.push(args[0].split(/[\\/]/).at(-1)); return { status: 0 }; } };
  for (const event of ['turn_completed', 'out_of_minerals', 'supply_blocked']) playback({ agent: 'generic', session: 's', event }, settings, options);
  assert.deepEqual(played, ['protoss-advisor-upgrade-complete.wav', 'protoss-advisor-not-enough-minerals.wav', 'protoss-advisor-construct-pylons.wav']);
  const run = args => spawnSync(process.execPath, [SCRIPT, ...args], { env, encoding: 'utf8', timeout: 3000 });
  assert.equal(run(['faction', 'both']).status, 0);
  assert.match(run(['status']).stdout, /Faction: both/);
  for (const value of ['zerg', 'random-race', 'Terran']) assert.equal(run(['faction', value]).status, 1, value);
  assert.equal(run(['faction']).status, 1);
});

test('three prompts inside ten seconds annoy the SCV, per session, without storing prompt text', t => {
  const f = fixture(t);
  const { paths } = f.settings();
  const prompt = session => ({ agent: 'claude', session, event: 'prompt_submitted', prompt: 'secret prompt' });
  assert.equal(escalate(prompt('a'), paths, 0).event, 'prompt_submitted');
  assert.equal(escalate(prompt('a'), paths, 1000).event, 'prompt_submitted');
  assert.equal(escalate(prompt('b'), paths, 1500).event, 'prompt_submitted');
  assert.equal(escalate(prompt('a'), paths, 2000).event, 'annoyed');
  assert.equal(escalate(prompt('a'), paths, 2500).event, 'annoyed');
  assert.equal(escalate(prompt('a'), paths, 30000).event, 'prompt_submitted');
  assert.equal(escalate({ ...prompt('a'), event: 'approval_required' }, paths, 30001).event, 'approval_required');
  for (const name of readdirSync(paths.state)) {
    assert.match(name, /^[a-f0-9]{64}\.json$/);
    const text = readFileSync(join(paths.state, name), 'utf8');
    assert.deepEqual(Object.keys(JSON.parse(text)), ['times']);
    assert.ok(!text.includes('secret'));
  }
  writeFileSync(join(paths.state, readdirSync(paths.state)[0]), '{');
  assert.doesNotThrow(() => escalate(prompt('a'), paths, 40000));
});

test('random race picks one faction per session and plays only that faction', t => {
  assert.equal(race('terran', 'any'), 'terran');
  assert.equal(race('both', 'any'), 'both');
  const sessions = Array.from({ length: 40 }, (_, index) => `session-${index}`);
  const picks = sessions.map(session => race('random', session));
  assert.deepEqual(sessions.map(session => race('random', session)), picks);
  assert.deepEqual([...new Set(picks)].sort(), ['protoss', 'terran']);
  const f = fixture(t);
  const env = { ...f.env }; delete env.AGENT_STARCRAFT_MUTE;
  updateConfiguration('faction', 'random', env);
  const settings = configuration(env);
  settings.config.cooldownMs = 0;
  for (const session of sessions.slice(0, 8)) {
    const played = [];
    const options = { random: Math.random, player: audio => ['fake', audio], run: (command, args) => { played.push(args[0].split(/[\\/]/).at(-1)); return { status: 0 }; } };
    for (let index = 0; index < 4; index++) playback({ agent: 'generic', session, event: 'prompt_submitted' }, { ...settings, config: { ...settings.config, easterEgg: { ...settings.config.easterEgg, chance: 0 } } }, options);
    assert.ok(played.every(name => name.startsWith(`${race('random', session)}-`)), `${session} ${played}`);
  }
});

test('minerals meter reads the tightest limit and cues each rise once per session', t => {
  const config = structuredClone(DEFAULTS);
  assert.equal(minerals({}, config), null);
  assert.equal(minerals({ cost: { total_cost_usd: 3 } }, config), null);
  assert.deepEqual(minerals({ rate_limits: { five_hour: { used_percentage: 50 } } }, config), { kind: 'minerals', label: '5h', percent: 50, level: 0, text: '50% minerals (5h)' });
  const low = minerals({ rate_limits: { five_hour: { used_percentage: 20 }, seven_day: { used_percentage: 85.4 } } }, config);
  assert.equal(low.text, '15% minerals (7d) low');
  config.minerals.budgetUsd = 10;
  assert.equal(minerals({ cost: { total_cost_usd: 9 }, rate_limits: { five_hour: { used_percentage: 40 } } }, config).text, '$1.00 minerals low');
  assert.equal(minerals({ cost: { total_cost_usd: 12 } }, config).text, '$0.00 minerals out');
  const f = fixture(t);
  const { paths } = f.settings();
  const at = level => meterCue({ kind: 'minerals', level }, 'session', paths);
  assert.equal(at(0), null);
  assert.equal(at(1), 'minerals_low');
  assert.equal(at(1), null);
  assert.equal(at(2), 'out_of_minerals');
  assert.equal(at(2), null);
  assert.equal(at(0), null);
  assert.equal(at(2), 'out_of_minerals');
  assert.equal(meterCue({ kind: 'minerals', level: 1 }, 'other', paths), 'minerals_low');
});

test('supply meter shows context use against the 200 cap and cues once until the context drops', t => {
  const config = structuredClone(DEFAULTS);
  assert.equal(supply({}, config), null);
  assert.equal(supply({ context_window: { used_percentage: null } }, config), null);
  assert.deepEqual(supply({ context_window: { used_percentage: 42 } }, config), { kind: 'supply', percent: 42, level: 0, text: '84/200 supply' });
  assert.equal(supply({ context_window: { total_input_tokens: 180000, context_window_size: 200000 } }, config).text, '180/200 supply blocked');
  assert.equal(supply({ context_window: { used_percentage: 130 } }, config).text, '200/200 supply blocked');
  config.supply.lowPercent = 95;
  assert.equal(supply({ context_window: { used_percentage: 90 } }, config).level, 0);
  const f = fixture(t);
  const { paths } = f.settings();
  const at = level => meterCue({ kind: 'supply', level }, 'session', paths);
  assert.equal(at(1), 'supply_blocked');
  assert.equal(at(1), null);
  assert.equal(at(0), null);
  assert.equal(at(1), 'supply_blocked');
  assert.equal(meterCue({ kind: 'minerals', level: 1 }, 'session', paths), 'minerals_low');
  writeFileSync(f.env.AGENT_STARCRAFT_CONFIG, JSON.stringify({ supply: { lowPercent: 100 } }));
  assert.throws(() => configuration(f.env), /supply/);
  writeFileSync(f.env.AGENT_STARCRAFT_CONFIG, JSON.stringify({ gold: { lowPercent: 50 } }));
  assert.throws(() => configuration(f.env), /Unknown configuration field/);
});

test('statusline always prints one line and exits cleanly, even on bad input', t => {
  const f = fixture(t);
  const env = { ...f.env, AGENT_STARCRAFT_MUTE: '1' };
  const run = input => spawnSync(process.execPath, [SCRIPT, 'statusline'], { env, input, encoding: 'utf8', timeout: 3000 });
  const ok = run(JSON.stringify({ session_id: 's', rate_limits: { five_hour: { used_percentage: 90 } } }));
  assert.equal(ok.status, 0);
  assert.equal(ok.stdout, '◆ 10% minerals (5h) low\n');
  const both = run(JSON.stringify({ session_id: 's', rate_limits: { five_hour: { used_percentage: 18 } }, context_window: { used_percentage: 71 } }));
  assert.equal(both.stdout, '◆ 82% minerals (5h) · 142/200 supply\n');
  assert.equal(run(JSON.stringify({ context_window: { used_percentage: 90 } })).stdout, '◆ 180/200 supply blocked\n');
  for (const input of ['', 'bad json', '[]', '{}']) {
    const result = run(input);
    assert.equal(result.status, 0);
    assert.equal(result.stdout, '◆\n');
    assert.equal(result.stderr, '');
  }
  writeFileSync(f.env.AGENT_STARCRAFT_CONFIG, '{');
  assert.equal(run(JSON.stringify({ rate_limits: { five_hour: { used_percentage: 90 } } })).stdout, '◆\n');
});
