import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error normalization
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message
      || error.response?.data?.error
      || error.message
      || 'Something went wrong';

    const status = error.response?.status;

    if (status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      const err = new Error(`Rate limit exceeded. Try again in ${retryAfter || 60}s`);
      err.status = 429;
      err.retryAfter = retryAfter;
      return Promise.reject(err);
    }

    const err = new Error(message);
    err.status = status;
    err.data = error.response?.data;
    return Promise.reject(err);
  }
);

// ── URL API ──────────────────────────────────────────────────────

export const urlApi = {
  /**
   * Create a short URL
   */
  create: async ({ originalUrl, title, customAlias, expiresAt }) => {
    const res = await api.post('/api/urls', {
      originalUrl,
      title: title || undefined,
      customAlias: customAlias || undefined,
      expiresAt: expiresAt || undefined,
    });
    return res.data;
  },

  /**
   * Get URL info
   */
  get: async (shortCode) => {
    const res = await api.get(`/api/urls/${shortCode}`);
    return res.data;
  },

  /**
   * Update URL (deactivate, change expiry, etc.)
   */
  update: async (shortCode, updates) => {
    const res = await api.put(`/api/urls/${shortCode}`, updates);
    return res.data;
  },

  /**
   * Delete/deactivate URL
   */
  delete: async (shortCode) => {
    const res = await api.delete(`/api/urls/${shortCode}`);
    return res.data;
  },

  /**
   * Recent URLs
   */
  getRecent: async () => {
    const res = await api.get('/api/urls/recent');
    return res.data;
  },

  /**
   * Top URLs by clicks
   */
  getTop: async () => {
    const res = await api.get('/api/urls/top');
    return res.data;
  },

  /**
   * Global statistics
   */
  getStats: async () => {
    const res = await api.get('/api/stats');
    return res.data;
  },

  /**
   * URL analytics
   */
  getAnalytics: async (shortCode) => {
    const res = await api.get(`/api/analytics/${shortCode}`);
    return res.data;
  },
};

export default api;
