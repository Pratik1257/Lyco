import axios from 'axios';

// Base URL for the ASP.NET Core API
// Uses environment variable for production, falls back to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5193/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {},
});

// Interceptor for better error handling/extraction
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Preserve the original Axios error so components can access error.response.data
    return Promise.reject(error);
  }
);

export default apiClient;
