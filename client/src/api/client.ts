import axios from 'axios';

// Creating an Axios instance
// Using localhost:3000 as the backend port by default. This can be configured via env variables.
const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api', // Point to the Express /api mount
  withCredentials: true, // Crucial for sending/receiving cookies (like the JWT token) securely
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
