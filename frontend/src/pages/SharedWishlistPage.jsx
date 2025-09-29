import React, { useEffect, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { useAccessSharedWishlist } from '../lib/react-query/queriesAndMutation.js'
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
  AvatarFallback,
  AvatarImage,
} from '../components/ui/avatar.jsx'
import NoteCard from '../components/notes/NoteCard.jsx'
import {
  FolderOpen,
  Share2,
  Calendar,
  BookOpen,
  AlertTriangle,
  Lock,
  CheckCircle,
  ArrowLeft,
  Eye,
  EyeOff,
} from 'lucide-react'

const SharedWishlistPage = () => {
  const { wishlistId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { isSignedIn, isLoaded } = useAuth()
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  const token = searchParams.get('token')

  // Access shared wishlist query
  const {
    data: sharedWishlistData,
    isLoading,
    error,
    isError,
  } = useAccessSharedWishlist(wishlistId, token, !!wishlistId && !!token)

  useEffect(() => {
    // Show login prompt after 10 seconds if user is not signed in and there are hidden notes
    if (
      isLoaded &&
      !isSignedIn &&
      sharedWishlistData?.success &&
      sharedWishlistData.data.accessInfo.hiddenNotesCount > 0
    ) {
      const timer = setTimeout(() => {
        setShowLoginPrompt(true)
      }, 10000)

      return () => clearTimeout(timer)
    }
  }, [isLoaded, isSignedIn, sharedWishlistData])

  const handleSignIn = () => {
    // Store current URL to redirect back after sign in
    sessionStorage.setItem('redirectAfterAuth', window.location.href)
    navigate('/sign-in')
  }

  const handleBack = () => {
    navigate(-1)
  }

  // Loading state
  if (isLoading) {
    return (
      <div className='min-h-screen bg-gray-50 py-8'>
        <div className='container mx-auto px-4 max-w-6xl'>
          <div className='animate-pulse space-y-6'>
            <div className='h-8 bg-gray-200 rounded w-1/3'></div>
            <Card>
              <CardContent className='p-8'>
                <div className='space-y-4'>
                  <div className='h-6 bg-gray-200 rounded w-3/4'></div>
                  <div className='h-4 bg-gray-200 rounded w-1/2'></div>
                  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className='h-64 bg-gray-200 rounded'></div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (isError || !sharedWishlistData?.success) {
    const errorMessage = error?.message || 'Failed to load shared wishlist'
    const isExpired = error?.message?.includes('expired')
    const isInvalid = error?.message?.includes('Invalid')
    const requiresAuth = error?.requiresAuth
    const isPrivate = error?.message?.includes('private')

    return (
      <div className='min-h-screen bg-gray-50'>
        <div className='container mx-auto px-4 py-12 max-w-2xl'>
          <Card className='shadow-lg border-0'>
            <CardContent className='p-8'>
              <div className='text-center space-y-6'>
                <div className='w-20 h-20 mx-auto rounded-full flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100'>
                  {isExpired ? (
                    <AlertTriangle className='w-10 h-10 text-orange-600' />
                  ) : requiresAuth || isPrivate ? (
                    <Lock className='w-10 h-10 text-blue-600' />
                  ) : (
                    <Lock className='w-10 h-10 text-red-600' />
                  )}
                </div>

                <div className='space-y-3'>
                  <h1 className='text-2xl font-bold text-gray-900'>
                    {isExpired
                      ? 'Link Expired'
                      : requiresAuth || isPrivate
                        ? 'Authentication Required'
                        : 'Access Denied'}
                  </h1>
                  <p className='text-gray-600 leading-relaxed'>
                    {isExpired
                      ? 'This share link has expired and is no longer valid.'
                      : requiresAuth || isPrivate
                        ? 'This is a private wishlist. Please sign in to access it.'
                        : isInvalid
                          ? 'This share link is invalid or has been disabled.'
                          : 'There was an error loading this shared wishlist.'}
                  </p>
                </div>

                {(requiresAuth || isPrivate) && (
                  <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                    <div className='flex items-start gap-3'>
                      <CheckCircle className='w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0' />
                      <div className='text-left'>
                        <h4 className='font-medium text-blue-900 mb-1'>
                          Sign In Required
                        </h4>
                        <p className='text-sm text-blue-700'>
                          This wishlist contains private content. Sign in to
                          access all items.
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
                  {requiresAuth || isPrivate ? (
                    <Button
                      onClick={handleSignIn}
                      className='flex-1 bg-blue-600 hover:bg-blue-700'
                    >
                      <CheckCircle className='w-4 h-4 mr-2' />
                      Sign In
                    </Button>
                  ) : (
                    <Button
                      onClick={() => navigate('/')}
                      className='flex-1 bg-blue-600 hover:bg-blue-700'
                    >
                      <FolderOpen className='w-4 h-4 mr-2' />
                      Browse Wishlists
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

  const { wishlist, accessInfo } = sharedWishlistData.data
  const owner = wishlist.owner

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header with authentication status */}
      <div className='bg-white border-b'>
        <div className='container mx-auto px-4 max-w-6xl py-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <Button
                variant='ghost'
                size='sm'
                onClick={handleBack}
                className='mr-2'
              >
                <ArrowLeft className='h-4 w-4 mr-2' />
                Back
              </Button>
              <FolderOpen className='h-6 w-6 text-purple-600' />
              <span className='font-medium text-lg'>Shared Wishlist</span>
            </div>
            <div className='flex items-center gap-3'>
              {isSignedIn ? (
                <div className='flex items-center gap-2'>
                  <CheckCircle className='h-4 w-4 text-green-600' />
                  <span className='text-sm text-green-600'>Authenticated</span>
                </div>
              ) : (
                <Button onClick={handleSignIn} size='sm'>
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className='container mx-auto px-4 max-w-6xl py-8'>
        <div className='grid lg:grid-cols-4 gap-8'>
          {/* Sidebar */}
          <div className='lg:col-span-1 space-y-6'>
            {/* Wishlist Info */}
            <Card>
              <CardHeader>
                <div className='flex items-center gap-3'>
                  <div
                    className={`w-4 h-4 rounded-full`}
                    style={{
                      backgroundColor: `var(--${wishlist.color || 'purple'}-500)`,
                    }}
                  />
                  <CardTitle className='text-lg'>{wishlist.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {wishlist.description && (
                  <p className='text-sm text-muted-foreground mb-4'>
                    {wishlist.description}
                  </p>
                )}

                <div className='space-y-3 text-sm'>
                  <div className='flex items-center justify-between'>
                    <span className='text-muted-foreground'>Visibility:</span>
                    <Badge
                      variant={wishlist.isPrivate ? 'secondary' : 'default'}
                    >
                      {wishlist.isPrivate ? 'Private' : 'Public'}
                    </Badge>
                  </div>

                  <div className='flex items-center justify-between'>
                    <span className='text-muted-foreground'>Notes:</span>
                    <span className='font-medium'>{wishlist.notesCount}</span>
                  </div>

                  {accessInfo.hiddenNotesCount > 0 && (
                    <div className='flex items-center justify-between'>
                      <span className='text-muted-foreground'>Hidden:</span>
                      <div className='flex items-center gap-1'>
                        <EyeOff className='h-3 w-3 text-muted-foreground' />
                        <span className='text-xs'>
                          {accessInfo.hiddenNotesCount} private
                        </span>
                      </div>
                    </div>
                  )}

                  <div className='flex items-center gap-2 pt-2'>
                    <Calendar className='h-4 w-4 text-muted-foreground' />
                    <span className='text-muted-foreground'>
                      Created{' '}
                      {new Date(wishlist.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Owner Info */}
            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>Created by</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='flex items-center gap-3'>
                  <Avatar>
                    <AvatarImage src={owner.avatar} />
                    <AvatarFallback>
                      {owner.fullName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className='font-medium'>{owner.fullName}</div>
                    <div className='text-sm text-muted-foreground'>
                      @{owner.username}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Login Prompt for Anonymous Users with Hidden Notes */}
            {showLoginPrompt &&
              !isSignedIn &&
              accessInfo.hiddenNotesCount > 0 && (
                <Card className='border-purple-200 bg-purple-50'>
                  <CardContent className='p-6 text-center'>
                    <div className='mb-4'>
                      <EyeOff className='h-12 w-12 mx-auto text-purple-600' />
                    </div>
                    <h3 className='font-medium mb-2'>More Notes Available</h3>
                    <p className='text-sm text-muted-foreground mb-4'>
                      Sign in to see {accessInfo.hiddenNotesCount} more private
                      notes in this wishlist.
                    </p>
                    <Button
                      onClick={handleSignIn}
                      className='w-full bg-purple-600 hover:bg-purple-700'
                    >
                      Sign In to See All Notes
                    </Button>
                  </CardContent>
                </Card>
              )}
          </div>

          {/* Main Content */}
          <div className='lg:col-span-3 space-y-6'>
            {/* Notes Grid */}
            {wishlist.notes && wishlist.notes.length > 0 ? (
              <div>
                <div className='flex items-center justify-between mb-6'>
                  <h2 className='text-2xl font-bold'>
                    Notes ({wishlist.notesCount})
                  </h2>
                  {accessInfo.hiddenNotesCount > 0 && !isSignedIn && (
                    <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                      <EyeOff className='h-4 w-4' />
                      <span>
                        {accessInfo.hiddenNotesCount} private notes hidden
                      </span>
                    </div>
                  )}
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                  {wishlist.notes.map(note => (
                    <NoteCard
                      key={note._id}
                      note={note}
                      showActions={false} // Disable actions for shared notes
                    />
                  ))}
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className='text-center py-16'>
                  <FolderOpen className='w-16 h-16 text-muted-foreground mx-auto mb-4' />
                  <h3 className='text-xl font-semibold mb-2'>
                    {accessInfo.hiddenNotesCount > 0
                      ? 'No Public Notes'
                      : 'Empty Wishlist'}
                  </h3>
                  <p className='text-muted-foreground mb-6'>
                    {accessInfo.hiddenNotesCount > 0
                      ? `This wishlist has ${accessInfo.hiddenNotesCount} private notes. Sign in to see them.`
                      : "This wishlist doesn't contain any notes yet."}
                  </p>
                  {accessInfo.hiddenNotesCount > 0 && !isSignedIn && (
                    <Button
                      onClick={handleSignIn}
                      className='bg-purple-600 hover:bg-purple-700'
                    >
                      Sign In to See Private Notes
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SharedWishlistPage
