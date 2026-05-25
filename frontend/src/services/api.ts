import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

// Expo Go / Android emulator cannot use `localhost` to reach the machine running the API.
// 10.0.2.2 maps the Android emulator back to the host machine.
// You can override this by setting EXPO_PUBLIC_API_BASE_URL in your app config.
const LOCAL_API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://10.0.2.2:5000/api';

type AuthTokenProvider = () => string | null | Promise<string | null>;

let authTokenProvider: AuthTokenProvider | null = null;

export const setAuthTokenProvider = (provider: AuthTokenProvider): void => {
  authTokenProvider = provider;
};

const api: AxiosInstance = axios.create({
  baseURL: LOCAL_API_BASE_URL,
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
          config.headers = {
            ...config.headers,
            Authorization: `Bearer ${token}`,
          };
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
