import axios from 'axios';

/**
 * Single axios instance shared by every service module. Attaches the JWT
 * automatically and normalises error handling so callers can just `await`
 * and catch a plain Error with a human-readable `.message`.
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('wte_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status;
    const serverMessage = error.response?.data?.message;
    const validationErrors = error.response?.data?.errors;

    if (status === 401 && !error.config?.url?.includes('/auth/login')) {
      // Token missing/expired/invalid on a protected route — force re-auth.
      localStorage.removeItem('wte_token');
      localStorage.removeItem('wte_user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login');
      }
    }

    const message =
      serverMessage || (Array.isArray(validationErrors) && validationErrors[0]?.message) || error.message || 'Something went wrong';

    const normalized = new Error(message);
    normalized.status = status;
    normalized.errors = validationErrors;
    return Promise.reject(normalized);
  }
);

export default apiClient;
