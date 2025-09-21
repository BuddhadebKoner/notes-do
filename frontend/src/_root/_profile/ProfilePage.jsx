import React, { useEffect } from 'react'
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import {
  SignedIn,
  SignedOut,
  SignInButton,
  useUser,
  useAuth as useClerkAuth,
} from '@clerk/clerk-react'
import { useProfileWithAutoCreation } from '../../lib/react-query/queriesAndMutation.js'
import { setAuthToken } from '../../config/api.js'
import ProfileOverview from './components/ProfileOverview'
import UploadedNotes from './components/UploadedNotes'
import Wishlist from './components/Wishlist'
import Favorites from './components/Favorites'
import Activity from './components/Activity'
import Settings from './components/Settings'

const ProfilePage = () => {
  const { user: clerkUser } = useUser()
  const { getToken } = useClerkAuth()
  const location = useLocation()

  // Automatically fetch profile data with user auto-creation when logged in
  const {
    data: profileData,
    isLoading: profileLoading,
    error: profileError,
    isCreatingUser,
    creationError,
    isInitializing,
    wasUserJustCreated
  } = useProfileWithAutoCreation()

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
    { id: 'overview', label: 'Overview', path: '/profile', icon: '👤' },
    { id: 'uploaded', label: 'My Notes', path: '/profile/uploaded', icon: '📄' },
    { id: 'favorites', label: 'Favorites', path: '/profile/favorites', icon: '❤️' },
    { id: 'wishlist', label: 'Wishlist', path: '/profile/wishlist', icon: '🔖' },
    { id: 'activity', label: 'Activity', path: '/profile/activity', icon: '📊' },
    { id: 'settings', label: 'Settings', path: '/profile/settings', icon: '⚙️' }
  ]

  const isActivePath = (path) => {
    if (path === '/profile') {
      return location.pathname === '/profile'
    }
    return location.pathname.startsWith(path)
  }

  if (isInitializing) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='text-center max-w-md mx-auto p-6'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
          {isCreatingUser ? (
            <>
              <p className='text-gray-600 mb-2'>Setting up your profile...</p>
              <p className='text-sm text-gray-500'>This will only take a moment</p>
            </>
          ) : (
            <p className='text-gray-600'>Loading your profile...</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <SignedIn>
        {(profileError || creationError) ? (
          <div className='min-h-screen flex items-center justify-center'>
            <div className='text-center p-8 bg-white rounded-lg shadow-lg max-w-md w-full'>
              <h2 className='text-2xl font-bold text-gray-900 mb-4'>
                {creationError ? 'Profile Setup Error' : 'Profile Error'}
              </h2>
              <p className='text-red-600 mb-4'>
                {creationError?.message || profileError?.message}
              </p>
              {creationError && (
                <p className='text-sm text-gray-600 mb-4'>
                  We encountered an issue setting up your profile. Please try refreshing the page or contact support if the problem persists.
                </p>
              )}
              <div className='space-y-2'>
                <button
                  onClick={() => window.location.reload()}
                  className='block w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors'
                >
                  Try Again
                </button>
                <Link
                  to='/'
                  className='block w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors'
                >
                  Go to Home
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
            {/* Success notification for new users */}
            {wasUserJustCreated && (
              <div className='bg-green-50 border border-green-200 rounded-lg p-4 mb-6'>
                <div className='flex items-center'>
                  <div className='flex-shrink-0'>
                    <span className='text-green-600 text-xl'>✅</span>
                  </div>
                  <div className='ml-3'>
                    <h3 className='text-sm font-medium text-green-800'>
                      Welcome to Notes-Do!
                    </h3>
                    <p className='text-sm text-green-700 mt-1'>
                      Your profile has been created successfully. You can now upload notes, build your wishlist, and connect with other students.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Profile Header */}
            {profileData?.success && (
              <div className='bg-white rounded-lg shadow-lg p-6 mb-8'>
                <div className='flex items-center space-x-6'>
                  <img
                    src={profileData.user.profile.avatar || '/default-avatar.png'}
                    alt={profileData.user.profile.fullName}
                    className='h-20 w-20 rounded-full object-cover'
                  />
                  <div>
                    <h1 className='text-3xl font-bold text-gray-900'>
                      {profileData.user.profile.fullName}
                    </h1>
                    <p className='text-gray-600'>@{profileData.user.username}</p>
                    <p className='text-sm text-gray-500'>
                      {profileData.user.academic.university} • {profileData.user.academic.department}
                    </p>
                  </div>
                  <div className='flex-1'></div>
                  <div className='flex space-x-6 text-center'>
                    <div>
                      <div className='text-2xl font-bold text-blue-600'>{profileData.user.activity.totalUploads}</div>
                      <div className='text-sm text-gray-500'>Notes</div>
                    </div>
                    <div>
                      <div className='text-2xl font-bold text-green-600'>{profileData.user.activity.followers.length}</div>
                      <div className='text-sm text-gray-500'>Followers</div>
                    </div>
                    <div>
                      <div className='text-2xl font-bold text-purple-600'>{profileData.user.activity.following.length}</div>
                      <div className='text-sm text-gray-500'>Following</div>
                    </div>
                  </div>
                </div>
                {profileData.user.profile.bio && (
                  <p className='text-gray-700 mt-4'>{profileData.user.profile.bio}</p>
                )}
              </div>
            )}

            <div className='flex gap-8'>
              {/* Sidebar Navigation */}
              <div className='w-64 flex-shrink-0'>
                <nav className='bg-white rounded-lg shadow-lg p-4'>
                  <div className='space-y-2'>
                    {navigationItems.map((item) => (
                      <Link
                        key={item.id}
                        to={item.path}
                        className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActivePath(item.path)
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100'
                          }`}
                      >
                        <span className='text-lg'>{item.icon}</span>
                        <span>{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </nav>
              </div>

              {/* Main Content */}
              <div className='flex-1'>
                <Routes>
                  <Route path='/' element={<ProfileOverview />} />
                  <Route path='/uploaded' element={<UploadedNotes />} />
                  <Route path='/favorites' element={<Favorites />} />
                  <Route path='/wishlist' element={<Wishlist />} />
                  <Route path='/activity' element={<Activity />} />
                  <Route path='/settings' element={<Settings />} />
                  <Route path='*' element={<Navigate to='/profile' replace />} />
                </Routes>
              </div>
            </div>
          </div>
        )}
      </SignedIn>

      <SignedOut>
        <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-100'>
          <div className='text-center p-8 bg-white rounded-lg shadow-lg max-w-md w-full'>
            <h1 className='text-4xl font-bold text-gray-900 mb-6'>Profile</h1>
            <p className='text-lg text-gray-600 mb-6'>
              Please sign in to view your profile
            </p>
            <SignInButton mode='modal'>
              <button className='bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg'>
                Sign In
              </button>
            </SignInButton>
          </div>
        </div>
      </SignedOut>
    </div>
  )
}

export default ProfilePage
