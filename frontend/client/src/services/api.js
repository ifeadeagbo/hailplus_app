import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5050/api';

// Auth rides on an httpOnly cookie set by the server, so no token is
// stored in the browser. X-Requested-With is required by the server's
// CSRF check on every state-changing request.
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
});

// Session expired or revoked: let AuthContext sign the user out.
// Protected pages then redirect to /login via PrivateRoute.
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export default api;
