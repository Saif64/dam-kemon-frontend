// Authenticated-API client. Reads the JWT from localStorage and attaches
// it to every request as `Authorization: Bearer ...`. Falls back to the
// unauthenticated client (api.js) for public endpoints.

import api from './api';

const TOKEN_KEY = 'dk_auth_token';

export function getAuthToken() {
  try { return localStorage.getItem(TOKEN_KEY); }
  catch { return null; }
}

export function setAuthToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* private mode — auth becomes session-only */
  }
}

// Stamp every outbound request with the bearer when present.
api.interceptors.request.use((config) => {
  const t = getAuthToken();
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

// 401 → drop the token so the UI flips back to signed-out. We don't
// auto-redirect; the consuming page decides what to do.
api.interceptors.response.use(
  (r) => r,
  (e) => {
    if (e.response?.status === 401 && getAuthToken()) {
      setAuthToken(null);
    }
    return Promise.reject(e);
  }
);

/** Fixed-credential owner sign-in. Issues a 30-day JWT. */
export const passwordLogin = (username, password) =>
  api.post('/auth/login', { username, password });

export const getMe = () => api.get('/auth/me');

export const signOut = () => api.post('/auth/sign-out');

// Account endpoints
export const listSavedSearches = () => api.get('/account/saved-searches');
export const addSavedSearch = (query, notifyEmail) =>
  api.post('/account/saved-searches', { query, notifyEmail });
export const removeSavedSearch = (id) => api.delete(`/account/saved-searches/${id}`);

export const listWishlist = () => api.get('/account/wishlist');
export const addToWishlist = (productId) => api.post('/account/wishlist', { productId });
export const removeFromWishlist = (productId) => api.delete(`/account/wishlist/${productId}`);

/**
 * Patch the alert settings for a single watched product. Body may include
 * any of: targetPrice, alertOnDropPercent (0..1), notifyChannel, alertsEnabled.
 */
export const updateWishlistAlert = (productId, patch) =>
  api.patch(`/account/wishlist/${productId}`, patch);

/** In-app notification feed for the bell dropdown. */
export const listNotifications = (limit = 20) =>
  api.get('/account/notifications', { params: { limit } });

export const markNotificationsRead = () =>
  api.post('/account/notifications/read');

// ─── Saathi: FB-commerce seller toolkit ───
export const saathiSignup = (payload) => api.post('/saathi/signup', payload);
export const saathiMe = () => api.get('/saathi/me');
export const saathiUpdate = (patch) => api.patch('/saathi/me', patch);
export const saathiSubmitVerification = (payload) => api.post('/saathi/verify', payload);
export const saathiListProducts = () => api.get('/saathi/products');
export const saathiAttachProduct = (productId, listedPrice, note) =>
  api.post('/saathi/products', { productId, listedPrice, note });
export const saathiDetachProduct = (productId) =>
  api.delete(`/saathi/products/${encodeURIComponent(productId)}`);
export const saathiLiveAssist = (q) => api.get('/saathi/live-assist', { params: { q } });
export const saathiRecentQueries = (limit = 30) =>
  api.get('/saathi/queries', { params: { limit } });
export const saathiPublicProfile = (slug) =>
  api.get(`/saathi/p/${encodeURIComponent(slug)}`);
