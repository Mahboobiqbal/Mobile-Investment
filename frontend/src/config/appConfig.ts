declare var process: any;

export const appConfig = {
  apiBaseUrl: process?.env?.EXPO_PUBLIC_API_URL || 'https://mobile-investment-1.onrender.com/api',
};
