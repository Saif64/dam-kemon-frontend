import axios from 'axios';
import { getAnonId } from './analytics';

// VITE_API_URL — leave blank for dev (Vite proxies /api) or same-origin prod
// (reverse-proxy /api → backend). Set to e.g. https://api.example.com if the
// backend lives on a different domain.
const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/api';

const api = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const id = getAnonId();
  if (id) config.headers['X-Anon-Id'] = id;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status !== 429) {
      console.error('API Error:', error.response?.data || error.message);
    }
    return Promise.reject(error);
  }
);

export const searchProducts = (query, page = 0, size = 20) =>
  api.get('/search', { params: { q: query, page, size } });

/** Autocomplete dropdown — returns up to N matching products by prefix. */
export const suggestProducts = (prefix, limit = 8) =>
  api.get('/search/suggest', { params: { q: prefix, limit } });

/** Trigger the nightly catalog reindex on demand. */
export const triggerReindex = () => api.post('/admin/index/run');
export const indexStatus = () => api.get('/admin/index/status');
export const listShops = () => api.get('/admin/shops');
export const retryFailedShops = () => api.post('/admin/index/retry');
export const reindexShop = (slug) => api.post(`/admin/index/shop/${encodeURIComponent(slug)}`);
export const setShopStatus = (slug, status) =>
  api.post(`/admin/shops/${encodeURIComponent(slug)}/status`, { status });
export const listPendingShops = () => api.get('/admin/pending-shops');
export const approvePendingShop = (id) => api.post(`/admin/pending-shops/${id}/approve`);
export const rejectPendingShop = (id, note) => api.post(`/admin/pending-shops/${id}/reject`, { note });

export const getProduct = (id) =>
  api.get(`/products/${id}`);

export const getProductHistory = (id) =>
  api.get(`/products/${id}/history`);

export const getSites = () =>
  api.get('/sites');

export const getDashboardStats = () =>
  api.get('/dashboard/stats');

export const triggerScrape = (query, sites) =>
  api.post('/scrape', { query, sites });

export const getAllProducts = (page = 0, size = 20, category) =>
  api.get('/products', { params: { page, size, ...(category ? { category } : {}) } });

/** Distinct catalog categories — powers the Browse filter chips. */
export const getCategories = () => api.get('/products/categories');

export const compareProducts = (ids) =>
  api.get('/compare', { params: { ids: Array.isArray(ids) ? ids.join(',') : ids } });

export const getSellers = (params = {}) =>
  api.get('/sellers', { params });

export const getSeller = (id) =>
  api.get(`/sellers/${id}`);

/** Public-facing live counters: active users, trending searches, hot drops. */
export const getLiveStats = () => api.get('/stats/live');
export const getTrendingSearches = (limit = 10) =>
  api.get('/stats/trending', { params: { limit } });
export const getHotDrops = (limit = 12) =>
  api.get('/stats/hot-drops', { params: { limit } });

/** Public shop submission. */
export const submitShop = (payload) => api.post('/shops/submit', payload);

// ─── Trust & delivery decision layer ───
/**
 * Batch-fetch the trust/delivery/genuineness profile for a set of shop
 * slugs (the siteSlug on each SitePrice). Returns a slug→profile map.
 */
export const getShopTrust = (slugs) =>
  api.get('/trust/shops', { params: { slugs: Array.isArray(slugs) ? slugs.join(',') : slugs } });

/** Community + scraped reviews for a product, newest first. */
export const getProductReviews = (idOrSlug) =>
  api.get(`/products/${idOrSlug}/reviews`);

/**
 * Submit a community review. Anonymous — the X-Anon-Id header (added by the
 * request interceptor) is the identity, one review per product. Payload:
 * { rating, title, content, reviewerName, shopSlug, siteName,
 *   deliveryDaysReported, wouldRecommend, trustVote }.
 */
export const postProductReview = (idOrSlug, payload) =>
  api.post(`/products/${idOrSlug}/reviews`, payload);

/** Lightweight delivery-time report (no full review). { shopSlug, days }. */
export const postDeliveryReport = (idOrSlug, payload) =>
  api.post(`/products/${idOrSlug}/delivery-report`, payload);

/** Upvote a review as helpful. */
export const markReviewHelpful = (id) => api.post(`/reviews/${id}/helpful`);

/** "দরদাম" shopping assistant — { reply, products[], trust{}, suggestions[] }. */
export const assistantChat = (message) => api.post('/assistant/chat', { message });

// ─── Damkemon Protect (buyer protection) ───
/** Scam-risk verdict for a purchase. { sellerName?, shopSlug?, productId?, amount?, paymentMethod }. */
export const protectAssess = (payload) => api.post('/protect/assess', payload);
/** Open a protected order; returns { order, risk } with a protection code. */
export const protectCreateOrder = (payload) => api.post('/protect/orders', payload);
export const protectGetOrder = (code) => api.get(`/protect/orders/${encodeURIComponent(code)}`);
export const protectConfirmOrder = (code) => api.post(`/protect/orders/${encodeURIComponent(code)}/confirm`);
export const protectDisputeOrder = (code, reason) =>
  api.post(`/protect/orders/${encodeURIComponent(code)}/dispute`, { reason });

// Admin: review moderation queue
export const adminFlaggedReviews = () => api.get('/admin/reviews/flagged');
export const adminSetReviewStatus = (id, status) =>
  api.post(`/admin/reviews/${id}/status`, { status });

/** Hydrate a list of product ids — used by the recently-viewed rail. */
export const getProductsByIds = (ids) =>
  api.get('/products/by-ids', { params: { ids: Array.isArray(ids) ? ids.join(',') : ids } });

/** Daily-bucketed price history series for the price-history chart. */
export const getDailyPriceHistory = (id, days = 30) =>
  api.get(`/products/${id}/history/daily`, { params: { days } });

// ─── Admin: indexer history ───
export const getIndexerHistory = (limit = 30) =>
  api.get('/admin/index/history', { params: { limit } });

// ─── Admin: shop edit ───
export const editShop = (slug, patch) =>
  api.patch(`/admin/shops/${encodeURIComponent(slug)}`, patch);
export const bulkSetShopStatus = (slugs, status) =>
  api.post('/admin/shops/bulk-status', { slugs, status });

// ─── Admin: catalog ───
export const adminListCatalog = (params = {}) =>
  api.get('/admin/catalog', { params });
export const adminEditProduct = (id, patch) =>
  api.patch(`/admin/catalog/${id}`, patch);
export const adminDeleteProduct = (id) =>
  api.delete(`/admin/catalog/${id}`);
export const adminMergeProducts = (toId, fromId) =>
  api.post(`/admin/catalog/${toId}/merge`, { from: fromId });

// ─── Admin: cache ───
export const listCaches = () => api.get('/admin/cache');
export const flushCache = (name) => api.post(`/admin/cache/${name}/flush`);
export const flushAllCaches = () => api.post('/admin/cache/flush-all');

// ─── Admin: jobs ───
export const listJobs = () => api.get('/admin/jobs');
export const runJob = (id) => api.post(`/admin/jobs/${id}/run`);
export const jobRuns = (id) => api.get(`/admin/jobs/${id}/runs`);

// ─── Admin: search log + latency ───
export const recentSearches = (limit = 200) =>
  api.get('/admin/stats/recent-searches', { params: { limit } });
export const searchLatency = () => api.get('/admin/stats/latency');

// ─── Account: per-user search history ───
export const accountSearchHistory = () => api.get('/account/search-history');

/**
 * Tracked outbound URL for "Visit shop" buttons. The backend records the
 * click + appends affiliate parameters before 302-ing to the shop. Pass
 * the search query when known so attribution analytics know what led to
 * the click.
 */
export const affiliateUrl = (productId, siteSlug, fromQuery) => {
  if (!productId) return '#';
  const base = `${baseURL}/r/${encodeURIComponent(productId)}`;
  const params = new URLSearchParams();
  if (siteSlug) params.set('site', siteSlug);
  if (fromQuery) params.set('q', fromQuery);
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
};

export default api;
