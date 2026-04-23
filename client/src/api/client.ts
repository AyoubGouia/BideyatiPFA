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

console.log('API Client:', apiClient);

export default apiClient;
