import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { buildGemini } from './build-gemini.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const temporary = mkdtempSync(join(tmpdir(), "SCV's $package "));
const npmCli = process.env.npm_execpath;
assert.ok(npmCli, 'Run this check with npm run test:package');
function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', timeout: 60000, ...options });
  assert.equal(result.status, 0, `${command} ${args.join(' ')}\n${result.stderr || result.error || result.stdout}`);
  return result.stdout;
}
try {
  const [packed] = JSON.parse(run(process.execPath, [npmCli, 'pack', '--json', '--pack-destination', temporary], { cwd: root }));
  const prefix = join(temporary, 'installed');
  run(process.execPath, [npmCli, 'install', '--prefix', prefix, '--ignore-scripts', '--offline', '--no-audit', '--no-fund', join(temporary, packed.filename)]);
  const installed = join(prefix, 'node_modules', 'agent-starcraft');
  const extension = buildGemini(join(temporary, 'gemini'));
  for (const [, image] of readFileSync(join(installed, 'README.md'), 'utf8').matchAll(/(?:src="|\]\()(assets\/[^")]+)/g)) {
    assert.ok(existsSync(join(installed, image)), `README image missing from package: ${image}`);
  }
  for (const bundle of [installed, extension]) {
    const env = { ...process.env, AGENT_STARCRAFT_CONFIG: join(temporary, 'config.json'), AGENT_STARCRAFT_STATE_DIR: join(temporary, 'state'), CODEX_HOME: join(temporary, 'codex'), AGENT_STARCRAFT_PLUGIN_ROOT: bundle };
    delete env.AGENT_STARCRAFT_MUTE;
    delete env.AGENT_STARCRAFT_AUDIO_DIR;
    const cli = args => run(process.execPath, [join(bundle, 'scripts', 'starcraft.mjs'), ...args], { env });
    assert.ok(existsSync(join(bundle, 'skills', 'starcraft-control', 'SKILL.md')));
    assert.ok(JSON.parse(cli(['list', '--json'])).events.includes('ready_for_input'));
    cli(['mute', 'all']); assert.equal(JSON.parse(cli(['status', '--json'])).config.muted, true);
    cli(['unmute', 'all']); cli(['preset', 'attention']);
    assert.equal(JSON.parse(cli(['config', '--effective'])).events.prompt_submitted.enabled, false);
    // Exercise bundled art while preserving support for packages without a sprite sheet.
    for (const id of ['scv', 'probe']) {
      assert.deepEqual(readFileSync(join(bundle, 'pets', id, 'pet.json')), readFileSync(join(root, 'pets', id, 'pet.json')));
      if (existsSync(join(bundle, 'pets', id, 'spritesheet.webp'))) { cli(['pet', 'install', id]); cli(['doctor', '--pet', id]); cli(['pet', 'uninstall', id]); }
      else assert.equal(JSON.parse(cli(['pet', 'status', id, '--json'])).state, 'not-bundled');
    }
    cli(['mute', 'all']);
    const hookPath = bundle === extension ? 'hooks/hooks.json' : 'hooks/gemini.json';
    const hooks = JSON.parse(readFileSync(join(bundle, hookPath), 'utf8')).hooks;
    for (const [event, groups] of Object.entries(hooks)) {
      const hook = groups[0].hooks[0];
      const output = run(hook.command, [], { shell: true, env,
        input: JSON.stringify({ hook_event_name: event, source: 'startup', notification_type: 'ToolPermission', session_id: 'package-check' }) });
      assert.deepEqual(JSON.parse(output), {});
    }
  }
  console.log('Installed npm package and self-contained Gemini extension verified.');
} finally { rmSync(temporary, { recursive: true, force: true }); }
