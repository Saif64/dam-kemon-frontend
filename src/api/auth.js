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

export const requestMagicLink = (email) =>
  api.post('/auth/request-link', { email });

export const verifyMagicLink = (email, token) =>
  api.post('/auth/verify', { email, token });

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
