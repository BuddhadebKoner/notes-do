import axios from 'axios'

// API endpoints configuration
export const API_ENDPOINTS = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  AUTH: {
    CHECK_LOGIN: '/auth/check-login',
    CREATE_USER: '/auth/create-user',
  },
  NOTES: {
    UPLOAD: '/notes/upload',
    GET_FEED: '/notes/feed',
    GET_NOTE: '/notes',
    DOWNLOAD: '/notes',
  },
  PROFILE: {
    GET_PROFILE: '/profile',
    UPDATE_PROFILE: '/profile',
    UPLOADED_NOTES: '/profile/uploaded-notes',
    WISHLIST: '/profile/wishlist',
    FAVORITES: '/profile/favorites',
    FOLLOWERS: '/profile/followers',
    FOLLOWING: '/profile/following',
    STATS: '/profile/stats',
    PUBLIC_PROFILE: '/profile/user',
    PUBLIC_USER_NOTES: '/profile/user',
    PUBLIC_USER_FOLLOWERS: '/profile/user',
    FOLLOW_USER: '/profile/follow',
    UNFOLLOW_USER: '/profile/follow',
  },
  GOOGLE: {
    DRIVE_AUTH: '/google/google-drive-auth',
    CALLBACK: '/google/callback',
  },
}

// Global token refresh function reference
let getTokenFunction = null

// Create axios instance
const api = axios.create({
  baseURL: API_ENDPOINTS.BASE_URL,
  timeout: 30000, // Increased timeout to 30 seconds
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Function to set the token refresh function
export const setTokenRefreshFunction = getToken => {
  getTokenFunction = getToken
}

// Function to set auth token (will be called from components)
export const setAuthToken = token => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    api.defaults.headers.common['x-clerk-auth-token'] = token
  } else {
    delete api.defaults.headers.common['Authorization']
    delete api.defaults.headers.common['x-clerk-auth-token']
  }
}

// Request interceptor - Get fresh token before each request
api.interceptors.request.use(
  async config => {
    // Skip authentication for public endpoints
    if (config.skipAuth) {
      delete config.skipAuth // Remove the flag from config
      return config
    }

    // Get fresh token before each request to avoid expiry issues
    if (getTokenFunction) {
      try {
        const freshToken = await getTokenFunction()
        if (freshToken) {
          config.headers['Authorization'] = `Bearer ${freshToken}`
          config.headers['x-clerk-auth-token'] = freshToken
        }
      } catch (error) {
        console.error('Error getting fresh token:', error)
        // Don't fail the request if token fetch fails for public endpoints
        // The backend should handle missing tokens gracefully for public data
      }
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      // Try to get a fresh token and retry the request
      if (getTokenFunction) {
        try {
          console.log('Token expired, attempting to refresh...')
          const freshToken = await getTokenFunction()
          if (freshToken) {
            originalRequest.headers['Authorization'] = `Bearer ${freshToken}`
            originalRequest.headers['x-clerk-auth-token'] = freshToken
            return api(originalRequest)
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError)
        }
      }

      // If refresh fails, redirect to login
      console.log('Authentication failed - user needs to login again')
      // You might want to trigger a logout or redirect here
    }

    return Promise.reject(error)
  }
)

export default api
