// Theme switcher — temporarily LIGHT-ONLY.
//
// The dark palette was inverting from the cream/ink light tokens 1:1 which
// produced muddy contrast on every component we'd actually styled for
// light: pricing cards, sponsored chips, the F-commerce hero gradient,
// comparison tables. Rather than ship a half-broken dark mode we pin to
// light until we can redesign dark properly (Notion/Stripe Atlas style
// warm-dark greys, NOT a token flip).
//
// To re-enable dark mode:
//   1. Restore the getTheme + toggleTheme logic from git history
//      (commit f20a44e on deployment-prod).
//   2. Uncomment the `html[data-theme="dark"]` block in src/index.css.
//   3. Un-hide the moon/sun toggle button in src/components/Navbar.jsx
//      (look for `THEME_TOGGLE_DISABLED`).

const KEY = 'dk_theme';

export function getTheme() {
  return 'light';
}

export function applyTheme(/* theme */) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', 'light');
  try { localStorage.setItem(KEY, 'light'); } catch { /* */ }
}

export function toggleTheme() {
  // No-op while dark is disabled.
  applyTheme('light');
  return 'light';
}
