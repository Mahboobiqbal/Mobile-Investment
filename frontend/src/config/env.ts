declare var process: any;

export const env = {
  apiBaseUrl: process?.env?.EXPO_PUBLIC_API_URL || 'https://mobile-investment-1.onrender.com/api',
};
