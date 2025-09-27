import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useUser } from '@clerk/clerk-react'
import { QUERY_KEYS } from './QueryKeys.js'
import { authAPI, notesAPI, commentsAPI } from '../../services/api.js'
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
    mutationFn: async userData => {
      console.log('🚀 Creating user profile with data:', userData)
      return await authAPI.createUser(userData)
    },
    onSuccess: data => {
      if (data.success) {
        // Directly set the profile data in cache instead of invalidating
        queryClient.setQueryData(QUERY_KEYS.GET_PROFILE, {
          success: true,
          user: data.user,
          message: data.message || 'User created successfully',
          timestamp: new Date().toISOString(),
        })

        // Update user data in login cache
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

// Mutation to update note details
export const useUpdateNoteDetails = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: QUERY_KEYS.UPDATE_NOTE,
    mutationFn: ({ noteId, ...data }) =>
      profileAPI.updateNoteDetails(noteId, data),
    onMutate: async ({ noteId, ...data }) => {
      // Cancel any outgoing refetches to prevent race conditions
      await queryClient.cancelQueries({
        queryKey: ['profile', 'uploaded-notes'],
        exact: false,
      })

      // Snapshot all uploaded notes queries for rollback
      const previousQueries = []
      queryClient
        .getQueriesData({
          queryKey: ['profile', 'uploaded-notes'],
        })
        .forEach(([queryKey, data]) => {
          previousQueries.push({ queryKey, data })
        })

      // Optimistically update all matching uploaded notes queries
      queryClient.setQueriesData(
        { queryKey: ['profile', 'uploaded-notes'] },
        old => {
          if (!old?.success || !old?.data?.notes) return old

          return {
            ...old,
            data: {
              ...old.data,
              notes: old.data.notes.map(note =>
                note._id === noteId
                  ? {
                      ...note,
                      // Only update fields that are actually provided
                      ...(data.title && { title: data.title }),
                      ...(data.description && {
                        description: data.description,
                      }),
                      subject: {
                        ...note.subject,
                        ...(data.subject && { name: data.subject }),
                        ...(data.category && { category: data.category }),
                        ...(data.difficulty && { difficulty: data.difficulty }),
                      },
                      academic: {
                        ...note.academic,
                        ...(data.university && { university: data.university }),
                        ...(data.department && { department: data.department }),
                        ...(data.semester && {
                          semester: parseInt(data.semester),
                        }),
                        ...(data.graduationYear && {
                          graduationYear: parseInt(data.graduationYear),
                        }),
                        ...(data.degree && { degree: data.degree }),
                      },
                      ...(data.visibility && { visibility: data.visibility }),
                      ...(data.tags && {
                        tags:
                          typeof data.tags === 'string'
                            ? data.tags
                                .split(',')
                                .map(tag => tag.trim())
                                .filter(Boolean)
                            : data.tags,
                      }),
                    }
                  : note
              ),
            },
          }
        }
      )

      return { previousQueries, noteId }
    },
    onSuccess: (data, variables) => {
      if (data.success && data.note) {
        // Update all uploaded notes queries with actual server response
        queryClient.setQueriesData(
          { queryKey: ['profile', 'uploaded-notes'] },
          old => {
            if (!old?.success || !old?.data?.notes) return old

            return {
              ...old,
              data: {
                ...old.data,
                notes: old.data.notes.map(note =>
                  note._id === variables.noteId
                    ? { ...note, ...data.note }
                    : note
                ),
              },
            }
          }
        )

        // Update individual note cache if it exists
        queryClient.setQueryData(
          [...QUERY_KEYS.GET_NOTE, variables.noteId],
          old => {
            if (!old?.success) return old
            return {
              ...old,
              data: { ...old.data, ...data.note },
            }
          }
        )

        console.log('Note updated successfully:', data.message)
      }
    },
    onError: (error, variables, context) => {
      console.error('Note update failed:', error)

      // Rollback all optimistic updates on error
      if (context?.previousQueries) {
        context.previousQueries.forEach(({ queryKey, data }) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
    },
    onSettled: (data, error, variables) => {
      // Always invalidate uploaded notes queries to ensure fresh data
      queryClient.invalidateQueries({
        queryKey: ['profile', 'uploaded-notes'],
        exact: false,
      })

      // Also invalidate notes feed if update was successful
      if (data?.success) {
        queryClient.invalidateQueries({
          queryKey: ['notes', 'feed'],
          exact: false,
        })
      }
    },
  })
}

// ========== PROFILE QUERIES ==========

// Query to get complete user profile with auto user creation
export const useGetProfile = () => {
  const queryClient = useQueryClient()
  const { user: clerkUser } = useUser()
  const isLoggedIn = !!clerkUser

  return useQuery({
    queryKey: QUERY_KEYS.GET_PROFILE,
    queryFn: async () => {
      console.log('🔄 Fetching user profile...')
      // Simply try to get the profile, let errors bubble up for manual handling
      return await profileAPI.getProfile()
    },
    enabled: isLoggedIn, // Only run query when user is logged in
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
    refetchOnMount: true, // Only refetch on mount if data is stale
    retry: (failureCount, error) => {
      // Don't retry for user not found errors - we want to handle these manually
      if (
        error.message?.includes('User not found in database') ||
        error.message?.includes('Please create your profile first') ||
        error.message?.includes('authentication') ||
        error.message?.includes('create user') ||
        error.status === 401 ||
        error.status === 403 ||
        error.status === 404
      ) {
        return false
      }
      // Retry up to 1 time for other errors
      return failureCount < 1
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

// Query to get public user followers by username with pagination
export const useGetPublicUserFollowers = (username, options = {}) => {
  const { page = 1, limit = 20 } = options

  return useQuery({
    queryKey: QUERY_KEYS.GET_PUBLIC_USER_FOLLOWERS(username, page, limit),
    queryFn: () =>
      profileAPI.getPublicUserFollowers(username, {
        page,
        limit,
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
    // Convert filters to a stable string representation
    const cleanFilters = {}
    Object.entries(filters).forEach(([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== '' &&
        value !== 'all'
      ) {
        cleanFilters[key] = value
      }
    })
    return JSON.stringify(cleanFilters, Object.keys(cleanFilters).sort())
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
    return JSON.parse(filterString)
  }, [filterString])

  // Create stable query key
  const queryKey = useMemo(() => {
    return QUERY_KEYS.GET_NOTES_FEED(page, limit, processedFilters)
  }, [page, limit, processedFilters])

  return useQuery({
    queryKey,
    queryFn: () => notesAPI.getNotesFeed(page, limit, processedFilters),
    keepPreviousData: true,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// ========== NOTES MUTATIONS ==========

// Mutation to like a note
export const useLikeNote = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: QUERY_KEYS.LIKE_NOTE,
    mutationFn: notesAPI.likeNote,
    onSuccess: (data, noteId) => {
      // Update note details cache
      queryClient.setQueryData([...QUERY_KEYS.GET_NOTE, noteId], oldData => {
        if (!oldData?.note) return oldData
        return {
          ...oldData,
          note: {
            ...oldData.note,
            social: {
              ...oldData.note.social,
              likes: data.data.likesCount,
              isLiked: true,
            },
          },
        }
      })

      // Update all notes feed caches
      const updateNoteLikes = notes =>
        notes.map(note =>
          note._id === noteId
            ? {
                ...note,
                stats: {
                  ...note.stats,
                  likes: data.data.likesCount,
                  isLiked: true,
                },
              }
            : note
        )

      // Update notes feed
      queryClient.setQueriesData({ queryKey: ['notes', 'feed'] }, oldData => {
        if (!oldData?.notes) return oldData
        return { ...oldData, notes: updateNoteLikes(oldData.notes) }
      })

      // Update uploaded notes cache
      queryClient.setQueriesData(
        { queryKey: QUERY_KEYS.GET_UPLOADED_NOTES() },
        oldData => {
          if (!oldData?.notes) return oldData
          return { ...oldData, notes: updateNoteLikes(oldData.notes) }
        }
      )

      // Update public user notes cache
      queryClient.setQueriesData(
        { queryKey: ['profile', 'public', 'notes'] },
        oldData => {
          if (!oldData?.notes) return oldData
          return { ...oldData, notes: updateNoteLikes(oldData.notes) }
        }
      )
    },
    onError: error => {
      console.error('Failed to like note:', error)
    },
  })
}

// Mutation to unlike a note
export const useUnlikeNote = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: QUERY_KEYS.UNLIKE_NOTE,
    mutationFn: notesAPI.unlikeNote,
    onSuccess: (data, noteId) => {
      // Update note details cache
      queryClient.setQueryData([...QUERY_KEYS.GET_NOTE, noteId], oldData => {
        if (!oldData?.note) return oldData
        return {
          ...oldData,
          note: {
            ...oldData.note,
            social: {
              ...oldData.note.social,
              likes: data.data.likesCount,
              isLiked: false,
            },
          },
        }
      })

      // Update all notes feed caches
      const updateNoteLikes = notes =>
        notes.map(note =>
          note._id === noteId
            ? {
                ...note,
                stats: {
                  ...note.stats,
                  likes: data.data.likesCount,
                  isLiked: false,
                },
              }
            : note
        )

      // Update notes feed
      queryClient.setQueriesData({ queryKey: ['notes', 'feed'] }, oldData => {
        if (!oldData?.notes) return oldData
        return { ...oldData, notes: updateNoteLikes(oldData.notes) }
      })

      // Update uploaded notes cache
      queryClient.setQueriesData(
        { queryKey: QUERY_KEYS.GET_UPLOADED_NOTES() },
        oldData => {
          if (!oldData?.notes) return oldData
          return { ...oldData, notes: updateNoteLikes(oldData.notes) }
        }
      )

      // Update public user notes cache
      queryClient.setQueriesData(
        { queryKey: ['profile', 'public', 'notes'] },
        oldData => {
          if (!oldData?.notes) return oldData
          return { ...oldData, notes: updateNoteLikes(oldData.notes) }
        }
      )
    },
    onError: error => {
      console.error('Failed to unlike note:', error)
    },
  })
}

// ========== COMMENTS QUERIES ==========

// Query to get comments for a note with pagination
export const useGetComments = (noteId, page = 1, limit = 10) => {
  return useQuery({
    queryKey: QUERY_KEYS.GET_COMMENTS(noteId, page, limit),
    queryFn: () => commentsAPI.getComments(noteId, page, limit),
    enabled: !!noteId, // Only run query when noteId is available
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
    keepPreviousData: true, // Keep previous data while fetching new page
    retry: (failureCount, error) => {
      // Don't retry for 404 or 403 errors
      if (error.status === 404 || error.status === 403) {
        return false
      }
      return failureCount < 2
    },
  })
}

// ========== COMMENTS MUTATIONS ==========

// Mutation to add a new comment
export const useAddComment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: QUERY_KEYS.ADD_COMMENT,
    mutationFn: ({ noteId, content }) =>
      commentsAPI.addComment(noteId, content),
    onMutate: async ({ noteId }) => {
      // Cancel any outgoing refetches for comments
      await queryClient.cancelQueries({
        queryKey: ['comments', 'list', noteId],
      })

      // Snapshot the previous values for rollback
      const previousComments = []
      queryClient
        .getQueriesData({
          queryKey: ['comments', 'list', noteId],
        })
        .forEach(([queryKey, data]) => {
          previousComments.push({ queryKey, data })
        })

      return { previousComments, noteId }
    },
    onSuccess: (data, { noteId }) => {
      if (data.success) {
        // Invalidate and refetch comments for the note
        queryClient.invalidateQueries({
          queryKey: ['comments', 'list', noteId],
        })

        // Update the note's comment count if cached
        queryClient.setQueryData([...QUERY_KEYS.GET_NOTE, noteId], oldData => {
          if (oldData?.note) {
            return {
              ...oldData,
              note: {
                ...oldData.note,
                social: {
                  ...oldData.note.social,
                  comments: (oldData.note.social.comments || 0) + 1,
                },
              },
            }
          }
          return oldData
        })
      }
    },
    onError: (error, { noteId }, context) => {
      console.error('Error adding comment:', error)

      // Rollback optimistic updates on error
      if (context?.previousComments) {
        context.previousComments.forEach(({ queryKey, data }) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
    },
  })
}

// Mutation to toggle comment like/unlike
export const useToggleCommentLike = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: QUERY_KEYS.LIKE_COMMENT,
    mutationFn: ({ noteId, commentId }) =>
      commentsAPI.toggleCommentLike(noteId, commentId),
    onMutate: async ({ noteId, commentId }) => {
      // Cancel any outgoing refetches for comments
      await queryClient.cancelQueries({
        queryKey: ['comments', 'list', noteId],
      })

      // Snapshot the previous values for rollback
      const previousComments = []
      queryClient
        .getQueriesData({
          queryKey: ['comments', 'list', noteId],
        })
        .forEach(([queryKey, data]) => {
          previousComments.push({ queryKey, data })
        })

      // Optimistically update comments
      queryClient.setQueriesData(
        {
          queryKey: ['comments', 'list', noteId],
        },
        oldData => {
          if (!oldData?.data?.comments) return oldData

          return {
            ...oldData,
            data: {
              ...oldData.data,
              comments: oldData.data.comments.map(comment => {
                if (comment.id === commentId) {
                  return {
                    ...comment,
                    isLiked: !comment.isLiked,
                    likes: comment.isLiked
                      ? comment.likes - 1
                      : comment.likes + 1,
                  }
                }
                return comment
              }),
            },
          }
        }
      )

      return { previousComments, noteId, commentId }
    },
    onSuccess: (data, { noteId }) => {
      // Data is already optimistically updated
      // Just ensure consistency by refetching if needed
      if (!data.success) {
        queryClient.invalidateQueries({
          queryKey: ['comments', 'list', noteId],
        })
      }
    },
    onError: (error, { noteId }, context) => {
      console.error('Error toggling comment like:', error)

      // Rollback optimistic updates on error
      if (context?.previousComments) {
        context.previousComments.forEach(({ queryKey, data }) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
    },
  })
}

// Mutation to add a reply to a comment
export const useAddReply = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: QUERY_KEYS.ADD_REPLY,
    mutationFn: ({ noteId, commentId, content }) =>
      commentsAPI.addReply(noteId, commentId, content),
    onMutate: async ({ noteId }) => {
      // Cancel any outgoing refetches for comments
      await queryClient.cancelQueries({
        queryKey: ['comments', 'list', noteId],
      })

      // Snapshot the previous values for rollback
      const previousComments = []
      queryClient
        .getQueriesData({
          queryKey: ['comments', 'list', noteId],
        })
        .forEach(([queryKey, data]) => {
          previousComments.push({ queryKey, data })
        })

      return { previousComments, noteId }
    },
    onSuccess: (data, { noteId }) => {
      if (data.success) {
        // Invalidate and refetch comments for the note to show the new reply
        queryClient.invalidateQueries({
          queryKey: ['comments', 'list', noteId],
        })
      }
    },
    onError: (error, { noteId }, context) => {
      console.error('Error adding reply:', error)

      // Rollback optimistic updates on error
      if (context?.previousComments) {
        context.previousComments.forEach(({ queryKey, data }) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
    },
  })
}

// ========== ENHANCED PROFILE HOOK WITH USER CREATION ==========

// Enhanced profile hook with loading states for user creation
export const useProfileWithAutoCreation = () => {
  const profileQuery = useGetProfile()
  const createUserMutation = useCreateUser()
  const { user: clerkUser } = useUser()

  const isLoggedIn = !!clerkUser
  const isCreatingUser = createUserMutation.isLoading
  const creationError = createUserMutation.error
  const wasUserJustCreated =
    createUserMutation.isSuccess && !createUserMutation.isLoading

  // Only check for user creation need when:
  // 1. User is logged in
  // 2. Profile query has finished (not loading)
  // 3. Profile query has an error
  // 4. User is not currently being created
  // 5. User hasn't just been created
  const needsUserCreation =
    isLoggedIn &&
    !profileQuery.isLoading &&
    !isCreatingUser &&
    !wasUserJustCreated &&
    profileQuery.error &&
    (profileQuery.error.message?.includes('User profile not found') ||
      profileQuery.error.message?.includes(
        'Please create your profile first'
      ) ||
      profileQuery.error.message?.includes('User not found in database'))

  return {
    ...profileQuery,
    isCreatingUser,
    creationError,
    wasUserJustCreated,
    needsUserCreation,
    isInitializing: profileQuery.isLoading || isCreatingUser,
    // Helper function to manually trigger user creation if needed
    createUserManually: createUserMutation.mutate,
  }
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
    onMutate: async username => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: QUERY_KEYS.GET_PUBLIC_PROFILE(username),
      })

      // Snapshot the previous value for rollback
      const previousProfile = queryClient.getQueryData(
        QUERY_KEYS.GET_PUBLIC_PROFILE(username)
      )

      // Optimistically update the profile to show following state
      if (previousProfile?.user) {
        queryClient.setQueryData(QUERY_KEYS.GET_PUBLIC_PROFILE(username), {
          ...previousProfile,
          user: {
            ...previousProfile.user,
            relationship: {
              ...previousProfile.user.relationship,
              isFollowing: true,
            },
          },
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
          exact: true,
        })

        console.log('User followed successfully:', data.message)
      }
    },
    onError: (error, username, context) => {
      // Rollback on error
      if (context?.previousProfile) {
        queryClient.setQueryData(
          QUERY_KEYS.GET_PUBLIC_PROFILE(username),
          context.previousProfile
        )
      }
      console.error('Follow user failed:', error)
    },
    onSettled: (data, error, username) => {
      // Only refetch the public profile to ensure consistency
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.GET_PUBLIC_PROFILE(username),
        exact: true,
      })
    },
  })
}

// Mutation to unfollow a user
export const useUnfollowUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: QUERY_KEYS.UNFOLLOW_USER,
    mutationFn: profileAPI.unfollowUser,
    onMutate: async username => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: QUERY_KEYS.GET_PUBLIC_PROFILE(username),
      })

      // Snapshot the previous value for rollback
      const previousProfile = queryClient.getQueryData(
        QUERY_KEYS.GET_PUBLIC_PROFILE(username)
      )

      // Optimistically update the profile to show unfollowing state
      if (previousProfile?.user) {
        queryClient.setQueryData(QUERY_KEYS.GET_PUBLIC_PROFILE(username), {
          ...previousProfile,
          user: {
            ...previousProfile.user,
            relationship: {
              ...previousProfile.user.relationship,
              isFollowing: false,
            },
          },
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
          exact: true,
        })

        console.log('User unfollowed successfully:', data.message)
      }
    },
    onError: (error, username, context) => {
      // Rollback on error
      if (context?.previousProfile) {
        queryClient.setQueryData(
          QUERY_KEYS.GET_PUBLIC_PROFILE(username),
          context.previousProfile
        )
      }
      console.error('Unfollow user failed:', error)
    },
    onSettled: (data, error, username) => {
      // Only refetch the public profile to ensure consistency
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.GET_PUBLIC_PROFILE(username),
        exact: true,
      })
    },
  })
}

// =============================================================================
// WISHLIST QUERIES AND MUTATIONS
// =============================================================================

import { wishlistAPI } from '../../services/wishlistAPI.js'

// Query to get user's wishlists
export const useGetUserWishlists = (
  includeNotes = false,
  page = 1,
  limit = 10
) => {
  return useQuery({
    queryKey: QUERY_KEYS.GET_USER_WISHLISTS(includeNotes, page, limit),
    queryFn: () => wishlistAPI.getUserWishlists(includeNotes, page, limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Query to get a specific wishlist by ID
export const useGetWishlistById = (wishlistId, page = 1, limit = 20) => {
  return useQuery({
    queryKey: QUERY_KEYS.GET_WISHLIST_BY_ID(wishlistId, page, limit),
    queryFn: () => wishlistAPI.getWishlistById(wishlistId, page, limit),
    enabled: !!wishlistId,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  })
}

// Mutation to create a new wishlist
export const useCreateWishlist = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: QUERY_KEYS.CREATE_WISHLIST,
    mutationFn: wishlistAPI.createWishlist,
    onSuccess: data => {
      if (data.success) {
        // Invalidate wishlists queries to refetch updated data
        queryClient.invalidateQueries({
          queryKey: ['wishlists', 'user'],
        })

        // Update profile cache to reflect new wishlist count
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.GET_PROFILE,
        })
      }
    },
    onError: error => {
      console.error('Create wishlist failed:', error)
    },
  })
}

// Mutation to update a wishlist
export const useUpdateWishlist = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: QUERY_KEYS.UPDATE_WISHLIST,
    mutationFn: ({ wishlistId, updateData }) =>
      wishlistAPI.updateWishlist(wishlistId, updateData),
    onSuccess: (data, variables) => {
      if (data.success) {
        // Invalidate related queries
        queryClient.invalidateQueries({
          queryKey: ['wishlists', 'user'],
        })
        queryClient.invalidateQueries({
          queryKey: ['wishlists', 'detail', variables.wishlistId],
        })
      }
    },
    onError: error => {
      console.error('Update wishlist failed:', error)
    },
  })
}

// Mutation to delete a wishlist
export const useDeleteWishlist = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: QUERY_KEYS.DELETE_WISHLIST,
    mutationFn: wishlistAPI.deleteWishlist,
    onSuccess: (data, wishlistId) => {
      if (data.success) {
        // Remove from cache
        queryClient.removeQueries({
          queryKey: ['wishlists', 'detail', wishlistId],
        })

        // Invalidate wishlists list
        queryClient.invalidateQueries({
          queryKey: ['wishlists', 'user'],
        })

        // Update profile cache
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.GET_PROFILE,
        })
      }
    },
    onError: error => {
      console.error('Delete wishlist failed:', error)
    },
  })
}

// Mutation to add notes to wishlist
export const useAddNotesToWishlist = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: QUERY_KEYS.ADD_NOTES_TO_WISHLIST,
    mutationFn: ({ wishlistId, noteIds }) =>
      wishlistAPI.addNotesToWishlist(wishlistId, noteIds),
    onSuccess: (data, variables) => {
      if (data.success) {
        // Invalidate specific wishlist detail
        queryClient.invalidateQueries({
          queryKey: ['wishlists', 'detail', variables.wishlistId],
        })

        // Invalidate wishlists list if it includes notes
        queryClient.invalidateQueries({
          queryKey: ['wishlists', 'user'],
        })
      }
    },
    onError: error => {
      console.error('Add notes to wishlist failed:', error)
    },
  })
}

// Mutation to remove notes from wishlist
export const useRemoveNotesFromWishlist = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: QUERY_KEYS.REMOVE_NOTES_FROM_WISHLIST,
    mutationFn: ({ wishlistId, noteIds }) =>
      wishlistAPI.removeNotesFromWishlist(wishlistId, noteIds),
    onSuccess: (data, variables) => {
      if (data.success) {
        // Invalidate specific wishlist detail
        queryClient.invalidateQueries({
          queryKey: ['wishlists', 'detail', variables.wishlistId],
        })

        // Invalidate wishlists list
        queryClient.invalidateQueries({
          queryKey: ['wishlists', 'user'],
        })
      }
    },
    onError: error => {
      console.error('Remove notes from wishlist failed:', error)
    },
  })
}
