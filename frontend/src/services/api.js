import api, { API_ENDPOINTS } from '../config/api.js'

// Helper function to create authenticated request config
const getAuthConfig = async () => {
   // Token is now managed automatically by the request interceptor
   // No need to manually set headers here
   return {}
}

// Auth API services
export const authAPI = {
   // Check if user is logged in
   checkLogin: async () => {
      try {
         const config = await getAuthConfig()
         const response = await api.get(API_ENDPOINTS.AUTH.CHECK_LOGIN, config)
         return response.data
      } catch (error) {
         throw error.response?.data || error.message
      }
   },

   // Create user profile
   createUser: async (userData) => {
      try {
         const config = await getAuthConfig()
         const response = await api.post(API_ENDPOINTS.AUTH.CREATE_USER, userData, config)
         return response.data
      } catch (error) {
         throw error.response?.data || error.message
      }
   },
}

// Profile API services
export const profileAPI = {
   // Get complete user profile
   getProfile: async () => {
      try {
         const config = await getAuthConfig()
         const response = await api.get(API_ENDPOINTS.PROFILE.GET_PROFILE, config)
         return response.data
      } catch (error) {
         throw error.response?.data || error.message
      }
   },

   // Get user's uploaded notes
   getUploadedNotes: async (page = 1, limit = 10, sortBy = 'uploadDate', sortOrder = 'desc') => {
      try {
         const config = await getAuthConfig()
         const response = await api.get(API_ENDPOINTS.PROFILE.UPLOADED_NOTES, {
            params: { page, limit, sortBy, sortOrder },
            ...config
         })
         return response.data
      } catch (error) {
         throw error.response?.data || error.message
      }
   },

   // Get user's wishlist
   getWishlist: async (page = 1, limit = 10) => {
      try {
         const config = await getAuthConfig()
         const response = await api.get(API_ENDPOINTS.PROFILE.WISHLIST, {
            params: { page, limit },
            ...config
         })
         return response.data
      } catch (error) {
         throw error.response?.data || error.message
      }
   },

   // Get user's favorites
   getFavorites: async (page = 1, limit = 10) => {
      try {
         const config = await getAuthConfig()
         const response = await api.get(API_ENDPOINTS.PROFILE.FAVORITES, {
            params: { page, limit },
            ...config
         })
         return response.data
      } catch (error) {
         throw error.response?.data || error.message
      }
   },

   // Get user's followers
   getFollowers: async () => {
      try {
         const config = await getAuthConfig()
         const response = await api.get(API_ENDPOINTS.PROFILE.FOLLOWERS, config)
         return response.data
      } catch (error) {
         throw error.response?.data || error.message
      }
   },

   // Get user's following
   getFollowing: async () => {
      try {
         const config = await getAuthConfig()
         const response = await api.get(API_ENDPOINTS.PROFILE.FOLLOWING, config)
         return response.data
      } catch (error) {
         throw error.response?.data || error.message
      }
   },

   // Get user activity statistics
   getActivityStats: async () => {
      try {
         const config = await getAuthConfig()
         const response = await api.get(API_ENDPOINTS.PROFILE.STATS, config)
         return response.data
      } catch (error) {
         throw error.response?.data || error.message
      }
   },

   // Update user profile
   updateProfile: async (profileData) => {
      try {
         const config = await getAuthConfig()
         const response = await api.put(API_ENDPOINTS.PROFILE.UPDATE_PROFILE, profileData, config)
         return response.data
      } catch (error) {
         throw error.response?.data || error.message
      }
   },

   // Get public user profile by username
   getPublicProfile: async (username) => {
      try {
         const config = await getAuthConfig()
         const response = await api.get(`${API_ENDPOINTS.PROFILE.PUBLIC_PROFILE}/${username}`, config)
         return response.data
      } catch (error) {
         throw error.response?.data || error.message
      }
   }
}

// Notes API services
export const notesAPI = {
   // Upload a note
   uploadNote: async (formData) => {
      try {
         const config = {
            headers: {
               'Content-Type': 'multipart/form-data',
            },
            ...await getAuthConfig()
         }
         const response = await api.post(API_ENDPOINTS.NOTES.UPLOAD, formData, config)
         return response.data
      } catch (error) {
         throw error.response?.data || error.message
      }
   },

   // Get single note by ID
   getNoteById: async (noteId) => {
      try {
         const config = await getAuthConfig()
         const response = await api.get(`${API_ENDPOINTS.NOTES.GET_NOTE}/${noteId}`, config)
         return response.data
      } catch (error) {
         throw error.response?.data || error.message
      }
   },

   // Get notes feed with pagination and filters - optimized for cards
   getNotesFeed: async (page = 1, limit = 12, filters = {}) => {
      try {
         const config = await getAuthConfig()

         // Prepare query parameters, excluding 'all' values and empty strings
         const params = {
            page: parseInt(page) || 1,
            limit: Math.min(parseInt(limit) || 12, 24), // Max 24 per page
         }

         // Add filters, excluding 'all' values and empty/falsy values
         Object.entries(filters).forEach(([key, value]) => {
            if (value && value !== 'all' && String(value).trim() !== '') {
               params[key] = String(value).trim()
            }
         })

         console.log('API Request params:', params) // Debug log

         const response = await api.get(API_ENDPOINTS.NOTES.GET_FEED, {
            params,
            ...config
         })
         return response.data
      } catch (error) {
         console.error('getNotesFeed API error:', error) // Debug log
         throw error.response?.data || error.message
      }
   }
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
   profile: profileAPI,
   notes: notesAPI,
   helpers: apiHelpers,
}