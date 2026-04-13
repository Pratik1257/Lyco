import axios from 'axios';

// Base URL for the ASP.NET Core API
// Uses environment variable for production, falls back to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5193/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor for better error handling/extraction
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Extract the error message from the backend if available
    const errorMessage = error.response?.data?.error || error.message || 'An unexpected error occurred';
    return Promise.reject(new Error(errorMessage));
  }
);

export default apiClient;
