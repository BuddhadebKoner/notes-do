import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from './QueryKeys.js'
import { authAPI, notesAPI } from '../../services/api.js'
import { profileAPI } from '../../services/api.js'

// Mutation to check login status
export const useCheckLogin = () => {
   const queryClient = useQueryClient()

   return useMutation({
      mutationKey: QUERY_KEYS.CHECK_LOGIN,
      mutationFn: authAPI.checkLogin,
      onSuccess: (data) => {
         if (data.success) {
            // Update login status in cache
            queryClient.setQueryData(QUERY_KEYS.CHECK_LOGIN, {
               success: true,
               isLoggedIn: data.isLoggedIn,
               user: data.user || null,
               hasProfile: data.hasProfile || false,
               clerkId: data.clerkId,
               message: 'Login status checked',
               timestamp: new Date().toISOString(),
            })
         }
      },
      onError: (error) => {
         console.error('Login check failed:', error)
      },
   })
}

// Mutation to create user profile
export const useCreateUser = () => {
   const queryClient = useQueryClient()

   return useMutation({
      mutationKey: QUERY_KEYS.CREATE_USER,
      mutationFn: authAPI.createUser,
      onSuccess: (data) => {
         if (data.success) {
            // Update user data in cache
            queryClient.setQueryData(QUERY_KEYS.CHECK_LOGIN, {
               success: true,
               isLoggedIn: true,
               user: data.user,
               hasProfile: true,
               message: data.message || 'User created successfully',
               timestamp: new Date().toISOString(),
            })

            console.log('User created successfully:', data.message)
         }
      },
      onError: (error) => {
         console.error('User creation failed:', error)
      },
   })
}

// Mutation to upload a note
export const useUploadNote = () => {
   const queryClient = useQueryClient()

   return useMutation({
      mutationKey: QUERY_KEYS.UPLOAD_NOTE,
      mutationFn: notesAPI.uploadNote,
      onSuccess: (data) => {
         if (data.success) {
            // Invalidate and refetch notes list
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GET_NOTES })
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GET_PROFILE })

            console.log('Note uploaded successfully:', data.message)
         }
      },
      onError: (error) => {
         console.error('Note upload failed:', error)
      },
   })
}

// ========== PROFILE QUERIES ==========

// Query to get complete user profile
export const useGetProfile = () => {
   return useQuery({
      queryKey: QUERY_KEYS.GET_PROFILE,
      queryFn: profileAPI.getProfile,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
   })
}

// Query to get user's uploaded notes
export const useGetUploadedNotes = (page = 1, limit = 10, sortBy = 'uploadDate', sortOrder = 'desc') => {
   return useQuery({
      queryKey: QUERY_KEYS.GET_UPLOADED_NOTES(page, limit, sortBy, sortOrder),
      queryFn: () => profileAPI.getUploadedNotes(page, limit, sortBy, sortOrder),
      keepPreviousData: true,
      staleTime: 2 * 60 * 1000, // 2 minutes
   })
}

// Query to get user's wishlist
export const useGetWishlist = (page = 1, limit = 10) => {
   return useQuery({
      queryKey: QUERY_KEYS.GET_WISHLIST(page, limit),
      queryFn: () => profileAPI.getWishlist(page, limit),
      keepPreviousData: true,
      staleTime: 2 * 60 * 1000, // 2 minutes
   })
}

// Query to get user's favorites
export const useGetFavorites = (page = 1, limit = 10) => {
   return useQuery({
      queryKey: QUERY_KEYS.GET_FAVORITES(page, limit),
      queryFn: () => profileAPI.getFavorites(page, limit),
      keepPreviousData: true,
      staleTime: 2 * 60 * 1000, // 2 minutes
   })
}

// Query to get user's followers
export const useGetFollowers = () => {
   return useQuery({
      queryKey: QUERY_KEYS.GET_FOLLOWERS,
      queryFn: profileAPI.getFollowers,
      staleTime: 3 * 60 * 1000, // 3 minutes
   })
}

// Query to get user's following
export const useGetFollowing = () => {
   return useQuery({
      queryKey: QUERY_KEYS.GET_FOLLOWING,
      queryFn: profileAPI.getFollowing,
      staleTime: 3 * 60 * 1000, // 3 minutes
   })
}

// Query to get user activity statistics
export const useGetActivityStats = () => {
   return useQuery({
      queryKey: QUERY_KEYS.GET_ACTIVITY_STATS,
      queryFn: profileAPI.getActivityStats,
      staleTime: 5 * 60 * 1000, // 5 minutes
   })
}

// ========== PROFILE MUTATIONS ==========

// Mutation to update user profile
export const useUpdateProfile = () => {
   const queryClient = useQueryClient()

   return useMutation({
      mutationKey: QUERY_KEYS.UPDATE_PROFILE,
      mutationFn: profileAPI.updateProfile,
      onSuccess: (data) => {
         if (data.success) {
            // Update profile data in cache
            queryClient.setQueryData(QUERY_KEYS.GET_PROFILE, data)
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GET_PROFILE })

            console.log('Profile updated successfully:', data.message)
         }
      },
      onError: (error) => {
         console.error('Profile update failed:', error)
      },
   })
}