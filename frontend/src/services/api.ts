import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

import { appConfig } from '../config/appConfig';

type AuthTokenProvider = () => string | null | Promise<string | null>;

let authTokenProvider: AuthTokenProvider | null = null;

export const setAuthTokenProvider = (provider: AuthTokenProvider): void => {
  authTokenProvider = provider;
};

const api: AxiosInstance = axios.create({
  baseURL: appConfig.apiBaseUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    if (authTokenProvider) {
      const token = await authTokenProvider();

      if (token) {
        if (config.headers && typeof config.headers.set === 'function') {
          config.headers.set('Authorization', `Bearer ${token}`);
        } else {
          // Fallback for older axios versions or custom header objects
          (config.headers as any)['Authorization'] = `Bearer ${token}`;
        }
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Optional helper when you want to pass a token manually in one-off calls.
export const withAuthHeader = (token: string): AxiosRequestConfig => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

export default api;
