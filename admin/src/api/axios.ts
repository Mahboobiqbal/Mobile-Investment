import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

api.interceptors.request.use((config) => {
  const adminKey = import.meta.env.VITE_ADMIN_API_KEY;
  if (adminKey) {
    config.headers['x-admin-key'] = adminKey;
  }
  return config;
});

export default api;
