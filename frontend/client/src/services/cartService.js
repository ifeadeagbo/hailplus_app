import api from './api';

const cartService = {
  getCart: async () => {
    const { data } = await api.get('/cart');
    return data;
  },

  getCartCount: async () => {
    const { data } = await api.get('/cart/count');
    return data;
  },

  addToCart: async (productId, quantity = 1) => {
    const { data } = await api.post('/cart', { productId, quantity });
    return data;
  },

  updateCartItem: async (cartItemId, quantity) => {
    const { data } = await api.put(`/cart/${cartItemId}`, { quantity });
    return data;
  },

  removeFromCart: async (cartItemId) => {
    const { data } = await api.delete(`/cart/${cartItemId}`);
    return data;
  },

  clearCart: async () => {
    const { data } = await api.delete('/cart');
    return data;
  },

  validateCart: async () => {
    const { data } = await api.get('/cart/validate');
    return data;
  },

  applyDiscount: async (discountCode) => {
    const { data } = await api.post('/cart/discount', { discountCode });
    return data;
  },

  mergeCarts: async (guestCartItems) => {
    const { data } = await api.post('/cart/merge', { guestCartItems });
    return data;
  }
};

export default cartService;
