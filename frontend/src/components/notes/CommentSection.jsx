import React, { useState } from 'react'
import { useUser } from '@clerk/clerk-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card.jsx'
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar.jsx'
import { Button } from '../ui/button.jsx'
import { Textarea } from '../ui/textarea.jsx'
import { Skeleton } from '../ui/skeleton.jsx'
import { Badge } from '../ui/badge.jsx'
import { useComments } from '../../hooks/useComments.js'
import {
  MessageCircle,
  Send,
  Heart,
  Reply,
  Loader2,
  AlertCircle,
  RefreshCw,
  Verified,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

// Utility functions moved outside component to prevent recreation
const getInitials = name => {
  return (
    name
      ?.split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '??'
  )
}

const formatDate = dateString => {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)}d ago`

    return date.toLocaleDateString()
  } catch {
    return 'Unknown date'
  }
}

// Comment item component moved outside to prevent recreation on every render
const CommentItem = ({
  comment,
  isReply = false,
  replyTo,
  replyText,
  setReplyText,
  canComment,
  isTogglingLike,
  isAddingReply,
  handleToggleCommentLike,
  handleStartReply,
  handleCancelReply,
  handleSubmitReply,
}) => (
  <div
    className={`${isReply ? 'ml-8 border-l-2 border-gray-100 pl-4' : ''} py-4`}
  >
    <div className='flex gap-3'>
      <Avatar className='w-8 h-8 flex-shrink-0'>
        <AvatarImage src={comment.author.avatar} />
        <AvatarFallback className='text-xs'>
          {getInitials(comment.author.name)}
        </AvatarFallback>
      </Avatar>

      <div className='flex-1 space-y-2'>
        <div className='flex items-start gap-2 flex-wrap'>
          <div className='flex flex-col items-start justify-start gap-1'>
            <span className='font-medium text-sm'>{comment.author.name}</span>
            <span className='text-xs text-gray-500'>
              @{comment.author.username}
            </span>
          </div>
          <span className='text-xs text-gray-500'>
            {formatDate(comment.createdAt)}
          </span>
        </div>

        <div className='text-sm text-gray-700 whitespace-pre-wrap'>
          {comment.content}
        </div>

        <div className='flex items-center gap-4'>
          {/* Only show like button for main comments, not replies */}
          {!isReply && (
            <Button
              variant='ghost'
              size='sm'
              className={`h-6 px-2 gap-1 ${comment.isLiked ? 'text-red-500' : 'text-gray-500'}`}
              onClick={() => handleToggleCommentLike(comment.id)}
              disabled={!canComment || isTogglingLike}
              title={!canComment ? 'Sign in to like comments' : ''}
            >
              {isTogglingLike ? (
                <Loader2 className='w-3 h-3 animate-spin' />
              ) : (
                <Heart
                  className={`w-3 h-3 ${comment.isLiked ? 'fill-current' : ''}`}
                />
              )}
              <span className='text-xs'>{comment.likes || 0}</span>
            </Button>
          )}

          {/* Only show reply button for main comments, not nested replies */}
          {!isReply && (
            <Button
              variant='ghost'
              size='sm'
              className='h-6 px-2 gap-1 text-gray-500'
              onClick={() => handleStartReply(comment.id, comment.author.name)}
              disabled={!canComment}
              title={!canComment ? 'Sign in to reply' : ''}
            >
              <Reply className='w-3 h-3' />
              <span className='text-xs'>Reply</span>
            </Button>
          )}

          {/* For replies, show a simple timestamp or engagement info */}
          {isReply && (
            <span className='text-xs text-gray-400 italic'>Reply</span>
          )}
        </div>

        {/* Reply form - only show for main comments, not nested replies */}
        {!isReply && replyTo?.id === comment.id && (
          <div className='mt-3 space-y-2'>
            <Textarea
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              placeholder={`Reply to ${replyTo.authorName}...`}
              className='min-h-[80px] text-sm'
              maxLength={500}
              autoFocus
            />
            <div className='flex items-center justify-between'>
              <span className='text-xs text-gray-500'>
                {500 - replyText.length} characters remaining
              </span>
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleCancelReply}
                  disabled={isAddingReply}
                >
                  Cancel
                </Button>
                <Button
                  size='sm'
                  onClick={() => handleSubmitReply(comment.id)}
                  disabled={!replyText.trim() || isAddingReply}
                >
                  {isAddingReply ? (
                    <>
                      <Loader2 className='w-3 h-3 mr-1 animate-spin' />
                      Replying...
                    </>
                  ) : (
                    <>
                      <Send className='w-3 h-3 mr-1' />
                      Reply
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className='mt-3 space-y-3'>
            {comment.replies.map(reply => (
              <CommentItem
                key={reply.id}
                comment={reply}
                isReply={true}
                replyTo={replyTo}
                replyText={replyText}
                setReplyText={setReplyText}
                canComment={canComment}
                isTogglingLike={isTogglingLike}
                isAddingReply={isAddingReply}
                handleToggleCommentLike={handleToggleCommentLike}
                handleStartReply={handleStartReply}
                handleCancelReply={handleCancelReply}
                handleSubmitReply={handleSubmitReply}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
)

const CommentSection = ({ noteId }) => {
  const { user: clerkUser, isSignedIn } = useUser()
  const [newComment, setNewComment] = useState('')

  // Use the custom comments hook for state management
  const {
    // Data
    comments,
    totalComments,
    hasMore,
    canComment,

    // Loading states
    isFirstLoad,
    isLoadingMore,
    isAddingComment,
    isAddingReply,
    isTogglingLike,

    // Error states
    hasError,
    commentsError,

    // UI state
    replyTo,
    replyText,
    setReplyText,

    // Handlers
    handleAddComment,
    handleToggleCommentLike,
    handleAddReply,
    handleLoadMore,
    handleRefresh,
    handleStartReply,
    handleCancelReply,
  } = useComments(noteId)

  const handleSubmitComment = async e => {
    e.preventDefault()

    const success = await handleAddComment(newComment)
    if (success) {
      setNewComment('')
    }
  }

  const handleSubmitReply = async commentId => {
    await handleAddReply(commentId, replyText)
  }

  // Loading skeleton for initial load
  const CommentSkeleton = () => (
    <div className='flex gap-3 p-4'>
      <Skeleton className='w-8 h-8 rounded-full' />
      <div className='flex-1 space-y-2'>
        <div className='flex items-center gap-2'>
          <Skeleton className='w-20 h-4' />
          <Skeleton className='w-16 h-3' />
          <Skeleton className='w-12 h-3' />
        </div>
        <Skeleton className='w-full h-16' />
        <div className='flex items-center gap-4'>
          <Skeleton className='w-16 h-6' />
          <Skeleton className='w-12 h-6' />
        </div>
      </div>
    </div>
  )

  return (
    <Card className='w-full'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2'>
            <MessageCircle className='w-5 h-5' />
            Comments ({totalComments})
          </CardTitle>
          {hasError && (
            <Button
              variant='outline'
              size='sm'
              onClick={handleRefresh}
              className='gap-1'
            >
              <RefreshCw className='w-3 h-3' />
              Retry
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className='space-y-4'>
        {/* Error state */}
        {hasError && (
          <div className='flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg'>
            <AlertCircle className='w-4 h-4 text-red-500' />
            <div className='flex-1'>
              <p className='text-sm font-medium text-red-800'>
                Failed to load comments
              </p>
              <p className='text-xs text-red-600'>
                {commentsError?.message ||
                  'Please check your connection and try again'}
              </p>
            </div>
          </div>
        )}

        {/* Comment form */}
        {canComment && (
          <form onSubmit={handleSubmitComment} className='space-y-3'>
            <Textarea
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder='Write a comment...'
              className='min-h-[100px]'
              maxLength={1000}
            />
            <div className='flex items-center justify-between'>
              <span className='text-xs text-gray-500'>
                {1000 - newComment.length} characters remaining
              </span>
              <Button
                type='submit'
                disabled={!newComment.trim() || isAddingComment}
                className='gap-2'
              >
                {isAddingComment ? (
                  <>
                    <Loader2 className='w-4 h-4 animate-spin' />
                    Posting...
                  </>
                ) : (
                  <>
                    <Send className='w-4 h-4' />
                    Post Comment
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        {!canComment && (
          <div className='p-4 bg-gray-50 border border-gray-200 rounded-lg text-center'>
            <p className='text-sm text-gray-600'>
              Please <span className='font-medium'>sign in</span> to post
              comments
            </p>
          </div>
        )}

        {/* Comments list */}
        <div className='space-y-1'>
          {/* Loading state for initial load */}
          {isFirstLoad && (
            <>
              <CommentSkeleton />
              <CommentSkeleton />
              <CommentSkeleton />
            </>
          )}

          {/* Comments */}
          {!isFirstLoad && comments.length > 0 && (
            <div className='divide-y divide-gray-100'>
              {comments.map(comment => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  replyTo={replyTo}
                  replyText={replyText}
                  setReplyText={setReplyText}
                  canComment={canComment}
                  isTogglingLike={isTogglingLike}
                  isAddingReply={isAddingReply}
                  handleToggleCommentLike={handleToggleCommentLike}
                  handleStartReply={handleStartReply}
                  handleCancelReply={handleCancelReply}
                  handleSubmitReply={handleSubmitReply}
                />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isFirstLoad && comments.length === 0 && !hasError && (
            <div className='text-center py-8'>
              <MessageCircle className='w-12 h-12 mx-auto text-gray-300 mb-4' />
              <p className='text-gray-500 text-sm'>No comments yet</p>
              <p className='text-gray-400 text-xs'>
                Be the first to share your thoughts!
              </p>
            </div>
          )}

          {/* Load more button */}
          {hasMore && !hasError && (
            <div className='text-center pt-4'>
              <Button
                variant='outline'
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className='gap-2'
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className='w-4 h-4 animate-spin' />
                    Loading more...
                  </>
                ) : (
                  'Load more comments'
                )}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default CommentSection
