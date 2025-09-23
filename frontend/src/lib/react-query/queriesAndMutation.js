import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { QUERY_KEYS } from './QueryKeys.js'
import { authAPI, notesAPI } from '../../services/api.js'
import { profileAPI } from '../../services/api.js'

// Mutation to check login status
export const useCheckLogin = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: QUERY_KEYS.CHECK_LOGIN,
    mutationFn: authAPI.checkLogin,
    onSuccess: data => {
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
    onError: error => {
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
    onSuccess: data => {
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
    onError: error => {
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
    onSuccess: data => {
      if (data.success) {
        // Invalidate and refetch notes feed
        queryClient.invalidateQueries({ queryKey: ['notes', 'feed'] })
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GET_PROFILE })

        console.log('Note uploaded successfully:', data.message)
      }
    },
    onError: error => {
      console.error('Note upload failed:', error)
    },
  })
}

// ========== PROFILE QUERIES ==========

// Query to get complete user profile with auto user creation
export const useGetProfile = () => {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: QUERY_KEYS.GET_PROFILE,
    queryFn: async () => {
      try {
        // First try to get the profile
        return await profileAPI.getProfile()
      } catch (error) {
        // Check if error is "User not found in database"
        if (
          error.message?.includes('User not found in database') ||
          error.message?.includes('Please create your profile first') ||
          error.status === 404
        ) {
          console.log('User not found in database, creating user profile...')

          try {
            // Create user profile automatically
            const createUserResult = await authAPI.createUser({})

            if (createUserResult.success) {
              console.log(
                'User profile created successfully, fetching profile...'
              )
              // After successful creation, fetch the profile again
              return await profileAPI.getProfile()
            } else {
              throw new Error(
                createUserResult.message || 'Failed to create user profile'
              )
            }
          } catch (createError) {
            console.error('Failed to auto-create user:', createError)
            throw createError
          }
        }

        // Re-throw the error if it's not a "user not found" error
        throw error
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry if it's an auth error or user creation error
      if (
        error.message?.includes('authentication') ||
        error.message?.includes('create user') ||
        error.status === 401 ||
        error.status === 403
      ) {
        return false
      }
      // Retry up to 2 times for other errors
      return failureCount < 2
    },
  })
}

// Query to get user's uploaded notes
export const useGetUploadedNotes = (
  page = 1,
  limit = 10,
  sortBy = 'uploadDate',
  sortOrder = 'desc'
) => {
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

// Query to get public user profile by username
export const useGetPublicProfile = username => {
  return useQuery({
    queryKey: QUERY_KEYS.GET_PUBLIC_PROFILE(username),
    queryFn: () => profileAPI.getPublicProfile(username),
    enabled: !!username, // Only run query when username is available
    staleTime: 3 * 60 * 1000, // 3 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry for 404 (user not found) or 403 (access denied) errors
      if (error.status === 404 || error.status === 403) {
        return false
      }
      // Retry up to 2 times for other errors
      return failureCount < 2
    },
  })
}

// Query to get public user notes by username with pagination
export const useGetPublicUserNotes = (username, options = {}) => {
  const {
    page = 1,
    limit = 12,
    sortBy = 'uploadDate',
    sortOrder = 'desc',
  } = options

  return useQuery({
    queryKey: QUERY_KEYS.GET_PUBLIC_USER_NOTES(
      username,
      page,
      limit,
      sortBy,
      sortOrder
    ),
    queryFn: () =>
      profileAPI.getPublicUserNotes(username, {
        page,
        limit,
        sortBy,
        sortOrder,
      }),
    enabled: !!username, // Only run query when username is available
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
    keepPreviousData: true, // Keep previous data while fetching new page
    retry: (failureCount, error) => {
      // Don't retry for 403 (access denied) or 404 (user not found) errors
      if (error.status === 403 || error.status === 404) {
        return false
      }
      // Retry up to 2 times for other errors
      return failureCount < 2
    },
  })
}

// ========== NOTES QUERIES ==========

// Query to get single note by ID
export const useGetNoteById = noteId => {
  return useQuery({
    queryKey: [...QUERY_KEYS.GET_NOTE, noteId],
    queryFn: () => notesAPI.getNoteById(noteId),
    enabled: !!noteId, // Only run query when noteId is available
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry for 404 or 403 errors
      if (error.status === 404 || error.status === 403) {
        return false
      }
      return failureCount < 2
    },
  })
}

// Query to get notes feed for cards display
export const useGetNotesFeed = (page = 1, limit = 12, filters = {}) => {
  // Create a stable filter string for proper memoization
  const filterString = useMemo(() => {
    const cleaned = {}

    Object.keys(filters || {}).forEach(key => {
      const value = filters[key]
      // Only include filters that have meaningful values
      if (
        value !== null &&
        value !== undefined &&
        value !== '' &&
        value !== 'all' &&
        String(value).trim() !== ''
      ) {
        cleaned[key] = String(value).trim()
      }
    })

    // Create a stable string representation
    return JSON.stringify(
      Object.keys(cleaned)
        .sort()
        .reduce((acc, key) => {
          acc[key] = cleaned[key]
          return acc
        }, {})
    )
  }, [
    filters?.search,
    filters?.category,
    filters?.difficulty,
    filters?.university,
    filters?.department,
    filters?.subject,
    filters?.semester,
    filters?.sortBy,
    filters?.sortOrder,
  ])

  // Parse the stable filter string back to object
  const processedFilters = useMemo(() => {
    return filterString ? JSON.parse(filterString) : {}
  }, [filterString])

  // Create stable query key
  const queryKey = useMemo(() => {
    return ['notes', 'feed', { page, limit, filters: processedFilters }]
  }, [page, limit, processedFilters])

  return useQuery({
    queryKey,
    queryFn: () => notesAPI.getNotesFeed(page, limit, processedFilters),
    keepPreviousData: true,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// ========== ENHANCED PROFILE HOOK WITH USER CREATION ==========

// Enhanced profile hook with loading states for user creation
export const useProfileWithAutoCreation = () => {
  const profileQuery = useGetProfile()
  const createUserMutation = useCreateUser()

  const isCreatingUser = createUserMutation.isLoading
  const creationError = createUserMutation.error
  const wasUserJustCreated =
    createUserMutation.isSuccess && !createUserMutation.isLoading

  return {
    ...profileQuery,
    isCreatingUser,
    creationError,
    wasUserJustCreated,
    isInitializing: profileQuery.isLoading || isCreatingUser,
    // Helper function to manually trigger user creation if needed
    createUserManually: createUserMutation.mutate,
  }

  console.log('🔍 Query Key:', JSON.stringify(queryKey)) // Debug log

  return useQuery({
    queryKey,
    queryFn: () => {
      console.log('📡 API Call - getNotesFeed:', {
        page,
        limit,
        filters: processedFilters,
      }) // Debug log
      return notesAPI.getNotesFeed(page, limit, processedFilters)
    },
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes cache
    retry: false, // Disable retry completely
    retryOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    enabled: true,
    notifyOnChangeProps: ['data', 'isLoading', 'isError', 'error'], // Only notify on these prop changes
  })
}

// ========== PROFILE MUTATIONS ==========

// Mutation to update user profile
export const useUpdateProfile = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: QUERY_KEYS.UPDATE_PROFILE,
    mutationFn: profileAPI.updateProfile,
    onSuccess: data => {
      if (data.success) {
        // Update profile data in cache
        queryClient.setQueryData(QUERY_KEYS.GET_PROFILE, data)
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GET_PROFILE })

        console.log('Profile updated successfully:', data.message)
      }
    },
    onError: error => {
      console.error('Profile update failed:', error)
    },
  })
}

// Mutation to follow a user
export const useFollowUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: QUERY_KEYS.FOLLOW_USER,
    mutationFn: profileAPI.followUser,
    onMutate: async (username) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.GET_PUBLIC_PROFILE(username) })

      // Snapshot the previous value for rollback
      const previousProfile = queryClient.getQueryData(QUERY_KEYS.GET_PUBLIC_PROFILE(username))

      // Optimistically update the profile to show following state
      if (previousProfile?.user) {
        queryClient.setQueryData(QUERY_KEYS.GET_PUBLIC_PROFILE(username), {
          ...previousProfile,
          user: {
            ...previousProfile.user,
            relationship: {
              ...previousProfile.user.relationship,
              isFollowing: true
            }
          }
        })
      }

      // Return context for rollback
      return { previousProfile, username }
    },
    onSuccess: (data, username) => {
      if (data.success) {
        // Only invalidate the essential queries
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.GET_FOLLOWING,
          exact: true
        })

        console.log('User followed successfully:', data.message)
      }
    },
    onError: (error, username, context) => {
      // Rollback on error
      if (context?.previousProfile) {
        queryClient.setQueryData(QUERY_KEYS.GET_PUBLIC_PROFILE(username), context.previousProfile)
      }
      console.error('Follow user failed:', error)
    },
    onSettled: (data, error, username) => {
      // Only refetch the public profile to ensure consistency
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.GET_PUBLIC_PROFILE(username),
        exact: true
      })
    }
  })
}

// Mutation to unfollow a user
export const useUnfollowUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: QUERY_KEYS.UNFOLLOW_USER,
    mutationFn: profileAPI.unfollowUser,
    onMutate: async (username) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.GET_PUBLIC_PROFILE(username) })

      // Snapshot the previous value for rollback
      const previousProfile = queryClient.getQueryData(QUERY_KEYS.GET_PUBLIC_PROFILE(username))

      // Optimistically update the profile to show unfollowing state
      if (previousProfile?.user) {
        queryClient.setQueryData(QUERY_KEYS.GET_PUBLIC_PROFILE(username), {
          ...previousProfile,
          user: {
            ...previousProfile.user,
            relationship: {
              ...previousProfile.user.relationship,
              isFollowing: false
            }
          }
        })
      }

      // Return context for rollback
      return { previousProfile, username }
    },
    onSuccess: (data, username) => {
      if (data.success) {
        // Only invalidate the essential queries
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.GET_FOLLOWING,
          exact: true
        })

        console.log('User unfollowed successfully:', data.message)
      }
    },
    onError: (error, username, context) => {
      // Rollback on error
      if (context?.previousProfile) {
        queryClient.setQueryData(QUERY_KEYS.GET_PUBLIC_PROFILE(username), context.previousProfile)
      }
      console.error('Unfollow user failed:', error)
    },
    onSettled: (data, error, username) => {
      // Only refetch the public profile to ensure consistency
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.GET_PUBLIC_PROFILE(username),
        exact: true
      })
    }
  })
}
