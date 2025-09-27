import api from '../config/api.js'
import { API_ENDPOINTS } from '../config/api.js'

export const wishlistAPI = {
  // Create a new wishlist
  createWishlist: async wishlistData => {
    try {
      const response = await api.post(
        API_ENDPOINTS.WISHLISTS.CREATE,
        wishlistData
      )
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Get all user's wishlists
  getUserWishlists: async (includeNotes = false, page = 1, limit = 10) => {
    try {
      const response = await api.get(API_ENDPOINTS.WISHLISTS.GET_ALL, {
        params: {
          includeNotes: includeNotes.toString(),
          page,
          limit,
        },
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Get a specific wishlist by ID
  getWishlistById: async (wishlistId, page = 1, limit = 20) => {
    try {
      const response = await api.get(
        `${API_ENDPOINTS.WISHLISTS.GET_BY_ID}/${wishlistId}`,
        {
          params: { page, limit },
        }
      )
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Update wishlist details
  updateWishlist: async (wishlistId, updateData) => {
    try {
      const response = await api.put(
        `${API_ENDPOINTS.WISHLISTS.UPDATE}/${wishlistId}`,
        updateData
      )
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Delete a wishlist
  deleteWishlist: async wishlistId => {
    try {
      const response = await api.delete(
        `${API_ENDPOINTS.WISHLISTS.DELETE}/${wishlistId}`
      )
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Add notes to wishlist
  addNotesToWishlist: async (wishlistId, noteIds) => {
    try {
      const response = await api.post(
        `${API_ENDPOINTS.WISHLISTS.ADD_NOTES}/${wishlistId}/notes`,
        {
          noteIds,
        }
      )
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Remove notes from wishlist
  removeNotesFromWishlist: async (wishlistId, noteIds) => {
    try {
      const response = await api.delete(
        `${API_ENDPOINTS.WISHLISTS.REMOVE_NOTES}/${wishlistId}/notes`,
        {
          data: { noteIds },
        }
      )
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },
}
