import React, { useState, useCallback, useMemo } from 'react'
import { useUser } from '@clerk/clerk-react'
import {
  useGetComments,
  useAddComment,
  useToggleCommentLike,
  useAddReply,
} from '../lib/react-query/queriesAndMutation.js'
import { toast } from 'sonner'

export const useComments = (noteId, initialLimit = 10) => {
  const { user: clerkUser, isSignedIn } = useUser()
  const [currentPage, setCurrentPage] = useState(1)
  const [replyTo, setReplyTo] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [editingComment, setEditingComment] = useState(null)
  const [editText, setEditText] = useState('')
  const [allComments, setAllComments] = useState([])

  // Queries and mutations
  const {
    data: commentsResponse,
    isLoading: isLoadingComments,
    isError: isCommentsError,
    error: commentsError,
    refetch: refetchComments,
    isFetching: isFetchingComments,
  } = useGetComments(noteId, currentPage, initialLimit)

  const addCommentMutation = useAddComment()
  const toggleCommentLikeMutation = useToggleCommentLike()
  const addReplyMutation = useAddReply()

  // Extract data from response
  const newComments = commentsResponse?.data?.comments || []
  const pagination = commentsResponse?.data?.pagination || {}
  const { hasMore = false, totalComments = 0, totalPages = 1 } = pagination

  // Update accumulated comments when new data arrives
  React.useEffect(() => {
    if (newComments.length > 0) {
      if (currentPage === 1) {
        // First page - replace all comments
        setAllComments(newComments)
      } else {
        // Additional pages - append to existing comments
        setAllComments(prevComments => {
          // Avoid duplicates by checking if comment already exists
          const existingIds = new Set(prevComments.map(comment => comment.id))
          const uniqueNewComments = newComments.filter(
            comment => !existingIds.has(comment.id)
          )
          return [...prevComments, ...uniqueNewComments]
        })
      }
    } else if (currentPage === 1) {
      // No comments on first page
      setAllComments([])
    }
  }, [newComments, currentPage])

  // Use accumulated comments
  const comments = allComments

  // Loading states
  const isAddingComment = addCommentMutation.isPending
  const isTogglingLike = toggleCommentLikeMutation.isPending
  const isAddingReply = addReplyMutation.isPending

  // Error states
  const addCommentError = addCommentMutation.error
  const likeError = toggleCommentLikeMutation.error
  const replyError = addReplyMutation.error

  // Combined loading state
  const isLoading = isLoadingComments || isFetchingComments
  const hasError = isCommentsError || addCommentError || likeError || replyError

  // Memoized computed values
  const canComment = useMemo(() => {
    return isSignedIn && !!clerkUser
  }, [isSignedIn, clerkUser])

  const isFirstLoad = useMemo(() => {
    return isLoadingComments && currentPage === 1
  }, [isLoadingComments, currentPage])

  const isLoadingMore = useMemo(() => {
    return isFetchingComments && currentPage > 1
  }, [isFetchingComments, currentPage])

  // Handlers
  const handleAddComment = useCallback(
    async content => {
      if (!canComment) {
        toast.error('Please sign in to comment')
        return false
      }

      if (!content?.trim()) {
        toast.error('Comment cannot be empty')
        return false
      }

      if (content.length > 1000) {
        toast.error('Comment must be less than 1000 characters')
        return false
      }

      try {
        await addCommentMutation.mutateAsync({
          noteId,
          content: content.trim(),
        })
        toast.success('Comment added successfully')

        // Reset to first page to show the new comment and clear accumulated comments
        setCurrentPage(1)
        setAllComments([]) // Clear accumulated comments to force fresh fetch

        return true
      } catch (error) {
        const errorMessage = error?.message || 'Failed to add comment'
        toast.error(errorMessage)
        console.error('Error adding comment:', error)
        return false
      }
    },
    [noteId, canComment, addCommentMutation, currentPage]
  )

  const handleToggleCommentLike = useCallback(
    async commentId => {
      if (!canComment) {
        toast.error('Please sign in to like comments')
        return false
      }

      try {
        const result = await toggleCommentLikeMutation.mutateAsync({
          noteId,
          commentId,
        })

        // Show success message based on action
        if (result?.data?.action === 'liked') {
          toast.success('Comment liked')
        } else if (result?.data?.action === 'unliked') {
          toast.success('Comment unliked')
        }

        return true
      } catch (error) {
        // Handle specific error messages from the backend
        const errorMessage = error?.message || 'Failed to toggle comment like'

        if (errorMessage.includes('Only main comments can be liked')) {
          toast.error('Only main comments can be liked, not replies')
        } else if (errorMessage.includes('Comment not found')) {
          toast.error('Comment not found. Please refresh and try again.')
        } else {
          toast.error(errorMessage)
        }

        console.error('Error toggling comment like:', error)
        return false
      }
    },
    [noteId, canComment, toggleCommentLikeMutation]
  )

  const handleAddReply = useCallback(
    async (commentId, content) => {
      if (!canComment) {
        toast.error('Please sign in to reply')
        return false
      }

      if (!content?.trim()) {
        toast.error('Reply cannot be empty')
        return false
      }

      if (content.length > 500) {
        toast.error('Reply must be less than 500 characters')
        return false
      }

      try {
        await addReplyMutation.mutateAsync({
          noteId,
          commentId,
          content: content.trim(),
        })
        toast.success('Reply added successfully')

        // Clear reply state
        setReplyTo(null)
        setReplyText('')

        return true
      } catch (error) {
        const errorMessage = error?.message || 'Failed to add reply'
        toast.error(errorMessage)
        console.error('Error adding reply:', error)
        return false
      }
    },
    [noteId, canComment, addReplyMutation]
  )

  const handleLoadMore = useCallback(() => {
    if (hasMore && !isLoading && currentPage < totalPages) {
      setCurrentPage(prev => prev + 1)
    }
  }, [hasMore, isLoading, currentPage, totalPages])

  const handleRefresh = useCallback(() => {
    setCurrentPage(1)
    refetchComments()
  }, [refetchComments])

  const handleStartReply = useCallback((commentId, authorName) => {
    setReplyTo({ id: commentId, authorName })
    setReplyText('')
  }, [])

  const handleCancelReply = useCallback(() => {
    setReplyTo(null)
    setReplyText('')
  }, [])

  const handleStartEdit = useCallback((commentId, currentContent) => {
    setEditingComment(commentId)
    setEditText(currentContent)
  }, [])

  const handleCancelEdit = useCallback(() => {
    setEditingComment(null)
    setEditText('')
  }, [])

  // Return comprehensive state and handlers
  return {
    // Data
    comments,
    pagination,
    totalComments,
    hasMore,
    canComment,

    // Loading states
    isLoading,
    isFirstLoad,
    isLoadingMore,
    isAddingComment,
    isAddingReply,
    isTogglingLike,

    // Error states
    hasError,
    commentsError,
    addCommentError,
    likeError,
    replyError,

    // UI state
    replyTo,
    replyText,
    setReplyText,
    editingComment,
    editText,
    setEditText,

    // Handlers
    handleAddComment,
    handleToggleCommentLike,
    handleAddReply,
    handleLoadMore,
    handleRefresh,
    handleStartReply,
    handleCancelReply,
    handleStartEdit,
    handleCancelEdit,

    // Utility methods
    refetch: refetchComments,
  }
}
