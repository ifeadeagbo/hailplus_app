import api from './api';

const orderService = {
  createOrder: async (orderData) => {
    const { data } = await api.post('/orders', orderData);
    return data;
  },

  getOrders: async () => {
    const { data } = await api.get('/orders');
    return data;
  },

  getOrderById: async (id) => {
    const { data } = await api.get(`/orders/${id}`);
    return data;
  },

  confirmPayment: async (id) => {
    const { data } = await api.post(`/orders/${id}/confirm-payment`);
    return data;
  },

  cancelOrder: async (id) => {
    const { data } = await api.post(`/orders/${id}/cancel`);
    return data;
  }
};

export default orderService;
