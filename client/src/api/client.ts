import axios from 'axios';

// Creating an Axios instance
// Using localhost:3000 as the backend port by default. This can be configured via env variables.
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor to automatically attach the token to headers
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('bide_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
