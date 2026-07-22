declare var process: any;

export const appConfig = {
  apiBaseUrl: process?.env?.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api',
};
