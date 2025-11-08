import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import {
  useGetNoteById,
  useLikeNote,
  useUnlikeNote,
} from '../../lib/react-query/queriesAndMutation.js'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/card.jsx'
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from '../../components/ui/avatar.jsx'
import { Badge } from '../../components/ui/badge.jsx'
import { Button } from '../../components/ui/button.jsx'
import { Skeleton } from '../../components/ui/skeleton.jsx'
import {
  ArrowLeft,
  Download,
  Eye,
  Heart,
  MessageCircle,
  Share,
  Bookmark,
  Calendar,
  School,
  BookOpen,
  User,
  Lock,
  AlertCircle,
  ExternalLink,
  Tag,
  FileText,
  Clock,
  GraduationCap,
  Building,
  UserCheck,
  Users,
  FileX,
  Info,
  Search,
  RefreshCw,
} from 'lucide-react'
import UnlikeConfirmationDialog from '../../components/ui/unlike-confirmation-dialog'
import CommentSection from '../../components/notes/CommentSection.jsx'
import { toast } from 'sonner'

const NoteDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user: clerkUser, isSignedIn } = useUser()

  // Use TanStack Query for fetching note details
  const {
    data: noteResponse,
    isLoading: loading,
    isError,
    error: queryError,
    refetch: refetchNoteDetails,
  } = useGetNoteById(id)

  // React Query mutations
  const likeNoteMutation = useLikeNote()
  const unlikeNoteMutation = useUnlikeNote()

  // Extract note data from response
  const noteData = noteResponse?.note || null

  // Convert query error to string format matching original implementation
  const error = isError
    ? queryError?.message || 'Failed to load note details'
    : null

  const [iframeError, setIframeError] = useState(false)
  const [iframeLoading, setIframeLoading] = useState(false)
  const [showUnlikeDialog, setShowUnlikeDialog] = useState(false)
  const [actionLoading, setActionLoading] = useState({
    like: false,
    bookmark: false,
    download: false,
  })

  const handleBack = () => {
    navigate(-1)
  }

  // Handle iframe loading states
  const handleIframeLoad = () => {
    setIframeLoading(false)
    setIframeError(false)
  }

  const handleIframeError = () => {
    console.error('Iframe failed to load Google Drive document')
    setIframeLoading(false)
    setIframeError(true)
  }

  const handleIframeLoadStart = () => {
    setIframeLoading(true)
    setIframeError(false)
  }

  // Initialize iframe loading when noteData becomes available
  useEffect(() => {
    if (noteData?.file?.viewUrl && !iframeError) {
      setIframeLoading(true)
    }
  }, [noteData?.file?.viewUrl])

  const handleDownload = async () => {
    if (!noteData?.permissions?.canDownload || !noteData?.file?.downloadUrl)
      return

    setActionLoading(prev => ({ ...prev, download: true }))
    try {
      // Open download URL in new tab
      window.open(noteData.file.downloadUrl, '_blank')
    } catch (error) {
      console.error('Download error:', error)
    } finally {
      setActionLoading(prev => ({ ...prev, download: false }))
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: noteData.title,
          text: noteData.description,
          url: window.location.href,
        })
        // Show success toast after successful share
        toast.success('Note shared successfully!', {
          description: 'Thanks for sharing this note',
          duration: 3000,
        })
      } catch (error) {
        // User canceled sharing
        if (error.name !== 'AbortError') {
          console.error('Share error:', error)
          toast.error('Failed to share', {
            description: 'Please try again',
          })
        }
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href)
        toast.success('Link copied to clipboard!', {
          description: 'You can now paste it anywhere',
          duration: 3000,
          icon: '📋',
        })
      } catch (error) {
        console.error('Copy to clipboard failed:', error)
        toast.error('Failed to copy link', {
          description: 'Please try again or copy manually',
        })
      }
    }
  }

  const handleLike = async () => {
    if (!isSignedIn) {
      toast.error('Please sign in to like notes')
      return
    }

    if (!noteData?.permissions?.canLike) {
      toast.error('You cannot like this note')
      return
    }

    const isCurrentlyLiked = noteData?.social?.isLiked || false

    if (isCurrentlyLiked) {
      // Show confirmation dialog for unlike
      setShowUnlikeDialog(true)
    } else {
      // Directly like the note
      try {
        await likeNoteMutation.mutateAsync(id)
        toast.success('Note liked!')
      } catch (error) {
        console.error('Like error:', error)
        const errorMessage =
          error?.message || error?.error || 'Failed to like note'
        toast.error(errorMessage)
      }
    }
  }

  const handleUnlike = async () => {
    try {
      await unlikeNoteMutation.mutateAsync(id)
      setShowUnlikeDialog(false)
      toast.success('Note unliked')
    } catch (error) {
      console.error('Unlike error:', error)
      const errorMessage =
        error?.message || error?.error || 'Failed to unlike note'
      toast.error(errorMessage)
    }
  }

  const formatFileSize = bytes => {
    if (!bytes) return 'Unknown size'
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = dateString => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getInitials = name => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
  }

  // Loading state
  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 p-4'>
        <div className='max-w-6xl mx-auto space-y-6'>
          {/* Header skeleton */}
          <div className='flex items-center gap-4'>
            <Skeleton className='w-10 h-10 rounded-lg' />
            <Skeleton className='h-8 w-64' />
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            {/* Main content skeleton */}
            <div className='lg:col-span-2 space-y-6'>
              <Card>
                <CardHeader>
                  <Skeleton className='h-8 w-3/4' />
                  <Skeleton className='h-4 w-full' />
                  <Skeleton className='h-4 w-2/3' />
                </CardHeader>
                <CardContent>
                  <Skeleton className='h-96 w-full rounded-lg' />
                </CardContent>
              </Card>
            </div>

            {/* Sidebar skeleton */}
            <div className='space-y-6'>
              <Card>
                <CardHeader>
                  <Skeleton className='h-6 w-32' />
                </CardHeader>
                <CardContent className='space-y-4'>
                  <Skeleton className='h-4 w-full' />
                  <Skeleton className='h-4 w-3/4' />
                  <Skeleton className='h-4 w-1/2' />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    // Check if it's a private note error
    const isPrivateNote = queryError?.errorType === 'PRIVATE_NOTE'
    const isNotFound = error.includes('not found') || error.includes('404')
    const noteTitle = queryError?.noteTitle
    const uploader = queryError?.uploader

    return (
      <div className='min-h-screen bg-gray-50'>
        <div className='container mx-auto px-4 py-12 max-w-2xl'>
          <Card className='shadow-lg border-0'>
            <CardContent className='p-8'>
              <div className='text-center space-y-6'>
                <div className='w-20 h-20 mx-auto rounded-full flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100'>
                  {isPrivateNote ? (
                    <Lock className='w-10 h-10 text-red-600' />
                  ) : isNotFound ? (
                    <FileX className='w-10 h-10 text-red-600' />
                  ) : (
                    <AlertCircle className='w-10 h-10 text-red-600' />
                  )}
                </div>

                <div className='space-y-3'>
                  <h1 className='text-2xl font-bold text-gray-900'>
                    {isPrivateNote
                      ? 'Private Note'
                      : isNotFound
                        ? 'Note Not Found'
                        : 'Access Error'}
                  </h1>

                  {noteTitle && isPrivateNote && (
                    <p className='text-lg font-medium text-gray-700'>
                      "{noteTitle}"
                    </p>
                  )}

                  <p className='text-gray-600 leading-relaxed'>
                    {isPrivateNote
                      ? 'This note is set to private and can only be accessed by the owner.'
                      : isNotFound
                        ? "The note you're looking for doesn't exist or has been removed."
                        : 'There was an error loading this note. Please try again or contact support if the problem persists.'}
                  </p>

                  {uploader && isPrivateNote && (
                    <p className='text-sm text-gray-500'>
                      Created by{' '}
                      <span className='font-medium'>{uploader.name}</span> (@
                      {uploader.username})
                    </p>
                  )}
                </div>

                {isPrivateNote && (
                  <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                    <div className='flex items-start gap-3'>
                      <Info className='w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0' />
                      <div className='text-left'>
                        <h4 className='font-medium text-blue-900 mb-1'>
                          Need Access?
                        </h4>
                        <p className='text-sm text-blue-700'>
                          Contact the note owner to request access or ask them
                          to share it with you using a private share link.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className='flex gap-3 pt-2'>
                  <Button
                    variant='outline'
                    onClick={handleBack}
                    className='flex-1 border-gray-300 hover:bg-gray-50'
                  >
                    <ArrowLeft className='w-4 h-4 mr-2' />
                    Go Back
                  </Button>
                  {!isPrivateNote && !isNotFound ? (
                    <Button
                      onClick={() => refetchNoteDetails()}
                      className='flex-1 bg-blue-600 hover:bg-blue-700'
                    >
                      <RefreshCw className='w-4 h-4 mr-2' />
                      Try Again
                    </Button>
                  ) : (
                    <Button
                      onClick={() => navigate('/notes')}
                      className='flex-1 bg-blue-600 hover:bg-blue-700'
                    >
                      <Search className='w-4 h-4 mr-2' />
                      Browse Notes
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // No access state
  if (!noteData?.permissions?.hasAccess) {
    return (
      <div className='min-h-screen bg-gray-50 p-4'>
        <div className='max-w-4xl mx-auto'>
          {/* Header */}
          <div className='flex items-center gap-4 mb-6'>
            <Button variant='outline' onClick={handleBack}>
              <ArrowLeft className='w-4 h-4 mr-2' />
              Back
            </Button>
            <h1 className='text-2xl font-bold'>Note Details</h1>
          </div>

          {/* Restricted access card */}
          <Card className='max-w-2xl mx-auto'>
            <CardContent className='pt-6 text-center'>
              <Lock className='w-16 h-16 text-gray-400 mx-auto mb-4' />
              <h3 className='text-xl font-semibold mb-2'>{noteData.title}</h3>

              {/* Basic info for restricted access */}
              <div className='flex items-center justify-center gap-4 mb-4 text-sm text-gray-600'>
                <div className='flex items-center gap-1'>
                  <User className='w-4 h-4' />
                  {noteData.uploader?.name || 'Anonymous'}
                </div>
                <div className='flex items-center gap-1'>
                  <Calendar className='w-4 h-4' />
                  {formatDate(noteData.uploadDate)}
                </div>
              </div>

              <Badge variant='outline' className='mb-4'>
                {noteData.visibility} access required
              </Badge>

              <p className='text-gray-600 mb-4'>{noteData.message}</p>

              {!clerkUser && (
                <Button onClick={() => navigate('/sign-in')}>
                  Sign In to Access
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Main content with access
  return (
    <div className='min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6'>
      <div className='max-w-7xl mx-auto space-y-4 sm:space-y-6'>
        {/* Header - Premium Responsive Design */}
        <div className='space-y-3 sm:space-y-4'>
          {/* Action Bar - Always on Top */}
          <div className='flex items-center justify-between gap-3'>
            {/* Back Button - Icon only */}
            <Button
              variant='outline'
              size='default'
              onClick={handleBack}
              className='shadow-sm hover:shadow-md transition-all hover:scale-105 active:scale-95'
            >
              <ArrowLeft className='w-4 h-4' />
            </Button>

            {/* Action Buttons Group */}
            <div className='flex items-center gap-2'>
              {/* Like Button */}
              {noteData.permissions.canLike && isSignedIn && (
                <Button
                  size='default'
                  variant={noteData.social?.isLiked ? 'default' : 'outline'}
                  onClick={handleLike}
                  disabled={
                    likeNoteMutation.isLoading || unlikeNoteMutation.isLoading
                  }
                  className={`shadow-sm hover:shadow-md transition-all hover:scale-105 active:scale-95 ${noteData.social?.isLiked
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'border-red-200 text-red-600 hover:bg-red-50'
                    }`}
                >
                  <Heart
                    className={`w-4 h-4 ${noteData.social?.isLiked ? 'fill-current' : ''
                      } ${likeNoteMutation.isLoading || unlikeNoteMutation.isLoading ? 'animate-pulse' : ''}`}
                  />
                </Button>
              )}

              {/* Download Button - Icon only */}
              {noteData.permissions.canDownload && (
                <Button
                  size='default'
                  onClick={handleDownload}
                  disabled={actionLoading.download}
                  className='shadow-sm hover:shadow-md transition-all hover:scale-105 active:scale-95 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
                >
                  <Download
                    className={`w-4 h-4 ${actionLoading.download ? 'animate-bounce' : ''}`}
                  />
                </Button>
              )}

              {/* Share Button - Icon only */}
              <Button
                size='default'
                variant='outline'
                onClick={handleShare}
                className='shadow-sm hover:shadow-md transition-all hover:scale-105 active:scale-95'
              >
                <Share className='w-4 h-4' />
              </Button>
            </div>
          </div>

          {/* Title Section - Below buttons on mobile, inline on desktop */}
          <div className='bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5 hover:shadow-md transition-shadow'>
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
              {/* Title and Subtitle */}
              <div className='flex-1 min-w-0 space-y-1'>
                <h1 className='text-lg sm:text-2xl md:text-3xl font-bold text-gray-900 break-words leading-tight'>
                  {noteData.title}
                </h1>
                <div className='flex items-center gap-2 text-xs sm:text-sm text-gray-500'>
                  <FileText className='w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0' />
                  <span>Note Details</span>
                  <span className='hidden sm:inline'>•</span>
                  <span className='hidden sm:inline'>{formatDate(noteData.uploadDate)}</span>
                </div>
              </div>

              {/* Quick Stats - Desktop only */}
              <div className='hidden lg:flex items-center gap-4 flex-shrink-0'>
                <div className='flex items-center gap-1.5 text-sm text-gray-600'>
                  <Eye className='w-4 h-4 text-blue-500' />
                  <span className='font-medium'>{noteData.social?.views || 0}</span>
                </div>
                <div className='flex items-center gap-1.5 text-sm text-gray-600'>
                  <Heart className='w-4 h-4 text-red-500' />
                  <span className='font-medium'>{noteData.social?.likes || 0}</span>
                </div>
                <div className='flex items-center gap-1.5 text-sm text-gray-600'>
                  <Download className='w-4 h-4 text-green-500' />
                  <span className='font-medium'>{noteData.social?.downloads || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
          {/* Main content */}
          <div className='lg:col-span-3 space-y-6'>
            {/* PDF Viewer */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <FileText className='w-5 h-5' />
                  Document Viewer
                </CardTitle>
              </CardHeader>
              <CardContent>
                {noteData.file?.viewUrl ? (
                  <div className='relative'>
                    {/* Iframe loading skeleton */}
                    {iframeLoading && (
                      <div className='absolute inset-0 w-full aspect-[1/1.414] bg-gray-100 rounded-lg flex items-center justify-center z-10'>
                        <div className='text-center text-gray-500'>
                          <div className='animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2'></div>
                          <p className='text-sm'>Loading document preview...</p>
                        </div>
                      </div>
                    )}

                    {!iframeError && (
                      <iframe
                        src={noteData.file.viewUrl}
                        className='w-full aspect-[1/1.414] rounded-lg border'
                        title={noteData.title}
                        loading='lazy'
                        onLoad={handleIframeLoad}
                        onError={handleIframeError}
                        onLoadStart={handleIframeLoadStart}
                        style={{
                          opacity: iframeLoading ? 0 : 1,
                          transition: 'opacity 0.3s ease-in-out',
                        }}
                      />
                    )}

                    {iframeError && (
                      <div className='w-full aspect-[1/1.414] bg-gray-100 rounded-lg flex flex-col items-center justify-center'>
                        <div className='text-center text-gray-500 mb-4'>
                          <FileText className='w-16 h-16 mx-auto mb-3 text-gray-300' />
                          <p className='text-lg font-medium mb-2'>
                            Preview unavailable
                          </p>
                          <p className='text-sm'>
                            Some files cannot be displayed inline due to
                            security restrictions.
                          </p>
                          <Button
                            variant='outline'
                            size='sm'
                            className='mt-3'
                            onClick={() => {
                              setIframeError(false)
                              handleIframeLoadStart()
                            }}
                          >
                            Retry Loading
                          </Button>
                        </div>
                      </div>
                    )}
                    <Button
                      variant='outline'
                      size='sm'
                      className='absolute top-2 right-2 bg-white/90 backdrop-blur-sm'
                      onClick={() =>
                        window.open(
                          noteData.file.directViewUrl || noteData.file.viewUrl,
                          '_blank'
                        )
                      }
                    >
                      <ExternalLink className='w-4 h-4 mr-1' />
                      Open in New Tab
                    </Button>
                  </div>
                ) : (
                  <div className='w-full aspect-[1/1.414] bg-gray-100 rounded-lg flex items-center justify-center'>
                    <div className='text-center text-gray-500'>
                      <FileText className='w-12 h-12 mx-auto mb-2' />
                      <p>Document preview unavailable</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Description & Details */}
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <p className='text-gray-700'>{noteData.description}</p>

                {/* Tags */}
                {noteData.tags && noteData.tags.length > 0 && (
                  <div>
                    <h4 className='font-medium mb-2 flex items-center gap-2'>
                      <Tag className='w-4 h-4' />
                      Tags
                    </h4>
                    <div className='flex flex-wrap gap-2'>
                      {noteData.tags.map((tag, index) => (
                        <Badge key={index} variant='secondary'>
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Keywords */}
                {noteData.content?.keywords &&
                  noteData.content.keywords.length > 0 && (
                    <div>
                      <h4 className='font-medium mb-2'>Keywords</h4>
                      <div className='flex flex-wrap gap-2'>
                        {noteData.content.keywords.map((keyword, index) => (
                          <Badge key={index} variant='outline'>
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>

            {/* Comments Section */}
            <CommentSection noteId={id} />
          </div>

          {/* Sidebar */}
          <div className='space-y-6'>
            {/* Uploader Info */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <User className='w-5 h-5' />
                  Uploaded by
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='flex items-center gap-3 mb-4'>
                  <Avatar className='w-12 h-12'>
                    <AvatarImage src={noteData.uploader?.avatar} />
                    <AvatarFallback>
                      {getInitials(noteData.uploader?.name || 'Anonymous')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className='flex items-center gap-2'>
                      <span className='font-semibold'>
                        {noteData.uploader?.name}
                      </span>
                      {noteData.uploader?.isVerified && (
                        <UserCheck className='w-4 h-4 text-blue-500' />
                      )}
                    </div>
                    <p className='text-sm text-gray-600'>
                      @{noteData.uploader?.username}
                    </p>
                    <Badge variant='outline' size='sm'>
                      {noteData.uploader?.role}
                    </Badge>
                  </div>
                </div>

                <Button
                  variant='outline'
                  className='w-full'
                  onClick={() =>
                    navigate(`/user/${noteData.uploader?.username}`)
                  }
                >
                  View Profile
                </Button>
              </CardContent>
            </Card>

            {/* Academic Info */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <GraduationCap className='w-5 h-5' />
                  Academic Info
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div className='flex items-center gap-2 text-sm'>
                  <School className='w-4 h-4 text-gray-500' />
                  <span>{noteData.academic?.university}</span>
                </div>
                <div className='flex items-center gap-2 text-sm'>
                  <Building className='w-4 h-4 text-gray-500' />
                  <span>{noteData.academic?.department}</span>
                </div>
                <div className='flex items-center gap-2 text-sm'>
                  <BookOpen className='w-4 h-4 text-gray-500' />
                  <span>Semester {noteData.academic?.semester}</span>
                </div>
                <div className='flex items-center gap-2 text-sm'>
                  <Calendar className='w-4 h-4 text-gray-500' />
                  <span>{noteData.academic?.academicYear}</span>
                </div>
              </CardContent>
            </Card>

            {/* File Info */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <FileText className='w-5 h-5' />
                  File Details
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div className='text-sm'>
                  <span className='text-gray-500'>Filename:</span>
                  <p className='font-medium break-all'>
                    {noteData.file?.driveFileName}
                  </p>
                </div>
                <div className='text-sm'>
                  <span className='text-gray-500'>Size:</span>
                  <p className='font-medium'>
                    {formatFileSize(noteData.file?.size)}
                  </p>
                </div>
                <div className='text-sm'>
                  <span className='text-gray-500'>Type:</span>
                  <p className='font-medium'>{noteData.file?.mimeType}</p>
                </div>
                {noteData.file?.pageCount && (
                  <div className='text-sm'>
                    <span className='text-gray-500'>Pages:</span>
                    <p className='font-medium'>{noteData.file.pageCount}</p>
                  </div>
                )}
                <div className='text-sm'>
                  <span className='text-gray-500'>Uploaded:</span>
                  <p className='font-medium'>
                    {formatDate(noteData.uploadDate)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Social Stats */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Users className='w-5 h-5' />
                  Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-2 gap-4 text-center'>
                  <div>
                    <div className='flex items-center justify-center gap-1 text-2xl font-bold'>
                      <Eye className='w-5 h-5 text-gray-500' />
                      {noteData.social?.views || 0}
                    </div>
                    <p className='text-xs text-gray-500'>Views</p>
                  </div>
                  <div>
                    <div className='flex items-center justify-center gap-1 text-2xl font-bold'>
                      <Heart className='w-5 h-5 text-red-500' />
                      {noteData.social?.likes || 0}
                    </div>
                    <p className='text-xs text-gray-500'>Likes</p>
                  </div>
                  <div>
                    <div className='flex items-center justify-center gap-1 text-2xl font-bold'>
                      <Download className='w-5 h-5 text-green-500' />
                      {noteData.social?.downloads || 0}
                    </div>
                    <p className='text-xs text-gray-500'>Downloads</p>
                  </div>
                  <div>
                    <div className='flex items-center justify-center gap-1 text-2xl font-bold'>
                      <Bookmark className='w-5 h-5 text-blue-500' />
                      {noteData.social?.bookmarks || 0}
                    </div>
                    <p className='text-xs text-gray-500'>Bookmarks</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Privacy Badge */}
            <Card>
              <CardContent className='pt-6'>
                <div className='text-center'>
                  <Badge variant='outline' className='mb-2'>
                    {noteData.visibility} visibility
                  </Badge>
                  <p className='text-xs text-gray-500'>
                    This note is visible to{' '}
                    {noteData.visibility === 'public'
                      ? 'everyone'
                      : noteData.visibility === 'university'
                        ? 'university students'
                        : noteData.visibility === 'department'
                          ? 'department students'
                          : noteData.visibility === 'course'
                            ? 'course students'
                            : 'owner only'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Unlike Confirmation Dialog */}
      <UnlikeConfirmationDialog
        isOpen={showUnlikeDialog}
        onClose={() => setShowUnlikeDialog(false)}
        onConfirm={handleUnlike}
        isLoading={unlikeNoteMutation.isLoading}
        noteTitle={noteData?.title || 'this note'}
      />
    </div>
  )
}

export default NoteDetails
