import api from './api';

const productService = {
  getAllProducts: async (params = {}) => {
    const { data } = await api.get('/products', { params });
    return data;
  },

  getFeaturedProducts: async () => {
    const { data } = await api.get('/products/featured');
    return data;
  },

  getProductById: async (id) => {
    const { data } = await api.get(`/products/${id}`);
    return data;
  },

  createProduct: async (product) => {
    const { data } = await api.post('/products', product);
    return data;
  },

  updateProduct: async (id, product) => {
    const { data } = await api.put(`/products/${id}`, product);
    return data;
  },

  deleteProduct: async (id) => {
    const { data } = await api.delete(`/products/${id}`);
    return data;
  }
};

export default productService;
