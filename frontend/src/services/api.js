import api, { API_ENDPOINTS } from '../config/api.js'

// Helper function to create authenticated request config
const getAuthConfig = async () => {
   // Token is managed via setAuthToken in api.js
   return {}
}

// Auth API services
export const authAPI = {
   // Check authentication status
   checkStatus: async () => {
      try {
         const config = await getAuthConfig()
         const response = await api.get(API_ENDPOINTS.AUTH.STATUS, config)
         return response.data
      } catch (error) {
         throw error.response?.data || error.message
      }
   },

   // Get current user info
   getCurrentUser: async () => {
      try {
         const config = await getAuthConfig()
         const response = await api.get(API_ENDPOINTS.AUTH.ME, config)
         return response.data
      } catch (error) {
         throw error.response?.data || error.message
      }
   },

   // Verify token
   verifyToken: async () => {
      try {
         const response = await api.post(API_ENDPOINTS.AUTH.VERIFY)
         return response.data
      } catch (error) {
         throw error.response?.data || error.message
      }
   },

   // Logout
   logout: async () => {
      try {
         const response = await api.post(API_ENDPOINTS.AUTH.LOGOUT)
         return response.data
      } catch (error) {
         throw error.response?.data || error.message
      }
   },
}

// Generic API helper functions
export const apiHelpers = {
   // Handle API errors
   handleError: (error) => {
      if (error.response) {
         // Server responded with error status
         return {
            message: error.response.data?.message || 'Server error occurred',
            status: error.response.status,
            data: error.response.data,
         }
      } else if (error.request) {
         // Request was made but no response received
         return {
            message: 'No response from server. Please check your connection.',
            status: 0,
            data: null,
         }
      } else {
         // Something else happened
         return {
            message: error.message || 'An unexpected error occurred',
            status: 0,
            data: null,
         }
      }
   },

   // Create a generic request function
   request: async (method, url, data = null, config = {}) => {
      try {
         const response = await api({
            method,
            url,
            data,
            ...config,
         })
         return response.data
      } catch (error) {
         throw apiHelpers.handleError(error)
      }
   },
}

export default {
   auth: authAPI,
   helpers: apiHelpers,
}