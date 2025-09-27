// API Configuration for different environments
const getApiBaseUrl = (): string => {
  // Check if we're in development
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3001/api';
  }
  
  // Check for custom API URL from environment variable
  if (process.env.REACT_APP_API_URL) {
    return `${process.env.REACT_APP_API_URL}/api`;
  }
  
  // Production fallback - you can deploy backend to Render, Vercel, etc.
  return 'https://fixnow-backend.onrender.com/api';
};

export const API_BASE_URL = getApiBaseUrl();

// Helper function to create full API URLs
export const createApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
};

// Demo mode detection
export const isDemoMode = (): boolean => {
  return process.env.NODE_ENV === 'production' && !process.env.REACT_APP_API_URL;
};

// Helper function for API calls with fallback to demo mode
export const apiCall = async (url: string, options?: RequestInit): Promise<Response> => {
  try {
    const response = await fetch(url, options);
    if (!response.ok && isDemoMode()) {
      throw new Error('API unavailable - using demo mode');
    }
    return response;
  } catch (error) {
    if (isDemoMode()) {
      // Return mock response for demo mode
      throw new Error('DEMO_MODE');
    }
    throw error;
  }
};

export default {
  API_BASE_URL,
  createApiUrl,
  isDemoMode,
  apiCall
};
