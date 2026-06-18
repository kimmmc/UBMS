import { Platform } from 'react-native';

// API Configuration for Driver App
export const API_CONFIG = {
  // Backend API URL - using production backend
  BASE_URL: Platform.select({
    ios: 'https://ubms-p9jp.onrender.com/api',
    android: 'https://ubms-p9jp.onrender.com/api',
    web: 'https://ubms-p9jp.onrender.com/api',
    default: 'https://ubms-p9jp.onrender.com/api',
  }),

  // Request timeout in milliseconds (30s to survive Render cold starts)
  TIMEOUT: 30000,

  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000,
};

// Environment-specific configurations
export const getApiUrl = () => {
  return API_CONFIG.BASE_URL || 'https://ubms-p9jp.onrender.com/api';
};