// Up-to-4 product ids the user has staged for comparison. Persisted to
// localStorage so the queue survives page nav; surfaced via the floating
// CompareBar at the bottom of every page once the queue is non-empty.

const KEY = 'dk_compare_queue';
const MAX = 4;
const LISTENERS = new Set();

export function getQueue() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.slice(0, MAX) : [];
  } catch { return []; }
}

function persist(arr) {
  try { localStorage.setItem(KEY, JSON.stringify(arr.slice(0, MAX))); }
  catch { /* private mode */ }
  LISTENERS.forEach((fn) => fn(arr));
}

export function toggle(id) {
  if (!id) return;
  const cur = getQueue();
  const idx = cur.indexOf(id);
  if (idx >= 0) cur.splice(idx, 1);
  else if (cur.length < MAX) cur.push(id);
  persist(cur);
}

export function remove(id) {
  persist(getQueue().filter((x) => x !== id));
}

export function clear() {
  persist([]);
}

export function inQueue(id) {
  return getQueue().includes(id);
}

export function subscribe(fn) {
  LISTENERS.add(fn);
  return () => LISTENERS.delete(fn);
}

// Reflect cross-tab edits.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) LISTENERS.forEach((fn) => fn(getQueue()));
  });
}
