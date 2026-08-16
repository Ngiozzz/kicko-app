// Injects the actual light/dark CSS custom properties that
// @kicko/shared's web theme (theme.web.ts) references via var(--token),
// and provides the toggle — ported 1:1 from Kicko/docs/shared.css's
// :root / html.dark blocks and shared.js's toggleMode().
const STORAGE_KEY = 'kicko-theme';
const STYLE_TAG_ID = 'kicko-theme-vars';

const ROOT_CSS = `
:root {
  --bg: #F7F4EF;
  --surface: #EAE3D7;
  --surface-2: #E0D7C8;
  --text: #1E2126;
  --text-soft: #5A5F66;
  --accent: #C08A3E;
  --accent-soft: rgba(192,138,62,0.14);
  --accent-text: #1E2126;
  --border: rgba(30,33,38,0.17);
  --shadow: rgba(30,33,38,0.12);
  --good: #3C7A5C;
}
html.dark {
  --bg: #1E2126;
  --surface: #262A31;
  --surface-2: #2D323A;
  --text: #F3EFE6;
  --text-soft: #9B9E9F;
  --accent: #D9A857;
  --accent-soft: rgba(217,168,87,0.16);
  --accent-text: #1E2126;
  --border: rgba(255,255,255,0.10);
  --shadow: rgba(0,0,0,0.35);
  --good: #6FBE95;
}
html, body { transition: background-color .2s ease, color .2s ease; }
`;

function applyColorScheme(dark: boolean) {
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  let meta = document.querySelector('meta[name="color-scheme"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'color-scheme');
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', dark ? 'dark' : 'light');
}

export function injectThemeVars() {
  if (typeof document === 'undefined' || document.getElementById(STYLE_TAG_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_TAG_ID;
  style.textContent = ROOT_CSS;
  document.head.appendChild(style);

  const dark = localStorage.getItem(STORAGE_KEY) === 'dark';
  document.documentElement.classList.toggle('dark', dark);
  applyColorScheme(dark);

  // Same two dark-mode problems _layout.tsx used to fight with a hardcoded
  // light value: RNW's reset stylesheet has a
  // `@media (prefers-color-scheme: dark) { body { background: ... !important } }`
  // rule, and Chrome's own "force dark" pass can repaint pixels regardless
  // of computed styles. Pointing the !important override at var(--bg)
  // instead of a literal color means it keeps winning in both themes as
  // the toggle changes, not just in light mode.
  document.documentElement.style.setProperty('background-color', 'var(--bg)', 'important');
  document.body.style.setProperty('background-color', 'var(--bg)', 'important');
}

export function isDarkMode(): boolean {
  return typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
}

export function setDarkMode(dark: boolean) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', dark);
  localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light');
  applyColorScheme(dark);
}
