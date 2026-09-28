import api from './api';

const authService = {
  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    return data;
  },

  register: async (userData) => {
    const { data } = await api.post('/auth/register', userData);
    return data;
  },

  logout: async () => {
    const { data } = await api.post('/auth/logout');
    return data;
  },

  getProfile: async () => {
    const { data } = await api.get('/auth/profile');
    return data;
  },

  updateProfile: async (profile) => {
    const { data } = await api.put('/auth/profile', profile);
    return data;
  },

  changePassword: async (currentPassword, newPassword) => {
    const { data } = await api.put('/users/change-password', { currentPassword, newPassword });
    return data;
  },

  // Two-factor sign-in
  verifyTwoFactor: async (code) => {
    const { data } = await api.post('/auth/2fa/verify', { code });
    return data;
  },

  setupTwoFactor: async () => {
    const { data } = await api.post('/auth/2fa/setup');
    return data;
  },

  enableTwoFactor: async (code) => {
    const { data } = await api.post('/auth/2fa/enable', { code });
    return data;
  },

  disableTwoFactor: async (password, code) => {
    const { data } = await api.post('/auth/2fa/disable', { password, code });
    return data;
  },

  deleteAccount: async (confirmation) => {
    const { data } = await api.delete('/auth/account', { data: confirmation });
    return data;
  },

  requestPasswordReset: async (email) => {
    const { data } = await api.post('/public/password-reset', { email });
    return data;
  },

  resetPassword: async (token, password) => {
    const { data } = await api.post(`/public/password-reset/${token}`, { password });
    return data;
  }
};

export default authService;
