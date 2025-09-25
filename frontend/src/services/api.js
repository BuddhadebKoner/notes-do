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
  createUser: async userData => {
    try {
      const config = await getAuthConfig()
      const response = await api.post(
        API_ENDPOINTS.AUTH.CREATE_USER,
        userData,
        config
      )
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
  getUploadedNotes: async (
    page = 1,
    limit = 10,
    sortBy = 'uploadDate',
    sortOrder = 'desc'
  ) => {
    try {
      const config = await getAuthConfig()
      const response = await api.get(API_ENDPOINTS.PROFILE.UPLOADED_NOTES, {
        params: { page, limit, sortBy, sortOrder },
        ...config,
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
        ...config,
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
        ...config,
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
  updateProfile: async profileData => {
    try {
      const config = await getAuthConfig()
      const response = await api.put(
        API_ENDPOINTS.PROFILE.UPDATE_PROFILE,
        profileData,
        config
      )
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  // Get public user profile by username
  getPublicProfile: async username => {
    try {
      // Public endpoint - no authentication required
      const response = await api.get(
        `${API_ENDPOINTS.PROFILE.PUBLIC_PROFILE}/${username}`,
        {
          skipAuth: true, // Flag to skip authentication in interceptor
        }
      )
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  // Get public user notes by username with pagination
  getPublicUserNotes: async (
    username,
    { page = 1, limit = 12, sortBy = 'uploadDate', sortOrder = 'desc' } = {}
  ) => {
    try {
      // Public endpoint - no authentication required
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder,
      })
      const response = await api.get(
        `${API_ENDPOINTS.PROFILE.PUBLIC_USER_NOTES}/${username}/notes?${params}`,
        {
          skipAuth: true, // Flag to skip authentication in interceptor
        }
      )
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  // Get public user followers by username with pagination
  getPublicUserFollowers: async (username, { page = 1, limit = 20 } = {}) => {
    try {
      // Public endpoint - no authentication required
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })
      const response = await api.get(
        `${API_ENDPOINTS.PROFILE.PUBLIC_USER_FOLLOWERS}/${username}/followers?${params}`,
        {
          skipAuth: true, // Flag to skip authentication in interceptor
        }
      )
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  // Follow a user by username
  followUser: async username => {
    try {
      const config = await getAuthConfig()
      const response = await api.post(
        `${API_ENDPOINTS.PROFILE.FOLLOW_USER}/${username}`,
        {},
        config
      )
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  // Unfollow a user by username
  unfollowUser: async username => {
    try {
      const config = await getAuthConfig()
      const response = await api.delete(
        `${API_ENDPOINTS.PROFILE.UNFOLLOW_USER}/${username}`,
        config
      )
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },
}

// Notes API services
export const notesAPI = {
  // Upload a note
  uploadNote: async formData => {
    try {
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        ...(await getAuthConfig()),
      }
      const response = await api.post(
        API_ENDPOINTS.NOTES.UPLOAD,
        formData,
        config
      )
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  // Get single note by ID
  getNoteById: async noteId => {
    try {
      // Note details can be public - authentication optional but needed for like status
      const response = await api.get(
        `${API_ENDPOINTS.NOTES.GET_NOTE}/${noteId}`,
        {
          skipAuth: false, // Send auth if available to get like status and permissions
        }
      )
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  // Get notes feed with pagination and filters - optimized for cards
  getNotesFeed: async (page = 1, limit = 12, filters = {}) => {
    try {
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

      const response = await api.get(API_ENDPOINTS.NOTES.GET_FEED, {
        params,
        skipAuth: false, // Send auth if available to get like status
      })
      return response.data
    } catch (error) {
      console.error('getNotesFeed API error:', error) // Debug log
      throw error.response?.data || error.message
    }
  },

  // Like a note
  likeNote: async noteId => {
    try {
      const config = await getAuthConfig()
      const response = await api.post(
        `${API_ENDPOINTS.NOTES.LIKE}/${noteId}/like`,
        {},
        config
      )
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  // Unlike a note
  unlikeNote: async noteId => {
    try {
      const config = await getAuthConfig()
      const response = await api.delete(
        `${API_ENDPOINTS.NOTES.UNLIKE}/${noteId}/like`,
        config
      )
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },
}

// Generic API helper functions
export const apiHelpers = {
  // Handle API errors
  handleError: error => {
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
