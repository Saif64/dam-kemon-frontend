import axios from 'axios';

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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
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

export const getAllProducts = (page = 0, size = 20) =>
  api.get('/products', { params: { page, size } });

export const compareProducts = (ids) =>
  api.get('/compare', { params: { ids: Array.isArray(ids) ? ids.join(',') : ids } });

export const getSellers = (params = {}) =>
  api.get('/sellers', { params });

export const getSeller = (id) =>
  api.get(`/sellers/${id}`);

export default api;
