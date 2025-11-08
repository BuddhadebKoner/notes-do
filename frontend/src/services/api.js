import api, { API_ENDPOINTS } from '../config/api.js'

// Auth API services
export const authAPI = {
  // Check if user is logged in
  checkLogin: async () => {
    try {
      const response = await api.get(API_ENDPOINTS.AUTH.CHECK_LOGIN)
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  // Create user profile
  createUser: async userData => {
    try {
      const response = await api.post(
        API_ENDPOINTS.AUTH.CREATE_USER,
        userData
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

      const response = await api.get(API_ENDPOINTS.PROFILE.GET_PROFILE)
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

      const response = await api.get(API_ENDPOINTS.PROFILE.UPLOADED_NOTES, {
        params: { page, limit, sortBy, sortOrder },

      })
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  // Get user's wishlist
  getWishlist: async (page = 1, limit = 10) => {
    try {

      const response = await api.get(API_ENDPOINTS.PROFILE.WISHLIST, {
        params: { page, limit },

      })
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  // Get user's favorites
  getFavorites: async (page = 1, limit = 10) => {
    try {

      const response = await api.get(API_ENDPOINTS.PROFILE.FAVORITES, {
        params: { page, limit },

      })
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  // Get user's followers
  getFollowers: async () => {
    try {

      const response = await api.get(API_ENDPOINTS.PROFILE.FOLLOWERS)
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  // Get user's following
  getFollowing: async () => {
    try {

      const response = await api.get(API_ENDPOINTS.PROFILE.FOLLOWING)
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  // Get user activity statistics
  getActivityStats: async () => {
    try {

      const response = await api.get(API_ENDPOINTS.PROFILE.STATS)
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  // Update user profile
  updateProfile: async profileData => {
    try {
      const response = await api.put(
        API_ENDPOINTS.PROFILE.UPDATE_PROFILE,
        profileData
      )
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  // Update note details (excluding file)
  updateNoteDetails: async (noteId, noteData) => {
    try {
      const response = await api.put(
        `/profile/note/${noteId}`,
        noteData
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
      const response = await api.post(
        `${API_ENDPOINTS.PROFILE.FOLLOW_USER}/${username}`,
        {}
      )
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  // Unfollow a user by username
  unfollowUser: async username => {
    try {
      const response = await api.delete(
        `${API_ENDPOINTS.PROFILE.UNFOLLOW_USER}/${username}`
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
  uploadNote: async (formData, onProgress) => {
    try {
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 180000, // 3 minutes timeout for large file uploads
        onUploadProgress: progressEvent => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            )
            onProgress(percentCompleted)
          }
        },
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

      const response = await api.delete(
        `${API_ENDPOINTS.NOTES.UNLIKE}/${noteId}/like`,
        config
      )
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  // Delete a note
  deleteNote: async (noteId, googleDriveToken = null) => {
    try {

      const response = await api.delete(
        `${API_ENDPOINTS.NOTES.DELETE}/${noteId}`,
        {

          data: googleDriveToken ? { googleDriveToken } : {},
        }
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

      })
      return response.data
    } catch (error) {
      throw apiHelpers.handleError(error)
    }
  },
}

// Comments API services
export const commentsAPI = {
  // Get comments for a note with pagination
  getComments: async (noteId, page = 1, limit = 10) => {
    try {

      const response = await api.get(
        `${API_ENDPOINTS.COMMENTS.GET_COMMENTS}/${noteId}?page=${page}&limit=${limit}`,
        config
      )
      return response.data
    } catch (error) {
      throw apiHelpers.handleError(error)
    }
  },

  // Add a new comment to a note
  addComment: async (noteId, content) => {
    try {

      const response = await api.post(
        `${API_ENDPOINTS.COMMENTS.ADD_COMMENT}/${noteId}`,
        { content },
        config
      )
      return response.data
    } catch (error) {
      throw apiHelpers.handleError(error)
    }
  },

  // Like/Unlike a comment
  toggleCommentLike: async (noteId, commentId) => {
    try {

      const response = await api.put(
        `${API_ENDPOINTS.COMMENTS.LIKE_COMMENT}/${noteId}/${commentId}/like`,
        {},
        config
      )
      return response.data
    } catch (error) {
      throw apiHelpers.handleError(error)
    }
  },

  // Add a reply to a comment
  addReply: async (noteId, commentId, content) => {
    try {

      const response = await api.post(
        `${API_ENDPOINTS.COMMENTS.ADD_REPLY}/${noteId}/${commentId}/reply`,
        { content },
        config
      )
      return response.data
    } catch (error) {
      throw apiHelpers.handleError(error)
    }
  },
}

// Share API services
export const shareAPI = {
  // Create share link for a note
  createShareLink: async ({ noteId, expiryDays = 30 }) => {
    try {

      const response = await api.post(
        `${API_ENDPOINTS.SHARE.CREATE_LINK}/${noteId}/share`,
        { expiryDays },
        config
      )
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  // Get share info for a note
  getShareInfo: async noteId => {
    try {

      const response = await api.get(
        `${API_ENDPOINTS.SHARE.GET_INFO}/${noteId}/share-info`,
        config
      )
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  // Disable share link for a note
  disableShareLink: async noteId => {
    try {

      const response = await api.delete(
        `${API_ENDPOINTS.SHARE.DISABLE_LINK}/${noteId}/share`,
        config
      )
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  // Access shared note (public endpoint)
  accessSharedNote: async (noteId, token) => {
    try {
      // This endpoint might be accessed by non-authenticated users
      const response = await api.get(
        `${API_ENDPOINTS.SHARE.ACCESS_NOTE}/${noteId}/access?token=${token}`,
        { skipAuth: true } // Skip auth for this request
      )
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  // Get share analytics for a note
  getShareAnalytics: async noteId => {
    try {

      const response = await api.get(
        `${API_ENDPOINTS.SHARE.GET_ANALYTICS}/${noteId}/analytics`,
        config
      )
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },
}

// Wishlist Share API services
export const wishlistShareAPI = {
  // Create share link for a wishlist
  createWishlistShareLink: async ({ wishlistId, expiryDays = 30 }) => {
    try {

      const response = await api.post(
        `${API_ENDPOINTS.WISHLIST_SHARE.CREATE_LINK}/${wishlistId}/share`,
        { expiryDays },
        config
      )
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  // Get share info for a wishlist
  getWishlistShareInfo: async wishlistId => {
    try {

      const response = await api.get(
        `${API_ENDPOINTS.WISHLIST_SHARE.GET_INFO}/${wishlistId}/share-info`,
        config
      )
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  // Disable share link for a wishlist
  disableWishlistShareLink: async wishlistId => {
    try {

      const response = await api.delete(
        `${API_ENDPOINTS.WISHLIST_SHARE.DISABLE_LINK}/${wishlistId}/share`,
        config
      )
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  // Access shared wishlist (public endpoint)
  accessSharedWishlist: async (wishlistId, token) => {
    try {
      // This endpoint might be accessed by non-authenticated users
      const response = await api.get(
        `${API_ENDPOINTS.WISHLIST_SHARE.ACCESS_WISHLIST}/${wishlistId}/access?token=${token}`,
        { skipAuth: true } // Skip auth for this request initially
      )
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  // Get share analytics for a wishlist
  getWishlistShareAnalytics: async wishlistId => {
    try {

      const response = await api.get(
        `${API_ENDPOINTS.WISHLIST_SHARE.GET_ANALYTICS}/${wishlistId}/analytics`,
        config
      )
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },
}

// Google API services
export const googleAPI = {
  // Get Google Drive account information
  getAccountInfo: async googleDriveToken => {
    try {

      const response = await api.post(
        API_ENDPOINTS.GOOGLE.ACCOUNT_INFO,
        { googleDriveToken },
        config
      )
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  // Get Google Drive folder structure
  getFolderStructure: async googleDriveToken => {
    try {

      const response = await api.post(
        API_ENDPOINTS.GOOGLE.FOLDER_STRUCTURE,
        { googleDriveToken },
        config
      )
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },
}

// Import notification API
import notificationAPI from './notificationAPI.js'

export default {
  auth: authAPI,
  profile: profileAPI,
  notes: notesAPI,
  comments: commentsAPI,
  share: shareAPI,
  wishlistShare: wishlistShareAPI,
  google: googleAPI,
  helpers: apiHelpers,
  notifications: notificationAPI,
}

// Also export notificationAPI as named export
export { notificationAPI }
