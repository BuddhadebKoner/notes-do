import React, { useEffect, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { useAccessSharedNote } from '../lib/react-query/queriesAndMutation.js'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/card.jsx'
import { Button } from '../components/ui/button.jsx'
import { Badge } from '../components/ui/badge.jsx'
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from '../components/ui/avatar.jsx'
import { Skeleton } from '../components/ui/skeleton.jsx'
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
  AlertTriangle,
  Share2,
  CheckCircle,
  RefreshCw,
  Search,
} from 'lucide-react'

const SharePage = () => {
  const { noteId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { isSignedIn, isLoaded } = useAuth()
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [iframeError, setIframeError] = useState(false)
  const [iframeLoading, setIframeLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState({
    download: false,
  })

  const token = searchParams.get('token')

  // Access shared note query
  const {
    data: sharedNoteData,
    isLoading,
    error,
    isError,
    refetch: refetchSharedNote,
  } = useAccessSharedNote(noteId, token, !!noteId && !!token)

  useEffect(() => {
    // Show login prompt after 10 seconds if user is not signed in
    if (isLoaded && !isSignedIn && sharedNoteData?.success) {
      const timer = setTimeout(() => {
        setShowLoginPrompt(true)
      }, 10000)

      return () => clearTimeout(timer)
    }
  }, [isLoaded, isSignedIn, sharedNoteData])

  const handleSignIn = () => {
    // Store current URL to redirect back after sign in
    sessionStorage.setItem('redirectAfterAuth', window.location.href)
    navigate('/sign-in')
  }

  const handleBack = () => {
    navigate('/')
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

  const handleDownload = async () => {
    const note = sharedNoteData?.data?.note
    if (!note?.file?.directViewUrl) return

    setActionLoading(prev => ({ ...prev, download: true }))
    try {
      // Open download URL in new tab
      window.open(note.file.directViewUrl, '_blank')
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
          title: sharedNoteData?.data?.note?.title,
          text: sharedNoteData?.data?.note?.description,
          url: window.location.href,
        })
      } catch (error) {
        // User canceled sharing
        if (error.name !== 'AbortError') {
          console.error('Share error:', error)
        }
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href)
        // You can add toast notification here if available
      } catch (error) {
        console.error('Copy to clipboard failed:', error)
      }
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

  // Initialize iframe loading when noteData becomes available
  useEffect(() => {
    if (sharedNoteData?.data?.note?.file?.viewUrl && !iframeError) {
      setIframeLoading(true)
    }
  }, [sharedNoteData?.data?.note?.file?.viewUrl])

  // Loading state
  if (isLoading) {
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
  if (isError || !sharedNoteData?.success) {
    const errorMessage = error?.message || 'Failed to load shared note'
    const isExpired = error?.message?.includes('expired')
    const isInvalid = error?.message?.includes('Invalid')
    const requiresAuth =
      error?.requiresAuth || error?.message?.includes('Authentication required')
    const isPrivate = error?.message?.includes('private')

    return (
      <div className='min-h-screen bg-gray-50'>
        <div className='container mx-auto px-4 py-12 max-w-2xl'>
          <Card className='shadow-lg border-0'>
            <CardContent className='p-8'>
              <div className='text-center space-y-6'>
                <div className='w-20 h-20 mx-auto rounded-full flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100'>
                  {requiresAuth || isPrivate ? (
                    <UserCheck className='w-10 h-10 text-blue-600' />
                  ) : isExpired ? (
                    <AlertTriangle className='w-10 h-10 text-orange-600' />
                  ) : (
                    <Lock className='w-10 h-10 text-red-600' />
                  )}
                </div>

                <div className='space-y-3'>
                  <h1 className='text-2xl font-bold text-gray-900'>
                    {requiresAuth || isPrivate
                      ? 'Sign In Required'
                      : isExpired
                        ? 'Share Link Expired'
                        : 'Access Denied'}
                  </h1>
                  <p className='text-gray-600 leading-relaxed'>
                    {requiresAuth || isPrivate
                      ? 'This is a private shared note. Please sign in to access it.'
                      : isExpired
                        ? 'This share link has expired and is no longer valid.'
                        : isInvalid
                          ? 'This share link is invalid or has been disabled.'
                          : 'There was an error loading this shared note.'}
                  </p>
                </div>

                {(requiresAuth || isPrivate) && (
                  <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                    <div className='flex items-start gap-3'>
                      <UserCheck className='w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0' />
                      <div className='text-left'>
                        <h4 className='font-medium text-blue-900 mb-1'>
                          Authentication Required
                        </h4>
                        <p className='text-sm text-blue-700'>
                          This note is private and requires you to be signed in
                          to access it.
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
                  {(requiresAuth || isPrivate) && !isSignedIn ? (
                    <Button
                      onClick={handleSignIn}
                      className='flex-1 bg-blue-600 hover:bg-blue-700'
                    >
                      <UserCheck className='w-4 h-4 mr-2' />
                      Sign In
                    </Button>
                  ) : !isExpired && !isInvalid ? (
                    <Button
                      onClick={() => refetchSharedNote()}
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

  const note = sharedNoteData.note

  // Main content with access
  return (
    <div className='min-h-screen bg-gray-50 p-4'>
      <div className='max-w-7xl mx-auto space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <Button variant='outline' onClick={handleBack}>
              <ArrowLeft className='w-4 h-4 mr-2' />
              Back
            </Button>
            <div>
              <h1 className='text-2xl font-bold'>{note.title}</h1>
              <p className='text-gray-600 flex items-center gap-2'>
                <Share2 className='w-4 h-4' />
                Shared Note
                {isSignedIn && (
                  <span className='flex items-center gap-1 text-green-600 text-sm'>
                    <CheckCircle className='w-3 h-3' />
                    Authenticated
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className='flex items-center gap-2'>
            {/* Like button - disabled for shared notes */}
            <Button
              variant='outline'
              disabled
              className='border-red-200 text-red-400 cursor-not-allowed'
            >
              <Heart className='w-4 h-4 mr-2' />
              {note.social?.likesCount || 0} Likes
            </Button>

            {/* Download button */}
            {note?.permissions?.canDownload && (
              <Button
                onClick={handleDownload}
                disabled={actionLoading.download}
              >
                <Download
                  className={`w-4 h-4 mr-2 ${actionLoading.download ? 'animate-pulse' : ''}`}
                />
                {actionLoading.download ? 'Downloading...' : 'Download'}
              </Button>
            )}

            {/* Share button */}
            <Button variant='outline' onClick={handleShare}>
              <Share className='w-4 h-4 mr-2' />
              Share
            </Button>

            {/* Sign in button for anonymous users */}
            {!isSignedIn && <Button onClick={handleSignIn}>Sign In</Button>}
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
                {note.file?.viewUrl ? (
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
                        src={note.file.viewUrl}
                        className='w-full aspect-[1/1.414] rounded-lg border'
                        title={note.title}
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
                          note.file.directViewUrl || note.file.viewUrl,
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
                <p className='text-gray-700'>{note.description}</p>

                {/* Tags */}
                {note.tags && note.tags.length > 0 && (
                  <div>
                    <h4 className='font-medium mb-2 flex items-center gap-2'>
                      <Tag className='w-4 h-4' />
                      Tags
                    </h4>
                    <div className='flex flex-wrap gap-2'>
                      {note.tags.map((tag, index) => (
                        <Badge key={index} variant='secondary'>
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Comments Section - Disabled for shared notes */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <MessageCircle className='w-5 h-5' />
                  Comments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-center py-8 text-gray-500'>
                  <MessageCircle className='w-12 h-12 mx-auto mb-3 text-gray-300' />
                  <h3 className='font-medium mb-2'>Comments Not Available</h3>
                  <p className='text-sm'>
                    Comments are not available for shared notes.
                    {!isSignedIn &&
                      ' Sign in and view the original note to see comments.'}
                  </p>
                  {!isSignedIn && (
                    <Button onClick={handleSignIn} className='mt-4'>
                      Sign In to Access Full Features
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
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
                    <AvatarImage src={note.uploader?.avatar} />
                    <AvatarFallback>
                      {getInitials(note.uploader?.fullName || 'Anonymous')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className='flex items-center gap-2'>
                      <span className='font-semibold'>
                        {note.uploader?.fullName}
                      </span>
                    </div>
                    <p className='text-sm text-gray-600'>
                      @{note.uploader?.username}
                    </p>
                  </div>
                </div>

                {/* Disabled profile button for shared notes */}
                <Button variant='outline' className='w-full' disabled>
                  View Profile (Not Available)
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
                {note.academic?.university &&
                  note.academic.university !== 'ALL' && (
                    <div className='flex items-center gap-2 text-sm'>
                      <School className='w-4 h-4 text-gray-500' />
                      <span>{note.academic.university}</span>
                    </div>
                  )}
                {note.academic?.department &&
                  note.academic.department !== 'ALL' && (
                    <div className='flex items-center gap-2 text-sm'>
                      <Building className='w-4 h-4 text-gray-500' />
                      <span>{note.academic.department}</span>
                    </div>
                  )}
                {note.academic?.semester && note.academic.semester > 0 && (
                  <div className='flex items-center gap-2 text-sm'>
                    <BookOpen className='w-4 h-4 text-gray-500' />
                    <span>Semester {note.academic.semester}</span>
                  </div>
                )}
                {note.academic?.academicYear && (
                  <div className='flex items-center gap-2 text-sm'>
                    <Calendar className='w-4 h-4 text-gray-500' />
                    <span>{note.academic.academicYear}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Subject Info */}
            {note.subject && (
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <BookOpen className='w-5 h-5' />
                    Subject
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-2'>
                    <div className='font-medium'>{note.subject.name}</div>
                    <div className='flex gap-2'>
                      <Badge variant='outline' className='text-xs'>
                        {note.subject.category.replace('-', ' ')}
                      </Badge>
                      <Badge variant='outline' className='text-xs'>
                        {note.subject.difficulty}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

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
                  <span className='text-gray-500'>Size:</span>
                  <p className='font-medium'>
                    {formatFileSize(note.file?.size)}
                  </p>
                </div>
                <div className='text-sm'>
                  <span className='text-gray-500'>Type:</span>
                  <p className='font-medium'>{note.file?.mimeType}</p>
                </div>
                <div className='text-sm'>
                  <span className='text-gray-500'>Uploaded:</span>
                  <p className='font-medium'>{formatDate(note.uploadDate)}</p>
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
                      {note.social?.views || 0}
                    </div>
                    <p className='text-xs text-gray-500'>Views</p>
                  </div>
                  <div>
                    <div className='flex items-center justify-center gap-1 text-2xl font-bold'>
                      <Heart className='w-5 h-5 text-red-500' />
                      {note.social?.likesCount || 0}
                    </div>
                    <p className='text-xs text-gray-500'>Likes</p>
                  </div>
                  <div>
                    <div className='flex items-center justify-center gap-1 text-2xl font-bold'>
                      <Download className='w-5 h-5 text-green-500' />
                      {note.social?.downloads || 0}
                    </div>
                    <p className='text-xs text-gray-500'>Downloads</p>
                  </div>
                  <div>
                    <div className='flex items-center justify-center gap-1 text-2xl font-bold'>
                      <Share2 className='w-5 h-5 text-blue-500' />
                      {note.social?.shares || 0}
                    </div>
                    <p className='text-xs text-gray-500'>Shares</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Privacy Badge */}
            <Card>
              <CardContent className='pt-6'>
                <div className='text-center'>
                  <Badge
                    variant='outline'
                    className='mb-2 flex items-center gap-1 w-fit mx-auto'
                  >
                    <Share2 className='w-3 h-3' />
                    Shared Link Access
                  </Badge>
                  <p className='text-xs text-gray-500'>
                    You're viewing this note via a private share link. Some
                    features may be limited.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Login Prompt for Anonymous Users */}
            {showLoginPrompt && !isSignedIn && (
              <Card className='border-blue-200 bg-blue-50'>
                <CardContent className='p-6 text-center'>
                  <div className='mb-4'>
                    <CheckCircle className='h-12 w-12 mx-auto text-blue-600' />
                  </div>
                  <h3 className='font-medium mb-2'>Enjoying this note?</h3>
                  <p className='text-sm text-muted-foreground mb-4'>
                    Sign in to access full features, like notes, and save them
                    to your collection.
                  </p>
                  <Button onClick={handleSignIn} className='w-full'>
                    Sign In to Continue
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SharePage
