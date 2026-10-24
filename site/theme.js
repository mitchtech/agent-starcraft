// Runs before first paint. The faction (Terran by default) picks voices and palette; the theme
// follows the operating system until the visitor picks Day or Night, then keeps that choice.
const factionKey = 'agent-starcraft-faction';
const themeKey = 'agent-starcraft-theme';
const root = document.documentElement;
const prefersLight = matchMedia('(prefers-color-scheme: light)');
let savedTheme = null;
try {
  if (localStorage.getItem(factionKey) === 'protoss') root.dataset.faction = 'protoss';
  savedTheme = localStorage.getItem(themeKey);
} catch {}
const systemTheme = () => (prefersLight.matches ? 'light' : 'dark');
root.dataset.faction ||= 'terran';
root.dataset.theme = ['light', 'dark'].includes(savedTheme) ? savedTheme : systemTheme();
root.dataset.pet = root.dataset.faction === 'protoss' ? 'probe' : 'scv';

document.addEventListener('DOMContentLoaded', () => {
  const factionToggle = document.querySelector('#faction-toggle');
  const themeToggle = document.querySelector('#theme-toggle');
  const render = () => {
    factionToggle.setAttribute('aria-pressed', String(root.dataset.faction === 'protoss'));
    themeToggle.setAttribute('aria-pressed', String(root.dataset.theme === 'light'));
    document.querySelector('meta[name="theme-color"]').content = getComputedStyle(root).getPropertyValue('--bg').trim();
  };
  factionToggle.addEventListener('click', () => {
    root.dataset.faction = root.dataset.faction === 'protoss' ? 'terran' : 'protoss';
    root.dataset.pet = root.dataset.faction === 'protoss' ? 'probe' : 'scv';
    try { localStorage.setItem(factionKey, root.dataset.faction); } catch {}
    render();
    document.dispatchEvent(new CustomEvent('factionchange'));
  });
  themeToggle.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
    savedTheme = root.dataset.theme;
    try { localStorage.setItem(themeKey, savedTheme); } catch {}
    render();
  });
  prefersLight.addEventListener('change', () => {
    if (savedTheme) return;
    root.dataset.theme = systemTheme();
    render();
  });
  render();
});
