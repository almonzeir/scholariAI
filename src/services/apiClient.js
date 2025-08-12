import axios from 'axios';
import toast from 'react-hot-toast';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle network errors
    if (!error.response) {
      toast.error('Network error. Please check your connection.');
      return Promise.reject(error);
    }

    const { status, data } = error.response;

    // Handle different error status codes
    switch (status) {
      case 401:
        // Unauthorized - clear token and redirect to login
        localStorage.removeItem('token');
        if (window.location.pathname !== '/login') {
          toast.error('Session expired. Please login again.');
          window.location.href = '/login';
        }
        break;
      
      case 403:
        toast.error('Access denied. You don\'t have permission to perform this action.');
        break;
      
      case 404:
        toast.error('Resource not found.');
        break;
      
      case 422:
        // Validation errors
        if (data.errors && Array.isArray(data.errors)) {
          data.errors.forEach(err => toast.error(err.message));
        } else {
          toast.error(data.error || 'Validation error');
        }
        break;
      
      case 429:
        toast.error('Too many requests. Please try again later.');
        break;
      
      case 500:
        toast.error('Server error. Please try again later.');
        break;
      
      default:
        toast.error(data.error || 'An unexpected error occurred');
    }

    return Promise.reject(error);
  }
);

// Helper methods
const apiHelpers = {
  // Set auth token
  setAuthToken: (token) => {
    if (token) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  },

  // Clear auth token
  clearAuthToken: () => {
    delete apiClient.defaults.headers.common['Authorization'];
  },

  // Upload file with progress
  uploadFile: (url, formData, onProgress) => {
    return apiClient.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });
  },

  // Download file
  downloadFile: async (url, filename) => {
    try {
      const response = await apiClient.get(url, {
        responseType: 'blob',
      });
      
      // Create blob link to download
      const blob = new Blob([response.data]);
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      
      // Clean up
      window.URL.revokeObjectURL(link.href);
      
      return { success: true };
    } catch (error) {
      console.error('Download error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get with query parameters
  getWithParams: (url, params) => {
    return apiClient.get(url, { params });
  },

  // Batch requests
  batch: (requests) => {
    return Promise.all(requests.map(request => {
      const { method, url, data, config } = request;
      return apiClient[method](url, data, config);
    }));
  },
};

// API endpoints organized by feature
export const authAPI = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
  register: (userData) => apiClient.post('/auth/register', userData),
  logout: () => apiClient.post('/auth/logout'),
  getProfile: () => apiClient.get('/auth/profile'),
  updateProfile: (data) => apiClient.put('/auth/profile', data),
  changePassword: (data) => apiClient.put('/auth/change-password', data),
};

export const scholarshipsAPI = {
  getAll: (params) => apiClient.get('/scholarships', { params }),
  getById: (id) => apiClient.get(`/scholarships/${id}`),
  search: (params) => apiClient.get('/scholarships/search', { params }),
  getRecommendations: (params) => apiClient.get('/scholarships/recommendations', { params }),
  getStats: () => apiClient.get('/scholarships/stats'),
  create: (data) => apiClient.post('/scholarships', data),
  update: (id, data) => apiClient.put(`/scholarships/${id}`, data),
  delete: (id) => apiClient.delete(`/scholarships/${id}`),
};

export const applicationsAPI = {
  getAll: (params) => apiClient.get('/users/applications', { params }),
  create: (data) => apiClient.post('/users/applications', data),
  update: (id, data) => apiClient.put(`/users/applications/${id}`, data),
  delete: (id) => apiClient.delete(`/users/applications/${id}`),
};

export const favoritesAPI = {
  getAll: (params) => apiClient.get('/users/favorites', { params }),
  add: (scholarshipId) => apiClient.post('/users/favorites', { scholarshipId }),
  remove: (scholarshipId) => apiClient.delete(`/users/favorites/${scholarshipId}`),
};

export const uploadsAPI = {
  uploadSingle: (formData, onProgress) => apiHelpers.uploadFile('/uploads/single', formData, onProgress),
  uploadMultiple: (formData, onProgress) => apiHelpers.uploadFile('/uploads/multiple', formData, onProgress),
  getFiles: (params) => apiClient.get('/uploads', { params }),
  downloadFile: (id) => apiClient.get(`/uploads/download/${id}`, { responseType: 'blob' }),
  updateFile: (id, data) => apiClient.put(`/uploads/${id}`, data),
  deleteFile: (id) => apiClient.delete(`/uploads/${id}`),
};

export const analyticsAPI = {
  track: (data) => apiClient.post('/analytics/track', data),
  getUserAnalytics: (params) => apiClient.get('/analytics/user', { params }),
  getApplicationStats: (params) => apiClient.get('/analytics/applications', { params }),
  getUserStats: (params) => apiClient.get('/analytics/users', { params }),
  getScholarshipStats: (params) => apiClient.get('/analytics/scholarships', { params }),
  getOverview: () => apiClient.get('/analytics/overview'),
  getPopularSearches: (params) => apiClient.get('/analytics/searches', { params }),
};

export const dashboardAPI = {
  getDashboard: () => apiClient.get('/users/dashboard'),
};

// Export the main client and helpers
export { apiClient, apiHelpers };
export default apiClient;