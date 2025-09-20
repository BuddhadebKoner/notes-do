import React from 'react'
import {
  SignedIn,
  SignedOut,
  UserButton,
  SignInButton,
} from '@clerk/clerk-react'
import { useAuthStatus, useCurrentUser } from '../../hooks/useAuth.js'

const ProfilePage = () => {
  const { data: authStatus, isLoading: authLoading } = useAuthStatus()
  const { data: currentUser, isLoading: userLoading } = useCurrentUser()

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-100'>
      <div className='text-center p-8 bg-white rounded-lg shadow-lg max-w-md w-full'>
        <h1 className='text-4xl font-bold text-gray-900 mb-6'>Profile Page</h1>

        <SignedIn>
          <div className='space-y-6'>
            <p className='text-lg text-gray-600'>Welcome to your profile!</p>

            {/* Display API Status */}
            <div className='bg-gray-50 p-4 rounded-lg'>
              <h3 className='font-semibold text-gray-800 mb-2'>API Connection Status</h3>
              {authLoading ? (
                <p className='text-blue-600'>Checking connection...</p>
              ) : authStatus?.success ? (
                <p className='text-green-600'>✅ Connected to backend</p>
              ) : (
                <p className='text-red-600'>❌ Backend connection failed</p>
              )}
            </div>

            {/* Display User Info from API */}
            {currentUser?.success && (
              <div className='bg-blue-50 p-4 rounded-lg'>
                <h3 className='font-semibold text-gray-800 mb-2'>User Info from API</h3>
                <div className='text-left text-sm text-gray-600'>
                  <p><strong>ID:</strong> {currentUser.user?.id}</p>
                  <p><strong>Email:</strong> {currentUser.user?.email}</p>
                  <p><strong>Name:</strong> {currentUser.user?.firstName} {currentUser.user?.lastName}</p>
                </div>
              </div>
            )}

            <UserButton
              appearance={{
                elements: {
                  avatarBox: 'h-16 w-16',
                },
              }}
            />
          </div>
        </SignedIn>

        <SignedOut>
          <div className='space-y-4'>
            <p className='text-lg text-gray-600'>
              Please sign in to view your profile
            </p>
            <SignInButton mode='modal'>
              <button className='bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg'>
                Sign In
              </button>
            </SignInButton>
          </div>
        </SignedOut>
      </div>
    </div>
  )
}

export default ProfilePage
