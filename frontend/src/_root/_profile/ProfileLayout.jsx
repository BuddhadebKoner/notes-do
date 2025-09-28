import React, { useEffect, useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import {
  SignedIn,
  SignedOut,
  SignInButton,
  useUser,
  useAuth as useClerkAuth,
} from '@clerk/clerk-react'
import { useProfileWithAutoCreation } from '../../lib/react-query/queriesAndMutation.js'
import { setAuthToken } from '../../config/api.js'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/card.jsx'
import { Button } from '../../components/ui/button.jsx'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '../../components/ui/avatar.jsx'
import { Badge } from '../../components/ui/badge.jsx'
import ProfileOnboarding from './components/ProfileOnboarding.jsx'
import { triggerSuccessConfetti } from '../../components/ui/confetti.jsx'
import { ProfileTour } from '../../components/ui/profile-tour.jsx'
import {
  BarChart2,
  Bookmark,
  CircleUser,
  FileText,
  Heart,
  Menu,
  Settings as SettingsIcon,
  X,
} from 'lucide-react'

const ProfileLayout = () => {
  const { user: clerkUser } = useUser()
  const { getToken } = useClerkAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showTour, setShowTour] = useState(false)

  // Automatically fetch profile data with user auto-creation when logged in
  const {
    data: profileData,
    isLoading: profileLoading,
    error: profileError,
    isCreatingUser,
    creationError,
    isInitializing,
    wasUserJustCreated,
    needsUserCreation,
    createUserManually,
  } = useProfileWithAutoCreation()

  // Handle role selection from onboarding
  const handleRoleSelect = role => {
    createUserManually({ role })
  }

  // Trigger confetti when user profile is successfully created
  useEffect(() => {
    if (wasUserJustCreated) {
      // Small delay to ensure the success message is rendered first
      const timer = setTimeout(() => {
        triggerSuccessConfetti()
        // Show tour after confetti for new users
        setTimeout(() => {
          setShowTour(true)
        }, 2000)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [wasUserJustCreated])

  // Check if user should see tour (first time on profile)
  useEffect(() => {
    if (profileData?.success && profileData.user && !wasUserJustCreated) {
      // Check if user has completed basic profile info
      const hasBasicInfo =
        profileData.user.academic?.university &&
        profileData.user.academic?.department &&
        profileData.user.profile?.bio

      // Show tour if user hasn't completed basic info and hasn't seen tour before
      const hasSeenTour = localStorage.getItem(
        `profile-tour-${profileData.user.id}`
      )

      if (!hasBasicInfo && !hasSeenTour) {
        const timer = setTimeout(() => {
          setShowTour(true)
        }, 1000)
        return () => clearTimeout(timer)
      }
    }
  }, [profileData, wasUserJustCreated])

  const handleTourComplete = () => {
    setShowTour(false)
    if (profileData?.user?.id) {
      localStorage.setItem(`profile-tour-${profileData.user.id}`, 'completed')
    }
  }

  const handleTourSkip = () => {
    setShowTour(false)
    if (profileData?.user?.id) {
      localStorage.setItem(`profile-tour-${profileData.user.id}`, 'skipped')
    }
  }

  // Set token when component mounts
  useEffect(() => {
    const setToken = async () => {
      if (clerkUser) {
        try {
          const token = await getToken()
          setAuthToken(token)
        } catch (error) {
          console.error('Error getting token:', error)
        }
      }
    }
    setToken()
  }, [clerkUser, getToken])

  // Navigation items
  const navigationItems = [
    {
      id: 'overview',
      label: 'Overview',
      path: '/profile',
      icon: <CircleUser />,
    },
    {
      id: 'uploaded',
      label: 'My Notes',
      path: '/profile/uploaded',
      icon: <FileText size={18} />,
    },
    {
      id: 'favorites',
      label: 'Favorites',
      path: '/profile/favorites',
      icon: <Heart size={18} />,
    },
    {
      id: 'wishlist',
      label: 'Wishlist',
      path: '/profile/wishlist',
      icon: <Bookmark size={18} />,
    },
    {
      id: 'activity',
      label: 'Activity',
      path: '/profile/activity',
      icon: <BarChart2 size={18} />,
    },
    {
      id: 'settings',
      label: 'Settings',
      path: '/profile/settings',
      icon: <SettingsIcon size={18} />,
    },
  ]

  const isActivePath = path => {
    if (path === '/profile') {
      return location.pathname === '/profile'
    }
    return location.pathname.startsWith(path)
  }

  // Loading state
  if (isInitializing) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50 px-4'>
        <div className='text-center max-w-md mx-auto p-4 sm:p-6'>
          <div className='animate-spin rounded-full h-10 sm:h-12 w-10 sm:w-12 border-b-2 border-blue-600 mx-auto mb-3 sm:mb-4'></div>
          {isCreatingUser ? (
            <>
              <p className='text-gray-600 mb-2 text-sm sm:text-base'>
                Setting up your profile...
              </p>
              <p className='text-xs sm:text-sm text-gray-500'>
                This will only take a moment
              </p>
            </>
          ) : (
            <p className='text-gray-600 text-sm sm:text-base'>
              Loading your profile...
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <SignedIn>
        {/* Show onboarding for new users or users needing profile creation */}
        {needsUserCreation ||
        (profileError && profileError.message?.includes('User not found')) ? (
          <ProfileOnboarding
            onRoleSelect={handleRoleSelect}
            isLoading={isCreatingUser}
            error={creationError}
          />
        ) : profileError || creationError ? (
          <div className='min-h-screen flex items-center justify-center px-4'>
            <Card className='max-w-md w-full mx-auto'>
              <CardHeader className='text-center pb-4 sm:pb-6'>
                <CardTitle className='text-xl sm:text-2xl text-gray-900'>
                  Something went wrong
                </CardTitle>
              </CardHeader>
              <CardContent className='text-center space-y-4 pt-0'>
                <p className='text-red-600 text-sm sm:text-base'>
                  {creationError?.message || profileError?.message}
                </p>
                <div className='space-y-2'>
                  <Button
                    onClick={() => window.location.reload()}
                    className='w-full'
                  >
                    Try Again
                  </Button>
                  <Button asChild variant='outline' className='w-full'>
                    <Link to='/'>Go to Home</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className='max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8'>
            {/* Success notification for new users */}
            {wasUserJustCreated && (
              <Card className='mb-6 border-green-200 bg-gradient-to-r from-green-50 to-blue-50 shadow-lg animate-in slide-in-from-top duration-500'>
                <CardContent className='pt-6'>
                  <div className='flex items-center'>
                    <div className='flex-shrink-0'>
                      <span className='text-2xl animate-bounce'>🎉</span>
                    </div>
                    <div className='ml-3 flex-1'>
                      <h3 className='text-lg font-bold text-green-800 mb-1'>
                        Welcome to Notes-Do! 🎊
                      </h3>
                      <p className='text-sm text-green-700'>
                        Your profile has been created successfully! You can now
                        upload notes, build your wishlist, and connect with
                        other students. Let's get started! 🚀
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tour trigger for existing users */}
            {profileData?.success && !wasUserJustCreated && (
              <div className=' flex justify-end'>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => setShowTour(true)}
                  className='text-gray-500 hover:text-gray-700'
                >
                  <span className='text-sm'>Need help?</span>
                </Button>
              </div>
            )}

            {/* Profile Header */}
            {profileData?.success && (
              <Card className='mb-4 sm:mb-6 lg:mb-8'>
                <CardContent className='p-4 sm:p-6'>
                  {/* Mobile and Tablet Layout */}
                  <div className='flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6'>
                    <Avatar className='h-16 w-16 sm:h-20 sm:w-20 mx-auto sm:mx-0'>
                      <AvatarImage
                        src={
                          profileData.user.profile.avatar ||
                          '/default-avatar.png'
                        }
                        alt={profileData.user.profile.fullName}
                      />
                      <AvatarFallback>
                        {profileData.user.profile.fullName
                          .split(' ')
                          .map(n => n[0])
                          .join('')
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className='text-center sm:text-left flex-1'>
                      <h1 className='text-2xl sm:text-3xl font-bold text-gray-900'>
                        {profileData.user.profile.fullName}
                      </h1>
                      <p className='text-gray-600 mb-2'>
                        @{profileData.user.username}
                      </p>
                      <div className='flex flex-wrap gap-2 justify-center sm:justify-start'>
                        <Badge
                          variant='secondary'
                          className='text-xs sm:text-sm'
                        >
                          {profileData.user.academic.university}
                        </Badge>
                        <Badge variant='outline' className='text-xs sm:text-sm'>
                          {profileData.user.academic.department}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Stats - Responsive Grid */}
                  <div className='grid grid-cols-3 gap-3 sm:gap-6 mt-4 sm:mt-6 pt-4 border-t'>
                    <div className='text-center'>
                      <div className='text-lg sm:text-2xl font-bold text-blue-600'>
                        {profileData.user.activity.totalUploads || 0}
                      </div>
                      <div className='text-xs sm:text-sm text-gray-500'>
                        Notes
                      </div>
                    </div>
                    <div className='text-center'>
                      <div className='text-lg sm:text-2xl font-bold text-green-600'>
                        {profileData.user.activity.totalFollowers || 0}
                      </div>
                      <div className='text-xs sm:text-sm text-gray-500'>
                        Followers
                      </div>
                    </div>
                    <div className='text-center'>
                      <div className='text-lg sm:text-2xl font-bold text-purple-600'>
                        {profileData.user.activity.totalFollowing || 0}
                      </div>
                      <div className='text-xs sm:text-sm text-gray-500'>
                        Following
                      </div>
                    </div>
                  </div>

                  {profileData.user.profile.bio && (
                    <p className='text-gray-700 mt-4 text-sm sm:text-base text-center sm:text-left'>
                      {profileData.user.profile.bio}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Mobile Menu Button */}
            <div className='lg:hidden mb-4'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className='flex items-center gap-2'
              >
                {sidebarOpen ? (
                  <X className='h-4 w-4' />
                ) : (
                  <Menu className='h-4 w-4' />
                )}
                {sidebarOpen ? 'Close Menu' : 'Open Menu'}
              </Button>
            </div>

            <div className='flex flex-col lg:flex-row gap-4 lg:gap-8'>
              {/* Sidebar Navigation */}
              <div
                className={`
                ${sidebarOpen ? 'block' : 'hidden'} lg:block 
                w-full lg:w-64 lg:flex-shrink-0
              `}
              >
                <Card>
                  <CardContent className='p-3 sm:p-4'>
                    <nav className='space-y-1 sm:space-y-2'>
                      {navigationItems.map(item => (
                        <Button
                          key={item.id}
                          asChild
                          variant={
                            isActivePath(item.path) ? 'default' : 'ghost'
                          }
                          className='w-full justify-start text-sm sm:text-base'
                          onClick={() => setSidebarOpen(false)} // Close sidebar on mobile when item is clicked
                          data-tour={item.id}
                        >
                          <Link
                            to={item.path}
                            className='flex items-center space-x-2 sm:space-x-3'
                          >
                            <span className='text-base sm:text-lg'>
                              {item.icon}
                            </span>
                            <span>{item.label}</span>
                          </Link>
                        </Button>
                      ))}
                    </nav>
                  </CardContent>
                </Card>
              </div>

              {/* Main Content Area - This is where the Outlet will render */}
              <div className='flex-1 min-w-0'>
                <Outlet />
              </div>
            </div>
          </div>
        )}
      </SignedIn>

      <SignedOut>
        <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-100 px-4'>
          <Card className='max-w-md w-full mx-auto'>
            <CardHeader className='text-center pb-4 sm:pb-6'>
              <CardTitle className='text-3xl sm:text-4xl font-bold text-gray-900'>
                Profile
              </CardTitle>
            </CardHeader>
            <CardContent className='text-center pt-0'>
              <p className='text-base sm:text-lg text-gray-600 mb-4 sm:mb-6'>
                Please sign in to view your profile
              </p>
              <SignInButton mode='modal'>
                <Button size='lg' className='w-full sm:w-auto'>
                  Sign In
                </Button>
              </SignInButton>
            </CardContent>
          </Card>
        </div>
      </SignedOut>

      {/* Profile Tour */}
      <ProfileTour
        isActive={showTour}
        onComplete={handleTourComplete}
        onSkip={handleTourSkip}
      />
    </div>
  )
}

export default ProfileLayout
