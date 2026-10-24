const canvas = document.querySelector('#scope');
const ctx = canvas.getContext('2d');
const panel = canvas.closest('.portrait-panel');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const status = document.querySelector('#audio-status');
const readout = {
  unit: document.querySelector('#readout-unit'),
  line: document.querySelector('#readout-line'),
  event: document.querySelector('#readout-event'),
  length: document.querySelector('#readout-length'),
};
const faction = () => (document.documentElement.dataset.faction === 'protoss' ? 'protoss' : 'terran');
const player = new Audio();
player.preload = 'auto';
let audioContext;
let analyzer;
let samples;
let activeButton;
let raf = 0;
let noise = 0;

// The portrait is a monitor in every theme; only the phosphor color follows the faction.
const trace = () => (faction() === 'protoss' ? '#4fd3ff' : '#46e07a');

function fit() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const { width, height } = canvas.getBoundingClientRect();
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
}

// An original faction emblem stands in for a unit portrait: plating rings for Terran, a crystal for Protoss.
function emblem(alpha) {
  const { width, height } = canvas;
  const size = height * 0.26;
  ctx.save();
  ctx.translate(width / 2, height * 0.42);
  ctx.strokeStyle = trace();
  ctx.globalAlpha = alpha;
  ctx.lineWidth = Math.max(2, width / 180);
  ctx.beginPath();
  if (faction() === 'protoss') {
    ctx.moveTo(0, -size); ctx.lineTo(size * 0.55, 0); ctx.lineTo(0, size); ctx.lineTo(-size * 0.55, 0); ctx.closePath();
    ctx.moveTo(-size * 1.1, -size * 0.1); ctx.quadraticCurveTo(0, -size * 0.55, size * 1.1, -size * 0.1);
  } else {
    for (let side = 0; side < 6; side++) {
      const angle = (Math.PI / 3) * side - Math.PI / 2;
      ctx[side ? 'lineTo' : 'moveTo'](Math.cos(angle) * size, Math.sin(angle) * size);
    }
    ctx.closePath();
    for (const y of [-0.3, 0, 0.3]) { ctx.moveTo(-size * 0.55, y * size); ctx.lineTo(size * 0.55, y * size); }
  }
  ctx.stroke();
  ctx.restore();
}

function backdrop(fade = 1) {
  const { width, height } = canvas;
  ctx.fillStyle = `rgba(4, 7, 9, ${fade})`;
  ctx.fillRect(0, 0, width, height);
  const vignette = ctx.createRadialGradient(width / 2, height / 2, height * 0.1, width / 2, height / 2, height * 0.8);
  vignette.addColorStop(0, 'rgba(255, 255, 255, 0.04)');
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.55)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
}

// Transmission static: a deterministic speckle so the idle monitor looks alive without animating.
function staticNoise(seed, amount) {
  const { width, height } = canvas;
  let state = seed;
  ctx.fillStyle = 'rgba(200, 220, 230, 0.07)';
  for (let i = 0; i < amount; i++) {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    const x = state % width;
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    ctx.fillRect(x, state % height, 2, 2);
  }
}

function stroke(points, gain = 1) {
  const { width, height } = canvas;
  const color = trace();
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, width / 260);
  ctx.lineJoin = 'round';
  ctx.shadowColor = color;
  ctx.shadowBlur = width / 40;
  ctx.beginPath();
  points.forEach((value, index) => {
    const x = (index / (points.length - 1)) * width;
    const y = height * 0.78 - Math.max(-1, Math.min(1, value * gain)) * height * 0.18;
    if (index) ctx.lineTo(x, y); else ctx.moveTo(x, y);
  });
  ctx.stroke();
  ctx.restore();
}

function idle() {
  cancelAnimationFrame(raf);
  backdrop();
  staticNoise(7, Math.round((canvas.width * canvas.height) / 900));
  emblem(0.55);
  stroke(Array.from({ length: 200 }, (_, i) => Math.sin(i * 0.07) * 0.04 + Math.sin(i * 0.9) * 0.008));
}

function live() {
  analyzer.getFloatTimeDomainData(samples);
  backdrop(0.4);
  staticNoise(++noise, Math.round((canvas.width * canvas.height) / 1400));
  emblem(0.9);
  // Speech rarely peaks past a third of full scale, so the live trace is amplified to fill its band.
  stroke(samples, 2.6);
  raf = requestAnimationFrame(live);
}

// Reduced motion: draw the whole clip's amplitude envelope once instead of animating.
async function envelope(url) {
  const buffer = await audioContext.decodeAudioData(await (await fetch(url)).arrayBuffer());
  const channel = buffer.getChannelData(0);
  const columns = 200;
  const step = Math.floor(channel.length / columns) || 1;
  const peaks = Array.from({ length: columns }, (_, column) => {
    let peak = 0;
    for (let i = column * step; i < (column + 1) * step && i < channel.length; i++) peak = Math.max(peak, Math.abs(channel[i]));
    return peak;
  });
  backdrop();
  emblem(0.9);
  stroke(peaks.flatMap(peak => [peak, -peak]));
}

function ensureAudio() {
  if (audioContext) return audioContext.resume();
  audioContext = new AudioContext();
  analyzer = audioContext.createAnalyser();
  analyzer.fftSize = 2048;
  samples = new Float32Array(analyzer.fftSize);
  audioContext.createMediaElementSource(player).connect(analyzer);
  analyzer.connect(audioContext.destination);
  return audioContext.resume();
}

// Demo economy: each preview costs 50 minerals, the SCVs keep mining, and an empty bank gets the advisor's line.
const COST = 50;
const minerals = { value: 400, max: 400, node: document.querySelector('#minerals') };
const gas = { value: 0, node: document.querySelector('#gas') };
setInterval(() => {
  if (minerals.value < minerals.max) { minerals.value = Math.min(minerals.max, minerals.value + 8); minerals.node.textContent = minerals.value; }
}, 1000);
const BROKE = {
  terran: {"clip": "terran-adjutant-not-enough-minerals", "line": "Not enough minerals.", "length": "1.84", "unit": "Adjutant"},
  protoss: {"clip": "protoss-advisor-not-enough-minerals", "line": "You have not enough minerals.", "length": "1.79", "unit": "Advisor"},
};

function spend() {
  const chip = minerals.node.parentElement;
  if (minerals.value < COST) {
    chip.classList.remove('broke');
    void chip.offsetWidth;
    chip.classList.add('broke');
    return false;
  }
  minerals.value -= COST;
  minerals.node.textContent = minerals.value;
  gas.node.textContent = ++gas.value;
  chip.dataset.delta = `-${COST}`;
  chip.classList.remove('spent');
  void chip.offsetWidth;
  chip.classList.add('spent');
  return true;
}

function settle(message) {
  panel.classList.remove('live', 'pissed');
  activeButton?.classList.remove('playing');
  activeButton = null;
  if (!reducedMotion.matches) idle();
  if (message) status.textContent = message;
}

async function play(source, { free = false } = {}) {
  let { clip, line, event, length, unit } = source.dataset || source;
  if (!free && !spend()) {
    ({ clip, line, length, unit } = BROKE[faction()]);
    event = 'out_of_minerals · the demo bank is empty';
  }
  const button = source instanceof HTMLElement ? source : null;
  activeButton?.classList.remove('playing');
  activeButton = button;
  readout.unit.textContent = unit;
  readout.line.textContent = line;
  readout.event.textContent = event;
  readout.length.textContent = `${length} s`;
  const url = `audio/${clip}.wav`;
  try {
    await ensureAudio();
    player.src = url;
    await player.play();
    if (activeButton !== button) return;
    button?.classList.add('playing');
    panel.classList.add('live');
    status.textContent = `Playing: ${line}`;
    cancelAnimationFrame(raf);
    if (reducedMotion.matches) await envelope(url);
    else live();
  } catch {
    if (activeButton === button) settle('Playback unavailable. Check your browser audio settings or try agent-starcraft preview.');
  }
}

player.addEventListener('ended', () => settle('Preview finished. Awaiting instructions: pick another line.'));
document.querySelectorAll('[data-clip]').forEach(button => button.addEventListener('click', () => play(button)));

// The portrait answers like a StarCraft unit: the third click inside ten seconds gets the pissed lines.
const LINES = {
  terran: {
    what: [
    ["terran-scv-yes-sir", "Yes, sir?", "0.78", "SCV"],
    ["terran-scv-orders-captain", "Orders, Captain?", "1.09", "SCV"],
    ["terran-scv-i-read-you", "I read you.", "1.10", "SCV"],
    ["terran-scv-reporting-for-duty", "Reporting for duty.", "1.18", "SCV"]],
    pissed: [
    ["terran-scv-cant-believe", "I can't believe they put me in one of these things.", "2.19", "SCV"],
    ["terran-scv-claustrophobic", "I told 'em I was claustrophobic. I gotta get outta here!", "3.29", "SCV"],
    ["terran-marine-frag-commander", "I vote we frag this commander.", "2.61", "Marine"],
    ["terran-marine-neural-implants", "If it weren't for these damn neural implants, you'd be a smoking crater by now!", "4.27", "Marine"],
    ["terran-battlecruiser-behind-schedule", "We are getting way behind schedule.", "2.80", "Battlecruiser"]],
  },
  protoss: {
    what: [
    ["protoss-carrier-instructions", "Instructions?", "1.31", "Carrier"],
    ["protoss-carrier-your-command", "Your command?", "1.37", "Carrier"],
    ["protoss-zealot-command-me", "Command me.", "1.19", "Zealot"],
    ["protoss-dragoon-awaiting-instructions", "Awaiting instructions.", "1.49", "Dragoon"]],
    pissed: [
    ["protoss-carrier-procrastinate", "And still you procrastinate!", "2.55", "Carrier"],
    ["protoss-carrier-relieved", "Command, or you will be relieved.", "3.11", "Carrier"],
    ["protoss-carrier-idle-threat", "This is not an idle threat.", "2.47", "Carrier"],
    ["protoss-high-templar-thoughts-betray", "Your thoughts betray you.", "1.96", "High Templar"],
    ["protoss-high-templar-lack-of-control", "I find your lack of control disturbing.", "2.92", "High Templar"],
    ["protoss-zealot-ignorance-is-bliss", "It is said that ignorance is bliss. Tell me, is that true?", "4.93", "Zealot"]],
  },
};
const clicks = [];
let pissedIndex = 0;
document.querySelector('#portrait').addEventListener('click', () => {
  const now = Date.now();
  clicks.push(now);
  while (clicks.length && now - clicks[0] > 10000) clicks.shift();
  const set = LINES[faction()];
  const annoyed = clicks.length >= 3;
  const [clip, line, length, unit] = annoyed ? set.pissed[pissedIndex++ % set.pissed.length] : set.what[Math.floor(Math.random() * set.what.length)];
  play({ clip, line, length, unit, event: annoyed ? 'annoyed · third click inside 10 s' : 'ready_for_input' }, { free: true }).then(() => {
    if (annoyed) panel.classList.add('pissed');
  });
});

// Command card: twelve hotkeys, voiced by whichever faction is selected.
const CARD = [
  ["R", "Ready", "session_started", ["terran-scv-good-to-go", "SCV good to go, sir.", "1.71", "SCV"], ["protoss-zealot-my-life-for-aiur", "My life for Aiur!", "1.76", "Zealot"]],
  ["A", "Roger", "prompt_submitted", ["terran-scv-affirmative", "Affirmative.", "0.84", "SCV"], ["protoss-zealot-thus-i-serve", "Thus I serve.", "1.51", "Zealot"]],
  ["Y", "Approve", "approval_required", ["terran-scv-orders-captain", "Orders, Captain?", "1.09", "SCV"], ["protoss-carrier-your-command", "Your command?", "1.37", "Carrier"]],
  ["I", "Idle", "ready_for_input", ["terran-scv-reporting-for-duty", "Reporting for duty.", "1.18", "SCV"], ["protoss-zealot-i-long-for-combat", "I long for combat.", "1.81", "Zealot"]],
  ["J", "Finished", "turn_completed", ["terran-scv-jobs-finished", "Job's finished.", "0.97", "SCV"], ["protoss-advisor-research-complete", "Research complete.", "1.23", "Advisor"]],
  ["M", "Minerals", "out_of_minerals", ["terran-adjutant-not-enough-minerals", "Not enough minerals.", "1.84", "Adjutant"], ["protoss-advisor-not-enough-minerals", "You have not enough minerals.", "1.79", "Advisor"]],
  ["G", "Gas", "out_of_gas", ["terran-adjutant-insufficient-gas", "Insufficient vespene gas.", "2.48", "Adjutant"], ["protoss-advisor-more-gas", "You require more vespene gas.", "2.16", "Advisor"]],
  ["S", "Supply", "supply_blocked", ["terran-adjutant-supply-depots", "Additional supply depots required.", "2.94", "Adjutant"], ["protoss-advisor-construct-pylons", "You must construct additional pylons!", "2.47", "Advisor"]],
  ["N", "Nuke", "approval_required · destructive", ["terran-adjutant-nuclear-launch", "Nuclear launch detected.", "2.21", "Adjutant"], ["protoss-advisor-nuclear-launch", "Nuclear launch detected.", "1.84", "Advisor"]],
  ["T", "Train", "subagent_started", ["terran-marine-piece-of-me", "You want a piece of me, boy?", "1.72", "Marine"], ["protoss-dragoon-i-have-returned", "I have returned.", "1.45", "Dragoon"]],
  ["C", "Compact", "context_compacting", ["terran-adjutant-abandoning-structure", "Abandoning auxiliary structure.", "2.57", "Adjutant"], ["protoss-archon-merging-complete", "The merging is complete.", "2.65", "Archon"]],
  ["B", "Build", "tool_failed", ["terran-scv-cant-build-there", "I can't build there.", "1.57", "SCV"], ["protoss-probe-error", "(probe error chirp)", "1.94", "Probe"]],
];
const card = document.querySelector('#command-card');
const hotkeys = new Map();
function renderCard() {
  card.replaceChildren(...CARD.map(([key, label, event, terran, protoss]) => {
    const [clip, line, length, unit] = faction() === 'protoss' ? protoss : terran;
    const button = document.createElement('button');
    button.className = 'cmd';
    Object.assign(button.dataset, { clip, line, event, length, unit });
    button.setAttribute('aria-label', `${line} (${event}), hotkey ${key}`);
    button.setAttribute('aria-keyshortcuts', key);
    button.innerHTML = `<b aria-hidden="true">${key}</b><span aria-hidden="true">${label}</span>`;
    button.addEventListener('click', () => play(button));
    hotkeys.set(key.toLowerCase(), button);
    return button;
  }));
}
renderCard();
document.addEventListener('factionchange', () => {
  renderCard();
  // Reset the readout to the new faction's standby unit.
  const [, line, , unit] = LINES[faction()].what.at(-1);
  readout.unit.textContent = unit;
  readout.line.textContent = line;
  readout.event.textContent = 'Click the portrait';
  readout.length.textContent = '';
  if (!panel.classList.contains('live')) idle();
});
document.addEventListener('keydown', event => {
  if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) return;
  if (event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable]')) return;
  const button = hotkeys.get(event.key.toLowerCase());
  if (!button) return;
  event.preventDefault();
  button.focus({ preventScroll: true });
  play(button);
});

new ResizeObserver(() => { fit(); if (!panel.classList.contains('live')) idle(); }).observe(canvas);
fit();
idle();

document.querySelectorAll('[data-copy]').forEach(button => button.addEventListener('click', async () => {
  const copyStatus = document.querySelector('#copy-status');
  try {
    await navigator.clipboard.writeText(document.getElementById(button.dataset.copy).innerText);
    copyStatus.textContent = 'Commands copied.';
    button.textContent = 'Copied';
    button.classList.add('copied');
    setTimeout(() => { button.textContent = 'Copy'; button.classList.remove('copied'); }, 2000);
  } catch { copyStatus.textContent = 'Clipboard unavailable. Select and copy the commands above.'; }
}));
