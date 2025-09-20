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
    GET_NOTES: '/notes',
    GET_NOTE: '/notes',
    DOWNLOAD: '/notes'
  },
  PROFILE: {
    GET_PROFILE: '/profile',
    UPDATE_PROFILE: '/profile',
    UPLOADED_NOTES: '/profile/uploaded-notes',
    WISHLIST: '/profile/wishlist',
    FAVORITES: '/profile/favorites',
    FOLLOWERS: '/profile/followers',
    FOLLOWING: '/profile/following',
    STATS: '/profile/stats'
  },
}

// Create axios instance
const api = axios.create({
  baseURL: API_ENDPOINTS.BASE_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Function to set auth token (will be called from components)
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    api.defaults.headers.common['x-clerk-auth-token'] = token
  } else {
    delete api.defaults.headers.common['Authorization']
    delete api.defaults.headers.common['x-clerk-auth-token']
  }
}

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Token is now set via setAuthToken function
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      console.log('Unauthorized access - redirecting to login')
      // You might want to redirect to login or refresh token here
    }

    return Promise.reject(error)
  }
)

export default api
