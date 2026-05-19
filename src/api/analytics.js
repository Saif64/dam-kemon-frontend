// Anonymous, no-PII telemetry. The anon id is a UUID minted once per
// browser and stored in localStorage. The server treats it as best-effort
// uniqueness, never identity.
//
// All event hits go via sendBeacon so they don't add latency to the user's
// navigation. We fall back to fetch(..., {keepalive: true}) when sendBeacon
// is unavailable (older browsers, locked-down environments).

const ANON_KEY = 'dk_anon_id';

export function getAnonId() {
  try {
    let id = localStorage.getItem(ANON_KEY);
    if (!id) {
      id = (crypto && crypto.randomUUID)
        ? crypto.randomUUID()
        : `anon-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(ANON_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/api';

function fireBeacon(path, payload) {
  const url = `${baseURL}${path}`;
  const body = JSON.stringify({ ...payload, anonId: getAnonId() });
  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      if (navigator.sendBeacon(url, blob)) return;
    }
  } catch {
    /* fall through to fetch */
  }
  try {
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
      mode: 'cors',
    }).catch(() => {});
  } catch {
    /* swallow — analytics must never break the UI */
  }
}

export const trackView = (productId) => {
  if (!productId) return;
  fireBeacon('/events/view', { productId });
};

export const trackClick = (productId, sellerSlug) => {
  if (!productId && !sellerSlug) return;
  fireBeacon('/events/click', { productId, sellerSlug });
};
