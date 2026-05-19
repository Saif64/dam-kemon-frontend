// Persists the last N product ids the user opened, in localStorage.
// The recently-viewed rail on Home hydrates these via /api/products/by-ids.

const KEY = 'dk_recent_products';
const MAX = 12;

export function getRecentIds() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

export function pushRecent(productId) {
  if (!productId) return;
  try {
    const cur = getRecentIds().filter((id) => id !== productId);
    cur.unshift(productId);
    localStorage.setItem(KEY, JSON.stringify(cur.slice(0, MAX)));
  } catch { /* private mode */ }
}

export function clearRecent() {
  try { localStorage.removeItem(KEY); } catch { /* */ }
}
