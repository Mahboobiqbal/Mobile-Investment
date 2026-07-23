declare var process: any;

export const env = {
  apiBaseUrl: process?.env?.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api',
};
