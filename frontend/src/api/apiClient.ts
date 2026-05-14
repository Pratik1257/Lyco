import axios from 'axios';

// Base URL for the ASP.NET Core API
// Uses environment variable for production, falls back to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5193/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {},
});

// Interceptor to add auth token
apiClient.interceptors.request.use((config) => {
  const savedUser = localStorage.getItem('lyco_user');
  if (savedUser) {
    try {
      const user = JSON.parse(savedUser);
      if (user.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }
    } catch (e) {
      console.error('Error parsing user from localStorage', e);
    }
  }
  return config;
});

// Interceptor for better error handling/extraction
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // If we get a 401 Unauthorized, the session has likely expired
    if (error.response?.status === 401) {
      console.warn('Session expired or unauthorized. Logging out...');
      localStorage.removeItem('lyco_user');
      // Redirect to login if not already there
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login?expired=true';
      }
    }
    // Preserve the original Axios error so components can access error.response.data
    return Promise.reject(error);
  }
);

export default apiClient;
