import api from './api';

const analyticsService = {
  // Get dashboard stats
  getDashboardStats: async () => {
    try {
      const response = await api.get('/analytics/dashboard');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get views over time
  getViewsOverTime: async (period = '7days') => {
    try {
      const response = await api.get('/analytics/views', { params: { period } });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get top films
  getTopFilms: async (limit = 10) => {
    try {
      const response = await api.get('/analytics/top-films', { params: { limit } });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get user growth
  getUserGrowth: async (period = '30days') => {
    try {
      const response = await api.get('/analytics/user-growth', { params: { period } });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get revenue stats
  getRevenueStats: async (period = '30days') => {
    try {
      const response = await api.get('/analytics/revenue', { params: { period } });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default analyticsService;
