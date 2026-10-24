#!/usr/bin/env node
import { createHash, randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, realpathSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { petMain, petStatus, printPetStatus } from './pet.mjs';

const SCRIPT = fileURLToPath(import.meta.url);
const ROOT = resolve(dirname(SCRIPT), '..');
// Clip ids start with their faction: terran- or protoss-.
const CLIPS = [
  'terran-scv-good-to-go', 'terran-battlecruiser-operational', 'terran-scv-affirmative', 'terran-scv-roger-that',
  'terran-scv-right-away-sir', 'terran-scv-orders-received', 'terran-marine-go-go-go', 'terran-marine-outstanding',
  'terran-marine-rock-and-roll', 'terran-battlecruiser-make-it-happen', 'terran-scv-cant-believe', 'terran-scv-claustrophobic',
  'terran-marine-frag-commander', 'terran-marine-neural-implants', 'terran-battlecruiser-behind-schedule', 'terran-scv-yes-sir',
  'terran-scv-orders-captain', 'terran-scv-i-read-you', 'terran-adjutant-nuclear-launch', 'terran-adjutant-base-under-attack',
  'terran-battlecruiser-receiving-transmission', 'terran-dropship-input-coordinates', 'terran-scv-reporting-for-duty',
  'terran-scv-jobs-finished', 'terran-adjutant-upgrade-complete', 'terran-adjutant-not-enough-minerals',
  'terran-adjutant-not-enough-energy', 'terran-adjutant-insufficient-gas', 'terran-adjutant-supply-depots',
  'terran-adjutant-abandoning-structure', 'terran-adjutant-landing-interrupted', 'terran-marine-death', 'terran-scv-cant-build-there',
  'terran-scv-something-in-the-way', 'terran-marine-piece-of-me', 'terran-ghost-exterminator', 'terran-siege-tank-ready',
  'terran-scv-death', 'terran-adjutant-nuclear-missile-ready', 'terran-marine-thats-the-stuff', 'terran-dropship-five-by-five',
  'protoss-zealot-my-life-for-aiur', 'protoss-carrier-has-arrived', 'protoss-zealot-thus-i-serve', 'protoss-zealot-honor-guide-me',
  'protoss-high-templar-it-shall-be-done', 'protoss-high-templar-my-path-is-set', 'protoss-carrier-commencing',
  'protoss-dragoon-confirmed', 'protoss-dark-templar-so-be-it', 'protoss-carrier-procrastinate', 'protoss-carrier-relieved',
  'protoss-carrier-idle-threat', 'protoss-high-templar-thoughts-betray', 'protoss-high-templar-lack-of-control',
  'protoss-zealot-ignorance-is-bliss', 'protoss-carrier-instructions', 'protoss-carrier-your-command', 'protoss-zealot-command-me',
  'protoss-high-templar-state-thy-bidding', 'protoss-advisor-nuclear-launch', 'protoss-advisor-under-attack',
  'protoss-dragoon-awaiting-instructions', 'protoss-zealot-i-long-for-combat', 'protoss-dragoon-i-am-needed',
  'protoss-dark-templar-im-waiting', 'protoss-advisor-research-complete', 'protoss-advisor-upgrade-complete',
  'protoss-advisor-not-enough-minerals', 'protoss-advisor-not-enough-energy', 'protoss-advisor-more-gas',
  'protoss-advisor-construct-pylons', 'protoss-archon-merging-complete', 'protoss-zealot-death', 'protoss-probe-error',
  'protoss-dragoon-i-have-returned', 'protoss-dark-templar-adun-toridas', 'protoss-high-templar-khassar', 'protoss-probe-death',
  'protoss-zealot-en-taro-adun', 'protoss-archon-power-overwhelming',
];
const FACTIONS = { terran: 'terran-', protoss: 'protoss-' };
const FACTION_CHOICES = ['terran', 'protoss', 'both', 'random'];
const CHANGES = new Set(['Bash', 'PowerShell', 'Write', 'Edit', 'NotebookEdit', 'apply_patch', 'run_shell_command', 'write_file', 'replace']);
// Destructive shell and SQL patterns. Only the resulting boolean leaves normalize(); commands are never stored.
const DANGER = [
  /\brm\b(?=[^|;&\n]*\s(?:-[a-zA-Z]*[rR]|--recursive\b))(?=[^|;&\n]*\s(?:-[a-zA-Z]*f|--force\b))/,
  /\bgit\b[^|;&\n]*\bpush\b[^|;&\n]*\s(?:--force(?![-\w])|-[a-zA-Z]*f\b)/,
  /\bgit\b[^|;&\n]*\breset\b[^|;&\n]*\s--hard\b/,
  /\bgit\b[^|;&\n]*\bclean\b[^|;&\n]*\s-[a-zA-Z]*f/,
  /\b(?:drop\s+(?:table|database|schema)|truncate\s+table)\b/i,
  /\bmkfs(?:\.\w+)?\b/,
  /\bdd\b[^|;&\n]*\bof=/,
  /\bchmod\b[^|;&\n]*\s-[a-zA-Z]*R[^|;&\n]*\s0?777\b/,
  /\bRemove-Item\b(?=[^|;&\n]*\s-Recurse\b)(?=[^|;&\n]*\s-Force\b)/i,
  /\b(?:rd|rmdir)\s+\/s\b/i,
];
// Rare variants never replace approval, input, error, or danger cues.
const EASTER_EGG_EVENTS = new Set(['session_started', 'prompt_submitted', 'ready_for_input', 'turn_completed']);
// StopFailure error types that mean the account has run out of usage, not that the request was bad.
const OUT_OF_MINERALS = new Set(['rate_limit', 'billing_error', 'account_on_hold']);
// Three prompts inside this window turn the third into an annoyed cue, as when a StarCraft unit is clicked repeatedly.
const ANNOYED = { count: 3, windowMs: 10000 };
export const DEFAULTS = {
  muted: false,
  audioDir: null,
  cooldownMs: 1000,
  faction: 'terran',
  minerals: { budgetUsd: null, lowPercent: 80 },
  supply: { lowPercent: 85 },
  easterEgg: { chance: 0.02, clips: ['terran-adjutant-nuclear-missile-ready', 'terran-marine-thats-the-stuff', 'terran-dropship-five-by-five', 'protoss-zealot-en-taro-adun', 'protoss-archon-power-overwhelming'] },
  events: {
    session_started: { enabled: true, clips: ['terran-scv-good-to-go', 'terran-battlecruiser-operational', 'protoss-zealot-my-life-for-aiur', 'protoss-carrier-has-arrived'] },
    prompt_submitted: {
      enabled: true,
      clips: ['terran-scv-affirmative', 'terran-scv-roger-that', 'terran-scv-right-away-sir', 'terran-scv-orders-received', 'terran-marine-go-go-go', 'terran-marine-outstanding', 'terran-marine-rock-and-roll', 'terran-battlecruiser-make-it-happen',
        'protoss-zealot-thus-i-serve', 'protoss-zealot-honor-guide-me', 'protoss-high-templar-it-shall-be-done', 'protoss-high-templar-my-path-is-set', 'protoss-carrier-commencing', 'protoss-dragoon-confirmed', 'protoss-dark-templar-so-be-it'],
    },
    annoyed: {
      enabled: true,
      clips: ['terran-scv-cant-believe', 'terran-scv-claustrophobic', 'terran-marine-frag-commander', 'terran-marine-neural-implants', 'terran-battlecruiser-behind-schedule',
        'protoss-carrier-procrastinate', 'protoss-carrier-relieved', 'protoss-carrier-idle-threat', 'protoss-high-templar-thoughts-betray', 'protoss-high-templar-lack-of-control', 'protoss-zealot-ignorance-is-bliss'],
    },
    approval_required: {
      enabled: true, clips: ['terran-scv-yes-sir', 'terran-scv-orders-captain', 'protoss-carrier-instructions', 'protoss-carrier-your-command', 'protoss-zealot-command-me'],
      changeClips: ['terran-scv-i-read-you', 'protoss-high-templar-state-thy-bidding'],
      dangerClips: ['terran-adjutant-nuclear-launch', 'terran-adjutant-base-under-attack', 'protoss-advisor-nuclear-launch', 'protoss-advisor-under-attack'],
    },
    input_required: { enabled: true, clips: ['terran-battlecruiser-receiving-transmission', 'terran-dropship-input-coordinates', 'protoss-dragoon-awaiting-instructions'] },
    ready_for_input: { enabled: true, clips: ['terran-scv-reporting-for-duty', 'protoss-zealot-i-long-for-combat', 'protoss-dragoon-i-am-needed', 'protoss-dark-templar-im-waiting'] },
    turn_completed: { enabled: true, clips: ['terran-scv-jobs-finished', 'terran-adjutant-upgrade-complete', 'protoss-advisor-research-complete', 'protoss-advisor-upgrade-complete'] },
    out_of_minerals: { enabled: true, clips: ['terran-adjutant-not-enough-minerals', 'protoss-advisor-not-enough-minerals'] },
    minerals_low: { enabled: true, clips: ['terran-adjutant-not-enough-energy', 'protoss-advisor-not-enough-energy'] },
    out_of_gas: { enabled: true, clips: ['terran-adjutant-insufficient-gas', 'protoss-advisor-more-gas'] },
    supply_blocked: { enabled: true, clips: ['terran-adjutant-supply-depots', 'protoss-advisor-construct-pylons'] },
    error: { enabled: false, clips: ['terran-adjutant-landing-interrupted', 'terran-marine-death', 'protoss-zealot-death'] },
    tool_failed: { enabled: false, clips: ['terran-scv-cant-build-there', 'terran-scv-something-in-the-way', 'protoss-probe-error'] },
    subagent_started: { enabled: false, clips: ['terran-marine-piece-of-me', 'terran-ghost-exterminator', 'terran-siege-tank-ready', 'protoss-dragoon-i-have-returned', 'protoss-dark-templar-adun-toridas', 'protoss-high-templar-khassar'] },
    context_compacting: { enabled: false, clips: ['terran-adjutant-abandoning-structure', 'protoss-archon-merging-complete'] },
    session_ended: { enabled: false, clips: ['terran-scv-death', 'protoss-probe-death'] },
  },
};
const ATTENTION = ['approval_required', 'input_required', 'ready_for_input', 'out_of_minerals', 'minerals_low', 'out_of_gas', 'supply_blocked'];

export function dangerous(command) {
  return typeof command === 'string' && DANGER.some(pattern => pattern.test(command));
}

export function locations(env = process.env, platform = process.platform) {
  const home = homedir();
  const configBase = platform === 'win32' ? env.APPDATA || join(home, 'AppData', 'Roaming') : env.XDG_CONFIG_HOME || join(home, '.config');
  const stateBase = platform === 'win32' ? env.LOCALAPPDATA || join(home, 'AppData', 'Local') : env.XDG_STATE_HOME || join(home, '.local', 'state');
  return {
    config: resolve(env.AGENT_STARCRAFT_CONFIG || join(configBase, 'agent-starcraft', 'config.json')),
    state: resolve(env.AGENT_STARCRAFT_STATE_DIR || join(stateBase, 'agent-starcraft')),
  };
}

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function clips(value) {
  return Array.isArray(value) && value.length > 0 && value.every(clip => CLIPS.includes(clip));
}

export function configuration(env = process.env) {
  const paths = locations(env);
  const config = structuredClone(DEFAULTS);
  const overrides = existsSync(paths.config) ? JSON.parse(readFileSync(paths.config, 'utf8')) : {};
  if (!object(overrides) || Object.keys(overrides).some(key => !Object.hasOwn(config, key))) throw new Error('Unknown configuration field');
  for (const key of ['muted', 'audioDir', 'cooldownMs', 'faction']) {
    if (Object.hasOwn(overrides, key)) config[key] = overrides[key];
  }
  if (typeof config.muted !== 'boolean' || (config.audioDir !== null && typeof config.audioDir !== 'string') || !Number.isFinite(config.cooldownMs) || config.cooldownMs < 0) throw new Error('Invalid configuration value');
  if (!FACTION_CHOICES.includes(config.faction)) throw new Error('faction must be terran, protoss, both, or random');
  if (Object.hasOwn(overrides, 'minerals')) {
    if (!object(overrides.minerals) || Object.keys(overrides.minerals).some(key => !Object.hasOwn(config.minerals, key))) throw new Error('Invalid minerals settings');
    Object.assign(config.minerals, overrides.minerals);
    const { budgetUsd, lowPercent } = config.minerals;
    if ((budgetUsd !== null && (!Number.isFinite(budgetUsd) || budgetUsd <= 0)) || !Number.isFinite(lowPercent) || lowPercent <= 0 || lowPercent >= 100) throw new Error('Invalid minerals settings');
  }
  if (Object.hasOwn(overrides, 'supply')) {
    if (!object(overrides.supply) || Object.keys(overrides.supply).some(key => !Object.hasOwn(config.supply, key))) throw new Error('Invalid supply settings');
    Object.assign(config.supply, overrides.supply);
    const { lowPercent } = config.supply;
    if (!Number.isFinite(lowPercent) || lowPercent <= 0 || lowPercent >= 100) throw new Error('Invalid supply settings');
  }
  if (Object.hasOwn(overrides, 'easterEgg')) {
    if (!object(overrides.easterEgg) || Object.keys(overrides.easterEgg).some(key => !Object.hasOwn(config.easterEgg, key))) throw new Error('Invalid easterEgg settings');
    Object.assign(config.easterEgg, overrides.easterEgg);
    const { chance } = config.easterEgg;
    if (!Number.isFinite(chance) || chance < 0 || chance > 1 || !clips(config.easterEgg.clips)) throw new Error('Invalid easterEgg settings');
  }
  if (Object.hasOwn(overrides, 'events')) {
    if (!object(overrides.events)) throw new Error('events must be an object');
    for (const [event, settings] of Object.entries(overrides.events)) {
      const defaults = Object.hasOwn(config.events, event) ? config.events[event] : null;
      if (!defaults || !object(settings) || Object.keys(settings).some(key => !Object.hasOwn(defaults, key))) throw new Error(`Invalid settings for ${event}`);
      Object.assign(defaults, settings);
      if (typeof defaults.enabled !== 'boolean' || !clips(defaults.clips) || (defaults.changeClips && !clips(defaults.changeClips)) || (defaults.dangerClips && !clips(defaults.dangerClips))) throw new Error(`Invalid sounds for ${event}`);
    }
  }
  if (env.AGENT_STARCRAFT_MUTE !== undefined) {
    if (!['0', '1'].includes(env.AGENT_STARCRAFT_MUTE)) throw new Error('AGENT_STARCRAFT_MUTE must be 0 or 1');
    config.muted = env.AGENT_STARCRAFT_MUTE === '1';
  }
  const audio = env.AGENT_STARCRAFT_AUDIO_DIR || config.audioDir;
  config.audioDir = audio ? resolve(dirname(paths.config), audio) : join(ROOT, 'audio');
  return { config, paths };
}

// Temporary files live beside their destination so rename stays on the same filesystem.
function atomicWrite(path, value) {
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  const temporary = `${path}.${randomUUID()}.tmp`;
  try {
    writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600, flag: 'wx' });
    renameSync(temporary, path);
  } finally { rmSync(temporary, { force: true }); }
}

export function updateConfiguration(command, target, env = process.env) {
  // Validate existing preferences before writing; do not silently replace a broken user config.
  const { paths } = configuration(env);
  const value = existsSync(paths.config) ? JSON.parse(readFileSync(paths.config, 'utf8')) : {};
  if (command === 'preset') {
    if (!['default', 'attention'].includes(target)) throw new Error('Presets: default, attention');
    value.events ||= {};
    for (const [event, rule] of Object.entries(DEFAULTS.events)) {
      value.events[event] ||= {};
      value.events[event].enabled = target === 'attention' ? ATTENTION.includes(event) : rule.enabled;
    }
  } else if (command === 'faction') {
    if (!FACTION_CHOICES.includes(target)) throw new Error(`Factions: ${FACTION_CHOICES.join(', ')}`);
    value.faction = target;
  } else {
    if (!['mute', 'unmute'].includes(command)) throw new Error('Unknown configuration action');
    if (target === 'all') value.muted = command === 'mute';
    else if (target === 'easter-egg') value.easterEgg = { ...value.easterEgg, chance: command === 'mute' ? 0 : DEFAULTS.easterEgg.chance };
    else {
      if (!Object.hasOwn(DEFAULTS.events, target)) throw new Error(`Specify an event, easter-egg, or all: ${Object.keys(DEFAULTS.events).join(', ')}`);
      value.events ||= {};
      value.events[target] ||= {};
      value.events[target].enabled = command === 'unmute';
    }
  }
  atomicWrite(paths.config, value);
  return configuration(env);
}

export function status(env = process.env) {
  const settings = configuration(env);
  return { ...settings, environmentOverrides: Object.fromEntries(
    ['AGENT_STARCRAFT_MUTE', 'AGENT_STARCRAFT_AUDIO_DIR', 'AGENT_STARCRAFT_CONFIG', 'AGENT_STARCRAFT_STATE_DIR']
      .filter(key => env[key] !== undefined).map(key => [key, env[key]])) };
}

function printStatus(settings) {
  console.log(`Config: ${settings.paths.config}`);
  console.log(`Muted: ${settings.config.muted}${Object.hasOwn(settings.environmentOverrides, 'AGENT_STARCRAFT_MUTE') ? ' (AGENT_STARCRAFT_MUTE overrides the saved preference)' : ''}`);
  printRules(settings.config);
}

function printRules(config) {
  console.log(`Faction: ${config.faction}`);
  for (const [event, rule] of Object.entries(config.events)) console.log(`${event}: ${rule.enabled ? enlist(rule.clips, config.faction).join('/') : 'off'}`);
  console.log(`easter-egg: ${eggs(config)}`);
  console.log(`minerals: ${config.minerals.budgetUsd ? `$${config.minerals.budgetUsd} budget` : 'rate limits'}, low at ${config.minerals.lowPercent}%`);
  console.log(`supply: blocked at ${config.supply.lowPercent}% of the context window`);
}

function eggs(config) {
  return config.easterEgg.chance ? `${+(config.easterEgg.chance * 100).toFixed(2)}% ${enlist(config.easterEgg.clips, config.faction).join('/')}` : 'off';
}

// Random keeps one race for a whole session, as a Random player keeps it for a whole game.
export function race(faction, session = 'default') {
  if (faction !== 'random') return faction;
  return createHash('sha256').update(String(session)).digest()[0] % 2 ? 'protoss' : 'terran';
}

// Keep the selected faction's clips. A custom list with none of them plays as written rather than going silent.
export function enlist(list, faction) {
  if (faction === 'both' || faction === 'random') return list;
  const own = list.filter(clip => clip.startsWith(FACTIONS[faction]));
  return own.length ? own : list;
}

export function normalize(payload, agent) {
  if (!object(payload)) return null;
  const native = payload.hook_event_name;
  if (agent === 'gemini') {
    let event;
    if (native === 'SessionStart' && (!payload.source || ['startup', 'resume', 'clear'].includes(payload.source))) event = 'session_started';
    else if (native === 'BeforeAgent') event = 'prompt_submitted';
    else if (native === 'AfterAgent' && !payload.stop_hook_active) event = 'turn_completed';
    else if (native === 'Notification' && payload.notification_type === 'ToolPermission') event = 'approval_required';
    else if (native === 'PreCompress') event = 'context_compacting';
    else if (native === 'SessionEnd') event = 'session_ended';
    return event ? { event, agent, session: typeof payload.session_id === 'string' ? payload.session_id : 'default',
      change: CHANGES.has(payload.details?.tool_name), danger: event === 'approval_required' && dangerous(payload.details?.command), fallback: false } : null;
  }
  // Only lifecycle events suppress identified subagents; their approval prompts still need attention.
  if (['SessionStart', 'Stop', 'SessionEnd', 'PreCompact'].includes(native) && payload.agent_id) return null;
  let event;
  let fallback = false;
  if (native === 'SessionStart') {
    if (payload.source && !['startup', 'resume', 'clear'].includes(payload.source)) return null;
    event = 'session_started';
  } else if (native === 'UserPromptSubmit') event = 'prompt_submitted';
  else if (native === 'PermissionRequest') event = 'approval_required';
  else if (native === 'Stop' && !payload.stop_hook_active) event = 'turn_completed';
  else if (agent === 'claude' && native === 'StopFailure') {
    event = OUT_OF_MINERALS.has(payload.error) ? 'out_of_minerals' : payload.error === 'max_output_tokens' ? 'out_of_gas' : 'error';
  } else if (native === 'PreCompact') event = 'context_compacting';
  else if (native === 'SessionEnd') event = 'session_ended';
  else if (native === 'SubagentStart') event = 'subagent_started';
  else if (agent === 'claude' && native === 'PostToolUseFailure' && !payload.is_interrupt) event = 'tool_failed';
  else if (agent === 'claude' && native === 'Notification') {
    if (payload.notification_type === 'permission_prompt') {
      event = 'approval_required';
      fallback = true;
    } else if (['idle_prompt', 'quota_auto_resume_stale'].includes(payload.notification_type)) event = 'ready_for_input';
    else if (['elicitation_dialog', 'elicitation_url_dialog', 'agent_needs_input'].includes(payload.notification_type)) event = 'input_required';
    else if (payload.notification_type === 'quota_auto_resume_disabled') event = 'out_of_minerals';
  }
  return event ? { event, agent, session: typeof payload.session_id === 'string' ? payload.session_id : 'default', change: CHANGES.has(payload.tool_name),
    danger: event === 'approval_required' && dangerous(payload.tool_input?.command), fallback } : null;
}

function executable(command, env) {
  const result = spawnSync(process.platform === 'win32' ? 'where.exe' : 'which', [command], { env, stdio: 'ignore', timeout: 2000, windowsHide: true });
  return result.status === 0;
}

export function player(audio, platform = process.platform, available = command => executable(command, process.env)) {
  if (platform === 'darwin') return available('afplay') ? ['afplay', audio] : null;
  if (platform === 'win32') {
    if (!available('powershell.exe')) return null;
    // The filename is data in an environment variable, never PowerShell source.
    return ['powershell.exe', '-NoProfile', '-NonInteractive', '-Command', '$p = New-Object System.Media.SoundPlayer; $p.SoundLocation = $env:AGENT_STARCRAFT_PLAY_FILE; $p.PlaySync()'];
  }
  if (platform === 'linux') {
    for (const command of ['paplay', 'pw-play', 'aplay']) if (available(command)) return [command, audio];
    if (available('ffplay')) return ['ffplay', '-nodisp', '-autoexit', '-loglevel', 'quiet', audio];
  }
  return null;
}

export function reserve(paths, event, config, now = Date.now(), preview = false) {
  mkdirSync(paths.state, { recursive: true, mode: 0o700 });
  const lock = join(paths.state, 'playback.lock');
  try {
    mkdirSync(lock);
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    // Playback is bounded to 10 seconds. Recover a lock abandoned by a killed worker.
    if (now - statSync(lock).mtimeMs < 30000) return null;
    rmSync(lock, { recursive: true, force: true });
    try { mkdirSync(lock); } catch { return null; }
  }
  const release = () => rmSync(lock, { recursive: true, force: true });
  try {
    if (preview) return release;
    const key = createHash('sha256').update(`${event.agent}:${event.session}:${event.event}`).digest('hex');
    const stamp = join(paths.state, `${key}.json`);
    let previous = {};
    if (existsSync(stamp)) {
      try { previous = JSON.parse(readFileSync(stamp, 'utf8')) || {}; } catch (error) {
        if (!(error instanceof SyntaxError)) throw error;
        // Timestamps are disposable cache data, unlike the user's configuration.
      }
    }
    const interval = event.fallback ? Math.max(10000, config.cooldownMs) : config.cooldownMs;
    if (Number.isFinite(previous.time) && now - previous.time < interval) {
      release();
      return null;
    }
    atomicWrite(stamp, { time: now });
    // State stores hashes and timestamps only. Remove inactive session records after a day.
    for (const name of readdirSync(paths.state)) {
      if (/^[a-f0-9]{64}\.json$/.test(name) && now - statSync(join(paths.state, name)).mtimeMs > 86400000) rmSync(join(paths.state, name));
    }
    return release;
  } catch (error) {
    release();
    throw error;
  }
}

// Session records share the hashed-name scheme above, so the same daily cleanup removes them.
function record(paths, ...parts) {
  const path = join(paths.state, `${createHash('sha256').update(parts.join(':')).digest('hex')}.json`);
  let value = {};
  try { value = JSON.parse(readFileSync(path, 'utf8')) || {}; } catch (error) {
    if (error.code !== 'ENOENT' && !(error instanceof SyntaxError)) throw error;
  }
  return { value, save: next => atomicWrite(path, next) };
}

// Turn the third prompt inside the window into an annoyed cue. Only timestamps are stored, never prompt text.
export function escalate(event, paths, now = Date.now()) {
  if (event.event !== 'prompt_submitted') return event;
  const history = record(paths, event.agent, event.session, 'prompts');
  const times = (Array.isArray(history.value.times) ? history.value.times : [])
    .filter(time => Number.isFinite(time) && now - time < ANNOYED.windowMs).concat(now).slice(-ANNOYED.count);
  history.save({ times });
  return times.length >= ANNOYED.count ? { ...event, event: 'annoyed' } : event;
}

// The tightest of the configured budget and any rate limit the host reports decides how many minerals are left.
export function minerals(input, config) {
  const used = [];
  const cost = input?.cost?.total_cost_usd;
  if (config.minerals.budgetUsd && Number.isFinite(cost)) used.push({ label: 'budget', percent: cost / config.minerals.budgetUsd * 100 });
  for (const [key, label] of [['five_hour', '5h'], ['seven_day', '7d'], ['spend_limit', 'spend']]) {
    const percent = input?.rate_limits?.[key]?.used_percentage;
    if (Number.isFinite(percent)) used.push({ label, percent });
  }
  if (!used.length) return null;
  const tightest = used.reduce((a, b) => (b.percent > a.percent ? b : a));
  const level = tightest.percent >= 100 ? 2 : tightest.percent >= config.minerals.lowPercent ? 1 : 0;
  const left = tightest.label === 'budget'
    ? `$${Math.max(0, config.minerals.budgetUsd - cost).toFixed(2)}` : `${Math.max(0, Math.round(100 - tightest.percent))}%`;
  return { kind: 'minerals', ...tightest, level, text: `${left} minerals${tightest.label === 'budget' ? '' : ` (${tightest.label})`}${['', ' low', ' out'][level]}` };
}

// Context window use, shown as supply against the 200 cap. Claude Code counts input tokens only.
export function supply(input, config) {
  const window = input?.context_window;
  let percent = window?.used_percentage;
  if (!Number.isFinite(percent) && Number.isFinite(window?.total_input_tokens) && window?.context_window_size > 0) {
    percent = window.total_input_tokens / window.context_window_size * 100;
  }
  if (!Number.isFinite(percent)) return null;
  const level = percent >= config.supply.lowPercent ? 1 : 0;
  const used = Math.min(200, Math.max(0, Math.round(percent * 2)));
  return { kind: 'supply', percent, level, text: `${used}/200 supply${level ? ' blocked' : ''}` };
}

const METER_CUES = { minerals: ['', 'minerals_low', 'out_of_minerals'], supply: ['', 'supply_blocked'] };

// Cue each rise in a meter's level once per session. Falling back below a level, as when a window resets or the context compacts, re-arms it.
export function meterCue(meter, session, paths) {
  const state = record(paths, 'statusline', session, meter.kind);
  const previous = Number.isInteger(state.value.level) ? state.value.level : 0;
  if (meter.level !== previous) state.save({ level: meter.level });
  return meter.level > previous ? METER_CUES[meter.kind][meter.level] : null;
}

export function playback(event, settings, options = {}) {
  const { config, paths } = settings;
  const rule = config.events[event.event];
  if (!rule || config.muted || !rule.enabled) return false;
  const random = options.random || Math.random;
  const egg = config.easterEgg;
  const choices = enlist(event.danger && rule.dangerClips ? rule.dangerClips
    : event.change && rule.changeClips ? rule.changeClips
      : EASTER_EGG_EVENTS.has(event.event) && !event.danger && !event.change && random() < egg.chance ? egg.clips : rule.clips, race(config.faction, event.session));
  const clip = options.clip || choices[Math.floor(random() * choices.length)];
  if (!CLIPS.includes(clip)) throw new Error('Unknown clip');
  const audio = join(config.audioDir, `${clip}.wav`);
  if (!existsSync(audio)) throw new Error(`Missing audio: ${audio}`);
  const command = (options.player || player)(audio);
  if (!command) throw new Error('No supported audio player found; run agent-starcraft doctor');
  const release = reserve(paths, event, config, Date.now(), options.preview === true);
  if (!release) return false;
  try {
    const result = (options.run || spawnSync)(command[0], command.slice(1), {
      stdio: 'ignore', timeout: 10000, windowsHide: true,
      env: { ...process.env, AGENT_STARCRAFT_PLAY_FILE: audio },
    });
    if (result.error || result.status !== 0) throw new Error('Audio player failed');
    return true;
  } finally { release(); }
}

function schedule(event) {
  const child = spawn(process.execPath, [SCRIPT, '_play', JSON.stringify(event)], {
    detached: true, stdio: 'ignore', windowsHide: true,
  });
  child.on('error', () => {});
  child.unref();
}

function doctor() {
  const settings = configuration();
  const { config, paths } = settings;
  console.log(`Agent StarCraft | Node ${process.version} | ${process.platform}`);
  console.log(`Config: ${paths.config} (${existsSync(paths.config) ? 'loaded' : 'defaults'})`);
  console.log(`Audio: ${config.audioDir}`);
  console.log(`State: ${paths.state}`);
  console.log(`Muted: ${config.muted}`);
  const command = player(join(config.audioDir, `${CLIPS[0]}.wav`));
  console.log(`Player: ${command ? command[0] : 'MISSING'}`);
  const missing = CLIPS.filter(clip => !existsSync(join(config.audioDir, `${clip}.wav`)));
  console.log(`Clips: ${missing.length ? `missing ${missing.join(', ')}` : `all ${CLIPS.length} available`}`);
  printRules(config);
  printPetStatus();
  return command && !missing.length ? 0 : 1;
}

export async function main(argv = process.argv.slice(2)) {
  const [command, ...args] = argv;
  const quiet = ['hook', '_play', 'statusline'].includes(command);
  try {
    if (command === '_play') {
      playback(JSON.parse(args[0]), configuration());
      return 0;
    }
    if (command === 'pet') return petMain(args);
    if (command === 'doctor') {
      const { values, positionals } = parseArgs({ args, options: { pet: { type: 'boolean', default: false } }, allowPositionals: true });
      if (positionals.length > (values.pet ? 1 : 0)) throw new Error('Usage: agent-starcraft doctor [--pet [scv|probe]]');
      if (values.pet) {
        const status = petStatus(process.env, positionals[0] ?? 'scv');
        printPetStatus(status);
        return status.state === 'matching' ? 0 : 1;
      }
      return doctor();
    }
    if (['status', 'config'].includes(command)) {
      const { values } = parseArgs({ args, options: { json: { type: 'boolean' }, effective: { type: 'boolean' } } });
      if (command === 'config' && !values.effective) {
        console.log(JSON.stringify(DEFAULTS, null, 2));
        return 0;
      }
      const current = status();
      if (command === 'config') console.log(JSON.stringify(current.config, null, 2));
      else if (values.json) console.log(JSON.stringify(current, null, 2));
      else printStatus(current);
      return 0;
    }
    if (['mute', 'unmute', 'preset', 'faction'].includes(command)) {
      const usage = { preset: 'default|attention', faction: FACTION_CHOICES.join('|') }[command] || 'EVENT|easter-egg|all';
      if (args.length !== 1) throw new Error(`Usage: agent-starcraft ${command} ${usage}`);
      updateConfiguration(command, args[0]);
      printStatus(status());
      return 0;
    }
    if (command === 'list') {
      const { values } = parseArgs({ args, options: { json: { type: 'boolean' } } });
      const catalog = { clips: CLIPS, events: Object.keys(DEFAULTS.events), presets: ['default', 'attention'], factions: FACTION_CHOICES };
      console.log(values.json ? JSON.stringify(catalog, null, 2) : Object.entries(catalog).map(([key, items]) => `${key}: ${items.join(', ')}`).join('\n'));
      return 0;
    }
    if (command === 'hook') {
      const { values } = parseArgs({ args, options: { agent: { type: 'string' } } });
      if (!['claude', 'codex', 'gemini'].includes(values.agent)) throw new Error('Specify --agent claude, codex, or gemini');
      // Gemini always receives neutral JSON, including malformed-input/config paths.
      if (values.agent === 'gemini') console.log('{}');
      let input = '';
      process.stdin.setEncoding('utf8');
      for await (const chunk of process.stdin) {
        input += chunk;
        if (input.length > 1024 * 1024) return 0;
      }
      // Codex Stop accepts JSON output. An empty object never alters the agent's decisions.
      const payload = JSON.parse(input);
      if (values.agent === 'codex' && payload?.hook_event_name === 'Stop') console.log('{}');
      const { config, paths } = configuration();
      const event = normalize(payload, values.agent);
      if (!event || config.muted) return 0;
      // A broken prompt history must never cost the ordinary prompt cue.
      let cue = event;
      try { cue = escalate(event, paths); } catch {}
      if (config.events[cue.event].enabled) schedule(cue);
      return 0;
    }
    if (command === 'statusline') {
      // The status line must always print, so every failure degrades to the bare mineral.
      let input = '';
      process.stdin.setEncoding('utf8');
      for await (const chunk of process.stdin) {
        input += chunk;
        if (input.length > 1024 * 1024) break;
      }
      let text = '◆';
      try {
        const payload = JSON.parse(input);
        const { config, paths } = configuration();
        const meters = [minerals(payload, config), supply(payload, config)].filter(Boolean);
        if (meters.length) {
          text = `◆ ${meters.map(meter => meter.text).join(' · ')}`;
          const session = typeof payload.session_id === 'string' ? payload.session_id : 'default';
          // At most one cue per update; the minerals alarm outranks supply.
          const cue = meters.map(meter => meterCue(meter, session, paths)).find(Boolean);
          if (cue && !config.muted && config.events[cue].enabled) schedule({ event: cue, agent: 'claude', session, change: false, danger: false, fallback: false });
        }
      } catch {}
      console.log(text);
      return 0;
    }
    if (command === 'play' || command === 'preview') {
      const { values, positionals } = parseArgs({ args, allowPositionals: true, options: { session: { type: 'string', default: 'default' }, tool: { type: 'string' }, command: { type: 'string' } } });
      if (positionals.length !== 1) throw new Error(`Usage: agent-starcraft ${command} ${command === 'play' ? 'EVENT' : 'CLIP'}`);
      const settings = configuration();
      const event = { event: positionals[0], agent: 'generic', session: values.session, change: CHANGES.has(values.tool), danger: dangerous(values.command) };
      if (command === 'preview') {
        if (!CLIPS.includes(positionals[0])) throw new Error(`Clips: ${CLIPS.join(', ')}`);
        event.event = 'session_started';
        settings.config.muted = false;
        settings.config.events.session_started.enabled = true;
        if (!playback(event, settings, { clip: positionals[0], preview: true })) {
          console.error('Agent StarCraft: another sound is playing; try the preview again.');
          return 1;
        }
      } else {
        if (!Object.hasOwn(DEFAULTS.events, event.event)) throw new Error(`Events: ${Object.keys(DEFAULTS.events).join(', ')}`);
        playback(event, settings);
      }
      return 0;
    }
    if (command && !['--help', '-h'].includes(command)) throw new Error(`Unknown command: ${command}`);
    console.log('Agent StarCraft\n\nagent-starcraft hook --agent claude|codex|gemini\nagent-starcraft play EVENT [--session ID] [--tool TOOL] [--command CMD]\nagent-starcraft preview CLIP\nagent-starcraft pet install [scv|probe] [--replace]\nagent-starcraft pet status [scv|probe] [--json]\nagent-starcraft pet uninstall [scv|probe]\nagent-starcraft doctor [--pet [scv|probe]]\nagent-starcraft config [--effective]\nagent-starcraft status [--json]\nagent-starcraft mute EVENT|easter-egg|all\nagent-starcraft unmute EVENT|easter-egg|all\nagent-starcraft preset default|attention\nagent-starcraft faction terran|protoss|both|random\nagent-starcraft statusline  (reads Claude Code status line JSON on stdin)\nagent-starcraft list [--json]');
    return 0;
  } catch (error) {
    if (!quiet) console.error(`Agent StarCraft: ${error.message}`);
    return quiet ? 0 : 1;
  }
}

if (process.argv[1] && realpathSync(process.argv[1]) === SCRIPT) process.exitCode = await main();
