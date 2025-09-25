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
  MoreVertical,
  Flag,
  Trash2,
  Edit3,
  Loader2,
  AlertCircle,
  RefreshCw,
  Verified,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

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
    addCommentError,
    likeError,
    replyError,

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

  const getInitials = name => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
  }

  const formatDate = dateString => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60))

    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    })
  }

  const handleSubmitComment = async e => {
    e.preventDefault()

    const success = await handleAddComment(newComment)
    if (success) {
      setNewComment('')
    }
  }

  const handleSubmitReply = async commentId => {
    const success = await handleAddReply(commentId, replyText)
    // The hook handles clearing replyTo and replyText on success
  }

  const handleLikeComment = async commentId => {
    await handleToggleCommentLike(commentId)
  }

  // Note: Edit, delete, and report functionality will be implemented later

  const CommentItem = ({ comment, isReply = false }) => (
    <div className={`${isReply ? 'ml-8 border-l-2 border-gray-100 pl-4' : ''}`}>
      <div className='flex gap-3'>
        <Avatar className='w-8 h-8 flex-shrink-0'>
          <AvatarImage src={comment.author.avatar} />
          <AvatarFallback className='text-xs'>
            {getInitials(comment.author.name)}
          </AvatarFallback>
        </Avatar>

        <div className='flex-1 space-y-2'>
          <div className='flex items-center gap-2'>
            <span className='font-medium text-sm'>{comment.author.name}</span>
            <span className='text-xs text-gray-500'>
              @{comment.author.username}
            </span>
            {comment.author.isVerified && (
              <div className='w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center'>
                <svg
                  className='w-2 h-2 text-white'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path
                    fillRule='evenodd'
                    d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                    clipRule='evenodd'
                  />
                </svg>
              </div>
            )}
            <span className='text-xs text-gray-500'>
              {formatDate(comment.createdAt)}
            </span>
          </div>

          {editingComment === comment.id ? (
            <div className='space-y-2'>
              <Textarea
                value={editText}
                onChange={e => setEditText(e.target.value)}
                placeholder='Edit your comment...'
                className='min-h-[60px] resize-none'
              />
              <div className='flex gap-2'>
                <Button
                  size='sm'
                  onClick={() => handleEditComment(comment.id)}
                  disabled={!editText.trim()}
                >
                  Save
                </Button>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => {
                    setEditingComment(null)
                    setEditText('')
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className='text-sm text-gray-700'>{comment.content}</p>

              <div className='flex items-center gap-4'>
                <button
                  onClick={() => handleLikeComment(comment.id)}
                  className={`flex items-center gap-1 text-xs transition-colors ${
                    comment.isLiked
                      ? 'text-red-500 hover:text-red-600'
                      : 'text-gray-500 hover:text-red-500'
                  }`}
                  disabled={!isSignedIn}
                >
                  <Heart
                    className={`w-3 h-3 ${comment.isLiked ? 'fill-current' : ''}`}
                  />
                  {comment.likes}
                </button>

                {canComment && !isReply && (
                  <button
                    onClick={() => {
                      setReplyTo(replyTo === comment.id ? null : comment.id)
                      setReplyText('')
                    }}
                    className='flex items-center gap-1 text-xs text-gray-500 hover:text-blue-500 transition-colors'
                  >
                    <Reply className='w-3 h-3' />
                    Reply
                  </button>
                )}

                <div className='relative group'>
                  <button className='text-xs text-gray-400 hover:text-gray-600 transition-colors'>
                    <MoreVertical className='w-3 h-3' />
                  </button>

                  <div className='absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg py-1 min-w-[120px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10'>
                    {comment.canEdit && (
                      <button
                        onClick={() => {
                          setEditingComment(comment.id)
                          setEditText(comment.content)
                        }}
                        className='w-full px-3 py-1 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2'
                      >
                        <Edit3 className='w-3 h-3' />
                        Edit
                      </button>
                    )}

                    {comment.canDelete && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className='w-full px-3 py-1 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-2'
                      >
                        <Trash2 className='w-3 h-3' />
                        Delete
                      </button>
                    )}

                    {!comment.canEdit && !comment.canDelete && (
                      <button
                        onClick={() => handleReportComment(comment.id)}
                        className='w-full px-3 py-1 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-2'
                      >
                        <Flag className='w-3 h-3' />
                        Report
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Reply Form */}
          {replyTo === comment.id && canComment && (
            <div className='mt-3 space-y-2'>
              <Textarea
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder={`Reply to ${comment.author.name}...`}
                className='min-h-[60px] resize-none'
              />
              <div className='flex gap-2'>
                <Button
                  size='sm'
                  onClick={() => handleSubmitReply(comment.id)}
                  disabled={!replyText.trim() || isSubmitting}
                >
                  {isSubmitting ? 'Posting...' : 'Reply'}
                </Button>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => {
                    setReplyTo(null)
                    setReplyText('')
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className='mt-4 space-y-4'>
              {comment.replies.map(reply => (
                <CommentItem key={reply.id} comment={reply} isReply={true} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  if (!canComment) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <MessageCircle className='w-5 h-5' />
          Comments ({commentsCount})
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* Comment Form */}
        {isSignedIn ? (
          <form onSubmit={handleSubmitComment} className='space-y-3'>
            <div className='flex gap-3'>
              <Avatar className='w-8 h-8 flex-shrink-0'>
                <AvatarImage src={clerkUser?.imageUrl} />
                <AvatarFallback className='text-xs'>
                  {getInitials(
                    clerkUser?.fullName || clerkUser?.firstName || 'User'
                  )}
                </AvatarFallback>
              </Avatar>
              <div className='flex-1'>
                <Textarea
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder='Share your thoughts about this note...'
                  className='min-h-[80px] resize-none'
                  disabled={!canComment}
                />
              </div>
            </div>
            <div className='flex justify-end'>
              <Button
                type='submit'
                disabled={!newComment.trim() || isSubmitting || !canComment}
                className='flex items-center gap-2'
              >
                <Send className='w-4 h-4' />
                {isSubmitting ? 'Posting...' : 'Post Comment'}
              </Button>
            </div>
          </form>
        ) : (
          <div className='text-center py-4 bg-gray-50 rounded-lg'>
            <p className='text-sm text-gray-600 mb-2'>
              Please sign in to join the discussion
            </p>
            <Button
              size='sm'
              onClick={() => (window.location.href = '/sign-in')}
            >
              Sign In
            </Button>
          </div>
        )}

        {/* Comments List */}
        {isLoading ? (
          <div className='space-y-4'>
            {[1, 2, 3].map(i => (
              <div key={i} className='flex gap-3'>
                <div className='w-8 h-8 bg-gray-200 rounded-full animate-pulse' />
                <div className='flex-1 space-y-2'>
                  <div className='h-4 bg-gray-200 rounded animate-pulse w-1/4' />
                  <div className='h-3 bg-gray-200 rounded animate-pulse w-3/4' />
                  <div className='h-3 bg-gray-200 rounded animate-pulse w-1/2' />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length > 0 ? (
          <div className='space-y-6'>
            {comments.map(comment => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
          </div>
        ) : (
          <div className='text-center py-8 text-gray-500'>
            <MessageCircle className='w-12 h-12 mx-auto mb-2 text-gray-300' />
            <p className='font-medium mb-1'>No comments yet</p>
            <p className='text-sm'>Be the first to share your thoughts!</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default CommentSection
